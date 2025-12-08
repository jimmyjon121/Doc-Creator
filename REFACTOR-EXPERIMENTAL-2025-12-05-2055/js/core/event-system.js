/**
 * @fileoverview Event System Coordination Layer
 * @module core/event-system
 * @status @canonical
 * 
 * EXTRACTED FROM: CareConnect-Pro.html (lines 831-1193)
 * Extraction Date: December 7, 2025
 * 
 * PURPOSE:
 *   Coordinates events between modules via EventBus.
 *   Enhances clientManager to emit events on CRUD operations.
 *   Sets up dashboard subscriptions to respond to data changes.
 * 
 * DEPENDENCIES:
 *   - window.eventBus (from js/core/EventBus.js)
 *   - window.clientManager (from client-manager.js)
 *   - window.dashboardManager (from dashboard-manager.js)
 *   - window.dashboardWidgets (from dashboard-widgets.js)
 * 
 * EXPORTS TO WINDOW:
 *   - window.cacheManager - Cache invalidation utilities
 *   - window.eventSystemInfo - Debug helpers
 *   - window.addDemoClients - Demo data helper
 * 
 * EVENTS EMITTED:
 *   - client:created, client:updated, client:deleted
 *   - house:created, house:updated, house:deleted
 *   - tracker:updated (for specific tracker field changes)
 * 
 * EVENTS SUBSCRIBED:
 *   - client:updated, tracker:updated, document:generated
 *   - cache:invalidate, cache:invalidateClient, dashboard:refresh
 */
(function() {
    'use strict';
    
    // Use EventBus from external file, or create inline fallback if not loaded
    if (!window.eventBus) {
        console.warn('[EventBus] External file not loaded, creating inline fallback');
        window.eventBus = {
            listeners: new Map(),
            on(eventName, callback, options = {}) {
                if (!this.listeners.has(eventName)) {
                    this.listeners.set(eventName, new Set());
                }
                const listener = { callback, once: options.once || false, priority: options.priority || 0 };
                this.listeners.get(eventName).add(listener);
                return () => { const l = this.listeners.get(eventName); if (l) l.delete(listener); };
            },
            once(eventName, callback) { return this.on(eventName, callback, { once: true }); },
            emit(eventName, data) {
                const listeners = this.listeners.get(eventName);
                if (!listeners || listeners.size === 0) return;
                Array.from(listeners).sort((a, b) => b.priority - a.priority).forEach(l => {
                    try { l.callback(data); if (l.once) listeners.delete(l); }
                    catch (e) { console.error(`Error in event listener for ${eventName}:`, e); }
                });
                if (eventName !== '*') this.emit('*', { eventName, data });
            },
            off(eventName) { this.listeners.delete(eventName); },
            getListeners(eventName) { return this.listeners.get(eventName) || new Set(); }
        };
    }
    
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
            // Show success notification
            window.showNotification('Document generated and tracker updated', 'success');
            
            // Update relevant widgets
            debouncedRefresh();
        });
        
        // Listen for all events in dev mode
        if (window.featureFlags && typeof window.featureFlags.isEnabled === 'function' && window.featureFlags.isEnabled('devMode')) {
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
    
    function ensureDashboardTheme() {
        const dashboardTab = document.getElementById('dashboardTab');
        if (dashboardTab && dashboardTab.classList.contains('active')) {
            document.body.classList.add('dashboard-active');
            document.body.classList.remove('programs-docs-v2-active');
            document.body.style.background = 'white';
            document.body.style.color = '#1a1a1a';
        }
    }
    window.ensureDashboardTheme = ensureDashboardTheme;
    
    // Add global refresh function
    window.refreshDashboard = function(immediate = false) {
        ensureDashboardTheme();
        if (immediate) {
            window.cacheManager.invalidateAll();
            if (typeof initializeDashboard === 'function') {
                initializeDashboard(true);
            }
        } else {
            window.eventBus.emit('dashboard:refresh');
        }
    };

    window.populateDemoClients = async function(count = 50) {
        // In non-demo mode, treat this as a no-op to prevent accidental demo data in production
        if (!window.ccConfig?.demoMode) {
            window.showNotification('Demo data is disabled in this environment.', 'info');
            return;
        }
        
        // Wait for ClientManager to be ready
        let retries = 10;
        while (!window.clientManager && retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries--;
        }
        
        window.pendingDemoClientCount = count;
        
        if (!window.clientManager?.generateDemoClients) {
            window.showNotification('Client manager not ready yet—will retry automatically.', 'warning');
            return;
        }
        
        const confirmed = window.confirm(
            `Populate demo clients?\n\nThis will remove existing demo clients and create ${count} fresh records for testing.`
        );
        if (!confirmed) {
            delete window.pendingDemoClientCount;
            return;
        }
        
        try {
            window.showNotification('🎭 Creating demo clients…', 'info');
            const created = await window.clientManager.generateDemoClients(count);
            window.showNotification(`✅ Added ${created.length} demo clients`, 'success');
            delete window.pendingDemoClientCount;
            
            // Force dashboard refresh
            if (window.dashboardManager) {
                await window.dashboardManager.refreshDashboard();
            }
            
            if (typeof initializeDashboard === 'function') {
                await initializeDashboard(true);
            }
            
            // Also refresh widgets directly
            if (window.dashboardWidgets?.renderAll) {
                await window.dashboardWidgets.renderAll();
            }

            // If the Clients tab is active, refresh the CM Tracker view too
            const clientsTab = document.getElementById('clientsTab');
            if (clientsTab && clientsTab.classList.contains('active')) {
                if (typeof initializeCMTracker === 'function') {
                    await initializeCMTracker();
                } else if (typeof initializeClientTracker === 'function') {
                    initializeClientTracker();
                }
            }
        } catch (error) {
            window.showNotification('Failed to generate demo clients: ' + error.message, 'error');
        }
    };
    
    // Listen for refresh requests
    let globalRefreshTimeout;
    window.eventBus.on('dashboard:refresh', () => {
        clearTimeout(globalRefreshTimeout);
        globalRefreshTimeout = setTimeout(() => {
            window.cacheManager.invalidateAll();
            if (typeof initializeDashboard === 'function') {
                initializeDashboard(true);
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
