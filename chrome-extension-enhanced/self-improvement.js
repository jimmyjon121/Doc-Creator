// self-improvement.js - Learning system that optimizes extraction based on success
// Tracks patterns, learns from feedback, and improves over time

class SelfImprovementEngine {
    constructor() {
        this.extractionHistory = new Map();
        this.patternPerformance = new Map();
        this.siteProfiles = new Map();
        this.fieldStrategies = new Map();
        this.learningRate = 0.1;
        this.historyLimit = 1000;
        
        // Load saved learning data
        this.loadLearningData();
    }
    
    // Record extraction attempt
    recordExtraction(url, field, strategy, value, confidence, context) {
        const extraction = {
            timestamp: Date.now(),
            url,
            domain: new URL(url).hostname,
            field,
            strategy,
            value,
            confidence,
            context,
            verified: null,
            feedback: null
        };
        
        // Store in history
        const historyKey = `${url}_${field}_${Date.now()}`;
        this.extractionHistory.set(historyKey, extraction);
        
        // Update pattern performance
        this.updatePatternPerformance(extraction);
        
        // Update site profile
        this.updateSiteProfile(extraction);
        
        // Limit history size
        this.pruneHistory();
        
        // Save learning data
        this.saveLearningData();
        
        return historyKey;
    }
    
    // Update performance metrics for patterns
    updatePatternPerformance(extraction) {
        const key = `${extraction.field}_${extraction.strategy}`;
        
        if (!this.patternPerformance.has(key)) {
            this.patternPerformance.set(key, {
                attempts: 0,
                successes: 0,
                failures: 0,
                avgConfidence: 0,
                patterns: new Map()
            });
        }
        
        const performance = this.patternPerformance.get(key);
        performance.attempts++;
        
        // Update running average confidence
        performance.avgConfidence = 
            (performance.avgConfidence * (performance.attempts - 1) + extraction.confidence) / 
            performance.attempts;
        
        // Track specific patterns if available
        if (extraction.context?.pattern) {
            const patternKey = extraction.context.pattern.toString();
            if (!performance.patterns.has(patternKey)) {
                performance.patterns.set(patternKey, {
                    uses: 0,
                    successes: 0,
                    avgConfidence: 0
                });
            }
            
            const patternStats = performance.patterns.get(patternKey);
            patternStats.uses++;
            patternStats.avgConfidence = 
                (patternStats.avgConfidence * (patternStats.uses - 1) + extraction.confidence) / 
                patternStats.uses;
        }
    }
    
    // Update site-specific extraction profile
    updateSiteProfile(extraction) {
        const domain = extraction.domain;
        
        if (!this.siteProfiles.has(domain)) {
            this.siteProfiles.set(domain, {
                structure: {},
                successfulStrategies: new Map(),
                fieldLocations: new Map(),
                extractionStats: {
                    attempts: 0,
                    successes: 0,
                    avgConfidence: 0
                }
            });
        }
        
        const profile = this.siteProfiles.get(domain);
        profile.extractionStats.attempts++;
        
        // Track successful strategies per field
        const strategyKey = `${extraction.field}_${extraction.strategy}`;
        if (!profile.successfulStrategies.has(strategyKey)) {
            profile.successfulStrategies.set(strategyKey, {
                count: 0,
                avgConfidence: 0
            });
        }
        
        const strategyStats = profile.successfulStrategies.get(strategyKey);
        strategyStats.count++;
        strategyStats.avgConfidence = 
            (strategyStats.avgConfidence * (strategyStats.count - 1) + extraction.confidence) / 
            strategyStats.count;
        
        // Remember where fields were found
        if (extraction.confidence > 0.7 && extraction.context?.location) {
            if (!profile.fieldLocations.has(extraction.field)) {
                profile.fieldLocations.set(extraction.field, []);
            }
            profile.fieldLocations.get(extraction.field).push({
                location: extraction.context.location,
                confidence: extraction.confidence
            });
        }
    }
    
