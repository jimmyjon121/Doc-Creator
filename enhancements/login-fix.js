// Fix for login screen not showing

console.log('🔐 Login fix applied');

// IMMEDIATE FIX: Set mainApp to hidden before anything else runs
// This runs as early as possible to prevent any display conflicts
(function() {
    // Force mainApp to be hidden immediately if not logged in
    function forceLoginScreen() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        
        // Use requestAnimationFrame to ensure DOM is ready
        requestAnimationFrame(function() {
            const mainApp = document.getElementById('mainApp');
            const loginScreen = document.getElementById('loginScreen');
            
            if (!isLoggedIn) {
                // Force mainApp hidden
                if (mainApp) {
                    mainApp.style.cssText = 'display: none !important;';
                }
                // Force login screen visible
                if (loginScreen) {
                    loginScreen.style.cssText = 'display: flex !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 10000 !important; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important; align-items: center !important; justify-content: center !important;';
                }
            }
        });
    }
    
    // Run multiple times to catch it early
    forceLoginScreen();
    
    // Also run when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', forceLoginScreen);
    } else {
        forceLoginScreen();
    }
    
    // Also run after a short delay to catch late-loading scripts
    setTimeout(forceLoginScreen, 100);
    setTimeout(forceLoginScreen, 500);
})();

// Override DEV_MODE to ensure login screen shows
(function() {
    // Remove any auto-login that was set
    const isManuallyLoggedIn = sessionStorage.getItem('manualLogin') === 'true';
    
    // Only clear auto-login if a DEV auto-login flag was set, not after manual login attempts
    if (!isManuallyLoggedIn && sessionStorage.getItem('isAutoLogin') === 'true') {
        console.log('🔓 Clearing previous auto-login credentials');
        sessionStorage.removeItem('isLoggedIn');
        sessionStorage.removeItem('username');
        sessionStorage.removeItem('userRole');
        sessionStorage.removeItem('fullName');
        sessionStorage.removeItem('isAutoLogin');
    }
    
    // Ensure login screen is visible on load
    window.addEventListener('DOMContentLoaded', function() {
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        const loginScreen = document.getElementById('loginScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (!isLoggedIn) {
            if (loginScreen) {
                loginScreen.style.display = 'flex';
                loginScreen.style.visibility = 'visible';
                loginScreen.style.opacity = '1';
                loginScreen.style.zIndex = '10000';
                loginScreen.style.position = 'fixed';
                loginScreen.style.left = '0';
                loginScreen.style.top = '0';
                loginScreen.style.right = '0';
                loginScreen.style.bottom = '0';
            }
            if (mainApp) {
                mainApp.style.display = 'none';
            }
            console.log('✅ Login screen displayed');
        } else {
            console.log('✅ User is logged in');
        }
    });
    
    // Mark login as manual when user successfully logs in
    // Wait for handleLogin to be defined
    window.addEventListener('DOMContentLoaded', function() {
        const originalHandleLogin = window.handleLogin;
        if (originalHandleLogin) {
            window.handleLogin = async function(...args) {
                const result = await originalHandleLogin.apply(this, args);
                if (sessionStorage.getItem('isLoggedIn') === 'true') {
                    sessionStorage.setItem('manualLogin', 'true');
                }
                return result;
            };
        }
    });
})();
