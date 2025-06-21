// Invoice Status Value Object

export class InvoiceStatus {
  private static readonly VALID_STATUSES = ['draft', 'sent', 'partially-paid', 'paid', 'overdue', 'voided'] as const;
  private readonly _value: typeof InvoiceStatus.VALID_STATUSES[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof InvoiceStatus.VALID_STATUSES[number];
    
    if (!InvoiceStatus.VALID_STATUSES.includes(normalizedValue)) {
      throw new Error(`Invalid invoice status: ${value}. Valid statuses are: ${InvoiceStatus.VALID_STATUSES.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static draft(): InvoiceStatus {
    return new InvoiceStatus('draft');
  }

  public static sent(): InvoiceStatus {
    return new InvoiceStatus('sent');
  }

  public static partiallyPaid(): InvoiceStatus {
    return new InvoiceStatus('partially-paid');
  }

  public static paid(): InvoiceStatus {
    return new InvoiceStatus('paid');
  }

  public static overdue(): InvoiceStatus {
    return new InvoiceStatus('overdue');
  }

  public static voided(): InvoiceStatus {
    return new InvoiceStatus('voided');
  }

  public isDraft(): boolean {
    return this._value === 'draft';
  }

  public isSent(): boolean {
    return this._value === 'sent';
  }

  public isPartiallyPaid(): boolean {
    return this._value === 'partially-paid';
  }

  public isPaid(): boolean {
    return this._value === 'paid';
  }

  public isOverdue(): boolean {
    return this._value === 'overdue';
  }

  public isVoided(): boolean {
    return this._value === 'voided';
  }

  public canEdit(): boolean {
    return this._value === 'draft';
  }

  public canSend(): boolean {
    return this._value === 'draft';
  }

  public canReceivePayment(): boolean {
    return ['sent', 'partially-paid', 'overdue'].includes(this._value);
  }

  public canVoid(): boolean {
    return !this.isPaid();
  }

  public equals(other: InvoiceStatus): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
