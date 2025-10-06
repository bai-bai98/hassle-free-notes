/**
 * Background service worker for Hassle Free Notes
 * Handles context menu and side panel
 */

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'open-notes',
    title: 'Open Hassle Free Notes',
    contexts: ['page', 'selection', 'link', 'image']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'open-notes') {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(err => {
      console.error('Error opening side panel:', err);

      chrome.windows.create({
        url: 'index.html',
        type: 'popup',
        width: 900,
        height: 700
      });
    });
  }
});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId }).catch(err => {
    console.error('Error opening side panel:', err);
  });
});
