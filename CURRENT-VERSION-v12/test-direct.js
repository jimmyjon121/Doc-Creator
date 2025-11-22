/**
 * Direct test of demo data generation logic
 */

const fs = require('fs');

// Simulate the generation logic
class DemoDataSimulator {
    constructor() {
        this.firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emily', 'Chris', 'Lisa', 'Tom', 'Amy'];
        this.lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
        this.houses = ['house_nest', 'house_cove', 'house_hedge', 'house_arbor', 'house_grove'];
    }

    generateInitials(firstName, lastName) {
        return `${firstName[0]}${lastName[0]}`;
    }

    simulateGeneration(count = 20) {
        console.log(`\n=== SIMULATING GENERATION OF ${count} CLIENTS ===\n`);
        
        // Distribution logic from demo-data.js
        const stageDistribution = {
            'pre-admission': Math.ceil(count * 0.1),  // 10%
            'early': Math.ceil(count * 0.3),          // 30%
            'mid': Math.ceil(count * 0.25),           // 25%
            'late': Math.ceil(count * 0.2),           // 20%
            'discharged': Math.ceil(count * 0.15)     // 15%
        };
        
        // Adjust to ensure exact count
        const totalDistributed = Object.values(stageDistribution).reduce((a, b) => a + b, 0);
        if (totalDistributed > count) {
            const excess = totalDistributed - count;
            stageDistribution['discharged'] = Math.max(0, stageDistribution['discharged'] - excess);
        }
        
        console.log('Stage Distribution:');
        Object.entries(stageDistribution).forEach(([stage, num]) => {
            console.log(`  ${stage}: ${num} clients`);
        });
        
        const total = Object.values(stageDistribution).reduce((a, b) => a + b, 0);
        console.log(`  TOTAL: ${total} clients\n`);
        
        // Simulate generation
        let clientIndex = 1;
        let generatedClients = [];
        const stages = Object.keys(stageDistribution);
        
        for (const stage of stages) {
            const stageCount = stageDistribution[stage];
            console.log(`Generating ${stageCount} clients for stage: ${stage}`);
            
            let stageCreated = 0;
            let stageAttempts = 0;
            const maxStageAttempts = stageCount * 5;
            
            while (stageCreated < stageCount && stageAttempts < maxStageAttempts) {
                stageAttempts++;
                
                // Simulate client creation
                const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
                const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
                const initials = this.generateInitials(firstName, lastName);
                const kipuId = `KIPU${String(1000 + clientIndex).padStart(4, '0')}`;
                
                // Simulate potential failure (10% chance)
                if (Math.random() < 0.1) {
                    console.log(`  ❌ Failed attempt ${stageAttempts} for ${stage} (simulated failure)`);
                    clientIndex++; // Still increment
                    continue;
                }
                
                generatedClients.push({
                    id: `client_${clientIndex}`,
                    initials,
                    kipuId,
                    stage
                });
                
                console.log(`  ✅ Created ${stage} client #${clientIndex}: ${initials} (${kipuId})`);
                stageCreated++;
                clientIndex++;
            }
            
            if (stageCreated < stageCount) {
                console.log(`  ⚠️ Only created ${stageCreated}/${stageCount} clients for stage ${stage}`);
            }
        }
        
        console.log(`\n=== RESULTS ===`);
        console.log(`Total clients generated: ${generatedClients.length}/${count}`);
        
        // Count by stage
        const stageCounts = {};
        generatedClients.forEach(c => {
            stageCounts[c.stage] = (stageCounts[c.stage] || 0) + 1;
        });
        
        console.log('\nActual distribution:');
        Object.entries(stageCounts).forEach(([stage, num]) => {
            const expected = stageDistribution[stage];
            const status = num === expected ? '✅' : '⚠️';
            console.log(`  ${status} ${stage}: ${num}/${expected}`);
        });
        
        if (generatedClients.length < count) {
            console.log(`\n❌ PROBLEM: Only ${generatedClients.length} clients created instead of ${count}`);
            console.log('This explains why the dashboard shows fewer clients than expected!');
        } else {
            console.log('\n✅ All clients created successfully');
        }
        
        return generatedClients;
    }
}

// Run the simulation
const simulator = new DemoDataSimulator();

// Test multiple times to see consistency
console.log('Running 3 simulations to check consistency:\n');
for (let i = 1; i <= 3; i++) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`SIMULATION ${i}`);
    console.log('='.repeat(60));
    const result = simulator.simulateGeneration(20);
}

// Test with different counts
console.log(`\n${'='.repeat(60)}`);
console.log('TESTING DIFFERENT COUNTS');
console.log('='.repeat(60));

[10, 15, 25, 30].forEach(count => {
    console.log(`\n--- Testing with ${count} clients ---`);
    const result = simulator.simulateGeneration(count);
});
