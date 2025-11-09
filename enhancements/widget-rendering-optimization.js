/**
 * Widget Rendering Optimization Enhancement
 * Implements selective widget updates, virtual scrolling for long lists, debounce search inputs
 */

(function() {
    'use strict';
    
    // Debounce utility (if not already available)
    if (!window.debounce) {
        window.debounce = function(func, wait, immediate) {
            let timeout;
            return function() {
                const context = this;
                const args = arguments;
                const later = function() {
                    timeout = null;
                    if (!immediate) func.apply(context, args);
                };
                const callNow = immediate && !timeout;
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
                if (callNow) func.apply(context, args);
            };
        };
    }
    
    // Track which widgets need updates
    const widgetUpdateQueue = new Set();
    let updateScheduled = false;
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.dashboardManager || !window.dashboardWidgets) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        optimizeWidgetRendering();
        addVirtualScrolling();
        debounceSearchInputs();
    }
    
    /**
     * Optimize widget rendering with selective updates
     */
    function optimizeWidgetRendering() {
        const originalRefreshDashboard = window.dashboardManager.refreshDashboard;
        
        // Override refreshDashboard to support selective updates
        window.dashboardManager.refreshDashboard = async function(widgetIds = null) {
            try {
                console.log('🔄 Refreshing dashboard' + (widgetIds ? ` (selective: ${widgetIds.join(', ')})` : ' (full)'));
                
                // If specific widgets requested, only update those
                if (widgetIds && Array.isArray(widgetIds)) {
                    for (const widgetId of widgetIds) {
                        const widget = this.widgets.get(widgetId);
                        if (widget && widget.refresh) {
                            await widget.refresh();
                        }
                    }
                    return true;
                }
                
                // Full refresh - invalidate cache
                this.cache.lastCacheTime = 0;
                await this.loadDashboardData();
                
                // Notify all widgets to update
                for (const [widgetId, widget] of this.widgets) {
                    if (widget.refresh) {
                        await widget.refresh();
                    }
                }
                
                console.log('✅ Dashboard refreshed');
                return true;
            } catch (error) {
                console.error('Failed to refresh dashboard:', error);
                return false;
            }
        };
        
        // Add method to queue widget updates
        window.dashboardManager.queueWidgetUpdate = function(widgetId) {
            widgetUpdateQueue.add(widgetId);
            scheduleWidgetUpdates();
        };
        
        // Schedule batched widget updates
        function scheduleWidgetUpdates() {
            if (updateScheduled) return;
            
            updateScheduled = true;
            requestAnimationFrame(() => {
                if (widgetUpdateQueue.size > 0) {
                    const widgetsToUpdate = Array.from(widgetUpdateQueue);
                    widgetUpdateQueue.clear();
                    window.dashboardManager.refreshDashboard(widgetsToUpdate);
                }
                updateScheduled = false;
            });
        }
        
        // Enhance event system to trigger selective updates
        if (window.publish) {
            const originalPublish = window.publish;
            window.publish = function(event, data) {
                originalPublish.call(this, event, data);
                
                // Map events to widgets that need updating
                const eventWidgetMap = {
                    'client:updated': ['flightPlan', 'journeyRadar', 'missions'],
                    'tracker:updated': ['flightPlan', 'compliance'],
                    'document:generated': ['flightPlan', 'documentHub'],
                    'milestone:completed': ['journeyRadar', 'missions']
                };
                
                const widgetsToUpdate = eventWidgetMap[event] || [];
                if (widgetsToUpdate.length > 0) {
                    widgetsToUpdate.forEach(widgetId => {
                        window.dashboardManager.queueWidgetUpdate(widgetId);
                    });
                }
            };
        }
    }
    
    /**
     * Add virtual scrolling for long lists
     */
    function addVirtualScrolling() {
        // Virtual scrolling implementation for long lists
        window.VirtualScroller = class {
            constructor(container, items, itemHeight = 60, renderItem) {
                this.container = container;
                this.items = items;
                this.itemHeight = itemHeight;
                this.renderItem = renderItem;
                this.scrollTop = 0;
                this.containerHeight = container.clientHeight;
                this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + 2; // Buffer
                
                this.init();
            }
            
            init() {
                // Create scroll container
                this.scrollContainer = document.createElement('div');
                this.scrollContainer.className = 'virtual-scroll-container';
                this.scrollContainer.style.height = `${this.containerHeight}px`;
                this.scrollContainer.style.overflowY = 'auto';
                this.scrollContainer.style.position = 'relative';
                
                // Create content spacer
                this.spacer = document.createElement('div');
                this.spacer.style.height = `${this.items.length * this.itemHeight}px`;
                
                // Create visible items container
                this.itemsContainer = document.createElement('div');
                this.itemsContainer.className = 'virtual-items-container';
                this.itemsContainer.style.position = 'absolute';
                this.itemsContainer.style.top = '0';
                this.itemsContainer.style.width = '100%';
                
                this.scrollContainer.appendChild(this.spacer);
                this.scrollContainer.appendChild(this.itemsContainer);
                
                // Replace original container content
                this.container.innerHTML = '';
                this.container.appendChild(this.scrollContainer);
                
                // Add scroll listener
                this.scrollContainer.addEventListener('scroll', () => {
                    this.scrollTop = this.scrollContainer.scrollTop;
                    this.render();
                });
                
                // Initial render
                this.render();
            }
            
            render() {
                const startIndex = Math.floor(this.scrollTop / this.itemHeight);
                const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);
                
                // Update spacer position
                this.itemsContainer.style.top = `${startIndex * this.itemHeight}px`;
                
                // Render visible items
                const visibleItems = this.items.slice(startIndex, endIndex);
                this.itemsContainer.innerHTML = visibleItems.map((item, idx) => {
                    return this.renderItem(item, startIndex + idx);
                }).join('');
            }
            
            updateItems(newItems) {
                this.items = newItems;
                this.spacer.style.height = `${this.items.length * this.itemHeight}px`;
                this.render();
            }
        };
        
        // Enhance widgets that render long lists
        if (window.dashboardWidgets) {
            const originalRenderClient = window.dashboardWidgets.renderClient;
            if (originalRenderClient) {
                // Store original for non-virtual rendering
                window.dashboardWidgets.renderClientOriginal = originalRenderClient;
                
                // Add virtual scrolling option
                window.dashboardWidgets.renderClientList = function(clients, container, useVirtual = false) {
                    if (!useVirtual || clients.length < 20) {
                        // Use regular rendering for small lists
                        container.innerHTML = clients.map(client => originalRenderClient.call(this, client)).join('');
                        return;
                    }
                    
                    // Use virtual scrolling for long lists
                    const itemHeight = 80; // Approximate client card height
                    const renderItem = (client, index) => originalRenderClient.call(this, client);
                    
                    if (!container.virtualScroller) {
                        container.virtualScroller = new window.VirtualScroller(
                            container,
                            clients,
                            itemHeight,
                            renderItem
                        );
                    } else {
                        container.virtualScroller.updateItems(clients);
                    }
                };
            }
        }
    }
    
    /**
     * Debounce search inputs throughout the app
     */
    function debounceSearchInputs() {
        // Find and debounce all search inputs
        function debounceSearchInputsInContainer(container) {
            const searchInputs = container.querySelectorAll('input[type="search"], input[placeholder*="Search" i], input[placeholder*="Filter" i]');
            
            searchInputs.forEach(input => {
                // Skip if already debounced
                if (input.dataset.debounced === 'true') return;
                
                input.dataset.debounced = 'true';
                
                // Get original oninput handler if exists
                const originalHandler = input.oninput;
                
                // Create debounced handler
                const debouncedHandler = window.debounce((e) => {
                    if (originalHandler) {
                        originalHandler.call(input, e);
                    }
                    
                    // Trigger custom event for search
                    const searchEvent = new CustomEvent('search', {
                        detail: { value: e.target.value },
                        bubbles: true
                    });
                    input.dispatchEvent(searchEvent);
                }, 300); // 300ms debounce
                
                // Replace oninput
                input.addEventListener('input', debouncedHandler);
            });
        }
        
        // Debounce existing inputs
        debounceSearchInputsInContainer(document);
        
        // Watch for new inputs added dynamically
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        debounceSearchInputsInContainer(node);
                    }
                });
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        // Enhance client search specifically
        if (window.clientManager) {
            const originalSearchClients = window.clientManager.searchClients;
            if (originalSearchClients) {
                window.clientManager.searchClients = window.debounce(originalSearchClients, 300);
            }
        }
    }
    
    // Add performance monitoring
    function addPerformanceMonitoring() {
        if (window.performance && window.performance.mark) {
            // Mark widget render times
            const originalRender = window.dashboardWidgets?.widgets?.get('flightPlan')?.render;
            if (originalRender) {
                const flightPlanWidget = window.dashboardWidgets.widgets.get('flightPlan');
                flightPlanWidget.render = async function() {
                    window.performance.mark('widget-render-start');
                    await originalRender.call(this);
                    window.performance.mark('widget-render-end');
                    window.performance.measure('widget-render', 'widget-render-start', 'widget-render-end');
                    
                    const measure = window.performance.getEntriesByName('widget-render')[0];
                    if (measure.duration > 100) {
                        console.warn(`Widget render took ${measure.duration.toFixed(2)}ms`);
                    }
                };
            }
        }
    }
    
    // Add styles for virtual scrolling
    if (!document.querySelector('#widget-rendering-optimization-styles')) {
        const styles = document.createElement('style');
        styles.id = 'widget-rendering-optimization-styles';
        styles.textContent = `
            /* Virtual Scrolling */
            .virtual-scroll-container {
                position: relative;
            }
            
            .virtual-items-container {
                will-change: transform;
            }
            
            /* Optimize rendering */
            .dashboard-widget {
                contain: layout style paint;
            }
            
            /* Smooth scrolling */
            .virtual-scroll-container {
                scroll-behavior: smooth;
            }
            
            /* Loading states */
            .widget-updating {
                opacity: 0.7;
                pointer-events: none;
            }
        `;
        document.head.appendChild(styles);
    }
    
    // Initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
    
    // Add performance monitoring after a delay
    setTimeout(addPerformanceMonitoring, 1000);
    
    console.log('✅ Widget rendering optimization initialized');
})();
