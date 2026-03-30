/**
 * Shared UI Components Library
 * 
 * Reusable UI components for consistent design across the application.
 * 
 * Components:
 * - AppButton: Styled button with variants
 * - AppInput: Form input with label and validation
 * - AppCard: Content card container
 * - AppModal: Modal dialog
 * - AppTable: Data table with sorting
 * - AppPagination: Pagination controls
 * - AppStatCard: Statistics display card
 * - AppEmptyState: Empty state placeholder
 * - AppLoading: Loading indicator
 */

import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';

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
      [class]="variantClasses()"
      [class.button-disabled]="disabled()"
      [disabled]="disabled()"
      (click)="onClick($event)">
      @if (icon() && !loading()) {
        <lucide-angular [img]="icon()" [size]="iconSize()"></lucide-angular>
      }
      @if (loading()) {
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
      white-space: nowrap;
    }

    .app-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-disabled {
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

    /* Variants */
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

    /* Sizes */
    .size-sm { padding: 6px 12px; font-size: 13px; }
    .size-md { padding: 10px 16px; font-size: 14px; }
    .size-lg { padding: 14px 24px; font-size: 16px; }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() icon: unknown = null;
  @Input() disabled = false;
  @Input() loading = false;
  @Output() clicked = new EventEmitter<MouseEvent>();

  readonly variantClasses = signal(() => {
    const sizeClass = `size-${this.size}`;
    const variantClass = `variant-${this.variant}`;
    return `${variantClass} ${sizeClass}`;
  });

  readonly iconSize = signal(() => {
    switch (this.size) {
      case 'sm': return 14;
      case 'lg': return 20;
      default: return 16;
    }
  });

  onClick(event: MouseEvent): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit(event);
    }
  }
}

/* ============================================================================
 * Input Component
 * ============================================================================ */

export type InputType = 'text' | 'email' | 'number' | 'password' | 'tel' | 'url' | 'search';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="app-input-wrapper">
      @if (label()) {
        <label class="input-label" [for]="inputId()">
          {{ label() }}
          @if (required()) {
            <span class="required">*</span>
          }
        </label>
      }
      <div class="input-container" [class.focused]="focused()" [class.error]="error()">
        @if (iconLeft()) {
          <lucide-angular [img]="iconLeft()" size="16" class="icon-left"></lucide-angular>
        }
        @if (type() === 'search' && model()) {
          <button type="button" class="clear-btn" (click)="clear()">
            <lucide-angular [img]="closeIcon()" size="14"></lucide-angular>
          </button>
        }
        <input
          [id]="inputId()"
          [type]="type()"
          [value]="model()"
          (valueChange)="modelChange.emit($event)"
          (focus)="focused.set(true)"
          (blur)="focused.set(false)"
          [placeholder]="placeholder()"
          [required]="required()"
          [disabled]="disabled()"
          [readonly]="readonly()"
          class="input-field"
        />
        @if (iconRight()) {
          <lucide-angular [img]="iconRight()" size="16" class="icon-right"></lucide-angular>
        }
      </div>
      @if (error()) {
        <span class="error-message">{{ error() }}</span>
      }
      @if (hint()) {
        <span class="hint-message">{{ hint() }}</span>
      }
    </div>
  `,
  styles: [`
    .app-input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .input-label {
      font-size: 14px;
      font-weight: 600;
      color: #e2e8f0;
    }

    .required {
      color: #ef4444;
      margin-left: 4px;
    }

    .input-container {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 8px;
      transition: all 0.2s;
    }

    .input-container.focused {
      border-color: #06b6d4;
      box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
    }

    .input-container.error {
      border-color: #ef4444;
    }

    .input-field {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #fff;
      font-size: 14px;
    }

    .input-field::placeholder {
      color: #64748b;
    }

    .input-field:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .icon-left, .icon-right {
      color: #64748b;
      flex-shrink: 0;
    }

    .clear-btn {
      background: none;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .clear-btn:hover {
      color: #fff;
    }

    .error-message {
      font-size: 12px;
      color: #ef4444;
    }

    .hint-message {
      font-size: 12px;
      color: #64748b;
    }
  `]
})
export class InputComponent {
  @Input() type: InputType = 'text';
  @Input() label = '';
  @Input() model = '';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() readonly = false;
  @Input() error = '';
  @Input() hint = '';
  @Input() iconLeft: unknown = null;
  @Input() iconRight: unknown = null;
  @Input() inputId = '';
  @Output() modelChange = new EventEmitter<string>();

  readonly focused = signal(false);
  readonly closeIcon = signal(null); // Import X icon

  clear(): void {
    this.modelChange.emit('');
  }
}

/* ============================================================================
 * Card Component
 * ============================================================================ */

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="app-card" [class.clickable]="clickable()" (click)="onClick()">
      @if (header()) {
        <div class="card-header">
          <h3 class="card-title">{{ header() }}</h3>
          <ng-content select="[card-actions]"></ng-content>
        </div>
      }
      <div class="card-body">
        <ng-content></ng-content>
      </div>
      @if (footer()) {
        <div class="card-footer">
          {{ footer() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .app-card {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      overflow: hidden;
    }

    .app-card.clickable {
      cursor: pointer;
      transition: all 0.2s;
    }

    .app-card.clickable:hover {
      border-color: rgba(148, 163, 184, 0.3);
      transform: translateY(-2px);
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .card-title {
      font-size: 16px;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .card-body {
      padding: 20px;
    }

    .card-footer {
      padding: 12px 20px;
      background: rgba(15, 23, 42, 0.3);
      font-size: 13px;
      color: #94a3b8;
    }
  `]
})
export class CardComponent {
  @Input() header = '';
  @Input() footer = '';
  @Input() clickable = false;
  @Output() cardClick = new EventEmitter<void>();

