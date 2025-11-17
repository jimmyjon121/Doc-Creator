/**
 * CareConnect Pro - Utils Module
 * Centralized utilities for DOM manipulation, storage, and common functions
 */

export const utils = {
    // DOM Utilities
    dom: {
        /**
         * Get element by ID with optional error handling
         * @param {string} id - Element ID
         * @param {boolean} required - Throw error if not found
         * @returns {HTMLElement|null}
         */
        getById(id, required = false) {
            const element = document.getElementById(id);
            if (required && !element) {
                throw new Error(`Required element not found: ${id}`);
            }
            return element;
        },

        /**
         * Query selector with optional parent context
         * @param {string} selector - CSS selector
         * @param {HTMLElement} parent - Parent element (default: document)
         * @returns {HTMLElement|null}
         */
        query(selector, parent = document) {
            return parent.querySelector(selector);
        },

        /**
         * Query selector all with optional parent context
         * @param {string} selector - CSS selector
         * @param {HTMLElement} parent - Parent element (default: document)
         * @returns {NodeList}
         */
        queryAll(selector, parent = document) {
            return parent.querySelectorAll(selector);
        },

        /**
         * Show or hide element(s)
         * @param {string|HTMLElement|NodeList} target - Element(s) to show/hide
         * @param {boolean} show - Show (true) or hide (false)
         */
        setVisible(target, show = true) {
            const elements = typeof target === 'string' 
                ? document.querySelectorAll(target)
                : target instanceof NodeList 
                    ? target 
                    : [target];
                    
            elements.forEach(el => {
                if (el) {
                    el.style.display = show ? '' : 'none';
                }
            });
        },

        /**
         * Add event listener with automatic cleanup
         * @param {HTMLElement|string} target - Element or selector
         * @param {string} event - Event type
         * @param {Function} handler - Event handler
         * @returns {Function} Cleanup function
         */
        on(target, event, handler) {
            const element = typeof target === 'string' 
                ? document.querySelector(target) 
                : target;
                
            if (!element) return () => {};
            
            element.addEventListener(event, handler);
            return () => element.removeEventListener(event, handler);
        },

        /**
         * Create element with properties and children
         * @param {string} tag - HTML tag name
         * @param {Object} props - Element properties
         * @param {...(string|HTMLElement)} children - Child elements or text
         * @returns {HTMLElement}
         */
        create(tag, props = {}, ...children) {
            const element = document.createElement(tag);
            
            Object.entries(props).forEach(([key, value]) => {
                if (key === 'class') {
                    element.className = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.assign(element.style, value);
                } else if (key.startsWith('on') && typeof value === 'function') {
                    element.addEventListener(key.substring(2).toLowerCase(), value);
                } else {
                    element[key] = value;
                }
            });
            
            children.forEach(child => {
                if (typeof child === 'string') {
                    element.appendChild(document.createTextNode(child));
                } else if (child instanceof HTMLElement) {
                    element.appendChild(child);
                }
            });
            
            return element;
        }
    },

    // Storage Utilities
    storage: {
        /**
         * Get item from storage with JSON parsing
         * @param {string} key - Storage key
         * @param {any} defaultValue - Default value if not found
         * @param {Storage} storage - Storage type (localStorage or sessionStorage)
         * @returns {any}
         */
        get(key, defaultValue = null, storage = localStorage) {
            try {
                const item = storage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.error(`Error reading ${key} from storage:`, e);
                return defaultValue;
            }
        },

        /**
         * Set item in storage with JSON stringification
         * @param {string} key - Storage key
         * @param {any} value - Value to store
         * @param {Storage} storage - Storage type (localStorage or sessionStorage)
         */
        set(key, value, storage = localStorage) {
            try {
                storage.setItem(key, JSON.stringify(value));
            } catch (e) {
                console.error(`Error saving ${key} to storage:`, e);
            }
        },

        /**
         * Remove item from storage
         * @param {string} key - Storage key
         * @param {Storage} storage - Storage type (localStorage or sessionStorage)
         */
        remove(key, storage = localStorage) {
            storage.removeItem(key);
        },

        /**
         * Clear all items from storage
         * @param {Storage} storage - Storage type (localStorage or sessionStorage)
         */
        clear(storage = localStorage) {
            storage.clear();
        }
    },

    // Date Utilities
    date: {
        /**
         * Format date to string
         * @param {Date|string|number} date - Date to format
         * @param {string} format - Format string (default: 'MM/DD/YYYY')
         * @returns {string}
         */
        format(date, format = 'MM/DD/YYYY') {
            const d = new Date(date);
            const pad = (n) => String(n).padStart(2, '0');
            
            const replacements = {
                'YYYY': d.getFullYear(),
                'MM': pad(d.getMonth() + 1),
                'DD': pad(d.getDate()),
                'HH': pad(d.getHours()),
                'mm': pad(d.getMinutes()),
                'ss': pad(d.getSeconds())
            };
            
            return Object.entries(replacements).reduce(
                (str, [key, val]) => str.replace(key, val),
                format
            );
        },

        /**
         * Get relative time string
         * @param {Date|string|number} date - Date to compare
         * @returns {string}
         */
        relative(date) {
            const now = new Date();
            const then = new Date(date);
            const seconds = Math.floor((now - then) / 1000);
            
            const intervals = [
                { label: 'year', seconds: 31536000 },
                { label: 'month', seconds: 2592000 },
                { label: 'day', seconds: 86400 },
                { label: 'hour', seconds: 3600 },
                { label: 'minute', seconds: 60 },
                { label: 'second', seconds: 1 }
            ];
            
            for (const interval of intervals) {
                const count = Math.floor(seconds / interval.seconds);
                if (count >= 1) {
                    return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
                }
            }
            
            return 'just now';
        }
    },

    // String Utilities
    string: {
        /**
         * Generate initials from name
         * @param {string} name - Full name
         * @param {number} max - Maximum number of initials
         * @returns {string}
         */
        initials(name, max = 2) {
            if (!name) return '';
            
            const parts = name.trim().split(/\s+/);
            const initials = parts
                .map(part => part[0]?.toUpperCase() || '')
                .filter(Boolean)
                .slice(0, max)
                .join('');
                
            return initials;
        },

        /**
         * Truncate string with ellipsis
         * @param {string} str - String to truncate
         * @param {number} length - Maximum length
         * @returns {string}
         */
        truncate(str, length = 50) {
            if (!str || str.length <= length) return str;
            return str.substring(0, length - 3) + '...';
        },

        /**
         * Escape HTML special characters
         * @param {string} str - String to escape
         * @returns {string}
         */
        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        /**
         * Generate random ID
         * @param {string} prefix - ID prefix
         * @returns {string}
         */
        randomId(prefix = 'id') {
            return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    },

    // Notification Utilities
    notify: {
        /**
         * Show notification message
         * @param {string} message - Message to display
         * @param {string} type - Notification type (success, error, warning, info)
         * @param {number} duration - Duration in milliseconds (0 = permanent)
         */
        show(message, type = 'info', duration = 3000) {
            const notification = utils.dom.create('div', {
                class: `notification notification-${type}`,
                style: {
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: '10000',
                    maxWidth: '400px',
                    animation: 'slideIn 0.3s ease-out'
                }
            }, message);
            
            // Apply type-specific styles
            const styles = {
                success: { background: '#4caf50', color: 'white' },
                error: { background: '#f44336', color: 'white' },
                warning: { background: '#ff9800', color: 'white' },
                info: { background: '#2196f3', color: 'white' }
            };
            
            Object.assign(notification.style, styles[type] || styles.info);
            
            document.body.appendChild(notification);
            
            if (duration > 0) {
                setTimeout(() => {
                    notification.style.animation = 'slideOut 0.3s ease-in';
                    setTimeout(() => notification.remove(), 300);
                }, duration);
            }
            
            return notification;
        }
    },

    // Async Utilities
    async: {
        /**
         * Debounce function calls
         * @param {Function} func - Function to debounce
         * @param {number} wait - Wait time in milliseconds
         * @returns {Function}
         */
        debounce(func, wait = 300) {
            let timeout;
            return function(...args) {
                clearTimeout(timeout);
                timeout = setTimeout(() => func.apply(this, args), wait);
            };
        },

        /**
         * Throttle function calls
         * @param {Function} func - Function to throttle
         * @param {number} limit - Limit time in milliseconds
         * @returns {Function}
         */
        throttle(func, limit = 300) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        /**
         * Wait for condition to be true
         * @param {Function} condition - Condition function
         * @param {number} timeout - Maximum wait time
         * @param {number} interval - Check interval
         * @returns {Promise<boolean>}
         */
        waitFor(condition, timeout = 5000, interval = 100) {
            return new Promise((resolve) => {
                const startTime = Date.now();
                
                const check = () => {
                    if (condition()) {
                        resolve(true);
                    } else if (Date.now() - startTime > timeout) {
                        resolve(false);
                    } else {
                        setTimeout(check, interval);
                    }
                };
                
                check();
            });
        }
    }
};

// Add animation styles if not already present
if (!document.getElementById('utils-animations')) {
    const style = document.createElement('style');
    style.id = 'utils-animations';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// Export for ES6 modules and attach to window for legacy code
export default utils;

// For backward compatibility with non-module scripts
window.CareConnect = window.CareConnect || {};
window.CareConnect.utils = utils;