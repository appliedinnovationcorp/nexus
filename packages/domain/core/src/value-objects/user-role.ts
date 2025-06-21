// User Role Value Object

export class UserRole {
  private static readonly VALID_ROLES = ['admin', 'user', 'moderator', 'guest'] as const;
  private readonly _value: typeof UserRole.VALID_ROLES[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof UserRole.VALID_ROLES[number];
    
    if (!UserRole.VALID_ROLES.includes(normalizedValue)) {
      throw new Error(`Invalid user role: ${value}. Valid roles are: ${UserRole.VALID_ROLES.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static admin(): UserRole {
    return new UserRole('admin');
  }

  public static user(): UserRole {
    return new UserRole('user');
  }

  public static moderator(): UserRole {
    return new UserRole('moderator');
  }

  public static guest(): UserRole {
    return new UserRole('guest');
  }

  public isAdmin(): boolean {
    return this._value === 'admin';
  }

  public isModerator(): boolean {
    return this._value === 'moderator';
  }

  public isUser(): boolean {
    return this._value === 'user';
  }

  public isGuest(): boolean {
    return this._value === 'guest';
  }

  public hasPermission(requiredRole: UserRole): boolean {
    const hierarchy = { admin: 4, moderator: 3, user: 2, guest: 1 };
    return hierarchy[this._value] >= hierarchy[requiredRole._value];
  }

  public equals(other: UserRole): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
