/**
 * @fileoverview Interactive visual timeline for client journey progress
 * @module legacy/TrackerTimeline
 * @status @legacy - DO NOT ADD NEW FEATURES
 * @deprecated Will migrate to TaskService-based timeline in v14
 * 
 * PURPOSE:
 *   Renders an interactive visual timeline showing a client's journey through
 *   treatment milestones. Displays completed tasks, upcoming deadlines, and
 *   progress indicators along a horizontal timeline.
 * 
 * DEPENDENCIES:
 *   - window.clientManager (ClientManager) - Client data
 *   - window.milestonesManager (MilestonesManager) - Milestone definitions
 *   - window.DateHelpers - Date formatting
 * 
 * EXPORTS TO WINDOW:
 *   - window.trackerTimeline - Singleton instance
 * 
 * MIGRATION TARGET:
 *   TaskService-based timeline component
 *   Should use TaskSchema for milestone definitions
 * 
 * REMOVAL BLOCKERS:
 *   - Client profile Timeline tab depends on this
 *   - Uses legacy milestone format
 * 
 * STILL USED BY:
 *   - client-profile-manager.js (Timeline tab)
 */

class TrackerTimeline {
    constructor() {
        this.initialized = false;
        this.currentClient = null;
    }
    
    /**
     * Create timeline visualization for a client
     * @param {Object} client - Client data
     * @param {HTMLElement} container - Container element
     */
    async render(client, container) {
        this.currentClient = client;
        const score = window.trackerEngine.getCompletionScore(client);
        const requirements = window.trackerEngine.requirements;
        
        // Group requirements by due date
        const timeline = this.groupRequirementsByTimeline(requirements, client, score);
        
        // Create timeline HTML
        const timelineHTML = `
            <div class="tracker-timeline">
                <div class="timeline-header">
                    <div class="timeline-title">
                        <h3>Tracker Timeline: ${client.initials}</h3>
                        <span class="timeline-subtitle">
                            Day ${score.daysInCare} of ${score.daysInCare + score.daysToDischarge}
                        </span>
                    </div>
                    <div class="timeline-stats">
                        <div class="stat-badge">
                            <span class="stat-value">${score.overallPercentage}%</span>
                            <span class="stat-label">Complete</span>
                        </div>
                        <div class="stat-badge">
                            <span class="stat-value">${score.completedItems}/${score.totalItems}</span>
                            <span class="stat-label">Items</span>
                        </div>
                    </div>
                </div>
                
                <div class="timeline-container">
                    <div class="timeline-track">
                        <div class="timeline-progress" style="width: ${this.calculateProgressWidth(score)}%"></div>
                    </div>
                    
                    <div class="timeline-markers">
                        ${this.renderTimelineMarkers(timeline, score)}
                    </div>
                    
                    <div class="timeline-items">
                        ${this.renderTimelineItems(timeline, client)}
                    </div>
                </div>
                
                <div class="timeline-legend">
                    <div class="legend-item">
                        <span class="legend-icon complete">✓</span>
                        <span>Complete</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-icon pending">○</span>
                        <span>Pending</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-icon overdue">⚠</span>
                        <span>Overdue</span>
                    </div>
                    <div class="legend-item">
                        <span class="legend-icon critical">★</span>
                        <span>Critical</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = timelineHTML;
        
        // Add interactivity
        this.attachEventListeners(container);
    }
    
    /**
     * Group requirements by timeline position
     */
    groupRequirementsByTimeline(requirements, client, score) {
        const groups = {};
        
        requirements.forEach(req => {
            const dayGroup = Math.ceil(req.dueByDay / 7) * 7; // Group by week
            if (!groups[dayGroup]) {
                groups[dayGroup] = {
                    day: dayGroup,
                    label: `Week ${Math.ceil(req.dueByDay / 7)}`,
                    items: []
                };
            }
            
            const status = this.getItemStatus(req, client, score);
            groups[dayGroup].items.push({
                ...req,
                status,
                completed: client[req.id],
                completedDate: client[req.id + 'Date']
            });
        });
        
        return Object.values(groups).sort((a, b) => a.day - b.day);
    }
    
    /**
     * Calculate progress bar width
     */
    calculateProgressWidth(score) {
        const totalDays = score.daysInCare + score.daysToDischarge;
        return Math.min(100, (score.daysInCare / totalDays) * 100);
    }
    
    /**
     * Get status of a requirement item
     */
    getItemStatus(req, client, score) {
        if (client[req.id]) return 'complete';
        if (score.daysInCare > req.dueByDay) return 'overdue';
        if (score.daysInCare >= req.dueByDay - 3) return 'upcoming';
        return 'pending';
    }
    
    /**
     * Render timeline markers
     */
    renderTimelineMarkers(timeline, score) {
        const totalDays = score.daysInCare + score.daysToDischarge;
        let markers = '';
        
        // Admission marker
        markers += `
            <div class="timeline-marker admission" style="left: 0%">
                <div class="marker-line"></div>
                <div class="marker-label">Admission</div>
            </div>
        `;
        
        // Current day marker
        const currentPosition = (score.daysInCare / totalDays) * 100;
        markers += `
            <div class="timeline-marker current" style="left: ${currentPosition}%">
                <div class="marker-line"></div>
                <div class="marker-label">Today (Day ${score.daysInCare})</div>
            </div>
        `;
        
        // Discharge marker
        markers += `
            <div class="timeline-marker discharge" style="left: 100%">
                <div class="marker-line"></div>
                <div class="marker-label">Discharge</div>
            </div>
        `;
        
        return markers;
    }
    
    /**
     * Render timeline items
     */
    renderTimelineItems(timeline, client) {
        let itemsHTML = '';
        
        timeline.forEach(group => {
            const position = this.calculateGroupPosition(group.day, client);
            
            itemsHTML += `
                <div class="timeline-group" style="left: ${position}%">
                    <div class="group-connector"></div>
                    <div class="group-label">${group.label}</div>
                    <div class="group-items">
                        ${group.items.map(item => this.renderTimelineItem(item)).join('')}
                    </div>
                </div>
            `;
        });
        
        return itemsHTML;
    }
    
    /**
     * Calculate position for a group
     */
    calculateGroupPosition(day, client) {
        const score = window.trackerEngine.getCompletionScore(client);
        const totalDays = score.daysInCare + score.daysToDischarge;
        return Math.min(95, (day / totalDays) * 100);
    }
    
    /**
     * Render individual timeline item
     */
    renderTimelineItem(item) {
        const iconClass = item.status === 'complete' ? 'complete' : 
                         item.status === 'overdue' ? 'overdue' : 
                         item.status === 'upcoming' ? 'upcoming' : 'pending';
        
        const icon = item.status === 'complete' ? '✓' : 
                    item.status === 'overdue' ? '⚠' : '○';
        
        const criticalBadge = item.critical ? '<span class="critical-badge">★</span>' : '';
        
        return `
            <div class="timeline-item ${item.status}" data-item-id="${item.id}">
                <div class="item-icon ${iconClass}">${icon}</div>
                <div class="item-content">
                    <div class="item-title">
                        ${item.label}
                        ${criticalBadge}
                    </div>
                    ${item.completedDate ? 
                        `<div class="item-date">Completed: ${new Date(item.completedDate).toLocaleDateString()}</div>` :
                        `<div class="item-date">Due by day ${item.dueByDay}</div>`
                    }
                </div>
                <div class="item-tooltip">
                    <div class="tooltip-content">
                        <h4>${item.label}</h4>
                        <p>${item.description}</p>
                        <div class="tooltip-status">
                            Status: <strong>${item.status}</strong>
                        </div>
                        ${!item.completed ? 
                            `<button class="btn-mark-complete" data-item-id="${item.id}">
                                Mark Complete
                            </button>` : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Attach event listeners
     */
    attachEventListeners(container) {
        // Hover effects for timeline items
        const items = container.querySelectorAll('.timeline-item');
        items.forEach(item => {
            item.addEventListener('mouseenter', (e) => {
                const tooltip = item.querySelector('.item-tooltip');
                if (tooltip) tooltip.classList.add('visible');
            });
            
            item.addEventListener('mouseleave', (e) => {
                const tooltip = item.querySelector('.item-tooltip');
                if (tooltip) tooltip.classList.remove('visible');
            });
        });
        
        // Mark complete buttons
        const completeButtons = container.querySelectorAll('.btn-mark-complete');
        completeButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const itemId = btn.getAttribute('data-item-id');
                await this.markItemComplete(itemId);
            });
        });
    }
    
    /**
     * Mark an item as complete
     */
    async markItemComplete(itemId) {
        if (!this.currentClient || !window.clientManager) return;
        
        try {
            // Update client data
            const updates = {
                [itemId]: true,
                [itemId + 'Date']: new Date().toISOString()
            };
            
            await window.clientManager.updateClient(this.currentClient.id, updates);
            
            // Refresh timeline
            const container = document.querySelector('.tracker-timeline').parentElement;
            const updatedClient = await window.clientManager.getClient(this.currentClient.id);
            await this.render(updatedClient, container);
            
            // Show success message
            this.showNotification('Item marked as complete!', 'success');
            
        } catch (error) {
            console.error('[Timeline] Error marking item complete:', error);
            this.showNotification('Error updating item', 'error');
        }
    }
    
    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `timeline-notification ${type}`;
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
}

// Create singleton instance
window.trackerTimeline = new TrackerTimeline();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackerTimeline;
}
