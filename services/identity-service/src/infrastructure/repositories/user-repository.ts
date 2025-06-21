// User Repository Implementation

import { UserAggregate, Email, UserRole } from '@repo/domain-core';
import { BaseRepository, DatabaseTransaction, AggregateSnapshot } from '@repo/infrastructure-database';

export class UserRepository extends BaseRepository<UserAggregate> {
  constructor(db: any, eventStore: any) {
    super(db, eventStore, 'user_snapshots');
  }

  protected async saveSnapshot(tx: DatabaseTransaction, aggregate: UserAggregate): Promise<void> {
    const snapshot = {
      id: aggregate.id,
      version: aggregate.version,
      data: {
        email: aggregate.email.value,
        name: aggregate.name,
        role: aggregate.role.value,
        isActive: aggregate.isActive,
        lastLoginAt: aggregate.lastLoginAt,
        createdAt: aggregate.createdAt,
        updatedAt: aggregate.updatedAt
      }
    };

    await tx.query(`
      INSERT INTO user_snapshots (id, version, data, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        version = EXCLUDED.version,
        data = EXCLUDED.data,
        updated_at = EXCLUDED.updated_at
    `, [
      snapshot.id,
      snapshot.version,
      JSON.stringify(snapshot.data),
      aggregate.createdAt,
      aggregate.updatedAt
    ]);
  }

  protected async getSnapshot(id: string): Promise<AggregateSnapshot | null> {
    const rows = await this.db.query(`
      SELECT id, version, data, created_at, updated_at
      FROM user_snapshots
      WHERE id = $1
    `, [id]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return {
      id: row.id,
      version: row.version,
      data: JSON.parse(row.data),
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  protected createFromSnapshot(snapshot: AggregateSnapshot): UserAggregate {
    const data = snapshot.data;
    const email = new Email(data.email);
    const role = new UserRole(data.role);
    
    // Use reflection or a factory method to recreate the aggregate
    const user = UserAggregate.create(snapshot.id, email, data.name, role);
    
    // Set internal state from snapshot
    (user as any)._isActive = data.isActive;
    (user as any)._lastLoginAt = data.lastLoginAt ? new Date(data.lastLoginAt) : undefined;
    (user as any).createdAt = new Date(data.createdAt);
    (user as any).updatedAt = new Date(data.updatedAt);
    (user as any)._version = snapshot.version;
    
    // Clear events since this is from snapshot
    user.clearDomainEvents();
    
    return user;
  }

  protected createFromEvents(id: string, events: any[]): UserAggregate {
    if (events.length === 0) {
      throw new Error('Cannot create aggregate without events');
    }

    const firstEvent = events[0].eventData;
    if (firstEvent.eventType !== 'UserCreated') {
      throw new Error('First event must be UserCreated');
    }

    // Create initial aggregate
    const email = new Email(firstEvent.email);
    const role = new UserRole(firstEvent.role);
    const user = UserAggregate.create(id, email, firstEvent.name, role);
    
    // Clear the creation event since we're replaying
    user.clearDomainEvents();

    // Replay all events
    for (const storedEvent of events) {
      user.applyEvent(storedEvent.eventData, true);
    }

    return user;
  }

  // Query methods (CQRS Read side)
  async findByEmail(email: string): Promise<UserAggregate | null> {
    const rows = await this.db.query(`
      SELECT id FROM user_snapshots 
      WHERE data->>'email' = $1 AND data->>'isActive' = 'true'
    `, [email]);

    if (rows.length === 0) {
      return null;
    }

    return this.getById(rows[0].id);
  }

  async findActiveUsers(limit: number = 50, offset: number = 0): Promise<UserAggregate[]> {
    const rows = await this.db.query(`
      SELECT id FROM user_snapshots 
      WHERE data->>'isActive' = 'true'
      ORDER BY updated_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const users: UserAggregate[] = [];
    for (const row of rows) {
      const user = await this.getById(row.id);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }

  async countByRole(role: string): Promise<number> {
    const rows = await this.db.query(`
      SELECT COUNT(*) as count FROM user_snapshots 
      WHERE data->>'role' = $1 AND data->>'isActive' = 'true'
    `, [role]);

    return parseInt(rows[0].count, 10);
  }

  async findUsersCreatedAfter(date: Date): Promise<UserAggregate[]> {
    const rows = await this.db.query(`
      SELECT id FROM user_snapshots 
      WHERE created_at > $1 AND data->>'isActive' = 'true'
      ORDER BY created_at DESC
    `, [date]);

    const users: UserAggregate[] = [];
    for (const row of rows) {
      const user = await this.getById(row.id);
      if (user) {
        users.push(user);
      }
    }

    return users;
  }
}
