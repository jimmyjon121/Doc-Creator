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
            ? `<button type="button" class="widget-empty__action" onclick="window.populateDemoClients && window.populateDemoClients()">Populate demo data</button>`
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
            // Use filtered priorities if filters are active
            const data = window.dashboardManager?.hasActiveFilters?.() 
                ? window.dashboardManager.getFilteredPriorities()
                : window.dashboardManager?.cache?.priorities;
                
            if (!data || this.isZonesEmpty(data)) {
                const hasFilters = window.dashboardManager?.hasActiveFilters?.();
                const message = hasFilters 
                    ? 'No tasks match the current filter. Click a Journey stage again to clear the filter.'
                    : 'No priority alerts yet. Add clients or populate demo data to see this queue.';
                this.renderEmptyState(message, { showDemoAction: !hasFilters });
                return;
            }
            
            const timeContext = window.dashboardManager?.getTimeAwareGreeting();
            const hasFilters = window.dashboardManager?.hasActiveFilters?.();
            
            // Filter indicator
            const filterBadge = hasFilters 
                ? `<span class="filter-badge" onclick="dashboardManager.clearFilters()">Filtered ✕</span>`
                : '';
            
            let html = `
                <div class="flight-plan-widget">
                    <div class="widget-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                        <h3>📋 Daily Flight Plan</h3>
                            <span class="metric-info" data-metric="dash_flight_plan">i</span>
                            ${filterBadge}
                        </div>
                        <div class="widget-header-actions">
                            <span class="time-context">${timeContext.focus}</span>
                        </div>
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
            if (window.attachMetricTooltips) {
                window.attachMetricTooltips(this.container);
            }
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
        // Look up proper house name from housesManager
        const houseName = this.getHouseDisplayName(item.client.houseId);
        const clientInfo = `${item.client.initials} (${houseName})`;
        const actionId = `action-${item.type}-${item.client.id}-${Date.now()}`;
        
        // Normalize action text - always show "Complete Task" for task-related items
        const actionText = item.action === 'Escalate immediately' ? 'Complete Task' : (item.action || 'Open');
        
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
                            ${actionText}
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

    /**
     * Get display name for a house ID
     * @param {string} houseId - The house ID (e.g., 'house_nest')
     * @returns {string} The display name (e.g., 'NEST')
     */
    getHouseDisplayName(houseId) {
        if (!houseId) return 'Unassigned';
        
        // Try to get from housesManager
        if (window.housesManager && typeof window.housesManager.getHouseById === 'function') {
            const house = window.housesManager.getHouseById(houseId);
            if (house && house.name) {
                return house.name;
            }
        }
        
        // Fallback: extract name from ID (e.g., 'house_nest' -> 'Nest')
        const match = houseId.match(/^house_(.+)$/);
        if (match) {
            return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
        
        return houseId;
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
            const data = window.dashboardManager?.cache?.journeyData || {};
            const hasClients = Object.values(data).some(list => Array.isArray(list) && list.length > 0);
            if (!hasClients) {
                this.renderEmptyState('No journey data yet. Add clients or populate demo data to visualize progress.', { showDemoAction: true });
                return;
            }
            
            const activeFilter = window.dashboardManager?.filters?.journeyStage;
            
            const segments = [
                { key: 'week1', label: 'Week 1', color: 'green' },
                { key: 'day14to16', label: 'Day 14-16', color: 'yellow', critical: true },
                { key: 'day30', label: 'Day 30', color: 'blue' },
                { key: 'day45plus', label: '45+ Days', color: 'orange' },
                { key: 'dischargePipeline', label: 'Discharge Pipeline', color: 'purple' },
                { key: 'recentlyDischarged', label: 'Recently Discharged', color: 'gray' }
            ];
            
            // Show filter indicator if active
            const filterIndicator = activeFilter 
                ? `<button class="filter-clear-btn" onclick="dashboardManager.clearFilters()" title="Clear filter">
                       <span class="filter-active-label">Filtered: ${this.getSegmentLabel(activeFilter)}</span>
                       <span class="filter-clear-icon">✕</span>
                   </button>` 
                : '';
            
            let html = `
                <div class="journey-radar-widget">
                    <div class="widget-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                        <h3>🧭 Client Journey Radar</h3>
                        <span class="metric-info" data-metric="dash_journey_radar">i</span>
                        </div>
                        ${filterIndicator}
                    </div>
                    <div class="journey-timeline">
            `;
            
            for (const segment of segments) {
                const clients = data[segment.key] || [];
                const hasClients = clients.length > 0;
                const isActive = activeFilter === segment.key;
                
                // Check for critical aftercare needs
                let criticalIndicator = '';
                if (segment.key === 'day14to16' && clients.length > 0) {
                    const needingAftercare = clients.filter(c => c.needsAftercare).length;
                    if (needingAftercare > 0) {
                        criticalIndicator = `<span class="critical-indicator" title="${needingAftercare} need aftercare thread">⚠️</span>`;
                    }
                }

                // Click filters Flight Plan; Shift+click opens modal
                const clickHandler = hasClients 
                    ? `onclick="dashboardWidgets.handleSegmentClick(event, '${segment.key}')"`
                    : '';

                html += `
                    <div class="journey-segment segment-${segment.color} ${hasClients ? 'has-clients' : ''} ${segment.critical ? 'critical-stage' : ''} ${isActive ? 'segment-active' : ''}" 
                         data-segment="${segment.key}"
                         ${clickHandler}>
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
            if (window.attachMetricTooltips) {
                window.attachMetricTooltips(this.container);
            }
            this.hideLoading();
            
            // Add hover tooltips
            this.addSegmentTooltips(data, segments);
        } catch (error) {
            console.error('Failed to render journey radar:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load journey data</div>';
        }
    }

    getSegmentLabel(key) {
        const labels = {
            week1: 'Week 1',
            day14to16: 'Day 14-16',
            day30: 'Day 30',
            day45plus: '45+ Days',
            dischargePipeline: 'Discharge Pipeline',
            recentlyDischarged: 'Recently Discharged'
        };
        return labels[key] || key;
    }

    addSegmentTooltips(data, segments) {
        segments.forEach(segment => {
            const element = this.container.querySelector(`[data-segment="${segment.key}"]`);
            if (element && data[segment.key]?.length > 0) {
                const clients = data[segment.key].slice(0, 5).map(c => c.initials).join(', ');
                const more = data[segment.key].length > 5 ? ` +${data[segment.key].length - 5} more` : '';
                element.title = `Click to filter • Shift+click for details\n${clients}${more}`;
            }
        });
    }
}

