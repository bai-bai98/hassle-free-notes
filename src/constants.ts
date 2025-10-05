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

// Debounce delays (milliseconds)
export const DEBOUNCE_DELAYS = {
  AUTO_SAVE: 500,
  RENDER: 100,
  BUTTON_STATES: 50,
  SEARCH: 200,
} as const;

// History settings
export const HISTORY = {
  MAX_SIZE: 50,
  DEBOUNCE_DELAY: 2000,
} as const;

// UI dimensions
export const UI_DIMENSIONS = {
  POPUP_WIDTH: 200,
  POPUP_OFFSET: 10,
  SIDEBAR_CLOSE_DELAY: 2000,
} as const;

// Preview text
export const TEXT = {
  MAX_PREVIEW_LENGTH: 50,
  PREVIEW_ELLIPSIS: '...',
  DEFAULT_NOTE_TITLE: 'Untitled Note',
  DEFAULT_SITE_NAME: 'Uncategorized',
} as const;

// Broadcast channel
export const BROADCAST = {
  CHANNEL_NAME: 'notes-sync',
} as const;

// Time formats
export const TIME = {
  SECONDS_PER_MINUTE: 60,
  MINUTES_PER_HOUR: 60,
  HOURS_PER_DAY: 24,
  DAYS_PER_WEEK: 7,
} as const;
