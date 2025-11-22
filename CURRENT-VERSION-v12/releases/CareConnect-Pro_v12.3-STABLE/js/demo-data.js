/**
 * Demo Data Generator for CareConnect Pro
 * Development-only utility for consistent test data
 * Version 2.0 - Clean implementation
 */

(function() {
    'use strict';

    // Only allow in development environment
    const isDevelopment = window.location.hostname === 'localhost' || 
                         window.location.hostname === '127.0.0.1' ||
                         window.location.protocol === 'file:';

    if (!isDevelopment) {
        console.warn('Demo data generator is only available in development environment');
        return;
    }

    const DemoDataGenerator = {
        // Sample data pools
        firstNames: ['Alex', 'Jordan', 'Casey', 'Morgan', 'Riley', 'Taylor', 'Jamie', 'Drew', 'Avery', 'Quinn'],
        lastNames: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'],
        houses: ['NEST', 'HAVEN', 'BRIDGE', 'SUMMIT'],
        careRoles: ['CM', 'BHT', 'RN', 'MD', 'LCSW'],
        insuranceTypes: ['Private', 'Medicaid', 'Medicare', 'Self-Pay'],

        /**
         * Generate initials from names
         */
        generateInitials(firstName, lastName) {
            return (firstName[0] + lastName[0]).toUpperCase();
        },

        /**
         * Generate random date within range
         */
        randomDate(start, end) {
            return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
        },

        /**
         * Generate a single demo client
         */
        generateClient(index) {
            const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
            const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
            const initials = this.generateInitials(firstName, lastName);
            const house = this.houses[Math.floor(Math.random() * this.houses.length)];
            
            // Generate dates
            const today = new Date();
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const oneMonthAgo = new Date(today);
            oneMonthAgo.setMonth(today.getMonth() - 1);
            const oneMonthFromNow = new Date(today);
            oneMonthFromNow.setMonth(today.getMonth() + 1);

            const admissionDate = this.randomDate(sixMonthsAgo, oneMonthAgo);
            const isActive = Math.random() > 0.2; // 80% active clients
            const dischargeDate = isActive ? null : this.randomDate(admissionDate, today);

            return {
                initials: initials,
                kipuId: `KIPU${String(1000 + index).padStart(4, '0')}`,
                houseId: house,
                admissionDate: admissionDate.toISOString().split('T')[0],
                dischargeDate: dischargeDate ? dischargeDate.toISOString().split('T')[0] : null,
                
                // Pre-admission data
                referralDate: new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                intakeScheduledDate: new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                insuranceVerified: true,
                bedAssignment: `${house}-Room${Math.floor(Math.random() * 10) + 1}`,
                
                // Care team (initials only)
                primaryCM: this.generateInitials(
                    this.firstNames[Math.floor(Math.random() * this.firstNames.length)],
                    this.lastNames[Math.floor(Math.random() * this.lastNames.length)]
                ),
                backupCM: this.generateInitials(
                    this.firstNames[Math.floor(Math.random() * this.firstNames.length)],
                    this.lastNames[Math.floor(Math.random() * this.lastNames.length)]
                ),
                
                // Medical team (initials)
                primaryRN: this.generateInitials(
                    this.firstNames[Math.floor(Math.random() * this.firstNames.length)],
                    this.lastNames[Math.floor(Math.random() * this.lastNames.length)]
                ),
                psychiatrist: 'Dr. ' + this.lastNames[Math.floor(Math.random() * this.lastNames.length)][0],
                
                // Insurance info (no PHI)
                insuranceType: this.insuranceTypes[Math.floor(Math.random() * this.insuranceTypes.length)],
                insuranceAuthDays: Math.floor(Math.random() * 30) + 10,
                insuranceAuthExpiry: oneMonthFromNow.toISOString().split('T')[0],
                
                // Progress tracking
                lastProgressNote: new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                treatmentPlanDue: new Date(today.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                nextReview: new Date(today.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                
                // Metadata
                createdAt: admissionDate.toISOString(),
                updatedAt: today.toISOString(),
                lastModifiedBy: 'demo-generator'
            };
        },

        /**
         * Clear all existing client data
         */
        async clearAllClients() {
            // console.log('🗑️ Clearing all existing client data...');
            
            if (window.clientManager) {
                try {
                    // Get all clients
                    const clients = await window.clientManager.getAllClients();
                    
                    // Delete each client
                    for (const client of clients) {
                        await window.clientManager.deleteClient(client.id);
                    }
                    
                    // console.log(`✅ Cleared ${clients.length} existing clients`);
                    return true;
                } catch (error) {
                    console.error('❌ Error clearing clients:', error);
                    return false;
                }
            } else {
                console.warn('⚠️ Client manager not available');
                return false;
            }
        },

        /**
         * Generate and save demo clients
         */
        async generateDemoClients(count = 10) {
            // console.log(`🎲 Generating ${count} demo clients...`);
            
            if (!window.clientManager) {
                console.error('❌ Client manager not available');
                return false;
            }

            const generatedClients = [];
            
            try {
                for (let i = 0; i < count; i++) {
                    const clientData = this.generateClient(i + 1);
                    const client = await window.clientManager.createClient(clientData);
                    generatedClients.push(client);
                    // console.log(`  ✅ Created client: ${clientData.initials} (${clientData.kipuId})`);
                }
                
                // console.log(`🎉 Successfully generated ${count} demo clients`);
                
                // Trigger UI update if available
                if (window.clientManager.notifyListeners) {
                    window.clientManager.notifyListeners();
                }
                
                // Update any open UI components
                if (window.refreshClientList) {
                    window.refreshClientList();
                }
                
                return generatedClients;
            } catch (error) {
                console.error('❌ Error generating demo clients:', error);
                return false;
            }
        },

        /**
         * Reset and regenerate demo data
         */
        async resetDemoData(count = 10) {
            console.log('🔄 Resetting demo data...');
            
            // Clear existing data
            const cleared = await this.clearAllClients();
            if (!cleared) {
                console.error('❌ Failed to clear existing data');
                return false;
            }
            
            // Wait a moment for UI to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Generate new demo data
            const generated = await this.generateDemoClients(count);
            if (!generated) {
                console.error('❌ Failed to generate new demo data');
                return false;
            }
            
            console.log('✅ Demo data reset complete');
            return true;
        },

        /**
         * Initialize demo data system
         */
        init() {
            // Add to window for console access in development
            window.demoData = {
                generate: (count) => this.generateDemoClients(count),
                clear: () => this.clearAllClients(),
                reset: (count) => this.resetDemoData(count)
            };
            
            console.log('📊 Demo Data Generator initialized');
            console.log('   Commands available in console:');
            console.log('   - demoData.generate(10) - Generate 10 demo clients');
            console.log('   - demoData.clear() - Clear all clients');
            console.log('   - demoData.reset(10) - Clear and regenerate with 10 clients');
        }
    };

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => DemoDataGenerator.init());
    } else {
        DemoDataGenerator.init();
    }

    // Export for module use
    window.DemoDataGenerator = DemoDataGenerator;
})();
