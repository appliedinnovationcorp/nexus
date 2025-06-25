/**
 * @nexus/event-bus
 * 
 * Event bus package with Kafka clients, producers, consumers, and event handling
 */

export * from './client';
export * from './producer';
export * from './consumer';
export * from './events';
export * from './handlers';
export * from './serialization';
export * from './middleware';
export * from './types';
export * from './utils';

// Default export
export { EventBus } from './client';

// Re-export commonly used types
export type {
  Event,
  EventHandler,
  EventBusConfig,
  ProducerConfig,
  ConsumerConfig,
  EventMetadata,
  EventContext
} from './types';
