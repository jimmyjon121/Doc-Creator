/**
 * Alert Actionability Enhancement
 * Makes alerts clickable, adds bulk actions, filters, and detailed alert modals
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.dashboardWidgets || !window.dashboardManager || !window.showModal) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        enhanceAlerts();
    }
    
    function enhanceAlerts() {
        // Enhance Flight Plan widget to make alerts clickable
        const flightPlanWidget = window.dashboardWidgets?.widgets?.get('flightPlan');
        if (flightPlanWidget) {
            const originalRenderPriorityItem = flightPlanWidget.renderPriorityItem;
            
            flightPlanWidget.renderPriorityItem = function(item, zone) {
                let html = originalRenderPriorityItem.call(this, item, zone);
                
                // Make the entire item clickable
                const itemWrapper = html.match(/<div[^>]*class="[^"]*priority-item[^"]*"[^>]*>/);
                if (itemWrapper) {
                    // Add click handler and cursor pointer
                    html = html.replace(
                        /<div([^>]*class="[^"]*priority-item[^"]*"[^>]*)>/,
                        '<div$1 onclick="window.handleAlertClick(event, \'' + item.client.id + '\', \'' + item.type + '\', \'' + zone + '\')" style="cursor: pointer;">'
                    );
                    
                    // Add hover effect class
                    html = html.replace(
                        /class="([^"]*priority-item[^"]*)"/,
                        'class="$1 alert-clickable"'
                    );
                }
                
                return html;
            };
        }
        
        // Global alert click handler
        window.handleAlertClick = function(event, clientId, alertType, zone) {
            // Prevent default if clicking on action buttons
            if (event.target.closest('button')) {
                return;
            }
            
            // Show alert details modal
            showAlertDetailsModal(clientId, alertType, zone);
        };
        
        // Show alert details modal
        async function showAlertDetailsModal(clientId, alertType, zone) {
            try {
                const client = await window.clientManager.getClient(clientId);
                if (!client) {
                    window.showNotification('Client not found', 'error');
                    return;
                }
                
                // Get alert details
                const alert = getAlertDetails(client, alertType, zone);
                
                // Build modal content
                const content = `
                    <div class="alert-details-modal">
                        <div class="alert-header">
                            <div class="alert-client-info">
                                <span class="client-badge-large">${client.initials}</span>
                                <div class="client-details">
                                    <div class="client-name">${client.initials}</div>
                                    <div class="client-meta">
                                        <span>🏠 ${client.houseId || 'No House'}</span>
                                        <span>📅 Day ${window.daysBetween(client.admissionDate) || 0}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="alert-zone-badge zone-${zone}">
                                ${zone.charAt(0).toUpperCase() + zone.slice(1)} Zone
                            </div>
                        </div>
                        
                        <div class="alert-content">
                            <div class="alert-message-section">
                                <h4>Alert Details</h4>
                                <p class="alert-message">${alert.message}</p>
                                ${alert.dueDate ? `<p class="alert-due"><strong>Due:</strong> ${alert.dueDate}</p>` : ''}
                                ${alert.description ? `<p class="alert-description">${alert.description}</p>` : ''}
                            </div>
                            
                            ${alert.trackerItem ? `
                                <div class="tracker-context">
                                    <h4>Tracker Context</h4>
                                    <div class="tracker-info">
                                        <span class="tracker-label">${alert.trackerItem.label}</span>
                                        <span class="tracker-status">${alert.trackerItem.complete ? '✅ Complete' : '⏳ Pending'}</span>
                                    </div>
                                </div>
                            ` : ''}
                            
                            <div class="client-context">
                                <h4>Client Context</h4>
                                <div class="context-grid">
                                    <div class="context-item">
                                        <span class="context-label">Admission Date:</span>
                                        <span class="context-value">${window.formatDate(client.admissionDate)}</span>
                                    </div>
                                    ${client.dischargeDate ? `
                                        <div class="context-item">
                                            <span class="context-label">Discharge Date:</span>
                                            <span class="context-value">${window.formatDate(client.dischargeDate)}</span>
                                        </div>
                                    ` : ''}
                                    ${window.trackerEngine ? (() => {
                                        const score = window.trackerEngine.getCompletionScore(client);
                                        return `
                                            <div class="context-item">
                                                <span class="context-label">Tracker Completion:</span>
                                                <span class="context-value">${score.percentage}%</span>
                                            </div>
                                        `;
                                    })() : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="alert-actions-section">
                            <h4>Quick Actions</h4>
                            <div class="action-buttons-grid">
                                ${alert.isTrackerTask && alert.trackerId ? `
                                    <button class="btn btn-success" onclick="window.completeAlertFromModal('${clientId}', '${alert.trackerId || ''}')">
                                        ✓ Mark Complete
                                    </button>
                                ` : ''}
                                <button class="btn btn-primary" onclick="window.viewClientFromAlert('${clientId}')">
                                    👤 View Client Details
                                </button>
                                ${alert.canGenerateDoc ? `
                                    <button class="btn btn-secondary" onclick="window.generateDocFromAlert('${clientId}', '${alert.docType}')">
                                        📄 Generate Document
                                    </button>
                                ` : ''}
                                ${alert.canOpenTracker ? `
                                    <button class="btn btn-secondary" onclick="window.openTrackerFromAlert('${clientId}')">
                                        📊 Open Tracker
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                `;
                
                window.showModal({
                    title: '🔔 Alert Details',
                    content: content,
                    size: 'large',
                    buttons: [
                        {
                            text: 'Close',
                            primary: true,
                            action: () => window.closeModal()
                        }
                    ]
                });
                
            } catch (error) {
                console.error('Error showing alert details:', error);
                window.showNotification('Failed to load alert details', 'error');
            }
        }
        
        // Get alert details
        function getAlertDetails(client, alertType, zone) {
            const daysInCare = window.daysBetween(client.admissionDate) || 0;
            
            // Map alert types to details
            const alertMap = {
                'discharge-soon': {
                    message: `Discharge scheduled in ${daysInCare} days`,
                    dueDate: client.dischargeDate ? window.formatDate(client.dischargeDate) : null,
                    description: 'Ensure all discharge requirements are completed',
                    canGenerateDoc: true,
                    docType: 'discharge-packet',
                    canOpenTracker: true
                },
                'missing-critical': {
                    message: 'Critical tracker items are missing',
                    description: 'Complete critical items to ensure smooth discharge',
                    canOpenTracker: true,
                    isTrackerTask: true
                },
                'aftercare-due': {
                    message: 'Aftercare options document due',
                    dueDate: daysInCare >= 14 ? 'Due now' : `Due in ${14 - daysInCare} days`,
                    description: 'Generate aftercare options document for family review',
                    canGenerateDoc: true,
                    docType: 'aftercare-options'
                }
            };
            
            return alertMap[alertType] || {
                message: 'Action required',
                canOpenTracker: true
            };
        }
        
        // Action handlers
        window.completeAlertFromModal = async function(clientId, trackerId) {
            try {
                await window.dashboardWidgets.completeTrackerItem(clientId, trackerId);
                window.closeModal();
                window.showNotification('Alert item completed', 'success');
                window.dashboardManager.refreshDashboard();
            } catch (error) {
                console.error('Error completing alert:', error);
                window.showNotification('Failed to complete item', 'error');
            }
        };
        
        window.viewClientFromAlert = function(clientId) {
            window.closeModal();
            window.viewClientDetails(clientId);
        };
        
        window.generateDocFromAlert = function(clientId, docType) {
            window.closeModal();
            window.generateDocument(clientId, docType);
        };
        
        window.openTrackerFromAlert = function(clientId) {
            window.closeModal();
            // Open tracker bulk update for this client
            if (window.openBulkUpdate) {
                window.openBulkUpdate(clientId);
            } else {
                window.viewClientDetails(clientId);
            }
        };
        
        // Enhance bulk actions in viewAllAlerts
        const originalViewAllAlerts = window.dashboardWidgets.viewAllAlerts;
        window.dashboardWidgets.viewAllAlerts = async function() {
            // Call original to get the modal
            await originalViewAllAlerts.call(this);
            
            // Wait for modal to render
            setTimeout(() => {
                enhanceAlertsModal();
            }, 100);
        };
        
        function enhanceAlertsModal() {
            const modal = document.getElementById('globalModal');
            if (!modal) return;
            
            // Add bulk action controls
            const alertsContent = modal.querySelector('.alerts-content');
            if (!alertsContent) return;
            
            // Add checkbox to each alert item
            const alertItems = alertsContent.querySelectorAll('.alert-item');
            alertItems.forEach((item, index) => {
                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'alert-select-checkbox';
                checkbox.dataset.index = index;
                item.insertBefore(checkbox, item.firstChild);
            });
            
            // Add bulk action bar
            const bulkBar = document.createElement('div');
            bulkBar.className = 'bulk-actions-bar';
            bulkBar.innerHTML = `
                <div class="bulk-info">
                    <span id="selectedCount">0</span> selected
                </div>
                <div class="bulk-buttons">
                    <button class="btn btn-sm" onclick="window.selectAllAlerts()">Select All</button>
                    <button class="btn btn-sm" onclick="window.deselectAllAlerts()">Deselect None</button>
                    <button class="btn btn-sm btn-success" onclick="window.bulkCompleteAlerts()" id="bulkCompleteBtn" disabled>
                        ✓ Complete Selected
                    </button>
                    <button class="btn btn-sm btn-primary" onclick="window.bulkViewClients()" id="bulkViewBtn" disabled>
                        👤 View Selected Clients
                    </button>
                </div>
            `;
            
            alertsContent.insertBefore(bulkBar, alertsContent.firstChild);
            
            // Add selection handlers
            alertItems.forEach(item => {
                const checkbox = item.querySelector('.alert-select-checkbox');
                if (checkbox) {
                    checkbox.addEventListener('change', updateBulkActions);
                }
            });
        }
        
        // Bulk action functions
        window.selectAllAlerts = function() {
            document.querySelectorAll('.alert-select-checkbox').forEach(cb => {
                cb.checked = true;
            });
            updateBulkActions();
        };
        
        window.deselectAllAlerts = function() {
            document.querySelectorAll('.alert-select-checkbox').forEach(cb => {
                cb.checked = false;
            });
            updateBulkActions();
        };
        
        function updateBulkActions() {
            const selected = Array.from(document.querySelectorAll('.alert-select-checkbox:checked'));
            const count = selected.length;
            
            document.getElementById('selectedCount').textContent = count;
            
            const bulkCompleteBtn = document.getElementById('bulkCompleteBtn');
            const bulkViewBtn = document.getElementById('bulkViewBtn');
            
            if (bulkCompleteBtn) bulkCompleteBtn.disabled = count === 0;
            if (bulkViewBtn) bulkViewBtn.disabled = count === 0;
        }
        
        window.bulkCompleteAlerts = async function() {
            const selected = Array.from(document.querySelectorAll('.alert-select-checkbox:checked'));
            if (selected.length === 0) return;
            
            const confirmed = confirm(`Complete ${selected.length} selected alert(s)?`);
            if (!confirmed) return;
            
            let completed = 0;
            let failed = 0;
            
            for (const checkbox of selected) {
                const alertItem = checkbox.closest('.alert-item');
                const clientId = alertItem.dataset.clientId;
                const trackerId = alertItem.dataset.trackerId;
                
                if (clientId && trackerId) {
                    try {
                        await window.dashboardWidgets.completeTrackerItem(clientId, trackerId);
                        completed++;
                    } catch (error) {
                        failed++;
                    }
                }
            }
            
            window.showNotification(
                `Completed ${completed} alert(s)${failed > 0 ? `, ${failed} failed` : ''}`,
                completed > 0 ? 'success' : 'error'
            );
            
            window.dashboardManager.refreshDashboard();
            window.dashboardWidgets.viewAllAlerts();
        };
        
        window.bulkViewClients = function() {
            const selected = Array.from(document.querySelectorAll('.alert-select-checkbox:checked'));
            const clientIds = selected.map(cb => {
                const alertItem = cb.closest('.alert-item');
                return alertItem.dataset.clientId;
            }).filter(id => id);
            
            if (clientIds.length === 0) return;
            
            // Show client list modal
            window.showModal({
                title: `Selected Clients (${clientIds.length})`,
                content: `
                    <div class="bulk-clients-list">
                        ${clientIds.map(id => `
                            <div class="bulk-client-item">
                                <button class="btn btn-sm" onclick="window.viewClientFromAlert('${id}')">
                                    View Client ${id}
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `,
                size: 'medium',
                buttons: [
                    {
                        text: 'Close',
                        action: () => window.closeModal()
                    }
                ]
            });
        };
        
        // Add styles
        if (!document.querySelector('#alert-actionability-styles')) {
            const styles = document.createElement('style');
            styles.id = 'alert-actionability-styles';
            styles.textContent = `
                /* Clickable alerts */
                .alert-clickable {
                    transition: all 0.2s;
                }
                
                .alert-clickable:hover {
                    background: #f9fafb !important;
                    transform: translateX(4px);
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                
                /* Alert details modal */
                .alert-details-modal {
                    padding: 0;
                }
                
                .alert-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: #f9fafb;
                    border-bottom: 2px solid #e5e7eb;
                }
                
                .alert-client-info {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .client-badge-large {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    background: var(--ccp-primary-500);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                    font-weight: 600;
                }
                
                .client-details {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .client-name {
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .client-meta {
                    display: flex;
                    gap: 16px;
                    font-size: 14px;
                    color: #6b7280;
                }
                
                .alert-zone-badge {
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 600;
                    font-size: 14px;
                }
                
                .alert-zone-badge.zone-red {
                    background: #fee2e2;
                    color: #991b1b;
                }
                
                .alert-zone-badge.zone-purple {
                    background: #f3e8ff;
                    color: #6b21a8;
                }
                
                .alert-zone-badge.zone-yellow {
                    background: #fef9c3;
                    color: #854d0e;
                }
                
                .alert-zone-badge.zone-green {
                    background: #dcfce7;
                    color: #166534;
                }
                
                .alert-content {
                    padding: 24px;
                }
                
                .alert-content h4 {
                    margin: 0 0 12px 0;
                    font-size: 16px;
                    color: #1f2937;
                }
                
                .alert-message-section {
                    margin-bottom: 24px;
                    padding-bottom: 24px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .alert-message {
                    font-size: 16px;
                    color: #374151;
                    margin: 0 0 8px 0;
                }
                
                .alert-due {
                    color: #dc2626;
                    font-weight: 500;
                    margin: 8px 0;
                }
                
                .alert-description {
                    color: #6b7280;
                    font-size: 14px;
                    margin: 8px 0 0 0;
                }
                
                .tracker-context,
                .client-context {
                    margin-bottom: 24px;
                }
                
                .tracker-info {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 6px;
                }
                
                .tracker-label {
                    font-weight: 500;
                }
                
                .tracker-status {
                    font-size: 14px;
                }
                
                .context-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 12px;
                }
                
                .context-item {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                
                .context-label {
                    font-size: 12px;
                    color: #6b7280;
                }
                
                .context-value {
                    font-weight: 500;
                    color: #1f2937;
                }
                
                .alert-actions-section {
                    padding: 20px;
                    background: #f9fafb;
                    border-top: 2px solid #e5e7eb;
                }
                
                .action-buttons-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 12px;
                }
                
                /* Bulk actions */
                .bulk-actions-bar {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px 16px;
                    background: #f3f4f6;
                    border-radius: 8px;
                    margin-bottom: 16px;
                }
                
                .bulk-info {
                    font-weight: 500;
                    color: #374151;
                }
                
                .bulk-buttons {
                    display: flex;
                    gap: 8px;
                }
                
                .alert-select-checkbox {
                    margin-right: 12px;
                    cursor: pointer;
                }
                
                .bulk-clients-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 400px;
                    overflow-y: auto;
                }
                
                .bulk-client-item {
                    padding: 12px;
                    background: #f9fafb;
                    border-radius: 6px;
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Alert actionability enhanced');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();
