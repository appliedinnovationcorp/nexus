// Dependency Injection Container - Wire up all the adapters and use cases

import {
  CreateUserUseCase,
  GetUserUseCase,
  CreateProductUseCase,
  GetAllProductsUseCase,
} from '@nexus/application-core';

import {
  InMemoryUserRepository,
  InMemoryProductRepository,
} from '@nexus/infrastructure-database';

import {
  ConsoleEmailService,
  ConsoleEventPublisher,
  ConsoleLogger,
  InMemoryCacheService,
  MockPaymentService,
} from '@nexus/infrastructure-external-services';

// Create infrastructure adapters
const userRepository = new InMemoryUserRepository();
const productRepository = new InMemoryProductRepository();
const emailService = new ConsoleEmailService();
const eventPublisher = new ConsoleEventPublisher();
const logger = new ConsoleLogger();
const cacheService = new InMemoryCacheService();
const paymentService = new MockPaymentService();

// Create use cases with injected dependencies
export const createUserUseCase = new CreateUserUseCase(
  userRepository,
  eventPublisher,
  emailService,
  logger
);

export const getUserUseCase = new GetUserUseCase(
  userRepository,
  logger
);

export const createProductUseCase = new CreateProductUseCase(
  productRepository,
  eventPublisher,
  logger
);

export const getAllProductsUseCase = new GetAllProductsUseCase(
  productRepository,
  logger
);

// Export repositories for direct access if needed
export { userRepository, productRepository, cacheService, paymentService };
