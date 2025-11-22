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
        // Use the actual house IDs that match HousesManager
        houses: ['house_nest', 'house_cove', 'house_hedge', 'house_meridian', 'house_banyan', 'house_preserve'],
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
         * Generate a single demo client at a specific stage
         * @param {number} index - Client index for unique ID
         * @param {string} stage - Stage: 'pre-admission', 'early', 'mid', 'late', 'discharged'
         */
        generateClient(index, stage = null) {
            const firstName = this.firstNames[Math.floor(Math.random() * this.firstNames.length)];
            const lastName = this.lastNames[Math.floor(Math.random() * this.lastNames.length)];
            const initials = this.generateInitials(firstName, lastName);
            const house = this.houses[Math.floor(Math.random() * this.houses.length)];
            
            const today = new Date();
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const oneMonthFromNow = new Date(today);
            oneMonthFromNow.setMonth(today.getMonth() + 1);

            let admissionDate = null;
            let dischargeDate = null;
            let referralDate = null;
            let intakeScheduledDate = null;
            let daysInCare = 0;

            // Determine stage if not provided
            if (!stage) {
                const rand = Math.random();
                if (rand < 0.1) stage = 'pre-admission';
                else if (rand < 0.3) stage = 'early';
                else if (rand < 0.6) stage = 'mid';
                else if (rand < 0.9) stage = 'late';
                else stage = 'discharged';
            }

            // Generate dates based on stage
            switch (stage) {
                case 'pre-admission':
                    // Pre-admission: referral date set, no admission yet
                    referralDate = this.randomDate(new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000), today);
                    intakeScheduledDate = new Date(referralDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
                    if (intakeScheduledDate > today) {
                        // Scheduled for future
                        admissionDate = null;
                    } else {
                        // Could be admitted soon
                        admissionDate = null;
                    }
                    break;

                case 'early':
                    // Early stage: 0-7 days in care
                    daysInCare = Math.floor(Math.random() * 7);
                    admissionDate = new Date(today.getTime() - daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;

                case 'mid':
                    // Mid stage: 8-20 days in care
                    daysInCare = 8 + Math.floor(Math.random() * 13);
                    admissionDate = new Date(today.getTime() - daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;

                case 'late':
                    // Late stage: 21-28 days in care, discharge planning
                    daysInCare = 21 + Math.floor(Math.random() * 8);
                    admissionDate = new Date(today.getTime() - daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;

                case 'discharged':
                    // Discharged: has discharge date
                    daysInCare = 14 + Math.floor(Math.random() * 21); // 14-35 days total stay
                    const dischargeDaysAgo = Math.floor(Math.random() * 30); // Discharged 0-30 days ago
                    admissionDate = new Date(today.getTime() - (daysInCare + dischargeDaysAgo) * 24 * 60 * 60 * 1000);
                    dischargeDate = new Date(admissionDate.getTime() + daysInCare * 24 * 60 * 60 * 1000);
                    referralDate = new Date(admissionDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                    intakeScheduledDate = new Date(admissionDate.getTime() - 3 * 24 * 60 * 60 * 1000);
                    break;
            }

            // Get current coach initials for development (assign all demo clients to current user)
            const currentCoachInitials = window.ccConfig?.currentUser?.initials || 'JH';
            
            return {
                initials: initials,
                kipuId: `KIPU${String(1000 + index).padStart(4, '0')}`,
                houseId: admissionDate ? house : null, // Only assign house if admitted
                admissionDate: admissionDate ? admissionDate.toISOString().split('T')[0] : null,
                dischargeDate: dischargeDate ? dischargeDate.toISOString().split('T')[0] : null,
                
                // Pre-admission data
                referralDate: referralDate ? referralDate.toISOString().split('T')[0] : null,
                intakeScheduledDate: intakeScheduledDate ? intakeScheduledDate.toISOString().split('T')[0] : null,
                insuranceVerified: stage !== 'pre-admission',
                bedAssignment: admissionDate ? `Room${Math.floor(Math.random() * 10) + 1}` : null,
                
                // Care team (using correct field names that match ClientManager)
                // For development, assign all to current coach so they show up in "My Clients"
                caseManagerInitials: currentCoachInitials,
                clinicalCoachInitials: currentCoachInitials,
                primaryTherapistInitials: this.generateInitials(
                    this.firstNames[Math.floor(Math.random() * this.firstNames.length)],
                    this.lastNames[Math.floor(Math.random() * this.lastNames.length)]
                ),
                familyAmbassadorPrimaryInitials: currentCoachInitials,
                familyAmbassadorSecondaryInitials: this.generateInitials(
                    this.firstNames[Math.floor(Math.random() * this.firstNames.length)],
                    this.lastNames[Math.floor(Math.random() * this.lastNames.length)]
                ),
                
                // Insurance info (no PHI)
                insuranceType: this.insuranceTypes[Math.floor(Math.random() * this.insuranceTypes.length)],
                insuranceAuthDays: Math.floor(Math.random() * 30) + 10,
                insuranceAuthExpiry: oneMonthFromNow.toISOString().split('T')[0],
                
                // Progress tracking
                lastProgressNote: admissionDate ? new Date(today.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                treatmentPlanDue: admissionDate ? new Date(today.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                nextReview: admissionDate ? new Date(today.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : null,
                
                // Required fields for ClientManager
                tags: [],
                notes: `Demo client generated at ${stage} stage`,
                programHistory: [],
                documentHistory: [],
                
                // Metadata
                createdAt: admissionDate ? admissionDate.toISOString() : (referralDate ? new Date(referralDate).toISOString() : today.toISOString()),
                updatedAt: today.toISOString(),
                lastModifiedBy: 'demo-generator',
                isDemo: true,
                _demoStage: stage // Internal tracking
            };
        },

        /**
         * Wait for ClientManager to be ready (used before any client operations)
         */
        async ensureClientManagerReady(timeoutMs = 10000) {
            if (window.clientManager) {
                return true;
            }
            
            console.warn('⚠️ Client manager not ready yet – waiting for initialization…');
            
            return new Promise((resolve) => {
                const onReady = () => {
                    clearTimeout(timer);
                    window.removeEventListener('clientManagerReady', onReady);
                    resolve(!!window.clientManager);
                };
                
                const timer = setTimeout(() => {
                    window.removeEventListener('clientManagerReady', onReady);
                    console.error('❌ Timed out waiting for client manager to initialize');
                    resolve(false);
                }, timeoutMs);
                
                window.addEventListener('clientManagerReady', onReady, { once: true });
            });
        },

        /**
         * Clear all existing client data
         */
        async clearAllClients() {
            // console.log('🗑️ Clearing all existing client data...');
            
            const ready = await this.ensureClientManagerReady();
            if (!ready || !window.clientManager) {
                console.warn('⚠️ Client manager not available – cannot clear clients');
                return false;
            }
            
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
        },

        /**
         * Generate and save demo clients distributed across different stages
         */
        async generateDemoClients(count = 10) {
            // console.log(`🎲 Generating ${count} demo clients...`);
            
            const ready = await this.ensureClientManagerReady();
            if (!ready || !window.clientManager) {
                console.error('❌ Client manager not available – cannot generate demo clients');
                return false;
            }

            // Distribute clients across stages
            const stages = ['pre-admission', 'early', 'mid', 'late', 'discharged'];
            const stageDistribution = {
                'pre-admission': Math.max(1, Math.floor(count * 0.1)),      // 10%
                'early': Math.max(1, Math.floor(count * 0.2)),              // 20%
                'mid': Math.max(1, Math.floor(count * 0.3)),                // 30%
                'late': Math.max(1, Math.floor(count * 0.3)),                // 30%
                'discharged': Math.max(1, Math.floor(count * 0.1))           // 10%
            };

            // Adjust for rounding
            const totalDistributed = Object.values(stageDistribution).reduce((a, b) => a + b, 0);
            if (totalDistributed < count) {
                stageDistribution['mid'] += (count - totalDistributed);
            }

            const generatedClients = [];
            let clientIndex = 1;
            
            try {
                console.log(`🎲 Starting generation of ${count} demo clients...`);
                
                // Generate clients for each stage
                for (const stage of stages) {
                    const stageCount = stageDistribution[stage];
                    console.log(`  Generating ${stageCount} clients for stage: ${stage}`);
                    
                    let stageCreated = 0;
                    let stageAttempts = 0;
                    const maxAttempts = stageCount * 5; // More retries per stage
                    
                    while (stageCreated < stageCount && stageAttempts < maxAttempts) {
                        stageAttempts++;
                        try {
                            const clientData = this.generateClient(clientIndex, stage);
                            if (!clientData.initials || !clientData.kipuId) {
                                throw new Error(`Invalid client data generated for index ${clientIndex}: missing initials or kipuId`);
                            }
                            const client = await window.clientManager.createClient(clientData);
                            if (!client || !client.id) {
                                throw new Error(`Failed to create client: createClient returned invalid result`);
                            }
                            generatedClients.push(client);
                            console.log(`  ✅ Created ${stage} client #${clientIndex}: ${clientData.initials} (${clientData.kipuId})`);
                            stageCreated++;
                            clientIndex++;
                        } catch (clientError) {
                            console.error(`❌ Error creating client (attempt ${stageAttempts} for ${stage}):`, clientError);
                            clientIndex++; // Still increment to avoid duplicate IDs
                            // Continue trying to create the required number for this stage
                        }
                    }
                    
                    if (stageCreated < stageCount) {
                        console.warn(`⚠️ Only created ${stageCreated}/${stageCount} clients for stage ${stage}`);
                    }
                }
                
                // Check if we actually created any clients
                if (generatedClients.length === 0) {
                    throw new Error('Failed to create any clients - all attempts failed');
                }
                
                console.log(`🎉 Successfully generated ${generatedClients.length} demo clients across ${stages.length} stages`);
                
                // Trigger UI update if available
                if (window.clientManager && window.clientManager.notifyListeners) {
                    window.clientManager.notifyListeners();
                }
                
                // Update any open UI components
                if (window.refreshClientList) {
                    window.refreshClientList();
                }
                
                // Refresh dashboard if available
                if (window.initializeDashboard) {
                    setTimeout(() => window.initializeDashboard(true), 500);
                }
                
                return generatedClients;
            } catch (error) {
                console.error('❌ Error generating demo clients:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    clientManagerReady: !!window.clientManager,
                    dbManagerReady: !!window.dbManager
                });
                return false;
            }
        },

        /**
         * Reset and regenerate demo data
         */
        async resetDemoData(count = 10) {
            console.log('🔄 Resetting demo data...');
            
            // Ensure client manager is ready
            const ready = await this.ensureClientManagerReady();
            if (!ready || !window.clientManager) {
                const error = new Error('Client manager not available - cannot reset demo data');
                console.error('❌', error.message);
                throw error;
            }
            
            // Clear existing data
            const cleared = await this.clearAllClients();
            if (!cleared) {
                const error = new Error('Failed to clear existing data');
                console.error('❌', error.message);
                throw error;
            }
            
            // Wait a moment for UI to update
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Generate new demo data
            const generated = await this.generateDemoClients(count);
            if (!generated || !Array.isArray(generated) || generated.length === 0) {
                const error = new Error(`Failed to generate new demo data (expected ${count} clients, got ${generated ? generated.length : 0})`);
                console.error('❌', error.message);
                throw error;
            }
            
            console.log(`✅ Demo data reset complete - created ${generated.length} clients`);
            return true;
        },

        /**
         * Clear demo clients with user confirmation and UI feedback
         */
        async clearDemoData() {
            // Confirm action
            if (!confirm('Are you sure you want to clear ALL client data? This cannot be undone.')) {
                return;
            }

            // Show loading indicator
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px 40px; border-radius: 8px; z-index: 10000; font-family: system-ui;';
            loadingMsg.textContent = 'Clearing all client data...';
            document.body.appendChild(loadingMsg);

            try {
                // Clear existing clients
                const cleared = await this.clearAllClients();
                if (!cleared) {
                    throw new Error('Failed to clear existing clients');
                }

                // Trigger UI update
                if (window.clientManager && window.clientManager.notifyListeners) {
                    window.clientManager.notifyListeners();
                }
                
                // Update any open UI components
                if (window.refreshClientList) {
                    window.refreshClientList();
                }
                
                // Refresh dashboard if available
                if (window.initializeDashboard) {
                    await window.initializeDashboard(true);
                }
                
                // Refresh CM Tracker (Clients tab) explicitly
                if (typeof window.initializeCMTracker === 'function') {
                    console.log('Refreshing CM Tracker after clearing data...');
                    await window.initializeCMTracker();
                }

                loadingMsg.textContent = '✅ All client data cleared successfully!';
                loadingMsg.style.background = 'rgba(0,150,0,0.9)';
                
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) {
                        document.body.removeChild(loadingMsg);
                    }
                }, 2000);
            } catch (error) {
                console.error('❌ Error clearing demo data:', error);
                loadingMsg.textContent = `❌ Error: ${error.message}`;
                loadingMsg.style.background = 'rgba(150,0,0,0.9)';
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) {
                        document.body.removeChild(loadingMsg);
                    }
                }, 3000);
            }
        },

        /**
         * Populate demo clients with user prompt for count
         * Clears existing clients first, then generates new ones at different stages
         */
        async populateDemoClients() {
            // Prompt for count
            const countStr = prompt('How many demo clients would you like to generate?\n\nClients will be distributed across different stages:\n- Pre-admission (10%)\n- Early stage (20%)\n- Mid stage (30%)\n- Late stage (30%)\n- Discharged (10%)', '20');
            
            if (!countStr) {
                return; // User cancelled
            }
            
            const count = parseInt(countStr, 10);
            if (isNaN(count) || count < 1 || count > 1000) {
                alert('Please enter a valid number between 1 and 1000');
                return;
            }

            // Show loading indicator
            const loadingMsg = document.createElement('div');
            loadingMsg.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0,0,0,0.9); color: white; padding: 20px 40px; border-radius: 8px; z-index: 10000; font-family: system-ui;';
            loadingMsg.textContent = `Clearing existing clients and generating ${count} new demo clients...`;
            document.body.appendChild(loadingMsg);

            try {
                // Ensure client manager is ready first
                const ready = await this.ensureClientManagerReady();
                if (!ready || !window.clientManager) {
                    throw new Error('Client manager is not ready. Please wait a moment and try again.');
                }

                // Clear existing clients
                loadingMsg.textContent = `Clearing existing clients...`;
                const cleared = await this.clearAllClients();
                if (!cleared) {
                    throw new Error('Failed to clear existing clients. The database may be locked or unavailable.');
                }

                // Wait a moment for UI to update
                await new Promise(resolve => setTimeout(resolve, 500));

                // Generate new clients
                loadingMsg.textContent = `Generating ${count} new demo clients...`;
                const generated = await this.generateDemoClients(count);
                if (!generated || !Array.isArray(generated) || generated.length === 0) {
                    throw new Error(`Failed to generate demo clients. Expected ${count}, but got ${generated ? generated.length : 0}. Check console for details.`);
                }

                // Trigger comprehensive UI refresh
                loadingMsg.textContent = `Refreshing all views...`;
                
                // Force complete refresh of all UI components
                if (window.clientManager && window.clientManager.notifyListeners) {
                    window.clientManager.notifyListeners();
                }
                
                if (window.refreshClientList) {
                    window.refreshClientList();
                }
                
                if (window.initializeDashboard) {
                    await window.initializeDashboard(true);
                }
                
                // Refresh CM Tracker (Clients tab) explicitly
                if (typeof window.initializeCMTracker === 'function') {
                    console.log('Refreshing CM Tracker after demo data generation...');
                    await window.initializeCMTracker();
                }
                
                // Emit global event for any listeners
                if (window.eventBus) {
                    window.eventBus.emit('clients:updated');
                    window.eventBus.emit('dashboard:refresh');
                }
                
                loadingMsg.textContent = `✅ Successfully generated ${generated.length} demo clients!`;
                loadingMsg.style.background = 'rgba(0,150,0,0.9)';
                
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) {
                        document.body.removeChild(loadingMsg);
                    }
                }, 2000);
            } catch (error) {
                console.error('❌ Error populating demo clients:', error);
                console.error('Error stack:', error.stack);
                loadingMsg.textContent = `❌ Error: ${error.message}`;
                loadingMsg.style.background = 'rgba(150,0,0,0.9)';
                setTimeout(() => {
                    if (document.body.contains(loadingMsg)) {
                        document.body.removeChild(loadingMsg);
                    }
                }, 5000);
            }
        },

        /**
         * Initialize demo data system
         */
        init() {
            // Add to window for console access in development
            window.demoData = {
                generate: (count) => this.generateDemoClients(count),
                clear: () => this.clearAllClients(),
                reset: (count) => this.resetDemoData(count),
                populate: () => this.populateDemoClients(),
                clearUI: () => this.clearDemoData()
            };
            
            // Expose functions globally for button onclick
            window.populateDemoClients = () => this.populateDemoClients();
            window.clearDemoData = () => this.clearDemoData();
            
            console.log('📊 Demo Data Generator initialized');
            console.log('   Commands available in console:');
            console.log('   - demoData.generate(10) - Generate 10 demo clients');
            console.log('   - demoData.clear() - Clear all clients (no UI)');
            console.log('   - demoData.clearUI() - Clear all clients (with UI)');
            console.log('   - demoData.reset(10) - Clear and regenerate with 10 clients');
            console.log('   - demoData.populate() - Prompt and populate demo clients');
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
