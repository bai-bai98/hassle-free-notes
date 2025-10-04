/**
 * Storage service for managing notes in localStorage
 * Provides CRUD operations with error handling
 */

import { Note } from '../types.js';

const STORAGE_KEY = 'hassle-free-notes';

export class StorageService {
  /**
   * Get all notes from storage
   */
  getAllNotes(): Note[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];

      const notes = JSON.parse(data);

      // Validate data structure
      if (!Array.isArray(notes)) {
        console.error('Invalid notes data structure');
        return [];
      }

      return notes;
    } catch (error) {
      console.error('Error loading notes:', error);
      return [];
    }
  }

  /**
   * Get a single note by ID
   */
  getNote(id: string): Note | null {
    const notes = this.getAllNotes();
    return notes.find(note => note.id === id) || null;
  }

  /**
   * Save a note (create or update)
   */
  saveNote(note: Note): boolean {
    try {
      const notes = this.getAllNotes();
      const existingIndex = notes.findIndex(n => n.id === note.id);

      if (existingIndex >= 0) {
        notes[existingIndex] = note;
      } else {
        notes.push(note);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
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
      const notes = this.getAllNotes();
      const filteredNotes = notes.filter(note => note.id !== id);

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredNotes));
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
      localStorage.removeItem(STORAGE_KEY);
      return true;
    } catch (error) {
      console.error('Error clearing notes:', error);
      return false;
    }
  }
}