// Coach Schedule Widget - REMOVED (redundant with Flight Plan)
// The Coach Schedule was showing the same data as Flight Plan, just reformatted.
// See plan: coach-dashboar.plan.md Section 1 for analysis.



// Quick Actions Widget (with inline KPIs)
class QuickActionsWidget extends DashboardWidget {
    constructor(container) {
        super('quickActions', container);
    }

    async render() {
        const suggestions = await dashboardManager.generateSmartSuggestions();
        const greeting = dashboardManager.getTimeAwareGreeting();
        
        // Get KPI counts from priorities
        const priorities = dashboardManager.cache?.priorities || { red: [], yellow: [], purple: [], green: [] };
        const totalRed = priorities.red?.length || 0;
        const totalYellow = priorities.yellow?.length || 0;
        const activeClients = dashboardManager.cache?.metrics?.activeClients || 0;
        
        let html = `
            <div class="quick-actions-widget">
                <div class="dashboard-greeting-row">
                    <div class="greeting-section">
                        <h2 class="greeting-text">${greeting.greeting}</h2>
                        <p class="greeting-subtext">${greeting.focus}</p>
                    </div>
                    <div class="dashboard-kpi-badges">
                        <span class="kpi-badge kpi-urgent" title="Urgent tasks requiring immediate action">${totalRed} Urgent</span>
                        <span class="kpi-badge kpi-today" title="Tasks due today">${totalYellow} Due Today</span>
                        <span class="kpi-badge kpi-clients" title="Active clients in your caseload">${activeClients} Clients</span>
                    </div>
                </div>
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
                        <button class="quick-actions__btn" onclick="initializeDashboard && initializeDashboard(true)">
                            <span>🔄</span>
                            <small>Refresh</small>
                        </button>
                        <button class="quick-actions__btn" onclick="window.morningReview && window.morningReview.renderMorningReview()">
                            <span>☀️</span>
                            <small>Morning Review</small>
                        </button>
                        <button class="quick-actions__btn" onclick="window.dashboardWidgets && window.dashboardWidgets.openDischargedClients ? window.dashboardWidgets.openDischargedClients() : (window.showDischargedClientsView && window.showDischargedClientsView())">
                            <span>🚪</span>
                            <small>Discharged Clients</small>
                        </button>
                        ${window.ccConfig?.demoMode ? `
                        <button class="quick-actions__btn" data-demo-only="true" onclick="window.populateDemoClients && window.populateDemoClients(40)">
                            <span>🎭</span>
                            <small>Demo Clients</small>
                        </button>` : ''}
                    </div>
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

// Changes Today Widget - Shows recent admissions, approaching milestones, discharges
class ChangesTodayWidget extends DashboardWidget {
    constructor(container) {
        super('changesToday', container);
    }

    async render() {
        this.showLoading();

        try {
            const changes = dashboardManager.cache?.recentChanges || {
                newAdmissions: [],
                approachingDay14: [],
                approachingDischarge: [],
                escalations: []
            };
            
            const totalChanges = changes.newAdmissions.length + 
                                 changes.approachingDay14.length + 
                                 changes.approachingDischarge.length;

            if (totalChanges === 0) {
                this.container.innerHTML = `
                    <div class="changes-today-widget">
                        <div class="widget-header">
                            <h3>📅 Changes Today</h3>
                        </div>
                        <div class="widget-empty-compact">
                            <p>No notable changes today</p>
                        </div>
                    </div>
                `;
                this.hideLoading();
                return;
            }

            let html = `
                <div class="changes-today-widget">
                    <div class="widget-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>📅 Changes Today</h3>
                            <span class="metric-info" data-metric="dash_changes_today">i</span>
                    </div>
                        <span class="changes-count">${totalChanges}</span>
                    </div>
                    <div class="changes-list">
            `;
            
            // New Admissions
            if (changes.newAdmissions.length > 0) {
                html += `<div class="changes-section">`;
                for (const item of changes.newAdmissions) {
                    html += `
                        <div class="change-item change-admission" onclick="viewClientDetails(clientManager.getClient('${item.client.id}'))">
                            <span class="change-icon">🆕</span>
                            <span class="change-text">${item.message}</span>
                        </div>
                    `;
                }
                html += `</div>`;
            }
            
            // Approaching Day 14
            if (changes.approachingDay14.length > 0) {
                html += `<div class="changes-section">`;
                for (const item of changes.approachingDay14) {
                    html += `
                        <div class="change-item change-milestone" onclick="viewClientDetails(clientManager.getClient('${item.client.id}'))">
                            <span class="change-icon">⚠️</span>
                            <span class="change-text">${item.message}</span>
                        </div>
                    `;
                }
                html += `</div>`;
            }
            
            // Approaching Discharge
            if (changes.approachingDischarge.length > 0) {
                html += `<div class="changes-section">`;
                for (const item of changes.approachingDischarge) {
                    html += `
                        <div class="change-item change-discharge" onclick="viewClientDetails(clientManager.getClient('${item.client.id}'))">
                            <span class="change-icon">🚪</span>
                            <span class="change-text">${item.message}</span>
                        </div>
                    `;
                }
                html += `</div>`;
            }
            
            html += `
                    </div>
                </div>
            `;

            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render changes today:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load changes</div>';
        }
    }
}

// Gaps & Missing Data Widget - Shows clients with missing critical data
class GapsWidget extends DashboardWidget {
    constructor(container) {
        super('gaps', container);
    }

    async render() {
        this.showLoading();
        
        try {
            const gaps = dashboardManager.cache?.gaps || {
                missingDcDate: [],
                noAftercareStarted: [],
                missingCareTeam: []
            };
            
            const totalGaps = gaps.missingDcDate.length + 
                              gaps.noAftercareStarted.length + 
                              gaps.missingCareTeam.length;
            
            if (totalGaps === 0) {
                this.container.innerHTML = `
                    <div class="gaps-widget">
                        <div class="widget-header">
                            <h3>✅ Data Gaps</h3>
                        </div>
                        <div class="widget-empty-compact">
                            <p>No data gaps detected!</p>
                        </div>
                    </div>
                `;
                this.hideLoading();
                return;
            }
            
            const gapCategories = [
                { key: 'missingDcDate', label: 'Missing DC Date', icon: '📅', clients: gaps.missingDcDate },
                { key: 'noAftercareStarted', label: 'No Aftercare Started', icon: '🏠', clients: gaps.noAftercareStarted },
                { key: 'missingCareTeam', label: 'No Care Team', icon: '👥', clients: gaps.missingCareTeam }
            ];
            
            let html = `
                <div class="gaps-widget">
                    <div class="widget-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>⚠️ Data Gaps</h3>
                            <span class="metric-info" data-metric="dash_gaps">i</span>
                        </div>
                        <span class="gaps-total">${totalGaps}</span>
                    </div>
                    <div class="gaps-list">
            `;
            
            for (const cat of gapCategories) {
                if (cat.clients.length === 0) continue;
                html += `
                    <div class="gap-category" onclick="dashboardWidgets.showGapClients('${cat.key}')">
                        <span class="gap-icon">${cat.icon}</span>
                        <span class="gap-label">${cat.label}</span>
                        <span class="gap-count">${cat.clients.length}</span>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render gaps widget:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load gaps</div>';
        }
    }
}

