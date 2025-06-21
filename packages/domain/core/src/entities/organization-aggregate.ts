// Organization Aggregate - Multi-tenant organization management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { Email } from '../value-objects/email';
import { Address } from '../value-objects/address';
import { SubscriptionTier } from '../value-objects/subscription-tier';

export interface OrganizationSettings {
  readonly allowTeamCreation: boolean;
  readonly maxTeams: number;
  readonly maxProjects: number;
  readonly customBranding: boolean;
  readonly ssoEnabled: boolean;
}

export class OrganizationAggregate extends AggregateRoot {
  private _name: string;
  private _slug: string;
  private _description: string;
  private _website?: string;
  private _primaryEmail: Email;
  private _address?: Address;
  private _subscriptionTier: SubscriptionTier;
  private _isActive: boolean;
  private _settings: OrganizationSettings;
  private _ownerId: string;
  private _memberCount: number = 0;
  private _teamCount: number = 0;
  private _projectCount: number = 0;

  private constructor(
    id: string,
    name: string,
    slug: string,
    description: string,
    primaryEmail: Email,
    ownerId: string,
    subscriptionTier: SubscriptionTier,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._slug = slug;
    this._description = description;
    this._primaryEmail = primaryEmail;
    this._ownerId = ownerId;
    this._subscriptionTier = subscriptionTier;
    this._isActive = true;
    this._settings = this.getDefaultSettings(subscriptionTier);
  }

