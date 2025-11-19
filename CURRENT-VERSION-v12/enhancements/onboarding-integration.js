/**
 * Onboarding System Integration
 * Loads onboarding assets and initializes the manager when the dashboard is ready.
 */

(function() {
    'use strict';

    if (window.__onboardingIntegrationLoaded) return;
    window.__onboardingIntegrationLoaded = true;

    const ASSET_PATH = 'onboarding/';
    const SCRIPT_FILES = [
        'onboarding-content.js',
        'onboarding-manager.js',
        'onboarding-video.js',
        'onboarding-tour.js',
        'onboarding-practice.js'
    ];

    // Track if scripts are loading to prevent duplicate loads
    let scriptsLoading = false;
    let scriptsLoaded = false;

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[data-onboarding="${src}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = src;
            script.async = false;
            script.dataset.onboarding = src;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Failed to load ${src}`));
            document.head.appendChild(script);
        });
    }

    function ensureStyles() {
        if (document.querySelector('link[data-onboarding-style="styles"]')) return;
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${ASSET_PATH}onboarding-styles.css`;
        link.dataset.onboardingStyle = 'styles';
        document.head.appendChild(link);
    }

    function loadAssets() {
        if (scriptsLoaded) {
            console.log('[Onboarding] Assets already loaded');
            return Promise.resolve();
        }
        
        if (scriptsLoading) {
            console.log('[Onboarding] Assets already loading, waiting...');
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    if (scriptsLoaded) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
                setTimeout(() => {
                    clearInterval(checkInterval);
                    resolve();
                }, 5000);
            });
        }

        scriptsLoading = true;
        ensureStyles();
        
        return SCRIPT_FILES.reduce((promise, file) => {
            return promise.then(() => {
                console.log(`[Onboarding] Loading ${file}...`);
                return loadScript(`${ASSET_PATH}${file}`);
            }).then(() => {
                console.log(`[Onboarding] Loaded ${file}`);
            });
        }, Promise.resolve()).then(() => {
            scriptsLoaded = true;
            scriptsLoading = false;
            console.log('[Onboarding] All assets loaded');
            
            // Ensure manager is available
            if (!window.onboardingManager) {
                console.warn('[Onboarding] Manager not found after loading scripts, waiting...');
                return new Promise((resolve) => {
                    const checkManager = setInterval(() => {
                        if (window.onboardingManager) {
                            clearInterval(checkManager);
                            resolve();
                        }
                    }, 100);
                    setTimeout(() => {
                        clearInterval(checkManager);
                        resolve();
                    }, 2000);
                });
            }
        });
    }

    function waitForDashboardReady(timeoutMs = 30000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();

            const interval = setInterval(() => {
                const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
                const dashboardVisible = document.querySelector('.dashboard-container, #dashboardTab, [data-page="dashboard"], .dashboard-manager');
                const managerAvailable = window.onboardingManager;

                if (isLoggedIn && managerAvailable) {
                    // If dashboard is visible, great. If not, still proceed after a short delay
                    if (dashboardVisible || Date.now() - start > 2000) {
                        clearInterval(interval);
                        console.log('[Onboarding] Dashboard ready, initializing...');
                        resolve();
                    }
                }

                if (Date.now() - start > timeoutMs) {
                    clearInterval(interval);
                    console.warn('[Onboarding] Timeout waiting for dashboard, proceeding anyway...');
                    resolve(); // Resolve instead of reject to still try initialization
                }
            }, 500);
        });
    }

    async function initializeOnboarding() {
        try {
            console.log('[Onboarding] Starting initialization...');
            const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
            if (!isLoggedIn) {
                console.log('[Onboarding] User not logged in, skipping');
                return;
            }

            await loadAssets();
            console.log('[Onboarding] Assets loaded, waiting for dashboard...');
            await waitForDashboardReady();
            
            // Wait a moment for manager to be available
            let attempts = 0;
            while (!window.onboardingManager && attempts < 10) {
                await new Promise(resolve => setTimeout(resolve, 200));
                attempts++;
            }

            if (window.onboardingManager && typeof window.onboardingManager.initialize === 'function') {
                console.log('[Onboarding] Initializing manager...');
                await window.onboardingManager.initialize();
                console.log('[Onboarding] Manager initialized successfully');
            } else {
                console.error('[Onboarding] Manager not available after loading assets');
                console.error('[Onboarding] window.onboardingManager:', window.onboardingManager);
                console.error('[Onboarding] Available globals:', Object.keys(window).filter(k => k.includes('onboard')));
            }
        } catch (error) {
            console.error('[Onboarding] Error during initialization:', error);
        }
    }

    function hookLoginFlow() {
        // Hook into showDashboard if it exists
        const originalShowDashboard = window.showDashboard;
        if (originalShowDashboard) {
            window.showDashboard = async function(...args) {
                const result = originalShowDashboard.apply(this, args);
                setTimeout(() => initializeOnboarding(), 500);
                return result;
            };
        }

        // Also watch for login state changes
        const checkLoginState = () => {
            const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
            if (isLoggedIn) {
                setTimeout(() => initializeOnboarding(), 1000);
            }
        };

        // Check immediately
        checkLoginState();

        // Watch for changes
        const originalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function(key, value) {
            originalSetItem.apply(this, arguments);
            if (key === 'isLoggedIn' && value === 'true') {
                setTimeout(() => initializeOnboarding(), 1000);
            }
        };
    }

    function hookKeyboardShortcut() {
        document.addEventListener('keydown', (event) => {
            const isShortcut = (event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'o';
            if (!isShortcut) return;
            event.preventDefault();
            loadAssets().then(() => {
                if (window.onboardingManager) {
                    window.onboardingManager.replay();
                }
            });
        });
    }

    hookLoginFlow();
    hookKeyboardShortcut();

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        initializeOnboarding();
    } else {
        window.addEventListener('DOMContentLoaded', initializeOnboarding);
    }

    window.triggerOnboardingTutorial = () => initializeOnboarding();
})();


