// Team Aggregate - Team management within organizations

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';

export interface TeamMember {
  readonly userId: string;
  readonly role: TeamRole;
  readonly joinedAt: Date;
  readonly permissions: TeamPermission[];
}

export type TeamRole = 'owner' | 'admin' | 'member' | 'viewer';
export type TeamPermission = 'create_projects' | 'manage_members' | 'view_analytics' | 'manage_settings';

export class TeamAggregate extends AggregateRoot {
  private _name: string;
  private _description: string;
  private _organizationId: string;
  private _isActive: boolean;
  private _members: TeamMember[] = [];
  private _projectCount: number = 0;
  private _settings: TeamSettings;

  private constructor(
    id: string,
    name: string,
    description: string,
    organizationId: string,
    ownerId: string,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._description = description;
    this._organizationId = organizationId;
    this._isActive = true;
    this._settings = TeamSettings.default();
    
    // Add owner as first member
    this._members.push({
      userId: ownerId,
      role: 'owner',
      joinedAt: createdAt,
      permissions: ['create_projects', 'manage_members', 'view_analytics', 'manage_settings']
    });
  }

  public static create(
    id: string,
    name: string,
    description: string,
    organizationId: string,
    ownerId: string
  ): TeamAggregate {
    const team = new TeamAggregate(id, name, description, organizationId, ownerId);
    
    team.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TeamCreated',
      aggregateId: id,
      aggregateVersion: team.version,
      name,
      description,
      organizationId,
      ownerId
    } as TeamCreatedEvent);

    return team;
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get organizationId(): string { return this._organizationId; }
  get isActive(): boolean { return this._isActive; }
  get members(): TeamMember[] { return [...this._members]; }
  get projectCount(): number { return this._projectCount; }
  get memberCount(): number { return this._members.length; }

  // Business methods
  public updateDetails(name: string, description: string): void {
    this._name = name;
    this._description = description;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TeamDetailsUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      name,
      description
    } as TeamDetailsUpdatedEvent);
  }

  public addMember(userId: string, role: TeamRole, addedBy: string): void {
    // Check if user is already a member
    if (this._members.some(m => m.userId === userId)) {
      throw new Error(`User ${userId} is already a member of this team`);
    }

    // Check if the person adding has permission
    const adder = this._members.find(m => m.userId === addedBy);
    if (!adder || !this.canManageMembers(adder)) {
      throw new Error('Insufficient permissions to add members');
    }

    const permissions = this.getPermissionsForRole(role);
    const member: TeamMember = {
      userId,
      role,
      joinedAt: new Date(),
      permissions
    };

    this._members.push(member);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TeamMemberAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      userId,
      role,
      addedBy,
      permissions
    } as TeamMemberAddedEvent);
  }

  public removeMember(userId: string, removedBy: string): void {
    const memberIndex = this._members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) {
      throw new Error(`User ${userId} is not a member of this team`);
    }

    const memberToRemove = this._members[memberIndex];
    if (!memberToRemove) {
      throw new Error(`Member not found`);
    }
    const remover = this._members.find(m => m.userId === removedBy);

    // Can't remove owner
    if (memberToRemove.role === 'owner') {
      throw new Error('Cannot remove team owner');
    }

    // Check permissions
    if (!remover || !this.canManageMembers(remover)) {
      throw new Error('Insufficient permissions to remove members');
    }

    this._members.splice(memberIndex, 1);
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TeamMemberRemoved',
      aggregateId: this.id,
      aggregateVersion: this.version,
      userId,
      removedBy,
      previousRole: memberToRemove.role
    } as TeamMemberRemovedEvent);
  }

  public updateMemberRole(userId: string, newRole: TeamRole, updatedBy: string): void {
    const memberIndex = this._members.findIndex(m => m.userId === userId);
    if (memberIndex === -1) {
      throw new Error(`User ${userId} is not a member of this team`);
    }

    const member = this._members[memberIndex];
    if (!member) {
      throw new Error(`Member not found`);
    }
    const updater = this._members.find(m => m.userId === updatedBy);

    // Can't change owner role
    if (member.role === 'owner' || newRole === 'owner') {
      throw new Error('Cannot change owner role');
    }

    // Check permissions
    if (!updater || !this.canManageMembers(updater)) {
      throw new Error('Insufficient permissions to update member roles');
    }

    const oldRole = member.role;
    const newPermissions = this.getPermissionsForRole(newRole);
    
    this._members[memberIndex] = {
      ...member,
      role: newRole,
      permissions: newPermissions
    };
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TeamMemberRoleUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      userId,
      oldRole,
      newRole,
      updatedBy,
      newPermissions
    } as TeamMemberRoleUpdatedEvent);
  }

  public addProject(): void {
    this._projectCount++;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TeamProjectAdded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      newProjectCount: this._projectCount
    } as TeamProjectAddedEvent);
  }

  public deactivate(reason: string, deactivatedBy: string): void {
    if (!this._isActive) return;

    const deactivator = this._members.find(m => m.userId === deactivatedBy);
    if (!deactivator || deactivator.role !== 'owner') {
      throw new Error('Only team owner can deactivate the team');
    }

    this._isActive = false;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'TeamDeactivated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      reason,
      deactivatedBy
    } as TeamDeactivatedEvent);
  }

  private canManageMembers(member: TeamMember): boolean {
    return member.permissions.includes('manage_members');
  }

  private getPermissionsForRole(role: TeamRole): TeamPermission[] {
    const permissionMap: Record<TeamRole, TeamPermission[]> = {
      'owner': ['create_projects', 'manage_members', 'view_analytics', 'manage_settings'],
      'admin': ['create_projects', 'manage_members', 'view_analytics'],
      'member': ['create_projects', 'view_analytics'],
      'viewer': ['view_analytics']
    };

    return permissionMap[role];
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'TeamCreated':
        this.applyTeamCreated(event as TeamCreatedEvent);
        break;
      case 'TeamDetailsUpdated':
        this.applyTeamDetailsUpdated(event as TeamDetailsUpdatedEvent);
        break;
      case 'TeamMemberAdded':
        this.applyTeamMemberAdded(event as TeamMemberAddedEvent);
        break;
      case 'TeamMemberRemoved':
        this.applyTeamMemberRemoved(event as TeamMemberRemovedEvent);
        break;
      case 'TeamMemberRoleUpdated':
        this.applyTeamMemberRoleUpdated(event as TeamMemberRoleUpdatedEvent);
        break;
      case 'TeamProjectAdded':
        this.applyTeamProjectAdded(event as TeamProjectAddedEvent);
        break;
      case 'TeamDeactivated':
        this.applyTeamDeactivated(event as TeamDeactivatedEvent);
        break;
    }
  }

  private applyTeamCreated(event: TeamCreatedEvent): void {
    this._name = event.name;
    this._description = event.description;
    this._organizationId = event.organizationId;
    this._isActive = true;
    this._members = [{
      userId: event.ownerId,
      role: 'owner',
      joinedAt: this.createdAt,
      permissions: ['create_projects', 'manage_members', 'view_analytics', 'manage_settings']
    }];
  }

  private applyTeamDetailsUpdated(event: TeamDetailsUpdatedEvent): void {
    this._name = event.name;
    this._description = event.description;
  }

  private applyTeamMemberAdded(event: TeamMemberAddedEvent): void {
    this._members.push({
      userId: event.userId,
      role: event.role,
      joinedAt: new Date(),
      permissions: event.permissions
    });
  }

  private applyTeamMemberRemoved(event: TeamMemberRemovedEvent): void {
    this._members = this._members.filter(m => m.userId !== event.userId);
  }

  private applyTeamMemberRoleUpdated(event: TeamMemberRoleUpdatedEvent): void {
    const memberIndex = this._members.findIndex(m => m.userId === event.userId);
    if (memberIndex >= 0) {
      const existingMember = this._members[memberIndex];
      if (!existingMember) {
        throw new Error('Member not found during role update');
      }
      this._members[memberIndex] = {
        ...existingMember,
        role: event.newRole,
        permissions: event.newPermissions
      };
    }
  }

  private applyTeamProjectAdded(event: TeamProjectAddedEvent): void {
    this._projectCount = event.newProjectCount;
  }

  private applyTeamDeactivated(event: TeamDeactivatedEvent): void {
    this._isActive = false;
  }
}

