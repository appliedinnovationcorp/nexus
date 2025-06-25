import apiClient from './client';
import { 
  Message, 
  Conversation, 
  SupportTicket, 
  Notification, 
  CommunicationStats,
  TicketMessage 
} from '@/types/communication';

export const communicationApi = {
  async getConversations(): Promise<Conversation[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockConversations: Conversation[] = [
      {
        id: '1',
        title: 'Website Redesign Discussion',
        type: 'project',
        projectId: '1',
        projectName: 'Website Redesign',
        participants: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@acme.com',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            role: 'client',
            isOnline: true,
          },
          {
            id: '2',
            name: 'Sarah Johnson',
            email: 'sarah@nexus.com',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
            role: 'team_member',
            isOnline: true,
          },
          {
            id: '3',
            name: 'Mike Chen',
            email: 'mike@nexus.com',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
            role: 'team_member',
            isOnline: false,
            lastSeenAt: '2024-06-24T16:30:00Z',
          },
        ],
        lastMessage: {
          id: '1',
          conversationId: '1',
          senderId: '2',
          senderName: 'Sarah Johnson',
          senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
          senderRole: 'team_member',
          content: 'The latest design mockups are ready for your review. Please check the attached files.',
          type: 'text',
          attachments: [],
          isRead: false,
          createdAt: '2024-06-24T14:30:00Z',
          updatedAt: '2024-06-24T14:30:00Z',
          reactions: [],
        },
        unreadCount: 2,
        isArchived: false,
        isPinned: true,
        createdAt: '2024-05-01T10:00:00Z',
        updatedAt: '2024-06-24T14:30:00Z',
      },
      {
        id: '2',
        title: 'General Support',
        type: 'support',
        participants: [
          {
            id: '1',
            name: 'John Doe',
            email: 'john@acme.com',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            role: 'client',
            isOnline: true,
          },
          {
            id: '4',
            name: 'Support Team',
            email: 'support@nexus.com',
            role: 'admin',
            isOnline: true,
          },
        ],
        lastMessage: {
          id: '2',
          conversationId: '2',
          senderId: '4',
          senderName: 'Support Team',
          senderRole: 'admin',
          content: 'Thank you for contacting us. How can we help you today?',
          type: 'text',
          attachments: [],
          isRead: true,
          readAt: '2024-06-23T10:15:00Z',
          createdAt: '2024-06-23T10:00:00Z',
          updatedAt: '2024-06-23T10:00:00Z',
          reactions: [],
        },
        unreadCount: 0,
        isArchived: false,
        isPinned: false,
        createdAt: '2024-06-23T10:00:00Z',
        updatedAt: '2024-06-23T10:15:00Z',
      },
    ];

    return mockConversations;
  },

  async getConversation(id: string): Promise<Conversation> {
    const conversations = await this.getConversations();
    const conversation = conversations.find(c => c.id === id);
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    return conversation;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockMessages: Message[] = [
      {
        id: '1',
        conversationId,
        senderId: '2',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        senderRole: 'team_member',
        content: 'Hi John! I wanted to update you on the progress of your website redesign project.',
        type: 'text',
        attachments: [],
        isRead: true,
        readAt: '2024-06-24T09:15:00Z',
        createdAt: '2024-06-24T09:00:00Z',
        updatedAt: '2024-06-24T09:00:00Z',
        reactions: [
          {
            emoji: '👍',
            userId: '1',
            userName: 'John Doe',
            createdAt: '2024-06-24T09:05:00Z',
          },
        ],
      },
      {
        id: '2',
        conversationId,
        senderId: '1',
        senderName: 'John Doe',
        senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        senderRole: 'client',
        content: 'Great! I\'m excited to see the progress. How are things looking so far?',
        type: 'text',
        attachments: [],
        isRead: true,
        readAt: '2024-06-24T09:20:00Z',
        createdAt: '2024-06-24T09:15:00Z',
        updatedAt: '2024-06-24T09:15:00Z',
        reactions: [],
      },
      {
        id: '3',
        conversationId,
        senderId: '2',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        senderRole: 'team_member',
        content: 'We\'ve completed the design phase and are now 65% through the development. Mike has created some amazing mockups that I think you\'ll love!',
        type: 'text',
        attachments: [
          {
            id: '1',
            name: 'homepage-mockup.png',
            type: 'image/png',
            size: 2048576,
            url: '/attachments/homepage-mockup.png',
            thumbnailUrl: '/attachments/homepage-mockup-thumb.png',
          },
          {
            id: '2',
            name: 'design-specs.pdf',
            type: 'application/pdf',
            size: 1024000,
            url: '/attachments/design-specs.pdf',
          },
        ],
        isRead: true,
        readAt: '2024-06-24T14:00:00Z',
        createdAt: '2024-06-24T13:45:00Z',
        updatedAt: '2024-06-24T13:45:00Z',
        reactions: [],
      },
      {
        id: '4',
        conversationId,
        senderId: '2',
        senderName: 'Sarah Johnson',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        senderRole: 'team_member',
        content: 'The latest design mockups are ready for your review. Please check the attached files.',
        type: 'text',
        attachments: [],
        isRead: false,
        createdAt: '2024-06-24T14:30:00Z',
        updatedAt: '2024-06-24T14:30:00Z',
        reactions: [],
      },
    ];

    return mockMessages;
  },

  async sendMessage(conversationId: string, content: string, attachments?: File[]): Promise<Message> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newMessage: Message = {
      id: Math.random().toString(36).substr(2, 9),
      conversationId,
      senderId: '1',
      senderName: 'John Doe',
      senderAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      senderRole: 'client',
      content,
      type: 'text',
      attachments: attachments?.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/attachments/${file.name}`,
      })) || [],
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      reactions: [],
    };

    return newMessage;
  },

  async getSupportTickets(): Promise<SupportTicket[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const mockTickets: SupportTicket[] = [
      {
        id: '1',
        number: 'TICK-2024-001',
        clientId: '1',
        projectId: '1',
        projectName: 'Website Redesign',
        subject: 'Issue with login functionality',
        description: 'Users are reporting issues with the login form on the new website. The form seems to freeze after clicking submit.',
        status: 'in-progress',
        priority: 'high',
        category: 'technical',
        assignedTo: '5',
        assignedToName: 'Alex Thompson',
        tags: ['login', 'bug', 'frontend'],
        attachments: [
          {
            id: '1',
            name: 'error-screenshot.png',
            type: 'image/png',
            size: 1024000,
            url: '/attachments/error-screenshot.png',
            thumbnailUrl: '/attachments/error-screenshot-thumb.png',
          },
        ],
        messages: [
          {
            id: '1',
            ticketId: '1',
            senderId: '1',
            senderName: 'John Doe',
            senderRole: 'client',
            content: 'Users are reporting issues with the login form on the new website. The form seems to freeze after clicking submit.',
            attachments: [],
            isInternal: false,
            createdAt: '2024-06-23T10:00:00Z',
          },
          {
            id: '2',
            ticketId: '1',
            senderId: '5',
            senderName: 'Alex Thompson',
            senderRole: 'team_member',
            content: 'Thank you for reporting this issue. I\'m investigating the problem and will have a fix ready soon.',
            attachments: [],
            isInternal: false,
            createdAt: '2024-06-23T11:30:00Z',
          },
        ],
        createdAt: '2024-06-23T10:00:00Z',
        updatedAt: '2024-06-23T11:30:00Z',
      },
      {
        id: '2',
        number: 'TICK-2024-002',
        clientId: '1',
        subject: 'Request for additional features',
        description: 'I would like to add a blog section to the website. Can we discuss the scope and pricing for this addition?',
        status: 'open',
        priority: 'medium',
        category: 'feature-request',
        tags: ['blog', 'feature', 'enhancement'],
        attachments: [],
        messages: [
          {
            id: '3',
            ticketId: '2',
            senderId: '1',
            senderName: 'John Doe',
            senderRole: 'client',
            content: 'I would like to add a blog section to the website. Can we discuss the scope and pricing for this addition?',
            attachments: [],
            isInternal: false,
            createdAt: '2024-06-24T09:00:00Z',
          },
        ],
        createdAt: '2024-06-24T09:00:00Z',
        updatedAt: '2024-06-24T09:00:00Z',
      },
    ];

    return mockTickets;
  },

  async getSupportTicket(id: string): Promise<SupportTicket> {
    const tickets = await this.getSupportTickets();
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) {
      throw new Error('Support ticket not found');
    }
    return ticket;
  },

  async createSupportTicket(data: {
    subject: string;
    description: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    projectId?: string;
    attachments?: File[];
  }): Promise<SupportTicket> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newTicket: SupportTicket = {
      id: Math.random().toString(36).substr(2, 9),
      number: `TICK-2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      clientId: '1',
      projectId: data.projectId,
      subject: data.subject,
      description: data.description,
      status: 'open',
      priority: data.priority,
      category: data.category as any,
      tags: [],
      attachments: data.attachments?.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/attachments/${file.name}`,
      })) || [],
      messages: [
        {
          id: Math.random().toString(36).substr(2, 9),
          ticketId: '',
          senderId: '1',
          senderName: 'John Doe',
          senderRole: 'client',
          content: data.description,
          attachments: [],
          isInternal: false,
          createdAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return newTicket;
  },

  async addTicketMessage(ticketId: string, content: string, attachments?: File[]): Promise<TicketMessage> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newMessage: TicketMessage = {
      id: Math.random().toString(36).substr(2, 9),
      ticketId,
      senderId: '1',
      senderName: 'John Doe',
      senderRole: 'client',
      content,
      attachments: attachments?.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        size: file.size,
        url: `/attachments/${file.name}`,
      })) || [],
      isInternal: false,
      createdAt: new Date().toISOString(),
    };

    return newMessage;
  },

  async getNotifications(): Promise<Notification[]> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const mockNotifications: Notification[] = [
      {
        id: '1',
        clientId: '1',
        type: 'project_update',
        title: 'Project Milestone Completed',
        message: 'The Design Phase milestone for Website Redesign has been completed.',
        data: { projectId: '1', milestoneId: '1' },
        isRead: false,
        createdAt: '2024-06-24T14:30:00Z',
        actionUrl: '/projects/1',
        actionText: 'View Project',
      },
      {
        id: '2',
        clientId: '1',
        type: 'invoice_created',
        title: 'New Invoice Available',
        message: 'Invoice INV-2024-002 for $8,250 has been generated.',
        data: { invoiceId: '2' },
        isRead: false,
        createdAt: '2024-06-24T10:00:00Z',
        actionUrl: '/billing/invoices/2',
        actionText: 'View Invoice',
      },
      {
        id: '3',
        clientId: '1',
        type: 'message_received',
        title: 'New Message',
        message: 'Sarah Johnson sent you a message about Website Redesign.',
        data: { conversationId: '1', messageId: '4' },
        isRead: true,
        readAt: '2024-06-24T13:00:00Z',
        createdAt: '2024-06-24T12:30:00Z',
        actionUrl: '/messages/1',
        actionText: 'View Message',
      },
    ];

    return mockNotifications;
  },

  async markNotificationAsRead(notificationId: string): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 300));
    // Notification marked as read
  },

  async markAllNotificationsAsRead(): Promise<void> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    // All notifications marked as read
  },

  async getCommunicationStats(): Promise<CommunicationStats> {
    // Mock implementation - replace with actual API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      totalMessages: 47,
      unreadMessages: 3,
      activeConversations: 2,
      openTickets: 1,
      averageResponseTime: 2.5,
      satisfactionRating: 4.8,
    };
  },
};
