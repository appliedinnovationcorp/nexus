// Training & Certification Aggregate - AI Education and Skill Development

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';

export interface LearningPath {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  readonly estimatedDuration: number; // hours
  readonly prerequisites: string[];
  readonly modules: LearningModule[];
  readonly certificationId?: string;
  readonly industryFocus?: string;
  readonly skillsAcquired: string[];
}

export interface LearningModule {
  readonly id: string;
  readonly name: string;
  readonly type: 'video' | 'interactive' | 'hands-on' | 'assessment' | 'project';
  readonly duration: number; // minutes
  readonly content: ModuleContent;
  readonly prerequisites: string[];
  readonly learningObjectives: string[];
  readonly assessmentCriteria: AssessmentCriteria[];
}

export interface ModuleContent {
  readonly videos?: VideoContent[];
  readonly documents?: DocumentContent[];
  readonly interactiveElements?: InteractiveElement[];
  readonly practicalExercises?: PracticalExercise[];
  readonly codeExamples?: CodeExample[];
}

export interface VideoContent {
  readonly id: string;
  readonly title: string;
  readonly duration: number;
  readonly url: string;
  readonly transcript?: string;
  readonly chapters: VideoChapter[];
}

export interface VideoChapter {
  readonly title: string;
  readonly startTime: number;
  readonly endTime: number;
  readonly keyPoints: string[];
}

export interface InteractiveElement {
  readonly id: string;
  readonly type: 'simulation' | 'quiz' | 'drag-drop' | 'code-editor' | 'ai-playground';
  readonly title: string;
  readonly instructions: string;
  readonly configuration: any;
  readonly successCriteria: string[];
}

export interface PracticalExercise {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly difficulty: 'easy' | 'medium' | 'hard';
  readonly estimatedTime: number;
  readonly resources: string[];
  readonly deliverables: string[];
  readonly evaluationRubric: EvaluationCriteria[];
}

export interface AssessmentCriteria {
  readonly criterion: string;
  readonly weight: number;
  readonly passingScore: number;
  readonly evaluationType: 'automatic' | 'peer-review' | 'instructor-review';
}

export interface LearnerProgress {
  readonly learnerId: string;
  readonly learningPathId: string;
  readonly currentModuleId: string;
  readonly completedModules: string[];
  readonly overallProgress: number; // 0-100
  readonly timeSpent: number; // minutes
  readonly lastAccessedAt: Date;
  readonly assessmentScores: {
    readonly moduleId: string;
    readonly score: number;
    readonly attempts: number;
    readonly completedAt: Date;
  }[];
  readonly skillsAcquired: string[];
  readonly certificationsEarned: string[];
}

export interface Certification {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly level: 'foundation' | 'associate' | 'professional' | 'expert';
  readonly validityPeriod: number; // months
  readonly requirements: CertificationRequirement[];
  readonly badge: BadgeDesign;
  readonly industryRecognition: string[];
  readonly continuingEducationRequired: boolean;
}

export interface CertificationRequirement {
  readonly type: 'course-completion' | 'assessment-score' | 'project-submission' | 'experience-hours';
  readonly description: string;
  readonly criteria: any;
  readonly weight: number;
}

export interface BadgeDesign {
  readonly imageUrl: string;
  readonly colors: string[];
  readonly elements: string[];
  readonly blockchainVerified: boolean;
}

export class TrainingCertificationAggregate extends AggregateRoot {
  private _organizationId: string;
  private _learningPaths: LearningPath[] = [];
  private _certifications: Certification[] = [];
  private _learnerProgresses: LearnerProgress[] = [];
  private _instructors: string[] = [];
  private _analytics: TrainingAnalytics;
  private _aiTutor: AITutorConfiguration;
  private _gamificationSettings: GamificationSettings;

  private constructor(
    id: string,
    organizationId: string,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._organizationId = organizationId;
    this._analytics = {
      totalLearners: 0,
      activeLearners: 0,
      completionRate: 0,
      averageScore: 0,
      popularPaths: [],
      skillGaps: [],
      certificationStats: []
    };
    this._aiTutor = {
      enabled: true,
      personalizedRecommendations: true,
      adaptiveLearning: true,
      realTimeFeedback: true,
      languageSupport: ['en', 'es', 'fr', 'de', 'zh']
    };
    this._gamificationSettings = {
      pointsEnabled: true,
      badgesEnabled: true,
      leaderboardsEnabled: true,
      achievementsEnabled: true,
      streaksEnabled: true
    };
  }

