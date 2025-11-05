// anti-patterns.js - Detect and filter misleading information
// Prevents extraction of referrals, external services, and inaccurate data

const MISLEADING_PATTERNS = {
    // Services not actually offered by the program
    referrals: {
        patterns: [
            /we\s+(?:refer|recommend|partner\s+with|work\s+with\s+external)/i,
            /referrals?\s+(?:to|for)\s+/i,
            /through\s+(?:our\s+)?partners?/i,
            /external\s+providers?/i,
            /third[\-\s]party\s+services?/i
        ],
        action: 'exclude',
        confidence_modifier: 0.2
    },
    
    notOffered: {
        patterns: [
            /we\s+do\s+not\s+(?:offer|provide|treat|accept)/i,
            /not\s+(?:available|offered|provided)/i,
            /unavailable\s+(?:at|in)\s+(?:this|our)/i,
            /excluded?\s+(?:from|in)\s+(?:our|this)/i,
            /cannot\s+(?:provide|offer|accommodate)/i
        ],
        action: 'exclude',
        confidence_modifier: 0.0
    },
    
    externalServices: {
        patterns: [
            /through\s+(?:external|outside|partner)/i,
            /off[\-\s]site\s+(?:services?|providers?)/i,
            /community\s+resources?\s+(?:for|include)/i,
            /local\s+(?:hospitals?|clinics?|providers?)/i,
            /arrangements?\s+(?:with|through)\s+(?:local|area)/i
        ],
        action: 'flag',
        confidence_modifier: 0.3
    },
    
    wishList: {
        patterns: [
            /we\s+(?:hope|plan|intend|aim)\s+to/i,
            /(?:future|upcoming|planned)\s+(?:services?|programs?)/i,
            /(?:will\s+be|to\s+be)\s+(?:added|offered|available)/i,
            /under\s+(?:development|construction)/i,
            /coming\s+soon/i
        ],
        action: 'exclude',
        confidence_modifier: 0.1
    },
    
    competitors: {
        patterns: [
            /other\s+(?:programs?|facilities|centers?|providers?)/i,
            /alternative\s+(?:programs?|options?|treatments?)/i,
            /(?:may|might)\s+(?:also\s+)?consider/i,
            /similar\s+(?:programs?|facilities)\s+(?:include|are)/i,
            /comparison\s+(?:to|with)\s+other/i
        ],
        action: 'exclude',
        confidence_modifier: 0.0
    },
    
    conditional: {
        patterns: [
            /(?:if|when)\s+(?:appropriate|needed|necessary)/i,
            /case[\-\s]by[\-\s]case\s+basis/i,
            /depends?\s+(?:on|upon)/i,
            /varies?\s+(?:by|based|depending)/i,
            /subject\s+to\s+(?:availability|approval)/i,
            /may\s+(?:be\s+)?(?:available|offered)/i
        ],
        action: 'reduce_confidence',
        confidence_modifier: 0.5
    }
};

// Context patterns that indicate negative information
const NEGATIVE_CONTEXTS = {
    exclusions: {
        headers: ['exclusions', 'we do not', 'not appropriate for', 'exclusion criteria'],
        patterns: [
            /exclusion\s+criteria/i,
            /not\s+appropriate\s+for/i,
            /we\s+cannot\s+accept/i,
            /ineligible\s+for/i
        ]
    },
    
    limitations: {
        headers: ['limitations', 'restrictions', 'not available'],
        patterns: [
            /limitations?\s+(?:include|are)/i,
            /restricted\s+(?:to|from)/i,
            /not\s+equipped\s+(?:to|for)/i,
            /beyond\s+our\s+scope/i
        ]
    },
    
    referralContext: {
        headers: ['referral services', 'partner programs', 'external resources'],
        patterns: [
            /referral\s+(?:services?|network|partners?)/i,
            /external\s+resources?/i,
            /community\s+partners?/i
        ]
    }
};

// Red flag patterns that need special attention
const RED_FLAGS = {
    vague: {
        patterns: [
            /call\s+for\s+(?:details?|information|pricing)/i,
            /contact\s+us\s+(?:for|to\s+discuss)/i,
            /varies?/i,
            /case\s+by\s+case/i,
            /depends?/i,
            /individual(?:ly|ized)\s+determined/i
        ],
        severity: 'low',
        action: 'reduce_confidence'
    },
    
    concerning: {
        patterns: [
            /restraints?/i,
            /isolation/i,
            /punishment/i,
            /locked\s+(?:unit|facility|ward)/i,
            /involuntary/i,
            /forced/i
        ],
        severity: 'high',
        action: 'flag_for_review'
    },
    
    outdated: {
        patterns: [
            /copyright\s+(?:©\s+)?20[0-1]\d/i,
            /last\s+updated?\s*:?\s*(?:.*)?20[0-1]\d/i,
            /\b20[0-1]\d\s+(?:version|edition)/i
        ],
        severity: 'medium',
        action: 'reduce_confidence'
    },
    
    unprofessional: {
        patterns: [
            /guarantee/i,
            /miracle/i,
            /cure/i,
            /100%\s+success/i,
            /never\s+fail/i
        ],
        severity: 'medium',
        action: 'flag_warning'
    }
};

class AntiPatternFilter {
    constructor() {
        this.detectedIssues = [];
        this.contextStack = [];
    }
    
    // Main filtering function
    filterExtractedData(data, context) {
        this.detectedIssues = [];
        
        // Check if we're in a negative context
        const negativeContext = this.checkNegativeContext(context);
        
        // Filter each field
        const filteredData = {};
        
        for (const [field, value] of Object.entries(data)) {
            const filtered = this.filterField(field, value, context, negativeContext);
            if (filtered !== null) {
                filteredData[field] = filtered;
            }
        }
        
        return {
            data: filteredData,
            issues: this.detectedIssues,
            confidence: this.calculateOverallConfidence(filteredData, this.detectedIssues)
        };
    }
    
