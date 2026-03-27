# Styling Guide

Comprehensive guide to CSS architecture, theming, and styling conventions.

## Table of Contents

- [Overview](#overview)
- [Theme System](#theme-system)
- [CSS Architecture](#css-architecture)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing](#spacing)
- [Component Styling](#component-styling)
- [Responsive Design](#responsive-design)
- [Dark Theme](#dark-theme)
- [Best Practices](#best-practices)

## Overview

### Styling Approach

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| **Strategy** | CSS Custom Properties (Variables) | Centralized theming, easy customization |
| **Format** | External `.css` files + shared theme | Consistency across components |
| **Preprocessor** | Plain CSS + SCSS support | Simplicity with power when needed |
| **Naming** | BEM-inspired with theme variables | Clear, consistent selectors |

### Theme System

The application uses a centralized theme system with CSS custom properties.

**Files:**
- `src/app/shared/theme.css` - CSS variables and global styles
- `src/app/shared/theme.ts` - TypeScript constants for programmatic access

**Usage in CSS:**
```css
.element {
  color: var(--color-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

**Usage in TypeScript:**
```typescript
import { THEME, getCssVariable } from './shared/theme';

// Using constants
const color = THEME.colors.primary;

// Using CSS variables
const color = getCssVariable('--color-primary');
```

## CSS Architecture

### Global Styles

**File:** `src/styles.css`

```css
/* Reset & Base */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, ...;
  background: #f5f5f5;
  color: #333;
  line-height: 1.6;
  overflow: hidden;
}

/* WinBox Overrides */
.winbox {
  z-index: 9998 !important;
}

.winbox-body {
  margin: 0 !important;
  padding: 0 !important;
}

/* Hide WinBox minimized bar */
.winbox-min, .wb-min, .winbox-dock {
  display: none !important;
}
```

### Component Styles

**Pattern:** Component-specific prefix

```css
/* Home Component */
.home-container { }
.home-container h1 { }
.search-box { }
.cards-list { }
.card { }
.card-category { }
.card-title { }
.card-description { }

/* Demo Component */
.demo-container { }
.demo-container h1 { }
.cards-list { }
.card { }
.card-icon { }
.card-content { }

/* WinBox Panel */
.winxbox-panel-container { }
.winxbox-panel-header { }
.winxbox-tabs { }
.home-tab { }
.winxbox-tab { }
```

## Color System

### Primary Palette

| Name | Hex | Usage |
|------|-----|-------|
| Blue | `#3498db` | Primary actions, links, accents |
| Blue Dark | `#2980b9` | Hover states |
| Blue Light | `#5dade2` | Highlights |

### Secondary Palette

| Name | Hex | Usage |
|------|-----|-------|
| Green | `#27ae60` | Success, "all hidden" state |
| Green Dark | `#1e8449` | Success hover |
| Red | `#e74c3c` | Close buttons, errors |
| Orange | `#f39c12` | Warnings, minimized indicator |

### Neutral Palette

| Name | Hex | Usage |
|------|-----|-------|
| Dark 1 | `#0f0f1a` | Panel header background |
| Dark 2 | `#1a1a2e` | Panel tabs background |
| Dark 3 | `#16213e` | Panel gradient end |
| Dark 4 | `#1f2940` | Tab background |
| Gray 1 | `#666` | Secondary text |
| Gray 2 | `#999` | Disabled text |
| Gray 3 | `#e0e0e0` | Borders |
| Light | `#f5f5f5` | Page background |
| White | `#ffffff` | Card backgrounds |

### Gradient Definitions

```css
/* Panel Header */
background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);

/* Panel Tabs */
background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);

/* Home Button */
background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);

/* Home Button (Hidden State) */
background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
```

## Typography

### Font Stack

```css
font-family:
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  Roboto,
  Oxygen,
  Ubuntu,
  Cantarell,
  "Open Sans",
  "Helvetica Neue",
  sans-serif;
```

### Font Sizes

| Element | Size | Weight | Line Height |
|---------|------|--------|-------------|
| H1 | 1.5rem (24px) | 700 | 1.3 |
| H2 | 1.25rem (20px) | 600 | 1.4 |
| H3 | 1.1rem (18px) | 600 | 1.4 |
| H4 | 1rem (16px) | 600 | 1.5 |
| Body | 0.95rem (15px) | 400 | 1.6 |
| Small | 0.85rem (14px) | 400 | 1.5 |
| Tiny | 0.75rem (12px) | 500 | 1.4 |

### Text Colors

```css
/* Primary Text */
color: #1a1a2e;

/* Secondary Text */
color: #666;

/* Disabled/Placeholder */
color: #999;

/* Links/Accents */
color: #3498db;

/* Success */
color: #27ae60;

/* Error */
color: #e74c3c;
```

## Spacing

### Spacing Scale

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Small gaps |
| md | 16px | Standard spacing |
| lg | 24px | Large sections |
| xl | 32px | Extra large |
| 2xl | 40px | Page margins |

### Component Spacing Examples

```css
/* Card Component */
.card {
  padding: 10px 14px;      /* md horizontal */
  gap: 12px;               /* sm-md */
  margin-bottom: 6px;      /* xs-sm */
}

/* Container */
.home-container {
  padding: 60px 16px 24px; /* xl md lg */
  max-width: 700px;
}

/* Search Box */
.search-box {
  margin-bottom: 16px;     /* md */
  padding: 8px 0;          /* sm */
}
```

## Component Styling

### Cards

```css
.card {
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 10px 14px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.card:hover {
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border-color: #3498db;
}

.card-category {
  font-size: 0.6rem;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
  background: #3498db;
  padding: 3px 6px;
  border-radius: 4px;
}
```

### Code Blocks

```css
.card-content pre {
  border-radius: 10px;
  overflow: hidden;
  margin: 16px 0;
  border: 1px solid #2d2d44;
  background: #1a1a2e;
}

.card-content pre::before {
  content: attr(data-language) ' · Click to copy';
  display: block;
  padding: 6px 16px;
  background: #0f0f1a;
  border-bottom: 1px solid #2d2d44;
  color: #666;
  font-size: 0.7rem;
  text-transform: uppercase;
}

.card-content pre:hover::before {
  color: #3498db;
  background: #12121f;
}

.card-content pre.copied::before {
  content: attr(data-language) ' · ✓ Copied to clipboard!';
  color: #27ae60;
  background: rgba(39, 174, 96, 0.1);
}
```

### Buttons

```css
.header-action-button {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #a0a0a0;
  font-size: 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.header-action-button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: #3498db;
}
```

## Responsive Design

### Breakpoints

| Name | Width | Target |
|------|-------|--------|
| Mobile | ≤ 600px | Phones |
| Tablet | ≤ 768px | Tablets |
| Desktop | > 768px | Desktops |

### Mobile Styles

```css
@media (max-width: 600px) {
  .home-container {
    padding: 16px;
  }
  
  .home-container h1 {
    font-size: 1.5rem;
  }
  
  .card {
    padding: 14px 16px;
  }
  
  .card-category {
    font-size: 0.65rem;
  }
  
  .home-text {
    display: none;  /* Icon only */
  }
}
```

### Responsive Patterns

```css
/* Fluid Typography */
h1 {
  font-size: clamp(1.5rem, 4vw, 2rem);
}

/* Responsive Container */
.container {
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
}

/* Flexible Grid */
.cards-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
```

## Dark Theme

### Panel Dark Theme

```css
.winxbox-panel-header {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
  border-bottom: 1px solid #0f3460;
}

.winxbox-tabs {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 2px solid #3498db;
}

.winxbox-tab {
  background: rgba(255, 255, 255, 0.05);
  color: #a0a0a0;
}

.winxbox-tab.active {
  background: rgba(52, 152, 219, 0.2);
  color: #fff;
  border-top-color: #3498db;
}
```

### Code Block Dark Theme

```css
.card-content pre {
  background: #1a1a2e;
  color: #f8f8f2;
}

.card-content pre::before {
  background: #0f0f1a;
  color: #666;
}

/* Prism.js Override */
.card-content pre[class*="language-"] {
  background: #1a1a2e !important;
}
```

## Best Practices

### 1. Specificity

```css
/* ✅ Good: Low specificity */
.card { }
.card-title { }

/* ❌ Bad: High specificity */
div.home-container div.card h3.card-title { }
```

### 2. Reusability

```css
/* ✅ Good: Reusable utility */
.text-muted { color: #666; }
.mt-4 { margin-top: 16px; }

/* ❌ Bad: One-off styles */
.home-container .card .title { }
```

### 3. Performance

```css
/* ✅ Good: Efficient selectors */
.card { }
.card-title { }

/* ❌ Bad: Expensive selectors */
.card > div > span:first-child { }
```

### 4. Maintainability

```css
/* ✅ Good: Clear naming */
.search-input { }
.search-icon { }
.search-clear-btn { }

/* ❌ Bad: Unclear naming */
.si { }
.sic { }
.sicb { }
```

### 5. CSS Variables (Future)

```css
:root {
  --color-primary: #3498db;
  --color-success: #27ae60;
  --spacing-md: 16px;
  --font-size-base: 0.95rem;
}

.card {
  padding: var(--spacing-md);
  color: var(--color-primary);
}
```

## Animation Guidelines

### Transitions

```css
/* Standard transition */
.card {
  transition: transform 0.2s, box-shadow 0.2s;
}

/* Hover state */
.card:hover {
  transform: translateX(3px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
```

### Keyframe Animations

```css
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card {
  animation: fadeIn 0.3s ease-out;
}
```

## Next Steps

- [Build & Deploy](./06-build-deploy.md) - Build process
- [Improvement Suggestions](./07-improvements.md) - Future enhancements
