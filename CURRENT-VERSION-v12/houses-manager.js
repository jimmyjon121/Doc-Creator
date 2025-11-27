/**
 * Houses Manager for CareConnect Pro CM Tracker
 * Manages residential houses where clients stay
 */

class HousesManager {
    constructor(dbManager) {
        this.dbManager = dbManager;
        this.houses = [];
        this.storeName = 'houses';
        
        // Default houses for Family First with capacity and sub-units
        this.defaultHouses = [
            { 
                id: 'house_nest', 
                name: 'NEST', 
                displayOrder: 1, 
                isActive: true,
                capacity: 20,
                programType: 'neurodivergent', // Clinical designation
                subUnits: [
                    { id: 'nest_preserve', name: 'Preserve', capacity: 12 },
                    { id: 'nest_prosperity', name: 'Prosperity', capacity: 8 }
                ]
            },
            { 
                id: 'house_cove', 
                name: 'Cove', 
                displayOrder: 2, 
                isActive: true,
                capacity: 15,
                programType: 'residential',
                subUnits: [
                    { id: 'cove_unit_a', name: 'Unit A', capacity: 8 },
                    { id: 'cove_unit_b', name: 'Unit B', capacity: 7 }
                    // Unit C is school/group - not beds
                ]
            },
            { id: 'house_hedge', name: 'Hedge', displayOrder: 3, isActive: true, capacity: 12, programType: 'residential' },
            { id: 'house_meridian', name: 'Meridian', displayOrder: 4, isActive: true, capacity: 10, programType: 'residential' },
            { id: 'house_banyan', name: 'Banyan', displayOrder: 5, isActive: true, capacity: 10, programType: 'residential' }
            // Note: Preserve and Prosperity as standalone houses are deprecated - they're NEST sub-units
        ];
        
        // Total capacity across all houses
        this.totalCapacity = this.defaultHouses.reduce((sum, h) => sum + (h.capacity || 0), 0);
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
            
            // Get actual capacity for this house
            const capacity = this.getHouseCapacity(houseId);
            
            return {
                totalClients: clients.length,
                activeClients: activeClients.length,
                dischargedClients: dischargedClients.length,
                avgLengthOfStay,
                milestoneCompletionRate,
                capacity,
                occupancyRate: Math.round((activeClients.length / capacity) * 100)
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

    // ═══════════════════════════════════════════════════════════════════════════
    // OCCUPANCY & CENSUS METHODS
    // ═══════════════════════════════════════════════════════════════════════════

    /**
     * Get occupancy data for a specific house
     * @param {string} houseId - The house ID
     * @returns {Object} { current, capacity, percentage, subUnits, isFull, status }
     */
    async getHouseOccupancy(houseId) {
        try {
            const house = this.getHouseById(houseId) || this.defaultHouses.find(h => h.id === houseId);
            if (!house) {
                return { current: 0, capacity: 0, percentage: 0, subUnits: [], isFull: false, status: 'unknown' };
            }

            // Get active clients in this house
            const clients = await this.dbManager.getClientsByHouse(houseId);
            const activeClients = clients.filter(c => c.status === 'active');
            const current = activeClients.length;
            const capacity = house.capacity || 10; // Default to 10 if not set
            const percentage = capacity > 0 ? Math.round((current / capacity) * 100) : 0;

            // Calculate sub-unit occupancy if applicable
            let subUnits = [];
            if (house.subUnits && house.subUnits.length > 0) {
                subUnits = house.subUnits.map(sub => {
                    const subClients = activeClients.filter(c => c.subUnitId === sub.id);
                    const subCurrent = subClients.length;
                    const subCapacity = sub.capacity || 0;
                    const subPercentage = subCapacity > 0 ? Math.round((subCurrent / subCapacity) * 100) : 0;
                    return {
                        id: sub.id,
                        name: sub.name,
                        current: subCurrent,
                        capacity: subCapacity,
                        percentage: subPercentage,
                        isFull: subCurrent >= subCapacity,
                        status: this._getOccupancyStatus(subPercentage)
                    };
                });
            }

            return {
                houseId: house.id,
                name: house.name,
                programType: house.programType || 'residential',
                current,
                capacity,
                percentage,
                available: Math.max(0, capacity - current),
                subUnits,
                isFull: current >= capacity,
                status: this._getOccupancyStatus(percentage)
            };
        } catch (error) {
            console.error('Failed to get house occupancy:', error);
            return { current: 0, capacity: 0, percentage: 0, subUnits: [], isFull: false, status: 'error' };
        }
    }

    /**
     * Get total census across all houses
     * @returns {Object} { total, capacity, percentage, byHouse, byProgramType }
     */
    async getTotalCensus() {
        try {
            const activeHouses = this.getActiveHouses().length > 0 
                ? this.getActiveHouses() 
                : this.defaultHouses.filter(h => h.isActive !== false);
            
            let totalCurrent = 0;
            let totalCapacity = 0;
            const byHouse = [];
            const byProgramType = {};

            for (const house of activeHouses) {
                const occupancy = await this.getHouseOccupancy(house.id);
                totalCurrent += occupancy.current;
                totalCapacity += occupancy.capacity;
                
                byHouse.push({
                    houseId: house.id,
                    name: house.name,
                    ...occupancy
                });

                // Aggregate by program type
                const programType = house.programType || 'residential';
                if (!byProgramType[programType]) {
                    byProgramType[programType] = { current: 0, capacity: 0, houses: [] };
                }
                byProgramType[programType].current += occupancy.current;
                byProgramType[programType].capacity += occupancy.capacity;
                byProgramType[programType].houses.push(house.name);
            }

            // Calculate percentages for program types
            Object.keys(byProgramType).forEach(type => {
                const data = byProgramType[type];
                data.percentage = data.capacity > 0 ? Math.round((data.current / data.capacity) * 100) : 0;
                data.status = this._getOccupancyStatus(data.percentage);
            });

            const totalPercentage = totalCapacity > 0 ? Math.round((totalCurrent / totalCapacity) * 100) : 0;

            return {
                total: totalCurrent,
                capacity: totalCapacity,
                available: Math.max(0, totalCapacity - totalCurrent),
                percentage: totalPercentage,
                status: this._getOccupancyStatus(totalPercentage),
                byHouse,
                byProgramType,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to get total census:', error);
            return { total: 0, capacity: 0, percentage: 0, byHouse: [], byProgramType: {} };
        }
    }

    /**
     * Get houses with available beds, sorted by availability
     * @returns {Array} Houses with openings, sorted by most available first
     */
    async getAvailableBeds() {
        try {
            const census = await this.getTotalCensus();
            
            return census.byHouse
                .filter(house => house.available > 0)
                .sort((a, b) => b.available - a.available)
                .map(house => ({
                    houseId: house.houseId,
                    name: house.name,
                    programType: house.programType,
                    available: house.available,
                    capacity: house.capacity,
                    current: house.current,
                    percentage: house.percentage,
                    status: house.status,
                    subUnits: house.subUnits?.filter(sub => sub.available > 0) || []
                }));
        } catch (error) {
            console.error('Failed to get available beds:', error);
            return [];
        }
    }

    /**
     * Get occupancy status label based on percentage
     * @private
     */
    _getOccupancyStatus(percentage) {
        if (percentage >= 100) return 'full';
        if (percentage >= 90) return 'critical';
        if (percentage >= 75) return 'warning';
        return 'available';
    }

    /**
     * Get capacity for a specific house (with fallback to defaults)
     * @param {string} houseId - The house ID
     * @returns {number} The capacity
     */
    getHouseCapacity(houseId) {
        const house = this.getHouseById(houseId) || this.defaultHouses.find(h => h.id === houseId);
        return house?.capacity || 10; // Default to 10 if not found
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