    // Get optimized strategy for a field on a specific site
    getOptimizedStrategy(field, domain) {
        const recommendations = {
            strategies: [],
            patterns: [],
            locations: [],
            confidence: 0
        };
        
        // Check site profile first
        if (this.siteProfiles.has(domain)) {
            const profile = this.siteProfiles.get(domain);
            
            // Get successful strategies for this field
            const fieldStrategies = Array.from(profile.successfulStrategies.entries())
                .filter(([key]) => key.startsWith(`${field}_`))
                .map(([key, stats]) => ({
                    strategy: key.split('_')[1],
                    confidence: stats.avgConfidence,
                    count: stats.count
                }))
                .sort((a, b) => b.confidence - a.confidence);
            
            recommendations.strategies = fieldStrategies;
            
            // Get known locations
            if (profile.fieldLocations.has(field)) {
                recommendations.locations = profile.fieldLocations.get(field)
                    .sort((a, b) => b.confidence - a.confidence)
                    .slice(0, 3);
            }
        }
        
        // Get general pattern performance for this field
        const fieldPatterns = Array.from(this.patternPerformance.entries())
            .filter(([key]) => key.startsWith(`${field}_`))
            .map(([key, perf]) => ({
                strategy: key.split('_')[1],
                performance: perf
            }))
            .sort((a, b) => b.performance.avgConfidence - a.performance.avgConfidence);
        
        // Merge recommendations
        if (fieldPatterns.length > 0) {
            const bestPatterns = fieldPatterns[0].performance.patterns;
            recommendations.patterns = Array.from(bestPatterns.entries())
                .map(([pattern, stats]) => ({
                    pattern,
                    confidence: stats.avgConfidence,
                    uses: stats.uses
                }))
                .sort((a, b) => b.confidence - a.confidence)
                .slice(0, 5);
        }
        
        // Calculate overall confidence
        if (recommendations.strategies.length > 0) {
            recommendations.confidence = recommendations.strategies[0].confidence;
        } else if (fieldPatterns.length > 0) {
            recommendations.confidence = fieldPatterns[0].performance.avgConfidence;
        }
        
        return recommendations;
    }
    
    // Learn from user feedback
    provideFeedback(historyKey, isCorrect, correctedValue = null) {
        if (!this.extractionHistory.has(historyKey)) return;
        
        const extraction = this.extractionHistory.get(historyKey);
        extraction.verified = isCorrect;
        extraction.feedback = {
            timestamp: Date.now(),
            isCorrect,
            correctedValue
        };
        
        // Update performance metrics based on feedback
        this.updatePerformanceWithFeedback(extraction, isCorrect);
        
        // If incorrect, learn from the correction
        if (!isCorrect && correctedValue) {
            this.learnFromCorrection(extraction, correctedValue);
        }
        
        this.saveLearningData();
    }
    
    updatePerformanceWithFeedback(extraction, isCorrect) {
        const key = `${extraction.field}_${extraction.strategy}`;
        const performance = this.patternPerformance.get(key);
        
        if (performance) {
            if (isCorrect) {
                performance.successes++;
            } else {
                performance.failures++;
            }
            
            // Update pattern-specific stats
            if (extraction.context?.pattern) {
                const patternKey = extraction.context.pattern.toString();
                const patternStats = performance.patterns.get(patternKey);
                if (patternStats) {
                    if (isCorrect) {
                        patternStats.successes++;
                    }
                }
            }
        }
        
        // Update site profile
        const profile = this.siteProfiles.get(extraction.domain);
        if (profile) {
            if (isCorrect) {
                profile.extractionStats.successes++;
            }
            profile.extractionStats.avgConfidence = 
                (profile.extractionStats.avgConfidence * (profile.extractionStats.attempts - 1) + 
                 (isCorrect ? extraction.confidence : 0)) / profile.extractionStats.attempts;
        }
    }
    
    learnFromCorrection(extraction, correctedValue) {
        // Analyze the difference between extracted and correct value
        const analysis = this.analyzeCorrection(extraction.value, correctedValue);
        
        // Store correction pattern
        const correctionKey = `${extraction.field}_corrections`;
        if (!this.fieldStrategies.has(correctionKey)) {
            this.fieldStrategies.set(correctionKey, []);
        }
        
        this.fieldStrategies.get(correctionKey).push({
            original: extraction.value,
            corrected: correctedValue,
            analysis,
            context: extraction.context,
            domain: extraction.domain
        });
        
        // Learn new patterns from corrections
        if (analysis.suggestedPattern) {
            this.suggestNewPattern(extraction.field, analysis.suggestedPattern);
        }
    }
    
