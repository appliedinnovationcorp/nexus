// Partnership Ecosystem Aggregate - Strategic partnerships and ecosystem management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { Money } from '../value-objects/money';

export interface Partner {
  readonly id: string;
  readonly name: string;
  readonly type: 'university' | 'colocation-provider' | 'technology-vendor' | 'consulting-firm' | 'system-integrator' | 'cloud-provider';
  readonly tier: 'strategic' | 'preferred' | 'certified' | 'registered';
  readonly status: 'active' | 'inactive' | 'pending' | 'suspended';
  readonly contactInfo: PartnerContact;
  readonly capabilities: string[];
  readonly certifications: string[];
  readonly geographicCoverage: string[];
  readonly industryFocus: string[];
  readonly partnershipAgreement: PartnershipAgreement;
  readonly performanceMetrics: PartnerPerformanceMetrics;
  readonly joinedAt: Date;
  readonly lastReviewAt?: Date;
}

export interface PartnerContact {
  readonly primaryContact: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly role: string;
  };
  readonly technicalContact?: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly role: string;
  };
  readonly businessContact?: {
    readonly name: string;
    readonly email: string;
    readonly phone: string;
    readonly role: string;
  };
}

export interface PartnershipAgreement {
  readonly type: 'referral' | 'reseller' | 'technology' | 'strategic-alliance' | 'joint-venture';
  readonly startDate: Date;
  readonly endDate?: Date;
  readonly renewalTerms: string;
  readonly revenueSharing: RevenueSharing;
  readonly exclusivity: ExclusivityTerms;
  readonly obligations: PartnerObligation[];
  readonly slaRequirements: SLARequirement[];
}

export interface RevenueSharing {
  readonly model: 'percentage' | 'fixed-fee' | 'tiered' | 'hybrid';
  readonly partnerShare: number; // percentage or fixed amount
  readonly aicShare: number;
  readonly minimumCommitment?: Money;
  readonly paymentTerms: string;
}

export interface ExclusivityTerms {
  readonly isExclusive: boolean;
  readonly exclusivityScope?: string[];
  readonly geographicLimitations?: string[];
  readonly industryLimitations?: string[];
}

export interface PartnerObligation {
  readonly type: 'certification' | 'training' | 'marketing' | 'support' | 'sales-target';
  readonly description: string;
  readonly deadline?: Date;
  readonly status: 'pending' | 'in-progress' | 'completed' | 'overdue';
  readonly verificationRequired: boolean;
}

export interface SLARequirement {
  readonly metric: string;
  readonly target: number;
  readonly measurement: string;
  readonly penalty?: string;
  readonly reportingFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
}

export interface PartnerPerformanceMetrics {
  readonly revenueGenerated: Money;
  readonly leadsProvided: number;
  readonly leadsConverted: number;
  readonly conversionRate: number;
  readonly customerSatisfaction: number;
  readonly projectsDelivered: number;
  readonly projectSuccessRate: number;
  readonly certificationCompliance: number;
  readonly responseTime: number; // hours
  readonly escalationRate: number;
  readonly lastUpdated: Date;
}

export interface JointOpportunity {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly partnerId: string;
  readonly clientId: string;
  readonly estimatedValue: Money;
  readonly probability: number;
  readonly stage: 'identified' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  readonly aicRole: string;
  readonly partnerRole: string;
  readonly revenueAllocation: {
    readonly aicShare: number;
    readonly partnerShare: number;
  };
  readonly timeline: {
    readonly startDate: Date;
    readonly endDate: Date;
    readonly milestones: OpportunityMilestone[];
  };
  readonly riskFactors: string[];
  readonly competitiveThreats: string[];
  readonly createdAt: Date;
  readonly lastUpdatedAt: Date;
}

export interface OpportunityMilestone {
  readonly name: string;
  readonly dueDate: Date;
  readonly responsible: 'aic' | 'partner' | 'joint';
  readonly status: 'pending' | 'in-progress' | 'completed' | 'delayed';
  readonly deliverables: string[];
}

export interface EcosystemInsight {
  readonly type: 'market-trend' | 'competitive-intelligence' | 'technology-advancement' | 'partnership-opportunity';
  readonly title: string;
  readonly description: string;
  readonly impact: 'high' | 'medium' | 'low';
  readonly timeframe: 'immediate' | 'short-term' | 'medium-term' | 'long-term';
  readonly actionRequired: boolean;
  readonly recommendedActions: string[];
  readonly affectedPartners: string[];
  readonly createdAt: Date;
}

