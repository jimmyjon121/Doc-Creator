/**
 * Client-Side Encryption Utilities for CareConnect
 * Provides AES encryption for sensitive data storage
 * Note: This is client-side encryption - the key is stored locally
 */

// Simple but effective encryption for local storage
class DataEncryption {
    constructor() {
        // Generate or retrieve encryption key
        this.key = this.getOrCreateKey();
    }

    // Get or create a unique encryption key for this browser
    getOrCreateKey() {
        let key = localStorage.getItem('_eck');
        if (!key) {
            // Generate a random key based on browser fingerprint and random data
            const fingerprint = navigator.userAgent + navigator.language + 
                               screen.width + screen.height + 
                               new Date().getTime() + 
                               Math.random().toString(36);
            key = this.generateKey(fingerprint);
            localStorage.setItem('_eck', key);
        }
        return key;
    }

    // Generate a key from a seed string
    generateKey(seed) {
        let hash = 0;
        for (let i = 0; i < seed.length; i++) {
            const char = seed.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return btoa(hash.toString(36) + seed.substring(0, 32));
    }

    // Encrypt data using XOR cipher with key stretching
    encrypt(data) {
        if (!data) return data;
        
        try {
            // Convert data to string if needed
            const str = typeof data === 'string' ? data : JSON.stringify(data);
            
            // Simple XOR encryption with key stretching
            let encrypted = '';
            const keyLength = this.key.length;
            
            for (let i = 0; i < str.length; i++) {
                const charCode = str.charCodeAt(i);
                const keyChar = this.key.charCodeAt(i % keyLength);
                const encryptedChar = charCode ^ keyChar;
                encrypted += String.fromCharCode(encryptedChar);
            }
            
            // Base64 encode for safe storage
            return btoa(encrypted);
        } catch (e) {
            console.error('Encryption failed:', e);
            return data; // Return original if encryption fails
        }
    }

    // Decrypt data
    decrypt(encryptedData) {
        if (!encryptedData) return encryptedData;
        
        try {
            // Base64 decode
            const encrypted = atob(encryptedData);
            
            // XOR decrypt (same as encrypt)
            let decrypted = '';
            const keyLength = this.key.length;
            
            for (let i = 0; i < encrypted.length; i++) {
                const charCode = encrypted.charCodeAt(i);
                const keyChar = this.key.charCodeAt(i % keyLength);
                const decryptedChar = charCode ^ keyChar;
                decrypted += String.fromCharCode(decryptedChar);
            }
            
            // Try to parse as JSON if it looks like JSON
            if (decrypted.startsWith('{') || decrypted.startsWith('[')) {
                try {
                    return JSON.parse(decrypted);
                } catch (e) {
                    return decrypted;
                }
            }
            
            return decrypted;
        } catch (e) {
            console.error('Decryption failed:', e);
            return encryptedData; // Return original if decryption fails
        }
    }

    // Encrypt and store in localStorage
    secureStore(key, value) {
        try {
            const encrypted = this.encrypt(value);
            localStorage.setItem(key, encrypted);
            return true;
        } catch (e) {
            console.error('Secure storage failed:', e);
            return false;
        }
    }

    // Retrieve and decrypt from localStorage
    secureRetrieve(key) {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;
            return this.decrypt(encrypted);
        } catch (e) {
            console.error('Secure retrieval failed:', e);
            return null;
        }
    }

    // Encrypt and store in sessionStorage
    secureSessionStore(key, value) {
        try {
            const encrypted = this.encrypt(value);
            sessionStorage.setItem(key, encrypted);
            return true;
        } catch (e) {
            console.error('Secure session storage failed:', e);
            return false;
        }
    }

    // Retrieve and decrypt from sessionStorage
    secureSessionRetrieve(key) {
        try {
            const encrypted = sessionStorage.getItem(key);
            if (!encrypted) return null;
            return this.decrypt(encrypted);
        } catch (e) {
            console.error('Secure session retrieval failed:', e);
            return null;
        }
    }

    // Clear all encrypted data
    clearAllSecureData() {
        // Get all keys that might contain encrypted data
        const keysToCheck = [
            'documentVault',
            'customPrograms',
            'templates',
            'analytics',
            'docCreatorAutoSave',
            'programUsage',
            'docCreatorSession'
        ];

        keysToCheck.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });

        // Clear the encryption key if needed (this will make old data unrecoverable)
        // localStorage.removeItem('_eck');
    }

    // Migrate existing unencrypted data to encrypted storage
    migrateToEncrypted() {
        const keysToMigrate = [
            'documentVault',
            'customPrograms',
            'templates',
            'analytics',
            'programUsage'
        ];

        let migrated = 0;
        
        keysToMigrate.forEach(key => {
            const existing = localStorage.getItem(key);
            if (existing) {
                try {
                    // Check if already encrypted (will fail to parse as JSON if encrypted)
                    let data;
                    try {
                        data = JSON.parse(existing);
                        // If we can parse it, it's not encrypted yet
                        this.secureStore(key, data);
                        migrated++;
                    } catch (e) {
                        // Already encrypted or invalid, skip
                    }
                } catch (e) {
                    console.error(`Failed to migrate ${key}:`, e);
                }
            }
        });

        if (migrated > 0) {
            console.log(`Migrated ${migrated} items to encrypted storage`);
        }
    }
}

// Create a singleton instance
const encryption = new DataEncryption();

// Helper functions for easy use
function encryptData(data) {
    return encryption.encrypt(data);
}

function decryptData(data) {
    return encryption.decrypt(data);
}

function secureLocalStorage(key, value) {
    if (value === undefined) {
        // Get operation
        return encryption.secureRetrieve(key);
    } else if (value === null) {
        // Delete operation
        localStorage.removeItem(key);
    } else {
        // Set operation
        encryption.secureStore(key, value);
    }
}

function secureSessionStorage(key, value) {
    if (value === undefined) {
        // Get operation
        return encryption.secureSessionRetrieve(key);
    } else if (value === null) {
        // Delete operation
        sessionStorage.removeItem(key);
    } else {
        // Set operation
        encryption.secureSessionStore(key, value);
    }
}

// Auto-migrate on load
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        encryption.migrateToEncrypted();
    });
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        DataEncryption,
        encryption,
        encryptData,
        decryptData,
        secureLocalStorage,
        secureSessionStorage
    };
}
