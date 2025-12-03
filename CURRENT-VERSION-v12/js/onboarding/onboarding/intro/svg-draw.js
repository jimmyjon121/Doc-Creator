/**
 * SVG Draw Utilities
 * 
 * Utilities for SVG stroke animations (draw-on effects)
 */

const SVGDraw = (function() {
    'use strict';
    
    /**
     * Prepare an SVG path for draw animation
     * Sets up stroke-dasharray and stroke-dashoffset
     * @param {SVGPathElement} path - The path element
     */
    function preparePath(path) {
        const length = path.getTotalLength();
        path.style.strokeDasharray = length;
        path.style.strokeDashoffset = length;
        return length;
    }
    
    /**
     * Animate drawing a path with GSAP
     * @param {SVGPathElement} path - The path element
     * @param {Object} options - Animation options
     */
    function drawPath(path, options = {}) {
        const {
            duration = 2,
            ease = 'power2.inOut',
            delay = 0,
            onComplete = null
        } = options;
        
        const length = preparePath(path);
        
        if (typeof gsap !== 'undefined') {
            return gsap.to(path, {
                strokeDashoffset: 0,
                duration,
                ease,
                delay,
                onComplete
            });
        } else {
            // CSS fallback
            path.style.transition = `stroke-dashoffset ${duration}s ${ease} ${delay}s`;
            requestAnimationFrame(() => {
                path.style.strokeDashoffset = '0';
            });
            if (onComplete) {
                setTimeout(onComplete, (duration + delay) * 1000);
            }
            return Promise.resolve();
        }
    }
    
    /**
     * Animate erasing a path (reverse draw)
     * @param {SVGPathElement} path - The path element
     * @param {Object} options - Animation options
     */
    function erasePath(path, options = {}) {
        const {
            duration = 1,
            ease = 'power2.in',
            delay = 0,
            onComplete = null
        } = options;
        
        const length = path.getTotalLength();
        
        if (typeof gsap !== 'undefined') {
            return gsap.to(path, {
                strokeDashoffset: length,
                duration,
                ease,
                delay,
                onComplete
            });
        } else {
            path.style.transition = `stroke-dashoffset ${duration}s ${ease} ${delay}s`;
            requestAnimationFrame(() => {
                path.style.strokeDashoffset = `${length}`;
            });
            if (onComplete) {
                setTimeout(onComplete, (duration + delay) * 1000);
            }
            return Promise.resolve();
        }
    }
    
    /**
     * Prepare all paths in an SVG for animation
     * @param {SVGElement} svg - The SVG element
     */
    function prepareAllPaths(svg) {
        const paths = svg.querySelectorAll('path, line, polyline, polygon, circle, ellipse, rect');
        const lengths = [];
        
        paths.forEach(path => {
            if (path.getTotalLength) {
                lengths.push(preparePath(path));
            }
        });
        
        return { paths, lengths };
    }
    
    /**
     * Animate drawing all paths in an SVG sequentially
     * @param {SVGElement} svg - The SVG element
     * @param {Object} options - Animation options
     */
    function drawAllPaths(svg, options = {}) {
        const {
            duration = 2,
            stagger = 0.2,
            ease = 'power2.inOut',
            onComplete = null
        } = options;
        
        const { paths } = prepareAllPaths(svg);
        
        if (typeof gsap !== 'undefined') {
            return gsap.to(paths, {
                strokeDashoffset: 0,
                duration,
                stagger,
                ease,
                onComplete
            });
        } else {
            // CSS fallback with manual stagger
            paths.forEach((path, index) => {
                const delay = index * stagger;
                path.style.transition = `stroke-dashoffset ${duration}s ${ease} ${delay}s`;
                requestAnimationFrame(() => {
                    path.style.strokeDashoffset = '0';
                });
            });
            
            if (onComplete) {
                const totalDuration = duration + (paths.length - 1) * stagger;
                setTimeout(onComplete, totalDuration * 1000);
            }
            
            return Promise.resolve();
        }
    }
    
    /**
     * Create a checkmark SVG with draw animation
     * @param {Object} options - Options for the checkmark
     */
    function createAnimatedCheckmark(options = {}) {
        const {
            size = 100,
            strokeWidth = 4,
            color = '#10B981',
            circleColor = '#10B981',
            duration = 1.5
        } = options;
        
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', size);
        svg.setAttribute('height', size);
        svg.setAttribute('viewBox', '0 0 100 100');
        svg.classList.add('animated-checkmark');
        
        svg.innerHTML = `
            <circle class="checkmark-circle" 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="${circleColor}" 
                    stroke-width="${strokeWidth}"
                    opacity="0.2"/>
            <circle class="checkmark-circle-draw" 
                    cx="50" cy="50" r="45" 
                    fill="none" 
                    stroke="${circleColor}" 
                    stroke-width="${strokeWidth}"/>
            <path class="checkmark-path" 
                  d="M30 50 L45 65 L70 35" 
                  fill="none" 
                  stroke="${color}" 
                  stroke-width="${strokeWidth}" 
                  stroke-linecap="round" 
                  stroke-linejoin="round"/>
        `;
        
        return svg;
    }
    
    /**
     * Animate a checkmark SVG
     * @param {SVGElement} svg - The checkmark SVG
     * @param {Object} options - Animation options
     */
    function animateCheckmark(svg, options = {}) {
        const {
            duration = 1.5,
            onComplete = null
        } = options;
        
        const circle = svg.querySelector('.checkmark-circle-draw');
        const check = svg.querySelector('.checkmark-path');
        
        preparePath(circle);
        preparePath(check);
        
        if (typeof gsap !== 'undefined') {
            return gsap.timeline({ onComplete })
                .to(circle, { strokeDashoffset: 0, duration: duration * 0.6, ease: 'power2.inOut' })
                .to(check, { strokeDashoffset: 0, duration: duration * 0.4, ease: 'power2.out' }, '-=0.2');
        } else {
            circle.style.transition = `stroke-dashoffset ${duration * 0.6}s ease-in-out`;
            check.style.transition = `stroke-dashoffset ${duration * 0.4}s ease-out ${duration * 0.4}s`;
            
            requestAnimationFrame(() => {
                circle.style.strokeDashoffset = '0';
                check.style.strokeDashoffset = '0';
            });
            
            if (onComplete) {
                setTimeout(onComplete, duration * 1000);
            }
            
            return Promise.resolve();
        }
    }
    
    // Public API
    return {
        preparePath,
        drawPath,
        erasePath,
        prepareAllPaths,
        drawAllPaths,
        createAnimatedCheckmark,
        animateCheckmark
    };
})();

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.SVGDraw = SVGDraw;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SVGDraw;
}

