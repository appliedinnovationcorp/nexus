// User Command Handlers - Application layer

import { UserAggregate, Email, UserRole, Repository } from '@nexus/domain-core';
import { 
  CreateUserCommand, 
  ChangeUserEmailCommand, 
  DeactivateUserCommand, 
  RecordUserLoginCommand 
} from '../commands/user-commands';

export class UserCommandHandlers {
  constructor(private userRepository: Repository<UserAggregate>) {}

  async handleCreateUser(command: CreateUserCommand): Promise<void> {
    // Check if user already exists
    const existingUser = await this.userRepository.getById(command.id);
    if (existingUser) {
      throw new Error(`User with id ${command.id} already exists`);
    }

    // Create new user aggregate
    const email = new Email(command.email);
    const role = new UserRole(command.role);
    const user = UserAggregate.create(command.id, email, command.name, role);

    // Save to repository (which will also publish domain events)
    await this.userRepository.save(user);
  }

  async handleChangeUserEmail(command: ChangeUserEmailCommand): Promise<void> {
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User with id ${command.userId} not found`);
    }

    const newEmail = new Email(command.newEmail);
    user.changeEmail(newEmail);

    await this.userRepository.save(user);
  }

  async handleDeactivateUser(command: DeactivateUserCommand): Promise<void> {
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User with id ${command.userId} not found`);
    }

    user.deactivate();
    await this.userRepository.save(user);
  }

  async handleRecordUserLogin(command: RecordUserLoginCommand): Promise<void> {
    const user = await this.userRepository.getById(command.userId);
    if (!user) {
      throw new Error(`User with id ${command.userId} not found`);
    }

    user.recordLogin();
    await this.userRepository.save(user);
  }
}
