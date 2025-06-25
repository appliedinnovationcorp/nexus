/**
 * @nexus/event-store
 * 
 * Event sourcing database integration with projections, snapshots, and event replay
 */

export * from './store';
export * from './projections';
export * from './snapshots';
export * from './replay';
export * from './adapters';
export * from './types';
export * from './utils';

// Default exports
export { EventStore } from './store';
export { ProjectionManager } from './projections';
export { SnapshotManager } from './snapshots';

// Re-export commonly used types
export type {
  StoredEvent,
  EventStream,
  Projection,
  Snapshot,
  EventStoreConfig,
  ProjectionConfig,
  SnapshotConfig
} from './types';
