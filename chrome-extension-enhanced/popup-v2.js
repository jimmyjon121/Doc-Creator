// popup-v2.js - Enhanced Clinical Intel Interface
// Version 11.0 - Multi-AI Support with Superior Rule-Based Extraction

let extractedData = null;
let clinicalWriteUp = '';
let activityLog = [];
let currentAIModel = null;
let extractionMetrics = {
    fieldsFound: 0,
    pagesScanned: 0,
    uniqueDataPoints: 0,
    confidence: 0,
    extractionDepth: {
        clinical: 0,
        administrative: 0,
        differentiators: 0,
        quality: 0
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    const elements = {
        extractBtn: document.getElementById('extractBtn'),
        btnText: document.getElementById('btnText'),
        
        // AI Selector
        aiSelector: document.getElementById('aiSelector'),
        aiModelName: document.getElementById('aiModelName'),
        aiStatus: document.getElementById('aiStatus'),
        
        // Metrics Dashboard
        metricsDashboard: document.getElementById('metricsDashboard'),
        fieldsFound: document.getElementById('fieldsFound'),
        pagesScanned: document.getElementById('pagesScanned'),
        uniqueData: document.getElementById('uniqueData'),
        confidence: document.getElementById('confidence'),
        
        // Progress
        progressStatus: document.getElementById('progressStatus'),
        progressPercent: document.getElementById('progressPercent'),
        progressFill: document.getElementById('progressFill'),
        
        // Activity Feed
        activityFeed: document.getElementById('activityFeed'),
        activityItems: document.getElementById('activityItems'),
        
        // Data Preview
        dataPreview: document.getElementById('dataPreview'),
        previewContent: document.getElementById('previewContent'),
        qualityScore: document.getElementById('qualityScore'),
        
        // Actions
        actionsSection: document.getElementById('actionsSection'),
        copyBtn: document.getElementById('copyBtn'),
        sendBtn: document.getElementById('sendBtn'),
        
        // Status
        statusMessage: document.getElementById('statusMessage')
    };
    
    // Check for configured AI models
    await checkAIConfiguration(elements);
    
    // Listen for progress updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extraction-progress') {
            handleExtractionProgress(request, elements);
        } else if (request.action === 'extraction-metrics') {
            updateMetrics(request.metrics, elements);
        }
    });
    
    // Extract button handler
    elements.extractBtn.addEventListener('click', async () => {
        await startExtraction(elements);
    });
    
    // Copy button handler
    elements.copyBtn.addEventListener('click', () => {
        copyToClipboard(elements);
    });
    
    // Send to Doc Creator handler
    elements.sendBtn.addEventListener('click', () => {
        sendToDocCreator(elements);
    });
});

async function checkAIConfiguration(elements) {
    return new Promise((resolve) => {
        chrome.storage.local.get(['ai_config'], (result) => {
            if (result.ai_config) {
                const config = result.ai_config;
                
                // Check which AI is configured
                if (config.gemini_api_key) {
                    currentAIModel = 'Gemini Pro';
                    elements.aiModelName.textContent = 'Gemini Pro';
                    elements.aiStatus.textContent = 'Ready for enhanced extraction';
                } else if (config.openai_api_key) {
                    currentAIModel = 'GPT-4 Turbo';
                    elements.aiModelName.textContent = 'GPT-4 Turbo';
                    elements.aiStatus.textContent = 'Ready for enhanced extraction';
                } else if (config.anthropic_api_key) {
                    currentAIModel = 'Claude 3';
                    elements.aiModelName.textContent = 'Claude 3';
                    elements.aiStatus.textContent = 'Ready for enhanced extraction';
                } else if (config.ollama_enabled) {
                    currentAIModel = 'Ollama (Local)';
                    elements.aiModelName.textContent = 'Ollama (Local)';
                    elements.aiStatus.textContent = 'Using local model';
                } else {
                    currentAIModel = null;
                    elements.aiModelName.textContent = 'Rule-Based Only';
                    elements.aiStatus.textContent = 'Using advanced pattern matching';
                }
                
                elements.aiSelector.style.display = 'block';
            } else {
                elements.aiModelName.textContent = 'Rule-Based Only';
                elements.aiStatus.textContent = 'Configure AI in settings for enhanced results';
                elements.aiSelector.style.display = 'block';
            }
            resolve();
        });
    });
}

