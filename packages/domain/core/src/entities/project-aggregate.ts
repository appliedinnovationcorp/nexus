// Project Aggregate - Client project management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { ProjectStatus } from '../value-objects/project-status';
import { Money } from '../value-objects/money';

export interface ProjectMilestone {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly dueDate: Date;
  readonly isCompleted: boolean;
  readonly completedAt?: Date;
}

export interface ProjectTeamMember {
  readonly userId: string;
  readonly role: string;
  readonly assignedAt: Date;
}

export class ProjectAggregate extends AggregateRoot {
  private _name: string;
  private _description: string;
  private _clientAccountId: string;
  private _status: ProjectStatus;
  private _budget: Money;
  private _startDate: Date;
  private _expectedEndDate: Date;
  private _actualEndDate?: Date;
  private _milestones: ProjectMilestone[] = [];
  private _teamMembers: ProjectTeamMember[] = [];
  private _progress: number = 0; // 0-100

  private constructor(
    id: string,
    name: string,
    description: string,
    clientAccountId: string,
    budget: Money,
    startDate: Date,
    expectedEndDate: Date,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._description = description;
    this._clientAccountId = clientAccountId;
    this._budget = budget;
    this._startDate = startDate;
    this._expectedEndDate = expectedEndDate;
    this._status = ProjectStatus.planning();
  }

