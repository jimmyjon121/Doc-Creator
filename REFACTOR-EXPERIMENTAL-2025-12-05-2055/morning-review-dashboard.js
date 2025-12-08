/**
 * @fileoverview Morning Review Dashboard - Daily Priorities View
 * @module ui/MorningReviewDashboard
 * @status @canonical (but uses legacy TrackerEngine)
 * 
 * PURPOSE:
 *   Generates a consolidated "morning review" of clients requiring attention,
 *   urgent tasks, and daily priorities for clinical coaches. Displays on the
 *   Dashboard tab as the primary daily workflow entry point.
 * 
 * FEATURES:
 *   - Time-based greetings (morning/afternoon/evening)
 *   - Overdue items aggregation
 *   - Due today task list
 *   - Upcoming items (next 3-7 days)
 *   - Batch action suggestions
 *   - AI-generated insights (when available)
 * 
 * DEPENDENCIES:
 *   - window.trackerEngine (TrackerEngine) - @legacy - compliance scoring
 *   - window.clientManager (ClientManager) - Client data access
 *   - window.indexedDBManager (IndexedDBManager) - Persistence layer
 *   - window.DateHelpers (optional) - Date calculations
 * 
 * EXPORTS TO WINDOW:
 *   - window.morningReview - Singleton instance
 *   - window.MorningReviewDashboard - Class constructor
 * 
 * STILL USES LEGACY:
 *   - TrackerEngine for compliance calculations
 *   - Future migration should align with TaskService for task status
 * 
 * RENDERING:
 *   - Renders into #morningReviewContainer in Dashboard tab
 *   - Called by dashboardManager on tab switch
 * 
 * @see REFACTOR-MASTER-PLAN.md - Phase 5 for TrackerEngine migration
 */

class MorningReviewDashboard {
    constructor() {
        this.dbManager = window.indexedDBManager;
        // TrackerEngine is legacy but still required for compliance calculations
        if (typeof TrackerEngine !== 'undefined' && !window.trackerEngine) {
            window.trackerEngine = new TrackerEngine();
        }
        this.trackerEngine = window.trackerEngine || null;
        this.clientManager = window.clientManager;
        
        // Time-based greetings
        this.greetings = {
            morning: ['Good morning!', '☀️ Ready to make today count?', '🌅 Let\'s tackle today\'s priorities'],
            afternoon: ['Good afternoon!', '☕ Afternoon check-in', '📋 Mid-day review'],
            evening: ['Good evening!', '🌙 End of day summary', '✨ Wrapping up today']
        };
    }
    
    /**
     * Generate morning review data
     */
    async generateMorningReview() {
        const clients = await this.getAllActiveClients();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const review = {
            date: today,
            greeting: this.getTimeBasedGreeting(),
            summary: {
                totalClients: clients.length,
                tasksToday: 0,
                overdueItems: 0,
                upcomingItems: 0,
                criticalAlerts: 0
            },
            sections: {
                overdue: [],
                dueToday: [],
                upcoming: [],
                followUps: [],
                opportunities: []
            },
            batchActions: [],
            insights: []
        };
        
        // Analyze each client
        for (const client of clients) {
            const analysis = await this.analyzeClientForReview(client);
            
            // Categorize items
            analysis.overdue.forEach(item => review.sections.overdue.push(item));
            analysis.dueToday.forEach(item => review.sections.dueToday.push(item));
            analysis.upcoming.forEach(item => review.sections.upcoming.push(item));
            analysis.followUps.forEach(item => review.sections.followUps.push(item));
            
            // Update summary
            review.summary.overdueItems += analysis.overdue.length;
            review.summary.tasksToday += analysis.dueToday.length;
            review.summary.upcomingItems += analysis.upcoming.length;
            if (analysis.critical) review.summary.criticalAlerts++;
        }
        
        // Sort by priority
        review.sections.overdue.sort((a, b) => b.daysPastDue - a.daysPastDue);
        review.sections.dueToday.sort((a, b) => a.priority - b.priority);
        
        // Identify batch actions
        review.batchActions = this.identifyBatchActions(review.sections);
        
        // Generate insights
        review.insights = this.generateDailyInsights(review);
        
        // Identify opportunities
        review.sections.opportunities = await this.identifyOpportunities(clients);
        
        return review;
    }
    
