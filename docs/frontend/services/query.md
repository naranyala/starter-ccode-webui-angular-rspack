# QueryService

React Query-like data fetching service with automatic caching, deduplication, and background revalidation.

## Overview

QueryService provides sophisticated data fetching with:

- Automatic request deduplication
- Stale-while-revalidate caching
- Background revalidation
- Retry with exponential backoff
- Prefetching support
- Signal-based state management

## API Reference

### Query Key

```typescript
interface QueryKey {
  resource: string;
  id?: string | number;
  params?: Record<string, unknown>;
}
```

### Query Options

```typescript
interface QueryOptions {
  staleTime?: number;    // Time before data is considered stale (default: 5 min)
  cacheTime?: number;    // Time to keep unused data in cache (default: 30 min)
  retry?: number;        // Number of retries (default: 3)
  retryDelay?: number;   // Base delay for retries (default: 1000ms)
  enabled?: boolean;     // Enable/disable query (default: true)
}
```

### Query State

```typescript
interface QueryState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  isStale: boolean;
  lastUpdated: number | null;
}
```

### Methods

```typescript
// Fetch data with caching
query<T>(
  key: QueryKey,
  fetcher: () => Promise<T>,
  options?: QueryOptions
): Promise<QueryState<T>>

// Prefetch data for future use
prefetch<T>(
  key: QueryKey,
  fetcher: () => Promise<T>,
  options?: QueryOptions
): Promise<void>

// Invalidate and refetch
invalidate<T>(
  key: QueryKey,
  fetcher: () => Promise<T>
): Promise<void>

// Cancel pending query
cancel(key: QueryKey): void
```

### Signals

```typescript
// Active queries
readonly activeQueries$: ReadonlySignal<Set<string>>

// Computed values
readonly isLoading: ReadonlySignal<boolean>
readonly queryCount: ReadonlySignal<number>
```

## Usage

### Basic Query

```typescript
constructor(
  private query: QueryService,
  private api: ApiService
) {}

async loadUser() {
  const state = await this.query.query(
    { resource: 'users', id: 1 },
    () => this.api.callOrThrow<User>('get_user', [1]),
    { staleTime: 300000 }  // 5 minutes
  );
  
  console.log(state.data);
  console.log(state.isLoading);
  console.log(state.isStale);
}
```

### Component with Signals

```typescript
@Component({
  selector: 'app-user-list',
  template: `
    @if (queryState().isLoading) {
      <p>Loading...</p>
    } @else if (queryState().error) {
      <p>Error: {{ queryState().error }}</p>
    } @else {
      <ul>
        @for (user of users(); track user.id) {
          <li>{{ user.name }}</li>
        }
      </ul>
    }
  `
})
export class UserListComponent {
  private readonly queryState = signal<QueryState<User[]>>({
    data: null,
    error: null,
    isLoading: false,
    isStale: false,
    lastUpdated: null
  });

  readonly users = computed(() => this.queryState().data ?? []);
  readonly isLoading = computed(() => this.queryState().isLoading);
  readonly error = computed(() => this.queryState().error);

  constructor(
    private query: QueryService,
    private api: ApiService
  ) {
    this.loadUsers();
  }

  private async loadUsers() {
    const state = await this.query.query(
      { resource: 'users' },
      () => this.api.callOrThrow<User[]>('get_users')
    );
    this.queryState.set(state);
  }
}
```

### Prefetching

```typescript
// Prefetch data before user needs it
async ngOnInit() {
  // Prefetch user list in background
  this.query.prefetch(
    { resource: 'users' },
    () => this.api.callOrThrow<User[]>('get_users')
  );
}

// Use prefetched data (will be instant if prefetch completed)
async loadUser(id: number) {
  const state = await this.query.query(
    { resource: 'users', id },
    () => this.api.callOrThrow<User>('get_user', [id])
  );
}
```

### Retry Configuration

```typescript
const state = await this.query.query(
  { resource: 'posts', id: 1 },
  () => this.api.callOrThrow<Post>('get_post', [1]),
  {
    retry: 5,           // Retry 5 times
    retryDelay: 2000,   // Start with 2 second delay
    staleTime: 60000    // 1 minute stale time
  }
);
```

### Invalidate and Refetch

```typescript
async updateUser(id: number, data: Partial<User>) {
  // Update on server
  await this.api.call('update_user', [id, data]);
  
  // Invalidate cache to force refetch
  await this.query.invalidate(
    { resource: 'users', id },
    () => this.api.callOrThrow<User>('get_user', [id])
  );
}
```

### Cancel Query

```typescript
// Store query key for cancellation
private currentQueryKey = { resource: 'search', params: {} };

async search(query: string) {
  // Cancel previous search
  this.query.cancel(this.currentQueryKey);
  
  // Start new search
  this.currentQueryKey = { resource: 'search', params: { q: query } };
  
  const state = await this.query.query(
    this.currentQueryKey,
    () => this.api.callOrThrow<SearchResults>('search', [query])
  );
}
```

## Advanced Patterns

### Polling

```typescript
// Poll for updates every 30 seconds
constructor(private query: QueryService, private api: ApiService) {
  this.pollData();
}

private async pollData() {
  await this.query.query(
    { resource: 'status' },
    () => this.api.callOrThrow<Status>('get_status'),
    { staleTime: 30000 }
  );
  
  // Poll again after stale time
  setTimeout(() => this.pollData(), 30000);
}
```

### Dependent Queries

```typescript
async loadUserWithPosts(userId: number) {
  // First load user
  const userState = await this.query.query(
    { resource: 'users', id: userId },
    () => this.api.callOrThrow<User>('get_user', [userId])
  );
  
  if (userState.data) {
    // Then load posts (dependent on user)
    const postsState = await this.query.query(
      { resource: 'users', id: userId, params: { include: 'posts' } },
      () => this.api.callOrThrow<Post[]>('get_user_posts', [userId])
    );
  }
}
```

### Optimistic Updates

```typescript
async addPost(post: Post) {
  const queryKey = { resource: 'posts' };
  
  // Optimistically update cache
  const current = this.cache.get<Post[]>(queryKey);
  if (current) {
    this.cache.set(queryKey, [...current, post]);
  }
  
  try {
    // Try to save on server
    await this.api.call('create_post', [post]);
    
    // Invalidate to refetch fresh data
    await this.query.invalidate(queryKey, () => 
      this.api.callOrThrow<Post[]>('get_posts')
    );
  } catch (error) {
    // Revert on error
    if (current) {
      this.cache.set(queryKey, current);
    }
    throw error;
  }
}
```

## Best Practices

### 1. Use Specific Query Keys

```typescript
// Good - specific keys
query.query({ resource: 'users', id: 1 }, fetcher);
query.query({ resource: 'users', params: { page: 1 } }, fetcher);

// Bad - generic keys
query.query({ resource: 'data' }, fetcher);
```

### 2. Set Appropriate Stale Times

```typescript
// Frequently changing data
query.query({ resource: 'stock-prices' }, fetcher, { staleTime: 10000 });

// Stable data
query.query({ resource: 'user-profile' }, fetcher, { staleTime: 300000 });
```

### 3. Handle Loading States

```typescript
@Component({
  template: `
    @if (state().isLoading && !state().data) {
      <loading-spinner />
    }
    @if (state().data) {
      <data-view [data]="state().data" />
    }
    @if (state().error) {
      <error-message [error]="state().error" />
    }
  `
})
```

## Related Services

- **CacheService** - Used internally for query caching
- **ApiService** - Common fetcher for queries
- **TaskService** - For debouncing query triggers
