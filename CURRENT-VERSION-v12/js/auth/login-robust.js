/**
 * Robust Login System - extracted from CareConnect-Pro_v12.1-STABLE.html
 * This module will be enhanced in subsequent steps (PBKDF2, rate limiting, TTL, etc.).
 */
(function () {
  'use strict';
  console.log('🔐 Loading robust login system...');

  const CONFIG = {
    MASTER_USERNAME: 'MasterAdmin',
    MASTER_PASSWORD: 'FFA@dm1n2025!',
    LEGACY_USERNAME: 'Doc121',
    LEGACY_PASSWORD: 'FFA121',
    ACCOUNT_STORAGE_KEY: 'careconnect_user_accounts',
    SESSION_KEY: 'isLoggedIn',
    USERNAME_KEY: 'username',
    FULLNAME_KEY: 'fullName',
    SESSION_EXPIRES_KEY: 'loginExpires',
    SESSION_TTL_MINUTES: 120,
    MAX_RETRIES: 50,
    RETRY_DELAY: 100,
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

  // Use localStorage for persistent sessions that survive page refreshes
  function getSession(key, defaultValue = null) {
    try {
      return localStorage.getItem(key) || defaultValue;
    } catch (e) {
      console.warn(`LocalStorage get failed for ${key}:`, e);
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
      console.warn(`LocalStorage remove failed for ${key}:`, e);
      return false;
    }
  }

  // Additional function to migrate from sessionStorage to localStorage if needed
  function migrateSessionToLocal() {
    try {
      const keys = [CONFIG.SESSION_KEY, CONFIG.USERNAME_KEY, CONFIG.FULLNAME_KEY, 
                    'isMaster', 'manualLogin', CONFIG.SESSION_EXPIRES_KEY];
      let migrated = false;
      
      for (const key of keys) {
        const value = sessionStorage.getItem(key);
        if (value !== null) {
          localStorage.setItem(key, value);
          sessionStorage.removeItem(key);
          migrated = true;
        }
      }
      
      if (migrated) {
        console.log('✅ Migrated session from sessionStorage to localStorage');
      }
    } catch (e) {
      console.warn('Failed to migrate session storage:', e);
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
      console.log('⏰ Session expired - clearing login state');
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
      console.warn('PBKDF2 unavailable, falling back to legacy SHA-256 hash:', error);
      try {
        const hashHex = await legacySha256Hash(password, username);
        return { iterations: 0, saltHex: '', hashHex, fallbackMethod: LEGACY_CONFIG.SHA256_SUFFIX };
      } catch (legacyError) {
        console.error('Legacy SHA-256 hashing failed, using base64 fallback:', legacyError);
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

      if (trimmedUsername === CONFIG.MASTER_USERNAME && password === CONFIG.MASTER_PASSWORD) {
        return {
          valid: true,
          isMaster: true,
          username: CONFIG.MASTER_USERNAME,
          fullName: 'Master Admin',
        };
      }

      if (trimmedUsername === CONFIG.LEGACY_USERNAME && password === CONFIG.LEGACY_PASSWORD) {
        return {
          valid: true,
          isMaster: true,
          username: CONFIG.LEGACY_USERNAME,
          fullName: 'Doc Administrator',
        };
      }

      if (
        trimmedUsername.toLowerCase() === CONFIG.LEGACY_USERNAME.toLowerCase() &&
        password === CONFIG.LEGACY_PASSWORD
      ) {
        return {
          valid: true,
          isMaster: false,
          username: CONFIG.LEGACY_USERNAME,
          fullName: 'Legacy User',
        };
      }

      const accounts = getUserAccounts();
      const userIndex = accounts.findIndex((acc) => acc.username === trimmedUsername);
      if (userIndex === -1) {
        return { valid: false, error: 'Invalid username or password' };
      }

      const user = accounts[userIndex];
      let accountsDirty = false;

      // PBKDF2 verification path
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
            };
          }
        } catch (pbkdf2Error) {
          console.error('PBKDF2 verification failed:', pbkdf2Error);
        }
      }

      // Legacy SHA-256 path
      try {
        const shaHash = await legacySha256Hash(password, trimmedUsername);
        if (timingSafeCompare(user.password || '', shaHash) || timingSafeCompare(user.hash || '', shaHash)) {
          console.log('🔄 Migrating legacy SHA-256 hash to PBKDF2');
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
          };
        }
      } catch (shaError) {
        console.warn('Legacy SHA-256 verification failed:', shaError);
      }

      // Old base64 path
      const legacyHash = legacyBtoaHash(password);
      if (timingSafeCompare(user.password || '', legacyHash)) {
        console.log('🔄 Migrating legacy base64 hash to PBKDF2');
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
        console.warn('Login screen element not found');
        return false;
      }
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      });
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
      console.warn('Login already in progress');
      return false;
    }

    try {
      if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
      }
      if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
      }
      
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

      setLoginButtonState(submitBtn, true, 'Verifying...');
      const result = await verifyCredentials(username, password);

      if (result.valid) {
        setSession(CONFIG.SESSION_KEY, 'true');
        setSession(CONFIG.USERNAME_KEY, result.username);
        setSession(CONFIG.FULLNAME_KEY, result.fullName || result.username);
        setSession('isMaster', result.isMaster ? 'true' : 'false');
        setSession('manualLogin', 'true');
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
            console.log('🔒 Data encryption activated');
          } catch (error) {
            console.warn('Encryption initialization failed:', error);
          }
        }

        hideLoginScreen();

        if (typeof window.showWelcomeAnimation === 'function') {
          try {
            window.showWelcomeAnimation(result.fullName || result.username, false);
          } catch (error) {
            console.warn('Welcome animation failed:', error);
            hideLoginScreen();
          }
        } else {
          hideLoginScreen();
        }

        if (typeof window.updateUserDisplay === 'function') {
          setTimeout(() => {
            try {
              window.updateUserDisplay();
            } catch (error) {
              console.warn('User display update failed:', error);
            }
          }, 500);
        }

        if (typeof window.enableAutoSave === 'function') {
          try {
            window.enableAutoSave();
          } catch (error) {
            console.warn('Auto-save enable failed:', error);
          }
        }

        console.log('✅ Login successful');
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

  async function initializeLoginSystem() {
    try {
      await ensureDOMReady();

      // Migrate any existing sessionStorage to localStorage
      migrateSessionToLocal();

      LoginState.loginScreen = await waitForElement('#loginScreen').catch(() => null);
      LoginState.mainApp = await waitForElement('#mainApp').catch(() => null);
      LoginState.loginForm = await waitForElement('#loginScreen form, form[action*=\"login\"]').catch(() => null);

      const loggedIn = isLoggedIn();

      if (loggedIn) {
        // Refresh the session TTL when user is still logged in
        setSessionExpiry();
        
        hideLoginScreen();
        console.log('✅ User already logged in - session persisted');
        
        // Re-initialize user display and features
        const username = getSession(CONFIG.USERNAME_KEY);
        const fullName = getSession(CONFIG.FULLNAME_KEY);
        
        // Update user display if function exists
        if (typeof window.updateUserDisplay === 'function') {
          try {
            window.updateUserDisplay();
          } catch (error) {
            console.warn('User display update failed:', error);
          }
        }
        
        // Trigger welcome back animation if available
        if (typeof window.showWelcomeAnimation === 'function') {
          try {
            window.showWelcomeAnimation(fullName || username, true);
          } catch (e) {
            console.warn('Welcome animation failed:', e);
          }
        }
        
        // Enable auto-save if available
        if (typeof window.enableAutoSave === 'function') {
          try {
            window.enableAutoSave();
          } catch (error) {
            console.warn('Auto-save enable failed:', error);
          }
        }
      } else {
        showLoginScreen();
        console.log('🔐 Login screen displayed');
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

      window.handleLogin = handleLogin;
      window.isLoggedIn = isLoggedIn;
      LoginState.initialized = true;
      console.log('✅ Login system initialized');
    } catch (error) {
      console.error('❌ Login system initialization failed:', error);
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
      console.warn('Login system not initialized, retrying...');
      initializeLoginSystem();
    }
  });

  setInterval(() => {
    if (LoginState.initialized && !LoginState.isProcessing) {
      const loggedIn = isLoggedIn();
      const loginVisible = LoginState.loginScreen && LoginState.loginScreen.style.display !== 'none';
      if (!loggedIn && !loginVisible) {
        console.warn('⚠️ Login state mismatch detected - fixing...');
        showLoginScreen();
      } else if (loggedIn && loginVisible) {
        console.warn('⚠️ Login state mismatch detected - fixing...');
        hideLoginScreen();
      }
    }
  }, 2000);

  // Add activity tracking to refresh session TTL on user activity
  let lastActivity = Date.now();
  const ACTIVITY_THRESHOLD = 30000; // 30 seconds
  
  function trackActivity() {
    const now = Date.now();
    if (now - lastActivity > ACTIVITY_THRESHOLD) {
      lastActivity = now;
      if (isLoggedIn()) {
        setSessionExpiry(); // Refresh TTL on activity
        console.log('🔄 Session TTL refreshed due to user activity');
      }
    }
  }
  
  // Track various user activities
  document.addEventListener('click', trackActivity);
  document.addEventListener('keypress', trackActivity);
  document.addEventListener('scroll', trackActivity);
  document.addEventListener('mousemove', trackActivity);
  
  // Expose additional functions for external use
  window.refreshLoginSessionTTL = function() {
    if (isLoggedIn()) {
      setSessionExpiry();
      return true;
    }
    return false;
  };
  
  // Add function to save work data
  window.saveWorkData = function(key, data) {
    try {
      const workKey = `work_data_${key}`;
      localStorage.setItem(workKey, JSON.stringify(data));
      console.log(`💾 Work data saved: ${key}`);
      return true;
    } catch (e) {
      console.error('Failed to save work data:', e);
      return false;
    }
  };
  
  // Add function to load work data
  window.loadWorkData = function(key) {
    try {
      const workKey = `work_data_${key}`;
      const data = localStorage.getItem(workKey);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load work data:', e);
      return null;
    }
  };
  
  // Add function to clear work data
  window.clearWorkData = function(key) {
    try {
      const workKey = `work_data_${key}`;
      localStorage.removeItem(workKey);
      console.log(`🗑️ Work data cleared: ${key}`);
      return true;
    } catch (e) {
      console.error('Failed to clear work data:', e);
      return false;
    }
  };

  console.log('🔐 Robust login system loaded with persistent sessions');

  // Global logout function
  window.logout = function() {
    console.log('🚪 Logging out user...');
    
    // Clear all session data
    clearLoginState();
    
    // Clear any work data if DataPersistence is available
    if (window.DataPersistence && window.DataPersistence.clearPage) {
      window.DataPersistence.clearPage();
    }
    
    // Show login screen
    showLoginScreen();
    
    // Clear any cached data
    if (window.clientManager && window.clientManager.clearCache) {
      window.clientManager.clearCache();
    }
    
    // Notify user
    if (window.showAlert && typeof window.showAlert === 'function') {
      window.showAlert('You have been logged out successfully', 'success');
    }
    
    console.log('✅ User logged out');
    
    // Reload page after a short delay to ensure clean state
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  };

  window.CareConnectAuth = {
    addUserAccount,
    getUserAccounts,
    saveUserAccounts,
    verifyCredentials,
    generateSaltHex,
    derivePBKDF2Hash,
    clearLoginState,
    setSessionExpiry,
    getSessionExpiry,
    getRateLimitState,
    constants: {
      PBKDF2_ITERATIONS: PBKDF2_CONFIG.ITERATIONS,
      PBKDF2_METHOD: PBKDF2_CONFIG.METHOD_KEY,
      SESSION_TTL_MINUTES: CONFIG.SESSION_TTL_MINUTES,
      RATE_LIMIT_MAX_ATTEMPTS: CONFIG.RATE_LIMIT.MAX_ATTEMPTS,
      RATE_LIMIT_LOCK_SECONDS: CONFIG.RATE_LIMIT.LOCK_SECONDS,
    },
  };
})();


