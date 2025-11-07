/**
 * Heat Map Visualization for CM Tracker
 * Shows patterns of missing items and completion trends
 */

class HeatMapVisualization {
    constructor() {
        this.dbManager = window.indexedDBManager;
        this.trackerEngine = window.trackerEngine || new TrackerEngine();
        this.clientManager = window.clientManager;
        
        // Color scales for heat map
        this.colorScales = {
            completion: [
                { threshold: 0, color: '#dc2626' },      // Red
                { threshold: 20, color: '#ef4444' },     // Light red
                { threshold: 40, color: '#f59e0b' },     // Orange
                { threshold: 60, color: '#fbbf24' },     // Yellow
                { threshold: 80, color: '#84cc16' },     // Light green
                { threshold: 100, color: '#22c55e' }     // Green
            ],
            frequency: [
                { threshold: 0, color: '#f0fdf4' },      // Very light
                { threshold: 10, color: '#bbf7d0' },     // Light
                { threshold: 25, color: '#86efac' },     // Medium light
                { threshold: 40, color: '#4ade80' },     // Medium
                { threshold: 60, color: '#22c55e' },     // Medium dark
                { threshold: 80, color: '#16a34a' }      // Dark
            ]
        };
    }
    
    /**
     * Generate heat map data
     */
    async generateHeatMapData() {
        const clients = await this.clientManager.getAllClients();
        
        const data = {
            byItem: await this.analyzeByItem(clients),
            byHouse: await this.analyzeByHouse(clients),
            byDayOfCare: await this.analyzeByDayOfCare(clients),
            byTimeOfWeek: await this.analyzeByTimeOfWeek(clients),
            correlations: await this.analyzeCorrelations(clients),
            trends: await this.analyzeTrends(clients)
        };
        
        return data;
    }
    
    /**
     * Analyze completion by tracker item
     */
    async analyzeByItem(clients) {
        const itemStats = {};
        
        // Initialize stats for each requirement
        this.trackerEngine.requirements.forEach(req => {
            itemStats[req.id] = {
                item: req,
                totalClients: 0,
                completed: 0,
                onTime: 0,
                late: 0,
                missing: 0,
                averageDaysToComplete: 0,
                completionTimes: []
            };
        });
        
        // Analyze each client
        for (const client of clients) {
            const daysInCare = this.trackerEngine.calculateDaysInCare(client.admissionDate);
            
            this.trackerEngine.requirements.forEach(req => {
                const stat = itemStats[req.id];
                stat.totalClients++;
                
                if (client[req.id]) {
                    stat.completed++;
                    
                    // Calculate when it was completed
                    const completionDate = client[req.id + 'Date'];
                    if (completionDate) {
                        const daysToComplete = this.trackerEngine.calculateDaysInCare(completionDate);
                        stat.completionTimes.push(daysToComplete);
                        
                        if (daysToComplete <= req.dueByDay) {
                            stat.onTime++;
                        } else {
                            stat.late++;
                        }
                    }
                } else if (daysInCare > req.dueByDay) {
                    stat.missing++;
                }
            });
        }
        
        // Calculate averages and percentages
        Object.values(itemStats).forEach(stat => {
            if (stat.completionTimes.length > 0) {
                stat.averageDaysToComplete = Math.round(
                    stat.completionTimes.reduce((a, b) => a + b) / stat.completionTimes.length
                );
            }
            stat.completionRate = Math.round((stat.completed / stat.totalClients) * 100);
            stat.onTimeRate = Math.round((stat.onTime / stat.totalClients) * 100);
            stat.missingRate = Math.round((stat.missing / stat.totalClients) * 100);
        });
        
        return itemStats;
    }
    
