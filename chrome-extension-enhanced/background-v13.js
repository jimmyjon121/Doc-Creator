// background-v13.js - Service worker for Chrome Extension v13

console.log('[Background] CareConnect v13 service worker started');

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
    console.log('[Background] Extension installed/updated:', details.reason);
    
    // Set default settings if first install
    if (details.reason === 'install') {
        chrome.storage.local.set({
            ai_model: 'none',
            extraction_mode: 'hybrid'
        }, () => {
            console.log('[Background] Default settings initialized');
        });
    }
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('[Background] Received message:', request.type || request.action);
    
    // Forward extraction progress to popup
    if (request.type === 'extraction-progress') {
        // Send to all popups
        chrome.runtime.sendMessage(request).catch(() => {
            // Popup might not be open, that's ok
        });
    }
    
    // Handle send to Doc Creator
    if (request.type === 'send-to-doc-creator') {
        // In a real implementation, this would send data to the Doc Creator
        // For now, just acknowledge
        sendResponse({ success: true });
        return true;
    }
});

// Handle extension icon click (backup if popup doesn't load)
chrome.action.onClicked.addListener((tab) => {
    console.log('[Background] Extension icon clicked for tab:', tab.id);
    
    // This only fires if no popup is set, but good to have as backup
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content-simple-v13.js']
    }, () => {
        if (chrome.runtime.lastError) {
            console.error('[Background] Failed to inject script:', chrome.runtime.lastError);
        } else {
            console.log('[Background] Content script injected successfully');
        }
    });
});

console.log('[Background] Service worker ready');
