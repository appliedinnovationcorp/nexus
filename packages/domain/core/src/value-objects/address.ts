// Address Value Object

export class Address {
  constructor(
    public readonly street: string,
    public readonly city: string,
    public readonly state: string,
    public readonly postalCode: string,
    public readonly country: string
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.street?.trim()) throw new Error('Street is required');
    if (!this.city?.trim()) throw new Error('City is required');
    if (!this.state?.trim()) throw new Error('State is required');
    if (!this.postalCode?.trim()) throw new Error('Postal code is required');
    if (!this.country?.trim()) throw new Error('Country is required');
  }

  public equals(other: Address): boolean {
    return (
      this.street === other.street &&
      this.city === other.city &&
      this.state === other.state &&
      this.postalCode === other.postalCode &&
      this.country === other.country
    );
  }

  public toString(): string {
    return `${this.street}, ${this.city}, ${this.state} ${this.postalCode}, ${this.country}`;
  }

  public toPlainObject(): {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  } {
    return {
      street: this.street,
      city: this.city,
      state: this.state,
      postalCode: this.postalCode,
      country: this.country
    };
  }

  public static fromPlainObject(obj: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  }): Address {
    return new Address(obj.street, obj.city, obj.state, obj.postalCode, obj.country);
  }
}
