// Support Ticket Aggregate - Customer Support Management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { TicketStatus } from '../value-objects/ticket-status';
import { TicketPriority } from '../value-objects/ticket-priority';
import { TicketCategory } from '../value-objects/ticket-category';

export interface TicketMessage {
  readonly id: string;
  readonly authorId: string;
  readonly authorType: 'customer' | 'agent' | 'system';
  readonly content: string;
  readonly attachments: TicketAttachment[];
  readonly isInternal: boolean;
  readonly timestamp: Date;
}

export interface TicketAttachment {
  readonly id: string;
  readonly filename: string;
  readonly fileSize: number;
  readonly mimeType: string;
  readonly url: string;
  readonly uploadedBy: string;
  readonly uploadedAt: Date;
}

export interface SLATarget {
  readonly firstResponseTime: number; // minutes
  readonly resolutionTime: number; // minutes
  readonly escalationTime: number; // minutes
}

export class SupportTicketAggregate extends AggregateRoot {
  private _ticketNumber: string;
  private _customerId: string;
  private _organizationId: string;
  private _assignedAgentId?: string;
  private _subject: string;
  private _description: string;
  private _status: TicketStatus;
  private _priority: TicketPriority;
  private _category: TicketCategory;
  private _messages: TicketMessage[] = [];
  private _tags: string[] = [];
  private _slaTarget: SLATarget;
  private _firstResponseAt?: Date;
  private _resolvedAt?: Date;
  private _closedAt?: Date;
  private _reopenedCount: number = 0;
  private _escalatedAt?: Date;
  private _escalatedTo?: string;
  private _satisfactionRating?: number; // 1-5
  private _satisfactionFeedback?: string;
  private _relatedTicketIds: string[] = [];
  private _projectId?: string;
  private _invoiceId?: string;

  private constructor(
    id: string,
    ticketNumber: string,
    customerId: string,
    organizationId: string,
    subject: string,
    description: string,
    priority: TicketPriority,
    category: TicketCategory,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._ticketNumber = ticketNumber;
    this._customerId = customerId;
    this._organizationId = organizationId;
    this._subject = subject;
    this._description = description;
    this._priority = priority;
    this._category = category;
    this._status = TicketStatus.open();
    this._slaTarget = this.getSLATargetForPriority(priority);
  }

