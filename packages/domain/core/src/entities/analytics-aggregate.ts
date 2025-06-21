// Analytics Aggregate - System metrics and business intelligence

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'timer';
export type MetricCategory = 'user' | 'project' | 'organization' | 'api' | 'content' | 'system';

export interface MetricDataPoint {
  readonly timestamp: Date;
  readonly value: number;
  readonly tags: Record<string, string>;
}

export interface MetricSummary {
  readonly count: number;
  readonly sum: number;
  readonly min: number;
  readonly max: number;
  readonly avg: number;
  readonly percentiles: Record<string, number>; // p50, p95, p99
}

export class AnalyticsAggregate extends AggregateRoot {
  private _name: string;
  private _description: string;
  private _type: MetricType;
  private _category: MetricCategory;
  private _organizationId?: string;
  private _dataPoints: MetricDataPoint[] = [];
  private _isActive: boolean = true;
  private _retentionDays: number = 90;
  private _summary?: MetricSummary;

  private constructor(
    id: string,
    name: string,
    description: string,
    type: MetricType,
    category: MetricCategory,
    organizationId?: string,
    retentionDays: number = 90,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._description = description;
    this._type = type;
    this._category = category;
    this._organizationId = organizationId;
    this._retentionDays = retentionDays;
  }

  public static create(
    id: string,
    name: string,
    description: string,
    type: MetricType,
    category: MetricCategory,
    organizationId?: string,
    retentionDays: number = 90
  ): AnalyticsAggregate {
    const analytics = new AnalyticsAggregate(id, name, description, type, category, organizationId, retentionDays);
    
    analytics.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AnalyticsMetricCreated',
      aggregateId: id,
      aggregateVersion: analytics.version,
      name,
      description,
      type,
      category,
      organizationId,
      retentionDays
    } as AnalyticsMetricCreatedEvent);

    return analytics;
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get type(): MetricType { return this._type; }
  get category(): MetricCategory { return this._category; }
  get organizationId(): string | undefined { return this._organizationId; }
  get dataPoints(): MetricDataPoint[] { return [...this._dataPoints]; }
  get isActive(): boolean { return this._isActive; }
  get retentionDays(): number { return this._retentionDays; }
  get summary(): MetricSummary | undefined { return this._summary; }

  // Business methods
  public recordDataPoint(value: number, tags: Record<string, string> = {}): void {
    if (!this._isActive) {
      throw new Error('Cannot record data points for inactive metric');
    }

    const dataPoint: MetricDataPoint = {
      timestamp: new Date(),
      value,
      tags
    };

    this._dataPoints.push(dataPoint);
    this.cleanupOldDataPoints();
    this.recalculateSummary();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AnalyticsDataPointRecorded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      value,
      tags,
      timestamp: dataPoint.timestamp,
      totalDataPoints: this._dataPoints.length
    } as AnalyticsDataPointRecordedEvent);
  }

  public recordBatch(dataPoints: { value: number; tags?: Record<string, string>; timestamp?: Date }[]): void {
    if (!this._isActive) {
      throw new Error('Cannot record data points for inactive metric');
    }

    const newDataPoints: MetricDataPoint[] = dataPoints.map(dp => ({
      timestamp: dp.timestamp || new Date(),
      value: dp.value,
      tags: dp.tags || {}
    }));

    this._dataPoints.push(...newDataPoints);
    this.cleanupOldDataPoints();
    this.recalculateSummary();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AnalyticsBatchRecorded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      batchSize: newDataPoints.length,
      totalDataPoints: this._dataPoints.length
    } as AnalyticsBatchRecordedEvent);
  }

  public updateRetentionPolicy(retentionDays: number): void {
    if (retentionDays <= 0) {
      throw new Error('Retention days must be positive');
    }

    this._retentionDays = retentionDays;
    this.cleanupOldDataPoints();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AnalyticsRetentionUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      newRetentionDays: retentionDays,
      remainingDataPoints: this._dataPoints.length
    } as AnalyticsRetentionUpdatedEvent);
  }

  public generateReport(startDate: Date, endDate: Date): AnalyticsReport {
    const filteredDataPoints = this._dataPoints.filter(
      dp => dp.timestamp >= startDate && dp.timestamp <= endDate
    );

    if (filteredDataPoints.length === 0) {
      return {
        metricName: this._name,
        period: { startDate, endDate },
        summary: {
          count: 0,
          sum: 0,
          min: 0,
          max: 0,
          avg: 0,
          percentiles: {}
        },
        dataPoints: []
      };
    }

    const values = filteredDataPoints.map(dp => dp.value).sort((a, b) => a - b);
    
    if (values.length === 0) {
      throw new Error('No data points available for summary calculation');
    }
    
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    const summary: MetricSummary = {
      count: values.length,
      sum,
      min: values[0] ?? 0,
      max: values[values.length - 1] ?? 0,
      avg: sum / values.length,
      percentiles: {
        p50: this.calculatePercentile(values, 50),
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99)
      }
    };

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AnalyticsReportGenerated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      startDate,
      endDate,
      dataPointCount: filteredDataPoints.length,
      summary
    } as AnalyticsReportGeneratedEvent);

    return {
      metricName: this._name,
      period: { startDate, endDate },
      summary,
      dataPoints: filteredDataPoints
    };
  }

  public deactivate(): void {
    if (!this._isActive) return;

    this._isActive = false;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AnalyticsMetricDeactivated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      finalDataPointCount: this._dataPoints.length
    } as AnalyticsMetricDeactivatedEvent);
  }

  private cleanupOldDataPoints(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this._retentionDays);
    
    const originalCount = this._dataPoints.length;
    this._dataPoints = this._dataPoints.filter(dp => dp.timestamp >= cutoffDate);
    
    if (this._dataPoints.length < originalCount) {
      this.addDomainEvent({
        id: crypto.randomUUID(),
        occurredAt: new Date(),
        eventType: 'AnalyticsDataPointsCleanedUp',
        aggregateId: this.id,
        aggregateVersion: this.version,
        removedCount: originalCount - this._dataPoints.length,
        remainingCount: this._dataPoints.length,
        cutoffDate
      } as AnalyticsDataPointsCleanedUpEvent);
    }
  }

  private recalculateSummary(): void {
    if (this._dataPoints.length === 0) {
      this._summary = undefined;
      return;
    }

    const values = this._dataPoints.map(dp => dp.value).sort((a, b) => a - b);
    const sum = values.reduce((acc, val) => acc + val, 0);
    
    // Values array is guaranteed to have at least one element due to the check above
    this._summary = {
      count: values.length,
      sum,
      min: values[0]!,
      max: values[values.length - 1]!,
      avg: sum / values.length,
      percentiles: {
        p50: this.calculatePercentile(values, 50),
        p95: this.calculatePercentile(values, 95),
        p99: this.calculatePercentile(values, 99)
      }
    };
  }

  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) {
      throw new Error('Cannot calculate percentile for empty array');
    }
    
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      const value = sortedValues[lower];
      if (value === undefined) {
        throw new Error('Invalid array index');
      }
      return value;
    }
    
    const weight = index - lower;
    const lowerValue = sortedValues[lower];
    const upperValue = sortedValues[upper];
    
    if (lowerValue === undefined || upperValue === undefined) {
      throw new Error('Invalid array indices');
    }
    
    return lowerValue * (1 - weight) + upperValue * weight;
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'AnalyticsMetricCreated':
        this.applyAnalyticsMetricCreated(event as AnalyticsMetricCreatedEvent);
        break;
      case 'AnalyticsDataPointRecorded':
        this.applyAnalyticsDataPointRecorded(event as AnalyticsDataPointRecordedEvent);
        break;
      case 'AnalyticsBatchRecorded':
        this.applyAnalyticsBatchRecorded(event as AnalyticsBatchRecordedEvent);
        break;
      case 'AnalyticsRetentionUpdated':
        this.applyAnalyticsRetentionUpdated(event as AnalyticsRetentionUpdatedEvent);
        break;
      case 'AnalyticsMetricDeactivated':
        this.applyAnalyticsMetricDeactivated(event as AnalyticsMetricDeactivatedEvent);
        break;
    }
  }

  private applyAnalyticsMetricCreated(event: AnalyticsMetricCreatedEvent): void {
    this._name = event.name;
    this._description = event.description;
    this._type = event.type;
    this._category = event.category;
    this._organizationId = event.organizationId;
    this._retentionDays = event.retentionDays;
    this._isActive = true;
  }

  private applyAnalyticsDataPointRecorded(event: AnalyticsDataPointRecordedEvent): void {
    // In event sourcing, we don't store the actual data points in events
    // This would be reconstructed from a separate time-series database
  }

  private applyAnalyticsBatchRecorded(event: AnalyticsBatchRecordedEvent): void {
    // Similar to single data point recording
  }

  private applyAnalyticsRetentionUpdated(event: AnalyticsRetentionUpdatedEvent): void {
    this._retentionDays = event.newRetentionDays;
  }

  private applyAnalyticsMetricDeactivated(event: AnalyticsMetricDeactivatedEvent): void {
    this._isActive = false;
  }
}

