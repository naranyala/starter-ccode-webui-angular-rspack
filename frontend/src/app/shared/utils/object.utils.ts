/**
 * Object Utilities
 * Common object manipulation functions
 */

/**
 * Check if value is a plain object
 */
export function isObject(value: unknown): value is Record<string, any> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Check if object is empty
 */
export function isEmpty(obj: object): boolean {
  return Object.keys(obj).length === 0;
}

/**
 * Get nested property value using dot notation
 * @param obj - Object to get property from
 * @param path - Dot notation path (e.g., 'user.address.city')
 * @param defaultValue - Default value if path doesn't exist
 */
export function get<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue?: T
): T | undefined {
  const keys = path.split('.');
  let result: any = obj;

  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }

  return result !== undefined ? result : defaultValue;
}

/**
 * Set nested property value using dot notation
 * @param obj - Object to set property on
 * @param path - Dot notation path
 * @param value - Value to set
 */
export function set<T = any>(
  obj: Record<string, any>,
  path: string,
  value: T
): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current: any = obj;

  for (const key of keys) {
    if (!(key in current) || !isObject(current[key])) {
      current[key] = {};
    }
    current = current[key];
  }

  current[lastKey] = value;
}

/**
 * Delete nested property using dot notation
 * @param obj - Object to delete property from
 * @param path - Dot notation path
 */
export function del(obj: Record<string, any>, path: string): boolean {
  const keys = path.split('.');
  const lastKey = keys.pop()!;
  let current: any = obj;

  for (const key of keys) {
    if (!(key in current) || !isObject(current[key])) {
      return false;
    }
    current = current[key];
  }

  return delete current[lastKey];
}

/**
 * Check if object has property (including nested)
 * @param obj - Object to check
 * @param path - Dot notation path
 */
export function has(obj: Record<string, any>, path: string): boolean {
  const keys = path.split('.');
  let current: any = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return false;
    }
    current = current[key];
  }

  return current !== undefined;
}

/**
 * Pick specified properties from object
 * @param obj - Object to pick from
 * @param keys - Array of keys to pick
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specified properties from object
 * @param obj - Object to omit from
 * @param keys - Array of keys to omit
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result as Omit<T, K>;
}

/**
 * Deep clone object
 * @param obj - Object to clone
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as any;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as any;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }

  return cloned;
}

/**
 * Deep merge objects
 * @param target - Target object
 * @param sources - Source objects to merge
 */
export function deepMerge<T extends object>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target };

  for (const source of sources) {
    if (!source) continue;

    for (const key in source) {
      if (!Object.prototype.hasOwnProperty.call(source, key)) continue;

      const sourceValue = source[key];
      const targetValue = result[key as keyof T];

      if (isObject(sourceValue) && isObject(targetValue)) {
        (result as any)[key] = deepMerge(targetValue as object, sourceValue);
      } else {
        (result as any)[key] = sourceValue;
      }
    }
  }

  return result;
}

/**
 * Flatten nested object
 * @param obj - Object to flatten
 * @param separator - Key separator (default: '.')
 */
export function flatten<T extends object>(obj: T, separator = '.'): Record<string, any> {
  const result: Record<string, any> = {};

  function flattenRecursive(current: any, prefix: string): void {
    if (isObject(current)) {
      for (const key in current) {
        if (Object.prototype.hasOwnProperty.call(current, key)) {
          const newKey = prefix ? `${prefix}${separator}${key}` : key;
          flattenRecursive(current[key], newKey);
        }
      }
    } else {
      result[prefix] = current;
    }
  }

  flattenRecursive(obj, '');
  return result;
}

/**
 * Unflatten object (reverse of flatten)
 * @param obj - Flattened object
 * @param separator - Key separator (default: '.')
 */
export function unflatten<T extends object>(obj: Record<string, any>, separator = '.'): T {
  const result: any = {};

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      set(result, key, obj[key]);
    }
  }

  return result;
}

/**
 * Invert object (swap keys and values)
 * @param obj - Object to invert
 */
export function invert<T extends string | number | symbol>(
  obj: Record<string, T>
): Record<T, string> {
  const result = {} as Record<T, string>;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[obj[key]] = key;
    }
  }
  return result;
}

/**
 * Map object values
 * @param obj - Object to map
 * @param mapper - Function to transform each value
 */
export function mapValues<T, U>(
  obj: Record<string, T>,
  mapper: (value: T, key: string) => U
): Record<string, U> {
  const result: Record<string, U> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[key] = mapper(obj[key], key);
    }
  }
  return result;
}

/**
 * Map object keys
 * @param obj - Object to map
 * @param mapper - Function to transform each key
 */
export function mapKeys<T>(
  obj: Record<string, T>,
  mapper: (key: string, value: T) => string
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      result[mapper(key, obj[key])] = obj[key];
    }
  }
  return result;
}

/**
 * Filter object entries
 * @param obj - Object to filter
 * @param predicate - Function to test each entry
 */
export function filterEntries<T>(
  obj: Record<string, T>,
  predicate: (value: T, key: string) => boolean
): Record<string, T> {
  const result: Record<string, T> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (predicate(obj[key], key)) {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

/**
 * Get object keys with types
 * @param obj - Object to get keys from
 */
export function keys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Get object values with types
 * @param obj - Object to get values from
 */
export function values<T extends object>(obj: T): T[keyof T][] {
  return Object.values(obj) as T[keyof T][];
}

/**
 * Get object entries with types
 * @param obj - Object to get entries from
 */
export function entries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Count object properties
 * @param obj - Object to count
 */
export function size(obj: object): number {
  return Object.keys(obj).length;
}

/**
 * Compare two objects for deep equality
 * @param obj1 - First object
 * @param obj2 - Second object
 */
export function isEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;

  if (obj1 === null || obj2 === null) return false;
  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (const key of keys1) {
    if (!Object.prototype.hasOwnProperty.call(obj2, key)) return false;
    if (!isEqual(obj1[key], obj2[key])) return false;
  }

  return true;
}

/**
 * Create object from key-value pairs
 * @param pairs - Array of [key, value] pairs
 */
export function fromEntries<T>(pairs: [string, T][]): Record<string, T> {
  return Object.fromEntries(pairs);
}

/**
 * Swap object keys and values based on predicate
 * @param obj - Object to transform
 * @param predicate - Function to select which keys to swap
 */
export function swapKeys<T extends object>(
  obj: T,
  predicate: (key: keyof T) => boolean
): Partial<T> {
  const result: Partial<T> = {};
  const swappedKeys = new Set<string>();

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (predicate(key as keyof T)) {
        const value = obj[key] as any;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'symbol') {
          (result as any)[value] = key;
          swappedKeys.add(String(value));
        }
      } else if (!swappedKeys.has(key)) {
        result[key] = obj[key];
      }
    }
  }

  return result;
}
