/**
 * Tests for WebUIService
 *
 * Tests cover:
 * - WebUI availability detection
 * - Sending messages to backend
 * - Event subscription and emission
 * - Backend function calls
 * - Error handling
 */

import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { WebUIService, WebUIBindService } from './webui/webui.service';

describe('WebUIService', () => {
  let service: WebUIService;
  let originalWebUI: any;

  beforeEach(() => {
    // Save original window.webui
    originalWebUI = (window as any).webui;
    
    // Create service
    service = new WebUIService({ run: (fn: any) => fn(), runOutsideAngular: (fn: any) => fn() } as any);
  });

  afterEach(() => {
    // Restore original window.webui
    (window as any).webui = originalWebUI;
  });

  describe('Availability Detection', () => {
    test('should detect WebUI as unavailable by default', () => {
      expect(service.isAvailable()).toBe(false);
    });

    test('should detect WebUI when available', () => {
      // Mock WebUI availability
      (window as any).webui = { test: () => {} };
      
      // Create new service to trigger check
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      
      expect(newService.isAvailable()).toBe(true);
    });

    test('should log warning when WebUI is not available', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (window as any).webui = undefined;
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('WebUI is not available')
      );
      
      warnSpy.mockRestore();
    });
  });

  describe('Send Messages', () => {
    test('should return simulated response when WebUI unavailable', async () => {
      const result = await service.send('testEvent', { data: 'test' });
      
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ data: 'test' });
    });

    test('should call WebUI function when available', async () => {
      const mockWebUI = {
        testEvent: jest.fn().mockResolvedValue({ result: 'success' }),
      };
      (window as any).webui = mockWebUI;
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      const result = await newService.send('testEvent', { data: 'test' });
      
      expect(mockWebUI.testEvent).toHaveBeenCalledWith({ data: 'test' });
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ result: 'success' });
    });

    test('should timeout after 5 seconds', async () => {
      const mockWebUI = {
        slowEvent: jest.fn(() => new Promise(() => {})), // Never resolves
      };
      (window as any).webui = mockWebUI;
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      
      await expect(newService.send('slowEvent'))
        .rejects.toThrow('Request slowEvent timed out');
    });

    test('should handle WebUI errors', async () => {
      const mockWebUI = {
        errorEvent: jest.fn().mockRejectedValue(new Error('Backend error')),
      };
      (window as any).webui = mockWebUI;
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      
      await expect(newService.send('errorEvent'))
        .rejects.toThrow('Backend error');
    });
  });

  describe('Event Subscription', () => {
    test('should subscribe to events', () => {
      const callback = jest.fn();
      const unsubscribe = service.on('test-event', callback);
      
      expect(typeof unsubscribe).toBe('function');
    });

    test('should call handler on event', () => {
      const callback = jest.fn();
      service.on('test-event', callback);
      
      // Simulate backend event
      window.dispatchEvent(new CustomEvent('webui:event', {
        detail: { type: 'test-event', payload: { data: 'test' } },
      }));
      
      expect(callback).toHaveBeenCalledWith({ data: 'test' });
    });

    test('should unsubscribe correctly', () => {
      const callback = jest.fn();
      const unsubscribe = service.on('test-event', callback);
      
      unsubscribe();
      
      // Simulate backend event
      window.dispatchEvent(new CustomEvent('webui:event', {
        detail: { type: 'test-event', payload: { data: 'test' } },
      }));
      
      expect(callback).not.toHaveBeenCalled();
    });

    test('should handle multiple subscribers', () => {
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      
      service.on('multi-event', callback1);
      service.on('multi-event', callback2);
      
      window.dispatchEvent(new CustomEvent('webui:event', {
        detail: { type: 'multi-event', payload: 'data' },
      }));
      
      expect(callback1).toHaveBeenCalledWith('data');
      expect(callback2).toHaveBeenCalledWith('data');
    });

    test('should run callbacks in Angular zone', () => {
      const runSpy = jest.fn();
      const mockNgZone = { run: runSpy } as any;
      
      const newService = new WebUIService(mockNgZone);
      newService.on('zone-event', () => {});
      
      window.dispatchEvent(new CustomEvent('webui:event', {
        detail: { type: 'zone-event', payload: 'data' },
      }));
      
      expect(runSpy).toHaveBeenCalled();
    });

    test('should handle errors in event listeners', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      service.on('error-event', () => {
        throw new Error('Listener error');
      });
      
      // Should not throw
      window.dispatchEvent(new CustomEvent('webui:event', {
        detail: { type: 'error-event', payload: 'data' },
      }));
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[WebUI] Error in event listener:',
        expect.any(Error)
      );
      
      errorSpy.mockRestore();
    });
  });

  describe('Event Emission', () => {
    test('should emit events to backend', () => {
      const mockEmit = jest.fn();
      (window as any).webui = { emit: mockEmit };
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      newService.emit('test-event', { data: 'test' });
      
      expect(mockEmit).toHaveBeenCalledWith('test-event', { data: 'test' });
    });

    test('should not emit when WebUI unavailable', () => {
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      (window as any).webui = undefined;
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      newService.emit('test-event');
      
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Not available, event not emitted')
      );
      
      warnSpy.mockRestore();
    });

    test('should handle emit errors gracefully', () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (window as any).webui = {
        emit: () => { throw new Error('Emit failed'); }
      };
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      
      // Should not throw
      newService.emit('test-event');
      
      expect(errorSpy).toHaveBeenCalledWith(
        '[WebUI] Error emitting event:',
        expect.any(Error)
      );
      
      errorSpy.mockRestore();
    });
  });

  describe('Backend Function Calls', () => {
    test('should call backend function', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      (window as any).webui = { getUserData: mockFn };
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      const result = await newService.call('getUserData', 123);
      
      expect(mockFn).toHaveBeenCalledWith(123);
      expect(result).toBe('result');
    });

    test('should throw if function not found', async () => {
      (window as any).webui = { otherFn: () => {} };
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      
      await expect(newService.call('nonExistentFn'))
        .rejects.toThrow('Backend function nonExistentFn not found');
    });

    test('should return simulated response when unavailable', async () => {
      (window as any).webui = undefined;
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      const result = await newService.call('testFn');
      
      expect(result).toBeNull();
    });

    test('should handle multiple arguments', async () => {
      const mockFn = jest.fn().mockResolvedValue('result');
      (window as any).webui = { multiArg: mockFn };
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      await newService.call('multiArg', 1, 'two', { three: 3 });
      
      expect(mockFn).toHaveBeenCalledWith(1, 'two', { three: 3 });
    });
  });

  describe('Request Tracking', () => {
    test('should track pending requests', async () => {
      let resolveFn: any;
      const promise = new Promise(resolve => { resolveFn = resolve; });
      
      const mockFn = jest.fn(() => promise);
      (window as any).webui = { trackedFn: mockFn };
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      const callPromise = newService.call('trackedFn');
      
      // Request should be pending
      expect((newService as any).pendingRequests.size).toBeGreaterThan(0);
      
      resolveFn('done');
      await callPromise;
      
      // Request should be cleared
      expect((newService as any).pendingRequests.size).toBe(0);
    });

    test('should increment request ID counter', async () => {
      (window as any).webui = { fn1: jest.fn(), fn2: jest.fn() };
      
      const newService = new WebUIService({ run: (fn: any) => fn() } as any);
      
      await newService.call('fn1');
      await newService.call('fn2');
      
      expect((newService as any).requestIdCounter).toBe(2);
    });
  });
});

