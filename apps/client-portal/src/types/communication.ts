export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderRole: 'client' | 'team_member' | 'admin';
  content: string;
  type: MessageType;
  attachments: MessageAttachment[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  replyTo?: string;
  reactions: MessageReaction[];
}

export type MessageType = 'text' | 'file' | 'image' | 'system' | 'notification';

export interface MessageAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
}

export interface MessageReaction {
  emoji: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  type: ConversationType;
  projectId?: string;
  projectName?: string;
  participants: Participant[];
  lastMessage?: Message;
  unreadCount: number;
  isArchived: boolean;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ConversationType = 'direct' | 'project' | 'support' | 'group';

export interface Participant {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'client' | 'team_member' | 'admin';
  isOnline: boolean;
  lastSeenAt?: string;
}

export interface SupportTicket {
  id: string;
  number: string;
  clientId: string;
  projectId?: string;
  projectName?: string;
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  assignedTo?: string;
  assignedToName?: string;
  tags: string[];
  attachments: MessageAttachment[];
  messages: TicketMessage[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  satisfactionRating?: number;
  satisfactionFeedback?: string;
}

export type TicketStatus = 
  | 'open' 
  | 'in-progress' 
  | 'waiting-for-client' 
  | 'waiting-for-team' 
  | 'resolved' 
  | 'closed';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketCategory = 
  | 'technical' 
  | 'billing' 
  | 'project' 
  | 'account' 
  | 'feature-request' 
  | 'bug-report' 
  | 'other';

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderId: string;
  senderName: string;
  senderRole: 'client' | 'team_member' | 'admin';
  content: string;
  attachments: MessageAttachment[];
  isInternal: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  clientId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  expiresAt?: string;
  actionUrl?: string;
  actionText?: string;
}

export type NotificationType = 
  | 'project_update'
  | 'invoice_created'
  | 'invoice_paid'
  | 'payment_failed'
  | 'message_received'
  | 'ticket_updated'
  | 'milestone_completed'
  | 'document_approved'
  | 'system_update'
  | 'reminder';

export interface CommunicationStats {
  totalMessages: number;
  unreadMessages: number;
  activeConversations: number;
  openTickets: number;
  averageResponseTime: number; // in hours
  satisfactionRating: number;
}
