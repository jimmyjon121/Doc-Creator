// popup.js - Clinical Grade Extension Interface v5.0

// UX REQUIREMENTS FOR CASE MANAGEMENT:
// - Show live progress (pages analyzed, current/total) and a running activity log.
// - Display data-points found (therapies + specializations + contacts) count before completion.
// - Provide two actions on success: [Copy to Clipboard] and [Send to Doc Creator].
// - If postMessage injection fails, show "Data copied—paste in Doc Creator (Ctrl+V)" and re-enable Copy.
// - Auto-open/activate an existing Doc Creator tab if found; else open localhost fallback URLs.
// - Close popup ~2s after successful send to reduce click churn.

let extractedData = null;
let clinicalWriteUp = '';
let activityLog = [];

document.addEventListener('DOMContentLoaded', () => {
    const extractBtn = document.getElementById('extractBtn');
    const statusDiv = document.getElementById('status');
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressPercent = document.getElementById('progressPercent');
    const activityLogDiv = document.getElementById('activityLog');
    const logEntries = document.getElementById('logEntries');
    const statsDiv = document.getElementById('stats');
    const actionButtons = document.getElementById('actionButtons');
    const copyBtn = document.getElementById('copyBtn');
    const sendBtn = document.getElementById('sendBtn');
    const writeupPreview = document.getElementById('writeupPreview');
    const writeupText = document.getElementById('writeupText');
    
    // Listen for progress updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'progress') {
            const percent = Math.round((request.current / request.total) * 100);
            updateProgress(percent, request.message || `Analyzing page ${request.current}/${request.total}`);
            addLogEntry(`Page ${request.current}/${request.total}: ${request.message}`, 'info');
        }
    });
    
    // Extract button handler
    extractBtn.addEventListener('click', async () => {
        console.log('Starting extraction...');
        
        // Reset UI
        extractBtn.disabled = true;
        resetUI();
        showProgress();
        addLogEntry('Starting extraction...', 'info');
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.id) {
                throw new Error('No active tab found');
            }
            
            addLogEntry(`Analyzing: ${new URL(tab.url).hostname}`, 'info');
            updateProgress(10, 'Injecting extraction script...');
            
            // Try to send message, if it fails, inject the script manually
            console.log('Sending extraction request...');
            let response;
            
            try {
                response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
            } catch (messageError) {
                // Content script not loaded, inject it manually
                console.log('Content script not loaded, injecting...');
                addLogEntry('Loading extraction engine...', 'info');
                
                try {
                    await chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        files: ['production-extractor.js']
                    });
                    
                    // Wait a moment for script to initialize
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    // Try again
                    response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
                } catch (injectError) {
                    throw new Error('Failed to inject extraction script. Please refresh the page and try again.');
                }
            }
            
            console.log('Received response:', response);
            
            if (response && response.success && response.data) {
                extractedData = response.data;
                
                // Update progress
                updateProgress(50, 'Processing data...');
                addLogEntry(`Found ${calculateDataPoints(extractedData)} data points`, 'success');
                
                // Generate aftercare recommendation write-up
                updateProgress(75, 'Generating aftercare recommendation...');
                clinicalWriteUp = formatAfterCareRecommendation(extractedData);
                
                // Display results
                updateProgress(100, 'Complete!');
                addLogEntry(`Extraction complete! Analyzed ${extractedData.meta?.sourcesAnalyzed || 1} page(s)`, 'success');
                displayResults(extractedData);
                
                // Auto-copy to clipboard
                await navigator.clipboard.writeText(clinicalWriteUp);
                addLogEntry('Clinical write-up copied to clipboard', 'success');
                
                updateStatus('Extraction complete! Clinical write-up ready.', 'success');
                showActions();
                
            } else {
                throw new Error(response?.error || 'No data received from extraction');
            }
            
        } catch (error) {
            console.error('Extraction error:', error);
            addLogEntry(`Error: ${error.message}`, 'error');
            updateStatus(`Error: ${error.message}`, 'error');
            extractBtn.disabled = false;
        }
    });
    
    // Copy button handler
    copyBtn.addEventListener('click', async () => {
        if (clinicalWriteUp) {
            await navigator.clipboard.writeText(clinicalWriteUp);
            
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            addLogEntry('Write-up copied to clipboard', 'success');
            updateStatus('Clinical write-up copied to clipboard!', 'success');
                    
                    setTimeout(() => {
                copyBtn.textContent = originalText;
                        }, 2000);
        }
    });
    
    // Send to Doc Creator button handler
    sendBtn.addEventListener('click', async () => {
        if (!clinicalWriteUp) return;
        
        sendBtn.disabled = true;
        addLogEntry('Looking for Doc Creator tab...', 'info');
        
        try {
            // Look for existing Doc Creator tabs
            const docCreatorUrls = [
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:3000',
                'file://',
                'AppsCode-DeluxeCMS.html'
            ];
            
            let docCreatorTab = null;
            const tabs = await chrome.tabs.query({});
            
                    for (const tab of tabs) {
                for (const urlPattern of docCreatorUrls) {
                    if (tab.url && tab.url.includes(urlPattern)) {
                    docCreatorTab = tab;
                break;
                    }
                }
                if (docCreatorTab) break;
            }
            
            if (docCreatorTab) {
                // Focus existing tab
                await chrome.tabs.update(docCreatorTab.id, { active: true });
                await chrome.windows.update(docCreatorTab.windowId, { focused: true });
                addLogEntry('Found Doc Creator tab, sending data...', 'success');
                
                // Try to inject data via postMessage
                try {
                    await chrome.scripting.executeScript({
                                target: { tabId: docCreatorTab.id },
                        func: (writeUp) => {
                            // Try to inject into Doc Creator's text area
                            const textAreas = document.querySelectorAll('textarea');
                            if (textAreas.length > 0) {
                                textAreas[0].value = writeUp;
                                textAreas[0].dispatchEvent(new Event('input', { bubbles: true }));
                                return true;
                            }
                            // Try postMessage
                                        window.postMessage({
                                type: 'FAMILY_FIRST_DATA', 
                                data: writeUp 
                                        }, '*');
                            return false;
                        },
                        args: [clinicalWriteUp]
                    });
                    
                    updateStatus('Data sent to Doc Creator!', 'success');
                    addLogEntry('Data successfully sent to Doc Creator', 'success');
                    
                    // Close popup after 2 seconds
                            setTimeout(() => {
                                window.close();
                    }, 2000);
                    
                } catch (injectError) {
                    // Fallback to clipboard
                    await navigator.clipboard.writeText(clinicalWriteUp);
                    updateStatus('Data copied - paste in Doc Creator (Ctrl+V)', 'warning');
                    addLogEntry('Auto-inject failed, data copied to clipboard', 'warning');
                    copyBtn.disabled = false;
                }
                
            } else {
                // Open new Doc Creator tab
                addLogEntry('Opening new Doc Creator tab...', 'info');
                const newTab = await chrome.tabs.create({ 
                    url: 'http://localhost:3000',
                    active: true 
                });
                
                // Copy to clipboard as fallback
                await navigator.clipboard.writeText(clinicalWriteUp);
                updateStatus('Doc Creator opened - paste data (Ctrl+V)', 'success');
                addLogEntry('New tab opened, data in clipboard', 'success');
            }
            
        } catch (error) {
            console.error('Send error:', error);
            // Fallback to clipboard
            await navigator.clipboard.writeText(clinicalWriteUp);
            updateStatus('Data copied - paste in Doc Creator (Ctrl+V)', 'warning');
            addLogEntry('Send failed, data copied to clipboard', 'warning');
            copyBtn.disabled = false;
        } finally {
            sendBtn.disabled = false;
        }
    });
    
    // Helper functions
    function resetUI() {
        progressContainer.style.display = 'none';
        activityLogDiv.style.display = 'none';
        statsDiv.style.display = 'none';
        actionButtons.style.display = 'none';
        writeupPreview.style.display = 'none';
        statusDiv.style.display = 'none';
        activityLog = [];
        logEntries.innerHTML = '';
    }
    
    function showProgress() {
        progressContainer.style.display = 'block';
        activityLogDiv.style.display = 'block';
    }
    
    function showActions() {
        actionButtons.style.display = 'flex';
        writeupPreview.style.display = 'block';
        writeupText.textContent = clinicalWriteUp;
        
        // Show quick summary if we have good data
        if (extractedData) {
            const summaryDiv = document.getElementById('extractedInfo');
            const quickSummary = document.getElementById('quickSummary');
            
            let summary = [];
            if (extractedData.clinical?.evidenceBased?.length > 0) {
                summary.push(`Therapies: ${extractedData.clinical.evidenceBased.slice(0, 3).join(', ')}`);
            }
            if (extractedData.clinical?.specializations?.length > 0) {
                summary.push(`Specializes: ${extractedData.clinical.specializations.slice(0, 3).join(', ')}`);
            }
            if (extractedData.structure?.los) {
                summary.push(`LOS: ${extractedData.structure.los}`);
            }
            if (extractedData.admissions?.insurance?.length > 0) {
                summary.push(`Insurance: ${extractedData.admissions.insurance.slice(0, 3).join(', ')}`);
            }
            
            if (summary.length > 0) {
                summaryDiv.style.display = 'block';
                quickSummary.innerHTML = summary.join(' • ');
            }
        }
    }
    
    function updateProgress(percent, text) {
        progressFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        progressText.textContent = text;
    }
    
    function addLogEntry(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `log-entry ${type}`;
        entry.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
        logEntries.appendChild(entry);
        logEntries.scrollTop = logEntries.scrollHeight;
        
        activityLog.push({ time: Date.now(), message, type });
    }
    
    function updateStatus(message, type) {
        statusDiv.innerHTML = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';
        
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }
    
    function displayResults(data) {
        // Update stats
        const dataPoints = calculateDataPoints(data);
        document.getElementById('dataPoints').textContent = dataPoints;
        document.getElementById('confidence').textContent = (data.meta?.confidence || 0) + '%';
        document.getElementById('pagesAnalyzed').textContent = data.meta?.sourcesAnalyzed || 1;
        
        // Show stats
        statsDiv.style.display = 'block';
    }
    
    function calculateDataPoints(data) {
        let count = 0;
        
        // Count all non-empty fields
        if (data.name) count++;
        if (data.city) count++;
        if (data.state) count++;
        count += data.levelsOfCare?.length || 0;
        if (data.population?.ages) count++;
        if (data.population?.gender) count++;
        count += data.overviewBullets?.length || 0;
        if (data.structure?.los) count++;
        if (data.structure?.ratio) count++;
        if (data.structure?.academics?.hasProgram) count++;
        count += data.clinical?.evidenceBased?.length || 0;
        count += data.clinical?.experiential?.length || 0;
        count += data.clinical?.specializations?.length || 0;
        if (data.family?.weeklyTherapy) count++;
        if (data.family?.workshops) count++;
        count += data.family?.notes?.length || 0;
        count += data.admissions?.insurance?.length || 0;
        if (data.admissions?.email) count++;
        if (data.admissions?.phone) count++;
        count += data.quality?.accreditations?.length || 0;
        
        return count;
    }
    
    // Aftercare recommendation formatter function
    function formatAfterCareRecommendation(data) {
        const lines = [];
        
        // Program Header with full name and location (ASCII-only to avoid encoding issues)
        const header = `${data.name || 'Treatment Program'}${data.city && data.state ? ` - ${data.city}, ${data.state.toUpperCase()}` : ''}`;
        lines.push(header.toUpperCase());
        lines.push('');
        
        // Levels of Care
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            lines.push(`Level of Care: ${data.levelsOfCare.join(' | ')}`);
            lines.push('');
        }
        
        // PROGRAM OVERVIEW
        lines.push('PROGRAM OVERVIEW');
        if (data.philosophy || data.approach || data.overviewBullets?.length > 0) {
            let overview = '';
            
            if (data.philosophy) {
                overview = data.philosophy;
            } else if (data.approach) {
                overview = data.approach;
            } else if (data.overviewBullets && data.overviewBullets.length > 0) {
                overview = data.overviewBullets
                    .slice(0, 3)
                    .map(b => b.replace(/^[•\-\*]\s*/, ''))
                    .join('. ') + '.';
            }
            
            if (data.population?.ages || data.clinical?.specializations?.length > 0) {
                const context = [];
                if (data.population.ages) {
                    context.push(`serves ${data.population.ages}${data.population.gender ? ` ${data.population.gender.toLowerCase()}` : ''}`);
                }
                if (data.clinical?.specializations?.length > 0) {
                    const topSpecs = data.clinical.specializations.slice(0, 3).join(', ').toLowerCase();
                    context.push(`specializing in ${topSpecs}`);
                }
                if (context.length > 0) {
                    overview += ` The program ${context.join(' and ')}.`;
                }
            }
            
            lines.push(wrapText(overview, 80));
        } else {
            // Construct a concise, informative overview from available signals
            const overviewParts = [];
            if (data.levelsOfCare && data.levelsOfCare.length > 0) {
                overviewParts.push(`Offers ${data.levelsOfCare.join(', ').toLowerCase()} treatment`);
            }
            if (data.population?.ages) {
                const gender = data.population.gender ? ` ${data.population.gender.toLowerCase()}` : '';
                overviewParts.push(`serving ${data.population.ages}${gender}`);
            }
            if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
                overviewParts.push(`with specialization in ${data.clinical.specializations.slice(0, 3).join(', ').toLowerCase()}`);
            }
            if (data.clinical?.evidenceBased && data.clinical.evidenceBased.length > 0) {
                overviewParts.push(`using evidence-based modalities such as ${data.clinical.evidenceBased.slice(0, 3).join(', ')}`);
            }
            if (data.structure?.los) {
                overviewParts.push(`typical length of stay ${data.structure.los}`);
            }
            if (overviewParts.length === 0) {
                overviewParts.push('Provides structured clinical treatment with licensed staff');
            }
            const overviewText = overviewParts.join('. ') + '.';
            lines.push(wrapText(overviewText, 80));
        }
        
        if (data.differentiators && data.differentiators.length > 0) {
            lines.push(`Key features include: ${data.differentiators.slice(0, 3).join(', ').toLowerCase()}.`);
        }
        lines.push('');
        
        // WHY THIS PROGRAM (top differentiators)
        if (Array.isArray(data.differentiators) && data.differentiators.length > 0) {
            lines.push('WHY THIS PROGRAM');
            data.differentiators.slice(0, 5).forEach(d => {
                lines.push(`- ${d}`);
            });
            lines.push('');
        }
        
        // CLINICAL PROGRAMMING
        lines.push('CLINICAL PROGRAMMING');
        
        if (data.clinical?.evidenceBased && data.clinical.evidenceBased.length > 0) {
            const ebList = data.clinical.evidenceBased.join(', ');
            lines.push(`- Evidence-Based Modalities: ${wrapList(ebList, 80, '  ')}`);
        }
        
        if (data.clinical?.experiential && data.clinical.experiential.length > 0) {
            const expList = data.clinical.experiential.join(', ');
            lines.push(`- Experiential Therapies: ${wrapList(expList, 80, '  ')}`);
        }
        
        if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
            const specList = data.clinical.specializations.join(', ');
            lines.push(`- Clinical Specializations: ${wrapList(specList, 80, '  ')}`);
        }
        
        if (data.clinical?.individualTherapyHours || data.clinical?.groupTherapyHours) {
            const intensity = [];
            if (data.clinical.individualTherapyHours) {
                intensity.push(`${data.clinical.individualTherapyHours} individual therapy`);
            }
            if (data.clinical.groupTherapyHours) {
                intensity.push(`${data.clinical.groupTherapyHours} group therapy`);
            }
            lines.push(`- Therapy Intensity: ${intensity.join(', ')} weekly`);
        }
        
        if (data.clinical?.psychiatricServices || data.clinical?.medicationManagement) {
            const psych = [];
            if (data.clinical.psychiatricServices) psych.push('psychiatric evaluation');
            if (data.clinical.medicationManagement) psych.push('medication management');
            if (psych.length > 0) {
                lines.push(`- Psychiatric Services: ${psych.join(' and ')}`);
            }
        }
        
        if (data.clinical?.traumaInformed) {
            lines.push('- Trauma-Informed Care approach');
        }
        lines.push('');
        
        // PROGRAM STRUCTURE
        if (data.structure?.los || data.structure?.ratio || data.structure?.phases?.length > 0) {
            lines.push('PROGRAM STRUCTURE');
            
            if (data.structure?.los) {
                lines.push(`- Length of Stay: ${data.structure.los}`);
            }
            
            if (data.structure?.phases && data.structure.phases.length > 0) {
                lines.push(`- Treatment Phases: ${data.structure.phases.length} phase model`);
            }
            
            if (data.structure?.ratio) {
                lines.push(`- Staff-to-Client Ratio: ${data.structure.ratio}`);
            }
            
            if (data.structure?.groupSize) {
                lines.push(`- Group Size: ${data.structure.groupSize}`);
            }
            lines.push('');
        }
        
        // FAMILY INVOLVEMENT
        const hasFamilyProgram = data.family?.weeklyTherapy || data.family?.workshops || 
                                data.family?.familyWeekend || data.family?.parentSupport;
        
        if (hasFamilyProgram) {
            lines.push('FAMILY INVOLVEMENT');
            
            if (data.family.weeklyTherapy) {
                lines.push('- Weekly family therapy sessions');
            }
            
            if (data.family.workshops) {
                lines.push('- Parent education workshops');
            }
            
            if (data.family.familyWeekend) {
                lines.push('- Structured family weekends');
            }
            
            if (data.family.parentSupport) {
                lines.push('- Parent support groups');
            }
            
            if (data.family.visitationPolicy) {
                lines.push(`- Visitation: ${data.family.visitationPolicy}`);
            }
            
            if (data.family.notes && data.family.notes.length > 0) {
                data.family.notes.forEach(note => {
                    lines.push(`- ${note}`);
                });
            }
            lines.push('');
        }
        
        // FIT CONSIDERATIONS (who this serves best; any exclusions)
        const fitLines = [];
        const fitParts = [];
        if (data.population?.ages) {
            fitParts.push(`${data.population.ages}${data.population?.gender ? ` ${data.population.gender.toLowerCase()}` : ''}`);
        }
        if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
            fitParts.push(`needs focused on ${data.clinical.specializations.slice(0, 3).join(', ').toLowerCase()}`);
        }
        if (fitParts.length > 0) {
            fitLines.push(`- Best Fit: ${fitParts.join('; ')}`);
        }
        if (Array.isArray(data.admissions?.exclusions) && data.admissions.exclusions.length > 0) {
            fitLines.push(`- Contraindications: ${data.admissions.exclusions.slice(0, 3).join('; ')}`);
        }
        if (data.structure?.groupSize) {
            fitLines.push(`- Milieu: ${data.structure.groupSize}`);
        }
        if (data.structure?.academics?.hasProgram) {
            const acadBits = [];
            if (data.structure.academics.grades) acadBits.push(`grades ${data.structure.academics.grades}`);
            if (data.structure.academics.accreditation) acadBits.push(`${data.structure.academics.accreditation} accredited`);
            if (data.structure.academics.iep504) acadBits.push('IEP/504 supports');
            if (data.structure.academics.creditSupport) acadBits.push('credit recovery/transfer');
            if (acadBits.length > 0) fitLines.push(`- Academic Fit: ${acadBits.join(', ')}`);
        }
        if (fitLines.length > 0) {
            lines.push('FIT CONSIDERATIONS');
            fitLines.forEach(l => lines.push(l));
            lines.push('');
        }
        
        // CONTINUUM / STEP-DOWN
        const continuum = buildContinuumPath(data.levelsOfCare || []);
        if (continuum) {
            lines.push('CONTINUUM / STEP-DOWN');
            lines.push(`- Likely Path: ${continuum}`);
            lines.push('');
        }
        
        // ACADEMIC SUPPORT
        if (data.structure?.academics?.hasProgram) {
            lines.push('ACADEMIC SUPPORT');
            if (data.structure.academics.accreditation) {
                lines.push(`- ${data.structure.academics.accreditation} accredited on-site school`);
            } else {
                lines.push('- On-site academic program');
            }
            lines.push('- Individualized academic support');
            lines.push('- Credit recovery and transfer assistance');
            lines.push('');
        }
        
        // ADMISSIONS & PAYMENT (omit if nothing substantive)
        const admissionsLines = [];
        if (data.admissions?.insurance && data.admissions.insurance.length > 0) {
            const insuranceList = data.admissions.insurance.join(', ');
            admissionsLines.push(`- Insurance Accepted: ${wrapList(insuranceList, 80, '  ')}`);
        }
        if (data.admissions?.financing) {
            admissionsLines.push('- Financing options available');
        }
        if (admissionsLines.length > 0) {
            lines.push('ADMISSIONS & PAYMENT');
            admissionsLines.forEach(l => lines.push(l));
            lines.push('');
        }
        
        // ACCREDITATIONS
        if (data.quality?.accreditations && data.quality.accreditations.length > 0) {
            lines.push('ACCREDITATIONS & MEMBERSHIPS');
            const accredList = data.quality.accreditations.join(', ');
            lines.push(`- ${wrapList(accredList, 80, '  ')}`);
            lines.push('');
        }
        
        // CONTACT
        lines.push('CONTACT INFORMATION');
        const contactParts = [];
        
        if (data.admissions?.phone) {
            contactParts.push(`Phone: ${data.admissions.phone}`);
        }
        
        if (data.admissions?.email) {
            contactParts.push(`Email: ${data.admissions.email}`);
        }
        
        if (contactParts.length > 0) {
            lines.push(contactParts.join(' | '));
        }
        
        if (data.admissions?.website) {
            lines.push(`Website: ${data.admissions.website}`);
        }
        
        if (data.meta?.confidence !== undefined) {
            lines.push('');
            lines.push(`[Assessment Quality: ${data.meta.confidence}% | Pages Reviewed: ${data.meta.sourcesAnalyzed || 1}]`);
        }
        
        return lines.join('\n');
    }

    function buildContinuumPath(levels) {
        if (!Array.isArray(levels) || levels.length === 0) return '';
        const L = levels.map(l => l.toUpperCase());
        const has = (x) => L.includes(x);
        if (has('RESIDENTIAL') && has('PHP') && has('IOP')) return 'Residential -> PHP -> IOP -> Outpatient/Aftercare';
        if (has('RESIDENTIAL') && has('IOP')) return 'Residential -> IOP -> Outpatient/Aftercare';
        if (has('PHP') && has('IOP')) return 'PHP -> IOP -> Outpatient/Aftercare';
        if (has('RESIDENTIAL')) return 'Residential -> Aftercare';
        if (has('PHP')) return 'PHP -> Outpatient/Aftercare';
        if (has('IOP')) return 'IOP -> Outpatient/Aftercare';
        if (has('OUTPATIENT')) return 'Outpatient -> Aftercare';
        return '';
    }
    
    // Clinical formatter function (backup)
    function formatClinicalWriteUp(data) {
        const lines = [];
        
        // 1) Program Header: "{Program Name} — {City, ST}"
        const header = `${data.name || 'Treatment Program'}${data.city && data.state ? ` — ${data.city}, ${data.state}` : ''}`;
        lines.push(header);
        lines.push('');
        
        // 2) Levels of Care: pipe-separated
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            lines.push(data.levelsOfCare.join(' | '));
            lines.push('');
        }
        
        // 3) OVERVIEW section
        lines.push('OVERVIEW');
        if (data.overviewBullets && data.overviewBullets.length > 0) {
            const overview = data.overviewBullets
                .slice(0, 5)
                .map(bullet => bullet.replace(/^[•\-\*]\s*/, ''))
                .join('. ')
                .replace(/\.+/g, '.') + '.';
            lines.push(wrapText(overview, 80));
        } else {
            let overview = [];
            if (data.population?.ages) {
                overview.push(`Serves ${data.population.ages}${data.population.gender ? ` ${data.population.gender}` : ''}`);
            }
            if (data.levelsOfCare && data.levelsOfCare.length > 0) {
                overview.push(`Offers ${data.levelsOfCare.join(', ').toLowerCase()} treatment`);
            }
            if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
                overview.push(`Specializes in ${data.clinical.specializations.slice(0, 3).join(', ').toLowerCase()}`);
            }
            if (overview.length > 0) {
                lines.push(wrapText(overview.join('. ') + '.', 80));
            }
        }
        lines.push('');
        
        // 4) PROGRAM STRUCTURE
        if (data.structure?.los || data.structure?.ratio || data.structure?.academics?.hasProgram) {
            lines.push('PROGRAM STRUCTURE');
            if (data.structure?.los) {
                lines.push(`• Length of Stay: ${data.structure.los}`);
            }
            if (data.structure?.ratio) {
                lines.push(`• Staff Ratio: ${data.structure.ratio}`);
            }
            if (data.structure?.academics?.hasProgram) {
                const academicLine = data.structure.academics.accreditation 
                    ? `• Academics: On-site program (${data.structure.academics.accreditation})`
                    : '• Academics: On-site program available';
                lines.push(academicLine);
            }
            lines.push('');
        }
        
        // 5) CLINICAL SERVICES
        if (data.clinical?.evidenceBased?.length > 0 || data.clinical?.experiential?.length > 0 || data.clinical?.specializations?.length > 0) {
            lines.push('CLINICAL SERVICES');
            if (data.clinical?.evidenceBased && data.clinical.evidenceBased.length > 0) {
                const ebList = data.clinical.evidenceBased.join(', ');
                lines.push(`• Evidence-Based: ${wrapList(ebList, 80, '  ')}`);
            }
            if (data.clinical?.experiential && data.clinical.experiential.length > 0) {
                const expList = data.clinical.experiential.join(', ');
                lines.push(`• Experiential: ${wrapList(expList, 80, '  ')}`);
            }
            if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
                const specList = data.clinical.specializations.join(', ');
                lines.push(`• Specializations: ${wrapList(specList, 80, '  ')}`);
            }
            lines.push('');
        }
        
        // 6) FAMILY & ACADEMICS
        const hasFamilyProgram = data.family?.weeklyTherapy || data.family?.workshops || data.family?.notes?.length > 0;
        const hasAcademics = data.structure?.academics?.hasProgram;
        
        if (hasFamilyProgram || hasAcademics) {
            lines.push('FAMILY & ACADEMICS');
            if (data.family?.weeklyTherapy) {
                lines.push('• Weekly family therapy');
            }
            if (data.family?.workshops) {
                lines.push('• Parent workshops/education');
            }
            if (data.family?.notes && data.family.notes.length > 0) {
                data.family.notes.forEach(note => {
                    lines.push(`• ${note}`);
                });
            }
            if (hasAcademics) {
                const academicDetail = data.structure.academics.accreditation
                    ? `• Academic Support: ${data.structure.academics.accreditation} accredited`
                    : '• Academic Support: On-site educational program';
                lines.push(academicDetail);
            }
            lines.push('');
        }
        
        // 7) ADMISSIONS & LOGISTICS
        if (data.admissions?.insurance?.length > 0) {
            lines.push('ADMISSIONS & LOGISTICS');
            const insuranceList = data.admissions.insurance.join(', ');
            lines.push(`• Insurance: ${wrapList(insuranceList, 80, '  ')}`);
            lines.push('');
        }
        
        // 8) ACCREDITATIONS / QUALITY
        if (data.quality?.accreditations && data.quality.accreditations.length > 0) {
            lines.push('ACCREDITATIONS / QUALITY');
            const accredList = data.quality.accreditations.join(', ');
            lines.push(`• ${wrapList(accredList, 80, '  ')}`);
            lines.push('');
        }
        
        // 9) CONTACT
        lines.push('CONTACT');
        const contactParts = [];
        if (data.admissions?.phone) {
            contactParts.push(data.admissions.phone);
        }
        if (data.admissions?.email) {
            contactParts.push(data.admissions.email);
        }
        if (data.admissions?.website) {
            contactParts.push(data.admissions.website);
        }
        if (contactParts.length > 0) {
            lines.push(contactParts.join(' | '));
        } else {
            lines.push('Contact information not available');
        }
        
        // Add metadata footer if confidence score available
        if (data.meta?.confidence !== undefined) {
            lines.push('');
            lines.push(`[Data Quality: ${data.meta.confidence}% | Sources: ${data.meta.sourcesAnalyzed || 1}]`);
        }
        
        return lines.join('\n');
    }
    
    // Helper function to wrap text to specified width
    function wrapText(text, maxWidth) {
        if (!text || text.length <= maxWidth) return text;
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            if ((currentLine + ' ' + word).length <= maxWidth) {
                currentLine = currentLine ? currentLine + ' ' + word : word;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
            }
        });
        
        if (currentLine) lines.push(currentLine);
        return lines.join('\n');
    }
    
    // Helper function to wrap lists with proper indentation
    function wrapList(text, maxWidth, indent = '') {
        if (!text || text.length <= maxWidth - indent.length) return text;
        
        const items = text.split(', ');
        const lines = [];
        let currentLine = '';
        
        items.forEach((item, index) => {
            const separator = index === 0 ? '' : ', ';
            if ((currentLine + separator + item).length <= maxWidth - indent.length) {
                currentLine = currentLine ? currentLine + separator + item : item;
            } else {
                if (currentLine) lines.push(currentLine);
                currentLine = item;
            }
        });
        
        if (currentLine) lines.push(currentLine);
        return lines.join('\n' + indent);
    }
});