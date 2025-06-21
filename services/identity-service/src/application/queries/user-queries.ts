// User Queries - CQRS Read Side

export interface GetUserByIdQuery {
  readonly userId: string;
}

export interface GetUserByEmailQuery {
  readonly email: string;
}

export interface GetUsersQuery {
  readonly limit?: number;
  readonly offset?: number;
  readonly role?: string;
  readonly isActive?: boolean;
  readonly organizationId?: string;
  readonly searchTerm?: string;
}

export interface GetUserStatsQuery {
  readonly organizationId?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
}

export interface GetUserActivityQuery {
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly activityType?: string;
}

export interface GetUserPermissionsQuery {
  readonly userId: string;
  readonly resourceType?: string;
  readonly resourceId?: string;
}

// Read Models (DTOs)
export interface UserReadModel {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly role: string;
  readonly isActive: boolean;
  readonly lastLoginAt?: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly organizationId?: string;
  readonly preferences?: UserPreferences;
  readonly profile?: UserProfile;
}

export interface UserPreferences {
  readonly theme: 'light' | 'dark' | 'auto';
  readonly language: string;
  readonly timezone: string;
  readonly notifications: {
    readonly email: boolean;
    readonly push: boolean;
    readonly sms: boolean;
  };
}

export interface UserProfile {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly avatar?: string;
  readonly bio?: string;
  readonly location?: string;
  readonly website?: string;
  readonly socialLinks?: {
    readonly twitter?: string;
    readonly linkedin?: string;
    readonly github?: string;
  };
}

export interface UserStatsReadModel {
  readonly totalUsers: number;
  readonly activeUsers: number;
  readonly inactiveUsers: number;
  readonly usersByRole: Record<string, number>;
  readonly newUsersThisMonth: number;
  readonly newUsersThisWeek: number;
  readonly averageLoginFrequency: number;
}

export interface UserActivityReadModel {
  readonly id: string;
  readonly userId: string;
  readonly activityType: string;
  readonly description: string;
  readonly metadata: Record<string, any>;
  readonly timestamp: Date;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface UserPermissionReadModel {
  readonly userId: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly permissions: string[];
  readonly grantedAt: Date;
  readonly grantedBy: string;
  readonly expiresAt?: Date;
}
