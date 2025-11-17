/**
 * CareConnect Authentication Module
 * Handles user authentication, session management, and security
 */

class AuthManager {
    constructor() {
        this.SESSION_KEY = 'careconnect_session';
        this.USER_KEY = 'careconnect_user';
        this.REMEMBER_KEY = 'careconnect_remember';
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
        this.loginAttempts = this.getLoginAttempts();
        
        // Initialize
        this.init();
    }
    
    init() {
        // Check if user is already logged in - redirect to app if so
        if (sessionStorage.getItem('isLoggedIn') === 'true') {
            console.log('Already logged in, redirecting to app...');
            window.location.href = 'index.html';
            return;
        }
        
        // Check for existing session
        this.checkSession();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check for remembered credentials
        this.loadRememberedCredentials();
    }
    
    setupEventListeners() {
        // Login form submission
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
        
        // Signup form submission
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }
        
        // Password reset
        const resetForm = document.getElementById('resetForm');
        if (resetForm) {
            resetForm.addEventListener('submit', (e) => this.handlePasswordReset(e));
        }
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }
    }
    
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const button = form.querySelector('.btn-primary');
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const remember = document.getElementById('remember').checked;
        
        // Check if account is locked
        if (this.isAccountLocked()) {
            const remainingTime = this.getRemainingLockTime();
            this.showError(`Account is locked. Please try again in ${Math.ceil(remainingTime / 60000)} minutes.`);
            return;
        }
        
        // Validate inputs
        if (!this.validateLoginInputs(username, password)) {
            return;
        }
        
        // Show loading state
        this.setButtonLoading(button, true);
        
        try {
            // Authenticate user
            const result = await this.authenticate(username, password);
            
            if (result.success) {
                // Reset login attempts
                this.resetLoginAttempts();
                
                // Handle remember me
                if (remember) {
                    this.rememberCredentials(username);
                } else {
                    this.forgetCredentials();
                }
                
                // Create session
                this.createSession(result.user);
                
                // Show success
                this.showSuccess(button);
                
                // Redirect after delay
                setTimeout(() => {
                    this.redirectToDashboard();
                }, 1000);
            } else {
                // Increment login attempts
                this.incrementLoginAttempts();
                
                // Show error
                this.showError(result.message || 'Invalid credentials');
                this.setButtonLoading(button, false);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('An error occurred during login. Please try again.');
            this.setButtonLoading(button, false);
        }
    }
    
    async authenticate(username, password) {
        // Integrate with existing CareConnect authentication system
        await this.delay(500); // Small delay for UX
        
        // Constants matching index.html
        const MASTER_USERNAME = 'MasterAdmin';
        const MASTER_PASSWORD = 'FFA@dm1n2025!';
        const LEGACY_USERNAME = 'Doc121';
        const LEGACY_PASSWORD = 'FFA121';
        const ACCOUNT_STORAGE_KEY = 'careconnect_user_accounts';
        
        // Secure password hashing using Web Crypto API (SHA-256)
        async function hashPassword(password, username) {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + username.toLowerCase() + 'FFAS_SECURE_2025');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            return hashHex;
        }
        
        // Get user accounts from localStorage
        function getUserAccounts() {
            const accounts = localStorage.getItem(ACCOUNT_STORAGE_KEY);
            return accounts ? JSON.parse(accounts) : [];
        }
        
        // Update last login timestamp
        function updateLastLogin(username) {
            const accounts = getUserAccounts();
            const userIndex = accounts.findIndex(acc => acc.username === username);
            if (userIndex !== -1) {
                accounts[userIndex].lastLogin = new Date().toISOString();
                localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
            }
        }
        
        // Check master backdoor first
        if (username === MASTER_USERNAME && password === MASTER_PASSWORD) {
            return {
                success: true,
                user: {
                    username: 'Master Admin',
                    name: 'Master Admin',
                    role: 'administrator',
                    isMaster: true,
                    facility: 'Family First',
                    company: 'ClearHive Health',
                    loginTime: new Date().toISOString()
                }
            };
        }
        
        // Check legacy credentials for backward compatibility (case-insensitive username)
        if (username.toLowerCase() === LEGACY_USERNAME.toLowerCase() && password === LEGACY_PASSWORD) {
            return {
                success: true,
                user: {
                    username: 'Legacy User',
                    name: 'Legacy User',
                    role: 'clinician',
                    isMaster: false,
                    facility: 'Family First',
                    company: 'ClearHive Health',
                    loginTime: new Date().toISOString()
                }
            };
        }
        
        // Check user accounts
        const accounts = getUserAccounts();
        
        // Try secure SHA-256 hash first
        const secureHash = await hashPassword(password, username);
        let user = accounts.find(acc => acc.username === username && acc.password === secureHash);
        
        // Fallback: Check old btoa() hash for migration
        if (!user) {
            const oldHash = btoa(password + 'FFAS_SALT_2025');
            user = accounts.find(acc => acc.username === username && acc.password === oldHash);
            
            // If found with old hash, migrate to new hash
            if (user) {
                user.password = secureHash;
                user.hashMethod = 'sha256';
                localStorage.setItem(ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
            }
        }
        
        if (user) {
            updateLastLogin(username);
            return {
                success: true,
                user: {
                    username: user.username,
                    name: user.fullName || user.username,
                    role: 'user',
                    isMaster: false,
                    facility: 'Family First',
                    company: 'ClearHive Health',
                    loginTime: new Date().toISOString()
                }
            };
        }
        
        // Demo credentials for testing (remove in production)
        if (username === 'demo' && password === 'demo') {
            return {
                success: true,
                user: {
                    username: 'demo',
                    name: 'Demo User',
                    role: 'viewer',
                    isMaster: false,
                    facility: 'Family First',
                    company: 'ClearHive Health',
                    loginTime: new Date().toISOString()
                }
            };
        }
        
        return {
            success: false,
            message: 'Invalid username or password'
        };
    }
    
    async handleSignup(event) {
        event.preventDefault();
        
        const form = event.target;
        const button = form.querySelector('.btn-primary');
        
        // Get form values
        const formData = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            username: document.getElementById('newUsername').value.trim(),
            password: document.getElementById('newPassword').value,
            confirmPassword: document.getElementById('confirmPassword').value,
            facility: document.getElementById('facility').value,
            role: document.getElementById('role').value,
            agreeTerms: document.getElementById('agreeTerms').checked
        };
        
        // Validate signup form
        if (!this.validateSignupForm(formData)) {
            return;
        }
        
        // Show loading
        this.setButtonLoading(button, true);
        
        try {
            // Simulate API call
            await this.delay(2000);
            
            // Mock signup success
            const newUser = {
                username: formData.username,
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
                role: formData.role,
                facility: formData.facility,
                company: 'ClearHive Health',
                loginTime: new Date().toISOString()
            };
            
            // Create session
            this.createSession(newUser);
            
            // Show success
            this.showSuccess(button, 'Account created successfully!');
            
            // Redirect
            setTimeout(() => {
                this.redirectToDashboard();
            }, 1500);
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('Failed to create account. Please try again.');
            this.setButtonLoading(button, false);
        }
    }
    
    async handlePasswordReset(event) {
        event.preventDefault();
        
        const form = event.target;
        const button = form.querySelector('.btn-primary');
        const email = document.getElementById('resetEmail').value.trim();
        
        if (!this.validateEmail(email)) {
            this.showError('Please enter a valid email address');
            return;
        }
        
        // Show loading
        this.setButtonLoading(button, true);
        
        try {
            // Simulate API call
            await this.delay(2000);
            
            // Show success message
            this.showSuccess(button, 'Password reset link sent to your email!');
            
            // Clear form
            form.reset();
            
            // Reset button after delay
            setTimeout(() => {
                this.setButtonLoading(button, false);
            }, 3000);
        } catch (error) {
            console.error('Password reset error:', error);
            this.showError('Failed to send reset link. Please try again.');
            this.setButtonLoading(button, false);
        }
    }
    
    validateLoginInputs(username, password) {
        if (!username || username.length < 3) {
            this.showError('Username must be at least 3 characters');
            return false;
        }
        
        // Allow demo credentials (demo/demo) even though password is short
        if (username === 'demo' && password === 'demo') {
            return true;
        }
        
        if (!password || password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return false;
        }
        
        return true;
    }
    
    validateSignupForm(data) {
        const errors = [];
        
        if (!data.firstName || data.firstName.length < 2) {
            errors.push('First name is required');
        }
        
        if (!data.lastName || data.lastName.length < 2) {
            errors.push('Last name is required');
        }
        
        if (!this.validateEmail(data.email)) {
            errors.push('Valid email is required');
        }
        
        if (!data.username || data.username.length < 3) {
            errors.push('Username must be at least 3 characters');
        }
        
        if (!data.password || data.password.length < 8) {
            errors.push('Password must be at least 8 characters');
        }
        
        if (data.password !== data.confirmPassword) {
            errors.push('Passwords do not match');
        }
        
        if (!data.agreeTerms) {
            errors.push('You must agree to the terms and conditions');
        }
        
        if (errors.length > 0) {
            this.showError(errors.join('<br>'));
            return false;
        }
        
        return true;
    }
    
    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }
    
    createSession(user) {
        // Create session matching index.html's expected format
        const session = {
            id: this.generateSessionId(),
            user: user,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        
        // Set sessionStorage keys that index.html expects
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('username', user.username);
        sessionStorage.setItem('fullName', user.name || user.username);
        sessionStorage.setItem('isMaster', user.isMaster ? 'true' : 'false');
        
        // Also store in localStorage for session persistence
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
    
    checkSession() {
        const session = this.getSession();
        
        if (session) {
            const now = new Date();
            const expiresAt = new Date(session.expiresAt);
            
            if (now < expiresAt) {
                // Session is valid
                return true;
            } else {
                // Session expired
                this.clearSession();
                return false;
            }
        }
        
        return false;
    }
    
    getSession() {
        const sessionStr = localStorage.getItem(this.SESSION_KEY);
        return sessionStr ? JSON.parse(sessionStr) : null;
    }
    
    getUser() {
        const userStr = localStorage.getItem(this.USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }
    
    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
        localStorage.removeItem(this.USER_KEY);
    }
    
    logout() {
        // Clear all session data
        this.clearSession();
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('fullName');
        sessionStorage.removeItem('isMaster');
        
        // Redirect to login page
        window.location.href = 'login.html';
    }
    
    rememberCredentials(username) {
        localStorage.setItem(this.REMEMBER_KEY, username);
    }
    
    forgetCredentials() {
        localStorage.removeItem(this.REMEMBER_KEY);
    }
    
    loadRememberedCredentials() {
        const remembered = localStorage.getItem(this.REMEMBER_KEY);
        if (remembered) {
            const usernameInput = document.getElementById('username');
            const rememberCheckbox = document.getElementById('remember');
            
            if (usernameInput) {
                usernameInput.value = remembered;
            }
            
            if (rememberCheckbox) {
                rememberCheckbox.checked = true;
            }
        }
    }
    
    getLoginAttempts() {
        const attempts = localStorage.getItem('login_attempts');
        return attempts ? JSON.parse(attempts) : { count: 0, lastAttempt: null };
    }
    
    incrementLoginAttempts() {
        this.loginAttempts.count++;
        this.loginAttempts.lastAttempt = Date.now();
        localStorage.setItem('login_attempts', JSON.stringify(this.loginAttempts));
    }
    
    resetLoginAttempts() {
        this.loginAttempts = { count: 0, lastAttempt: null };
        localStorage.removeItem('login_attempts');
    }
    
    isAccountLocked() {
        if (this.loginAttempts.count >= this.MAX_LOGIN_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - this.loginAttempts.lastAttempt;
            if (timeSinceLastAttempt < this.LOCKOUT_DURATION) {
                return true;
            } else {
                // Lockout period has expired, reset attempts
                this.resetLoginAttempts();
                return false;
            }
        }
        return false;
    }
    
    getRemainingLockTime() {
        const timeSinceLastAttempt = Date.now() - this.loginAttempts.lastAttempt;
        return this.LOCKOUT_DURATION - timeSinceLastAttempt;
    }
    
    setButtonLoading(button, loading) {
        if (loading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    }
    
    showSuccess(button, message = 'Success!') {
        button.classList.remove('loading');
        button.querySelector('.btn-text').style.display = 'none';
        button.querySelector('.success-icon').style.display = 'inline-block';
        
        if (message !== 'Success!') {
            button.querySelector('.btn-text').textContent = message;
            setTimeout(() => {
                button.querySelector('.btn-text').style.display = 'inline';
                button.querySelector('.success-icon').style.display = 'none';
            }, 2000);
        }
    }
    
    showError(message) {
        // Create or update error message element
        let errorEl = document.getElementById('authError');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.id = 'authError';
            errorEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #FED7D7;
                color: #742A2A;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                z-index: 9999;
                max-width: 400px;
                animation: slideIn 0.3s ease-out;
            `;
            document.body.appendChild(errorEl);
        }
        
        errorEl.innerHTML = message;
        errorEl.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        }, 5000);
    }
    
    redirectToDashboard() {
        // Redirect to main application
        window.location.href = 'index.html';
    }
    
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize authentication manager when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new AuthManager();
    });
} else {
    window.authManager = new AuthManager();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}