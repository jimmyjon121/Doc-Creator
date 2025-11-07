/**
 * Heat Map Visualization
 * Visual representation of tracker item completion patterns
 */

class HeatMapVisualization {
    constructor() {
        this.dbManager = window.indexedDBManager;
        this.trackerEngine = window.trackerEngine;
    }
    
    /**
     * Generate heat map data
     */
    async generateHeatMapData(options = {}) {
        const {
            view = 'items', // 'items', 'houses', 'days'
            timeRange = 30 // days
        } = options;
        
        const clients = await window.clientManager?.getAllClients() || [];
        const activeClients = clients.filter(c => {
            if (!c.admissionDate) return false;
            const daysInCare = this.trackerEngine?.calculateDaysInCare(c.admissionDate) || 0;
            return daysInCare <= timeRange;
        });
        
        if (view === 'items') {
            return this.generateItemHeatMap(activeClients);
        } else if (view === 'houses') {
            return this.generateHouseHeatMap(activeClients);
        } else if (view === 'days') {
            return this.generateDayHeatMap(activeClients, timeRange);
        }
        
        return null;
    }
    
    /**
     * Generate heat map by tracker items (which items are most missed)
     */
    generateItemHeatMap(clients) {
        const requirements = this.trackerEngine?.requirements || [];
        const itemStats = {};
        
        requirements.forEach(req => {
            let completed = 0;
            let missed = 0;
            let overdue = 0;
            const completionDays = [];
            
            clients.forEach(client => {
                const daysInCare = this.trackerEngine?.calculateDaysInCare(client.admissionDate) || 0;
                
                if (client[req.id]) {
                    completed++;
                    const completionDay = this.getCompletionDay(client, req.id, client.admissionDate);
                    if (completionDay) completionDays.push(completionDay);
                } else {
                    missed++;
                    if (daysInCare > req.dueByDay) {
                        overdue++;
                    }
                }
            });
            
            const completionRate = clients.length > 0 ? (completed / clients.length) * 100 : 0;
            const overdueRate = clients.length > 0 ? (overdue / clients.length) * 100 : 0;
            const avgCompletionDay = completionDays.length > 0 
                ? completionDays.reduce((a, b) => a + b, 0) / completionDays.length 
                : null;
            
            itemStats[req.id] = {
                label: req.label,
                category: req.category,
                critical: req.critical,
                dueByDay: req.dueByDay,
                completed,
                missed,
                overdue,
                total: clients.length,
                completionRate: Math.round(completionRate),
                overdueRate: Math.round(overdueRate),
                avgCompletionDay: avgCompletionDay ? Math.round(avgCompletionDay) : null,
                intensity: this.calculateIntensity(completionRate, overdueRate, req.critical)
            };
        });
        
        return {
            type: 'items',
            data: itemStats,
            summary: {
                totalItems: requirements.length,
                avgCompletionRate: Object.values(itemStats).reduce((sum, item) => sum + item.completionRate, 0) / requirements.length,
                mostMissed: Object.values(itemStats).sort((a, b) => b.missed - a.missed).slice(0, 5),
                mostOverdue: Object.values(itemStats).sort((a, b) => b.overdueRate - a.overdueRate).slice(0, 5)
            }
        };
    }
    
    /**
     * Generate heat map by houses
     */
    generateHouseHeatMap(clients) {
        const houseStats = {};
        const requirements = this.trackerEngine?.requirements || [];
        
        clients.forEach(client => {
            const houseId = client.houseId || 'Unknown';
            if (!houseStats[houseId]) {
                houseStats[houseId] = {
                    houseId,
                    clients: [],
                    itemStats: {},
                    totalCompletion: 0,
                    criticalCompletion: 0
                };
            }
            
            houseStats[houseId].clients.push(client);
            
            requirements.forEach(req => {
                if (!houseStats[houseId].itemStats[req.id]) {
                    houseStats[houseId].itemStats[req.id] = {
                        completed: 0,
                        total: 0
                    };
                }
                
                houseStats[houseId].itemStats[req.id].total++;
                if (client[req.id]) {
                    houseStats[houseId].itemStats[req.id].completed++;
                }
            });
        });
        
        // Calculate completion rates per house
        Object.keys(houseStats).forEach(houseId => {
            const house = houseStats[houseId];
            const scores = house.clients.map(c => this.trackerEngine?.getCompletionScore(c)?.overallPercentage || 0);
            house.avgCompletion = scores.length > 0 
                ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) 
                : 0;
            
            // Calculate critical item completion
            const criticalItems = requirements.filter(r => r.critical);
            let criticalComplete = 0;
            let criticalTotal = 0;
            
            criticalItems.forEach(req => {
                const stats = house.itemStats[req.id];
                if (stats) {
                    criticalTotal += stats.total;
                    criticalComplete += stats.completed;
                }
            });
            
            house.criticalCompletionRate = criticalTotal > 0 
                ? Math.round((criticalComplete / criticalTotal) * 100) 
                : 0;
            
            house.intensity = this.calculateHouseIntensity(house.avgCompletion, house.criticalCompletionRate);
        });
        
