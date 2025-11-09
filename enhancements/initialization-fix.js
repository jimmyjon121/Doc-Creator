/**
 * Initialization Fix Enhancement
 * Ensures all managers are properly initialized before enhancements try to use them
 */

(function() {
    'use strict';
    
    // Wait for all critical managers to be initialized
    window.waitForManagers = async function(timeout = 10000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            const clientManagerReady = window.clientManager && 
                (window.clientManager.initialized || typeof window.clientManager.getAllClients === 'function');
            
            const dashboardManagerReady = window.dashboardManager && 
                (window.dashboardManager.initialized || typeof window.dashboardManager.refreshDashboard === 'function');
            
            const trackerEngineReady = window.trackerEngine || true; // Optional
            
            if (clientManagerReady && dashboardManagerReady && trackerEngineReady) {
                console.log('✅ All managers ready');
                return true;
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.warn('⚠️ Some managers not ready after timeout');
        return false;
    };
    
    // Ensure clientManager is initialized
    async function ensureClientManager() {
        if (window.clientManager && !window.clientManager.initialized) {
            try {
                if (typeof window.clientManager.initialize === 'function') {
                    await window.clientManager.initialize();
                }
            } catch (error) {
                console.error('Error initializing clientManager:', error);
            }
        }
    }
    
    // Ensure dashboardManager is initialized
    async function ensureDashboardManager() {
        if (window.dashboardManager && !window.dashboardManager.initialized) {
            try {
                if (typeof window.dashboardManager.initialize === 'function') {
                    await window.dashboardManager.initialize();
                }
            } catch (error) {
                console.error('Error initializing dashboardManager:', error);
            }
        }
    }
    
    // Initialize managers on DOM ready
    async function initializeManagers() {
        console.log('🔧 Ensuring managers are initialized...');
        
        await ensureClientManager();
        await ensureDashboardManager();
        
        // Wait a bit for any async initialization
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verify they're ready
        await window.waitForManagers();
        
        // Fire ready event
        window.dispatchEvent(new CustomEvent('managers:ready'));
        
        console.log('✅ Manager initialization complete');
    }
    
    // Run initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeManagers);
    } else {
        initializeManagers();
    }
    
    // Also try to initialize when managers become available
    const checkInterval = setInterval(() => {
        if (window.clientManager || window.dashboardManager) {
            clearInterval(checkInterval);
            initializeManagers();
        }
    }, 200);
    
    // Clear interval after 10 seconds
    setTimeout(() => clearInterval(checkInterval), 10000);
})();
