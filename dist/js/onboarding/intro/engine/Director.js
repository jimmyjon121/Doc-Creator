/**
 * Director - Orchestrates the Cinematic Onboarding Experience
 * 
 * The Director coordinates:
 * - Scene sequencing and transitions
 * - Audio/visual synchronization
 * - Timeline management with GSAP
 * - User controls (play, pause, skip)
 * - Progress tracking
 */

class Director {
    constructor(options = {}) {
        // Configuration
        this.container = null;
        this.audioController = null;
        this.scenes = [];
        this.currentSceneIndex = -1;
        this.currentScene = null;
        
        // State
        this.isPlaying = false;
        this.isPaused = false;
        this.isComplete = false;
        this.hasAudio = false;
        
        // Callbacks
        this.onComplete = options.onComplete || (() => {});
        this.onSceneChange = options.onSceneChange || (() => {});
        this.onProgress = options.onProgress || (() => {});
        
        // Settings
        this.syncToAudio = options.syncToAudio !== false; // Default true
        this.showSubtitles = options.showSubtitles !== false; // Default true
        
        // UI Elements
        this.progressBar = null;
        this.subtitleElement = null;
        this.controlsElement = null;
        
        console.log('[Director] Created');
    }
    
    /**
     * Initialize the Director with scenes
     * @param {Array} sceneConfigs - Array of scene configurations
     */
    async init(sceneConfigs) {
        console.log('[Director] Initializing...');
        
        // Create audio controller
        this.audioController = new AudioController();
        
        try {
            await this.audioController.init();
            await this.audioController.loadTimingData();
            await this.audioController.loadAllVoiceovers();
            this.hasAudio = true;
            console.log('[Director] Audio initialized');
        } catch (error) {
            console.warn('[Director] Audio not available, running without sound:', error);
            this.hasAudio = false;
        }
        
        // Store scene configs
        this.scenes = sceneConfigs;
        
        // Create the main container
        this.createContainer();
        
        console.log('[Director] Initialized with', this.scenes.length, 'scenes');
    }
    
    /**
     * Create the main intro container
     */
    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'cinematic-intro';
        this.container.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: #0a0a1a;
            opacity: 0;
            transition: opacity 0.5s ease;
            overflow: hidden;
        `;
        
        this.container.innerHTML = `
            <!-- Persistent background with gradient -->
            <div class="intro-bg" style="
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse at 20% 30%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                    radial-gradient(ellipse at 80% 70%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
                    linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #0a0a1a 100%);
                z-index: 0;
            "></div>
            
            <!-- Scene container -->
            <div class="intro-stage" style="
                position: relative;
                width: 100%;
                height: 100%;
                z-index: 1;
                perspective: 1500px;
                perspective-origin: 50% 50%;
            "></div>
            
            <!-- Subtitles -->
            <div class="intro-subtitles" style="
                position: absolute;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 10;
                text-align: center;
                max-width: 800px;
                padding: 0 40px;
                pointer-events: none;
            ">
                <p class="subtitle-text" style="
                    font-size: 20px;
                    font-weight: 500;
                    color: white;
                    text-shadow: 0 2px 20px rgba(0,0,0,0.8);
                    line-height: 1.5;
                    opacity: 0;
                    transform: translateY(10px);
                    transition: opacity 0.3s, transform 0.3s;
                "></p>
            </div>
            
            <!-- Controls -->
            <div class="intro-controls" style="
                position: absolute;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                z-index: 20;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
            ">
                <!-- Progress bar -->
                <div class="intro-progress-container" style="
                    width: 300px;
                    height: 4px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 2px;
                    overflow: hidden;
                ">
                    <div class="intro-progress-bar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #6366F1, #8B5CF6);
                        border-radius: 2px;
                        transition: width 0.3s ease;
                    "></div>
                </div>
                
                <!-- Control buttons -->
                <div class="intro-buttons" style="
                    display: flex;
                    align-items: center;
                    gap: 12px;
                ">
                    <button class="intro-btn intro-btn-mute" title="Toggle Sound" style="
                        width: 40px;
                        height: 40px;
                        border-radius: 50%;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: white;
                        font-size: 16px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s;
                    ">🔊</button>
                    
                    <button class="intro-btn intro-btn-skip" style="
                        padding: 10px 24px;
                        border-radius: 8px;
                        background: rgba(255,255,255,0.1);
                        border: 1px solid rgba(255,255,255,0.2);
                        color: rgba(255,255,255,0.8);
                        font-size: 14px;
                        font-weight: 500;
                        cursor: pointer;
                        transition: all 0.2s;
                    ">Skip Intro →</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.container);
        
        // Cache UI elements
        this.stage = this.container.querySelector('.intro-stage');
        this.progressBar = this.container.querySelector('.intro-progress-bar');
        this.subtitleElement = this.container.querySelector('.subtitle-text');
        
        // Bind controls
        this.bindControls();
        
        // Fade in
        requestAnimationFrame(() => {
            this.container.style.opacity = '1';
        });
    }
    
