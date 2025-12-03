/**
 * WelcomeScene - Scene 1
 * 
 * Visuals: 3D Logo assembly, floating particles
 * Audio: "Welcome to CareConnect Pro..."
 */

class WelcomeScene extends Scene {
    render() {
        return `
            <canvas class="intro-particles" style="position: absolute; inset: 0; pointer-events: none;"></canvas>
            <div class="intro-logo-container" style="
                margin-bottom: 40px; 
                position: relative; 
                z-index: 1;
                transform-style: preserve-3d;
                perspective: 1000px;
            ">
                <svg class="intro-logo" viewBox="0 0 240 60" fill="none" style="width: 280px; height: 70px;">
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:#6366F1"/>
                            <stop offset="100%" style="stop-color:#8B5CF6"/>
                        </linearGradient>
                    </defs>
                    <path class="logo-icon" d="M25 15 C15 5, 0 15, 10 30 L25 45 L40 30 C50 15, 35 5, 25 15" 
                          stroke="url(#logoGradient)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
                    <path class="logo-connect" d="M45 30 L55 30" stroke="url(#logoGradient)" stroke-width="2" stroke-linecap="round"/>
                    <text class="logo-text" x="60" y="38" font-family="system-ui, -apple-system, sans-serif" 
                          font-size="28" font-weight="600" fill="url(#logoGradient)">CareConnect</text>
                    <text class="logo-pro" x="215" y="38" font-family="system-ui, -apple-system, sans-serif" 
                          font-size="14" font-weight="500" fill="#8B5CF6">PRO</text>
                </svg>
            </div>
            <h1 class="intro-title" style="
                font-size: 48px;
                font-weight: 700;
                color: white;
                margin: 0 0 16px 0;
                letter-spacing: -0.02em;
                position: relative;
                z-index: 1;
            ">Welcome to CareConnect Pro</h1>
            <p class="intro-subtitle" style="
                font-size: 20px;
                color: rgba(255, 255, 255, 0.7);
                margin: 0;
                position: relative;
                z-index: 1;
            ">Your command center for case management</p>
        `;
    }

    setup() {
        // Particles
        const canvas = this.container.querySelector('.intro-particles');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        if (window.ParticleSystem) {
            this.particles = new ParticleSystem(canvas, {
                count: 40,
                color: 'rgba(99, 102, 241, 0.4)',
                speed: 0.5,
                connectDistance: 120
            });
            this.particles.start();
        }
        
        // SVG Prep
        const logoIcon = this.container.querySelector('.logo-icon');
        const logoConnect = this.container.querySelector('.logo-connect');
        
        if (logoIcon && window.SVGDraw) window.SVGDraw.preparePath(logoIcon);
        if (logoConnect && window.SVGDraw) window.SVGDraw.preparePath(logoConnect);
    }

    build(tl, startTime) {
        const logoIcon = this.container.querySelector('.logo-icon');
        const logoConnect = this.container.querySelector('.logo-connect');
        const logoText = this.container.querySelector('.logo-text');
        const logoPro = this.container.querySelector('.logo-pro');
        const title = this.container.querySelector('.intro-title');
        const subtitle = this.container.querySelector('.intro-subtitle');
        const logoContainer = this.container.querySelector('.intro-logo-container');

        // Initial state
        tl.set(this.container, { opacity: 1 }, startTime) // Make visible immediately
          .set(title, { opacity: 0, y: 30 }, startTime)
          .set(subtitle, { opacity: 0, y: 20 }, startTime)
          .set(logoText, { opacity: 0 }, startTime)
          .set(logoPro, { opacity: 0, scale: 0.8 }, startTime)
          .set(logoContainer, { rotationX: 45, opacity: 0, z: -100 }, startTime);

        // Animation
        tl.to(logoContainer, { 
            rotationX: 0, 
            opacity: 1, 
            z: 0, 
            duration: 1.2, 
            ease: 'power2.out' 
        }, startTime)
        .call(() => this.director.playSfx('whoosh'), null, startTime + 0.2)
        .to(logoIcon, { strokeDashoffset: 0, duration: 1.5, ease: 'power2.inOut' }, startTime + 0.5)
        .to(logoConnect, { strokeDashoffset: 0, duration: 0.4, ease: 'power2.out' }, startTime + 1.8)
        .to(logoText, { opacity: 1, duration: 0.6 }, startTime + 2.0)
        .to(logoPro, { opacity: 1, scale: 1, duration: 0.4, ease: 'back.out(2)' }, startTime + 2.2)
        .call(() => this.director.playSfx('pop'), null, startTime + 2.2)
        .to(title, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }, startTime + 2.5)
        .to(subtitle, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }, startTime + 3.0);
        
        // Start voiceover
        tl.call(() => this.director.playVoice('welcome'), null, startTime + 0.5);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.WelcomeScene = WelcomeScene;
}

