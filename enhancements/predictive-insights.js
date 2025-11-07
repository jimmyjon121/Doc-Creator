/**
 * Predictive Insights UI Enhancement
 * Displays predictions on client cards and in dashboard
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.trackerPredictiveEngine || !window.dashboardWidgets || !window.dashboardManager) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        enhancePredictiveInsights();
    }
    
    /**
     * Add predictive insights to client cards
     */
    function enhancePredictiveInsights() {
        // Enhance client card rendering
        const originalRenderCard = window.dashboardWidgets.renderClientCard;
        
        window.dashboardWidgets.renderClientCard = function(client) {
            const baseHtml = originalRenderCard.call(this, client);
            
            // Add prediction data asynchronously
            setTimeout(async () => {
                const cardElement = document.querySelector(`[data-client-id="${client.id}"]`);
                if (!cardElement) return;
                
                // Get prediction
                const prediction = await window.trackerPredictiveEngine.predictCompletionAtDischarge(client);
                
                // Find or create prediction container
                let predictionContainer = cardElement.querySelector('.prediction-insights');
                if (!predictionContainer) {
                    predictionContainer = document.createElement('div');
                    predictionContainer.className = 'prediction-insights';
                    
                    // Insert after client header
                    const header = cardElement.querySelector('.client-header');
                    if (header && header.parentNode) {
                        header.parentNode.insertBefore(predictionContainer, header.nextSibling);
                    }
                }
                
                // Render prediction UI
                predictionContainer.innerHTML = renderPredictionInsights(client, prediction);
            }, 100);
            
            return baseHtml;
        };
        
        // Add prediction modal capability
        window.showPredictionDetails = function(clientId) {
            renderPredictionModal(clientId);
        };
        
        // Add group analysis view
        addGroupAnalysisButton();
    }
    
    /**
     * Render prediction insights for a client
     */
    function renderPredictionInsights(client, prediction) {
        const riskColors = {
            low: '#10b981',
            medium: '#f59e0b', 
            high: '#ef4444',
            critical: '#dc2626'
        };
        
        const confidenceStars = '★'.repeat(Math.round(prediction.confidence * 5)) + 
                               '☆'.repeat(5 - Math.round(prediction.confidence * 5));
        
        let html = `
            <div class="prediction-bar" onclick="showPredictionDetails('${client.id}')">
                <div class="prediction-header">
                    <span class="prediction-label">
                        🔮 Predicted at discharge: 
                        <strong style="color: ${riskColors[prediction.riskLevel]}">${prediction.predicted}%</strong>
                    </span>
                    <span class="confidence-indicator" title="Confidence: ${Math.round(prediction.confidence * 100)}%">
                        ${confidenceStars}
                    </span>
                </div>
        `;
        
        // Show trajectory indicator
        if (prediction.trajectory > 0) {
            const trendIcon = prediction.trajectory > prediction.pace ? '📈' : '📊';
            html += `
                <div class="trajectory-indicator">
                    ${trendIcon} ${prediction.trajectory > prediction.pace ? 'Accelerating' : 'Steady'} progress
                </div>
            `;
        }
        
        // Show most important insight
        if (prediction.insights.length > 0) {
            const topInsight = prediction.insights.find(i => i.type === 'critical') || 
                              prediction.insights.find(i => i.type === 'warning') ||
                              prediction.insights[0];
            
            const insightIcons = {
                critical: '🚨',
                warning: '⚠️',
                info: 'ℹ️',
                success: '✅'
            };
            
            html += `
                <div class="top-insight ${topInsight.type}">
                    ${insightIcons[topInsight.type]} ${topInsight.message}
                </div>
            `;
        }
        
        // Show top recommendation if high risk
        if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
            const topRec = prediction.recommendations[0];
            if (topRec) {
                html += `
                    <div class="urgent-action">
                        <strong>Action needed:</strong> ${topRec.action}
                    </div>
                `;
            }
        }
        
        html += `
            </div>
        `;
        
        return html;
    }
    
    /**
     * Render detailed prediction modal
     */
    async function renderPredictionModal(clientId) {
        const client = await window.clientManager.getClient(clientId);
        if (!client) return;
        
        const prediction = await window.trackerPredictiveEngine.predictCompletionAtDischarge(client);
        const score = window.trackerEngine?.getCompletionScore(client);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay prediction-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 900px;">
                <div class="modal-header">
                    <h2>📊 Predictive Analysis - ${client.initials}</h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="prediction-content">
                    <!-- Current vs Predicted -->
                    <div class="prediction-comparison">
                        <div class="metric-card current">
                            <div class="metric-label">Current</div>
                            <div class="metric-value">${prediction.current}%</div>
                            <div class="metric-detail">${score.completedItems}/${score.totalItems} items</div>
                        </div>
                        
                        <div class="prediction-arrow">
                            ➜
                            <div class="days-remaining">${prediction.daysToDischarge} days</div>
                        </div>
                        
                        <div class="metric-card predicted ${prediction.riskLevel}">
                            <div class="metric-label">Predicted</div>
                            <div class="metric-value">${prediction.predicted}%</div>
                            <div class="metric-detail">
                                <div class="confidence-stars">
                                    ${'★'.repeat(Math.round(prediction.confidence * 5))}${'☆'.repeat(5 - Math.round(prediction.confidence * 5))}
                                </div>
                                ${Math.round(prediction.confidence * 100)}% confidence
                            </div>
                        </div>
                    </div>
                    
                    <!-- Visual Progress Chart -->
                    <div class="progress-visualization">
                        <h3>Progress Trajectory</h3>
                        <div class="trajectory-chart">
                            <div class="current-progress" style="width: ${prediction.current}%">
                                <span class="progress-label">Now</span>
                            </div>
                            <div class="predicted-progress" style="width: ${prediction.predicted}%">
                                <span class="progress-label">At Discharge</span>
                            </div>
                            <div class="benchmark-line" style="left: ${prediction.expectedBenchmark}%">
                                <span class="benchmark-label">Typical</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Insights -->
                    <div class="insights-section">
                        <h3>Key Insights</h3>
                        <div class="insights-grid">
                            ${prediction.insights.map(insight => `
                                <div class="insight-card ${insight.type}">
                                    <div class="insight-icon">${getInsightIcon(insight.type)}</div>
                                    <div class="insight-text">${insight.message}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Recommendations -->
                    <div class="recommendations-section">
                        <h3>Recommended Actions</h3>
                        <div class="recommendations-list">
                            ${prediction.recommendations.map((rec, index) => `
                                <div class="recommendation-item priority-${rec.priority}">
                                    <div class="rec-number">${index + 1}</div>
                                    <div class="rec-content">
                                        <div class="rec-action">${rec.action}</div>
                                        <div class="rec-impact">${rec.impact}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <!-- Risk Assessment -->
                    <div class="risk-assessment">
                        <h3>Risk Level: <span class="risk-badge ${prediction.riskLevel}">${prediction.riskLevel.toUpperCase()}</span></h3>
                        <div class="risk-factors">
                            ${generateRiskFactors(client, prediction, score)}
                        </div>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="printPrediction('${client.id}')">
                        🖨️ Print Report
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
     * Get icon for insight type
     */
    function getInsightIcon(type) {
        const icons = {
            critical: '🚨',
            warning: '⚠️',
            info: 'ℹ️',
            success: '✅'
        };
        return icons[type] || '📌';
    }
    
    /**
     * Generate risk factors display
     */
    function generateRiskFactors(client, prediction, score) {
        const factors = [];
        
        // Critical items overdue
        const overdueCount = score.missingCritical.filter(item => {
            const daysInCare = window.trackerEngine.calculateDaysInCare(client.admissionDate);
            return daysInCare > item.dueByDay;
        }).length;
        
        if (overdueCount > 0) {
            factors.push(`🔴 ${overdueCount} critical items overdue`);
        }
        
        // Below benchmark
        if (prediction.current < prediction.expectedBenchmark * 0.8) {
            factors.push(`📉 ${Math.round(prediction.expectedBenchmark - prediction.current)}% below typical progress`);
        }
        
        // Insufficient pace
        if (prediction.predicted < 85) {
            factors.push(`⏱️ Current pace insufficient for complete discharge`);
        }
        
        // No aftercare
        if (!client.aftercareThreadSent && prediction.daysToDischarge <= 14) {
            factors.push(`🏠 No aftercare planning initiated`);
        }
        
        return factors.map(f => `<div class="risk-factor">${f}</div>`).join('');
    }
    
    /**
     * Add group analysis button to dashboard
     */
    function addGroupAnalysisButton() {
        // Wait for dashboard header
        const checkHeader = setInterval(() => {
            const dashboardControls = document.querySelector('.dashboard-controls');
            if (dashboardControls) {
                clearInterval(checkHeader);
                
                const analysisBtn = document.createElement('button');
                analysisBtn.className = 'btn-analysis';
                analysisBtn.innerHTML = '📊 Predictive Analysis';
                analysisBtn.onclick = showGroupAnalysis;
                
                dashboardControls.appendChild(analysisBtn);
            }
        }, 1000);
    }
    
    /**
     * Show group analysis modal
     */
    async function showGroupAnalysis() {
        const clients = await window.dashboardManager.getRelevantClients();
        const analysis = await window.trackerPredictiveEngine.analyzeGroupPatterns(clients);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay group-analysis-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header">
                    <h2>🔮 Predictive Analysis - ${window.dashboardManager.currentView === 'myClients' ? 'My Clients' : 'All Clients'}</h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="analysis-content">
                    <!-- Overview Metrics -->
                    <div class="metrics-overview">
                        <div class="metric-box">
                            <div class="metric-icon">📊</div>
                            <div class="metric-data">
                                <div class="metric-value">${analysis.averageCompletion}%</div>
                                <div class="metric-label">Average Completion</div>
                            </div>
                        </div>
                        
                        <div class="metric-box risk">
                            <div class="metric-icon">⚠️</div>
                            <div class="metric-data">
                                <div class="metric-value">${analysis.riskClients.length}</div>
                                <div class="metric-label">At Risk Clients</div>
                            </div>
                        </div>
                        
                        <div class="metric-box success">
                            <div class="metric-icon">🌟</div>
                            <div class="metric-data">
                                <div class="metric-value">${analysis.strongPerformers.length}</div>
                                <div class="metric-label">On Track</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Risk Clients -->
                    ${analysis.riskClients.length > 0 ? `
                        <div class="risk-clients-section">
                            <h3>🚨 Clients Requiring Immediate Attention</h3>
                            <div class="risk-clients-grid">
                                ${analysis.riskClients
                                    .sort((a, b) => a.priority - b.priority)
                                    .map(({ client, prediction }) => `
                                        <div class="risk-client-card priority-${prediction.riskLevel}">
                                            <div class="client-name">${client.initials} - ${client.houseId}</div>
                                            <div class="risk-details">
                                                <span class="current">Current: ${prediction.current}%</span>
                                                <span class="arrow">→</span>
                                                <span class="predicted">Predicted: ${prediction.predicted}%</span>
                                            </div>
                                            <div class="risk-action">
                                                ${prediction.recommendations[0]?.action || 'Review tracker'}
                                            </div>
                                        </div>
                                    `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Common Gaps -->
                    ${Object.keys(analysis.commonGaps).length > 0 ? `
                        <div class="common-gaps-section">
                            <h3>📌 Common Missing Items</h3>
                            <div class="gaps-chart">
                                ${Object.values(analysis.commonGaps).map(gap => `
                                    <div class="gap-item">
                                        <div class="gap-label">${gap.item.label}</div>
                                        <div class="gap-bar">
                                            <div class="gap-fill" style="width: ${gap.percentage}%"></div>
                                            <span class="gap-percent">${gap.percentage}% missing</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Group Insights -->
                    <div class="group-insights">
                        <h3>💡 Key Insights</h3>
                        ${analysis.insights.map(insight => `
                            <div class="group-insight ${insight.type}">
                                ${getInsightIcon(insight.type)} ${insight.message}
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="exportPredictiveReport()">
                        📊 Export Report
                    </button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    // Export functions
    window.printPrediction = function(clientId) {
        window.print();
    };
    
    window.exportPredictiveReport = function() {
        console.log('Export predictive report');
        // Would implement CSV/PDF export
    };
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();
