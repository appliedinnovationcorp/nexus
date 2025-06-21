// Ports - Interfaces that define contracts for external dependencies

import { User, Product, DomainEvent } from '@nexus/domain-core';

// Repository Ports (Secondary/Driven Ports)
export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ProductRepository {
  findById(id: string): Promise<Product | null>;
  findAll(): Promise<Product[]>;
  save(product: Product): Promise<void>;
  delete(id: string): Promise<void>;
}

// Event Publisher Port
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  publishMany(events: DomainEvent[]): Promise<void>;
}

// External Service Ports
export interface EmailService {
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendNotification(email: string, subject: string, body: string): Promise<void>;
}

export interface PaymentService {
  processPayment(amount: number, currency: string, paymentMethod: string): Promise<{ success: boolean; transactionId?: string; error?: string }>;
}

// Cache Port
export interface CacheService {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// Logger Port
export interface Logger {
  info(message: string, meta?: Record<string, any>): void;
  warn(message: string, meta?: Record<string, any>): void;
  error(message: string, error?: Error, meta?: Record<string, any>): void;
  debug(message: string, meta?: Record<string, any>): void;
}
