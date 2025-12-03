/**
 * AudioController - Manages voiceover, SFX, and background music
 * 
 * Features:
 * - Preloads audio assets
 * - Handles playback synchronization
 * - Manages volume ducking
 * - Falls back gracefully if audio is missing/blocked
 */

class AudioController {
    constructor() {
        this.audioContext = null;
        this.assets = new Map();
        this.gainNodes = {};
        this.enabled = false;
        this.isMuted = false;
        
        // Configuration
        this.config = {
            musicVolume: 0.15,
            voiceVolume: 1.0,
            sfxVolume: 0.4,
            fadeDuration: 0.5
        };
    }

    /**
     * Initialize the audio engine
     * Must be called after user interaction to unlock AudioContext
     */
    async init() {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // Create gain nodes for mixing
            this.gainNodes.master = this.audioContext.createGain();
            this.gainNodes.music = this.audioContext.createGain();
            this.gainNodes.voice = this.audioContext.createGain();
            this.gainNodes.sfx = this.audioContext.createGain();
            
            // Set initial volumes
            this.gainNodes.master.connect(this.audioContext.destination);
            this.gainNodes.music.connect(this.gainNodes.master);
            this.gainNodes.voice.connect(this.gainNodes.master);
            this.gainNodes.sfx.connect(this.gainNodes.master);
            
            this.gainNodes.music.gain.value = this.config.musicVolume;
            this.gainNodes.voice.gain.value = this.config.voiceVolume;
            this.gainNodes.sfx.gain.value = this.config.sfxVolume;
            
            this.enabled = true;
            console.log('[Audio] Initialized');
            
            // Resume context if suspended (browser policy)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
        } catch (e) {
            console.warn('[Audio] Initialization failed:', e);
            this.enabled = false;
        }
    }

    /**
     * Load a set of audio assets
     * @param {Object} manifest - Map of id -> url
     */
    async loadAssets(manifest) {
        if (!this.enabled) return;
        
        const loads = Object.entries(manifest).map(async ([id, url]) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                this.assets.set(id, audioBuffer);
                console.log(`[Audio] Loaded asset: ${id}`);
            } catch (e) {
                console.warn(`[Audio] Failed to load asset: ${id}`, e);
            }
        });
        
        await Promise.all(loads);
    }

    /**
     * Play a specific sound
     * @param {string} id - Asset ID
     * @param {string} type - 'music', 'voice', or 'sfx'
     */
    play(id, type = 'sfx') {
        if (!this.enabled || this.isMuted) return null;
        
        const buffer = this.assets.get(id);
        if (!buffer) {
            // console.warn(`[Audio] Asset not found: ${id}`);
            return null;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.gainNodes[type];
        source.connect(gainNode);
        
        source.start(0);
        
        return source;
    }

    /**
     * Play voiceover track with ducking
     */
    playVoiceover(id) {
        if (!this.enabled) return 0;
        
        // Duck music
        const now = this.audioContext.currentTime;
        this.gainNodes.music.gain.cancelScheduledValues(now);
        this.gainNodes.music.gain.setValueAtTime(this.gainNodes.music.gain.value, now);
        this.gainNodes.music.gain.linearRampToValueAtTime(this.config.musicVolume * 0.3, now + 0.3);
        
        const source = this.play(id, 'voice');
        
        if (source) {
            // Restore music on end
            source.onended = () => {
                const end = this.audioContext.currentTime;
                this.gainNodes.music.gain.cancelScheduledValues(end);
                this.gainNodes.music.gain.setValueAtTime(this.gainNodes.music.gain.value, end);
                this.gainNodes.music.gain.linearRampToValueAtTime(this.config.musicVolume, end + 1.0);
            };
            
            return source.buffer.duration;
        }
        
        return 0;
    }

    /**
     * Toggle mute state
     */
    toggleMute() {
        if (!this.enabled) return;
        
        this.isMuted = !this.isMuted;
        const now = this.audioContext.currentTime;
        const target = this.isMuted ? 0 : 1;
        
        this.gainNodes.master.gain.cancelScheduledValues(now);
        this.gainNodes.master.gain.linearRampToValueAtTime(target, now + 0.1);
        
        return this.isMuted;
    }
    
    /**
     * Get duration of an asset
     */
    getDuration(id) {
        const buffer = this.assets.get(id);
        return buffer ? buffer.duration : 0;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AudioController = AudioController;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioController;
}

