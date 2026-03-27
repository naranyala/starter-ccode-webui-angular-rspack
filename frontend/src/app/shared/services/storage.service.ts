import { computed, Injectable, signal } from '@angular/core';

/**
 * Storage Service
 * Provides reactive localStorage and sessionStorage management
 */
@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private storageSignals = new Map<string, any>();

  /**
   * Get item from localStorage
   */
  getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch {
      return defaultValue ?? null;
    }
  }

  /**
   * Set item in localStorage
   */
  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      this.notifySignal(key, value);
    } catch (error) {
      console.error('[StorageService] Error setting item:', error);
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
      this.notifySignal(key, null);
    } catch (error) {
      console.error('[StorageService] Error removing item:', error);
    }
  }

  /**
   * Clear all localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
      this.storageSignals.forEach((_, key) => this.notifySignal(key, null));
    } catch (error) {
      console.error('[StorageService] Error clearing storage:', error);
    }
  }

  /**
   * Get reactive signal for storage key
   * Automatically updates when storage changes
   */
  watch<T>(key: string, defaultValue?: T) {
    if (!this.storageSignals.has(key)) {
      let initialValue: T | null;
      if (defaultValue !== undefined) {
        initialValue = defaultValue;
      } else {
        const stored = localStorage.getItem(key);
        initialValue = stored ? (JSON.parse(stored) as T) : null;
      }
      const sig = signal<T | null>(initialValue);
      this.storageSignals.set(key, sig);
    }
    return this.storageSignals.get(key)! as { (): T | null; readonly: T | null };
  }

  /**
   * Get item from sessionStorage
   */
  getSessionItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) {
        return defaultValue ?? null;
      }
      return JSON.parse(item) as T;
    } catch {
      return defaultValue ?? null;
    }
  }

  /**
   * Set item in sessionStorage
   */
  setSessionItem<T>(key: string, value: T): void {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('[StorageService] Error setting session item:', error);
    }
  }

  /**
   * Remove item from sessionStorage
   */
  removeSessionItem(key: string): void {
    try {
      sessionStorage.removeItem(key);
    } catch (error) {
      console.error('[StorageService] Error removing session item:', error);
    }
  }

  /**
   * Check if key exists in localStorage
   */
  has(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Get all keys from localStorage
   */
  keys(): string[] {
    return Object.keys(localStorage);
  }

  /**
   * Get storage usage information (if available)
   */
  async getUsage(): Promise<{ usage: number; quota: number } | null> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      } catch {
        return null;
      }
    }
    return null;
  }

  private notifySignal(key: string, value: any): void {
    const sig = this.storageSignals.get(key);
    if (sig) {
      sig.set(value);
    }
  }
}

/**
 * Hook-like function to use storage in components
 * Usage: const [theme, setTheme] = useStorage('theme', 'light');
 */
export function useStorage<T>(
  storage: StorageService,
  key: string,
  defaultValue: T
): [() => T | null, (value: T) => void] {
  const watch = storage.watch<T>(key, defaultValue);
  return [() => watch() ?? defaultValue, (value: T) => storage.setItem(key, value)];
}
