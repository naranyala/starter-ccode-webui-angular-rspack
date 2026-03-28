import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { WinBoxService, type WinBoxInstance } from '../core/winbox.service';
import { LucideAngularModule } from 'lucide-angular';
import { provideLucideIcons, Home, Lock, Database, Settings, Info, Menu, X } from '../core/lucide-icons.provider';

export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface MobileMenuState {
  isOpen: boolean;
}

export type AppView = 'home' | 'auth' | 'sqlite' | 'devtools' | 'settings' | 'help' | 'about';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  providers: [...provideLucideIcons()],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private readonly winboxService = inject(WinBoxService);

  // View state
  readonly activeView = signal<AppView>('home');
  readonly sidebarCollapsed = signal(false);
  readonly mobileMenuOpen = signal(false);

  // Window management
  readonly windowEntries = signal<WindowEntry[]>([]);
  private existingBoxes: WinBoxInstance[] = [];

  // Menu groups
  readonly mainMenus = computed<NavItem[]>(() => [
    { id: 'home', label: 'Home', icon: 'Home' },
    { id: 'auth', label: 'Auth', icon: 'Lock' },
    { id: 'sqlite', label: 'SQLite', icon: 'Database' },
    { id: 'devtools', label: 'DevTools', icon: 'Settings' },
  ]);

  readonly supportMenus = computed<NavItem[]>(() => [
    { id: 'settings', label: 'Settings', icon: 'Settings' },
    { id: 'help', label: 'Help', icon: 'Info' },
    { id: 'about', label: 'About', icon: 'Info' },
  ]);

  // Lucide icons
  readonly icons: { [key: string]: any } = {
    Home, Lock, Database, Settings, Info, Menu, X,
  };

  getIcon(name: string): any {
    return this.icons[name] || this.icons.Home;
  }

  getPageTitle(): string {
    const titles: Record<AppView, string> = {
      home: 'Home',
      auth: 'Authentication',
      sqlite: 'SQLite CRUD',
      devtools: 'DevTools',
      settings: 'Settings',
      help: 'Help',
      about: 'About',
    };
    return titles[this.activeView()] || 'App';
  }

  setActiveView(id: string): void {
    this.activeView.set(id as AppView);
    this.closeMobileMenu();
  }

  selectMenuItem(id: string): void {
    this.activeView.set(id as AppView);
    this.closeMobileMenu();
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(open => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(collapsed => !collapsed);
  }

  // Window management stubs
  closeAllWindows(): void {
    const boxesToClose = [...this.existingBoxes];
    for (const box of boxesToClose) {
      if (box) {
        try {
          if (box.min) box.restore();
          box.focus();
          box.close(true);
        } catch { /* Ignore */ }
      }
    }
    setTimeout(() => {
      const winboxElements = document.querySelectorAll('.winbox');
      winboxElements.forEach((el) => {
        try { el.remove(); } catch { /* Ignore */ }
      });
      this.existingBoxes = [];
      this.windowEntries.set([]);
    }, 50);
  }

  ngOnInit(): void {
    this.closeAllWindows();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => this.onKeyDown(e));
    }
  }

  ngOnDestroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', (e) => this.onKeyDown(e));
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key === 'b') {
      event.preventDefault();
      this.toggleSidebar();
    }
    if (event.key === 'Escape') {
      this.closeMobileMenu();
    }
  }
}

export interface WindowEntry {
  id: string;
  title: string;
  minimized: boolean;
  focused: boolean;
}
