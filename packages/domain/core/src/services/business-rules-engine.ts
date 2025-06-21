// Business Rules Engine - Centralized business logic validation

export interface BusinessRule<T> {
  readonly name: string;
  readonly description: string;
  readonly priority: number; // Lower number = higher priority
  validate(context: T): Promise<BusinessRuleResult>;
}

export interface BusinessRuleResult {
  readonly isValid: boolean;
  readonly errorMessage?: string;
  readonly warningMessage?: string;
  readonly metadata?: Record<string, any>;
}

export interface BusinessRuleContext {
  readonly userId: string;
  readonly organizationId: string;
  readonly userRole: string;
  readonly subscriptionTier: string;
  readonly currentDate: Date;
  readonly metadata: Record<string, any>;
}

export class BusinessRulesEngine {
  private rules: Map<string, BusinessRule<any>[]> = new Map();

  public registerRule<T>(entityType: string, rule: BusinessRule<T>): void {
    const existingRules = this.rules.get(entityType) || [];
    existingRules.push(rule);
    existingRules.sort((a, b) => a.priority - b.priority);
    this.rules.set(entityType, existingRules);
  }

  public async validateRules<T>(
    entityType: string,
    context: T,
    ruleNames?: string[]
  ): Promise<BusinessRuleResult[]> {
    const entityRules = this.rules.get(entityType) || [];
    const rulesToValidate = ruleNames 
      ? entityRules.filter(rule => ruleNames.includes(rule.name))
      : entityRules;

    const results: BusinessRuleResult[] = [];
    
    for (const rule of rulesToValidate) {
      try {
        const result = await rule.validate(context);
        results.push(result);
        
        // Stop on first critical error if specified
        if (!result.isValid && rule.priority <= 10) {
          break;
        }
      } catch (error) {
        results.push({
          isValid: false,
          errorMessage: `Rule validation failed: ${rule.name} - ${error}`,
          metadata: { ruleName: rule.name, error: error }
        });
      }
    }

    return results;
  }

  public getRegisteredRules(entityType: string): BusinessRule<any>[] {
    return this.rules.get(entityType) || [];
  }
}

// Organization Business Rules
export class OrganizationBusinessRules {
  
  // Rule: Organization name must be unique within the system
  static uniqueOrganizationName(): BusinessRule<{ name: string; organizationRepository: any }> {
    return {
      name: 'unique-organization-name',
      description: 'Organization name must be unique across the system',
      priority: 5,
      async validate(context) {
        const existingOrg = await context.organizationRepository.findByName(context.name);
        return {
          isValid: !existingOrg,
          errorMessage: existingOrg ? 'Organization name already exists' : undefined
        };
      }
    };
  }

  // Rule: Organization must have at least one admin user
  static requireAdminUser(): BusinessRule<{ organizationId: string; userRepository: any }> {
    return {
      name: 'require-admin-user',
      description: 'Organization must have at least one admin user',
      priority: 1,
      async validate(context) {
        const adminUsers = await context.userRepository.findByOrganizationAndRole(
          context.organizationId, 
          'admin'
        );
        return {
          isValid: adminUsers.length > 0,
          errorMessage: adminUsers.length === 0 ? 'Organization must have at least one admin user' : undefined
        };
      }
    };
  }

  // Rule: Subscription tier limits
  static subscriptionLimits(): BusinessRule<{ 
    organizationId: string; 
    subscriptionTier: string; 
    currentUserCount: number;
    currentProjectCount: number;
    currentTeamCount: number;
  }> {
    return {
      name: 'subscription-limits',
      description: 'Organization must stay within subscription tier limits',
      priority: 3,
      async validate(context) {
        // Define subscription limits inline
        const subscriptionLimits = {
          'free': { maxUsers: 5, maxProjects: 3, maxTeams: 1 },
          'basic': { maxUsers: 25, maxProjects: 10, maxTeams: 5 },
          'professional': { maxUsers: 100, maxProjects: 50, maxTeams: 20 },
          'enterprise': { maxUsers: -1, maxProjects: -1, maxTeams: -1 } // unlimited
        };
        
        const limits = subscriptionLimits[context.subscriptionTier as keyof typeof subscriptionLimits] || subscriptionLimits.free;
        
        const violations: string[] = [];
        
        if (limits.maxUsers > 0 && context.currentUserCount > limits.maxUsers) {
          violations.push(`User count (${context.currentUserCount}) exceeds limit (${limits.maxUsers})`);
        }
        
        if (limits.maxProjects > 0 && context.currentProjectCount > limits.maxProjects) {
          violations.push(`Project count (${context.currentProjectCount}) exceeds limit (${limits.maxProjects})`);
        }
        
        if (limits.maxTeams > 0 && context.currentTeamCount > limits.maxTeams) {
          violations.push(`Team count (${context.currentTeamCount}) exceeds limit (${limits.maxTeams})`);
        }

        return {
          isValid: violations.length === 0,
          errorMessage: violations.length > 0 ? violations.join('; ') : undefined,
          metadata: { limits, violations }
        };
      }
    };
  }

