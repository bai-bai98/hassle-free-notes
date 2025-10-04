/**
 * Background service worker for Klar! Notes
 * Handles context menu and side panel
 */

// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu item
  chrome.contextMenus.create({
    id: 'open-notes',
    title: 'Open Hassle Free Notes',
    contexts: ['page', 'selection', 'link', 'image']
  });

  console.log('Hassle Free Notes: Context menu created');
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-notes') {
    // Open side panel
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(err => {
      console.error('Error opening side panel:', err);

      // Fallback: open as popup in new window if side panel fails
      chrome.windows.create({
        url: 'index.html',
        type: 'popup',
        width: 900,
        height: 700
      });
    });
  }
});

// Handle extension icon click - toggle side panel
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(err => {
    console.error('Error opening side panel:', err);
  });
});
