/**
 * Demo Clients Generator
 * 
 * Creates realistic training data for onboarding new users.
 * All demo data is tagged with isDemo: true for easy identification and cleanup.
 * 
 * GUARDRAILS:
 * - All demo clients have isDemo: true flag
 * - All demo clients assigned to TRAINING_HOUSE
 * - Demo clients are excluded from exports and reports
 * - UI shows clear "Training Client" badge
 * - Easy cleanup via clearDemoData()
 */

const DemoClients = (function() {
    'use strict';

    const TRAINING_HOUSE = 'TRAINING_HOUSE';
    const DEMO_PREFIX = 'demo-';

    /**
     * Helper to calculate dates relative to today
     */
    function daysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString();
    }

    function daysFromNow(days) {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toISOString();
    }

    /**
     * Demo client templates
     * Each represents a different journey stage and scenario
     */
    const DEMO_CLIENT_TEMPLATES = [
        // Week 1 clients
        {
            firstName: 'Mason',
            lastName: 'T.',
            journeyStage: 'week1',
            daysInCare: 5,
            projectedStayDays: 60,
            scenario: 'New admission, needs initial assessment',
            tasks: [
                { type: 'rr', status: 'due_this_week', label: 'Initial RR Review' },
                { type: 'parent_call', status: 'upcoming', label: 'Welcome call with parents' }
            ]
        },
        {
            firstName: 'Sophia',
            lastName: 'R.',
            journeyStage: 'week1',
            daysInCare: 3,
            projectedStayDays: 45,
            scenario: 'Recent intake, family engaged',
            tasks: [
                { type: 'intake_docs', status: 'in_progress', label: 'Complete intake paperwork' }
            ]
        },
        
        // Day 14-16 clients
        {
            firstName: 'Ethan',
            lastName: 'K.',
            journeyStage: 'day14',
            daysInCare: 15,
            projectedStayDays: 55,
            scenario: 'Day 14 milestone approaching',
            tasks: [
                { type: 'milestone', status: 'due_today', label: 'Day 14 check-in' },
                { type: 'parent_call', status: 'overdue', label: 'Parent session - overdue' }
            ]
        },
        {
            firstName: 'Olivia',
            lastName: 'M.',
            journeyStage: 'day14',
            daysInCare: 14,
            projectedStayDays: 60,
            scenario: 'Making good progress',
            tasks: [
                { type: 'aftercare', status: 'not_started', label: 'Begin aftercare planning' }
            ]
        },
        
        // Day 30 clients
        {
            firstName: 'Liam',
            lastName: 'W.',
            journeyStage: 'day30',
            daysInCare: 32,
            projectedStayDays: 50,
            scenario: 'Aftercare planning in progress',
            tasks: [
                { type: 'aftercare', status: 'in_progress', label: 'Finalize aftercare options' },
                { type: 'rr', status: 'due_this_week', label: 'Monthly RR update' }
            ]
        },
        {
            firstName: 'Emma',
            lastName: 'J.',
            journeyStage: 'day30',
            daysInCare: 28,
            projectedStayDays: 45,
            scenario: 'Family session needed',
            tasks: [
                { type: 'parent_call', status: 'due_today', label: 'Family session' },
                { type: 'milestone', status: 'upcoming', label: 'Day 30 review' }
            ]
        },
        
        // 45+ days clients
        {
            firstName: 'Noah',
            lastName: 'B.',
            journeyStage: 'day45plus',
            daysInCare: 48,
            projectedStayDays: 55,
            scenario: 'Discharge planning active',
            tasks: [
                { type: 'discharge', status: 'in_progress', label: 'Discharge planning meeting' },
                { type: 'aftercare', status: 'complete', label: 'Aftercare doc ready' }
            ]
        },
        {
            firstName: 'Ava',
            lastName: 'S.',
            journeyStage: 'day45plus',
            daysInCare: 52,
            projectedStayDays: 60,
            scenario: 'Extended stay, complex case',
            tasks: [
                { type: 'rr', status: 'overdue', label: 'RR update - overdue' },
                { type: 'parent_call', status: 'due_this_week', label: 'Weekly parent check-in' }
            ]
        },
        
        // Discharge pipeline clients
        {
            firstName: 'Jackson',
            lastName: 'D.',
            journeyStage: 'discharge',
            daysInCare: 55,
            projectedStayDays: 58,
            scenario: 'Discharging in 3 days',
            tasks: [
                { type: 'discharge', status: 'urgent', label: 'Final discharge checklist' },
                { type: 'aftercare', status: 'complete', label: 'Aftercare packet sent' }
            ]
        },
        {
            firstName: 'Isabella',
            lastName: 'C.',
            journeyStage: 'discharge',
            daysInCare: 43,
            projectedStayDays: 48,
            scenario: 'Discharging in 5 days',
            tasks: [
                { type: 'discharge', status: 'in_progress', label: 'Coordinate with receiving program' },
                { type: 'parent_call', status: 'due_today', label: 'Discharge planning call' }
            ]
        },
        
        // Recently discharged (for tracking)
        {
            firstName: 'Lucas',
            lastName: 'H.',
            journeyStage: 'discharged',
            daysInCare: 52,
            dischargedDaysAgo: 3,
            scenario: 'Recently discharged, follow-up needed',
            tasks: [
                { type: 'followup', status: 'due_this_week', label: '72-hour follow-up call' }
            ]
        },
        {
            firstName: 'Mia',
            lastName: 'P.',
            journeyStage: 'discharged',
            daysInCare: 48,
            dischargedDaysAgo: 7,
            scenario: 'Discharged last week',
            tasks: [
                { type: 'followup', status: 'complete', label: 'Follow-up completed' }
            ]
        }
    ];

    /**
     * Generate a unique demo client ID
     */
    function generateDemoId() {
        return DEMO_PREFIX + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Generate full demo client object from template
     */
    function generateClient(template, coachId) {
        const admitDate = daysAgo(template.daysInCare);
        const projectedDischarge = template.dischargedDaysAgo 
            ? daysAgo(template.dischargedDaysAgo)
            : daysFromNow(template.projectedStayDays - template.daysInCare);
        
        return {
            id: generateDemoId(),
            
            // CRITICAL: Demo flag for guardrails
            isDemo: true,
            
            // Basic info
            firstName: template.firstName,
            lastName: template.lastName,
            initials: template.firstName[0] + template.lastName[0],
            
            // Assignment
            house: TRAINING_HOUSE,
            houseId: TRAINING_HOUSE,
            coach: coachId || 'demo-coach',
            coachId: coachId || 'demo-coach',
            
            // Journey
            journeyStage: template.journeyStage,
            admissionDate: admitDate,
            admitDate: admitDate,
            projectedDischarge: projectedDischarge,
            dischargeDate: template.dischargedDaysAgo ? daysAgo(template.dischargedDaysAgo) : null,
            
            // Scenario context
            scenario: template.scenario,
            
            // Tasks
            tasks: template.tasks.map(task => ({
                ...task,
                id: generateDemoId(),
                clientId: null, // Will be set after client creation
                dueDate: task.status === 'due_today' ? new Date().toISOString() :
                         task.status === 'overdue' ? daysAgo(2) :
                         task.status === 'due_this_week' ? daysFromNow(3) :
                         daysFromNow(7)
            })),
            
            // Aftercare plan
            aftercarePlan: {
                status: template.journeyStage === 'discharge' ? 'complete' : 
                        template.daysInCare > 30 ? 'in_progress' : 'not_started',
                primaryPrograms: [],
                additionalPrograms: [],
                notes: ''
            },
            
            // Milestones (simplified)
            milestones: {
                day7: template.daysInCare >= 7,
                day14: template.daysInCare >= 14,
                day30: template.daysInCare >= 30,
                day45: template.daysInCare >= 45
            },
            
            // Meta
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Populate demo data for a new user
     */
    async function populate() {
        console.log('[DemoClients] Populating demo data...');
        
        // Get current user ID
        let coachId = 'demo-coach';
        try {
            if (window.authManager?.getCurrentUser) {
                const user = window.authManager.getCurrentUser();
                coachId = user?.id || user?.email || 'demo-coach';
            }
        } catch (e) {
            console.warn('[DemoClients] Could not get user ID:', e);
        }
        
        // Generate clients
        const clients = DEMO_CLIENT_TEMPLATES.map(template => 
            generateClient(template, coachId)
        );
        
        // Add clients to the system
        if (window.clientManager?.addClient) {
            for (const client of clients) {
                try {
                    await window.clientManager.addClient(client);
                    console.log('[DemoClients] Added:', client.initials);
                } catch (e) {
                    console.warn('[DemoClients] Failed to add client:', client.initials, e);
                }
            }
        } else {
            console.warn('[DemoClients] clientManager not available, storing in localStorage');
            // Fallback: store in localStorage
            const existingClients = JSON.parse(localStorage.getItem('demo_clients') || '[]');
            localStorage.setItem('demo_clients', JSON.stringify([...existingClients, ...clients]));
        }
        
        console.log('[DemoClients] Populated', clients.length, 'demo clients');
        
        return clients;
    }

    /**
     * Clear all demo data
     */
    async function clear() {
        console.log('[DemoClients] Clearing demo data...');
        
        let clearedCount = 0;
        
        if (window.clientManager?.getAllClients && window.clientManager?.deleteClient) {
            try {
                const allClients = await window.clientManager.getAllClients();
                const demoClients = allClients.filter(c => c.isDemo === true);
                
                for (const client of demoClients) {
                    await window.clientManager.deleteClient(client.id);
                    clearedCount++;
                }
            } catch (e) {
                console.error('[DemoClients] Error clearing from clientManager:', e);
            }
        }
        
        // Also clear localStorage fallback
        localStorage.removeItem('demo_clients');
        
        console.log('[DemoClients] Cleared', clearedCount, 'demo clients');
        
        return clearedCount;
    }

    /**
     * Check if a client is a demo client
     */
    function isDemo(client) {
        if (!client) return false;
        return client.isDemo === true || 
               (client.id && client.id.startsWith(DEMO_PREFIX)) ||
               client.house === TRAINING_HOUSE;
    }

    /**
     * Get all demo clients
     */
    async function getAll() {
        if (window.clientManager?.getAllClients) {
            const allClients = await window.clientManager.getAllClients();
            return allClients.filter(c => isDemo(c));
        }
        
        // Fallback to localStorage
        return JSON.parse(localStorage.getItem('demo_clients') || '[]');
    }

    /**
     * Filter out demo clients from a list
     * Use this in reports and exports
     */
    function filterOutDemo(clients) {
        if (!Array.isArray(clients)) return clients;
        return clients.filter(c => !isDemo(c));
    }

    /**
     * Check if export should be blocked for a client
     */
    function shouldBlockExport(client) {
        if (isDemo(client)) {
            console.warn('[DemoClients] Blocked export of demo client:', client.initials);
            return true;
        }
        return false;
    }

    /**
     * Get badge HTML for demo clients
     */
    function getDemoBadge() {
        return `<div class="demo-badge" title="This is training data, not a real client">
            <span class="demo-badge__icon">🎓</span>
            <span class="demo-badge__text">Training Client</span>
        </div>`;
    }

    // Public API
    return {
        TRAINING_HOUSE,
        DEMO_PREFIX,
        populate,
        clear,
        isDemo,
        getAll,
        filterOutDemo,
        shouldBlockExport,
        getDemoBadge
    };
})();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.DemoClients = DemoClients;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DemoClients;
}

