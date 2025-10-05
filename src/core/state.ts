/**
 * State manager - Central state management with event emitter
 * Coordinates storage, broadcast, and UI updates
 */

import { Note, BroadcastMessage, EventCallback, NoteHistory, HistoryState } from '../types.js';
import { StorageService } from './storage.js';
import { BroadcastService } from './broadcast.js';
import { getCurrentSiteInfo } from '../utils/url.js';

export class StateManager {
  private storage: StorageService;
  private broadcast: BroadcastService;
  private notes: Map<string, Note> = new Map();
  private currentNoteId: string | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private noteHistories: Map<string, NoteHistory> = new Map();
  private readonly MAX_HISTORY_SIZE = 50;

  constructor() {
    this.storage = new StorageService();
    this.broadcast = new BroadcastService();

    // Listen to broadcast messages from other tabs
    this.broadcast.onMessage((message) => this.handleBroadcastMessage(message));

    // Load initial notes
    this.loadNotes();
  }

  /**
   * Event emitter - Register event listener
   */
  on(event: string, callback: EventCallback): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Event emitter - Remove event listener
   */
  off(event: string, callback: EventCallback): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Event emitter - Emit event
   */
  private emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Load notes from storage
   */
  private loadNotes(): void {
    const notes = this.storage.getAllNotes();
    this.notes.clear();
    notes.forEach(note => this.notes.set(note.id, note));
    this.emit('notes-loaded', this.getNotesArray());
  }

  /**
   * Handle broadcast messages from other tabs
   */
  private handleBroadcastMessage(message: BroadcastMessage): void {
    switch (message.type) {
      case 'note-created':
      case 'note-updated':
        if (message.note) {
          this.notes.set(message.note.id, message.note);
          this.emit('note-changed', message.note);
        }
        break;

      case 'note-deleted':
        this.notes.delete(message.noteId);
        this.emit('note-deleted', message.noteId);

        // If the deleted note was the current one, clear selection
        if (this.currentNoteId === message.noteId) {
          this.currentNoteId = null;
          this.emit('note-selected', null);
        }
        break;
    }
  }

  /**
   * Create a new note
   */
  async createNote(): Promise<Note> {
    const now = Date.now();

    // Get current site info
    const siteInfo = await getCurrentSiteInfo();

    const note: Note = {
      id: this.generateId(),
      title: 'Untitled Note',
      content: '',
      url: siteInfo?.url,
      siteName: siteInfo?.siteName,
      createdAt: now,
      updatedAt: now
    };

    if (this.storage.saveNote(note)) {
      this.notes.set(note.id, note);
      // Initialize empty history for new note
      this.initializeHistory(note);
      this.broadcast.broadcast({ type: 'note-created', noteId: note.id, note });
      this.emit('note-created', note);
      return note;
    }

    throw new Error('Failed to create note');
  }

  /**
   * Update an existing note
   */
  updateNote(id: string, updates: Partial<Note>): boolean {
    const existingNote = this.notes.get(id);
    if (!existingNote) return false;

    const updatedNote: Note = {
      ...existingNote,
      ...updates,
      id, // Ensure ID doesn't change
      updatedAt: Date.now()
    };

    if (this.storage.saveNote(updatedNote)) {
      this.notes.set(id, updatedNote);
      this.broadcast.broadcast({ type: 'note-updated', noteId: id, note: updatedNote });
      this.emit('note-updated', updatedNote);
      return true;
    }

    return false;
  }

  /**
   * Delete a note
   */
  deleteNote(id: string): boolean {
    if (!this.notes.has(id)) return false;

    if (this.storage.deleteNote(id)) {
      this.notes.delete(id);
      // Clear history for deleted note
      this.clearHistory(id);
      this.broadcast.broadcast({ type: 'note-deleted', noteId: id });
      this.emit('note-deleted', id);

      // If deleted note was current, clear selection
      if (this.currentNoteId === id) {
        this.currentNoteId = null;
        this.emit('note-selected', null);
      }

      return true;
    }

    return false;
  }

