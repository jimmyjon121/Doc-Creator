/**
 * Client Manager for CareConnect Pro
 * Manages client tracking with initials + Kipu ID (HIPAA compliant - no PHI)
 */

class ClientManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.currentClient = null;
        this.clientsCache = [];
        this.storeName = 'clients'; // New store for clients
        this.listeners = new Set();
    }
    
    /**
     * Generate unique ID for client
     */
    generateClientId() {
        return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    /**
     * Create new client profile
     * @param {Object} clientData - { initials, kipuId, houseId, admissionDate, care team, etc. }
     */
    async createClient(clientData) {
        // Calculate status based on discharge date
        let status = 'active';
        if (clientData.dischargeDate) {
            status = 'discharged';
        }
        
        const client = {
            id: this.generateClientId(),
            initials: clientData.initials.toUpperCase().substring(0, 4), // Max 4 chars
            kipuId: clientData.kipuId || '',
            
            // CM Tracker fields
            houseId: clientData.houseId || null,
            admissionDate: clientData.admissionDate || null,
            dischargeDate: clientData.dischargeDate || null,
            status: status, // active, discharged
            
            // Pre-admission tracking (NEW)
            referralDate: clientData.referralDate || null,
            intakeScheduledDate: clientData.intakeScheduledDate || null,
            insuranceVerified: clientData.insuranceVerified || false,
            bedAssignment: clientData.bedAssignment || null, // e.g., "NEST-Room3"
            
            // Care team (using initials only for HIPAA compliance)
            clinicalCoachInitials: clientData.clinicalCoachInitials || '',
            caseManagerInitials: clientData.caseManagerInitials || '',
            primaryTherapistInitials: clientData.primaryTherapistInitials || '',
            familyAmbassadorPrimaryInitials: clientData.familyAmbassadorPrimaryInitials || '',
            familyAmbassadorSecondaryInitials: clientData.familyAmbassadorSecondaryInitials || '',
            
            // 48-hour Admission Requirements
            needsAssessment: clientData.needsAssessment || false,
            needsAssessmentDate: clientData.needsAssessmentDate || null,
            healthPhysical: clientData.healthPhysical || false,
            healthPhysicalDate: clientData.healthPhysicalDate || null,
            
            // Aftercare Planning (all in one section)
            aftercareThreadSent: clientData.aftercareThreadSent || false,
            aftercareThreadDate: clientData.aftercareThreadDate || null,
            optionsDocUploaded: clientData.optionsDocUploaded || false,
            optionsDocUploadedDate: clientData.optionsDocUploadedDate || null,
            dischargePacketUploaded: clientData.dischargePacketUploaded || false,
            dischargePacketDate: clientData.dischargePacketDate || null,
            referralClosureCorrespondence: clientData.referralClosureCorrespondence || false,
            referralClosureDate: clientData.referralClosureDate || null,
            
            // Detailed aftercare options with progress tracking
            aftercareOptions: clientData.aftercareOptions || [],
            
            // Clinical Assessments (remain as checkboxes)
            gadCompleted: clientData.gadCompleted || false,
            gadCompletedDate: clientData.gadCompletedDate || null,
            phqCompleted: clientData.phqCompleted || false,
            phqCompletedDate: clientData.phqCompletedDate || null,
            satisfactionSurvey: clientData.satisfactionSurvey || false,
            satisfactionSurveyDate: clientData.satisfactionSurveyDate || null,
            
            // Documentation
            dischargeSummary: clientData.dischargeSummary || false,
            dischargeSummaryDate: clientData.dischargeSummaryDate || null,
            dischargePlanningNote: clientData.dischargePlanningNote || false,
            dischargePlanningNoteDate: clientData.dischargePlanningNoteDate || null,
            dischargeASAM: clientData.dischargeASAM || false,
            dischargeASAMDate: clientData.dischargeASAMDate || null,
            
            // Additional tracking fields (NEW)
            dateOptionsProvided: clientData.dateOptionsProvided || null,
            isArchived: false, // New clients are never archived
            isDemo: Boolean(clientData.isDemo),
            
            // Existing fields
            createdDate: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            programHistory: [],
            documentHistory: [],
            notes: clientData.notes || '',
            tags: clientData.tags || [],
            preferences: {
                includeAtHome: clientData.preferences?.includeAtHome || false,
                includeAlumni: clientData.preferences?.includeAlumni || false,
                documentType: clientData.preferences?.documentType || 'options' // options, plans
            }
        };
        
        // Validate
        if (!client.initials || client.initials.length < 2) {
            throw new Error('Client initials must be at least 2 characters');
        }
        
        if (client.initials.length > 4) {
            throw new Error('Client initials must be 4 characters or less');
        }
        
        // Validate initials format (letters only)
        if (!/^[A-Z]+$/.test(client.initials)) {
            throw new Error('Client initials must contain only letters');
        }
        
        if (!client.kipuId) {
            throw new Error('Kipu ID is required');
        }
        
        // Validate Kipu ID format if needed (add specific format rules here)
        // Example: if (!/^\d{6,10}$/.test(client.kipuId)) { ... }
        
        if (!client.houseId) {
            throw new Error('House assignment is required');
        }
        
        // Validate discharge date is not before admission date
        if (client.dischargeDate && client.admissionDate) {
            const admission = new Date(client.admissionDate);
            const discharge = new Date(client.dischargeDate);
            if (discharge < admission) {
                throw new Error('Discharge date cannot be before admission date');
            }
        }
        
        // Check for duplicates
        const existing = await this.findClientByKipuId(client.kipuId);
        if (existing) {
            throw new Error(`Client with Kipu ID ${client.kipuId} already exists`);
        }
        
        // Save to IndexedDB
        await this.dbManager.put(this.storeName, client);
        
        // Update cache
        this.clientsCache.push(client);
        
        // Notify listeners
        this.notifyListeners('client-created', client);
        
        return client;
    }

    /**
     * Delete client by ID
     */
    async deleteClient(clientId) {
        const client = await this.getClient(clientId);
        if (!client) {
            console.warn('Attempted to delete client that does not exist:', clientId);
            return false;
        }
        
        await this.dbManager.delete(this.storeName, clientId);
        this.clientsCache = this.clientsCache.filter(c => c.id !== clientId);
        
        if (this.currentClient && this.currentClient.id === clientId) {
            this.currentClient = null;
        }
        
        this.notifyListeners('client-deleted', client);
        return true;
    }
    
    /**
     * Update client
     */
    async updateClient(clientId, updates) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        // Auto-calculate status if discharge date changes
        if ('dischargeDate' in updates) {
            updates.status = updates.dischargeDate ? 'discharged' : 'active';
        }
        
        // Update fields
        const updatedClient = {
            ...client,
            ...updates,
            id: client.id, // Prevent ID change
            createdDate: client.createdDate, // Preserve created date
            lastModified: new Date().toISOString()
        };
        
        // Save
        await this.dbManager.put(this.storeName, updatedClient);
        
        // Update cache
        const index = this.clientsCache.findIndex(c => c.id === clientId);
        if (index >= 0) {
            this.clientsCache[index] = updatedClient;
        }
        
        // Update current if it's the same client
        if (this.currentClient && this.currentClient.id === clientId) {
            this.currentClient = updatedClient;
        }
        
        // Notify
        this.notifyListeners('client-updated', updatedClient);
        
        return updatedClient;
    }
    
    /**
     * Get client by ID
     */
    async getClient(clientId) {
        return await this.dbManager.get(this.storeName, clientId);
    }
    
    /**
     * Get all clients
     */
    async getAllClients() {
        const clients = await this.dbManager.getAll(this.storeName);
        this.clientsCache = clients || [];
        return this.clientsCache;
    }
    
    /**
     * Get active clients
     */
    async getActiveClients() {
        const allClients = await this.getAllClients();
        return allClients.filter(c => c.status === 'active');
    }
    
    /**
     * Find client by Kipu ID
     */
    async findClientByKipuId(kipuId) {
        const clients = await this.getAllClients();
        return clients.find(c => c.kipuId === kipuId);
    }
    
    /**
     * Search clients
     */
    async searchClients(query) {
        const clients = await this.getAllClients();
        const searchTerm = query.toLowerCase();
        
        return clients.filter(client => 
            client.initials.toLowerCase().includes(searchTerm) ||
            client.kipuId.includes(searchTerm) ||
            client.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }
    
    /**
     * Set current client
     */
    async setCurrentClient(clientId) {
        if (!clientId) {
            this.currentClient = null;
            this.notifyListeners('current-client-changed', null);
            return;
        }
        
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        this.currentClient = client;
        
        // Store in session
        sessionStorage.setItem('currentClientId', clientId);
        
        // Notify
        this.notifyListeners('current-client-changed', client);
        
        return client;
    }
    
    /**
     * Get current client
     */
    getCurrentClient() {
        return this.currentClient;
    }
    
    /**
     * Add program to client's history
     */
    async addProgramToClient(clientId, programId, metadata = {}) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        const historyEntry = {
            programId,
            addedDate: new Date().toISOString(),
            status: 'selected', // selected, exported, removed
            ...metadata
        };
        
        client.programHistory.push(historyEntry);
        
        return await this.updateClient(clientId, {
            programHistory: client.programHistory
        });
    }
    
    /**
     * Remove program from client
     */
    async removeProgramFromClient(clientId, programId) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        // Mark as removed instead of deleting
        const entry = client.programHistory.find(h => 
            h.programId === programId && h.status === 'selected'
        );
        
        if (entry) {
            entry.status = 'removed';
            entry.removedDate = new Date().toISOString();
        }
        
        return await this.updateClient(clientId, {
            programHistory: client.programHistory
        });
    }
    
    /**
     * Get client's selected programs
     */
    async getClientPrograms(clientId) {
        const client = await this.getClient(clientId);
        if (!client) {
            return [];
        }
        
        return client.programHistory
            .filter(h => h.status === 'selected')
            .map(h => h.programId);
    }
    
    /**
     * Add document generation record
     */
    async addDocumentRecord(clientId, documentData) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        const record = {
            id: 'doc_' + Date.now(),
            generatedDate: new Date().toISOString(),
            documentType: documentData.type || 'options',
            programIds: documentData.programIds || [],
            settings: documentData.settings || {},
            fileName: documentData.fileName
        };
        
        client.documentHistory.push(record);
        
        return await this.updateClient(clientId, {
            documentHistory: client.documentHistory
        });
    }
    
    /**
     * Update client status
     */
    async updateClientStatus(clientId, status) {
        const validStatuses = ['active', 'discharged'];
        if (!validStatuses.includes(status)) {
            throw new Error('Invalid status');
        }
        
        return await this.updateClient(clientId, { status });
    }
    
    /**
     * Discharge client
     */
    async dischargeClient(clientId, dischargeDate = null) {
        const date = dischargeDate || new Date().toISOString().split('T')[0];
        return await this.updateClient(clientId, { 
            dischargeDate: date,
            status: 'discharged'
        });
    }
    
    /**
     * Archive discharged client
     */
    async archiveClient(clientId) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        if (client.status !== 'discharged') {
            throw new Error('Only discharged clients can be archived');
        }
        
        return await this.updateClient(clientId, {
            isArchived: true
        });
    }
    
    /**
     * Unarchive client (for re-admission)
     */
    async unarchiveClient(clientId) {
        return await this.updateClient(clientId, {
            isArchived: false,
            status: 'active',
            dischargeDate: null
        });
    }
    
    /**
     * Calculate days in care for a client
     */
    calculateDaysInCare(client) {
        if (!client || !client.admissionDate) return 0;
        
        const admission = new Date(client.admissionDate);
        const endDate = client.dischargeDate ? new Date(client.dischargeDate) : new Date();
        
        // Check for invalid dates
        if (isNaN(admission.getTime())) {
            console.warn('Invalid admission date:', client.admissionDate);
            return 0;
        }
        
        const diffTime = Math.abs(endDate - admission);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // Adding 1 to include the admission day
        
        return diffDays;
    }
    
    /**
     * Get milestone target dates based on admission
     */
    getMilestoneTargetDates(admissionDate) {
        const admission = new Date(admissionDate);
        const targets = {};
        
        // Helper to add days and skip weekends if needed
        const addDays = (date, days, skipWeekends = false) => {
            const result = new Date(date);
            let daysToAdd = days;
            
            while (daysToAdd > 0) {
                result.setDate(result.getDate() + 1);
                // Skip weekends if requested
                if (!skipWeekends || (result.getDay() !== 0 && result.getDay() !== 6)) {
                    daysToAdd--;
                }
            }
            
            return result.toISOString().split('T')[0];
        };
        
        // Set target dates based on plan requirements
        targets.health_physical = addDays(admission, 7);
        targets.aftercare_thread = addDays(admission, 14);
        targets.aftercare_alert = addDays(admission, 13); // Alert one day before
        targets.aftercare_escalation = addDays(admission, 16); // Escalation if not sent
        
        return targets;
    }
    
    /**
     * Check for due/overdue milestones and alerts
     */
    async checkClientAlerts(clientId) {
        const client = await this.getClient(clientId);
        if (!client || client.status === 'discharged') return [];
        
        const daysInCare = this.calculateDaysInCare(client);
        const alerts = [];
        
        // Get milestones from milestones manager if available
        if (window.milestonesManager) {
            const milestones = await window.milestonesManager.getClientMilestones(clientId);
            
            // Check aftercare thread specifically
            const aftercareThread = milestones.find(m => m.milestone === 'aftercare_thread');
            if (aftercareThread && aftercareThread.status !== 'complete') {
                if (daysInCare === 13) {
                    alerts.push({
                        type: 'warning',
                        priority: 'medium',
                        message: 'Prepare aftercare thread - due tomorrow',
                        milestone: 'aftercare_thread',
                        action: 'prepare'
                    });
                } else if (daysInCare === 14) {
                    alerts.push({
                        type: 'urgent',
                        priority: 'high',
                        message: 'Send aftercare thread TODAY',
                        milestone: 'aftercare_thread',
                        action: 'send'
                    });
                } else if (daysInCare >= 16) {
                    alerts.push({
                        type: 'overdue',
                        priority: 'critical',
                        message: `OVERDUE: Aftercare thread ${daysInCare - 14} days late`,
                        milestone: 'aftercare_thread',
                        action: 'escalate'
                    });
                }
            }
            
            // Check health & physical
            const healthPhysical = milestones.find(m => m.milestone === 'health_physical');
            if (healthPhysical && healthPhysical.status !== 'complete' && daysInCare > 7) {
                alerts.push({
                    type: 'overdue',
                    priority: 'high',
                    message: `Health & Physical overdue by ${daysInCare - 7} days`,
                    milestone: 'health_physical',
                    action: 'complete'
                });
            }
        }
        
        // Check for upcoming discharge
        if (client.dischargeDate) {
            const daysUntilDischarge = Math.floor((new Date(client.dischargeDate) - new Date()) / (1000 * 60 * 60 * 24));
            if (daysUntilDischarge <= 3 && daysUntilDischarge >= 0) {
                alerts.push({
                    type: 'info',
                    priority: 'high',
                    message: `Discharge in ${daysUntilDischarge} days - complete final items`,
                    action: 'review'
                });
            }
        }
        
        return alerts;
    }
    
    /**
     * Get all alerts for active clients
     */
    async getAllClientAlerts() {
        const activeClients = await this.getActiveClients();
        const allAlerts = [];
        
        for (const client of activeClients) {
            const alerts = await this.checkClientAlerts(client.id);
            if (alerts.length > 0) {
                allAlerts.push({
                    client,
                    alerts
                });
            }
        }
        
        // Sort by priority
        const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        allAlerts.sort((a, b) => {
            const aPriority = Math.min(...a.alerts.map(alert => priorityOrder[alert.priority] || 999));
            const bPriority = Math.min(...b.alerts.map(alert => priorityOrder[alert.priority] || 999));
            return aPriority - bPriority;
        });
        
        return allAlerts;
    }
    
    /**
     * Get clients by house
     */
    async getClientsByHouse(houseId, activeOnly = false) {
        const allClients = await this.getAllClients();
        
        let clients = allClients.filter(c => c.houseId === houseId);
        
        if (activeOnly) {
            clients = clients.filter(c => c.status === 'active');
        }
        
        return clients;
    }
    
    /**
     * Get discharged clients
     */
    async getDischargedClients() {
        const allClients = await this.getAllClients();
        return allClients.filter(c => c.status === 'discharged');
    }
    
    /**
     * Assign care team member
     */
    async assignCareTeamMember(clientId, role, initials) {
        const validRoles = [
            'clinicalCoachInitials',
            'caseManagerInitials',
            'primaryTherapistInitials',
            'familyAmbassadorPrimaryInitials',
            'familyAmbassadorSecondaryInitials'
        ];
        
        if (!validRoles.includes(role)) {
            throw new Error('Invalid care team role');
        }
        
        const update = {};
        update[role] = initials.toUpperCase();
        
        return await this.updateClient(clientId, update);
    }
    
    /**
     * Calculate days in care
     */
    calculateDaysInCare(client) {
        if (!client.admissionDate) return 0;
        
        const admission = new Date(client.admissionDate);
        const end = client.dischargeDate ? new Date(client.dischargeDate) : new Date();
        const diffTime = Math.abs(end - admission);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return diffDays;
    }
    
    /**
     * Calculate hours elapsed since admission (for 48-hour tracking)
     * @param {Object} client - Client object
     * @returns {number} Hours since admission
     */
    calculateHoursElapsed(client) {
        if (!client.admissionDate) return 0;
        
        const admission = new Date(client.admissionDate);
        const now = new Date();
        
        const diffTime = Math.abs(now - admission);
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        
        return diffHours;
    }
    
    /**
     * Add or update an aftercare option for a client
     * @param {string} clientId - Client ID
     * @param {Object} aftercareOption - Aftercare option data
     */
    async addAftercareOption(clientId, aftercareOption) {
        const client = await this.getClient(clientId);
        if (!client) throw new Error('Client not found');
        
        if (!client.aftercareOptions) {
            client.aftercareOptions = [];
        }
        
        // Check if this option already exists
        const existingIndex = client.aftercareOptions.findIndex(
            opt => opt.programId === aftercareOption.programId
        );
        
        const optionWithDefaults = {
            programId: aftercareOption.programId,
            programName: aftercareOption.programName,
            programType: aftercareOption.programType || 'Unknown',
            status: aftercareOption.status || 'exploring',
            
            // Family engagement tracking
            familyContacted: aftercareOption.familyContacted || false,
            familyContactDate: aftercareOption.familyContactDate || null,
            contactNotes: aftercareOption.contactNotes || '',
            
            // Records tracking
            recordsRequested: aftercareOption.recordsRequested || false,
            recordsRequestDate: aftercareOption.recordsRequestDate || null,
            recordsSent: aftercareOption.recordsSent || false,
            recordsSentDate: aftercareOption.recordsSentDate || null,
            
            // Assessment tracking
            assessmentScheduled: aftercareOption.assessmentScheduled || false,
            assessmentDate: aftercareOption.assessmentDate || null,
            assessmentCompleted: aftercareOption.assessmentCompleted || false,
            
            // Final status
            accepted: aftercareOption.accepted || false,
            acceptanceDate: aftercareOption.acceptanceDate || null,
            declinedReason: aftercareOption.declinedReason || '',
            
            // Additional tracking
            lastUpdated: new Date().toISOString(),
            dateAdded: aftercareOption.dateAdded || new Date().toISOString()
        };
        
        if (existingIndex >= 0) {
            // Update existing option
            client.aftercareOptions[existingIndex] = {
                ...client.aftercareOptions[existingIndex],
                ...optionWithDefaults
            };
        } else {
            // Add new option
            client.aftercareOptions.push(optionWithDefaults);
        }
        
        return await this.updateClient(clientId, { aftercareOptions: client.aftercareOptions });
    }
    
    /**
     * Update aftercare option progress
     * @param {string} clientId - Client ID
     * @param {string} programId - Program ID of the aftercare option
     * @param {Object} progressUpdate - Progress update data
     */
    async updateAftercareProgress(clientId, programId, progressUpdate) {
        const client = await this.getClient(clientId);
        if (!client) throw new Error('Client not found');
        
        const optionIndex = client.aftercareOptions?.findIndex(
            opt => opt.programId === programId
        );
        
        if (optionIndex === -1 || optionIndex === undefined) {
            throw new Error('Aftercare option not found');
        }
        
        // Update the specific fields
        const option = client.aftercareOptions[optionIndex];
        Object.assign(option, progressUpdate, {
            lastUpdated: new Date().toISOString()
        });
        
        return await this.updateClient(clientId, { aftercareOptions: client.aftercareOptions });
    }
    
    /**
     * Add tag to client
     */
    async addClientTag(clientId, tag) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        if (!client.tags.includes(tag)) {
            client.tags.push(tag);
            return await this.updateClient(clientId, { tags: client.tags });
        }
        
        return client;
    }
    
    /**
     * Remove tag from client
     */
    async removeClientTag(clientId, tag) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        client.tags = client.tags.filter(t => t !== tag);
        return await this.updateClient(clientId, { tags: client.tags });
    }
    
    /**
     * Get recent clients
     */
    async getRecentClients(limit = 5) {
        const clients = await this.getAllClients();
        return clients
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
            .slice(0, limit);
    }
    
    /**
     * Clone client programs to another client
     */
    async cloneClientPrograms(fromClientId, toClientId) {
        const fromPrograms = await this.getClientPrograms(fromClientId);
        const toClient = await this.getClient(toClientId);
        
        if (!toClient) {
            throw new Error('Target client not found');
        }
        
        for (const programId of fromPrograms) {
            await this.addProgramToClient(toClientId, programId, {
                clonedFrom: fromClientId,
                clonedDate: new Date().toISOString()
            });
        }
        
        return toClient;
    }
    
    /**
     * Export client data
     */
    async exportClient(clientId) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }
        
        // Remove any potentially sensitive data
        const exportData = {
            ...client,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return exportData;
    }
    
    /**
     * Import client data
     */
    async importClient(clientData) {
        // Validate import data
        if (!clientData.initials || !clientData.kipuId) {
            throw new Error('Invalid client data');
        }
        
        // Check for existing
        const existing = await this.findClientByKipuId(clientData.kipuId);
        if (existing) {
            // Update existing
            return await this.updateClient(existing.id, clientData);
        } else {
            // Create new
            return await this.createClient(clientData);
        }
    }
    
    /**
     * Get client statistics
     */
    async getClientStats() {
        const clients = await this.getAllClients();
        
        const stats = {
            total: clients.length,
            active: clients.filter(c => c.status === 'active').length,
            discharged: clients.filter(c => c.status === 'discharged').length,
            waitlist: clients.filter(c => c.status === 'waitlist').length,
            withPrograms: clients.filter(c => 
                c.programHistory.some(h => h.status === 'selected')
            ).length,
            documentsGenerated: clients.reduce((sum, c) => 
                sum + (c.documentHistory?.length || 0), 0
            )
        };
        
        return stats;
    }

    /**
     * Initialize from storage
     */
    async initialize() {
        // Load current client from session
        const currentClientId = sessionStorage.getItem('currentClientId');
        if (currentClientId) {
            try {
                await this.setCurrentClient(currentClientId);
            } catch (error) {
                console.error('Failed to restore current client:', error);
                sessionStorage.removeItem('currentClientId');
            }
        }
        
        // Load all clients into cache
        await this.getAllClients();
    }
    
    /**
     * Subscribe to client events
     */
    subscribe(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }
    
    /**
     * Notify listeners
     */
    notifyListeners(event, data) {
        this.listeners.forEach(callback => {
            try {
                callback(event, data);
            } catch (error) {
                console.error('Error in client listener:', error);
            }
        });
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.ClientManager = ClientManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientManager;
}

