// settings-v2.js - Multi-AI Configuration Manager
// Version 11.0 - Support for multiple AI providers

document.addEventListener('DOMContentLoaded', () => {
    // Load current configuration
    loadConfiguration();
    
    // Gemini handlers
    document.getElementById('saveGemini').addEventListener('click', () => saveGemini());
    document.getElementById('removeGemini').addEventListener('click', () => removeGemini());
    
    // OpenAI handlers
    document.getElementById('saveOpenai').addEventListener('click', () => saveOpenAI());
    document.getElementById('removeOpenai').addEventListener('click', () => removeOpenAI());
    
    // Claude handlers
    document.getElementById('saveClaude').addEventListener('click', () => saveClaude());
    document.getElementById('removeClaude').addEventListener('click', () => removeClaude());
    
    // Ollama handlers
    document.getElementById('ollamaToggle').addEventListener('click', () => toggleOllama());
    document.getElementById('testOllama').addEventListener('click', () => testOllama());
    
    // Model selectors
    document.querySelectorAll('.model-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const parent = e.target.closest('.model-selector');
            parent.querySelectorAll('.model-option').forEach(opt => opt.classList.remove('selected'));
            e.target.classList.add('selected');
        });
    });
    
    // General settings
    document.getElementById('saveSettings').addEventListener('click', () => saveGeneralSettings());
});

// Load configuration from storage
function loadConfiguration() {
    chrome.storage.local.get(['ai_config', 'extraction_settings'], (result) => {
        const config = result.ai_config || {};
        const settings = result.extraction_settings || {};
        
        // Update Gemini status
        if (config.gemini_api_key) {
            document.getElementById('geminiKey').value = config.gemini_api_key;
            updateStatus('gemini', true, 'Configured');
            document.getElementById('geminiOption').classList.add('active');
        }
        
        // Update OpenAI status
        if (config.openai_api_key) {
            document.getElementById('openaiKey').value = config.openai_api_key;
            updateStatus('openai', true, 'Configured');
            document.getElementById('openaiOption').classList.add('active');
            
            // Set selected model
            if (config.openai_model) {
                document.querySelectorAll('#openaiOption .model-option').forEach(opt => {
                    opt.classList.remove('selected');
                    if (opt.dataset.model === config.openai_model) {
                        opt.classList.add('selected');
                    }
                });
            }
        }
        
        // Update Claude status
        if (config.anthropic_api_key) {
            document.getElementById('claudeKey').value = config.anthropic_api_key;
            updateStatus('claude', true, 'Configured');
            document.getElementById('claudeOption').classList.add('active');
        }
        
        // Update Ollama status
        if (config.ollama_enabled) {
            document.getElementById('ollamaSwitch').classList.add('active');
            document.getElementById('ollamaModels').style.display = 'flex';
            updateStatus('ollama', true, 'Enabled');
            document.getElementById('ollamaOption').classList.add('active');
        }
        
        // Load general settings
        if (settings.maxPages) {
            document.getElementById('maxPages').value = settings.maxPages;
        }
        
        if (settings.extractionDepth) {
            document.querySelectorAll('[data-depth]').forEach(opt => {
                opt.classList.remove('selected');
                if (opt.dataset.depth === settings.extractionDepth) {
                    opt.classList.add('selected');
                }
            });
        }
    });
}

// Update status indicator
function updateStatus(service, active, text) {
    const statusDot = document.getElementById(`${service}Status`);
    const statusText = document.getElementById(`${service}StatusText`);
    
    if (active) {
        statusDot.classList.add('active');
    } else {
        statusDot.classList.remove('active');
    }
    
    if (statusText) {
        statusText.textContent = text;
    }
}

// Show message
function showMessage(elementId, message, type) {
    const msgElement = document.getElementById(elementId);
    msgElement.className = `message ${type}`;
    msgElement.textContent = message;
    msgElement.style.display = 'block';
    
    setTimeout(() => {
        msgElement.style.display = 'none';
    }, 5000);
}