  public static create(
    id: string,
    organizationId: string
  ): TrainingCertificationAggregate {
    const training = new TrainingCertificationAggregate(id, organizationId);

    training.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TrainingPlatformCreated',
      aggregateId: id,
      aggregateVersion: training.version,
      organizationId
    } as TrainingPlatformCreatedEvent);

    return training;
  }

  // Getters
  get organizationId(): string { return this._organizationId; }
  get learningPaths(): LearningPath[] { return [...this._learningPaths]; }
  get certifications(): Certification[] { return [...this._certifications]; }
  get learnerProgresses(): LearnerProgress[] { return [...this._learnerProgresses]; }
  get analytics(): TrainingAnalytics { return this._analytics; }

  // Business methods
  public createLearningPath(
    pathId: string,
    name: string,
    description: string,
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    modules: LearningModule[],
    industryFocus?: string
  ): void {
    if (this._learningPaths.some(p => p.id === pathId)) {
      throw new Error(`Learning path ${pathId} already exists`);
    }

    const estimatedDuration = modules.reduce((total, module) => total + module.duration, 0) / 60; // Convert to hours
    const skillsAcquired = modules.flatMap(m => m.learningObjectives);

    const learningPath: LearningPath = {
      id: pathId,
      name,
      description,
      level,
      estimatedDuration,
      prerequisites: [],
      modules,
      industryFocus,
      skillsAcquired
    };

    this._learningPaths.push(learningPath);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'LearningPathCreated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      pathId,
      name,
      level,
      moduleCount: modules.length,
      estimatedDuration,
      industryFocus
    } as LearningPathCreatedEvent);
  }

  public enrollLearner(
    learnerId: string,
    learningPathId: string,
    startingModuleId?: string
  ): void {
    const learningPath = this._learningPaths.find(p => p.id === learningPathId);
    if (!learningPath) {
      throw new Error(`Learning path ${learningPathId} not found`);
    }

    const existingProgress = this._learnerProgresses.find(p => 
      p.learnerId === learnerId && p.learningPathId === learningPathId
    );
    if (existingProgress) {
      throw new Error(`Learner ${learnerId} is already enrolled in path ${learningPathId}`);
    }

    const currentModuleId = startingModuleId || learningPath.modules[0]?.id;
    if (!currentModuleId) {
      throw new Error('Learning path has no modules');
    }

    const progress: LearnerProgress = {
      learnerId,
      learningPathId,
      currentModuleId,
      completedModules: [],
      overallProgress: 0,
      timeSpent: 0,
      lastAccessedAt: new Date(),
      assessmentScores: [],
      skillsAcquired: [],
      certificationsEarned: []
    };

    this._learnerProgresses.push(progress);
    this.updateAnalytics();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'LearnerEnrolled',
      aggregateId: this.id,
      aggregateVersion: this.version,
      learnerId,
      learningPathId,
      currentModuleId,
      enrolledAt: new Date()
    } as LearnerEnrolledEvent);
  }

  public recordModuleCompletion(
    learnerId: string,
    learningPathId: string,
    moduleId: string,
    timeSpent: number,
    assessmentScore?: number
  ): void {
    const progressIndex = this._learnerProgresses.findIndex(p => 
      p.learnerId === learnerId && p.learningPathId === learningPathId
    );
    if (progressIndex === -1) {
      throw new Error(`Learner progress not found for ${learnerId} in path ${learningPathId}`);
    }

    const progress = this._learnerProgresses[progressIndex]!;
    const learningPath = this._learningPaths.find(p => p.id === learningPathId);
    if (!learningPath) {
      throw new Error(`Learning path ${learningPathId} not found`);
    }

    const module = learningPath.modules.find(m => m.id === moduleId);
    if (!module) {
      throw new Error(`Module ${moduleId} not found in path ${learningPathId}`);
    }

    // Update progress
    const updatedCompletedModules = [...progress.completedModules];
    if (!updatedCompletedModules.includes(moduleId)) {
      updatedCompletedModules.push(moduleId);
    }

    const updatedAssessmentScores = [...progress.assessmentScores];
    if (assessmentScore !== undefined) {
      const existingScoreIndex = updatedAssessmentScores.findIndex(s => s.moduleId === moduleId);
      if (existingScoreIndex >= 0) {
        const existingScore = updatedAssessmentScores[existingScoreIndex];
        if (!existingScore) {
          throw new Error('Assessment score not found');
        }
        updatedAssessmentScores[existingScoreIndex] = {
          moduleId,
          score: Math.max(existingScore.score, assessmentScore),
          attempts: existingScore.attempts + 1,
          completedAt: new Date()
        };
      } else {
        updatedAssessmentScores.push({
          moduleId,
          score: assessmentScore,
          attempts: 1,
          completedAt: new Date()
        });
      }
    }

    const overallProgress = Math.round((updatedCompletedModules.length / learningPath.modules.length) * 100);
    const updatedSkillsAcquired = [...progress.skillsAcquired, ...module.learningObjectives];

    // Find next module
    const currentModuleIndex = learningPath.modules.findIndex(m => m.id === moduleId);
    const nextModule = learningPath.modules[currentModuleIndex + 1];

    this._learnerProgresses[progressIndex] = {
      learnerId: progress.learnerId,
      learningPathId: progress.learningPathId,
      currentModuleId: nextModule?.id || moduleId,
      completedModules: updatedCompletedModules,
      overallProgress,
      timeSpent: progress.timeSpent + timeSpent,
      lastAccessedAt: new Date(),
      assessmentScores: updatedAssessmentScores,
      skillsAcquired: [...new Set(updatedSkillsAcquired)],
      certificationsEarned: progress.certificationsEarned
    };

    this.updateAnalytics();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ModuleCompleted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      learnerId,
      learningPathId,
      moduleId,
      timeSpent,
      assessmentScore,
      overallProgress,
      completedAt: new Date(),
      isPathCompleted: overallProgress === 100
    } as ModuleCompletedEvent);

    // Check for path completion
    if (overallProgress === 100) {
      this.handlePathCompletion(learnerId, learningPathId);
    }
  }

  public createCertification(
    certificationId: string,
    name: string,
    description: string,
    level: 'foundation' | 'associate' | 'professional' | 'expert',
    requirements: CertificationRequirement[],
    validityPeriod: number
  ): void {
    if (this._certifications.some(c => c.id === certificationId)) {
      throw new Error(`Certification ${certificationId} already exists`);
    }

    const certification: Certification = {
      id: certificationId,
      name,
      description,
      level,
      validityPeriod,
      requirements,
      badge: {
        imageUrl: `/badges/${certificationId}.png`,
        colors: ['#1e40af', '#3b82f6', '#60a5fa'],
        elements: ['shield', 'star', 'checkmark'],
        blockchainVerified: true
      },
      industryRecognition: ['IEEE', 'ACM', 'CompTIA'],
      continuingEducationRequired: level === 'professional' || level === 'expert'
    };

    this._certifications.push(certification);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'CertificationCreated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      certificationId,
      name,
      level,
      validityPeriod,
      requirementCount: requirements.length
    } as CertificationCreatedEvent);
  }

  public awardCertification(
    learnerId: string,
    certificationId: string,
    achievedAt: Date = new Date()
  ): void {
    const certification = this._certifications.find(c => c.id === certificationId);
    if (!certification) {
      throw new Error(`Certification ${certificationId} not found`);
    }

    // Check if learner meets requirements
    const learnerProgress = this._learnerProgresses.filter(p => p.learnerId === learnerId);
    const meetsRequirements = this.checkCertificationRequirements(learnerProgress, certification);
    
    if (!meetsRequirements) {
      throw new Error(`Learner ${learnerId} does not meet requirements for certification ${certificationId}`);
    }

    // Update all learner progress records to include the certification
    this._learnerProgresses = this._learnerProgresses.map(progress => {
      if (progress.learnerId === learnerId && !progress.certificationsEarned.includes(certificationId)) {
        return {
          ...progress,
          certificationsEarned: [...progress.certificationsEarned, certificationId]
        };
      }
      return progress;
    });

    this.updateAnalytics();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'CertificationAwarded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      learnerId,
      certificationId,
      certificationName: certification.name,
      level: certification.level,
      awardedAt: achievedAt,
      validUntil: new Date(achievedAt.getTime() + certification.validityPeriod * 30 * 24 * 60 * 60 * 1000)
    } as CertificationAwardedEvent);
  }

  private handlePathCompletion(learnerId: string, learningPathId: string): void {
    const learningPath = this._learningPaths.find(p => p.id === learningPathId);
    if (!learningPath) return;

    // Check if path has associated certification
    if (learningPath.certificationId) {
      try {
        this.awardCertification(learnerId, learningPath.certificationId);
      } catch (error) {
        // Log error but don't fail the path completion
        console.warn(`Failed to award certification ${learningPath.certificationId} to learner ${learnerId}:`, error);
      }
    }

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'LearningPathCompleted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      learnerId,
      learningPathId,
      pathName: learningPath.name,
      completedAt: new Date(),
      skillsAcquired: learningPath.skillsAcquired
    } as LearningPathCompletedEvent);
  }

  private checkCertificationRequirements(
    learnerProgress: LearnerProgress[],
    certification: Certification
  ): boolean {
    return certification.requirements.every(requirement => {
      switch (requirement.type) {
        case 'course-completion':
          const requiredPaths = requirement.criteria.learningPathIds || [];
          return requiredPaths.every((pathId: string) => 
            learnerProgress.some(p => p.learningPathId === pathId && p.overallProgress === 100)
          );
        
        case 'assessment-score':
          const minScore = requirement.criteria.minimumScore || 80;
          const relevantScores = learnerProgress.flatMap(p => p.assessmentScores);
          return relevantScores.length > 0 && 
            relevantScores.reduce((sum, s) => sum + s.score, 0) / relevantScores.length >= minScore;
        
        case 'project-submission':
          // Would check for submitted projects in a real implementation
          return true;
        
        case 'experience-hours':
          const requiredHours = requirement.criteria.minimumHours || 40;
          const totalHours = learnerProgress.reduce((sum, p) => sum + p.timeSpent, 0) / 60;
          return totalHours >= requiredHours;
        
        default:
          return false;
      }
    });
  }

  private updateAnalytics(): void {
    const totalLearners = new Set(this._learnerProgresses.map(p => p.learnerId)).size;
    const activeLearners = new Set(
      this._learnerProgresses
        .filter(p => {
          const daysSinceLastAccess = (Date.now() - p.lastAccessedAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceLastAccess <= 30;
        })
        .map(p => p.learnerId)
    ).size;

    const completedPaths = this._learnerProgresses.filter(p => p.overallProgress === 100);
    const completionRate = totalLearners > 0 ? (completedPaths.length / totalLearners) * 100 : 0;

    const allScores = this._learnerProgresses.flatMap(p => p.assessmentScores.map(s => s.score));
    const averageScore = allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0;

    // Popular paths
    const pathCounts = new Map<string, number>();
    this._learnerProgresses.forEach(p => {
      pathCounts.set(p.learningPathId, (pathCounts.get(p.learningPathId) || 0) + 1);
    });
    const popularPaths = Array.from(pathCounts.entries())
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([pathId, count]) => ({ pathId, enrollmentCount: count }));

    this._analytics = {
      totalLearners,
      activeLearners,
      completionRate: Math.round(completionRate),
      averageScore: Math.round(averageScore),
      popularPaths,
      skillGaps: [], // Would be calculated based on industry requirements
      certificationStats: this._certifications.map(cert => ({
        certificationId: cert.id,
        totalAwarded: this._learnerProgresses.reduce((count, p) => 
          count + (p.certificationsEarned.includes(cert.id) ? 1 : 0), 0
        )
      }))
    };
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'TrainingPlatformCreated':
        this.applyTrainingPlatformCreated(event as TrainingPlatformCreatedEvent);
        break;
      case 'LearningPathCreated':
        this.applyLearningPathCreated(event as LearningPathCreatedEvent);
        break;
      case 'LearnerEnrolled':
        this.applyLearnerEnrolled(event as LearnerEnrolledEvent);
        break;
      case 'ModuleCompleted':
        this.applyModuleCompleted(event as ModuleCompletedEvent);
        break;
      case 'CertificationAwarded':
        this.applyCertificationAwarded(event as CertificationAwardedEvent);
        break;
    }
  }

  private applyTrainingPlatformCreated(event: TrainingPlatformCreatedEvent): void {
    this._organizationId = event.organizationId;
  }

  private applyLearningPathCreated(event: LearningPathCreatedEvent): void {
    // Learning path would be reconstructed from event data
  }

  private applyLearnerEnrolled(event: LearnerEnrolledEvent): void {
    // Learner progress would be reconstructed from event data
  }

  private applyModuleCompleted(event: ModuleCompletedEvent): void {
    // Progress updates would be applied
  }

  private applyCertificationAwarded(event: CertificationAwardedEvent): void {
    // Certification award would be recorded
  }
}

