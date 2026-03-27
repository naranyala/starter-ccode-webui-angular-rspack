// biome-ignore lint/style/useImportType: ElementRef and Renderer2 are used at runtime in constructor
import { Directive, ElementRef, HostListener, input, output, Renderer2 } from '@angular/core';

/**
 * Highlights an element on hover by adding a CSS class
 * Usage: <div appHighlight="yellow">Content</div>
 */
@Directive({
  selector: '[appHighlight]',
  standalone: true,
})
export class HighlightDirective {
  readonly appHighlight = input<string>('lightyellow');
  readonly highlighted = output<boolean>();

  private isHighlighted = false;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2
  ) {}

  @HostListener('mouseenter')
  onMouseEnter(): void {
    this.isHighlighted = true;
    this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', this.appHighlight());
    this.highlighted.emit(true);
  }

  @HostListener('mouseleave')
  onMouseLeave(): void {
    this.isHighlighted = false;
    this.renderer.removeStyle(this.el.nativeElement, 'backgroundColor');
    this.highlighted.emit(false);
  }

  isCurrentlyHighlighted(): boolean {
    return this.isHighlighted;
  }
}

/**
 * Debounces click events to prevent rapid successive clicks
 * Usage: <button appDebounceClick (debouncedClick)="handleClick()">Click me</button>
 */
@Directive({
  selector: '[appDebounceClick]',
  standalone: true,
})
export class DebounceClickDirective {
  readonly debounceTime = input<number>(300);
  readonly debouncedClick = output<MouseEvent>();

  private lastClickTime = 0;
  private timeoutId: any;

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const now = Date.now();
    const timeSinceLastClick = now - this.lastClickTime;

    if (timeSinceLastClick >= this.debounceTime()) {
      this.lastClickTime = now;

      // Clear any pending timeout
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      // Emit immediately for the first click
      this.debouncedClick.emit(event);
    } else {
      // Debounce subsequent clicks
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }

      this.timeoutId = setTimeout(() => {
        this.lastClickTime = Date.now();
        this.debouncedClick.emit(event);
      }, this.debounceTime() - timeSinceLastClick);
    }
  }
}

/**
 * Tracks click count on an element
 * Usage: <button appClickCounter (clickCount)="onCount($event)">Click me</button>
 */
@Directive({
  selector: '[appClickCounter]',
  standalone: true,
})
export class ClickCounterDirective {
  readonly clickCount = output<number>();

  private count = 0;

  @HostListener('click')
  onClick(): void {
    this.count++;
    this.clickCount.emit(this.count);
  }

  getCount(): number {
    return this.count;
  }

  reset(): void {
    this.count = 0;
    this.clickCount.emit(0);
  }
}
