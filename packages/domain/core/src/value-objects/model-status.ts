export type ModelStatusType = 'draft' | 'training' | 'trained' | 'testing' | 'deployed' | 'deprecated' | 'failed';

export class ModelStatus {
  private constructor(private readonly value: ModelStatusType) {}

  static draft(): ModelStatus {
    return new ModelStatus('draft');
  }

  static training(): ModelStatus {
    return new ModelStatus('training');
  }

  static trained(): ModelStatus {
    return new ModelStatus('trained');
  }

  static testing(): ModelStatus {
    return new ModelStatus('testing');
  }

  static deployed(): ModelStatus {
    return new ModelStatus('deployed');
  }

  static deprecated(): ModelStatus {
    return new ModelStatus('deprecated');
  }

  static failed(): ModelStatus {
    return new ModelStatus('failed');
  }

  static development(): ModelStatus {
    return new ModelStatus('draft');
  }

  static retired(): ModelStatus {
    return new ModelStatus('deprecated');
  }

  static fromString(value: string): ModelStatus {
    const validStatuses: ModelStatusType[] = ['draft', 'training', 'trained', 'testing', 'deployed', 'deprecated', 'failed'];
    if (!validStatuses.includes(value as ModelStatusType)) {
      throw new Error(`Invalid model status: ${value}`);
    }
    return new ModelStatus(value as ModelStatusType);
  }

  getValue(): ModelStatusType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: ModelStatus): boolean {
    return this.value === other.value;
  }

  isDraft(): boolean {
    return this.value === 'draft';
  }

  isTraining(): boolean {
    return this.value === 'training';
  }

  isTrained(): boolean {
    return this.value === 'trained';
  }

  isTesting(): boolean {
    return this.value === 'testing';
  }

  isDeployed(): boolean {
    return this.value === 'deployed';
  }

  isDeprecated(): boolean {
    return this.value === 'deprecated';
  }

  isFailed(): boolean {
    return this.value === 'failed';
  }

  isRetired(): boolean {
    return this.value === 'deprecated';
  }

  canTransitionTo(newStatus: ModelStatus): boolean {
    const transitions: Record<ModelStatusType, ModelStatusType[]> = {
      'draft': ['training', 'failed'],
      'training': ['trained', 'failed'],
      'trained': ['testing', 'deployed', 'failed'],
      'testing': ['deployed', 'failed', 'trained'],
      'deployed': ['deprecated', 'failed'],
      'deprecated': [],
      'failed': ['draft', 'training']
    };
    return transitions[this.value].includes(newStatus.value);
  }
}