// Supporting interfaces
export interface TrainingAnalytics {
  totalLearners: number;
  activeLearners: number;
  completionRate: number;
  averageScore: number;
  popularPaths: { pathId: string; enrollmentCount: number }[];
  skillGaps: { skill: string; demandLevel: number; supplyLevel: number }[];
  certificationStats: { certificationId: string; totalAwarded: number }[];
}

export interface AITutorConfiguration {
  enabled: boolean;
  personalizedRecommendations: boolean;
  adaptiveLearning: boolean;
  realTimeFeedback: boolean;
  languageSupport: string[];
}

export interface GamificationSettings {
  pointsEnabled: boolean;
  badgesEnabled: boolean;
  leaderboardsEnabled: boolean;
  achievementsEnabled: boolean;
  streaksEnabled: boolean;
}

export interface DocumentContent {
  readonly id: string;
  readonly title: string;
  readonly type: 'pdf' | 'markdown' | 'html' | 'presentation';
  readonly url: string;
  readonly downloadable: boolean;
}

export interface CodeExample {
  readonly id: string;
  readonly title: string;
  readonly language: string;
  readonly code: string;
  readonly explanation: string;
  readonly runnable: boolean;
}

export interface EvaluationCriteria {
  readonly criterion: string;
  readonly description: string;
  readonly maxPoints: number;
  readonly rubric: string[];
}

