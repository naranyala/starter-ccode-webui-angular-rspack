/**
 * Time and Date Utilities
 * Common date/time formatting and manipulation functions
 */

export type DateFormat = 'short' | 'medium' | 'long' | 'full' | 'iso' | 'relative';

export interface DateParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
  dayOfWeek: number;
  dayOfYear: number;
  weekOfYear: number;
  quarter: number;
}

/**
 * Format date to string
 * @param date - Date to format
 * @param format - Format type
 * @param locale - Locale string (default: 'en-US')
 */
export function formatDate(
  date: Date | string | number,
  format: DateFormat = 'medium',
  locale = 'en-US'
): string {
  const d = toDate(date);
  if (!d) return 'Invalid Date';

  switch (format) {
    case 'short':
      return new Intl.DateTimeFormat(locale, {
        month: 'numeric',
        day: 'numeric',
        year: '2-digit',
      }).format(d);
    case 'medium':
      return new Intl.DateTimeFormat(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
    case 'long':
      return new Intl.DateTimeFormat(locale, {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
    case 'full':
      return new Intl.DateTimeFormat(locale, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
    case 'iso':
      return d.toISOString();
    case 'relative':
      return formatRelativeTime(d, locale);
    default:
      return d.toLocaleDateString(locale);
  }
}

/**
 * Format time to string
 * @param date - Date to format
 * @param showSeconds - Show seconds (default: false)
 * @param hour12 - Use 12-hour format (default: true)
 * @param locale - Locale string
 */
export function formatTime(
  date: Date | string | number,
  showSeconds = false,
  hour12 = true,
  locale = 'en-US'
): string {
  const d = toDate(date);
  if (!d) return 'Invalid Time';

  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    minute: 'numeric',
    second: showSeconds ? 'numeric' : undefined,
    hour12,
  }).format(d);
}

/**
 * Format date and time
 * @param date - Date to format
 * @param locale - Locale string
 */
export function formatDateTime(date: Date | string | number, locale = 'en-US'): string {
  return `${formatDate(date, 'medium', locale)} ${formatTime(date, false, true, locale)}`;
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - Date to format
 * @param locale - Locale string
 */
export function formatRelativeTime(date: Date | string | number, locale = 'en-US'): string {
  const d = toDate(date);
  if (!d) return 'Invalid Date';

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffSecs = Math.round(diffMs / 1000);
  const diffMins = Math.round(diffSecs / 60);
  const diffHours = Math.round(diffMins / 60);
  const diffDays = Math.round(diffHours / 24);
  const diffWeeks = Math.round(diffDays / 7);
  const diffMonths = Math.round(diffDays / 30);
  const diffYears = Math.round(diffDays / 365);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  if (Math.abs(diffYears) >= 1) {
    return rtf.format(diffYears > 0 ? diffYears : -diffYears, diffYears > 0 ? 'year' : 'year');
  }
  if (Math.abs(diffMonths) >= 1) {
    return rtf.format(-diffMonths, 'month');
  }
  if (Math.abs(diffWeeks) >= 1) {
    return rtf.format(-diffWeeks, 'week');
  }
  if (Math.abs(diffDays) >= 1) {
    return rtf.format(-diffDays, 'day');
  }
  if (Math.abs(diffHours) >= 1) {
    return rtf.format(-diffHours, 'hour');
  }
  if (Math.abs(diffMins) >= 1) {
    return rtf.format(-diffMins, 'minute');
  }
  return rtf.format(-diffSecs, 'second');
}

/**
 * Get date parts
 * @param date - Date to extract parts from
 */
export function getDateParts(date: Date | string | number): DateParts | null {
  const d = toDate(date);
  if (!d) return null;

  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - startOfYear.getTime();
  const oneDay = 1000 * 60 * 60 * 24;

  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
    second: d.getSeconds(),
    millisecond: d.getMilliseconds(),
    dayOfWeek: d.getDay(),
    dayOfYear: Math.floor(diff / oneDay) + 1,
    weekOfYear: Math.ceil(((diff / oneDay) + 1) / 7),
    quarter: Math.floor((d.getMonth() + 3) / 3),
  };
}

/**
 * Check if date is today
 */
export function isToday(date: Date | string | number): boolean {
  const d = toDate(date);
  if (!d) return false;
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date | string | number): boolean {
  const d = toDate(date);
  if (!d) return false;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return d.toDateString() === yesterday.toDateString();
}

/**
 * Check if date is tomorrow
 */
export function isTomorrow(date: Date | string | number): boolean {
  const d = toDate(date);
  if (!d) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return d.toDateString() === tomorrow.toDateString();
}

/**
 * Check if date is in the past
 */
export function isPast(date: Date | string | number): boolean {
  const d = toDate(date);
  if (!d) return false;
  return d.getTime() < Date.now();
}

/**
 * Check if date is in the future
 */
export function isFuture(date: Date | string | number): boolean {
  const d = toDate(date);
  if (!d) return false;
  return d.getTime() > Date.now();
}

/**
 * Check if date is valid
 */
export function isValidDate(date: unknown): boolean {
  if (date instanceof Date) {
    return !isNaN(date.getTime());
  }
  if (typeof date === 'string' || typeof date === 'number') {
    return !isNaN(new Date(date).getTime());
  }
  return false;
}

/**
 * Add days to date
 */
export function addDays(date: Date | string | number, days: number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add months to date
 */
export function addMonths(date: Date | string | number, months: number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  const result = new Date(d);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Add years to date
 */
export function addYears(date: Date | string | number, years: number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  const result = new Date(d);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Get difference between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @param unit - 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'y'
 */
export function diff(
  date1: Date | string | number,
  date2: Date | string | number,
  unit: 'ms' | 's' | 'min' | 'h' | 'd' | 'w' | 'M' | 'y' = 'ms'
): number {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  if (!d1 || !d2) return 0;

  const diffMs = d1.getTime() - d2.getTime();

  switch (unit) {
    case 'ms':
      return diffMs;
    case 's':
      return Math.floor(diffMs / 1000);
    case 'min':
      return Math.floor(diffMs / (1000 * 60));
    case 'h':
      return Math.floor(diffMs / (1000 * 60 * 60));
    case 'd':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24));
    case 'w':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
    case 'M':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30.44));
    case 'y':
      return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365.25));
    default:
      return diffMs;
  }
}

