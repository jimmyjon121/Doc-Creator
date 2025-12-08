/**
 * CareConnect Pro - MAGNUM OPUS INTRO
 * 
 * "Investor Jaw-Drop" + "Clinical Zen" Edition
 * 
 * Architecture:
 * - Living Organism: UI grows and breathes
 * - Chaos to Order: Physics simulations
 * - Volumetric Lighting: Ambient effects
 * - Liquid Motion: Organic transitions
 * - Glass Morphism: Premium materials
 * - Cinematic Camera: 3D parallax
 */

class OnboardingIntro {
    constructor() {
        this.container = null;
        this.canvas = null;
        this.ctx = null;
        this.particles = [];
        this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.audioController = null;
        this.animationFrameId = null;
        this.mode = 'idle';
        this.targetPoints = []; // For guided particle movement
        
        // Premium Easing Curves
        this.ease = {
            lux: 'cubic-bezier(0.19, 1, 0.22, 1)',
            smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
            bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            expo: 'cubic-bezier(0.16, 1, 0.3, 1)'
        };
        
        // Clinical Professional Palette
        this.colors = {
            // Backgrounds - Deep but warm navy, not void black
            void: '#0F172A',
            deep: '#1E293B',
            // Primary - Clinical teal (trustworthy, calm, healthcare)
            primary: '#0D9488',
            // Secondary - Calm cyan
            secondary: '#0891B2',
            // Accent - Sage green (growth, wellness)
            accent: '#10B981',
            // Warm - Soft amber
            warm: '#F59E0B',
            // Alert - Clinical red (softer than neon)
            alert: '#DC2626',
            // Glass - Slightly warmer
            glass: 'rgba(255, 255, 255, 0.04)',
            // Text - Softer white
            text: '#F8FAFC',
            // Muted - Better contrast
            muted: 'rgba(255, 255, 255, 0.6)',
            // Additional clinical colors
            purple: '#7C3AED',
            yellow: '#FBBF24',
            green: '#10B981'
        };
        
        console.log('[Intro] Magnum Opus initialized');
    }

    async start() {
        console.log('[Intro] Starting Magnum Opus experience...');
        
        // Create the cinematic stage
        this.createStage();
        
        // Initialize Audio Controller
        if (window.AudioController) {
            this.audioController = new AudioController();
            try {
                await this.audioController.init();
            } catch (e) {
                console.warn('[Intro] Audio unavailable');
            }
        }
        
        // Start the living particle system
        this.startLivingLoop();
        
        // Execute the Director's Cut
        await this.playDirectorsCut();
    }

    createStage() {
        this.container = document.createElement('div');
        this.container.id = 'magnum-intro';
        this.container.style.cssText = `
            position: fixed;
            inset: 0;
            z-index: 999999;
            background: ${this.colors.void};
            overflow: visible;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        
        this.container.innerHTML = `
            <!-- Layer 1: Deep Ambient - Clinical teal/cyan gradients -->
            <div class="layer-ambient" style="
                position: absolute;
                inset: -100px;
                background: 
                    radial-gradient(ellipse 120% 80% at 30% 20%, rgba(13, 148, 136, 0.10) 0%, transparent 50%),
                    radial-gradient(ellipse 100% 60% at 70% 80%, rgba(8, 145, 178, 0.08) 0%, transparent 50%),
                    radial-gradient(ellipse 80% 80% at 50% 50%, rgba(16, 185, 129, 0.05) 0%, transparent 60%);
                animation: ambient-drift 30s ease-in-out infinite alternate;
                pointer-events: none;
            "></div>
            
            <!-- Layer 2: Soul Canvas (Physics) -->
            <canvas class="layer-soul" style="position: absolute; inset: 0; pointer-events: none;"></canvas>
            
            <!-- Layer 3: Main Stage -->
            <div class="layer-stage" style="
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                perspective: 1500px;
                transform-style: preserve-3d;
            "></div>
            
            <!-- Layer 4: Overlay Effects -->
            <div class="layer-grain" style="
                position: absolute;
                inset: 0;
                opacity: 0.03;
                background: repeating-radial-gradient(circle at 50% 50%, transparent 0, rgba(255,255,255,0.03) 1px, transparent 2px);
                pointer-events: none;
            "></div>
            <div class="layer-vignette" style="
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%);
                pointer-events: none;
            "></div>
            
            <!-- Layer 5: Subtitle Overlay -->
            <div class="layer-subtitles" style="
                position: absolute;
                bottom: 100px;
                left: 50%;
                transform: translateX(-50%);
                width: 80%;
                max-width: 900px;
                text-align: center;
                z-index: 150;
                pointer-events: none;
            ">
                <div class="subtitle-text" style="
                    display: inline-block;
                    padding: 12px 28px;
                    background: rgba(0, 0, 0, 0.75);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-radius: 8px;
                    color: #FFFFFF;
                    font-size: 18px;
                    font-weight: 400;
                    line-height: 1.6;
                    letter-spacing: 0.3px;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    opacity: 0;
                    transform: translateY(10px);
                    transition: opacity 0.4s ease, transform 0.4s ease;
                "></div>
            </div>
            
            <!-- Layer 6: Progress & Controls -->
            <div class="layer-controls" style="
                position: absolute;
                bottom: 40px;
                left: 50%;
                transform: translateX(-50%);
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 16px;
                z-index: 100;
            ">
                <div class="progress-track" style="
                    width: 120px;
                    height: 2px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 1px;
                    overflow: visible;
                ">
                    <div class="progress-fill" style="
                        width: 0%;
                        height: 100%;
                        background: ${this.colors.primary};
                        transition: width 0.5s ease;
                    "></div>
                </div>
                <button class="skip-btn" style="
                    background: none;
                    border: 1px solid rgba(255,255,255,0.15);
                    padding: 8px 20px;
                    border-radius: 20px;
                    color: rgba(255,255,255,0.4);
                    font-size: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    letter-spacing: 0.5px;
                ">Skip</button>
            </div>
            