async function startExtraction(elements) {
    // Reset UI
    resetUI(elements);
    
    // Update button state
    elements.extractBtn.disabled = true;
    elements.extractBtn.classList.add('extracting');
    elements.btnText.textContent = 'Analyzing...';
    
    // Show metrics and activity
    elements.metricsDashboard.style.display = 'block';
    elements.activityFeed.style.display = 'block';
    
    // Add initial activity
    addActivity('Initializing extraction engine...', 'info', elements);
    
    try {
        // Get current tab
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!tab || !tab.id) {
            throw new Error('No active tab found');
        }
        
        const hostname = new URL(tab.url).hostname;
        addActivity(`Target: ${hostname}`, 'info', elements);
        
        // Update progress
        updateProgress(5, 'Loading extraction engine...', elements);
        
        // Try to send message to content script
        let response;
        
        try {
            response = await chrome.tabs.sendMessage(tab.id, { 
                action: 'extract-v2',
                config: {
                    aiModel: currentAIModel,
                    enhancedMode: true
                }
            });
        } catch (messageError) {
            // Content script not loaded, inject it
            addActivity('Injecting extraction engine...', 'info', elements);
            
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['extractor-v11.js']
                });
                
                // Wait for initialization
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Try again
                response = await chrome.tabs.sendMessage(tab.id, { 
                    action: 'extract-v2',
                    config: {
                        aiModel: currentAIModel,
                        enhancedMode: true
                    }
                });
            } catch (injectError) {
                throw new Error('Failed to inject extraction engine');
            }
        }
        
        if (response && response.success && response.data) {
            extractedData = response.data;
            
            // Show final metrics
            updateMetrics(response.metrics || {}, elements);
            
            // Generate clinical write-up
            updateProgress(90, 'Generating clinical documentation...', elements);
            clinicalWriteUp = formatClinicalWriteUp(extractedData);
            
            // Show preview
            elements.previewContent.textContent = clinicalWriteUp;
            elements.qualityScore.textContent = `${response.metrics?.confidence || 0}%`;
            elements.dataPreview.style.display = 'block';
            
            // Show actions
            elements.actionsSection.style.display = 'flex';
            
            // Complete
            updateProgress(100, 'Analysis complete!', elements);
            addActivity('Extraction completed successfully', 'success', elements);
            
            // Show success message
            showStatus('Analysis complete! Clinical documentation ready.', 'success', elements);
        } else {
            throw new Error(response?.error || 'Extraction failed');
        }
    } catch (error) {
        console.error('Extraction error:', error);
        addActivity(`Error: ${error.message}`, 'error', elements);
        showStatus(error.message, 'error', elements);
    } finally {
        // Reset button
        elements.extractBtn.disabled = false;
        elements.extractBtn.classList.remove('extracting');
        elements.btnText.textContent = 'Analyze Treatment Program';
    }
}

function handleExtractionProgress(request, elements) {
    const { phase, current, total, message, metrics } = request;
    
    // Update progress based on phase
    let baseProgress = 0;
    switch(phase) {
        case 'discovery':
            baseProgress = 10;
            addActivity(`Discovering pages: Found ${total} relevant pages`, 'info', elements);
            break;
        case 'crawling':
            baseProgress = 20 + (current / total) * 40; // 20-60%
            addActivity(`Analyzing page ${current}/${total}: ${message}`, 'info', elements);
            break;
        case 'extraction':
            baseProgress = 60 + (current / total) * 20; // 60-80%
            addActivity(`Extracting: ${message}`, 'info', elements);
            break;
        case 'ai-enhancement':
            baseProgress = 80;
            addActivity(`AI Enhancement: ${message}`, 'info', elements);
            break;
        case 'consolidation':
            baseProgress = 90;
            addActivity('Consolidating findings...', 'info', elements);
            break;
    }
    
    updateProgress(Math.round(baseProgress), message, elements);
    
    // Update metrics if provided
    if (metrics) {
        updateMetrics(metrics, elements);
    }
}

function updateMetrics(metrics, elements) {
    if (metrics.fieldsFound !== undefined) {
        elements.fieldsFound.textContent = metrics.fieldsFound;
        extractionMetrics.fieldsFound = metrics.fieldsFound;
    }
    if (metrics.pagesScanned !== undefined) {
        elements.pagesScanned.textContent = metrics.pagesScanned;
        extractionMetrics.pagesScanned = metrics.pagesScanned;
    }
    if (metrics.uniqueDataPoints !== undefined) {
        elements.uniqueData.textContent = metrics.uniqueDataPoints;
        extractionMetrics.uniqueDataPoints = metrics.uniqueDataPoints;
    }
    if (metrics.confidence !== undefined) {
        elements.confidence.textContent = `${metrics.confidence}%`;
        extractionMetrics.confidence = metrics.confidence;
    }
}

