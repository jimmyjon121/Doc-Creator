/**
 * Document Generator UI Integration
 * Adds document generation buttons throughout the UI
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.documentGenerator || !window.dashboardWidgets || !window.clientManager) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        integrateDocumentGenerator();
    }
    
    function integrateDocumentGenerator() {
        // Add document generation button to dashboard header
        const addDashboardButton = () => {
            const dashboardControls = document.querySelector('.dashboard-controls');
            if (dashboardControls && !document.querySelector('#btnGenerateDoc')) {
                const button = document.createElement('button');
                button.id = 'btnGenerateDoc';
                button.className = 'btn btn-primary';
                button.innerHTML = '📄 Generate Document';
                button.onclick = () => window.generateDocument();
                
                // Insert before the first button
                const firstButton = dashboardControls.querySelector('button');
                if (firstButton) {
                    dashboardControls.insertBefore(button, firstButton);
                } else {
                    dashboardControls.appendChild(button);
                }
            }
        };
        
        // Enhance client cards with quick document generation
        const originalRenderClient = window.dashboardWidgets?.renderClient;
        if (originalRenderClient) {
            window.dashboardWidgets.renderClient = function(client) {
                let html = originalRenderClient.call(this, client);
                
                // Add document generation button to client card actions
                const daysInCare = window.daysBetween(client.admissionDate) || 0;
                const hasRecommendedDocs = window.documentGenerator.getRecommendedDocuments(client, daysInCare).length > 0;
                
                if (hasRecommendedDocs) {
                    const buttonHtml = `
                        <button class="btn-doc-gen-quick" 
                                onclick="window.generateDocument('${client.id}')"
                                title="Generate document for ${client.initials}">
                            📄
                        </button>
                    `;
                    
                    // Insert button before the last closing div
                    const insertPos = html.lastIndexOf('</div>');
                    html = html.slice(0, insertPos) + buttonHtml + html.slice(insertPos);
                }
                
                return html;
            };
        }
        
        // Override the quickGenerateDoc to use our new system
        if (window.dashboardWidgets?.quickGenerateDoc) {
            window.dashboardWidgets.quickGenerateDoc = function() {
                window.generateDocument();
            };
        }
        
        // Add keyboard shortcut (Ctrl+D for document)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                window.generateDocument();
            }
        });
        
        // Listen for document generation events to refresh dashboard
        window.addEventListener('document:generated', (e) => {
            console.log('Document generated:', e.detail);
            
            // Refresh dashboard if available
            if (window.dashboardManager) {
                window.dashboardManager.refreshDashboard();
            }
            
            // Update tracker display if visible
            const trackerModal = document.querySelector('.tracker-modal');
            if (trackerModal) {
                const clientId = e.detail.clientId;
                // Refresh tracker display
                if (window.TrackerBulkUpdate?.instance) {
                    window.TrackerBulkUpdate.instance.loadClients();
                }
            }
        });
        
        // Add document generation to client details modal
        const originalShowClientDetailsModal = window.showClientDetailsModal;
        if (originalShowClientDetailsModal) {
            window.showClientDetailsModal = async function(client) {
                // Call original function
                await originalShowClientDetailsModal.call(this, client);
                
                // Add document section to the modal after a delay
                setTimeout(() => {
                    const modalBody = document.querySelector('.modal-body');
                    if (modalBody && !modalBody.querySelector('.client-documents-section')) {
                        const documents = window.documentGenerator.getClientDocuments(client.id);
                        const daysInCare = window.daysBetween(client.admissionDate) || 0;
                        const recommended = window.documentGenerator.getRecommendedDocuments(client, daysInCare);
                        
                        const documentsHtml = `
                            <div class="client-documents-section">
                                <h4>📄 Documents</h4>
                                
                                ${recommended.length > 0 ? `
                                    <div class="recommended-documents">
                                        <h5>Recommended Documents</h5>
                                        <div class="doc-recommendations">
                                            ${recommended.map(doc => `
                                                <button class="btn-doc-recommend" 
                                                        onclick="window.generateDocument('${client.id}', '${doc.key}')">
                                                    ${doc.icon} ${doc.name}
                                                </button>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                <div class="document-history">
                                    <h5>Document History</h5>
                                    ${documents.length > 0 ? `
                                        <div class="doc-history-list">
                                            ${documents.map(doc => `
                                                <div class="doc-history-item">
                                                    <span class="doc-icon">${window.documentGenerator.documentTypes[doc.type]?.icon || '📄'}</span>
                                                    <span class="doc-name">${doc.name}</span>
                                                    <span class="doc-date">${window.formatDate(doc.createdAt)}</span>
                                                    <button class="btn-doc-action" onclick="window.documentGenerator.viewDocument('${doc.id}')">View</button>
                                                </div>
                                            `).join('')}
                                        </div>
                                    ` : '<p class="no-documents">No documents generated yet</p>'}
                                    
                                    <button class="btn btn-primary btn-sm" onclick="window.generateDocument('${client.id}')">
                                        Generate New Document
                                    </button>
                                </div>
                            </div>
                        `;
                        
                        modalBody.insertAdjacentHTML('beforeend', documentsHtml);
                    }
                }, 200);
            };
        }
        
        // Add styles
        if (!document.querySelector('#document-generator-ui-styles')) {
            const styles = document.createElement('style');
            styles.id = 'document-generator-ui-styles';
            styles.textContent = `
                /* Dashboard button */
                #btnGenerateDoc {
                    margin-right: 8px;
                }
                
                /* Client card quick button */
                .btn-doc-gen-quick {
                    position: absolute;
                    top: 8px;
                    right: 40px;
                    background: var(--ccp-primary-100);
                    border: 1px solid var(--ccp-primary-300);
                    border-radius: 6px;
                    padding: 4px 8px;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-doc-gen-quick:hover {
                    background: var(--ccp-primary-200);
                    transform: translateY(-1px);
                }
                
                /* Client documents section */
                .client-documents-section {
                    margin-top: 24px;
                    padding-top: 24px;
                    border-top: 2px solid #e5e7eb;
                }
                
                .client-documents-section h4 {
                    margin: 0 0 16px 0;
                    color: #1f2937;
                }
                
                .client-documents-section h5 {
                    margin: 0 0 12px 0;
                    color: #374151;
                    font-size: 16px;
                }
                
                .recommended-documents {
                    background: #f0f9ff;
                    padding: 16px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                
                .doc-recommendations {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                }
                
                .btn-doc-recommend {
                    background: white;
                    border: 1px solid #3b82f6;
                    color: #3b82f6;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 14px;
                }
                
                .btn-doc-recommend:hover {
                    background: #3b82f6;
                    color: white;
                }
                
                .document-history {
                    background: #f9fafb;
                    padding: 16px;
                    border-radius: 8px;
                }
                
                .doc-history-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    margin-bottom: 16px;
                }
                
                .doc-history-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    background: white;
                    border-radius: 6px;
                    border: 1px solid #e5e7eb;
                }
                
                .doc-history-item .doc-icon {
                    font-size: 20px;
                }
                
                .doc-history-item .doc-name {
                    flex: 1;
                    font-size: 14px;
                }
                
                .doc-history-item .doc-date {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .btn-doc-action {
                    background: none;
                    border: 1px solid #e5e7eb;
                    padding: 4px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .btn-doc-action:hover {
                    background: #f3f4f6;
                    border-color: #d1d5db;
                }
                
                .no-documents {
                    text-align: center;
                    color: #6b7280;
                    font-style: italic;
                    margin: 16px 0;
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Initialize dashboard button after DOM updates
        setTimeout(addDashboardButton, 500);
        
        // Re-add button when dashboard refreshes
        const observer = new MutationObserver(() => {
            addDashboardButton();
        });
        
        const dashboardContainer = document.querySelector('#dashboardTab');
        if (dashboardContainer) {
            observer.observe(dashboardContainer, { childList: true, subtree: true });
        }
        
        console.log('✅ Document Generator UI integration complete');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();
