/**
 * Test Utilities for Angular + Bun Test
 * 
 * Provides helper functions and mocks for testing Angular components and services
 * in a Bun test environment with JSDOM.
 */

import { JSDOM } from 'jsdom';

// ============================================================================
// JSDOM Setup
// ============================================================================

export function setupJSDOM(): void {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable',
  });

  global.window = dom.window as any;
  global.document = dom.window.document;
  global.navigator = dom.window.navigator;
  global.localStorage = dom.window.localStorage;
  global.sessionStorage = dom.window.sessionStorage;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;
  global.Node = dom.window.Node;
  global.Text = dom.window.Text;
  global.DocumentFragment = dom.window.DocumentFragment;
  global.HTMLBodyElement = dom.window.HTMLBodyElement;
  global.HTMLDocument = dom.window.HTMLDocument;
  global.history = dom.window.history;
  global.location = dom.window.location;
  global.MutationObserver = dom.window.MutationObserver;
  global.getComputedStyle = dom.window.getComputedStyle;
  global.performance = dom.window.performance;
  global.requestAnimationFrame = dom.window.requestAnimationFrame;
  global.cancelAnimationFrame = dom.window.cancelAnimationFrame;
  
  global.matchMedia =
    dom.window.matchMedia ||
    (query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }));
}

// ============================================================================
// Mock Factories
// ============================================================================

/**
 * Mock Router for testing services that depend on Angular Router
 */
export function createMockRouter(initialUrl: string = '/'): any {
  const url = initialUrl;
  const events = {
    pipe: () => events,
    filter: () => events,
    startWith: () => events,
    subscribe: () => {},
  };
  
  return {
    url,
    events,
    navigate: () => Promise.resolve(true),
    navigateByUrl: () => Promise.resolve(true),
    createUrlTree: () => ({}),
    parseUrl: () => ({}),
    serialize: () => '',
    isActive: () => false,
  };
}

/**
 * Mock NgZone for testing
 */
export function createMockNgZone(): any {
  return {
    run: (fn: Function) => fn(),
    runOutsideAngular: (fn: Function) => fn(),
    isStable: { subscribe: () => {} },
    onStable: { emit: () => {} },
    onUnstable: { emit: () => {} },
    onError: { emit: () => {} },
  };
}

/**
 * Mock ChangeDetectorRef for testing
 */
export function createMockChangeDetectorRef(): any {
  return {
    detectChanges: () => {},
    markForCheck: () => {},
    detach: () => {},
    reattach: () => {},
    checkNoChanges: () => {},
  };
}

/**
 * Mock WinBox for testing components that use WinBox windows
 */
export function createMockWinBox(): any {
  const instances: any[] = [];
  
  const WinBox = function(this: any, options: any) {
    this.title = options.title;
    this.background = options.background;
    this.width = options.width;
    this.height = options.height;
    this.x = options.x;
    this.y = options.y;
    this.html = options.html;
    this.dom = { style: { zIndex: '1000' } };
    this.minimized = false;
    
    // Store callbacks
    this.onfocus = options.onfocus || (() => {});
    this.onclose = options.onclose || (() => {});
    this.onminimize = options.onminimize || (() => {});
    
    instances.push(this);
  };
  
  WinBox.prototype = {
    show: function() { this.hidden = false; return this; },
    hide: function() { this.hidden = true; return this; },
    focus: function() { this.onfocus?.(); return this; },
    close: function() { this.onclose?.(); return this; },
    minimize: function() { this.onminimize?.(); return this; },
    maximize: function() { return this; },
    resize: function(w: number, h: number) { this.width = w; this.height = h; return this; },
    move: function(x: number, y: number) { this.x = x; this.y = y; return this; },
    setTitle: function(title: string) { this.title = title; return this; },
    setBackground: function(bg: string) { this.background = bg; return this; },
  };
  
  return { WinBox, instances };
}

/**
 * Setup mock WinBox in global scope
 */
export function setupMockWinBox(): { WinBox: any; instances: any[] } {
  const mock = createMockWinBox();
  (global as any).WinBox = mock.WinBox;
  return mock;
}

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Wait for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => boolean | Promise<boolean>,
  timeout: number = 1000,
  interval: number = 50
): Promise<void> {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    const result = await Promise.resolve(condition());
    if (result) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`waitFor timed out after ${timeout}ms`);
}

/**
 * Create a fake event for testing
 */
export function createFakeEvent(type: string, props: Record<string, any> = {}): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, props);
  return event;
}

/**
 * Create a fake keyboard event
 */
export function createKeyboardEvent(
  type: 'keydown' | 'keyup' | 'keypress',
  key: string,
  props: Record<string, any> = {}
): KeyboardEvent {
  const event = new KeyboardEvent(type, {
    key,
    bubbles: true,
    cancelable: true,
    ...props,
  });
  return event;
}

/**
 * Create a fake mouse event
 */
