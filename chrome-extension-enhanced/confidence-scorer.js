// confidence-scorer.js - Dynamic confidence scoring system
// Calculates extraction confidence based on multiple factors

class ConfidenceScorer {
    constructor() {
        this.weights = {
            sourceReliability: 0.25,
            patternStrength: 0.20,
            contextRelevance: 0.20,
            crossValidation: 0.15,
            dataCompleteness: 0.10,
            siteAuthority: 0.10
        };
        
        this.sourceScores = {
            'structured-data': 0.95,
            'semantic-html': 0.85,
            'pattern-matching': 0.75,
            'contextual-inference': 0.65,
            'fuzzy-matching': 0.50,
            'visual-structure': 0.60,
            'table-extraction': 0.80,
            'direct-text': 0.70,
            'meta-tags': 0.85,
            'navigation': 0.60
        };
        
        this.fieldImportance = {
            // Critical fields
            name: 1.0,
            location: 1.0,
            contact: 0.95,
            levelsOfCare: 0.95,
            
            // Important fields
            population: 0.85,
            clinical: 0.85,
            insurance: 0.80,
            capacity: 0.75,
            
            // Supporting fields
            staff: 0.70,
            amenities: 0.60,
            accreditations: 0.70,
            philosophy: 0.65
        };
    }
    
    calculateFieldConfidence(field, value, context) {
        const factors = {
            sourceReliability: this.getSourceScore(context.source),
            patternStrength: this.getPatternScore(context.pattern, field),
            contextRelevance: this.getContextScore(context.surrounding, field),
            crossValidation: this.getCrossValidationScore(field, value, context),
            dataCompleteness: this.getCompletenessScore(value, field),
            siteAuthority: this.getSiteAuthorityScore(context.domain)
        };
        
        // Calculate weighted score
        let totalScore = 0;
        let totalWeight = 0;
        
        for (const [factor, score] of Object.entries(factors)) {
            const weight = this.weights[factor];
            totalScore += score * weight;
            totalWeight += weight;
        }
        
        const baseConfidence = totalWeight > 0 ? totalScore / totalWeight : 0;
        
        // Apply field importance modifier
        const importance = this.fieldImportance[field] || 0.5;
        const adjustedConfidence = baseConfidence * (0.5 + importance * 0.5);
        
        // Apply context modifiers
        const finalConfidence = this.applyContextModifiers(adjustedConfidence, context);
        
        return {
            confidence: Math.min(0.99, Math.max(0.1, finalConfidence)),
            breakdown: factors,
            modifiers: this.getAppliedModifiers(context)
        };
    }
    
    getSourceScore(source) {
        if (!source) return 0.5;
        
        // Handle composite sources
        if (Array.isArray(source)) {
            const scores = source.map(s => this.sourceScores[s] || 0.5);
            return Math.max(...scores);
        }
        
        return this.sourceScores[source] || 0.5;
    }
    
    getPatternScore(pattern, field) {
        if (!pattern) return 0.5;
        
        // Evaluate pattern quality
        const patternQuality = {
            specificity: this.evaluatePatternSpecificity(pattern),
            coverage: this.evaluatePatternCoverage(pattern, field),
            reliability: this.evaluatePatternReliability(pattern)
        };
        
        return (patternQuality.specificity + patternQuality.coverage + patternQuality.reliability) / 3;
    }
    
