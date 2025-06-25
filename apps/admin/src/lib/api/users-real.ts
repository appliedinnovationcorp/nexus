import { DatabaseConnection } from '@/lib/database/connection';
import { User, CreateUserData, UpdateUserData, UserFilters } from '@/types/user';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async getUsers(filters: UserFilters = {}): Promise<User[]> {
    let sql = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.status,
        u.email_verified,
        u.phone,
        u.phone_verified,
        u.avatar_url,
        u.last_sign_in_at,
        u.created_at,
        u.updated_at,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.search) {
      sql += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    if (filters.role) {
      sql += ` AND u.role = $${paramIndex}`;
      params.push(filters.role);
      paramIndex++;
    }

    if (filters.status) {
      sql += ` AND u.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters.organizationId) {
      sql += ` AND u.organization_id = $${paramIndex}`;
      params.push(filters.organizationId);
      paramIndex++;
    }

    sql += ` ORDER BY u.created_at DESC`;

    if (filters.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.page && filters.limit) {
      const offset = (filters.page - 1) * filters.limit;
      sql += ` OFFSET $${paramIndex}`;
      params.push(offset);
    }

    const rows = await this.db.query<User>(sql, params);
    return rows;
  }

  async getUserById(id: string): Promise<User | null> {
    const sql = `
      SELECT 
        u.id,
        u.email,
        u.name,
        u.role,
        u.status,
        u.email_verified,
        u.phone,
        u.phone_verified,
        u.avatar_url,
        u.last_sign_in_at,
        u.created_at,
        u.updated_at,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE u.id = $1
    `;

    const rows = await this.db.query<User>(sql, [id]);
    return rows[0] || null;
  }

  async createUser(data: CreateUserData): Promise<User> {
    const id = uuidv4();
    const hashedPassword = data.password ? await bcrypt.hash(data.password, 12) : null;
    
    const sql = `
      INSERT INTO users (
        id, email, name, password_hash, role, status, 
        phone, organization_id, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      ) RETURNING *
    `;

    const params = [
      id,
      data.email,
      data.name,
      hashedPassword,
      data.role || 'user',
      data.status || 'active',
      data.phone || null,
      data.organizationId || null,
    ];

    const rows = await this.db.query<User>(sql, params);
    const user = rows[0];

    if (!user) {
      throw new Error('Failed to create user');
    }

    // Log user creation activity
    await this.logUserActivity(user.id, 'user_created', { email: user.email });

    return user;
  }

  async updateUser(id: string, data: UpdateUserData): Promise<User> {
    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex}`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.email !== undefined) {
      updates.push(`email = $${paramIndex}`);
      params.push(data.email);
      paramIndex++;
    }

    if (data.role !== undefined) {
      updates.push(`role = $${paramIndex}`);
      params.push(data.role);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      params.push(data.status);
      paramIndex++;
    }

    if (data.phone !== undefined) {
      updates.push(`phone = $${paramIndex}`);
      params.push(data.phone);
      paramIndex++;
    }

    if (data.avatarUrl !== undefined) {
      updates.push(`avatar_url = $${paramIndex}`);
      params.push(data.avatarUrl);
      paramIndex++;
    }

    if (data.organizationId !== undefined) {
      updates.push(`organization_id = $${paramIndex}`);
      params.push(data.organizationId);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = NOW()`);
    params.push(id); // Add ID as last parameter

    const sql = `
      UPDATE users 
      SET ${updates.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const rows = await this.db.query<User>(sql, params);
    const user = rows[0];

    if (!user) {
      throw new Error('User not found');
    }

    // Log user update activity
    await this.logUserActivity(user.id, 'user_updated', data);

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Soft delete - mark as deleted instead of removing
    const sql = `
      UPDATE users 
      SET status = 'deleted', updated_at = NOW() 
      WHERE id = $1 AND status != 'deleted'
      RETURNING id
    `;

    const rows = await this.db.query(sql, [id]);
    
    if (rows.length === 0) {
      throw new Error('User not found or already deleted');
    }

    // Log user deletion activity
    await this.logUserActivity(id, 'user_deleted', {});
  }

  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
  }> {
    const sql = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
        COUNT(CASE WHEN created_at >= DATE_TRUNC('month', NOW()) THEN 1 END) as new_this_month
      FROM users 
      WHERE status != 'deleted'
    `;

    const rows = await this.db.query(sql);
    return {
      total: parseInt(rows[0].total),
      active: parseInt(rows[0].active),
      inactive: parseInt(rows[0].inactive),
      newThisMonth: parseInt(rows[0].new_this_month),
    };
  }

  async searchUsers(query: string, limit: number = 10): Promise<User[]> {
    const sql = `
      SELECT 
        u.id, u.email, u.name, u.role, u.status, u.avatar_url,
        o.name as organization_name
      FROM users u
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE (u.name ILIKE $1 OR u.email ILIKE $1)
        AND u.status != 'deleted'
      ORDER BY 
        CASE WHEN u.name ILIKE $1 THEN 1 ELSE 2 END,
        u.name
      LIMIT $2
    `;

    return this.db.query<User>(sql, [`%${query}%`, limit]);
  }

  async logUserActivity(userId: string, action: string, metadata: any): Promise<void> {
    const sql = `
      INSERT INTO user_activities (
        id, user_id, action, metadata, created_at
      ) VALUES (
        $1, $2, $3, $4, NOW()
      )
    `;

    await this.db.query(sql, [uuidv4(), userId, action, JSON.stringify(metadata)]);
  }

  async getUserActivities(userId: string, limit: number = 50): Promise<any[]> {
    const sql = `
      SELECT action, metadata, created_at
      FROM user_activities
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;

    return this.db.query(sql, [userId, limit]);
  }
}

// Export singleton instance
let userServiceInstance: UserService | null = null;

export const getUserService = async (): Promise<UserService> => {
  if (!userServiceInstance) {
    const { initializeDatabase } = await import('@/lib/database/connection');
    const db = await initializeDatabase();
    userServiceInstance = new UserService(db);
  }
  return userServiceInstance;
};
