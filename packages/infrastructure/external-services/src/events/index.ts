// Event Publisher Adapters

import { DomainEvent } from '@nexus/domain-core';
import { EventPublisher } from '@nexus/application-core';

export class ConsoleEventPublisher implements EventPublisher {
  async publish(event: DomainEvent): Promise<void> {
    console.log(`📢 Event Published: ${event.eventType}`, event);
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }
}

export class SQSEventPublisher implements EventPublisher {
  constructor(private readonly queueUrl: string) {}

  async publish(event: DomainEvent): Promise<void> {
    // TODO: Implement with AWS SQS
    console.log(`AWS SQS: Event would be published to ${this.queueUrl}`, event);
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    // TODO: Implement batch publishing with AWS SQS
    console.log(`AWS SQS: ${events.length} events would be published`);
  }
}

export class EventBridgeEventPublisher implements EventPublisher {
  constructor(private readonly eventBusName: string) {}

  async publish(event: DomainEvent): Promise<void> {
    // TODO: Implement with AWS EventBridge
    console.log(`AWS EventBridge: Event would be published to ${this.eventBusName}`, event);
  }

  async publishMany(events: DomainEvent[]): Promise<void> {
    // TODO: Implement batch publishing with AWS EventBridge
    console.log(`AWS EventBridge: ${events.length} events would be published`);
  }
}
