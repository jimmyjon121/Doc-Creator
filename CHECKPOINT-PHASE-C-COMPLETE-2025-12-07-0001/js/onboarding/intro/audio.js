/**
 * AudioController
 * 
 * Manages voiceover playback for the onboarding intro.
 * Supports:
 * 1. High-quality pre-recorded MP3s (Preferred)
 * 2. Browser Native TTS (Fallback for development/testing)
 */

class AudioController {
    constructor() {
        this.audio = new Audio();
        this.isMuted = false;
        this.usingTTS = false;
        
        // Voiceover scripts for TTS fallback
        this.scripts = {
            welcome: "Welcome to Care Connect Pro. Your command center for case management.",
            dashboard: "Every day starts here, on your Coach Dashboard. See your caseload, priorities, and what needs attention, all in one view.",
            journey: "The Client Journey shows how many clients are in each treatment stage. Click any stage to filter your tasks.",
            flightPlan: "Your Daily Flight Plan groups tasks by urgency. Red means now. Clear the red zone first.",
            programs: "Search programs by level of care or location. Explore on the map. Add programs directly to aftercare packets.",
            ready: "You are ready. Run your day from one screen."
        };

        // Paths to real audio files (user needs to provide these)
        this.files = {
            welcome: 'assets/audio/intro-01-welcome.mp3',
            dashboard: 'assets/audio/intro-02-dashboard.mp3',
            journey: 'assets/audio/intro-03-journey.mp3',
            flightPlan: 'assets/audio/intro-04-flightplan.mp3',
            programs: 'assets/audio/intro-05-programs.mp3',
            ready: 'assets/audio/intro-06-ready.mp3'
        };
    }

    /**
     * Preload audio files (if they exist)
     */
    async preload() {
        // In a real app, we'd check if files exist. 
        // For now, we assume they might not and prepare TTS.
        console.log('[Audio] Audio system initialized');
    }

    /**
     * Play audio for a specific scene ID
     */
    async play(sceneId) {
        if (this.isMuted) return;

        console.log(`[Audio] Playing track for: ${sceneId}`);

        try {
            // Try to play the MP3 file first
            this.audio.src = this.files[sceneId];
            await this.audio.play();
            return new Promise(resolve => {
                this.audio.onended = resolve;
                // Safety timeout in case audio hangs
                setTimeout(resolve, 15000); 
            });
        } catch (e) {
            console.warn(`[Audio] File not found/playable for ${sceneId}, falling back to TTS.`);
            return this.speak(this.scripts[sceneId]);
        }
    }

    /**
     * Stop current playback
     */
    stop() {
        this.audio.pause();
        this.audio.currentTime = 0;
        window.speechSynthesis.cancel();
    }

    /**
     * Browser TTS Fallback
     */
    speak(text) {
        return new Promise(resolve => {
            if (!window.speechSynthesis) {
                console.warn('[Audio] TTS not supported');
                setTimeout(resolve, 2000); // Fake delay
                return;
            }

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1.1; // Slightly faster
            utterance.pitch = 1.0;
            
            // Try to find a good English voice
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.name.includes('Google US English')) || 
                                 voices.find(v => v.name.includes('Samantha')) ||
                                 voices.find(v => v.lang === 'en-US');
            
            if (preferredVoice) utterance.voice = preferredVoice;

            utterance.onend = resolve;
            utterance.onerror = resolve; // Resolve anyway on error

            window.speechSynthesis.speak(utterance);
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) this.stop();
        return this.isMuted;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AudioController = AudioController;
}

