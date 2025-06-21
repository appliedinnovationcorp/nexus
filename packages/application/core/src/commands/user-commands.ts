// User Commands - Application layer commands

export interface CreateUserCommand {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
}

export interface ChangeUserEmailCommand {
  readonly userId: string;
  readonly newEmail: string;
}

export interface DeactivateUserCommand {
  readonly userId: string;
}

export interface RecordUserLoginCommand {
  readonly userId: string;
}
