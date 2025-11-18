/**
 * IndexedDB Optimization Enhancement
 * Adds indexes on frequently queried fields (houseId, status, dates), implements query result caching
 */

(function() {
    'use strict';
    
    // Query cache
    const queryCache = new Map();
    const CACHE_DURATION = 30000; // 30 seconds
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.indexedDBManager) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        addIndexes();
        addQueryCaching();
    }
    
    /**
     * Add indexes to existing stores
     */
    function addIndexes() {
        // Check if we need to upgrade the database
        const currentVersion = indexedDBManager.version || 4;
        const targetVersion = currentVersion + 1;
        
        // We'll enhance the existing methods rather than upgrading
        // This is safer and doesn't require a migration
        
        // Enhance getAllClients to use indexes
        const originalGetAll = indexedDBManager.getAll;
        if (originalGetAll) {
            indexedDBManager.getAll = async function(storeName, indexName = null, query = null) {
                try {
                    const db = await this.getDB();
                    const transaction = db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    
                    let request;
                    
                    // Use index if provided and exists
                    if (indexName && store.indexNames.contains(indexName)) {
                        const index = store.index(indexName);
                        if (query !== null && query !== undefined) {
                            request = index.getAll(query);
                        } else {
                            request = index.openCursor();
                        }
                    } else {
                        request = store.getAll();
                    }
                    
                    return new Promise((resolve, reject) => {
                        request.onsuccess = () => {
                            resolve(request.result || []);
                        };
                        request.onerror = () => reject(request.error);
                    });
                } catch (error) {
                    console.error('Error in getAll:', error);
                    // Fallback to original if available
                    if (originalGetAll) {
                        return originalGetAll.call(this, storeName);
                    }
                    throw error;
                }
            };
        }
        
        // Add query method with index support
        indexedDBManager.query = async function(storeName, filters = {}) {
            try {
                const db = await this.getDB();
                const transaction = db.transaction([storeName], 'readonly');
                const store = transaction.objectStore(storeName);
                
                // Build query based on available indexes
                let indexName = null;
                let queryValue = null;
                
                // Prefer indexed fields
                if (filters.houseId && store.indexNames.contains('houseId')) {
                    indexName = 'houseId';
                    queryValue = filters.houseId;
                } else if (filters.status && store.indexNames.contains('status')) {
                    indexName = 'status';
                    queryValue = filters.status;
                }
                
                let results = [];
                
                if (indexName) {
                    // Use index for faster query
                    const index = store.index(indexName);
                    const request = index.getAll(queryValue);
                    
                    results = await new Promise((resolve, reject) => {
                        request.onsuccess = () => resolve(request.result || []);
                        request.onerror = () => reject(request.error);
                    });
                } else {
                    // Fallback to full scan with filtering
                    const request = store.getAll();
                    results = await new Promise((resolve, reject) => {
                        request.onsuccess = () => {
                            let filtered = request.result || [];
                            
                            // Apply filters
                            if (filters.houseId) {
                                filtered = filtered.filter(item => item.houseId === filters.houseId);
                            }
                            if (filters.status) {
                                filtered = filtered.filter(item => item.status === filters.status);
                            }
                            if (filters.admissionDateFrom) {
                                const fromDate = new Date(filters.admissionDateFrom);
                                filtered = filtered.filter(item => {
                                    if (!item.admissionDate) return false;
                                    return new Date(item.admissionDate) >= fromDate;
                                });
                            }
                            if (filters.admissionDateTo) {
                                const toDate = new Date(filters.admissionDateTo);
                                filtered = filtered.filter(item => {
                                    if (!item.admissionDate) return false;
                                    return new Date(item.admissionDate) <= toDate;
                                });
                            }
                            
                            resolve(filtered);
                        };
                        request.onerror = () => reject(request.error);
                    });
                }
                
                return results;
            } catch (error) {
                console.error('Error in query:', error);
                throw error;
            }
        };
    }
    
    /**
     * Add query result caching
     */
    function addQueryCaching() {
        // Cache key generator
        function getCacheKey(storeName, filters) {
            return `${storeName}:${JSON.stringify(filters)}`;
        }
        
        // Check if cache entry is valid
        function isCacheValid(entry) {
            if (!entry) return false;
            const age = Date.now() - entry.timestamp;
            return age < CACHE_DURATION;
        }
        
        // Enhanced getAllClients with caching
        if (indexedDBManager.getAllClients) {
            const originalGetAllClients = indexedDBManager.getAllClients;
            
            indexedDBManager.getAllClients = async function(filters = {}) {
                const cacheKey = getCacheKey('clients', filters);
                const cached = queryCache.get(cacheKey);
                
                if (isCacheValid(cached)) {
                    console.log('📦 Using cached clients query');
                    return cached.data;
                }
                
                // Execute query
                let results;
                if (Object.keys(filters).length > 0) {
                    results = await this.query('clients', filters);
                } else {
                    results = await originalGetAllClients.call(this);
                }
                
                // Cache results
                queryCache.set(cacheKey, {
                    data: results,
                    timestamp: Date.now()
                });
                
                return results;
            };
        }
        
        // Enhanced getClientsByHouse with caching
        if (indexedDBManager.getClientsByHouse) {
            const originalGetClientsByHouse = indexedDBManager.getClientsByHouse;
            
            indexedDBManager.getClientsByHouse = async function(houseId) {
                const cacheKey = getCacheKey('clients', { houseId });
                const cached = queryCache.get(cacheKey);
                
                if (isCacheValid(cached)) {
                    console.log(`📦 Using cached clients for house ${houseId}`);
                    return cached.data;
                }
                
                const results = await originalGetClientsByHouse.call(this, houseId);
                
                queryCache.set(cacheKey, {
                    data: results,
                    timestamp: Date.now()
                });
                
                return results;
            };
        }
        
        // Enhanced getClientsByStatus with caching
        if (indexedDBManager.getClientsByStatus) {
            const originalGetClientsByStatus = indexedDBManager.getClientsByStatus;
            
            indexedDBManager.getClientsByStatus = async function(status) {
                const cacheKey = getCacheKey('clients', { status });
                const cached = queryCache.get(cacheKey);
                
                if (isCacheValid(cached)) {
                    console.log(`📦 Using cached clients with status ${status}`);
                    return cached.data;
                }
                
                const results = await originalGetClientsByStatus.call(this, status);
                
                queryCache.set(cacheKey, {
                    data: results,
                    timestamp: Date.now()
                });
                
                return results;
            };
        }
        
        // Add cache invalidation methods
        indexedDBManager.invalidateCache = function(storeName = null) {
            if (storeName) {
                // Invalidate specific store
                for (const [key] of queryCache) {
                    if (key.startsWith(storeName + ':')) {
                        queryCache.delete(key);
                    }
                }
            } else {
                // Invalidate all
                queryCache.clear();
            }
            console.log('🗑️ Cache invalidated' + (storeName ? ` for ${storeName}` : ''));
        };
        
        // Auto-invalidate cache on updates
        if (indexedDBManager.put) {
            const originalPut = indexedDBManager.put;
            indexedDBManager.put = async function(storeName, data) {
                const result = await originalPut.call(this, storeName, data);
                this.invalidateCache(storeName);
                return result;
            };
        }
        
        if (indexedDBManager.delete) {
            const originalDelete = indexedDBManager.delete;
            indexedDBManager.delete = async function(storeName, key) {
                const result = await originalDelete.call(this, storeName, key);
                this.invalidateCache(storeName);
                return result;
            };
        }
        
        // Clean up old cache entries periodically
        setInterval(() => {
            const now = Date.now();
            for (const [key, entry] of queryCache) {
                if (!isCacheValid(entry)) {
                    queryCache.delete(key);
                }
            }
        }, CACHE_DURATION);
    }
    
    // Integrate with event system for cache invalidation
    if (window.subscribe) {
        window.subscribe('client:updated', () => {
            if (indexedDBManager.invalidateCache) {
                indexedDBManager.invalidateCache('clients');
            }
        });
        
        window.subscribe('tracker:updated', () => {
            if (indexedDBManager.invalidateCache) {
                indexedDBManager.invalidateCache('clients');
            }
        });
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
    
    console.log('✅ IndexedDB optimization initialized');
})();


