# Hassle Free Notes 📝

> A blazingly fast, cross-tab synchronized note-taking Chrome extension built with vanilla TypeScript and native browser APIs.

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat&logo=google-chrome&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat&logo=typescript&logoColor=white)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange?style=flat)
![No Dependencies](https://img.shields.io/badge/Dependencies-0-success?style=flat)

## ✨ Features

### 🔄 Real-Time Cross-Tab Synchronization
Notes automatically sync across **all open browser tabs** in real-time. Changes made in one tab instantly appear in all others, powered by the BroadcastChannel API.

### 📝 Rich Text Editor
A powerful contenteditable-based editor with comprehensive formatting options:

| Format | Keyboard Shortcut | Description |
|--------|------------------|-------------|
| **Bold** | `Ctrl/Cmd + B` | Make text bold |
| *Italic* | `Ctrl/Cmd + I` | Italicize text |
| <u>Underline</u> | `Ctrl/Cmd + U` | Underline text |
| ~~Strikethrough~~ | Toolbar button | Strike through text |
| `Code` | Toolbar button | Inline code formatting |
| • Bullet List | Toolbar button | Unordered list |
| 1. Numbered List | Toolbar button | Ordered list |
| Font Size | Dropdown menu | Small, normal, large, extra large |
| Text Color | Color picker | 8 preset colors |

### 💾 Auto-Save & Manual Save
- **Auto-save**: Automatically saves 500ms after you stop typing
- **Manual save**: Press `Ctrl/Cmd + S` or click the save button
- **Save indicator**: Real-time status showing "Typing...", "Saved", "Undo", "Redo"

### ↩️ Unlimited Undo/Redo
- Per-note history with **undo** and **redo** buttons
- History persists even when switching between notes
- Smart deduplication prevents duplicate history states
- 2-second debounce for optimal history recording

### 🌐 Smart Site Grouping
Notes are automatically associated with the website you're visiting:

- **Grouped View**: Notes organized by website (GitHub, YouTube, etc.)
- **List View**: Traditional flat list of all notes
- **Toggle views** with one click
- **Current site highlighting**: Your active website's group is emphasized
- **Expandable/collapsible groups**: Accordion-style organization

### 🔍 Powerful Search
Search across all notes in real-time:
- Search by **title**
- Search by **content**
- Search by **URL/site**
- Instant results as you type

### 🎨 Dark & Light Themes
- Beautiful **dark mode** (default)
- Clean **light mode**
- Toggle with the theme button (🌙/☀️)
- Preference saved automatically
- Smooth theme transitions

### 🖱️ Drag & Drop Organization
- **Reorder notes** within a group by dragging
- **Move notes between sites** by dropping on a different group
- **Visual drop indicators** show where notes will land
- Intuitive drag handles (⋮⋮) on each note

### 📱 Responsive Design
- **Desktop**: Full sidebar with notes list
- **Mobile**: Collapsible sidebar with toggle button
- **Auto-close**: Sidebar closes after selecting a note on mobile
- **Backdrop overlay**: Tap outside to close sidebar

### 🔐 Privacy & Security
- **100% local storage**: All data stored in your browser
- **No external servers**: No data leaves your device
- **XSS protection**: HTML sanitization on all content
- **No tracking**: Zero analytics or telemetry

### ⚡ Performance Optimized
- **Debounced operations**: Minimized CPU usage
- **In-memory caching**: O(1) note lookups
- **Smart rendering**: Only updates what changed
- **Lazy rendering**: Efficient DOM updates with 100ms debounce
- **AbortController cleanup**: No memory leaks

## 🚀 Installation

### From Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/bai-bai98/hassle-free-notes.git
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the extension**
   ```bash
   npm run build
   ```

4. **Load in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the project directory
   - The extension icon will appear in your toolbar

### Development Mode

For development with auto-recompilation:
```bash
npm run watch
```
### Netlify Deployment

```
https://hassle-free-notes.netlify.app/ 
```
## 📖 Usage Guide

### Creating Your First Note

1. **Open the extension** via:
   - Click the extension icon in your toolbar
   - Right-click anywhere and select "Open Hassle Free Notes"

2. **Click "New Note"** in the sidebar

3. **Start typing!** The editor auto-saves

### Formatting Text

1. **Select text** you want to format
2. **Click toolbar buttons** or use keyboard shortcuts:
   - `Ctrl/Cmd + B` for bold
   - `Ctrl/Cmd + I` for italic
   - `Ctrl/Cmd + U` for underline
3. **Font size**: Click dropdown, select size
4. **Text color**: Click color button, choose from presets

### Organizing Notes

#### Grouping by Website
- Notes are **automatically grouped** by the site you're on when you create them
- **Toggle views**: Click the "Group by Site" / "List All" button
- **Expand/collapse groups**: Click the group header (▶/▼)

#### Reordering Notes
- **Drag** the handle (⋮⋮) on any note
- **Drop** it where you want it in the list
- **Cross-group moves**: Drop on a different site group to reassign

### Searching Notes
1. Type in the **search box** at the top of the sidebar
2. Results filter **instantly** as you type
3. Clear the search to see all notes again

### Deleting Notes
1. **Hover** over a note in the sidebar
2. **Click the × button** that appears
3. **Confirm deletion** in the popup

### Switching Themes
- Click the **theme toggle button** (🌙/☀️) in the top right
- Your preference is saved automatically

### Using Undo/Redo
- **Undo**: Click the undo button (↶) or the note reverts to previous state
- **Redo**: Click the redo button (↷) to go forward in history
- Each note has its **own history**
- History is preserved when switching between notes

## 🛠️ Technical Stack

### Core Technologies
- **TypeScript 5.3**: Type-safe vanilla JavaScript
- **Chrome Extension Manifest V3**: Latest extension platform
- **Native Browser APIs**: Zero external dependencies

### Browser APIs Used
- **BroadcastChannel API**: Cross-tab synchronization
- **localStorage**: Persistent data storage
- **ContentEditable API**: Rich text editing
- **Chrome Extension APIs**: Side panel, context menus, tabs

### Architecture Highlights
- **Event-driven state management**: Centralized StateManager with event emitter pattern
- **Component-based architecture**: Editor, Toolbar, NotesList, Toast components
- **Modular CSS**: Separate files for variables, themes, layout, and components
- **Note-level storage**: Efficient per-note localStorage keys for fast access
- **In-memory caching**: Map-based cache for O(1) lookups

### Code Quality
- **Strict TypeScript**: Full type safety with strict mode
- **XSS protection**: Whitelist-based HTML sanitization
- **Memory management**: AbortController for proper cleanup
- **Error handling**: Comprehensive try-catch with user-friendly error messages
- **Performance monitoring**: Built-in profiling for optimization

## 📋 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + B` | Bold selected text |
| `Ctrl/Cmd + I` | Italicize selected text |
| `Ctrl/Cmd + U` | Underline selected text |
| `Ctrl/Cmd + S` | Manually save current note |

## 🏗️ Project Structure

```
├── src/
│   ├── components/          # UI components
│   │   ├── Editor.ts        # Rich text editor
│   │   ├── Toolbar.ts       # Formatting toolbar
│   │   ├── NotesList.ts     # Sidebar notes list
│   │   ├── DeletePopup.ts   # Deletion confirmation
│   │   └── Toast.ts         # Notifications
│   ├── core/                # Core systems
│   │   ├── state.ts         # Central state management
│   │   ├── storage.ts       # localStorage abstraction
│   │   └── broadcast.ts     # Cross-tab sync
│   ├── utils/               # Utility functions
│   │   ├── debounce.ts      # Debounce helper
│   │   ├── sanitize.ts      # HTML sanitization
│   │   └── url.ts           # URL/site extraction
│   ├── types.ts             # TypeScript type definitions
│   ├── constants.ts         # App constants
│   └── main.ts              # Application entry point
├── styles/
│   ├── variables.css        # CSS custom properties
│   ├── themes.css           # Dark/light themes
│   ├── layout.css           # Layout & grid
│   └── components.css       # Component styles
├── background.js            # Service worker
├── index.html               # Main UI
├── manifest.json            # Extension manifest
└── tsconfig.json            # TypeScript config
```

## 🎯 Development Goals Achieved

This project was built as a intermediate developer challenge to demonstrate:

✅ **Vanilla code expertise** - Zero frameworks, pure TypeScript
✅ **Modern browser APIs** - BroadcastChannel, ContentEditable, localStorage
✅ **Cross-tab synchronization** - Real-time updates across tabs
✅ **Persistent storage** - Data survives browser sessions
✅ **Rich text editing** - Full formatting capabilities
✅ **Clean architecture** - Modular, maintainable, production-ready code
✅ **Responsive design** - Works on all screen sizes
✅ **Error handling** - Graceful failure and user feedback
✅ **Bonus features** - Dark/light themes, undo/redo, site grouping

## 🤝 Contributing

This was a coding challenge submission, but suggestions and feedback are welcome!

---

**Built with ❤️ and vanilla TypeScript** by a developer who believes native browser APIs are underrated.
