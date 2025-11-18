// Test script to debug demo data generation
console.log('=== Testing Demo Data Generation ===');

// Step 1: Check if components are loaded
console.log('1. Checking components:');
console.log('   - demoDataGenerator:', !!window.demoDataGenerator);
console.log('   - clientManager:', !!window.clientManager);
console.log('   - dashboardManager:', !!window.dashboardManager);
console.log('   - indexedDBManager:', !!window.indexedDBManager);

// Step 2: Test demo data generator directly
if (window.demoDataGenerator) {
    console.log('\n2. Testing demo data generator:');
    const testData = window.demoDataGenerator.createClients(2);
    console.log('   Generated test data:', testData);
    console.log('   First client:', testData[0]);
}

// Step 3: Check current clients
if (window.clientManager) {
    console.log('\n3. Checking current clients:');
    window.clientManager.getAllClients().then(clients => {
        console.log('   Current client count:', clients.length);
        if (clients.length > 0) {
            console.log('   First client:', clients[0]);
        }
    });
}

// Step 4: Try to create a single demo client manually
async function testCreateSingleClient() {
    console.log('\n4. Testing single client creation:');
    
    if (!window.demoDataGenerator || !window.clientManager) {
        console.error('   Missing required components');
        return;
    }
    
    try {
        // Generate one client data
        const demoData = window.demoDataGenerator.createClients(1)[0];
        console.log('   Demo data generated:', demoData);
        
        // Try to create the client
        const created = await window.clientManager.createClient(demoData);
        console.log('   Client created successfully:', created);
        
        // Refresh dashboard
        if (window.dashboardManager) {
            await window.dashboardManager.refreshDashboard();
            console.log('   Dashboard refreshed');
        }
        
        // Re-render widgets
        if (window.dashboardWidgets) {
            await window.dashboardWidgets.renderAll();
            console.log('   Widgets re-rendered');
        }
        
    } catch (error) {
        console.error('   Error creating client:', error);
    }
}

// Step 5: Check dashboard cache
if (window.dashboardManager) {
    console.log('\n5. Dashboard cache:');
    console.log('   Priorities:', window.dashboardManager.cache?.priorities);
    console.log('   Journey data:', window.dashboardManager.cache?.journeyData);
    console.log('   Metrics:', window.dashboardManager.cache?.metrics);
}

console.log('\n=== Run testCreateSingleClient() to test client creation ===');
window.testCreateSingleClient = testCreateSingleClient;
