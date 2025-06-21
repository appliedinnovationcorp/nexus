// AI Model Aggregate - AI Model Lifecycle Management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { ModelStatus } from '../value-objects/model-status';
import { ModelType } from '../value-objects/model-type';
import { Money } from '../value-objects/money';

export interface ModelMetrics {
  readonly accuracy: number;
  readonly precision: number;
  readonly recall: number;
  readonly f1Score: number;
  readonly latency: number; // milliseconds
  readonly throughput: number; // requests per second
  readonly errorRate: number;
  readonly costPerInference: number;
  readonly dataQualityScore: number;
  readonly biasScore: number;
  readonly explainabilityScore: number;
}

export interface TrainingConfiguration {
  readonly framework: string; // TensorFlow, PyTorch, etc.
  readonly algorithm: string;
  readonly hyperparameters: Record<string, any>;
  readonly datasetSize: number;
  readonly trainingDuration: number; // hours
  readonly computeResources: {
    readonly cpuCores: number;
    readonly gpuCount: number;
    readonly memoryGB: number;
    readonly storageGB: number;
  };
  readonly environmentConfig: Record<string, string>;
}

export interface DeploymentConfiguration {
  readonly environment: 'development' | 'staging' | 'production';
  readonly infrastructure: 'cloud' | 'on-premise' | 'edge' | 'hybrid';
  readonly scalingPolicy: {
    readonly minInstances: number;
    readonly maxInstances: number;
    readonly targetUtilization: number;
  };
  readonly securityConfig: {
    readonly encryption: boolean;
    readonly accessControl: string[];
    readonly auditLogging: boolean;
  };
  readonly monitoringConfig: {
    readonly metricsCollection: boolean;
    readonly alertThresholds: Record<string, number>;
    readonly dashboardUrl?: string;
  };
}

export interface ModelVersion {
  readonly version: string;
  readonly createdAt: Date;
  readonly trainingConfig: TrainingConfiguration;
  readonly metrics: ModelMetrics;
  readonly changeLog: string;
  readonly approvedBy?: string;
  readonly approvedAt?: Date;
  readonly isActive: boolean;
  readonly artifactUrl: string;
  readonly checksumHash: string;
}

export class AIModelAggregate extends AggregateRoot {
  private _name: string;
  private _description: string;
  private _type: ModelType;
  private _status: ModelStatus;
  private _organizationId: string;
  private _projectId?: string;
  private _ownerId: string;
  private _versions: ModelVersion[] = [];
  private _currentVersion?: string;
  private _deploymentConfig?: DeploymentConfiguration;
  private _usageStats: ModelUsageStats;
  private _complianceStatus: ComplianceStatus;
  private _businessMetrics: BusinessMetrics;
  private _tags: string[] = [];
  private _dependencies: string[] = [];
  private _dataLineage: DataLineage[] = [];
  private _ethicsReview?: EthicsReview;
  private _costTracking: CostTracking;

  private constructor(
    id: string,
    name: string,
    description: string,
    type: ModelType,
    organizationId: string,
    ownerId: string,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._description = description;
    this._type = type;
    this._organizationId = organizationId;
    this._ownerId = ownerId;
    this._status = ModelStatus.development();
    this._usageStats = {
      totalInferences: 0,
      dailyInferences: 0,
      monthlyInferences: 0,
      averageLatency: 0,
      errorCount: 0,
      lastUsedAt: undefined
    };
    this._complianceStatus = {
      gdprCompliant: false,
      hipaaCompliant: false,
      soxCompliant: false,
      lastAuditDate: undefined,
      complianceScore: 0
    };
    this._businessMetrics = {
      revenueGenerated: Money.zero('USD'),
      costSavings: Money.zero('USD'),
      customerSatisfactionImpact: 0,
      operationalEfficiencyGain: 0
    };
    this._costTracking = {
      developmentCost: Money.zero('USD'),
      trainingCost: Money.zero('USD'),
      deploymentCost: Money.zero('USD'),
      operationalCost: Money.zero('USD'),
      totalCost: Money.zero('USD')
    };
  }

