/**
 * NotesList component - Sidebar showing all notes
 * Features: display notes, create, delete, select
 */

import {Note} from '../types.js';
import {StateManager} from '../core/state.js';
import {getCurrentSiteInfo, groupByHostname} from '../utils/url.js';
import {DeletePopup} from './DeletePopup.js';
import {debounce} from '../utils/debounce.js';

export class NotesList {
  private listElement: HTMLElement;
  private newNoteButton: HTMLElement;
  private searchInput: HTMLInputElement;
  private viewToggle: HTMLElement;
  private stateManager: StateManager;
  private currentNoteId: string | null = null;
  private currentHostname: string | null = null;
  private expandedGroups: Set<string> = new Set();
  private isGroupedView: boolean = true;
  private searchQuery: string = '';
  private draggedNoteId: string | null = null;
  private draggedOverNoteId: string | null = null;
  private draggedOverGroup: string | null = null;
  private deletePopup: DeletePopup;
  private sharedEscapeDiv: HTMLDivElement;
  private debouncedRender: () => void;
  private renderScheduled: boolean = false;

  constructor(
    listElement: HTMLElement,
    newNoteButton: HTMLElement,
    searchInput: HTMLInputElement,
    viewToggle: HTMLElement,
    stateManager: StateManager,
  ) {
    this.listElement = listElement;
    this.newNoteButton = newNoteButton;
    this.searchInput = searchInput;
    this.viewToggle = viewToggle;
    this.stateManager = stateManager;
    this.deletePopup = new DeletePopup();

    this.sharedEscapeDiv = document.createElement('div');

    this.debouncedRender = debounce(() => this.render(), 100);

    void this.initCurrentHostname();
    this.setupEventListeners();
  }

  /**
   * Cleanup - destroy delete popup
   */
  destroy(): void {
    this.deletePopup.destroy();
  }

  /**
   * Initialize current hostname
   */
  private async initCurrentHostname(): Promise<void> {
    const siteInfo = await getCurrentSiteInfo();
    if (siteInfo) {
      this.currentHostname = groupByHostname(siteInfo.url);
      this.expandedGroups.add(this.currentHostname);
      this.render();
    }
  }