// Save Gemini configuration
async function saveGemini() {
    const apiKey = document.getElementById('geminiKey').value.trim();
    
    if (!apiKey) {
        showMessage('geminiMessage', 'Please enter an API key', 'error');
        return;
    }
    
    // Test the API key
    showMessage('geminiMessage', 'Testing API key...', 'warning');
    
    try {
        const isValid = await testGeminiKey(apiKey);
        
        if (isValid) {
            // Save to storage
            chrome.storage.local.get(['ai_config'], (result) => {
                const config = result.ai_config || {};
                config.gemini_api_key = apiKey;
                
                chrome.storage.local.set({ ai_config: config }, () => {
                    updateStatus('gemini', true, 'Configured');
                    document.getElementById('geminiOption').classList.add('active');
                    showMessage('geminiMessage', 'Gemini API key saved successfully!', 'success');
                });
            });
        } else {
            showMessage('geminiMessage', 'Invalid API key. Please check and try again.', 'error');
        }
    } catch (error) {
        showMessage('geminiMessage', 'Error testing API key: ' + error.message, 'error');
    }
}

// Test Gemini API key
async function testGeminiKey(apiKey) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: 'Test' }]
                }]
            })
        });
        
        // If we get a 200 or 400 (which means the key works but the request is malformed), it's valid
        return response.status === 200 || response.status === 400;
    } catch (error) {
        console.error('Gemini test error:', error);
        return false;
    }
}

// Remove Gemini configuration
function removeGemini() {
    chrome.storage.local.get(['ai_config'], (result) => {
        const config = result.ai_config || {};
        delete config.gemini_api_key;
        
        chrome.storage.local.set({ ai_config: config }, () => {
            document.getElementById('geminiKey').value = '';
            updateStatus('gemini', false, 'Not Configured');
            document.getElementById('geminiOption').classList.remove('active');
            showMessage('geminiMessage', 'Gemini configuration removed', 'success');
        });
    });
}

// Save OpenAI configuration
async function saveOpenAI() {
    const apiKey = document.getElementById('openaiKey').value.trim();
    const selectedModel = document.querySelector('#openaiOption .model-option.selected').dataset.model;
    
    if (!apiKey) {
        showMessage('openaiMessage', 'Please enter an API key', 'error');
        return;
    }
    
    // Test the API key
    showMessage('openaiMessage', 'Testing API key...', 'warning');
    
    try {
        const isValid = await testOpenAIKey(apiKey);
        
        if (isValid) {
            // Save to storage
            chrome.storage.local.get(['ai_config'], (result) => {
                const config = result.ai_config || {};
                config.openai_api_key = apiKey;
                config.openai_model = selectedModel;
                
                chrome.storage.local.set({ ai_config: config }, () => {
                    updateStatus('openai', true, 'Configured');
                    document.getElementById('openaiOption').classList.add('active');
                    showMessage('openaiMessage', 'OpenAI API key saved successfully!', 'success');
                });
            });
        } else {
            showMessage('openaiMessage', 'Invalid API key. Please check and try again.', 'error');
        }
    } catch (error) {
        showMessage('openaiMessage', 'Error testing API key: ' + error.message, 'error');
    }
}

// Test OpenAI API key
async function testOpenAIKey(apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        return response.status === 200;
    } catch (error) {
        console.error('OpenAI test error:', error);
        return false;
    }
}

// Remove OpenAI configuration
function removeOpenAI() {
    chrome.storage.local.get(['ai_config'], (result) => {
        const config = result.ai_config || {};
        delete config.openai_api_key;
        delete config.openai_model;
        
        chrome.storage.local.set({ ai_config: config }, () => {
            document.getElementById('openaiKey').value = '';
            updateStatus('openai', false, 'Not Configured');
            document.getElementById('openaiOption').classList.remove('active');
            showMessage('openaiMessage', 'OpenAI configuration removed', 'success');
        });
    });
}

