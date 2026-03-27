import { CommonModule } from '@angular/common';
import { Component, inject, type OnInit, type Signal, signal, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ThemeService } from '../../services/theme.service';
import { WinBoxManagerService, type WindowInfo } from '../../services/winbox-manager.service';

@Component({
  selector: 'app-window-tabs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Fixed Top Two-Row Panel -->
    <div class="window-tab-bar">
      <!-- Row 1: App Title & Stats -->
      <div class="top-row">
        <div class="app-info">
          <span class="app-icon">🪟</span>
          <span class="app-title">starter-web-angular-rsbuild</span>
        </div>
        <div class="window-stats-right">
          <span class="stat-item">
            <span class="stat-value">{{ windowCount() }}</span>
            <span class="stat-label">Windows</span>
          </span>
          <span class="stat-divider">•</span>
          <span class="stat-item">
            <span class="stat-value minimized-count">{{ minimizedCount() }}</span>
            <span class="stat-label">Minimized</span>
          </span>
          @if (windowCount() > 0) {
            <button
              type="button"
              class="close-all-btn"
              (click)="closeAll()"
              title="Close all windows"
            >
              🗑️
            </button>
          }
          <button
            class="theme-toggle"
            (click)="themeService.toggle()"
            [attr.aria-label]="themeService.isDarkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
            [title]="themeService.isDarkMode() ? 'Light mode' : 'Dark mode'">
            {{ themeService.themeIcon() }}
          </button>
        </div>
      </div>

      <!-- Row 2: Home Button + Window Tabs Switcher -->
      <div class="bottom-row">
        <button
          type="button"
          class="home-tab"
          (click)="goHome()"
          title="Hide all windows and go home"
        >
          <span class="home-tab-icon">🏠</span>
          <span class="home-tab-label">Home</span>
        </button>
        <div class="tabs-scroll-container">
          @for (win of windows(); track win.id) {
            <button
              type="button"
              class="tab-item"
              [class.active]="isActive(win.id)"
              [class.minimized]="win.minimized"
              [style.border-bottom-color]="win.color"
              (click)="restoreWindow(win.id)"
              title="Click to focus: {{ win.title }}"
            >
              @if (win.icon) {
                <span class="tab-icon">{{ win.icon }}</span>
              }
              <span class="tab-title">{{ win.title }}</span>
            </button>
          } @empty {
            <span class="no-windows">No windows open - Click a card below to create one</span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
.window-tab-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: var(--bg-elevated);
  border-bottom: 1px solid var(--border-color);
  z-index: 1000;
}
.top-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.app-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.app-icon {
  font-size: 20px;
}
.app-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.window-stats-right {
  display: flex;
  align-items: center;
  gap: 16px;
}
.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--color-brand);
  background: var(--bg-hover);
  padding: 2px 8px;
  border-radius: 12px;
}
.stat-value.minimized-count {
  color: var(--color-warning);
}
.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.stat-divider {
  color: var(--border-color);
  font-size: 12px;
}
.close-all-btn, .theme-toggle {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.close-all-btn {
  background: var(--bg-hover);
  color: var(--color-error);
}
.close-all-btn:hover {
  background: var(--btn-hover);
}
.theme-toggle {
  background: var(--btn-bg);
  color: var(--text-primary);
}
.theme-toggle:hover {
  background: var(--btn-hover);
}
.bottom-row {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  background: var(--bg-elevated);
  gap: 8px;
  overflow-x: auto;
}
.home-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--color-success);
  border: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: background 0.15s;
  flex-shrink: 0;
}
.home-tab:hover {
  background: var(--color-success);
  filter: brightness(0.9);
}
.home-tab-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-inverse);
}
.tabs-scroll-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
  overflow-x: auto;
  overflow-y: hidden;
  min-width: 0;
}
.tabs-scroll-container::-webkit-scrollbar {
  height: 3px;
}
.tabs-scroll-container::-webkit-scrollbar-track {
  background: transparent;
}
.tabs-scroll-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}
.tab-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
  min-height: 30px;
}
.tab-item:hover {
  background: var(--bg-hover);
  border-color: var(--color-brand);
}
.tab-item.active {
  background: var(--bg-primary);
  border-bottom: 2px solid var(--color-brand);
  margin-bottom: -1px;
}
.tab-item.minimized {
  opacity: 0.5;
  background: var(--bg-secondary);
}
.tab-item.minimized .tab-title {
  font-style: italic;
}
.tab-item.minimized:hover {
  opacity: 0.8;
}
.tab-icon {
  font-size: 14px;
  line-height: 1;
}
.tab-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
}
.tab-item.active .tab-title {
  color: var(--text-primary);
  font-weight: 600;
}
.no-windows {
  color: var(--text-muted);
  font-size: 12px;
}
@media (max-width: 768px) {
  .top-row {
    height: 40px;
    padding: 0 12px;
  }
  .app-title {
    font-size: 13px;
  }
  .stat-label {
    display: none;
  }
  .bottom-row {
    height: 40px;
    padding: 0 8px;
  }
  .home-tab-label {
    display: none;
  }
}
@media (max-width: 480px) {
  .app-title {
    display: none;
  }
  .stat-divider {
    display: none;
  }
}
`],
})
export class WindowTabsComponent implements OnInit {
  readonly winBoxManager = inject(WinBoxManagerService);
  readonly windows: Signal<WindowInfo[]>;
  readonly themeService = inject(ThemeService);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor() {
    this.windows = this.winBoxManager.windowsList;
  }

  ngOnInit(): void {
    // Keyboard shortcut
    document.addEventListener('keydown', e => {
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        // Focus first window when shortcut pressed
        const firstWindow = this.winBoxManager.windowsList()[0];
        if (firstWindow) {
          this.winBoxManager.restoreWindow(firstWindow.id);
        }
      }
    });
  }

  windowCount = () => this.winBoxManager.getWindowCount();
  minimizedCount = () => this.winBoxManager.getMinimizedCount();

  restoreWindow(id: string): void {
    this.winBoxManager.restoreWindow(id);
    this.cdr.detectChanges();
  }

  isActive(id: string): boolean {
    return this.winBoxManager.activeWindowId() === id;
  }

  goHome(): void {
    this.winBoxManager.hideAll();
  }

  closeAll(): void {
    this.winBoxManager.closeAll();
  }
}
