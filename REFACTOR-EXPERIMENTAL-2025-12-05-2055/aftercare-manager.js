/**
 * @fileoverview Aftercare program options management
 * @module managers/AftercareManager
 * @status @canonical
 * 
 * PURPOSE:
 *   Tracks up to 7 aftercare program options per client. Manages the lifecycle
 *   of options from initial contact through admission confirmation or decline.
 *   Status values mirror the Google Sheets workflow used by clinical staff.
 * 
 * DEPENDENCIES:
 *   - window.dbManager (IndexedDBManager) - Persistence via clientAftercareOptions store
 * 
 * EXPORTS TO WINDOW:
 *   - window.AftercareManager - Class constructor
 *   - window.aftercareManager - Singleton instance
 * 
 * STATUS VALUES (from Google Sheets):
 *   - '--' (none)
 *   - 'Family Declined Option'
 *   - 'Family Contact Made'
 *   - 'Admi. Date Confirmed'
 *   - 'Program Decline'
 *   - 'Financial Constraints, no admin'
 *   - 'Parents took on ed consultant'
 *   - 'Parents declined ed con'
 *   - 'ED Con on case'
 * 
 * USED BY:
 *   - tracker-aftercare-cascade.js (aftercare workflow UI)
 *   - client-profile-manager.js (profile modal aftercare tab)
 */

class AftercareManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.storeName = 'clientAftercareOptions';
        
        // Aftercare option statuses - exact values from Google Sheets
        this.statusTypes = {
            NONE: '--',
            FAMILY_DECLINED: 'Family Declined Option',
            FAMILY_CONTACT: 'Family Contact Made',
            ADMISSION_CONFIRMED: 'Admi. Date Confirmed',
            PROGRAM_DECLINE: 'Program Decline',
            FINANCIAL_CONSTRAINTS: 'Financial Constraints, no admin',
            PARENTS_ED_CONSULTANT: 'Parents took on ed consultant',
            PARENTS_DECLINED_ED: 'Parents declined ed con',
            ED_CON_ON_CASE: 'ED Con on case'
        };
        
        this.maxOptions = 7; // Maximum 7 aftercare options per client (matching Google Sheets)
    }
    
    /**
     * Get all aftercare options for a client
     */
    async getClientAftercareOptions(clientId) {
        return await this.dbManager.getClientAftercareOptions(clientId);
    }
    
    /**
     * Add an aftercare option for a client
     */
    async addAftercareOption(clientId, optionData) {
        // Check if client already has max options
        const existingOptions = await this.getClientAftercareOptions(clientId);
        
        if (existingOptions.length >= this.maxOptions) {
            throw new Error(`Client already has maximum ${this.maxOptions} aftercare options`);
        }
        
        // Determine the next ordinal
        const nextOrdinal = existingOptions.length + 1;
        
        const option = {
            programId: optionData.programId || null,
            programName: optionData.programName || '',
            status: optionData.status || this.statusTypes.NONE,
            dateProvidedToFamily: optionData.dateProvidedToFamily || null,
            notes: optionData.notes || '',
            contactHistory: optionData.contactHistory || [],
            // Enhanced communication tracking
            lastContactDate: optionData.lastContactDate || null,
            contactMethod: optionData.contactMethod || null, // Phone/Email/Text
            contactedParty: optionData.contactedParty || null, // Family/Program
            followUpDate: optionData.followUpDate || null,
            responseReceived: optionData.responseReceived || false,
            responseDate: optionData.responseDate || null
        };
        
        const savedOption = await this.dbManager.updateAftercareOption(clientId, nextOrdinal, option);
        this.captureReferralCreated(clientId, savedOption, optionData);
        return savedOption;
    }
    
    /**
     * Update an aftercare option
     */
    async updateAftercareOption(clientId, ordinal, updates) {
        const existingOptions = await this.getClientAftercareOptions(clientId);
        const existingOption = existingOptions.find(o => o.ordinal === ordinal);
        
        if (!existingOption) {
            throw new Error(`Aftercare option ${ordinal} not found for client`);
        }
        
        const updatedOption = {
            ...existingOption,
            ...updates
        };
        
        const savedOption = await this.dbManager.updateAftercareOption(clientId, ordinal, updatedOption);
        if (updates.status && existingOption?.status !== updates.status) {
            this.captureReferralStatusChange(savedOption, updates.status, updates.notes);
        }
        return savedOption;
    }
    
    /**
     * Add contact history entry to an aftercare option
     */
    async addContactHistory(clientId, ordinal, contact) {
        const existingOptions = await this.getClientAftercareOptions(clientId);
        const option = existingOptions.find(o => o.ordinal === ordinal);
        
        if (!option) {
            throw new Error(`Aftercare option ${ordinal} not found for client`);
        }
        
        const contactEntry = {
            date: new Date().toISOString(),
            type: contact.type || 'outreach', // outreach, follow-up, response
            method: contact.method || 'Phone', // Phone, Email, Text
            contactedParty: contact.contactedParty || 'Family', // Family, Program, Both
            description: contact.description,
            contactedBy: contact.contactedBy || '',
            outcome: contact.outcome || '',
            nextAction: contact.nextAction || '',
            followUpDate: contact.followUpDate || null
        };
        
        const contactHistory = option.contactHistory || [];
        contactHistory.push(contactEntry);
        
        const updatedOption = await this.updateAftercareOption(clientId, ordinal, { contactHistory });
        this.captureProgramContact(updatedOption, contactEntry);
        return updatedOption;
    }
    
    /**
     * Update aftercare option status
     */
    async updateStatus(clientId, ordinal, status) {
        if (!Object.values(this.statusTypes).includes(status)) {
            throw new Error('Invalid status type');
        }
        
        return await this.updateAftercareOption(clientId, ordinal, { status });
    }
    
    /**
     * Link a program from the database to an aftercare option
     */
    async linkProgram(clientId, ordinal, programId, programName) {
        return await this.updateAftercareOption(clientId, ordinal, {
            programId,
            programName
        });
    }
    
    /**
     * Remove an aftercare option
     */
    async removeAftercareOption(clientId, ordinal) {
        const existingOptions = await this.getClientAftercareOptions(clientId);
        const optionIndex = existingOptions.findIndex(o => o.ordinal === ordinal);
        
        if (optionIndex === -1) {
            throw new Error(`Aftercare option ${ordinal} not found for client`);
        }
        
        // Remove the option
        await this.dbManager.delete(this.storeName, existingOptions[optionIndex].id);
        
        // Reorder remaining options
        const remainingOptions = existingOptions.filter((_, index) => index !== optionIndex);
        
        for (let i = 0; i < remainingOptions.length; i++) {
            if (remainingOptions[i].ordinal !== i + 1) {
                await this.dbManager.updateAftercareOption(clientId, remainingOptions[i].ordinal, {
                    ...remainingOptions[i],
                    ordinal: i + 1
                });
            }
        }
        
        return true;
    }

    normalizeStatusForAnalytics(status) {
        if (!status) return 'pending';
        const normalized = status.toLowerCase();
        if (normalized.includes('admi')) return 'admitted';
        if (normalized.includes('decline') || normalized.includes('no admin') || normalized.includes('financial')) {
            return 'declined';
        }
        if (normalized.includes('withdraw')) return 'withdrawn';
        return 'pending';
    }

    async captureReferralCreated(clientId, option, optionData = {}) {
        if (!window.analyticsHooks?.logReferral) return;
        try {
            let clientInitials = optionData.clientInitials || null;
            if (!clientInitials && window.clientManager?.getClient) {
                const clientRecord = await window.clientManager.getClient(clientId);
                clientInitials = clientRecord?.initials || null;
            }

            const payload = {
                clientId,
                clientInitials,
                programId: option.programId || option.id,
                programName: option.programName || `Aftercare Option ${option.ordinal}`,
                programType: optionData.programType || 'aftercare',
                programState: optionData.programState || null,
                referralDate: option.dateProvidedToFamily || new Date().toISOString().split('T')[0],
                referralMethod: optionData.contactMethod || 'aftercare_option',
                notes: option.notes || optionData.notes || '',
                estimatedLOS: optionData.estimatedLOS || null,
                estimatedDailyRate: optionData.estimatedDailyRate || null
            };

            window.analyticsHooks.logReferral(payload);
        } catch (error) {
            console.warn('[AftercareManager] Failed to capture referral analytics', error);
        }
    }

    captureReferralStatusChange(option, status, notes) {
        if (!window.analyticsHooks?.updateReferralStatus || !option?.id) return;
        try {
            const normalizedStatus = this.normalizeStatusForAnalytics(status);
            window.analyticsHooks.updateReferralStatus(option.id, normalizedStatus, {
                programName: option.programName,
                reason: status,
                notes: notes || ''
            });
        } catch (error) {
            console.warn('[AftercareManager] Failed to capture referral status change', error);
        }
    }

    captureProgramContact(option, contactEntry) {
        if (!window.analyticsHooks?.logProgramContact || !option) return;
        try {
            const contactDate = contactEntry.date ? contactEntry.date.split('T')[0] : null;
            window.analyticsHooks.logProgramContact(option.programId || option.id, {
                programName: option.programName,
                contactType: contactEntry.type || 'outreach',
                contactDate,
                contactPerson: contactEntry.contactedParty || null,
                notes: contactEntry.description || '',
                method: contactEntry.method || null
            });
        } catch (error) {
            console.warn('[AftercareManager] Failed to capture program contact analytics', error);
        }
    }
    
    /**
     * Get aftercare summary for display
     */
    getAftercareSummary(options) {
        const summary = {
            total: options.length,
            byStatus: {}
        };
        
        // Initialize status counts
        for (const status of Object.values(this.statusTypes)) {
            summary.byStatus[status] = 0;
        }
        
        // Count by status
        for (const option of options) {
            if (option.status && summary.byStatus[option.status] !== undefined) {
                summary.byStatus[option.status]++;
            }
        }
        
        // Create a display string
        const statusCounts = [];
        if (summary.byStatus.accepted > 0) {
            statusCounts.push(`${summary.byStatus.accepted} accepted`);
        }
        if (summary.byStatus.engaged > 0) {
            statusCounts.push(`${summary.byStatus.engaged} engaged`);
        }
        if (summary.byStatus.sent > 0) {
            statusCounts.push(`${summary.byStatus.sent} sent`);
        }
        if (summary.byStatus.pending > 0) {
            statusCounts.push(`${summary.byStatus.pending} pending`);
        }
        
        summary.displayString = statusCounts.length > 0 
            ? statusCounts.join(', ') 
            : `${summary.total} options`;
        
        return summary;
    }
    
    /**
     * Get status display properties
     */
    getStatusDisplay(status) {
        const displays = {
            [this.statusTypes.PENDING]: {
                label: 'Pending',
                color: '#6b7280',
                background: '#f3f4f6',
                icon: '⏸'
            },
            [this.statusTypes.SENT]: {
                label: 'Sent',
                color: '#1e40af',
                background: '#dbeafe',
                icon: '📤'
            },
            [this.statusTypes.ENGAGED]: {
                label: 'Engaged',
                color: '#92400e',
                background: '#fef3c7',
                icon: '💬'
            },
            [this.statusTypes.ACCEPTED]: {
                label: 'Accepted',
                color: '#065f46',
                background: '#d1fae5',
                icon: '✅'
            },
            [this.statusTypes.DECLINED]: {
                label: 'Declined',
                color: '#991b1b',
                background: '#fee2e2',
                icon: '❌'
            },
            [this.statusTypes.WAITLIST]: {
                label: 'Waitlist',
                color: '#7c3aed',
                background: '#ede9fe',
                icon: '⏳'
            },
            [this.statusTypes.CLOSED]: {
                label: 'Closed',
                color: '#374151',
                background: '#e5e7eb',
                icon: '🔒'
            },
            [this.statusTypes.UNKNOWN]: {
                label: 'Unknown',
                color: '#6b7280',
                background: '#f9fafb',
                icon: '❓'
            }
        };
        
        return displays[status] || displays[this.statusTypes.UNKNOWN];
    }
    
    /**
     * Create aftercare options from selected programs
     */
    async createOptionsFromPrograms(clientId, selectedPrograms, dateProvidedToFamily = null) {
        const options = [];
        const date = dateProvidedToFamily || new Date().toISOString().split('T')[0];
        
        // Take up to 6 programs
        const programsToAdd = selectedPrograms.slice(0, this.maxOptions);
        
        for (let i = 0; i < programsToAdd.length; i++) {
            const program = programsToAdd[i];
            
            const optionData = {
                programId: program.id,
                programName: program.name,
                status: this.statusTypes.PENDING,
                dateProvidedToFamily: date,
                notes: `Added from program: ${program.name}`,
                contactHistory: [{
                    date: new Date().toISOString(),
                    type: 'note',
                    description: 'Program added to aftercare options',
                    outcome: 'Pending family review'
                }]
            };
            
            const option = await this.addAftercareOption(clientId, optionData);
            options.push(option);
        }
        
        return options;
    }
    
    /**
     * Get statistics for a house
     */
    async getHouseAftercareStats(clients) {
        const stats = {
            totalOptions: 0,
            avgOptionsPerClient: 0,
            statusBreakdown: {},
            acceptanceRate: 0,
            engagementRate: 0
        };
        
        // Initialize status counts
        for (const status of Object.values(this.statusTypes)) {
            stats.statusBreakdown[status] = 0;
        }
        
        let clientsWithOptions = 0;
        
        for (const client of clients) {
            const options = await this.getClientAftercareOptions(client.id);
            
            if (options.length > 0) {
                clientsWithOptions++;
                stats.totalOptions += options.length;
                
                for (const option of options) {
                    if (option.status && stats.statusBreakdown[option.status] !== undefined) {
                        stats.statusBreakdown[option.status]++;
                    }
                }
            }
        }
        
        // Calculate averages and rates
        if (clientsWithOptions > 0) {
            stats.avgOptionsPerClient = Math.round((stats.totalOptions / clientsWithOptions) * 10) / 10;
        }
        
        if (stats.totalOptions > 0) {
            stats.acceptanceRate = Math.round(
                (stats.statusBreakdown[this.statusTypes.ACCEPTED] / stats.totalOptions) * 100
            );
            
            const engaged = stats.statusBreakdown[this.statusTypes.ENGAGED] + 
                          stats.statusBreakdown[this.statusTypes.ACCEPTED];
            stats.engagementRate = Math.round((engaged / stats.totalOptions) * 100);
        }
        
        return stats;
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.AftercareManager = AftercareManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AftercareManager;
}
