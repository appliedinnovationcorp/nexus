// API Key Aggregate - Developer API Key Management

import { AggregateRoot } from './aggregate-root';
import { DomainEvent } from '../events/event-store';
import { APIKeyStatus } from '../value-objects/api-key-status';

export interface ApiKeyPermissions {
  readonly scopes: string[];
  readonly rateLimit: number; // requests per minute
  readonly allowedIPs?: string[];
  readonly allowedDomains?: string[];
}

export interface ApiKeyUsageStats {
  readonly totalRequests: number;
  readonly requestsToday: number;
  readonly requestsThisMonth: number;
  readonly lastUsedAt?: Date;
  readonly averageResponseTime: number;
  readonly errorRate: number;
}

export class ApiKeyAggregate extends AggregateRoot {
  private _name: string;
  private _description: string;
  private _keyHash: string; // Never store the actual key
  private _keyPrefix: string; // First 8 characters for identification
  private _organizationId: string;
  private _developerId: string;
  private _status: APIKeyStatus;
  private _permissions: ApiKeyPermissions;
  private _usageStats: ApiKeyUsageStats;
  private _expiresAt?: Date;
  private _lastUsedAt?: Date;
  private _environment: 'development' | 'staging' | 'production';
  private _webhookUrl?: string;
  private _rotationHistory: string[] = []; // Store hashes of previous keys

  private constructor(
    id: string,
    name: string,
    description: string,
    keyHash: string,
    keyPrefix: string,
    organizationId: string,
    developerId: string,
    permissions: ApiKeyPermissions,
    environment: 'development' | 'staging' | 'production',
    expiresAt?: Date,
    createdAt: Date = new Date()
  ) {
    super(id, createdAt);
    this._name = name;
    this._description = description;
    this._keyHash = keyHash;
    this._keyPrefix = keyPrefix;
    this._organizationId = organizationId;
    this._developerId = developerId;
    this._permissions = permissions;
    this._environment = environment;
    this._expiresAt = expiresAt;
    this._status = APIKeyStatus.active();
    this._usageStats = {
      totalRequests: 0,
      requestsToday: 0,
      requestsThisMonth: 0,
      averageResponseTime: 0,
      errorRate: 0
    };
  }

