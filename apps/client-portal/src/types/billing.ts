export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  projectId?: string;
  projectName?: string;
  status: InvoiceStatus;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  description: string;
  items: InvoiceItem[];
  paymentMethod?: PaymentMethod;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type InvoiceStatus = 
  | 'draft' 
  | 'sent' 
  | 'viewed' 
  | 'paid' 
  | 'overdue' 
  | 'cancelled';

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate?: number;
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'paypal' | 'stripe';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  transactionId?: string;
  processedAt: string;
  failureReason?: string;
  refundedAt?: string;
  refundAmount?: number;
}

export type PaymentStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled' 
  | 'refunded';

export interface BillingStats {
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueAmount: number;
  averagePaymentTime: number;
  invoiceCount: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  };
}

export interface Subscription {
  id: string;
  clientId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  amount: number;
  currency: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: string;
  trialEnd?: string;
  paymentMethod?: PaymentMethod;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  features: string[];
  limits: {
    projects: number;
    storage: number; // in GB
    teamMembers: number;
    apiCalls: number;
  };
  pricing: {
    monthly: number;
    yearly: number;
  };
}

export type SubscriptionStatus = 
  | 'active' 
  | 'inactive' 
  | 'cancelled' 
  | 'past_due' 
  | 'trialing';
