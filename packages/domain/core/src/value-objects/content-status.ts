// Content Status Value Object

export class ContentStatus {
  private static readonly VALID_STATUSES = ['draft', 'review', 'scheduled', 'published', 'archived'] as const;
  private readonly _value: typeof ContentStatus.VALID_STATUSES[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof ContentStatus.VALID_STATUSES[number];
    
    if (!ContentStatus.VALID_STATUSES.includes(normalizedValue)) {
      throw new Error(`Invalid content status: ${value}. Valid statuses are: ${ContentStatus.VALID_STATUSES.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static draft(): ContentStatus {
    return new ContentStatus('draft');
  }

  public static review(): ContentStatus {
    return new ContentStatus('review');
  }

  public static scheduled(): ContentStatus {
    return new ContentStatus('scheduled');
  }

  public static published(): ContentStatus {
    return new ContentStatus('published');
  }

  public static archived(): ContentStatus {
    return new ContentStatus('archived');
  }

  public isDraft(): boolean {
    return this._value === 'draft';
  }

  public isReview(): boolean {
    return this._value === 'review';
  }

  public isScheduled(): boolean {
    return this._value === 'scheduled';
  }

  public isPublished(): boolean {
    return this._value === 'published';
  }

  public isArchived(): boolean {
    return this._value === 'archived';
  }

  public isPublic(): boolean {
    return this._value === 'published';
  }

  public canEdit(): boolean {
    return this._value === 'draft' || this._value === 'review';
  }

  public canTransitionTo(newStatus: ContentStatus): boolean {
    const transitions: Record<string, string[]> = {
      'draft': ['review', 'scheduled', 'published', 'archived'],
      'review': ['draft', 'scheduled', 'published', 'archived'],
      'scheduled': ['draft', 'published', 'archived'],
      'published': ['archived'],
      'archived': ['draft']
    };

    return transitions[this._value]?.includes(newStatus._value) ?? false;
  }

  public equals(other: ContentStatus): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
