document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const openToolBtn = document.getElementById('openToolBtn');
    const copyBtn = document.getElementById('copyBtn');
    const statusDiv = document.getElementById('status');
    const previewDiv = document.getElementById('preview');
    const copySection = document.getElementById('copySection');
    
    // Open Doc Creator tool
    openToolBtn.addEventListener('click', function() {
        // Update this URL to wherever you host the tool
        chrome.tabs.create({ url: 'http://localhost:8000' });
    });
    
    // Extract information from current page
    extractBtn.addEventListener('click', async function() {
        extractBtn.disabled = true;
        extractBtn.innerHTML = '<span class="spinner"></span> Extracting...';
        statusDiv.style.display = 'none';
        copySection.style.display = 'none';
        
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            // Check if chrome.scripting is available
            if (chrome.scripting && chrome.scripting.executeScript) {
                // Use the new scripting API
                const results = await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: extractPageInfo,
                });
                
                if (results && results[0] && results[0].result) {
                    const extractedInfo = results[0].result;
                    
                    // Format the extracted information
                    const formattedInfo = formatExtractedInfo(extractedInfo, tab.url);
                    
                    // Show preview
                    previewDiv.textContent = formattedInfo;
                    copySection.style.display = 'block';
                    
                    // Store in extension storage for easy access
                    chrome.storage.local.set({ 
                        lastExtracted: formattedInfo,
                        url: tab.url
                    });
                    
                    showStatus('✓ Information extracted successfully!', 'success');
                } else {
                    showStatus('Failed to extract information from this page', 'error');
                }
            } else {
                // Fallback: Use message passing to content script
                chrome.tabs.sendMessage(tab.id, { action: 'extractInfo' }, function(response) {
                    if (chrome.runtime.lastError) {
                        showStatus('Error: Please reload the page and try again', 'error');
                        console.error(chrome.runtime.lastError);
                    } else if (response && response.data) {
                        const formattedInfo = formatExtractedInfo(response.data, tab.url);
                        
                        // Show preview
                        previewDiv.textContent = formattedInfo;
                        copySection.style.display = 'block';
                        
                        // Store in extension storage
                        chrome.storage.local.set({ 
                            lastExtracted: formattedInfo,
                            url: tab.url
                        });
                        
                        showStatus('✓ Information extracted successfully!', 'success');
                    } else {
                        showStatus('Failed to extract information', 'error');
                    }
                });
            }
        } catch (error) {
            console.error('Error:', error);
            showStatus('Error: ' + error.message, 'error');
        } finally {
            extractBtn.disabled = false;
            extractBtn.textContent = 'Extract Page Info';
        }
    });
    
    // Copy to clipboard
    copyBtn.addEventListener('click', async function() {
        const textToCopy = previewDiv.textContent;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            showStatus('✓ Copied to clipboard! Now paste into Doc Creator.', 'success');
            
            // Optionally open the tool
            setTimeout(() => {
                if (confirm('Open Doc Creator to paste the information?')) {
                    chrome.tabs.create({ url: 'http://localhost:8000' });
                }
            }, 1000);
        } catch (error) {
            showStatus('Failed to copy to clipboard', 'error');
        }
    });
    
    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = 'status ' + type;
        statusDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
});

// Function that runs in the page context to extract information
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

// Format the extracted information for pasting
function formatExtractedInfo(info, url) {
    let formatted = `PROGRAM INFORMATION EXTRACTED FROM: ${url}\n\n`;
    
    formatted += `Website: ${info.domain}\n`;
    formatted += `Page Title: ${info.title}\n`;
    
    if (info.metaDescription) {
        formatted += `Description: ${info.metaDescription}\n`;
    }
    
    formatted += '\n--- CONTACT INFORMATION ---\n';
    if (info.phones.length > 0) {
        formatted += `Phone Numbers: ${info.phones.join(', ')}\n`;
    }
    if (info.emails.length > 0) {
        formatted += `Email Addresses: ${info.emails.join(', ')}\n`;
    }
    if (info.addresses.length > 0) {
        formatted += `Addresses Found:\n${info.addresses.join('\n')}\n`;
    }
    
    formatted += '\n--- KEY SECTIONS ---\n';
    for (const [section, content] of Object.entries(info.sections)) {
        if (content) {
            formatted += `\n${section.toUpperCase()}:\n${content}\n`;
        }
    }
    
    if (info.therapies.length > 0) {
        formatted += `\n--- THERAPIES/MODALITIES DETECTED ---\n`;
        formatted += info.therapies.join(', ') + '\n';
    }
    
    formatted += '\n--- MAIN CONTENT ---\n\n';
    
    // Add key headings
    const importantHeadings = info.headings.slice(0, 10);
    if (importantHeadings.length > 0) {
        formatted += 'Key Headings:\n';
        importantHeadings.forEach(h => {
            formatted += `• ${h.text}\n`;
        });
        formatted += '\n';
    }
    
    // Add relevant paragraphs
    const relevantParagraphs = info.paragraphs
        .filter(p => p.length > 50 && p.length < 500)
        .slice(0, 10);
    
    if (relevantParagraphs.length > 0) {
        formatted += 'Program Information:\n';
        relevantParagraphs.forEach(p => {
            formatted += `\n${p}\n`;
        });
    }
    
    // Add list items (often features)
    const features = info.listItems
        .filter(item => item.length > 20 && item.length < 200)
        .slice(0, 20);
    
    if (features.length > 0) {
        formatted += '\nFeatures/Services:\n';
        features.forEach(f => {
            formatted += `• ${f}\n`;
        });
    }
    
    return formatted;
}