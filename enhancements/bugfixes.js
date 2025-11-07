// Bugfixes for CareConnect Pro

console.log('🔧 Bugfixes loaded');

// Fix for missing initializeEnhancedFeatures function
if (typeof window.initializeEnhancedFeatures === 'undefined') {
    window.initializeEnhancedFeatures = function() {
        console.log('✅ Enhanced features initialized (fallback)');
        
        // Initialize any enhanced features that need setup
        if (typeof window.CoachProfiles !== 'undefined') {
            // Coach profiles are already initialized
        }
        
        // Ensure databases are initialized
        if (typeof window.dbManager !== 'undefined' && window.dbManager.initialize) {
            window.dbManager.initialize().catch(err => {
                console.error('Failed to initialize database:', err);
            });
        }
        
        // Initialize client manager if available
        if (typeof window.ClientManager !== 'undefined' && !window.clientManager) {
            window.clientManager = new ClientManager(window.dbManager);
        }
        
        // Initialize dashboard manager if available
        if (typeof window.DashboardManager !== 'undefined' && !window.dashboardManager) {
            window.dashboardManager = new DashboardManager();
            window.dashboardManager.initialize();
        }
    };
}

// Fix for missing initializeClientSelector function
if (typeof window.initializeClientSelector === 'undefined') {
    window.initializeClientSelector = function() {
        console.log('✅ Client selector initialized (fallback)');
        
        const selector = document.getElementById('clientSelector');
        if (selector && window.clientManager) {
            // Load clients into selector
            window.clientManager.getAllClients().then(clients => {
                selector.innerHTML = '<option value="">Select a client...</option>';
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = `${client.initials} - ${client.kipuId || 'No ID'}`;
                    selector.appendChild(option);
                });
            }).catch(err => {
                console.error('Failed to load clients:', err);
                selector.innerHTML = '<option value="">No clients available</option>';
            });
        } else {
            console.log('Client manager not available, using manual entry');
            const selectorContainer = document.getElementById('clientSelectorContainer');
            const manualContainer = document.getElementById('manualEntryContainer');
            if (selectorContainer) selectorContainer.style.display = 'none';
            if (manualContainer) manualContainer.style.display = 'block';
        }
    };
}

// Fix for database initialization issues
document.addEventListener('DOMContentLoaded', function() {
    // Ensure programs are loaded
    if (!window.programs || window.programs.length === 0) {
        console.warn('⚠️ Programs not loaded, attempting to initialize...');
        // Programs should be defined in the main HTML
        // Force a reload if they're missing
        setTimeout(() => {
            if (!window.programs || window.programs.length === 0) {
                console.error('❌ Programs still not loaded - check main HTML file');
            } else {
                console.log('✅ Programs loaded:', window.programs.length, 'programs');
            }
        }, 1000);
    } else {
        console.log('✅ Programs already loaded:', window.programs.length, 'programs');
    }
    
    // Fix for dashboard not showing
    const dashboardTab = document.getElementById('dashboardTab');
    if (dashboardTab && dashboardTab.style.display === 'none') {
        console.log('🔧 Fixing hidden dashboard tab');
        dashboardTab.style.display = '';
    }
});

// Fix for Chrome extension file:// protocol issues
if (window.location.protocol === 'file:') {
    // Disable service worker registration for file protocol
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register = function() {
            console.log('Service Worker registration disabled for file:// protocol');
            return Promise.reject(new Error('Service Worker not supported on file:// protocol'));
        };
    }
}

// Login screen protection - DISABLED (NUCLEAR OPTION now guarded at source)
// The NUCLEAR OPTION setInterval is now properly guarded to exit when not logged in
// No counter-interval needed anymore
(function() {
    console.log('🔧 Login screen protection disabled (not needed - source is guarded)');
})();

// Ensure login screen is visible if not logged in
window.addEventListener('load', function() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (!isLoggedIn && loginScreen && mainApp) {
        console.log('🔧 Showing login screen');
        loginScreen.style.display = 'flex';
        loginScreen.style.visibility = 'visible';
        loginScreen.style.opacity = '1';
        loginScreen.style.zIndex = '10000';
        loginScreen.style.position = 'fixed';
        loginScreen.style.left = '0';
        loginScreen.style.top = '0';
        loginScreen.style.right = '0';
        loginScreen.style.bottom = '0';
        mainApp.style.display = 'none';
    }
});

// Also ensure login screen shows on DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
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
    }
});

console.log('✅ Bugfixes applied');