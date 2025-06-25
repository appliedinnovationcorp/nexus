export interface Organization {
  id: string;
  name: string;
  domain: string;
  type: "enterprise" | "business" | "nonprofit" | "startup";
  status: "active" | "inactive" | "suspended";
  memberCount: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  website?: string;
  logo?: string;
  settings: {
    allowPublicSignup: boolean;
    requireEmailVerification: boolean;
    maxMembers?: number;
  };
}

export interface CreateOrganizationData {
  name: string;
  domain: string;
  type: "enterprise" | "business" | "nonprofit" | "startup";
  description?: string;
  website?: string;
  settings: {
    allowPublicSignup: boolean;
    requireEmailVerification: boolean;
    maxMembers?: number;
  };
}

export interface UpdateOrganizationData {
  name?: string;
  domain?: string;
  type?: "enterprise" | "business" | "nonprofit" | "startup";
  status?: "active" | "inactive" | "suspended";
  description?: string;
  website?: string;
  settings?: {
    allowPublicSignup?: boolean;
    requireEmailVerification?: boolean;
    maxMembers?: number;
  };
}

export interface OrganizationFilters {
  search?: string;
  type?: string;
  status?: string;
  page?: number;
  limit?: number;
}