// Save Claude configuration
async function saveClaude() {
    const apiKey = document.getElementById('claudeKey').value.trim();
    
    if (!apiKey) {
        showMessage('claudeMessage', 'Please enter an API key', 'error');
        return;
    }
    
    // Note: Claude API testing requires CORS headers which aren't available in browser
    // So we'll save it and let the user know
    showMessage('claudeMessage', 'Saving API key...', 'warning');
    
    chrome.storage.local.get(['ai_config'], (result) => {
        const config = result.ai_config || {};
        config.anthropic_api_key = apiKey;
        
        chrome.storage.local.set({ ai_config: config }, () => {
            updateStatus('claude', true, 'Configured');
            document.getElementById('claudeOption').classList.add('active');
            showMessage('claudeMessage', 'Claude API key saved! Note: Testing will occur on first use.', 'success');
        });
    });
}

// Remove Claude configuration
function removeClaude() {
    chrome.storage.local.get(['ai_config'], (result) => {
        const config = result.ai_config || {};
        delete config.anthropic_api_key;
        
        chrome.storage.local.set({ ai_config: config }, () => {
            document.getElementById('claudeKey').value = '';
            updateStatus('claude', false, 'Not Configured');
            document.getElementById('claudeOption').classList.remove('active');
            showMessage('claudeMessage', 'Claude configuration removed', 'success');
        });
    });
}

// Toggle Ollama
function toggleOllama() {
    const switchElement = document.getElementById('ollamaSwitch');
    const modelsElement = document.getElementById('ollamaModels');
    const isActive = switchElement.classList.contains('active');
    
    if (isActive) {
        // Disable
        switchElement.classList.remove('active');
        modelsElement.style.display = 'none';
        
        chrome.storage.local.get(['ai_config'], (result) => {
            const config = result.ai_config || {};
            delete config.ollama_enabled;
            delete config.ollama_model;
            
            chrome.storage.local.set({ ai_config: config }, () => {
                updateStatus('ollama', false, 'Disabled');
                document.getElementById('ollamaOption').classList.remove('active');
            });
        });
    } else {
        // Enable
        switchElement.classList.add('active');
        modelsElement.style.display = 'flex';
        
        const selectedModel = document.querySelector('#ollamaModels .model-option.selected').dataset.model;
        
        chrome.storage.local.get(['ai_config'], (result) => {
            const config = result.ai_config || {};
            config.ollama_enabled = true;
            config.ollama_model = selectedModel;
            
            chrome.storage.local.set({ ai_config: config }, () => {
                updateStatus('ollama', true, 'Enabled');
                document.getElementById('ollamaOption').classList.add('active');
            });
        });
    }
}

// Test Ollama connection
async function testOllama() {
    showMessage('ollamaMessage', 'Testing Ollama connection...', 'warning');
    
    try {
        // Try to connect to local Ollama server
        const response = await fetch('http://localhost:11434/api/tags', {
            method: 'GET'
        });
        
        if (response.ok) {
            const data = await response.json();
            const models = data.models || [];
            
            if (models.length > 0) {
                const modelNames = models.map(m => m.name).join(', ');
                showMessage('ollamaMessage', `Connected! Available models: ${modelNames}`, 'success');
            } else {
                showMessage('ollamaMessage', 'Connected but no models found. Please pull a model using: ollama pull llama2', 'warning');
            }
        } else {
            showMessage('ollamaMessage', 'Could not connect to Ollama. Make sure it\'s running.', 'error');
        }
    } catch (error) {
        showMessage('ollamaMessage', 'Ollama not found. Please install and run Ollama first.', 'error');
    }
}

// Save general settings
function saveGeneralSettings() {
    const maxPages = document.getElementById('maxPages').value;
    const extractionDepth = document.querySelector('[data-depth].selected').dataset.depth;
    
    const settings = {
        maxPages: parseInt(maxPages),
        extractionDepth: extractionDepth
    };
    
    chrome.storage.local.set({ extraction_settings: settings }, () => {
        showMessage('settingsMessage', 'Settings saved successfully!', 'success');
    });
}
