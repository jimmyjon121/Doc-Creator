/**
 * @fileoverview Admin Command Center Dashboard Functions
 * @module admin/AdminCommandCenter
 * @status @canonical
 * 
 * PURPOSE:
 *   Provides the Admin Command Center (ACC) dashboard for clinical leadership.
 *   Displays KPIs, house occupancy, document compliance, authorization tracking,
 *   and data export capabilities.
 * 
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 29072-30059)
 *   Extraction Date: December 2025
 * 
 * DEPENDENCIES:
 *   - window.analyticsExport (optional) - Analytics data generation
 *   - window.analyticsDB (optional) - Analytics database
 *   - window.housesManager - House occupancy data
 *   - window.clientManager - Client data fallback
 *   - window.ccConfig - App configuration
 * 
 * EXPORTS TO WINDOW:
 *   - window.accSwitchTab - Switch between ACC tabs
 *   - window.accRefreshData - Refresh all ACC data
 *   - window.accDateRangeChanged - Handle date range selector
 *   - window.accSelectExportType - Select export type
 *   - window.accDownloadExport - Download analytics export
 *   - window.accCopyToClipboard - Copy export to clipboard
 *   - window.accExportData - Trigger export flow
 *   - window.accShowOverdueDocuments - Navigate to overdue docs
 *   - window.accShowPendingReferrals - Navigate to pending referrals
 *   - window.accShowExpiringAuths - Navigate to expiring authorizations
 *   - window.refreshAdminAnalytics - Alias for accRefreshData
 * 
 * NOTE: Analytics features are optional - ACC gracefully degrades
 * if analyticsExport module is not loaded.
 */

