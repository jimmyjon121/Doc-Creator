/**
 * Interactive Step-by-Step Coach Tour v3.0
 * Auto-advances when actions are completed
 */
(function() {
    'use strict';
    
    console.log('%c[Interactive Tour v3] Loading...', 'background: #0D9488; color: white; padding: 4px 8px; border-radius: 4px; font-size: 14px;');
    
    // =========================================================================
    // USER-SPECIFIC STORAGE
    // =========================================================================
    function getCurrentUsername() {
        // Try to get from auth manager first, then localStorage
        try {
            const user = window.authManager?.getCurrentUser?.();
            if (user && user.username) return user.username;
        } catch (e) {}
        return localStorage.getItem('username') || 'anonymous';
    }
    
    function getUserTourKey() {
        const username = getCurrentUsername();
        return `ccpro_tour_v3-${username.toLowerCase()}`;
    }
    
    // =========================================================================
    // TOUR STEPS - Rich content with WHY explanations
    // =========================================================================
    const STORAGE_KEY_BASE = 'ccpro_tour_v3';
    
    const TOUR_STEPS = [
        {
            id: 'journey',
            step: 1,
            title: 'Check Your Client Journey',
            description: 'The Journey Radar shows where each client is in their treatment timeline. Track progress from intake through discharge and beyond.',
            action: 'Click any colored stage box',
            benefit: '💡 Quickly see which clients need extra attention today',
            event: 'cc:journey:stageClicked',
            target: '#journeyRadarWidget .journey-segment.has-clients, #journeyRadarWidget .journey-segment, #journeyRadarWidget',
            tab: 'dashboard'
        },
        {
            id: 'flightplan',
            step: 2,
            title: 'Review Your Flight Plan',
            description: 'Your Daily Flight Plan shows urgent tasks and follow-ups. Red zone items need immediate attention.',
            action: 'Click any task to see details',
            benefit: '💡 Never miss a critical deadline or check-in',
            event: 'cc:flightPlan:taskOpened',
            target: '#flightPlanWidget .priority-item, #flightPlanWidget .zone-content, #flightPlanWidget',
            tab: 'dashboard'
        },
        {
            id: 'gaps',
            step: 3,
            title: 'Identify Client Gaps',
            description: 'Gaps show missing information like overdue trackers or missing aftercare plans. Clicking reveals which clients need follow-up.',
            action: 'Click any gap category',
            benefit: '💡 Keep all client documentation complete and compliant',
            event: 'cc:gaps:itemClicked',
            target: '#gapsWidget .gap-category, #gapsWidget .gap-item, #gapsWidget',
            tab: 'dashboard'
        },
        {
            id: 'house',
            step: 4,
            title: 'Monitor House Compliance',
            description: 'Each house card shows overall compliance scores. Filter the dashboard by house to focus on specific locations.',
            action: 'Click any house card',
            benefit: '💡 Compare house performance at a glance',
            event: 'cc:house:clicked',
            target: '#houseHealthWidget .house-card, #houseHealthWidget',
            tab: 'dashboard'
        },
        {
            id: 'filter',
            step: 5,
            title: 'Search the Program Database',
            description: 'Use filters to find the right fit for your client. Filter by level of care, location, specialties, insurance, and more.',
            action: 'Check any filter checkbox',
            benefit: '💡 Find matching programs in seconds, not hours',
            event: 'cc:programs:filterApplied',
            target: '.filter-checkbox__input, .filter-group, .filter-rail',
            tab: 'programs'
        },
        {
            id: 'profile',
            step: 6,
            title: 'Explore Program Details',
            description: 'Each program card expands to show full details: contact info, specialties, insurance, and more.',
            action: 'Click any program card',
            benefit: '💡 All program info in one place - no more spreadsheets',
            event: 'cc:programs:profileOpened',
            target: '.program-card, .card-programs',
            tab: 'programs'
        },
        {
            id: 'map',
            step: 7,
            title: 'Visualize on the Map',
            description: 'The map view shows program locations geographically. Great for finding options near a client\'s home.',
            action: 'Switch to Map view and click a pin',
            benefit: '💡 Help clients find programs close to their support system',
            event: 'cc:map:markerClicked',
            target: '[data-view="map"], .view-toggle, .map-container',
            tab: 'programs'
        },
        {
            id: 'addprogram',
            step: 8,
            title: 'Build an Aftercare Document',
            description: 'Add programs to your aftercare draft with one click. Build personalized recommendations for each client.',
            action: 'Click the + Add button on any program',
            benefit: '💡 Create professional aftercare documents in minutes',
            event: 'cc:doc:programAdded',
            target: '.add-program-btn, .btn-add, .btn-add-program, .program-card__action--add',
            tab: 'programs'
        },
        {
            id: 'preview',
            step: 9,
            title: 'Preview Your Document',
            description: 'Preview shows exactly what the client will receive. Review, edit, and finalize before saving.',
            action: 'Click Preview in the document builder',
            benefit: '💡 Professional documents ready for clinical review',
            event: 'cc:doc:previewed',
            target: '.preview-btn, #documentPreviewContainer, .document-builder, .doc-panel',
            tab: 'programs'
        }
    ];
    
    // =========================================================================
    // STATE
    // =========================================================================
    let currentStep = 0;
    let tourActive = false;
    
    function getState() {
        const storageKey = getUserTourKey();
        try {
            const stored = localStorage.getItem(storageKey);
            if (stored) return JSON.parse(stored);
        } catch(e) {}
        return { currentStep: 0, completed: false, dismissed: false };
    }
    
    function saveState(state) {
        const storageKey = getUserTourKey();
        localStorage.setItem(storageKey, JSON.stringify(state));
        console.log(`[Tour] Saved state for ${getCurrentUsername()}:`, state);
    }
    
    function resetTour() {
        const storageKey = getUserTourKey();
        localStorage.removeItem(storageKey);
        localStorage.removeItem('ccpro_tour_started');
        location.reload();
    }
    
    function isTourCompleted() {
        const state = getState();
        return state.completed === true && state.currentStep >= TOUR_STEPS.length;
    }
    
    // =========================================================================
    // INTERFACE LOCK/UNLOCK
    // =========================================================================
    let scrollPosition = { x: 0, y: 0 };
    
    function lockInterface() {
        console.log('[Tour] Locking interface - user cannot scroll or interact outside tour');
        // Save current scroll position
        scrollPosition = { x: window.scrollX, y: window.scrollY };
        
        // Add locked class to body
        document.body.classList.add('tour-locked');
        
        // Prevent scroll events
        window.addEventListener('scroll', preventScroll, { passive: false });
        window.addEventListener('wheel', preventScroll, { passive: false });
        window.addEventListener('touchmove', preventScroll, { passive: false });
        document.addEventListener('keydown', preventScrollKeys, { passive: false });
    }
    
    function unlockInterface() {
        console.log('[Tour] Unlocking interface - restoring normal control');
        // Remove locked class
        document.body.classList.remove('tour-locked');
        
        // Remove scroll prevention
        window.removeEventListener('scroll', preventScroll);
        window.removeEventListener('wheel', preventScroll);
        window.removeEventListener('touchmove', preventScroll);
        document.removeEventListener('keydown', preventScrollKeys);
    }
    
    function preventScroll(e) {
        // Only prevent if tour is active and not from tour-controlled scroll
        if (tourActive && !e._tourAllowed) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
    
    function preventScrollKeys(e) {
        // Prevent arrow keys, page up/down, space, home, end
        const scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40]; // space, pgup, pgdn, end, home, arrows
        if (tourActive && scrollKeys.includes(e.keyCode)) {
            e.preventDefault();
            return false;
        }
    }
    
    // Programmatic scroll - bypasses the lock
    function tourScroll(element, options = { behavior: 'smooth', block: 'center' }) {
        // Temporarily allow scroll
        const scrollEvent = new Event('scroll');
        scrollEvent._tourAllowed = true;
        
        // Scroll to element
        element.scrollIntoView(options);
    }
    
    // =========================================================================
    // CARD POSITIONING - Ensure card is always fully visible
    // =========================================================================
    const CARD_WIDTH = 400;
    const CARD_HEIGHT = 420; // Approximate height with all content
    const MARGIN = 24;
    const MIN_PADDING = 16;
    
    function getInitialCardStyle(targetRect) {
        // Default: try to position to the right of target
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left, top;
        
        // Try right side first
        if (targetRect.right + CARD_WIDTH + MARGIN < viewportWidth) {
            left = targetRect.right + MARGIN;
            top = Math.max(MIN_PADDING, Math.min(targetRect.top, viewportHeight - CARD_HEIGHT - MIN_PADDING));
        }
        // Try left side
        else if (targetRect.left - CARD_WIDTH - MARGIN > 0) {
            left = targetRect.left - CARD_WIDTH - MARGIN;
            top = Math.max(MIN_PADDING, Math.min(targetRect.top, viewportHeight - CARD_HEIGHT - MIN_PADDING));
        }
        // Try below
        else if (targetRect.bottom + CARD_HEIGHT + MARGIN < viewportHeight) {
            left = Math.max(MIN_PADDING, Math.min(targetRect.left, viewportWidth - CARD_WIDTH - MIN_PADDING));
            top = targetRect.bottom + MARGIN;
        }
        // Default: center of screen
        else {
            left = Math.max(MIN_PADDING, (viewportWidth - CARD_WIDTH) / 2);
            top = Math.max(MIN_PADDING, (viewportHeight - CARD_HEIGHT) / 2);
        }
        
        // Final bounds check
        top = Math.max(MIN_PADDING, Math.min(top, viewportHeight - CARD_HEIGHT - MIN_PADDING));
        left = Math.max(MIN_PADDING, Math.min(left, viewportWidth - CARD_WIDTH - MIN_PADDING));
        
        return `top: ${top}px; left: ${left}px;`;
    }
    
    function positionCardSafely(card, targetRect) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const cardRect = card.getBoundingClientRect();
        const actualHeight = cardRect.height || CARD_HEIGHT;
        const actualWidth = cardRect.width || CARD_WIDTH;
        
        let left, top;
        
        // Try right side first
        if (targetRect.right + actualWidth + MARGIN < viewportWidth) {
            left = targetRect.right + MARGIN;
            top = Math.max(MIN_PADDING, Math.min(targetRect.top, viewportHeight - actualHeight - MIN_PADDING));
        }
        // Try left side
        else if (targetRect.left - actualWidth - MARGIN > 0) {
            left = targetRect.left - actualWidth - MARGIN;
            top = Math.max(MIN_PADDING, Math.min(targetRect.top, viewportHeight - actualHeight - MIN_PADDING));
        }
        // Try below
        else if (targetRect.bottom + actualHeight + MARGIN < viewportHeight) {
            left = Math.max(MIN_PADDING, Math.min(targetRect.left, viewportWidth - actualWidth - MIN_PADDING));
            top = targetRect.bottom + MARGIN;
        }
        // Default: position at top-right of viewport
        else {
            left = viewportWidth - actualWidth - MIN_PADDING;
            top = MIN_PADDING;
        }
        
        // Final bounds check - ensure card is FULLY visible
        top = Math.max(MIN_PADDING, Math.min(top, viewportHeight - actualHeight - MIN_PADDING));
        left = Math.max(MIN_PADDING, Math.min(left, viewportWidth - actualWidth - MIN_PADDING));
        
        card.style.top = `${top}px`;
        card.style.left = `${left}px`;
        card.style.bottom = 'auto';
        card.style.right = 'auto';
    }
    
    // =========================================================================
    // TAB NAVIGATION
    // =========================================================================
    let currentTab = null; // null = unknown, will force navigation on first step
    
    function detectCurrentTab() {
        // Try to detect which tab is currently visible
        const programsVisible = document.querySelector('#programsTab:not([style*="display: none"]), .programs-container:not([style*="display: none"]), [data-page="programs"]:not(.hidden)');
        const dashboardVisible = document.querySelector('#dashboardTab:not([style*="display: none"]), .dashboard-container:not([style*="display: none"]), [data-page="dashboard"]:not(.hidden)');
        
        if (programsVisible && programsVisible.offsetParent !== null) {
            return 'programs';
        }
        if (dashboardVisible && dashboardVisible.offsetParent !== null) {
            return 'dashboard';
        }
        return null;
    }
    
    function showTabTransition(toTab) {
        // Create smooth full-screen transition overlay
        let transition = document.getElementById('tour-tab-transition');
        if (!transition) {
            transition = document.createElement('div');
            transition.id = 'tour-tab-transition';
            document.body.appendChild(transition);
        }
        
        const tabNames = {
            'dashboard': 'Dashboard',
            'programs': 'Programs Explorer'
        };
        
        const tabIcons = {
            'dashboard': '📊',
            'programs': '📁'
        };
        
        transition.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 100%);
            z-index: 2000010;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.4s ease;
            pointer-events: all;
        `;
        
        transition.innerHTML = `
            <div style="text-align: center; color: #E2E8F0;">
                <div style="font-size: 48px; margin-bottom: 16px;">${tabIcons[toTab] || '📄'}</div>
                <div style="font-size: 14px; color: #64748B; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 2px;">Loading</div>
                <div style="font-size: 28px; font-weight: 600; color: #F1F5F9;">${tabNames[toTab] || toTab}</div>
                <div style="margin-top: 24px;">
                    <div style="width: 40px; height: 40px; border: 3px solid #334155; border-top-color: #14B8A6; border-radius: 50%; animation: spin 1s linear infinite;"></div>
                </div>
            </div>
            <style>
                @keyframes spin { to { transform: rotate(360deg); } }
            </style>
        `;
        
        requestAnimationFrame(() => {
            transition.style.opacity = '1';
        });
    }
    
    function hideTabTransition() {
        const transition = document.getElementById('tour-tab-transition');
        if (transition) {
            transition.style.opacity = '0';
            setTimeout(() => {
                if (transition.parentNode) transition.remove();
            }, 400);
        }
    }
    
    function navigateToTab(tabName) {
        return new Promise(resolve => {
            // Detect actual current tab (don't trust cached value)
            const actualTab = detectCurrentTab();
            
            // If we're already on the target tab (confirmed by detection), skip navigation
            if (tabName && actualTab === tabName) {
                console.log(`[Tour] Already on ${tabName} tab, no navigation needed`);
                currentTab = tabName;
                resolve();
                return;
            }
            
            if (!tabName) {
                resolve();
                return;
            }
            
            console.log(`[Tour] Navigating from ${actualTab || 'unknown'} to ${tabName}`);
            currentTab = tabName;
            
            // First, completely hide the current tour overlay
            const overlay = document.getElementById('tour-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                overlay.innerHTML = ''; // Clear spotlight
            }
            
            // Show full-screen transition
            showTabTransition(tabName);
            
            // Wait for transition to be visible, then navigate
            setTimeout(() => {
                // Navigate to new tab
                if (tabName === 'dashboard') {
                    if (window.ccShell?.navigateTo) {
                        window.ccShell.navigateTo('dashboard');
                    } else {
                        const dashNav = document.querySelector('[data-nav-target="dashboard"], [data-nav="dashboard"], .nav-item[onclick*="dashboard"]');
                        if (dashNav) dashNav.click();
                    }
                } else if (tabName === 'programs') {
                    if (window.ccShell?.navigateTo) {
                        window.ccShell.navigateTo('programs');
                    } else {
                        const progNav = document.querySelector('[data-nav-target="programs"], [data-nav="programs"], .nav-item[onclick*="programs"]');
                        if (progNav) progNav.click();
                    }
                }
                
                // Wait for tab content to FULLY render (longer wait)
                setTimeout(() => {
                    // Hide transition
                    hideTabTransition();
                    
                    // Wait for transition to fade, then resolve
                    setTimeout(() => {
                        resolve();
                    }, 500);
                }, 1200); // Longer wait for content to load
            }, 500); // Wait for transition overlay to be visible
        });
    }
    
    function waitForElement(selectors, timeout = 3000) {
        return new Promise((resolve) => {
            const selectorList = Array.isArray(selectors) ? selectors : selectors.split(',').map(s => s.trim());
            const startTime = Date.now();
            
            function check() {
                for (const sel of selectorList) {
                    const el = document.querySelector(sel);
                    if (el && el.offsetParent !== null) {
                        resolve(el);
                        return;
                    }
                }
                
                if (Date.now() - startTime < timeout) {
                    requestAnimationFrame(check);
                } else {
                    console.warn('[Tour] Element not found:', selectorList);
                    resolve(null);
                }
            }
            
            check();
        });
    }
    
    // =========================================================================
    // CSS
    // =========================================================================
    const CSS = `
        /* === LOCKDOWN MODE === */
        /* When tour is active, completely lock the interface */
        body.tour-locked {
            overflow: hidden !important;
            position: fixed !important;
            width: 100% !important;
            height: 100% !important;
        }
        body.tour-locked * {
            pointer-events: none !important;
            user-select: none !important;
        }
        /* Allow interactions only with tour elements */
        body.tour-locked #tour-overlay,
        body.tour-locked #tour-overlay *,
        body.tour-locked .tour-spotlight,
        body.tour-locked .tour-card,
        body.tour-locked .tour-card *,
        body.tour-locked #tour-mini,
        body.tour-locked #tour-mini * {
            pointer-events: auto !important;
            user-select: auto !important;
        }
        
        /* Tour overlay - NO background, spotlight handles the dimming */
        #tour-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: transparent;
            z-index: 2000000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }
        #tour-overlay.active {
            opacity: 1;
            pointer-events: auto;
        }
        
        /* Tab transition overlay */
        #tour-tab-transition {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        
        /* Spotlight - highlights the target element with CLEAR interior */
        .tour-spotlight {
            position: fixed;
            border: 2px solid #14B8A6;
            border-radius: 10px;
            background: transparent !important;
            box-shadow: 0 0 0 9999px rgba(15, 23, 42, 0.7);
            z-index: 2000001;
            pointer-events: auto !important;
            cursor: pointer;
            /* Smooth transitions for position changes */
            transition: top 0.4s ease, left 0.4s ease, width 0.4s ease, height 0.4s ease;
        }
        /* Outer glow ring - separate element to avoid interior tinting */
        .tour-spotlight::after {
            content: '';
            position: absolute;
            inset: -4px;
            border-radius: 12px;
            border: 2px solid rgba(20, 184, 166, 0.4);
            animation: spotlight-pulse 2s ease-in-out infinite;
            pointer-events: none;
        }
        @keyframes spotlight-pulse {
            0%, 100% { opacity: 0.5; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.02); }
        }
        
        /* Tour card */
        .tour-card {
            position: fixed;
            width: 380px;
            max-width: calc(100vw - 40px);
            max-height: calc(100vh - 40px);
            background: linear-gradient(145deg, #1E293B 0%, #0F172A 100%);
            border-radius: 16px;
            box-shadow: 0 25px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1);
            z-index: 2000002;
            overflow: hidden;
            overflow-y: auto;
            pointer-events: auto !important;
            /* Smooth transitions for position and opacity */
            transition: opacity 0.4s ease, top 0.3s ease, left 0.3s ease, transform 0.3s ease;
        }
        
        /* Guided Mode indicator - subtle top bar */
        .tour-card-mode {
            background: rgba(20, 184, 166, 0.1);
            padding: 6px 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-bottom: 1px solid rgba(20, 184, 166, 0.2);
        }
        .tour-mode-icon {
            font-size: 12px;
        }
        .tour-mode-text {
            font-size: 10px;
            font-weight: 600;
            color: #5EEAD4;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        .tour-mode-lock {
            font-size: 9px;
            opacity: 0.6;
        }
        
        .tour-card-header {
            background: linear-gradient(135deg, #0D9488 0%, #0F766E 100%);
            padding: 14px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .tour-card-step {
            background: rgba(255,255,255,0.2);
            padding: 6px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            color: white;
        }
        .tour-card-close {
            background: rgba(255,255,255,0.15);
            border: none;
            color: white;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            cursor: pointer;
            font-size: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: background 0.2s;
        }
        .tour-card-close:hover { background: rgba(255,255,255,0.25); }
        
        .tour-card-body {
            padding: 20px 22px;
        }
        .tour-card-title {
            font-size: 19px;
            font-weight: 700;
            color: #F1F5F9;
            margin-bottom: 12px;
            line-height: 1.3;
        }
        .tour-card-desc {
            font-size: 14px;
            color: #CBD5E1;
            line-height: 1.6;
            margin-bottom: 18px;
        }
        .tour-card-action {
            background: rgba(20, 184, 166, 0.12);
            border: 1px solid rgba(20, 184, 166, 0.25);
            border-radius: 10px;
            padding: 14px 16px;
            margin-bottom: 16px;
        }
        .tour-card-action-label {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #5EEAD4;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .tour-card-action-text {
            font-size: 15px;
            font-weight: 600;
            color: #F1F5F9;
        }
        .tour-card-benefit {
            font-size: 13px;
            color: #FCD34D;
            display: flex;
            align-items: flex-start;
            gap: 6px;
            line-height: 1.5;
            opacity: 0.9;
        }
        
        .tour-card-footer {
            padding: 16px 22px;
            background: rgba(0,0,0,0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
            border-top: 1px solid rgba(255,255,255,0.05);
        }
        .tour-card-progress {
            display: flex;
            gap: 5px;
        }
        .tour-card-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #475569;
            transition: all 0.3s;
        }
        .tour-card-dot.complete { background: #10B981; }
        .tour-card-dot.current { background: #14B8A6; transform: scale(1.3); box-shadow: 0 0 8px rgba(20,184,166,0.6); }
        
        .tour-card-nav {
            display: flex;
            gap: 10px;
        }
        .tour-btn {
            padding: 11px 22px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }
        .tour-btn-secondary {
            background: transparent;
            color: #94A3B8;
            border: 1px solid rgba(148, 163, 184, 0.3);
        }
        .tour-btn-secondary:hover { 
            background: rgba(255,255,255,0.05); 
            color: #E2E8F0;
            border-color: rgba(148, 163, 184, 0.5);
        }
        .tour-btn-primary {
            background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
        }
        .tour-btn-primary:hover { 
            filter: brightness(1.1); 
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(20, 184, 166, 0.4);
        }
        
        /* Mini progress indicator */
        #tour-mini {
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: linear-gradient(145deg, #1E293B 0%, #0F172A 100%);
            border-radius: 14px;
            padding: 14px 20px;
            box-shadow: 0 15px 50px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
            z-index: 2000003;
            display: flex;
            align-items: center;
            gap: 14px;
            cursor: pointer;
            transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            pointer-events: auto !important;
        }
        #tour-mini:hover { 
            transform: translateY(-3px) scale(1.02); 
            box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(20,184,166,0.3); 
        }
        #tour-mini.hidden { 
            transform: translateX(400px); 
            opacity: 0;
            pointer-events: none;
        }
        .tour-mini-icon { font-size: 24px; }
        .tour-mini-info { display: flex; flex-direction: column; }
        .tour-mini-title { color: #E2E8F0; font-size: 14px; font-weight: 600; }
        .tour-mini-progress { color: #14B8A6; font-size: 12px; font-weight: 500; margin-top: 2px; }
        .tour-mini-btn {
            background: linear-gradient(135deg, #14B8A6 0%, #0D9488 100%);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
        }
        
        /* Celebration */
        .tour-celebration {
            position: fixed;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(145deg, #1E293B 0%, #0F172A 100%);
            border-radius: 24px;
            padding: 50px 60px;
            text-align: center;
            z-index: 2000004;
            box-shadow: 0 40px 120px rgba(0,0,0,0.7);
            animation: celebrate-appear 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes celebrate-appear {
            from { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
            to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        .tour-celebration-icon { font-size: 80px; margin-bottom: 24px; animation: bounce 1s ease infinite; }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .tour-celebration-title { font-size: 28px; font-weight: 700; color: #F1F5F9; margin-bottom: 12px; }
        .tour-celebration-text { font-size: 15px; color: #94A3B8; margin-bottom: 30px; line-height: 1.5; }
        
        /* Nudge animation for mini indicator */
        @keyframes tour-nudge {
            0%, 100% { transform: scale(1); }
            25% { transform: scale(1.05) translateX(-5px); }
            50% { transform: scale(1.08); box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 20px rgba(20,184,166,0.5); }
            75% { transform: scale(1.05) translateX(5px); }
        }
        
        /* Pulsing border for persistent reminder */
        #tour-mini::before {
            content: '';
            position: absolute;
            inset: -2px;
            border-radius: 16px;
            background: linear-gradient(135deg, #14B8A6, #0D9488, #14B8A6);
            z-index: -1;
            opacity: 0;
            animation: tour-pulse-border 3s ease-in-out infinite;
        }
        @keyframes tour-pulse-border {
            0%, 100% { opacity: 0; }
            50% { opacity: 0.6; }
        }
    `;
    
    // =========================================================================
    // RENDER
    // =========================================================================
    function injectCSS() {
        if (!document.getElementById('tour-styles-v3')) {
            const style = document.createElement('style');
            style.id = 'tour-styles-v3';
            style.textContent = CSS;
            document.head.appendChild(style);
        }
    }
    
    function showStep(stepIndex) {
        console.log('%c[Tour] showStep(' + stepIndex + ') called', 'background: #EC4899; color: white; padding: 4px 8px;');
        
        // Check if tour is already completed - prevent loops
        if (isTourCompleted()) {
            console.log('[Tour] Tour already completed, cannot show step');
            return;
        }
        
        if (stepIndex >= TOUR_STEPS.length) {
            showCelebration();
            return;
        }
        
        const step = TOUR_STEPS[stepIndex];
        currentStep = stepIndex;
        tourActive = true;
        
        console.log('[Tour] Step details:', step.title);
        
        // LOCK THE INTERFACE - user cannot scroll or click outside tour
        lockInterface();
        
        // Remove existing
        hideOverlay();
        hideMiniIndicator();
        
        // Navigate to correct tab if needed (tour controls navigation)
        navigateToTab(step.tab).then(() => {
            console.log('[Tour] Tab ready, calling renderStep in 400ms...');
            setTimeout(() => renderStep(step, stepIndex), 400);
        });
    }
    
    function renderStep(step, stepIndex) {
        console.log('%c[Tour] renderStep() called for step ' + stepIndex, 'background: #06B6D4; color: white; padding: 4px 8px;');
        
        // Create overlay
        let overlay = document.getElementById('tour-overlay');
        if (!overlay) {
            console.log('[Tour] Creating tour overlay element');
            overlay = document.createElement('div');
            overlay.id = 'tour-overlay';
            document.body.appendChild(overlay);
            console.log('[Tour] Overlay appended to body');
        } else {
            console.log('[Tour] Reusing existing tour overlay');
            // Clear existing content
            overlay.innerHTML = '';
        }
        
        // Find target - prioritize visible elements within widgets
        const targets = step.target.split(',').map(s => s.trim());
        let targetEl = null;
        
        for (const sel of targets) {
            const candidates = document.querySelectorAll(sel);
            // Try to find one that's visible in the viewport
            for (const el of candidates) {
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 && 
                                  rect.top < window.innerHeight && rect.bottom > 0 &&
                                  rect.left < window.innerWidth && rect.right > 0;
                if (isVisible) {
                    targetEl = el;
                    break;
                }
            }
            if (targetEl) break;
            // Fallback: just use the first match even if not fully visible
            if (candidates.length > 0 && !targetEl) {
                targetEl = candidates[0];
            }
        }
        
        console.log('[Tour] Target element found:', targetEl?.tagName, targetEl?.id || targetEl?.className);
        
        let spotlightHTML = '';
        let cardStyle = 'top: 50%; left: 50%; transform: translate(-50%, -50%);';
        
        if (targetEl) {
            // Store targetEl for click handler
            window._tourTargetEl = targetEl;
            
            // Get initial position for spotlight
            const padding = 16;
            const initialRect = targetEl.getBoundingClientRect();
            
            // Create spotlight HTML with initial position (starts hidden, fades in after scroll)
            spotlightHTML = `
                <div class="tour-spotlight" style="
                    left: ${initialRect.left - padding}px;
                    top: ${initialRect.top - padding}px;
                    width: ${initialRect.width + padding * 2}px;
                    height: ${initialRect.height + padding * 2}px;
                " onclick="if(window._tourTargetEl) { window._tourTargetEl.click(); }"></div>
            `;
            
            // Card position
            cardStyle = getInitialCardStyle(initialRect);
            
            // TOUR CONTROLS SCROLLING - temporarily allow scroll to position element
            document.body.classList.remove('tour-locked');
            targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Re-lock after scroll animation starts
            setTimeout(() => {
                document.body.classList.add('tour-locked');
            }, 50);
            
            // Wait for scroll to settle, then update positions smoothly
            setTimeout(() => {
                const rect = targetEl.getBoundingClientRect();
                
                // Update spotlight position (CSS transition makes it smooth)
                const spotlight = overlay.querySelector('.tour-spotlight');
                if (spotlight) {
                    spotlight.style.left = `${rect.left - padding}px`;
                    spotlight.style.top = `${rect.top - padding}px`;
                    spotlight.style.width = `${rect.width + padding * 2}px`;
                    spotlight.style.height = `${rect.height + padding * 2}px`;
                }
                
                // Update card position
                const card = overlay.querySelector('.tour-card');
                if (card) {
                    positionCardSafely(card, rect);
                }
            }, 500); // Wait for scroll to complete
        }
        
        // Progress dots
        let dotsHTML = '';
        for (let i = 0; i < TOUR_STEPS.length; i++) {
            const dotClass = i < stepIndex ? 'complete' : (i === stepIndex ? 'current' : '');
            dotsHTML += `<div class="tour-card-dot ${dotClass}"></div>`;
        }
        
        overlay.innerHTML = `
            ${spotlightHTML}
            <div class="tour-card" style="${cardStyle}">
                <div class="tour-card-mode">
                    <span class="tour-mode-icon">🎯</span>
                    <span class="tour-mode-text">Guided Tour Mode</span>
                    <span class="tour-mode-lock">🔒</span>
                </div>
                <div class="tour-card-header">
                    <span class="tour-card-step">Step ${step.step} of ${TOUR_STEPS.length}</span>
                </div>
                <div class="tour-card-body">
                    <div class="tour-card-title">${step.title}</div>
                    <div class="tour-card-desc">${step.description}</div>
                    <div class="tour-card-benefit">${step.benefit}</div>
                </div>
                <div class="tour-card-footer">
                    <div class="tour-card-progress">${dotsHTML}</div>
                    <div class="tour-card-nav">
                        ${stepIndex > 0 ? '<button class="tour-btn tour-btn-secondary" onclick="window.InteractiveTour.prev()">← Back</button>' : ''}
                        <button class="tour-btn tour-btn-primary" onclick="window.InteractiveTour.next()">Continue →</button>
                    </div>
                </div>
            </div>
        `;
        
        overlay.classList.add('active');
        console.log('%c[Tour] renderStep COMPLETE - overlay should be visible now', 'background: #10B981; color: white; padding: 4px 8px; font-weight: bold;');
        
        // CRITICAL: Ensure card is fully visible after render
        requestAnimationFrame(() => {
            ensureCardVisible();
        });
        
        // Update spotlight position on scroll/resize
        setupPositionUpdateListener();
    }
    
    // Keep spotlight aligned when user scrolls or resizes
    let positionUpdateTimeout = null;
    function setupPositionUpdateListener() {
        const updatePosition = () => {
            if (!window._tourTargetEl || !tourActive) return;
            
            const overlay = document.getElementById('tour-overlay');
            if (!overlay) return;
            
            const spotlight = overlay.querySelector('.tour-spotlight');
            const card = overlay.querySelector('.tour-card');
            if (!spotlight) return;
            
            const rect = window._tourTargetEl.getBoundingClientRect();
            const padding = 16;
            
            spotlight.style.left = `${rect.left - padding}px`;
            spotlight.style.top = `${rect.top - padding}px`;
            spotlight.style.width = `${rect.width + padding * 2}px`;
            spotlight.style.height = `${rect.height + padding * 2}px`;
            
            // Update card position using safe positioning
            if (card) {
                positionCardSafely(card, rect);
            }
        };
        
        const debouncedUpdate = () => {
            if (positionUpdateTimeout) clearTimeout(positionUpdateTimeout);
            positionUpdateTimeout = setTimeout(updatePosition, 50);
        };
        
        // Remove old listeners
        window.removeEventListener('scroll', debouncedUpdate, true);
        window.removeEventListener('resize', debouncedUpdate);
        
        // Add new listeners
        window.addEventListener('scroll', debouncedUpdate, true);
        window.addEventListener('resize', debouncedUpdate);
    }
    
    // Ensure card is visible after render (call after overlay.innerHTML is set)
    function ensureCardVisible() {
        const overlay = document.getElementById('tour-overlay');
        if (!overlay) return;
        
        const card = overlay.querySelector('.tour-card');
        if (!card || !window._tourTargetEl) return;
        
        const targetRect = window._tourTargetEl.getBoundingClientRect();
        positionCardSafely(card, targetRect);
    }
    
    function showMiniIndicator(stepIndex) {
        // Tour is mandatory - no mini indicator needed
        // Users must complete the tour, no pausing/minimizing allowed
        console.log('[Tour] Mini indicator disabled - tour is mandatory');
        hideMiniIndicator();
    }
    
    function hideMiniIndicator() {
        const mini = document.getElementById('tour-mini');
        if (mini) mini.classList.add('hidden');
    }
    
    function showCelebration() {
        // Check if already completed - prevent showing celebration multiple times
        if (isTourCompleted()) {
            console.log('[Tour] Already completed, skipping celebration');
            finish(); // Just finish immediately
            return;
        }
        
        console.log('[Tour] Showing celebration - interface still locked until user confirms');
        hideOverlay();
        hideMiniIndicator();
        // Keep tourActive true and interface locked until user clicks finish
        
        const overlay = document.createElement('div');
        overlay.id = 'tour-overlay';
        overlay.innerHTML = `
            <div class="tour-celebration">
                <div class="tour-celebration-icon">🎉</div>
                <div class="tour-celebration-title">You're All Set!</div>
                <div class="tour-celebration-text">
                    You've completed the Quick Start tour and learned the essentials.<br>
                    CareConnect Pro is ready to help you deliver excellent aftercare.
                </div>
                <button class="tour-btn tour-btn-primary" onclick="window.InteractiveTour.finish()" style="padding: 14px 40px; font-size: 16px;">
                    Start Using CareConnect Pro →
                </button>
            </div>
        `;
        overlay.classList.add('active');
        document.body.appendChild(overlay);
        
        // Save completion state IMMEDIATELY to prevent loops
        const username = getCurrentUsername();
        saveState({ 
            currentStep: TOUR_STEPS.length, 
            completed: true, 
            dismissed: false,
            completedAt: new Date().toISOString(),
            username: username
        });
        console.log(`[Tour] Saved completion state for ${username}`);
    }
    
    function hideOverlay() {
        console.log('%c[Tour] hideOverlay called', 'background: #EF4444; color: white; padding: 2px 6px;');
        console.trace('[Tour] hideOverlay stack trace');
        const overlay = document.getElementById('tour-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            overlay.remove();
        }
    }
    
    // =========================================================================
    // NAVIGATION
    // =========================================================================
    function next() {
        // Check if already completed - prevent loops
        if (isTourCompleted()) {
            console.log('[Tour] Tour already completed, cannot advance');
            return;
        }
        
        // If we're at the last step, show celebration instead
        if (currentStep >= TOUR_STEPS.length - 1) {
            console.log('[Tour] Reached last step, showing celebration');
            showCelebration();
            return;
        }
        
        if (currentStep < TOUR_STEPS.length - 1) {
            const nextStep = currentStep + 1;
            showStep(nextStep);
            saveState({ currentStep: nextStep, completed: false, dismissed: false });
        }
    }
    
    function prev() {
        if (currentStep > 0) {
            showStep(currentStep - 1);
        }
    }
    
    function skip() {
        next();
    }
    
    function pause() {
        // Tour is mandatory - pausing is not allowed
        // Show notification to user that they must complete the tour
        console.log('[Tour] Pause attempted - tour is mandatory, cannot pause');
        if (typeof showNotification === 'function') {
            showNotification('⚠️ Please complete the tour to continue.', 'warning');
        }
        // Don't actually pause - keep the tour active
    }
    
    function resume() {
        // Don't resume if tour is already completed
        if (isTourCompleted()) {
            console.log('[Tour] Tour already completed, cannot resume');
            hideMiniIndicator();
            return;
        }
        
        console.log('[Tour] Resuming tour - locking interface');
        hideMiniIndicator();
        showStep(currentStep); // showStep will re-lock the interface
    }
    
    function finish() {
        // Only allow finish if all steps are actually completed
        const state = getState();
        if (state.currentStep < TOUR_STEPS.length) {
            console.log('[Tour] Cannot finish - not all steps completed. Forcing resume.');
            resume(); // Force them back to the tour
            return;
        }
        
        console.log('[Tour] Tour complete! Unlocking interface permanently.');
        
        // Clear the nudge interval
        if (window._tourNudgeInterval) {
            clearInterval(window._tourNudgeInterval);
            window._tourNudgeInterval = null;
        }
        
        // Clear tour started flag - tour is truly complete
        const username = getCurrentUsername();
        localStorage.removeItem('ccpro_tour_started');
        localStorage.removeItem(`ccpro_tour_started-${username.toLowerCase()}`);
        
        // UNLOCK the interface - tour is complete, user has full control
        unlockInterface();
        
        hideOverlay();
        hideMiniIndicator();
        tourActive = false;
        
        // Save completion with timestamp - USER-SPECIFIC
        saveState({ 
            currentStep: TOUR_STEPS.length, 
            completed: true, 
            dismissed: true,
            completedAt: new Date().toISOString(),
            username: username
        });
        
        // Mark ALL onboarding flags as complete so user is never prompted again
        if (window.FirstLoginFlow && typeof window.FirstLoginFlow.markOnboardingComplete === 'function') {
            window.FirstLoginFlow.markOnboardingComplete();
        } else {
            // Fallback: set flags directly
            const userSuffix = `-${username.toLowerCase()}`;
            localStorage.setItem('ccpro-profile-complete' + userSuffix, 'true');
            localStorage.setItem('ccpro-onboarding-complete' + userSuffix, 'true');
            localStorage.setItem('ccpro-profile-complete', 'true');
            localStorage.setItem('ccpro-onboarding-complete', 'true');
        }
        
        console.log(`[Tour] ✅ Tour completed for user: ${username}`);
        
        if (typeof showNotification === 'function') {
            showNotification('🚀 Welcome to CareConnect Pro! You\'re ready to go!', 'success');
        }
    }
    
    // =========================================================================
    // EVENT HANDLING - Auto-advance when action completed
    // =========================================================================
    function bindEvents() {
        TOUR_STEPS.forEach((step, index) => {
            if (step.event) {
                window.addEventListener(step.event, () => {
                    // Don't process events if tour is already completed
                    if (isTourCompleted()) {
                        console.log('[Tour] Tour completed, ignoring event:', step.event);
                        return;
                    }
                    
                    console.log('[Tour] Event:', step.event, 'at step:', index, 'current:', currentStep);
                    
                    if (tourActive && currentStep === index) {
                        // Show success briefly then advance
                        if (typeof showNotification === 'function') {
                            showNotification('✓ Great job!', 'success');
                        }
                        setTimeout(() => next(), 600);
                    } else if (!tourActive) {
                        // Track progress even when paused (but not if completed)
                        const state = getState();
                        if (index >= state.currentStep && !state.completed) {
                            saveState({ ...state, currentStep: index + 1 });
                            // Update mini indicator
                            const mini = document.getElementById('tour-mini');
                            if (mini && !mini.classList.contains('hidden')) {
                                showMiniIndicator(index + 1);
                            }
                        }
                    }
                });
            }
        });
        
        console.log('[Tour] Bound', TOUR_STEPS.length, 'event listeners');
    }
    
    // =========================================================================
    // DEMO DATA FOR TOUR - Creates clients that populate ALL widgets
    // =========================================================================
    
    // Tour-specific demo clients designed to show every feature
    const TOUR_DEMO_CLIENTS = [
        {
            // Week 1 client - shows in Journey Radar "Week 1"
            firstName: 'Alex',
            lastName: 'Thompson',
            initials: 'AT',
            houseId: 'house_banyan',
            daysInTreatment: 5,
            stage: 'early',
            // Has overdue tracker - shows in Flight Plan RED zone
            trackerStatus: 'overdue',
            trackerDueDate: -2, // 2 days overdue
            // Missing aftercare - shows in Gaps
            hasAftercareThread: false,
            hasAftercareOptions: false
        },
        {
            // Day 14-16 CRITICAL client - shows yellow in Journey Radar
            firstName: 'Jordan',
            lastName: 'Rivera',
            initials: 'JR',
            houseId: 'house_cove',
            daysInTreatment: 15,
            stage: 'mid',
            isCritical: true,
            // Critical task - shows in Flight Plan
            trackerStatus: 'due_today',
            trackerDueDate: 0,
            hasAftercareThread: true,
            hasAftercareOptions: false // Missing options - shows in Gaps
        },
        {
            // Day 30 client
            firstName: 'Morgan',
            lastName: 'Chen',
            initials: 'MC',
            houseId: 'house_meridian',
            daysInTreatment: 32,
            stage: 'mid',
            trackerStatus: 'current',
            trackerDueDate: 3,
            hasAftercareThread: true,
            hasAftercareOptions: true,
            // Missing discharge docs - shows in Gaps
            hasDischargePacket: false
        },
        {
            // 45+ days client - approaching discharge
            firstName: 'Casey',
            lastName: 'Williams',
            initials: 'CW',
            houseId: 'house_hedge',
            daysInTreatment: 52,
            stage: 'late',
            // Upcoming task - shows in Flight Plan
            trackerStatus: 'upcoming',
            trackerDueDate: 1,
            hasAftercareThread: true,
            hasAftercareOptions: true,
            hasDischargePacket: false,
            estimatedDischargeDate: 7 // Discharge in 7 days
        },
        {
            // Discharge Pipeline client
            firstName: 'Riley',
            lastName: 'Davis',
            initials: 'RD',
            houseId: 'house_nest',
            daysInTreatment: 58,
            stage: 'late',
            trackerStatus: 'current',
            hasAftercareThread: true,
            hasAftercareOptions: true,
            hasDischargePacket: true,
            estimatedDischargeDate: 3, // Discharge in 3 days
            inDischargePipeline: true
        }
    ];
    
    async function ensureDemoData() {
        console.log('[Tour] Checking for demo data...');
        
        // Check if clientManager exists and has clients
        if (window.clientManager) {
            try {
                const clients = await window.clientManager.getAllClients();
                if (clients && clients.length >= 3) {
                    console.log('[Tour] Found', clients.length, 'existing clients, no demo data needed');
                    return true;
                }
            } catch (e) {
                console.log('[Tour] Could not check clients:', e);
            }
        }
        
        // Try built-in demo generator first with low compliance scenario
        if (window.demoData) {
            console.log('[Tour] Generating tour demo data...');
            try {
                // Set scenario to show gaps
                if (window.demoData.setScenario) {
                    window.demoData.setScenario('lowCompliance');
                }
                await window.demoData.generate(5);
                console.log('[Tour] Demo clients created with gaps and tasks!');
                
                // Small delay then refresh
                await new Promise(r => setTimeout(r, 500));
                
                // Refresh the dashboard
                if (window.dashboardManager) {
                    if (window.dashboardManager.loadDashboardData) {
                        await window.dashboardManager.loadDashboardData();
                    }
                    if (window.dashboardManager.refreshDashboard) {
                        await window.dashboardManager.refreshDashboard();
                    }
                }
                if (window.dashboardWidgets && window.dashboardWidgets.renderAll) {
                    await window.dashboardWidgets.renderAll();
                }
                
                return true;
            } catch (e) {
                console.warn('[Tour] Could not generate demo data:', e);
            }
        }
        
        // Fallback: Create clients manually if demoData not available
        if (window.clientManager && window.clientManager.addClient) {
            console.log('[Tour] Creating tour demo clients manually...');
            try {
                const now = new Date();
                
                for (const template of TOUR_DEMO_CLIENTS) {
                    const admitDate = new Date(now);
                    admitDate.setDate(admitDate.getDate() - template.daysInTreatment);
                    
                    const client = {
                        id: 'tour_' + template.initials.toLowerCase() + '_' + Date.now(),
                        firstName: template.firstName,
                        lastName: template.lastName,
                        initials: template.initials,
                        houseId: template.houseId,
                        admissionDate: admitDate.toISOString().split('T')[0],
                        status: 'active',
                        isTourDemo: true, // Flag for easy removal later
                        // Tracker data
                        trackers: [{
                            id: 'tracker_' + Date.now(),
                            name: 'Weekly Check-in',
                            status: template.trackerStatus,
                            dueDate: new Date(now.getTime() + template.trackerDueDate * 24*60*60*1000).toISOString().split('T')[0]
                        }],
                        // Aftercare status
                        aftercareThread: template.hasAftercareThread ? { status: 'active' } : null,
                        aftercareOptions: template.hasAftercareOptions ? [{ id: 'opt1' }] : [],
                        dischargePacket: template.hasDischargePacket ? { status: 'complete' } : null,
                        estimatedDischargeDate: template.estimatedDischargeDate 
                            ? new Date(now.getTime() + template.estimatedDischargeDate * 24*60*60*1000).toISOString().split('T')[0]
                            : null
                    };
                    
                    await window.clientManager.addClient(client);
                }
                
                console.log('[Tour] Created', TOUR_DEMO_CLIENTS.length, 'tour demo clients');
                
                // Refresh dashboard
                await new Promise(r => setTimeout(r, 500));
                if (window.dashboardManager && window.dashboardManager.refreshDashboard) {
                    await window.dashboardManager.refreshDashboard();
                }
                if (window.dashboardWidgets && window.dashboardWidgets.renderAll) {
                    await window.dashboardWidgets.renderAll();
                }
                
                return true;
            } catch (e) {
                console.warn('[Tour] Could not create manual demo clients:', e);
            }
        }
        
        console.log('[Tour] Demo data not available, tour will proceed without demo data');
        return false;
    }
    
    // =========================================================================
    // INIT
    // =========================================================================
    async function init() {
        console.log('[Tour] Checking login status...', localStorage.getItem('isLoggedIn'));
        
        if (localStorage.getItem('isLoggedIn') !== 'true') {
            console.log('[Tour] Not logged in, waiting...');
            // Check again in 2 seconds (login might be processing)
            setTimeout(init, 2000);
            return;
        }
        
        // Always inject CSS and bind events so tour is ready when called
        injectCSS();
        bindEvents();
        
        const username = getCurrentUsername();
        const usernameLower = username.toLowerCase();
        
        // Known master/admin usernames that should ALWAYS skip tour
        const MASTER_USERNAMES = ['masteradmin', 'doc232', 'admin'];
        
        // Master/Legacy/Admin accounts skip tour entirely
        const isMaster = localStorage.getItem('isMaster') === 'true';
        const userRole = localStorage.getItem('userRole');
        const isKnownMaster = MASTER_USERNAMES.includes(usernameLower);
        
        if (isMaster || userRole === 'admin' || isKnownMaster) {
            console.log(`[Tour] Master/Admin account detected (${username}) - skipping tour`);
            // Mark as complete so we never check again
            const onboardingKey = `ccpro-onboarding-complete-${username.toLowerCase()}`;
            const profileKey = `ccpro-profile-complete-${username.toLowerCase()}`;
            localStorage.setItem(onboardingKey, 'true');
            localStorage.setItem(profileKey, 'true');
            localStorage.setItem('ccpro-onboarding-complete', 'true');
            localStorage.setItem('ccpro-profile-complete', 'true');
            // Clear any stale tour-started flags
            localStorage.removeItem('ccpro_tour_started');
            localStorage.removeItem(`ccpro_tour_started-${username.toLowerCase()}`);
            // Also save tour state as complete
            saveState({ 
                currentStep: TOUR_STEPS.length, 
                completed: true, 
                dismissed: true,
                completedAt: new Date().toISOString(),
                username: username
            });
            // Hide any tour overlays that might be showing
            hideOverlay();
            hideMiniIndicator();
            tourActive = false;
            console.log('%c[Interactive Tour v3] Ready (admin/master - tour skipped)', 'background: #10B981; color: white; padding: 4px 12px; border-radius: 4px;');
            return;
        }
        
        // Check if tour is already completed for THIS USER
        if (isTourCompleted()) {
            const state = getState();
            console.log(`[Tour] ✅ Tour already completed for ${username} at ${state.completedAt || 'unknown time'}`);
            return;
        }
        
        // Check if first-login flow is still in progress (new user who hasn't completed onboarding)
        // Use user-specific keys with global fallbacks for backward compatibility
        const agreementKey = `ccpro-agreement-accepted-${username.toLowerCase()}`;
        const onboardingKey = `ccpro-onboarding-complete-${username.toLowerCase()}`;
        const profileKey = `ccpro-profile-complete-${username.toLowerCase()}`;
        
        // Check both user-specific AND global fallback keys
        const agreementAccepted = localStorage.getItem(agreementKey) === 'true' || localStorage.getItem('ccpro-agreement-accepted') === 'true';
        const onboardingComplete = localStorage.getItem(onboardingKey) === 'true' || localStorage.getItem('ccpro-onboarding-complete') === 'true';
        const profileComplete = localStorage.getItem(profileKey) === 'true' || localStorage.getItem('ccpro-profile-complete') === 'true';
        
        // If tour is already completed for this user, they're definitely a returning user
        // Even if other flags are missing (backward compatibility)
        if (isTourCompleted()) {
            console.log('[Tour] Tour already completed for this user, ensuring onboarding flags are set');
            // Migrate: ensure all onboarding flags are set so first-login-flow doesn't trigger
            localStorage.setItem(onboardingKey, 'true');
            localStorage.setItem(profileKey, 'true');
            console.log('%c[Interactive Tour v3] Ready (returning user)', 'background: #10B981; color: white; padding: 4px 12px; border-radius: 4px;');
            return;
        }
        
        // Check if onboarding is incomplete - defer to first-login-flow
        if (!onboardingComplete && !profileComplete) {
            console.log('[Tour] First-login flow not complete, deferring to first-login-flow.js');
            console.log('[Tour] Profile:', profileComplete, 'Onboarding:', onboardingComplete);
            // Don't auto-start - let first-login-flow.js trigger the tour when ready
            console.log('%c[Interactive Tour v3] Ready (waiting for first-login flow)', 'background: #F59E0B; color: black; padding: 4px 12px; border-radius: 4px;');
            return;
        }
        
        const state = getState();
        console.log(`[Tour] State for ${username}:`, state);
        
        // Tour cannot be dismissed until completed - ignore dismissed flag
        // This ensures users MUST complete the tour
        
        currentStep = state.currentStep || 0;
        
        // Check if tour was previously started (user-specific)
        const tourStartedKey = `ccpro_tour_started-${username.toLowerCase()}`;
        const tourPreviouslyStarted = localStorage.getItem(tourStartedKey) === 'true' || localStorage.getItem('ccpro_tour_started') === 'true';
        
        if (currentStep > 0 || tourPreviouslyStarted) {
            console.log('[Tour] Tour in progress at step:', currentStep);
            // Ensure demo data exists for continuing coaches
            await ensureDemoData();
            
            // Tour is mandatory - resume immediately instead of showing mini indicator
            console.log('[Tour] Resuming mandatory tour immediately...');
            setTimeout(() => {
                showStep(currentStep);
            }, 1000);
        } else {
            console.log('[Tour] Step 0, waiting for explicit start call');
        }
        
        console.log('%c[Interactive Tour v3] Ready!', 'background: #10B981; color: white; padding: 4px 12px; border-radius: 4px;');
    }
    
    // Manual start function - called by first-login-flow or replay button
    async function startTour() {
        const username = getCurrentUsername();
        console.log(`%c[Tour] Manual start triggered for ${username}!`, 'background: #8B5CF6; color: white; padding: 4px 12px; font-weight: bold; font-size: 14px;');
        
        // Check if already completed for this user
        if (isTourCompleted()) {
            console.log(`[Tour] ⚠️ Tour already completed for ${username}, not starting again`);
            return;
        }
        
        currentStep = 0;
        tourActive = true;
        
        // Mark tour as started - USER-SPECIFIC, persists across page reloads
        const tourStartedKey = `ccpro_tour_started-${username.toLowerCase()}`;
        localStorage.setItem(tourStartedKey, 'true');
        localStorage.setItem('ccpro_tour_started', 'true'); // Legacy support
        
        // Reset state for THIS USER
        saveState({ currentStep: 0, completed: false, dismissed: false, username: username });
        
        // Ensure demo data exists
        console.log('[Tour] Ensuring demo data...');
        await ensureDemoData();
        
        // Show first step
        console.log('%c[Tour] Showing step 0...', 'background: #8B5CF6; color: white; padding: 4px 8px;');
        showStep(0);
    }
    
    // Start
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => setTimeout(init, 1000));
    } else {
        setTimeout(init, 1000);
    }
    
    // Expose globally
    window.InteractiveTour = { 
        start: startTour,
        next, prev, skip, pause, resume, finish,
        reset: resetTour,
        getState,
        isCompleted: isTourCompleted,
        getCurrentUsername
    };
    
})();

