import { Pipe, type PipeTransform } from '@angular/core';
import {
  truncate,
  truncateMiddle,
  capitalize,
  titleCase,
  toCamelCase,
  toPascalCase,
  toKebabCase,
  toSnakeCase,
  slugify,
  stripHtml,
  escapeHtml,
  wordCount,
  reverse,
  pad,
} from '../utils/string.utils';

/**
 * Truncate string to specified length
 * Usage: {{ text | truncate:50 }} or {{ text | truncate:50:'...' }}
 */
@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(str: string, length: number, suffix = '...'): string {
    return truncate(str || '', length, suffix);
  }
}

/**
 * Truncate from middle (for emails, paths)
 * Usage: {{ email | truncateMiddle:20 }}
 */
@Pipe({
  name: 'truncateMiddle',
  standalone: true,
})
export class TruncateMiddlePipe implements PipeTransform {
  transform(str: string, maxLength: number, splitChar = '.'): string {
    return truncateMiddle(str || '', maxLength, splitChar);
  }
}

/**
 * Capitalize first letter
 * Usage: {{ text | capitalize }}
 */
@Pipe({
  name: 'capitalize',
  standalone: true,
})
export class CapitalizePipe implements PipeTransform {
  transform(str: string): string {
    return capitalize(str || '');
  }
}

/**
 * Convert to title case
 * Usage: {{ text | titleCase }}
 */
@Pipe({
  name: 'titleCase',
  standalone: true,
})
export class TitleCasePipe implements PipeTransform {
  transform(str: string): string {
    return titleCase(str || '');
  }
}

/**
 * Convert to camelCase
 * Usage: {{ text | toCamelCase }}
 */
@Pipe({
  name: 'toCamelCase',
  standalone: true,
})
export class ToCamelCasePipe implements PipeTransform {
  transform(str: string): string {
    return toCamelCase(str || '');
  }
}

/**
 * Convert to PascalCase
 * Usage: {{ text | toPascalCase }}
 */
@Pipe({
  name: 'toPascalCase',
  standalone: true,
})
export class ToPascalCasePipe implements PipeTransform {
  transform(str: string): string {
    return toPascalCase(str || '');
  }
}

/**
 * Convert to kebab-case
 * Usage: {{ text | toKebabCase }}
 */
@Pipe({
  name: 'toKebabCase',
  standalone: true,
})
export class ToKebabCasePipe implements PipeTransform {
  transform(str: string): string {
    return toKebabCase(str || '');
  }
}

/**
 * Convert to snake_case
 * Usage: {{ text | toSnakeCase }}
 */
@Pipe({
  name: 'toSnakeCase',
  standalone: true,
})
export class ToSnakeCasePipe implements PipeTransform {
  transform(str: string): string {
    return toSnakeCase(str || '');
  }
}

/**
 * Generate URL-friendly slug
 * Usage: {{ text | slugify }}
 */
@Pipe({
  name: 'slugify',
  standalone: true,
})
export class SlugifyPipe implements PipeTransform {
  transform(str: string): string {
    return slugify(str || '');
  }
}

/**
 * Strip HTML tags
 * Usage: {{ html | stripHtml }}
 */
@Pipe({
  name: 'stripHtml',
  standalone: true,
})
export class StripHtmlPipe implements PipeTransform {
  transform(html: string): string {
    return stripHtml(html || '');
  }
}

/**
 * Escape HTML special characters
 * Usage: {{ text | escapeHtml }}
 */
@Pipe({
  name: 'escapeHtml',
  standalone: true,
})
export class EscapeHtmlPipe implements PipeTransform {
  transform(str: string): string {
    return escapeHtml(str || '');
  }
}

/**
 * Count words
 * Usage: {{ text | wordCount }}
 */
@Pipe({
  name: 'wordCount',
  standalone: true,
})
export class WordCountPipe implements PipeTransform {
  transform(str: string): number {
    return wordCount(str || '');
  }
}

/**
 * Reverse string
 * Usage: {{ text | reverse }}
 */
@Pipe({
  name: 'reverse',
  standalone: true,
})
export class ReversePipe implements PipeTransform {
  transform(str: string): string {
    return reverse(str || '');
  }
}

/**
 * Pad string
 * Usage: {{ text | pad:10 }} or {{ text | pad:10:'0':'left' }}
 */
@Pipe({
  name: 'pad',
  standalone: true,
})
export class PadPipe implements PipeTransform {
  transform(str: string, length: number, char = ' ', position: 'left' | 'right' = 'left'): string {
    return pad(str || '', length, char, position);
  }
}

/**
 * All string pipes bundled together for easy import
 * Usage: import { StringPipes } from './pipes/string.pipes';
 */
export const StringPipes = [
  TruncatePipe,
  TruncateMiddlePipe,
  CapitalizePipe,
  TitleCasePipe,
  ToCamelCasePipe,
  ToPascalCasePipe,
  ToKebabCasePipe,
  ToSnakeCasePipe,
  SlugifyPipe,
  StripHtmlPipe,
  EscapeHtmlPipe,
  WordCountPipe,
  ReversePipe,
  PadPipe,
];
