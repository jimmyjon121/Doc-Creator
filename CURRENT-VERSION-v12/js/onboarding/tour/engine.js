/**
 * ProductTour - Reusable tour engine for CareConnect Pro
 * 
 * Features:
 * - SVG-based spotlight with smooth animations
 * - Intelligent tooltip positioning
 * - Keyboard navigation
 * - Interactive steps (wait for user action)
 * - Accessibility support
 * - Reduced motion support
 */

class ProductTour {
    constructor(options) {
        this.tourId = options.tourId;
        this.steps = options.steps || [];
        this.onComplete = options.onComplete || (() => {});
        this.onSkip = options.onSkip || (() => {});
        this.onStepChange = options.onStepChange || (() => {});
        
        this.currentStep = 0;
        this.overlay = null;
        this.tooltip = null;
        this.previousFocusedElement = null;
        this.eventCleanup = null;
        
        // Check for reduced motion preference
        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        
        // Bound handlers
        this.boundKeyHandler = this.handleKeydown.bind(this);
        this.boundResizeHandler = this.handleResize.bind(this);
    }

    /**
     * Start the tour
     */
    async start() {
        console.log(`[ProductTour] Starting tour: ${this.tourId}`);
        
        // Store current focus for restoration
        this.previousFocusedElement = document.activeElement;
        
        // Create overlay
        this.createOverlay();
        
        // Add event listeners
        document.addEventListener('keydown', this.boundKeyHandler);
        window.addEventListener('resize', this.boundResizeHandler);
        
        // Emit start event
        if (window.OnboardingEvents) {
            OnboardingEvents.emit(OnboardingEvents.EVENTS.TOUR_STARTED, { tourId: this.tourId });
        }
        
        // Show first step
        await this.showStep(0);
    }

    /**
     * Create the overlay element with SVG spotlight
     */
    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'tour-overlay';
        this.overlay.id = `tour-overlay-${this.tourId}`;
        this.overlay.innerHTML = `
            <svg class="tour-spotlight-svg" width="100%" height="100%">
                <defs>
                    <mask id="tour-spotlight-mask-${this.tourId}">
                        <rect width="100%" height="100%" fill="white"/>
                        <rect class="tour-cutout" fill="black" rx="12" x="0" y="0" width="0" height="0"/>
                    </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(0,0,0,0.75)" 
                      mask="url(#tour-spotlight-mask-${this.tourId})"/>
            </svg>
        `;
        
