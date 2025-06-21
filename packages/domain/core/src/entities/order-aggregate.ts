// Order Aggregate - Business Transaction Management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { Money } from '../value-objects/money';
import { OrderStatus } from '../value-objects/order-status';
import { Address } from '../value-objects/address';

export interface OrderItem {
  readonly productId: string;
  readonly productName: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly totalPrice: Money;
}

export class OrderAggregate extends AggregateRoot {
  private _customerId: string;
  private _items: OrderItem[] = [];
  private _status: OrderStatus;
  private _shippingAddress: Address;
  private _billingAddress: Address;
  private _totalAmount: Money;
  private _placedAt?: Date;
  private _shippedAt?: Date;
  private _deliveredAt?: Date;
  private _cancelledAt?: Date;

  private constructor(
    id: string,
    customerId: string,
    shippingAddress: Address,
    billingAddress: Address,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._customerId = customerId;
    this._shippingAddress = shippingAddress;
    this._billingAddress = billingAddress;
    this._status = OrderStatus.draft();
    this._totalAmount = Money.zero('USD');
  }

  public static create(
    id: string,
    customerId: string,
    shippingAddress: Address,
    billingAddress: Address
  ): OrderAggregate {
    const order = new OrderAggregate(id, customerId, shippingAddress, billingAddress);
    
    order.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrderCreated',
      aggregateId: id,
      aggregateVersion: order.version,
      customerId,
      shippingAddress: shippingAddress.toPlainObject(),
      billingAddress: billingAddress.toPlainObject()
    } as OrderCreatedEvent);

    return order;
  }

  // Getters
  get customerId(): string { return this._customerId; }
  get items(): OrderItem[] { return [...this._items]; }
  get status(): OrderStatus { return this._status; }
  get totalAmount(): Money { return this._totalAmount; }
  get shippingAddress(): Address { return this._shippingAddress; }

  // Business methods
  public addItem(productId: string, productName: string, quantity: number, unitPrice: Money): void {
    if (!this._status.isDraft()) {
      throw new Error('Cannot add items to a non-draft order');
    }

    const existingItemIndex = this._items.findIndex(item => item.productId === productId);
    const totalPrice = unitPrice.multiply(quantity);

    if (existingItemIndex >= 0) {
      // Update existing item
      const existingItem = this._items[existingItemIndex];
      if (!existingItem) {
        throw new Error('Existing item not found');
      }
      
      const newQuantity = existingItem.quantity + quantity;
      const newTotalPrice = unitPrice.multiply(newQuantity);
      
      this._items[existingItemIndex] = {
        productId: existingItem.productId,
        productName: existingItem.productName,
        unitPrice: existingItem.unitPrice,
        quantity: newQuantity,
        totalPrice: newTotalPrice
      };
    } else {
      // Add new item
      const newItem: OrderItem = {
        productId,
        productName,
        quantity,
        unitPrice,
        totalPrice
      };
      this._items.push(newItem);
    }

    this.recalculateTotal();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrderItemAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      productId,
      productName,
      quantity,
      unitPrice: unitPrice.toPlainObject(),
      totalAmount: this._totalAmount.toPlainObject()
    } as OrderItemAddedEvent);
  }

  public removeItem(productId: string): void {
    if (!this._status.isDraft()) {
      throw new Error('Cannot remove items from a non-draft order');
    }

    const itemIndex = this._items.findIndex(item => item.productId === productId);
    if (itemIndex === -1) return;

    this._items.splice(itemIndex, 1);
    this.recalculateTotal();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrderItemRemoved',
      aggregateId: this.id,
      aggregateVersion: this.version,
      productId,
      totalAmount: this._totalAmount.toPlainObject()
    } as OrderItemRemovedEvent);
  }

  public place(): void {
    if (!this._status.isDraft()) {
      throw new Error('Order is not in draft status');
    }
    if (this._items.length === 0) {
      throw new Error('Cannot place an empty order');
    }

    this._status = OrderStatus.placed();
    this._placedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrderPlaced',
      aggregateId: this.id,
      aggregateVersion: this.version,
      customerId: this._customerId,
      totalAmount: this._totalAmount.toPlainObject(),
      itemCount: this._items.length,
      placedAt: this._placedAt
    } as OrderPlacedEvent);
  }

  public ship(): void {
    if (!this._status.isPlaced()) {
      throw new Error('Order must be placed before shipping');
    }

    this._status = OrderStatus.shipped();
    this._shippedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrderShipped',
      aggregateId: this.id,
      aggregateVersion: this.version,
      shippedAt: this._shippedAt,
      shippingAddress: this._shippingAddress.toPlainObject()
    } as OrderShippedEvent);
  }

  public deliver(): void {
    if (!this._status.isShipped()) {
      throw new Error('Order must be shipped before delivery');
    }

    this._status = OrderStatus.delivered();
    this._deliveredAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrderDelivered',
      aggregateId: this.id,
      aggregateVersion: this.version,
      deliveredAt: this._deliveredAt
    } as OrderDeliveredEvent);
  }

  public cancel(): void {
    if (this._status.isDelivered()) {
      throw new Error('Cannot cancel a delivered order');
    }

    this._status = OrderStatus.cancelled();
    this._cancelledAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrderCancelled',
      aggregateId: this.id,
      aggregateVersion: this.version,
      cancelledAt: this._cancelledAt
    } as OrderCancelledEvent);
  }

  private recalculateTotal(): void {
    this._totalAmount = this._items.reduce(
      (total, item) => total.add(item.totalPrice),
      Money.zero(this._totalAmount.currency)
    );
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrderCreated':
        this.applyOrderCreated(event as OrderCreatedEvent);
        break;
      case 'OrderItemAdded':
        this.applyOrderItemAdded(event as OrderItemAddedEvent);
        break;
      case 'OrderItemRemoved':
        this.applyOrderItemRemoved(event as OrderItemRemovedEvent);
        break;
      case 'OrderPlaced':
        this.applyOrderPlaced(event as OrderPlacedEvent);
        break;
      case 'OrderShipped':
        this.applyOrderShipped(event as OrderShippedEvent);
        break;
      case 'OrderDelivered':
        this.applyOrderDelivered(event as OrderDeliveredEvent);
        break;
      case 'OrderCancelled':
        this.applyOrderCancelled(event as OrderCancelledEvent);
        break;
    }
  }

  private applyOrderCreated(event: OrderCreatedEvent): void {
    this._customerId = event.customerId;
    this._shippingAddress = Address.fromPlainObject(event.shippingAddress);
    this._billingAddress = Address.fromPlainObject(event.billingAddress);
    this._status = OrderStatus.draft();
  }

  private applyOrderItemAdded(event: OrderItemAddedEvent): void {
    // Reconstruct the item from event data
    const unitPrice = Money.fromPlainObject(event.unitPrice);
    const totalPrice = unitPrice.multiply(event.quantity);
    
    const existingItemIndex = this._items.findIndex(item => item.productId === event.productId);
    if (existingItemIndex >= 0) {
      const existingItem = this._items[existingItemIndex];
      if (!existingItem) {
        throw new Error('Existing item not found during event replay');
      }
      
      this._items[existingItemIndex] = {
        productId: existingItem.productId,
        productName: existingItem.productName,
        unitPrice: existingItem.unitPrice,
        quantity: existingItem.quantity + event.quantity,
        totalPrice: existingItem.totalPrice.add(totalPrice)
      };
    } else {
      const newItem: OrderItem = {
        productId: event.productId,
        productName: event.productName,
        quantity: event.quantity,
        unitPrice,
        totalPrice
      };
      this._items.push(newItem);
    }
    this._totalAmount = Money.fromPlainObject(event.totalAmount);
  }

  private applyOrderItemRemoved(event: OrderItemRemovedEvent): void {
    this._items = this._items.filter(item => item.productId !== event.productId);
    this._totalAmount = Money.fromPlainObject(event.totalAmount);
  }

  private applyOrderPlaced(event: OrderPlacedEvent): void {
    this._status = OrderStatus.placed();
    this._placedAt = event.placedAt;
  }

  private applyOrderShipped(event: OrderShippedEvent): void {
    this._status = OrderStatus.shipped();
    this._shippedAt = event.shippedAt;
  }

  private applyOrderDelivered(event: OrderDeliveredEvent): void {
    this._status = OrderStatus.delivered();
    this._deliveredAt = event.deliveredAt;
  }

  private applyOrderCancelled(event: OrderCancelledEvent): void {
    this._status = OrderStatus.cancelled();
    this._cancelledAt = event.cancelledAt;
  }
}

// Domain Events
export interface OrderCreatedEvent extends DomainEvent {
  eventType: 'OrderCreated';
  customerId: string;
  shippingAddress: any;
  billingAddress: any;
}

export interface OrderItemAddedEvent extends DomainEvent {
  eventType: 'OrderItemAdded';
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: any;
  totalAmount: any;
}

export interface OrderItemRemovedEvent extends DomainEvent {
  eventType: 'OrderItemRemoved';
  productId: string;
  totalAmount: any;
}

export interface OrderPlacedEvent extends DomainEvent {
  eventType: 'OrderPlaced';
  customerId: string;
  totalAmount: any;
  itemCount: number;
  placedAt: Date;
}

export interface OrderShippedEvent extends DomainEvent {
  eventType: 'OrderShipped';
  shippedAt: Date;
  shippingAddress: any;
}

export interface OrderDeliveredEvent extends DomainEvent {
  eventType: 'OrderDelivered';
  deliveredAt: Date;
}

export interface OrderCancelledEvent extends DomainEvent {
  eventType: 'OrderCancelled';
  cancelledAt: Date;
}