  public static create(
    id: string,
    name: string,
    description: string,
    type: ModelType,
    organizationId: string,
    ownerId: string,
    projectId?: string
  ): AIModelAggregate {
    const model = new AIModelAggregate(id, name, description, type, organizationId, ownerId);
    if (projectId) model._projectId = projectId;

    model.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AIModelCreated',
      aggregateId: id,
      aggregateVersion: model.version,
      name,
      description,
      type: type.getValue(),
      organizationId,
      ownerId,
      projectId
    } as AIModelCreatedEvent);

    return model;
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get type(): ModelType { return this._type; }
  get status(): ModelStatus { return this._status; }
  get organizationId(): string { return this._organizationId; }
  get ownerId(): string { return this._ownerId; }
  get versions(): ModelVersion[] { return [...this._versions]; }
  get currentVersion(): string | undefined { return this._currentVersion; }
  get usageStats(): ModelUsageStats { return this._usageStats; }
  get complianceStatus(): ComplianceStatus { return this._complianceStatus; }
  get businessMetrics(): BusinessMetrics { return this._businessMetrics; }
  get costTracking(): CostTracking { return this._costTracking; }

  // Business methods
  public addVersion(
    version: string,
    trainingConfig: TrainingConfiguration,
    metrics: ModelMetrics,
    changeLog: string,
    artifactUrl: string,
    checksumHash: string
  ): void {
    if (this._versions.some(v => v.version === version)) {
      throw new Error(`Version ${version} already exists`);
    }

    const modelVersion: ModelVersion = {
      version,
      createdAt: new Date(),
      trainingConfig,
      metrics,
      changeLog,
      isActive: false,
      artifactUrl,
      checksumHash
    };

    this._versions.push(modelVersion);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModelVersionAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      modelVersion: version,
      metrics,
      trainingDuration: trainingConfig.trainingDuration,
      datasetSize: trainingConfig.datasetSize,
      framework: trainingConfig.framework
    } as ModelVersionAddedEvent);
  }

  public approveVersion(version: string, approvedBy: string): void {
    const versionIndex = this._versions.findIndex(v => v.version === version);
    if (versionIndex === -1) {
      throw new Error(`Version ${version} not found`);
    }

    const existingVersion = this._versions[versionIndex];
    if (!existingVersion) {
      throw new Error(`Version ${version} not found`);
    }

    this._versions[versionIndex] = {
      version: existingVersion.version,
      createdAt: existingVersion.createdAt,
      trainingConfig: existingVersion.trainingConfig,
      metrics: existingVersion.metrics,
      changeLog: existingVersion.changeLog,
      approvedBy,
      approvedAt: new Date(),
      isActive: existingVersion.isActive,
      artifactUrl: existingVersion.artifactUrl,
      checksumHash: existingVersion.checksumHash
    };

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModelVersionApproved',
      aggregateId: this.id,
      aggregateVersion: this.version,
      modelVersion: version,
      approvedBy,
      approvedAt: this._versions[versionIndex].approvedAt!
    } as ModelVersionApprovedEvent);
  }

  public deploy(version: string, deploymentConfig: DeploymentConfiguration): void {
    const versionToDeploy = this._versions.find(v => v.version === version);
    if (!versionToDeploy) {
      throw new Error(`Version ${version} not found`);
    }

    if (!versionToDeploy.approvedBy) {
      throw new Error(`Version ${version} must be approved before deployment`);
    }

    // Deactivate current version
    if (this._currentVersion) {
      const currentIndex = this._versions.findIndex(v => v.version === this._currentVersion);
      if (currentIndex >= 0) {
        const currentVersionData = this._versions[currentIndex];
        if (!currentVersionData) {
          throw new Error(`Current version data not found`);
        }
        this._versions[currentIndex] = {
          version: currentVersionData.version,
          createdAt: currentVersionData.createdAt,
          trainingConfig: currentVersionData.trainingConfig,
          metrics: currentVersionData.metrics,
          changeLog: currentVersionData.changeLog,
          approvedBy: currentVersionData.approvedBy,
          approvedAt: currentVersionData.approvedAt,
          isActive: false,
          artifactUrl: currentVersionData.artifactUrl,
          checksumHash: currentVersionData.checksumHash
        };
      }
    }

    // Activate new version
    const newVersionIndex = this._versions.findIndex(v => v.version === version);
    const newVersionData = this._versions[newVersionIndex];
    if (!newVersionData) {
      throw new Error(`New version data not found`);
    }
    this._versions[newVersionIndex] = {
      version: newVersionData.version,
      createdAt: newVersionData.createdAt,
      trainingConfig: newVersionData.trainingConfig,
      metrics: newVersionData.metrics,
      changeLog: newVersionData.changeLog,
      approvedBy: newVersionData.approvedBy,
      approvedAt: newVersionData.approvedAt,
      isActive: true,
      artifactUrl: newVersionData.artifactUrl,
      checksumHash: newVersionData.checksumHash
    };

    this._currentVersion = version;
    this._deploymentConfig = deploymentConfig;
    this._status = ModelStatus.deployed();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModelDeployed',
      aggregateId: this.id,
      aggregateVersion: this.version,
      deployedVersion: version,
      environment: deploymentConfig.environment,
      infrastructure: deploymentConfig.infrastructure,
      deployedAt: this.updatedAt
    } as ModelDeployedEvent);
  }

  public recordInference(
    latency: number,
    wasError: boolean = false,
    cost: number = 0
  ): void {
    if (!this._status.isDeployed()) {
      throw new Error('Model must be deployed to record inferences');
    }

    const now = new Date();
    this._usageStats = {
      totalInferences: this._usageStats.totalInferences + 1,
      dailyInferences: this._usageStats.dailyInferences + 1,
      monthlyInferences: this._usageStats.monthlyInferences + 1,
      averageLatency: (this._usageStats.averageLatency * this._usageStats.totalInferences + latency) / (this._usageStats.totalInferences + 1),
      errorCount: this._usageStats.errorCount + (wasError ? 1 : 0),
      lastUsedAt: now
    };

    // Update operational costs
    const additionalCost = Money.fromPlainObject({ amount: cost, currency: 'USD' });
    this._costTracking = {
      ...this._costTracking,
      operationalCost: this._costTracking.operationalCost.add(additionalCost),
      totalCost: this._costTracking.totalCost.add(additionalCost)
    };

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModelInferenceRecorded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      latency,
      wasError,
      cost,
      totalInferences: this._usageStats.totalInferences,
      averageLatency: this._usageStats.averageLatency,
      errorRate: (this._usageStats.errorCount / this._usageStats.totalInferences) * 100
    } as ModelInferenceRecordedEvent);
  }

  public updateBusinessMetrics(
    revenueGenerated?: Money,
    costSavings?: Money,
    customerSatisfactionImpact?: number,
    operationalEfficiencyGain?: number
  ): void {
    this._businessMetrics = {
      revenueGenerated: revenueGenerated || this._businessMetrics.revenueGenerated,
      costSavings: costSavings || this._businessMetrics.costSavings,
      customerSatisfactionImpact: customerSatisfactionImpact ?? this._businessMetrics.customerSatisfactionImpact,
      operationalEfficiencyGain: operationalEfficiencyGain ?? this._businessMetrics.operationalEfficiencyGain
    };

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModelBusinessMetricsUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      revenueGenerated: this._businessMetrics.revenueGenerated.toPlainObject(),
      costSavings: this._businessMetrics.costSavings.toPlainObject(),
      customerSatisfactionImpact: this._businessMetrics.customerSatisfactionImpact,
      operationalEfficiencyGain: this._businessMetrics.operationalEfficiencyGain
    } as ModelBusinessMetricsUpdatedEvent);
  }

  public conductEthicsReview(
    reviewedBy: string,
    biasAssessment: string,
    fairnessScore: number,
    transparencyScore: number,
    accountabilityMeasures: string[],
    recommendations: string[]
  ): void {
    this._ethicsReview = {
      reviewedBy,
      reviewedAt: new Date(),
      biasAssessment,
      fairnessScore,
      transparencyScore,
      accountabilityMeasures,
      recommendations,
      overallEthicsScore: Math.round((fairnessScore + transparencyScore) / 2)
    };

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModelEthicsReviewConducted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      reviewedBy,
      fairnessScore,
      transparencyScore,
      overallEthicsScore: this._ethicsReview.overallEthicsScore,
      recommendationCount: recommendations.length
    } as ModelEthicsReviewConductedEvent);
  }

  public retire(reason: string): void {
    if (this._status.isRetired()) {
      throw new Error('Model is already retired');
    }

    this._status = ModelStatus.retired();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModelRetired',
      aggregateId: this.id,
      aggregateVersion: this.version,
      reason,
      retiredAt: this.updatedAt,
      totalInferences: this._usageStats.totalInferences,
      totalRevenue: this._businessMetrics.revenueGenerated.toPlainObject(),
      totalCost: this._costTracking.totalCost.toPlainObject()
    } as ModelRetiredEvent);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'AIModelCreated':
        this.applyAIModelCreated(event as AIModelCreatedEvent);
        break;
      case 'ModelVersionAdded':
        this.applyModelVersionAdded(event as ModelVersionAddedEvent);
        break;
      case 'ModelDeployed':
        this.applyModelDeployed(event as ModelDeployedEvent);
        break;
      case 'ModelInferenceRecorded':
        this.applyModelInferenceRecorded(event as ModelInferenceRecordedEvent);
        break;
      case 'ModelRetired':
        this.applyModelRetired(event as ModelRetiredEvent);
        break;
    }
  }

  private applyAIModelCreated(event: AIModelCreatedEvent): void {
    this._name = event.name;
    this._description = event.description;
    this._type = ModelType.fromString(event.type);
    this._organizationId = event.organizationId;
    this._ownerId = event.ownerId;
    this._projectId = event.projectId;
    this._status = ModelStatus.development();
  }

  private applyModelVersionAdded(event: ModelVersionAddedEvent): void {
    // Version would be reconstructed from event data
  }

  private applyModelDeployed(event: ModelDeployedEvent): void {
    this._currentVersion = event.deployedVersion;
    this._status = ModelStatus.deployed();
  }

  private applyModelInferenceRecorded(event: ModelInferenceRecordedEvent): void {
    this._usageStats = {
      ...this._usageStats,
      totalInferences: event.totalInferences,
      averageLatency: event.averageLatency
    };
  }

  private applyModelRetired(event: ModelRetiredEvent): void {
    this._status = ModelStatus.retired();
  }
}

