// src/views/devtools/devtools.component.ts
// DevTools panel - refactored to use sub-components for each tab

import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DevToolsService } from '../../core/devtools.service';
import { DevtoolsStatsComponent } from './devtools-stats.component';
import { DevtoolsLogsComponent } from './devtools-logs.component';
import { DevtoolsErrorsComponent } from './devtools-errors.component';
import { DevtoolsMetricsComponent } from './devtools-metrics.component';
import { DevtoolsActionsComponent } from './devtools-actions.component';

@Component({
  selector: 'app-devtools',
  standalone: true,
  imports: [
    CommonModule,
    DevtoolsStatsComponent,
    DevtoolsLogsComponent,
    DevtoolsErrorsComponent,
    DevtoolsMetricsComponent,
    DevtoolsActionsComponent,
  ],
  template: `
    <div class="devtools">
      <div class="devtools__header">
        <h3>DevTools</h3>
        <div class="devtools__actions">
          <button type="button" class="btn btn--icon" (click)="refresh()" title="Refresh">⟳</button>
          <button type="button" class="btn btn--icon" (click)="clearLogs()" title="Clear">🗔</button>
        </div>
      </div>

      <div class="devtools__tabs">
        @for (tab of tabs; track tab.id) {
          <button type="button"
                  class="devtools__tab"
                  [class.active]="activeTab() === tab.id"
                  (click)="activeTab.set(tab.id)">
            {{ tab.icon }} {{ tab.label }}
          </button>
        }
      </div>

      <div class="devtools__content">
        @if (devToolsService.isLoading()) {
          <div class="loading-state">Loading...</div>
        }

        @if (activeTab() === 'stats') {
          <app-devtools-stats />
        }

        @if (activeTab() === 'logs') {
          <app-devtools-logs />
        }

        @if (activeTab() === 'errors') {
          <app-devtools-errors />
        }

        @if (activeTab() === 'metrics') {
          <app-devtools-metrics />
        }

        @if (activeTab() === 'actions') {
          <app-devtools-actions />
        }
      </div>
    </div>
  `,
  styles: [`
    .devtools {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #1e1e1e;
      color: #d4d4d4;
    }

    .devtools__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: #252526;
      border-bottom: 1px solid #3c3c3c;
    }

    .devtools__header h3 {
      margin: 0;
      font-size: 14px;
      color: #fff;
    }

    .devtools__actions {
      display: flex;
      gap: 4px;
    }

    .btn--icon {
      background: #3c3c3c;
      border: none;
      color: #d4d4d4;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .btn--icon:hover {
      background: #4c4c4c;
    }

    .devtools__tabs {
      display: flex;
      gap: 2px;
      padding: 4px 8px;
      background: #252526;
      border-bottom: 1px solid #3c3c3c;
    }

    .devtools__tab {
      background: transparent;
      border: none;
      color: #858585;
      padding: 6px 12px;
      border-radius: 4px 4px 0 0;
      cursor: pointer;
      white-space: nowrap;
      font-size: 11px;
    }

    .devtools__tab:hover {
      background: #2a2a2a;
      color: #d4d4d4;
    }

    .devtools__tab.active {
      background: #1e1e1e;
      color: #fff;
    }

    .devtools__content {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
    }

    .loading-state {
      text-align: center;
      padding: 40px;
      color: #858585;
    }
  `],
})
export class DevtoolsComponent implements OnInit {
  readonly devToolsService = inject(DevToolsService);

  activeTab = signal<'stats' | 'logs' | 'errors' | 'metrics' | 'actions'>('stats');

  tabs: { id: 'stats' | 'logs' | 'errors' | 'metrics' | 'actions'; label: string; icon: string }[] = [
    { id: 'stats', label: 'Statistics', icon: '📊' },
    { id: 'logs', label: 'Logs', icon: '📝' },
    { id: 'errors', label: 'Errors', icon: '⚠' },
    { id: 'metrics', label: 'Metrics', icon: '📈' },
    { id: 'actions', label: 'Actions', icon: '⚡' },
  ];

  ngOnInit(): void {
    this.refresh();
  }

  async refresh(): Promise<void> {
    await this.devToolsService.refresh();
  }

  async clearLogs(): Promise<void> {
    await this.devToolsService.clearLogs();
    await this.devToolsService.getLogs();
  }
}
