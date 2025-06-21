import { User, CreateUserData, UpdateUserData, UserFilters } from "@/types/user";

// Mock API functions - replace with actual API calls
const mockUsers: User[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    status: "active",
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-15T10:00:00Z",
    lastLoginAt: "2024-06-20T14:30:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    status: "active",
    createdAt: "2024-02-10T09:15:00Z",
    updatedAt: "2024-02-10T09:15:00Z",
    lastLoginAt: "2024-06-19T16:45:00Z",
  },
  {
    id: "3",
    name: "Bob Johnson",
    email: "bob@example.com",
    role: "moderator",
    status: "inactive",
    createdAt: "2024-03-05T11:30:00Z",
    updatedAt: "2024-03-05T11:30:00Z",
  },
  {
    id: "4",
    name: "Alice Brown",
    email: "alice@example.com",
    role: "user",
    status: "active",
    createdAt: "2024-04-12T08:20:00Z",
    updatedAt: "2024-04-12T08:20:00Z",
    lastLoginAt: "2024-06-21T10:15:00Z",
  },
];

export async function getUsers(filters: UserFilters = {}): Promise<User[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  let filteredUsers = [...mockUsers];
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredUsers = filteredUsers.filter(user => 
      user.name.toLowerCase().includes(searchLower) ||
      user.email.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.role) {
    filteredUsers = filteredUsers.filter(user => user.role === filters.role);
  }
  
  if (filters.status) {
    filteredUsers = filteredUsers.filter(user => user.status === filters.status);
  }
  
  return filteredUsers;
}

export async function getUserById(id: string): Promise<User | null> {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockUsers.find(user => user.id === id) || null;
}

export async function createUser(data: CreateUserData): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newUser: User = {
    id: (mockUsers.length + 1).toString(),
    ...data,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockUsers.push(newUser);
  return newUser;
}

export async function updateUser(id: string, data: UpdateUserData): Promise<User> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const userIndex = mockUsers.findIndex(user => user.id === id);
  if (userIndex === -1) {
    throw new Error("User not found");
  }
  
  const currentUser = mockUsers[userIndex]!;
  const updatedUser: User = {
    id: currentUser.id,
    name: data.name ?? currentUser.name,
    email: data.email ?? currentUser.email,
    role: data.role ?? currentUser.role,
    status: data.status ?? currentUser.status,
    createdAt: currentUser.createdAt,
    updatedAt: new Date().toISOString(),
    lastLoginAt: currentUser.lastLoginAt,
    avatar: currentUser.avatar,
  };
  
  mockUsers[userIndex] = updatedUser;
  return updatedUser;
}

export async function deleteUser(id: string): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const userIndex = mockUsers.findIndex(user => user.id === id);
  if (userIndex === -1) {
    throw new Error("User not found");
  }
  
  mockUsers.splice(userIndex, 1);
}