// Supporting interfaces
export interface ModelUsageStats {
  totalInferences: number;
  dailyInferences: number;
  monthlyInferences: number;
  averageLatency: number;
  errorCount: number;
  lastUsedAt?: Date;
}

export interface ComplianceStatus {
  gdprCompliant: boolean;
  hipaaCompliant: boolean;
  soxCompliant: boolean;
  lastAuditDate?: Date;
  complianceScore: number;
}

export interface BusinessMetrics {
  revenueGenerated: Money;
  costSavings: Money;
  customerSatisfactionImpact: number;
  operationalEfficiencyGain: number;
}

export interface CostTracking {
  developmentCost: Money;
  trainingCost: Money;
  deploymentCost: Money;
  operationalCost: Money;
  totalCost: Money;
}

export interface DataLineage {
  datasetId: string;
  datasetName: string;
  version: string;
  source: string;
  transformations: string[];
  qualityScore: number;
}

export interface EthicsReview {
  reviewedBy: string;
  reviewedAt: Date;
  biasAssessment: string;
  fairnessScore: number;
  transparencyScore: number;
  accountabilityMeasures: string[];
  recommendations: string[];
  overallEthicsScore: number;
}

// Domain Events
export interface AIModelCreatedEvent extends DomainEvent {
  eventType: 'AIModelCreated';
  name: string;
  description: string;
  type: string;
  organizationId: string;
  ownerId: string;
  projectId?: string;
}

