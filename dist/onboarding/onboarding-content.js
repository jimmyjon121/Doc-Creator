/**
 * Onboarding Content
 * Shared copy for video scenes, tour steps, practice mode and help text.
 */

const OnboardingContent = {
    // Animated video script
    video: {
        scenes: [
            {
                id: 'problem',
                duration: 8000,
                caption: 'Clinical coaches spend hours on documentation...',
                narration: 'Aftercare planning used to take 30-45 minutes per client. Tracking twenty-plus milestones across houses was overwhelming.'
            },
            {
                id: 'solution',
                duration: 10000,
                caption: 'CareConnect automates tracking and research',
                narration: 'CareConnect Pro watches every milestone automatically, generates aftercare documents in seconds, and keeps every house compliant.'
            },
            {
                id: 'impact',
                duration: 8000,
                caption: '45 minutes → 30 seconds',
                narration: 'What took 45 minutes now takes 30 seconds. You focus on care, we handle the timers, documents, and alerts.'
            },
            {
                id: 'cta',
                duration: 4000,
                caption: 'Let me show you how…',
                narration: 'Ready to see it in action? Let’s take a quick tour.'
            }
        ]
    },

    // Guided walkthrough
    tour: {
        welcome: {
            title: 'Welcome to CareConnect Pro!',
            content: "We'll cover the workflow in about five minutes. You can pause, skip, or replay anytime.",
            action: "Let's Start"
        },
        steps: [
            {
                id: 'dashboard-overview',
                target: '.dashboard-container',
                title: 'Your Command Center',
                content: 'This dashboard is mission control. The status of every client lives here.',
                position: 'center',
                highlight: true
            },
            {
                id: 'priority-zones',
                target: '.priority-zones',
                title: 'Priority Zones: Red, Yellow, Green',
                content: 'Red means overdue or <7 days to discharge, yellow is due now or soon, green is on track. Clear red first.',
                position: 'bottom',
                highlight: true,
                proTip: 'Kick off each morning by clearing every red tile. That habit keeps families on schedule.'
            },
            {
                id: 'red-zone',
                target: '.red-zone',
                title: 'Red Zone = Urgent Action',
                content: 'Missing critical milestones when discharge is near. These need immediate attention.',
                position: 'right',
                highlight: true
            },
            {
                id: 'yellow-zone',
                target: '.yellow-zone',
                title: 'Yellow Zone = Due Today/Soon',
                content: 'Items due today or the next few days. Handle them before they flip to red.',
                position: 'right',
                highlight: true
            },
            {
                id: 'client-cards',
                target: '.client-card:first-child',
                title: 'Client Cards Show Everything',
                content: 'See days in care, completion percentage, and fast actions. Click to open details.',
                position: 'bottom',
                highlight: true,
                interactive: true,
                action: 'click'
            },
            {
                id: 'timeline-intro',
                target: '.timeline-button',
                title: 'Timeline = Compliance Radar',
                content: 'Open a client timeline to see every milestone, its due date, and completion state.',
                position: 'left',
                highlight: true,
                interactive: true,
                action: 'click',
                waitFor: '.tracker-timeline'
            },
            {
                id: 'timeline-view',
                target: '.tracker-timeline',
                title: 'Visual Progress Tracking',
                content: 'Completed items turn green with timestamps, yellow items are due soon, red items are overdue.',
                position: 'center',
                highlight: true
            },
            {
                id: 'mark-complete',
                target: '.timeline-item.pending:first-child',
                title: 'One-Click Completion',
                content: 'Click any pending item to mark it complete and log the date instantly.',
                position: 'right',
                highlight: true,
                interactive: true,
                action: 'click'
            },
            {
                id: 'bulk-update',
                target: '.bulk-update-button',
                title: 'Bulk Update = Massive Time Saver',
                content: 'Check off several milestones in seconds. Perfect after family meetings.',
                position: 'left',
                highlight: true,
                interactive: true,
                action: 'click',
                waitFor: '.bulk-update-modal'
            },
            {
                id: 'bulk-filters',
                target: '.bulk-update-filters',
                title: 'Smart Filtering',
                content: 'Filter by incomplete, overdue, or critical and select-all with one tap.',
                position: 'bottom',
                highlight: true
            },
            {
                id: 'document-generation',
                target: '.document-generator-button',
                title: 'Document Generation Magic',
                content: 'Aftercare recommendations, discharge packets, assessments—built in seconds.',
                position: 'left',
                highlight: true,
                proTip: 'The Chrome extraction engine works on every treatment website—no setup required.'
            },
            {
                id: 'discharge-checklist',
                target: '.discharge-checklist-button',
                title: 'Never Miss a Discharge Requirement',
                content: 'The FFAS discharge checklist mirrors your real workflow—printable and synced with tracker fields.',
                position: 'left',
                highlight: true
            },
            {
                id: 'house-weather',
                target: '.house-weather-widget',
                title: 'House Weather System',
                content: 'Administrators see the health of every house at a glance. ⛈️ signals immediate coaching support.',
                position: 'bottom',
                highlight: true
            },
            {
                id: 'quick-actions',
                target: '.quick-actions',
                title: 'Quick Actions',
                content: 'Add clients, launch documents, or open reports from here. Less clicks, more care.',
                position: 'bottom',
                highlight: true
            }
        ],
        completion: {
            title: "You're Ready to Go!",
            content: 'Clear the red zone each morning, lean on bulk update, and keep that timeline front and center.',
            action: 'Start Using CareConnect',
            celebration: true
        }
    },

    // Practice mode copy
    practice: {
        intro: {
            title: 'Practice Mode',
            content: "Try everything with sample clients first. Nothing you do here touches real charts.",
            action: "Start Practice"
        },
        tasks: [
            {
                id: 'complete-overdue',
                title: 'Complete an Overdue Item',
                instruction: "Open Client A's timeline and mark the overdue Aftercare Thread as complete.",
                hint: 'Look for the red warning icon on the timeline.',
                validation: (state) => state.completedMilestones.includes('aftercare_thread')
            },
            {
                id: 'bulk-update',
                title: 'Use Bulk Update',
                instruction: 'Open bulk update for Client B and mark two items complete at once.',
                hint: 'Select items, then save. Notice the confirmation toast.',
                validation: (state) => state.bulkUpdateUsed && state.itemsUpdated >= 2
            },
            {
                id: 'check-discharge',
                title: 'Review Discharge Readiness',
                instruction: 'Open the discharge checklist for Client C and review what is still pending.',
                hint: 'Click the discharge checklist button on the client card.',
                validation: (state) => state.checklistViewed
            }
        ],
        completion: {
            title: 'Practice Complete!',
            content: 'Great work—those moves transfer directly to the live system. Replay anytime from Settings.',
            achievements: ['Timeline Master', 'Bulk Update Pro', 'Discharge Ready']
        }
    },

    // Compliance timers cheat sheet
    compliance: {
        title: 'Understanding Compliance Timers',
        sections: [
            {
                category: 'Admission (within 48 hours)',
                items: [
                    { name: 'Needs Assessment', due: 'Within 48 hours of admission' },
                    { name: 'Health & Physical', due: 'Within 48 hours of admission' }
                ]
            },
            {
                category: 'Aftercare Planning',
                items: [
                    { name: 'Aftercare Planning Thread', due: 'Send between Day 14–16 (auto-escalates at Day 16)' },
                    { name: 'Options Document in Kipu', due: 'Within 7 days of the extension recommendation' }
                ]
            },
            {
                category: 'Discharge Window (within 48 hours of discharge)',
                items: [
                    { name: 'Discharge Packet', due: 'Send within 48 hours of discharge' },
                    { name: 'GAD-7', due: 'Complete within 48 hours of discharge' },
                    { name: 'PHQ-9', due: 'Complete within 48 hours of discharge' },
                    { name: 'Satisfaction Survey', due: 'Complete within 48 hours of discharge' }
                ]
            },
            {
                category: 'Confirmation-dependent',
                items: [
                    { name: 'Referral Closure Correspondence', due: 'Immediately after the family confirms a plan with the team and receiving program' }
                ]
            }
        ]
    },

    // Keyboard shortcuts
    shortcuts: {
        title: 'Keyboard Shortcuts',
        items: [
            { key: 'Ctrl+Shift+D', action: 'Dashboard diagnostics' },
            { key: 'Ctrl+S', action: 'Save current work' },
            { key: 'Ctrl+/', action: 'Quick search' },
            { key: 'Escape', action: 'Close any modal' },
            { key: 'Tab', action: 'Move through form fields' }
        ]
    },

    proTips: [
        'Clear the red zone every morning to stay ahead of compliance.',
        'Use bulk update right after family sessions to log everything quickly.',
        'The timeline shows you what’s due next—make it part of your daily huddle.',
        'Set discharge dates early so the system can warn you weeks in advance.',
        'The Chrome extraction engine works on any treatment program website with zero configuration.',
        'House weather helps leadership spot issues before they become critical.',
        'You can print the FFAS discharge checklist for charting and auditor packets.',
        'All processing happens locally—no PHI leaves your device.'
    ],

    help: {
        noClients: {
            title: 'No Clients Yet',
            content: "Click 'Add Client' to start documenting your first chart.",
            action: 'Add Your First Client'
        },
        emptyRedZone: {
            title: 'All Clear!',
            content: 'No urgent items at the moment. Enjoy the head start!',
            emoji: '🎉'
        },
        firstTimeUser: {
            title: 'New to CareConnect?',
            content: 'Take the five-minute tour to learn the essentials.',
            action: 'Start Tour'
        }
    }
};

if (typeof window !== 'undefined') {
    window.OnboardingContent = OnboardingContent;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingContent;
}



