import { ChangeDetectorRef, Component, type OnInit } from '@angular/core';
import { ErrorModalService, type ErrorInfo } from '../../services/error-handler.service';

@Component({
  selector: 'app-error-modal',
  standalone: true,
  template: `
    @if (currentError) {
      <div class="error-modal-backdrop" (click)="onBackdropClick($event)">
        <div class="error-modal" role="alertdialog" aria-modal="true">
          <div class="error-modal-header">
            <div class="error-modal-title">
              <span class="error-icon">⚠️</span>
              <span>Application Error</span>
            </div>
            <button
              type="button"
              class="error-modal-close"
              (click)="close()"
              aria-label="Close error dialog"
            >
              ✕
            </button>
          </div>

          <div class="error-modal-body">
            <div class="error-message-section">
              <label class="error-label">Error Message</label>
              <div class="error-message">{{ currentError.message }}</div>
            </div>
          </div>

          <div class="error-modal-footer">
            <button
              type="button"
              class="btn btn-secondary"
              (click)="close()"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './error-modal.component.css',
})
export class ErrorModalComponent implements OnInit {
  private readonly errorModalService: ErrorModalService;
  private readonly cdr: ChangeDetectorRef;

  currentError: ErrorInfo | null = null;

  constructor(errorModalService: ErrorModalService, cdr: ChangeDetectorRef) {
    this.errorModalService = errorModalService;
    this.cdr = cdr;
  }

  ngOnInit(): void {
    this.errorModalService.currentError$.subscribe(error => {
      this.currentError = error;
      this.cdr.detectChanges();
    });
  }

  close(): void {
    this.errorModalService.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
