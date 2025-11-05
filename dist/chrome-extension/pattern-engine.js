// pattern-engine.js - Dynamic Pattern Learning Engine
// Generates and optimizes extraction patterns without AI

class DynamicPatternEngine {
    constructor() {
        this.patterns = new Map();
        this.contextClues = new Map();
        this.siteStructures = new Map();
        this.confidenceThresholds = new Map();
        this.patternSuccess = new Map();
        
        // Initialize with base patterns for each field
        this.initializeBasePatterns();
    }
    
    initializeBasePatterns() {
        // Initialize pattern storage for each field type
        const fields = [
            'programName', 'location', 'levelsOfCare', 'population', 
            'clinical', 'staff', 'insurance', 'contact', 'schedule',
            'capacity', 'accreditation', 'specializations'
        ];
        
        fields.forEach(field => {
            this.patterns.set(field, new Set());
            this.confidenceThresholds.set(field, 0.6);
            this.patternSuccess.set(field, new Map());
        });
    }
    
    // Learn from successful extractions
    learnPattern(field, text, context, confidence) {
        const pattern = this.generatePattern(text, context);
        
        if (!this.patterns.has(field)) {
            this.patterns.set(field, new Set());
        }
        
        this.patterns.get(field).add(pattern);
        this.adjustConfidence(field, pattern, confidence);
        
        // Store context clues for better future extraction
        this.updateContextClues(field, context);
    }
    
    // Auto-generate patterns from examples
    generatePattern(text, context) {
        const pattern = new AdaptivePattern(text, context);
        pattern.analyze();
        return pattern;
    }
    
    // Adjust confidence based on success/failure
    adjustConfidence(field, pattern, confidence) {
        const successMap = this.patternSuccess.get(field);
        const patternKey = pattern.toString();
        
        if (!successMap.has(patternKey)) {
            successMap.set(patternKey, {
                successes: 0,
                failures: 0,
                avgConfidence: 0
            });
        }
        
        const stats = successMap.get(patternKey);
        if (confidence > 0.5) {
            stats.successes++;
        } else {
            stats.failures++;
        }
        
        // Update average confidence
        stats.avgConfidence = (stats.avgConfidence * (stats.successes + stats.failures - 1) + confidence) / 
                             (stats.successes + stats.failures);
    }
    
    // Update context clues based on successful extractions
    updateContextClues(field, context) {
        if (!this.contextClues.has(field)) {
            this.contextClues.set(field, new Map());
        }
        
        const clues = this.contextClues.get(field);
        
        // Store surrounding words, headers, and structural elements
        if (context.header) {
            this.addContextClue(clues, 'headers', context.header);
        }
        if (context.precedingWords) {
            context.precedingWords.forEach(word => {
                this.addContextClue(clues, 'preceding', word);
            });
        }
        if (context.section) {
            this.addContextClue(clues, 'sections', context.section);
        }
    }
    
    addContextClue(clues, type, value) {
        if (!clues.has(type)) {
            clues.set(type, new Map());
        }
        
        const typeClues = clues.get(type);
        typeClues.set(value, (typeClues.get(value) || 0) + 1);
    }
    
