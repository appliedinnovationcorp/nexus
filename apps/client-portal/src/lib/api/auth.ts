import apiClient from './client';
import { Client } from '@/types/client';

interface LoginResponse {
  token: string;
  client: Client;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company: string;
  phone?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@client.com' && password === 'password') {
      const mockClient: Client = {
        id: '1',
        email: 'demo@client.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Corporation',
        phone: '+1 (555) 123-4567',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        timezone: 'America/New_York',
        language: 'en',
        notifications: {
          email: {
            projectUpdates: true,
            invoices: true,
            messages: true,
            systemUpdates: false,
          },
          push: {
            projectUpdates: true,
            messages: true,
            reminders: true,
          },
        },
        subscription: {
          plan: 'professional',
          status: 'active',
          billingCycle: 'monthly',
          nextBillingDate: '2024-07-25',
          features: ['unlimited_projects', 'advanced_analytics', 'priority_support'],
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-06-20T14:30:00Z',
        lastLoginAt: new Date().toISOString(),
        isActive: true,
        role: 'client',
      };

      return {
        token: 'mock-jwt-token',
        client: mockClient,
      };
    }
    
    throw new Error('Invalid credentials');
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockClient: Client = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      phone: data.phone,
      timezone: 'America/New_York',
      language: 'en',
      notifications: {
        email: {
          projectUpdates: true,
          invoices: true,
          messages: true,
          systemUpdates: true,
        },
        push: {
          projectUpdates: true,
          messages: true,
          reminders: true,
        },
      },
      subscription: {
        plan: 'basic',
        status: 'active',
        billingCycle: 'monthly',
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        features: ['basic_projects', 'standard_support'],
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      role: 'client',
    };

    return {
      token: 'mock-jwt-token',
      client: mockClient,
    };
  },

  async getProfile(): Promise<Client> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockClient: Client = {
      id: '1',
      email: 'demo@client.com',
      firstName: 'John',
      lastName: 'Doe',
      company: 'Acme Corporation',
      phone: '+1 (555) 123-4567',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      timezone: 'America/New_York',
      language: 'en',
      notifications: {
        email: {
          projectUpdates: true,
          invoices: true,
          messages: true,
          systemUpdates: false,
        },
        push: {
          projectUpdates: true,
          messages: true,
          reminders: true,
        },
      },
      subscription: {
        plan: 'professional',
        status: 'active',
        billingCycle: 'monthly',
        nextBillingDate: '2024-07-25',
        features: ['unlimited_projects', 'advanced_analytics', 'priority_support'],
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-20T14:30:00Z',
      lastLoginAt: new Date().toISOString(),
      isActive: true,
      role: 'client',
    };

    return mockClient;
  },

  async updateProfile(data: Partial<Client>): Promise<Client> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentClient = await this.getProfile();
    return {
      ...currentClient,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (currentPassword !== 'password') {
      throw new Error('Current password is incorrect');
    }
    
    // Password changed successfully
  },

  async forgotPassword(email: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Password reset email sent
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Password reset successfully
  },
};
