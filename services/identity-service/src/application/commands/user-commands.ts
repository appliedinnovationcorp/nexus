// User Commands - CQRS Write Side

export interface CreateUserCommand {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly organizationId?: string;
}

export interface UpdateUserCommand {
  readonly userId: string;
  readonly name?: string;
  readonly email?: string;
}

export interface ChangeUserRoleCommand {
  readonly userId: string;
  readonly newRole: string;
  readonly changedBy: string;
}

export interface DeactivateUserCommand {
  readonly userId: string;
  readonly reason: string;
  readonly deactivatedBy: string;
}

export interface ActivateUserCommand {
  readonly userId: string;
  readonly activatedBy: string;
}

export interface RecordUserLoginCommand {
  readonly userId: string;
  readonly loginAt?: Date;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface ChangeUserPasswordCommand {
  readonly userId: string;
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface ResetUserPasswordCommand {
  readonly userId: string;
  readonly resetToken: string;
  readonly newPassword: string;
}

export interface VerifyUserEmailCommand {
  readonly userId: string;
  readonly verificationToken: string;
}

export interface UpdateUserPreferencesCommand {
  readonly userId: string;
  readonly preferences: {
    readonly theme?: 'light' | 'dark' | 'auto';
    readonly language?: string;
    readonly timezone?: string;
    readonly notifications?: {
      readonly email?: boolean;
      readonly push?: boolean;
      readonly sms?: boolean;
    };
  };
}
