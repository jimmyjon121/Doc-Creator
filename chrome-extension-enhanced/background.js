// background.js - Professional Extension v4.0

console.log('Family First Pro Extractor v4.0 - Background Service Worker Active');

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed/updated to v4.0');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getTabInfo') {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            sendResponse({ tab: tabs[0] });
        });
        return true;
    }
});