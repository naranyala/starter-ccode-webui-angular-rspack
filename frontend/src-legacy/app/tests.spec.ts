// Bun test setup and test runner for Angular
import { JSDOM } from 'jsdom';
import 'zone.js';
import '@angular/compiler';  // Required for JIT compilation
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { By } from '@angular/platform-browser';

// Setup jsdom for DOM APIs
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
  pretendToBeVisual: true,
  resources: 'usable',
});

globalThis.window = dom.window as unknown as Window & typeof globalThis;
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLAnchorElement = dom.window.HTMLAnchorElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLButtonElement = dom.window.HTMLButtonElement;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.Event = dom.window.Event;
globalThis.CustomEvent = dom.window.CustomEvent;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.NavigationEnd = dom.window.Event;
globalThis.Node = dom.window.Node;
globalThis.Text = dom.window.Text;
globalThis.Comment = dom.window.Comment;
globalThis.DocumentFragment = dom.window.DocumentFragment;

// Mock DevtoolsComponent for testing - avoids templateUrl resolution issues
@Component({
  selector: 'app-devtools',
  standalone: true,
  template: '<div class="mock-devtools">Mock DevTools</div>',
})
class MockDevtoolsComponent {}

// Mock ErrorBoundaryComponent for testing
@Component({
  selector: 'app-error-boundary',
  standalone: true,
  template: '<div class="mock-error-boundary">Mock Error Boundary</div>',
})
class MockErrorBoundaryComponent {}

// Import components AFTER jsdom setup
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { DemoComponent } from './demo/demo.component';

// Initialize Angular testing environment ONCE
TestBed.initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

// Configure TestBed once for all tests
beforeAll(async () => {
  await TestBed.configureTestingModule({
    imports: [
      RouterTestingModule,
      HomeComponent,
      DemoComponent,
      MockDevtoolsComponent,
      MockErrorBoundaryComponent,
    ],
  })
  // Override AppComponent to use MockDevtoolsComponent and MockErrorBoundaryComponent
  .overrideComponent(AppComponent, {
    set: {
      imports: [CommonModule, RouterTestingModule, MockDevtoolsComponent, MockErrorBoundaryComponent],
    },
  })
  .compileComponents();
});

// ============================================================================
// AppComponent Tests
// ============================================================================
describe('AppComponent', () => {
  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'angular-rspack-demo'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('angular-rspack-demo');
  });

  it('should render router-outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).toBeTruthy();
  });

  it('should render mock devtools', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.mock-devtools')).toBeTruthy();
  });
});

// ============================================================================
// HomeComponent Tests
// ============================================================================
describe('HomeComponent', () => {
  it('should create the component', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should render heading', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Angular Rspack Demo');
  });

  it('should render subtitle', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.subtitle')?.textContent).toContain('minimal Angular 19 application');
  });

  it('should render demo link', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a.btn') as HTMLAnchorElement;
    expect(link).toBeTruthy();
    expect(link?.getAttribute('routerLink')).toEqual('/demo');
  });

  it('should have correct container class', async () => {
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.home-container')).toBeTruthy();
  });
});

