/**
 * Onboarding Video Component
 * Animated intro that mirrors CareConnect's visual design.
 */

class OnboardingVideo {
    constructor(manager) {
        this.manager = manager;
        this.currentScene = 0;
        this.container = null;
        this.canSkip = false;
    }

    play() {
        return new Promise((resolve) => {
            this.resolve = resolve;
            this.createVideoContainer();
            this.startVideo();

            setTimeout(() => {
                this.canSkip = true;
                this.showSkipButton();
            }, 5000);
        });
    }

    createVideoContainer() {
        this.container = document.createElement('div');
        this.container.className = 'onboarding-video-overlay';
        this.container.innerHTML = `
            <div class="onboarding-video-container">
                <div class="video-content">
                    <div class="video-scene" id="video-scene"></div>
                    <div class="video-caption" id="video-caption"></div>
                </div>
                <div class="video-controls">
                    <div class="video-progress">
                        <div class="progress-bar" id="video-progress-bar"></div>
                    </div>
                    <button class="skip-button hidden" id="skip-video">Skip Intro</button>
                </div>
            </div>
        `;
        document.body.appendChild(this.container);
        this.container.querySelector('#skip-video').addEventListener('click', () => this.skip());
    }

    async startVideo() {
        const scenes = window.OnboardingContent.video.scenes;

        for (let i = 0; i < scenes.length; i++) {
            this.currentScene = i;
            await this.playScene(scenes[i], i, scenes.length);
        }

        this.complete();
    }

    playScene(scene, index, total) {
        return new Promise((resolve) => {
            const sceneElement = document.getElementById('video-scene');
            const captionElement = document.getElementById('video-caption');
            const progressBar = document.getElementById('video-progress-bar');

            progressBar.style.width = `${((index + 1) / total) * 100}%`;

            sceneElement.innerHTML = '';
            sceneElement.className = 'video-scene';

            this.renderScene(scene, sceneElement);

            captionElement.textContent = scene.caption;
            captionElement.classList.add('fade-in');

            setTimeout(() => {
                captionElement.classList.remove('fade-in');
                resolve();
            }, scene.duration);
        });
    }

    renderScene(scene, container) {
        container.classList.add(`scene-${scene.id}`);

        switch (scene.id) {
            case 'problem':
                this.renderProblemScene(container);
                break;
            case 'solution':
                this.renderSolutionScene(container);
                break;
            case 'impact':
                this.renderImpactScene(container);
                break;
            case 'cta':
                this.renderCtaScene(container);
                break;
        }
    }

    renderProblemScene(container) {
        container.innerHTML = `
            <svg class="scene-svg" viewBox="0 0 420 300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="desk-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="rgba(79,70,229,0.8)"/>
                        <stop offset="100%" stop-color="rgba(124,58,237,0.8)"/>
                    </linearGradient>
                </defs>
                <rect x="50" y="210" width="320" height="70" rx="8" fill="url(#desk-gradient)" opacity="0.85"/>

                <g class="paper-stack stack-1">
                    <rect x="75" y="170" width="70" height="40" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                    <rect x="78" y="166" width="70" height="40" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                    <rect x="81" y="162" width="70" height="40" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                </g>

                <g class="paper-stack stack-2">
                    <rect x="165" y="160" width="70" height="50" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                    <rect x="168" y="156" width="70" height="50" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                    <rect x="171" y="152" width="70" height="50" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                </g>

                <g class="paper-stack stack-3">
                    <rect x="255" y="165" width="70" height="45" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                    <rect x="258" y="161" width="70" height="45" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                    <rect x="261" y="157" width="70" height="45" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.08)" stroke-width="2"/>
                </g>

                <g class="person-stressed">
                    <circle cx="210" cy="110" r="28" fill="var(--onboarding-warning)" opacity="0.95"/>
                    <text x="210" y="120" text-anchor="middle" font-size="34">😰</text>
                </g>

                <g class="clock-ticking">
                    <circle cx="330" cy="90" r="34" fill="var(--onboarding-light)" stroke="rgba(17,24,39,0.15)" stroke-width="2"/>
                    <circle cx="330" cy="90" r="4" fill="var(--onboarding-dark)"/>
                    <line x1="330" y1="90" x2="330" y2="64" stroke="var(--onboarding-danger)" stroke-width="4" class="clock-hand"/>
                </g>
            </svg>
        `;
    }