// Intake/Discharge Pipeline Widget - Shows upcoming intakes and discharges
class PipelineWidget extends DashboardWidget {
    constructor(container) {
        super('pipeline', container);
        }

    async render() {
        this.showLoading();
        
        try {
            const pipeline = dashboardManager.cache?.pipeline || { intakes: [], discharges: [] };
            const hasData = pipeline.intakes.length > 0 || pipeline.discharges.length > 0;
            
            if (!hasData) {
                this.container.innerHTML = `
                    <div class="pipeline-widget">
                        <div class="widget-header">
                            <h3>🔄 Pipeline</h3>
                </div>
                        <div class="widget-empty-compact">
                            <p>No upcoming intakes or discharges</p>
                </div>
            </div>
                `;
                this.hideLoading();
                return;
            }
            
            let html = `
                <div class="pipeline-widget">
                    <div class="widget-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>🔄 Pipeline</h3>
                            <span class="metric-info" data-metric="dash_pipeline">i</span>
                        </div>
                    </div>
            `;
            
            // Intakes section
            if (pipeline.intakes.length > 0) {
                html += `
                    <div class="pipeline-section">
                        <div class="pipeline-section-title">📥 Intakes (${pipeline.intakes.length})</div>
                        <div class="pipeline-items">
                `;
                for (const client of pipeline.intakes.slice(0, 3)) {
                    const status = client.isPreAdmission ? 'Pre-admit' : `Day ${client.daysInCare}`;
                    html += `
                        <div class="pipeline-item pipeline-intake" onclick="viewClientDetails(clientManager.getClient('${client.id}'))">
                            <span class="pipeline-initials">${client.initials}</span>
                            <span class="pipeline-status">${status}</span>
            </div>
        `;
    }
                html += `</div></div>`;
            }
            
            // Discharges section
            if (pipeline.discharges.length > 0) {
                html += `
                    <div class="pipeline-section">
                        <div class="pipeline-section-title">📤 Discharges (${pipeline.discharges.length})</div>
                        <div class="pipeline-items">
                `;
                for (const client of pipeline.discharges.slice(0, 3)) {
                    const urgency = client.daysUntilDischarge <= 2 ? 'urgent' : '';
                    html += `
                        <div class="pipeline-item pipeline-discharge ${urgency}" onclick="viewClientDetails(clientManager.getClient('${client.id}'))">
                            <span class="pipeline-initials">${client.initials}</span>
                            <span class="pipeline-status">${client.daysUntilDischarge}d</span>
                        </div>
                    `;
                }
                html += `</div></div>`;
            }
            
            html += `</div>`;
            
            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render pipeline widget:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load pipeline</div>';
        }
    }
}

