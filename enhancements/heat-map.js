/**
 * Heat Map UI Enhancement
 * Adds heat map visualization button and functionality
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.heatMap || !window.dashboardManager) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        addHeatMapButton();
    }
    
    /**
     * Add heat map button to dashboard
     */
    function addHeatMapButton() {
        // Check every second for dashboard controls
        const checkInterval = setInterval(() => {
            const dashboardControls = document.querySelector('.dashboard-controls');
            if (dashboardControls) {
                clearInterval(checkInterval);
                
                // Check if button already exists
                if (document.querySelector('.btn-heat-map')) return;
                
                // Add the button
                const heatMapBtn = document.createElement('button');
                heatMapBtn.className = 'btn-heat-map';
                heatMapBtn.innerHTML = '🔥 Heat Map';
                heatMapBtn.onclick = () => window.heatMap.renderHeatMap();
                heatMapBtn.title = 'View tracker completion patterns';
                
                // Insert after other buttons
                dashboardControls.appendChild(heatMapBtn);
            }
        }, 1000);
        
        // Stop checking after 30 seconds
        setTimeout(() => clearInterval(checkInterval), 30000);
    }
    
    /**
     * Add keyboard shortcut
     */
    document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + H for Heat Map
        if ((e.ctrlKey || e.metaKey) && e.key === 'h' && !e.shiftKey) {
            e.preventDefault();
            if (window.heatMap) {
                window.heatMap.renderHeatMap();
            }
        }
    });
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();
