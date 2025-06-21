// User Aggregate - Identity and Access Management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { Email } from '../value-objects/email';
import { UserRole } from '../value-objects/user-role';

// Import events from events module
import type { UserCreatedEvent, UserEmailChangedEvent, UserLoggedInEvent } from '../events';

export class UserAggregate extends AggregateRoot {
  private _email: Email;
  private _name: string;
  private _role: UserRole;
  private _isActive: boolean;
  private _lastLoginAt?: Date;
  private _profileCompletedAt?: Date;

  private constructor(
    id: string,
    email: Email,
    name: string,
    role: UserRole,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._email = email;
    this._name = name;
    this._role = role;
    this._isActive = true;
  }

  // Factory method
  public static create(id: string, email: Email, name: string, role: UserRole): UserAggregate {
    const user = new UserAggregate(id, email, name, role);
    
    user.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'UserCreated',
      aggregateId: id,
      aggregateVersion: 1,
      userId: id,
      email: email.value,
      name,
      role: role.value
    } as UserCreatedEvent);

    return user;
  }

  // Getters
  get email(): Email { return this._email; }
  get name(): string { return this._name; }
  get role(): UserRole { return this._role; }
  get isActive(): boolean { return this._isActive; }
  get lastLoginAt(): Date | undefined { return this._lastLoginAt; }

  // Business methods
  public changeEmail(newEmail: Email): void {
    if (this._email.equals(newEmail)) return;

    const oldEmail = this._email;
    this._email = newEmail;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'UserEmailChanged',
      aggregateId: this.id,
      aggregateVersion: this.version + 1,
      userId: this.id,
      oldEmail: oldEmail.value,
      newEmail: newEmail.value
    } as UserEmailChangedEvent);
  }

  public deactivate(): void {
    if (!this._isActive) return;

    this._isActive = false;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'UserDeactivated',
      aggregateId: this.id,
      aggregateVersion: this.version
    } as UserDeactivatedEvent);
  }

  public recordLogin(): void {
    this._lastLoginAt = new Date();
    
    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'UserLoggedIn',
      aggregateId: this.id,
      aggregateVersion: this.version,
      loginAt: this._lastLoginAt
    } as UserLoggedInEvent);
  }

  // Event sourcing - replay events
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'UserCreated':
        this.applyUserCreated(event as UserCreatedEvent);
        break;
      case 'UserEmailChanged':
        this.applyUserEmailChanged(event as UserEmailChangedEvent);
        break;
      case 'UserDeactivated':
        this.applyUserDeactivated(event as UserDeactivatedEvent);
        break;
      case 'UserLoggedIn':
        this.applyUserLoggedIn(event as UserLoggedInEvent);
        break;
    }
  }

  private applyUserCreated(event: UserCreatedEvent): void {
    this._email = new Email(event.email);
    this._name = event.name;
    this._role = new UserRole(event.role);
    this._isActive = true;
  }

  private applyUserEmailChanged(event: UserEmailChangedEvent): void {
    this._email = new Email(event.newEmail);
  }

  private applyUserDeactivated(event: UserDeactivatedEvent): void {
    this._isActive = false;
  }

  private applyUserLoggedIn(event: UserLoggedInEvent): void {
    this._lastLoginAt = event.loginAt;
  }
}

export interface UserDeactivatedEvent extends DomainEvent {
  eventType: 'UserDeactivated';
}


