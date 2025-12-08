/**
 * @fileoverview Document Hub - Document status tracking and management
 * @module ui/DocumentHub
 * @status @canonical
 * 
 * PURPOSE:
 *   Visual status indicators and centralized document tracking for client records.
 *   Provides a modal interface showing document completion status, upload capabilities,
 *   and bulk document management for clinical staff.
 * 
 * DEPENDENCIES:
 *   - window.clientManager (ClientManager) - Client data access and updates
 *   - window.dashboardManager (DashboardManager) - For client card integration
 * 
 * EXPORTS TO WINDOW:
 *   - window.documentHub - Singleton instance
 *   - window.DocumentHub - Class constructor
 * 
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 3481-3973 in original)
 *   Extraction Date: December 6, 2025
 * 
 * DOCUMENT CATEGORIES:
 *   - admission: 48-Hour Admission documents
 *   - aftercare: Aftercare Planning documents
 *   - discharge: Discharge Documentation
 *   - feedback: Feedback & Surveys
 */

(function() {
    'use strict';
    
    console.log('[DocumentHub] Initializing document hub enhancements...');
    
    // Document definitions with metadata
    const documentDefinitions = [
        {
            id: 'needsAssessment',
            category: 'admission',
            label: 'Needs Assessment',
            required: true,
            dueByDay: 2,
            template: true
        },
        {
            id: 'healthPhysical',
            category: 'admission',
            label: 'Health & Physical',
            required: true,
            dueByDay: 2,
            template: true
        },
        {
            id: 'optionsDoc',
            category: 'aftercare',
            label: 'Aftercare Options Document',
            required: true,
            dueByDay: 21,
            template: true,
            requiresSignature: true
        },
        {
            id: 'dischargePacket',
            category: 'aftercare',
            label: 'Discharge Packet',
            required: true,
            dueByDay: 25,
            multipart: true
        },
        {
            id: 'dischargeSummary',
            category: 'discharge',
            label: 'Discharge Summary',
            required: true,
            dueByDay: 28,
            template: true
        },
        {
            id: 'dischargePlanningNote',
            category: 'discharge',
            label: 'Discharge Planning Note',
            required: true,
            dueByDay: 26,
            template: true
        },
        {
            id: 'dischargeASAM',
            category: 'discharge',
            label: 'Discharge ASAM',
            required: true,
            dueByDay: 28,
            template: false
        },
        {
            id: 'satisfactionSurvey',
            category: 'feedback',
            label: 'Satisfaction Survey',
            required: false,
            dueByDay: 25,
            template: true
        }
    ];
    
    // Document Hub Class
    class DocumentHub {
        constructor() {
            this.currentClient = null;
            this.initialized = false;
        }
        
        /**
         * Get document status for a client
         */
        getDocumentStatus(client, docDef) {
            const fieldName = docDef.id === 'optionsDoc' ? 'optionsDocUploaded' : 
                             docDef.id === 'dischargePacket' ? 'dischargePacketUploaded' :
                             docDef.id;
            
            const isComplete = client[fieldName];
            const completedDate = client[fieldName + 'Date'];
            const daysInCare = this.calculateDaysInCare(client.admissionDate);
            const daysToDischarge = this.calculateDaysToDischarge(client);
            
            let status = 'pending';
            let statusMessage = '';
            
            if (isComplete) {
                status = 'complete';
                statusMessage = completedDate ? 
                    `Completed ${new Date(completedDate).toLocaleDateString()}` : 
                    'Completed';
            } else if (daysInCare > docDef.dueByDay) {
                status = 'overdue';
                const daysOverdue = daysInCare - docDef.dueByDay;
                statusMessage = `Overdue by ${daysOverdue} days`;
            } else if (daysToDischarge <= 7 && docDef.required) {
                status = 'urgent';
                statusMessage = `Due in ${docDef.dueByDay - daysInCare} days`;
            } else {
                status = 'pending';
                statusMessage = `Due by day ${docDef.dueByDay}`;
            }
            
            return {
                status,
                statusMessage,
                isComplete,
                completedDate,
                daysUntilDue: docDef.dueByDay - daysInCare
            };
        }
        
        /**
         * Render document hub for a client
         */
        async renderDocumentHub(clientId) {
            try {
                this.currentClient = await window.clientManager.getClient(clientId);
                if (!this.currentClient) return;
                
                // Group documents by category
                const docsByCategory = this.groupDocumentsByCategory();
                
                // Create modal
                const modal = document.createElement('div');
                modal.className = 'document-hub-overlay';
                modal.innerHTML = `
                    <div class="document-hub-modal">
                        <div class="document-hub-header">
                            <h3>📄 Document Status: ${this.currentClient.initials}</h3>
                            <button class="close-btn" onclick="window.closeModal(this.closest('.document-hub-overlay'))">×</button>
                        </div>
                        
                        <div class="document-hub-content">
                            <div class="document-summary">
                                ${this.renderDocumentSummary()}
                            </div>
                            
                            <div class="document-categories">
                                ${Object.entries(docsByCategory).map(([category, docs]) => 
                                    this.renderDocumentCategory(category, docs)
                                ).join('')}
                            </div>
                            
                            <div class="document-actions">
                                <button class="btn-primary" onclick="documentHub.generateMissing()">
                                    Generate Missing Documents
                                </button>
                                <button class="btn-secondary" onclick="documentHub.bulkUpload()">
                                    Bulk Upload
                                </button>
                                <button class="btn-secondary" onclick="documentHub.exportChecklist()">
                                    Export Checklist
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(modal);
                
            } catch (error) {
                console.error('[DocumentHub] Error rendering document hub:', error);
            }
        }
        
        /**
         * Render document summary stats
         */
        renderDocumentSummary() {
            const stats = {
                total: documentDefinitions.length,
                complete: 0,
                pending: 0,
                overdue: 0,
                urgent: 0
            };
            
            documentDefinitions.forEach(doc => {
                const status = this.getDocumentStatus(this.currentClient, doc);
                if (status.status === 'complete') stats.complete++;
                else if (status.status === 'overdue') stats.overdue++;
                else if (status.status === 'urgent') stats.urgent++;
                else stats.pending++;
            });
            
            const completionPct = Math.round((stats.complete / stats.total) * 100);
            const completeDocs = stats.complete;
            const pendingDocs = stats.pending;
            const overdueDocs = stats.overdue;
            const urgentDocs = stats.urgent;
            
            return `
                <div class="summary-header">
                    <div class="summary-progress">
                        <div class="progress-ring" style="--progress: ${completionPct}%">
                            <span class="progress-value">${completionPct}%</span>
                        </div>
                        <span class="progress-label">Complete</span>
                    </div>
                </div>
                <div class="summary-stats">
                    <div class="summary-stat">
                        <div class="stat-value">${completeDocs}/${stats.total}</div>
                        <div class="stat-label">Completed</div>
                    </div>
                    <div class="summary-stat ${overdueDocs > 0 ? 'danger' : ''}">
                        <div class="stat-value">${overdueDocs}</div>
                        <div class="stat-label">Overdue</div>
                    </div>
                    <div class="summary-stat ${urgentDocs > 0 ? 'warning' : ''}">
                        <div class="stat-value">${urgentDocs}</div>
                        <div class="stat-label">Urgent</div>
                    </div>
                </div>
            `;
        }
        
        /**
         * Group documents by category
         */
        groupDocumentsByCategory() {
            const groups = {};
            
            documentDefinitions.forEach(docDef => {
                if (!groups[docDef.category]) {
                    groups[docDef.category] = [];
                }
                groups[docDef.category].push(docDef);
            });
            
            return groups;
        }
        
        /**
         * Render document category section
         */
        renderDocumentCategory(category, docs) {
            const categoryLabels = {
                admission: '48-Hour Admission',
                aftercare: 'Aftercare Planning',
                discharge: 'Discharge Documentation',
                feedback: 'Feedback & Surveys'
            };
            
            return `
                <div class="document-category">
                    <h4>${categoryLabels[category] || category}</h4>
                    <div class="document-list">
                        ${docs.map(doc => this.renderDocumentItem(doc)).join('')}
                    </div>
                </div>
            `;
        }
        
        /**
         * Render individual document item
         */
        renderDocumentItem(docDef) {
            const status = this.getDocumentStatus(this.currentClient, docDef);
            const statusIcon = this.getStatusIcon(status.status);
            const statusClass = `document-item ${status.status}`;
            
            return `
                <div class="${statusClass}">
                    <div class="document-icon">${statusIcon}</div>
                    <div class="document-info">
                        <div class="document-name">
                            ${docDef.label}
                            ${docDef.required ? '<span class="required-badge">Required</span>' : ''}
                            ${docDef.requiresSignature ? '<span class="signature-badge">Needs Signature</span>' : ''}
                        </div>
                        <div class="document-status">${status.statusMessage}</div>
                    </div>
                    <div class="document-actions">
                        ${status.isComplete ? `
                            <button class="btn-icon" title="View Document" onclick="documentHub.viewDocument('${docDef.id}')">
                                👁️
                            </button>
                            <button class="btn-icon" title="Replace Document" onclick="documentHub.uploadDocument('${docDef.id}')">
                                📤
                            </button>
                        ` : `
                            ${docDef.template ? `
                                <button class="btn-small" onclick="documentHub.generateDocument('${docDef.id}')">
                                    Generate
                                </button>
                            ` : ''}
                            <button class="btn-small primary" onclick="documentHub.uploadDocument('${docDef.id}')">
                                Upload
                            </button>
                        `}
                    </div>
                </div>
            `;
        }
        
        /**
         * Get status icon
         */
        getStatusIcon(status) {
            switch (status) {
                case 'complete': return '✅';
                case 'overdue': return '❌';
                case 'urgent': return '⚠️';
                default: return '○';
            }
        }
        
        /**
         * Generate missing documents
         */
        async generateMissing() {
            const missing = documentDefinitions.filter(doc => {
                const status = this.getDocumentStatus(this.currentClient, doc);
                return !status.isComplete && doc.template;
            });
            
            if (missing.length === 0) {
                alert('No missing documents with templates available');
                return;
            }
            
            alert(`Generating ${missing.length} document templates:\n${missing.map(d => d.label).join('\n')}`);
            
            // In real implementation, this would generate actual documents
            console.log('[DocumentHub] Would generate:', missing);
        }
        
        /**
         * Handle document upload
         */
        uploadDocument(docId) {
            // Create file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.pdf,.doc,.docx';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                console.log(`[DocumentHub] Would upload ${file.name} for ${docId}`);
                
                // Update client record (in real implementation, would also upload file)
                const fieldName = docId === 'optionsDoc' ? 'optionsDocUploaded' : 
                                 docId === 'dischargePacket' ? 'dischargePacketUploaded' :
                                 docId;
                
                const updates = {
                    [fieldName]: true,
                    [fieldName + 'Date']: new Date().toISOString()
                };
                
                await window.clientManager.updateClient(this.currentClient.id, updates);
                
                // Refresh modal
                document.querySelector('.document-hub-overlay').remove();
                this.renderDocumentHub(this.currentClient.id);
                
                // Show success
                this.showNotification(`${file.name} uploaded successfully`, 'success');
            };
            
            input.click();
        }
        
        /**
         * View document (placeholder)
         */
        viewDocument(docId) {
            alert(`Viewing document: ${docId}\n(In real implementation, would open document viewer)`);
        }
        
        /**
         * Generate document from template (placeholder)
         */
        generateDocument(docId) {
            const doc = documentDefinitions.find(d => d.id === docId);
            alert(`Generating ${doc.label} from template...\n(In real implementation, would create document)`);
        }
        
        /**
         * Bulk upload interface (placeholder)
         */
        bulkUpload() {
            alert('Bulk upload interface coming soon!');
        }
        
        /**
         * Export checklist (placeholder)
         */
        exportChecklist() {
            const checklist = documentDefinitions.map(doc => {
                const status = this.getDocumentStatus(this.currentClient, doc);
                return `${status.isComplete ? '☑' : '☐'} ${doc.label} - ${status.statusMessage}`;
            }).join('\n');
            
            alert(`Document Checklist for ${this.currentClient.initials}:\n\n${checklist}`);
        }
        
        /**
         * Show notification
         */
        showNotification(message, type = 'info') {
            const notification = document.createElement('div');
            notification.className = `document-notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('visible');
            }, 10);
            
            setTimeout(() => {
                notification.classList.remove('visible');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
        
        // Helper methods - use DateHelpers for consistency
        calculateDaysInCare(admissionDate) {
            // Use centralized DateHelpers if available
            if (window.DateHelpers?.calculateDaysInCare) {
                return window.DateHelpers.calculateDaysInCare(admissionDate);
            }
            // Fallback for edge cases
            if (!admissionDate) return 0;
            const admission = new Date(admissionDate);
            const today = new Date();
            const diffTime = Math.abs(today - admission);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        
        calculateDaysToDischarge(client) {
            // Use centralized DateHelpers if available
            if (window.DateHelpers?.calculateDaysUntil && client.dischargeDate) {
                return window.DateHelpers.calculateDaysUntil(client.dischargeDate);
            }
            if (!client.dischargeDate) {
                return Math.max(0, 30 - this.calculateDaysInCare(client.admissionDate));
            }
            const discharge = new Date(client.dischargeDate);
            const today = new Date();
            const diffTime = discharge - today;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
    }
    
    // Create global instance
    window.documentHub = new DocumentHub();
    
    // Add document hub button to client cards
    const addDocumentHubButtons = () => {
        const originalRenderClients = window.dashboardManager?.renderClients;
        
        if (originalRenderClients) {
            window.dashboardManager.renderClients = async function(clients, container) {
                // Call original
                await originalRenderClients.call(this, clients, container);
                
                // Add document hub buttons
                const cards = container.querySelectorAll('.client-card');
                cards.forEach((card, index) => {
                    if (clients[index] && !card.querySelector('.document-hub-btn')) {
                        const actionsContainer = card.querySelector('.client-actions') || card;
                        const btn = document.createElement('button');
                        btn.className = 'btn-small document-hub-btn';
                        btn.innerHTML = '📄 Documents';
                        btn.onclick = () => window.documentHub.renderDocumentHub(clients[index].id);
                        actionsContainer.appendChild(btn);
                    }
                });
            };
        }
    };
    
    // Initialize when dependencies are ready
    const initInterval = setInterval(() => {
        if (window.dashboardManager && window.clientManager) {
            clearInterval(initInterval);
            addDocumentHubButtons();
            console.log('[DocumentHub] Document hub enhancements ready');
        }
    }, 100);
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WINDOW EXPORTS
    // Required for static bundle compatibility. See docs/GLOBALS-REGISTRY.md
    // ═══════════════════════════════════════════════════════════════════════════
    window.DocumentHub = DocumentHub;
    
})();