    evaluatePatternSpecificity(pattern) {
        if (!pattern) return 0.5;
        
        // More specific patterns get higher scores
        const specificityMarkers = {
            hasAnchors: /\^|\$/.test(pattern.toString()),
            hasWordBoundaries: /\\b/.test(pattern.toString()),
            hasNegativeLookahead: /\(\?!/.test(pattern.toString()),
            hasGroups: /\([^?]/.test(pattern.toString())
        };
        
        let score = 0.5;
        Object.values(specificityMarkers).forEach(hasMarker => {
            if (hasMarker) score += 0.125;
        });
        
        return score;
    }
    
    evaluatePatternCoverage(pattern, field) {
        // Field-specific pattern coverage evaluation
        const fieldPatternCounts = {
            phone: 3,  // Multiple phone formats
            email: 2,  // Standard and complex emails
            levelsOfCare: 8,  // Many care levels
            modalities: 15  // Many therapy types
        };
        
        const expectedPatterns = fieldPatternCounts[field] || 5;
        const coverage = Math.min(1, 1 / expectedPatterns);
        
        return 0.5 + coverage * 0.5;
    }
    
    evaluatePatternReliability(pattern) {
        // Patterns known to be reliable
        const reliablePatterns = [
            /^\d{3}-\d{3}-\d{4}$/,  // Phone
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,  // Email
            /^\d+$/  // Numbers
        ];
        
        if (reliablePatterns.some(reliable => 
            reliable.toString() === pattern.toString()
        )) {
            return 0.9;
        }
        
        return 0.7;
    }
    
    getContextScore(surrounding, field) {
        if (!surrounding) return 0.5;
        
        const contextKeywords = {
            phone: ['call', 'phone', 'telephone', 'contact', 'reach'],
            email: ['email', 'message', 'contact', 'reach out'],
            address: ['located', 'address', 'location', 'find us'],
            insurance: ['accept', 'insurance', 'coverage', 'payment'],
            capacity: ['beds', 'serves', 'capacity', 'residents']
        };
        
        const keywords = contextKeywords[field] || [];
        let matchCount = 0;
        
        const lowerContext = surrounding.toLowerCase();
        keywords.forEach(keyword => {
            if (lowerContext.includes(keyword)) {
                matchCount++;
            }
        });
        
        // Calculate proximity bonus
        const proximityBonus = this.calculateProximityBonus(surrounding, keywords);
        
        const keywordScore = keywords.length > 0 ? matchCount / keywords.length : 0.5;
        return Math.min(1, keywordScore + proximityBonus);
    }
    
    calculateProximityBonus(text, keywords) {
        // Bonus for keywords appearing close together
        let minDistance = Infinity;
        
        keywords.forEach((keyword1, i) => {
            keywords.slice(i + 1).forEach(keyword2 => {
                const index1 = text.toLowerCase().indexOf(keyword1);
                const index2 = text.toLowerCase().indexOf(keyword2);
                
                if (index1 !== -1 && index2 !== -1) {
                    const distance = Math.abs(index2 - index1);
                    minDistance = Math.min(minDistance, distance);
                }
            });
        });
        
        if (minDistance < 50) return 0.2;
        if (minDistance < 100) return 0.1;
        return 0;
    }
    
    getCrossValidationScore(field, value, context) {
        const validationChecks = {
            phone: () => this.validatePhone(value),
            email: () => this.validateEmail(value),
            url: () => this.validateUrl(value),
            capacity: () => this.validateCapacity(value),
            ages: () => this.validateAgeRange(value)
        };
        
        const validator = validationChecks[field];
        if (!validator) return 0.7; // No validation available
        
        const isValid = validator();
        
        // Check consistency with other data
        const consistencyScore = this.checkDataConsistency(field, value, context);
        
        return isValid ? 0.8 + consistencyScore * 0.2 : 0.3;
    }
    
    validatePhone(value) {
        const phoneRegex = /^\+?1?\s*\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})(?:\s*(?:ext|x)\.?\s*\d+)?$/;
        return phoneRegex.test(value.replace(/\s+/g, ' ').trim());
    }
    
