// Invoice Aggregate - Billing and Payment Management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { Money } from '../value-objects/money';
import { Address } from '../value-objects/address';
import { InvoiceStatus } from '../value-objects/invoice-status';

export interface InvoiceLineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: number;
  readonly unitPrice: Money;
  readonly totalPrice: Money;
  readonly taxRate: number;
  readonly taxAmount: Money;
  readonly projectId?: string;
  readonly serviceType: string;
}

export interface PaymentRecord {
  readonly id: string;
  readonly amount: Money;
  readonly paymentMethod: string;
  readonly transactionId: string;
  readonly paidAt: Date;
  readonly processorFee?: Money;
  readonly notes?: string;
}

export interface TaxBreakdown {
  readonly taxRate: number;
  readonly taxableAmount: Money;
  readonly taxAmount: Money;
  readonly taxType: string; // VAT, GST, Sales Tax, etc.
}

export class InvoiceAggregate extends AggregateRoot {
  private _invoiceNumber: string;
  private _clientId: string;
  private _organizationId: string;
  private _projectId?: string;
  private _status: InvoiceStatus;
  private _lineItems: InvoiceLineItem[] = [];
  private _subtotal: Money;
  private _taxBreakdown: TaxBreakdown[] = [];
  private _totalTax: Money;
  private _totalAmount: Money;
  private _billingAddress: Address;
  private _shippingAddress?: Address;
  private _issueDate: Date;
  private _dueDate: Date;
  private _paidDate?: Date;
  private _payments: PaymentRecord[] = [];
  private _notes?: string;
  private _terms: string;
  private _lateFeeRate: number = 0.015; // 1.5% per month
  private _discountAmount?: Money;
  private _discountReason?: string;

  private constructor(
    id: string,
    invoiceNumber: string,
    clientId: string,
    organizationId: string,
    billingAddress: Address,
    issueDate: Date,
    dueDate: Date,
    terms: string,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._invoiceNumber = invoiceNumber;
    this._clientId = clientId;
    this._organizationId = organizationId;
    this._billingAddress = billingAddress;
    this._issueDate = issueDate;
    this._dueDate = dueDate;
    this._terms = terms;
    this._status = InvoiceStatus.draft();
    this._subtotal = Money.zero('USD');
    this._totalTax = Money.zero('USD');
    this._totalAmount = Money.zero('USD');
  }

