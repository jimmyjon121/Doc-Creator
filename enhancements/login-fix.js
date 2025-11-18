// Fix for login screen not showing

console.log('🔐 Login fix applied');

// Early proxy: ensure handleLogin always exists and queues attempts until ready
(function() {
    const existing = typeof window.handleLogin === 'function' ? window.handleLogin : null;
    if (existing && existing.__ccHandleLoginProxy) {
        return; // Proxy already in place
    }

    const queue = [];
    const proxy = function(...args) {
        if (typeof proxy.__impl === 'function') {
            return proxy.__impl.apply(this, args);
        }
        queue.push({ args, context: this });
        console.warn('Login system is still initializing. Attempt queued.');
        return false;
    };

    proxy.__ccHandleLoginProxy = true;
    proxy.__queue = queue;

    if (existing) {
        proxy.__impl = existing;
    }

    window.handleLogin = proxy;
})();

// IMMEDIATE FIX: Set mainApp to hidden before anything else runs
// This runs as early as possible to prevent any display conflicts
(function() {
    // Force mainApp to be hidden immediately if not logged in
    function forceLoginScreen() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(function() {
            const mainApp = document.getElementById('mainApp');
            const loginScreen = document.getElementById('loginScreen');
            
            if (!isLoggedIn) {
                // Force mainApp hidden
                if (mainApp) {
                    mainApp.style.cssText = 'display: none !important;';
                }
                // Force login screen visible
                if (loginScreen) {
                    loginScreen.style.cssText = 'display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 10000 !important; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; align-items: center !important; justify-content: center !important;';
                }
            }
        });
    }
    
    // Run multiple times to catch it early
    forceLoginScreen();
    
    // Also run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceLoginScreen);
    } else {
        forceLoginScreen();
    }
    
    // Also run after a short delay to catch late-loading scripts
    setTimeout(forceLoginScreen, 100);
    setTimeout(forceLoginScreen, 500);
})();

// Override DEV_MODE to ensure login screen shows
(function() {
    // Remove any auto-login that was set
    const isManuallyLoggedIn = sessionStorage.getItem('manualLogin') === 'true';
    
    // Only clear auto-login if a DEV auto-login flag was set, not after manual login attempts
    if (!isManuallyLoggedIn && sessionStorage.getItem('isAutoLogin') === 'true') {
        console.log('🔓 Clearing previous auto-login credentials');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('fullName');
        sessionStorage.removeItem('isAutoLogin');
    }
    
    // Ensure login screen is visible on load
    window.addEventListener('DOMContentLoaded', function() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (!isLoggedIn) {
            if (loginScreen) {
                loginScreen.style.display = 'flex';
                loginScreen.style.visibility = 'visible';
                loginScreen.style.opacity = '1';
                loginScreen.style.zIndex = '10000';
                loginScreen.style.position = 'fixed';
                loginScreen.style.left = '0';
                loginScreen.style.top = '0';
                loginScreen.style.right = '0';
                loginScreen.style.bottom = '0';
            }
            if (mainApp) {
                mainApp.style.display = 'none';
            }
            console.log('✅ Login screen displayed');
        } else {
            console.log('✅ User is logged in');
        }
    });
})();

