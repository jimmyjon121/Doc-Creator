/**
 * Discharge Packet Integration Enhancement
 * Adds discharge packet button to client details, auto-populates with client data, updates tracker on completion
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.documentGenerator || !window.clientManager || !window.showModal) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        integrateDischargePacket();
    }
    
    function integrateDischargePacket() {
        // Enhance client details modal to include discharge packet button
        const originalShowClientDetailsModal = window.showClientDetailsModal;
        if (originalShowClientDetailsModal) {
            window.showClientDetailsModal = async function(client) {
                // Call original
                await originalShowClientDetailsModal.call(this, client);
                
                // Add discharge packet section after a delay
                setTimeout(() => {
                    addDischargePacketSection(client);
                }, 200);
            };
        }
        
        // Add discharge packet section to client details
        function addDischargePacketSection(client) {
            const modalBody = document.querySelector('.modal-body');
            if (!modalBody || modalBody.querySelector('.discharge-packet-section')) return;
            
            const daysInCare = window.daysBetween(client.admissionDate) || 0;
            const isDischargeReady = daysInCare >= 25 || client.dischargeDate;
            const isCompleted = client.dischargePacketUploaded;
            
            const section = document.createElement('div');
            section.className = 'discharge-packet-section';
            section.innerHTML = `
                <div class="discharge-packet-header">
                    <h4>📦 Discharge Packet</h4>
                    ${isCompleted ? '<span class="status-badge completed">✓ Completed</span>' : ''}
                </div>
                
                <div class="discharge-packet-info">
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="label">Days in Care:</span>
                            <span class="value">${daysInCare}</span>
                        </div>
                        ${client.dischargeDate ? `
                            <div class="info-item">
                                <span class="label">Discharge Date:</span>
                                <span class="value">${window.formatDate(client.dischargeDate)}</span>
                            </div>
                        ` : ''}
                        <div class="info-item">
                            <span class="label">Status:</span>
                            <span class="value">${isDischargeReady ? 'Ready for Discharge' : 'Not Yet Ready'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="discharge-packet-actions">
                    <button class="btn btn-primary" onclick="window.generateDischargePacket('${client.id}')">
                        ${isCompleted ? '📦 Regenerate Discharge Packet' : '📦 Generate Discharge Packet'}
                    </button>
                    ${isCompleted ? `
                        <button class="btn btn-secondary" onclick="window.viewDischargePacket('${client.id}')">
                            👁️ View Packet
                        </button>
                    ` : ''}
                    <button class="btn btn-secondary" onclick="window.openDischargeChecklist('${client.id}')">
                        📋 Discharge Checklist
                    </button>
                </div>
                
                ${isCompleted && client.dischargePacketUploadedDate ? `
                    <div class="discharge-packet-meta">
                        <small>Completed: ${window.formatDate(client.dischargePacketUploadedDate)}</small>
                    </div>
                ` : ''}
            `;
            
            modalBody.appendChild(section);
        }
        
        // Generate discharge packet with auto-populated data
        window.generateDischargePacket = async function(clientId) {
            try {
                const client = await window.clientManager.getClient(clientId);
                if (!client) {
                    window.showNotification('Client not found', 'error');
                    return;
                }
                
                // Auto-populate client data for discharge packet
                const clientData = {
                    initials: client.initials,
                    houseId: client.houseId,
                    admissionDate: client.admissionDate,
                    dischargeDate: client.dischargeDate,
                    daysInCare: window.daysBetween(client.admissionDate),
                    trackerCompletion: window.trackerEngine?.getCompletionScore(client).percentage || 0
                };
                
                // Show confirmation with pre-filled data
                const content = `
                    <div class="discharge-packet-confirm">
                        <div class="confirm-header">
                            <h4>Generate Discharge Packet</h4>
                            <p>This will create a complete discharge packet for ${client.initials}.</p>
                        </div>
                        
                        <div class="client-data-preview">
                            <h5>Client Information</h5>
                            <div class="preview-grid">
                                <div class="preview-item">
                                    <span class="preview-label">Initials:</span>
                                    <span class="preview-value">${clientData.initials}</span>
                                </div>
                                <div class="preview-item">
                                    <span class="preview-label">House:</span>
                                    <span class="preview-value">${clientData.houseId || 'No House'}</span>
                                </div>
                                <div class="preview-item">
                                    <span class="preview-label">Admission Date:</span>
                                    <span class="preview-value">${window.formatDate(clientData.admissionDate)}</span>
                                </div>
                                ${clientData.dischargeDate ? `
                                    <div class="preview-item">
                                        <span class="preview-label">Discharge Date:</span>
                                        <span class="preview-value">${window.formatDate(clientData.dischargeDate)}</span>
                                    </div>
                                ` : ''}
                                <div class="preview-item">
                                    <span class="preview-label">Days in Care:</span>
                                    <span class="preview-value">${clientData.daysInCare}</span>
                                </div>
                                <div class="preview-item">
                                    <span class="preview-label">Tracker Completion:</span>
                                    <span class="preview-value">${clientData.trackerCompletion}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="packet-checklist">
                            <h5>Packet Contents</h5>
                            <ul>
                                <li>✓ Discharge Summary</li>
                                <li>✓ Final Assessment Reports</li>
                                <li>✓ Aftercare Plan</li>
                                <li>✓ Medication List</li>
                                <li>✓ Discharge Instructions</li>
                            </ul>
                        </div>
                    </div>
                `;
                
                window.showModal({
                    title: '📦 Generate Discharge Packet',
                    content: content,
                    size: 'medium',
                    buttons: [
                        {
                            text: 'Cancel',
                            action: () => window.closeModal()
                        },
                        {
                            text: 'Generate Packet',
                            primary: true,
                            action: async () => {
                                window.closeModal();
                                
                                // Generate via document generator
                                await window.documentGenerator.startWorkflow(clientId, 'discharge-packet');
                                
                                // Update tracker
                                await window.clientManager.updateClient(clientId, {
                                    dischargePacketUploaded: true,
                                    dischargePacketUploadedDate: new Date().toISOString()
                                });
                                
                                // Fire event
                                window.eventBus?.emit('tracker:updated', {
                                    clientId,
                                    fields: ['dischargePacketUploaded'],
                                    updates: { dischargePacketUploaded: true }
                                });
                                
                                window.showNotification('Discharge packet generated and tracker updated', 'success');
                                
                                // Refresh if modal is still open
                                if (document.querySelector('.discharge-packet-section')) {
                                    setTimeout(() => {
                                        const modal = document.querySelector('.modal-body');
                                        if (modal) {
                                            modal.querySelector('.discharge-packet-section')?.remove();
                                            addDischargePacketSection(await window.clientManager.getClient(clientId));
                                        }
                                    }, 500);
                                }
                            }
                        }
                    ]
                });
                
            } catch (error) {
                console.error('Error generating discharge packet:', error);
                window.showNotification('Failed to generate discharge packet', 'error');
            }
        };
        
        // View discharge packet
        window.viewDischargePacket = async function(clientId) {
            const documents = await window.documentGenerator.getClientDocuments(clientId);
            const packet = documents.find(doc => doc.type === 'discharge-packet');
            
            if (packet) {
                window.documentGenerator.viewDocument(packet.id);
            } else {
                window.showNotification('Discharge packet not found', 'warning');
            }
        };
        
        // Open discharge checklist
        window.openDischargeChecklist = function(clientId) {
            if (window.openDischargeChecklistModal) {
                window.openDischargeChecklistModal(clientId);
            } else {
                window.showNotification('Discharge checklist feature not available', 'info');
            }
        };
        
        // Add discharge packet quick action to client cards
        const originalRenderClient = window.dashboardWidgets?.renderClient;
        if (originalRenderClient) {
            window.dashboardWidgets.renderClient = function(client) {
                let html = originalRenderClient.call(this, client);
                
                const daysInCare = window.daysBetween(client.admissionDate) || 0;
                const showDischargeButton = daysInCare >= 25 || client.dischargeDate;
                
                if (showDischargeButton) {
                    const buttonHtml = `
                        <button class="btn-discharge-packet-quick" 
                                onclick="window.generateDischargePacket('${client.id}')"
                                title="Generate discharge packet for ${client.initials}">
                            📦
                        </button>
                    `;
                    
                    // Insert before last closing div
                    const insertPos = html.lastIndexOf('</div>');
                    html = html.slice(0, insertPos) + buttonHtml + html.slice(insertPos);
                }
                
                return html;
            };
        }
        
        // Add styles
        if (!document.querySelector('#discharge-packet-integration-styles')) {
            const styles = document.createElement('style');
            styles.id = 'discharge-packet-integration-styles';
            styles.textContent = `
                /* Discharge Packet Section */
                .discharge-packet-section {
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 2px solid #e5e7eb;
                }
                
                .discharge-packet-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                }
                
                .discharge-packet-header h4 {
                    margin: 0;
                    color: #1f2937;
                }
                
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 12px;
                    font-size: 12px;
                    font-weight: 600;
                }
                
                .status-badge.completed {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .discharge-packet-info {
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                }
                
                .info-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .info-item .label {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .info-item .value {
                    font-weight: 500;
                    color: #1f2937;
                }
                
                .discharge-packet-actions {
                    display: flex;
                    gap: 12px;
                    flex-wrap: wrap;
                }
                
                .discharge-packet-meta {
                    margin-top: 12px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 12px;
                }
                
                /* Confirmation Modal */
                .discharge-packet-confirm {
                    padding: 0;
                }
                
                .confirm-header {
                    margin-bottom: 20px;
                }
                
                .confirm-header h4 {
                    margin: 0 0 8px 0;
                    color: #1f2937;
                }
                
                .confirm-header p {
                    margin: 0;
                    color: #6b7280;
                }
                
                .client-data-preview {
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .client-data-preview h5 {
                    margin: 0 0 12px 0;
                    color: #374151;
                }
                
                .preview-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
                
                .preview-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .preview-label {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .preview-value {
                    font-weight: 500;
                    color: #1f2937;
                }
                
                .packet-checklist {
                    background: #eff6ff;
                    padding: 16px;
                    border-radius: 8px;
                }
                
                .packet-checklist h5 {
                    margin: 0 0 12px 0;
                    color: #1e40af;
                }
                
                .packet-checklist ul {
                    margin: 0;
                    padding-left: 20px;
                }
                
                .packet-checklist li {
                    margin-bottom: 8px;
                    color: #1e40af;
                }
                
                /* Quick Button */
                .btn-discharge-packet-quick {
                    position: absolute;
                    top: 8px;
                    right: 80px;
                    background: var(--ccp-primary-100);
                    border: 1px solid var(--ccp-primary-300);
                    border-radius: 6px;
                    padding: 4px 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-discharge-packet-quick:hover {
                    background: var(--ccp-primary-200);
                    transform: translateY(-1px);
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Discharge packet integration complete');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();
