// AI Assessment Aggregate - AI Readiness and Maturity Evaluation

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { AssessmentStatus } from '../value-objects/assessment-status';
import { AIMaturityLevel } from '../value-objects/ai-maturity-level';
import { IndustryVertical } from '../value-objects/industry-vertical';

export interface AssessmentDimension {
  readonly name: string;
  readonly category: 'data' | 'infrastructure' | 'talent' | 'governance' | 'strategy' | 'culture';
  readonly score: number; // 0-100
  readonly weight: number; // 0-1
  readonly findings: string[];
  readonly recommendations: string[];
  readonly priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIUseCase {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly businessValue: number; // 0-100
  readonly technicalFeasibility: number; // 0-100
  readonly implementationComplexity: number; // 0-100
  readonly estimatedROI: number; // percentage
  readonly timeToValue: number; // months
  readonly requiredInvestment: number; // USD
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly dependencies: string[];
  readonly kpis: string[];
}

export interface CompetitorAnalysis {
  readonly competitorName: string;
  readonly aiMaturityLevel: AIMaturityLevel;
  readonly keyAICapabilities: string[];
  readonly competitiveAdvantages: string[];
  readonly marketPosition: string;
  readonly threatLevel: 'low' | 'medium' | 'high';
}

export class AIAssessmentAggregate extends AggregateRoot {
  private _clientId: string;
  private _organizationName: string;
  private _industryVertical: IndustryVertical;
  private _assessmentType: 'readiness' | 'maturity' | 'strategy' | 'comprehensive';
  private _status: AssessmentStatus;
  private _conductedBy: string;
  private _dimensions: AssessmentDimension[] = [];
  private _overallScore: number = 0;
  private _maturityLevel: AIMaturityLevel;
  private _identifiedUseCases: AIUseCase[] = [];
  private _competitorAnalysis: CompetitorAnalysis[] = [];
  private _strategicRecommendations: string[] = [];
  private _roadmapItems: RoadmapItem[] = [];
  private _estimatedBudget: number = 0;
  private _expectedROI: number = 0;
  private _riskFactors: string[] = [];
  private _successFactors: string[] = [];
  private _nextSteps: string[] = [];
  private _followUpDate?: Date;
  private _completedAt?: Date;

  private constructor(
    id: string,
    clientId: string,
    organizationName: string,
    industryVertical: IndustryVertical,
    assessmentType: 'readiness' | 'maturity' | 'strategy' | 'comprehensive',
    conductedBy: string,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._clientId = clientId;
    this._organizationName = organizationName;
    this._industryVertical = industryVertical;
    this._assessmentType = assessmentType;
    this._conductedBy = conductedBy;
    this._status = AssessmentStatus.initiated();
    this._maturityLevel = AIMaturityLevel.beginner();
  }

  public static create(
    id: string,
    clientId: string,
    organizationName: string,
    industryVertical: IndustryVertical,
    assessmentType: 'readiness' | 'maturity' | 'strategy' | 'comprehensive',
    conductedBy: string
  ): AIAssessmentAggregate {
    const assessment = new AIAssessmentAggregate(
      id, clientId, organizationName, industryVertical, assessmentType, conductedBy
    );

    assessment.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AIAssessmentInitiated',
      aggregateId: id,
      aggregateVersion: assessment.version,
      clientId,
      organizationName,
      industryVertical: industryVertical.getValue(),
      assessmentType,
      conductedBy
    } as AIAssessmentInitiatedEvent);

