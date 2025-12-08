/**
 * Scene - Enhanced base class for cinematic scenes (v4)
 * 
 * Features:
 * - SVG stroke animation with hand-wobble effect
 * - Pencil-tip follower for drawing animations
 * - Audio sync hooks for voiceover
 * - Foley sound triggers
 * - Crossfade transitions
 * 
 * Lifecycle:
 * - mount(): Create DOM elements
 * - setup(): Post-mount initialization (SVG prep, particles)
 * - build(timeline, startTime, duration): Add GSAP animations
 * - unmount(): Cleanup
 */

class Scene {
    constructor(director, config = {}) {
        this.director = director;
        this.config = config;
        this.container = null;
        this.timeline = null;
        this.svgDrawer = null;
        
        // Default colors (Clinical Zen palette)
        this.colors = {
            cream: '#FDF6E3',
            teal: '#0D9488',
            tealLight: '#14B8A6',
            coral: '#F97316',
            lavender: '#A78BFA',
            sage: '#10B981',
            text: '#1F2937',
            muted: '#6B7280',
            red: '#EF4444',
            purple: '#8B5CF6',
            yellow: '#F59E0B',
            green: '#10B981'
        };
    }

    /**
     * Create DOM elements for the scene
     */
    mount(parentContainer) {
        this.container = document.createElement('div');
        this.container.className = `intro-scene intro-scene--${this.config.id}`;
        this.container.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        
        // Add content
        this.container.innerHTML = this.render();
        parentContainer.appendChild(this.container);
        
        // Post-mount setup
        this.setup();
        
        return this.container;
    }

    /**
     * Render HTML content (override this)
     */
    render() {
        return '';
    }

    /**
     * Post-render setup (override this)
     */
    setup() {
        // Prepare SVG paths for stroke animation
        this.prepareSVGPaths();
    }

    /**
     * Prepare all SVG paths in this scene for stroke animation
     */
    prepareSVGPaths() {
        if (!this.container) return;
        
        const paths = this.container.querySelectorAll('path, line, circle, rect, polyline, polygon');
        paths.forEach(path => {
            if (path.classList.contains('stroke-draw')) {
                const length = this.getPathLength(path);
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
            }
        });
    }

    /**
     * Get the total length of an SVG element
     */
    getPathLength(element) {
        if (element.getTotalLength) {
            return element.getTotalLength();
        }
        // Fallback for elements without getTotalLength
        if (element.tagName === 'circle') {
            const r = parseFloat(element.getAttribute('r') || 0);
            return 2 * Math.PI * r;
        }
        if (element.tagName === 'rect') {
            const w = parseFloat(element.getAttribute('width') || 0);
            const h = parseFloat(element.getAttribute('height') || 0);
            return 2 * (w + h);
        }
        return 100; // Default fallback
    }

    /**
     * Animate SVG paths drawing themselves
     * @param {GSAPTimeline} tl - Timeline to add animations to
     * @param {string} selector - CSS selector for paths
     * @param {number} startTime - When to start
     * @param {number} duration - How long each path takes
     * @param {number} stagger - Delay between paths
     */
    drawPaths(tl, selector, startTime, duration = 1.5, stagger = 0.1) {
        const paths = this.container.querySelectorAll(selector);
        if (paths.length === 0) return;
        
        tl.to(paths, {
            strokeDashoffset: 0,
            duration: duration,
            stagger: stagger,
            ease: 'power2.inOut'
        }, startTime);
    }

    /**
     * Build animation timeline (override this)
     * @param {GSAPTimeline} tl - The master timeline
     * @param {number} startTime - When this scene starts
     * @param {number} duration - How long it lasts
     */
    build(tl, startTime, duration) {
        // Fade in
        tl.to(this.container, { 
            opacity: 1, 
            duration: 0.8,
            ease: 'power2.out'
        }, startTime);
        
        // Trigger voiceover
        if (this.config.id && this.director && this.director.audio) {
            tl.call(() => {
                this.director.audio.playVoice(this.config.id);
            }, null, startTime + 0.2);
        }
        
        // Fade out at end
        tl.to(this.container, { 
            opacity: 0, 
            duration: 0.6,
            ease: 'power2.in'
        }, startTime + duration - 0.6);
    }

    /**
     * Play a foley sound effect
     */
    playFoley(soundId) {
        if (this.director && this.director.audio) {
            this.director.audio.playSFX(soundId);
        }
    }

    /**
     * Create floating particles effect
     */
    createParticles(count = 20, color = 'rgba(13, 148, 136, 0.3)') {
        const particleContainer = document.createElement('div');
        particleContainer.className = 'scene-particles';
        particleContainer.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            overflow: hidden;
        `;
        
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            const size = Math.random() * 6 + 2;
            particle.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                border-radius: 50%;
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                opacity: ${Math.random() * 0.5 + 0.2};
            `;
            particleContainer.appendChild(particle);
        }
        
        this.container.appendChild(particleContainer);
        return particleContainer;
    }

    /**
     * Animate particles floating
     */
    animateParticles(tl, particles, startTime, duration) {
        const particleEls = particles.querySelectorAll('div');
        particleEls.forEach((p, i) => {
            const delay = Math.random() * 2;
            const yMove = Math.random() * 50 - 25;
            const xMove = Math.random() * 30 - 15;
            
            tl.to(p, {
                y: yMove,
                x: xMove,
                opacity: Math.random() * 0.3 + 0.1,
                duration: duration,
                ease: 'sine.inOut',
                repeat: -1,
                yoyo: true
            }, startTime + delay);
        });
    }

    /**
     * Create paper texture overlay
     */
    addPaperTexture() {
        const texture = document.createElement('div');
        texture.className = 'paper-texture';
        texture.style.cssText = `
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
            opacity: 0.04;
            mix-blend-mode: multiply;
        `;
        this.container.appendChild(texture);
    }

    /**
     * Cleanup
     */
    unmount() {
        if (this.container) {
            this.container.remove();
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.Scene = Scene;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Scene;
}

