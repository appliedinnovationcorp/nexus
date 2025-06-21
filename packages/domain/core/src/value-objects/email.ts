// Email Value Object

export class Email {
  private readonly _value: string;

  constructor(value: string) {
    if (!this.isValid(value)) {
      throw new Error(`Invalid email format: ${value}`);
    }
    this._value = value.toLowerCase().trim();
  }

  get value(): string {
    return this._value;
  }

  private isValid(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  public equals(other: Email): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }

  public getDomain(): string {
    const parts = this._value.split('@');
    if (parts.length !== 2 || !parts[1]) {
      throw new Error('Invalid email format');
    }
    return parts[1];
  }

  public getLocalPart(): string {
    const parts = this._value.split('@');
    if (parts.length !== 2 || !parts[0]) {
      throw new Error('Invalid email format');
    }
    return parts[0];
  }
}
