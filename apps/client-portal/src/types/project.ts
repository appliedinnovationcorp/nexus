export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  progress: number;
  startDate: string;
  endDate?: string;
  estimatedEndDate: string;
  budget: number;
  spent: number;
  clientId: string;
  teamMembers: TeamMember[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
  milestones: Milestone[];
  documents: Document[];
  activities: Activity[];
}

export type ProjectStatus = 
  | 'planning' 
  | 'in-progress' 
  | 'review' 
  | 'completed' 
  | 'on-hold' 
  | 'cancelled';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  isLead: boolean;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  progress: number;
  tasks: Task[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'review' | 'completed';
  priority: ProjectPriority;
  assignee?: TeamMember;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
  status: 'draft' | 'review' | 'approved' | 'rejected';
  approvals: DocumentApproval[];
  tags: string[];
}

export interface DocumentApproval {
  id: string;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  approvedAt?: string;
}

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt: string;
  metadata?: Record<string, any>;
}

export type ActivityType = 
  | 'project_created'
  | 'project_updated'
  | 'milestone_completed'
  | 'task_completed'
  | 'document_uploaded'
  | 'document_approved'
  | 'comment_added'
  | 'team_member_added'
  | 'status_changed';

export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  overdueTasks: number;
  upcomingMilestones: number;
  totalBudget: number;
  totalSpent: number;
}