        document.body.appendChild(this.overlay);
    }

    /**
     * Show a specific step
     */
    async showStep(index) {
        if (index < 0 || index >= this.steps.length) {
            console.warn(`[ProductTour] Invalid step index: ${index}`);
            return;
        }
        
        // Clear any existing event wait
        this.clearEventWait();
        
        this.currentStep = index;
        const step = this.steps[index];
        
        console.log(`[ProductTour] Showing step ${index + 1}/${this.steps.length}:`, step.title);
        
        // Emit step viewed event
        if (window.OnboardingEvents) {
            OnboardingEvents.emit(OnboardingEvents.EVENTS.TOUR_STEP_VIEWED, { 
                tourId: this.tourId, 
                stepIndex: index,
                stepTitle: step.title
            });
        }
        
        // Call step change callback
        this.onStepChange(index, step);
        
        // Handle overlay-type steps (centered modal, no target)
        if (step.type === 'overlay') {
            this.hideSpotlight();
            this.renderTooltip(step, null);
            return;
        }
        
        // Find target element
        const targetEl = this.findTarget(step);
        
        if (!targetEl) {
            if (step.optional) {
                console.log(`[ProductTour] Optional step target not found, skipping`);
                await this.next();
                return;
            } else {
                console.warn(`[ProductTour] Target not found for step:`, step.target);
                // Show tooltip centered as fallback
                this.hideSpotlight();
                this.renderTooltip(step, null);
                return;
            }
        }
        
        // Scroll element into view
        await this.scrollToElement(targetEl);
        
        // Update spotlight
        this.updateSpotlight(targetEl, step);
        
        // Render tooltip
        this.renderTooltip(step, targetEl);
        
        // Handle interactive steps
        if (step.interactive && step.waitForEvent) {
            this.waitForEvent(step.waitForEvent);
        }
    }

    /**
     * Find target element using primary selector and fallback
     */
    findTarget(step) {
        // Try primary selector
        let element = document.querySelector(step.target);
        
        // Try fallback if primary not found
        if (!element && step.fallback) {
            element = document.querySelector(step.fallback);
        }
        
        return element;
    }

    /**
     * Scroll element into view smoothly
     */
    async scrollToElement(element) {
        const rect = element.getBoundingClientRect();
        const isInViewport = (
            rect.top >= 80 && // Account for toolbar
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight - 100 &&
            rect.right <= window.innerWidth
        );
        
        if (!isInViewport) {
            element.scrollIntoView({
                behavior: this.reducedMotion ? 'auto' : 'smooth',
                block: 'center',
                inline: 'center'
            });
            
            // Wait for scroll to complete
            await new Promise(resolve => setTimeout(resolve, this.reducedMotion ? 0 : 400));
        }
    }

    /**
     * Update spotlight position and size
     */
    updateSpotlight(targetEl, step) {
        const rect = targetEl.getBoundingClientRect();
        const padding = step.highlightPadding !== undefined ? step.highlightPadding : 8;
        const cutout = this.overlay.querySelector('.tour-cutout');
        
        if (window.gsap) {
            gsap.to(cutout, {
                attr: {
                    x: rect.left - padding,
                    y: rect.top - padding,
                    width: rect.width + padding * 2,
                    height: rect.height + padding * 2
                },
                duration: this.reducedMotion ? 0 : 0.4,
                ease: 'power2.out'
            });
        } else {
            // Fallback without GSAP
            cutout.setAttribute('x', rect.left - padding);
            cutout.setAttribute('y', rect.top - padding);
            cutout.setAttribute('width', rect.width + padding * 2);
            cutout.setAttribute('height', rect.height + padding * 2);
        }
        
        // Allow interaction with highlighted element if step is interactive
        if (step.interactive) {
            this.overlay.classList.add('allow-interaction');
        } else {
            this.overlay.classList.remove('allow-interaction');
        }
    }

    /**
     * Hide spotlight (for overlay-type steps)
     */
    hideSpotlight() {
        const cutout = this.overlay.querySelector('.tour-cutout');
        if (cutout) {
            cutout.setAttribute('x', 0);
            cutout.setAttribute('y', 0);
            cutout.setAttribute('width', 0);
            cutout.setAttribute('height', 0);
        }
        this.overlay.classList.remove('allow-interaction');
    }

    /**
     * Render the tooltip
     */
    renderTooltip(step, targetEl) {
        // Remove existing tooltip
        if (this.tooltip) {
            this.tooltip.remove();
        }
        
        const isOverlay = step.type === 'overlay' || !targetEl;
        const totalSteps = this.steps.length;
        const currentStepNum = this.currentStep + 1;
        
        // Generate step dots
        const dots = this.steps.map((_, i) => {
            const isActive = i === this.currentStep;
            const isCompleted = i < this.currentStep;
            return `<span class="tour-tooltip__dot ${isActive ? 'is-active' : ''} ${isCompleted ? 'is-completed' : ''}"></span>`;
        }).join('');
        
        // Create tooltip
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tour-tooltip';
        this.tooltip.setAttribute('role', 'dialog');
        this.tooltip.setAttribute('aria-labelledby', 'tour-tooltip-title');
        this.tooltip.setAttribute('aria-describedby', 'tour-tooltip-content');
        
        this.tooltip.innerHTML = `
            <div class="tour-tooltip__header">
                <div class="tour-tooltip__step-indicator">
                    <div class="tour-tooltip__step-dots">${dots}</div>
                    <span class="tour-tooltip__step-text">Step ${currentStepNum} of ${totalSteps}</span>
                </div>
                <h3 class="tour-tooltip__title" id="tour-tooltip-title">${step.title}</h3>
            </div>
            <div class="tour-tooltip__body">
                <p class="tour-tooltip__content" id="tour-tooltip-content">${step.content}</p>
                ${step.proTip ? `<div class="tour-tooltip__pro-tip">${step.proTip}</div>` : ''}
            </div>
            ${step.interactive ? `
                <div class="tour-tooltip__interactive-hint">
                    ${step.nextLabel || 'Complete this action to continue'}
                </div>
            ` : ''}
            <div class="tour-tooltip__footer">
                <button class="tour-btn tour-btn--skip" data-action="skip">Skip tour</button>
                <div class="tour-tooltip__nav">
                    ${step.showPrev !== false && this.currentStep > 0 ? 
                        `<button class="tour-btn tour-btn--secondary" data-action="prev">Back</button>` : ''
                    }
                    ${step.showNext !== false && !step.interactive ? 
                        `<button class="tour-btn tour-btn--primary" data-action="next">${step.nextLabel || (this.currentStep === this.steps.length - 1 ? 'Finish' : 'Next')}</button>` : ''
                    }
                </div>
            </div>
        `;
        
        document.body.appendChild(this.tooltip);
        
        // Add event listeners to buttons
        this.tooltip.querySelector('[data-action="skip"]')?.addEventListener('click', () => this.skip());
        this.tooltip.querySelector('[data-action="prev"]')?.addEventListener('click', () => this.prev());
        this.tooltip.querySelector('[data-action="next"]')?.addEventListener('click', () => this.next());
        
        // Position tooltip
        if (isOverlay) {
            this.centerTooltip();
        } else {
            this.positionTooltip(targetEl, step.position || 'bottom');
        }
        
        // Show tooltip with animation
        requestAnimationFrame(() => {
            this.tooltip.classList.add('is-visible');
            
            // Focus the primary button for accessibility
            const primaryBtn = this.tooltip.querySelector('.tour-btn--primary') || 
                              this.tooltip.querySelector('.tour-btn--skip');
            if (primaryBtn) {
                primaryBtn.focus();
            }
        });
        
        // Announce to screen readers
        this.announceStep(step, currentStepNum, totalSteps);
    }

    /**
     * Center tooltip (for overlay steps)
     */
    centerTooltip() {
        const tooltipRect = this.tooltip.getBoundingClientRect();
        const x = (window.innerWidth - tooltipRect.width) / 2;
        const y = (window.innerHeight - tooltipRect.height) / 2;
        
        this.tooltip.style.left = `${x}px`;
        this.tooltip.style.top = `${y}px`;
    }

    /**
     * Position tooltip relative to target element
     */
    positionTooltip(targetEl, preferredPosition) {
        // Wait for tooltip to render
        requestAnimationFrame(() => {
            const targetRect = targetEl.getBoundingClientRect();
            const tooltipRect = this.tooltip.getBoundingClientRect();
            const viewport = { width: window.innerWidth, height: window.innerHeight };
            const margin = 16;
            
            // Calculate positions
            const positions = {
                top: {
                    x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
                    y: targetRect.top - tooltipRect.height - margin
                },
                bottom: {
                    x: targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
                    y: targetRect.bottom + margin
                },
                left: {
                    x: targetRect.left - tooltipRect.width - margin,
                    y: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
                },
                right: {
                    x: targetRect.right + margin,
                    y: targetRect.top + targetRect.height / 2 - tooltipRect.height / 2
                }
            };
            
            // Check if preferred position fits
            let pos = positions[preferredPosition];
            if (!this.fitsInViewport(pos, tooltipRect, viewport, margin)) {
                // Try opposite, then others
                const fallbackOrder = {
                    top: ['bottom', 'left', 'right'],
                    bottom: ['top', 'left', 'right'],
                    left: ['right', 'top', 'bottom'],
                    right: ['left', 'top', 'bottom']
                };
                
                for (const alt of fallbackOrder[preferredPosition]) {
                    if (this.fitsInViewport(positions[alt], tooltipRect, viewport, margin)) {
                        pos = positions[alt];
                        break;
                    }
                }
            }
            
            // Constrain to viewport
            pos.x = Math.max(margin, Math.min(pos.x, viewport.width - tooltipRect.width - margin));
            pos.y = Math.max(margin, Math.min(pos.y, viewport.height - tooltipRect.height - margin));
            
            // Apply position
            if (window.gsap && !this.reducedMotion) {
                gsap.to(this.tooltip, {
                    left: pos.x,
                    top: pos.y,
                    duration: 0.3,
                    ease: 'power2.out'
                });
            } else {
                this.tooltip.style.left = `${pos.x}px`;
                this.tooltip.style.top = `${pos.y}px`;
            }
        });
    }

    /**
     * Check if position fits in viewport
     */
    fitsInViewport(pos, tooltipRect, viewport, margin) {
        return (
            pos.x >= margin &&
            pos.y >= margin &&
            pos.x + tooltipRect.width <= viewport.width - margin &&
            pos.y + tooltipRect.height <= viewport.height - margin
        );
    }

    /**
     * Announce step to screen readers
     */
    announceStep(step, currentStep, totalSteps) {
        const announcer = document.getElementById('srAnnouncer') || this.createAnnouncer();
        announcer.textContent = `Tour step ${currentStep} of ${totalSteps}: ${step.title}. ${step.content}`;
    }

    /**
     * Create screen reader announcer if it doesn't exist
     */
    createAnnouncer() {
        const announcer = document.createElement('div');
        announcer.id = 'srAnnouncer';
        announcer.className = 'sr-announcer';
        announcer.setAttribute('aria-live', 'polite');
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(announcer);
        return announcer;
    }

    /**
     * Go to next step
     */
    async next() {
        if (this.currentStep < this.steps.length - 1) {
            await this.showStep(this.currentStep + 1);
        } else {
            this.complete();
        }
    }

    /**
     * Go to previous step
     */
    async prev() {
        if (this.currentStep > 0) {
            await this.showStep(this.currentStep - 1);
        }
    }

    /**
     * Skip the tour
     */
    skip() {
        console.log(`[ProductTour] Tour skipped at step ${this.currentStep + 1}`);
        
        if (window.OnboardingEvents) {
            OnboardingEvents.emit(OnboardingEvents.EVENTS.TOUR_SKIPPED, { 
                tourId: this.tourId, 
                stepIndex: this.currentStep 
            });
        }
        
        this.cleanup();
        this.onSkip(this.currentStep);
    }

    /**
     * Complete the tour
     */
    complete() {
        console.log(`[ProductTour] Tour completed: ${this.tourId}`);
        
        if (window.OnboardingEvents) {
            OnboardingEvents.emit(OnboardingEvents.EVENTS.TOUR_COMPLETED, { tourId: this.tourId });
        }
        
        this.cleanup();
        this.onComplete();
    }

    /**
     * Wait for a specific event before proceeding
     */
    waitForEvent(eventName) {
        console.log(`[ProductTour] Waiting for event: ${eventName}`);
        
        const handler = () => {
            console.log(`[ProductTour] Event received: ${eventName}`);
            this.clearEventWait();
            
            // Small delay for visual feedback
            setTimeout(() => this.next(), 300);
        };
        
        window.addEventListener(eventName, handler, { once: true });
        this.eventCleanup = () => window.removeEventListener(eventName, handler);
    }

    /**
     * Clear event wait listener
     */
    clearEventWait() {
        if (this.eventCleanup) {
            this.eventCleanup();
            this.eventCleanup = null;
        }
    }

    /**
     * Handle keyboard navigation
     */
    handleKeydown(e) {
        switch (e.key) {
            case 'Escape':
                e.preventDefault();
                this.skip();
                break;
            case 'ArrowRight':
            case 'Enter':
                if (!this.steps[this.currentStep].interactive) {
                    e.preventDefault();
                    this.next();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                this.prev();
                break;
            case 'Tab':
                // Trap focus within tooltip
                this.trapFocus(e);
                break;
        }
    }

    /**
     * Trap focus within tooltip
     */
    trapFocus(e) {
        if (!this.tooltip) return;
        
        const focusableElements = this.tooltip.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    }

    /**
     * Handle window resize
     */
    handleResize() {
        const step = this.steps[this.currentStep];
        if (!step) return;
        
        if (step.type === 'overlay') {
            this.centerTooltip();
        } else {
            const targetEl = this.findTarget(step);
            if (targetEl) {
                this.updateSpotlight(targetEl, step);
                this.positionTooltip(targetEl, step.position || 'bottom');
            }
        }
    }

    /**
     * Cleanup tour elements
     */
    cleanup() {
        // Remove event listeners
        document.removeEventListener('keydown', this.boundKeyHandler);
        window.removeEventListener('resize', this.boundResizeHandler);
        this.clearEventWait();
        
        // Remove overlay
        if (this.overlay) {
            this.overlay.remove();
            this.overlay = null;
        }
        
        // Remove tooltip
        if (this.tooltip) {
            this.tooltip.remove();
            this.tooltip = null;
        }
        
        // Restore focus
        if (this.previousFocusedElement && this.previousFocusedElement.focus) {
            this.previousFocusedElement.focus();
        }
    }
}

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.ProductTour = ProductTour;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductTour;
}

