/**
 * CareConnect Pro - Analytics Database Schema
 *
 * Initializes IndexedDB object stores for analytics data collection.
 * Designed for offline-first operation with future backend aggregation.
 *
 * @version 1.0.0
 */

const ANALYTICS_DB_NAME = 'CareConnectAnalytics';
const ANALYTICS_DB_VERSION = 1;

const analyticsDB = {
  db: null,
  isInitialized: false,

  /**
   * Initialize the analytics database
   */
  async init() {
    if (this.isInitialized) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ANALYTICS_DB_NAME, ANALYTICS_DB_VERSION);

      request.onerror = () => {
        console.error('[AnalyticsDB] Failed to open database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.isInitialized = true;
        console.log('[AnalyticsDB] Database initialized successfully');

        this.db.onversionchange = () => {
          this.db.close();
          console.warn('[AnalyticsDB] Database version changed, connection closed. Reload to reinitialize.');
        };

        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('[AnalyticsDB] Running schema upgrade...');

        // ═══════════════════════════════════════════════════════════════
        // USERS - Coach/staff profiles
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('users')) {
          const users = db.createObjectStore('users', { keyPath: 'id' });
          users.createIndex('email', 'email', { unique: true });
          users.createIndex('role', 'role', { unique: false });
          users.createIndex('status', 'status', { unique: false });
        }

        // ═══════════════════════════════════════════════════════════════
        // REFERRALS - Program referral tracking
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('referrals')) {
          const referrals = db.createObjectStore('referrals', { keyPath: 'id' });
          referrals.createIndex('clientId', 'clientId', { unique: false });
          referrals.createIndex('programId', 'programId', { unique: false });
          referrals.createIndex('programName', 'programName', { unique: false });
          referrals.createIndex('status', 'status', { unique: false });
          referrals.createIndex('referralDate', 'referralDate', { unique: false });
          referrals.createIndex('createdBy', 'createdBy', { unique: false });
          referrals.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // ═══════════════════════════════════════════════════════════════
        // CLINICAL_DOCUMENTS - ASAMs, discharge packets, etc.
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('clinical_documents')) {
          const docs = db.createObjectStore('clinical_documents', { keyPath: 'id' });
          docs.createIndex('clientId', 'clientId', { unique: false });
          docs.createIndex('documentType', 'documentType', { unique: false });
          docs.createIndex('status', 'status', { unique: false });
          docs.createIndex('dueDate', 'dueDate', { unique: false });
          docs.createIndex('completedDate', 'completedDate', { unique: false });
          docs.createIndex('createdBy', 'createdBy', { unique: false });
        }

        // ═══════════════════════════════════════════════════════════════
        // AUTHORIZATIONS - Insurance authorization tracking
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('authorizations')) {
          const auths = db.createObjectStore('authorizations', { keyPath: 'id' });
          auths.createIndex('clientId', 'clientId', { unique: false });
          auths.createIndex('payerName', 'payerName', { unique: false });
          auths.createIndex('decision', 'decision', { unique: false });
          auths.createIndex('requestDate', 'requestDate', { unique: false });
          auths.createIndex('authEndDate', 'authEndDate', { unique: false });
          auths.createIndex('createdBy', 'createdBy', { unique: false });
        }

        // ═══════════════════════════════════════════════════════════════
        // PROGRAM_RELATIONSHIPS - Business development tracking
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('program_relationships')) {
          const rels = db.createObjectStore('program_relationships', { keyPath: 'id' });
          rels.createIndex('programId', 'programId', { unique: false });
          rels.createIndex('programName', 'programName', { unique: false });
          rels.createIndex('relationshipStatus', 'relationshipStatus', { unique: false });
          rels.createIndex('lastContactDate', 'lastContactDate', { unique: false });
          rels.createIndex('contractStatus', 'contractStatus', { unique: false });
        }

        // ═══════════════════════════════════════════════════════════════
        // TASKS - Workflow task tracking
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('tasks')) {
          const tasks = db.createObjectStore('tasks', { keyPath: 'id' });
          tasks.createIndex('clientId', 'clientId', { unique: false });
          tasks.createIndex('assignedTo', 'assignedTo', { unique: false });
          tasks.createIndex('taskType', 'taskType', { unique: false });
          tasks.createIndex('category', 'category', { unique: false });
          tasks.createIndex('status', 'status', { unique: false });
          tasks.createIndex('dueDate', 'dueDate', { unique: false });
          tasks.createIndex('priority', 'priority', { unique: false });
        }

        // ═══════════════════════════════════════════════════════════════
        // ANALYTICS_EVENTS - Append-only audit/event log
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('analytics_events')) {
          const events = db.createObjectStore('analytics_events', { keyPath: 'id' });
          events.createIndex('eventType', 'eventType', { unique: false });
          events.createIndex('entityType', 'entityType', { unique: false });
          events.createIndex('entityId', 'entityId', { unique: false });
          events.createIndex('clientId', 'clientId', { unique: false });
          events.createIndex('programId', 'programId', { unique: false });
          events.createIndex('userId', 'userId', { unique: false });
          events.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // ═══════════════════════════════════════════════════════════════
        // EXPORT_HISTORY - Track exports for incremental updates
        // ═══════════════════════════════════════════════════════════════
        if (!db.objectStoreNames.contains('export_history')) {
          const exports = db.createObjectStore('export_history', { keyPath: 'id' });
          exports.createIndex('exportDate', 'exportDate', { unique: false });
          exports.createIndex('exportedBy', 'exportedBy', { unique: false });
          exports.createIndex('exportType', 'exportType', { unique: false });
        }

        console.log('[AnalyticsDB] Schema upgrade complete');
      };
    });
  },

  // ═══════════════════════════════════════════════════════════════════════
  // CRUD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════

  async add(storeName, record) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, record) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.put(record);
      request.onsuccess = () => resolve(record);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAll(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllByIndex(storeName, indexName, value) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllByIndexRange(storeName, indexName, lowerBound, upperBound) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index(indexName);
      const range = IDBKeyRange.bound(lowerBound, upperBound);
      const request = index.getAll(range);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, id) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },

  async count(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};

// Expose globally
window.analyticsDB = analyticsDB;


