/**
 * Validation Utilities
 * Common validation functions for forms and data
 */

import { isAlpha, isAlphanumeric, isEmail, isPhone, isUrl } from './string.utils';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export type ValidatorFn = (value: any) => string | null;

/**
 * Check if value is null or undefined
 */
export function isNullish(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Check if value is empty (string, array, object)
 */
export function isEmpty(value: unknown): boolean {
  if (isNullish(value)) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object' && value !== null) return Object.keys(value).length === 0;
  return false;
}

/**
 * Validate required field
 */
export function required(value: unknown): string | null {
  if (isEmpty(value)) {
    return 'This field is required';
  }
  return null;
}

/**
 * Validate minimum length
 */
export function minLength(min: number): ValidatorFn {
  return (value: string | any[]): string | null => {
    if (isNullish(value)) return null;
    if (value.length < min) {
      return `Must be at least ${min} characters`;
    }
    return null;
  };
}

/**
 * Validate maximum length
 */
export function maxLength(max: number): ValidatorFn {
  return (value: string | any[]): string | null => {
    if (isNullish(value)) return null;
    if (value.length > max) {
      return `Must be no more than ${max} characters`;
    }
    return null;
  };
}

/**
 * Validate exact length
 */
export function exactLength(length: number): ValidatorFn {
  return (value: string | any[]): string | null => {
    if (isNullish(value)) return null;
    if (value.length !== length) {
      return `Must be exactly ${length} characters`;
    }
    return null;
  };
}

/**
 * Validate minimum number value
 */
export function min(min: number): ValidatorFn {
  return (value: number): string | null => {
    if (isNullish(value)) return null;
    if (value < min) {
      return `Must be at least ${min}`;
    }
    return null;
  };
}

/**
 * Validate maximum number value
 */
export function max(max: number): ValidatorFn {
  return (value: number): string | null => {
    if (isNullish(value)) return null;
    if (value > max) {
      return `Must be no more than ${max}`;
    }
    return null;
  };
}

/**
 * Validate number range
 */
export function range(min: number, max: number): ValidatorFn {
  return (value: number): string | null => {
    if (isNullish(value)) return null;
    if (value < min) return `Must be at least ${min}`;
    if (value > max) return `Must be no more than ${max}`;
    return null;
  };
}

/**
 * Validate email format
 */
export function email(value: string): string | null {
  if (isNullish(value) || value === '') return null;
  if (!isEmail(value)) {
    return 'Please enter a valid email address';
  }
  return null;
}

/**
 * Validate URL format
 */
export function url(value: string): string | null {
  if (isNullish(value) || value === '') return null;
  if (!isUrl(value)) {
    return 'Please enter a valid URL';
  }
  return null;
}

/**
 * Validate phone number format
 */
export function phone(value: string): string | null {
  if (isNullish(value) || value === '') return null;
  if (!isPhone(value)) {
    return 'Please enter a valid phone number';
  }
  return null;
}

/**
 * Validate pattern (regex)
 */
export function pattern(regex: RegExp, message = 'Invalid format'): ValidatorFn {
  return (value: string): string | null => {
    if (isNullish(value) || value === '') return null;
    if (!regex.test(value)) {
      return message;
    }
    return null;
  };
}

/**
 * Validate alphanumeric only
 */
export function alphanumeric(value: string): string | null {
  if (isNullish(value) || value === '') return null;
  if (!isAlphanumeric(value)) {
    return 'Only letters and numbers are allowed';
  }
  return null;
}

/**
 * Validate letters only
 */
export function alpha(value: string): string | null {
  if (isNullish(value) || value === '') return null;
  if (!isAlpha(value)) {
    return 'Only letters are allowed';
  }
  return null;
}

/**
 * Validate password strength
 * Requirements: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
 */
export function passwordStrength(value: string): string | null {
  if (isNullish(value)) return null;

  const errors: string[] = [];

  if (value.length < 8) {
    errors.push('at least 8 characters');
  }
  if (!/[A-Z]/.test(value)) {
    errors.push('one uppercase letter');
  }
  if (!/[a-z]/.test(value)) {
    errors.push('one lowercase letter');
  }
  if (!/[0-9]/.test(value)) {
    errors.push('one number');
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
    errors.push('one special character');
  }

  if (errors.length > 0) {
    return `Password must contain ${errors.join(', ')}`;
  }

  return null;
}

/**
 * Validate credit card number (Luhn algorithm)
 */
export function creditCard(value: string): string | null {
  if (isNullish(value) || value === '') return null;

  const digits = value.replace(/\D/g, '');

  if (digits.length < 13 || digits.length > 19) {
    return 'Invalid card number length';
  }

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

  if (sum % 10 !== 0) {
    return 'Invalid card number';
  }

  return null;
}

/**
 * Validate date is in the future
 */
export function futureDate(value: Date | string): string | null {
  if (isNullish(value)) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return 'Invalid date';
  if (date <= new Date()) {
    return 'Date must be in the future';
  }
  return null;
}

/**
 * Validate date is in the past
 */
export function pastDate(value: Date | string): string | null {
  if (isNullish(value)) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(date.getTime())) return 'Invalid date';
  if (date >= new Date()) {
    return 'Date must be in the past';
  }
  return null;
}

/**
 * Validate date range
 */
export function dateRange(min: Date, max: Date): ValidatorFn {
  return (value: Date | string): string | null => {
    if (isNullish(value)) return null;
    const date = typeof value === 'string' ? new Date(value) : value;
    if (isNaN(date.getTime())) return 'Invalid date';
    if (date < min) return `Date must be after ${min.toLocaleDateString()}`;
    if (date > max) return `Date must be before ${max.toLocaleDateString()}`;
    return null;
  };
}

/**
 * Validate file size
 * @param maxSize - Maximum size in bytes
 */
export function fileSize(maxSize: number): ValidatorFn {
  return (value: File | null): string | null => {
    if (!value) return null;
    if (value.size > maxSize) {
      return `File must be smaller than ${formatBytes(maxSize)}`;
    }
    return null;
  };
}

/**
 * Validate file type
 * @param allowedTypes - Array of allowed MIME types or extensions
 */
export function fileType(allowedTypes: string[]): ValidatorFn {
  return (value: File | null): string | null => {
    if (!value) return null;
    const fileType = value.type.toLowerCase();
    const fileName = value.name.toLowerCase();

    const isAllowed = allowedTypes.some((type) => {
      if (type.startsWith('.')) {
        return fileName.endsWith(type.toLowerCase());
      }
      return fileType === type || fileType.startsWith(type + '/');
    });

    if (!isAllowed) {
      return `File type must be one of: ${allowedTypes.join(', ')}`;
    }
    return null;
  };
}

/**
 * Validate multiple validators
 */
export function validate(value: unknown, validators: ValidatorFn[]): ValidationResult {
  const errors: string[] = [];

  for (const validator of validators) {
    const error = validator(value as any);
    if (error) {
      errors.push(error);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create async validator
 */
export function asyncValidator(
  validateFn: (value: any) => Promise<string | null>
): (value: any) => Promise<string | null> {
  return validateFn;
}

/**
 * Format bytes helper for file size validation
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}
