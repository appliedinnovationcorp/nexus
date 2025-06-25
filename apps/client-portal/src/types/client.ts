export interface Client {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company: string;
  phone?: string;
  avatar?: string;
  timezone: string;
  language: string;
  notifications: NotificationSettings;
  subscription: SubscriptionInfo;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  isActive: boolean;
  role: 'client' | 'admin';
}

export interface NotificationSettings {
  email: {
    projectUpdates: boolean;
    invoices: boolean;
    messages: boolean;
    systemUpdates: boolean;
  };
  push: {
    projectUpdates: boolean;
    messages: boolean;
    reminders: boolean;
  };
}

export interface SubscriptionInfo {
  plan: 'basic' | 'professional' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  features: string[];
}
