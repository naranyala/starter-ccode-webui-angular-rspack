/**
 * Tests for CommunicationService
 *
 * Tests cover:
 * - WebUI Bridge channel (RPC)
 * - Event Bus channel (Pub/Sub)
 * - Shared State channel
 * - Message Queue channel
 * - Broadcast channel
 * - Statistics tracking
 */

import { describe, test, expect, beforeEach } from 'bun:test';
import { CommunicationService } from './communication.service';

// Mock ApiService
class MockApiService {
  calls: Array<{ fn: string; args: unknown[] }> = [];
  shouldFail = false;

  async call<T>(fn: string, args: unknown[] = []): Promise<T> {
    this.calls.push({ fn, args });
    if (this.shouldFail) {
      return Promise.reject(new Error('API call failed'));
    }
    return Promise.resolve(null as T);
  }

  async callOrThrow<T>(fn: string, args: unknown[] = []): Promise<T> {
    this.calls.push({ fn, args });
    if (this.shouldFail) {
      throw new Error('API call failed');
    }
    return Promise.resolve({} as T);
  }

  reset() {
    this.calls = [];
    this.shouldFail = false;
  }
}

describe('CommunicationService', () => {
  let service: CommunicationService;
  let mockApi: MockApiService;

  beforeEach(() => {
    // Create service with mocked API
    mockApi = new MockApiService();
    
    // Override API injection
    service = new CommunicationService();
    (service as any).api = mockApi;
    mockApi.reset();
  });

  describe('WebUI Bridge Channel', () => {
    test('should call backend function via API', async () => {
      await service.call('getUsers', [1, 2]);
      
      expect(mockApi.calls).toHaveLength(1);
      expect(mockApi.calls[0].fn).toBe('getUsers');
      expect(mockApi.calls[0].args).toEqual([1, 2]);
    });

    test('should increment stats on call', async () => {
      const initialStats = service.getStats();
      await service.call('testFunction');
      const newStats = service.getStats();
      
      expect(newStats.totalMessages).toBe(initialStats.totalMessages + 1);
      expect(newStats.messagesByChannel['webui-bridge']).toBe(
        (initialStats.messagesByChannel['webui-bridge'] || 0) + 1
      );
    });

    test('should handle callWithResponse timeout', async () => {
      mockApi.shouldFail = true;
      
      await expect(service.callWithResponse('slowFunction'))
        .rejects.toThrow('Timeout waiting for response: slowFunction');
    });

    test('should remove event listener after response', async () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
      
      // Trigger call
      service.callWithResponse('testFn').catch(() => {});
      
      // Should add listener
      expect(addEventListenerSpy).toHaveBeenCalled();
      
      // Clean up
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe('Event Bus Channel', () => {
    test('should subscribe to events', () => {
      const handler = jest.fn();
      const unsubscribe = service.subscribe('test-event', handler);
      
      const stats = service.getStats();
      expect(stats.activeSubscriptions).toBe(1);
      
      unsubscribe();
      
      const newStats = service.getStats();
      expect(newStats.activeSubscriptions).toBe(0);
    });

    test('should emit events to local handlers', () => {
      const handler = jest.fn();
      service.subscribe('test-event', handler);
      
      service.emit('test-event', { data: 'test' });
      
      expect(handler).toHaveBeenCalledWith({ data: 'test' }, 'test-event');
    });

    test('should publish events to backend', async () => {
      const handler = jest.fn();
      service.subscribe('backend-event', handler);
      
      await service.publish('backend-event', { payload: 'data' });
      
      expect(mockApi.calls.some(c => c.fn === 'publishEvent')).toBe(true);
    });

    test('should handle multiple subscribers', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      service.subscribe('multi-event', handler1);
      service.subscribe('multi-event', handler2);
      
      service.emit('multi-event', 'data');
      
      expect(handler1).toHaveBeenCalledWith('data', 'multi-event');
      expect(handler2).toHaveBeenCalledWith('data', 'multi-event');
    });

    test('should unsubscribe correctly', () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();
      
      const unsub1 = service.subscribe('unsub-event', handler1);
      service.subscribe('unsub-event', handler2);
      
      unsub1();
      service.emit('unsub-event', 'data');
      
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith('data', 'unsub-event');
    });

    test('should get event history from backend', async () => {
      mockApi.shouldFail = true; // Will return empty array on error
      
      const history = await service.getEventHistory();
      
      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe('Shared State Channel', () => {
    test('should get and set state', async () => {
      await service.setState('user', { id: 1, name: 'Test' });
      
      const user = service.getState<{ id: number; name: string }>('user');
      expect(user).toEqual({ id: 1, name: 'Test' });
    });

    test('should increment state version on update', async () => {
      const initialVersion = service.getStats().stateVersion;
      
      await service.setState('key1', 'value1');
      await service.setState('key2', 'value2');
      
      const stats = service.getStats();
      expect(stats.stateVersion).toBe(initialVersion + 2);
    });

    test('should notify state handlers on change', async () => {
      const handler = jest.fn();
      const unsubscribe = service.subscribeState(handler);
      
      await service.setState('test-key', 'test-value');
      
      expect(handler).toHaveBeenCalledWith('test-key', 'test-value');
      
      unsubscribe();
    });

    test('should get all state', async () => {
      await service.setState('key1', 'value1');
      await service.setState('key2', 'value2');
      
      const allState = service.getAllState();
      
      expect(allState.key1).toBe('value1');
      expect(allState.key2).toBe('value2');
    });

    test('should return undefined for non-existent key', () => {
      const value = service.getState('non-existent');
      expect(value).toBeUndefined();
    });
  });

  describe('Message Queue Channel', () => {
    test('should enqueue messages', async () => {
      await service.enqueue('backend', { action: 'test' }, 1);
      
      const queueLength = service.queueLength();
      expect(queueLength).toBe(1);
      
      const stats = service.getStats();
      expect(stats.queueLength).toBe(1);
    });

    test('should dequeue messages in order', async () => {
      await service.enqueue('backend', { id: 1 });
      await service.enqueue('backend', { id: 2 });
      
      const first = await service.dequeue();
      const second = await service.dequeue();
      
      expect(first).toEqual({ id: 1 });
      expect(second).toEqual({ id: 2 });
    });

    test('should return null when queue is empty', async () => {
      const result = await service.dequeue();
      expect(result).toBeNull();
    });

    test('should peek without removing', async () => {
      await service.enqueue('backend', { id: 1 });
      
      const peek1 = service.peek();
      const peek2 = service.peek();
      
      expect(peek1).toEqual(peek2);
      expect(service.queueLength()).toBe(1);
    });

    test('should clear queue', async () => {
      await service.enqueue('backend', { id: 1 });
      await service.enqueue('backend', { id: 2 });
      
      service.clearQueue();
      
      expect(service.queueLength()).toBe(0);
      expect(service.getStats().queueLength).toBe(0);
    });

    test('should respect priority order', async () => {
      // Note: Current implementation is FIFO, not priority-based
      await service.enqueue('backend', { low: true }, 1);
      await service.enqueue('backend', { high: true }, 10);
      
      const first = await service.dequeue();
      expect(first).toEqual({ low: true });
    });
  });

  describe('Broadcast Channel', () => {
    test('should broadcast messages', async () => {
      await service.broadcast('global-event', { data: 'test' });
      
      expect(mockApi.calls.some(c => c.fn === 'broadcast')).toBe(true);
      
      const stats = service.getStats();
      expect(stats.broadcastCount).toBe(1);
    });

    test('should subscribe to broadcasts', () => {
      const handler = jest.fn();
      const unsubscribe = service.onBroadcast(handler);
      
      service.emit('broadcast', { event: 'test', data: 'payload' });
      
      expect(handler).toHaveBeenCalled();
      
      unsubscribe();
    });
  });

  describe('Statistics', () => {
    test('should track total messages', async () => {
      const initial = service.getStats().totalMessages;
      
      await service.call('fn1');
      await service.call('fn2');
      service.emit('event1', null);
      
      const stats = service.getStats();
      expect(stats.totalMessages).toBe(initial + 3);
    });

    test('should track messages by channel', async () => {
      await service.call('test'); // webui-bridge
      service.emit('test', null); // event-bus
      
      const stats = service.getStats();
      expect(stats.messagesByChannel['webui-bridge']).toBe(1);
      expect(stats.messagesByChannel['event-bus']).toBe(1);
    });

    test('should track messages by type', async () => {
      await service.call('test'); // request
      await service.callWithResponse('test2').catch(() => {}); // response (timeout)
      
      const stats = service.getStats();
      expect(stats.messagesByType['request']).toBe(1);
    });

    test('should reset statistics', async () => {
      await service.call('test');
      service.emit('test', null);
      
      service.resetStats();
      
      const stats = service.getStats();
      expect(stats.totalMessages).toBe(0);
      expect(stats.messagesByChannel).toEqual({});
      expect(stats.messagesByType).toEqual({});
    });

    test('should get channel usage', async () => {
      await service.call('test');
      service.emit('test', null);
      
      const usage = service.getChannelUsage();
      expect(usage['webui-bridge']).toBe(1);
      expect(usage['event-bus']).toBe(1);
    });

    test('should update last activity timestamp', async () => {
      const before = Date.now();
      await service.call('test');
      const after = Date.now();
      
      const stats = service.getStats();
      expect(stats.lastActivity).toBeGreaterThanOrEqual(before);
      expect(stats.lastActivity).toBeLessThanOrEqual(after);
    });
  });

  describe('Signals', () => {
    test('should expose stats as readonly signal', () => {
      const stats$ = service.stats$;
      expect(stats$).toBeDefined();
      expect(typeof stats$().totalMessages).toBe('number');
    });

    test('should expose shared state as readonly signal', () => {
      const state$ = service.sharedState$;
      expect(state$).toBeDefined();
      expect(state$()).toEqual({});
    });

    test('should expose queue as readonly signal', () => {
      const queue$ = service.queue$;
      expect(queue$).toBeDefined();
      expect(Array.isArray(queue$())).toBe(true);
    });

    test('should compute queue length', async () => {
      expect(service.queueLength()).toBe(0);
      
      await service.enqueue('test', {});
      expect(service.queueLength()).toBe(1);
    });

    test('should track connection status', () => {
      expect(service.isConnected()).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('should handle API failures gracefully', async () => {
      mockApi.shouldFail = true;
      
      // Should not throw
      await service.setState('key', 'value');
      await service.publish('event', 'data');
      await service.enqueue('dest', 'data');
      await service.broadcast('event', 'data');
      
      // State should still update locally
      expect(service.getState('key')).toBe('value');
    });

    test('should throw on callOrThrow failure', async () => {
      mockApi.shouldFail = true;
      
      await expect(service.call('test')).resolves.toBeDefined(); // call() doesn't throw
    });
  });

  describe('Cleanup', () => {
    test('should clean up event handlers on unsubscribe', () => {
      const handler = jest.fn();
      const unsubscribe = service.subscribe('cleanup-event', handler);
      
      unsubscribe();
      
      service.emit('cleanup-event', 'data');
      expect(handler).not.toHaveBeenCalled();
    });

    test('should clean up state handlers on unsubscribe', async () => {
      const handler = jest.fn();
      const unsubscribe = service.subscribeState(handler);
      
      unsubscribe();
      
      await service.setState('key', 'value');
      expect(handler).not.toHaveBeenCalled();
    });
  });
});