// Account registry and account creation helpers
(function() {
    const STORAGE_KEY = 'ccpro-user-accounts-v1';
    const DEFAULT_USERS = [
        { username: 'MasterAdmin', password: 'FFA121', role: 'admin', fullName: 'Master Administrator' },
        { username: 'Doc121', password: 'FFA121', role: 'user', fullName: 'Document Creator' }
    ];
    let memoryFallback = [];

    function normalizeAccount(raw) {
        if (!raw || typeof raw !== 'object') {
            return null;
        }
        const username = typeof raw.username === 'string' ? raw.username.trim() : '';
        const password = typeof raw.password === 'string' ? raw.password : '';
        if (!username || !password) {
            return null;
        }
        const role = typeof raw.role === 'string' && raw.role.toLowerCase() === 'admin' ? 'admin' : 'user';
        const fullName = typeof raw.fullName === 'string' && raw.fullName.trim() ? raw.fullName.trim() : username;
        return { username, password, role, fullName };
    }

    function mergeDefaults(accounts) {
        const list = Array.isArray(accounts) ? accounts.slice() : [];
        DEFAULT_USERS.forEach(defaultUser => {
            const exists = list.some(acc => acc.username.toLowerCase() === defaultUser.username.toLowerCase());
            if (!exists) {
                list.push({ ...defaultUser });
            }
        });
        return list;
    }

    function loadAccounts() {
        let parsed = [];
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const raw = JSON.parse(stored);
                if (Array.isArray(raw)) {
                    parsed = raw.map(normalizeAccount).filter(Boolean);
                }
            }
        } catch (error) {
            console.warn('Unable to load stored accounts, falling back to memory copy', error);
            parsed = memoryFallback.slice();
        }
        if (!parsed.length && memoryFallback.length) {
            parsed = memoryFallback.slice();
        }
        parsed = mergeDefaults(parsed);
        memoryFallback = parsed.slice();
        return parsed;
    }

    function saveAccounts(accounts) {
        const normalized = Array.isArray(accounts) ? accounts.map(normalizeAccount).filter(Boolean) : [];
        memoryFallback = normalized.slice();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        } catch (error) {
            console.warn('Unable to persist accounts, using in-memory fallback only', error);
        }
    }

    function addAccount(account) {
        const normalized = normalizeAccount(account);
        if (!normalized) {
            throw new Error('Invalid account details. Please try again.');
        }
        const accounts = loadAccounts();
        const exists = accounts.some(acc => acc.username.toLowerCase() === normalized.username.toLowerCase());
        if (exists) {
            throw new Error('Username already exists. Please choose a different one.');
        }
        accounts.push(normalized);
        saveAccounts(accounts);
        return normalized;
    }

    function getInitials(nameOrUsername) {
        const source = (nameOrUsername || '').trim();
        if (!source) {
            return 'U';
        }
        const parts = source.split(/\s+/).filter(Boolean);
        if (!parts.length) {
            return source.slice(0, 2).toUpperCase();
        }
        const initials = parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
        return initials || source.slice(0, 2).toUpperCase();
    }

    window.ccAccountRegistry = {
        load: loadAccounts,
        save: saveAccounts,
        add: addAccount,
        storageKey: STORAGE_KEY,
        getInitials
    };

    window.showAccountCreation = function() {
        try {
            const usernameInput = prompt('Choose a username (3-20 characters, letters/numbers/._- only):');
            if (!usernameInput) {
                alert('Account creation cancelled.');
                return;
            }
            const username = usernameInput.trim();
            if (!/^[A-Za-z0-9._-]{3,20}$/.test(username)) {
                alert('Username must be 3-20 characters and contain only letters, numbers, periods, underscores, or hyphens.');
                return;
            }

            const passwordInput = prompt('Choose a password (minimum 6 characters):');
            if (!passwordInput) {
                alert('Account creation cancelled.');
                return;
            }
            const password = passwordInput.trim();
            if (password.length < 6) {
                alert('Password must be at least 6 characters long.');
                return;
            }

            const fullNameInput = prompt('Enter a display name for this user (optional):', username);
            const roleInput = prompt('Enter role for this user (admin/user). Leave blank for standard user:', 'user');
            const role = roleInput && roleInput.trim().toLowerCase() === 'admin' ? 'admin' : 'user';

            const account = window.ccAccountRegistry.add({
                username,
                password,
                fullName: fullNameInput && fullNameInput.trim() ? fullNameInput.trim() : username,
                role
            });

            alert(`Account created for ${account.username}. You can now sign in with these credentials.`);
        } catch (error) {
            console.error('Failed to create account', error);
            alert(error && error.message ? error.message : 'Failed to create account. Please try again.');
        }
    };

    // Ensure defaults are present in storage
    saveAccounts(loadAccounts());
})();

