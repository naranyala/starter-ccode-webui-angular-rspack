import { Component, Input, type OnInit, signal } from '@angular/core';

@Component({
  selector: 'app-code-block',
  standalone: true,
  template: `
    @if (isPlain()) {
      <div class="code-block-plain">
        <code>{{ code }}</code>
      </div>
    } @else {
      <div class="code-block" [class.code-terminal]="lang === 'terminal' || lang === 'console'" [class.code-diff]="lang === 'diff'">
        <div class="code-block-header">
          <div class="code-block-meta">
            <span class="code-block-title">{{ title }}</span>
            <span class="code-lang-badge">{{ lang }}</span>
          </div>
          <button 
            class="code-copy-btn" 
            (click)="copyCode()"
            [class.copy-success]="copied()"
            aria-label="Copy code">
            <span class="copy-text-default">Copy</span>
            <span class="copy-text-success">Copied</span>
          </button>
        </div>
        <div class="code-block-body">
          <pre [innerHTML]="highlightedCode()"></pre>
        </div>
      </div>
    }
  `,
  styles: [
    `
    :host {
      display: block;
      margin: 24px 0;
    }

    /* Plain code block (when syntax highlighting disabled) */
    .code-block-plain {
      padding: 16px;
      background: #161b22;
      border: 1px solid #30363d;
      border-radius: 8px;
      overflow-x: auto;
    }

    .code-block-plain code {
      background: none;
      padding: 0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #c9d1d9;
      white-space: pre;
    }

    /* ===== CODE BLOCKS - STUNNING DESIGN ===== */
    .code-block {
      margin: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #30363d;
      background: linear-gradient(180deg, #0d1117 0%, #0a0e14 100%);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
    }

    .code-block::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    }

    .code-block:hover {
      border-color: #484f58;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
      transform: translateY(-2px);
    }

    .code-block.code-terminal {
      border-color: #238636;
      box-shadow: 0 4px 24px rgba(35, 134, 54, 0.15);
    }

    .code-block.code-terminal:hover {
      border-color: #2ea043;
      box-shadow: 0 8px 32px rgba(35, 134, 54, 0.25);
    }

    .code-block.code-diff {
      border-color: #1f6feb;
      box-shadow: 0 4px 24px rgba(31, 111, 235, 0.15);
    }

    .code-block.code-diff:hover {
      border-color: #388bfd;
      box-shadow: 0 8px 32px rgba(31, 111, 235, 0.25);
    }

    /* Header */
    .code-block-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(180deg, #161b22 0%, #13181f 100%);
      border-bottom: 1px solid #30363d;
      gap: 12px;
      position: relative;
    }

    .code-block-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(48, 54, 61, 0.5), transparent);
    }

    .code-block-meta {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .code-block-title {
      font-size: 0.75rem;
      color: #8b949e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .code-lang-badge {
      font-size: 0.65rem;
      background: linear-gradient(135deg, #238636 0%, #1a7f37 100%);
      color: #fff;
      padding: 3px 8px;
      border-radius: 6px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      box-shadow: 0 1px 3px rgba(35, 134, 54, 0.3);
      transition: all 0.2s ease;
    }

    .code-block:hover .code-lang-badge {
      transform: scale(1.05);
      box-shadow: 0 2px 6px rgba(35, 134, 54, 0.4);
    }

    .code-block.code-terminal .code-lang-badge {
      background: linear-gradient(135deg, #2ea043 0%, #238636 100%);
    }

    .code-block.code-diff .code-lang-badge {
      background: linear-gradient(135deg, #1f6feb 0%, #1960c7 100%);
    }

    /* Copy Button */
    .code-copy-btn {
      background: linear-gradient(180deg, #21262d 0%, #1c2128 100%);
      border: 1px solid #30363d;
      color: #c9d1d9;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.7rem;
      font-weight: 500;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 6px;
      position: relative;
      overflow: hidden;
    }

    .code-copy-btn::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.1);
      transform: translate(-50%, -50%);
      transition: width 0.4s ease, height 0.4s ease;
    }

    .code-copy-btn:hover::before {
      width: 200px;
      height: 200px;
    }

    .code-copy-btn:hover {
      background: linear-gradient(180deg, #30363d 0%, #2a3038 100%);
      border-color: #484f58;
      color: #e6edf3;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .code-copy-btn .copy-text-success {
      display: none;
    }

    .code-copy-btn.copy-success {
      background: linear-gradient(135deg, #238636 0%, #2ea043 100%);
      border-color: #3fb950;
      color: #fff;
      box-shadow: 0 4px 16px rgba(35, 134, 54, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }

    .code-copy-btn.copy-success .copy-text-default {
      display: none;
    }

    .code-copy-btn.copy-success .copy-text-success {
      display: inline;
      color: #fff;
    }

    /* Code Body */
    .code-block-body {
      position: relative;
      background: #0d1117;
    }

    .code-block pre {
      margin: 0;
      padding: 20px;
      overflow-x: auto;
      background: transparent;
      border: none;
      font-size: 13.5px;
      line-height: 1.6;
    }

    .code-block pre::-webkit-scrollbar {
      height: 10px;
    }

    .code-block pre::-webkit-scrollbar-track {
      background: #0d1117;
      border-top: 1px solid #161b22;
    }

    .code-block pre::-webkit-scrollbar-thumb {
      background: linear-gradient(90deg, #30363d 0%, #484f58 100%);
      border-radius: 5px;
      border: 2px solid #0d1117;
    }

    .code-block pre::-webkit-scrollbar-thumb:hover {
      background: linear-gradient(90deg, #484f58 0%, #6e7681 100%);
    }

    .code-block code {
      background: none;
      padding: 0;
      font-family: 'Fira Code', 'JetBrains Mono', 'Consolas', monospace;
      font-size: 13px;
      line-height: 1.7;
      white-space: pre;
      color: #e6edf3;
      font-feature-settings: "calt" 1;
      text-rendering: optimizeLegibility;
    }

    .code-block pre code {
      display: block;
      width: 100%;
    }

    /* Custom Syntax Highlighting */
    .code-block :global(.hl-keyword) {
      color: #ff7b72;
    }
    .code-block :global(.hl-string) {
      color: #a5d6ff;
    }
    .code-block :global(.hl-number) {
      color: #79c0ff;
    }
    .code-block :global(.hl-comment) {
      color: #8b949e;
      font-style: italic;
    }
    .code-block :global(.hl-function) {
      color: #d2a8ff;
    }
  `,
  ],
})
export class CodeBlockComponent implements OnInit {
  @Input() code = '';
  @Input() lang = 'plaintext';
  @Input() title = 'Code';
  @Input() enableHighlighting = false;