  private static getSubscriptionLimits(tier: string) {
    const limits = {
      'free': { maxUsers: 5, maxProjects: 3, maxTeams: 1, maxStorage: 1024 }, // 1GB
      'basic': { maxUsers: 25, maxProjects: 20, maxTeams: 5, maxStorage: 10240 }, // 10GB
      'professional': { maxUsers: 100, maxProjects: 100, maxTeams: 20, maxStorage: 102400 }, // 100GB
      'enterprise': { maxUsers: 1000, maxProjects: 1000, maxTeams: 100, maxStorage: 1048576 } // 1TB
    };
    return limits[tier as keyof typeof limits] || limits.free;
  }
}

// Project Business Rules
export class ProjectBusinessRules {
  
  // Rule: Project end date must be after start date
  static validDateRange(): BusinessRule<{ startDate: Date; endDate: Date }> {
    return {
      name: 'valid-date-range',
      description: 'Project end date must be after start date',
      priority: 1,
      async validate(context) {
        return {
          isValid: context.endDate > context.startDate,
          errorMessage: context.endDate <= context.startDate ? 'End date must be after start date' : undefined
        };
      }
    };
  }

  // Rule: Project budget must be positive
  static positiveBudget(): BusinessRule<{ budget: number }> {
    return {
      name: 'positive-budget',
      description: 'Project budget must be positive',
      priority: 2,
      async validate(context) {
        return {
          isValid: context.budget > 0,
          errorMessage: context.budget <= 0 ? 'Project budget must be positive' : undefined
        };
      }
    };
  }

  // Rule: Team member capacity validation
  static teamCapacity(): BusinessRule<{ 
    teamMembers: string[]; 
    startDate: Date; 
    endDate: Date;
    projectRepository: any;
  }> {
    return {
      name: 'team-capacity',
      description: 'Team members must have capacity for project duration',
      priority: 15,
      async validate(context) {
        const conflicts: string[] = [];
        
        for (const memberId of context.teamMembers) {
          const overlappingProjects = await context.projectRepository.findOverlappingProjects(
            memberId,
            context.startDate,
            context.endDate
          );
          
          if (overlappingProjects.length > 2) { // Allow up to 2 concurrent projects
            conflicts.push(`Team member ${memberId} has ${overlappingProjects.length} overlapping projects`);
          }
        }

        return {
          isValid: conflicts.length === 0,
          warningMessage: conflicts.length > 0 ? conflicts.join('; ') : undefined,
          metadata: { conflicts }
        };
      }
    };
  }

  // Rule: Project milestone validation
  static validMilestones(): BusinessRule<{ 
    milestones: Array<{ dueDate: Date; dependencies: string[] }>;
    projectStartDate: Date;
    projectEndDate: Date;
  }> {
    return {
      name: 'valid-milestones',
      description: 'Project milestones must be within project timeline and respect dependencies',
      priority: 10,
      async validate(context) {
        const errors: string[] = [];
        
        // Check milestone dates are within project timeline
        context.milestones.forEach((milestone, index) => {
          if (milestone.dueDate < context.projectStartDate || milestone.dueDate > context.projectEndDate) {
            errors.push(`Milestone ${index + 1} due date is outside project timeline`);
          }
        });

        // Check dependency order (simplified - assumes milestones are ordered)
        for (let i = 1; i < context.milestones.length; i++) {
          const current = context.milestones[i];
          const previous = context.milestones[i - 1];
          
          if (!current || !previous) {
            errors.push(`Invalid milestone data at position ${i}`);
            continue;
          }
          
          if (current.dependencies.length > 0 && current.dueDate <= previous.dueDate) {
            errors.push(`Milestone ${i + 1} due date must be after its dependencies`);
          }
        }

        return {
          isValid: errors.length === 0,
          errorMessage: errors.length > 0 ? errors.join('; ') : undefined
        };
      }
    };
  }
}

// Invoice Business Rules
export class InvoiceBusinessRules {
  