export interface ModelVersionAddedEvent extends DomainEvent {
  eventType: 'ModelVersionAdded';
  modelVersion: string;
  metrics: ModelMetrics;
  trainingDuration: number;
  datasetSize: number;
  framework: string;
}

export interface ModelVersionApprovedEvent extends DomainEvent {
  eventType: 'ModelVersionApproved';
  modelVersion: string;
  approvedBy: string;
  approvedAt: Date;
}

export interface ModelDeployedEvent extends DomainEvent {
  eventType: 'ModelDeployed';
  deployedVersion: string;
  environment: string;
  infrastructure: string;
  deployedAt: Date;
}

export interface ModelInferenceRecordedEvent extends DomainEvent {
  eventType: 'ModelInferenceRecorded';
  latency: number;
  wasError: boolean;
  cost: number;
  totalInferences: number;
  averageLatency: number;
  errorRate: number;
}

export interface ModelBusinessMetricsUpdatedEvent extends DomainEvent {
  eventType: 'ModelBusinessMetricsUpdated';
  revenueGenerated: any;
  costSavings: any;
  customerSatisfactionImpact: number;
  operationalEfficiencyGain: number;
}

export interface ModelEthicsReviewConductedEvent extends DomainEvent {
  eventType: 'ModelEthicsReviewConducted';
  reviewedBy: string;
  fairnessScore: number;
  transparencyScore: number;
  overallEthicsScore: number;
  recommendationCount: number;
}

export interface ModelRetiredEvent extends DomainEvent {
  eventType: 'ModelRetired';
  reason: string;
  retiredAt: Date;
  totalInferences: number;
  totalRevenue: any;
  totalCost: any;
}