  public static create(
    id: string,
    invoiceNumber: string,
    clientId: string,
    organizationId: string,
    billingAddress: Address,
    issueDate: Date,
    dueDate: Date,
    terms: string,
    projectId?: string
  ): InvoiceAggregate {
    const invoice = new InvoiceAggregate(
      id, invoiceNumber, clientId, organizationId, 
      billingAddress, issueDate, dueDate, terms
    );
    
    if (projectId) invoice._projectId = projectId;

    invoice.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoiceCreated',
      aggregateId: id,
      aggregateVersion: invoice.version,
      invoiceNumber,
      clientId,
      organizationId,
      projectId,
      issueDate,
      dueDate,
      terms
    } as InvoiceCreatedEvent);

    return invoice;
  }

  // Getters
  get invoiceNumber(): string { return this._invoiceNumber; }
  get clientId(): string { return this._clientId; }
  get organizationId(): string { return this._organizationId; }
  get projectId(): string | undefined { return this._projectId; }
  get status(): InvoiceStatus { return this._status; }
  get lineItems(): InvoiceLineItem[] { return [...this._lineItems]; }
  get subtotal(): Money { return this._subtotal; }
  get totalTax(): Money { return this._totalTax; }
  get totalAmount(): Money { return this._totalAmount; }
  get dueDate(): Date { return this._dueDate; }
  get paidDate(): Date | undefined { return this._paidDate; }
  get payments(): PaymentRecord[] { return [...this._payments]; }
  get remainingBalance(): Money { 
    const totalPaid = this._payments.reduce((sum, payment) => sum.add(payment.amount), Money.zero(this._totalAmount.currency));
    return this._totalAmount.subtract(totalPaid);
  }

  // Business methods
  public addLineItem(
    id: string,
    description: string,
    quantity: number,
    unitPrice: Money,
    taxRate: number,
    serviceType: string,
    projectId?: string
  ): void {
    if (!this._status.isDraft()) {
      throw new Error('Cannot add line items to non-draft invoice');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (unitPrice.amount <= 0) {
      throw new Error('Unit price must be positive');
    }

    const totalPrice = unitPrice.multiply(quantity);
    const taxAmount = totalPrice.multiply(taxRate);

    const lineItem: InvoiceLineItem = {
      id,
      description,
      quantity,
      unitPrice,
      totalPrice,
      taxRate,
      taxAmount,
      serviceType,
      projectId
    };

    this._lineItems.push(lineItem);
    this.recalculateAmounts();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoiceLineItemAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      lineItemId: id,
      description,
      quantity,
      unitPrice: unitPrice.toPlainObject(),
      totalPrice: totalPrice.toPlainObject(),
      newSubtotal: this._subtotal.toPlainObject(),
      newTotalAmount: this._totalAmount.toPlainObject()
    } as InvoiceLineItemAddedEvent);
  }

  public removeLineItem(lineItemId: string): void {
    if (!this._status.isDraft()) {
      throw new Error('Cannot remove line items from non-draft invoice');
    }

    const itemIndex = this._lineItems.findIndex(item => item.id === lineItemId);
    if (itemIndex === -1) {
      throw new Error('Line item not found');
    }

    this._lineItems.splice(itemIndex, 1);
    this.recalculateAmounts();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoiceLineItemRemoved',
      aggregateId: this.id,
      aggregateVersion: this.version,
      lineItemId,
      newSubtotal: this._subtotal.toPlainObject(),
      newTotalAmount: this._totalAmount.toPlainObject()
    } as InvoiceLineItemRemovedEvent);
  }

  public applyDiscount(amount: Money, reason: string): void {
    if (!this._status.isDraft()) {
      throw new Error('Cannot apply discount to non-draft invoice');
    }

    if (amount.amount <= 0) {
      throw new Error('Discount amount must be positive');
    }

    if (amount.isGreaterThan(this._subtotal)) {
      throw new Error('Discount cannot exceed subtotal');
    }

    this._discountAmount = amount;
    this._discountReason = reason;
    this.recalculateAmounts();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoiceDiscountApplied',
      aggregateId: this.id,
      aggregateVersion: this.version,
      discountAmount: amount.toPlainObject(),
      reason,
      newTotalAmount: this._totalAmount.toPlainObject()
    } as InvoiceDiscountAppliedEvent);
  }

  public send(): void {
    if (!this._status.isDraft()) {
      throw new Error('Only draft invoices can be sent');
    }

    if (this._lineItems.length === 0) {
      throw new Error('Cannot send empty invoice');
    }

    this._status = InvoiceStatus.sent();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoiceSent',
      aggregateId: this.id,
      aggregateVersion: this.version,
      clientId: this._clientId,
      totalAmount: this._totalAmount.toPlainObject(),
      dueDate: this._dueDate,
      sentAt: this.updatedAt
    } as InvoiceSentEvent);
  }

  public recordPayment(
    paymentId: string,
    amount: Money,
    paymentMethod: string,
    transactionId: string,
    processorFee?: Money,
    notes?: string
  ): void {
    if (this._status.isPaid()) {
      throw new Error('Invoice is already fully paid');
    }

    if (amount.amount <= 0) {
      throw new Error('Payment amount must be positive');
    }

    const remainingBalance = this.remainingBalance;
    if (amount.isGreaterThan(remainingBalance)) {
      throw new Error('Payment amount exceeds remaining balance');
    }

    const payment: PaymentRecord = {
      id: paymentId,
      amount,
      paymentMethod,
      transactionId,
      paidAt: new Date(),
      processorFee,
      notes
    };

    this._payments.push(payment);

    // Check if fully paid
    const newRemainingBalance = this.remainingBalance;
    if (newRemainingBalance.isZero()) {
      this._status = InvoiceStatus.paid();
      this._paidDate = new Date();
    } else {
      this._status = InvoiceStatus.partiallyPaid();
    }

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoicePaymentRecorded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      paymentId,
      amount: amount.toPlainObject(),
      paymentMethod,
      transactionId,
      remainingBalance: newRemainingBalance.toPlainObject(),
      isFullyPaid: newRemainingBalance.isZero(),
      paidAt: payment.paidAt
    } as InvoicePaymentRecordedEvent);
  }

  public markOverdue(): void {
    if (this._status.isPaid()) {
      return; // Already paid
    }

    if (new Date() <= this._dueDate) {
      throw new Error('Invoice is not yet due');
    }

    this._status = InvoiceStatus.overdue();
    this.updatedAt = new Date();

    // Calculate late fee
    const daysPastDue = Math.floor((new Date().getTime() - this._dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const monthsPastDue = daysPastDue / 30;
    const lateFee = this._totalAmount.multiply(this._lateFeeRate * monthsPastDue);

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoiceMarkedOverdue',
      aggregateId: this.id,
      aggregateVersion: this.version,
      daysPastDue,
      lateFee: lateFee.toPlainObject(),
      overdueAt: this.updatedAt
    } as InvoiceMarkedOverdueEvent);
  }

  public void(reason: string): void {
    if (this._status.isPaid()) {
      throw new Error('Cannot void a paid invoice');
    }

    this._status = InvoiceStatus.voided();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InvoiceVoided',
      aggregateId: this.id,
      aggregateVersion: this.version,
      reason,
      voidedAt: this.updatedAt
    } as InvoiceVoidedEvent);
  }

  private recalculateAmounts(): void {
    // Calculate subtotal
    this._subtotal = this._lineItems.reduce(
      (sum, item) => sum.add(item.totalPrice),
      Money.zero(this._subtotal.currency)
    );

    // Apply discount
    let discountedSubtotal = this._subtotal;
    if (this._discountAmount) {
      discountedSubtotal = this._subtotal.subtract(this._discountAmount);
    }

    // Calculate tax breakdown
    this._taxBreakdown = [];
    const taxGroups = new Map<number, Money>();

    this._lineItems.forEach(item => {
      const existingTax = taxGroups.get(item.taxRate) || Money.zero(this._subtotal.currency);
      taxGroups.set(item.taxRate, existingTax.add(item.taxAmount));
    });

    taxGroups.forEach((taxAmount, taxRate) => {
      this._taxBreakdown.push({
        taxRate,
        taxableAmount: discountedSubtotal,
        taxAmount,
        taxType: 'Sales Tax' // Could be configurable
      });
    });

    // Calculate total tax
    this._totalTax = this._lineItems.reduce(
      (sum, item) => sum.add(item.taxAmount),
      Money.zero(this._subtotal.currency)
    );

    // Calculate total amount
    this._totalAmount = discountedSubtotal.add(this._totalTax);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'InvoiceCreated':
        this.applyInvoiceCreated(event as InvoiceCreatedEvent);
        break;
      case 'InvoiceLineItemAdded':
        this.applyInvoiceLineItemAdded(event as InvoiceLineItemAddedEvent);
        break;
      case 'InvoiceLineItemRemoved':
        this.applyInvoiceLineItemRemoved(event as InvoiceLineItemRemovedEvent);
        break;
      case 'InvoiceDiscountApplied':
        this.applyInvoiceDiscountApplied(event as InvoiceDiscountAppliedEvent);
        break;
      case 'InvoiceSent':
        this.applyInvoiceSent(event as InvoiceSentEvent);
        break;
      case 'InvoicePaymentRecorded':
        this.applyInvoicePaymentRecorded(event as InvoicePaymentRecordedEvent);
        break;
      case 'InvoiceMarkedOverdue':
        this.applyInvoiceMarkedOverdue(event as InvoiceMarkedOverdueEvent);
        break;
      case 'InvoiceVoided':
        this.applyInvoiceVoided(event as InvoiceVoidedEvent);
        break;
    }
  }

  private applyInvoiceCreated(event: InvoiceCreatedEvent): void {
    this._invoiceNumber = event.invoiceNumber;
    this._clientId = event.clientId;
    this._organizationId = event.organizationId;
    this._projectId = event.projectId;
    this._issueDate = event.issueDate;
    this._dueDate = event.dueDate;
    this._terms = event.terms;
    this._status = InvoiceStatus.draft();
  }

  private applyInvoiceLineItemAdded(event: InvoiceLineItemAddedEvent): void {
    this._subtotal = Money.fromPlainObject(event.newSubtotal);
    this._totalAmount = Money.fromPlainObject(event.newTotalAmount);
  }

  private applyInvoiceLineItemRemoved(event: InvoiceLineItemRemovedEvent): void {
    this._subtotal = Money.fromPlainObject(event.newSubtotal);
    this._totalAmount = Money.fromPlainObject(event.newTotalAmount);
  }

  private applyInvoiceDiscountApplied(event: InvoiceDiscountAppliedEvent): void {
    this._discountAmount = Money.fromPlainObject(event.discountAmount);
    this._discountReason = event.reason;
    this._totalAmount = Money.fromPlainObject(event.newTotalAmount);
  }

  private applyInvoiceSent(event: InvoiceSentEvent): void {
    this._status = InvoiceStatus.sent();
  }

  private applyInvoicePaymentRecorded(event: InvoicePaymentRecordedEvent): void {
    if (event.isFullyPaid) {
      this._status = InvoiceStatus.paid();
      this._paidDate = event.paidAt;
    } else {
      this._status = InvoiceStatus.partiallyPaid();
    }
  }

  private applyInvoiceMarkedOverdue(event: InvoiceMarkedOverdueEvent): void {
    this._status = InvoiceStatus.overdue();
  }

  private applyInvoiceVoided(event: InvoiceVoidedEvent): void {
    this._status = InvoiceStatus.voided();
  }
}

