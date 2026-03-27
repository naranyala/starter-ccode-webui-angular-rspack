import { type ErrorHandler, Injectable } from '@angular/core';

export interface ErrorInfo {
  message: string;
  stack?: string;
  timestamp: string;
  url: string;
  component?: string;
  context?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class GlobalErrorHandlerService {
  private errorLog: ErrorInfo[] = [];
  private readonly MAX_LOG_SIZE = 50;
  private errorListeners: Set<(error: ErrorInfo) => void> = new Set();

  handleError(
    error: unknown,
    context?: { component?: string; context?: Record<string, unknown> }
  ): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: this.extractMessage(error),
      stack: this.extractStack(error),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      component: context?.component,
      context: context?.context,
    };

    // Add to log
    this.errorLog.unshift(errorInfo);
    if (this.errorLog.length > this.MAX_LOG_SIZE) {
      this.errorLog.pop();
    }

    // Notify listeners
    this.errorListeners.forEach((listener) => listener(errorInfo));

    // Log to console
    console.error('[GlobalErrorHandler]', errorInfo);

    // Send to monitoring service (if configured)
    this.sendToMonitoring(errorInfo);

    return errorInfo;
  }

  private extractMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown error';
    }
  }

  private extractStack(error: unknown): string | undefined {
    if (error instanceof Error) {
      return error.stack;
    }
    return undefined;
  }

  addListener(listener: (error: ErrorInfo) => void): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  getErrorLog(): ErrorInfo[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }

  getErrorCount(): number {
    return this.errorLog.length;
  }

  private sendToMonitoring(error: ErrorInfo): void {
    // Placeholder for sending to external monitoring service
    // e.g., Sentry, LogRocket, etc.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('app:error', { detail: error }));
    }
  }
}

@Injectable({ providedIn: 'root' })
export class AngularGlobalErrorHandler implements ErrorHandler {
  constructor(private errorHandlerService: GlobalErrorHandlerService) {}

  handleError(error: unknown): void {
    this.errorHandlerService.handleError(error, {
      component: 'Angular',
      context: { source: 'Angular ErrorHandler' },
    });
  }
}
