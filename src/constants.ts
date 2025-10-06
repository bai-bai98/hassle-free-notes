/**
 * Application constants
 * Centralized configuration values
 */

// Storage keys
export const STORAGE_KEYS = {
  NOTES: 'hassle-free-notes',
  NOTE_PREFIX: 'note-',
  INDEX: 'notes-index',
  THEME: 'theme',
} as const;

// History settings
export const HISTORY = {
  MAX_SIZE: 50,
  DEBOUNCE_DELAY: 2000,
} as const;

// Broadcast channel
export const BROADCAST = {
  CHANNEL_NAME: 'notes-sync',
} as const;