    /**
     * Analyze individual client for morning review
     */
    async analyzeClientForReview(client) {
        const score = this.trackerEngine.getCompletionScore(client);
        const daysInCare = this.trackerEngine.calculateDaysInCare(client.admissionDate);
        const daysToDischarge = this.trackerEngine.calculateDaysToDischarge(client);
        
        const analysis = {
            client,
            overdue: [],
            dueToday: [],
            upcoming: [],
            followUps: [],
            critical: false
        };
        
        // Check each requirement
        for (const req of this.trackerEngine.requirements) {
            if (client[req.id]) continue; // Already completed
            
            const daysUntilDue = req.dueByDay - daysInCare;
            
            if (daysUntilDue < 0) {
                // Overdue
                analysis.overdue.push({
                    client,
                    item: req,
                    daysPastDue: Math.abs(daysUntilDue),
                    priority: req.critical ? 1 : 2,
                    type: 'overdue'
                });
                if (req.critical) analysis.critical = true;
            } else if (daysUntilDue === 0) {
                // Due today
                analysis.dueToday.push({
                    client,
                    item: req,
                    priority: req.critical ? 1 : 2,
                    type: 'due_today'
                });
            } else if (daysUntilDue <= 3) {
                // Upcoming
                analysis.upcoming.push({
                    client,
                    item: req,
                    daysUntilDue,
                    priority: req.critical ? 1 : 2,
                    type: 'upcoming'
                });
            }
        }
        
        // Check for follow-ups
        if (client.aftercareOptions && client.aftercareOptions.length > 0) {
            const pendingOptions = client.aftercareOptions.filter(opt => 
                opt.status === 'sent' || opt.status === 'pending'
            );
            
            if (pendingOptions.length > 0) {
                analysis.followUps.push({
                    client,
                    type: 'aftercare_followup',
                    options: pendingOptions,
                    daysSinceSent: this.calculateDaysSince(pendingOptions[0].sentDate)
                });
            }
        }
        
        return analysis;
    }
    
    /**
     * Get all active clients
     */
    async getAllActiveClients() {
        const clients = await this.clientManager.getAllClients();
        return clients.filter(c => 
            c.status === 'active' && 
            !c.dischargeDate || new Date(c.dischargeDate) > new Date()
        );
    }
    
    /**
     * Get time-based greeting
     */
    getTimeBasedGreeting() {
        const hour = new Date().getHours();
        let timeOfDay = 'morning';
        
        if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
        else if (hour >= 17) timeOfDay = 'evening';
        
        const greetings = this.greetings[timeOfDay];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }
    
    /**
     * Identify batch actions
     */
    identifyBatchActions(sections) {
        const batchActions = [];
        
        // Group by item type
        const itemGroups = {};
        [...sections.overdue, ...sections.dueToday].forEach(task => {
            const itemId = task.item.id;
            if (!itemGroups[itemId]) itemGroups[itemId] = [];
            itemGroups[itemId].push(task);
        });
        
        // Find items that can be batched
        Object.entries(itemGroups).forEach(([itemId, tasks]) => {
            if (tasks.length >= 2) {
                const item = tasks[0].item;
                batchActions.push({
                    itemId,
                    itemLabel: item.label,
                    count: tasks.length,
                    clients: tasks.map(t => t.client),
                    estimatedTime: tasks.length * 5, // 5 minutes per item
                    priority: item.critical ? 'high' : 'medium'
                });
            }
        });
        
        // Sort by count (most items first)
        batchActions.sort((a, b) => b.count - a.count);
        
        return batchActions;
    }
    
    /**
     * Generate daily insights
     */
    generateDailyInsights(review) {
        const insights = [];
        
        // Overdue crisis
        if (review.summary.overdueItems > 10) {
            insights.push({
                type: 'critical',
                message: `${review.summary.overdueItems} overdue items need immediate attention`,
                priority: 1
            });
        }
        
        // Batch opportunity
        if (review.batchActions.length > 0) {
            const totalBatchable = review.batchActions.reduce((sum, b) => sum + b.count, 0);
            const timeSaved = totalBatchable * 2; // 2 minutes saved per batched item
            insights.push({
                type: 'efficiency',
                message: `Batch ${totalBatchable} similar items to save ~${timeSaved} minutes`,
                priority: 2
            });
        }
        
        // Heavy day warning
        if (review.summary.tasksToday > 20) {
            insights.push({
                type: 'warning',
                message: `Heavy day ahead with ${review.summary.tasksToday} tasks due`,
                priority: 2
            });
        }
        
        // Follow-up reminder
        const oldFollowUps = review.sections.followUps.filter(f => f.daysSinceSent > 3);
        if (oldFollowUps.length > 0) {
            insights.push({
                type: 'reminder',
                message: `${oldFollowUps.length} aftercare options need follow-up (>3 days)`,
                priority: 3
            });
        }
        
        // Positive reinforcement
        if (review.summary.overdueItems === 0 && review.summary.tasksToday < 10) {
            insights.push({
                type: 'success',
                message: 'Great job! All caught up with a light day ahead',
                priority: 4
            });
        }
        
        return insights;
    }
    
