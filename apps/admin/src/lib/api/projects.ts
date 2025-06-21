import { Project, CreateProjectData, UpdateProjectData, ProjectFilters } from "@/types/project";

const mockProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of the company website with modern design and improved UX",
    status: "active",
    priority: "high",
    organizationId: "1",
    organizationName: "Acme Corporation",
    ownerId: "1",
    ownerName: "John Doe",
    startDate: "2024-01-15T00:00:00Z",
    endDate: "2024-06-30T00:00:00Z",
    budget: 50000,
    progress: 65,
    tags: ["web", "design", "ux"],
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-06-20T14:30:00Z",
    teamMembers: [
      { id: "1", name: "John Doe", role: "Project Manager" },
      { id: "2", name: "Jane Smith", role: "Designer" },
      { id: "4", name: "Alice Brown", role: "Developer" },
    ],
    milestones: [
      { id: "1", title: "Design Mockups", dueDate: "2024-02-15T00:00:00Z", completed: true },
      { id: "2", title: "Frontend Development", dueDate: "2024-04-30T00:00:00Z", completed: true },
      { id: "3", title: "Backend Integration", dueDate: "2024-06-15T00:00:00Z", completed: false },
      { id: "4", title: "Testing & Launch", dueDate: "2024-06-30T00:00:00Z", completed: false },
    ],
  },
  {
    id: "2",
    name: "Mobile App Development",
    description: "Native mobile application for iOS and Android platforms",
    status: "planning",
    priority: "critical",
    organizationId: "2",
    organizationName: "StartupXYZ",
    ownerId: "2",
    ownerName: "Jane Smith",
    startDate: "2024-07-01T00:00:00Z",
    endDate: "2024-12-31T00:00:00Z",
    budget: 120000,
    progress: 15,
    tags: ["mobile", "ios", "android", "react-native"],
    createdAt: "2024-05-20T10:00:00Z",
    updatedAt: "2024-06-21T09:15:00Z",
    teamMembers: [
      { id: "2", name: "Jane Smith", role: "Product Manager" },
      { id: "4", name: "Alice Brown", role: "Lead Developer" },
    ],
    milestones: [
      { id: "5", title: "Requirements Gathering", dueDate: "2024-07-15T00:00:00Z", completed: false },
      { id: "6", title: "UI/UX Design", dueDate: "2024-08-30T00:00:00Z", completed: false },
      { id: "7", title: "MVP Development", dueDate: "2024-10-31T00:00:00Z", completed: false },
      { id: "8", title: "Beta Testing", dueDate: "2024-12-15T00:00:00Z", completed: false },
    ],
  },
  {
    id: "3",
    name: "Data Migration",
    description: "Migrate legacy data to new cloud infrastructure",
    status: "completed",
    priority: "medium",
    organizationId: "1",
    organizationName: "Acme Corporation",
    ownerId: "3",
    ownerName: "Bob Johnson",
    startDate: "2024-03-01T00:00:00Z",
    endDate: "2024-05-15T00:00:00Z",
    budget: 25000,
    progress: 100,
    tags: ["data", "migration", "cloud"],
    createdAt: "2024-02-15T12:00:00Z",
    updatedAt: "2024-05-15T16:45:00Z",
    teamMembers: [
      { id: "3", name: "Bob Johnson", role: "Data Engineer" },
      { id: "1", name: "John Doe", role: "Technical Lead" },
    ],
    milestones: [
      { id: "9", title: "Data Assessment", dueDate: "2024-03-15T00:00:00Z", completed: true },
      { id: "10", title: "Migration Scripts", dueDate: "2024-04-15T00:00:00Z", completed: true },
      { id: "11", title: "Data Transfer", dueDate: "2024-05-01T00:00:00Z", completed: true },
      { id: "12", title: "Validation & Testing", dueDate: "2024-05-15T00:00:00Z", completed: true },
    ],
  },
  {
    id: "4",
    name: "Security Audit",
    description: "Comprehensive security assessment and vulnerability testing",
    status: "on-hold",
    priority: "high",
    organizationId: "3",
    organizationName: "Global Nonprofit",
    ownerId: "4",
    ownerName: "Alice Brown",
    startDate: "2024-04-01T00:00:00Z",
    budget: 15000,
    progress: 30,
    tags: ["security", "audit", "compliance"],
    createdAt: "2024-03-20T14:00:00Z",
    updatedAt: "2024-06-10T11:20:00Z",
    teamMembers: [
      { id: "4", name: "Alice Brown", role: "Security Lead" },
      { id: "3", name: "Bob Johnson", role: "Systems Admin" },
    ],
    milestones: [
      { id: "13", title: "Initial Assessment", dueDate: "2024-04-15T00:00:00Z", completed: true },
      { id: "14", title: "Penetration Testing", dueDate: "2024-05-30T00:00:00Z", completed: false },
      { id: "15", title: "Report & Recommendations", dueDate: "2024-06-30T00:00:00Z", completed: false },
    ],
  },
];

export async function getProjects(filters: ProjectFilters = {}): Promise<Project[]> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  let filteredProjects = [...mockProjects];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredProjects = filteredProjects.filter(project => 
      project.name.toLowerCase().includes(searchLower) ||
      project.description.toLowerCase().includes(searchLower) ||
      project.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }
  
  if (filters.status) {
    filteredProjects = filteredProjects.filter(project => project.status === filters.status);
  }
  
  if (filters.priority) {
    filteredProjects = filteredProjects.filter(project => project.priority === filters.priority);
  }
  
  if (filters.organizationId) {
    filteredProjects = filteredProjects.filter(project => project.organizationId === filters.organizationId);
  }
  
  return filteredProjects;
}

export async function getProjectById(id: string): Promise<Project | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockProjects.find(project => project.id === id) || null;
}

export async function createProject(data: CreateProjectData): Promise<Project> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newProject: Project = {
    id: (mockProjects.length + 1).toString(),
    ...data,
    status: "planning",
    progress: 0,
    organizationName: "Sample Organization", // Would be fetched from org API
    ownerName: "Sample Owner", // Would be fetched from user API
    teamMembers: [],
    milestones: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockProjects.push(newProject);
  return newProject;
}

export async function updateProject(id: string, data: UpdateProjectData): Promise<Project> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const projectIndex = mockProjects.findIndex(project => project.id === id);
  if (projectIndex === -1) {
    throw new Error("Project not found");
  }
  
  const currentProject = mockProjects[projectIndex]!;
  const updatedProject: Project = {
    ...currentProject,
    name: data.name ?? currentProject.name,
    description: data.description ?? currentProject.description,
    status: data.status ?? currentProject.status,
    priority: data.priority ?? currentProject.priority,
    startDate: data.startDate ?? currentProject.startDate,
    endDate: data.endDate ?? currentProject.endDate,
    budget: data.budget ?? currentProject.budget,
    progress: data.progress ?? currentProject.progress,
    tags: data.tags ?? currentProject.tags,
    updatedAt: new Date().toISOString(),
  };
  
  mockProjects[projectIndex] = updatedProject;
  return updatedProject;
}

export async function deleteProject(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const projectIndex = mockProjects.findIndex(project => project.id === id);
  if (projectIndex === -1) {
    throw new Error("Project not found");
  }
  
  mockProjects.splice(projectIndex, 1);
}
