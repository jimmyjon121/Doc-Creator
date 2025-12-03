/**
 * OnboardingController - Main orchestrator for CareConnect Pro onboarding
 * 
 * Handles:
 * - First-time user detection
 * - Demo data auto-population
 * - Tour initiation
 * - Resume logic for incomplete onboarding
 */

const OnboardingController = (function() {
    'use strict';

    // Internal state
    let initialized = false;
    let currentUserId = null;
    let state = null;
    let checklist = null;
    let intro = null;
    let eventCleanups = [];

    /**
     * Initialize the onboarding system
     * Should be called after the app is fully loaded
     */
    async function initialize() {
        if (initialized) {
            console.log('[OnboardingController] Already initialized');
            return;
        }

        console.log('[OnboardingController] Initializing...');

        // Get current user ID
        currentUserId = getCurrentUserId();
        
        // Load state
        state = await OnboardingState.load(currentUserId);
        
        // Set up event listeners for checklist auto-completion
        setupEventListeners();
        
        // Determine what to show
        const status = OnboardingState.getOverallStatus(state);
        
        console.log('[OnboardingController] Status:', status);
        
        if (OnboardingState.isNewUser(state)) {
            // New user - show welcome flow
            console.log('[OnboardingController] New user detected');
            await handleNewUser();
        } else if (status.status === 'in_progress' && !state.dismissedResumeBanner) {
            // Returning user with incomplete onboarding
            console.log('[OnboardingController] Incomplete onboarding, showing resume banner');
            showResumeBanner();
        }
        
        // Initialize checklist if not complete
        if (!status.checklistComplete) {
            initializeChecklist();
        }
        
        initialized = true;
        console.log('[OnboardingController] Initialization complete');
    }

    /**
     * Get current user ID from auth system
     */
    function getCurrentUserId() {
        try {
            if (window.authManager?.getCurrentUser) {
                const user = window.authManager.getCurrentUser();
                return user?.id || user?.email || 'anonymous';
            }
        } catch (e) {
            console.warn('[OnboardingController] Could not get user ID:', e);
        }
        return 'anonymous';
    }

    /**
     * Handle new user flow
     */
    async function handleNewUser() {
        // Check if user has any clients
        let hasClients = false;
        try {
            if (window.clientManager?.getAllClients) {
                const clients = await window.clientManager.getAllClients();
                hasClients = clients && clients.length > 0;
            }
        } catch (e) {
            console.warn('[OnboardingController] Could not check clients:', e);
        }

        // Show welcome modal
        showWelcomeModal(hasClients);
    }

    /**
     * Show welcome modal for new users
     */
    function showWelcomeModal(hasClients = false) {
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal-overlay';
        modal.id = 'onboarding-welcome-modal';
        modal.innerHTML = `
            <div class="onboarding-modal welcome-modal">
                <div class="modal-header">
                    <div class="modal-icon">👋</div>
                    <h2>Welcome to CareConnect Pro</h2>
                </div>
                <div class="modal-body">
                    <p>We'll walk you through the dashboard, program search, and aftercare docs so you can get up to speed quickly.</p>
                    ${!hasClients ? `
                        <div class="demo-data-notice">
                            <span class="notice-icon">💡</span>
                            <span>We'll add some training clients so you can practice without affecting real data.</span>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" data-action="skip">Skip for now</button>
                    <button class="btn-primary" data-action="start">Start guided setup</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        modal.querySelector('[data-action="start"]').addEventListener('click', async () => {
            modal.remove();
            
            // Populate demo data if no clients
            if (!hasClients) {
                await populateDemoData();
            }
            
            // Start intro animation
            await startIntro();
        });

        modal.querySelector('[data-action="skip"]').addEventListener('click', () => {
            modal.remove();
            OnboardingState.markIntroSkipped(state);
            OnboardingState.save(currentUserId, state);
            showSkipBanner();
            initializeChecklist();
        });

        // Allow clicking overlay to close (treat as skip)
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
                OnboardingState.markIntroSkipped(state);
                OnboardingState.save(currentUserId, state);
                initializeChecklist();
            }
        });
    }

    /**
     * Show skip banner
     */
    function showSkipBanner() {
        showNotification('You can start a guided tour anytime from Help & Onboarding.', 'info');
    }

    /**
     * Show resume banner for returning users with incomplete onboarding
     */
    function showResumeBanner() {
        const progress = OnboardingState.getChecklistProgress(state);
        
        const banner = document.createElement('div');
        banner.className = 'onboarding-resume-banner';
        banner.id = 'onboarding-resume-banner';
        banner.innerHTML = `
            <div class="resume-banner-content">
                <span class="resume-icon">📋</span>
                <span class="resume-text">Continue your Quick Start (${progress.completed}/${progress.total} complete)</span>
                <button class="btn-resume" data-action="resume">Resume</button>
                <button class="btn-dismiss" data-action="dismiss" aria-label="Dismiss">×</button>
            </div>
        `;

        document.body.appendChild(banner);

        // Animate in
        requestAnimationFrame(() => {
            banner.classList.add('show');
        });

        banner.querySelector('[data-action="resume"]').addEventListener('click', () => {
            banner.remove();
            showChecklist();
        });

        banner.querySelector('[data-action="dismiss"]').addEventListener('click', () => {
            banner.classList.remove('show');
            setTimeout(() => banner.remove(), 300);
            OnboardingState.dismissResumeBanner(state);
            OnboardingState.save(currentUserId, state);
        });
    }

    /**
     * Populate demo data for new users
     */
    async function populateDemoData() {
        try {
            if (window.DemoClients?.populate) {
                await window.DemoClients.populate();
                OnboardingState.markDemoDataUsed(state);
                await OnboardingState.save(currentUserId, state);
                OnboardingEvents.emit(OnboardingEvents.EVENTS.DEMO_DATA_POPULATED);
                showNotification('Training clients loaded', 'success');
            }
        } catch (error) {
            console.error('[OnboardingController] Failed to populate demo data:', error);
        }
    }

    /**
     * Clear demo data
     */
    async function clearDemoData() {
        try {
            if (window.DemoClients?.clear) {
                await window.DemoClients.clear();
                OnboardingEvents.emit(OnboardingEvents.EVENTS.DEMO_DATA_CLEARED);
                showNotification('Training data cleared', 'success');
            }
        } catch (error) {
            console.error('[OnboardingController] Failed to clear demo data:', error);
            showNotification('Failed to clear training data', 'error');
        }
    }

    /**
     * Start intro animation
     */
    async function startIntro() {
        OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_STARTED);
        
        if (window.OnboardingIntro) {
            intro = new window.OnboardingIntro();
            await intro.start();
        }
        
        OnboardingState.markIntroComplete(state);
        await OnboardingState.save(currentUserId, state);
        OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_COMPLETED);
        
        // After intro, offer to start dashboard tour
        offerDashboardTour();
    }

    /**
     * Replay intro animation
     */
    async function replayIntro() {
        OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_STARTED);
        
        if (window.OnboardingIntro) {
            intro = new window.OnboardingIntro();
            await intro.start();
        }
        
        OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_COMPLETED);
    }

    /**
     * Offer to start dashboard tour after intro
     */
    function offerDashboardTour() {
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal-overlay';
        modal.innerHTML = `
            <div class="onboarding-modal tour-offer-modal">
                <div class="modal-header">
                    <div class="modal-icon">🎯</div>
                    <h2>Ready for a Quick Tour?</h2>
                </div>
                <div class="modal-body">
                    <p>Take a 2-minute guided tour of your dashboard to learn where everything is.</p>
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary" data-action="skip">I'll explore on my own</button>
                    <button class="btn-primary" data-action="start">Start Dashboard Tour</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.querySelector('[data-action="start"]').addEventListener('click', () => {
            modal.remove();
            startTour('dashboard');
        });

        modal.querySelector('[data-action="skip"]').addEventListener('click', () => {
            modal.remove();
            initializeChecklist();
            showNotification('You can start tours anytime from Help & Onboarding.', 'info');
        });
    }

    /**
     * Start a specific tour
     * @param {string} tourId - 'dashboard', 'programs', or 'docBuilder'
     */
    async function startTour(tourId) {
        OnboardingEvents.emit(OnboardingEvents.EVENTS.TOUR_STARTED, { tourId });
        
        let tour = null;
        
        switch (tourId) {
            case 'dashboard':
                if (window.DashboardTour) {
                    tour = new window.ProductTour({
                        tourId: 'dashboard',
                        steps: window.DashboardTour.STEPS,
                        onComplete: () => handleTourComplete(tourId),
                        onSkip: (stepIndex) => handleTourSkip(tourId, stepIndex)
                    });
                }
                break;
            case 'programs':
                if (window.ProgramsTour) {
                    tour = new window.ProductTour({
                        tourId: 'programs',
                        steps: window.ProgramsTour.STEPS,
                        onComplete: () => handleTourComplete(tourId),
                        onSkip: (stepIndex) => handleTourSkip(tourId, stepIndex)
                    });
                }
                break;
            case 'docBuilder':
                if (window.DocBuilderTour) {
                    tour = new window.ProductTour({
                        tourId: 'docBuilder',
                        steps: window.DocBuilderTour.STEPS,
                        onComplete: () => handleTourComplete(tourId),
                        onSkip: (stepIndex) => handleTourSkip(tourId, stepIndex)
                    });
                }
                break;
        }
        
        if (tour) {
            await tour.start();
        } else {
            console.warn('[OnboardingController] Tour not available:', tourId);
            showNotification('Tour not available yet', 'warning');
        }
    }

    /**
     * Handle tour completion
     */
    async function handleTourComplete(tourId) {
        OnboardingState.markTourComplete(tourId, state);
        await OnboardingState.save(currentUserId, state);
        OnboardingEvents.emit(OnboardingEvents.EVENTS.TOUR_COMPLETED, { tourId });
        
        // Initialize checklist if not already showing
        initializeChecklist();
    }

    /**
     * Handle tour skip
     */
    async function handleTourSkip(tourId, stepIndex) {
        OnboardingState.markTourStepComplete(tourId, stepIndex, state);
        await OnboardingState.save(currentUserId, state);
        OnboardingEvents.emit(OnboardingEvents.EVENTS.TOUR_SKIPPED, { tourId, stepIndex });
        
        // Initialize checklist
        initializeChecklist();
    }

    /**
     * Initialize the checklist component
     */
    function initializeChecklist() {
        if (checklist) return; // Already initialized
        
        if (window.QuickStartChecklist) {
            checklist = new window.QuickStartChecklist();
            checklist.init(state);
        }
    }

    /**
     * Show the checklist
     */
    function showChecklist() {
        if (checklist) {
            checklist.show();
        } else {
            initializeChecklist();
        }
    }

    /**
     * Hide the checklist
     */
    function hideChecklist() {
        if (checklist) {
            checklist.hide();
        }
    }

    /**
     * Set up event listeners for checklist auto-completion
     */
    function setupEventListeners() {
        // Listen for app events and update checklist
        const appEvents = [
            OnboardingEvents.EVENTS.JOURNEY_STAGE_CLICKED,
            OnboardingEvents.EVENTS.FLIGHT_PLAN_TASK_OPENED,
            OnboardingEvents.EVENTS.FLIGHT_PLAN_TASK_CREATED,
            OnboardingEvents.EVENTS.PROGRAMS_FILTER_APPLIED,
            OnboardingEvents.EVENTS.PROGRAMS_PROFILE_OPENED,
            OnboardingEvents.EVENTS.MAP_MARKER_CLICKED,
            OnboardingEvents.EVENTS.DOC_PROGRAM_ADDED,
            OnboardingEvents.EVENTS.DOC_PREVIEWED,
            OnboardingEvents.EVENTS.GAPS_ITEM_CLICKED,
            OnboardingEvents.EVENTS.HOUSE_CLICKED
        ];

        appEvents.forEach(eventName => {
            const cleanup = OnboardingEvents.on(eventName, async (detail) => {
                const checklistItemId = OnboardingEvents.getChecklistItemForEvent(eventName);
                if (checklistItemId && state && !state.checklist[checklistItemId]) {
                    OnboardingState.markChecklistItem(checklistItemId, state);
                    await OnboardingState.save(currentUserId, state);
                    
                    OnboardingEvents.emit(OnboardingEvents.EVENTS.CHECKLIST_ITEM_COMPLETED, {
                        itemId: checklistItemId,
                        triggeredBy: eventName
                    });
                    
                    // Update checklist UI
                    if (checklist) {
                        checklist.markComplete(checklistItemId);
                    }
                    
                    // Check if all complete
                    if (OnboardingState.isChecklistComplete(state)) {
                        OnboardingEvents.emit(OnboardingEvents.EVENTS.CHECKLIST_COMPLETED);
                        showCompletionCelebration();
                    }
                }
            });
            eventCleanups.push(cleanup);
        });
    }

    /**
     * Show completion celebration
     */
    function showCompletionCelebration() {
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal-overlay celebration';
        modal.innerHTML = `
            <div class="onboarding-modal completion-modal">
                <div class="confetti-container" id="completion-confetti"></div>
                <div class="modal-header">
                    <div class="modal-icon celebration-icon">🎉</div>
                    <h2>You're All Set!</h2>
                </div>
                <div class="modal-body">
                    <p>Great job! You've completed the Quick Start checklist and are ready to work independently.</p>
                    <div class="completion-stats">
                        <div class="stat">
                            <div class="stat-icon">✓</div>
                            <div class="stat-label">Dashboard Explored</div>
                        </div>
                        <div class="stat">
                            <div class="stat-icon">✓</div>
                            <div class="stat-label">Programs Searched</div>
                        </div>
                        <div class="stat">
                            <div class="stat-icon">✓</div>
                            <div class="stat-label">Documents Built</div>
                        </div>
                    </div>
                    <div class="pro-tip">
                        <strong>Pro tip:</strong> Start each morning by checking your Flight Plan, then clear the red zone first.
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn-primary btn-large" data-action="close">Start Using CareConnect</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        
        // Trigger confetti
        triggerConfetti(modal.querySelector('#completion-confetti'));
        
        modal.querySelector('[data-action="close"]').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Trigger confetti animation
     */
    function triggerConfetti(container) {
        if (!container) return;
        
        const colors = ['#6E7BFF', '#8D97FF', '#4CAF9F', '#FFB347', '#FF6B6B'];
        const count = 60;
        
        for (let i = 0; i < count; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = `${Math.random() * 100}%`;
            confetti.style.background = colors[i % colors.length];
            confetti.style.animationDelay = `${Math.random() * 2}s`;
            confetti.style.animationDuration = `${2 + Math.random() * 2}s`;
            container.appendChild(confetti);
        }
    }

    /**
     * Show notification
     */
    function showNotification(message, type = 'info') {
        // Use existing notification system if available
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback notification
        const notification = document.createElement('div');
        notification.className = `onboarding-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        requestAnimationFrame(() => notification.classList.add('show'));
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3500);
    }

    /**
     * Cleanup
     */
    function destroy() {
        eventCleanups.forEach(cleanup => cleanup());
        eventCleanups = [];
        
        if (checklist) {
            checklist.destroy();
            checklist = null;
        }
        
        if (intro) {
            intro.cleanup();
            intro = null;
        }
        
        initialized = false;
    }

    /**
     * Get current state (for debugging)
     */
    function getState() {
        return state;
    }

    // Public API
    return {
        initialize,
        startTour,
        replayIntro,
        showChecklist,
        hideChecklist,
        clearDemoData,
        destroy,
        getState
    };
})();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.OnboardingController = OnboardingController;
    window.onboardingController = OnboardingController; // Alias for help menu
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingController;
}

