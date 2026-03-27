import { CommonModule } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';

interface LogEntry {
  type: 'log' | 'error' | 'warn';
  message: string;
  time: string;
}

@Component({
  selector: 'app-devtools',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="devtools" [class.expanded]="isExpanded()">
      <div class="devtools-bar" (click)="toggle()">
        <span class="devtools-icon">⚛️</span>
        <span class="devtools-title">DevTools</span>
        <span class="devtools-toggle">{{ isExpanded() ? '▼' : '▲' }}</span>
      </div>
      @if (isExpanded()) {
        <div class="devtools-panel">
          <div class="tabs">
            <button 
              class="tab" 
              [class.active]="activeTab() === 'console'"
              (click)="setTab('console')">
              Console
            </button>
            <button 
              class="tab" 
              [class.active]="activeTab() === 'info'"
              (click)="setTab('info')">
              Info
            </button>
          </div>
          
          @if (activeTab() === 'console') {
            <div class="console-panel">
              @for (log of logs(); track log.time + log.message) {
                <div class="console-line" [class.error]="log.type === 'error'" [class.warn]="log.type === 'warn'">
                  <span class="console-time">{{ log.time }}</span>
                  <span class="console-type">{{ log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️' }}</span>
                  <span class="console-msg">{{ log.message }}</span>
                </div>
              }
              @if (logs().length === 0) {
                <div class="console-empty">No console output</div>
              }
            </div>
          }
          
          @if (activeTab() === 'info') {
            <div class="info-panel">
              <div class="info-grid">
                <div class="info-item">
                  <span class="label">Time:</span>
                  <span class="value">{{ sessionDuration() }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Route:</span>
                  <span class="value">{{ currentRoute() }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Errors:</span>
                  <span class="value error">{{ errorCount() }}</span>
                </div>
                <div class="info-item">
                  <span class="label">Logs:</span>
                  <span class="value">{{ logs().length }}</span>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
    .devtools {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 999999;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 11px;
      pointer-events: none;
    }
    .devtools > * {
      pointer-events: auto;
    }
    .devtools-bar {
      background: linear-gradient(180deg, #2d2d2d 0%, #1e1e1e 100%);
      color: #ccc;
      padding: 4px 12px;
      border-top: 1px solid #444;
      border-left: 1px solid #444;
      border-right: 1px solid #444;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      user-select: none;
      height: 28px;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
    }
    .devtools-bar:hover { background: linear-gradient(180deg, #3d3d3d 0%, #2e2e2e 100%); }
    .devtools-icon { font-size: 14px; }
    .devtools-title { font-weight: 500; letter-spacing: 0.5px; }
    .devtools-toggle { margin-left: auto; opacity: 0.6; font-size: 10px; }
    
    .devtools-panel {
      background: #1e1e1e;
      border: 1px solid #444;
      border-top: none;
      max-height: 200px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
    }
    
    .tabs {
      display: flex;
      background: #252526;
      border-bottom: 1px solid #444;
    }
    .tab {
      background: transparent;
      border: none;
      color: #999;
      padding: 6px 16px;
      cursor: pointer;
      font-size: 11px;
      font-family: inherit;
      border-right: 1px solid #444;
      transition: all 0.15s;
    }
    .tab:hover { background: #2d2d2d; color: #ccc; }
    .tab.active {
      background: #1e1e1e;
      color: #fff;
      border-bottom: 2px solid #007acc;
    }
    
    .console-panel {
      flex: 1;
      overflow-y: auto;
      max-height: 170px;
      padding: 4px 8px;
    }
    .console-line {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      padding: 2px 0;
      border-bottom: 1px solid #2a2a2a;
    }
    .console-line:last-child { border-bottom: none; }
    .console-line.error { color: #f48771; }
    .console-line.warn { color: #cca700; }
    .console-time {
      color: #6a6a6a;
      font-size: 10px;
      min-width: 60px;
    }
    .console-type { min-width: 16px; }
    .console-msg {
      color: #d4d4d4;
      word-break: break-word;
      flex: 1;
    }
    .console-empty {
      color: #6a6a6a;
      text-align: center;
      padding: 20px;
      font-style: italic;
    }
    
    .info-panel {
      padding: 8px;
    }
    .info-grid { display: flex; flex-direction: column; gap: 4px; }
    .info-item { display: flex; gap: 8px; align-items: center; }
    .label { color: #9cdcfe; min-width: 70px; font-weight: 500; }
    .value { color: #b5cea8; }
    .value.error { color: #f48771; }
    
    ::-webkit-scrollbar { width: 10px; height: 10px; }
    ::-webkit-scrollbar-track { background: #1e1e1e; }
    ::-webkit-scrollbar-thumb { background: #444; border-radius: 5px; }
    ::-webkit-scrollbar-thumb:hover { background: #555; }
  `,
  ],
})
export class DevtoolsComponent {
  private router = inject(Router);
  private startTime = new Date();
  private route = signal('/');
  private errorCount = signal(0);
  private logs = signal<LogEntry[]>([]);
  private activeTab = signal<'console' | 'info'>('console');

  isExpanded = signal(true);
  currentRoute = this.route.asReadonly();

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.route.set(event.urlAfterRedirects);
        this.addLog('log', `Route: ${event.urlAfterRedirects}`);
      }
    });

    this.interceptConsole();
    this.addLog('log', 'DevTools initialized');
  }

  private interceptConsole() {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const addLog = (type: 'log' | 'error' | 'warn', args: any[]) => {
      const message = args.map((a) => 
        typeof a === 'object' ? JSON.stringify(a) : String(a)
      ).join(' ');
      this.errorCount.update((c) => type === 'error' ? c + 1 : c);
      this.addLog(type, message);
    };

    console.log = (...args) => { addLog('log', args); originalLog.apply(console, args); };
    console.error = (...args) => { addLog('error', args); originalError.apply(console, args); };
    console.warn = (...args) => { addLog('warn', args); originalWarn.apply(console, args); };
  }

  private addLog(type: 'log' | 'error' | 'warn', message: string) {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    this.logs.update((logs) => [...logs.slice(-49), { type, message, time }]);
  }

  sessionDuration = () => {
    const diff = Date.now() - this.startTime.getTime();
    const secs = Math.floor(diff / 1000);
    const mins = Math.floor(secs / 60);
    return mins > 0 ? `${mins}m ${secs % 60}s` : `${secs}s`;
  };

  setTab(tab: 'console' | 'info') {
    this.activeTab.set(tab);
  }

  toggle() {
    this.isExpanded.update((v) => !v);
  }
}
