export type TicketCategoryType = 
  | 'technical-issue' 
  | 'feature-request' 
  | 'bug-report' 
  | 'account-access' 
  | 'billing' 
  | 'integration' 
  | 'performance' 
  | 'security' 
  | 'documentation' 
  | 'training' 
  | 'other';

export class TicketCategory {
  private constructor(private readonly value: TicketCategoryType) {}

  static technicalIssue(): TicketCategory {
    return new TicketCategory('technical-issue');
  }

  static featureRequest(): TicketCategory {
    return new TicketCategory('feature-request');
  }

  static bugReport(): TicketCategory {
    return new TicketCategory('bug-report');
  }

  static accountAccess(): TicketCategory {
    return new TicketCategory('account-access');
  }

  static billing(): TicketCategory {
    return new TicketCategory('billing');
  }

  static integration(): TicketCategory {
    return new TicketCategory('integration');
  }

  static performance(): TicketCategory {
    return new TicketCategory('performance');
  }

  static security(): TicketCategory {
    return new TicketCategory('security');
  }

  static documentation(): TicketCategory {
    return new TicketCategory('documentation');
  }

  static training(): TicketCategory {
    return new TicketCategory('training');
  }

  static other(): TicketCategory {
    return new TicketCategory('other');
  }

  static fromString(value: string): TicketCategory {
    const validCategories: TicketCategoryType[] = [
      'technical-issue', 'feature-request', 'bug-report', 'account-access', 
      'billing', 'integration', 'performance', 'security', 'documentation', 
      'training', 'other'
    ];
    if (!validCategories.includes(value as TicketCategoryType)) {
      throw new Error(`Invalid ticket category: ${value}`);
    }
    return new TicketCategory(value as TicketCategoryType);
  }

  getValue(): TicketCategoryType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: TicketCategory): boolean {
    return this.value === other.value;
  }

  getDisplayName(): string {
    const displayNames = {
      'technical-issue': 'Technical Issue',
      'feature-request': 'Feature Request',
      'bug-report': 'Bug Report',
      'account-access': 'Account Access',
      'billing': 'Billing',
      'integration': 'Integration',
      'performance': 'Performance',
      'security': 'Security',
      'documentation': 'Documentation',
      'training': 'Training',
      'other': 'Other'
    };
    return displayNames[this.value];
  }

  getDefaultPriority(): 'low' | 'medium' | 'high' | 'urgent' | 'critical' {
    const defaultPriorities = {
      'technical-issue': 'medium' as const,
      'feature-request': 'low' as const,
      'bug-report': 'high' as const,
      'account-access': 'high' as const,
      'billing': 'medium' as const,
      'integration': 'medium' as const,
      'performance': 'high' as const,
      'security': 'critical' as const,
      'documentation': 'low' as const,
      'training': 'low' as const,
      'other': 'medium' as const
    };
    return defaultPriorities[this.value];
  }

  requiresSpecialistTeam(): boolean {
    return ['security', 'integration', 'performance'].includes(this.value);
  }
}
