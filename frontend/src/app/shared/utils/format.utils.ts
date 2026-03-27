/**
 * Formatting Utilities
 * Common formatting functions for numbers, bytes, time, etc.
 */

/**
 * Format bytes to human-readable string
 * @param bytes - Number of bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  if (!isFinite(bytes)) return 'Invalid';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

/**
 * Format milliseconds to human-readable duration
 * @param ms - Milliseconds
 * @returns Formatted string (e.g., "1.5 s" or "250 ms")
 */
export function formatDuration(ms: number): string {
  if (!isFinite(ms)) return 'Invalid';
  if (ms < 0) return '0 ms';

  if (ms < 1000) {
    return `${ms.toFixed(0)} ms`;
  }

  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(2)} s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  return `${hours}h ${remainingMinutes}m ${remainingSeconds.toFixed(0)}s`;
}

/**
 * Format number with locale-specific separators
 * @param num - Number to format
 * @param locale - Locale string (default: 'en-US')
 * @param options - Intl.NumberFormatOptions
 */
export function formatNumber(
  num: number,
  locale = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(num);
}

/**
 * Format number as percentage
 * @param value - Decimal value (0.75 = 75%)
 * @param decimals - Decimal places (default: 1)
 */
export function formatPercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Format number with compact notation (e.g., 1.5K, 2.3M)
 * @param num - Number to format
 * @param decimals - Decimal places (default: 1)
 */
export function formatCompact(num: number, decimals = 1): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format currency
 * @param amount - Amount in cents/smallest unit
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale string (default: 'en-US')
 */
export function formatCurrency(
  amount: number,
  currency = 'USD',
  locale = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format file size with binary prefixes (KiB, MiB, GiB)
 * @param bytes - Number of bytes
 * @param decimals - Decimal places (default: 2)
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  return formatBytes(bytes, decimals);
}

/**
 * Format speed (bytes per second)
 * @param bytesPerSecond - Speed in bytes/second
 * @param decimals - Decimal places (default: 2)
 */
export function formatSpeed(bytesPerSecond: number, decimals = 2): string {
  return `${formatBytes(bytesPerSecond, decimals)}/s`;
}

/**
 * Format temperature
 * @param celsius - Temperature in Celsius
 * @param unit - 'C' | 'F' | 'K' (default: 'C')
 */
export function formatTemperature(celsius: number, unit: 'C' | 'F' | 'K' = 'C'): string {
  switch (unit) {
    case 'F':
      return `${((celsius * 9) / 5 + 32).toFixed(1)}°F`;
    case 'K':
      return `${(celsius + 273.15).toFixed(2)}K`;
    default:
      return `${celsius.toFixed(1)}°C`;
  }
}

/**
 * Format distance
 * @param meters - Distance in meters
 * @param system - 'metric' | 'imperial' (default: 'metric')
 */
export function formatDistance(meters: number, system: 'metric' | 'imperial' = 'metric'): string {
  if (system === 'imperial') {
    const feet = meters * 3.28084;
    if (feet < 5280) {
      return `${feet.toFixed(1)} ft`;
    }
    const miles = feet / 5280;
    return `${miles.toFixed(2)} mi`;
  }

  if (meters < 1000) {
    return `${meters.toFixed(1)} m`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Round to specific decimal places
 * @param value - Number to round
 * @param decimals - Decimal places
 */
export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Clamp number between min and max
 * @param value - Number to clamp
 * @param min - Minimum value
 * @param max - Maximum value
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Map number from one range to another
 * @param value - Value to map
 * @param inMin - Input minimum
 * @param inMax - Input maximum
 * @param outMin - Output minimum
 * @param outMax - Output maximum
 */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * Check if number is within range
 * @param value - Number to check
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 */
export function inRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Generate random number between min and max
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 */
export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random float between min and max
 * @param min - Minimum value
 * @param max - Maximum value
 */
export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}
