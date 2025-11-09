/**
 * IndexedDB Optimization Enhancement
 * Adds indexes on frequently queried fields, implements query result caching
 */

(function() {
    'use strict';
    
    // Query cache
    window.queryCache = {
        cache: new Map(),
        maxAge: 5 * 60 * 1000, // 5 minutes
        
        /**
         * Get cached query result
         * @param {string} key - Cache key
         * @returns {*} Cached result or null
         */
        get(key) {
            const cached = this.cache.get(key);
            if (!cached) return null;
            
            // Check if expired
            if (Date.now() - cached.timestamp > this.maxAge) {
                this.cache.delete(key);
                return null;
            }
            
            return cached.data;
        },
        
        /**
         * Set cached query result
         * @param {string} key - Cache key
         * @param {*} data - Data to cache
         */
        set(key, data) {
            this.cache.set(key, {
                data: data,
                timestamp: Date.now()
            });
        },
        
        /**
         * Invalidate cache by pattern
         * @param {string} pattern - Pattern to match keys
         */
        invalidate(pattern) {
            for (const key of this.cache.keys()) {
                if (key.includes(pattern)) {
                    this.cache.delete(key);
                }
            }
        },
        
        /**
         * Clear all cache
         */
        clear() {
            this.cache.clear();
        }
    };
    
    // Enhance IndexedDB manager with indexes
    function enhanceIndexedDB() {
        if (!window.indexedDBManager) return;
        
        // Store original methods
        const originalOpenDB = window.indexedDBManager.openDB;
        
        // Override openDB to add indexes
        window.indexedDBManager.openDB = async function(dbName, version) {
            const db = await originalOpenDB.call(this, dbName, version);
            
            // Add indexes if not exists
            await addIndexes(db);
            
            return db;
        };
        
        // Add indexes to database
        async function addIndexes(db) {
            if (!db.objectStoreNames.contains('clients')) return;
            
            const transaction = db.transaction(['clients'], 'readwrite');
            const store = transaction.objectStore('clients');
            
            // Check if indexes exist, create if not
            const indexNames = Array.from(store.indexNames);
            
            // Index on houseId
            if (!indexNames.includes('houseId')) {
                try {
                    store.createIndex('houseId', 'houseId', { unique: false });
                } catch (e) {
                    console.warn('Index houseId may already exist:', e);
                }
            }
            
            // Index on status
            if (!indexNames.includes('status')) {
                try {
                    store.createIndex('status', 'status', { unique: false });
                } catch (e) {
                    console.warn('Index status may already exist:', e);
                }
            }
            
            // Index on admissionDate
            if (!indexNames.includes('admissionDate')) {
                try {
                    store.createIndex('admissionDate', 'admissionDate', { unique: false });
                } catch (e) {
                    console.warn('Index admissionDate may already exist:', e);
                }
            }
            
            // Index on dischargeDate
            if (!indexNames.includes('dischargeDate')) {
                try {
                    store.createIndex('dischargeDate', 'dischargeDate', { unique: false });
                } catch (e) {
                    console.warn('Index dischargeDate may already exist:', e);
                }
            }
            
            // Compound index for common queries (houseId + status)
            if (!indexNames.includes('houseId_status')) {
                try {
                    // Note: IndexedDB doesn't support compound indexes directly
                    // We'll use a keyPath array for compound queries
                } catch (e) {
                    console.warn('Compound index creation:', e);
                }
            }
        }
    }
    
    // Enhance clientManager with cached queries
    function enhanceClientManager() {
        if (!window.clientManager || !window.clientManager.getAllClients) {
            // Wait for clientManager to be ready
            setTimeout(enhanceClientManager, 200);
            return;
        }
        
        // Cache getAllClients
        const originalGetAllClients = window.clientManager.getAllClients;
        window.clientManager.getAllClients = async function() {
            const cacheKey = 'clients:all';
            const cached = window.queryCache.get(cacheKey);
            if (cached) {
                return cached;
            }
            
            const result = await originalGetAllClients.call(this);
            window.queryCache.set(cacheKey, result);
            return result;
        };
        
        // Cache getClient
        const originalGetClient = window.clientManager.getClient;
        window.clientManager.getClient = async function(clientId) {
            const cacheKey = `client:${clientId}`;
            const cached = window.queryCache.get(cacheKey);
            if (cached) {
                return cached;
            }
            
            const result = await originalGetClient.call(this, clientId);
            if (result) {
                window.queryCache.set(cacheKey, result);
            }
            return result;
        };
        
        // Optimized query by houseId
        if (!window.clientManager.getClientsByHouse) {
            window.clientManager.getClientsByHouse = async function(houseId) {
                const cacheKey = `clients:house:${houseId}`;
                const cached = window.queryCache.get(cacheKey);
                if (cached) {
                    return cached;
                }
                
                try {
                    const db = await window.indexedDBManager.openDB('CareConnectDB');
                    const transaction = db.transaction(['clients'], 'readonly');
                    const store = transaction.objectStore('clients');
                    const index = store.index('houseId');
                    
                    const request = index.getAll(houseId);
                    const result = await new Promise((resolve, reject) => {
                        request.onsuccess = () => resolve(request.result || []);
                        request.onerror = () => reject(request.error);
                    });
                    
                    window.queryCache.set(cacheKey, result);
                    return result;
                } catch (error) {
                    console.error('Error querying by house:', error);
                    // Fallback to filter
                    const allClients = await this.getAllClients();
                    return allClients.filter(c => c.houseId === houseId);
                }
            };
        }
        
        // Optimized query by status
        if (!window.clientManager.getClientsByStatus) {
            window.clientManager.getClientsByStatus = async function(status) {
                const cacheKey = `clients:status:${status}`;
                const cached = window.queryCache.get(cacheKey);
                if (cached) {
                    return cached;
                }
                
                try {
                    const db = await window.indexedDBManager.openDB('CareConnectDB');
                    const transaction = db.transaction(['clients'], 'readonly');
                    const store = transaction.objectStore('clients');
                    const index = store.index('status');
                    
                    const request = index.getAll(status);
                    const result = await new Promise((resolve, reject) => {
                        request.onsuccess = () => resolve(request.result || []);
                        request.onerror = () => reject(request.error);
                    });
                    
                    window.queryCache.set(cacheKey, result);
                    return result;
                } catch (error) {
                    console.error('Error querying by status:', error);
                    // Fallback to filter
                    const allClients = await this.getAllClients();
                    return allClients.filter(c => c.status === status);
                }
            };
        }
        
        // Invalidate cache on updates
        const originalUpdateClient = window.clientManager.updateClient;
        window.clientManager.updateClient = async function(clientId, updates) {
            const result = await originalUpdateClient.call(this, clientId, updates);
            
            // Invalidate related cache entries
            window.queryCache.invalidate('clients:');
            window.queryCache.invalidate(`client:${clientId}`);
            
            // If houseId or status changed, invalidate those caches
            if (updates.houseId) {
                window.queryCache.invalidate('clients:house:');
            }
            if (updates.status) {
                window.queryCache.invalidate('clients:status:');
            }
            
            return result;
        };
        
        const originalCreateClient = window.clientManager.createClient;
        window.clientManager.createClient = async function(clientData) {
            const result = await originalCreateClient.call(this, clientData);
            
            // Invalidate cache
            window.queryCache.invalidate('clients:');
            
            return result;
        };
        
        const originalDeleteClient = window.clientManager.deleteClient;
        if (originalDeleteClient) {
            window.clientManager.deleteClient = async function(clientId) {
                const result = await originalDeleteClient.call(this, clientId);
                
                // Invalidate cache
                window.queryCache.invalidate('clients:');
                window.queryCache.invalidate(`client:${clientId}`);
                
                return result;
            };
        }
    }
    
    // Add cache statistics
    window.cacheStats = {
        getStats() {
            return {
                size: window.queryCache.cache.size,
                keys: Array.from(window.queryCache.cache.keys()),
                maxAge: window.queryCache.maxAge
            };
        },
        
        clear() {
            window.queryCache.clear();
            console.log('Cache cleared');
        }
    };
    
    // Initialize
    function initialize() {
        enhanceIndexedDB();
        enhanceClientManager();
        
        // Clear cache on page unload to prevent stale data
        window.addEventListener('beforeunload', () => {
            window.queryCache.clear();
        });
        
        console.log('✅ IndexedDB optimization initialized');
    }
    
    // Wait for dependencies
    if (window.indexedDBManager && window.clientManager) {
        initialize();
    } else {
        const checkInterval = setInterval(() => {
            if (window.indexedDBManager && window.clientManager) {
                clearInterval(checkInterval);
                initialize();
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
})();
