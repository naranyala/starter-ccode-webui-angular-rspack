/**
 * HttpService - Simplified HTTP client wrapper around Fetch API
 * 
 * Features:
 * - Generic type support for responses
 * - Timeout handling via AbortController
 * - Base URL configuration
 * - Default headers
 * 
 * @example
 * ```typescript
 * const http = inject(HttpService);
 * const response = await http.get<User[]>('/api/users');
 * console.log(response.body);
 * ```
 */
import { Injectable } from '@angular/core';
import { DEFAULT_TIMEOUT_MS } from '../app/constants/app.constants';

export interface HttpRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  cache?: boolean;
}

export interface HttpResponse<T> {
  status: number;
  body: T;
  ok: boolean;
}

@Injectable({ providedIn: 'root' })
export class HttpService {
  private baseUrl = '';
  
  private readonly defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  /**
   * Set base URL for all requests
   * @param url Base URL to prepend to requests
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Perform GET request
   * @param url Request URL
   * @param options Request options
   * @returns HttpResponse with typed body
   */
  async get<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, options);
  }

  /**
   * Perform POST request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   * @returns HttpResponse with typed body
   */
  async post<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, { ...options, body });
  }

  /**
   * Perform PUT request
   * @param url Request URL
   * @param body Request body
   * @param options Request options
   * @returns HttpResponse with typed body
   */
  async put<T>(url: string, body?: unknown, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, { ...options, body });
  }

  /**
   * Perform DELETE request
   * @param url Request URL
   * @param options Request options
   * @returns HttpResponse with typed body
   */
  async delete<T>(url: string, options?: HttpRequestOptions): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, options);
  }

  /**
   * Internal request method
   * @param method HTTP method
   * @param url Request URL
   * @param options Request options
   * @returns HttpResponse with typed body
   */
  private async request<T>(
    method: string,
    url: string,
    options?: HttpRequestOptions
  ): Promise<HttpResponse<T>> {
    const fullUrl = this.baseUrl && !url.startsWith('http') 
      ? `${this.baseUrl}/${url}` 
      : url;

    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(), 
      options?.timeout ?? DEFAULT_TIMEOUT_MS
    );

    try {
      const response = await fetch(fullUrl, {
        method,
        headers: { ...this.defaultHeaders, ...options?.headers },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const body = await response.json() as T;

      return {
        status: response.status,
        body,
        ok: response.ok,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}