  onClick(): void {
    if (this.clickable) {
      this.cardClick.emit();
    }
  }
}

/* ============================================================================
 * Stat Card Component
 * ============================================================================ */

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="stat-card" [class]="variantClass()">
      <div class="stat-icon" [style.background]="iconBackground()">
        @if (icon()) {
          <lucide-angular [img]="icon()" size="28"></lucide-angular>
        } @else {
          <span class="icon-emoji">{{ emoji() }}</span>
        }
      </div>
      <div class="stat-content">
        <span class="stat-value">{{ formatValue(value()) }}</span>
        <span class="stat-label">{{ label() }}</span>
        @if (trend()) {
          <span class="stat-trend" [class.trend-up]="trend() > 0" [class.trend-down]="trend() < 0">
            {{ trend() > 0 ? '↑' : '↓' }} {{ Math.abs(trend()) }}%
          </span>
        }
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(148, 163, 184, 0.1);
      border-radius: 12px;
      transition: all 0.3s;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .stat-icon {
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      color: #fff;
    }

    .icon-emoji {
      font-size: 28px;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #fff;
    }

    .stat-label {
      font-size: 13px;
      color: #94a3b8;
    }

    .stat-trend {
      font-size: 12px;
      font-weight: 600;
    }

    .trend-up { color: #10b981; }
    .trend-down { color: #ef4444; }
  `]
})
export class StatCardComponent {
  @Input() value: number | string = 0;
  @Input() label = '';
  @Input() emoji = '📊';
  @Input() icon: unknown = null;
  @Input() trend: number | null = null;
  @Input() variant: 'primary' | 'success' | 'warning' | 'info' = 'primary';

  readonly Math = Math;

  readonly variantClass = signal(() => `variant-${this.variant}`);
  
  readonly iconBackground = signal(() => {
    const colors = {
      primary: 'rgba(59, 130, 246, 0.2)',
      success: 'rgba(16, 185, 129, 0.2)',
      warning: 'rgba(245, 158, 11, 0.2)',
      info: 'rgba(6, 182, 212, 0.2)'
    };
    return colors[this.variant];
  });

  formatValue(value: number | string): string {
    if (typeof value === 'number') {
      if (value >= 1000000) return (value / 1000000).toFixed(1) + 'M';
      if (value >= 1000) return (value / 1000).toFixed(1) + 'K';
      return value.toLocaleString();
    }
    return value;
  }
}

/* ============================================================================
 * Modal Component
 * ============================================================================ */

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    @if (open()) {
      <div class="modal-overlay" (click)="onOverlayClick($event)">
        <div class="modal-content" [style.maxWidth]="maxWidth()" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2 class="modal-title">{{ title() }}</h2>
            <button type="button" class="modal-close" (click)="close()">
              <lucide-angular [img]="closeIcon()" size="20"></lucide-angular>
            </button>
          </div>
          <div class="modal-body">
            <ng-content></ng-content>
          </div>
          @if (showFooter()) {
            <div class="modal-footer">
              <ng-content select="[modal-footer]"></ng-content>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: #1e293b;
      border: 1px solid rgba(148, 163, 184, 0.2);
      border-radius: 16px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    }

    .modal-title {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .modal-close {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: #94a3b8;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .modal-close:hover {
      background: rgba(148, 163, 184, 0.1);
      color: #fff;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      padding: 16px 24px;
      border-top: 1px solid rgba(148, 163, 184, 0.1);
    }
  `]
})
export class ModalComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() maxWidth = '480px';
  @Input() showFooter = true;
  @Output() closed = new EventEmitter<void>();

  readonly closeIcon = signal(null); // Import X icon

  close(): void {
    this.closed.emit();
  }

  onOverlayClick(event: MouseEvent): void {
    this.close();
  }
}

