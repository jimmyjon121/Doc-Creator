// Quick demo data loader
(function() {
    console.log('Demo data loader initializing...');
    
    // Wait for all components to be ready
    let checkInterval = setInterval(async function() {
        if (window.clientManager && 
            window.demoDataGenerator && 
            window.dashboardManager && 
            window.dashboardWidgets) {
            
            clearInterval(checkInterval);
            
            // Check if we have any clients
            const clients = await window.clientManager.getAllClients();
            console.log('Found', clients.length, 'existing clients');
            
            if (clients.length === 0) {
                console.log('No clients found, creating demo data...');
                
                try {
                    // Create demo clients
                    const demoClients = window.demoDataGenerator.createClients(40);
                    const created = [];
                    
                    for (const clientData of demoClients) {
                        try {
                            const client = await window.clientManager.createClient(clientData);
                            created.push(client);
                        } catch (err) {
                            console.warn('Failed to create client:', err);
                        }
                    }
                    
                    console.log('✅ Created', created.length, 'demo clients');
                    
                    // Refresh dashboard if it's active
                    const dashboardTab = document.getElementById('dashboardTab');
                    if (dashboardTab && dashboardTab.classList.contains('active')) {
                        await window.dashboardManager.refreshDashboard();
                        await window.dashboardWidgets.renderAll();
                        console.log('✅ Dashboard refreshed');
                    }
                } catch (error) {
                    console.error('Failed to create demo data:', error);
                }
            }
        }
    }, 500);
})();
