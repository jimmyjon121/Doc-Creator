// Fix hidden parent elements preventing dashboard from showing
(function() {
    console.log('🔧 Fixing parent element visibility...');
    
    // Fix mainApp if it exists
    const mainApp = document.getElementById('mainApp') || document.querySelector('.mainApp');
    if (mainApp) {
        mainApp.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: relative !important;
        `;
        console.log('✅ mainApp made visible');
    }
    
    // Fix container
    const container = document.querySelector('.container');
    if (container) {
        container.style.cssText = `
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            background: white !important;
            min-height: 100vh !important;
            position: relative !important;
        `;
        console.log('✅ Container made visible');
    }
    
    // Ensure body is visible
    document.body.style.cssText += `
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        overflow: visible !important;
    `;
    
    // Remove any login screens or overlays
    const loginScreen = document.getElementById('loginScreen') || document.querySelector('.login-screen');
    if (loginScreen) {
        loginScreen.style.display = 'none';
        console.log('✅ Login screen hidden');
    }
    
    // Remove any splash screens
    const splashScreen = document.getElementById('splashScreen') || document.querySelector('.splash-screen');
    if (splashScreen) {
        splashScreen.style.display = 'none';
        console.log('✅ Splash screen hidden');
    }
    
    // Force all parent elements of dashboard to be visible
    let element = document.getElementById('dashboardTab');
    while (element && element !== document.body) {
        const styles = window.getComputedStyle(element);
        if (styles.display === 'none' || styles.visibility === 'hidden' || styles.opacity === '0') {
            element.style.display = 'block';
            element.style.visibility = 'visible';
            element.style.opacity = '1';
            console.log(`✅ Made visible: ${element.id || element.className}`);
        }
        element = element.parentElement;
    }
    
    // Check for any overlays blocking view
    document.querySelectorAll('[class*="overlay"], [class*="modal"], [class*="popup"]').forEach(el => {
        const styles = window.getComputedStyle(el);
        if (styles.position === 'fixed' && styles.display !== 'none') {
            // Don't hide if it contains dashboard
            if (!el.querySelector('.dashboard-container')) {
                el.style.display = 'none';
                console.log(`✅ Hidden overlay: ${el.className}`);
            }
        }
    });
    
    console.log('✅ Parent visibility fix complete');
})();
