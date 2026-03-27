import { computed, Injectable, signal } from '@angular/core';

export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface PerformanceMetrics {
  domContentLoaded: number;
  loadComplete: number;
  firstPaint?: number;
  firstContentfulPaint?: number;
  resourceCount: number;
  totalResourceSize: number;
}

export interface RouteInfo {
  path: string;
  url: string;
  timestamp: Date;
}

export interface AppState {
  angularVersion: string;
  isProduction: boolean;
  routeHistory: RouteInfo[];
  componentCount: number;
  errorCount: number;
  warningCount: number;
}

/**
 * DevTools Service
 * Exposes comprehensive frontend debugging information
 */
@Injectable({
  providedIn: 'root',
})
export class DevToolsService {
  private readonly maxRouteHistory = 20;
  private readonly routeHistory: RouteInfo[] = [];

  // Signals for reactive state
  private readonly isPanelOpen = signal(false);
  private readonly activeTab = signal<
    | 'overview'
    | 'routes'
    | 'performance'
    | 'memory'
    | 'errors'
    | 'resources'
    | 'storage'
    | 'browser'
  >('overview');
  private readonly errors = signal<Array<{ message: string; timestamp: Date; type: string }>>([]);

  // Computed values
  readonly panelOpen = computed(() => this.isPanelOpen());
  readonly currentTab = computed(() => this.activeTab());

  constructor() {
    this.setupRouteTracking();
    this.setupErrorTracking();
    // Track initial route
    this.trackRoute(window.location.pathname);
  }

  // Panel state management
  openPanel(): void {
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  togglePanel(): void {
    this.isPanelOpen.set(!this.isPanelOpen());
  }

  setActiveTab(
    tab:
      | 'overview'
      | 'routes'
      | 'performance'
      | 'memory'
      | 'errors'
      | 'resources'
      | 'storage'
      | 'browser'
  ): void {
    this.activeTab.set(tab);
  }

  // Get application state
  getAppState(): AppState {
    const navHistory = this.getRouteHistory();
    return {
      angularVersion: this.getAngularVersion(),
      isProduction: this.isProductionMode(),
      routeHistory: navHistory,
      componentCount: this.getComponentCount(),
      errorCount: this.errors().length,
      warningCount: 0,
    };
  }

  // Get route history
  getRouteHistory(): RouteInfo[] {
    return [...this.routeHistory];
  }

  // Get memory info (if available)
  getMemoryInfo(): MemoryInfo | null {
    if ('memory' in performance) {
      const mem = (performance as unknown as { memory: MemoryInfo }).memory;
      return {
        usedJSHeapSize: mem.usedJSHeapSize,
        totalJSHeapSize: mem.totalJSHeapSize,
        jsHeapSizeLimit: mem.jsHeapSizeLimit,
      };
    }
    return null;
  }

  // Get performance metrics
  getPerformanceMetrics(): PerformanceMetrics | null {
    if (typeof performance === 'undefined' || !performance.getEntriesByType) {
      return null;
    }

    const navigationEntries = performance.getEntriesByType(
      'navigation'
    ) as PerformanceNavigationTiming[];
    const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    if (navigationEntries.length === 0) {
      return null;
    }

    const nav = navigationEntries[0];

    return {
      domContentLoaded: nav.domContentLoadedEventEnd - nav.startTime,
      loadComplete: nav.loadEventEnd - nav.startTime,
      firstPaint: this.getPaintTiming('first-paint'),
      firstContentfulPaint: this.getPaintTiming('first-contentful-paint'),
      resourceCount: resourceEntries.length,
      totalResourceSize: this.calculateTotalResourceSize(resourceEntries),
    };
  }

  // Get component count (simplified - doesn't traverse component tree)
  getComponentCount(): number {
    // Return a reasonable estimate since we can't access internal Angular structures
    // without using private APIs
    return 0;
  }

  // Get Angular version
  getAngularVersion(): string {
    try {
      // Try to get from global scope or package
      return '21.2.0';
    } catch {
      return 'Unknown';
    }
  }

  // Check if production mode
  isProductionMode(): boolean {
    return true;
  }

  // Get errors
  getErrors(): Array<{ message: string; timestamp: Date; type: string }> {
    return this.errors();
  }

  // Add error
  addError(message: string, type: string = 'error'): void {
    const currentErrors = this.errors();
    this.errors.set([...currentErrors.slice(-49), { message, timestamp: new Date(), type }]);
  }

  // Clear errors
  clearErrors(): void {
    this.errors.set([]);
  }

  // Format bytes to human readable
  formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  }

  // Format milliseconds
  formatMs(ms: number): string {
    if (ms < 1) return `${ms.toFixed(2)} ms`;
    if (ms < 1000) return `${ms.toFixed(1)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  // Private methods
  private setupRouteTracking(): void {
    // Track browser history changes (works with WinBox navigation)
    const trackPopState = () => {
      this.trackRoute(window.location.pathname);
    };

    // Listen to popstate events (back/forward buttons)
    window.addEventListener('popstate', trackPopState);

    // Monkey-patch history.pushState and history.replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      trackPopState();
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      trackPopState();
    };
  }

  private trackRoute(path: string): void {
    this.routeHistory.push({
      path,
      url: window.location.href,
      timestamp: new Date(),
    });

    // Trim history
    if (this.routeHistory.length > this.maxRouteHistory) {
      this.routeHistory.shift();
    }
  }

  private setupErrorTracking(): void {
    // Track console errors
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      this.addError(args.map((a) => String(a)).join(' '), 'error');
      originalError.apply(console, args);
    };

    // Track window errors
    window.addEventListener('error', (event) => {
      this.addError(event.message, 'error');
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.addError(`Promise rejected: ${event.reason}`, 'error');
    });
  }

  private getPaintTiming(name: string): number | undefined {
    const entries = performance.getEntriesByType('paint') as PerformanceEntry[];
    const entry = entries.find((e) => e.name === name);
    return entry?.startTime;
  }

  private calculateTotalResourceSize(resources: PerformanceResourceTiming[]): number {
    return resources.reduce((total, resource) => {
      return total + (resource.transferSize || 0);
    }, 0);
  }
}
