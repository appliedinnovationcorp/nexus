// Event Store Implementation - Infrastructure layer

import { EventStore, StoredEvent, DomainEvent, EventMetadata } from '@nexus/domain-core';

export class InMemoryEventStore implements EventStore {
  private events: StoredEvent[] = [];
  private streams: Map<string, StoredEvent[]> = new Map();
  private currentPosition = 0;

  async saveEvents(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    const existingEvents = this.streams.get(streamId) || [];
    
    if (existingEvents.length !== expectedVersion) {
      throw new Error(`Concurrency conflict. Expected version ${expectedVersion}, but stream has ${existingEvents.length} events`);
    }

    const storedEvents: StoredEvent[] = events.map((event, index) => ({
      id: event.id,
      streamId,
      eventType: event.eventType,
      eventData: event,
      metadata: {
        source: 'domain',
        correlationId: crypto.randomUUID(),
        causationId: event.id
      },
      version: expectedVersion + index + 1,
      position: ++this.currentPosition,
      occurredAt: event.occurredAt
    }));

    // Store in global events list
    this.events.push(...storedEvents);
    
    // Store in stream-specific list
    const streamEvents = this.streams.get(streamId) || [];
    streamEvents.push(...storedEvents);
    this.streams.set(streamId, streamEvents);
  }

  async getEvents(streamId: string, fromVersion?: number): Promise<StoredEvent[]> {
    const streamEvents = this.streams.get(streamId) || [];
    
    if (fromVersion !== undefined) {
      return streamEvents.filter(event => event.version >= fromVersion);
    }
    
    return streamEvents;
  }

  async getAllEvents(fromPosition?: number): Promise<StoredEvent[]> {
    if (fromPosition !== undefined) {
      return this.events.filter(event => event.position >= fromPosition);
    }
    
    return this.events;
  }

  async getEventsByType(eventType: string, fromPosition?: number): Promise<StoredEvent[]> {
    let filteredEvents = this.events.filter(event => event.eventType === eventType);
    
    if (fromPosition !== undefined) {
      filteredEvents = filteredEvents.filter(event => event.position >= fromPosition);
    }
    
    return filteredEvents;
  }
}

// PostgreSQL Event Store Implementation (for production use)
export class PostgreSQLEventStore implements EventStore {
  constructor(private connectionString: string) {}

  async saveEvents(streamId: string, events: DomainEvent[], expectedVersion: number): Promise<void> {
    // Implementation would use PostgreSQL with proper transactions
    // This is a placeholder for the actual implementation
    throw new Error('PostgreSQL Event Store not implemented yet');
  }

  async getEvents(streamId: string, fromVersion?: number): Promise<StoredEvent[]> {
    throw new Error('PostgreSQL Event Store not implemented yet');
  }

  async getAllEvents(fromPosition?: number): Promise<StoredEvent[]> {
    throw new Error('PostgreSQL Event Store not implemented yet');
  }

  async getEventsByType(eventType: string, fromPosition?: number): Promise<StoredEvent[]> {
    throw new Error('PostgreSQL Event Store not implemented yet');
  }
}
