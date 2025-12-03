/**
 * ReadyScene - Scene 6
 * 
 * Visuals: Confetti celebration, CTA
 * Audio: "You're ready. Run your day from one screen."
 */

class ReadyScene extends Scene {
    render() {
        return `
            <canvas class="intro-confetti" style="position: absolute; inset: 0; pointer-events: none;"></canvas>
            <div class="ready-content" style="position: relative; z-index: 1; text-align: center;">
                <div class="ready-checkmark" style="margin-bottom: 32px; display: inline-block;">
                    <svg class="checkmark-svg" viewBox="0 0 100 100" style="width: 120px; height: 120px;">
                        <circle class="checkmark-circle" cx="50" cy="50" r="45" 
                                fill="none" stroke="#10B981" stroke-width="3" opacity="0.2"/>
                        <circle class="checkmark-circle-draw" cx="50" cy="50" r="45" 
                                fill="none" stroke="#10B981" stroke-width="3"/>
                        <path class="checkmark-path" d="M30 50 L45 65 L70 35" 
                              fill="none" stroke="#10B981" stroke-width="4" 
                              stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                </div>
                <h1 class="ready-title" style="
                    font-size: 56px;
                    font-weight: 700;
                    color: white;
                    margin: 0 0 12px 0;
                    letter-spacing: -0.02em;
                ">You're Ready</h1>
                <p class="ready-subtitle" style="
                    font-size: 20px;
                    color: rgba(255, 255, 255, 0.7);
                    margin: 0 0 40px 0;
                ">Run your day from one screen</p>
                <button class="ready-cta" style="
                    padding: 16px 48px;
                    background: linear-gradient(135deg, #6366F1, #8B5CF6);
                    color: white;
                    border: none;
                    border-radius: 12px;
                    font-size: 18px;
                    font-weight: 600;
                    cursor: pointer;
                    box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                ">Start with your Dashboard</button>
            </div>
        `;
    }

    setup() {
        // Confetti
        const canvas = this.container.querySelector('.intro-confetti');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        
        if (window.ConfettiSystem) {
            this.confetti = new ConfettiSystem(canvas);
        }
        
        // SVG
        const circleDraw = this.container.querySelector('.checkmark-circle-draw');
        const checkPath = this.container.querySelector('.checkmark-path');
        
        if (circleDraw && window.SVGDraw) window.SVGDraw.preparePath(circleDraw);
        if (checkPath && window.SVGDraw) window.SVGDraw.preparePath(checkPath);
        
        // CTA
        const ctaBtn = this.container.querySelector('.ready-cta');
        ctaBtn.addEventListener('click', () => {
            this.director.stop();
            this.director.container.remove();
            
            // Trigger completion event
            if (window.OnboardingEvents) {
                window.OnboardingEvents.emit(window.OnboardingEvents.EVENTS.INTRO_COMPLETED);
            }
        });
        
        ctaBtn.addEventListener('mouseenter', () => {
            ctaBtn.style.transform = 'translateY(-2px)';
            ctaBtn.style.boxShadow = '0 8px 30px rgba(99, 102, 241, 0.5)';
        });
        ctaBtn.addEventListener('mouseleave', () => {
            ctaBtn.style.transform = 'translateY(0)';
            ctaBtn.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.4)';
        });
    }

    build(tl, startTime) {
        const title = this.container.querySelector('.ready-title');
        const subtitle = this.container.querySelector('.ready-subtitle');
        const ctaBtn = this.container.querySelector('.ready-cta');
        const circleDraw = this.container.querySelector('.checkmark-circle-draw');
        const checkPath = this.container.querySelector('.checkmark-path');
        
        tl.set(this.container, { opacity: 1 }, startTime)
          .set(title, { opacity: 0, scale: 0.8 }, startTime)
          .set(subtitle, { opacity: 0, y: 20 }, startTime)
          .set(ctaBtn, { opacity: 0, y: 20 }, startTime);
          
        // Confetti burst
        tl.add(() => {
            if (this.confetti) {
                this.confetti.burst();
                this.director.playSfx('pop');
            }
        }, startTime + 0.5);
        
        // Checkmark draw
        tl.to(circleDraw, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut' }, startTime + 0.3)
          .to(checkPath, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' }, startTime + 0.8)
          
        // Text reveal
          .to(title, { 
              opacity: 1, 
              scale: 1, 
              duration: 0.6, 
              ease: 'back.out(1.5)' 
          }, startTime + 1.0)
          .to(subtitle, { opacity: 1, y: 0, duration: 0.5 }, startTime + 1.3)
          .to(ctaBtn, { opacity: 1, y: 0, duration: 0.5 }, startTime + 1.5);
          
        tl.call(() => this.director.playVoice('ready'), null, startTime + 0.5);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.ReadyScene = ReadyScene;
}

