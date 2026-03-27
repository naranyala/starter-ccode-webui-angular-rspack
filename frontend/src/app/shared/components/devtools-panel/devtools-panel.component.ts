import { CommonModule } from '@angular/common';
import { Component, type OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DevToolsService,
  type AppState,
  type MemoryInfo,
  type PerformanceMetrics,
  type RouteInfo,
} from '../../services/devtools.service';
import { ErrorHandlerService } from '../../services/error-handler.service';

interface TabConfig {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

interface ResourceInfo {
  name: string;
  type: string;
  size: number;
  duration: number;
  startTime: number;
}

interface StorageInfo {
  type: string;
  usage?: number;
  quota?: number;
  items?: { key: string; value: string }[];
}

interface NavigatorInfo {
  userAgent: string;
  language: string;
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  cookieEnabled: boolean;
  doNotTrack?: string;
}

interface ScreenInfo {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  orientation?: string;
}

@Component({
  selector: 'app-devtools-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- DevTools Collapsed Bar (full-width, tiny height) -->
    @if (!panelOpenState) {
      <div class="devtools-collapsed-bar" (click)="togglePanel()" title="Click to expand DevTools (Ctrl+Shift+D)">
        <span class="bar-icon">🛠️</span>
        <span class="bar-text">
          <span class="bar-label">DevTools</span>
          <span class="bar-separator">|</span>
          <span class="bar-info">{{ summaryText }}</span>
          @if (errorCount > 0) {
            <span class="bar-error-badge">⚠️ {{ errorCount }} error{{ errorCount > 1 ? 's' : '' }}</span>
          }
        </span>
        <span class="bar-expand-icon">▲</span>
      </div>
    }

    <!-- DevTools Panel -->
    @if (panelOpenState) {
      <div class="devtools-panel" [style.height.px]="panelHeight()">
        <!-- Tabs -->
        <div class="panel-tabs">
          <div class="tabs-left">
            @for (tab of tabs; track tab.id) {
              <button
                type="button"
                class="tab-btn"
                [class.active]="currentTabState === tab.id"
                (click)="setActiveTab(tab.id)"
              >
                <span class="tab-icon">{{ tab.icon }}</span>
                <span class="tab-label">{{ tab.label }}</span>
                @if (tab.badge) {
                  <span class="tab-badge">{{ tab.badge }}</span>
                }
              </button>
            }
          </div>
          <button
            type="button"
            class="tab-close-btn"
            (click)="togglePanel()"
            title="Close DevTools (Ctrl+Shift+D)"
          >
            ✕
          </button>
        </div>

        <!-- Panel Content -->
        <div class="panel-content">
          <!-- Overview Tab -->
          @if (currentTabState === 'overview') {
            <div class="tab-content overview-tab">
              <div class="info-grid">
                <div class="info-card">
                  <div class="info-label">Angular Version</div>
                  <div class="info-value">{{ appState.angularVersion }}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Mode</div>
                  <div class="info-value mode-badge" [class.production]="appState.isProduction">
                    {{ appState.isProduction ? 'Production' : 'Development' }}
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-label">Components</div>
                  <div class="info-value">{{ appState.componentCount }}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Routes Visited</div>
                  <div class="info-value">{{ appState.routeHistory.length }}</div>
                </div>
                <div class="info-card">
                  <div class="info-label">Errors</div>
                  <div class="info-value error-count" [class.has-errors]="errorCount > 0">
                    {{ errorCount }}
                  </div>
                </div>
                <div class="info-card">
                  <div class="info-label">Current Route</div>
                  <div class="info-value route-value">{{ currentRoute }}</div>
                </div>
              </div>

              <div class="section">
                <h3 class="section-title">📦 Application Info</h3>
                <div class="info-table">
                  <div class="info-row">
                    <span class="info-key">Base URL</span>
                    <span class="info-val">{{ baseUrl }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">User Agent</span>
                    <span class="info-val user-agent">{{ userAgent }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">Viewport</span>
                    <span class="info-val">{{ viewport }}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">Device Pixel Ratio</span>
                    <span class="info-val">{{ devicePixelRatio }}x</span>
                  </div>
                  <div class="info-row">
                    <span class="info-key">Online Status</span>
                    <span class="info-val status-badge" [class.online]="isOnline" [class.offline]="!isOnline">
                      {{ isOnline ? '🟢 Online' : '🔴 Offline' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Routes Tab -->
          @if (currentTabState === 'routes') {
            <div class="tab-content routes-tab">
              <div class="routes-header">
                <h3 class="section-title">📍 Route History</h3>
                <button type="button" class="clear-btn" (click)="clearRouteHistory()">
                  Clear
                </button>
              </div>
              <div class="routes-list">
                @for (route of routeHistory; track route.timestamp; let last = $last) {
                  <div class="route-item" [class.current]="last">
                    <div class="route-time">{{ route.timestamp | date:'HH:mm:ss' }}</div>
                    <div class="route-info">
                      <span class="route-path">{{ route.path }}</span>
                      @if (!last) {
                        <button
                          type="button"
                          class="navigate-btn"
                          (click)="navigateTo(route.path)"
                          title="Navigate"
                        >
                          →
                        </button>
                      }
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state">No routes visited yet</div>
                }
              </div>
            </div>
          }

          <!-- Performance Tab -->
          @if (currentTabState === 'performance') {
            <div class="tab-content performance-tab">
              @if (performanceMetrics) {
                <div class="metrics-grid">
                  <div class="metric-card">
                    <div class="metric-icon">⏱️</div>
                    <div class="metric-label">DOM Content Loaded</div>
                    <div class="metric-value">{{ devTools.formatMs(performanceMetrics.domContentLoaded) }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-icon">🚀</div>
                    <div class="metric-label">Load Complete</div>
                    <div class="metric-value">{{ devTools.formatMs(performanceMetrics.loadComplete) }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-icon">🎨</div>
                    <div class="metric-label">First Paint</div>
                    <div class="metric-value">{{ performanceMetrics.firstPaint ? devTools.formatMs(performanceMetrics.firstPaint) : 'N/A' }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-icon">📄</div>
                    <div class="metric-label">First Contentful Paint</div>
                    <div class="metric-value">{{ performanceMetrics.firstContentfulPaint ? devTools.formatMs(performanceMetrics.firstContentfulPaint) : 'N/A' }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-icon">📦</div>
                    <div class="metric-label">Resources Loaded</div>
                    <div class="metric-value">{{ performanceMetrics.resourceCount }}</div>
                  </div>
                  <div class="metric-card">
                    <div class="metric-icon">💾</div>
                    <div class="metric-label">Total Transfer Size</div>
                    <div class="metric-value">{{ devTools.formatBytes(performanceMetrics.totalResourceSize) }}</div>
                  </div>
                </div>

                <div class="section">
                  <h3 class="section-title">📊 Performance Timeline</h3>
                  <div class="timeline-bar">
                    <div class="timeline-segment" [style.width.%]="getTimelinePercentage(performanceMetrics.domContentLoaded)">
                      <span class="segment-label">DOM</span>
                    </div>
                    <div class="timeline-segment fcp" [style.width.%]="getTimelinePercentage((performanceMetrics.firstContentfulPaint || 0) - performanceMetrics.domContentLoaded)">
                      <span class="segment-label">FCP</span>
                    </div>
                    <div class="timeline-segment load" [style.width.%]="getTimelinePercentage(performanceMetrics.loadComplete - (performanceMetrics.firstContentfulPaint || performanceMetrics.domContentLoaded))">
                      <span class="segment-label">Load</span>
                    </div>
                  </div>
                </div>
              } @else {
                <div class="empty-state">Performance API not available</div>
              }
            </div>
          }

          <!-- Memory Tab -->
          @if (currentTabState === 'memory') {
            <div class="tab-content memory-tab">
              @if (memoryInfo) {
                <div class="memory-cards">
                  <div class="memory-card">
                    <div class="memory-label">Used Heap</div>
                    <div class="memory-value">{{ devTools.formatBytes(memoryInfo.usedJSHeapSize) }}</div>
                    <div class="memory-bar">
                      <div
                        class="memory-fill used"
                        [style.width.%]="getMemoryPercentage()"
                      ></div>
                    </div>
                  </div>
                  <div class="memory-card">
                    <div class="memory-label">Total Heap</div>
                    <div class="memory-value">{{ devTools.formatBytes(memoryInfo.totalJSHeapSize) }}</div>
                  </div>
                  <div class="memory-card">
                    <div class="memory-label">Heap Limit</div>
                    <div class="memory-value">{{ devTools.formatBytes(memoryInfo.jsHeapSizeLimit) }}</div>
                  </div>
                </div>

                <div class="section">
                  <h3 class="section-title">💡 Memory Tips</h3>
                  <ul class="tips-list">
                    <li>High memory usage may indicate memory leaks</li>
                    <li>Check for unsubscribed observables</li>
                    <li>Look for detached DOM elements</li>
                    <li>Monitor component creation/destruction</li>
                  </ul>
                </div>
              } @else {
                <div class="empty-state">
                  Memory API not available in this browser.
                  <br>Try Chrome or Edge desktop.
                </div>
              }
            </div>
          }

          <!-- Errors Tab -->
          @if (currentTabState === 'errors') {
            <div class="tab-content errors-tab">
              <div class="errors-header">
                <h3 class="section-title">Error Log</h3>
                <div class="errors-actions">
                  <button type="button" class="clear-btn" (click)="clearErrors()">
                    Clear All
                  </button>
                </div>
              </div>
              <div class="errors-list">
                @for (error of errors; track error.timestamp; let last = $last) {
                  <div class="error-item" [class.error]="error.type === 'error'" [class.warning]="error.type === 'warning'" [class.info]="error.type === 'info'">
                    <div class="error-time">{{ error.timestamp | date:'HH:mm:ss' }}</div>
                    <div class="error-type-badge" [class]="'type-' + error.type">
                      {{ error.type }}
                    </div>
                    <div class="error-message">{{ error.message }}</div>
                  </div>
                } @empty {
                  <div class="empty-state success">No errors recorded</div>
                }
              </div>
            </div>
          }

          <!-- Resources Tab -->
          @if (currentTabState === 'resources') {
            <div class="tab-content resources-tab">
              <div class="resources-header">
                <h3 class="section-title">Loaded Resources</h3>
                <span class="resource-count">{{ resources.length }} resources</span>
              </div>
              @if (resources.length > 0) {
                <div class="resources-table">
                  <div class="table-header">
                    <span class="col-name">Name</span>
                    <span class="col-type">Type</span>
                    <span class="col-size">Size</span>
                    <span class="col-duration">Duration</span>
                    <span class="col-start">Start</span>
                  </div>
                  @for (resource of resources; track resource.name) {
                    <div class="table-row">
                      <span class="col-name resource-name" [title]="resource.name">{{ resource.name | slice:100 }}</span>
                      <span class="col-type">{{ resource.type }}</span>
                      <span class="col-size">{{ devTools.formatBytes(resource.size) }}</span>
                      <span class="col-duration">{{ devTools.formatMs(resource.duration) }}</span>
                      <span class="col-start">{{ devTools.formatMs(resource.startTime) }}</span>
                    </div>
                  }
                </div>
              } @else {
                <div class="empty-state">No resources loaded</div>
              }
            </div>
          }

          <!-- Storage Tab -->
          @if (currentTabState === 'storage') {
            <div class="tab-content storage-tab">
              <div class="storage-sections">
                <!-- Local Storage -->
                <div class="storage-section">
                  <h3 class="storage-title">LocalStorage</h3>
                  <div class="storage-count">{{ storageInfo.localStorage.items?.length || 0 }} items</div>
                  @if (storageInfo.localStorage.items && storageInfo.localStorage.items.length > 0) {
                    <div class="storage-list">
                      @for (item of storageInfo.localStorage.items; track item.key) {
                        <div class="storage-item">
                          <span class="storage-key">{{ item.key }}</span>
                          <span class="storage-value" [title]="item.value">{{ item.value | slice:50 }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-state">LocalStorage is empty</div>
                  }
                </div>

                <!-- Session Storage -->
                <div class="storage-section">
                  <h3 class="storage-title">SessionStorage</h3>
                  <div class="storage-count">{{ storageInfo.sessionStorage.items?.length || 0 }} items</div>
                  @if (storageInfo.sessionStorage.items && storageInfo.sessionStorage.items.length > 0) {
                    <div class="storage-list">
                      @for (item of storageInfo.sessionStorage.items; track item.key) {
                        <div class="storage-item">
                          <span class="storage-key">{{ item.key }}</span>
                          <span class="storage-value" [title]="item.value">{{ item.value | slice:50 }}</span>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="empty-state">SessionStorage is empty</div>
                  }
                </div>
              </div>
            </div>
          }

          <!-- Browser Tab -->
          @if (currentTabState === 'browser') {
            <div class="tab-content browser-tab">
              <div class="browser-sections">
                <!-- Navigator Info -->
                <div class="browser-section">
                  <h3 class="section-title">Navigator</h3>
                  <div class="info-table">
                    <div class="info-row">
                      <span class="info-key">User Agent</span>
                      <span class="info-val user-agent">{{ navigatorInfo.userAgent }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Language</span>
                      <span class="info-val">{{ navigatorInfo.language }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Platform</span>
                      <span class="info-val">{{ navigatorInfo.platform }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">CPU Cores</span>
                      <span class="info-val">{{ navigatorInfo.hardwareConcurrency }}</span>
                    </div>
                    @if (navigatorInfo.deviceMemory) {
                      <div class="info-row">
                        <span class="info-key">Device Memory</span>
                        <span class="info-val">~{{ navigatorInfo.deviceMemory }} GB</span>
                      </div>
                    }
                    <div class="info-row">
                      <span class="info-key">Touch Points</span>
                      <span class="info-val">{{ navigatorInfo.maxTouchPoints }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Cookies Enabled</span>
                      <span class="info-val">{{ navigatorInfo.cookieEnabled ? 'Yes' : 'No' }}</span>
                    </div>
                    @if (navigatorInfo.doNotTrack) {
                      <div class="info-row">
                        <span class="info-key">Do Not Track</span>
                        <span class="info-val">{{ navigatorInfo.doNotTrack }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Screen Info -->
                <div class="browser-section">
                  <h3 class="section-title">Screen</h3>
                  <div class="info-table">
                    <div class="info-row">
                      <span class="info-key">Resolution</span>
                      <span class="info-val">{{ screenInfo.width }} x {{ screenInfo.height }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Available</span>
                      <span class="info-val">{{ screenInfo.availWidth }} x {{ screenInfo.availHeight }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Color Depth</span>
                      <span class="info-val">{{ screenInfo.colorDepth }}-bit</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Pixel Depth</span>
                      <span class="info-val">{{ screenInfo.pixelDepth }}-bit</span>
                    </div>
                    @if (screenInfo.orientation) {
                      <div class="info-row">
                        <span class="info-key">Orientation</span>
                        <span class="info-val">{{ screenInfo.orientation }}</span>
                      </div>
                    }
                  </div>
                </div>

                <!-- Network Status -->
                <div class="browser-section">
                  <h3 class="section-title">Network Status</h3>
                  <div class="info-table">
                    <div class="info-row">
                      <span class="info-key">Online Status</span>
                      <span class="info-val status-badge" [class.online]="isOnline" [class.offline]="!isOnline">
                        {{ isOnline ? 'Online' : 'Offline' }}
                      </span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Viewport</span>
                      <span class="info-val">{{ viewport }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-key">Device Pixel Ratio</span>
                      <span class="info-val">{{ devicePixelRatio }}x</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>

        <!-- Panel Resize Handle -->
        <div
          class="resize-handle"
          (mousedown)="startResize($event)"
        >
          <div class="resize-grip">⋮⋮</div>
        </div>
      </div>
    }
  `,
  styleUrl: './devtools-panel.component.css',
})
export class DevToolsPanelComponent implements OnInit {
  readonly devTools: DevToolsService;
  private readonly errorHandler: ErrorHandlerService;

  readonly panelOpen = signal(false);
  readonly activeTab = signal<'overview' | 'routes' | 'performance' | 'memory' | 'errors' | 'resources' | 'storage' | 'browser'>(
    'overview'
  );

  panelHeight = signal(400);
  isResizing = false;
  startY = 0;
  startHeight = 0;

  currentRoute = '';
  baseUrl = window.location.origin;
  userAgent = navigator.userAgent;
  viewport = `${window.innerWidth} x ${window.innerHeight}`;
  devicePixelRatio = window.devicePixelRatio;
  isOnline = navigator.onLine;

  appState: AppState = {
    angularVersion: '',
    isProduction: false,
    routeHistory: [],
    componentCount: 0,
    errorCount: 0,
    warningCount: 0,
  };

  routeHistory: RouteInfo[] = [];
  performanceMetrics: PerformanceMetrics | null = null;
  memoryInfo: MemoryInfo | null = null;
  errors: Array<{ message: string; timestamp: Date; type: string }> = [];
  resources: ResourceInfo[] = [];
  storageInfo: { localStorage: StorageInfo; sessionStorage: StorageInfo } = {
    localStorage: { type: 'localStorage', items: [] },
    sessionStorage: { type: 'sessionStorage', items: [] },
  };
  navigatorInfo: NavigatorInfo = {
    userAgent: '',
    language: '',
    platform: '',
    hardwareConcurrency: 0,
    maxTouchPoints: 0,
    cookieEnabled: false,
  };
  screenInfo: ScreenInfo = {
    width: 0,
    height: 0,
    availWidth: 0,
    availHeight: 0,
    colorDepth: 0,
    pixelDepth: 0,
  };

  tabs: TabConfig[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'routes', label: 'Routes', icon: '📍' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'memory', label: 'Memory', icon: '💾' },
    { id: 'errors', label: 'Errors', icon: '⚠️', badge: 0 },
    { id: 'resources', label: 'Resources', icon: '📦' },
    { id: 'storage', label: 'Storage', icon: '🗄️' },
    { id: 'browser', label: 'Browser', icon: '🌐' },
  ];

  private resizeListener?: (e: MouseEvent) => void;
  private resizeUpListener?: (e: MouseEvent) => void;

  constructor(devTools: DevToolsService, errorHandler: ErrorHandlerService) {
    this.devTools = devTools;
    this.errorHandler = errorHandler;

    // Update error count in tabs
    this.errorHandler.errors$.subscribe(() => {
      const errorTab = this.tabs.find(t => t.id === 'errors');
      if (errorTab) {
        errorTab.badge = this.errorHandler.getErrorCount();
      }
    });

    // Listen for online/offline events
    window.addEventListener('online', () => (this.isOnline = true));
    window.addEventListener('offline', () => (this.isOnline = false));
  }

  get panelOpenState() {
    return this.devTools.panelOpen();
  }

  get currentTabState() {
    return this.devTools.currentTab();
  }

  get summaryText(): string {
    const parts: string[] = [];
    
    // Mode
    parts.push(this.appState.isProduction ? '🟢 Production' : '🔵 Dev');
    
    // Current route
    if (this.currentRoute) {
      const shortRoute = this.currentRoute.length > 25 ? this.currentRoute.substring(0, 22) + '...' : this.currentRoute;
      parts.push(`📍 ${shortRoute}`);
    }
    
    // Errors
    if (this.errorCount > 0) {
      parts.push(`⚠️ ${this.errorCount}`);
    }
    
    // Performance hint
    if (this.performanceMetrics) {
      const loadTime = Math.round(this.performanceMetrics.loadComplete);
      if (loadTime > 0) {
        parts.push(`⚡ ${loadTime}ms`);
      }
    }
    
    return parts.join(' | ');
  }

  ngOnInit(): void {
    this.refreshData();
    this.currentRoute = window.location.pathname;

    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        this.togglePanel();
      }
    });
  }

  get errorCount(): number {
    return this.errorHandler.getErrorCount();
  }

  togglePanel(): void {
    this.devTools.togglePanel();
    if (this.panelOpenState) {
      setTimeout(() => this.refreshData(), 100);
    }
  }

  setActiveTab(tabId: string): void {
    this.devTools.setActiveTab(tabId as never);
    if (tabId === 'performance' || tabId === 'memory') {
      setTimeout(() => this.refreshData(), 100);
    }
  }

  refreshData(): void {
    this.appState = this.devTools.getAppState();
    this.routeHistory = this.devTools.getRouteHistory();
    this.performanceMetrics = this.devTools.getPerformanceMetrics();
    this.memoryInfo = this.devTools.getMemoryInfo();
    this.errors = this.errorHandler.getErrors();
    this.viewport = `${window.innerWidth} x ${window.innerHeight}`;
    this.resources = this.getResources();
    this.storageInfo = this.getStorageInfo();
    this.navigatorInfo = this.getNavigatorInfo();
    this.screenInfo = this.getScreenInfo();
  }

  private getResources(): ResourceInfo[] {
    if (!performance.getEntriesByType) return [];
    const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return entries.slice(0, 100).map(entry => ({
      name: entry.name,
      type: entry.initiatorType,
      size: entry.transferSize || 0,
      duration: entry.duration,
      startTime: entry.startTime,
    }));
  }

  private getStorageInfo(): { localStorage: StorageInfo; sessionStorage: StorageInfo } {
    const getStorageItems = (storage: Storage) => {
      const items: { key: string; value: string }[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          items.push({ key, value: storage.getItem(key) || '' });
        }
      }
      return items;
    };

    return {
      localStorage: {
        type: 'localStorage',
        items: getStorageItems(localStorage),
      },
      sessionStorage: {
        type: 'sessionStorage',
        items: getStorageItems(sessionStorage),
      },
    };
  }

  private getNavigatorInfo(): NavigatorInfo {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      cookieEnabled: navigator.cookieEnabled,
      doNotTrack: navigator.doNotTrack || undefined,
    };
  }

  private getScreenInfo(): ScreenInfo {
    return {
      width: screen.width,
      height: screen.height,
      availWidth: screen.availWidth,
      availHeight: screen.availHeight,
      colorDepth: screen.colorDepth,
      pixelDepth: screen.pixelDepth,
      orientation: (screen.orientation as any)?.type,
    };
  }

  clearRouteHistory(): void {
    // Clear except current route
    const current = this.routeHistory[this.routeHistory.length - 1];
    this.routeHistory.length = 0;
    if (current) {
      this.routeHistory.push(current);
    }
  }

  navigateTo(path: string): void {
    // Simple navigation - in real app, inject Router
    window.location.href = path;
  }

  clearErrors(): void {
    this.errorHandler.clearErrors();
    this.errors = [];
    const errorTab = this.tabs.find(t => t.id === 'errors');
    if (errorTab) {
      errorTab.badge = 0;
    }
  }

  copyInfo(): void {
    const info = this.formatInfo();
    navigator.clipboard.writeText(info).then(() => {
      alert('DevTools info copied to clipboard!');
    });
  }

  getTimelinePercentage(ms: number): number {
    const total = this.performanceMetrics?.loadComplete || 1;
    return Math.min((ms / total) * 100, 100);
  }

  getMemoryPercentage(): number {
    if (!this.memoryInfo) return 0;
    return (this.memoryInfo.usedJSHeapSize / this.memoryInfo.jsHeapSizeLimit) * 100;
  }

  startResize(event: MouseEvent): void {
    this.isResizing = true;
    this.startY = event.clientY;
    this.startHeight = this.panelHeight();

    this.resizeListener = (e: MouseEvent) => this.onResize(e);
    this.resizeUpListener = () => this.stopResize();

    document.addEventListener('mousemove', this.resizeListener);
    document.addEventListener('mouseup', this.resizeUpListener);
  }

  private onResize(event: MouseEvent): void {
    if (!this.isResizing) return;
    const deltaY = this.startY - event.clientY;
    const newHeight = Math.max(200, Math.min(600, this.startHeight + deltaY));
    this.panelHeight.set(newHeight);
  }

  private stopResize(): void {
    this.isResizing = false;
    if (this.resizeListener) {
      document.removeEventListener('mousemove', this.resizeListener);
    }
    if (this.resizeUpListener) {
      document.removeEventListener('mouseup', this.resizeUpListener);
    }
  }

  private formatInfo(): string {
    return `
Frontend DevTools Report
========================

Application:
- Angular Version: ${this.appState.angularVersion}
- Mode: ${this.appState.isProduction ? 'Production' : 'Development'}
- Components: ${this.appState.componentCount}
- Current Route: ${this.currentRoute}

Performance:
${
  this.performanceMetrics
    ? `
- DOM Content Loaded: ${this.devTools.formatMs(this.performanceMetrics.domContentLoaded)}
- Load Complete: ${this.devTools.formatMs(this.performanceMetrics.loadComplete)}
- First Paint: ${this.performanceMetrics.firstPaint ? this.devTools.formatMs(this.performanceMetrics.firstPaint) : 'N/A'}
- Resources: ${this.performanceMetrics.resourceCount}
- Total Size: ${this.devTools.formatBytes(this.performanceMetrics.totalResourceSize)}
`
    : 'N/A'
}

Memory:
${
  this.memoryInfo
    ? `
- Used Heap: ${this.devTools.formatBytes(this.memoryInfo.usedJSHeapSize)}
- Total Heap: ${this.devTools.formatBytes(this.memoryInfo.totalJSHeapSize)}
- Heap Limit: ${this.devTools.formatBytes(this.memoryInfo.jsHeapSizeLimit)}
`
    : 'N/A'
}

System:
- Viewport: ${this.viewport}
- Device Pixel Ratio: ${this.devicePixelRatio}x
- Online: ${this.isOnline ? 'Yes' : 'No'}
- URL: ${window.location.href}

Generated: ${new Date().toISOString()}
    `.trim();
  }
}