(function() {
    'use strict';
    
    console.log('[AdminCommandCenter] Initializing admin command center...');
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE VARIABLES
    // ═══════════════════════════════════════════════════════════════════════════
    let accSelectedExportType = 'full';
    let accDateRange = '30d';
    let accLastRefresh = null;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value ?? '--';
    }
    
    function setHTML(id, html) {
        const el = document.getElementById(id);
        if (el) el.innerHTML = html;
    }
    
    function safeCall(fn) {
        try { return fn(); } catch (e) { console.warn('ACC error:', e); return null; }
    }
    
    function formatNumber(n) {
        if (n === null || n === undefined) return '--';
        if (typeof n === 'number') return n.toLocaleString();
        return n;
    }
    
    function formatCurrency(n) {
        if (n === null || n === undefined) return '--';
        return '$' + Math.round(n).toLocaleString();
    }
    
    function formatDate(dateStr) {
        if (!dateStr) return '--';
        // Use DateHelpers if available for consistency
        if (window.DateHelpers && window.DateHelpers.formatDateShort) {
            return window.DateHelpers.formatDateShort(dateStr);
        }
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
    }
    
    function getProgramTypeClass(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('rtc') || t.includes('residential')) return 'rtc';
        if (t.includes('tbs') || t.includes('therapeutic')) return 'tbs';
        if (t.includes('wild') || t.includes('outdoor')) return 'wild';
        if (t.includes('iop')) return 'iop';
        if (t.includes('php')) return 'php';
        return 'rtc';
    }
    
    function getProgramTypeLabel(type) {
        const t = (type || '').toLowerCase();
        if (t.includes('rtc') || t.includes('residential')) return 'RTC';
        if (t.includes('tbs') || t.includes('therapeutic')) return 'TBS';
        if (t.includes('wild') || t.includes('outdoor')) return 'WILD';
        if (t.includes('iop')) return 'IOP';
        if (t.includes('php')) return 'PHP';
        return 'RTC';
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // TAB SWITCHING
    // ═══════════════════════════════════════════════════════════════════════════
    window.accSwitchTab = function(tabId, button) {
        // Update tab buttons
        document.querySelectorAll('.acc-tab').forEach(t => t.classList.remove('acc-tab--active'));
        if (button) button.classList.add('acc-tab--active');
        
        // Update panels
        document.querySelectorAll('.acc-panel').forEach(p => p.classList.remove('acc-panel--active'));
        const panel = document.getElementById('accPanel' + tabId.charAt(0).toUpperCase() + tabId.slice(1));
        if (panel) panel.classList.add('acc-panel--active');
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // DATE RANGE CHANGE
    // ═══════════════════════════════════════════════════════════════════════════
    window.accDateRangeChanged = function(select) {
        accDateRange = select.value;
        accRefreshData();
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // MAIN REFRESH FUNCTION
    // ═══════════════════════════════════════════════════════════════════════════
    async function accRefreshData() {
        console.log('🔄 ACC: Refreshing admin command center data...');
        
        if (!window.analyticsExport || !window.analyticsDB) {
            console.warn('ACC: Analytics modules not available — skipping admin analytics refresh');
            return;
        }
        
        try {
            // Fetch all data in parallel
            const [
                summary,
                programs,
                authsByPayer,
                alerts,
                declineReasons,
                health,
                timeToAdmission,
                docCompliance,
                packets,
                journey,
                storeCounts,
                exportHistory
            ] = await Promise.all([
                safeCall(() => window.analyticsExport.generateSummary()),
                safeCall(() => window.analyticsExport.getProgramPerformance()),
                safeCall(() => window.analyticsExport.getAuthorizationsByPayer()),
                safeCall(() => window.analyticsExport.getAlerts()),
                safeCall(() => window.analyticsExport.getDeclineReasons()),
                safeCall(() => window.analyticsExport.getRelationshipHealth()),
                safeCall(() => window.analyticsExport.getTimeToAdmission()),
                safeCall(() => window.analyticsExport.getDocumentCompliance()),
                safeCall(() => window.analyticsExport.getDischargePackets()),
                safeCall(() => window.analyticsExport.getClientJourney()),
                safeCall(() => window.analyticsExport.getStoreCounts()),
                safeCall(() => window.analyticsExport.getExportHistory())
            ]);
            
            // Render each section
            renderKPIs(summary);
            renderAlerts(alerts);
            renderProgramTable(programs);
            renderDonutChart(summary?.referrals);
            renderHealthList(health);
            renderHouseOccupancy();
            renderDeclineReasons(declineReasons);
            renderTimeToAdmission(timeToAdmission);
            renderDocCompliance(docCompliance);
            renderDischargePackets(packets);
            renderAuthTable(authsByPayer);
            renderClientJourney(journey);
            renderStoreCounts(storeCounts);
            renderExportHistory(exportHistory);
            renderSystemInfo();
            checkFrequentCustomPrograms();
            
            accLastRefresh = new Date();
            console.log('✅ ACC: Dashboard refreshed successfully');
            
        } catch (error) {
            console.error('ACC: Error refreshing dashboard:', error);
        }
    }
    
    // Expose globally
    window.accRefreshData = accRefreshData;
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: KPI CARDS
    // ═══════════════════════════════════════════════════════════════════════════
    function renderKPIs(summary) {
        if (!summary) return;
        
        const { referrals, documents, authorizations, tasks } = summary;
        
        // Aftercare Plans (formerly Referrals)
        setText('accKpiReferrals', referrals?.total ?? 0);
        
        // Successful Placements (admitted referrals)
        const admitted = referrals?.byStatus?.admitted ?? 0;
        setText('accKpiAdmissions', admitted);
        
        // Placement rate (formerly Conversion rate)
        const convRate = referrals?.total > 0 
            ? Math.round((admitted / referrals.total) * 100) + '%'
            : '0%';
        setText('accKpiConversion', convRate);
        
        // Document compliance
        setText('accKpiCompliance', documents?.completionRate ?? '--');
        
        // Discharge packets (completed discharge docs)
        const dischargeCount = documents?.byType?.discharge_packet ?? 
                               documents?.byType?.aftercare_plan ?? 
                               documents?.completed ?? 0;
        setText('accKpiPackets', dischargeCount);
        
        // Tasks completed
        setText('accKpiTasks', tasks?.completed ?? 0);
        
        // Active Census - fetch from houses manager
        renderCensusKPI();
    }
    
    async function renderCensusKPI() {
        try {
            if (window.housesManager && typeof window.housesManager.getTotalCensus === 'function') {
                const census = await window.housesManager.getTotalCensus();
                setText('accKpiCensus', census.total ?? 0);
                setText('accKpiCensusCapacity', `of ${census.capacity ?? 67} capacity`);
                
                // Set trend based on occupancy
                const trendEl = document.getElementById('accKpiCensusTrend');
                if (trendEl) {
                    if (census.percentage >= 90) {
                        trendEl.textContent = '⚠️';
                        trendEl.className = 'acc-kpi__trend acc-kpi__trend--up';
                    } else if (census.percentage >= 75) {
                        trendEl.textContent = '→';
                        trendEl.className = 'acc-kpi__trend acc-kpi__trend--neutral';
                    } else {
                        trendEl.textContent = '↓';
                        trendEl.className = 'acc-kpi__trend acc-kpi__trend--down';
                    }
                }
            } else {
                // Fallback: count active clients directly
                if (window.clientManager) {
                    const activeClients = await window.clientManager.getActiveClients();
                    setText('accKpiCensus', activeClients.length);
                    setText('accKpiCensusCapacity', 'of 67 capacity');
                }
            }
        } catch (error) {
            console.error('Failed to render census KPI:', error);
            setText('accKpiCensus', '--');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: ALERTS
    // ═══════════════════════════════════════════════════════════════════════════
    function renderAlerts(alerts) {
        const container = document.getElementById('accAlerts');
        if (!container) return;
        
        if (!alerts) {
            container.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // Overdue documents
        if (alerts.overdueDocuments?.length > 0) {
            html += `
                <div class="acc-alert acc-alert--danger" onclick="accShowOverdueDocuments()">
                    <span class="acc-alert__icon">⚠️</span>
                    <div class="acc-alert__content">
                        <div class="acc-alert__title">${alerts.overdueDocuments.length} Overdue Documents</div>
                        <div class="acc-alert__detail">Require immediate attention</div>
                    </div>
                    <span class="acc-alert__arrow">→</span>
                </div>
            `;
        }
        
        // Pending referrals > 7 days
        if (alerts.pendingReferrals?.length > 0) {
            html += `
                <div class="acc-alert acc-alert--warning" onclick="accShowPendingReferrals()">
                    <span class="acc-alert__icon">📋</span>
                    <div class="acc-alert__content">
                        <div class="acc-alert__title">${alerts.pendingReferrals.length} Stale Referrals</div>
                        <div class="acc-alert__detail">Pending > 7 days without update</div>
                    </div>
                    <span class="acc-alert__arrow">→</span>
                </div>
            `;
        }
        
        // Expiring authorizations
        if (alerts.expiringAuths?.length > 0) {
            html += `
                <div class="acc-alert acc-alert--info" onclick="accShowExpiringAuths()">
                    <span class="acc-alert__icon">🏥</span>
                    <div class="acc-alert__content">
                        <div class="acc-alert__title">${alerts.expiringAuths.length} Expiring Authorizations</div>
                        <div class="acc-alert__detail">Within next 5 days</div>
                    </div>
                    <span class="acc-alert__arrow">→</span>
                </div>
            `;
        }
        
        container.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: TOP PLACEMENTS TABLE
    // ═══════════════════════════════════════════════════════════════════════════
    async function renderProgramTable(programs) {
        const tbody = document.getElementById('accProgramTable');
        if (!tbody) return;
        
        // Try to get top placements from analytics
        let placements = null;
        try {
            if (window.analyticsExport && typeof window.analyticsExport.getTopPlacements === 'function') {
                placements = await window.analyticsExport.getTopPlacements(8);
            }
        } catch (e) {
            console.warn('Failed to get top placements:', e);
        }
        
        // Use placements if available, otherwise fall back to old programs data
        const data = placements && placements.length > 0 ? placements : programs;
        
        if (!data || data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="acc-empty">No placement data yet. Discharge clients with outcomes to see analytics.</td></tr>';
            return;
        }
        
        let html = '';
        
        data.slice(0, 8).forEach(p => {
            const typeClass = getProgramTypeClass(p.type);
            const typeLabel = getProgramTypeLabel(p.type);
            const isCustom = p.isCustom ? ' *' : '';
            
            html += `
                <tr>
                    <td>
                        <div class="acc-table__program">
                            <div class="acc-table__program-info">
                                <span class="acc-table__program-name">${p.name}${isCustom}</span>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="acc-table__program-type acc-table__program-type--${typeClass}">${typeLabel}</span>
                    </td>
                    <td class="acc-table__number acc-table__number--highlight">${p.count || p.admitted || 0}</td>
                </tr>
            `;
        });
        
        // Add note about custom entries if any
        const customCount = data.filter(p => p.isCustom).length;
        if (customCount > 0) {
            html += `
                <tr>
                    <td colspan="3" style="font-size: 0.75rem; color: #64748b; padding-top: 0.5rem;">
                        * Custom entry - consider adding to program database
                    </td>
                </tr>
            `;
        }
        
        tbody.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: DONUT CHART
    // ═══════════════════════════════════════════════════════════════════════════
    async function renderDonutChart(referrals) {
        // Try to get discharge outcomes data from analytics
        let outcomeData = null;
        try {
            if (window.analyticsExport && typeof window.analyticsExport.getOutcomeBreakdown === 'function') {
                outcomeData = await window.analyticsExport.getOutcomeBreakdown();
            }
        } catch (e) {
            console.warn('Failed to get outcome breakdown:', e);
        }
        
        // Use outcome data if available, otherwise fall back to referrals
        if (outcomeData && outcomeData.total > 0) {
            const total = outcomeData.total;
            const program = outcomeData.program || 0;
            const home = outcomeData.homeWithSupports || 0;
            const clinRec = outcomeData.clinicianRecommended || 0;
            const ama = outcomeData.ama || 0;
            
            setText('accDonutTotal', total);
            setText('accLegendProgram', program);
            setText('accLegendHome', home);
            setText('accLegendClinicianRec', clinRec);
            setText('accLegendAMA', ama);
            setText('accPlacementRate', outcomeData.placementRate + '%');
            
            // SVG donut chart calculation
            const circumference = 2 * Math.PI * 40; // r=40
            
            const programPct = program / total;
            const homePct = home / total;
            const clinRecPct = clinRec / total;
            const amaPct = ama / total;
            
            // Program segment
            const programEl = document.getElementById('accDonutProgram');
            if (programEl) {
                programEl.setAttribute('stroke-dasharray', `${programPct * circumference} ${circumference}`);
                programEl.setAttribute('stroke-dashoffset', '0');
            }
            
            // Home segment (offset by program)
            const homeEl = document.getElementById('accDonutHome');
            if (homeEl) {
                homeEl.setAttribute('stroke-dasharray', `${homePct * circumference} ${circumference}`);
                homeEl.setAttribute('stroke-dashoffset', `${-programPct * circumference}`);
            }
            
            // Clinician Rec segment
            const clinRecEl = document.getElementById('accDonutClinicianRec');
            if (clinRecEl) {
                clinRecEl.setAttribute('stroke-dasharray', `${clinRecPct * circumference} ${circumference}`);
                clinRecEl.setAttribute('stroke-dashoffset', `${-(programPct + homePct) * circumference}`);
            }
            
            // AMA segment
            const amaEl = document.getElementById('accDonutAMA');
            if (amaEl) {
                amaEl.setAttribute('stroke-dasharray', `${amaPct * circumference} ${circumference}`);
                amaEl.setAttribute('stroke-dashoffset', `${-(programPct + homePct + clinRecPct) * circumference}`);
            }
        } else if (referrals) {
            // Fallback to old referral data
            const total = referrals.total || 0;
            setText('accDonutTotal', total);
            setText('accLegendProgram', referrals.byStatus?.admitted || 0);
            setText('accLegendHome', 0);
            setText('accLegendClinicianRec', referrals.byStatus?.pending || 0);
            setText('accLegendAMA', referrals.byStatus?.declined || 0);
            setText('accPlacementRate', '0%');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: RELATIONSHIP HEALTH
    // ═══════════════════════════════════════════════════════════════════════════
    function renderHealthList(health) {
        const container = document.getElementById('accHealthList');
        if (!container) return;
        
        if (!health || health.length === 0) {
            container.innerHTML = '<div class="acc-empty">No program relationships tracked yet</div>';
            setText('accHealthPreferred', 0);
            setText('accHealthActive', 0);
            setText('accHealthStale', 0);
            return;
        }
        
        // Count by status
        const counts = { preferred: 0, active: 0, stale: 0, inactive: 0 };
        health.forEach(h => counts[h.status] = (counts[h.status] || 0) + 1);
        
        setText('accHealthPreferred', counts.preferred);
        setText('accHealthActive', counts.active);
        setText('accHealthStale', counts.stale);
        
        // Show top 5
        const top5 = health.slice(0, 5);
        let html = '';
        
        top5.forEach(h => {
            const daysText = h.daysSinceContact === 999 ? 'Never' : `${h.daysSinceContact}d ago`;
            html += `
                <div class="acc-health-item acc-health-item--${h.status}">
                    <span class="acc-health-item__name">${h.programName}</span>
                    <span class="acc-health-item__days">${daysText}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: HOUSE OCCUPANCY
    // ═══════════════════════════════════════════════════════════════════════════
    async function renderHouseOccupancy() {
        const container = document.getElementById('accOccupancyGrid');
        const totalEl = document.getElementById('accOccupancyTotal');
        
        if (!container) return;
        
        try {
            let census;
            
            // Try to get census from housesManager
            if (window.housesManager && typeof window.housesManager.getTotalCensus === 'function') {
                census = await window.housesManager.getTotalCensus();
            } else {
                // Fallback: build from client data
                const activeClients = window.clientManager ? await window.clientManager.getActiveClients() : [];
                const defaultHouses = [
                    { id: 'house_nest', name: 'NEST', capacity: 20, programType: 'neurodivergent', subUnits: [
                        { id: 'nest_preserve', name: 'Preserve', capacity: 12 },
                        { id: 'nest_prosperity', name: 'Prosperity', capacity: 8 }
                    ]},
                    { id: 'house_cove', name: 'Cove', capacity: 15, programType: 'residential', subUnits: [
                        { id: 'cove_unit_a', name: 'Unit A', capacity: 8 },
                        { id: 'cove_unit_b', name: 'Unit B', capacity: 7 }
                    ]},
                    { id: 'house_hedge', name: 'Hedge', capacity: 12, programType: 'residential' },
                    { id: 'house_meridian', name: 'Meridian', capacity: 10, programType: 'residential' },
                    { id: 'house_banyan', name: 'Banyan', capacity: 10, programType: 'residential' }
                ];
                
                let total = 0;
                let totalCapacity = 0;
                const byHouse = defaultHouses.map(house => {
                    const clients = activeClients.filter(c => c.houseId === house.id || c.house === house.id);
                    const current = clients.length;
                    totalCapacity += house.capacity;
                    total += current;
                    const percentage = Math.round((current / house.capacity) * 100);
                    
                    return {
                        houseId: house.id,
                        name: house.name,
                        programType: house.programType,
                        current,
                        capacity: house.capacity,
                        available: house.capacity - current,
                        percentage,
                        status: percentage >= 100 ? 'full' : percentage >= 90 ? 'critical' : percentage >= 75 ? 'warning' : 'available',
                        subUnits: house.subUnits?.map(sub => ({
                            ...sub,
                            current: clients.filter(c => c.subUnitId === sub.id).length
                        })) || []
                    };
                });
                
                census = { total, capacity: totalCapacity, byHouse };
            }
            
            // Update total
            if (totalEl) {
                totalEl.textContent = `Total: ${census.total}/${census.capacity} beds`;
            }
            
            // Build HTML
            let html = '';
            
            if (!census.byHouse || census.byHouse.length === 0) {
                html = '<div class="acc-empty">No house data available</div>';
            } else {
                census.byHouse.forEach(house => {
                    const statusClass = house.status || 'available';
                    const pctClass = house.percentage >= 90 ? 'high' : house.percentage >= 75 ? 'medium' : 'low';
                    const barClass = statusClass;
                    
                    html += `
                        <div class="acc-occupancy-house acc-occupancy-house--${statusClass}">
                            <div class="acc-occupancy-house__header">
                                <div class="acc-occupancy-house__name">
                                    ${house.name}
                                    ${house.programType ? `<span class="acc-occupancy-house__type">${house.programType}</span>` : ''}
                                    ${house.status === 'full' ? '<span class="acc-occupancy-full-badge">FULL</span>' : ''}
                                </div>
                                <div class="acc-occupancy-house__stats">
                                    <span class="acc-occupancy-house__count">${house.current}/${house.capacity}</span>
                                    <span class="acc-occupancy-house__pct acc-occupancy-house__pct--${pctClass}">${house.percentage}%</span>
                                </div>
                            </div>
                            <div class="acc-occupancy-bar">
                                <div class="acc-occupancy-bar__fill acc-occupancy-bar__fill--${barClass}" style="width: ${Math.min(house.percentage, 100)}%"></div>
                            </div>
                            ${house.subUnits && house.subUnits.length > 0 ? `
                                <div class="acc-occupancy-subunits">
                                    ${house.subUnits.map(sub => `
                                        <div class="acc-occupancy-subunit">
                                            <span class="acc-occupancy-subunit__name">${sub.name}:</span>
                                            <span class="acc-occupancy-subunit__count">${sub.current}/${sub.capacity}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>
                    `;
                });
            }
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Failed to render house occupancy:', error);
            container.innerHTML = '<div class="acc-empty">Error loading occupancy data</div>';
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: DECLINE REASONS
    // ═══════════════════════════════════════════════════════════════════════════
    function renderDeclineReasons(reasons) {
        const container = document.getElementById('accDeclineReasons');
        if (!container) return;
        
        if (!reasons || reasons.length === 0) {
            container.innerHTML = '<div class="acc-empty">No decline data yet</div>';
            return;
        }
        
        const maxCount = Math.max(...reasons.map(r => r.count));
        let html = '';
        
        reasons.slice(0, 5).forEach((r, i) => {
            const pct = maxCount > 0 ? (r.count / maxCount * 100) : 0;
            const barClass = i === 0 ? 'danger' : (i === 1 ? 'warning' : 'primary');
            
            html += `
                <div class="acc-bar-chart__item">
                    <span class="acc-bar-chart__label">${r.reason}</span>
                    <div class="acc-bar-chart__bar-container">
                        <div class="acc-bar-chart__bar acc-bar-chart__bar--${barClass}" style="width: ${pct}%"></div>
                    </div>
                    <span class="acc-bar-chart__count">${r.count}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: TIME TO ADMISSION
    // ═══════════════════════════════════════════════════════════════════════════
    function renderTimeToAdmission(data) {
        if (!data) return;
        
        setText('accAvgDays', data.avg !== null ? data.avg + 'd' : '--');
        setText('accMedianDays', data.median !== null ? data.median + 'd' : '--');
        setText('accLongestDays', data.max !== null ? data.max + 'd' : '--');
        setText('accFastestDays', data.min !== null ? data.min + 'd' : '--');
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: DOCUMENT COMPLIANCE
    // ═══════════════════════════════════════════════════════════════════════════
    function renderDocCompliance(data) {
        if (!data) return;
        
        setText('accDocOnTime', data.onTime ?? 0);
        setText('accDocLate', data.late ?? 0);
        setText('accDocOverdue', data.overdue ?? 0);
        setText('accDocTotal', data.total ?? 0);
        
        // By type bar chart
        const container = document.getElementById('accDocByType');
        if (!container) return;
        
        if (!data.byType || data.byType.length === 0) {
            container.innerHTML = '<div class="acc-empty">No document data yet</div>';
            return;
        }
        
        const maxTotal = Math.max(...data.byType.map(t => t.total));
        let html = '';
        
        data.byType.slice(0, 5).forEach(t => {
            const pct = maxTotal > 0 ? (t.total / maxTotal * 100) : 0;
            const barClass = t.rate >= 80 ? 'success' : (t.rate >= 50 ? 'warning' : 'danger');
            
            html += `
                <div class="acc-bar-chart__item">
                    <span class="acc-bar-chart__label">${t.type.replace(/_/g, ' ')}</span>
                    <div class="acc-bar-chart__bar-container">
                        <div class="acc-bar-chart__bar acc-bar-chart__bar--${barClass}" style="width: ${pct}%">
                            <span class="acc-bar-chart__value">${t.rate}%</span>
                        </div>
                    </div>
                    <span class="acc-bar-chart__count">${t.completed}/${t.total}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: DISCHARGE PACKETS
    // ═══════════════════════════════════════════════════════════════════════════
    function renderDischargePackets(data) {
        if (!data) return;
        
        setText('accPacketsCompleted', data.completed ?? 0);
        setText('accPacketsUploaded', data.uploaded ?? 0);
        setText('accPacketsPending', data.pending ?? 0);
        setText('accPacketsAvgTime', data.avgCompletionDays !== null ? data.avgCompletionDays + 'd' : '--');
        
        // Upload rate bar
        const uploadBar = document.getElementById('accUploadRateBar');
        const uploadRate = document.getElementById('accUploadRate');
        if (uploadBar) uploadBar.style.width = (data.uploadRate ?? 0) + '%';
        if (uploadRate) uploadRate.textContent = (data.uploadRate ?? 0) + '%';
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: AUTHORIZATION TABLE
    // ═══════════════════════════════════════════════════════════════════════════
    function renderAuthTable(authsByPayer) {
        const tbody = document.getElementById('accAuthTable');
        if (!tbody) return;
        
        if (!authsByPayer || authsByPayer.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="acc-empty">No authorization data yet</td></tr>';
            return;
        }
        
        let html = '';
        
        authsByPayer.forEach(p => {
            const rateClass = p.approvalRate >= 80 ? 'admitted' : (p.approvalRate >= 50 ? 'pending' : 'declined');
            
            html += `
                <tr>
                    <td style="font-weight: 500;">${p.payer}</td>
                    <td class="acc-table__number">${p.total}</td>
                    <td class="acc-table__number" style="color: #22c55e;">${p.approved}</td>
                    <td class="acc-table__number" style="color: #ef4444;">${p.denied}</td>
                    <td>
                        <span class="acc-table__status acc-table__status--${rateClass}">${p.approvalRate}%</span>
                    </td>
                    <td style="color: #94a3b8;">${p.avgDecisionDays}${p.avgDecisionDays !== 'N/A' ? ' days' : ''}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: CLIENT JOURNEY
    // ═══════════════════════════════════════════════════════════════════════════
    function renderClientJourney(data) {
        if (!data) return;
        
        setText('accCensus', data.census ?? 0);
        setText('accAvgLOS', data.avgLOS !== null ? data.avgLOS + 'd' : '--');
        
        // Discharge destinations bar chart
        const container = document.getElementById('accDischargeDestinations');
        if (!container) return;
        
        if (!data.destinations || data.destinations.length === 0) {
            container.innerHTML = '<div class="acc-empty">No discharge data yet</div>';
            return;
        }
        
        const maxCount = Math.max(...data.destinations.map(d => d.count));
        let html = '';
        
        data.destinations.slice(0, 5).forEach((d, i) => {
            const pct = maxCount > 0 ? (d.count / maxCount * 100) : 0;
            const barClass = i === 0 ? 'success' : (i === 1 ? 'primary' : 'warning');
            
            html += `
                <div class="acc-bar-chart__item">
                    <span class="acc-bar-chart__label">${d.destination}</span>
                    <div class="acc-bar-chart__bar-container">
                        <div class="acc-bar-chart__bar acc-bar-chart__bar--${barClass}" style="width: ${pct}%"></div>
                    </div>
                    <span class="acc-bar-chart__count">${d.count}</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: STORE COUNTS
    // ═══════════════════════════════════════════════════════════════════════════
    function renderStoreCounts(counts) {
        if (!counts) return;
        
        setText('accStoreReferrals', counts.referrals ?? 0);
        setText('accStoreDocs', counts.documents ?? 0);
        setText('accStoreAuths', counts.authorizations ?? 0);
        setText('accStoreTasks', counts.tasks ?? 0);
        setText('accStoreEvents', counts.events ?? 0);
        setText('accStorePrograms', counts.programs ?? 0);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: EXPORT HISTORY
    // ═══════════════════════════════════════════════════════════════════════════
    function renderExportHistory(history) {
        const tbody = document.getElementById('accExportHistory');
        if (!tbody) return;
        
        if (!history || history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" class="acc-empty">No exports yet</td></tr>';
            return;
        }
        
        // Sort by date descending and take top 10
        const sorted = [...history].sort((a, b) => new Date(b.exportedAt) - new Date(a.exportedAt)).slice(0, 10);
        
        let html = '';
        sorted.forEach(e => {
            html += `
                <tr>
                    <td>${formatDate(e.exportedAt)}</td>
                    <td>${e.type || 'Full'}</td>
                    <td>${e.recordCount ?? '--'}</td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CHECK FOR FREQUENT CUSTOM PROGRAMS
    // ═══════════════════════════════════════════════════════════════════════════
    async function checkFrequentCustomPrograms() {
        try {
            if (!window.analyticsExport || typeof window.analyticsExport.getFrequentCustomPrograms !== 'function') {
                return;
            }
            
            const frequentCustom = await window.analyticsExport.getFrequentCustomPrograms(3);
            
            // Remove existing prompt if any
            const existingPrompt = document.getElementById('customProgramPrompt');
            if (existingPrompt) existingPrompt.remove();
            
            if (frequentCustom.length === 0) return;
            
            // Create prompt element
            const prompt = document.createElement('div');
            prompt.id = 'customProgramPrompt';
            prompt.className = 'acc-custom-prompt';
            prompt.innerHTML = `
                <div class="acc-custom-prompt__icon">💡</div>
                <div class="acc-custom-prompt__content">
                    <div class="acc-custom-prompt__title">Frequently Used Custom Programs Detected</div>
                    <div class="acc-custom-prompt__text">
                        ${frequentCustom.length} custom program${frequentCustom.length > 1 ? 's have' : ' has'} been used 3+ times:
                        <strong>${frequentCustom.map(p => p.name).join(', ')}</strong>.
                        Consider adding ${frequentCustom.length > 1 ? 'them' : 'it'} to the program database for easier selection.
                    </div>
                </div>
                <button class="acc-custom-prompt__btn" onclick="this.parentElement.remove()">Dismiss</button>
            `;
            
            // Add to alerts area
            const alertsArea = document.getElementById('accAlerts');
            if (alertsArea) {
                alertsArea.insertBefore(prompt, alertsArea.firstChild);
            }
        } catch (error) {
            console.warn('Failed to check frequent custom programs:', error);
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // RENDER: SYSTEM INFO
    // ═══════════════════════════════════════════════════════════════════════════
    function renderSystemInfo() {
        setText('accEnvMode', window.ccConfig?.demoMode ? 'Demo Mode' : 'Production');
        
        // Estimate storage
        if (navigator.storage && navigator.storage.estimate) {
            navigator.storage.estimate().then(estimate => {
                const usedMB = ((estimate.usage || 0) / 1024 / 1024).toFixed(2);
                setText('accStorageUsed', usedMB + ' MB');
            });
        } else {
            setText('accStorageUsed', 'N/A');
        }
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // EXPORT FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════════════
    window.accSelectExportType = function(element, type) {
        accSelectedExportType = type;
        
        // Update UI
        document.querySelectorAll('.acc-export-option').forEach(opt => {
            opt.classList.remove('acc-export-option--selected');
        });
        element.classList.add('acc-export-option--selected');
    };
    
    window.accDownloadExport = async function() {
        if (!window.analyticsExport) {
            alert('Analytics export module not available');
            return;
        }
        
        try {
            await window.analyticsExport.downloadExport({
                type: accSelectedExportType,
                anonymizeClients: accSelectedExportType !== 'full',
                dateRange: accDateRange
            });
            
            // Refresh export history
            const history = await window.analyticsExport.getExportHistory();
            renderExportHistory(history);
            
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error.message);
        }
    };
    
    window.accCopyToClipboard = async function() {
        if (!window.analyticsExport) {
            alert('Analytics export module not available');
            return;
        }
        
        try {
            const exportData = await window.analyticsExport.generateExport({
                type: accSelectedExportType,
                anonymizeClients: accSelectedExportType !== 'full',
                dateRange: accDateRange
            });
            
            await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
            alert('Export data copied to clipboard!');
            
        } catch (error) {
            console.error('Copy failed:', error);
            alert('Copy failed: ' + error.message);
        }
    };
    
    window.accExportData = function() {
        // Switch to export tab and download
        const exportTab = document.querySelector('.acc-tab:nth-child(3)');
        if (exportTab) accSwitchTab('export', exportTab);
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // ALERT CLICK HANDLERS
    // ═══════════════════════════════════════════════════════════════════════════
    window.accShowOverdueDocuments = function() {
        console.log('Navigate to overdue documents...');
        // Could switch to clinical tab or show modal
        const clinicalTab = document.querySelector('.acc-tab:nth-child(2)');
        if (clinicalTab) accSwitchTab('clinical', clinicalTab);
    };
    
    window.accShowPendingReferrals = function() {
        console.log('Navigate to pending referrals...');
        // Stay on bizdev tab - it's already showing referral data
    };
    
    window.accShowExpiringAuths = function() {
        console.log('Navigate to expiring authorizations...');
        const clinicalTab = document.querySelector('.acc-tab:nth-child(2)');
        if (clinicalTab) accSwitchTab('clinical', clinicalTab);
    };
    
    // ═══════════════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    // Watch for admin tab becoming visible
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const adminTab = document.getElementById('adminTab');
                if (adminTab && adminTab.style.display !== 'none') {
                    // Admin tab became visible, refresh data
                    if (!accLastRefresh || (Date.now() - accLastRefresh.getTime() > 30000)) {
                        accRefreshData();
                    }
                }
            }
        });
    });
    
    // Start observing when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        const adminTab = document.getElementById('adminTab');
        if (adminTab) {
            observer.observe(adminTab, { attributes: true });
        }
        
        // Also expose refresh function globally for backwards compatibility
        window.refreshAdminAnalytics = accRefreshData;
    });
    
    // Initial refresh if admin tab is already visible
    setTimeout(function() {
        const adminTab = document.getElementById('adminTab');
        if (adminTab && adminTab.style.display !== 'none') {
            accRefreshData();
        }
    }, 1000);
    
    console.log('[AdminCommandCenter] Module loaded successfully');
    
})();

