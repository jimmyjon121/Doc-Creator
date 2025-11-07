/**
 * Morning Review Dashboard
 * Provides prioritized daily task summary for efficient morning workflow
 */

class MorningReviewDashboard {
    constructor() {
        this.dbManager = window.indexedDBManager;
        this.trackerEngine = window.trackerEngine;
        this.predictiveEngine = window.predictiveCompletionEngine;
    }
    
    /**
     * Generate morning review summary
     */
    async generateMorningReview() {
        const clients = await window.clientManager?.getAllClients() || [];
        const activeClients = clients.filter(c => !c.dischargeDate || new Date(c.dischargeDate) > new Date());
        
        const review = {
            date: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            summary: {
                totalClients: activeClients.length,
                criticalTasks: 0,
                dueToday: 0,
                atRisk: 0,
                readyForDischarge: 0
            },
            criticalTasks: [],
            dueToday: [],
            atRiskClients: [],
            houseSummary: {},
            recommendations: []
        };
        
        // Process each client
        for (const client of activeClients) {
            const daysInCare = this.trackerEngine?.calculateDaysInCare(client.admissionDate) || 0;
            const daysToDischarge = this.trackerEngine?.calculateDaysToDischarge(client) || null;
            const score = this.trackerEngine?.getCompletionScore(client);
            const missingCritical = score?.missingCritical || [];
            
            // Critical tasks
            const criticalTasks = missingCritical.filter(item => {
                const daysOverdue = daysInCare - item.dueByDay;
                return daysOverdue > 0 || (daysToDischarge && daysToDischarge <= 7);
            });
            
            if (criticalTasks.length > 0) {
                review.summary.criticalTasks += criticalTasks.length;
                criticalTasks.forEach(item => {
                    review.criticalTasks.push({
                        clientId: client.id,
                        clientInitials: client.initials,
                        houseId: client.houseId,
                        item: item.label,
                        itemId: item.id,
                        daysOverdue: daysInCare - item.dueByDay,
                        priority: 'critical',
                        category: item.category
                    });
                });
            }
            
            // Due today tasks
            const dueToday = missingCritical.filter(item => {
                const daysUntilDue = item.dueByDay - daysInCare;
                return daysUntilDue === 0 || (daysUntilDue === 1 && daysInCare >= item.dueByDay - 1);
            });
            
            if (dueToday.length > 0) {
                review.summary.dueToday += dueToday.length;
                dueToday.forEach(item => {
                    review.dueToday.push({
                        clientId: client.id,
                        clientInitials: client.initials,
                        houseId: client.houseId,
                        item: item.label,
                        itemId: item.id,
                        priority: 'high',
                        category: item.category
                    });
                });
            }
            
            // At-risk clients
            if (this.predictiveEngine) {
                const prediction = this.predictiveEngine.predictCompletionAtDischarge(client);
                if (prediction.atRisk) {
                    review.summary.atRisk++;
                    review.atRiskClients.push({
                        clientId: client.id,
                        clientInitials: client.initials,
                        houseId: client.houseId,
                        currentCompletion: prediction.currentCompletion,
                        predictedCompletion: prediction.predictedCompletion,
                        daysToDischarge: prediction.daysToDischarge,
                        riskLevel: prediction.riskLevel,
                        message: prediction.message,
                        missingCritical: missingCritical.length
                    });
                }
            }
            
            // Ready for discharge
            if (daysToDischarge !== null && daysToDischarge <= 3 && score?.overallPercentage >= 90) {
                review.summary.readyForDischarge++;
            }
            
            // House summary
            if (!review.houseSummary[client.houseId]) {
                review.houseSummary[client.houseId] = {
                    clients: 0,
                    criticalTasks: 0,
                    avgCompletion: 0,
                    totalCompletion: 0
                };
            }
            review.houseSummary[client.houseId].clients++;
            review.houseSummary[client.houseId].criticalTasks += criticalTasks.length;
            review.houseSummary[client.houseId].totalCompletion += score?.overallPercentage || 0;
        }
        
        // Calculate house averages
        Object.keys(review.houseSummary).forEach(houseId => {
            const house = review.houseSummary[houseId];
            house.avgCompletion = Math.round(house.totalCompletion / house.clients);
        });
        
        // Generate recommendations
        review.recommendations = this.generateRecommendations(review);
        
        // Sort tasks by priority
        review.criticalTasks.sort((a, b) => {
            if (a.daysOverdue !== b.daysOverdue) return b.daysOverdue - a.daysOverdue;
            return a.clientInitials.localeCompare(b.clientInitials);
        });
        
        review.dueToday.sort((a, b) => {
            return a.clientInitials.localeCompare(b.clientInitials);
        });
        
        return review;
    }
    