// Program Spotlight Widget - Shows a random program for coach learning
class ProgramSpotlightWidget extends DashboardWidget {
    constructor(container) {
        super('programSpotlight', container);
        this.currentProgram = null;
    }

    async render() {
        this.showLoading();
        
        try {
            // Check if programs API is ready
            if (!window.ccPrograms?.isReady || !window.ccPrograms.core?.length) {
                this.container.innerHTML = `
                    <div class="spotlight-widget">
                        <div class="widget-header">
                            <h3>📚 Program Spotlight</h3>
                        </div>
                        <div class="widget-empty-compact">
                            <p>Programs database loading...</p>
                        </div>
                    </div>
                `;
                this.hideLoading();
                return;
            }
            
            // Pick random program if none selected
            if (!this.currentProgram) {
                this.pickRandomProgram();
            }
            
            const p = this.currentProgram;
            const locBadges = (p.levelOfCare || []).slice(0, 2).map(loc => 
                `<span class="loc-badge">${loc}</span>`
            ).join('');
            
            const summary = p.summary ? 
                (p.summary.length > 100 ? p.summary.substring(0, 100) + '...' : p.summary) : 
                'No description available';
            
            this.container.innerHTML = `
                <div class="spotlight-widget">
                    <div class="widget-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>📚 Program Spotlight</h3>
                            <span class="metric-info" data-metric="dash_program_spotlight">i</span>
                        </div>
                        <button class="spotlight-refresh" onclick="dashboardWidgets.refreshSpotlight()" title="Show different program">🔄</button>
                    </div>
                    <div class="spotlight-program">
                        <div class="spotlight-name">${p.name}</div>
                        <div class="spotlight-location">${p.city}, ${p.state}</div>
                        <div class="spotlight-badges">${locBadges}</div>
                        <div class="spotlight-summary">${summary}</div>
                        <button class="spotlight-learn-btn" onclick="dashboardWidgets.learnMoreProgram('${p.id}')">
                            Learn More →
                    </button>
                </div>
            </div>
        `;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render program spotlight:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load spotlight</div>';
    }
    }

