/**
 * Houses Manager for CareConnect Pro CM Tracker
 * Manages residential houses where clients stay
 */

class HousesManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.houses = [];
        this.storeName = 'houses';
        
        // Default houses for Family First
        this.defaultHouses = [
            { id: 'house_nest', name: 'NEST', displayOrder: 1, isActive: true },
            { id: 'house_cove', name: 'Cove', displayOrder: 2, isActive: true },
            { id: 'house_hedge', name: 'Hedge', displayOrder: 3, isActive: true },
            { id: 'house_meridian', name: 'Meridian', displayOrder: 4, isActive: true },
            { id: 'house_banyan', name: 'Banyan', displayOrder: 5, isActive: true },
            { id: 'house_preserve', name: 'Preserve', displayOrder: 6, isActive: true }
        ];
    }

    /**
     * Initialize houses manager
     */
    async initialize() {
        try {
            // Initialize default houses in database
            await this.dbManager.initializeHouses();
            
            // Load houses into memory
            await this.loadHouses();
            
            console.log('✅ Houses Manager initialized with', this.houses.length, 'houses');
        } catch (error) {
            console.error('Failed to initialize Houses Manager:', error);
            throw error;
        }
    }

    /**
     * Load houses from database
     */
    async loadHouses() {
        try {
            this.houses = await this.dbManager.getHouses();
            return this.houses;
        } catch (error) {
            console.error('Failed to load houses:', error);
            return [];
        }
    }

    /**
     * Get all houses
     */
    getHouses() {
        return this.houses;
    }

    /**
     * Get active houses
     */
    getActiveHouses() {
        return this.houses.filter(house => house.isActive);
    }

    /**
     * Get house by ID
     */
    getHouseById(id) {
        return this.houses.find(house => house.id === id);
    }

    /**
     * Get house by name
     */
    getHouseByName(name) {
        return this.houses.find(house =>
            house.name.toLowerCase() === name.toLowerCase()
        );
    }

    /**
     * Get clients assigned to a house
     */
    async getClientsByHouse(houseId, options = {}) {
        const { includeDischarged = true, includeArchived = false } = options;
        try {
            const clients = await this.dbManager.getClientsByHouse(houseId);
            return clients.filter(client => {
                if (!includeDischarged && client.dischargeDate) {
                    return false;
                }
                if (!includeArchived && client.isArchived) {
                    return false;
                }
                return true;
            });
        } catch (error) {
            console.error('Failed to get clients for house:', error);
            return [];
        }
    }

    /**
     * Add new house
     */
    async addHouse(name) {
        try {
            // Check if house already exists
            const existing = this.getHouseByName(name);
            if (existing) {
                throw new Error(`House "${name}" already exists`);
            }
            
            // Generate ID and display order
            const id = `house_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
            const displayOrder = Math.max(...this.houses.map(h => h.displayOrder || 0)) + 1;
            
            const newHouse = {
                id,
                name,
                displayOrder,
                isActive: true,
                createdAt: Date.now()
            };
            
            // Save to database
            await this.dbManager.put(this.storeName, newHouse);
            
            // Add to local array
            this.houses.push(newHouse);
            this.houses.sort((a, b) => a.displayOrder - b.displayOrder);
            
            return newHouse;
        } catch (error) {
            console.error('Failed to add house:', error);
            throw error;
        }
    }

    /**
     * Update house
     */
    async updateHouse(id, updates) {
        try {
            const house = this.getHouseById(id);
            if (!house) {
                throw new Error('House not found');
            }
            
            // Update house object
            const updatedHouse = {
                ...house,
                ...updates,
                updatedAt: Date.now()
            };
            
            // Save to database
            await this.dbManager.put(this.storeName, updatedHouse);
            
            // Update local array
            const index = this.houses.findIndex(h => h.id === id);
            this.houses[index] = updatedHouse;
            
            return updatedHouse;
        } catch (error) {
            console.error('Failed to update house:', error);
            throw error;
        }
    }

    /**
     * Toggle house active status
     */
    async toggleHouseStatus(id) {
        const house = this.getHouseById(id);
        if (!house) {
            throw new Error('House not found');
        }
        
        return this.updateHouse(id, { isActive: !house.isActive });
    }

    /**
     * Get client count for a house
     */
    async getClientCount(houseId, activeOnly = true) {
        try {
            const clients = await this.dbManager.getClientsByHouse(houseId);
            
            if (activeOnly) {
                return clients.filter(client => client.status === 'active').length;
            }
            
            return clients.length;
        } catch (error) {
            console.error('Failed to get client count:', error);
            return 0;
        }
    }

    /**
     * Get all client counts
     */
    async getAllClientCounts(activeOnly = true) {
        const counts = {};
        
        for (const house of this.houses) {
            counts[house.id] = await this.getClientCount(house.id, activeOnly);
        }
        
        return counts;
    }

    /**
     * Get house statistics
     */
    async getHouseStatistics(houseId) {
        try {
            const clients = await this.dbManager.getClientsByHouse(houseId);
            const activeClients = clients.filter(c => c.status === 'active');
            const dischargedClients = clients.filter(c => c.status === 'discharged');
            
            // Calculate average length of stay
            let totalDaysInCare = 0;
            let clientsWithAdmissionDate = 0;
            
            for (const client of clients) {
                if (client.admissionDate) {
                    const daysInCare = this.dbManager.calculateDaysInCare(
                        client.admissionDate,
                        client.dischargeDate
                    );
                    totalDaysInCare += daysInCare;
                    clientsWithAdmissionDate++;
                }
            }
            
            const avgLengthOfStay = clientsWithAdmissionDate > 0 
                ? Math.round(totalDaysInCare / clientsWithAdmissionDate)
                : 0;
            
            // Get milestone completion rates
            let totalMilestones = 0;
            let completedMilestones = 0;
            
            for (const client of activeClients) {
                const milestones = await this.dbManager.getClientMilestones(client.id);
                totalMilestones += milestones.length;
                completedMilestones += milestones.filter(m => m.status === 'complete').length;
            }
            
            const milestoneCompletionRate = totalMilestones > 0
                ? Math.round((completedMilestones / totalMilestones) * 100)
                : 0;
            
            return {
                totalClients: clients.length,
                activeClients: activeClients.length,
                dischargedClients: dischargedClients.length,
                avgLengthOfStay,
                milestoneCompletionRate,
                occupancyRate: Math.round((activeClients.length / 10) * 100) // Assuming 10 beds per house
            };
        } catch (error) {
            console.error('Failed to get house statistics:', error);
            return {
                totalClients: 0,
                activeClients: 0,
                dischargedClients: 0,
                avgLengthOfStay: 0,
                milestoneCompletionRate: 0,
                occupancyRate: 0
            };
        }
    }

    /**
     * Export house data
     */
    async exportHouseData(houseId) {
        try {
            const house = this.getHouseById(houseId);
            if (!house) {
                throw new Error('House not found');
            }
            
            const clients = await this.dbManager.getClientsByHouse(houseId);
            const stats = await this.getHouseStatistics(houseId);
            
            // Get detailed client data
            const detailedClients = [];
            for (const client of clients) {
                const milestones = await this.dbManager.getClientMilestones(client.id);
                const assessments = await this.dbManager.getClientAssessments(client.id);
                const aftercareOptions = await this.dbManager.getClientAftercareOptions(client.id);
                
                detailedClients.push({
                    ...client,
                    milestones,
                    assessments,
                    aftercareOptions,
                    daysInCare: this.dbManager.calculateDaysInCare(
                        client.admissionDate,
                        client.dischargeDate
                    )
                });
            }
            
            return {
                house,
                statistics: stats,
                clients: detailedClients,
                exportDate: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to export house data:', error);
            throw error;
        }
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.HousesManager = HousesManager;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HousesManager;
}








