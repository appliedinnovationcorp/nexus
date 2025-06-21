// User GraphQL Types

import { ObjectType, Field, ID, InputType, Int } from 'type-graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  role!: string;

  @Field()
  isActive!: boolean;

  @Field({ nullable: true })
  lastLoginAt?: Date;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;

  @Field({ nullable: true })
  organizationId?: string;

  // Field resolvers will populate these
  @Field(() => [UserActivity], { nullable: true })
  activities?: UserActivity[];
}

@ObjectType()
export class UserActivity {
  @Field(() => ID)
  id!: string;

  @Field()
  activityType!: string;

  @Field()
  description!: string;

  @Field(() => Object)
  metadata!: Record<string, any>;

  @Field()
  timestamp!: Date;

  @Field({ nullable: true })
  ipAddress?: string;

  @Field({ nullable: true })
  userAgent?: string;
}

@ObjectType()
export class UserRoleCount {
  @Field()
  role!: string;

  @Field(() => Int)
  count!: number;
}

@ObjectType()
export class UserStats {
  @Field(() => Int)
  totalUsers!: number;

  @Field(() => Int)
  activeUsers!: number;

  @Field(() => Int)
  inactiveUsers!: number;

  @Field(() => [UserRoleCount])
  usersByRole!: UserRoleCount[];

  @Field(() => Int)
  newUsersThisMonth!: number;

  @Field(() => Int)
  newUsersThisWeek!: number;

  @Field()
  averageLoginFrequency!: number;
}

@InputType()
export class CreateUserInput {
  @Field()
  email!: string;

  @Field()
  name!: string;

  @Field()
  role!: string;

  @Field({ nullable: true })
  organizationId?: string;
}

@InputType()
export class UpdateUserInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  email?: string;
}

@InputType()
export class UsersFilter {
  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => Int, { nullable: true })
  offset?: number;

  @Field({ nullable: true })
  role?: string;

  @Field({ nullable: true })
  isActive?: boolean;

  @Field({ nullable: true })
  organizationId?: string;

  @Field({ nullable: true })
  searchTerm?: string;
}

@InputType()
export class ChangePasswordInput {
  @Field()
  currentPassword!: string;

  @Field()
  newPassword!: string;
}

@InputType()
export class ResetPasswordInput {
  @Field()
  resetToken!: string;

  @Field()
  newPassword!: string;
}