export class PartnershipEcosystemAggregate extends AggregateRoot {
  private _organizationId: string;
  private _partners: Partner[] = [];
  private _jointOpportunities: JointOpportunity[] = [];
  private _ecosystemInsights: EcosystemInsight[] = [];
  private _partnershipStrategy: PartnershipStrategy;
  private _ecosystemHealth: EcosystemHealth;
  private _performanceTargets: PerformanceTarget[];

  private constructor(
    id: string,
    organizationId: string,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._organizationId = organizationId;
    this._partnershipStrategy = {
      objectives: [],
      targetPartnerTypes: [],
      geographicPriorities: [],
      industryPriorities: [],
      revenueTargets: Money.zero('USD'),
      partnerCountTargets: {
        'university': 0,
        'colocation-provider': 0,
        'technology-vendor': 0,
        'consulting-firm': 0,
        'system-integrator': 0,
        'cloud-provider': 0
      }
    };
    this._ecosystemHealth = {
      overallScore: 0,
      partnerSatisfaction: 0,
      revenueContribution: 0,
      growthRate: 0,
      riskLevel: 'low'
    };
    this._performanceTargets = [];
  }

  public static create(
    id: string,
    organizationId: string
  ): PartnershipEcosystemAggregate {
    const ecosystem = new PartnershipEcosystemAggregate(id, organizationId);

    ecosystem.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'PartnershipEcosystemCreated',
      aggregateId: id,
      aggregateVersion: ecosystem.version,
      organizationId
    } as PartnershipEcosystemCreatedEvent);

    return ecosystem;
  }

  // Getters
  get organizationId(): string { return this._organizationId; }
  get partners(): Partner[] { return [...this._partners]; }
  get jointOpportunities(): JointOpportunity[] { return [...this._jointOpportunities]; }
  get ecosystemInsights(): EcosystemInsight[] { return [...this._ecosystemInsights]; }
  get ecosystemHealth(): EcosystemHealth { return this._ecosystemHealth; }

  // Business methods
  public addPartner(partner: Partner): void {
    if (this._partners.some(p => p.id === partner.id)) {
      throw new Error(`Partner ${partner.id} already exists`);
    }

    this._partners.push(partner);
    this.updateEcosystemHealth();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'PartnerAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      partnerId: partner.id,
      partnerName: partner.name,
      partnerType: partner.type,
      tier: partner.tier,
      geographicCoverage: partner.geographicCoverage,
      capabilities: partner.capabilities
    } as PartnerAddedEvent);
  }

  public updatePartnerPerformance(
    partnerId: string,
    metrics: Partial<PartnerPerformanceMetrics>
  ): void {
    const partnerIndex = this._partners.findIndex(p => p.id === partnerId);
    if (partnerIndex === -1) {
      throw new Error(`Partner ${partnerId} not found`);
    }

    const partner = this._partners[partnerIndex];
    if (!partner) {
      throw new Error(`Partner ${partnerId} not found in array`);
    }
    
    const updatedMetrics = {
      ...partner.performanceMetrics,
      ...metrics,
      lastUpdated: new Date()
    };

    this._partners[partnerIndex] = {
      id: partner.id,
      name: partner.name,
      type: partner.type,
      tier: partner.tier,
      status: partner.status,
      contactInfo: partner.contactInfo,
      capabilities: partner.capabilities,
      certifications: partner.certifications,
      geographicCoverage: partner.geographicCoverage,
      industryFocus: partner.industryFocus,
      partnershipAgreement: partner.partnershipAgreement,
      performanceMetrics: updatedMetrics,
      joinedAt: partner.joinedAt,
      lastReviewAt: partner.lastReviewAt
    };

    this.updateEcosystemHealth();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'PartnerPerformanceUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      partnerId,
      metrics: updatedMetrics,
      updatedAt: new Date()
    } as PartnerPerformanceUpdatedEvent);
  }

  public createJointOpportunity(opportunity: JointOpportunity): void {
    if (this._jointOpportunities.some(o => o.id === opportunity.id)) {
      throw new Error(`Joint opportunity ${opportunity.id} already exists`);
    }

    const partner = this._partners.find(p => p.id === opportunity.partnerId);
    if (!partner) {
      throw new Error(`Partner ${opportunity.partnerId} not found`);
    }

    this._jointOpportunities.push(opportunity);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'JointOpportunityCreated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      opportunityId: opportunity.id,
      opportunityName: opportunity.name,
      partnerId: opportunity.partnerId,
      partnerName: partner.name,
      estimatedValue: opportunity.estimatedValue.toPlainObject(),
      probability: opportunity.probability,
      aicShare: opportunity.revenueAllocation.aicShare,
      partnerShare: opportunity.revenueAllocation.partnerShare
    } as JointOpportunityCreatedEvent);
  }

  public updateOpportunityStage(
    opportunityId: string,
    newStage: JointOpportunity['stage'],
    notes?: string
  ): void {
    const opportunityIndex = this._jointOpportunities.findIndex(o => o.id === opportunityId);
    if (opportunityIndex === -1) {
      throw new Error(`Joint opportunity ${opportunityId} not found`);
    }

    const opportunity = this._jointOpportunities[opportunityIndex];
    if (!opportunity) {
      throw new Error(`Joint opportunity ${opportunityId} not found in array`);
    }
    
    const oldStage = opportunity.stage;

    this._jointOpportunities[opportunityIndex] = {
      id: opportunity.id,
      name: opportunity.name,
      description: opportunity.description,
      partnerId: opportunity.partnerId,
      clientId: opportunity.clientId,
      estimatedValue: opportunity.estimatedValue,
      probability: opportunity.probability,
      stage: newStage,
      aicRole: opportunity.aicRole,
      partnerRole: opportunity.partnerRole,
      revenueAllocation: opportunity.revenueAllocation,
      timeline: opportunity.timeline,
      riskFactors: opportunity.riskFactors,
      competitiveThreats: opportunity.competitiveThreats,
      lastUpdatedAt: new Date(),
      createdAt: opportunity.createdAt
    };

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'JointOpportunityStageUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      opportunityId,
      oldStage,
      newStage,
      notes,
      updatedAt: new Date()
    } as JointOpportunityStageUpdatedEvent);

    // Handle won/lost opportunities
    if (newStage === 'won') {
      this.handleOpportunityWon(opportunity);
    } else if (newStage === 'lost') {
      this.handleOpportunityLost(opportunity);
    }
  }

  public addEcosystemInsight(insight: EcosystemInsight): void {
    this._ecosystemInsights.push(insight);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'EcosystemInsightAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      insightType: insight.type,
      title: insight.title,
      impact: insight.impact,
      timeframe: insight.timeframe,
      actionRequired: insight.actionRequired,
      affectedPartnerCount: insight.affectedPartners.length
    } as EcosystemInsightAddedEvent);
  }

  public reviewPartnerPerformance(partnerId: string, reviewedBy: string): void {
    const partnerIndex = this._partners.findIndex(p => p.id === partnerId);
    if (partnerIndex === -1) {
      throw new Error(`Partner ${partnerId} not found`);
    }

    const partner = this._partners[partnerIndex];
    if (!partner) {
      throw new Error(`Partner at index ${partnerIndex} not found`);
    }
    
    const performanceScore = this.calculatePartnerScore(partner);
    
    // Determine if tier adjustment is needed
    const recommendedTier = this.recommendPartnerTier(partner, performanceScore);
    const tierChanged = recommendedTier !== partner.tier;

    this._partners[partnerIndex] = {
      id: partner.id,
      name: partner.name,
      type: partner.type,
      tier: recommendedTier,
      status: partner.status,
      contactInfo: partner.contactInfo,
      capabilities: partner.capabilities,
      certifications: partner.certifications,
      geographicCoverage: partner.geographicCoverage,
      industryFocus: partner.industryFocus,
      partnershipAgreement: partner.partnershipAgreement,
      performanceMetrics: partner.performanceMetrics,
      joinedAt: partner.joinedAt,
      lastReviewAt: new Date()
    };

    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'PartnerPerformanceReviewed',
      aggregateId: this.id,
      aggregateVersion: this.version,
      partnerId,
      reviewedBy,
      performanceScore,
      oldTier: partner!.tier,
      newTier: recommendedTier,
      tierChanged,
      reviewedAt: new Date()
    } as PartnerPerformanceReviewedEvent);
  }

  private handleOpportunityWon(opportunity: JointOpportunity): void {
    // Update partner performance metrics
    const partnerIndex = this._partners.findIndex(p => p.id === opportunity.partnerId);
    if (partnerIndex >= 0) {
      const partner = this._partners[partnerIndex];
      if (!partner) {
        throw new Error(`Partner not found for opportunity ${opportunity.id}`);
      }
      const updatedMetrics = {
        ...partner.performanceMetrics,
        revenueGenerated: partner.performanceMetrics.revenueGenerated.add(
          opportunity.estimatedValue.multiply(opportunity.revenueAllocation.partnerShare / 100)
        ),
        leadsConverted: partner.performanceMetrics.leadsConverted + 1,
        projectsDelivered: partner.performanceMetrics.projectsDelivered + 1,
        lastUpdated: new Date()
      };

      this._partners[partnerIndex] = {
        ...partner,
        performanceMetrics: updatedMetrics
      };
    }

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'JointOpportunityWon',
      aggregateId: this.id,
      aggregateVersion: this.version,
      opportunityId: opportunity.id,
      partnerId: opportunity.partnerId,
      wonValue: opportunity.estimatedValue.toPlainObject(),
      aicRevenue: opportunity.estimatedValue.multiply(opportunity.revenueAllocation.aicShare / 100).toPlainObject(),
      partnerRevenue: opportunity.estimatedValue.multiply(opportunity.revenueAllocation.partnerShare / 100).toPlainObject()
    } as JointOpportunityWonEvent);
  }

  private handleOpportunityLost(opportunity: JointOpportunity): void {
    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'JointOpportunityLost',
      aggregateId: this.id,
      aggregateVersion: this.version,
      opportunityId: opportunity.id,
      partnerId: opportunity.partnerId,
      lostValue: opportunity.estimatedValue.toPlainObject(),
      stage: opportunity.stage
    } as JointOpportunityLostEvent);
  }

  private calculatePartnerScore(partner: Partner): number {
    const metrics = partner.performanceMetrics;
    let score = 0;

    // Revenue contribution (30%)
    const revenueScore = Math.min(metrics.revenueGenerated.amount / 100000, 100); // $100k = 100 points
    score += revenueScore * 0.3;

    // Conversion rate (25%)
    score += metrics.conversionRate * 0.25;

    // Customer satisfaction (20%)
    score += metrics.customerSatisfaction * 0.2;

    // Project success rate (15%)
    score += metrics.projectSuccessRate * 0.15;

    // Certification compliance (10%)
    score += metrics.certificationCompliance * 0.1;

    return Math.min(Math.round(score), 100);
  }

  private recommendPartnerTier(partner: Partner, performanceScore: number): Partner['tier'] {
    if (performanceScore >= 90) return 'strategic';
    if (performanceScore >= 75) return 'preferred';
    if (performanceScore >= 60) return 'certified';
    return 'registered';
  }

  private updateEcosystemHealth(): void {
    const activePartners = this._partners.filter(p => p.status === 'active');
    
    if (activePartners.length === 0) {
      this._ecosystemHealth = {
        overallScore: 0,
        partnerSatisfaction: 0,
        revenueContribution: 0,
        growthRate: 0,
        riskLevel: 'high'
      };
      return;
    }

    // Calculate overall health metrics
    const avgSatisfaction = activePartners.reduce((sum, p) => sum + p.performanceMetrics.customerSatisfaction, 0) / activePartners.length;
    const totalRevenue = activePartners.reduce((sum, p) => sum.add(p.performanceMetrics.revenueGenerated), Money.zero('USD'));
    const avgConversionRate = activePartners.reduce((sum, p) => sum + p.performanceMetrics.conversionRate, 0) / activePartners.length;

    // Calculate growth rate (simplified)
    const growthRate = Math.min(activePartners.length * 10, 100); // 10% per partner, max 100%

    // Calculate overall score
    const overallScore = Math.round(
      (avgSatisfaction * 0.3) +
      (Math.min(totalRevenue.amount / 1000000, 100) * 0.3) + // $1M = 100 points
      (avgConversionRate * 0.2) +
      (growthRate * 0.2)
    );

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overallScore < 50) riskLevel = 'high';
    else if (overallScore < 75) riskLevel = 'medium';

    this._ecosystemHealth = {
      overallScore,
      partnerSatisfaction: Math.round(avgSatisfaction),
      revenueContribution: Math.round((totalRevenue.amount / 1000000) * 100), // Percentage of $1M target
      growthRate: Math.round(growthRate),
      riskLevel
    };
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'PartnershipEcosystemCreated':
        this.applyPartnershipEcosystemCreated(event as PartnershipEcosystemCreatedEvent);
        break;
      case 'PartnerAdded':
        this.applyPartnerAdded(event as PartnerAddedEvent);
        break;
      case 'JointOpportunityCreated':
        this.applyJointOpportunityCreated(event as JointOpportunityCreatedEvent);
        break;
      case 'JointOpportunityWon':
        this.applyJointOpportunityWon(event as JointOpportunityWonEvent);
        break;
    }
  }

  private applyPartnershipEcosystemCreated(event: PartnershipEcosystemCreatedEvent): void {
    this._organizationId = event.organizationId;
  }

  private applyPartnerAdded(event: PartnerAddedEvent): void {
    // Partner would be reconstructed from event data
  }

  private applyJointOpportunityCreated(event: JointOpportunityCreatedEvent): void {
    // Opportunity would be reconstructed from event data
  }

  private applyJointOpportunityWon(event: JointOpportunityWonEvent): void {
    // Revenue and performance metrics would be updated
  }
}