  /**
   * Set up event listeners
   */
  private setupEventListeners(): void {
    this.newNoteButton.addEventListener('click', () => this.handleNewNote());

    this.searchInput.addEventListener('input', (e) => {
      this.searchQuery = (e.target as HTMLInputElement).value.toLowerCase();
      this.render();
    });

    this.viewToggle.addEventListener('click', () => {
      this.isGroupedView = !this.isGroupedView;
      this.updateViewToggle();
      this.render();
    });

    this.listElement.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      if (target.closest('.accordion-header')) {
        e.stopPropagation();
        const header = target.closest('.accordion-header') as HTMLElement;
        const groupName = header.dataset.group;
        if (groupName) {
          this.toggleGroup(groupName);
        }
        return;
      }

      if (target.closest('.note-delete-btn')) {
        e.stopPropagation();
        const noteItem = target.closest('.note-item') as HTMLElement;
        if (noteItem) {
          this.handleDeleteNote(noteItem.dataset.noteId!, e);
        }
        return;
      }

      const noteItem = target.closest('.note-item') as HTMLElement;
      if (noteItem) {
        this.handleSelectNote(noteItem.dataset.noteId!);
      }
    });

    // Drag and drop event listeners
    this.listElement.addEventListener('dragstart', (e) => this.handleDragStart(e));
    this.listElement.addEventListener('dragover', (e) => this.handleDragOver(e));
    this.listElement.addEventListener('dragleave', (e) => this.handleDragLeave(e));
    this.listElement.addEventListener('drop', (e) => this.handleDrop(e));
    this.listElement.addEventListener('dragend', (e) => this.handleDragEnd(e));

    // Listen to state changes - use debounced render
    this.stateManager.on('notes-loaded', () => this.debouncedRender());
    this.stateManager.on('note-created', () => this.debouncedRender());
    this.stateManager.on('note-updated', () => this.debouncedRender());
    this.stateManager.on('note-deleted', () => this.debouncedRender());
    this.stateManager.on('note-changed', () => this.debouncedRender());
    this.stateManager.on('note-selected', (note: Note | null) => {
      this.currentNoteId = note?.id || null;
      this.updateActiveState();
    });
  }

  /**
   * Handle new note creation
   */
  private async handleNewNote(): Promise<void> {
    const note = await this.stateManager.createNote();
    this.stateManager.selectNote(note.id);
  }

  /**
   * Toggle accordion group open/closed
   */
  private toggleGroup(groupName: string): void {
    if (this.expandedGroups.has(groupName)) {
      this.expandedGroups.delete(groupName);
    } else {
      this.expandedGroups.add(groupName);
    }
    this.render();
  }

  /**
   * Update view toggle button appearance
   */
  private updateViewToggle(): void {
    const label = this.viewToggle.querySelector('.view-label');
    const icon = this.viewToggle.querySelector('.view-icon');

    if (this.isGroupedView) {
      this.viewToggle.classList.add('active');
      if (label) label.textContent = 'List All';
      if (icon) icon.textContent = '📋';
    } else {
      this.viewToggle.classList.remove('active');
      if (label) label.textContent = 'Group by Site';
      if (icon) icon.textContent = '📑';
    }
  }

  /**
   * Filter notes by search query
   */
  private filterNotes(notes: Note[]): Note[] {
    if (!this.searchQuery) return notes;

    return notes.filter(note => {
      const searchLower = this.searchQuery;
      const titleMatch = note.title.toLowerCase().includes(searchLower);
      const contentMatch = this.extractPlainText(note.content).toLowerCase().includes(searchLower);
      const urlMatch = note.url?.toLowerCase().includes(searchLower) || false;

      return titleMatch || contentMatch || urlMatch;
    });
  }

  /**
   * Extract plain text from HTML content (using shared div for performance)
   */
  private extractPlainText(html: string): string {
    this.sharedEscapeDiv.innerHTML = html;
    const text = this.sharedEscapeDiv.textContent || this.sharedEscapeDiv.innerText || '';
    this.sharedEscapeDiv.innerHTML = '';
    return text;
  }

  /**
   * Handle note selection
   */
  private handleSelectNote(noteId: string): void {
    this.stateManager.selectNote(noteId);
  }

  /**
   * Handle note deletion
   */
  private handleDeleteNote(noteId: string, event: MouseEvent): void {
    this.deletePopup.show(
      event,
      () => {
        this.stateManager.deleteNote(noteId);
      },
      () => { /* Cancelled */
      },
    );
  }

  /**
   * Render the notes list
   */
  private render(): void {
    let notes = this.stateManager.getNotesArray();

    notes = this.filterNotes(notes);

    if (notes.length === 0) {
      const message = this.searchQuery
        ? `<p>No notes found for "${this.searchQuery}"</p>`
        : `<p>No notes yet</p><p class="empty-notes-hint">Click "New Note" to get started</p>`;

      this.listElement.innerHTML = `<div class="empty-notes">${message}</div>`;
      return;
    }

    if (this.isGroupedView) {
      const grouped = this.groupNotesByHostname(notes);

      const sortedGroups = Array.from(grouped.entries()).sort((a, b) => {
        const [groupA] = a;
        const [groupB] = b;

        if (groupA === this.currentHostname) return -1;
        if (groupB === this.currentHostname) return 1;

        return groupA.localeCompare(groupB);
      });

      this.listElement.innerHTML = sortedGroups
        .map(([groupName, groupNotes]) => this.renderAccordion(groupName, groupNotes))
        .join('');
    } else {
      this.listElement.innerHTML = notes
        .map(note => this.renderNoteItem(note))
        .join('');
    }

    this.updateActiveState();
  }

  /**
   * Group notes by hostname
   */
  private groupNotesByHostname(notes: Note[]): Map<string, Note[]> {
    const grouped = new Map<string, Note[]>();

    notes.forEach(note => {
      const hostname = note.url ? groupByHostname(note.url) : 'Uncategorized';

      if (!grouped.has(hostname)) {
        grouped.set(hostname, []);
      }

      grouped.get(hostname)!.push(note);
    });

    return grouped;
  }

  /**
   * Render an accordion group
   */
  private renderAccordion(groupName: string, notes: Note[]): string {
    const isExpanded = this.expandedGroups.has(groupName);
    const isCurrentSite = groupName === this.currentHostname;
    const chevron = isExpanded ? '▼' : '▶';

    return `
      <div class="accordion-group ${isCurrentSite ? 'current-site' : ''}">
        <div class="accordion-header" data-group="${this.escapeHtml(groupName)}">
          <span class="accordion-chevron">${chevron}</span>
          <span class="accordion-title">${this.escapeHtml(groupName)}</span>
          <span class="accordion-count">${notes.length}</span>
        </div>
        <div class="accordion-content ${isExpanded ? 'expanded' : ''}">
          ${notes.map(note => this.renderNoteItem(note)).join('')}
        </div>
      </div>
    `;
  }

  /**
   * Render a single note item
   */
  private renderNoteItem(note: Note): string {
    const preview = this.getPreview(note.content);
    const timeAgo = this.formatTimeAgo(note.updatedAt);

    return `
      <div class="note-item" data-note-id="${note.id}" draggable="true">
        <div class="note-drag-handle" title="Drag to reorder">⋮⋮</div>
        <div class="note-item-content">
          <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
          <p class="note-preview">${this.escapeHtml(preview)}</p>
          <span class="note-time">${timeAgo}</span>
        </div>
        <button class="note-delete-btn" title="Delete note">×</button>
      </div>
    `;
  }

  /**
   * Get preview text from note content (using shared div for performance)
   */
  private getPreview(content: string): string {
    this.sharedEscapeDiv.innerHTML = content;
    const text = this.sharedEscapeDiv.textContent || this.sharedEscapeDiv.innerText || '';
    this.sharedEscapeDiv.innerHTML = '';

    return text.substring(0, 50) + (text.length > 50 ? '...' : '');
  }

  /**
   * Format time as relative time ago
   */
  private formatTimeAgo(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString();
  }

  /**
   * Escape HTML to prevent XSS (using shared div for performance)
   */
  private escapeHtml(text: string): string {
    this.sharedEscapeDiv.textContent = text;
    return this.sharedEscapeDiv.innerHTML;
  }

  /**
   * Update active state styling
   */
  private updateActiveState(): void {
    const items = this.listElement.querySelectorAll('.note-item');
    items.forEach(item => {
      const noteId = (item as HTMLElement).dataset.noteId;
      item.classList.toggle('active', noteId === this.currentNoteId);
    });
  }

  /**
   * Handle drag start
   */
  private handleDragStart(e: DragEvent): void {
    const target = e.target as HTMLElement;
    const noteItem = target.closest('.note-item') as HTMLElement;

    if (!noteItem) {
      e.preventDefault();
      return;
    }

    this.draggedNoteId = noteItem.dataset.noteId!;
    noteItem.classList.add('dragging');

    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', this.draggedNoteId);
    }
  }

  /**
   * Handle drag over
   */
  private handleDragOver(e: DragEvent): void {
    e.preventDefault();

    const target = e.target as HTMLElement;
    const noteItem = target.closest('.note-item') as HTMLElement;
    const accordionContent = target.closest('.accordion-content') as HTMLElement;
    const accordionGroup = target.closest('.accordion-group') as HTMLElement;

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    this.listElement.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('drop-zone'));

    if (noteItem && noteItem.dataset.noteId !== this.draggedNoteId) {
      this.draggedOverNoteId = noteItem.dataset.noteId!;
      noteItem.classList.add('drop-zone');
    } else if (accordionContent && !noteItem) {
      const accordionHeader = accordionGroup?.querySelector('.accordion-header') as HTMLElement;
      if (accordionHeader) {
        this.draggedOverGroup = accordionHeader.dataset.group!;
        accordionContent.classList.add('drop-zone');
      }
    } else if (accordionGroup && !accordionContent) {
      const accordionHeader = accordionGroup.querySelector('.accordion-header') as HTMLElement;
      if (accordionHeader) {
        this.draggedOverGroup = accordionHeader.dataset.group!;
        accordionGroup.classList.add('drop-zone');
      }
    }
  }

  /**
   * Handle drag leave
   */
  private handleDragLeave(e: DragEvent): void {
    const target = e.target as HTMLElement;
    target.classList.remove('drop-zone');
  }

  /**
   * Handle drop
   */
  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if (!this.draggedNoteId) return;

    const target = e.target as HTMLElement;
    const noteItem = target.closest('.note-item') as HTMLElement;
    const accordionContent = target.closest('.accordion-content') as HTMLElement;
    const accordionGroup = target.closest('.accordion-group') as HTMLElement;

    if (noteItem && noteItem.dataset.noteId !== this.draggedNoteId) {
      this.handleNoteReorder(this.draggedNoteId, noteItem.dataset.noteId!);
    } else if (accordionContent || accordionGroup) {
      const accordionHeader = accordionGroup?.querySelector('.accordion-header') as HTMLElement;
      if (accordionHeader) {
        const targetGroup = accordionHeader.dataset.group!;
        this.handleNoteSiteChange(this.draggedNoteId, targetGroup);
      }
    }

    this.clearDragState();
  }

  /**
   * Handle drag end
   */
  private handleDragEnd(e: DragEvent): void {
    this.clearDragState();
  }

  /**
   * Clear drag state
   */
  private clearDragState(): void {
    this.listElement.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    this.listElement.querySelectorAll('.drop-zone').forEach(el => el.classList.remove('drop-zone'));

    this.draggedNoteId = null;
    this.draggedOverNoteId = null;
    this.draggedOverGroup = null;
  }

  /**
   * Handle note reorder
   */
  private handleNoteReorder(draggedId: string, targetId: string): void {
    const notes = this.stateManager.getNotesArray();
    const draggedNote = notes.find(n => n.id === draggedId);
    const targetNote = notes.find(n => n.id === targetId);

    if (!draggedNote || !targetNote) return;

    const draggedGroup = draggedNote.url ? groupByHostname(draggedNote.url) : 'Uncategorized';
    const targetGroup = targetNote.url ? groupByHostname(targetNote.url) : 'Uncategorized';

    if (draggedGroup !== targetGroup && this.isGroupedView) {
      this.handleNoteSiteChange(draggedId, targetGroup);
      return;
    }

    const groupNotes = notes.filter(n => {
      const noteGroup = n.url ? groupByHostname(n.url) : 'Uncategorized';
      return noteGroup === targetGroup;
    });

    const draggedIndex = groupNotes.findIndex(n => n.id === draggedId);
    const targetIndex = groupNotes.findIndex(n => n.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) return;

    const reorderedNotes = [...groupNotes];
    const [draggedItem] = reorderedNotes.splice(draggedIndex, 1);
    reorderedNotes.splice(targetIndex, 0, draggedItem);

    reorderedNotes.forEach((note, index) => {
      this.stateManager.reorderNote(note.id, index);
    });
  }

  /**
   * Handle note site change
   */
  private handleNoteSiteChange(noteId: string, targetGroup: string): void {
    const note = this.stateManager.getNotesArray().find(n => n.id === noteId);
    if (!note) return;

    const currentGroup = note.url ? groupByHostname(note.url) : 'Uncategorized';

    if (currentGroup === targetGroup) return;

    const allNotes = this.stateManager.getNotesArray();
    const targetGroupNote = allNotes.find(n => {
      const noteGroup = n.url ? groupByHostname(n.url) : 'Uncategorized';
      return noteGroup === targetGroup && n.id !== noteId;
    });

    if (targetGroupNote && targetGroupNote.url) {
      this.stateManager.updateNoteSite(noteId, targetGroupNote.url, targetGroupNote.siteName);
    } else if (targetGroup === 'Uncategorized') {
      this.stateManager.updateNoteSite(noteId, '', '');
    }
  }
}
