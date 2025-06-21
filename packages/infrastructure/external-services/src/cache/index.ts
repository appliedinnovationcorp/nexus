// Cache Service Adapters

import { CacheService } from '@nexus/application-core';

export class InMemoryCacheService implements CacheService {
  private cache: Map<string, { value: any; expiresAt?: number }> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const expiresAt = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : undefined;
    this.cache.set(key, { value, expiresAt });
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}

export class RedisCacheService implements CacheService {
  constructor(private readonly connectionString: string) {}

  async get<T>(key: string): Promise<T | null> {
    // TODO: Implement with Redis client
    console.log(`Redis: Getting key ${key}`);
    return null;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // TODO: Implement with Redis client
    console.log(`Redis: Setting key ${key} with TTL ${ttlSeconds}`);
  }

  async delete(key: string): Promise<void> {
    // TODO: Implement with Redis client
    console.log(`Redis: Deleting key ${key}`);
  }

  async clear(): Promise<void> {
    // TODO: Implement with Redis client
    console.log(`Redis: Clearing all keys`);
  }
}
