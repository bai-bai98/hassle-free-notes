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

    try {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;
      const range = selection.getRangeAt(0);

      // Ensure selection is within the editor
      if (!this.editorElement.contains(range.commonAncestorContainer)) return;

      // Map commands to HTML tags
      const commandTagMap: { [key: string]: string } = {
        'bold': 'b',
        'italic': 'i',
        'underline': 'u',
        'strikethrough': 's',
        'code': 'code'
      };

      const tag = commandTagMap[command];

      if (tag) {
        this.toggleInlineFormat(tag, selection, range);
      } else if (command === 'insertUnorderedList' || command === 'insertOrderedList') {
        this.toggleList(command === 'insertUnorderedList' ? 'ul' : 'ol', selection, range);
      } else {
        console.warn(`Command "${command}" is not supported.`);
      }
    } catch (error) {
      console.error(`Error executing command ${command}:`, error);
    }

    // Update button states
    this.updateButtonStates();
  }

  /**
   * Toggle inline formatting (bold, italic, underline, strikethrough, code)
   */
  private toggleInlineFormat(tag: string, selection: Selection, range: Range): void {
    // Map tag to all possible variants
    const tagVariants: { [key: string]: string[] } = {
      'b': ['B', 'STRONG'],
      'i': ['I', 'EM'],
      'u': ['U'],
      's': ['S', 'STRIKE', 'DEL'],
      'code': ['CODE']
    };

    const tagNames = tagVariants[tag] || [tag.toUpperCase()];
    const isActive = this.isFormatActiveInRange(range, tagNames);

    if (selection.isCollapsed) {
      // No selection - check if cursor is already inside a formatted tag
      if (isActive) {
        // Cursor is inside formatted tag - close the tag and move cursor outside
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }

        // Find the format tag
        let formatNode: HTMLElement | null = null;
        while (node && node !== this.editorElement) {
          if (node instanceof HTMLElement && tagNames.includes(node.tagName)) {
            formatNode = node;
            break;
          }
          node = node.parentNode;
        }

        if (formatNode) {
          // Insert a non-breaking space after the format tag and move cursor there
          const nbsp = document.createTextNode('\u00A0'); // &nbsp;

          // Insert the nbsp after the format node
          if (formatNode.nextSibling) {
            formatNode.parentNode!.insertBefore(nbsp, formatNode.nextSibling);
          } else {
            formatNode.parentNode!.appendChild(nbsp);
          }

          // Move cursor after the nbsp
          const newRange = document.createRange();
          newRange.setStartAfter(nbsp);
          newRange.collapse(true);
          selection.removeAllRanges();
          selection.addRange(newRange);
        }
      } else {
        // Cursor not in formatted tag - insert empty tag for typing
        const marker = document.createElement(tag);
        marker.appendChild(document.createTextNode('\u200B')); // Zero-width space placeholder
        range.insertNode(marker);

        // Move cursor inside the tag
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.selectNodeContents(marker);
        newRange.collapse(false);
        selection.addRange(newRange);
      }
    } else {
      // Has selection
      if (isActive) {
        // Remove formatting from selected text by closing tag before selection
        // and opening new tag after selection (if needed)
        let node: Node | null = range.commonAncestorContainer;
        if (node.nodeType === Node.TEXT_NODE) {
          node = node.parentElement;
        }

        // Find the format tag
        let formatNode: HTMLElement | null = null;
        let formatTag = tagNames[0];
        while (node && node !== this.editorElement) {
          if (node instanceof HTMLElement && tagNames.includes(node.tagName)) {
            formatNode = node;
            formatTag = node.tagName;
            break;
          }
          node = node.parentNode;
        }

        if (formatNode) {
          // Save range boundaries before extraction
          const startContainer = range.startContainer;
          const startOffset = range.startOffset;
          const endContainer = range.endContainer;
          const endOffset = range.endOffset;

          // Extract the selected content (will be unformatted)
          const selectedContent = range.extractContents();

          // Clone the format node to work with its structure
          const beforeRange = document.createRange();
          beforeRange.setStart(formatNode, 0);
          beforeRange.setEnd(startContainer, startOffset);
          const beforeContent = beforeRange.cloneContents();

          const afterRange = document.createRange();
          afterRange.setStart(endContainer, endOffset);
          afterRange.setEnd(formatNode, formatNode.childNodes.length);
          const afterContent = afterRange.cloneContents();

          // Build new structure
          const parent = formatNode.parentNode!;
          const fragment = document.createDocumentFragment();

          // Before part (still formatted)
          if (beforeContent.textContent && beforeContent.textContent.length > 0) {
            const beforeTag = document.createElement(formatTag.toLowerCase());
            beforeTag.appendChild(beforeContent);
            fragment.appendChild(beforeTag);
          }

          // Selected part (unformatted)
          fragment.appendChild(selectedContent);

          // After part (still formatted)
          if (afterContent.textContent && afterContent.textContent.length > 0) {
            const afterTag = document.createElement(formatTag.toLowerCase());
            afterTag.appendChild(afterContent);
            fragment.appendChild(afterTag);
          }

          // Replace the format node
          parent.replaceChild(fragment, formatNode);

          // Add nbsp after the unformatted content and position cursor there
          if (selectedContent.childNodes.length > 0) {
            const lastNode = selectedContent.childNodes[selectedContent.childNodes.length - 1];
            const nbsp = document.createTextNode('\u00A0'); // &nbsp;

            // Insert nbsp after the last node of selected content
            if (lastNode.nextSibling) {
              lastNode.parentNode!.insertBefore(nbsp, lastNode.nextSibling);
            } else {
              lastNode.parentNode!.appendChild(nbsp);
            }

            // Position cursor after the nbsp
            const newRange = document.createRange();
            newRange.setStartAfter(nbsp);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
          }
        }
      } else {
        // Add formatting to selected text
        const wrapper = document.createElement(tag);
        wrapper.appendChild(range.extractContents());
        range.insertNode(wrapper);

        // Insert nbsp after the formatted content
        const nbsp = document.createTextNode('\u00A0'); // &nbsp;
        if (wrapper.nextSibling) {
          wrapper.parentNode!.insertBefore(nbsp, wrapper.nextSibling);
        } else {
          wrapper.parentNode!.appendChild(nbsp);
        }

        // Position cursor after the nbsp
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStartAfter(nbsp);
        newRange.collapse(true);
        selection.addRange(newRange);
      }
    }
  }

  /**
   * Check if a format is active within the current range
   */
  private isFormatActiveInRange(range: Range, tagNames: string[]): boolean {
    let node: Node | null = range.commonAncestorContainer;

    // If text node, get parent
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    // Traverse up to check for any of the tag variants
    while (node && node !== this.editorElement) {
      if (node instanceof HTMLElement && tagNames.includes(node.tagName)) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }

  /**
   * Unwrap formatting from selected text
   */
  private unwrapFormat(range: Range, tagName: string): void {
    const container = range.commonAncestorContainer;
    let formatNode: HTMLElement | null = null;

    // Find the formatting element
    if (container.nodeType === Node.TEXT_NODE) {
      formatNode = container.parentElement;
    } else if (container instanceof HTMLElement) {
      formatNode = container;
    }

    // Traverse up to find the tag
    while (formatNode && formatNode !== this.editorElement) {
      if (formatNode.tagName === tagName) {
        break;
      }
      formatNode = formatNode.parentElement;
    }

    if (!formatNode || formatNode.tagName !== tagName) return;

    // CRITICAL FIX: Save range boundaries BEFORE extracting contents
    const startContainer = range.startContainer;
    const startOffset = range.startOffset;
    const endContainer = range.endContainer;
    const endOffset = range.endOffset;

    // Get the selected content within the format tag
    const selectedContent = range.extractContents();

    // Get content before selection within the format tag
    const beforeRange = document.createRange();
    beforeRange.setStart(formatNode, 0);
    beforeRange.setEnd(startContainer, startOffset);
    const beforeContent = beforeRange.cloneContents();

    // Get content after selection within the format tag
    const afterRange = document.createRange();
    afterRange.setStart(endContainer, endOffset);
    afterRange.setEnd(formatNode, formatNode.childNodes.length);
    const afterContent = afterRange.cloneContents();

    // Create new structure
    const parent = formatNode.parentNode!;
    const fragment = document.createDocumentFragment();

    // Add before part (still formatted) if it has content
    if (beforeContent.textContent && beforeContent.textContent.length > 0) {
      const beforeTag = document.createElement(tagName.toLowerCase());
      beforeTag.appendChild(beforeContent);
      fragment.appendChild(beforeTag);
    }

    // Add selected part (unformatted)
    fragment.appendChild(selectedContent);

    // Add after part (still formatted) if it has content
    if (afterContent.textContent && afterContent.textContent.length > 0) {
      const afterTag = document.createElement(tagName.toLowerCase());
      afterTag.appendChild(afterContent);
      fragment.appendChild(afterTag);
    }

    // Replace the original format node
    parent.replaceChild(fragment, formatNode);

    // Restore selection on the unformatted content
    const selection = window.getSelection();
    if (selection && selectedContent.childNodes.length > 0) {
      const newRange = document.createRange();
      newRange.selectNodeContents(selectedContent.childNodes[0]);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
  }

  /**
   * Toggle list formatting
   */
  private toggleList(listTag: 'ul' | 'ol', selection: Selection, range: Range): void {
    const listTagUpper = listTag.toUpperCase();

    // Check if selection is already in a list
    let node: Node | null = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    let listNode: HTMLElement | null = null;
    let currentNode: Node | null = node;

    // Find if we're inside a UL or OL
    while (currentNode && currentNode !== this.editorElement) {
      if (currentNode instanceof HTMLElement &&
          (currentNode.tagName === 'UL' || currentNode.tagName === 'OL')) {
        listNode = currentNode;
        break;
      }
      currentNode = currentNode.parentNode;
    }

    if (listNode) {
      // Already in a list - unwrap it
      if (listNode.tagName === listTagUpper) {
        // Same list type - remove list formatting
        this.unwrapList(listNode);
      } else {
        // Different list type - convert it
        const newList = document.createElement(listTag);
        while (listNode.firstChild) {
          newList.appendChild(listNode.firstChild);
        }
        listNode.parentNode?.replaceChild(newList, listNode);
      }
    } else {
      // Not in a list - create one
      this.wrapInList(range, listTag);
    }
  }

  /**
   * Unwrap a list - convert list items back to paragraphs/text
   */
  private unwrapList(listNode: HTMLElement): void {
    const parent = listNode.parentNode;
    if (!parent) return;

    const fragment = document.createDocumentFragment();

    // Convert each <li> to a text node or <div>
    Array.from(listNode.children).forEach(li => {
      if (li.tagName === 'LI') {
        const div = document.createElement('div');
        div.innerHTML = li.innerHTML;
        fragment.appendChild(div);
        fragment.appendChild(document.createElement('br'));
      }
    });

    parent.replaceChild(fragment, listNode);
  }

  /**
   * Wrap selection in a list
   */
  private wrapInList(range: Range, listTag: 'ul' | 'ol'): void {
    const selectedContent = range.extractContents();
    const list = document.createElement(listTag);

    // If selection contains text, wrap it in a single <li>
    const textContent = selectedContent.textContent?.trim();

    if (textContent) {
      // Split by line breaks to create multiple list items
      const lines = textContent.split('\n').filter(line => line.trim());

      if (lines.length > 0) {
        lines.forEach(line => {
          const li = document.createElement('li');
          li.textContent = line.trim();
          list.appendChild(li);
        });
      } else {
        // Empty selection - create single empty list item
        const li = document.createElement('li');
        li.textContent = '\u200B'; // Zero-width space for cursor placement
        list.appendChild(li);
      }
    } else {
      // No text content - create empty list item
      const li = document.createElement('li');
      li.textContent = '\u200B';
      list.appendChild(li);
    }

    range.insertNode(list);

    // Place cursor in first list item
    const selection = window.getSelection();
    if (selection && list.firstElementChild) {
      const newRange = document.createRange();
      newRange.selectNodeContents(list.firstElementChild);
      newRange.collapse(false);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }
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
        case 'u':
          e.preventDefault();
          this.executeCommand('underline');
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
      case 'underline':
        return this.isNodeInTag(node, ['U']);
      case 'strikethrough':
        return this.isNodeInTag(node, ['S', 'STRIKE', 'DEL']);
      case 'code':
        return this.isNodeInTag(node, ['CODE']);
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
