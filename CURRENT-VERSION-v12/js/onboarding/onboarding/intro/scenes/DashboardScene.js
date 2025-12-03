/**
 * DashboardScene - Scene 2
 * 
 * Visuals: 3D Dashboard tilt reveal, live data populating
 * Audio: "Every day starts here..."
 */

class DashboardScene extends Scene {
    render() {
        return `
            <div class="intro-perspective-wrapper" style="
                perspective: 1500px;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <div class="intro-mockup dashboard-mockup" style="
                    width: 100%;
                    max-width: 900px;
                    background: #1E293B;
                    border-radius: 16px;
                    overflow: hidden;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    transform-style: preserve-3d;
                ">
                    <!-- Header -->
                    <div class="mockup-header" style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        padding: 16px 24px;
                        background: rgba(0, 0, 0, 0.3);
                        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    ">
                        <div class="mockup-nav" style="display: flex; gap: 24px;">
                            <div class="nav-item" style="color: white; font-size: 14px; font-weight: 500;">Dashboard</div>
                            <div class="nav-item" style="color: rgba(255,255,255,0.5); font-size: 14px;">Programs</div>
                            <div class="nav-item" style="color: rgba(255,255,255,0.5); font-size: 14px;">Clients</div>
                        </div>
                        <div class="mockup-user" style="color: rgba(255,255,255,0.7); font-size: 14px;">Coach Demo</div>
                    </div>
                    
                    <!-- Body -->
                    <div class="mockup-body" style="padding: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <!-- Journey Widget -->
                        <div class="mockup-widget widget-journey" style="
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 12px;
                            padding: 20px;
                        ">
                            <div class="widget-title" style="font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 16px;">Client Journey</div>
                            <div class="journey-stages" style="display: flex; gap: 12px;">
                                <div class="stage" style="flex: 1; padding: 12px; background: rgba(99, 102, 241, 0.3); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 12px; text-align: center;">Week 1</div>
                                <div class="stage" style="flex: 1; padding: 12px; background: rgba(99, 102, 241, 0.2); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 12px; text-align: center;">Day 14</div>
                                <div class="stage" style="flex: 1; padding: 12px; background: rgba(99, 102, 241, 0.2); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 12px; text-align: center;">Day 30</div>
                                <div class="stage" style="flex: 1; padding: 12px; background: rgba(99, 102, 241, 0.2); border-radius: 8px; color: rgba(255,255,255,0.8); font-size: 12px; text-align: center;">45+</div>
                            </div>
                        </div>
                        
                        <!-- Flight Plan Widget -->
                        <div class="mockup-widget widget-flight" style="
                            background: rgba(255, 255, 255, 0.05);
                            border-radius: 12px;
                            padding: 20px;
                        ">
                            <div class="widget-title" style="font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); margin-bottom: 16px;">Daily Flight Plan</div>
                            <div class="flight-zones" style="display: flex; flex-direction: column; gap: 8px;">
                                <div class="zone zone-red" style="padding: 10px 12px; border-radius: 6px; font-size: 13px; color: white; background: rgba(239, 68, 68, 0.4); display: flex; justify-content: space-between;">
                                    <span>🔴 Immediate</span>
                                    <span class="zone-count">0</span>
                                </div>
                                <div class="zone zone-purple" style="padding: 10px 12px; border-radius: 6px; font-size: 13px; color: white; background: rgba(139, 92, 246, 0.4); display: flex; justify-content: space-between;">
                                    <span>🟣 This Week</span>
                                    <span class="zone-count">0</span>
                                </div>
                                <div class="zone zone-yellow" style="padding: 10px 12px; border-radius: 6px; font-size: 13px; color: white; background: rgba(245, 158, 11, 0.4);">🟡 Due Soon</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="intro-caption" style="
                position: absolute;
                bottom: 120px;
                left: 50%;
                transform: translateX(-50%);
                text-align: center;
                max-width: 600px;
            ">
                <h2 style="font-size: 28px; font-weight: 700; color: white; margin: 0 0 12px 0;">Your Daily Cockpit</h2>
                <p style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.6;">Every day starts here. See your caseload, priorities, and what needs attention — all in one view.</p>
            </div>
        `;
    }

    build(tl, startTime) {
        const mockup = this.container.querySelector('.dashboard-mockup');
        const caption = this.container.querySelector('.intro-caption');
        const widgets = this.container.querySelectorAll('.mockup-widget');
        const redCount = this.container.querySelector('.zone-red .zone-count');
        const purpleCount = this.container.querySelector('.zone-purple .zone-count');

        // Initial 3D state
        tl.set(this.container, { opacity: 1 }, startTime)
          .set(mockup, { 
              rotationX: 45, 
              rotationY: -15, 
              scale: 0.8, 
              opacity: 0, 
              z: -200 
          }, startTime)
          .set(caption, { opacity: 0, y: 30 }, startTime)
          .set(widgets, { opacity: 0, y: 20 }, startTime);

        // Reveal animation
        tl.to(mockup, { 
            rotationX: 0, 
            rotationY: 0, 
            scale: 1, 
            opacity: 1, 
            z: 0, 
            duration: 1.5, 
            ease: 'power3.out' 
        }, startTime)
        .call(() => this.director.playSfx('whoosh'), null, startTime + 0.2)
        
        // Widgets stagger in
        .to(widgets, { opacity: 1, y: 0, duration: 0.5, stagger: 0.2, ease: 'power2.out' }, startTime + 1.0)
        .call(() => this.director.playSfx('pop'), null, startTime + 1.0)
        .call(() => this.director.playSfx('pop'), null, startTime + 1.2)
        
        // Live data spin up
        .to(redCount, { 
            innerText: 3, 
            snap: { innerText: 1 }, 
            duration: 1.0, 
            ease: 'power1.out' 
        }, startTime + 1.5)
        .to(purpleCount, { 
            innerText: 5, 
            snap: { innerText: 1 }, 
            duration: 1.0, 
            ease: 'power1.out' 
        }, startTime + 1.5)
        
        // Caption
        .to(caption, { opacity: 1, y: 0, duration: 0.6 }, startTime + 2.0);
        
        // Voiceover
        tl.call(() => this.director.playVoice('dashboard'), null, startTime + 0.5);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.DashboardScene = DashboardScene;
}

