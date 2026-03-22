// Utility service for rate limiting and task management
import { Injectable, signal, computed } from '@angular/core';

export interface TaskOptions {
  id?: string;
  priority?: number;
}

export interface DebounceOptions {
  leading?: boolean;
  trailing?: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  // Signal-based task tracking
  private readonly pendingTasks = signal<Map<string, number>>(new Map());
  private readonly activeCount = signal(0);

  // Public readonly signals
  readonly pendingTasks$ = this.pendingTasks.asReadonly();
  readonly activeCount$ = this.activeCount.asReadonly();

  // Computed signals
  readonly hasPendingTasks = computed(() => this.activeCount() > 0);
  readonly isEmpty = computed(() => this.activeCount() === 0);

  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private rafIds = new Map<string, number>();

  /**
   * Debounce a function
   */
  debounce<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delayMs: number,
    options?: DebounceOptions
  ): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const leading = options?.leading ?? false;
    const trailing = options?.trailing ?? true;

    return (...args: Parameters<T>) => {
      const callNow = leading && !timeoutId;

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (callNow) {
        fn(...args);
      }

      if (trailing) {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          if (!leading) fn(...args);
        }, delayMs);
      }
    };
  }

  /**
   * Throttle a function
   */
  throttle<T extends (...args: unknown[]) => unknown>(
    fn: T,
    limitMs: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    let lastArgs: Parameters<T> | null = null;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        lastArgs = null;

        timeoutId = setTimeout(() => {
          inThrottle = false;
          timeoutId = null;
          if (lastArgs) {
            fn(...lastArgs);
            lastArgs = null;
          }
        }, limitMs);
      } else {
        lastArgs = args;
      }
    };
  }

  /**
   * Create a debounced function with task tracking
   */
  debouncedTask<T extends (...args: unknown[]) => unknown>(
    fn: T,
    delayMs: number,
    taskId: string
  ): (...args: Parameters<T>) => void {
    return this.debounce((...args: unknown[]) => {
      this.executeTask(taskId, () => fn(...args));
    }, delayMs);
  }

  /**
   * Execute a task with tracking
   */
  executeTask<T>(taskId: string, fn: () => T): T {
    this.activeCount.update(count => count + 1);
    this.pendingTasks.update(tasks => {
      const newTasks = new Map(tasks);
      newTasks.set(taskId, (newTasks.get(taskId) || 0) + 1);
      return newTasks;
    });

    try {
      return fn();
    } finally {
      this.completeTask(taskId);
    }
  }

  /**
   * Schedule a task with requestAnimationFrame
   */
  scheduleRaf(taskId: string, callback: (timestamp: number) => void): void {
    const rafId = requestAnimationFrame((timestamp) => {
      this.executeTask(taskId, () => callback(timestamp));
      this.rafIds.delete(taskId);
    });
    this.rafIds.set(taskId, rafId);
  }

  /**
   * Cancel a scheduled RAF task
   */
  cancelRaf(taskId: string): void {
    const rafId = this.rafIds.get(taskId);
    if (rafId !== undefined) {
      cancelAnimationFrame(rafId);
      this.rafIds.delete(taskId);
    }
  }

  /**
   * Cancel a debounced function
   */
  cancelDebounce(fn: (...args: unknown[]) => void): void {
    // This is a simplified version - in real usage you'd track the timeout
  }

  /**
   * Wait for a delay with abort support
   */
  async delay(ms: number, abortSignal?: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(resolve, ms);

      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Aborted'));
        });
      }
    });
  }

  /**
   * Create a retryable function
   */
  retry<T>(
    fn: () => Promise<T>,
    options?: {
      maxRetries?: number;
      delayMs?: number;
      backoff?: number;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 3;
    const delayMs = options?.delayMs ?? 1000;
    const backoff = options?.backoff ?? 2;

    const attempt = async (retryCount: number): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        if (retryCount >= maxRetries) {
          throw error;
        }
        const delayTime = delayMs * Math.pow(backoff, retryCount);
        await this.delay(delayTime);
        return attempt(retryCount + 1);
      }
    };

    return attempt(0);
  }

  /**
   * Run tasks in parallel with concurrency limit
   */
  async parallel<T>(
    tasks: Array<() => Promise<T>>,
    concurrency: number
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<T>[] = [];

    for (const task of tasks) {
      const promise = task().then(result => {
        results.push(result);
        const index = executing.indexOf(promise);
        if (index > -1) executing.splice(index, 1);
        return result;
      });

      executing.push(promise);

      if (executing.length >= concurrency) {
        await Promise.race(executing);
      }
    }

    await Promise.all(executing);
    return results;
  }

  /**
   * Run tasks in sequence
   */
  async sequence<T>(tasks: Array<() => Promise<T>>): Promise<T[]> {
    const results: T[] = [];
    for (const task of tasks) {
      results.push(await task());
    }
    return results;
  }

  private completeTask(taskId: string): void {
    this.activeCount.update(count => Math.max(0, count - 1));
    this.pendingTasks.update(tasks => {
      const newTasks = new Map(tasks);
      const count = newTasks.get(taskId) || 0;
      if (count <= 1) {
        newTasks.delete(taskId);
      } else {
        newTasks.set(taskId, count - 1);
      }
      return newTasks;
    });
  }

  /**
   * Clear all pending tasks
   */
  clearAll(): void {
    this.timers.forEach(id => clearTimeout(id));
    this.rafIds.forEach(id => cancelAnimationFrame(id));
    this.timers.clear();
    this.rafIds.clear();
    this.pendingTasks.set(new Map());
    this.activeCount.set(0);
  }

  ngOnDestroy(): void {
    this.clearAll();
  }
}
