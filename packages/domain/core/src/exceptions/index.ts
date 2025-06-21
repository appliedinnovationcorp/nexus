// Domain Exceptions - Business rule violations

export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundError extends DomainException {
  constructor(userId: string) {
    super(`User with id ${userId} not found`);
  }
}

export class ProductNotFoundError extends DomainException {
  constructor(productId: string) {
    super(`Product with id ${productId} not found`);
  }
}

export class InvalidEmailError extends DomainException {
  constructor(email: string) {
    super(`Invalid email: ${email}`);
  }
}

export class InsufficientStockError extends DomainException {
  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`);
  }
}
