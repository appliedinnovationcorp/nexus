// Product Use Cases

import { Product, ProductCreatedEvent, Money } from '@nexus/domain-core';
import { ProductRepository, EventPublisher, Logger } from '../../ports';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '../../dtos';

export class CreateProductUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly logger: Logger
  ) {}

  async execute(dto: CreateProductDto): Promise<ProductResponseDto> {
    this.logger.info('Creating product', { name: dto.name });

    // Validate price using domain value object
    const price = Money.create(dto.price, 'USD'); // Default to USD

    // Create product entity
    const product: Product = {
      id: crypto.randomUUID(),
      name: dto.name,
      description: dto.description,
      price: dto.price,
      isAvailable: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save product
    await this.productRepository.save(product);

    // Publish domain event
    const event: ProductCreatedEvent = {
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProductCreated',
      productId: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      categoryId: 'default-category', // Default value - should be passed in DTO in real implementation
      sku: `SKU-${product.id.slice(0, 8)}`, // Generate SKU from product ID
      stockQuantity: 0, // Default stock quantity
      aggregateId: product.id,
      aggregateVersion: 1,
    };
    await this.eventPublisher.publish(event);

    this.logger.info('Product created successfully', { productId: product.id });

    return this.mapToDto(product);
  }

  private mapToDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      isAvailable: product.isAvailable,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}

export class GetAllProductsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly logger: Logger
  ) {}

  async execute(): Promise<ProductResponseDto[]> {
    this.logger.info('Getting all products');

    const products = await this.productRepository.findAll();
    return products.map(this.mapToDto);
  }

  private mapToDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      isAvailable: product.isAvailable,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };
  }
}
