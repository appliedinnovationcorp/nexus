// Predictive Intelligence Aggregate - AI-powered business forecasting and optimization

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';

export interface MarketIntelligence {
  readonly industryTrends: {
    readonly trend: string;
    readonly impact: 'high' | 'medium' | 'low';
    readonly timeframe: string;
    readonly confidence: number;
    readonly opportunities: string[];
  }[];
  readonly competitorMovements: {
    readonly competitor: string;
    readonly action: string;
    readonly marketImpact: number;
    readonly threatLevel: 'critical' | 'high' | 'medium' | 'low';
    readonly responseRecommendation: string;
  }[];
  readonly emergingTechnologies: {
    readonly technology: string;
    readonly maturityLevel: number;
    readonly adoptionRate: number;
    readonly businessPotential: number;
    readonly implementationComplexity: number;
  }[];
}

export interface ClientSuccessPrediction {
  readonly clientId: string;
  readonly churnProbability: number;
  readonly expansionProbability: number;
  readonly satisfactionTrend: 'improving' | 'stable' | 'declining';
  readonly riskFactors: string[];
  readonly interventionRecommendations: {
    readonly action: string;
    readonly priority: 'urgent' | 'high' | 'medium' | 'low';
    readonly expectedImpact: number;
    readonly effort: number;
  }[];
  readonly upsellOpportunities: {
    readonly service: string;
    readonly probability: number;
    readonly estimatedValue: number;
    readonly optimalTiming: Date;
  }[];
}

export interface ResourceOptimization {
  readonly consultantUtilization: {
    readonly consultantId: string;
    readonly currentUtilization: number;
    readonly optimalUtilization: number;
    readonly skillGaps: string[];
    readonly trainingRecommendations: string[];
    readonly projectFit: {
      readonly projectId: string;
      readonly fitScore: number;
      readonly reasoning: string;
    }[];
  }[];
  readonly capacityForecast: {
    readonly timeframe: string;
    readonly demandForecast: number;
    readonly capacityGap: number;
    readonly hiringRecommendations: {
      readonly role: string;
      readonly urgency: 'immediate' | 'within-month' | 'within-quarter';
      readonly skillRequirements: string[];
    }[];
  }[];
}

export interface RevenueIntelligence {
  readonly pipelinePrediction: {
    readonly month: string;
    readonly predictedRevenue: number;
    readonly confidence: number;
    readonly keyDrivers: string[];
    readonly risks: string[];
  }[];
  readonly pricingOptimization: {
    readonly serviceType: string;
    readonly currentPricing: number;
    readonly optimalPricing: number;
    readonly demandElasticity: number;
    readonly competitorPricing: number;
    readonly recommendedStrategy: string;
  }[];
  readonly marketSizing: {
    readonly segment: string;
    readonly totalAddressableMarket: number;
    readonly servicableAddressableMarket: number;
    readonly penetrationRate: number;
    readonly growthRate: number;
  }[];
}

export class PredictiveIntelligenceAggregate extends AggregateRoot {
  private _organizationId: string;
  private _analysisType: 'market' | 'client-success' | 'resource-optimization' | 'revenue-intelligence' | 'comprehensive';
  private _marketIntelligence?: MarketIntelligence;
  private _clientPredictions: ClientSuccessPrediction[] = [];
  private _resourceOptimization?: ResourceOptimization;
  private _revenueIntelligence?: RevenueIntelligence;
  private _confidenceScore: number = 0;
  private _lastUpdated: Date;
  private _nextUpdateDue: Date;
  private _actionableInsights: ActionableInsight[] = [];
  private _automatedActions: AutomatedAction[] = [];

  private constructor(
    id: string,
    organizationId: string,
    analysisType: 'market' | 'client-success' | 'resource-optimization' | 'revenue-intelligence' | 'comprehensive',
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._organizationId = organizationId;
    this._analysisType = analysisType;
    this._lastUpdated = createdAt;
    this._nextUpdateDue = new Date(createdAt.getTime() + 24 * 60 * 60 * 1000); // 24 hours
  }

