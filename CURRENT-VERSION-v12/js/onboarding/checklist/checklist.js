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
        console.log('[QuickStartChecklist] init() called with state:', state);
        this.state = state;
        
        // Don't show if checklist is already complete
        if (OnboardingState.isChecklistComplete(state)) {
            console.log('[QuickStartChecklist] Already complete, not showing');
            return;
        }
        
        // Create container
        this.createContainer();
        console.log('[QuickStartChecklist] Container created');
        
        // Bind events for auto-completion
        this.bindEvents();
        
        // Watch for dark mode changes
        this.watchDarkMode();
        
        // Initial render
        this.render();
        
        console.log('[QuickStartChecklist] Initialized and rendered');
    }

    /**
     * Watch for dark mode changes and re-render
     */
    watchDarkMode() {
        // Use MutationObserver to watch for body class changes
        const observer = new MutationObserver(() => {
            if (this.container) {
                this.render(); // Re-render when dark mode changes
            }
        });
        
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class']
        });
        
        // Store observer for cleanup
        this.darkModeObserver = observer;
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
        console.log('[QuickStartChecklist] Binding events...');
        const allItems = ChecklistConfig.getAllItems();
        
        allItems.forEach(item => {
            console.log('[QuickStartChecklist] Listening for:', item.listenFor);
            const cleanup = OnboardingEvents.on(item.listenFor, () => {
                console.log('[QuickStartChecklist] Event received:', item.listenFor, '-> marking', item.id);
                this.markComplete(item.id);
            });
            this.eventCleanups.push(cleanup);
        });
        console.log('[QuickStartChecklist] Bound', allItems.length, 'event listeners');
    }

    /**
     * Render the checklist
     */
    render() {
        if (!this.container) {
            console.warn('[QuickStartChecklist] No container, cannot render');
            return;
        }
        if (!this.state) {
            console.warn('[QuickStartChecklist] No state, cannot render');
            return;
        }
        
        const progress = OnboardingState.getChecklistProgress(this.state);
        const isComplete = progress.completed === progress.total;
        
        // Detect dark mode
        const isDarkMode = document.body.classList.contains('dark-mode');
        const darkModeClass = isDarkMode ? 'dark-mode' : '';
        
        this.container.innerHTML = `
            <div class="checklist-panel ${darkModeClass} ${this.isMinimized ? 'is-minimized' : ''} ${this.isHidden ? 'is-hidden' : ''}">
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
        
        // Use event delegation on the container for all clicks
        // This is more reliable than binding to individual elements after innerHTML
        this.container.onclick = (e) => {
            const target = e.target;
            
            // Close button clicked
            if (target.closest('.checklist-close')) {
                e.stopPropagation();
                this.hide();
                return;
            }
            
            // Toggle button clicked
            if (target.closest('.checklist-toggle')) {
                e.stopPropagation();
                this.toggle();
                return;
            }
            
            // Hint button clicked
            const hintBtn = target.closest('.checklist-hint-btn');
            if (hintBtn) {
                e.stopPropagation();
                const hint = hintBtn.dataset.hint;
                const targetId = hintBtn.dataset.target;
                console.log('[QuickStartChecklist] Hint clicked:', hint, targetId);
                this.showHint(hint, targetId);
                return;
            }
            
            // Header clicked (toggle)
            if (target.closest('.checklist-header')) {
                this.toggle();
                return;
            }
            
            // Checklist item clicked - show hint for that item
            const item = target.closest('.checklist-item');
            if (item && !item.classList.contains('is-complete')) {
                const hintBtnInItem = item.querySelector('.checklist-hint-btn');
                if (hintBtnInItem) {
                    const hint = hintBtnInItem.dataset.hint;
                    const targetId = hintBtnInItem.dataset.target;
                    console.log('[QuickStartChecklist] Item clicked, showing hint:', hint);
                    this.showHint(hint, targetId);
                }
            }
        };
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
        // Escape hint text for HTML attribute (replace quotes and special chars)
        const escapedHint = (item.hint || '')
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        
        return `
            <div class="checklist-item ${isComplete ? 'is-complete' : ''}" data-item-id="${item.id}">
                <span class="checklist-checkbox">
                    ${isComplete ? '✓' : '○'}
                </span>
                <span class="checklist-label">${item.label}</span>
                ${!isComplete ? `
                    <button class="checklist-hint-btn" 
                            data-hint="${escapedHint}"
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
        console.log('[QuickStartChecklist] showHint called:', hint, targetTourId);
        
        // Show notification with hint
        if (window.showNotification) {
            window.showNotification(hint, 'info');
        } else {
            // Fallback - create a visible toast notification
            const notification = document.createElement('div');
            notification.style.cssText = `
                position: fixed;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
                color: white;
                padding: 16px 24px;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                z-index: 100000;
                font-size: 14px;
                font-weight: 500;
                max-width: 400px;
                text-align: center;
                opacity: 0;
                transition: opacity 0.3s ease, transform 0.3s ease;
            `;
            notification.textContent = hint;
            document.body.appendChild(notification);
            
            requestAnimationFrame(() => {
                notification.style.opacity = '1';
                notification.style.transform = 'translateX(-50%) translateY(0)';
            });
            
            setTimeout(() => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(-50%) translateY(-10px)';
                setTimeout(() => notification.remove(), 300);
            }, 4000);
        }
        
        // Scroll to target element if specified
        if (targetTourId) {
            // Try multiple selectors to find the target
            let target = document.querySelector(`[data-tour-id="${targetTourId}"]`);
            
            // Fallback: try by id
            if (!target) {
                target = document.getElementById(targetTourId + 'Widget') || 
                         document.getElementById(targetTourId);
            }
            
            // Fallback: try common widget containers
            if (!target && targetTourId === 'journey-radar') {
                target = document.getElementById('journeyRadarWidget');
            }
            if (!target && targetTourId === 'flight-plan') {
                target = document.getElementById('flightPlanWidget');
            }
            if (!target && targetTourId === 'gaps') {
                target = document.getElementById('gapsWidget');
            }
            if (!target && targetTourId === 'house-health') {
                target = document.getElementById('houseHealthWidget');
            }
            if (!target && targetTourId === 'quick-actions') {
                target = document.querySelector('.quick-actions');
            }
            
            if (target) {
                console.log('[QuickStartChecklist] Scrolling to:', target);
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Briefly highlight the element with a pulsing glow
                const originalBoxShadow = target.style.boxShadow;
                const originalTransition = target.style.transition;
                target.style.transition = 'box-shadow 0.3s ease';
                target.style.boxShadow = '0 0 0 4px rgba(13, 148, 136, 0.6), 0 0 20px rgba(13, 148, 136, 0.4)';
                
                setTimeout(() => {
                    target.style.boxShadow = originalBoxShadow || '';
                    setTimeout(() => {
                        target.style.transition = originalTransition || '';
                    }, 300);
                }, 2500);
            } else {
                console.warn('[QuickStartChecklist] Could not find target element for:', targetTourId);
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
        
        // Stop dark mode observer
        if (this.darkModeObserver) {
            this.darkModeObserver.disconnect();
            this.darkModeObserver = null;
        }
        
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

