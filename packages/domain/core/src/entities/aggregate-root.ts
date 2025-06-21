// Aggregate Root - DDD building block for consistency boundaries

import { DomainEvent } from '../events/event-store';

export abstract class AggregateRoot {
  private _domainEvents: DomainEvent[] = [];
  private _version: number = 0;

  protected constructor(
    public readonly id: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  get version(): number {
    return this._version;
  }

  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
    this._version++;
  }

  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  public markEventsAsCommitted(): void {
    this._domainEvents = [];
  }

  // For event sourcing - replay events to rebuild state
  public applyEvent(event: DomainEvent, isFromHistory: boolean = false): void {
    this.when(event);
    if (!isFromHistory) {
      this.addDomainEvent(event);
    } else {
      this._version++;
    }
  }

  // Override in concrete aggregates to handle specific events
  protected abstract when(event: DomainEvent): void;
}

export interface Repository<T extends AggregateRoot> {
  save(aggregate: T): Promise<void>;
  getById(id: string): Promise<T | null>;
  getByIdAndVersion(id: string, version: number): Promise<T | null>;
}
