/**
 * Empty States and Error Handling Enhancement
 * Adds contextual empty states, loading indicators, and error recovery
 */

(function() {
    'use strict';
    
    // Loading state manager
    window.loadingManager = {
        activeLoaders: new Set(),
        
        show(id, message = 'Loading...') {
            this.activeLoaders.add(id);
            
            // Find container element
            const element = document.getElementById(id) || document.querySelector(`[data-widget="${id}"]`);
            if (!element) return;
            
            // Store original content
            if (!element.dataset.originalContent) {
                element.dataset.originalContent = element.innerHTML;
            }
            
            // Show loading state
            element.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p class="loading-message">${message}</p>
                </div>
            `;
            
            element.classList.add('is-loading');
        },
        
        hide(id) {
            this.activeLoaders.delete(id);
            
            const element = document.getElementById(id) || document.querySelector(`[data-widget="${id}"]`);
            if (!element) return;
            
            // Restore original content if available
            if (element.dataset.originalContent) {
                element.innerHTML = element.dataset.originalContent;
                delete element.dataset.originalContent;
            }
            
            element.classList.remove('is-loading');
        },
        
        isLoading(id) {
            return this.activeLoaders.has(id);
        }
    };
    
    // Empty state configurations
    const emptyStateConfigs = {
        flightPlan: {
            title: 'All Clear!',
            message: 'No urgent tasks at the moment. Great job staying on top of everything!',
            icon: '✅',
            action: {
                text: 'View All Clients',
                handler: () => window.dashboardManager?.setView('allClients')
            }
        },
        missions: {
            title: 'Mission Complete!',
            message: 'All tasks for today have been completed. Take a moment to review tomorrow\'s schedule.',
            icon: '🎯',
            action: {
                text: 'Morning Review',
                handler: () => window.morningReview?.show()
            }
        },
        journeyRadar: {
            title: 'No Active Clients',
            message: 'There are no active clients to display. Add a new client to get started.',
            icon: '👥',
            action: {
                text: 'Add Client',
                handler: () => window.showAddClientModal?.()
            }
        },
        houseWeather: {
            title: 'No House Data',
            message: 'House weather information will appear here once clients are assigned to houses.',
            icon: '🏠'
        },
        default: {
            title: 'No Data Available',
            message: 'This section will populate once relevant data is available.',
            icon: 'ℹ️'
        }
    };
    
    // Error recovery strategies
    const errorRecovery = {
        async retry(fn, maxAttempts = 3, delay = 1000) {
            let lastError;
            
            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await fn();
                } catch (error) {
                    lastError = error;
                    console.warn(`Attempt ${attempt} failed:`, error);
                    
                    if (attempt < maxAttempts) {
                        await new Promise(resolve => setTimeout(resolve, delay * attempt));
                    }
                }
            }
            
            throw lastError;
        },
        
        handleError(widgetName, error, container) {
            console.error(`Error in ${widgetName}:`, error);
            
            const errorConfig = {
                title: 'Something went wrong',
                message: error.message || 'An unexpected error occurred',
                icon: '⚠️',
                actions: [
                    {
                        text: 'Retry',
                        handler: () => window.dashboardManager?.refreshDashboard()
                    }
                ]
            };
            
            if (container) {
                container.innerHTML = this.renderErrorState(errorConfig);
            }
            
            // Report to error tracking if available
            if (window.errorTracker) {
                window.errorTracker.report(error, { widget: widgetName });
            }
        },
        
        renderErrorState(config) {
            return `
                <div class="error-state">
                    <div class="error-icon">${config.icon}</div>
                    <h3 class="error-title">${config.title}</h3>
                    <p class="error-message">${config.message}</p>
                    ${config.actions ? `
                        <div class="error-actions">
                            ${config.actions.map(action => `
                                <button class="btn btn-primary" onclick="(${action.handler})()">
                                    ${action.text}
                                </button>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }
    };
    
    // Enhance widget rendering with empty states
    function enhanceWidgets() {
        if (!window.dashboardWidgets?.widgets) return;
        
        // Enhance each widget
        window.dashboardWidgets.widgets.forEach((widget, name) => {
            const originalRender = widget.render;
            if (!originalRender) return;
            
            widget.render = function() {
                const container = this.container;
                let widgetName = name;
                
                try {
                    // Show loading state
                    if (container) {
                        window.loadingManager.show(container.id || widgetName, `Loading ${widgetName}...`);
                    }
                    
                    // Call original render
                    let content = originalRender.call(this);
                    
                    // Check if content is empty or indicates no data
                    const isEmptyContent = !content || 
                        content.trim() === '' || 
                        content.includes('No data') ||
                        content.includes('no items') ||
                        (content.match(/<div/g) || []).length <= 2; // Just wrapper divs
                    
                    if (isEmptyContent) {
                        const config = emptyStateConfigs[widgetName] || emptyStateConfigs.default;
                        content = renderEmptyState(config);
                    }
                    
                    // Hide loading state
                    if (container) {
                        window.loadingManager.hide(container.id || widgetName);
                    }
                    
                    return content;
                    
                } catch (error) {
                    // Hide loading state
                    if (container) {
                        window.loadingManager.hide(container.id || widgetName);
                    }
                    
                    // Handle error
                    errorRecovery.handleError(widgetName, error, container);
                    return errorRecovery.renderErrorState({
                        title: 'Widget Error',
                        message: `Failed to load ${widgetName}`,
                        icon: '❌',
                        actions: [{
                            text: 'Retry',
                            handler: () => this.refresh?.()
                        }]
                    });
                }
            };
            
            // Add retry capability
            if (!widget.retry) {
                widget.retry = async function() {
                    try {
                        await errorRecovery.retry(() => {
                            if (this.container) {
                                this.container.innerHTML = this.render();
                            }
                        });
                    } catch (error) {
                        errorRecovery.handleError(name, error, this.container);
                    }
                };
            }
        });
    }
    
    // Render empty state
    function renderEmptyState(config) {
        return `
            <div class="empty-state">
                <div class="empty-icon">${config.icon}</div>
                <h3 class="empty-title">${config.title}</h3>
                <p class="empty-message">${config.message}</p>
                ${config.action ? `
                    <button class="btn btn-primary empty-action" onclick="(${config.action.handler})()">
                        ${config.action.text}
                    </button>
                ` : ''}
            </div>
        `;
    }
    
    // Enhance data loading functions
    function enhanceDataLoading() {
        // Enhance clientManager
        if (window.clientManager) {
            const originalGetAllClients = window.clientManager.getAllClients;
            window.clientManager.getAllClients = async function() {
                return errorRecovery.retry(async () => {
                    const result = await originalGetAllClients.call(this);
                    if (!result) throw new Error('Failed to load clients');
                    return result;
                });
            };
        }
        
        // Enhance dashboard data loading
        if (window.dashboardManager) {
            const originalLoadDashboardData = window.dashboardManager.loadDashboardData;
            window.dashboardManager.loadDashboardData = async function() {
                const widgetContainer = document.querySelector('.dashboard-grid');
                if (widgetContainer) {
                    widgetContainer.classList.add('loading');
                }
                
                try {
                    const result = await errorRecovery.retry(() => 
                        originalLoadDashboardData.call(this)
                    );
                    
                    if (widgetContainer) {
                        widgetContainer.classList.remove('loading');
                    }
                    
                    return result;
                } catch (error) {
                    if (widgetContainer) {
                        widgetContainer.classList.remove('loading');
                    }
                    
                    // Show error notification
                    window.showNotification(
                        'Failed to load dashboard data. Please refresh the page.',
                        'error',
                        'Dashboard Error'
                    );
                    
                    throw error;
                }
            };
        }
    }
    
    // Add contextual help
    window.contextualHelp = {
        show(context) {
            const helpTexts = {
                'empty-flight-plan': 'The Daily Flight Plan shows urgent tasks that need attention. When it\'s empty, all critical items are handled!',
                'empty-missions': 'Today\'s Missions tracks your daily goals. Complete all missions to maintain excellent care standards.',
                'loading-error': 'If loading issues persist, try refreshing the page or clearing your browser cache.',
                'no-clients': 'Add your first client to start tracking their aftercare journey.'
            };
            
            const text = helpTexts[context] || 'Need help? Contact support for assistance.';
            
            window.showNotification(text, 'info', 'Tip', 5000);
        }
    };
    
    // Add loading states CSS
    if (!document.querySelector('#empty-states-errors-styles')) {
        const styles = document.createElement('style');
        styles.id = 'empty-states-errors-styles';
        styles.textContent = `
            /* Loading States */
            .loading-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                padding: 40px;
                text-align: center;
            }
            
            .loading-spinner {
                width: 48px;
                height: 48px;
                border: 4px solid rgba(0, 0, 0, 0.1);
                border-top-color: var(--ccp-primary-500);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 16px;
            }
            
            .loading-message {
                color: #6b7280;
                font-size: 14px;
                margin: 0;
            }
            
            .is-loading {
                position: relative;
                pointer-events: none;
                opacity: 0.8;
            }
            
            .dashboard-grid.loading {
                opacity: 0.7;
                pointer-events: none;
            }
            
            /* Empty States */
            .empty-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                padding: 40px 20px;
                text-align: center;
                animation: fadeIn 0.3s ease;
            }
            
            .empty-icon {
                font-size: 64px;
                margin-bottom: 16px;
                opacity: 0.7;
            }
            
            .empty-title {
                margin: 0 0 8px 0;
                font-size: 20px;
                font-weight: 600;
                color: #1f2937;
            }
            
            .empty-message {
                margin: 0 0 24px 0;
                color: #6b7280;
                font-size: 14px;
                max-width: 300px;
                line-height: 1.5;
            }
            
            .empty-action {
                margin-top: 8px;
            }
            
            /* Error States */
            .error-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 200px;
                padding: 40px 20px;
                text-align: center;
                background: #fef2f2;
                border-radius: 8px;
                margin: 16px;
            }
            
            .error-icon {
                font-size: 48px;
                margin-bottom: 16px;
                color: #ef4444;
            }
            
            .error-title {
                margin: 0 0 8px 0;
                font-size: 18px;
                font-weight: 600;
                color: #991b1b;
            }
            
            .error-message {
                margin: 0 0 16px 0;
                color: #7f1d1d;
                font-size: 14px;
            }
            
            .error-actions {
                display: flex;
                gap: 12px;
                margin-top: 8px;
            }
            
            /* Animations */
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* Skeleton Loading */
            .skeleton {
                background: linear-gradient(
                    90deg,
                    #f3f4f6 25%,
                    #e5e7eb 50%,
                    #f3f4f6 75%
                );
                background-size: 200% 100%;
                animation: skeleton 1.5s infinite;
                border-radius: 4px;
            }
            
            .skeleton-text {
                height: 16px;
                margin-bottom: 8px;
            }
            
            .skeleton-title {
                height: 24px;
                width: 60%;
                margin-bottom: 16px;
            }
            
            @keyframes skeleton {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
            }
            
            /* Help Tooltips */
            .help-tip {
                position: absolute;
                top: 8px;
                right: 8px;
                width: 20px;
                height: 20px;
                background: #e5e7eb;
                border-radius: 50%;
                cursor: help;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: #6b7280;
                transition: all 0.2s;
            }
            
            .help-tip:hover {
                background: #d1d5db;
                color: #374151;
            }
            
            /* Contextual Empty States */
            .zone-red .empty-state .empty-icon {
                color: #ef4444;
            }
            
            .zone-purple .empty-state .empty-icon {
                color: #a855f7;
            }
            
            .zone-yellow .empty-state .empty-icon {
                color: #eab308;
            }
            
            .zone-green .empty-state .empty-icon {
                color: #22c55e;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Initialize enhancements
    function initialize() {
        enhanceWidgets();
        enhanceDataLoading();
        
        console.log('✅ Empty states and error handling initialized');
    }
    
    // Wait for dependencies
    if (window.dashboardWidgets && window.clientManager) {
        initialize();
    } else {
        const checkInterval = setInterval(() => {
            if (window.dashboardWidgets && window.clientManager) {
                clearInterval(checkInterval);
                initialize();
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
})();