    /**
     * Analyze completion by house
     */
    async analyzeByHouse(clients) {
        const houseStats = {};
        
        // Group clients by house
        const clientsByHouse = {};
        clients.forEach(client => {
            const house = client.houseId || 'Unknown';
            if (!clientsByHouse[house]) clientsByHouse[house] = [];
            clientsByHouse[house].push(client);
        });
        
        // Analyze each house
        for (const [house, houseClients] of Object.entries(clientsByHouse)) {
            houseStats[house] = {
                clientCount: houseClients.length,
                averageCompletion: 0,
                itemCompletion: {},
                criticalMissingRate: 0,
                topMissingItems: []
            };
            
            let totalCompletion = 0;
            const itemCounts = {};
            
            // Analyze each client in house
            for (const client of houseClients) {
                const score = this.trackerEngine.getCompletionScore(client);
                totalCompletion += score.overallPercentage;
                
                // Track missing items
                score.missingItems.forEach(item => {
                    if (!itemCounts[item.id]) itemCounts[item.id] = 0;
                    itemCounts[item.id]++;
                });
            }
            
            houseStats[house].averageCompletion = Math.round(totalCompletion / houseClients.length);
            
            // Calculate item completion rates for this house
            this.trackerEngine.requirements.forEach(req => {
                const missing = itemCounts[req.id] || 0;
                const completionRate = Math.round(((houseClients.length - missing) / houseClients.length) * 100);
                houseStats[house].itemCompletion[req.id] = completionRate;
            });
            
            // Find top missing items
            const missingArray = Object.entries(itemCounts)
                .map(([itemId, count]) => ({
                    itemId,
                    count,
                    percentage: Math.round((count / houseClients.length) * 100)
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);
            
            houseStats[house].topMissingItems = missingArray;
        }
        
        return houseStats;
    }
    
    /**
     * Analyze completion by day of care
     */
    async analyzeByDayOfCare(clients) {
        const dayStats = {};
        const maxDays = 42; // Analyze up to 6 weeks
        
        // Initialize day buckets
        for (let day = 0; day <= maxDays; day += 7) {
            const bucket = `Days ${day}-${day + 6}`;
            dayStats[bucket] = {
                range: [day, day + 6],
                clientCount: 0,
                averageCompletion: 0,
                criticalItems: {},
                milestones: []
            };
        }
        
        // Analyze clients by their day of care
        for (const client of clients) {
            const daysInCare = this.trackerEngine.calculateDaysInCare(client.admissionDate);
            const bucketIndex = Math.floor(daysInCare / 7) * 7;
            const bucket = `Days ${bucketIndex}-${bucketIndex + 6}`;
            
            if (dayStats[bucket]) {
                const stat = dayStats[bucket];
                stat.clientCount++;
                
                const score = this.trackerEngine.getCompletionScore(client);
                stat.averageCompletion += score.overallPercentage;
                
                // Track critical items
                this.trackerEngine.requirements
                    .filter(req => req.critical && req.dueByDay >= bucketIndex && req.dueByDay <= bucketIndex + 6)
                    .forEach(req => {
                        if (!stat.criticalItems[req.id]) {
                            stat.criticalItems[req.id] = {
                                item: req,
                                completed: 0,
                                total: 0
                            };
                        }
                        stat.criticalItems[req.id].total++;
                        if (client[req.id]) stat.criticalItems[req.id].completed++;
                    });
            }
        }
        
        // Calculate averages
        Object.values(dayStats).forEach(stat => {
            if (stat.clientCount > 0) {
                stat.averageCompletion = Math.round(stat.averageCompletion / stat.clientCount);
            }
            
            // Calculate critical item completion rates
            Object.values(stat.criticalItems).forEach(item => {
                item.completionRate = item.total > 0 ? Math.round((item.completed / item.total) * 100) : 0;
            });
        });
        
        return dayStats;
    }
    
    /**
     * Analyze by time of week
     */
    async analyzeByTimeOfWeek(clients) {
        const weekStats = {
            monday: { completed: 0, total: 0 },
            tuesday: { completed: 0, total: 0 },
            wednesday: { completed: 0, total: 0 },
            thursday: { completed: 0, total: 0 },
            friday: { completed: 0, total: 0 },
            weekend: { completed: 0, total: 0 }
        };
        
        // Analyze completion dates
        for (const client of clients) {
            this.trackerEngine.requirements.forEach(req => {
                const dateField = req.id + 'Date';
                if (client[dateField]) {
                    const date = new Date(client[dateField]);
                    const dayOfWeek = date.getDay();
                    
                    let dayKey;
                    if (dayOfWeek === 0 || dayOfWeek === 6) {
                        dayKey = 'weekend';
                    } else {
                        dayKey = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
                    }
                    
                    if (weekStats[dayKey]) {
                        weekStats[dayKey].completed++;
                        weekStats[dayKey].total++;
                    }
                }
            });
        }
        
        // Calculate completion rates
        Object.values(weekStats).forEach(stat => {
            stat.rate = stat.total > 0 ? Math.round((stat.completed / stat.total) * 100) : 0;
        });
        
        return weekStats;
    }
    
    /**
     * Analyze correlations
     */
    async analyzeCorrelations(clients) {
        const correlations = [];
        
        // Early completion correlation
        let earlyAssessmentClients = 0;
        let earlyAssessmentSuccess = 0;
        
        for (const client of clients) {
            // Check if assessments were done early
            if (client.needsAssessment && client.healthPhysical) {
                const needsDate = new Date(client.needsAssessmentDate);
                const healthDate = new Date(client.healthPhysicalDate);
                const admissionDate = new Date(client.admissionDate);
                
                const needsDays = Math.floor((needsDate - admissionDate) / (1000 * 60 * 60 * 24));
                const healthDays = Math.floor((healthDate - admissionDate) / (1000 * 60 * 60 * 24));
                
                if (needsDays <= 1 && healthDays <= 1) {
                    earlyAssessmentClients++;
                    
                    // Check overall success
                    const score = this.trackerEngine.getCompletionScore(client);
                    if (score.overallPercentage >= 90) {
                        earlyAssessmentSuccess++;
                    }
                }
            }
        }
        
        if (earlyAssessmentClients > 0) {
            correlations.push({
                pattern: 'Early Assessment Completion',
                successRate: Math.round((earlyAssessmentSuccess / earlyAssessmentClients) * 100),
                sampleSize: earlyAssessmentClients,
                insight: 'Clients who complete assessments within 24 hours have higher overall completion rates'
            });
        }
        
        // GAD/PHQ together correlation
        let togetherCount = 0;
        let togetherSuccess = 0;
        
        for (const client of clients) {
            if (client.gadCompleted && client.phqCompleted) {
                const gadDate = new Date(client.gadCompletedDate);
                const phqDate = new Date(client.phqCompletedDate);
                const daysDiff = Math.abs(gadDate - phqDate) / (1000 * 60 * 60 * 24);
                
                if (daysDiff <= 1) {
                    togetherCount++;
                    const score = this.trackerEngine.getCompletionScore(client);
                    if (score.criticalPercentage === 100) {
                        togetherSuccess++;
                    }
                }
            }
        }
        
        if (togetherCount > 0) {
            correlations.push({
                pattern: 'GAD/PHQ Completed Together',
                successRate: Math.round((togetherSuccess / togetherCount) * 100),
                sampleSize: togetherCount,
                insight: 'Completing GAD and PHQ together correlates with 100% critical item completion'
            });
        }
        
        return correlations;
    }
    
    /**
     * Analyze trends over time
     */
    async analyzeTrends(clients) {
        // Group clients by admission month
        const monthlyData = {};
        
        clients.forEach(client => {
            const admissionDate = new Date(client.admissionDate);
            const monthKey = `${admissionDate.getFullYear()}-${String(admissionDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = {
                    clients: [],
                    averageCompletion: 0,
                    onTimeRate: 0
                };
            }
            
            monthlyData[monthKey].clients.push(client);
        });
        
        // Calculate monthly statistics
        const trends = [];
        Object.entries(monthlyData).forEach(([month, data]) => {
            let totalCompletion = 0;
            let onTimeCount = 0;
            let totalItems = 0;
            
            data.clients.forEach(client => {
                const score = this.trackerEngine.getCompletionScore(client);
                totalCompletion += score.overallPercentage;
                
                // Check on-time completions
                this.trackerEngine.requirements.forEach(req => {
                    if (client[req.id]) {
                        totalItems++;
                        const completionDate = client[req.id + 'Date'];
                        if (completionDate) {
                            const daysToComplete = this.trackerEngine.calculateDaysInCare(completionDate);
                            if (daysToComplete <= req.dueByDay) {
                                onTimeCount++;
                            }
                        }
                    }
                });
            });
            
            trends.push({
                month,
                clientCount: data.clients.length,
                averageCompletion: Math.round(totalCompletion / data.clients.length),
                onTimeRate: totalItems > 0 ? Math.round((onTimeCount / totalItems) * 100) : 0
            });
        });
        
        // Sort by month
        trends.sort((a, b) => a.month.localeCompare(b.month));
        
        return trends;
    }
    
    /**
     * Render heat map visualization
     */
    async renderHeatMap() {
        const data = await this.generateHeatMapData();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay heat-map-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1200px;">
                <div class="modal-header">
                    <h2>🔥 Tracker Heat Map Analysis</h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="heat-map-content">
                    <!-- Tab Navigation -->
                    <div class="heat-map-tabs">
                        <button class="tab-btn active" onclick="heatMap.switchTab('items')">By Item</button>
                        <button class="tab-btn" onclick="heatMap.switchTab('houses')">By House</button>
                        <button class="tab-btn" onclick="heatMap.switchTab('timeline')">Timeline</button>
                        <button class="tab-btn" onclick="heatMap.switchTab('patterns')">Patterns</button>
                        <button class="tab-btn" onclick="heatMap.switchTab('trends')">Trends</button>
                    </div>
                    
                    <!-- Tab Content -->
                    <div class="tab-content">
                        <!-- By Item Tab -->
                        <div id="items-tab" class="tab-pane active">
                            ${this.renderItemsHeatMap(data.byItem)}
                        </div>
                        
                        <!-- By House Tab -->
                        <div id="houses-tab" class="tab-pane">
                            ${this.renderHousesHeatMap(data.byHouse)}
                        </div>
                        
                        <!-- Timeline Tab -->
                        <div id="timeline-tab" class="tab-pane">
                            ${this.renderTimelineHeatMap(data.byDayOfCare)}
                        </div>
                        
                        <!-- Patterns Tab -->
                        <div id="patterns-tab" class="tab-pane">
                            ${this.renderPatternsView(data.correlations, data.byTimeOfWeek)}
                        </div>
                        
                        <!-- Trends Tab -->
                        <div id="trends-tab" class="tab-pane">
                            ${this.renderTrendsView(data.trends)}
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="heatMap.exportData()">
                        📊 Export Data
                    </button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Render items heat map
     */
    renderItemsHeatMap(itemData) {
        const items = Object.values(itemData).sort((a, b) => a.missingRate - b.missingRate);
        
        return `
            <div class="items-heat-map">
                <h3>Tracker Item Completion Rates</h3>
                <div class="heat-legend">
                    <span>High Completion</span>
                    <div class="legend-gradient"></div>
                    <span>Low Completion</span>
                </div>
                
                <div class="heat-grid">
                    ${items.map(stat => `
                        <div class="heat-cell" style="background-color: ${this.getColor(stat.completionRate, 'completion')}">
                            <div class="cell-header">
                                <span class="item-name">${stat.item.label}</span>
                                <span class="item-critical">${stat.item.critical ? '⭐' : ''}</span>
                            </div>
                            <div class="cell-stats">
                                <div class="stat-row">
                                    <span>Completion:</span>
                                    <strong>${stat.completionRate}%</strong>
                                </div>
                                <div class="stat-row">
                                    <span>On Time:</span>
                                    <strong>${stat.onTimeRate}%</strong>
                                </div>
                                <div class="stat-row">
                                    <span>Missing:</span>
                                    <strong class="missing">${stat.missingRate}%</strong>
                                </div>
                                <div class="stat-row">
                                    <span>Avg Days:</span>
                                    <strong>${stat.averageDaysToComplete || 'N/A'}</strong>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render houses heat map
     */
    renderHousesHeatMap(houseData) {
        return `
            <div class="houses-heat-map">
                <h3>House Performance Comparison</h3>
                
                <div class="house-grid">
                    ${Object.entries(houseData).map(([house, stats]) => `
                        <div class="house-card">
                            <div class="house-header" style="background-color: ${this.getColor(stats.averageCompletion, 'completion')}">
                                <h4>${house}</h4>
                                <div class="house-score">${stats.averageCompletion}%</div>
                                <div class="house-clients">${stats.clientCount} clients</div>
                            </div>
                            
                            <div class="house-items">
                                <h5>Top Missing Items:</h5>
                                ${stats.topMissingItems.map(item => `
                                    <div class="missing-item">
                                        <span>${this.getItemLabel(item.itemId)}</span>
                                        <span class="missing-percent">${item.percentage}%</span>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="house-matrix">
                                ${this.renderMiniHeatMap(stats.itemCompletion)}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render timeline heat map
     */
    renderTimelineHeatMap(dayData) {
        return `
            <div class="timeline-heat-map">
                <h3>Completion by Days in Care</h3>
                
                <div class="timeline-grid">
                    ${Object.entries(dayData).map(([range, stats]) => `
                        <div class="timeline-section">
                            <div class="timeline-header">
                                <h4>${range}</h4>
                                <span class="client-count">${stats.clientCount} clients</span>
                            </div>
                            
                            <div class="timeline-bar" style="background-color: ${this.getColor(stats.averageCompletion, 'completion')}">
                                <div class="completion-text">${stats.averageCompletion}%</div>
                            </div>
                            
                            ${Object.keys(stats.criticalItems).length > 0 ? `
                                <div class="critical-items">
                                    <h5>Critical Items Due:</h5>
                                    ${Object.values(stats.criticalItems).map(item => `
                                        <div class="critical-item">
                                            <span>${item.item.label}</span>
                                            <span class="completion-rate">${item.completionRate}%</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render patterns view
     */
    renderPatternsView(correlations, weekData) {
        return `
            <div class="patterns-view">
                <h3>Success Patterns & Correlations</h3>
                
                <div class="correlations-section">
                    ${correlations.map(corr => `
                        <div class="correlation-card">
                            <div class="correlation-header">
                                <h4>${corr.pattern}</h4>
                                <div class="success-rate">${corr.successRate}%</div>
                            </div>
                            <div class="correlation-details">
                                <p>${corr.insight}</p>
                                <span class="sample-size">Sample: ${corr.sampleSize} clients</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="week-patterns">
                    <h3>Completion by Day of Week</h3>
                    <div class="week-grid">
                        ${Object.entries(weekData).map(([day, stats]) => `
                            <div class="day-stat">
                                <div class="day-name">${day.charAt(0).toUpperCase() + day.slice(1)}</div>
                                <div class="day-bar" style="height: ${stats.rate}%; background-color: ${this.getColor(stats.rate, 'completion')}">
                                    <span class="day-rate">${stats.rate}%</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render trends view
     */
    renderTrendsView(trends) {
        if (trends.length === 0) {
            return '<div class="no-data">Not enough historical data for trends</div>';
        }
        
        return `
            <div class="trends-view">
                <h3>Monthly Trends</h3>
                
                <div class="trends-chart">
                    ${trends.map((month, index) => `
                        <div class="month-data">
                            <div class="month-label">${this.formatMonth(month.month)}</div>
                            <div class="month-bars">
                                <div class="completion-bar" style="height: ${month.averageCompletion}%; background: #3b82f6"></div>
                                <div class="ontime-bar" style="height: ${month.onTimeRate}%; background: #10b981"></div>
                            </div>
                            <div class="month-stats">
                                <span>Avg: ${month.averageCompletion}%</span>
                                <span>On-time: ${month.onTimeRate}%</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="trends-legend">
                    <span><span class="legend-box" style="background: #3b82f6"></span> Average Completion</span>
                    <span><span class="legend-box" style="background: #10b981"></span> On-Time Rate</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render mini heat map for house items
     */
    renderMiniHeatMap(itemCompletion) {
        return `
            <div class="mini-heat-grid">
                ${Object.entries(itemCompletion).map(([itemId, rate]) => `
                    <div class="mini-cell" 
                         style="background-color: ${this.getColor(rate, 'completion')}"
                         title="${this.getItemLabel(itemId)}: ${rate}%">
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Get color based on value and scale
     */
    getColor(value, scale) {
        const colors = this.colorScales[scale];
        for (let i = colors.length - 1; i >= 0; i--) {
            if (value >= colors[i].threshold) {
                return colors[i].color;
            }
        }
        return colors[0].color;
    }
    
    /**
     * Get item label by ID
     */
    getItemLabel(itemId) {
        const req = this.trackerEngine.requirements.find(r => r.id === itemId);
        return req ? req.label : itemId;
    }
    
    /**
     * Format month string
     */
    formatMonth(monthStr) {
        const [year, month] = monthStr.split('-');
        const date = new Date(year, parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    
    /**
     * Switch tabs
     */
    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        event.target.classList.add('active');
    }
    
    /**
     * Export heat map data
     */
    exportData() {
        console.log('Export heat map data');
        // Would implement CSV/JSON export
    }
}

// Initialize and export
if (typeof window !== 'undefined') {
    window.heatMap = new HeatMapVisualization();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeatMapVisualization;
}
