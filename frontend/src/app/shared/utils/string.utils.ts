/**
 * String Utilities
 * Common string manipulation and validation functions
 */

/**
 * Truncate string to specified length with ellipsis
 * @param str - String to truncate
 * @param length - Maximum length
 * @param suffix - Suffix to add (default: '...')
 */
export function truncate(str: string, length: number, suffix = '...'): string {
  if (!str || str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Truncate from middle (for emails, paths, etc.)
 * @param str - String to truncate
 * @param maxLength - Maximum total length
 * @param splitChar - Character to split on (default: '.')
 */
export function truncateMiddle(
  str: string,
  maxLength: number,
  splitChar = '.'
): string {
  if (!str || str.length <= maxLength) return str;

  const parts = str.split(splitChar);
  if (parts.length === 1) {
    const half = Math.floor(maxLength / 2);
    return str.slice(0, half) + '...' + str.slice(-half);
  }

  const last = parts[parts.length - 1];
  const first = parts[0];
  const remaining = maxLength - last.length - 1;

  if (first.length <= remaining) {
    return str;
  }

  return first.slice(0, remaining) + '...' + splitChar + last;
}

/**
 * Capitalize first letter of string
 * @param str - String to capitalize
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize first letter of each word
 * @param str - String to title case
 */
export function titleCase(str: string): string {
  if (!str) return str;
  return str
    .toLowerCase()
    .split(/\s+/)
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Convert to camelCase
 * @param str - String to convert
 */
export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

/**
 * Convert to PascalCase
 * @param str - String to convert
 */
export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Convert to kebab-case
 * @param str - String to convert
 */
export function toKebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert to snake_case
 * @param str - String to convert
 */
export function toSnakeCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/**
 * Check if string contains only letters
 * @param str - String to check
 */
export function isAlpha(str: string): boolean {
  return /^[a-zA-Z]+$/.test(str);
}

/**
 * Check if string contains only alphanumeric characters
 * @param str - String to check
 */
export function isAlphanumeric(str: string): boolean {
  return /^[a-zA-Z0-9]+$/.test(str);
}

/**
 * Check if string is a valid email
 * @param str - String to check
 */
export function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if string is a valid URL
 * @param str - String to check
 */
export function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if string is a valid phone number (basic check)
 * @param str - String to check
 */
export function isPhone(str: string): boolean {
  const phoneRegex = /^[\d\s\-+()]{10,}$/;
  return phoneRegex.test(str);
}

/**
 * Check if string is a valid credit card number (Luhn algorithm)
 * @param str - String to check
 */
export function isCreditCard(str: string): boolean {
  const digits = str.replace(/\D/g, '');
  if (!digits || digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Strip HTML tags from string
 * @param html - HTML string
 */
export function stripHtml(html: string): string {
  if (!html) return html;
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 * @param str - String to escape
 */
export function escapeHtml(str: string): string {
  const escapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return str.replace(/[&<>"']/g, char => escapeMap[char]);
}

/**
 * Unescape HTML entities
 * @param str - String to unescape
 */
export function unescapeHtml(str: string): string {
  const unescapeMap: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
  };
  return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, match => unescapeMap[match]);
}

/**
 * Generate slug from string (URL-friendly)
 * @param str - String to slugify
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Count words in string
 * @param str - String to count words
 */
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Count characters (excluding spaces)
 * @param str - String to count characters
 */
export function charCount(str: string, excludeSpaces = true): number {
  if (excludeSpaces) {
    return str.replace(/\s/g, '').length;
  }
  return str.length;
}

/**
 * Reverse string
 * @param str - String to reverse
 */
export function reverse(str: string): string {
  return str.split('').reverse().join('');
}

/**
 * Repeat string n times
 * @param str - String to repeat
 * @param times - Number of times
 */
export function repeat(str: string, times: number): string {
  return str.repeat(times);
}

/**
 * Pad string to specified length
 * @param str - String to pad
 * @param length - Target length
 * @param char - Character to pad with (default: ' ')
 * @param position - 'left' | 'right' (default: 'left')
 */
export function pad(
  str: string,
  length: number,
  char = ' ',
  position: 'left' | 'right' = 'left'
): string {
  if (str.length >= length) return str;
  const padding = char.repeat(length - str.length);
  return position === 'left' ? padding + str : str + padding;
}

/**
 * Check if string starts with prefix (case-insensitive option)
 * @param str - String to check
 * @param prefix - Prefix to look for
 * @param caseSensitive - Case sensitive check (default: true)
 */
export function startsWith(str: string, prefix: string, caseSensitive = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().startsWith(prefix.toLowerCase());
  }
  return str.startsWith(prefix);
}

/**
 * Check if string ends with suffix (case-insensitive option)
 * @param str - String to check
 * @param suffix - Suffix to look for
 * @param caseSensitive - Case sensitive check (default: true)
 */
export function endsWith(str: string, suffix: string, caseSensitive = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().endsWith(suffix.toLowerCase());
  }
  return str.endsWith(suffix);
}

/**
 * Check if string contains substring (case-insensitive option)
 * @param str - String to check
 * @param substr - Substring to look for
 * @param caseSensitive - Case sensitive check (default: true)
 */
export function contains(str: string, substr: string, caseSensitive = true): boolean {
  if (!caseSensitive) {
    return str.toLowerCase().includes(substr.toLowerCase());
  }
  return str.includes(substr);
}

/**
 * Remove duplicates from string (characters)
 * @param str - String to process
 */
export function removeDuplicateChars(str: string): string {
  return [...new Set(str.split(''))].join('');
}

/**
 * Generate random string
 * @param length - Length of string (default: 10)
 * @param chars - Character set to use (default: alphanumeric)
 */
export function randomString(length = 10, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate UUID v4
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
