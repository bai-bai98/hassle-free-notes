/**
 * Toast notification system
 * Shows temporary messages to the user
 */
import {ToastOptions} from '../types';


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
      action,
    } = options;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const messageEl = document.createElement('span');
    messageEl.className = 'toast-message';
    messageEl.textContent = message;
    toast.appendChild(messageEl);

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

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.hide(toast));
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);
    this.activeToasts.add(toast);

    requestAnimationFrame(() => {
      toast.classList.add('toast-show');
    });

    if (duration > 0) {
      setTimeout(() => this.hide(toast), duration);
    }
  }

  /**
   * Show success toast
   */
  success(message: string, duration?: number): void {
    this.show({message, type: 'success', duration});
  }

  /**
   * Show error toast
   */
  error(message: string, duration?: number): void {
    this.show({message, type: 'error', duration});
  }

  /**
   * Show warning toast
   */
  warning(message: string, duration?: number): void {
    this.show({message, type: 'warning', duration});
  }

  /**
   * Show info toast
   */
  info(message: string, duration?: number): void {
    this.show({message, type: 'info', duration});
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
    }, 300);
  }
}

export const toast = new Toast();
