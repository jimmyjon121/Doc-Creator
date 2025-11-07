/**
 * Predictive Completion Engine
 * Analyzes historical patterns and predicts completion rates at discharge
 */

class PredictiveCompletionEngine {
    constructor() {
        this.dbManager = window.indexedDBManager;
        this.trackerEngine = window.trackerEngine;
        this.historicalPatterns = null;
        this.cache = {};
        this.cacheDuration = 5 * 60 * 1000; // 5 minutes
    }
    
    /**
     * Initialize and load historical patterns
     */
    async initialize() {
        await this.loadHistoricalPatterns();
        return true;
    }
    
    /**
     * Load historical completion patterns from all clients
     */
    async loadHistoricalPatterns() {
        try {
            const clients = await window.clientManager?.getAllClients() || [];
            const patterns = {
                averageCompletionByDay: {},
                averageCompletionByDischargeDay: {},
                itemCompletionTimes: {},
                riskFactors: {},
                successCorrelations: {}
            };
            
            // Analyze completed/discharged clients
            const completedClients = clients.filter(c => 
                c.dischargeDate && new Date(c.dischargeDate) < new Date()
            );
            
            if (completedClients.length === 0) {
                // Use current clients as baseline if no historical data
                this.historicalPatterns = this.generateBaselinePatterns();
                return;
            }
            
            // Calculate average completion by day in care
            for (let day = 1; day <= 60; day++) {
                const clientsAtDay = completedClients.filter(c => {
                    const daysInCare = this.calculateDaysInCare(c.admissionDate, c.dischargeDate);
                    return daysInCare >= day;
                });
                
                if (clientsAtDay.length > 0) {
                    const avgCompletion = clientsAtDay.reduce((sum, client) => {
                        const score = this.trackerEngine?.getCompletionScore(client);
                        return sum + (score?.overallPercentage || 0);
                    }, 0) / clientsAtDay.length;
                    
                    patterns.averageCompletionByDay[day] = avgCompletion;
                }
            }
            
            // Calculate average completion by days until discharge
            for (let daysOut = 30; daysOut >= 0; daysOut--) {
                const clientsAtDischarge = completedClients.filter(c => {
                    const daysToDischarge = this.calculateDaysToDischarge(c.admissionDate, c.dischargeDate);
                    return daysToDischarge <= daysOut && daysToDischarge >= daysOut - 7;
                });
                
                if (clientsAtDischarge.length > 0) {
                    const avgCompletion = clientsAtDischarge.reduce((sum, client) => {
                        const score = this.trackerEngine?.getCompletionScore(client);
                        return sum + (score?.overallPercentage || 0);
                    }, 0) / clientsAtDischarge.length;
                    
                    patterns.averageCompletionByDischargeDay[daysOut] = avgCompletion;
                }
            }
            
            // Calculate average completion time per item
            const itemTimes = {};
            completedClients.forEach(client => {
                const daysInCare = this.calculateDaysInCare(client.admissionDate, client.dischargeDate);
                const requirements = this.trackerEngine?.requirements || [];
                
                requirements.forEach(req => {
                    if (client[req.id]) {
                        const completionDay = this.getCompletionDay(client, req.id, client.admissionDate);
                        if (completionDay && completionDay <= daysInCare) {
                            if (!itemTimes[req.id]) itemTimes[req.id] = [];
                            itemTimes[req.id].push(completionDay);
                        }
                    }
                });
            });
            
            // Calculate averages
            Object.keys(itemTimes).forEach(itemId => {
                const times = itemTimes[itemId];
                if (times.length > 0) {
                    patterns.itemCompletionTimes[itemId] = {
                        average: times.reduce((a, b) => a + b, 0) / times.length,
                        median: this.median(times),
                        min: Math.min(...times),
                        max: Math.max(...times)
                    };
                }
            });
            
            // Identify risk factors
            patterns.riskFactors = this.analyzeRiskFactors(completedClients);
            
            // Success correlations
            patterns.successCorrelations = this.analyzeSuccessCorrelations(completedClients);
            
            this.historicalPatterns = patterns;
        } catch (error) {
            console.error('Error loading historical patterns:', error);
            this.historicalPatterns = this.generateBaselinePatterns();
        }
    }
    
    /**
     * Generate baseline patterns when no historical data exists
     */
    generateBaselinePatterns() {
        return {
            averageCompletionByDay: {
                7: 25, 14: 45, 21: 60, 28: 75, 35: 85, 42: 92, 49: 96, 56: 98
            },
            averageCompletionByDischargeDay: {
                30: 60, 21: 70, 14: 80, 7: 90, 3: 95, 0: 98
            },
            itemCompletionTimes: {
                needsAssessment: { average: 1.5, median: 1, min: 1, max: 3 },
                healthPhysical: { average: 1.8, median: 2, min: 1, max: 4 },
                aftercareThreadSent: { average: 14, median: 14, min: 12, max: 18 },
                gadCompleted: { average: 5, median: 5, min: 2, max: 10 },
                phqCompleted: { average: 5, median: 5, min: 2, max: 10 }
            },
            riskFactors: {},
            successCorrelations: {}
        };
    }
    
