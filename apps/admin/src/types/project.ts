export interface Project {
  id: string;
  name: string;
  description: string;
  status: "planning" | "active" | "on-hold" | "completed" | "cancelled";
  priority: "low" | "medium" | "high" | "critical";
  organizationId: string;
  organizationName: string;
  ownerId: string;
  ownerName: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  progress: number; // 0-100
  tags: string[];
  createdAt: string;
  updatedAt: string;
  teamMembers: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  }[];
  milestones: {
    id: string;
    title: string;
    dueDate: string;
    completed: boolean;
  }[];
}

export interface CreateProjectData {
  name: string;
  description: string;
  organizationId: string;
  ownerId: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  priority: "low" | "medium" | "high" | "critical";
  tags: string[];
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  status?: "planning" | "active" | "on-hold" | "completed" | "cancelled";
  priority?: "low" | "medium" | "high" | "critical";
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress?: number;
  tags?: string[];
}

export interface ProjectFilters {
  search?: string;
  status?: string;
  priority?: string;
  organizationId?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
}