    analyzeCorrection(extracted, correct) {
        const analysis = {
            type: 'unknown',
            difference: null,
            suggestedPattern: null
        };
        
        // Determine correction type
        if (!extracted && correct) {
            analysis.type = 'missed';
        } else if (extracted && !correct) {
            analysis.type = 'false-positive';
        } else if (typeof extracted === 'string' && typeof correct === 'string') {
            // String comparison
            if (extracted.toLowerCase() === correct.toLowerCase()) {
                analysis.type = 'case-difference';
            } else if (extracted.includes(correct) || correct.includes(extracted)) {
                analysis.type = 'partial-match';
            } else {
                analysis.type = 'different-value';
            }
            
            // Calculate string similarity
            analysis.similarity = this.calculateStringSimilarity(extracted, correct);
        } else if (Array.isArray(extracted) && Array.isArray(correct)) {
            // Array comparison
            const missing = correct.filter(c => !extracted.includes(c));
            const extra = extracted.filter(e => !correct.includes(e));
            
            analysis.type = 'array-difference';
            analysis.difference = { missing, extra };
        }
        
        return analysis;
    }
    
    calculateStringSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const maxLen = Math.max(str1.length, str2.length);
        if (maxLen === 0) return 1;
        
        const distance = this.levenshteinDistance(str1, str2);
        return 1 - distance / maxLen;
    }
    
    levenshteinDistance(str1, str2) {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    }
    
    suggestNewPattern(field, pattern) {
        const key = `${field}_suggested`;
        if (!this.fieldStrategies.has(key)) {
            this.fieldStrategies.set(key, []);
        }
        
        this.fieldStrategies.get(key).push({
            pattern,
            timestamp: Date.now(),
            source: 'correction-learning'
        });
    }
    
    // Get extraction recommendations based on learning
    getRecommendations(field, domain, currentContext) {
        const recommendations = [];
        
        // Get optimized strategy
        const optimized = this.getOptimizedStrategy(field, domain);
        
        if (optimized.confidence > 0.7) {
            recommendations.push({
                type: 'use-strategy',
                priority: 1,
                strategies: optimized.strategies,
                confidence: optimized.confidence
            });
        }
        
        // Check for known locations on this site
        if (optimized.locations.length > 0) {
            recommendations.push({
                type: 'check-locations',
                priority: 2,
                locations: optimized.locations
            });
        }
        
        // Suggest patterns based on success history
        if (optimized.patterns.length > 0) {
            recommendations.push({
                type: 'use-patterns',
                priority: 3,
                patterns: optimized.patterns
            });
        }
        
        // Check for similar sites
        const similarSites = this.findSimilarSites(domain);
        if (similarSites.length > 0) {
            recommendations.push({
                type: 'similar-site-strategies',
                priority: 4,
                sites: similarSites
            });
        }
        
        // Warn about problematic patterns
        const warnings = this.getFieldWarnings(field, domain);
        if (warnings.length > 0) {
            recommendations.push({
                type: 'warnings',
                priority: 5,
                warnings
            });
        }
        
        return recommendations.sort((a, b) => a.priority - b.priority);
    }
    
    findSimilarSites(domain) {
        const similar = [];
        const targetProfile = this.siteProfiles.get(domain);
        
        if (!targetProfile) return similar;
        
        // Compare with other site profiles
        for (const [otherDomain, otherProfile] of this.siteProfiles) {
            if (otherDomain === domain) continue;
            
            const similarity = this.calculateSiteSimilarity(targetProfile, otherProfile);
            if (similarity > 0.7) {
                similar.push({
                    domain: otherDomain,
                    similarity,
                    successRate: otherProfile.extractionStats.successes / 
                                otherProfile.extractionStats.attempts
                });
            }
        }
        
        return similar.sort((a, b) => b.similarity - a.similarity);
    }
    
    calculateSiteSimilarity(profile1, profile2) {
        let similarity = 0;
        let factors = 0;
        
        // Compare successful strategies
        const strategies1 = new Set(Array.from(profile1.successfulStrategies.keys()));
        const strategies2 = new Set(Array.from(profile2.successfulStrategies.keys()));
        
        const intersection = new Set([...strategies1].filter(x => strategies2.has(x)));
        const union = new Set([...strategies1, ...strategies2]);
        
        if (union.size > 0) {
            similarity += intersection.size / union.size;
            factors++;
        }
        
        // Compare field locations
        const fields1 = new Set(profile1.fieldLocations.keys());
        const fields2 = new Set(profile2.fieldLocations.keys());
        
        const fieldOverlap = new Set([...fields1].filter(x => fields2.has(x)));
        if (fields1.size > 0 && fields2.size > 0) {
            similarity += fieldOverlap.size / Math.max(fields1.size, fields2.size);
            factors++;
        }
        
        return factors > 0 ? similarity / factors : 0;
    }
    
    getFieldWarnings(field, domain) {
        const warnings = [];
        
        // Check failure rate for this field
        const fieldPerformance = Array.from(this.patternPerformance.entries())
            .filter(([key]) => key.startsWith(`${field}_`));
        
        fieldPerformance.forEach(([key, perf]) => {
            const failureRate = perf.failures / (perf.attempts || 1);
            if (failureRate > 0.5) {
                warnings.push({
                    type: 'high-failure-rate',
                    strategy: key.split('_')[1],
                    failureRate
                });
            }
        });
        
        // Check for known problematic patterns
        const corrections = this.fieldStrategies.get(`${field}_corrections`);
        if (corrections && corrections.length > 3) {
            warnings.push({
                type: 'frequent-corrections',
                count: corrections.length,
                commonIssues: this.summarizeCorrections(corrections)
            });
        }
        
        return warnings;
    }
    
    summarizeCorrections(corrections) {
        const issues = {};
        
        corrections.forEach(correction => {
            if (!issues[correction.analysis.type]) {
                issues[correction.analysis.type] = 0;
            }
            issues[correction.analysis.type]++;
        });
        
        return Object.entries(issues)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => ({ type, count }));
    }
    
    // Cleanup old history
    pruneHistory() {
        if (this.extractionHistory.size > this.historyLimit) {
            const entries = Array.from(this.extractionHistory.entries())
                .sort((a, b) => a[1].timestamp - b[1].timestamp);
            
            const toDelete = entries.slice(0, entries.length - this.historyLimit);
            toDelete.forEach(([key]) => this.extractionHistory.delete(key));
        }
    }
    
    // Persistence methods
    saveLearningData() {
        try {
            const data = {
                patternPerformance: Array.from(this.patternPerformance.entries()),
                siteProfiles: Array.from(this.siteProfiles.entries()),
                fieldStrategies: Array.from(this.fieldStrategies.entries()),
                timestamp: Date.now()
            };
            
            // In Chrome extension context, use chrome.storage.local
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.set({ learningData: data });
            }
        } catch (error) {
            console.error('Failed to save learning data:', error);
        }
    }
    
    loadLearningData() {
        try {
            // In Chrome extension context, use chrome.storage.local
            if (typeof chrome !== 'undefined' && chrome.storage) {
                chrome.storage.local.get(['learningData'], (result) => {
                    if (result.learningData) {
                        this.patternPerformance = new Map(result.learningData.patternPerformance || []);
                        this.siteProfiles = new Map(result.learningData.siteProfiles || []);
                        this.fieldStrategies = new Map(result.learningData.fieldStrategies || []);
                    }
                });
            }
        } catch (error) {
            console.error('Failed to load learning data:', error);
        }
    }
    
    // Get learning statistics
    getStatistics() {
        const stats = {
            totalExtractions: this.extractionHistory.size,
            sitesAnalyzed: this.siteProfiles.size,
            patternsLearned: 0,
            overallSuccessRate: 0,
            fieldPerformance: {}
        };
        
        // Calculate pattern count
        this.patternPerformance.forEach(perf => {
            stats.patternsLearned += perf.patterns.size;
        });
        
        // Calculate success rates
        let totalAttempts = 0;
        let totalSuccesses = 0;
        
        this.patternPerformance.forEach((perf, key) => {
            const field = key.split('_')[0];
            if (!stats.fieldPerformance[field]) {
                stats.fieldPerformance[field] = {
                    attempts: 0,
                    successes: 0,
                    avgConfidence: 0
                };
            }
            
            stats.fieldPerformance[field].attempts += perf.attempts;
            stats.fieldPerformance[field].successes += perf.successes;
            
            totalAttempts += perf.attempts;
            totalSuccesses += perf.successes;
        });
        
        stats.overallSuccessRate = totalAttempts > 0 ? totalSuccesses / totalAttempts : 0;
        
        // Calculate field success rates
        Object.keys(stats.fieldPerformance).forEach(field => {
            const fieldStats = stats.fieldPerformance[field];
            fieldStats.successRate = fieldStats.attempts > 0 ? 
                fieldStats.successes / fieldStats.attempts : 0;
        });
        
        return stats;
    }
}

// Export for use in extractor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SelfImprovementEngine;
}
