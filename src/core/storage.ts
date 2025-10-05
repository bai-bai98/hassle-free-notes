/**
 * Storage service for managing notes in localStorage
 * Provides CRUD operations with error handling
 * Optimized with note-level keys and in-memory cache
 */

import { Note } from '../types.js';

const STORAGE_KEY = 'hassle-free-notes';
const NOTE_KEY_PREFIX = 'note-';
const INDEX_KEY = 'notes-index';

export class StorageService {
  private cache: Map<string, Note> = new Map();
  private cacheLoaded: boolean = false;

  /**
   * Get all notes from storage
   */
  getAllNotes(): Note[] {
    // Return from cache if already loaded
    if (this.cacheLoaded) {
      return Array.from(this.cache.values());
    }

    try {
      // Try new index-based storage first
      const index = this.getIndex();
      if (index.length > 0) {
        const notes: Note[] = [];
        for (const noteId of index) {
          const note = this.loadNoteFromStorage(noteId);
          if (note) {
            this.cache.set(note.id, note);
            notes.push(note);
          }
        }
        this.cacheLoaded = true;
        return notes;
      }

      // Fallback: migrate old storage format
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const notes = JSON.parse(data);
        if (Array.isArray(notes)) {
          // Migrate to new format
          notes.forEach(note => {
            this.cache.set(note.id, note);
            this.saveNoteToStorage(note);
          });
          this.saveIndex(notes.map(n => n.id));
          // Remove old format
          localStorage.removeItem(STORAGE_KEY);
          this.cacheLoaded = true;
          return notes;
        }
      }

      this.cacheLoaded = true;
      return [];
    } catch (error) {
      console.error('Error loading notes:', error);
      this.cacheLoaded = true;
      return [];
    }
  }

  /**
   * Get a single note by ID
   */
  getNote(id: string): Note | null {
    // Check cache first
    if (this.cache.has(id)) {
      return this.cache.get(id) || null;
    }

    // Load from storage
    return this.loadNoteFromStorage(id);
  }

  /**
   * Save a note (create or update)
   */
  saveNote(note: Note): boolean {
    try {
      // Update cache
      const isNew = !this.cache.has(note.id);
      this.cache.set(note.id, note);

      // Save to storage
      this.saveNoteToStorage(note);

      // Update index if new note
      if (isNew) {
        const index = this.getIndex();
        index.push(note.id);
        this.saveIndex(index);
      }

      return true;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.error('Storage quota exceeded');
        alert('Storage quota exceeded. Please delete some notes.');
      } else {
        console.error('Error saving note:', error);
      }
      return false;
    }
  }

  /**
   * Delete a note by ID
   */
  deleteNote(id: string): boolean {
    try {
      // Remove from cache
      this.cache.delete(id);

      // Remove from storage
      localStorage.removeItem(NOTE_KEY_PREFIX + id);

      // Update index
      const index = this.getIndex();
      const filteredIndex = index.filter(noteId => noteId !== id);
      this.saveIndex(filteredIndex);

      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  /**
   * Clear all notes (for testing/debugging)
   */
  clearAll(): boolean {
    try {
      // Clear cache
      this.cache.clear();
      this.cacheLoaded = false;

      // Clear index
      localStorage.removeItem(INDEX_KEY);

      // Clear all note entries
      const index = this.getIndex();
      index.forEach(id => {
        localStorage.removeItem(NOTE_KEY_PREFIX + id);
      });

      // Clear legacy format
      localStorage.removeItem(STORAGE_KEY);

      return true;
    } catch (error) {
      console.error('Error clearing notes:', error);
      return false;
    }
  }

  /**
   * Load a single note from storage
   */
  private loadNoteFromStorage(id: string): Note | null {
    try {
      const data = localStorage.getItem(NOTE_KEY_PREFIX + id);
      if (!data) return null;

      const note = JSON.parse(data);
      return note;
    } catch (error) {
      console.error(`Error loading note ${id}:`, error);
      return null;
    }
  }

  /**
   * Save a single note to storage
   */
  private saveNoteToStorage(note: Note): void {
    localStorage.setItem(NOTE_KEY_PREFIX + note.id, JSON.stringify(note));
  }

  /**
   * Get the notes index
   */
  private getIndex(): string[] {
    try {
      const data = localStorage.getItem(INDEX_KEY);
      if (!data) return [];

      const index = JSON.parse(data);
      return Array.isArray(index) ? index : [];
    } catch (error) {
      console.error('Error loading index:', error);
      return [];
    }
  }

  /**
   * Save the notes index
   */
  private saveIndex(index: string[]): void {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  }
}
