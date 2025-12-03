/**
 * Director - Orchestrates the cinematic onboarding experience
 * 
 * Responsibilities:
 * - Manages the master timeline
 * - Synchronizes audio and visuals
 * - Handles scene transitions
 * - Manages loading state
 */

class Director {
    constructor(config = {}) {
        this.config = config;
        this.audio = new AudioController();
        this.timeline = null;
        this.scenes = []; // Populated by OnboardingIntro
        this.isPlaying = false;
        this.isLoading = true;
        
        // Default timing if audio is missing
        this.defaultTiming = {
            welcome: 8,
            dashboard: 12,
            journey: 12,
            flightPlan: 14,
            programs: 16,
            ready: 10
        };
        
        this.timing = { ...this.defaultTiming };
    }

    /**
     * Initialize the director and load assets
     */
    async init() {
        console.log('[Director] Initializing...');
    }

    /**
     * Start the experience
     */
    async start(container) {
        if (this.isPlaying) return;
        
        console.log('[Director] Action!');
        this.container = container;
        this.stage = container.querySelector('.intro-stage');
        
        // Init audio on user gesture
        await this.audio.init();
        
        // Load audio assets
        await this.loadAudioAssets();
        
        this.isPlaying = true;
        this.isLoading = false;
        
        // Create master timeline
        this.buildMasterTimeline();
        this.timeline.play();
        
        return new Promise(resolve => {
            this.onComplete = resolve;
        });
    }

    /**
     * Load all audio assets
     */
    async loadAudioAssets() {
        const manifest = {
            'bg-music': 'assets/audio/background.mp3',
            'sfx-click': 'assets/audio/click.mp3',
            'sfx-whoosh': 'assets/audio/whoosh.mp3',
            'sfx-pop': 'assets/audio/pop.mp3',
            'vo-welcome': 'assets/audio/intro-scene-1.mp3',
            'vo-dashboard': 'assets/audio/intro-scene-2.mp3',
            'vo-journey': 'assets/audio/intro-scene-3.mp3',
            'vo-flightplan': 'assets/audio/intro-scene-4.mp3',
            'vo-programs': 'assets/audio/intro-scene-5.mp3',
            'vo-ready': 'assets/audio/intro-scene-6.mp3'
        };
        
        console.log('[Director] Loading audio assets...');
        await this.audio.loadAssets(manifest);
        
        // Update timing based on actual audio duration
        this.updateTimingFromAudio();
    }

    /**
     * Update scene durations based on loaded voiceovers
     */
    updateTimingFromAudio() {
        const map = {
            'welcome': 'vo-welcome',
            'dashboard': 'vo-dashboard',
            'journey': 'vo-journey',
            'flightPlan': 'vo-flightplan',
            'programs': 'vo-programs',
            'ready': 'vo-ready'
        };
        
        for (const [scene, asset] of Object.entries(map)) {
            const duration = this.audio.getDuration(asset);
            if (duration > 0) {
                // Add buffer for transitions
                this.timing[scene] = duration + 1.5;
                console.log(`[Director] Scene '${scene}' duration set to ${this.timing[scene].toFixed(2)}s (from audio)`);
            }
        }
    }

    /**
     * Build the master timeline from scenes
     */
    buildMasterTimeline() {
        this.timeline = gsap.timeline({
            onUpdate: () => this.updateProgress(),
            onComplete: () => this.finish()
        });
        
        let currentTime = 0;
        
        this.scenes.forEach((sceneObj) => {
            const { id, instance } = sceneObj;
            const duration = this.timing[id] || 10;
            
            // Mount scene
            this.timeline.call(() => {
                console.log(`[Director] Mounting scene: ${id}`);
                instance.mount(this.stage);
            }, null, currentTime);
            
            // Build scene animation
            instance.build(this.timeline, currentTime, duration);
            
            // Unmount scene (overlap slightly for smooth transition)
            const unmountTime = currentTime + duration;
            
            // Fade out at end
            this.timeline.to(instance.container, { 
                opacity: 0, 
                duration: 0.5, 
                ease: 'power1.in' 
            }, unmountTime - 0.5);
            
            // Remove from DOM
            this.timeline.call(() => {
                console.log(`[Director] Unmounting scene: ${id}`);
                instance.unmount();
            }, null, unmountTime);
            
            currentTime += duration;
        });
    }
    
    updateProgress() {
        if (this.container) {
            const bar = this.container.querySelector('.intro-progress-bar');
            if (bar) {
                const progress = this.timeline.progress();
                bar.style.width = `${progress * 100}%`;
            }
        }
    }

    /**
     * Play a sound effect
     */
    playSfx(id) {
        this.audio.play(`sfx-${id}`);
    }

    /**
     * Play voiceover for a scene
     */
    playVoice(sceneId) {
        const assetId = `vo-${sceneId}`;
        this.audio.playVoiceover(assetId);
    }

    /**
     * Stop everything
     */
    stop() {
        this.isPlaying = false;
        if (this.timeline) this.timeline.kill();
        if (this.onComplete) this.onComplete();
    }
    
    finish() {
        // Don't auto-close, let the Ready scene handle it or user click
        // But if timeline finishes, we're effectively done
    }
}

// Export
if (typeof window !== 'undefined') {
    window.Director = Director;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Director;
}