    /**
     * Predict completion percentage at discharge for a client
     */
    predictCompletionAtDischarge(client) {
        const cacheKey = `predict_${client.id}`;
        if (this.cache[cacheKey] && Date.now() - this.cache[cacheKey].timestamp < this.cacheDuration) {
            return this.cache[cacheKey].result;
        }
        
        const daysInCare = this.trackerEngine?.calculateDaysInCare(client.admissionDate) || 0;
        const daysToDischarge = this.trackerEngine?.calculateDaysToDischarge(client) || null;
        const currentScore = this.trackerEngine?.getCompletionScore(client);
        const currentCompletion = currentScore?.overallPercentage || 0;
        
        if (!daysToDischarge || daysToDischarge <= 0) {
            return {
                predictedCompletion: currentCompletion,
                confidence: 'high',
                message: 'Client is at or past discharge date',
                recommendations: []
            };
        }
        
        // Calculate current pace
        const completionRate = currentCompletion / Math.max(daysInCare, 1);
        const projectedCompletion = currentCompletion + (completionRate * daysToDischarge);
        
        // Use historical patterns if available
        const historicalCompletion = this.historicalPatterns?.averageCompletionByDischargeDay[daysToDischarge];
        
        // Weighted prediction (70% current pace, 30% historical)
        let predictedCompletion;
        if (historicalCompletion) {
            predictedCompletion = (projectedCompletion * 0.7) + (historicalCompletion * 0.3);
        } else {
            predictedCompletion = projectedCompletion;
        }
        
        // Cap at 100%
        predictedCompletion = Math.min(100, Math.max(currentCompletion, predictedCompletion));
        
        // Calculate confidence
        let confidence = 'medium';
        if (daysInCare >= 14 && currentCompletion > 50) confidence = 'high';
        if (daysInCare < 7) confidence = 'low';
        
        // Generate recommendations
        const recommendations = this.generateRecommendations(client, predictedCompletion, daysToDischarge);
        
        // Risk assessment
        const riskLevel = this.assessRisk(client, predictedCompletion, daysToDischarge);
        
        const result = {
            predictedCompletion: Math.round(predictedCompletion),
            currentCompletion: Math.round(currentCompletion),
            daysToDischarge,
            daysInCare,
            confidence,
            riskLevel,
            projectedPace: Math.round(completionRate * 100) / 100,
            historicalAverage: historicalCompletion ? Math.round(historicalCompletion) : null,
            message: this.generatePredictionMessage(predictedCompletion, currentCompletion, daysToDischarge, riskLevel),
            recommendations,
            atRisk: riskLevel === 'high' || predictedCompletion < 85
        };
        
        this.cache[cacheKey] = {
            result,
            timestamp: Date.now()
        };
        
        return result;
    }
    
