// Domain Events - Things that happened in the domain

// Core event abstractions
export * from './event-store';

// Legacy events (kept for backward compatibility)
export interface DomainEvent {
  readonly id: string;
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
}

export interface UserCreatedEvent extends DomainEvent {
  readonly eventType: 'UserCreated';
  readonly userId: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
}

export interface UserEmailChangedEvent extends DomainEvent {
  readonly eventType: 'UserEmailChanged';
  readonly userId: string;
  readonly oldEmail: string;
  readonly newEmail: string;
}

export interface UserLoggedInEvent extends DomainEvent {
  readonly eventType: 'UserLoggedIn';
  readonly userId: string;
  readonly loginAt: Date;
}

export interface ProductCreatedEvent extends DomainEvent {
  readonly eventType: 'ProductCreated';
  readonly productId: string;
  readonly name: string;
  readonly price: number;
  readonly description: string;
  readonly categoryId: string;
  readonly sku: string;
  readonly stockQuantity: number;
}

export interface ProductPriceChangedEvent extends DomainEvent {
  readonly eventType: 'ProductPriceChanged';
  readonly productId: string;
  readonly oldPrice: number;
  readonly newPrice: number;
}

export interface ProductStockAdjustedEvent extends DomainEvent {
  readonly eventType: 'ProductStockAdjusted';
  readonly productId: string;
  readonly oldQuantity: number;
  readonly newQuantity: number;
  readonly adjustment: number;
  readonly reason: string;
}

export interface ProductStockReservedEvent extends DomainEvent {
  readonly eventType: 'ProductStockReserved';
  readonly productId: string;
  readonly reservedQuantity: number;
  readonly remainingStock: number;
}

export interface ProductDeactivatedEvent extends DomainEvent {
  readonly eventType: 'ProductDeactivated';
  readonly productId: string;
}