  public static create(
    id: string,
    organizationId: string,
    analysisType: 'market' | 'client-success' | 'resource-optimization' | 'revenue-intelligence' | 'comprehensive'
  ): PredictiveIntelligenceAggregate {
    const intelligence = new PredictiveIntelligenceAggregate(id, organizationId, analysisType);

    intelligence.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'PredictiveAnalysisInitiated',
      aggregateId: id,
      aggregateVersion: intelligence.version,
      organizationId,
      analysisType
    } as PredictiveAnalysisInitiatedEvent);

    return intelligence;
  }

  // Getters
  get organizationId(): string { return this._organizationId; }
  get analysisType(): string { return this._analysisType; }
  get marketIntelligence(): MarketIntelligence | undefined { return this._marketIntelligence; }
  get clientPredictions(): ClientSuccessPrediction[] { return [...this._clientPredictions]; }
  get resourceOptimization(): ResourceOptimization | undefined { return this._resourceOptimization; }
  get revenueIntelligence(): RevenueIntelligence | undefined { return this._revenueIntelligence; }
  get confidenceScore(): number { return this._confidenceScore; }
  get actionableInsights(): ActionableInsight[] { return [...this._actionableInsights]; }
  get automatedActions(): AutomatedAction[] { return [...this._automatedActions]; }

  // Business methods
  public updateMarketIntelligence(intelligence: MarketIntelligence): void {
    this._marketIntelligence = intelligence;
    this._lastUpdated = new Date();
    this._nextUpdateDue = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    this.generateActionableInsights();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'MarketIntelligenceUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      trendCount: intelligence.industryTrends.length,
      competitorCount: intelligence.competitorMovements.length,
      emergingTechCount: intelligence.emergingTechnologies.length,
      criticalThreats: intelligence.competitorMovements.filter(c => c.threatLevel === 'critical').length
    } as MarketIntelligenceUpdatedEvent);
  }

  public updateClientPredictions(predictions: ClientSuccessPrediction[]): void {
    this._clientPredictions = predictions;
    this._lastUpdated = new Date();
    
    // Identify high-risk clients requiring immediate attention
    const highRiskClients = predictions.filter(p => p.churnProbability > 0.7);
    const highValueUpsells = predictions.filter(p => 
      p.upsellOpportunities.some(u => u.probability > 0.6 && u.estimatedValue > 50000)
    );

    this.generateActionableInsights();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ClientPredictionsUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      totalClients: predictions.length,
      highRiskClients: highRiskClients.length,
      highValueUpsells: highValueUpsells.length,
      averageChurnProbability: predictions.reduce((sum, p) => sum + p.churnProbability, 0) / predictions.length
    } as ClientPredictionsUpdatedEvent);
  }

  public updateResourceOptimization(optimization: ResourceOptimization): void {
    this._resourceOptimization = optimization;
    this._lastUpdated = new Date();
    
    this.generateActionableInsights();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ResourceOptimizationUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      consultantCount: optimization.consultantUtilization.length,
      averageUtilization: optimization.consultantUtilization.reduce((sum, c) => sum + c.currentUtilization, 0) / optimization.consultantUtilization.length,
      capacityGaps: optimization.capacityForecast.reduce((sum, c) => sum + Math.max(0, c.capacityGap), 0),
      immediateHiringNeeds: optimization.capacityForecast.reduce((sum, c) => 
        sum + c.hiringRecommendations.filter(h => h.urgency === 'immediate').length, 0
      )
    } as ResourceOptimizationUpdatedEvent);
  }

  public updateRevenueIntelligence(intelligence: RevenueIntelligence): void {
    this._revenueIntelligence = intelligence;
    this._lastUpdated = new Date();
    
    this.generateActionableInsights();
    this.updatedAt = new Date();

    const totalPredictedRevenue = intelligence.pipelinePrediction.reduce((sum, p) => sum + p.predictedRevenue, 0);
    const averageConfidence = intelligence.pipelinePrediction.reduce((sum, p) => sum + p.confidence, 0) / intelligence.pipelinePrediction.length;

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'RevenueIntelligenceUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      totalPredictedRevenue,
      averageConfidence,
      pricingOptimizations: intelligence.pricingOptimization.length,
      marketSegments: intelligence.marketSizing.length
    } as RevenueIntelligenceUpdatedEvent);
  }

  public executeAutomatedAction(actionId: string): void {
    const action = this._automatedActions.find(a => a.id === actionId);
    if (!action) {
      throw new Error(`Automated action ${actionId} not found`);
    }

    if (action.status !== 'pending') {
      throw new Error(`Action ${actionId} is not in pending status`);
    }

    // Update action status
    const actionIndex = this._automatedActions.findIndex(a => a.id === actionId);
    this._automatedActions[actionIndex] = {
      ...action,
      status: 'executing',
      executedAt: new Date()
    };

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'AutomatedActionExecuted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      actionId,
      actionType: action.type,
      priority: action.priority,
      executedAt: new Date()
    } as AutomatedActionExecutedEvent);
  }

  public markInsightAsActioned(insightId: string, actionTaken: string): void {
    const insightIndex = this._actionableInsights.findIndex(i => i.id === insightId);
    if (insightIndex === -1) {
      throw new Error(`Insight ${insightId} not found`);
    }

    const existingInsight = this._actionableInsights[insightIndex];
    if (!existingInsight) {
      throw new Error(`Insight ${insightId} not found`);
    }

    this._actionableInsights[insightIndex] = {
      ...existingInsight,
      status: 'actioned',
      actionTaken,
      actionedAt: new Date()
    };

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'InsightActioned',
      aggregateId: this.id,
      aggregateVersion: this.version,
      insightId,
      actionTaken,
      actionedAt: new Date()
    } as InsightActionedEvent);
  }

  private generateActionableInsights(): void {
    const insights: ActionableInsight[] = [];
    const actions: AutomatedAction[] = [];

    // Market intelligence insights
    if (this._marketIntelligence) {
      const criticalThreats = this._marketIntelligence.competitorMovements.filter(c => c.threatLevel === 'critical');
      if (criticalThreats.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'competitive-threat',
          priority: 'urgent',
          title: `${criticalThreats.length} Critical Competitive Threats Detected`,
          description: `Immediate response required for: ${criticalThreats.map(t => t.competitor).join(', ')}`,
          recommendedActions: criticalThreats.map(t => t.responseRecommendation),
          estimatedImpact: 'high',
          timeframe: 'immediate',
          status: 'pending',
          createdAt: new Date()
        });
      }

      const highOpportunityTech = this._marketIntelligence.emergingTechnologies.filter(t => 
        t.businessPotential > 80 && t.maturityLevel > 60
      );
      if (highOpportunityTech.length > 0) {
        const firstTech = highOpportunityTech[0];
        if (!firstTech) {
          throw new Error('Invalid technology opportunity data');
        }
        insights.push({
          id: crypto.randomUUID(),
          type: 'technology-opportunity',
          priority: 'high',
          title: `${highOpportunityTech.length} High-Value Technology Opportunities`,
          description: `Consider investing in: ${highOpportunityTech.map(t => t.technology).join(', ')}`,
          recommendedActions: [`Develop capabilities in ${firstTech.technology}`, 'Create go-to-market strategy'],
          estimatedImpact: 'high',
          timeframe: '3-6 months',
          status: 'pending',
          createdAt: new Date()
        });
      }
    }

    // Client success insights
    const highRiskClients = this._clientPredictions.filter(p => p.churnProbability > 0.7);
    if (highRiskClients.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'client-risk',
        priority: 'urgent',
        title: `${highRiskClients.length} Clients at High Risk of Churn`,
        description: 'Immediate intervention required to prevent client loss',
        recommendedActions: ['Schedule emergency check-in calls', 'Review project satisfaction', 'Offer additional support'],
        estimatedImpact: 'high',
        timeframe: 'immediate',
        status: 'pending',
        createdAt: new Date()
      });

      // Create automated action for high-risk client alerts
      actions.push({
        id: crypto.randomUUID(),
        type: 'client-risk-alert',
        priority: 'urgent',
        description: 'Send immediate alerts to account managers for high-risk clients',
        targetClients: highRiskClients.map(c => c.clientId),
        status: 'pending',
        createdAt: new Date()
      });
    }

    const highValueUpsells = this._clientPredictions.filter(p => 
      p.upsellOpportunities.some(u => u.probability > 0.6 && u.estimatedValue > 50000)
    );
    if (highValueUpsells.length > 0) {
      insights.push({
        id: crypto.randomUUID(),
        type: 'revenue-opportunity',
        priority: 'high',
        title: `${highValueUpsells.length} High-Value Upsell Opportunities`,
        description: `Potential additional revenue: $${highValueUpsells.reduce((sum, c) => 
          sum + Math.max(...c.upsellOpportunities.map(u => u.estimatedValue)), 0).toLocaleString()}`,
        recommendedActions: ['Prepare upsell proposals', 'Schedule expansion discussions', 'Create value demonstration materials'],
        estimatedImpact: 'high',
        timeframe: '1-3 months',
        status: 'pending',
        createdAt: new Date()
      });
    }

    // Resource optimization insights
    if (this._resourceOptimization) {
      const overutilizedConsultants = this._resourceOptimization.consultantUtilization.filter(c => c.currentUtilization > 90);
      if (overutilizedConsultants.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'resource-burnout-risk',
          priority: 'high',
          title: `${overutilizedConsultants.length} Consultants at Risk of Burnout`,
          description: 'High utilization rates may lead to quality issues and turnover',
          recommendedActions: ['Redistribute workload', 'Consider additional hiring', 'Implement wellness programs'],
          estimatedImpact: 'medium',
          timeframe: '2-4 weeks',
          status: 'pending',
          createdAt: new Date()
        });
      }

      const immediateHiring = this._resourceOptimization.capacityForecast.reduce((needs, forecast) => 
        needs.concat(forecast.hiringRecommendations.filter(h => h.urgency === 'immediate')), [] as any[]
      );
      if (immediateHiring.length > 0) {
        insights.push({
          id: crypto.randomUUID(),
          type: 'hiring-urgency',
          priority: 'urgent',
          title: `${immediateHiring.length} Immediate Hiring Needs Identified`,
          description: `Critical roles: ${immediateHiring.map(h => h.role).join(', ')}`,
          recommendedActions: ['Initiate recruitment process', 'Consider contractor resources', 'Fast-track interviews'],
          estimatedImpact: 'high',
          timeframe: 'immediate',
          status: 'pending',
          createdAt: new Date()
        });
      }
    }

    this._actionableInsights = insights;
    this._automatedActions = actions;
    this._confidenceScore = this.calculateConfidenceScore();
  }

  private calculateConfidenceScore(): number {
    let totalScore = 0;
    let components = 0;

    if (this._marketIntelligence) {
      const avgConfidence = this._marketIntelligence.industryTrends.reduce((sum, t) => sum + t.confidence, 0) / 
        this._marketIntelligence.industryTrends.length;
      totalScore += avgConfidence;
      components++;
    }

    if (this._clientPredictions.length > 0) {
      // Confidence based on data completeness and model accuracy
      totalScore += 85; // Assume high confidence for client predictions
      components++;
    }

    if (this._resourceOptimization) {
      totalScore += 90; // High confidence for internal resource data
      components++;
    }

    if (this._revenueIntelligence) {
      const avgConfidence = this._revenueIntelligence.pipelinePrediction.reduce((sum, p) => sum + p.confidence, 0) / 
        this._revenueIntelligence.pipelinePrediction.length;
      totalScore += avgConfidence;
      components++;
    }

    return components > 0 ? Math.round(totalScore / components) : 0;
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'PredictiveAnalysisInitiated':
        this.applyPredictiveAnalysisInitiated(event as PredictiveAnalysisInitiatedEvent);
        break;
      case 'MarketIntelligenceUpdated':
        this.applyMarketIntelligenceUpdated(event as MarketIntelligenceUpdatedEvent);
        break;
      case 'ClientPredictionsUpdated':
        this.applyClientPredictionsUpdated(event as ClientPredictionsUpdatedEvent);
        break;
      case 'AutomatedActionExecuted':
        this.applyAutomatedActionExecuted(event as AutomatedActionExecutedEvent);
        break;
    }
  }

  private applyPredictiveAnalysisInitiated(event: PredictiveAnalysisInitiatedEvent): void {
    this._organizationId = event.organizationId;
    this._analysisType = event.analysisType;
  }

  private applyMarketIntelligenceUpdated(event: MarketIntelligenceUpdatedEvent): void {
    this._lastUpdated = new Date();
  }

  private applyClientPredictionsUpdated(event: ClientPredictionsUpdatedEvent): void {
    this._lastUpdated = new Date();
  }

  private applyAutomatedActionExecuted(event: AutomatedActionExecutedEvent): void {
    // Action execution would be handled in the application layer
  }
}

