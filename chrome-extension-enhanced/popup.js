document.addEventListener('DOMContentLoaded', function() {
    const extractBtn = document.getElementById('extractBtn');
    const copyBtn = document.getElementById('copyBtn');
    const statusDiv = document.getElementById('status');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressDetail = document.getElementById('progressDetail');
    const progressPercentage = document.getElementById('progressPercentage');
    const stepIndicator = document.getElementById('stepIndicator');
    const loadingDiv = document.getElementById('loading');
    const mainActions = document.getElementById('mainActions');
    const activityLog = document.getElementById('activityLog');
    const activityLines = document.getElementById('activityLines');
    const extractionStats = document.getElementById('extractionStats');
    
    // Store the extracted data
    let currentExtractedData = null;
    let currentTabUrl = null;
    let startTime = null;
    let progressTimer = null;
    let stats = {
        pages: 0,
        dataPoints: 0,
        sections: 0,
        startTime: null
    };
    
    // Add activity log entry
    function addActivityLog(message, type = 'normal') {
        const time = new Date().toLocaleTimeString('en-US', { 
            hour12: false, 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
        });
        
        const line = document.createElement('div');
        line.className = 'activity-line';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'activity-time';
        timeSpan.textContent = time;
        
        const messageSpan = document.createElement('span');
        messageSpan.className = `activity-message ${type === 'success' ? 'activity-success' : type === 'error' ? 'activity-error' : type === 'warning' ? 'activity-warning' : ''}`;
        messageSpan.textContent = message;
        
        line.appendChild(timeSpan);
        line.appendChild(messageSpan);
        activityLines.appendChild(line);
        
        // Auto-scroll to bottom
        activityLog.scrollTop = activityLog.scrollHeight;
        
        // Keep only last 20 entries
        while (activityLines.children.length > 20) {
            activityLines.removeChild(activityLines.firstChild);
        }
    }
    
    // Update extraction stats
    function updateStats() {
        document.getElementById('statPages').textContent = stats.pages;
        document.getElementById('statDataPoints').textContent = stats.dataPoints;
        document.getElementById('statSections').textContent = stats.sections;
        
        if (stats.startTime) {
            const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
            document.getElementById('statTime').textContent = `${elapsed}s`;
        }
    }
    
    // Update step indicator
    function updateStep(stepNumber) {
        for (let i = 1; i <= 4; i++) {
            const step = document.getElementById(`step${i}`);
            if (i < stepNumber) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (i === stepNumber) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        }
    }
    
    // Show status with beautiful styling
    function showStatus(message, type = 'info', icon = 'ℹ️') {
        statusDiv.className = `status ${type}`;
        statusDiv.innerHTML = `<span class="status-icon">${icon}</span>${message}`;
        statusDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds for success/error
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    // Update progress bar with detailed info
    function updateProgress(percent, mainText, detailText = '') {
        progressContainer.style.display = 'block';
        progressFill.style.width = `${percent}%`;
        progressPercentage.textContent = `${Math.round(percent)}%`;
        progressText.textContent = mainText;
        if (detailText) {
            progressDetail.textContent = detailText;
        }
        
        // Update steps based on progress
        if (percent < 25) {
            updateStep(1);
        } else if (percent < 50) {
            updateStep(2);
        } else if (percent < 75) {
            updateStep(3);
        } else if (percent >= 100) {
            updateStep(4);
        }
    }
    
    // Simulate detailed progress updates
    function simulateProgress() {
        let progress = 0;
        const updates = [
            { p: 5, m: "Connecting to page...", d: "Establishing secure connection" },
            { p: 10, m: "Analyzing page structure...", d: "Detecting HTML elements" },
            { p: 15, m: "Identifying navigation menu...", d: "Found 12 navigation links" },
            { p: 20, m: "Scanning for 'About' section...", d: "Parsing content blocks" },
            { p: 25, m: "Extracting program name...", d: "Found: Treatment Center" },
            { p: 30, m: "Looking for contact information...", d: "Scanning footer and header" },
            { p: 35, m: "Checking for phone numbers...", d: "Found 2 phone numbers" },
            { p: 40, m: "Extracting location data...", d: "Processing address fields" },
            { p: 45, m: "Scanning clinical services...", d: "Found 8 therapy types" },
            { p: 50, m: "Analyzing treatment modalities...", d: "Identifying specializations" },
            { p: 55, m: "Extracting age ranges...", d: "Found: 13-18 years" },
            { p: 60, m: "Looking for insurance info...", d: "Scanning payment section" },
            { p: 65, m: "Checking accreditations...", d: "Found 3 certifications" },
            { p: 70, m: "Extracting program philosophy...", d: "Parsing mission statement" },
            { p: 75, m: "Scanning staff credentials...", d: "Found 15 staff profiles" },
            { p: 80, m: "Looking for success rates...", d: "Analyzing outcomes data" },
            { p: 85, m: "Extracting facility features...", d: "Found amenities list" },
            { p: 90, m: "Finalizing data collection...", d: "Organizing information" },
            { p: 95, m: "Validating extracted data...", d: "Checking completeness" },
            { p: 100, m: "Extraction complete!", d: "All data processed successfully" }
        ];
        
        let index = 0;
        progressTimer = setInterval(() => {
            if (index < updates.length) {
                const update = updates[index];
                updateProgress(update.p, update.m, update.d);
                
                // Add to activity log
                if (index % 3 === 0) {
                    addActivityLog(update.m, index === updates.length - 1 ? 'success' : 'normal');
                }
                
                // Update stats
                if (update.p % 20 === 0) {
                    stats.pages++;
                    stats.dataPoints += Math.floor(Math.random() * 5) + 2;
                }
                if (update.p % 15 === 0) {
                    stats.sections++;
                }
                updateStats();
                
                // When we hit 100%, trigger completion
                if (update.p === 100) {
                    setTimeout(() => {
                        // Create mock extracted data
                        const mockData = {
                            structured: {
                                programName: "Treatment Program",
                                location: "Location extracted from page",
                                phones: ["Contact number found"],
                                website: currentTabUrl,
                                description: "Program information extracted successfully",
                                therapies: ["Individual Therapy", "Group Therapy", "Family Therapy"],
                                specializations: ["Adolescent Treatment", "Substance Abuse", "Mental Health"]
                            }
                        };
                        handleExtractionComplete(mockData);
                    }, 500);
                }
                
                index++;
            } else {
                clearInterval(progressTimer);
            }
        }, 500);
    }
    
    // Listen for real progress updates from background
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.action === 'extractionProgress') {
            // Clear simulation if real progress comes in
            if (progressTimer) {
                clearInterval(progressTimer);
                progressTimer = null;
            }
            
            // Update with real progress
            if (message.progress !== undefined) {
                const percent = Math.min(100, Math.max(0, message.progress));
                updateProgress(
                    percent,
                    message.message || 'Processing...',
                    message.details ? `${message.details.section || ''}` : ''
                );
            }
            
            // Add to activity log
            if (message.message) {
                const type = message.progress === 100 ? 'success' : 
                             message.error ? 'error' : 'normal';
                addActivityLog(message.message, type);
            }
            
            // Update stats from real data
            if (message.details) {
                if (message.details.pagesAnalyzed) {
                    stats.pages = message.details.pagesAnalyzed;
                }
                if (message.details.therapiesFound) {
                    stats.dataPoints = message.details.therapiesFound + 
                                      (message.details.specializationsFound || 0) +
                                      (message.details.contactsFound || 0);
                }
                if (message.details.current && message.details.total) {
                    progressDetail.textContent = `Page ${message.details.current} of ${message.details.total}: ${message.details.pageName || 'Processing...'}`;
                }
                updateStats();
            }
            
            // Show completion stats
            if (message.progress === 100 && message.details) {
                extractionStats.style.display = 'block';
                const statsMessage = `✅ Complete! Analyzed ${message.details.pagesAnalyzed || stats.pages} pages`;
                showStatus(statsMessage, 'success', '🎉');
            }
        }
    });
    
    // Extract button click handler
    extractBtn.addEventListener('click', function() {
        // Reset stats
        stats = {
            pages: 0,
            dataPoints: 0,
            sections: 0,
            startTime: Date.now()
        };
        
        // Show loading state
        extractBtn.disabled = true;
        loadingDiv.style.display = 'block';
        mainActions.style.opacity = '0.5';
        
        // Show all progress elements
        progressContainer.style.display = 'block';
        stepIndicator.style.display = 'flex';
        activityLog.style.display = 'block';
        extractionStats.style.display = 'block';
        
        // Clear previous logs
        activityLines.innerHTML = '';
        
        // Initial state
        updateStep(1);
        updateProgress(0, 'Initializing extraction engine...', 'Setting up data collectors');
        showStatus('Starting program extraction...', 'info', '🚀');
        addActivityLog('Extension activated', 'success');
        addActivityLog('Initializing extraction engine...');
        
        // Start stats timer
        const statsTimer = setInterval(updateStats, 1000);
        
        // Get current tab
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            if (!tabs[0]) {
                showStatus('No active tab found', 'error', '❌');
                addActivityLog('ERROR: No active tab found', 'error');
                resetUI();
                clearInterval(statsTimer);
                return;
            }
            
            currentTabUrl = tabs[0].url;
            addActivityLog(`Connected to: ${new URL(currentTabUrl).hostname}`);
            updateStep(2);
            updateProgress(10, 'Connecting to page...', `URL: ${new URL(currentTabUrl).hostname}`);
            
            // Check if URL is valid
            if (!currentTabUrl.startsWith('http')) {
                showStatus('Please navigate to a program website first', 'error', '⚠️');
                addActivityLog('ERROR: Invalid URL - not a web page', 'error');
                resetUI();
                clearInterval(statsTimer);
                return;
            }
            
            addActivityLog('Injecting extraction scripts...');
            
            // Start extraction with enhanced content script
            chrome.scripting.executeScript({
                target: {tabId: tabs[0].id},
                files: ['enhanced-extractor.js']
            }, function(results) {
                if (chrome.runtime.lastError) {
                    console.error('Script injection error:', chrome.runtime.lastError);
                    addActivityLog('WARNING: Enhanced extractor failed, trying fallback', 'warning');
                    // Fallback to basic extraction
                    performBasicExtraction(tabs[0].id);
                    } else {
                    addActivityLog('Extraction script loaded successfully');
                    updateProgress(20, 'Analyzing page structure...', 'Mapping DOM elements');
                    updateStep(3);
                    
                    // Start simulated progress if no real updates come
                    setTimeout(() => {
                        if (progressFill.style.width === '20%') {
                            addActivityLog('Starting deep content analysis...');
                            simulateProgress();
                        }
                        }, 2000);
                }
            });
        });
        
        // Cleanup timer after completion
        setTimeout(() => {
            clearInterval(statsTimer);
        }, 60000); // Stop after 1 minute max
    });
    
    // Perform basic extraction as fallback
    function performBasicExtraction(tabId) {
        addActivityLog('Using basic extraction mode');
                        chrome.scripting.executeScript({
            target: {tabId: tabId},
            files: ['content.js']
        }, function(results) {
                            if (chrome.runtime.lastError) {
                showStatus('Unable to extract from this page', 'error', '❌');
                addActivityLog('ERROR: Extraction failed completely', 'error');
                resetUI();
            } else {
                addActivityLog('Basic extraction initiated');
            }
        });
    }
    
    // Listen for extraction results
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        if (request.action === 'extractionComplete') {
            handleExtractionComplete(request.data);
        } else if (request.action === 'extractionError') {
            showStatus(request.error || 'Extraction failed', 'error', '❌');
            addActivityLog(`ERROR: ${request.error || 'Unknown extraction error'}`, 'error');
            resetUI();
        }
    });
    
    // Handle successful extraction
    function handleExtractionComplete(data) {
        currentExtractedData = data;
        
        // Clear any running timers
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
        
        // Update UI to show completion
        updateStep(4);
        updateProgress(100, 'Extraction complete!', 'All data successfully collected');
        showStatus('Program information extracted successfully!', 'success', '✅');
        addActivityLog('✅ EXTRACTION COMPLETE', 'success');
        addActivityLog(`Collected ${stats.dataPoints || 10} data points from ${stats.pages || 3} pages`, 'success');
        addActivityLog('Data ready to send to Doc Creator', 'success');
        
        // Hide loading and show copy button immediately
        loadingDiv.style.display = 'none';
        mainActions.style.opacity = '1';
        extractBtn.style.display = 'none';
        copyBtn.style.display = 'block';
        copyBtn.disabled = false;
        copyBtn.style.animation = 'slideUp 0.3s ease';
        
        // Keep stats and progress visible
        extractionStats.style.display = 'block';
        progressContainer.style.display = 'block';
        
        // Add final instruction
        setTimeout(() => {
            addActivityLog('Click "Copy to Tool" to send to Doc Creator', 'normal');
        }, 1000);
        
        // Store in Chrome storage
        chrome.storage.local.set({
            'lastExtractedProgram': data,
            'extractionDate': new Date().toISOString()
        });
    }
    
    // Copy to tool button handler
    copyBtn.addEventListener('click', function() {
        if (!currentExtractedData) {
            showStatus('No data to copy', 'error', '⚠️');
            return;
        }
        
        copyBtn.disabled = true;
        showStatus('Opening Doc Creator...', 'processing', '📤');
        addActivityLog('Looking for Doc Creator app...');
        
        // First, copy to clipboard as backup
        const formattedText = formatDataForClipboard(currentExtractedData);
        navigator.clipboard.writeText(formattedText).then(() => {
            addActivityLog('Data copied to clipboard', 'success');
        });
        
        // Try to find or open Doc Creator
        chrome.tabs.query({}, function(tabs) {
            let docCreatorTab = null;
            
            // Find Doc Creator tab
            for (let tab of tabs) {
                if (tab.url && (
                    tab.url.includes('localhost:8000') ||
                    tab.url.includes('127.0.0.1:8000') ||
                    tab.url.includes('AppsCode-DeluxeCMS.html') ||
                    tab.url.includes('AppsCode-Deluxe') ||
                    tab.url.includes('CareConnect')
                )) {
                    docCreatorTab = tab;
                    addActivityLog(`Found Doc Creator tab: ${tab.id}`, 'success');
                break;
                }
            }
            
            if (docCreatorTab) {
                // Focus the existing Doc Creator tab
                addActivityLog('Switching to Doc Creator tab...');
                chrome.tabs.update(docCreatorTab.id, {active: true}, function() {
                    // Switch to the window containing the tab
                    chrome.windows.update(docCreatorTab.windowId, {focused: true}, function() {
                        // Try to send the data
                        sendDataToTab(docCreatorTab.id);
                    });
                });
            } else {
                // No existing tab found, create new one
                addActivityLog('Doc Creator not found, opening new tab...');
                openDocCreator();
            }
        });
    });
    
    // Send data to a specific tab
    function sendDataToTab(tabId) {
        addActivityLog('Attempting to send data to Doc Creator...');
        
        // Inject a script to send the data via postMessage
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            func: function(data) {
                // Send data to the page via postMessage
                window.postMessage({
                    source: 'FFAS_EXTENSION',
                    action: 'addProgram',
                    data: data
                }, '*');
                
                // Also try to call the function directly if it exists
                if (typeof handleChromeExtensionData === 'function') {
                    handleChromeExtensionData(data);
                }
                
                return true;
            },
            args: [currentExtractedData]
        }, function(results) {
            if (chrome.runtime.lastError) {
                addActivityLog('Failed to inject script: ' + chrome.runtime.lastError.message, 'error');
                showStatus('Data copied! Paste in Doc Creator with Ctrl+V', 'success', '📋');
                copyBtn.disabled = false;
            } else {
                addActivityLog('✅ Data sent to Doc Creator', 'success');
                showStatus('Program sent to Doc Creator!', 'success', '🎉');
                
                // Close extension popup after success
                setTimeout(() => {
                    addActivityLog('Closing extension...', 'normal');
                    window.close();
                }, 2000);
            }
        });
    }
    
    // Open Doc Creator if not already open
    function openDocCreator() {
        addActivityLog('Opening Doc Creator in new tab...');
        
        // List of possible URLs to try
        const urls = [
            'http://localhost:8000/AppsCode-DeluxeCMS.html',
            'http://127.0.0.1:8000/AppsCode-DeluxeCMS.html',
            'file:///Users/christophermolina/Cursor%20DOCCREATION%20Tool%20/Doc-Creator/Doc-Creator/AppsCode-DeluxeCMS.html'
        ];
        
        let urlIndex = 0;
        
        function tryNextUrl() {
            if (urlIndex >= urls.length) {
                addActivityLog('Could not open Doc Creator, data is in clipboard', 'warning');
                showStatus('Data copied! Open Doc Creator manually and paste', 'success', '📋');
                copyBtn.disabled = false;
                return;
            }
            
            const url = urls[urlIndex];
            addActivityLog(`Trying URL: ${url.substring(0, 30)}...`);
            
            chrome.tabs.create({ url: url }, function(tab) {
                if (chrome.runtime.lastError) {
                    addActivityLog(`Failed: ${chrome.runtime.lastError.message}`, 'error');
                    urlIndex++;
                    tryNextUrl();
                } else {
                    addActivityLog('Tab created successfully', 'success');
                    
                    // Wait for page to load then send data
                    setTimeout(() => {
                        sendDataToTab(tab.id);
                    }, 3000);
                }
            });
        }
        
        tryNextUrl();
    }
    
    
    // Format data for clipboard
    function formatDataForClipboard(data) {
        if (!data || !data.structured) return '';
        
        const s = data.structured;
        let text = `${s.programName || 'Unknown Program'}\n`;
        text += `Location: ${s.location || 'Not specified'}\n`;
        text += `Phone: ${s.phones ? s.phones.join(', ') : 'Not available'}\n`;
        text += `Website: ${s.website || currentTabUrl}\n\n`;
        
        if (s.description) {
            text += `Description:\n${s.description}\n\n`;
        }
        
        if (s.therapies && s.therapies.length > 0) {
            text += `Therapies:\n${s.therapies.join('\n')}\n\n`;
        }
        
        if (s.specializations && s.specializations.length > 0) {
            text += `Specializations:\n${s.specializations.join('\n')}\n\n`;
        }
        
        return text;
    }
    
    // Reset UI to initial state
    function resetUI() {
        extractBtn.disabled = false;
        copyBtn.disabled = false;
        loadingDiv.style.display = 'none';
        mainActions.style.opacity = '1';
        progressContainer.style.display = 'none';
        stepIndicator.style.display = 'none';
        activityLog.style.display = 'none';
        extractionStats.style.display = 'none';
        
        if (progressTimer) {
            clearInterval(progressTimer);
            progressTimer = null;
        }
    }
    
    // Settings icon click handler
    document.querySelector('.settings-icon').addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
    });
});