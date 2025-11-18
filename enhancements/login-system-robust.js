/**
 * Robust Login System for CareConnect Pro
 * 
 * This module consolidates and strengthens the login system to prevent failures.
 * Key improvements:
 * - Single source of truth for login state
 * - Proper DOM readiness checks
 * - Race condition prevention
 * - Comprehensive error handling
 * - Ready for new landing page integration
 */

(function() {
    'use strict';
    
    console.log('🔐 Loading robust login system...');
    
    // ============================================
    // CONFIGURATION & CONSTANTS
    // ============================================
    const CONFIG = {
        MASTER_USERNAME: 'MasterAdmin',
        MASTER_PASSWORD: 'FFA@dm1n2025!',
        LEGACY_USERNAME: 'Doc121',
        LEGACY_PASSWORD: 'FFA121',
        ACCOUNT_STORAGE_KEY: 'careconnect_user_accounts',
        SESSION_KEY: 'isLoggedIn',
        USERNAME_KEY: 'username',
        FULLNAME_KEY: 'fullName',
        MANUAL_LOGIN_KEY: 'manualLogin',
        INIT_TIMEOUT: 5000, // Max time to wait for DOM
        RETRY_DELAY: 100, // Delay between retries
        MAX_RETRIES: 50 // Max retries for DOM readiness
    };
    
    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const LoginState = {
        initialized: false,
        loginScreen: null,
        mainApp: null,
        loginForm: null,
        isProcessing: false,
        retryCount: 0
    };
    
    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    /**
     * Safe sessionStorage getter with fallback
     */
    function getSession(key, defaultValue = null) {
        try {
            return sessionStorage.getItem(key) || defaultValue;
        } catch (e) {
            console.warn(`SessionStorage get failed for ${key}:`, e);
            return defaultValue;
        }
    }
    
    /**
     * Safe sessionStorage setter with error handling
     */
    function setSession(key, value) {
        try {
            sessionStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.error(`SessionStorage set failed for ${key}:`, e);
            return false;
        }
    }
    
    /**
     * Check if user is logged in (single source of truth)
     */
    function isLoggedIn() {
        return getSession(CONFIG.SESSION_KEY) === 'true';
    }
    
    /**
     * Wait for DOM element with retry logic
     */
    function waitForElement(selector, maxRetries = CONFIG.MAX_RETRIES) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            
            function check() {
                attempts++;
                const element = document.querySelector(selector);
                
                if (element) {
                    resolve(element);
                } else if (attempts >= maxRetries) {
                    reject(new Error(`Element not found: ${selector} after ${attempts} attempts`));
                } else {
                    setTimeout(check, CONFIG.RETRY_DELAY);
                }
            }
            
            check();
        });
    }
    
    /**
     * Ensure DOM is ready before proceeding
     */
    function ensureDOMReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'complete' || document.readyState === 'interactive') {
                resolve();
            } else {
                window.addEventListener('DOMContentLoaded', resolve, { once: true });
                window.addEventListener('load', resolve, { once: true });
            }
        });
    }
    
    // ============================================
    // PASSWORD HASHING (Secure)
    // ============================================
    
    /**
     * Secure password hashing using Web Crypto API
     */
    async function hashPassword(password, username) {
        try {
            if (!crypto || !crypto.subtle) {
                throw new Error('Web Crypto API not available');
            }
            
            const encoder = new TextEncoder();
            const data = encoder.encode(password + username.toLowerCase() + 'FFAS_SECURE_2025');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        } catch (error) {
            console.error('Password hashing failed:', error);
            // Fallback to simple hash (not secure, but prevents complete failure)
            return btoa(password + username + 'FFAS_SALT_2025');
        }
    }
    
    // ============================================
    // CREDENTIAL VERIFICATION
    // ============================================
    
    /**
     * Get user accounts from localStorage
     */
    function getUserAccounts() {
        try {
            const accounts = localStorage.getItem(CONFIG.ACCOUNT_STORAGE_KEY);
            return accounts ? JSON.parse(accounts) : [];
        } catch (e) {
            console.error('Failed to get user accounts:', e);
            return [];
        }
    }
    
    /**
     * Verify user credentials with comprehensive error handling
     */
    async function verifyCredentials(username, password) {
        try {
            if (!username || !password) {
                return { valid: false, error: 'Username and password are required' };
            }
            
            const trimmedUsername = username.trim();
            
            // Check master admin
            if (trimmedUsername === CONFIG.MASTER_USERNAME && password === CONFIG.MASTER_PASSWORD) {
                return {
                    valid: true,
                    isMaster: true,
                    username: CONFIG.MASTER_USERNAME,
                    fullName: 'Master Admin'
                };
            }
            
            // Check legacy credentials (case-insensitive username)
            if (trimmedUsername.toLowerCase() === CONFIG.LEGACY_USERNAME.toLowerCase() && 
                password === CONFIG.LEGACY_PASSWORD) {
                return {
                    valid: true,
                    isMaster: false,
                    username: CONFIG.LEGACY_USERNAME,
                    fullName: 'Legacy User'
                };
            }
            
            // Check user accounts
            const accounts = getUserAccounts();
            const secureHash = await hashPassword(password, trimmedUsername);
            
            // Try secure hash first
            let user = accounts.find(acc => 
                acc.username === trimmedUsername && acc.password === secureHash
            );
            
            // Fallback: Check old btoa() hash for migration
            if (!user) {
                const oldHash = btoa(password + 'FFAS_SALT_2025');
                user = accounts.find(acc => 
                    acc.username === trimmedUsername && acc.password === oldHash
                );
                
                // Migrate to secure hash if found
                if (user) {
                    console.log('🔄 Migrating old password hash to secure SHA-256');
                    user.password = secureHash;
                    user.hashMethod = 'sha256';
                    try {
                        localStorage.setItem(CONFIG.ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
                    } catch (e) {
                        console.error('Failed to migrate password:', e);
                    }
                }
            }
            
            if (user) {
                // Update last login
                try {
                    user.lastLogin = new Date().toISOString();
                    localStorage.setItem(CONFIG.ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
                } catch (e) {
                    console.warn('Failed to update last login:', e);
                }
                
                return {
                    valid: true,
                    isMaster: false,
                    username: user.username,
                    fullName: user.fullName || user.username
                };
            }
            
            return { valid: false, error: 'Invalid username or password' };
            
        } catch (error) {
            console.error('Credential verification error:', error);
            return { valid: false, error: 'Login system error. Please try again.' };
        }
    }
    
    // ============================================
    // UI MANAGEMENT
    // ============================================
    
    /**
     * Show login screen with proper error handling
     */
    function showLoginScreen() {
        try {
            if (!LoginState.loginScreen) {
                console.warn('Login screen element not found');
                return false;
            }
            
            // Force login screen visible
            Object.assign(LoginState.loginScreen.style, {
                display: 'flex',
                visibility: 'visible',
                opacity: '1',
                zIndex: '10000',
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            });
            
            // Hide main app
            if (LoginState.mainApp) {
                LoginState.mainApp.style.display = 'none';
                LoginState.mainApp.style.visibility = 'hidden';
            }
            
            return true;
        } catch (error) {
            console.error('Failed to show login screen:', error);
            return false;
        }
    }
    
    /**
     * Hide login screen and show main app
     */
    function hideLoginScreen() {
        try {
            if (LoginState.loginScreen) {
                LoginState.loginScreen.style.display = 'none';
                LoginState.loginScreen.style.visibility = 'hidden';
            }
            
            if (LoginState.mainApp) {
                LoginState.mainApp.style.display = 'block';
                LoginState.mainApp.style.visibility = 'visible';
                LoginState.mainApp.style.opacity = '1';
            }
            
            return true;
        } catch (error) {
            console.error('Failed to hide login screen:', error);
            return false;
        }
    }
    
    /**
     * Show error message in login form
     */
    function showLoginError(message) {
        try {
            let errorDiv = document.getElementById('loginError');
            if (!errorDiv) {
                // Create error div if it doesn't exist
                errorDiv = document.createElement('div');
                errorDiv.id = 'loginError';
                errorDiv.style.cssText = 'display: none; color: #e74c3c; margin-top: 10px; text-align: center; padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 8px;';
                if (LoginState.loginForm) {
                    LoginState.loginForm.appendChild(errorDiv);
                }
            }
            
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (errorDiv) {
                    errorDiv.style.display = 'none';
                }
            }, 5000);
        } catch (error) {
            console.error('Failed to show login error:', error);
        }
    }
    
    /**
     * Update login button state
     */
    function setLoginButtonState(button, isLoading, text = null) {
        if (!button) return;
        
        if (isLoading) {
            button.disabled = true;
            button.dataset.originalText = button.textContent;
            button.textContent = text || 'Verifying...';
        } else {
            button.disabled = false;
            button.textContent = button.dataset.originalText || text || 'Sign In';
        }
    }
    
    // ============================================
    // LOGIN HANDLER (Main Function)
    // ============================================
    
    /**
     * Main login handler with comprehensive error handling
     */
    async function handleLogin(event) {
        // Prevent double-submission
        if (LoginState.isProcessing) {
            console.warn('Login already in progress');
            return false;
        }
        
        try {
            event.preventDefault();
            event.stopPropagation();
            
            LoginState.isProcessing = true;
            
            // Get form elements with null checks
            const usernameInput = document.getElementById('loginUsername');
            const passwordInput = document.getElementById('loginPassword');
            const submitBtn = event.target.querySelector('button[type="submit"]') || 
                            event.target.closest('form')?.querySelector('button[type="submit"]');
            
            if (!usernameInput || !passwordInput) {
                throw new Error('Login form elements not found');
            }
            
            const username = usernameInput.value.trim();
            const password = passwordInput.value;
            
            // Basic validation
            if (!username) {
                showLoginError('Please enter your username');
                setLoginButtonState(submitBtn, false);
                LoginState.isProcessing = false;
                return false;
            }
            
            if (!password) {
                showLoginError('Please enter your password');
                setLoginButtonState(submitBtn, false);
                LoginState.isProcessing = false;
                return false;
            }
            
            // Show loading state
            setLoginButtonState(submitBtn, true, 'Verifying...');
            
            // Verify credentials
            const result = await verifyCredentials(username, password);
            
            if (result.valid) {
                // Success - store session
                setSession(CONFIG.SESSION_KEY, 'true');
                setSession(CONFIG.USERNAME_KEY, result.username);
                setSession(CONFIG.FULLNAME_KEY, result.fullName || result.username);
                setSession('isMaster', result.isMaster ? 'true' : 'false');
                setSession(CONFIG.MANUAL_LOGIN_KEY, 'true');
                
                // Clear password field for security
                passwordInput.value = '';
                
                // Initialize encryption if available
                if (window.DataEncryption && typeof window.DataEncryption.isSupported === 'function' && 
                    window.DataEncryption.isSupported() && window.dataEncryption) {
                    try {
                        await window.dataEncryption.initialize(password);
                        console.log('🔒 Data encryption activated');
                    } catch (e) {
                        console.warn('Encryption initialization failed:', e);
                    }
                }
                
                // Hide login screen
                hideLoginScreen();
                
                // Trigger welcome animation if available
                if (typeof window.showWelcomeAnimation === 'function') {
                    try {
                        window.showWelcomeAnimation(result.fullName || result.username, false);
                    } catch (e) {
                        console.warn('Welcome animation failed:', e);
                        // Fallback: just show main app
                        hideLoginScreen();
                    }
                } else {
                    // No animation, just show main app
                    hideLoginScreen();
                }
                
                // Update user display if function exists
                if (typeof window.updateUserDisplay === 'function') {
                    setTimeout(() => {
                        try {
                            window.updateUserDisplay();
                        } catch (e) {
                            console.warn('User display update failed:', e);
                        }
                    }, 500);
                }
                
                // Enable auto-save if available
                if (typeof window.enableAutoSave === 'function') {
                    try {
                        window.enableAutoSave();
                    } catch (e) {
                        console.warn('Auto-save enable failed:', e);
                    }
                }
                
                console.log('✅ Login successful');
                LoginState.isProcessing = false;
                return true;
                
            } else {
                // Failed login
                showLoginError(result.error || 'Invalid username or password. Please try again.');
                setLoginButtonState(submitBtn, false);
                passwordInput.value = '';
                passwordInput.focus();
                LoginState.isProcessing = false;
                return false;
            }
            
        } catch (error) {
            console.error('Login handler error:', error);
            showLoginError('An error occurred during login. Please try again.');
            
            const submitBtn = event.target.querySelector('button[type="submit"]') || 
                            event.target.closest('form')?.querySelector('button[type="submit"]');
            setLoginButtonState(submitBtn, false);
            
            LoginState.isProcessing = false;
            return false;
        }
    }
    
    // ============================================
    // INITIALIZATION
    // ============================================
    
    /**
     * Initialize login system
     */
    async function initializeLoginSystem() {
        try {
            // Wait for DOM
            await ensureDOMReady();
            
            // Wait for required elements
            LoginState.loginScreen = await waitForElement('#loginScreen').catch(() => null);
            LoginState.mainApp = await waitForElement('#mainApp').catch(() => null);
            LoginState.loginForm = await waitForElement('#loginScreen form, form[action*="login"]').catch(() => null);
            
            // Check login state
            const loggedIn = isLoggedIn();
            
            if (loggedIn) {
                // User is logged in - hide login screen
                hideLoginScreen();
                console.log('✅ User already logged in');
            } else {
                // User not logged in - show login screen
                showLoginScreen();
                console.log('🔐 Login screen displayed');
            }
            
            // Attach login handler to form
            if (LoginState.loginForm) {
                // Remove any existing handlers
                const newForm = LoginState.loginForm.cloneNode(true);
                LoginState.loginForm.parentNode.replaceChild(newForm, LoginState.loginForm);
                LoginState.loginForm = newForm;
                
                // Attach new handler
                LoginState.loginForm.addEventListener('submit', handleLogin, { capture: true });
                
                // Also handle Enter key in password field
                const passwordInput = LoginState.loginForm.querySelector('input[type="password"]');
                if (passwordInput) {
                    passwordInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter' && !LoginState.isProcessing) {
                            e.preventDefault();
                            handleLogin({ 
                                preventDefault: () => {}, 
                                stopPropagation: () => {},
                                target: LoginState.loginForm 
                            });
                        }
                    });
                }
            }
            
            // Expose handleLogin globally for backward compatibility
            window.handleLogin = handleLogin;
            
            // Expose login state checker
            window.isLoggedIn = isLoggedIn;
            
            LoginState.initialized = true;
            console.log('✅ Login system initialized');
            
        } catch (error) {
            console.error('❌ Login system initialization failed:', error);
            
            // Fallback: Try to show login screen anyway
            setTimeout(() => {
                const loginScreen = document.getElementById('loginScreen');
                const mainApp = document.getElementById('mainApp');
                
                if (loginScreen && !isLoggedIn()) {
                    showLoginScreen();
                } else if (mainApp && isLoggedIn()) {
                    hideLoginScreen();
                }
            }, 1000);
        }
    }
    
    // ============================================
    // STARTUP
    // ============================================
    
    // Initialize immediately if DOM is ready, otherwise wait
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLoginSystem);
    } else {
        initializeLoginSystem();
    }
    
    // Also initialize on window load as backup
    window.addEventListener('load', () => {
        if (!LoginState.initialized) {
            console.warn('Login system not initialized, retrying...');
            initializeLoginSystem();
        }
    });
    
    // Periodic check to ensure login screen state is correct (safety net)
    setInterval(() => {
        if (LoginState.initialized && !LoginState.isProcessing) {
            const loggedIn = isLoggedIn();
            const loginVisible = LoginState.loginScreen && 
                                LoginState.loginScreen.style.display !== 'none';
            
            if (!loggedIn && !loginVisible) {
                console.warn('⚠️ Login state mismatch detected - fixing...');
                showLoginScreen();
            } else if (loggedIn && loginVisible) {
                console.warn('⚠️ Login state mismatch detected - fixing...');
                hideLoginScreen();
            }
        }
    }, 2000); // Check every 2 seconds
    
    console.log('🔐 Robust login system loaded');
})();