    /**
     * Generate actionable recommendations
     */
    generateRecommendations(review) {
        const recommendations = [];
        
        // Critical tasks recommendation
        if (review.summary.criticalTasks > 0) {
            recommendations.push({
                type: 'critical',
                priority: 'high',
                icon: '🔥',
                title: `${review.summary.criticalTasks} Critical Tasks Need Attention`,
                message: `Focus on overdue items first to prevent delays`,
                action: 'View Critical Tasks',
                count: review.summary.criticalTasks
            });
        }
        
        // Due today recommendation
        if (review.summary.dueToday > 0) {
            recommendations.push({
                type: 'due-today',
                priority: 'high',
                icon: '⏰',
                title: `${review.summary.dueToday} Items Due Today`,
                message: `Complete these today to stay on track`,
                action: 'View Due Today',
                count: review.summary.dueToday
            });
        }
        
        // At-risk clients
        if (review.summary.atRisk > 0) {
            recommendations.push({
                type: 'at-risk',
                priority: 'medium',
                icon: '⚠️',
                title: `${review.summary.atRisk} Clients At Risk`,
                message: `These clients may not meet completion goals`,
                action: 'View At-Risk Clients',
                count: review.summary.atRisk
            });
        }
        
        // House with most critical tasks
        const housesByTasks = Object.entries(review.houseSummary)
            .sort((a, b) => b[1].criticalTasks - a[1].criticalTasks);
        
        if (housesByTasks.length > 0 && housesByTasks[0][1].criticalTasks > 0) {
            recommendations.push({
                type: 'house-focus',
                priority: 'medium',
                icon: '🏠',
                title: `${housesByTasks[0][0]} Needs Most Attention`,
                message: `${housesByTasks[0][1].criticalTasks} critical tasks across ${housesByTasks[0][1].clients} clients`,
                action: `Focus on ${housesByTasks[0][0]}`,
                houseId: housesByTasks[0][0]
            });
        }
        
        // Ready for discharge
        if (review.summary.readyForDischarge > 0) {
            recommendations.push({
                type: 'discharge-ready',
                priority: 'low',
                icon: '✅',
                title: `${review.summary.readyForDischarge} Clients Ready for Discharge`,
                message: `Finalize discharge paperwork`,
                action: 'View Discharge Ready',
                count: review.summary.readyForDischarge
            });
        }
        
        return recommendations;
    }
    