describe('WebUIBindService', () => {
  let bindService: WebUIBindService;
  let webuiService: WebUIService;

  beforeEach(() => {
    webuiService = new WebUIService({ run: (fn: any) => fn() } as any);
    bindService = new WebUIBindService(webuiService);
  });

  test('should bind click event to backend function', () => {
    // Create test element
    const element = document.createElement('button');
    element.id = 'test-button';
    document.body.appendChild(element);
    
    const callSpy = jest.spyOn(webuiService, 'call').mockResolvedValue(undefined);
    
    bindService.bind('test-button', 'backendFunction');
    
    // Wait for setTimeout
    setTimeout(() => {
      element.click();
      expect(callSpy).toHaveBeenCalledWith('backendFunction');
      document.body.removeChild(element);
    }, 150);
  });

  test('should handle missing element', () => {
    // Should not throw
    bindService.bind('non-existent-element', 'backendFunction');
  });

  test('should handle call errors gracefully', () => {
    const element = document.createElement('button');
    element.id = 'error-button';
    document.body.appendChild(element);
    
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(webuiService, 'call').mockRejectedValue(new Error('Call failed'));
    
    setTimeout(() => {
      element.click();
      expect(errorSpy).toHaveBeenCalledWith(
        '[WebUIBind] Error calling backendFunction:',
        expect.any(Error)
      );
      document.body.removeChild(element);
      errorSpy.mockRestore();
    }, 150);
  });
});
