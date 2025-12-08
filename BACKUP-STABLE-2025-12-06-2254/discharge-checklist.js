/**
 * @fileoverview FFAS discharge checklist management
 * @module managers/DischargeChecklistManager
 * @status @canonical
 * 
 * PURPOSE:
 *   Implements the Family First Adolescent Services discharge checklist workflow.
 *   Tracks required documents and tasks for safe client discharge, including
 *   aftercare plan, medication schedule, clinical assignments, medical records,
 *   and closure communications.
 * 
 * DEPENDENCIES:
 *   - window.indexedDBManager - Note: Uses different reference than other managers
 * 
 * EXPORTS TO WINDOW:
 *   - window.dischargeChecklistManager - Singleton instance
 * 
 * CHECKLIST CATEGORIES:
 *   - beforeDischarge.packet: Physical documents for discharge packet
 *   - beforeDischarge.clinical: Clinical requirements
 *   - dayOfDischarge: Same-day completion items
 *   - postDischarge: Follow-up requirements (7-day check-in, 30-day survey)
 * 
 * INTEGRATION:
 *   Checklist items can map to TaskSchema fields via trackerField property.
 * 
 * USED BY:
 *   - client-profile-manager.js (discharge checklist tab)
 *   - CareConnect-Pro.html (discharge workflow UI)
 */

class DischargeChecklistManager {
    constructor() {
        this.dbManager = window.indexedDBManager;
        this.storeName = 'discharge-checklists';
        
        // Define FFAS discharge checklist items
        this.checklistItems = {
            // Before Client Discharges - Packet Items
            beforeDischarge: [
                {
                    id: 'aftercare_plan',
                    label: 'Aftercare Plan (from CC/CM)',
                    category: 'packet',
                    required: true,
                    trackerField: null
                },
                {
                    id: 'medication_schedule',
                    label: 'Medication Schedule (MOR summary, ≤2 pages)',
                    category: 'packet',
                    required: true,
                    trackerField: null
                },
                {
                    id: 'clinical_assignments',
                    label: 'Client clinical assignments (from PT)',
                    category: 'packet',
                    required: true,
                    trackerField: null
                },
                {
                    id: 'medical_records',
                    label: '3rd-party medical records (ER, Hospital, Imaging)',
                    category: 'packet',
                    required: true,
                    trackerField: null
                },
                {
                    id: 'crevos_assessments',
                    label: 'Crevos baseline assessments',
                    category: 'packet',
                    required: true,
                    trackerField: null
                },
                {
                    id: 'recent_labs',
                    label: 'Recent labs',
                    category: 'packet',
                    required: true,
                    trackerField: null
                },
                {
                    id: 'genoming',
                    label: 'Genoming/Genesight (if applicable)',
                    category: 'packet',
                    required: false,
                    trackerField: null
                },
                {
                    id: 'neuropsych',
                    label: 'Neuropsych (if applicable)',
                    category: 'packet',
                    required: false,
                    trackerField: null
                }
            ],
            
            // Within 48 Hours of Discharge
            within48Hours: [
                {
                    id: 'send_packet_email',
                    label: 'Send Aftercare Plan + Discharge Packet Email',
                    category: '48hour',
                    required: true,
                    description: 'Use Temp Email body. Recipients: guardians, Coordination of Care, Family Ambassadors, PT, CC/CM',
                    trackerField: 'dischargePacketUploaded'
                },
                {
                    id: 'complete_gad',
                    label: 'Complete GAD',
                    category: '48hour',
                    required: true,
                    trackerField: 'gadCompleted'
                },
                {
                    id: 'complete_phq',
                    label: 'Complete PHQ',
                    category: '48hour',
                    required: true,
                    trackerField: 'phqCompleted'
                },
                {
                    id: 'satisfaction_survey',
                    label: 'Complete Client Satisfaction Survey',
                    category: '48hour',
                    required: true,
                    trackerField: 'satisfactionSurvey'
                }
            ],
            
            // As Soon As Client Discharges
            afterDischarge: [
                {
                    id: 'internal_email',
                    label: 'Send Internal Discharge Email',
                    category: 'after',
                    required: true,
                    description: 'To: Admissions; Program CA (Cove/NEST/Estates); Family Ambassadors',
                    trackerField: null
                },
                {
                    id: 'discharge_summary_kipu',
                    label: 'Complete in Kipu: Discharge Summary',
                    category: 'after',
                    required: true,
                    trackerField: 'dischargeSummary'
                },
                {
                    id: 'aftercare_plan_kipu',
                    label: 'Complete in Kipu: Aftercare Plan',
                    category: 'after',
                    required: true,
                    trackerField: 'aftercareThreadSent'
                },
                {
                    id: 'discharge_asam',
                    label: 'Complete in Kipu: Discharge ASAM',
                    category: 'after',
                    required: true,
                    trackerField: 'dischargeAsam'
                }
            ]
        };
    }
    
