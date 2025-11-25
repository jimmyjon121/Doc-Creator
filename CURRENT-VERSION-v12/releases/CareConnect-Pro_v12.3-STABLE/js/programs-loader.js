/**
 * Programs Loader
 * Loads program data from programs.v2.json and populates the global window.programsData
 */

(function() {
    'use strict';

    console.log('📥 Initializing programs loader...');

    const LOCAL_STORAGE_KEY = 'careconnect_programs';
    const INDEXED_DB_WAIT_MS = 2000;
    const INDEXED_DB_POLL_INTERVAL = 50;

    window.programsData = window.programsData || [];

    let dbManagerPromise = null;

    function waitForIndexedDBManager(timeout = INDEXED_DB_WAIT_MS) {
        if (typeof window.IndexedDBManager === 'function') {
            return Promise.resolve();
        }
        return new Promise(resolve => {
            const start = Date.now();
            const intervalId = window.setInterval(() => {
                const isReady = typeof window.IndexedDBManager === 'function';
                const isTimedOut = Date.now() - start >= timeout;
                if (isReady || isTimedOut) {
                    window.clearInterval(intervalId);
                    resolve();
                }
            }, INDEXED_DB_POLL_INTERVAL);
        });
    }

    async function getDbManager() {
        if (!('indexedDB' in window)) {
            return null;
        }

        if (dbManagerPromise) {
            try {
                return await dbManagerPromise;
            } catch {
                return null;
            }
        }

        dbManagerPromise = (async () => {
            await waitForIndexedDBManager();

            if (window.dbManager && typeof window.dbManager.getAll === 'function') {
                if (!window.dbManager.db && typeof window.dbManager.init === 'function') {
                    try {
                        await window.dbManager.init();
                    } catch (error) {
                        console.warn('Global dbManager init failed for programs cache', error);
                    }
                }
                return window.dbManager;
            }

            if (typeof window.IndexedDBManager !== 'function') {
                return null;
            }

            const manager = new window.IndexedDBManager();
            try {
                await manager.init();
            } catch (error) {
                console.warn('Standalone IndexedDB manager init failed for programs cache', error);
                return null;
            }
            return manager;
        })();

        try {
            return await dbManagerPromise;
        } catch (error) {
            console.warn('Programs cache DB unavailable', error);
            return null;
        }
    }

    function sanitizeProgramRecord(record) {
        if (!record || typeof record !== 'object') {
            return record;
        }
        const clone = { ...record };
        delete clone.lastSynced;
        return clone;
    }

    async function loadProgramsFromIndexedDb() {
        try {
            const manager = await getDbManager();
            if (!manager || typeof manager.getAll !== 'function') {
                return null;
            }
            const storeName = manager.stores?.programs || 'programs';
            const records = await manager.getAll(storeName);
            if (Array.isArray(records) && records.length) {
                console.log(`💾 Loaded ${records.length} programs from IndexedDB cache`);
                return records.map(sanitizeProgramRecord);
            }
        } catch (error) {
            console.warn('Unable to read programs from IndexedDB', error);
        }
        return null;
    }

    async function saveProgramsToIndexedDb(programs) {
        try {
            const manager = await getDbManager();
            if (!manager) {
                return;
            }
            const storeName = manager.stores?.programs || 'programs';

            if (typeof manager.clearStore === 'function') {
                await manager.clearStore(storeName).catch(error => {
                    console.warn('Failed to clear programs store before caching', error);
                });
            }

            if (typeof manager.savePrograms === 'function') {
                await manager.savePrograms(programs);
            } else if (typeof manager.bulkInsert === 'function') {
                const timestamped = programs.map(program => ({
                    ...program,
                    lastSynced: Date.now()
                }));
                await manager.bulkInsert(storeName, timestamped);
            }

            console.log(`💽 IndexedDB cache updated (${programs.length} programs)`);
        } catch (error) {
            console.warn('Failed to cache programs in IndexedDB', error);
        }
    }

    function loadProgramsFromLocalStorage() {
        try {
            const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!cached) {
                return null;
            }
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length) {
                console.log(`📦 Loaded ${parsed.length} programs from localStorage cache`);
                return parsed;
            }
        } catch (error) {
            console.warn('Failed to parse cached programs from localStorage', error);
        }
        return null;
    }

    function saveProgramsToLocalStorage(programs) {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(programs));
        } catch (error) {
            console.warn('Failed to cache programs in localStorage', error);
        }
    }

    function applyProgramsData(programs, sourceLabel) {
        if (!Array.isArray(programs)) {
            return false;
        }
        window.programsData = programs;
        console.log(`📊 Programs ready from ${sourceLabel} (${programs.length})`);
        notifyProgramsLoaded();
        return programs.length > 0;
    }

    async function loadPrograms() {
        let cachePrimed = false;
        try {
            const indexedDbPrograms = await loadProgramsFromIndexedDb();
            if (indexedDbPrograms?.length) {
                cachePrimed = applyProgramsData(indexedDbPrograms, 'IndexedDB cache');
            } else {
                const storedPrograms = loadProgramsFromLocalStorage();
                if (storedPrograms?.length) {
                    cachePrimed = applyProgramsData(storedPrograms, 'localStorage cache');
                }
            }

            console.log('🌐 Fetching programs.v2.json...');
            const response = await fetch('programs.v2.json', { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                applyProgramsData(data, 'programs.v2.json');
                saveProgramsToLocalStorage(data);
                await saveProgramsToIndexedDb(data);
            } else {
                console.error('❌ programs.v2.json did not return an array');
            }
        } catch (error) {
            console.error('❌ Error loading programs:', error);

            if (!cachePrimed && window.programsData.length === 0) {
                console.warn('⚠️ Using empty programs list fallback');
            }
        }
    }

    function notifyProgramsLoaded() {
        const event = new CustomEvent('programs-loaded', { detail: { count: window.programsData.length } });
        window.dispatchEvent(event);

        if (typeof window.programsLoadedCallback === 'function') {
            window.programsLoadedCallback();
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPrograms);
    } else {
        loadPrograms();
    }

    window.loadProgramsData = loadPrograms;

})();
