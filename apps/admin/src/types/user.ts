export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "moderator";
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  avatar?: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  role: "admin" | "user" | "moderator";
  status: "active" | "inactive";
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  role?: "admin" | "user" | "moderator";
  status?: "active" | "inactive";
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}