// Domain Events
export interface InvoiceCreatedEvent extends DomainEvent {
  eventType: 'InvoiceCreated';
  invoiceNumber: string;
  clientId: string;
  organizationId: string;
  projectId?: string;
  issueDate: Date;
  dueDate: Date;
  terms: string;
}

export interface InvoiceLineItemAddedEvent extends DomainEvent {
  eventType: 'InvoiceLineItemAdded';
  lineItemId: string;
  description: string;
  quantity: number;
  unitPrice: any;
  totalPrice: any;
  newSubtotal: any;
  newTotalAmount: any;
}

export interface InvoiceLineItemRemovedEvent extends DomainEvent {
  eventType: 'InvoiceLineItemRemoved';
  lineItemId: string;
  newSubtotal: any;
  newTotalAmount: any;
}

export interface InvoiceDiscountAppliedEvent extends DomainEvent {
  eventType: 'InvoiceDiscountApplied';
  discountAmount: any;
  reason: string;
  newTotalAmount: any;
}

export interface InvoiceSentEvent extends DomainEvent {
  eventType: 'InvoiceSent';
  clientId: string;
  totalAmount: any;
  dueDate: Date;
  sentAt: Date;
}

export interface InvoicePaymentRecordedEvent extends DomainEvent {
  eventType: 'InvoicePaymentRecorded';
  paymentId: string;
  amount: any;
  paymentMethod: string;
  transactionId: string;
  remainingBalance: any;
  isFullyPaid: boolean;
  paidAt: Date;
}

export interface InvoiceMarkedOverdueEvent extends DomainEvent {
  eventType: 'InvoiceMarkedOverdue';
  daysPastDue: number;
  lateFee: any;
  overdueAt: Date;
}

export interface InvoiceVoidedEvent extends DomainEvent {
  eventType: 'InvoiceVoided';
  reason: string;
  voidedAt: Date;
}