    pickRandomProgram() {
        const programs = window.ccPrograms?.core || [];
        if (programs.length > 0) {
            this.currentProgram = programs[Math.floor(Math.random() * programs.length)];
        }
    }
}

// House Health Widget - Shows compliance status for each house with click-to-filter
class HouseHealthWidget extends DashboardWidget {
    constructor(container) {
        super('houseHealth', container);
    }

    async render() {
        this.showLoading();
        
        try {
            const houseHealth = dashboardManager.cache?.houseHealth || {};
            const houses = Object.values(houseHealth);
            
            if (houses.length === 0) {
                this.container.innerHTML = `
                    <div class="house-health-widget">
                        <div class="widget-header">
                            <h3>🏠 House Compliance</h3>
                        </div>
                        <div class="widget-empty-compact">
                            <p>No house data available</p>
                </div>
            </div>
        `;
                this.hideLoading();
                return;
            }
            
            const activeHouseFilter = dashboardManager.filters?.house;
            
            let html = `
                <div class="house-health-widget">
                    <div class="widget-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <h3>🏠 House Compliance</h3>
                            <span class="metric-info" data-metric="dash_house_health">i</span>
                        </div>
                        ${activeHouseFilter ? `<button class="filter-clear-btn" onclick="dashboardManager.clearFilters()">Clear Filter ✕</button>` : ''}
                    </div>
                    <div class="house-cards-grid">
            `;
            
            for (const h of houses) {
                const isActive = activeHouseFilter === h.house.id;
                const scoreClass = h.score >= 90 ? 'excellent' : h.score >= 70 ? 'good' : h.score >= 40 ? 'warning' : 'critical';
                
                html += `
                    <div class="house-card ${scoreClass} ${isActive ? 'house-active' : ''}" 
                         onclick="dashboardManager.setFilter('house', '${h.house.id}')"
                         title="Click to filter by ${h.house.name}">
                        <div class="house-weather">${h.weather}</div>
                        <div class="house-name">${h.house.name}</div>
                        <div class="house-score">${h.score}%</div>
                        <div class="house-clients">${h.clientCount} clients</div>
                    </div>
                `;
            }
            
            html += `
                    </div>
                </div>
            `;
            
            this.container.innerHTML = html;
            this.hideLoading();
        } catch (error) {
            console.error('Failed to render house health widget:', error);
            this.container.innerHTML = '<div class="widget-error">Failed to load house data</div>';
        }
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
            quickActions: document.getElementById('quickActionsWidget'),
            changesToday: document.getElementById('changesTodayWidget'),
            pipeline: document.getElementById('pipelineWidget'),
            gaps: document.getElementById('gapsWidget'),
            programSpotlight: document.getElementById('programSpotlightWidget'),
            houseHealth: document.getElementById('houseHealthWidget')
        };
        