            <style>
                @keyframes ambient-drift {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(-50px, -30px) rotate(3deg); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                @keyframes pulse-glow {
                    0%, 100% { box-shadow: 0 0 30px rgba(13, 148, 136, 0.3); }
                    50% { box-shadow: 0 0 60px rgba(13, 148, 136, 0.5); }
                }
                @keyframes breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.02); }
                }
                .glass {
                    background: rgba(255, 255, 255, 0.02);
                    backdrop-filter: blur(40px);
                    -webkit-backdrop-filter: blur(40px);
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    box-shadow: 
                        0 25px 50px rgba(0,0,0,0.4),
                        inset 0 1px 0 rgba(255,255,255,0.05);
                }
                .glass-strong {
                    background: rgba(255, 255, 255, 0.04);
                    backdrop-filter: blur(60px);
                    -webkit-backdrop-filter: blur(60px);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 
                        0 30px 60px rgba(0,0,0,0.5),
                        inset 0 1px 0 rgba(255,255,255,0.1);
                }
                .skip-btn:hover {
                    background: rgba(255,255,255,0.05);
                    border-color: rgba(255,255,255,0.3);
                    color: rgba(255,255,255,0.8);
                }
            </style>
        `;
        
        document.body.appendChild(this.container);
        
        // Setup Canvas
        this.canvas = this.container.querySelector('.layer-soul');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx = this.canvas.getContext('2d');
        
        // Bind Skip
        this.container.querySelector('.skip-btn').addEventListener('click', () => this.skip());
        
        // Keyboard
        this.keyHandler = (e) => { if (e.key === 'Escape') this.skip(); };
        document.addEventListener('keydown', this.keyHandler);
        
        // Mouse Parallax - Subtle, clinical feel
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
            
            const xPct = (e.clientX / window.innerWidth - 0.5) * 2;
            const yPct = (e.clientY / window.innerHeight - 0.5) * 2;
            
            // Reduced parallax for more professional feel
            gsap.to('.layer-stage', {
                rotationY: xPct * 0.5,
                rotationX: -yPct * 0.5,
                duration: 2,
                ease: 'power2.out'
            });
        });
    }

    updateProgress(percent) {
        const fill = this.container.querySelector('.progress-fill');
        if (fill) fill.style.width = `${percent}%`;
    }

    // ➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É
    // SUBTITLE SYSTEM
    // ➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É
    
    getSubtitleData() {
        return {
            scene1: [
                { time: 0, duration: 2.5, text: "Emails..." },
                { time: 2.5, duration: 2, text: "Calls..." },
                { time: 4.5, duration: 2.5, text: "Scattered notes..." },
                { time: 7, duration: 2.5, text: "Where do you even start?" },
                { time: 10, duration: 3, text: "Every day begins with chaos." },
                { time: 13.5, duration: 3.5, text: "But what if there was a sanctuary?" },
                { time: 17.5, duration: 4, text: "This is CareConnect Pro." }
            ],
            scene2: [
                { time: 0, duration: 3, text: "Welcome to your command center." },
                { time: 3.5, duration: 3, text: "Every morning starts here." },
                { time: 7, duration: 4, text: "At a glance, you see your entire caseload." },
                { time: 11.5, duration: 5, text: "The Client Journey widget tracks each stage ΓÇö from admission through discharge." },
                { time: 17, duration: 5, text: "Four clients in week one. Three approaching their first milestone." },
                { time: 23, duration: 4, text: "Your Daily Flight Plan turns the noise into a clear list." },
                { time: 27.5, duration: 3.5, text: "Red zone ΓÇö what's overdue. Handle these first." },
                { time: 31.5, duration: 3, text: "Yellow ΓÇö today's priorities." },
                { time: 35, duration: 3, text: "Purple ΓÇö discharge prep. Green ΓÇö on track." },
                { time: 38.5, duration: 4, text: "The Pipeline shows your caseload flow." },
                { time: 43, duration: 3, text: "The Compliance widget tracks your metrics." },
                { time: 46.5, duration: 4.5, text: "The Gaps widget highlights what's missing before it becomes an audit finding." },
                { time: 51.5, duration: 3.5, text: "Missing aftercare plan... day forty-five. Now you know." }
            ],
            scene3: [
                { time: 0, duration: 2.5, text: "Your clinical library." },
                { time: 3, duration: 4, text: "529 treatment programs ΓÇö searchable and organized." },
                { time: 7.5, duration: 4, text: "Watch what happens when you type \"trauma adolescent.\"" },
                { time: 12, duration: 3, text: "The system understands what you need." },
                { time: 15.5, duration: 2.5, text: "87 programs match." },
                { time: 18.5, duration: 4, text: "Semantic filters appear automatically ΓÇö trauma-focused, ages 13-17." },
                { time: 23, duration: 3.5, text: "Each program card shows what matters." },
                { time: 27, duration: 4, text: "Resilience Recovery ΓÇö a PHP program in Malibu." },
                { time: 31.5, duration: 4, text: "Trauma-specialized. DBT certified. Family therapy included." },
                { time: 36, duration: 3.5, text: "Insurance? Aetna, Blue Cross, Cigna." },
                { time: 40, duration: 3.5, text: "Click \"Add to Plan\" ΓÇö and it's done." },
                { time: 44, duration: 4, text: "The program joins your client's aftercare document." },
                { time: 48.5, duration: 5, text: "Filter by level of care ΓÇö RTC, PHP, IOP, Wilderness." },
                { time: 54, duration: 4, text: "By age range. By location. By specialty." },
                { time: 58.5, duration: 3, text: "Every filter updates instantly." }
            ],
            scene4: [
                { time: 0, duration: 2.5, text: "But where are they located?" },
                { time: 3, duration: 4, text: "When geography matters, see programs on a map." },
                { time: 7.5, duration: 3.5, text: "529 pins across the nation." },
                { time: 11.5, duration: 4.5, text: "Each color represents a level of care ΓÇö purple for RTC, teal for PHP." },
                { time: 16.5, duration: 3.5, text: "Watch as we zoom into California." },
                { time: 20.5, duration: 3.5, text: "87 programs in this state alone." },
                { time: 24.5, duration: 4.5, text: "The Los Angeles cluster expands ΓÇö Malibu, Santa Monica, Newport Beach." },
                { time: 29.5, duration: 3.5, text: "Type \"Malibu\" in the search." },
                { time: 33.5, duration: 3.5, text: "Watch the irrelevant pins fade away." },
                { time: 37.5, duration: 2.5, text: "12 programs nearby." },
                { time: 40.5, duration: 3, text: "Hover over a pin to preview." },
                { time: 44, duration: 3, text: "Click to see full details." },
                { time: 47.5, duration: 3.5, text: "One click ΓÇö \"Add to Plan.\"" },
                { time: 51.5, duration: 4, text: "The program flies into your aftercare document." }
            ],
            scene5: [
                { time: 0, duration: 3, text: "Now let's build the document." },
                { time: 3.5, duration: 4, text: "Your selected programs are ready in the sidebar." },
                { time: 8, duration: 3.5, text: "Resilience Recovery. Newport Academy." },
                { time: 12, duration: 4.5, text: "The system generates a professional aftercare recommendation automatically." },
                { time: 17, duration: 4.5, text: "Client summary at the top ΓÇö Emma Thompson, 17, completing residential treatment." },
                { time: 22, duration: 4.5, text: "Program recommendations follow with full details and clinical rationale." },
                { time: 27, duration: 3, text: "Next steps are outlined." },
                { time: 30.5, duration: 4.5, text: "Choose what to include ΓÇö program details, contact info, insurance verification." },
                { time: 35.5, duration: 3.5, text: "One click ΓÇö \"Save to Vault.\"" },
                { time: 39.5, duration: 2.5, text: "The document is secured." },
                { time: 42.5, duration: 4, text: "Ready to share with families. Professional. Complete. Done." }
            ],
            scene6: [
                { time: 0, duration: 3.5, text: "Did I submit Emma's utilization review?" },
                { time: 4, duration: 3, text: "When is Liam's assessment due?" },
                { time: 7.5, duration: 3, text: "Is Mason's signature still pending?" },
                { time: 11, duration: 4, text: "The anxious thoughts that keep coaches up at night." },
                { time: 15.5, duration: 2.5, text: "CareConnect is watching." },
                { time: 18.5, duration: 4.5, text: "Your orbital command center shows every task ΓÇö color-coded by urgency." },
                { time: 23.5, duration: 4, text: "Red means critical ΓÇö Emma's review due in two hours." },
                { time: 28, duration: 2.5, text: "Yellow marks warnings." },
                { time: 31, duration: 4, text: "The smart insight card surfaces what matters most." },
                { time: 35.5, duration: 3.5, text: "Your compliance dashboard shows the big picture." },
                { time: 39.5, duration: 4, text: "94% overall score. Eight tasks today. All deadlines visible." },
                { time: 44, duration: 3.5, text: "Sleep well tonight. We've got this." }
            ],
            scene7: [
                { time: 0, duration: 2.5, text: "Find the right programs." },
                { time: 3, duration: 2.5, text: "Build professional documents." },
                { time: 6, duration: 2.5, text: "Track every deadline." },
                { time: 9, duration: 3, text: "Thrive in your role." },
                { time: 12.5, duration: 3.5, text: "Your sanctuary of clarity is ready." },
                { time: 16.5, duration: 3, text: "Run your day. Don't let it run you." },
                { time: 20, duration: 4, text: "Welcome to CareConnect Pro." }
            ]
        };
    }

    showSubtitle(text) {
        const subtitleEl = this.container.querySelector('.subtitle-text');
        if (!subtitleEl) return;
        
        subtitleEl.textContent = text;
        subtitleEl.style.opacity = '1';
        subtitleEl.style.transform = 'translateY(0)';
    }

    hideSubtitle() {
        const subtitleEl = this.container.querySelector('.subtitle-text');
        if (!subtitleEl) return;
        
        subtitleEl.style.opacity = '0';
        subtitleEl.style.transform = 'translateY(10px)';
    }

    async runSubtitles(sceneKey, timeline) {
        const subtitles = this.getSubtitleData()[sceneKey];
        if (!subtitles) return;
        
        for (const sub of subtitles) {
            // Add subtitle to GSAP timeline
            timeline.call(() => this.showSubtitle(sub.text), [], sub.time);
            timeline.call(() => this.hideSubtitle(), [], sub.time + sub.duration - 0.3);
        }
    }

    // Helper to play subtitles standalone (not tied to timeline)
    async playSubtitlesForScene(sceneKey) {
        const subtitles = this.getSubtitleData()[sceneKey];
        if (!subtitles) return;
        
        for (const sub of subtitles) {
            await this.delay(sub.time * 1000);
            this.showSubtitle(sub.text);
            await this.delay((sub.duration - 0.3) * 1000);
            this.hideSubtitle();
            await this.delay(300);
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É
    // END SUBTITLE SYSTEM
    // ➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É➕É

    async playDirectorsCut() {
        const stage = this.container.querySelector('.layer-stage');
        
        // Scene 1: The Chaos (Problem Statement)
        this.updateProgress(0);
        await this.sceneChaosToOrder(stage);
        
        // Scene 2: The Sanctuary (Dashboard Overview)
        this.updateProgress(12);
        await this.sceneSanctuary(stage);
        
        // Scene 3: Program Database (Cinematic Showcase)
        this.updateProgress(24);
        await this.sceneProgramDatabase(stage);
        
        // Scene 4: The Map (Geographic Discovery)
        this.updateProgress(36);
        await this.sceneTheWorld(stage);
        
        // Scene 5: Document Builder
        this.updateProgress(48);
        await this.sceneDocumentBuilder(stage);
        
        // Scene 6: The Safety Net (Tracking & Compliance)
        this.updateProgress(62);
        await this.sceneSafetyNet(stage);
        
        // Scene 7: Transcendence (Finale)
        this.updateProgress(85);
        await this.sceneTranscendence(stage);
        
        this.updateProgress(100);
        this.complete();
    }

    // =========================================
    // SCENE 1: CHAOS TO ORDER
    // The emotional hook - show the problem, then the solution
    // =========================================
    async sceneChaosToOrder(stage) {
        console.log('[Intro] Scene 1: Chaos to Order');
        
        // Start subtitles for Scene 1
        this.playSubtitlesForScene('scene1');
        
        // Spawn chaotic particles with color variation
        this.mode = 'chaos';
        // Reduced particle count for cleaner, more clinical feel
        this.spawnParticles(300);
        
        // Create chaos text
        const chaosText = document.createElement('div');
        chaosText.style.cssText = `
            text-align: center;
            opacity: 0;
            transform: scale(0.9);
        `;
        chaosText.innerHTML = `
            <div style="
                font-size: 11px;
                letter-spacing: 4px;
                color: ${this.colors.muted};
                text-transform: uppercase;
                margin-bottom: 16px;
            ">Every day begins with</div>
            <h1 class="chaos-title" style="
                font-size: clamp(3rem, 8vw, 6rem);
                font-weight: 200;
                color: ${this.colors.text};
                letter-spacing: -0.03em;
                margin: 0;
            ">Chaos</h1>
            <p style="
                font-size: 1.1rem;
                color: ${this.colors.muted};
                margin-top: 20px;
                max-width: 400px;
                line-height: 1.6;
            ">Emails. Calls. Scattered notes.<br>Where do you even start?</p>
        `;
        stage.appendChild(chaosText);
        
        const tl = gsap.timeline();
        
        // Fade in chaos message
        tl.to(chaosText, { opacity: 1, scale: 1, duration: 2, ease: this.ease.lux });
        
        // Screen shake effect during chaos - subtle jitter on the stage
        const shakeTimeline = gsap.timeline({ repeat: 6 });
        shakeTimeline.to(stage, {
            x: () => (Math.random() - 0.5) * 4,
            y: () => (Math.random() - 0.5) * 3,
            duration: 0.08,
            ease: 'none'
        });
        shakeTimeline.to(stage, { x: 0, y: 0, duration: 0.08, ease: 'none' });
        
        // Let them feel the chaos
        tl.to({}, { duration: 3 });
        
        // Stop shake
        tl.call(() => shakeTimeline.kill());
        
        // Fade out chaos text
        tl.to(chaosText, { opacity: 0, y: -30, duration: 1.5, ease: 'power2.in' });
        
        // Create the logo container
        const logoContainer = document.createElement('div');
        logoContainer.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) scale(0.85);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            opacity: 0;
            z-index: 10;
        `;
        logoContainer.innerHTML = `
            <div class="logo-icon glass-strong" style="
                width: 130px;
                height: 130px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 56px;
                box-shadow: 0 0 60px rgba(13, 148, 136, 0.4);
                background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.12), rgba(13, 148, 136, 0.1));
                border: 2px solid rgba(13, 148, 136, 0.4);
            ">🏥</div>
            <h1 style="
                font-size: 3rem;
                font-weight: 300;
                color: ${this.colors.text};
                margin-top: 24px;
                letter-spacing: -0.02em;
            ">Care<span style="font-weight: 700;">Connect</span> <span style="color: ${this.colors.primary}; font-size: 1.1rem; vertical-align: super; margin-left: 6px;">PRO</span></h1>
            <p style="
                font-size: 1rem;
                color: ${this.colors.muted};
                margin-top: 10px;
                letter-spacing: 1px;
            ">Your sanctuary of clarity</p>
        `;
        stage.appendChild(logoContainer);
        
        // Get the icon element for precise positioning
        const iconEl = logoContainer.querySelector('.logo-icon');
        
        // FLOW: Particles converge BEHIND logo (hidden) → Logo appears → Particles expand to ring
        
        // Particles converge to a tiny point at screen center (will be hidden behind logo)
        tl.call(() => {
            // Converge to center with radius 0 (all particles go to same point)
            this.setRingTarget(this.canvas.width / 2, this.canvas.height / 2 - 50, 0);
            this.mode = 'converge';
            this.playSfx('whoosh');
        });
        
        // Wait for particles to converge to center point
        tl.to({}, { duration: 1.2 });
        
        // Logo fades in - particles are now hidden behind it
        tl.to(logoContainer, { 
            opacity: 1, 
            scale: 1, 
            transform: 'translate(-50%, -50%) scale(1)',
            duration: 1.2, 
            ease: this.ease.lux 
        });
        
        // Heartbeat glow on logo icon
        const heartbeatGlow = gsap.timeline({ repeat: 2 });
        heartbeatGlow.to(iconEl, {
            boxShadow: '0 0 80px rgba(13, 148, 136, 0.6), 0 0 120px rgba(13, 148, 136, 0.3)',
            scale: 1.05,
            duration: 0.15,
            ease: 'power2.out'
        });
        heartbeatGlow.to(iconEl, {
            boxShadow: '0 0 60px rgba(13, 148, 136, 0.4)',
            scale: 1,
            duration: 0.3,
            ease: 'power2.in'
        });
        heartbeatGlow.to({}, { duration: 0.4 }); // Pause between beats
        
        // Brief pause with particles hidden
        tl.to({}, { duration: 0.5 });
        
        // NOW particles expand outward to form the ring
        tl.call(() => {
            // Get the actual rendered position of the icon
            const rect = iconEl.getBoundingClientRect();
            const iconCenterX = rect.left + rect.width / 2;
            const iconCenterY = rect.top + rect.height / 2;
            
            // Update ring target - particles will smoothly expand from center to ring
            this.setRingTarget(iconCenterX, iconCenterY, rect.width / 2 + 20);
            this.mode = 'ring';
            this.playSfx('chime');
        });
        
        // Hold with the beautiful trembling ring
        tl.to({}, { duration: 3 });
        
        // Scatter particles before transition
        tl.call(() => { this.scatterParticles(600); });
        tl.to({}, { duration: 0.4 });
        
        // Transition out
        tl.to([chaosText, logoContainer], { 
            opacity: 0, 
            scale: 1.12, 
            filter: 'blur(10px)', 
            duration: 1.5 
        });
        
        tl.call(() => {
            chaosText.remove();
            logoContainer.remove();
        });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE 2: THE SANCTUARY (Dashboard)
    // Show the dashboard as a place of calm and control
    // EXPANDED: Full widget tour with clinical context
    // =========================================
    async sceneSanctuary(stage) {
        console.log('[Intro] Scene 2: The Sanctuary (Expanded)');
        
        // Start subtitles for Scene 2
        this.playSubtitlesForScene('scene2');
        
        this.mode = 'ambient';
        
        // =============================================
        // WIDGET CONFIGURATION - Clinical context for each widget
        // =============================================
        const widgetConfig = {
            journey: {
                selector: '.widget-journey',
                title: 'Client Journey',
                caption: 'See who is in Week 1, Day 14-16, Day 30, and approaching discharge at a glance.'
            },
            flightPlan: {
                selector: '.widget-flight',
                title: 'Daily Flight Plan',
                caption: 'Your tasks grouped by urgency: red for overdue, purple for this week, yellow for today, green for on-track.'
            },
            pipeline: {
                selector: '.widget-pipeline',
                title: 'Intake & Discharge',
                caption: 'Track who is arriving today, this week, and who is preparing to leave.'
            },
            compliance: {
                selector: '.widget-compliance',
                title: 'House Compliance',
                caption: 'Monitor documentation completion rates across your houses in real-time.'
            },
            gaps: {
                selector: '.widget-gaps',
                title: 'Gaps & Missing',
                caption: 'Quickly see what documentation is overdue or missing before it becomes a problem.'
            },
            spotlight: {
                selector: '.widget-spotlight',
                title: 'Program Spotlight',
                caption: 'Featured programs and learning opportunities to expand your referral network.'
            }
        };
        
        // Bottom fade overlay - masks widgets bleeding out elegantly
        const bottomFade = document.createElement('div');
        bottomFade.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 200px;
            background: linear-gradient(to bottom, transparent 0%, ${this.colors.void}cc 40%, ${this.colors.void} 100%);
            pointer-events: none;
            z-index: 12;
        `;
        stage.appendChild(bottomFade);
        
        // Scene label - CENTERED
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 60px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
            z-index: 10;
        `;
        label.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase;">Your Daily Command Center</div>
            <h2 style="font-size: 2.2rem; font-weight: 600; color: ${this.colors.text}; margin-top: 8px; letter-spacing: 1px;">The Dashboard</h2>
        `;
        stage.appendChild(label);
        
        // Dashboard mockup - EXPANDED with all widgets
        const dashboard = document.createElement('div');
        dashboard.className = 'glass';
        dashboard.style.cssText = `
            width: 1000px;
            max-width: 92vw;
            height: 720px;
            border-radius: 20px;
            transform: rotateX(12deg) translateY(40px) scale(0.78);
            opacity: 0;
            overflow: visible;
            display: flex;
            flex-direction: column;
            position: relative;
        `;
        
        dashboard.innerHTML = `
            <!-- Real Dashboard Header Bar -->
            <div class="dash-header" style="
                height: 44px;
                background: linear-gradient(90deg, rgba(13, 148, 136, 0.12), rgba(8, 145, 178, 0.06));
                border-bottom: 1px solid rgba(13, 148, 136, 0.15);
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 14px;
                flex-shrink: 0;
                opacity: 0;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 9px; letter-spacing: 1.5px; color: ${this.colors.muted}; text-transform: uppercase;">COACH OVERVIEW</span>
                    <span style="font-size: 13px; font-weight: 600; color: ${this.colors.text};">Dashboard</span>
                    <div style="display: flex; align-items: center; gap: 4px; padding: 2px 8px; background: rgba(16, 185, 129, 0.12); border-radius: 8px;">
                        <div class="live-dot" style="width: 5px; height: 5px; background: #10B981; border-radius: 50%;"></div>
                        <span style="font-size: 8px; color: #10B981;">Live</span>
                    </div>
                </div>
                <div style="display: flex; gap: 6px;">
                    <div class="hdr-btn" style="padding: 4px 10px; background: rgba(255,255,255,0.04); border-radius: 5px; font-size: 9px; color: ${this.colors.muted}; opacity: 0;">≡🔔</div>
                    <div class="hdr-btn" style="padding: 4px 10px; background: rgba(13, 148, 136, 0.15); border-radius: 5px; font-size: 9px; color: ${this.colors.primary}; opacity: 0;">☀</div>
                </div>
            </div>
            
            <!-- Dashboard Content -->
            <div style="flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; overflow: visible;">
            
                <!-- Quick Actions Bar -->
                <div class="quick-bar" style="
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.85));
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.04);
                    opacity: 0;
                    transform: translateY(-8px);
                ">
                    <div>
                        <div style="font-size: 14px; font-weight: 600; color: ${this.colors.text};">Good morning, Coach</div>
                        <div style="font-size: 9px; color: ${this.colors.muted};">Today's priorities • <span style="color: #DC2626;">2 Urgent</span></div>
                    </div>
                    <div style="display: flex; gap: 5px;">
                        <div class="qbtn" style="padding: 5px 8px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 5px; font-size: 8px; color: white; opacity: 0; transform: scale(0.9);">Γ₧ò Client</div>
                        <div class="qbtn" style="padding: 5px 8px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 5px; font-size: 8px; color: white; opacity: 0; transform: scale(0.9);">≡📄 Doc</div>
                        <div class="qbtn" style="padding: 5px 8px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 5px; font-size: 8px; color: white; opacity: 0; transform: scale(0.9);">≡🌅 Review</div>
                    </div>
                </div>
                
                <!-- Main Widget Grid -->
                <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto auto; gap: 8px; padding-bottom: 40px;">
                
                <!-- ROW 1: Journey Rail (spans 3) -->
                <div class="widget-journey glass" data-widget="journey" style="
                    grid-column: span 3;
                    border-radius: 10px;
                    padding: 10px 14px;
                    opacity: 0;
                    transform: translateY(20px);
                ">
                    <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 8px;">Client Journey</div>
                    <div style="display: flex; gap: 6px;">
                        ${['Week 1', 'Day 14-16', 'Day 30', '45+ Days', 'Discharge', 'Alumni'].map((lbl, i) => `
                            <div class="journey-stage" style="
                                flex: 1;
                                background: rgba(13, 148, 136, ${0.08 + i * 0.02});
                                border-radius: 6px;
                                padding: 8px 6px;
                                text-align: center;
                                opacity: 0;
                                transform: scale(0.9);
                            ">
                                <div style="font-size: 1.1rem; font-weight: 700; color: ${this.colors.text};">0</div>
                                <div style="font-size: 7px; color: ${this.colors.muted}; margin-top: 2px;">${lbl}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- ROW 2: Flight Plan (2 cols) + Pipeline (1 col) -->
                <div class="widget-flight glass" data-widget="flightPlan" style="
                    grid-column: span 2;
                    border-radius: 10px;
                    padding: 10px 14px;
                    opacity: 0;
                    transform: translateY(20px);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                        <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.muted}; text-transform: uppercase;">Daily Flight Plan</div>
                        <div style="font-size: 8px; color: ${this.colors.primary};">20 tasks</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${[
                            { color: '#DC2626', label: 'Needs Attention', count: 2, task: 'RR Overdue - Emma W.' },
                            { color: '#7C3AED', label: 'This Week', count: 7, task: '30-day review - Sophia M.' },
                            { color: '#FBBF24', label: 'Coming Up', count: 5, task: 'Weekly check-in - Olivia R.' },
                            { color: '#10B981', label: 'On Track', count: 6, task: 'Documentation complete' }
                        ].map(zone => `
                            <div class="flight-zone" style="
                                display: flex;
                                align-items: center;
                                padding: 5px 10px;
                                background: rgba(255,255,255,0.02);
                                border-radius: 5px;
                                border-left: 3px solid ${zone.color};
                                opacity: 0;
                                transform: translateX(-15px);
                            ">
                                <div style="flex: 1;">
                                    <div style="font-size: 10px; color: ${this.colors.text};">${zone.label}</div>
                                    <div class="task-preview" style="font-size: 8px; color: ${this.colors.muted}; opacity: 0.7; margin-top: 1px;">${zone.task}</div>
                                </div>
                                <span class="zone-count" data-target="${zone.count}" style="
                                    background: ${zone.color}20;
                                    color: ${zone.color};
                                    padding: 3px 8px;
                                    border-radius: 10px;
                                    font-size: 10px;
                                    font-weight: 700;
                                    min-width: 24px;
                                    text-align: center;
                                ">0</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Pipeline Widget -->
                <div class="widget-pipeline glass" data-widget="pipeline" style="
                    border-radius: 10px;
                    padding: 10px 14px;
                    opacity: 0;
                    transform: translateY(20px);
                ">
                    <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 8px;">Intake & Discharge</div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${[
                            { label: 'Today', intake: 1, discharge: 0, name: 'Marcus T.' },
                            { label: 'This Week', intake: 3, discharge: 1, name: '+2 pending' },
                            { label: 'Next 7 Days', intake: 2, discharge: 2, name: 'Scheduled' }
                        ].map(row => `
                            <div class="pipeline-row" style="
                    display: flex;
                    align-items: center;
                                justify-content: space-between;
                                padding: 6px 10px;
                                background: rgba(255,255,255,0.03);
                                border-radius: 6px;
                                opacity: 0;
                                transform: translateX(15px);
                            ">
                                <div>
                                    <div style="font-size: 10px; color: ${this.colors.text};">${row.label}</div>
                                    <div style="font-size: 7px; color: ${this.colors.muted};">${row.name}</div>
                                </div>
                                <div style="display: flex; gap: 6px;">
                    <div style="text-align: center;">
                                        <span class="pipeline-val" data-target="${row.intake}" style="font-size: 12px; font-weight: 600; color: #10B981;">0</span>
                                        <div style="font-size: 6px; color: ${this.colors.muted};">IN</div>
                    </div>
                    <div style="text-align: center;">
                                        <span class="pipeline-val" data-target="${row.discharge}" style="font-size: 12px; font-weight: 600; color: #7C3AED;">0</span>
                                        <div style="font-size: 6px; color: ${this.colors.muted};">OUT</div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- ROW 3: Compliance (1 col) + Gaps (1 col) + Spotlight (1 col) -->
                <div class="widget-compliance glass" data-widget="compliance" style="
                    border-radius: 10px;
                    padding: 10px 14px;
                    opacity: 0;
                    transform: translateY(20px);
                ">
                    <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 8px;">House Compliance</div>
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        ${[
                            { name: 'Serenity House', pct: 96, color: '#10B981', clients: 8 },
                            { name: 'Harmony Lodge', pct: 84, color: '#FBBF24', clients: 6 },
                            { name: 'New Beginnings', pct: 92, color: '#10B981', clients: 7 }
                        ].map(house => `
                            <div class="compliance-row" style="opacity: 0; transform: scale(0.95);">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px;">
                                    <div>
                                        <span style="font-size: 10px; color: ${this.colors.text};">${house.name}</span>
                                        <span style="font-size: 7px; color: ${this.colors.muted}; margin-left: 4px;">(${house.clients})</span>
                                    </div>
                                    <span class="compliance-pct" data-target="${house.pct}" style="font-size: 11px; font-weight: 700; color: ${house.color};">0%</span>
                                </div>
                                <div style="height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: visible;">
                                    <div class="compliance-bar" data-target="${house.pct}" style="height: 100%; width: 0%; background: linear-gradient(90deg, ${house.color}, ${house.color}dd); border-radius: 2px; box-shadow: 0 0 8px ${house.color}40;"></div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Gaps Widget -->
                <div class="widget-gaps glass" data-widget="gaps" style="
                    border-radius: 10px;
                    padding: 10px 14px;
                    opacity: 0;
                    transform: translateY(20px);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.muted}; text-transform: uppercase;">Gaps & Missing</div>
                        <div style="font-size: 7px; padding: 2px 6px; background: rgba(220, 38, 38, 0.15); color: #DC2626; border-radius: 4px;">Action Needed</div>
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 5px;">
                        ${[
                            { label: 'Overdue RRs', count: 2, color: '#DC2626', detail: 'Emma, Liam' },
                            { label: 'Missing Aftercare', count: 1, color: '#F59E0B', detail: 'Day 45+' },
                            { label: 'Pending Signatures', count: 3, color: '#7C3AED', detail: 'Awaiting' }
                        ].map(gap => `
                            <div class="gap-row" style="
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                padding: 5px 10px;
                                background: ${gap.color}08;
                                border-radius: 6px;
                                border-left: 3px solid ${gap.color};
                                opacity: 0;
                                transform: translateX(-10px);
                            ">
                                <div>
                                    <div style="font-size: 10px; color: ${this.colors.text};">${gap.label}</div>
                                    <div style="font-size: 7px; color: ${gap.color}; opacity: 0.8;">${gap.detail}</div>
                                </div>
                                <span class="gap-count" data-target="${gap.count}" style="
                                    background: ${gap.color}25;
                                    color: ${gap.color};
                                    padding: 4px 10px;
                                    border-radius: 8px;
                                    font-size: 11px;
                                    font-weight: 700;
                                ">0</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Spotlight Widget - Resilience Recovery -->
                <div class="widget-spotlight glass" data-widget="spotlight" style="
                    border-radius: 10px;
                    padding: 10px 14px;
                    opacity: 0;
                    transform: translateY(20px) rotateY(-5deg);
                    background: linear-gradient(135deg, rgba(13, 148, 136, 0.12), rgba(8, 145, 178, 0.06));
                    border: 1px solid rgba(13, 148, 136, 0.25);
                    box-shadow: 0 4px 20px rgba(13, 148, 136, 0.1);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.primary}; text-transform: uppercase;">★ Program Spotlight</div>
                        <div style="font-size: 7px; padding: 2px 6px; background: rgba(16, 185, 129, 0.2); color: #10B981; border-radius: 4px;">Featured</div>
                    </div>
                    <div class="spotlight-content" style="opacity: 0; transform: translateY(8px);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary}); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px;">⚕</div>
                            <div>
                                <div style="font-size: 12px; font-weight: 700; color: ${this.colors.text};">Resilience Recovery</div>
                                <div style="font-size: 8px; color: ${this.colors.muted};">Malibu, CA • Ages 18-28</div>
                            </div>
                        </div>
                        <div style="font-size: 8px; color: ${this.colors.muted}; line-height: 1.4; margin-bottom: 8px;">Young adult PHP/IOP specializing in dual diagnosis, trauma recovery, and life skills development.</div>
                        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
                            <span class="tag-pill" style="font-size: 7px; padding: 3px 6px; background: rgba(13, 148, 136, 0.2); color: ${this.colors.primary}; border-radius: 4px;">PHP/IOP</span>
                            <span class="tag-pill" style="font-size: 7px; padding: 3px 6px; background: rgba(124, 58, 237, 0.2); color: ${this.colors.purple}; border-radius: 4px;">Dual Dx</span>
                            <span class="tag-pill" style="font-size: 7px; padding: 3px 6px; background: rgba(16, 185, 129, 0.2); color: ${this.colors.accent}; border-radius: 4px;">Trauma</span>
                            <span class="tag-pill" style="font-size: 7px; padding: 3px 6px; background: rgba(251, 191, 36, 0.2); color: #FBBF24; border-radius: 4px;">Life Skills</span>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `;
        stage.appendChild(dashboard);
        
        // =============================================
        // CAPTION ELEMENT - For widget tour
        // =============================================
        const caption = document.createElement('div');
        caption.className = 'dashboard-caption';
        caption.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            max-width: 500px;
            opacity: 0;
            z-index: 20;
            padding: 16px 24px;
            background: rgba(15, 23, 42, 0.9);
            backdrop-filter: blur(10px);
            border-radius: 12px;
            border: 1px solid rgba(13, 148, 136, 0.3);
        `;
        caption.innerHTML = `
            <h3 class="caption-title" style="font-size: 1rem; font-weight: 600; color: ${this.colors.text}; margin: 0;"></h3>
            <p class="caption-text" style="font-size: 13px; color: ${this.colors.muted}; margin: 8px 0 0 0; line-height: 1.5;"></p>
        `;
        stage.appendChild(caption);
        
        const captionTitle = caption.querySelector('.caption-title');
        const captionText = caption.querySelector('.caption-text');
        
        // =============================================
        // HELPER: Add Widget Beat to Timeline
        // =============================================
        const addWidgetBeat = (tl, widgetKey, offset) => {
            const config = widgetConfig[widgetKey];
            const widget = dashboard.querySelector(config.selector);
            const allWidgets = dashboard.querySelectorAll('[data-widget]');
            
            // Add timeline label for VO sync
            tl.addLabel(`tour_${widgetKey}`, offset);
            
            // Dim all other widgets with elegant fade
            tl.to(allWidgets, { 
                opacity: 0.2, 
                scale: 0.97,
                filter: 'blur(2px)',
                duration: 0.5,
                ease: 'power2.inOut'
            }, offset);
            
            // Highlight this widget with dramatic effect (scale reduced to fit container better)
            tl.to(widget, { 
                opacity: 1, 
                scale: 1.08, 
                filter: 'blur(0px)',
                boxShadow: `0 0 40px ${this.colors.primary}60, 0 0 80px ${this.colors.primary}30, inset 0 0 20px rgba(255,255,255,0.05)`,
                border: `1px solid ${this.colors.primary}50`,
                duration: 0.6,
                ease: 'power2.out'
            }, offset);
            
            // POLISH: Pulsing outer glow ring effect
            const pulseGlow = gsap.timeline({ repeat: 2 });
            pulseGlow.to(widget, {
                boxShadow: `0 0 60px ${this.colors.primary}80, 0 0 100px ${this.colors.primary}50, inset 0 0 25px rgba(255,255,255,0.08)`,
                duration: 0.3,
                ease: 'power2.out'
            });
            pulseGlow.to(widget, {
                boxShadow: `0 0 40px ${this.colors.primary}60, 0 0 80px ${this.colors.primary}30, inset 0 0 20px rgba(255,255,255,0.05)`,
                duration: 0.4,
                ease: 'power2.in'
            });
            tl.add(pulseGlow, offset + 0.6);
            
            // POLISH: Subtle parallax depth - widget lifts up slightly
            tl.to(widget, {
                y: -3,
                duration: 0.4,
                ease: 'power2.out'
            }, offset + 0.3);
            tl.to(widget, {
                y: 0,
                duration: 0.6,
                ease: 'power2.inOut'
            }, offset + 1.5);
            
            // Animate internal elements for extra polish
            const innerElements = widget.querySelectorAll('.flight-zone, .pipeline-row, .compliance-row, .gap-row, .tag-pill');
            if (innerElements.length > 0) {
                tl.to(innerElements, {
                    scale: 1.02,
                    duration: 0.3,
                    stagger: 0.05,
                    ease: 'power2.out'
                }, offset + 0.2);
            }
            
            // Update and show caption with slide-up
            tl.call(() => {
                captionTitle.textContent = config.title;
                captionText.textContent = config.caption;
            }, null, offset);
            
            tl.to(caption, { 
                opacity: 1, 
                y: 0, 
                scale: 1,
                duration: 0.5,
                ease: 'back.out(1.5)'
            }, offset + 0.3);
        };
        
        // =============================================
        // GSAP TIMELINE - CINEMATIC BUILD
        // =============================================
        const tl = gsap.timeline();
        
        // ---- PHASE 1: Dramatic Entrance ----
        
        // Label fades in with slight scale
        tl.fromTo(label, 
            { opacity: 0, y: -20, scale: 0.95 },
            { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'power3.out' }
        );
        
        // Dashboard rises into view with cinematic 3D effect
        tl.to(dashboard, {
            opacity: 1,
            rotateX: 0,
            y: 0,
            scale: 1,
            duration: 2,
            ease: this.ease.lux
        }, '-=0.8');
        
        // Header bar fades in
        const dashHeader = dashboard.querySelector('.dash-header');
        if (dashHeader) {
            tl.to(dashHeader, { opacity: 1, duration: 0.6, ease: 'power2.out' }, '-=1.5');
            // Header buttons pop in
            const hdrBtns = dashboard.querySelectorAll('.hdr-btn');
            tl.to(hdrBtns, { opacity: 1, duration: 0.3, stagger: 0.1, ease: 'back.out(1.7)' }, '-=0.3');
        }
        
        // Quick actions bar slides in
        const quickBar = dashboard.querySelector('.quick-bar');
        if (quickBar) {
            tl.to(quickBar, { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }, '-=0.8');
            // Action buttons pop in with bounce
            const qBtns = dashboard.querySelectorAll('.qbtn');
            tl.to(qBtns, { opacity: 1, scale: 1, duration: 0.4, stagger: 0.08, ease: 'back.out(2)' }, '-=0.4');
        }
        
        // Journey widget appears with glow
        tl.to(dashboard.querySelector('.widget-journey'), { 
            opacity: 1, 
            y: 0, 
            boxShadow: '0 0 15px rgba(13, 148, 136, 0.15)',
            duration: 0.8 
        }, '-=0.3');
        
        // Journey stages pop in
        const stages = dashboard.querySelectorAll('.journey-stage');
        tl.to(stages, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.08, ease: this.ease.bounce }, '-=0.5');
        
        // Animate stage counts
        const stageCounts = [4, 3, 5, 6, 2, 8];
        stages.forEach((s, i) => {
            const numEl = s.querySelector('div');
            tl.to({ val: 0 }, {
                val: stageCounts[i],
                duration: 0.8,
                ease: 'power2.out',
                onUpdate: function() { numEl.textContent = Math.round(this.targets()[0].val); }
            }, '-=0.6');
        });
        
        // Flight plan widget
        tl.to(dashboard.querySelector('.widget-flight'), { opacity: 1, y: 0, duration: 0.8 }, '-=1.2');
        
        // Flight zones slide in
        const zones = dashboard.querySelectorAll('.flight-zone');
        tl.to(zones, { opacity: 1, x: 0, duration: 0.5, stagger: 0.08 }, '-=0.5');
        
        // Animate zone counts
        zones.forEach(z => {
            const countEl = z.querySelector('.zone-count');
            const target = parseInt(countEl.dataset.target);
            tl.to({ val: 0 }, {
                val: target,
                duration: 0.6,
                onUpdate: function() { countEl.textContent = Math.round(this.targets()[0].val); }
            }, '-=0.5');
        });
        
        // Pipeline widget (NEW)
        tl.to(dashboard.querySelector('.widget-pipeline'), { opacity: 1, y: 0, duration: 0.8 }, '-=1');
        const pipelineRows = dashboard.querySelectorAll('.pipeline-row');
        tl.to(pipelineRows, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }, '-=0.5');
        
        // Animate pipeline values
        dashboard.querySelectorAll('.pipeline-val').forEach(v => {
            const target = parseInt(v.dataset.target);
            const prefix = v.textContent.charAt(0);
            tl.to({ val: 0 }, {
                val: target,
                duration: 0.6,
                onUpdate: function() { v.textContent = prefix + Math.round(this.targets()[0].val); }
            }, '-=0.5');
        });
        
        // Compliance widget (NEW)
        tl.to(dashboard.querySelector('.widget-compliance'), { opacity: 1, y: 0, duration: 0.8 }, '-=0.8');
        const complianceRows = dashboard.querySelectorAll('.compliance-row');
        tl.to(complianceRows, { opacity: 1, scale: 1, duration: 0.5, stagger: 0.1 }, '-=0.5');
        
        // Animate compliance bars and percentages
        dashboard.querySelectorAll('.compliance-bar').forEach(bar => {
            const target = parseInt(bar.dataset.target);
            tl.to(bar, { width: `${target}%`, duration: 0.8, ease: 'power2.out' }, '-=0.4');
        });
        dashboard.querySelectorAll('.compliance-pct').forEach(pct => {
            const target = parseInt(pct.dataset.target);
            tl.to({ val: 0 }, {
                val: target,
                duration: 0.8,
                onUpdate: function() { pct.textContent = Math.round(this.targets()[0].val) + '%'; }
            }, '-=0.8');
        });
        
        // Gaps widget (NEW)
        tl.to(dashboard.querySelector('.widget-gaps'), { opacity: 1, y: 0, duration: 0.8 }, '-=0.6');
        const gapRows = dashboard.querySelectorAll('.gap-row');
        tl.to(gapRows, { opacity: 1, x: 0, duration: 0.5, stagger: 0.1 }, '-=0.5');
        
        // Animate gap counts
        dashboard.querySelectorAll('.gap-count').forEach(g => {
            const target = parseInt(g.dataset.target);
            tl.to({ val: 0 }, {
                val: target,
                duration: 0.5,
                onUpdate: function() { g.textContent = Math.round(this.targets()[0].val); }
            }, '-=0.4');
        });
        
        // Spotlight widget with dramatic 3D reveal
        const spotlightWidget = dashboard.querySelector('.widget-spotlight');
        tl.to(spotlightWidget, { 
            opacity: 1, 
            y: 0, 
            rotateY: 0,
            duration: 1,
            ease: 'power3.out'
        }, '-=0.6');
        
        // Spotlight content fades in with stagger
        tl.to(dashboard.querySelector('.spotlight-content'), { 
            opacity: 1, 
            y: 0, 
            duration: 0.6,
            ease: 'power2.out'
        }, '-=0.4');
        
        // Tags pop in one by one
        const tagPills = dashboard.querySelectorAll('.tag-pill');
        tl.fromTo(tagPills, 
            { opacity: 0, scale: 0.5, y: 5 },
            { opacity: 1, scale: 1, y: 0, duration: 0.3, stagger: 0.08, ease: 'back.out(2)' },
            '-=0.2'
        );
        
        // Brief hold to let user see full dashboard
        tl.addLabel('dashboard_complete');
        tl.to({}, { duration: 2 });
        
        // ---- PHASE 2: Widget Tour ----
        tl.addLabel('tour_start');
        
        // Set caption initial state
        tl.set(caption, { opacity: 0, y: 20 });
        
        // Tour each widget (2 seconds per widget)
        const tourOrder = ['journey', 'flightPlan', 'pipeline', 'compliance', 'gaps', 'spotlight'];
        let tourOffset = tl.duration();
        
        tourOrder.forEach((widgetKey, i) => {
            addWidgetBeat(tl, widgetKey, tourOffset + (i * 2.2));
        });
        
        // After tour: reset all widgets to normal
        const tourEndTime = tourOffset + (tourOrder.length * 2.2);
        tl.addLabel('tour_end', tourEndTime);
        
        tl.to(caption, { opacity: 0, y: 10, duration: 0.4 }, tourEndTime);
        
        const allWidgets = dashboard.querySelectorAll('[data-widget]');
        tl.to(allWidgets, { 
            opacity: 1, 
            scale: 1, 
            filter: 'blur(0px)',
            boxShadow: 'none',
            duration: 0.6,
            ease: 'power2.out'
        }, tourEndTime + 0.2);
        
        // Final hold
        tl.to({}, { duration: 1.5 });
        
        // Bridge: Dashboard scales down and fades as we transition to Program Database
        tl.to(dashboard, { 
            scale: 0.85, 
            opacity: 0.6,
            duration: 0.6,
            ease: 'power2.in'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Transition out with elegant blur
        tl.to([label, dashboard, caption], { 
            opacity: 0, 
            y: -30, 
            filter: 'blur(12px)', 
            duration: 0.8,
            ease: 'power3.in'
        });
        tl.call(() => { 
            label.remove(); 
            dashboard.remove(); 
            caption.remove(); 
        });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE 2.5: PROGRAM DATABASE
    // Cinematic showcase of the clinical library
    // "I had no idea it could do all that"
    // =========================================
    async sceneProgramDatabase(stage) {
        console.log('[Intro] Scene 2.5: Program Database');
        
        // Start subtitles for Scene 3 (Program Database)
        this.playSubtitlesForScene('scene3');
        
        this.mode = 'ambient';
        
        // Program data for the showcase
        const programs = [
            { 
                name: 'Resilience Recovery', 
                loc: 'PHP/IOP', 
                locColor: '#DC2626',
                location: 'Malibu, CA', 
                ages: '18-28', 
                beds: 4,
                specialties: ['Dual Dx', 'Trauma', 'DBT', 'Life Skills'],
                description: 'Young adult PHP/IOP specializing in dual diagnosis, trauma recovery, and life skills development.',
                featured: true,
                completion: 87
            },
            { 
                name: 'Summit Adolescent', 
                loc: 'RTC', 
                locColor: '#7C3AED',
                location: 'Park City, UT', 
                ages: '13-17', 
                beds: 2,
                specialties: ['Anxiety', 'Depression', 'Family Therapy'],
                description: 'Mountain-based residential treatment with comprehensive family involvement.',
                featured: false,
                completion: 92
            },
            { 
                name: 'Coastal Healing', 
                loc: 'Wilderness', 
                locColor: '#059669',
                location: 'San Diego, CA', 
                ages: '14-18', 
                beds: 6,
                specialties: ['Trauma', 'Adventure Therapy'],
                description: 'Outdoor therapeutic program combining nature immersion with clinical care.',
                featured: false,
                completion: 85
            },
            { 
                name: 'Mountain View', 
                loc: 'RTC', 
                locColor: '#7C3AED',
                location: 'Boulder, CO', 
                ages: '12-17', 
                beds: 0,
                specialties: ['Depression', 'Academic Support'],
                description: 'Academic-focused residential program with integrated mental health support.',
                featured: false,
                completion: 89
            },
            { 
                name: 'Serenity Springs', 
                loc: 'PHP', 
                locColor: '#DC2626',
                location: 'Scottsdale, AZ', 
                ages: '16-25', 
                beds: 8,
                specialties: ['Addiction', 'Mindfulness'],
                description: 'Holistic partial hospitalization with mindfulness-based interventions.',
                featured: false,
                completion: 91
            },
            { 
                name: 'Pacific Shores', 
                loc: 'IOP', 
                locColor: '#EA580C',
                location: 'Portland, OR', 
                ages: '18+', 
                beds: 12,
                specialties: ['Mood Disorders', 'CBT'],
                description: 'Flexible intensive outpatient with evidence-based cognitive behavioral therapy.',
                featured: false,
                completion: 88
            }
        ];
        
        const tl = gsap.timeline();
        
        // =============================================
        // ACT I: THE HOOK + REVEAL (0-12s)
        // =============================================
        
        // Emotional hook - the problem
        const hookText = document.createElement('div');
        hookText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            opacity: 0;
            z-index: 20;
        `;
        hookText.innerHTML = `
            <p style="
                font-size: 1.4rem;
                font-weight: 300;
                color: ${this.colors.muted};
                font-style: italic;
                max-width: 500px;
                line-height: 1.6;
            ">"Where do I find the right program<br>for this client?"</p>
        `;
        stage.appendChild(hookText);
        
        // Show the problem
        tl.to(hookText, { opacity: 1, duration: 1, ease: 'power2.out' });
        tl.to({}, { duration: 1.5 }); // Let it sink in
        tl.to(hookText, { opacity: 0, y: -20, duration: 0.6 });
        tl.call(() => hookText.remove());
        
        // Boot sequence - the solution
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            opacity: 0;
            z-index: 20;
        `;
        label.innerHTML = `
            <div class="boot-text" style="
                font-family: 'JetBrains Mono', monospace;
                font-size: 13px;
                letter-spacing: 3px;
                color: ${this.colors.primary};
                text-transform: uppercase;
                margin-bottom: 16px;
                text-shadow: 0 0 20px ${this.colors.primary}40;
            ">ACCESSING CLINICAL LIBRARY</div>
            <div class="boot-counter" style="
                font-family: 'JetBrains Mono', monospace;
                font-size: 28px;
                font-weight: 600;
                color: ${this.colors.text};
            "><span class="count">0</span></div>
            <div style="
                font-size: 12px;
                color: ${this.colors.muted};
                margin-top: 8px;
                letter-spacing: 1px;
            ">verified treatment programs</div>
        `;
        stage.appendChild(label);
        
        // Boot sequence with drama
        tl.to(label, { opacity: 1, duration: 0.6, ease: 'power2.out' });
        tl.call(() => this.playSfx('whoosh'));
        
        // Animate counter - 529 total programs with acceleration
        const counter = label.querySelector('.count');
        tl.to({ val: 0 }, {
            val: 529,
            duration: 2.5,
            ease: 'power4.out',
            onUpdate: function() {
                counter.textContent = Math.floor(this.targets()[0].val);
            }
        });
        
        // Pause for impact
        tl.to({}, { duration: 0.8 });
        
        // Fade out boot text with scale
        tl.to(label, { 
            opacity: 0, 
            scale: 1.15, 
            filter: 'blur(10px)',
            duration: 0.7 
        });
        tl.call(() => label.remove());
        
        // Main scene label
        const sceneLabel = document.createElement('div');
        sceneLabel.style.cssText = `
            position: absolute;
            top: 45px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
            z-index: 10;
        `;
        sceneLabel.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 8px;">Your Clinical Library</div>
            <h2 style="font-size: 2.2rem; font-weight: 600; color: ${this.colors.text}; margin: 0;">Program Database</h2>
            <p style="font-size: 13px; color: ${this.colors.muted}; margin-top: 6px;">Search, filter, compare, and add to aftercare plans</p>
        `;
        stage.appendChild(sceneLabel);
        
        tl.to(sceneLabel, { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' });
        
        // =============================================
        // PROGRAM EXPLORER UI
        // =============================================
        
        const explorer = document.createElement('div');
        explorer.className = 'glass';
        explorer.style.cssText = `
            width: 1100px;
            max-width: 95vw;
            height: 580px;
            border-radius: 20px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            opacity: 0;
            transform: scale(0.95);
        `;
        
        explorer.innerHTML = `
            <!-- Search Header -->
            <div class="explorer-header" style="
                height: 60px;
                background: rgba(0,0,0,0.3);
                border-bottom: 1px solid rgba(255,255,255,0.05);
                display: flex;
                align-items: center;
                padding: 0 20px;
                gap: 16px;
                transform: translateY(-100%);
            ">
                <div class="search-box" style="
                    flex: 1;
                    max-width: 400px;
                    height: 38px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    padding: 0 12px;
                    gap: 10px;
                ">
                    <span style="color: ${this.colors.muted}; font-size: 14px;">≡🔍</span>
                    <span class="search-text" style="color: ${this.colors.muted}; font-size: 14px;">Search programs...</span>
                    <span class="cursor" style="
                        width: 2px;
                        height: 18px;
                        background: ${this.colors.primary};
                        opacity: 0;
                        animation: blink 1s infinite;
                    "></span>
                </div>
                <div class="results-count" style="
                    font-size: 13px;
                    color: ${this.colors.muted};
                    opacity: 0;
                "><span class="num">529</span> programs</div>
                <div class="view-toggles" style="
                    display: flex;
                    gap: 4px;
                    margin-left: auto;
                    opacity: 0;
                ">
                    <button style="
                        padding: 6px 12px;
                        background: rgba(13, 148, 136, 0.3);
                        border: 1px solid ${this.colors.primary};
                        border-radius: 6px;
                        color: ${this.colors.primary};
                        font-size: 12px;
                        cursor: pointer;
                    ">Grid</button>
                    <button style="
                        padding: 6px 12px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 6px;
                        color: ${this.colors.muted};
                        font-size: 12px;
                        cursor: pointer;
                    ">List</button>
                    <button style="
                        padding: 6px 12px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 6px;
                        color: ${this.colors.muted};
                        font-size: 12px;
                        cursor: pointer;
                    ">Map</button>
                </div>
            </div>
            
            <!-- Semantic Chips Bar -->
            <div class="chips-bar" style="
                height: 44px;
                background: rgba(0,0,0,0.2);
                border-bottom: 1px solid rgba(255,255,255,0.03);
                display: flex;
                align-items: center;
                padding: 0 20px;
                gap: 8px;
                overflow: hidden;
            ">
                <span style="font-size: 11px; color: ${this.colors.muted}; margin-right: 8px;">Active filters:</span>
            </div>
            
            <!-- Main Content -->
            <div class="explorer-body" style="
                flex: 1;
                display: flex;
                overflow: hidden;
            ">
                <!-- Filter Sidebar -->
                <div class="filter-rail" style="
                    width: 220px;
                    background: rgba(0,0,0,0.25);
                    border-right: 1px solid rgba(255,255,255,0.05);
                    padding: 16px;
                    overflow-y: auto;
                    transform: translateX(-100%);
                ">
                    <div style="font-size: 13px; font-weight: 600; color: ${this.colors.text}; margin-bottom: 16px;">Filters</div>
                    
                    <!-- Level of Care -->
                    <div class="filter-section" style="margin-bottom: 20px; opacity: 0;">
                        <div style="font-size: 10px; letter-spacing: 1px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 10px;">Level of Care</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            <div class="filter-chip loc-rtc" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                                transition: all 0.2s;
                            ">RTC</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">PHP</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">IOP</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">Wilderness</div>
                        </div>
                    </div>
                    
                    <!-- Age Range -->
                    <div class="filter-section" style="margin-bottom: 20px; opacity: 0;">
                        <div style="font-size: 10px; letter-spacing: 1px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 10px;">Age Range</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            <div class="filter-chip age-13-17" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">13-17</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">18-25</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">25+</div>
                        </div>
                    </div>
                    
                    <!-- Location -->
                    <div class="filter-section" style="margin-bottom: 20px; opacity: 0;">
                        <div style="font-size: 10px; letter-spacing: 1px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 10px;">Location</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            <div class="filter-chip loc-ca" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">California</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">Utah</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">Arizona</div>
                        </div>
                    </div>
                    
                    <!-- Specialties -->
                    <div class="filter-section" style="opacity: 0;">
                        <div style="font-size: 10px; letter-spacing: 1px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 10px;">Specialties</div>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            <div class="filter-chip spec-trauma" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">Trauma</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">Dual Dx</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">DBT</div>
                            <div class="filter-chip" style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                                cursor: pointer;
                            ">Family</div>
                        </div>
                    </div>
                </div>
                
                <!-- Program Grid -->
                <div class="program-grid" style="
                    flex: 1;
                    padding: 20px;
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 16px;
                    overflow-y: auto;
                ">
                    ${programs.map((p, i) => `
                        <div class="program-card" data-index="${i}" style="
                            background: rgba(255,255,255,0.03);
                            border: 1px solid rgba(255,255,255,0.06);
                            border-radius: 12px;
                            padding: 16px;
                            opacity: 0;
                            transform: translateY(20px);
                            cursor: pointer;
                            transition: all 0.3s;
                        ">
                            <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px;">
                                <div>
                                    <div style="
                                        display: inline-block;
                                        padding: 3px 8px;
                                        background: ${p.locColor}30;
                                        border: 1px solid ${p.locColor};
                                        border-radius: 4px;
                                        font-size: 10px;
                                        font-weight: 600;
                                        color: ${p.locColor};
                                        margin-bottom: 6px;
                                    ">${p.loc}</div>
                                    <div style="font-size: 15px; font-weight: 600; color: ${this.colors.text};">${p.name}</div>
                                </div>
                                <div class="star-icon" style="
                                    font-size: 16px;
                                    opacity: 0.3;
                                    cursor: pointer;
                                ">✨</div>
                            </div>
                            <div style="font-size: 12px; color: ${this.colors.muted}; margin-bottom: 12px;">
                                ≡📍 ${p.location} • Ages ${p.ages}
                            </div>
                            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 12px;">
                                ${p.specialties.slice(0, 3).map(s => `
                                    <span style="
                                        padding: 3px 8px;
                                        background: rgba(13, 148, 136, 0.15);
                                        border-radius: 4px;
                                        font-size: 10px;
                                        color: ${this.colors.primary};
                                    ">${s}</span>
                                `).join('')}
                            </div>
                            <div style="
                                font-size: 11px;
                                color: ${this.colors.muted};
                                margin-bottom: 12px;
                            ">${p.loc} Program</div>
                            <button class="add-btn" style="
                                width: 100%;
                                padding: 10px;
                                background: rgba(13, 148, 136, 0.2);
                                border: 1px solid ${this.colors.primary};
                                border-radius: 8px;
                                color: ${this.colors.primary};
                                font-size: 12px;
                                font-weight: 500;
                                cursor: pointer;
                                transition: all 0.2s;
                            ">Add to Plan</button>
                        </div>
                    `).join('')}
                </div>
                
                <!-- Builder Dock -->
                <div class="builder-dock" style="
                    width: 180px;
                    background: rgba(0,0,0,0.3);
                    border-left: 1px solid rgba(255,255,255,0.05);
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    transform: translateX(100%);
                ">
                    <div style="font-size: 11px; letter-spacing: 1px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 12px;">Aftercare Plan</div>
                    
                    <div class="dock-slot" style="
                        height: 50px;
                        background: rgba(255,255,255,0.02);
                        border: 1px dashed rgba(255,255,255,0.1);
                        border-radius: 8px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        color: ${this.colors.muted};
                    ">
                        <span class="slot-num">1</span>
                        <span class="slot-content" style="display: none;"></span>
                    </div>
                    <div class="dock-slot" style="
                        height: 50px;
                        background: rgba(255,255,255,0.02);
                        border: 1px dashed rgba(255,255,255,0.1);
                        border-radius: 8px;
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        color: ${this.colors.muted};
                    ">
                        <span class="slot-num">2</span>
                    </div>
                    <div class="dock-slot" style="
                        height: 50px;
                        background: rgba(255,255,255,0.02);
                        border: 1px dashed rgba(255,255,255,0.1);
                        border-radius: 8px;
                        margin-bottom: 16px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 11px;
                        color: ${this.colors.muted};
                    ">
                        <span class="slot-num">3</span>
                    </div>
                    
                    <div class="dock-progress" style="margin-bottom: 16px;">
                        <div style="font-size: 11px; color: ${this.colors.muted}; margin-bottom: 6px;">
                            <span class="prog-count">0</span>/3 programs
                        </div>
                        <div style="
                            height: 4px;
                            background: rgba(255,255,255,0.1);
                            border-radius: 2px;
                            overflow: hidden;
                        ">
                            <div class="prog-bar" style="
                                width: 0%;
                                height: 100%;
                                background: ${this.colors.primary};
                                transition: width 0.5s ease;
                            "></div>
                        </div>
                    </div>
                    
                    <button class="open-builder-btn" style="
                        padding: 10px;
                        background: rgba(13, 148, 136, 0.15);
                        border: 1px solid rgba(13, 148, 136, 0.3);
                        border-radius: 8px;
                        color: ${this.colors.muted};
                        font-size: 11px;
                        cursor: pointer;
                        margin-top: auto;
                        opacity: 0.5;
                    ">Open Builder →</button>
                </div>
            </div>
        `;
        
        stage.appendChild(explorer);
        
        // Get references
        const header = explorer.querySelector('.explorer-header');
        const filterRail = explorer.querySelector('.filter-rail');
        const builderDock = explorer.querySelector('.builder-dock');
        const cards = explorer.querySelectorAll('.program-card');
        const filterSections = explorer.querySelectorAll('.filter-section');
        const searchText = explorer.querySelector('.search-text');
        const cursor = explorer.querySelector('.cursor');
        const resultsCount = explorer.querySelector('.results-count');
        const chipsBar = explorer.querySelector('.chips-bar');
        const viewToggles = explorer.querySelector('.view-toggles');
        
        // =============================================
        // INTERFACE ASSEMBLY ANIMATION (More Dramatic)
        // =============================================
        
        // Explorer container appears with perspective
        tl.to(explorer, { 
            opacity: 1, 
            scale: 1, 
            duration: 1, 
            ease: 'back.out(1.2)' 
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Header slides down with bounce
        tl.to(header, { 
            y: 0, 
            duration: 0.6, 
            ease: 'back.out(1.5)' 
        }, '-=0.5');
        
        // Filter rail slides in
        tl.to(filterRail, { 
            x: 0, 
            duration: 0.6, 
            ease: 'power3.out' 
        }, '-=0.4');
        
        // Builder dock slides in from right
        tl.to(builderDock, { 
            x: 0, 
            duration: 0.6, 
            ease: 'power3.out' 
        }, '-=0.5');
        
        // Filter sections reveal with stagger
        tl.to(filterSections, { 
            opacity: 1, 
            y: 0,
            duration: 0.5, 
            stagger: 0.12,
            ease: 'power2.out'
        }, '-=0.3');
        
        // View toggles appear
        tl.to(viewToggles, { opacity: 1, duration: 0.4 });
        
        // Breathing room - let user absorb the interface
        tl.to({}, { duration: 0.8 });
        
        // =============================================
        // ACT II: SMART SEARCH (Slower, More Deliberate)
        // =============================================
        
        // Search box focus glow
        const searchBox = explorer.querySelector('.search-box');
        tl.to(searchBox, {
            boxShadow: `0 0 20px ${this.colors.primary}30, inset 0 0 10px ${this.colors.primary}10`,
            borderColor: this.colors.primary,
            duration: 0.4
        });
        
        // Cursor appears and starts blinking
        tl.to(cursor, { opacity: 1, duration: 0.2 });
        
        // POLISH: Blinking cursor animation
        const cursorBlink = gsap.timeline({ repeat: -1 });
        cursorBlink.to(cursor, { opacity: 0, duration: 0.4 });
        cursorBlink.to(cursor, { opacity: 1, duration: 0.4 });
        
        // Type search query - SLOWER for readability
        const searchQuery = 'trauma adolescent';
        tl.call(() => {
            let i = 0;
            const typeInterval = setInterval(() => {
                if (i < searchQuery.length) {
                    searchText.textContent = searchQuery.substring(0, i + 1);
                    searchText.style.color = this.colors.text;
                    i++;
                } else {
                    clearInterval(typeInterval);
                }
            }, 100); // Slower typing
        });
        
        tl.to({}, { duration: 2.2 }); // Wait for typing to complete
        
        // Stop cursor blink and hide cursor
        tl.call(() => cursorBlink.kill());
        tl.to(cursor, { opacity: 0, duration: 0.2 });
        
        // POLISH: Thinking dots animation while "searching"
        const thinkingDots = document.createElement('span');
        thinkingDots.className = 'thinking-dots';
        thinkingDots.style.cssText = `
            display: inline-block;
            margin-left: 8px;
            color: ${this.colors.primary};
            font-size: 14px;
        `;
        thinkingDots.textContent = '';
        searchText.parentNode.appendChild(thinkingDots);
        
        tl.call(() => {
            let dots = 0;
            const dotsInterval = setInterval(() => {
                dots = (dots + 1) % 4;
                thinkingDots.textContent = '.'.repeat(dots);
            }, 200);
            setTimeout(() => {
                clearInterval(dotsInterval);
                thinkingDots.remove();
            }, 800);
        });
        
        tl.to({}, { duration: 0.8 }); // Wait for "thinking"
        
        // Results count appears with emphasis
        tl.to(resultsCount, { 
            opacity: 1, 
            scale: 1,
            duration: 0.4,
            ease: 'back.out(2)'
        });
        
        const numEl = resultsCount.querySelector('.num');
        // First filter: 529 → 87 (trauma + adolescent search) - dramatic countdown
        tl.to({ val: 529 }, {
            val: 87,
            duration: 1.5,
            ease: 'power3.out',
            onUpdate: function() {
                numEl.textContent = Math.floor(this.targets()[0].val);
            }
        });
        
        // Semantic chips appear
        const chipColors = {
            'Trauma': '#10B981',
            'Ages 13-17': '#0891B2',
            'Residential': '#7C3AED'
        };
        
        const semanticChips = ['Trauma', 'Ages 13-17'];
        semanticChips.forEach((chipText, idx) => {
            const chip = document.createElement('div');
            chip.style.cssText = `
                padding: 5px 12px;
                background: ${chipColors[chipText]}25;
                border: 1px solid ${chipColors[chipText]};
                border-radius: 15px;
                font-size: 11px;
                color: ${chipColors[chipText]};
                display: flex;
                align-items: center;
                gap: 6px;
                opacity: 0;
                transform: translateY(-30px) scale(0.5);
            `;
            chip.innerHTML = `<span>✓</span> ${chipText}`;
            chipsBar.appendChild(chip);
            
            // POLISH: Magnetic snap effect - chip flies in and snaps into place
            tl.to(chip, { 
                opacity: 1,
                y: 5, // Overshoot slightly
                scale: 1.1,
                duration: 0.25,
                ease: 'power3.out'
            }, `-=${idx === 0 ? 0 : 0.15}`);
            // Snap back into final position
            tl.to(chip, {
                y: 0,
                scale: 1,
                duration: 0.2,
                ease: 'back.out(3)'
            });
            tl.call(() => this.playSfx('chime'));
        });
        
        // Cards cascade in - WATERFALL EFFECT
        tl.to(cards, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: {
                each: 0.1,
                from: 'start',
                ease: 'power2.out'
            },
            ease: 'back.out(1.2)'
        });
        
        // Breathing room - appreciate the grid
        tl.to({}, { duration: 1.2 });
        
        // =============================================
        // ACT III: FILTER CASCADE (More Dramatic)
        // =============================================
        
        // Activate RTC filter with glow
        const rtcChip = filterRail.querySelector('.loc-rtc');
        tl.to(rtcChip, {
            background: 'rgba(124, 58, 237, 0.3)',
            borderColor: '#7C3AED',
            color: '#7C3AED',
            boxShadow: '0 0 15px rgba(124, 58, 237, 0.4)',
            scale: 1.05,
            duration: 0.4,
            ease: 'back.out(2)'
        });
        tl.call(() => this.playSfx('chime'));
        
        // Add RTC to chips bar with sparkle
        const rtcBarChip = document.createElement('div');
        rtcBarChip.style.cssText = `
            padding: 6px 14px;
            background: rgba(124, 58, 237, 0.25);
            border: 1px solid #7C3AED;
            border-radius: 15px;
            font-size: 11px;
            color: #7C3AED;
            display: flex;
            align-items: center;
            gap: 6px;
            opacity: 0;
            transform: scale(0.5) rotate(-10deg);
            box-shadow: 0 0 10px rgba(124, 58, 237, 0.3);
        `;
        rtcBarChip.innerHTML = `<span style="font-size: 10px;">✓</span> RTC`;
        chipsBar.appendChild(rtcBarChip);
        
        tl.to(rtcBarChip, { 
            opacity: 1, 
            scale: 1,
            rotation: 0,
            duration: 0.5, 
            ease: 'elastic.out(1.2, 0.5)' 
        });
        
        // Update counter with emphasis: 87 → 31
        tl.to({ val: 87 }, {
            val: 31,
            duration: 1,
            ease: 'power3.out',
            onUpdate: function() {
                numEl.textContent = Math.floor(this.targets()[0].val);
            }
        });
        
        // Cards reorganize - non-matching fade with physics feel
        tl.to([cards[0], cards[4], cards[5]], {
            opacity: 0.25,
            scale: 0.92,
            filter: 'grayscale(50%)',
            duration: 0.6,
            ease: 'power2.out'
        }, '-=0.5');
        
        // Pause to show the filtering effect
        tl.to({}, { duration: 0.8 });
        
        // =============================================
        // ACT IV: CARD SHOWCASE (The Deep Dive)
        // =============================================
        
        // Highlight featured card (Resilience Recovery - index 0)
        const featuredCard = cards[0];
        
        // First restore it with drama
        tl.to(featuredCard, {
            opacity: 1,
            scale: 1,
            filter: 'grayscale(0%)',
            duration: 0.4,
            ease: 'power2.out'
        });
        
        // Add glowing aura
        tl.to(featuredCard, {
            boxShadow: `
                0 0 30px ${this.colors.primary}50, 
                0 0 60px ${this.colors.primary}30,
                0 20px 40px rgba(0,0,0,0.3)
            `,
            borderColor: this.colors.primary,
            duration: 0.6,
            ease: 'power2.out'
        });
        
        // Dim other cards significantly
        tl.to([cards[1], cards[2], cards[3], cards[4], cards[5]], {
            opacity: 0.15,
            filter: 'blur(3px)',
            scale: 0.9,
            duration: 0.6,
            ease: 'power2.out'
        }, '-=0.4');
        
        // Expand featured card with 3D effect
        tl.to(featuredCard, {
            scale: 1.2,
            zIndex: 100,
            rotationY: 3,
            rotationX: -2,
            duration: 0.8,
            ease: 'power3.out'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Hold for appreciation
        tl.to({}, { duration: 1.5 });
        
        // Pulse the Add to Plan button with urgency
        const addBtn = featuredCard.querySelector('.add-btn');
        tl.to(addBtn, {
            background: 'rgba(13, 148, 136, 0.5)',
            boxShadow: `0 0 25px ${this.colors.primary}70, 0 0 50px ${this.colors.primary}40`,
            scale: 1.05,
            duration: 0.5,
            repeat: 2,
            yoyo: true,
            ease: 'power2.inOut'
        });
        
        // =============================================
        // ACT V: ADD TO PLAN (The Payoff)
        // =============================================
        
        // Click animation on button - satisfying press
        tl.to(addBtn, {
            scale: 0.92,
            boxShadow: 'none',
            duration: 0.12,
            ease: 'power2.in'
        });
        
        // Button activates
        tl.to(addBtn, {
            scale: 1.02,
            background: this.colors.primary,
            color: 'white',
            boxShadow: `0 0 30px ${this.colors.primary}80`,
            duration: 0.25,
            ease: 'back.out(2)'
        });
        tl.call(() => this.playSfx('chime'));
        
        // Create flying thumbnail with glow trail
        const cardRect = featuredCard.getBoundingClientRect();
        const dockSlot = builderDock.querySelector('.dock-slot');
        const slotRect = dockSlot.getBoundingClientRect();
        
        const thumbnail = document.createElement('div');
        thumbnail.style.cssText = `
            position: fixed;
            left: ${cardRect.left}px;
            top: ${cardRect.top}px;
            width: ${cardRect.width}px;
            height: ${cardRect.height}px;
            background: linear-gradient(135deg, ${this.colors.primary}40, ${this.colors.primary}20);
            border: 2px solid ${this.colors.primary};
            border-radius: 12px;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            color: ${this.colors.text};
            font-weight: 600;
            box-shadow: 0 0 40px ${this.colors.primary}60, 0 10px 30px rgba(0,0,0,0.3);
        `;
        thumbnail.textContent = '✓ Resilience Recovery';
        document.body.appendChild(thumbnail);
        
        // Fly to dock with arc motion
        tl.to(thumbnail, {
            left: slotRect.left,
            top: slotRect.top,
            width: slotRect.width,
            height: slotRect.height,
            rotation: 360,
            duration: 0.8,
            ease: 'power3.inOut'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Update dock slot
        tl.call(() => {
            thumbnail.remove();
            dockSlot.style.background = 'rgba(13, 148, 136, 0.2)';
            dockSlot.style.border = `1px solid ${this.colors.primary}`;
            dockSlot.innerHTML = `
                <span style="font-size: 10px; color: ${this.colors.text};">✓ Resilience</span>
            `;
            
            // Update progress
            builderDock.querySelector('.prog-count').textContent = '1';
            builderDock.querySelector('.prog-bar').style.width = '33%';
            builderDock.querySelector('.open-builder-btn').style.opacity = '1';
        });
        
        // Success checkmark
        const checkmark = document.createElement('div');
        checkmark.style.cssText = `
            position: fixed;
            left: ${slotRect.left + slotRect.width/2 - 20}px;
            top: ${slotRect.top + slotRect.height/2 - 20}px;
            width: 40px;
            height: 40px;
            background: ${this.colors.primary};
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            color: white;
            z-index: 1001;
            opacity: 0;
            transform: scale(0);
        `;
        checkmark.textContent = '✓';
        document.body.appendChild(checkmark);
        
        tl.to(checkmark, {
            opacity: 1,
            scale: 1,
            duration: 0.3,
            ease: 'back.out(2)'
        });
        tl.to(checkmark, {
            opacity: 0,
            scale: 0.5,
            duration: 0.3,
            delay: 0.5
        });
        tl.call(() => checkmark.remove());
        
        // Toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            padding: 12px 24px;
            background: rgba(16, 185, 129, 0.9);
            border-radius: 8px;
            color: white;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            opacity: 0;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        `;
        toast.textContent = '✓ Resilience Recovery added to Aftercare Plan';
        document.body.appendChild(toast);
        
        tl.to(toast, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'power2.out'
        });
        
        // Confetti burst
        tl.call(() => this.fireConfetti(this.canvas));
        
        tl.to(toast, {
            opacity: 0,
            y: -20,
            duration: 0.3,
            delay: 1.5
        });
        tl.call(() => toast.remove());
        
        // Reset card
        tl.to(featuredCard, {
            scale: 1,
            boxShadow: 'none',
            duration: 0.4
        }, '-=1');
        
        tl.to([cards[1], cards[2], cards[3], cards[4], cards[5]], {
            opacity: 1,
            filter: 'blur(0px)',
            scale: 1,
            duration: 0.4
        }, '-=0.3');
        
        // =============================================
        // ACT VI: TRANSITION OUT - Bridge to Map
        // =============================================
        
        // Hold for a moment
        tl.to({}, { duration: 0.8 });
        
        // Bridge effect: Cards scatter like they're becoming map pins
        tl.to(cards, {
            scale: 0.3,
            opacity: 0.7,
            y: () => (Math.random() - 0.5) * 200,
            x: () => (Math.random() - 0.5) * 300,
            rotation: () => (Math.random() - 0.5) * 30,
            duration: 0.8,
            stagger: 0.05,
            ease: 'power2.in'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Fade out with blur
        tl.to([explorer, sceneLabel], {
            opacity: 0,
            filter: 'blur(15px)',
            duration: 0.6,
            ease: 'power3.in'
        }, '-=0.4');
        
        tl.call(() => {
            explorer.remove();
            sceneLabel.remove();
        });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE 3: THE RIVER (Client Journey)
    // Clients flow through treatment like a river
    // =========================================
    async sceneTheRiver(stage) {
        console.log('[Intro] Scene 3: The River');
        
        this.mode = 'river';
        
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
        `;
        label.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase;">Track Every Client</div>
            <h2 style="font-size: 2rem; font-weight: 600; color: ${this.colors.text}; margin-top: 8px;">The Journey</h2>
        `;
        stage.appendChild(label);
        
        // River visualization
        const river = document.createElement('div');
        river.style.cssText = `
            display: flex;
            align-items: center;
            gap: 0;
            opacity: 0;
        `;
        
        // Clinical color progression - teal to green
        const stagesData = [
            { label: 'Week 1', count: 4, color: '#0D9488' },     // Teal
            { label: 'Day 14-16', count: 3, color: '#0891B2' },  // Cyan
            { label: 'Day 30', count: 5, color: '#06B6D4' },     // Light cyan
            { label: '45+ Days', count: 6, color: '#14B8A6' },   // Teal-green
            { label: 'Discharge', count: 2, color: '#7C3AED' },  // Purple for transition
            { label: 'Alumni', count: 8, color: '#10B981' }      // Green for success
        ];
        
        river.innerHTML = stagesData.map((s, i) => `
            <div class="river-stage" style="
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
                opacity: 0;
                transform: scale(0.5);
            ">
                ${i > 0 ? `
                    <div class="river-flow" style="
                        position: absolute;
                        right: 100%;
                        top: 50%;
                        width: 50px;
                        height: 6px;
                        margin-top: -3px;
                        background: linear-gradient(90deg, ${stagesData[i-1].color}60, ${s.color}60);
                        border-radius: 3px;
                        transform-origin: right;
                        transform: scaleX(0);
                        overflow: visible;
                    ">
                        <div class="flow-particle" style="
                            width: 20px;
                            height: 100%;
                            background: linear-gradient(90deg, transparent, white, transparent);
                            animation: flow 1.5s linear infinite;
                            opacity: 0;
                        "></div>
                    </div>
                ` : ''}
                
                <div class="stage-orb" style="
                    width: 90px;
                    height: 90px;
                    border-radius: 50%;
                    background: radial-gradient(circle at 30% 30%, ${s.color}40, ${s.color}10);
                    border: 2px solid ${s.color};
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    box-shadow: 0 0 30px ${s.color}30;
                ">
                    <div class="orb-count" style="font-size: 2rem; font-weight: 700; color: ${s.color};">0</div>
                    
                    <!-- Pulse ring -->
                    <div class="pulse" style="
                        position: absolute;
                        inset: -8px;
                        border-radius: 50%;
                        border: 2px solid ${s.color};
                        opacity: 0;
                    "></div>
                </div>
                
                <div style="margin-top: 14px; font-size: 12px; color: ${this.colors.muted};">${s.label}</div>
            </div>
        `).join('');
        
        // Add flow animation style
        const flowStyle = document.createElement('style');
        flowStyle.textContent = `@keyframes flow { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`;
        river.appendChild(flowStyle);
        
        stage.appendChild(river);
        
        // Hint
        const hint = document.createElement('p');
        hint.style.cssText = `
            position: absolute;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 14px;
            color: ${this.colors.muted};
            opacity: 0;
        `;
        hint.textContent = 'Click any stage to filter your tasks';
        stage.appendChild(hint);
        
        const tl = gsap.timeline();
        
        // Label
        tl.to(label, { opacity: 1, duration: 1 });
        
        // River container
        tl.to(river, { opacity: 1, duration: 0.5 });
        
        // Stages appear
        const riverStages = river.querySelectorAll('.river-stage');
        tl.to(riverStages, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.15, ease: this.ease.bounce });
        
        // Flows connect
        const flows = river.querySelectorAll('.river-flow');
        tl.to(flows, { scaleX: 1, duration: 0.5, stagger: 0.1 }, '-=1');
        
        // Flow particles animate
        tl.to(river.querySelectorAll('.flow-particle'), { opacity: 0.8, duration: 0.3 }, '-=0.5');
        
        // Animate counts
        riverStages.forEach((s, i) => {
            const countEl = s.querySelector('.orb-count');
            tl.to({ val: 0 }, {
                val: stagesData[i].count,
                duration: 1,
                onUpdate: function() { countEl.textContent = Math.round(this.targets()[0].val); }
            }, '-=0.8');
        });
        
        // Highlight one stage
        const targetStage = riverStages[2];
        const targetOrb = targetStage.querySelector('.stage-orb');
        const targetPulse = targetStage.querySelector('.pulse');
        
        tl.to({}, { duration: 0.5 });
        
        tl.to(targetOrb, { scale: 1.1, boxShadow: '0 0 50px rgba(139, 92, 246, 0.6)', duration: 0.5 });
        tl.to(targetPulse, { opacity: 0.6, scale: 1.3, duration: 0.4 });
        tl.to(targetPulse, { opacity: 0, scale: 1.5, duration: 0.4 });
        
        // Hint
        tl.to(hint, { opacity: 1, duration: 0.6 }, '-=0.5');
        
        // Reset
        tl.to(targetOrb, { scale: 1, boxShadow: '0 0 30px rgba(139, 92, 246, 0.3)', duration: 0.4 }, '+=0.5');
        
        // Hold
        tl.to({}, { duration: 2 });
        
        // Transition
        tl.to([label, river, hint], { opacity: 0, y: -30, duration: 1 });
        tl.call(() => { label.remove(); river.remove(); hint.remove(); });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE 4: GRAVITY (Flight Plan)
    // Tasks fall into priority zones like leaves
    // =========================================
    async sceneGravity(stage) {
        console.log('[Intro] Scene 4: Gravity');
        
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
        `;
        label.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase;">Prioritize Your Day</div>
            <h2 style="font-size: 2rem; font-weight: 600; color: ${this.colors.text}; margin-top: 8px;">The Flight Plan</h2>
        `;
        stage.appendChild(label);
        
        const tasks = [
            { text: 'RR overdue ΓÇô Mason', zone: 'red' },
            { text: 'Parent call ΓÇô Wyatt', zone: 'red' },
            { text: 'Risk follow-up ΓÇô Emma', zone: 'red' },
            { text: 'RR due Wed ΓÇô Liam', zone: 'purple' },
            { text: 'Aftercare planning ΓÇô Olivia', zone: 'purple' },
            { text: '30-day review ΓÇô Noah', zone: 'yellow' },
            { text: 'Parent session ΓÇô Ava', zone: 'yellow' },
            { text: 'Weekly check-in ΓÇô Sophia', zone: 'green' },
            { text: 'Documentation ΓÇô Jackson', zone: 'green' }
        ];
        
        // Clinical zone colors - softer but still clear
        const zoneColors = {
            red: '#DC2626',     // Clinical red
            purple: '#7C3AED',  // Softer purple
            yellow: '#FBBF24',  // Warm amber
            green: '#10B981'    // Sage green
        };
        
        // Floating tasks
        const taskCloud = document.createElement('div');
        taskCloud.style.cssText = `position: absolute; inset: 100px 50px; pointer-events: none;`;
        
        tasks.forEach((task, i) => {
            const el = document.createElement('div');
            el.className = 'floating-task';
            el.dataset.zone = task.zone;
            el.style.cssText = `
                position: absolute;
                left: ${15 + Math.random() * 70}%;
                top: ${15 + Math.random() * 50}%;
                padding: 10px 16px;
                background: rgba(255,255,255,0.03);
                backdrop-filter: blur(10px);
                border-radius: 8px;
                border-left: 3px solid ${zoneColors[task.zone]};
                color: ${this.colors.text};
                font-size: 13px;
                white-space: nowrap;
                opacity: 0;
                transform: scale(0.8);
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
            `;
            el.textContent = task.text;
            taskCloud.appendChild(el);
        });
        stage.appendChild(taskCloud);
        
        // Zone columns
        const zonesContainer = document.createElement('div');
        zonesContainer.style.cssText = `
            display: flex;
            gap: 16px;
            margin-top: 60px;
            opacity: 0;
        `;
        
        ['red', 'purple', 'yellow', 'green'].forEach(zone => {
            const col = document.createElement('div');
            col.className = 'zone-col glass';
            col.dataset.zone = zone;
            col.style.cssText = `
                width: 200px;
                min-height: 280px;
                border-radius: 14px;
                padding: 16px;
                opacity: 0;
                transform: translateY(40px);
            `;
            col.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 14px;">
                    <div style="width: 10px; height: 10px; border-radius: 50%; background: ${zoneColors[zone]}; box-shadow: 0 0 10px ${zoneColors[zone]};"></div>
                    <span style="font-size: 12px; font-weight: 600; color: ${zoneColors[zone]}; text-transform: capitalize;">${zone === 'red' ? 'Needs Attention' : zone === 'purple' ? 'This Week' : zone === 'yellow' ? 'Coming Up' : 'On Track'}</span>
                </div>
                <div class="zone-tasks" style="display: flex; flex-direction: column; gap: 8px;"></div>
            `;
            zonesContainer.appendChild(col);
        });
        stage.appendChild(zonesContainer);
        
        // Priority callout
        const callout = document.createElement('div');
        callout.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 28px;
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            border-radius: 30px;
            opacity: 0;
        `;
        callout.innerHTML = `
            <span style="font-size: 20px;">≡🎯»</span>
            <span style="color: ${this.colors.alert}; font-weight: 600;">Clear the red zone first</span>
        `;
        stage.appendChild(callout);
        
        const tl = gsap.timeline();
        
        // Label
        tl.to(label, { opacity: 1, duration: 1 });
        
        // Tasks appear scattered
        const floatingTasks = taskCloud.querySelectorAll('.floating-task');
        tl.to(floatingTasks, { opacity: 1, scale: 1, duration: 0.6, stagger: 0.06, ease: this.ease.bounce });
        
        // Let them see chaos
        tl.to({}, { duration: 1.5 });
        
        // Zones appear
        tl.to(zonesContainer, { opacity: 1, duration: 0.5 });
        const zoneCols = zonesContainer.querySelectorAll('.zone-col');
        tl.to(zoneCols, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: this.ease.lux });
        
        // GRAVITY SORT
        tl.call(() => {
            floatingTasks.forEach((task, i) => {
                const zone = task.dataset.zone;
                const zoneCol = zonesContainer.querySelector(`.zone-col[data-zone="${zone}"] .zone-tasks`);
                const zoneRect = zoneCol.getBoundingClientRect();
                const taskRect = task.getBoundingClientRect();
                
                const existingCount = zoneCol.querySelectorAll('.sorted-task').length;
                const targetY = zoneRect.top - taskRect.top + (existingCount * 45);
                const targetX = zoneRect.left - taskRect.left;
                
                gsap.to(task, {
                    x: targetX,
                    y: targetY,
                    rotation: 0,
                    duration: 1 + Math.random() * 0.5,
                    ease: 'power2.out',
                    delay: i * 0.1,
                    onComplete: () => {
                        const clone = task.cloneNode(true);
                        clone.className = 'sorted-task';
                        clone.style.cssText = `
                            padding: 10px 16px;
                            background: rgba(255,255,255,0.03);
                            border-radius: 8px;
                            border-left: 3px solid ${zoneColors[zone]};
                            color: ${this.colors.text};
                            font-size: 13px;
                            white-space: nowrap;
                        `;
                        zoneCol.appendChild(clone);
                        task.style.opacity = '0';
                    }
                });
            });
            this.playSfx('whoosh');
        });
        
        // Wait for sort
        tl.to({}, { duration: 2.5 });
        
        // Red zone emphasis
        const redZone = zonesContainer.querySelector('.zone-col[data-zone="red"]');
        tl.to(redZone, { boxShadow: '0 0 40px rgba(239, 68, 68, 0.4)', duration: 0.5, repeat: 2, yoyo: true });
        
        // Callout
        tl.to(callout, { opacity: 1, duration: 0.7 });
        
        // Hold
        tl.to({}, { duration: 2 });
        
        // Transition
        tl.to([label, taskCloud, zonesContainer, callout], { opacity: 0, y: -30, duration: 1 });
        tl.call(() => { label.remove(); taskCloud.remove(); zonesContainer.remove(); callout.remove(); });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE 5: THE MAP - Cinematic Geographic Discovery
    // Transform program discovery into a living command center
    // =========================================
    async sceneTheWorld(stage) {
        console.log('[Intro] Scene 5: The Map - Geographic Discovery');
        
        // Start subtitles for Scene 4 (The Map)
        this.playSubtitlesForScene('scene4');
        
        this.mode = 'ambient';
        const tl = gsap.timeline();
        
        // LOC color mapping
        const locColors = {
            'RTC': '#7C3AED',
            'PHP': '#0D9488',
            'IOP': '#0891B2',
            'Wilderness': '#10B981',
            'Detox': '#F59E0B'
        };
        
        // Program pin data - distributed across USA with realistic locations
        const allPins = [
            // California cluster (will be featured)
            { id: 1, name: 'Resilience Recovery', loc: 'PHP', x: 12, y: 42, city: 'Malibu', state: 'CA', distance: '2.3 mi' },
            { id: 2, name: 'Newport Academy', loc: 'RTC', x: 14, y: 48, city: 'Newport Beach', state: 'CA', distance: '45 mi' },
            { id: 3, name: 'Paradigm Treatment', loc: 'RTC', x: 11, y: 44, city: 'Malibu', state: 'CA', distance: '1.8 mi' },
            { id: 4, name: 'Visions Adolescent', loc: 'RTC', x: 13, y: 46, city: 'Los Angeles', state: 'CA', distance: '28 mi' },
            { id: 5, name: 'Clearview Treatment', loc: 'PHP', x: 10, y: 40, city: 'Santa Monica', state: 'CA', distance: '15 mi' },
            { id: 6, name: 'Cliffside Malibu', loc: 'RTC', x: 11, y: 41, city: 'Malibu', state: 'CA', distance: '3.1 mi' },
            // Utah cluster
            { id: 7, name: 'Summit Adolescent', loc: 'RTC', x: 28, y: 32, city: 'Park City', state: 'UT', distance: '580 mi' },
            { id: 8, name: 'Elevations RTC', loc: 'RTC', x: 29, y: 30, city: 'Syracuse', state: 'UT', distance: '595 mi' },
            { id: 9, name: 'Discovery Ranch', loc: 'RTC', x: 27, y: 34, city: 'Mapleton', state: 'UT', distance: '610 mi' },
            { id: 10, name: 'Turn About Ranch', loc: 'Wilderness', x: 26, y: 36, city: 'Escalante', state: 'UT', distance: '450 mi' },
            // Arizona cluster
            { id: 11, name: 'Serenity Springs', loc: 'PHP', x: 24, y: 52, city: 'Scottsdale', state: 'AZ', distance: '380 mi' },
            { id: 12, name: 'Copper Hills', loc: 'RTC', x: 22, y: 50, city: 'Phoenix', state: 'AZ', distance: '370 mi' },
            // Colorado cluster
            { id: 13, name: 'Mountain View', loc: 'RTC', x: 32, y: 38, city: 'Boulder', state: 'CO', distance: '850 mi' },
            { id: 14, name: 'Sandstone Care', loc: 'IOP', x: 34, y: 40, city: 'Denver', state: 'CO', distance: '870 mi' },
            // Texas cluster
            { id: 15, name: 'Meridian Treatment', loc: 'RTC', x: 48, y: 62, city: 'Austin', state: 'TX', distance: '1,240 mi' },
            { id: 16, name: 'La Hacienda', loc: 'RTC', x: 46, y: 58, city: 'Hunt', state: 'TX', distance: '1,180 mi' },
            // Florida cluster
            { id: 17, name: 'The Camp Recovery', loc: 'RTC', x: 78, y: 68, city: 'Tampa', state: 'FL', distance: '2,500 mi' },
            { id: 18, name: 'Beachside Teen', loc: 'RTC', x: 82, y: 72, city: 'Malibu Beach', state: 'FL', distance: '2,680 mi' },
            // Northeast
            { id: 19, name: 'McLean Hospital', loc: 'PHP', x: 88, y: 22, city: 'Belmont', state: 'MA', distance: '2,800 mi' },
            { id: 20, name: 'Silver Hill', loc: 'RTC', x: 84, y: 26, city: 'New Canaan', state: 'CT', distance: '2,750 mi' },
        ];
        
        // =============================================
        // ACT I: THE REVEAL (0-12s)
        // =============================================
        
        // Emotional hook text
        const hookText = document.createElement('div');
        hookText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            opacity: 0;
            z-index: 30;
        `;
        hookText.innerHTML = `
            <p style="
                font-size: 1.5rem;
                font-weight: 300;
                color: ${this.colors.muted};
                font-style: italic;
                max-width: 500px;
                line-height: 1.6;
            ">"But where are they located?"</p>
        `;
        stage.appendChild(hookText);
        
        // Show hook
        tl.to(hookText, { opacity: 1, duration: 1, ease: 'power2.out' });
        tl.to({}, { duration: 1.2 });
        tl.to(hookText, { opacity: 0, y: -30, duration: 0.6 });
        tl.call(() => hookText.remove());
        
        // Scene label
        const sceneLabel = document.createElement('div');
        sceneLabel.style.cssText = `
            position: absolute;
            top: 40px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
            z-index: 20;
        `;
        sceneLabel.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 6px;">Geographic Discovery</div>
            <h2 style="font-size: 2rem; font-weight: 600; color: ${this.colors.text}; margin: 0;">The Map</h2>
            <p style="font-size: 12px; color: ${this.colors.muted}; margin-top: 6px;">529 programs across the nation</p>
        `;
        stage.appendChild(sceneLabel);
        
        // Map container - full cinematic view
        const mapContainer = document.createElement('div');
        mapContainer.className = 'map-container';
        mapContainer.style.cssText = `
            position: relative;
            width: 1100px;
            max-width: 95vw;
            height: 600px;
            border-radius: 20px;
            overflow: hidden;
            opacity: 0;
            transform: scale(0.9);
            background: #0A1628;
            box-shadow: 0 30px 80px rgba(0,0,0,0.6), inset 0 0 100px rgba(13, 148, 136, 0.05);
            border: 1px solid rgba(13, 148, 136, 0.2);
        `;
        
        mapContainer.innerHTML = `
            <!-- Deep background with gradients -->
            <div class="map-bg" style="
                position: absolute;
                inset: 0;
                background: 
                    radial-gradient(ellipse 80% 60% at 20% 30%, rgba(13, 148, 136, 0.08) 0%, transparent 50%),
                    radial-gradient(ellipse 60% 50% at 80% 70%, rgba(8, 145, 178, 0.06) 0%, transparent 50%),
                    radial-gradient(ellipse 100% 100% at 50% 50%, rgba(16, 185, 129, 0.03) 0%, transparent 70%),
                    linear-gradient(180deg, #0A1628 0%, #050D1A 100%);
            "></div>
            
            <!-- Grid overlay -->
            <div class="map-grid" style="
                position: absolute;
                inset: 0;
                background-image: 
                    linear-gradient(rgba(13, 148, 136, 0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(13, 148, 136, 0.03) 1px, transparent 1px);
                background-size: 50px 50px;
                opacity: 0;
            "></div>
            
            <!-- USA Map SVG - Stylized Continental Outline -->
            <div class="usa-map-container" style="
                position: absolute;
                inset: 30px 50px;
                opacity: 0;
            ">
                <svg viewBox="0 0 100 60" style="width: 100%; height: 100%;" preserveAspectRatio="xMidYMid meet">
                    <defs>
                        <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style="stop-color:rgba(13,148,136,0.15)" />
                            <stop offset="100%" style="stop-color:rgba(13,148,136,0.05)" />
                        </linearGradient>
                        <filter id="mapGlow">
                            <feGaussianBlur stdDeviation="0.3" result="coloredBlur"/>
                            <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                        <filter id="stateGlow">
                            <feGaussianBlur stdDeviation="0.5" result="blur"/>
                            <feMerge>
                                <feMergeNode in="blur"/>
                                <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                        </filter>
                    </defs>
                    
                    <!-- Continental USA - Simplified recognizable outline -->
                    <path class="usa-mainland" d="
                        M 5,22 L 7,18 L 10,15 L 12,18 L 10,25 L 8,32 L 7,38 L 10,42 L 15,44
                        L 18,40 L 20,35 L 22,32 L 25,30 L 28,32 L 30,28 L 33,25 L 38,24
                        L 42,26 L 45,30 L 48,32 L 52,30 L 55,28 L 58,26 L 62,25 L 66,24
                        L 70,22 L 74,20 L 78,18 L 82,16 L 85,15 L 88,14 L 90,13 L 92,14
                        L 94,16 L 95,19 L 94,22 L 92,25 L 90,28 L 88,30 L 86,32 L 84,34
                        L 82,36 L 80,38 L 78,40 L 76,42 L 74,43 L 72,44 L 70,44 L 68,43
                        L 66,42 L 65,44 L 66,47 L 68,50 L 70,52 L 72,53 L 74,52 L 76,50
                        L 78,48 L 80,47 L 82,48 L 83,50 L 82,52 L 80,53 L 78,54 L 75,54
                        L 72,55 L 68,55 L 65,54 L 62,52 L 60,50 L 58,48 L 56,46 L 54,44
                        L 52,43 L 50,42 L 48,43 L 46,45 L 44,46 L 42,46 L 40,45 L 38,44
                        L 36,42 L 34,40 L 32,38 L 30,38 L 28,40 L 26,42 L 24,44 L 22,45
                        L 20,46 L 18,46 L 16,45 L 14,44 L 12,42 L 10,40 L 8,38 L 6,35
                        L 5,32 L 4,28 L 5,24 L 5,22 Z
                    " fill="url(#mapGradient)" stroke="rgba(13,148,136,0.5)" stroke-width="0.3" filter="url(#mapGlow)"/>
                    
                    <!-- California - West coast state highlight zone -->
                    <path class="state-region california" d="
                        M 5,22 L 7,18 L 10,15 L 12,18 L 10,25 L 8,32 L 7,38 L 10,42 L 12,40
                        L 10,35 L 9,30 L 8,25 L 7,22 L 5,22 Z
                    " fill="rgba(13,148,136,0.2)" stroke="rgba(13,148,136,0.6)" stroke-width="0.4" filter="url(#stateGlow)" style="opacity:0"/>
                    
                    <!-- Arizona/Nevada region -->
                    <path class="state-region arizona" d="
                        M 12,25 L 20,24 L 22,30 L 20,38 L 15,42 L 10,40 L 10,32 L 12,25 Z
                    " fill="rgba(8,145,178,0.12)" stroke="rgba(8,145,178,0.5)" stroke-width="0.25" style="opacity:0"/>
                    
                    <!-- Utah/Colorado region -->
                    <path class="state-region mountain" d="
                        M 22,18 L 35,16 L 40,22 L 38,30 L 30,32 L 22,28 L 22,18 Z
                    " fill="rgba(124,58,237,0.12)" stroke="rgba(124,58,237,0.5)" stroke-width="0.25" style="opacity:0"/>
                    
                    <!-- Texas region -->
                    <path class="state-region texas" d="
                        M 38,35 L 52,32 L 58,38 L 56,48 L 48,52 L 40,48 L 36,42 L 38,35 Z
                    " fill="rgba(245,158,11,0.1)" stroke="rgba(245,158,11,0.45)" stroke-width="0.25" style="opacity:0"/>
                    
                    <!-- Florida region -->
                    <path class="state-region florida" d="
                        M 72,44 L 78,42 L 82,48 L 80,53 L 75,54 L 70,52 L 68,48 L 72,44 Z
                    " fill="rgba(13,148,136,0.12)" stroke="rgba(13,148,136,0.5)" stroke-width="0.25" style="opacity:0"/>
                    
                    <!-- Northeast region -->
                    <path class="state-region northeast" d="
                        M 82,16 L 92,14 L 95,19 L 94,24 L 88,28 L 82,26 L 80,20 L 82,16 Z
                    " fill="rgba(124,58,237,0.1)" stroke="rgba(124,58,237,0.45)" stroke-width="0.25" style="opacity:0"/>
                    
                    <!-- Midwest/Great Lakes region -->
                    <path class="state-region midwest" d="
                        M 58,18 L 72,16 L 78,20 L 76,28 L 68,32 L 60,30 L 56,24 L 58,18 Z
                    " fill="rgba(16,185,129,0.08)" stroke="rgba(16,185,129,0.4)" stroke-width="0.2" style="opacity:0"/>
                </svg>
            </div>
            
            <!-- Pin layer -->
            <div class="pin-layer" style="
                position: absolute;
                inset: 60px;
                pointer-events: none;
            "></div>
            
            <!-- Cluster badges layer -->
            <div class="cluster-layer" style="
                position: absolute;
                inset: 60px;
                pointer-events: none;
            "></div>
            
            <!-- Counter badge -->
            <div class="counter-badge" style="
                position: absolute;
                top: 20px;
                right: 20px;
                padding: 10px 16px;
                background: rgba(15, 23, 42, 0.9);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(13, 148, 136, 0.3);
                border-radius: 10px;
                opacity: 0;
                transform: translateY(-10px);
            ">
                <div style="font-size: 10px; letter-spacing: 2px; color: ${this.colors.muted}; text-transform: uppercase;">Programs Found</div>
                <div class="counter-num" style="font-size: 28px; font-weight: 700; color: ${this.colors.primary};">0</div>
                </div>
                
            <!-- Search bar (floating) -->
            <div class="map-search" style="
                position: absolute;
                top: 20px;
                left: 50%;
                transform: translateX(-50%) translateY(-20px);
                width: 350px;
                padding: 12px 20px;
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(13, 148, 136, 0.3);
                border-radius: 25px;
                display: flex;
                align-items: center;
                gap: 12px;
                opacity: 0;
                box-shadow: 0 10px 40px rgba(0,0,0,0.4);
            ">
                <span style="font-size: 16px;">≡🔍</span>
                <span class="search-text" style="color: ${this.colors.muted}; font-size: 14px;">Search by city or zip...</span>
                <span class="search-cursor" style="width: 2px; height: 18px; background: ${this.colors.primary}; opacity: 0;"></span>
            </div>
            
            <!-- Results chip -->
            <div class="results-chip" style="
                position: absolute;
                top: 80px;
                left: 50%;
                transform: translateX(-50%);
                padding: 6px 14px;
                background: rgba(13, 148, 136, 0.2);
                border: 1px solid rgba(13, 148, 136, 0.4);
                                border-radius: 15px;
                font-size: 12px;
                color: ${this.colors.primary};
                opacity: 0;
            ">12 programs near Malibu, CA</div>
            
            <!-- Builder dock (bottom right) -->
            <div class="builder-dock" style="
                position: absolute;
                bottom: 20px;
                right: 20px;
                width: 200px;
                padding: 14px;
                background: rgba(15, 23, 42, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(13, 148, 136, 0.25);
                border-radius: 14px;
                opacity: 0;
                transform: translateY(20px);
            ">
                <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 10px;">Aftercare Plan</div>
                <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                    <div class="dock-slot filled" style="
                        flex: 1;
                        height: 36px;
                        background: rgba(13, 148, 136, 0.15);
                        border: 1px solid ${this.colors.primary};
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 9px;
                        color: ${this.colors.text};
                    ">✓ Resilience</div>
                    <div class="dock-slot empty" style="
                        flex: 1;
                        height: 36px;
                        background: rgba(255,255,255,0.02);
                        border: 1px dashed rgba(255,255,255,0.1);
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 9px;
                                color: ${this.colors.muted};
                    ">2</div>
                    <div class="dock-slot empty" style="
                        flex: 1;
                        height: 36px;
                        background: rgba(255,255,255,0.02);
                        border: 1px dashed rgba(255,255,255,0.1);
                        border-radius: 6px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 9px;
                        color: ${this.colors.muted};
                    ">3</div>
                    </div>
                <div style="font-size: 10px; color: ${this.colors.muted}; margin-bottom: 8px;">
                    <span class="dock-count">1</span>/3 programs
                </div>
                <div style="height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
                    <div class="dock-progress" style="width: 33%; height: 100%; background: ${this.colors.primary}; transition: width 0.5s;"></div>
            </div>
            </div>
        `;
        
        stage.appendChild(mapContainer);
        
        // Get references
        const mapGrid = mapContainer.querySelector('.map-grid');
        const usaMapContainer = mapContainer.querySelector('.usa-map-container');
        const usaMainland = mapContainer.querySelector('.usa-mainland');
        const stateRegions = mapContainer.querySelectorAll('.state-region');
        const pinLayer = mapContainer.querySelector('.pin-layer');
        const clusterLayer = mapContainer.querySelector('.cluster-layer');
        const counterBadge = mapContainer.querySelector('.counter-badge');
        const counterNum = mapContainer.querySelector('.counter-num');
        const mapSearch = mapContainer.querySelector('.map-search');
        const searchText = mapContainer.querySelector('.search-text');
        const searchCursor = mapContainer.querySelector('.search-cursor');
        const resultsChip = mapContainer.querySelector('.results-chip');
        const builderDock = mapContainer.querySelector('.builder-dock');
        
        // Create pins
        allPins.forEach(pin => {
            const pinEl = document.createElement('div');
            pinEl.className = 'map-pin';
            pinEl.dataset.id = pin.id;
            pinEl.dataset.state = pin.state;
            pinEl.style.cssText = `
                position: absolute;
                left: ${pin.x}%;
                top: ${pin.y}%;
                transform: translate(-50%, -50%) scale(0);
                opacity: 0;
                z-index: 10;
                cursor: pointer;
                pointer-events: auto;
            `;
            pinEl.innerHTML = `
                <div class="pin-dot" style="
                    width: 14px;
                    height: 14px;
                    background: ${locColors[pin.loc]};
                    border-radius: 50%;
                    box-shadow: 0 0 12px ${locColors[pin.loc]}50, 0 0 24px ${locColors[pin.loc]}30, 0 2px 8px rgba(0,0,0,0.4);
                    transition: all 0.3s ease;
                "></div>
                <div class="pin-tooltip" style="
                    position: absolute;
                    bottom: 100%;
                    left: 50%;
                    transform: translateX(-50%) translateY(-8px);
                    padding: 6px 10px;
                    background: rgba(15, 23, 42, 0.95);
                    border: 1px solid ${locColors[pin.loc]}50;
                    border-radius: 6px;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    font-size: 10px;
                    color: ${this.colors.text};
                    box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                ">
                    <div style="font-weight: 600;">${pin.name}</div>
                    <div style="color: ${this.colors.muted}; font-size: 9px; margin-top: 2px;">${pin.city}, ${pin.state} • ${pin.distance}</div>
                </div>
            `;
            pinLayer.appendChild(pinEl);
        });
        
        // Create cluster badges
        const clusters = [
            { label: 'CA', count: 87, x: 10, y: 45, color: locColors.PHP },
            { label: 'UT', count: 34, x: 27, y: 32, color: locColors.RTC },
            { label: 'AZ', count: 28, x: 22, y: 52, color: locColors.IOP },
            { label: 'CO', count: 22, x: 32, y: 38, color: locColors.Wilderness },
            { label: 'TX', count: 45, x: 46, y: 58, color: '#F59E0B' },
            { label: 'FL', count: 38, x: 78, y: 65, color: locColors.PHP },
        ];
        
        clusters.forEach(cluster => {
            const badge = document.createElement('div');
            badge.className = 'cluster-badge';
            badge.dataset.state = cluster.label;
            badge.style.cssText = `
                position: absolute;
                left: ${cluster.x}%;
                top: ${cluster.y}%;
                transform: translate(-50%, -50%) scale(0);
                padding: 6px 12px;
                background: rgba(15, 23, 42, 0.95);
                border: 1px solid ${cluster.color}50;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 600;
                color: ${this.colors.text};
                opacity: 0;
                box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                z-index: 15;
            `;
            badge.innerHTML = `<span style="color: ${cluster.color};">${cluster.count}</span> programs`;
            clusterLayer.appendChild(badge);
        });
        
        const pins = mapContainer.querySelectorAll('.map-pin');
        const clusterBadges = mapContainer.querySelectorAll('.cluster-badge');
        
        // =============================================
        // ANIMATION SEQUENCE
        // =============================================
        
        // Scene label appears
        tl.to(sceneLabel, { opacity: 1, duration: 0.8, ease: 'power2.out' });
        
        // Map container reveals
        tl.to(mapContainer, { 
            opacity: 1, 
            scale: 1, 
            duration: 1.2, 
            ease: 'power3.out' 
        }, '-=0.3');
        tl.call(() => this.playSfx('whoosh'));
        
        // Grid fades in
        tl.to(mapGrid, { opacity: 1, duration: 0.8 }, '-=0.6');
        
        // USA Map reveals with dramatic effect
        tl.to(usaMapContainer, { opacity: 1, duration: 1, ease: 'power2.out' });
        
        // Mainland pulses in with glow effect (more reliable than stroke-dasharray)
        tl.fromTo(usaMainland, 
            { opacity: 0, scale: 0.95, transformOrigin: 'center center' },
            { opacity: 1, scale: 1, duration: 1.5, ease: 'power2.out' },
            '-=0.5'
        );
        
        // Add a glow pulse to mainland
        tl.to(usaMainland, {
            attr: { 'stroke-width': 0.5 },
            filter: 'url(#mapGlow)',
            duration: 0.5,
            ease: 'power2.inOut'
        }, '-=0.8');
        
        // State regions reveal with stagger
        tl.to(stateRegions, { 
            opacity: 1, 
            duration: 0.8, 
            stagger: 0.15,
            ease: 'power2.out'
        }, '-=0.8');
        
        // Counter badge appears
        tl.to(counterBadge, { 
            opacity: 1, 
            y: 0, 
            duration: 0.5,
            ease: 'back.out(1.5)'
        }, '-=0.3');
        
        // POLISH: Pins rain down with enhanced bounce physics
        tl.call(() => this.playSfx('chime'));
        pins.forEach((pin, i) => {
            // Start pins from above with random offset for natural feel
            gsap.set(pin, { y: -50 - Math.random() * 30 });
            
            tl.to(pin, {
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.5,
                ease: 'bounce.out', // True bounce physics
            }, `-=${i === 0 ? 0 : 0.38}`);
            
            // Add a subtle glow pulse on landing
            if (i < 6) { // Only for visible pins
                tl.to(pin.querySelector('.pin-dot'), {
                    boxShadow: (_, t) => {
                        const color = t.style.background || '#0D9488';
                        return `0 0 20px ${color}80, 0 0 30px ${color}50`;
                    },
                    duration: 0.15
                }, `-=0.3`);
                tl.to(pin.querySelector('.pin-dot'), {
                    boxShadow: (_, t) => {
                        const color = t.style.background || '#0D9488';
                        return `0 0 12px ${color}50, 0 0 24px ${color}30`;
                    },
                    duration: 0.25
                });
            }
        });
        
        // Counter animates up
        tl.to({ val: 0 }, {
            val: 529,
            duration: 2,
            ease: 'power2.out',
            onUpdate: function() {
                counterNum.textContent = Math.floor(this.targets()[0].val);
            }
        }, '-=1.5');
        
        // Cluster badges appear
        tl.to(clusterBadges, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.08,
            ease: 'back.out(1.7)'
        }, '-=1');
        
        // Breathing room
        tl.to({}, { duration: 1 });
        
        // =============================================
        // ACT II: CALIFORNIA FOCUS
        // =============================================
        
        // Zoom to California
        const caRegion = mapContainer.querySelector('.state-region.california');
        
        // Dim mainland and non-CA regions
        tl.to(usaMainland, {
            opacity: 0.3,
            duration: 0.8
        });
        tl.to(stateRegions, {
            opacity: 0.1,
            duration: 0.8
        }, '-=0.8');
        
        // Highlight California region
        tl.to(caRegion, {
            opacity: 1,
            attr: { 
                fill: 'rgba(13,148,136,0.3)',
                stroke: 'rgba(13,148,136,0.9)',
                'stroke-width': 0.6
            },
            duration: 0.8
        }, '-=0.6');
        
        // Dim non-CA pins
        pins.forEach(pin => {
            if (pin.dataset.state !== 'CA') {
                tl.to(pin, { opacity: 0.2, scale: 0.7, duration: 0.6 }, '-=0.7');
            }
        });
        
        // Highlight CA pins
        pins.forEach(pin => {
            if (pin.dataset.state === 'CA') {
                tl.to(pin.querySelector('.pin-dot'), { 
                    scale: 1.3,
                    boxShadow: `0 0 20px ${locColors.PHP}70, 0 0 40px ${locColors.PHP}40`,
                    duration: 0.5 
                }, '-=0.5');
            }
        });
        
        // Update counter to CA count
        tl.to({ val: 529 }, {
            val: 87,
            duration: 0.8,
            ease: 'power2.out',
            onUpdate: function() {
                counterNum.textContent = Math.floor(this.targets()[0].val);
            }
        });
        
        // Hide non-CA cluster badges
        clusterBadges.forEach(badge => {
            if (badge.dataset.state !== 'CA') {
                tl.to(badge, { opacity: 0, scale: 0.5, duration: 0.4 }, '-=0.7');
            }
        });
        
        tl.call(() => this.playSfx('whoosh'));
        
        // =============================================
        // ACT III: SEARCH INTERACTION
        // =============================================
        
        // Search bar appears
        tl.to(mapSearch, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            ease: 'back.out(1.5)'
        });
        
        // Cursor blinks
        tl.to(searchCursor, { opacity: 1, duration: 0.2 });
        
        // Type "Malibu"
        const searchQuery = 'Malibu';
        tl.call(() => {
            let i = 0;
            const typeInterval = setInterval(() => {
                if (i < searchQuery.length) {
                    searchText.textContent = searchQuery.substring(0, i + 1);
                    searchText.style.color = this.colors.text;
                    i++;
                } else {
                    clearInterval(typeInterval);
                }
            }, 100);
        });
        
        tl.to({}, { duration: 1 }); // Wait for typing
        
        // Results chip appears
        tl.to(resultsChip, {
            opacity: 1,
            duration: 0.4,
            ease: 'back.out(2)'
        });
        
        // Filter to Malibu pins only (first few CA pins)
        pins.forEach((pin, i) => {
            const pinData = allPins[i];
            if (pinData.state === 'CA' && pinData.city !== 'Malibu') {
                tl.to(pin, { opacity: 0.3, scale: 0.8, duration: 0.4 }, '-=0.35');
            }
        });
        
        tl.call(() => this.playSfx('chime'));
        
        // =============================================
        // ACT IV: PIN INTERACTION
        // =============================================
        
        // Find Resilience Recovery pin (first pin)
        const targetPin = pins[0];
        const targetPinDot = targetPin.querySelector('.pin-dot');
        const targetTooltip = targetPin.querySelector('.pin-tooltip');
        
        // Hover effect on target pin
        tl.to(targetPinDot, {
            scale: 2,
            boxShadow: `0 0 30px ${locColors.PHP}80, 0 0 60px ${locColors.PHP}50`,
            duration: 0.5,
            ease: 'power2.out'
        });
        
        // Show tooltip
        tl.to(targetTooltip, {
            opacity: 1,
            y: -5,
            duration: 0.4,
            ease: 'back.out(1.5)'
        }, '-=0.3');
        
        tl.to({}, { duration: 0.8 }); // Hold
        
        // Create and show program card overlay
        const cardOverlay = document.createElement('div');
        cardOverlay.className = 'pin-card-overlay';
        cardOverlay.style.cssText = `
            position: absolute;
            left: 15%;
            top: 30%;
            width: 280px;
            background: rgba(15, 23, 42, 0.98);
            backdrop-filter: blur(20px);
            border: 1px solid ${this.colors.primary}40;
            border-radius: 16px;
            overflow: hidden;
            opacity: 0;
            transform: scale(0.8) translateY(20px);
            z-index: 100;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${this.colors.primary}20;
        `;
        cardOverlay.innerHTML = `
            <div class="card-header" style="
                padding: 16px;
                background: linear-gradient(135deg, ${locColors.PHP}30, ${locColors.PHP}10);
                border-bottom: 1px solid ${locColors.PHP}30;
            ">
                <div style="display: flex; align-items: center; gap: 10px;">
                <div style="
                        padding: 4px 10px;
                        background: ${locColors.PHP};
                        border-radius: 6px;
                        font-size: 10px;
                        font-weight: 600;
                        color: white;
                    ">PHP/IOP</div>
                    <span style="font-size: 11px; color: ${this.colors.muted};">2.3 miles away</span>
                </div>
                <h3 style="font-size: 18px; font-weight: 600; color: ${this.colors.text}; margin: 10px 0 4px 0;">Resilience Recovery</h3>
                <p style="font-size: 12px; color: ${this.colors.muted}; margin: 0;">≡📍 Malibu, CA • Ages 18-28</p>
            </div>
            <div class="card-body" style="padding: 16px;">
                <div class="card-tags" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px; opacity: 0;">
                    <span style="padding: 4px 10px; background: rgba(13, 148, 136, 0.2); border-radius: 10px; font-size: 10px; color: ${this.colors.primary};">Dual Dx</span>
                    <span style="padding: 4px 10px; background: rgba(16, 185, 129, 0.2); border-radius: 10px; font-size: 10px; color: ${this.colors.accent};">Trauma</span>
                    <span style="padding: 4px 10px; background: rgba(124, 58, 237, 0.2); border-radius: 10px; font-size: 10px; color: ${this.colors.purple};">DBT</span>
                    <span style="padding: 4px 10px; background: rgba(251, 191, 36, 0.2); border-radius: 10px; font-size: 10px; color: #FBBF24;">Life Skills</span>
                </div>
                <p class="card-desc" style="font-size: 12px; color: ${this.colors.muted}; line-height: 1.5; margin-bottom: 16px; opacity: 0;">
                    Young adult program specializing in dual diagnosis, trauma recovery, and life skills development.
                </p>
                <div class="card-actions" style="display: flex; gap: 8px; opacity: 0;">
                    <button style="
                        flex: 1;
                        padding: 10px;
                        background: transparent;
                        border: 1px solid rgba(255,255,255,0.2);
                        border-radius: 8px;
                        color: ${this.colors.muted};
                        font-size: 11px;
                        cursor: pointer;
                    ">View Profile</button>
                    <button class="add-to-plan-btn" style="
                        flex: 1;
                        padding: 10px;
                        background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                        border: none;
                        border-radius: 8px;
                        color: white;
                        font-size: 11px;
                        font-weight: 600;
                        cursor: pointer;
                        box-shadow: 0 4px 15px ${this.colors.primary}40;
                    ">Add to Plan</button>
                </div>
            </div>
        `;
        mapContainer.appendChild(cardOverlay);
        
        const cardTags = cardOverlay.querySelector('.card-tags');
        const cardDesc = cardOverlay.querySelector('.card-desc');
        const cardActions = cardOverlay.querySelector('.card-actions');
        const addToPlanBtn = cardOverlay.querySelector('.add-to-plan-btn');
        
        // Card appears from pin
        tl.to(cardOverlay, {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.6,
            ease: 'back.out(1.7)'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Content reveals in sequence
        tl.to(cardTags, { opacity: 1, duration: 0.4 }, '-=0.2');
        tl.to(cardDesc, { opacity: 1, duration: 0.4 }, '-=0.2');
        tl.to(cardActions, { opacity: 1, duration: 0.4 }, '-=0.2');
        
        // Builder dock appears
        tl.to(builderDock, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            ease: 'back.out(1.5)'
        }, '-=0.3');
        
        // Hold for appreciation
        tl.to({}, { duration: 1.2 });
        
        // =============================================
        // ACT V: ADD TO PLAN
        // =============================================
        
        // Button pulse
        tl.to(addToPlanBtn, {
            boxShadow: `0 0 25px ${this.colors.primary}70, 0 0 50px ${this.colors.primary}40`,
            scale: 1.05,
            duration: 0.4,
            repeat: 1,
            yoyo: true
        });
        
        // Click effect
        tl.to(addToPlanBtn, { scale: 0.95, duration: 0.1 });
        tl.to(addToPlanBtn, { 
            scale: 1,
            background: this.colors.accent,
            duration: 0.2
        });
        tl.call(() => this.playSfx('chime'));
        
        // Create flying thumbnail
        const cardRect = cardOverlay.getBoundingClientRect();
        const dockSlot = builderDock.querySelector('.dock-slot.empty');
        const dockSlotRect = dockSlot.getBoundingClientRect();
        
        const flyingThumb = document.createElement('div');
        flyingThumb.style.cssText = `
            position: fixed;
            left: ${cardRect.left + cardRect.width / 2 - 40}px;
            top: ${cardRect.top + 50}px;
            width: 80px;
            height: 40px;
            background: linear-gradient(135deg, ${this.colors.primary}40, ${this.colors.primary}20);
            border: 2px solid ${this.colors.primary};
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 9px;
            color: ${this.colors.text};
            z-index: 1000;
            box-shadow: 0 0 30px ${this.colors.primary}60;
        `;
        flyingThumb.textContent = '✓ Resilience';
        document.body.appendChild(flyingThumb);
        
        // Fly to dock
        tl.to(flyingThumb, {
            left: dockSlotRect.left,
            top: dockSlotRect.top,
            width: dockSlotRect.width,
            height: dockSlotRect.height,
            rotation: 360,
            duration: 0.7,
            ease: 'power3.inOut'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Update dock
        tl.call(() => {
            flyingThumb.remove();
            dockSlot.style.background = 'rgba(13, 148, 136, 0.15)';
            dockSlot.style.border = `1px solid ${this.colors.primary}`;
            dockSlot.innerHTML = '✓ Newport';
            dockSlot.classList.remove('empty');
            dockSlot.classList.add('filled');
            builderDock.querySelector('.dock-count').textContent = '2';
            builderDock.querySelector('.dock-progress').style.width = '66%';
        });
        
        // Toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
                    position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            padding: 12px 24px;
            background: rgba(16, 185, 129, 0.9);
            border-radius: 10px;
            font-size: 13px;
            color: white;
            font-weight: 500;
            opacity: 0;
            box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
        `;
        toast.textContent = '✓ Added from Map View';
        mapContainer.appendChild(toast);
        
        tl.to(toast, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            ease: 'back.out(2)'
        });
        
        // Hold
        tl.to({}, { duration: 1.5 });
        
        // Toast fades
        tl.to(toast, { opacity: 0, y: -10, duration: 0.3 });
        
        // =============================================
        // ACT VI: TRANSITION TO BUILDER
        // =============================================
        
        // Card fades
        tl.to(cardOverlay, { 
            opacity: 0, 
            scale: 0.9, 
            duration: 0.5 
        });
        
        // Builder dock pulses
        tl.to(builderDock, {
            boxShadow: `0 0 30px ${this.colors.primary}50`,
            duration: 0.5,
            repeat: 1,
            yoyo: true
        });
        
        // Transition text
        const transitionText = document.createElement('div');
        transitionText.style.cssText = `
                    position: absolute;
            bottom: 150px;
                    left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
        `;
        transitionText.innerHTML = `
            <p style="font-size: 1.2rem; color: ${this.colors.muted}; font-style: italic;">
                Now let's build the aftercare document...
            </p>
        `;
        mapContainer.appendChild(transitionText);
        
        tl.to(transitionText, { opacity: 1, duration: 0.8 });
        tl.to({}, { duration: 1 });
        
        // Bridge: Map zooms out and transforms toward document shape
        tl.to(mapContainer, {
            scale: 0.6,
            borderRadius: '8px',
            height: '70%',
            duration: 0.8,
            ease: 'power2.inOut'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Fade to white (like paper)
        tl.to(mapContainer, {
            backgroundColor: 'rgba(255,255,255,0.1)',
            duration: 0.4
        }, '-=0.3');
        
        // Final fade out
        tl.to([sceneLabel, mapContainer, transitionText], {
            opacity: 0,
            filter: 'blur(15px)',
            duration: 0.6,
            ease: 'power3.in'
        });
        
        tl.call(() => {
            sceneLabel.remove();
            mapContainer.remove();
            toast.remove();
        });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE: DOCUMENT BUILDER
    // Crafting the aftercare plan - the payoff
    // =========================================
    async sceneDocumentBuilder(stage) {
        console.log('[Intro] Scene: Document Builder');
        
        // Start subtitles for Scene 5 (Document Builder)
        this.playSubtitlesForScene('scene5');
        
        this.mode = 'ambient';
        const tl = gsap.timeline();
        
        // =============================================
        // ACT I: THE HOOK (0-5s)
        // =============================================
        
        // Emotional hook
        const hookText = document.createElement('div');
        hookText.style.cssText = `
            position: absolute;
                    top: 50%;
            left: 50%;
                    transform: translate(-50%, -50%);
            text-align: center;
                    opacity: 0;
            z-index: 30;
        `;
        hookText.innerHTML = `
            <p style="
                font-size: 1.4rem;
                font-weight: 300;
                color: ${this.colors.muted};
                font-style: italic;
                max-width: 500px;
                line-height: 1.6;
            ">"Now let's build the document..."</p>
        `;
        stage.appendChild(hookText);
        
        tl.to(hookText, { opacity: 1, duration: 0.8 });
        tl.to({}, { duration: 1 });
        tl.to(hookText, { opacity: 0, y: -20, duration: 0.5 });
        tl.call(() => hookText.remove());
        
        // Scene label
        const sceneLabel = document.createElement('div');
        sceneLabel.style.cssText = `
                        position: absolute;
            top: 35px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
                        opacity: 0;
            z-index: 20;
        `;
        sceneLabel.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 6px;">Aftercare Planning</div>
            <h2 style="font-size: 2rem; font-weight: 600; color: ${this.colors.text}; margin: 0;">Document Builder</h2>
            <p style="font-size: 12px; color: ${this.colors.muted}; margin-top: 6px;">Compile, customize, and deliver</p>
        `;
        stage.appendChild(sceneLabel);
        
        tl.to(sceneLabel, { opacity: 1, duration: 0.6 });
        
        // =============================================
        // DOCUMENT BUILDER UI
        // =============================================
        
        const builder = document.createElement('div');
        builder.className = 'document-builder glass';
        builder.style.cssText = `
            width: 1100px;
            max-width: 95vw;
            height: 620px;
            border-radius: 20px;
            display: flex;
            opacity: 0;
            transform: scale(0.92);
            overflow: hidden;
            box-shadow: 0 30px 80px rgba(0,0,0,0.5);
            border: 1px solid rgba(13, 148, 136, 0.2);
        `;
        
        // Selected programs for the document
        const selectedPrograms = [
            { name: 'Resilience Recovery', loc: 'PHP/IOP', city: 'Malibu, CA', color: '#0D9488' },
            { name: 'Newport Academy', loc: 'RTC', city: 'Newport Beach, CA', color: '#7C3AED' },
        ];
        
        builder.innerHTML = `
            <!-- Left Panel: Program Selection -->
            <div class="builder-sidebar" style="
                width: 280px;
                background: rgba(0,0,0,0.4);
                border-right: 1px solid rgba(255,255,255,0.05);
                padding: 20px;
                display: flex;
                flex-direction: column;
                transform: translateX(-100%);
            ">
                <div style="font-size: 10px; letter-spacing: 2px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 16px;">Selected Programs</div>
                
                <div class="selected-programs" style="flex: 1; display: flex; flex-direction: column; gap: 10px;">
                    ${selectedPrograms.map((p, i) => `
                        <div class="selected-program" style="
                            padding: 14px;
                            background: rgba(255,255,255,0.03);
                            border-radius: 10px;
                            border-left: 3px solid ${p.color};
                            opacity: 0;
                            transform: translateX(-20px);
                        ">
                            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                        <div style="
                                    padding: 3px 8px;
                                    background: ${p.color}25;
                                    border-radius: 4px;
                                    font-size: 9px;
                                    color: ${p.color};
                                    font-weight: 600;
                                ">${p.loc}</div>
                                <span style="font-size: 9px; color: ${this.colors.muted};">${p.city}</span>
                            </div>
                            <div style="font-size: 13px; font-weight: 600; color: ${this.colors.text};">${p.name}</div>
                            <div style="display: flex; gap: 6px; margin-top: 8px;">
                                <span style="font-size: 8px; padding: 2px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; color: ${this.colors.muted};">Trauma</span>
                                <span style="font-size: 8px; padding: 2px 6px; background: rgba(255,255,255,0.05); border-radius: 4px; color: ${this.colors.muted};">DBT</span>
                            </div>
                        </div>
                    `).join('')}
                    
                    <!-- Empty slot -->
                    <div class="empty-slot" style="
                        padding: 20px;
                        background: rgba(255,255,255,0.02);
                        border: 2px dashed rgba(255,255,255,0.1);
                        border-radius: 10px;
                        text-align: center;
                        opacity: 0;
                    ">
                        <div style="font-size: 20px; margin-bottom: 6px; opacity: 0.3;">+</div>
                        <div style="font-size: 10px; color: ${this.colors.muted};">Add another program</div>
                    </div>
                </div>
                
                <!-- Document Options -->
                <div class="doc-options" style="
                    padding-top: 16px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                    margin-top: 16px;
                    opacity: 0;
                ">
                    <div style="font-size: 10px; letter-spacing: 2px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 10px;">Include in Document</div>
                    ${['Program Details', 'Contact Info', 'Insurance', 'Admissions Process'].map((opt, i) => `
                        <div class="doc-option" style="
                            display: flex;
                            align-items: center;
                            gap: 8px;
                            padding: 8px 0;
                            opacity: 0;
                        ">
                            <div style="
                                width: 16px;
                                height: 16px;
                                border-radius: 4px;
                                background: ${i < 3 ? this.colors.primary : 'transparent'};
                                border: 1px solid ${i < 3 ? this.colors.primary : 'rgba(255,255,255,0.2)'};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                                font-size: 10px;
                                color: white;
                            ">${i < 3 ? '✓' : ''}</div>
                            <span style="font-size: 11px; color: ${this.colors.text};">${opt}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Center: Document Preview -->
            <div class="document-preview" style="
                flex: 1;
                padding: 30px;
                background: linear-gradient(180deg, rgba(15, 23, 42, 0.95), rgba(10, 16, 30, 0.98));
                display: flex;
                flex-direction: column;
                align-items: center;
                overflow-y: auto;
            ">
                <!-- Document Paper - POLISH: Paper texture & shadow -->
                <div class="doc-paper" style="
                    width: 100%;
                    max-width: 550px;
                    background: 
                        repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 28px,
                            rgba(0,0,0,0.02) 28px,
                            rgba(0,0,0,0.02) 29px
                        ),
                        linear-gradient(180deg, rgba(255,255,255,0.99) 0%, rgba(250,250,252,0.98) 100%);
                    border-radius: 8px;
                    box-shadow: 0 8px 30px rgba(0,0,0,0.15), 0 30px 60px rgba(0,0,0,0.25);
                    padding: 40px;
                    opacity: 0;
                    transform: translateY(40px) scale(0.92);
                    position: relative;
                ">
                    <!-- Document Header -->
                    <div class="doc-header" style="
                        text-align: center;
                        padding-bottom: 24px;
                        border-bottom: 2px solid #0D9488;
                        margin-bottom: 24px;
                        opacity: 0;
                    ">
                        <div style="font-size: 10px; letter-spacing: 3px; color: #0D9488; text-transform: uppercase; margin-bottom: 8px;">Family First Adolescent Services</div>
                        <h3 style="font-size: 22px; font-weight: 700; color: #1E293B; margin: 0;">Aftercare Recommendations</h3>
                        <p style="font-size: 11px; color: #64748B; margin-top: 8px;">Prepared for: <strong style="color: #1E293B;">Emma Thompson</strong> | Date: Dec 3, 2024</p>
                        </div>
                    
                    <!-- Client Summary -->
                    <div class="doc-section client-summary" style="margin-bottom: 24px; opacity: 0; transform: translateY(10px);">
                        <div style="font-size: 9px; letter-spacing: 2px; color: #0D9488; text-transform: uppercase; margin-bottom: 10px; font-weight: 600;">Client Summary</div>
                        <div style="background: #F8FAFC; padding: 14px; border-radius: 6px; border-left: 3px solid #0D9488;">
                            <p style="font-size: 12px; color: #475569; line-height: 1.6; margin: 0;">
                                Emma is a 17-year-old female completing residential treatment for trauma-related anxiety and depression. 
                                She has shown significant progress in DBT skills and family therapy. Recommended step-down to PHP/IOP 
                                with continued trauma-focused care.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Program Recommendations -->
                    <div class="doc-section programs" style="margin-bottom: 24px; opacity: 0; transform: translateY(10px);">
                        <div style="font-size: 9px; letter-spacing: 2px; color: #0D9488; text-transform: uppercase; margin-bottom: 12px; font-weight: 600;">Recommended Programs</div>
                        
                        ${selectedPrograms.map((p, i) => `
                            <div class="program-entry" style="
                                padding: 16px;
                                background: ${i === 0 ? '#F0FDFA' : '#FAF5FF'};
                                border-radius: 8px;
                                margin-bottom: 12px;
                                border: 1px solid ${i === 0 ? '#99F6E4' : '#E9D5FF'};
                                opacity: 0;
                                transform: translateX(-15px);
                            ">
                                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                                    <div>
                                        <div style="font-size: 14px; font-weight: 700; color: #1E293B;">${p.name}</div>
                                        <div style="font-size: 11px; color: #64748B; margin-top: 2px;">≡📍 ${p.city}</div>
                                    </div>
                                    <div style="
                            padding: 4px 10px;
                                        background: ${p.color};
                            border-radius: 4px;
                            font-size: 10px;
                            color: white;
                                        font-weight: 600;
                                    ">${p.loc}</div>
                                </div>
                                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                                    <span style="font-size: 9px; padding: 3px 8px; background: white; border-radius: 4px; color: #64748B; border: 1px solid #E2E8F0;">Trauma-Informed</span>
                                    <span style="font-size: 9px; padding: 3px 8px; background: white; border-radius: 4px; color: #64748B; border: 1px solid #E2E8F0;">DBT</span>
                                    <span style="font-size: 9px; padding: 3px 8px; background: white; border-radius: 4px; color: #64748B; border: 1px solid #E2E8F0;">Family Therapy</span>
                                </div>
                    </div>
                `).join('')}
            </div>
            
                    <!-- Next Steps -->
                    <div class="doc-section next-steps" style="opacity: 0; transform: translateY(10px);">
                        <div style="font-size: 9px; letter-spacing: 2px; color: #0D9488; text-transform: uppercase; margin-bottom: 10px; font-weight: 600;">Next Steps</div>
                        <ol style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569; line-height: 1.8;">
                            <li class="step-item" style="opacity: 0;">Contact programs for availability and intake scheduling</li>
                            <li class="step-item" style="opacity: 0;">Submit insurance verification requests</li>
                            <li class="step-item" style="opacity: 0;">Schedule family transition meeting</li>
                            <li class="step-item" style="opacity: 0;">Prepare discharge summary for receiving program</li>
                        </ol>
                    </div>
                    
                    <!-- Signature Line -->
                    <div class="doc-signature" style="
                        margin-top: 30px;
                        padding-top: 20px;
                        border-top: 1px solid #E2E8F0;
                        opacity: 0;
                    ">
                        <div style="display: flex; justify-content: space-between;">
                            <div>
                                <div style="width: 180px; border-bottom: 1px solid #1E293B; margin-bottom: 4px; height: 30px;"></div>
                                <div style="font-size: 10px; color: #64748B;">Clinical Coach Signature</div>
                            </div>
                            <div>
                                <div style="width: 120px; border-bottom: 1px solid #1E293B; margin-bottom: 4px; height: 30px;"></div>
                                <div style="font-size: 10px; color: #64748B;">Date</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel: Actions -->
            <div class="builder-actions" style="
                width: 220px;
                background: rgba(0,0,0,0.4);
                border-left: 1px solid rgba(255,255,255,0.05);
                padding: 20px;
                display: flex;
                flex-direction: column;
                transform: translateX(100%);
            ">
                <div style="font-size: 10px; letter-spacing: 2px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 16px;">Document Actions</div>
                
                <!-- Action Buttons -->
                <div class="action-btns" style="display: flex; flex-direction: column; gap: 10px;">
                    <button class="action-btn preview-btn" style="
                        padding: 12px 16px;
                        background: rgba(13, 148, 136, 0.15);
                        border: 1px solid rgba(13, 148, 136, 0.3);
                        border-radius: 8px;
                        color: ${this.colors.primary};
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        opacity: 0;
                        transform: translateY(10px);
                    ">👁 Preview PDF</button>
                    
                    <button class="action-btn download-btn" style="
                        padding: 12px 16px;
                            background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        opacity: 0;
                        transform: translateY(10px);
                        box-shadow: 0 4px 15px ${this.colors.primary}40;
                    ">≡📥 Download PDF</button>
                    
                    <button class="action-btn email-btn" style="
                        padding: 12px 16px;
                        background: rgba(255,255,255,0.05);
                        border: 1px solid rgba(255,255,255,0.1);
                        border-radius: 8px;
                        color: ${this.colors.text};
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        opacity: 0;
                        transform: translateY(10px);
                    ">≡📧 Email to Family</button>
                    
                    <button class="action-btn vault-btn" style="
                        padding: 12px 16px;
                        background: rgba(124, 58, 237, 0.15);
                        border: 1px solid rgba(124, 58, 237, 0.3);
                        border-radius: 8px;
                        color: ${this.colors.purple};
                        font-size: 12px;
                        font-weight: 500;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        opacity: 0;
                        transform: translateY(10px);
                    ">≡🔒 Save to Vault</button>
                    </div>
                
                <!-- Vault Status -->
                <div class="vault-status" style="
                    margin-top: auto;
                    padding: 14px;
                    background: rgba(124, 58, 237, 0.1);
                    border-radius: 10px;
                    border: 1px solid rgba(124, 58, 237, 0.2);
                    opacity: 0;
                ">
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size: 16px;">≡🔐</span>
                        <span style="font-size: 11px; font-weight: 600; color: ${this.colors.text};">Document Vault</span>
                    </div>
                    <div style="font-size: 10px; color: ${this.colors.muted}; line-height: 1.5;">
                        Securely store aftercare documents for compliance tracking and easy retrieval.
                    </div>
                    <div style="margin-top: 10px; font-size: 10px; color: ${this.colors.purple};">
                        <span class="vault-count">12</span> documents stored
                    </div>
                </div>
            </div>
        `;
        
        stage.appendChild(builder);
        
        // Get references
        const sidebar = builder.querySelector('.builder-sidebar');
        const actionsPanel = builder.querySelector('.builder-actions');
        const selectedProgramEls = builder.querySelectorAll('.selected-program');
        const emptySlot = builder.querySelector('.empty-slot');
        const docOptions = builder.querySelector('.doc-options');
        const docOptionEls = builder.querySelectorAll('.doc-option');
        const docPaper = builder.querySelector('.doc-paper');
        const docHeader = builder.querySelector('.doc-header');
        const clientSummary = builder.querySelector('.client-summary');
        const programsSection = builder.querySelector('.programs');
        const programEntries = builder.querySelectorAll('.program-entry');
        const nextSteps = builder.querySelector('.next-steps');
        const stepItems = builder.querySelectorAll('.step-item');
        const docSignature = builder.querySelector('.doc-signature');
        const actionBtns = builder.querySelectorAll('.action-btn');
        const vaultStatus = builder.querySelector('.vault-status');
        
        // =============================================
        // ANIMATION SEQUENCE
        // =============================================
        
        // Builder container appears
        tl.to(builder, { 
            opacity: 1, 
            scale: 1, 
            duration: 1, 
            ease: 'power3.out' 
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Sidebar slides in
        tl.to(sidebar, { x: 0, duration: 0.7, ease: 'power3.out' }, '-=0.5');
        
        // Selected programs reveal
        tl.to(selectedProgramEls, {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.15,
            ease: 'back.out(1.5)'
        }, '-=0.3');
        tl.call(() => this.playSfx('chime'));
        
        // Empty slot
        tl.to(emptySlot, { opacity: 1, duration: 0.3 }, '-=0.2');
        
        // Document options
        tl.to(docOptions, { opacity: 1, duration: 0.4 });
        tl.to(docOptionEls, {
            opacity: 1,
            duration: 0.3,
            stagger: 0.08
        }, '-=0.2');
        
        // POLISH: Document paper rises with growing shadow
        tl.to(docPaper, {
            opacity: 1,
            y: 0,
            scale: 1,
            boxShadow: '0 15px 45px rgba(0,0,0,0.2), 0 40px 80px rgba(0,0,0,0.35)',
            duration: 1,
            ease: 'power3.out'
        }, '-=0.3');
        // Add paper lift effect - shadow deepens as it "floats up"
        tl.to(docPaper, {
            boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 50px 100px rgba(0,0,0,0.4)',
            duration: 0.5,
            ease: 'power2.out'
        }, '-=0.3');
        tl.call(() => this.playSfx('whoosh'));
        
        // Document content builds
        tl.to(docHeader, { opacity: 1, duration: 0.5 });
        tl.to(clientSummary, { opacity: 1, y: 0, duration: 0.5 }, '-=0.2');
        tl.to(programsSection, { opacity: 1, y: 0, duration: 0.4 }, '-=0.2');
        
        // Program entries slide in
        tl.to(programEntries, {
                opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.2,
            ease: 'power2.out'
        });
        tl.call(() => this.playSfx('chime'));
        
        // Next steps
        tl.to(nextSteps, { opacity: 1, y: 0, duration: 0.4 });
        tl.to(stepItems, {
            opacity: 1,
            duration: 0.3,
            stagger: 0.1
        }, '-=0.2');
        
        // Signature
        tl.to(docSignature, { opacity: 1, duration: 0.4 });
        
        // Actions panel slides in
        tl.to(actionsPanel, { x: 0, duration: 0.7, ease: 'power3.out' }, '-=1');
        
        // Action buttons
        tl.to(actionBtns, {
            opacity: 1,
            y: 0,
            duration: 0.4,
            stagger: 0.1,
            ease: 'back.out(1.5)'
        }, '-=0.5');
        
        // Vault status
        tl.to(vaultStatus, { opacity: 1, duration: 0.4 });
        
        // Hold for appreciation
        tl.to({}, { duration: 1.5 });
        
        // =============================================
        // SAVE TO VAULT ANIMATION - POLISH: Lock icon effect
        // =============================================
        
        const vaultBtn = builder.querySelector('.vault-btn');
        
        // POLISH: Pulse vault button with glow
        tl.to(vaultBtn, {
            boxShadow: `0 0 25px ${this.colors.purple}60, 0 0 50px ${this.colors.purple}30`,
            scale: 1.08,
            duration: 0.3,
            ease: 'power2.out'
        });
        tl.to(vaultBtn, {
            boxShadow: `0 0 15px ${this.colors.purple}40`,
            scale: 1.05,
            duration: 0.3,
            ease: 'power2.in'
        });
        tl.to(vaultBtn, {
            boxShadow: `0 0 30px ${this.colors.purple}70`,
            scale: 1.1,
            duration: 0.25
        });
        
        // Click effect - satisfying press
        tl.to(vaultBtn, { scale: 0.92, duration: 0.08 });
        tl.to(vaultBtn, {
            scale: 1,
            background: this.colors.purple,
            color: 'white',
            duration: 0.25,
            ease: 'back.out(1.5)'
        });
        tl.call(() => this.playSfx('chime'));
        
        // POLISH: Lock closes animation
        tl.call(() => {
            vaultBtn.innerHTML = '<span style="display: inline-block; animation: lockClose 0.3s ease;">≡🔒</span> Saved to Vault';
            builder.querySelector('.vault-count').textContent = '13';
        });
        
        // Toast notification
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            padding: 14px 28px;
            background: rgba(124, 58, 237, 0.95);
            border-radius: 12px;
            font-size: 14px;
            color: white;
            font-weight: 500;
            opacity: 0;
            box-shadow: 0 10px 30px rgba(124, 58, 237, 0.3);
            display: flex;
            align-items: center;
            gap: 10px;
        `;
        toast.innerHTML = `<span style="font-size: 18px;">≡🔒</span> Document saved to vault`;
        stage.appendChild(toast);
        
        // POLISH: Toast slides in with spring physics from bottom
        tl.to(toast, {
            opacity: 1,
            y: -10, // Overshoot
            duration: 0.35,
            ease: 'power3.out'
        });
        tl.to(toast, {
            y: 0,
            duration: 0.25,
            ease: 'elastic.out(1, 0.6)'
        });
        
        // Hold
        tl.to({}, { duration: 2 });
        
        // Toast fades
        tl.to(toast, { opacity: 0, y: -10, duration: 0.3 });
        
        // =============================================
        // TRANSITION OUT
        // =============================================
        
        // Transition text
        const transitionText = document.createElement('div');
        transitionText.style.cssText = `
            position: absolute;
            bottom: 120px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
        `;
        transitionText.innerHTML = `
            <p style="font-size: 1.1rem; color: ${this.colors.muted}; font-style: italic;">
                Now let's make sure nothing falls through the cracks...
            </p>
        `;
        stage.appendChild(transitionText);
        
        tl.to(transitionText, { opacity: 1, duration: 0.6 });
        tl.to({}, { duration: 0.8 });
        
        // Bridge: Document shrinks and flies to center (like going into vault)
        const docPreview = builder.querySelector('.document-preview');
        if (docPreview) {
            tl.to(docPreview, {
                scale: 0.3,
                x: 100,
                y: -50,
                rotation: -5,
                opacity: 0.8,
                duration: 0.6,
                ease: 'power2.in'
            });
        }
        tl.call(() => this.playSfx('whoosh'));
        
        // Final fade with faster blur
        tl.to([sceneLabel, builder, transitionText], {
            opacity: 0,
            filter: 'blur(15px)',
            duration: 0.6,
            ease: 'power3.in'
        }, '-=0.2');
        
        tl.call(() => {
            sceneLabel.remove();
            builder.remove();
            toast.remove();
            transitionText.remove();
        });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE: THE SAFETY NET (Tracking & Compliance)
    // Emotional journey from anxiety to confidence
    // =========================================
    async sceneSafetyNet(stage) {
        console.log('[Intro] Scene: The Safety Net');
        
        // Start subtitles for Scene 6 (Safety Net)
        this.playSubtitlesForScene('scene6');
        
        this.mode = 'ambient';
        const tl = gsap.timeline();
        
        // =============================================
        // ACT I: THE NIGHTMARE (0-8s)
        // Show the anxiety every coach knows
        // =============================================
        
        // Anxious thought bubbles
        const nightmareContainer = document.createElement('div');
        nightmareContainer.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
        `;
        stage.appendChild(nightmareContainer);
        
        const thoughts = [
            { text: "Did I submit Emma's RR?", delay: 0, x: -150, y: -80 },
            { text: "When is Liam's 30-day review?", delay: 0.4, x: 120, y: -60 },
            { text: "Parent call scheduled?", delay: 0.8, x: -100, y: 40 },
            { text: "Discharge planning...", delay: 1.1, x: 140, y: 80 },
            { text: "Signature pending...", delay: 1.4, x: -180, y: 100 },
            { text: "Risk assessment due...", delay: 1.6, x: 80, y: -120 },
            { text: "Weekly check-in...", delay: 1.8, x: -60, y: 140 },
            { text: "Documentation incomplete...", delay: 2.0, x: 160, y: 20 },
        ];
        
        thoughts.forEach(thought => {
            const bubble = document.createElement('div');
            bubble.className = 'thought-bubble';
            bubble.style.cssText = `
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(${thought.x}px, ${thought.y}px) scale(0);
                padding: 12px 20px;
                background: rgba(220, 38, 38, 0.1);
                border: 1px solid rgba(220, 38, 38, 0.3);
                border-radius: 20px;
                font-size: 14px;
                font-style: italic;
                color: ${this.colors.muted};
                white-space: nowrap;
                opacity: 0;
            `;
            bubble.textContent = thought.text;
            nightmareContainer.appendChild(bubble);
        });
        
        const bubbles = nightmareContainer.querySelectorAll('.thought-bubble');
        
        // Show nightmare
        tl.to(nightmareContainer, { opacity: 1, duration: 0.5 });
        
        // Bubbles appear with increasing speed (building anxiety)
        bubbles.forEach((bubble, i) => {
            tl.to(bubble, {
                opacity: 1,
                scale: 1,
                duration: 0.4,
                ease: 'back.out(1.5)'
            }, thoughts[i].delay);
        });
        
        // Bubbles start swirling (chaos)
        tl.to(bubbles, {
            rotation: () => (Math.random() - 0.5) * 20,
            x: () => `+=${(Math.random() - 0.5) * 40}`,
            y: () => `+=${(Math.random() - 0.5) * 40}`,
            duration: 1,
            ease: 'power1.inOut',
            stagger: 0.05
        }, '+=0.5');
        
        // Hold the anxiety
        tl.to({}, { duration: 0.5 });
        
        // =============================================
        // ACT II: THE AWAKENING (8-15s)
        // A single bell - everything changes
        // =============================================
        
        // Bell sound and freeze
        tl.call(() => this.playSfx('chime'));
        
        // Bubbles freeze and fade
        tl.to(bubbles, {
            opacity: 0,
            scale: 0.8,
            filter: 'blur(10px)',
            duration: 0.8,
            stagger: 0.03
        });
        
        tl.call(() => nightmareContainer.remove());
        
        // Calming message
        const calmText = document.createElement('div');
        calmText.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            opacity: 0;
        `;
        calmText.innerHTML = `
            <p style="
                font-size: 1.6rem;
                font-weight: 300;
                color: ${this.colors.primary};
                letter-spacing: 2px;
            ">CareConnect is watching.</p>
        `;
        stage.appendChild(calmText);
        
        tl.to(calmText, { opacity: 1, duration: 1, ease: 'power2.out' });
        tl.to({}, { duration: 1 });
        tl.to(calmText, { opacity: 0, y: -20, duration: 0.5 });
        tl.call(() => calmText.remove());
        
        // Scene label
        const sceneLabel = document.createElement('div');
        sceneLabel.style.cssText = `
            position: absolute;
            top: 35px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
            z-index: 20;
        `;
        sceneLabel.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase; margin-bottom: 6px;">Tracking & Compliance</div>
            <h2 style="font-size: 2rem; font-weight: 600; color: ${this.colors.text}; margin: 0;">The Safety Net</h2>
        `;
        stage.appendChild(sceneLabel);
        
        tl.to(sceneLabel, { opacity: 1, duration: 0.6 });
        
        // =============================================
        // COMMAND CENTER - Orbital Timeline
        // =============================================
        
        const commandCenter = document.createElement('div');
        commandCenter.className = 'command-center';
        commandCenter.style.cssText = `
            position: relative;
            width: 900px;
            max-width: 90vw;
            height: 500px;
            opacity: 0;
            transform: scale(0.9);
        `;
        
        // Tasks for the orbital view
        const tasks = [
            { name: "Emma's RR", due: "2 hours", urgency: 'critical', angle: 0 },
            { name: "Liam's Review", due: "Tomorrow", urgency: 'warning', angle: 45 },
            { name: "Parent Call", due: "3pm Today", urgency: 'scheduled', angle: 90 },
            { name: "Noah's Check-in", due: "Wednesday", urgency: 'normal', angle: 135 },
            { name: "Olivia's Discharge", due: "Next Week", urgency: 'normal', angle: 180 },
            { name: "Mason's Signature", due: "Pending", urgency: 'warning', angle: 225 },
            { name: "Ava's Documentation", due: "Friday", urgency: 'normal', angle: 270 },
            { name: "Weekly Summary", due: "Sunday", urgency: 'normal', angle: 315 },
        ];
        
        const urgencyColors = {
            critical: '#DC2626',
            warning: '#F59E0B',
            scheduled: '#0D9488',
            normal: '#6B7280'
        };
        
        commandCenter.innerHTML = `
            <!-- Central "TODAY" anchor -->
            <div class="today-anchor" style="
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: radial-gradient(circle, ${this.colors.primary}30, transparent 70%);
                border: 2px solid ${this.colors.primary};
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 60px ${this.colors.primary}40;
                opacity: 0;
                z-index: 10;
            ">
                <div style="font-size: 12px; letter-spacing: 2px; color: ${this.colors.primary}; text-transform: uppercase;">TODAY</div>
                <div style="font-size: 24px; font-weight: 700; color: ${this.colors.text};">Dec 3</div>
                <div style="font-size: 10px; color: ${this.colors.muted};">8 tasks</div>
            </div>
            
            <!-- Orbital rings -->
            <div class="orbital-ring ring-1" style="
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 280px;
                height: 280px;
                border-radius: 50%;
                border: 1px dashed rgba(13, 148, 136, 0.2);
                opacity: 0;
            "></div>
            <div class="orbital-ring ring-2" style="
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 400px;
                height: 400px;
                border-radius: 50%;
                border: 1px dashed rgba(13, 148, 136, 0.15);
                opacity: 0;
            "></div>
            
            <!-- Task orbs -->
            ${tasks.map((task, i) => {
                const radius = task.urgency === 'critical' ? 140 : (task.urgency === 'warning' ? 180 : 200);
                const angle = task.angle * (Math.PI / 180);
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;
                return `
                    <div class="task-orb" data-urgency="${task.urgency}" style="
                        position: absolute;
                        left: calc(50% + ${x}px);
                        top: calc(50% + ${y}px);
                        transform: translate(-50%, -50%) scale(0);
                        opacity: 0;
                    ">
                        <div class="orb-core" style="
                            width: ${task.urgency === 'critical' ? 60 : 50}px;
                            height: ${task.urgency === 'critical' ? 60 : 50}px;
                            border-radius: 50%;
                            background: ${urgencyColors[task.urgency]}20;
                            border: 2px solid ${urgencyColors[task.urgency]};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 0 20px ${urgencyColors[task.urgency]}40;
                            cursor: pointer;
                            transition: all 0.3s ease;
                        ">
                            <span style="font-size: ${task.urgency === 'critical' ? 20 : 16}px;">
                                ${task.urgency === 'critical' ? '⚠' : task.urgency === 'warning' ? '⏰' : task.urgency === 'scheduled' ? '📅' : '✓'}
                            </span>
                        </div>
                        <div class="orb-label" style="
                            position: absolute;
                            top: 100%;
                            left: 50%;
                            transform: translateX(-50%);
                            margin-top: 8px;
                            text-align: center;
                            white-space: nowrap;
                            opacity: 0;
                        ">
                            <div style="font-size: 11px; font-weight: 600; color: ${this.colors.text};">${task.name}</div>
                            <div style="font-size: 9px; color: ${urgencyColors[task.urgency]};">${task.due}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
        
        stage.appendChild(commandCenter);
        
        // Get references
        const todayAnchor = commandCenter.querySelector('.today-anchor');
        const orbitalRings = commandCenter.querySelectorAll('.orbital-ring');
        const taskOrbs = commandCenter.querySelectorAll('.task-orb');
        const orbLabels = commandCenter.querySelectorAll('.orb-label');
        
        // Command center reveals
        tl.to(commandCenter, { 
            opacity: 1, 
            scale: 1, 
            duration: 1, 
            ease: 'power3.out' 
        });
        
        // Today anchor pulses in
        tl.to(todayAnchor, {
            opacity: 1,
            duration: 0.8,
            ease: 'back.out(1.5)'
        }, '-=0.5');
        tl.call(() => this.playSfx('whoosh'));
        
        // Orbital rings expand
        tl.to(orbitalRings, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.2
        }, '-=0.3');
        
        // Task orbs appear with stagger
        tl.to(taskOrbs, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            stagger: 0.1,
            ease: 'back.out(1.7)'
        }, '-=0.2');
        tl.call(() => this.playSfx('chime'));
        
        // Labels fade in
        tl.to(orbLabels, {
            opacity: 1,
            duration: 0.4,
            stagger: 0.05
        }, '-=0.3');
        
        // Hold to appreciate
        tl.to({}, { duration: 1 });
        
        // =============================================
        // ACT III: THE INTELLIGENCE (15-25s)
        // System thinks for you
        // =============================================
        
        // Highlight critical task
        const criticalOrb = commandCenter.querySelector('[data-urgency="critical"]');
        
        tl.to(criticalOrb, {
            scale: 1.2,
            zIndex: 100,
            duration: 0.4
        });
        
        // Intelligence card appears
        const intelligenceCard = document.createElement('div');
        intelligenceCard.style.cssText = `
            position: absolute;
            right: 50px;
            top: 50%;
            transform: translateY(-50%) translateX(30px);
            width: 280px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid ${this.colors.primary}40;
            border-radius: 16px;
            padding: 20px;
            opacity: 0;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        `;
        intelligenceCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 16px;">
                <div style="
                    width: 36px;
                    height: 36px;
                    background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                ">≡🧭á</div>
                <div>
                    <div style="font-size: 10px; letter-spacing: 1px; color: ${this.colors.primary}; text-transform: uppercase;">Smart Insight</div>
                    <div style="font-size: 14px; font-weight: 600; color: ${this.colors.text};">Emma's RR</div>
                </div>
            </div>
            
            <div class="insight-content" style="opacity: 0;">
                <div style="
                    padding: 12px;
                    background: rgba(220, 38, 38, 0.1);
                    border-left: 3px solid #DC2626;
                    border-radius: 8px;
                    margin-bottom: 12px;
                ">
                    <div style="font-size: 12px; color: #DC2626; font-weight: 600;">Due in 2 hours</div>
                    <div style="font-size: 11px; color: ${this.colors.muted}; margin-top: 4px;">Overdue items affect compliance score</div>
                </div>
                
                <div class="suggestion" style="
                    padding: 12px;
                    background: rgba(13, 148, 136, 0.1);
                    border-radius: 8px;
                    margin-bottom: 12px;
                    opacity: 0;
                ">
                    <div style="font-size: 11px; color: ${this.colors.primary}; margin-bottom: 6px;">≡💡 Based on your schedule:</div>
                    <div style="font-size: 13px; color: ${this.colors.text}; font-weight: 500;">"Best time to complete: Now"</div>
                </div>
                
                <div class="pattern" style="
                    font-size: 10px;
                    color: ${this.colors.muted};
                    padding: 10px;
                    background: rgba(255,255,255,0.03);
                    border-radius: 6px;
                    opacity: 0;
                ">
                    ≡📊 You complete RRs 40% faster in the morning
                </div>
            </div>
            
            <div class="action-row" style="
                display: flex;
                gap: 8px;
                margin-top: 16px;
                opacity: 0;
            ">
                <button style="
                    flex: 1;
                    padding: 10px;
                    background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                ">Complete Now</button>
                <button style="
                    padding: 10px 14px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    color: ${this.colors.muted};
                    font-size: 12px;
                    cursor: pointer;
                ">Snooze</button>
            </div>
        `;
        stage.appendChild(intelligenceCard);
        
        const insightContent = intelligenceCard.querySelector('.insight-content');
        const suggestion = intelligenceCard.querySelector('.suggestion');
        const pattern = intelligenceCard.querySelector('.pattern');
        const actionRow = intelligenceCard.querySelector('.action-row');
        
        // Card slides in
        tl.to(intelligenceCard, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power3.out'
        });
        
        // Content reveals in sequence
        tl.to(insightContent, { opacity: 1, duration: 0.4 });
        tl.to(suggestion, { opacity: 1, duration: 0.4 }, '-=0.1');
        tl.call(() => this.playSfx('chime'));
        tl.to(pattern, { opacity: 1, duration: 0.4 }, '-=0.1');
        tl.to(actionRow, { opacity: 1, duration: 0.4 });
        
        // Hold
        tl.to({}, { duration: 1.5 });
        
        // =============================================
        // ACT IV: THE CONFIDENCE (25-32s)
        // Show the result - compliance dashboard
        // =============================================
        
        // Fade intelligence card
        tl.to(intelligenceCard, { opacity: 0, x: 30, duration: 0.5 });
        tl.call(() => intelligenceCard.remove());
        
        // Reset critical orb
        tl.to(criticalOrb, { scale: 1, duration: 0.3 }, '-=0.3');
        
        // Compliance dashboard appears
        const complianceDash = document.createElement('div');
        complianceDash.style.cssText = `
            position: absolute;
            left: 50px;
            top: 50%;
            transform: translateY(-50%) translateX(-30px);
            width: 260px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(16, 185, 129, 0.3);
            border-radius: 16px;
            padding: 24px;
            opacity: 0;
            box-shadow: 0 20px 50px rgba(0,0,0,0.4);
        `;
        complianceDash.innerHTML = `
            <div style="font-size: 10px; letter-spacing: 2px; color: ${this.colors.accent}; text-transform: uppercase; margin-bottom: 20px;">Compliance Status</div>
            
            <!-- Main Score -->
            <div class="main-score" style="text-align: center; margin-bottom: 24px; opacity: 0;">
                <div style="
                    width: 100px;
                    height: 100px;
                    margin: 0 auto 12px;
                    border-radius: 50%;
                    background: conic-gradient(${this.colors.accent} 0deg, ${this.colors.accent} 0deg, rgba(255,255,255,0.1) 0deg);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                " class="score-ring">
                    <div style="
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        background: rgba(15, 23, 42, 0.95);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    ">
                        <span class="score-num" style="font-size: 28px; font-weight: 700; color: ${this.colors.accent};">0</span>
                        <span style="font-size: 14px; color: ${this.colors.muted};">%</span>
                    </div>
                </div>
                <div style="font-size: 14px; font-weight: 600; color: ${this.colors.text};">Overall Compliance</div>
            </div>
            
            <!-- Metrics -->
            <div class="metrics" style="display: flex; flex-direction: column; gap: 12px;">
                <div class="metric" style="display: flex; justify-content: space-between; align-items: center; opacity: 0;">
                    <span style="font-size: 12px; color: ${this.colors.muted};">Zero Overdue</span>
                    <span style="font-size: 12px; font-weight: 600; color: ${this.colors.accent};">✓</span>
                </div>
                <div class="metric" style="display: flex; justify-content: space-between; align-items: center; opacity: 0;">
                    <span style="font-size: 12px; color: ${this.colors.muted};">On-Time Rate</span>
                    <span style="font-size: 12px; font-weight: 600; color: ${this.colors.accent};">98%</span>
                </div>
                <div class="metric" style="display: flex; justify-content: space-between; align-items: center; opacity: 0;">
                    <span style="font-size: 12px; color: ${this.colors.muted};">Documentation</span>
                    <span style="font-size: 12px; font-weight: 600; color: ${this.colors.accent};">96%</span>
                </div>
            </div>
            
            <!-- Badge -->
            <div class="audit-badge" style="
                margin-top: 20px;
                padding: 12px;
                background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(13, 148, 136, 0.1));
                border: 1px solid ${this.colors.accent}50;
                border-radius: 10px;
                text-align: center;
                opacity: 0;
            ">
                <div style="font-size: 16px; margin-bottom: 4px;">≡🏆</div>
                <div style="font-size: 12px; font-weight: 600; color: ${this.colors.accent};">Audit Ready</div>
                <div style="font-size: 9px; color: ${this.colors.muted}; margin-top: 2px;">Exceeds Standards</div>
            </div>
        `;
        stage.appendChild(complianceDash);
        
        const mainScore = complianceDash.querySelector('.main-score');
        const scoreRing = complianceDash.querySelector('.score-ring');
        const scoreNum = complianceDash.querySelector('.score-num');
        const metrics = complianceDash.querySelectorAll('.metric');
        const auditBadge = complianceDash.querySelector('.audit-badge');
        
        // Dashboard slides in
        tl.to(complianceDash, {
            opacity: 1,
            x: 0,
            duration: 0.6,
            ease: 'power3.out'
        });
        
        // Main score reveals with ring animation
        tl.to(mainScore, { opacity: 1, duration: 0.4 });
        
        // Animate score ring and number
        tl.to({ val: 0 }, {
            val: 94,
            duration: 1.5,
            ease: 'power2.out',
            onUpdate: function() {
                const v = Math.floor(this.targets()[0].val);
                scoreNum.textContent = v;
                scoreRing.style.background = `conic-gradient(${commandCenter.style.getPropertyValue('--accent') || '#10B981'} ${v * 3.6}deg, rgba(255,255,255,0.1) ${v * 3.6}deg)`;
            }
        });
        tl.call(() => this.playSfx('chime'));
        
        // Metrics cascade
        tl.to(metrics, {
            opacity: 1,
            duration: 0.3,
            stagger: 0.15
        }, '-=0.5');
        
        // Audit badge with sparkle
        tl.to(auditBadge, {
            opacity: 1,
            scale: 1,
            duration: 0.5,
            ease: 'back.out(1.5)'
        });
        
        // Hold for impact
        tl.to({}, { duration: 1.5 });
        
        // =============================================
        // EMOTIONAL PAYOFF
        // =============================================
        
        const payoffText = document.createElement('div');
        payoffText.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
        `;
        payoffText.innerHTML = `
            <p style="
                font-size: 1.3rem;
                font-weight: 300;
                color: ${this.colors.text};
                line-height: 1.6;
            ">Sleep well.<br><span style="color: ${this.colors.primary}; font-weight: 500;">We've got this.</span></p>
        `;
        stage.appendChild(payoffText);
        
        tl.to(payoffText, { opacity: 1, duration: 0.8, ease: 'power2.out' });
        tl.to({}, { duration: 2 });
        
        // =============================================
        // TRANSITION OUT - Bridge to Finale
        // =============================================
        
        // Bridge: Compliance ring expands to become the finale's halo
        // Note: scoreRing already declared earlier in this function
        if (scoreRing) {
            tl.to(scoreRing, {
                scale: 3,
                opacity: 0.3,
                duration: 0.8,
                ease: 'power2.in'
            });
        }
        tl.call(() => this.playSfx('whoosh'));
        
        // Orbital tasks scatter outward (taskOrbs already declared earlier)
        tl.to(taskOrbs, {
            scale: 0,
            opacity: 0,
            x: () => (Math.random() - 0.5) * 400,
            y: () => (Math.random() - 0.5) * 400,
            duration: 0.6,
            stagger: 0.03,
            ease: 'power2.in'
        }, '-=0.6');
        
        // Everything fades with blur
        tl.to([sceneLabel, commandCenter, complianceDash, payoffText], {
            opacity: 0,
            filter: 'blur(15px)',
            duration: 0.6,
            ease: 'power3.in'
        }, '-=0.3');
        
        tl.call(() => {
            sceneLabel.remove();
            commandCenter.remove();
            complianceDash.remove();
            payoffText.remove();
        });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE 7: TRANSCENDENCE (The Finale)
    // Emotional empowerment - synthesis, clarity, invitation
    // =========================================
    async sceneTranscendence(stage) {
        console.log('[Intro] Scene 7: Transcendence - The Finale');
        
        // Start subtitles for Scene 7 (Transcendence)
        this.playSubtitlesForScene('scene7');
        
        this.mode = 'ambient';
        const tl = gsap.timeline();
        
        // =============================================
        // ACT I: SYNTHESIS (0-8s)
        // Icons from previous scenes converge
        // =============================================
        
        // Scene icons that will converge
        const icons = [
            { emoji: '≡🧭¡', name: 'Journey', angle: 0 },
            { emoji: '🗺', name: 'Programs', angle: 60 },
            { emoji: '≡📄', name: 'Builder', angle: 120 },
            { emoji: '✅', name: 'Compliance', angle: 180 },
            { emoji: '≡📊', name: 'Dashboard', angle: 240 },
            { emoji: '≡🏥', name: 'Care', angle: 300 },
        ];
        
        const iconContainer = document.createElement('div');
        iconContainer.style.cssText = `
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        icons.forEach((icon, i) => {
            const iconEl = document.createElement('div');
            iconEl.className = 'convergence-icon';
            const startAngle = icon.angle * (Math.PI / 180);
            const startRadius = 400;
            const startX = Math.cos(startAngle) * startRadius;
            const startY = Math.sin(startAngle) * startRadius;
            iconEl.style.cssText = `
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(13, 148, 136, 0.1);
                border: 1px solid ${this.colors.primary}40;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
                transform: translate(${startX}px, ${startY}px) scale(0);
                opacity: 0;
            `;
            iconEl.textContent = icon.emoji;
            iconContainer.appendChild(iconEl);
        });
        stage.appendChild(iconContainer);
        
        const convergenceIcons = iconContainer.querySelectorAll('.convergence-icon');
        
        // Icons appear from edges
        tl.to(convergenceIcons, {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.1,
            ease: 'back.out(1.5)'
        });
        tl.call(() => this.playSfx('whoosh'));
        
        // Icons swirl toward center
        tl.to(convergenceIcons, {
            x: 0,
            y: 0,
            rotation: 360,
            duration: 1.5,
            ease: 'power2.inOut',
            stagger: 0.05
        });
        
        // Icons merge and disappear
        tl.to(convergenceIcons, {
            scale: 0,
            opacity: 0,
            duration: 0.3
        });
        
        tl.call(() => iconContainer.remove());
        
        // =============================================
        // ACT II: THE PULSE - Logo appears
        // =============================================
        
        // Confetti canvas
        const confettiCanvas = document.createElement('canvas');
        confettiCanvas.style.cssText = 'position: absolute; inset: 0; pointer-events: none; z-index: 100;';
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        stage.appendChild(confettiCanvas);
        
        // Main content
        const content = document.createElement('div');
        content.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            opacity: 0;
            transform: scale(0.9);
        `;
        content.innerHTML = `
            <!-- Logo with heartbeat pulse -->
            <div class="logo-pulse" style="
                width: 120px;
                height: 120px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 60px ${this.colors.primary}50;
                transform: scale(0);
                position: relative;
            ">
                <span style="font-size: 50px;">≡🏥</span>
                <!-- Heartbeat ring -->
                <div class="heartbeat-ring" style="
                    position: absolute;
                    inset: -10px;
                    border-radius: 50%;
                    border: 2px solid ${this.colors.primary};
                    opacity: 0;
                "></div>
            </div>
            
            <!-- The Motto -->
            <div class="motto" style="
                margin-top: 32px;
                opacity: 0;
                transform: translateY(20px);
            ">
                <p style="
                    font-size: 1.5rem;
                    font-weight: 300;
                    font-style: italic;
                    color: ${this.colors.primary};
                    margin: 0;
                ">"Your sanctuary of clarity."</p>
                <p style="
                    font-size: 0.95rem;
                    color: ${this.colors.muted};
                    margin-top: 8px;
                ">Run your day. Don't let it run you.</p>
            </div>
            
            <!-- Value Recap -->
            <div class="value-recap" style="
                display: flex;
                gap: 40px;
                margin-top: 40px;
            ">
                <div class="value-word" style="opacity: 0; transform: scale(0.8);">
                    <span style="font-size: 1.4rem; font-weight: 700; color: ${this.colors.text};">FIND.</span>
                </div>
                <div class="value-word" style="opacity: 0; transform: scale(0.8);">
                    <span style="font-size: 1.4rem; font-weight: 700; color: ${this.colors.text};">BUILD.</span>
                </div>
                <div class="value-word" style="opacity: 0; transform: scale(0.8);">
                    <span style="font-size: 1.4rem; font-weight: 700; color: ${this.colors.text};">TRACK.</span>
                </div>
                <div class="value-word" style="opacity: 0; transform: scale(0.8);">
                    <span style="font-size: 1.4rem; font-weight: 700; color: ${this.colors.accent};">THRIVE.</span>
                </div>
            </div>
            
            <!-- Portal Button -->
            <button class="portal-btn" style="
                margin-top: 48px;
                padding: 18px 50px;
                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                border: 1px solid rgba(255,255,255,0.3);
                border-radius: 16px;
                color: white;
                font-size: 1.2rem;
                font-weight: 600;
                letter-spacing: 1px;
                cursor: pointer;
                opacity: 0;
                transform: translateY(30px);
                box-shadow: 0 0 30px ${this.colors.primary}50, inset 0 0 20px rgba(255,255,255,0.2);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            ">
                <span style="position: relative; z-index: 1;">Enter Dashboard</span>
                <div class="btn-glow" style="
                    position: absolute;
                    inset: -2px;
                    background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.accent});
                    filter: blur(15px);
                    opacity: 0;
                    z-index: 0;
                "></div>
            </button>
            
            <!-- Version -->
            <div class="version-tag" style="
                margin-top: 24px;
                font-size: 11px;
                color: ${this.colors.muted};
                opacity: 0;
            ">Welcome to CareConnect Pro v12.4</div>
        `;
        stage.appendChild(content);
        
        // Get references
        const logoPulse = content.querySelector('.logo-pulse');
        const heartbeatRing = content.querySelector('.heartbeat-ring');
        const motto = content.querySelector('.motto');
        const valueWords = content.querySelectorAll('.value-word');
        const portalBtn = content.querySelector('.portal-btn');
        const btnGlow = content.querySelector('.btn-glow');
        const versionTag = content.querySelector('.version-tag');
        
        // Content container fades in
        tl.to(content, { opacity: 1, scale: 1, duration: 0.8, ease: 'power3.out' });
        
        // Logo pulses in with heartbeat
        tl.to(logoPulse, { 
            scale: 1, 
            duration: 0.8, 
            ease: 'back.out(1.7)',
            onStart: () => this.playSfx('success')
        });
        
        // Heartbeat ring animation
        tl.to(heartbeatRing, {
            opacity: 0.6,
            scale: 1.3,
            duration: 0.4,
            ease: 'power2.out'
        });
        tl.to(heartbeatRing, {
            opacity: 0,
            scale: 1.8,
            duration: 0.6,
            ease: 'power2.out'
        });
        
        // Motto reveals
        tl.to(motto, { 
            opacity: 1, 
            y: 0, 
            duration: 0.8, 
            ease: 'power3.out' 
        }, '-=0.3');
        
        // Value words flash in sequence (cinematic)
        tl.to(valueWords[0], { opacity: 1, scale: 1, duration: 0.3 }, '+=0.3');
        tl.call(() => this.playSfx('click'));
        tl.to(valueWords[1], { opacity: 1, scale: 1, duration: 0.3 }, '+=0.15');
        tl.call(() => this.playSfx('click'));
        tl.to(valueWords[2], { opacity: 1, scale: 1, duration: 0.3 }, '+=0.15');
        tl.call(() => this.playSfx('click'));
        tl.to(valueWords[3], { opacity: 1, scale: 1, duration: 0.4 }, '+=0.15');
        tl.call(() => this.playSfx('chime'));
        
        // =============================================
        // ACT III: THE CALL TO ACTION
        // =============================================
        
        // Portal button materializes
        tl.to(portalBtn, {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'back.out(1.5)'
        }, '+=0.3');
        
        // Button glow appears
        tl.to(btnGlow, {
            opacity: 0.5,
            duration: 0.5
        });
        
        // Confetti!
        tl.call(() => this.fireConfetti(confettiCanvas));
        
        // Version tag
        tl.to(versionTag, { opacity: 1, duration: 0.5 }, '-=0.3');
        
        // Button waiting pulse
        tl.to(portalBtn, {
            scale: 1.03,
            boxShadow: `0 0 40px ${this.colors.primary}60, inset 0 0 25px rgba(255,255,255,0.25)`,
            duration: 1,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut'
        });
        
        // Button interactions
        portalBtn.addEventListener('click', () => this.complete());
        portalBtn.addEventListener('mouseenter', () => {
            gsap.to(portalBtn, { scale: 1.08, duration: 0.2 });
            gsap.to(btnGlow, { opacity: 0.8, duration: 0.2 });
        });
        portalBtn.addEventListener('mouseleave', () => {
            gsap.to(portalBtn, { scale: 1, duration: 0.2 });
            gsap.to(btnGlow, { opacity: 0.5, duration: 0.2 });
        });
        
        // Don't auto-complete - wait for user click
        return new Promise(() => {}); // Intentionally never resolves
    }

    // =========================================
    // PARTICLE PHYSICS ENGINE - COMPLETELY REWRITTEN
    // =========================================
    spawnParticles(count) {
        // Initialize ring state FIRST
        this.ringCenter = { x: this.canvas.width / 2, y: this.canvas.height / 2 };
        this.ringRadius = 80;
        
        this.particles = [];
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            // Enhanced color variation - teal to cyan range with occasional accent particles
            const isAccent = Math.random() < 0.1; // 10% accent particles
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: Math.random() * 2.5 + 1,
                opacity: Math.random() * 0.4 + 0.2,
                hue: isAccent ? (150 + Math.random() * 60) : (168 + Math.random() * 25), // Wider range for accents
                saturation: isAccent ? 80 : (60 + Math.random() * 30), // Vary saturation
                lightness: 45 + Math.random() * 15, // Vary lightness
                baseAngle: angle,
                angleOffset: (Math.random() - 0.5) * 0.3
            });
        }
    }
    
    // Set the ring center (called when logo appears)
    setRingTarget(centerX, centerY, radius) {
        this.ringCenter = { x: centerX, y: centerY };
        this.ringRadius = radius;
    }
    
    // Scatter particles back to chaos
    scatterParticles() {
        this.particles.forEach(p => {
            p.vx = (Math.random() - 0.5) * 6;
            p.vy = (Math.random() - 0.5) * 6;
        });
        this.mode = 'scatter';
        setTimeout(() => { this.mode = 'ambient'; }, 500);
    }

    startLivingLoop() {
        const loop = () => {
            if (!this.ctx) return;
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Skip if particles not yet spawned
            if (!this.particles || this.particles.length === 0) {
                this.animationFrameId = requestAnimationFrame(loop);
                return;
            }
            
            const cx = this.ringCenter?.x || this.canvas.width / 2;
            const cy = this.ringCenter?.y || this.canvas.height / 2;
            const time = Date.now() * 0.001;
            
            this.particles.forEach((p, i) => {
                
                if (this.mode === 'chaos') {
                    // Random floating
                    p.vx += (Math.random() - 0.5) * 0.4;
                    p.vy += (Math.random() - 0.5) * 0.4;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                    
                } else if (this.mode === 'converge') {
                    // Aggressively pull toward center point (will be hidden behind logo)
                    const dx = cx - p.x;
                    const dy = cy - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    // Strong pull - particles should reach center quickly
                    const force = 0.04 + (1 - Math.min(dist / 300, 1)) * 0.06;
                    p.vx += dx * force;
                    p.vy += dy * force;
                    p.vx *= 0.88;
                    p.vy *= 0.88;
                    
                    // Shrink particles as they get closer to center (fade behind logo)
                    p.convergeScale = Math.max(0.1, Math.min(dist / 150, 1));
                    
                } else if (this.mode === 'ring') {
                    // Reset scale for ring mode
                    p.convergeScale = 1;
                    // Target position on ring with gentle wobble
                    const wobble = Math.sin(time * 2 + i * 0.5) * 3;
                    const angle = p.baseAngle + p.angleOffset + time * 0.1;
                    const targetR = this.ringRadius + wobble;
                    
                    const targetX = cx + Math.cos(angle) * targetR;
                    const targetY = cy + Math.sin(angle) * targetR;
                    
                    const dx = targetX - p.x;
                    const dy = targetY - p.y;
                    
                    // Spring physics toward target
                    p.vx += dx * 0.08;
                    p.vy += dy * 0.08;
                    p.vx *= 0.85;
                    p.vy *= 0.85;
                    
                    // Tiny jitter for "alive" feeling
                    p.vx += (Math.random() - 0.5) * 0.3;
                    p.vy += (Math.random() - 0.5) * 0.3;
                    
                } else if (this.mode === 'scatter') {
                    // Just apply velocity with drag
                    p.vx *= 0.96;
                    p.vy *= 0.96;
                    
                } else if (this.mode === 'ambient') {
                    // Gentle floating
                    p.vx += (Math.random() - 0.5) * 0.15;
                    p.vy += (Math.random() - 0.5) * 0.15;
                    p.vx *= 0.99;
                    p.vy *= 0.99;
                }
                
                p.x += p.vx;
                p.y += p.vy;
                
                // Wrap edges in chaos/ambient/scatter modes
                if (this.mode === 'chaos' || this.mode === 'ambient' || this.mode === 'scatter') {
                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;
                }
                
                // Render - brighter when in ring mode, fade during converge
                const scale = p.convergeScale || 1;
                const bright = this.mode === 'ring' ? 0.6 : (this.mode === 'converge' ? 0.5 * scale : p.opacity);
                const size = p.size * scale;
                
                // Use particle's individual color properties for variation
                const sat = p.saturation || 75;
                const light = p.lightness || 60;
                
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
                this.ctx.fillStyle = `hsla(${p.hue}, ${sat}%, ${light}%, ${bright})`;
                this.ctx.fill();
            });
            
            this.animationFrameId = requestAnimationFrame(loop);
        };
        loop();
    }

    fireConfetti(canvas) {
        const ctx = canvas.getContext('2d');
        const confetti = [];
        // Clinical celebration colors - teal, cyan, green, amber, soft purple
        const colors = ['#0D9488', '#0891B2', '#10B981', '#FBBF24', '#7C3AED', '#14B8A6'];
        
        for (let i = 0; i < 150; i++) {
            confetti.push({
                x: canvas.width / 2 + (Math.random() - 0.5) * 100,
                y: canvas.height / 2,
                vx: (Math.random() - 0.5) * 20,
                vy: Math.random() * -18 - 8,
                size: Math.random() * 8 + 4,
                rotation: Math.random() * 360,
                rotationSpeed: (Math.random() - 0.5) * 12,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: 1
            });
        }
        
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            let active = 0;
            confetti.forEach(c => {
                if (c.opacity <= 0) return;
                active++;
                
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation * Math.PI / 180);
                ctx.fillStyle = c.color;
                ctx.globalAlpha = c.opacity;
                ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
                ctx.restore();
                
                c.x += c.vx;
                c.y += c.vy;
                c.vy += 0.4;
                c.vx *= 0.99;
                c.rotation += c.rotationSpeed;
                
                if (c.y > canvas.height + 20) c.opacity -= 0.03;
            });
            
            if (active > 0) requestAnimationFrame(animate);
        };
        
        animate();
    }

    playSfx(name) {
        if (this.audioController) {
            this.audioController.playSfx(name);
        }
    }

    skip() {
        // Confirmation modal to prevent accidental skips
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; inset: 0; z-index: 2000000;
            background: rgba(0,0,0,0.55); backdrop-filter: blur(6px);
            display: flex; align-items: center; justify-content: center;
            padding: 16px;
        `;
        overlay.innerHTML = `
            <div style="
                width: 360px; max-width: 90%;
                background: #0F172A; color: #E2E8F0;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 14px; box-shadow: 0 18px 50px rgba(0,0,0,0.45);
                padding: 22px;
                font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            ">
                <h3 style="margin: 0 0 10px; font-size: 17px; color: #F8FAFC;">Skip the intro?</h3>
                <p style="margin: 0 0 16px; font-size: 14px; line-height: 1.6; color: #CBD5E1;">
                    You'll still need to complete the guided tour to finish onboarding.
                </p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-cancel" style="
                        padding: 10px 14px; border-radius: 10px;
                        border: 1px solid rgba(255,255,255,0.15);
                        background: transparent; color: #E2E8F0; cursor: pointer;
                    ">Keep watching</button>
                    <button class="btn-confirm" style="
                        padding: 10px 14px; border-radius: 10px;
                        border: none; background: linear-gradient(135deg, #0D9488, #0F766E);
                        color: #fff; cursor: pointer;
                    ">Skip intro</button>
                </div>
            </div>
        `;

        const cleanupModal = () => overlay.remove();
        const confirmBtn = overlay.querySelector('.btn-confirm');
        const cancelBtn = overlay.querySelector('.btn-cancel');
        cancelBtn.addEventListener('click', cleanupModal);
        confirmBtn.addEventListener('click', () => {
            cleanupModal();
            console.log('[Intro] Skipped');
            this.cleanup();
            if (window.OnboardingState) OnboardingState.update({ skippedIntro: true });
            if (window.OnboardingEvents) OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_SKIPPED);
            // Let first-login-flow continue to the tour
            window.dispatchEvent(new CustomEvent('ccpro:introComplete', { detail: { skipped: true } }));
        });

        document.body.appendChild(overlay);
    }

    complete() {
        console.log('[Intro] Complete');
        this.cleanup();
        if (window.OnboardingState) OnboardingState.update({ seenIntro: true });
        if (window.OnboardingEvents) OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_COMPLETED);
        
        // Mark onboarding as complete for first-login flow
        localStorage.setItem('ccpro-onboarding-complete', 'true');
        
        // Always dispatch completion so first-login-flow can continue
        window.dispatchEvent(new CustomEvent('ccpro:introComplete', { detail: { skipped: false } }));
        
        // Check if agreement still needs to be shown (first-login flow handles navigation)
        const agreementNeeded = localStorage.getItem('ccpro-agreement-accepted') !== 'true';
        if (!agreementNeeded) {
            // Navigate to dashboard directly (for replay or already-agreed users)
            this.navigateToDashboard();
        } else {
            console.log('[Intro] Agreement pending, deferring navigation to first-login flow');
        }
    }
    
    navigateToDashboard() {
        console.log('[Intro] Navigating to dashboard...');
        
        // Try multiple methods to ensure we get to dashboard
        if (window.ccShell?.navigateTo) {
            window.ccShell.navigateTo('dashboard');
        } else if (typeof window.showDashboard === 'function') {
            window.showDashboard();
        } else {
            // Click dashboard nav button
            const dashboardNav = document.querySelector('[data-nav-target="dashboard"]');
            if (dashboardNav) {
                dashboardNav.click();
            }
        }
        
        // Ensure main app is visible
        const mainApp = document.getElementById('mainApp');
        if (mainApp) {
            mainApp.style.display = 'block';
            mainApp.style.visibility = 'visible';
        }
        
        // Show success notification
        if (window.showNotification) {
            window.showNotification('Welcome to CareConnect Pro! ≡🎯ë', 'success');
        }
    }

    cleanup() {
        if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
        if (this.keyHandler) document.removeEventListener('keydown', this.keyHandler);
        
        if (this.container) {
            gsap.to(this.container, {
                opacity: 0,
                duration: 0.8,
                onComplete: () => {
                    this.container?.remove();
                    this.container = null;
                }
            });
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.OnboardingIntro = OnboardingIntro;
}