    /**
     * Identify opportunities for proactive work
     */
    async identifyOpportunities(clients) {
        const opportunities = [];
        
        for (const client of clients) {
            const score = this.trackerEngine.getCompletionScore(client);
            const daysInCare = this.trackerEngine.calculateDaysInCare(client.admissionDate);
            
            // Early aftercare opportunity
            if (daysInCare >= 10 && daysInCare <= 12 && !client.aftercareThreadSent) {
                opportunities.push({
                    type: 'early_aftercare',
                    client,
                    message: `Start aftercare planning for ${client.initials} (day ${daysInCare})`,
                    benefit: 'Getting ahead of day 14 deadline'
                });
            }
            
            // Batch assessment opportunity
            if (!client.gadCompleted && !client.phqCompleted && daysInCare >= 5) {
                opportunities.push({
                    type: 'batch_assessments',
                    client,
                    message: `Complete both GAD & PHQ for ${client.initials}`,
                    benefit: 'Knock out both assessments together'
                });
            }
            
            // Discharge prep opportunity
            const daysToDischarge = this.trackerEngine.calculateDaysToDischarge(client);
            if (daysToDischarge && daysToDischarge <= 7 && score.overallPercentage >= 80) {
                opportunities.push({
                    type: 'discharge_prep',
                    client,
                    message: `Begin discharge prep for ${client.initials} (${daysToDischarge} days)`,
                    benefit: 'Smooth transition with early preparation'
                });
            }
        }
        
        return opportunities;
    }
    
