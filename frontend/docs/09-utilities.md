# Utilities Documentation

Comprehensive guide to the reusable utilities, services, pipes, and directives available in this project.

## Table of Contents

- [Overview](#overview)
- [Services](#services)
  - [StorageService](#storageservice)
  - [ClipboardService](#clipboardservice)
  - [PlatformService](#platformservice)
  - [NotificationService](#notificationservice)
- [Utility Functions](#utility-functions)
  - [Format Utilities](#format-utilities)
  - [String Utilities](#string-utilities)
  - [Validation Utilities](#validation-utilities)
  - [Time Utilities](#time-utilities)
  - [Array Utilities](#array-utilities)
  - [Object Utilities](#object-utilities)
- [Pipes](#pipes)
  - [Format Pipes](#format-pipes)
  - [String Pipes](#string-pipes)
- [Directives](#directives)
- [Usage Examples](#usage-examples)

---

## Overview

The utilities library provides a comprehensive set of reusable functions, services, pipes, and directives to accelerate development and maintain consistency across the application.

### File Structure

```
src/app/shared/
├── services/
│   ├── storage.service.ts       # LocalStorage/SessionStorage management
│   ├── clipboard.service.ts     # Copy/paste functionality
│   ├── platform.service.ts      # Platform/device detection
│   └── notification.service.ts  # Toast notifications
├── utils/
│   ├── format.utils.ts          # Number, byte, currency formatting
│   ├── string.utils.ts          # String manipulation
│   ├── validation.utils.ts      # Form validation helpers
│   ├── time.utils.ts            # Date/time formatting
│   ├── array.utils.ts           # Array operations
│   └── object.utils.ts          # Object operations
├── pipes/
│   ├── format.pipes.ts          # Angular format pipes
│   └── string.pipes.ts          # Angular string pipes
└── directives/
    └── index.ts                 # Custom directives
```

---

## Services

### StorageService

Reactive localStorage and sessionStorage management with signals.

```typescript
import { StorageService } from './shared/services/storage.service';
```

#### API

| Method | Description | Example |
|--------|-------------|---------|
| `getItem<T>(key, default?)` | Get item from localStorage | `storage.getItem<User>('user')` |
| `setItem<T>(key, value)` | Set item in localStorage | `storage.set('theme', 'dark')` |
| `removeItem(key)` | Remove item | `storage.remove('token')` |
| `clear()` | Clear all localStorage | `storage.clear()` |
| `watch<T>(key, default)` | Get reactive signal | `const theme = storage.watch('theme', 'light')` |
| `getSessionItem<T>(key)` | Get from sessionStorage | `storage.getSessionItem('session')` |
| `setSessionItem<T>(key, value)` | Set in sessionStorage | `storage.setSessionItem('cache', data)` |
| `has(key)` | Check if key exists | `storage.has('user')` |
| `keys()` | Get all keys | `storage.keys()` |
| `getUsage()` | Get storage quota info | `await storage.getUsage()` |

#### Usage

```typescript
@Component({
  standalone: true,
  template: `
    <p>Theme: {{ theme() }}</p>
    <button (click)="toggleTheme()">Toggle</button>
  `,
})
export class ThemeComponent {
  private themeSignal = this.storage.watch<string>('theme', 'light');
  readonly theme = this.themeSignal;

  constructor(private storage: StorageService) {}

  toggleTheme() {
    this.storage.set('theme', this.theme() === 'light' ? 'dark' : 'light');
  }
}
```

---

### ClipboardService

Copy/paste functionality with fallbacks and notifications.

```typescript
import { ClipboardService } from './shared/services/clipboard.service';
```

#### API

| Method | Description | Example |
|--------|-------------|---------|
| `copy(text, options?)` | Copy text to clipboard | `clipboard.copy('Hello')` |
| `copyJson(obj, indent?)` | Copy formatted JSON | `clipboard.copyJson(data)` |
| `copyCode(code, lang)` | Copy code snippet | `clipboard.copyCode(code, 'typescript')` |
| `read()` | Read from clipboard | `const text = await clipboard.read()` |
| `isClipboardSupported()` | Check API support | `clipboard.isClipboardSupported()` |

#### Usage

```typescript
@Component({
  template: `
    <button (click)="copyCode()">Copy Code</button>
    <button (click)="copyLink()">Copy Link</button>
  `,
})
export class CodeBlockComponent {
  constructor(private clipboard: ClipboardService) {}

  async copyCode() {
    await this.clipboard.copyCode(this.code, 'typescript');
  }

  async copyLink() {
    await this.clipboard.copy(window.location.href, {
      successMessage: 'Link copied!',
    });
  }
}
```

---

### PlatformService

Platform detection and reactive viewport information.

```typescript
import { PlatformService } from './shared/services/platform.service';
```

#### API

| Method | Description |
|--------|-------------|
| `getPlatformInfo()` | Get comprehensive platform info |
| `getViewport()` | Get current viewport size |
| `watchViewport()` | Get reactive viewport signal |
| `watchBreakpoints()` | Get reactive breakpoint state |
| `isBreakpoint('md')` | Check current breakpoint |
| `getBreakpointClass()` | Get CSS class for breakpoint |
| `hasTouch()` | Check touch support |
| `isTouchCapable()` | Check touch capability |
| `getOS()` | Get OS name |
| `getBrowser()` | Get browser name |
| `isOnline()` | Check online status |
| `watchOnlineStatus()` | Watch online status |

#### Usage

```typescript
@Component({
  template: `
    @if (platform.isMobile()) {
      <mobile-nav />
    } @else {
      <desktop-nav />
    }
    <p>OS: {{ platform.getOS() }}</p>
    <p>Breakpoint: {{ platform.getBreakpointClass() }}</p>
  `,
})
export class ResponsiveComponent {
  readonly platform = inject(PlatformService);
}
```

---

### NotificationService

Toast notification system.

```typescript
import { NotificationService } from './shared/services/notification.service';
```

#### API

| Method | Description |
|--------|-------------|
| `success(message, title?, duration?)` | Show success toast |
| `error(message, title?, duration?)` | Show error toast |
| `warning(message, title?, duration?)` | Show warning toast |
| `info(message, title?, duration?)` | Show info toast |
| `show(options)` | Show custom notification |
| `dismiss(id)` | Dismiss specific notification |
| `dismissAll()` | Dismiss all notifications |
| `configure(config)` | Configure defaults |

#### Usage

```typescript
@Component({
  template: `
    <button (click)="save()">Save</button>
  `,
})
export class FormComponent {
  constructor(private notify: NotificationService) {}

  async save() {
    try {
      await this.api.save();
      this.notify.success('Changes saved successfully');
    } catch {
      this.notify.error('Failed to save changes', 'Error');
    }
  }
}
```

---

## Utility Functions

### Format Utilities

```typescript
import { formatBytes, formatDuration, formatCurrency, formatPercent } from './shared/utils';
```

| Function | Description | Example |
|----------|-------------|---------|
| `formatBytes(bytes, decimals)` | Format file size | `formatBytes(1536)` → `"1.5 KB"` |
| `formatDuration(ms)` | Format duration | `formatDuration(90000)` → `"1m 30s"` |
| `formatNumber(num, locale, opts)` | Format number | `formatNumber(1234.5, 'de-DE')` → `"1.234,5"` |
| `formatPercent(value, decimals)` | Format percentage | `formatPercent(0.875)` → `"87.5%"` |
| `formatCompact(num, decimals)` | Compact notation | `formatCompact(1500000)` → `"1.5M"` |
| `formatCurrency(amount, curr, locale)` | Format currency | `formatCurrency(19.99, 'EUR')` → `"€19.99"` |
| `formatSpeed(bps, decimals)` | Format speed | `formatSpeed(1048576)` → `"1 MB/s"` |
| `clamp(value, min, max)` | Clamp number | `clamp(15, 0, 10)` → `10` |
| `roundTo(value, decimals)` | Round to decimals | `roundTo(3.14159, 2)` → `3.14` |

---

### String Utilities

```typescript
import { truncate, slugify, capitalize, isEmail } from './shared/utils';
```

| Function | Description | Example |
|----------|-------------|---------|
| `truncate(str, length, suffix)` | Truncate with ellipsis | `truncate('Hello World', 8)` → `"Hello..."` |
| `truncateMiddle(str, max, split)` | Truncate from middle | `truncateMiddle('user@example.com', 15)` → `"user@...com"` |
| `capitalize(str)` | Capitalize first letter | `capitalize('hello')` → `"Hello"` |
| `titleCase(str)` | Title case | `titleCase('hello world')` → `"Hello World"` |
| `toCamelCase(str)` | Convert to camelCase | `toCamelCase('hello-world')` → `"helloWorld"` |
| `toKebabCase(str)` | Convert to kebab-case | `toKebabCase('helloWorld')` → `"hello-world"` |
| `slugify(str)` | URL-friendly slug | `slugify('Hello World!')` → `"hello-world"` |
| `stripHtml(html)` | Remove HTML tags | `stripHtml('<p>Hello</p>')` → `"Hello"` |
| `escapeHtml(str)` | Escape HTML entities | `escapeHtml('<script>')` → `"&lt;script&gt;"` |
| `isEmail(str)` | Validate email | `isEmail('test@example.com')` → `true` |
| `isUrl(str)` | Validate URL | `isUrl('https://example.com')` → `true` |
| `uuid()` | Generate UUID | `uuid()` → `"550e8400-e29b-..."` |

---

### Validation Utilities

```typescript
import { required, email, minLength, validate } from './shared/utils';
```

| Function | Description |
|----------|-------------|
| `required(value)` | Validate required field |
| `minLength(n)` | Validate minimum length |
| `maxLength(n)` | Validate maximum length |
| `min(n)` / `max(n)` | Validate number range |
| `email(value)` | Validate email format |
| `url(value)` | Validate URL format |
| `phone(value)` | Validate phone format |
| `pattern(regex, msg)` | Validate regex pattern |
| `passwordStrength(value)` | Validate password strength |
| `validate(value, validators)` | Run multiple validators |

#### Usage

```typescript
// Reactive Forms
password: ['', [
  Validators.required,
  passwordStrengthValidator
]]

// Template-driven
const result = validate(input, [
  required,
  minLength(8),
  passwordStrength
]);

if (!result.valid) {
  console.log(result.errors);
}
```

---

### Time Utilities

```typescript
import { formatDate, formatRelativeTime, isToday, addDays } from './shared/utils';
```

| Function | Description | Example |
|----------|-------------|---------|
| `formatDate(date, format, locale)` | Format date | `formatDate(new Date(), 'long')` |
| `formatTime(date, secs, hour12)` | Format time | `formatTime(new Date(), true)` |
| `formatDateTime(date)` | Format date+time | `formatDateTime(new Date())` |
| `formatRelativeTime(date)` | Relative time | `formatRelativeTime(yesterday)` → `"1 day ago"` |
| `isToday(date)` | Check if today | `isToday(new Date())` → `true` |
| `isYesterday(date)` | Check if yesterday | |
| `addDays(date, days)` | Add days | `addDays(new Date(), 7)` |
| `addMonths(date, months)` | Add months | |
| `diff(date1, date2, unit)` | Date difference | `diff(d1, d2, 'd')` |
| `startOfDay(date)` | Start of day | |
| `endOfMonth(date)` | End of month | |

---

### Array Utilities

```typescript
import { unique, groupBy, sortBy, chunk } from './shared/utils';
```

| Function | Description | Example |
|----------|-------------|---------|
| `unique(arr, keyFn?)` | Remove duplicates | `unique([1,2,2,3])` → `[1,2,3]` |
| `chunk(arr, size)` | Split into chunks | `chunk([1,2,3,4], 2)` → `[[1,2],[3,4]]` |
| `shuffle(arr)` | Shuffle array | `shuffle([1,2,3])` |
| `groupBy(arr, keyFn)` | Group by key | `groupBy(users, u => u.role)` |
| `sortBy(arr, keyFn, asc)` | Sort by key | `sortBy(users, u => u.name)` |
| `intersection(arr1, arr2)` | Array intersection | |
| `difference(arr1, arr2)` | Array difference | |
| `sum(arr, keyFn?)` | Sum values | `sum([1,2,3])` → `6` |
| `average(arr, keyFn?)` | Average values | `average([1,2,3])` → `2` |
| `range(start, end, step)` | Create range | `range(0, 5)` → `[0,1,2,3,4]` |

---

### Object Utilities

```typescript
import { get, set, pick, omit, deepClone } from './shared/utils';
```

| Function | Description | Example |
|----------|-------------|---------|
| `get(obj, path, default?)` | Get nested property | `get(obj, 'user.name', 'Unknown')` |
| `set(obj, path, value)` | Set nested property | `set(obj, 'user.name', 'John')` |
| `has(obj, path)` | Check property exists | `has(obj, 'user.email')` |
| `pick(obj, keys)` | Pick properties | `pick(obj, ['id', 'name'])` |
| `omit(obj, keys)` | Omit properties | `omit(obj, ['password'])` |
| `deepClone(obj)` | Deep clone object | `deepClone(config)` |
| `deepMerge(target, ...sources)` | Deep merge objects | `deepMerge(defaults, userPrefs)` |
| `flatten(obj)` | Flatten nested object | `flatten({a:{b:1}})` → `{'a.b':1}` |
| `isEqual(obj1, obj2)` | Deep equality check | `isEqual(obj1, obj2)` |

---

## Pipes

### Format Pipes

```typescript
import { FormatPipes } from './shared/pipes';
// or individual: import { FormatBytesPipe } from './shared/pipes';
```

```html
<!-- File sizes -->
{{ fileSize | formatBytes }}
{{ fileSize | formatBytes:1 }}

<!-- Duration -->
{{ durationMs | formatDuration }}

<!-- Numbers -->
{{ count | formatNumber }}
{{ count | formatNumber:'de-DE' }}

<!-- Percentage -->
{{ ratio | formatPercent }}
{{ ratio | formatPercent:2 }}

<!-- Compact notation -->
{{ followers | formatCompact }}

<!-- Currency -->
{{ price | formatCurrency }}
{{ price | formatCurrency:'EUR':'de-DE' }}

<!-- Dates -->
{{ date | formatDate:'long' }}
{{ date | formatDate:'relative' }}
{{ date | formatTime:true }}
{{ date | formatDateTime }}
{{ date | formatRelativeTime }}
```

---

### String Pipes

```typescript
import { StringPipes } from './shared/pipes';
```

```html
<!-- Truncation -->
{{ longText | truncate:100 }}
{{ email | truncateMiddle:20 }}

<!-- Case conversion -->
{{ title | capitalize }}
{{ title | titleCase }}
{{ text | toCamelCase }}
{{ text | toKebabCase }}
{{ text | slugify }}

<!-- HTML -->
{{ htmlContent | stripHtml }}
{{ userInput | escapeHtml }}

<!-- Other -->
{{ text | wordCount }}
{{ text | reverse }}
{{ code | pad:8:'0' }}
```

---

## Directives

```typescript
import { AllDirectives } from './shared/directives';
```

| Directive | Description | Usage |
|-----------|-------------|-------|
| `clickOutside` | Click outside handler | `<div (clickOutside)="close()">` |
| `longPress` | Long press detection | `<button (longPress)="onLong()" [longPressDuration]="500">` |
| `copyToClipboard` | Copy on click | `<button [copyToClipboard]="'text'">` |
| `autoFocus` | Auto focus element | `<input autoFocus>` |
| `inputDebounce` | Debounced input | `<input (inputDebounce)="search($event)" [debounceTime]="300">` |
| `resizeObserver` | Element resize events | `<div (resized)="onResize($event)" resizeObserver>` |
| `intersectionObserver` | Viewport intersection | `<div (intersected)="onIntersect($event)" intersectionObserver>` |
| `lazySrc` | Lazy load images | `<img [lazySrc]="imageUrl">` |

---

## Usage Examples

### Complete Component Example

```typescript
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Services
import { StorageService } from '../../shared/services/storage.service';
import { NotificationService } from '../../shared/services/notification.service';
import { PlatformService } from '../../shared/services/platform.service';

// Pipes
import { FormatPipes } from '../../shared/pipes/format.pipes';
import { StringPipes } from '../../shared/pipes/string.pipes';

// Directives
import { ClickOutsideDirective, InputDebounceDirective } from '../../shared/directives';

// Utils
import { formatBytes, debounce, isEmail } from '../../shared/utils';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ...FormatPipes,
    ...StringPipes,
    ClickOutsideDirective,
    InputDebounceDirective,
  ],
  template: `
    <div class="profile" (clickOutside)="closePanel()">
      <h2>{{ userName | titleCase }}</h2>
      <p>Storage: {{ storageUsage | formatBytes }}</p>
      <p>Joined: {{ joinDate | formatDate:'long' }}</p>

      <input
        type="email"
        [(ngModel)]="email"
        (inputDebounce)="validateEmail($event)"
        [debounceTime]="300"
        placeholder="Enter email"
      />

      @if (platform.isMobile()) {
        <mobile-actions />
      }

      <button (click)="saveProfile()">Save</button>
    </div>
  `,
})
export class UserProfileComponent {
  private storage = inject(StorageService);
  private notify = inject(NotificationService);
  readonly platform = inject(PlatformService);

  userName = 'john doe';
  email = '';
  joinDate = new Date('2024-01-01');
  storageUsage = this.storage.watch<number>('usage', 0)();

  validateEmail(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!isEmail(input.value)) {
      this.notify.warning('Please enter a valid email');
    }
  }

  saveProfile() {
    this.storage.set('profile', { name: this.userName, email: this.email });
    this.notify.success('Profile saved!');
  }

  closePanel() {
    console.log('Clicked outside');
  }
}
```

---

## Best Practices

1. **Import only what you need** - Use specific imports instead of importing everything
2. **Use pipes for templates** - Format data in templates using pipes for better performance
3. **Services are singleton** - All services are `providedIn: 'root'`
4. **Use signals for reactivity** - Services expose signals where appropriate
5. **Validate on both client and server** - Client validation is for UX, not security

---

**Last Updated:** March 2026
**Version:** 1.0.0