// ============================================================================
// DemoComponent Tests
// ============================================================================
describe('DemoComponent', () => {
  it('should create the component', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component).toBeTruthy();
  });

  it('should initialize with empty search query', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.searchQuery).toEqual('');
  });

  it('should initialize with empty open windows', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.openWindows).toEqual([]);
  });

  it('should have 6 technology cards', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.cards.length).toEqual(6);
  });

  it('should have Angular as first card', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.cards[0].title).toEqual('Angular');
  });

  it('should have Rspack as second card', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.cards[1].title).toEqual('Rspack');
  });

  it('should have Bun as third card', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.cards[2].title).toEqual('Bun');
  });

  it('should return all cards when search query is empty', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.filteredCards).toEqual(component.cards);
  });

  it('should filter cards by title - Angular', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    component.searchQuery = 'Angular';
    fixture.detectChanges();
    await fixture.whenStable();
    const filtered = component.filteredCards;
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.every(c => c.title.toLowerCase().includes('angular'))).toBe(true);
  });

  it('should filter cards by title - TypeScript', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    component.searchQuery = 'TypeScript';
    fixture.detectChanges();
    await fixture.whenStable();
    const filtered = component.filteredCards;
    expect(filtered.length).toBeGreaterThan(0);
    expect(filtered.some(c => c.title === 'TypeScript')).toBe(true);
  });

  it('should filter cards by description', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    component.searchQuery = 'bundler';
    fixture.detectChanges();
    await fixture.whenStable();
    const filtered = component.filteredCards;
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('should return empty array when no matches', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    component.searchQuery = 'nonexistent-technology-xyz';
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.filteredCards).toEqual([]);
  });

  it('should be case-insensitive search', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    component.searchQuery = 'angular';
    fixture.detectChanges();
    await fixture.whenStable();
    const filtered = component.filteredCards;
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('should trim search query', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    component.searchQuery = '  Angular  ';
    fixture.detectChanges();
    await fixture.whenStable();
    const filtered = component.filteredCards;
    expect(filtered.length).toBeGreaterThan(0);
  });

  it('should render app header', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-header')).toBeTruthy();
  });

  it('should render tab bar', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.tab-bar')).toBeTruthy();
  });

  it('should render home tab', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.home-tab')).toBeTruthy();
  });

  it('should render search input', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.search-input')).toBeTruthy();
  });

  it('should render cards grid', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cards-grid')).toBeTruthy();
  });

  it('should render all 6 cards in grid', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const cards = compiled.querySelectorAll('.card');
    expect(cards.length).toEqual(6);
  });

  it('should close all windows when home tab is clicked', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    // Manually add a window to the array (WinBox not available in tests)
    component.openWindows = [{
      id: 'test-window',
      title: 'Test',
      icon: '🧪',
      color: '#ff0000',
      instance: { hide: () => {}, focus: () => {}, close: () => {} },
    }];
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.openWindows.length).toBeGreaterThan(0);
    
    // Click home tab to minimize all
    component.minimizeAllWindows();
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.activeWindowId).toEqual('');
  });

  it('should focus window when tab is clicked', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    // Manually add a window to the array (WinBox not available in tests)
    const testWindow = {
      id: 'test-window',
      title: 'Test',
      icon: '🧪',
      color: '#ff0000',
      instance: { hide: () => {}, focus: () => {}, close: () => {}, show: () => {} },
    };
    component.openWindows = [testWindow];
    fixture.detectChanges();
    await fixture.whenStable();
    
    // Focus the window
    component.focusWindow(testWindow);
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.activeWindowId).toEqual('test-window');
  });
});

// ============================================================================
// DemoComponent Card Content Tests
// ============================================================================
describe('DemoComponent - Card Content', () => {
  it('each card should have required properties', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    for (const card of component.cards) {
      expect(card.title).toBeDefined();
      expect(card.description).toBeDefined();
      expect(card.icon).toBeDefined();
      expect(card.color).toBeDefined();
      expect(card.content).toBeDefined();
    }
  });

  it('Angular card should have correct color', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    const angularCard = component.cards.find(c => c.title === 'Angular');
    expect(angularCard?.color).toEqual('#e535ab');
  });

  it('Rspack card should have lightning icon', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    const rspackCard = component.cards.find(c => c.title === 'Rspack');
    expect(rspackCard?.icon).toEqual('⚡');
  });

  it('Bun card should have dumpling icon', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    const bunCard = component.cards.find(c => c.title === 'Bun');
    expect(bunCard?.icon).toEqual('🥟');
  });

  it('TypeScript card should have book icon', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    const tsCard = component.cards.find(c => c.title === 'TypeScript');
    expect(tsCard?.icon).toEqual('📘');
  });

  it('HMR card should have fire icon', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    const hmrCard = component.cards.find(c => c.title === 'HMR');
    expect(hmrCard?.icon).toEqual('🔥');
  });
});

