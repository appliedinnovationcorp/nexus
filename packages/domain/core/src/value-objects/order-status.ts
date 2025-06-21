// Order Status Value Object

export class OrderStatus {
  private static readonly VALID_STATUSES = ['draft', 'placed', 'shipped', 'delivered', 'cancelled'] as const;
  private readonly _value: typeof OrderStatus.VALID_STATUSES[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof OrderStatus.VALID_STATUSES[number];
    
    if (!OrderStatus.VALID_STATUSES.includes(normalizedValue)) {
      throw new Error(`Invalid order status: ${value}. Valid statuses are: ${OrderStatus.VALID_STATUSES.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static draft(): OrderStatus {
    return new OrderStatus('draft');
  }

  public static placed(): OrderStatus {
    return new OrderStatus('placed');
  }

  public static shipped(): OrderStatus {
    return new OrderStatus('shipped');
  }

  public static delivered(): OrderStatus {
    return new OrderStatus('delivered');
  }

  public static cancelled(): OrderStatus {
    return new OrderStatus('cancelled');
  }

  public isDraft(): boolean {
    return this._value === 'draft';
  }

  public isPlaced(): boolean {
    return this._value === 'placed';
  }

  public isShipped(): boolean {
    return this._value === 'shipped';
  }

  public isDelivered(): boolean {
    return this._value === 'delivered';
  }

  public isCancelled(): boolean {
    return this._value === 'cancelled';
  }

  public canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<string, string[]> = {
      draft: ['placed', 'cancelled'],
      placed: ['shipped', 'cancelled'],
      shipped: ['delivered', 'cancelled'],
      delivered: [],
      cancelled: []
    };

    return transitions[this._value]?.includes(newStatus._value) ?? false;
  }

  public equals(other: OrderStatus): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
