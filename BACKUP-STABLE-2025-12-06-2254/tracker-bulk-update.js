/**
 * @fileoverview Quick-entry bulk update modal for tracker items
 * @module legacy/TrackerBulkUpdate
 * @status @legacy - DO NOT ADD NEW FEATURES
 * @deprecated Will migrate to TaskService-based UI in v14
 * 
 * PURPOSE:
 *   Quick-entry interface for updating multiple tracker/milestone items at once.
 *   Allows clinical coaches to rapidly check off completed tasks without opening
 *   the full client profile modal.
 * 
 * DEPENDENCIES:
 *   - window.clientManager (ClientManager) - Client data updates
 *   - window.trackerEngine (TrackerEngine) - Legacy requirement definitions
 * 
 * EXPORTS TO WINDOW:
 *   - window.trackerBulkUpdate - Singleton instance
 *   - window.openBulkUpdate(clientId) - Open modal for client
 * 
 * MIGRATION TARGET:
 *   TaskService-based bulk update UI
 *   Should use TaskSchema for task definitions instead of TrackerEngine
 * 
 * REMOVAL BLOCKERS:
 *   - Quick update buttons in client cards depend on this
 *   - Uses TrackerEngine (must migrate TrackerEngine first)
 * 
 * STILL USED BY:
 *   - CareConnect-Pro.html (quick update button clicks)
 *   - cm-tracker.js (client card quick actions)
 */

class TrackerBulkUpdate {
    constructor() {
        this.currentClient = null;
        this.pendingUpdates = {};
    }
    
    /**
     * Open bulk update modal for a client
     * @param {string} clientId - Client ID
     */
    async open(clientId) {
        try {
            this.currentClient = await window.clientManager.getClient(clientId);
            if (!this.currentClient) {
                throw new Error('Client not found');
            }
            
            this.pendingUpdates = {};
            this.render();
            
        } catch (error) {
            console.error('[BulkUpdate] Error opening modal:', error);
            alert('Error loading client data');
        }
    }
    
