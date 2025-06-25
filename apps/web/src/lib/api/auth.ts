import apiClient from './client';
import { User, LoginResponse, RegisterResponse, EmailConfirmationResponse } from '@/types/user';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
  acceptTerms: boolean;
  acceptMarketing?: boolean;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@nexus.com' && password === 'password') {
      const mockUser: User = {
        id: '1',
        email: 'demo@nexus.com',
        firstName: 'John',
        lastName: 'Doe',
        company: 'Acme Corporation',
        phone: '+1 (555) 123-4567',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        bio: 'Product manager passionate about building great user experiences.',
        website: 'https://johndoe.com',
        location: 'San Francisco, CA',
        timezone: 'America/Los_Angeles',
        language: 'en',
        emailVerified: true,
        profileCompleted: true,
        role: 'user',
        subscription: {
          plan: 'pro',
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: '2024-06-01T00:00:00Z',
          currentPeriodEnd: '2024-07-01T00:00:00Z',
          cancelAtPeriodEnd: false,
          features: ['unlimited_projects', 'priority_support', 'advanced_analytics'],
          limits: {
            projects: -1,
            storage: 100,
            teamMembers: 10,
            apiCalls: 100000,
            customDomains: 3,
            prioritySupport: true,
          },
        },
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'America/Los_Angeles',
          notifications: {
            email: {
              projectUpdates: true,
              teamInvites: true,
              billing: true,
              security: true,
              marketing: false,
              newsletter: true,
            },
            push: {
              projectUpdates: true,
              mentions: true,
              reminders: true,
            },
            inApp: {
              projectUpdates: true,
              teamActivity: true,
              systemUpdates: false,
            },
          },
          privacy: {
            profileVisibility: 'public',
            showEmail: false,
            showLocation: true,
            allowAnalytics: true,
            allowMarketing: false,
          },
          dashboard: {
            layout: 'grid',
            defaultView: 'overview',
            showWelcome: true,
            compactMode: false,
            widgets: [
              {
                id: 'projects',
                type: 'projects',
                position: { x: 0, y: 0 },
                size: { width: 2, height: 1 },
                visible: true,
                settings: { showCompleted: false },
              },
              {
                id: 'activity',
                type: 'activity',
                position: { x: 2, y: 0 },
                size: { width: 1, height: 1 },
                visible: true,
                settings: { limit: 10 },
              },
            ],
          },
        },
        stats: {
          projectsCreated: 12,
          projectsCompleted: 8,
          totalContributions: 156,
          streakDays: 7,
          joinedTeams: 3,
          achievements: [
            {
              id: 'first-project',
              name: 'First Project',
              description: 'Created your first project',
              icon: '🚀',
              unlockedAt: '2024-01-15T10:00:00Z',
              rarity: 'common',
            },
            {
              id: 'team-player',
              name: 'Team Player',
              description: 'Joined 3 teams',
              icon: '👥',
              unlockedAt: '2024-03-20T14:30:00Z',
              rarity: 'rare',
            },
          ],
          activityScore: 85,
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-06-20T14:30:00Z',
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };

      return {
        token: 'mock-jwt-token',
        user: mockUser,
        expiresIn: 86400, // 24 hours
      };
    }
    
    throw new Error('Invalid email or password');
  },

  async register(data: RegisterData): Promise<RegisterResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate email already exists error
    if (data.email === 'existing@nexus.com') {
      throw new Error('An account with this email already exists');
    }
    
    return {
      message: 'Registration successful! Please check your email to verify your account.',
      emailSent: true,
    };
  },

  async confirmEmail(token: string): Promise<EmailConfirmationResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (token === 'invalid-token') {
      throw new Error('Invalid or expired verification token');
    }
    
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: 'newuser@nexus.com',
      firstName: 'New',
      lastName: 'User',
      company: '',
      timezone: 'America/New_York',
      language: 'en',
      emailVerified: true,
      profileCompleted: false,
      role: 'user',
      subscription: {
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        features: ['basic_features'],
        limits: {
          projects: 3,
          storage: 1,
          teamMembers: 2,
          apiCalls: 1000,
          customDomains: 0,
          prioritySupport: false,
        },
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: {
            projectUpdates: true,
            teamInvites: true,
            billing: true,
            security: true,
            marketing: false,
            newsletter: false,
          },
          push: {
            projectUpdates: true,
            mentions: true,
            reminders: false,
          },
          inApp: {
            projectUpdates: true,
            teamActivity: true,
            systemUpdates: true,
          },
        },
        privacy: {
          profileVisibility: 'private',
          showEmail: false,
          showLocation: false,
          allowAnalytics: true,
          allowMarketing: false,
        },
        dashboard: {
          layout: 'grid',
          defaultView: 'overview',
          showWelcome: true,
          compactMode: false,
          widgets: [],
        },
      },
      stats: {
        projectsCreated: 0,
        projectsCompleted: 0,
        totalContributions: 0,
        streakDays: 0,
        joinedTeams: 0,
        achievements: [],
        activityScore: 0,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    return {
      token: 'mock-jwt-token-confirmed',
      user: mockUser,
    };
  },

  async resendConfirmation(email: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate success
  },

  async getProfile(): Promise<User> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return the demo user for now
    return this.login('demo@nexus.com', 'password').then(response => response.user);
  },

  async updateProfile(data: Partial<User>): Promise<User> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const currentUser = await this.getProfile();
    return {
      ...currentUser,
      ...data,
      updatedAt: new Date().toISOString(),
    };
  },

  async forgotPassword(email: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate success
  },

  async resetPassword(token: string, password: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (token === 'invalid-token') {
      throw new Error('Invalid or expired reset token');
    }
    
    // Simulate success
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (currentPassword !== 'password') {
      throw new Error('Current password is incorrect');
    }
    
    // Simulate success
  },
};
