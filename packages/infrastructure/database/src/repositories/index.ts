// Repository Implementations - Adapters that implement the repository ports

import { User, Product } from '@nexus/domain-core';
import { UserRepository, ProductRepository } from '@nexus/application-core';

// In-Memory User Repository (for demonstration)
export class InMemoryUserRepository implements UserRepository {
  private users: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
  }
}

// In-Memory Product Repository (for demonstration)
export class InMemoryProductRepository implements ProductRepository {
  private products: Map<string, Product> = new Map();

  async findById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async findAll(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async save(product: Product): Promise<void> {
    this.products.set(product.id, product);
  }

  async delete(id: string): Promise<void> {
    this.products.delete(id);
  }
}

// PostgreSQL User Repository (skeleton for real implementation)
export class PostgreSQLUserRepository implements UserRepository {
  constructor(private readonly connectionString: string) {}

  async findById(id: string): Promise<User | null> {
    // TODO: Implement with actual PostgreSQL client
    throw new Error('Not implemented');
  }

  async findByEmail(email: string): Promise<User | null> {
    // TODO: Implement with actual PostgreSQL client
    throw new Error('Not implemented');
  }

  async save(user: User): Promise<void> {
    // TODO: Implement with actual PostgreSQL client
    throw new Error('Not implemented');
  }

  async delete(id: string): Promise<void> {
    // TODO: Implement with actual PostgreSQL client
    throw new Error('Not implemented');
  }
}
