import apiClient from './client';
import { Project, ProjectStats, Activity, Document } from '@/types/project';

export const projectsApi = {
  async getProjects(): Promise<Project[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockProjects: Project[] = [
      {
        id: '1',
        name: 'Website Redesign',
        description: 'Complete redesign of the company website with modern UI/UX',
        status: 'in-progress',
        priority: 'high',
        progress: 65,
        startDate: '2024-05-01T00:00:00Z',
        estimatedEndDate: '2024-07-15T00:00:00Z',
        budget: 25000,
        spent: 16250,
        clientId: '1',
        teamMembers: [
          {
            id: '1',
            name: 'Sarah Johnson',
            email: 'sarah@nexus.com',
            role: 'Project Manager',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            isLead: true,
          },
          {
            id: '2',
            name: 'Mike Chen',
            email: 'mike@nexus.com',
            role: 'UI/UX Designer',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            isLead: false,
          },
          {
            id: '3',
            name: 'Emily Rodriguez',
            email: 'emily@nexus.com',
            role: 'Frontend Developer',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
            isLead: false,
          },
        ],
        tags: ['web', 'design', 'frontend'],
        createdAt: '2024-05-01T10:00:00Z',
        updatedAt: '2024-06-20T14:30:00Z',
        milestones: [
          {
            id: '1',
            title: 'Design Phase',
            description: 'Complete UI/UX design and wireframes',
            dueDate: '2024-05-30T00:00:00Z',
            status: 'completed',
            progress: 100,
            tasks: [],
          },
          {
            id: '2',
            title: 'Development Phase',
            description: 'Frontend development and integration',
            dueDate: '2024-06-30T00:00:00Z',
            status: 'in-progress',
            progress: 70,
            tasks: [],
          },
          {
            id: '3',
            title: 'Testing & Launch',
            description: 'Quality assurance and deployment',
            dueDate: '2024-07-15T00:00:00Z',
            status: 'pending',
            progress: 0,
            tasks: [],
          },
        ],
        documents: [],
        activities: [],
      },
      {
        id: '2',
        name: 'Mobile App Development',
        description: 'Native mobile application for iOS and Android',
        status: 'planning',
        priority: 'medium',
        progress: 15,
        startDate: '2024-06-15T00:00:00Z',
        estimatedEndDate: '2024-09-30T00:00:00Z',
        budget: 45000,
        spent: 6750,
        clientId: '1',
        teamMembers: [
          {
            id: '4',
            name: 'David Kim',
            email: 'david@nexus.com',
            role: 'Mobile Developer',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
            isLead: true,
          },
        ],
        tags: ['mobile', 'ios', 'android'],
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-22T16:45:00Z',
        milestones: [
          {
            id: '4',
            title: 'Requirements Analysis',
            description: 'Gather and analyze requirements',
            dueDate: '2024-07-01T00:00:00Z',
            status: 'in-progress',
            progress: 60,
            tasks: [],
          },
        ],
        documents: [],
        activities: [],
      },
      {
        id: '3',
        name: 'API Integration',
        description: 'Third-party API integration and optimization',
        status: 'completed',
        priority: 'low',
        progress: 100,
        startDate: '2024-04-01T00:00:00Z',
        endDate: '2024-05-15T00:00:00Z',
        estimatedEndDate: '2024-05-15T00:00:00Z',
        budget: 12000,
        spent: 11500,
        clientId: '1',
        teamMembers: [
          {
            id: '5',
            name: 'Alex Thompson',
            email: 'alex@nexus.com',
            role: 'Backend Developer',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            isLead: true,
          },
        ],
        tags: ['api', 'backend', 'integration'],
        createdAt: '2024-04-01T10:00:00Z',
        updatedAt: '2024-05-15T18:00:00Z',
        milestones: [
          {
            id: '5',
            title: 'API Development',
            description: 'Develop and test API endpoints',
            dueDate: '2024-05-15T00:00:00Z',
            status: 'completed',
            progress: 100,
            tasks: [],
          },
        ],
        documents: [],
        activities: [],
      },
    ];

    return mockProjects;
  },

  async getProject(id: string): Promise<Project> {
    const projects = await this.getProjects();
    const project = projects.find(p => p.id === id);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  },

  async getProjectStats(): Promise<ProjectStats> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalProjects: 8,
      activeProjects: 3,
      completedProjects: 4,
      overdueTasks: 2,
      upcomingMilestones: 5,
      totalBudget: 125000,
      totalSpent: 89750,
    };
  },

  async getProjectActivities(projectId: string): Promise<Activity[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockActivities: Activity[] = [
      {
        id: '1',
        type: 'milestone_completed',
        title: 'Design Phase Completed',
        description: 'All design mockups and wireframes have been approved',
        userId: '2',
        userName: 'Mike Chen',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        createdAt: '2024-05-30T16:30:00Z',
      },
      {
        id: '2',
        type: 'document_uploaded',
        title: 'New Document Uploaded',
        description: 'Final design specifications document uploaded',
        userId: '2',
        userName: 'Mike Chen',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        createdAt: '2024-05-29T14:15:00Z',
      },
      {
        id: '3',
        type: 'task_completed',
        title: 'Homepage Mockup Completed',
        description: 'Homepage design mockup has been finalized',
        userId: '2',
        userName: 'Mike Chen',
        userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        createdAt: '2024-05-28T11:45:00Z',
      },
    ];

    return mockActivities;
  },

  async getProjectDocuments(projectId: string): Promise<Document[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockDocuments: Document[] = [
      {
        id: '1',
        name: 'Project Requirements.pdf',
        type: 'application/pdf',
        size: 2048576,
        url: '/documents/project-requirements.pdf',
        uploadedBy: 'Sarah Johnson',
        uploadedAt: '2024-05-01T10:00:00Z',
        version: 2,
        status: 'approved',
        approvals: [
          {
            id: '1',
            userId: '1',
            userName: 'John Doe',
            status: 'approved',
            comment: 'Looks good to proceed',
            approvedAt: '2024-05-02T09:30:00Z',
          },
        ],
        tags: ['requirements', 'specifications'],
      },
      {
        id: '2',
        name: 'Design Mockups.fig',
        type: 'application/figma',
        size: 15728640,
        url: '/documents/design-mockups.fig',
        uploadedBy: 'Mike Chen',
        uploadedAt: '2024-05-15T14:30:00Z',
        version: 3,
        status: 'approved',
        approvals: [
          {
            id: '2',
            userId: '1',
            userName: 'John Doe',
            status: 'approved',
            comment: 'Great design direction!',
            approvedAt: '2024-05-16T10:15:00Z',
          },
        ],
        tags: ['design', 'mockups', 'ui'],
      },
      {
        id: '3',
        name: 'Technical Specifications.docx',
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 1048576,
        url: '/documents/tech-specs.docx',
        uploadedBy: 'Emily Rodriguez',
        uploadedAt: '2024-06-01T16:00:00Z',
        version: 1,
        status: 'review',
        approvals: [
          {
            id: '3',
            userId: '1',
            userName: 'John Doe',
            status: 'pending',
          },
        ],
        tags: ['technical', 'specifications'],
      },
    ];

    return mockDocuments;
  },

  async approveDocument(documentId: string, comment?: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    // Document approved successfully
  },

  async rejectDocument(documentId: string, comment: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    // Document rejected successfully
  },
};