/**
 * Get start of day
 */
export function startOfDay(date: Date | string | number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  const result = new Date(d);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get end of day
 */
export function endOfDay(date: Date | string | number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  const result = new Date(d);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get start of month
 */
export function startOfMonth(date: Date | string | number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  const result = new Date(d.getFullYear(), d.getMonth(), 1);
  return result;
}

/**
 * Get end of month
 */
export function endOfMonth(date: Date | string | number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  const result = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return result;
}

/**
 * Get start of year
 */
export function startOfYear(date: Date | string | number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  return new Date(d.getFullYear(), 0, 1);
}

/**
 * Get end of year
 */
export function endOfYear(date: Date | string | number): Date {
  const d = toDate(date);
  if (!d) return new Date();
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

/**
 * Check if date1 is after date2
 */
export function isAfter(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  if (!d1 || !d2) return false;
  return d1.getTime() > d2.getTime();
}

/**
 * Check if date1 is before date2
 */
export function isBefore(date1: Date | string | number, date2: Date | string | number): boolean {
  const d1 = toDate(date1);
  const d2 = toDate(date2);
  if (!d1 || !d2) return false;
  return d1.getTime() < d2.getTime();
}

/**
 * Check if date is between two dates
 */
export function isBetween(
  date: Date | string | number,
  start: Date | string | number,
  end: Date | string | number
): boolean {
  const d = toDate(date);
  const s = toDate(start);
  const e = toDate(end);
  if (!d || !s || !e) return false;
  return d.getTime() >= s.getTime() && d.getTime() <= e.getTime();
}

/**
 * Convert to Date object
 */
export function toDate(date: Date | string | number | null | undefined): Date | null {
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  if (date === null || date === undefined) {
    return null;
  }
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
