/**
 * @nexus/domain-models
 * 
 * Shared Domain-Driven Design models, aggregates, entities, and value objects
 */

// Base classes
export * from './base/Entity';
export * from './base/ValueObject';
export * from './base/AggregateRoot';
export * from './base/DomainEvent';

// Domain models
export * from './user/User';
export * from './user/UserProfile';
export * from './user/UserPreferences';

export * from './project/Project';
export * from './project/ProjectMember';
export * from './project/ProjectSettings';

export * from './billing/Invoice';
export * from './billing/Payment';
export * from './billing/Subscription';

export * from './ai/AIModel';
export * from './ai/AIRequest';
export * from './ai/AIResponse';

export * from './communication/Message';
export * from './communication/Conversation';
export * from './communication/Notification';

// Value objects
export * from './value-objects/Email';
export * from './value-objects/Money';
export * from './value-objects/DateRange';
export * from './value-objects/Address';

// Events
export * from './events/UserEvents';
export * from './events/ProjectEvents';
export * from './events/BillingEvents';
export * from './events/AIEvents';

// Types and interfaces
export * from './types/common';
export * from './types/errors';
export * from './types/events';
