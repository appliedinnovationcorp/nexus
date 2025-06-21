// Product Aggregate - Catalog Management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { Money } from '../value-objects/money';

// Import events from events module
import type { 
  ProductCreatedEvent, 
  ProductPriceChangedEvent, 
  ProductStockAdjustedEvent, 
  ProductStockReservedEvent, 
  ProductDeactivatedEvent 
} from '../events';

export class ProductAggregate extends AggregateRoot {
  private _name: string;
  private _description: string;
  private _price: Money;
  private _stockQuantity: number;
  private _isActive: boolean;
  private _categoryId: string;
  private _sku: string;

  private constructor(
    id: string,
    name: string,
    description: string,
    price: Money,
    stockQuantity: number,
    categoryId: string,
    sku: string,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._description = description;
    this._price = price;
    this._stockQuantity = stockQuantity;
    this._categoryId = categoryId;
    this._sku = sku;
    this._isActive = true;
  }

  public static create(
    id: string,
    name: string,
    description: string,
    price: Money,
    stockQuantity: number,
    categoryId: string,
    sku: string
  ): ProductAggregate {
    const product = new ProductAggregate(id, name, description, price, stockQuantity, categoryId, sku);
    
    product.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProductCreated',
      aggregateId: id,
      aggregateVersion: 1,
      productId: id,
      name,
      description,
      price: price.amount,
      stockQuantity,
      categoryId,
      sku
    } as ProductCreatedEvent);

    return product;
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get price(): Money { return this._price; }
  get stockQuantity(): number { return this._stockQuantity; }
  get isActive(): boolean { return this._isActive; }
  get categoryId(): string { return this._categoryId; }
  get sku(): string { return this._sku; }

  // Business methods
  public updatePrice(newPrice: Money): void {
    if (this._price.equals(newPrice)) return;

    const oldPrice = this._price;
    this._price = newPrice;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProductPriceChanged',
      aggregateId: this.id,
      aggregateVersion: this.version + 1,
      productId: this.id,
      oldPrice: oldPrice.amount,
      newPrice: newPrice.amount
    } as ProductPriceChangedEvent);
  }

  public adjustStock(quantity: number, reason: string): void {
    const oldQuantity = this._stockQuantity;
    this._stockQuantity += quantity;

    if (this._stockQuantity < 0) {
      this._stockQuantity = oldQuantity;
      throw new Error('Insufficient stock');
    }

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProductStockAdjusted',
      aggregateId: this.id,
      aggregateVersion: this.version + 1,
      productId: this.id,
      oldQuantity,
      newQuantity: this._stockQuantity,
      adjustment: quantity,
      reason
    } as ProductStockAdjustedEvent);
  }

  public reserveStock(quantity: number): void {
    if (this._stockQuantity < quantity) {
      throw new Error('Insufficient stock to reserve');
    }

    this._stockQuantity -= quantity;

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProductStockReserved',
      aggregateId: this.id,
      aggregateVersion: this.version + 1,
      productId: this.id,
      reservedQuantity: quantity,
      remainingStock: this._stockQuantity
    } as ProductStockReservedEvent);
  }

  public deactivate(): void {
    if (!this._isActive) return;

    this._isActive = false;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProductDeactivated',
      aggregateId: this.id,
      aggregateVersion: this.version + 1,
      productId: this.id
    } as ProductDeactivatedEvent);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'ProductCreated':
        this.applyProductCreated(event as ProductCreatedEvent);
        break;
      case 'ProductPriceChanged':
        this.applyProductPriceChanged(event as ProductPriceChangedEvent);
        break;
      case 'ProductStockAdjusted':
        this.applyProductStockAdjusted(event as ProductStockAdjustedEvent);
        break;
      case 'ProductStockReserved':
        this.applyProductStockReserved(event as ProductStockReservedEvent);
        break;
      case 'ProductDeactivated':
        this.applyProductDeactivated(event as ProductDeactivatedEvent);
        break;
    }
  }

  private applyProductCreated(event: ProductCreatedEvent): void {
    this._name = event.name;
    this._description = event.description;
    this._price = new Money(event.price, 'USD'); // Assuming USD as default currency
    this._stockQuantity = event.stockQuantity;
    this._categoryId = event.categoryId;
    this._sku = event.sku;
    this._isActive = true;
  }

  private applyProductPriceChanged(event: ProductPriceChangedEvent): void {
    this._price = new Money(event.newPrice, 'USD'); // Assuming USD as default currency
  }

  private applyProductStockAdjusted(event: ProductStockAdjustedEvent): void {
    this._stockQuantity = event.newQuantity;
  }

  private applyProductStockReserved(event: ProductStockReservedEvent): void {
    this._stockQuantity = event.remainingStock;
  }

  private applyProductDeactivated(event: ProductDeactivatedEvent): void {
    this._isActive = false;
  }
}