export interface AnalyticsReport {
  readonly metricName: string;
  readonly period: { startDate: Date; endDate: Date };
  readonly summary: MetricSummary;
  readonly dataPoints: MetricDataPoint[];
}

// Domain Events
export interface AnalyticsMetricCreatedEvent extends DomainEvent {
  eventType: 'AnalyticsMetricCreated';
  name: string;
  description: string;
  type: MetricType;
  category: MetricCategory;
  organizationId?: string;
  retentionDays: number;
}

export interface AnalyticsDataPointRecordedEvent extends DomainEvent {
  eventType: 'AnalyticsDataPointRecorded';
  value: number;
  tags: Record<string, string>;
  timestamp: Date;
  totalDataPoints: number;
}

export interface AnalyticsBatchRecordedEvent extends DomainEvent {
  eventType: 'AnalyticsBatchRecorded';
  batchSize: number;
  totalDataPoints: number;
}

export interface AnalyticsRetentionUpdatedEvent extends DomainEvent {
  eventType: 'AnalyticsRetentionUpdated';
  newRetentionDays: number;
  remainingDataPoints: number;
}

export interface AnalyticsReportGeneratedEvent extends DomainEvent {
  eventType: 'AnalyticsReportGenerated';
  startDate: Date;
  endDate: Date;
  dataPointCount: number;
  summary: MetricSummary;
}

export interface AnalyticsMetricDeactivatedEvent extends DomainEvent {
  eventType: 'AnalyticsMetricDeactivated';
  finalDataPointCount: number;
}

export interface AnalyticsDataPointsCleanedUpEvent extends DomainEvent {
  eventType: 'AnalyticsDataPointsCleanedUp';
  removedCount: number;
  remainingCount: number;
  cutoffDate: Date;
}
