/**
 * Intelligence Features Integration
 * Integrates Predictive Engine, Morning Review, and Heat Map into dashboard
 */

(function() {
    'use strict';
    
    async function initializeIntelligenceFeatures() {
        // Wait for required managers
        if (!window.dashboardManager || !window.trackerEngine || !window.clientManager) {
            setTimeout(initializeIntelligenceFeatures, 100);
            return;
        }
        
        // Initialize predictive engine
        if (window.predictiveCompletionEngine) {
            await window.predictiveCompletionEngine.initialize();
        }
        
        // Add morning review widget to dashboard
        addMorningReviewWidget();
        
        // Add heat map toggle
        addHeatMapToggle();
        
        // Add prediction cards to client cards
        enhanceClientCardsWithPredictions();
    }
    
    /**
     * Add morning review widget
     */
    function addMorningReviewWidget() {
        // Check if morning review container exists
        const container = document.querySelector('[data-widget="morning-review"], .morning-review-container');
        if (!container && window.dashboardWidgets) {
            // Create container in dashboard
            const dashboard = document.querySelector('.dashboard-content, #dashboardContent');
            if (dashboard) {
                const morningContainer = document.createElement('div');
                morningContainer.className = 'morning-review-container';
                morningContainer.setAttribute('data-widget', 'morning-review');
                
                // Insert at top of dashboard
                dashboard.insertBefore(morningContainer, dashboard.firstChild);
                
                // Render morning review
                renderMorningReview();
            }
        } else if (container) {
            renderMorningReview();
        }
    }
    
    /**
     * Render morning review
     */
    async function renderMorningReview() {
        const container = document.querySelector('.morning-review-container, [data-widget="morning-review"]');
        if (!container || !window.morningReviewDashboard) return;
        
        try {
            const html = await window.morningReviewDashboard.renderMorningReview();
            container.innerHTML = html;
        } catch (error) {
            console.error('Error rendering morning review:', error);
        }
    }
    
    /**
     * Add heat map toggle button
     */
    function addHeatMapToggle() {
        // Add button to dashboard controls
        const controls = document.querySelector('.dashboard-controls, .view-toggle');
        if (controls && !document.querySelector('.heat-map-toggle')) {
            const toggle = document.createElement('button');
            toggle.className = 'heat-map-toggle btn-action';
            toggle.innerHTML = '🔥 Heat Map';
            toggle.onclick = toggleHeatMap;
            controls.appendChild(toggle);
        }
    }
    
    /**
     * Toggle heat map view
     */
    async function toggleHeatMap() {
        const container = document.getElementById('heat-map-container');
        if (!container) {
            // Create container
            const dashboard = document.querySelector('.dashboard-content, #dashboardContent');
            if (dashboard && window.heatMapVisualization) {
                const heatMapContainer = document.createElement('div');
                heatMapContainer.id = 'heat-map-container';
                heatMapContainer.className = 'heat-map-container';
                dashboard.appendChild(heatMapContainer);
                
                // Render heat map
                await window.heatMapVisualization.renderHeatMap('items', 'heat-map-container');
            }
        } else {
            // Toggle visibility
            container.style.display = container.style.display === 'none' ? 'block' : 'none';
            
            // If showing, render
            if (container.style.display !== 'none' && window.heatMapVisualization) {
                await window.heatMapVisualization.renderHeatMap('items', 'heat-map-container');
            }
        }
    }
    
    /**
     * Enhance client cards with predictions
     */
    function enhanceClientCardsWithPredictions() {
        // Override client card rendering if possible
        if (window.dashboardWidgets && window.dashboardWidgets.renderClientCard) {
            const originalRender = window.dashboardWidgets.renderClientCard;
            
            window.dashboardWidgets.renderClientCard = async function(client) {
                const cardHtml = originalRender.call(this, client);
                
                // Add prediction if available
                if (window.predictiveCompletionEngine && client.dischargeDate) {
                    const prediction = window.predictiveCompletionEngine.predictCompletionAtDischarge(client);
                    
                    if (prediction && prediction.predictedCompletion < 95) {
                        const predictionHtml = `
                            <div class="prediction-badge ${prediction.riskLevel}">
                                <span class="prediction-icon">📊</span>
                                <span class="prediction-text">${prediction.predictedCompletion}% at discharge</span>
                            </div>
                        `;
                        
                        // Insert before closing card div
                        return cardHtml.replace('</div>\n        </div>', predictionHtml + '</div>\n        </div>');
                    }
                }
                
                return cardHtml;
            };
        }
    }
    
    // Initialize when ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeIntelligenceFeatures);
    } else {
        initializeIntelligenceFeatures();
    }
    
    // Re-render morning review on dashboard refresh
    if (window.dashboardManager) {
        const originalRefresh = window.dashboardManager.refreshDashboard;
        window.dashboardManager.refreshDashboard = async function() {
            await originalRefresh.call(this);
            setTimeout(renderMorningReview, 500);
        };
    }
})();
