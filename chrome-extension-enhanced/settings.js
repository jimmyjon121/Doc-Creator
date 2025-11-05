// settings.js - API Key Management

document.addEventListener('DOMContentLoaded', () => {
    // Load existing keys
    loadKeys();
    
    // Save Gemini key
    document.getElementById('saveGemini').addEventListener('click', () => {
        const apiKey = document.getElementById('geminiKey').value.trim();
        const statusDiv = document.getElementById('geminiStatus');
        
        if (!apiKey) {
            showStatus(statusDiv, 'Please enter an API key', 'error');
            return;
        }
        
        // Show testing status
        showStatus(statusDiv, 'Testing API key...', 'info');
        
        // Test the API key
        testGeminiKey(apiKey).then(valid => {
            if (valid) {
                chrome.storage.local.set({ 'gemini_api_key': apiKey }, () => {
                    showStatus(statusDiv, 'Gemini API key saved successfully!', 'success');
                    document.getElementById('geminiKey').value = '';
                });
            } else {
                // Still save it but warn the user
                chrome.storage.local.set({ 'gemini_api_key': apiKey }, () => {
                    showStatus(statusDiv, 'API key saved (validation failed - key may still work)', 'warning');
                    document.getElementById('geminiKey').value = '';
                });
            }
        });
    });
    
    // Save OpenAI key
    document.getElementById('saveOpenAI').addEventListener('click', () => {
        const apiKey = document.getElementById('openaiKey').value.trim();
        const statusDiv = document.getElementById('openaiStatus');
        
        if (!apiKey) {
            showStatus(statusDiv, 'Please enter an API key', 'error');
            return;
        }
        
        // Test the API key
        testOpenAIKey(apiKey).then(valid => {
            if (valid) {
                chrome.storage.local.set({ 'openai_api_key': apiKey }, () => {
                    showStatus(statusDiv, 'OpenAI API key saved successfully!', 'success');
                    document.getElementById('openaiKey').value = '';
                });
            } else {
                showStatus(statusDiv, 'Invalid API key. Please check and try again.', 'error');
            }
        });
    });
});

// Load existing keys
function loadKeys() {
    chrome.storage.local.get(['gemini_api_key', 'openai_api_key'], (result) => {
        if (result.gemini_api_key) {
            document.getElementById('geminiKey').placeholder = 'API key saved (enter new key to update)';
        }
        if (result.openai_api_key) {
            document.getElementById('openaiKey').placeholder = 'API key saved (enter new key to update)';
        }
    });
}

// Test Gemini API key
async function testGeminiKey(apiKey) {
    try {
        // First try to list models to verify the key works
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            return true;
        }
        
        // If that fails, try a simple generation request
        const genResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: 'Say hello'
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 10
                }
            })
        });
        
        // Accept various status codes that indicate the key is valid
        return genResponse.ok || genResponse.status === 400 || genResponse.status === 429;
    } catch (error) {
        console.error('Gemini test error:', error);
        return false;
    }
}

// Test OpenAI API key
async function testOpenAIKey(apiKey) {
    try {
        const response = await fetch('https://api.openai.com/v1/models', {
            headers: {
                'Authorization': `Bearer ${apiKey}`
            }
        });
        
        return response.ok;
    } catch (error) {
        console.error('OpenAI test error:', error);
        return false;
    }
}

// Show status message
function showStatus(element, message, type) {
    element.textContent = message;
    element.className = `status ${type}`;
    element.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            element.style.display = 'none';
        }, 3000);
    }
}
