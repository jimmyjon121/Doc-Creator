// Quick fix for dashboard data
console.log('Running quick fix for dashboard data...');

(async function() {
    // Wait a moment for everything to be loaded
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (!window.clientManager || !window.demoDataGenerator) {
        console.error('Required components not loaded. Please refresh the page.');
        return;
    }
    
    try {
        // Check current clients
        const currentClients = await window.clientManager.getAllClients();
        console.log('Current clients:', currentClients.length);
        
        if (currentClients.length === 0) {
            console.log('Creating demo clients...');
            
            // Generate demo data
            const demoData = window.demoDataGenerator.createClients(40);
            const created = [];
            
            for (const data of demoData) {
                try {
                    const client = await window.clientManager.createClient(data);
                    created.push(client);
                } catch (e) {
                    console.warn('Failed to create client:', e.message);
                }
            }
            
            console.log('✅ Created', created.length, 'clients');
        }
        
        // Switch to dashboard and refresh
        console.log('Switching to dashboard...');
        if (window.switchTab) {
            window.switchTab('dashboard');
        }
        
        // Wait for dashboard to load
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Force refresh
        if (window.dashboardManager) {
            console.log('Refreshing dashboard...');
            await window.dashboardManager.refreshDashboard();
        }
        
        if (window.dashboardWidgets) {
            console.log('Re-rendering widgets...');
            await window.dashboardWidgets.renderAll();
        }
        
        console.log('✅ Dashboard should now show data!');
        
    } catch (error) {
        console.error('Error in quick fix:', error);
    }
})();
