/**
 * Onboarding Manager
 * Detects new users, orchestrates the welcome video, guided tour and practice mode.
 */

class OnboardingManager {
    constructor() {
        this.storageKey = 'careconnect_onboarding';
        this.state = this.loadState();
        this.video = null;
        this.tour = null;
        this.practice = null;
        this.shortcutRegistered = false;
    }

    loadState() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                return {
                    started: false,
                    completed: false,
                    skipped: false,
                    videoWatched: false,
                    tourCompleted: false,
                    practiceCompleted: false,
                    currentStep: 0,
                    completedSteps: [],
                    lastAccessed: null,
                    version: '1.0',
                    ...parsed
                };
            } catch (error) {
                console.warn('[Onboarding] Failed to parse state, using defaults', error);
            }
        }

        return {
            started: false,
            completed: false,
            skipped: false,
            videoWatched: false,
            tourCompleted: false,
            practiceCompleted: false,
            currentStep: 0,
            completedSteps: [],
            lastAccessed: null,
            version: '1.0'
        };
    }

    saveState() {
        try {
            this.state.lastAccessed = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (error) {
            console.error('[Onboarding] Unable to persist state', error);
        }
    }

    isNewUser() {
        return !this.state.completed && !this.state.skipped;
    }

    shouldAutoLaunch() {
        if (!this.state.started) return true;
        if (this.state.completed || this.state.skipped) return false;

        if (this.state.lastAccessed) {
            const lastAccess = new Date(this.state.lastAccessed);
            const daysSince = (Date.now() - lastAccess.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince < 7;
        }

        return true;
    }

    async initialize() {
        if (this.initialized) {
            console.log('[Onboarding] Manager already initialized');
            return;
        }
        this.initialized = true;

        console.log('🎓 Onboarding manager ready');
        console.log('[Onboarding] State:', this.state);
        console.log('[Onboarding] Is new user?', this.isNewUser());
        console.log('[Onboarding] Should auto-launch?', this.shouldAutoLaunch());

        if (window.OnboardingVideo) {
            this.video = new window.OnboardingVideo(this);
        }

        if (window.OnboardingTour) {
            this.tour = new window.OnboardingTour(this);
        }

        if (window.OnboardingPractice) {
            this.practice = new window.OnboardingPractice(this);
            window.onboardingPractice = this.practice;
        }

        this.registerShortcut();
        this.showProgressBadge();
        this.addReplayOption();

        if (this.shouldAutoLaunch()) {
            console.log('[Onboarding] Auto-launching in 1 second...');
            setTimeout(() => this.start(), 1000);
        } else {
            console.log('[Onboarding] Not auto-launching (already completed or skipped)');
        }
    }

    async start() {
        console.log('🎬 Launching onboarding flow');

        // Require User Agreement once per version before continuing onboarding.
        // The agreement text itself stays neutral; this is enforced only via app logic.
        if (typeof window !== 'undefined' && typeof window.ensureUserAgreementAccepted === 'function') {
            const accepted = await window.ensureUserAgreementAccepted();
            if (!accepted) {
                // If somehow not accepted, stop the onboarding flow.
                return;
            }
        }

        this.state.started = true;
        this.saveState();

        if (!this.state.videoWatched && this.video) {
            await this.video.play();
            this.state.videoWatched = true;
            this.saveState();
        }

        if (!this.state.tourCompleted && this.tour) {
            await this.tour.start();
            this.state.tourCompleted = true;
            this.saveState();
        }

        if (!this.state.practiceCompleted && this.practice) {
            const wantsPractice = await this.showPracticePrompt();
            if (wantsPractice) {
                await this.practice.start();
                this.state.practiceCompleted = true;
                this.saveState();
            }
        }

        this.complete();
    }

    showPracticePrompt() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'onboarding-modal-overlay';
            modal.innerHTML = `
                <div class="onboarding-modal practice-prompt">
                    <div class="modal-icon">🎯</div>
                    <h2>Ready to Practice?</h2>
                    <p>Try everything with sandbox clients so your first real chart feels familiar.</p>
                    <div class="modal-actions">
                        <button class="btn-secondary" data-role="skip">Skip Practice</button>
                        <button class="btn-primary" data-role="start">Let's Practice</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            modal.querySelector('[data-role="start"]').addEventListener('click', () => {
                modal.remove();
                resolve(true);
            });

            modal.querySelector('[data-role="skip"]').addEventListener('click', () => {
                modal.remove();
                resolve(false);
            });
        });
    }

    skip(showToast = true) {
        this.state.skipped = true;
        this.state.completed = false;
        this.saveState();
        if (showToast) {
            this.showNotification('Tutorial skipped. Replay anytime from Settings → Tutorial & Help.', 'info');
        }
    }

    complete() {
        this.state.completed = true;
        this.state.skipped = false;
        this.saveState();

        this.showCompletionCelebration();
        this.showProgressBadge(true);
    }

    showCompletionCelebration() {
        const modal = document.createElement('div');
        modal.className = 'onboarding-modal-overlay celebration';
        modal.innerHTML = `
            <div class="onboarding-modal completion">
                <div class="confetti-container"></div>
                <div class="modal-icon celebration-icon">🎉</div>
                <h2>You're All Set!</h2>
                <p>Great job! You’re ready to streamline the work day with CareConnect.</p>
                <div class="completion-stats">
                    <div class="stat">
                        <div class="stat-icon">✓</div>
                        <div class="stat-label">Video Watched</div>
                    </div>
                    <div class="stat">
                        <div class="stat-icon">✓</div>
                        <div class="stat-label">Tour Completed</div>
                    </div>
                    ${this.state.practiceCompleted ? `
                        <div class="stat">
                            <div class="stat-icon">✓</div>
                            <div class="stat-label">Practice Done</div>
                        </div>
                    ` : ''}
                </div>
                <div class="pro-tip">
                    <strong>Pro tip:</strong> Start every morning by clearing the red zone, then check house weather.
                </div>
                <button class="btn-primary btn-large" data-role="close">Start Using CareConnect</button>
            </div>
        `;

        document.body.appendChild(modal);
        this.triggerConfetti(modal.querySelector('.confetti-container'));
        modal.querySelector('[data-role="close"]').addEventListener('click', () => modal.remove());
    }

    triggerConfetti(container) {
        const palette = [
            'var(--onboarding-primary)',
            'var(--onboarding-secondary)',
            'var(--onboarding-success)',
            'var(--onboarding-warning)',
            'var(--onboarding-danger)'
        ];

        const count = 60;
        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'confetti';
            piece.style.left = `${Math.random() * 100}%`;
            piece.style.background = `var(--onboarding-primary)`;
            piece.style.setProperty('--confetti-color', palette[i % palette.length]);
            piece.style.background = palette[i % palette.length];
            piece.style.animationDelay = `${Math.random() * 2}s`;
            piece.style.animationDuration = `${Math.random() * 2 + 3}s`;
            container.appendChild(piece);
        }
    }

    replay() {
        const previouslyCompleted = this.state.completed;
        this.state = {
            started: false,
            completed: false,
            skipped: false,
            videoWatched: false,
            tourCompleted: false,
            practiceCompleted: false,
            currentStep: 0,
            completedSteps: [],
            lastAccessed: null,
            version: '1.0',
            isReplay: true
        };
        this.saveState();

        this.start().then(() => {
            if (previouslyCompleted) {
                this.state.completed = true;
                this.saveState();
            }
        });
    }

    addReplayOption() {
        const render = () => {
            const menu = document.querySelector('.settings-menu, .help-menu');
            if (!menu || menu.querySelector('.replay-tutorial')) return;

            const button = document.createElement('button');
            button.className = 'menu-item replay-tutorial';
            button.innerHTML = `
                <span class="menu-icon">🎓</span>
                <span class="menu-label">Replay Tutorial</span>
                <span class="menu-meta">${this.getProgress()}% complete</span>
            `;
            button.addEventListener('click', () => this.replay());
            menu.appendChild(button);
        };

        const observer = new MutationObserver(render);
        observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(render, 500);
        setTimeout(() => observer.disconnect(), 10000);
    }

    updateStep(stepIndex) {
        this.state.currentStep = stepIndex;
        if (!this.state.completedSteps.includes(stepIndex)) {
            this.state.completedSteps.push(stepIndex);
        }
        this.saveState();
        this.showProgressBadge();
    }

    getProgress() {
        let completed = 0;
        let total = 3; // video, tour, practice

        if (this.state.videoWatched) completed++;
        if (this.state.tourCompleted) completed++;
        if (this.state.practiceCompleted) completed++;

        return Math.round((completed / total) * 100);
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `onboarding-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        requestAnimationFrame(() => notification.classList.add('show'));
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3200);
    }

    showProgressBadge(forceComplete = false) {
        const badgeId = 'onboarding-progress-badge';
        let badge = document.getElementById(badgeId);

        if (!this.isNewUser() && !forceComplete) {
            if (badge) badge.remove();
            return;
        }

        if (!badge) {
            badge = document.createElement('div');
            badge.id = badgeId;
            badge.className = 'onboarding-notification info';
            document.body.appendChild(badge);
            requestAnimationFrame(() => badge.classList.add('show'));
        }

        const progress = this.getProgress();
        badge.textContent = `Tutorial progress: ${progress}% complete`;
        if (progress === 100 || forceComplete) {
            badge.textContent = 'Tutorial complete! Replay anytime from Settings.';
            setTimeout(() => badge.remove(), 4000);
        }
    }

    registerShortcut() {
        if (this.shortcutRegistered) return;
        this.shortcutRegistered = true;

        document.addEventListener('keydown', (event) => {
            const isShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'h';
            if (!isShortcut) return;
            event.preventDefault();
            this.replay();
            this.showNotification('Replaying onboarding tutorial.', 'info');
        });
    }

    reset() {
        localStorage.removeItem(this.storageKey);
        this.state = this.loadState();
        this.showNotification('Onboarding has been reset. Reload to start again.', 'info');
    }
}

if (typeof window !== 'undefined') {
    window.onboardingManager = new OnboardingManager();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingManager;
}


