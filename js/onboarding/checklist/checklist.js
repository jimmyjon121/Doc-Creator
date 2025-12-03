/**
 * QuickStartChecklist - Interactive checklist component
 * 
 * Features:
 * - Auto-completes items based on user actions
 * - Provides hints to guide users
 * - Minimizable/expandable
 * - Celebrates completion
 */

class QuickStartChecklist {
    constructor() {
        this.container = null;
        this.state = null;
        this.isMinimized = false;
        this.isHidden = false;
        this.eventCleanups = [];
    }

    /**
     * Initialize the checklist
     * @param {Object} state - Onboarding state object
     */
    init(state) {
        this.state = state;
        
        // Don't show if checklist is already complete
        if (OnboardingState.isChecklistComplete(state)) {
            console.log('[QuickStartChecklist] Already complete, not showing');
            return;
        }
        
        // Create container
        this.createContainer();
        
        // Bind events for auto-completion
        this.bindEvents();
        
        // Initial render
        this.render();
        
        console.log('[QuickStartChecklist] Initialized');
    }

    /**
     * Create the container element
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.id = 'quick-start-checklist';
        document.body.appendChild(this.container);
    }

    /**
     * Bind event listeners for auto-completion
     */
    bindEvents() {
        const allItems = ChecklistConfig.getAllItems();
        
        allItems.forEach(item => {
            const cleanup = OnboardingEvents.on(item.listenFor, () => {
                this.markComplete(item.id);
            });
            this.eventCleanups.push(cleanup);
        });
    }

