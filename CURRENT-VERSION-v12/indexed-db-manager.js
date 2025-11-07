/**
 * IndexedDB Manager for CareConnect Pro
 * Handles large dataset storage and offline functionality
 */

class IndexedDBManager {
    constructor() {
        this.dbName = 'CareConnectPro';
        this.version = 4; // Increment version for enhanced CM tracker
        this.db = null;
        this.stores = {
            programs: 'programs',
            geocache: 'geocache',
            profiles: 'profiles',
            filters: 'filters',
            documents: 'documents',
            analytics: 'analytics',
            mapTiles: 'mapTiles',
            clients: 'clients', // Enhanced for CM tracking
            houses: 'houses', // New: residential houses
            clientMilestones: 'clientMilestones', // New: milestone tracking
            clientAssessments: 'clientAssessments', // New: GAD, PHQ, etc.
            clientAftercareOptions: 'clientAftercareOptions', // New: aftercare tracking
            archivedClients: 'archivedClients' // New: historical data for discharged clients
        };
    }
    
    /**
     * Initialize database
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB initialized successfully');
                resolve(this.db);
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                this.createStores(db);
            };
        });
    }
    
    /**
     * Create object stores
     */
    createStores(db) {
        // Programs store
        if (!db.objectStoreNames.contains(this.stores.programs)) {
            const programStore = db.createObjectStore(this.stores.programs, { 
                keyPath: 'id' 
            });
            programStore.createIndex('name', 'name', { unique: false });
            programStore.createIndex('location', 'location', { unique: false });
            programStore.createIndex('type', 'type', { unique: false });
            programStore.createIndex('coordinates', ['coordinates.lat', 'coordinates.lng'], { unique: false });
            programStore.createIndex('dataCompleteness', 'dataCompleteness', { unique: false });
        }
        
        // Geocache store
        if (!db.objectStoreNames.contains(this.stores.geocache)) {
            const geocacheStore = db.createObjectStore(this.stores.geocache, { 
                keyPath: 'query' 
            });
            geocacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Client profiles store
        if (!db.objectStoreNames.contains(this.stores.profiles)) {
            const profileStore = db.createObjectStore(this.stores.profiles, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            profileStore.createIndex('timestamp', 'timestamp', { unique: false });
            profileStore.createIndex('templateName', 'templateName', { unique: false });
        }
        
        // Saved filters store
        if (!db.objectStoreNames.contains(this.stores.filters)) {
            const filterStore = db.createObjectStore(this.stores.filters, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            filterStore.createIndex('name', 'name', { unique: false });
            filterStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Documents store
        if (!db.objectStoreNames.contains(this.stores.documents)) {
            const docStore = db.createObjectStore(this.stores.documents, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            docStore.createIndex('clientName', 'clientName', { unique: false });
            docStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Analytics store
        if (!db.objectStoreNames.contains(this.stores.analytics)) {
            const analyticsStore = db.createObjectStore(this.stores.analytics, { 
                keyPath: 'id', 
                autoIncrement: true 
            });
            analyticsStore.createIndex('type', 'type', { unique: false });
            analyticsStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        // Map tiles store
        if (!db.objectStoreNames.contains(this.stores.mapTiles)) {
            const tilesStore = db.createObjectStore(this.stores.mapTiles, { 
                keyPath: 'url' 
            });
            tilesStore.createIndex('timestamp', 'timestamp', { unique: false });
            tilesStore.createIndex('zoom', 'zoom', { unique: false });
        }
        
        // Clients store for tracking (no PHI)
        if (!db.objectStoreNames.contains(this.stores.clients)) {
            const clientsStore = db.createObjectStore(this.stores.clients, { 
                keyPath: 'id' 
            });
            clientsStore.createIndex('kipuId', 'kipuId', { unique: true });
            clientsStore.createIndex('initials', 'initials', { unique: false });
            clientsStore.createIndex('status', 'status', { unique: false });
            clientsStore.createIndex('houseId', 'houseId', { unique: false });
            clientsStore.createIndex('admissionDate', 'admissionDate', { unique: false });
            clientsStore.createIndex('dischargeDate', 'dischargeDate', { unique: false });
            clientsStore.createIndex('lastModified', 'lastModified', { unique: false });
            clientsStore.createIndex('createdDate', 'createdDate', { unique: false });
        }
        
        // Houses store for residential units
        if (!db.objectStoreNames.contains(this.stores.houses)) {
            const housesStore = db.createObjectStore(this.stores.houses, { 
                keyPath: 'id' 
            });
            housesStore.createIndex('name', 'name', { unique: true });
            housesStore.createIndex('isActive', 'isActive', { unique: false });
            housesStore.createIndex('displayOrder', 'displayOrder', { unique: false });
        }
        
        // Client Milestones store
        if (!db.objectStoreNames.contains(this.stores.clientMilestones)) {
            const milestonesStore = db.createObjectStore(this.stores.clientMilestones, { 
                keyPath: 'id' 
            });
            milestonesStore.createIndex('clientId', 'clientId', { unique: false });
            milestonesStore.createIndex('milestone', 'milestone', { unique: false });
            milestonesStore.createIndex('status', 'status', { unique: false });
            milestonesStore.createIndex('completedAt', 'completedAt', { unique: false });
            // Compound index for client + milestone
            milestonesStore.createIndex('clientId_milestone', ['clientId', 'milestone'], { unique: true });
        }
        
        // Client Assessments store
        if (!db.objectStoreNames.contains(this.stores.clientAssessments)) {
            const assessmentsStore = db.createObjectStore(this.stores.clientAssessments, { 
                keyPath: 'id' 
            });
            assessmentsStore.createIndex('clientId', 'clientId', { unique: false });
            assessmentsStore.createIndex('type', 'type', { unique: false });
            assessmentsStore.createIndex('completedAt', 'completedAt', { unique: false });
            assessmentsStore.createIndex('score', 'score', { unique: false });
        }
        
        // Client Aftercare Options store
        if (!db.objectStoreNames.contains(this.stores.clientAftercareOptions)) {
            const aftercareStore = db.createObjectStore(this.stores.clientAftercareOptions, { 
                keyPath: 'id' 
            });
            aftercareStore.createIndex('clientId', 'clientId', { unique: false });
            aftercareStore.createIndex('ordinal', 'ordinal', { unique: false });
            aftercareStore.createIndex('programId', 'programId', { unique: false });
            aftercareStore.createIndex('status', 'status', { unique: false });
            aftercareStore.createIndex('dateProvidedToFamily', 'dateProvidedToFamily', { unique: false });
            // Compound index for client + ordinal
            aftercareStore.createIndex('clientId_ordinal', ['clientId', 'ordinal'], { unique: true });
        }
        
        // Archived Clients store for discharged clients
        if (!db.objectStoreNames.contains(this.stores.archivedClients)) {
            const archivedStore = db.createObjectStore(this.stores.archivedClients, { 
                keyPath: 'id' 
            });
            archivedStore.createIndex('kipuId', 'kipuId', { unique: true });
            archivedStore.createIndex('initials', 'initials', { unique: false });
            archivedStore.createIndex('houseId', 'houseId', { unique: false });
            archivedStore.createIndex('admissionDate', 'admissionDate', { unique: false });
            archivedStore.createIndex('dischargeDate', 'dischargeDate', { unique: false });
            archivedStore.createIndex('archivedDate', 'archivedDate', { unique: false });
            archivedStore.createIndex('lastModified', 'lastModified', { unique: false });
        }
    }
    
    /**
     * Generic get operation
     */
    async get(storeName, key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Generic put operation
     */
    async put(storeName, data) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Generic delete operation
     */
    async delete(storeName, key) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Get all from store
     */
    async getAll(storeName, query = null, count = null) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = query ? store.getAll(query, count) : store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Query by index
     */
    async queryByIndex(storeName, indexName, query) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(query);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Bulk insert
     */
    async bulkInsert(storeName, items) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            let addedCount = 0;
            
            items.forEach(item => {
                const request = store.put(item);
                request.onsuccess = () => {
                    addedCount++;
                    if (addedCount === items.length) {
                        resolve(addedCount);
                    }
                };
                request.onerror = () => reject(request.error);
            });
        });
    }
    
    /**
     * Clear store
     */
    async clearStore(storeName) {
        if (!this.db) await this.init();
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    /**
     * Get database size
     */
    async getSize() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            return {
                usage: estimate.usage || 0,
                quota: estimate.quota || 0,
                percentage: ((estimate.usage || 0) / (estimate.quota || 1)) * 100
            };
        }
        return null;
    }
    
    // Specific methods for programs
    
    /**
     * Save all programs
     */
    async savePrograms(programs) {
        const programsWithTimestamp = programs.map(p => ({
            ...p,
            lastSynced: Date.now()
        }));
        
        return this.bulkInsert(this.stores.programs, programsWithTimestamp);
    }
    
    /**
     * Get programs within radius
     */
    async getProgramsWithinRadius(center, radius) {
        const allPrograms = await this.getAll(this.stores.programs);
        
        return allPrograms.filter(program => {
            if (!program.coordinates) return false;
            
            const distance = this.calculateDistance(
                center.lat, center.lng,
                program.coordinates.lat, program.coordinates.lng
            );
            
            return distance <= radius;
        });
    }
    
    /**
     * Calculate distance between two points
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    // Geocache methods
    
    /**
     * Get cached geocode result
     */
    async getCachedGeocode(query) {
        const cached = await this.get(this.stores.geocache, query);
        
        // Check if cache is still valid (7 days)
        if (cached && Date.now() - cached.timestamp < 7 * 24 * 60 * 60 * 1000) {
            return cached;
        }
        
        return null;
    }
    
    /**
     * Save geocode result
     */
    async saveGeocode(query, result) {
        return this.put(this.stores.geocache, {
            query,
            result,
            timestamp: Date.now()
        });
    }
    
    // Profile methods
    
    /**
     * Save client profile
     */
    async saveProfile(profile) {
        return this.put(this.stores.profiles, {
            ...profile,
            timestamp: Date.now()
        });
    }
    
    /**
     * Get profile templates
     */
    async getProfileTemplates() {
        const profiles = await this.queryByIndex(
            this.stores.profiles, 
            'templateName',
            IDBKeyRange.lowerBound('')
        );
        
        // Group by template name
        const templates = {};
        profiles.forEach(profile => {
            if (profile.templateName) {
                if (!templates[profile.templateName]) {
                    templates[profile.templateName] = [];
                }
                templates[profile.templateName].push(profile);
            }
        });
        
        return templates;
    }
    
    // Analytics methods
    
    /**
     * Track event
     */
    async trackEvent(type, data) {
        return this.put(this.stores.analytics, {
            type,
            data,
            timestamp: Date.now()
        });
    }
    
    /**
     * Get analytics summary
     */
    async getAnalyticsSummary(startDate = null, endDate = null) {
        let analytics = await this.getAll(this.stores.analytics);
        
        // Filter by date range if provided
        if (startDate || endDate) {
            analytics = analytics.filter(event => {
                if (startDate && event.timestamp < startDate) return false;
                if (endDate && event.timestamp > endDate) return false;
                return true;
            });
        }
        
        // Group by type
        const summary = {};
        analytics.forEach(event => {
            if (!summary[event.type]) {
                summary[event.type] = {
                    count: 0,
                    events: []
                };
            }
            summary[event.type].count++;
            summary[event.type].events.push(event);
        });
        
        return summary;
    }
    
    // Map tile caching
    
    /**
     * Get cached tile
     */
    async getCachedTile(url) {
        return this.get(this.stores.mapTiles, url);
    }
    
    /**
     * Save tile
     */
    async saveTile(url, blob, zoom) {
        return this.put(this.stores.mapTiles, {
            url,
            blob,
            zoom,
            timestamp: Date.now()
        });
    }
    
    /**
     * Clear old tiles
     */
    async clearOldTiles(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        const tiles = await this.getAll(this.stores.mapTiles);
        const now = Date.now();
        
        const toDelete = tiles.filter(tile => now - tile.timestamp > maxAge);
        
        for (const tile of toDelete) {
            await this.delete(this.stores.mapTiles, tile.url);
        }
        
        return toDelete.length;
    }
    
    /**
     * Export database
     */
    async exportDatabase() {
        const data = {};
        
        for (const storeName of Object.values(this.stores)) {
            data[storeName] = await this.getAll(storeName);
        }
        
        return data;
    }
    
    /**
     * Import database
     */
    async importDatabase(data) {
        for (const [storeName, items] of Object.entries(data)) {
            if (this.stores[storeName]) {
                await this.clearStore(storeName);
                if (items && items.length > 0) {
                    await this.bulkInsert(storeName, items);
                }
            }
        }
    }
    
    // CM Tracker specific methods
    
    /**
     * Initialize houses with default values
     */
    async initializeHouses() {
        const defaultHouses = [
            { id: 'house_nest', name: 'NEST', displayOrder: 1, isActive: true, createdAt: Date.now() },
            { id: 'house_cove', name: 'Cove', displayOrder: 2, isActive: true, createdAt: Date.now() },
            { id: 'house_hedge', name: 'Hedge', displayOrder: 3, isActive: true, createdAt: Date.now() },
            { id: 'house_meridian', name: 'Meridian', displayOrder: 4, isActive: true, createdAt: Date.now() },
            { id: 'house_banyan', name: 'Banyan', displayOrder: 5, isActive: true, createdAt: Date.now() },
            { id: 'house_preserve', name: 'Preserve', displayOrder: 6, isActive: true, createdAt: Date.now() }
        ];
        
        for (const house of defaultHouses) {
            try {
                await this.put(this.stores.houses, house);
            } catch (e) {
                // House may already exist
                console.log(`House ${house.name} may already exist`);
            }
        }
    }
    
    /**
     * Get all houses
     */
    async getHouses() {
        const houses = await this.getAll(this.stores.houses);
        return houses.sort((a, b) => a.displayOrder - b.displayOrder);
    }
    
    /**
     * Get clients by house
     */
    async getClientsByHouse(houseId) {
        try {
            return await this.queryByIndex(this.stores.clients, 'houseId', houseId);
        } catch (error) {
            // Fallback if index doesn't exist: query all clients and filter
            if (error.name === 'NotFoundError' || error.message.includes('index')) {
                const allClients = await this.getAll(this.stores.clients);
                return allClients.filter(c => c && c.houseId === houseId);
            }
            throw error;
        }
    }
    
    /**
     * Get client milestones
     */
    async getClientMilestones(clientId) {
        return this.queryByIndex(this.stores.clientMilestones, 'clientId', clientId);
    }
    
    /**
     * Update milestone status
     */
    async updateMilestone(clientId, milestone, status, completedAt = null, notes = null, completedDate = null, completedBy = null, communicationMethod = null) {
        // First try to get existing milestone
        const existing = await this.queryByIndex(
            this.stores.clientMilestones, 
            'clientId_milestone', 
            [clientId, milestone]
        );
        
        const data = {
            id: existing[0]?.id || `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            clientId,
            milestone,
            status,
            completedAt,
            completedDate,
            completedBy,
            notes,
            createdAt: existing[0]?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        
        // Only add communicationMethod if it's for referral_closure
        if (milestone === 'referral_closure' && communicationMethod !== null) {
            data.communicationMethod = communicationMethod;
        }
        
        return this.put(this.stores.clientMilestones, data);
    }
    
    /**
     * Get client assessments
     */
    async getClientAssessments(clientId) {
        return this.queryByIndex(this.stores.clientAssessments, 'clientId', clientId);
    }
    
    /**
     * Add assessment
     */
    async addAssessment(clientId, type, score, completedAt, notes = null) {
        const data = {
            id: `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            clientId,
            type,
            score,
            completedAt,
            notes,
            createdAt: Date.now()
        };
        
        return this.put(this.stores.clientAssessments, data);
    }
    
    /**
     * Get client aftercare options
     */
    async getClientAftercareOptions(clientId) {
        const options = await this.queryByIndex(this.stores.clientAftercareOptions, 'clientId', clientId);
        return options.sort((a, b) => a.ordinal - b.ordinal);
    }
    
    /**
     * Add or update aftercare option
     */
    async updateAftercareOption(clientId, ordinal, optionData) {
        // Check if option already exists
        const existing = await this.queryByIndex(
            this.stores.clientAftercareOptions, 
            'clientId_ordinal', 
            [clientId, ordinal]
        );
        
        const data = {
            id: existing[0]?.id || `aftercare_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            clientId,
            ordinal,
            ...optionData,
            createdAt: existing[0]?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        
        return this.put(this.stores.clientAftercareOptions, data);
    }
    
    /**
     * Get discharged clients
     */
    async getDischargedClients() {
        return this.queryByIndex(this.stores.clients, 'status', 'discharged');
    }
    
    /**
     * Calculate days in care
     */
    calculateDaysInCare(admissionDate, dischargeDate = null) {
        if (!admissionDate) return 0;
        
        const admission = new Date(admissionDate);
        const end = dischargeDate ? new Date(dischargeDate) : new Date();
        const diffTime = Math.abs(end - admission);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.IndexedDBManager = IndexedDBManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IndexedDBManager;
}
