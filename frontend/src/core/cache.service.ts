// Cache service with LRU eviction and TTL support
import { Injectable, signal, computed, Optional, Inject, InjectionToken } from '@angular/core';

export interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  evictions: number;
}

export interface CacheOptions {
  maxSize?: number;
  defaultTtl?: number;
}

export const CACHE_OPTIONS = new InjectionToken<CacheOptions>('cache_options');

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly maxSize: number;
  private readonly defaultTtl?: number;

  // Signal-based state
  private readonly stats = signal<CacheStats>({
    size: 0,
    hits: 0,
    misses: 0,
    evictions: 0,
  });

  // Public readonly signals
  readonly stats$ = this.stats.asReadonly();

  // Computed signals
  readonly size = computed(() => this.stats().size);
  readonly hitRate = computed(() => {
    const s = this.stats();
    const total = s.hits + s.misses;
    return total > 0 ? (s.hits / total) * 100 : 0;
  });

  constructor(@Optional() @Inject(CACHE_OPTIONS) options?: CacheOptions) {
    this.maxSize = options?.maxSize ?? 100;
    this.defaultTtl = options?.defaultTtl;
  }

  /**
   * Get a value from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      this.updateStats({ misses: 1 });
      return null;
    }

    // Check TTL
    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      this.updateStats({ misses: 1 });
      return null;
    }

    // Update hit count
    entry.hits++;
    this.updateStats({ hits: 1 });
    return entry.value;
  }

  /**
   * Set a value in cache
   */
  set<T>(key: string, value: T, options?: { ttl?: number }): void {
    // Check if we need to evict
    if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: options?.ttl ?? this.defaultTtl,
      hits: 0,
    });

    this.updateStats({ size: this.cache.size });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (entry.ttl && Date.now() > entry.timestamp + entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete a key from cache
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.updateStats({ size: this.cache.size });
    }
    return deleted;
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.cache.clear();
    this.updateStats({ size: 0, hits: 0, misses: 0, evictions: 0 });
  }

  /**
   * Get or compute a value
   */
  getOrSet<T>(key: string, compute: () => T, options?: { ttl?: number }): T {
    const existing = this.get<T>(key);
    if (existing !== null) return existing;

    const value = compute();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get or compute async value
   */
  async getOrSetAsync<T>(
    key: string,
    compute: () => Promise<T>,
    options?: { ttl?: number }
  ): Promise<T> {
    const existing = this.get<T>(key);
    if (existing !== null) return existing;

    const value = await compute();
    this.set(key, value, options);
    return value;
  }

  /**
   * Get all keys
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values
   */
  values<T>(): T[] {
    return Array.from(this.cache.values()).map(e => e.value as T);
  }

  /**
   * Get entries sorted by hits (most popular first)
   */
  getPopular(limit?: number): Array<{ key: string; value: unknown; hits: number }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, value: entry.value, hits: entry.hits }))
      .sort((a, b) => b.hits - a.hits);

    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * Get entries sorted by age (oldest first)
   */
  getOldest(limit?: number): Array<{ key: string; value: unknown; age: number }> {
    const now = Date.now();
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, value: entry.value, age: now - entry.timestamp }))
      .sort((a, b) => a.age - b.age);

    return limit ? entries.slice(0, limit) : entries;
  }

  /**
   * Remove expired entries
   */
  prune(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.ttl && now > entry.timestamp + entry.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.updateStats({ size: this.cache.size, evictions: removed });
    }

    return removed;
  }

  /**
   * Export cache to JSON
   */
  toJSON(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const [key, entry] of this.cache.entries()) {
      result[key] = entry.value;
    }
    return result;
  }

  /**
   * Import cache from JSON
   */
  fromJSON(data: Record<string, unknown>, options?: { ttl?: number }): void {
    for (const [key, value] of Object.entries(data)) {
      this.set(key, value, options);
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.updateStats({ evictions: 1, size: this.cache.size });
    }
  }

  private updateStats(updates: Partial<CacheStats>): void {
    this.stats.update(current => ({
      ...current,
      ...updates,
    }));
  }
}
