/**
 * Document Generator Module
 * Central document generation system for CareConnect Pro
 */

class DocumentGenerator {
    constructor() {
        this.documentTypes = {
            'aftercare-options': {
                name: 'Aftercare Options',
                icon: '📋',
                description: 'Compare aftercare programs for family',
                minDay: 14,
                requiresPrograms: true,
                trackerFields: {
                    complete: 'optionsDocUploaded',
                    date: 'optionsDocUploadedDate'
                }
            },
            'aftercare-plan': {
                name: 'Aftercare Plan',
                icon: '📄',
                description: 'Detailed placement plan',
                minDay: 21,
                requiresPrograms: true,
                trackerFields: {
                    complete: 'aftercarePlanCreated',
                    date: 'aftercarePlanCreatedDate'
                }
            },
            'discharge-packet': {
                name: 'Discharge Packet',
                icon: '📦',
                description: 'Complete discharge documentation',
                minDay: 25,
                requiresPrograms: false,
                trackerFields: {
                    complete: 'dischargePacketUploaded',
                    date: 'dischargePacketUploadedDate'
                }
            }
        };
        
        this.activeWorkflow = null;
        this.generatedDocuments = [];
        
        // Ensure documents are persisted
        this.loadDocumentsFromStorage();
    }
    
    /**
     * Start document generation workflow
     * @param {string} clientId - Optional client ID to preselect
     * @param {string} documentType - Optional document type to preselect
     */
    async startWorkflow(clientId = null, documentType = null) {
        this.activeWorkflow = {
            clientId: clientId,
            documentType: documentType,
            programs: [],
            generatedDocument: null
        };
        
        // If both are provided, skip to program selection or generation
        if (clientId && documentType) {
            const client = await window.clientManager.getClient(clientId);
            if (!client) {
                window.showNotification('Client not found', 'error');
                return;
            }
            
            this.activeWorkflow.client = client;
            
            if (this.documentTypes[documentType].requiresPrograms) {
                await this.selectPrograms();
            } else {
                await this.generateDocument();
            }
        }
        // If only client provided, select document type
        else if (clientId) {
            const client = await window.clientManager.getClient(clientId);
            if (!client) {
                window.showNotification('Client not found', 'error');
                return;
            }
            
            this.activeWorkflow.client = client;
            await this.selectDocumentType();
        }
        // Otherwise start from client selection
        else {
            await this.selectClient();
        }
    }
    