        if (widgetContainers.flightPlan) {
            this.widgets.set('flightPlan', new FlightPlanWidget(widgetContainers.flightPlan));
        }
        
        if (widgetContainers.journeyRadar) {
            this.widgets.set('journeyRadar', new JourneyRadarWidget(widgetContainers.journeyRadar));
        }
        
        if (widgetContainers.quickActions) {
            this.widgets.set('quickActions', new QuickActionsWidget(widgetContainers.quickActions));
        }
        
        if (widgetContainers.changesToday) {
            this.widgets.set('changesToday', new ChangesTodayWidget(widgetContainers.changesToday));
        }
        
        if (widgetContainers.pipeline) {
            // Verify pipeline widget is in the correct column
            const parentColumn = widgetContainers.pipeline.closest('.dashboard-column');
            if (parentColumn && !parentColumn.classList.contains('dashboard-column--secondary')) {
                console.error('⚠️ Pipeline widget found in wrong column! Moving to secondary column...');
                const secondaryColumn = document.querySelector('.dashboard-column--secondary');
                if (secondaryColumn) {
                    // Find the correct position (after changesTodayWidget, before gapsWidget)
                    const changesToday = document.getElementById('changesTodayWidget');
                    const gapsWidget = document.getElementById('gapsWidget');
                    if (changesToday && changesToday.nextSibling) {
                        secondaryColumn.insertBefore(widgetContainers.pipeline, changesToday.nextSibling);
                    } else if (gapsWidget) {
                        secondaryColumn.insertBefore(widgetContainers.pipeline, gapsWidget);
                    } else {
                        secondaryColumn.appendChild(widgetContainers.pipeline);
                    }
                    console.log('✅ Pipeline widget moved to secondary column');
                }
            }
            this.widgets.set('pipeline', new PipelineWidget(widgetContainers.pipeline));
        }
        
        if (widgetContainers.gaps) {
            this.widgets.set('gaps', new GapsWidget(widgetContainers.gaps));
        }
        
        if (widgetContainers.programSpotlight) {
            this.widgets.set('programSpotlight', new ProgramSpotlightWidget(widgetContainers.programSpotlight));
        }
        
