/**
 * Widget Rendering Optimization Enhancement
 * Implements selective widget updates, virtual scrolling for long lists, debounce search inputs
 */

(function() {
    'use strict';
    
    // Virtual scrolling implementation
    window.VirtualScroll = class {
        constructor(container, items, itemHeight, renderItem) {
            this.container = container;
            this.items = items;
            this.itemHeight = itemHeight;
            this.renderItem = renderItem;
            this.visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
            this.scrollTop = 0;
            
            this.init();
        }
        
        init() {
            this.container.style.overflowY = 'auto';
            this.container.style.height = `${this.visibleCount * this.itemHeight}px`;
            
            this.render();
            
            this.container.addEventListener('scroll', () => {
                this.scrollTop = this.container.scrollTop;
                this.render();
            });
        }
        
        render() {
            const startIndex = Math.floor(this.scrollTop / this.itemHeight);
            const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);
            
            const visibleItems = this.items.slice(startIndex, endIndex);
            
            // Create wrapper
            const wrapper = document.createElement('div');
            wrapper.style.height = `${this.items.length * this.itemHeight}px`;
            wrapper.style.position = 'relative';
            
            // Create visible items
            visibleItems.forEach((item, index) => {
                const itemEl = document.createElement('div');
                itemEl.style.position = 'absolute';
                itemEl.style.top = `${(startIndex + index) * this.itemHeight}px`;
                itemEl.style.height = `${this.itemHeight}px`;
                itemEl.style.width = '100%';
                itemEl.innerHTML = this.renderItem(item, startIndex + index);
                wrapper.appendChild(itemEl);
            });
            
            this.container.innerHTML = '';
            this.container.appendChild(wrapper);
        }
        
        updateItems(newItems) {
            this.items = newItems;
            this.render();
        }
    };
    
    // Selective widget update manager
    window.widgetUpdateManager = {
        updateQueue: new Map(),
        updateTimeouts: new Map(),
        
        /**
         * Schedule a widget update
         * @param {string} widgetName - Name of widget to update
         * @param {Function} updateFn - Function to call for update
         * @param {number} delay - Delay in milliseconds
         */
        scheduleUpdate(widgetName, updateFn, delay = 100) {
            // Cancel existing timeout
            if (this.updateTimeouts.has(widgetName)) {
                clearTimeout(this.updateTimeouts.get(widgetName));
            }
            
            // Store update function
            this.updateQueue.set(widgetName, updateFn);
            
            // Schedule update
            const timeout = setTimeout(() => {
                const fn = this.updateQueue.get(widgetName);
                if (fn) {
                    fn();
                    this.updateQueue.delete(widgetName);
                }
                this.updateTimeouts.delete(widgetName);
            }, delay);
            
            this.updateTimeouts.set(widgetName, timeout);
        },
        
        /**
         * Update specific widget immediately
         */
        updateWidget(widgetName) {
            const fn = this.updateQueue.get(widgetName);
            if (fn) {
                fn();
                this.updateQueue.delete(widgetName);
            }
            
            if (this.updateTimeouts.has(widgetName)) {
                clearTimeout(this.updateTimeouts.get(widgetName));
                this.updateTimeouts.delete(widgetName);
            }
        },
        
        /**
         * Clear all pending updates
         */
        clear() {
            this.updateTimeouts.forEach(timeout => clearTimeout(timeout));
            this.updateTimeouts.clear();
            this.updateQueue.clear();
        }
    };
    
    // Enhance widgets with selective updates
    function enhanceWidgets() {
        if (!window.dashboardWidgets?.widgets) return;
        
        window.dashboardWidgets.widgets.forEach((widget, name) => {
            // Add selective update method
            if (!widget.selectiveUpdate) {
                widget.selectiveUpdate = function(data) {
                    // Only update if data actually changed
                    if (this.lastData && JSON.stringify(this.lastData) === JSON.stringify(data)) {
                        return; // No changes, skip update
                    }
                    
                    this.lastData = data;
                    this.render();
                };
            }
            
            // Add debounced render
            if (!widget.debouncedRender) {
                widget.debouncedRender = window.debounce(function() {
                    this.render();
                }, 300);
            }
        });
    }
    
    // Enhance search inputs with debouncing
    function enhanceSearchInputs() {
        // Find all search inputs
        const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search"]');
        
        searchInputs.forEach(input => {
            // Skip if already enhanced
            if (input.dataset.debounced === 'true') return;
            
            input.dataset.debounced = 'true';
            
            // Add debounced handler
            const originalHandler = input.oninput;
            input.oninput = window.debounce(function(e) {
                if (originalHandler) {
                    originalHandler.call(this, e);
                }
                
                // Fire custom event
                this.dispatchEvent(new CustomEvent('search', {
                    detail: { value: this.value },
                    bubbles: true
                }));
            }, 300);
        });
        
        // Watch for dynamically added inputs
        const observer = new MutationObserver(() => {
            enhanceSearchInputs();
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    // Optimize long lists with virtual scrolling
    function optimizeLongLists() {
        // Find lists that might benefit from virtual scrolling
        const longLists = document.querySelectorAll('.client-list, .alert-list, .document-list');
        
        longLists.forEach(list => {
            if (list.dataset.virtualized === 'true') return;
            if (list.children.length < 50) return; // Only virtualize if 50+ items
            
            const items = Array.from(list.children);
            const itemHeight = items[0]?.offsetHeight || 60;
            
            if (itemHeight > 0) {
                list.dataset.virtualized = 'true';
                
                // Extract item data
                const itemData = items.map(item => ({
                    html: item.innerHTML,
                    data: item.dataset
                }));
                
                // Create virtual scroll
                const virtualScroll = new window.VirtualScroll(
                    list,
                    itemData,
                    itemHeight,
                    (item, index) => item.html
                );
                
                // Store reference
                list.virtualScroll = virtualScroll;
            }
        });
    }
    
    // Optimize dashboard refresh
    function optimizeDashboardRefresh() {
        if (!window.dashboardManager || !window.dashboardManager.refreshDashboard) {
            // Wait for dashboardManager to be ready
            setTimeout(optimizeDashboardRefresh, 200);
            return;
        }
        
        const originalRefreshDashboard = window.dashboardManager.refreshDashboard;
        
        window.dashboardManager.refreshDashboard = function(force = false) {
            if (force) {
                // Force full refresh
                return originalRefreshDashboard.call(this);
            }
            
            // Use selective updates
            if (window.dashboardWidgets?.widgets) {
                window.dashboardWidgets.widgets.forEach((widget, name) => {
                    window.widgetUpdateManager.scheduleUpdate(name, () => {
                        if (widget.refresh) {
                            widget.refresh();
                        } else if (widget.render) {
                            widget.render();
                        }
                    }, 50);
                });
            }
        };
    }
    
    // Add performance monitoring
    window.widgetPerformanceMonitor = {
        timings: new Map(),
        
        start(widgetName) {
            this.timings.set(widgetName, performance.now());
        },
        
        end(widgetName) {
            const start = this.timings.get(widgetName);
            if (start) {
                const duration = performance.now() - start;
                this.timings.delete(widgetName);
                
                // Log slow renders
                if (duration > 100) {
                    console.warn(`Widget "${widgetName}" took ${duration.toFixed(2)}ms to render`);
                }
                
                return duration;
            }
            return null;
        }
    };
    
    // Wrap widget renders with performance monitoring
    function addPerformanceMonitoring() {
        if (!window.dashboardWidgets?.widgets) return;
        
        window.dashboardWidgets.widgets.forEach((widget, name) => {
            const originalRender = widget.render;
            if (originalRender) {
                widget.render = function() {
                    window.widgetPerformanceMonitor.start(name);
                    const result = originalRender.call(this);
                    window.widgetPerformanceMonitor.end(name);
                    return result;
                };
            }
        });
    }
    
    // Initialize optimizations
    function initialize() {
        enhanceWidgets();
        enhanceSearchInputs();
        optimizeDashboardRefresh();
        addPerformanceMonitoring();
        
        // Optimize lists after initial render
        setTimeout(() => {
            optimizeLongLists();
        }, 1000);
        
        // Re-optimize on dashboard refresh
        if (window.eventBus) {
            window.eventBus.on('dashboard:refresh', () => {
                setTimeout(optimizeLongLists, 500);
            });
        }
        
        console.log('✅ Widget rendering optimization initialized');
    }
    
    // Wait for dependencies
    if (window.dashboardWidgets && window.debounce) {
        initialize();
    } else {
        const checkInterval = setInterval(() => {
            if (window.dashboardWidgets && window.debounce) {
                clearInterval(checkInterval);
                initialize();
            }
        }, 100);
        
        setTimeout(() => clearInterval(checkInterval), 10000);
    }
})();