export function createMouseEvent(
  type: 'click' | 'mousedown' | 'mouseup' | 'mousemove',
  props: Record<string, any> = {}
): MouseEvent {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...props,
  });
  return event;
}

/**
 * Simulate a promise rejection
 */
export async function simulatePromiseRejection(reason: string): Promise<void> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(reason), 0);
  });
}

/**
 * Mock console methods for testing
 */
export function mockConsole(): {
  restore: () => void;
  error: jest.Mock;
  warn: jest.Mock;
  log: jest.Mock;
  info: jest.Mock;
} {
  const original = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    info: console.info,
  };

  const mocks = {
    error: () => {},
    warn: () => {},
    log: () => {},
    info: () => {},
  };

  console.error = mocks.error as any;
  console.warn = mocks.warn as any;
  console.log = mocks.log as any;
  console.info = mocks.info as any;

  return {
    restore: () => {
      console.error = original.error;
      console.warn = original.warn;
      console.log = original.log;
      console.info = original.info;
    },
    ...mocks,
  };
}

/**
 * Create a test subject for observable testing
 */
export class TestSubject<T> {
  private listeners: ((value: T) => void)[] = [];
  private lastValue: T | undefined;

  next(value: T): void {
    this.lastValue = value;
    this.listeners.forEach(listener => listener(value));
  }

  subscribe(callback: (value: T) => void): { unsubscribe: () => void } {
    this.listeners.push(callback);
    if (this.lastValue !== undefined) {
      callback(this.lastValue);
    }
    return { unsubscribe: () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) this.listeners.splice(index, 1);
    }};
  }

  complete(): void {
    this.listeners = [];
  }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Assert that a function throws an error
 */
export function expectToThrow(fn: () => void, errorType?: Function | string): void {
  try {
    fn();
    throw new Error('Expected function to throw');
  } catch (e) {
    if (errorType) {
      if (typeof errorType === 'string') {
        if (!String(e).includes(errorType)) {
          throw new Error(`Expected error to include "${errorType}", got: ${e}`);
        }
      } else if (!(e instanceof errorType)) {
        throw new Error(`Expected ${errorType.name}, got: ${e}`);
      }
    }
  }
}

/**
 * Assert that an async function rejects
 */
export async function expectToReject(
  fn: () => Promise<unknown>,
  errorType?: Function | string
): Promise<void> {
  try {
    await fn();
    throw new Error('Expected function to reject');
  } catch (e) {
    if (errorType) {
      if (typeof errorType === 'string') {
        if (!String(e).includes(errorType)) {
          throw new Error(`Expected error to include "${errorType}", got: ${e}`);
        }
      } else if (!(e instanceof errorType)) {
        throw new Error(`Expected ${errorType.name}, got: ${e}`);
      }
    }
  }
}

/**
 * Deep clone an object for testing
 */
export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Freeze time for testing (mocks Date)
 */
export function freezeTime(fixedDate: Date = new Date('2024-01-01T00:00:00Z')): {
  restore: () => void;
  tick: (ms: number) => void;
  now: () => Date;
} {
  const OriginalDate = Date;
  let currentTime = fixedDate.getTime();

  class MockDate {
    constructor() {
      return new OriginalDate(currentTime);
    }
    static now() {
      return currentTime;
    }
  }

  global.Date = MockDate as any;

  return {
    restore: () => {
      global.Date = OriginalDate;
    },
    tick: (ms: number) => {
      currentTime += ms;
    },
    now: () => new Date(currentTime),
  };
}

// ============================================================================
// Storage Mocks
// ============================================================================

/**
 * Create an in-memory mock for localStorage
 */
export function createMockStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string): string | null {
      return store.get(key) || null;
    },
    setItem(key: string, value: string): void {
      store.set(key, value);
    },
    removeItem(key: string): void {
      store.delete(key);
    },
    key(index: number): string | null {
      const keys = Array.from(store.keys());
      return keys[index] || null;
    },
  };
}

/**
 * Setup mock storage in global scope
 */
export function setupMockStorage(): {
  localStorage: Storage;
  sessionStorage: Storage;
} {
  const localStorage = createMockStorage();
  const sessionStorage = createMockStorage();
  
  global.localStorage = localStorage;
  global.sessionStorage = sessionStorage;
  
  return { localStorage, sessionStorage };
}

// ============================================================================
// Export for convenience
// ============================================================================

export const TestHelpers = {
  setupJSDOM,
  createMockRouter,
  createMockNgZone,
  createMockChangeDetectorRef,
  createMockWinBox,
  setupMockWinBox,
  waitFor,
  createFakeEvent,
  createKeyboardEvent,
  createMouseEvent,
  simulatePromiseRejection,
  mockConsole,
  TestSubject,
  expectToThrow,
  expectToReject,
  deepClone,
  freezeTime,
  createMockStorage,
  setupMockStorage,
};
