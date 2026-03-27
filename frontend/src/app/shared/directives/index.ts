import {
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  inject,
  Output,
} from '@angular/core';

/**
 * Click Outside Directive
 * Emits event when clicking outside the element
 * Usage: <div (clickOutside)="onOutsideClick()">
 */
@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<MouseEvent>();

  private elementRef = inject(ElementRef);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const targetElement = event.target as HTMLElement;
    if (targetElement && !this.elementRef.nativeElement.contains(targetElement)) {
      this.clickOutside.emit(event);
    }
  }
}

/**
 * Long Press Directive
 * Emits event when element is pressed for specified duration
 * Usage: <button (longPress)="onLongPress()" [longPressDuration]="500">
 */
@Directive({
  selector: '[longPress]',
  standalone: true,
})
export class LongPressDirective {
  @Output() longPress = new EventEmitter<void>();
  @Input() longPressDuration = 500;

  private elementRef = inject(ElementRef);
  private timeoutId: any = null;
  private isPressed = false;

  @HostListener('mousedown')
  onMouseDown(): void {
    this.isPressed = true;
    this.timeoutId = setTimeout(() => {
      if (this.isPressed) {
        this.longPress.emit();
      }
    }, this.longPressDuration);
  }

  @HostListener('mouseup')
  onMouseUp(): void {
    this.isPressed = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isPressed = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this.isPressed = true;
    this.timeoutId = setTimeout(() => {
      if (this.isPressed) {
        this.longPress.emit();
      }
    }, this.longPressDuration);
  }

  @HostListener('touchend')
  onTouchEnd(): void {
    this.isPressed = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

/**
 * Copy to Clipboard Directive
 * Copies text to clipboard on click
 * Usage: <button [copyToClipboard]="'text to copy">Copy</button>
 */
@Directive({
  selector: '[copyToClipboard]',
  standalone: true,
})
export class CopyToClipboardDirective {
  @Input() copyToClipboard = '';
  @Input() copySuccessMessage = 'Copied!';
  @Output() copied = new EventEmitter<boolean>();

  private elementRef = inject(ElementRef);

  @HostListener('click')
  onClick(): void {
    if (!this.copyToClipboard) return;

    navigator.clipboard
      .writeText(this.copyToClipboard)
      .then(() => {
        this.copied.emit(true);
        this.showToast(this.copySuccessMessage);
      })
      .catch(() => {
        this.copied.emit(false);
        // Fallback
        this.copyFallback(this.copyToClipboard);
      });
  }

  private copyFallback(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      this.copied.emit(true);
      this.showToast(this.copySuccessMessage);
    } catch {
      this.copied.emit(false);
    }
    document.body.removeChild(textArea);
  }

  private showToast(message: string): void {
    let toast = document.getElementById('copy-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'copy-toast';
      toast.style.cssText = `
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
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';

    setTimeout(() => {
      toast!.style.opacity = '0';
    }, 2000);
  }
}

/**
 * Auto Focus Directive
 * Focuses element on init
 * Usage: <input autoFocus>
 */
@Directive({
  selector: '[autoFocus]',
  standalone: true,
})
export class AutoFocusDirective {
  private elementRef = inject(ElementRef);

  constructor() {
    setTimeout(() => {
      this.elementRef.nativeElement.focus();
    });
  }
}

/**
 * Debounce Input Directive
 * Adds debounce to input events
 * Usage: <input (inputDebounce)="onSearch($event)" [debounceTime]="300">
 */
@Directive({
  selector: '[inputDebounce]',
  standalone: true,
})
export class InputDebounceDirective {
  @Output() inputDebounce = new EventEmitter<Event>();
  @Input() debounceTime = 300;

  private elementRef = inject(ElementRef);
  private timeoutId: any = null;

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.inputDebounce.emit(event);
    }, this.debounceTime);
  }

  ngOnDestroy(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

/**
 * Resize Observer Directive
 * Emits event when element is resized
 * Usage: <div (resized)="onResize($event)" resizeObserver>
 */
@Directive({
  selector: '[resizeObserver]',
  standalone: true,
})
export class ResizeObserverDirective {
  @Output() resized = new EventEmitter<DOMRectReadOnly>();
  @Input() resizeDebounce = 100;

  private elementRef = inject(ElementRef);
  private resizeObserver: ResizeObserver | null = null;
  private timeoutId: any = null;

  constructor() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (this.timeoutId) {
            clearTimeout(this.timeoutId);
          }
          this.timeoutId = setTimeout(() => {
            this.resized.emit(entry.contentRect);
          }, this.resizeDebounce);
        }
      });

      this.resizeObserver.observe(this.elementRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }
}

/**
 * Intersection Observer Directive
 * Emits event when element enters/exits viewport
 * Usage: <div (intersected)="onIntersect($event)" intersectionObserver>
 */
@Directive({
  selector: '[intersectionObserver]',
  standalone: true,
})
export class IntersectionObserverDirective {
  @Output() intersected = new EventEmitter<boolean>();
  @Input() intersectionThreshold = 0;
  @Input() intersectionRootMargin = '0px';

  private elementRef = inject(ElementRef);
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            this.intersected.emit(entry.isIntersecting);
          }
        },
        {
          threshold: this.intersectionThreshold,
          rootMargin: this.intersectionRootMargin,
        }
      );

      this.intersectionObserver.observe(this.elementRef.nativeElement);
    }
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

/**
 * Lazy Load Image Directive
 * Lazy loads images when they enter viewport
 * Usage: <img [lazySrc]="imageUrl" alt="...">
 */
@Directive({
  selector: 'img[lazySrc]',
  standalone: true,
})
export class LazyLoadImageDirective {
  @Input() lazySrc = '';
  @Input() loadingClass = 'loading';
  @Input() loadedClass = 'loaded';
  @Input() errorClass = 'error';

  private elementRef = inject(ElementRef);
  private intersectionObserver: IntersectionObserver | null = null;

  constructor() {
    const img = this.elementRef.nativeElement as HTMLImageElement;
    img.classList.add(this.loadingClass);

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            this.loadImage(img);
            this.intersectionObserver?.disconnect();
          }
        }
      });

      this.intersectionObserver.observe(img);
    } else {
      // Fallback for browsers without IntersectionObserver
      this.loadImage(img);
    }
  }

  private loadImage(img: HTMLImageElement): void {
    img.src = this.lazySrc;
    img.onload = () => {
      img.classList.remove(this.loadingClass);
      img.classList.add(this.loadedClass);
    };
    img.onerror = () => {
      img.classList.remove(this.loadingClass);
      img.classList.add(this.errorClass);
    };
  }

  ngOnDestroy(): void {
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
  }
}

/**
 * All directives bundled together for easy import
 * Usage: import { AllDirectives } from './directives';
 */
export const AllDirectives = [
  ClickOutsideDirective,
  LongPressDirective,
  CopyToClipboardDirective,
  AutoFocusDirective,
  InputDebounceDirective,
  ResizeObserverDirective,
  IntersectionObserverDirective,
  LazyLoadImageDirective,
];
