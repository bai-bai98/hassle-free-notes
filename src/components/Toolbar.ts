/**
 * Toolbar component - Text formatting controls
 * Supports bold, italic, and bullet lists
 */

export class Toolbar {
  private toolbarElement: HTMLElement;
  private editorElement: HTMLElement;

  constructor(toolbarElement: HTMLElement, editorElement: HTMLElement) {
    this.toolbarElement = toolbarElement;
    this.editorElement = editorElement;

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Handle toolbar button clicks
    this.toolbarElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const button = target.closest('.toolbar-btn') as HTMLElement;

      if (button) {
        e.preventDefault();
        const command = button.dataset.command;
        if (command) {
          this.executeCommand(command);
        }
      }
    });

    // Update button states on selection change
    document.addEventListener('selectionchange', () => {
      if (document.activeElement === this.editorElement) {
        this.updateButtonStates();
      }
    });

    // Handle keyboard shortcuts
    this.editorElement.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  /**
   * Execute formatting command
   */
  private executeCommand(command: string): void {
    // Ensure editor has focus
    this.editorElement.focus();

    //    // Modern replacement for execCommand for 'bold' and 'italic'
    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);
      // Ensure selection is within the editor
      if (!this.editorElement.contains(range.commonAncestorContainer)) return;

      if (command === 'bold' || command === 'italic') {
        const tag = command === 'bold' ? 'b' : 'i';
        // If selection is collapsed, do nothing
        if (selection.isCollapsed) return;
        // Create the formatting element
        const wrapper = document.createElement(tag);
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);
        // Move selection to after the inserted node
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(wrapper);
        newRange.collapse(true);
        selection.addRange(newRange);
      } else {
        // For unsupported commands, log a warning
        console.warn(`Command "${command}" is not supported by the custom Toolbar implementation.`);
      }
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
    }

    // Update button states
    this.updateButtonStates();
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          this.executeCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          this.executeCommand('italic');
          break;
      }
    }
  }

  /**
   * Custom check if a formatting command is active for the current selection
   */
  private isCommandActive(command: string): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;
    let node = selection.anchorNode;
    if (!node) return false;
    // If the node is a text node, get its parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }
    if (!node) return false;

    switch (command) {
      case 'bold':
        return this.isNodeInTag(node, ['B', 'STRONG']);
      case 'italic':
        return this.isNodeInTag(node, ['I', 'EM']);
      case 'insertUnorderedList':
        return this.isNodeInTag(node, ['UL']);
      case 'insertOrderedList':
        return this.isNodeInTag(node, ['OL']);
      default:
        return false;
    }
  }

  /**
   * Helper to check if a node is inside any of the given tag names
   */
  private isNodeInTag(node: Node, tagNames: string[]): boolean {
    let current: Node | null = node;
    while (current && current !== this.editorElement) {
      if (
        current instanceof HTMLElement &&
        tagNames.includes(current.tagName)
      ) {
        return true;
      }
      current = current.parentNode;
    }
    return false;
  }

  /**
   * Update button states based on current selection
   */
  private updateButtonStates(): void {
    const buttons = this.toolbarElement.querySelectorAll('.toolbar-btn');

    buttons.forEach(button => {
      const command = (button as HTMLElement).dataset.command;
      if (!command) return;

      try {
        const isActive = this.isCommandActive(command);
        button.classList.toggle('active', isActive);
      } catch (error) {
        // Fallback: remove active state if error
        button.classList.remove('active');
      }
    });
  }
}
