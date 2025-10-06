/**
 * Main application entry point
 * Initializes all components and manages app lifecycle
 */

import {StateManager} from './core/state.js';
import {Editor} from './components/Editor.js';
import {Toolbar} from './components/Toolbar.js';
import {NotesList} from './components/NotesList.js';
import {Toast, toast} from './components/Toast.js';

class App {
  private stateManager: StateManager;
  private editor: Editor | null = null;
  private toolbar: Toolbar | null = null;
  private notesList: NotesList | null = null;
  private toast: Toast | null = null;

  constructor() {
    this.stateManager = new StateManager();
    this.init();
  }

  /**
   * Clean up on app close
   */
  destroy(): void {
    if (this.toolbar) {
      this.toolbar.destroy();
    }
    if (this.notesList) {
      this.notesList.destroy();
    }

    if (this.toast) {
      this.toast.destroy();
    }

    this.stateManager.destroy();
  }

  /**
   * Initialize the application
   */
  private init(): void {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  /**
   * Set up all components
   */
  private setup(): void {
    const editorElement = document.getElementById('editor');
    const titleElement = document.getElementById('note-title-input') as HTMLInputElement;
    const statusElement = document.getElementById('last-saved');
    const saveButton = document.getElementById('save-note-btn') as HTMLButtonElement;
    const toolbarElement = document.getElementById('toolbar');
    const notesListElement = document.getElementById('notes-list');
    const newNoteButton = document.getElementById('new-note-btn');
    const notesSearch = document.getElementById('notes-search') as HTMLInputElement;
    const viewToggle = document.getElementById('view-toggle');
    const emptyStateNewNoteButton = document.getElementById('empty-state-new-note-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('notes-sidebar');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const editorSection = document.getElementById('editor-section');
    const emptyState = document.getElementById('empty-state');

    // Validate required elements
    if (!editorElement || !titleElement || !statusElement || !saveButton ||
      !toolbarElement || !notesListElement || !newNoteButton ||
      !notesSearch || !viewToggle || !emptyStateNewNoteButton ||
      !themeToggle || !sidebarToggle || !sidebar || !sidebarBackdrop ||
      !editorSection || !emptyState) {
      console.error('Required DOM elements not found');
      return;
    }

    // Initialize components
    this.editor = new Editor(editorElement, titleElement, statusElement, saveButton, this.stateManager);
    this.toolbar = new Toolbar(toolbarElement, editorElement, this.stateManager);
    this.notesList = new NotesList(notesListElement, newNoteButton, notesSearch, viewToggle, this.stateManager);

    this.checkCrossTabSyncSupport();

    this.setupThemeToggle(themeToggle);

    this.setupSidebarToggle(sidebarToggle, sidebar, sidebarBackdrop);

    emptyStateNewNoteButton.addEventListener('click', async () => {
      const note = await this.stateManager.createNote();
      this.stateManager.selectNote(note.id);
    });

    this.stateManager.on('note-selected', (note) => {
      if (note) {
        editorSection.style.display = 'flex';
        emptyState.style.display = 'none';
        if (this.editor) {
          this.editor.focus();
        }
      } else {
        editorSection.style.display = 'none';
        emptyState.style.display = 'flex';
      }
    });

    const notes = this.stateManager.getNotesArray();
    if (notes.length === 0) {
      editorSection.style.display = 'none';
      emptyState.style.display = 'flex';
    } else {
      this.stateManager.selectNote(notes[0].id);
    }
  }

  /**
   * Check if BroadcastChannel is supported and warn if not
   */
  private checkCrossTabSyncSupport(): void {
    if (typeof BroadcastChannel === 'undefined') {
      toast.warning(
        'Cross-tab sync unavailable in this browser. Notes will not sync between tabs.',
        8000,
      );
      console.warn('BroadcastChannel API is not supported in this browser');
    }
  }

  /**
   * Set up theme toggle functionality
   */
  private setupThemeToggle(themeToggle: HTMLElement): void {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);

    themeToggle.addEventListener('click', () => {
      const currentTheme = document.body.dataset.theme || 'dark';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      this.setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
    });
  }

  /**
   * Set the app theme
   */
  private setTheme(theme: string): void {
    document.body.dataset.theme = theme;

    const themeIcon = document.querySelector('.theme-icon');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  /**
   * Set up sidebar toggle for responsive design
   */
  private setupSidebarToggle(
    toggleButton: HTMLElement,
    sidebar: HTMLElement,
    backdrop: HTMLElement,
  ): void {
    let sidebarOpen = false;
    let closeTimeout: number | null = null;

    const openSidebar = () => {
      sidebar.classList.add('open');
      backdrop.classList.add('visible');
      sidebarOpen = true;

      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('visible');
      sidebarOpen = false;

      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    };

    const scheduleClose = () => {
      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
      }

      closeTimeout = window.setTimeout(() => {
        closeSidebar();
        closeTimeout = null;
      }, 2000);
    };

    toggleButton.addEventListener('click', () => {
      if (sidebarOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    backdrop.addEventListener('click', () => {
      closeSidebar();
    });

    this.stateManager.on('note-selected', () => {
      if (sidebarOpen) {
        closeSidebar();
      }
    });

    sidebar.addEventListener('mouseleave', () => {
      if (sidebarOpen && window.innerWidth <= 700) {
        scheduleClose();
      }
    });

    sidebar.addEventListener('mouseenter', () => {
      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
  }
}

const app = new App();

window.addEventListener('beforeunload', () => {
  app.destroy();
});
