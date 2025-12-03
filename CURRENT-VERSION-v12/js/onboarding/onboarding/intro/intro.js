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
            overflow: hidden;
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
                opacity: 0.4;
                background-image: url('data:image/svg+xml,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="4" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23n)" opacity="0.08"/></svg>');
                pointer-events: none;
            "></div>
            <div class="layer-vignette" style="
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%);
                pointer-events: none;
            "></div>
            
            <!-- Layer 5: Progress & Controls -->
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
                    overflow: hidden;
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

    async playDirectorsCut() {
        const stage = this.container.querySelector('.layer-stage');
        
        // Scene 1: The Chaos (Problem Statement)
        this.updateProgress(0);
        await this.sceneChaosToOrder(stage);
        
        // Scene 2: The Sanctuary (Dashboard Overview)
        this.updateProgress(16);
        await this.sceneSanctuary(stage);
        
        // Scene 3: The River (Client Journey)
        this.updateProgress(33);
        await this.sceneTheRiver(stage);
        
        // Scene 4: Gravity (Flight Plan)
        this.updateProgress(50);
        await this.sceneGravity(stage);
        
        // Scene 5: The World (Programs & Map)
        this.updateProgress(66);
        await this.sceneTheWorld(stage);
        
        // Scene 6: Transcendence (Ready)
        this.updateProgress(83);
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
        
        // Spawn chaotic particles
        this.mode = 'chaos';
        // Reduced particle count for cleaner, more clinical feel
        this.spawnParticles(150);
        
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
            <h1 style="
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
        
        // Let them feel the chaos
        tl.to({}, { duration: 3 });
        
        // Fade out chaos text
        tl.to(chaosText, { opacity: 0, y: -30, duration: 1.5, ease: 'power2.in' });
        
        // Transition particles to order
        tl.call(() => {
            this.mode = 'converge';
            this.playSfx('whoosh');
        });
        
        // Wait for particles to converge
        tl.to({}, { duration: 2 });
        
        // Create the logo reveal
        const logoContainer = document.createElement('div');
        logoContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            opacity: 0;
            transform: scale(0.8);
        `;
        logoContainer.innerHTML = `
            <div class="glass-strong" style="
                width: 100px;
                height: 100px;
                border-radius: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 48px;
                animation: breathe 4s ease-in-out infinite;
            ">🏥</div>
            <h1 style="
                font-size: 2.8rem;
                font-weight: 300;
                color: ${this.colors.text};
                margin-top: 30px;
                letter-spacing: -0.02em;
            ">Care<span style="font-weight: 700;">Connect</span> <span style="color: ${this.colors.primary}; font-size: 1.2rem; vertical-align: super;">PRO</span></h1>
            <p style="
                font-size: 1rem;
                color: ${this.colors.muted};
                margin-top: 12px;
                letter-spacing: 0.5px;
            ">Your sanctuary of clarity</p>
        `;
        stage.appendChild(logoContainer);
        
        // Reveal logo
        tl.to(logoContainer, { 
            opacity: 1, 
            scale: 1, 
            duration: 2, 
            ease: this.ease.bounce 
        });
        
        tl.call(() => this.playSfx('chime'));
        
        // Particles form a ring around logo
        tl.call(() => { this.mode = 'orbit'; });
        
        // Hold on logo
        tl.to({}, { duration: 3 });
        
        // Transition out
        tl.to([chaosText, logoContainer], { 
            opacity: 0, 
            scale: 1.05, 
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
        
        // Scene label
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
            z-index: 10;
        `;
        label.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase;">Your Daily Command Center</div>
            <h2 style="font-size: 2rem; font-weight: 600; color: ${this.colors.text}; margin-top: 8px;">The Dashboard</h2>
        `;
        stage.appendChild(label);
        
        // Dashboard mockup - EXPANDED with all widgets
        const dashboard = document.createElement('div');
        dashboard.className = 'glass';
        dashboard.style.cssText = `
            width: 1000px;
            max-width: 92vw;
            height: 520px;
            border-radius: 20px;
            transform: rotateX(12deg) translateY(40px) scale(0.78);
            opacity: 0;
            overflow: hidden;
            display: flex;
            flex-direction: column;
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
                    <div class="hdr-btn" style="padding: 4px 10px; background: rgba(255,255,255,0.04); border-radius: 5px; font-size: 9px; color: ${this.colors.muted}; opacity: 0;">🔔</div>
                    <div class="hdr-btn" style="padding: 4px 10px; background: rgba(13, 148, 136, 0.15); border-radius: 5px; font-size: 9px; color: ${this.colors.primary}; opacity: 0;">☀️</div>
                </div>
            </div>
            
            <!-- Dashboard Content -->
            <div style="flex: 1; padding: 10px; display: flex; flex-direction: column; gap: 8px; overflow: hidden;">
            
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
                        <div class="qbtn" style="padding: 5px 8px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 5px; font-size: 8px; color: white; opacity: 0; transform: scale(0.9);">➕ Client</div>
                        <div class="qbtn" style="padding: 5px 8px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 5px; font-size: 8px; color: white; opacity: 0; transform: scale(0.9);">📄 Doc</div>
                        <div class="qbtn" style="padding: 5px 8px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 5px; font-size: 8px; color: white; opacity: 0; transform: scale(0.9);">🌅 Review</div>
                    </div>
                </div>
                
                <!-- Main Widget Grid -->
                <div style="flex: 1; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: auto auto auto; gap: 8px;">
                
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
                                <div style="height: 4px; background: rgba(255,255,255,0.08); border-radius: 2px; overflow: hidden;">
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
                        <div style="font-size: 9px; letter-spacing: 2px; color: ${this.colors.primary}; text-transform: uppercase;">✨ Program Spotlight</div>
                        <div style="font-size: 7px; padding: 2px 6px; background: rgba(16, 185, 129, 0.2); color: #10B981; border-radius: 4px;">Featured</div>
                    </div>
                    <div class="spotlight-content" style="opacity: 0; transform: translateY(8px);">
                        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary}); border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px;">🏔️</div>
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
            
            // Highlight this widget with dramatic effect
            tl.to(widget, { 
                opacity: 1, 
                scale: 1.05, 
                filter: 'blur(0px)',
                boxShadow: `0 0 40px ${this.colors.primary}60, 0 0 80px ${this.colors.primary}30, inset 0 0 20px rgba(255,255,255,0.05)`,
                border: `1px solid ${this.colors.primary}50`,
                duration: 0.6,
                ease: 'power2.out'
            }, offset);
            
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
        
        // Transition out
        tl.to([label, dashboard, caption], { 
            opacity: 0, 
            y: -40, 
            filter: 'blur(8px)', 
            duration: 1.2 
        });
        tl.call(() => { 
            label.remove(); 
            dashboard.remove(); 
            caption.remove(); 
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
                        overflow: hidden;
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
            { text: 'RR overdue – Mason', zone: 'red' },
            { text: 'Parent call – Wyatt', zone: 'red' },
            { text: 'Risk follow-up – Emma', zone: 'red' },
            { text: 'RR due Wed – Liam', zone: 'purple' },
            { text: 'Aftercare planning – Olivia', zone: 'purple' },
            { text: '30-day review – Noah', zone: 'yellow' },
            { text: 'Parent session – Ava', zone: 'yellow' },
            { text: 'Weekly check-in – Sophia', zone: 'green' },
            { text: 'Documentation – Jackson', zone: 'green' }
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
            <span style="font-size: 20px;">🎯</span>
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
    // SCENE 5: THE WORLD (Programs & Map)
    // Cinematic map exploration
    // =========================================
    async sceneTheWorld(stage) {
        console.log('[Intro] Scene 5: The World');
        
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            text-align: center;
            opacity: 0;
            z-index: 10;
        `;
        label.innerHTML = `
            <div style="font-size: 11px; letter-spacing: 4px; color: ${this.colors.primary}; text-transform: uppercase;">Find The Right Fit</div>
            <h2 style="font-size: 2rem; font-weight: 600; color: ${this.colors.text}; margin-top: 8px;">Programs & Map</h2>
        `;
        stage.appendChild(label);
        
        // Map container
        const mapFrame = document.createElement('div');
        mapFrame.className = 'glass';
        mapFrame.style.cssText = `
            width: 1000px;
            max-width: 90vw;
            height: 500px;
            border-radius: 20px;
            overflow: hidden;
            display: flex;
            transform: scale(0.9);
            opacity: 0;
        `;
        
        const programs = [
            { name: 'Newport Academy', x: 18, y: 32 },
            { name: 'Elevations RTC', x: 45, y: 25 },
            { name: 'Paradigm', x: 72, y: 35 },
            { name: 'Visions', x: 25, y: 58 },
            { name: 'ViewPoint', x: 55, y: 55 },
            { name: 'Sunrise', x: 78, y: 50 },
            { name: 'Discovery Ranch', x: 38, y: 72 }
        ];
        
        mapFrame.innerHTML = `
            <!-- Filters Sidebar -->
            <div class="map-filters" style="
                width: 220px;
                background: rgba(0,0,0,0.4);
                border-right: 1px solid rgba(255,255,255,0.05);
                padding: 20px;
                transform: translateX(-100%);
            ">
                <div style="font-size: 14px; font-weight: 600; color: ${this.colors.text}; margin-bottom: 16px;">Filters</div>
                
                <div class="filter-group" style="margin-bottom: 16px; opacity: 0;">
                    <div style="font-size: 10px; letter-spacing: 1px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 8px;">Level of Care</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${['RTC', 'PHP', 'IOP'].map((loc, i) => `
                            <div style="
                                padding: 5px 12px;
                                background: ${i === 0 ? 'rgba(13, 148, 136, 0.3)' : 'rgba(255,255,255,0.05)'};
                                border: 1px solid ${i === 0 ? this.colors.primary : 'rgba(255,255,255,0.1)'};
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${i === 0 ? this.colors.primary : this.colors.muted};
                            ">${loc}</div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="filter-group" style="opacity: 0;">
                    <div style="font-size: 10px; letter-spacing: 1px; color: ${this.colors.muted}; text-transform: uppercase; margin-bottom: 8px;">State</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${['Utah', 'CA', 'AZ'].map(s => `
                            <div style="
                                padding: 5px 12px;
                                background: rgba(255,255,255,0.05);
                                border: 1px solid rgba(255,255,255,0.1);
                                border-radius: 15px;
                                font-size: 11px;
                                color: ${this.colors.muted};
                            ">${s}</div>
                        `).join('')}
                    </div>
                </div>
            </div>
            
            <!-- Map Area -->
            <div class="map-area" style="
                flex: 1;
                position: relative;
                background: 
                    radial-gradient(circle at 30% 40%, rgba(13, 148, 136, 0.12) 0%, transparent 40%),
                    radial-gradient(circle at 70% 60%, rgba(16, 185, 129, 0.10) 0%, transparent 40%),
                    linear-gradient(180deg, #1E293B 0%, #0F172A 100%);
            ">
                <!-- Grid -->
                <div style="
                    position: absolute;
                    inset: 0;
                    background-image: 
                        linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
                    background-size: 60px 60px;
                "></div>
                
                <!-- Search Radius -->
                <div class="search-radius" style="
                    position: absolute;
                    left: 50%;
                    top: 50%;
                    width: 0;
                    height: 0;
                    border: 2px solid ${this.colors.primary};
                    border-radius: 50%;
                    transform: translate(-50%, -50%);
                    opacity: 0;
                    box-shadow: 0 0 30px ${this.colors.primary}40;
                "></div>
                
                <!-- Pins -->
                ${programs.map((p, i) => `
                    <div class="map-pin" style="
                        position: absolute;
                        left: ${p.x}%;
                        top: ${p.y}%;
                        transform: translate(-50%, -100%) translateY(-80px);
                        opacity: 0;
                        z-index: ${10 + i};
                    ">
                        <div style="
                            width: 32px;
                            height: 32px;
                            background: ${this.colors.primary};
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-shadow: 0 4px 15px ${this.colors.primary}60;
                        ">
                            <span style="transform: rotate(45deg); font-size: 14px;">🏥</span>
                        </div>
                        <div class="pin-label" style="
                            position: absolute;
                            top: 100%;
                            left: 50%;
                            transform: translateX(-50%);
                            margin-top: 8px;
                            padding: 4px 10px;
                            background: rgba(0,0,0,0.9);
                            border-radius: 4px;
                            font-size: 10px;
                            color: white;
                            white-space: nowrap;
                            opacity: 0;
                        ">${p.name}</div>
                    </div>
                `).join('')}
            </div>
            
            <!-- Program Card Sidebar -->
            <div class="program-sidebar" style="
                width: 280px;
                background: rgba(0,0,0,0.4);
                border-left: 1px solid rgba(255,255,255,0.05);
                padding: 20px;
                transform: translateX(100%);
            ">
                <div class="program-card glass" style="
                    border-radius: 14px;
                    overflow: hidden;
                    opacity: 0;
                    transform: translateY(20px);
                ">
                    <div style="
                        height: 100px;
                        background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 2.5rem;
                    ">🏔️</div>
                    <div style="padding: 16px;">
                        <h4 style="color: ${this.colors.text}; font-size: 15px; margin: 0 0 4px 0;">Elevations RTC</h4>
                        <p style="color: ${this.colors.muted}; font-size: 11px; margin: 0 0 12px 0;">Syracuse, UT • RTC • Ages 13-18</p>
                        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 14px;">
                            ${['Trauma', 'Anxiety', 'Depression'].map(t => `
                                <span style="padding: 3px 8px; background: ${this.colors.primary}20; border-radius: 10px; color: ${this.colors.primary}; font-size: 9px;">${t}</span>
                            `).join('')}
                        </div>
                        <button class="add-btn" style="
                            width: 100%;
                            padding: 10px;
                            background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-size: 12px;
                            font-weight: 600;
                            cursor: pointer;
                        ">+ Add to Plan</button>
                    </div>
                </div>
            </div>
        `;
        stage.appendChild(mapFrame);
        
        const tl = gsap.timeline();
        
        // Label
        tl.to(label, { opacity: 1, duration: 1 });
        
        // Frame appears
        tl.to(mapFrame, { opacity: 1, scale: 1, duration: 1.5, ease: this.ease.lux });
        
        // Filters slide in
        const filters = mapFrame.querySelector('.map-filters');
        tl.to(filters, { x: 0, duration: 0.8, ease: this.ease.lux });
        tl.to(filters.querySelectorAll('.filter-group'), { opacity: 1, duration: 0.5, stagger: 0.15 }, '-=0.4');
        
        // Search radius expands
        const radius = mapFrame.querySelector('.search-radius');
        tl.to(radius, { width: '70%', height: '70%', opacity: 0.6, duration: 1.5, ease: 'power2.out' });
        tl.to(radius, { opacity: 0, duration: 0.5 });
        
        // Pins drop
        const pins = mapFrame.querySelectorAll('.map-pin');
        pins.forEach((pin, i) => {
            tl.to(pin, {
                y: 0,
                opacity: 1,
                duration: 0.6,
                ease: 'bounce.out',
                onStart: () => { if (i % 2 === 0) this.playSfx('pop'); }
            }, `-=${i === 0 ? 0 : 0.45}`);
        });
        
        // Sidebar slides in
        const sidebar = mapFrame.querySelector('.program-sidebar');
        tl.to(sidebar, { x: 0, duration: 0.8, ease: this.ease.lux }, '-=0.5');
        
        // Highlight a pin
        const targetPin = pins[1];
        tl.to(targetPin.querySelector('div'), { scale: 1.2, boxShadow: `0 8px 30px ${this.colors.primary}80`, duration: 0.4 });
        tl.to(targetPin.querySelector('.pin-label'), { opacity: 1, duration: 0.3 }, '-=0.2');
        
        // Card appears
        const card = mapFrame.querySelector('.program-card');
        tl.to(card, { opacity: 1, y: 0, duration: 0.6 });
        
        // Button pulse
        const addBtn = card.querySelector('.add-btn');
        tl.to(addBtn, { scale: 1.05, duration: 0.4, repeat: 1, yoyo: true });
        
        // Click
        tl.call(() => this.playSfx('click'));
        tl.to(addBtn, { background: `linear-gradient(135deg, ${this.colors.accent}, #059669)`, duration: 0.2 });
        tl.set(addBtn, { innerHTML: '✓ Added' });
        
        // Hold
        tl.to({}, { duration: 2 });
        
        // Transition
        tl.to([label, mapFrame], { opacity: 0, scale: 1.02, filter: 'blur(8px)', duration: 1 });
        tl.call(() => { label.remove(); mapFrame.remove(); });
        
        return new Promise(r => tl.eventCallback('onComplete', r));
    }

    // =========================================
    // SCENE 6: TRANSCENDENCE (Ready)
    // Emotional finale with celebration
    // =========================================
    async sceneTranscendence(stage) {
        console.log('[Intro] Scene 6: Transcendence');
        
        // Confetti canvas
        const confettiCanvas = document.createElement('canvas');
        confettiCanvas.style.cssText = 'position: absolute; inset: 0; pointer-events: none;';
        confettiCanvas.width = window.innerWidth;
        confettiCanvas.height = window.innerHeight;
        stage.appendChild(confettiCanvas);
        
        // Content
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
            <!-- Success orb -->
            <div class="success-orb" style="
                width: 110px;
                height: 110px;
                border-radius: 50%;
                background: linear-gradient(135deg, ${this.colors.accent}, #059669);
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 20px 60px rgba(16, 185, 129, 0.4);
                transform: scale(0);
            ">
                <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" class="check-mark" style="stroke-dasharray: 50; stroke-dashoffset: 50;">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            </div>
            
            <!-- Title -->
            <h1 class="ready-title" style="
                font-size: 3.5rem;
                font-weight: 300;
                color: ${this.colors.text};
                margin-top: 36px;
                opacity: 0;
                transform: translateY(20px);
            ">You're <strong style="font-weight: 700;">Ready</strong></h1>
            
            <!-- Subtitle -->
            <p class="ready-sub" style="
                font-size: 1.1rem;
                color: ${this.colors.muted};
                margin-top: 16px;
                max-width: 420px;
                line-height: 1.7;
                opacity: 0;
                transform: translateY(20px);
            ">Run your day from one screen.<br>Track the journey. Clear your flight plan. Find the right programs.</p>
            
            <!-- CTA -->
            <button class="cta-btn" style="
                margin-top: 36px;
                padding: 16px 40px;
                background: linear-gradient(135deg, ${this.colors.primary}, ${this.colors.secondary});
                border: none;
                border-radius: 14px;
                color: white;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                opacity: 0;
                transform: translateY(20px);
                box-shadow: 0 15px 40px rgba(13, 148, 136, 0.4);
                transition: transform 0.2s, box-shadow 0.2s;
            ">Start with your Dashboard →</button>
        `;
        stage.appendChild(content);
        
        const tl = gsap.timeline();
        
        // Content fades in
        tl.to(content, { opacity: 1, scale: 1, duration: 1, ease: this.ease.lux });
        
        // Orb pops
        const orb = content.querySelector('.success-orb');
        tl.to(orb, { scale: 1, duration: 0.8, ease: this.ease.bounce, onStart: () => this.playSfx('success') }, '-=0.5');
        
        // Checkmark draws
        const check = content.querySelector('.check-mark');
        tl.to(check, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.out' });
        
        // Confetti
        tl.call(() => this.fireConfetti(confettiCanvas));
        
        // Title
        tl.to(content.querySelector('.ready-title'), { opacity: 1, y: 0, duration: 0.8, ease: this.ease.lux }, '-=0.3');
        
        // Subtitle
        tl.to(content.querySelector('.ready-sub'), { opacity: 1, y: 0, duration: 0.8, ease: this.ease.lux }, '-=0.5');
        
        // CTA
        const cta = content.querySelector('.cta-btn');
        tl.to(cta, { opacity: 1, y: 0, duration: 0.8, ease: this.ease.lux }, '-=0.5');
        
        // CTA pulse - clinical teal glow
        tl.to(cta, {
            scale: 1.03,
            boxShadow: '0 20px 50px rgba(13, 148, 136, 0.5)',
            duration: 0.8,
            repeat: -1,
            yoyo: true,
            ease: 'power2.inOut'
        });
        
        // Bind CTA click
        cta.addEventListener('click', () => this.complete());
        cta.addEventListener('mouseenter', () => gsap.to(cta, { scale: 1.05, duration: 0.2 }));
        cta.addEventListener('mouseleave', () => gsap.to(cta, { scale: 1, duration: 0.2 }));
        
        // Don't auto-complete - wait for user
        return new Promise(() => {}); // Intentionally never resolves
    }

    // =========================================
    // PARTICLE PHYSICS ENGINE
    // =========================================
    spawnParticles(count) {
        this.particles = [];
        // Clinical teal/cyan color range (170-190 hue)
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 1.5, // Slower movement
                vy: (Math.random() - 0.5) * 1.5,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.25 + 0.05, // More subtle
                hue: 170 + Math.random() * 20 // Teal/cyan range
            });
        }
    }

    startLivingLoop() {
        const loop = () => {
            if (!this.ctx) return;
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            const cx = this.canvas.width / 2;
            const cy = this.canvas.height / 2;
            
            this.particles.forEach(p => {
                // Physics based on mode
                if (this.mode === 'chaos') {
                    p.vx += (Math.random() - 0.5) * 0.5;
                    p.vy += (Math.random() - 0.5) * 0.5;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                } else if (this.mode === 'converge') {
                    const dx = cx - p.x;
                    const dy = cy - p.y;
                    p.vx += dx * 0.003;
                    p.vy += dy * 0.003;
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                } else if (this.mode === 'orbit') {
                    const dx = cx - p.x;
                    const dy = cy - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const targetDist = 150 + (p.size * 30);
                    const force = (targetDist - dist) * 0.01;
                    p.vx += (dx / dist) * force - dy * 0.002;
                    p.vy += (dy / dist) * force + dx * 0.002;
                    p.vx *= 0.98;
                    p.vy *= 0.98;
                } else if (this.mode === 'ambient') {
                    p.vx += (Math.random() - 0.5) * 0.1;
                    p.vy += (Math.random() - 0.5) * 0.1;
                    p.vx *= 0.99;
                    p.vy *= 0.99;
                }
                
                p.x += p.vx;
                p.y += p.vy;
                
                // Wrap edges
                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;
                
                // Render
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${p.opacity})`;
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
        console.log('[Intro] Skipped');
        this.cleanup();
        if (window.OnboardingState) OnboardingState.update({ skippedIntro: true });
        if (window.OnboardingEvents) OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_SKIPPED);
    }

    complete() {
        console.log('[Intro] Complete');
        this.cleanup();
        if (window.OnboardingState) OnboardingState.update({ seenIntro: true });
        if (window.OnboardingEvents) OnboardingEvents.emit(OnboardingEvents.EVENTS.INTRO_COMPLETED);
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
