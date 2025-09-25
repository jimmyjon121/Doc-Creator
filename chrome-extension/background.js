// Background service worker for the extension

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Family First Program Extractor installed');
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'openPopup') {
        chrome.tabs.create({ url: 'http://localhost:8000' });
        return;
    }
    
    if (request.action === 'fetchRelatedPages') {
        handleMultiPageFetch(request.links || [])
            .then(result => sendResponse(result))
            .catch(error => {
                console.error('Background fetch error:', error);
                sendResponse({ error: error.message });
            });
        return true; // Keep message channel open for async response
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

async function handleMultiPageFetch(links) {
    const uniqueLinks = [...new Set(links)].slice(0, 20);
    const pages = [];
    const total = uniqueLinks.length;
    let index = 0;
    
    for (const url of uniqueLinks) {
        index++;
        const progress = 25 + Math.round((index / Math.max(1, total)) * 40);
        chrome.runtime.sendMessage({
            action: 'extractionProgress',
            message: `🛰️ Fetching ${index}/${total}: ${url}`,
            progress,
            details: {
                current: index,
                total,
                url,
                pageName: url
            }
        });
        
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            const response = await fetch(url, {
                method: 'GET',
                cache: 'no-store',
                credentials: 'omit',
                redirect: 'follow',
                signal: controller.signal
            });
            clearTimeout(timeout);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const html = await response.text();
            pages.push({ url, html });
        } catch (error) {
            console.error(`Failed to fetch ${url}:`, error);
            chrome.runtime.sendMessage({
                action: 'extractionProgress',
                message: `⚠️ Failed to fetch ${url}: ${error.message}`,
                progress,
                details: {
                    current: index,
                    total,
                    url,
                    error: error.message
                }
            });
        }
    }
    
    chrome.runtime.sendMessage({
        action: 'extractionProgress',
        message: `✅ Background fetch complete (${pages.length}/${total})`,
        progress: 70,
        details: { current: total, total }
    });
    
    return { pages };
}