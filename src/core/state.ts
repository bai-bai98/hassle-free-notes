/**
 * State manager - Central state management with event emitter
 * Coordinates storage, broadcast, and UI updates
 */

import {BroadcastMessage, EventCallback, HistoryState, Note, NoteHistory} from '../types.js';
import {StorageService} from './storage.js';
import {BroadcastService} from './broadcast.js';
import {getCurrentSiteInfo} from '../utils/url.js';
import {debounce} from '../utils/debounce.js';
import {HISTORY} from '../constants.js';

export class StateManager {
  private storage: StorageService;
  private broadcast: BroadcastService;
  private notes: Map<string, Note> = new Map();
  private currentNoteId: string | null = null;
  private eventListeners: Map<string, Set<EventCallback>> = new Map();
  private noteHistories: Map<string, NoteHistory> = new Map();
  private readonly MAX_HISTORY_SIZE = HISTORY.MAX_SIZE;
  private debouncedRecordHistory: Map<string, () => void> = new Map();
  private broadcastMessageHandler: (message: BroadcastMessage) => void;

  constructor() {
    this.storage = new StorageService();
    this.broadcast = new BroadcastService();

    // Store handler reference for cleanup
    this.broadcastMessageHandler = (message) => this.handleBroadcastMessage(message);

    // Listen to broadcast messages from other tabs
    this.broadcast.onMessage(this.broadcastMessageHandler);

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
   * Create a new note
   */
  async createNote(): Promise<Note> {
    const now = Date.now();

    const siteInfo = await getCurrentSiteInfo();

    const note: Note = {
      id: this.generateId(),
      title: 'Untitled Note',
      content: '',
      url: siteInfo?.url,
      siteName: siteInfo?.siteName,
      createdAt: now,
      updatedAt: now,
    };

    if (this.storage.saveNote(note)) {
      this.notes.set(note.id, note);
      this.initializeHistory(note);
      this.broadcast.broadcast({type: 'note-created', noteId: note.id, note});
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
      id,
      updatedAt: Date.now(),
    };

    if (this.storage.saveNote(updatedNote)) {
      this.notes.set(id, updatedNote);
      this.broadcast.broadcast({type: 'note-updated', noteId: id, note: updatedNote});
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
      this.clearHistory(id);
      this.broadcast.broadcast({type: 'note-deleted', noteId: id});
      this.emit('note-deleted', id);

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
   * Get all notes as array
   */
  getNotesArray(): Note[] {
    return Array.from(this.notes.values()).sort((a, b) => {
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

    return this.updateNote(noteId, {orderIndex: newIndex});
  }

  /**
   * Update note's assigned site (change URL)
   */
  updateNoteSite(noteId: string, url: string, siteName?: string): boolean {
    const note = this.notes.get(noteId);
    if (!note) return false;

    return this.updateNote(noteId, {url, siteName});
  }

  /**
   * Record current state to history before making changes (debounced)
   */
  recordHistory(noteId: string): void {
    if (!this.debouncedRecordHistory.has(noteId)) {
      this.debouncedRecordHistory.set(
        noteId,
        debounce(() => this.recordHistoryImmediate(noteId), HISTORY.DEBOUNCE_DELAY),
      );
    }

    this.debouncedRecordHistory.get(noteId)!();
  }

  /**
   * Undo - revert to previous state
   */
  undo(noteId: string): HistoryState | null {
    const history = this.noteHistories.get(noteId);
    if (!history || history.past.length === 0) return null;

    history.future.push({...history.present});

    const previousState = history.past.pop()!;

    history.present = previousState;

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

    history.past.push({...history.present});

    const nextState = history.future.pop()!;

    history.present = nextState;

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
    this.broadcast.offMessage(this.broadcastMessageHandler);
    this.broadcast.close();
    this.eventListeners.clear();
    this.noteHistories.clear();
    this.debouncedRecordHistory.clear();
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
        if (message.note) {
          this.notes.set(message.note.id, message.note);
          this.emit('note-changed', message.note);
        }
        break;

      case 'note-updated':
        if (message.note) {
          this.notes.set(message.note.id, message.note);
          this.emit('note-updated', message.note);
        }
        break;

      case 'note-deleted':
        this.notes.delete(message.noteId);
        this.emit('note-deleted', message.noteId);

        if (this.currentNoteId === message.noteId) {
          this.currentNoteId = null;
          this.emit('note-selected', null);
        }
        break;
    }
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
          timestamp: Date.now(),
        },
        future: [],
      });
    }
  }

  /**
   * Actually record history (called by debounced version)
   */
  private recordHistoryImmediate(noteId: string): void {
    const note = this.notes.get(noteId);
    if (!note) return;

    this.initializeHistory(note);

    const history = this.noteHistories.get(noteId)!;

    if (this.isHistoryStateSame(history.present, note)) {
      return;
    }

    history.past.push({...history.present});

    if (history.past.length > this.MAX_HISTORY_SIZE) {
      history.past.shift();
    }

    history.future = [];

    history.present = {
      content: note.content,
      title: note.title,
      timestamp: Date.now(),
    };

    this.emit('history-changed', noteId);
  }

  /**
   * Check if history state is the same as note (for deduplication)
   */
  private isHistoryStateSame(state: HistoryState, note: Note): boolean {
    return state.content === note.content && state.title === note.title;
  }
}
