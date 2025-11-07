// Bugfixes for CareConnect Pro - ES6+ Modernized

console.log('🔧 Bugfixes loaded');

// Fix for missing initializeEnhancedFeatures function
window.initializeEnhancedFeatures ??= async () => {
    console.log('✅ Enhanced features initialized (fallback)');
    
    // Initialize databases
    if (window.dbManager?.initialize) {
        try {
            await window.dbManager.initialize();
        } catch (err) {
            console.error('Failed to initialize database:', err);
        }
    }
    
    // Initialize client manager if available
    if (window.ClientManager && !window.clientManager) {
        window.clientManager = new ClientManager(window.dbManager);
    }
    
    // Initialize dashboard manager if available
    if (window.DashboardManager && !window.dashboardManager) {
        window.dashboardManager = new DashboardManager();
        await window.dashboardManager.initialize();
    }
};

// Fix for missing initializeClientSelector function
window.initializeClientSelector ??= async () => {
    console.log('✅ Client selector initialized (fallback)');
    
    const selector = document.getElementById('clientSelector');
    if (!selector || !window.clientManager) {
        console.log('Client manager not available, using manual entry');
        const selectorContainer = document.getElementById('clientSelectorContainer');
        const manualContainer = document.getElementById('manualEntryContainer');
        selectorContainer?.style.setProperty('display', 'none');
        manualContainer?.style.setProperty('display', 'block');
        return;
    }
    
    try {
        const clients = await window.clientManager.getAllClients();
        selector.innerHTML = '<option value="">Select a client...</option>';
        
        clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = `${client.initials} - ${client.kipuId || 'No ID'}`;
            selector.appendChild(option);
        });
    } catch (err) {
        console.error('Failed to load clients:', err);
        selector.innerHTML = '<option value="">No clients available</option>';
    }
};

// Fix for database initialization issues
document.addEventListener('DOMContentLoaded', () => {
    // Ensure programs are loaded
    if (!window.programs?.length) {
        console.warn('⚠️ Programs not loaded, attempting to initialize...');
        
        // Check again after a delay
        setTimeout(() => {
            if (!window.programs?.length) {
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
    if (dashboardTab?.style.display === 'none') {
        console.log('🔧 Fixing hidden dashboard tab');
        dashboardTab.style.display = '';
    }
});

// Fix for Chrome extension file:// protocol issues
if (window.location.protocol === 'file:') {
    // Disable service worker registration for file protocol
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register = () => {
            console.log('Service Worker registration disabled for file:// protocol');
            return Promise.reject(new Error('Service Worker not supported on file:// protocol'));
        };
    }
}

// Login screen helper function
const ensureLoginScreenVisible = () => {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (!isLoggedIn && loginScreen && mainApp) {
        console.log('🔧 Showing login screen');
        
        // Apply login screen styles
        Object.assign(loginScreen.style, {
            display: 'flex',
            visibility: 'visible',
            opacity: '1',
            zIndex: '10000',
            position: 'fixed',
            left: '0',
            top: '0',
            right: '0',
            bottom: '0'
        });
        
        mainApp.style.display = 'none';
        return true;
    }
    return false;
};

// Ensure login screen is visible on load
window.addEventListener('load', ensureLoginScreenVisible);
document.addEventListener('DOMContentLoaded', ensureLoginScreenVisible);

console.log('✅ Bugfixes applied');