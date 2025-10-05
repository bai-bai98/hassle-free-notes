/**
 * Main application entry point
 * Initializes all components and manages app lifecycle
 */

import { StateManager } from './core/state.js';
import { Editor } from './components/Editor.js';
import { Toolbar } from './components/Toolbar.js';
import { NotesList } from './components/NotesList.js';

class App {
  private stateManager: StateManager;
  private editor: Editor | null = null;
  private toolbar: Toolbar | null = null;
  private notesList: NotesList | null = null;

  constructor() {
    this.stateManager = new StateManager();
    this.init();
  }

  /**
   * Initialize the application
   */
  private init(): void {
    // Wait for DOM to be ready
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
    // Get DOM elements
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

    // Set up theme toggle
    this.setupThemeToggle(themeToggle);

    // Set up sidebar toggle for small screens
    this.setupSidebarToggle(sidebarToggle, sidebar, sidebarBackdrop);

    // Set up empty state new note button
    emptyStateNewNoteButton.addEventListener('click', async () => {
      const note = await this.stateManager.createNote();
      this.stateManager.selectNote(note.id);
    });

    // Handle note selection for showing/hiding empty state
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

    // Show initial empty state if no notes
    const notes = this.stateManager.getNotesArray();
    if (notes.length === 0) {
      editorSection.style.display = 'none';
      emptyState.style.display = 'flex';
    } else {
      // Auto-select first note
      this.stateManager.selectNote(notes[0].id);
    }

    console.log('Hassle Free Notes initialized successfully');
  }

  /**
   * Set up theme toggle functionality
   */
  private setupThemeToggle(themeToggle: HTMLElement): void {
    // Load saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark';
    this.setTheme(savedTheme);

    // Handle theme toggle
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

    // Update theme icon
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
    backdrop: HTMLElement
  ): void {
    let sidebarOpen = false;
    let closeTimeout: number | null = null;

    const openSidebar = () => {
      sidebar.classList.add('open');
      backdrop.classList.add('visible');
      sidebarOpen = true;

      // Clear any pending close timeout
      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    };

    const closeSidebar = () => {
      sidebar.classList.remove('open');
      backdrop.classList.remove('visible');
      sidebarOpen = false;

      // Clear timeout when closing
      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    };

    const scheduleClose = () => {
      // Clear any existing timeout
      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
      }

      // Schedule close after 2 seconds
      closeTimeout = window.setTimeout(() => {
        closeSidebar();
        closeTimeout = null;
      }, 2000);
    };

    // Toggle button click
    toggleButton.addEventListener('click', () => {
      if (sidebarOpen) {
        closeSidebar();
      } else {
        openSidebar();
      }
    });

    // Click backdrop to close
    backdrop.addEventListener('click', () => {
      closeSidebar();
    });

    // Close sidebar when note is selected (on small screens)
    this.stateManager.on('note-selected', () => {
      if (sidebarOpen) {
        closeSidebar();
      }
    });

    // Schedule close when mouse leaves sidebar (with 2s delay)
    sidebar.addEventListener('mouseleave', () => {
      // Only auto-close on small screens (when toggle button is visible)
      if (sidebarOpen && window.innerWidth <= 700) {
        scheduleClose();
      }
    });

    // Cancel close timeout when mouse enters sidebar
    sidebar.addEventListener('mouseenter', () => {
      if (closeTimeout !== null) {
        window.clearTimeout(closeTimeout);
        closeTimeout = null;
      }
    });
  }

  /**
   * Clean up on app close
   */
  destroy(): void {
    // Cleanup components
    if (this.toolbar) {
      this.toolbar.destroy();
    }
    if (this.notesList) {
      this.notesList.destroy();
    }

    // Cleanup state manager
    this.stateManager.destroy();
  }
}

// Initialize the app
const app = new App();

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  app.destroy();
});
