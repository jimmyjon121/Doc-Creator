/**
 * Programs Tour Configuration
 * 
 * 9-step guided tour of the Programs & Docs module
 */

const ProgramsTour = (function() {
    'use strict';

    const STEPS = [
        // Step 0: Welcome
        {
            type: 'overlay',
            title: 'Programs & Docs',
            content: "This is where you research programs and build aftercare documents. Let's explore the key features.",
            showPrev: false,
            nextLabel: 'Show me'
        },
        
        // Step 1: Filter Rail
        {
            target: '[data-tour-id="filter-rail"]',
            fallback: '.filters, .filter-panel, .sidebar',
            title: 'Filter programs to what you need',
            content: 'Filter by level of care, format, state, age range, and more. Use these to quickly narrow down realistic options for each client.',
            position: 'right'
        },
        
        // Step 2: Apply Filter (INTERACTIVE)
        {
            target: '.filter-btn, .filter-checkbox, [data-filter]',
            fallback: '[data-tour-id="filter-rail"] button',
            title: 'Try applying a filter',
            content: 'Click any checkbox or filter button to narrow down the program list. This is how you\'ll find the right options for each client.',
            position: 'right',
            interactive: true,
            waitForEvent: 'cc:programs:filterApplied',
            nextLabel: 'Apply a filter to continue'
        },
        
        // Step 3: Program Card
        {
            target: '[data-tour-id="program-card"]',
            fallback: '.program-card, .result-card',
            title: 'Read a program card at a glance',
            content: 'Each card shows name, level of care, location or network, who they serve, and key attributes.',
            position: 'left'
        },
        
        // Step 4: Card Actions
        {
            target: '.program-card__actions, .card-actions',
            fallback: '[data-tour-id="program-card"] button',
            optional: true,
            title: 'Add or explore programs',
            content: 'Use "Add" to attach a program to your client\'s aftercare draft, "View details" for a full profile, and "Explore network" when a group has multiple locations.',
            position: 'top'
        },
        
        // Step 5: Map Toggle
        {
            target: '[data-tour-id="map-toggle"]',
            fallback: '[data-view="map"], .view-toggle--map, button[onclick*="map"]',
            title: 'Switch to map when geography matters',
            content: 'Use the map to see programs by location and cluster, especially when families care about distance or school districts.',
            position: 'bottom'
        },
        
        // Step 6: Builder Pane
        {
            target: '[data-tour-id="builder-pane"]',
            fallback: '.builder-pane, .document-builder, .builder-panel',
            title: 'Programs flow into your aftercare document',
            content: 'As you add programs, they show up here in your draft aftercare doc. You\'ll finalize this in the Doc Builder.',
            position: 'left'
        },
        
        // Step 7: Generate Button
        {
            target: '[data-tour-id="generate-btn"]',
            fallback: '.generate-btn, button[onclick*="generate"], .btn-generate',
            optional: true,
            title: 'Generate your document',
            content: 'When you\'re ready, click here to generate a clean, family-ready aftercare packet.',
            position: 'top'
        },
        
        // Step 8: Completion
        {
            type: 'overlay',
            title: "You've got the basics",
            content: "You've seen filters, cards, map, and how to add programs. Next, we'll build a complete aftercare document.",
            showPrev: false,
            nextLabel: 'Finish Tour'
        }
    ];

    /**
     * Navigate to Programs tab before starting tour
     */
    async function ensureOnProgramsTab() {
        // Check if we're already on Programs view
        const programsView = document.querySelector('.programs-view, #programsContainer, [data-tab="programs"].is-active');
        if (programsView) {
            return true;
        }
        
        // Try to click the Programs tab
        const programsTab = document.querySelector('[data-tab="programs"], .toolbar__document-toggle-btn[onclick*="programs"]');
        if (programsTab) {
            programsTab.click();
            // Wait for tab switch
            await new Promise(resolve => setTimeout(resolve, 500));
            return true;
        }
        
        console.warn('[ProgramsTour] Could not navigate to Programs tab');
        return false;
    }

    /**
     * Start the programs tour
     */
    async function start() {
        return new Promise(async (resolve, reject) => {
            try {
                // Ensure we're on the Programs tab
                await ensureOnProgramsTab();
                
                const tour = new ProductTour({
                    tourId: 'programs',
                    steps: STEPS,
                    onComplete: () => {
                        console.log('[ProgramsTour] Completed');
                        resolve();
                    },
                    onSkip: (stepIndex) => {
                        console.log('[ProgramsTour] Skipped at step', stepIndex);
                        resolve();
                    }
                });
                
                tour.start();
            } catch (error) {
                console.error('[ProgramsTour] Failed to start:', error);
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
    window.ProgramsTour = ProgramsTour;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgramsTour;
}

