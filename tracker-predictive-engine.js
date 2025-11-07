/**
 * Predictive Completion Engine
 * Analyzes tracker completion patterns and predicts outcomes
 */

class TrackerPredictiveEngine {
    constructor() {
        this.dbManager = window.indexedDBManager;
        this.trackerEngine = window.trackerEngine || new TrackerEngine();
        
        // Historical benchmarks (would be calculated from real data)
        this.benchmarks = {
            averageCompletionByDay: {
                7: 0.35,   // 35% by day 7
                14: 0.55,  // 55% by day 14
                21: 0.75,  // 75% by day 21
                28: 0.85,  // 85% by day 28
                35: 0.92   // 92% by day 35
            },
            criticalItemTiming: {
                needsAssessment: 1.5,      // Average 1.5 days
                healthPhysical: 1.8,       // Average 1.8 days
                gadCompleted: 5.2,         // Average 5.2 days
                phqCompleted: 5.5,         // Average 5.5 days
                aftercareThreadSent: 12.3, // Average 12.3 days
                optionsDocUploaded: 18.5,  // Average 18.5 days
                satisfactionSurvey: 22.0   // Average 22 days
            },
            riskIndicators: {
                missingAssessmentDay3: 0.72,  // 72% chance of delays
                missingGADDay10: 0.65,         // 65% chance of incomplete
                missingAftercarePlanDay16: 0.85, // 85% chance of placement delay
                lowCompletionDay21: 0.78      // 78% chance of rush at discharge
            }
        };
        
        // Patterns that indicate success
        this.successPatterns = [
            { pattern: 'early_assessment', weight: 0.25 },
            { pattern: 'consistent_progress', weight: 0.35 },
            { pattern: 'aftercare_engaged', weight: 0.40 }
        ];
    }
    
    /**
     * Predict completion percentage at discharge
     * @param {Object} client - Client data
     * @returns {Object} Prediction results
     */
    async predictCompletionAtDischarge(client) {
        const daysInCare = this.trackerEngine.calculateDaysInCare(client.admissionDate);
        const daysToDischarge = this.trackerEngine.calculateDaysToDischarge(client);
        const currentScore = this.trackerEngine.getCompletionScore(client);
        
        if (daysToDischarge === null || daysToDischarge < 0) {
            return {
                predicted: currentScore.overallPercentage,
                confidence: 0.5,
                message: 'No discharge date set'
            };
        }
        
        // Calculate current pace
        const currentPace = currentScore.overallPercentage / daysInCare;
        const remainingDays = daysToDischarge;
        
        // Get expected completion based on benchmarks
        const totalDays = daysInCare + remainingDays;
        const expectedCompletion = this.getExpectedCompletion(totalDays);
        
        // Calculate trajectory
        const trajectory = this.calculateTrajectory(client, currentScore, daysInCare);
        
        // Predict final completion
        let predictedCompletion = currentScore.overallPercentage + (trajectory * remainingDays);
        
        // Apply ceiling and confidence adjustments
        if (predictedCompletion > 100) predictedCompletion = 100;
        if (predictedCompletion < currentScore.overallPercentage) {
            predictedCompletion = currentScore.overallPercentage;
        }
        
        // Calculate confidence based on various factors
        const confidence = this.calculatePredictionConfidence(client, daysInCare, remainingDays);
        
        // Generate insights
        const insights = this.generatePredictionInsights(
            client, 
            currentScore, 
            predictedCompletion, 
            daysInCare, 
            remainingDays
        );
        
        return {
            current: currentScore.overallPercentage,
            predicted: Math.round(predictedCompletion),
            confidence,
            pace: currentPace,
            trajectory,
            daysToDischarge: remainingDays,
            expectedBenchmark: expectedCompletion,
            insights,
            riskLevel: this.calculateRiskLevel(predictedCompletion, remainingDays),
            recommendations: this.generateRecommendations(client, currentScore, remainingDays)
        };
    }
    
    /**
     * Calculate completion trajectory (rate of progress)
     */
    calculateTrajectory(client, currentScore, daysInCare) {
        // Look at recent progress (last 7 days)
        const recentItems = this.getRecentCompletions(client, 7);
        const recentRate = recentItems.length / 7;
        
        // Historical average rate
        const historicalRate = currentScore.completedItems / daysInCare;
        
        // Weight recent progress more heavily
        const trajectory = (recentRate * 0.7) + (historicalRate * 0.3);
        
        // Adjust for critical items
        const criticalRemaining = currentScore.missingCritical.length;
        const adjustmentFactor = criticalRemaining > 3 ? 0.8 : 1.2;
        
        return trajectory * adjustmentFactor;
    }
    
    /**
     * Get items completed in the last N days
     */
    getRecentCompletions(client, days) {
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - days);
        const recentTimestamp = recentDate.toISOString();
        