  public static create(
    id: string,
    name: string,
    description: string,
    keyHash: string,
    keyPrefix: string,
    organizationId: string,
    developerId: string,
    permissions: ApiKeyPermissions,
    environment: 'development' | 'staging' | 'production',
    expiresAt?: Date,
    webhookUrl?: string
  ): ApiKeyAggregate {
    const apiKey = new ApiKeyAggregate(
      id, name, description, keyHash, keyPrefix,
      organizationId, developerId, permissions, environment, expiresAt
    );

    if (webhookUrl) apiKey._webhookUrl = webhookUrl;

    apiKey.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeyCreated',
      aggregateId: id,
      aggregateVersion: apiKey.version,
      name,
      keyPrefix,
      organizationId,
      developerId,
      permissions,
      environment,
      expiresAt,
      webhookUrl
    } as ApiKeyCreatedEvent);

    return apiKey;
  }

  // Getters
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get keyPrefix(): string { return this._keyPrefix; }
  get organizationId(): string { return this._organizationId; }
  get developerId(): string { return this._developerId; }
  get status(): APIKeyStatus { return this._status; }
  get permissions(): ApiKeyPermissions { return this._permissions; }
  get usageStats(): ApiKeyUsageStats { return this._usageStats; }
  get environment(): string { return this._environment; }
  get expiresAt(): Date | undefined { return this._expiresAt; }
  get lastUsedAt(): Date | undefined { return this._lastUsedAt; }
  get webhookUrl(): string | undefined { return this._webhookUrl; }
  get isExpired(): boolean {
    return this._expiresAt ? new Date() > this._expiresAt : false;
  }
  get isActive(): boolean {
    return this._status.isActive() && !this.isExpired;
  }

  // Business methods
  public recordUsage(
    requestCount: number = 1,
    responseTime: number,
    wasError: boolean = false
  ): void {
    if (!this.isActive) {
      throw new Error('Cannot record usage for inactive or expired API key');
    }

    const now = new Date();
    this._lastUsedAt = now;

    // Update usage stats
    const newTotalRequests = this._usageStats.totalRequests + requestCount;
    const newAverageResponseTime = (
      (this._usageStats.averageResponseTime * this._usageStats.totalRequests) + 
      (responseTime * requestCount)
    ) / newTotalRequests;

    const newErrorCount = wasError ? 1 : 0;
    const newErrorRate = ((this._usageStats.errorRate * this._usageStats.totalRequests) + newErrorCount) / newTotalRequests;

    this._usageStats = {
      ...this._usageStats,
      totalRequests: newTotalRequests,
      requestsToday: this._usageStats.requestsToday + requestCount,
      requestsThisMonth: this._usageStats.requestsThisMonth + requestCount,
      lastUsedAt: now,
      averageResponseTime: newAverageResponseTime,
      errorRate: newErrorRate
    };

    this.updatedAt = now;

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeyUsageRecorded',
      aggregateId: this.id,
      aggregateVersion: this.version,
      requestCount,
      responseTime,
      wasError,
      totalRequests: newTotalRequests,
      usedAt: now
    } as ApiKeyUsageRecordedEvent);
  }

  public updatePermissions(
    newPermissions: ApiKeyPermissions,
    updatedBy: string,
    reason: string
  ): void {
    if (!this._status.isActive()) {
      throw new Error('Cannot update permissions for inactive API key');
    }

    const oldPermissions = this._permissions;
    this._permissions = newPermissions;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeyPermissionsUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      oldPermissions,
      newPermissions,
      updatedBy,
      reason,
      updatedAt: this.updatedAt
    } as ApiKeyPermissionsUpdatedEvent);
  }

  public rotate(newKeyHash: string, newKeyPrefix: string, rotatedBy: string): void {
    if (!this._status.isActive()) {
      throw new Error('Cannot rotate inactive API key');
    }

    // Store old key hash in rotation history
    this._rotationHistory.push(this._keyHash);
    
    // Update to new key
    this._keyHash = newKeyHash;
    this._keyPrefix = newKeyPrefix;
    this.updatedAt = new Date();

    // Reset usage stats for new key
    this._usageStats = {
      totalRequests: 0,
      requestsToday: 0,
      requestsThisMonth: 0,
      averageResponseTime: 0,
      errorRate: 0
    };

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeyRotated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      newKeyPrefix,
      rotatedBy,
      rotatedAt: this.updatedAt,
      rotationCount: this._rotationHistory.length
    } as ApiKeyRotatedEvent);
  }

  public suspend(suspendedBy: string, reason: string): void {
    if (!this._status.isActive()) {
      throw new Error('API key is not active');
    }

    this._status = APIKeyStatus.suspended();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeySuspended',
      aggregateId: this.id,
      aggregateVersion: this.version,
      suspendedBy,
      reason,
      suspendedAt: this.updatedAt
    } as ApiKeySuspendedEvent);
  }

  public reactivate(reactivatedBy: string): void {
    if (!this._status.isSuspended()) {
      throw new Error('API key is not suspended');
    }

    if (this.isExpired) {
      throw new Error('Cannot reactivate expired API key');
    }

    this._status = APIKeyStatus.active();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeyReactivated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      reactivatedBy,
      reactivatedAt: this.updatedAt
    } as ApiKeyReactivatedEvent);
  }

  public revoke(revokedBy: string, reason: string): void {
    if (this._status.isRevoked()) {
      throw new Error('API key is already revoked');
    }

    this._status = APIKeyStatus.revoked();
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeyRevoked',
      aggregateId: this.id,
      aggregateVersion: this.version,
      revokedBy,
      reason,
      revokedAt: this.updatedAt
    } as ApiKeyRevokedEvent);
  }

  public updateExpiration(newExpiresAt: Date, updatedBy: string): void {
    if (!this._status.isActive()) {
      throw new Error('Cannot update expiration for inactive API key');
    }

    if (newExpiresAt <= new Date()) {
      throw new Error('Expiration date must be in the future');
    }

    const oldExpiresAt = this._expiresAt;
    this._expiresAt = newExpiresAt;
    this.updatedAt = new Date();

    this.addDomainEvent({
      id: crypto.randomUUID(),
      occurredAt: new Date(),
      eventType: 'ApiKeyExpirationUpdated',
      aggregateId: this.id,
      aggregateVersion: this.version,
      oldExpiresAt,
      newExpiresAt,
      updatedBy,
      updatedAt: this.updatedAt
    } as ApiKeyExpirationUpdatedEvent);
  }

  public checkRateLimit(requestsInWindow: number): boolean {
    return requestsInWindow <= this._permissions.rateLimit;
  }

  public hasScope(requiredScope: string): boolean {
    return this._permissions.scopes.includes(requiredScope) || this._permissions.scopes.includes('*');
  }

  public isIPAllowed(ipAddress: string): boolean {
    if (!this._permissions.allowedIPs || this._permissions.allowedIPs.length === 0) {
      return true; // No IP restrictions
    }
    return this._permissions.allowedIPs.includes(ipAddress);
  }

  public isDomainAllowed(domain: string): boolean {
    if (!this._permissions.allowedDomains || this._permissions.allowedDomains.length === 0) {
      return true; // No domain restrictions
    }
    return this._permissions.allowedDomains.some(allowedDomain => 
      domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    );
  }

  // Event sourcing
  protected when(event: DomainEvent): void {
    switch (event.eventType) {
      case 'ApiKeyCreated':
        this.applyApiKeyCreated(event as ApiKeyCreatedEvent);
        break;
      case 'ApiKeyUsageRecorded':
        this.applyApiKeyUsageRecorded(event as ApiKeyUsageRecordedEvent);
        break;
      case 'ApiKeyPermissionsUpdated':
        this.applyApiKeyPermissionsUpdated(event as ApiKeyPermissionsUpdatedEvent);
        break;
      case 'ApiKeyRotated':
        this.applyApiKeyRotated(event as ApiKeyRotatedEvent);
        break;
      case 'ApiKeySuspended':
        this.applyApiKeySuspended(event as ApiKeySuspendedEvent);
        break;
      case 'ApiKeyReactivated':
        this.applyApiKeyReactivated(event as ApiKeyReactivatedEvent);
        break;
      case 'ApiKeyRevoked':
        this.applyApiKeyRevoked(event as ApiKeyRevokedEvent);
        break;
      case 'ApiKeyExpirationUpdated':
        this.applyApiKeyExpirationUpdated(event as ApiKeyExpirationUpdatedEvent);
        break;
    }
  }

  private applyApiKeyCreated(event: ApiKeyCreatedEvent): void {
    this._name = event.name;
    this._keyPrefix = event.keyPrefix;
    this._organizationId = event.organizationId;
    this._developerId = event.developerId;
    this._permissions = event.permissions;
    this._environment = event.environment;
    this._expiresAt = event.expiresAt;
    this._webhookUrl = event.webhookUrl;
    this._status = APIKeyStatus.active();
  }

  private applyApiKeyUsageRecorded(event: ApiKeyUsageRecordedEvent): void {
    this._lastUsedAt = event.usedAt;
    // Usage stats would be updated in the actual implementation
  }

  private applyApiKeyPermissionsUpdated(event: ApiKeyPermissionsUpdatedEvent): void {
    this._permissions = event.newPermissions;
  }

  private applyApiKeyRotated(event: ApiKeyRotatedEvent): void {
    this._keyPrefix = event.newKeyPrefix;
    // Key hash would be updated in actual implementation
  }

  private applyApiKeySuspended(event: ApiKeySuspendedEvent): void {
    this._status = APIKeyStatus.suspended();
  }

  private applyApiKeyReactivated(event: ApiKeyReactivatedEvent): void {
    this._status = APIKeyStatus.active();
  }

  private applyApiKeyRevoked(event: ApiKeyRevokedEvent): void {
    this._status = APIKeyStatus.revoked();
  }

  private applyApiKeyExpirationUpdated(event: ApiKeyExpirationUpdatedEvent): void {
    this._expiresAt = event.newExpiresAt;
  }
}