export class TeamSettings {
  constructor(
    public readonly allowExternalCollaborators: boolean = false,
    public readonly requireApprovalForProjects: boolean = false,
    public readonly defaultProjectVisibility: 'private' | 'team' | 'organization' = 'team'
  ) {}

  public static default(): TeamSettings {
    return new TeamSettings();
  }
}

// Domain Events
export interface TeamCreatedEvent extends DomainEvent {
  eventType: 'TeamCreated';
  name: string;
  description: string;
  organizationId: string;
  ownerId: string;
}

export interface TeamDetailsUpdatedEvent extends DomainEvent {
  eventType: 'TeamDetailsUpdated';
  name: string;
  description: string;
}

export interface TeamMemberAddedEvent extends DomainEvent {
  eventType: 'TeamMemberAdded';
  userId: string;
  role: TeamRole;
  addedBy: string;
  permissions: TeamPermission[];
}

export interface TeamMemberRemovedEvent extends DomainEvent {
  eventType: 'TeamMemberRemoved';
  userId: string;
  removedBy: string;
  previousRole: TeamRole;
}

export interface TeamMemberRoleUpdatedEvent extends DomainEvent {
  eventType: 'TeamMemberRoleUpdated';
  userId: string;
  oldRole: TeamRole;
  newRole: TeamRole;
  updatedBy: string;
  newPermissions: TeamPermission[];
}

export interface TeamProjectAddedEvent extends DomainEvent {
  eventType: 'TeamProjectAdded';
  newProjectCount: number;
}

export interface TeamDeactivatedEvent extends DomainEvent {
  eventType: 'TeamDeactivated';
  reason: string;
  deactivatedBy: string;
}
