// User Command Handlers - CQRS Write Side

import { UserAggregate, Email, UserRole } from '@repo/domain-core';
import { UserRepository } from '../../infrastructure/repositories/user-repository';
import { EventBus } from '../../infrastructure/events/event-bus';
import { PasswordService } from '../../infrastructure/services/password-service';
import { TokenService } from '../../infrastructure/services/token-service';
import {
  CreateUserCommand,
  UpdateUserCommand,
  ChangeUserRoleCommand,
  DeactivateUserCommand,
  ActivateUserCommand,
  RecordUserLoginCommand,
  ChangeUserPasswordCommand,
  ResetUserPasswordCommand,
  VerifyUserEmailCommand,
  UpdateUserPreferencesCommand
} from '../commands/user-commands';

export class UserCommandHandlers {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: EventBus,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService
  ) {}

  async handleCreateUser(command: CreateUserCommand): Promise<void> {
    // Validate command
    await this.validateCreateUserCommand(command);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(command.email);
    if (existingUser) {
      throw new Error(`User with email ${command.email} already exists`);
    }

    // Create user aggregate
    const email = new Email(command.email);
    const role = new UserRole(command.role);
    const user = UserAggregate.create(command.id, email, command.name, role);

    // Save user
    await this.userRepository.save(user);

    // Publish events
    await this.publishDomainEvents(user);
  }

  async handleUpdateUser(command: UpdateUserCommand): Promise<void> {
    const user = await this.getUserById(command.userId);

    if (command.email && command.email !== user.email.value) {
      const newEmail = new Email(command.email);
      user.changeEmail(newEmail);
    }

    if (command.name && command.name !== user.name) {
      // Add updateName method to UserAggregate if needed
      // user.updateName(command.name);
    }

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);
  }

  async handleChangeUserRole(command: ChangeUserRoleCommand): Promise<void> {
    const user = await this.getUserById(command.userId);
    const changer = await this.getUserById(command.changedBy);

    // Business rule: Only admins can change roles
    if (!changer.role.isAdmin()) {
      throw new Error('Only administrators can change user roles');
    }

    const newRole = new UserRole(command.newRole);
    // Add changeRole method to UserAggregate if needed
    // user.changeRole(newRole, command.changedBy);

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);
  }

  async handleDeactivateUser(command: DeactivateUserCommand): Promise<void> {
    const user = await this.getUserById(command.userId);
    const deactivator = await this.getUserById(command.deactivatedBy);

    // Business rule: Users can't deactivate themselves, only admins can deactivate
    if (command.userId === command.deactivatedBy) {
      throw new Error('Users cannot deactivate themselves');
    }

    if (!deactivator.role.isAdmin()) {
      throw new Error('Only administrators can deactivate users');
    }

    user.deactivate();

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);
  }

  async handleActivateUser(command: ActivateUserCommand): Promise<void> {
    const user = await this.getUserById(command.userId);
    const activator = await this.getUserById(command.activatedBy);

    if (!activator.role.isAdmin()) {
      throw new Error('Only administrators can activate users');
    }

    // Add activate method to UserAggregate if needed
    // user.activate();

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);
  }

  async handleRecordUserLogin(command: RecordUserLoginCommand): Promise<void> {
    const user = await this.getUserById(command.userId);

    if (!user.isActive) {
      throw new Error('Cannot record login for inactive user');
    }

    user.recordLogin();

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);
  }

  async handleChangeUserPassword(command: ChangeUserPasswordCommand): Promise<void> {
    const user = await this.getUserById(command.userId);

    // Verify current password
    const isCurrentPasswordValid = await this.passwordService.verify(
      command.currentPassword,
      user.id // In real implementation, you'd store password hash
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await this.passwordService.hash(command.newPassword);

    // Add changePassword method to UserAggregate if needed
    // user.changePassword(hashedPassword);

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);
  }

  async handleResetUserPassword(command: ResetUserPasswordCommand): Promise<void> {
    // Verify reset token
    const tokenData = await this.tokenService.verifyPasswordResetToken(command.resetToken);
    
    if (tokenData.userId !== command.userId) {
      throw new Error('Invalid reset token');
    }

    const user = await this.getUserById(command.userId);

    // Hash new password
    const hashedPassword = await this.passwordService.hash(command.newPassword);

    // Add resetPassword method to UserAggregate if needed
    // user.resetPassword(hashedPassword);

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);

    // Invalidate the reset token
    await this.tokenService.invalidatePasswordResetToken(command.resetToken);
  }

  async handleVerifyUserEmail(command: VerifyUserEmailCommand): Promise<void> {
    // Verify email verification token
    const tokenData = await this.tokenService.verifyEmailVerificationToken(command.verificationToken);
    
    if (tokenData.userId !== command.userId) {
      throw new Error('Invalid verification token');
    }

    const user = await this.getUserById(command.userId);

    // Add verifyEmail method to UserAggregate if needed
    // user.verifyEmail();

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);

    // Invalidate the verification token
    await this.tokenService.invalidateEmailVerificationToken(command.verificationToken);
  }

  async handleUpdateUserPreferences(command: UpdateUserPreferencesCommand): Promise<void> {
    const user = await this.getUserById(command.userId);

    // Add updatePreferences method to UserAggregate if needed
    // user.updatePreferences(command.preferences);

    await this.userRepository.save(user);
    await this.publishDomainEvents(user);
  }

  private async getUserById(userId: string): Promise<UserAggregate> {
    const user = await this.userRepository.getById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  }

  private async validateCreateUserCommand(command: CreateUserCommand): Promise<void> {
    if (!command.id) {
      throw new Error('User ID is required');
    }

    if (!command.email) {
      throw new Error('Email is required');
    }

    if (!command.name) {
      throw new Error('Name is required');
    }

    if (!command.role) {
      throw new Error('Role is required');
    }

    // Validate email format
    try {
      new Email(command.email);
    } catch (error) {
      throw new Error('Invalid email format');
    }

    // Validate role
    try {
      new UserRole(command.role);
    } catch (error) {
      throw new Error('Invalid role');
    }
  }

  private async publishDomainEvents(aggregate: UserAggregate): Promise<void> {
    const events = aggregate.domainEvents;
    if (events.length > 0) {
      await this.eventBus.publish(events);
    }
  }
}
