// Account Type Value Object

export class AccountType {
  private static readonly VALID_TYPES = ['client', 'partner', 'internal', 'developer'] as const;
  private readonly _value: typeof AccountType.VALID_TYPES[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof AccountType.VALID_TYPES[number];
    
    if (!AccountType.VALID_TYPES.includes(normalizedValue)) {
      throw new Error(`Invalid account type: ${value}. Valid types are: ${AccountType.VALID_TYPES.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static client(): AccountType {
    return new AccountType('client');
  }

  public static partner(): AccountType {
    return new AccountType('partner');
  }

  public static internal(): AccountType {
    return new AccountType('internal');
  }

  public static developer(): AccountType {
    return new AccountType('developer');
  }

  public isClient(): boolean {
    return this._value === 'client';
  }

  public isPartner(): boolean {
    return this._value === 'partner';
  }

  public isInternal(): boolean {
    return this._value === 'internal';
  }

  public isDeveloper(): boolean {
    return this._value === 'developer';
  }

  public equals(other: AccountType): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