/* ============================================================================
 * Empty State Component
 * ============================================================================ */

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, ButtonComponent],
  template: `
    <div class="empty-state">
      <div class="empty-icon">
        @if (icon()) {
          <lucide-angular [img]="icon()" size="64"></lucide-angular>
        } @else {
          <span class="emoji">{{ emoji() }}</span>
        }
      </div>
      <h3 class="empty-title">{{ title() }}</h3>
      <p class="empty-description">{{ description() }}</p>
      @if (actionLabel()) {
        <app-button [variant]="actionVariant()" (clicked)="action.emit()">
          {{ actionLabel() }}
        </app-button>
      }
    </div>
  `,
  styles: [`
    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      margin-bottom: 20px;
    }

    .emoji {
      font-size: 64px;
    }

    .empty-title {
      font-size: 20px;
      font-weight: 600;
      color: #fff;
      margin: 0 0 8px;
    }

    .empty-description {
      font-size: 14px;
      color: #94a3b8;
      margin: 0 0 24px;
    }
  `]
})
export class EmptyStateComponent {
  @Input() emoji = '📭';
  @Input() icon: unknown = null;
  @Input() title = 'No Data';
  @Input() description = '';
  @Input() actionLabel = '';
  @Input() actionVariant: ButtonVariant = 'primary';
  @Output() action = new EventEmitter<void>();
}

/* ============================================================================
 * Loading Component
 * ============================================================================ */

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container" [class.fullscreen]="fullscreen()">
      <div class="spinner"></div>
      @if (message()) {
        <span class="loading-message">{{ message() }}</span>
      }
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      padding: 40px;
    }

    .loading-container.fullscreen {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(15, 23, 42, 0.8);
      z-index: 999;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(148, 163, 184, 0.2);
      border-top-color: #06b6d4;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-message {
      font-size: 14px;
      color: #94a3b8;
    }
  `]
})
export class LoadingComponent {
  @Input() message = '';
  @Input() fullscreen = false;
}

/* ============================================================================
 * Exports
 * ============================================================================ */

export const UI_COMPONENTS = [
  ButtonComponent,
  InputComponent,
  CardComponent,
  StatCardComponent,
  ModalComponent,
  EmptyStateComponent,
  LoadingComponent
];
