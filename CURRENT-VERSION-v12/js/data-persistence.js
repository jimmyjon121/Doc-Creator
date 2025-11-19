/**
 * Data Persistence Module - Auto-save and recovery for forms and work data
 * This module ensures that user work is never lost, even on page refresh
 */

(function() {
    'use strict';
    
    console.log('📦 Initializing data persistence module...');
    
    const PERSISTENCE_CONFIG = {
        AUTO_SAVE_INTERVAL: 5000, // 5 seconds
        DEBOUNCE_DELAY: 1000, // 1 second
        STORAGE_PREFIX: 'persist_',
        FORM_FIELDS: ['input', 'textarea', 'select'],
        EXCLUDED_TYPES: ['password', 'file', 'submit', 'button', 'reset'],
        MAX_STORAGE_SIZE: 5 * 1024 * 1024, // 5MB limit
    };
    
    class DataPersistence {
        constructor() {
            this.saveTimers = new Map();
            this.formData = new Map();
            this.initialized = false;
            this.storageAvailable = this.checkStorageAvailability();
        }
        
        /**
         * Check if localStorage is available and has space
         */
        checkStorageAvailability() {
            try {
                const test = 'test';
                localStorage.setItem(test, test);
                localStorage.removeItem(test);
                return true;
            } catch (e) {
                console.warn('LocalStorage not available:', e);
                return false;
            }
        }
        
        /**
         * Initialize the persistence system
         */
        init() {
            if (!this.storageAvailable || this.initialized) return;
            
            this.initialized = true;
            
            // NOTE: Disabled auto-restore on load to prevent restoring broken states
            // The user must manually trigger restore if needed, or specific components can request it
            // this.restoreAllData();
            
            // Set up auto-save listeners
            this.attachListeners();
            
            // Start periodic save
            this.startPeriodicSave();
            
            // Clean up old data
            this.cleanupOldData();
            
            console.log('✅ Data persistence initialized (Auto-restore disabled for safety)');
        }
        
        /**
         * Attach event listeners to form elements
         */
        attachListeners() {
            // Listen for input changes
            document.addEventListener('input', (e) => this.handleInput(e), true);
            document.addEventListener('change', (e) => this.handleChange(e), true);
            
            // Listen for contenteditable changes
            document.addEventListener('input', (e) => {
                if (e.target.contentEditable === 'true') {
                    this.handleContentEditable(e);
                }
            }, true);
            
            // Save before page unload
            window.addEventListener('beforeunload', () => this.saveAllData());
            
            // Listen for custom save events
            document.addEventListener('data:save', (e) => {
                if (e.detail && e.detail.key) {
                    this.saveData(e.detail.key, e.detail.value);
                }
            });
            
            // Listen for custom restore events
            document.addEventListener('data:restore', (e) => {
                if (e.detail && e.detail.key) {
                    const value = this.loadData(e.detail.key);
                    if (e.detail.callback && typeof e.detail.callback === 'function') {
                        e.detail.callback(value);
                    }
                }
            });
        }
        
        /**
         * Handle input events
         */
        handleInput(event) {
            const element = event.target;
            if (!this.shouldPersistElement(element)) return;
            
            this.debounceSave(element);
        }
        
        /**
         * Handle change events
         */
        handleChange(event) {
            const element = event.target;
            if (!this.shouldPersistElement(element)) return;
            
            this.saveElementValue(element);
        }
        
        /**
         * Handle contenteditable changes
         */
        handleContentEditable(event) {
            const element = event.target;
            const key = this.getElementKey(element);
            if (!key) return;
            
            this.debounceSave(element);
        }
        
        /**
         * Check if element should be persisted
         */
        shouldPersistElement(element) {
            // Skip if element has data-no-persist attribute
            if (element.dataset.noPersist === 'true') return false;
            
            // Skip password and file inputs
            if (element.type && PERSISTENCE_CONFIG.EXCLUDED_TYPES.includes(element.type)) {
                return false;
            }
            
            // Skip if in login form
            if (element.closest('#loginScreen, #loginForm, .login-form')) {
                return false;
            }
            
            return true;
        }
        
        /**
         * Get unique key for element
         */
        getElementKey(element) {
            // Use explicit data-persist-key if available
            if (element.dataset.persistKey) {
                return PERSISTENCE_CONFIG.STORAGE_PREFIX + element.dataset.persistKey;
            }
            
            // Use id if available
            if (element.id) {
                return PERSISTENCE_CONFIG.STORAGE_PREFIX + 'field_' + element.id;
            }
            
            // Use name if available
            if (element.name) {
                return PERSISTENCE_CONFIG.STORAGE_PREFIX + 'field_' + element.name;
            }
            
            // Generate key based on element position
            const form = element.closest('form');
            if (form && form.id) {
                const index = Array.from(form.elements).indexOf(element);
                return PERSISTENCE_CONFIG.STORAGE_PREFIX + 'form_' + form.id + '_' + index;
            }
            
            return null;
        }
        
        /**
         * Debounce save to avoid too frequent saves
         */
        debounceSave(element) {
            const key = this.getElementKey(element);
            if (!key) return;
            
            // Clear existing timer
            if (this.saveTimers.has(key)) {
                clearTimeout(this.saveTimers.get(key));
            }
            
            // Set new timer
            const timer = setTimeout(() => {
                this.saveElementValue(element);
                this.saveTimers.delete(key);
            }, PERSISTENCE_CONFIG.DEBOUNCE_DELAY);
            
            this.saveTimers.set(key, timer);
        }
        
        /**
         * Save element value
         */
        saveElementValue(element) {
            const key = this.getElementKey(element);
            if (!key) return;
            
            let value;
            
            if (element.type === 'checkbox') {
                value = element.checked;
            } else if (element.type === 'radio') {
                value = element.checked ? element.value : null;
            } else if (element.contentEditable === 'true') {
                value = element.innerHTML;
            } else {
                value = element.value;
            }
            
            this.saveData(key, value);
            
            // Show save indicator if element has one
            this.showSaveIndicator(element);
        }
        
        /**
         * Save data to localStorage
         */
        saveData(key, value) {
            if (!this.storageAvailable) return;
            
            try {
                const data = {
                    value: value,
                    timestamp: Date.now(),
                    url: window.location.pathname
                };
                
                localStorage.setItem(key, JSON.stringify(data));
                
                // Also save in window.saveWorkData if available
                if (window.saveWorkData && typeof window.saveWorkData === 'function') {
                    window.saveWorkData(key.replace(PERSISTENCE_CONFIG.STORAGE_PREFIX, ''), data);
                }
                
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    console.warn('Storage quota exceeded, clearing old data...');
                    this.cleanupOldData(true);
                } else {
                    console.error('Failed to save data:', e);
                }
            }
        }
        
        /**
         * Load data from localStorage
         */
        loadData(key) {
            if (!this.storageAvailable) return null;
            
            try {
                const stored = localStorage.getItem(key);
                if (!stored) return null;
                
                const data = JSON.parse(stored);
                
                // Check if data is from same page
                if (data.url !== window.location.pathname) {
                    return null;
                }
                
                // Check if data is not too old (24 hours)
                const age = Date.now() - data.timestamp;
                if (age > 24 * 60 * 60 * 1000) {
                    localStorage.removeItem(key);
                    return null;
                }
                
                return data.value;
                
            } catch (e) {
                console.error('Failed to load data:', e);
                return null;
            }
        }
        
        /**
         * Restore all saved data
         */
        restoreAllData() {
            if (!this.storageAvailable) return;
            
            const restoredCount = { forms: 0, fields: 0 };
            
            // Restore form fields
            document.querySelectorAll(PERSISTENCE_CONFIG.FORM_FIELDS.join(', ')).forEach(element => {
                if (!this.shouldPersistElement(element)) return;
                
                const key = this.getElementKey(element);
                if (!key) return;
                
                const value = this.loadData(key);
                if (value === null || value === undefined) return;
                
                try {
                    if (element.type === 'checkbox') {
                        element.checked = value === true || value === 'true';
                    } else if (element.type === 'radio') {
                        element.checked = element.value === value;
                    } else {
                        element.value = value;
                    }
                    
                    restoredCount.fields++;
                    
                    // Trigger change event to update any dependent UI
                    const event = new Event('change', { bubbles: true });
                    element.dispatchEvent(event);
                    
                } catch (e) {
                    console.error('Failed to restore field:', e);
                }
            });
            
            // Restore contenteditable elements
            document.querySelectorAll('[contenteditable="true"]').forEach(element => {
                if (!this.shouldPersistElement(element)) return;
                
                const key = this.getElementKey(element);
                if (!key) return;
                
                const value = this.loadData(key);
                if (value) {
                    element.innerHTML = value;
                    restoredCount.fields++;
                }
            });
            
            // Load work data using window function if available
            if (window.loadWorkData && typeof window.loadWorkData === 'function') {
                const keys = Object.keys(localStorage).filter(k => k.startsWith('work_data_'));
                keys.forEach(key => {
                    const shortKey = key.replace('work_data_', '');
                    const data = window.loadWorkData(shortKey);
                    if (data) {
                        console.log(`📂 Restored work data: ${shortKey}`);
                    }
                });
            }
            
            if (restoredCount.fields > 0) {
                console.log(`📂 Restored ${restoredCount.fields} field values`);
                this.showNotification('Previous work restored', 'success');
            }
        }
        
        /**
         * Save all current form data
         */
        saveAllData() {
            if (!this.storageAvailable) return;
            
            // Save all form fields
            document.querySelectorAll(PERSISTENCE_CONFIG.FORM_FIELDS.join(', ')).forEach(element => {
                if (this.shouldPersistElement(element)) {
                    this.saveElementValue(element);
                }
            });
            
            // Save contenteditable elements
            document.querySelectorAll('[contenteditable="true"]').forEach(element => {
                if (this.shouldPersistElement(element)) {
                    this.saveElementValue(element);
                }
            });
            
            console.log('💾 All form data saved');
        }
        
        /**
         * Start periodic auto-save
         */
        startPeriodicSave() {
            setInterval(() => {
                this.saveAllData();
            }, PERSISTENCE_CONFIG.AUTO_SAVE_INTERVAL);
        }
        
        /**
         * Clean up old persisted data
         */
        cleanupOldData(force = false) {
            if (!this.storageAvailable) return;
            
            const now = Date.now();
            const maxAge = force ? 1 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 1 hour if forced, 24 hours otherwise
            let removedCount = 0;
            
            Object.keys(localStorage).forEach(key => {
                if (!key.startsWith(PERSISTENCE_CONFIG.STORAGE_PREFIX)) return;
                
                try {
                    const stored = localStorage.getItem(key);
                    const data = JSON.parse(stored);
                    
                    if (now - data.timestamp > maxAge) {
                        localStorage.removeItem(key);
                        removedCount++;
                    }
                } catch (e) {
                    // Remove invalid data
                    localStorage.removeItem(key);
                    removedCount++;
                }
            });
            
            if (removedCount > 0) {
                console.log(`🧹 Cleaned up ${removedCount} old persistence entries`);
            }
        }
        
        /**
         * Show save indicator on element
         */
        showSaveIndicator(element) {
            // Check if element has a save indicator
            let indicator = element.parentElement?.querySelector('.save-indicator');
            
            if (!indicator && element.dataset.showSaveIndicator === 'true') {
                // Create indicator
                indicator = document.createElement('span');
                indicator.className = 'save-indicator';
                indicator.style.cssText = `
                    position: absolute;
                    right: 5px;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 12px;
                    color: #10b981;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                `;
                indicator.textContent = '✓ Saved';
                
                // Make parent relative if needed
                const parent = element.parentElement;
                if (parent && getComputedStyle(parent).position === 'static') {
                    parent.style.position = 'relative';
                }
                
                parent?.appendChild(indicator);
            }
            
            if (indicator) {
                // Show indicator
                indicator.style.opacity = '1';
                
                // Hide after delay
                setTimeout(() => {
                    indicator.style.opacity = '0';
                }, 2000);
            }
        }
        
        /**
         * Show notification
         */
        showNotification(message, type = 'info') {
            // Check if there's a notification system
            if (window.showAlert && typeof window.showAlert === 'function') {
                window.showAlert(message, type);
                return;
            }
            
            // Create simple notification
            const notification = document.createElement('div');
            notification.className = `persistence-notification ${type}`;
            notification.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                background: ${type === 'success' ? '#10b981' : '#3b82f6'};
                color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                z-index: 10000;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.3s;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                font-size: 14px;
            `;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            // Animate in
            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateY(0)';
            });
            
            // Remove after delay
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateY(20px)';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        /**
         * Clear all persisted data for current page
         */
        clearPageData() {
            if (!this.storageAvailable) return;
            
            const currentPath = window.location.pathname;
            let clearedCount = 0;
            
            Object.keys(localStorage).forEach(key => {
                if (!key.startsWith(PERSISTENCE_CONFIG.STORAGE_PREFIX)) return;
                
                try {
                    const stored = localStorage.getItem(key);
                    const data = JSON.parse(stored);
                    
                    if (data.url === currentPath) {
                        localStorage.removeItem(key);
                        clearedCount++;
                    }
                } catch (e) {
                    // Skip invalid entries
                }
            });
            
            console.log(`🗑️ Cleared ${clearedCount} persistence entries for current page`);
            this.showNotification('Form data cleared', 'info');
        }
    }
    
    // Initialize persistence system
    const dataPersistence = new DataPersistence();
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => dataPersistence.init());
    } else {
        dataPersistence.init();
    }
    
    // Expose API for external use
    window.DataPersistence = {
        save: (key, value) => dataPersistence.saveData(PERSISTENCE_CONFIG.STORAGE_PREFIX + key, value),
        load: (key) => dataPersistence.loadData(PERSISTENCE_CONFIG.STORAGE_PREFIX + key),
        clearPage: () => dataPersistence.clearPageData(),
        saveAll: () => dataPersistence.saveAllData(),
        instance: dataPersistence
    };
    
    console.log('📦 Data persistence module loaded');
})();
