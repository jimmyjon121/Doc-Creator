/**
 * AudioController - Manages all audio for the Cinematic Onboarding
 * 
 * Handles:
 * - Voiceover track loading and playback
 * - Sound effects (SFX) triggered at timeline markers
 * - Background music with ducking (volume reduction during voice)
 * - Audio context management and cleanup
 */

class AudioController {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.voiceGain = null;
        this.sfxGain = null;
        this.musicGain = null;
        
        // Audio buffers
        this.voiceoverTracks = new Map(); // scene-id -> AudioBuffer
        this.sfxBuffers = new Map(); // sfx-name -> AudioBuffer
        this.musicBuffer = null;
        
        // Currently playing sources
        this.currentVoiceover = null;
        this.currentMusic = null;
        this.activeSfx = [];
        
        // Timing data from generated audio
        this.timingData = null;
        
        // State
        this.isInitialized = false;
        this.isMuted = false;
        this.masterVolume = 1.0;
        
        // Audio file paths
        this.basePath = 'assets/audio/';
        
        // SFX library (synthesized or loaded)
        this.sfxLibrary = {
            'whoosh': { type: 'synthesized', frequency: 200, duration: 0.3 },
            'pop': { type: 'synthesized', frequency: 400, duration: 0.1 },
            'click': { type: 'synthesized', frequency: 800, duration: 0.05 },
            'thud': { type: 'synthesized', frequency: 80, duration: 0.2 },
            'chime': { type: 'synthesized', frequency: 880, duration: 0.4 },
            'success': { type: 'synthesized', frequency: 523, duration: 0.6 },
            // V4 Hand-Drawn Warmth foley
            'paper': { type: 'synthesized', frequency: 2000, duration: 0.15 },
            'pencil': { type: 'synthesized', frequency: 3000, duration: 0.08 },
            'celebration': { type: 'synthesized', frequency: 660, duration: 0.8 }
        };
        
