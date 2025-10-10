// Simple Content Script - Reliable Version
// This is a fallback that ensures basic extraction always works

(function() {
    // Check if already loaded
    if (window.__FF_SIMPLE_CONTENT_LOADED__) {
        console.log('Simple content script already loaded');
        return;
    }
    window.__FF_SIMPLE_CONTENT_LOADED__ = true;

    console.log('Family First Program Extractor - Simple version loaded');

    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Received message:', request.action);
        
        if (request.action === 'ping' || request.action === 'testConnection') {
            sendResponse({ status: 'ok', version: 'simple' });
            return false;
        }
        
        if (request.action === 'extractInfo') {
            try {
                // Perform basic extraction
                const extractedData = extractBasicInfo();
                console.log('Extraction completed');
                sendResponse({ data: extractedData });
            } catch (error) {
                console.error('Extraction error:', error);
                sendResponse({ 
                    error: 'Extraction failed: ' + error.message,
                    fallbackData: getFallbackData()
                });
            }
            return true; // Keep channel open for async
        }
        
        return false;
    });

    // Basic extraction function that always works
    function extractBasicInfo() {
        const data = {
        programName: '',
        location: '',
        phone: '',
        email: '',
        website: window.location.href,
        title: document.title,
        metaDescription: '',
        headings: [],
        paragraphs: [],
        phones: [],
        emails: [],
        addresses: [],
        sections: {},
        extractedAt: new Date().toISOString()
    };
    
    // Extract program name
    data.programName = extractProgramName();
    
    // Extract meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        data.metaDescription = metaDesc.content;
    }
    
    // Extract headings
    document.querySelectorAll('h1, h2, h3').forEach(h => {
        const text = h.textContent.trim();
        if (text && text.length > 2 && text.length < 200) {
            data.headings.push({
                level: h.tagName,
                text: text
            });
        }
    });
    
    // Extract paragraphs
    document.querySelectorAll('p').forEach((p, index) => {
        if (index > 100) return; // Limit to first 100 paragraphs
        const text = p.textContent.trim();
        if (text && text.length > 30 && text.length < 1000) {
            data.paragraphs.push(text);
        }
    });
    
    // Extract contact info
    const bodyText = document.body.innerText || document.body.textContent || '';
    
    // Find phones
    const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = bodyText.match(phoneRegex) || [];
    data.phones = [...new Set(phones)].slice(0, 5);
    if (data.phones.length > 0) {
        data.phone = data.phones[0];
    }
    
    // Find emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = bodyText.match(emailRegex) || [];
    data.emails = [...new Set(emails)]
        .filter(e => !e.includes('.png') && !e.includes('.jpg'))
        .slice(0, 5);
    if (data.emails.length > 0) {
        data.email = data.emails[0];
    }
    
    // Find addresses
    const addressElements = document.querySelectorAll('address, .address, [class*="address"]');
    addressElements.forEach(el => {
        const text = el.textContent.trim();
        if (text && text.length > 10 && text.length < 200) {
            data.addresses.push(text);
        }
    });
    if (data.addresses.length > 0) {
        data.location = data.addresses[0];
    }
    
    // Extract key sections
    const sectionKeywords = {
        about: ['about', 'mission', 'who we are'],
        services: ['services', 'programs', 'treatment'],
        approach: ['approach', 'philosophy', 'methodology'],
        contact: ['contact', 'location', 'address']
    };
    
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
        for (const keyword of keywords) {
            const elements = Array.from(document.querySelectorAll('h1, h2, h3, h4')).filter(el => {
                return el.textContent.toLowerCase().includes(keyword);
            });
            
            if (elements.length > 0) {
                let content = '';
                let currentElement = elements[0].nextElementSibling;
                let charCount = 0;
                
                while (currentElement && charCount < 500) {
                    if (currentElement.tagName === 'P' || currentElement.tagName === 'UL') {
                        const text = currentElement.textContent.trim();
                        if (text) {
                            content += text + ' ';
                            charCount += text.length;
                        }
                    }
                    if (/^H[1-6]$/.test(currentElement.tagName)) break;
                    currentElement = currentElement.nextElementSibling;
                }
                
                if (content.trim()) {
                    data.sections[section] = content.trim().substring(0, 500);
                    break;
                }
            }
        }
    }
    
    // Add extraction stats
    data.stats = {
        headingsFound: data.headings.length,
        paragraphsFound: data.paragraphs.length,
        phonesFound: data.phones.length,
        emailsFound: data.emails.length,
        sectionsFound: Object.keys(data.sections).length
    };
    
    return data;
    }

    // Extract program name with multiple strategies
    function extractProgramName() {
    // Try meta tags first
    const metaTags = [
        document.querySelector('meta[property="og:site_name"]'),
        document.querySelector('meta[property="og:title"]'),
        document.querySelector('meta[name="application-name"]')
    ];
    
    for (const meta of metaTags) {
        if (meta && meta.content) {
            const name = meta.content.trim();
            if (name && name.length > 2 && name.length < 100) {
                return name.replace(/\s*[-|]\s*(Home|Homepage|Welcome).*$/i, '');
            }
        }
    }
    
    // Try H1
    const h1 = document.querySelector('h1');
    if (h1) {
        const text = h1.textContent.trim();
        if (text && text.length > 2 && text.length < 100) {
            if (/treatment|recovery|center|academy|healthcare/i.test(text)) {
                return text;
            }
        }
    }
    
    // Try domain name
    const domain = window.location.hostname.replace('www.', '').split('.')[0];
    return domain.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
    }

    // Fallback data if extraction fails
    function getFallbackData() {
    return {
        programName: document.title || 'Unknown Program',
        website: window.location.href,
        message: 'Basic extraction completed. Please refresh the page for full extraction.',
        title: document.title,
        url: window.location.href
        };
    }

    console.log('Simple content script ready for extraction');

})(); // End of wrapper function
