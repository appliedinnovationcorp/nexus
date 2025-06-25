import apiClient from './client';
import { Invoice, Payment, BillingStats, Subscription, PaymentMethod } from '@/types/billing';

export const billingApi = {
  async getInvoices(): Promise<Invoice[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockInvoices: Invoice[] = [
      {
        id: '1',
        number: 'INV-2024-001',
        clientId: '1',
        projectId: '1',
        projectName: 'Website Redesign',
        status: 'paid',
        amount: 5000,
        tax: 500,
        total: 5500,
        currency: 'USD',
        issueDate: '2024-06-01T00:00:00Z',
        dueDate: '2024-06-15T00:00:00Z',
        paidDate: '2024-06-10T14:30:00Z',
        description: 'Website redesign - Phase 1 completion',
        items: [
          {
            id: '1',
            description: 'UI/UX Design',
            quantity: 40,
            rate: 75,
            amount: 3000,
          },
          {
            id: '2',
            description: 'Frontend Development',
            quantity: 25,
            rate: 80,
            amount: 2000,
          },
        ],
        paymentMethod: {
          id: '1',
          type: 'credit_card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true,
        },
        createdAt: '2024-06-01T10:00:00Z',
        updatedAt: '2024-06-10T14:30:00Z',
      },
      {
        id: '2',
        number: 'INV-2024-002',
        clientId: '1',
        projectId: '2',
        projectName: 'Mobile App Development',
        status: 'sent',
        amount: 7500,
        tax: 750,
        total: 8250,
        currency: 'USD',
        issueDate: '2024-06-15T00:00:00Z',
        dueDate: '2024-06-30T00:00:00Z',
        description: 'Mobile app development - Initial phase',
        items: [
          {
            id: '3',
            description: 'Requirements Analysis',
            quantity: 20,
            rate: 90,
            amount: 1800,
          },
          {
            id: '4',
            description: 'Architecture Design',
            quantity: 30,
            rate: 95,
            amount: 2850,
          },
          {
            id: '5',
            description: 'Prototype Development',
            quantity: 35,
            rate: 85,
            amount: 2975,
          },
        ],
        createdAt: '2024-06-15T10:00:00Z',
        updatedAt: '2024-06-15T10:00:00Z',
      },
      {
        id: '3',
        number: 'INV-2024-003',
        clientId: '1',
        status: 'overdue',
        amount: 3200,
        tax: 320,
        total: 3520,
        currency: 'USD',
        issueDate: '2024-05-01T00:00:00Z',
        dueDate: '2024-05-15T00:00:00Z',
        description: 'Monthly subscription - May 2024',
        items: [
          {
            id: '6',
            description: 'Professional Plan Subscription',
            quantity: 1,
            rate: 3200,
            amount: 3200,
          },
        ],
        createdAt: '2024-05-01T10:00:00Z',
        updatedAt: '2024-05-01T10:00:00Z',
      },
    ];

    return mockInvoices;
  },

  async getInvoice(id: string): Promise<Invoice> {
    const invoices = await this.getInvoices();
    const invoice = invoices.find(inv => inv.id === id);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  },

  async getPayments(): Promise<Payment[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockPayments: Payment[] = [
      {
        id: '1',
        invoiceId: '1',
        amount: 5500,
        currency: 'USD',
        status: 'completed',
        method: {
          id: '1',
          type: 'credit_card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true,
        },
        transactionId: 'txn_1234567890',
        processedAt: '2024-06-10T14:30:00Z',
      },
      {
        id: '2',
        invoiceId: '2',
        amount: 8250,
        currency: 'USD',
        status: 'pending',
        method: {
          id: '1',
          type: 'credit_card',
          last4: '4242',
          brand: 'Visa',
          isDefault: true,
        },
        processedAt: '2024-06-15T10:00:00Z',
      },
    ];

    return mockPayments;
  },

  async getBillingStats(): Promise<BillingStats> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalInvoiced: 45750,
      totalPaid: 32500,
      totalOutstanding: 13250,
      overdueAmount: 3520,
      averagePaymentTime: 8.5,
      invoiceCount: {
        total: 12,
        paid: 8,
        pending: 3,
        overdue: 1,
      },
    };
  },

  async getSubscription(): Promise<Subscription> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      id: '1',
      clientId: '1',
      plan: {
        id: 'professional',
        name: 'Professional',
        description: 'Perfect for growing businesses',
        features: [
          'Unlimited projects',
          'Advanced analytics',
          'Priority support',
          '100GB storage',
          'Custom integrations',
        ],
        limits: {
          projects: -1, // unlimited
          storage: 100,
          teamMembers: 25,
          apiCalls: 100000,
        },
        pricing: {
          monthly: 299,
          yearly: 2990,
        },
      },
      status: 'active',
      billingCycle: 'monthly',
      amount: 299,
      currency: 'USD',
      currentPeriodStart: '2024-06-01T00:00:00Z',
      currentPeriodEnd: '2024-07-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      paymentMethod: {
        id: '1',
        type: 'credit_card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true,
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-06-01T10:00:00Z',
    };
  },

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return [
      {
        id: '1',
        type: 'credit_card',
        last4: '4242',
        brand: 'Visa',
        expiryMonth: 12,
        expiryYear: 2027,
        isDefault: true,
      },
      {
        id: '2',
        type: 'credit_card',
        last4: '1234',
        brand: 'Mastercard',
        expiryMonth: 8,
        expiryYear: 2026,
        isDefault: false,
      },
    ];
  },

  async payInvoice(invoiceId: string, paymentMethodId: string): Promise<Payment> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      invoiceId,
      amount: 8250,
      currency: 'USD',
      status: 'completed',
      method: {
        id: paymentMethodId,
        type: 'credit_card',
        last4: '4242',
        brand: 'Visa',
        isDefault: true,
      },
      transactionId: `txn_${Math.random().toString(36).substr(2, 9)}`,
      processedAt: new Date().toISOString(),
    };
  },

  async addPaymentMethod(paymentMethod: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...paymentMethod,
    };
  },

  async removePaymentMethod(paymentMethodId: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    // Payment method removed successfully
  },

  async setDefaultPaymentMethod(paymentMethodId: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600));
    // Default payment method updated successfully
  },

  async downloadInvoice(invoiceId: string): Promise<Blob> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a mock PDF blob
    return new Blob(['Mock PDF content'], { type: 'application/pdf' });
  },
};
