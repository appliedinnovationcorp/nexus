export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  phone?: string;
  avatar?: string;
  bio?: string;
  website?: string;
  location?: string;
  timezone: string;
  language: string;
  emailVerified: boolean;
  profileCompleted: boolean;
  role: 'user' | 'admin' | 'moderator';
  subscription: UserSubscription;
  preferences: UserPreferences;
  stats: UserStats;
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
  projects: number; // -1 for unlimited
  storage: number; // GB
  teamMembers: number;
  apiCalls: number; // per month
  customDomains: number;
  prioritySupport: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacyPreferences;
  dashboard: DashboardPreferences;
}

export interface NotificationPreferences {
  email: {
    projectUpdates: boolean;
    teamInvites: boolean;
    billing: boolean;
    security: boolean;
    marketing: boolean;
    newsletter: boolean;
  };
  push: {
    projectUpdates: boolean;
    mentions: boolean;
    reminders: boolean;
  };
  inApp: {
    projectUpdates: boolean;
    teamActivity: boolean;
    systemUpdates: boolean;
  };
}

export interface PrivacyPreferences {
  profileVisibility: 'public' | 'private' | 'team';
  showEmail: boolean;
  showLocation: boolean;
  allowAnalytics: boolean;
  allowMarketing: boolean;
}

export interface DashboardPreferences {
  layout: 'grid' | 'list';
  defaultView: 'overview' | 'projects' | 'activity';
  showWelcome: boolean;
  compactMode: boolean;
  widgets: DashboardWidget[];
}

export interface DashboardWidget {
  id: string;
  type: 'projects' | 'activity' | 'stats' | 'calendar' | 'tasks';
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  settings: Record<string, any>;
}

export interface UserStats {
  projectsCreated: number;
  projectsCompleted: number;
  totalContributions: number;
  streakDays: number;
  joinedTeams: number;
  achievements: Achievement[];
  activityScore: number;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn: number;
}

export interface RegisterResponse {
  message: string;
  emailSent: boolean;
}

export interface EmailConfirmationResponse {
  token: string;
  user: User;
}