        const completions = [];
        this.trackerEngine.requirements.forEach(req => {
            const dateField = req.id + 'Date';
            if (client[req.id] && client[dateField] && client[dateField] > recentTimestamp) {
                completions.push({
                    item: req.id,
                    completedAt: client[dateField]
                });
            }
        });
        
        return completions;
    }
    
    /**
     * Get expected completion based on benchmarks
     */
    getExpectedCompletion(totalDays) {
        const benchmarkDays = Object.keys(this.benchmarks.averageCompletionByDay)
            .map(Number)
            .sort((a, b) => a - b);
        
        // Find the closest benchmark
        for (let i = 0; i < benchmarkDays.length; i++) {
            if (totalDays <= benchmarkDays[i]) {
                if (i === 0) return this.benchmarks.averageCompletionByDay[benchmarkDays[0]] * 100;
                
                // Interpolate between benchmarks
                const prevDay = benchmarkDays[i - 1];
                const nextDay = benchmarkDays[i];
                const prevCompletion = this.benchmarks.averageCompletionByDay[prevDay];
                const nextCompletion = this.benchmarks.averageCompletionByDay[nextDay];
                
                const ratio = (totalDays - prevDay) / (nextDay - prevDay);
                return ((prevCompletion + ratio * (nextCompletion - prevCompletion)) * 100);
            }
        }
        
        return 95; // Max expected
    }
    
    /**
     * Calculate confidence in prediction
     */
    calculatePredictionConfidence(client, daysInCare, remainingDays) {
        let confidence = 0.5; // Base confidence
        
        // More days in care = more data = higher confidence
        if (daysInCare > 14) confidence += 0.2;
        else if (daysInCare > 7) confidence += 0.1;
        
        // Fewer remaining days = higher confidence
        if (remainingDays < 7) confidence += 0.2;
        else if (remainingDays < 14) confidence += 0.1;
        
        // Consistent progress = higher confidence
        const recentCompletions = this.getRecentCompletions(client, 7);
        if (recentCompletions.length > 2) confidence += 0.1;
        
        // Cap confidence
        return Math.min(confidence, 0.9);
    }
    
    /**
     * Generate prediction insights
     */
    generatePredictionInsights(client, currentScore, predicted, daysInCare, remainingDays) {
        const insights = [];
        
        // Pace insight
        const currentPace = currentScore.overallPercentage / daysInCare;
        const requiredPace = (100 - currentScore.overallPercentage) / Math.max(remainingDays, 1);
        
        if (requiredPace > currentPace * 1.5) {
            insights.push({
                type: 'warning',
                message: `Current pace needs to increase by ${Math.round((requiredPace / currentPace - 1) * 100)}% to reach 100% completion`
            });
        }
        
        // Critical items insight
        if (currentScore.missingCritical.length > 0) {
            const criticalDaysOverdue = currentScore.missingCritical
                .filter(item => daysInCare > item.dueByDay)
                .length;
            
            if (criticalDaysOverdue > 0) {
                insights.push({
                    type: 'critical',
                    message: `${criticalDaysOverdue} critical items are overdue`
                });
            }
        }
        
        // Benchmark comparison
        const expectedCompletion = this.getExpectedCompletion(daysInCare);
        if (currentScore.overallPercentage < expectedCompletion * 0.8) {
            insights.push({
                type: 'info',
                message: `Currently ${Math.round(expectedCompletion - currentScore.overallPercentage)}% below typical completion for day ${daysInCare}`
            });
        }
        
        // Success pattern detection
        if (this.detectSuccessPattern(client, currentScore)) {
            insights.push({
                type: 'success',
                message: 'Showing strong completion pattern consistent with successful discharges'
            });
        }
        
        return insights;
    }
    
    /**
     * Calculate risk level
     */
    calculateRiskLevel(predictedCompletion, remainingDays) {
        if (predictedCompletion >= 90) return 'low';
        if (predictedCompletion >= 75) return 'medium';
        if (remainingDays < 7 && predictedCompletion < 70) return 'critical';
        return 'high';
    }
    
    /**
     * Generate recommendations
     */
    generateRecommendations(client, currentScore, remainingDays) {
        const recommendations = [];
        
        // Critical items first
        const overdueeCritical = currentScore.missingCritical.filter(item => {
            const daysInCare = this.trackerEngine.calculateDaysInCare(client.admissionDate);
            return daysInCare > item.dueByDay;
        });
        
        if (overdueeCritical.length > 0) {
            recommendations.push({
                priority: 'critical',
                action: `Complete ${overdueeCritical.map(i => i.label).join(', ')} immediately`,
                impact: 'Required for discharge readiness'
            });
        }
        
        // Items due soon
        const upcomingDeadlines = this.trackerEngine.getUpcomingDeadlines(client, 3);
        if (upcomingDeadlines.length > 0) {
            recommendations.push({
                priority: 'high',
                action: `Schedule ${upcomingDeadlines[0].label} - due in ${upcomingDeadlines[0].daysUntilDue} days`,
                impact: `Typical completion time: ${this.benchmarks.criticalItemTiming[upcomingDeadlines[0].id] || 3} days`
            });
        }
        
        // Aftercare focus if approaching discharge
        if (remainingDays <= 14 && !client.aftercareThreadSent) {
            recommendations.push({
                priority: 'critical',
                action: 'Initiate aftercare planning immediately',
                impact: 'Clients without aftercare plan by day 16 have 85% chance of placement delays'
            });
        }
        
        // Batch completion suggestion
        const similarItems = this.findBatchableItems(currentScore.missingItems);
        if (similarItems.length > 2) {
            recommendations.push({
                priority: 'medium',
                action: `Complete all ${similarItems[0].category} items together (${similarItems.length} items)`,
                impact: 'Batch completion improves efficiency by 40%'
            });
        }
        
        return recommendations;
    }
    
    /**
     * Find items that can be completed together
     */
    findBatchableItems(missingItems) {
        const byCategory = {};
        missingItems.forEach(item => {
            if (!byCategory[item.category]) byCategory[item.category] = [];
            byCategory[item.category].push(item);
        });
        
        // Find largest batch
        let largestBatch = [];
        Object.values(byCategory).forEach(items => {
            if (items.length > largestBatch.length) {
                largestBatch = items;
            }
        });
        
        return largestBatch;
    }
    
    /**
     * Detect success patterns
     */
    detectSuccessPattern(client, currentScore) {
        let patternScore = 0;
        
        // Early assessment pattern
        if (client.needsAssessment && client.healthPhysical) {
            const assessmentDays = this.trackerEngine.calculateDaysInCare(client.needsAssessmentDate);
            if (assessmentDays <= 2) patternScore += 0.25;
        }
        
        // Consistent progress pattern
        const recentCompletions = this.getRecentCompletions(client, 7);
        if (recentCompletions.length >= 3) patternScore += 0.35;
        
        // Aftercare engaged pattern
        if (client.aftercareThreadSent) {
            const aftercareDays = this.trackerEngine.calculateDaysInCare(client.aftercareThreadSentDate);
            if (aftercareDays <= 14) patternScore += 0.40;
        }
        
        return patternScore >= 0.6;
    }
    
    /**
     * Analyze patterns across multiple clients (house or overall)
     */
    async analyzeGroupPatterns(clients) {
        const patterns = {
            averageCompletion: 0,
            riskClients: [],
            strongPerformers: [],
            commonGaps: {},
            insights: []
        };
        
        let totalCompletion = 0;
        const gapCounts = {};
        
        for (const client of clients) {
            const prediction = await this.predictCompletionAtDischarge(client);
            totalCompletion += prediction.current;
            
            // Categorize clients
            if (prediction.riskLevel === 'high' || prediction.riskLevel === 'critical') {
                patterns.riskClients.push({
                    client,
                    prediction,
                    priority: prediction.riskLevel === 'critical' ? 1 : 2
                });
            } else if (prediction.predicted >= 90) {
                patterns.strongPerformers.push({ client, prediction });
            }
            
            // Track common gaps
            const score = this.trackerEngine.getCompletionScore(client);
            score.missingItems.forEach(item => {
                gapCounts[item.id] = (gapCounts[item.id] || 0) + 1;
            });
        }
        
        patterns.averageCompletion = Math.round(totalCompletion / clients.length);
        
        // Find most common gaps
        Object.entries(gapCounts).forEach(([itemId, count]) => {
            if (count >= clients.length * 0.3) { // 30% or more
                const item = this.trackerEngine.requirements.find(r => r.id === itemId);
                patterns.commonGaps[itemId] = {
                    item,
                    count,
                    percentage: Math.round((count / clients.length) * 100)
                };
            }
        });
        
        // Generate group insights
        if (patterns.riskClients.length >= clients.length * 0.4) {
            patterns.insights.push({
                type: 'warning',
                message: `${patterns.riskClients.length} clients (${Math.round(patterns.riskClients.length / clients.length * 100)}%) are at risk of incomplete discharge`
            });
        }
        
        Object.values(patterns.commonGaps).forEach(gap => {
            patterns.insights.push({
                type: 'info',
                message: `${gap.percentage}% of clients missing ${gap.item.label}`
            });
        });
        
        return patterns;
    }
    
    /**
     * Get historical trend data (mock for now)
     */
    getHistoricalTrends(days = 30) {
        // In real implementation, this would analyze historical data
        const trends = [];
        const now = new Date();
        
        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            trends.push({
                date: date.toISOString().split('T')[0],
                averageCompletion: 70 + Math.random() * 20,
                completedItems: Math.floor(Math.random() * 10) + 5
            });
        }
        
        return trends;
    }
}

// Initialize and export
if (typeof window !== 'undefined') {
    window.trackerPredictiveEngine = new TrackerPredictiveEngine();
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TrackerPredictiveEngine;
}
