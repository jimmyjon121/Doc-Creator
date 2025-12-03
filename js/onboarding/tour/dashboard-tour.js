/**
 * Dashboard Tour Configuration
 * 
 * 11-step guided tour of the Coach Dashboard
 */

const DashboardTour = (function() {
    'use strict';

    const STEPS = [
        // Step 0: Welcome overlay
        {
            type: 'overlay',
            title: 'Welcome to your Coach Dashboard',
            content: 'This quick tour will show you where to start your day, how to see your caseload at a glance, and how to find what needs your attention.',
            proTip: 'You can exit anytime with Escape or the Skip button.',
            showPrev: false,
            nextLabel: "Let's go"
        },
        
        // Step 1: Quick Actions
        {
            target: '[data-tour-id="quick-actions"]',
            fallback: '#quickActionsWidget',
            title: 'Start here every morning',
            content: "The header shows who's logged in and when your dashboard was last updated. Use these buttons to add a client, create tasks, or generate aftercare documents.",
            position: 'bottom'
        },
        
        // Step 2: Journey Radar
        {
            target: '[data-tour-id="journey-radar"]',
            fallback: '#journeyRadarWidget',
            title: 'Where is everyone in treatment?',
            content: 'Each tile shows how many clients are in that stage — Week 1, Day 14–16, Day 30, 45+ days, discharge pipeline, and recently discharged.',
            proTip: 'Click any stage tile now to see it filter your tasks below.',
            position: 'bottom',
            interactive: true,
            waitForEvent: 'cc:journey:stageClicked',
            nextLabel: 'Click a stage to continue'
        },
        
        // Step 3: Flight Plan
        {
            target: '[data-tour-id="flight-plan"]',
            fallback: '#flightPlanWidget',
            title: 'Your Daily Flight Plan',
            content: 'This is your action list. Tasks are grouped by urgency—Red for immediate or overdue, Purple for this week, Yellow for due soon, and Green for on-track items.',
            position: 'right'
        },
        
        // Step 4: Task Row (optional - may not exist)
        {
            target: '.priority-item',
            fallback: '[data-tour-id="flight-plan"] .zone-content .priority-item',
            optional: true,
            title: 'Tasks that match how you actually work',
            content: 'Each row links to a client and a real task, like "RR this week," "Parent call – overdue," or "Aftercare planning – not started."',
            proTip: 'Click a task to open the client context.',
            position: 'right'
        },
        
        // Step 5: Missions Widget
        {
            target: '[data-tour-id="missions"]',
            fallback: '#missionsWidget',
            optional: true,
            title: "Today's Missions",
            content: 'Your primary objective and secondary goals for the day. Check off tasks as you complete them to track your progress.',
            position: 'left'
        },
        
        // Step 6: House Health
        {
            target: '[data-tour-id="house-health"]',
            fallback: '#houseWeatherWidget',
            optional: true,
            title: 'Spot documentation and compliance gaps',
            content: 'These cards show how your houses are doing on aftercare planning, ROIs, and discharge docs.',
            proTip: 'Click a house to see which clients are driving the numbers.',
            position: 'top'
        },
        
        // Step 7: Programs Tab
        {
            target: '.toolbar__document-toggle-btn[data-tab="programs"]',
            fallback: '[onclick*="Programs"]',
            optional: true,
            title: 'Programs & Docs',
            content: 'Switch to this tab to search the program database, explore options on the map, and build aftercare documents.',
            position: 'bottom'
        },
        
        // Step 8: Search
        {
            target: '.toolbar__search',
            fallback: '#searchInput',
            optional: true,
            title: 'Quick Search',
            content: 'Search for programs by name, location, or specialty. Results update as you type.',
            position: 'bottom'
        },
        
        // Step 9: Completion
        {
            type: 'overlay',
            title: "You're ready to work from the dashboard",
            content: 'Start each day by scanning your Client Journey and Daily Flight Plan, then drill into intakes, discharges, and gaps.',
            proTip: 'You can replay this tour anytime from the Help menu.',
            showPrev: false,
            nextLabel: 'Finish Tour'
        }
    ];

    /**
     * Start the dashboard tour
     */
    function start() {
        return new Promise((resolve, reject) => {
            try {
                const tour = new ProductTour({
                    tourId: 'dashboard',
                    steps: STEPS,
                    onComplete: () => {
                        console.log('[DashboardTour] Completed');
                        resolve();
                    },
                    onSkip: (stepIndex) => {
                        console.log('[DashboardTour] Skipped at step', stepIndex);
                        resolve();
                    }
                });
                
                tour.start();
            } catch (error) {
                console.error('[DashboardTour] Failed to start:', error);
                reject(error);
            }
        });
    }

    return {
        STEPS,
        start
    };
})();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.DashboardTour = DashboardTour;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardTour;
}

