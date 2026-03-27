import { describe, it, expect, beforeEach } from 'bun:test';
import { CacheService } from '../core/cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
  });

  it('should be created', () => {
    expect(service).toBeDefined();
    expect(service instanceof CacheService).toBe(true);
  });

  describe('set and get', () => {
    it('should set and get value', () => {
      service.set('key', 'value');
      expect(service.get('key')).toBe('value');
    });

    it('should return null for missing key', () => {
      expect(service.get('nonexistent')).toBeNull();
    });

    it('should overwrite existing key', () => {
      service.set('key', 'value1');
      service.set('key', 'value2');
      expect(service.get('key')).toBe('value2');
    });

    it('should handle different value types', () => {
      service.set('string', 'hello');
      service.set('number', 42);
      service.set('boolean', true);
      service.set('object', { foo: 'bar' });
      service.set('array', [1, 2, 3]);

      expect(service.get('string')).toBe('hello');
      expect(service.get('number')).toBe(42);
      expect(service.get('boolean')).toBe(true);
      expect(service.get('object')).toEqual({ foo: 'bar' });
      expect(service.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should expire value after TTL', async () => {
      service.set('key', 'value', { ttl: 100 });
      expect(service.get('key')).toBe('value');

      await Bun.sleep(150);
      expect(service.get('key')).toBeNull();
    });

    it('should not expire value before TTL', async () => {
      service.set('key', 'value', { ttl: 500 });
      
      await Bun.sleep(100);
      expect(service.get('key')).toBe('value');
    });

    it('should respect default TTL', async () => {
      // Default TTL is 5 minutes (300000ms)
      service.set('key', 'value');
      expect(service.get('key')).toBe('value');
    });
  });

  describe('getOrSet', () => {
    it('should return existing value', () => {
      service.set('key', 'existing');
      const result = service.getOrSet('key', () => 'computed');
      expect(result).toBe('existing');
    });

    it('should compute and set new value', () => {
      const result = service.getOrSet('key', () => 'computed');
      expect(result).toBe('computed');
      expect(service.get('key')).toBe('computed');
    });

    it('should only compute once', () => {
      let computeCount = 0;
      const computeFn = () => {
        computeCount++;
        return 'computed';
      };

      service.getOrSet('key', computeFn);
      service.getOrSet('key', computeFn);

      expect(computeCount).toBe(1);
    });
  });

  describe('delete', () => {
    it('should delete existing key', () => {
      service.set('key', 'value');
      service.delete('key');
      expect(service.get('key')).toBeNull();
    });

    it('should not throw when deleting non-existent key', () => {
      expect(() => service.delete('nonexistent')).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should clear all entries', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      service.set('key3', 'value3');

      service.clear();

      expect(service.get('key1')).toBeNull();
      expect(service.get('key2')).toBeNull();
      expect(service.get('key3')).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', () => {
      service.set('key', 'value');
      expect(service.has('key')).toBe(true);
    });

    it('should return false for non-existent key', () => {
      expect(service.has('nonexistent')).toBe(false);
    });

    it('should return false for expired key', async () => {
      service.set('key', 'value', { ttl: 50 });
      expect(service.has('key')).toBe(true);

      await Bun.sleep(100);
      expect(service.has('key')).toBe(false);
    });
  });

  describe('keys', () => {
    it('should return all keys', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');

      const keys = service.keys();
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
      expect(keys.length).toBe(2);
    });

    it('should return empty array when no keys', () => {
      expect(service.keys()).toEqual([]);
    });
  });

  describe('size', () => {
    it('should return number of entries', () => {
      expect(service.size()).toBe(0);

      service.set('key1', 'value1');
      expect(service.size()).toBe(1);

      service.set('key2', 'value2');
      expect(service.size()).toBe(2);
    });

    it('should update size after delete', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');
      expect(service.size()).toBe(2);

      service.delete('key1');
      expect(service.size()).toBe(1);
    });
  });

  describe('LRU Eviction', () => {
    it('should evict least recently used when capacity exceeded', () => {
      // Create service with small capacity for testing
      const smallCache = new CacheService();
      (smallCache as any).maxCapacity = 3;

      smallCache.set('a', 1);
      smallCache.set('b', 2);
      smallCache.set('c', 3);

      // Access 'a' to make it recently used
      smallCache.get('a');

      // Add new item, should evict 'b' (least recently used)
      smallCache.set('d', 4);

      expect(smallCache.get('a')).toBe(1);
      expect(smallCache.get('b')).toBeNull();
      expect(smallCache.get('c')).toBe(3);
      expect(smallCache.get('d')).toBe(4);
    });
  });

  describe('export and import', () => {
    it('should export cache state', () => {
      service.set('key1', 'value1');
      service.set('key2', 'value2');

      const exported = service.export();
      expect(exported).toBeDefined();
      expect(Object.keys(exported).length).toBe(2);
    });

    it('should import cache state', () => {
      const data = {
        'key1': { value: 'value1' },
        'key2': { value: 'value2' },
      };

      service.import(data);

      expect(service.get('key1')).toBe('value1');
      expect(service.get('key2')).toBe('value2');
    });
  });
});
