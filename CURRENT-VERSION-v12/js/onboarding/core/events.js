/**
 * OnboardingEvents - Event system for CareConnect Pro onboarding
 * 
 * Decouples user actions from onboarding reactions.
 * Includes analytics hook for tracking onboarding effectiveness.
 */

const OnboardingEvents = (function() {
    'use strict';

    /**
     * Event name constants for type safety
     */
    const EVENTS = {
        // App events (fired by existing code when user takes actions)
        JOURNEY_STAGE_CLICKED: 'cc:journey:stageClicked',
        FLIGHT_PLAN_TASK_OPENED: 'cc:flightPlan:taskOpened',
        FLIGHT_PLAN_TASK_CREATED: 'cc:flightPlan:taskCreated',
        PROGRAMS_FILTER_APPLIED: 'cc:programs:filterApplied',
        PROGRAMS_PROFILE_OPENED: 'cc:programs:profileOpened',
        MAP_MARKER_CLICKED: 'cc:map:markerClicked',
        DOC_PROGRAM_ADDED: 'cc:doc:programAdded',
        DOC_PREVIEWED: 'cc:doc:previewed',
        GAPS_ITEM_CLICKED: 'cc:gaps:itemClicked',
        HOUSE_CLICKED: 'cc:house:clicked',
        
        // Onboarding events (fired by onboarding system)
        INTRO_STARTED: 'onboarding.intro.started',
        INTRO_COMPLETED: 'onboarding.intro.completed',
        INTRO_SKIPPED: 'onboarding.intro.skipped',
        TOUR_STARTED: 'onboarding.tour.started',
        TOUR_STEP_VIEWED: 'onboarding.tour.stepViewed',
        TOUR_COMPLETED: 'onboarding.tour.completed',
        TOUR_SKIPPED: 'onboarding.tour.skipped',
        CHECKLIST_ITEM_COMPLETED: 'onboarding.checklist.itemCompleted',
        CHECKLIST_COMPLETED: 'onboarding.checklist.completed',
        DEMO_DATA_POPULATED: 'onboarding.demoData.populated',
        DEMO_DATA_CLEARED: 'onboarding.demoData.cleared'
    };

    /**
     * Map of app events to checklist item IDs
     * Used to auto-complete checklist items when user performs actions
     */
    const EVENT_TO_CHECKLIST_MAP = {
        [EVENTS.JOURNEY_STAGE_CLICKED]: 'journeyStageClicked',
        [EVENTS.FLIGHT_PLAN_TASK_OPENED]: 'flightPlanTaskOpened',
        [EVENTS.FLIGHT_PLAN_TASK_CREATED]: 'taskCreated',
        [EVENTS.PROGRAMS_FILTER_APPLIED]: 'programSearchRun',
        [EVENTS.PROGRAMS_PROFILE_OPENED]: 'programProfileOpened',
        [EVENTS.MAP_MARKER_CLICKED]: 'mapMarkerClicked',
        [EVENTS.DOC_PROGRAM_ADDED]: 'programAddedToDoc',
        [EVENTS.DOC_PREVIEWED]: 'docPreviewed',
        [EVENTS.GAPS_ITEM_CLICKED]: 'gapsPanelOpened',
        [EVENTS.HOUSE_CLICKED]: 'houseComplianceClicked'
    };

    /**
     * Emit an event with automatic analytics logging
     * 
     * @param {string} eventName - Event name from EVENTS constants
     * @param {Object} detail - Event detail payload
     */
    function emit(eventName, detail = {}) {
        const event = new CustomEvent(eventName, { 
            detail: {
                ...detail,
                timestamp: Date.now()
            },
            bubbles: true,
            cancelable: true
        });
        
        window.dispatchEvent(event);
        
        // Log to analytics
        logToAnalytics(eventName, detail);
        
        // Debug logging in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('[OnboardingEvents] Emitted:', eventName, detail);
        }
    }

    /**
     * Subscribe to an event
     * Returns a cleanup function to unsubscribe
     * 
     * @param {string} eventName - Event name to listen for
     * @param {Function} callback - Handler function
     * @returns {Function} - Cleanup function
     */
    function on(eventName, callback) {
        const handler = (event) => {
            try {
                callback(event.detail, event);
            } catch (error) {
                console.error('[OnboardingEvents] Handler error for', eventName, error);
            }
        };
        
        window.addEventListener(eventName, handler);
        
        // Return cleanup function
        return () => {
            window.removeEventListener(eventName, handler);
        };
    }

    /**
     * Subscribe to an event once (auto-removes after first call)
     * 
     * @param {string} eventName - Event name to listen for
     * @param {Function} callback - Handler function
     */
    function once(eventName, callback) {
        const handler = (event) => {
            try {
                callback(event.detail, event);
            } catch (error) {
                console.error('[OnboardingEvents] Handler error for', eventName, error);
            }
        };
        
        window.addEventListener(eventName, handler, { once: true });
    }

    /**
     * Wait for an event to occur (Promise-based)
     * 
     * @param {string} eventName - Event name to wait for
     * @param {number} timeout - Timeout in ms (default: 60000)
     * @returns {Promise<Object>} - Event detail
     */
    function waitFor(eventName, timeout = 60000) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`Timeout waiting for event: ${eventName}`));
            }, timeout);
            
            const cleanup = on(eventName, (detail) => {
                clearTimeout(timeoutId);
                resolve(detail);
            });
        });
    }

    /**
     * Analytics hook - sends events to logging endpoint
     * Currently logs to console, ready for backend integration
     * 
     * @param {string} eventName - Event name
     * @param {Object} detail - Event detail
     */
    function logToAnalytics(eventName, detail) {
        // Get user ID from auth manager if available
        let userId = 'anonymous';
        try {
            if (window.authManager?.getCurrentUser) {
                const user = window.authManager.getCurrentUser();
                userId = user?.id || user?.email || 'anonymous';
            }
        } catch (e) {
            // Ignore auth errors
        }

        const payload = {
            event: eventName,
            ...detail,
            timestamp: Date.now(),
            userId: userId,
            sessionId: getSessionId(),
            url: window.location.pathname
        };

        // Console logging for development
        console.log('[Onboarding Analytics]', payload);

        // Future: Send to analytics endpoint
        // try {
        //     fetch('/api/analytics/onboarding', {
        //         method: 'POST',
        //         headers: { 'Content-Type': 'application/json' },
        //         body: JSON.stringify(payload),
        //         keepalive: true // Ensure request completes even if page unloads
        //     }).catch(() => {
        //         // Silently fail - analytics shouldn't block user
        //     });
        // } catch (e) {
        //     // Ignore analytics errors
        // }
    }

    /**
     * Get or create session ID for analytics
     */
    function getSessionId() {
        let sessionId = sessionStorage.getItem('onboarding_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('onboarding_session_id', sessionId);
        }
        return sessionId;
    }

    /**
     * Get checklist item ID for an app event
     * 
     * @param {string} eventName - App event name
     * @returns {string|null} - Checklist item ID or null
     */
    function getChecklistItemForEvent(eventName) {
        return EVENT_TO_CHECKLIST_MAP[eventName] || null;
    }

    /**
     * Check if an event is an app event (vs onboarding event)
     */
    function isAppEvent(eventName) {
        return eventName.startsWith('cc:');
    }

    /**
     * Check if an event is an onboarding event
     */
    function isOnboardingEvent(eventName) {
        return eventName.startsWith('onboarding.');
    }

    /**
     * Batch subscribe to multiple events
     * Returns a single cleanup function
     * 
     * @param {Object} eventHandlers - Map of eventName -> handler
     * @returns {Function} - Cleanup function for all subscriptions
     */
    function onMultiple(eventHandlers) {
        const cleanups = Object.entries(eventHandlers).map(([eventName, handler]) => {
            return on(eventName, handler);
        });
        
        return () => {
            cleanups.forEach(cleanup => cleanup());
        };
    }

    // Public API
    return {
        EVENTS,
        EVENT_TO_CHECKLIST_MAP,
        emit,
        on,
        once,
        waitFor,
        getChecklistItemForEvent,
        isAppEvent,
        isOnboardingEvent,
        onMultiple,
        logToAnalytics
    };
})();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.OnboardingEvents = OnboardingEvents;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingEvents;
}

