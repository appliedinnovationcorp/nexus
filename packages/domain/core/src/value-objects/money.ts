// Money Value Object

export class Money {
  private readonly _amount: number;
  private readonly _currency: string;

  constructor(amount: number, currency: string) {
    if (amount < 0) {
      throw new Error('Amount cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a 3-letter code');
    }
    
    this._amount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this._currency = currency.toUpperCase();
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  public static create(amount: number, currency: string): Money {
    return new Money(amount, currency);
  }

  public static zero(currency: string): Money {
    return new Money(0, currency);
  }

  public add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this._amount + other._amount, this._currency);
  }

  public subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    if (this._amount < other._amount) {
      throw new Error('Insufficient funds');
    }
    return new Money(this._amount - other._amount, this._currency);
  }

  public multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Factor cannot be negative');
    }
    return new Money(this._amount * factor, this._currency);
  }

  public divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error('Divisor must be positive');
    }
    return new Money(this._amount / divisor, this._currency);
  }

  public equals(other: Money): boolean {
    return this._amount === other._amount && this._currency === other._currency;
  }

  public isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount > other._amount;
  }

  public isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this._amount < other._amount;
  }

  public isZero(): boolean {
    return this._amount === 0;
  }

  private ensureSameCurrency(other: Money): void {
    if (this._currency !== other._currency) {
      throw new Error(`Currency mismatch: ${this._currency} vs ${other._currency}`);
    }
  }

  public toString(): string {
    return `${this._amount.toFixed(2)} ${this._currency}`;
  }

  public toPlainObject(): { amount: number; currency: string } {
    return {
      amount: this._amount,
      currency: this._currency
    };
  }

  public static fromPlainObject(obj: { amount: number; currency: string }): Money {
    return new Money(obj.amount, obj.currency);
  }
}
