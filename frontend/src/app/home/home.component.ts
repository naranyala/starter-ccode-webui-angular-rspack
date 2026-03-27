import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { marked } from 'marked';
import { codeToHtml } from 'shiki';

interface FAQ {
  question: string;
  answer: string;
}

interface Article {
  id: string;
  title: string;
  description: string;
  markdown: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="home-container">
      <h1>Angular Rspack Demo</h1>
      <p class="subtitle">A minimal Angular 19 application bundled with Rspack</p>

      <div class="cards-wrapper">
        <div class="card">
          <div class="card-header">
            <span class="card-icon">❓</span>
            <h2>FAQ</h2>
          </div>
          <div class="accordion">
            @for (faq of faqs; track faq.question; let i = $index) {
              <div class="accordion-item" [class.open]="openFaqIndex === i">
                <button class="accordion-toggle" (click)="toggleFaq(i)">
                  <span>{{ faq.question }}</span>
                  <span class="accordion-arrow">{{ openFaqIndex === i ? '▼' : '▶' }}</span>
                </button>
                <div class="accordion-content">
                  <p>{{ faq.answer }}</p>
                </div>
              </div>
            }
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <span class="card-icon">📄</span>
            <h2>Articles</h2>
          </div>
          <div class="articles-list">
            @for (article of articles; track article.id) {
              <div 
                class="article-item" 
                [class.active]="activeArticleId === article.id"
                (click)="toggleArticle(article.id)"
              >
                <div class="article-title">
                  <span class="article-arrow">{{ activeArticleId === article.id ? '▼' : '▶' }}</span>
                  {{ article.title }}
                </div>
                <p class="article-description">{{ article.description }}</p>
                @if (activeArticleId === article.id) {
                  <div class="article-content" [innerHTML]="renderedArticles[article.id]"></div>
                }
              </div>
            }
          </div>
        </div>
      </div>

      <a routerLink="/demo" class="btn">View Demo →</a>
    </div>
  `,
  styles: [
    `
    .home-container {
      max-width: 1100px;
      margin: 0 auto;
      padding: 60px 20px;
      text-align: center;
    }
    .home-container h1 {
      font-size: 2.5rem;
      color: #1a1a2e;
      margin-bottom: 16px;
    }
    .subtitle {
      font-size: 1.2rem;
      color: #666;
      margin-bottom: 40px;
    }
    .btn {
      display: inline-block;
      margin-top: 40px;
      padding: 12px 24px;
      background: #0f3460;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      transition: background 0.2s;
    }
    .btn:hover {
      background: #16213e;
    }

    .cards-wrapper {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      text-align: left;
    }
    @media (max-width: 800px) {
      .cards-wrapper {
        grid-template-columns: 1fr;
      }
    }