    // Get best patterns for a field based on historical success
    getBestPatterns(field, limit = 5) {
        const successMap = this.patternSuccess.get(field);
        if (!successMap) return [];
        
        const patterns = Array.from(this.patterns.get(field) || []);
        
        // Sort by success rate and confidence
        return patterns
            .map(pattern => {
                const stats = successMap.get(pattern.toString()) || { avgConfidence: 0, successes: 0, failures: 0 };
                const successRate = stats.successes / (stats.successes + stats.failures + 1);
                return {
                    pattern,
                    score: successRate * stats.avgConfidence,
                    stats
                };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, limit)
            .map(item => item.pattern);
    }
    
    // Predict best extraction strategy for a field on a new site
    predictStrategy(field, siteFingerprint) {
        const contextClues = this.contextClues.get(field);
        if (!contextClues) return null;
        
        // Analyze site structure and match against successful patterns
        const strategy = {
            patterns: this.getBestPatterns(field),
            contextHints: this.getTopContextClues(field),
            confidence: this.calculateStrategyConfidence(field, siteFingerprint)
        };
        
        return strategy;
    }
    
    getTopContextClues(field, limit = 3) {
        const clues = this.contextClues.get(field);
        if (!clues) return {};
        
        const result = {};
        
        for (const [type, values] of clues) {
            const sorted = Array.from(values.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, limit)
                .map(([value]) => value);
            result[type] = sorted;
        }
        
        return result;
    }
    
    calculateStrategyConfidence(field, siteFingerprint) {
        // Calculate confidence based on site similarity to previously successful sites
        const knownSites = Array.from(this.siteStructures.values());
        
        if (knownSites.length === 0) return 0.5;
        
        const similarities = knownSites.map(site => 
            this.calculateSiteSimilarity(siteFingerprint, site)
        );
        
        return Math.max(...similarities);
    }
    
    calculateSiteSimilarity(site1, site2) {
        // Compare site structures, navigation patterns, etc.
        let similarity = 0;
        let factors = 0;
        
        if (site1.cms === site2.cms) {
            similarity += 0.3;
            factors++;
        }
        
        if (site1.navigationPattern === site2.navigationPattern) {
            similarity += 0.2;
            factors++;
        }
        
        // Compare URL structures
        const urlSimilarity = this.compareUrlStructures(site1.urlPattern, site2.urlPattern);
        similarity += urlSimilarity * 0.5;
        factors++;
        
        return factors > 0 ? similarity / factors : 0;
    }
    
    compareUrlStructures(pattern1, pattern2) {
        if (!pattern1 || !pattern2) return 0;
        
        const parts1 = pattern1.split('/').filter(p => p);
        const parts2 = pattern2.split('/').filter(p => p);
        
        let matches = 0;
        const minLength = Math.min(parts1.length, parts2.length);
        
        for (let i = 0; i < minLength; i++) {
            if (parts1[i] === parts2[i]) matches++;
        }
        
        return matches / Math.max(parts1.length, parts2.length);
    }
    
    // Store successful site structure for future reference
    recordSiteStructure(domain, structure) {
        this.siteStructures.set(domain, structure);
    }
}

// Adaptive pattern class that can learn from examples
class AdaptivePattern {
    constructor(text, context) {
        this.originalText = text;
        this.context = context;
        this.regex = null;
        this.flexibility = 0.5;
        this.variations = [];
    }
    
    analyze() {
        // Analyze the text structure and create a flexible pattern
        this.identifyKeyElements();
        this.generateVariations();
        this.buildRegex();
    }
    
    identifyKeyElements() {
        // Identify numbers, key words, separators, etc.
        this.elements = {
            numbers: this.originalText.match(/\d+/g) || [],
            keywords: this.extractKeywords(),
            separators: this.identifySeparators(),
            structure: this.analyzeStructure()
        };
    }
    
    extractKeywords() {
        // Extract meaningful words (not common words)
        const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
        const words = this.originalText.toLowerCase().match(/\b\w+\b/g) || [];
        
        return words.filter(word => 
            !commonWords.has(word) && 
            word.length > 2
        );
    }
    
    identifySeparators() {
        // Identify common separators
        const separators = [];
        const sepPatterns = [
            { char: ':', name: 'colon' },
            { char: '-', name: 'dash' },
            { char: '|', name: 'pipe' },
            { char: ',', name: 'comma' },
            { char: ';', name: 'semicolon' }
        ];
        
        sepPatterns.forEach(sep => {
            if (this.originalText.includes(sep.char)) {
                separators.push(sep);
            }
        });
        
        return separators;
    }
    
    analyzeStructure() {
        // Analyze the overall structure
        return {
            hasNumbers: /\d/.test(this.originalText),
            hasParentheses: /\(.*\)/.test(this.originalText),
            hasList: /(?:,|;|\|)/.test(this.originalText),
            isRange: /\d+\s*(?:-|to|through)\s*\d+/.test(this.originalText),
            hasPrefix: /^(?:\w+:|\w+\s*-\s*)/.test(this.originalText)
        };
    }
    
    generateVariations() {
        // Generate variations of the pattern
        this.variations = [];
        
        // Original pattern
        this.variations.push(this.escapeRegex(this.originalText));
        
        // With flexible whitespace
        const flexibleWhitespace = this.originalText.replace(/\s+/g, '\\s+');
        this.variations.push(flexibleWhitespace);
        
        // With optional elements
        if (this.elements.structure.hasParentheses) {
            const withoutParens = this.originalText.replace(/\s*\([^)]*\)\s*/g, '\\s*(?:\\([^)]*\\))?\\s*');
            this.variations.push(withoutParens);
        }
        
        // Number variations
        if (this.elements.structure.hasNumbers) {
            const numberFlex = this.originalText.replace(/\d+/g, '\\d+');
            this.variations.push(numberFlex);
        }
    }
    
    buildRegex() {
        // Build the final regex pattern
        if (this.variations.length === 1) {
            this.regex = new RegExp(this.variations[0], 'gi');
        } else {
            // Combine variations with OR
            const combined = this.variations.map(v => `(?:${v})`).join('|');
            this.regex = new RegExp(combined, 'gi');
        }
    }
    
    escapeRegex(str) {
        return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    
    match(text) {
        if (!this.regex) return null;
        return text.match(this.regex);
    }
    
    toString() {
        return this.regex ? this.regex.source : this.originalText;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DynamicPatternEngine, AdaptivePattern };
}
