import { Pipe, type PipeTransform } from '@angular/core';

/**
 * Formats a number with thousand separators
 * Usage: {{ value | numberFormat }}
 * Example: {{ 1234567 | numberFormat }} -> '1,234,567'
 */
@Pipe({
  name: 'numberFormat',
  standalone: true,
})
export class NumberFormatPipe implements PipeTransform {
  transform(value: number | string, locale: string = 'en-US'): string {
    if (value == null || value === '') {
      return '';
    }

    const num = typeof value === 'string' ? parseFloat(value) : value;

    if (Number.isNaN(num)) {
      return String(value);
    }

    return num.toLocaleString(locale);
  }
}

/**
 * Truncates text to a specified length and adds ellipsis
 * Usage: {{ text | truncate: 50 }}
 */
@Pipe({
  name: 'truncate',
  standalone: true,
})
export class TruncatePipe implements PipeTransform {
  transform(
    value: string,
    limit: number = 50,
    completeWords: boolean = false,
    ellipsis: string = '...'
  ): string {
    if (!value) {
      return '';
    }

    if (value.length <= limit) {
      return value;
    }

    if (completeWords) {
      limit = value.substring(0, limit).lastIndexOf(' ');
    }

    return `${value.substring(0, limit)}${ellipsis}`;
  }
}

/**
 * Converts string to title case
 * Usage: {{ 'hello world' | titleCase }} -> 'Hello World'
 */
@Pipe({
  name: 'titleCase',
  standalone: true,
})
export class TitleCasePipe implements PipeTransform {
  transform(value: string): string {
    if (!value) {
      return '';
    }

    return value
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

/**
 * Filters an array by a search term
 * Usage: {{ items | filterBy: searchTerm : 'name' }}
 */
@Pipe({
  name: 'filterBy',
  standalone: true,
  pure: false, // Non-pure pipe to detect array changes
})
export class FilterByPipe implements PipeTransform {
  transform<T extends Record<string, any>>(
    items: T[],
    searchTerm: string,
    property?: keyof T
  ): T[] {
    if (!items || !searchTerm) {
      return items;
    }

    const term = searchTerm.toLowerCase();

    return items.filter(item => {
      if (property) {
        return String(item[property]).toLowerCase().includes(term);
      }

      // Search all properties
      return Object.values(item).some(value => String(value).toLowerCase().includes(term));
    });
  }
}
