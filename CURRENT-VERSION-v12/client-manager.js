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
            
            // ═══════════════════════════════════════════════════════════════════════════
            // DISCHARGE OUTCOME TRACKING
            // ═══════════════════════════════════════════════════════════════════════════
            dischargeOutcome: clientData.dischargeOutcome || {
                // Core outcome classification
                outcomeType: null, // 'program' | 'home-with-supports' | 'clinician-recommended' | 'ama' | 'family-override'
                familyFollowedRecommendation: null, // true | false | null
                
                // Primary placement (if going to a program)
                primaryPlacement: {
                    programId: null,        // ID from programs database (if exists)
                    programName: '',        // Display name
                    programType: '',        // PHP | IOP | TBS | Sober Living | Residential | Other
                    location: '',           // City, State
                    isCustomEntry: false,   // true if manually entered (not in database)
                    contactInfo: '',        // Phone/email if custom
                    startDate: null,        // When client starts at program
                    notes: ''
                },
                
                // At-home resources (array - client may have multiple)
                atHomeResources: [],
                // Each resource: { id, type, providerName, frequency, notes }
                // type: 'therapist' | 'psychiatrist' | 'support-group' | 'school-counselor' | 'case-manager' | 'other'
                // frequency: 'weekly' | 'biweekly' | 'monthly' | 'as-needed'
                
                // Clinician-recommended plan (when family doesn't follow recs)
                clinicianRecommendedPlan: {
                    recommendedProgramId: null,
                    recommendedProgramName: '',
                    recommendedProgramType: '',
                    alternativeResources: [],
                    clinicalRationale: ''
                },
                
                // Metadata
                recordedBy: '',           // Initials of staff who recorded
                recordedAt: null,         // ISO timestamp
                lastModified: null,
                isFinalized: false,       // Lock after 48 hours
                
                // Follow-up tracking (future feature)
                followUpScheduled: false,
                followUpDate: null,
                followUpNotes: ''
            },
            
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
            },
            
            // Task tracking + compliance scaffolding
            taskState: clientData.taskState || {},
            asamEpisodes: clientData.asamEpisodes || [],
            complianceFlags: clientData.complianceFlags || {}
        };
        
        // Ensure task schema defaults are applied
        this.ensureTaskSchema(client);
        
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
        
        // House assignment is optional for pre-admission clients
        // if (!client.houseId) {
        //     throw new Error('House assignment is required');
        // }
        
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
        
        this.captureClientAdmissionAnalytics(client, clientData);
        
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
        
        // Re-sync task schema after updates (handles new tasks + due changes)
        this.ensureTaskSchema(updatedClient);
        
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
        
        if (client.status !== 'discharged' && updatedClient.status === 'discharged') {
            this.captureClientDischargeAnalytics(updatedClient, updates);
        }
        
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
     * Get discharged clients
     */
    async getDischargedClients() {
        const allClients = await this.getAllClients();
        return allClients.filter(c => c.status === 'discharged');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DISCHARGE WORKFLOW METHODS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Get clients with discharge dates in the next N hours
     * @param {number} hoursAhead - How many hours to look ahead (default 48)
     * @returns {Array} Clients approaching discharge with status info
     */
    getUpcomingDischarges(hoursAhead = 48) {
        const now = new Date();
        const cutoff = new Date(now.getTime() + hoursAhead * 60 * 60 * 1000);
        
        return this.clientsCache
            .filter(client => {
                if (client.status !== 'active' || !client.dischargeDate) return false;
                const dcDate = new Date(client.dischargeDate);
                return dcDate > now && dcDate <= cutoff;
            })
            .map(client => {
                const dcDate = new Date(client.dischargeDate);
                const hoursRemaining = Math.round((dcDate - now) / (1000 * 60 * 60));
                const isUrgent = hoursRemaining <= 24;
                const isCritical = hoursRemaining <= 12;
                
                // Check packet completion
                const packetTasks = ['dischargePacketUploaded', 'dischargeSummary', 'dischargePlanningNote', 'dischargeASAM'];
                const packetStatus = packetTasks.map(taskId => ({
                    taskId,
                    label: window.TaskSchema?.tasks?.[taskId]?.label || taskId,
                    completed: client.taskState?.[taskId]?.completed || false
                }));
                const packetComplete = packetStatus.filter(t => 
                    ['dischargePacketUploaded', 'dischargeSummary'].includes(t.taskId)
                ).every(t => t.completed);
                
                // Check outcome recorded
                const outcomeRecorded = !!client.dischargeOutcome?.outcomeType;
                
                return {
                    ...client,
                    hoursRemaining,
                    isUrgent,
                    isCritical,
                    packetStatus,
                    packetComplete,
                    outcomeRecorded,
                    dcDateFormatted: dcDate.toLocaleDateString(),
                    dcTimeFormatted: dcDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    urgencyLevel: isCritical && !packetComplete ? 'critical' : 
                                  isUrgent || !packetComplete ? 'urgent' : 'warning'
                };
            })
            .sort((a, b) => a.hoursRemaining - b.hoursRemaining);
    }
    
    /**
     * Check if client can be discharged (packet complete)
     * @param {string} clientId - Client ID
     * @returns {Object} { canDischarge: boolean, missingItems: string[], warnings: string[], completedItems: string[] }
     */
    validateDischargeReadiness(clientId) {
        const client = this.clientsCache.find(c => c.id === clientId);
        if (!client) {
            return { canDischarge: false, missingItems: ['Client not found'], warnings: [], completedItems: [] };
        }
        
        // Required items for discharge
        const required = [
            { taskId: 'dischargePacketUploaded', label: 'Discharge Packet' },
            { taskId: 'dischargeSummary', label: 'Discharge Summary' },
            { taskId: 'dischargePlanningNote', label: 'Discharge Planning Note' },
            { taskId: 'dischargeASAM', label: 'Discharge ASAM' }
        ];
        
        // Recommended but not required
        const recommended = [
            { taskId: 'satisfactionSurvey', label: 'Satisfaction Survey' },
            { taskId: 'referralClosureCorrespondence', label: 'Referral Closure Correspondence' }
        ];
        
        const missingItems = [];
        const completedItems = [];
        const warnings = [];
        
        // Check required tasks
        required.forEach(item => {
            if (client.taskState?.[item.taskId]?.completed) {
                completedItems.push(item.label);
            } else {
                missingItems.push(item.label);
            }
        });
        
        // Check recommended tasks
        recommended.forEach(item => {
            if (!client.taskState?.[item.taskId]?.completed) {
                warnings.push(`${item.label} not completed`);
            }
        });
        
        // Check outcome recorded
        if (!client.dischargeOutcome?.outcomeType) {
            missingItems.push('Discharge Outcome not recorded');
        } else {
            completedItems.push('Discharge Outcome recorded');
        }
        
        return {
            canDischarge: missingItems.length === 0,
            missingItems,
            warnings,
            completedItems,
            client: {
                initials: client.initials,
                kipuId: client.kipuId,
                dischargeDate: client.dischargeDate
            }
        };
    }
    
    /**
     * Get clients ready for discharge (all requirements met)
     * @returns {Array} Clients with complete discharge packets
     */
    async getDischargeReadyClients() {
        const activeClients = await this.getActiveClients();
        return activeClients.filter(client => {
            if (!client.dischargeDate) return false;
            const readiness = this.validateDischargeReadiness(client.id);
            return readiness.canDischarge;
        });
    }
    
    /**
     * Get clients with incomplete discharge packets approaching discharge
     * @returns {Array} Clients needing urgent attention
     */
    getUrgentDischargeAlerts() {
        const upcoming = this.getUpcomingDischarges(48);
        return upcoming.filter(client => !client.packetComplete || !client.outcomeRecorded);
    }
    
    /**
     * Get clients by house
     */
    async getClientsByHouse(houseId, activeOnly = true) {
        const allClients = await this.getAllClients();
        let filtered = allClients.filter(c => c.houseId === houseId);
        
        if (activeOnly) {
            filtered = filtered.filter(c => c.status === 'active');
        }
        
        return filtered;
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
    
    captureClientAdmissionAnalytics(client, clientData = {}) {
        if (!window.analyticsHooks?.logClientAdmission || !client) return;
        if (client.status !== 'active') return;
        try {
            window.analyticsHooks.logClientAdmission(client.id, {
                admissionDate: client.admissionDate || new Date().toISOString().split('T')[0],
                admissionSource: clientData.admissionSource || clientData.referralSource || 'unknown',
                referringProgramId: clientData.referringProgramId || null,
                referringProgramName: clientData.referringProgramName || null,
                insurancePayer: clientData.insurancePayer || null
            });
        } catch (error) {
            console.warn('[ClientManager] Failed to capture client admission analytics', error);
        }
    }
    
    captureClientDischargeAnalytics(client, updates = {}) {
        if (!window.analyticsHooks?.logClientDischarge || !client) return;
        try {
            window.analyticsHooks.logClientDischarge(client.id, {
                dischargeDate: client.dischargeDate || new Date().toISOString().split('T')[0],
                dischargeType: updates.dischargeType || 'planned',
                dischargeDestination: updates.dischargeDestination || null,
                lengthOfStay: this.calculateLengthOfStay(client.admissionDate, client.dischargeDate),
                aftercarePlanFinalized: Boolean(client.aftercarePlanCreated)
            });
        } catch (error) {
            console.warn('[ClientManager] Failed to capture client discharge analytics', error);
        }
    }
    
    calculateLengthOfStay(admissionDate, dischargeDate) {
        if (!admissionDate || !dischargeDate) return null;
        const admission = new Date(admissionDate);
        const discharge = new Date(dischargeDate);
        if (Number.isNaN(admission.getTime()) || Number.isNaN(discharge.getTime())) return null;
        if (discharge < admission) return null;
        return Math.ceil((discharge - admission) / (1000 * 60 * 60 * 24));
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

    /**
     * Public helper to ensure task schema defaults are applied
     * Returns true if client.taskState was modified
     */
    ensureTaskSchema(client) {
        return this.syncTaskSchema(client);
    }

    getTaskSchema() {
        if (typeof window === 'undefined') return null;
        return window.TaskSchema || null;
    }

    syncTaskSchema(client) {
        const schema = this.getTaskSchema();
        if (!client) return false;
        if (!schema || !schema.tasks) {
            client.taskState = client.taskState || {};
            return false;
        }

        const now = new Date().toISOString();
        if (!client.taskState || typeof client.taskState !== 'object') {
            client.taskState = {};
        }

        let changed = false;

        Object.entries(schema.tasks).forEach(([taskId, config]) => {
            const existing = client.taskState[taskId];
            const defaults = this.buildTaskRecord(client, taskId, config, now);
            const merged = {
                ...defaults,
                ...(existing || {}),
                id: taskId
            };

            const recalculatedDue = this.calculateTaskDueDate(client, config, merged);
            if (recalculatedDue !== merged.dueDate) {
                merged.dueDate = recalculatedDue;
            }

            if (config.dependsOn && config.dependsOn.length > 0) {
                const locked = config.dependsOn.some(depId => {
                    const dependency = client.taskState[depId];
                    return !dependency || !dependency.completed;
                });
                if (locked !== merged.locked) {
                    merged.locked = locked;
                }
            }

            if (config.legacyField && client[config.legacyField]) {
                if (!merged.completed) {
                    merged.completed = true;
                    changed = true;
                }
                if (merged.status !== 'complete') {
                    merged.status = 'complete';
                    changed = true;
                }
                merged.completedDate = merged.completedDate || client[config.legacyDateField] || now;
            }

            if (config.legacyField && !client[config.legacyField] && merged.completed && merged.status === 'complete') {
                client[config.legacyField] = true;
                client[config.legacyDateField] = merged.completedDate || now;
            }

            if (!existing || JSON.stringify(existing) !== JSON.stringify(merged)) {
                changed = true;
            }

            client.taskState[taskId] = merged;
        });

        // Remove tasks that no longer exist in schema
        Object.keys(client.taskState).forEach(taskId => {
            if (!schema.tasks[taskId]) {
                delete client.taskState[taskId];
                changed = true;
            }
        });

        return changed;
    }

    buildTaskRecord(client, taskId, config, timestamp) {
        return {
            id: taskId,
            status: 'pending',
            completed: false,
            completedDate: null,
            assignedTo: this.resolveDefaultOwner(client, config?.defaultOwnerRole),
            dueDate: this.calculateTaskDueDate(client, config),
            locked: Array.isArray(config?.dependsOn) && config.dependsOn.length > 0,
            notes: '',
            evidence: [],
            lastUpdated: timestamp,
            history: []
        };
    }

    resolveDefaultOwner(client, role) {
        if (!role) return client.caseManagerInitials || '';
        const map = {
            caseManager: client.caseManagerInitials,
            clinicalCoach: client.clinicalCoachInitials,
            primaryTherapist: client.primaryTherapistInitials,
            familyAmbassadorPrimary: client.familyAmbassadorPrimaryInitials,
            familyAmbassadorSecondary: client.familyAmbassadorSecondaryInitials,
            admissions: 'ADMS'
        };
        return (map[role] || client.caseManagerInitials || client.clinicalCoachInitials || '').toUpperCase();
    }

    calculateTaskDueDate(client, config, currentState = null) {
        if (!config || !config.due) return currentState?.dueDate || null;
        const due = config.due;

        const addDaysSafe = (dateString, days = 0) => {
            if (!dateString) return null;
            return this.addDays(dateString, days);
        };

        switch (due.type) {
            case 'afterAdmission':
                return addDaysSafe(client.admissionDate, due.days || 0);
            case 'beforeDischarge':
                if (!client.dischargeDate) return null;
                return addDaysSafe(client.dischargeDate, -(due.days || 0));
            case 'afterTaskComplete':
                if (!due.task || !client.taskState?.[due.task]?.completedDate) return null;
                return addDaysSafe(client.taskState[due.task].completedDate, due.days || 0);
            case 'afterEpisodeStart': {
                const episode = this.getActiveAsamEpisode(client);
                const baseDate = episode
                    ? (episode.continuedFromDate || episode.startDate)
                    : client.admissionDate || null;
                return addDaysSafe(baseDate, due.days || 0);
            }
            case 'afterLocChange': {
                const episode = this.getMostRecentAsamEpisode(client);
                const locDate = episode?.changeDate || episode?.startDate;
                return addDaysSafe(locDate, due.days || 0);
            }
            case 'atAdmission':
                return client.admissionDate || null;
            default:
                return currentState?.dueDate || null;
        }
    }

    getActiveAsamEpisode(client) {
        if (!client?.asamEpisodes || client.asamEpisodes.length === 0) return null;
        return client.asamEpisodes.find(ep => !ep.endDate) || null;
    }

    getMostRecentAsamEpisode(client) {
        if (!client?.asamEpisodes || client.asamEpisodes.length === 0) return null;
        return client.asamEpisodes[client.asamEpisodes.length - 1];
    }

    addDays(dateInput, days = 0) {
        if (!dateInput && dateInput !== 0) return null;
        const date = new Date(dateInput);
        if (Number.isNaN(date.getTime())) return null;
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    }

    /**
     * Record an ASAM / Level-of-Care episode (admission or step-down)
     * This is called AFTER insurance-facing ASAM work is completed in Kipu.
     * We only track LOC, change date, MH primary flag, and optional Kipu doc reference.
     */
    async recordAsamEpisode(clientId, episodeInput) {
        const client = await this.getClient(clientId);
        if (!client) {
            throw new Error('Client not found');
        }

        const episodes = Array.isArray(client.asamEpisodes) ? [...client.asamEpisodes] : [];
        const todayStr = new Date().toISOString().split('T')[0];
        const changeDate = episodeInput.changeDate || todayStr;
        const levelOfCare = episodeInput.levelOfCare || 'UNKNOWN';
        const isMhPrimary = Boolean(episodeInput.isMhPrimary);
        const kipuDocId = episodeInput.kipuDocId || null;
        const notes = episodeInput.notes || '';

        // Close any active episode
        const active = episodes.find(ep => !ep.endDate);
        if (active) {
            active.endDate = changeDate;
            if (levelOfCare && !active.nextLevel) {
                active.nextLevel = levelOfCare;
            }
        }

        // Determine source
        const source = episodeInput.source || (episodes.length === 0 ? 'admission' : 'stepDownEmail');

        // Create new episode starting on the LOC change date
        const newEpisode = {
            id: 'episode_' + Date.now(),
            levelOfCare,
            startDate: changeDate,
            endDate: null,
            source,
            isMhPrimary,
            kipuDocId,
            notes
        };

        episodes.push(newEpisode);

        // Persist episodes; updateClient will re-sync task schema so ASAM due dates update
        const updatedClient = await this.updateClient(clientId, { asamEpisodes: episodes });
        return updatedClient;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DISCHARGE BLOCKER MODAL
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Show discharge blocker modal if requirements not met
     * @param {string} clientId - Client ID
     * @param {Object} options - { onOverride, onCancel }
     * @returns {boolean} True if discharge can proceed, false if blocked
     */
    showDischargeBlockerIfNeeded(clientId, options = {}) {
        const readiness = this.validateDischargeReadiness(clientId);
        
        if (readiness.canDischarge) {
            return true; // No blocker needed
        }
        
        this.showDischargeBlockerModal(readiness, options);
        return false;
    }
    
    /**
     * Show the discharge blocker modal
     * @param {Object} readiness - Result from validateDischargeReadiness
     * @param {Object} options - { onOverride, onCancel }
     */
    showDischargeBlockerModal(readiness, options = {}) {
        // Remove existing modal if any
        const existing = document.getElementById('dischargeBlockerModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'dischargeBlockerModal';
        modal.className = 'discharge-blocker-overlay';
        
        // Check if user is admin for override capability
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const isAdmin = currentUser.role === 'admin' || currentUser.permissions?.includes('admin');
        
        modal.innerHTML = `
            <div class="discharge-blocker-modal">
                <div class="discharge-blocker-header">
                    <span class="discharge-blocker-icon">⛔</span>
                    <h3 class="discharge-blocker-title">Cannot Complete Discharge</h3>
                </div>
                
                <div class="discharge-blocker-content">
                    <p class="discharge-blocker-subtitle">
                        The following required items are incomplete for 
                        <strong>${readiness.client?.initials || 'this client'}</strong>:
                    </p>
                    
                    <div class="discharge-blocker-items">
                        ${readiness.missingItems.map(item => `
                            <div class="discharge-blocker-item discharge-blocker-item--missing">
                                <span class="discharge-blocker-item-icon">❌</span>
                                <span class="discharge-blocker-item-text">${item}</span>
                            </div>
                        `).join('')}
                        
                        ${readiness.completedItems.map(item => `
                            <div class="discharge-blocker-item discharge-blocker-item--complete">
                                <span class="discharge-blocker-item-icon">✅</span>
                                <span class="discharge-blocker-item-text">${item}</span>
                            </div>
                        `).join('')}
                    </div>
                    
                    ${readiness.warnings.length > 0 ? `
                        <div class="discharge-blocker-warnings">
                            <div class="discharge-blocker-warnings-title">⚠️ Warnings:</div>
                            ${readiness.warnings.map(w => `<div class="discharge-blocker-warning">• ${w}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="discharge-blocker-footer">
                    <button class="discharge-blocker-btn discharge-blocker-btn--primary" onclick="window.clientManager.closeDischargeBlocker('profile')">
                        Go to Client Profile
                    </button>
                    ${isAdmin ? `
                        <button class="discharge-blocker-btn discharge-blocker-btn--danger" onclick="window.clientManager.showOverridePrompt()">
                            Override (Admin Only)
                        </button>
                    ` : ''}
                    <button class="discharge-blocker-btn discharge-blocker-btn--ghost" onclick="window.clientManager.closeDischargeBlocker('cancel')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
        
        // Store options for callbacks
        this._dischargeBlockerOptions = options;
        this._dischargeBlockerClientId = readiness.client?.id;
        
        // Add styles if not present
        this.injectDischargeBlockerStyles();
        
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeDischargeBlocker('cancel');
            }
        });
    }
    
    /**
     * Close the discharge blocker modal
     * @param {string} action - 'profile' | 'cancel' | 'override'
     */
    closeDischargeBlocker(action) {
        const modal = document.getElementById('dischargeBlockerModal');
        if (modal) modal.remove();
        
        const options = this._dischargeBlockerOptions || {};
        const clientId = this._dischargeBlockerClientId;
        
        if (action === 'profile' && clientId) {
            // Open client profile
            if (window.clientProfileManager) {
                window.clientProfileManager.open(clientId, 'tracking');
            } else if (window.viewClientDetails) {
                window.viewClientDetails(clientId);
            }
        } else if (action === 'cancel' && typeof options.onCancel === 'function') {
            options.onCancel();
        }
        
        this._dischargeBlockerOptions = null;
        this._dischargeBlockerClientId = null;
    }
    
    /**
     * Show override prompt for admin users
     */
    showOverridePrompt() {
        const reason = prompt('Enter reason for override (required for audit trail):');
        
        if (reason && reason.trim()) {
            // Log the override
            console.log('⚠️ Discharge override by admin:', {
                clientId: this._dischargeBlockerClientId,
                reason: reason.trim(),
                timestamp: new Date().toISOString(),
                user: JSON.parse(localStorage.getItem('currentUser') || '{}').username
            });
            
            // Log to analytics if available
            if (window.analyticsHooks) {
                window.analyticsHooks.logEvent('discharge_override', {
                    clientId: this._dischargeBlockerClientId,
                    reason: reason.trim()
                });
            }
            
            // Call override callback
            const options = this._dischargeBlockerOptions || {};
            if (typeof options.onOverride === 'function') {
                options.onOverride(reason.trim());
            }
            
            this.closeDischargeBlocker('override');
        }
    }
    
    /**
     * Inject styles for discharge blocker modal
     */
    injectDischargeBlockerStyles() {
        if (document.getElementById('discharge-blocker-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'discharge-blocker-styles';
        style.textContent = `
            .discharge-blocker-overlay {
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
                padding: 1rem;
            }
            
            .discharge-blocker-modal {
                background: #1e293b;
                border-radius: 16px;
                box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                width: 100%;
                max-width: 500px;
                border: 1px solid #334155;
                border-top: 4px solid #ef4444;
            }
            
            .discharge-blocker-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid #334155;
            }
            
            .discharge-blocker-icon {
                font-size: 1.75rem;
            }
            
            .discharge-blocker-title {
                font-size: 1.2rem;
                font-weight: 600;
                color: #f1f5f9;
                margin: 0;
            }
            
            .discharge-blocker-content {
                padding: 1.5rem;
            }
            
            .discharge-blocker-subtitle {
                color: #94a3b8;
                margin: 0 0 1rem 0;
                font-size: 0.95rem;
            }
            
            .discharge-blocker-items {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                margin-bottom: 1rem;
            }
            
            .discharge-blocker-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                font-size: 0.9rem;
            }
            
            .discharge-blocker-item--missing {
                background: rgba(239, 68, 68, 0.1);
                border: 1px solid rgba(239, 68, 68, 0.3);
                color: #fca5a5;
            }
            
            .discharge-blocker-item--complete {
                background: rgba(34, 197, 94, 0.1);
                border: 1px solid rgba(34, 197, 94, 0.3);
                color: #86efac;
            }
            
            .discharge-blocker-item-icon {
                font-size: 1rem;
            }
            
            .discharge-blocker-item-text {
                flex: 1;
            }
            
            .discharge-blocker-warnings {
                background: rgba(245, 158, 11, 0.1);
                border: 1px solid rgba(245, 158, 11, 0.3);
                border-radius: 8px;
                padding: 1rem;
            }
            
            .discharge-blocker-warnings-title {
                font-weight: 600;
                color: #fbbf24;
                margin-bottom: 0.5rem;
            }
            
            .discharge-blocker-warning {
                color: #fcd34d;
                font-size: 0.85rem;
                margin-left: 0.5rem;
            }
            
            .discharge-blocker-footer {
                display: flex;
                gap: 0.75rem;
                padding: 1rem 1.5rem;
                border-top: 1px solid #334155;
                background: #0f172a;
                border-radius: 0 0 16px 16px;
            }
            
            .discharge-blocker-btn {
                padding: 0.75rem 1.25rem;
                border-radius: 8px;
                font-size: 0.9rem;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                border: none;
            }
            
            .discharge-blocker-btn--primary {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                flex: 1;
            }
            
            .discharge-blocker-btn--primary:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }
            
            .discharge-blocker-btn--danger {
                background: rgba(239, 68, 68, 0.2);
                color: #fca5a5;
                border: 1px solid rgba(239, 68, 68, 0.3);
            }
            
            .discharge-blocker-btn--danger:hover {
                background: rgba(239, 68, 68, 0.3);
            }
            
            .discharge-blocker-btn--ghost {
                background: transparent;
                color: #94a3b8;
            }
            
            .discharge-blocker-btn--ghost:hover {
                color: #f1f5f9;
                background: rgba(255, 255, 255, 0.05);
            }
        `;
        document.head.appendChild(style);
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

