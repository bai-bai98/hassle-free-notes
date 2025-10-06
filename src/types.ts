/**
 * Core data models for the note-taking application
 */

//#region Interfaces
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

export interface BroadcastMessage {
  type: BroadcastMessageType;
  noteId: string;
  note?: Note;
}

export interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface SiteInfo {
  url: string;
  siteName: string;
  hostname: string;
}

//endregion

//#region Types

export type BroadcastMessageType = 'note-created' | 'note-updated' | 'note-deleted';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export type EventCallback = (...args: any[]) => void;

//endregion
