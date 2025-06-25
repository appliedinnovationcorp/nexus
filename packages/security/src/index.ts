/**
 * @nexus/security
 * 
 * Comprehensive security package with OPA policies, Vault integration, scanning, and compliance tools
 */

export * from './auth';
export * from './policies';
export * from './vault';
export * from './scanning';
export * from './compliance';
export * from './encryption';
export * from './middleware';
export * from './validators';
export * from './types';
export * from './utils';

// Default exports
export { SecurityManager } from './manager';
export { PolicyEngine } from './policies';
export { VaultClient } from './vault';
export { SecurityScanner } from './scanning';

// Re-export commonly used types
export type {
  SecurityConfig,
  Policy,
  AuthToken,
  EncryptionKey,
  ScanResult,
  ComplianceReport
} from './types';
