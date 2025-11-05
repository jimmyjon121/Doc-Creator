// popup-v3.js - Beautiful, modern popup controller for v13.0
// Hybrid AI-Enhanced Clinical Data Extraction

(function() {
    'use strict';
    
    // State
    let isExtracting = false;
    let extractedData = null;
    let clinicalWriteUp = '';
    let currentAIModel = 'none';
    
    // DOM Elements
    const elements = {
        extractBtn: document.getElementById('extractBtn'),
        settingsBtn: document.getElementById('settingsBtn'),
        aiModelStatus: document.getElementById('aiModelStatus'),
        metricsGrid: document.getElementById('metricsGrid'),
        fieldsCount: document.getElementById('fieldsCount'),
        pagesCount: document.getElementById('pagesCount'),
        dataPoints: document.getElementById('dataPoints'),
        confidence: document.getElementById('confidence'),
        progressSection: document.getElementById('progressSection'),
        progressPercent: document.getElementById('progressPercent'),
        progressFill: document.getElementById('progressFill'),
        progressMessage: document.getElementById('progressMessage'),
        activityFeed: document.getElementById('activityFeed'),
        activityItems: document.getElementById('activityItems'),
        actionButtons: document.getElementById('actionButtons'),
        copyBtn: document.getElementById('copyBtn'),
        sendBtn: document.getElementById('sendBtn'),
        statusContainer: document.getElementById('statusContainer')
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Popup] Initializing v13.0...');
        checkAIConfiguration();
        setupEventListeners();
        setupMessageListener();
    });
    
    // Check AI configuration
    async function checkAIConfiguration() {
        chrome.storage.local.get(['ai_model', 'claude_api_key', 'gpt4_api_key', 'gemini_api_key'], (result) => {
            currentAIModel = result.ai_model || 'none';
            
            let statusText = 'Rule-Based Engine (No AI)';
            let hasKey = false;
            
            if (currentAIModel === 'claude' && result.claude_api_key) {
                statusText = 'Claude 3 Sonnet';
                hasKey = true;
            } else if (currentAIModel === 'gpt4' && result.gpt4_api_key) {
                statusText = 'GPT-4 Turbo';
                hasKey = true;
            } else if (currentAIModel === 'gemini' && result.gemini_api_key) {
                statusText = 'Gemini Pro';
                hasKey = true;
            }
            
            if (currentAIModel !== 'none' && hasKey) {
                statusText = `AI: ${statusText}`;
            } else if (currentAIModel !== 'none' && !hasKey) {
                statusText = 'AI Model Selected (No API Key)';
                currentAIModel = 'none'; // Fall back to rule-based
            }
            
            elements.aiModelStatus.textContent = statusText;
        });
    }
    
    // Setup event listeners
    function setupEventListeners() {
        elements.extractBtn.addEventListener('click', startExtraction);
        elements.copyBtn.addEventListener('click', copyToClipboard);
        elements.sendBtn.addEventListener('click', sendToDocCreator);
        elements.settingsBtn.addEventListener('click', openSettings);
    }
    
    // Setup message listener for extraction progress
    function setupMessageListener() {
        chrome.runtime.onMessage.addListener((message) => {
            console.log('[Popup] Received message:', message);
            
            if (message.type === 'extraction-progress') {
                handleExtractionProgress(message);
            }
        });
    }
    
    // Start extraction
    async function startExtraction() {
        if (isExtracting) return;
        
        console.log('[Popup] Starting extraction...');
        isExtracting = true;
        
        // Reset UI
        resetUI();
        
        // Update button state
        elements.extractBtn.disabled = true;
        elements.extractBtn.classList.add('extracting');
        elements.extractBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="1s" repeatCount="indefinite"/>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                <path d="M12 6v6l4 2" opacity="0.3"/>
            </svg>
            <span>Analyzing...</span>
        `;
        
        // Show progress section
        elements.progressSection.classList.remove('hidden');
        elements.activityFeed.classList.remove('hidden');
        
        // Add initial activity
        addActivity('info', 'Starting extraction process...');
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.id) {
                throw new Error('No active tab found');
            }
            
            addActivity('check', `Target: ${new URL(tab.url).hostname}`);
            
            // First, inject the content script to ensure it's loaded
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['content-simple-v13.js']
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error('[Popup] Script injection failed:', chrome.runtime.lastError);
                    handleExtractionError('Failed to inject extraction script. Please refresh the page and try again.');
                    return;
                }
                
                // Wait a bit for the script to initialize
                setTimeout(() => {
                    // Send extraction request to content script
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'extract-v2',
                        config: {
                            aiModel: currentAIModel,
                            enhancedMode: true
                        }
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('[Popup] Message error:', chrome.runtime.lastError);
                            handleExtractionError('Communication error. Please try again.');
                        } else if (response && response.success) {
                            console.log('[Popup] Extraction started successfully');
                            if (response.data) {
                                // Immediate response with data
                                handleExtractionComplete(response);
                            }
                        } else if (response && !response.success) {
                            handleExtractionError(response.error || 'Extraction failed');
                        }
                    });
                }, 100);
            });
            
        } catch (error) {
            console.error('[Popup] Extraction error:', error);
            handleExtractionError(error.message);
        }
    }
    
    // Handle extraction progress updates
    function handleExtractionProgress(message) {
        if (message.status === 'complete' && message.data) {
            handleExtractionComplete({
                success: true,
                data: message.data,
                writeUp: message.writeUp,
                metrics: message.metrics
            });
        } else if (message.status === 'error') {
            handleExtractionError(message.message);
        } else if (message.progress) {
            // Update progress UI
            const progress = message.progress;
            
            if (progress.percent !== undefined) {
                elements.progressPercent.textContent = `${progress.percent}%`;
                elements.progressFill.style.width = `${progress.percent}%`;
            }
            
            if (progress.message) {
                elements.progressMessage.textContent = progress.message;
                addActivity('progress', progress.message);
            }
            
            // Update metrics if available
            if (message.metrics) {
                updateMetrics(message.metrics);
            }
        }
    }
    
    // Handle extraction complete
    function handleExtractionComplete(result) {
        console.log('[Popup] Extraction complete:', result);
        
        isExtracting = false;
        extractedData = result.data;
        clinicalWriteUp = result.writeUp || formatClinicalWriteUp(result.data);
        
        // Update metrics
        if (result.metrics) {
            updateMetrics(result.metrics);
        }
        
        // Show metrics
        elements.metricsGrid.classList.remove('hidden');
        
        // Update progress to 100%
        elements.progressPercent.textContent = '100%';
        elements.progressFill.style.width = '100%';
        elements.progressMessage.textContent = 'Analysis complete!';
        
        // Add completion activity
        addActivity('success', 'Extraction completed successfully');
        if (result.metrics && result.metrics.aiEnhanced) {
            addActivity('ai', `AI enhancement applied (${result.metrics.aiModel})`);
        }
        
        // Enable action buttons
        elements.actionButtons.classList.remove('hidden');
        elements.copyBtn.disabled = false;
        elements.sendBtn.disabled = false;
        
        // Reset extract button
        elements.extractBtn.disabled = false;
        elements.extractBtn.classList.remove('extracting');
        elements.extractBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
            </svg>
            <span>Analysis Complete!</span>
        `;
        
        // Show success status
        if (result.warning) {
            showStatus(result.warning, 'warning');
        } else {
            showStatus('Clinical documentation ready!', 'success');
        }
        
        // Reset button after 3 seconds
        setTimeout(() => {
            elements.extractBtn.innerHTML = `
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3V18H12V3H9M12 5L16 9L12 13V5M5 3V18H8V3H5Z" transform="rotate(90 12 12)"/>
                </svg>
                <span>Analyze Treatment Program</span>
            `;
        }, 3000);
    }
    
    // Handle extraction error
    function handleExtractionError(error) {
        console.error('[Popup] Extraction failed:', error);
        
        isExtracting = false;
        
        // Reset button
        elements.extractBtn.disabled = false;
        elements.extractBtn.classList.remove('extracting');
        elements.extractBtn.innerHTML = `
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            <span>Extraction Failed</span>
        `;
        
        // Update progress
        elements.progressMessage.textContent = 'Extraction failed';
        addActivity('error', error);
        
        // Show error status
        showStatus(error, 'error');
        
        // Reset button after 3 seconds
        setTimeout(() => {
            elements.extractBtn.innerHTML = `
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 3V18H12V3H9M12 5L16 9L12 13V5M5 3V18H8V3H5Z" transform="rotate(90 12 12)"/>
                </svg>
                <span>Analyze Treatment Program</span>
            `;
        }, 3000);
    }
    
    // Update metrics display
    function updateMetrics(metrics) {
        if (metrics.fieldsFound !== undefined) {
            elements.fieldsCount.textContent = metrics.fieldsFound;
        }
        if (metrics.pagesScanned !== undefined) {
            elements.pagesCount.textContent = metrics.pagesScanned;
        }
        if (metrics.uniqueDataPoints !== undefined) {
            const count = typeof metrics.uniqueDataPoints === 'object' ? 
                          metrics.uniqueDataPoints.size || Object.keys(metrics.uniqueDataPoints).length : 
                          metrics.uniqueDataPoints;
            elements.dataPoints.textContent = count;
        }
        if (metrics.confidence !== undefined) {
            elements.confidence.textContent = `${metrics.confidence}%`;
        }
    }
    
    // Add activity to feed
    function addActivity(type, message) {
        const icons = {
            info: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
            check: '<path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>',
            progress: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>',
            success: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>',
            error: '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>',
            ai: '<path d="M21 11V9h-2V7c0-1.1-.9-2-2-2h-2V3h-2v2h-2V3H9v2H7c-1.1 0-2 .9-2 2v2H3v2h2v2H3v2h2v2c0 1.1.9 2 2 2h2v2h2v-2h2v2h2v-2h2c1.1 0 2-.9 2-2v-2h2v-2h-2v-2h2zm-4 6H7V7h10v10z"/>'
        };
        
        const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        
        const activityHTML = `
            <div class="activity-item">
                <svg class="activity-icon" fill="currentColor" viewBox="0 0 24 24">
                    ${icons[type] || icons.info}
                </svg>
                <span class="activity-text">${message}</span>
                <span class="activity-time">${time}</span>
            </div>
        `;
        
        elements.activityItems.insertAdjacentHTML('afterbegin', activityHTML);
        
        // Keep only last 10 activities
        const items = elements.activityItems.querySelectorAll('.activity-item');
        if (items.length > 10) {
            items[items.length - 1].remove();
        }
    }
    
    // Copy to clipboard
    function copyToClipboard() {
        if (!clinicalWriteUp) return;
        
        navigator.clipboard.writeText(clinicalWriteUp).then(() => {
            showStatus('Clinical documentation copied to clipboard!', 'success');
            
            // Update button temporarily
            elements.copyBtn.innerHTML = `
                <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                </svg>
                <span>Copied!</span>
            `;
            
            setTimeout(() => {
                elements.copyBtn.innerHTML = `
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                    </svg>
                    <span>Copy</span>
                `;
            }, 2000);
        }).catch(err => {
            console.error('[Popup] Copy failed:', err);
            showStatus('Failed to copy to clipboard', 'error');
        });
    }
    
    // Send to Doc Creator
    function sendToDocCreator() {
        if (!extractedData || !clinicalWriteUp) return;
        
        // Send message to Doc Creator
        chrome.runtime.sendMessage({
            type: 'send-to-doc-creator',
            data: extractedData,
            writeUp: clinicalWriteUp
        }, (response) => {
            if (response && response.success) {
                showStatus('Data sent to Doc Creator!', 'success');
                
                // Update button temporarily
                elements.sendBtn.innerHTML = `
                    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z"/>
                    </svg>
                    <span>Sent!</span>
                `;
                
                setTimeout(() => {
                    elements.sendBtn.innerHTML = `
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                        </svg>
                        <span>Send to Doc Creator</span>
                    `;
                }, 2000);
            } else {
                showStatus('Failed to send to Doc Creator', 'error');
            }
        });
    }
    
    // Open settings
    function openSettings() {
        chrome.runtime.openOptionsPage();
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        const statusHTML = `
            <div class="status-message status-${type}">
                ${message}
            </div>
        `;
        
        elements.statusContainer.innerHTML = statusHTML;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            elements.statusContainer.innerHTML = '';
        }, 5000);
    }
    
    // Reset UI
    function resetUI() {
        extractedData = null;
        clinicalWriteUp = '';
        
        elements.metricsGrid.classList.add('hidden');
        elements.progressSection.classList.add('hidden');
        elements.activityFeed.classList.add('hidden');
        elements.actionButtons.classList.add('hidden');
        elements.statusContainer.innerHTML = '';
        elements.activityItems.innerHTML = '';
        
        // Reset metrics
        elements.fieldsCount.textContent = '0';
        elements.pagesCount.textContent = '0';
        elements.dataPoints.textContent = '0';
        elements.confidence.textContent = '0%';
        
        // Reset progress
        elements.progressPercent.textContent = '0%';
        elements.progressFill.style.width = '0%';
        elements.progressMessage.textContent = 'Initializing...';
    }
    
    // Format clinical write-up (fallback)
    function formatClinicalWriteUp(data) {
        if (!data) return '';
        
        let writeUp = '='.repeat(70) + '\n';
        writeUp += 'CLINICAL AFTERCARE RECOMMENDATION\n';
        writeUp += '='.repeat(70) + '\n\n';
        
        writeUp += `PROGRAM: ${data.name || 'Treatment Program'}\n`;
        if (data.location) {
            writeUp += `LOCATION: ${data.location.city || ''}${data.location.city && data.location.state ? ', ' : ''}${data.location.state || ''}\n`;
        }
        writeUp += `WEBSITE: ${data.website || window.location.hostname}\n\n`;
        
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            writeUp += 'LEVELS OF CARE:\n';
            data.levelsOfCare.forEach(level => {
                writeUp += `  - ${level}\n`;
            });
            writeUp += '\n';
        }
        
        if (data.contact) {
            writeUp += 'CONTACT INFORMATION:\n';
            if (data.contact.phone) writeUp += `  Phone: ${data.contact.phone}\n`;
            if (data.contact.email) writeUp += `  Email: ${data.contact.email}\n`;
            writeUp += '\n';
        }
        
        writeUp += '-'.repeat(70) + '\n';
        writeUp += `Assessment Date: ${new Date().toLocaleDateString()}\n`;
        
        return writeUp;
    }
    
})();