    /**
     * Generate actionable recommendations
     */
    generateRecommendations(client, predictedCompletion, daysToDischarge) {
        const recommendations = [];
        const score = this.trackerEngine?.getCompletionScore(client);
        const missingCritical = score?.missingCritical || [];
        
        // If predicted completion is low
        if (predictedCompletion < 85 && daysToDischarge <= 14) {
            recommendations.push({
                priority: 'critical',
                message: `Focus on ${missingCritical.length} critical items to reach 85%+ completion`,
                items: missingCritical.slice(0, 3).map(item => item.label)
            });
        }
        
        // Identify items that typically take time
        missingCritical.forEach(item => {
            const avgTime = this.historicalPatterns?.itemCompletionTimes[item.id]?.average;
            if (avgTime && daysToDischarge <= avgTime + 2) {
                recommendations.push({
                    priority: 'high',
                    message: `Schedule ${item.label} now - typically takes ${Math.round(avgTime)} days`,
                    item: item.label
                });
            }
        });
        
        // Pace recommendations
        if (predictedCompletion < 80 && daysToDischarge > 7) {
            recommendations.push({
                priority: 'medium',
                message: `Increase completion pace by ${Math.round((85 - predictedCompletion) / daysToDischarge)}% per day`,
                action: 'Complete 2-3 items daily'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Assess risk level for a client
     */
    assessRisk(client, predictedCompletion, daysToDischarge) {
        const score = this.trackerEngine?.getCompletionScore(client);
        const missingCritical = score?.missingCritical || [];
        
        if (predictedCompletion < 70 && daysToDischarge <= 7) return 'high';
        if (predictedCompletion < 80 && daysToDischarge <= 14) return 'high';
        if (missingCritical.length > 3 && daysToDischarge <= 14) return 'high';
        if (predictedCompletion < 85 && daysToDischarge <= 21) return 'medium';
        
        return 'low';
    }
    
    /**
     * Generate human-readable prediction message
     */
    generatePredictionMessage(predictedCompletion, currentCompletion, daysToDischarge, riskLevel) {
        if (predictedCompletion >= 95) {
            return `On track for excellent completion (${predictedCompletion}%) at discharge`;
        } else if (predictedCompletion >= 85) {
            return `Projected to reach ${predictedCompletion}% completion at discharge - ${daysToDischarge} days remaining`;
        } else if (riskLevel === 'high') {
            return `⚠️ At risk: Projected ${predictedCompletion}% at discharge. Focus on critical items now.`;
        } else {
            return `Current pace suggests ${predictedCompletion}% completion at discharge`;
        }
    }
    
    /**
     * Analyze risk factors from historical data
     */
    analyzeRiskFactors(completedClients) {
        const riskFactors = {};
        
        // Analyze which incomplete items correlate with delays
        completedClients.forEach(client => {
            const score = this.trackerEngine?.getCompletionScore(client);
            const missingCritical = score?.missingCritical || [];
            
            missingCritical.forEach(item => {
                if (!riskFactors[item.id]) {
                    riskFactors[item.id] = { count: 0, delays: 0 };
                }
                riskFactors[item.id].count++;
                
                // Check if client had placement delays (simplified - would need actual data)
                const daysInCare = this.calculateDaysInCare(client.admissionDate, client.dischargeDate);
                if (daysInCare > 35) {
                    riskFactors[item.id].delays++;
                }
            });
        });
        
        // Calculate risk percentages
        Object.keys(riskFactors).forEach(itemId => {
            const factor = riskFactors[itemId];
            factor.riskPercentage = (factor.delays / factor.count) * 100;
        });
        
        return riskFactors;
    }
    
    /**
     * Analyze success correlations
     */
    analyzeSuccessCorrelations(completedClients) {
        const correlations = {};
        const requirements = this.trackerEngine?.requirements || [];
        
        requirements.forEach(req => {
            const withItem = completedClients.filter(c => c[req.id]);
            const withoutItem = completedClients.filter(c => !c[req.id]);
            
            if (withItem.length > 0 && withoutItem.length > 0) {
                const avgDaysWith = withItem.reduce((sum, c) => {
                    return sum + this.calculateDaysInCare(c.admissionDate, c.dischargeDate);
                }, 0) / withItem.length;
                
                const avgDaysWithout = withoutItem.reduce((sum, c) => {
                    return sum + this.calculateDaysInCare(c.admissionDate, c.dischargeDate);
                }, 0) / withoutItem.length;
                
                correlations[req.id] = {
                    label: req.label,
                    avgDaysWithItem: Math.round(avgDaysWith),
                    avgDaysWithoutItem: Math.round(avgDaysWithout),
                    difference: Math.round(avgDaysWithout - avgDaysWith),
                    impact: avgDaysWithout > avgDaysWith ? 'positive' : 'neutral'
                };
            }
        });
        
        return correlations;
    }
    
    /**
     * Get completion day for a tracker item
     */
    getCompletionDay(client, itemId, admissionDate) {
        const dateField = client[itemId + 'Date'];
        if (!dateField) return null;
        
        const completionDate = new Date(dateField);
        const admission = new Date(admissionDate);
        const diffTime = completionDate - admission;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Calculate days in care
     */
    calculateDaysInCare(admissionDate, dischargeDate = null) {
        const admission = new Date(admissionDate);
        const discharge = dischargeDate ? new Date(dischargeDate) : new Date();
        const diffTime = discharge - admission;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Calculate days to discharge
     */
    calculateDaysToDischarge(admissionDate, dischargeDate) {
        if (!dischargeDate) return null;
        const today = new Date();
        const discharge = new Date(dischargeDate);
        const diffTime = discharge - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    /**
     * Calculate median
     */
    median(numbers) {
        const sorted = [...numbers].sort((a, b) => a - b);
        const middle = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0
            ? (sorted[middle - 1] + sorted[middle]) / 2
            : sorted[middle];
    }
    
    /**
     * Get predictions for all active clients
     */
    async getAllPredictions() {
        const clients = await window.clientManager?.getAllClients() || [];
        const activeClients = clients.filter(c => !c.dischargeDate || new Date(c.dischargeDate) > new Date());
        
        return activeClients.map(client => ({
            client,
            prediction: this.predictCompletionAtDischarge(client)
        }));
    }
}

// Export
if (typeof window !== 'undefined') {
    window.predictiveCompletionEngine = new PredictiveCompletionEngine();
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictiveCompletionEngine;
}