    /**
     * Calculate days since a date
     */
    calculateDaysSince(dateString) {
        if (!dateString) return 0;
        const date = new Date(dateString);
        const today = new Date();
        return Math.floor((today - date) / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Render morning review modal - Clean Professional Design
     */
    async renderMorningReview() {
        const review = await this.generateMorningReview();
        const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        
        // Only show top 4 batch actions for cleaner UI
        const topBatches = review.batchActions.slice(0, 4);
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay morning-review-modal';
        modal.innerHTML = `
            <div class="mr-panel">
                <!-- Clean Header -->
                <header class="mr-header">
                    <div class="mr-header__left">
                        <span class="mr-date">${dateStr}</span>
                        <h1 class="mr-title">Coach Mission Control</h1>
                    </div>
                    <button class="mr-close" onclick="this.closest('.modal-overlay').remove()" aria-label="Close">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                    </button>
                </header>
                
                <!-- KPI Row -->
                <div class="mr-kpis">
                    <div class="mr-kpi ${review.summary.overdueItems > 0 ? 'mr-kpi--alert' : 'mr-kpi--neutral'}">
                        <span class="mr-kpi__value">${review.summary.overdueItems}</span>
                        <span class="mr-kpi__label">Overdue</span>
                    </div>
                    <div class="mr-kpi mr-kpi--primary">
                        <span class="mr-kpi__value">${review.summary.tasksToday}</span>
                        <span class="mr-kpi__label">Due Today</span>
                    </div>
                    <div class="mr-kpi mr-kpi--secondary">
                        <span class="mr-kpi__value">${review.summary.upcomingItems}</span>
                        <span class="mr-kpi__label">Next 3 Days</span>
                    </div>
                    <div class="mr-kpi mr-kpi--success">
                        <span class="mr-kpi__value">${review.sections.opportunities.length}</span>
                        <span class="mr-kpi__label">Opportunities</span>
                    </div>
                </div>
                
                <!-- Alerts Banner (only show most critical) -->
                ${review.insights.length > 0 ? `
                    <div class="mr-alerts">
                        ${review.insights.slice(0, 2).map(insight => `
                            <div class="mr-alert mr-alert--${insight.type}">
                                <span class="mr-alert__icon">${this.getInsightIcon(insight.type)}</span>
                                <span class="mr-alert__text">${insight.message}</span>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                
                <!-- Quick Actions Grid (max 4) -->
                ${topBatches.length > 0 ? `
                    <section class="mr-section">
                        <h2 class="mr-section__title">
                            <span class="mr-section__icon">⚡</span>
                            Quick Actions
                        </h2>
                        <div class="mr-actions">
                            ${topBatches.map(batch => `
                                <div class="mr-action-card">
                                    <div class="mr-action-card__header">
                                        <span class="mr-action-card__badge">${batch.count}</span>
                                        <span class="mr-action-card__time">${batch.estimatedTime} min</span>
                                    </div>
                                    <h3 class="mr-action-card__title">${batch.itemLabel}</h3>
                                    <p class="mr-action-card__clients">
                                        ${batch.clients.slice(0, 5).map(c => c.initials).join(' · ')}
                                        ${batch.clients.length > 5 ? ` +${batch.clients.length - 5}` : ''}
                                    </p>
                                    <button 
                                        class="mr-action-card__btn" 
                                        data-item-id="${batch.itemId}" 
                                        data-client-ids="${batch.clients.map(c => c.id).join(',')}"
                                        onclick="morningReview.handleBatchClick(this)">
                                        Start
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                    </section>
                ` : ''}
                
                <!-- Task Lists -->
                <div class="mr-tasks">
                    ${this.renderTaskSection('Overdue', review.sections.overdue, 'overdue')}
                    ${this.renderTaskSection('Due Today', review.sections.dueToday, 'today')}
                    ${this.renderTaskSection('Coming Up', review.sections.upcoming, 'upcoming')}
                </div>
                
                <!-- Footer -->
                <footer class="mr-footer">
                    <button class="mr-btn mr-btn--ghost" onclick="morningReview.printReview()">Print</button>
                    <button class="mr-btn mr-btn--primary" onclick="this.closest('.modal-overlay').remove()">
                        Let's Go
                    </button>
                </footer>
            </div>
            
            <style>
                /* Morning Review Panel - Clean Professional Design */
                .mr-panel {
                    background: linear-gradient(145deg, #0f172a 0%, #1e293b 100%);
                    border-radius: 16px;
                    width: 100%;
                    max-width: 900px;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.05);
                }
                
                .mr-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    padding: 28px 32px 20px;
                    border-bottom: 1px solid rgba(255,255,255,0.06);
                }
                
                .mr-header__left { display: flex; flex-direction: column; gap: 4px; }
                
                .mr-date {
                    font-size: 13px;
                    color: rgba(148, 163, 184, 0.8);
                    font-weight: 500;
                    letter-spacing: 0.02em;
                }
                
                .mr-title {
                    font-size: 24px;
                    font-weight: 700;
                    color: #f1f5f9;
                    margin: 0;
                    letter-spacing: -0.02em;
                }
                
                .mr-close {
                    background: rgba(255,255,255,0.04);
                    border: none;
                    border-radius: 8px;
                    padding: 8px;
                    cursor: pointer;
                    color: rgba(148, 163, 184, 0.7);
                    transition: all 0.15s ease;
                }
                .mr-close:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }
                
                /* KPI Row */
                .mr-kpis {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 16px;
                    padding: 24px 32px;
                }
                
                .mr-kpi {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.06);
                    border-radius: 12px;
                    padding: 20px 16px;
                    text-align: center;
                    transition: all 0.2s ease;
                }
                .mr-kpi:hover { background: rgba(255,255,255,0.05); transform: translateY(-2px); }
                
                .mr-kpi__value {
                    display: block;
                    font-size: 36px;
                    font-weight: 700;
                    line-height: 1;
                    margin-bottom: 6px;
                    font-variant-numeric: tabular-nums;
                }
                
                .mr-kpi__label {
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                    color: rgba(148, 163, 184, 0.7);
                }
                
                .mr-kpi--alert { border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.08); }
                .mr-kpi--alert .mr-kpi__value { color: #f87171; }
                
                .mr-kpi--primary { border-color: rgba(59, 130, 246, 0.3); background: rgba(59, 130, 246, 0.08); }
                .mr-kpi--primary .mr-kpi__value { color: #60a5fa; }
                
                .mr-kpi--secondary { border-color: rgba(139, 92, 246, 0.3); background: rgba(139, 92, 246, 0.08); }
                .mr-kpi--secondary .mr-kpi__value { color: #a78bfa; }
                
                .mr-kpi--success { border-color: rgba(34, 197, 94, 0.3); background: rgba(34, 197, 94, 0.08); }
                .mr-kpi--success .mr-kpi__value { color: #4ade80; }
                
                .mr-kpi--neutral .mr-kpi__value { color: #94a3b8; }
                
                /* Alerts */
                .mr-alerts {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                    padding: 0 32px 20px;
                }
                
                .mr-alert {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 14px 18px;
                    border-radius: 10px;
                    font-size: 14px;
                    font-weight: 500;
                }
                
                .mr-alert--critical {
                    background: linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(239,68,68,0.08) 100%);
                    border-left: 3px solid #ef4444;
                    color: #fca5a5;
                }
                
                .mr-alert--warning {
                    background: linear-gradient(135deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.08) 100%);
                    border-left: 3px solid #f59e0b;
                    color: #fcd34d;
                }
                
                .mr-alert--efficiency {
                    background: linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.08) 100%);
                    border-left: 3px solid #3b82f6;
                    color: #93c5fd;
                }
                
                .mr-alert__icon { font-size: 18px; flex-shrink: 0; }
                .mr-alert__text { flex: 1; }
                
                /* Section */
                .mr-section {
                    padding: 20px 32px;
                    border-top: 1px solid rgba(255,255,255,0.04);
                }
                
                .mr-section__title {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 15px;
                    font-weight: 600;
                    color: #e2e8f0;
                    margin: 0 0 16px 0;
                    letter-spacing: -0.01em;
                }
                
                .mr-section__icon { font-size: 16px; }
                
                /* Quick Actions Grid */
                .mr-actions {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
                    gap: 14px;
                }
                
                .mr-action-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.08);
                    border-radius: 12px;
                    padding: 18px;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.2s ease;
                }
                .mr-action-card:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(99, 102, 241, 0.3);
                    transform: translateY(-2px);
                }
                
