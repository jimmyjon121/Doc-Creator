/**
 * ProgramsScene - Scene 5
 * 
 * Visuals: Map pan, pins dropping with physics
 * Audio: "Search programs by level of care..."
 */

class ProgramsScene extends Scene {
    render() {
        return `
            <div class="programs-visual" style="width: 100%; max-width: 900px;">
                <div class="programs-layout" style="
                    display: grid;
                    grid-template-columns: 180px 1fr 220px;
                    gap: 20px;
                    background: #1E293B;
                    border-radius: 16px;
                    padding: 20px;
                ">
                    <div class="programs-filters" style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 16px;">
                        <div class="filter-title" style="font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 16px;">Filters</div>
                        <div class="filter-group" style="margin-bottom: 16px;">
                            <div class="filter-item" style="padding: 8px 12px; font-size: 13px; color: white; background: rgba(99, 102, 241, 0.2); border-radius: 6px; margin-bottom: 4px;">✓ RTC</div>
                            <div class="filter-item" style="padding: 8px 12px; font-size: 13px; color: rgba(255,255,255,0.6); border-radius: 6px; margin-bottom: 4px;">PHP</div>
                            <div class="filter-item" style="padding: 8px 12px; font-size: 13px; color: white; background: rgba(99, 102, 241, 0.2); border-radius: 6px; margin-bottom: 4px;">✓ IOP</div>
                        </div>
                        <div class="filter-group">
                            <div class="filter-item" style="padding: 8px 12px; font-size: 13px; color: rgba(255,255,255,0.6); border-radius: 6px; margin-bottom: 4px;">California</div>
                            <div class="filter-item" style="padding: 8px 12px; font-size: 13px; color: white; background: rgba(99, 102, 241, 0.2); border-radius: 6px; margin-bottom: 4px;">✓ Colorado</div>
                            <div class="filter-item" style="padding: 8px 12px; font-size: 13px; color: rgba(255,255,255,0.6); border-radius: 6px;">Utah</div>
                        </div>
                    </div>
                    
                    <div class="programs-map" style="
                        background: rgba(0,0,0,0.3); 
                        border-radius: 12px; 
                        overflow: hidden; 
                        position: relative; 
                        min-height: 250px;
                    ">
                        <div class="map-camera" style="width: 100%; height: 100%; transform-origin: center;">
                            <svg class="map-bg" viewBox="0 0 400 300" style="width: 100%; height: 100%; position: absolute; inset: 0;">
                                <rect width="400" height="300" fill="#1E293B"/>
                                <!-- Grid lines -->
                                <path d="M0 50 H400 M0 100 H400 M0 150 H400 M0 200 H400 M0 250 H400" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                                <path d="M50 0 V300 M100 0 V300 M150 0 V300 M200 0 V300 M250 0 V300 M300 0 V300 M350 0 V300" stroke="rgba(255,255,255,0.05)" stroke-width="1"/>
                                
                                <circle cx="120" cy="100" r="8" fill="#6366F1" class="map-marker"/>
                                <circle cx="200" cy="150" r="8" fill="#6366F1" class="map-marker"/>
                                <circle cx="280" cy="120" r="8" fill="#6366F1" class="map-marker"/>
                                <circle cx="150" cy="200" r="8" fill="#6366F1" class="map-marker"/>
                                <circle cx="320" cy="180" r="8" fill="#6366F1" class="map-marker"/>
                            </svg>
                        </div>
                        <div class="map-label" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 14px; color: rgba(255,255,255,0.4);">Interactive Map View</div>
                    </div>
                    
                    <div class="programs-cards" style="display: flex; flex-direction: column; gap: 12px;">
                        <div class="program-card" style="background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px;">
                            <div class="card-name" style="font-size: 15px; font-weight: 600; color: white; margin-bottom: 4px;">Summit Recovery</div>
                            <div class="card-loc" style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 12px;">RTC • Colorado</div>
                            <div class="card-tags" style="display: flex; gap: 6px; margin-bottom: 12px;">
                                <span class="tag" style="font-size: 11px; padding: 3px 8px; background: rgba(99, 102, 241, 0.2); color: #818CF8; border-radius: 4px;">Trauma</span>
                                <span class="tag" style="font-size: 11px; padding: 3px 8px; background: rgba(99, 102, 241, 0.2); color: #818CF8; border-radius: 4px;">DBT</span>
                            </div>
                            <button class="card-btn" style="width: 100%; padding: 8px; background: #6366F1; color: white; border: none; border-radius: 6px; font-size: 13px; font-weight: 500; cursor: pointer;">Add to Plan</button>
                        </div>
                        <!-- ... more cards -->
                    </div>
                </div>
            </div>
            <div class="intro-caption" style="
                margin-top: 40px;
                text-align: center;
                max-width: 600px;
            ">
                <h2 style="font-size: 28px; font-weight: 700; color: white; margin: 0 0 12px 0;">Programs, Map, and Aftercare Docs</h2>
                <p style="font-size: 16px; color: rgba(255, 255, 255, 0.7); margin: 0; line-height: 1.6;">Search by level of care, location, or specialty. Explore on an immersive map. Add programs directly to a client's aftercare packet.</p>
            </div>
        `;
    }

    build(tl, startTime) {
        const filters = this.container.querySelector('.programs-filters');
        const map = this.container.querySelector('.programs-map');
        const cards = this.container.querySelector('.programs-cards');
        const markers = this.container.querySelectorAll('.map-marker');
        const caption = this.container.querySelector('.intro-caption');
        const camera = this.container.querySelector('.map-camera');
        
        tl.set(this.container, { opacity: 1 }, startTime)
          .set(filters, { opacity: 0, x: -30 }, startTime)
          .set(map, { opacity: 0, scale: 0.95 }, startTime)
          .set(cards, { opacity: 0, x: 30 }, startTime)
          .set(markers, { scale: 0 }, startTime)
          .set(caption, { opacity: 0, y: 30 }, startTime)
          .set(camera, { scale: 1.2 }, startTime);
          
        // Elements build
        tl.to(filters, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, startTime)
          .to(map, { opacity: 1, scale: 1, duration: 0.6, ease: 'power2.out' }, startTime + 0.2)
          .call(() => this.director.playSfx('whoosh'), null, startTime)
          
          // Map pins drop
          .to(markers, { 
              scale: 1, 
              duration: 0.6, 
              stagger: 0.1,
              ease: 'elastic.out(1, 0.5)'
          }, startTime + 0.8)
          .call(() => this.director.playSfx('pop'), null, startTime + 0.8)
          
          // Camera pan effect
          .to(camera, { 
              scale: 1,
              x: 0,
              y: 0,
              duration: 3,
              ease: 'power1.inOut'
          }, startTime + 1.0)
          
          // Cards slide in
          .to(cards, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out' }, startTime + 1.5)
          .call(() => this.director.playSfx('whoosh'), null, startTime + 1.5)
          
          // Caption
          .to(caption, { opacity: 1, y: 0, duration: 0.6 }, startTime + 2.0);
          
        tl.call(() => this.director.playVoice('programs'), null, startTime + 0.5);
    }
}

// Export
if (typeof window !== 'undefined') {
    window.ProgramsScene = ProgramsScene;
}

