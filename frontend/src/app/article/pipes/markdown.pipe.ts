import { Pipe, type PipeTransform } from '@angular/core';
import { marked } from 'marked';
import type { RendererObject, Tokens } from 'marked';

/**
 * Markdown Pipe
 * 
 * Converts markdown content to HTML with proper formatting.
 * Supports:
 * - Headings with auto-generated IDs for TOC
 * - Code blocks with syntax highlighting (via Shiki)
 * - Tables
 * - Lists
 * - Links
 * - Blockquotes
 * - MathJax equations
 * - Mermaid diagrams
 */
@Pipe({
  name: 'markdown',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  async transform(content: string, options?: { enableCodeHighlighting?: boolean }): Promise<string> {
    if (!content) {
      return '';
    }

    const enableCodeHighlighting = options?.enableCodeHighlighting ?? true;

    // Create custom renderer
    const renderer: Partial<RendererObject> = {
      heading(token: Tokens.Heading): string {
        const id = token.text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        return `<h${token.depth} id="${id}">${token.text}</h${token.depth}>`;
      },

      code(token: Tokens.Code): string {
        const lang = token.lang || 'plaintext';
        if (!enableCodeHighlighting) {
          return `<pre><code class="language-${lang}">${escapeHtml(token.text)}</code></pre>`;
        }
        // Return placeholder that will be highlighted by Shiki in the component
        return `<pre class="code-block" data-language="${lang}"><code class="language-${lang}">${escapeHtml(token.text)}</code></pre>`;
      },

      blockquote(token: Tokens.Blockquote): string {
        return `<blockquote class="markdown-blockquote">${token.text}</blockquote>`;
      },

      table(token: Tokens.Table): string {
        return `<table class="markdown-table"><thead>${token.header}</thead><tbody>${token.rows.join('')}</tbody></table>`;
      },

      link(token: Tokens.Link): string {
        const titleAttr = token.title ? ` title="${escapeHtml(token.title)}"` : '';
        return `<a href="${escapeHtml(token.href)}"${titleAttr} target="_blank" rel="noopener noreferrer">${token.text}</a>`;
      },
    };

    // Configure marked with custom renderer
    marked.use({
      renderer,
      gfm: true, // GitHub Flavored Markdown
      breaks: false,
    });

    // Parse markdown to HTML
    const html = marked.parse(content, { async: false }) as string;

    return html;
  }

  /**
   * Extract table of contents from markdown content
   */
  extractToc(content: string): TocItem[] {
    const toc: TocItem[] = [];
    const lines = content.split('\n');

    for (const line of lines) {
      const match = line.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const text = match[2].trim();
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .trim();
        toc.push({ id, text, level });
      }
    }

    return toc;
  }
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Table of Contents Item
 */
export interface TocItem {
  id: string;
  text: string;
  level: number;
}
