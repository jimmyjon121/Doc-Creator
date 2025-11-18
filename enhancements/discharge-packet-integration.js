/**
 * Discharge Packet Integration Enhancement
 * Adds discharge packet button to client details, auto-populates with client data, updates tracker on completion
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.documentGenerator || !window.showClientDetailsModal || !window.clientManager) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        integrateDischargePacket();
    }
    
    function integrateDischargePacket() {
        // Override showClientDetailsModal to add discharge packet button
        const originalShowClientDetailsModal = window.showClientDetailsModal;
        
        window.showClientDetailsModal = async function(client) {
            // Call original function
            await originalShowClientDetailsModal.call(this, client);
            
            // Wait for modal to render
            setTimeout(() => {
                addDischargePacketButton(client);
            }, 200);
        };
        
        /**
         * Add discharge packet button to client details modal
         */
        function addDischargePacketButton(client) {
            const modal = document.getElementById('globalModal') || document.querySelector('.modal');
            if (!modal) return;
            
            // Check if button already exists
            if (modal.querySelector('.discharge-packet-btn')) return;
            
            // Find a good place to add the button - look for action buttons or document section
            const actionsSection = modal.querySelector('.client-actions') || 
                                 modal.querySelector('.modal-actions') ||
                                 modal.querySelector('.client-documents-section');
            
            let buttonContainer;
            
            if (actionsSection) {
                // Add button to existing actions section
                buttonContainer = actionsSection;
            } else {
                // Create new actions section
                const modalBody = modal.querySelector('.modal-body') || modal.querySelector('.modal-content');
                if (modalBody) {
                    buttonContainer = document.createElement('div');
                    buttonContainer.className = 'discharge-packet-section';
                    modalBody.appendChild(buttonContainer);
                } else {
                    return; // Can't find a place to add it
                }
            }
            
            // Check if discharge packet is already completed
            const daysInCare = window.daysBetween(client.admissionDate) || 0;
            const isCompleted = client.dischargePacketUploaded;
            const isRecommended = daysInCare >= 25; // Discharge packet min day
            
            // Create button
            const button = document.createElement('button');
            button.className = `btn discharge-packet-btn ${isCompleted ? 'btn-success' : 'btn-primary'}`;
            button.innerHTML = isCompleted 
                ? '✅ Discharge Packet Generated' 
                : '📦 Generate Discharge Packet';
            button.title = isCompleted 
                ? 'Discharge packet already generated'
                : 'Generate discharge packet for this client';
            
            if (!isCompleted && isRecommended) {
                button.onclick = () => generateDischargePacketForClient(client);
            } else if (!isCompleted) {
                button.disabled = true;
                button.title = `Discharge packet available after day 25 (currently day ${daysInCare})`;
            } else {
                button.onclick = () => {
                    window.showNotification('Discharge packet already generated', 'info');
                };
            }
            
            // Insert button
            if (buttonContainer.classList.contains('discharge-packet-section')) {
                buttonContainer.innerHTML = `
                    <h4>📦 Discharge Packet</h4>
                    <p class="discharge-packet-info">
                        ${isCompleted 
                            ? `Generated on ${window.formatDate(client.dischargePacketUploadedDate)}`
                            : isRecommended
                                ? 'Ready to generate discharge packet'
                                : `Available after day 25 (currently day ${daysInCare})`
                        }
                    </p>
                `;
                buttonContainer.appendChild(button);
            } else {
                // Insert at beginning of container
                buttonContainer.insertBefore(button, buttonContainer.firstChild);
            }
        }
        
        /**
         * Generate discharge packet for a specific client (skips client selection)
         */
        async function generateDischargePacketForClient(client) {
            try {
                // Verify client still exists and is active
                const currentClient = await window.clientManager.getClient(client.id);
                if (!currentClient) {
                    window.showNotification('Client not found', 'error');
                    return;
                }
                
                if (currentClient.status !== 'active') {
                    window.showNotification('Can only generate discharge packets for active clients', 'warning');
                    return;
                }
                
                // Check if already completed
                if (currentClient.dischargePacketUploaded) {
                    const confirmed = confirm('Discharge packet already generated. Generate another?');
                    if (!confirmed) return;
                }
                
                // Close client details modal
                window.closeModal();
                
                // Show confirmation dialog
                const daysInCare = window.daysBetween(currentClient.admissionDate) || 0;
                const confirmed = await showDischargePacketConfirmation(currentClient, daysInCare);
                
                if (!confirmed) return;
                
                // Start workflow directly with client and document type pre-selected
                window.documentGenerator.activeWorkflow = {
                    clientId: currentClient.id,
                    client: currentClient,
                    documentType: 'discharge-packet',
                    programs: [] // Will be selected in next step
                };
                
                // Skip to program selection (step 3)
                await window.documentGenerator.selectPrograms();
                
            } catch (error) {
                console.error('Error generating discharge packet:', error);
                window.showNotification('Failed to generate discharge packet', 'error');
            }
        }
        
        /**
         * Show confirmation dialog for discharge packet generation
         */
        async function showDischargePacketConfirmation(client, daysInCare) {
            return new Promise((resolve) => {
                const content = `
                    <div class="discharge-packet-confirmation">
                        <div class="confirmation-header">
                            <h4>📦 Generate Discharge Packet</h4>
                        </div>
                        
                        <div class="client-summary">
                            <div class="summary-row">
                                <span class="label">Client:</span>
                                <span class="value">${client.initials}</span>
                            </div>
                            <div class="summary-row">
                                <span class="label">House:</span>
                                <span class="value">${client.houseId || 'No House'}</span>
                            </div>
                            <div class="summary-row">
                                <span class="label">Days in Care:</span>
                                <span class="value">${daysInCare}</span>
                            </div>
                            ${client.dischargeDate ? `
                                <div class="summary-row">
                                    <span class="label">Discharge Date:</span>
                                    <span class="value">${window.formatDate(client.dischargeDate)}</span>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="confirmation-info">
                            <p>This will generate a complete discharge packet for <strong>${client.initials}</strong>.</p>
                            <p>The following will be included:</p>
                            <ul>
                                <li>Discharge summary</li>
                                <li>Treatment completion details</li>
                                <li>Aftercare recommendations</li>
                                <li>Follow-up instructions</li>
                            </ul>
                            <p class="tracker-note">✓ The client tracker will be automatically updated upon completion.</p>
                        </div>
                    </div>
                `;
                
                window.showModal({
                    title: 'Generate Discharge Packet',
                    content: content,
                    size: 'medium',
                    buttons: [
                        {
                            text: 'Cancel',
                            action: () => {
                                window.closeModal();
                                resolve(false);
                            }
                        },
                        {
                            text: 'Continue',
                            primary: true,
                            action: () => {
                                window.closeModal();
                                resolve(true);
                            }
                        }
                    ]
                });
            });
        }
        
        // Also add quick access from client cards if they exist
        if (window.dashboardWidgets) {
            const originalRenderClient = window.dashboardWidgets.renderClient;
            if (originalRenderClient) {
                window.dashboardWidgets.renderClient = function(client) {
                    let html = originalRenderClient.call(this, client);
                    
                    // Add discharge packet quick button if eligible
                    const daysInCare = window.daysBetween(client.admissionDate) || 0;
                    const isEligible = daysInCare >= 25 && !client.dischargePacketUploaded;
                    
                    if (isEligible) {
                        const buttonHtml = `
                            <button class="btn-discharge-packet-quick" 
                                    onclick="window.generateDischargePacketQuick('${client.id}')"
                                    title="Generate discharge packet for ${client.initials}">
                                📦
                            </button>
                        `;
                        
                        // Insert button in client card actions
                        const insertPos = html.lastIndexOf('</div>');
                        if (insertPos > 0) {
                            html = html.slice(0, insertPos) + buttonHtml + html.slice(insertPos);
                        }
                    }
                    
                    return html;
                };
            }
        }
        
        // Quick access function for client cards
        window.generateDischargePacketQuick = async function(clientId) {
            try {
                const client = await window.clientManager.getClient(clientId);
                if (!client) {
                    window.showNotification('Client not found', 'error');
                    return;
                }
                
                await generateDischargePacketForClient(client);
            } catch (error) {
                console.error('Error generating discharge packet:', error);
                window.showNotification('Failed to generate discharge packet', 'error');
            }
        };
        
        // Add styles
        if (!document.querySelector('#discharge-packet-integration-styles')) {
            const styles = document.createElement('style');
            styles.id = 'discharge-packet-integration-styles';
            styles.textContent = `
                /* Discharge Packet Section */
                .discharge-packet-section {
                    margin-top: 20px;
                    padding: 16px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border: 1px solid #e5e7eb;
                }
                
                .discharge-packet-section h4 {
                    margin: 0 0 8px 0;
                    color: #1f2937;
                    font-size: 16px;
                }
                
                .discharge-packet-info {
                    margin: 0 0 12px 0;
                    color: #6b7280;
                    font-size: 14px;
                }
                
                .discharge-packet-btn {
                    width: 100%;
                    margin-top: 8px;
                    padding: 12px;
                    font-size: 15px;
                    font-weight: 500;
                }
                
                .discharge-packet-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
                
                /* Quick button in client cards */
                .btn-discharge-packet-quick {
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 6px 10px;
                    cursor: pointer;
                    font-size: 16px;
                    transition: all 0.2s;
                    margin-left: 4px;
                }
                
                .btn-discharge-packet-quick:hover {
                    background: #5568d3;
                    transform: scale(1.05);
                }
                
                /* Confirmation Dialog */
                .discharge-packet-confirmation {
                    padding: 0;
                }
                
                .confirmation-header {
                    margin-bottom: 20px;
                }
                
                .confirmation-header h4 {
                    margin: 0;
                    color: #1f2937;
                }
                
                .client-summary {
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .summary-row:last-child {
                    margin-bottom: 0;
                }
                
                .summary-row .label {
                    font-weight: 500;
                    color: #6b7280;
                }
                
                .summary-row .value {
                    color: #1f2937;
                    font-weight: 500;
                }
                
                .confirmation-info {
                    margin-bottom: 20px;
                }
                
                .confirmation-info p {
                    margin-bottom: 12px;
                    color: #374151;
                    line-height: 1.6;
                }
                
                .confirmation-info ul {
                    margin: 12px 0 12px 20px;
                    color: #374151;
                }
                
                .confirmation-info li {
                    margin-bottom: 6px;
                }
                
                .tracker-note {
                    margin-top: 16px;
                    padding: 12px;
                    background: #eff6ff;
                    border-left: 4px solid #3b82f6;
                    border-radius: 4px;
                    color: #1e40af;
                    font-weight: 500;
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Discharge packet integration initialized');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();


