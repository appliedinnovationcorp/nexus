export type ModelTypeValue = 
  | 'classification' 
  | 'regression' 
  | 'clustering' 
  | 'neural-network' 
  | 'deep-learning' 
  | 'nlp' 
  | 'computer-vision' 
  | 'recommendation' 
  | 'time-series' 
  | 'reinforcement-learning' 
  | 'ensemble' 
  | 'custom';

export class ModelType {
  private constructor(private readonly value: ModelTypeValue) {}

  static classification(): ModelType {
    return new ModelType('classification');
  }

  static regression(): ModelType {
    return new ModelType('regression');
  }

  static clustering(): ModelType {
    return new ModelType('clustering');
  }

  static neuralNetwork(): ModelType {
    return new ModelType('neural-network');
  }

  static deepLearning(): ModelType {
    return new ModelType('deep-learning');
  }

  static nlp(): ModelType {
    return new ModelType('nlp');
  }

  static computerVision(): ModelType {
    return new ModelType('computer-vision');
  }

  static recommendation(): ModelType {
    return new ModelType('recommendation');
  }

  static timeSeries(): ModelType {
    return new ModelType('time-series');
  }

  static reinforcementLearning(): ModelType {
    return new ModelType('reinforcement-learning');
  }

  static ensemble(): ModelType {
    return new ModelType('ensemble');
  }

  static custom(): ModelType {
    return new ModelType('custom');
  }

  static fromString(value: string): ModelType {
    const validTypes: ModelTypeValue[] = [
      'classification', 'regression', 'clustering', 'neural-network', 
      'deep-learning', 'nlp', 'computer-vision', 'recommendation', 
      'time-series', 'reinforcement-learning', 'ensemble', 'custom'
    ];
    if (!validTypes.includes(value as ModelTypeValue)) {
      throw new Error(`Invalid model type: ${value}`);
    }
    return new ModelType(value as ModelTypeValue);
  }

  getValue(): ModelTypeValue {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ModelType): boolean {
    return this.value === other.value;
  }

  getDisplayName(): string {
    const displayNames = {
      'classification': 'Classification',
      'regression': 'Regression',
      'clustering': 'Clustering',
      'neural-network': 'Neural Network',
      'deep-learning': 'Deep Learning',
      'nlp': 'Natural Language Processing',
      'computer-vision': 'Computer Vision',
      'recommendation': 'Recommendation System',
      'time-series': 'Time Series',
      'reinforcement-learning': 'Reinforcement Learning',
      'ensemble': 'Ensemble',
      'custom': 'Custom'
    };
    return displayNames[this.value];
  }

  getCategory(): 'supervised' | 'unsupervised' | 'reinforcement' | 'other' {
    const categories = {
      'classification': 'supervised' as const,
      'regression': 'supervised' as const,
      'clustering': 'unsupervised' as const,
      'neural-network': 'other' as const,
      'deep-learning': 'other' as const,
      'nlp': 'other' as const,
      'computer-vision': 'other' as const,
      'recommendation': 'other' as const,
      'time-series': 'other' as const,
      'reinforcement-learning': 'reinforcement' as const,
      'ensemble': 'other' as const,
      'custom': 'other' as const
    };
    return categories[this.value];
  }
}