    /**
     * Get or create discharge checklist for a client
     */
    async getClientChecklist(clientId) {
        try {
            // Try to get existing checklist
            const existing = await this.dbManager.getAll(this.storeName);
            let checklist = existing.find(c => c.clientId === clientId);
            
            if (!checklist) {
                // Create new checklist
                checklist = await this.createClientChecklist(clientId);
            }
            
            // Sync with tracker data if available
            if (window.clientManager) {
                const client = await window.clientManager.getClient(clientId);
                if (client) {
                    checklist = this.syncWithTracker(checklist, client);
                }
            }
            
            return checklist;
        } catch (error) {
            console.error('Error getting discharge checklist:', error);
            return null;
        }
    }
    
    /**
     * Create new checklist for client
     */
    async createClientChecklist(clientId) {
        const checklist = {
            id: `discharge_${clientId}_${Date.now()}`,
            clientId,
            items: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            completedBy: window.dashboardManager?.currentCoach?.initials || 'UN'
        };
        
        // Initialize all items as incomplete
        [...this.checklistItems.beforeDischarge,
         ...this.checklistItems.within48Hours,
         ...this.checklistItems.afterDischarge].forEach(item => {
            checklist.items[item.id] = {
                completed: false,
                completedAt: null,
                completedBy: null,
                notes: ''
            };
        });
        
        await this.dbManager.put(this.storeName, checklist);
        return checklist;
    }
    
    /**
     * Sync checklist with tracker data
     */
    syncWithTracker(checklist, client) {
        // Sync items that have tracker fields
        [...this.checklistItems.beforeDischarge,
         ...this.checklistItems.within48Hours,
         ...this.checklistItems.afterDischarge].forEach(item => {
            if (item.trackerField && client[item.trackerField]) {
                checklist.items[item.id].completed = true;
                checklist.items[item.id].completedAt = client[item.trackerField + 'Date'] || new Date().toISOString();
                checklist.items[item.id].completedBy = window.dashboardManager?.currentCoach?.initials || 'UN';
            }
        });
        
        return checklist;
    }
    
    /**
     * Update checklist item
     */
    async updateChecklistItem(clientId, itemId, completed, notes = '') {
        try {
            const checklist = await this.getClientChecklist(clientId);
            if (!checklist) return false;
            
            // Update the item
            checklist.items[itemId] = {
                completed,
                completedAt: completed ? new Date().toISOString() : null,
                completedBy: completed ? (window.dashboardManager?.currentCoach?.initials || 'UN') : null,
                notes
            };
            
            checklist.updatedAt = new Date().toISOString();
            
            // Save to database
            await this.dbManager.put(this.storeName, checklist);
            
            // If item has a tracker field, update tracker too
            const item = [...this.checklistItems.beforeDischarge,
                         ...this.checklistItems.within48Hours,
                         ...this.checklistItems.afterDischarge].find(i => i.id === itemId);
            
            if (item?.trackerField && window.clientManager) {
                const client = await window.clientManager.getClient(clientId);
                if (client) {
                    const updates = {
                        [item.trackerField]: completed,
                        [item.trackerField + 'Date']: completed ? new Date().toISOString() : null
                    };
                    await window.clientManager.updateClient(clientId, updates);
                }
            }
            
            return true;
        } catch (error) {
            console.error('Error updating checklist item:', error);
            return false;
        }
    }
    
