export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  avatar?: string;
  role: 'user' | 'admin' | 'developer';
  subscription: UserSubscription;
  preferences: UserPreferences;
  usage: UsageStats;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export interface UserSubscription {
  plan: 'free' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  textGeneration: number; // tokens per month
  imageGeneration: number; // images per month
  codeAssistance: number; // requests per month
  dataAnalysis: number; // analyses per month
  voiceSynthesis: number; // characters per month
  documentProcessing: number; // documents per month
  translation: number; // characters per month
  chatbotInteractions: number; // interactions per month
  apiCalls: number; // API calls per month
  storage: number; // GB
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  defaultModel: string;
  autoSave: boolean;
  showTutorials: boolean;
}

export interface NotificationPreferences {
  email: {
    usageAlerts: boolean;
    newFeatures: boolean;
    billing: boolean;
    security: boolean;
  };
  push: {
    taskComplete: boolean;
    quotaWarning: boolean;
    systemUpdates: boolean;
  };
  inApp: {
    tips: boolean;
    achievements: boolean;
    recommendations: boolean;
  };
}

export interface UsageStats {
  currentMonth: MonthlyUsage;
  previousMonth: MonthlyUsage;
  totalUsage: TotalUsage;
  favoriteTools: string[];
  lastUsed: Record<string, string>; // toolId -> timestamp
}

export interface MonthlyUsage {
  textGeneration: number;
  imageGeneration: number;
  codeAssistance: number;
  dataAnalysis: number;
  voiceSynthesis: number;
  documentProcessing: number;
  translation: number;
  chatbotInteractions: number;
  apiCalls: number;
  storageUsed: number;
}

export interface TotalUsage {
  textGeneration: number;
  imageGeneration: number;
  codeAssistance: number;
  dataAnalysis: number;
  voiceSynthesis: number;
  documentProcessing: number;
  translation: number;
  chatbotInteractions: number;
  apiCalls: number;
  accountAge: number; // days
}
