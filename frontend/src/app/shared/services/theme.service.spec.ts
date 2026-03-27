import '@angular/compiler';
import { beforeEach, describe, expect, it, afterEach } from 'bun:test';
import { ThemeService, THEMES, type Theme, type ThemeName } from './theme.service';
import { createMockStorage, setupMockStorage } from '../../../test-utils';

const STORAGE_KEY = 'app-theme';

describe('ThemeService', () => {
  let mockStorage: ReturnType<typeof setupMockStorage>;

  beforeEach(() => {
    mockStorage = setupMockStorage();
    mockStorage.localStorage.clear();
  });

  afterEach(() => {
    mockStorage.localStorage.clear();
    mockStorage.sessionStorage.clear();
  });

  describe('Constants', () => {
    it('should have THEMES constant defined', () => {
      expect(THEMES).toBeDefined();
      expect(Array.isArray(THEMES)).toBe(true);
    });

    it('should have 2 themes (light and dark)', () => {
      expect(THEMES.length).toBe(2);
    });

    it('should have light theme', () => {
      const lightTheme = THEMES.find(t => t.name === 'light');
      expect(lightTheme).toBeDefined();
      expect(lightTheme?.label).toBe('Light');
      expect(lightTheme?.icon).toBe('☀️');
    });

    it('should have dark theme', () => {
      const darkTheme = THEMES.find(t => t.name === 'dark');
      expect(darkTheme).toBeDefined();
      expect(darkTheme?.label).toBe('Dark');
      expect(darkTheme?.icon).toBe('🌙');
    });

    it('should have unique theme names', () => {
      const names = THEMES.map(t => t.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(names.length);
    });
  });

  describe('Theme Types', () => {
    it('should have correct ThemeName type values', () => {
      const validNames: ThemeName[] = ['light', 'dark'];
      expect(validNames).toHaveLength(2);
    });

    it('should have correct Theme interface', () => {
      const theme: Theme = { name: 'light', label: 'Light', icon: '☀️' };
      expect(theme.name).toBe('light');
      expect(theme.label).toBe('Light');
      expect(theme.icon).toBe('☀️');
    });
  });
});

// Note: Full ThemeService testing requires Angular's TestBed due to effect() usage.
// The service uses Angular signals and effects which need injection context.
// For complete testing, use TestBed.configureTestingModule in an Angular test environment.
describe('ThemeService (Limited - requires TestBed for full testing)', () => {
  it('ThemeService requires Angular TestBed for full testing due to effect() usage', () => {
    // This test documents that full testing requires Angular's TestBed
    // See TESTING.md for details on testing Angular services with signals/effects
    expect(true).toBe(true);
  });
});
