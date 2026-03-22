# CacheService

LRU (Least Recently Used) cache service with TTL support and automatic eviction.

## Overview

CacheService provides in-memory caching with:

- LRU eviction when max size is reached
- Time-to-live (TTL) for cache entries
- Hit/miss tracking and statistics
- Export/import functionality
- Signal-based state management

## API Reference

### Configuration

```typescript
interface CacheOptions {
  maxSize?: number;      // Default: 100
  defaultTtl?: number;   // Default: undefined (no expiration)
}
```

### Basic Operations

```typescript
// Get a value
get<T>(key: string): T | null

// Set a value with optional TTL
set<T>(key: string, value: T, options?: { ttl?: number }): void

// Check if key exists (and is valid)
has(key: string): boolean

// Delete a key
delete(key: string): boolean

// Clear all entries
clear(): void
```

### Advanced Operations

```typescript
// Get or compute synchronously
getOrSet<T>(key: string, compute: () => T, options?: { ttl?: number }): T

// Get or compute asynchronously
getOrSetAsync<T>(key: string, compute: () => Promise<T>, options?: { ttl?: number }): Promise<T>

// Remove expired entries
prune(): number

// Get popular items (by hit count)
getPopular(limit?: number): Array<{ key: string; value: unknown; hits: number }>

// Get oldest items
getOldest(limit?: number): Array<{ key: string; value: unknown; age: number }>

// Export to JSON
toJSON(): Record<string, unknown>

// Import from JSON
fromJSON(data: Record<string, unknown>, options?: { ttl?: number }): void
```

### Signals

```typescript
// Cache statistics
readonly stats$: ReadonlySignal<CacheStats>

// Computed values
readonly size: ReadonlySignal<number>
readonly hitRate: ReadonlySignal<number>  // Percentage
```

## Usage

### Basic Caching

```typescript
constructor(private cache: CacheService) {}

// Set a value
cache.set('user:1', userData);

// Get a value
const user = cache.get<User>('user:1');

// Set with TTL (5 minutes)
cache.set('session:abc', sessionData, { ttl: 300000 });
```

### Get or Compute

```typescript
// Synchronous
const data = cache.getOrSet('expensive:data', () => {
  return computeExpensiveValue();
}, { ttl: 60000 });

// Asynchronous
const userData = await cache.getOrSetAsync(
  `user:${id}`,
  () => api.getUser(id),
  { ttl: 300000 }
);
```

### Cache Statistics

```typescript
// Monitor cache performance
effect(() => {
  const stats = cache.stats();
  console.log(`Size: ${stats.size}, Hits: ${stats.hits}, Misses: ${stats.misses}`);
});

// Check hit rate
const hitRate = cache.hitRate();  // 0-100
```

### Pruning and Maintenance

```typescript
// Remove expired entries
const removed = cache.prune();
console.log(`Removed ${removed} expired entries`);

// Get oldest entries for analysis
const oldest = cache.getOldest(10);
oldest.forEach(item => {
  console.log(`${item.key}: ${item.age}ms old`);
});
```

### Export/Import

```typescript
// Export cache state
const exported = cache.toJSON();
localStorage.setItem('cache', JSON.stringify(exported));

// Import cache state
const imported = JSON.parse(localStorage.getItem('cache') || '{}');
cache.fromJSON(imported, { ttl: 300000 });
```

## Configuration

### Global Configuration

Provide custom options at application level:

```typescript
// In app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideCacheService({ maxSize: 500, defaultTtl: 600000 })
  ]
};
```

### Per-Entry Configuration

```typescript
// Override default TTL for specific entries
cache.set('critical:data', data, { ttl: 60000 });  // 1 minute
cache.set('stable:data', data, { ttl: 3600000 });  // 1 hour
```

## Best Practices

### 1. Use Meaningful Keys

```typescript
// Good
cache.set(`user:${userId}:profile`, profileData);
cache.set(`posts:${postId}:comments`, comments);

// Bad
cache.set('data1', data1);
cache.set('data2', data2);
```

### 2. Set Appropriate TTLs

```typescript
// Short-lived data
cache.set('search:results', results, { ttl: 60000 });  // 1 minute

// Stable data
cache.set('config:app', config, { ttl: 3600000 });  // 1 hour

// User-specific data
cache.set(`user:${id}`, userData, { ttl: 300000 });  // 5 minutes
```

### 3. Monitor Cache Performance

```typescript
// Log cache statistics periodically
interval(60000).subscribe(() => {
  const stats = cache.stats();
  logger.info(`Cache: ${stats.size} items, ${stats.hitRate.toFixed(1)}% hit rate`);
});
```

## Related Services

- **QueryService** - Uses CacheService internally for query caching
- **StorageService** - For persistent storage (localStorage)

## Example: API Response Caching

```typescript
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly cacheTime = 300000; // 5 minutes

  constructor(
    private cache: CacheService,
    private api: ApiService
  ) {}

  async getUser(id: number): Promise<User> {
    const cacheKey = `user:${id}`;
    
    return this.cache.getOrSetAsync(
      cacheKey,
      () => this.api.callOrThrow<User>('get_user', [id]),
      { ttl: this.cacheTime }
    );
  }

  async invalidateUser(id: number): Promise<void> {
    this.cache.delete(`user:${id}`);
  }
}
```
