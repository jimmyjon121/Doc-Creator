// popup.js - Professional Extension Interface v4.0

let extractedData = null;

document.addEventListener('DOMContentLoaded', () => {
    const extractBtn = document.getElementById('extractBtn');
    const statusDiv = document.getElementById('status');
    const statsDiv = document.getElementById('stats');
    const resultsDiv = document.getElementById('results');
    const copyBtn = document.getElementById('copyBtn');
    
    // Tab handling
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
        });
    });
    
    // Extract button handler
    extractBtn.addEventListener('click', async () => {
        console.log('Starting extraction...');
        
        // Reset UI
        extractBtn.disabled = true;
        statsDiv.style.display = 'none';
        resultsDiv.style.display = 'none';
        updateStatus('<span class="loading-spinner"></span>Extracting comprehensive data...', 'loading');
        
        try {
            // Get current tab
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab || !tab.id) {
                throw new Error('No active tab found');
            }
            
            console.log('Active tab:', tab.url);
            
            // Send extraction message to content script
            console.log('Sending extraction request...');
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
            
            console.log('Received response:', response);
            
            if (response && response.success && response.data) {
                extractedData = response.data;
                displayResults(extractedData);
                updateStatus('✅ Extraction complete! Data automatically copied to clipboard.', 'success');
                
                // Auto-copy to clipboard
                const formatted = formatForClipboard(extractedData);
                await navigator.clipboard.writeText(formatted);
            } else {
                throw new Error(response?.error || 'No data received from extraction');
            }
            
        } catch (error) {
            console.error('Extraction error:', error);
            
            // Check if content script needs to be injected
            if (error.message.includes('Receiving end does not exist')) {
                updateStatus('⚠️ Refreshing page and retrying...', 'loading');
                
                try {
                    // Reload the tab and retry
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    await chrome.tabs.reload(tab.id);
                    
                    // Wait for page to load
                    setTimeout(async () => {
                        try {
                            const response = await chrome.tabs.sendMessage(tab.id, { action: 'extract' });
                            if (response && response.success && response.data) {
                                extractedData = response.data;
                                displayResults(extractedData);
                                updateStatus('✅ Extraction complete after refresh!', 'success');
                                
                                const formatted = formatForClipboard(extractedData);
                                await navigator.clipboard.writeText(formatted);
                            }
                        } catch (retryError) {
                            updateStatus('❌ Please refresh the page and try again.', 'error');
                        }
                        extractBtn.disabled = false;
                    }, 3000);
                    
                    return;
                } catch (reloadError) {
                    updateStatus('❌ Unable to refresh page. Please refresh manually.', 'error');
                }
            } else {
                updateStatus(`❌ Error: ${error.message}`, 'error');
            }
        } finally {
            extractBtn.disabled = false;
        }
    });
    
    // Copy button handler
    copyBtn.addEventListener('click', async () => {
        if (extractedData) {
            const formatted = formatForClipboard(extractedData);
            await navigator.clipboard.writeText(formatted);
            
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅ Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        }
    });
    
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
        document.getElementById('dataPoints').textContent = data.metadata.dataPoints;
        document.getElementById('confidence').textContent = data.metadata.confidence + '%';
        document.getElementById('sections').textContent = Object.keys(data.content.sections).length;
        document.getElementById('extractTime').textContent = (data.metadata.extractionTime / 1000).toFixed(1) + 's';
        
        // Show stats
        statsDiv.style.display = 'block';
        
        // Build overview tab
        const overviewHtml = `
            <div class="data-section">
                <h4>📋 Program Information</h4>
                <ul class="data-list">
                    <li><strong>Name:</strong> ${data.programName}</li>
                    <li><strong>Website:</strong> ${data.url}</li>
                    ${data.contact.location ? `<li><strong>Location:</strong> ${data.contact.location}</li>` : ''}
                    ${data.demographics.agesServed.length > 0 ? `<li><strong>Ages:</strong> ${data.demographics.agesServed.join(', ')}</li>` : ''}
                    ${data.demographics.genders.length > 0 ? `<li><strong>Genders:</strong> ${data.demographics.genders.join(', ')}</li>` : ''}
                </ul>
            </div>
            
            <div class="data-section">
                <h4>📞 Contact Information</h4>
                <ul class="data-list">
                    ${data.contact.phones.length > 0 ? `<li><strong>Phones:</strong> ${data.contact.phones.join(', ')}</li>` : '<li>No phones found</li>'}
                    ${data.contact.emails.length > 0 ? `<li><strong>Emails:</strong> ${data.contact.emails.join(', ')}</li>` : '<li>No emails found</li>'}
                </ul>
            </div>
            
            ${data.payment.insurance.length > 0 ? `
            <div class="data-section">
                <h4>💳 Insurance Accepted</h4>
                <ul class="data-list">
                    ${data.payment.insurance.map(ins => `<li>${ins}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        `;
        document.getElementById('overview').innerHTML = overviewHtml;
        
        // Build clinical tab
        let clinicalHtml = '';
        
        if (Object.values(data.clinical.therapies).some(arr => arr.length > 0)) {
            clinicalHtml += '<div class="data-section"><h4>🧠 Therapies & Modalities</h4><ul class="data-list">';
            Object.entries(data.clinical.therapies).forEach(([category, therapies]) => {
                if (therapies.length > 0) {
                    clinicalHtml += `<li><strong>${category}:</strong> ${therapies.join(', ')}</li>`;
                }
            });
            clinicalHtml += '</ul></div>';
        }
        
        if (data.clinical.specializations.length > 0) {
            clinicalHtml += `
            <div class="data-section">
                <h4>🎯 Specializations</h4>
                <ul class="data-list">
                    ${data.clinical.specializations.map(spec => `<li>${spec}</li>`).join('')}
                </ul>
            </div>
            `;
        }
        
        if (data.clinical.levelOfCare.length > 0) {
            clinicalHtml += `
            <div class="data-section">
                <h4>🏥 Level of Care</h4>
                <ul class="data-list">
                    ${data.clinical.levelOfCare.map(level => `<li>${level}</li>`).join('')}
                </ul>
            </div>
            `;
        }
        
        document.getElementById('clinical').innerHTML = clinicalHtml || '<p>No clinical information found.</p>';
        
        // Build details tab
        let detailsHtml = '';
        
        if (data.staff.credentials.length > 0 || data.staff.leadership.length > 0) {
            detailsHtml += '<div class="data-section"><h4>👥 Staff & Credentials</h4><ul class="data-list">';
            if (data.staff.credentials.length > 0) {
                detailsHtml += `<li><strong>Credentials:</strong> ${data.staff.credentials.join(', ')}</li>`;
            }
            if (data.staff.leadership.length > 0) {
                detailsHtml += `<li><strong>Leadership:</strong> ${data.staff.leadership.join(', ')}</li>`;
            }
            detailsHtml += '</ul></div>';
        }
        
        if (data.accreditations.length > 0) {
            detailsHtml += `
            <div class="data-section">
                <h4>🏆 Accreditations</h4>
                <ul class="data-list">
                    ${data.accreditations.map(acc => `<li>${acc}</li>`).join('')}
                </ul>
            </div>
            `;
        }
        
        if (data.facilities.amenities.length > 0) {
            detailsHtml += `
            <div class="data-section">
                <h4>🏢 Facilities & Amenities</h4>
                <ul class="data-list">
                    ${data.facilities.setting ? `<li><strong>Setting:</strong> ${data.facilities.setting}</li>` : ''}
                    ${data.facilities.amenities.length > 0 ? `<li><strong>Amenities:</strong> ${data.facilities.amenities.join(', ')}</li>` : ''}
                </ul>
            </div>
            `;
        }
        
        document.getElementById('details').innerHTML = detailsHtml || '<p>No additional details found.</p>';
        
        // Build raw data tab
        const rawHtml = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
        document.getElementById('raw').innerHTML = rawHtml;
        
        // Show results
        resultsDiv.style.display = 'block';
    }
    
    function formatForClipboard(data) {
        let text = `${data.programName}\n`;
        text += `${data.url}\n\n`;
        
        // Contact Information
        if (data.contact.phones.length > 0 || data.contact.emails.length > 0) {
            text += '=== CONTACT INFORMATION ===\n';
            if (data.contact.phones.length > 0) {
                text += `Phone: ${data.contact.phones[0]}\n`;
            }
            if (data.contact.emails.length > 0) {
                text += `Email: ${data.contact.emails[0]}\n`;
            }
            if (data.contact.location) {
                text += `Location: ${data.contact.location}\n`;
            }
            text += '\n';
        }
        
        // Demographics
        if (data.demographics.agesServed.length > 0 || data.demographics.genders.length > 0) {
            text += '=== DEMOGRAPHICS ===\n';
            if (data.demographics.agesServed.length > 0) {
                text += `Ages: ${data.demographics.agesServed.join(', ')}\n`;
            }
            if (data.demographics.genders.length > 0) {
                text += `Genders: ${data.demographics.genders.join(', ')}\n`;
            }
            text += '\n';
        }
        
        // Clinical Services
        if (Object.values(data.clinical.therapies).some(arr => arr.length > 0)) {
            text += '=== CLINICAL SERVICES ===\n';
            Object.entries(data.clinical.therapies).forEach(([category, therapies]) => {
                if (therapies.length > 0) {
                    text += `${category}: ${therapies.join(', ')}\n`;
                }
            });
            text += '\n';
        }
        
        // Specializations
        if (data.clinical.specializations.length > 0) {
            text += '=== SPECIALIZATIONS ===\n';
            text += data.clinical.specializations.join(', ') + '\n\n';
        }
        
        // Level of Care
        if (data.clinical.levelOfCare.length > 0) {
            text += '=== LEVEL OF CARE ===\n';
            text += data.clinical.levelOfCare.join(', ') + '\n\n';
        }
        
        // Insurance
        if (data.payment.insurance.length > 0) {
            text += '=== INSURANCE ACCEPTED ===\n';
            text += data.payment.insurance.join(', ') + '\n\n';
        }
        
        // Accreditations
        if (data.accreditations.length > 0) {
            text += '=== ACCREDITATIONS ===\n';
            text += data.accreditations.join(', ') + '\n\n';
        }
        
        // Key Content Sections
        if (Object.keys(data.content.sections).length > 0) {
            text += '=== KEY INFORMATION ===\n';
            Object.entries(data.content.sections).forEach(([section, content]) => {
                text += `\n[${section.toUpperCase()}]\n`;
                text += content + '\n';
            });
        }
        
        // Metadata
        text += '\n=== EXTRACTION METADATA ===\n';
        text += `Data Points: ${data.metadata.dataPoints}\n`;
        text += `Confidence: ${data.metadata.confidence}%\n`;
        text += `Extracted: ${new Date(data.extractedAt).toLocaleString()}\n`;
        
        return text;
    }
});