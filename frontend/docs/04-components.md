# Components Guide

Documentation for all components in the application.

## Table of Contents

- [Overview](#overview)
- [Page Components](#page-components)
- [Shared Components](#shared-components)
- [Optional Components](#optional-components)
- [Component Patterns](#component-patterns)

## Overview

### Component Types

| Type | Location | Purpose |
|------|----------|---------|
| **Page** | `app/home`, `app/demo` | Route targets, full pages |
| **Shared** | `app/shared` | Reusable across app |
| **Optional** | `app/devtools` | Dev tools (commented out) |

### Component Hierarchy

```mermaid
graph TB
    subgraph Root["Root Level"]
        App["AppComponent<br/>app-root"]
    end
    
    subgraph Pages["Page Components"]
        Home["HomeComponent<br/>app-home"]
        Demo["DemoComponent<br/>app-demo"]
    end
    
    subgraph Shared["Shared Components"]
        WinBoxPanel["WinBoxPanelComponent<br/>app-winbox-panel"]
        ErrorModal["ErrorModalComponent<br/>app-error-modal"]
    end
    
    subgraph DevTools["DevTools (Optional)"]
        DevToolsPanel["DevToolsPanelComponent<br/>app-devtools-panel"]
    end
    
    App --> Pages
    App --> Shared
    App --> DevTools
    
    style Root fill:#161b22,stroke:#30363d,color:#e6edf3
    style Pages fill:#1f6feb,stroke:#30363d,color:#e6edf3
    style Shared fill:#238636,stroke:#30363d,color:#e6edf3
    style DevTools fill:#d29922,stroke:#30363d,color:#e6edf3
```

### Component Structure

Each component consists of:
- `.ts` file - Component class with logic
- `.css` file - Component styles
- (Optional) `.spec.ts` - Unit tests

## Page Components

### HomeComponent

**Path:** `src/app/home/home.component.ts`

**Purpose:** Main landing page with component cards list.

**Selector:** `<app-home>`

**Features:**
- Searchable card list
- WinBox window creation
- Code example display

**Properties:**
```typescript
searchQuery: Signal<string>
cards: Signal<Card[]>
filteredCards: Computed<Card[]>
```

**Methods:**
```typescript
openWindow(card: Card): void
```

**Template:**
```html
<div class="home-container">
  <h1>Angular Rspack Demo</h1>
  <p class="subtitle">A minimal Angular application...</p>
  
  <div class="search-box">
    <input [ngModel]="searchQuery()" 
           (ngModelChange)="searchQuery.set($event)" />
  </div>
  
  <div class="cards-list">
    @for (card of filteredCards(); track card.id) {
      <div class="card" (click)="openWindow(card)">
        <span class="card-category">{{ card.category }}</span>
        <div class="card-content">
          <h3 class="card-title">{{ card.title }}</h3>
          <p class="card-description">{{ card.description }}</p>
        </div>
      </div>
    }
  </div>
</div>
```

**Styles:** Located in `home.component.css`
- Compact card layout
- Sticky search bar
- Syntax highlighting

---

### DemoComponent

**Path:** `src/app/demo/demo.component.ts`

**Purpose:** Technology stack showcase with WinBox examples.

**Selector:** `<app-demo>`

**Features:**
- Technology cards
- Colored icons
- WinBox with custom backgrounds

**Properties:**
```typescript
searchQuery: string
cards: CardItem[]
filteredCards: Computed<CardItem[]>
```

**Methods:**
```typescript
openCard(card: CardItem): Promise<void>
```

**Card Data:**
```typescript
interface CardItem {
  title: string;
  description: string;
  icon: string;      // Emoji
  color: string;     // Background color
  content: string;   // HTML content for WinBox
  link?: string;     // External link
}
```

---

## Shared Components

### WinBoxPanelComponent

**Path:** `src/app/shared/winbox-panel.component.ts`

**Purpose:** Top panel for window management.

**Selector:** `<app-winbox-panel>`

**Features:**
- Two-row layout (header + tabs)
- Home button
- Window tabs
- Minimize/Restore/Close all buttons

**Properties:**
```typescript
collapsed: Signal<boolean>  // Not used (always expanded)
windows: Computed<WinBoxWindow[]>
windowCount: Computed<number>
hasMinimized: Computed<boolean>
allHidden: Computed<boolean>
```

**Methods:**
```typescript
onHomeClick(event: Event): void
onTabClick(win: WinBoxWindow): void
onCloseClick(win: WinBoxWindow, event: Event): void
minimizeAll(): void
restoreAll(): void
closeAll(): void
```

**Template Structure:**
```html
<div class="winbox-panel-container">
  <!-- Header Row (36px) -->
  <div class="winbox-panel-header">
    <div class="app-title">
      <span>🪟</span>
      <span>Window Manager</span>
      <span class="window-count-badge">{{ windowCount() }}</span>
    </div>
    <div class="header-actions">
      <button (click)="restoreAll()">⬆ All</button>
      <button (click)="minimizeAll()">⬇ All</button>
    </div>
  </div>
  
  <!-- Tabs Row (36px) -->
  <div class="winbox-tabs">
    <div class="home-tab" (click)="onHomeClick($event)">
      🏠 Home
    </div>
    @for (win of windows(); track win.id) {
      <div class="winbox-tab" (click)="onTabClick(win)">
        <span class="tab-color-dot"></span>
        <span class="tab-title">{{ win.title }}</span>
      </div>
    }
  </div>
</div>
```

**Styles:** Located in `winbox-panel.component.css`
- Dark gradient theme
- Responsive tabs
- Hover effects

---

## Optional Components

### DevToolsPanelComponent

**Path:** `src/app/devtools/devtools-panel.component.ts`

**Status:** Commented out in `app.component.ts`

**Purpose:** Angular DevTools for debugging.

**Features:**
- Component tree inspection
- Change detection profiling
- Network request tracking
- Console log interception

**To Enable:**
```typescript
// In app.component.ts
imports: [
  CommonModule, 
  RouterOutlet, 
  WinBoxPanelComponent,
  DevtoolsPanelComponent,  // Uncomment
  ErrorModalComponent,
],

template: `
  <app-winbox-panel></app-winbox-panel>
  <app-devtools></app-devtools>  <!-- Uncomment -->
  <router-outlet></router-outlet>
  <app-error-modal></app-error-modal>
`
```

---

### ErrorModalComponent

**Path:** `src/app/error-handling/error-modal.component.ts`

**Purpose:** Global error handling with modal display.

**Features:**
- Catches unhandled errors
- Displays error details
- User-friendly error messages

**Usage:** Automatically enabled via `WindowErrorHandler`

---

## Component Patterns

### 1. Standalone Components

All components are standalone (no NgModules):

```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.css'],
})
export class ExampleComponent {}
```

### 2. Signal-Based Reactivity

```typescript
export class ExampleComponent {
  // Writable signal
  count = signal(0);
  
  // Computed signal
  doubleCount = computed(() => this.count() * 2);
  
  // Update
  increment() {
    this.count.update(c => c + 1);
  }
}
```

### 3. Inject Function

```typescript
export class ExampleComponent {
  // Service injection
  private service = inject(MyService);
  
  // Router injection
  private router = inject(Router);
}
```

### 4. Template Syntax

#### Control Flow (Angular 17+)

```html
<!-- If statement -->
@if (condition) {
  <div>Show</div>
} @else {
  <div>Hide</div>
}

<!-- For loop -->
@for (item of items; track item.id) {
  <div>{{ item.name }}</div>
} @empty {
  <div>No items</div>
}

<!-- Switch -->
@switch (value) {
  @case ('A') { Case A }
  @default { Default }
}
```

### 5. Event Handling

```html
<!-- Click event -->
<button (click)="onClick($event)">Click</button>

<!-- Two-way binding -->
<input [ngModel]="value" (ngModelChange)="value.set($event)" />

<!-- Event with modifier -->
<input (keyup.enter)="onEnter()" />
```

### 6. Content Projection

```html
<!-- Parent -->
<app-card>
  <h3 card-title>Title</h3>
  <p card-body>Content</p>
</app-card>

<!-- Child Component Template -->
<ng-content select="[card-title]"></ng-content>
<ng-content select="[card-body]"></ng-content>
```

## Component Communication

### Parent to Child (Inputs)

```typescript
// Child
@Input() data: DataType;
@Input({ required: true }) requiredData: DataType;

// Parent
<app-child [data]="parentData" />
```

### Child to Parent (Outputs)

```typescript
// Child
@Output() event = new EventEmitter<EventType>();

// Parent
<app-child (event)="handleEvent($event)" />
```

### Service-Based Communication

```typescript
// Shared Service
@Injectable({ providedIn: 'root' })
export class CommunicationService {
  private message = signal('');
  message$ = this.message.asObservable();
  
  sendMessage(msg: string) {
    this.message.set(msg);
  }
}

// Component A (Sender)
service.sendMessage('Hello');

// Component B (Receiver)
service.message$.subscribe(msg => console.log(msg));
```

## Best Practices

### 1. Component Size

- **Small & Focused:** One responsibility per component
- **Under 300 lines:** Refactor if larger
- **Extract logic:** Use services for complex logic

### 2. Naming Conventions

```typescript
// Component class
export class FeatureNameComponent {}

// Selector
'app-feature-name'

// Files
feature-name.component.ts
feature-name.component.css
feature-name.component.spec.ts
```

### 3. Change Detection

```typescript
// ✅ Good: OnPush for performance
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
})

// ✅ Good: Signals for reactivity
count = signal(0);
```

### 4. Lifecycle Hooks

```typescript
export class ExampleComponent implements OnInit, OnDestroy {
  ngOnInit() {
    // Initialize
  }
  
  ngOnDestroy() {
    // Cleanup subscriptions
  }
}
```

## Testing

### Unit Test Structure

```typescript
describe('ExampleComponent', () => {
  let component: ExampleComponent;
  let fixture: ComponentFixture<ExampleComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExampleComponent]
    }).compileComponents();
    
    fixture = TestBed.createComponent(ExampleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

## Next Steps

- [Styling Guide](./05-styling.md) - CSS and theming
- [Build & Deploy](./06-build-deploy.md) - Build process
- [Improvement Suggestions](./07-improvements.md) - Future enhancements