export interface ActionableInsight {
  readonly id: string;
  readonly type: 'competitive-threat' | 'technology-opportunity' | 'client-risk' | 'revenue-opportunity' | 'resource-burnout-risk' | 'hiring-urgency';
  readonly priority: 'urgent' | 'high' | 'medium' | 'low';
  readonly title: string;
  readonly description: string;
  readonly recommendedActions: string[];
  readonly estimatedImpact: 'high' | 'medium' | 'low';
  readonly timeframe: 'immediate' | '1-2 weeks' | '2-4 weeks' | '1-3 months' | '3-6 months';
  readonly status: 'pending' | 'actioned' | 'dismissed';
  readonly createdAt: Date;
  readonly actionTaken?: string;
  readonly actionedAt?: Date;
}

export interface AutomatedAction {
  readonly id: string;
  readonly type: 'client-risk-alert' | 'capacity-alert' | 'pricing-adjustment' | 'market-opportunity-alert';
  readonly priority: 'urgent' | 'high' | 'medium' | 'low';
  readonly description: string;
  readonly targetClients?: string[];
  readonly status: 'pending' | 'executing' | 'completed' | 'failed';
  readonly createdAt: Date;
  readonly executedAt?: Date;
  readonly completedAt?: Date;
}

// Domain Events
export interface PredictiveAnalysisInitiatedEvent extends DomainEvent {
  eventType: 'PredictiveAnalysisInitiated';
  organizationId: string;
  analysisType: 'market' | 'client-success' | 'resource-optimization' | 'revenue-intelligence' | 'comprehensive';
}

