/**
 * SVGDrawer - Utility for animating SVG stroke drawings
 * 
 * Features:
 * - Stroke-dashoffset animation with custom easing
 * - Hand-wobble filter for organic feel
 * - Pencil-tip follower that traces the path
 * - Staggered drawing for multiple paths
 */

class SVGDrawer {
    constructor(svgElement) {
        this.svg = svgElement;
        this.paths = [];
        this.pencilTip = null;
        this.initialized = false;
    }

    /**
     * Initialize the SVG for drawing animation
     */
    init() {
        if (this.initialized) return;
        
        // Find all drawable paths
        this.paths = Array.from(this.svg.querySelectorAll('.stroke-draw, path[data-draw-order], line[data-draw-order]'));
        
        // Sort by draw order if specified
        this.paths.sort((a, b) => {
            const orderA = parseInt(a.dataset.drawOrder || 999);
            const orderB = parseInt(b.dataset.drawOrder || 999);
            return orderA - orderB;
        });
        
        // Prepare each path
        this.paths.forEach(path => {
            const length = this.getPathLength(path);
            path.style.strokeDasharray = length;
            path.style.strokeDashoffset = length;
            path.dataset.pathLength = length;
        });
        
        // Add hand-wobble filter if not present
        this.addWobbleFilter();
        
        this.initialized = true;
    }

    /**
     * Get the length of any SVG element
     */
    getPathLength(element) {
        if (element.getTotalLength) {
            try {
                return element.getTotalLength();
            } catch (e) {
                // Some browsers throw on certain elements
            }
        }
        
        // Fallbacks for elements without getTotalLength
        const tagName = element.tagName.toLowerCase();
        
        if (tagName === 'circle') {
            const r = parseFloat(element.getAttribute('r') || 0);
            return 2 * Math.PI * r;
        }
        
        if (tagName === 'rect') {
            const w = parseFloat(element.getAttribute('width') || 0);
            const h = parseFloat(element.getAttribute('height') || 0);
            const rx = parseFloat(element.getAttribute('rx') || 0);
            // Approximate for rounded rects
            return 2 * (w + h) - (8 - 2 * Math.PI) * rx;
        }
        
        if (tagName === 'line') {
            const x1 = parseFloat(element.getAttribute('x1') || 0);
            const y1 = parseFloat(element.getAttribute('y1') || 0);
            const x2 = parseFloat(element.getAttribute('x2') || 0);
            const y2 = parseFloat(element.getAttribute('y2') || 0);
            return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }
        
        if (tagName === 'ellipse') {
            const rx = parseFloat(element.getAttribute('rx') || 0);
            const ry = parseFloat(element.getAttribute('ry') || 0);
            // Ramanujan's approximation
            return Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)));
        }
        
        return 100; // Default fallback
    }

    /**
     * Add SVG filter for hand-wobble effect
     */
    addWobbleFilter() {
        // Check if filter already exists
        let defs = this.svg.querySelector('defs');
        if (!defs) {
            defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this.svg.insertBefore(defs, this.svg.firstChild);
        }
        
        if (defs.querySelector('#handWobble')) return;
        
        const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
        filter.setAttribute('id', 'handWobble');
        filter.setAttribute('x', '-5%');
        filter.setAttribute('y', '-5%');
        filter.setAttribute('width', '110%');
        filter.setAttribute('height', '110%');
        
        filter.innerHTML = `
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="2" result="noise"/>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
        `;
        
        defs.appendChild(filter);
    }

    /**
     * Create a pencil tip element that follows the drawing
     */
    createPencilTip(color = '#F97316') {
        const tip = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        tip.setAttribute('class', 'pencil-tip');
        tip.innerHTML = `
            <circle r="3" fill="${color}"/>
            <path d="M-2 -8 L0 0 L2 -8 Z" fill="#FBBF24"/>
        `;
        tip.style.opacity = '0';
        this.svg.appendChild(tip);
        this.pencilTip = tip;
        return tip;
    }

    /**
     * Draw all paths with GSAP timeline
     * @param {GSAPTimeline} timeline - GSAP timeline to add animations to
     * @param {Object} options - Animation options
     */
    draw(timeline, options = {}) {
        const {
            startTime = 0,
            duration = 1.5,
            stagger = 0.1,
            ease = 'power2.inOut',
            showPencil = false,
            pencilColor = '#F97316',
            onComplete = null
        } = options;
        
        if (!this.initialized) {
            this.init();
        }
        
        if (this.paths.length === 0) return;
        
        // Create pencil tip if needed
        if (showPencil && !this.pencilTip) {
            this.createPencilTip(pencilColor);
        }
        
        // Animate each path
        this.paths.forEach((path, index) => {
            const pathStartTime = startTime + (index * stagger);
            const pathLength = parseFloat(path.dataset.pathLength || 100);
            
            // Draw the path
            timeline.to(path, {
                strokeDashoffset: 0,
                duration: duration,
                ease: ease
            }, pathStartTime);
            
            // Animate pencil tip along path if enabled
            if (showPencil && this.pencilTip && path.getTotalLength) {
                // Show pencil at start
                timeline.set(this.pencilTip, { opacity: 1 }, pathStartTime);
                
                // Animate along path
                timeline.to({}, {
                    duration: duration,
                    ease: ease,
                    onUpdate: function() {
                        const progress = this.progress();
                        const point = path.getPointAtLength(progress * pathLength);
                        this.pencilTip.setAttribute('transform', `translate(${point.x}, ${point.y})`);
                    }.bind({ progress: () => timeline.progress(), pencilTip: this.pencilTip })
                }, pathStartTime);
            }
        });
        
        // Hide pencil at end
        if (showPencil && this.pencilTip) {
            const endTime = startTime + (this.paths.length * stagger) + duration;
            timeline.to(this.pencilTip, { opacity: 0, duration: 0.3 }, endTime);
        }
        
        // Callback
        if (onComplete) {
            const endTime = startTime + (this.paths.length * stagger) + duration;
            timeline.call(onComplete, null, endTime);
        }
    }

    /**
     * Reverse the drawing (erase effect)
     */
    erase(timeline, options = {}) {
        const {
            startTime = 0,
            duration = 1,
            stagger = 0.05,
            ease = 'power2.in'
        } = options;
        
        if (!this.initialized) return;
        
        // Reverse order for erasing
        const reversedPaths = [...this.paths].reverse();
        
        reversedPaths.forEach((path, index) => {
            const pathLength = parseFloat(path.dataset.pathLength || 100);
            timeline.to(path, {
                strokeDashoffset: pathLength,
                duration: duration,
                ease: ease
            }, startTime + (index * stagger));
        });
    }

    /**
     * Reset all paths to initial state
     */
    reset() {
        this.paths.forEach(path => {
            const length = parseFloat(path.dataset.pathLength || 100);
            path.style.strokeDashoffset = length;
        });
        
        if (this.pencilTip) {
            this.pencilTip.style.opacity = '0';
        }
    }

    /**
     * Instantly show all paths (skip animation)
     */
    showAll() {
        this.paths.forEach(path => {
            path.style.strokeDashoffset = '0';
        });
    }
}

// Export
if (typeof window !== 'undefined') {
    window.SVGDrawer = SVGDrawer;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGDrawer;
}