// Define handleLogin function if it doesn't exist
// Run immediately, not waiting for DOMContentLoaded
(function() {
    const existing = typeof window.handleLogin === 'function' ? window.handleLogin : null;
    const isProxy = Boolean(existing && existing.__ccHandleLoginProxy);

    if (existing && !isProxy) {
        console.log('✅ handleLogin already defined');
        return;
    }

    console.log('🔐 Creating handleLogin function');

    const queue = isProxy && Array.isArray(existing.__queue) ? existing.__queue : [];

    const realHandleLogin = async function(eventOrUsername, password) {
        try {
            let username, pwd;
            
            // Handle both event object and direct username/password
            if (eventOrUsername && typeof eventOrUsername === 'object' && eventOrUsername.preventDefault) {
                // Event object passed
                eventOrUsername.preventDefault();
                const form = eventOrUsername.target || eventOrUsername.currentTarget;
                const usernameInput = form.querySelector('input[type="text"], input[name="username"], #loginUsername');
                const passwordInput = form.querySelector('input[type="password"], input[name="password"], #loginPassword');
                
                if (!usernameInput || !passwordInput) {
                    // Try global selectors as fallback
                    username = document.querySelector('#loginUsername, input[type="text"]')?.value || '';
                    pwd = document.querySelector('#loginPassword, input[type="password"]')?.value || '';
                } else {
                    username = usernameInput.value.trim();
                    pwd = passwordInput.value;
                }
            } else {
                // Direct username/password passed
                username = String(eventOrUsername || '').trim();
                pwd = String(password || '');
            }
            
            // Clear any previous error
            const errorDiv = document.getElementById('loginError');
            if (errorDiv) {
                errorDiv.style.display = 'none';
                errorDiv.textContent = '';
            }
            
            // Validate inputs
            if (!username || !pwd) {
                const errorMsg = 'Please enter both username and password';
                if (errorDiv) {
                    errorDiv.textContent = errorMsg;
                    errorDiv.style.display = 'block';
                } else {
                    alert(errorMsg);
                }
                return false;
            }
            
            // Validate credentials
            const registry = window.ccAccountRegistry;
            const accounts = registry ? registry.load() : [];
            const normalizedUsername = username.toLowerCase();
            const account = accounts.find(acc => acc.username.toLowerCase() === normalizedUsername);

            if (!account || account.password !== pwd) {
                const errorMsg = 'Invalid username or password';
                if (errorDiv) {
                    errorDiv.textContent = errorMsg;
                    errorDiv.style.display = 'block';
                } else {
                    alert(errorMsg);
                }
                return false;
            }

            const fullName = account.fullName || account.username;
            const initials = registry && typeof registry.getInitials === 'function'
                ? registry.getInitials(fullName)
                : (fullName || account.username).slice(0, 2).toUpperCase();

            // Successful login
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('username', account.username);
            sessionStorage.setItem('userRole', account.role || 'user');
            sessionStorage.setItem('fullName', fullName);
            sessionStorage.setItem('userInitials', initials);
            sessionStorage.setItem('manualLogin', 'true');
            
            console.log('✅ Login successful:', account.username);
            
            // Hide login screen and show main app
            const loginScreen = document.getElementById('loginScreen');
            const mainApp = document.getElementById('mainApp');
            
            if (loginScreen) {
                loginScreen.style.display = 'none';
                loginScreen.style.visibility = 'hidden';
            }
            
            if (mainApp) {
                mainApp.style.display = 'block';
                mainApp.style.visibility = 'visible';
            }
            
            // Update user profile button if it exists
            const userProfileBtn = document.getElementById('userProfileBtn');
            if (userProfileBtn) {
                const usernameDisplay = userProfileBtn.querySelector('.username-display');
                if (usernameDisplay) {
                    usernameDisplay.textContent = account.username;
                }
            }

            const displayFullName = document.getElementById('displayFullName');
            if (displayFullName) {
                displayFullName.textContent = fullName;
            }

            const displayUsername = document.getElementById('displayUsername');
            if (displayUsername) {
                displayUsername.textContent = `@${account.username}`;
            }

            const userInitials = document.getElementById('userInitials');
            if (userInitials) {
                userInitials.textContent = initials;
            }

            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                userAvatar.textContent = initials;
            }
            
            // Reload to ensure all components initialize properly
            setTimeout(() => {
                window.location.reload();
            }, 100);
            
            return true;
        } catch (error) {
            console.error('❌ Login error:', error);
            const errorDiv = document.getElementById('loginError');
            const errorMsg = 'An error occurred during login. Please try again.';
            if (errorDiv) {
                errorDiv.textContent = errorMsg;
                errorDiv.style.display = 'block';
            } else {
                alert(errorMsg);
            }
            return false;
        }
    };

    realHandleLogin.__ccHandleLoginReady = true;

    if (isProxy) {
        existing.__impl = realHandleLogin;
        existing.__isReady = true;
        window.handleLogin = existing;
    } else {
        window.handleLogin = realHandleLogin;
    }

    if (Array.isArray(queue) && queue.length) {
        const queuedCalls = queue.splice(0, queue.length);
        queuedCalls.forEach(entry => {
            if (!entry) return;
            setTimeout(() => {
                try {
                    realHandleLogin.apply(entry.context || window, entry.args || []);
                } catch (err) {
                    console.error('Queued login attempt failed:', err);
                }
            }, 0);
        });
    }

    console.log('✅ handleLogin function created');
})();
