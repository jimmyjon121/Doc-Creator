// Dashboard Diagnostics Module
// Provides diagnostic tools and monitoring for the dashboard

(function() {
    'use strict';
    
    console.log('📊 Dashboard Diagnostics Module loaded');
    
    // Dashboard diagnostics configuration
    const diagnosticsConfig = {
        enabled: true,
        logLevel: 'info',
        checkInterval: 30000, // 30 seconds
        performanceThreshold: 1000 // milliseconds
    };
    
    // Dashboard health check
    function checkDashboardHealth() {
        const dashboard = document.querySelector('.dashboard-container');
        const widgets = document.querySelectorAll('.dashboard-widget');
        
        const health = {
            dashboardPresent: !!dashboard,
            widgetCount: widgets.length,
            visibility: dashboard ? window.getComputedStyle(dashboard).display !== 'none' : false,
            timestamp: new Date().toISOString()
        };
        
        if (diagnosticsConfig.logLevel === 'debug') {
            console.log('Dashboard Health Check:', health);
        }
        
        return health;
    }
    
    // Performance monitoring
    function monitorPerformance() {
        if (!window.performance) return;
        
        const metrics = {
            loadTime: window.performance.timing.loadEventEnd - window.performance.timing.navigationStart,
            domReady: window.performance.timing.domContentLoadedEventEnd - window.performance.timing.navigationStart,
            resourceCount: window.performance.getEntriesByType('resource').length
        };
        
        if (metrics.loadTime > diagnosticsConfig.performanceThreshold) {
            console.warn(`⚠️ Slow page load detected: ${metrics.loadTime}ms`);
        }
        
        return metrics;
    }
    
    // Error tracking
    function trackErrors() {
        const errors = [];
        
        window.addEventListener('error', function(event) {
            if (event.filename && event.filename.includes('dashboard')) {
                errors.push({
                    message: event.message,
                    source: event.filename,
                    line: event.lineno,
                    column: event.colno,
                    timestamp: new Date().toISOString()
                });
                
                console.error('Dashboard Error:', event.message);
            }
        });
        
        return errors;
    }
    
    // Widget validation
    function validateWidgets() {
        const widgets = document.querySelectorAll('.dashboard-widget');
        const validation = {
            total: widgets.length,
            valid: 0,
            invalid: 0,
            issues: []
        };
        
        widgets.forEach((widget, index) => {
            const hasTitle = widget.querySelector('.widget-title');
            const hasContent = widget.querySelector('.widget-content');
            
            if (hasTitle && hasContent) {
                validation.valid++;
            } else {
                validation.invalid++;
                validation.issues.push({
                    index: index,
                    missingTitle: !hasTitle,
                    missingContent: !hasContent
                });
            }
        });
        
        return validation;
    }
    
    // Initialize diagnostics
    function initializeDiagnostics() {
        if (!diagnosticsConfig.enabled) {
            console.log('Dashboard diagnostics disabled');
            return;
        }
        
        // Initial health check
        setTimeout(() => {
            const health = checkDashboardHealth();
            if (!health.dashboardPresent) {
                console.warn('⚠️ Dashboard container not found during diagnostics initialization');
            }
        }, 2000);
        
        // Set up periodic health checks
        if (diagnosticsConfig.checkInterval > 0) {
            setInterval(() => {
                checkDashboardHealth();
            }, diagnosticsConfig.checkInterval);
        }
        
        // Monitor performance
        if (document.readyState === 'complete') {
            monitorPerformance();
        } else {
            window.addEventListener('load', monitorPerformance);
        }
        
        // Track errors
        trackErrors();
    }
    
    // Export to global scope
    window.dashboardDiagnostics = {
        config: diagnosticsConfig,
        checkHealth: checkDashboardHealth,
        monitorPerformance: monitorPerformance,
        validateWidgets: validateWidgets,
        initialize: initializeDiagnostics
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeDiagnostics);
    } else {
        initializeDiagnostics();
    }
    
})();