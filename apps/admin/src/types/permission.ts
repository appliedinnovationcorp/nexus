export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage";
  scope: "global" | "organization" | "project" | "own";
  category: "user" | "content" | "project" | "organization" | "system" | "report";
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  type: "system" | "custom";
  permissions: Permission[];
  userCount: number;
  organizationId?: string;
  organizationName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPermission {
  userId: string;
  userName: string;
  userEmail: string;
  roles: Role[];
  directPermissions: Permission[];
  organizationId?: string;
  organizationName?: string;
  lastUpdated: string;
}

export interface CreateRoleData {
  name: string;
  description: string;
  permissionIds: string[];
  organizationId?: string;
}

export interface UpdateRoleData {
  name?: string;
  description?: string;
  permissionIds?: string[];
}

export interface AssignRoleData {
  userId: string;
  roleIds: string[];
  organizationId?: string;
}

export interface PermissionFilters {
  search?: string;
  category?: string;
  resource?: string;
  action?: string;
  scope?: string;
  page?: number;
  limit?: number;
}

export interface RoleFilters {
  search?: string;
  type?: string;
  organizationId?: string;
  page?: number;
  limit?: number;
}
