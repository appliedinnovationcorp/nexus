// Content Aggregate - Marketing content and blog management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { ContentStatus } from '../value-objects/content-status';
import { ContentType } from '../value-objects/content-type';

export interface ContentMetadata {
  readonly seoTitle?: string;
  readonly seoDescription?: string;
  readonly keywords: string[];
  readonly featuredImage?: string;
  readonly readingTime?: number;
}

export interface ContentAuthor {
  readonly userId: string;
  readonly name: string;
  readonly email: string;
}

export class ContentAggregate extends AggregateRoot {
  private _title: string;
  private _slug: string;
  private _content: string;
  private _excerpt: string;
  private _type: ContentType;
  private _status: ContentStatus;
  private _author: ContentAuthor;
  private _metadata: ContentMetadata;
  private _publishedAt?: Date;
  private _scheduledPublishAt?: Date;
  private _viewCount: number = 0;
  private _tags: string[] = [];

  private constructor(
    id: string,
    title: string,
    slug: string,
    content: string,
    excerpt: string,
    type: ContentType,
    author: ContentAuthor,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._title = title;
    this._slug = slug;
    this._content = content;
    this._excerpt = excerpt;
    this._type = type;
    this._author = author;
    this._status = ContentStatus.draft();
    this._metadata = {
      keywords: [],
      readingTime: this.calculateReadingTime(content)
    };
  }

