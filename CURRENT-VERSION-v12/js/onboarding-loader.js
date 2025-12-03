/**
 * Onboarding Loader
 * 
 * This script loads the onboarding system and injects the Help menu
 * into the existing CareConnect Pro interface.
 */

(function() {
    'use strict';
    
    console.log('[Onboarding Loader] Starting...');
    
    // Load GSAP locally (needed for animations)
    function loadGSAP() {
        return new Promise((resolve, reject) => {
            if (window.gsap) {
                console.log('[Onboarding Loader] GSAP already loaded');
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            // Load from local libs folder to comply with CSP
            script.src = 'libs/gsap.min.js';
            script.onload = () => {
                console.log('[Onboarding Loader] GSAP loaded from local');
                resolve();
            };
            script.onerror = () => {
                console.error('[Onboarding Loader] GSAP failed to load from libs/gsap.min.js');
                resolve(); // Continue anyway but animations won't work
            };
            document.head.appendChild(script);
        });
    }
    
    // Load CSS
    function loadCSS() {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'css/onboarding.css';
        document.head.appendChild(link);
        console.log('[Onboarding Loader] CSS loaded');
    }
    
    // Load a script and return a promise
    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = resolve;
            script.onerror = reject;
            document.body.appendChild(script);
        });
    }
    
    // Load all onboarding scripts in order
    async function loadOnboardingScripts() {
        const scripts = [
            // Core
            'js/onboarding/core/state.js',
            'js/onboarding/core/events.js',
            // Intro engine (Director pattern)
            'js/onboarding/intro/engine/AudioController.js',
            'js/onboarding/intro/engine/Director.js',
            'js/onboarding/intro/engine/Scene.js',
            // SVG utilities
            'js/onboarding/intro/SVGDrawer.js',
            // V4 Scenes (Hand-Drawn Warmth)
            'js/onboarding/intro/scenes/ChaosScene.js',
            'js/onboarding/intro/scenes/QuestionScene.js',
            'js/onboarding/intro/scenes/LogoScene.js',
            'js/onboarding/intro/scenes/DashboardSceneV4.js',
            'js/onboarding/intro/scenes/FlightPlanSceneV4.js',
            'js/onboarding/intro/scenes/ProgramsSceneV4.js',
            'js/onboarding/intro/scenes/MapSceneV4.js',
            'js/onboarding/intro/scenes/DocumentSceneV4.js',
            'js/onboarding/intro/scenes/ReturnScene.js',
            'js/onboarding/intro/scenes/ReadySceneV4.js',
            // Main intro (V4)
            'js/onboarding/intro/intro-v4.js',
            // Legacy intro (fallback)
            'js/onboarding/intro/particles.js',
            'js/onboarding/intro/cursor.js',
            'js/onboarding/intro/svg-draw.js',
            'js/onboarding/intro/intro.js',
            // Tours
            'js/onboarding/tour/engine.js',
            'js/onboarding/tour/dashboard-tour.js',
            'js/onboarding/tour/programs-tour.js',
            'js/onboarding/tour/docbuilder-tour.js',
            // Checklist
            'js/onboarding/checklist/config.js',
            'js/onboarding/checklist/checklist.js',
            // Demo data
            'js/onboarding/demo-data/demo-clients.js',
            // Controller (must be last)
            'js/onboarding/core/controller.js'
        ];
        
        for (const src of scripts) {
            try {
                await loadScript(src);
                console.log('[Onboarding Loader] Loaded:', src);
            } catch (e) {
                console.error('[Onboarding Loader] Failed to load:', src, e);
            }
        }
    }
    
    // Inject the Help menu button into the toolbar
    function injectHelpMenu() {
        // Find a good place to add the button - look for common toolbar elements
        const toolbar = document.querySelector('.app-header, .toolbar, header, .header-actions, .nav-actions');
        
        if (!toolbar) {
            console.warn('[Onboarding Loader] Could not find toolbar, adding floating button instead');
            injectFloatingButton();
            return;
        }
        
        // Create the help button
        const helpContainer = document.createElement('div');
        helpContainer.className = 'onboarding-help-container';
        helpContainer.style.cssText = 'position: relative; margin-left: 12px; display: inline-block;';
        helpContainer.innerHTML = getHelpMenuHTML();
        
        toolbar.appendChild(helpContainer);
        console.log('[Onboarding Loader] Help menu injected into toolbar');
        
        setupHelpMenuEvents(helpContainer);
    }
    
    // Fallback: inject a floating help button
    function injectFloatingButton() {
        const container = document.createElement('div');
        container.className = 'onboarding-help-floating';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 99998;
        `;
        container.innerHTML = getHelpMenuHTML();
        
        document.body.appendChild(container);
        console.log('[Onboarding Loader] Floating help button added');
        
        setupHelpMenuEvents(container);
    }
    
    // Get the Help menu HTML
    function getHelpMenuHTML() {
        return `
            <button class="onboarding-help-trigger" id="onboardingHelpTrigger" 
                    style="
                        width: 48px;
                        height: 48px;
                        border-radius: 50%;
                        background: linear-gradient(135deg, #6366F1, #8B5CF6);
                        border: none;
                        color: white;
                        font-size: 20px;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(99, 102, 241, 0.4);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: transform 0.2s, box-shadow 0.2s;
                    "
                    title="Help & Onboarding"
                    onmouseover="this.style.transform='scale(1.1)'; this.style.boxShadow='0 6px 20px rgba(99, 102, 241, 0.5)';"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(99, 102, 241, 0.4)';">
                ❓
            </button>
            <div class="onboarding-help-dropdown" id="onboardingHelpDropdown" style="
                display: none;
                position: absolute;
                bottom: 100%;
                right: 0;
                margin-bottom: 12px;
                min-width: 280px;
                background: #ffffff;
                border-radius: 16px;
                box-shadow: 0 16px 48px rgba(15, 16, 32, 0.25);
                border: 1px solid #E2E8F0;
                overflow: hidden;
                z-index: 99999;
            ">
                <div style="padding: 16px 20px; background: linear-gradient(135deg, #6366F1, #8B5CF6); color: white;">
                    <div style="font-weight: 700; font-size: 16px;">Help & Onboarding</div>
                    <div style="font-size: 12px; opacity: 0.9; margin-top: 4px;">Learn how to use CareConnect Pro</div>
                </div>
                <div style="padding: 8px;">
                    <button class="help-menu-btn" onclick="console.log('Intro button clicked'); console.log('OnboardingIntro:', typeof window.OnboardingIntro); console.log('OnboardingController:', typeof window.OnboardingController); if(window.OnboardingController && window.OnboardingController.replayIntro){ window.OnboardingController.replayIntro().then(function(){console.log('Intro finished')}).catch(function(e){console.error('Intro error:',e)}); } else { console.error('Controller or replayIntro not found'); } document.getElementById('onboardingHelpDropdown').style.display='none';" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        width: 100%;
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        border-radius: 10px;
                        font-size: 14px;
                        color: #1E293B;
                        cursor: pointer;
                        text-align: left;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">🎬</span>
                        <div>
                            <div style="font-weight: 600;">Watch Intro Video</div>
                            <div style="font-size: 12px; color: #64748B;">2 min overview</div>
                        </div>
                    </button>
                    <button class="help-menu-btn" onclick="window.OnboardingController?.startTour('dashboard'); document.getElementById('onboardingHelpDropdown').style.display='none';" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        width: 100%;
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        border-radius: 10px;
                        font-size: 14px;
                        color: #1E293B;
                        cursor: pointer;
                        text-align: left;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">📊</span>
                        <div>
                            <div style="font-weight: 600;">Dashboard Tour</div>
                            <div style="font-size: 12px; color: #64748B;">Learn the dashboard</div>
                        </div>
                    </button>
                    <button class="help-menu-btn" onclick="window.OnboardingController?.startTour('programs'); document.getElementById('onboardingHelpDropdown').style.display='none';" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        width: 100%;
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        border-radius: 10px;
                        font-size: 14px;
                        color: #1E293B;
                        cursor: pointer;
                        text-align: left;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">🏥</span>
                        <div>
                            <div style="font-weight: 600;">Programs Tour</div>
                            <div style="font-size: 12px; color: #64748B;">Search & explore</div>
                        </div>
                    </button>
                    <button class="help-menu-btn" onclick="window.OnboardingController?.showChecklist(); document.getElementById('onboardingHelpDropdown').style.display='none';" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        width: 100%;
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        border-radius: 10px;
                        font-size: 14px;
                        color: #1E293B;
                        cursor: pointer;
                        text-align: left;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#F1F5F9'" onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">✅</span>
                        <div>
                            <div style="font-weight: 600;">Quick-Start Checklist</div>
                            <div style="font-size: 12px; color: #64748B;">Track your progress</div>
                        </div>
                    </button>
                </div>
                <div style="padding: 8px; border-top: 1px solid #E2E8F0;">
                    <button class="help-menu-btn" onclick="window.DemoClients?.clear().then(function(){ alert('Training data cleared!'); }); document.getElementById('onboardingHelpDropdown').style.display='none';" style="
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        width: 100%;
                        padding: 12px 16px;
                        background: none;
                        border: none;
                        border-radius: 10px;
                        font-size: 14px;
                        color: #EF4444;
                        cursor: pointer;
                        text-align: left;
                        transition: background 0.2s;
                    " onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='none'">
                        <span style="font-size: 18px;">🗑️</span>
                        <div>
                            <div style="font-weight: 600;">Clear Training Data</div>
                            <div style="font-size: 12px; color: #94A3B8;">Remove demo clients</div>
                        </div>
                    </button>
                </div>
            </div>
        `;
    }
    
    // Setup help menu click events
    function setupHelpMenuEvents(container) {
        const trigger = container.querySelector('#onboardingHelpTrigger');
        const dropdown = container.querySelector('#onboardingHelpDropdown');
        
        if (!trigger || !dropdown) {
            console.error('[Onboarding Loader] Help menu elements not found');
            return;
        }
        
        trigger.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const isOpen = dropdown.style.display === 'block';
            dropdown.style.display = isOpen ? 'none' : 'block';
            console.log('[Onboarding Loader] Help menu toggled:', !isOpen);
        });
        
        // Close on outside click
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        
        // Close on Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdown.style.display = 'none';
            }
        });
        
        console.log('[Onboarding Loader] Help menu events attached');
    }
    
    // Initialize everything
    async function init() {
        try {
            // Load CSS first
            loadCSS();
            
            // Load GSAP
            await loadGSAP();
            
            // Load onboarding scripts
            await loadOnboardingScripts();
            
            // Inject help menu
            injectFloatingButton(); // Use floating button for now - more reliable
            
            // Initialize the onboarding controller
            setTimeout(function() {
                if (window.OnboardingController) {
                    window.OnboardingController.initialize().then(function() {
                        console.log('[Onboarding Loader] Controller initialized');
                    }).catch(function(err) {
                        console.error('[Onboarding Loader] Controller init failed:', err);
                    });
                } else {
                    console.error('[Onboarding Loader] OnboardingController not found');
                }
            }, 1000);
            
            console.log('[Onboarding Loader] Initialization complete');
            
        } catch (error) {
            console.error('[Onboarding Loader] Initialization failed:', error);
        }
    }
    
    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

