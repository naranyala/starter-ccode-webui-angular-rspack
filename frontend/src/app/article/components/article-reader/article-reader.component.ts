import { Component, EventEmitter, Input, inject, type OnInit, Output, signal, effect } from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import type { Article } from '../../../services/article.service';
import { TablerIconComponent } from '../../../shared/components/tabler-icon/tabler-icon.component';
import {
  TableOfContentsComponent,
  type TocItem,
} from '../table-of-contents/table-of-contents.component';
import { codeToHtml } from 'shiki';

@Component({
  selector: 'app-article-reader',
  standalone: true,
  imports: [TableOfContentsComponent, TablerIconComponent],
  template: `
    <div class="article-fullscreen">
      <div class="sticky-bar">
        <button class="back-btn" (click)="onBack()" aria-label="Go back">
          <tabler-icon name="arrowLeft" [size]="18" />
          <span>Back</span>
        </button>
      </div>
      <div class="article-layout">
        <article class="article-content" [innerHTML]="renderedContent()"></article>

        @if (tableOfContents().length > 0) {
          <app-table-of-contents
            [items]="tableOfContents()"
            (itemClick)="onTocClick($event)">
          </app-table-of-contents>
        }
      </div>
    </div>
  `,
  styles: [
    `
    :host {
      display: block;
    }

    .article-fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #0d1117;
      z-index: 1000;
      overflow-y: auto;
    }

    .sticky-bar {
      position: sticky;
      top: 0;
      background: rgba(13,17,23,0.98);
      backdrop-filter: blur(12px);
      padding: 16px 24px;
      border-bottom: 1px solid #30363d;
      z-index: 10;
      display: flex;
      align-items: center;
    }

    .back-btn {
      background: transparent;
      border: 1px solid #30363d;
      color: #8b949e;
      padding: 8px 16px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .back-btn:hover {
      background: #21262d;
      border-color: #484f58;
      color: #e6edf3;
    }

    .article-layout {
      display: grid;
      grid-template-columns: 1fr 260px;
      gap: 64px;
      max-width: 1200px;
      margin: 0 auto;
      padding: 48px 48px;
    }

    @media (max-width: 1024px) {
      .article-layout {
        grid-template-columns: 1fr;
        gap: 32px;
        padding: 32px 32px;
      }
    }

    @media (max-width: 640px) {
      .article-layout {
        padding: 24px 20px;
      }
    }

    .article-content {
      background: transparent;
      padding: 0;
      font-size: 1.0625rem;
      line-height: 1.75;
      color: #c9d1d9;
    }

    .article-content :global(h1) {
      font-size: 2rem;
      font-weight: 700;
      margin: 0 0 24px;
      padding-bottom: 16px;
      border-bottom: 1px solid #30363d;
      letter-spacing: -0.5px;
      color: #e6edf3;
    }

    .article-content :global(h2) {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 48px 0 20px;
      letter-spacing: -0.3px;
      color: #e6edf3;
    }

    .article-content :global(h3) {
      font-size: 1.25rem;
      font-weight: 600;
      margin: 32px 0 16px;
      color: #e6edf3;
    }

    .article-content :global(h4) {
      font-size: 1.0625rem;
      font-weight: 600;
      margin: 24px 0 12px;
      color: #e6edf3;
    }

    .article-content :global(p) {
      line-height: 1.75;
      margin: 20px 0;
      color: #c9d1d9;
      text-rendering: optimizeLegibility;
    }

    .article-content :global(a) {
      color: #58a6ff;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: border-color 0.2s;
    }

    .article-content :global(a:hover) {
      border-bottom-color: #58a6ff;
    }

    .article-content :global(ul),
    .article-content :global(ol) {
      margin: 20px 0;
      padding-left: 28px;
      color: #c9d1d9;
    }

    .article-content :global(li) {
      margin: 10px 0;
      line-height: 1.7;
      padding-left: 4px;
    }

    .article-content :global(blockquote) {
      border-left: 3px solid #1f6feb;
      margin: 24px 0;
      padding: 16px 20px;
      background: rgba(31,111,235,0.08);
      color: #8b949e;
      border-radius: 0 8px 8px 0;
      font-size: 1rem;
    }

    .article-content :global(blockquote p) {
      margin: 0;
    }

    .article-content :global(table) {
      width: 100%;
      border-collapse: collapse;
      margin: 24px 0;
      font-size: 0.9375rem;
    }

    .article-content :global(th),
    .article-content :global(td) {
      border: 1px solid #30363d;
      padding: 12px 14px;
      text-align: left;
    }

    .article-content :global(th) {
      background: #21262d;
      font-weight: 600;
      color: #e6edf3;
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .article-content :global(tr:nth-child(even)) {
      background: rgba(255,255,255,0.02);
    }

    .article-content :global(hr) {
      border: none;
      border-top: 1px solid #30363d;
      margin: 40px 0;
    }

    .article-content :global(img) {
      max-width: 100%;
      border-radius: 8px;
      border: 1px solid #30363d;
    }

    .article-content :global(pre) {
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      padding: 16px;
      overflow-x: auto;
      margin: 20px 0;
    }

    .article-content :global(code) {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 0.875rem;
    }

    .article-content :global(p code) {
      background: rgba(110,118,129,0.4);
      padding: 2px 6px;
      border-radius: 4px;
      color: #e6edf3;
    }

    .article-content :global(pre code) {
      background: transparent;
      padding: 0;
    }
  `,
  ],
})
export class ArticleReaderComponent implements OnInit {
  @Input() article: Article | null = null;
  @Output() back = new EventEmitter<void>();

