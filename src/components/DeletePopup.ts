/**
 * DeletePopup component - Custom confirmation popup for deleting notes
 * Appears next to the clicked delete button
 */

export class DeletePopup {
  private popup: HTMLElement | null = null;
  private onConfirm: (() => void) | null = null;
  private onCancel: (() => void) | null = null;
  /**
   * Handle clicks outside the popup
   */
  private handleOutsideClick = (e: MouseEvent): void => {
    if (!this.popup) return;

    const target = e.target as HTMLElement;
    if (!this.popup.contains(target)) {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    }
  };

  /**
   * Show the delete confirmation popup
   * @param clickEvent - The click event from the delete button
   * @param onConfirm - Callback when user confirms deletion
   * @param onCancel - Optional callback when user cancels
   */
  show(
    clickEvent: MouseEvent,
    onConfirm: () => void,
    onCancel?: () => void,
  ): void {
    this.close();

    this.onConfirm = onConfirm;
    this.onCancel = onCancel || null;

    // Create popup element
    this.popup = document.createElement('div');
    this.popup.className = 'delete-popup';
    this.popup.innerHTML = `
      <div class="delete-popup-content">
        <p class="delete-popup-message">Delete this note?</p>
        <div class="delete-popup-buttons">
          <button class="delete-popup-btn delete-popup-cancel">Cancel</button>
          <button class="delete-popup-btn delete-popup-confirm">Delete</button>
        </div>
      </div>
    `;

    this.positionPopup(clickEvent);
    document.body.appendChild(this.popup);

    this.setupEventListeners();

    const cancelBtn = this.popup.querySelector('.delete-popup-cancel') as HTMLButtonElement;
    if (cancelBtn) {
      cancelBtn.focus();
    }
  }

  /**
   * Close and remove the popup
   */
  close(): void {
    if (this.popup) {
      this.popup.remove();
      this.popup = null;
    }

    document.removeEventListener('click', this.handleOutsideClick);

    this.onConfirm = null;
    this.onCancel = null;
  }

  /**
   * Cleanup - ensure popup is closed
   */
  destroy(): void {
    this.close();
  }

  /**
   * Position the popup relative to the click event
   */
  private positionPopup(clickEvent: MouseEvent): void {
    if (!this.popup) return;

    const target = clickEvent.target as HTMLElement;
    const rect = target.getBoundingClientRect();

    // Position popup to the left of the delete button
    const x = rect.left - 200;
    const y = rect.top;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalX = x;
    if (x < 10) {
      finalX = rect.right + 10;
    } else if (x + 200 > viewportWidth) {
      finalX = viewportWidth - 210;
    }

    let finalY = y;
    if (y + 100 > viewportHeight) {
      finalY = viewportHeight - 110;
    }

    this.popup.style.left = `${finalX}px`;
    this.popup.style.top = `${finalY}px`;
  }

  /**
   * Set up event listeners for popup buttons
   */
  private setupEventListeners(): void {
    if (!this.popup) return;

    const confirmBtn = this.popup.querySelector('.delete-popup-confirm');
    const cancelBtn = this.popup.querySelector('.delete-popup-cancel');

    confirmBtn?.addEventListener('click', () => {
      if (this.onConfirm) {
        this.onConfirm();
      }
      this.close();
    });

    cancelBtn?.addEventListener('click', () => {
      if (this.onCancel) {
        this.onCancel();
      }
      this.close();
    });

    setTimeout(() => {
      document.addEventListener('click', this.handleOutsideClick);
    }, 100);
  }
}
