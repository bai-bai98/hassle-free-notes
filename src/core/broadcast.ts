/**
 * BroadcastChannel service for cross-tab synchronization
 * Handles sending and receiving messages between browser tabs
 * Includes error recovery and fallback mechanisms
 */

import {BroadcastMessage} from '../types.js';
import {BROADCAST} from '../constants.js';
import {toast} from '../components/Toast.js';

const CHANNEL_NAME = BROADCAST.CHANNEL_NAME;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

export class BroadcastService {
  private channel: BroadcastChannel | null = null;
  private messageHandlers: Set<(message: BroadcastMessage) => void> = new Set();
  private retryCount: number = 0;
  private reconnectTimeout: number | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Register a message handler
   */
  onMessage(handler: (message: BroadcastMessage) => void): void {
    this.messageHandlers.add(handler);
  }

  /**
   * Unregister a message handler
   */
  offMessage(handler: (message: BroadcastMessage) => void): void {
    this.messageHandlers.delete(handler);
  }

  /**
   * Broadcast a message to all other tabs with retry logic
   */
  broadcast(message: BroadcastMessage): void {
    if (!this.channel) {
      console.warn('BroadcastChannel not available');
      return;
    }

    try {
      this.channel.postMessage(message);
    } catch (error) {
      console.error('Error broadcasting message:', error);
      this.retryBroadcast(message, 1);
    }
  }

  /**
   * Close the channel
   */
  close(): void {
    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.messageHandlers.clear();
  }

  /**
   * Check if BroadcastChannel is supported
   */
  isSupported(): boolean {
    return typeof BroadcastChannel !== 'undefined';
  }

  /**
   * Initialize the BroadcastChannel with error recovery
   */
  private initialize(): void {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
        this.retryCount = 0;
      } else {
        console.warn('BroadcastChannel API not supported');
      }
    } catch (error) {
      console.error('Error initializing BroadcastChannel:', error);
      this.handleChannelError();
    }
  }

  /**
   * Handle incoming messages
   */
  private handleMessage(data: BroadcastMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  /**
   * Retry broadcasting with exponential backoff
   */
  private retryBroadcast(message: BroadcastMessage, attempt: number): void {
    if (attempt > MAX_RETRY_ATTEMPTS) {
      console.error('Failed to broadcast message after max retries');
      toast.warning('Sync with other tabs failed. Changes saved locally.', 4000);
      return;
    }

    const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
    setTimeout(() => {
      try {
        if (this.channel) {
          this.channel.postMessage(message);
        }
      } catch (error) {
        console.error(`Retry ${attempt} failed:`, error);
        this.retryBroadcast(message, attempt + 1);
      }
    }, delay);
  }

  /**
   * Handle channel errors and attempt recovery
   */
  private handleChannelError(): void {
    if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      toast.error('Cross-tab sync unavailable. Notes will sync when you reload.', 5000);
      return;
    }

    this.retryCount++;
    const delay = RETRY_DELAY_MS * Math.pow(2, this.retryCount - 1);

    if (this.reconnectTimeout !== null) {
      window.clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = window.setTimeout(() => {
      console.log(`Attempting to reconnect (${this.retryCount}/${MAX_RETRY_ATTEMPTS})...`);
      this.close();
      this.initialize();
    }, delay);
  }
}
