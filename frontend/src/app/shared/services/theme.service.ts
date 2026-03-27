import { computed, effect, Injectable, signal } from '@angular/core';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  label: string;
  icon: string;
}

export const THEMES: Theme[] = [
  { name: 'light', label: 'Light', icon: '☀️' },
  { name: 'dark', label: 'Dark', icon: '🌙' },
];

const STORAGE_KEY = 'app-theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeIndex = signal(this.getInitialTheme());

  readonly currentTheme = computed(() => THEMES[this.themeIndex()]);
  readonly isDarkMode = computed(() => this.currentTheme().name === 'dark');
  readonly themeIcon = computed(() => this.currentTheme().icon);

  constructor() {
    effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme.name);
    });
  }

  private getInitialTheme(): number {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'dark') return 1;
    if (stored === 'light') return 0;

    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 1 : 0;
    }
    return 0;
  }

  private applyTheme(themeName: ThemeName): void {
    if (typeof document === 'undefined') return;

    const html = document.documentElement;

    if (themeName === 'dark') {
      html.setAttribute('data-theme', 'dark');
      html.classList.add('dark');
    } else {
      html.removeAttribute('data-theme');
      html.classList.remove('dark');
    }

    localStorage.setItem(STORAGE_KEY, themeName);

    // Update WinBox windows theme
    this.updateWinBoxTheme();
  }

  private updateWinBoxTheme(): void {
    const winBoxManager = (window as any).__winBoxManager;
    if (winBoxManager?.updateAllWindowsTheme) {
      winBoxManager.updateAllWindowsTheme();
    }
  }

  toggle(): void {
    this.themeIndex.update(i => (i + 1) % THEMES.length);
  }

  setTheme(name: ThemeName): void {
    const index = THEMES.findIndex(t => t.name === name);
    if (index !== -1) {
      this.themeIndex.set(index);
    }
  }
}
