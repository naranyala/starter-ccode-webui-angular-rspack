import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="split-screen">
      <!-- Left: Pills Selector -->
      <div class="pills-panel">
        <h2 class="panel-title">Rust WebUI Application</h2>
        <div class="search-box">
          <input
            type="text"
            class="search-input"
            placeholder="Fuzzy search topics..."
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
          @if (searchQuery()) {
            <button class="search-clear" (click)="searchQuery.set('')">✕</button>
          }
        </div>
        <div class="pill-container">
          @for (tag of filteredTags(); track tag) {
            <span 
              class="pill" 
              [class.active]="selected() === tag"
              (click)="selectTag(tag)">
              {{ tag }}
            </span>
          }
        </div>
      </div>

      <!-- Right: Article Content -->
      <div 
        class="article-panel" 
        [class.show-mobile]="selected() !== null"
        (click)="onPanelClick($event)">
        <button class="close-btn" (click)="closeMobile()" aria-label="Close">×</button>
        @if (selected(); as selectedTag) {
          <article class="article">
            <h1 class="article-title">{{ selectedTag }}</h1>
            <div class="article-content">
              <p>Content about <strong>{{ selectedTag }}</strong> will be displayed here.</p>
              <p>This section shows detailed information, examples, and resources related to the selected Angular topic.</p>
            </div>
          </article>
        } @else {
          <div class="placeholder">
            <p>Select a topic from the left panel to view related content</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      font-family: system-ui, sans-serif;
      height: 100vh;
      width: 100%;
      background: #0f0f0f;
      color: #e5e5e5;
    }

    .split-screen {
      display: flex;
      height: 100%;
      width: 100%;
    }

    .pills-panel {
      width: 40%;
      padding: 1.5rem;
      border-right: 1px solid #2a2a2a;
      overflow-y: auto;
      background: #1a1a1a;
    }

    .panel-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #e5e5e5;
      margin-bottom: 1rem;
    }

    .search-box {
      position: relative;
      margin-bottom: 1rem;
    }

    .search-input {
      width: 100%;
      padding: 0.625rem 2.5rem 0.625rem 0.75rem;
      background: #0f0f0f;
      border: 1px solid #334155;
      border-radius: 10px;
      color: #e2e8f0;
      font-size: 0.875rem;
      outline: none;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .search-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .search-input::placeholder {
      color: #64748b;
    }

    .search-clear {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      background: #334155;
      border: none;
      color: #94a3b8;
      width: 22px;
      height: 22px;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      font-size: 0.75rem;
      padding: 0;
    }

    .search-clear:hover {
      background: #475569;
      color: #e2e8f0;
    }

    .pill-container {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      padding: 0.5rem 0.875rem;
      border-radius: 999px;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #2a2a2a;
      color: #e5e5e5;
      border: 2px solid transparent;
    }

    .pill:hover {
      background: #3a3a3a;
    }

    .pill.active {
      background: #3b82f6;
      color: white;
      border-color: #2563eb;
      font-weight: 500;
    }

    .article-panel {
      width: 60%;
      padding: 2rem;
      overflow-y: auto;
      background: #0f0f0f;
    }

    .article {
      max-width: 800px;
    }

    .article-title {
      font-size: 2rem;
      font-weight: 700;
      color: #e5e5e5;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #3b82f6;
    }

    .article-content {
      color: #a3a3a3;
      line-height: 1.75;
    }

    .article-content p {
      margin-bottom: 1rem;
    }

    .article-content strong {
      color: #e5e5e5;
    }

    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #525252;
      font-size: 1.125rem;
    }

    /* Mobile responsive styles */
    @media (max-width: 768px) {
      .split-screen {
        flex-direction: column;
      }

      .pills-panel {
        width: 100%;
        height: 100vh;
        border-right: none;
        border-bottom: 1px solid #2a2a2a;
      }

      .article-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        padding: 1rem;
        z-index: 1000;
        transform: translateY(100%);
        transition: transform 0.3s ease-in-out;
      }

      .article-panel.show-mobile {
        transform: translateY(0);
      }

      .article-panel::before {
        content: '';
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: -1;
      }

      .close-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 2.5rem;
        height: 2.5rem;
        position: absolute;
        top: 0.75rem;
        right: 0.75rem;
        border-radius: 50%;
        background: #2a2a2a;
        border: none;
        color: #e5e5e5;
        font-size: 1.5rem;
        cursor: pointer;
        z-index: 1001;
        transition: background 0.2s ease;
      }

      .close-btn:hover {
        background: #3a3a3a;
      }

      .article-title {
        font-size: 1.5rem;
        margin-top: 3rem;
      }
    }

    @media (min-width: 769px) {
      .close-btn {
        display: none;
      }
    }
  `,
  ],
})
export class AppComponent {
  // 🔥 Predefined modern Angular topics
  readonly allTags = [
    // Core modern Angular
    'Standalone Components',
    'Signals API',
    'Computed Signals',
    'Effect()',
    'Dependency Injection',
    'Environment Injector',
    'Control Flow (@if, @for)',
    'Deferred Loading (@defer)',
    'Hydration',
    'Zone-less Angular',

    // Performance / rendering
    'OnPush Change Detection',
    'Fine-grained Reactivity',
    'Server-Side Rendering (SSR)',
    'Client Hydration',
    'Lazy Loading',
    'Route-based Code Splitting',

    // Tooling / ecosystem
    'Angular CLI',
    'Vite Integration',
    'ESBuild',
    'Nx Workspace',
    'Monorepo Architecture',

    // Forms & state
    'Reactive Forms',
    'Signals-based Forms (RFC)',
    'NgRx',
    'Component Store',
    'RxJS Interop',

    // UI / patterns
    'Headless Components',
    'Design Systems',
    'CDK (Component Dev Kit)',
    'Accessibility (a11y)',
    'Material 3',

    // Advanced patterns
    'Micro Frontends',
    'Module Federation',
    'Web Components',
    'Custom Elements',
    'Progressive Enhancement',
  ];

  selected = signal<string | null>(null);
  searchQuery = signal('');

  filteredTags = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) {
      return this.allTags;
    }
    return this.allTags.filter(tag => this.fuzzyMatch(query, tag.toLowerCase()));
  });

  private fuzzyMatch(query: string, text: string): boolean {
    let queryIndex = 0;
    for (let i = 0; i < text.length && queryIndex < query.length; i++) {
      if (text[i] === query[queryIndex]) {
        queryIndex++;
      }
    }
    return queryIndex === query.length;
  }

  selectTag(tag: string) {
    this.selected.set(tag);
  }

  closeMobile() {
    this.selected.set(null);
  }

  onPanelClick(event: MouseEvent) {
    // Close when clicking on the overlay background (not the article content)
    const target = event.target as HTMLElement;
    if (target.classList.contains('article-panel')) {
      this.closeMobile();
    }
  }
}
