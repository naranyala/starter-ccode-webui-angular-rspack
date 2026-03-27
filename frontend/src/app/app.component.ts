import { Component, inject, type OnInit, signal, effect } from '@angular/core';
import {
  ArticleListComponent,
  ArticleReaderComponent,
  FaqComponent,
} from './article/components';
import { type Article, ArticleService } from './services/article.service';

/**
 * Main App Component
 *
 * This is the root component that orchestrates the article reading experience.
 * It has been refactored from a monolithic 1400+ line component into smaller,
 * focused components:
 *
 * - FaqComponent: FAQ section with expandable items
 * - ArticleListComponent: List of available articles
 * - ArticleReaderComponent: Full-screen article reader with TOC
 *
 * Configuration flags for debugging:
 * - ENABLE_CODE_HIGHLIGHTING: Toggle Shiki syntax highlighting
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FaqComponent, ArticleListComponent, ArticleReaderComponent],
  template: `
    <div class="container">
      <header class="header">
        <h1>C WebUI + Angular</h1>
        <p>Modern full-stack development with C backend and Angular frontend</p>
      </header>

      <section class="columns">
        <div class="column">
          <h2 class="system-title">System A</h2>
          @if (isFaqLoading()) {
            <div class="card">
              <h2>Loading...</h2>
            </div>
          } @else if (faqLoadingError()) {
            <div class="card">
              <h2 style="color: #f85149;">Error Loading</h2>
              <p class="error-message">{{ faqLoadingError() }}</p>
            </div>
          } @else {
            <app-faq
              [faqs]="faqArticles()"
              (articleSelected)="onArticleSelected($event)">
            </app-faq>
          }
        </div>

        <div class="column">
          <h2 class="system-title">System B</h2>
          @if (isArticlesLoading()) {
            <div class="card">
              <h2>Loading...</h2>
              <p class="loading">Please wait while we fetch the articles.</p>
            </div>
          } @else if (articlesLoadingError()) {
            <div class="card">
              <h2 style="color: #f85149;">Error Loading</h2>
              <div class="error-message">
                <p>{{ articlesLoadingError() }}</p>
                <button class="retry-btn" (click)="loadArticles()">
                  <span>🔄</span> Retry
                </button>
              </div>
            </div>
          } @else if (selectedArticle()) {
            <app-article-reader
              [article]="selectedArticle()"
              (back)="onArticleBack()">
            </app-article-reader>
          } @else {
            <app-article-list
              [articles]="documentationArticles()"
              [isLoading]="isArticlesLoading()"
              (articleSelected)="onArticleSelected($event)">
            </app-article-list>
          }
        </div>
      </section>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
      background: #0d1117;
      color: #e6edf3;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-height: 100vh;
      line-height: 1.6;
    }

    /* ===== LAYOUT ===== */
    .container {
      max-width: 1600px;
      margin: 0 auto;
      padding: 20px;
    }

    .header {
      text-align: center;
      padding: 30px 0 40px;
    }

    .header h1 {
      font-size: 2rem;
      margin: 0 0 12px;
      font-weight: 700;
      letter-spacing: -0.5px;
      color: #e6edf3;
    }

    .header p {
      color: #8b949e;
      margin: 0;
      font-size: 1.05rem;
    }

    .system-title {
      font-size: 1.2rem;
      font-weight: 700;
      color: #e6edf3;
      margin: 0 0 16px;
      padding: 12px 16px;
      background: linear-gradient(135deg, #1f6feb 0%, #1960c7 100%);
      border-radius: 8px;
      text-align: center;
    }

    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }

    @media (max-width: 1024px) {
      .columns {
        grid-template-columns: 1fr;
      }
    }

    .column {
      min-width: 0;
    }

    /* ===== CARDS ===== */
    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .card h2 {
      margin: 0 0 20px;
      font-size: 1.1rem;
      font-weight: 600;
      padding-bottom: 16px;
      border-bottom: 1px solid #30363d;
      letter-spacing: -0.3px;
      color: #e6edf3;
    }

    /* ===== LOADING & ERRORS ===== */
    .loading {
      color: #8b949e;
      text-align: center;
      padding: 40px;
    }

    .error-message {
      padding: 20px;
      background: rgba(248,81,73,0.1);
      border: 1px solid #f85149;
      border-radius: 8px;
      margin-top: 16px;
    }

    .error-message p {
      color: #e6edf3;
      margin: 0 0 16px;
      line-height: 1.6;
    }

    .retry-btn {
      background: linear-gradient(135deg, #1f6feb 0%, #1960c7 100%);
      border: 1px solid #388bfd;
      color: #fff;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .retry-btn:hover {
      background: linear-gradient(135deg, #388bfd 0%, #1f6feb 100%);
      border-color: #58a6ff;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(31, 111, 235, 0.3);
    }

    .retry-btn:active {
      transform: translateY(0);
    }
  `,
  ],
})
export class AppComponent implements OnInit {
  private articleService = inject(ArticleService);

  // ===== CONFIGURATION =====
  readonly ENABLE_CODE_HIGHLIGHTING = true; // Set to true to enable Shiki syntax highlighting
  // =========================

  // State - FAQ
  readonly faqArticles = signal<Article[]>([]);
  readonly isFaqLoading = signal<boolean>(true);
  readonly faqLoadingError = signal<string | null>(null);

  // State - Documentation Articles
  readonly documentationArticles = signal<Article[]>([]);
  readonly isArticlesLoading = signal<boolean>(true);
  readonly articlesLoadingError = signal<string | null>(null);

  // State - Selected Article for Reading
  readonly selectedArticle = signal<Article | null>(null);

  constructor() {
    // Effect to manage body overflow when article reader is open
    effect(() => {
      const hasArticleOpen = !!this.selectedArticle();
      if (hasArticleOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnInit() {
    this.loadArticles();
  }

  loadArticles() {
    console.log('[AppComponent] Loading articles...');
    
    // Load FAQ
    this.isFaqLoading.set(true);
    this.faqLoadingError.set(null);
    this.articleService.getFaqArticles().subscribe({
      next: (articles) => {
        console.log(`[AppComponent] Loaded ${articles.length} FAQ articles`);
        this.faqArticles.set(articles);
        this.isFaqLoading.set(false);
      },
      error: (err) => {
        console.error('[AppComponent] Failed to load FAQ:', err);
        this.isFaqLoading.set(false);
        this.faqLoadingError.set(this.getErrorMessage(err));
        this.faqArticles.set([]);
      },
    });

    // Load Documentation Articles
    this.isArticlesLoading.set(true);
    this.articlesLoadingError.set(null);
    this.articleService.getDocumentationArticles().subscribe({
      next: (articles) => {
        console.log(`[AppComponent] Loaded ${articles.length} documentation articles`);
        this.documentationArticles.set(articles);
        this.isArticlesLoading.set(false);
      },
      error: (err) => {
        console.error('[AppComponent] Failed to load documentation:', err);
        this.isArticlesLoading.set(false);
        this.articlesLoadingError.set(this.getErrorMessage(err));
        this.documentationArticles.set([]);
      },
      complete: () => {
        console.log('[AppComponent] Article loading complete');
      },
    });
  }

  onArticleSelected(article: Article) {
    console.log('[AppComponent] Article selected:', article.title);
    this.selectedArticle.set(article);
  }

  onArticleBack() {
    console.log('[AppComponent] Back from article');
    this.selectedArticle.set(null);
  }

  private getErrorMessage(error: any): string {
    if (error?.message?.includes('404')) {
      return 'Article files not found. Please ensure the /docs folder exists and contains .md files.';
    }
    if (error?.message?.includes('connect') || error?.status === 0) {
      return 'Cannot connect to server. Please ensure the dev server is running.';
    }
    if (error?.message) {
      return `Failed to load articles: ${error.message}`;
    }
    return 'An unexpected error occurred while loading articles.';
  }
}