    .card {
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      overflow: hidden;
    }
    .card-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 24px;
      background: #f8f9fa;
      border-bottom: 1px solid #e9ecef;
    }
    .card-icon {
      font-size: 1.5rem;
    }
    .card-header h2 {
      margin: 0;
      font-size: 1.25rem;
      color: #1a1a2e;
    }

    /* Accordion Styles */
    .accordion {
      padding: 8px;
    }
    .accordion-item {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 8px;
      overflow: hidden;
    }
    .accordion-item:last-child {
      margin-bottom: 0;
    }
    .accordion-toggle {
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
      padding: 16px;
      background: #fff;
      border: none;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 500;
      color: #1a1a2e;
      text-align: left;
      transition: background 0.2s;
    }
    .accordion-toggle:hover {
      background: #f8f9fa;
    }
    .accordion-arrow {
      color: #666;
      font-size: 0.8rem;
    }
    .accordion-content {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }
    .accordion-item.open .accordion-content {
      max-height: 200px;
    }
    .accordion-content p {
      padding: 0 16px 16px;
      margin: 0;
      color: #666;
      line-height: 1.6;
    }

    /* Articles Styles */
    .articles-list {
      padding: 8px;
      max-height: 400px;
      overflow-y: auto;
    }
    .article-item {
      border: 1px solid #e9ecef;
      border-radius: 8px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: border-color 0.2s;
    }
    .article-item:last-child {
      margin-bottom: 0;
    }
    .article-item:hover,
    .article-item.active {
      border-color: #0f3460;
    }
    .article-title {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      font-weight: 500;
      color: #1a1a2e;
    }
    .article-arrow {
      color: #666;
      font-size: 0.8rem;
    }
    .article-description {
      padding: 0 16px 12px;
      margin: 0;
      font-size: 0.9rem;
      color: #666;
    }
    .article-content {
      padding: 16px;
      border-top: 1px solid #e9ecef;
      background: #f8f9fa;
    }
    .article-content :global(pre) {
      background: #1a1a2e;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0;
    }
    .article-content :global(code) {
      font-family: 'Fira Code', 'Consolas', monospace;
      font-size: 0.85rem;
    }
    .article-content :global(p) {
      margin: 0 0 12px;
      line-height: 1.6;
      color: #e6edf3;
    }
    .article-content :global(p:last-child) {
      margin-bottom: 0;
    }
    .article-content :global(ul) {
      margin: 0 0 12px;
      padding-left: 20px;
      color: #e6edf3;
    }
    .article-content :global(li) {
      margin-bottom: 4px;
    }
  `,
  ],
})
export class HomeComponent {
  openFaqIndex: number | null = 0;
  activeArticleId: string | null = 'getting-started';
  renderedArticles: Record<string, string> = {};

  faqs: FAQ[] = [
    {
      question: 'What is Angular Rspack?',
      answer:
        'A minimal Angular 19 application bundled with Rspack, a high-performance JavaScript bundler written in Rust.',
    },
    {
      question: 'Why use Rspack instead of Webpack?',
      answer:
        'Rspack offers significantly faster build times, incremental compilation, and better HMR performance while maintaining Webpack compatibility.',
    },
    {
      question: 'Is this production ready?',
      answer:
        'Yes, Rspack is stable and used in production by companies like ByteDance. This demo showcases its capabilities for Angular applications.',
    },
    {
      question: 'What tools are included?',
      answer:
        'This project includes Angular 19, Rspack, Bun, TypeScript, and supports Hot Module Replacement for fast development.',
    },
  ];

  articles: Article[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Learn how to set up and run the project',
      markdown: `
## Getting Started

### Installation

\`\`\`bash
npm install
\`\`\`

### Development Server

\`\`\`bash
npm run dev
\`\`\`

The app will be available at \`http://localhost:4200\`

### Build

\`\`\`bash
npm run build:rspack
\`\`\`
      `,
    },
    {
      id: 'configuration',
      title: 'Configuration',
      description: 'Rspack and build configuration options',
      markdown: `
## Configuration

### rspack.config.js

The main configuration file sets up:

- **Entry points**: Application entry
- **Output**: Build destination
- **Loaders**: TypeScript, CSS, assets
- **Plugins**: Angular, HTML handling

### Environment Variables

Use \`.env\` files for environment-specific settings.
      `,
    },
  ];

  constructor() {
    this.renderAllArticles();
  }

  async renderAllArticles() {
    for (const article of this.articles) {
      this.renderedArticles[article.id] = await this.renderMarkdown(article.markdown);
    }
  }

  async renderMarkdown(markdown: string): Promise<string> {
    const html = await marked.parse(markdown);
    const codeBlockRegex = /<pre><code class="language-(\w+)">(.*?)<\/code><\/pre>/gs;

    let finalHtml = html;
    let match: RegExpExecArray | null = codeBlockRegex.exec(html);

    while (match !== null) {
      const language = match[1];
      const code = match[2].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

      try {
        const highlighted = await codeToHtml(code, {
          lang: language,
          theme: 'github-dark',
        });
        finalHtml = finalHtml.replace(match[0], highlighted);
      } catch {
        // fallback to plain pre
      }
      match = codeBlockRegex.exec(html);
    }

    finalHtml = finalHtml.replace(/<pre><code>(.*?)<\/code><\/pre>/gs, (_, code) => {
      const decoded = code.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
      return `<pre><code>${decoded}</code></pre>`;
    });

    return finalHtml;
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }

  toggleArticle(id: string): void {
    this.activeArticleId = this.activeArticleId === id ? null : id;
  }
}
