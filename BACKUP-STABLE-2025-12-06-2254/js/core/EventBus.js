/**
 * @fileoverview EventBus - Central Pub/Sub Messaging System
 * @module js/core/EventBus
 * @status @canonical
 *
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 1439-1527)
 *   Extraction Date: December 2025
 *
 * PURPOSE:
 *   Provides a decoupled event-driven communication system between modules.
 *   Components can emit and subscribe to events without direct dependencies.
 *
 * KNOWN EVENTS:
 *   - 'client:created'     - Fired when a new client is added
 *   - 'client:updated'     - Fired when client data changes
 *   - 'client:deleted'     - Fired when a client is removed
 *   - 'tracker:updated'    - Fired when tracker fields change
 *   - 'document:generated' - Fired when a document is created
 *   - 'cache:invalidate'   - Fired to clear specific cache
 *   - 'cache:invalidateClient' - Fired to clear client-specific cache
 *   - 'dashboard:refresh'  - Fired to trigger dashboard refresh
 *   - '*' (wildcard)       - Receives all events (useful for debugging)
 *
 * EXPORTS TO WINDOW:
 *   - window.eventBus - The singleton EventBus instance
 *
 * USAGE:
 *   // Subscribe to an event
 *   const unsubscribe = window.eventBus.on('client:updated', (data) => {
 *       console.log('Client updated:', data);
 *   });
 *
 *   // Emit an event
 *   window.eventBus.emit('client:updated', { clientId: '123', changes: {...} });
 *
 *   // Unsubscribe
 *   unsubscribe();
 */

(function() {
    'use strict';

    /**
     * EventBus - Simple pub/sub implementation
     * @namespace
     */
    const EventBus = {
        /** @type {Map<string, Set<{callback: Function, once: boolean, priority: number}>>} */
        listeners: new Map(),

        /**
         * Subscribe to an event
         * @param {string} eventName - Name of the event to listen for
         * @param {Function} callback - Function to call when event fires
         * @param {Object} [options={}] - Subscription options
         * @param {boolean} [options.once=false] - If true, listener is removed after first call
         * @param {number} [options.priority=0] - Higher priority listeners fire first
         * @returns {Function} Unsubscribe function - call to remove this listener
         *
         * @example
         * const unsubscribe = eventBus.on('client:updated', (data) => {
         *     console.log('Client updated:', data.clientId);
         * });
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
         * Subscribe to an event once (auto-unsubscribes after first call)
         * @param {string} eventName - Name of the event to listen for
         * @param {Function} callback - Function to call when event fires
         * @returns {Function} Unsubscribe function
         *
         * @example
         * eventBus.once('app:ready', () => {
         *     console.log('App is now ready!');
         * });
         */
        once(eventName, callback) {
            return this.on(eventName, callback, { once: true });
        },

        /**
         * Emit an event to all subscribers
         * @param {string} eventName - Name of the event to emit
         * @param {*} [data] - Data to pass to all listeners
         *
         * @example
         * eventBus.emit('client:updated', {
         *     clientId: '123',
         *     oldData: {...},
         *     newData: {...},
         *     changes: {...}
         * });
         */
        emit(eventName, data) {
            const listeners = this.listeners.get(eventName);
            if (!listeners || listeners.size === 0) return;

            // Convert to array and sort by priority (higher first)
            const sortedListeners = Array.from(listeners).sort((a, b) => b.priority - a.priority);

            sortedListeners.forEach(listener => {
                try {
                    listener.callback(data);

                    // Remove if one-time listener
                    if (listener.once) {
                        listeners.delete(listener);
                    }
                } catch (error) {
                    console.error(`[EventBus] Error in listener for "${eventName}":`, error);
                }
            });

            // Also emit wildcard event (for debugging/logging)
            if (eventName !== '*') {
                this.emit('*', { eventName, data });
            }
        },

        /**
         * Remove all listeners for an event
         * @param {string} eventName - Name of the event to clear
         *
         * @example
         * eventBus.off('client:updated'); // Remove all client:updated listeners
         */
        off(eventName) {
            this.listeners.delete(eventName);
        },

        /**
         * Get all listeners for an event (for debugging)
         * @param {string} eventName - Name of the event
         * @returns {Set} Set of listener objects
         */
        getListeners(eventName) {
            return this.listeners.get(eventName) || new Set();
        },

        /**
         * Get count of all registered listeners (for debugging)
         * @returns {number} Total listener count across all events
         */
        getListenerCount() {
            let count = 0;
            this.listeners.forEach(set => count += set.size);
            return count;
        }
    };

    // ═══════════════════════════════════════════════════════════
    // WINDOW EXPORT
    // Required for static bundle compatibility.
    // ═══════════════════════════════════════════════════════════
    window.eventBus = EventBus;

    // Freeze to prevent accidental modification
    Object.freeze(window.eventBus.on);
    Object.freeze(window.eventBus.once);
    Object.freeze(window.eventBus.emit);
    Object.freeze(window.eventBus.off);

})();

