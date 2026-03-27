// Query service for managing async data fetching with caching
import { Injectable, signal, computed } from '@angular/core';
import { CacheService } from './cache.service';

export interface QueryState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: number | null;
}

export interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  retry?: number;
  retryDelay?: number;
  enabled?: boolean;
}

export interface QueryKey {
  resource: string;
  id?: string | number;
  params?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class QueryService {
  private readonly queries = new Map<string, QueryState<unknown>>();
  private readonly pendingQueries = new Map<string, Promise<unknown>>();

  // Signal-based state
  private readonly activeQueries = signal<Set<string>>(new Set());

  // Public readonly signals
  readonly activeQueries$ = this.activeQueries.asReadonly();

  // Computed signals
  readonly isLoading = computed(() => this.activeQueries().size > 0);
  readonly queryCount = computed(() => this.activeQueries().size);

  constructor(private cache: CacheService) {}

  /**
   * Create a query key string
   */
  createKey(key: QueryKey): string {
    const parts = [key.resource];
    if (key.id) parts.push(String(key.id));
    if (key.params) parts.push(JSON.stringify(key.params));
    return parts.join(':');
  }

  /**
   * Fetch data with automatic caching and deduplication
   */
  async query<T>(
    key: QueryKey,
    fetcher: () => Promise<T>,
    options?: QueryOptions
  ): Promise<QueryState<T>> {
    const queryKey = this.createKey(key);
    const staleTime = options?.staleTime ?? 5 * 60 * 1000; // 5 minutes
    const cacheTime = options?.cacheTime ?? 30 * 60 * 1000; // 30 minutes
    const enabled = options?.enabled ?? true;

    // Check if query is disabled
    if (!enabled) {
      return this.getEmptyState();
    }

    // Check for pending query (deduplication)
    const pending = this.pendingQueries.get(queryKey) as Promise<T> | undefined;
    if (pending) {
      return pending.then(data => this.getState(queryKey, data, null, false));
    }

    // Check cache
    const cached = this.cache.get<T>(queryKey);
    const queryState = this.queries.get(queryKey) as QueryState<T> | undefined;

    if (cached && queryState) {
      const isStale = Date.now() - (queryState.lastUpdated ?? 0) > staleTime;

      if (!isStale) {
        return { ...queryState, isStale: false };
      }

      // Return stale data while revalidating in background
      if (queryState.data) {
        this.revalidate(queryKey, fetcher, cacheTime);
        return { ...queryState, isStale: true };
      }
    }

    // Execute fetch
    return this.executeFetch(queryKey, fetcher, cacheTime, options?.retry ?? 3);
  }

  /**
   * Fetch data with automatic retries
   */
  private async executeFetch<T>(
    queryKey: string,
    fetcher: () => Promise<T>,
    cacheTime: number,
    maxRetries: number
  ): Promise<QueryState<T>> {
    this.activeQueries.update(set => {
      const newSet = new Set(set);
      newSet.add(queryKey);
      return newSet;
    });

    const fetchWithRetry = async (): Promise<T> => {
      let lastError: Error | null = null;

      for (let i = 0; i <= maxRetries; i++) {
        try {
          return await fetcher();
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (i < maxRetries) {
            await this.delay(1000 * Math.pow(2, i)); // Exponential backoff
          }
        }
      }

      throw lastError;
    };

    const promise = fetchWithRetry()
      .then(data => {
        this.cache.set(queryKey, data, { ttl: cacheTime });
        this.updateQuery(queryKey, { data, error: null, isLoading: false, lastUpdated: Date.now() });
        return data;
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.updateQuery(queryKey, { data: null, error: errorMessage, isLoading: false });
        throw error;
      })
      .finally(() => {
        this.activeQueries.update(set => {
          const newSet = new Set(set);
          newSet.delete(queryKey);
          return newSet;
        });
        this.pendingQueries.delete(queryKey);
      });

    this.pendingQueries.set(queryKey, promise);
    this.updateQuery(queryKey, { isLoading: true });

    try {
      const data = await promise;
      return this.getState(queryKey, data, null, false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.getState<T>(queryKey, null as T | null, errorMessage, false);
    }
  }

  /**
   * Revalidate data in background
   */
  private async revalidate<T>(
    queryKey: string,
    fetcher: () => Promise<T>,
    cacheTime: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      this.cache.set(queryKey, data, { ttl: cacheTime });
      this.updateQuery(queryKey, { data, error: null, isStale: false, lastUpdated: Date.now() });
    } catch {
      // Silently fail for background revalidation
    }
  }

  /**
   * Prefetch data for future use
   */
  async prefetch<T>(
    key: QueryKey,
    fetcher: () => Promise<T>,
    options?: QueryOptions
  ): Promise<void> {
    const queryKey = this.createKey(key);
    const cacheTime = options?.cacheTime ?? 30 * 60 * 1000;

    // Don't prefetch if we have fresh data
    const cached = this.cache.get(queryKey);
    if (cached) return;

    try {
      await this.executeFetch(queryKey, fetcher, cacheTime, options?.retry ?? 1);
    } catch {
      // Silently fail for prefetch
    }
  }

  /**
   * Invalidate query and refetch
   */
  async invalidate(key: QueryKey, fetcher: () => Promise<unknown>): Promise<void> {
    const queryKey = this.createKey(key);
    this.cache.delete(queryKey);
    this.queries.delete(queryKey);
    await fetcher();
  }

  /**
   * Cancel pending query
   */
  cancel(key: QueryKey): void {
    const queryKey = this.createKey(key);
    this.pendingQueries.delete(queryKey);
    this.activeQueries.update(set => {
      const newSet = new Set(set);
      newSet.delete(queryKey);
      return newSet;
    });
  }

  /**
   * Get query state
   */
  getState<T>(key: string, data: T | null, error: string | null, isLoading: boolean): QueryState<T> {
    const existing = this.queries.get(key) as QueryState<T> | undefined;
    const lastUpdated = existing?.lastUpdated ?? null;
    const staleTime = 5 * 60 * 1000;
    const isStale = lastUpdated ? Date.now() - lastUpdated > staleTime : false;

    return {
      data: data ?? existing?.data ?? null,
      error: error ?? existing?.error ?? null,
      isLoading,
      isStale: existing?.isStale ?? isStale,
      lastUpdated,
    };
  }

  private getEmptyState<T>(): QueryState<T> {
    return {
      data: null,
      error: null,
      isLoading: false,
      isStale: false,
      lastUpdated: null,
    };
  }

  private updateQuery<T>(key: string, updates: Partial<QueryState<T>>): void {
    const existing = this.queries.get(key) as QueryState<T> | undefined;
    this.queries.set(key, {
      data: null,
      error: null,
      isLoading: false,
      isStale: false,
      lastUpdated: null,
      ...existing,
      ...updates,
    } as QueryState<T>);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all queries
   */
  clear(): void {
    this.queries.clear();
    this.pendingQueries.clear();
    this.activeQueries.set(new Set());
  }
}
