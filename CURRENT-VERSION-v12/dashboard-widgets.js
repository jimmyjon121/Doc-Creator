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

    renderEmptyState(message, options = {}) {
        if (!this.container) return;
        const actionHtml = options.showDemoAction
            ? `<button type="button" class="widget-empty__action" onclick="window.populateDemoClients && window.populateDemoClients(50)">Populate demo data</button>`
            : '';
        this.container.innerHTML = `
            <div class="widget-empty">
                <p>${message}</p>
                ${actionHtml}
            </div>
        `;
        this.hideLoading();
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
            if (!data || this.isZonesEmpty(data)) {
                this.renderEmptyState('No priority alerts yet. Add clients or populate demo data to see this queue.', { showDemoAction: true });
                return;
            }
            
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

    isZonesEmpty(data) {
        return this.zones.every(zone => !Array.isArray(data[zone]) || data[zone].length === 0);
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
        
        return `
            <div class="priority-item">
                <div class="item-main">
                    <div class="item-info">
                        <span class="client-badge">${clientInfo}</span>
                        <span class="item-message">${item.message}</span>
                        ${item.dueDate ? `<span class="due-date">${item.dueDate}</span>` : ''}
                    </div>
                    <div class="item-actions">
                        <button class="btn-action" onclick="dashboardWidgets.takeAction('${actionId}', '${item.type}', '${item.client.id}')">
                            ${item.action}
                        </button>
                        ${item.type.includes('milestone') ? 
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


// Client Journey Radar Widget
class JourneyRadarWidget extends DashboardWidget {
    constructor(container) {
        super('journeyRadar', container);
    }

    async render() {
        this.showLoading();
        
        try {
            const data = dashboardManager.cache.journeyData || {};
            const hasClients = Object.values(data).some(list => Array.isArray(list) && list.length > 0);
            if (!hasClients) {
                this.renderEmptyState('No journey data yet. Add clients or populate demo data to visualize progress.', { showDemoAction: true });
                return;
            }
            
            const segments = [
                { key: 'week1', label: 'Week 1', color: 'green' },
                { key: 'day14to16', label: 'Day 14-16', color: 'yellow', critical: true },
                { key: 'day30', label: 'Day 30', color: 'blue' },
                { key: 'day45plus', label: '45+ Days', color: 'orange' },
                { key: 'dischargePipeline', label: 'Discharge Pipeline', color: 'purple' },
                { key: 'recentlyDischarged', label: 'Recently Discharged', color: 'gray' }
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
                
                // Check for critical aftercare needs
                let criticalIndicator = '';
                if (segment.key === 'day14to16' && clients.length > 0) {
                    const needingAftercare = clients.filter(c => c.needsAftercare).length;
                    if (needingAftercare > 0) {
                        criticalIndicator = `<span class="critical-indicator" title="${needingAftercare} need aftercare thread">⚠️</span>`;
                    }
                }

                html += `
                    <div class="journey-segment segment-${segment.color} ${hasClients ? 'has-clients' : ''} ${segment.critical ? 'critical-stage' : ''}" 
                         data-segment="${segment.key}"
                         onclick="${hasClients ? `dashboardWidgets.showSegmentClients('${segment.key}')` : ''}">
                        <div class="segment-label">${segment.label} ${criticalIndicator}</div>
                        <div class="segment-count">${clients.length}</div>
                        ${segment.key === 'dischargePipeline' && clients.length > 0 ? 
                            `<div class="segment-detail">Next: ${clients[0].initials} in ${clients[0].daysUntilDischarge}d</div>` : 
                            ''
                        }
                        ${segment.key === 'recentlyDischarged' && clients.length > 0 ? 
                            `<div class="segment-detail">Latest: ${clients[0].initials} ${clients[0].daysSinceDischarge}d ago</div>` : 
                            ''
                        }
                    </div>
                `;
                
                if (segment.key !== 'recentlyDischarged') {
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

// Coach Schedule Widget
class CoachScheduleWidget extends DashboardWidget {
    constructor(container) {
        super('coachSchedule', container);
    }

    async render() {
        this.showLoading();

        try {
            const schedule = await this.buildSchedule();
            const hasItems = schedule.today.length > 0 || schedule.week.length > 0;

            if (!hasItems) {
                this.renderEmptyState('No scheduled work yet. Add clients or populate demo data to surface your upcoming tasks.', { showDemoAction: true });
                return;
            }

            const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });

            let html = `
                <div class="coach-schedule-widget">
                    <div class="widget-header">
                        <h3>🗓 Coach Schedule</h3>
                        <span class="schedule-date">${todayLabel}</span>
                    </div>
                    ${this.renderScheduleSection('Today', schedule.today)}
                    ${this.renderScheduleSection('Upcoming', schedule.week)}
                </div>
            `;

            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render schedule:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load schedule</div>';
        }
    }

    async buildSchedule() {
        const priorities = dashboardManager.cache?.priorities || { red: [], yellow: [], purple: [], green: [] };
        const quickWins = await dashboardManager.getQuickWins();

        const today = [];
        const week = [];

        const mapItem = (item, bucket) => ({
            client: item.client,
            label: item.message || item.action,
            action: item.action,
            bucket,
            due: item.dueDate || bucket,
            type: item.type || 'task'
        });

        const addItems = (source = [], bucket = 'Today', target = today) => {
            source.forEach(item => target.push(mapItem(item, bucket)));
        };

        addItems(priorities.red, 'Urgent');
        addItems(priorities.yellow, 'Due today');
        addItems(priorities.purple, 'Discharge prep', week);
        addItems(priorities.green, 'Upcoming', week);

        quickWins.slice(0, 3).forEach(win => {
            today.push({
                client: win.client,
                label: win.action,
                action: win.action,
                bucket: 'Quick win',
                due: `${win.estimatedTime}m`,
                type: 'quickwin'
            });
        });

        return {
            today: today.slice(0, 6),
            week: week.slice(0, 6)
        };
    }

    renderScheduleSection(title, items) {
        if (!items.length) {
            return '';
        }

        const rows = items.map(item => {
            const hasClient = Boolean(item.client?.id);
            return `
            <div class="schedule-item">
                <div class="schedule-item__main">
                    <span class="schedule-client">${item.client?.initials || '--'}</span>
                    <span class="schedule-label">${item.label}</span>
                </div>
                <div class="schedule-item__meta">
                    <span class="schedule-bucket">${item.bucket}</span>
                    <span class="schedule-due">${item.due}</span>
                    ${hasClient ? `<button class="schedule-action" onclick="dashboardWidgets.takeAction('schedule', '${item.type}', '${item.client.id}')">Open</button>` : ''}
                </div>
            </div>
        `; }).join('');

        return `
            <div class="schedule-section">
                <div class="schedule-section__title">${title}</div>
                ${rows}
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
            <div class="quick-actions">
                <div class="quick-actions__row">
                    <button class="quick-actions__btn" onclick="showAddClientModal()">
                        <span>➕</span>
                        <small>Add Client</small>
                    </button>
                    <button class="quick-actions__btn" onclick="dashboardWidgets.quickGenerateDoc()">
                        <span>📄</span>
                        <small>Generate Doc</small>
                    </button>
                    <button class="quick-actions__btn" onclick="dashboardWidgets.viewAllAlerts()">
                        <span>🔔</span>
                        <small>All Alerts</small>
                    </button>
                    <button class="quick-actions__btn" onclick="dashboardWidgets.exportDashboard()">
                        <span>📊</span>
                        <small>Export</small>
                    </button>
                    <button class="quick-actions__btn" onclick="initializeDashboard && initializeDashboard(true)">
                        <span>🔄</span>
                        <small>Refresh</small>
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
        
        const widgetContainers = {
            flightPlan: document.getElementById('flightPlanWidget'),
            journeyRadar: document.getElementById('journeyRadarWidget'),
            coachSchedule: document.getElementById('coachScheduleWidget'),
            quickActions: document.getElementById('quickActionsWidget')
        };
        
        if (widgetContainers.flightPlan) {
            this.widgets.set('flightPlan', new FlightPlanWidget(widgetContainers.flightPlan));
        }
        
        if (widgetContainers.journeyRadar) {
            this.widgets.set('journeyRadar', new JourneyRadarWidget(widgetContainers.journeyRadar));
        }
        
        if (widgetContainers.coachSchedule) {
            this.widgets.set('coachSchedule', new CoachScheduleWidget(widgetContainers.coachSchedule));
        }
        
        if (widgetContainers.quickActions) {
            this.widgets.set('quickActions', new QuickActionsWidget(widgetContainers.quickActions));
        }
        
        for (const [id, widget] of this.widgets) {
            dashboardManager.registerWidget(id, widget);
        }
        
        console.log('✅ Dashboard widgets initialized');
    }

    async renderAll() {
        console.log('Rendering all widgets...');
        await Promise.all(Array.from(this.widgets.values()).map(widget => widget.render()));
    }

    toggleZone(zone) {
        const widget = this.widgets.get('flightPlan');
        if (widget) widget.toggleZone(zone);
    }
    
    async takeAction(actionId, type, clientId) {
        if (type === 'aftercare_urgent' || type === 'aftercare_critical') {
            const client = await clientManager.getClient(clientId);
            if (client) {
                viewClientDetails(client);
                setTimeout(() => {
                    const aftercareTab = document.querySelector('[onclick*="showClientTab(\'aftercare\')"]');
                    if (aftercareTab) aftercareTab.click();
                }, 100);
            }
        } else if (type === 'discharge_prep') {
            const client = await clientManager.getClient(clientId);
            if (client) viewClientDetails(client);
        } else if (type.includes('milestone')) {
            const client = await clientManager.getClient(clientId);
            if (client) {
                viewClientDetails(client);
                setTimeout(() => {
                    const milestonesTab = document.querySelector('[onclick*="showClientTab(\'milestones\')"]');
                    if (milestonesTab) milestonesTab.click();
                }, 100);
            }
        } else if (clientId) {
            const client = await clientManager.getClient(clientId);
            if (client) {
                viewClientDetails(client);
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

    showSegmentClients(segment) {
        const clients = dashboardManager.cache.journeyData[segment];
        if (!clients || clients.length === 0) return;
        
        let content = '<div class="segment-clients-list">';
        for (const client of clients) {
            let daysInfo = '';
            let statusIndicator = '';
            
            if (segment === 'dischargePipeline') {
                daysInfo = ` - ${client.daysUntilDischarge} days until discharge`;
            } else if (segment === 'recentlyDischarged') {
                daysInfo = ` - Discharged ${client.daysSinceDischarge} days ago`;
            } else if (segment === 'day14to16') {
                daysInfo = ` - Day ${client.daysInCare}`;
                if (client.needsAftercare) {
                    statusIndicator = '<span class="status-indicator urgent">Aftercare needed</span>';
                }
            } else {
                daysInfo = ` - Day ${dashboardManager.calculateDaysInCare(client.admissionDate)}`;
            }
            
            content += `
                <div class="segment-client-item" onclick="viewClientDetails(clientManager.getClient('${client.id}'))">
                    <span class="client-initials">${client.initials}</span>
                    <span class="client-house">${client.houseId}</span>
                    <span class="client-info">${daysInfo}</span>
                    ${statusIndicator}
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
            week1: 'Week 1 Clients',
            day14to16: 'Day 14-16 Aftercare Window',
            day30: 'Day 30 Clients',
            day45plus: '45+ Days Clients',
            dischargePipeline: 'Discharge Pipeline',
            recentlyDischarged: 'Recently Discharged'
        };
        return titles[segment] || 'Clients';
    }

    quickGenerateDoc() {
        switchTab('programs');
    }

    viewAllAlerts() {
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
                metrics: dashboardManager.cache.metrics
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
