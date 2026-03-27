/**
 * Array Utilities
 * Common array manipulation functions
 */

/**
 * Remove duplicates from array
 * @param arr - Array to process
 * @param keyFn - Optional function to extract key for comparison
 */
export function unique<T>(arr: T[], keyFn?: (item: T) => any): T[] {
  if (!keyFn) {
    return [...new Set(arr)];
  }
  const seen = new Set();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Chunk array into smaller arrays
 * @param arr - Array to chunk
 * @param size - Size of each chunk
 */
export function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

/**
 * Shuffle array (Fisher-Yates algorithm)
 * @param arr - Array to shuffle
 */
export function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get random item from array
 * @param arr - Array to pick from
 */
export function randomItem<T>(arr: T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get first n items from array
 * @param arr - Array to take from
 * @param n - Number of items
 */
export function take<T>(arr: T[], n: number): T[] {
  return arr.slice(0, n);
}

/**
 * Get all items except first n
 * @param arr - Array to drop from
 * @param n - Number of items to drop
 */
export function drop<T>(arr: T[], n: number): T[] {
  return arr.slice(n);
}

/**
 * Remove item from array by value
 * @param arr - Array to modify
 * @param value - Value to remove
 */
export function remove<T>(arr: T[], value: T): T[] {
  return arr.filter((item) => item !== value);
}

/**
 * Remove item from array by predicate
 * @param arr - Array to modify
 * @param predicate - Function to test each item
 */
export function removeBy<T>(arr: T[], predicate: (item: T) => boolean): T[] {
  return arr.filter((item) => !predicate(item));
}

/**
 * Check if arrays are equal
 * @param arr1 - First array
 * @param arr2 - Second array
 * @param compareFn - Optional comparison function
 */
export function arraysEqual<T>(arr1: T[], arr2: T[], compareFn?: (a: T, b: T) => boolean): boolean {
  if (arr1.length !== arr2.length) return false;
  const compare = compareFn || ((a, b) => a === b);
  return arr1.every((item, i) => compare(item, arr2[i]));
}

/**
 * Group array by key
 * @param arr - Array to group
 * @param keyFn - Function to extract grouping key
 */
export function groupBy<T, K extends string | number | symbol>(
  arr: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item);
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    },
    {} as Record<K, T[]>
  );
}

/**
 * Partition array by predicate
 * @param arr - Array to partition
 * @param predicate - Function to test each item
 */
export function partition<T>(arr: T[], predicate: (item: T) => boolean): [T[], T[]] {
  return arr.reduce(
    (acc, item) => {
      acc[predicate(item) ? 0 : 1].push(item);
      return acc;
    },
    [[] as T[], [] as T[]]
  );
}

/**
 * Flatten nested array
 * @param arr - Array to flatten
 * @param depth - Depth to flatten (default: 1)
 */
export function flatten<T>(arr: any[], depth = 1): T[] {
  return arr.flat(depth);
}

/**
 * Deep flatten array
 * @param arr - Array to flatten
 */
export function flattenDeep<T>(arr: any[]): T[] {
  return arr.flat(Infinity);
}

/**
 * Zip arrays together
 * @param arrays - Arrays to zip
 */
export function zip<T>(...arrays: T[][]): T[][] {
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  return Array.from({ length: maxLength }, (_, i) => arrays.map((arr) => arr[i]));
}

/**
 * Interleave arrays
 * @param arrays - Arrays to interleave
 */
export function interleave<T>(...arrays: T[][]): T[] {
  const result: T[] = [];
  const maxLength = Math.max(...arrays.map((arr) => arr.length));
  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      if (i < arr.length) {
        result.push(arr[i]);
      }
    }
  }
  return result;
}

/**
 * Get intersection of arrays
 * @param arr1 - First array
 * @param arr2 - Second array
 */
export function intersection<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => set2.has(item));
}

/**
 * Get union of arrays
 * @param arr1 - First array
 * @param arr2 - Second array
 */
export function union<T>(arr1: T[], arr2: T[]): T[] {
  return unique([...arr1, ...arr2]);
}

/**
 * Get difference of arrays (arr1 - arr2)
 * @param arr1 - First array
 * @param arr2 - Second array
 */
export function difference<T>(arr1: T[], arr2: T[]): T[] {
  const set2 = new Set(arr2);
  return arr1.filter((item) => !set2.has(item));
}

