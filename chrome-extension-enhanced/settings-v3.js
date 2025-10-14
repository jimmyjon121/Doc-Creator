// settings-v3.js - Settings page controller for v13.0

(function() {
    'use strict';
    
    // State
    let currentSettings = {
        ai_model: 'none',
        extraction_mode: 'hybrid',
        claude_api_key: '',
        gpt4_api_key: '',
        gemini_api_key: ''
    };
    
    // Initialize
    document.addEventListener('DOMContentLoaded', () => {
        console.log('[Settings] Initializing...');
        loadSettings();
        setupEventListeners();
    });
    
    // Load current settings
    function loadSettings() {
        chrome.storage.local.get([
            'ai_model',
            'extraction_mode',
            'claude_api_key',
            'gpt4_api_key',
            'gemini_api_key'
        ], (result) => {
            currentSettings = {
                ai_model: result.ai_model || 'none',
                extraction_mode: result.extraction_mode || 'hybrid',
                claude_api_key: result.claude_api_key || '',
                gpt4_api_key: result.gpt4_api_key || '',
                gemini_api_key: result.gemini_api_key || ''
            };
            
            // Update UI
            updateUI();
        });
    }
    
    // Update UI based on settings
    function updateUI() {
        // Set selected AI model
        document.querySelector(`input[name="ai_model"][value="${currentSettings.ai_model}"]`).checked = true;
        document.querySelectorAll('.ai-model-card').forEach(card => {
            card.classList.toggle('selected', card.dataset.model === currentSettings.ai_model);
        });
        
        // Set extraction mode
        document.querySelector(`input[name="extraction_mode"][value="${currentSettings.extraction_mode}"]`).checked = true;
        document.querySelectorAll('.mode-option').forEach(option => {
            const input = option.querySelector('input');
            option.classList.toggle('selected', input && input.checked);
        });
        
        // Update API key fields
        if (currentSettings.claude_api_key) {
            document.getElementById('claude-api-key').value = currentSettings.claude_api_key;
            updateModelStatus('claude', true);
        }
        if (currentSettings.gpt4_api_key) {
            document.getElementById('gpt4-api-key').value = currentSettings.gpt4_api_key;
            updateModelStatus('gpt4', true);
        }
        if (currentSettings.gemini_api_key) {
            document.getElementById('gemini-api-key').value = currentSettings.gemini_api_key;
            updateModelStatus('gemini', true);
        }
        
        // Show/hide API key sections
        updateApiKeySections();
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // AI model selection
        document.querySelectorAll('input[name="ai_model"]').forEach(input => {
            input.addEventListener('change', (e) => {
                currentSettings.ai_model = e.target.value;
                document.querySelectorAll('.ai-model-card').forEach(card => {
                    card.classList.toggle('selected', card.dataset.model === e.target.value);
                });
                updateApiKeySections();
            });
        });
        
        // Extraction mode selection
        document.querySelectorAll('input[name="extraction_mode"]').forEach(input => {
            input.addEventListener('change', (e) => {
                currentSettings.extraction_mode = e.target.value;
                document.querySelectorAll('.mode-option').forEach(option => {
                    const optionInput = option.querySelector('input');
                    option.classList.toggle('selected', optionInput && optionInput.checked);
                });
            });
        });
        
        // Toggle password visibility
        document.querySelectorAll('.toggle-visibility').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.dataset.target;
                const input = document.getElementById(targetId);
                const isPassword = input.type === 'password';
                input.type = isPassword ? 'text' : 'password';
                
                // Update icon
                button.innerHTML = isPassword ? 
                    '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>' :
                    '<svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>';
            });
        });
        
        // Test API key buttons
        document.querySelectorAll('.test-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const model = button.dataset.model;
                testApiKey(model);
            });
        });
        
        // API key input changes
        document.getElementById('claude-api-key').addEventListener('input', (e) => {
            currentSettings.claude_api_key = e.target.value;
        });
        document.getElementById('gpt4-api-key').addEventListener('input', (e) => {
            currentSettings.gpt4_api_key = e.target.value;
        });
        document.getElementById('gemini-api-key').addEventListener('input', (e) => {
            currentSettings.gemini_api_key = e.target.value;
        });
        
        // Save button
        document.getElementById('saveBtn').addEventListener('click', saveSettings);
        
        // Reset button
        document.getElementById('resetBtn').addEventListener('click', resetSettings);
    }
    
    // Update API key sections visibility
    function updateApiKeySections() {
        const sections = {
            'claude': document.getElementById('claude-config'),
            'gpt4': document.getElementById('gpt4-config'),
            'gemini': document.getElementById('gemini-config')
        };
        
        Object.entries(sections).forEach(([model, section]) => {
            if (section) {
                section.classList.toggle('visible', currentSettings.ai_model === model);
            }
        });
    }
    
    // Update model status indicator
    function updateModelStatus(model, isConfigured) {
        const statusIndicator = document.getElementById(`${model}-status`);
        const statusText = document.getElementById(`${model}-status-text`);
        
        if (statusIndicator) {
            statusIndicator.classList.toggle('configured', isConfigured);
        }
        if (statusText) {
            statusText.textContent = isConfigured ? 'Configured' : 'Not configured';
        }
    }
    
    // Test API key
    async function testApiKey(model) {
        const button = document.querySelector(`.test-btn[data-model="${model}"]`);
        const input = document.getElementById(`${model}-api-key`);
        const apiKey = input.value.trim();
        
        if (!apiKey) {
            showStatus('Please enter an API key first', 'warning');
            return;
        }
        
        // Disable button and show testing state
        button.disabled = true;
        button.textContent = 'Testing...';
        
        try {
            const success = await testApiConnection(model, apiKey);
            
            if (success) {
                showStatus(`${model.toUpperCase()} API key is valid!`, 'success');
                updateModelStatus(model, true);
                button.textContent = 'Valid!';
                setTimeout(() => {
                    button.textContent = 'Test';
                }, 2000);
            } else {
                showStatus(`Invalid ${model.toUpperCase()} API key`, 'error');
                updateModelStatus(model, false);
                button.textContent = 'Invalid';
                setTimeout(() => {
                    button.textContent = 'Test';
                }, 2000);
            }
        } catch (error) {
            showStatus(`Error testing ${model.toUpperCase()} API: ${error.message}`, 'error');
            button.textContent = 'Error';
            setTimeout(() => {
                button.textContent = 'Test';
            }, 2000);
        } finally {
            button.disabled = false;
        }
    }
    
    // Test API connection
    async function testApiConnection(model, apiKey) {
        // Simple validation for now
        // In production, you'd make actual API calls to validate
        
        if (model === 'claude') {
            return apiKey.startsWith('sk-ant-');
        } else if (model === 'gpt4') {
            return apiKey.startsWith('sk-') && apiKey.length > 20;
        } else if (model === 'gemini') {
            return apiKey.startsWith('AIza') && apiKey.length > 20;
        }
        
        return false;
    }
    
    // Save settings
    function saveSettings() {
        // Validate
        if (currentSettings.ai_model !== 'none') {
            const apiKeyField = `${currentSettings.ai_model}_api_key`;
            if (!currentSettings[apiKeyField]) {
                showStatus('Please configure an API key for the selected AI model', 'warning');
                return;
            }
        }
        
        // Save to storage
        chrome.storage.local.set(currentSettings, () => {
            showStatus('Settings saved successfully!', 'success');
            
            // Update button temporarily
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            setTimeout(() => {
                saveBtn.textContent = originalText;
            }, 2000);
        });
    }
    
    // Reset settings
    function resetSettings() {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }
        
        currentSettings = {
            ai_model: 'none',
            extraction_mode: 'hybrid',
            claude_api_key: '',
            gpt4_api_key: '',
            gemini_api_key: ''
        };
        
        // Clear storage
        chrome.storage.local.clear(() => {
            // Reload UI
            updateUI();
            showStatus('Settings reset to defaults', 'success');
        });
    }
    
    // Show status message
    function showStatus(message, type = 'info') {
        const statusElement = document.getElementById('statusMessage');
        
        statusElement.textContent = message;
        statusElement.className = `status-message visible status-${type}`;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            statusElement.classList.remove('visible');
        }, 5000);
    }
    
})();
