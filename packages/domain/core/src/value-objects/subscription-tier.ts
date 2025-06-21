// Subscription Tier Value Object

export class SubscriptionTier {
  private static readonly VALID_TIERS = ['free', 'basic', 'professional', 'enterprise'] as const;
  private readonly _value: typeof SubscriptionTier.VALID_TIERS[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof SubscriptionTier.VALID_TIERS[number];
    
    if (!SubscriptionTier.VALID_TIERS.includes(normalizedValue)) {
      throw new Error(`Invalid subscription tier: ${value}. Valid tiers are: ${SubscriptionTier.VALID_TIERS.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static free(): SubscriptionTier {
    return new SubscriptionTier('free');
  }

  public static basic(): SubscriptionTier {
    return new SubscriptionTier('basic');
  }

  public static professional(): SubscriptionTier {
    return new SubscriptionTier('professional');
  }

  public static enterprise(): SubscriptionTier {
    return new SubscriptionTier('enterprise');
  }

  public isFree(): boolean {
    return this._value === 'free';
  }

  public isBasic(): boolean {
    return this._value === 'basic';
  }

  public isProfessional(): boolean {
    return this._value === 'professional';
  }

  public isEnterprise(): boolean {
    return this._value === 'enterprise';
  }

  public getApiLimit(): number {
    const limits = {
      'free': 1000,
      'basic': 10000,
      'professional': 100000,
      'enterprise': 1000000
    };
    return limits[this._value];
  }

  public getMaxUsers(): number {
    const limits = {
      'free': 3,
      'basic': 10,
      'professional': 50,
      'enterprise': 1000
    };
    return limits[this._value];
  }

  public canUpgradeTo(newTier: SubscriptionTier): boolean {
    const hierarchy = { free: 1, basic: 2, professional: 3, enterprise: 4 };
    return hierarchy[newTier._value] > hierarchy[this._value];
  }

  public equals(other: SubscriptionTier): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
