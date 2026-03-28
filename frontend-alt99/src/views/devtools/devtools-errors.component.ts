// DevTools Errors Tab Component
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevToolsService } from '../../core/devtools.service';

@Component({
  selector: 'app-devtools-errors',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devtools-panel">
      <div class="panel-section">
        <h4>Error Reports ({{ errors().length }})</h4>
        <div class="error-stats">
          <div class="error-stat">
            <span class="error-stat__value">{{ errorStats().total }}</span>
            <span class="error-stat__label">Total</span>
          </div>
          <div class="error-stat error-stat--critical">
            <span class="error-stat__value">{{ errorStats().criticalCount }}</span>
            <span class="error-stat__label">Critical</span>
          </div>
        </div>
        <div class="errors-list">
          @for (error of errors(); track error.timestamp) {
            <div class="error-item error-item--{{ error.error_code.includes('CRITICAL') ? 'critical' : 'normal' }}">
              <div class="error-item__header">
                <span class="error-item__time">{{ formatTime(error.timestamp) }}</span>
                <span class="error-item__code">{{ error.error_code }}</span>
              </div>
              <div class="error-item__message">{{ error.message }}</div>
              <div class="error-item__source">Source: {{ error.source }}</div>
            </div>
          } @empty {
            <div class="empty-state">No errors reported</div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .devtools-panel {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .panel-section {
      background: #252526;
      border-radius: 6px;
      padding: 12px;
    }

    .panel-section h4 {
      margin: 0 0 12px 0;
      font-size: 13px;
      color: #fff;
      border-bottom: 1px solid #3c3c3c;
      padding-bottom: 8px;
    }

    .error-stats {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }

    .error-stat {
      background: #1e1e1e;
      padding: 12px;
      border-radius: 4px;
      text-align: center;
      flex: 1;
    }

    .error-stat--critical {
      background: #2d1f1f;
    }

    .error-stat__value {
      display: block;
      font-size: 24px;
      font-weight: bold;
      color: #fff;
    }

    .error-stat--critical .error-stat__value {
      color: #c7254e;
    }

    .error-stat__label {
      display: block;
      font-size: 10px;
      color: #858585;
      margin-top: 4px;
    }

    .errors-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .error-item {
      padding: 8px;
      background: #1e1e1e;
      border-radius: 4px;
      border-left: 3px solid #858585;
    }

    .error-item--critical {
      border-left-color: #c7254e;
      background: #2d1f1f;
    }

    .error-item__header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 10px;
    }

    .error-item__time { color: #858585; }
    .error-item__code { color: #9cdcfe; font-weight: bold; }
    .error-item__message { color: #d4d4d4; margin-bottom: 4px; }
    .error-item__source { color: #858585; font-size: 10px; }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: #858585;
    }
  `],
})
export class DevtoolsErrorsComponent {
  readonly devToolsService = inject(DevToolsService);

  readonly errors = this.devToolsService.recentErrors;
  readonly errorStats = this.devToolsService.errorStats;

  formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString();
  }
}
