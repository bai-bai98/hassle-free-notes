# Senior Developer Challenge: Multi-Tab Note-Taking App

## Overview

In this challenge, you'll build a browser-based note-taking application that works across multiple browser tabs using vanilla code and native browser APIs. This challenge is designed to test your expertise with core programming concepts and modern browser capabilities without relying on external libraries or frameworks.

## Challenge Requirements

### Core Functionality

1. **Cross-Tab Synchronization**

   - Implement real-time synchronization of notes across multiple browser tabs
   - Use the BroadcastChannel API to communicate changes between tabs
   - Any changes made in one tab should immediately reflect in all other open tabs

2. **Persistent Storage**

   - Store all notes using localStorage or IndexedDB (your choice)
   - Notes must persist across browser sessions and page reloads
   - Implement proper error handling for storage failures

3. **Text Editor**

   - Create a simple yet functional text editor for note content
   - Implement basic text formatting (bold, italic, bullet lists)
   - Use the ContentEditable API or create your own implementation

4. **Note Management**
   - Allow users to create, edit, and delete notes
   - Display a list/sidebar of all available notes
   - Include timestamps for creation and last modification

### Technical Requirements

- **Choose one language option**:
  - Vanilla JavaScript (ES6+)
  - TypeScript
  - Dart
- **No external libraries or frameworks** allowed (except TypeScript/Dart compilers if using those languages)
- **Browser API focus** - Demonstrate proficiency with native browser APIs
- **Responsive design** - Application should work on various screen sizes
- **Clean code** - Well-organized, commented, and maintainable code structure
- **Error handling** - Gracefully handle edge cases and potential errors

### Testing Requirements (Optional)

Tests are optional but highly encouraged. If you choose to implement tests, create a set of tests to verify your application works correctly:

1. **Test Structure**

   - Organize tests in a `/tests` directory
   - Create a browser-based test runner

2. **Test Coverage**

   - Storage operations (save, retrieve, delete)
   - BroadcastChannel communication
   - UI component functionality
   - End-to-end workflows

3. **Testing Utilities**
   - Implement custom assertion helpers
   - Create mocks for browser APIs where needed

## Bonus Points (if time allows)

- Create a dark/light theme toggle
- Implement undo/redo functionality
- Deploy the application to a CDN like Cloudflare Pages, Vercel, or Netlify

## Submission Guidelines

### CodeSubmit

Please organize, design, test and document your code as if it were going into production - then push your changes to the master branch. After you have pushed your code, you may submit the assignment on the assignment page.

All the best and happy coding,

The Klar! Team