  // Rule: Invoice due date must be in the future
  static futureDueDate(): BusinessRule<{ dueDate: Date; issueDate: Date }> {
    return {
      name: 'future-due-date',
      description: 'Invoice due date must be after issue date',
      priority: 1,
      async validate(context) {
        return {
          isValid: context.dueDate > context.issueDate,
          errorMessage: context.dueDate <= context.issueDate ? 'Due date must be after issue date' : undefined
        };
      }
    };
  }

  // Rule: Invoice must have line items
  static hasLineItems(): BusinessRule<{ lineItems: any[] }> {
    return {
      name: 'has-line-items',
      description: 'Invoice must have at least one line item',
      priority: 2,
      async validate(context) {
        return {
          isValid: context.lineItems.length > 0,
          errorMessage: context.lineItems.length === 0 ? 'Invoice must have at least one line item' : undefined
        };
      }
    };
  }

  // Rule: Payment terms validation
  static validPaymentTerms(): BusinessRule<{ 
    terms?: string; 
    dueDate: Date; 
    issueDate: Date;
  }> {
    return {
      name: 'valid-payment-terms',
      description: 'Payment terms must match the due date calculation',
      priority: 10,
      async validate(context) {
        // Parse payment terms inline
        const parsePaymentTerms = (terms: string | undefined): number => {
          if (!terms) return 30; // default to 30 days
          const match = terms.match(/(\d+)/);
          return match && match[1] ? parseInt(match[1], 10) : 30; // default to 30 days
        };
        
        const termsDays = parsePaymentTerms(context.terms);
        const expectedDueDate = new Date(context.issueDate);
        expectedDueDate.setDate(expectedDueDate.getDate() + termsDays);
        
        const daysDifference = Math.abs(
          (context.dueDate.getTime() - expectedDueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          isValid: daysDifference <= 1, // Allow 1 day tolerance
          warningMessage: daysDifference > 1 ? 
            `Due date doesn't match payment terms (${context.terms})` : undefined
        };
      }
    };
  }

  // Rule: Late fee calculation
  static lateFeeValidation(): BusinessRule<{ 
    totalAmount: number;
    lateFeeRate: number;
    daysPastDue: number;
  }> {
    return {
      name: 'late-fee-validation',
      description: 'Late fee must be calculated correctly',
      priority: 15,
      async validate(context) {
        const maxLateFeeRate = 0.05; // 5% maximum
        const maxLateFee = context.totalAmount * 0.25; // 25% of total amount maximum
        
        const calculatedLateFee = context.totalAmount * context.lateFeeRate * (context.daysPastDue / 30);
        
        return {
          isValid: context.lateFeeRate <= maxLateFeeRate && calculatedLateFee <= maxLateFee,
          warningMessage: context.lateFeeRate > maxLateFeeRate ? 
            'Late fee rate exceeds maximum allowed (5%)' : undefined
        };
      }
    };
  }

  private static parsePaymentTerms(terms: string | undefined): number {
    if (!terms) return 30; // default to 30 days
    
    const netMatch = terms.match(/net\s*(\d+)/i);
    if (netMatch && netMatch[1]) {
      return parseInt(netMatch[1], 10);
    }
    
    // Default payment terms mapping
    const termMap: Record<string, number> = {
      'due on receipt': 0,
      'net 15': 15,
      'net 30': 30,
      'net 45': 45,
      'net 60': 60,
      'net 90': 90
    };
    
    return termMap[terms?.toLowerCase() || ''] || 30;
  }
}

// Support Ticket Business Rules
export class SupportTicketBusinessRules {
  
  // Rule: SLA compliance validation
  static slaCompliance(): BusinessRule<{ 
    priority: string;
    createdAt: Date;
    firstResponseAt?: Date;
    resolvedAt?: Date;
  }> {
    return {
      name: 'sla-compliance',
      description: 'Support ticket must meet SLA requirements',
      priority: 20,
      async validate(context) {
        // Define SLA targets inline
        const getSLATargets = (priority: string) => {
          const targets = {
            'critical': { firstResponseTime: 15, resolutionTime: 240 }, // 15min, 4h
            'high': { firstResponseTime: 60, resolutionTime: 480 }, // 1h, 8h
            'medium': { firstResponseTime: 240, resolutionTime: 1440 }, // 4h, 24h
            'low': { firstResponseTime: 1440, resolutionTime: 4320 } // 24h, 72h
          };
          return targets[priority as keyof typeof targets] || targets.low;
        };
        
        const slaTargets = getSLATargets(context.priority);
        const now = new Date();
        const elapsedMinutes = (now.getTime() - context.createdAt.getTime()) / (1000 * 60);
        
        const violations: string[] = [];
        
        // Check first response SLA
        if (!context.firstResponseAt && elapsedMinutes > slaTargets.firstResponseTime) {
          violations.push(`First response SLA breached (${slaTargets.firstResponseTime} minutes)`);
        }
        
        // Check resolution SLA
        if (!context.resolvedAt && elapsedMinutes > slaTargets.resolutionTime) {
          violations.push(`Resolution SLA breached (${slaTargets.resolutionTime} minutes)`);
        }

        return {
          isValid: violations.length === 0,
          warningMessage: violations.length > 0 ? violations.join('; ') : undefined,
          metadata: { slaTargets, elapsedMinutes, violations }
        };
      }
    };
  }

