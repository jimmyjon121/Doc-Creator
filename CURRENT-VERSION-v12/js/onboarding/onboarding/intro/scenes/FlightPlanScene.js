/**
 * FlightPlanScene - Scene 4
 * 
 * Visuals: Radar scan effect, tasks sorting by urgency
 * Audio: "Your Daily Flight Plan..."
 */

class FlightPlanScene extends Scene {
    render() {
        return `
            <div class="flightplan-visual" style="width: 100%; max-width: 500px; position: relative;">
                <!-- Radar Scan Line -->
                <div class="radar-scan" style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background: linear-gradient(90deg, transparent, #EF4444, transparent);
                    box-shadow: 0 0 10px #EF4444;
                    z-index: 10;
                    opacity: 0;
                "></div>
                
                <div class="flightplan-zones" style="display: flex; flex-direction: column; gap: 16px;">
                    <div class="fp-zone zone-red" style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; overflow: hidden;">
                        <div class="zone-header" style="display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: rgba(239, 68, 68, 0.2);">
                            <span class="zone-indicator" style="width: 12px; height: 12px; border-radius: 50%; background: #EF4444;"></span>
                            <span class="zone-title" style="flex: 1; font-size: 14px; font-weight: 600; color: white;">Immediate / Overdue</span>
                            <span class="zone-count" style="font-size: 13px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.1); padding: 2px 10px; border-radius: 10px;">3</span>
                        </div>
                        <div class="zone-tasks" style="padding: 12px 20px;">
                            <div class="task-item" style="display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <span class="task-type" style="font-size: 12px; font-weight: 500; color: #818CF8; background: rgba(99, 102, 241, 0.2); padding: 4px 8px; border-radius: 4px;">RR</span>
                                <span class="task-client" style="flex: 1; font-size: 14px; color: white;">Mason T.</span>
                                <span class="task-status" style="font-size: 12px; color: #EF4444;">Overdue</span>
                            </div>
                            <div class="task-item" style="display: flex; align-items: center; gap: 12px; padding: 10px 0;">
                                <span class="task-type" style="font-size: 12px; font-weight: 500; color: #818CF8; background: rgba(99, 102, 241, 0.2); padding: 4px 8px; border-radius: 4px;">Parent Call</span>
                                <span class="task-client" style="flex: 1; font-size: 14px; color: white;">Sophia R.</span>
                                <span class="task-status" style="font-size: 12px; color: #EF4444;">2 days</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="fp-zone zone-purple" style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; overflow: hidden;">
                        <div class="zone-header" style="display: flex; align-items: center; gap: 12px; padding: 16px 20px; background: rgba(139, 92, 246, 0.2);">
                            <span class="zone-indicator" style="width: 12px; height: 12px; border-radius: 50%; background: #8B5CF6;"></span>
                            <span class="zone-title" style="flex: 1; font-size: 14px; font-weight: 600; color: white;">This Week</span>
                            <span class="zone-count" style="font-size: 13px; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.1); padding: 2px 10px; border-radius: 10px;">5</span>
                        </div>
                        <div class="zone-tasks" style="padding: 12px 20px;">
                            <div class="task-item" style="display: flex; align-items: center; gap: 12px; padding: 10px 0;">
                                <span class="task-type" style="font-size: 12px; font-weight: 500; color: #818CF8; background: rgba(99, 102, 241, 0.2); padding: 4px 8px; border-radius: 4px;">Aftercare</span>
                                <span class="task-client" style="flex: 1; font-size: 14px; color: white;">Ethan K.</span>
                                <span class="task-status" style="font-size: 12px; color: rgba(255,255,255,0.5);">Wed</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Other zones... -->
                </div>
            </div>
            <div class="intro-caption" style="
                margin-top: 40px;
                text-align: center;
                max-width: 600px;
            ">
                <h2 style="font-size: 28px; font-weight: 700; color: white; margin: 0 0 12px 0;">Your Daily Flight Plan</h2>
                <p style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.6;">Tasks grouped by urgency. Red means now. Clear the red zone first.</p>
            </div>
        `;
    }

    build(tl, startTime) {
        const zones = this.container.querySelectorAll('.fp-zone');
        const tasks = this.container.querySelectorAll('.task-item');
        const caption = this.container.querySelector('.intro-caption');
        const radar = this.container.querySelector('.radar-scan');
        
        tl.set(this.container, { opacity: 1 }, startTime)
          .set(zones, { opacity: 0, x: -30 }, startTime)
          .set(tasks, { opacity: 0, x: -20 }, startTime)
          .set(caption, { opacity: 0, y: 30 }, startTime)
          .set(radar, { top: 0, opacity: 0 }, startTime);
          
        // Zones slide in
        tl.to(zones, { 
            opacity: 1, 
            x: 0, 
            duration: 0.5, 
            stagger: 0.2,
            ease: 'power2.out'
        }, startTime)
        .call(() => this.director.playSfx('whoosh'), null, startTime)
        
        // Tasks slide in
        .to(tasks, { 
            opacity: 1, 
            x: 0, 
            duration: 0.4, 
            stagger: 0.1,
            ease: 'power2.out'
        }, startTime + 0.5)
        .call(() => this.director.playSfx('pop'), null, startTime + 0.5)
        
        // Radar scan effect
        .to(radar, { opacity: 0.8, duration: 0.2 }, startTime + 1.5)
        .to(radar, { 
            top: '100%', 
            duration: 1.5, 
            ease: 'linear' 
        }, startTime + 1.5)
        .to(radar, { opacity: 0, duration: 0.2 }, startTime + 2.8)
        .call(() => this.director.playSfx('whoosh'), null, startTime + 1.5)
        
        // Highlight Red Zone
        .to(zones[0], { 
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.3)', 
            scale: 1.02,
            duration: 0.5,
            yoyo: true,
            repeat: 1
        }, startTime + 3.0)
        
        // Caption
        .to(caption, { opacity: 1, y: 0, duration: 0.6 }, startTime + 2.0);
        
        tl.call(() => this.director.playVoice('flightplan'), null, startTime + 0.5);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.FlightPlanScene = FlightPlanScene;
}

