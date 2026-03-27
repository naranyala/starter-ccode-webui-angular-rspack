# WinBox Panel Guide

Comprehensive guide to the WinBox.js window management system with the custom top panel interface.

## Table of Contents

- [Overview](#overview)
- [Panel Structure](#panel-structure)
- [Window Management](#window-management)
- [Service API](#service-api)
- [Component API](#component-api)
- [Styling](#styling)
- [Keyboard Shortcuts](#keyboard-shortcuts)

## Overview

The WinBox Panel is a custom window management system built on top of WinBox.js, providing a modern tab-based interface for managing multiple windows.

### Key Features

| Feature | Description |
|---------|-------------|
| **Fixed Top Panel** | Always visible, 76px height (two rows) |
| **Tab-Based Navigation** | Switch between windows via tabs |
| **Auto-Maximize** | Windows fill available space |
| **Syntax Highlighting** | Prism.js for code blocks |
| **Copy to Clipboard** | One-click code copying |
| **Home Button** | Hide/show all windows |

### Visual Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 🪟 Window Manager    [3 windows]          ⬆ All  ⬇ All         │ ← Header (36px)
├─────────────────────────────────────────────────────────────────┤
│ 🏠 Home │ ● Tab1 │ ● Tab2 │ ● Tab3 │                           │ ← Tabs (36px)
└─────────────────────────────────────────────────────────────────┘
  ↓ 8px margin
┌─────────────────────────────────────────────────────────────────┐
│┌───────────────────────────────────────────────────────────────┐│
││  WinBox Window (maximized, respects panel)                    ││
││  ┌─────────────────────────────────────────────────────────┐  ││
││  │ typescript  ·  Click to copy                            │  ││
││  ├─────────────────────────────────────────────────────────┤  ││
││  │ @Component({...})                                       │  ││
││  └─────────────────────────────────────────────────────────┘  ││
│└───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

## Panel Structure

### Two-Row Design

#### Row 1: Header (36px)

| Element | Position | Function |
|---------|----------|----------|
| 🪟 Icon + Title | Left | App branding |
| [N windows] badge | Left | Window count |
| ⬆ All button | Right | Restore all minimized |
| ⬇ All button | Right | Minimize all |

**CSS:**
```css
.winxbox-panel-header {
  height: 36px;
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border-bottom: 1px solid #0f3460;
}
```

#### Row 2: Tabs (36px)

| Element | Position | Function |
|---------|----------|----------|
| 🏠 Home | First | Hide all windows |
| Window Tabs | Middle | Switch/focus windows |
| Tab Spacer | Right | Pushes content |

**CSS:**
```css
.winxbox-tabs {
  height: 36px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 2px solid #3498db;
}
```

### Z-Index Hierarchy

```
10000 - WinBox Panel (topmost)
 9998 - WinBox Windows
   10 - Search bars (sticky)
    0 - Page content
```

## Window Management

### Window Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    Window Lifecycle                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Create                                                  │
│     ┌─────────────────────────────────────────────────┐    │
│     │ windowService.createWindow({...})               │    │
│     └─────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│  2. Initialize                                              │
│     ┌─────────────────────────────────────────────────┐    │
│     │ - Generate unique ID                            │    │
│     │ - Create WinBox instance                        │    │
│     │ - Apply maximized dimensions                    │    │
│     │ - Add to windows list                           │    │
│     └─────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│  3. Display                                                 │
│     ┌─────────────────────────────────────────────────┐    │
│     │ - Show in panel as tab                          │    │
│     │ - Focus window                                  │    │
│     │ - Apply syntax highlighting                     │    │
│     └─────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│  4. Interact                                                │
│     ┌─────────────────────────────────────────────────┐    │
│     │ - Focus/blur                                    │    │
│     │ - Minimize/restore                              │    │
│     │ - Resize/move                                   │    │
│     └─────────────────────────────────────────────────┘    │
│                          │                                  │
│                          ▼                                  │
│  5. Close                                                   │
│     ┌─────────────────────────────────────────────────┐    │
│     │ - Remove from list                              │    │
│     │ - Destroy WinBox instance                       │    │
│     │ - Update panel tabs                             │    │
│     └─────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Window States

| State | Description | Visual Indicator |
|-------|-------------|------------------|
| **Active** | Currently focused | Highlighted tab, blue border |
| **Inactive** | In background | Normal tab |
| **Minimized** | Hidden in panel | Dimmed tab |
| **Hidden** | All windows hidden | Home button green |

### Auto-Maximize Behavior

Windows are created maximized by default:

```typescript
// Default dimensions
width: window.innerWidth           // Full width
height: window.innerHeight - 76    // Full height - panel
x: 0                               // Left edge
y: 76                              // Below panel
```

**Respects:**
- Top panel (76px + 8px margin = 84px offset)
- Browser window size
- Resize events (auto-adjusts)

## Service API

### WinBoxWindowService

Located: `src/app/shared/winbox-window.service.ts`

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `windowsList` | `Signal<WinBoxWindow[]>` | All windows |
| `activeWindow` | `Signal<WinBoxWindow \| null>` | Currently focused |
| `hasWindows` | `Signal<boolean>` | Any windows exist |
| `hasMinimized` | `Signal<boolean>` | Any minimized |
| `areAllHidden` | `Signal<boolean>` | All hidden state |

#### Methods

##### createWindow(options)

Create a new window.

```typescript
interface CreateWindowOptions {
  title: string;
  width?: number | string;
  height?: number | string;
  x?: number | string;
  y?: number | string;
  html?: string;
  background?: string;
  onclose?: () => void;
  maximize?: boolean;  // Default: true
}

// Usage
const win = this.windowService.createWindow({
  title: 'My Window',
  html: '<div>Content</div>',
  background: '#3498db',
  maximize: true,  // Auto-maximize
});
```

##### setActiveWindow(id)

Focus a specific window.

```typescript
this.windowService.setActiveWindow('winbox-123-abc');
```

##### minimizeWindow(id) / restoreWindow(id)

Toggle window visibility.

```typescript
this.windowService.minimizeWindow('winbox-123-abc');
this.windowService.restoreWindow('winbox-123-abc');
```

##### hideAll() / showAll() / toggleAll()

Bulk hide/show operations.

```typescript
// Hide all (for Home button)
this.windowService.hideAll();

// Show all
this.windowService.showAll();

// Toggle
this.windowService.toggleAll();
```

##### closeWindow(id) / closeAll()

Close windows.

```typescript
this.windowService.closeWindow('winbox-123-abc');
this.windowService.closeAll();
```

## Component API

### WinBoxPanelComponent

Located: `src/app/shared/winbox-panel.component.ts`

#### Template Structure

```html
<div class="winbox-panel-container">
  <!-- Header Row -->
  <div class="winbox-panel-header">
    <div class="app-title">...</div>
    <div class="header-actions">...</div>
  </div>
  
  <!-- Tabs Row -->
  <div class="winbox-tabs">
    <div class="home-tab">🏠 Home</div>
    @for (win of windows(); track win.id) {
      <div class="winbox-tab">● {{ win.title }}</div>
    }
  </div>
</div>
```

#### Inputs/Outputs

| Input/Output | Type | Description |
|--------------|------|-------------|
| (none) | - | Component is self-contained |

#### Signals

| Signal | Type | Description |
|--------|------|-------------|
| `windows` | `computed` | Window list from service |
| `windowCount` | `computed` | Total windows |
| `hasMinimized` | `computed` | Has minimized windows |
| `allHidden` | `computed` | All windows hidden |

## Styling

### CSS Variables

```css
:root {
  --panel-height: 76px;
  --header-height: 36px;
  --tabs-height: 36px;
  --panel-bg-dark: #0f0f1a;
  --panel-bg-light: #1a1a2e;
  --accent-blue: #3498db;
  --accent-green: #27ae60;
}
```

### Theme Colors

| Element | Color | Usage |
|---------|-------|-------|
| Header Background | `#0f0f1a → #1a1a2e` | Gradient |
| Tabs Background | `#1a1a2e → #16213e` | Gradient |
| Home Button | `#3498db` | Blue (default) |
| Home Button | `#27ae60` | Green (all hidden) |
| Active Tab | `#3498db` | Blue border |
| Minimized Tab | `rgba(0,0,0,0.2)` | Dimmed |

### Responsive Breakpoints

```css
/* Desktop (> 768px) */
.winxbox-tab {
  max-width: 200px;
}

/* Mobile (≤ 768px) */
@media (max-width: 768px) {
  .winxbox-tab {
    max-width: 140px;
  }
  
  .home-text {
    display: none;  /* Show icon only */
  }
}
```

## Keyboard Shortcuts

| Shortcut | Action | Scope |
|----------|--------|-------|
| (None currently) | - | - |

**Note:** Keyboard shortcuts were removed when the panel became non-collapsible. Future enhancement opportunity.

## Code Block Features

### Syntax Highlighting

Powered by Prism.js with dark theme.

**Supported Languages:**
- TypeScript (`language-typescript`)
- CSS (`language-css`)
- SCSS (`language-scss`)
- HTML (`language-html`)

### Copy to Clipboard

```typescript
// Automatic copy handler
pre.addEventListener('click', () => {
  navigator.clipboard.writeText(code.textContent);
  pre.classList.add('copied');
  setTimeout(() => pre.classList.remove('copied'), 2000);
});
```

**Visual States:**
```
Default:  "typescript  ·  Click to copy"
Hover:    Blue highlight
Copied:   "typescript  ·  ✓ Copied to clipboard!" (green)
```

## Best Practices

### 1. Window Creation

```typescript
// ✅ Good: Use service, auto-maximize
this.windowService.createWindow({
  title: 'My Component',
  html: this.getComponentHtml(),
});

// ❌ Bad: Direct WinBox usage
new WinBox({ title: 'My Component' });
```

### 2. Window Cleanup

```typescript
// ✅ Good: Let service handle cleanup
onclose: () => {
  this.windowService.removeWindow(id);
  return false;  // Prevent default close
}

// ❌ Bad: Don't bypass service
onclose: () => true  // Won't update panel
```

### 3. Content Styling

```typescript
// ✅ Good: Add padding via service
setTimeout(() => {
  win.instance.body.style.padding = '24px';
}, 0);

// ❌ Bad: Inline styles in HTML
html: '<div style="padding: 24px">...</div>'
```

## Troubleshooting

### Windows Not Appearing

**Check:**
1. WinBox.js loaded in `index.html`
2. Service injected correctly
3. Browser console for errors

### Panel Not Updating

**Check:**
1. Signal updates in service
2. Component subscriptions
3. Change detection

### Syntax Highlighting Not Working

**Check:**
1. Prism.js files in `public/prism/`
2. Scripts loaded in `index.html`
3. Language classes on `<code>` elements

## Next Steps

- [Components Guide](./04-components.md) - Component documentation
- [Styling Guide](./05-styling.md) - CSS customization
- [Improvement Suggestions](./07-improvements.md) - Future enhancements