function updateProgress(percent, status, elements) {
    elements.progressPercent.textContent = `${percent}%`;
    elements.progressFill.style.width = `${percent}%`;
    elements.progressStatus.textContent = status;
}

function addActivity(message, type, elements) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    const activityItem = document.createElement('div');
    activityItem.className = `activity-item ${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : '→';
    
    activityItem.innerHTML = `
        <span class="activity-icon">${icon}</span>
        <div class="activity-text">${message}</div>
        <div class="activity-time">${timeStr}</div>
    `;
    
    elements.activityItems.insertBefore(activityItem, elements.activityItems.firstChild);
    
    // Keep only last 10 activities
    while (elements.activityItems.children.length > 10) {
        elements.activityItems.removeChild(elements.activityItems.lastChild);
    }
}

function showStatus(message, type, elements) {
    elements.statusMessage.className = `status-message status-${type}`;
    elements.statusMessage.textContent = message;
    elements.statusMessage.style.display = 'flex';
    
    if (type === 'success') {
        setTimeout(() => {
            elements.statusMessage.style.display = 'none';
        }, 5000);
    }
}

function resetUI(elements) {
    // Reset metrics
    elements.fieldsFound.textContent = '0';
    elements.pagesScanned.textContent = '0';
    elements.uniqueData.textContent = '0';
    elements.confidence.textContent = '0%';
    
    // Reset progress
    elements.progressPercent.textContent = '0%';
    elements.progressFill.style.width = '0%';
    elements.progressStatus.textContent = 'Initializing...';
    
    // Clear activity
    elements.activityItems.innerHTML = '';
    
    // Hide preview and actions
    elements.dataPreview.style.display = 'none';
    elements.actionsSection.style.display = 'none';
    elements.statusMessage.style.display = 'none';
}

function copyToClipboard(elements) {
    if (!clinicalWriteUp) return;
    
    navigator.clipboard.writeText(clinicalWriteUp).then(() => {
        showStatus('Clinical documentation copied to clipboard!', 'success', elements);
        elements.copyBtn.innerHTML = `
            <span>✓</span>
            <span>Copied!</span>
        `;
        
        setTimeout(() => {
            elements.copyBtn.innerHTML = `
                <span>📋</span>
                <span>Copy to Clipboard</span>
            `;
        }, 2000);
    }).catch(err => {
        showStatus('Failed to copy to clipboard', 'error', elements);
    });
}

async function sendToDocCreator(elements) {
    if (!clinicalWriteUp) return;
    
    try {
        // First copy to clipboard
        await navigator.clipboard.writeText(clinicalWriteUp);
        
        // Find or create Doc Creator tab
        const tabs = await chrome.tabs.query({});
        let docCreatorTab = null;
        
        // Look for Doc Creator tab
        const docCreatorUrls = [
            'file:///AppsCode-DeluxeCMS.html',
            'http://localhost',
            'http://127.0.0.1'
        ];
        
        for (const tab of tabs) {
            if (docCreatorUrls.some(url => tab.url?.includes(url))) {
                docCreatorTab = tab;
                break;
            }
        }
        
        if (docCreatorTab) {
            // Focus the tab
            await chrome.tabs.update(docCreatorTab.id, { active: true });
            await chrome.windows.update(docCreatorTab.windowId, { focused: true });
            
            showStatus('Data sent to Doc Creator! Use Ctrl+V to paste.', 'success', elements);
        } else {
            showStatus('Doc Creator not found. Data copied to clipboard - paste with Ctrl+V', 'warning', elements);
        }
        
        // Update button
        elements.sendBtn.innerHTML = `
            <span>✓</span>
            <span>Sent!</span>
        `;
        
        setTimeout(() => {
            elements.sendBtn.innerHTML = `
                <span>🚀</span>
                <span>Send to Doc Creator</span>
            `;
        }, 2000);
    } catch (error) {
        showStatus('Failed to send data. Please copy manually.', 'error', elements);
    }
}

// Enhanced Clinical Write-Up Formatter
function formatClinicalWriteUp(data) {
    const lines = [];
    const wrapWidth = 65;
    
    // Helper function for text wrapping
    const wrapText = (text, width = wrapWidth) => {
        if (!text) return [];
        const words = text.split(' ');
        const wrapped = [];
        let currentLine = '';
        
        for (const word of words) {
            if ((currentLine + ' ' + word).length <= width) {
                currentLine = currentLine ? `${currentLine} ${word}` : word;
            } else {
                if (currentLine) wrapped.push(currentLine);
                currentLine = word;
            }
        }
        if (currentLine) wrapped.push(currentLine);
        return wrapped;
    };
    
    // Header
    lines.push('='.repeat(70));
    lines.push(`CLINICAL AFTERCARE RECOMMENDATION`);
    lines.push('='.repeat(70));
    lines.push('');
    
    // Program Name and Location
    if (data.name) {
        lines.push(`PROGRAM: ${data.name.toUpperCase()}`);
        if (data.city && data.state) {
            lines.push(`LOCATION: ${data.city}, ${data.state}`);
        }
        lines.push('');
    }
    
    // Levels of Care
    if (data.levelsOfCare?.length > 0) {
        lines.push('LEVELS OF CARE:');
        data.levelsOfCare.forEach(level => {
            lines.push(`  - ${level}`);
        });
        lines.push('');
    }
    
    // Why This Program (Key Differentiators)
    if (data.differentiators?.length > 0) {
        lines.push('WHY THIS PROGRAM:');
        data.differentiators.slice(0, 5).forEach(diff => {
            const wrapped = wrapText(diff, 63);
            wrapped.forEach((line, i) => {
                lines.push(i === 0 ? `  - ${line}` : `    ${line}`);
            });
        });
        lines.push('');
    }
    
    // Population Served
    lines.push('POPULATION SERVED:');
    if (data.population?.ages) {
        lines.push(`  - Ages: ${data.population.ages}`);
    }
    if (data.population?.gender) {
        lines.push(`  - Gender: ${data.population.gender}`);
    }
    if (data.environment?.setting) {
        lines.push(`  - Setting: ${data.environment.setting}`);
    }
    lines.push('');
    
    // Clinical Programming
    if (data.clinical) {
        lines.push('CLINICAL PROGRAMMING:');
        
        if (data.clinical.specializations?.length > 0) {
            lines.push('  Specializations:');
            data.clinical.specializations.slice(0, 5).forEach(spec => {
                lines.push(`    - ${spec}`);
            });
        }
        
        if (data.clinical.evidenceBased?.length > 0) {
            lines.push('  Evidence-Based Modalities:');
            lines.push(`    ${data.clinical.evidenceBased.join(', ')}`);
        }
        
        if (data.clinical.experiential?.length > 0) {
            lines.push('  Experiential Therapies:');
            lines.push(`    ${data.clinical.experiential.join(', ')}`);
        }
        lines.push('');
    }
    
    // Program Structure
    if (data.structure) {
        const items = [];
        if (data.structure.los) items.push(`Length: ${data.structure.los}`);
        if (data.structure.capacity) items.push(`Capacity: ${data.structure.capacity}`);
        if (data.structure.ratio) items.push(`Staff Ratio: ${data.structure.ratio}`);
        
        if (items.length > 0) {
            lines.push('PROGRAM STRUCTURE:');
            items.forEach(item => lines.push(`  - ${item}`));
            lines.push('');
        }
    }
    
    // Academic Support
    if (data.structure?.academics?.hasProgram) {
        lines.push('ACADEMIC SUPPORT:');
        const acad = data.structure.academics;
        if (acad.accreditation) lines.push(`  - Accreditation: ${acad.accreditation}`);
        if (acad.grades) lines.push(`  - Grades Served: ${acad.grades}`);
        if (acad.iep504) lines.push(`  - IEP/504 Support Available`);
        lines.push('');
    }
    
    // Family Program
    if (data.family?.weeklyTherapy || data.family?.workshops) {
        lines.push('FAMILY INVOLVEMENT:');
        if (data.family.weeklyTherapy) lines.push('  - Weekly family therapy sessions');
        if (data.family.workshops) lines.push('  - Family workshops/education program');
        lines.push('');
    }
    
    // Contact Information
    lines.push('CONTACT INFORMATION:');
    if (data.admissions?.phone) {
        lines.push(`  Phone: ${data.admissions.phone}`);
    }
    if (data.admissions?.email) {
        lines.push(`  Email: ${data.admissions.email}`);
    }
    if (data.website) {
        lines.push(`  Website: ${data.website}`);
    }
    lines.push('');
    
    // Quality Indicators
    lines.push('-'.repeat(70));
    lines.push(`Assessment Date: ${new Date().toLocaleDateString()}`);
    lines.push(`Data Confidence: ${extractionMetrics.confidence}%`);
    lines.push(`Pages Analyzed: ${extractionMetrics.pagesScanned}`);
    lines.push(`Unique Data Points: ${extractionMetrics.uniqueDataPoints}`);
    
    return lines.join('\n');
}
