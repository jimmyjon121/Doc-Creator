/**
 * Performance Monitoring System for CareConnect Pro
 * Tracks and optimizes application performance
 */

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoad: {},
            filterOperations: [],
            mapOperations: [],
            searchQueries: [],
            documentGeneration: [],
            memoryUsage: []
        };
        
        this.thresholds = {
            pageLoad: 1500,        // 1.5s
            filterUpdate: 50,      // 50ms
            mapRender: 500,        // 500ms
            search: 100,           // 100ms
            memory: 150 * 1024 * 1024  // 150MB
        };
        
        this.init();
    }
    
    /**
     * Initialize performance monitoring
     */
    init() {
        // Monitor page load
        this.monitorPageLoad();
        
        // Monitor memory usage
        this.startMemoryMonitoring();
        
        // Setup performance observer
        this.setupPerformanceObserver();
    }
    
    /**
     * Monitor page load performance
     */
    monitorPageLoad() {
        if (window.performance && window.performance.timing) {
            window.addEventListener('load', () => {
                const timing = window.performance.timing;
                this.metrics.pageLoad = {
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    windowLoad: timing.loadEventEnd - timing.navigationStart,
                    firstPaint: this.getFirstPaint(),
                    resources: this.getResourceTimings()
                };
                
                this.checkThreshold('pageLoad', this.metrics.pageLoad.windowLoad);
            });
        }
    }
    
    /**
     * Get first paint timing
     */
    getFirstPaint() {
        if (window.performance && window.performance.getEntriesByType) {
            const paintEntries = window.performance.getEntriesByType('paint');
            const firstPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            return firstPaint ? firstPaint.startTime : null;
        }
        return null;
    }
    
    /**
     * Get resource timings
     */
    getResourceTimings() {
        if (window.performance && window.performance.getEntriesByType) {
            const resources = window.performance.getEntriesByType('resource');
            return resources.map(resource => ({
                name: resource.name.split('/').pop(),
                duration: resource.duration,
                size: resource.transferSize || 0
            })).sort((a, b) => b.duration - a.duration).slice(0, 10);
        }
        return [];
    }
    
    /**
     * Start memory monitoring
     */
    startMemoryMonitoring() {
        if (performance.memory) {
            setInterval(() => {
                const memory = {
                    timestamp: Date.now(),
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit
                };
                
                this.metrics.memoryUsage.push(memory);
                
                // Keep only last 100 measurements
                if (this.metrics.memoryUsage.length > 100) {
                    this.metrics.memoryUsage.shift();
                }
                
                this.checkThreshold('memory', memory.used);
            }, 5000); // Check every 5 seconds
        }
    }
    
    /**
     * Setup performance observer for long tasks
     */
    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.duration > 50) { // Long task threshold
                            console.warn('Long task detected:', {
                                duration: entry.duration,
                                startTime: entry.startTime,
                                name: entry.name
                            });
                        }
                    }
                });
                
                observer.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Long task observer not supported
            }
        }
    }
    
    /**
     * Measure operation performance
     */
    measure(operation, category = 'general') {
        const startTime = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        return {
            end: () => {
                const duration = performance.now() - startTime;
                const memoryDelta = performance.memory ? 
                    performance.memory.usedJSHeapSize - startMemory : 0;
                
                const metric = {
                    operation,
                    category,
                    duration,
                    memoryDelta,
                    timestamp: Date.now()
                };
                
                // Store metric
                if (!this.metrics[category]) {
                    this.metrics[category] = [];
                }
                this.metrics[category].push(metric);
                
                // Keep only last 100 measurements per category
                if (this.metrics[category].length > 100) {
                    this.metrics[category].shift();
                }
                
                // Check thresholds
                this.checkThreshold(category, duration);
                
                return metric;
            }
        };
    }
    
    /**
     * Check if metric exceeds threshold
     */
    checkThreshold(category, value) {
        const threshold = this.thresholds[category];
        if (threshold && value > threshold) {
            console.warn(`Performance threshold exceeded for ${category}:`, {
                value,
                threshold,
                exceeded: value - threshold
            });
            
            // Trigger performance warning
            this.onThresholdExceeded(category, value, threshold);
        }
    }
    
    /**
     * Handle threshold exceeded
     */
    onThresholdExceeded(category, value, threshold) {
        // Store warning
        if (!this.metrics.warnings) {
            this.metrics.warnings = [];
        }
        
        this.metrics.warnings.push({
            category,
            value,
            threshold,
            timestamp: Date.now()
        });
        
        // Show user notification for critical issues
        if (category === 'memory' && value > threshold * 1.5) {
            this.showPerformanceWarning('High memory usage detected. Consider refreshing the page.');
        }
    }
    
    /**
     * Show performance warning to user
     */
    showPerformanceWarning(message) {
        const warning = document.createElement('div');
        warning.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #fef3c7;
            border: 1px solid #f59e0b;
            color: #92400e;
            padding: 12px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        
        warning.innerHTML = `
            <span>⚠️</span>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" style="
                background: none;
                border: none;
                color: #92400e;
                cursor: pointer;
                font-size: 18px;
                margin-left: 10px;
            ">×</button>
        `;
        
        document.body.appendChild(warning);
        
        // Auto-remove after 10 seconds
        setTimeout(() => warning.remove(), 10000);
    }
    
    /**
     * Get performance summary
     */
    getSummary() {
        const summary = {
            pageLoad: this.metrics.pageLoad,
            averages: {},
            warnings: this.metrics.warnings || [],
            currentMemory: this.getCurrentMemory()
        };
        
        // Calculate averages for each category
        Object.keys(this.metrics).forEach(category => {
            if (Array.isArray(this.metrics[category]) && this.metrics[category].length > 0) {
                const durations = this.metrics[category]
                    .map(m => m.duration)
                    .filter(d => d !== undefined);
                
                if (durations.length > 0) {
                    summary.averages[category] = {
                        avg: durations.reduce((a, b) => a + b, 0) / durations.length,
                        min: Math.min(...durations),
                        max: Math.max(...durations),
                        count: durations.length
                    };
                }
            }
        });
        
        return summary;
    }
    
    /**
     * Get current memory usage
     */
    getCurrentMemory() {
        if (performance.memory) {
            return {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit,
                percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
            };
        }
        return null;
    }
    
    /**
     * Create performance dashboard
     */
    createDashboard() {
        const summary = this.getSummary();
        
        let html = `
            <div id="performanceDashboard" style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                padding: 30px;
                max-width: 700px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 20000;
                display: none;
            ">
                <h2 style="margin-bottom: 20px; color: #1f2937;">Performance Dashboard</h2>
        `;
        
        // Page load metrics
        if (summary.pageLoad.windowLoad) {
            html += `
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; color: #374151; margin-bottom: 10px;">Page Load</h3>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6b7280;">DOM Ready</div>
                            <div style="font-size: 20px; font-weight: 600; color: #1f2937;">
                                ${Math.round(summary.pageLoad.domContentLoaded)}ms
                            </div>
                        </div>
                        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6b7280;">Full Load</div>
                            <div style="font-size: 20px; font-weight: 600; color: #1f2937;">
                                ${Math.round(summary.pageLoad.windowLoad)}ms
                            </div>
                        </div>
                        <div style="background: #f3f4f6; padding: 10px; border-radius: 8px;">
                            <div style="font-size: 12px; color: #6b7280;">First Paint</div>
                            <div style="font-size: 20px; font-weight: 600; color: #1f2937;">
                                ${summary.pageLoad.firstPaint ? Math.round(summary.pageLoad.firstPaint) + 'ms' : 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Operation averages
        if (Object.keys(summary.averages).length > 0) {
            html += `
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; color: #374151; margin-bottom: 10px;">Operation Performance</h3>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <th style="text-align: left; padding: 8px; font-size: 12px; color: #6b7280;">Operation</th>
                                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6b7280;">Avg</th>
                                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6b7280;">Min</th>
                                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6b7280;">Max</th>
                                <th style="text-align: right; padding: 8px; font-size: 12px; color: #6b7280;">Count</th>
                            </tr>
                        </thead>
                        <tbody>
            `;
            
            Object.entries(summary.averages).forEach(([category, stats]) => {
                html += `
                    <tr>
                        <td style="padding: 8px; font-size: 14px;">${category}</td>
                        <td style="padding: 8px; text-align: right; font-size: 14px;">
                            ${Math.round(stats.avg)}ms
                        </td>
                        <td style="padding: 8px; text-align: right; font-size: 14px; color: #10b981;">
                            ${Math.round(stats.min)}ms
                        </td>
                        <td style="padding: 8px; text-align: right; font-size: 14px; color: #ef4444;">
                            ${Math.round(stats.max)}ms
                        </td>
                        <td style="padding: 8px; text-align: right; font-size: 14px;">
                            ${stats.count}
                        </td>
                    </tr>
                `;
            });
            
            html += `
                        </tbody>
                    </table>
                </div>
            `;
        }
        
        // Memory usage
        if (summary.currentMemory) {
            const memoryPercent = Math.round(summary.currentMemory.percentage);
            const memoryColor = memoryPercent > 80 ? '#ef4444' : 
                              memoryPercent > 60 ? '#f59e0b' : '#10b981';
            
            html += `
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; color: #374151; margin-bottom: 10px;">Memory Usage</h3>
                    <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                            <span style="font-size: 14px; color: #6b7280;">Used</span>
                            <span style="font-size: 14px; font-weight: 600;">
                                ${(summary.currentMemory.used / 1024 / 1024).toFixed(1)} MB
                            </span>
                        </div>
                        <div style="width: 100%; height: 8px; background: #e5e7eb; border-radius: 4px; overflow: hidden;">
                            <div style="
                                width: ${memoryPercent}%;
                                height: 100%;
                                background: ${memoryColor};
                                transition: width 0.3s;
                            "></div>
                        </div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 5px;">
                            ${memoryPercent}% of ${(summary.currentMemory.limit / 1024 / 1024).toFixed(0)} MB limit
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Warnings
        if (summary.warnings.length > 0) {
            html += `
                <div style="margin-bottom: 20px;">
                    <h3 style="font-size: 16px; color: #374151; margin-bottom: 10px;">
                        Recent Warnings (${summary.warnings.length})
                    </h3>
                    <div style="max-height: 150px; overflow-y: auto;">
            `;
            
            summary.warnings.slice(-5).reverse().forEach(warning => {
                html += `
                    <div style="
                        background: #fef3c7;
                        border: 1px solid #f59e0b;
                        padding: 10px;
                        border-radius: 6px;
                        margin-bottom: 8px;
                        font-size: 13px;
                    ">
                        <strong>${warning.category}</strong>: 
                        ${Math.round(warning.value)}ms 
                        (threshold: ${warning.threshold}ms)
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += `
                <div style="display: flex; justify-content: space-between;">
                    <button onclick="window.performanceMonitor.exportMetrics()" style="
                        padding: 10px 20px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                        background: white;
                        color: #6b7280;
                        font-weight: 600;
                        cursor: pointer;
                    ">Export Metrics</button>
                    <button onclick="window.performanceMonitor.closeDashboard()" style="
                        padding: 10px 20px;
                        border-radius: 8px;
                        border: none;
                        background: #6366f1;
                        color: white;
                        font-weight: 600;
                        cursor: pointer;
                    ">Close</button>
                </div>
            </div>
        `;
        
        return html;
    }
    
    /**
     * Show performance dashboard
     */
    showDashboard() {
        let dashboard = document.getElementById('performanceDashboard');
        if (!dashboard) {
            document.body.insertAdjacentHTML('beforeend', this.createDashboard());
            dashboard = document.getElementById('performanceDashboard');
        } else {
            dashboard.outerHTML = this.createDashboard();
            dashboard = document.getElementById('performanceDashboard');
        }
        dashboard.style.display = 'block';
    }
    
    /**
     * Close dashboard
     */
    closeDashboard() {
        const dashboard = document.getElementById('performanceDashboard');
        if (dashboard) {
            dashboard.style.display = 'none';
        }
    }
    
    /**
     * Export metrics
     */
    exportMetrics() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            summary: this.getSummary()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-metrics-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.PerformanceMonitor = PerformanceMonitor;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}

