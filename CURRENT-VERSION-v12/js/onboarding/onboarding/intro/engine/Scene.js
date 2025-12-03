/**
 * Scene - Base class for cinematic scenes
 * 
 * Standardizes lifecycle:
 * - mount(): Create DOM elements
 * - animate(timeline): Add GSAP tweens to the master timeline
 * - unmount(): Cleanup
 */

class Scene {
    constructor(director, config = {}) {
        this.director = director;
        this.config = config;
        this.container = null;
        this.timeline = null;
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
        `;
        
        // Add content
        this.container.innerHTML = this.render();
        parentContainer.appendChild(this.container);
        
        // Post-mount setup (particles, SVG prep)
        this.setup();
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
        // Setup particles, SVGs, etc.
    }

    /**
     * Build animation timeline (override this)
     * @param {GSAPTimeline} tl - The master timeline
     * @param {number} startTime - When this scene starts
     * @param {number} duration - How long it lasts
     */
    build(tl, startTime, duration) {
        // Override this to add animations
        // Example:
        // tl.to(this.container, { opacity: 1 }, startTime)
        //   .call(() => this.director.playVoice(this.config.id), null, startTime);
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

