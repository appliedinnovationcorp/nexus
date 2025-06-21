// Logger Adapters

import { Logger } from '@nexus/application-core';

export class ConsoleLogger implements Logger {
  info(message: string, meta?: Record<string, any>): void {
    console.log(`ℹ️  [INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: Record<string, any>): void {
    console.warn(`⚠️  [WARN] ${message}`, meta || '');
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    console.error(`❌ [ERROR] ${message}`, error?.message || '', meta || '');
    if (error?.stack) {
      console.error(error.stack);
    }
  }

  debug(message: string, meta?: Record<string, any>): void {
    console.debug(`🐛 [DEBUG] ${message}`, meta || '');
  }
}

export class WinstonLogger implements Logger {
  constructor(private readonly level: string = 'info') {}

  info(message: string, meta?: Record<string, any>): void {
    // TODO: Implement with Winston
    console.log(`Winston [INFO] ${message}`, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    // TODO: Implement with Winston
    console.warn(`Winston [WARN] ${message}`, meta);
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    // TODO: Implement with Winston
    console.error(`Winston [ERROR] ${message}`, error, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    // TODO: Implement with Winston
    console.debug(`Winston [DEBUG] ${message}`, meta);
  }
}
