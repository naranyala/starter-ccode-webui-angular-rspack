import { Injectable, type Signal, signal } from '@angular/core';

export interface WindowInfo {
  id: string;
  title: string;
  color: string;
  icon?: string;
  instance: any; // WinBoxInstance
  minimized: boolean;
  timestamp: number;
}

@Injectable({
  providedIn: 'root',
})
export class WinBoxManagerService {
  private readonly windows = signal<WindowInfo[]>([]);
  readonly windowsList: Signal<WindowInfo[]> = this.windows.asReadonly();
  readonly activeWindowId = signal<string | null>(null);

  // Top panel height for maximizing windows
  readonly topPanelHeight = 88; // Height of two-row panel (44px + 44px)

  constructor() {
    // Handle window resize to update all windows
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => this.onWindowResize());
    }
  }

  private onWindowResize(): void {
    const windows = this.windows();
    const top = this.topPanelHeight;
    const width = window.innerWidth;
    const height = window.innerHeight - top;

    windows.forEach(win => {
      if (win.instance && !win.minimized) {
        win.instance.resize(width, height);
        win.instance.move(0, top);
      }
    });
  }

  private generateId(): string {
    return `winbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  registerWindow(options: { title: string; color: string; instance: any; icon?: string }): string {
    const id = this.generateId();
    const windowInfo: WindowInfo = {
      id,
      title: options.title,
      color: options.color,
      icon: options.icon,
      instance: options.instance,
      minimized: false,
      timestamp: Date.now(),
    };

    this.windows.update(windows => [...windows, windowInfo]);
    this.activeWindowId.set(id);

    // Set up event handlers
    options.instance.onminimize = () => {
      this.minimizeWindow(id);
    };

    options.instance.onfocus = () => {
      this.activeWindowId.set(id);
    };

    options.instance.onclose = () => {
      this.closeWindow(id);
    };

    // Using default WinBox styling
    this.applyThemeClass(options.instance);

    return id;
  }

  private applyThemeClass(instance: any): void {
    // Using default WinBox styling - no custom class needed
  }

  updateAllWindowsTheme(): void {
    // Using default WinBox styling - no theme updates needed
  }

  createMaximizedWindow(options: {
    title: string;
    color: string;
    icon?: string;
    html: string;
    onfocus?: (this: any) => void;
  }): { id: string; instance: any } {
    if (!window.WinBox) {
      console.error('WinBox is not available');
      return { id: '', instance: null };
    }

    // Calculate dimensions respecting two-row top panel with zero margin
    const top = this.topPanelHeight;
    const width = window.innerWidth;
    const height = window.innerHeight - top;

    const _win = new window.WinBox({
      title: options.title,
      background: options.color,
      width: width + 'px',
      height: height + 'px',
      x: 0,
      y: top,
      html: options.html,
      onfocus: options.onfocus,
    });

    const id = this.registerWindow({
      title: options.title,
      color: options.color,
      instance: _win,
      icon: options.icon,
    });

    return { id, instance: _win };
  }

  focusWindow(id: string): void {
    const windowInfo = this.windows().find(w => w.id === id);
    if (windowInfo) {
      windowInfo.instance.minimized = false;
      windowInfo.instance.show();
      windowInfo.instance.focus();

      this.windows.update(windows =>
        windows.map(w => (w.id === id ? { ...w, minimized: false } : w))
      );
      
      this.activeWindowId.set(id);
    }
  }

  minimizeWindow(id: string): void {
    const windowInfo = this.windows().find(w => w.id === id);
    if (windowInfo) {
      windowInfo.instance.minimized = true;
      windowInfo.instance.hide();

      this.windows.update(windows =>
        windows.map(w => (w.id === id ? { ...w, minimized: true } : w))
      );
      
      if (this.activeWindowId() === id) {
        this.activeWindowId.set(null);
      }
    }
  }

  restoreWindow(id: string): void {
    const windowInfo = this.windows().find(w => w.id === id);
    if (windowInfo) {
      // Show the window first
      if (windowInfo.instance.minimized) {
        windowInfo.instance.minimized = false;
      }
      
      // Call show and focus
      windowInfo.instance.show();
      windowInfo.instance.focus();
      
      // Update state
      this.windows.update(windows =>
        windows.map(w => (w.id === id ? { ...w, minimized: false } : w))
      );

      // Set active window - force signal update
      const currentId = this.activeWindowId();
      if (currentId !== id) {
        this.activeWindowId.set(id);
      }
    }
  }

  private bringToFront(id: string): void {
    const windowInfo = this.windows().find(w => w.id === id);
    if (windowInfo?.instance) {
      // Use DOM manipulation to bring to front
      const dom = windowInfo.instance.dom;
      if (dom) {
        const maxZ = this.getMaxZIndex();
        dom.style.zIndex = String(maxZ + 10);
      }
    }
  }

  private getMaxZIndex(): number {
    let maxZ = 1000;
    this.windows().forEach(w => {
      if (w.instance?.dom?.style?.zIndex) {
        const z = parseInt(w.instance.dom.style.zIndex, 10);
        if (!isNaN(z) && z > maxZ) maxZ = z;
      }
    });
    return maxZ;
  }

  maximizeWindow(id: string): void {
    const windowInfo = this.windows().find(w => w.id === id);
    if (windowInfo) {
      windowInfo.instance.show();
      windowInfo.instance.maximize();
      windowInfo.instance.minimized = false;

      this.windows.update(windows =>
        windows.map(w => (w.id === id ? { ...w, minimized: false } : w))
      );

      this.bringToFront(id);
    }
  }

  closeWindow(id: string): void {
    const windowInfo = this.windows().find(w => w.id === id);
    if (windowInfo) {
      try {
        windowInfo.instance.close();
      } catch (e) {
        console.error('Error closing window:', e);
      }
    }
    this.windows.update(windows => windows.filter(w => w.id !== id));
  }

  closeAll(): void {
    const windows = this.windows();
    windows.forEach(win => {
      try {
        win.instance.close();
      } catch (e) {
        console.error('Error closing window:', e);
      }
    });
    this.windows.set([]);
  }

  minimizeAll(): void {
    const windows = this.windows();
    windows.forEach(win => {
      this.minimizeWindow(win.id);
    });
  }

  getWindowCount(): number {
    return this.windows().length;
  }

  getMinimizedCount(): number {
    return this.windows().filter(w => w.minimized).length;
  }

  hideAll(): void {
    const windows = this.windows();
    windows.forEach(win => {
      win.instance.hide();
      win.minimized = true;
    });
    this.windows.update(windowsList => windowsList.map(w => ({ ...w, minimized: true })));
  }

  showAll(): void {
    const windows = this.windows();
    windows.forEach(win => {
      win.instance.show();
      win.minimized = false;
    });
    this.windows.update(windowsList => windowsList.map(w => ({ ...w, minimized: false })));
  }

  getTopPanelHeight(): number {
    return this.topPanelHeight;
  }
}
