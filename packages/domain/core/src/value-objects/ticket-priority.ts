export type TicketPriorityType = 'low' | 'medium' | 'high' | 'urgent' | 'critical';

export class TicketPriority {
  private constructor(private readonly value: TicketPriorityType) {}

  static low(): TicketPriority {
    return new TicketPriority('low');
  }

  static medium(): TicketPriority {
    return new TicketPriority('medium');
  }

  static high(): TicketPriority {
    return new TicketPriority('high');
  }

  static urgent(): TicketPriority {
    return new TicketPriority('urgent');
  }

  static critical(): TicketPriority {
    return new TicketPriority('critical');
  }

  static fromString(value: string): TicketPriority {
    const validPriorities: TicketPriorityType[] = ['low', 'medium', 'high', 'urgent', 'critical'];
    if (!validPriorities.includes(value as TicketPriorityType)) {
      throw new Error(`Invalid ticket priority: ${value}`);
    }
    return new TicketPriority(value as TicketPriorityType);
  }

  getValue(): TicketPriorityType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TicketPriority): boolean {
    return this.value === other.value;
  }

  isLow(): boolean {
    return this.value === 'low';
  }

  isMedium(): boolean {
    return this.value === 'medium';
  }

  isHigh(): boolean {
    return this.value === 'high';
  }

  isUrgent(): boolean {
    return this.value === 'urgent';
  }

  isCritical(): boolean {
    return this.value === 'critical';
  }

  getNumericValue(): number {
    const priorities = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'urgent': 4,
      'critical': 5
    };
    return priorities[this.value];
  }

  isHigherThan(other: TicketPriority): boolean {
    return this.getNumericValue() > other.getNumericValue();
  }

  isLowerThan(other: TicketPriority): boolean {
    return this.getNumericValue() < other.getNumericValue();
  }

  getSLAHours(): number {
    const slaHours = {
      'low': 72,
      'medium': 24,
      'high': 8,
      'urgent': 4,
      'critical': 1
    };
    return slaHours[this.value];
  }

  getEscalationHours(): number {
    const escalationHours = {
      'low': 48,
      'medium': 12,
      'high': 4,
      'urgent': 2,
      'critical': 0.5
    };
    return escalationHours[this.value];
  }
}