  // Rule: Escalation criteria
  static escalationCriteria(): BusinessRule<{ 
    priority: string;
    createdAt: Date;
    escalatedAt?: Date;
    customerTier: string;
  }> {
    return {
      name: 'escalation-criteria',
      description: 'Ticket should be escalated based on priority and customer tier',
      priority: 25,
      async validate(context) {
        // Define escalation time inline
        const getEscalationTime = (priority: string, customerTier: string): number => {
          const baseTimes = {
            'critical': 30,
            'high': 120,
            'medium': 480,
            'low': 1440
          };
          
          const multipliers = {
            'enterprise': 0.5,
            'professional': 0.75,
            'standard': 1.0,
            'basic': 1.5
          };
          
          const baseTime = baseTimes[priority as keyof typeof baseTimes] || baseTimes.low;
          const multiplier = multipliers[customerTier as keyof typeof multipliers] || multipliers.standard;
          
          return baseTime * multiplier;
        };
        
        const escalationTime = getEscalationTime(context.priority, context.customerTier);
        const elapsedMinutes = (new Date().getTime() - context.createdAt.getTime()) / (1000 * 60);
        
        const shouldEscalate = elapsedMinutes > escalationTime && !context.escalatedAt;
        
        return {
          isValid: !shouldEscalate,
          warningMessage: shouldEscalate ? 
            `Ticket should be escalated (${escalationTime} minutes threshold exceeded)` : undefined,
          metadata: { escalationTime, elapsedMinutes, shouldEscalate }
        };
      }
    };
  }

  private static getSLATargets(priority: string) {
    const targets = {
      'critical': { firstResponseTime: 15, resolutionTime: 240 }, // 15min, 4h
      'high': { firstResponseTime: 60, resolutionTime: 480 }, // 1h, 8h
      'medium': { firstResponseTime: 240, resolutionTime: 1440 }, // 4h, 24h
      'low': { firstResponseTime: 480, resolutionTime: 2880 } // 8h, 48h
    };
    return targets[priority as keyof typeof targets] || targets.medium;
  }

  private static getEscalationTime(priority: string, customerTier: string): number {
    const baseTimes = {
      'critical': 30,
      'high': 120,
      'medium': 480,
      'low': 960
    };
    
    const tierMultipliers = {
      'enterprise': 0.5,
      'professional': 0.75,
      'basic': 1.0,
      'free': 1.5
    };
    
    const baseTime = baseTimes[priority as keyof typeof baseTimes] || baseTimes.medium;
    const multiplier = tierMultipliers[customerTier as keyof typeof tierMultipliers] || 1.0;
    
    return Math.floor(baseTime * multiplier);
  }
}

// API Key Business Rules
export class ApiKeyBusinessRules {
  
  // Rule: Rate limit validation
  static rateLimitValidation(): BusinessRule<{ 
    rateLimit: number;
    subscriptionTier: string;
  }> {
    return {
      name: 'rate-limit-validation',
      description: 'API key rate limit must be within subscription tier limits',
      priority: 5,
      async validate(context) {
        // Define rate limits inline
        const getMaxRateLimit = (tier: string): number => {
          const limits = {
            'free': 100,
            'basic': 1000,
            'professional': 10000,
            'enterprise': 100000
          };
          return limits[tier as keyof typeof limits] || limits.free;
        };
        
        const maxRateLimit = getMaxRateLimit(context.subscriptionTier);
        
        return {
          isValid: context.rateLimit <= maxRateLimit,
          errorMessage: context.rateLimit > maxRateLimit ? 
            `Rate limit (${context.rateLimit}) exceeds tier maximum (${maxRateLimit})` : undefined
        };
      }
    };
  }

