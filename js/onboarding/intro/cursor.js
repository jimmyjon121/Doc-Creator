/**
 * AnimatedCursor - Animated cursor for intro sequences
 * 
 * Shows users where to look during the intro animation
 */

class AnimatedCursor {
    constructor(element) {
        this.element = element;
        this.element.className = 'intro-cursor';
        this.element.innerHTML = `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M4 0L4 20L9.5 14.5L14 22L17 20L12 12L18 12L4 0Z" 
                      fill="white" 
                      stroke="#1E1B4B" 
                      stroke-width="1.5"
                      stroke-linejoin="round"/>
            </svg>
            <div class="cursor-ripple"></div>
        `;
        
        this.isVisible = false;
    }
    
    /**
     * Show the cursor
     */
    show() {
        this.isVisible = true;
        this.element.classList.add('visible');
        return this;
    }
    
    /**
     * Hide the cursor
     */
    hide() {
        this.isVisible = false;
        this.element.classList.remove('visible');
        return this;
    }
    
    /**
     * Move cursor to a specific position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} duration - Animation duration in seconds
     */
    moveTo(x, y, duration = 0.8) {
        if (typeof gsap !== 'undefined') {
            return gsap.to(this.element, {
                left: x,
                top: y,
                duration: duration,
                ease: 'power2.inOut'
            });
        } else {
            this.element.style.transition = `all ${duration}s ease-in-out`;
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
            return Promise.resolve();
        }
    }
    
    /**
     * Move cursor to an element
     * @param {string|Element} target - Selector or element
     * @param {number} duration - Animation duration
     */
    moveToElement(target, duration = 0.8) {
        const el = typeof target === 'string' ? document.querySelector(target) : target;
        if (!el) {
            console.warn('[AnimatedCursor] Target not found:', target);
            return Promise.resolve();
        }
        
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        return this.moveTo(x, y, duration);
    }
    
    /**
     * Simulate a click animation
     */
    click() {
        const ripple = this.element.querySelector('.cursor-ripple');
        ripple.classList.add('active');
        
        if (typeof gsap !== 'undefined') {
            return gsap.timeline()
                .to(this.element, { scale: 0.85, duration: 0.1 })
                .to(this.element, { scale: 1, duration: 0.15 })
                .add(() => {
                    setTimeout(() => ripple.classList.remove('active'), 400);
                });
        } else {
            this.element.style.transform = 'scale(0.85)';
            setTimeout(() => {
                this.element.style.transform = 'scale(1)';
                setTimeout(() => ripple.classList.remove('active'), 400);
            }, 100);
            return Promise.resolve();
        }
    }
    
    /**
     * Perform a click at an element
     * @param {string|Element} target - Selector or element
     */
    async clickElement(target, moveDuration = 0.8) {
        await this.moveToElement(target, moveDuration);
        await this.click();
    }
    
    /**
     * Set position immediately without animation
     */
    setPosition(x, y) {
        if (typeof gsap !== 'undefined') {
            gsap.set(this.element, { left: x, top: y });
        } else {
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
        }
        return this;
    }
    
    /**
     * Destroy the cursor
     */
    destroy() {
        this.element.remove();
    }
}

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.AnimatedCursor = AnimatedCursor;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = AnimatedCursor;
}

