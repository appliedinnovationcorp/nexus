export type AIMaturityLevelType = 'beginner' | 'developing' | 'defined' | 'managed' | 'optimized';

export class AIMaturityLevel {
  private constructor(private readonly value: AIMaturityLevelType) {}

  static beginner(): AIMaturityLevel {
    return new AIMaturityLevel('beginner');
  }

  static developing(): AIMaturityLevel {
    return new AIMaturityLevel('developing');
  }

  static defined(): AIMaturityLevel {
    return new AIMaturityLevel('defined');
  }

  static managed(): AIMaturityLevel {
    return new AIMaturityLevel('managed');
  }

  static optimized(): AIMaturityLevel {
    return new AIMaturityLevel('optimized');
  }

  static advanced(): AIMaturityLevel {
    return new AIMaturityLevel('optimized');
  }

  static intermediate(): AIMaturityLevel {
    return new AIMaturityLevel('managed');
  }

  static fromString(value: string): AIMaturityLevel {
    const validLevels: AIMaturityLevelType[] = ['beginner', 'developing', 'defined', 'managed', 'optimized'];
    if (!validLevels.includes(value as AIMaturityLevelType)) {
      throw new Error(`Invalid AI maturity level: ${value}`);
    }
    return new AIMaturityLevel(value as AIMaturityLevelType);
  }

  getValue(): AIMaturityLevelType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: AIMaturityLevel): boolean {
    return this.value === other.value;
  }

  getNumericValue(): number {
    const levels = {
      'beginner': 1,
      'developing': 2,
      'defined': 3,
      'managed': 4,
      'optimized': 5
    };
    return levels[this.value];
  }

  isHigherThan(other: AIMaturityLevel): boolean {
    return this.getNumericValue() > other.getNumericValue();
  }

  isLowerThan(other: AIMaturityLevel): boolean {
    return this.getNumericValue() < other.getNumericValue();
  }
}
