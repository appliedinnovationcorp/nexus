// Event Store Interfaces - Core event sourcing abstractions

export interface EventStore {
  saveEvents(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(streamId: string, fromVersion?: number): Promise<StoredEvent[]>;
  getAllEvents(fromPosition?: number): Promise<StoredEvent[]>;
  getEventsByType(eventType: string, fromPosition?: number): Promise<StoredEvent[]>;
}

export interface StoredEvent {
  readonly id: string;
  readonly streamId: string;
  readonly eventType: string;
  readonly eventData: any;
  readonly metadata: EventMetadata;
  readonly version: number;
  readonly position: number;
  readonly occurredAt: Date;
}

export interface EventMetadata {
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly userId?: string;
  readonly source: string;
  readonly [key: string]: any;
}

export interface DomainEvent {
  readonly id: string;
  readonly occurredAt: Date;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly aggregateVersion: number;
}

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

export interface EventBus {
  publish(events: DomainEvent[]): Promise<void>;
  subscribe<T extends DomainEvent>(eventType: string, handler: EventHandler<T>): void;
}
