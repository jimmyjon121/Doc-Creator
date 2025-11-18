// Fix for programs not being globally accessible

console.log('🔧 Programs accessibility fix loading...');

// Wait for DOM to be ready then fix programs scope
document.addEventListener('DOMContentLoaded', function() {
    // Try to find programs in various scopes
    setTimeout(() => {
        // Check if programs exist
        if (typeof window.programs === 'undefined') {
            console.warn('⚠️ Programs not found in window scope');
            
            // Look for programs in function scopes
            const scripts = document.getElementsByTagName('script');
            for (let script of scripts) {
                if (script.textContent.includes('const programs = [')) {
                    console.log('📍 Found programs definition in script tag');
                    
                    // Try to extract and evaluate programs
                    try {
                        // This is a hacky way but necessary for the current structure
                        const match = script.textContent.match(/const programs = (\[[\s\S]*?\]);[\s\S]*?(?=const|function|$)/);
                        if (match) {
                            console.log('🔍 Attempting to extract programs array...');
                            // Make programs globally available
                            window.programs = eval(match[1]);
                            console.log('✅ Programs extracted and made global:', window.programs.length, 'programs');
                            
                            // Trigger program rendering if needed
                            if (typeof renderPrograms === 'function') {
                                renderPrograms(window.programs);
                            }
                        }
                    } catch (err) {
                        console.error('Failed to extract programs:', err);
                    }
                    break;
                }
            }
        } else {
            console.log('✅ Programs already available:', window.programs.length, 'programs');
        }
        
        // Also ensure window.programsDatabase is set
        if (typeof window.programsDatabase === 'undefined' && window.programs) {
            window.programsDatabase = {
                programs: window.programs,
                totalPrograms: window.programs.length
            };
            console.log('✅ Programs database initialized');
        }
    }, 500);
});

// Also fix any program-related functions that might be looking for programs
window.addEventListener('load', function() {
    // Ensure program selector is populated if it exists
    const programSearch = document.getElementById('programSearch');
    if (programSearch && (!programSearch.options || programSearch.options.length <= 1)) {
        console.log('🔧 Fixing empty program selector...');
        if (window.programs && window.programs.length > 0) {
            // Trigger re-render of programs
            const event = new Event('input');
            programSearch.dispatchEvent(event);
        }
    }
});

console.log('✅ Programs fix initialized');