  public static create(
    id: string,
    ticketNumber: string,
    customerId: string,
    organizationId: string,
    subject: string,
    description: string,
    priority: TicketPriority,
    category: TicketCategory,
    projectId?: string,
    invoiceId?: string
  ): SupportTicketAggregate {
    const ticket = new SupportTicketAggregate(
      id, ticketNumber, customerId, organizationId,
      subject, description, priority, category
    );

    if (projectId) ticket._projectId = projectId;
    if (invoiceId) ticket._invoiceId = invoiceId;

    // Add initial message from customer
    const initialMessage: TicketMessage = {
      id: crypto.randomUUID(),
      authorId: customerId,
      authorType: 'customer',
      content: description,
      attachments: [],
      isInternal: false,
      timestamp: new Date()
    };
    ticket._messages.push(initialMessage);

    ticket.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketCreated',
      aggregateId: id,
      aggregateVersion: ticket.version,
      ticketNumber,
      customerId,
      organizationId,
      subject,
      priority: priority.getValue(),
      category: category.getValue(),
      projectId,
      invoiceId,
      slaTarget: ticket._slaTarget
    } as SupportTicketCreatedEvent);

    return ticket;
  }

  // Getters
  get ticketNumber(): string { return this._ticketNumber; }
  get customerId(): string { return this._customerId; }
  get organizationId(): string { return this._organizationId; }
  get assignedAgentId(): string | undefined { return this._assignedAgentId; }
  get subject(): string { return this._subject; }
  get status(): TicketStatus { return this._status; }
  get priority(): TicketPriority { return this._priority; }
  get category(): TicketCategory { return this._category; }
  get messages(): TicketMessage[] { return [...this._messages]; }
  get tags(): string[] { return [...this._tags]; }
  get slaTarget(): SLATarget { return this._slaTarget; }
  get isOverdue(): boolean {
    if (this._status.isClosed()) return false;
    
    const now = new Date();
    const createdTime = this.createdAt.getTime();
    const elapsedMinutes = (now.getTime() - createdTime) / (1000 * 60);
    
    if (!this._firstResponseAt && elapsedMinutes > this._slaTarget.firstResponseTime) {
      return true;
    }
    
    if (!this._resolvedAt && elapsedMinutes > this._slaTarget.resolutionTime) {
      return true;
    }
    
    return false;
  }

  // Business methods
  public assignToAgent(agentId: string, assignedBy: string): void {
    if (this._status.isClosed()) {
      throw new Error('Cannot assign closed ticket');
    }

    const previousAgentId = this._assignedAgentId;
    this._assignedAgentId = agentId;
    this._status = TicketStatus.inProgress();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketAssigned',
      aggregateId: this.id,
      aggregateVersion: this.version,
      agentId,
      previousAgentId,
      assignedBy,
      assignedAt: this.updatedAt
    } as SupportTicketAssignedEvent);
  }

  public addMessage(
    messageId: string,
    authorId: string,
    authorType: 'customer' | 'agent' | 'system',
    content: string,
    attachments: TicketAttachment[] = [],
    isInternal: boolean = false
  ): void {
    if (this._status.isClosed()) {
      throw new Error('Cannot add message to closed ticket');
    }

    const message: TicketMessage = {
      id: messageId,
      authorId,
      authorType,
      content,
      attachments,
      isInternal,
      timestamp: new Date()
    };

    this._messages.push(message);

    // Record first response if this is from an agent
    if (authorType === 'agent' && !this._firstResponseAt) {
      this._firstResponseAt = message.timestamp;
    }

    // If customer adds message to resolved ticket, reopen it
    if (authorType === 'customer' && this._status.isResolved()) {
      this._status = TicketStatus.open();
      this._reopenedCount++;
      this._resolvedAt = undefined;
    }

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketMessageAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      messageId,
      authorId,
      authorType,
      content,
      attachmentCount: attachments.length,
      isInternal,
      isFirstResponse: authorType === 'agent' && !this._firstResponseAt,
      wasReopened: authorType === 'customer' && this._reopenedCount > 0
    } as SupportTicketMessageAddedEvent);
  }

  public updatePriority(newPriority: TicketPriority, updatedBy: string, reason: string): void {
    if (this._status.isClosed()) {
      throw new Error('Cannot update priority of closed ticket');
    }

    if (this._priority.equals(newPriority)) {
      return;
    }

    const oldPriority = this._priority;
    this._priority = newPriority;
    this._slaTarget = this.getSLATargetForPriority(newPriority);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketPriorityUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      oldPriority: oldPriority.getValue(),
      newPriority: newPriority.getValue(),
      updatedBy,
      reason,
      newSlaTarget: this._slaTarget
    } as SupportTicketPriorityUpdatedEvent);
  }

  public addTags(tags: string[], addedBy: string): void {
    const newTags = tags.filter(tag => !this._tags.includes(tag));
    if (newTags.length === 0) return;

    this._tags.push(...newTags);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketTagsAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      addedTags: newTags,
      allTags: this._tags,
      addedBy
    } as SupportTicketTagsAddedEvent);
  }

  public escalate(escalatedTo: string, escalatedBy: string, reason: string): void {
    if (this._status.isClosed()) {
      throw new Error('Cannot escalate closed ticket');
    }

    if (this._escalatedAt) {
      throw new Error('Ticket is already escalated');
    }

    this._escalatedAt = new Date();
    this._escalatedTo = escalatedTo;
    this._priority = TicketPriority.high(); // Escalated tickets get high priority
    this._slaTarget = this.getSLATargetForPriority(this._priority);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketEscalated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      escalatedTo,
      escalatedBy,
      reason,
      escalatedAt: this._escalatedAt,
      newPriority: this._priority.getValue()
    } as SupportTicketEscalatedEvent);
  }

  public resolve(resolvedBy: string, resolutionNotes: string): void {
    if (this._status.isClosed()) {
      throw new Error('Cannot resolve closed ticket');
    }

    if (this._status.isResolved()) {
      throw new Error('Ticket is already resolved');
    }

    this._status = TicketStatus.resolved();
    this._resolvedAt = new Date();
    this.updatedAt = new Date();

    // Add resolution message
    const resolutionMessage: TicketMessage = {
      id: crypto.randomUUID(),
      authorId: resolvedBy,
      authorType: 'agent',
      content: `Ticket resolved: ${resolutionNotes}`,
      attachments: [],
      isInternal: false,
      timestamp: this._resolvedAt
    };
    this._messages.push(resolutionMessage);

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketResolved',
      aggregateId: this.id,
      aggregateVersion: this.version,
      resolvedBy,
      resolutionNotes,
      resolvedAt: this._resolvedAt,
      resolutionTimeMinutes: (this._resolvedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)
    } as SupportTicketResolvedEvent);
  }

  public close(closedBy: string, closeReason: string): void {
    if (this._status.isClosed()) {
      throw new Error('Ticket is already closed');
    }

    this._status = TicketStatus.closed();
    this._closedAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketClosed',
      aggregateId: this.id,
      aggregateVersion: this.version,
      closedBy,
      closeReason,
      closedAt: this._closedAt,
      totalTimeMinutes: (this._closedAt.getTime() - this.createdAt.getTime()) / (1000 * 60)
    } as SupportTicketClosedEvent);
  }

  public recordSatisfactionRating(rating: number, feedback?: string): void {
    if (!this._status.isClosed()) {
      throw new Error('Can only rate closed tickets');
    }

    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    this._satisfactionRating = rating;
    this._satisfactionFeedback = feedback;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketRated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      rating,
      feedback,
      ratedAt: this.updatedAt
    } as SupportTicketRatedEvent);
  }

  public linkToRelatedTicket(relatedTicketId: string, linkedBy: string): void {
    if (this._relatedTicketIds.includes(relatedTicketId)) {
      return;
    }

    this._relatedTicketIds.push(relatedTicketId);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'SupportTicketLinked',
      aggregateId: this.id,
      aggregateVersion: this.version,
      relatedTicketId,
      linkedBy,
      linkedAt: this.updatedAt
    } as SupportTicketLinkedEvent);
  }

  private getSLATargetForPriority(priority: TicketPriority): SLATarget {
    const slaTargets = {
      'critical': { firstResponseTime: 15, resolutionTime: 240, escalationTime: 60 }, // 15min, 4h, 1h
      'high': { firstResponseTime: 60, resolutionTime: 480, escalationTime: 120 }, // 1h, 8h, 2h
      'medium': { firstResponseTime: 240, resolutionTime: 1440, escalationTime: 480 }, // 4h, 24h, 8h
      'low': { firstResponseTime: 480, resolutionTime: 2880, escalationTime: 960 } // 8h, 48h, 16h
    };

    return slaTargets[priority.getValue() as keyof typeof slaTargets];
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'SupportTicketCreated':
        this.applySupportTicketCreated(event as SupportTicketCreatedEvent);
        break;
      case 'SupportTicketAssigned':
        this.applySupportTicketAssigned(event as SupportTicketAssignedEvent);
        break;
      case 'SupportTicketMessageAdded':
        this.applySupportTicketMessageAdded(event as SupportTicketMessageAddedEvent);
        break;
      case 'SupportTicketPriorityUpdated':
        this.applySupportTicketPriorityUpdated(event as SupportTicketPriorityUpdatedEvent);
        break;
      case 'SupportTicketTagsAdded':
        this.applySupportTicketTagsAdded(event as SupportTicketTagsAddedEvent);
        break;
      case 'SupportTicketEscalated':
        this.applySupportTicketEscalated(event as SupportTicketEscalatedEvent);
        break;
      case 'SupportTicketResolved':
        this.applySupportTicketResolved(event as SupportTicketResolvedEvent);
        break;
      case 'SupportTicketClosed':
        this.applySupportTicketClosed(event as SupportTicketClosedEvent);
        break;
      case 'SupportTicketRated':
        this.applySupportTicketRated(event as SupportTicketRatedEvent);
        break;
      case 'SupportTicketLinked':
        this.applySupportTicketLinked(event as SupportTicketLinkedEvent);
        break;
    }
  }

  private applySupportTicketCreated(event: SupportTicketCreatedEvent): void {
    this._ticketNumber = event.ticketNumber;
    this._customerId = event.customerId;
    this._organizationId = event.organizationId;
    this._subject = event.subject;
    this._priority = TicketPriority.fromString(event.priority);
    this._category = TicketCategory.fromString(event.category);
    this._projectId = event.projectId;
    this._invoiceId = event.invoiceId;
    this._slaTarget = event.slaTarget;
    this._status = TicketStatus.open();
  }

  private applySupportTicketAssigned(event: SupportTicketAssignedEvent): void {
    this._assignedAgentId = event.agentId;
    this._status = TicketStatus.inProgress();
  }

  private applySupportTicketMessageAdded(event: SupportTicketMessageAddedEvent): void {
    if (event.isFirstResponse) {
      this._firstResponseAt = new Date();
    }
    if (event.wasReopened) {
      this._status = TicketStatus.open();
      this._resolvedAt = undefined;
    }
  }

  private applySupportTicketPriorityUpdated(event: SupportTicketPriorityUpdatedEvent): void {
    this._priority = TicketPriority.fromString(event.newPriority);
    this._slaTarget = event.newSlaTarget;
  }

  private applySupportTicketTagsAdded(event: SupportTicketTagsAddedEvent): void {
    this._tags = event.allTags;
  }

  private applySupportTicketEscalated(event: SupportTicketEscalatedEvent): void {
    this._escalatedAt = event.escalatedAt;
    this._escalatedTo = event.escalatedTo;
    this._priority = TicketPriority.fromString(event.newPriority);
  }

  private applySupportTicketResolved(event: SupportTicketResolvedEvent): void {
    this._status = TicketStatus.resolved();
    this._resolvedAt = event.resolvedAt;
  }

  private applySupportTicketClosed(event: SupportTicketClosedEvent): void {
    this._status = TicketStatus.closed();
    this._closedAt = event.closedAt;
  }

  private applySupportTicketRated(event: SupportTicketRatedEvent): void {
    this._satisfactionRating = event.rating;
    this._satisfactionFeedback = event.feedback;
  }

  private applySupportTicketLinked(event: SupportTicketLinkedEvent): void {
    if (!this._relatedTicketIds.includes(event.relatedTicketId)) {
      this._relatedTicketIds.push(event.relatedTicketId);
    }
  }
}

