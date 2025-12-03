/**
 * Particle Systems for Onboarding Intro
 * 
 * Contains:
 * - ParticleSystem: Ambient floating particles for backgrounds
 * - ConfettiSystem: Celebration burst effect
 */

/**
 * ParticleSystem - Ambient floating particles
 */
class ParticleSystem {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isRunning = false;
        
        this.options = {
            count: options.count || 50,
            color: options.color || 'rgba(13, 148, 136, 0.5)',
            speed: options.speed || 1,
            size: options.size || { min: 2, max: 6 },
            connectDistance: options.connectDistance || 100,
            showConnections: options.showConnections !== false
        };
        
        this.init();
    }
    
    init() {
        this.resize();
        this.boundResize = () => this.resize();
        window.addEventListener('resize', this.boundResize);
        
        // Create initial particles
        for (let i = 0; i < this.options.count; i++) {
            this.particles.push(this.createParticle());
        }
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    createParticle() {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: Math.random() * rect.width,
            y: Math.random() * rect.height,
            size: this.options.size.min + Math.random() * (this.options.size.max - this.options.size.min),
            speedX: (Math.random() - 0.5) * this.options.speed,
            speedY: (Math.random() - 0.5) * this.options.speed,
            opacity: 0.3 + Math.random() * 0.5
        };
    }
    
    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    animate() {
        if (!this.isRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        // Update and draw particles
        for (const p of this.particles) {
            // Update position
            p.x += p.speedX;
            p.y += p.speedY;
            
            // Wrap around edges
            if (p.x < 0) p.x = rect.width;
            if (p.x > rect.width) p.x = 0;
            if (p.y < 0) p.y = rect.height;
            if (p.y > rect.height) p.y = 0;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fillStyle = this.options.color.replace(/[\d.]+\)$/, `${p.opacity})`);
            this.ctx.fill();
        }
        
        // Draw connections
        if (this.options.showConnections) {
            this.drawConnections();
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    drawConnections() {
        const distance = this.options.connectDistance;
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const dx = p1.x - p2.x;
                const dy = p1.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist < distance) {
                    const opacity = (1 - dist / distance) * 0.2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.strokeStyle = this.options.color.replace(/[\d.]+\)$/, `${opacity})`);
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            }
        }
    }
    
    destroy() {
        this.stop();
        window.removeEventListener('resize', this.boundResize);
        this.particles = [];
    }
}

/**
 * ConfettiSystem - Celebration burst effect
 */
class ConfettiSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        // Clinical celebration colors - teal, cyan, green, amber
        this.colors = ['#0D9488', '#0891B2', '#14B8A6', '#FBBF24', '#10B981', '#06B6D4'];
        
        this.resize();
        this.boundResize = () => this.resize();
        window.addEventListener('resize', this.boundResize);
    }
    
    resize() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * window.devicePixelRatio;
        this.canvas.height = rect.height * window.devicePixelRatio;
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    burst(options = {}) {
        const rect = this.canvas.getBoundingClientRect();
        const centerX = options.x ?? rect.width / 2;
        const centerY = options.y ?? rect.height / 3;
        const count = options.count || 100;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
            const velocity = 8 + Math.random() * 12;
            
            this.particles.push({
                x: centerX,
                y: centerY,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity - 8,
                color: this.colors[Math.floor(Math.random() * this.colors.length)],
                size: 6 + Math.random() * 6,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 15,
                gravity: 0.4,
                friction: 0.98,
                opacity: 1,
                shape: Math.random() > 0.5 ? 'rect' : 'circle'
            });
        }
        
        if (!this.animationId) {
            this.animate();
        }
    }
    
    animate() {
        const rect = this.canvas.getBoundingClientRect();
        this.ctx.clearRect(0, 0, rect.width, rect.height);
        
        let hasActiveParticles = false;
        
        for (const p of this.particles) {
            if (p.opacity <= 0) continue;
            hasActiveParticles = true;
            
            // Physics
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            p.x += p.vx;
            p.y += p.vy;
            p.rotation += p.rotationSpeed;
            p.opacity -= 0.008;
            
            // Draw
            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rotation * Math.PI / 180);
            this.ctx.globalAlpha = Math.max(0, p.opacity);
            this.ctx.fillStyle = p.color;
            
            if (p.shape === 'rect') {
                this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            } else {
                this.ctx.beginPath();
                this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        }
        
        if (hasActiveParticles) {
            this.animationId = requestAnimationFrame(() => this.animate());
        } else {
            this.animationId = null;
            // Clean up dead particles
            this.particles = this.particles.filter(p => p.opacity > 0);
        }
    }
    
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        window.removeEventListener('resize', this.boundResize);
        this.particles = [];
    }
}

// Export for both browser and module environments
if (typeof window !== 'undefined') {
    window.ParticleSystem = ParticleSystem;
    window.ConfettiSystem = ConfettiSystem;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleSystem, ConfettiSystem };
}

