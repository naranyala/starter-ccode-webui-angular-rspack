/**
 * Shared UI Components Library - Minimal Version
 * 
 * Reusable UI components for consistent design.
 * Only includes essential, working components.
 */

import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, LucideIconNode } from 'lucide-angular';

/* ============================================================================
 * Button Component
 * ============================================================================ */

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <button
      type="button"
      class="app-button"
      [class]="variantClasses"
      [class.button-disabled]="disabled"
      [disabled]="disabled"
      (click)="onClick($event)">
      @if (icon && !loading) {
        <lucide-angular [img]="icon" [size]="iconSize"></lucide-angular>
      }
      @if (loading) {
        <span class="spinner"></span>
      }
      <span class="button-label"><ng-content></ng-content></span>
    </button>
  `,
  styles: [`
    .app-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .app-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    .variant-primary {
      background: linear-gradient(135deg, #06b6d4, #3b82f6);
      color: #fff;
    }
    .variant-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
    }
    .variant-secondary {
      background: rgba(148, 163, 184, 0.1);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.2);
    }
    .variant-secondary:hover:not(:disabled) {
      background: rgba(148, 163, 184, 0.2);
      color: #fff;
    }
    .variant-danger {
      background: linear-gradient(135deg, #ef4444, #dc2626);
      color: #fff;
    }
    .variant-danger:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
    }
    .variant-ghost {
      background: transparent;
      color: #94a3b8;
    }
    .variant-ghost:hover:not(:disabled) {
      background: rgba(148, 163, 184, 0.1);
      color: #fff;
    }
    .variant-outline {
      background: transparent;
      color: #06b6d4;
      border: 1px solid #06b6d4;
    }
    .variant-outline:hover:not(:disabled) {
      background: rgba(6, 182, 212, 0.1);
    }
    .size-sm { padding: 6px 12px; font-size: 13px; }
    .size-md { padding: 10px 16px; font-size: 14px; }
    .size-lg { padding: 14px 24px; font-size: 16px; }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() icon: readonly LucideIconNode[] | null = null;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  get variantClasses(): string {
    return `variant-${this.variant} size-${this.size}`;
  }

  get iconSize(): number {
    switch (this.size) {
      case 'sm': return 14;
      case 'lg': return 20;
      default: return 16;
    }
  }

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}

/* ============================================================================
 * Exports
 * ============================================================================ */

export const UI_COMPONENTS = [
  ButtonComponent
];