// Domain Events
export interface ApiKeyCreatedEvent extends DomainEvent {
  eventType: 'ApiKeyCreated';
  name: string;
  keyPrefix: string;
  organizationId: string;
  developerId: string;
  permissions: ApiKeyPermissions;
  environment: 'development' | 'staging' | 'production';
  expiresAt?: Date;
  webhookUrl?: string;
}

export interface ApiKeyUsageRecordedEvent extends DomainEvent {
  eventType: 'ApiKeyUsageRecorded';
  requestCount: number;
  responseTime: number;
  wasError: boolean;
  totalRequests: number;
  usedAt: Date;
}

export interface ApiKeyPermissionsUpdatedEvent extends DomainEvent {
  eventType: 'ApiKeyPermissionsUpdated';
  oldPermissions: ApiKeyPermissions;
  newPermissions: ApiKeyPermissions;
  updatedBy: string;
  reason: string;
  updatedAt: Date;
}

export interface ApiKeyRotatedEvent extends DomainEvent {
  eventType: 'ApiKeyRotated';
  newKeyPrefix: string;
  rotatedBy: string;
  rotatedAt: Date;
  rotationCount: number;
}

export interface ApiKeySuspendedEvent extends DomainEvent {
  eventType: 'ApiKeySuspended';
  suspendedBy: string;
  reason: string;
  suspendedAt: Date;
}

export interface ApiKeyReactivatedEvent extends DomainEvent {
  eventType: 'ApiKeyReactivated';
  reactivatedBy: string;
  reactivatedAt: Date;
}

export interface ApiKeyRevokedEvent extends DomainEvent {
  eventType: 'ApiKeyRevoked';
  revokedBy: string;
  reason: string;
  revokedAt: Date;
}

export interface ApiKeyExpirationUpdatedEvent extends DomainEvent {
  eventType: 'ApiKeyExpirationUpdated';
  oldExpiresAt?: Date;
  newExpiresAt: Date;
  updatedBy: string;
  updatedAt: Date;
}
