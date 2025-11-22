/**
 * Programs Loader
 * Loads program data from programs.v2.json and populates the global window.programsData
 */

(function() {
    'use strict';
    
    console.log('📥 Initializing programs loader...');
    
    window.programsData = window.programsData || [];
    
    async function loadPrograms() {
        try {
            // Try to load from localStorage first for speed
            const cached = localStorage.getItem('careconnect_programs');
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        console.log(`📦 Loaded ${parsed.length} programs from localStorage cache`);
                        window.programsData = parsed;
                        notifyProgramsLoaded();
                        // We can still fetch in background to update cache
                    }
                } catch (e) {
                    console.warn('Failed to parse cached programs', e);
                }
            }
            
            // Fetch from JSON file
            console.log('🌐 Fetching programs.v2.json...');
            const response = await fetch('programs.v2.json');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                window.programsData = data;
                console.log(`✅ Successfully loaded ${data.length} programs from file`);
                
                // Update cache
                try {
                    localStorage.setItem('careconnect_programs', JSON.stringify(data));
                } catch (e) {
                    console.warn('Failed to cache programs (likely quota exceeded)', e);
                }
                
                notifyProgramsLoaded();
            } else {
                console.error('❌ programs.v2.json did not return an array');
            }
            
        } catch (error) {
            console.error('❌ Error loading programs:', error);
            
            // Fallback to legacy/embedded data if available or empty array
            if (window.programsData.length === 0) {
                console.warn('⚠️ Using empty programs list fallback');
            }
        }
    }
    
    function notifyProgramsLoaded() {
        // LEGACY ALIASES REMOVED - Only use window.programsData
        
        // Dispatch event
        const event = new CustomEvent('programs-loaded', { detail: { count: window.programsData.length } });
        window.dispatchEvent(event);
        
        // Trigger callbacks if they exist
        if (typeof window.programsLoadedCallback === 'function') {
            window.programsLoadedCallback();
        }
    }
    
    // Start loading
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadPrograms);
    } else {
        loadPrograms();
    }
    
    // Expose loader globally
    window.loadProgramsData = loadPrograms;
    
})();
