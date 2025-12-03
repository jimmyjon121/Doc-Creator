/**
 * Checklist Configuration
 * 
 * Defines the Quick-Start checklist items, grouped by workflow category.
 * Each item maps to an event that triggers auto-completion.
 */

const ChecklistConfig = (function() {
    'use strict';

    const ITEMS = [
        {
            group: 'Morning Routine',
            groupIcon: '☀️',
            items: [
                {
                    id: 'journeyStageClicked',
                    label: 'Click a Client Journey stage',
                    hint: 'Click any stage like Week 1 or Day 30 to filter your Flight Plan',
                    targetTourId: 'journey-radar',
                    listenFor: 'cc:journey:stageClicked'
                },
                {
                    id: 'flightPlanTaskOpened',
                    label: 'Open a task from your Flight Plan',
                    hint: 'Click any task row to see client details',
                    targetTourId: 'flight-plan',
                    listenFor: 'cc:flightPlan:taskOpened'
                },
                {
                    id: 'taskCreated',
                    label: 'Create a new task',
                    hint: 'Open a client tracker and click Generate Tasks to create tasks from gaps',
                    targetTourId: 'flight-plan',
                    listenFor: 'cc:flightPlan:taskCreated'
                }
            ]
        },
        {
            group: 'Program Research',
            groupIcon: '🔍',
            items: [
                {
                    id: 'programSearchRun',
                    label: 'Run a filtered program search',
                    hint: 'Go to Programs & Docs and apply any filter',
                    listenFor: 'cc:programs:filterApplied'
                },
                {
                    id: 'programProfileOpened',
                    label: "Open a program's full profile",
                    hint: 'Click View Details or the arrow on any program card',
                    listenFor: 'cc:programs:profileOpened'
                },
                {
                    id: 'mapMarkerClicked',
                    label: 'Click a program marker on the map',
                    hint: 'Switch to Map view and click any pin',
                    listenFor: 'cc:map:markerClicked'
                }
            ]
        },
        {
            group: 'Aftercare Planning',
            groupIcon: '📋',
            items: [
                {
                    id: 'programAddedToDoc',
                    label: 'Add a program to an aftercare draft',
                    hint: 'Click the green + Add button on any program card',
                    listenFor: 'cc:doc:programAdded'
                },
                {
                    id: 'docPreviewed',
                    label: 'Preview an aftercare document',
                    hint: 'Add programs to a document then click Preview to see the formatted output',
                    listenFor: 'cc:doc:previewed'
                }
            ]
        },
        {
            group: 'Data Hygiene',
            groupIcon: '✅',
            items: [
                {
                    id: 'gapsPanelOpened',
                    label: 'Review an item in the Gaps panel',
                    hint: 'Click any gap type to see affected clients',
                    targetTourId: 'gaps',
                    listenFor: 'cc:gaps:itemClicked'
                },
                {
                    id: 'houseComplianceClicked',
                    label: 'Check a House Compliance card',
                    hint: 'Click any house to see its metrics',
                    targetTourId: 'house-health',
                    listenFor: 'cc:house:clicked'
                }
            ]
        }
    ];

    /**
     * Get flat list of all items
     */
    function getAllItems() {
        const allItems = [];
        ITEMS.forEach(group => {
            group.items.forEach(item => {
                allItems.push({
                    ...item,
                    group: group.group,
                    groupIcon: group.groupIcon
                });
            });
        });
        return allItems;
    }

    /**
     * Get item by ID
     */
    function getItemById(id) {
        for (const group of ITEMS) {
            const item = group.items.find(i => i.id === id);
            if (item) {
                return { ...item, group: group.group };
            }
        }
        return null;
    }

    /**
     * Get total item count
     */
    function getTotalCount() {
        return ITEMS.reduce((sum, group) => sum + group.items.length, 0);
    }

    /**
     * Get all event names to listen for
     */
    function getAllEventNames() {
        return getAllItems().map(item => item.listenFor);
    }

    return {
        ITEMS,
        getAllItems,
        getItemById,
        getTotalCount,
        getAllEventNames
    };
})();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.ChecklistConfig = ChecklistConfig;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChecklistConfig;
}