        if (widgetContainers.houseHealth) {
            this.widgets.set('houseHealth', new HouseHealthWidget(widgetContainers.houseHealth));
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

    /**
     * Handle segment click - normal click filters, shift+click shows modal
     */
    handleSegmentClick(event, segment) {
        if (event.shiftKey) {
            // Shift+click: show client list modal
            this.showSegmentClients(segment);
        } else {
            // Normal click: filter the Flight Plan
            dashboardManager.setFilter('journeyStage', segment);
        }
    }

    showSegmentClients(segment) {
        const clients = dashboardManager.cache.journeyData[segment];
        if (!clients || clients.length === 0) return;
        
        let content = '<div class="segment-drawer">';
        for (const client of clients) {
            const houseName = this.getHouseDisplayName(client.houseId);
            const days = client.daysInCare || dashboardManager.calculateDaysInCare(client.admissionDate);
            
            // Build status badges
            const badges = [];
            if (client.aftercareThreadSent) {
                badges.push('<span class="drawer-badge badge-green">Aftercare Started</span>');
            }
            if (client.dischargeDate) {
                badges.push('<span class="drawer-badge badge-purple">DC Date Set</span>');
            }
            if (!client.aftercareThreadSent && days > 14) {
                badges.push('<span class="drawer-badge badge-red">No Aftercare</span>');
            }
            
            // Special info based on segment
            let extraInfo = '';
            if (segment === 'dischargePipeline') {
                extraInfo = `<span class="drawer-extra">${client.daysUntilDischarge}d until DC</span>`;
            } else if (segment === 'recentlyDischarged') {
                extraInfo = `<span class="drawer-extra">${client.daysSinceDischarge}d ago</span>`;
            }
            
            content += `
                <div class="drawer-client-row">
                    <div class="drawer-client-info">
                        <span class="drawer-initials">${client.initials}</span>
                        <span class="drawer-house">${houseName}</span>
                        <span class="drawer-days">Day ${days}</span>
                        ${extraInfo}
                    </div>
                    <div class="drawer-badges">${badges.join('')}</div>
                    <div class="drawer-actions">
                        <button class="drawer-btn drawer-btn-primary" onclick="viewClientDetails(clientManager.getClient('${client.id}')); closeModal();">
                            Open
                        </button>
                        <button class="drawer-btn drawer-btn-secondary" onclick="dashboardWidgets.addTaskForClient('${client.id}'); closeModal();">
                            Add Task
                        </button>
                    </div>
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

    /**
     * Get display name for a house ID (helper for segment drawer)
     */
    getHouseDisplayName(houseId) {
        if (!houseId) return 'Unassigned';
        
        if (window.housesManager && typeof window.housesManager.getHouseById === 'function') {
            const house = window.housesManager.getHouseById(houseId);
            if (house && house.name) {
                return house.name;
            }
        }
        
        const match = houseId.match(/^house_(.+)$/);
        if (match) {
            return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
        
        return houseId;
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

    // =========================================================================
    // NEW WIDGET HELPER METHODS
    // =========================================================================

    /**
     * Show clients with a specific gap type
     */
    showGapClients(gapType) {
        const gaps = dashboardManager.cache?.gaps || {};
        const clients = gaps[gapType] || [];
        
        if (clients.length === 0) return;
        
        const titles = {
            missingDcDate: 'Clients Missing Discharge Date',
            noAftercareStarted: 'Clients Without Aftercare Started',
            missingCareTeam: 'Clients Without Care Team'
        };
        
        let content = '<div class="gap-clients-list">';
        for (const client of clients) {
            content += `
                <div class="gap-client-item" onclick="viewClientDetails(clientManager.getClient('${client.id}'))">
                    <span class="client-initials">${client.initials}</span>
                    <span class="client-days">Day ${client.daysInCare}</span>
                    <span class="client-gap">${client.gap}</span>
                </div>
            `;
        }
        content += '</div>';
        
        showModal({
            title: titles[gapType] || 'Gap Clients',
            content: content,
            buttons: [{ text: 'Close', action: () => closeModal() }]
        });
    }

    /**
     * Refresh program spotlight to show a different program
     */
    refreshSpotlight() {
        const widget = this.widgets.get('programSpotlight');
        if (widget) {
            widget.currentProgram = null;
            widget.pickRandomProgram();
            widget.render();
        }
    }

    /**
     * Navigate to Programs tab and open a specific program's detail modal
     */
    learnMoreProgram(programId) {
        // Switch to programs tab first
        switchTab('programs');
        
        // Wait for programs tab to load, then open the program profile
        setTimeout(() => {
            if (window.ccAppController?.openProfile) {
                window.ccAppController.openProfile(programId);
            } else {
                console.warn('ccAppController not available yet');
                // Retry after a delay
                setTimeout(() => {
                    if (window.ccAppController?.openProfile) {
                        window.ccAppController.openProfile(programId);
                    }
                }, 500);
            }
        }, 300);
    }

    /**
     * Add a task for a specific client (from segment drawer)
     */
    addTaskForClient(clientId) {
        // Open client and navigate to tasks/milestones
        clientManager.getClient(clientId).then(client => {
            if (client) {
                viewClientDetails(client);
                setTimeout(() => {
                    const milestonesTab = document.querySelector('[onclick*="showClientTab(\'milestones\')"]');
                    if (milestonesTab) milestonesTab.click();
                }, 100);
            }
        });
    }
}

// Create global instance
const dashboardWidgets = new DashboardWidgets();