    /**
     * Render the bulk update modal
     */
    render() {
        const requirements = window.trackerEngine.requirements;
        const score = window.trackerEngine.getCompletionScore(this.currentClient);
        
        // Group requirements by category
        const categories = this.groupByCategory(requirements);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'bulk-update-overlay';
        modal.innerHTML = `
            <div class="bulk-update-modal">
                <div class="bulk-update-header">
                    <div class="header-info">
                        <h3>Quick Update: ${this.currentClient.initials}</h3>
                        <div class="header-stats">
                            <span class="stat">${score.completedItems}/${score.totalItems} Complete</span>
                            <span class="stat">${score.overallPercentage}% Overall</span>
                            <span class="stat">Day ${score.daysInCare}</span>
                        </div>
                    </div>
                    <button class="close-btn" onclick="trackerBulkUpdate.close()">×</button>
                </div>
                
                <div class="bulk-update-content">
                    <div class="bulk-update-filters">
                        <button class="filter-btn active" data-filter="all">All Items</button>
                        <button class="filter-btn" data-filter="incomplete">Incomplete Only</button>
                        <button class="filter-btn" data-filter="overdue">Overdue</button>
                        <button class="filter-btn" data-filter="critical">Critical</button>
                    </div>
                    
                    <div class="bulk-update-categories">
                        ${Object.entries(categories).map(([category, items]) => 
                            this.renderCategory(category, items)
                        ).join('')}
                    </div>
                    
                    <div class="bulk-update-notes">
                        <label>Add Note (optional):</label>
                        <textarea 
                            id="bulk-update-note" 
                            placeholder="Add any relevant notes about these updates..."
                            rows="3"
                        ></textarea>
                    </div>
                </div>
                
                <div class="bulk-update-footer">
                    <div class="footer-info">
                        <span id="pending-count">0 changes pending</span>
                    </div>
                    <div class="footer-actions">
                        <button class="btn-secondary" onclick="trackerBulkUpdate.selectAll()">Select All</button>
                        <button class="btn-secondary" onclick="trackerBulkUpdate.clearAll()">Clear All</button>
                        <button class="btn-primary" onclick="trackerBulkUpdate.save()" id="save-btn">
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.modal = modal;
        
        // Attach event listeners
        this.attachEventListeners();
        
        // Apply initial filter
        this.applyFilter('all');
    }
    
    /**
     * Group requirements by category
     */
    groupByCategory(requirements) {
        const groups = {};
        
        requirements.forEach(req => {
            if (!groups[req.category]) {
                groups[req.category] = [];
            }
            groups[req.category].push(req);
        });
        
        // Sort categories for display order
        const categoryOrder = ['admission', 'clinical', 'aftercare', 'documentation'];
        const sorted = {};
        
        categoryOrder.forEach(cat => {
            if (groups[cat]) {
                sorted[cat] = groups[cat];
            }
        });
        
        return sorted;
    }
    
    /**
     * Render a category section
     */
    renderCategory(category, items) {
        const categoryLabels = {
            admission: '48-Hour Requirements',
            clinical: 'Clinical Assessments',
            aftercare: 'Aftercare Planning',
            documentation: 'Documentation'
        };
        
        return `
            <div class="update-category" data-category="${category}">
                <h4 class="category-title">${categoryLabels[category] || category}</h4>
                <div class="category-items">
                    ${items.map(item => this.renderItem(item)).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render individual item
     */
    renderItem(item) {
        const isComplete = this.currentClient[item.id];
        const completedDate = this.currentClient[item.id + 'Date'];
        const score = window.trackerEngine.getCompletionScore(this.currentClient);
        const isOverdue = score.daysInCare > item.dueByDay && !isComplete;
        
        const classes = [
            'update-item',
            isComplete ? 'complete' : 'incomplete',
            isOverdue ? 'overdue' : '',
            item.critical ? 'critical' : ''
        ].filter(Boolean).join(' ');
        
        return `
            <div class="${classes}" data-item-id="${item.id}">
                <label class="item-label">
                    <input 
                        type="checkbox" 
                        class="item-checkbox" 
                        data-item-id="${item.id}"
                        ${isComplete ? 'checked' : ''}
                        onchange="trackerBulkUpdate.toggleItem('${item.id}')"
                    />
                    <span class="item-text">
                        ${item.label}
                    </span>
                </label>
                <div class="item-info">
                    ${isComplete && completedDate ? 
                        `<span class="completed-date">✓ ${window.DateHelpers?.formatDate ? window.DateHelpers.formatDate(completedDate) : new Date(completedDate).toLocaleDateString()}</span>` :
                        `<span class="due-date">Due by day ${item.dueByDay}</span>`
                    }
                    ${isOverdue ? '<span class="overdue-badge">Overdue</span>' : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Toggle item completion
     */
    toggleItem(itemId) {
        const checkbox = this.modal.querySelector(`input[data-item-id="${itemId}"]`);
        const currentValue = this.currentClient[itemId];
        const newValue = checkbox.checked;
        
        if (currentValue !== newValue) {
            this.pendingUpdates[itemId] = newValue;
            if (newValue) {
                this.pendingUpdates[itemId + 'Date'] = new Date().toISOString();
            } else {
                this.pendingUpdates[itemId + 'Date'] = null;
            }
        } else {
            delete this.pendingUpdates[itemId];
            delete this.pendingUpdates[itemId + 'Date'];
        }
        
        this.updatePendingCount();
    }
    
    /**
     * Update pending changes count
     */
    updatePendingCount() {
        const count = Object.keys(this.pendingUpdates).filter(key => !key.endsWith('Date')).length;
        const countElement = this.modal.querySelector('#pending-count');
        countElement.textContent = `${count} changes pending`;
        
        const saveBtn = this.modal.querySelector('#save-btn');
        saveBtn.disabled = count === 0;
    }
    
    /**
     * Apply filter
     */
    applyFilter(filter) {
        // Update active button
        this.modal.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // Filter items
        const items = this.modal.querySelectorAll('.update-item');
        items.forEach(item => {
            let show = true;
            
            switch (filter) {
                case 'incomplete':
                    show = item.classList.contains('incomplete');
                    break;
                case 'overdue':
                    show = item.classList.contains('overdue');
                    break;
                case 'critical':
                    show = item.classList.contains('critical');
                    break;
            }
            
            item.style.display = show ? 'flex' : 'none';
        });
        
        // Hide empty categories
        this.modal.querySelectorAll('.update-category').forEach(cat => {
            const visibleItems = cat.querySelectorAll('.update-item:not([style*="none"])');
            cat.style.display = visibleItems.length > 0 ? 'block' : 'none';
        });
    }
    
    /**
     * Select all visible items
     */
    selectAll() {
        const visibleCheckboxes = this.modal.querySelectorAll('.update-item:not([style*="none"]) .item-checkbox');
        visibleCheckboxes.forEach(checkbox => {
            if (!checkbox.checked) {
                checkbox.checked = true;
                this.toggleItem(checkbox.dataset.itemId);
            }
        });
    }
    
    /**
     * Clear all selections
     */
    clearAll() {
        const checkboxes = this.modal.querySelectorAll('.item-checkbox');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                checkbox.checked = false;
                this.toggleItem(checkbox.dataset.itemId);
            }
        });
    }
    
    /**
     * Save changes
     */
    async save() {
        const saveBtn = this.modal.querySelector('#save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';
        
        try {
            // Add note if provided
            const noteElement = this.modal.querySelector('#bulk-update-note');
            const note = noteElement.value.trim();
            
            if (note) {
                const currentNotes = this.currentClient.notes || '';
                const timestamp = new Date().toLocaleString();
                const newNote = `[${timestamp}] Bulk Update: ${note}`;
                this.pendingUpdates.notes = currentNotes ? 
                    `${currentNotes}\n\n${newNote}` : newNote;
            }
            
            // Save updates
            await window.clientManager.updateClient(this.currentClient.id, this.pendingUpdates);
            
            // Show success
            this.showNotification('Updates saved successfully!', 'success');
            
            // Refresh dashboard if available
            if (window.dashboardManager && window.dashboardManager.loadData) {
                await window.dashboardManager.loadData();
            }
            
            // Close modal
            setTimeout(() => this.close(), 1500);
            
        } catch (error) {
            console.error('[BulkUpdate] Error saving:', error);
            this.showNotification('Error saving updates', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save Changes';
        }
    }
    
    /**
     * Close modal
     */
    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
            this.currentClient = null;
            this.pendingUpdates = {};
        }
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Filter buttons
        this.modal.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.applyFilter(btn.dataset.filter);
            });
        });
        
        // Close on overlay click
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboard);
    }
    
    /**
     * Handle keyboard shortcuts
     */
    handleKeyboard = (e) => {
        if (!this.modal) return;
        
        // Escape to close
        if (e.key === 'Escape') {
            this.close();
        }
        
        // Ctrl+S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            const saveBtn = this.modal.querySelector('#save-btn');
            if (!saveBtn.disabled) {
                this.save();
            }
        }
    };
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `bulk-update-notification ${type}`;
        notification.textContent = message;
        
        this.modal.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('visible');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Create singleton instance
window.trackerBulkUpdate = new TrackerBulkUpdate();

// Update global function
window.openBulkUpdate = (clientId) => {
    window.trackerBulkUpdate.open(clientId);
};

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackerBulkUpdate;
}
