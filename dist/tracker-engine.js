/**
 * TrackerEngine - Intelligence layer for CM Tracker
 * Calculates completion scores, identifies gaps, and generates tasks
 */

class TrackerEngine {
    constructor() {
        // Define all tracker requirements with metadata
        this.requirements = [
            // 48-hour Admission Requirements
            { 
                id: 'needsAssessment', 
                label: 'Needs Assessment', 
                critical: true,
                category: 'admission',
                dueByDay: 2,
                description: 'Initial needs assessment must be completed within 48 hours'
            },
            { 
                id: 'healthPhysical', 
                label: 'Health & Physical', 
                critical: true,
                category: 'admission',
                dueByDay: 2,
                description: 'Health and physical assessment within 48 hours'
            },
            
            // Aftercare Planning
            { 
                id: 'aftercareThreadSent', 
                label: 'Aftercare Planning Thread', 
                critical: true,
                category: 'aftercare',
                dueByDay: 14,
                description: 'Aftercare thread must be sent by day 14'
            },
            { 
                id: 'optionsDocUploaded', 
                label: 'Options Doc in Kipu', 
                critical: true,
                category: 'aftercare',
                dueByDay: 21,
                description: 'Aftercare options document uploaded to Kipu'
            },
            { 
                id: 'dischargePacketUploaded', 
                label: 'Discharge Packet Uploaded', 
                critical: true,
                category: 'aftercare',
                dueByDay: 25,
                description: 'Complete discharge packet uploaded'
            },
            { 
                id: 'referralClosureCorrespondence', 
                label: 'Referral Closure Correspondence', 
                critical: false,
                category: 'aftercare',
                dueByDay: 28,
                description: 'Correspondence with referral source'
            },
            
            // Clinical Assessments
            { 
                id: 'gadCompleted', 
                label: 'GAD Assessment', 
                critical: true,
                category: 'clinical',
                dueByDay: 7,
                description: 'GAD-7 anxiety assessment'
            },
            { 
                id: 'phqCompleted', 
                label: 'PHQ Assessment', 
                critical: true,
                category: 'clinical',
                dueByDay: 7,
                description: 'PHQ-9 depression screening'
            },
            { 
                id: 'satisfactionSurvey', 
                label: 'Satisfaction Survey', 
                critical: false,
                category: 'clinical',
                dueByDay: 25,
                description: 'Client satisfaction survey'
            },
            
            // Documentation
            { 
                id: 'dischargeSummary', 
                label: 'Discharge Summary', 
                critical: true,
                category: 'documentation',
                dueByDay: 28,
                description: 'Comprehensive discharge summary'
            },
            { 
                id: 'dischargePlanningNote', 
                label: 'Discharge Planning Note', 
                critical: true,
                category: 'documentation',
                dueByDay: 26,
                description: 'Detailed discharge planning notes'
            },
            { 
                id: 'dischargeASAM', 
                label: 'Discharge ASAM', 
                critical: true,
                category: 'documentation',
                dueByDay: 28,
                description: 'ASAM criteria assessment at discharge'
            }
        ];
        
        // Risk level thresholds
        this.riskLevels = {
            red: { daysToDischarge: 7, criticalMissing: true },
            yellow: { daysToDischarge: 14, criticalMissing: false },
            green: { daysToDischarge: 30, criticalMissing: false }
        };
        
        // Cache for performance
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }
    
