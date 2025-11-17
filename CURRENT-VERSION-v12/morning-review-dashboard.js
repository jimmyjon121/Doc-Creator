/**
 * Morning Review Dashboard
 * Consolidated view of daily priorities and actions needed
 */

class MorningReviewDashboard {
    constructor() {
        this.dbManager = window.indexedDBManager;
        // Wait for TrackerEngine to be available
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
     * Render morning review modal
     */
    async renderMorningReview() {
        const review = await this.generateMorningReview();
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay morning-review-modal';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 1000px;">
                <div class="modal-header morning-header">
                    <div class="morning-greeting">
                        <h2>${review.greeting}</h2>
                        <p class="review-date">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <button class="btn-close" onclick="this.closest('.modal-overlay').remove()">×</button>
                </div>
                
                <div class="review-content">
                    <!-- Quick Stats -->
                    <div class="morning-stats">
                        <div class="stat-card ${review.summary.overdueItems > 0 ? 'alert' : ''}">
                            <div class="stat-number">${review.summary.overdueItems}</div>
                            <div class="stat-label">Overdue</div>
                        </div>
                        <div class="stat-card primary">
                            <div class="stat-number">${review.summary.tasksToday}</div>
                            <div class="stat-label">Due Today</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-number">${review.summary.upcomingItems}</div>
                            <div class="stat-label">Next 3 Days</div>
                        </div>
                        <div class="stat-card success">
                            <div class="stat-number">${review.sections.opportunities.length}</div>
                            <div class="stat-label">Opportunities</div>
                        </div>
                    </div>
                    
                    <!-- Daily Insights -->
                    ${review.insights.length > 0 ? `
                        <div class="daily-insights">
                            ${review.insights.map(insight => `
                                <div class="insight-banner ${insight.type}">
                                    <span class="insight-icon">${this.getInsightIcon(insight.type)}</span>
                                    <span class="insight-text">${insight.message}</span>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                    
                    <!-- Batch Actions -->
                    ${review.batchActions.length > 0 ? `
                        <div class="batch-actions-section">
                            <h3>⚡ Quick Wins - Batch Actions</h3>
                            <div class="batch-actions-grid">
                                ${review.batchActions.map(batch => `
                                    <div class="batch-action-card">
                                        <div class="batch-header">
                                            <span class="batch-count">${batch.count} clients</span>
                                            <span class="batch-time">~${batch.estimatedTime} min</span>
                                        </div>
                                        <div class="batch-title">${batch.itemLabel}</div>
                                        <div class="batch-clients">
                                            ${batch.clients.map(c => c.initials).join(', ')}
                                        </div>
                                        <button class="btn-batch" onclick="morningReview.executeBatch('${batch.itemId}', ${JSON.stringify(batch.clients.map(c => c.id))})">
                                            Start Batch
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Task Sections -->
                    <div class="review-sections">
                        ${this.renderTaskSection('🚨 Overdue - Immediate Action', review.sections.overdue, 'overdue')}
                        ${this.renderTaskSection('📅 Due Today', review.sections.dueToday, 'today')}
                        ${this.renderTaskSection('📌 Next 3 Days', review.sections.upcoming, 'upcoming')}
                        ${this.renderFollowUpSection(review.sections.followUps)}
                        ${this.renderOpportunitiesSection(review.sections.opportunities)}
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-secondary" onclick="morningReview.printReview()">
                        🖨️ Print Review
                    </button>
                    <button class="btn-secondary" onclick="morningReview.emailReview()">
                        📧 Email Summary
                    </button>
                    <button class="btn-primary" onclick="this.closest('.modal-overlay').remove()">
                        Start My Day
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    /**
     * Render task section
     */
    renderTaskSection(title, tasks, type) {
        if (tasks.length === 0) return '';
        
        return `
            <div class="review-section ${type}">
                <h3>${title}</h3>
                <div class="task-list">
                    ${tasks.map(task => `
                        <div class="review-task-item">
                            <div class="task-checkbox">
                                <input type="checkbox" 
                                       id="task-${task.client.id}-${task.item.id}"
                                       onchange="morningReview.completeTask('${task.client.id}', '${task.item.id}')">
                            </div>
                            <div class="task-details">
                                <div class="task-client">${task.client.initials} - ${task.client.houseId}</div>
                                <div class="task-name">${task.item.label}</div>
                                ${task.daysPastDue ? `<div class="task-overdue">${task.daysPastDue} days overdue</div>` : ''}
                                ${task.daysUntilDue ? `<div class="task-due">Due in ${task.daysUntilDue} days</div>` : ''}
                            </div>
                            <button class="btn-task-action" onclick="morningReview.openClient('${task.client.id}')">
                                View
                            </button>
                        </div>
                    `).join('')}
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
                            <div class="followup-client">${f.client.initials} - ${f.client.houseId}</div>
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
    
    async executeBatch(itemId, clientIds) {
        // Open batch completion modal
        console.log('Execute batch for', itemId, clientIds);
        // Would implement batch completion UI
    }
    
    openClient(clientId) {
        // Close modal and navigate to client
        document.querySelector('.morning-review-modal').remove();
        // Would implement client navigation
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
        window.print();
    }
    
    emailReview() {
        console.log('Email review summary');
        // Would implement email functionality
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
