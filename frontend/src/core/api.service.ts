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

interface WebUI {
  call(fn: string, ...args: unknown[]): Promise<string>;
  isConnected(): boolean;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly defaultTimeout = 30000;
  
  private get webui(): WebUI | null {
    return (window as any).webui;
  }
  
  private get isWebUIAvailable(): boolean {
    return this.webui !== null && this.webui !== undefined;
  }
  
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
   */
  async call<T>(functionName: string, args: unknown[] = [], options?: CallOptions): Promise<ApiResponse<T>> {
    this.loading.set(true);
    this.error.set(null);
    this.callCount.update(count => count + 1);
    
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeout;
    
    try {
      if (!this.isWebUIAvailable) {
        throw new Error('WebUI backend not connected');
      }
      
      // Check if connected
      if (!this.webui!.isConnected()) {
        throw new Error('WebUI not connected to backend');
      }
      
      // Use Promise.race for timeout
      const response = await Promise.race([
        this.webui!.call(functionName, ...args),
        new Promise<string>((_, reject) => 
          setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs}ms`)), timeoutMs)
        )
      ]) as string;
      
      this.loading.set(false);
      this.lastCallTime.set(Date.now());
      
      // Parse JSON response from backend
      const parsed = JSON.parse(response) as ApiResponse<T>;
      
      if (!parsed.success) {
        this.error.set(parsed.error ?? 'Unknown error');
      }
      
      return parsed;
    } catch (error) {
      this.loading.set(false);
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.error.set(errorMsg);
      
      return {
        success: false,
        error: errorMsg
      };
    }
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
   * Check if backend is connected
   */
  isConnected(): boolean {
    return this.isWebUIAvailable && this.webui!.isConnected();
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