// Domain Events
export interface TrainingPlatformCreatedEvent extends DomainEvent {
  eventType: 'TrainingPlatformCreated';
  organizationId: string;
}

export interface LearningPathCreatedEvent extends DomainEvent {
  eventType: 'LearningPathCreated';
  pathId: string;
  name: string;
  level: string;
  moduleCount: number;
  estimatedDuration: number;
  industryFocus?: string;
}

export interface LearnerEnrolledEvent extends DomainEvent {
  eventType: 'LearnerEnrolled';
  learnerId: string;
  learningPathId: string;
  currentModuleId: string;
  enrolledAt: Date;
}

export interface ModuleCompletedEvent extends DomainEvent {
  eventType: 'ModuleCompleted';
  learnerId: string;
  learningPathId: string;
  moduleId: string;
  timeSpent: number;
  assessmentScore?: number;
  overallProgress: number;
  completedAt: Date;
  isPathCompleted: boolean;
}

export interface LearningPathCompletedEvent extends DomainEvent {
  eventType: 'LearningPathCompleted';
  learnerId: string;
  learningPathId: string;
  pathName: string;
  completedAt: Date;
  skillsAcquired: string[];
}

export interface CertificationCreatedEvent extends DomainEvent {
  eventType: 'CertificationCreated';
  certificationId: string;
  name: string;
  level: string;
  validityPeriod: number;
  requirementCount: number;
}

export interface CertificationAwardedEvent extends DomainEvent {
  eventType: 'CertificationAwarded';
  learnerId: string;
  certificationId: string;
  certificationName: string;
  level: string;
  awardedAt: Date;
  validUntil: Date;
}
