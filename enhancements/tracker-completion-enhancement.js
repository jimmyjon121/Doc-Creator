/**
 * Tracker Completion Enhancement
 * Adds confirmation dialogs, optional notes, undo/redo, and bulk update capabilities
 */

(function() {
    'use strict';
    
    // History stack for undo/redo
    window.trackerHistory = {
        stack: [],
        currentIndex: -1,
        maxSize: 50,
        
        push(action) {
            // Remove any actions after current index (when undoing then doing new action)
            this.stack = this.stack.slice(0, this.currentIndex + 1);
            
            // Add new action
            this.stack.push({
                ...action,
                timestamp: new Date().toISOString()
            });
            
            // Limit stack size
            if (this.stack.length > this.maxSize) {
                this.stack.shift();
            } else {
                this.currentIndex++;
            }
            
            // Save to localStorage
            this.save();
        },
        
        undo() {
            if (this.currentIndex < 0) return null;
            
            const action = this.stack[this.currentIndex];
            this.currentIndex--;
            this.save();
            
            return action;
        },
        
        redo() {
            if (this.currentIndex >= this.stack.length - 1) return null;
            
            this.currentIndex++;
            const action = this.stack[this.currentIndex];
            this.save();
            
            return action;
        },
        
        canUndo() {
            return this.currentIndex >= 0;
        },
        
        canRedo() {
            return this.currentIndex < this.stack.length - 1;
        },
        
        save() {
            try {
                localStorage.setItem('tracker_history', JSON.stringify({
                    stack: this.stack,
                    currentIndex: this.currentIndex
                }));
            } catch (e) {
                console.warn('Failed to save tracker history:', e);
            }
        },
        
        load() {
            try {
                const saved = localStorage.getItem('tracker_history');
                if (saved) {
                    const data = JSON.parse(saved);
                    this.stack = data.stack || [];
                    this.currentIndex = data.currentIndex || -1;
                }
            } catch (e) {
                console.warn('Failed to load tracker history:', e);
            }
        }
    };
    
    // Load history on init
    window.trackerHistory.load();
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.dashboardWidgets || !window.clientManager || !window.showModal) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        enhanceTrackerCompletion();
    }
    
    function enhanceTrackerCompletion() {
        // Override completeTrackerItem with enhanced version
        const originalCompleteTrackerItem = window.dashboardWidgets.completeTrackerItem;
        
        window.dashboardWidgets.completeTrackerItem = async function(clientId, trackerId, skipConfirm = false) {
            try {
                const client = await window.clientManager.getClient(clientId);
                if (!client) {
                    window.showNotification('Client not found', 'error');
                    return;
                }
                
                // Get tracker item info
                const trackerItem = getTrackerItemInfo(client, trackerId);
                if (!trackerItem) {
                    window.showNotification('Tracker item not found', 'error');
                    return;
                }
                
                // Show confirmation dialog unless skipped
                if (!skipConfirm) {
                    const confirmed = await showCompletionDialog(client, trackerItem);
                    if (!confirmed) return;
                }
                
                // Store state for undo
                const beforeState = {
                    clientId,
                    trackerId,
                    value: client[trackerItem.field],
                    dateValue: client[trackerItem.dateField]
                };
                
                // Perform completion
                const updates = {};
                updates[trackerItem.field] = true;
                if (trackerItem.dateField) {
                    updates[trackerItem.dateField] = new Date().toISOString();
                }
                
                await window.clientManager.updateClient(clientId, updates);
                
                // Store in history
                window.trackerHistory.push({
                    type: 'complete',
                    beforeState,
                    afterState: {
                        clientId,
                        trackerId,
                        value: true,
                        dateValue: updates[trackerItem.dateField]
                    },
                    note: window.lastCompletionNote || null
                });
                
                // Clear note
                window.lastCompletionNote = null;
                
                // Show success
                window.showNotification(`${trackerItem.label} marked as complete`, 'success');
                
                // Refresh dashboard
                if (window.dashboardManager) {
                    window.dashboardManager.refreshDashboard();
                }
                
            } catch (error) {
                console.error('Error completing tracker item:', error);
                window.showNotification('Failed to complete tracker item', 'error');
            }
        };
        
        // Show completion confirmation dialog
        async function showCompletionDialog(client, trackerItem) {
            return new Promise((resolve) => {
                const content = `
                    <div class="completion-dialog">
                        <div class="completion-header">
                            <h4>Complete Tracker Item</h4>
                        </div>
                        
                        <div class="completion-info">
                            <div class="info-row">
                                <span class="label">Client:</span>
                                <span class="value">${client.initials} - ${client.houseId || 'No House'}</span>
                            </div>
                            <div class="info-row">
                                <span class="label">Item:</span>
                                <span class="value">${trackerItem.label}</span>
                            </div>
                            ${trackerItem.critical ? '<div class="critical-badge">⚠️ Critical Item</div>' : ''}
                        </div>
                        
                        <div class="completion-note-section">
                            <label for="completionNote">Add Note (Optional)</label>
                            <textarea 
                                id="completionNote" 
                                class="completion-note-input" 
                                placeholder="Add any notes about this completion..."
                                rows="3"
                            ></textarea>
                        </div>
                        
                        <div class="completion-actions">
                            <button class="btn btn-secondary" onclick="window.completionDialogCancel()">Cancel</button>
                            <button class="btn btn-primary" onclick="window.completionDialogConfirm()">Confirm</button>
                        </div>
                    </div>
                `;
                
                window.showModal({
                    title: '✓ Complete Tracker Item',
                    content: content,
                    size: 'small',
                    closeOnOverlay: false,
                    buttons: []
                });
                
                // Set up handlers
                window.completionDialogConfirm = () => {
                    const note = document.getElementById('completionNote').value.trim();
                    if (note) {
                        window.lastCompletionNote = note;
                    }
                    window.closeModal();
                    resolve(true);
                };
                
                window.completionDialogCancel = () => {
                    window.closeModal();
                    resolve(false);
                };
            });
        }
        
        // Get tracker item info
        function getTrackerItemInfo(client, trackerId) {
            if (!window.trackerEngine) return null;
            
            const requirements = window.trackerEngine.requirements || [];
            const item = requirements.find(r => r.id === trackerId);
            
            if (!item) return null;
            
            // Map to client field
            const fieldMap = {
                'needs_assessment': { field: 'needsAssessment', dateField: 'needsAssessmentDate' },
                'health_physical': { field: 'healthPhysical', dateField: 'healthPhysicalDate' },
                'aftercare_thread': { field: 'aftercareThread', dateField: 'aftercareThreadDate' },
                'options_doc': { field: 'optionsDocUploaded', dateField: 'optionsDocUploadedDate' },
                'discharge_packet': { field: 'dischargePacketUploaded', dateField: 'dischargePacketUploadedDate' }
            };
            
            const mapping = fieldMap[trackerId] || { field: trackerId, dateField: null };
            
            return {
                id: trackerId,
                label: item.label,
                critical: item.critical || false,
                field: mapping.field,
                dateField: mapping.dateField
            };
        }
        
        // Undo last completion
        window.undoTrackerCompletion = async function() {
            if (!window.trackerHistory.canUndo()) {
                window.showNotification('Nothing to undo', 'info');
                return;
            }
            
            const action = window.trackerHistory.undo();
            if (!action || action.type !== 'complete') {
                window.showNotification('Cannot undo this action', 'warning');
                return;
            }
            
            try {
                const updates = {};
                const trackerItem = getTrackerItemInfo(
                    await window.clientManager.getClient(action.beforeState.clientId),
                    action.beforeState.trackerId
                );
                
                if (trackerItem) {
                    updates[trackerItem.field] = action.beforeState.value;
                    if (trackerItem.dateField) {
                        updates[trackerItem.dateField] = action.beforeState.dateValue;
                    }
                    
                    await window.clientManager.updateClient(action.beforeState.clientId, updates);
                    window.showNotification('Action undone', 'success');
                    
                    if (window.dashboardManager) {
                        window.dashboardManager.refreshDashboard();
                    }
                }
            } catch (error) {
                console.error('Error undoing:', error);
                window.showNotification('Failed to undo', 'error');
            }
        };
        
        // Redo last undone action
        window.redoTrackerCompletion = async function() {
            if (!window.trackerHistory.canRedo()) {
                window.showNotification('Nothing to redo', 'info');
                return;
            }
            
            const action = window.trackerHistory.redo();
            if (!action || action.type !== 'complete') {
                window.showNotification('Cannot redo this action', 'warning');
                return;
            }
            
            try {
                await window.dashboardWidgets.completeTrackerItem(
                    action.afterState.clientId,
                    action.afterState.trackerId,
                    true // Skip confirm
                );
                window.showNotification('Action redone', 'success');
            } catch (error) {
                console.error('Error redoing:', error);
                window.showNotification('Failed to redo', 'error');
            }
        };
        
        // Add bulk update button to Flight Plan widget
        const flightPlanWidget = window.dashboardWidgets?.widgets?.get('flightPlan');
        if (flightPlanWidget) {
            const originalRender = flightPlanWidget.render;
            
            flightPlanWidget.render = function() {
                let html = originalRender.call(this);
                
                // Add bulk update button to header
                const headerMatch = html.match(/(<div[^>]*class="[^"]*widget-header[^"]*"[^>]*>)/);
                if (headerMatch) {
                    const bulkButton = `
                        <button class="btn btn-sm btn-secondary bulk-update-btn" onclick="window.showBulkTrackerUpdate()">
                            📋 Bulk Update
                        </button>
                    `;
                    html = html.replace(headerMatch[0], headerMatch[0] + bulkButton);
                }
                
                // Add undo/redo buttons
                const undoRedoButtons = `
                    <div class="undo-redo-controls">
                        <button class="btn-icon" onclick="window.undoTrackerCompletion()" 
                                title="Undo (Ctrl+Z)" ${!window.trackerHistory.canUndo() ? 'disabled' : ''}>
                            ↶ Undo
                        </button>
                        <button class="btn-icon" onclick="window.redoTrackerCompletion()" 
                                title="Redo (Ctrl+Y)" ${!window.trackerHistory.canRedo() ? 'disabled' : ''}>
                            ↷ Redo
                        </button>
                    </div>
                `;
                
                html = html.replace('</div></div>', undoRedoButtons + '</div></div>');
                
                return html;
            };
        }
        
        // Bulk tracker update modal
        window.showBulkTrackerUpdate = async function() {
            try {
                const clients = await window.clientManager.getAllClients();
                const activeClients = clients.filter(c => c.status === 'active');
                
                if (activeClients.length === 0) {
                    window.showNotification('No active clients found', 'warning');
                    return;
                }
                
                // Get tracker requirements
                const requirements = window.trackerEngine?.requirements || [];
                
                const content = `
                    <div class="bulk-tracker-update">
                        <div class="bulk-header">
                            <p>Select clients and tracker items to complete in bulk.</p>
                        </div>
                        
                        <div class="bulk-selection">
                            <div class="bulk-clients-section">
                                <h5>Clients</h5>
                                <div class="bulk-clients-list">
                                    ${activeClients.map(client => `
                                        <label class="bulk-client-checkbox">
                                            <input type="checkbox" class="bulk-client-select" value="${client.id}">
                                            <span>${client.initials} - ${client.houseId || 'No House'}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div class="bulk-items-section">
                                <h5>Tracker Items</h5>
                                <div class="bulk-items-list">
                                    ${requirements.map(req => `
                                        <label class="bulk-item-checkbox">
                                            <input type="checkbox" class="bulk-item-select" value="${req.id}">
                                            <span>${req.label} ${req.critical ? '⚠️' : ''}</span>
                                        </label>
                                    `).join('')}
                                </div>
                            </div>
                        </div>
                        
                        <div class="bulk-summary">
                            <span id="bulkSummary">0 clients, 0 items selected</span>
                        </div>
                    </div>
                `;
                
                window.showModal({
                    title: '📋 Bulk Tracker Update',
                    content: content,
                    size: 'large',
                    buttons: [
                        {
                            text: 'Cancel',
                            action: () => window.closeModal()
                        },
                        {
                            text: 'Complete Selected',
                            primary: true,
                            action: () => executeBulkUpdate()
                        }
                    ]
                });
                
                // Update summary on selection change
                document.querySelectorAll('.bulk-client-select, .bulk-item-select').forEach(cb => {
                    cb.addEventListener('change', updateBulkSummary);
                });
                
                updateBulkSummary();
                
            } catch (error) {
                console.error('Error showing bulk update:', error);
                window.showNotification('Failed to load bulk update', 'error');
            }
        };
        
        function updateBulkSummary() {
            const selectedClients = document.querySelectorAll('.bulk-client-select:checked').length;
            const selectedItems = document.querySelectorAll('.bulk-item-select:checked').length;
            
            const summary = document.getElementById('bulkSummary');
            if (summary) {
                summary.textContent = `${selectedClients} clients, ${selectedItems} items selected`;
            }
        }
        
        async function executeBulkUpdate() {
            const selectedClients = Array.from(document.querySelectorAll('.bulk-client-select:checked')).map(cb => cb.value);
            const selectedItems = Array.from(document.querySelectorAll('.bulk-item-select:checked')).map(cb => cb.value);
            
            if (selectedClients.length === 0 || selectedItems.length === 0) {
                window.showNotification('Please select at least one client and one item', 'warning');
                return;
            }
            
            const confirmed = confirm(`Complete ${selectedItems.length} item(s) for ${selectedClients.length} client(s)?`);
            if (!confirmed) return;
            
            let completed = 0;
            let failed = 0;
            
            window.showNotification('Processing bulk update...', 'info');
            
            for (const clientId of selectedClients) {
                for (const itemId of selectedItems) {
                    try {
                        await window.dashboardWidgets.completeTrackerItem(clientId, itemId, true);
                        completed++;
                    } catch (error) {
                        failed++;
                    }
                }
            }
            
            window.closeModal();
            window.showNotification(
                `Bulk update complete: ${completed} items completed${failed > 0 ? `, ${failed} failed` : ''}`,
                completed > 0 ? 'success' : 'error'
            );
            
            if (window.dashboardManager) {
                window.dashboardManager.refreshDashboard();
            }
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                window.undoTrackerCompletion();
            }
            
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                window.redoTrackerCompletion();
            }
        });
        
        // Add styles
        if (!document.querySelector('#tracker-completion-enhancement-styles')) {
            const styles = document.createElement('style');
            styles.id = 'tracker-completion-enhancement-styles';
            styles.textContent = `
                /* Completion Dialog */
                .completion-dialog {
                    padding: 0;
                }
                
                .completion-header h4 {
                    margin: 0 0 16px 0;
                    color: #1f2937;
                }
                
                .completion-info {
                    margin-bottom: 20px;
                }
                
                .info-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                }
                
                .info-row .label {
                    font-weight: 500;
                    color: #6b7280;
                }
                
                .info-row .value {
                    color: #1f2937;
                }
                
                .critical-badge {
                    display: inline-block;
                    margin-top: 8px;
                    padding: 4px 8px;
                    background: #fef2f2;
                    color: #991b1b;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .completion-note-section {
                    margin-bottom: 20px;
                }
                
                .completion-note-section label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .completion-note-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #d1d5db;
                    border-radius: 6px;
                    font-family: inherit;
                    font-size: 14px;
                    resize: vertical;
                }
                
                .completion-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                }
                
                /* Bulk Update */
                .bulk-update-btn {
                    margin-left: auto;
                }
                
                .undo-redo-controls {
                    display: flex;
                    gap: 8px;
                    padding: 12px;
                    background: #f9fafb;
                    border-top: 1px solid #e5e7eb;
                }
                
                .btn-icon {
                    background: white;
                    border: 1px solid #d1d5db;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    transition: all 0.2s;
                }
                
                .btn-icon:hover:not(:disabled) {
                    background: #f3f4f6;
                    border-color: #9ca3af;
                }
                
                .btn-icon:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .bulk-tracker-update {
                    padding: 0;
                }
                
                .bulk-header {
                    margin-bottom: 20px;
                    color: #6b7280;
                }
                
                .bulk-selection {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 24px;
                    margin-bottom: 20px;
                }
                
                .bulk-clients-section h5,
                .bulk-items-section h5 {
                    margin: 0 0 12px 0;
                    color: #1f2937;
                }
                
                .bulk-clients-list,
                .bulk-items-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    max-height: 300px;
                    overflow-y: auto;
                    padding: 8px;
                    background: #f9fafb;
                    border-radius: 6px;
                }
                
                .bulk-client-checkbox,
                .bulk-item-checkbox {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px;
                    background: white;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .bulk-client-checkbox:hover,
                .bulk-item-checkbox:hover {
                    background: #f3f4f6;
                }
                
                .bulk-summary {
                    padding: 12px;
                    background: #eff6ff;
                    border-radius: 6px;
                    text-align: center;
                    font-weight: 500;
                    color: #1e40af;
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Tracker completion enhancement initialized');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();



