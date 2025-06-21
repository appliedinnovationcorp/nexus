// User Query Handlers - CQRS Read Side

import { DatabaseAdapter } from '@repo/infrastructure-database';
import {
  GetUserByIdQuery,
  GetUserByEmailQuery,
  GetUsersQuery,
  GetUserStatsQuery,
  GetUserActivityQuery,
  GetUserPermissionsQuery,
  UserReadModel,
  UserStatsReadModel,
  UserActivityReadModel,
  UserPermissionReadModel
} from '../queries/user-queries';

export class UserQueryHandlers {
  constructor(
    private readonly readDb: DatabaseAdapter
  ) {}

  async handleGetUserById(query: GetUserByIdQuery): Promise<UserReadModel | null> {
    const rows = await this.readDb.query<any>(`
      SELECT 
        id,
        data->>'email' as email,
        data->>'name' as name,
        data->>'role' as role,
        (data->>'isActive')::boolean as is_active,
        (data->>'lastLoginAt')::timestamp as last_login_at,
        created_at,
        updated_at,
        data->>'organizationId' as organization_id
      FROM user_snapshots 
      WHERE id = $1
    `, [query.userId]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return this.mapToUserReadModel(row);
  }

  async handleGetUserByEmail(query: GetUserByEmailQuery): Promise<UserReadModel | null> {
    const rows = await this.readDb.query<any>(`
      SELECT 
        id,
        data->>'email' as email,
        data->>'name' as name,
        data->>'role' as role,
        (data->>'isActive')::boolean as is_active,
        (data->>'lastLoginAt')::timestamp as last_login_at,
        created_at,
        updated_at,
        data->>'organizationId' as organization_id
      FROM user_snapshots 
      WHERE data->>'email' = $1
    `, [query.email]);

    if (rows.length === 0) {
      return null;
    }

    const row = rows[0];
    return this.mapToUserReadModel(row);
  }

  async handleGetUsers(query: GetUsersQuery): Promise<UserReadModel[]> {
    let sql = `
      SELECT 
        id,
        data->>'email' as email,
        data->>'name' as name,
        data->>'role' as role,
        (data->>'isActive')::boolean as is_active,
        (data->>'lastLoginAt')::timestamp as last_login_at,
        created_at,
        updated_at,
        data->>'organizationId' as organization_id
      FROM user_snapshots 
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (query.role) {
      sql += ` AND data->>'role' = $${paramIndex}`;
      params.push(query.role);
      paramIndex++;
    }

    if (query.isActive !== undefined) {
      sql += ` AND (data->>'isActive')::boolean = $${paramIndex}`;
      params.push(query.isActive);
      paramIndex++;
    }

    if (query.organizationId) {
      sql += ` AND data->>'organizationId' = $${paramIndex}`;
      params.push(query.organizationId);
      paramIndex++;
    }

    if (query.searchTerm) {
      sql += ` AND (data->>'name' ILIKE $${paramIndex} OR data->>'email' ILIKE $${paramIndex})`;
      params.push(`%${query.searchTerm}%`);
      paramIndex++;
    }

    sql += ` ORDER BY updated_at DESC`;

    if (query.limit) {
      sql += ` LIMIT $${paramIndex}`;
      params.push(query.limit);
      paramIndex++;
    }

    if (query.offset) {
      sql += ` OFFSET $${paramIndex}`;
      params.push(query.offset);
      paramIndex++;
    }

    const rows = await this.readDb.query<any>(sql, params);
    return rows.map(row => this.mapToUserReadModel(row));
  }

  async handleGetUserStats(query: GetUserStatsQuery): Promise<UserStatsReadModel> {
    let whereClause = '1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (query.organizationId) {
      whereClause += ` AND data->>'organizationId' = $${paramIndex}`;
      params.push(query.organizationId);
      paramIndex++;
    }

    // Total users
    const totalUsersResult = await this.readDb.query<any>(`
      SELECT COUNT(*) as count FROM user_snapshots WHERE ${whereClause}
    `, params);

    // Active users
    const activeUsersResult = await this.readDb.query<any>(`
      SELECT COUNT(*) as count FROM user_snapshots 
      WHERE ${whereClause} AND (data->>'isActive')::boolean = true
    `, params);

    // Users by role
    const usersByRoleResult = await this.readDb.query<any>(`
      SELECT data->>'role' as role, COUNT(*) as count 
      FROM user_snapshots 
      WHERE ${whereClause} AND (data->>'isActive')::boolean = true
      GROUP BY data->>'role'
    `, params);

    // New users this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);

    const newUsersThisMonthResult = await this.readDb.query<any>(`
      SELECT COUNT(*) as count FROM user_snapshots 
      WHERE ${whereClause} AND created_at >= $${paramIndex}
    `, [...params, thisMonth]);

    // New users this week
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - thisWeek.getDay());
    thisWeek.setHours(0, 0, 0, 0);

    const newUsersThisWeekResult = await this.readDb.query<any>(`
      SELECT COUNT(*) as count FROM user_snapshots 
      WHERE ${whereClause} AND created_at >= $${paramIndex}
    `, [...params, thisWeek]);

    const totalUsers = parseInt(totalUsersResult[0].count, 10);
    const activeUsers = parseInt(activeUsersResult[0].count, 10);
    const usersByRole: Record<string, number> = {};
    
    usersByRoleResult.forEach(row => {
      usersByRole[row.role] = parseInt(row.count, 10);
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole,
      newUsersThisMonth: parseInt(newUsersThisMonthResult[0].count, 10),
      newUsersThisWeek: parseInt(newUsersThisWeekResult[0].count, 10),
      averageLoginFrequency: 0 // Would need additional tracking
    };
  }

  async handleGetUserActivity(query: GetUserActivityQuery): Promise<UserActivityReadModel[]> {
    // This would typically come from a separate activity/audit log table
    const sql = `
      SELECT 
        id,
        user_id,
        activity_type,
        description,
        metadata,
        timestamp,
        ip_address,
        user_agent
      FROM user_activities 
      WHERE user_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const limit = query.limit || 50;
    const offset = query.offset || 0;

    const rows = await this.readDb.query<any>(sql, [query.userId, limit, offset]);

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      activityType: row.activity_type,
      description: row.description,
      metadata: row.metadata || {},
      timestamp: row.timestamp,
      ipAddress: row.ip_address,
      userAgent: row.user_agent
    }));
  }

  async handleGetUserPermissions(query: GetUserPermissionsQuery): Promise<UserPermissionReadModel[]> {
    let sql = `
      SELECT 
        user_id,
        resource_type,
        resource_id,
        permissions,
        granted_at,
        granted_by,
        expires_at
      FROM user_permissions 
      WHERE user_id = $1
    `;

    const params: any[] = [query.userId];
    let paramIndex = 2;

    if (query.resourceType) {
      sql += ` AND resource_type = $${paramIndex}`;
      params.push(query.resourceType);
      paramIndex++;
    }

    if (query.resourceId) {
      sql += ` AND resource_id = $${paramIndex}`;
      params.push(query.resourceId);
      paramIndex++;
    }

    sql += ` ORDER BY granted_at DESC`;

    const rows = await this.readDb.query<any>(sql, params);

    return rows.map(row => ({
      userId: row.user_id,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      permissions: row.permissions || [],
      grantedAt: row.granted_at,
      grantedBy: row.granted_by,
      expiresAt: row.expires_at
    }));
  }

  private mapToUserReadModel(row: any): UserReadModel {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      lastLoginAt: row.last_login_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      organizationId: row.organization_id
    };
  }
}