    /**
     * Step 1: Select client
     */
    async selectClient() {
        try {
            const clients = await window.clientManager.getAllClients();
            const activeClients = clients.filter(c => c.status === 'active');
            
            if (activeClients.length === 0) {
                window.showNotification('No active clients found', 'warning');
                return;
            }
            
            // Sort by days in care (newest first)
            activeClients.sort((a, b) => {
                const daysA = window.daysBetween(a.admissionDate) || 0;
                const daysB = window.daysBetween(b.admissionDate) || 0;
                return daysB - daysA;
            });
            
            const content = `
                <div class="doc-gen-step">
                    <div class="step-header">
                        <h4>Step 1: Select Client</h4>
                        <span class="step-indicator">1 of 3</span>
                    </div>
                    
                    <div class="client-grid">
                        ${activeClients.map(client => {
                            const days = window.daysBetween(client.admissionDate) || 0;
                            const completion = window.trackerEngine?.getCompletionScore(client).percentage || 0;
                            
                            return `
                                <div class="client-card-select" data-client-id="${client.id}">
                                    <div class="client-header">
                                        <span class="client-initials">${client.initials}</span>
                                        <span class="client-house">${client.houseId || 'No House'}</span>
                                    </div>
                                    <div class="client-info">
                                        <div class="info-row">
                                            <span class="label">Days in Care:</span>
                                            <span class="value">${days}</span>
                                        </div>
                                        <div class="info-row">
                                            <span class="label">Tracker:</span>
                                            <span class="value">${completion}%</span>
                                        </div>
                                    </div>
                                    ${this.getRecommendedDocuments(client, days).length > 0 ? `
                                        <div class="recommended-docs">
                                            <span class="rec-label">Recommended:</span>
                                            ${this.getRecommendedDocuments(client, days).map(doc => 
                                                `<span class="rec-doc">${doc.icon}</span>`
                                            ).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
            
            window.showModal({
                title: '📄 Generate Document',
                content: content,
                size: 'large',
                closeOnOverlay: false,
                buttons: [
                    {
                        text: 'Cancel',
                        action: () => {
                            this.activeWorkflow = null;
                            window.closeModal();
                        }
                    }
                ]
            });
            
            // Add click handlers
            document.querySelectorAll('.client-card-select').forEach(card => {
                card.addEventListener('click', async (e) => {
                    const clientId = e.currentTarget.dataset.clientId;
                    this.activeWorkflow.clientId = clientId;
                    this.activeWorkflow.client = await window.clientManager.getClient(clientId);
                    window.closeModal();
                    await this.selectDocumentType();
                });
            });
            
        } catch (error) {
            console.error('Error selecting client:', error);
            window.showNotification('Failed to load clients', 'error');
        }
    }
    
    /**
     * Step 2: Select document type
     */
    async selectDocumentType() {
        const client = this.activeWorkflow.client;
        const days = window.daysBetween(client.admissionDate) || 0;
        
        const content = `
            <div class="doc-gen-step">
                <div class="step-header">
                    <h4>Step 2: Select Document Type</h4>
                    <span class="step-indicator">2 of 3</span>
                </div>
                
                <div class="selected-client-summary">
                    <strong>Client:</strong> ${client.initials} - ${client.houseId} (Day ${days})
                </div>
                
                <div class="document-types-grid">
                    ${Object.entries(this.documentTypes).map(([key, type]) => {
                        const isRecommended = days >= type.minDay;
                        const isCompleted = client[type.trackerFields.complete];
                        
                        return `
                            <div class="doc-type-card ${isRecommended ? 'recommended' : ''} ${isCompleted ? 'completed' : ''}" 
                                 data-type="${key}">
                                <div class="type-icon">${type.icon}</div>
                                <div class="type-name">${type.name}</div>
                                <div class="type-desc">${type.description}</div>
                                ${isRecommended ? '<span class="badge-rec">Recommended</span>' : ''}
                                ${isCompleted ? '<span class="badge-complete">✓ Completed</span>' : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="document-history">
                    <h5>Recent Documents</h5>
                    ${this.getClientDocuments(client.id).length > 0 ? `
                        <div class="history-list">
                            ${this.getClientDocuments(client.id).slice(0, 5).map(doc => `
                                <div class="history-item">
                                    <span class="doc-icon">${this.documentTypes[doc.type]?.icon || '📄'}</span>
                                    <span class="doc-name">${doc.name}</span>
                                    <span class="doc-date">${window.formatDate(doc.createdAt, true)}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : '<p class="empty-history">No documents generated yet</p>'}
                </div>
            </div>
        `;
        
        window.showModal({
            title: '📄 Generate Document',
            content: content,
            size: 'medium',
            closeOnOverlay: false,
            buttons: [
                {
                    text: 'Back',
                    action: async () => {
                        window.closeModal();
                        await this.selectClient();
                    }
                },
                {
                    text: 'Cancel',
                    action: () => {
                        this.activeWorkflow = null;
                        window.closeModal();
                    }
                }
            ]
        });
        
        // Add click handlers
        document.querySelectorAll('.doc-type-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                const type = e.currentTarget.dataset.type;
                this.activeWorkflow.documentType = type;
                window.closeModal();
                
                if (this.documentTypes[type].requiresPrograms) {
                    await this.selectPrograms();
                } else {
                    await this.generateDocument();
                }
            });
        });
    }
    
    /**
     * Step 3: Select programs (for documents that require them)
     */
    async selectPrograms() {
        // Switch to programs tab
        window.switchTab('programs');
        
        // Wait for tab to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Show instructions
        const content = `
            <div class="doc-gen-step">
                <div class="step-header">
                    <h4>Step 3: Select Programs</h4>
                    <span class="step-indicator">3 of 3</span>
                </div>
                
                <div class="selected-summary">
                    <p><strong>Client:</strong> ${this.activeWorkflow.client.initials}</p>
                    <p><strong>Document:</strong> ${this.documentTypes[this.activeWorkflow.documentType].name}</p>
                </div>
                
                <div class="instructions">
                    <p>Please select programs from the Programs tab, then click Generate.</p>
                    <p>You can add notes or modifications during the generation process.</p>
                </div>
                
                <div class="program-requirements">
                    <h5>Requirements:</h5>
                    <ul>
                        ${this.activeWorkflow.documentType === 'aftercare-options' ? 
                            '<li>Select 2-3 programs to compare</li>' : 
                            '<li>Select the final placement program</li>'
                        }
                        <li>Ensure program details are complete</li>
                        <li>Add any family preferences or notes</li>
                    </ul>
                </div>
            </div>
        `;
        
        window.showModal({
            title: '📄 Select Programs',
            content: content,
            size: 'small',
            closeOnOverlay: false,
            buttons: [
                {
                    text: 'Generate Document',
                    primary: true,
                    action: async () => {
                        window.closeModal();
                        await this.generateDocument();
                    }
                },
                {
                    text: 'Back',
                    action: async () => {
                        window.closeModal();
                        await this.selectDocumentType();
                    }
                }
            ]
        });
    }
    
    /**
     * Generate the document
     */
    async generateDocument() {
        const workflow = this.activeWorkflow;
        const client = workflow.client;
        const docType = this.documentTypes[workflow.documentType];
        
        try {
            window.showNotification(`Generating ${docType.name}...`, 'info');
            
            // Create document record
            const document = {
                id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                clientId: client.id,
                type: workflow.documentType,
                name: `${docType.name} - ${client.initials}`,
                createdAt: new Date().toISOString(),
                createdBy: window.sessionStorage.getItem('userInitials') || 'UN',
                status: 'generated',
                content: null
            };
            
            // Store document
            this.generatedDocuments.push(document);
            this.saveDocumentsToStorage();
            
            // Update tracker if applicable
            if (docType.trackerFields) {
                const updates = {};
                updates[docType.trackerFields.complete] = true;
                updates[docType.trackerFields.date] = new Date().toISOString();
                
                await window.clientManager.updateClient(client.id, updates);
                
                // Fire event for tracker update
                this.fireEvent('document:generated', {
                    clientId: client.id,
                    documentType: workflow.documentType,
                    trackerUpdates: updates
                });
            }
            
            // Show success with options
            window.showModal({
                title: '✅ Document Generated',
                content: `
                    <div class="success-message">
                        <p>${docType.name} has been generated successfully for ${client.initials}.</p>
                        <p>The client tracker has been updated automatically.</p>
                    </div>
                    
                    <div class="post-generation-actions">
                        <h5>What would you like to do next?</h5>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="window.documentGenerator.viewDocument('${document.id}')">
                                📄 View Document
                            </button>
                            <button class="action-btn" onclick="window.documentGenerator.printDocument('${document.id}')">
                                🖨️ Print Document
                            </button>
                            <button class="action-btn" onclick="window.documentGenerator.emailDocument('${document.id}')">
                                ✉️ Email Document
                            </button>
                            <button class="action-btn" onclick="window.documentGenerator.startWorkflow('${client.id}')">
                                ➕ Generate Another
                            </button>
                        </div>
                    </div>
                `,
                size: 'medium',
                buttons: [
                    {
                        text: 'Done',
                        primary: true,
                        action: () => {
                            window.closeModal();
                            window.dashboardManager?.refreshDashboard();
                        }
                    }
                ]
            });
            
        } catch (error) {
            console.error('Error generating document:', error);
            window.showNotification('Failed to generate document', 'error');
        }
    }
    
    /**
     * Get recommended documents for a client
     */
    getRecommendedDocuments(client, daysInCare) {
        const recommended = [];
        
        for (const [key, type] of Object.entries(this.documentTypes)) {
            if (daysInCare >= type.minDay && !client[type.trackerFields?.complete]) {
                recommended.push({ key, ...type });
            }
        }
        
        return recommended;
    }
    
    /**
     * Get documents for a specific client
     */
    getClientDocuments(clientId) {
        return this.generatedDocuments.filter(doc => doc.clientId === clientId);
    }
    
    /**
     * View document
     */
    viewDocument(documentId) {
        const doc = this.generatedDocuments.find(d => d.id === documentId);
        if (!doc) {
            window.showNotification('Document not found', 'error');
            return;
        }
        
        // In real implementation, this would open the actual document
        window.showNotification(`Viewing ${doc.name}`, 'info');
        console.log('View document:', doc);
    }
    
    /**
     * Print document
     */
    printDocument(documentId) {
        const doc = this.generatedDocuments.find(d => d.id === documentId);
        if (!doc) {
            window.showNotification('Document not found', 'error');
            return;
        }
        
        window.print();
        window.showNotification(`Printing ${doc.name}`, 'info');
    }
    
    /**
     * Email document
     */
    emailDocument(documentId) {
        const doc = this.generatedDocuments.find(d => d.id === documentId);
        if (!doc) {
            window.showNotification('Document not found', 'error');
            return;
        }
        
        // In real implementation, this would open email dialog
        window.showNotification('Email feature coming soon', 'info');
    }
    
    /**
     * Fire custom event
     */
    fireEvent(eventName, detail) {
        window.dispatchEvent(new CustomEvent(eventName, { detail }));
    }
    
    /**
     * Load documents from storage
     */
    loadDocumentsFromStorage() {
        const stored = localStorage.getItem('careconnect_documents');
        if (stored) {
            try {
                this.generatedDocuments = JSON.parse(stored);
            } catch (error) {
                console.error('Error loading documents:', error);
                this.generatedDocuments = [];
            }
        }
    }
    
    /**
     * Save documents to storage
     */
    saveDocumentsToStorage() {
        try {
            localStorage.setItem('careconnect_documents', JSON.stringify(this.generatedDocuments));
        } catch (error) {
            console.error('Error saving documents:', error);
        }
    }
}

// Create global instance
window.documentGenerator = new DocumentGenerator();

// Add global function for easy access
window.generateDocument = function(clientId = null, documentType = null) {
    window.documentGenerator.startWorkflow(clientId, documentType);
};

// Add styles
if (!document.querySelector('#document-generator-styles')) {
    const styles = document.createElement('style');
    styles.id = 'document-generator-styles';
    styles.textContent = `
        /* Document Generator Styles */
        .doc-gen-step {
            padding: 20px;
        }
        
        .step-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .step-header h4 {
            margin: 0;
            color: #1f2937;
        }
        
        .step-indicator {
            background: var(--ccp-primary-100);
            color: var(--ccp-primary-700);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
        }
        
        /* Client Selection Grid */
        .client-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 16px;
            max-height: 450px;
            overflow-y: auto;
        }
        
        .client-card-select {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .client-card-select:hover {
            border-color: var(--ccp-primary-300);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .client-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .client-initials {
            font-size: 20px;
            font-weight: 600;
            color: var(--ccp-primary-700);
        }
        
        .client-house {
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .client-info {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
        }
        
        .info-row .label {
            color: #6b7280;
        }
        
        .info-row .value {
            font-weight: 500;
        }
        
        .recommended-docs {
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1px solid #e5e7eb;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .rec-label {
            font-size: 12px;
            color: #6b7280;
        }
        
        .rec-doc {
            font-size: 20px;
        }
        
        /* Document Type Selection */
        .selected-client-summary {
            background: #f9fafb;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 20px;
        }
        
        .document-types-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 16px;
            margin-bottom: 24px;
        }
        
        .doc-type-card {
            background: white;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            text-align: center;
        }
        
        .doc-type-card:hover {
            border-color: var(--ccp-primary-300);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        
        .doc-type-card.recommended {
            border-color: var(--ccp-success-300);
        }
        
        .doc-type-card.completed {
            opacity: 0.7;
        }
        
        .type-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
        
        .type-name {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #1f2937;
        }
        
        .type-desc {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 12px;
        }
        
        .badge-rec {
            position: absolute;
            top: 8px;
            right: 8px;
            background: var(--ccp-success-500);
            color: white;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 12px;
            font-weight: 600;
        }
        
        .badge-complete {
            position: absolute;
            bottom: 8px;
            right: 8px;
            background: #6b7280;
            color: white;
            font-size: 11px;
            padding: 4px 8px;
            border-radius: 12px;
        }
        
        /* Document History */
        .document-history {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
        }
        
        .document-history h5 {
            margin: 0 0 12px 0;
            color: #1f2937;
        }
        
        .history-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .history-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background: white;
            border-radius: 6px;
        }
        
        .doc-icon {
            font-size: 20px;
        }
        
        .doc-name {
            flex: 1;
            font-size: 14px;
        }
        
        .doc-date {
            font-size: 12px;
            color: #6b7280;
        }
        
        .empty-history {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            margin: 0;
        }
        
        /* Instructions */
        .instructions {
            background: #eff6ff;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 20px;
        }
        
        .instructions p {
            margin: 0 0 8px 0;
            font-size: 14px;
        }
        
        .instructions p:last-child {
            margin-bottom: 0;
        }
        
        .program-requirements {
            background: #f9fafb;
            padding: 16px;
            border-radius: 8px;
        }
        
        .program-requirements h5 {
            margin: 0 0 12px 0;
            color: #1f2937;
        }
        
        .program-requirements ul {
            margin: 0;
            padding-left: 20px;
        }
        
        .program-requirements li {
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        /* Success Message */
        .success-message {
            text-align: center;
            margin-bottom: 24px;
        }
        
        .success-message p {
            margin: 0 0 8px 0;
            font-size: 16px;
        }
        
        /* Post Generation Actions */
        .post-generation-actions h5 {
            margin: 0 0 16px 0;
            text-align: center;
            color: #1f2937;
        }
        
        .action-buttons {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
        }
        
        .action-btn {
            padding: 12px 16px;
            border: 1px solid #e5e7eb;
            background: white;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }
        
        .action-btn:hover {
            background: #f9fafb;
            border-color: var(--ccp-primary-300);
        }
    `;
    document.head.appendChild(styles);
}

console.log('✅ Document Generator loaded successfully');