  public static create(
    id: string,
    title: string,
    slug: string,
    content: string,
    excerpt: string,
    type: ContentType,
    author: ContentAuthor
  ): ContentAggregate {
    const contentAggregate = new ContentAggregate(id, title, slug, content, excerpt, type, author);
    
    contentAggregate.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentCreated',
      aggregateId: id,
      aggregateVersion: contentAggregate.version,
      title,
      slug,
      type: type.value,
      authorId: author.userId,
      authorName: author.name
    } as ContentCreatedEvent);

    return contentAggregate;
  }

  // Getters
  get title(): string { return this._title; }
  get slug(): string { return this._slug; }
  get content(): string { return this._content; }
  get excerpt(): string { return this._excerpt; }
  get type(): ContentType { return this._type; }
  get status(): ContentStatus { return this._status; }
  get author(): ContentAuthor { return this._author; }
  get metadata(): ContentMetadata { return this._metadata; }
  get publishedAt(): Date | undefined { return this._publishedAt; }
  get viewCount(): number { return this._viewCount; }
  get tags(): string[] { return [...this._tags]; }

  // Business methods
  public updateContent(title: string, content: string, excerpt: string): void {
    if (this._status.isPublished()) {
      throw new Error('Cannot edit published content. Create a revision instead.');
    }

    this._title = title;
    this._content = content;
    this._excerpt = excerpt;
    this._metadata = {
      ...this._metadata,
      readingTime: this.calculateReadingTime(content)
    };
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      title,
      readingTime: this._metadata.readingTime
    } as ContentUpdatedEvent);
  }

  public updateSEOMetadata(seoTitle: string, seoDescription: string, keywords: string[]): void {
    this._metadata = {
      ...this._metadata,
      seoTitle,
      seoDescription,
      keywords
    };
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentSEOUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      seoTitle,
      seoDescription,
      keywords
    } as ContentSEOUpdatedEvent);
  }

  public addTags(tags: string[]): void {
    const newTags = tags.filter(tag => !this._tags.includes(tag));
    if (newTags.length === 0) return;

    this._tags.push(...newTags);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentTagsAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      addedTags: newTags,
      allTags: this._tags
    } as ContentTagsAddedEvent);
  }

  public publish(): void {
    if (this._status.isPublished()) {
      throw new Error('Content is already published');
    }

    this._status = ContentStatus.published();
    this._publishedAt = new Date();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentPublished',
      aggregateId: this.id,
      aggregateVersion: this.version,
      publishedAt: this._publishedAt,
      title: this._title,
      slug: this._slug,
      type: this._type.value
    } as ContentPublishedEvent);
  }

  public schedulePublish(publishAt: Date): void {
    if (publishAt <= new Date()) {
      throw new Error('Scheduled publish date must be in the future');
    }

    this._status = ContentStatus.scheduled();
    this._scheduledPublishAt = publishAt;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentScheduled',
      aggregateId: this.id,
      aggregateVersion: this.version,
      scheduledPublishAt: publishAt,
      title: this._title
    } as ContentScheduledEvent);
  }

  public unpublish(): void {
    if (!this._status.isPublished()) {
      throw new Error('Content is not published');
    }

    this._status = ContentStatus.draft();
    this._publishedAt = undefined;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentUnpublished',
      aggregateId: this.id,
      aggregateVersion: this.version,
      title: this._title
    } as ContentUnpublishedEvent);
  }

  public recordView(): void {
    this._viewCount++;

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ContentViewed',
      aggregateId: this.id,
      aggregateVersion: this.version,
      newViewCount: this._viewCount
    } as ContentViewedEvent);
  }

  private calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'ContentCreated':
        this.applyContentCreated(event as ContentCreatedEvent);
        break;
      case 'ContentUpdated':
        this.applyContentUpdated(event as ContentUpdatedEvent);
        break;
      case 'ContentSEOUpdated':
        this.applyContentSEOUpdated(event as ContentSEOUpdatedEvent);
        break;
      case 'ContentTagsAdded':
        this.applyContentTagsAdded(event as ContentTagsAddedEvent);
        break;
      case 'ContentPublished':
        this.applyContentPublished(event as ContentPublishedEvent);
        break;
      case 'ContentScheduled':
        this.applyContentScheduled(event as ContentScheduledEvent);
        break;
      case 'ContentUnpublished':
        this.applyContentUnpublished(event as ContentUnpublishedEvent);
        break;
      case 'ContentViewed':
        this.applyContentViewed(event as ContentViewedEvent);
        break;
    }
  }

  private applyContentCreated(event: ContentCreatedEvent): void {
    this._title = event.title;
    this._slug = event.slug;
    this._type = new ContentType(event.type);
    this._status = ContentStatus.draft();
  }

  private applyContentUpdated(event: ContentUpdatedEvent): void {
    this._title = event.title;
    this._metadata = {
      ...this._metadata,
      readingTime: event.readingTime
    };
  }

  private applyContentSEOUpdated(event: ContentSEOUpdatedEvent): void {
    this._metadata = {
      ...this._metadata,
      seoTitle: event.seoTitle,
      seoDescription: event.seoDescription,
      keywords: event.keywords
    };
  }

  private applyContentTagsAdded(event: ContentTagsAddedEvent): void {
    this._tags = event.allTags;
  }

  private applyContentPublished(event: ContentPublishedEvent): void {
    this._status = ContentStatus.published();
    this._publishedAt = event.publishedAt;
  }

  private applyContentScheduled(event: ContentScheduledEvent): void {
    this._status = ContentStatus.scheduled();
    this._scheduledPublishAt = event.scheduledPublishAt;
  }

  private applyContentUnpublished(event: ContentUnpublishedEvent): void {
    this._status = ContentStatus.draft();
    this._publishedAt = undefined;
  }

  private applyContentViewed(event: ContentViewedEvent): void {
    this._viewCount = event.newViewCount;
  }
}

// Domain Events
export interface ContentCreatedEvent extends DomainEvent {
  eventType: 'ContentCreated';
  title: string;
  slug: string;
  type: string;
  authorId: string;
  authorName: string;
}

export interface ContentUpdatedEvent extends DomainEvent {
  eventType: 'ContentUpdated';
  title: string;
  readingTime?: number;
}

export interface ContentSEOUpdatedEvent extends DomainEvent {
  eventType: 'ContentSEOUpdated';
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

export interface ContentTagsAddedEvent extends DomainEvent {
  eventType: 'ContentTagsAdded';
  addedTags: string[];
  allTags: string[];
}

export interface ContentPublishedEvent extends DomainEvent {
  eventType: 'ContentPublished';
  publishedAt: Date;
  title: string;
  slug: string;
  type: string;
}

export interface ContentScheduledEvent extends DomainEvent {
  eventType: 'ContentScheduled';
  scheduledPublishAt: Date;
  title: string;
}

export interface ContentUnpublishedEvent extends DomainEvent {
  eventType: 'ContentUnpublished';
  title: string;
}

export interface ContentViewedEvent extends DomainEvent {
  eventType: 'ContentViewed';
  newViewCount: number;
}
