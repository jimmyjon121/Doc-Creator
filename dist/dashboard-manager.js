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
            lastCacheTime: null
        };
        this.CACHE_DURATION = 60000; // 1 minute cache
        this.REFRESH_INTERVAL = 300000; // 5 minutes auto-refresh
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
        // Prefer enhanced profile if available
        try {
            if (typeof window.getEnhancedCurrentCoach === 'function') {
                const profile = window.getEnhancedCurrentCoach();
                if (profile && profile.initials) {
                    return {
                        initials: profile.initials,
                        role: (profile.role || 'Coach').toString().replace(/^./, c => c.toUpperCase()),
                        isAdmin: !!profile.isAdmin
                    };
                }
            }
        } catch (_) {
            // fall through to session-based logic
        }
        
        // Session-based fallback
        const userRole = sessionStorage.getItem('userRole') || 'Coach';
        const fullName = sessionStorage.getItem('fullName') || sessionStorage.getItem('username');
        const initialsFromName = fullName
            ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : null;
        const initials = initialsFromName || (userRole === 'Admin' ? 'AD' : 'LU');
        return {
            initials,
            role: userRole,
            isAdmin: userRole === 'Admin'
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
            
            // Then load remaining data
            const [houseData, journeyData, metricsData] = await Promise.all([
                this.loadHouseHealth(),
                this.loadJourneyData(),
                this.loadMetrics()
            ]);
            
            // Update cache
            this.cache = {
                priorities: criticalData,
                houseHealth: houseData,
                journeyData: journeyData,
                metrics: metricsData,
                lastCacheTime: Date.now()
            };
            
            this.lastUpdate = new Date();
            
            const loadTime = performance.now() - startTime;
            console.log(`✅ Dashboard data loaded in ${loadTime.toFixed(0)}ms`);
            
            return this.cache;
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            throw error;
        }
    }

    isCacheValid() {
        if (!this.cache.lastCacheTime) return false;
        return Date.now() - this.cache.lastCacheTime < this.CACHE_DURATION;
    }

    async loadCriticalAlerts() {
        try {
            const clients = await this.getRelevantClients();
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
                
                // Day 16+: treat as overdue milestone (no escalation UI)
                if (daysInCare >= 16) {
                    const aftercareStarted = milestones.find(m => 
                        m.milestone === 'aftercare_options_sent' && m.status === 'complete'
                    );
                    
                    if (!aftercareStarted) {
                        alerts.push({
                            type: 'milestone_aftercare_critical',
                            priority: 'red',
                            client: client,
                            milestone: { milestone: 'aftercare_options_sent', status: 'pending' },
                            message: `Day ${daysInCare} - CRITICAL: Aftercare overdue`,
                            action: 'Mark Complete',
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

    async loadHouseHealth() {
        try {
            const houses = await housesManager.getHouses();
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
            const clients = await this.getRelevantClients();
            const segments = {
                admission: [],
                week1: [],
                day14: [],
                day30: [],
                day45plus: [],
                discharge: []
            };
            
            for (const client of clients) {
                const daysInCare = this.calculateDaysInCare(client.admissionDate);
                
                if (client.dischargeDate) {
                    const daysUntilDischarge = this.calculateDaysUntil(client.dischargeDate);
                    if (daysUntilDischarge <= 7 && daysUntilDischarge >= 0) {
                        segments.discharge.push({ ...client, daysUntilDischarge });
                        continue;
                    }
                }
                
                if (daysInCare <= 1) {
                    segments.admission.push(client);
                } else if (daysInCare <= 7) {
                    segments.week1.push(client);
                } else if (daysInCare <= 14) {
                    segments.day14.push(client);
                } else if (daysInCare <= 30) {
                    segments.day30.push(client);
                } else {
                    segments.day45plus.push(client);
                }
            }
            
            return segments;
        } catch (error) {
            console.error('Failed to load journey data:', error);
            return {};
        }
    }

    async loadMetrics() {
        try {
            const clients = await this.getRelevantClients();
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
            
            // Compare to last week (would need historical data)
            metrics.trend = { direction: 'up', percentage: 12 }; // Mock data
            
            return metrics;
        } catch (error) {
            console.error('Failed to load metrics:', error);
            return {};
        }
    }

    async getRelevantClients() {
        if (this.currentView === 'myClients' && !this.currentCoach.isAdmin) {
            // Filter by coach assignment
            const allClients = await clientManager.getAllClients();
            const myClients = allClients.filter(client => 
                client.caseManagerInitials === this.currentCoach.initials ||
                client.familyAmbassadorPrimaryInitials === this.currentCoach.initials ||
                client.familyAmbassadorSecondaryInitials === this.currentCoach.initials
            );
            // Fallback: if none assigned, show All Clients to avoid empty dashboard
            if (myClients.length === 0) {
                this.currentView = 'allClients';
                this.savePreferences();
                this.updateViewToggleUI();
                return allClients;
            }
            return myClients;
        } else {
            // All clients
            return await clientManager.getAllClients();
        }
    }

    updateViewToggleUI() {
        try {
            const container = document.querySelector('.view-toggle');
            if (!container) return;
            const [btnMy, btnAll] = container.querySelectorAll('button');
            if (!btnMy || !btnAll) return;
            if (this.currentView === 'myClients') {
                btnMy.classList.add('active');
                btnAll.classList.remove('active');
            } else {
                btnAll.classList.add('active');
                btnMy.classList.remove('active');
            }
        } catch (_) {
            // no-op if structure changes
        }
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
