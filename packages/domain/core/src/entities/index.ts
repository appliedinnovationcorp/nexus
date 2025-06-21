// Domain Entities - Core business objects with identity and lifecycle

// Base abstractions
export * from './aggregate-root';

// Core Business Aggregates
export * from './account-aggregate';
export * from './user-aggregate';
export * from './project-aggregate';
export * from './content-aggregate';

// E-commerce Aggregates (if needed)
export * from './order-aggregate';
export * from './product-aggregate';

// Legacy interfaces (kept for backward compatibility)
export interface Entity {
  readonly id: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface User extends Entity {
  readonly email: string;
  readonly name: string;
  readonly isActive: boolean;
}

export interface Product extends Entity {
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly isAvailable: boolean;
}
