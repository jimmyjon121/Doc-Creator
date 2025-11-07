/**
 * Dashboard Widgets - Individual widget components for Coach Mission Control
 */

class DashboardWidget {
    constructor(id, container) {
        this.id = id;
        this.container = container;
        this.initialized = false;
        this.loading = false;
    }

    showLoading() {
        this.loading = true;
        if (this.container) {
            this.container.innerHTML = `
                <div class="widget-skeleton">
                    <div class="skeleton-pulse"></div>
                </div>
            `;
        }
    }

    hideLoading() {
        this.loading = false;
    }

    async refresh() {
        await this.render();
    }
}

// Daily Flight Plan Widget
class FlightPlanWidget extends DashboardWidget {
    constructor(container) {
        super('flightPlan', container);
        this.zones = ['red', 'purple', 'yellow', 'green'];
        this.expandedZones = new Set(['red']); // Red zone expanded by default
    }

    async render() {
        this.showLoading();
        
        try {
            const data = dashboardManager.cache.priorities;
            if (!data) return;
            
            const timeContext = dashboardManager.getTimeAwareGreeting();
            
            let html = `
                <div class="flight-plan-widget">
                    <div class="widget-header">
                        <h3>📋 Daily Flight Plan</h3>
                        <span class="time-context">${timeContext.focus}</span>
                    </div>
                    <div class="priority-zones">
            `;
            
            // Render each zone
            for (const zone of this.zones) {
                const items = data[zone] || [];
                const isExpanded = this.expandedZones.has(zone);
                const zoneConfig = this.getZoneConfig(zone);
                
                html += `
                    <div class="priority-zone zone-${zone}" data-zone="${zone}">
                        <div class="zone-header" onclick="dashboardWidgets.toggleZone('${zone}')">
                            <span class="zone-icon">${zoneConfig.icon}</span>
                            <span class="zone-title">${zoneConfig.title}</span>
                            <span class="zone-count">${items.length}</span>
                            <span class="zone-toggle">${isExpanded ? '▼' : '▶'}</span>
                        </div>
                        <div class="zone-content ${isExpanded ? 'expanded' : 'collapsed'}">
                `;
                
                if (items.length === 0) {
                    html += `<div class="empty-zone">No ${zone} zone items</div>`;
                } else {
                    for (const item of items) {
                        html += this.renderPriorityItem(item);
                    }
                }
                
                html += `</div></div>`;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render flight plan:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load priorities</div>';
        }
    }

    getZoneConfig(zone) {
        const configs = {
            red: { icon: '🔴', title: 'Red Zone - Immediate Action' },
            purple: { icon: '🟣', title: 'Purple Zone - Discharge Prep' },
            yellow: { icon: '🟡', title: 'Yellow Zone - Due Today' },
            green: { icon: '🟢', title: 'Green Zone - Upcoming' }
        };
        return configs[zone] || { icon: '⚪', title: 'Unknown' };
    }

    renderPriorityItem(item) {
        const clientInfo = `${item.client.initials} (${item.client.houseId})`;
        const actionId = `action-${item.type}-${item.client.id}-${Date.now()}`;
        
        // For tracker tasks, show mark complete button
        const isTrackerTask = item.isTrackerTask || item.type === 'tracker-gap' || item.type === 'tracker-upcoming';
        
        return `
            <div class="priority-item ${isTrackerTask ? 'tracker-task' : ''}">
                <div class="item-main">
                    <div class="item-info">
                        <span class="client-badge">${clientInfo}</span>
                        <span class="item-message">${item.message}</span>
                        ${item.dueDate ? `<span class="due-date">${item.dueDate}</span>` : ''}
                    </div>
                    <div class="item-actions">
                        ${isTrackerTask ? 
                            `<button class="btn-quick-complete" onclick="dashboardWidgets.completeTrackerItem('${item.client.id}', '${item.trackerId}')" title="Mark Complete">
                                ✓
                            </button>` :
                            `<button class="btn-action" onclick="dashboardWidgets.takeAction('${actionId}', '${item.type}', '${item.client.id}')">
                                ${item.action}
                            </button>`
                        }
                        ${item.type.includes('milestone') && !isTrackerTask ? 
                            `<button class="btn-quick-complete" onclick="dashboardWidgets.quickComplete('${item.client.id}', '${item.milestone?.milestone}')">
                                ✓
                            </button>` : ''
                        }
                    </div>
                </div>
                ${item.checklist ? this.renderChecklist(item.checklist) : ''}
            </div>
        `;
    }

    renderChecklist(checklist) {
        const incomplete = checklist.items.filter(item => !item.complete);
        if (incomplete.length === 0) return '';
        
        return `
            <div class="discharge-checklist">
                <div class="checklist-title">Pending items:</div>
                <ul class="checklist-items">
                    ${incomplete.map(item => `<li>${item.label}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    toggleZone(zone) {
        if (this.expandedZones.has(zone)) {
            this.expandedZones.delete(zone);
        } else {
            this.expandedZones.add(zone);
        }
        
        const zoneElement = this.container.querySelector(`.zone-${zone} .zone-content`);
        const toggleIcon = this.container.querySelector(`.zone-${zone} .zone-toggle`);
        
        if (zoneElement) {
            zoneElement.classList.toggle('expanded');
            zoneElement.classList.toggle('collapsed');
        }
        
        if (toggleIcon) {
            toggleIcon.textContent = this.expandedZones.has(zone) ? '▼' : '▶';
        }
    }
}

// House Weather Widget
class HouseWeatherWidget extends DashboardWidget {
    constructor(container) {
        super('houseWeather', container);
        this.showOnlyNeedingAttention = false;
    }

    async render() {
        this.showLoading();
        
        try {
            const data = dashboardManager.cache.houseHealth;
            if (!data) return;
            
            let html = `
                <div class="house-weather-widget">
                    <div class="widget-header">
                        <h3>🏠 House Weather System</h3>
                        <label class="filter-toggle">
                            <input type="checkbox" ${this.showOnlyNeedingAttention ? 'checked' : ''} 
                                   onchange="dashboardWidgets.toggleHouseFilter(this.checked)">
                            Show only houses needing attention
                        </label>
                    </div>
                    <div class="house-cards">
            `;
            
            // Sort houses by score (worst first)
            const sortedHouses = Object.values(data).sort((a, b) => a.score - b.score);
            
            for (const houseData of sortedHouses) {
                if (this.showOnlyNeedingAttention && houseData.score >= 90) continue;
                
                html += this.renderHouseCard(houseData);
            }
            
            html += `
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render house weather:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load house data</div>';
        }
    }

    renderHouseCard(houseData) {
        const trendIcon = houseData.trend === 'improving' ? '↑' : 
                         houseData.trend === 'declining' ? '↓' : '→';
        const trendClass = houseData.trend === 'improving' ? 'trend-up' : 
                          houseData.trend === 'declining' ? 'trend-down' : 'trend-stable';
        
        const scoreClass = houseData.score >= 90 ? 'excellent' :
                          houseData.score >= 75 ? 'good' :
                          houseData.score >= 60 ? 'fair' : 'critical';
        
        return `
            <div class="house-card score-${scoreClass}" onclick="dashboardWidgets.navigateToHouse('${houseData.house.id}')">
                <div class="house-header">
                    <span class="weather-icon" title="${this.getWeatherDescription(houseData.weather)}">
                        ${houseData.weather}
                    </span>
                    <span class="house-name">${houseData.house.name}</span>
                    <span class="trend ${trendClass}">${trendIcon}</span>
                </div>
                <div class="health-bar-container">
                    <div class="health-bar">
                        <div class="health-bar-fill" style="width: ${houseData.score}%"></div>
                    </div>
                    <div class="score-text">${Math.round(houseData.score)}%</div>
                </div>
                <div class="house-stats">
                    <span class="client-count">${houseData.clientCount} clients</span>
                    ${houseData.issues.length > 0 ? 
                        `<span class="issue-count" onclick="event.stopPropagation(); dashboardWidgets.showHouseIssues('${houseData.house.id}')">${houseData.issues.length} issues</span>` : 
                        '<span class="no-issues">✓ All clear</span>'
                    }
                </div>
            </div>
        `;
    }

    getWeatherDescription(weather) {
        const descriptions = {
            '☀️': 'Sunny - All milestones on track',
            '⛅': 'Partly Cloudy - 1-2 items pending',
            '🌧️': 'Rainy - 3+ overdue items',
            '⛈️': 'Stormy - Critical issues requiring immediate attention'
        };
        return descriptions[weather] || 'Unknown';
    }

    toggleFilter(showOnlyNeedingAttention) {
        this.showOnlyNeedingAttention = showOnlyNeedingAttention;
        this.render();
    }
}

// Client Journey Radar Widget
class JourneyRadarWidget extends DashboardWidget {
    constructor(container) {
        super('journeyRadar', container);
    }

    async render() {
        this.showLoading();
        
        try {
            const data = dashboardManager.cache.journeyData;
            if (!data) return;
            
            const segments = [
                { key: 'admission', label: 'Admission', color: 'green' },
                { key: 'week1', label: 'Week 1', color: 'green' },
                { key: 'day14', label: 'Day 14', color: 'yellow' },
                { key: 'day30', label: 'Day 30', color: 'orange' },
                { key: 'day45plus', label: '45+ Days', color: 'red' },
                { key: 'discharge', label: 'Discharge Pipeline', color: 'purple' }
            ];
            
            let html = `
                <div class="journey-radar-widget">
                    <div class="widget-header">
                        <h3>🧭 Client Journey Radar</h3>
                    </div>
                    <div class="journey-timeline">
            `;
            
            for (const segment of segments) {
                const clients = data[segment.key] || [];
                const hasClients = clients.length > 0;
                
                html += `
                    <div class="journey-segment segment-${segment.color} ${hasClients ? 'has-clients' : ''}" 
                         data-segment="${segment.key}"
                         onclick="${hasClients ? `dashboardWidgets.showSegmentClients('${segment.key}')` : ''}">
                        <div class="segment-label">${segment.label}</div>
                        <div class="segment-count">${clients.length}</div>
                        ${segment.key === 'discharge' && clients.length > 0 ? 
                            `<div class="segment-detail">Next: ${clients[0].initials} in ${clients[0].daysUntilDischarge}d</div>` : 
                            ''
                        }
                    </div>
                `;
                
                if (segment.key !== 'discharge') {
                    html += '<div class="segment-connector">→</div>';
                }
            }
            
            html += `
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            this.hideLoading();
            
            // Add hover tooltips
            this.addSegmentTooltips(data, segments);
        } catch (error) {
            console.error('Failed to render journey radar:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load journey data</div>';
        }
    }

    addSegmentTooltips(data, segments) {
        segments.forEach(segment => {
            const element = this.container.querySelector(`[data-segment="${segment.key}"]`);
            if (element && data[segment.key]?.length > 0) {
                const clients = data[segment.key].slice(0, 5).map(c => c.initials).join(', ');
                const more = data[segment.key].length > 5 ? ` +${data[segment.key].length - 5} more` : '';
                element.title = `${clients}${more}`;
            }
        });
    }
}

// Today's Missions Widget
class MissionsWidget extends DashboardWidget {
    constructor(container) {
        super('missions', container);
        this.completedMissions = new Set(this.loadCompletedMissions());
    }
    
    loadCompletedMissions() {
        const today = new Date().toDateString();
        const saved = localStorage.getItem('completedMissions');
        if (saved) {
            const data = JSON.parse(saved);
            // Reset if it's a new day
            if (data.date !== today) {
                localStorage.removeItem('completedMissions');
                return [];
            }
            return data.missions || [];
        }
        return [];
    }
    
    saveCompletedMissions() {
        const today = new Date().toDateString();
        localStorage.setItem('completedMissions', JSON.stringify({
            date: today,
            missions: Array.from(this.completedMissions)
        }));
    }
    
    getMissionId(mission) {
        return `${mission.client.id}-${mission.type || mission.action || 'mission'}`;
    }
    
    isMissionComplete(mission) {
        return this.completedMissions.has(this.getMissionId(mission));
    }

    async render() {
        this.showLoading();
        
        try {
            const priorities = dashboardManager.cache.priorities;
            const quickWins = await dashboardManager.getQuickWins();
            
            // Determine primary mission (most urgent red zone item)
            const primaryMission = priorities.red?.[0];
            
            // Secondary missions (next 2-3 important items)
            const secondaryMissions = [
                ...(priorities.red?.slice(1, 2) || []),
                ...(priorities.purple?.slice(0, 2) || []),
                ...(priorities.yellow?.slice(0, 2) || [])
            ].slice(0, 3);
            
            // Count missions
            const allMissions = [];
            if (primaryMission && !this.isMissionComplete(primaryMission)) allMissions.push(primaryMission);
            secondaryMissions.forEach(m => { if (!this.isMissionComplete(m)) allMissions.push(m); });
            quickWins.slice(0, 3).forEach(w => { if (!this.isMissionComplete(w)) allMissions.push(w); });
            
            const totalMissions = (primaryMission ? 1 : 0) + secondaryMissions.length + Math.min(quickWins.length, 3);
            const completedCount = this.completedMissions.size;
            
            let html = `
                <div class="missions-widget">
                    <div class="widget-header">
                        <h3>🎯 Today's Missions</h3>
                        <div class="mission-progress">
                            ${this.renderProgress(completedCount, totalMissions)}
                            <span class="progress-text">${completedCount}/${totalMissions} Complete</span>
                        </div>
                    </div>
                    <div class="missions-content">
            `;
            
            // Primary Mission
            if (primaryMission) {
                const isComplete = this.isMissionComplete(primaryMission);
                const missionId = this.getMissionId(primaryMission);
                
                html += `
                    <div class="mission-section primary-mission ${isComplete ? 'completed' : ''}">
                        <div class="mission-header">
                            <span class="mission-icon">🎯</span>
                            <span class="mission-type">Primary Objective</span>
                            <span class="mission-time">Est. 15 min</span>
                        </div>
                        <div class="mission-item" id="mission-${missionId}">
                            <input type="checkbox" 
                                   class="mission-checkbox" 
                                   id="check-${missionId}"
                                   ${isComplete ? 'checked' : ''}
                                   onchange="dashboardWidgets.toggleMission('${missionId}', this.checked)">
                            <label for="check-${missionId}" class="mission-content">
                                <div class="mission-client">${primaryMission.client.initials}</div>
                                <div class="mission-task ${isComplete ? 'task-complete' : ''}">${primaryMission.message}</div>
                            </label>
                            ${!isComplete ? `
                                <button class="btn-mission-action" onclick="dashboardWidgets.takeAction('primary', '${primaryMission.type}', '${primaryMission.client.id}')">
                                    Take Action
                                </button>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            // Secondary Missions
            if (secondaryMissions.length > 0) {
                html += `
                    <div class="mission-section secondary-missions">
                        <div class="mission-header">
                            <span class="mission-icon">🎖️</span>
                            <span class="mission-type">Secondary Objectives</span>
                            <span class="mission-time">Est. ${secondaryMissions.length * 15} min</span>
                        </div>
                `;
                
                for (const mission of secondaryMissions) {
                    const isComplete = this.isMissionComplete(mission);
                    const missionId = this.getMissionId(mission);
                    
                    html += `
                        <div class="mission-item ${isComplete ? 'completed' : ''}" id="mission-${missionId}">
                            <input type="checkbox" 
                                   class="mission-checkbox" 
                                   id="check-${missionId}"
                                   ${isComplete ? 'checked' : ''}
                                   onchange="dashboardWidgets.toggleMission('${missionId}', this.checked)">
                            <label for="check-${missionId}" class="mission-content">
                                <div class="mission-client">${mission.client.initials}</div>
                                <div class="mission-task ${isComplete ? 'task-complete' : ''}">${mission.message}</div>
                            </label>
                        </div>
                    `;
                }
                
                html += '</div>';
            }
            
            // Quick Wins
            if (quickWins.length > 0) {
                const displayWins = quickWins.slice(0, 3);
                const totalTime = displayWins.reduce((sum, win) => sum + win.estimatedTime, 0);
                
                html += `
                    <div class="mission-section quick-wins">
                        <div class="mission-header">
                            <span class="mission-icon">⚡</span>
                            <span class="mission-type">Quick Wins</span>
                            <span class="mission-time">< ${totalTime} min total</span>
                        </div>
                `;
                
                for (const win of displayWins) {
                    const isComplete = this.isMissionComplete(win);
                    const missionId = this.getMissionId(win);
                    
                    html += `
                        <div class="mission-item quick-win ${isComplete ? 'completed' : ''}" id="mission-${missionId}">
                            <input type="checkbox" 
                                   class="mission-checkbox" 
                                   id="check-${missionId}"
                                   ${isComplete ? 'checked' : ''}
                                   onchange="dashboardWidgets.toggleMission('${missionId}', this.checked)">
                            <label for="check-${missionId}" class="mission-content">
                                <div class="mission-client">${win.client.initials}</div>
                                <div class="mission-task ${isComplete ? 'task-complete' : ''}">${win.action}</div>
                                <span class="quick-time">${win.estimatedTime}m</span>
                            </label>
                        </div>
                    `;
                }
                
                html += '</div>';
            }
            
            html += `
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render missions:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load missions</div>';
        }
    }

    renderProgress(completed, total) {
        const circles = [];
        for (let i = 0; i < total; i++) {
            const isCompleted = i < completed;
            circles.push(`<span class="progress-circle ${isCompleted ? 'completed' : ''}">${isCompleted ? '✓' : '○'}</span>`);
        }
        return circles.join('');
    }
    
    toggleMission(missionId, isChecked) {
        if (isChecked) {
            this.completedMissions.add(missionId);
        } else {
            this.completedMissions.delete(missionId);
        }
        this.saveCompletedMissions();
        
        // Update visual state with animation
        const missionElement = document.getElementById(`mission-${missionId}`);
        if (missionElement) {
            if (isChecked) {
                missionElement.classList.add('completed');
                // Add completion animation
                missionElement.style.animation = 'missionComplete 0.5s ease';
            } else {
                missionElement.classList.remove('completed');
            }
            
            // Update task text styling
            const taskElement = missionElement.querySelector('.mission-task');
            if (taskElement) {
                taskElement.classList.toggle('task-complete', isChecked);
            }
        }
        
        // Re-render to update progress
        setTimeout(() => this.render(), 600);
    }
}

// North Star Metrics Widget
class MetricsWidget extends DashboardWidget {
    constructor(container) {
        super('metrics', container);
    }

    async render() {
        this.showLoading();
        
        try {
            const metrics = dashboardManager.cache.metrics;
            if (!metrics) return;
            
            const trendIcon = metrics.trend?.direction === 'up' ? '↑' : 
                             metrics.trend?.direction === 'down' ? '↓' : '→';
            const trendClass = metrics.trend?.direction === 'up' ? 'trend-positive' : 
                              metrics.trend?.direction === 'down' ? 'trend-negative' : '';
            
            let html = `
                <div class="metrics-widget">
                    <div class="widget-header">
                        <h3>⭐ Your North Star</h3>
                    </div>
                    <div class="metrics-grid">
                        <div class="metric-item">
                            <div class="metric-value">${metrics.todayAftercareOnTime}/${metrics.todayAftercareTotal}</div>
                            <div class="metric-label">Today's Aftercare</div>
                            ${metrics.todayAftercareOnTime === metrics.todayAftercareTotal && metrics.todayAftercareTotal > 0 ? 
                                '<div class="metric-badge">✅ Perfect!</div>' : ''}
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">
                                ${metrics.weekCompletionRate}%
                                <span class="trend-indicator ${trendClass}">${trendIcon}</span>
                            </div>
                            <div class="metric-label">Week Completion</div>
                            ${metrics.trend ? 
                                `<div class="metric-comparison">${trendIcon} ${Math.abs(metrics.trend.percentage)}% vs last week</div>` : 
                                ''}
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">${metrics.activeClients}</div>
                            <div class="metric-label">Active Clients</div>
                            <div class="metric-detail">across ${metrics.totalHouses} houses</div>
                        </div>
                        <div class="metric-item">
                            <div class="metric-value">${metrics.weeklyComplete}/${metrics.weeklyGoal}</div>
                            <div class="metric-label">Weekly Goal</div>
                            <div class="metric-progress">
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${(metrics.weeklyComplete / metrics.weeklyGoal) * 100}%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    ${this.renderStreak(metrics)}
                </div>
            `;
            
            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render metrics:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load metrics</div>';
        }
    }

    renderStreak(metrics) {
        // Mock streak data - would be calculated from historical data
        const streakDays = 3;
        if (streakDays === 0) return '';
        
        return `
            <div class="streak-indicator">
                <span class="streak-icon">🔥</span>
                <span class="streak-text">${streakDays} day streak - all milestones on time!</span>
            </div>
        `;
    }
}

// Quick Actions Widget
class QuickActionsWidget extends DashboardWidget {
    constructor(container) {
        super('quickActions', container);
    }

    async render() {
        const suggestions = await dashboardManager.generateSmartSuggestions();
        
        let html = `
            <div class="quick-actions-widget">
                <div class="actions-row">
                    <button class="quick-action-btn" onclick="showAddClientModal()">
                        <span class="action-icon">➕</span>
                        <span class="action-label">Add Client</span>
                    </button>
                    <button class="quick-action-btn" onclick="dashboardWidgets.quickGenerateDoc()">
                        <span class="action-icon">📄</span>
                        <span class="action-label">Generate Doc</span>
                    </button>
                    <button class="quick-action-btn" onclick="dashboardWidgets.viewAllAlerts()">
                        <span class="action-icon">🔔</span>
                        <span class="action-label">All Alerts</span>
                    </button>
                    <button class="quick-action-btn" onclick="dashboardWidgets.exportDashboard()">
                        <span class="action-icon">📊</span>
                        <span class="action-label">Export Report</span>
                    </button>
                    <button class="quick-action-btn" onclick="dashboardWidgets.enterFocusMode()">
                        <span class="action-icon">🎯</span>
                        <span class="action-label">Focus Mode</span>
                    </button>
                    <button class="quick-action-btn refresh" onclick="dashboardManager.refreshDashboard()">
                        <span class="action-icon">🔄</span>
                        <span class="action-label">Refresh</span>
                    </button>
                </div>
                ${suggestions.length > 0 ? this.renderSuggestions(suggestions) : ''}
            </div>
        `;
        
        this.container.innerHTML = html;
    }

    renderSuggestions(suggestions) {
        return `
            <div class="smart-suggestions">
                <div class="suggestions-header">💡 Smart Suggestions</div>
                <div class="suggestions-list">
                    ${suggestions.map(s => `
                        <div class="suggestion-item">
                            <span class="suggestion-icon">${s.icon}</span>
                            <span class="suggestion-text">${s.text}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
}

// Dashboard Widgets Manager
class DashboardWidgets {
    constructor() {
        this.widgets = new Map();
    }

    async initialize() {
        console.log('Initializing dashboard widgets...');
        
        // Create widget instances
        const widgetContainers = {
            flightPlan: document.getElementById('flightPlanWidget'),
            houseWeather: document.getElementById('houseWeatherWidget'),
            journeyRadar: document.getElementById('journeyRadarWidget'),
            missions: document.getElementById('missionsWidget'),
            metrics: document.getElementById('metricsWidget'),
            quickActions: document.getElementById('quickActionsWidget')
        };
        
        // Initialize widgets
        if (widgetContainers.flightPlan) {
            this.widgets.set('flightPlan', new FlightPlanWidget(widgetContainers.flightPlan));
        }
        
        if (widgetContainers.houseWeather) {
            this.widgets.set('houseWeather', new HouseWeatherWidget(widgetContainers.houseWeather));
        }
        
        if (widgetContainers.journeyRadar) {
            this.widgets.set('journeyRadar', new JourneyRadarWidget(widgetContainers.journeyRadar));
        }
        
        if (widgetContainers.missions) {
            this.widgets.set('missions', new MissionsWidget(widgetContainers.missions));
        }
        
        if (widgetContainers.metrics) {
            this.widgets.set('metrics', new MetricsWidget(widgetContainers.metrics));
        }
        
        if (widgetContainers.quickActions) {
            this.widgets.set('quickActions', new QuickActionsWidget(widgetContainers.quickActions));
        }
        
        // Register widgets with dashboard manager
        for (const [id, widget] of this.widgets) {
            dashboardManager.registerWidget(id, widget);
        }
        
        console.log('✅ Dashboard widgets initialized');
    }

    async renderAll() {
        console.log('Rendering all widgets...');
        
        // Render critical widgets first (Flight Plan)
        const flightPlan = this.widgets.get('flightPlan');
        if (flightPlan) await flightPlan.render();
        
        // Then render other widgets in parallel
        const otherWidgets = Array.from(this.widgets.values()).filter(w => w.id !== 'flightPlan');
        await Promise.all(otherWidgets.map(widget => widget.render()));
    }

    // Widget action handlers
    toggleZone(zone) {
        const widget = this.widgets.get('flightPlan');
        if (widget) widget.toggleZone(zone);
    }
    
    toggleMission(missionId, isChecked) {
        const widget = this.widgets.get('missions');
        if (widget) widget.toggleMission(missionId, isChecked);
    }

    async takeAction(actionId, type, clientId) {
        // Handle different action types
        if (type === 'aftercare_urgent' || type === 'aftercare_critical') {
            // Open aftercare options modal
            const client = await clientManager.getClient(clientId);
            if (client) {
                viewClientDetails(client);
                // Switch to aftercare tab
                setTimeout(() => {
                    const aftercareTab = document.querySelector('[onclick*="showClientTab(\'aftercare\')"]');
                    if (aftercareTab) aftercareTab.click();
                }, 100);
            }
        } else if (type === 'discharge_prep') {
            // Open client details on overview tab
            const client = await clientManager.getClient(clientId);
            if (client) viewClientDetails(client);
        } else if (type.includes('milestone')) {
            // Open client details on milestones tab
            const client = await clientManager.getClient(clientId);
            if (client) {
                viewClientDetails(client);
                setTimeout(() => {
                    const milestonesTab = document.querySelector('[onclick*="showClientTab(\'milestones\')"]');
                    if (milestonesTab) milestonesTab.click();
                }, 100);
            }
        }
    }

    async quickComplete(clientId, milestone) {
        try {
            if (!window.milestonesManager) {
                showNotification('Milestones manager not available', 'warning');
                return;
            }
            await window.milestonesManager.updateMilestoneStatus(clientId, milestone, 'complete');
            await dashboardManager.refreshDashboard();
            showNotification('Milestone completed!', 'success');
        } catch (error) {
            console.error('Failed to complete milestone:', error);
            showNotification('Failed to complete milestone', 'error');
        }
    }

    async completeTrackerItem(clientId, trackerId) {
        try {
            if (!window.clientManager) {
                showNotification('Client manager not available', 'warning');
                return;
            }
            
            // Get the client
            const client = await window.clientManager.getClient(clientId);
            if (!client) {
                showNotification('Client not found', 'error');
                return;
            }
            
            // Update the tracker item
            const updates = {
                [trackerId]: true,
                [trackerId + 'Date']: new Date().toISOString()
            };
            
            await window.clientManager.updateClient(clientId, updates);
            
            // Refresh dashboard
            if (dashboardManager.refreshDashboard) {
                await dashboardManager.refreshDashboard();
            }
            
            showNotification('Tracker item completed!', 'success');
        } catch (error) {
            console.error('Failed to complete tracker item:', error);
            showNotification('Failed to complete tracker item', 'error');
        }
    }

    toggleHouseFilter(showOnlyNeedingAttention) {
        const widget = this.widgets.get('houseWeather');
        if (widget) widget.toggleFilter(showOnlyNeedingAttention);
    }

    navigateToHouse(houseId) {
        // Switch to Clients tab and select house
        switchTab('clients');
        setTimeout(() => switchToHouse(houseId), 100);
    }

    showHouseIssues(houseId) {
        // Show modal with house issues
        const houseData = dashboardManager.cache.houseHealth[houseId];
        if (!houseData) return;
        
        let issuesHtml = '<ul>';
        for (const issue of houseData.issues) {
            issuesHtml += `<li>${issue.client}: ${issue.milestone} (${issue.type})</li>`;
        }
        issuesHtml += '</ul>';
        
        showModal({
            title: `${houseData.house.name} Issues`,
            content: issuesHtml,
            buttons: [
                {
                    text: 'Go to House',
                    action: () => this.navigateToHouse(houseId)
                },
                {
                    text: 'Close',
                    action: () => closeModal()
                }
            ]
        });
    }

    showSegmentClients(segment) {
        const clients = dashboardManager.cache.journeyData[segment];
        if (!clients || clients.length === 0) return;
        
        let content = '<div class="segment-clients-list">';
        for (const client of clients) {
            const daysInfo = segment === 'discharge' ? 
                ` - ${client.daysUntilDischarge} days until discharge` : 
                ` - Day ${dashboardManager.calculateDaysInCare(client.admissionDate)}`;
            
            content += `
                <div class="segment-client-item" onclick="viewClientDetails(clientManager.getClient('${client.id}'))">
                    <span class="client-initials">${client.initials}</span>
                    <span class="client-house">${client.houseId}</span>
                    <span class="client-info">${daysInfo}</span>
                </div>
            `;
        }
        content += '</div>';
        
        showModal({
            title: this.getSegmentTitle(segment),
            content: content,
            buttons: [{ text: 'Close', action: () => closeModal() }]
        });
    }

    getSegmentTitle(segment) {
        const titles = {
            admission: 'New Admissions',
            week1: 'Week 1 Clients',
            day14: 'Day 14 Clients',
            day30: 'Day 30 Clients',
            day45plus: '45+ Days Clients',
            discharge: 'Discharge Pipeline'
        };
        return titles[segment] || 'Clients';
    }

    async markMissionComplete(clientId, type) {
        // Handle mission completion
        console.log('Marking mission complete:', clientId, type);
        await dashboardManager.refreshDashboard();
    }

    quickGenerateDoc() {
        // Show quick document generation modal
        switchTab('programs');
    }

    viewAllAlerts() {
        // Show all alerts in a modal
        const alerts = dashboardManager.cache.priorities;
        let content = '<div class="all-alerts-view">';
        
        for (const [zone, items] of Object.entries(alerts)) {
            if (items.length === 0) continue;
            
            content += `<h4>${zone.charAt(0).toUpperCase() + zone.slice(1)} Zone (${items.length})</h4>`;
            content += '<ul>';
            
            for (const item of items) {
                content += `<li>${item.client.initials}: ${item.message}</li>`;
            }
            
            content += '</ul>';
        }
        
        content += '</div>';
        
        showModal({
            title: 'All Alerts',
            content: content,
            buttons: [{ text: 'Close', action: () => closeModal() }]
        });
    }

    async exportDashboard() {
        try {
            const data = {
                exportDate: new Date().toISOString(),
                coach: dashboardManager.currentCoach,
                priorities: dashboardManager.cache.priorities,
                metrics: dashboardManager.cache.metrics,
                houseHealth: dashboardManager.cache.houseHealth
            };
            
            const csv = this.convertToCSV(data);
            const filename = `dashboard_export_${new Date().toISOString().split('T')[0]}.csv`;
            
            this.downloadCSV(csv, filename);
            showNotification('Dashboard exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export dashboard:', error);
            showNotification('Failed to export dashboard', 'error');
        }
    }

    convertToCSV(data) {
        // Simple CSV conversion for dashboard data
        let csv = 'Dashboard Export\n';
        csv += `Date: ${new Date().toLocaleDateString()}\n`;
        csv += `Coach: ${data.coach.initials}\n\n`;
        
        csv += 'Priority Alerts\n';
        csv += 'Zone,Client,Message,Due Date\n';
        
        for (const [zone, items] of Object.entries(data.priorities)) {
            for (const item of items) {
                csv += `${zone},${item.client.initials},${item.message},${item.dueDate}\n`;
            }
        }
        
        return csv;
    }

    downloadCSV(csv, filename) {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    enterFocusMode() {
        // Focus mode - batch similar tasks
        showNotification('Focus mode coming soon!', 'info');
    }
}

// Create global instance
const dashboardWidgets = new DashboardWidgets();