    return assessment;
  }

  // Getters
  get clientId(): string { return this._clientId; }
  get organizationName(): string { return this._organizationName; }
  get industryVertical(): IndustryVertical { return this._industryVertical; }
  get assessmentType(): string { return this._assessmentType; }
  get status(): AssessmentStatus { return this._status; }
  get dimensions(): AssessmentDimension[] { return [...this._dimensions]; }
  get overallScore(): number { return this._overallScore; }
  get maturityLevel(): AIMaturityLevel { return this._maturityLevel; }
  get identifiedUseCases(): AIUseCase[] { return [...this._identifiedUseCases]; }
  get strategicRecommendations(): string[] { return [...this._strategicRecommendations]; }
  get roadmapItems(): RoadmapItem[] { return [...this._roadmapItems]; }
  get estimatedBudget(): number { return this._estimatedBudget; }
  get expectedROI(): number { return this._expectedROI; }

  // Business methods
  public addDimensionScore(dimension: AssessmentDimension): void {
    if (!this._status.isInProgress()) {
      throw new Error('Cannot add dimension scores to non-active assessment');
    }

    const existingIndex = this._dimensions.findIndex(d => d.name === dimension.name);
    if (existingIndex >= 0) {
      this._dimensions[existingIndex] = dimension;
    } else {
      this._dimensions.push(dimension);
    }

    this.recalculateOverallScore();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AssessmentDimensionScored',
      aggregateId: this.id,
      aggregateVersion: this.version,
      dimensionName: dimension.name,
      score: dimension.score,
      category: dimension.category,
      priority: dimension.priority,
      newOverallScore: this._overallScore
    } as AssessmentDimensionScoredEvent);
  }

  public identifyUseCase(useCase: AIUseCase): void {
    if (!this._status.isInProgress()) {
      throw new Error('Cannot add use cases to non-active assessment');
    }

    this._identifiedUseCases.push(useCase);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AIUseCaseIdentified',
      aggregateId: this.id,
      aggregateVersion: this.version,
      useCaseId: useCase.id,
      useCaseName: useCase.name,
      businessValue: useCase.businessValue,
      technicalFeasibility: useCase.technicalFeasibility,
      estimatedROI: useCase.estimatedROI,
      timeToValue: useCase.timeToValue,
      riskLevel: useCase.riskLevel
    } as AIUseCaseIdentifiedEvent);
  }

  public addCompetitorAnalysis(analysis: CompetitorAnalysis): void {
    this._competitorAnalysis.push(analysis);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'CompetitorAnalysisAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      competitorName: analysis.competitorName,
      maturityLevel: analysis.aiMaturityLevel.getValue(),
      threatLevel: analysis.threatLevel,
      capabilityCount: analysis.keyAICapabilities.length
    } as CompetitorAnalysisAddedEvent);
  }

  public generateRecommendations(recommendations: string[]): void {
    this._strategicRecommendations = recommendations;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'StrategicRecommendationsGenerated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      recommendationCount: recommendations.length,
      overallScore: this._overallScore,
      maturityLevel: this._maturityLevel.getValue()
    } as StrategicRecommendationsGeneratedEvent);
  }

  public createRoadmap(items: RoadmapItem[]): void {
    this._roadmapItems = items.sort((a, b) => a.priority - b.priority);
    
    // Calculate total budget and expected ROI
    this._estimatedBudget = items.reduce((sum, item) => sum + item.estimatedCost, 0);
    this._expectedROI = this.calculateExpectedROI();
    
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AIRoadmapCreated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      roadmapItemCount: items.length,
      estimatedBudget: this._estimatedBudget,
      expectedROI: this._expectedROI,
      timelineMonths: Math.max(...items.map(item => item.timelineMonths))
    } as AIRoadmapCreatedEvent);
  }

  public complete(nextSteps: string[], followUpDate?: Date): void {
    if (!this._status.isInProgress()) {
      throw new Error('Assessment is not in progress');
    }

    this._status = AssessmentStatus.completed();
    this._completedAt = new Date();
    this._nextSteps = nextSteps;
    this._followUpDate = followUpDate;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AIAssessmentCompleted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      completedAt: this._completedAt,
      overallScore: this._overallScore,
      maturityLevel: this._maturityLevel.getValue(),
      useCaseCount: this._identifiedUseCases.length,
      recommendationCount: this._strategicRecommendations.length,
      estimatedBudget: this._estimatedBudget,
      expectedROI: this._expectedROI,
      followUpDate
    } as AIAssessmentCompletedEvent);
  }

  public startImplementation(selectedUseCases: string[]): void {
    if (!this._status.isCompleted()) {
      throw new Error('Assessment must be completed before starting implementation');
    }

    this._status = AssessmentStatus.implementing();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AIImplementationStarted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      selectedUseCases,
      implementationStartedAt: this.updatedAt
    } as AIImplementationStartedEvent);
  }

  private recalculateOverallScore(): void {
    if (this._dimensions.length === 0) {
      this._overallScore = 0;
      return;
    }

    const weightedSum = this._dimensions.reduce((sum, dim) => sum + (dim.score * dim.weight), 0);
    const totalWeight = this._dimensions.reduce((sum, dim) => sum + dim.weight, 0);
    
    this._overallScore = Math.round(weightedSum / totalWeight);
    this._maturityLevel = this.determineMaturityLevel(this._overallScore);
  }

  private determineMaturityLevel(score: number): AIMaturityLevel {
    if (score >= 80) return AIMaturityLevel.advanced();
    if (score >= 60) return AIMaturityLevel.intermediate();
    if (score >= 40) return AIMaturityLevel.developing();
    return AIMaturityLevel.beginner();
  }

  private calculateExpectedROI(): number {
    if (this._identifiedUseCases.length === 0 || this._estimatedBudget === 0) {
      return 0;
    }

    const totalExpectedValue = this._identifiedUseCases.reduce((sum, useCase) => {
      return sum + (useCase.requiredInvestment * (useCase.estimatedROI / 100));
    }, 0);

    return Math.round((totalExpectedValue / this._estimatedBudget) * 100);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'AIAssessmentInitiated':
        this.applyAIAssessmentInitiated(event as AIAssessmentInitiatedEvent);
        break;
      case 'AssessmentDimensionScored':
        this.applyAssessmentDimensionScored(event as AssessmentDimensionScoredEvent);
        break;
      case 'AIUseCaseIdentified':
        this.applyAIUseCaseIdentified(event as AIUseCaseIdentifiedEvent);
        break;
      case 'AIAssessmentCompleted':
        this.applyAIAssessmentCompleted(event as AIAssessmentCompletedEvent);
        break;
      case 'AIImplementationStarted':
        this.applyAIImplementationStarted(event as AIImplementationStartedEvent);
        break;
    }
  }

  private applyAIAssessmentInitiated(event: AIAssessmentInitiatedEvent): void {
    this._clientId = event.clientId;
    this._organizationName = event.organizationName;
    this._industryVertical = IndustryVertical.fromString(event.industryVertical);
    this._assessmentType = event.assessmentType;
    this._conductedBy = event.conductedBy;
    this._status = AssessmentStatus.initiated();
  }

  private applyAssessmentDimensionScored(event: AssessmentDimensionScoredEvent): void {
    this._overallScore = event.newOverallScore;
    this._maturityLevel = this.determineMaturityLevel(this._overallScore);
  }

  private applyAIUseCaseIdentified(event: AIUseCaseIdentifiedEvent): void {
    // Use case would be reconstructed from event data in real implementation
  }

  private applyAIAssessmentCompleted(event: AIAssessmentCompletedEvent): void {
    this._status = AssessmentStatus.completed();
    this._completedAt = event.completedAt;
    this._overallScore = event.overallScore;
    this._maturityLevel = AIMaturityLevel.fromString(event.maturityLevel);
    this._estimatedBudget = event.estimatedBudget;
    this._expectedROI = event.expectedROI;
    this._followUpDate = event.followUpDate;
  }

  private applyAIImplementationStarted(event: AIImplementationStartedEvent): void {
    this._status = AssessmentStatus.implementing();
  }
}

