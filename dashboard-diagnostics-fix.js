// Dashboard Diagnostics Fix
(function() {
    console.log('🔍 Running Dashboard Diagnostics...');
    
    // Check if dashboard elements exist
    const checks = {
        container: !!document.querySelector('.dashboard-container'),
        dashboardTab: !!document.getElementById('dashboardTab'),
        metricsWidget: !!document.getElementById('metricsWidget'),
        flightPlanWidget: !!document.getElementById('flightPlanWidget'),
        missionsWidget: !!document.getElementById('missionsWidget'),
        houseWeatherWidget: !!document.getElementById('houseWeatherWidget'),
        journeyRadarWidget: !!document.getElementById('journeyRadarWidget'),
        quickActionsWidget: !!document.getElementById('quickActionsWidget')
    };
    
    console.log('Element checks:', checks);
    
    // Check if managers are available
    const managers = {
        dashboardManager: typeof window.dashboardManager !== 'undefined',
        dashboardWidgets: typeof window.dashboardWidgets !== 'undefined',
        clientManager: typeof window.clientManager !== 'undefined',
        housesManager: typeof window.housesManager !== 'undefined',
        milestonesManager: typeof window.milestonesManager !== 'undefined'
    };
    
    console.log('Manager checks:', managers);
    
    // Check if dashboard tab is visible
    const dashboardTab = document.getElementById('dashboardTab');
    if (dashboardTab) {
        const styles = window.getComputedStyle(dashboardTab);
        console.log('Dashboard tab visibility:', {
            display: styles.display,
            visibility: styles.visibility,
            classList: dashboardTab.classList.toString(),
            hasActiveClass: dashboardTab.classList.contains('active')
        });
    }
    
    // Check widget content
    const widgets = document.querySelectorAll('.dashboard-widget');
    console.log(`Found ${widgets.length} widgets`);
    widgets.forEach(widget => {
        console.log(`Widget ${widget.id}:`, {
            hasContent: widget.innerHTML.trim().length > 0,
            innerHTML: widget.innerHTML.substring(0, 100)
        });
    });
    
    // Try to manually initialize if needed
    if (managers.dashboardManager && managers.dashboardWidgets) {
        console.log('Attempting manual dashboard initialization...');
        
        // Force render widgets
        async function forceRenderDashboard() {
            try {
                // Initialize managers if needed
                if (!window.dashboardManager.initialized) {
                    await window.dashboardManager.initialize();
                }
                
                // Initialize widgets
                await window.dashboardWidgets.initialize();
                
                // Load data
                await window.dashboardManager.loadDashboardData();
                
                // Render all widgets
                await window.dashboardWidgets.renderAll();
                
                console.log('✅ Dashboard force rendered successfully');
            } catch (error) {
                console.error('Failed to force render dashboard:', error);
            }
        }
        
        forceRenderDashboard();
    } else {
        console.warn('Dashboard managers not available yet');
    }
    
    // Check CSS styles are loaded
    const testElement = document.createElement('div');
    testElement.className = 'dashboard-widget';
    document.body.appendChild(testElement);
    const computedStyles = window.getComputedStyle(testElement);
    console.log('Dashboard widget CSS check:', {
        background: computedStyles.background,
        borderRadius: computedStyles.borderRadius,
        padding: computedStyles.padding
    });
    document.body.removeChild(testElement);
    
})();
