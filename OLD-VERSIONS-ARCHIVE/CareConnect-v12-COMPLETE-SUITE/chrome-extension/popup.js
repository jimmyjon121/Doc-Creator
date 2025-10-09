document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const openToolBtn = document.getElementById('openToolBtn');
    const copyBtn = document.getElementById('copyBtn');
    const statusDiv = document.getElementById('status');
    const previewDiv = document.getElementById('preview');
    const copySection = document.getElementById('copySection');
    const programNameInput = document.getElementById('programNameInput');
    const phoneInput = document.getElementById('phoneInput');
    const locationInput = document.getElementById('locationInput');
    const updatePreviewBtn = document.getElementById('updatePreviewBtn');
    
    // Store the extracted data globally for editing
    let currentExtractedData = null;
    let currentTabUrl = null;
    
    // Listen for progress updates
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'extractionProgress') {
            // Update progress bar
            const progressBar = document.getElementById('progressBar');
            const progressDetails = document.getElementById('progressDetails');
            const liveStatus = document.getElementById('liveStatus');
            const statusMessages = document.getElementById('statusMessages');
            
            if (progressBar && message.progress) {
                progressBar.style.width = message.progress + '%';
            }
            
            // Update main progress text
            if (message.details && message.details.current && message.details.total) {
                const progressSpan = document.getElementById('progress');
                if (progressSpan) {
                    progressSpan.textContent = `(${message.details.current}/${message.details.total} pages)`;
                }
                
                if (progressDetails) {
                    progressDetails.textContent = `Analyzing page ${message.details.current} of ${message.details.total}: ${message.details.pageName || ''}`;
                }
            } else if (progressDetails && message.message) {
                progressDetails.textContent = message.message;
            }
            
            // Show live status updates
            if (liveStatus && statusMessages && message.message) {
                liveStatus.style.display = 'block';
                
                // Add timestamp
                const timestamp = new Date().toLocaleTimeString();
                const statusLine = document.createElement('div');
                statusLine.style.marginBottom = '2px';
                statusLine.innerHTML = `<span style="color: #6b7280; font-size: 10px;">${timestamp}</span> ${message.message}`;
                
                statusMessages.appendChild(statusLine);
                
                // Auto-scroll to bottom
                liveStatus.scrollTop = liveStatus.scrollHeight;
                
                // Keep only last 10 messages
                while (statusMessages.children.length > 10) {
                    statusMessages.removeChild(statusMessages.firstChild);
                }
            }
            
            // Show final stats if extraction is complete
            if (message.progress === 100 && message.details) {
                const stats = message.details;
                if (progressDetails && stats.pagesAnalyzed) {
                    progressDetails.innerHTML = `
                        <strong>✅ Extraction Complete!</strong><br>
                        📄 Pages analyzed: ${stats.pagesAnalyzed}<br>
                        💊 Therapies found: ${stats.therapiesFound}<br>
                        🎯 Specializations: ${stats.specializationsFound}<br>
                        📞 Contact info: ${stats.contactsFound} items
                    `;
                }
            }
        }
    });
    
    // Sanitize input helper
    function sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        // Remove HTML tags and dangerous characters
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    
    // Handle update preview button
    updatePreviewBtn.addEventListener('click', function() {
        if (!currentExtractedData) return;
        
        // Update the structured data with sanitized user inputs
        if (currentExtractedData.structured) {
            currentExtractedData.structured.programName = sanitizeInput(programNameInput.value) || currentExtractedData.structured.programName;
            currentExtractedData.structured.phones = phoneInput.value ? [sanitizeInput(phoneInput.value)] : currentExtractedData.structured.phones;
            currentExtractedData.structured.location = sanitizeInput(locationInput.value) || currentExtractedData.structured.location;
        }
        
        // Re-format and display the updated information
        const formattedInfo = formatExtractedInfo(currentExtractedData, currentTabUrl);
        previewDiv.textContent = formattedInfo;
        
        // Update storage
        chrome.storage.local.set({ 
            lastExtracted: formattedInfo,
            url: currentTabUrl
        });
        
        showStatus('✓ Preview updated!', 'success');
    });
    
    // Configuration - Simple approach for file-based usage
    // Users just need to open AppsCode.html in their browser
    async function getDocCreatorUrl() {
        // First, check if we already found it
        const stored = await chrome.storage.local.get('docCreatorUrl');
        if (stored.docCreatorUrl) {
            return stored.docCreatorUrl;
        }
        
        // Look for any tab with AppsCode.html open
        const tabs = await chrome.tabs.query({});
        const docCreatorTab = tabs.find(tab => 
            tab.url && tab.url.includes('AppsCode.html')
        );
        
        if (docCreatorTab) {
            // Save the URL for future use
            await chrome.storage.local.set({ docCreatorUrl: docCreatorTab.url });
            return docCreatorTab.url;
        }
        
        // If not found, return instructions
        return null;
    }
    
    // Open Doc Creator tool
    openToolBtn.addEventListener('click', async function() {
        const url = await getDocCreatorUrl();
        if (url) {
            chrome.tabs.create({ url: url });
        } else {
            showStatus('⚠️ Please open AppsCode.html in Chrome first, then try again.', 'error');
            // Show more detailed instructions
            setTimeout(() => {
                showStatus('💡 Tip: Double-click AppsCode.html from your Doc Creator folder to open it.', 'info');
            }, 3000);
        }
    });
    
    // Extract information from current page
    extractBtn.addEventListener('click', async function() {
        console.log('Extract button clicked!');
        extractBtn.disabled = true;
        extractBtn.innerHTML = 'Extracting... <span id="progress"></span>';
        statusDiv.style.display = 'none';
        copySection.style.display = 'none';
        
        // Show progress indicator
        const progressDiv = document.getElementById('extractionProgress');
        const progressDetails = document.getElementById('progressDetails');
        const progressBar = document.getElementById('progressBar');
        const liveStatus = document.getElementById('liveStatus');
        const statusMessages = document.getElementById('statusMessages');
        
        if (progressDiv) {
            progressDiv.style.display = 'block';
            progressDiv.style.backgroundColor = '#f0f9ff';
            progressDiv.style.border = '1px solid #0284c7';
            progressDiv.style.padding = '15px';
            
            if (progressBar) {
                progressBar.style.width = '5%';
                progressBar.style.backgroundColor = '#4f46e5';
            }
            
            if (progressDetails) {
                progressDetails.textContent = '🚀 Starting extraction...';
                progressDetails.style.color = '#075985';
            }
            
            if (liveStatus && statusMessages) {
                statusMessages.innerHTML = '';
                liveStatus.style.display = 'block';
            }
        }
        
        try {
            // Get current active tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            console.log('Sending extraction request to tab:', tab.id, tab.url);
            
            // Send message to content script to perform comprehensive extraction
            chrome.tabs.sendMessage(tab.id, { action: 'extractInfo' }, (response) => {
                console.log('Got response from content script:', response);
                if (chrome.runtime.lastError) {
                    const errorMsg = chrome.runtime.lastError.message;
                    if (errorMsg.includes('Could not establish connection')) {
                        showStatus('Error: Please reload the page and try again. The extension may need to be refreshed.', 'error');
                    } else {
                        showStatus('Error: ' + errorMsg, 'error');
                    }
                    console.error('Chrome runtime error:', chrome.runtime.lastError);
                    // Don't hide progress immediately - show error state
                    if (progressDetails) {
                        progressDetails.textContent = '❌ ' + errorMsg;
                        progressDetails.style.color = '#dc2626';
                    }
                    setTimeout(() => {
                        progressDiv.style.display = 'none';
                    }, 3000);
                    extractBtn.disabled = false;
                    extractBtn.textContent = 'Extract Page Info';
                } else if (response && response.error) {
                    // Handle errors from content script
                    showStatus(response.error, 'error');
                    console.error('Content script error:', response.details);
                    // Show error in progress area
                    if (progressDetails) {
                        progressDetails.textContent = '❌ ' + response.error;
                        progressDetails.style.color = '#dc2626';
                    }
                    setTimeout(() => {
                        progressDiv.style.display = 'none';
                    }, 3000);
                    extractBtn.disabled = false;
                    extractBtn.textContent = 'Extract Page Info';
                } else if (response && response.data) {
                    const extractedInfo = response.data;
                    
                    // Update progress based on extraction type
                    if (extractedInfo.pages && Object.keys(extractedInfo.pages).length > 1) {
                        progressDetails.textContent = `✅ Analyzed ${Object.keys(extractedInfo.pages).length} pages successfully!`;
                        progressBar.style.width = '100%';
                        
                        // Keep progress visible for 3 seconds
                        setTimeout(() => {
                            progressDiv.style.display = 'none';
                        }, 3000);
                    } else {
                        // Even for single page, show completion
                        progressDetails.textContent = '✅ Page analysis complete!';
                        progressBar.style.width = '100%';
                        
                        setTimeout(() => {
                            progressDiv.style.display = 'none';
                        }, 2000);
                    }
                    
                    // Store the extracted data for editing
                    currentExtractedData = extractedInfo;
                    currentTabUrl = tab.url;
                    
                    // Populate editable fields with extracted data
                    if (extractedInfo.structured) {
                        programNameInput.value = extractedInfo.structured.programName || '';
                        phoneInput.value = extractedInfo.structured.phones?.[0] || '';
                        locationInput.value = extractedInfo.structured.location || '';
                    }
                    
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
                    extractBtn.disabled = false;
                    extractBtn.textContent = 'Extract Page Info';
                } else {
                    showStatus('Failed to extract information from this page', 'error');
                    progressDiv.style.display = 'none';
                    extractBtn.disabled = false;
                    extractBtn.textContent = 'Extract Page Info';
                }
            });
        } catch (error) {
            console.error('Error:', error);
            showStatus('Error: ' + error.message, 'error');
            progressDiv.style.display = 'none';
            extractBtn.disabled = false;
            extractBtn.textContent = 'Extract Page Info';
        }
    });
    
    // Copy to Tool - Smart integration
    copyBtn.addEventListener('click', async function() {
        const textToCopy = previewDiv.textContent;
        
        try {
            // First, try to find an open Doc Creator tab
            const tabs = await chrome.tabs.query({});
            const docCreatorTab = tabs.find(tab => 
                tab.url && tab.url.includes('AppsCode.html')
            );
            
            if (docCreatorTab) {
                // Doc Creator is open - switch to that tab first
                chrome.tabs.update(docCreatorTab.id, { active: true }, () => {
                    // Small delay to ensure tab is focused
                    setTimeout(() => {
                        // Now inject script to send data
                        chrome.scripting.executeScript({
                            target: { tabId: docCreatorTab.id },
                            func: (programData) => {
                                // This runs in the context of the Doc Creator page
                                if (window.postMessage) {
                                    window.postMessage({
                                        type: 'PROGRAM_INFO_EXTRACTED',
                                        content: programData
                                    }, '*');
                                    
                                    // Scroll to top to see the modal
                                    window.scrollTo(0, 0);
                                }
                            },
                            args: [textToCopy]
                        }, () => {
                            if (chrome.runtime.lastError) {
                                // Fallback to clipboard
                                navigator.clipboard.writeText(textToCopy);
                                showStatus('✓ Copied to clipboard! Check Doc Creator...', 'success');
                            } else {
                                showStatus('✓ Sent to Doc Creator! Modal should be open with "Smart Format" button ready.', 'success');
                            }
                        });
                    }, 200);
                });
            } else {
                // No Doc Creator tab open - copy to clipboard and offer to open
                await navigator.clipboard.writeText(textToCopy);
                showStatus('✓ Copied to clipboard! Opening Doc Creator...', 'success');
                
                // Get the URL dynamically
                const docCreatorUrl = await getDocCreatorUrl();
                if (docCreatorUrl) {
                    setTimeout(() => {
                        chrome.tabs.create({ url: docCreatorUrl });
                    }, 1000);
                } else {
                    showStatus('✓ Copied! Now open AppsCode.html from your Doc Creator folder.', 'success');
                }
            }
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
    // Check if this is comprehensive data
    if (info.structured) {
        return formatComprehensiveInfo(info, url);
    }
    
    // Original formatting for single page
    let formatted = `PROGRAM INFORMATION EXTRACTED FROM: ${url}\n\n`;
    
    formatted += `Website: ${info.domain}\n`;
    formatted += `Page Title: ${info.title}\n`;
    
    if (info.metaDescription) {
        formatted += `Description: ${info.metaDescription}\n`;
    }
    
    // Add detected program info
    if (info.programType) {
        formatted += `Program Type: ${info.programType}\n`;
    }
    if (info.detectedAgeRange) {
        formatted += `Age Range: ${info.detectedAgeRange}\n`;
    }
    if (info.location) {
        formatted += `Location: ${info.location}\n`;
    }
    
    formatted += '\n--- CONTACT INFORMATION ---\n';
    if (info.primaryPhone) {
        formatted += `Primary Phone: ${info.primaryPhone}\n`;
    } else if (info.phones.length > 0) {
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

// Format comprehensive multi-page extraction data
function formatComprehensiveInfo(info, url) {
    const s = info.structured;
    const pageCount = Object.keys(info.pages).length;
    
    let formatted = `**COMPREHENSIVE PROGRAM PROFILE**\n`;
    formatted += `Extracted from ${pageCount} pages at ${info.domain}\n\n`;
    
    formatted += `**${s.programName.toUpperCase()}**\n\n`;
    
    formatted += `**PROGRAM OVERVIEW:**\n`;
    formatted += `Program Name: ${s.programName}\n`;
    formatted += `Location: ${s.location || 'Not specified'}\n`;
    
    if (s.phones.length > 0) {
        formatted += `Phone: ${s.phones[0]}\n`;
    }
    if (s.emails.length > 0) {
        formatted += `Email: ${s.emails[0]}\n`;
    }
    formatted += `Website: ${url}\n`;
    
    if (s.levelOfCare) {
        formatted += `Level of Care: ${s.levelOfCare}\n`;
    }
    
    formatted += `\n**TARGET POPULATION:**\n`;
    if (s.agesServed) {
        formatted += `Ages Served: ${s.agesServed}\n`;
    }
    
    if (s.specializations.length > 0) {
        formatted += `Specializations: ${s.specializations.join(', ')}\n`;
    }
    
    formatted += `\n**CLINICAL SERVICES:**\n`;
    if (s.therapies.length > 0) {
        formatted += `Therapeutic Modalities:\n`;
        s.therapies.forEach(therapy => {
            formatted += `• ${therapy}\n`;
        });
    }
    
    if (s.uniqueFeatures.length > 0) {
        formatted += `\n**WHAT MAKES THIS PROGRAM UNIQUE:**\n`;
        s.uniqueFeatures.forEach(feature => {
            formatted += `• ${feature}\n`;
        });
    }
    
    if (s.accreditations.length > 0) {
        formatted += `\n**ACCREDITATIONS:**\n`;
        formatted += s.accreditations.join(', ') + '\n';
    }
    
    // Removed: ADDITIONAL DETAILS FROM WEBSITE section
    // This was cluttering the output with redundant information
    // All relevant details are already in the structured sections above
    
    return formatted.trim();
}