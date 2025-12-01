/**
 * Dashboard Manager - Coach Mission Control
 * Handles dashboard data aggregation, priority calculations, and state management
 */

class DashboardManager {
    constructor() {
        this.initialized = false;
        this.refreshInterval = null;
        this.lastUpdate = null;
        this.currentView = 'myClients'; // 'myClients' or 'allClients'
        this.currentCoach = null;
        this.widgets = new Map();
        this.cache = {
            priorities: null,
            houseHealth: null,
            journeyData: null,
            metrics: null,
            recentChanges: null,
            lastCacheTime: null
        };
        // Filter state for interactive filtering
        this.filters = {
            journeyStage: null,  // 'week1', 'day14to16', 'day30', 'day45plus', 'dischargePipeline', 'recentlyDischarged'
            house: null          // 'house_nest', 'house_banyan', etc.
        };
        this.CACHE_DURATION = 60000; // 1 minute cache
        this.REFRESH_INTERVAL = 300000; // 5 minutes auto-refresh
    }

    /**
     * Set a filter and refresh the dashboard
     * Clicking the same filter value toggles it off
     */
    setFilter(key, value) {
        if (this.filters[key] === value) {
            this.filters[key] = null; // Toggle off
        } else {
            this.filters[key] = value;
        }
        this.cache.lastCacheTime = 0; // Invalidate cache
        this.notifyWidgets();
    }

    /**
     * Clear all filters
     */
    clearFilters() {
        this.filters = {
            journeyStage: null,
            house: null
        };
        this.cache.lastCacheTime = 0;
        this.notifyWidgets();
    }

    /**
     * Check if any filters are active
     */
    hasActiveFilters() {
        return this.filters.journeyStage !== null || this.filters.house !== null;
    }

    /**
     * Get priorities filtered by current filter state
     */
    getFilteredPriorities() {
        const priorities = this.cache.priorities || { red: [], purple: [], yellow: [], green: [] };
        
        // If no filters active, return all priorities
        if (!this.hasActiveFilters()) {
            return priorities;
        }

        // Combine all items for filtering
        let allItems = [
            ...priorities.red,
            ...priorities.purple,
            ...priorities.yellow,
            ...priorities.green
        ];

        // Filter by journey stage
        if (this.filters.journeyStage) {
            const stageClients = this.cache.journeyData?.[this.filters.journeyStage] || [];
            const clientIds = new Set(stageClients.map(c => c.id));
            allItems = allItems.filter(item => clientIds.has(item.client?.id));
        }

        // Filter by house
        if (this.filters.house) {
            allItems = allItems.filter(item => item.client?.houseId === this.filters.house);
        }

        // Re-group by zone
        return this.groupByZone(allItems);
    }

    /**
     * Group items by priority zone
     */
    groupByZone(items) {
        return {
            red: items.filter(item => item.priority === 'red'),
            purple: items.filter(item => item.priority === 'purple'),
            yellow: items.filter(item => item.priority === 'yellow'),
            green: items.filter(item => item.priority === 'green')
        };
    }

    /**
     * Notify all widgets to re-render with current filter state
     */
    notifyWidgets() {
        for (const [widgetId, widget] of this.widgets) {
            if (widget.refresh) {
                widget.refresh();
            }
        }
    }

    async initialize() {
        try {
            console.log('📊 Initializing Dashboard Manager...');
            
            // Get current coach from session
            this.currentCoach = this.getCurrentCoach();
            
            // Load user preferences
            await this.loadPreferences();
            
            // Initial data load
            await this.loadDashboardData();
            
            // Set up auto-refresh
            this.setupAutoRefresh();
            
            this.initialized = true;
            console.log('✅ Dashboard Manager initialized');
            
            return true;
        } catch (error) {
            console.error('Failed to initialize dashboard:', error);
            return false;
        }
    }

    getCurrentCoach() {
        // Get from session or localStorage
        const userRole = sessionStorage.getItem('userRole') || localStorage.getItem('userRole') || 'Coach';
        const fullName = localStorage.getItem('fullName') || '';
        const initials = localStorage.getItem('userInitials') || 
                        (fullName ? fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 
                        (userRole === 'Coach' ? 'JH' : userRole === 'Admin' ? 'AD' : 'UN'));
        
        return {
            initials,
            fullName: fullName || initials,
            name: fullName || initials,
            role: userRole,
            isAdmin: userRole.toLowerCase() === 'admin'
        };
    }

