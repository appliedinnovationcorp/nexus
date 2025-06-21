import { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationFilters } from "@/types/organization";

const mockOrganizations: Organization[] = [
  {
    id: "1",
    name: "Acme Corporation",
    domain: "acme.com",
    type: "enterprise",
    status: "active",
    memberCount: 150,
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-10T08:00:00Z",
    description: "Leading technology solutions provider",
    website: "https://acme.com",
    settings: {
      allowPublicSignup: false,
      requireEmailVerification: true,
      maxMembers: 500,
    },
  },
  {
    id: "2",
    name: "StartupXYZ",
    domain: "startupxyz.io",
    type: "startup",
    status: "active",
    memberCount: 12,
    createdAt: "2024-02-15T10:30:00Z",
    updatedAt: "2024-02-15T10:30:00Z",
    description: "Innovative fintech startup",
    website: "https://startupxyz.io",
    settings: {
      allowPublicSignup: true,
      requireEmailVerification: true,
      maxMembers: 50,
    },
  },
  {
    id: "3",
    name: "Global Nonprofit",
    domain: "globalnonprofit.org",
    type: "nonprofit",
    status: "active",
    memberCount: 75,
    createdAt: "2024-03-01T12:00:00Z",
    updatedAt: "2024-03-01T12:00:00Z",
    description: "Making the world a better place",
    website: "https://globalnonprofit.org",
    settings: {
      allowPublicSignup: true,
      requireEmailVerification: false,
    },
  },
  {
    id: "4",
    name: "Business Solutions Inc",
    domain: "bizsolve.com",
    type: "business",
    status: "inactive",
    memberCount: 45,
    createdAt: "2024-04-05T14:15:00Z",
    updatedAt: "2024-04-05T14:15:00Z",
    description: "Professional business consulting",
    settings: {
      allowPublicSignup: false,
      requireEmailVerification: true,
      maxMembers: 100,
    },
  },
];

export async function getOrganizations(filters: OrganizationFilters = {}): Promise<Organization[]> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  let filteredOrgs = [...mockOrganizations];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredOrgs = filteredOrgs.filter(org => 
      org.name.toLowerCase().includes(searchLower) ||
      org.domain.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.type) {
    filteredOrgs = filteredOrgs.filter(org => org.type === filters.type);
  }
  
  if (filters.status) {
    filteredOrgs = filteredOrgs.filter(org => org.status === filters.status);
  }
  
  return filteredOrgs;
}

export async function getOrganizationById(id: string): Promise<Organization | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockOrganizations.find(org => org.id === id) || null;
}

export async function createOrganization(data: CreateOrganizationData): Promise<Organization> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newOrg: Organization = {
    id: (mockOrganizations.length + 1).toString(),
    ...data,
    status: "active",
    memberCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockOrganizations.push(newOrg);
  return newOrg;
}

export async function updateOrganization(id: string, data: UpdateOrganizationData): Promise<Organization> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const orgIndex = mockOrganizations.findIndex(org => org.id === id);
  if (orgIndex === -1) {
    throw new Error("Organization not found");
  }
  
  const currentOrg = mockOrganizations[orgIndex]!;
  const updatedOrg: Organization = {
    id: currentOrg.id,
    name: data.name ?? currentOrg.name,
    domain: data.domain ?? currentOrg.domain,
    type: data.type ?? currentOrg.type,
    status: data.status ?? currentOrg.status,
    memberCount: currentOrg.memberCount,
    createdAt: currentOrg.createdAt,
    updatedAt: new Date().toISOString(),
    description: data.description ?? currentOrg.description,
    website: data.website ?? currentOrg.website,
    logo: currentOrg.logo,
    settings: data.settings ? { ...currentOrg.settings, ...data.settings } : currentOrg.settings,
  };
  
  mockOrganizations[orgIndex] = updatedOrg;
  return updatedOrg;
}

export async function deleteOrganization(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const orgIndex = mockOrganizations.findIndex(org => org.id === id);
  if (orgIndex === -1) {
    throw new Error("Organization not found");
  }
  
  mockOrganizations.splice(orgIndex, 1);
}