        return {
            type: 'houses',
            data: houseStats,
            summary: {
                totalHouses: Object.keys(houseStats).length,
                avgHouseCompletion: Object.values(houseStats).reduce((sum, h) => sum + h.avgCompletion, 0) / Object.keys(houseStats).length,
                topHouse: Object.values(houseStats).sort((a, b) => b.avgCompletion - a.avgCompletion)[0],
                bottomHouse: Object.values(houseStats).sort((a, b) => a.avgCompletion - b.avgCompletion)[0]
            }
        };
    }
    
    /**
     * Generate heat map by days (which days have most gaps)
     */
    generateDayHeatMap(clients, timeRange) {
        const dayStats = {};
        
        // Initialize days
        for (let day = 1; day <= timeRange; day++) {
            dayStats[day] = {
                day,
                gaps: 0,
                completions: 0,
                clients: new Set()
            };
        }
        
        clients.forEach(client => {
            const daysInCare = this.trackerEngine?.calculateDaysInCare(client.admissionDate) || 0;
            const requirements = this.trackerEngine?.requirements || [];
            
            requirements.forEach(req => {
                if (client[req.id]) {
                    const completionDay = this.getCompletionDay(client, req.id, client.admissionDate);
                    if (completionDay && completionDay <= timeRange) {
                        dayStats[completionDay].completions++;
                        dayStats[completionDay].clients.add(client.id);
                    }
                } else if (daysInCare >= req.dueByDay && req.dueByDay <= timeRange) {
                    // Item is overdue
                    for (let day = req.dueByDay; day <= Math.min(daysInCare, timeRange); day++) {
                        dayStats[day].gaps++;
                        dayStats[day].clients.add(client.id);
                    }
                }
            });
        });
        
        // Calculate intensities
        Object.keys(dayStats).forEach(day => {
            const stats = dayStats[day];
            stats.totalActivity = stats.gaps + stats.completions;
            stats.uniqueClients = stats.clients.size;
            stats.intensity = this.calculateDayIntensity(stats.gaps, stats.completions, stats.uniqueClients);
        });
        
        return {
            type: 'days',
            data: dayStats,
            summary: {
                daysAnalyzed: timeRange,
                peakGapDay: Object.values(dayStats).sort((a, b) => b.gaps - a.gaps)[0],
                peakCompletionDay: Object.values(dayStats).sort((a, b) => b.completions - a.completions)[0]
            }
        };
    }
    
    /**
     * Calculate intensity for item heat map
     */
    calculateIntensity(completionRate, overdueRate, critical) {
        // Higher intensity = more problematic
        let intensity = 0;
        
        // Low completion = high intensity
        intensity += (100 - completionRate) * 0.5;
        
        // High overdue rate = high intensity
        intensity += overdueRate * 0.8;
        
        // Critical items weighted more
        if (critical) intensity *= 1.3;
        
        return Math.min(100, Math.max(0, intensity));
    }
    
    /**
     * Calculate intensity for house heat map
     */
    calculateHouseIntensity(avgCompletion, criticalCompletionRate) {
        // Lower completion = higher intensity (more problematic)
        return Math.min(100, Math.max(0, 100 - avgCompletion));
    }
    
    /**
     * Calculate intensity for day heat map
     */
    calculateDayIntensity(gaps, completions, uniqueClients) {
        // More gaps = higher intensity (redder)
        // More completions = lower intensity (greener)
        const gapWeight = gaps * 2;
        const completionWeight = completions * 0.5;
        const intensity = gapWeight - completionWeight;
        
        return Math.min(100, Math.max(0, intensity + 50)); // Center around 50
    }
    
    /**
     * Get completion day for a tracker item
     */
    getCompletionDay(client, itemId, admissionDate) {
        const dateField = client[itemId + 'Date'];
        if (!dateField) return null;
        
        const completionDate = new Date(dateField);
        const admission = new Date(admissionDate);
        const diffTime = completionDate - admission;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Render heat map visualization
     */
    async renderHeatMap(view = 'items', containerId = 'heat-map-container') {
        const heatMapData = await this.generateHeatMapData({ view });
        const container = document.getElementById(containerId) || document.querySelector('.heat-map-container');
        
        if (!container) {
            console.error('Heat map container not found');
            return;
        }
        
        if (view === 'items') {
            container.innerHTML = this.renderItemHeatMap(heatMapData);
        } else if (view === 'houses') {
            container.innerHTML = this.renderHouseHeatMap(heatMapData);
        } else if (view === 'days') {
            container.innerHTML = this.renderDayHeatMap(heatMapData);
        }
    }
    
    /**
     * Render item-based heat map
     */
    renderItemHeatMap(data) {
        const items = Object.values(data.data).sort((a, b) => b.intensity - a.intensity);
        
        return `
            <div class="heat-map-widget items-heat-map">
                <div class="heat-map-header">
                    <h3>🔥 Tracker Item Heat Map</h3>
                    <p class="heat-map-subtitle">Which items are most frequently missed</p>
                </div>
                
                <div class="heat-map-legend">
                    <div class="legend-item">
                        <div class="legend-color" style="background: #10b981;"></div>
                        <span>High Completion (90%+)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #f59e0b;"></div>
                        <span>Medium (50-90%)</span>
                    </div>
                    <div class="legend-item">
                        <div class="legend-color" style="background: #ef4444;"></div>
                        <span>Low Completion (&lt;50%)</span>
                    </div>
                </div>
                
                <div class="heat-map-grid">
                    ${items.map(item => {
                        const color = this.getIntensityColor(item.intensity, item.completionRate);
                        return `
                            <div class="heat-map-cell" style="background: ${color};" title="${item.label}: ${item.completionRate}% complete, ${item.overdue} overdue">
                                <div class="cell-label">${item.label}</div>
                                <div class="cell-stats">
                                    <span class="cell-rate">${item.completionRate}%</span>
                                    ${item.overdue > 0 ? `<span class="cell-overdue">${item.overdue} overdue</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="heat-map-summary">
                    <div class="summary-stat">
                        <div class="stat-value">${data.summary.mostMissed[0]?.label || 'N/A'}</div>
                        <div class="stat-label">Most Frequently Missed</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-value">${data.summary.mostOverdue[0]?.label || 'N/A'}</div>
                        <div class="stat-label">Most Overdue</div>
                    </div>
                    <div class="summary-stat">
                        <div class="stat-value">${Math.round(data.summary.avgCompletionRate)}%</div>
                        <div class="stat-label">Average Completion Rate</div>
                    </div>
                </div>
            </div>
        `;
    }
    
    /**
     * Render house-based heat map
     */
    renderHouseHeatMap(data) {
        const houses = Object.values(data.data).sort((a, b) => b.intensity - a.intensity);
        
        return `
            <div class="heat-map-widget houses-heat-map">
                <div class="heat-map-header">
                    <h3>🏠 House Performance Heat Map</h3>
                    <p class="heat-map-subtitle">Completion rates by house</p>
                </div>
                
                <div class="house-heat-map-grid">
                    ${houses.map(house => {
                        const color = this.getIntensityColor(house.intensity, house.avgCompletion);
                        return `
                            <div class="house-heat-card" style="border-left: 4px solid ${color};">
                                <div class="house-name">${house.houseId}</div>
                                <div class="house-completion">
                                    <div class="completion-value">${house.avgCompletion}%</div>
                                    <div class="completion-bar">
                                        <div class="completion-fill" style="width: ${house.avgCompletion}%; background: ${color};"></div>
                                    </div>
                                </div>
                                <div class="house-stats">
                                    <span>${house.clients.length} clients</span>
                                    <span>•</span>
                                    <span>${house.criticalCompletionRate}% critical</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render day-based heat map
     */
    renderDayHeatMap(data) {
        const days = Object.values(data.data);
        
        return `
            <div class="heat-map-widget days-heat-map">
                <div class="heat-map-header">
                    <h3>📅 Daily Activity Heat Map</h3>
                    <p class="heat-map-subtitle">Gaps and completions by day in care</p>
                </div>
                
                <div class="day-heat-map-grid">
                    ${days.map(day => {
                        const color = this.getDayIntensityColor(day.intensity, day.gaps, day.completions);
                        return `
                            <div class="day-heat-cell" style="background: ${color};" title="Day ${day.day}: ${day.gaps} gaps, ${day.completions} completions">
                                <div class="day-number">${day.day}</div>
                                <div class="day-stats">
                                    ${day.gaps > 0 ? `<span class="day-gaps">${day.gaps}</span>` : ''}
                                    ${day.completions > 0 ? `<span class="day-completions">+${day.completions}</span>` : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Get color based on intensity
     */
    getIntensityColor(intensity, completionRate) {
        // Green = good (high completion), Red = bad (low completion)
        if (completionRate >= 90) return '#10b981'; // Green
        if (completionRate >= 70) return '#84cc16'; // Light green
        if (completionRate >= 50) return '#f59e0b'; // Yellow
        if (completionRate >= 30) return '#f97316'; // Orange
        return '#ef4444'; // Red
    }
    
    /**
     * Get color for day heat map
     */
    getDayIntensityColor(intensity, gaps, completions) {
        if (gaps === 0 && completions > 0) return '#10b981'; // Green - only completions
        if (gaps > completions * 2) return '#ef4444'; // Red - many gaps
        if (gaps > completions) return '#f97316'; // Orange - more gaps than completions
        if (gaps === completions) return '#f59e0b'; // Yellow - balanced
        return '#84cc16'; // Light green - more completions
    }
}

// Export
if (typeof window !== 'undefined') {
    window.heatMapVisualization = new HeatMapVisualization();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = HeatMapVisualization;
}
