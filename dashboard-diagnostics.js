(function(window, document) {
    const OVERLAY_ID = "dashboard-diagnostics-overlay";
    const OVERLAY_STYLES = `
        #${"dashboard-diagnostics-overlay"} {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(17, 24, 39, 0.55);
            backdrop-filter: blur(4px);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-panel {
            width: min(760px, 92vw);
            max-height: 90vh;
            overflow-y: auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.45);
            padding: 24px 28px;
            font-family: 'Segoe UI', system-ui, sans-serif;
            color: #111827;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-panel h2 {
            margin: 0 0 16px 0;
            font-size: 22px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-panel h2 .status-dot {
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-grid {
            display: grid;
            gap: 16px;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            margin-bottom: 16px;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-card {
            background: #f9fafb;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
            padding: 16px;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-card h3 {
            margin: 0 0 10px 0;
            font-size: 15px;
            color: #374151;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-list {
            margin: 0;
            padding: 0;
            list-style: none;
            font-size: 13px;
            line-height: 1.5;
            color: #4b5563;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-list li strong {
            color: #1f2937;
            font-weight: 600;
        }
        #${"dashboard-diagnostics-overlay"} .diagnostic-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 16px;
            font-size: 12px;
            color: #6b7280;
        }
        #${"dashboard-diagnostics-overlay"} .close-btn {
            background: #111827;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 16px;
            cursor: pointer;
            font-weight: 600;
        }
        #${"dashboard-diagnostics-overlay"} .close-btn:hover {
            background: #1f2937;
        }
        #${"dashboard-diagnostics-overlay"} pre {
            background: #0f172a;
            color: #f8fafc;
            padding: 12px;
            border-radius: 8px;
            font-size: 12px;
            overflow-x: auto;
        }
    `;

    class DashboardDiagnostics {
        static collect() {
            const manager = window.dashboardManager;
            const widgets = window.dashboardWidgets;
            const tabNav = document.querySelector('.tab-navigation');
            const dashboardTab = document.getElementById('dashboardTab');
            const currentActiveTab = document.querySelector('.tab-content.active');
            const scriptTags = Array.from(document.querySelectorAll('script[src]'));
            const resourceTimings = performance.getEntriesByType('resource')
                .filter(entry => entry.name.includes('dashboard'));

            const report = {
                timestamp: new Date().toISOString(),
                scripts: {
                    managerTagPresent: scriptTags.some(tag => tag.src.includes('dashboard-manager')),
                    widgetsTagPresent: scriptTags.some(tag => tag.src.includes('dashboard-widgets')),
                    diagnosticsTagPresent: scriptTags.some(tag => tag.src.includes('dashboard-diagnostics')),
                    loadMetrics: resourceTimings.map(entry => ({
                        name: entry.name,
                        duration: entry.duration.toFixed(2),
                        initiatorType: entry.initiatorType
                    }))
                },
                globals: {
                    hasManager: typeof manager !== 'undefined' && manager !== null,
                    hasWidgets: typeof widgets !== 'undefined' && widgets !== null,
                    managerInitialized: !!manager?.initialized,
                    widgetsRegistered: manager ? manager.widgets.size : 0
                },
                dom: {
                    tabNavigationPresent: !!tabNav,
                    dashboardTabPresent: !!dashboardTab,
                    activeTabId: currentActiveTab?.id || 'none',
                    houseNavigationPresent: !!document.querySelector('.house-navigation')
                },
                managerState: manager ? {
                    initialized: manager.initialized,
                    currentView: manager.currentView,
                    lastUpdate: manager.lastUpdate,
                    cacheAgeMs: manager.cache?.lastCacheTime ? Date.now() - manager.cache.lastCacheTime : null,
                    cacheKeys: manager.cache ? Object.keys(manager.cache) : []
                } : null,
                widgetState: widgets ? {
                    widgetCount: widgets.widgets?.size || 0,
                    widgetIds: widgets.widgets ? Array.from(widgets.widgets.keys()) : []
                } : null,
                recommendations: [],
                warnings: []
            };

            if (!report.scripts.managerTagPresent || !report.scripts.widgetsTagPresent) {
                report.warnings.push('Dashboard scripts are not referenced in the DOM.');
            }

            if (!report.globals.hasManager) {
                report.warnings.push('window.dashboardManager is undefined.');
            } else {
                if (!report.globals.managerInitialized) {
                    report.recommendations.push('Dashboard manager not initialized yet. Try calling initializeDashboard().');
                }
            }

            if (!report.globals.hasWidgets) {
                report.warnings.push('window.dashboardWidgets is undefined.');
            }

            if (!report.dom.tabNavigationPresent) {
                report.warnings.push('Tab navigation element not found.');
            }

            if (report.dom.activeTabId !== 'dashboardTab') {
                report.recommendations.push('Dashboard tab is not active. Call switchTab("dashboard") to view it.');
            }

            if (manager?.cache && manager.cache.priorities) {
                report.cacheSummary = {
                    red: manager.cache.priorities.red?.length || 0,
                    purple: manager.cache.priorities.purple?.length || 0,
                    yellow: manager.cache.priorities.yellow?.length || 0,
                    green: manager.cache.priorities.green?.length || 0
                };
            }

            return report;
        }

        static run(options = {}) {
            const report = this.collect();
            this.log(report);
            if (options.showModal !== false) {
                this.show(report);
            }
            return report;
        }

        static log(report) {
            console.group('%cCoach Dashboard Diagnostics', 'background: #6366f1; color: white; padding: 4px 8px; border-radius: 4px;');
            console.log('Timestamp:', report.timestamp);
            console.table(report.scripts.loadMetrics);
            console.table(report.globals);
            console.table(report.dom);
            if (report.managerState) console.log('Manager state:', report.managerState);
            if (report.widgetState) console.log('Widget state:', report.widgetState);
            if (report.cacheSummary) console.log('Priority cache summary:', report.cacheSummary);
            if (report.warnings.length) console.warn('Warnings:', report.warnings);
            if (report.recommendations.length) console.info('Recommendations:', report.recommendations);
            console.groupEnd();
        }

        static show(report) {
            this.remove();
            const overlay = document.createElement('div');
            overlay.id = OVERLAY_ID;

            if (!document.getElementById('dashboard-diagnostics-style')) {
                const style = document.createElement('style');
                style.id = 'dashboard-diagnostics-style';
                style.textContent = OVERLAY_STYLES;
                document.head.appendChild(style);
            }

            const jsonPreview = JSON.stringify(report, null, 2);
            const statusColor = report.warnings.length ? '#f97316' : '#10b981';

            overlay.innerHTML = `
                <div class="diagnostic-panel">
                    <h2>
                        <span class="status-dot" style="background: ${statusColor}"></span>
                        Dashboard Diagnostics
                    </h2>
                    <div class="diagnostic-grid">
                        <div class="diagnostic-card">
                            <h3>Scripts</h3>
                            <ul class="diagnostic-list">
                                <li><strong>Manager script:</strong> ${report.scripts.managerTagPresent ? '✅' : '⚠️'}</li>
                                <li><strong>Widgets script:</strong> ${report.scripts.widgetsTagPresent ? '✅' : '⚠️'}</li>
                                <li><strong>Diagnostics script:</strong> ${report.scripts.diagnosticsTagPresent ? '✅' : '⚠️'}</li>
                                <li><strong>Resources tracked:</strong> ${report.scripts.loadMetrics.length}</li>
                            </ul>
                        </div>
                        <div class="diagnostic-card">
                            <h3>Globals</h3>
                            <ul class="diagnostic-list">
                                <li><strong>dashboardManager:</strong> ${report.globals.hasManager ? 'Present' : 'Missing'}</li>
                                <li><strong>dashboardWidgets:</strong> ${report.globals.hasWidgets ? 'Present' : 'Missing'}</li>
                                <li><strong>Manager initialized:</strong> ${report.globals.managerInitialized ? 'Yes' : 'No'}</li>
                                <li><strong>Widgets registered:</strong> ${report.globals.widgetsRegistered}</li>
                            </ul>
                        </div>
                        <div class="diagnostic-card">
                            <h3>DOM</h3>
                            <ul class="diagnostic-list">
                                <li><strong>Tab navigation:</strong> ${report.dom.tabNavigationPresent ? 'Found' : 'Missing'}</li>
                                <li><strong>Dashboard tab:</strong> ${report.dom.dashboardTabPresent ? 'Found' : 'Missing'}</li>
                                <li><strong>Active tab:</strong> ${report.dom.activeTabId}</li>
                                <li><strong>House nav:</strong> ${report.dom.houseNavigationPresent ? 'Found' : 'Missing'}</li>
                            </ul>
                        </div>
                        ${report.cacheSummary ? `
                        <div class="diagnostic-card">
                            <h3>Priority Cache</h3>
                            <ul class="diagnostic-list">
                                <li><strong>Red:</strong> ${report.cacheSummary.red}</li>
                                <li><strong>Purple:</strong> ${report.cacheSummary.purple}</li>
                                <li><strong>Yellow:</strong> ${report.cacheSummary.yellow}</li>
                                <li><strong>Green:</strong> ${report.cacheSummary.green}</li>
                            </ul>
                        </div>` : ''}
                    </div>
                    ${report.warnings.length ? `<div class="diagnostic-card" style="border-color: #fef3c7; background: #fffbeb;">
                        <h3>Warnings</h3>
                        <ul class="diagnostic-list">
                            ${report.warnings.map(w => `<li>⚠️ ${w}</li>`).join('')}
                        </ul>
                    </div>` : ''}
                    ${report.recommendations.length ? `<div class="diagnostic-card" style="border-color: #dbeafe; background: #eff6ff;">
                        <h3>Recommendations</h3>
                        <ul class="diagnostic-list">
                            ${report.recommendations.map(r => `<li>💡 ${r}</li>`).join('')}
                        </ul>
                    </div>` : ''}
                    <pre>${jsonPreview}</pre>
                    <div class="diagnostic-footer">
                        <span>Shortcut: Ctrl/Cmd + Shift + D</span>
                        <button class="close-btn" data-action="close">Close</button>
                    </div>
                </div>
            `;

            overlay.querySelector('[data-action="close"]').addEventListener('click', () => this.remove());
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) {
                    this.remove();
                }
            });

            document.body.appendChild(overlay);
        }

        static remove() {
            const existing = document.getElementById(OVERLAY_ID);
            if (existing) existing.remove();
        }
    }

    window.dashboardDiagnostics = DashboardDiagnostics;
    window.runDashboardDiagnostics = () => DashboardDiagnostics.run({ showModal: true });

    document.addEventListener('keydown', (event) => {
        if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'd') {
            event.preventDefault();
            DashboardDiagnostics.run({ showModal: true });
        }
        if (event.key === 'Escape') {
            DashboardDiagnostics.remove();
        }
    });

    window.addEventListener('load', () => {
        if (window.location.hash === '#diag') {
            setTimeout(() => DashboardDiagnostics.run({ showModal: true }), 500);
        }
    });

})(window, document);