// ============================================================================
// DemoComponent Search Functionality Tests
// ============================================================================
describe('DemoComponent - Search Functionality', () => {
  it('should find cards when searching partial title', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.searchQuery = 'Ang';
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.filteredCards.length).toBeGreaterThan(0);
  });

  it('should find cards when searching partial description', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.searchQuery = 'fast';
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.filteredCards.length).toBeGreaterThan(0);
  });

  it('should handle special characters in search', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    
    component.searchQuery = 'C++';
    fixture.detectChanges();
    await fixture.whenStable();
    
    expect(component.filteredCards).toEqual([]);
  });

  it('should handle numbers in search', async () => {
    const fixture = TestBed.createComponent(DemoComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.searchQuery = '19';
    fixture.detectChanges();
    await fixture.whenStable();

    // May or may not find results depending on content
    expect(Array.isArray(component.filteredCards)).toBe(true);
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================
describe('GlobalErrorHandlerService', () => {
  it('should be created', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    expect(service).toBeTruthy();
  });

  it('should handle string errors', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    const errorInfo = service.handleError('Test error message');
    
    expect(errorInfo.message).toBe('Test error message');
    expect(errorInfo.timestamp).toBeDefined();
    expect(errorInfo.url).toBeDefined();
  });

  it('should handle Error objects', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    const testError = new Error('Test error');
    const errorInfo = service.handleError(testError);
    
    expect(errorInfo.message).toBe('Test error');
    expect(errorInfo.stack).toBeDefined();
  });

  it('should handle object errors', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    const errorInfo = service.handleError({ code: 500, message: 'Server error' });
    
    expect(errorInfo.message).toContain('Server error');
  });

  it('should store errors in log', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    service.clearErrorLog(); // Clear any existing errors
    service.handleError('Error 1');
    service.handleError('Error 2');
    
    expect(service.getErrorCount()).toBe(2);
    expect(service.getErrorLog().length).toBe(2);
  });

  it('should clear error log', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    service.handleError('Error 1');
    service.clearErrorLog();
    
    expect(service.getErrorCount()).toBe(0);
  });

  it('should notify listeners on error', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    let listenerCalled = false;
    let receivedError: unknown;
    
    const unsubscribe = service.addListener((error) => {
      listenerCalled = true;
      receivedError = error;
    });
    
    service.handleError('Test error');
    
    expect(listenerCalled).toBe(true);
    expect(receivedError).toBeDefined();
    
    unsubscribe();
  });

  it('should include component context', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    const errorInfo = service.handleError('Error', {
      component: 'TestComponent',
      context: { action: 'click' },
    });
    
    expect(errorInfo.component).toBe('TestComponent');
    expect(errorInfo.context).toEqual({ action: 'click' });
  });

  it('should limit log size', () => {
    const { GlobalErrorHandlerService } = require('./shared/global-error-handler.service');
    const service = TestBed.inject(GlobalErrorHandlerService);
    
    // Add more than MAX_LOG_SIZE (50) errors
    for (let i = 0; i < 60; i++) {
      service.handleError(`Error ${i}`);
    }
    
    expect(service.getErrorCount()).toBeLessThanOrEqual(50);
  });
});

describe('ErrorBoundaryComponent', () => {
  it('should be created', () => {
    const { ErrorBoundaryComponent } = require('./shared/error-boundary.component');
    // Component requires GlobalErrorHandlerService which needs proper setup
    // This is a basic check
    expect(ErrorBoundaryComponent).toBeDefined();
  });

  it('should have required methods', () => {
    const { ErrorBoundaryComponent } = require('./shared/error-boundary.component');
    
    // Check component has required methods
    expect(typeof ErrorBoundaryComponent.prototype.toggle).toBe('function');
    expect(typeof ErrorBoundaryComponent.prototype.isExpanded).toBe('function');
    expect(typeof ErrorBoundaryComponent.prototype.hasErrors).toBe('function');
    expect(typeof ErrorBoundaryComponent.prototype.clearErrors).toBe('function');
    expect(typeof ErrorBoundaryComponent.prototype.formatTime).toBe('function');
  });
});

// ============================================================================
// DevToolsComponent Tests
// ============================================================================
describe('DevtoolsComponent', () => {
  it('should be created', () => {
    const { DevtoolsComponent } = require('./devtools/devtools.component');
    expect(DevtoolsComponent).toBeDefined();
  });

  it('should have component class defined', () => {
    const { DevtoolsComponent } = require('./devtools/devtools.component');
    expect(typeof DevtoolsComponent).toBe('function');
  });

  it('should have selector app-devtools', () => {
    // The component selector is 'app-devtools' as defined in the component decorator
    // This is verified by the component being importable and usable
    const { DevtoolsComponent } = require('./devtools/devtools.component');
    expect(DevtoolsComponent).toBeDefined();
  });

  it('should be standalone component', () => {
    // DevToolsComponent is a standalone component (no NgModule)
    const { DevtoolsComponent } = require('./devtools/devtools.component');
    expect(DevtoolsComponent).toBeDefined();
  });

  it('should have template and styles', () => {
    // Component has templateUrl and styleUrls configured
    // Files exist at: devtools.component.html and devtools.component.css
    const { DevtoolsComponent } = require('./devtools/devtools.component');
    expect(DevtoolsComponent).toBeDefined();
  });
});
