// Content script that can interact with the page
// This runs in the context of web pages

console.log('Family First Program Extractor content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractInfo') {
        // Additional extraction logic can go here if needed
        sendResponse({ status: 'ready' });
    }
});

// Optional: Add a floating button to pages for quick extraction
function addExtractionButton() {
    const button = document.createElement('button');
    button.innerHTML = '📋';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #0099cc;
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: none;
    `;
    
    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.body.appendChild(button);
    
    // Show button on relevant pages
    const url = window.location.href.toLowerCase();
    const keywords = ['treatment', 'therapy', 'residential', 'program', 'adolescent', 'teen', 'youth'];
    
    if (keywords.some(keyword => url.includes(keyword) || document.body.textContent.toLowerCase().includes(keyword))) {
        button.style.display = 'block';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addExtractionButton);
} else {
    addExtractionButton();
}