// Supporting interfaces
export interface PartnershipStrategy {
  objectives: string[];
  targetPartnerTypes: Partner['type'][];
  geographicPriorities: string[];
  industryPriorities: string[];
  revenueTargets: Money;
  partnerCountTargets: Record<Partner['type'], number>;
}

export interface EcosystemHealth {
  overallScore: number;
  partnerSatisfaction: number;
  revenueContribution: number;
  growthRate: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface PerformanceTarget {
  partnerId: string;
  metric: string;
  target: number;
  timeframe: string;
  status: 'on-track' | 'at-risk' | 'missed';
}

// Domain Events
export interface PartnershipEcosystemCreatedEvent extends DomainEvent {
  eventType: 'PartnershipEcosystemCreated';
  organizationId: string;
}

export interface PartnerAddedEvent extends DomainEvent {
  eventType: 'PartnerAdded';
  partnerId: string;
  partnerName: string;
  partnerType: string;
  tier: string;
  geographicCoverage: string[];
  capabilities: string[];
}

export interface PartnerPerformanceUpdatedEvent extends DomainEvent {
  eventType: 'PartnerPerformanceUpdated';
  partnerId: string;
  metrics: PartnerPerformanceMetrics;
  updatedAt: Date;
}

export interface JointOpportunityCreatedEvent extends DomainEvent {
  eventType: 'JointOpportunityCreated';
  opportunityId: string;
  opportunityName: string;
  partnerId: string;
  partnerName: string;
  estimatedValue: any;
  probability: number;
  aicShare: number;
  partnerShare: number;
}

export interface JointOpportunityStageUpdatedEvent extends DomainEvent {
  eventType: 'JointOpportunityStageUpdated';
  opportunityId: string;
  oldStage: string;
  newStage: string;
  notes?: string;
  updatedAt: Date;
}

export interface JointOpportunityWonEvent extends DomainEvent {
  eventType: 'JointOpportunityWon';
  opportunityId: string;
  partnerId: string;
  wonValue: any;
  aicRevenue: any;
  partnerRevenue: any;
}

export interface JointOpportunityLostEvent extends DomainEvent {
  eventType: 'JointOpportunityLost';
  opportunityId: string;
  partnerId: string;
  lostValue: any;
  stage: string;
}

export interface EcosystemInsightAddedEvent extends DomainEvent {
  eventType: 'EcosystemInsightAdded';
  insightType: string;
  title: string;
  impact: string;
  timeframe: string;
  actionRequired: boolean;
  affectedPartnerCount: number;
}

export interface PartnerPerformanceReviewedEvent extends DomainEvent {
  eventType: 'PartnerPerformanceReviewed';
  partnerId: string;
  reviewedBy: string;
  performanceScore: number;
  oldTier: string;
  newTier: string;
  tierChanged: boolean;
  reviewedAt: Date;
}
