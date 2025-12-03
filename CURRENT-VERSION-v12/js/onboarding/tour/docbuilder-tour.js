/**
 * Doc Builder Tour Configuration
 * 
 * 6-step guided tour of the Aftercare Document Builder
 */

const DocBuilderTour = (function() {
    'use strict';

    const STEPS = [
        // Step 0: Welcome
        {
            type: 'overlay',
            title: 'Every client has an aftercare document',
            content: 'This is where you organize recommendations into a packet for parents. Let\'s see how it works.',
            showPrev: false,
            nextLabel: 'Show me'
        },
        
        // Step 1: Builder Pane Overview
        {
            target: '[data-tour-id="builder-pane"]',
            fallback: '.pane.builder, .builder-panel',
            title: 'Your Document Builder',
            content: 'Programs you add from the search results appear here. Organize them into sections based on clinical priority.',
            position: 'left'
        },
        
        // Step 2: Lanes/Sections
        {
            target: '#builderLanes',
            fallback: '.builder__lanes, .builder-lanes',
            title: 'Organize your recommendations',
            content: 'Drag programs between sections to reflect your clinical priorities. Primary recommendations go at the top.',
            position: 'left'
        },
        
        // Step 3: Program Entry
        {
            target: '.builder-tile, .program-tile',
            fallback: '[data-tour-id="builder-pane"] .tile',
            optional: true,
            title: 'Programs in the packet',
            content: 'Click a program to see its details and how it will appear to parents in the final document.',
            position: 'left'
        },
        
        // Step 4: Generate Button
        {
            target: '[data-tour-id="generate-btn"]',
            fallback: '#generateDocumentButton, .btn-generate',
            title: 'Generate a family-ready packet',
            content: 'When you\'re ready, generate a clean packet to share in parent sessions. You can preview before finalizing.',
            position: 'top'
        },
        
        // Step 5: Completion
        {
            type: 'overlay',
            title: "You're ready to build aftercare docs",
            content: 'Organize recommendations, add notes, and generate packets. You\'ve completed all the core tours!',
            proTip: 'Start with 2-3 primary recommendations and add alternatives for flexibility.',
            showPrev: false,
            nextLabel: 'Finish'
        }
    ];

    /**
     * Start the doc builder tour
     */
    function start() {
        return new Promise((resolve, reject) => {
            try {
                const tour = new ProductTour({
                    tourId: 'docBuilder',
                    steps: STEPS,
                    onComplete: () => {
                        console.log('[DocBuilderTour] Completed');
                        resolve();
                    },
                    onSkip: (stepIndex) => {
                        console.log('[DocBuilderTour] Skipped at step', stepIndex);
                        resolve();
                    }
                });
                
                tour.start();
            } catch (error) {
                console.error('[DocBuilderTour] Failed to start:', error);
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
    window.DocBuilderTour = DocBuilderTour;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DocBuilderTour;
}