  public static create(
    id: string,
    name: string,
    description: string,
    clientAccountId: string,
    budget: Money,
    startDate: Date,
    expectedEndDate: Date
  ): ProjectAggregate {
    const project = new ProjectAggregate(id, name, description, clientAccountId, budget, startDate, expectedEndDate);
    
    project.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProjectCreated',
      aggregateId: id,
      aggregateVersion: project.version,
      name,
      description,
      clientAccountId,
      budget: budget.toPlainObject(),
      startDate,
      expectedEndDate
    } as ProjectCreatedEvent);

    return project;
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get clientAccountId(): string { return this._clientAccountId; }
  get status(): ProjectStatus { return this._status; }
  get budget(): Money { return this._budget; }
  get progress(): number { return this._progress; }
  get milestones(): ProjectMilestone[] { return [...this._milestones]; }
  get teamMembers(): ProjectTeamMember[] { return [...this._teamMembers]; }

  // Business methods
  public startProject(): void {
    if (!this._status.isPlanning()) {
      throw new Error('Project must be in planning status to start');
    }

    this._status = ProjectStatus.inProgress();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProjectStarted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      startedAt: this.updatedAt
    } as ProjectStartedEvent);
  }

  public addMilestone(id: string, name: string, description: string, dueDate: Date): void {
    const milestone: ProjectMilestone = {
      id,
      name,
      description,
      dueDate,
      isCompleted: false
    };

    this._milestones.push(milestone);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProjectMilestoneAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      milestone: milestone
    } as ProjectMilestoneAddedEvent);
  }

  public completeMilestone(milestoneId: string): void {
    const milestoneIndex = this._milestones.findIndex(m => m.id === milestoneId);
    if (milestoneIndex === -1) {
      throw new Error(`Milestone ${milestoneId} not found`);
    }

    const milestone = this._milestones[milestoneIndex];
    if (!milestone) {
      throw new Error(`Milestone at index ${milestoneIndex} not found`);
    }
    
    if (milestone.isCompleted) {
      return; // Already completed
    }

    const completedAt = new Date();
    this._milestones[milestoneIndex] = {
      id: milestone.id,
      name: milestone.name,
      description: milestone.description,
      dueDate: milestone.dueDate,
      isCompleted: true,
      completedAt
    };

    this.recalculateProgress();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProjectMilestoneCompleted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      milestoneId,
      completedAt,
      newProgress: this._progress
    } as ProjectMilestoneCompletedEvent);
  }

  public assignTeamMember(userId: string, role: string): void {
    const existingMember = this._teamMembers.find(m => m.userId === userId);
    if (existingMember) {
      throw new Error(`User ${userId} is already assigned to this project`);
    }

    const teamMember: ProjectTeamMember = {
      userId,
      role,
      assignedAt: new Date()
    };

    this._teamMembers.push(teamMember);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProjectTeamMemberAssigned',
      aggregateId: this.id,
      aggregateVersion: this.version,
      userId,
      role,
      assignedAt: teamMember.assignedAt
    } as ProjectTeamMemberAssignedEvent);
  }

  public completeProject(): void {
    if (!this._status.isInProgress()) {
      throw new Error('Project must be in progress to complete');
    }

    this._status = ProjectStatus.completed();
    this._actualEndDate = new Date();
    this._progress = 100;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ProjectCompleted',
      aggregateId: this.id,
      aggregateVersion: this.version,
      completedAt: this._actualEndDate,
      finalBudget: this._budget.toPlainObject()
    } as ProjectCompletedEvent);
  }

  private recalculateProgress(): void {
    if (this._milestones.length === 0) {
      this._progress = 0;
      return;
    }

    const completedMilestones = this._milestones.filter(m => m.isCompleted).length;
    this._progress = Math.round((completedMilestones / this._milestones.length) * 100);
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'ProjectCreated':
        this.applyProjectCreated(event as ProjectCreatedEvent);
        break;
      case 'ProjectStarted':
        this.applyProjectStarted(event as ProjectStartedEvent);
        break;
      case 'ProjectMilestoneAdded':
        this.applyProjectMilestoneAdded(event as ProjectMilestoneAddedEvent);
        break;
      case 'ProjectMilestoneCompleted':
        this.applyProjectMilestoneCompleted(event as ProjectMilestoneCompletedEvent);
        break;
      case 'ProjectTeamMemberAssigned':
        this.applyProjectTeamMemberAssigned(event as ProjectTeamMemberAssignedEvent);
        break;
      case 'ProjectCompleted':
        this.applyProjectCompleted(event as ProjectCompletedEvent);
        break;
    }
  }

  private applyProjectCreated(event: ProjectCreatedEvent): void {
    this._name = event.name;
    this._description = event.description;
    this._clientAccountId = event.clientAccountId;
    this._budget = Money.fromPlainObject(event.budget);
    this._startDate = event.startDate;
    this._expectedEndDate = event.expectedEndDate;
    this._status = ProjectStatus.planning();
  }

  private applyProjectStarted(event: ProjectStartedEvent): void {
    this._status = ProjectStatus.inProgress();
  }

  private applyProjectMilestoneAdded(event: ProjectMilestoneAddedEvent): void {
    this._milestones.push(event.milestone);
  }

  private applyProjectMilestoneCompleted(event: ProjectMilestoneCompletedEvent): void {
    const milestoneIndex = this._milestones.findIndex(m => m.id === event.milestoneId);
    if (milestoneIndex >= 0) {
      const milestone = this._milestones[milestoneIndex];
      if (milestone) {
        this._milestones[milestoneIndex] = {
          id: milestone.id,
          name: milestone.name,
          description: milestone.description,
          dueDate: milestone.dueDate,
          isCompleted: true,
          completedAt: event.completedAt
        };
      }
    }
    this._progress = event.newProgress;
  }

  private applyProjectTeamMemberAssigned(event: ProjectTeamMemberAssignedEvent): void {
    this._teamMembers.push({
      userId: event.userId,
      role: event.role,
      assignedAt: event.assignedAt
    });
  }

  private applyProjectCompleted(event: ProjectCompletedEvent): void {
    this._status = ProjectStatus.completed();
    this._actualEndDate = event.completedAt;
    this._progress = 100;
  }
}

// Domain Events
export interface ProjectCreatedEvent extends DomainEvent {
  eventType: 'ProjectCreated';
  name: string;
  description: string;
  clientAccountId: string;
  budget: any;
  startDate: Date;
  expectedEndDate: Date;
}

export interface ProjectStartedEvent extends DomainEvent {
  eventType: 'ProjectStarted';
  startedAt: Date;
}

export interface ProjectMilestoneAddedEvent extends DomainEvent {
  eventType: 'ProjectMilestoneAdded';
  milestone: ProjectMilestone;
}

export interface ProjectMilestoneCompletedEvent extends DomainEvent {
  eventType: 'ProjectMilestoneCompleted';
  milestoneId: string;
  completedAt: Date;
  newProgress: number;
}

export interface ProjectTeamMemberAssignedEvent extends DomainEvent {
  eventType: 'ProjectTeamMemberAssigned';
  userId: string;
  role: string;
  assignedAt: Date;
}

export interface ProjectCompletedEvent extends DomainEvent {
  eventType: 'ProjectCompleted';
  completedAt: Date;
  finalBudget: any;
}