    /**
     * Render the checklist
     */
    render() {
        if (!this.container || !this.state) return;
        
        const progress = OnboardingState.getChecklistProgress(this.state);
        const isComplete = progress.completed === progress.total;
        
        this.container.innerHTML = `
            <div class="checklist-panel ${this.isMinimized ? 'is-minimized' : ''} ${this.isHidden ? 'is-hidden' : ''}">
                <div class="checklist-header">
                    <span class="checklist-icon">📋</span>
                    <span class="checklist-title">Coach Quick Start</span>
                    <span class="checklist-progress">${progress.completed}/${progress.total}</span>
                    <button class="checklist-toggle" aria-label="Toggle checklist">
                        ${this.isMinimized ? '▲' : '▼'}
                    </button>
                    <button class="checklist-close" aria-label="Dismiss checklist">×</button>
                </div>
                
                <div class="checklist-body">
                    ${ChecklistConfig.ITEMS.map(group => this.renderGroup(group)).join('')}
                </div>
                
                ${isComplete ? `
                    <div class="checklist-complete">
                        <span class="checklist-complete-icon">🎉</span>
                        You're ready to work independently!
                    </div>
                ` : ''}
            </div>
        `;
        
        // Bind header click for toggle
        const header = this.container.querySelector('.checklist-header');
        if (header) {
            header.addEventListener('click', (e) => {
                // Don't toggle if clicking the close button
                if (!e.target.closest('.checklist-close')) {
                    this.toggle();
                }
            });
        }
        
        // Bind close button
        const closeBtn = this.container.querySelector('.checklist-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hide();
            });
        }
        
        // Bind hint button clicks
        this.container.querySelectorAll('.checklist-hint-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const hint = btn.dataset.hint;
                const target = btn.dataset.target;
                this.showHint(hint, target);
            });
        });
    }

    /**
     * Render a group of checklist items
     */
    renderGroup(group) {
        return `
            <div class="checklist-group">
                <div class="checklist-group-title">
                    <span>${group.groupIcon}</span> ${group.group}
                </div>
                ${group.items.map(item => this.renderItem(item)).join('')}
            </div>
        `;
    }

    /**
     * Render a single checklist item
     */
    renderItem(item) {
        const isComplete = this.state.checklist[item.id];
        
        return `
            <div class="checklist-item ${isComplete ? 'is-complete' : ''}" data-item-id="${item.id}">
                <span class="checklist-checkbox">
                    ${isComplete ? '✓' : '○'}
                </span>
                <span class="checklist-label">${item.label}</span>
                ${!isComplete ? `
                    <button class="checklist-hint-btn" 
                            data-hint="${item.hint}"
                            data-target="${item.targetTourId || ''}"
                            aria-label="Show hint">
                        ?
                    </button>
                ` : ''}
            </div>
        `;
    }

    /**
     * Mark an item as complete
     */
    async markComplete(itemId) {
        if (!this.state || this.state.checklist[itemId]) {
            return; // Already complete
        }
        
        console.log('[QuickStartChecklist] Marking complete:', itemId);
        
        // Update state
        OnboardingState.markChecklistItem(itemId, this.state);
        
        // Save state
        const userId = this.getCurrentUserId();
        await OnboardingState.save(userId, this.state);
        
        // Emit event
        OnboardingEvents.emit(OnboardingEvents.EVENTS.CHECKLIST_ITEM_COMPLETED, { itemId });
        
        // Animate the item
        this.animateItemComplete(itemId);
        
        // Re-render
        this.render();
        
        // Check if all complete
        if (OnboardingState.isChecklistComplete(this.state)) {
            OnboardingEvents.emit(OnboardingEvents.EVENTS.CHECKLIST_COMPLETED);
            this.celebrate();
        }
    }

    /**
     * Animate item completion
     */
    animateItemComplete(itemId) {
        const item = this.container?.querySelector(`[data-item-id="${itemId}"]`);
        if (item) {
            item.style.animation = 'checkComplete 0.5s ease';
        }
    }

    /**
     * Show a hint for an item
     */
    showHint(hint, targetTourId) {
        // Show notification with hint
        if (window.showNotification) {
            window.showNotification(hint, 'info');
        } else {
            // Fallback
            const notification = document.createElement('div');
            notification.className = 'onboarding-notification info';
            notification.textContent = hint;
            document.body.appendChild(notification);
            
            requestAnimationFrame(() => notification.classList.add('show'));
            
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }
        
        // Scroll to target element if specified
        if (targetTourId) {
            const target = document.querySelector(`[data-tour-id="${targetTourId}"]`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Briefly highlight the element
                target.style.transition = 'box-shadow 0.3s ease';
                target.style.boxShadow = '0 0 0 4px rgba(110, 123, 255, 0.5)';
                
                setTimeout(() => {
                    target.style.boxShadow = '';
                }, 2000);
            }
        }
    }

    /**
     * Toggle minimized state
     */
    toggle() {
        this.isMinimized = !this.isMinimized;
        this.render();
    }

    /**
     * Show the checklist
     */
    show() {
        this.isHidden = false;
        this.render();
    }

    /**
     * Hide the checklist
     */
    hide() {
        this.isHidden = true;
        this.render();
    }

    /**
     * Celebrate completion
     */
    celebrate() {
        console.log('[QuickStartChecklist] All items complete!');
        
        // The controller will show the celebration modal
        // Just update our UI
        this.render();
        
        // Auto-minimize after a delay
        setTimeout(() => {
            this.isMinimized = true;
            this.render();
        }, 3000);
    }

    /**
     * Get current user ID
     */
    getCurrentUserId() {
        try {
            if (window.authManager?.getCurrentUser) {
                const user = window.authManager.getCurrentUser();
                return user?.id || user?.email || 'anonymous';
            }
        } catch (e) {
            // Ignore
        }
        return 'anonymous';
    }

    /**
     * Destroy the checklist
     */
    destroy() {
        // Remove event listeners
        this.eventCleanups.forEach(cleanup => cleanup());
        this.eventCleanups = [];
        
        // Remove container
        if (this.container) {
            this.container.remove();
            this.container = null;
        }
    }
}

// Create global instance
const quickStartChecklist = new QuickStartChecklist();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.QuickStartChecklist = QuickStartChecklist;
    window.quickStartChecklist = quickStartChecklist;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QuickStartChecklist, quickStartChecklist };
}

