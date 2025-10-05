/**
 * Editor component - ContentEditable-based rich text editor
 * Features: auto-save, cursor preservation, paste handling
 */

import { Note } from '../types.js';
import { StateManager } from '../core/state.js';

export class Editor {
  private editorElement: HTMLElement;
  private htmlEditorElement: HTMLTextAreaElement;
  private titleElement: HTMLInputElement;
  private statusElement: HTMLElement;
  private saveButton: HTMLButtonElement;
  private stateManager: StateManager;
  private currentNote: Note | null = null;
  private saveTimeout: number | null = null;
  private readonly SAVE_DELAY = 500; // ms
  private isHtmlMode: boolean = false;
  private isHistoryOperation: boolean = false;

  constructor(
    editorElement: HTMLElement,
    titleElement: HTMLInputElement,
    statusElement: HTMLElement,
    saveButton: HTMLButtonElement,
    stateManager: StateManager
  ) {
    this.editorElement = editorElement;
    this.titleElement = titleElement;
    this.statusElement = statusElement;
    this.saveButton = saveButton;
    this.stateManager = stateManager;

    // Get HTML editor elements
    this.htmlEditorElement = document.getElementById('html-editor') as HTMLTextAreaElement;

    this.setupEventListeners();
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    // Handle input with debounced auto-save
    this.editorElement.addEventListener('input', () => this.handleInput());

    // Handle HTML editor input with debounced auto-save
    this.htmlEditorElement.addEventListener('input', () => this.handleInput());

    // Handle title input with debounced auto-save
    this.titleElement.addEventListener('input', () => this.handleInput());

    // Handle title click - select all if default title
    this.titleElement.addEventListener('click', () => this.handleTitleClick());

    // Handle paste - clean up formatting
    this.editorElement.addEventListener('paste', (e) => this.handlePaste(e));

    // Handle keyboard shortcuts
    this.editorElement.addEventListener('keydown', (e) => this.handleKeyDown(e));

    // Handle save button click
    this.saveButton.addEventListener('click', () => {
      this.saveNote();
      this.updateStatus('Saved manually');
      setTimeout(() => this.updateStatus(''), 2000);
    });

    // Listen to note selection changes
    this.stateManager.on('note-selected', (note: Note | null) => this.loadNote(note));

    // Listen to external note updates (from other tabs)
    this.stateManager.on('note-updated', (note: Note) => {
      if (this.currentNote && note.id === this.currentNote.id) {
        this.updateFromExternal(note);
      }
    });

    // Listen for undo/redo events
    this.stateManager.on('undo-applied', (noteId: string, state: any) => {
      if (this.currentNote && this.currentNote.id === noteId) {
        this.applyHistoryState(state);
        this.updateStatus('Undo');
        setTimeout(() => this.updateStatus(''), 2000);
      }
    });

    this.stateManager.on('redo-applied', (noteId: string, state: any) => {
      if (this.currentNote && this.currentNote.id === noteId) {
        this.applyHistoryState(state);
        this.updateStatus('Redo');
        setTimeout(() => this.updateStatus(''), 2000);
      }
    });
  }

  /**
   * Handle title click - select all text if it's the default title
   */
  private handleTitleClick(): void {
    const currentTitle = this.titleElement.value.trim();

    // Only select all if the title is still the default "Untitled Note"
    if (currentTitle === 'Untitled Note') {
      this.titleElement.select();
    }
  }

  /**
   * Handle input events
   */
  private handleInput(): void {
    if (!this.currentNote) return;

    // Clear previous timeout
    if (this.saveTimeout !== null) {
      window.clearTimeout(this.saveTimeout);
    }

    // Debounce save
    this.saveTimeout = window.setTimeout(() => {
      this.saveNote();
    }, this.SAVE_DELAY);

    // Update status
    this.updateStatus('Typing...');
  }