                .mr-action-card__header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .mr-action-card__badge {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    font-size: 12px;
                    font-weight: 700;
                    padding: 4px 10px;
                    border-radius: 20px;
                }
                
                .mr-action-card__time {
                    font-size: 12px;
                    color: rgba(148, 163, 184, 0.7);
                }
                
                .mr-action-card__title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #f1f5f9;
                    margin: 0 0 8px 0;
                    line-height: 1.3;
                }
                
                .mr-action-card__clients {
                    font-size: 13px;
                    color: rgba(148, 163, 184, 0.6);
                    margin: 0 0 14px 0;
                    flex: 1;
                }
                
                .mr-action-card__btn {
                    background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    padding: 10px 16px;
                    font-size: 13px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                .mr-action-card__btn:hover { filter: brightness(1.1); transform: translateY(-1px); }
                
                /* Task Lists */
                .mr-tasks {
                    padding: 0 32px 24px;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                
                /* Footer */
                .mr-footer {
                    display: flex;
                    justify-content: flex-end;
                    gap: 12px;
                    padding: 20px 32px;
                    border-top: 1px solid rgba(255,255,255,0.06);
                    background: rgba(0,0,0,0.15);
                }
                
                .mr-btn {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                
                .mr-btn--ghost {
                    background: transparent;
                    border: 1px solid rgba(255,255,255,0.12);
                    color: rgba(255,255,255,0.7);
                }
                .mr-btn--ghost:hover { background: rgba(255,255,255,0.05); color: #f1f5f9; }
                
                .mr-btn--primary {
                    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
                    border: none;
                    color: white;
                }
                .mr-btn--primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
                
                /* Responsive */
                @media (max-width: 640px) {
                    .mr-kpis { grid-template-columns: repeat(2, 1fr); }
                    .mr-actions { grid-template-columns: 1fr; }
                }
            </style>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Render task section - Clean compact design
     */
    renderTaskSection(title, tasks, type) {
        if (tasks.length === 0) return '';
        
        const icons = { overdue: '🔴', today: '🔵', upcoming: '🟣' };
        const colors = { 
            overdue: 'rgba(239,68,68,0.15)', 
            today: 'rgba(59,130,246,0.15)', 
            upcoming: 'rgba(139,92,246,0.15)' 
        };
        const borderColors = { overdue: '#ef4444', today: '#3b82f6', upcoming: '#8b5cf6' };
        
        // Limit to first 5 tasks for cleaner view
        const displayTasks = tasks.slice(0, 5);
        const remaining = tasks.length - 5;
        
        return `
            <div class="mr-task-section" style="
                background: ${colors[type]};
                border-left: 3px solid ${borderColors[type]};
                border-radius: 10px;
                padding: 16px 20px;
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: 600; color: #e2e8f0; display: flex; align-items: center; gap: 8px;">
                        <span>${icons[type]}</span>
                        ${title}
                        <span style="background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px; font-size: 12px; color: rgba(255,255,255,0.7);">${tasks.length}</span>
                    </h3>
                </div>
                <div style="display: flex; flex-direction: column; gap: 8px;">
                    ${displayTasks.map(task => `
                        <div style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            background: rgba(0,0,0,0.2);
                            padding: 10px 14px;
                            border-radius: 8px;
                        ">
                            <span style="
                                font-weight: 700;
                                color: #f1f5f9;
                                font-size: 13px;
                                min-width: 32px;
                            ">${task.client.initials}</span>
                            <span style="flex: 1; font-size: 13px; color: rgba(255,255,255,0.75);">${task.item.label}</span>
                            ${task.daysPastDue ? `<span style="font-size: 11px; color: #f87171; font-weight: 600;">${task.daysPastDue}d late</span>` : ''}
                            ${task.daysUntilDue ? `<span style="font-size: 11px; color: rgba(148,163,184,0.7);">in ${task.daysUntilDue}d</span>` : ''}
                            <button onclick="morningReview.openClient('${task.client.id}')" style="
                                background: rgba(255,255,255,0.08);
                                border: none;
                                border-radius: 6px;
                                padding: 6px 12px;
                                font-size: 12px;
                                color: rgba(255,255,255,0.8);
                                cursor: pointer;
                                transition: all 0.15s ease;
                            " onmouseover="this.style.background='rgba(255,255,255,0.15)'" onmouseout="this.style.background='rgba(255,255,255,0.08)'">
                                Open
                            </button>
                        </div>
                    `).join('')}
                    ${remaining > 0 ? `
                        <div style="text-align: center; padding: 8px; font-size: 12px; color: rgba(148,163,184,0.6);">
                            +${remaining} more items
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    /**
     * Render follow-up section
     */
    renderFollowUpSection(followUps) {
        if (followUps.length === 0) return '';
        
        return `
            <div class="review-section followups">
                <h3>📞 Aftercare Follow-ups Needed</h3>
                <div class="followup-list">
                    ${followUps.map(f => `
                        <div class="followup-item">
                            <div class="followup-client">${f.client.initials} - ${this.getHouseDisplayName(f.client.houseId)}</div>
                            <div class="followup-options">
                                ${f.options.map(opt => `
                                    <span class="option-tag">${opt.programName} (${f.daysSinceSent} days)</span>
                                `).join('')}
                            </div>
                            <button class="btn-followup" onclick="morningReview.recordFollowUp('${f.client.id}')">
                                Record Follow-up
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render opportunities section
     */
    renderOpportunitiesSection(opportunities) {
        if (opportunities.length === 0) return '';
        
        return `
            <div class="review-section opportunities">
                <h3>💡 Proactive Opportunities</h3>
                <div class="opportunity-list">
                    ${opportunities.map(opp => `
                        <div class="opportunity-item">
                            <div class="opp-icon">${this.getOpportunityIcon(opp.type)}</div>
                            <div class="opp-details">
                                <div class="opp-message">${opp.message}</div>
                                <div class="opp-benefit">${opp.benefit}</div>
                            </div>
                            <button class="btn-opportunity" onclick="morningReview.takeOpportunity('${opp.type}', '${opp.client.id}')">
                                Do It
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Get icon for insight type
     */
    getInsightIcon(type) {
        const icons = {
            critical: '🚨',
            warning: '⚠️',
            efficiency: '⚡',
            reminder: '🔔',
            success: '✅'
        };
        return icons[type] || '📌';
    }
    
    /**
     * Get icon for opportunity type
     */
    getOpportunityIcon(type) {
        const icons = {
            early_aftercare: '🏠',
            batch_assessments: '📊',
            discharge_prep: '✈️'
        };
        return icons[type] || '💡';
    }
    
    // Action handlers
    async completeTask(clientId, itemId) {
        await window.clientManager.updateClient(clientId, {
            [itemId]: true,
            [itemId + 'Date']: new Date().toISOString()
        });
        
        // Update UI
        const checkbox = document.querySelector(`#task-${clientId}-${itemId}`);
        if (checkbox) {
            checkbox.closest('.review-task-item').style.opacity = '0.5';
            checkbox.closest('.review-task-item').style.textDecoration = 'line-through';
        }
        
        // Refresh dashboard
        if (window.dashboardManager) {
            window.dashboardManager.refreshDashboard();
        }
    }

    /**
     * Entry point from the DOM for batch cards.
     * Safely pulls data attributes and delegates to executeBatch.
     */
    handleBatchClick(buttonEl) {
        if (!buttonEl) return;
        const itemId = buttonEl.getAttribute('data-item-id');
        const rawIds = buttonEl.getAttribute('data-client-ids') || '';
        const clientIds = rawIds.split(',').map(id => id.trim()).filter(Boolean);
        if (!itemId || clientIds.length === 0) {
            console.warn('Batch click missing data attributes', { itemId, clientIds });
            return;
        }
        this.executeBatch(itemId, clientIds);
    }

    /**
     * Entry point from the DOM for the “Mark Batch Completed” button.
     */
    handleBatchConfirm(buttonEl) {
        if (!buttonEl) return;
        const itemId = buttonEl.getAttribute('data-item-id');
        const rawIds = buttonEl.getAttribute('data-client-ids') || '';
        const clientIds = rawIds.split(',').map(id => id.trim()).filter(Boolean);
        if (!itemId || clientIds.length === 0) {
            console.warn('Batch confirm missing data attributes', { itemId, clientIds });
            return;
        }
        this.confirmBatch(itemId, clientIds);
    }

    /**
     * Prompt-driven batch flow:
     *  - Start Batch: opens a confirmation panel with instructions
     *  - Mark Batch Completed: actually updates CareConnect + refreshes dashboard
     */
    async executeBatch(itemId, clientIds) {
        if (!Array.isArray(clientIds) || clientIds.length === 0) return;

        const requirement = this.trackerEngine?.requirements?.find(r => r.id === itemId) || null;
        const label = requirement?.label || itemId;
        const estimatedTime = requirement?.estimatedMinutes || (clientIds.length * 5);

        // Resolve client objects so we can show real initials instead of blank list
        let resolvedClients = [];
        if (this.clientManager && typeof this.clientManager.getClient === 'function') {
            for (const id of clientIds) {
                try {
                    // eslint-disable-next-line no-await-in-loop
                    const client = await this.clientManager.getClient(id);
                    if (client) {
                        resolvedClients.push(client);
                    }
                } catch (e) {
                    console.warn('Failed to load client for batch', id, e);
                }
            }
        } else if (this.trackerEngine && Array.isArray(this.trackerEngine.clients)) {
            resolvedClients = this.trackerEngine.clients.filter(c => clientIds.includes(c.id));
        }

        const previewClients = resolvedClients.slice(0, 12);
        const remainingCount = clientIds.length - previewClients.length;

        // Render each client as a pill so initials are highly visible
        const pillsHtml = previewClients.map(c => {
            const label = (c.initials || c.fullName || c.id || '').toString().toUpperCase();
            const house = c.houseId ? ` · ${c.houseId.replace('house_', '')}` : '';
            return `
                <span class="batch-client-pill">
                    <span class="batch-client-pill__initials">${label}</span>
                    ${house ? `<span class="batch-client-pill__house">${house}</span>` : ''}
                </span>
            `;
        }).join('');

        const moreHtml = remainingCount > 0
            ? `<span class="batch-client-pill batch-client-pill--more">+${remainingCount} more</span>`
            : '';

        const clientsPreviewHtml = (pillsHtml || moreHtml)
            ? `${pillsHtml}${moreHtml}`
            : '<span class="batch-client-pill batch-client-pill--empty">(client list unavailable)</span>';

        // Build lightweight overlay on top of the existing Morning Review modal
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay morning-batch-modal';
        overlay.innerHTML = `
            <div class="modal-content" style="max-width: 620px;">
                <div class="modal-header">
                    <h2 style="margin:0;font-size:22px;font-weight:700;color:#111827;">
                        Start Batch: ${label}
                    </h2>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                <div class="modal-body" style="font-size:14px;color:#374151;display:flex;flex-direction:column;gap:16px;">
                    <p style="margin:0;">
                        This batch will help you complete <strong>${label}</strong> for 
                        <strong>${clientIds.length} clients</strong> in one focused block (~${estimatedTime} min).
                    </p>
                    <ol style="padding-left:20px;margin:0;display:flex;flex-direction:column;gap:6px;">
                        <li>Go to <strong>Kipu</strong> and complete <strong>${label}</strong> for the clients listed below.</li>
                        <li>Once finished in Kipu, return here and click <strong>Mark Batch Completed</strong> to reflect it in CareConnect.</li>
                    </ol>
                    <div style="background:#f9fafb;border-radius:8px;border:1px solid #e5e7eb;padding:10px 12px;font-size:13px;max-height:140px;overflow:auto;">
                        <div style="font-weight:600;color:#111827;margin-bottom:4px;">Clients in this batch</div>
                        <div class="batch-client-pill-row">${clientsPreviewHtml}</div>
                    </div>
                    <p style="margin:0;font-size:12px;color:#6b7280;">
                        Note: CareConnect does <strong>not</strong> send anything to insurance or Kipu. 
                        It simply tracks that these items are documented as complete.
                    </p>
                </div>
                <div class="modal-footer" style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px;">
                    <button class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
                    <button 
                        class="btn-primary"
                        data-item-id="${itemId}"
                        data-client-ids="${clientIds.join(',')}"
                        onclick="morningReview.handleBatchConfirm(this)">
                        Mark Batch Completed
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);
    }

    async confirmBatch(itemId, clientIds) {
        if (!window.clientManager || !Array.isArray(clientIds) || clientIds.length === 0) return;

        try {
            const now = new Date().toISOString();
            for (const clientId of clientIds) {
                await window.clientManager.updateClient(clientId, {
                    [itemId]: true,
                    [`${itemId}Date`]: now
                });
            }

            // Refresh dashboard + re-open a fresh morning review
            if (window.dashboardManager) {
                await window.dashboardManager.refreshDashboard();
            }

            // Close any batch modal overlays
            document.querySelectorAll('.morning-batch-modal').forEach(el => el.remove());

            if (window.showNotification) {
                window.showNotification(`Marked ${clientIds.length} ${itemId} items complete`, 'success');
            }

            // Refresh the morning review modal itself so counts/cards disappear immediately
            const modal = document.querySelector('.morning-review-modal');
            if (modal) {
                modal.remove();
            }
            this.renderMorningReview();
        } catch (error) {
            console.error('Failed to confirm batch', itemId, error);
            if (window.showNotification) {
                window.showNotification('Unable to complete batch. Please try again.', 'error');
            }
        }
    }
    
    openClient(clientId) {
        // Close the Morning Review modal
        const modal = document.querySelector('.morning-review-modal');
        if (modal) {
            modal.remove();
        }

        // Prefer opening the modern client profile
        if (window.clientProfileManager && typeof window.clientProfileManager.open === 'function') {
            window.clientProfileManager.open(clientId);
            return;
        }

        // Fallback: switch to Clients tab
        if (window.switchTab) {
            window.switchTab('clients');
        }
    }
    
    recordFollowUp(clientId) {
        console.log('Record follow-up for', clientId);
        // Would implement follow-up recording
    }
    
    takeOpportunity(type, clientId) {
        console.log('Take opportunity', type, clientId);
        // Would implement opportunity actions
    }
    
    printReview() {
        const modal = document.querySelector('.morning-review-modal');
        if (!modal) {
            console.warn('Morning review modal not available for printing');
            return;
        }

        const content = modal.querySelector('.modal-content') || modal;
        const printWindow = window.open('', '_blank', 'width=1024,height=768');

        if (!printWindow) {
            window.print();
            return;
        }

        const printStyles = `
            <style>
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    body {
                        margin: 0;
                        background: #f8fafc;
                        font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                        color: #111827;
                    }
                    .print-wrapper {
                        max-width: 1024px;
                        margin: 0 auto;
                        padding: 24px 32px 48px;
                    }
                    .morning-review-modal {
                        box-shadow: none !important;
                    }
                    .modal-footer,
                    .btn-primary,
                    .btn-secondary,
                    .btn-close,
                    .timeline-reschedule,
                    .timeline-cta {
                        display: none !important;
                    }
                }
                body {
                    margin: 0;
                    background: #f8fafc;
                    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
                    color: #111827;
                }
                .print-wrapper {
                    max-width: 1024px;
                    margin: 0 auto;
                    padding: 24px 32px 48px;
                }
            </style>
        `;

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>CareConnect Morning Review</title>
                    ${printStyles}
                </head>
                <body>
                    <div class="print-wrapper">
                        ${content.innerHTML}
                    </div>
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 300);
    }
    
    emailReview() {
        console.log('Email review summary');
        // Would implement email functionality
    }

    /**
     * Get display name for a house ID
     * @param {string} houseId - The house ID (e.g., 'house_nest')
     * @returns {string} The display name (e.g., 'NEST')
     */
    getHouseDisplayName(houseId) {
        if (!houseId) return 'Unassigned';
        
        // Try to get from housesManager
        if (window.housesManager && typeof window.housesManager.getHouseById === 'function') {
            const house = window.housesManager.getHouseById(houseId);
            if (house && house.name) {
                return house.name;
            }
        }
        
        // Fallback: extract name from ID (e.g., 'house_nest' -> 'Nest')
        const match = houseId.match(/^house_(.+)$/);
        if (match) {
            return match[1].charAt(0).toUpperCase() + match[1].slice(1);
        }
        
        return houseId;
    }
}

// Initialize and export - wait for dependencies
if (typeof window !== 'undefined') {
    function initializeMorningReview() {
        if (window.trackerEngine && window.clientManager) {
            try {
                window.morningReview = new MorningReviewDashboard();
            } catch (error) {
                console.error('Failed to initialize MorningReviewDashboard:', error);
                // Create a fallback instance that won't crash
                window.morningReview = {
                    generateMorningReview: async () => ({ error: 'Dashboard not available' }),
                    renderMorningReview: () => console.warn('Morning review not available')
                };
            }
        } else {
            setTimeout(initializeMorningReview, 100);
        }
    }
    initializeMorningReview();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MorningReviewDashboard;
}
