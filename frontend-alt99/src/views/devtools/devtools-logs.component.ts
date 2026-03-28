// DevTools Logs Tab Component
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevToolsService, type LogEntry } from '../../core/devtools.service';

@Component({
  selector: 'app-devtools-logs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devtools-panel">
      <div class="panel-section">
        <h4>Recent Logs ({{ logs().length }})</h4>
        <div class="logs-list">
          @for (log of logs(); track log.timestamp) {
            <div class="log-item log-item--{{ log.level }}">
              <span class="log-item__time">{{ formatTime(log.timestamp) }}</span>
              <span class="log-item__level">{{ log.level }}</span>
              <span class="log-item__source">{{ log.source }}</span>
              <span class="log-item__message">{{ log.message }}</span>
            </div>
          } @empty {
            <div class="empty-state">No logs available</div>
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

    .logs-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .log-item {
      display: grid;
      grid-template-columns: 60px 50px 80px 1fr;
      gap: 8px;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
      font-size: 11px;
    }

    .log-item--debug { border-left: 2px solid #6a9955; }
    .log-item--info { border-left: 2px solid #007acc; }
    .log-item--warn { border-left: 2px solid #dcdcaa; }
    .log-item--error { border-left: 2px solid #c7254e; }

    .log-item__time { color: #858585; }
    .log-item__level { font-weight: bold; }
    .log-item__source { color: #9cdcfe; }
    .log-item__message { color: #d4d4d4; }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: #858585;
    }
  `],
})
export class DevtoolsLogsComponent {
  readonly devToolsService = inject(DevToolsService);

  readonly logs = this.devToolsService.recentLogs;

  formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString();
  }
}