        console.log('[AudioController] Created');
    }
    
    /**
     * Initialize the audio context
     * Must be called after user interaction (browser requirement)
     */
    async init() {
        if (this.isInitialized) return;
        
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create gain nodes for mixing
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.value = this.masterVolume;
            
            this.voiceGain = this.audioContext.createGain();
            this.voiceGain.connect(this.masterGain);
            this.voiceGain.gain.value = 1.0;
            
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.connect(this.masterGain);
            this.sfxGain.gain.value = 0.7;
            
            this.musicGain = this.audioContext.createGain();
            this.musicGain.connect(this.masterGain);
            this.musicGain.gain.value = 0.3;
            
            // Pre-generate synthesized SFX
            await this.generateSynthesizedSfx();
            
            this.isInitialized = true;
            console.log('[AudioController] Initialized');
            
        } catch (error) {
            console.error('[AudioController] Failed to initialize:', error);
            throw error;
        }
    }
    
    /**
     * Load timing data from generated JSON
     */
    async loadTimingData(path = 'assets/audio/timing.json') {
        try {
            const response = await fetch(path);
            if (response.ok) {
                this.timingData = await response.json();
                console.log('[AudioController] Timing data loaded:', this.timingData);
                return this.timingData;
            }
        } catch (error) {
            console.warn('[AudioController] No timing data found, using defaults');
        }
        
        // Default timing if no file exists
        this.timingData = {
            scenes: {
                'welcome': { duration: 8, file: 'intro-scene-1.mp3' },
                'dashboard': { duration: 12, file: 'intro-scene-2.mp3' },
                'journey': { duration: 12, file: 'intro-scene-3.mp3' },
                'flightPlan': { duration: 14, file: 'intro-scene-4.mp3' },
                'programs': { duration: 16, file: 'intro-scene-5.mp3' },
                'ready': { duration: 10, file: 'intro-scene-6.mp3' }
            }
        };
        
        return this.timingData;
    }
    
    /**
     * Load a voiceover track for a scene
     */
    async loadVoiceover(sceneId, filename) {
        if (!this.isInitialized) await this.init();
        
        const path = this.basePath + filename;
        
        try {
            const response = await fetch(path);
            if (!response.ok) {
                console.warn(`[AudioController] Voiceover not found: ${path}`);
                return null;
            }
            
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.voiceoverTracks.set(sceneId, audioBuffer);
            console.log(`[AudioController] Loaded voiceover for ${sceneId}: ${audioBuffer.duration.toFixed(2)}s`);
            
            return audioBuffer;
            
        } catch (error) {
            console.warn(`[AudioController] Failed to load voiceover ${path}:`, error);
            return null;
        }
    }
    
    /**
     * Load all voiceovers based on timing data
     */
    async loadAllVoiceovers() {
        if (!this.timingData) await this.loadTimingData();
        
        const loadPromises = [];
        
        for (const [sceneId, data] of Object.entries(this.timingData.scenes)) {
            if (data.file) {
                loadPromises.push(this.loadVoiceover(sceneId, data.file));
            }
        }
        
        await Promise.all(loadPromises);
        console.log('[AudioController] All voiceovers loaded');
    }
    
    /**
     * Play voiceover for a scene
     * @returns {Promise} Resolves when voiceover finishes
     */
    playVoiceover(sceneId) {
        return new Promise((resolve) => {
            if (!this.isInitialized || this.isMuted) {
                resolve();
                return;
            }
            
            const buffer = this.voiceoverTracks.get(sceneId);
            if (!buffer) {
                console.log(`[AudioController] No voiceover for ${sceneId}`);
                resolve();
                return;
            }
            
            // Stop any current voiceover
            this.stopVoiceover();
            
            // Create source
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.voiceGain);
            
            // Duck the music
            this.duckMusic(true);
            
            source.onended = () => {
                this.currentVoiceover = null;
                this.duckMusic(false);
                resolve();
            };
            
            source.start(0);
            this.currentVoiceover = source;
            
            console.log(`[AudioController] Playing voiceover: ${sceneId}`);
        });
    }
    
    /**
     * Stop current voiceover
     */
    stopVoiceover() {
        if (this.currentVoiceover) {
            try {
                this.currentVoiceover.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentVoiceover = null;
            this.duckMusic(false);
        }
    }
    
    /**
     * Get the duration of a voiceover track
     */
    getVoiceoverDuration(sceneId) {
        const buffer = this.voiceoverTracks.get(sceneId);
        if (buffer) {
            return buffer.duration;
        }
        
        // Fall back to timing data
        if (this.timingData?.scenes?.[sceneId]) {
            return this.timingData.scenes[sceneId].duration;
        }
        
        // Default durations (V4 scenes)
        const defaults = {
            // V4 Hand-Drawn Warmth scenes
            'chaos': 15,
            'question': 7,
            'intro': 8,
            'dashboard': 15,
            'flightplan': 20,
            'programs': 15,
            'map': 15,
            'document': 15,
            'return': 15,
            'ready': 10,
            // Legacy scenes
            'welcome': 8,
            'journey': 12,
            'flightPlan': 14
        };
        
        return defaults[sceneId] || 10;
    }
    
    /**
     * Play voice for a scene (alias for playVoiceover)
     * Used by v4 scenes
     */
    playVoice(sceneId) {
        return this.playVoiceover(sceneId);
    }
    
    /**
     * Play SFX (alias for playSfx)
     * Used by v4 scenes
     */
    playSFX(name, options) {
        return this.playSfx(name, options);
    }
    
    /**
     * Generate synthesized SFX using Web Audio API
     */
    async generateSynthesizedSfx() {
        for (const [name, config] of Object.entries(this.sfxLibrary)) {
            if (config.type === 'synthesized') {
                const buffer = this.synthesizeSfx(config);
                this.sfxBuffers.set(name, buffer);
            }
        }
        console.log('[AudioController] Synthesized SFX generated');
    }
    
    /**
     * Synthesize a single SFX
     */
    synthesizeSfx(config) {
        const sampleRate = this.audioContext.sampleRate;
        const duration = config.duration;
        const length = sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);
        
        const frequency = config.frequency;
        
        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;
            const envelope = Math.exp(-t * 10); // Exponential decay
            
            // Different waveforms for different sounds
            let sample;
            if (frequency < 150) {
                // Low thud - sine wave
                sample = Math.sin(2 * Math.PI * frequency * t) * envelope;
            } else if (frequency < 500) {
                // Mid whoosh/pop - noise + sine
                sample = (Math.sin(2 * Math.PI * frequency * t) * 0.5 + (Math.random() * 2 - 1) * 0.5) * envelope;
            } else {
                // High click/chime - sine with harmonics
                sample = (Math.sin(2 * Math.PI * frequency * t) + 
                         Math.sin(2 * Math.PI * frequency * 2 * t) * 0.5 +
                         Math.sin(2 * Math.PI * frequency * 3 * t) * 0.25) * envelope / 1.75;
            }
            
            data[i] = sample;
        }
        
        return buffer;
    }
    
    /**
     * Play a sound effect
     */
    playSfx(name, options = {}) {
        if (!this.isInitialized || this.isMuted) return;
        
        const buffer = this.sfxBuffers.get(name);
        if (!buffer) {
            console.warn(`[AudioController] SFX not found: ${name}`);
            return;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        // Optional pitch shift
        if (options.pitch) {
            source.playbackRate.value = options.pitch;
        }
        
        // Optional volume
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = options.volume || 1.0;
        
        source.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        source.start(0);
        this.activeSfx.push(source);
        
        source.onended = () => {
            const idx = this.activeSfx.indexOf(source);
            if (idx > -1) this.activeSfx.splice(idx, 1);
        };
    }
    
    /**
     * Play background music (looped)
     */
    async playMusic(filename) {
        if (!this.isInitialized || this.isMuted) return;
        
        try {
            const path = this.basePath + filename;
            const response = await fetch(path);
            if (!response.ok) return;
            
            const arrayBuffer = await response.arrayBuffer();
            this.musicBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            
            this.currentMusic = this.audioContext.createBufferSource();
            this.currentMusic.buffer = this.musicBuffer;
            this.currentMusic.loop = true;
            this.currentMusic.connect(this.musicGain);
            this.currentMusic.start(0);
            
            console.log('[AudioController] Music started');
            
        } catch (error) {
            console.warn('[AudioController] Failed to load music:', error);
        }
    }
    
    /**
     * Stop background music
     */
    stopMusic() {
        if (this.currentMusic) {
            try {
                this.currentMusic.stop();
            } catch (e) {}
            this.currentMusic = null;
        }
    }
    
    /**
     * Duck (lower) music volume during voiceover
     */
    duckMusic(duck) {
        if (!this.musicGain) return;
        
        const targetVolume = duck ? 0.1 : 0.3;
        const currentTime = this.audioContext.currentTime;
        
        this.musicGain.gain.cancelScheduledValues(currentTime);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, currentTime);
        this.musicGain.gain.linearRampToValueAtTime(targetVolume, currentTime + 0.3);
    }
    
    /**
     * Set master volume
     */
    setVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.value = this.masterVolume;
        }
    }
    
    /**
     * Mute/unmute all audio
     */
    setMuted(muted) {
        this.isMuted = muted;
        if (this.masterGain) {
            this.masterGain.gain.value = muted ? 0 : this.masterVolume;
        }
    }
    
    /**
     * Toggle mute
     */
    toggleMute() {
        this.setMuted(!this.isMuted);
        return this.isMuted;
    }
    
    /**
     * Stop all audio
     */
    stopAll() {
        this.stopVoiceover();
        this.stopMusic();
        
        for (const source of this.activeSfx) {
            try {
                source.stop();
            } catch (e) {}
        }
        this.activeSfx = [];
    }
    
    /**
     * Cleanup and destroy
     */
    destroy() {
        this.stopAll();
        
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.voiceoverTracks.clear();
        this.sfxBuffers.clear();
        this.isInitialized = false;
        
        console.log('[AudioController] Destroyed');
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AudioController = AudioController;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioController;
}