  readonly renderedContent = signal<SafeHtml>('');
  readonly tableOfContents = signal<TocItem[]>([]);

  private readonly sanitizer = inject(DomSanitizer);

  constructor() {
    effect(() => {
      const hasArticleOpen = !!this.article;
      if (hasArticleOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    });
  }

  ngOnInit() {
    if (this.article) {
      this.loadArticle(this.article);
    }
  }

  ngOnChanges() {
    if (this.article) {
      this.loadArticle(this.article);
    }
  }

  private async loadArticle(article: Article) {
    try {
      const { html, toc } = await this.renderMarkdown(article.content);
      this.tableOfContents.set(toc);
      this.renderedContent.set(this.sanitizer.bypassSecurityTrustHtml(html));

      setTimeout(() => {
        this.expandTocAndScrollToFirst(toc);
        this.highlightCodeBlocks();
      }, 100);
    } catch (error) {
      console.error('[ArticleReader] Failed to render article:', error);
      this.renderedContent.set(
        this.sanitizer.bypassSecurityTrustHtml(`
        <div style="padding: 20px; background: rgba(248,81,73,0.1); border: 1px solid #f85149; border-radius: 8px;">
          <h3 style="color: #f85149; margin-top: 0;">Rendering Error</h3>
          <p style="color: #e6edf3;">${error instanceof Error ? error.message : 'Unknown error occurred'}</p>
        </div>
      `)
      );
    }
  }

  private expandTocAndScrollToFirst(toc: TocItem[]) {
    if (toc.length > 0) {
      const firstHeading = toc[0];
      setTimeout(() => {
        const tocElement = document.querySelector(
          `.toc a[href="#${firstHeading.id}"]`
        ) as HTMLElement;
        if (tocElement) {
          tocElement.style.color = '#58a6ff';
          tocElement.style.background = 'rgba(88,166,255,0.08)';
          tocElement.style.borderLeftColor = '#58a6ff';
        }

        const headingElement = document.getElementById(firstHeading.id);
        if (headingElement) {
          headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
    }
  }

  private async highlightCodeBlocks() {
    const codeBlocks = document.querySelectorAll('pre code[class*="language-"]');
    
    for (const codeBlock of Array.from(codeBlocks)) {
      const pre = codeBlock.parentElement;
      if (!pre || pre.classList.contains('shiki-highlighted')) continue;

      const language = codeBlock.classList.contains('language-ts') ? 'typescript' : 
                       codeBlock.classList.contains('language-js') ? 'javascript' :
                       codeBlock.classList.contains('language-md') ? 'markdown' :
                       codeBlock.classList.contains('language-json') ? 'json' :
                       codeBlock.classList.contains('language-css') ? 'css' :
                       codeBlock.classList.contains('language-html') ? 'html' :
                       codeBlock.classList.contains('language-c') ? 'c' :
                       codeBlock.classList.contains('language-bash') ? 'bash' :
                       codeBlock.classList.contains('language-shell') ? 'shell' :
                       'plaintext';

      const code = codeBlock.textContent || '';

      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });

        pre.outerHTML = highlighted;
      } catch (error) {
        console.error('[ArticleReader] Failed to highlight code:', error);
      }
    }
  }

  onBack() {
    this.back.emit();
  }

  onTocClick(headingId: string) {
    const headingElement = document.getElementById(headingId);
    if (headingElement) {
      headingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private async renderMarkdown(content: string): Promise<{ html: string; toc: TocItem[] }> {
    const toc: TocItem[] = [];
    let md = content;

    if (!md || typeof md !== 'string') {
      throw new Error('Invalid markdown content');
    }

    // Extract headings for TOC and add IDs
    md = md.replace(/^(#{1,4})\s+(.+)$/gm, (_, hs, text) => {
      const lvl = hs.length;
      const id = this.slugify(text);
      toc.push({ id, text, level: lvl });
      return `<h${lvl} id="${id}">${text}</h${lvl}>`;
    });

    // Code blocks - preserve for Shiki highlighting
    md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      const language = lang || 'plaintext';
      return `<pre><code class="language-${language}">${this.escapeHtml(code.trim())}</code></pre>`;
    });

    // Inline code - preserve for styling
    md = md.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Bold
    md = md.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic
    md = md.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // Strikethrough
    md = md.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // Links
    md = md.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Blockquotes
    md = md.replace(/^>\s+(.*)$/gm, '<blockquote>$1</blockquote>');

    // Horizontal rule
    md = md.replace(/^---\s*$/gm, '<hr>');

    // Images
    md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Tables - simple implementation
    md = this.parseTables(md);

    // Lists
    const lines = md.split('\n');
    const out: string[] = [];
    let inUl = false;
    let inOl = false;

    for (const line of lines) {
      const trimmed = line.trim();

      // Close lists on empty lines
      if (!trimmed) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        continue;
      }

      // Skip already processed HTML
      if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<blockquote') || 
          trimmed.startsWith('<table') || trimmed.startsWith('<hr')) {
        if (inUl) {
          out.push('</ul>');
          inUl = false;
        }
        if (inOl) {
          out.push('</ol>');
          inOl = false;
        }
        out.push(trimmed);
        continue;
      }

      // Unordered list
      if (/^[-*+]\s+/.test(trimmed)) {
        if (!inUl) {
          out.push('<ul>');
          inUl = true;
        }
        const text = trimmed.replace(/^[-*+]\s+/, '');
        out.push(`<li>${text}</li>`);
        continue;
      }

      // Ordered list
      if (/^\d+\.\s+/.test(trimmed)) {
        if (!inOl) {
          out.push('<ol>');
          inOl = true;
        }
        const text = trimmed.replace(/^\d+\.\s+/, '');
        out.push(`<li>${text}</li>`);
        continue;
      }

      // Close lists for regular paragraphs
      if (inUl) {
        out.push('</ul>');
        inUl = false;
      }
      if (inOl) {
        out.push('</ol>');
        inOl = false;
      }

      out.push(`<p>${trimmed}</p>`);
    }

    // Close any open lists
    if (inUl) out.push('</ul>');
    if (inOl) out.push('</ol>');

    const html = out.join('\n');
    return { html, toc };
  }

  private parseTables(md: string): string {
    const lines = md.split('\n');
    const result: string[] = [];
    let inTable = false;
    let tableRows: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        // Check if this is a separator row
        if (cells.every((c) => /^-+$/.test(c) || /^:\s*-+\s*:?$/.test(c))) {
          // This is the header separator, continue
          continue;
        }

        if (!inTable) {
          inTable = true;
          tableRows = [];
          // This is the header row
          tableRows.push('<tr>' + cells.map((c) => `<th>${c}</th>`).join('') + '</tr>');
        } else {
          // Data row
          tableRows.push('<tr>' + cells.map((c) => `<td>${c}</td>`).join('') + '</tr>');
        }
      } else {
        // End of table
        if (inTable) {
          result.push('<table>' + tableRows.join('') + '</table>');
          tableRows = [];
          inTable = false;
        }
        result.push(line);
      }
    }

    // Handle table at end of document
    if (inTable) {
      result.push('<table>' + tableRows.join('') + '</table>');
    }

    return result.join('\n');
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
