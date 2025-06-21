// User GraphQL Resolver

import { Resolver, Query, Mutation, Arg, Ctx, Authorized, FieldResolver, Root } from 'type-graphql';
import { UserCommandHandlers } from '../../../application/handlers/user-command-handlers';
import { UserQueryHandlers } from '../../../application/handlers/user-query-handlers';
import { 
  User, 
  CreateUserInput, 
  UpdateUserInput, 
  UsersFilter,
  UserStats,
  UserActivity
} from '../types/user-types';
import { GraphQLContext } from '../types/context';

@Resolver(User)
export class UserResolver {
  constructor(
    private commandHandlers: UserCommandHandlers,
    private queryHandlers: UserQueryHandlers
  ) {}

  @Query(() => User, { nullable: true })
  async user(@Arg('id') id: string, @Ctx() ctx: GraphQLContext): Promise<User | null> {
    const user = await this.queryHandlers.handleGetUserById({ userId: id });
    
    if (!user) {
      return null;
    }

    // Users can only see their own data unless they're admin/moderator
    if (ctx.user.id !== user.id && !['admin', 'moderator'].includes(ctx.user.role)) {
      throw new Error('Insufficient permissions');
    }

    return this.mapToGraphQLUser(user);
  }

  @Query(() => User, { nullable: true })
  async userByEmail(@Arg('email') email: string, @Ctx() ctx: GraphQLContext): Promise<User | null> {
    // Only admins can search by email
    if (ctx.user.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    const user = await this.queryHandlers.handleGetUserByEmail({ email });
    return user ? this.mapToGraphQLUser(user) : null;
  }

  @Query(() => [User])
  @Authorized(['admin', 'moderator'])
  async users(
    @Arg('filter', { nullable: true }) filter?: UsersFilter,
    @Ctx() ctx?: GraphQLContext
  ): Promise<User[]> {
    const users = await this.queryHandlers.handleGetUsers({
      limit: filter?.limit,
      offset: filter?.offset,
      role: filter?.role,
      isActive: filter?.isActive,
      organizationId: filter?.organizationId,
      searchTerm: filter?.searchTerm
    });

    return users.map(user => this.mapToGraphQLUser(user));
  }

  @Query(() => UserStats)
  @Authorized(['admin'])
  async userStats(
    @Arg('organizationId', { nullable: true }) organizationId?: string,
    @Arg('startDate', { nullable: true }) startDate?: Date,
    @Arg('endDate', { nullable: true }) endDate?: Date
  ): Promise<UserStats> {
    const stats = await this.queryHandlers.handleGetUserStats({
      organizationId,
      startDate,
      endDate
    });

    return {
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      inactiveUsers: stats.inactiveUsers,
      usersByRole: Object.entries(stats.usersByRole).map(([role, count]) => ({
        role,
        count
      })),
      newUsersThisMonth: stats.newUsersThisMonth,
      newUsersThisWeek: stats.newUsersThisWeek,
      averageLoginFrequency: stats.averageLoginFrequency
    };
  }

  @Mutation(() => User)
  @Authorized(['admin'])
  async createUser(@Arg('input') input: CreateUserInput): Promise<User> {
    const userId = crypto.randomUUID();
    
    await this.commandHandlers.handleCreateUser({
      id: userId,
      email: input.email,
      name: input.name,
      role: input.role,
      organizationId: input.organizationId
    });

    const user = await this.queryHandlers.handleGetUserById({ userId });
    if (!user) {
      throw new Error('Failed to create user');
    }

    return this.mapToGraphQLUser(user);
  }

  @Mutation(() => User)
  async updateUser(
    @Arg('id') id: string,
    @Arg('input') input: UpdateUserInput,
    @Ctx() ctx: GraphQLContext
  ): Promise<User> {
    // Users can only update their own data unless they're admin
    if (ctx.user.id !== id && ctx.user.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    await this.commandHandlers.handleUpdateUser({
      userId: id,
      name: input.name,
      email: input.email
    });

    const user = await this.queryHandlers.handleGetUserById({ userId: id });
    if (!user) {
      throw new Error('User not found');
    }

    return this.mapToGraphQLUser(user);
  }

  @Mutation(() => User)
  @Authorized(['admin'])
  async changeUserRole(
    @Arg('id') id: string,
    @Arg('role') role: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<User> {
    await this.commandHandlers.handleChangeUserRole({
      userId: id,
      newRole: role,
      changedBy: ctx.user.id
    });

    const user = await this.queryHandlers.handleGetUserById({ userId: id });
    if (!user) {
      throw new Error('User not found');
    }

    return this.mapToGraphQLUser(user);
  }

  @Mutation(() => Boolean)
  @Authorized(['admin'])
  async deactivateUser(
    @Arg('id') id: string,
    @Arg('reason') reason: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<boolean> {
    await this.commandHandlers.handleDeactivateUser({
      userId: id,
      reason,
      deactivatedBy: ctx.user.id
    });

    return true;
  }

  @Mutation(() => Boolean)
  @Authorized(['admin'])
  async activateUser(
    @Arg('id') id: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<boolean> {
    await this.commandHandlers.handleActivateUser({
      userId: id,
      activatedBy: ctx.user.id
    });

    return true;
  }

  @Mutation(() => Boolean)
  async recordLogin(
    @Arg('id') id: string,
    @Ctx() ctx: GraphQLContext
  ): Promise<boolean> {
    // Users can only record their own login
    if (ctx.user.id !== id) {
      throw new Error('Insufficient permissions');
    }

    await this.commandHandlers.handleRecordUserLogin({
      userId: id,
      loginAt: new Date(),
      ipAddress: ctx.req.ip,
      userAgent: ctx.req.get('User-Agent')
    });

    return true;
  }

  // Field resolvers
  @FieldResolver(() => [UserActivity])
  async activities(
    @Root() user: User,
    @Arg('limit', { nullable: true }) limit?: number,
    @Arg('offset', { nullable: true }) offset?: number,
    @Ctx() ctx?: GraphQLContext
  ): Promise<UserActivity[]> {
    // Users can only see their own activity unless they're admin
    if (ctx?.user.id !== user.id && ctx?.user.role !== 'admin') {
      throw new Error('Insufficient permissions');
    }

    const activities = await this.queryHandlers.handleGetUserActivity({
      userId: user.id,
      limit,
      offset
    });

    return activities.map(activity => ({
      id: activity.id,
      activityType: activity.activityType,
      description: activity.description,
      metadata: activity.metadata,
      timestamp: activity.timestamp,
      ipAddress: activity.ipAddress,
      userAgent: activity.userAgent
    }));
  }

  private mapToGraphQLUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizationId: user.organizationId
    };
  }
}
