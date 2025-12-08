/**
 * @fileoverview ServiceRegistry - Lightweight Dependency Injection Container
 * @module js/core/ServiceRegistry
 * @status @canonical
 *
 * PURPOSE:
 *   Provides a centralized registry for application services, enabling
 *   loose coupling between modules. Services can be registered and
 *   retrieved by name without direct imports.
 *
 * USAGE:
 *   // Register a service
 *   ServiceRegistry.register('clientManager', clientManagerInstance);
 *
 *   // Retrieve a service
 *   const cm = ServiceRegistry.get('clientManager');
 *
 *   // Check if service exists
 *   if (ServiceRegistry.has('analyticsExport')) { ... }
 *
 * EXPORTS TO WINDOW:
 *   - window.ServiceRegistry - The singleton registry
 *
 * REGISTERED SERVICES (as of December 2025):
 *   - clientManager      - Client CRUD operations
 *   - dashboardManager   - Dashboard data aggregation
 *   - housesManager      - House occupancy tracking
 *   - programsManager    - Program data management
 *   - taskService        - Task/checklist management
 *   - (more added at runtime)
 *
 * MIGRATION NOTES:
 *   This is Phase 1.1 of the Master Refactor Plan.
 *   Eventually, direct window.* access should migrate to ServiceRegistry.get().
 *   For now, both patterns coexist for backward compatibility.
 *
 * @see REFACTOR-MASTER-PLAN.md Phase 1.1
 */

(function() {
    'use strict';

    /**
     * ServiceRegistry - Simple dependency injection container
     * @namespace
     */
    const ServiceRegistry = {
        /** @type {Map<string, any>} */
        _services: new Map(),

        /** @type {Map<string, Function[]>} */
        _pendingCallbacks: new Map(),

        /**
         * Register a service instance
         * @param {string} name - Unique service identifier
         * @param {any} instance - Service instance to register
         * @throws {Error} If name is already registered (use replace() for updates)
         *
         * @example
         * ServiceRegistry.register('clientManager', new ClientManager());
         */
        register(name, instance) {
            if (this._services.has(name)) {
                console.warn(`[ServiceRegistry] Service "${name}" already registered. Use replace() to update.`);
                return;
            }

            this._services.set(name, instance);
            
            // Resolve any pending callbacks waiting for this service
            const pending = this._pendingCallbacks.get(name);
            if (pending && pending.length > 0) {
                pending.forEach(callback => {
                    try {
                        callback(instance);
                    } catch (error) {
                        console.error(`[ServiceRegistry] Error in pending callback for "${name}":`, error);
                    }
                });
                this._pendingCallbacks.delete(name);
            }

            // Also expose on window for backward compatibility
            if (!window[name]) {
                window[name] = instance;
            }
        },

        /**
         * Replace an existing service (useful for mocking in tests)
         * @param {string} name - Service identifier
         * @param {any} instance - New service instance
         */
        replace(name, instance) {
            this._services.set(name, instance);
            window[name] = instance;
        },

        /**
         * Get a registered service
         * @param {string} name - Service identifier
         * @returns {any|undefined} Service instance or undefined if not found
         *
         * @example
         * const cm = ServiceRegistry.get('clientManager');
         * if (cm) {
         *     const clients = await cm.getAllClients();
         * }
         */
        get(name) {
            // First check registry
            if (this._services.has(name)) {
                return this._services.get(name);
            }

            // Fallback to window.* for backward compatibility
            if (window[name]) {
                // Auto-register for future lookups
                this._services.set(name, window[name]);
                return window[name];
            }

            return undefined;
        },

        /**
         * Check if a service is registered
         * @param {string} name - Service identifier
         * @returns {boolean} True if service exists
         */
        has(name) {
            return this._services.has(name) || !!window[name];
        },

        /**
         * Wait for a service to be registered
         * @param {string} name - Service identifier
         * @param {Function} callback - Called when service is available
         *
         * @example
         * ServiceRegistry.whenReady('analyticsExport', (analytics) => {
         *     analytics.generateReport();
         * });
         */
        whenReady(name, callback) {
            // If already registered, call immediately
            if (this.has(name)) {
                callback(this.get(name));
                return;
            }

            // Otherwise queue for later
            if (!this._pendingCallbacks.has(name)) {
                this._pendingCallbacks.set(name, []);
            }
            this._pendingCallbacks.get(name).push(callback);
        },

        /**
         * Get all registered service names (for debugging)
         * @returns {string[]} Array of service names
         */
        getServiceNames() {
            return Array.from(this._services.keys());
        },

        /**
         * Get count of registered services (for debugging)
         * @returns {number} Number of registered services
         */
        getServiceCount() {
            return this._services.size;
        },

        /**
         * Remove a service (useful for cleanup in tests)
         * @param {string} name - Service identifier
         */
        unregister(name) {
            this._services.delete(name);
        },

        /**
         * Clear all services (use with caution - mainly for tests)
         */
        clear() {
            this._services.clear();
            this._pendingCallbacks.clear();
        }
    };

    // ═══════════════════════════════════════════════════════════
    // WINDOW EXPORT
    // Required for static bundle compatibility.
    // ═══════════════════════════════════════════════════════════
    window.ServiceRegistry = ServiceRegistry;

    // Auto-register existing managers that are already on window
    // This bridges the old pattern to the new pattern
    const knownManagers = [
        'clientManager',
        'dashboardManager', 
        'housesManager',
        'programsManager',
        'taskService',
        'eventBus'
    ];

    // Defer auto-registration until DOMContentLoaded to ensure managers are loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            knownManagers.forEach(name => {
                if (window[name] && !ServiceRegistry._services.has(name)) {
                    ServiceRegistry._services.set(name, window[name]);
                }
            });
        });
    } else {
        // DOM already loaded
        knownManagers.forEach(name => {
            if (window[name] && !ServiceRegistry._services.has(name)) {
                ServiceRegistry._services.set(name, window[name]);
            }
        });
    }

})();

