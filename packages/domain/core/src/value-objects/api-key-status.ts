export type APIKeyStatusType = 'active' | 'inactive' | 'expired' | 'revoked' | 'suspended';

export class APIKeyStatus {
  private constructor(private readonly value: APIKeyStatusType) {}

  static active(): APIKeyStatus {
    return new APIKeyStatus('active');
  }

  static inactive(): APIKeyStatus {
    return new APIKeyStatus('inactive');
  }

  static expired(): APIKeyStatus {
    return new APIKeyStatus('expired');
  }

  static revoked(): APIKeyStatus {
    return new APIKeyStatus('revoked');
  }

  static suspended(): APIKeyStatus {
    return new APIKeyStatus('suspended');
  }

  static fromString(value: string): APIKeyStatus {
    const validStatuses: APIKeyStatusType[] = ['active', 'inactive', 'expired', 'revoked', 'suspended'];
    if (!validStatuses.includes(value as APIKeyStatusType)) {
      throw new Error(`Invalid API key status: ${value}`);
    }
    return new APIKeyStatus(value as APIKeyStatusType);
  }

  getValue(): APIKeyStatusType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: APIKeyStatus): boolean {
    return this.value === other.value;
  }

  isActive(): boolean {
    return this.value === 'active';
  }

  isInactive(): boolean {
    return this.value === 'inactive';
  }

  isExpired(): boolean {
    return this.value === 'expired';
  }

  isRevoked(): boolean {
    return this.value === 'revoked';
  }

  isSuspended(): boolean {
    return this.value === 'suspended';
  }

  canBeUsed(): boolean {
    return this.value === 'active';
  }

  canTransitionTo(newStatus: APIKeyStatus): boolean {
    const transitions: Record<APIKeyStatusType, APIKeyStatusType[]> = {
      'active': ['inactive', 'expired', 'revoked', 'suspended'],
      'inactive': ['active', 'revoked'],
      'expired': ['revoked'],
      'revoked': [],
      'suspended': ['active', 'revoked']
    };
    return transitions[this.value].includes(newStatus.value);
  }
}
