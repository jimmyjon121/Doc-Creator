// Background service worker for the extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Family First Program Extractor installed');
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        // Open the extension popup programmatically (Chrome doesn't allow this directly)
        // Instead, we'll open the tool in a new tab
        chrome.tabs.create({ url: 'http://localhost:8000' });
    }
});

// Optional: Create context menu for right-click extraction
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'extractProgramInfo',
        title: 'Extract Program Info for Family First',
        contexts: ['page', 'selection']
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'extractProgramInfo') {
        // Open popup or extract directly
        chrome.action.openPopup();
    }
});