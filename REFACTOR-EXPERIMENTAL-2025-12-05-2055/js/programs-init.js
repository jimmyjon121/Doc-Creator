/**
 * Programs Initialization
 * Ensures programs are available to the application and triggers UI updates
 */

(function() {
    'use strict';
    
    console.log('🔄 Initializing programs integration...');
    
    // Function to check and initialize
    function checkAndInit() {
        if (window.programsData && window.programsData.length > 0) {
            console.log(`✅ Programs ready: ${window.programsData.length} items`);
            
            // LEGACY ALIASES REMOVED - Only use window.programsData
            
            // Trigger UI updates
            updateUI();
            return true;
        }
        return false;
    }
    
    function updateUI() {
        // Trigger dropdown population
        if (typeof window.populateProgramsDropdown === 'function') {
            try {
                window.populateProgramsDropdown();
                console.log('Populated programs dropdown');
            } catch (e) {
                console.warn('Error populating dropdown:', e);
            }
        }
        
        // Trigger list refresh
        if (typeof window.refreshProgramsList === 'function') {
            try {
                window.refreshProgramsList();
                console.log('Refreshed programs list');
            } catch (e) {
                console.warn('Error refreshing list:', e);
            }
        }
        
        // Update stats if available
        const countEl = document.getElementById('programCount');
        if (countEl) {
            countEl.textContent = window.programsData.length;
        }
    }
    
    // Listen for the custom event from loader
    window.addEventListener('programs-loaded', function() {
        console.log('Received programs-loaded event');
        updateUI();
    });
    
    // Also poll for a short time in case of race conditions
    let attempts = 0;
    const maxAttempts = 20; // 10 seconds
    
    const pollInterval = setInterval(() => {
        if (checkAndInit()) {
            clearInterval(pollInterval);
        } else {
            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(pollInterval);
                console.warn('⚠️ Programs initialization timed out waiting for data');
                
                // Attempt force load if loader exists
                if (window.loadProgramsData) {
                    console.log('Attemping forced reload...');
                    window.loadProgramsData();
                }
            }
        }
    }, 500);
    
})();
