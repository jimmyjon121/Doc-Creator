/**
 * Tracker UI Enhancements
 * Adds completion indicators and tracker intelligence to dashboard
 */

(function() {
    'use strict';
    
    console.log('[TrackerUI] Initializing tracker UI enhancements...');
    
    // Wait for dependencies
    const waitForDependencies = () => {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (window.trackerEngine && window.dashboardManager) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);
        });
    };
    
    // Enhance client card with tracker completion
    const enhanceClientCard = (card, client) => {
        // Check if already enhanced
        if (card.querySelector('.tracker-status')) return;
        
        // Get completion score
        const score = window.trackerEngine.getCompletionScore(client);
        
        // Create tracker status element
        const trackerStatus = document.createElement('div');
        trackerStatus.className = 'tracker-status';
        trackerStatus.innerHTML = `
            <div class="tracker-completion">
                <div class="completion-bar">
                    <div class="completion-fill" style="width: ${score.overallPercentage}%"></div>
                </div>
                <div class="completion-text">
                    <span class="completion-percentage">📊 Chart: ${score.overallPercentage}% Complete</span>
                    ${score.missingCritical.length > 0 ? 
                        `<span class="critical-missing">⚠️ ${score.missingCritical.length} critical items missing</span>` : 
                        ''
                    }
                </div>
            </div>
            ${score.missingCritical.length > 0 ? 
                `<div class="missing-items">
                    Missing: ${score.missingCritical.slice(0, 3).map(item => item.label).join(', ')}
                    ${score.missingCritical.length > 3 ? ` +${score.missingCritical.length - 3} more` : ''}
                </div>` : 
                ''
            }
        `;
        
        // Add risk level class
        trackerStatus.classList.add(`risk-${score.riskLevel}`);
        
        // Find insertion point (after client info, before actions)
        const clientInfo = card.querySelector('.client-info');
        if (clientInfo && clientInfo.nextSibling) {
            clientInfo.parentNode.insertBefore(trackerStatus, clientInfo.nextSibling);
        } else {
            card.appendChild(trackerStatus);
        }
        
        // Add click handler for detailed view
        trackerStatus.addEventListener('click', (e) => {
            e.stopPropagation();
            showTrackerDetails(client);
        });
    };
    
    // Show detailed tracker modal
    const showTrackerDetails = (client) => {
        const score = window.trackerEngine.getCompletionScore(client);
        const upcoming = window.trackerEngine.getUpcomingDeadlines(client);
        
        // Create modal
        const modal = document.createElement('div');
        modal.className = 'tracker-modal-overlay';
        modal.innerHTML = `
            <div class="tracker-modal">
                <div class="tracker-modal-header">
                    <h3>Tracker Status: ${client.initials}</h3>
                    <button class="close-btn" onclick="this.closest('.tracker-modal-overlay').remove()">×</button>
                </div>
                <div class="tracker-modal-content">
                    <div class="tracker-summary">
                        <div class="summary-stat">
                            <span class="stat-label">Overall</span>
                            <span class="stat-value">${score.overallPercentage}%</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Critical</span>
                            <span class="stat-value">${score.criticalPercentage}%</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Complete</span>
                            <span class="stat-value">${score.completedItems}/${score.totalItems}</span>
                        </div>
                        <div class="summary-stat">
                            <span class="stat-label">Days to Discharge</span>
                            <span class="stat-value">${score.daysToDischarge}</span>
                        </div>
                    </div>
                    
                    ${score.missingCritical.length > 0 ? `
                        <div class="missing-critical-section">
                            <h4>⚠️ Missing Critical Items</h4>
                            <ul class="missing-list">
                                ${score.missingCritical.map(item => `
                                    <li class="missing-item">
                                        <span class="item-label">${item.label}</span>
                                        <span class="item-due">Due by day ${item.dueByDay}</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${upcoming.length > 0 ? `
                        <div class="upcoming-section">
                            <h4>📅 Upcoming Deadlines</h4>
                            <ul class="upcoming-list">
                                ${upcoming.map(item => `
                                    <li class="upcoming-item">
                                        <span class="item-label">${item.label}</span>
                                        <span class="item-due">Due in ${item.daysUntilDue} days</span>
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="tracker-actions">
                        <button class="btn-primary" onclick="openBulkUpdate('${client.id}')">Quick Update</button>
                        <button class="btn-secondary" onclick="generateTrackerTasks('${client.id}')">Generate Tasks</button>
                        <button class="btn-secondary" onclick="openTrackerTimeline('${client.id}')">View Timeline</button>
                        <button class="btn-secondary" onclick="aftercareCascade.open('${client.id}')">Aftercare Options</button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
    };
    
    // Intercept dashboard rendering to enhance cards
    const interceptDashboardRender = () => {
        const originalRenderClients = window.dashboardManager.renderClients;
        
        window.dashboardManager.renderClients = async function(clients, container) {
            // Call original render
            await originalRenderClients.call(this, clients, container);
            
            // Enhance each card
            const cards = container.querySelectorAll('.client-card');
            cards.forEach((card, index) => {
                if (clients[index]) {
                    enhanceClientCard(card, clients[index]);
                }
            });
        };
    };
    
    // Add tracker tasks to flight plan
    const enhanceFlightPlan = () => {
        const originalLoadPriorities = window.dashboardManager.loadPriorities;
        
        window.dashboardManager.loadPriorities = async function() {
            // Call original
            const priorities = await originalLoadPriorities.call(this);
            
            // Add tracker-generated tasks
            try {
                const clients = await this.getRelevantClients();
                const trackerTasks = [];
                
                for (const client of clients) {
                    const tasks = window.trackerEngine.generateTasksFromGaps(client);
                    trackerTasks.push(...tasks);
                }
                
                // Merge tracker tasks into priorities
                for (const task of trackerTasks) {
                    let zone = 'green';
                    if (task.priority === 'critical') zone = 'red';
                    else if (task.priority === 'high') zone = 'purple';
                    else if (task.priority === 'medium') zone = 'yellow';
                    
                    const item = {
                        type: task.type,
                        client: {
                            id: task.clientId,
                            initials: task.clientInitials,
                            houseId: task.houseId
                        },
                        message: task.title,
                        action: 'Mark Complete',
                        dueDate: task.dueDate,
                        trackerId: task.trackerId,
                        autoGenerated: true,
                        isTrackerTask: true  // Flag to identify tracker tasks
                    };
                    
                    if (!priorities[zone]) priorities[zone] = [];
                    priorities[zone].push(item);
                }
                
                return priorities;
            } catch (error) {
                console.error('[TrackerUI] Error generating tracker tasks:', error);
                return priorities;
            }
        };
    };
    
    // Global functions for modal actions
    window.openBulkUpdate = async (clientId) => {
        // This will be implemented in the bulk update phase
        console.log('[TrackerUI] Bulk update requested for client:', clientId);
        alert('Bulk update feature coming soon!');
    };
    
    window.openTrackerTimeline = async (clientId) => {
        try {
            const client = await window.clientManager.getClient(clientId);
            
            // Create timeline modal
            const modal = document.createElement('div');
            modal.className = 'tracker-modal-overlay timeline-modal-overlay';
            modal.innerHTML = `
                <div class="tracker-modal timeline-modal-large">
                    <div class="tracker-modal-header">
                        <h3>Tracker Timeline</h3>
                        <button class="close-btn" onclick="this.closest('.tracker-modal-overlay').remove()">×</button>
                    </div>
                    <div class="tracker-modal-content">
                        <div id="timeline-container"></div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Render timeline
            const container = modal.querySelector('#timeline-container');
            if (window.trackerTimeline) {
                await window.trackerTimeline.render(client, container);
            } else {
                container.innerHTML = '<p>Timeline component not loaded</p>';
            }
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
            
        } catch (error) {
            console.error('[TrackerUI] Error opening timeline:', error);
            alert('Error loading timeline. Check console for details.');
        }
    };
    
    window.generateTrackerTasks = async (clientId) => {
        try {
            const client = await window.clientManager.getClient(clientId);
            const tasks = window.trackerEngine.generateTasksFromGaps(client);
            
            if (tasks.length === 0) {
                alert('No tasks to generate - all requirements are on track!');
                return;
            }
            
            // Create tasks using task manager
            for (const task of tasks) {
                await window.taskManager.createTask({
                    title: task.title,
                    description: task.description,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    category: 'tracker-generated',
                    clientId: task.clientId,
                    metadata: {
                        trackerId: task.trackerId,
                        autoGenerated: true
                    }
                });
            }
            
            alert(`Generated ${tasks.length} tasks from tracker gaps`);
            
            // Refresh dashboard
            if (window.dashboardManager.loadData) {
                await window.dashboardManager.loadData();
            }
            
            // Close modal
            const modal = document.querySelector('.tracker-modal-overlay');
            if (modal) modal.remove();
            
        } catch (error) {
            console.error('[TrackerUI] Error generating tasks:', error);
            alert('Error generating tasks. Check console for details.');
        }
    };
    
    // Initialize enhancements
    const initialize = async () => {
        console.log('[TrackerUI] Waiting for dependencies...');
        await waitForDependencies();
        
        console.log('[TrackerUI] Enhancing dashboard...');
        interceptDashboardRender();
        enhanceFlightPlan();
        
        // Trigger re-render if dashboard is already loaded
        if (window.dashboardManager.initialized) {
            console.log('[TrackerUI] Refreshing dashboard with tracker enhancements...');
            await window.dashboardManager.loadData();
        }
        
        console.log('[TrackerUI] Tracker UI enhancements ready');
    };
    
    // Start initialization
    initialize();
    
})();
