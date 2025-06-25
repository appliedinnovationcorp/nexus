import apiClient from './client';
import { User } from '@/types/user';

interface LoginResponse {
  token: string;
  user: User;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  company?: string;
}

export const authApi = {
  async login(email: string, password: string): Promise<LoginResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (email === 'demo@aitools.com' && password === 'password') {
      const mockUser: User = {
        id: '1',
        email: 'demo@aitools.com',
        firstName: 'Alex',
        lastName: 'Johnson',
        company: 'Tech Innovations Inc.',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        role: 'user',
        subscription: {
          plan: 'pro',
          status: 'active',
          billingCycle: 'monthly',
          currentPeriodStart: '2024-06-01T00:00:00Z',
          currentPeriodEnd: '2024-07-01T00:00:00Z',
          cancelAtPeriodEnd: false,
          features: [
            'unlimited_text_generation',
            'advanced_image_generation',
            'priority_support',
            'api_access',
            'custom_models'
          ],
          limits: {
            textGeneration: 50000,
            imageGeneration: 500,
            codeAssistance: 5000,
            dataAnalysis: 1000,
            voiceSynthesis: 10000,
            documentProcessing: 1000,
            translation: 100000,
            chatbotInteractions: 5000,
            apiCalls: 100000,
            storage: 100,
          },
        },
        preferences: {
          theme: 'system',
          language: 'en',
          timezone: 'America/New_York',
          notifications: {
            email: {
              usageAlerts: true,
              newFeatures: true,
              billing: true,
              security: true,
            },
            push: {
              taskComplete: true,
              quotaWarning: true,
              systemUpdates: false,
            },
            inApp: {
              tips: true,
              achievements: true,
              recommendations: true,
            },
          },
          defaultModel: 'gpt-4',
          autoSave: true,
          showTutorials: true,
        },
        usage: {
          currentMonth: {
            textGeneration: 12500,
            imageGeneration: 85,
            codeAssistance: 320,
            dataAnalysis: 45,
            voiceSynthesis: 2800,
            documentProcessing: 67,
            translation: 15600,
            chatbotInteractions: 890,
            apiCalls: 15420,
            storageUsed: 23.5,
          },
          previousMonth: {
            textGeneration: 18200,
            imageGeneration: 120,
            codeAssistance: 450,
            dataAnalysis: 78,
            voiceSynthesis: 3200,
            documentProcessing: 89,
            translation: 22100,
            chatbotInteractions: 1200,
            apiCalls: 22800,
            storageUsed: 28.2,
          },
          totalUsage: {
            textGeneration: 245000,
            imageGeneration: 1850,
            codeAssistance: 8900,
            dataAnalysis: 890,
            voiceSynthesis: 45000,
            documentProcessing: 1200,
            translation: 380000,
            chatbotInteractions: 15600,
            apiCalls: 420000,
            accountAge: 180,
          },
          favoriteTools: [
            'text-generator',
            'image-generator',
            'code-assistant',
            'translation-engine'
          ],
          lastUsed: {
            'text-generator': '2024-06-25T10:30:00Z',
            'image-generator': '2024-06-25T09:15:00Z',
            'code-assistant': '2024-06-25T08:45:00Z',
            'data-analyzer': '2024-06-24T16:20:00Z',
          },
        },
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-06-20T14:30:00Z',
        lastLoginAt: new Date().toISOString(),
        isActive: true,
      };

      return {
        token: 'mock-jwt-token-ai-tools',
        user: mockUser,
      };
    }
    
    throw new Error('Invalid credentials');
  },

  async register(data: RegisterData): Promise<LoginResponse> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const mockUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      company: data.company,
      role: 'user',
      subscription: {
        plan: 'free',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        features: ['basic_access'],
        limits: {
          textGeneration: 1000,
          imageGeneration: 10,
          codeAssistance: 500,
          dataAnalysis: 100,
          voiceSynthesis: 1000,
          documentProcessing: 100,
          translation: 10000,
          chatbotInteractions: 50,
          apiCalls: 1000,
          storage: 1,
        },
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: {
            usageAlerts: true,
            newFeatures: true,
            billing: true,
            security: true,
          },
          push: {
            taskComplete: true,
            quotaWarning: true,
            systemUpdates: true,
          },
          inApp: {
            tips: true,
            achievements: true,
            recommendations: true,
          },
        },
        defaultModel: 'gpt-3.5-turbo',
        autoSave: true,
        showTutorials: true,
      },
      usage: {
        currentMonth: {
          textGeneration: 0,
          imageGeneration: 0,
          codeAssistance: 0,
          dataAnalysis: 0,
          voiceSynthesis: 0,
          documentProcessing: 0,
          translation: 0,
          chatbotInteractions: 0,
          apiCalls: 0,
          storageUsed: 0,
        },
        previousMonth: {
          textGeneration: 0,
          imageGeneration: 0,
          codeAssistance: 0,
          dataAnalysis: 0,
          voiceSynthesis: 0,
          documentProcessing: 0,
          translation: 0,
          chatbotInteractions: 0,
          apiCalls: 0,
          storageUsed: 0,
        },
        totalUsage: {
          textGeneration: 0,
          imageGeneration: 0,
          codeAssistance: 0,
          dataAnalysis: 0,
          voiceSynthesis: 0,
          documentProcessing: 0,
          translation: 0,
          chatbotInteractions: 0,
          apiCalls: 0,
          accountAge: 0,
        },
        favoriteTools: [],
        lastUsed: {},
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    return {
      token: 'mock-jwt-token-ai-tools',
      user: mockUser,
    };
  },

  async getProfile(): Promise<User> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: User = {
      id: '1',
      email: 'demo@aitools.com',
      firstName: 'Alex',
      lastName: 'Johnson',
      company: 'Tech Innovations Inc.',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      role: 'user',
      subscription: {
        plan: 'pro',
        status: 'active',
        billingCycle: 'monthly',
        currentPeriodStart: '2024-06-01T00:00:00Z',
        currentPeriodEnd: '2024-07-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        features: [
          'unlimited_text_generation',
          'advanced_image_generation',
          'priority_support',
          'api_access',
          'custom_models'
        ],
        limits: {
          textGeneration: 50000,
          imageGeneration: 500,
          codeAssistance: 5000,
          dataAnalysis: 1000,
          voiceSynthesis: 10000,
          documentProcessing: 1000,
          translation: 100000,
          chatbotInteractions: 5000,
          apiCalls: 100000,
          storage: 100,
        },
      },
      preferences: {
        theme: 'system',
        language: 'en',
        timezone: 'America/New_York',
        notifications: {
          email: {
            usageAlerts: true,
            newFeatures: true,
            billing: true,
            security: true,
          },
          push: {
            taskComplete: true,
            quotaWarning: true,
            systemUpdates: false,
          },
          inApp: {
            tips: true,
            achievements: true,
            recommendations: true,
          },
        },
        defaultModel: 'gpt-4',
        autoSave: true,
        showTutorials: true,
      },
      usage: {
        currentMonth: {
          textGeneration: 12500,
          imageGeneration: 85,
          codeAssistance: 320,
          dataAnalysis: 45,
          voiceSynthesis: 2800,
          documentProcessing: 67,
          translation: 15600,
          chatbotInteractions: 890,
          apiCalls: 15420,
          storageUsed: 23.5,
        },
        previousMonth: {
          textGeneration: 18200,
          imageGeneration: 120,
          codeAssistance: 450,
          dataAnalysis: 78,
          voiceSynthesis: 3200,
          documentProcessing: 89,
          translation: 22100,
          chatbotInteractions: 1200,
          apiCalls: 22800,
          storageUsed: 28.2,
        },
        totalUsage: {
          textGeneration: 245000,
          imageGeneration: 1850,
          codeAssistance: 8900,
          dataAnalysis: 890,
          voiceSynthesis: 45000,
          documentProcessing: 1200,
          translation: 380000,
          chatbotInteractions: 15600,
          apiCalls: 420000,
          accountAge: 180,
        },
        favoriteTools: [
          'text-generator',
          'image-generator',
          'code-assistant',
          'translation-engine'
        ],
        lastUsed: {
          'text-generator': '2024-06-25T10:30:00Z',
          'image-generator': '2024-06-25T09:15:00Z',
          'code-assistant': '2024-06-25T08:45:00Z',
          'data-analyzer': '2024-06-24T16:20:00Z',
        },
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-20T14:30:00Z',
      lastLoginAt: new Date().toISOString(),
      isActive: true,
    };

    return mockUser;
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