  readonly highlightedCode = signal<string>('');
  readonly copied = signal<boolean>(false);
  readonly isPlain = signal<boolean>(true);

  async ngOnInit() {
    this.isPlain.set(!this.enableHighlighting);

    if (this.enableHighlighting) {
      await this.highlightCode();
    }
  }

  private async highlightCode() {
    try {
      const highlighted = this.customHighlight(this.code, this.lang);
      this.highlightedCode.set(highlighted);
    } catch (error) {
      console.error('[CodeBlock] Highlight error:', error);
      this.highlightedCode.set(this.escape(this.code));
    }
  }

  private customHighlight(code: string, lang: string): string {
    const keywords: Record<string, string> = {
      typescript:
        'const let var function class interface type import export return if else for while switch case break continue new this async await try catch throw extends implements',
      ts: 'const let var function class interface type import export return if else for while switch case break continue new this async await try catch throw extends implements',
      javascript:
        'const let var function class import export return if else for while switch case break continue new this async await try catch throw',
      js: 'const let var function class import export return if else for while switch case break continue new this async await try catch throw',
      python:
        'def class import from return if elif else for while break continue pass try except raise with as lambda yield',
      py: 'def class import from return if elif else for while break continue pass try except raise with as lambda yield',
      bash: 'if then else fi for do done while case esac function return source export local',
      sh: 'if then else fi for do done while case esac function return source export local',
      shell: 'if then else fi for do done while case esac function return source export local',
    };

    const strings = /("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)/g;
    const comments = /(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm;
    const numbers = /\b(\d+\.?\d*)\b/g;

    let result = this.escape(code);
    result = result.replace(comments, '<span class="hl-comment">$1</span>');
    result = result.replace(strings, '<span class="hl-string">$1</span>');
    result = result.replace(numbers, '<span class="hl-number">$1</span>');

    const langWords = (keywords[lang] || keywords[lang.split('-')[0]] || '').split(' ');
    for (const kw of langWords) {
      if (kw) {
        const kwRegex = new RegExp(`\\b(${kw})\\b`, 'g');
        result = result.replace(kwRegex, '<span class="hl-keyword">$1</span>');
      }
    }

    const funcs = /\b([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    result = result.replace(funcs, '<span class="hl-function">$1</span>(');

    return result;
  }

  private escape(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async copyCode() {
    try {
      await navigator.clipboard.writeText(this.code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    } catch (err) {
      console.error('[CodeBlock] Copy failed:', err);
    }
  }
}