    checkNegativeContext(context) {
        for (const [type, config] of Object.entries(NEGATIVE_CONTEXTS)) {
            // Check headers
            if (config.headers.some(header => 
                context.header && context.header.toLowerCase().includes(header)
            )) {
                return { type, confidence: 0.9 };
            }
            
            // Check patterns
            if (config.patterns.some(pattern => 
                pattern.test(context.surroundingText || '')
            )) {
                return { type, confidence: 0.7 };
            }
        }
        
        return null;
    }
    
    filterField(field, value, context, negativeContext) {
        // Convert value to string for pattern matching
        const valueStr = Array.isArray(value) ? value.join(' ') : String(value);
        
        // If in negative context, be more strict
        if (negativeContext) {
            if (negativeContext.type === 'exclusions') {
                this.addIssue('excluded', field, 'Found in exclusions section');
                return null;
            }
            
            if (negativeContext.type === 'referralContext') {
                this.addIssue('referral', field, 'Found in referral section');
                return null;
            }
        }
        
        // Check misleading patterns
        for (const [type, config] of Object.entries(MISLEADING_PATTERNS)) {
            if (this.matchesPatterns(valueStr, config.patterns) ||
                this.matchesPatterns(context.surroundingText, config.patterns)) {
                
                if (config.action === 'exclude') {
                    this.addIssue(type, field, `Excluded due to ${type} pattern`);
                    return null;
                }
                
                if (config.action === 'flag') {
                    this.addIssue(type, field, `Flagged as possible ${type}`);
                }
                
                // Reduce confidence but keep the data
                if (config.action === 'reduce_confidence') {
                    if (typeof value === 'object' && !Array.isArray(value)) {
                        value.confidence = (value.confidence || 1) * config.confidence_modifier;
                    }
                }
            }
        }
        
        // Check red flags
        this.checkRedFlags(field, valueStr, context);
        
        return value;
    }
    
    matchesPatterns(text, patterns) {
        if (!text) return false;
        return patterns.some(pattern => pattern.test(text));
    }
    
    checkRedFlags(field, value, context) {
        const combinedText = value + ' ' + (context.surroundingText || '');
        
        for (const [type, config] of Object.entries(RED_FLAGS)) {
            if (this.matchesPatterns(combinedText, config.patterns)) {
                this.addIssue('red_flag', field, `${type}: ${config.action}`, config.severity);
            }
        }
    }
    
    addIssue(type, field, message, severity = 'medium') {
        this.detectedIssues.push({
            type,
            field,
            message,
            severity,
            timestamp: Date.now()
        });
    }
    
    calculateOverallConfidence(data, issues) {
        let baseConfidence = 0.8;
        
        // Reduce confidence based on issues
        issues.forEach(issue => {
            switch (issue.severity) {
                case 'high':
                    baseConfidence *= 0.5;
                    break;
                case 'medium':
                    baseConfidence *= 0.8;
                    break;
                case 'low':
                    baseConfidence *= 0.9;
                    break;
            }
        });
        
        // Consider data completeness
        const expectedFields = ['name', 'location', 'levelsOfCare', 'population', 'contact'];
        const presentFields = expectedFields.filter(field => data[field]);
        const completeness = presentFields.length / expectedFields.length;
        
        return Math.max(0.1, Math.min(1.0, baseConfidence * completeness));
    }
    
    // Validate specific data types
    validatePhoneNumber(phone, location) {
        // Basic US phone validation
        const cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.length !== 10 && cleaned.length !== 11) {
            return { valid: false, reason: 'Invalid length' };
        }
        
        if (cleaned.length === 11 && !cleaned.startsWith('1')) {
            return { valid: false, reason: 'Invalid country code' };
        }
        
        // Could add area code validation based on location
        return { valid: true };
    }
    
    validateCapacity(capacity, otherData) {
        const num = parseInt(capacity);
        
        if (isNaN(num) || num <= 0) {
            return { valid: false, reason: 'Invalid number' };
        }
        
        if (num > 500) {
            return { valid: false, reason: 'Unusually high capacity' };
        }
        
        // Cross-reference with staff ratio if available
        if (otherData.staffRatio) {
            const ratio = otherData.staffRatio.split(':');
            if (ratio.length === 2) {
                const staffPer = parseInt(ratio[0]);
                const clientsPer = parseInt(ratio[1]);
                const impliedCapacity = (num / clientsPer) * staffPer;
                
                if (Math.abs(impliedCapacity - num) > num * 0.5) {
                    return { valid: false, reason: 'Inconsistent with staff ratio' };
                }
            }
        }
        
        return { valid: true };
    }
}

// Standalone validation functions
function isLikelyReferral(text) {
    return MISLEADING_PATTERNS.referrals.patterns.some(pattern => pattern.test(text));
}

function isLikelyExcluded(text) {
    return MISLEADING_PATTERNS.notOffered.patterns.some(pattern => pattern.test(text));
}

function hasRedFlags(text) {
    const flags = [];
    
    for (const [type, config] of Object.entries(RED_FLAGS)) {
        if (config.patterns.some(pattern => pattern.test(text))) {
            flags.push({
                type,
                severity: config.severity,
                action: config.action
            });
        }
    }
    
    return flags;
}

// Export for use in extractor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        MISLEADING_PATTERNS,
        NEGATIVE_CONTEXTS,
        RED_FLAGS,
        AntiPatternFilter,
        isLikelyReferral,
        isLikelyExcluded,
        hasRedFlags
    };
}
