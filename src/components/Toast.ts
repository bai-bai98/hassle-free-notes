/**
 * Toast notification system
 * Shows temporary messages to the user
 */

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class Toast {
  private container: HTMLDivElement;
  private activeToasts: Set<HTMLDivElement> = new Set();

  constructor() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification
   */
  show(options: ToastOptions): void {
    const {
      message,
      type = 'info',
      duration = 3000,
      action
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

    // Add action button if provided
    if (action) {
      const actionBtn = document.createElement('button');
      actionBtn.className = 'toast-action';
      actionBtn.textContent = action.label;
      actionBtn.addEventListener('click', () => {
        action.onClick();
        this.hide(toast);
      });
      toast.appendChild(actionBtn);
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.hide(toast));
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);
    this.activeToasts.add(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    // Auto-hide after duration
    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }
  }

  /**
   * Hide a toast notification
   */
  private hide(toast: HTMLDivElement): void {
    if (!this.activeToasts.has(toast)) return;

    toast.classList.remove('toast-show');
    toast.classList.add('toast-hide');

    setTimeout(() => {
      if (toast.parentNode) {
        toast.remove();
      }
      this.activeToasts.delete(toast);
    }, 300); // Match CSS animation duration
  }

  /**
   * Show success toast
   */
  success(message: string, duration?: number): void {
    this.show({ message, type: 'success', duration });
  }

  /**
   * Show error toast
   */
  error(message: string, duration?: number): void {
    this.show({ message, type: 'error', duration });
  }

  /**
   * Show warning toast
   */
  warning(message: string, duration?: number): void {
    this.show({ message, type: 'warning', duration });
  }

  /**
   * Show info toast
   */
  info(message: string, duration?: number): void {
    this.show({ message, type: 'info', duration });
  }

  /**
   * Clear all toasts
   */
  clearAll(): void {
    this.activeToasts.forEach(toast => this.hide(toast));
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.clearAll();
    this.container.remove();
  }
}

// Global toast instance
export const toast = new Toast();
