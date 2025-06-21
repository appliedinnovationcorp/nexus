// Notification Aggregate - System notifications and alerts

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';

export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationChannel = 'in-app' | 'email' | 'sms' | 'push';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationRecipient {
  readonly userId: string;
  readonly channels: NotificationChannel[];
  readonly deliveredAt?: Date;
  readonly readAt?: Date;
  readonly clickedAt?: Date;
}

export class NotificationAggregate extends AggregateRoot {
  private _title: string;
  private _message: string;
  private _type: NotificationType;
  private _priority: NotificationPriority;
  private _recipients: NotificationRecipient[] = [];
  private _metadata: Record<string, any>;
  private _scheduledFor?: Date;
  private _expiresAt?: Date;
  private _isActive: boolean = true;
  private _totalRecipients: number = 0;
  private _deliveredCount: number = 0;
  private _readCount: number = 0;
  private _clickCount: number = 0;

  private constructor(
    id: string,
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority,
    metadata: Record<string, any> = {},
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._title = title;
    this._message = message;
    this._type = type;
    this._priority = priority;
    this._metadata = metadata;
  }

  public static create(
    id: string,
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority,
    metadata: Record<string, any> = {}
  ): NotificationAggregate {
    const notification = new NotificationAggregate(id, title, message, type, priority, metadata);
    
    notification.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'NotificationCreated',
      aggregateId: id,
      aggregateVersion: notification.version,
      title,
      message,
      type,
      priority,
      metadata
    } as NotificationCreatedEvent);

    return notification;
  }

  // Getters
  get title(): string { return this._title; }
  get message(): string { return this._message; }
  get type(): NotificationType { return this._type; }
  get priority(): NotificationPriority { return this._priority; }
  get recipients(): NotificationRecipient[] { return [...this._recipients]; }
  get metadata(): Record<string, any> { return { ...this._metadata }; }
  get scheduledFor(): Date | undefined { return this._scheduledFor; }
  get expiresAt(): Date | undefined { return this._expiresAt; }
  get isActive(): boolean { return this._isActive; }
  get deliveryStats() {
    return {
      total: this._totalRecipients,
      delivered: this._deliveredCount,
      read: this._readCount,
      clicked: this._clickCount,
      deliveryRate: this._totalRecipients > 0 ? (this._deliveredCount / this._totalRecipients) * 100 : 0,
      readRate: this._deliveredCount > 0 ? (this._readCount / this._deliveredCount) * 100 : 0,
      clickRate: this._readCount > 0 ? (this._clickCount / this._readCount) * 100 : 0
    };
  }

  // Business methods
  public addRecipients(recipients: { userId: string; channels: NotificationChannel[] }[]): void {
    const newRecipients: NotificationRecipient[] = recipients.map(r => ({
      userId: r.userId,
      channels: r.channels
    }));

    this._recipients.push(...newRecipients);
    this._totalRecipients = this._recipients.length;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'NotificationRecipientsAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      recipientCount: newRecipients.length,
      totalRecipients: this._totalRecipients
    } as NotificationRecipientsAddedEvent);
  }

  public scheduleDelivery(scheduledFor: Date, expiresAt?: Date): void {
    if (scheduledFor <= new Date()) {
      throw new Error('Scheduled delivery time must be in the future');
    }

    this._scheduledFor = scheduledFor;
    this._expiresAt = expiresAt;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'NotificationScheduled',
      aggregateId: this.id,
      aggregateVersion: this.version,
      scheduledFor,
      expiresAt
    } as NotificationScheduledEvent);
  }

  public markDelivered(userId: string, channel: NotificationChannel): void {
    const recipientIndex = this._recipients.findIndex(r => r.userId === userId);
    if (recipientIndex === -1) {
      throw new Error(`Recipient ${userId} not found`);
    }

    const recipient = this._recipients[recipientIndex];
    if (!recipient) {
      throw new Error(`Recipient with userId ${userId} not found`);
    }
    
    if (recipient.deliveredAt) {
      return; // Already delivered
    }

    this._recipients[recipientIndex] = {
      userId: recipient.userId,
      channels: recipient.channels,
      deliveredAt: new Date(),
      readAt: recipient.readAt,
      clickedAt: recipient.clickedAt
    };

    this._deliveredCount++;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'NotificationDelivered',
      aggregateId: this.id,
      aggregateVersion: this.version,
      userId,
      channel,
      deliveredAt: this._recipients[recipientIndex].deliveredAt!,
      totalDelivered: this._deliveredCount
    } as NotificationDeliveredEvent);
  }

  public markRead(userId: string): void {
    const recipientIndex = this._recipients.findIndex(r => r.userId === userId);
    if (recipientIndex === -1) {
      throw new Error(`Recipient ${userId} not found`);
    }

    const recipient = this._recipients[recipientIndex];
    if (!recipient) {
      throw new Error(`Recipient with userId ${userId} not found`);
    }
    
    if (recipient.readAt) {
      return; // Already read
    }

    this._recipients[recipientIndex] = {
      userId: recipient.userId,
      channels: recipient.channels,
      deliveredAt: recipient.deliveredAt,
      readAt: new Date(),
      clickedAt: recipient.clickedAt
    };

    this._readCount++;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'NotificationRead',
      aggregateId: this.id,
      aggregateVersion: this.version,
      userId,
      readAt: this._recipients[recipientIndex].readAt!,
      totalRead: this._readCount
    } as NotificationReadEvent);
  }

  public markClicked(userId: string): void {
    const recipientIndex = this._recipients.findIndex(r => r.userId === userId);
    if (recipientIndex === -1) {
      throw new Error(`Recipient ${userId} not found`);
    }

    const recipient = this._recipients[recipientIndex];
    if (!recipient) {
      throw new Error(`Recipient with userId ${userId} not found`);
    }
    
    if (recipient.clickedAt) {
      return; // Already clicked
    }

    this._recipients[recipientIndex] = {
      userId: recipient.userId,
      channels: recipient.channels,
      deliveredAt: recipient.deliveredAt,
      readAt: recipient.readAt,
      clickedAt: new Date()
    };

    this._clickCount++;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'NotificationClicked',
      aggregateId: this.id,
      aggregateVersion: this.version,
      userId,
      clickedAt: this._recipients[recipientIndex].clickedAt!,
      totalClicked: this._clickCount
    } as NotificationClickedEvent);
  }

  public expire(): void {
    if (!this._isActive) return;

    this._isActive = false;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'NotificationExpired',
      aggregateId: this.id,
      aggregateVersion: this.version,
      expiredAt: this.updatedAt
    } as NotificationExpiredEvent);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'NotificationCreated':
        this.applyNotificationCreated(event as NotificationCreatedEvent);
        break;
      case 'NotificationRecipientsAdded':
        this.applyNotificationRecipientsAdded(event as NotificationRecipientsAddedEvent);
        break;
      case 'NotificationScheduled':
        this.applyNotificationScheduled(event as NotificationScheduledEvent);
        break;
      case 'NotificationDelivered':
        this.applyNotificationDelivered(event as NotificationDeliveredEvent);
        break;
      case 'NotificationRead':
        this.applyNotificationRead(event as NotificationReadEvent);
        break;
      case 'NotificationClicked':
        this.applyNotificationClicked(event as NotificationClickedEvent);
        break;
      case 'NotificationExpired':
        this.applyNotificationExpired(event as NotificationExpiredEvent);
        break;
    }
  }

  private applyNotificationCreated(event: NotificationCreatedEvent): void {
    this._title = event.title;
    this._message = event.message;
    this._type = event.type;
    this._priority = event.priority;
    this._metadata = event.metadata;
    this._isActive = true;
  }

  private applyNotificationRecipientsAdded(event: NotificationRecipientsAddedEvent): void {
    this._totalRecipients = event.totalRecipients;
  }

  private applyNotificationScheduled(event: NotificationScheduledEvent): void {
    this._scheduledFor = event.scheduledFor;
    this._expiresAt = event.expiresAt;
  }

  private applyNotificationDelivered(event: NotificationDeliveredEvent): void {
    this._deliveredCount = event.totalDelivered;
  }

  private applyNotificationRead(event: NotificationReadEvent): void {
    this._readCount = event.totalRead;
  }

  private applyNotificationClicked(event: NotificationClickedEvent): void {
    this._clickCount = event.totalClicked;
  }

  private applyNotificationExpired(event: NotificationExpiredEvent): void {
    this._isActive = false;
  }
}

// Domain Events
export interface NotificationCreatedEvent extends DomainEvent {
  eventType: 'NotificationCreated';
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  metadata: Record<string, any>;
}

export interface NotificationRecipientsAddedEvent extends DomainEvent {
  eventType: 'NotificationRecipientsAdded';
  recipientCount: number;
  totalRecipients: number;
}

export interface NotificationScheduledEvent extends DomainEvent {
  eventType: 'NotificationScheduled';
  scheduledFor: Date;
  expiresAt?: Date;
}

export interface NotificationDeliveredEvent extends DomainEvent {
  eventType: 'NotificationDelivered';
  userId: string;
  channel: NotificationChannel;
  deliveredAt: Date;
  totalDelivered: number;
}

export interface NotificationReadEvent extends DomainEvent {
  eventType: 'NotificationRead';
  userId: string;
  readAt: Date;
  totalRead: number;
}

export interface NotificationClickedEvent extends DomainEvent {
  eventType: 'NotificationClicked';
  userId: string;
  clickedAt: Date;
  totalClicked: number;
}

export interface NotificationExpiredEvent extends DomainEvent {
  eventType: 'NotificationExpired';
  expiredAt: Date;
}