    validateEmail(value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value);
    }
    
    validateUrl(value) {
        try {
            new URL(value);
            return true;
        } catch {
            return false;
        }
    }
    
    validateCapacity(value) {
        const num = parseInt(value);
        return !isNaN(num) && num > 0 && num < 1000;
    }
    
    validateAgeRange(value) {
        if (typeof value === 'object' && value.min && value.max) {
            return value.min < value.max && value.min >= 0 && value.max <= 100;
        }
        return /\d+\s*-\s*\d+/.test(value);
    }
    
    checkDataConsistency(field, value, context) {
        // Check if data is consistent with other extracted information
        if (!context.otherData) return 0.5;
        
        const consistencyRules = {
            phone: () => {
                // Check area code matches location
                if (context.otherData.state && value.match(/^\d{3}/)) {
                    const areaCode = value.substring(0, 3);
                    return this.isAreaCodeValid(areaCode, context.otherData.state) ? 1 : 0;
                }
                return 0.5;
            },
            
            capacity: () => {
                // Check against staff ratio
                if (context.otherData.staffRatio) {
                    const ratio = this.parseRatio(context.otherData.staffRatio);
                    if (ratio) {
                        const impliedCapacity = this.calculateImpliedCapacity(value, ratio);
                        return Math.abs(impliedCapacity - parseInt(value)) < 20 ? 1 : 0.3;
                    }
                }
                return 0.5;
            }
        };
        
        const rule = consistencyRules[field];
        return rule ? rule() : 0.5;
    }
    
    getCompletenessScore(value, field) {
        if (!value) return 0;
        
        // Check if value is complete based on field type
        const completenessChecks = {
            phone: () => value.length >= 10,
            email: () => value.includes('@') && value.includes('.'),
            address: () => {
                const parts = ['street', 'city', 'state', 'zip'];
                let found = 0;
                parts.forEach(part => {
                    if (value.toLowerCase().includes(part) || 
                        (part === 'zip' && /\d{5}/.test(value))) {
                        found++;
                    }
                });
                return found / parts.length;
            },
            levelsOfCare: () => {
                return Array.isArray(value) ? Math.min(1, value.length / 3) : 0.5;
            }
        };
        
        const check = completenessChecks[field];
        return check ? check() : 0.7;
    }
    
    getSiteAuthorityScore(domain) {
        if (!domain) return 0.5;
        
        // Check domain characteristics
        const authorityMarkers = {
            hasSSL: domain.startsWith('https://'),
            isComDomain: domain.includes('.com'),
            isOrgDomain: domain.includes('.org'),
            hasSubdomain: domain.split('.').length > 2,
            hasHyphens: domain.includes('-')
        };
        
        let score = 0.5;
        
        if (authorityMarkers.hasSSL) score += 0.2;
        if (authorityMarkers.isOrgDomain) score += 0.1;
        if (authorityMarkers.isComDomain) score += 0.05;
        if (!authorityMarkers.hasHyphens) score += 0.1;
        if (!authorityMarkers.hasSubdomain) score += 0.05;
        
        return Math.min(1, score);
    }
    
    applyContextModifiers(baseConfidence, context) {
        let confidence = baseConfidence;
        
        // Negative modifiers
        if (context.isNegated) confidence *= 0.3;
        if (context.isConditional) confidence *= 0.7;
        if (context.isExternal) confidence *= 0.5;
        if (context.isFuture) confidence *= 0.2;
        
        // Positive modifiers
        if (context.isStructuredData) confidence *= 1.1;
        if (context.isRepeated) confidence *= 1.15;
        if (context.isProminent) confidence *= 1.1;
        
        // Section modifiers
        if (context.section) {
            const sectionWeights = {
                header: 1.2,
                footer: 0.8,
                sidebar: 0.7,
                main: 1.1,
                navigation: 0.6
            };
            
            const weight = sectionWeights[context.section] || 1;
            confidence *= weight;
        }
        
        return confidence;
    }
    
    getAppliedModifiers(context) {
        const modifiers = [];
        
        if (context.isNegated) modifiers.push({ type: 'negated', impact: -0.7 });
        if (context.isConditional) modifiers.push({ type: 'conditional', impact: -0.3 });
        if (context.isExternal) modifiers.push({ type: 'external', impact: -0.5 });
        if (context.isFuture) modifiers.push({ type: 'future', impact: -0.8 });
        if (context.isStructuredData) modifiers.push({ type: 'structured', impact: 0.1 });
        if (context.isRepeated) modifiers.push({ type: 'repeated', impact: 0.15 });
        if (context.isProminent) modifiers.push({ type: 'prominent', impact: 0.1 });
        
        return modifiers;
    }
    
    // Calculate overall extraction confidence
    calculateOverallConfidence(extractedData, metadata) {
        const fieldScores = [];
        let totalImportance = 0;
        
        // Calculate confidence for each field
        for (const [field, data] of Object.entries(extractedData)) {
            if (data && data.confidence !== undefined) {
                const importance = this.fieldImportance[field] || 0.5;
                fieldScores.push({
                    field,
                    confidence: data.confidence,
                    importance
                });
                totalImportance += importance;
            }
        }
        
        // Calculate weighted average
        let weightedSum = 0;
        fieldScores.forEach(score => {
            weightedSum += score.confidence * score.importance;
        });
        
        const avgConfidence = totalImportance > 0 ? weightedSum / totalImportance : 0;
        
        // Apply completeness modifier
        const completeness = this.calculateCompleteness(extractedData);
        const completenessMod = 0.5 + completeness * 0.5;
        
        // Apply extraction quality modifiers
        const qualityMod = this.calculateQualityModifier(metadata);
        
        const finalConfidence = avgConfidence * completenessMod * qualityMod;
        
        return {
            overall: Math.min(0.95, Math.max(0.1, finalConfidence)),
            fieldBreakdown: fieldScores,
            completeness,
            quality: qualityMod,
            factors: {
                averageFieldConfidence: avgConfidence,
                completenessModifier: completenessMod,
                qualityModifier: qualityMod
            }
        };
    }
    
    calculateCompleteness(data) {
        const requiredFields = ['name', 'location', 'contact', 'levelsOfCare'];
        const importantFields = ['population', 'clinical', 'insurance', 'capacity'];
        const optionalFields = ['staff', 'amenities', 'philosophy', 'outcomes'];
        
        let score = 0;
        let maxScore = 0;
        
        // Check required fields (weight: 3)
        requiredFields.forEach(field => {
            maxScore += 3;
            if (data[field] && this.isFieldPopulated(data[field])) {
                score += 3;
            }
        });
        
        // Check important fields (weight: 2)
        importantFields.forEach(field => {
            maxScore += 2;
            if (data[field] && this.isFieldPopulated(data[field])) {
                score += 2;
            }
        });
        
        // Check optional fields (weight: 1)
        optionalFields.forEach(field => {
            maxScore += 1;
            if (data[field] && this.isFieldPopulated(data[field])) {
                score += 1;
            }
        });
        
        return score / maxScore;
    }
    
    isFieldPopulated(value) {
        if (!value) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return true;
    }
    
    calculateQualityModifier(metadata) {
        if (!metadata) return 0.8;
        
        let modifier = 1.0;
        
        // Pages analyzed
        if (metadata.pagesAnalyzed) {
            if (metadata.pagesAnalyzed >= 10) modifier += 0.1;
            else if (metadata.pagesAnalyzed >= 5) modifier += 0.05;
        }
        
        // Extraction time (faster is generally better for simple sites)
        if (metadata.extractionTime) {
            if (metadata.extractionTime < 5000) modifier += 0.05;
            else if (metadata.extractionTime > 30000) modifier -= 0.1;
        }
        
        // AI enhancement
        if (metadata.aiEnhanced) modifier += 0.1;
        
        // Structured data found
        if (metadata.hasStructuredData) modifier += 0.1;
        
        return Math.min(1.2, Math.max(0.5, modifier));
    }
    
    // Helper methods
    isAreaCodeValid(areaCode, state) {
        // Simplified area code validation
        const stateAreaCodes = {
            'FL': ['305', '321', '352', '386', '407', '561', '727', '754', '772', '786', '813', '850', '863', '904', '941', '954'],
            'CA': ['209', '213', '310', '323', '408', '415', '424', '442', '510', '530', '559', '562', '619', '626', '650', '657', '661', '669', '707', '714', '747', '760', '805', '818', '831', '858', '909', '916', '925', '949', '951'],
            // Add more states as needed
        };
        
        const validCodes = stateAreaCodes[state];
        return validCodes ? validCodes.includes(areaCode) : true;
    }
    
    parseRatio(ratioStr) {
        const match = ratioStr.match(/(\d+)\s*:\s*(\d+)/);
        if (match) {
            return {
                staff: parseInt(match[1]),
                clients: parseInt(match[2])
            };
        }
        return null;
    }
    
    calculateImpliedCapacity(capacity, ratio) {
        // Rough calculation based on typical staffing
        const typicalStaffCount = 20; // Assumption
        return (typicalStaffCount / ratio.staff) * ratio.clients;
    }
}

// Export for use in extractor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfidenceScorer;
}
