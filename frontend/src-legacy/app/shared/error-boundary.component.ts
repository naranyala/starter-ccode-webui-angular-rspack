import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GlobalErrorHandlerService, ErrorInfo } from './global-error-handler.service';

@Component({
  selector: 'app-error-boundary',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasErrors()) {
      <div class="error-boundary" [class.expanded]="isExpanded()">
        <div class="error-header" (click)="toggle()">
          <span class="error-icon">⚠️</span>
          <span class="error-count">{{ errorCount() }} Error{{ errorCount() === 1 ? '' : 's' }}</span>
          <span class="toggle-icon">{{ isExpanded() ? '▼' : '▲' }}</span>
        </div>

        @if (isExpanded()) {
          <div class="error-content">
            <div class="error-actions">
              <button class="clear-btn" (click)="clearErrors()">Clear All</button>
              <button class="close-btn" (click)="toggle()">Close</button>
            </div>

            <div class="error-list">
              @for (error of errors(); track error.timestamp) {
                <div class="error-item" [class]="error.message.length > 200 ? 'error-item-large' : ''">
                  <div class="error-item-header">
                    <span class="error-time">{{ formatTime(error.timestamp) }}</span>
                    @if (error.component) {
                      <span class="error-component">{{ error.component }}</span>
                    }
                  </div>
                  <div class="error-message">{{ error.message }}</div>
                  @if (error.stack) {
                    <details class="error-stack">
                      <summary>Stack Trace</summary>
                      <pre>{{ error.stack }}</pre>
                    </details>
                  }
                </div>
              }
            </div>
          </div>
        }
      </div>
    }
  `,
  styles: [`
    .error-boundary {
      position: fixed;
      bottom: 40px;
      right: 20px;
      z-index: 10000;
      min-width: 300px;
      max-width: 500px;
      max-height: 400px;
      overflow: hidden;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
      background: linear-gradient(135deg, #2d1b1b 0%, #1a1a1a 100%);
      border: 1px solid #e74c3c;
    }

    .error-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: rgba(231, 76, 60, 0.2);
      cursor: pointer;
      user-select: none;
    }

    .error-header:hover {
      background: rgba(231, 76, 60, 0.3);
    }

    .error-icon {
      font-size: 18px;
    }

    .error-count {
      flex: 1;
      font-weight: 600;
      color: #e74c3c;
    }

    .toggle-icon {
      color: #888;
    }

    .error-content {
      display: flex;
      flex-direction: column;
      max-height: 350px;
      overflow: hidden;
    }

    .error-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      padding: 8px 12px;
      border-bottom: 1px solid #333;
    }

    .clear-btn, .close-btn {
      padding: 4px 12px;
      font-size: 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      transition: background 0.15s;
    }

    .clear-btn {
      background: #e74c3c;
      color: white;
    }

    .clear-btn:hover {
      background: #c0392b;
    }

    .close-btn {
      background: #333;
      color: #ccc;
    }

    .close-btn:hover {
      background: #444;
    }

    .error-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;
    }

    .error-item {
      padding: 12px;
      margin-bottom: 8px;
      background: rgba(0, 0, 0, 0.3);
      border-radius: 6px;
      border-left: 3px solid #e74c3c;
    }

    .error-item:last-child {
      margin-bottom: 0;
    }

    .error-item-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;
    }

    .error-time {
      font-size: 11px;
      color: #666;
      font-family: monospace;
    }

    .error-component {
      font-size: 10px;
      padding: 2px 6px;
      background: #333;
      border-radius: 3px;
      color: #888;
      text-transform: uppercase;
    }

    .error-message {
      font-size: 13px;
      color: #e0e0e0;
      word-break: break-word;
    }

    .error-stack {
      margin-top: 8px;
      font-size: 11px;
    }

    .error-stack summary {
      cursor: pointer;
      color: #888;
      padding: 4px 0;
    }

    .error-stack summary:hover {
      color: #ccc;
    }

    .error-stack pre {
      margin: 8px 0;
      padding: 8px;
      background: #1a1a1a;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 10px;
      color: #888;
      max-height: 150px;
      overflow-y: auto;
    }

    .error-boundary::-webkit-scrollbar,
    .error-list::-webkit-scrollbar,
    .error-stack pre::-webkit-scrollbar {
      width: 6px;
    }

    .error-boundary::-webkit-scrollbar-track,
    .error-list::-webkit-scrollbar-track,
    .error-stack pre::-webkit-scrollbar-track {
      background: #1a1a1a;
    }

    .error-boundary::-webkit-scrollbar-thumb,
    .error-list::-webkit-scrollbar-thumb,
    .error-stack pre::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 3px;
    }
  `],
})
export class ErrorBoundaryComponent implements OnInit, OnDestroy {
  private errorHandlerService = inject(GlobalErrorHandlerService);
  errors = this.errorHandlerService.getErrorLog.bind(this.errorHandlerService);
  errorCount = this.errorHandlerService.getErrorCount.bind(this.errorHandlerService);
  private expanded = false;
  private removeListener?: () => void;

  ngOnInit(): void {
    // Listen for new errors
    this.removeListener = this.errorHandlerService.addListener((error) => {
      // Auto-expand on new error if not already expanded
      if (!this.expanded) {
        this.expanded = true;
      }
    });
  }

  ngOnDestroy(): void {
    this.removeListener?.();
  }

  hasErrors(): boolean {
    return this.errorCount() > 0;
  }

  isExpanded(): boolean {
    return this.expanded;
  }

  toggle(): void {
    this.expanded = !this.expanded;
  }

  clearErrors(): void {
    this.errorHandlerService.clearErrorLog();
    this.expanded = false;
  }

  formatTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString();
  }
}
