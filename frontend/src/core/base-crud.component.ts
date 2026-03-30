/**
 * Base CRUD Component
 * 
 * Abstract base class for all CRUD components providing:
 * - Common state management (loading, error, pagination)
 * - Standard CRUD operations
 * - Search and filtering
 * - Consistent error handling
 * 
 * @example
 * ```typescript
 * @Component({ ... })
 * export class UsersCrudComponent extends BaseCrudComponent<User, CreateUserDto, UpdateUserDto> {
 *   protected readonly entityName = 'User';
 *   protected readonly apiPrefix = 'crud_';
 *   
 *   protected mapApiData(data: any): User { return data; }
 * }
 * ```
 */
import { Directive, signal, computed, inject } from '@angular/core';
import { ApiService } from './api.service';
import { NotificationService } from './notification.service';
import { LoggerService } from './logger.service';

/**
 * Pagination state
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * CRUD operations interface
 */
export interface CrudOperations<TCreate, TUpdate, TStats> {
  create(data: TCreate): Promise<unknown>;
  update(data: TUpdate): Promise<unknown>;
  delete(id: number): Promise<unknown>;
  getList(params?: unknown): Promise<unknown>;
  getStats?(): Promise<TStats>;
}

/**
 * Base CRUD component state
 */
export interface BaseCrudState<T, TStats> {
  items: T[];
  stats: TStats | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  selectedId: number | null;
}

@Directive()
export abstract class BaseCrudComponent<
  TEntity extends { id: number },
  TCreate extends Record<string, unknown>,
  TUpdate extends { id: number } & Record<string, unknown>,
  TStats = unknown
> {
  protected readonly api = inject(ApiService);
  protected readonly notification = inject(NotificationService);
  protected readonly logger = inject(LoggerService);

  /** Entity name for messages (override in subclass) */
  protected abstract readonly entityName: string;
  
  /** API function prefix (e.g., 'crud_') */
  protected abstract readonly apiPrefix: string;

  // State signals
  protected readonly items = signal<TEntity[]>([]);
  protected readonly stats = signal<TStats | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly searchQuery = signal('');
  protected readonly selectedId = signal<number | null>(null);
  
  // Pagination
  protected readonly currentPage = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly totalItems = signal(0);

  // Computed
  protected readonly totalPages = computed(() => 
    Math.ceil(this.totalItems() / this.pageSize())
  );

  protected readonly hasItems = computed(() => this.items().length > 0);
  
  protected readonly hasError = computed(() => this.error() !== null);
  
  protected readonly selectedItem = computed(() => {
    const id = this.selectedId();
    if (id === null) return null;
    return this.items().find(item => item.id === id) || null;
  });

  /**
   * Map API response data to entity
   * Override in subclass to transform API data
   */
  protected abstract mapApiData(data: unknown): TEntity;

  /**
   * Initialize component
   */
  async ngOnInit(): Promise<void> {
    await this.loadItems();
    await this.loadStats();
  }

  /**
   * Load items from API
   */
  async loadItems(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const methodName = `${this.apiPrefix}get_${this.getEntityNamePlural()}`;
      const result = await this.api.call(methodName, [{
        search: this.searchQuery() || undefined,
        page: this.currentPage(),
        pageSize: this.pageSize()
      }]);

      if (result.success && result.data) {
        const data = result.data as { items?: TEntity[]; [key: string]: unknown };
        const items = (data.items || []).map(item => this.mapApiData(item));
        this.items.set(items);
        this.totalItems.set((data.total as number) || items.length);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.error.set(message);
      this.logger.error(`Failed to load ${this.getEntityNamePlural()}`, err);
      this.notification.error(`Failed to load ${this.getEntityNamePlural()}`);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Load statistics from API
   */
  async loadStats(): Promise<void> {
    try {
      const methodName = `${this.apiPrefix}get_${this.getEntityNamePlural()}_stats`;
      const result = await this.api.call(methodName, []);
      
      if (result.success && result.data) {
        this.stats.set(result.data as TStats);
      }
    } catch (err) {
      // Stats are optional, just log the error
      this.logger.debug(`Stats not available for ${this.entityName}`);
    }
  }

  /**
   * Create new entity
   */
  async create(data: TCreate): Promise<TEntity | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const methodName = `${this.apiPrefix}create_${this.getEntityNameSingular()}`;
      const result = await this.api.call(methodName, [data]);

      if (result.success && result.data) {
        const entity = this.mapApiData(result.data);
        this.notification.success(`${this.entityName} created successfully`);
        await this.loadItems();
        await this.loadStats();
        return entity;
      } else {
        throw new Error(result.error || 'Create failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Create failed';
      this.error.set(message);
      this.logger.error(`Failed to create ${this.entityName}`, err);
      this.notification.error(`Failed to create ${this.entityName}`);
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Update existing entity
   */
  async update(data: TUpdate): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const methodName = `${this.apiPrefix}update_${this.getEntityNameSingular()}`;
      const result = await this.api.call(methodName, [data]);

      if (result.success) {
        this.notification.success(`${this.entityName} updated successfully`);
        await this.loadItems();
        return true;
      } else {
        throw new Error(result.error || 'Update failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update failed';
      this.error.set(message);
      this.logger.error(`Failed to update ${this.entityName}`, err);
      this.notification.error(`Failed to update ${this.entityName}`);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete entity
   */
  async delete(id: number): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const methodName = `${this.apiPrefix}delete_${this.getEntityNameSingular()}`;
      const result = await this.api.call(methodName, [{ id }]);

      if (result.success) {
        this.notification.success(`${this.entityName} deleted successfully`);
        await this.loadItems();
        await this.loadStats();
        return true;
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Delete failed';
      this.error.set(message);
      this.logger.error(`Failed to delete ${this.entityName}`, err);
      this.notification.error(`Failed to delete ${this.entityName}`);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Handle search input
   */
  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.currentPage.set(1);
    this.loadItems();
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage.set(page);
    this.loadItems();
  }

  /**
   * Select item
   */
  selectItem(id: number | null): void {
    this.selectedId.set(id);
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }

  /**
   * Refresh data
   */
  async refresh(): Promise<void> {
    await Promise.all([this.loadItems(), this.loadStats()]);
  }

  /**
   * Get entity name in singular form
   */
  protected getEntityNameSingular(): string {
    return this.entityName.toLowerCase();
  }

  /**
   * Get entity name in plural form
   */
  protected getEntityNamePlural(): string {
    return `${this.getEntityNameSingular()}s`;
  }

  /**
   * Format date for display
   */
  protected formatDate(dateStr: string, format: 'short' | 'long' = 'short'): string {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = format === 'short' 
      ? { year: 'numeric', month: 'short', day: 'numeric' }
      : { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Get initials from name
   */
  protected getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