    /**
     * Get completion score for a client
     * @param {Object} client - Client data object
     * @returns {Object} Completion score with details
     */
    getCompletionScore(client) {
        const cacheKey = `score_${client.id}_${client.lastModified}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        const daysInCare = this.calculateDaysInCare(client.admissionDate);
        const daysToDischarge = this.calculateDaysToDischarge(client);
        
        let totalItems = 0;
        let completedItems = 0;
        let criticalItems = 0;
        let criticalComplete = 0;
        const missingCritical = [];
        const missingItems = [];
        
        // Check each requirement
        for (const req of this.requirements) {
            // Only count items that should be done by now
            if (daysInCare >= req.dueByDay || daysToDischarge <= 7) {
                totalItems++;
                
                if (client[req.id]) {
                    completedItems++;
                    if (req.critical) criticalComplete++;
                } else {
                    missingItems.push(req);
                    if (req.critical) {
                        missingCritical.push(req);
                    }
                }
                
                if (req.critical) criticalItems++;
            }
        }
        
        // Calculate percentages
        const overallPercentage = totalItems > 0 
            ? Math.round((completedItems / totalItems) * 100) 
            : 0;
        const criticalPercentage = criticalItems > 0 
            ? Math.round((criticalComplete / criticalItems) * 100) 
            : 100;
        
        // Determine risk level
        const riskLevel = this.calculateRiskLevel(daysToDischarge, missingCritical.length);
        
        const result = {
            overallPercentage,
            criticalPercentage,
            completedItems,
            totalItems,
            criticalComplete,
            criticalItems,
            missingCritical,
            missingItems,
            daysInCare,
            daysToDischarge,
            riskLevel,
            summary: this.generateCompletionSummary(overallPercentage, missingCritical)
        };
        
        this.setCache(cacheKey, result);
        return result;
    }
    
    /**
     * Get missing critical items for a client
     * @param {Object} client - Client data
     * @returns {Array} Array of missing critical requirements
     */
    getMissingCriticalItems(client) {
        const score = this.getCompletionScore(client);
        return score.missingCritical;
    }
    
    /**
     * Get upcoming deadlines for a client
     * @param {Object} client - Client data
     * @param {number} lookAheadDays - Days to look ahead (default 7)
     * @returns {Array} Array of upcoming requirements
     */
    getUpcomingDeadlines(client, lookAheadDays = 7) {
        const daysInCare = this.calculateDaysInCare(client.admissionDate);
        const upcoming = [];
        
        for (const req of this.requirements) {
            // Check if item is due soon but not completed
            const daysUntilDue = req.dueByDay - daysInCare;
            if (daysUntilDue > 0 && daysUntilDue <= lookAheadDays && !client[req.id]) {
                upcoming.push({
                    ...req,
                    daysUntilDue,
                    dueDate: this.addDays(new Date(), daysUntilDue)
                });
            }
        }
        
        // Sort by urgency
        return upcoming.sort((a, b) => a.daysUntilDue - b.daysUntilDue);
    }
    
    /**
     * Generate tasks from tracker gaps
     * @param {Object} client - Client data
     * @returns {Array} Array of generated tasks
     */
    generateTasksFromGaps(client) {
        const tasks = [];
        const daysInCare = this.calculateDaysInCare(client.admissionDate);
        const daysToDischarge = this.calculateDaysToDischarge(client);
        
        // Get completion score to identify gaps
        const score = this.getCompletionScore(client);
        
        // Generate tasks for missing critical items
        for (const item of score.missingCritical) {
            const daysOverdue = daysInCare - item.dueByDay;
            const priority = this.calculateTaskPriority(item, daysToDischarge, daysOverdue);
            
            tasks.push({
                type: 'tracker-gap',
                clientId: client.id,
                clientInitials: client.initials,
                houseId: client.houseId,
                trackerId: item.id,
                title: `Complete ${item.label}`,
                description: item.description,
                priority,
                dueDate: daysOverdue > 0 ? 'Overdue' : this.addDays(new Date(), item.dueByDay - daysInCare),
                daysOverdue,
                category: item.category,
                critical: item.critical,
                autoGenerated: true
            });
        }
        
        // Generate tasks for upcoming deadlines
        const upcoming = this.getUpcomingDeadlines(client, 3);
        for (const item of upcoming) {
            tasks.push({
                type: 'tracker-upcoming',
                clientId: client.id,
                clientInitials: client.initials,
                houseId: client.houseId,
                trackerId: item.id,
                title: `Prepare ${item.label}`,
                description: `${item.description} - Due in ${item.daysUntilDue} days`,
                priority: 'medium',
                dueDate: item.dueDate,
                daysUntilDue: item.daysUntilDue,
                category: item.category,
                critical: item.critical,
                autoGenerated: true
            });
        }
        
        // Special case: Aftercare options tracking
        if (client.aftercareOptions && client.aftercareOptions.length > 0) {
            const pendingOptions = client.aftercareOptions.filter(opt => 
                opt.status === 'pending' || opt.status === 'sent'
            );
            
            if (pendingOptions.length > 0 && daysToDischarge <= 14) {
                tasks.push({
                    type: 'tracker-aftercare',
                    clientId: client.id,
                    clientInitials: client.initials,
                    houseId: client.houseId,
                    title: `Follow up on ${pendingOptions.length} aftercare options`,
                    description: `${pendingOptions.map(o => o.programName).join(', ')} - awaiting family response`,
                    priority: 'high',
                    dueDate: this.addDays(new Date(), 2),
                    category: 'aftercare',
                    autoGenerated: true
                });
            }
        }
        
        return tasks;
    }
    
    /**
     * Get house-level compliance statistics
     * @param {Array} clients - Array of clients in a house
     * @returns {Object} House compliance stats
     */
    getHouseCompliance(clients) {
        const stats = {
            houseId: clients[0]?.houseId || 'Unknown',
            totalClients: clients.length,
            overallCompliance: 0,
            criticalCompliance: 0,
            atRiskClients: [],
            strongClients: [],
            byCategory: {},
            trends: []
        };
        
        let totalPercentage = 0;
        let totalCriticalPercentage = 0;
        
        for (const client of clients) {
            const score = this.getCompletionScore(client);
            totalPercentage += score.overallPercentage;
            totalCriticalPercentage += score.criticalPercentage;
            
            // Identify at-risk clients
            if (score.daysToDischarge <= 10 && score.overallPercentage < 50) {
                stats.atRiskClients.push({
                    client,
                    score,
                    message: `${client.initials}: ${score.overallPercentage}% complete, ${score.daysToDischarge} days to discharge`
                });
            }
            
            // Identify strong performers
            if (score.overallPercentage >= 90) {
                stats.strongClients.push({
                    client,
                    score
                });
            }
            
            // Track by category
            for (const req of this.requirements) {
                if (!stats.byCategory[req.category]) {
                    stats.byCategory[req.category] = {
                        total: 0,
                        completed: 0
                    };
                }
                stats.byCategory[req.category].total++;
                if (client[req.id]) {
                    stats.byCategory[req.category].completed++;
                }
            }
        }
        
        // Calculate averages
        stats.overallCompliance = Math.round(totalPercentage / clients.length);
        stats.criticalCompliance = Math.round(totalCriticalPercentage / clients.length);
        
        // Calculate category percentages
        for (const category in stats.byCategory) {
            const cat = stats.byCategory[category];
            cat.percentage = cat.total > 0 
                ? Math.round((cat.completed / cat.total) * 100)
                : 0;
        }
        
        return stats;
    }
    
    // Helper methods
    calculateDaysInCare(admissionDate) {
        if (!admissionDate) return 0;
        const admission = new Date(admissionDate);
        const today = new Date();
        const diffTime = Math.abs(today - admission);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    calculateDaysToDischarge(client) {
        if (!client.dischargeDate) {
            // Assume 30-day program if no discharge date set
            return Math.max(0, 30 - this.calculateDaysInCare(client.admissionDate));
        }
        const discharge = new Date(client.dischargeDate);
        const today = new Date();
        const diffTime = discharge - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    calculateRiskLevel(daysToDischarge, criticalMissingCount) {
        if (daysToDischarge <= 7 && criticalMissingCount > 0) return 'red';
        if (daysToDischarge <= 14 && criticalMissingCount > 2) return 'red';
        if (daysToDischarge <= 14 || criticalMissingCount > 0) return 'yellow';
        return 'green';
    }
    
    calculateTaskPriority(item, daysToDischarge, daysOverdue) {
        if (daysOverdue > 0 || (item.critical && daysToDischarge <= 7)) return 'critical';
        if (item.critical && daysToDischarge <= 14) return 'high';
        if (daysToDischarge <= 7) return 'high';
        return 'medium';
    }
    
    generateCompletionSummary(percentage, missingCritical) {
        if (percentage === 100) return '✅ All requirements complete';
        if (missingCritical.length === 0) return `📊 ${percentage}% complete`;
        const criticalText = missingCritical.length === 1 ? '1 critical item' : `${missingCritical.length} critical items`;
        return `⚠️ ${percentage}% complete (${criticalText} missing)`;
    }
    
    addDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result.toISOString().split('T')[0];
    }
    
    // Cache management
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }
    
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }
    
    clearCache() {
        this.cache.clear();
    }
}

// Create singleton instance
window.trackerEngine = new TrackerEngine();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackerEngine;
}
