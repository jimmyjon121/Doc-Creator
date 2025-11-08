/**
 * Event System Enhancement
 * Implements a publish-subscribe event system for real-time updates
 */

(function() {
    'use strict';
    
    // Create event bus
    window.eventBus = {
        listeners: new Map(),
        
        /**
         * Subscribe to an event
         * @param {string} eventName - Name of the event
         * @param {Function} callback - Function to call when event fires
         * @param {Object} options - Options for subscription
         * @returns {Function} Unsubscribe function
         */
        on(eventName, callback, options = {}) {
            if (!this.listeners.has(eventName)) {
                this.listeners.set(eventName, new Set());
            }
            
            const listener = {
                callback,
                once: options.once || false,
                priority: options.priority || 0
            };
            
            this.listeners.get(eventName).add(listener);
            
            // Return unsubscribe function
            return () => {
                const listeners = this.listeners.get(eventName);
                if (listeners) {
                    listeners.delete(listener);
                }
            };
        },
        
        /**
         * Subscribe to an event once
         * @param {string} eventName - Name of the event
         * @param {Function} callback - Function to call when event fires
         */
        once(eventName, callback) {
            return this.on(eventName, callback, { once: true });
        },
        
        /**
         * Emit an event
         * @param {string} eventName - Name of the event
         * @param {*} data - Data to pass to listeners
         */
        emit(eventName, data) {
            const listeners = this.listeners.get(eventName);
            if (!listeners || listeners.size === 0) return;
            
            // Convert to array and sort by priority
            const sortedListeners = Array.from(listeners).sort((a, b) => b.priority - a.priority);
            
            sortedListeners.forEach(listener => {
                try {
                    listener.callback(data);
                    
                    // Remove if one-time listener
                    if (listener.once) {
                        listeners.delete(listener);
                    }
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
            
            // Also emit wildcard event
            if (eventName !== '*') {
                this.emit('*', { eventName, data });
            }
        },
        
        /**
         * Remove all listeners for an event
         * @param {string} eventName - Name of the event
         */
        off(eventName) {
            this.listeners.delete(eventName);
        },
        
        /**
         * Get all listeners for an event
         * @param {string} eventName - Name of the event
         * @returns {Set} Set of listeners
         */
        getListeners(eventName) {
            return this.listeners.get(eventName) || new Set();
        }
    };
    
    // Enhance clientManager with events
    function enhanceClientManager() {
        if (!window.clientManager) return;
        
        const originalUpdateClient = window.clientManager.updateClient;
        window.clientManager.updateClient = async function(clientId, updates) {
            const oldClient = await this.getClient(clientId);
            const result = await originalUpdateClient.call(this, clientId, updates);
            const newClient = await this.getClient(clientId);
            
            // Emit update event
            window.eventBus.emit('client:updated', {
                clientId,
                oldData: oldClient,
                newData: newClient,
                changes: updates
            });
            
            // Check for specific tracker updates
            const trackerFields = Object.keys(updates).filter(key => 
                key.includes('Assessment') || 
                key.includes('Doc') || 
                key.includes('Packet') ||
                key.includes('discharge') ||
                key.includes('aftercare')
            );
            
            if (trackerFields.length > 0) {
                window.eventBus.emit('tracker:updated', {
                    clientId,
                    fields: trackerFields,
                    updates
                });
            }
            
            return result;
        };
        
        const originalCreateClient = window.clientManager.createClient;
        window.clientManager.createClient = async function(clientData) {
            const result = await originalCreateClient.call(this, clientData);
            
            // Emit create event
            window.eventBus.emit('client:created', {
                client: result
            });
            
            return result;
        };
        
        const originalDeleteClient = window.clientManager.deleteClient;
        if (originalDeleteClient) {
            window.clientManager.deleteClient = async function(clientId) {
                const client = await this.getClient(clientId);
                const result = await originalDeleteClient.call(this, clientId);
                
                // Emit delete event
                window.eventBus.emit('client:deleted', {
                    clientId,
                    client
                });
                
                return result;
            };
        }
    }
    
    // Subscribe to events for dashboard updates
    function setupDashboardSubscriptions() {
        // Debounce dashboard refresh
        let refreshTimeout;
        const debouncedRefresh = () => {
            clearTimeout(refreshTimeout);
            refreshTimeout = setTimeout(() => {
                if (window.dashboardManager?.refreshDashboard) {
                    window.dashboardManager.refreshDashboard();
                }
            }, 300); // Wait 300ms before refreshing
        };
        
        // Listen for client updates
        window.eventBus.on('client:updated', (data) => {
            console.log('Client updated:', data.clientId);
            
            // Invalidate cache
            if (window.dashboardManager?.cache) {
                delete window.dashboardManager.cache.clients;
                delete window.dashboardManager.cache.priorities;
            }
            
            // Refresh dashboard
            debouncedRefresh();
        });
        
        // Listen for tracker updates
        window.eventBus.on('tracker:updated', (data) => {
            console.log('Tracker updated:', data.clientId, data.fields);
            
            // Update specific widgets if they exist
            if (window.dashboardWidgets?.widgets) {
                const flightPlan = window.dashboardWidgets.widgets.get('flightPlan');
                if (flightPlan?.refresh) {
                    flightPlan.refresh();
                }
                
                const journeyRadar = window.dashboardWidgets.widgets.get('journeyRadar');
                if (journeyRadar?.refresh) {
                    journeyRadar.refresh();
                }
            }
        });
        
        // Listen for document events
        window.eventBus.on('document:generated', (data) => {
            console.log('Document generated:', data.documentType, 'for client:', data.clientId);
            
            // Show success notification
            window.showNotification('Document generated and tracker updated', 'success');
            
            // Update relevant widgets
            debouncedRefresh();
        });
        
        // Listen for all events in dev mode
        if (window.featureFlags?.isEnabled('devMode')) {
            window.eventBus.on('*', (event) => {
                console.log(`[Event] ${event.eventName}:`, event.data);
            });
        }
    }
    
    // Enhance widget refresh capabilities
    function enhanceWidgetRefresh() {
        if (!window.dashboardWidgets?.widgets) return;
        
        // Add refresh method to all widgets
        window.dashboardWidgets.widgets.forEach((widget, name) => {
            if (!widget.refresh) {
                widget.refresh = function() {
                    const container = this.container;
                    if (container) {
                        // Re-render the widget
                        container.innerHTML = this.render();
                        console.log(`Refreshed widget: ${name}`);
                    }
                };
            }
        });
    }
    
    // Setup cache invalidation
    window.cacheManager = {
        invalidate(key) {
            if (window.dashboardManager?.cache) {
                if (key) {
                    delete window.dashboardManager.cache[key];
                    console.log(`Cache invalidated: ${key}`);
                } else {
                    // Clear all cache
                    Object.keys(window.dashboardManager.cache).forEach(k => {
                        delete window.dashboardManager.cache[k];
                    });
                    console.log('All cache cleared');
                }
            }
        },
        
        invalidateClient(clientId) {
            // Invalidate specific client-related caches
            this.invalidate('clients');
            this.invalidate('priorities');
            this.invalidate(`client-${clientId}`);
        },
        
        invalidateAll() {
            this.invalidate();
        }
    };
    
    // Listen for cache invalidation events
    window.eventBus.on('cache:invalidate', (data) => {
        window.cacheManager.invalidate(data.key);
    });
    
    window.eventBus.on('cache:invalidateClient', (data) => {
        window.cacheManager.invalidateClient(data.clientId);
    });
    
    // Add global refresh function
    window.refreshDashboard = function(immediate = false) {
        if (immediate) {
            window.cacheManager.invalidateAll();
            if (window.dashboardManager?.refreshDashboard) {
                window.dashboardManager.refreshDashboard();
            }
        } else {
            // Use debounced version
            window.eventBus.emit('dashboard:refresh');
        }
    };
    
    // Listen for refresh requests
    let globalRefreshTimeout;
    window.eventBus.on('dashboard:refresh', () => {
        clearTimeout(globalRefreshTimeout);
        globalRefreshTimeout = setTimeout(() => {
            window.cacheManager.invalidateAll();
            if (window.dashboardManager?.refreshDashboard) {
                window.dashboardManager.refreshDashboard();
            }
        }, 300);
    });
    
    // Wait for dependencies and initialize
    function initialize() {
        enhanceClientManager();
        setupDashboardSubscriptions();
        enhanceWidgetRefresh();
        
        console.log('✅ Event system initialized');
    }
    
    // Check if dependencies are loaded
    if (window.clientManager && window.dashboardManager) {
        initialize();
    } else {
        // Wait for dependencies
        const checkInterval = setInterval(() => {
            if (window.clientManager && window.dashboardManager) {
                clearInterval(checkInterval);
                initialize();
            }
        }, 100);
        
        // Timeout after 10 seconds
        setTimeout(() => {
            clearInterval(checkInterval);
            console.warn('Event system: Some dependencies not loaded');
            initialize(); // Try anyway
        }, 10000);
    }
    
    // Expose event system info
    window.eventSystemInfo = {
        getEventCount() {
            let count = 0;
            window.eventBus.listeners.forEach(listeners => {
                count += listeners.size;
            });
            return count;
        },
        
        getEvents() {
            return Array.from(window.eventBus.listeners.keys());
        },
        
        debugEvent(eventName) {
            const listeners = window.eventBus.getListeners(eventName);
            console.log(`Event "${eventName}" has ${listeners.size} listeners:`, listeners);
        }
    };
    
})();
