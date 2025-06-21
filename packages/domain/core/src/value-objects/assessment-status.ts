export type AssessmentStatusType = 'draft' | 'in-progress' | 'completed' | 'reviewed' | 'archived';

export class AssessmentStatus {
  private constructor(private readonly value: AssessmentStatusType) {}

  static draft(): AssessmentStatus {
    return new AssessmentStatus('draft');
  }

  static inProgress(): AssessmentStatus {
    return new AssessmentStatus('in-progress');
  }

  static completed(): AssessmentStatus {
    return new AssessmentStatus('completed');
  }

  static reviewed(): AssessmentStatus {
    return new AssessmentStatus('reviewed');
  }

  static archived(): AssessmentStatus {
    return new AssessmentStatus('archived');
  }

  static initiated(): AssessmentStatus {
    return new AssessmentStatus('in-progress');
  }

  static implementing(): AssessmentStatus {
    return new AssessmentStatus('in-progress');
  }

  static fromString(value: string): AssessmentStatus {
    const validStatuses: AssessmentStatusType[] = ['draft', 'in-progress', 'completed', 'reviewed', 'archived'];
    if (!validStatuses.includes(value as AssessmentStatusType)) {
      throw new Error(`Invalid assessment status: ${value}`);
    }
    return new AssessmentStatus(value as AssessmentStatusType);
  }

  getValue(): AssessmentStatusType {
    return this.value;
  }

  toString(): string {
    return this.value;
  }

  equals(other: AssessmentStatus): boolean {
    return this.value === other.value;
  }

  isDraft(): boolean {
    return this.value === 'draft';
  }

  isInProgress(): boolean {
    return this.value === 'in-progress';
  }

  isCompleted(): boolean {
    return this.value === 'completed';
  }

  isReviewed(): boolean {
    return this.value === 'reviewed';
  }

  isArchived(): boolean {
    return this.value === 'archived';
  }
}
