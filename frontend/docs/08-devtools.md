# DevTools Guide

Comprehensive documentation for the collapsible bottom DevTools panel component.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tabs Reference](#tabs-reference)
- [Component API](#component-api)
- [Styling](#styling)
- [Customization](#customization)
- [Best Practices](#best-practices)

---

## Overview

The DevTools component is a comprehensive debugging panel that provides real-time insights into application behavior, performance, and state. It features a compact collapsed state (40px) that expands to show detailed information across 10 organized tabs.

### Design Principles

| Principle | Description |
|-----------|-------------|
| **Non-intrusive** | Collapsed state shows minimal information with uptime |
| **Full-width** | Spans entire bottom of viewport |
| **Compact height** | 40px when collapsed, 450px when expanded |
| **Tab-based organization** | 10 tabs for different debugging aspects |
| **Dark theme** | Consistent dark theme optimized for developer tools |
| **Real-time monitoring** | Live updates for console, network, and performance |

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Application Content                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙ DevTools  ▲  Info: Uptime: 45s | Uptime: 45s                          [+] │ ← Collapsed (40px)
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ ⚙ DevTools  ▼  Info: Uptime: 45s | Uptime: 45s                         [-] │ ← Header
├─────────────────────────────────────────────────────────────────────────────┤
│ [Info] [Routes] [Components] [State] [Events] [Console] [Network]...    [▼]│ ← Tabs (scrollable)
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Application Information                        Session Uptime: 45s         │
│  ┌──────────────────────┐  ┌──────────────────────┐                         │
│  │ Application          │  │ Build                │                         │
│  │ App Name             │  │ Build Tool           │                         │
│  │ angular-rspack       │  │ Rspack 1.3.5         │                         │
│  └──────────────────────┘  └──────────────────────┘                         │
│                                                                             │
│  ... more content ...                                                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
  ↑ Expanded (450px)
```

---

## Features

### Collapsed State

- **Height**: 40px
- **Full-width**: Spans entire viewport width
- **Information display**: Shows current tab, summary, and session uptime
- **Click to toggle**: Entire bar is clickable
- **Visual indicator**: Shows expand/collapse icon (+/-)
- **Animated icon**: Gear icon rotates continuously

### Expanded State

- **Height**: 450px (configurable)
- **Scrollable tabs**: Horizontal scroll when tabs overflow
- **Tab badges**: Red notification badges for errors/warnings
- **Action buttons**: Clear buttons for console, network, and storage
- **Real-time updates**: Live data for all monitoring tabs

### Ten Tabs Overview

| Tab | Description | Key Features |
|-----|-------------|--------------|
| **Info** | Application metadata | App, build, runtime, browser info |
| **Routes** | Navigation history | Route tracking with timestamps |
| **Components** | Component tree | Visual hierarchy display |
| **State** | Panel state monitoring | Real-time state updates |
| **Events** | Event log | Chronological event tracking |
| **Console** | Console output | Intercepted console logs with filtering |
| **Network** | Network requests | Fetch/XHR monitoring with timing |
| **Storage** | Storage inspector | LocalStorage and SessionStorage |
| **Performance** | Performance metrics | Timing, resources, memory |
| **Settings** | Configuration | Panel settings and features list |

---

## Tabs Reference

### Info Tab

Displays comprehensive application and environment information organized into 4 categories.

**Categories**:

| Category | Information Displayed |
|----------|----------------------|
| **Application** | App name, version, Angular version |
| **Build** | Build tool (Rspack), TypeScript version |
| **Runtime** | Bun runtime, Node.js version |
| **Browser** | User agent, screen resolution, viewport, language, platform, online status |

**Data Structure**:
```typescript
interface InfoItem {
  label: string;
  value: string;
  category?: 'app' | 'build' | 'runtime' | 'browser';
}
```

**Features**:
- Session uptime display in header
- Grouped by category for easy scanning
- Auto-updates for dynamic values (viewport, online status)

---

### Routes Tab

Tracks all navigation events in the application.

**Display**:
- Current route highlighted in header
- Chronological list of visited routes
- Timestamp for each navigation

**Data Structure**:
```typescript
interface RouteInfo {
  path: string;
  url: string;
  timestamp: string;
}
```

**Features**:
- Automatic router event tracking
- Current route always visible
- Full navigation history

---

### Components Tab

Displays the component tree hierarchy.

**Display**:
- Indented tree structure
- Component names in monospace font
- Square bullet points for each component

**Data Structure**:
```typescript
interface ComponentNode {
  name: string;
  depth: number;
  inputs?: Record<string, unknown>;
}
```

**Features**:
- Visual hierarchy with indentation
- Root component at top
- Nested components indented

---

### State Tab

Shows real-time DevTools panel state.

**Tracked State**:
| Property | Description |
|----------|-------------|
| Panel Expanded | Current expansion state |
| Active Tab | Currently selected tab ID |
| Session Uptime | Time since panel initialized |
| Last Update | Last state change timestamp |

**Features**:
- Updates every second (uptime)
- Updates on every user interaction
- ISO timestamp for precision

---

### Events Tab

Chronological log of DevTools events.

**Event Categories**:
- `[DevTools]` - Panel lifecycle events
- `[Panel]` - Expand/collapse events
- `[Tab]` - Tab switching events
- `[Router]` - Navigation events
- `[Network]` - Network request events
- `[Console]` - Console clear events
- `[Storage]` - Storage clear events

**Format**:
```
[HH:MM:SS AM/PM] [Category] Event description
```

**Features**:
- Append-only log
- Timestamp on each event
- Event count in header

---

### Console Tab

Intercepts and displays all console output.

**Log Types**:
| Type | Color | Border |
|------|-------|--------|
| log | Blue | Blue |
| warn | Orange | Orange |
| error | Red | Red |
| info | Green | Green |
| debug | Purple | Purple |

**Features**:
- Automatic console interception
- Color-coded by type
- Type badge for easy identification
- Clear button to reset logs
- Error/warning count badge on tab
- Timestamp on each log entry
- Object serialization to JSON

**Console Interception**:
```typescript
// All console methods are intercepted
console.log('Message')    // → Captured with blue styling
console.warn('Warning')   // → Captured with orange styling + badge
console.error('Error')    // → Captured with red styling + badge
console.info('Info')      // → Captured with green styling
console.debug('Debug')    // → Captured with purple styling
```

---

### Network Tab

Monitors all fetch requests made by the application.

**Display Columns**:
| Column | Description |
|--------|-------------|
| Method | HTTP method (GET, POST, etc.) with color coding |
| URL | Request URL (truncated if long) |
| Status | HTTP status code (green for success, red for error) |
| Time | Request duration in milliseconds |
| Timestamp | When the request was made |

**Method Color Coding**:
| Method | Color |
|--------|-------|
| GET | Green |
| POST | Blue |
| PUT | Orange |
| DELETE | Red |
| PATCH | Purple |

**Data Structure**:
```typescript
interface NetworkRequest {
  id: string;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  timestamp: string;
  type: 'fetch' | 'xhr' | 'websocket';
}
```

**Features**:
- Automatic fetch interception
- Real-time status updates
- Duration tracking
- Clear button to reset
- Request count in header
- Hover for full URL

---

### Storage Tab

Inspects LocalStorage and SessionStorage contents.

**Display**:
- Two sections: LocalStorage and SessionStorage
- Key-value pairs in grid layout
- Item count in section headers

**Data Structure**:
```typescript
interface StorageItem {
  key: string;
  value: string;
  type: 'local' | 'session';
}
```

**Features**:
- Separate views for local and session storage
- Clear buttons for each storage type
- Key in blue monospace font
- Value truncated if too long (80 chars)
- Hover for full value
- Auto-refresh when switching to tab

**Actions**:
| Action | Description |
|--------|-------------|
| Clear Local | Clears all localStorage items |
| Clear Session | Clears all sessionStorage items |

---

### Performance Tab

Displays browser performance metrics.

**Metric Categories**:

| Category | Metrics |
|----------|---------|
| **Timing** | DNS lookup, TCP connection, TTFB, page load, DOM interactive/complete |
| **Resources** | Total resources count, total transfer size |
| **Memory** | Used JS heap, total JS heap (Chrome only) |

**Display**:
- Grouped by category
- Visual progress bars for timing metrics
- Values in monospace font with units

**Data Structure**:
```typescript
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  category: 'timing' | 'memory' | 'resource';
}
```

**Features**:
- Uses Performance API
- Navigation timing data
- Resource timing aggregation
- Memory metrics (Chrome DevTools Protocol only)
- Auto-refresh when switching to tab

---

### Settings Tab

Displays panel configuration and available features.

**Settings Display**:
| Setting | Value |
|---------|-------|
| Panel Height | 450px |
| Collapsed Height | 40px |
| Total Tabs | 10 |
| Auto-refresh | Enabled |

**Features List**:
- Application information display
- Route history tracking
- Component tree visualization
- Panel state monitoring
- Event logging system
- Console output interception
- Network request monitoring
- Storage inspector (Local/Session)
- Performance metrics display

**Features**:
- Read-only settings display
- Feature checklist with checkmarks
- Expandable for future interactive settings

---

## Component API

### DevtoolsComponent

**Path**: `src/app/devtools/devtools.component.ts`

**Selector**: `<app-devtools>`

**Standalone**: Yes

**Imports**: `CommonModule`

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `COLLAPSED_HEIGHT` | `number` | 40 | Height when collapsed (pixels) |
| `EXPANDED_HEIGHT` | `number` | 450 | Height when expanded (pixels) |
| `startTime` | `Signal<Date>` | `new Date()` | Panel initialization time |
| `tabs` | `Signal<Tab[]>` | - | Available tabs configuration |
| `activeTab` | `Signal<TabId>` | 'info' | Currently active tab |
| `isExpanded` | `Signal<boolean>` | false | Panel expansion state |

### Signals

```typescript
// UI State
readonly isExpanded = signal<boolean>(false);
readonly activeTab = signal<TabId>('info');
readonly startTime = signal<Date>(new Date());

// Data Signals
readonly appInfo = signal<InfoItem[]>([...]);
readonly routes = signal<RouteInfo[]>([]);
readonly componentTree = signal<ComponentNode[]>([...]);
readonly panelState = signal<PanelState>({...});
readonly events = signal<string[]>([...]);
readonly consoleLogs = signal<LogEntry[]>([]);
readonly networkRequests = signal<NetworkRequest[]>([]);
readonly localStorageItems = signal<StorageItem[]>([]);
readonly sessionStorageItems = signal<StorageItem[]>([]);
readonly performanceMetrics = signal<PerformanceMetric[]>([]);

// Computed Signals
readonly activeTabLabel = computed(() => {...});
readonly sessionDuration = computed(() => {...});
readonly consoleErrorCount = computed(() => {...});
```

### Methods

#### toggle()

Toggles the panel between expanded and collapsed states.

```typescript
toggle(): void
```

#### selectTab(tabId)

Switches to a different tab and refreshes tab-specific data.

```typescript
selectTab(tabId: TabId): void
```

**Parameters**:
- `tabId`: The ID of the tab to select

#### clearConsole()

Clears all console logs.

```typescript
clearConsole(): void
```

#### clearNetwork()

Clears all network request records.

```typescript
clearNetwork(): void
```

#### clearStorage(type)

Clears specified storage type.

```typescript
clearStorage(type: 'local' | 'session'): void
```

#### getSummary()

Returns a context-aware summary string for the collapsed bar.

```typescript
getSummary(): string
```

**Returns examples**:
- Info: "Uptime: 1m 23s"
- Routes: "5 navigations"
- Components: "4 components"
- Console: "2 errors/warnings" or "No errors"
- Network: "12 requests"
- Storage: "3 items"

---

## Styling

### CSS Classes

| Class | Description |
|-------|-------------|
| `.devtools-container` | Main container |
| `.devtools-container.expanded` | Expanded state modifier |
| `.devtools-bar` | Collapsed bar / header |
| `.devtools-bar-content` | Bar content wrapper |
| `.devtools-icon` | Gear icon (animated) |
| `.devtools-text` | "DevTools" text |
| `.devtools-hint` | Tab summary hint |
| `.uptime` | Session uptime display |
| `.devtools-toggle-icon` | +/- toggle icon |
| `.devtools-panel` | Expanded panel content |
| `.tabs-header` | Tabs navigation header |
| `.tab-button` | Individual tab button |
| `.tab-button.active` | Active tab modifier |
| `.tab-badge` | Error/warning badge |
| `.tabs-content` | Tab content area |
| `.tab-panel` | Individual tab panel |
| `.tab-header-with-actions` | Header with action buttons |
| `.tab-actions` | Action buttons container |
| `.action-button` | Clear/action buttons |
| `.info-sections` | Info grid container |
| `.info-section` | Category section |
| `.info-row` | Single info item |
| `.route-item` | Route history item |
| `.component-tree` | Component tree container |
| `.component-item` | Single component |
| `.events-list` | Events list container |
| `.event-item` | Single event |
| `.console-list` | Console logs container |
| `.console-item` | Single log entry |
| `.console-log/warn/error/info/debug` | Log type modifiers |
| `.network-list` | Network requests container |
| `.network-header` | Network table header |
| `.network-item` | Single request |
| `.network-method` | HTTP method badge |
| `.storage-sections` | Storage container |
| `.storage-section` | Local/Session section |
| `.storage-item` | Key-value pair |
| `.performance-sections` | Performance container |
| `.performance-item` | Single metric |
| `.performance-bar` | Visual progress bar |
| `.settings-grid` | Settings grid |
| `.setting-item` | Single setting |
| `.features-list` | Features checklist |
| `.empty-state` | Empty state placeholder |

### CSS Variables (Suggested)

```css
:root {
  --devtools-height-collapsed: 40px;
  --devtools-height-expanded: 450px;
  --devtools-bg-dark: #0d1117;
  --devtools-bg-light: #161b22;
  --devtools-border: #30363d;
  --devtools-accent: #4a9eff;
  --devtools-text-primary: #c9d1d9;
  --devtools-text-secondary: #8b949e;
  --devtools-success: #27ae60;
  --devtools-warning: #f39c12;
  --devtools-error: #e74c3c;
}
```

### Color Scheme

| Element | Color | Usage |
|---------|-------|-------|
| Background (dark) | `#0d1117` | Main panel background |
| Background (light) | `#161b22` | Cards, tabs, lists |
| Border | `#30363d` | Dividers, cards |
| Accent | `#4a9eff` | Active states, highlights |
| Text (primary) | `#c9d1d9` | Main text |
| Text (secondary) | `#8b949e` | Labels, hints |
| Success | `#27ae60` | Success states, info logs |
| Warning | `#f39c12` | Warning logs |
| Error | `#e74c3c` | Error logs, badges |
| Debug | `#9b59b6` | Debug logs |

### Animations

#### Gear Spin

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.devtools-icon {
  animation: spin 10s linear infinite;
}
```

#### Slide Up (Expand)

```css
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

#### Transition

```css
.devtools-container:not(.expanded) {
  transition: all 0.2s ease;
}
```

---

## Customization

### Changing Dimensions

Edit component constants:

```typescript
export class DevtoolsComponent {
  readonly COLLAPSED_HEIGHT = 50;  // Custom collapsed height
  readonly EXPANDED_HEIGHT = 500;  // Custom expanded height
}
```

Update CSS:

```css
.devtools-bar {
  height: 50px;  /* Match COLLAPSED_HEIGHT */
}

.devtools-panel {
  height: 500px;  /* Match EXPANDED_HEIGHT */
}
```

### Adding New Tabs

1. Add tab type to union:
```typescript
type TabId = 'info' | 'routes' | ... | 'mytab';
```

2. Add tab to tabs array:
```typescript
readonly tabs = signal<Tab[]>([
  // ... existing tabs
  { id: 'mytab', label: 'My Tab' },
]);
```

3. Add data signal:
```typescript
readonly myTabData = signal<MyDataType[]>([]);
```

4. Add tab content in template:
```html
@if (activeTab() === 'mytab') {
  <div class="tab-panel">
    <h3>My Tab Content</h3>
    <!-- Content here -->
  </div>
}
```

5. Update getSummary method:
```typescript
getSummary(): string {
  switch (this.activeTab()) {
    case 'mytab':
      return 'My tab summary';
    // ... other cases
  }
}
```

### Customizing Colors

Edit CSS values directly or add CSS variables:

```css
.devtools-bar {
  background: linear-gradient(135deg, #your-color-1 0%, #your-color-2 100%);
}

.tab-button.active {
  border-bottom-color: #your-accent-color;
}
```

### Disabling Features

To disable specific features (e.g., console interception):

```typescript
constructor() {
  this.setupRouterTracking();
  // this.setupConsoleIntercept();  // Comment out to disable
  this.setupNetworkTracking();
  this.loadStorageData();
  this.loadPerformanceMetrics();
  this.startUptimeTimer();
}
```

---

## Best Practices

### 1. Performance

```typescript
// ✅ Good: Use signals for reactivity
readonly isExpanded = signal<boolean>(false);

// ✅ Good: Computed values
readonly sessionDuration = computed(() => {...});

// ✅ Good: Batch updates
this.panelState.update(s => ({ ...s, expanded, activeTab, lastUpdate }));
```

### 2. Console Interception

```typescript
// ✅ Good: Preserve original console methods
const originalLog = console.log;
console.log = (...args) => {
  addLog('log', args);
  originalLog.apply(console, args);  // Still log to browser console
};

// ❌ Avoid: Swallowing console output
console.log = (...args) => {
  addLog('log', args);  // Original logs lost
};
```

### 3. Network Tracking

```typescript
// ✅ Good: Track request lifecycle
window.fetch = async (...args) => {
  const id = generateId();
  const startTime = performance.now();
  
  // Record request start
  this.networkRequests.update(reqs => [...reqs, {...}]);
  
  try {
    const response = await originalFetch.apply(window, args);
    const duration = performance.now() - startTime;
    
    // Update with response
    this.networkRequests.update(reqs => reqs.map(r =>
      r.id === id ? { ...r, status: response.status, duration } : r
    ));
    return response;
  } catch (error) {
    // Handle error
    throw error;
  }
};
```

### 4. Memory Management

```typescript
// ✅ Good: Use setInterval with clear
private intervalId?: number;

private startUptimeTimer(): void {
  this.intervalId = window.setInterval(() => {
    this.panelState.update(s => ({ ...s, uptime: this.sessionDuration() }));
  }, 1000);
}

// In ngOnDestroy (if implementing)
ngOnDestroy() {
  if (this.intervalId) {
    clearInterval(this.intervalId);
  }
}
```

### 5. Accessibility

```html
<!-- ✅ Good: Semantic buttons with titles -->
<button class="action-button" (click)="clearConsole()" title="Clear console logs">
  Clear
</button>

<!-- ✅ Good: Keyboard navigation -->
<button class="tab-button" [class.active]="activeTab() === tab.id">
  {{ tab.label }}
</button>
```

### 6. Responsive Design

```css
/* Consider mobile viewports */
@media (max-width: 768px) {
  .devtools-hint {
    display: none;  /* Hide summary on mobile */
  }

  .network-item {
    grid-template-columns: 60px 1fr 50px;  /* Fewer columns */
  }
}
```

---

## Integration

### Adding to App Component

```typescript
import { DevtoolsComponent } from './devtools/devtools.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DevtoolsComponent],
  template: `
    <router-outlet></router-outlet>
    <app-devtools></app-devtools>
  `,
})
export class AppComponent {}
```

### Conditional Display (Development Only)

```typescript
import { environment } from '../environments/environment';

@Component({
  template: `
    <router-outlet></router-outlet>
    @if (!environment.production) {
      <app-devtools></app-devtools>
    }
  `,
})
```

### Accessing DevTools Programmatically

```typescript
// In any component
@ViewChild(DevtoolsComponent) devTools?: DevtoolsComponent;

// Expand programmatically
this.devTools?.toggle();

// Switch tab
this.devTools?.selectTab('network');
```

---

## Troubleshooting

### Panel Not Toggling

**Check**:
1. Click handler is attached: `(click)="toggle()"`
2. No CSS `pointer-events: none` on bar
3. Z-index is high enough (9999)

### Console Logs Not Appearing

**Check**:
1. Console interception is set up in constructor
2. Browser console still works (original methods preserved)
3. No TypeScript errors in devtools component

### Network Requests Not Tracked

**Check**:
1. `setupNetworkTracking()` is called in constructor
2. Application uses `fetch` API (not XMLHttpRequest directly)
3. No errors in browser console

### Performance Metrics Empty

**Check**:
1. Browser supports Performance API
2. Navigation timing available (not about:blank)
3. Memory metrics only work in Chrome/Edge

### Storage Tab Shows Empty

**Check**:
1. Storage is not empty
2. No security restrictions (incognito mode)
3. `loadStorageData()` is called when switching to tab

### Tabs Not Scrolling

**Check**:
1. `.tabs-header` has `overflow-x: auto`
2. More tabs than container width
3. Scrollbar styles not hiding scrollbar

---

## Related Documentation

- [Components Guide](./04-components.md) - Component patterns
- [Styling Guide](./05-styling.md) - CSS conventions
- [Architecture](./02-architecture.md) - Application structure

---

**Last Updated**: March 2026
**Version**: 2.0.0
