/**
 * Tracker Compliance Dashboard Widget
 * House-level view of tracker completion across all clients
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
                            <h3>📊 Tracker Compliance</h3>
                            <button class="refresh-btn" onclick="dashboardWidgets.widgets.get('compliance')?.render()">
                                <span class="refresh-icon">↻</span>
                            </button>
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
                                    <span class="metric-label">Critical Items</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">${overallStats.atRisk}</span>
                                    <span class="metric-label">At Risk Clients</span>
                                </div>
                                <div class="metric">
                                    <span class="metric-value">${overallStats.strong}</span>
                                    <span class="metric-label">Strong Performers</span>
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
                
            } catch (error) {
                console.error('[ComplianceWidget] Render error:', error);
                this.container.innerHTML = '<div class="widget-error">Failed to load compliance data</div>';
            }
        }
        
        renderHouseCard(stats) {
            const riskClass = stats.overallCompliance >= 80 ? 'good' : 
                             stats.overallCompliance >= 60 ? 'warning' : 'danger';
            
            return `
                <div class="house-card ${riskClass}">
                    <div class="house-header">
                        <h4>${stats.houseId}</h4>
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
        
        async getClientsByHouse() {
            const allClients = await window.clientManager.getAllClients();
            const activeClients = allClients.filter(c => c.status === 'active');
            
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
                    // Try to insert after metrics widget
                    const metricsWidget = document.querySelector('.metrics-widget');
                    if (metricsWidget && metricsWidget.parentElement) {
                        container = document.createElement('div');
                        container.className = 'widget-container compliance-widget-container';
                        metricsWidget.parentElement.insertBefore(container, metricsWidget.nextSibling);
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
    
})();
