export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "moderator" | "super_admin";
  status: "active" | "inactive" | "suspended" | "deleted";
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  lastSignInAt?: string;
  avatar?: string;
  avatarUrl?: string;
  phone?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  organizationId?: string;
  organizationName?: string;
  mfaEnabled?: boolean;
  provider?: string;
  providerId?: string;
  metadata?: Record<string, any>;
}

export interface CreateUserData {
  name: string;
  email: string;
  role?: "admin" | "user" | "moderator" | "super_admin";
  status?: "active" | "inactive" | "suspended";
  password?: string;
  phone?: string;
  organizationId?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
  provider?: string;
  providerId?: string;
  metadata?: Record<string, any>;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: "admin" | "user" | "moderator" | "super_admin";
  status?: "active" | "inactive" | "suspended";
  phone?: string;
  avatarUrl?: string;
  organizationId?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  lastSignInAt?: string;
  metadata?: Record<string, any>;
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}
