/**
 * Milestones Manager for CareConnect Pro CM Tracker
 * Manages client milestone tracking
 */

class MilestonesManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.storeName = 'clientMilestones';
        
        // Define all milestone types
        this.milestoneTypes = {
            NEEDS_ASSESSMENT: {
                id: 'needs_assessment',
                name: 'Needs Assessment',
                displayName: 'Needs Assessment',
                description: 'Initial needs assessment completed',
                icon: '📋',
                daysDue: null // Due immediately
            },
            HEALTH_PHYSICAL: {
                id: 'health_physical',
                name: 'Health & Physical',
                displayName: 'Health & Physical',
                description: 'Health and physical assessment completed',
                icon: '🏥',
                daysDue: 7 // Due within 7 days
            },
            AFTERCARE_THREAD: {
                id: 'aftercare_thread',
                name: 'Aftercare Thread Sent',
                displayName: 'Aftercare Thread Sent',
                description: 'Aftercare planning thread sent (14-16 days in care)',
                icon: '📧',
                daysDue: 14 // Due at day 14
            },
            OPTIONS_DOC: {
                id: 'options_doc',
                name: 'Options Doc Uploaded',
                displayName: 'Options Doc',
                description: 'Options document uploaded to Kipu',
                icon: '📄',
                daysDue: null
            },
            DISCHARGE_PACKET: {
                id: 'discharge_packet',
                name: 'Discharge Packet Uploaded',
                displayName: 'Discharge Packet',
                description: 'Discharge packet uploaded to Kipu',
                icon: '📦',
                daysDue: null
            },
            REFERRAL_CLOSURE: {
                id: 'referral_closure',
                name: 'Referral Closure Contact',
                displayName: 'Referral Closure',
                description: 'Referral closure correspondence (text or phone call)',
                icon: '📞',
                daysDue: null
            },
            DISCHARGE_SUMMARY: {
                id: 'discharge_summary',
                name: 'Discharge Summary',
                displayName: 'Discharge Summary',
                description: 'Discharge summary completed',
                icon: '📝',
                daysDue: null
            },
            FINAL_PLANNING_NOTE: {
                id: 'final_planning_note',
                name: 'Final Planning Note',
                displayName: 'Final Planning Note',
                description: 'Final discharge planning note',
                icon: '📋',
                daysDue: null
            },
            DISCHARGE_ASAM: {
                id: 'discharge_asam',
                name: 'Discharge ASAM',
                displayName: 'Discharge ASAM',
                description: 'Discharge ASAM assessment',
                icon: '🏁',
                daysDue: null
            },
            // Additional assessments
            GAD_ASSESSMENT: {
                id: 'gad_assessment',
                name: 'GAD Assessment',
                displayName: 'GAD Assessment',
                description: 'Generalized Anxiety Disorder assessment',
                icon: '📊',
                daysDue: null
            },
            PHQ_ASSESSMENT: {
                id: 'phq_assessment',
                name: 'PHQ Assessment',
                displayName: 'PHQ Assessment',
                description: 'Patient Health Questionnaire assessment',
                icon: '📈',
                daysDue: null
            },
            SATISFACTION_SURVEY: {
                id: 'satisfaction_survey',
                name: 'Satisfaction Survey',
                displayName: 'Satisfaction Survey',
                description: 'Client satisfaction survey',
                icon: '⭐',
                daysDue: null
            }
        };
        
        // Status types
        this.statusTypes = {
            NOT_STARTED: 'not_started',
            IN_PROGRESS: 'in_progress',
            COMPLETE: 'complete',
            OVERDUE: 'overdue'
        };
    }
    
    /**
     * Initialize method for API consistency
     * MilestonesManager doesn't need initialization - this method exists for consistency
     */
    async initialize() {
        // MilestonesManager doesn't need initialization
        // This method exists for API consistency with other managers
        return true;
    }
    
    /**
     * Initialize milestones for a new client
     */
    async initializeClientMilestones(clientId) {
        const milestones = [];
        
        for (const [key, milestone] of Object.entries(this.milestoneTypes)) {
            const newMilestone = {
                id: `milestone_${clientId}_${milestone.id}_${Date.now()}`,
                clientId,
                milestone: milestone.id,
                status: this.statusTypes.NOT_STARTED,
                completedAt: null,
                completedDate: null, // Full date when completed
                completedBy: null, // Coach initials who completed it
                notes: '',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                // For referral closure, track communication method
                communicationMethod: milestone.id === 'referral_closure' ? null : undefined
            };
            
            milestones.push(newMilestone);
        }
        
        // Save all milestones
        for (const milestone of milestones) {
            await this.dbManager.put(this.storeName, milestone);
        }
        
        return milestones;
    }
    
    /**
     * Get all milestones for a client
     */
    async getClientMilestones(clientId) {
        return await this.dbManager.getClientMilestones(clientId);
    }
    
    /**
     * Update milestone status
     */
    async updateMilestoneStatus(clientId, milestoneId, status, notes = '', completedBy = null, communicationMethod = null) {
        const completedAt = status === this.statusTypes.COMPLETE ? new Date().toISOString() : null;
        const completedDate = status === this.statusTypes.COMPLETE ? new Date().toISOString().split('T')[0] : null;
        
        return await this.dbManager.updateMilestone(
            clientId,
            milestoneId,
            status,
            completedAt,
            notes,
            completedDate,
            completedBy,
            communicationMethod
        );
    }
    
    /**
     * Quick toggle milestone completion
     */
    async toggleMilestone(clientId, milestoneId) {
        const milestones = await this.getClientMilestones(clientId);
        const milestone = milestones.find(m => m.milestone === milestoneId);
        
        if (!milestone) {
            throw new Error('Milestone not found');
        }
        
        const newStatus = milestone.status === this.statusTypes.COMPLETE 
            ? this.statusTypes.NOT_STARTED 
            : this.statusTypes.COMPLETE;
        
        return await this.updateMilestoneStatus(clientId, milestoneId, newStatus);
    }
    
    /**
     * Check for overdue milestones
     */
    async checkOverdueMilestones(clientId, admissionDate) {
        if (!admissionDate) return [];
        
        const milestones = await this.getClientMilestones(clientId);
        const admission = new Date(admissionDate);
        const today = new Date();
        const daysInCare = Math.floor((today - admission) / (1000 * 60 * 60 * 24));
        
        const overdue = [];
        
        for (const milestone of milestones) {
            const milestoneType = Object.values(this.milestoneTypes).find(
                m => m.id === milestone.milestone
            );
            
            if (milestoneType && milestoneType.daysDue) {
                if (daysInCare > milestoneType.daysDue && 
                    milestone.status !== this.statusTypes.COMPLETE) {
                    
                    // Mark as overdue
                    await this.updateMilestoneStatus(
                        clientId,
                        milestone.milestone,
                        this.statusTypes.OVERDUE,
                        milestone.notes
                    );
                    
                    overdue.push({
                        ...milestone,
                        daysOverdue: daysInCare - milestoneType.daysDue,
                        milestoneInfo: milestoneType
                    });
                }
            }
        }
        
        return overdue;
    }
    
    /**
     * Get milestone completion percentage for a client
     */
    async getCompletionPercentage(clientId) {
        const milestones = await this.getClientMilestones(clientId);
        
        if (milestones.length === 0) return 0;
        
        const completed = milestones.filter(
            m => m.status === this.statusTypes.COMPLETE
        ).length;
        
        return Math.round((completed / milestones.length) * 100);
    }
    
    /**
     * Get milestone display status
     */
    getMilestoneDisplayStatus(milestone, daysInCare) {
        const milestoneType = Object.values(this.milestoneTypes).find(
            m => m.id === milestone.milestone
        );
        
        if (milestone.status === this.statusTypes.COMPLETE) {
            return {
                icon: '✅',
                class: 'complete',
                tooltip: `Completed on ${new Date(milestone.completedAt).toLocaleDateString()}`
            };
        }
        
        if (milestoneType && milestoneType.daysDue && daysInCare > milestoneType.daysDue) {
            return {
                icon: '⚠️',
                class: 'overdue',
                tooltip: `Overdue by ${daysInCare - milestoneType.daysDue} days`
            };
        }
        
        if (milestone.status === this.statusTypes.IN_PROGRESS) {
            return {
                icon: '⏳',
                class: 'in-progress',
                tooltip: 'In Progress'
            };
        }
        
        return {
            icon: '⏸',
            class: 'pending',
            tooltip: 'Not Started'
        };
    }
    
    /**
     * Get summary statistics for a house
     */
    async getHouseMilestoneStats(houseId, clients) {
        const stats = {
            totalMilestones: 0,
            completed: 0,
            inProgress: 0,
            overdue: 0,
            notStarted: 0,
            byMilestone: {}
        };
        
        // Initialize milestone counts
        for (const type of Object.values(this.milestoneTypes)) {
            stats.byMilestone[type.id] = {
                name: type.displayName,
                completed: 0,
                total: 0,
                percentage: 0
            };
        }
        
        for (const client of clients) {
            const milestones = await this.getClientMilestones(client.id);
            
            for (const milestone of milestones) {
                stats.totalMilestones++;
                stats.byMilestone[milestone.milestone].total++;
                
                switch (milestone.status) {
                    case this.statusTypes.COMPLETE:
                        stats.completed++;
                        stats.byMilestone[milestone.milestone].completed++;
                        break;
                    case this.statusTypes.IN_PROGRESS:
                        stats.inProgress++;
                        break;
                    case this.statusTypes.OVERDUE:
                        stats.overdue++;
                        break;
                    default:
                        stats.notStarted++;
                        break;
                }
            }
        }
        
        // Calculate percentages
        for (const milestoneId in stats.byMilestone) {
            const m = stats.byMilestone[milestoneId];
            m.percentage = m.total > 0 ? Math.round((m.completed / m.total) * 100) : 0;
        }
        
        stats.completionPercentage = stats.totalMilestones > 0 
            ? Math.round((stats.completed / stats.totalMilestones) * 100) 
            : 0;
        
        return stats;
    }
    
    /**
     * Auto-create aftercare thread task at day 14
     */
    async checkAftercareThreadReminder(client) {
        if (!client.admissionDate) return null;
        
        const admission = new Date(client.admissionDate);
        const today = new Date();
        const daysInCare = Math.floor((today - admission) / (1000 * 60 * 60 * 24));
        
        if (daysInCare === 14) {
            const milestones = await this.getClientMilestones(client.id);
            const aftercareThread = milestones.find(
                m => m.milestone === this.milestoneTypes.AFTERCARE_THREAD.id
            );
            
            if (aftercareThread && aftercareThread.status === this.statusTypes.NOT_STARTED) {
                // Update to in progress
                await this.updateMilestoneStatus(
                    client.id,
                    this.milestoneTypes.AFTERCARE_THREAD.id,
                    this.statusTypes.IN_PROGRESS,
                    'Auto-reminder: Day 14 - Time to send aftercare thread'
                );
                
                return {
                    type: 'reminder',
                    message: `Aftercare thread due for ${client.initials} (Day 14)`,
                    client
                };
            }
        }
        
        if (daysInCare === 16) {
            const milestones = await this.getClientMilestones(client.id);
            const aftercareThread = milestones.find(
                m => m.milestone === this.milestoneTypes.AFTERCARE_THREAD.id
            );
            
            if (aftercareThread && aftercareThread.status !== this.statusTypes.COMPLETE) {
                // Escalate to overdue
                await this.updateMilestoneStatus(
                    client.id,
                    this.milestoneTypes.AFTERCARE_THREAD.id,
                    this.statusTypes.OVERDUE,
                    'ESCALATION: Day 16 - Aftercare thread overdue!'
                );
                
                return {
                    type: 'escalation',
                    message: `URGENT: Aftercare thread overdue for ${client.initials} (Day 16)`,
                    client,
                    notifyRoles: ['caseManager', 'supervisor']
                };
            }
        }
        
        return null;
    }
    
    /**
     * Get milestone display status for UI
     */
    getMilestoneDisplayStatus(milestone, daysInCare) {
        const priority = this.getPriorityIndicator(milestone, daysInCare);
        
        // Map priority to CSS class
        let cssClass = 'pending';
        switch (priority.color) {
            case 'green':
                cssClass = 'complete';
                break;
            case 'red':
                cssClass = 'overdue';
                break;
            case 'orange':
                cssClass = 'due-today';
                break;
            case 'yellow':
                cssClass = 'due-soon';
                break;
            case 'blue':
                cssClass = 'in-progress';
                break;
            case 'gray':
            default:
                cssClass = 'pending';
                break;
        }
        
        return {
            icon: priority.icon,
            class: cssClass,
            tooltip: priority.label
        };
    }
    
    /**
     * Get priority indicator for a milestone based on status and days in care
     */
    getPriorityIndicator(milestone, daysInCare) {
        const milestoneType = Object.values(this.milestoneTypes).find(
            m => m.id === milestone.milestone
        );
        
        if (!milestoneType) {
            return { icon: '⏸', color: 'gray', label: 'Unknown' };
        }
        
        // If completed
        if (milestone.status === this.statusTypes.COMPLETE) {
            // Check if recently completed (within last 24 hours)
            if (milestone.completedAt) {
                const completedDate = new Date(milestone.completedAt);
                const daysSinceCompleted = Math.floor((new Date() - completedDate) / (1000 * 60 * 60 * 24));
                if (daysSinceCompleted <= 1) {
                    return { icon: '✨', color: 'green', label: 'Just Completed' };
                }
            }
            return { icon: '✓', color: 'green', label: 'Complete' };
        }
        
        // If milestone has a due date
        if (milestoneType.daysDue !== null) {
            const daysOverdue = daysInCare - milestoneType.daysDue;
            
            if (daysOverdue > 0) {
                return { icon: '🔥', color: 'red', label: `Overdue by ${daysOverdue} days` };
            } else if (daysOverdue === 0) {
                return { icon: '⚠️', color: 'orange', label: 'Due Today' };
            } else if (daysOverdue >= -2) {
                return { icon: '📌', color: 'yellow', label: `Due in ${Math.abs(daysOverdue)} days` };
            }
        }
        
        // Not due yet or no due date
        if (milestone.status === this.statusTypes.IN_PROGRESS) {
            return { icon: '🔄', color: 'blue', label: 'In Progress' };
        }
        
        return { icon: '⏸', color: 'gray', label: 'Not Started' };
    }
    
    /**
     * Get discharge readiness checklist
     */
    async getDischargeReadiness(clientId) {
        const milestones = await this.getClientMilestones(clientId);
        const readinessItems = [];
        let overallReady = true;
        
        // Define required vs optional milestones for discharge
        const requiredForDischarge = [
            'needs_assessment',
            'health_physical', 
            'aftercare_thread',
            'options_doc',
            'discharge_packet',
            'referral_closure',
            'discharge_summary',
            'discharge_asam'
        ];
        
        const optionalForDischarge = [
            'final_planning_note',
            'gad_assessment',
            'phq_assessment',
            'satisfaction_survey'
        ];
        
        // Check required items
        for (const milestoneId of requiredForDischarge) {
            const milestone = milestones.find(m => m.milestone === milestoneId);
            const milestoneType = Object.values(this.milestoneTypes).find(m => m.id === milestoneId);
            
            if (milestone && milestoneType) {
                const isComplete = milestone.status === this.statusTypes.COMPLETE;
                if (!isComplete) overallReady = false;
                
                readinessItems.push({
                    id: milestoneId,
                    name: milestoneType.displayName,
                    icon: milestoneType.icon,
                    status: milestone.status,
                    isComplete,
                    isRequired: true,
                    completedAt: milestone.completedAt,
                    completedBy: milestone.completedBy
                });
            }
        }
        
        // Check optional items
        for (const milestoneId of optionalForDischarge) {
            const milestone = milestones.find(m => m.milestone === milestoneId);
            const milestoneType = Object.values(this.milestoneTypes).find(m => m.id === milestoneId);
            
            if (milestone && milestoneType) {
                readinessItems.push({
                    id: milestoneId,
                    name: milestoneType.displayName,
                    icon: milestoneType.icon,
                    status: milestone.status,
                    isComplete: milestone.status === this.statusTypes.COMPLETE,
                    isRequired: false,
                    completedAt: milestone.completedAt,
                    completedBy: milestone.completedBy
                });
            }
        }
        
        // Calculate completion percentage
        const required = readinessItems.filter(item => item.isRequired);
        const requiredComplete = required.filter(item => item.isComplete);
        const completionPercentage = Math.round((requiredComplete.length / required.length) * 100);
        
        return {
            items: readinessItems,
            overallReady,
            completionPercentage,
            requiredCount: required.length,
            requiredCompleteCount: requiredComplete.length,
            message: overallReady 
                ? 'Client is ready for discharge' 
                : `${required.length - requiredComplete.length} required items remaining`
        };
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.MilestonesManager = MilestonesManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MilestonesManager;
}
