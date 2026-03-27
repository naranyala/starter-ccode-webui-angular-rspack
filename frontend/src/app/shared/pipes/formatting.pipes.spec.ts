import { describe, expect, test } from 'bun:test';
import { FilterByPipe, NumberFormatPipe, TitleCasePipe, TruncatePipe } from './formatting.pipes';

describe('NumberFormatPipe', () => {
  const pipe = new NumberFormatPipe();

  test('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  test('should format numbers with thousand separators', () => {
    expect(pipe.transform(1234567)).toBe('1,234,567');
    expect(pipe.transform(1000)).toBe('1,000');
    expect(pipe.transform(1000000)).toBe('1,000,000');
  });

  test('should handle decimal numbers', () => {
    expect(pipe.transform(1234.56)).toBe('1,234.56');
    expect(pipe.transform(1000000.99)).toBe('1,000,000.99');
  });

  test('should handle string numbers', () => {
    expect(pipe.transform('1234567')).toBe('1,234,567');
    expect(pipe.transform('999')).toBe('999');
  });

  test('should return empty string for null/undefined', () => {
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
    expect(pipe.transform('')).toBe('');
  });

  test('should parse partial numeric strings', () => {
    expect(pipe.transform('12abc')).toBe('12');
  });

  test('should support different locales', () => {
    expect(pipe.transform(1234567, 'de-DE')).toBe('1.234.567');
    expect(pipe.transform(1234567, 'fr-FR')).toBe('1 234 567');
  });
});

describe('TruncatePipe', () => {
  const pipe = new TruncatePipe();

  test('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  test('should return original text if within limit', () => {
    expect(pipe.transform('Hello', 10)).toBe('Hello');
    expect(pipe.transform('Short', 100)).toBe('Short');
  });

  test('should truncate text to specified length', () => {
    expect(pipe.transform('Hello World', 5)).toBe('Hello...');
    expect(pipe.transform('This is a long text', 10)).toBe('This is a ...');
  });

  test('should use custom ellipsis', () => {
    expect(pipe.transform('Hello World', 5, false, ' [more]')).toBe('Hello [more]');
  });

  test('should truncate at complete words when enabled', () => {
    // When completeWords is true, it finds the last space before the limit
    expect(pipe.transform('Hello World Test', 12, true)).toBe('Hello World...');
  });

  test('should handle empty/null values', () => {
    expect(pipe.transform('', 10)).toBe('');
    expect(pipe.transform(null as any, 10)).toBe('');
    expect(pipe.transform(undefined as any, 10)).toBe('');
  });

  test('should use default limit of 50', () => {
    const longText = 'a'.repeat(60);
    expect(pipe.transform(longText)).toBe(`${'a'.repeat(50)}...`);
  });
});

describe('TitleCasePipe', () => {
  const pipe = new TitleCasePipe();

  test('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  test('should convert to title case', () => {
    expect(pipe.transform('hello world')).toBe('Hello World');
    expect(pipe.transform('TYPESCRIPT IS AWESOME')).toBe('Typescript Is Awesome');
  });

  test('should handle single words', () => {
    expect(pipe.transform('hello')).toBe('Hello');
    expect(pipe.transform('WORLD')).toBe('World');
  });

  test('should handle empty/null values', () => {
    expect(pipe.transform('')).toBe('');
    expect(pipe.transform(null as any)).toBe('');
    expect(pipe.transform(undefined as any)).toBe('');
  });

  test('should preserve multiple spaces', () => {
    expect(pipe.transform('hello  world')).toBe('Hello  World');
  });
});

describe('FilterByPipe', () => {
  const pipe = new FilterByPipe();

  test('should be created', () => {
    expect(pipe).toBeTruthy();
  });

  test('should return original array if no search term', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];
    expect(pipe.transform(items, '')).toEqual(items);
  });

  test('should filter by specific property', () => {
    const items = [
      { name: 'John', age: 30 },
      { name: 'Jane', age: 25 },
      { name: 'Bob', age: 35 },
    ];

    const result = pipe.transform(items, 'ja', 'name');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Jane');
  });

  test('should search all properties when no property specified', () => {
    const items = [
      { name: 'John', city: 'New York' },
      { name: 'Jane', city: 'London' },
      { name: 'Bob', city: 'Paris' },
    ];

    const result = pipe.transform(items, 'london');
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Jane');
  });

  test('should be case insensitive', () => {
    const items = [{ name: 'John' }, { name: 'Jane' }];

    expect(pipe.transform(items, 'JOHN', 'name').length).toBe(1);
    expect(pipe.transform(items, 'jane', 'name').length).toBe(1);
  });

  test('should handle empty array', () => {
    expect(pipe.transform([], 'test')).toEqual([]);
  });

  test('should handle null/undefined array', () => {
    expect(pipe.transform(null as any, 'test')).toBe(null);
    expect(pipe.transform(undefined as any, 'test')).toBe(undefined);
  });
});
