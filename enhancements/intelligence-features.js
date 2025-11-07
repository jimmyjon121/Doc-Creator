/**
 * Intelligence Features Integration
 * Integrates Predictive Engine, Morning Review, and Heat Map into dashboard
 */

(function() {
    'use strict';
    
    let initialized = false;
    
    async function initializeIntelligenceFeatures() {
        if (initialized) return;
        
        // Wait for required managers with timeout
        let attempts = 0;
        const maxAttempts = 50; // 5 seconds max wait
        
        while (attempts < maxAttempts) {
            if (window.dashboardManager && window.trackerEngine && window.clientManager) {
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (!window.dashboardManager || !window.trackerEngine || !window.clientManager) {
            console.warn('Intelligence features: Required managers not available');
            return;
        }
        
        try {
            // Initialize predictive engine
            if (window.predictiveCompletionEngine) {
                await window.predictiveCompletionEngine.initialize();
                console.log('✓ Predictive Completion Engine initialized');
            }
            
            // Add morning review widget to dashboard
            addMorningReviewWidget();
            
            // Add heat map toggle
            addHeatMapToggle();
            
            // Add prediction cards to client cards
            enhanceClientCardsWithPredictions();
            
            initialized = true;
            console.log('✓ Intelligence features initialized');
        } catch (error) {
            console.error('Error initializing intelligence features:', error);
        }
    }
    
    /**
     * Add morning review widget
     */
    function addMorningReviewWidget() {
        // Try multiple selectors for dashboard
        const dashboardSelectors = [
            '.dashboard-content',
            '#dashboardContent',
            '.dashboard-main',
            '[id*="dashboard"]',
            '.main-content'
        ];
        
        let dashboard = null;
        for (const selector of dashboardSelectors) {
            dashboard = document.querySelector(selector);
            if (dashboard) break;
        }
        
        if (!dashboard) {
            console.warn('Morning Review: Dashboard container not found');
            // Try again after a delay
            setTimeout(addMorningReviewWidget, 1000);
            return;
        }
        
        // Check if container already exists
        let container = dashboard.querySelector('.morning-review-container, [data-widget="morning-review"]');
        
        if (!container) {
            container = document.createElement('div');
            container.className = 'morning-review-container';
            container.setAttribute('data-widget', 'morning-review');
            
            // Insert at top of dashboard
            dashboard.insertBefore(container, dashboard.firstChild);
        }
        
        // Render morning review
        renderMorningReview();
    }
    
    /**
     * Render morning review
     */
    async function renderMorningReview() {
        const container = document.querySelector('.morning-review-container, [data-widget="morning-review"]');
        if (!container) {
            console.warn('Morning Review: Container not found');
            return;
        }
        
        if (!window.morningReviewDashboard) {
            console.warn('Morning Review: Dashboard class not available');
            // Try again after a delay
            setTimeout(renderMorningReview, 500);
            return;
        }
        
        try {
            container.innerHTML = '<div style="padding: 20px; text-align: center; color: #6b7280;">Loading morning review...</div>';
            const html = await window.morningReviewDashboard.renderMorningReview();
            container.innerHTML = html;
            console.log('✓ Morning Review rendered');
        } catch (error) {
            console.error('Error rendering morning review:', error);
            container.innerHTML = `<div style="padding: 20px; color: #ef4444;">Error loading morning review: ${error.message}</div>`;
        }
    }
    
    /**
     * Add heat map toggle button
     */
    function addHeatMapToggle() {
        // Try multiple selectors for controls
        const controlSelectors = [
            '.dashboard-controls',
            '.view-toggle',
            '.dashboard-header',
            '.header-controls',
            '[class*="control"]'
        ];
        
        let controls = null;
        for (const selector of controlSelectors) {
            controls = document.querySelector(selector);
            if (controls) break;
        }
        
        if (!controls) {
            // Create controls if they don't exist
            const header = document.querySelector('.dashboard-header, [class*="header"]');
            if (header) {
                controls = document.createElement('div');
                controls.className = 'intelligence-controls';
                header.appendChild(controls);
            } else {
                console.warn('Heat Map: Controls container not found');
                setTimeout(addHeatMapToggle, 1000);
                return;
            }
        }
        
        if (!document.querySelector('.heat-map-toggle')) {
            const toggle = document.createElement('button');
            toggle.className = 'heat-map-toggle btn-action';
            toggle.style.cssText = 'margin-left: 8px; padding: 8px 16px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;';
            toggle.innerHTML = '🔥 Heat Map';
            toggle.onclick = toggleHeatMap;
            controls.appendChild(toggle);
            console.log('✓ Heat Map toggle added');
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
    
    // Initialize when ready - multiple attempts
    function startInitialization() {
        initializeIntelligenceFeatures();
        
        // Also try after dashboard loads
        setTimeout(() => {
            if (!initialized) {
                initializeIntelligenceFeatures();
            }
        }, 2000);
        
        // And after a longer delay
        setTimeout(() => {
            if (!initialized) {
                initializeIntelligenceFeatures();
            }
        }, 5000);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startInitialization);
    } else {
        startInitialization();
    }
    
    // Re-render morning review on dashboard refresh
    const checkForDashboardManager = setInterval(() => {
        if (window.dashboardManager) {
            clearInterval(checkForDashboardManager);
            const originalRefresh = window.dashboardManager.refreshDashboard;
            window.dashboardManager.refreshDashboard = async function() {
                await originalRefresh.call(this);
                setTimeout(renderMorningReview, 500);
            };
        }
    }, 500);
    
    // Make functions globally available for manual triggering
    window.showMorningReview = renderMorningReview;
    window.showHeatMap = toggleHeatMap;
})();
