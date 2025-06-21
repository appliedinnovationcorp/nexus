// Account Aggregate - Multi-tenant account management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { Email } from '../value-objects/email';
import { AccountType } from '../value-objects/account-type';
import { SubscriptionTier } from '../value-objects/subscription-tier';

export class AccountAggregate extends AggregateRoot {
  private _name: string;
  private _type: AccountType;
  private _subscriptionTier: SubscriptionTier;
  private _isActive: boolean;
  private _primaryContactEmail: Email;
  private _settings: AccountSettings;
  private _apiQuota: ApiQuota;

  private constructor(
    id: string,
    name: string,
    type: AccountType,
    primaryContactEmail: Email,
    subscriptionTier: SubscriptionTier,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._type = type;
    this._primaryContactEmail = primaryContactEmail;
    this._subscriptionTier = subscriptionTier;
    this._isActive = true;
    this._settings = AccountSettings.default();
    this._apiQuota = ApiQuota.forTier(subscriptionTier);
  }

  public static create(
    id: string,
    name: string,
    type: AccountType,
    primaryContactEmail: Email,
    subscriptionTier: SubscriptionTier
  ): AccountAggregate {
    const account = new AccountAggregate(id, name, type, primaryContactEmail, subscriptionTier);
    
    account.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AccountCreated',
      aggregateId: id,
      aggregateVersion: account.version,
      name,
      type: type.value,
      subscriptionTier: subscriptionTier.value,
      primaryContactEmail: primaryContactEmail.value
    } as AccountCreatedEvent);

    return account;
  }

  // Getters
  get name(): string { return this._name; }
  get type(): AccountType { return this._type; }
  get subscriptionTier(): SubscriptionTier { return this._subscriptionTier; }
  get isActive(): boolean { return this._isActive; }
  get primaryContactEmail(): Email { return this._primaryContactEmail; }
  get apiQuota(): ApiQuota { return this._apiQuota; }

  // Business methods
  public upgradeSubscription(newTier: SubscriptionTier): void {
    if (this._subscriptionTier.equals(newTier)) return;

    const oldTier = this._subscriptionTier;
    this._subscriptionTier = newTier;
    this._apiQuota = ApiQuota.forTier(newTier);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AccountSubscriptionUpgraded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      oldTier: oldTier.value,
      newTier: newTier.value,
      newApiQuota: this._apiQuota.toPlainObject()
    } as AccountSubscriptionUpgradedEvent);
  }

  public suspend(reason: string): void {
    if (!this._isActive) return;

    this._isActive = false;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AccountSuspended',
      aggregateId: this.id,
      aggregateVersion: this.version,
      reason
    } as AccountSuspendedEvent);
  }

  public consumeApiQuota(amount: number): void {
    if (!this._apiQuota.canConsume(amount)) {
      throw new Error('API quota exceeded');
    }

    this._apiQuota = this._apiQuota.consume(amount);

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiQuotaConsumed',
      aggregateId: this.id,
      aggregateVersion: this.version,
      consumed: amount,
      remaining: this._apiQuota.remaining
    } as ApiQuotaConsumedEvent);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'AccountCreated':
        this.applyAccountCreated(event as AccountCreatedEvent);
        break;
      case 'AccountSubscriptionUpgraded':
        this.applyAccountSubscriptionUpgraded(event as AccountSubscriptionUpgradedEvent);
        break;
      case 'AccountSuspended':
        this.applyAccountSuspended(event as AccountSuspendedEvent);
        break;
      case 'ApiQuotaConsumed':
        this.applyApiQuotaConsumed(event as ApiQuotaConsumedEvent);
        break;
    }
  }

  private applyAccountCreated(event: AccountCreatedEvent): void {
    this._name = event.name;
    this._type = new AccountType(event.type);
    this._subscriptionTier = new SubscriptionTier(event.subscriptionTier);
    this._primaryContactEmail = new Email(event.primaryContactEmail);
    this._isActive = true;
  }

  private applyAccountSubscriptionUpgraded(event: AccountSubscriptionUpgradedEvent): void {
    this._subscriptionTier = new SubscriptionTier(event.newTier);
    this._apiQuota = ApiQuota.fromPlainObject(event.newApiQuota);
  }

  private applyAccountSuspended(event: AccountSuspendedEvent): void {
    this._isActive = false;
  }

  private applyApiQuotaConsumed(event: ApiQuotaConsumedEvent): void {
    this._apiQuota = this._apiQuota.consume(event.consumed);
  }
}

// Supporting classes
export class AccountSettings {
  constructor(
    public readonly allowApiAccess: boolean = true,
    public readonly allowMobileAccess: boolean = true,
    public readonly maxUsers: number = 10,
    public readonly customBranding: boolean = false
  ) {}

  public static default(): AccountSettings {
    return new AccountSettings();
  }
}

export class ApiQuota {
  constructor(
    public readonly limit: number,
    public readonly remaining: number,
    public readonly resetDate: Date
  ) {}

  public static forTier(tier: SubscriptionTier): ApiQuota {
    const limits = {
      'free': 1000,
      'basic': 10000,
      'professional': 100000,
      'enterprise': 1000000
    };
    
    const limit = limits[tier.value as keyof typeof limits] || 1000;
    const resetDate = new Date();
    resetDate.setMonth(resetDate.getMonth() + 1);
    
    return new ApiQuota(limit, limit, resetDate);
  }

  public canConsume(amount: number): boolean {
    return this.remaining >= amount;
  }

  public consume(amount: number): ApiQuota {
    return new ApiQuota(this.limit, this.remaining - amount, this.resetDate);
  }

  public toPlainObject(): { limit: number; remaining: number; resetDate: Date } {
    return {
      limit: this.limit,
      remaining: this.remaining,
      resetDate: this.resetDate
    };
  }

  public static fromPlainObject(obj: { limit: number; remaining: number; resetDate: Date }): ApiQuota {
    return new ApiQuota(obj.limit, obj.remaining, obj.resetDate);
  }
}

// Domain Events
export interface AccountCreatedEvent extends DomainEvent {
  eventType: 'AccountCreated';
  name: string;
  type: string;
  subscriptionTier: string;
  primaryContactEmail: string;
}

export interface AccountSubscriptionUpgradedEvent extends DomainEvent {
  eventType: 'AccountSubscriptionUpgraded';
  oldTier: string;
  newTier: string;
  newApiQuota: any;
}

export interface AccountSuspendedEvent extends DomainEvent {
  eventType: 'AccountSuspended';
  reason: string;
}

export interface ApiQuotaConsumedEvent extends DomainEvent {
  eventType: 'ApiQuotaConsumed';
  consumed: number;
  remaining: number;
}
