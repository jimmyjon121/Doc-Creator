/**
 * Dashboard Quick Actions Enhancement
 * Completes implementation of all quick action buttons
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.dashboardWidgets || !window.clientManager || !window.showModal) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        enhanceQuickActions();
    }
    
    function enhanceQuickActions() {
        // Override quickGenerateDoc with full client-centric workflow
        window.dashboardWidgets.quickGenerateDoc = async function() {
            try {
                // Step 1: Select client
                const clients = await window.clientManager.getAllClients();
                const activeClients = clients.filter(c => c.status === 'active');
                
                if (activeClients.length === 0) {
                    window.showNotification('No active clients found', 'warning');
                    return;
                }
                
                // Build client selection HTML
                let clientOptionsHtml = `
                    <div class="client-selection-grid">
                        ${activeClients.map(client => {
                            const daysInCare = window.daysBetween(client.admissionDate) || 0;
                            return `
                                <label class="client-option">
                                    <input type="radio" name="selectedClient" value="${client.id}">
                                    <div class="client-card-mini">
                                        <span class="client-initials">${client.initials}</span>
                                        <span class="client-house">${client.houseId || 'No House'}</span>
                                        <span class="client-days">Day ${daysInCare}</span>
                                    </div>
                                </label>
                            `;
                        }).join('')}
                    </div>
                `;
                
                let selectedClientId = null;
                
                window.showModal({
                    title: '📄 Generate Document - Select Client',
                    content: clientOptionsHtml,
                    size: 'large',
                    buttons: [
                        {
                            text: 'Next',
                            primary: true,
                            action: () => {
                                const selected = document.querySelector('input[name="selectedClient"]:checked');
                                if (!selected) {
                                    window.showNotification('Please select a client', 'warning');
                                    return;
                                }
                                selectedClientId = selected.value;
                                window.closeModal();
                                selectDocumentType(selectedClientId);
                            }
                        },
                        {
                            text: 'Cancel',
                            action: () => window.closeModal()
                        }
                    ]
                });
                
            } catch (error) {
                console.error('Error in quickGenerateDoc:', error);
                window.showNotification('Failed to start document generation', 'error');
            }
        };
        
        // Step 2: Select document type
        async function selectDocumentType(clientId) {
            const client = await window.clientManager.getClient(clientId);
            const daysInCare = window.daysBetween(client.admissionDate) || 0;
            
            const documentTypes = [
                {
                    id: 'aftercare-options',
                    name: 'Aftercare Options',
                    icon: '📋',
                    description: 'Compare aftercare programs for family',
                    recommended: daysInCare >= 14
                },
                {
                    id: 'aftercare-plan',
                    name: 'Aftercare Plan',
                    icon: '📄',
                    description: 'Detailed placement plan',
                    recommended: daysInCare >= 21
                },
                {
                    id: 'discharge-packet',
                    name: 'Discharge Packet',
                    icon: '📦',
                    description: 'Complete discharge documentation',
                    recommended: daysInCare >= 25 || client.dischargeDate
                }
            ];
            
            const typeOptionsHtml = `
                <div class="selected-client-info">
                    <strong>Client:</strong> ${client.initials} - ${client.houseId} (Day ${daysInCare})
                </div>
                <div class="document-type-grid">
                    ${documentTypes.map(type => `
                        <label class="document-type-option ${type.recommended ? 'recommended' : ''}">
                            <input type="radio" name="documentType" value="${type.id}">
                            <div class="type-card">
                                <span class="type-icon">${type.icon}</span>
                                <span class="type-name">${type.name}</span>
                                <span class="type-description">${type.description}</span>
                                ${type.recommended ? '<span class="recommended-badge">Recommended</span>' : ''}
                            </div>
                        </label>
                    `).join('')}
                </div>
            `;
            
            window.showModal({
                title: '📄 Select Document Type',
                content: typeOptionsHtml,
                size: 'medium',
                buttons: [
                    {
                        text: 'Next',
                        primary: true,
                        action: async () => {
                            const selected = document.querySelector('input[name="documentType"]:checked');
                            if (!selected) {
                                window.showNotification('Please select a document type', 'warning');
                                return;
                            }
                            window.closeModal();
                            
                            // For discharge packet, go directly to generation
                            if (selected.value === 'discharge-packet') {
                                generateDischargePacket(client);
                            } else {
                                // For other types, select programs
                                selectPrograms(client, selected.value);
                            }
                        }
                    },
                    {
                        text: 'Back',
                        action: () => {
                            window.closeModal();
                            window.dashboardWidgets.quickGenerateDoc();
                        }
                    }
                ]
            });
        }
        
        // Step 3: Select programs (for non-discharge documents)
        async function selectPrograms(client, documentType) {
            // Switch to programs tab to ensure programs are loaded
            window.switchTab('programs');
            
            // Wait for programs to load
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Show program selection in modal
            window.showNotification('Select programs from the Programs tab, then generate document', 'info', '', 5000);
            
            // Store context for document generation
            window.documentGenerationContext = {
                clientId: client.id,
                client: client,
                documentType: documentType
            };
        }
        
        // Generate discharge packet
        async function generateDischargePacket(client) {
            window.showNotification('Generating discharge packet...', 'info');
            
            // Switch to programs tab and trigger discharge packet creation
            window.switchTab('programs');
            
            // Store context
            window.documentGenerationContext = {
                clientId: client.id,
                client: client,
                documentType: 'discharge-packet'
            };
            
            // Wait for tab to load then trigger
            setTimeout(() => {
                if (window.createDischargePacket) {
                    window.createDischargePacket();
                }
            }, 500);
        }
        
        // Enhanced viewAllAlerts with filtering and actions
        window.dashboardWidgets.viewAllAlerts = async function() {
            const alerts = window.dashboardManager.cache.priorities;
            let currentFilter = 'all';
            
            function renderAlertsModal() {
                const zones = ['red', 'purple', 'yellow', 'green'];
                let filteredAlerts = {};
                
                // Apply filter
                if (currentFilter === 'all') {
                    filteredAlerts = alerts;
                } else {
                    filteredAlerts[currentFilter] = alerts[currentFilter] || [];
                }
                
                let content = `
                    <div class="alerts-modal-header">
                        <div class="alert-filters">
                            <button class="filter-btn ${currentFilter === 'all' ? 'active' : ''}" 
                                    onclick="window.filterAlerts('all')">All Zones</button>
                            ${zones.map(zone => `
                                <button class="filter-btn zone-${zone} ${currentFilter === zone ? 'active' : ''}" 
                                        onclick="window.filterAlerts('${zone}')">
                                    ${zone.charAt(0).toUpperCase() + zone.slice(1)} (${(alerts[zone] || []).length})
                                </button>
                            `).join('')}
                        </div>
                        <div class="alert-actions">
                            <button class="btn btn-sm" onclick="window.exportAlerts()">
                                📊 Export CSV
                            </button>
                        </div>
                    </div>
                    <div class="alerts-content">
                `;
                
                let hasAlerts = false;
                
                for (const [zone, items] of Object.entries(filteredAlerts)) {
                    if (!items || items.length === 0) continue;
                    hasAlerts = true;
                    
                    content += `
                        <div class="alert-zone-section">
                            <h4 class="zone-header zone-${zone}">
                                ${zone.charAt(0).toUpperCase() + zone.slice(1)} Zone
                            </h4>
                            <div class="alert-items">
                    `;
                    
                    for (const item of items) {
                        content += `
                            <div class="alert-item" onclick="window.navigateToAlert('${item.client.id}', '${item.type}')">
                                <div class="alert-client">
                                    <span class="client-badge">${item.client.initials}</span>
                                    <span class="house-badge">${item.client.houseId}</span>
                                </div>
                                <div class="alert-details">
                                    <div class="alert-message">${item.message}</div>
                                    ${item.dueDate ? `<div class="alert-due">Due: ${item.dueDate}</div>` : ''}
                                </div>
                                <div class="alert-actions">
                                    ${item.isTrackerTask ? 
                                        `<button class="btn btn-sm btn-success" 
                                                onclick="event.stopPropagation(); window.completeAlert('${item.client.id}', '${item.trackerId}')">
                                            ✓ Complete
                                        </button>` : 
                                        `<button class="btn btn-sm" 
                                                onclick="event.stopPropagation(); window.takeAlertAction('${item.type}', '${item.client.id}')">
                                            ${item.action || 'View'}
                                        </button>`
                                    }
                                </div>
                            </div>
                        `;
                    }
                    
                    content += `
                            </div>
                        </div>
                    `;
                }
                
                if (!hasAlerts) {
                    content += `
                        <div class="empty-state">
                            <p>No alerts found${currentFilter !== 'all' ? ' in ' + currentFilter + ' zone' : ''}</p>
                        </div>
                    `;
                }
                
                content += '</div>';
                
                return content;
            }
            
            // Global functions for modal interactions
            window.filterAlerts = function(filter) {
                currentFilter = filter;
                const modalBody = document.querySelector('.modal-body');
                if (modalBody) {
                    modalBody.innerHTML = renderAlertsModal();
                }
            };
            
            window.navigateToAlert = function(clientId, type) {
                window.closeModal();
                window.viewClientDetails(clientId);
            };
            
            window.completeAlert = async function(clientId, trackerId) {
                await window.dashboardWidgets.completeTrackerItem(clientId, trackerId);
                // Refresh modal
                window.dashboardManager.refreshDashboard();
                window.filterAlerts(currentFilter);
            };
            
            window.takeAlertAction = function(type, clientId) {
                window.closeModal();
                window.dashboardWidgets.takeAction(`action-${type}-${clientId}`, type, clientId);
            };
            
            window.exportAlerts = function() {
                const csv = generateAlertsCSV(alerts);
                downloadCSV(csv, `alerts-${new Date().toISOString().split('T')[0]}.csv`);
                window.showNotification('Alerts exported successfully', 'success');
            };
            
            // Show modal
            window.showModal({
                title: '🔔 All Alerts',
                content: renderAlertsModal(),
                size: 'large',
                buttons: [
                    {
                        text: 'Close',
                        action: () => window.closeModal()
                    }
                ]
            });
        };
        
        // Enhanced exportDashboard
        window.dashboardWidgets.exportDashboard = async function() {
            try {
                const data = {
                    exportDate: new Date().toISOString(),
                    coach: window.getCurrentCoach?.() || 'Unknown',
                    summary: {
                        totalClients: 0,
                        activeClients: 0,
                        criticalAlerts: 0,
                        todayTasks: 0
                    },
                    alerts: window.dashboardManager.cache.priorities,
                    clients: [],
                    milestones: []
                };
                
                // Gather all data
                const clients = await window.clientManager.getAllClients();
                data.summary.totalClients = clients.length;
                data.summary.activeClients = clients.filter(c => c.status === 'active').length;
                data.summary.criticalAlerts = (data.alerts.red || []).length;
                
                // Calculate today's tasks
                for (const zone of Object.values(data.alerts)) {
                    data.summary.todayTasks += zone.filter(item => 
                        item.dueDate && item.dueDate.includes('today')
                    ).length;
                }
                
                // Add client details
                for (const client of clients) {
                    const clientData = {
                        initials: client.initials,
                        house: client.houseId,
                        status: client.status,
                        admissionDate: client.admissionDate,
                        daysInCare: window.daysBetween(client.admissionDate),
                        trackerCompletion: 0
                    };
                    
                    // Calculate tracker completion
                    if (window.trackerEngine) {
                        const score = window.trackerEngine.getCompletionScore(client);
                        clientData.trackerCompletion = score.percentage;
                    }
                    
                    data.clients.push(clientData);
                }
                
                // Generate CSV
                const csv = generateDashboardCSV(data);
                downloadCSV(csv, `dashboard-export-${new Date().toISOString().split('T')[0]}.csv`);
                
                window.showNotification('Dashboard exported successfully', 'success');
                
            } catch (error) {
                console.error('Export error:', error);
                window.showNotification('Failed to export dashboard', 'error');
            }
        };
        
        // Enhanced enterFocusMode
        window.dashboardWidgets.enterFocusMode = function() {
            // Check if already in focus mode
            if (document.body.classList.contains('focus-mode')) {
                exitFocusMode();
                return;
            }
            
            // Enter focus mode
            document.body.classList.add('focus-mode');
            
            // Hide non-essential elements
            const elementsToHide = [
                '.header-controls',
                '.dashboard-controls',
                '#quickActionsWidget',
                '#missionsWidget',
                '.zone-yellow',
                '.zone-green'
            ];
            
            elementsToHide.forEach(selector => {
                document.querySelectorAll(selector).forEach(el => {
                    el.dataset.focusHidden = 'true';
                    el.style.display = 'none';
                });
            });
            
            // Expand critical zones
            const redZone = document.querySelector('.zone-red');
            const purpleZone = document.querySelector('.zone-purple');
            
            if (redZone) {
                const content = redZone.querySelector('.zone-content');
                if (content) content.classList.add('expanded');
            }
            
            if (purpleZone) {
                const content = purpleZone.querySelector('.zone-content');
                if (content) content.classList.add('expanded');
            }
            
            // Add focus mode indicator
            const indicator = document.createElement('div');
            indicator.className = 'focus-mode-indicator';
            indicator.innerHTML = `
                <span>🎯 Focus Mode Active</span>
                <button onclick="window.dashboardWidgets.enterFocusMode()">Exit</button>
            `;
            document.body.appendChild(indicator);
            
            window.showNotification('Focus mode activated - showing only critical tasks', 'info');
        };
        
        function exitFocusMode() {
            document.body.classList.remove('focus-mode');
            
            // Restore hidden elements
            document.querySelectorAll('[data-focus-hidden="true"]').forEach(el => {
                el.style.display = '';
                delete el.dataset.focusHidden;
            });
            
            // Remove indicator
            const indicator = document.querySelector('.focus-mode-indicator');
            if (indicator) indicator.remove();
            
            window.showNotification('Focus mode deactivated', 'info');
        }
        
        // Helper functions
        function generateAlertsCSV(alerts) {
            let csv = 'Zone,Client,House,Message,Due Date,Type\n';
            
            for (const [zone, items] of Object.entries(alerts)) {
                for (const item of items) {
                    csv += `"${zone}","${item.client.initials}","${item.client.houseId}",`;
                    csv += `"${item.message.replace(/"/g, '""')}","${item.dueDate || ''}","${item.type}"\n`;
                }
            }
            
            return csv;
        }
        
        function generateDashboardCSV(data) {
            let csv = 'Dashboard Export\n';
            csv += `Export Date,${data.exportDate}\n`;
            csv += `Coach,${data.coach}\n\n`;
            
            csv += 'Summary\n';
            csv += `Total Clients,${data.summary.totalClients}\n`;
            csv += `Active Clients,${data.summary.activeClients}\n`;
            csv += `Critical Alerts,${data.summary.criticalAlerts}\n`;
            csv += `Today's Tasks,${data.summary.todayTasks}\n\n`;
            
            csv += 'Client Details\n';
            csv += 'Initials,House,Status,Admission Date,Days in Care,Tracker Completion\n';
            
            for (const client of data.clients) {
                csv += `${client.initials},${client.house},${client.status},`;
                csv += `${client.admissionDate},${client.daysInCare},${client.trackerCompletion}%\n`;
            }
            
            return csv;
        }
        
        function downloadCSV(csv, filename) {
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // Add styles
        if (!document.querySelector('#quick-actions-styles')) {
            const styles = document.createElement('style');
            styles.id = 'quick-actions-styles';
            styles.textContent = `
                /* Client Selection Grid */
                .client-selection-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                    gap: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                    padding: 4px;
                }
                
                .client-option {
                    cursor: pointer;
                }
                
                .client-option input {
                    position: absolute;
                    opacity: 0;
                }
                
                .client-card-mini {
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 12px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    transition: all 0.2s;
                }
                
                .client-option input:checked + .client-card-mini {
                    border-color: var(--ccp-primary-500);
                    background: var(--ccp-primary-100);
                }
                
                .client-card-mini:hover {
                    border-color: var(--ccp-primary-300);
                }
                
                /* Document Type Selection */
                .selected-client-info {
                    padding: 12px;
                    background: #f3f4f6;
                    border-radius: 6px;
                    margin-bottom: 16px;
                }
                
                .document-type-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 16px;
                }
                
                .document-type-option input {
                    position: absolute;
                    opacity: 0;
                }
                
                .type-card {
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                }
                
                .document-type-option input:checked + .type-card {
                    border-color: var(--ccp-primary-500);
                    background: var(--ccp-primary-100);
                }
                
                .document-type-option.recommended .type-card {
                    border-color: var(--ccp-success-500);
                }
                
                .type-icon {
                    font-size: 32px;
                    text-align: center;
                }
                
                .type-name {
                    font-weight: 600;
                    font-size: 16px;
                }
                
                .type-description {
                    font-size: 14px;
                    color: #6b7280;
                }
                
                .recommended-badge {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: var(--ccp-success-500);
                    color: white;
                    font-size: 11px;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-weight: 600;
                }
                
                /* Alerts Modal */
                .alerts-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 16px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .alert-filters {
                    display: flex;
                    gap: 8px;
                }
                
                .filter-btn {
                    padding: 6px 12px;
                    border: 1px solid #e5e7eb;
                    background: white;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .filter-btn.active {
                    background: var(--ccp-primary-500);
                    color: white;
                    border-color: var(--ccp-primary-500);
                }
                
                .filter-btn.zone-red.active {
                    background: #ef4444;
                    border-color: #ef4444;
                }
                
                .filter-btn.zone-purple.active {
                    background: #a855f7;
                    border-color: #a855f7;
                }
                
                .filter-btn.zone-yellow.active {
                    background: #eab308;
                    border-color: #eab308;
                }
                
                .filter-btn.zone-green.active {
                    background: #22c55e;
                    border-color: #22c55e;
                }
                
                .alerts-content {
                    max-height: 500px;
                    overflow-y: auto;
                }
                
                .alert-zone-section {
                    margin-bottom: 24px;
                }
                
                .zone-header {
                    font-size: 16px;
                    font-weight: 600;
                    margin-bottom: 12px;
                    padding-left: 12px;
                    border-left: 4px solid;
                }
                
                .zone-header.zone-red {
                    border-left-color: #ef4444;
                    color: #dc2626;
                }
                
                .zone-header.zone-purple {
                    border-left-color: #a855f7;
                    color: #9333ea;
                }
                
                .zone-header.zone-yellow {
                    border-left-color: #eab308;
                    color: #ca8a04;
                }
                
                .zone-header.zone-green {
                    border-left-color: #22c55e;
                    color: #16a34a;
                }
                
                .alert-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    border: 1px solid #e5e7eb;
                    border-radius: 6px;
                    margin-bottom: 8px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .alert-item:hover {
                    background: #f9fafb;
                    border-color: #d1d5db;
                }
                
                .alert-client {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    flex-shrink: 0;
                }
                
                .alert-details {
                    flex: 1;
                }
                
                .alert-message {
                    font-size: 14px;
                }
                
                .alert-due {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 2px;
                }
                
                /* Focus Mode */
                .focus-mode-indicator {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #1f2937;
                    color: white;
                    padding: 8px 16px;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                }
                
                .focus-mode-indicator button {
                    background: white;
                    color: #1f2937;
                    border: none;
                    padding: 4px 12px;
                    border-radius: 12px;
                    cursor: pointer;
                    font-size: 12px;
                }
                
                body.focus-mode .dashboard-widget:not(#flightPlanWidget) {
                    opacity: 0.3;
                }
                
                body.focus-mode #flightPlanWidget {
                    transform: scale(1.05);
                    transition: transform 0.3s;
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Quick actions enhanced successfully');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();



