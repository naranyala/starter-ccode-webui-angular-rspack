import { Component, signal, Input, inject, OnChanges, Output, EventEmitter, computed } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { TablerIconComponent } from '../../../shared/components/tabler-icon/tabler-icon.component';
import type { Article } from '../../../services/article.service';
import { marked } from 'marked';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [TablerIconComponent],
  template: `
    <div class="card">
      @if (faqs.length === 0) {
        <p class="loading">No FAQ available.</p>
      } @else {
        <!-- Active FAQ -->
        <div class="articles-section">
          <div class="section-header">
            <h3>
              <tabler-icon name="book" [size]="18" />
              Active
            </h3>
            <span class="count-badge">{{ activeFaqs().length }}</span>
          </div>
          @for (faq of activeFaqs(); track faq.id; let i = $index) {
            <div class="article-item" (click)="onFaqClick(faq)">
              <h3>{{ faq.title }}</h3>
              <p>{{ getPreview(faq.content) }}</p>
            </div>
          }
        </div>

        <!-- Archived FAQ -->
        @if (archivedFaqs().length > 0) {
          <div class="articles-section archived">
            <div class="section-header" (click)="toggleArchived()" role="button" tabindex="0">
              <h3>
                <tabler-icon name="folder" [size]="18" />
                Archived
              </h3>
              <div class="header-actions">
                <span class="count-badge">{{ archivedFaqs().length }}</span>
                <tabler-icon [name]="showArchived() ? 'chevronDown' : 'chevronRight'" [size]="20" class="toggle-icon" />
              </div>
            </div>

            @if (showArchived()) {
              <div class="archived-content">
                @for (faq of archivedFaqs(); track faq.id; let i = $index) {
                  <div class="article-item archived" (click)="onFaqClick(faq)">
                    <h3>{{ faq.title }}</h3>
                    <p>{{ getPreview(faq.content) }}</p>
                  </div>
                }
              </div>
            } @else {
              <div class="collapsed-preview" (click)="toggleArchived()">
                <tabler-icon name="eye" [size]="16" />
                <span>{{ archivedFaqs().length }} archived item{{ archivedFaqs().length > 1 ? 's' : '' }} hidden</span>
              </div>
            }
          </div>
        }
      }
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
    }

    .card {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 16px;
      padding: 24px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }

    .articles-section {
      margin-bottom: 24px;
    }

    .articles-section:last-child {
      margin-bottom: 0;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid #30363d;
    }

    .section-header h3 {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
      font-size: 0.9rem;
      font-weight: 600;
      color: #8b949e;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .section-header.archived {
      cursor: pointer;
      user-select: none;
      transition: all 0.2s;
      padding: 8px 12px;
      border-radius: 8px;
      margin-bottom: 8px;
    }

    .section-header.archived:hover {
      background: rgba(255,255,255,0.05);
    }

    .section-header.archived h3 {
      color: #8b949e;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .toggle-icon {
      color: #8b949e;
      transition: transform 0.2s;
    }

    .count-badge {
      background: #30363d;
      color: #c9d1d9;
      font-size: 0.75rem;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 12px;
      min-width: 24px;
      text-align: center;
    }

    .section-header.archived .count-badge {
      background: #21262d;
      color: #8b949e;
    }

    .archived-content {
      margin-top: 12px;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .collapsed-preview {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(33,38,46,0.5);
      border: 1px dashed #30363d;
      border-radius: 8px;
      color: #8b949e;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .collapsed-preview:hover {
      background: rgba(33,38,46,0.8);
      border-color: #484f58;
      color: #c9d1d9;
    }

    .article-item {
      padding: 18px;
      background: #21262d;
      border: 1px solid #30363d;
      border-radius: 10px;
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .article-item:hover {
      border-color: #1f6feb;
      background: #262c36;
      transform: translateX(4px);
    }

    .article-item.archived {
      background: rgba(33,38,46,0.5);
      border-color: #21262d;
      opacity: 0.85;
    }

    .article-item.archived:hover {
      border-color: #484f58;
      background: rgba(33,38,46,0.8);
      opacity: 1;
    }

    .article-item.archived h3 {
      color: #8b949e;
      font-weight: 500;
    }

    .article-item h3 {
      margin: 0 0 8px;
      font-size: 0.95rem;
      font-weight: 600;
      color: #e6edf3;
    }

    .article-item p {
      margin: 0;
      color: #8b949e;
      font-size: 0.85rem;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .loading {
      color: #8b949e;
      text-align: center;
      padding: 40px;
    }

    .faq-answer {
      padding: 16px;
      background: #0d1117;
      color: #c9d1d9;
      line-height: 1.7;
      font-size: 0.95rem;
      max-height: 400px;
      overflow-y: auto;
      margin-top: 12px;
      border-radius: 8px;
      border: 1px solid #30363d;
    }

    .faq-answer :global(p) {
      margin: 0 0 12px;
    }

    .faq-answer :global(p:last-child) {
      margin-bottom: 0;
    }

    .faq-answer :global(strong) {
      color: #e6edf3;
    }

    .faq-answer :global(code) {
      background: rgba(110,118,129,0.2);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Consolas', monospace;
      font-size: 0.875em;
      color: #e6edf3;
    }

    .faq-answer :global(pre) {
      background: rgba(110,118,129,0.2);
      padding: 12px;
      border-radius: 6px;
      overflow-x: auto;
      margin: 12px 0;
    }

    .faq-answer :global(pre code) {
      background: transparent;
      padding: 0;
    }

    .faq-answer :global(h1),
    .faq-answer :global(h2),
    .faq-answer :global(h3),
    .faq-answer :global(h4) {
      color: #e6edf3;
      margin: 16px 0 12px;
      font-weight: 600;
    }

    .faq-answer :global(h1) { font-size: 1.4rem; }
    .faq-answer :global(h2) { font-size: 1.2rem; }
    .faq-answer :global(h3) { font-size: 1rem; }

    .faq-answer :global(ul),
    .faq-answer :global(ol) {
      margin: 12px 0;
      padding-left: 24px;
    }

    .faq-answer :global(li) {
      margin: 6px 0;
    }

    .faq-answer :global(a) {
      color: #58a6ff;
      text-decoration: none;
    }

    .faq-answer :global(a:hover) {
      text-decoration: underline;
    }
  `,
  ],
})
export class FaqComponent implements OnChanges {
  @Input() faqs: Article[] = [];
  @Output() articleSelected = new EventEmitter<Article>();