  public static create(
    id: string,
    name: string,
    slug: string,
    description: string,
    primaryEmail: Email,
    ownerId: string,
    subscriptionTier: SubscriptionTier,
    website?: string,
    address?: Address
  ): OrganizationAggregate {
    const org = new OrganizationAggregate(id, name, slug, description, primaryEmail, ownerId, subscriptionTier);
    
    if (website) org._website = website;
    if (address) org._address = address;

    org.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrganizationCreated',
      aggregateId: id,
      aggregateVersion: org.version,
      name,
      slug,
      description,
      primaryEmail: primaryEmail.value,
      ownerId,
      subscriptionTier: subscriptionTier.value,
      website,
      address: address?.toPlainObject()
    } as OrganizationCreatedEvent);

    return org;
  }

  // Getters
  get name(): string { return this._name; }
  get slug(): string { return this._slug; }
  get description(): string { return this._description; }
  get website(): string | undefined { return this._website; }
  get primaryEmail(): Email { return this._primaryEmail; }
  get address(): Address | undefined { return this._address; }
  get subscriptionTier(): SubscriptionTier { return this._subscriptionTier; }
  get isActive(): boolean { return this._isActive; }
  get settings(): OrganizationSettings { return this._settings; }
  get ownerId(): string { return this._ownerId; }
  get memberCount(): number { return this._memberCount; }
  get teamCount(): number { return this._teamCount; }
  get projectCount(): number { return this._projectCount; }

  // Business methods
  public updateDetails(name: string, description: string, website?: string): void {
    this._name = name;
    this._description = description;
    this._website = website;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrganizationDetailsUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      name,
      description,
      website
    } as OrganizationDetailsUpdatedEvent);
  }

  public upgradeSubscription(newTier: SubscriptionTier): void {
    if (this._subscriptionTier.equals(newTier)) return;

    const oldTier = this._subscriptionTier;
    this._subscriptionTier = newTier;
    this._settings = this.getDefaultSettings(newTier);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrganizationSubscriptionUpgraded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      oldTier: oldTier.value,
      newTier: newTier.value,
      newSettings: this._settings
    } as OrganizationSubscriptionUpgradedEvent);
  }

  public addMember(): void {
    if (this._memberCount >= this._settings.maxTeams * 10) { // Rough estimate
      throw new Error('Maximum member limit reached for current subscription');
    }

    this._memberCount++;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrganizationMemberAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      newMemberCount: this._memberCount
    } as OrganizationMemberAddedEvent);
  }

  public addTeam(): void {
    if (this._teamCount >= this._settings.maxTeams) {
      throw new Error('Maximum team limit reached for current subscription');
    }

    this._teamCount++;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrganizationTeamAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      newTeamCount: this._teamCount
    } as OrganizationTeamAddedEvent);
  }

  public addProject(): void {
    if (this._projectCount >= this._settings.maxProjects) {
      throw new Error('Maximum project limit reached for current subscription');
    }

    this._projectCount++;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrganizationProjectAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      newProjectCount: this._projectCount
    } as OrganizationProjectAddedEvent);
  }

  public deactivate(reason: string): void {
    if (!this._isActive) return;

    this._isActive = false;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'OrganizationDeactivated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      reason
    } as OrganizationDeactivatedEvent);
  }

  private getDefaultSettings(tier: SubscriptionTier): OrganizationSettings {
    const settingsMap = {
      'free': { allowTeamCreation: true, maxTeams: 2, maxProjects: 5, customBranding: false, ssoEnabled: false },
      'basic': { allowTeamCreation: true, maxTeams: 5, maxProjects: 20, customBranding: false, ssoEnabled: false },
      'professional': { allowTeamCreation: true, maxTeams: 20, maxProjects: 100, customBranding: true, ssoEnabled: true },
      'enterprise': { allowTeamCreation: true, maxTeams: 1000, maxProjects: 10000, customBranding: true, ssoEnabled: true }
    };

    return settingsMap[tier.value as keyof typeof settingsMap];
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'OrganizationCreated':
        this.applyOrganizationCreated(event as OrganizationCreatedEvent);
        break;
      case 'OrganizationDetailsUpdated':
        this.applyOrganizationDetailsUpdated(event as OrganizationDetailsUpdatedEvent);
        break;
      case 'OrganizationSubscriptionUpgraded':
        this.applyOrganizationSubscriptionUpgraded(event as OrganizationSubscriptionUpgradedEvent);
        break;
      case 'OrganizationMemberAdded':
        this.applyOrganizationMemberAdded(event as OrganizationMemberAddedEvent);
        break;
      case 'OrganizationTeamAdded':
        this.applyOrganizationTeamAdded(event as OrganizationTeamAddedEvent);
        break;
      case 'OrganizationProjectAdded':
        this.applyOrganizationProjectAdded(event as OrganizationProjectAddedEvent);
        break;
      case 'OrganizationDeactivated':
        this.applyOrganizationDeactivated(event as OrganizationDeactivatedEvent);
        break;
    }
  }

  private applyOrganizationCreated(event: OrganizationCreatedEvent): void {
    this._name = event.name;
    this._slug = event.slug;
    this._description = event.description;
    this._primaryEmail = new Email(event.primaryEmail);
    this._ownerId = event.ownerId;
    this._subscriptionTier = new SubscriptionTier(event.subscriptionTier);
    this._website = event.website;
    this._address = event.address ? Address.fromPlainObject(event.address) : undefined;
    this._isActive = true;
  }

  private applyOrganizationDetailsUpdated(event: OrganizationDetailsUpdatedEvent): void {
    this._name = event.name;
    this._description = event.description;
    this._website = event.website;
  }

  private applyOrganizationSubscriptionUpgraded(event: OrganizationSubscriptionUpgradedEvent): void {
    this._subscriptionTier = new SubscriptionTier(event.newTier);
    this._settings = event.newSettings;
  }

  private applyOrganizationMemberAdded(event: OrganizationMemberAddedEvent): void {
    this._memberCount = event.newMemberCount;
  }

  private applyOrganizationTeamAdded(event: OrganizationTeamAddedEvent): void {
    this._teamCount = event.newTeamCount;
  }

  private applyOrganizationProjectAdded(event: OrganizationProjectAddedEvent): void {
    this._projectCount = event.newProjectCount;
  }

  private applyOrganizationDeactivated(event: OrganizationDeactivatedEvent): void {
    this._isActive = false;
  }
}

// Domain Events
export interface OrganizationCreatedEvent extends DomainEvent {
  eventType: 'OrganizationCreated';
  name: string;
  slug: string;
  description: string;
  primaryEmail: string;
  ownerId: string;
  subscriptionTier: string;
  website?: string;
  address?: any;
}

export interface OrganizationDetailsUpdatedEvent extends DomainEvent {
  eventType: 'OrganizationDetailsUpdated';
  name: string;
  description: string;
  website?: string;
}

export interface OrganizationSubscriptionUpgradedEvent extends DomainEvent {
  eventType: 'OrganizationSubscriptionUpgraded';
  oldTier: string;
  newTier: string;
  newSettings: OrganizationSettings;
}

export interface OrganizationMemberAddedEvent extends DomainEvent {
  eventType: 'OrganizationMemberAdded';
  newMemberCount: number;
}

export interface OrganizationTeamAddedEvent extends DomainEvent {
  eventType: 'OrganizationTeamAdded';
  newTeamCount: number;
}

export interface OrganizationProjectAddedEvent extends DomainEvent {
  eventType: 'OrganizationProjectAdded';
  newProjectCount: number;
}

export interface OrganizationDeactivatedEvent extends DomainEvent {
  eventType: 'OrganizationDeactivated';
  reason: string;
}
