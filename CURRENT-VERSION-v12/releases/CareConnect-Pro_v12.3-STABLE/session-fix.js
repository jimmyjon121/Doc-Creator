/**
 * Session Persistence Fix
 * This script fixes the logout-on-refresh issue
 */

(function() {
    'use strict';
    
    const debugLog = (...args) => {
        if (window.DEBUG) {
            console.log(...args);
        }
    };
    
    debugLog('🔧 Applying session persistence fix...');
    
    // Override the forceLoginScreen function to properly handle localStorage
    window.forceLoginScreen = function() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginExpires = parseInt(localStorage.getItem('loginExpires') || '0', 10);
        const now = Date.now();
        
        // Check if session is expired
        if (isLoggedIn && loginExpires && now > loginExpires) {
            debugLog('⏰ Session expired, clearing...');
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('fullName');
            localStorage.removeItem('loginExpires');
            location.reload();
            return;
        }
        
        // Get or create login screen
        let loginScreen = document.getElementById('loginScreen');
        if (!loginScreen) {
            // Create login screen if it doesn't exist
            loginScreen = document.createElement('div');
            loginScreen.id = 'loginScreen';
            loginScreen.style.cssText = `
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 10000;
                background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%);
                align-items: center;
                justify-content: center;
            `;
            loginScreen.innerHTML = `
                <div style="background: white; padding: 40px; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); max-width: 400px; width: 90%;">
                    <h2 style="margin: 0 0 20px 0; color: #333;">CareConnect Pro</h2>
                    <form id="quickLoginForm" onsubmit="return false;">
                        <input type="text" id="loginUsername" placeholder="Username" value="MasterAdmin" 
                               style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
                        <input type="password" id="loginPassword" placeholder="Password" value="FFA@dm1n2025!" 
                               style="width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 6px; font-size: 16px;">
                        <button type="button" onclick="quickLogin()" 
                                style="width: 100%; padding: 12px; background: #667eea; color: white; border: none; border-radius: 6px; font-size: 16px; cursor: pointer;">
                            Login
                        </button>
                    </form>
                    <p style="margin-top: 20px; color: #666; font-size: 14px;">
                        Default: MasterAdmin / FFA@dm1n2025!
                    </p>
                </div>
            `;
            document.body.appendChild(loginScreen);
        }
        
        // Get main content container
        const mainContent = document.querySelector('.tab-content, .main-content, body > div:not(#loginScreen)');
        
        if (!isLoggedIn) {
            // Show login screen
            loginScreen.style.display = 'flex';
            // Hide main content
            if (mainContent) {
                mainContent.style.display = 'none';
            }
            debugLog('🔐 Showing login screen');
        } else {
            // Hide login screen
            loginScreen.style.display = 'none';
            // Show main content
            if (mainContent) {
                mainContent.style.display = '';
            }
            debugLog('✅ User is logged in, showing main content');
            
            // Refresh TTL
            if (window.refreshLoginSessionTTL) {
                window.refreshLoginSessionTTL();
            }
        }
    };
    
    // Quick login function
    window.quickLogin = function() {
        const usernameInput = document.getElementById('loginUsername');
        const passwordInput = document.getElementById('loginPassword');
        
        if (!usernameInput || !passwordInput) {
            console.error('Login inputs not found');
            return;
        }
        
        const username = usernameInput.value;
        const password = passwordInput.value;
        
        debugLog('Attempting login with:', username);
        
        // Validate credentials
        if ((username === 'MasterAdmin' && password === 'FFA@dm1n2025!') ||
            (username === 'Doc232' && password === 'FFA121')) {
            
            // Set session in localStorage
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            localStorage.setItem('fullName', username === 'MasterAdmin' ? 'Master Administrator' : 'Doc Administrator');
            localStorage.setItem('userRole', 'admin');
            localStorage.setItem('isMaster', 'true');
            localStorage.setItem('manualLogin', 'true');
            
            // Set expiry to 2 hours from now
            const expiry = Date.now() + (2 * 60 * 60 * 1000);
            localStorage.setItem('loginExpires', expiry.toString());
            
            debugLog('✅ Login successful!');
            
            // Hide login screen and show content
            const loginScreen = document.getElementById('loginScreen');
            if (loginScreen) loginScreen.style.display = 'none';
            
            const mainContent = document.querySelector('.tab-content, .main-content, body > div:not(#loginScreen)');
            if (mainContent) mainContent.style.display = '';
            
            // Reload to properly initialize everything
            location.reload();
        } else {
            alert('Invalid credentials. Use MasterAdmin / FFA@dm1n2025!');
        }
    };
    
    // Check session on load
    function initSession() {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        debugLog('Session check on load - isLoggedIn:', isLoggedIn);
        
        if (isLoggedIn) {
            // Verify session hasn't expired
            const loginExpires = parseInt(localStorage.getItem('loginExpires') || '0', 10);
            const now = Date.now();
            
            if (loginExpires && now < loginExpires) {
                debugLog('✅ Valid session found, user remains logged in');
                // Refresh TTL
                const newExpiry = Date.now() + (2 * 60 * 60 * 1000);
                localStorage.setItem('loginExpires', newExpiry.toString());
            } else if (loginExpires && now >= loginExpires) {
                debugLog('⏰ Session expired');
                localStorage.removeItem('isLoggedIn');
                localStorage.removeItem('loginExpires');
                window.forceLoginScreen();
            }
        } else {
            debugLog('🔐 No session found, showing login');
            window.forceLoginScreen();
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSession);
    } else {
        initSession();
    }
    
    debugLog('✅ Session persistence fix applied');
})();