  readonly showArchived = signal<boolean>(false);
  readonly openFaq = signal<number | null>(null);

  private readonly sanitizer = inject(DomSanitizer);
  private readonly renderedAnswers = signal<SafeHtml[]>([]);

  readonly activeFaqs = computed(() =>
    this.faqs.slice(0, Math.ceil(this.faqs.length / 2))
  );

  readonly archivedFaqs = computed(() =>
    this.faqs.slice(Math.ceil(this.faqs.length / 2))
  );

  ngOnChanges() {
    // Render markdown for each FAQ answer when input changes
    this.renderAllFaqs();
  }

  private async renderAllFaqs() {
    const rendered: SafeHtml[] = [];
    for (const faq of this.faqs) {
      const html = await marked.parse(faq.content);
      rendered.push(this.sanitizer.bypassSecurityTrustHtml(html));
    }
    this.renderedAnswers.set(rendered);
  }

  renderedAnswer(index: number): SafeHtml {
    return this.renderedAnswers()[index] || '';
  }

  toggleArchived() {
    this.showArchived.update((show) => !show);
  }

  onFaqClick(faq: Article) {
    // Emit the selected article to parent
    this.articleSelected.emit(faq);
  }

  getPreview(content: string): string {
    return (
      content
        .replace(/[#*`[\]()]/g, '')
        .replace(/\n+/g, ' ')
        .slice(0, 100) + '...'
    );
  }
}
