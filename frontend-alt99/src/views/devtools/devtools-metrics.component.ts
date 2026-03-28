// DevTools Metrics Tab Component
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevToolsService } from '../../core/devtools.service';

@Component({
  selector: 'app-devtools-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devtools-panel">
      <div class="panel-section">
        <h4>Performance Metrics</h4>
        <div class="metrics-list">
          @for (metric of metrics(); track metric.timestamp) {
            <div class="metric-item">
              <span class="metric-item__name">{{ metric.name }}</span>
              <span class="metric-item__value">{{ metric.value | number:'1.2-2' }} {{ metric.unit }}</span>
              <span class="metric-item__time">{{ formatTime(metric.timestamp) }}</span>
            </div>
          } @empty {
            <div class="empty-state">No metrics recorded</div>
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

    .metrics-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 400px;
      overflow-y: auto;
    }

    .metric-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
      font-size: 11px;
    }

    .metric-item__name { color: #9cdcfe; }
    .metric-item__value { color: #b5cea8; font-weight: bold; }
    .metric-item__time { color: #858585; }

    .empty-state {
      text-align: center;
      padding: 20px;
      color: #858585;
    }
  `],
})
export class DevtoolsMetricsComponent {
  readonly devToolsService = inject(DevToolsService);

  readonly metrics = this.devToolsService.recentMetrics;

  formatTime(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleTimeString();
  }
}