/**
 * Get symmetric difference of arrays
 * @param arr1 - First array
 * @param arr2 - Second array
 */
export function symmetricDifference<T>(arr1: T[], arr2: T[]): T[] {
  return [...difference(arr1, arr2), ...difference(arr2, arr1)];
}

/**
 * Sort array by key
 * @param arr - Array to sort
 * @param keyFn - Function to extract sort key
 * @param ascending - Sort ascending (default: true)
 */
export function sortBy<T>(arr: T[], keyFn: (item: T) => any, ascending = true): T[] {
  return [...arr].sort((a, b) => {
    const aKey = keyFn(a);
    const bKey = keyFn(b);
    const comparison = aKey < bKey ? -1 : aKey > bKey ? 1 : 0;
    return ascending ? comparison : -comparison;
  });
}

/**
 * Move item in array
 * @param arr - Array to modify
 * @param fromIndex - Index to move from
 * @param toIndex - Index to move to
 */
export function move<T>(arr: T[], fromIndex: number, toIndex: number): T[] {
  const result = [...arr];
  const [item] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, item);
  return result;
}

/**
 * Rotate array
 * @param arr - Array to rotate
 * @param positions - Number of positions to rotate (positive = right, negative = left)
 */
export function rotate<T>(arr: T[], positions: number): T[] {
  const len = arr.length;
  if (len === 0) return arr;
  const normalized = ((positions % len) + len) % len;
  return [...arr.slice(len - normalized), ...arr.slice(0, len - normalized)];
}

/**
 * Fill array with range of numbers
 * @param start - Start value
 * @param end - End value (exclusive)
 * @param step - Step value (default: 1)
 */
export function range(start: number, end: number, step = 1): number[] {
  const result: number[] = [];
  for (let i = start; i < end; i += step) {
    result.push(i);
  }
  return result;
}

/**
 * Create array of specified length filled with value
 * @param length - Array length
 * @param value - Value to fill
 */
export function fill<T>(length: number, value: T): T[] {
  return Array(length).fill(value);
}

/**
 * Create array with mapper function
 * @param length - Array length
 * @param mapper - Function to generate each item
 */
export function create<T>(length: number, mapper: (index: number) => T): T[] {
  return Array.from({ length }, (_, i) => mapper(i));
}

/**
 * Sum array values
 * @param arr - Array of numbers or objects
 * @param keyFn - Optional function to extract numeric value
 */
export function sum(arr: number[]): number;
export function sum<T>(arr: T[], keyFn: (item: T) => number): number;
export function sum<T>(arr: T[] | number[], keyFn?: (item: T) => number): number {
  if (!Array.isArray(arr)) return 0;
  if (keyFn) {
    return (arr as T[]).reduce((acc, item) => acc + keyFn(item), 0);
  }
  return (arr as number[]).reduce((acc, val) => acc + val, 0);
}

/**
 * Average of array values
 * @param arr - Array of numbers or objects
 * @param keyFn - Optional function to extract numeric value
 */
export function average(arr: number[]): number;
export function average<T>(arr: T[], keyFn: (item: T) => number): number;
export function average<T>(arr: T[] | number[], keyFn?: (item: T) => number): number {
  if (arr.length === 0) return 0;
  if (keyFn) {
    return sum(arr as T[], keyFn) / arr.length;
  }
  return sum(arr as number[]) / arr.length;
}

/**
 * Find median of array values
 * @param arr - Array of numbers
 */
export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/**
 * Find min value
 * @param arr - Array of numbers or objects
 * @param keyFn - Optional function to extract numeric value
 */
export function min(arr: number[]): number;
export function min<T>(arr: T[], keyFn: (item: T) => number): number;
export function min<T>(arr: T[] | number[], keyFn?: (item: T) => number): number {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  if (keyFn) {
    return Math.min(...(arr as T[]).map(keyFn));
  }
  return Math.min(...(arr as number[]));
}

/**
 * Find max value
 * @param arr - Array of numbers or objects
 * @param keyFn - Optional function to extract numeric value
 */
export function max(arr: number[]): number;
export function max<T>(arr: T[], keyFn: (item: T) => number): number;
export function max<T>(arr: T[] | number[], keyFn?: (item: T) => number): number {
  if (!Array.isArray(arr) || arr.length === 0) return 0;
  if (keyFn) {
    return Math.max(...(arr as T[]).map(keyFn));
  }
  return Math.max(...(arr as number[]));
}
