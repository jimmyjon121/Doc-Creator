/**
 * OnboardingState - State management for CareConnect Pro onboarding
 * 
 * Designed with a backend seam for future server-side persistence.
 * Currently uses localStorage, keyed by userId.
 */

const OnboardingState = (function() {
    'use strict';

    const STORAGE_KEY = 'careconnect_onboarding_v2';
    const VERSION = 2;

    /**
     * Default state shape for a new user
     */
    function getDefaultState() {
        return {
            version: VERSION,
            
            // Orientation layer
            seenIntro: false,
            skippedIntro: false,
            
            // Tour layer
            tours: {
                dashboard: { completed: false, stepsCompleted: 0, lastStep: null },
                programs: { completed: false, stepsCompleted: 0, lastStep: null },
                docBuilder: { completed: false, stepsCompleted: 0, lastStep: null }
            },
            
            // Checklist layer
            checklist: {
                // Morning Routine
                journeyStageClicked: false,
                flightPlanTaskOpened: false,
                taskCreated: false,
                
                // Program Research
                programSearchRun: false,
                programProfileOpened: false,
                mapMarkerClicked: false,
                
                // Aftercare Planning
                programAddedToDoc: false,
                docPreviewed: false,
                
                // Data Hygiene
                gapsPanelOpened: false,
                houseComplianceClicked: false
            },
            
            // Meta
            usedDemoData: false,
            dismissedResumeBanner: false,
            firstLoginAt: null,
            completedAt: null
        };
    }

    /**
     * Get storage key for a specific user
     */
    function getStorageKey(userId) {
        const safeUserId = userId || 'anonymous';
        return `${STORAGE_KEY}_${safeUserId}`;
    }

    /**
     * Load onboarding state for a user
     * Async to support future backend calls
     * 
     * @param {string} userId - User identifier
     * @returns {Promise<Object>} - Onboarding state
     */
    async function load(userId) {
        // Future backend seam:
        // try {
        //     const response = await fetch(`/api/onboarding/${userId}`);
        //     if (response.ok) {
        //         const remoteState = await response.json();
        //         // Merge with localStorage for offline support
        //         return remoteState;
        //     }
        // } catch (e) {
        //     console.warn('[OnboardingState] Backend unavailable, using localStorage', e);
        // }

        try {
            const key = getStorageKey(userId);
            const stored = localStorage.getItem(key);
            
            if (stored) {
                const parsed = JSON.parse(stored);
                
                // Version migration: if old version, reset to defaults
                if (!parsed.version || parsed.version < VERSION) {
                    console.log('[OnboardingState] Migrating from version', parsed.version, 'to', VERSION);
                    const defaultState = getDefaultState();
                    // Preserve some fields during migration
                    defaultState.seenIntro = parsed.seenIntro || parsed.videoWatched || false;
                    defaultState.firstLoginAt = parsed.firstLoginAt || parsed.lastAccessed || null;
                    return defaultState;
                }
                
                // Merge with defaults to handle any new fields
                return { ...getDefaultState(), ...parsed };
            }
        } catch (error) {
            console.error('[OnboardingState] Failed to load state:', error);
        }
        
        return getDefaultState();
    }

    /**
     * Save onboarding state for a user
     * Async to support future backend calls
     * 
     * @param {string} userId - User identifier
     * @param {Object} state - State to save
     * @returns {Promise<void>}
     */
    async function save(userId, state) {
        // Future backend seam:
        // try {
        //     await fetch(`/api/onboarding/${userId}`, {
        //         method: 'PUT',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(state)
        //     });
        // } catch (e) {
        //     console.warn('[OnboardingState] Backend save failed, using localStorage', e);
        // }

        try {
            const key = getStorageKey(userId);
            state.version = VERSION;
            state.lastUpdated = new Date().toISOString();
            localStorage.setItem(key, JSON.stringify(state));
        } catch (error) {
            console.error('[OnboardingState] Failed to save state:', error);
        }
    }

    /**
     * Check if user is new (hasn't seen intro)
     */
    function isNewUser(state) {
        return !state.seenIntro && !state.skippedIntro;
    }

    /**
     * Check if all checklist items are complete
     */
    function isChecklistComplete(state) {
        if (!state.checklist) return false;
        return Object.values(state.checklist).every(Boolean);
    }

    /**
     * Get checklist progress
     * @returns {{ completed: number, total: number, percentage: number }}
     */
    function getChecklistProgress(state) {
        if (!state.checklist) {
            return { completed: 0, total: 0, percentage: 0 };
        }
        
        const items = Object.values(state.checklist);
        const total = items.length;
        const completed = items.filter(Boolean).length;
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
        
        return { completed, total, percentage };
    }

    /**
     * Get tour progress for a specific tour
     * @param {string} tourId - 'dashboard', 'programs', or 'docBuilder'
     */
    function getTourProgress(tourId, state) {
        if (!state.tours || !state.tours[tourId]) {
            return { completed: false, stepsCompleted: 0, lastStep: null };
        }
        return state.tours[tourId];
    }

    /**
     * Check if all tours are complete
     */
    function areAllToursComplete(state) {
        if (!state.tours) return false;
        return Object.values(state.tours).every(tour => tour.completed);
    }

    /**
     * Mark intro as complete
     */
    function markIntroComplete(state) {
        state.seenIntro = true;
        state.skippedIntro = false;
        if (!state.firstLoginAt) {
            state.firstLoginAt = new Date().toISOString();
        }
        return state;
    }

    /**
     * Mark intro as skipped
     */
    function markIntroSkipped(state) {
        state.skippedIntro = true;
        if (!state.firstLoginAt) {
            state.firstLoginAt = new Date().toISOString();
        }
        return state;
    }

    /**
     * Mark a tour step as complete
     * @param {string} tourId - 'dashboard', 'programs', or 'docBuilder'
     * @param {number} stepIndex - Step index
     */
    function markTourStepComplete(tourId, stepIndex, state) {
        if (!state.tours) {
            state.tours = getDefaultState().tours;
        }
        
        if (!state.tours[tourId]) {
            state.tours[tourId] = { completed: false, stepsCompleted: 0, lastStep: null };
        }
        
        state.tours[tourId].stepsCompleted = Math.max(state.tours[tourId].stepsCompleted, stepIndex + 1);
        state.tours[tourId].lastStep = stepIndex;
        
        return state;
    }

    /**
     * Mark a tour as fully complete
     */
    function markTourComplete(tourId, state) {
        if (!state.tours) {
            state.tours = getDefaultState().tours;
        }
        
        if (!state.tours[tourId]) {
            state.tours[tourId] = { completed: false, stepsCompleted: 0, lastStep: null };
        }
        
        state.tours[tourId].completed = true;
        
        // Check if all tours complete
        if (areAllToursComplete(state) && isChecklistComplete(state)) {
            state.completedAt = new Date().toISOString();
        }
        
        return state;
    }

    /**
     * Mark a checklist item as complete
     * @param {string} itemId - Checklist item ID
     */
    function markChecklistItem(itemId, state) {
        if (!state.checklist) {
            state.checklist = getDefaultState().checklist;
        }
        
        if (itemId in state.checklist) {
            state.checklist[itemId] = true;
        }
        
        // Check if all complete
        if (isChecklistComplete(state) && areAllToursComplete(state)) {
            state.completedAt = new Date().toISOString();
        }
        
        return state;
    }

    /**
     * Mark demo data as used
     */
    function markDemoDataUsed(state) {
        state.usedDemoData = true;
        return state;
    }

    /**
     * Dismiss resume banner
     */
    function dismissResumeBanner(state) {
        state.dismissedResumeBanner = true;
        return state;
    }

    /**
     * Reset onboarding state for a user (for testing)
     */
    async function reset(userId) {
        try {
            const key = getStorageKey(userId);
            localStorage.removeItem(key);
            console.log('[OnboardingState] State reset for user:', userId);
        } catch (error) {
            console.error('[OnboardingState] Failed to reset state:', error);
        }
    }

    /**
     * Get overall onboarding completion status
     */
    function getOverallStatus(state) {
        const introComplete = state.seenIntro || state.skippedIntro;
        const toursComplete = areAllToursComplete(state);
        const checklistComplete = isChecklistComplete(state);
        const checklistProgress = getChecklistProgress(state);
        
        let status = 'not_started';
        if (introComplete && toursComplete && checklistComplete) {
            status = 'completed';
        } else if (introComplete || checklistProgress.completed > 0) {
            status = 'in_progress';
        }
        
        return {
            status,
            introComplete,
            toursComplete,
            checklistComplete,
            checklistProgress,
            completedAt: state.completedAt
        };
    }

    // Public API
    return {
        load,
        save,
        isNewUser,
        isChecklistComplete,
        getChecklistProgress,
        getTourProgress,
        areAllToursComplete,
        markIntroComplete,
        markIntroSkipped,
        markTourStepComplete,
        markTourComplete,
        markChecklistItem,
        markDemoDataUsed,
        dismissResumeBanner,
        reset,
        getDefaultState,
        getOverallStatus
    };
})();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.OnboardingState = OnboardingState;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingState;
}

