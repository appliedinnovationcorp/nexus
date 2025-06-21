// Base Repository - Database agnostic implementation

import { AggregateRoot, Repository, EventStore, DomainEvent } from '@nexus/domain-core';

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T>;
}

export interface DatabaseTransaction {
  query<T>(sql: string, params?: any[]): Promise<T[]>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

export abstract class BaseRepository<T extends AggregateRoot> implements Repository<T> {
  constructor(
    protected readonly db: DatabaseAdapter,
    protected readonly eventStore: EventStore,
    protected readonly tableName: string
  ) {}

  async save(aggregate: T): Promise<void> {
    await this.db.transaction(async (tx) => {
      // Save aggregate snapshot
      await this.saveSnapshot(tx, aggregate);
      
      // Save domain events
      const events = aggregate.domainEvents;
      if (events.length > 0) {
        await this.eventStore.saveEvents(
          aggregate.id,
          events,
          aggregate.version - events.length
        );
      }

      // Mark events as committed
      aggregate.markEventsAsCommitted();
    });
  }

  async getById(id: string): Promise<T | null> {
    // Try to get from snapshot first
    const snapshot = await this.getSnapshot(id);
    if (!snapshot) {
      return null;
    }

    // Get events since snapshot
    const events = await this.eventStore.getEvents(id, snapshot.version + 1);
    
    // Replay events to rebuild current state
    const aggregate = this.createFromSnapshot(snapshot);
    for (const storedEvent of events) {
      aggregate.applyEvent(storedEvent.eventData, true);
    }

    return aggregate;
  }

  async getByIdAndVersion(id: string, version: number): Promise<T | null> {
    // Get events up to specific version
    const events = await this.eventStore.getEvents(id);
    const filteredEvents = events.filter((e: any) => e.version <= version);
    
    if (filteredEvents.length === 0) {
      return null;
    }

    // Rebuild aggregate from events
    const aggregate = this.createFromEvents(id, filteredEvents);
    return aggregate;
  }

  protected abstract saveSnapshot(tx: DatabaseTransaction, aggregate: T): Promise<void>;
  protected abstract getSnapshot(id: string): Promise<AggregateSnapshot | null>;
  protected abstract createFromSnapshot(snapshot: AggregateSnapshot): T;
  protected abstract createFromEvents(id: string, events: any[]): T;
}

export interface AggregateSnapshot {
  readonly id: string;
  readonly version: number;
  readonly data: any;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// PostgreSQL Adapter
export class PostgreSQLAdapter implements DatabaseAdapter {
  private client: any;
  private pool: any;

  constructor(private config: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  }) {}

  async connect(): Promise<void> {
    try {
      // @ts-ignore - Optional dependency, handled at runtime
      const { Pool } = await import('pg');
      
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        ssl: this.config.ssl ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    this.client = await this.pool.connect();
    this.client.release();
    } catch (error) {
      throw new Error(`Failed to connect to PostgreSQL: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure 'pg' package is installed.`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
    }
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const tx: DatabaseTransaction = {
        query: async <U>(sql: string, params?: any[]): Promise<U[]> => {
          const result = await client.query(sql, params);
          return result.rows;
        },
        commit: async () => {
          await client.query('COMMIT');
        },
        rollback: async () => {
          await client.query('ROLLBACK');
        }
      };

      const result = await callback(tx);
      await tx.commit();
      return result;
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Supabase Adapter (extends PostgreSQL)
export class SupabaseAdapter extends PostgreSQLAdapter {
  constructor(private supabaseConfig: {
    url: string;
    serviceKey: string;
  }) {
    // Extract database config from Supabase URL
    const url = new URL(supabaseConfig.url);
    const host = url.hostname;
    const port = parseInt(url.port) || 5432;
    const database = 'postgres'; // Supabase default
    
    super({
      host,
      port,
      database,
      username: 'postgres',
      password: supabaseConfig.serviceKey,
      ssl: true
    });
  }

  async connect(): Promise<void> {
    try {
      // Initialize Supabase client for additional features
      // @ts-ignore - Optional dependency, handled at runtime
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(this.supabaseConfig.url, this.supabaseConfig.serviceKey);
      
      // Connect to PostgreSQL
      await super.connect();
    } catch (error) {
      throw new Error(`Failed to connect to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}. Make sure '@supabase/supabase-js' package is installed.`);
    }
  }
}

// In-Memory Adapter (for testing)
export class InMemoryAdapter implements DatabaseAdapter {
  private data: Map<string, Map<string, any>> = new Map();
  private connected = false;

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.data.clear();
  }

  async query<T>(sql: string, params?: any[]): Promise<T[]> {
    if (!this.connected) {
      throw new Error('Database not connected');
    }
    
    // Simple in-memory query simulation
    // In a real implementation, you'd parse SQL and execute against in-memory data
    return [];
  }

  async transaction<T>(callback: (tx: DatabaseTransaction) => Promise<T>): Promise<T> {
    const tx: DatabaseTransaction = {
      query: this.query.bind(this),
      commit: async () => {},
      rollback: async () => {}
    };

    return await callback(tx);
  }

  // Helper methods for in-memory operations
  setTable(tableName: string, data: Map<string, any>): void {
    this.data.set(tableName, data);
  }

  getTable(tableName: string): Map<string, any> {
    return this.data.get(tableName) || new Map();
  }
}