// Domain Events
export interface SupportTicketCreatedEvent extends DomainEvent {
  eventType: 'SupportTicketCreated';
  ticketNumber: string;
  customerId: string;
  organizationId: string;
  subject: string;
  priority: string;
  category: string;
  projectId?: string;
  invoiceId?: string;
  slaTarget: SLATarget;
}

export interface SupportTicketAssignedEvent extends DomainEvent {
  eventType: 'SupportTicketAssigned';
  agentId: string;
  previousAgentId?: string;
  assignedBy: string;
  assignedAt: Date;
}

export interface SupportTicketMessageAddedEvent extends DomainEvent {
  eventType: 'SupportTicketMessageAdded';
  messageId: string;
  authorId: string;
  authorType: 'customer' | 'agent' | 'system';
  content: string;
  attachmentCount: number;
  isInternal: boolean;
  isFirstResponse: boolean;
  wasReopened: boolean;
}

export interface SupportTicketPriorityUpdatedEvent extends DomainEvent {
  eventType: 'SupportTicketPriorityUpdated';
  oldPriority: string;
  newPriority: string;
  updatedBy: string;
  reason: string;
  newSlaTarget: SLATarget;
}

export interface SupportTicketTagsAddedEvent extends DomainEvent {
  eventType: 'SupportTicketTagsAdded';
  addedTags: string[];
  allTags: string[];
  addedBy: string;
}

export interface SupportTicketEscalatedEvent extends DomainEvent {
  eventType: 'SupportTicketEscalated';
  escalatedTo: string;
  escalatedBy: string;
  reason: string;
  escalatedAt: Date;
  newPriority: string;
}

export interface SupportTicketResolvedEvent extends DomainEvent {
  eventType: 'SupportTicketResolved';
  resolvedBy: string;
  resolutionNotes: string;
  resolvedAt: Date;
  resolutionTimeMinutes: number;
}

export interface SupportTicketClosedEvent extends DomainEvent {
  eventType: 'SupportTicketClosed';
  closedBy: string;
  closeReason: string;
  closedAt: Date;
  totalTimeMinutes: number;
}

export interface SupportTicketRatedEvent extends DomainEvent {
  eventType: 'SupportTicketRated';
  rating: number;
  feedback?: string;
  ratedAt: Date;
}

export interface SupportTicketLinkedEvent extends DomainEvent {
  eventType: 'SupportTicketLinked';
  relatedTicketId: string;
  linkedBy: string;
  linkedAt: Date;
}
