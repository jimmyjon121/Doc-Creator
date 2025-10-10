// Content script injector for sending data to Doc Creator
// This script is injected into the Doc Creator page to receive data

(function() {
    // Check if we're on a Doc Creator page
    const isDocCreator = window.location.href.includes('AppsCode-DeluxeCMS.html') || 
                         window.location.href.includes(':8000') ||
                         window.location.href.includes('localhost');
    
    if (!isDocCreator) {
        return; // Not on Doc Creator page
    }
    
    // Auto-login for Chrome Extension if not already logged in
    if (!sessionStorage.getItem('isLoggedIn')) {
        console.log('Auto-logging in for Chrome Extension...');
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', 'ChromeExtension');
        sessionStorage.setItem('fullName', 'Chrome Extension User');
        sessionStorage.setItem('isMaster', 'false');
        
        // Initialize encryption with a default key for Chrome extension
        if (typeof DataEncryption !== 'undefined' && DataEncryption.isSupported && DataEncryption.isSupported()) {
            const initEncryption = async () => {
                if (typeof dataEncryption !== 'undefined' && dataEncryption.initialize) {
                    await dataEncryption.initialize('ChromeExtension');
                    console.log('Encryption initialized for Chrome Extension');
                }
            };
            initEncryption();
        }
        
        // If we're on the login screen, trigger a reload to bypass it
        if (document.getElementById('loginScreen') && document.getElementById('loginScreen').style.display !== 'none') {
            window.location.reload();
            return;
        }
    }
    
    // Listen for messages from the extension
    chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
        console.log('Content injector received message:', request);
        
        if (request.action === 'addProgram' && request.data) {
            // Ensure encryption is initialized before processing
            const processData = async () => {
                // Wait a moment for the page to fully load
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Initialize encryption if needed
                if (typeof dataEncryption !== 'undefined' && !dataEncryption.isInitialized) {
                    console.log('Initializing encryption for data processing...');
                    await dataEncryption.initialize('ChromeExtension');
                }
                
                // Check if the handleChromeExtensionData function exists
                if (typeof handleChromeExtensionData === 'function') {
                    console.log('Calling handleChromeExtensionData with:', request.data);
                    
                    try {
                        // Call the function with the data
                        handleChromeExtensionData(request.data);
                        
                        // Show success notification
                        const notification = document.createElement('div');
                        notification.style.cssText = `
                            position: fixed;
                            top: 20px;
                            right: 20px;
                            background: linear-gradient(135deg, #10b981, #059669);
                            color: white;
                            padding: 15px 25px;
                            border-radius: 8px;
                            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                            z-index: 100000;
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            font-size: 14px;
                            display: flex;
                            align-items: center;
                            gap: 10px;
                            animation: slideInRight 0.3s ease;
                        `;
                        notification.innerHTML = `
                            <span style="font-size: 20px;">✅</span>
                            <div>
                                <strong>Program Data Received!</strong><br>
                                <span style="opacity: 0.9; font-size: 12px;">Processing extraction from Chrome Extension</span>
                            </div>
                        `;
                        document.body.appendChild(notification);
                        
                        // Add animation if not already added
                        if (!document.getElementById('chromeExtensionAnimations')) {
                            const style = document.createElement('style');
                            style.id = 'chromeExtensionAnimations';
                            style.textContent = `
                                @keyframes slideInRight {
                                    from { transform: translateX(100%); opacity: 0; }
                                    to { transform: translateX(0); opacity: 1; }
                                }
                            `;
                            document.head.appendChild(style);
                        }
                        
                        setTimeout(() => {
                            notification.style.animation = 'slideInRight 0.3s ease reverse';
                            setTimeout(() => notification.remove(), 300);
                        }, 3000);
                        
                        return { success: true, message: 'Data processed successfully' };
                    } catch (error) {
                        console.error('Error calling handleChromeExtensionData:', error);
                        return { success: false, error: error.message };
                    }
                } else {
                    // Try alternative method - post message to window
                    console.log('handleChromeExtensionData not found, trying window.postMessage');
                    
                    window.postMessage({
                        action: 'addProgram',
                        data: request.data,
                        source: 'FamilyFirstExtension'
                    }, '*');
                    
                    // Also try to inject the function call directly
                    const script = document.createElement('script');
                    script.textContent = `
                        if (typeof handleChromeExtensionData === 'function') {
                            console.log('Injecting data via script tag');
                            handleChromeExtensionData(${JSON.stringify(request.data)});
                        }
                    `;
                    document.head.appendChild(script);
                    setTimeout(() => script.remove(), 100);
                    
                    return { success: true, message: 'Message posted via alternative method' };
                }
            };
            
            // Process data and send response
            processData().then(result => {
                sendResponse(result);
            }).catch(error => {
                sendResponse({ success: false, error: error.toString() });
            });
            
            return true; // Keep message channel open for async response
        }
    });
    
    console.log('Chrome Extension content injector loaded on Doc Creator page');
})();