  /**
   * Select a note
   */
  selectNote(id: string | null): void {
    this.currentNoteId = id;
    const note = id ? this.notes.get(id) || null : null;
    this.emit('note-selected', note);
  }

  /**
   * Get current note
   */
  getCurrentNote(): Note | null {
    return this.currentNoteId ? this.notes.get(this.currentNoteId) || null : null;
  }

  /**
   * Get all notes as array
   */
  getNotesArray(): Note[] {
    return Array.from(this.notes.values()).sort((a, b) => {
      // Sort by orderIndex if available, otherwise by updatedAt
      if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
        return a.orderIndex - b.orderIndex;
      }
      return b.updatedAt - a.updatedAt;
    });
  }

  /**
   * Reorder a note (change its position in the list)
   */
  reorderNote(noteId: string, newIndex: number): boolean {
    const note = this.notes.get(noteId);
    if (!note) return false;

    return this.updateNote(noteId, { orderIndex: newIndex });
  }

  /**
   * Update note's assigned site (change URL)
   */
  updateNoteSite(noteId: string, url: string, siteName?: string): boolean {
    const note = this.notes.get(noteId);
    if (!note) return false;

    return this.updateNote(noteId, { url, siteName });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
        return `note_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Initialize history for a note
   */
  private initializeHistory(note: Note): void {
    if (!this.noteHistories.has(note.id)) {
      this.noteHistories.set(note.id, {
        past: [],
        present: {
          content: note.content,
          title: note.title,
          timestamp: Date.now()
        },
        future: []
      });
    }
  }

  /**
   * Record current state to history before making changes
   */
  recordHistory(noteId: string): void {
    const note = this.notes.get(noteId);
    if (!note) return;

    // Initialize history if it doesn't exist
    this.initializeHistory(note);

    const history = this.noteHistories.get(noteId)!;

    // Push current present to past
    history.past.push({ ...history.present });

    // Limit past size
    if (history.past.length > this.MAX_HISTORY_SIZE) {
      history.past.shift(); // Remove oldest
    }

    // Clear future (new changes invalidate redo)
    history.future = [];

    // Update present
    history.present = {
      content: note.content,
      title: note.title,
      timestamp: Date.now()
    };

    // Emit event so UI can update button states
    this.emit('history-changed', noteId);
  }

  /**
   * Undo - revert to previous state
   */
  undo(noteId: string): HistoryState | null {
    const history = this.noteHistories.get(noteId);
    if (!history || history.past.length === 0) return null;

    // Move present to future
    history.future.push({ ...history.present });

    // Pop from past
    const previousState = history.past.pop()!;

    // Set as present
    history.present = previousState;

    // Emit events
    this.emit('history-changed', noteId);
    this.emit('undo-applied', noteId, previousState);

    return previousState;
  }

  /**
   * Redo - move forward to next state
   */
  redo(noteId: string): HistoryState | null {
    const history = this.noteHistories.get(noteId);
    if (!history || history.future.length === 0) return null;

    // Move present to past
    history.past.push({ ...history.present });

    // Pop from future
    const nextState = history.future.pop()!;

    // Set as present
    history.present = nextState;

    // Emit events
    this.emit('history-changed', noteId);
    this.emit('redo-applied', noteId, nextState);

    return nextState;
  }

  /**
   * Check if undo is available
   */
  canUndo(noteId: string): boolean {
    const history = this.noteHistories.get(noteId);
    return history ? history.past.length > 0 : false;
  }

  /**
   * Check if redo is available
   */
  canRedo(noteId: string): boolean {
    const history = this.noteHistories.get(noteId);
    return history ? history.future.length > 0 : false;
  }

  /**
   * Clear history for a note (e.g., when deleted)
   */
  clearHistory(noteId: string): void {
    this.noteHistories.delete(noteId);
    this.emit('history-changed', noteId);
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.broadcast.close();
    this.eventListeners.clear();
    this.noteHistories.clear();
  }
}