  /**
   * Handle paste events - strip unwanted formatting
   */
  private handlePaste(e: ClipboardEvent): void {
    e.preventDefault();

    const text = e.clipboardData?.getData('text/plain');
    if (!text) return;

    // Insert plain text at cursor
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));

    // Move cursor to end of inserted text
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  /**
   * Handle keyboard shortcuts
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // Ctrl+S / Cmd+S - Save
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      this.saveNote();
    }
  }

  /**
   * Save the current note
   */
  private saveNote(): void {
    if (!this.currentNote) return;

    // Get content from the active editor
    const content = this.isHtmlMode
      ? this.htmlEditorElement.value
      : this.editorElement.innerHTML;
    const title = this.titleElement.value.trim() || 'Untitled Note';

    // Record history before saving (unless this is a history operation)
    if (!this.isHistoryOperation) {
      this.stateManager.recordHistory(this.currentNote.id);
    }

    this.stateManager.updateNote(this.currentNote.id, { content, title });
    this.updateStatus('Saved');

    // Clear status after 2 seconds
    setTimeout(() => this.updateStatus(''), 2000);
  }

  /**
   * Load a note into the editor
   */
  private loadNote(note: Note | null): void {
    this.currentNote = note;

    if (note) {
      const selection = this.saveCursorPosition();

      this.titleElement.value = note.title;
      this.editorElement.innerHTML = note.content || '';
      this.htmlEditorElement.value = note.content || '';

      if (selection && this.editorElement.innerHTML === note.content) {
        this.restoreCursorPosition(selection);
      }

      this.updateStatus('');
    } else {
      this.titleElement.value = '';
      this.editorElement.innerHTML = '';
      this.htmlEditorElement.value = '';
      this.updateStatus('');
    }
  }

  /**
   * Update editor when note is changed externally (from another tab)
   */
  private updateFromExternal(note: Note): void {
    if (this.editorElement.innerHTML === note.content && this.titleElement.value === note.title) return;

    const selection = this.saveCursorPosition();

    this.currentNote = note;
    this.titleElement.value = note.title;
    this.editorElement.innerHTML = note.content;

  this.restoreCursorPosition(selection);

    this.updateStatus('Updated from another tab');
    setTimeout(() => this.updateStatus(''), 2000);
  }

  /**
   * Save cursor position
   */
  private saveCursorPosition(): { start: number; end: number } | null {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return null;

    const range = selection.getRangeAt(0);
    const preCaretRange = range.cloneRange();
    preCaretRange.selectNodeContents(this.editorElement);
    preCaretRange.setEnd(range.startContainer, range.startOffset);
    const start = preCaretRange.toString().length;

    return {
      start,
      end: start + range.toString().length
    };
  }

  /**
   * Restore cursor position
   */
  private restoreCursorPosition(savedPosition: { start: number; end: number } | null): void {
    if (!savedPosition) return;

    const selection = window.getSelection();
    if (!selection) return;

    try {
      const range = document.createRange();
      const { node, offset } = this.getTextNodeAndOffset(this.editorElement, savedPosition.start);

      if (node) {
        range.setStart(node, offset);
        range.setEnd(node, offset);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    } catch (error) {
      console.error('Error restoring cursor position:', error);
    }
  }

  /**
   * Get text node and offset for a given character position
   */
  private getTextNodeAndOffset(root: Node, position: number): { node: Node | null; offset: number } {
    let currentPos = 0;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();

    while (node) {
      const textLength = node.textContent?.length || 0;

      if (currentPos + textLength >= position) {
        return { node, offset: position - currentPos };
      }

      currentPos += textLength;
      node = walker.nextNode();
    }

    return { node: null, offset: 0 };
  }

  /**
   * Update status text
   */
  private updateStatus(text: string): void {
    this.statusElement.textContent = text;
  }

  /**
   * Handle undo action
   */
  private handleUndo(): void {
    if (!this.currentNote) return;
    this.stateManager.undo(this.currentNote.id);
  }

  /**
   * Handle redo action
   */
  private handleRedo(): void {
    if (!this.currentNote) return;
    this.stateManager.redo(this.currentNote.id);
  }

  /**
   * Apply a history state to the editor
   */
  private applyHistoryState(state: { content: string; title: string }): void {
    if (!this.currentNote) return;

    // Set flag to prevent history recording
    this.isHistoryOperation = true;

    // Save cursor position
    const selection = this.saveCursorPosition();

    // Update UI
    this.titleElement.value = state.title;
    this.editorElement.innerHTML = state.content;
    this.htmlEditorElement.value = state.content;

    // Restore cursor position
    if (selection) {
      this.restoreCursorPosition(selection);
    }

    // Update note in storage
    this.stateManager.updateNote(this.currentNote.id, {
      content: state.content,
      title: state.title
    });

    // Reset flag
    this.isHistoryOperation = false;
  }

  /**
   * Focus the editor
   */
  focus(): void {
    this.editorElement.focus();
  }
}
