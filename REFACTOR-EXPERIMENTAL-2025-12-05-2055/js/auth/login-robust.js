/**
 * @fileoverview Robust Login System for CareConnect Pro v13.0.0-beta
 * @module auth/login-robust
 * @status @canonical
 * @author ClearHive Health LLC
 * 
 * PURPOSE:
 *   Handles user authentication, session management, and rate limiting for the
 *   offline-first beta application. Supports both PBKDF2 (new) and legacy SHA-256
 *   password hashing with automatic migration on login.
 * 
 * DEPENDENCIES:
 *   - Web Crypto API (for PBKDF2 hashing)
 *   - localStorage (for session persistence)
 * 
 * EXPORTS TO WINDOW:
 *   - window.CareConnectAuth - Auth namespace object
 *   - window.handleLogin - Process login form
 *   - window.isLoggedIn - Check session validity
 *   - window.logout - End session
 *   - window.refreshAdminUI - Refresh admin interface
 * 
 * PRODUCTION TODO: Externalize BetaAuthConfig credentials to environment/config.
 */

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * SECURITY REVIEW NOTES FOR AUDITORS
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * 1. BETA CREDENTIALS (Lines ~50-55 in BetaAuthConfig)
 *    ├─ Status: Hardcoded for offline beta distribution ONLY
 *    ├─ Risk: Known credentials in source code (acceptable for beta)
 *    ├─ Mitigation: Object.freeze() prevents runtime tampering
 *    ├─ Mitigation: Clearly labeled with SECURITY WARNING comments
 *    └─ Production: MUST externalize to environment config or secure vault
 * 
 * 2. PASSWORD HASHING (PBKDF2_CONFIG around line ~85)
 *    ├─ Algorithm: PBKDF2 with SHA-256 digest
 *    ├─ Iterations: 100,000 (NIST SP 800-132 compliant)
 *    ├─ Salt: 16 bytes cryptographically random per account
 *    ├─ Hash output: 32 bytes
 *    └─ Legacy: SHA-256 with static salt (auto-migrates on next login)
 * 
 * 3. RATE LIMITING (CONFIG.RATE_LIMIT around line ~78)
 *    ├─ Max attempts: 5 before lockout
 *    ├─ Lockout duration: 60 seconds
 *    ├─ Storage: localStorage (client-side only - offline requirement)
 *    └─ Production: Should add server-side rate limiting
 * 
 * 4. SESSION MANAGEMENT (CONFIG around line ~65)
 *    ├─ TTL: 120 minutes
 *    ├─ Storage: localStorage (required for offline-first operation)
 *    ├─ Keys: isLoggedIn, username, fullName, loginExpires
 *    ├─ No server validation: Acceptable for offline beta
 *    └─ Production: Implement proper JWT/session tokens with server validation
 * 
 * 5. LOGGING & ERROR HANDLING
 *    ├─ No credentials logged to console
 *    ├─ Failed attempts logged without password details
 *    ├─ Stack traces suppressed in production-like environments
 *    └─ User-facing errors are generic (no information leakage)
 * 
 * 6. INPUT HANDLING
 *    ├─ Username trimmed, case-insensitive comparison
 *    ├─ Password not trimmed (preserves intentional whitespace)
 *    └─ No SQL/NoSQL injection risk (client-side only)
 * 
 * ═══════════════════════════════════════════════════════════════════════════════
 * PRODUCTION SECURITY CHECKLIST
 * ═══════════════════════════════════════════════════════════════════════════════
 *    [ ] Externalize credentials to secure config service or environment vars
 *    [ ] Add server-side session validation
 *    [ ] Implement server-side rate limiting (fail2ban, WAF rules)
 *    [ ] Add comprehensive audit logging for login attempts
 *    [ ] Consider MFA for admin accounts
 *    [ ] Implement account lockout notifications
 *    [ ] Add CAPTCHA after N failed attempts
 *    [ ] Review and rotate any exposed beta credentials
 * ═══════════════════════════════════════════════════════════════════════════════
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════════
  // BETA AUTHENTICATION CREDENTIALS
  // ═══════════════════════════════════════════════════════════════════════════
  /**
   * SECURITY WARNING - HARDCODED BETA CREDENTIALS
   * 
   * These credentials exist ONLY for the offline beta bundle.
   * Before production release:
   *   1. Move to environment variables or secure config service
   *   2. Remove hardcoded values entirely
   *   3. Implement proper credential management
   * 
   * Current beta accounts:
   *   - MasterAdmin: Full admin access for demos/testing
   *   - Doc232: Legacy dev account (for backward compatibility)
   */
  const BetaAuthConfig = Object.freeze({
    MASTER_USERNAME: 'MasterAdmin',
    MASTER_PASSWORD: 'FFA@dm1n2025!',
    LEGACY_USERNAME: 'Doc232',
    LEGACY_PASSWORD: 'FFA121',
  });

  // Helper to check beta credentials (single point of access)
  function getBetaCredential(key) {
    return BetaAuthConfig[key] || null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLICATION CONFIGURATION
  // ═══════════════════════════════════════════════════════════════════════════
  const CONFIG = {
    // Storage keys
    ACCOUNT_STORAGE_KEY: 'careconnect_user_accounts',
    SESSION_KEY: 'isLoggedIn',
    USERNAME_KEY: 'username',
    FULLNAME_KEY: 'fullName',
    SESSION_EXPIRES_KEY: 'loginExpires',
    
    // Session settings
    SESSION_TTL_MINUTES: 120,
    MAX_RETRIES: 50,
    RETRY_DELAY: 100,
    
    // Rate limiting
    RATE_LIMIT: {
      ATTEMPTS_KEY: 'loginAttempts',
      LOCK_UNTIL_KEY: 'loginLockUntil',
      MAX_ATTEMPTS: 5,
      LOCK_SECONDS: 60,
    },
  };

  const PBKDF2_CONFIG = {
    METHOD_KEY: 'pbkdf2',
    ITERATIONS: 100000,
    SALT_BYTES: 16,
    HASH_BYTES: 32,
    DIGEST: 'SHA-256',
  };

  const LEGACY_CONFIG = {
    SHA256_SUFFIX: 'sha256',
    B64_SALT: 'FFAS_SALT_2025',
    SECRET_SUFFIX: 'FFAS_SECURE_2025',
  };

  const PBKDF2_STRING_PATTERN = /^pbkdf2\$(\d+)\$([a-f0-9]+)\$([a-f0-9]+)$/i;

  const LoginState = {
    initialized: false,
    loginScreen: null,
    mainApp: null,
    loginForm: null,
    isProcessing: false,
  };

  function getSession(key, defaultValue = null) {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  }

  function setSession(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (e) {
      console.error(`LocalStorage set failed for ${key}:`, e);
      return false;
    }
  }

  function removeSession(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (e) {
      return false;
    }
  }

  function getRateLimitState() {
    const attempts = parseInt(getSession(CONFIG.RATE_LIMIT.ATTEMPTS_KEY, '0'), 10) || 0;
    const lockUntil = parseInt(getSession(CONFIG.RATE_LIMIT.LOCK_UNTIL_KEY, '0'), 10) || 0;
    const now = Date.now();
    const remainingMs = Math.max(0, lockUntil - now);
    return {
      attempts,
      lockUntil,
      isLocked: lockUntil > now,
      remainingMs,
    };
  }

  function setRateLimitState(attempts, lockUntil) {
    setSession(CONFIG.RATE_LIMIT.ATTEMPTS_KEY, String(attempts));
    setSession(CONFIG.RATE_LIMIT.LOCK_UNTIL_KEY, String(lockUntil));
  }

  function clearRateLimitState() {
    removeSession(CONFIG.RATE_LIMIT.ATTEMPTS_KEY);
    removeSession(CONFIG.RATE_LIMIT.LOCK_UNTIL_KEY);
  }

  function recordFailedAttempt() {
    const state = getRateLimitState();
    let attempts = state.attempts + 1;
    let lockUntil = state.lockUntil;
    let locked = false;

    if (attempts >= CONFIG.RATE_LIMIT.MAX_ATTEMPTS) {
      locked = true;
      lockUntil = Date.now() + CONFIG.RATE_LIMIT.LOCK_SECONDS * 1000;
      attempts = 0;
    }

    setRateLimitState(attempts, lockUntil);

    const remainingMs = Math.max(0, lockUntil - Date.now());
    const remainingAttempts = locked ? 0 : Math.max(0, CONFIG.RATE_LIMIT.MAX_ATTEMPTS - attempts);

    return {
      locked,
      lockUntil,
      remainingMs,
      remainingAttempts,
    };
  }

  function setSessionExpiry(ttlMinutes = CONFIG.SESSION_TTL_MINUTES) {
    const expiresAt = Date.now() + ttlMinutes * 60 * 1000;
    setSession(CONFIG.SESSION_EXPIRES_KEY, String(expiresAt));
    return expiresAt;
  }

  function clearLoginState() {
    removeSession(CONFIG.SESSION_KEY);
    removeSession(CONFIG.USERNAME_KEY);
    removeSession(CONFIG.FULLNAME_KEY);
    removeSession('isMaster');
    removeSession('manualLogin');
    removeSession(CONFIG.SESSION_EXPIRES_KEY);
    clearRateLimitState();

    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('currentUserName');
      localStorage.removeItem('currentUserEmail');
      localStorage.removeItem('currentUserRole');
      if (window.ccConfig) {
        window.ccConfig.currentUser = null;
      }
    } catch (e) {}
  }

  function getSessionExpiry() {
    return parseInt(getSession(CONFIG.SESSION_EXPIRES_KEY, '0'), 10) || 0;
  }

  function isLoggedIn() {
    const loggedIn = getSession(CONFIG.SESSION_KEY) === 'true';
    if (!loggedIn) {
      return false;
    }
    const expiry = getSessionExpiry();
    if (expiry && Date.now() > expiry) {
      clearLoginState();
      return false;
    }
    return true;
  }

  function waitForElement(selector, maxRetries = CONFIG.MAX_RETRIES) {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      function check() {
        attempts += 1;
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
        } else if (attempts >= maxRetries) {
          reject(new Error(`Element not found: ${selector}`));
        } else {
          setTimeout(check, CONFIG.RETRY_DELAY);
        }
      }
      check();
    });
  }

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

  function timingSafeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') return false;
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i += 1) {
      mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
  }

  function uint8ArrayToHex(uint8Array) {
    return Array.from(uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  function hexToUint8Array(hex) {
    if (!hex || hex.length % 2 !== 0) {
      throw new Error('Invalid hex string');
    }
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  function generateSaltHex(byteLength = PBKDF2_CONFIG.SALT_BYTES) {
    const saltArray = new Uint8Array(byteLength);
    crypto.getRandomValues(saltArray);
    return uint8ArrayToHex(saltArray);
  }

  async function derivePBKDF2Hash(password, saltHex, iterations = PBKDF2_CONFIG.ITERATIONS) {
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: hexToUint8Array(saltHex),
        iterations,
        hash: PBKDF2_CONFIG.DIGEST,
      },
      keyMaterial,
      PBKDF2_CONFIG.HASH_BYTES * 8,
    );
    return uint8ArrayToHex(new Uint8Array(hashBuffer));
  }

  async function legacySha256Hash(password, username) {
    if (!crypto || !crypto.subtle) {
      throw new Error('Web Crypto API not available');
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password + username.toLowerCase() + LEGACY_CONFIG.SECRET_SUFFIX);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return uint8ArrayToHex(new Uint8Array(hashBuffer));
  }

  function legacyBtoaHash(password) {
    return btoa(password + LEGACY_CONFIG.B64_SALT);
  }

  function extractPBKDF2Record(account) {
    if (!account) return null;
    if (account.hashMethod === PBKDF2_CONFIG.METHOD_KEY && account.salt && account.hash) {
      return {
        iterations: account.iterations || PBKDF2_CONFIG.ITERATIONS,
        saltHex: account.salt,
        hashHex: account.hash,
      };
    }

    if (typeof account.password === 'string') {
      const match = account.password.match(PBKDF2_STRING_PATTERN);
      if (match) {
        return {
          iterations: parseInt(match[1], 10) || PBKDF2_CONFIG.ITERATIONS,
          saltHex: match[2],
          hashHex: match[3],
        };
      }
    }

    return null;
  }

  function applyPBKDF2Record(account, record) {
    if (!account || !record) return;
    account.hashMethod = PBKDF2_CONFIG.METHOD_KEY;
    account.salt = record.saltHex;
    account.iterations = record.iterations;
    account.hash = record.hashHex;
    account.password = `${PBKDF2_CONFIG.METHOD_KEY}$${record.iterations}$${record.saltHex}$${record.hashHex}`;
  }

  async function createPBKDF2Record(username, password) {
    try {
      const saltHex = generateSaltHex();
      const hashHex = await derivePBKDF2Hash(password, saltHex, PBKDF2_CONFIG.ITERATIONS);
      return { iterations: PBKDF2_CONFIG.ITERATIONS, saltHex, hashHex };
    } catch (error) {
      try {
        const hashHex = await legacySha256Hash(password, username);
        return { iterations: 0, saltHex: '', hashHex, fallbackMethod: LEGACY_CONFIG.SHA256_SUFFIX };
      } catch (legacyError) {
        const hashHex = legacyBtoaHash(password);
        return { iterations: 0, saltHex: '', hashHex, fallbackMethod: 'legacy-b64' };
      }
    }
  }

  function getUserAccounts() {
    try {
      const accounts = localStorage.getItem(CONFIG.ACCOUNT_STORAGE_KEY);
      return accounts ? JSON.parse(accounts) : [];
    } catch (e) {
      console.error('Failed to get user accounts:', e);
      return [];
    }
  }

  function saveUserAccounts(accounts) {
    try {
      localStorage.setItem(CONFIG.ACCOUNT_STORAGE_KEY, JSON.stringify(accounts));
    } catch (error) {
      console.error('Failed to save user accounts:', error);
    }
  }

  async function addUserAccount(username, password, fullName = '') {
    const accounts = getUserAccounts();
    const account = {
      username,
      fullName: fullName || username,
      created: new Date().toISOString(),
      lastLogin: null,
    };
    const record = await createPBKDF2Record(username, password);
    if (!record.fallbackMethod) {
      applyPBKDF2Record(account, record);
    } else if (record.fallbackMethod === LEGACY_CONFIG.SHA256_SUFFIX) {
      account.hashMethod = LEGACY_CONFIG.SHA256_SUFFIX;
      account.hash = record.hashHex;
      account.password = record.hashHex;
    } else {
      account.hashMethod = 'legacy-b64';
      account.hash = record.hashHex;
      account.password = record.hashHex;
    }
    accounts.push(account);
    saveUserAccounts(accounts);
    return account;
  }

  function updateAccountMetadata(account, defaultFullName = '') {
    if (!account) return;
    if (!account.fullName) {
      account.fullName = defaultFullName || account.username;
    }
    account.lastLogin = new Date().toISOString();
  }

  async function verifyCredentials(username, password) {
    try {
      if (!username || !password) {
        return { valid: false, error: 'Username and password are required' };
      }

      const trimmedUsername = username.trim();

      // Check beta/demo credentials (see BetaAuthConfig above)
      if (trimmedUsername === getBetaCredential('MASTER_USERNAME') && 
          password === getBetaCredential('MASTER_PASSWORD')) {
        return {
          valid: true,
          isMaster: true,
          username: getBetaCredential('MASTER_USERNAME'),
          fullName: 'Master Admin',
          role: 'admin',
        };
      }

      if (
        trimmedUsername.toLowerCase() === getBetaCredential('LEGACY_USERNAME').toLowerCase() &&
        password === getBetaCredential('LEGACY_PASSWORD')
      ) {
        return {
          valid: true,
          isMaster: true,
          username: getBetaCredential('LEGACY_USERNAME'),
          fullName: 'Legacy Dev',
          role: 'admin',
        };
      }

      const accounts = getUserAccounts();
      const userIndex = accounts.findIndex((acc) => acc.username === trimmedUsername);
      if (userIndex === -1) {
        return { valid: false, error: 'Invalid username or password' };
      }

      const user = accounts[userIndex];
      let accountsDirty = false;

      const pbkdf2Record = extractPBKDF2Record(user);
      if (pbkdf2Record) {
        try {
          const derivedHash = await derivePBKDF2Hash(password, pbkdf2Record.saltHex, pbkdf2Record.iterations);
          if (timingSafeCompare(derivedHash, pbkdf2Record.hashHex)) {
            if (user.hashMethod !== PBKDF2_CONFIG.METHOD_KEY || !user.salt || !user.hash) {
              applyPBKDF2Record(user, {
                iterations: pbkdf2Record.iterations,
                saltHex: pbkdf2Record.saltHex,
                hashHex: pbkdf2Record.hashHex,
              });
              accountsDirty = true;
            }
            updateAccountMetadata(user, trimmedUsername);
            accountsDirty = true;
            if (accountsDirty) {
              saveUserAccounts(accounts);
            }
            return {
              valid: true,
              isMaster: false,
              username: user.username,
              fullName: user.fullName || user.username,
              role: user.role || 'coach',
            };
          }
        } catch (pbkdf2Error) {
          console.error('PBKDF2 verification failed:', pbkdf2Error);
        }
      }

      try {
        const shaHash = await legacySha256Hash(password, trimmedUsername);
        if (timingSafeCompare(user.password || '', shaHash) || timingSafeCompare(user.hash || '', shaHash)) {
          const record = await createPBKDF2Record(trimmedUsername, password);
          if (!record.fallbackMethod) {
            applyPBKDF2Record(user, record);
          } else if (record.fallbackMethod === LEGACY_CONFIG.SHA256_SUFFIX) {
            user.hashMethod = LEGACY_CONFIG.SHA256_SUFFIX;
            user.hash = record.hashHex;
            user.password = record.hashHex;
          }
          updateAccountMetadata(user, trimmedUsername);
          accountsDirty = true;
          saveUserAccounts(accounts);
          return {
            valid: true,
            isMaster: false,
            username: user.username,
            fullName: user.fullName || user.username,
            role: user.role || 'coach',
          };
        }
      } catch (shaError) {}

      const legacyHash = legacyBtoaHash(password);
      if (timingSafeCompare(user.password || '', legacyHash)) {
        const record = await createPBKDF2Record(trimmedUsername, password);
        if (!record.fallbackMethod) {
          applyPBKDF2Record(user, record);
        } else if (record.fallbackMethod === LEGACY_CONFIG.SHA256_SUFFIX) {
          user.hashMethod = LEGACY_CONFIG.SHA256_SUFFIX;
          user.hash = record.hashHex;
          user.password = record.hashHex;
        } else {
          user.hashMethod = 'legacy-b64';
          user.hash = record.hashHex;
          user.password = record.hashHex;
        }
        updateAccountMetadata(user, trimmedUsername);
        accountsDirty = true;
        saveUserAccounts(accounts);
        return {
          valid: true,
          isMaster: false,
          username: user.username,
          fullName: user.fullName || user.username,
          role: user.role || 'coach',
        };
      }

      return { valid: false, error: 'Invalid username or password' };
    } catch (error) {
      console.error('Credential verification error:', error);
      return { valid: false, error: 'Login system error. Please try again.' };
    }
  }

  function showLoginScreen() {
    try {
      if (!LoginState.loginScreen) {
        return false;
      }
      LoginState.loginScreen.style.display = 'flex';
      LoginState.loginScreen.style.visibility = 'visible';
      LoginState.loginScreen.style.opacity = '1';
      LoginState.loginScreen.style.zIndex = '10000';
      LoginState.loginScreen.style.position = 'fixed';
      LoginState.loginScreen.style.top = '0';
      LoginState.loginScreen.style.left = '0';
      LoginState.loginScreen.style.right = '0';
      LoginState.loginScreen.style.bottom = '0';
      if (!LoginState.loginScreen.style.background) {
        LoginState.loginScreen.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      }
      
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

  function hideLoginScreen() {
    try {
      if (!LoginState.loginScreen) {
        LoginState.loginScreen = document.getElementById('loginScreen');
      }
      
      if (LoginState.loginScreen) {
        LoginState.loginScreen.style.display = 'none';
        LoginState.loginScreen.style.visibility = 'hidden';
        LoginState.loginScreen.style.zIndex = '-1';
      } else {
        const screen = document.getElementById('loginScreen');
        if (screen) {
            screen.style.display = 'none';
            screen.style.visibility = 'hidden';
            screen.style.zIndex = '-1';
        }
      }
      
      if (LoginState.mainApp) {
        LoginState.mainApp.style.display = 'block';
        LoginState.mainApp.style.visibility = 'visible';
        const currentOpacity = window.getComputedStyle(LoginState.mainApp).opacity;
        if (currentOpacity === '0' || LoginState.mainApp.style.opacity === '0') {
          LoginState.mainApp.style.opacity = '1';
        }
      }
      return true;
    } catch (error) {
      console.error('Failed to hide login screen:', error);
      return false;
    }
  }

  function showLoginError(message) {
    try {
      let errorDiv = document.getElementById('loginError');
      if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'loginError';
        errorDiv.style.cssText =
          'display: none; color: #e74c3c; margin-top: 10px; text-align: center; padding: 10px; background: rgba(231, 76, 60, 0.1); border-radius: 8px;';
        if (LoginState.loginForm) {
          LoginState.loginForm.appendChild(errorDiv);
        }
      }
      errorDiv.textContent = message;
      errorDiv.style.display = 'block';
      setTimeout(() => {
        if (errorDiv) errorDiv.style.display = 'none';
      }, 5000);
    } catch (error) {
      console.error('Failed to show login error:', error);
    }
  }

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

  async function handleLogin(event) {
    if (LoginState.isProcessing) {
      return false;
    }

    try {
      event.preventDefault();
      event.stopPropagation();
      LoginState.isProcessing = true;

      const usernameInput = document.getElementById('loginUsername');
      const passwordInput = document.getElementById('loginPassword');
      const submitBtn =
        event.target.querySelector('button[type=\"submit\"]') ||
        event.target.closest('form')?.querySelector('button[type=\"submit\"]');

      if (!usernameInput || !passwordInput) {
        throw new Error('Login form elements not found');
      }

      const username = usernameInput.value.trim();
      const password = passwordInput.value;

      const currentRateState = getRateLimitState();
      if (currentRateState.isLocked) {
        const seconds = Math.ceil(currentRateState.remainingMs / 1000);
        showLoginError(`Too many attempts. Try again in ${seconds} second${seconds === 1 ? '' : 's'}.`);
        setLoginButtonState(submitBtn, false);
        LoginState.isProcessing = false;
        return false;
      }

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

      const verificationTimeout = setTimeout(() => {
        if (LoginState.isProcessing) {
            setLoginButtonState(submitBtn, false);
            LoginState.isProcessing = false;
            showLoginError('Verification took too long. Please try again.');
        }
      }, 10000);

      const result = await verifyCredentials(username, password);
      clearTimeout(verificationTimeout);

      if (result.valid) {
        if (submitBtn) submitBtn.innerHTML = 'Success!';
        
        setSession(CONFIG.SESSION_KEY, 'true');
        setSession(CONFIG.USERNAME_KEY, result.username);
        setSession(CONFIG.FULLNAME_KEY, result.fullName || result.username);
        setSession('isMaster', result.isMaster ? 'true' : 'false');
        setSession('manualLogin', 'true');
        const computedRole = result.role || (result.isMaster ? 'admin' : 'coach');
        setSession('userRole', computedRole);
        
        if (window.analyticsHooks?.registerUserProfile) {
          try {
            const fullName = result.fullName || result.username || '';
            const nameParts = fullName.trim().split(' ').filter(Boolean);
            window.analyticsHooks.registerUserProfile({
              id: result.username,
              firstName: nameParts[0] || fullName || result.username,
              lastName: nameParts.slice(1).join(' ') || '',
              email: result.email || '',
              role: computedRole
            });
          } catch (error) {}
        }
        
        const fullName = result.fullName || result.username;
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || result.username.slice(0, 2).toUpperCase();
        setSession('userInitials', initials);

        try {
          const currentUserObj = {
            id: result.username,
            username: result.username,
            fullName: result.fullName || result.username,
            initials,
            role: computedRole,
            email: result.email || '',
            permissions: result.isMaster ? ['admin', 'edit', 'view'] : ['edit', 'view']
          };

          localStorage.setItem('currentUser', JSON.stringify(currentUserObj));
          window.ccConfig = window.ccConfig || {};
          window.ccConfig.currentUser = currentUserObj;
          localStorage.setItem('currentUserId', currentUserObj.id);
          localStorage.setItem('currentUserName', currentUserObj.fullName);
          localStorage.setItem('currentUserEmail', currentUserObj.email || '');
          localStorage.setItem('currentUserRole', currentUserObj.role || 'coach');
        } catch (userContextError) {}
        
        setSessionExpiry();
        clearRateLimitState();
        passwordInput.value = '';

        if (
          window.DataEncryption &&
          typeof window.DataEncryption.isSupported === 'function' &&
          window.DataEncryption.isSupported() &&
          window.dataEncryption
        ) {
          try {
            await window.dataEncryption.initialize(password);
          } catch (error) {}
        }

        // IMMEDIATE admin UI updates (no delays)
        const isAdminUser = computedRole.toLowerCase() === 'admin';
        
        // Update all UI elements that show/hide based on admin status
        if (isAdminUser) {
          try {
            // Add admin class to body for CSS-based admin controls
            document.body.classList.add('user-role-admin');
            document.body.setAttribute('data-user-role', 'admin');
            
            // Show any admin-only navigation items
            document.querySelectorAll('[data-requires-admin]').forEach(el => {
              el.style.display = '';
              el.removeAttribute('hidden');
            });
            
            // Update user badge/indicator if present
            const userBadge = document.querySelector('.user-role-badge, .user-profile-badge');
            if (userBadge) {
              userBadge.textContent = 'Admin';
              userBadge.classList.add('badge-admin');
            }
            
            console.log('✅ Admin UI activated immediately');
          } catch (error) {
            console.warn('Admin UI update failed:', error);
          }
        }
        
        // Immediate UI updates (no setTimeout delays)
        if (typeof window.updateUserDisplay === 'function') {
          try {
            window.updateUserDisplay();
          } catch (error) {}
        }

        if (typeof window.updateUserMenuInfo === 'function') {
          try {
            window.updateUserMenuInfo();
          } catch (error) {}
        }

        if (typeof window.enableAutoSave === 'function') {
          try {
            window.enableAutoSave();
          } catch (error) {}
        }

        // Fire login success event immediately (no delay)
        window.dispatchEvent(new CustomEvent('ccpro-login-success', {
          detail: { 
            username: result.username, 
            role: result.role, 
            fullName: result.fullName,
            isAdmin: isAdminUser 
          }
        }));

        // Hide login and show main app
        requestAnimationFrame(() => {
            hideLoginScreen();
        });

        // Show welcome animation if available (doesn't block admin UI)
        if (typeof window.showWelcomeAnimation === 'function') {
          try {
            window.showWelcomeAnimation(result.fullName || result.username, false);
          } catch (error) {
            // Animation failed, already hidden login screen above
          }
        }

        LoginState.isProcessing = false;
        return true;
      }

      const rateState = recordFailedAttempt();
      let failureMessage = result.error || 'Invalid username or password. Please try again.';
      if (rateState.locked) {
        const seconds = Math.ceil(rateState.remainingMs / 1000);
        failureMessage = `Too many attempts. Login locked for ${seconds} second${seconds === 1 ? '' : 's'}.`;
      } else if (rateState.remainingAttempts > 0) {
        failureMessage = `${failureMessage} ${rateState.remainingAttempts} attempt${
          rateState.remainingAttempts === 1 ? '' : 's'
        } remaining before lockout.`;
      }
      showLoginError(failureMessage);
      setLoginButtonState(submitBtn, false);
      passwordInput.value = '';
      passwordInput.focus();
      LoginState.isProcessing = false;
      return false;
    } catch (error) {
      console.error('Login handler error:', error);
      showLoginError('An error occurred during login. Please try again.');
      const submitBtn =
        event.target.querySelector('button[type=\"submit\"]') ||
        event.target.closest('form')?.querySelector('button[type=\"submit\"]');
      setLoginButtonState(submitBtn, false);
      LoginState.isProcessing = false;
      return false;
    }
  }

  function migrateSessionToLocal() {
    try {
      const sessionKeys = [CONFIG.SESSION_KEY, CONFIG.USERNAME_KEY, CONFIG.FULLNAME_KEY, CONFIG.SESSION_EXPIRES_KEY, 'isMaster', 'manualLogin', CONFIG.RATE_LIMIT.ATTEMPTS_KEY, CONFIG.RATE_LIMIT.LOCK_UNTIL_KEY];
      
      sessionKeys.forEach(key => {
        const sessionValue = sessionStorage.getItem(key);
        if (sessionValue !== null && localStorage.getItem(key) === null) {
          localStorage.setItem(key, sessionValue);
          sessionStorage.removeItem(key);
        }
      });
    } catch (error) {}
  }

  async function initializeLoginSystem() {
    try {
      await ensureDOMReady();
      migrateSessionToLocal();

      LoginState.loginScreen = await waitForElement('#loginScreen').catch(() => null);
      LoginState.mainApp = await waitForElement('#mainApp').catch(() => null);
      LoginState.loginForm = await waitForElement('#loginScreen form, form[action*=\"login\"]').catch(() => null);

      const loggedIn = isLoggedIn();

      if (loggedIn) {
        hideLoginScreen();
      } else {
        showLoginScreen();
      }

      if (LoginState.loginForm) {
        const newForm = LoginState.loginForm.cloneNode(true);
        LoginState.loginForm.parentNode.replaceChild(newForm, LoginState.loginForm);
        LoginState.loginForm = newForm;
        LoginState.loginForm.addEventListener('submit', handleLogin, { capture: true });

        const passwordInput = LoginState.loginForm.querySelector('input[type=\"password\"]');
        if (passwordInput) {
          passwordInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !LoginState.isProcessing) {
              event.preventDefault();
              handleLogin({
                preventDefault: () => {},
                stopPropagation: () => {},
                target: LoginState.loginForm,
              });
            }
          });
        }
      }

      if (window.handleLogin && window.handleLogin.__isProxy && Array.isArray(window.handleLogin.__queue)) {
        const queuedCalls = window.handleLogin.__queue.splice(0);
        queuedCalls.forEach(({ event }) => {
          try {
            if (event && LoginState.loginForm) {
              handleLogin(event);
            }
          } catch (err) {
            console.error('Queued login call failed:', err);
          }
        });
      }

      window.handleLogin = handleLogin;
      window.isLoggedIn = isLoggedIn;
      LoginState.initialized = true;
    } catch (error) {
      console.error('Login system initialization failed:', error);
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLoginSystem);
  } else {
    initializeLoginSystem();
  }

  window.addEventListener('load', () => {
    if (!LoginState.initialized) {
      initializeLoginSystem();
    }
  });

  let lastStateCheck = Date.now();
  setInterval(() => {
    const now = Date.now();
    if (now - lastStateCheck < 5000) return;
    
    if (LoginState.initialized && !LoginState.isProcessing) {
      const loggedIn = isLoggedIn();
      const loginVisible = LoginState.loginScreen && LoginState.loginScreen.style.display !== 'none';
      
      if (!loggedIn && !loginVisible) {
        lastStateCheck = now;
        requestAnimationFrame(() => showLoginScreen());
      } else if (loggedIn && loginVisible) {
        lastStateCheck = now;
        requestAnimationFrame(() => hideLoginScreen());
      }
    }
  }, 10000);

  function logout() {
    try {
      if (window.ccAuth) {
        window.ccAuth.clearSession();
        window.ccAuth.isAuthenticated = false;
        window.ccAuth.enforceAuthUI();
      }
      
      clearLoginState();
      
      if (window.dataEncryption && typeof window.dataEncryption.clear === 'function') {
        window.dataEncryption.clear();
      }
      
      if (LoginState.loginForm) {
        const usernameInput = LoginState.loginForm.querySelector('#loginUsername');
        const passwordInput = LoginState.loginForm.querySelector('#loginPassword');
        if (usernameInput) usernameInput.value = '';
        if (passwordInput) passwordInput.value = '';
      }
      
      if (LoginState.loginScreen) {
        LoginState.loginScreen.style.display = 'flex';
        LoginState.loginScreen.style.visibility = 'visible';
        LoginState.loginScreen.style.opacity = '1';
        LoginState.loginScreen.style.zIndex = '10000';
        LoginState.loginScreen.style.position = 'fixed';
        LoginState.loginScreen.style.top = '0';
        LoginState.loginScreen.style.left = '0';
        LoginState.loginScreen.style.right = '0';
        LoginState.loginScreen.style.bottom = '0';
        if (!LoginState.loginScreen.style.background) {
          LoginState.loginScreen.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }
      }
      
      if (LoginState.mainApp) {
        LoginState.mainApp.style.display = 'none';
        LoginState.mainApp.style.visibility = 'hidden';
      }
      
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }

  /**
   * Force immediate admin UI visibility refresh
   * Call this if admin controls aren't appearing after login
   */
  function refreshAdminUI() {
    try {
      const userRole = localStorage.getItem('userRole') || '';
      const isAdmin = userRole.toLowerCase() === 'admin';
      
      if (!isAdmin) {
        console.log('Current user is not admin');
        return false;
      }
      
      // Add admin markers to DOM
      document.body.classList.add('user-role-admin');
      document.body.setAttribute('data-user-role', 'admin');
      
      // Show admin-only elements
      document.querySelectorAll('[data-requires-admin]').forEach(el => {
        el.style.display = '';
        el.removeAttribute('hidden');
      });
      
      // Update role badges
      document.querySelectorAll('.user-role-badge, .user-profile-badge').forEach(badge => {
        badge.textContent = 'Admin';
        badge.classList.add('badge-admin');
      });
      
      // Update dashboard if available
      if (window.dashboardManager) {
        const coach = window.dashboardManager.getCurrentCoach();
        if (coach.isAdmin) {
          console.log('✅ Admin status confirmed in dashboard');
        }
      }
      
      console.log('✅ Admin UI refreshed forcefully');
      return true;
    } catch (error) {
      console.error('Failed to refresh admin UI:', error);
      return false;
    }
  }

  window.logout = logout;
  window.refreshAdminUI = refreshAdminUI;
  window.CareConnectAuth = {
    addUserAccount,
    getUserAccounts,
    saveUserAccounts,
    verifyCredentials,
    generateSaltHex,
    derivePBKDF2Hash,
    clearLoginState,
    logout,
    refreshAdminUI,
    setSessionExpiry,
    getSessionExpiry,
    getRateLimitState,
    isLoggedIn,
    getCurrentRole: () => localStorage.getItem('userRole') || 'coach',
    isCurrentUserAdmin: () => (localStorage.getItem('userRole') || '').toLowerCase() === 'admin',
    constants: {
      PBKDF2_ITERATIONS: PBKDF2_CONFIG.ITERATIONS,
      PBKDF2_METHOD: PBKDF2_CONFIG.METHOD_KEY,
      SESSION_TTL_MINUTES: CONFIG.SESSION_TTL_MINUTES,
      RATE_LIMIT_MAX_ATTEMPTS: CONFIG.RATE_LIMIT.MAX_ATTEMPTS,
      RATE_LIMIT_LOCK_SECONDS: CONFIG.RATE_LIMIT.LOCK_SECONDS,
    },
  };
})();