export interface MarketIntelligenceUpdatedEvent extends DomainEvent {
  eventType: 'MarketIntelligenceUpdated';
  trendCount: number;
  competitorCount: number;
  emergingTechCount: number;
  criticalThreats: number;
}

export interface ClientPredictionsUpdatedEvent extends DomainEvent {
  eventType: 'ClientPredictionsUpdated';
  totalClients: number;
  highRiskClients: number;
  highValueUpsells: number;
  averageChurnProbability: number;
}

export interface ResourceOptimizationUpdatedEvent extends DomainEvent {
  eventType: 'ResourceOptimizationUpdated';
  consultantCount: number;
  averageUtilization: number;
  capacityGaps: number;
  immediateHiringNeeds: number;
}

export interface RevenueIntelligenceUpdatedEvent extends DomainEvent {
  eventType: 'RevenueIntelligenceUpdated';
  totalPredictedRevenue: number;
  averageConfidence: number;
  pricingOptimizations: number;
  marketSegments: number;
}

export interface AutomatedActionExecutedEvent extends DomainEvent {
  eventType: 'AutomatedActionExecuted';
  actionId: string;
  actionType: string;
  priority: string;
  executedAt: Date;
}

export interface InsightActionedEvent extends DomainEvent {
  eventType: 'InsightActioned';
  insightId: string;
  actionTaken: string;
  actionedAt: Date;
}
