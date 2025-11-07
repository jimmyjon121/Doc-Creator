/**
 * Missions Widget Redesign
 * Modern, beautiful redesign of the Today's Missions widget
 */

(function() {
    'use strict';
    
    // Wait for dashboard to be ready
    function waitForDashboard() {
        if (!window.dashboardWidgets || !window.dashboardManager) {
            setTimeout(waitForDashboard, 100);
            return;
        }
        
        enhanceMissionsWidget();
    }
    
    /**
     * Enhance the missions widget with modern design
     */
    function enhanceMissionsWidget() {
        // Wait for MissionsWidget to be available
        const checkForWidget = setInterval(() => {
            // Find the missions widget instance
            const widgetsManager = window.dashboardWidgets;
            if (widgetsManager && widgetsManager.widgets) {
                const missionsWidget = widgetsManager.widgets.get('missions');
                if (missionsWidget) {
                    clearInterval(checkForWidget);
                    
                    // Override the render method
                    const originalRender = missionsWidget.render.bind(missionsWidget);
                    missionsWidget.render = async function() {
                        try {
                            // Get the data first
                            const alerts = await window.dashboardManager.loadCriticalAlerts();
                            
                            // Use our modern rendering
                            const modernHtml = renderModernMissions(alerts);
                            
                            // Update the container
                            if (this.container) {
                                this.container.innerHTML = modernHtml;
                            }
                        } catch (error) {
                            console.error('Error rendering modern missions:', error);
                            // Fallback to original
                            return originalRender();
                        }
                    };
                    
                    // Trigger a re-render
                    missionsWidget.render();
                }
            }
        }, 100);
        
        // Also create the widget if it doesn't exist
        setTimeout(() => {
            clearInterval(checkForWidget);
            createMissionsWidgetIfMissing();
        }, 5000);
    }
    
    function createMissionsWidgetIfMissing() {
        // Check if there's a container for missions but no widget
        const container = document.querySelector('[data-widget="missions"], .missions-container');
        if (container && window.dashboardWidgets && !window.dashboardWidgets.widgets.get('missions')) {
            // Create a custom missions widget
            const missionsWidget = {
                id: 'missions',
                container: container,
                render: async function() {
                    const alerts = await window.dashboardManager.loadCriticalAlerts();
                    container.innerHTML = renderModernMissions(alerts);
                }
            };
            
            window.dashboardWidgets.widgets.set('missions', missionsWidget);
            missionsWidget.render();
        }
    }
    
    /**
     * Render modern missions widget
     */
    function renderModernMissions(data) {
        // Get missions from red and yellow zones
        const primaryMissions = data.red || [];
        const secondaryMissions = data.yellow || [];
        const totalMissions = primaryMissions.length + secondaryMissions.length;
        const completedCount = 0; // Would need to track this in actual implementation
        
        let html = `
            <div class="missions-widget">
                <!-- Header -->
                <div class="missions-header">
                    <div class="missions-title">
                        Today's Missions
                    </div>
                    <div class="missions-progress">
                        <div class="progress-circles">
                            ${Array(Math.max(2, totalMissions)).fill().map((_, i) => 
                                `<div class="progress-circle ${i < completedCount ? 'completed' : ''}"></div>`
                            ).join('')}
                        </div>
                        <span>${completedCount}/${totalMissions} Complete</span>
                    </div>
                </div>
        `;
        
        if (totalMissions === 0) {
            html += `
                <div class="missions-empty">
                    <div class="missions-empty-icon">🎉</div>
                    <div class="missions-empty-text">All missions complete! Great work!</div>
                </div>
            `;
        } else {
            // Primary Objectives
            if (primaryMissions.length > 0) {
                html += `
                    <div class="mission-section primary">
                        <div class="mission-section-header">
                            <div class="mission-label">
                                <div class="icon">🎯</div>
                                Primary Objective
                            </div>
                            <div class="mission-time">Est. ${primaryMissions.length * 5} min</div>
                        </div>
                        <div class="mission-items">
                `;
                
                primaryMissions.forEach(mission => {
                    const clientInfo = mission.client ? 
                        `<span class="mission-client">${mission.client.initials || 'Client'}</span>` : '';
                    
                    html += `
                        <div class="mission-item critical">
                            <div class="mission-checkbox">
                                <input type="checkbox" 
                                       id="mission-${mission.type}-${mission.client?.id}"
                                       ${mission.isTrackerTask ? 
                                         `onclick="dashboardWidgets.completeTrackerItem('${mission.client?.id}', '${mission.trackerId}')"` :
                                         `onclick="dashboardWidgets.completeMission('${mission.type}', '${mission.client?.id}')"` 
                                       }>
                            </div>
                            <div class="mission-content">
                                ${clientInfo}
                                <span class="mission-text">${mission.message}</span>
                                ${mission.priority === 'red' ? '<span class="mission-critical">CRITICAL</span>' : ''}
                            </div>
                            ${mission.action && mission.action !== 'Mark Complete' ? 
                                `<button class="mission-action" onclick="dashboardWidgets.takeAction('${mission.type}', '${mission.client?.id}')">
                                    ${mission.action}
                                </button>` : ''
                            }
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
            
            // Secondary Objectives
            if (secondaryMissions.length > 0) {
                html += `
                    <div class="mission-section secondary">
                        <div class="mission-section-header">
                            <div class="mission-label">
                                <div class="icon">🎪</div>
                                Secondary Objectives
                            </div>
                            <div class="mission-time">Est. ${secondaryMissions.length * 5} min</div>
                        </div>
                        <div class="mission-items">
                `;
                
                secondaryMissions.forEach(mission => {
                    const clientInfo = mission.client ? 
                        `<span class="mission-client">${mission.client.initials || 'Client'}</span>` : '';
                    
                    html += `
                        <div class="mission-item">
                            <div class="mission-checkbox">
                                <input type="checkbox" 
                                       id="mission-${mission.type}-${mission.client?.id}"
                                       ${mission.isTrackerTask ? 
                                         `onclick="dashboardWidgets.completeTrackerItem('${mission.client?.id}', '${mission.trackerId}')"` :
                                         `onclick="dashboardWidgets.completeMission('${mission.type}', '${mission.client?.id}')"` 
                                       }>
                            </div>
                            <div class="mission-content">
                                ${clientInfo}
                                <span class="mission-text">${mission.message}</span>
                            </div>
                            ${mission.action && mission.action !== 'Mark Complete' ? 
                                `<button class="mission-action" onclick="dashboardWidgets.takeAction('${mission.type}', '${mission.client?.id}')">
                                    ${mission.action}
                                </button>` : ''
                            }
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            }
        }
        
        html += `
            </div>
            
            <!-- Quick Actions Bar -->
            <div class="quick-actions">
                <button class="quick-action-btn" onclick="dashboardWidgets.openAddClient()">
                    <div class="quick-action-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                        ➕
                    </div>
                    <span class="quick-action-label">Add Client</span>
                </button>
                
                <button class="quick-action-btn" onclick="dashboardWidgets.openGenerateDoc()">
                    <div class="quick-action-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white;">
                        📄
                    </div>
                    <span class="quick-action-label">Generate Doc</span>
                </button>
                
                <button class="quick-action-btn" onclick="dashboardWidgets.showAllAlerts()">
                    <div class="quick-action-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white;">
                        🔔
                    </div>
                    <span class="quick-action-label">All Alerts</span>
                </button>
                
                <button class="quick-action-btn" onclick="dashboardWidgets.exportReport()">
                    <div class="quick-action-icon" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white;">
                        📊
                    </div>
                    <span class="quick-action-label">Export Report</span>
                </button>
                
                <button class="quick-action-btn" onclick="dashboardWidgets.toggleFocusMode()">
                    <div class="quick-action-icon" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white;">
                        🎯
                    </div>
                    <span class="quick-action-label">Focus Mode</span>
                </button>
                
                <button class="quick-action-btn" onclick="location.reload()">
                    <div class="quick-action-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white;">
                        🔄
                    </div>
                    <span class="quick-action-label">Refresh</span>
                </button>
            </div>
        `;
        
        return html;
    }
    
    // Add mission completion handler if it doesn't exist
    if (window.dashboardWidgets && !window.dashboardWidgets.completeMission) {
        window.dashboardWidgets.completeMission = async function(missionType, clientId) {
            // Mark mission as complete
            console.log('Completing mission:', missionType, clientId);
            
            // Add completion animation
            const checkbox = document.querySelector(`#mission-${missionType}-${clientId}`);
            if (checkbox) {
                checkbox.checked = true;
                const missionItem = checkbox.closest('.mission-item');
                if (missionItem) {
                    missionItem.style.opacity = '0.5';
                    missionItem.style.textDecoration = 'line-through';
                }
            }
            
            // Update progress
            setTimeout(() => {
                window.dashboardManager.refreshDashboard();
            }, 500);
        };
    }
    
    // Add placeholder methods for quick actions if they don't exist
    const placeholderMethods = {
        openAddClient: () => console.log('Open Add Client modal'),
        openGenerateDoc: () => {
            // Try to open document creator if available
            const docBtn = document.querySelector('[onclick*="showDocumentCreator"]');
            if (docBtn) docBtn.click();
            else console.log('Open Generate Doc');
        },
        showAllAlerts: () => {
            // Show all zones if collapsed
            document.querySelectorAll('.zone-content.collapsed').forEach(zone => {
                zone.classList.remove('collapsed');
            });
        },
        exportReport: () => {
            // Try to trigger export if available
            if (window.exportDashboardData) {
                window.exportDashboardData();
            } else {
                console.log('Export Report');
            }
        },
        toggleFocusMode: () => {
            // Hide all except missions widget
            document.body.classList.toggle('focus-mode');
            if (document.body.classList.contains('focus-mode')) {
                // Hide other widgets
                document.querySelectorAll('.widget-card').forEach(widget => {
                    if (!widget.querySelector('.missions-widget')) {
                        widget.style.display = 'none';
                    }
                });
            } else {
                // Show all widgets
                document.querySelectorAll('.widget-card').forEach(widget => {
                    widget.style.display = '';
                });
            }
        }
    };
    
    // Add methods if they don't exist
    Object.keys(placeholderMethods).forEach(method => {
        if (window.dashboardWidgets && !window.dashboardWidgets[method]) {
            window.dashboardWidgets[method] = placeholderMethods[method];
        }
    });
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDashboard);
    } else {
        waitForDashboard();
    }
})();
