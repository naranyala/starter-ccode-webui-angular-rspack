import { Component, Input, OnInit, signal, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-mermaid-diagram',
  standalone: true,
  template: `
    <div class="mermaid-diagram-container">
      <div class="mermaid-header">
        <span class="mermaid-label">Diagram</span>
      </div>
      <div class="mermaid" [id]="diagramId">
        {{ code }}
      </div>
      @if (error()) {
        <div class="mermaid-error">
          <span>⚠️</span> Error rendering diagram: {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      margin: 32px 0;
    }

    .mermaid-diagram-container {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #30363d;
      background: linear-gradient(180deg, #0d1117 0%, #0a0e14 100%);
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .mermaid-diagram-container:hover {
      border-color: #484f58;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }

    .mermaid-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(180deg, #161b22 0%, #13181f 100%);
      border-bottom: 1px solid #30363d;
      position: relative;
    }

    .mermaid-header::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 16px;
      right: 16px;
      height: 1px;
      background: linear-gradient(90deg, transparent, rgba(48, 54, 61, 0.5), transparent);
    }

    .mermaid-label {
      font-size: 0.75rem;
      color: #8b949e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', monospace;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .mermaid {
      padding: 24px;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow-x: auto;
      background: #0d1117;
      min-height: 100px;
    }

    .mermaid svg {
      max-width: 100%;
      height: auto;
    }

    .mermaid-error {
      padding: 20px;
      color: #f85149;
      background: rgba(248,81,73,0.1);
      border-top: 1px solid #f85149;
      text-align: center;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    /* Mermaid dark theme */
    .mermaid :global(.label) {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #e6edf3;
      font-size: 13px;
    }

    .mermaid :global(.node rect),
    .mermaid :global(.node circle),
    .mermaid :global(.node ellipse),
    .mermaid :global(.node polygon) {
      fill: #161b22;
      stroke: #30363d;
    }

    .mermaid :global(.edgeLabel) {
      background: #0d1117;
      color: #c9d1d9;
    }

    .mermaid :global(.edgePath .path) {
      stroke: #8b949e;
    }

    .mermaid :global(.cluster rect) {
      fill: #161b22;
      stroke: #30363d;
    }

    .mermaid :global(.node .label) {
      color: #e6edf3;
    }

    .mermaid :global(.flowchart-link) {
      stroke: #8b949e;
    }

    .mermaid :global(.marker) {
      stroke: #8b949e;
      fill: #8b949e;
    }
  `]
})
export class MermaidDiagramComponent implements OnInit, AfterViewInit {
  @Input() code = '';
  @Input() diagramId = 'mermaid-' + Math.random().toString(36).substring(2, 9);

  readonly error = signal<string | null>(null);

  ngOnInit() {
    // Generate unique ID if not provided
    if (!this.diagramId) {
      this.diagramId = 'mermaid-' + Math.random().toString(36).substring(2, 9);
    }
  }

  ngAfterViewInit() {
    this.renderMermaid();
  }

  private async renderMermaid() {
    // Wait a bit for the view to initialize
    setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).mermaid) {
        try {
          const mermaid = (window as any).mermaid;
          
          // Initialize if not already done
          if (!mermaid.initialized) {
            mermaid.initialize({
              startOnLoad: false,
              theme: 'dark',
              securityLevel: 'loose',
              fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
              themeVariables: {
                fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
              },
            });
            mermaid.initialized = true;
          }

          // Find the element and render
          const element = document.getElementById(this.diagramId);
          if (element && this.code) {
            // Insert the code
            element.textContent = this.code;
            
            // Render the diagram
            mermaid.run({
              querySelector: `#${this.diagramId}`,
            });
          }
        } catch (err) {
          console.error('[Mermaid] Render error:', err);
          this.error.set(err instanceof Error ? err.message : 'Unknown error');
        }
      } else {
        console.warn('[Mermaid] Library not loaded');
        this.error.set('Mermaid.js not loaded');
      }
    }, 200);
  }
}
