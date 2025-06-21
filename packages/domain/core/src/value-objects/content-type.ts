// Content Type Value Object

export class ContentType {
  private static readonly VALID_TYPES = ['blog-post', 'page', 'case-study', 'whitepaper', 'documentation', 'announcement'] as const;
  private readonly _value: typeof ContentType.VALID_TYPES[number];

  constructor(value: string) {
    const normalizedValue = value.toLowerCase() as typeof ContentType.VALID_TYPES[number];
    
    if (!ContentType.VALID_TYPES.includes(normalizedValue)) {
      throw new Error(`Invalid content type: ${value}. Valid types are: ${ContentType.VALID_TYPES.join(', ')}`);
    }
    
    this._value = normalizedValue;
  }

  get value(): string {
    return this._value;
  }

  public static blogPost(): ContentType {
    return new ContentType('blog-post');
  }

  public static page(): ContentType {
    return new ContentType('page');
  }

  public static caseStudy(): ContentType {
    return new ContentType('case-study');
  }

  public static whitepaper(): ContentType {
    return new ContentType('whitepaper');
  }

  public static documentation(): ContentType {
    return new ContentType('documentation');
  }

  public static announcement(): ContentType {
    return new ContentType('announcement');
  }

  public isBlogPost(): boolean {
    return this._value === 'blog-post';
  }

  public isPage(): boolean {
    return this._value === 'page';
  }

  public isCaseStudy(): boolean {
    return this._value === 'case-study';
  }

  public isWhitepaper(): boolean {
    return this._value === 'whitepaper';
  }

  public isDocumentation(): boolean {
    return this._value === 'documentation';
  }

  public isAnnouncement(): boolean {
    return this._value === 'announcement';
  }

  public requiresSEO(): boolean {
    return this._value === 'blog-post' || this._value === 'page' || this._value === 'case-study';
  }

  public isPublicFacing(): boolean {
    return this._value !== 'documentation';
  }

  public equals(other: ContentType): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return this._value;
  }
}