    /**
     * Bind control button events
     */
    bindControls() {
        const skipBtn = this.container.querySelector('.intro-btn-skip');
        const muteBtn = this.container.querySelector('.intro-btn-mute');
        
        skipBtn.addEventListener('click', () => this.skip());
        
        muteBtn.addEventListener('click', () => {
            if (this.audioController) {
                const muted = this.audioController.toggleMute();
                muteBtn.textContent = muted ? '🔇' : '🔊';
            }
        });
        
        // Keyboard controls
        this.boundKeyHandler = (e) => {
            if (e.key === 'Escape') {
                this.skip();
            } else if (e.key === ' ') {
                e.preventDefault();
                this.togglePause();
            }
        };
        document.addEventListener('keydown', this.boundKeyHandler);
        
        // Hover effects
        const buttons = this.container.querySelectorAll('.intro-btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.background = 'rgba(255,255,255,0.2)';
                btn.style.borderColor = 'rgba(255,255,255,0.4)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'rgba(255,255,255,0.1)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            });
        });
    }
    
    /**
     * Start the intro from the beginning
     */
    async start() {
        if (this.isPlaying) return;
        
        console.log('[Director] Starting intro...');
        
        this.isPlaying = true;
        this.isPaused = false;
        this.isComplete = false;
        this.currentSceneIndex = -1;
        
        // Play background music if available
        if (this.hasAudio) {
            // this.audioController.playMusic('intro-music.mp3');
        }
        
        // Start first scene
        await this.playNextScene();
    }
    
    /**
     * Play the next scene
     */
    async playNextScene() {
        this.currentSceneIndex++;
        
        if (this.currentSceneIndex >= this.scenes.length) {
            this.complete();
            return;
        }
        
        const sceneConfig = this.scenes[this.currentSceneIndex];
        console.log(`[Director] Scene ${this.currentSceneIndex + 1}/${this.scenes.length}: ${sceneConfig.id}`);
        
        // Update progress
        this.updateProgress();
        
        // Notify scene change
        this.onSceneChange(sceneConfig.id, this.currentSceneIndex);
        
        // Clear stage for new scene
        this.clearStage();
        
        // Build the scene
        const sceneElement = sceneConfig.build(this);
        this.stage.appendChild(sceneElement);
        this.currentScene = sceneElement;
        
        // Get scene duration (from audio or config)
        let duration = sceneConfig.duration || 10;
        if (this.hasAudio && this.syncToAudio) {
            const audioDuration = this.audioController.getVoiceoverDuration(sceneConfig.id);
            if (audioDuration) {
                duration = audioDuration + 1; // Add 1 second buffer
            }
        }
        
        // Show subtitle if available
        if (sceneConfig.subtitle && this.showSubtitles) {
            this.showSubtitle(sceneConfig.subtitle);
        }
        
        // Play voiceover
        if (this.hasAudio) {
            this.audioController.playVoiceover(sceneConfig.id);
        }
        
        // Play scene animation
        const timeline = sceneConfig.animate(sceneElement, this);
        
        // Wait for animation to complete
        await new Promise(resolve => {
            timeline.eventCallback('onComplete', () => {
                this.hideSubtitle();
                resolve();
            });
        });
        
        // Small delay between scenes
        await this.delay(100);
        
        // Continue to next scene
        if (!this.isComplete && this.isPlaying) {
            await this.playNextScene();
        }
    }
    
    /**
     * Clear the stage
     */
    clearStage() {
        // Fade out and remove old scenes
        const oldScenes = this.stage.querySelectorAll('.scene');
        oldScenes.forEach(scene => {
            gsap.to(scene, {
                opacity: 0,
                duration: 0.3,
                onComplete: () => scene.remove()
            });
        });
    }
    
    /**
     * Show subtitle text
     */
    showSubtitle(text) {
        if (!this.subtitleElement) return;
        
        this.subtitleElement.textContent = text;
        gsap.to(this.subtitleElement, {
            opacity: 1,
            y: 0,
            duration: 0.3
        });
    }
    
    /**
     * Hide subtitle
     */
    hideSubtitle() {
        if (!this.subtitleElement) return;
        
        gsap.to(this.subtitleElement, {
            opacity: 0,
            y: 10,
            duration: 0.3
        });
    }
    
    /**
     * Update progress bar
     */
    updateProgress() {
        const progress = ((this.currentSceneIndex + 1) / this.scenes.length) * 100;
        if (this.progressBar) {
            this.progressBar.style.width = `${progress}%`;
        }
        this.onProgress(progress, this.currentSceneIndex, this.scenes.length);
    }
    
    /**
     * Play a sound effect
     */
    playSfx(name, options) {
        if (this.audioController) {
            this.audioController.playSfx(name, options);
        }
    }
    
    /**
     * Toggle pause state
     */
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    /**
     * Pause the intro
     */
    pause() {
        this.isPaused = true;
        gsap.globalTimeline.pause();
        if (this.audioController) {
            this.audioController.stopVoiceover();
        }
        console.log('[Director] Paused');
    }
    
    /**
     * Resume the intro
     */
    resume() {
        this.isPaused = false;
        gsap.globalTimeline.resume();
        console.log('[Director] Resumed');
    }
    
    /**
     * Skip the intro
     */
    skip() {
        console.log('[Director] Skipping...');
        this.isPlaying = false;
        this.cleanup();
        this.onComplete();
    }
    
    /**
     * Complete the intro normally
     */
    complete() {
        console.log('[Director] Complete');
        this.isComplete = true;
        this.isPlaying = false;
        
        // Final progress
        if (this.progressBar) {
            this.progressBar.style.width = '100%';
        }
        
        // Delay before cleanup to show final state
        setTimeout(() => {
            this.cleanup();
            this.onComplete();
        }, 500);
    }
    
    /**
     * Cleanup everything
     */
    cleanup() {
        // Stop all audio
        if (this.audioController) {
            this.audioController.stopAll();
            this.audioController.destroy();
            this.audioController = null;
        }
        
        // Remove keyboard listener
        if (this.boundKeyHandler) {
            document.removeEventListener('keydown', this.boundKeyHandler);
        }
        
        // Fade out and remove container
        if (this.container) {
            this.container.style.opacity = '0';
            setTimeout(() => {
                this.container?.remove();
                this.container = null;
            }, 500);
        }
        
        console.log('[Director] Cleaned up');
    }
    
    /**
     * Utility: delay promise
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get the stage element (for scenes to append to)
     */
    getStage() {
        return this.stage;
    }
    
    /**
     * Check if audio is available
     */
    hasAudioSupport() {
        return this.hasAudio;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.Director = Director;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Director;
}

