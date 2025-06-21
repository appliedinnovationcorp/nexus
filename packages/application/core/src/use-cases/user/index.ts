// User Use Cases

import { User, Email, UserCreatedEvent } from '@nexus/domain-core';
import { UserRepository, EventPublisher, EmailService, Logger } from '../../ports';
import { CreateUserDto, UpdateUserDto, UserResponseDto } from '../../dtos';

export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventPublisher: EventPublisher,
    private readonly emailService: EmailService,
    private readonly logger: Logger
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    this.logger.info('Creating user', { email: dto.email });

    // Validate email format using domain value object
    const email = new Email(dto.email);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Create user entity
    const user: User = {
      id: crypto.randomUUID(),
      email: dto.email,
      name: dto.name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Save user
    await this.userRepository.save(user);

    // Publish domain event
    const event: UserCreatedEvent = {
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'UserCreated',
      userId: user.id,
      email: user.email,
      name: user.name,
      role: 'user', // Default role
      aggregateId: user.id,
      aggregateVersion: 1,
    };
    await this.eventPublisher.publish(event);

    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    this.logger.info('User created successfully', { userId: user.id });

    return this.mapToDto(user);
  }

  private mapToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export class GetUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  async execute(userId: string): Promise<UserResponseDto | null> {
    this.logger.info('Getting user', { userId });

    const user = await this.userRepository.findById(userId);
    if (!user) {
      return null;
    }

    return this.mapToDto(user);
  }

  private mapToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
