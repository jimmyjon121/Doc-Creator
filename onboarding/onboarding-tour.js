/**
 * Onboarding Tour Component
 * Spotlight walkthrough across dashboard features.
 */

class OnboardingTour {
    constructor(manager) {
        this.manager = manager;
        this.currentStep = 0;
        this.steps = [];
        this.overlay = null;
        this.tooltip = null;
        this.highlightedElement = null;
        this.resolve = null;
        this.isActive = false;
    }

    start() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.steps = window.OnboardingContent.tour.steps;
            this.currentStep = this.manager.state.currentStep || 0;
            this.isActive = true;

            this.showWelcome().then(() => {
                this.createOverlay();
                this.showStep(this.currentStep);
            });
        });
    }

    showWelcome() {
        return new Promise((resolve) => {
            const welcome = window.OnboardingContent.tour.welcome;
            const modal = document.createElement('div');
            modal.className = 'onboarding-modal-overlay';
            modal.innerHTML = `
                <div class="onboarding-modal welcome">
                    <div class="modal-icon">👋</div>
                    <h2>${welcome.title}</h2>
                    <p>${welcome.content}</p>
                    <div class="modal-actions">
                        <button class="btn-secondary" data-role="skip">Skip Tour</button>
                        <button class="btn-primary" data-role="start">${welcome.action}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('[data-role="start"]').addEventListener('click', () => {
                modal.remove();
                resolve();
            });

            modal.querySelector('[data-role="skip"]').addEventListener('click', () => {
                modal.remove();
                this.skip();
            });
        });
    }

    createOverlay() {
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-tour-overlay';
        document.body.appendChild(this.overlay);

        this.tooltip = document.createElement('div');
        this.tooltip.className = 'onboarding-tour-tooltip';
        this.tooltip.innerHTML = `
            <div class="tooltip-header">
                <div class="tooltip-progress">
                    <span class="progress-text">Step <span id="tour-current-step">1</span> of <span id="tour-total-steps">${this.steps.length}</span></span>
                    <div class="progress-bar-container">
                        <div class="progress-bar" id="tour-progress-bar"></div>
                    </div>
                </div>
                <button class="tooltip-close" id="tour-close">×</button>
            </div>
            <div class="tooltip-content">
                <h3 id="tour-title"></h3>
                <p id="tour-content"></p>
                <div class="tooltip-pro-tip hidden" id="tour-pro-tip">
                    <span class="tip-icon">💡</span>
                    <span class="tip-text"></span>
                </div>
            </div>
            <div class="tooltip-footer">
                <button class="btn-secondary" id="tour-prev" disabled>← Previous</button>
                <button class="btn-primary" id="tour-next">Next →</button>
            </div>
        `;
        document.body.appendChild(this.tooltip);

        this.tooltip.querySelector('#tour-close').addEventListener('click', () => this.skip());
        this.tooltip.querySelector('#tour-prev').addEventListener('click', () => this.previousStep());
        this.tooltip.querySelector('#tour-next').addEventListener('click', () => this.nextStep());

        document.addEventListener('keydown', this.handleKeyboard);
    }

    async showStep(index) {
        if (index < 0 || index >= this.steps.length) {
            return this.complete();
        }

        this.currentStep = index;
        this.manager.updateStep(index);
        const step = this.steps[index];

        this.updateProgress();

        this.tooltip.querySelector('#tour-title').textContent = step.title;
        this.tooltip.querySelector('#tour-content').textContent = step.content;

        const proTip = this.tooltip.querySelector('#tour-pro-tip');
        if (step.proTip) {
            proTip.classList.remove('hidden');
            proTip.querySelector('.tip-text').textContent = step.proTip;
        } else {
            proTip.classList.add('hidden');
        }

        this.tooltip.querySelector('#tour-prev').disabled = index === 0;
        this.tooltip.querySelector('#tour-next').textContent = index === this.steps.length - 1 ? 'Finish →' : 'Next →';

        if (step.target) {
            await this.highlightElement(step.target, step.position);
        } else {
            this.clearHighlight();
            this.positionTooltip('center');
        }

        if (step.interactive) {
            await this.handleInteractiveStep(step);
        }
    }

    async highlightElement(selector, position = 'bottom') {
        const element = await this.waitForElement(selector);
        if (!element) {
            console.warn(`[Onboarding] Could not find element for selector: ${selector}`);
            this.clearHighlight();
            return;
        }

        const rect = element.getBoundingClientRect();

        this.overlay.style.clipPath = `polygon(
            0% 0%,
            0% 100%,
            ${rect.left - 12}px 100%,
            ${rect.left - 12}px ${rect.top - 12}px,
            ${rect.right + 12}px ${rect.top - 12}px,
            ${rect.right + 12}px ${rect.bottom + 12}px,
            ${rect.left - 12}px ${rect.bottom + 12}px,
            ${rect.left - 12}px 100%,
            100% 100%,
            100% 0%
        )`;

        element.classList.add('onboarding-highlight');
        this.highlightedElement = element;

        this.positionTooltip(position, rect);
    }

    positionTooltip(position, rect = null) {
        if (!rect) {
            this.tooltip.style.top = '50%';
            this.tooltip.style.left = '50%';
            this.tooltip.style.transform = 'translate(-50%, -50%)';
            return;
        }

        const padding = 20;
        const tooltipRect = this.tooltip.getBoundingClientRect();

        switch (position) {
            case 'top':
                this.tooltip.style.top = `${rect.top - tooltipRect.height - padding}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
                this.tooltip.style.transform = 'translateX(-50%)';
                break;
            case 'bottom':
                this.tooltip.style.top = `${rect.bottom + padding}px`;
                this.tooltip.style.left = `${rect.left + rect.width / 2}px`;
                this.tooltip.style.transform = 'translateX(-50%)';
                break;
            case 'left':
                this.tooltip.style.top = `${rect.top + rect.height / 2}px`;
                this.tooltip.style.left = `${rect.left - tooltipRect.width - padding}px`;
                this.tooltip.style.transform = 'translateY(-50%)';
                break;
            case 'right':
                this.tooltip.style.top = `${rect.top + rect.height / 2}px`;
                this.tooltip.style.left = `${rect.right + padding}px`;
                this.tooltip.style.transform = 'translateY(-50%)';
                break;
            default:
                this.tooltip.style.top = '50%';
                this.tooltip.style.left = '50%';
                this.tooltip.style.transform = 'translate(-50%, -50%)';
                break;
        }

        this.adjustTooltipPosition();
    }

    adjustTooltipPosition() {
        const rect = this.tooltip.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        if (rect.right > vw) {
            this.tooltip.style.left = `${vw - rect.width - 16}px`;
            this.tooltip.style.transform = 'none';
        }
        if (rect.bottom > vh) {
            this.tooltip.style.top = `${vh - rect.height - 16}px`;
            this.tooltip.style.transform = 'none';
        }
        if (rect.left < 0) {
            this.tooltip.style.left = '16px';
            this.tooltip.style.transform = 'none';
        }
        if (rect.top < 0) {
            this.tooltip.style.top = '16px';
            this.tooltip.style.transform = 'none';
        }
    }

    clearHighlight() {
        if (this.highlightedElement) {
            this.highlightedElement.classList.remove('onboarding-highlight');
            this.highlightedElement = null;
        }
        if (this.overlay) {
            this.overlay.style.clipPath = 'none';
        }
    }

    waitForElement(selector, timeout = 6000) {
        return new Promise((resolve) => {
            const existing = document.querySelector(selector);
            if (existing) {
                resolve(existing);
                return;
            }

            const observer = new MutationObserver(() => {
                const match = document.querySelector(selector);
                if (match) {
                    observer.disconnect();
                    resolve(match);
                }
            });

            observer.observe(document.body, { childList: true, subtree: true });

            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, timeout);
        });
    }

    handleInteractiveStep(step) {
        return new Promise((resolve) => {
            const element = document.querySelector(step.target);
            if (!element) {
                resolve();
                return;
            }

            const clickHandler = () => {
                element.removeEventListener('click', clickHandler);
                if (step.waitFor) {
                    this.waitForElement(step.waitFor).then(() => setTimeout(resolve, 400));
                } else {
                    setTimeout(resolve, 300);
                }
            };

            element.addEventListener('click', clickHandler);

            const nextButton = this.tooltip.querySelector('#tour-next');
            const nextHandler = () => {
                element.removeEventListener('click', clickHandler);
                nextButton.removeEventListener('click', nextHandler);
                resolve();
            };
            nextButton.addEventListener('click', nextHandler, { once: true });
        });
    }

    updateProgress() {
        this.tooltip.querySelector('#tour-current-step').textContent = this.currentStep + 1;
        this.tooltip.querySelector('#tour-total-steps').textContent = this.steps.length;

        const progressBar = this.tooltip.querySelector('#tour-progress-bar');
        progressBar.style.width = `${((this.currentStep + 1) / this.steps.length) * 100}%`;
    }

    nextStep() {
        this.clearHighlight();
        this.showStep(this.currentStep + 1);
    }

    previousStep() {
        this.clearHighlight();
        this.showStep(this.currentStep - 1);
    }

    handleKeyboard = (event) => {
        if (!this.isActive) return;

        switch (event.key) {
            case 'Escape':
                this.skip();
                break;
            case 'ArrowRight':
            case 'Enter':
                if (this.currentStep < this.steps.length - 1) {
                    this.nextStep();
                } else {
                    this.complete();
                }
                break;
            case 'ArrowLeft':
                if (this.currentStep > 0) {
                    this.previousStep();
                }
                break;
        }
    };

    skip() {
        if (!confirm('Skip the tour? You can replay it anytime from Settings → Tutorial & Help.')) {
            return;
        }
        this.cleanup();
        this.manager.skip(false);
        this.resolve();
    }

    complete() {
        this.cleanup();
        this.showCompletionMessage().then(() => this.resolve());
    }

    showCompletionMessage() {
        return new Promise((resolve) => {
            const completion = window.OnboardingContent.tour.completion;
            const modal = document.createElement('div');
            modal.className = 'onboarding-modal-overlay';
            modal.innerHTML = `
                <div class="onboarding-modal completion">
                    <div class="modal-icon">🎉</div>
                    <h2>${completion.title}</h2>
                    <p>${completion.content}</p>
                    <button class="btn-primary btn-large" data-role="finish">${completion.action}</button>
                </div>
            `;

            document.body.appendChild(modal);
            modal.querySelector('[data-role="finish"]').addEventListener('click', () => {
                modal.remove();
                resolve();
            });
        });
    }

    cleanup() {
        this.isActive = false;
        this.clearHighlight();
        document.removeEventListener('keydown', this.handleKeyboard);
        this.overlay?.remove();
        this.tooltip?.remove();
        this.overlay = null;
        this.tooltip = null;
    }
}

if (typeof window !== 'undefined') {
    window.OnboardingTour = OnboardingTour;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingTour;
}