  // Rule: Scope validation
  static scopeValidation(): BusinessRule<{ 
    scopes: string[];
    userRole: string;
    subscriptionTier: string;
  }> {
    return {
      name: 'scope-validation',
      description: 'API key scopes must be valid for user role and subscription tier',
      priority: 3,
      async validate(context) {
        // Define allowed scopes inline
        const getAllowedScopes = (role: string, tier: string): string[] => {
          const baseScopes = ['read:profile', 'read:projects'];
          const roleScopes = {
            'admin': ['*'], // All scopes
            'manager': ['read:*', 'write:projects', 'write:teams'],
            'developer': ['read:*', 'write:projects'],
            'viewer': ['read:*']
          };
          
          const tierScopes = {
            'enterprise': ['admin:*'],
            'professional': ['manage:teams'],
            'basic': [],
            'free': []
          };
          
          const userRoleScopes = roleScopes[role as keyof typeof roleScopes] || roleScopes.viewer;
          const userTierScopes = tierScopes[tier as keyof typeof tierScopes] || [];
          
          return [...baseScopes, ...userRoleScopes, ...userTierScopes];
        };
        
        const allowedScopes = getAllowedScopes(context.userRole, context.subscriptionTier);
        const invalidScopes = context.scopes.filter(scope => !allowedScopes.includes(scope));
        
        return {
          isValid: invalidScopes.length === 0,
          errorMessage: invalidScopes.length > 0 ? 
            `Invalid scopes: ${invalidScopes.join(', ')}` : undefined,
          metadata: { allowedScopes, invalidScopes }
        };
      }
    };
  }

  private static getMaxRateLimit(tier: string): number {
    const limits = {
      'free': 100,
      'basic': 1000,
      'professional': 10000,
      'enterprise': 100000
    };
    return limits[tier as keyof typeof limits] || limits.free;
  }

  private static getAllowedScopes(role: string, tier: string): string[] {
    const baseScopes = ['read:profile', 'read:projects'];
    const roleScopes = {
      'admin': ['*'],
      'developer': ['read:*', 'write:projects', 'write:content'],
      'user': ['read:*', 'write:projects'],
      'client': ['read:projects', 'read:invoices']
    };
    
    const tierScopes = {
      'enterprise': ['admin:*'],
      'professional': ['manage:webhooks', 'analytics:*'],
      'basic': ['webhooks:read'],
      'free': []
    };
    
    const userScopes = roleScopes[role as keyof typeof roleScopes] || baseScopes;
    const additionalScopes = tierScopes[tier as keyof typeof tierScopes] || [];
    
    return [...new Set([...baseScopes, ...userScopes, ...additionalScopes])];
  }
}

// Global Business Rules Engine Instance
export const businessRulesEngine = new BusinessRulesEngine();

// Register all business rules
export function registerAllBusinessRules(): void {
  // Organization rules
  businessRulesEngine.registerRule('organization', OrganizationBusinessRules.uniqueOrganizationName());
  businessRulesEngine.registerRule('organization', OrganizationBusinessRules.requireAdminUser());
  businessRulesEngine.registerRule('organization', OrganizationBusinessRules.subscriptionLimits());
  
  // Project rules
  businessRulesEngine.registerRule('project', ProjectBusinessRules.validDateRange());
  businessRulesEngine.registerRule('project', ProjectBusinessRules.positiveBudget());
  businessRulesEngine.registerRule('project', ProjectBusinessRules.teamCapacity());
  businessRulesEngine.registerRule('project', ProjectBusinessRules.validMilestones());
  
  // Invoice rules
  businessRulesEngine.registerRule('invoice', InvoiceBusinessRules.futureDueDate());
  businessRulesEngine.registerRule('invoice', InvoiceBusinessRules.hasLineItems());
  businessRulesEngine.registerRule('invoice', InvoiceBusinessRules.validPaymentTerms());
  businessRulesEngine.registerRule('invoice', InvoiceBusinessRules.lateFeeValidation());
  
  // Support ticket rules
  businessRulesEngine.registerRule('support-ticket', SupportTicketBusinessRules.slaCompliance());
  businessRulesEngine.registerRule('support-ticket', SupportTicketBusinessRules.escalationCriteria());
  
  // API key rules
  businessRulesEngine.registerRule('api-key', ApiKeyBusinessRules.rateLimitValidation());
  businessRulesEngine.registerRule('api-key', ApiKeyBusinessRules.scopeValidation());
}