    /**
     * Get checklist completion percentage
     */
    getCompletionPercentage(checklist) {
        const allItems = Object.keys(checklist.items);
        const completedItems = allItems.filter(id => checklist.items[id].completed);
        return Math.round((completedItems.length / allItems.length) * 100);
    }
    
    /**
     * Get required items still pending
     */
    getRequiredPending(checklist) {
        const pending = [];
        const allItems = [...this.checklistItems.beforeDischarge,
                         ...this.checklistItems.within48Hours,
                         ...this.checklistItems.afterDischarge];
        
        allItems.forEach(item => {
            if (item.required && !checklist.items[item.id]?.completed) {
                pending.push(item);
            }
        });
        
        return pending;
    }
    
    /**
     * Render discharge checklist modal
     */
    async renderChecklistModal(clientId) {
        const checklist = await this.getClientChecklist(clientId);
        if (!checklist) return;
        
        const client = await window.clientManager?.getClient(clientId);
        const clientName = client ? `${client.initials} - ${client.houseId}` : 'Client';
        
        const completion = this.getCompletionPercentage(checklist);
        const requiredPending = this.getRequiredPending(checklist);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay discharge-checklist-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>📋 FFAS Discharge Checklist - ${clientName}</h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="checklist-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completion}%"></div>
                    </div>
                    <div class="progress-text">
                        ${completion}% Complete
                        ${requiredPending.length > 0 ? `(${requiredPending.length} required items pending)` : ''}
                    </div>
                </div>
                
                <div class="checklist-sections">
                    <!-- Before Discharge Section -->
                    <div class="checklist-section">
                        <h3>📦 Before Client Discharges - Discharge Packet</h3>
                        <div class="checklist-items">
                            ${this.renderChecklistItems(checklist, this.checklistItems.beforeDischarge, clientId)}
                        </div>
                    </div>
                    
                    <!-- Within 48 Hours Section -->
                    <div class="checklist-section">
                        <h3>⏰ Within 48 Hours of Discharge</h3>
                        <div class="checklist-items">
                            ${this.renderChecklistItems(checklist, this.checklistItems.within48Hours, clientId)}
                        </div>
                    </div>
                    
                    <!-- After Discharge Section -->
                    <div class="checklist-section">
                        <h3>✈️ As Soon As Client Discharges</h3>
                        <div class="checklist-items">
                            ${this.renderChecklistItems(checklist, this.checklistItems.afterDischarge, clientId)}
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="dischargeChecklistManager.printChecklist('${clientId}')">
                        🖨️ Print Checklist
                    </button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Done
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Render checklist items
     */
    renderChecklistItems(checklist, items, clientId) {
        return items.map(item => {
            const itemData = checklist.items[item.id] || {};
            const isCompleted = itemData.completed;
            
            return `
                <div class="checklist-item ${isCompleted ? 'completed' : ''}">
                    <label class="checklist-label">
                        <input type="checkbox" 
                               ${isCompleted ? 'checked' : ''}
                               onchange="dischargeChecklistManager.updateChecklistItem('${clientId}', '${item.id}', this.checked)">
                        <span class="item-label">
                            ${item.label}
                            ${item.required ? '<span class="required">*</span>' : ''}
                        </span>
                    </label>
                    ${item.description ? `<div class="item-description">${item.description}</div>` : ''}
                    ${isCompleted && itemData.completedAt ? 
                        `<div class="item-meta">✓ ${itemData.completedBy} - ${new Date(itemData.completedAt).toLocaleDateString()}</div>` : ''}
                </div>
            `;
        }).join('');
    }
    
    /**
     * Print checklist
     */
    printChecklist(clientId) {
        window.print();
    }
}

// Initialize and export
if (typeof window !== 'undefined') {
    window.dischargeChecklistManager = new DischargeChecklistManager();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DischargeChecklistManager;
}
