// Modern API service with signals for backend communication
import { Injectable, signal, computed } from '@angular/core';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CallOptions {
  timeoutMs?: number;
}

export interface ApiState {
  loading: boolean;
  error: string | null;
  lastCallTime: number | null;
  callCount: number;
}

interface WebUIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly defaultTimeout = 30000;
  
  // Internal state signals
  private readonly loading = signal(false);
  private readonly error = signal<string | null>(null);
  private readonly lastCallTime = signal<number | null>(null);
  private readonly callCount = signal(0);
  
  // Public readonly signals
  readonly isLoading = this.loading.asReadonly();
  readonly error$ = this.error.asReadonly();
  readonly lastCallTime$ = this.lastCallTime.asReadonly();
  readonly callCount$ = this.callCount.asReadonly();
  
  // Computed signals
  readonly hasError = computed(() => this.error() !== null);
  readonly isReady = computed(() => !this.loading() && this.error() === null);
  
  /**
   * Call a backend function with automatic loading/error state management
   * Uses WebUI bridge (window.webui.call) for communication
   */
  async call<T>(functionName: string, args: unknown[] = [], options?: CallOptions): Promise<ApiResponse<T>> {
    this.loading.set(true);
    this.error.set(null);
    this.callCount.update(count => count + 1);
    
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeout;

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.loading.set(false);
        this.error.set(`Request timeout after ${timeoutMs}ms`);
        
        reject({
          success: false,
          error: `Request timeout after ${timeoutMs}ms`,
        });
      }, timeoutMs);

      try {
        const webui = (window as any).webui;

        if (!webui || typeof webui.call !== 'function') {
          clearTimeout(timeoutId);
          this.loading.set(false);
          this.error.set('WebUI bridge not available');
          
          reject({
            success: false,
            error: 'WebUI bridge not available',
          });
          return;
        }

        // Convert args to string (WebUI expects strings)
        const stringArgs = args.map(arg => {
          if (typeof arg === 'object') {
            return JSON.stringify(arg);
          }
          return String(arg);
        });

        // Call backend via WebUI bridge
        webui.call(functionName, ...stringArgs)
          .then((response: string) => {
            clearTimeout(timeoutId);
            this.loading.set(false);
            this.lastCallTime.set(Date.now());
            
              try {
                const parsed: WebUIResponse = JSON.parse(response);
                if (!parsed.success) {
                  this.error.set(parsed.error ?? 'Unknown error');
                }
                resolve({
                  success: parsed.success,
                  data: parsed.data as T,
                  error: parsed.error,
                });
              } catch (parseError) {
                // If response is not JSON, treat it as raw data
                resolve({
                  success: true,
                  data: response as T,
                });
              }
          })
          .catch((error: Error) => {
            clearTimeout(timeoutId);
            this.loading.set(false);
            const errorMsg = error.message || 'Unknown error';
            this.error.set(errorMsg);
            
            reject({
              success: false,
              error: errorMsg,
            });
          });
      } catch (error) {
        clearTimeout(timeoutId);
        this.loading.set(false);
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.error.set(errorMsg);
        
        reject({
          success: false,
          error: errorMsg,
        });
      }
    });
  }

  /**
   * Call backend and throw on error
   */
  async callOrThrow<T>(functionName: string, args: unknown[] = []): Promise<T> {
    const response = await this.call<T>(functionName, args);
    if (!response.success) {
      throw new Error(response.error ?? 'Unknown error');
    }
    return response.data as T;
  }
  
  /**
   * Clear error state
   */
  clearError(): void {
    this.error.set(null);
  }
  
  /**
   * Reset all state
   */
  reset(): void {
    this.loading.set(false);
    this.error.set(null);
    this.lastCallTime.set(null);
    this.callCount.set(0);
  }
}
