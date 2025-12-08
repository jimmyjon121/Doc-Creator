/**
 * @fileoverview Tracker Compliance Dashboard Widget
 * @module widgets/ComplianceWidget
 * @status @canonical
 * 
 * PURPOSE:
 *   House-level view of tracker completion across all clients. Displays
 *   overall compliance percentages, critical item status, and at-risk
 *   client identification for the dashboard.
 * 
 * DEPENDENCIES:
 *   - window.trackerEngine (TrackerEngine) - Legacy compliance calculations
 *   - window.dashboardWidgets (DashboardWidgets) - Widget registration
 *   - window.dashboardManager (DashboardManager) - Client data access
 *   - window.clientManager (ClientManager) - Fallback client data
 *   - window.housesManager (HousesManager) - House display names
 * 
 * EXPORTS TO WINDOW:
 *   - window.ComplianceWidget - Class constructor (via dashboardWidgets registry)
 * 
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 3163-3478 in original)
 *   Extraction Date: December 6, 2025
 * 
 * NOTE: This widget depends on the legacy TrackerEngine for compliance
 * calculations. Future refactoring should migrate to TaskService-based metrics.
 */

(function() {
    'use strict';
    
    console.log('[ComplianceWidget] Initializing compliance widget...');
    
    // Compliance Widget Class
    class ComplianceWidget {
        constructor(container) {
            this.container = container;
            this.initialized = false;
            this.data = null;
        }
        
        async render() {
            if (!window.trackerEngine) {
                this.container.innerHTML = '<div class="widget-error">Tracker engine not loaded</div>';
                return;
            }
            
            try {
                // Get all clients grouped by house
                const clientsByHouse = await this.getClientsByHouse();
                
                // Calculate compliance for each house
                const houseStats = [];
                for (const [houseId, clients] of Object.entries(clientsByHouse)) {
                    if (clients.length > 0) {
                        const stats = window.trackerEngine.getHouseCompliance(clients);
                        houseStats.push(stats);
                    }
                }
                
                // Calculate overall compliance
                const overallStats = this.calculateOverallStats(houseStats);
                
                // Render the widget
                this.container.innerHTML = `
                    <div class="compliance-widget">
                        <div class="widget-header">
                            <h3>📊 House Tracker Compliance</h3>
                            <div class="widget-header-actions">
                                <span class="metric-info" data-metric="dash_tracker_overall">i</span>
                                <button class="refresh-btn" onclick="dashboardWidgets.widgets.get('compliance')?.render()">
                                    <span class="refresh-icon">↻</span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="compliance-overview">
                            <div class="overall-score">
                                <div class="score-circle" style="--percentage: ${overallStats.overall}">
                                    <svg viewBox="0 0 36 36" class="circular-chart">
                                        <path class="circle-bg"
                                            d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                        <path class="circle"
                                            stroke-dasharray="${overallStats.overall}, 100"
                                            d="M18 2.0845
                                            a 15.9155 15.9155 0 0 1 0 31.831
                                            a 15.9155 15.9155 0 0 1 0 -31.831"
                                        />
                                    </svg>
                                    <div class="percentage">
                                        <span class="value">${overallStats.overall}%</span>
                                        <span class="label">Overall</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="compliance-metrics">
                                <div class="metric">
                                    <span class="metric-value">${overallStats.critical}%</span>
                                    <span class="metric-label">
                                        Critical Items
                                        <span class="metric-info" data-metric="dash_tracker_critical">i</span>
                                    </span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">${overallStats.atRisk}</span>
                                    <span class="metric-label">
                                        At Risk Clients
                                        <span class="metric-info" data-metric="dash_tracker_at_risk">i</span>
                                    </span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">${overallStats.strong}</span>
                                    <span class="metric-label">
                                        Strong Performers
                                        <span class="metric-info" data-metric="dash_tracker_strong">i</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="house-compliance-list">
                            ${houseStats.map(stats => this.renderHouseCard(stats)).join('')}
                        </div>
                        
                        ${overallStats.atRiskDetails.length > 0 ? `
                            <div class="at-risk-section">
                                <h4>⚠️ Immediate Attention Required</h4>
                                <div class="at-risk-list">
                                    ${overallStats.atRiskDetails.map(client => `
                                        <div class="at-risk-item">
                                            <span class="client-info">${client.message}</span>
                                            <button class="action-btn" onclick="openBulkUpdate('${client.client.id}')">
                                                Update
                                            </button>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                `;
                
                if (window.attachMetricTooltips) {
                    window.attachMetricTooltips(this.container);
                }
                
            } catch (error) {
                console.error('[ComplianceWidget] Render error:', error);
                this.container.innerHTML = '<div class="widget-error">Failed to load compliance data</div>';
            }
        }
        
        renderHouseCard(stats) {
            const riskClass = stats.overallCompliance >= 80 ? 'good' : 
                             stats.overallCompliance >= 60 ? 'warning' : 'danger';
            
            // Get proper house display name
            const houseName = this.getHouseDisplayName(stats.houseId);
            
            return `
                <div class="house-card ${riskClass}">
                    <div class="house-header">
                        <h4>${houseName}</h4>
                        <span class="house-score">${stats.overallCompliance}%</span>
                    </div>
                    <div class="house-details">
                        <div class="detail-row">
                            <span>Clients:</span>
                            <span>${stats.totalClients}</span>
                        </div>
                        <div class="detail-row">
                            <span>Critical:</span>
                            <span>${stats.criticalCompliance}%</span>
                        </div>
                        <div class="detail-row">
                            <span>At Risk:</span>
                            <span class="${stats.atRiskClients.length > 0 ? 'text-danger' : ''}">${stats.atRiskClients.length}</span>
                        </div>
                    </div>
                    <div class="category-breakdown">
                        ${Object.entries(stats.byCategory).map(([cat, data]) => `
                            <div class="category-bar">
                                <div class="cat-label">${this.getCategoryLabel(cat)}</div>
                                <div class="cat-progress">
                                    <div class="cat-fill" style="width: ${data.percentage}%"></div>
                                </div>
                                <div class="cat-value">${data.percentage}%</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        getCategoryLabel(category) {
            const labels = {
                admission: 'Admission',
                clinical: 'Clinical',
                aftercare: 'Aftercare',
                documentation: 'Docs'
            };
            return labels[category] || category;
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
        
        async getClientsByHouse() {
            let clients = [];
            
            // Prefer the same data pipeline the main dashboard uses
            if (window.dashboardManager?.getRelevantClients) {
                try {
                    clients = await window.dashboardManager.getRelevantClients();
                } catch (err) {
                    console.warn('[ComplianceWidget] Falling back to clientManager.getAllClients()', err);
                }
            }
            
            // Fallback if dashboardManager path fails
            if ((!clients || clients.length === 0) && window.clientManager?.getAllClients) {
                clients = await window.clientManager.getAllClients();
            }
            
            if (!Array.isArray(clients) || clients.length === 0) {
                return {};
            }
            
            const activeClients = clients.filter(c => c.status === 'active');
            
            const byHouse = {};
            activeClients.forEach(client => {
                const house = client.houseId || 'Unassigned';
                if (!byHouse[house]) byHouse[house] = [];
                byHouse[house].push(client);
            });
            
            return byHouse;
        }
        
        calculateOverallStats(houseStats) {
            let totalCompliance = 0;
            let totalCritical = 0;
            let totalAtRisk = 0;
            let totalStrong = 0;
            let allAtRisk = [];
            
            houseStats.forEach(stats => {
                totalCompliance += stats.overallCompliance;
                totalCritical += stats.criticalCompliance;
                totalAtRisk += stats.atRiskClients.length;
                totalStrong += stats.strongClients.length;
                allAtRisk.push(...stats.atRiskClients);
            });
            
            const houseCount = houseStats.length || 1;
            
            return {
                overall: Math.round(totalCompliance / houseCount),
                critical: Math.round(totalCritical / houseCount),
                atRisk: totalAtRisk,
                strong: totalStrong,
                atRiskDetails: allAtRisk.slice(0, 5) // Top 5 most at risk
            };
        }
    }
    
    // Wait for dependencies and inject widget
    const injectComplianceWidget = () => {
        const checkInterval = setInterval(() => {
            if (window.dashboardWidgets && window.trackerEngine && window.clientManager) {
                clearInterval(checkInterval);
                
                // Find or create container for compliance widget
                let container = document.querySelector('.compliance-widget-container');
                if (!container) {
                    const dashboardContainer = document.querySelector('.dashboard-container');
                    const mainGrid = dashboardContainer?.querySelector('.dashboard-main-grid');
                    
                    if (dashboardContainer) {
                        container = document.createElement('div');
                        container.className = 'widget-container compliance-widget-container';
                        
                        // Insert as a full-width section directly below the main grid
                        if (mainGrid && mainGrid.parentElement) {
                            mainGrid.parentElement.insertBefore(container, mainGrid.nextSibling);
                        } else {
                            dashboardContainer.appendChild(container);
                        }
                    }
                }
                
                if (container) {
                    // Create and register widget
                    const complianceWidget = new ComplianceWidget(container);
                    window.dashboardWidgets.widgets.set('compliance', complianceWidget);
                    
                    // Initial render
                    complianceWidget.render();
                    
                    console.log('[ComplianceWidget] Widget injected and rendered');
                } else {
                    console.warn('[ComplianceWidget] Could not find suitable container');
                }
            }
        }, 100);
    };
    
    // Start injection process
    injectComplianceWidget();
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WINDOW EXPORTS
    // Required for static bundle compatibility. See docs/GLOBALS-REGISTRY.md
    // ═══════════════════════════════════════════════════════════════════════════
    window.ComplianceWidget = ComplianceWidget;
    
})();