    renderSolutionScene(container) {
        container.innerHTML = `
            <svg class="scene-svg" viewBox="0 0 420 300" xmlns="http://www.w3.org/2000/svg">
                <rect x="90" y="75" width="220" height="150" rx="14" fill="var(--onboarding-dark)" opacity="0.95"/>
                <rect x="106" y="90" width="188" height="115" rx="10" fill="rgba(255,255,255,0.1)"/>

                <g class="dashboard-elements">
                    <rect x="120" y="105" width="56" height="32" rx="6" fill="var(--onboarding-danger)" class="fade-in-up delay-1"/>
                    <text x="148" y="126" text-anchor="middle" font-size="12" fill="white">Red</text>

                    <rect x="186" y="105" width="56" height="32" rx="6" fill="var(--onboarding-warning)" class="fade-in-up delay-2"/>
                    <text x="214" y="126" text-anchor="middle" font-size="12" fill="white">Yellow</text>

                    <rect x="252" y="105" width="56" height="32" rx="6" fill="var(--onboarding-success)" class="fade-in-up delay-3"/>
                    <text x="280" y="126" text-anchor="middle" font-size="12" fill="white">Green</text>

                    <rect x="120" y="152" width="188" height="10" rx="5" fill="rgba(255,255,255,0.12)"/>
                    <rect x="120" y="152" width="160" height="10" rx="5" fill="var(--onboarding-primary)" class="progress-fill"/>

                    <rect x="120" y="176" width="188" height="10" rx="5" fill="rgba(255,255,255,0.12)"/>
                    <rect x="120" y="176" width="128" height="10" rx="5" fill="var(--onboarding-primary)" class="progress-fill"/>
                </g>

                <g class="person-happy">
                    <circle cx="210" cy="248" r="28" fill="var(--onboarding-warning)" opacity="0.95"/>
                    <text x="210" y="259" text-anchor="middle" font-size="32">😊</text>
                </g>

                <text x="90" y="210" font-size="26" fill="var(--onboarding-light)" opacity="0.6" class="floating-check delay-1">✓</text>
                <text x="320" y="194" font-size="26" fill="var(--onboarding-light)" opacity="0.6" class="floating-check delay-2">✓</text>
                <text x="126" y="236" font-size="26" fill="var(--onboarding-light)" opacity="0.6" class="floating-check delay-3">✓</text>
            </svg>
        `;
    }

    renderImpactScene(container) {
        container.innerHTML = `
            <svg class="scene-svg" viewBox="0 0 420 300" xmlns="http://www.w3.org/2000/svg">
                <g class="before-time">
                    <rect x="60" y="90" width="120" height="110" rx="16" fill="rgba(239,68,68,0.15)"/>
                    <text x="120" y="134" text-anchor="middle" font-size="38" fill="var(--onboarding-danger)" font-weight="700">45</text>
                    <text x="120" y="160" text-anchor="middle" font-size="16" fill="var(--onboarding-dark)">minutes</text>
                    <text x="120" y="183" text-anchor="middle" font-size="13" fill="var(--onboarding-dark)" opacity="0.6">before</text>
                </g>

                <g class="transform-arrow">
                    <line x1="205" y1="145" x2="235" y2="145" stroke="var(--onboarding-primary)" stroke-width="5"/>
                    <polygon points="235,145 222,138 222,152" fill="var(--onboarding-primary)"/>
                </g>

                <g class="after-time">
                    <rect x="240" y="90" width="120" height="110" rx="16" fill="rgba(34,197,94,0.15)"/>
                    <text x="300" y="134" text-anchor="middle" font-size="38" fill="var(--onboarding-success)" font-weight="700">30</text>
                    <text x="300" y="160" text-anchor="middle" font-size="16" fill="var(--onboarding-dark)">seconds</text>
                    <text x="300" y="183" text-anchor="middle" font-size="13" fill="var(--onboarding-dark)" opacity="0.6">after</text>
                </g>

                <text x="170" y="70" font-size="26" class="sparkle delay-1">✨</text>
                <text x="260" y="62" font-size="26" class="sparkle delay-2">✨</text>
                <text x="210" y="226" font-size="26" class="sparkle delay-3">✨</text>

                <g class="savings-badge">
                    <circle cx="210" cy="242" r="42" fill="var(--onboarding-primary)" class="pulse"/>
                    <text x="210" y="238" text-anchor="middle" font-size="16" font-weight="700" fill="white">90×</text>
                    <text x="210" y="256" text-anchor="middle" font-size="12" fill="white">faster</text>
                </g>
            </svg>
        `;
    }

    renderCtaScene(container) {
        container.innerHTML = `
            <svg class="scene-svg" viewBox="0 0 420 300" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="cta-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="var(--onboarding-primary)"/>
                        <stop offset="100%" stop-color="var(--onboarding-secondary)"/>
                    </linearGradient>
                </defs>

                <circle cx="210" cy="130" r="70" fill="url(#cta-ring)" opacity="0.95" class="scale-in"/>
                <text x="210" y="148" text-anchor="middle" font-size="46" font-weight="700" fill="white">CC</text>

                <text x="210" y="205" text-anchor="middle" font-size="24" fill="var(--onboarding-dark)" font-weight="700" class="fade-in">
                    CareConnect Pro
                </text>
                <text x="210" y="232" text-anchor="middle" font-size="15" fill="var(--onboarding-dark)" opacity="0.7" class="fade-in delay-1">
                    Focus on care, we handle compliance.
                </text>

                <g class="ready-indicator fade-in delay-2">
                    <rect x="150" y="250" width="120" height="34" rx="18" fill="var(--onboarding-success)"/>
                    <text x="210" y="272" text-anchor="middle" font-size="14" fill="white" font-weight="700">
                        Let’s go →
                    </text>
                </g>
            </svg>
        `;
    }

    showSkipButton() {
        const button = this.container?.querySelector('#skip-video');
        if (button) button.classList.remove('hidden');
    }

    skip() {
        if (!this.canSkip) return;
        this.cleanup();
        this.resolve();
    }

    complete() {
        setTimeout(() => {
            this.cleanup();
            this.resolve();
        }, 800);
    }

    cleanup() {
        if (this.container) {
            this.container.classList.add('fade-out');
            setTimeout(() => {
                this.container?.remove();
                this.container = null;
            }, 300);
        }
    }
}

if (typeof window !== 'undefined') {
    window.OnboardingVideo = OnboardingVideo;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = OnboardingVideo;
}



