/**
 * BroadcastChannel service for cross-tab synchronization
 * Handles sending and receiving messages between browser tabs
 */

import { BroadcastMessage } from '../types.js';

const CHANNEL_NAME = 'notes-sync';

export class BroadcastService {
  private channel: BroadcastChannel | null = null;
  private messageHandlers: Set<(message: BroadcastMessage) => void> = new Set();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize the BroadcastChannel
   */
  private initialize(): void {
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          this.handleMessage(event.data);
        };
      } else {
        console.warn('BroadcastChannel API not supported');
      }
    } catch (error) {
      console.error('Error initializing BroadcastChannel:', error);
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
   * Broadcast a message to all other tabs
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
    }
  }

  /**
   * Close the channel
   */
  close(): void {
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
}
