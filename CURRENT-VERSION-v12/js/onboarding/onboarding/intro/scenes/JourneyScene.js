/**
 * JourneyScene - Scene 3
 * 
 * Visuals: Client Journey flow with particles
 * Audio: "The Client Journey shows how many clients..."
 */

class JourneyScene extends Scene {
    render() {
        return `
            <div class="journey-visual" style="width: 100%; max-width: 800px;">
                <div class="journey-path" style="position: relative; padding: 60px 0;">
                    <!-- Flow Canvas for particles -->
                    <canvas class="journey-flow-canvas" style="position: absolute; inset: 0; width: 100%; height: 100%;"></canvas>
                    
                    <svg class="journey-line" viewBox="0 0 800 100" preserveAspectRatio="none" style="width: 100%; height: 100px; position: relative; z-index: 1;">
                        <defs>
                            <linearGradient id="journeyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#6366F1"/>
                                <stop offset="50%" style="stop-color:#8B5CF6"/>
                                <stop offset="100%" style="stop-color:#10B981"/>
                            </linearGradient>
                        </defs>
                        <path class="journey-path-draw" d="M0,50 C100,50 150,20 200,50 C250,80 300,50 400,50 C500,50 550,20 600,50 C650,80 700,50 800,50" 
                              stroke="url(#journeyGradient)" stroke-width="4" fill="none" stroke-linecap="round"/>
                    </svg>
                    
                    <div class="journey-markers" style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 0 20px;
                        z-index: 2;
                    ">
                        ${this.renderMarker('Admit', '#6366F1')}
                        ${this.renderMarker('Week 1', '#6366F1', 3)}
                        ${this.renderMarker('Day 14', '#8B5CF6', 2)}
                        ${this.renderMarker('Day 30', '#8B5CF6', 4)}
                        ${this.renderMarker('Discharge', '#10B981', 1)}
                    </div>
                </div>
            </div>
            <div class="intro-caption" style="
                margin-top: 40px;
                text-align: center;
                max-width: 600px;
            ">
                <h2 style="font-size: 28px; font-weight: 700; color: white; margin: 0 0 12px 0;">Client Journey at a Glance</h2>
                <p style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.6;">See how many clients are in each treatment stage. Click any stage to filter your tasks.</p>
            </div>
        `;
    }

    renderMarker(label, color, count = null) {
        return `
            <div class="marker" style="display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <div class="marker-dot" style="width: 16px; height: 16px; background: ${color}; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px ${color}66;"></div>
                <div class="marker-label" style="font-size: 13px; font-weight: 600; color: white;">${label}</div>
                ${count !== null ? `<div class="marker-count" style="font-size: 12px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.1); padding: 2px 8px; border-radius: 10px;">${count}</div>` : ''}
            </div>
        `;
    }

    setup() {
        const pathEl = this.container.querySelector('.journey-path-draw');
        if (pathEl && window.SVGDraw) window.SVGDraw.preparePath(pathEl);
        
        // Initialize flow particles
        // In a real implementation, we'd use canvas to draw particles flowing along the bezier curve
        // For now, we'll rely on the CSS/GSAP animation
    }

    build(tl, startTime) {
        const pathEl = this.container.querySelector('.journey-path-draw');
        const markers = this.container.querySelectorAll('.marker');
        const caption = this.container.querySelector('.intro-caption');
        
        tl.set(this.container, { opacity: 1 }, startTime)
          .set(markers, { opacity: 0, y: 20 }, startTime)
          .set(caption, { opacity: 0, y: 30 }, startTime)
          
          // Draw path
          .to(pathEl, { strokeDashoffset: 0, duration: 2, ease: 'power2.inOut' }, startTime)
          .call(() => this.director.playSfx('whoosh'), null, startTime)
          
          // Pop markers
          .to(markers, { 
              opacity: 1, 
              y: 0, 
              duration: 0.5, 
              stagger: 0.15,
              ease: 'back.out(1.5)'
          }, startTime + 1.0)
          .call(() => this.director.playSfx('pop'), null, startTime + 1.0)
          .call(() => this.director.playSfx('pop'), null, startTime + 1.2)
          .call(() => this.director.playSfx('pop'), null, startTime + 1.4)
          
          // Caption
          .to(caption, { opacity: 1, y: 0, duration: 0.6 }, startTime + 2.0)
          
          // Pulse active markers
          .to(markers[1].querySelector('.marker-dot'), { scale: 1.3, duration: 0.4, yoyo: true, repeat: 1 }, startTime + 3.0)
          .to(markers[3].querySelector('.marker-dot'), { scale: 1.3, duration: 0.4, yoyo: true, repeat: 1 }, startTime + 3.5);
          
        tl.call(() => this.director.playVoice('journey'), null, startTime + 0.5);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.JourneyScene = JourneyScene;
}

