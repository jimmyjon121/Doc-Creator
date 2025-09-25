// Content script that can interact with the page
// This runs in the context of web pages

console.log('Family First Program Extractor content script loaded');

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractInfo') {
        // Extract information from the page
        const extractedData = extractPageInfo();
        sendResponse({ data: extractedData });
        return true; // Keep message channel open for async response
    }
});

// Function to extract page information
function extractPageInfo() {
    const info = {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        url: window.location.href,
        domain: window.location.hostname,
        
        // Extract all text content
        headings: [],
        paragraphs: [],
        listItems: [],
        
        // Contact information
        phones: [],
        emails: [],
        addresses: []
    };
    
    // Get all headings
    document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
        const text = h.textContent.trim();
        if (text && text.length > 2) {
            info.headings.push({
                level: h.tagName,
                text: text
            });
        }
    });
    
    // Get all paragraphs
    document.querySelectorAll('p').forEach(p => {
        const text = p.textContent.trim();
        if (text && text.length > 20) {
            info.paragraphs.push(text);
        }
    });
    
    // Get all list items
    document.querySelectorAll('li').forEach(li => {
        const text = li.textContent.trim();
        if (text && text.length > 10) {
            info.listItems.push(text);
        }
    });
    
    // Extract all text for contact info search
    const allText = document.body.textContent || '';
    
    // Find phone numbers
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = allText.match(phoneRegex) || [];
    info.phones = [...new Set(phones)].slice(0, 5);
    
    // Find emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = allText.match(emailRegex) || [];
    info.emails = [...new Set(emails)]
        .filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('.css'))
        .slice(0, 5);
    
    // Find addresses (basic pattern)
    const addressElements = document.querySelectorAll('address, .address, [class*="address"], [id*="address"]');
    addressElements.forEach(el => {
        const text = el.textContent.trim();
        if (text) info.addresses.push(text);
    });
    
    // Look for specific sections
    info.sections = {};
    const sectionKeywords = {
        about: ['about', 'who we are', 'mission', 'overview'],
        services: ['services', 'programs', 'treatment', 'therapy'],
        approach: ['approach', 'philosophy', 'methodology', 'model'],
        admissions: ['admissions', 'contact', 'intake', 'enrollment'],
        ages: ['ages', 'age range', 'serve', 'population'],
        specialties: ['specialize', 'specialty', 'focus', 'expertise']
    };
    
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
        for (const keyword of keywords) {
            const elements = Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent.toLowerCase();
                return text.includes(keyword.toLowerCase()) && text.length < 1000;
            });
            
            if (elements.length > 0) {
                info.sections[section] = elements[0].textContent.trim().substring(0, 500);
                break;
            }
        }
    }
    
    // Detect therapies mentioned
    const therapyKeywords = ['DBT', 'CBT', 'EMDR', 'trauma', 'experiential', 'equine', 'art therapy', 'music therapy', 'family therapy', 'group therapy', 'individual therapy'];
    info.therapies = therapyKeywords.filter(therapy => 
        new RegExp(`\\b${therapy}\\b`, 'i').test(allText)
    );
    
    return info;
}

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