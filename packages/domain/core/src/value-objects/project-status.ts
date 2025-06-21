// Project Status Value Object

export class ProjectStatus {
  private static readonly VALID_STATUSES = ['planning', 'in-progress', 'on-hold', 'completed', 'cancelled'] as const;
  private readonly _value: typeof ProjectStatus.VALID_STATUSES[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof ProjectStatus.VALID_STATUSES[number];
    
    if (!ProjectStatus.VALID_STATUSES.includes(normalizedValue)) {
      throw new Error(`Invalid project status: ${value}. Valid statuses are: ${ProjectStatus.VALID_STATUSES.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static planning(): ProjectStatus {
    return new ProjectStatus('planning');
  }

  public static inProgress(): ProjectStatus {
    return new ProjectStatus('in-progress');
  }

  public static onHold(): ProjectStatus {
    return new ProjectStatus('on-hold');
  }

  public static completed(): ProjectStatus {
    return new ProjectStatus('completed');
  }

  public static cancelled(): ProjectStatus {
    return new ProjectStatus('cancelled');
  }

  public isPlanning(): boolean {
    return this._value === 'planning';
  }

  public isInProgress(): boolean {
    return this._value === 'in-progress';
  }

  public isOnHold(): boolean {
    return this._value === 'on-hold';
  }

  public isCompleted(): boolean {
    return this._value === 'completed';
  }

  public isCancelled(): boolean {
    return this._value === 'cancelled';
  }

  public isActive(): boolean {
    return this._value === 'planning' || this._value === 'in-progress';
  }

  public canTransitionTo(newStatus: ProjectStatus): boolean {
    const transitions: Record<string, string[]> = {
      'planning': ['in-progress', 'cancelled'],
      'in-progress': ['on-hold', 'completed', 'cancelled'],
      'on-hold': ['in-progress', 'cancelled'],
      'completed': [],
      'cancelled': []
    };

    return transitions[this._value]?.includes(newStatus._value) ?? false;
  }

  public equals(other: ProjectStatus): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
