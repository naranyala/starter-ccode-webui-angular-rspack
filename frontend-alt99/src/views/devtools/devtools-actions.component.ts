// DevTools Actions Tab Component
import { Component, inject } from '@angular/core';
import { DevToolsService } from '../../core/devtools.service';

@Component({
  selector: 'app-devtools-actions',
  standalone: true,
  imports: [],
  template: `
    <div class="devtools-panel">
      <div class="panel-section">
        <h4>Quick Actions</h4>
        <div class="actions-grid">
          <button type="button" class="action-btn" (click)="refresh()">
            ⟳ Refresh All Data
          </button>
          <button type="button" class="action-btn" (click)="clearLogs()">
            🗔 Clear Logs
          </button>
          <button type="button" class="action-btn" (click)="clearErrors()">
            🗔 Clear Errors
          </button>
          <button type="button" class="action-btn" (click)="triggerTestError()">
            ⚠ Trigger Test Error
          </button>
        </div>
      </div>

      <div class="panel-section">
        <h4>Environment</h4>
        <div class="env-grid">
          <div class="env-item">
            <span class="env-label">User Agent:</span>
            <span class="env-value env-value--small">{{ userAgent }}</span>
          </div>
          <div class="env-item">
            <span class="env-label">Language:</span>
            <span class="env-value">{{ language }}</span>
          </div>
          <div class="env-item">
            <span class="env-label">Screen:</span>
            <span class="env-value">{{ screenResolution }}</span>
          </div>
          <div class="env-item">
            <span class="env-label">Timezone:</span>
            <span class="env-value">{{ timezone }}</span>
          </div>
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

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 8px;
      margin-bottom: 16px;
    }

    .action-btn {
      background: #0e639c;
      border: none;
      color: #fff;
      padding: 10px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }

    .action-btn:hover {
      background: #1177bb;
    }

    .env-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .env-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .env-label {
      color: #858585;
      font-size: 10px;
    }

    .env-value {
      color: #d4d4d4;
      font-size: 11px;
    }

    .env-value--small {
      font-size: 10px;
      word-break: break-all;
    }
  `],
})
export class DevtoolsActionsComponent {
  readonly devToolsService = inject(DevToolsService);

  userAgent = '';
  language = '';
  screenResolution = '';
  timezone = '';

  constructor() {
    if (typeof window !== 'undefined') {
      this.userAgent = navigator.userAgent;
      this.language = navigator.language;
      this.screenResolution = `${screen.width}x${screen.height}`;
      this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    }
  }

  async refresh(): Promise<void> {
    await this.devToolsService.refresh();
  }

  async clearLogs(): Promise<void> {
    await this.devToolsService.clearLogs();
    await this.devToolsService.getLogs();
  }

  async clearErrors(): Promise<void> {
    await this.devToolsService.clearErrors();
    await this.devToolsService.getErrors();
  }

  async triggerTestError(): Promise<void> {
    await this.devToolsService.reportError('TEST_ERROR', 'Test error from DevTools', 'devtools');
    await this.devToolsService.getErrors();
  }
}
