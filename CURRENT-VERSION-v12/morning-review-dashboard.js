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
            <div class="modal-content" style="max-width: 1200px;">
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
                                            ${batch.clients.slice(0, 8).map(c => c.initials).join(', ')}
                                            ${batch.clients.length > 8 ? `<span class="more-clients">+${batch.clients.length - 8} more</span>` : ''}
                                        </div>
                                        <button 
                                            class="btn-batch" 
                                            data-item-id="${batch.itemId}" 
                                            data-client-ids="${batch.clients.map(c => c.id).join(',')}"
                                            onclick="morningReview.handleBatchClick(this)">
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
                                <div class="task-client">${task.client.initials} - ${this.getHouseDisplayName(task.client.houseId)}</div>
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
