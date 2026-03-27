import { computed, Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  title?: string;
  duration?: number;
  timestamp: number;
}

export interface NotificationConfig {
  /** Default duration in ms */
  duration?: number;
  /** Maximum notifications to show */
  maxNotifications?: number;
  /** Position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center' */
  position?: string;
}

/**
 * Notification Service
 * Provides toast notification functionality
 */
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSignal = signal<Notification[]>([]);
  readonly notifications = computed(() => this.notificationsSignal());
  readonly count = computed(() => this.notificationsSignal().length);

  private config: Required<NotificationConfig> = {
    duration: 4000,
    maxNotifications: 5,
    position: 'top-right',
  };

  private idCounter = 0;

  /**
   * Configure notification service
   */
  configure(config: NotificationConfig): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Show success notification
   */
  success(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'success', message, title, duration });
  }

  /**
   * Show error notification
   */
  error(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'error', message, title, duration });
  }

  /**
   * Show warning notification
   */
  warning(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'warning', message, title, duration });
  }

  /**
   * Show info notification
   */
  info(message: string, title?: string, duration?: number): string {
    return this.show({ type: 'info', message, title, duration });
  }

  /**
   * Show notification
   */
  show(options: {
    type: NotificationType;
    message: string;
    title?: string;
    duration?: number;
  }): string {
    const id = `notif-${++this.idCounter}`;
    const notification: Notification = {
      id,
      type: options.type,
      message: options.message,
      title: options.title,
      duration: options.duration ?? this.config.duration,
      timestamp: Date.now(),
    };

    this.notificationsSignal.update((notifications) => {
      const updated = [...notifications, notification];
      // Remove oldest if exceeding max
      if (updated.length > this.config.maxNotifications) {
        updated.shift();
      }
      return updated;
    });

    // Auto-remove after duration
    const duration = notification.duration ?? this.config.duration ?? 0;
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  /**
   * Dismiss notification by ID
   */
  dismiss(id: string): void {
    this.notificationsSignal.update((notifications) => notifications.filter((n) => n.id !== id));
  }

  /**
   * Dismiss all notifications
   */
  dismissAll(): void {
    this.notificationsSignal.set([]);
  }

  /**
   * Get notification by ID
   */
  get(id: string): Notification | undefined {
    return this.notificationsSignal().find((n) => n.id === id);
  }

  /**
   * Get position CSS class
   */
  getPositionClass(): string {
    const posMap: Record<string, string> = {
      'top-right': 'top-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-right': 'bottom-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'top-center': 'top-0 left-1/2 -translate-x-1/2',
      'bottom-center': 'bottom-0 left-1/2 -translate-x-1/2',
    };
    return posMap[this.config.position] || posMap['top-right'];
  }

  /**
   * Get type icon
   */
  getTypeIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };
    return icons[type];
  }

  /**
   * Get type color
   */
  getTypeColor(type: NotificationType): string {
    const colors: Record<NotificationType, string> = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    };
    return colors[type];
  }
}