    async loadPreferences() {
        try {
            const prefs = await indexedDBManager.get('userPreferences', this.currentCoach.initials);
            if (prefs) {
                this.currentView = prefs.dashboardView || 'myClients';
                // Load other preferences as needed
            }
        } catch (error) {
            console.log('No saved preferences, using defaults');
        }
    }

    async savePreferences() {
        try {
            await indexedDBManager.put('userPreferences', {
                id: this.currentCoach.initials,
                dashboardView: this.currentView,
                lastUpdated: Date.now()
            });
        } catch (error) {
            console.error('Failed to save preferences:', error);
        }
    }

    setupAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.refreshDashboard();
        }, this.REFRESH_INTERVAL);
    }

    async loadDashboardData() {
        try {
            const startTime = performance.now();
            
            // Check cache first
            if (this.isCacheValid()) {
                console.log('📊 Using cached dashboard data');
                return this.cache;
            }
            
            // Load critical data first (for <1 second initial load)
            const criticalData = await this.loadCriticalAlerts();
            
            // Then load remaining data in parallel
            const [houseData, journeyData, metricsData, recentChanges, gapsData, pipelineData] = await Promise.all([
                this.loadHouseHealth(),
                this.loadJourneyData(),
                this.loadMetrics(),
                this.loadRecentChanges(),
                this.detectGaps(),
                this.loadPipelineData()
            ]);
            
            // Update cache
            this.cache = {
                priorities: criticalData,
                houseHealth: houseData,
                journeyData: journeyData,
                metrics: metricsData,
                recentChanges: recentChanges,
                gaps: gapsData,
                pipeline: pipelineData,
                lastCacheTime: Date.now()
            };
            
            this.lastUpdate = new Date();
            
            const loadTime = performance.now() - startTime;
            console.log(`✅ Dashboard data loaded in ${loadTime.toFixed(0)}ms`);
            
            return this.cache;
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            // Return empty cache structure instead of throwing
            this.cache = {
                priorities: { red: [], purple: [], yellow: [], green: [] },
                houseHealth: {},
                journeyData: {},
                metrics: {
                    todayAftercareOnTime: 0,
                    todayAftercareTotal: 0,
                    weekCompletionRate: 0,
                    weekTotal: 0,
                    weekComplete: 0,
                    activeClients: 0,
                    totalHouses: 6,
                    weeklyGoal: 5,
                    weeklyComplete: 0,
                    trend: null
                },
                lastCacheTime: Date.now()
            };
            return this.cache;
        }
    }

    isCacheValid() {
        if (!this.cache.lastCacheTime) return false;
        return Date.now() - this.cache.lastCacheTime < this.CACHE_DURATION;
    }

    async loadCriticalAlerts() {
        try {
            const clients = await this.getRelevantClients();
            if (!clients || clients.length === 0) {
                return { red: [], purple: [], yellow: [], green: [] };
            }
            const alerts = [];
            const now = new Date();
            
            for (const client of clients) {
                const daysInCare = this.calculateDaysInCare(client.admissionDate);
                
                // Check for critical milestones
                const milestones = window.milestonesManager 
                    ? await window.milestonesManager.getClientMilestones(client.id)
                    : [];
                
                // Day 14 aftercare check
                if (daysInCare === 14 || (daysInCare > 14 && daysInCare <= 16)) {
                    const aftercareStarted = milestones.find(m => 
                        m.milestone === 'aftercare_options_sent' && m.status === 'complete'
                    );
                    
                    if (!aftercareStarted) {
                        alerts.push({
                            type: 'aftercare_urgent',
                            priority: 'red',
                            client: client,
                            message: `Day ${daysInCare} - Aftercare thread needed`,
                            action: 'Send aftercare options',
                            dueDate: 'Immediate',
                            sortOrder: 1
                        });
                    }
                }
                
                // Day 16+ escalation
                if (daysInCare >= 16) {
                    const aftercareStarted = milestones.find(m => 
                        m.milestone === 'aftercare_options_sent' && m.status === 'complete'
                    );
                    
                    if (!aftercareStarted) {
                        alerts.push({
                            type: 'aftercare_critical',
                            priority: 'red',
                            client: client,
                            message: `Day ${daysInCare} - CRITICAL: Aftercare overdue`,
                            action: 'Complete Task',
                            dueDate: 'Overdue',
                            sortOrder: 0
                        });
                    }
                }
                
                // Check for overdue milestones
                for (const milestone of milestones) {
                    if (milestone.status !== 'complete') {
                        const priority = window.milestonesManager
                            ? window.milestonesManager.getPriorityIndicator(milestone, daysInCare)
                            : { icon: '⚪', tooltip: 'Unknown priority' };
                        
                        if (priority.icon === '🔥') { // Overdue
                            alerts.push({
                                type: 'milestone_overdue',
                                priority: 'red',
                                client: client,
                                milestone: milestone,
                                message: `${milestone.milestone} overdue`,
                                action: 'Complete milestone',
                                dueDate: 'Overdue',
                                sortOrder: 2
                            });
                        } else if (priority.icon === '⚠️') { // Due today
                            alerts.push({
                                type: 'milestone_due',
                                priority: 'yellow',
                                client: client,
                                milestone: milestone,
                                message: `${milestone.milestone} due today`,
                                action: 'Complete milestone',
                                dueDate: 'Today',
                                sortOrder: 3
                            });
                        }
                    }
                }
                
                // Discharge prep checks
                if (client.dischargeDate) {
                    const daysUntilDischarge = this.calculateDaysUntil(client.dischargeDate);
                    
                    if (daysUntilDischarge <= 3 && daysUntilDischarge >= 0) {
                        // Check discharge readiness
                        const readiness = window.milestonesManager
                            ? await window.milestonesManager.getDischargeReadiness(client.id)
                            : { items: [], ready: false };
                        const incomplete = readiness.items.filter(item => !item.complete);
                        
                        if (incomplete.length > 0) {
                            alerts.push({
                                type: 'discharge_prep',
                                priority: daysUntilDischarge === 0 ? 'red' : 'purple',
                                client: client,
                                message: `Discharge in ${daysUntilDischarge} days - ${incomplete.length} items pending`,
                                action: 'Complete discharge checklist',
                                dueDate: `${daysUntilDischarge} days`,
                                sortOrder: daysUntilDischarge === 0 ? 1 : 4,
                                checklist: readiness
                            });
                        }
                    }
                    
                    // 48-hour discharge tasks
                    if (daysUntilDischarge <= 2 && daysUntilDischarge >= 0) {
                        // Check if discharge packet sent
                        const dischargePacketSent = milestones.find(m => 
                            m.milestone === 'discharge_packet_sent' && m.status === 'complete'
                        );
                        
                        if (!dischargePacketSent) {
                            alerts.push({
                                type: 'discharge_packet',
                                priority: 'yellow',
                                client: client,
                                message: 'Send discharge packet (48hr requirement)',
                                action: 'Send packet & complete assessments',
                                dueDate: 'Within 48 hours',
                                sortOrder: 5
                            });
                        }
                    }
                }
            }
            
            // Add enhanced discharge alerts from ClientManager
            await this.addEnhancedDischargeAlerts(alerts);
            
            // Sort by priority and sortOrder
            alerts.sort((a, b) => {
                if (a.priority !== b.priority) {
                    const priorityOrder = { red: 0, purple: 1, yellow: 2, green: 3 };
                    return priorityOrder[a.priority] - priorityOrder[b.priority];
                }
                return a.sortOrder - b.sortOrder;
            });
            
            // Group by zones
            const zones = {
                red: alerts.filter(a => a.priority === 'red'),
                purple: alerts.filter(a => a.priority === 'purple'),
                yellow: alerts.filter(a => a.priority === 'yellow'),
                green: alerts.filter(a => a.priority === 'green')
            };
            
            return zones;
        } catch (error) {
            console.error('Failed to load critical alerts:', error);
            return { red: [], purple: [], yellow: [], green: [] };
        }
    }
    
    /**
     * Add enhanced discharge alerts using ClientManager methods
     * @param {Array} alerts - Existing alerts array to append to
     */
    async addEnhancedDischargeAlerts(alerts) {
        try {
            if (!window.clientManager || typeof window.clientManager.getUpcomingDischarges !== 'function') {
                return;
            }
            
            const upcomingDischarges = window.clientManager.getUpcomingDischarges(48);
            
            for (const client of upcomingDischarges) {
                // Skip if we already have an alert for this client
                const existingAlert = alerts.find(a => 
                    a.client?.id === client.id && 
                    (a.type === 'discharge_prep' || a.type === 'discharge_packet')
                );
                
                if (existingAlert) continue;
                
                // Determine priority based on urgency and packet status
                let priority = 'yellow';
                let sortOrder = 6;
                
                if (client.isCritical && !client.packetComplete) {
                    priority = 'red';
                    sortOrder = 0;
                } else if (client.isUrgent || !client.packetComplete) {
                    priority = 'purple';
                    sortOrder = 3;
                }
                
                // Build message
                let message = `${client.initials} discharges in ${client.hoursRemaining} hours`;
                if (!client.packetComplete) {
                    message += ' - PACKET INCOMPLETE';
                }
                if (!client.outcomeRecorded) {
                    message += ' - No outcome recorded';
                }
                
                // Build action text
                let action = 'Review discharge';
                if (!client.packetComplete) {
                    action = 'Complete packet NOW';
                } else if (!client.outcomeRecorded) {
                    action = 'Record outcome';
                }
                
                alerts.push({
                    type: 'discharge_upcoming',
                    priority: priority,
                    client: client,
                    message: message,
                    action: action,
                    dueDate: `${client.dcDateFormatted} ${client.dcTimeFormatted}`,
                    sortOrder: sortOrder,
                    hoursRemaining: client.hoursRemaining,
                    packetStatus: client.packetStatus,
                    packetComplete: client.packetComplete,
                    outcomeRecorded: client.outcomeRecorded
                });
            }
        } catch (error) {
            console.error('Failed to add enhanced discharge alerts:', error);
        }
    }

    async loadHouseHealth() {
        try {
            if (typeof housesManager === 'undefined') {
                return {};
            }
            const houses = await housesManager.getHouses?.() || [];
            if (houses.length === 0) {
                return {};
            }
            const healthScores = {};
            
            for (const house of houses) {
                const clients = await housesManager.getClientsByHouse(house.id);
                let totalScore = 100;
                let issues = [];
                
                for (const client of clients) {
                    const milestones = window.milestonesManager
                        ? await window.milestonesManager.getClientMilestones(client.id)
                        : [];
                    const daysInCare = this.calculateDaysInCare(client.admissionDate);
                    
                    // Check each milestone
                    for (const milestone of milestones) {
                        if (milestone.status !== 'complete') {
                            const priority = window.milestonesManager
                            ? window.milestonesManager.getPriorityIndicator(milestone, daysInCare)
                            : { icon: '⚪', tooltip: 'Unknown priority' };
                            
                            if (priority.icon === '🔥') { // Overdue
                                totalScore -= 15;
                                issues.push({ type: 'overdue', client: client.initials, milestone: milestone.milestone });
                            } else if (priority.icon === '⚠️') { // Due today
                                totalScore -= 10;
                                issues.push({ type: 'due', client: client.initials, milestone: milestone.milestone });
                            } else if (priority.icon === '📌') { // Pending
                                totalScore -= 5;
                            }
                        }
                    }
                }
                
                // Calculate trend (would need historical data in real implementation)
                const trend = 'stable'; // 'improving', 'stable', or 'declining'
                
                // Determine weather
                let weather;
                if (totalScore >= 90) weather = '☀️';
                else if (totalScore >= 70) weather = '⛅';
                else if (totalScore >= 40) weather = '🌧️';
                else weather = '⛈️';
                
                healthScores[house.id] = {
                    house: house,
                    score: Math.max(0, totalScore),
                    weather: weather,
                    trend: trend,
                    issues: issues,
                    clientCount: clients.length
                };
            }
            
            return healthScores;
        } catch (error) {
            console.error('Failed to load house health:', error);
            return {};
        }
    }

    async loadJourneyData() {
        try {
            const clients = await this.getRelevantClients() || [];
            const segments = {
                week1: [],          // Days 0-7: New admissions
                day14to16: [],      // Days 14-16: Aftercare planning window
                day30: [],          // Day 30: Mid-stay review
                day45plus: [],      // 45+ days: Extended stay
                dischargePipeline: [], // Clients with discharge dates set
                recentlyDischarged: [] // Discharged in last 7 days
            };
            
            const today = new Date();
            
            for (const client of clients) {
                const daysInCare = this.calculateDaysInCare(client.admissionDate);
                
                // Check if recently discharged (last 7 days)
                if (client.dischargeDate && client.status === 'discharged') {
                    const daysSinceDischarge = this.calculateDaysSince(client.dischargeDate);
                    if (daysSinceDischarge >= 0 && daysSinceDischarge <= 7) {
                        segments.recentlyDischarged.push({ ...client, daysSinceDischarge });
                        continue;
                    }
                }
                
                // Check if in discharge pipeline (has future discharge date)
                if (client.dischargeDate && client.status === 'active') {
                    const daysUntilDischarge = this.calculateDaysUntil(client.dischargeDate);
                    if (daysUntilDischarge >= 0) {
                        segments.dischargePipeline.push({ ...client, daysUntilDischarge });
                        continue;
                    }
                }
                
                // Categorize by days in care
                if (daysInCare >= 0 && daysInCare <= 7) {
                    segments.week1.push(client);
                } else if (daysInCare >= 14 && daysInCare <= 16) {
                    // Critical aftercare window - check if aftercare thread sent
                    const needsAftercare = !client.aftercareThreadSent;
                    segments.day14to16.push({ ...client, daysInCare, needsAftercare });
                } else if (daysInCare >= 28 && daysInCare <= 32) {
                    segments.day30.push(client);
                } else if (daysInCare >= 45) {
                    segments.day45plus.push(client);
                }
            }
            
            return segments;
        } catch (error) {
            console.error('Failed to load journey data:', error);
            return {};
        }
    }

    /**
     * Load recent changes for the "Changes Today" widget
     * Tracks new admissions, approaching milestones, and status changes
     */
    async loadRecentChanges() {
        try {
            const clients = await this.getRelevantClients() || [];
            const now = new Date();
            const yesterday = new Date(now - 24 * 60 * 60 * 1000);
            
            const changes = {
                newAdmissions: [],
                approachingDay14: [],
                approachingDischarge: [],
                escalations: []
            };
            
            for (const client of clients) {
                // New admissions (admitted in last 24 hours)
                if (client.admissionDate) {
                    const admissionDate = new Date(client.admissionDate);
                    if (admissionDate >= yesterday && admissionDate <= now) {
                        changes.newAdmissions.push({
                            client,
                            type: 'admission',
                            message: `New admission: ${client.initials}`
                        });
                    }
                }
                
                // Approaching Day 14 (days 12-13)
                const daysInCare = this.calculateDaysInCare(client.admissionDate);
                if (daysInCare >= 12 && daysInCare <= 13) {
                    changes.approachingDay14.push({
                        client,
                        type: 'milestone',
                        daysInCare,
                        message: `${client.initials} approaching Day 14 (currently Day ${daysInCare})`
                    });
                }
                
                // Approaching discharge (within 3 days)
                if (client.dischargeDate && client.status === 'active') {
                    const daysUntilDischarge = this.calculateDaysUntil(client.dischargeDate);
                    if (daysUntilDischarge >= 0 && daysUntilDischarge <= 3) {
                        changes.approachingDischarge.push({
                            client,
                            type: 'discharge',
                            daysUntilDischarge,
                            message: `${client.initials} discharges in ${daysUntilDischarge} day${daysUntilDischarge !== 1 ? 's' : ''}`
                        });
                    }
                }
            }
            
            return changes;
        } catch (error) {
            console.error('Failed to load recent changes:', error);
            return {
                newAdmissions: [],
                approachingDay14: [],
                approachingDischarge: [],
                escalations: []
            };
        }
    }

    /**
     * Detect data gaps across clients for the Gaps Widget
     * Returns clients missing critical data points
     */
    async detectGaps() {
        try {
            const clients = await this.getRelevantClients() || [];
            const gaps = {
                missingDcDate: [],      // daysInCare > 14 && no dischargeDate
                noAftercareStarted: [], // daysInCare > 21 && !aftercareThreadSent
                missingCareTeam: []     // no caseManager AND no familyAmbassador
            };
            
            for (const client of clients) {
                if (client.status !== 'active') continue;
                const days = this.calculateDaysInCare(client.admissionDate);
                
                // Missing discharge date after 14 days
                if (days > 14 && !client.dischargeDate) {
                    gaps.missingDcDate.push({
                        ...client,
                        daysInCare: days,
                        gap: 'No discharge date set'
                    });
                }
                
                // No aftercare started after 21 days
                if (days > 21 && !client.aftercareThreadSent) {
                    gaps.noAftercareStarted.push({
                        ...client,
                        daysInCare: days,
                        gap: 'Aftercare not started'
                    });
                }
                
                // Missing care team assignment
                if (!client.caseManagerInitials && !client.familyAmbassadorPrimaryInitials) {
                    gaps.missingCareTeam.push({
                        ...client,
                        daysInCare: days,
                        gap: 'No care team assigned'
                    });
                }
            }
            
            return gaps;
        } catch (error) {
            console.error('Failed to detect gaps:', error);
            return {
                missingDcDate: [],
                noAftercareStarted: [],
                missingCareTeam: []
            };
        }
    }

    /**
     * Load intake/discharge pipeline data
     * Returns upcoming intakes and discharges for the Pipeline Widget
     */
    async loadPipelineData() {
        try {
            const clients = await this.getRelevantClients() || [];
            
            // Intakes: referralDate set but not yet admitted, OR admitted in last 3 days
            const intakes = clients.filter(c => {
                // Pre-admission clients
                if (c.referralDate && !c.admissionDate) return true;
                // Recently admitted (last 3 days)
                const days = this.calculateDaysInCare(c.admissionDate);
                return days >= 0 && days <= 3;
            }).map(c => ({
                ...c,
                daysInCare: this.calculateDaysInCare(c.admissionDate),
                isPreAdmission: !c.admissionDate
            }));
            
            // Discharges: active clients with discharge date in next 14 days
            const discharges = clients.filter(c => {
                if (c.status !== 'active' || !c.dischargeDate) return false;
                const daysUntil = this.calculateDaysUntil(c.dischargeDate);
                return daysUntil >= 0 && daysUntil <= 14;
            }).map(c => ({
                ...c,
                daysUntilDischarge: this.calculateDaysUntil(c.dischargeDate)
            })).sort((a, b) => a.daysUntilDischarge - b.daysUntilDischarge);
            
            return { intakes, discharges };
        } catch (error) {
            console.error('Failed to load pipeline data:', error);
            return { intakes: [], discharges: [] };
        }
    }

    async loadMetrics() {
        try {
            const clients = await this.getRelevantClients() || [];
            const today = new Date();
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - 7);
            
            let metrics = {
                todayAftercareOnTime: 0,
                todayAftercareTotal: 0,
                weekCompletionRate: 0,
                weekTotal: 0,
                weekComplete: 0,
                activeClients: clients.length,
                totalHouses: 6,
                weeklyGoal: 5,
                weeklyComplete: 0,
                trend: null
            };
            
            // Calculate metrics
            for (const client of clients) {
                const milestones = window.milestonesManager
                    ? await window.milestonesManager.getClientMilestones(client.id)
                    : [];
                const daysInCare = this.calculateDaysInCare(client.admissionDate);
                
                // Today's aftercare threads
                if (daysInCare === 14) {
                    metrics.todayAftercareTotal++;
                    const aftercare = milestones.find(m => m.milestone === 'aftercare_options_sent');
                    if (aftercare && aftercare.status === 'complete') {
                        metrics.todayAftercareOnTime++;
                    }
                }
                
                // Weekly metrics
                for (const milestone of milestones) {
                    if (milestone.updatedAt >= weekStart.getTime()) {
                        metrics.weekTotal++;
                        if (milestone.status === 'complete') {
                            metrics.weekComplete++;
                        }
                    }
                }
            }
            
            // Calculate completion rate
            if (metrics.weekTotal > 0) {
                metrics.weekCompletionRate = Math.round((metrics.weekComplete / metrics.weekTotal) * 100);
            }
            
            // Trend data requires historical tracking - only show if we have real data
            // metrics.trend is already null by default; don't add mock data
            
            return metrics;
        } catch (error) {
            console.error('Failed to load metrics:', error);
            return {};
        }
    }

    async getRelevantClients() {
        if (!window.clientManager?.getAllClients) {
            return [];
        }

        // Always load full list once so we can make smart decisions
        const allClients = await clientManager.getAllClients();

        // If view is set to "myClients", filter by coach assignment
        if (this.currentView === 'myClients' && this.currentCoach && !this.currentCoach.isAdmin) {
            const myClients = allClients.filter(client => 
                client.caseManagerInitials === this.currentCoach.initials ||
                client.familyAmbassadorPrimaryInitials === this.currentCoach.initials ||
                client.familyAmbassadorSecondaryInitials === this.currentCoach.initials
            );

            // Demo / safety fallback: if no clients are assigned to this coach but
            // there ARE clients in the system, fall back to all clients so the
            // dashboard never looks empty when data exists.
            if (myClients.length === 0 && allClients.length > 0) {
                console.warn(
                    '[Dashboard] No clients assigned to coach',
                    this.currentCoach?.initials,
                    '- falling back to all clients view.'
                );
                return allClients;
            }

            return myClients;
        }

        // Default: all clients
        return allClients;
    }

    calculateDaysInCare(admissionDate) {
        if (!admissionDate) return 0;
        const admission = new Date(admissionDate);
        const today = new Date();
        const diffTime = Math.abs(today - admission);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    calculateDaysUntil(targetDate) {
        if (!targetDate) return null;
        const target = new Date(targetDate);
        const today = new Date();
        const diffTime = target - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    calculateDaysSince(pastDate) {
        if (!pastDate) return null;
        const past = new Date(pastDate);
        const today = new Date();
        const diffTime = today - past;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    async refreshDashboard() {
        try {
            console.log('🔄 Refreshing dashboard...');
            this.cache.lastCacheTime = 0; // Invalidate cache
            await this.loadDashboardData();
            
            // Notify widgets to update
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
    }

    toggleView() {
        this.currentView = this.currentView === 'myClients' ? 'allClients' : 'myClients';
        this.savePreferences();
        this.refreshDashboard();
    }

    registerWidget(id, widget) {
        this.widgets.set(id, widget);
    }

    unregisterWidget(id) {
        this.widgets.delete(id);
    }

    getTimeAwareGreeting() {
        const hour = new Date().getHours();
        
        if (hour < 12) {
            return {
                greeting: `Good morning, ${this.currentCoach.initials}`,
                focus: "Here's your morning priorities",
                timeContext: 'morning'
            };
        } else if (hour < 17) {
            return {
                greeting: `Good afternoon, ${this.currentCoach.initials}`,
                focus: "Rest of day priorities",
                timeContext: 'afternoon'
            };
        } else {
            return {
                greeting: `Good evening, ${this.currentCoach.initials}`,
                focus: "Tomorrow's priorities",
                timeContext: 'evening'
            };
        }
    }

    async getQuickWins() {
        // Find tasks that can be completed in under 5 minutes
        if (!window.milestonesManager) {
            return [];
        }
        const clients = await this.getRelevantClients();
        const quickWins = [];
        
        for (const client of clients) {
            const milestones = window.milestonesManager
                ? await window.milestonesManager.getClientMilestones(client.id)
                : [];
            
            // Satisfaction surveys are typically quick
            const satisfactionSurvey = milestones.find(m => 
                m.milestone === 'satisfaction_survey' && m.status !== 'complete'
            );
            
            if (satisfactionSurvey) {
                quickWins.push({
                    type: 'survey',
                    client: client,
                    milestone: satisfactionSurvey,
                    estimatedTime: 2,
                    action: 'Complete satisfaction survey'
                });
            }
        }
        
        return quickWins;
    }

    async generateSmartSuggestions() {
        const timeContext = this.getTimeAwareGreeting().timeContext;
        const suggestions = [];
        
        // Time-based suggestions
        if (timeContext === 'morning') {
            const redZoneCount = this.cache.priorities?.red?.length || 0;
            if (redZoneCount > 0) {
                suggestions.push({
                    type: 'priority',
                    text: `Tackle your ${redZoneCount} red zone items before your 10am meeting`,
                    icon: '💡'
                });
            }
        }
        
        // Pattern-based suggestions (mock for now)
        const dayOfWeek = new Date().getDay();
        if (dayOfWeek === 1) { // Monday
            suggestions.push({
                type: 'pattern',
                text: 'You usually complete GAD assessments on Mondays',
                icon: '📊'
            });
        }
        
        // Quick wins available
        const quickWins = await this.getQuickWins();
        if (quickWins.length >= 3) {
            const totalTime = quickWins.reduce((sum, win) => sum + win.estimatedTime, 0);
            suggestions.push({
                type: 'quickwin',
                text: `You have ${quickWins.length} quick wins available (${totalTime} min total)`,
                icon: '⚡'
            });
        }
        
        return suggestions;
    }

    destroy() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.widgets.clear();
        this.cache = {};
    }
}

// Create singleton instance
const dashboardManager = new DashboardManager();
