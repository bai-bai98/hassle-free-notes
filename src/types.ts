/**
 * Core data models for the note-taking application
 */

export interface Note {
  id: string;
  title: string;
  content: string;
  url?: string;
  siteName?: string;
  createdAt: number;
  updatedAt: number;
  orderIndex?: number;
}

export interface HistoryState {
  content: string;
  title: string;
  timestamp: number;
}

export interface NoteHistory {
  past: HistoryState[];
  present: HistoryState;
  future: HistoryState[];
}

export type BroadcastMessageType = 'note-created' | 'note-updated' | 'note-deleted';

export interface BroadcastMessage {
  type: BroadcastMessageType;
  noteId: string;
  note?: Note;
}

export type EventCallback = (...args: any[]) => void;

export interface EventEmitter {
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  emit(event: string, ...args: any[]): void;
}