    /**
     * Render morning review widget
     */
    async renderMorningReview() {
        const review = await this.generateMorningReview();
        
        return `
            <div class="morning-review-widget">
                <div class="morning-review-header">
                    <div class="morning-greeting">
                        <h2>🌅 Good Morning!</h2>
                        <p class="review-date">${review.date}</p>
                    </div>
                    <div class="morning-stats">
                        <div class="stat-card critical">
                            <div class="stat-value">${review.summary.criticalTasks}</div>
                            <div class="stat-label">Critical Tasks</div>
                        </div>
                        <div class="stat-card due-today">
                            <div class="stat-value">${review.summary.dueToday}</div>
                            <div class="stat-label">Due Today</div>
                        </div>
                        <div class="stat-card at-risk">
                            <div class="stat-value">${review.summary.atRisk}</div>
                            <div class="stat-label">At Risk</div>
                        </div>
                        <div class="stat-card total">
                            <div class="stat-value">${review.summary.totalClients}</div>
                            <div class="stat-label">Active Clients</div>
                        </div>
                    </div>
                </div>
                
                <div class="morning-recommendations">
                    <h3>📋 Your Action Plan</h3>
                    <div class="recommendations-grid">
                        ${review.recommendations.map(rec => `
                            <div class="recommendation-card ${rec.type} priority-${rec.priority}">
                                <div class="rec-icon">${rec.icon}</div>
                                <div class="rec-content">
                                    <div class="rec-title">${rec.title}</div>
                                    <div class="rec-message">${rec.message}</div>
                                </div>
                                <div class="rec-badge">${rec.count || ''}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                ${review.criticalTasks.length > 0 ? `
                    <div class="morning-section critical-tasks">
                        <h3>🔥 Critical Tasks (${review.criticalTasks.length})</h3>
                        <div class="task-list">
                            ${review.criticalTasks.slice(0, 10).map(task => `
                                <div class="task-item critical">
                                    <div class="task-client">${task.clientInitials}</div>
                                    <div class="task-details">
                                        <div class="task-name">${task.item}</div>
                                        <div class="task-meta">${task.houseId} • ${task.daysOverdue} days overdue</div>
                                    </div>
                                    <button class="task-action" onclick="dashboardWidgets.completeTrackerItem('${task.clientId}', '${task.itemId}')">
                                        ✓ Complete
                                    </button>
                                </div>
                            `).join('')}
                            ${review.criticalTasks.length > 10 ? `<div class="task-more">+ ${review.criticalTasks.length - 10} more critical tasks</div>` : ''}
                        </div>
                    </div>
                ` : ''}
                
                ${review.dueToday.length > 0 ? `
                    <div class="morning-section due-today">
                        <h3>⏰ Due Today (${review.dueToday.length})</h3>
                        <div class="task-list">
                            ${review.dueToday.slice(0, 10).map(task => `
                                <div class="task-item due-today">
                                    <div class="task-client">${task.clientInitials}</div>
                                    <div class="task-details">
                                        <div class="task-name">${task.item}</div>
                                        <div class="task-meta">${task.houseId}</div>
                                    </div>
                                    <button class="task-action" onclick="dashboardWidgets.completeTrackerItem('${task.clientId}', '${task.itemId}')">
                                        ✓ Complete
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${review.atRiskClients.length > 0 ? `
                    <div class="morning-section at-risk">
                        <h3>⚠️ At-Risk Clients (${review.atRiskClients.length})</h3>
                        <div class="client-risk-list">
                            ${review.atRiskClients.slice(0, 5).map(client => `
                                <div class="risk-client-card">
                                    <div class="risk-client-header">
                                        <div class="risk-client-info">
                                            <span class="risk-initials">${client.clientInitials}</span>
                                            <span class="risk-house">${client.houseId}</span>
                                        </div>
                                        <div class="risk-badge ${client.riskLevel}">${client.riskLevel.toUpperCase()}</div>
                                    </div>
                                    <div class="risk-progress">
                                        <div class="risk-current">${client.currentCompletion}%</div>
                                        <div class="risk-arrow">→</div>
                                        <div class="risk-predicted">${client.predictedCompletion}%</div>
                                    </div>
                                    <div class="risk-message">${client.message}</div>
                                    <div class="risk-missing">${client.missingCritical} critical items missing</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="morning-section house-summary">
                    <h3>🏠 House Summary</h3>
                    <div class="house-grid">
                        ${Object.entries(review.houseSummary).map(([houseId, stats]) => `
                            <div class="house-card">
                                <div class="house-name">${houseId}</div>
                                <div class="house-stats">
                                    <div class="house-stat">
                                        <span class="house-stat-value">${stats.clients}</span>
                                        <span class="house-stat-label">Clients</span>
                                    </div>
                                    <div class="house-stat">
                                        <span class="house-stat-value">${stats.criticalTasks}</span>
                                        <span class="house-stat-label">Critical</span>
                                    </div>
                                    <div class="house-stat">
                                        <span class="house-stat-value">${stats.avgCompletion}%</span>
                                        <span class="house-stat-label">Avg Complete</span>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.morningReviewDashboard = new MorningReviewDashboard();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MorningReviewDashboard;
}
