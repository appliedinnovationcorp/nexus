export type TicketStatusType = 'open' | 'in-progress' | 'pending' | 'resolved' | 'closed' | 'cancelled';

export class TicketStatus {
  private constructor(private readonly value: TicketStatusType) {}

  static open(): TicketStatus {
    return new TicketStatus('open');
  }

  static inProgress(): TicketStatus {
    return new TicketStatus('in-progress');
  }

  static pending(): TicketStatus {
    return new TicketStatus('pending');
  }

  static resolved(): TicketStatus {
    return new TicketStatus('resolved');
  }

  static closed(): TicketStatus {
    return new TicketStatus('closed');
  }

  static cancelled(): TicketStatus {
    return new TicketStatus('cancelled');
  }

  static fromString(value: string): TicketStatus {
    const validStatuses: TicketStatusType[] = ['open', 'in-progress', 'pending', 'resolved', 'closed', 'cancelled'];
    if (!validStatuses.includes(value as TicketStatusType)) {
      throw new Error(`Invalid ticket status: ${value}`);
    }
    return new TicketStatus(value as TicketStatusType);
  }

  getValue(): TicketStatusType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TicketStatus): boolean {
    return this.value === other.value;
  }

  isOpen(): boolean {
    return this.value === 'open';
  }

  isInProgress(): boolean {
    return this.value === 'in-progress';
  }

  isPending(): boolean {
    return this.value === 'pending';
  }

  isResolved(): boolean {
    return this.value === 'resolved';
  }

  isClosed(): boolean {
    return this.value === 'closed';
  }

  isCancelled(): boolean {
    return this.value === 'cancelled';
  }

  isActive(): boolean {
    return ['open', 'in-progress', 'pending'].includes(this.value);
  }

  isFinal(): boolean {
    return ['resolved', 'closed', 'cancelled'].includes(this.value);
  }

  canTransitionTo(newStatus: TicketStatus): boolean {
    const transitions: Record<TicketStatusType, TicketStatusType[]> = {
      'open': ['in-progress', 'pending', 'resolved', 'cancelled'],
      'in-progress': ['pending', 'resolved', 'cancelled'],
      'pending': ['in-progress', 'resolved', 'cancelled'],
      'resolved': ['closed', 'open'],
      'closed': [],
      'cancelled': []
    };
    return transitions[this.value].includes(newStatus.value);
  }
}
