import { Injectable, inject } from '@angular/core';

export interface CopyOptions {
  /** Show notification on success */
  notify?: boolean;
  /** Notification duration in ms */
  notifyDuration?: number;
  /** Custom success message */
  successMessage?: string;
  /** Custom error message */
  errorMessage?: string;
}

export interface CopyResult {
  success: boolean;
  text?: string;
  error?: string;
}

/**
 * Clipboard Service
 * Provides copy/paste functionality with fallbacks
 */
@Injectable({
  providedIn: 'root',
})
export class ClipboardService {
  private isSupported = typeof navigator !== 'undefined' && 'clipboard' in navigator;

  /**
   * Check if clipboard API is supported
   */
  isClipboardSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Copy text to clipboard
   * Uses modern Clipboard API with fallback to execCommand
   */
  async copy(text: string, options?: CopyOptions): Promise<CopyResult> {
    const opts: Required<CopyOptions> = {
      notify: true,
      notifyDuration: 2000,
      successMessage: 'Copied to clipboard!',
      errorMessage: 'Failed to copy',
      ...options,
    };

    try {
      if (this.isSupported && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        if (opts.notify) {
          this.showNotification(opts.successMessage, opts.notifyDuration);
        }
        return { success: true, text };
      } else {
        // Fallback to execCommand
        const fallbackSuccess = this.copyFallback(text);
        if (fallbackSuccess) {
          if (opts.notify) {
            this.showNotification(opts.successMessage, opts.notifyDuration);
          }
          return { success: true, text };
        } else {
          throw new Error('Fallback failed');
        }
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (opts.notify) {
        this.showNotification(`${opts.errorMessage}: ${errorMsg}`, opts.notifyDuration);
      }
      return { success: false, error: errorMsg };
    }
  }

  /**
   * Copy JSON object to clipboard (formatted)
   */
  async copyJson(obj: unknown, indent = 2): Promise<CopyResult> {
    try {
      const json = JSON.stringify(obj, null, indent);
      return await this.copy(json);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to stringify object',
      };
    }
  }

  /**
   * Copy code with syntax highlighting hint
   */
  async copyCode(code: string, language = 'text'): Promise<CopyResult> {
    const formatted = language === 'json' ? JSON.stringify(JSON.parse(code), null, 2) : code;
    return await this.copy(formatted);
  }

  /**
   * Read text from clipboard
   */
  async read(): Promise<string | null> {
    try {
      if (this.isSupported && navigator.clipboard) {
        return await navigator.clipboard.readText();
      }
      return null;
    } catch (error) {
      console.error('[ClipboardService] Failed to read:', error);
      return null;
    }
  }

  /**
   * Fallback copy using execCommand (for older browsers)
   */
  private copyFallback(text: string): boolean {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch {
      return false;
    }
  }

  /**
   * Show toast notification
   */
  private showNotification(message: string, duration: number): void {
    // Create or get existing toast container
    let container = document.getElementById('clipboard-toast');
    if (!container) {
      container = document.createElement('div');
      container.id = 'clipboard-toast';
      container.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #30363d;
        color: #e6edf3;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.2s;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        border: 1px solid #30363d;
      `;
      document.body.appendChild(container);
    }

    // Set message and show
    container.textContent = message;
    container.style.opacity = '1';

    // Hide after duration
    setTimeout(() => {
      container!.style.opacity = '0';
    }, duration);
  }
}

/**
 * Directive for easy copy functionality
 * Usage: <button [copyToClipboard]="'text to copy">Copy</button>
 */
export function createCopyDirective() {
  return {
    copyToClipboard: (text: string) => {
      const clipboard = inject(ClipboardService);
      return clipboard.copy(text, { notify: true });
    },
  };
}
