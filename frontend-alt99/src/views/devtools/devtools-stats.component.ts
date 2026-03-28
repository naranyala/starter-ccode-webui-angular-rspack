// DevTools Statistics Tab Component
import { Component, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevToolsService } from '../../core/devtools.service';

@Component({
  selector: 'app-devtools-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devtools-panel">
      <div class="panel-section">
        <h4>Application Statistics</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-card__value">{{ formatUptime(uptime()) }}</div>
            <div class="stat-card__label">Uptime</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ stats()?.request_count ?? 0 }}</div>
            <div class="stat-card__label">Requests</div>
          </div>
          <div class="stat-card stat-card--warning">
            <div class="stat-card__value">{{ stats()?.error_count ?? 0 }}</div>
            <div class="stat-card__label">Errors</div>
          </div>
          <div class="stat-card">
            <div class="stat-card__value">{{ stats()?.active_connections ?? 0 }}</div>
            <div class="stat-card__label">Connections</div>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <h4>Memory Usage</h4>
        <div class="memory-bar">
          <div class="memory-bar__fill" [style.width.%]="memoryPercent()">
            {{ memoryPercent() | number:'1.0-0' }}%
          </div>
        </div>
        <div class="memory-details">
          <span>Used: {{ memoryUsed() | number:'1.0-0' }} MB</span>
          <span>Total: {{ memoryTotal() | number:'1.0-0' }} MB</span>
          <span>Available: {{ memoryAvailable() | number:'1.0-0' }} MB</span>
        </div>
      </div>

      <div class="panel-section">
        <h4>System Information</h4>
        <div class="system-info">
          <div class="info-row">
            <span class="info-label">Hostname:</span>
            <span class="info-value">{{ systemInfo()?.hostname ?? 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">OS:</span>
            <span class="info-value">{{ systemInfo()?.os ?? 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Architecture:</span>
            <span class="info-value">{{ systemInfo()?.arch ?? 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">CPU Cores:</span>
            <span class="info-value">{{ systemInfo()?.cpu_cores ?? 'N/A' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Load Average:</span>
            <span class="info-value">{{ loadAverage() }}</span>
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

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
    }

    .stat-card {
      background: #1e1e1e;
      padding: 12px;
      border-radius: 4px;
      text-align: center;
      border-left: 3px solid #007acc;
    }

    .stat-card--warning {
      border-left-color: #c7254e;
    }

    .stat-card__value {
      font-size: 20px;
      font-weight: bold;
      color: #fff;
    }

    .stat-card__label {
      font-size: 10px;
      color: #858585;
      margin-top: 4px;
    }

    .memory-bar {
      background: #1e1e1e;
      border-radius: 4px;
      height: 30px;
      overflow: hidden;
      position: relative;
    }

    .memory-bar__fill {
      background: linear-gradient(90deg, #007acc, #00a8ff);
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      font-weight: bold;
      transition: width 0.3s ease;
    }

    .memory-details {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 11px;
      color: #858585;
    }

    .system-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 8px;
      background: #1e1e1e;
      border-radius: 4px;
    }

    .info-label {
      color: #858585;
    }

    .info-value {
      color: #d4d4d4;
    }
  `],
})
export class DevtoolsStatsComponent {
  private readonly devToolsService = inject(DevToolsService);

  readonly stats = this.devToolsService.devToolsStats;

  readonly uptime = computed(() => this.stats()?.uptime_seconds ?? 0);
  readonly memoryUsed = computed(() => this.stats()?.memory_usage.used_mb ?? 0);
  readonly memoryTotal = computed(() => this.stats()?.memory_usage.total_mb ?? 0);
  readonly memoryAvailable = computed(() => this.stats()?.memory_usage.available_mb ?? 0);
  readonly memoryPercent = computed(() => this.stats()?.memory_usage.percent ?? 0);
  readonly systemInfo = computed(() => this.stats()?.system_info ?? null);
  readonly loadAverage = computed(() => {
    const load = this.systemInfo()?.load_avg ?? [];
    return load.map(l => l.toFixed(2)).join(', ') || 'N/A';
  });

  formatUptime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  }
}