export interface RoadmapItem {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly category: 'quick-win' | 'strategic' | 'transformational';
  readonly priority: number; // 1-10
  readonly estimatedCost: number;
  readonly timelineMonths: number;
  readonly dependencies: string[];
  readonly expectedBenefits: string[];
  readonly riskLevel: 'low' | 'medium' | 'high';
  readonly requiredSkills: string[];
  readonly kpis: string[];
}

// Domain Events
export interface AIAssessmentInitiatedEvent extends DomainEvent {
  eventType: 'AIAssessmentInitiated';
  clientId: string;
  organizationName: string;
  industryVertical: string;
  assessmentType: 'readiness' | 'maturity' | 'strategy' | 'comprehensive';
  conductedBy: string;
}

export interface AssessmentDimensionScoredEvent extends DomainEvent {
  eventType: 'AssessmentDimensionScored';
  dimensionName: string;
  score: number;
  category: string;
  priority: string;
  newOverallScore: number;
}

export interface AIUseCaseIdentifiedEvent extends DomainEvent {
  eventType: 'AIUseCaseIdentified';
  useCaseId: string;
  useCaseName: string;
  businessValue: number;
  technicalFeasibility: number;
  estimatedROI: number;
  timeToValue: number;
  riskLevel: string;
}

export interface CompetitorAnalysisAddedEvent extends DomainEvent {
  eventType: 'CompetitorAnalysisAdded';
  competitorName: string;
  maturityLevel: string;
  threatLevel: string;
  capabilityCount: number;
}

export interface StrategicRecommendationsGeneratedEvent extends DomainEvent {
  eventType: 'StrategicRecommendationsGenerated';
  recommendationCount: number;
  overallScore: number;
  maturityLevel: string;
}

export interface AIRoadmapCreatedEvent extends DomainEvent {
  eventType: 'AIRoadmapCreated';
  roadmapItemCount: number;
  estimatedBudget: number;
  expectedROI: number;
  timelineMonths: number;
}

export interface AIAssessmentCompletedEvent extends DomainEvent {
  eventType: 'AIAssessmentCompleted';
  completedAt: Date;
  overallScore: number;
  maturityLevel: string;
  useCaseCount: number;
  recommendationCount: number;
  estimatedBudget: number;
  expectedROI: number;
  followUpDate?: Date;
}

export interface AIImplementationStartedEvent extends DomainEvent {
  eventType: 'AIImplementationStarted';
  selectedUseCases: string[];
  implementationStartedAt: Date;
}
