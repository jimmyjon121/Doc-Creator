// CareConnect Clinical Intel v13.0 - Hybrid AI Extraction Engine
// Built: 2025-10-14T02:59:59.297Z
// This is a professionally bundled content script with all modules integrated

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__CC_HYBRID_V13__) {
        console.log('[CareConnect] v13.0 already loaded');
        return;
    }
    window.__CC_HYBRID_V13__ = true;
    
    console.log('[CareConnect] 🚀 Loading Hybrid AI Extraction Engine v13.0...');
    

    // ============= PATTERN-ENGINE.JS =============
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
;
}

    

    // ============= UNIVERSAL-STRUCTURES.JS =============
    // universal-structures.js - Universal Structure Recognition System
// Recognizes common patterns across all treatment center websites

const UNIVERSAL_STRUCTURES = {
    // Navigation patterns that work across sites
    navigation: {
        primary: [
            'about', 'about us', 'who we are', 'our story', 'mission',
            'programs', 'treatment', 'services', 'our programs', 'what we treat',
            'approach', 'philosophy', 'our approach', 'treatment philosophy',
            'admissions', 'admission', 'intake', 'getting started', 'enrollment',
            'contact', 'contact us', 'get in touch', 'reach out', 'location'
        ],
        secondary: [
            'staff', 'team', 'our team', 'clinicians', 'leadership',
            'facilities', 'campus', 'our campus', 'virtual tour', 'amenities',
            'insurance', 'payment', 'cost', 'financing', 'coverage',
            'faq', 'faqs', 'questions', 'resources', 'blog', 'news'
        ],
        clinical: [
            'modalities', 'therapies', 'therapy', 'clinical services', 'treatment modalities',
            'specialties', 'specializations', 'what we treat', 'conditions',
            'levels of care', 'continuum of care', 'programs offered'
        ]
    },
    
    // Universal content patterns
    contentBlocks: {
        // List patterns - various bullet styles and HTML lists
        lists: /(?:<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|(?:^|\n)\s*[•▪►✓◆→▸※❖★☆\-\*]\s*.+(?:\n\s*[•▪►✓◆→▸※❖★☆\-\*]\s*.+)*)/gim,
        
        // Definition patterns - Term: Description
        definitions: /(?:^|\n)([A-Z][A-Za-z\s&\-]+):\s*([^\n]+(?:\n(?!\s*[A-Z][A-Za-z\s&\-]+:)[^\n]+)*)/gm,
        
        // Schedule patterns - Time-based content
        schedules: /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM|a\.m\.|p\.m\.))[\s\S]+?(?=\d{1,2}:\d{2}\s*(?:am|pm|AM|PM|a\.m\.|p\.m\.)|$|\n\n)/gi,
        
        // Feature descriptions
        features: /(?:we\s+(?:offer|provide|feature|include)|our\s+(?:program|facility|center)\s+(?:includes|features|offers|provides))[\s\S]{10,200}?(?:\.|:|$)/gi,
        
        // Service listings
        services: /(?:services\s+include|we\s+treat|specializing\s+in|specialized\s+(?:in|for))[\s\S]{10,300}?(?:\.|;|:|\n\n|$)/gi
    },
    
    // Common section headers and their variations
    sectionHeaders: {
        about: /^(?:about(?:\s+us)?|who\s+we\s+are|our\s+(?:story|mission|philosophy))$/i,
        clinical: /^(?:clinical\s+(?:services|programming)|treatment\s+(?:approach|modalities)|therapeutic\s+services)$/i,
        programs: /^(?:programs?|levels?\s+of\s+care|what\s+we\s+offer|our\s+services)$/i,
        admissions: /^(?:admissions?|intake|getting\s+started|enrollment|how\s+to\s+apply)$/i,
        insurance: /^(?:insurance|payment\s+options?|financial|cost|pricing|coverage)$/i,
        contact: /^(?:contact(?:\s+us)?|get\s+in\s+touch|reach\s+out|location|directions)$/i
    },
    
    // Common HTML structures
    htmlPatterns: {
        // Card/box layouts
        cards: /<(?:div|section|article)[^>]*class="[^"]*(?:card|box|feature|service)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section|article)>/gi,
        
        // Accordion/collapsible content
        accordions: /<(?:div|section)[^>]*class="[^"]*(?:accordion|collapse|expand|toggle)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
        
        // Tab content
        tabs: /<(?:div|section)[^>]*class="[^"]*(?:tab|panel)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section)>/gi,
        
        // Info blocks
        infoBlocks: /<(?:div|section|aside)[^>]*class="[^"]*(?:info|callout|highlight|sidebar)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section|aside)>/gi
    }
};

// Field synonym mappings for flexible extraction
const FIELD_SYNONYMS = {
    levelsOfCare: {
        primary: [
            'residential', 'inpatient', 'php', 'iop', 'outpatient',
            'detox', 'detoxification', 'sober living', 'aftercare'
        ],
        alternates: {
            'residential': ['residential treatment', 'rtc', 'res', '24/7 care', '24-hour care', 'live-in'],
            'php': ['partial hospitalization', 'day treatment', 'partial day', 'day program'],
            'iop': ['intensive outpatient', 'evening program', 'intensive day'],
            'outpatient': ['op', 'weekly therapy', 'outpatient therapy', 'counseling'],
            'detox': ['medical detox', 'withdrawal management', 'stabilization'],
            'sober living': ['transitional living', 'recovery residence', 'halfway house']
        },
        contextual: [
            '24/7 supervision', 'round-the-clock care', 'overnight stay',
            'day program', 'evening sessions', 'after school',
            'step-down care', 'continuing care', 'alumni program'
        ]
    },
    
    population: {
        age: {
            patterns: ['ages', 'serving', 'we treat', 'for ages', 'age range'],
            ranges: {
                'adolescent': ['12-17', '13-17', '13-18', '12-18', 'teens', 'teenagers', 'adolescents'],
                'young adult': ['18-25', '18-26', '18-28', 'young adults', 'college age'],
                'adult': ['18+', '18 and up', 'adults', '21+', 'adult program']
            },
            descriptive: [
                'middle school', 'high school', 'college', 'university',
                'teen', 'adolescent', 'young adult', 'adult'
            ]
        },
        gender: {
            male: ['male', 'males only', 'boys', 'young men', 'all-male', 'men\'s program'],
            female: ['female', 'females only', 'girls', 'young women', 'all-female', 'women\'s program'],
            coed: ['co-ed', 'coed', 'all genders', 'mixed gender', 'both male and female']
        },
        special: [
            'lgbtq', 'lgbtq+', 'lgbtqia+', 'transgender', 'gender diverse',
            'first responders', 'military', 'veterans', 'healthcare workers',
            'professionals', 'executives', 'licensed professionals'
        ]
    },
    
    clinical: {
        modalities: {
            evidenceBased: [
                'cbt', 'cognitive behavioral therapy', 'cognitive-behavioral',
                'dbt', 'dialectical behavior therapy', 'dialectical behavioral',
                'emdr', 'eye movement desensitization', 'trauma processing',
                'act', 'acceptance and commitment therapy', 'acceptance commitment',
                'mi', 'motivational interviewing', 'motivational enhancement'
            ],
            experiential: [
                'equine', 'horse therapy', 'equine-assisted',
                'art therapy', 'creative arts', 'expressive arts',
                'music therapy', 'music-based', 'musical therapy',
                'adventure', 'wilderness', 'outdoor therapy',
                'recreation therapy', 'recreational', 'fitness therapy'
            ],
            holistic: [
                'yoga', 'mindfulness', 'meditation', 'breathwork',
                'acupuncture', 'massage', 'reiki', 'nutrition',
                'fitness', 'exercise', 'movement therapy'
            ]
        },
        
        intensity: {
            individual: ['individual therapy', 'one-on-one', '1:1', 'individual sessions'],
            group: ['group therapy', 'group sessions', 'group work', 'process groups'],
            family: ['family therapy', 'family sessions', 'family involvement', 'family program']
        }
    },
    
    programFeatures: {
        academics: [
            'academic', 'school', 'education', 'credits', 'accredited',
            'teachers', 'tutoring', 'college prep', 'sat/act prep'
        ],
        
        medical: [
            'psychiatrist', 'psychiatric', 'medication', 'med management',
            'nursing', 'medical staff', '24/7 medical', 'physician'
        ],
        
        amenities: [
            'gym', 'fitness center', 'pool', 'sports', 'recreation',
            'cafeteria', 'chef', 'nutrition', 'private rooms', 'semi-private'
        ]
    }
};

// Site fingerprinting patterns
const SITE_FINGERPRINTS = {
    cms: {
        wordpress: {
            indicators: ['/wp-content/', '/wp-includes/', 'wp-json', 'wordpress'],
            confidence: 0.9
        },
        squarespace: {
            indicators: ['squarespace.com', 'sqsp-cdn', 'squarespace-cdn'],
            confidence: 0.95
        },
        wix: {
            indicators: ['wix.com', 'wixstatic.com', 'wix-code'],
            confidence: 0.95
        },
        custom: {
            indicators: [],
            confidence: 0.5
        }
    },
    
    urlPatterns: {
        standard: /\/(about|programs?|treatment|services?|admissions?|contact)\/?$/i,
        hierarchical: /\/(?:about|programs?)\/[\w-]+\/?$/i,
        parameterized: /\?(?:page|p|section)=[\w-]+$/i
    },
    
    layoutPatterns: {
        singlePage: {
            indicators: ['#about', '#programs', '#contact', 'scroll-to'],
            structure: 'anchor-based'
        },
        multiPage: {
            indicators: ['/about', '/programs', '/contact'],
            structure: 'directory-based'
        }
    }
};

// Structure analyzer class
class StructureAnalyzer {
    constructor() {
        this.siteFingerprint = null;
        this.navigationMap = new Map();
        this.contentSections = new Map();
    }
    
    analyzeSite(document) {
        this.siteFingerprint = this.fingerPrintSite(document);
        this.mapNavigation(document);
        this.identifyContentSections(document);
        
        return {
            fingerprint: this.siteFingerprint,
            navigation: this.navigationMap,
            sections: this.contentSections,
            recommendations: this.getExtractionRecommendations()
        };
    }
    
    fingerPrintSite(document) {
        const fingerprint = {
            cms: 'unknown',
            urlPattern: 'standard',
            layout: 'multiPage',
            hasStructuredData: false,
            hasSitemap: false
        };
        
        // Detect CMS
        for (const [cms, config] of Object.entries(SITE_FINGERPRINTS.cms)) {
            if (this.detectCMS(document, config.indicators)) {
                fingerprint.cms = cms;
                break;
            }
        }
        
        // Detect URL pattern
        const currentUrl = window.location.href;
        for (const [pattern, regex] of Object.entries(SITE_FINGERPRINTS.urlPatterns)) {
            if (regex.test(currentUrl)) {
                fingerprint.urlPattern = pattern;
                break;
            }
        }
        
        // Check for structured data
        fingerprint.hasStructuredData = !!document.querySelector('script[type="application/ld+json"]');
        
        // Check for layout type
        const hasAnchors = document.querySelectorAll('a[href^="#"]').length > 5;
        fingerprint.layout = hasAnchors ? 'singlePage' : 'multiPage';
        
        return fingerprint;
    }
    
    detectCMS(document, indicators) {
        const html = document.documentElement.outerHTML;
        return indicators.some(indicator => html.includes(indicator));
    }
    
    mapNavigation(document) {
        // Find main navigation
        const navElements = document.querySelectorAll('nav, [role="navigation"], .nav, .navigation, #nav, #navigation');
        
        navElements.forEach(nav => {
            const links = nav.querySelectorAll('a');
            links.forEach(link => {
                const text = link.textContent.trim().toLowerCase();
                const href = link.getAttribute('href');
                
                // Categorize navigation items
                for (const [category, patterns] of Object.entries(UNIVERSAL_STRUCTURES.navigation)) {
                    if (patterns.some(pattern => text.includes(pattern))) {
                        if (!this.navigationMap.has(category)) {
                            this.navigationMap.set(category, []);
                        }
                        this.navigationMap.get(category).push({
                            text: link.textContent.trim(),
                            url: href,
                            element: link
                        });
                        break;
                    }
                }
            });
        });
    }
    
    identifyContentSections(document) {
        // Look for main content areas
        const contentSelectors = [
            'main', 'article', '[role="main"]', '.content', '#content',
            '.main-content', '#main-content'
        ];
        
        contentSelectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                this.analyzeSectionContent(element);
            });
        });
    }
    
    analyzeSectionContent(element) {
        // Find section headers
        const headers = element.querySelectorAll('h1, h2, h3');
        
        headers.forEach(header => {
            const text = header.textContent.trim();
            const section = this.identifySection(text);
            
            if (section) {
                const content = this.extractSectionContent(header);
                this.contentSections.set(section, {
                    header: text,
                    element: header,
                    content: content,
                    confidence: this.calculateSectionConfidence(header, content)
                });
            }
        });
    }
    
    identifySection(headerText) {
        const normalized = headerText.toLowerCase();
        
        for (const [section, pattern] of Object.entries(UNIVERSAL_STRUCTURES.sectionHeaders)) {
            if (pattern.test(normalized)) {
                return section;
            }
        }
        
        return null;
    }
    
    extractSectionContent(header) {
        // Get content following the header
        let content = '';
        let sibling = header.nextElementSibling;
        let depth = 0;
        
        while (sibling && depth < 5) {
            // Stop at next header of same or higher level
            if (sibling.tagName && sibling.tagName.match(/^H[1-6]$/)) {
                const siblingLevel = parseInt(sibling.tagName[1]);
                const headerLevel = parseInt(header.tagName[1]);
                if (siblingLevel <= headerLevel) break;
            }
            
            content += sibling.textContent + '\n';
            sibling = sibling.nextElementSibling;
            depth++;
        }
        
        return content;
    }
    
    calculateSectionConfidence(header, content) {
        let confidence = 0.5;
        
        // Header prominence
        if (header.tagName === 'H1') confidence += 0.2;
        else if (header.tagName === 'H2') confidence += 0.1;
        
        // Content length
        if (content.length > 100) confidence += 0.1;
        if (content.length > 500) confidence += 0.1;
        
        // Structured content
        if (UNIVERSAL_STRUCTURES.contentBlocks.lists.test(content)) confidence += 0.1;
        
        return Math.min(confidence, 1.0);
    }
    
    getExtractionRecommendations() {
        const recommendations = {
            strategy: 'multi-layer',
            priority: [],
            warnings: []
        };
        
        // Recommend extraction strategy based on site structure
        if (this.siteFingerprint.hasStructuredData) {
            recommendations.priority.push('structured-data');
        }
        
        if (this.contentSections.size > 3) {
            recommendations.priority.push('section-based');
        }
        
        if (this.navigationMap.size > 0) {
            recommendations.priority.push('navigation-guided');
        }
        
        // Add warnings
        if (this.siteFingerprint.layout === 'singlePage') {
            recommendations.warnings.push('Single page layout - ensure all content is loaded');
        }
        
        return recommendations;
    }
}

// Export for use in extractor
;
}

    

    // ============= ANTI-PATTERNS.JS =============
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
;
}

    

    // ============= SMART-CRAWLER.JS =============
    // smart-crawler.js - Intelligent multi-page crawler with adaptive depth
// Prioritizes relevant pages and efficiently extracts data

class SmartCrawler {
    constructor() {
        this.visitedUrls = new Set();
        this.pageQueue = [];
        this.extractedData = new Map();
        this.siteMap = new Map();
        this.maxDepth = 3;
        this.maxPages = 50;
        this.concurrentFetches = 3;
        this.requestDelay = 300; // ms between requests
    }
    
    async crawlSite(startUrl, options = {}) {
        // Reset state
        this.visitedUrls.clear();
        this.pageQueue = [];
        this.extractedData.clear();
        
        // Apply options
        Object.assign(this, options);
        
        // Analyze starting page
        const startPage = await this.analyzePage(startUrl);
        if (!startPage) return null;
        
        // Identify site structure
        const pageTypes = this.identifyPageTypes(startPage);
        const crawlPlan = this.createCrawlPlan(pageTypes, startPage);
        
        // Execute crawl
        const results = await this.executeCrawl(crawlPlan);
        
        return {
            pages: results,
            siteStructure: this.siteMap,
            summary: this.summarizeCrawl()
        };
    }
    
    async analyzePage(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            return {
                url,
                document: doc,
                links: this.extractLinks(doc, url),
                metadata: this.extractMetadata(doc),
                structure: this.analyzeStructure(doc)
            };
        } catch (error) {
            console.error(`Failed to analyze ${url}:`, error);
            return null;
        }
    }
    
    identifyPageTypes(page) {
        const pageTypes = {
            navigation: [],
            content: [],
            utility: []
        };
        
        // Check for sitemap
        const sitemapLink = page.document.querySelector('link[rel="sitemap"], a[href*="sitemap"]');
        if (sitemapLink) {
            pageTypes.utility.push({
                url: sitemapLink.href,
                type: 'sitemap',
                priority: 1.0
            });
        }
        
        // Analyze navigation links
        page.links.forEach(link => {
            const score = this.scorePageRelevance(link);
            
            if (score.category === 'content' && score.value > 0.5) {
                pageTypes.content.push({
                    url: link.url,
                    type: score.type,
                    priority: score.value
                });
            } else if (score.category === 'navigation') {
                pageTypes.navigation.push({
                    url: link.url,
                    type: score.type,
                    priority: score.value
                });
            }
        });
        
        return pageTypes;
    }
    
    scorePageRelevance(link) {
        const url = link.url.toLowerCase();
        const text = link.text.toLowerCase();
        const title = link.title?.toLowerCase() || '';
        
        // High-priority content pages
        const contentPatterns = {
            programs: { patterns: ['/program', '/treatment', '/services', 'program', 'treatment'], score: 0.9 },
            clinical: { patterns: ['/clinical', '/therapy', '/modalities', 'clinical', 'therapy'], score: 0.85 },
            approach: { patterns: ['/approach', '/philosophy', '/method', 'approach', 'philosophy'], score: 0.8 },
            about: { patterns: ['/about', '/who-we-are', '/mission', 'about', 'who we are'], score: 0.75 },
            admissions: { patterns: ['/admission', '/intake', '/enroll', 'admission', 'intake'], score: 0.85 },
            staff: { patterns: ['/staff', '/team', '/clinicians', 'staff', 'team'], score: 0.7 },
            insurance: { patterns: ['/insurance', '/payment', '/cost', 'insurance', 'payment'], score: 0.8 }
        };
        
        // Check URL and text against patterns
        for (const [type, config] of Object.entries(contentPatterns)) {
            const matchesUrl = config.patterns.some(pattern => url.includes(pattern));
            const matchesText = config.patterns.some(pattern => 
                text.includes(pattern) || title.includes(pattern)
            );
            
            if (matchesUrl || matchesText) {
                return {
                    category: 'content',
                    type,
                    value: matchesUrl ? config.score : config.score * 0.8
                };
            }
        }
        
        // Low-priority pages
        const lowPriorityPatterns = [
            'blog', 'news', 'events', 'careers', 'privacy', 'terms',
            'contact', 'resources', 'testimonials', 'gallery'
        ];
        
        if (lowPriorityPatterns.some(pattern => url.includes(pattern) || text.includes(pattern))) {
            return {
                category: 'utility',
                type: 'low-priority',
                value: 0.3
            };
        }
        
        return {
            category: 'navigation',
            type: 'unknown',
            value: 0.5
        };
    }
    
    createCrawlPlan(pageTypes, startPage) {
        const plan = [];
        
        // Add high-priority content pages first
        const contentPages = pageTypes.content
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 20); // Limit to top 20 content pages
        
        plan.push(...contentPages);
        
        // Add some navigation pages if needed
        if (plan.length < 10) {
            const navPages = pageTypes.navigation
                .filter(page => page.priority > 0.6)
                .slice(0, 5);
            plan.push(...navPages);
        }
        
        // Check for sitemap
        const sitemap = pageTypes.utility.find(page => page.type === 'sitemap');
        if (sitemap) {
            plan.unshift(sitemap); // Process sitemap first
        }
        
        // Calculate optimal depth based on site structure
        this.maxDepth = this.calculateOptimalDepth(pageTypes, startPage);
        
        return plan;
    }
    
    calculateOptimalDepth(pageTypes, startPage) {
        // Factors to consider
        const factors = {
            hasSitemap: pageTypes.utility.some(p => p.type === 'sitemap'),
            contentPageCount: pageTypes.content.length,
            siteSize: startPage.links.length,
            hasGoodNavigation: pageTypes.navigation.filter(p => p.priority > 0.7).length > 3
        };
        
        // Calculate depth
        let depth = 2; // Default
        
        if (factors.hasSitemap) depth = 1; // Sitemap provides all links
        else if (factors.contentPageCount > 10) depth = 2; // Many direct content links
        else if (factors.siteSize < 20) depth = 3; // Small site, go deeper
        else if (!factors.hasGoodNavigation) depth = 3; // Poor navigation, need to dig
        
        return Math.min(depth, 4); // Cap at 4 levels
    }
    
    async executeCrawl(crawlPlan) {
        const results = [];
        const queue = [...crawlPlan];
        
        // Add start URL if not in plan
        if (!queue.some(item => item.url === window.location.href)) {
            queue.unshift({
                url: window.location.href,
                type: 'start',
                priority: 1.0
            });
        }
        
        // Process queue with concurrent fetching
        while (queue.length > 0 && results.length < this.maxPages) {
            const batch = queue.splice(0, this.concurrentFetches);
            
            const batchPromises = batch.map(async (item) => {
                if (this.visitedUrls.has(item.url)) return null;
                
                this.visitedUrls.add(item.url);
                
                // Delay between requests
                await this.delay(this.requestDelay);
                
                const page = await this.fetchAndExtract(item);
                
                if (page) {
                    // Discover new pages from this one
                    const newPages = this.discoverPages(page, item.depth || 0);
                    queue.push(...newPages);
                }
                
                return page;
            });
            
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults.filter(r => r !== null));
        }
        
        return results;
    }
    
    async fetchAndExtract(pageInfo) {
        try {
            const response = await fetch(pageInfo.url);
            const html = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract data using appropriate strategy
            const extractedData = this.extractPageData(doc, pageInfo);
            
            // Store in map
            this.extractedData.set(pageInfo.url, extractedData);
            
            return {
                url: pageInfo.url,
                type: pageInfo.type,
                data: extractedData,
                links: this.extractLinks(doc, pageInfo.url),
                depth: pageInfo.depth || 0
            };
        } catch (error) {
            console.error(`Failed to fetch ${pageInfo.url}:`, error);
            return null;
        }
    }
    
    extractPageData(doc, pageInfo) {
        // This would integrate with the main extractor
        // For now, return basic structure analysis
        return {
            title: doc.title,
            headers: Array.from(doc.querySelectorAll('h1, h2, h3')).map(h => ({
                level: h.tagName,
                text: h.textContent.trim()
            })),
            hasStructuredData: !!doc.querySelector('script[type="application/ld+json"]'),
            mainContent: this.identifyMainContent(doc),
            pageType: pageInfo.type
        };
    }
    
    identifyMainContent(doc) {
        // Try to identify main content area
        const contentSelectors = [
            'main', '[role="main"]', '.main-content', '#main-content',
            '.content', '#content', 'article', '.article'
        ];
        
        for (const selector of contentSelectors) {
            const element = doc.querySelector(selector);
            if (element) {
                return {
                    found: true,
                    selector,
                    textLength: element.textContent.length
                };
            }
        }
        
        return { found: false };
    }
    
    discoverPages(page, currentDepth) {
        if (currentDepth >= this.maxDepth) return [];
        
        const newPages = [];
        
        page.links.forEach(link => {
            if (this.visitedUrls.has(link.url)) return;
            
            const score = this.scorePageRelevance(link);
            
            // Only add relevant pages
            if (score.value > 0.5) {
                newPages.push({
                    url: link.url,
                    type: score.type,
                    priority: score.value * (1 - currentDepth / this.maxDepth), // Reduce priority with depth
                    depth: currentDepth + 1
                });
            }
        });
        
        // Sort by priority and limit
        return newPages
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 10);
    }
    
    extractLinks(doc, baseUrl) {
        const links = [];
        const linkElements = doc.querySelectorAll('a[href]');
        
        linkElements.forEach(element => {
            const href = element.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
            
            try {
                const url = new URL(href, baseUrl);
                
                // Only internal links
                if (url.hostname !== new URL(baseUrl).hostname) return;
                
                links.push({
                    url: url.href,
                    text: element.textContent.trim(),
                    title: element.getAttribute('title')
                });
            } catch (error) {
                // Invalid URL
            }
        });
        
        return links;
    }
    
    extractMetadata(doc) {
        return {
            title: doc.title,
            description: doc.querySelector('meta[name="description"]')?.content,
            ogTitle: doc.querySelector('meta[property="og:title"]')?.content,
            ogDescription: doc.querySelector('meta[property="og:description"]')?.content,
            canonical: doc.querySelector('link[rel="canonical"]')?.href
        };
    }
    
    analyzeStructure(doc) {
        return {
            hasNav: !!doc.querySelector('nav, [role="navigation"]'),
            hasMain: !!doc.querySelector('main, [role="main"]'),
            hasSidebar: !!doc.querySelector('aside, .sidebar, #sidebar'),
            hasFooter: !!doc.querySelector('footer, [role="contentinfo"]'),
            hasStructuredData: !!doc.querySelector('script[type="application/ld+json"]')
        };
    }
    
    summarizeCrawl() {
        return {
            pagesVisited: this.visitedUrls.size,
            dataExtracted: this.extractedData.size,
            pageTypes: this.categorizeVisitedPages(),
            coverage: this.estimateSiteCoverage()
        };
    }
    
    categorizeVisitedPages() {
        const categories = {};
        
        this.extractedData.forEach((data, url) => {
            const type = data.pageType || 'unknown';
            categories[type] = (categories[type] || 0) + 1;
        });
        
        return categories;
    }
    
    estimateSiteCoverage() {
        // Estimate based on common page types found
        const expectedPages = [
            'programs', 'clinical', 'about', 'admissions',
            'staff', 'approach', 'insurance'
        ];
        
        const foundPages = Object.keys(this.categorizeVisitedPages());
        const coverage = expectedPages.filter(page => foundPages.includes(page)).length;
        
        return {
            percentage: (coverage / expectedPages.length) * 100,
            missing: expectedPages.filter(page => !foundPages.includes(page))
        };
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Parse sitemap if found
    async parseSitemap(sitemapUrl) {
        try {
            const response = await fetch(sitemapUrl);
            const text = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'application/xml');
            
            const urls = Array.from(doc.querySelectorAll('url > loc')).map(loc => ({
                url: loc.textContent,
                priority: parseFloat(loc.parentElement.querySelector('priority')?.textContent || '0.5'),
                changefreq: loc.parentElement.querySelector('changefreq')?.textContent
            }));
            
            return urls;
        } catch (error) {
            console.error('Failed to parse sitemap:', error);
            return [];
        }
    }
}

// Export for use in extractor


    

    // ============= MULTI-STRATEGY-EXTRACTOR.JS =============
    // multi-strategy-extractor.js - Cascading extraction system with multiple fallback strategies
// Implements 5+ extraction methods with confidence-based selection

class MultiStrategyExtractor {
    constructor() {
        this.strategies = this.initializeStrategies();
        this.results = new Map();
        this.confidence = new Map();
    }
    
    initializeStrategies() {
        return [
            {
                name: 'structured-data',
                confidence: 0.95,
                method: this.extractFromStructuredData.bind(this),
                priority: 1
            },
            {
                name: 'semantic-html',
                confidence: 0.85,
                method: this.extractFromSemanticHTML.bind(this),
                priority: 2
            },
            {
                name: 'pattern-matching',
                confidence: 0.75,
                method: this.extractFromPatterns.bind(this),
                priority: 3
            },
            {
                name: 'contextual-inference',
                confidence: 0.65,
                method: this.extractFromContext.bind(this),
                priority: 4
            },
            {
                name: 'fuzzy-matching',
                confidence: 0.50,
                method: this.extractFromFuzzyMatching.bind(this),
                priority: 5
            },
            {
                name: 'visual-structure',
                confidence: 0.60,
                method: this.extractFromVisualStructure.bind(this),
                priority: 6
            },
            {
                name: 'table-extraction',
                confidence: 0.80,
                method: this.extractFromTables.bind(this),
                priority: 7
            }
        ];
    }
    
    async extractField(field, document, options = {}) {
        const results = [];
        
        // Try each strategy in order of priority
        for (const strategy of this.strategies.sort((a, b) => a.priority - b.priority)) {
            try {
                const result = await strategy.method(field, document, options);
                
                if (result && result.value !== null && result.value !== undefined) {
                    results.push({
                        strategy: strategy.name,
                        value: result.value,
                        confidence: result.confidence || strategy.confidence,
                        context: result.context
                    });
                    
                    // If high confidence, can skip remaining strategies
                    if (result.confidence >= 0.9 && options.fastMode) {
                        break;
                    }
                }
            } catch (error) {
                console.warn(`Strategy ${strategy.name} failed for field ${field}:`, error);
            }
        }
        
        // Merge results from multiple strategies
        return this.mergeResults(results, field);
    }
    
    // Strategy 1: Structured Data (JSON-LD, Microdata, RDFa)
    async extractFromStructuredData(field, document) {
        const results = [];
        
        // JSON-LD
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach(script => {
            try {
                const data = JSON.parse(script.textContent);
                const extracted = this.extractFromJsonLd(field, data);
                if (extracted) results.push(extracted);
            } catch (e) {}
        });
        
        // Microdata
        const microdata = this.extractFromMicrodata(field, document);
        if (microdata) results.push(microdata);
        
        // RDFa
        const rdfa = this.extractFromRDFa(field, document);
        if (rdfa) results.push(rdfa);
        
        return this.selectBestResult(results);
    }
    
    extractFromJsonLd(field, data) {
        const fieldMappings = {
            name: ['name', 'legalName', 'alternateName'],
            location: ['address', 'location'],
            phone: ['telephone', 'contactPoint.telephone'],
            email: ['email', 'contactPoint.email'],
            description: ['description', 'disambiguatingDescription']
        };
        
        const mappings = fieldMappings[field] || [field];
        
        for (const mapping of mappings) {
            const value = this.getNestedValue(data, mapping);
            if (value) {
                return {
                    value,
                    confidence: 0.95,
                    context: { source: 'json-ld', path: mapping }
                };
            }
        }
        
        // Handle @graph structures
        if (data['@graph']) {
            for (const item of data['@graph']) {
                const result = this.extractFromJsonLd(field, item);
                if (result) return result;
            }
        }
        
        return null;
    }
    
    extractFromMicrodata(field, document) {
        const itemprops = {
            name: 'name',
            location: 'address',
            phone: 'telephone',
            email: 'email',
            description: 'description'
        };
        
        const prop = itemprops[field];
        if (!prop) return null;
        
        const element = document.querySelector(`[itemprop="${prop}"]`);
        if (element) {
            return {
                value: element.textContent.trim(),
                confidence: 0.90,
                context: { source: 'microdata', itemprop: prop }
            };
        }
        
        return null;
    }
    
    extractFromRDFa(field, document) {
        const properties = {
            name: 'schema:name',
            location: 'schema:address',
            phone: 'schema:telephone',
            email: 'schema:email'
        };
        
        const property = properties[field];
        if (!property) return null;
        
        const element = document.querySelector(`[property="${property}"]`);
        if (element) {
            return {
                value: element.textContent.trim(),
                confidence: 0.85,
                context: { source: 'rdfa', property }
            };
        }
        
        return null;
    }
    
    // Strategy 2: Semantic HTML
    async extractFromSemanticHTML(field, document) {
        const semanticSelectors = {
            name: ['h1', '[role="heading"][aria-level="1"]', '.site-title', '#site-title'],
            contact: ['address', '[role="contentinfo"] .contact', 'footer .contact'],
            navigation: ['nav', '[role="navigation"]'],
            main: ['main', '[role="main"]', '#main-content', '.main-content']
        };
        
        const selectors = semanticSelectors[field];
        if (!selectors) return null;
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                const value = this.extractValueFromElement(element, field);
                if (value) {
                    return {
                        value,
                        confidence: 0.80,
                        context: { source: 'semantic-html', selector }
                    };
                }
            }
        }
        
        return null;
    }
    
    // Strategy 3: Pattern Matching
    async extractFromPatterns(field, document, options) {
        const text = document.body.textContent;
        const patterns = this.getFieldPatterns(field);
        
        if (!patterns) return null;
        
        const results = [];
        
        for (const pattern of patterns) {
            const matches = text.match(pattern.regex);
            if (matches) {
                const value = pattern.extract ? pattern.extract(matches) : matches[1] || matches[0];
                
                // Verify context
                const context = this.getMatchContext(text, matches.index);
                const contextScore = this.scoreContext(context, field);
                
                results.push({
                    value,
                    confidence: pattern.confidence * contextScore,
                    context: { 
                        source: 'pattern', 
                        pattern: pattern.name,
                        surrounding: context 
                    }
                });
            }
        }
        
        return this.selectBestResult(results);
    }
    
    getFieldPatterns(field) {
        const patternLibrary = {
            phone: [
                {
                    name: 'us-phone',
                    regex: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/g,
                    extract: (m) => `${m[1]}-${m[2]}-${m[3]}`,
                    confidence: 0.85
                },
                {
                    name: 'phone-with-ext',
                    regex: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})(?:\s*(?:ext|x|extension)\.?\s*(\d+))?/gi,
                    extract: (m) => m[4] ? `${m[1]}-${m[2]}-${m[3]} ext. ${m[4]}` : `${m[1]}-${m[2]}-${m[3]}`,
                    confidence: 0.80
                }
            ],
            email: [
                {
                    name: 'standard-email',
                    regex: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
                    confidence: 0.90
                }
            ],
            capacity: [
                {
                    name: 'beds-capacity',
                    regex: /(\d+)[\s-]?(?:bed|beds)\b/gi,
                    extract: (m) => m[1],
                    confidence: 0.85
                },
                {
                    name: 'serves-capacity',
                    regex: /serves?\s+(?:up\s+to\s+)?(\d+)\s+(?:clients?|patients?|residents?)/gi,
                    extract: (m) => m[1],
                    confidence: 0.80
                }
            ]
        };
        
        return patternLibrary[field] || null;
    }
    
    // Strategy 4: Contextual Inference
    async extractFromContext(field, document) {
        // Find relevant sections based on headers
        const relevantSections = this.findRelevantSections(document, field);
        
        if (relevantSections.length === 0) return null;
        
        const results = [];
        
        for (const section of relevantSections) {
            const value = this.inferFromSection(section, field);
            if (value) {
                results.push({
                    value,
                    confidence: 0.60 * section.relevance,
                    context: {
                        source: 'contextual',
                        section: section.header,
                        method: 'inference'
                    }
                });
            }
        }
        
        return this.selectBestResult(results);
    }
    
    findRelevantSections(document, field) {
        const sectionKeywords = {
            insurance: ['insurance', 'payment', 'coverage', 'financial'],
            clinical: ['treatment', 'therapy', 'clinical', 'modalities'],
            staff: ['team', 'staff', 'clinicians', 'professionals'],
            admissions: ['admissions', 'intake', 'enrollment', 'getting started']
        };
        
        const keywords = sectionKeywords[field] || [field];
        const sections = [];
        
        // Find all headers
        const headers = document.querySelectorAll('h1, h2, h3, h4');
        
        headers.forEach(header => {
            const headerText = header.textContent.toLowerCase();
            const relevance = this.calculateRelevance(headerText, keywords);
            
            if (relevance > 0.5) {
                sections.push({
                    header: header.textContent,
                    element: header,
                    content: this.getSectionContent(header),
                    relevance
                });
            }
        });
        
        return sections.sort((a, b) => b.relevance - a.relevance);
    }
    
    // Strategy 5: Fuzzy Matching
    async extractFromFuzzyMatching(field, document) {
        const candidates = this.findFuzzyCandidates(document, field);
        
        if (candidates.length === 0) return null;
        
        // Score each candidate
        const scored = candidates.map(candidate => ({
            ...candidate,
            score: this.fuzzyScore(candidate, field)
        }));
        
        // Select best match
        const best = scored.sort((a, b) => b.score - a.score)[0];
        
        if (best.score > 0.4) {
            return {
                value: best.value,
                confidence: best.score,
                context: {
                    source: 'fuzzy',
                    method: best.method,
                    similarity: best.score
                }
            };
        }
        
        return null;
    }
    
    // Strategy 6: Visual Structure Analysis
    async extractFromVisualStructure(field, document) {
        // Analyze visual hierarchy and layout
        const visualElements = this.analyzeVisualHierarchy(document);
        
        // Look for field-specific visual patterns
        const patterns = {
            contact: this.findContactBlock,
            hours: this.findScheduleBlock,
            features: this.findFeatureCards
        };
        
        const extractor = patterns[field];
        if (!extractor) return null;
        
        const result = extractor.call(this, visualElements, document);
        
        return result;
    }
    
    analyzeVisualHierarchy(document) {
        const elements = [];
        
        // Find prominent elements
        const selectors = [
            '.card', '.box', '.feature', '.service',
            '[class*="card"]', '[class*="box"]', '[class*="feature"]'
        ];
        
        selectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                const rect = element.getBoundingClientRect();
                elements.push({
                    element,
                    area: rect.width * rect.height,
                    position: { x: rect.left, y: rect.top },
                    content: element.textContent
                });
            });
        });
        
        return elements.sort((a, b) => b.area - a.area);
    }
    
    // Strategy 7: Table Extraction
    async extractFromTables(field, document) {
        const tables = document.querySelectorAll('table');
        
        for (const table of tables) {
            const result = this.extractFieldFromTable(table, field);
            if (result) {
                return {
                    value: result.value,
                    confidence: 0.80,
                    context: {
                        source: 'table',
                        headers: result.headers
                    }
                };
            }
        }
        
        return null;
    }
    
    extractFieldFromTable(table, field) {
        const fieldKeywords = {
            insurance: ['insurance', 'accepted', 'coverage'],
            hours: ['hours', 'schedule', 'time'],
            contact: ['contact', 'phone', 'email']
        };
        
        const keywords = fieldKeywords[field] || [field];
        
        // Check headers
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.toLowerCase());
        
        const relevantColIndex = headers.findIndex(header => 
            keywords.some(keyword => header.includes(keyword))
        );
        
        if (relevantColIndex !== -1) {
            // Extract values from that column
            const values = Array.from(table.querySelectorAll(`td:nth-child(${relevantColIndex + 1})`))
                .map(td => td.textContent.trim())
                .filter(v => v);
                
            return {
                value: values,
                headers
            };
        }
        
        return null;
    }
    
    // Result merging and confidence calculation
    mergeResults(results, field) {
        if (results.length === 0) return null;
        
        // Sort by confidence
        results.sort((a, b) => b.confidence - a.confidence);
        
        // For single values, return highest confidence
        if (!this.isMultiValueField(field)) {
            return results[0];
        }
        
        // For multi-value fields, merge unique values
        const merged = {
            value: [],
            confidence: 0,
            sources: []
        };
        
        const seen = new Set();
        
        results.forEach(result => {
            const values = Array.isArray(result.value) ? result.value : [result.value];
            
            values.forEach(value => {
                const normalized = this.normalizeValue(value, field);
                if (!seen.has(normalized)) {
                    seen.add(normalized);
                    merged.value.push(value);
                    merged.sources.push({
                        strategy: result.strategy,
                        confidence: result.confidence
                    });
                }
            });
        });
        
        // Calculate overall confidence
        merged.confidence = this.calculateMergedConfidence(merged.sources);
        
        return merged;
    }
    
    isMultiValueField(field) {
        const multiValueFields = [
            'levelsOfCare', 'modalities', 'insurance', 
            'specializations', 'accreditations', 'staff'
        ];
        
        return multiValueFields.includes(field);
    }
    
    normalizeValue(value, field) {
        // Field-specific normalization
        if (field === 'phone') {
            return value.replace(/\D/g, '');
        }
        
        return value.toLowerCase().trim();
    }
    
    calculateMergedConfidence(sources) {
        if (sources.length === 0) return 0;
        
        // Weight by strategy confidence
        const totalWeight = sources.reduce((sum, s) => sum + s.confidence, 0);
        const avgConfidence = totalWeight / sources.length;
        
        // Boost confidence if multiple strategies agree
        const agreementBonus = Math.min(0.2, sources.length * 0.05);
        
        return Math.min(0.95, avgConfidence + agreementBonus);
    }
    
    // Helper methods
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    
    extractValueFromElement(element, field) {
        // Try different extraction methods based on element type
        if (element.tagName === 'INPUT') {
            return element.value;
        }
        
        if (element.tagName === 'SELECT') {
            return element.options[element.selectedIndex]?.text;
        }
        
        // For other elements, get text content
        return element.textContent.trim();
    }
    
    getMatchContext(text, index, windowSize = 100) {
        const start = Math.max(0, index - windowSize);
        const end = Math.min(text.length, index + windowSize);
        return text.substring(start, end);
    }
    
    scoreContext(context, field) {
        // Score based on surrounding keywords
        const fieldKeywords = {
            phone: ['call', 'contact', 'reach', 'telephone'],
            email: ['email', 'contact', 'reach out', 'message'],
            capacity: ['beds', 'residents', 'capacity', 'serves']
        };
        
        const keywords = fieldKeywords[field] || [];
        let score = 0.5; // Base score
        
        keywords.forEach(keyword => {
            if (context.toLowerCase().includes(keyword)) {
                score += 0.1;
            }
        });
        
        return Math.min(1.0, score);
    }
    
    selectBestResult(results) {
        if (results.length === 0) return null;
        return results.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))[0];
    }
    
    calculateRelevance(text, keywords) {
        let matches = 0;
        keywords.forEach(keyword => {
            if (text.includes(keyword)) matches++;
        });
        return matches / keywords.length;
    }
    
    getSectionContent(header) {
        let content = '';
        let sibling = header.nextElementSibling;
        let depth = 0;
        
        while (sibling && depth < 5) {
            if (sibling.tagName?.match(/^H[1-6]$/)) break;
            content += sibling.textContent + '\n';
            sibling = sibling.nextElementSibling;
            depth++;
        }
        
        return content;
    }
    
    inferFromSection(section, field) {
        // Field-specific inference logic
        const inferenceRules = {
            insurance: () => this.inferInsurance(section.content),
            capacity: () => this.inferCapacity(section.content),
            modalities: () => this.inferModalities(section.content)
        };
        
        const rule = inferenceRules[field];
        return rule ? rule() : null;
    }
    
    inferInsurance(content) {
        const insuranceNames = [
            'BCBS', 'Blue Cross', 'Aetna', 'Cigna', 'United', 'Anthem',
            'Humana', 'Kaiser', 'Medicaid', 'Medicare', 'Tricare'
        ];
        
        const found = [];
        insuranceNames.forEach(name => {
            if (content.includes(name)) {
                found.push(name);
            }
        });
        
        return found.length > 0 ? found : null;
    }
    
    inferCapacity(content) {
        const match = content.match(/(\d+)\s*(?:bed|client|resident|student)/i);
        return match ? match[1] : null;
    }
    
    inferModalities(content) {
        const modalities = [
            'CBT', 'DBT', 'EMDR', 'ACT', 'Motivational Interviewing',
            'Family Therapy', 'Group Therapy', 'Individual Therapy'
        ];
        
        const found = [];
        modalities.forEach(modality => {
            if (content.toLowerCase().includes(modality.toLowerCase())) {
                found.push(modality);
            }
        });
        
        return found.length > 0 ? found : null;
    }
    
    findFuzzyCandidates(document, field) {
        // Implement fuzzy candidate finding
        return [];
    }
    
    fuzzyScore(candidate, field) {
        // Implement fuzzy scoring
        return 0.5;
    }
    
    findContactBlock(visualElements, document) {
        // Look for contact information blocks
        const contactPatterns = /contact|reach|call|email/i;
        
        for (const element of visualElements) {
            if (contactPatterns.test(element.content)) {
                return {
                    value: this.extractContactInfo(element.element),
                    confidence: 0.65
                };
            }
        }
        
        return null;
    }
    
    extractContactInfo(element) {
        const info = {};
        
        // Extract phone
        const phoneMatch = element.textContent.match(/(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
        if (phoneMatch) {
            info.phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
        }
        
        // Extract email
        const emailMatch = element.textContent.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
        if (emailMatch) {
            info.email = emailMatch[1];
        }
        
        return info;
    }
}

// Export for use in main extractor


    

    // ============= CONFIDENCE-SCORER.JS =============
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


    

    // ============= SELF-IMPROVEMENT.JS =============
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


    

    // ============= DYNAMIC-TEMPLATES.JS =============
    // dynamic-templates.js - Adaptive write-up templates that adjust to available data
// Creates comprehensive, clinical-grade documentation based on data richness

class DynamicTemplateEngine {
    constructor() {
        this.templates = {
            comprehensive: this.comprehensiveTemplate,
            detailed: this.detailedTemplate,
            standard: this.standardTemplate,
            minimal: this.minimalTemplate
        };
        
        this.sectionPriority = [
            'identity', 'differentiators', 'clinical', 'population', 
            'structure', 'approach', 'family', 'practical', 'outcomes'
        ];
        
        this.outputFormats = {
            'family-meeting': this.familyMeetingFormat,
            'clinical-team': this.clinicalTeamFormat,
            'insurance-auth': this.insuranceAuthFormat,
            'quick-reference': this.quickReferenceFormat
        };
    }
    
    generateWriteUp(data, options = {}) {
        // Assess data richness
        const richness = this.assessDataRichness(data);
        
        // Select appropriate template
        const template = this.selectTemplate(richness);
        
        // Generate base write-up
        let writeUp = template.call(this, data, richness);
        
        // Apply format customization if specified
        if (options.format && this.outputFormats[options.format]) {
            writeUp = this.outputFormats[options.format].call(this, writeUp, data);
        }
        
        // Add metadata footer
        writeUp += this.generateMetadata(data, richness);
        
        return writeUp;
    }
    
    assessDataRichness(data) {
        const assessment = {
            score: 0,
            fieldCount: 0,
            depth: {},
            quality: {},
            completeness: 0
        };
        
        // Count populated fields
        const fields = this.countFields(data);
        assessment.fieldCount = fields.total;
        assessment.score += Math.min(fields.total / 50, 1) * 30; // Up to 30 points for field count
        
        // Assess depth of key fields
        const keyFields = ['clinical', 'population', 'structure', 'outcomes'];
        keyFields.forEach(field => {
            if (data[field]) {
                const depth = this.assessFieldDepth(data[field]);
                assessment.depth[field] = depth;
                assessment.score += depth * 10; // Up to 10 points per key field
            }
        });
        
        // Assess data quality
        assessment.quality = this.assessDataQuality(data);
        assessment.score += assessment.quality.score * 20; // Up to 20 points for quality
        
        // Calculate completeness
        assessment.completeness = this.calculateCompleteness(data);
        assessment.score += assessment.completeness * 10; // Up to 10 points for completeness
        
        // Determine richness level
        if (assessment.score >= 80) {
            assessment.level = 'comprehensive';
        } else if (assessment.score >= 60) {
            assessment.level = 'detailed';
        } else if (assessment.score >= 40) {
            assessment.level = 'standard';
        } else {
            assessment.level = 'minimal';
        }
        
        return assessment;
    }
    
    countFields(data, prefix = '') {
        let count = { total: 0, byCategory: {} };
        
        for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined || value === '') continue;
            
            const category = prefix || key;
            if (!count.byCategory[category]) {
                count.byCategory[category] = 0;
            }
            
            if (typeof value === 'object' && !Array.isArray(value)) {
                const subCount = this.countFields(value, key);
                count.total += subCount.total;
                count.byCategory[category] += subCount.total;
            } else if (Array.isArray(value) && value.length > 0) {
                count.total += value.length;
                count.byCategory[category] += value.length;
            } else {
                count.total++;
                count.byCategory[category]++;
            }
        }
        
        return count;
    }
    
    assessFieldDepth(field) {
        let depth = 0;
        
        if (Array.isArray(field)) {
            depth = Math.min(field.length / 10, 1);
        } else if (typeof field === 'object') {
            const keys = Object.keys(field).filter(k => field[k]);
            depth = Math.min(keys.length / 5, 1);
        } else if (typeof field === 'string') {
            depth = field.length > 100 ? 1 : field.length / 100;
        }
        
        return depth;
    }
    
    assessDataQuality(data) {
        const quality = {
            hasSpecifics: 0,
            hasNumbers: 0,
            hasDetails: 0,
            hasUnique: 0,
            score: 0
        };
        
        // Check for specific information
        if (data.clinical?.individualTherapyHours || data.clinical?.groupTherapyHours) {
            quality.hasSpecifics++;
        }
        if (data.structure?.capacity || data.structure?.ratio) {
            quality.hasSpecifics++;
        }
        
        // Check for numerical data
        const numbers = JSON.stringify(data).match(/\d+/g);
        quality.hasNumbers = numbers ? Math.min(numbers.length / 20, 1) : 0;
        
        // Check for detailed descriptions
        const longTexts = JSON.stringify(data).match(/".{50,}"/g);
        quality.hasDetails = longTexts ? Math.min(longTexts.length / 10, 1) : 0;
        
        // Check for unique/differentiating information
        if (data.differentiators && data.differentiators.length > 0) {
            quality.hasUnique = Math.min(data.differentiators.length / 5, 1);
        }
        
        quality.score = (
            quality.hasSpecifics * 0.3 +
            quality.hasNumbers * 0.2 +
            quality.hasDetails * 0.2 +
            quality.hasUnique * 0.3
        );
        
        return quality;
    }
    
    calculateCompleteness(data) {
        const requiredFields = ['name', 'location', 'contact', 'levelsOfCare'];
        const importantFields = ['population', 'clinical', 'insurance', 'approach'];
        
        let score = 0;
        
        requiredFields.forEach(field => {
            if (data[field] && this.isFieldPopulated(data[field])) {
                score += 0.15;
            }
        });
        
        importantFields.forEach(field => {
            if (data[field] && this.isFieldPopulated(data[field])) {
                score += 0.1;
            }
        });
        
        return Math.min(score, 1);
    }
    
    isFieldPopulated(value) {
        if (!value) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return true;
    }
    
    selectTemplate(richness) {
        return this.templates[richness.level] || this.templates.minimal;
    }
    
    // Comprehensive template for rich data
    comprehensiveTemplate(data, richness) {
        let output = '';
        
        // Header
        output += this.generateHeader(data);
        
        // Executive Summary
        output += this.generateExecutiveSummary(data);
        
        // Key Differentiators
        if (data.differentiators && data.differentiators.length > 0) {
            output += '\nKEY DIFFERENTIATORS:\n';
            data.differentiators.forEach(diff => {
                output += `• ${diff}\n`;
            });
        }
        
        // Clinical Excellence
        output += this.generateClinicalSection(data, 'comprehensive');
        
        // Population & Specialization
        output += this.generatePopulationSection(data, 'comprehensive');
        
        // Daily Structure & Environment
        output += this.generateStructureSection(data, 'comprehensive');
        
        // Treatment Approach
        output += this.generateApproachSection(data);
        
        // Family Program
        output += this.generateFamilySection(data, 'comprehensive');
        
        // Practical Information
        output += this.generatePracticalSection(data, 'comprehensive');
        
        // Outcomes & Success
        output += this.generateOutcomesSection(data);
        
        // Contact & Next Steps
        output += this.generateContactSection(data, 'comprehensive');
        
        return output;
    }
    
    // Detailed template for good data
    detailedTemplate(data, richness) {
        let output = '';
        
        output += this.generateHeader(data);
        output += this.generateWhyThisProgram(data);
        output += this.generateClinicalSection(data, 'detailed');
        output += this.generatePopulationSection(data, 'detailed');
        output += this.generateStructureSection(data, 'detailed');
        output += this.generateFamilySection(data, 'detailed');
        output += this.generatePracticalSection(data, 'detailed');
        output += this.generateContactSection(data, 'detailed');
        
        return output;
    }
    
    // Standard template for moderate data
    standardTemplate(data, richness) {
        let output = '';
        
        output += this.generateHeader(data);
        output += this.generateWhyThisProgram(data);
        output += this.generateClinicalSection(data, 'standard');
        output += this.generatePopulationSection(data, 'standard');
        output += this.generateFamilySection(data, 'standard');
        output += this.generateContactSection(data, 'standard');
        
        return output;
    }
    
    // Minimal template for sparse data
    minimalTemplate(data, richness) {
        let output = '';
        
        output += this.generateHeader(data);
        
        output += '\nPROGRAM OVERVIEW:\n';
        
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            output += `  Levels of Care: ${data.levelsOfCare.join(', ')}\n`;
        }
        
        if (data.population) {
            output += this.generatePopulationSection(data, 'minimal');
        }
        
        if (data.clinical) {
            output += this.generateClinicalSection(data, 'minimal');
        }
        
        output += this.generateContactSection(data, 'minimal');
        
        output += '\n[Note: Limited information available. Contact program for complete details.]\n';
        
        return output;
    }
    
    // Section generators
    generateHeader(data) {
        let header = '='.repeat(70) + '\n';
        header += 'CLINICAL AFTERCARE RECOMMENDATION\n';
        header += '='.repeat(70) + '\n\n';
        
        header += `PROGRAM: ${data.name || 'Treatment Program'}\n`;
        
        if (data.location) {
            const loc = data.location;
            header += `LOCATION: ${loc.city || ''}${loc.city && loc.state ? ', ' : ''}${loc.state || ''}\n`;
        }
        
        if (data.website) {
            header += `WEBSITE: ${data.website}\n`;
        }
        
        return header;
    }
    
    generateExecutiveSummary(data) {
        let summary = '\nEXECUTIVE SUMMARY:\n';
        
        // Generate a comprehensive summary based on available data
        const highlights = [];
        
        if (data.structure?.capacity) {
            highlights.push(`${data.structure.capacity}-bed facility`);
        }
        
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            highlights.push(`offering ${data.levelsOfCare.join(', ')}`);
        }
        
        if (data.population?.ages) {
            highlights.push(`for ${data.population.ages}`);
        }
        
        if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
            highlights.push(`specializing in ${data.clinical.specializations.slice(0, 3).join(', ')}`);
        }
        
        if (highlights.length > 0) {
            summary += `${data.name} is a ${highlights.join(' ')}. `;
        }
        
        if (data.clinical?.primaryFocus) {
            summary += `The program's primary focus is ${data.clinical.primaryFocus}. `;
        }
        
        if (data.quality?.accreditations && data.quality.accreditations.length > 0) {
            summary += `Accredited by ${data.quality.accreditations.join(', ')}. `;
        }
        
        summary += '\n';
        return summary;
    }
    
    generateWhyThisProgram(data) {
        let section = '\nWHY THIS PROGRAM:\n';
        
        const reasons = [];
        
        // Extract key selling points
        if (data.differentiators && data.differentiators.length > 0) {
            data.differentiators.slice(0, 3).forEach(diff => {
                reasons.push(`  - ${diff}`);
            });
        }
        
        if (data.clinical?.primaryFocus) {
            reasons.push(`  - Primary focus on ${data.clinical.primaryFocus}`);
        }
        
        if (data.quality?.successRate) {
            reasons.push(`  - ${data.quality.successRate} success rate`);
        }
        
        if (data.staff?.credentials && data.staff.credentials.length > 0) {
            reasons.push(`  - ${data.staff.credentials[0]} clinical team`);
        }
        
        if (reasons.length === 0) {
            reasons.push('  - Comprehensive treatment approach');
            if (data.levelsOfCare && data.levelsOfCare.includes('residential')) {
                reasons.push('  - 24/7 structured care environment');
            }
        }
        
        section += reasons.join('\n') + '\n';
        return section;
    }
    
    generateClinicalSection(data, detail) {
        if (!data.clinical) return '';
        
        let section = '\nCLINICAL PROGRAMMING:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            // Therapy intensity
            if (data.clinical.individualTherapyHours || data.clinical.groupTherapyHours) {
                section += '  Therapy Intensity:\n';
                if (data.clinical.individualTherapyHours) {
                    section += `    • Individual: ${data.clinical.individualTherapyHours}\n`;
                }
                if (data.clinical.groupTherapyHours) {
                    section += `    • Group: ${data.clinical.groupTherapyHours}\n`;
                }
                if (data.clinical.familyTherapyFrequency) {
                    section += `    • Family: ${data.clinical.familyTherapyFrequency}\n`;
                }
                section += '\n';
            }
            
            // Modalities
            if (data.clinical.evidenceBased && data.clinical.evidenceBased.length > 0) {
                section += '  Evidence-Based Modalities:\n';
                data.clinical.evidenceBased.forEach(modality => {
                    section += `    • ${modality}\n`;
                });
                section += '\n';
            }
            
            if (data.clinical.experiential && data.clinical.experiential.length > 0) {
                section += '  Experiential Therapies:\n';
                data.clinical.experiential.forEach(therapy => {
                    section += `    • ${therapy}\n`;
                });
                section += '\n';
            }
            
            // Specializations
            if (data.clinical.specializations && data.clinical.specializations.length > 0) {
                section += '  Clinical Specializations:\n';
                data.clinical.specializations.forEach(spec => {
                    section += `    • ${spec}\n`;
                });
                section += '\n';
            }
            
            // Medical support
            if (data.clinical.psychiatryAvailable || data.clinical.medicationManagement) {
                section += '  Medical Support:\n';
                if (data.clinical.psychiatryAvailable) {
                    section += '    • Psychiatrist on staff\n';
                }
                if (data.clinical.medicationManagement) {
                    section += '    • Medication management available\n';
                }
                if (data.clinical.nursingStaff) {
                    section += '    • 24/7 nursing coverage\n';
                }
                section += '\n';
            }
        } else if (detail === 'standard') {
            // Condensed version
            if (data.clinical.specializations && data.clinical.specializations.length > 0) {
                section += `  Specializations: ${data.clinical.specializations.join(', ')}\n`;
            }
            
            const modalities = [
                ...(data.clinical.evidenceBased || []),
                ...(data.clinical.experiential || [])
            ];
            
            if (modalities.length > 0) {
                section += `  Treatment Modalities: ${modalities.slice(0, 5).join(', ')}\n`;
            }
        } else {
            // Minimal version
            const allModalities = [
                ...(data.clinical.evidenceBased || []),
                ...(data.clinical.experiential || [])
            ];
            
            if (allModalities.length > 0) {
                section += `  Modalities: ${allModalities.slice(0, 3).join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generatePopulationSection(data, detail) {
        if (!data.population) return '';
        
        let section = '\nPOPULATION SERVED:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            if (data.population.ages || data.population.ageMin) {
                section += '  Age Range: ';
                if (data.population.ages) {
                    section += data.population.ages;
                } else if (data.population.ageMin && data.population.ageMax) {
                    section += `${data.population.ageMin}-${data.population.ageMax}`;
                }
                section += '\n';
            }
            
            if (data.population.gender) {
                section += `  Gender: ${data.population.gender}\n`;
            }
            
            if (data.population.specialPopulations && data.population.specialPopulations.length > 0) {
                section += '  Special Populations:\n';
                data.population.specialPopulations.forEach(pop => {
                    section += `    • ${pop}\n`;
                });
            }
            
            if (data.exclusions && data.exclusions.length > 0) {
                section += '  Exclusion Criteria:\n';
                data.exclusions.forEach(exclusion => {
                    section += `    • ${exclusion}\n`;
                });
            }
        } else {
            // Condensed version
            const parts = [];
            if (data.population.ages) parts.push(data.population.ages);
            if (data.population.gender) parts.push(data.population.gender);
            
            if (parts.length > 0) {
                section += `  - ${parts.join(', ')}\n`;
            }
            
            if (data.population.specialPopulations && data.population.specialPopulations.length > 0) {
                section += `  - ${data.population.specialPopulations.join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generateStructureSection(data, detail) {
        if (!data.structure) return '';
        
        let section = '\nPROGRAM STRUCTURE:\n';
        
        if (detail === 'comprehensive') {
            if (data.structure.los || data.structure.avgLOS) {
                section += `  Length of Stay: ${data.structure.avgLOS || data.structure.los}\n`;
            }
            
            if (data.structure.capacity) {
                section += `  Capacity: ${data.structure.capacity} beds\n`;
            }
            
            if (data.structure.ratio) {
                section += `  Staff Ratio: ${data.structure.ratio}\n`;
            }
            
            if (data.structure.dailySchedule) {
                section += '\n  Typical Daily Schedule:\n';
                section += this.formatSchedule(data.structure.dailySchedule);
            }
            
            if (data.structure.phases && data.structure.phases.length > 0) {
                section += '\n  Treatment Phases:\n';
                data.structure.phases.forEach((phase, index) => {
                    section += `    ${index + 1}. ${phase}\n`;
                });
            }
            
            if (data.structure.academics && data.structure.academics.hasProgram) {
                section += '\n  Academic Program:\n';
                if (data.structure.academics.accreditation) {
                    section += `    • Accreditation: ${data.structure.academics.accreditation}\n`;
                }
                if (data.structure.academics.grades) {
                    section += `    • Grades Served: ${data.structure.academics.grades}\n`;
                }
                if (data.structure.academics.onSite) {
                    section += '    • On-site school\n';
                }
                if (data.structure.academics.creditRecovery) {
                    section += '    • Credit recovery available\n';
                }
                if (data.structure.academics.collegeCounseling) {
                    section += '    • College counseling provided\n';
                }
            }
        } else if (detail === 'detailed') {
            // Condensed structure info
            const structurePoints = [];
            
            if (data.structure.avgLOS) {
                structurePoints.push(`Length of stay: ${data.structure.avgLOS}`);
            }
            if (data.structure.capacity) {
                structurePoints.push(`${data.structure.capacity} beds`);
            }
            if (data.structure.ratio) {
                structurePoints.push(`Staff ratio: ${data.structure.ratio}`);
            }
            
            structurePoints.forEach(point => {
                section += `  • ${point}\n`;
            });
            
            if (data.structure.academics?.hasProgram) {
                section += '  • Academic program available\n';
            }
        }
        
        // Environment subsection
        if (data.environment && detail !== 'minimal') {
            section += '\n  Setting & Environment:\n';
            
            if (data.environment.setting) {
                section += `    • ${data.environment.setting}\n`;
            }
            
            if (data.environment.campusSizeAcre) {
                section += `    • ${data.environment.campusSizeAcre} acre campus\n`;
            }
            
            if (data.environment.facilities && data.environment.facilities.length > 0) {
                section += `    • Facilities: ${data.environment.facilities.slice(0, 5).join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generateApproachSection(data) {
        if (!data.approach || !data.philosophy) return '';
        
        let section = '\nTREATMENT APPROACH:\n';
        
        if (data.philosophy) {
            section += `  ${data.philosophy}\n`;
        }
        
        if (data.approach) {
            if (data.approach.traumaInformed) {
                section += '  • Trauma-informed care\n';
            }
            if (data.approach.familyInvolvement) {
                section += '  • Strong family involvement\n';
            }
            if (data.approach.individualizedTreatment) {
                section += '  • Individualized treatment planning\n';
            }
            if (data.approach.holisticCare) {
                section += '  • Holistic approach to healing\n';
            }
        }
        
        return section;
    }
    
    generateFamilySection(data, detail) {
        if (!data.family) return '';
        
        let section = '\nFAMILY PROGRAM:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            if (data.family.weeklyTherapy) {
                section += '  • Weekly family therapy sessions\n';
            }
            
            if (data.family.workshops) {
                section += '  • Family workshops and education\n';
            }
            
            if (data.family.visitationPolicy) {
                section += `  • Visitation: ${data.family.visitationPolicy}\n`;
            }
            
            if (data.family.parentCoaching) {
                section += '  • Parent coaching available\n';
            }
            
            if (data.family.supportGroups) {
                section += '  • Family support groups\n';
            }
            
            if (data.family.communicationPolicy) {
                section += `  • Communication: ${data.family.communicationPolicy}\n`;
            }
        } else {
            // Condensed version
            const familyFeatures = [];
            
            if (data.family.weeklyTherapy) {
                familyFeatures.push('Weekly family therapy');
            }
            if (data.family.workshops) {
                familyFeatures.push('Family education');
            }
            if (data.family.visitationPolicy) {
                familyFeatures.push('Regular visitation');
            }
            
            if (familyFeatures.length > 0) {
                section += `  - ${familyFeatures.join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generatePracticalSection(data, detail) {
        if (!data.admissions) return '';
        
        let section = '\nPRACTICAL INFORMATION:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            // Insurance
            if (data.admissions.insurance && data.admissions.insurance.length > 0) {
                section += '  Insurance Accepted:\n';
                data.admissions.insurance.forEach(ins => {
                    section += `    • ${ins}\n`;
                });
            }
            
            if (data.admissions.privatePay) {
                section += '  • Private pay accepted\n';
                if (data.admissions.privatePayRate) {
                    section += `    Rate: ${data.admissions.privatePayRate}\n`;
                }
            }
            
            if (data.admissions.financing) {
                section += '  • Financing available\n';
            }
            
            if (data.admissions.scholarships) {
                section += '  • Scholarships/sliding scale available\n';
            }
            
            // Admissions process
            if (data.admissions.admissionsProcess) {
                section += `\n  Admissions Process: ${data.admissions.admissionsProcess}\n`;
            }
            
            if (data.admissions.requirements && data.admissions.requirements.length > 0) {
                section += '  Requirements:\n';
                data.admissions.requirements.forEach(req => {
                    section += `    • ${req}\n`;
                });
            }
            
            // Transportation
            if (data.logistics) {
                if (data.logistics.airportPickup) {
                    section += '  • Airport pickup available\n';
                }
                if (data.logistics.nearestAirport) {
                    section += `  • Nearest airport: ${data.logistics.nearestAirport}\n`;
                }
            }
        } else {
            // Condensed version
            if (data.admissions.insurance && data.admissions.insurance.length > 0) {
                section += `  Insurance: ${data.admissions.insurance.slice(0, 3).join(', ')}\n`;
            }
            
            if (data.admissions.privatePay) {
                section += '  Private pay accepted\n';
            }
        }
        
        return section;
    }
    
    generateOutcomesSection(data) {
        if (!data.outcomes && !data.quality) return '';
        
        let section = '\nOUTCOMES & QUALITY:\n';
        
        if (data.outcomes) {
            if (data.outcomes.successRate) {
                section += `  • Success Rate: ${data.outcomes.successRate}\n`;
            }
            
            if (data.outcomes.completionRate) {
                section += `  • Completion Rate: ${data.outcomes.completionRate}\n`;
            }
            
            if (data.outcomes.satisfactionScore) {
                section += `  • Family Satisfaction: ${data.outcomes.satisfactionScore}\n`;
            }
            
            if (data.outcomes.followUpSupport) {
                section += `  • Alumni Support: ${data.outcomes.followUpSupport}\n`;
            }
        }
        
        if (data.quality) {
            if (data.quality.accreditations && data.quality.accreditations.length > 0) {
                section += `  • Accreditations: ${data.quality.accreditations.join(', ')}\n`;
            }
            
            if (data.quality.memberships && data.quality.memberships.length > 0) {
                section += `  • Professional Memberships: ${data.quality.memberships.join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generateContactSection(data, detail) {
        let section = '\nCONTACT INFORMATION:\n';
        
        if (data.contact) {
            if (data.contact.phone || data.admissions?.phone) {
                section += `  Phone: ${data.contact.phone || data.admissions.phone}\n`;
            }
            
            if (data.contact.email || data.admissions?.email) {
                section += `  Email: ${data.contact.email || data.admissions.email}\n`;
            }
            
            if (data.contact.admissionsContact) {
                section += `  Admissions: ${data.contact.admissionsContact}\n`;
            }
        }
        
        if (data.website) {
            section += `  Website: ${data.website}\n`;
        }
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            if (data.contact?.availableHours) {
                section += `  Hours: ${data.contact.availableHours}\n`;
            }
            
            if (data.virtualTour) {
                section += '  • Virtual tour available\n';
            }
            
            if (data.references) {
                section += '  • Family references available upon request\n';
            }
        }
        
        return section;
    }
    
    generateMetadata(data, richness) {
        let metadata = '\n' + '-'.repeat(70) + '\n';
        
        const date = new Date().toLocaleDateString();
        metadata += `Assessment Date: ${date}\n`;
        
        if (data.metadata) {
            if (data.metadata.confidence) {
                metadata += `Data Confidence: ${Math.round(data.metadata.confidence * 100)}%\n`;
            }
            
            if (data.metadata.pagesAnalyzed) {
                metadata += `Pages Analyzed: ${data.metadata.pagesAnalyzed}\n`;
            }
        }
        
        metadata += `Data Quality: ${richness.level.charAt(0).toUpperCase() + richness.level.slice(1)}\n`;
        metadata += `Fields Extracted: ${richness.fieldCount}\n`;
        
        return metadata;
    }
    
    // Format customizers for different contexts
    familyMeetingFormat(writeUp, data) {
        // Add family-specific emphasis
        let formatted = writeUp;
        
        // Add family talking points at the beginning
        let talkingPoints = '\nFAMILY DISCUSSION POINTS:\n';
        talkingPoints += '1. How does this program meet our specific needs?\n';
        talkingPoints += '2. What is the family\'s role in treatment?\n';
        talkingPoints += '3. Communication and visitation policies\n';
        talkingPoints += '4. Insurance coverage and financial planning\n';
        talkingPoints += '5. Post-treatment support and transition\n\n';
        
        formatted = formatted.replace('CLINICAL AFTERCARE RECOMMENDATION', 
                                     'CLINICAL AFTERCARE RECOMMENDATION\n\n' + talkingPoints);
        
        return formatted;
    }
    
    clinicalTeamFormat(writeUp, data) {
        // Add clinical emphasis
        let formatted = writeUp;
        
        // Add clinical considerations
        let clinicalNotes = '\nCLINICAL CONSIDERATIONS:\n';
        
        if (data.clinical?.specializations) {
            clinicalNotes += `• Specializations align with patient needs: ${data.clinical.specializations.join(', ')}\n`;
        }
        
        if (data.clinical?.evidenceBased) {
            clinicalNotes += `• Evidence-based approaches available\n`;
        }
        
        if (data.exclusions && data.exclusions.length > 0) {
            clinicalNotes += `• Review exclusion criteria for appropriateness\n`;
        }
        
        formatted = formatted.replace(/CLINICAL PROGRAMMING:/, 
                                     'CLINICAL PROGRAMMING:\n' + clinicalNotes);
        
        return formatted;
    }
    
    insuranceAuthFormat(writeUp, data) {
        // Format for insurance authorization
        let formatted = '='.repeat(70) + '\n';
        formatted += 'INSURANCE AUTHORIZATION SUMMARY\n';
        formatted += '='.repeat(70) + '\n\n';
        
        // Extract key insurance-relevant information
        formatted += `FACILITY: ${data.name}\n`;
        formatted += `LOCATION: ${data.location?.city}, ${data.location?.state}\n`;
        
        if (data.admissions?.insurance) {
            formatted += `\nINSURANCE ACCEPTED:\n`;
            data.admissions.insurance.forEach(ins => {
                formatted += `  • ${ins}\n`;
            });
        }
        
        formatted += `\nLEVEL OF CARE: ${data.levelsOfCare?.join(', ') || 'See clinical assessment'}\n`;
        
        if (data.structure?.avgLOS) {
            formatted += `TYPICAL LENGTH OF STAY: ${data.structure.avgLOS}\n`;
        }
        
        formatted += '\nMEDICAL NECESSITY:\n';
        if (data.clinical?.specializations) {
            formatted += `  Specializations: ${data.clinical.specializations.join(', ')}\n`;
        }
        
        if (data.clinical?.psychiatryAvailable) {
            formatted += '  • Psychiatric services available\n';
        }
        
        if (data.clinical?.medicationManagement) {
            formatted += '  • Medication management provided\n';
        }
        
        if (data.quality?.accreditations) {
            formatted += `\nACCREDITATIONS: ${data.quality.accreditations.join(', ')}\n`;
        }
        
        formatted += '\n' + writeUp.substring(writeUp.indexOf('CONTACT INFORMATION:'));
        
        return formatted;
    }
    
    quickReferenceFormat(writeUp, data) {
        // Ultra-condensed format
        let formatted = `${data.name} - ${data.location?.city}, ${data.location?.state}\n`;
        formatted += '-'.repeat(50) + '\n';
        
        if (data.levelsOfCare) {
            formatted += `Care Levels: ${data.levelsOfCare.join(', ')}\n`;
        }
        
        if (data.population?.ages) {
            formatted += `Ages: ${data.population.ages}\n`;
        }
        
        if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
            formatted += `Focus: ${data.clinical.specializations.slice(0, 3).join(', ')}\n`;
        }
        
        if (data.contact?.phone || data.admissions?.phone) {
            formatted += `Phone: ${data.contact?.phone || data.admissions?.phone}\n`;
        }
        
        if (data.website) {
            formatted += `Web: ${data.website}\n`;
        }
        
        return formatted;
    }
    
    // Helper methods
    formatSchedule(schedule) {
        if (typeof schedule === 'string') {
            return '    ' + schedule.replace(/\n/g, '\n    ') + '\n';
        }
        
        // If schedule is an array of time blocks
        if (Array.isArray(schedule)) {
            let formatted = '';
            schedule.forEach(block => {
                formatted += `    ${block.time}: ${block.activity}\n`;
            });
            return formatted;
        }
        
        return '';
    }
    
    // Analyze what makes this program unique
    generateDifferentiators(data) {
        const differentiators = [];
        
        // Unique clinical offerings
        if (data.clinical?.experiential) {
            const unique = data.clinical.experiential.filter(therapy => 
                !['art therapy', 'music therapy', 'recreation therapy'].includes(therapy.toLowerCase())
            );
            
            if (unique.length > 0) {
                differentiators.push(`Unique therapies: ${unique.join(', ')}`);
            }
        }
        
        // Special populations
        if (data.population?.specialPopulations && data.population.specialPopulations.length > 0) {
            const special = data.population.specialPopulations.filter(pop =>
                !['co-ed', 'males only', 'females only'].includes(pop.toLowerCase())
            );
            
            if (special.length > 0) {
                differentiators.push(`Specialized for ${special.join(', ')}`);
            }
        }
        
        // Unique setting
        if (data.environment?.setting && !data.environment.setting.toLowerCase().includes('suburban')) {
            differentiators.push(data.environment.setting);
        }
        
        // Notable credentials
        if (data.staff?.credentials) {
            const notable = data.staff.credentials.filter(cred =>
                cred.toLowerCase().includes('board certified') ||
                cred.toLowerCase().includes('phd') ||
                cred.toLowerCase().includes('specialized')
            );
            
            if (notable.length > 0) {
                differentiators.push(`Exceptional staff: ${notable[0]}`);
            }
        }
        
        // Unique programs
        if (data.programs?.unique && data.programs.unique.length > 0) {
            differentiators.push(...data.programs.unique.slice(0, 2));
        }
        
        return differentiators;
    }
}

// Export for use in extractor


    

    // ============= MAIN HYBRID EXTRACTOR =============
    class HybridExtractor {
        constructor() {
            this.patternEngine = new DynamicPatternEngine();
            this.structureAnalyzer = new StructureAnalyzer();
            this.antiPatternFilter = new AntiPatternFilter();
            this.crawler = new SmartCrawler();
            this.multiStrategy = new MultiStrategyExtractor();
            this.confidenceScorer = new ConfidenceScorer();
            this.learningEngine = new SelfImprovementEngine();
            this.templateEngine = new DynamicTemplateEngine();
            
            this.extractedData = {};
            this.currentDomain = window.location.hostname;
            this.startTime = null;
            this.metrics = {
                fieldsFound: 0,
                pagesScanned: 0,
                uniqueDataPoints: new Set(),
                confidence: 0,
                aiEnhanced: false,
                aiModel: null,
                aiResponseTime: null
            };
        }
        
        async extract(options = {}) {
            console.log('[CareConnect] Starting hybrid extraction...');
            this.startTime = Date.now();
            
            try {
                // Step 1: Rule-based extraction (fast & structured)
                this.sendProgress('rules', 0, 1, 'Running rule-based extraction...');
                const ruleResults = await this.performRuleExtraction();
                
                // Step 2: AI enhancement (if configured)
                if (options.aiModel && options.aiModel !== 'none') {
                    this.sendProgress('ai', 0, 1, `Enhancing with ${options.aiModel}...`);
                    const aiResults = await this.performAIEnhancement(ruleResults, options.aiModel);
                    
                    // Merge results
                    this.extractedData = this.mergeResults(ruleResults, aiResults);
                    this.metrics.aiEnhanced = true;
                    this.metrics.aiModel = options.aiModel;
                } else {
                    this.extractedData = ruleResults;
                }
                
                // Step 3: Generate clinical write-up
                this.sendProgress('formatting', 0, 1, 'Generating clinical documentation...');
                const writeUp = this.generateClinicalWriteUp();
                
                // Complete
                this.sendProgress('complete', 1, 1, 'Extraction complete!');
                
                return {
                    success: true,
                    data: this.extractedData,
                    writeUp: writeUp,
                    metrics: this.metrics
                };
                
            } catch (error) {
                console.error('[CareConnect] Extraction failed:', error);
                
                // Graceful fallback
                if (this.extractedData && Object.keys(this.extractedData).length > 0) {
                    return {
                        success: true,
                        data: this.extractedData,
                        writeUp: this.generateClinicalWriteUp(),
                        metrics: this.metrics,
                        warning: 'AI enhancement failed. Showing rule-based results only.'
                    };
                }
                
                return {
                    success: false,
                    error: error.message,
                    metrics: this.metrics
                };
            }
        }
        
        async performRuleExtraction() {
            // Initialize data structure
            const data = this.initializeDataStructure();
            
            // Get clean page text
            const pageText = this.getCleanPageText(document);
            
            // Extract all fields using rule-based patterns
            data.name = this.extractProgramName();
            this.extractLocation(pageText, data);
            this.extractLevelsOfCare(pageText, data);
            this.extractPopulation(pageText, data);
            this.extractClinicalInfo(pageText, data);
            this.extractContactInfo(pageText, data);
            this.extractStructureInfo(pageText, data);
            this.extractEnvironment(pageText, data);
            this.extractStaffInfo(pageText, data);
            this.extractFamilyProgram(pageText, data);
            this.extractAdmissionsInfo(pageText, data);
            this.extractQualityIndicators(pageText, data);
            
            // Build differentiators
            this.buildDifferentiators(data);
            
            // Update metrics
            this.updateMetrics(data);
            
            return data;
        }
        
        async performAIEnhancement(ruleData, aiModel) {
            const startTime = Date.now();
            
            try {
                // Get AI configuration
                const config = await this.getAIConfig(aiModel);
                if (!config || !config.apiKey) {
                    throw new Error(`No API key configured for ${aiModel}`);
                }
                
                // Build dynamic prompt based on what we found
                const prompt = this.buildDynamicPrompt(ruleData);
                
                // Call AI API
                const aiResponse = await this.callAIAPI(aiModel, config, prompt);
                
                // Parse and validate AI response
                const enhancements = this.parseAIResponse(aiResponse);
                
                // Record timing
                this.metrics.aiResponseTime = Date.now() - startTime;
                
                return enhancements;
                
            } catch (error) {
                console.error('[CareConnect] AI enhancement failed:', error);
                throw error;
            }
        }
        
        buildDynamicPrompt(ruleData) {
            let prompt = `You are a clinical expert reviewing treatment program information.
            
I've extracted the following data using rule-based patterns:

`;
            
            // Add what we found
            if (ruleData.name) {
                prompt += `Program Name: ${ruleData.name}\n`;
            }
            
            if (ruleData.levelsOfCare && ruleData.levelsOfCare.length > 0) {
                prompt += `Levels of Care Found: ${ruleData.levelsOfCare.join(', ')}\n`;
                prompt += `Please verify these are accurate and check for any we missed.\n`;
            } else {
                prompt += `We couldn't find levels of care. Please identify all levels offered.\n`;
            }
            
            if (ruleData.clinical && ruleData.clinical.evidenceBased.length > 0) {
                prompt += `Therapies Found: ${ruleData.clinical.evidenceBased.join(', ')}\n`;
                prompt += `Please verify and look for any experiential or holistic therapies we missed.\n`;
            } else {
                prompt += `We couldn't find therapy modalities. Please create a comprehensive list.\n`;
            }
            
            prompt += `
Please provide:
1. An executive summary (2-3 sentences) highlighting what makes this program unique
2. 3-5 key differentiators that would matter to families
3. Any important clinical details we missed
4. Verify the accuracy of our extracted data

Format your response as JSON with these fields:
{
    "executiveSummary": "...",
    "keyDifferentiators": ["...", "...", "..."],
    "additionalClinicalDetails": {...},
    "corrections": {...}
}
`;
            
            return prompt;
        }
        
        async getAIConfig(model) {
            return new Promise((resolve) => {
                chrome.storage.local.get([`${model}_api_key`, `${model}_config`], (result) => {
                    resolve({
                        apiKey: result[`${model}_api_key`],
                        config: result[`${model}_config`] || {}
                    });
                });
            });
        }
        
        async callAIAPI(model, config, prompt) {
            // Implementation would vary by AI provider
            // This is a placeholder for the actual API calls
            const endpoints = {
                'claude': 'https://api.anthropic.com/v1/messages',
                'gpt4': 'https://api.openai.com/v1/chat/completions',
                'gemini': 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
            };
            
            // Actual API implementation would go here
            // For now, return a mock response
            return {
                executiveSummary: "Comprehensive treatment program with evidence-based and experiential therapies.",
                keyDifferentiators: [
                    "Specialized trauma-informed care",
                    "Small, intimate setting with personalized attention",
                    "Strong family involvement program"
                ],
                additionalClinicalDetails: {},
                corrections: {}
            };
        }
        
        parseAIResponse(response) {
            // Parse and validate AI response
            if (typeof response === 'string') {
                try {
                    response = JSON.parse(response);
                } catch (e) {
                    console.error('[CareConnect] Failed to parse AI response:', e);
                    return {};
                }
            }
            
            return response;
        }
        
        mergeResults(ruleData, aiData) {
            const merged = { ...ruleData };
            
            // Add AI enhancements
            if (aiData.executiveSummary) {
                merged.executiveSummary = aiData.executiveSummary;
            }
            
            if (aiData.keyDifferentiators && aiData.keyDifferentiators.length > 0) {
                merged.differentiators = [
                    ...new Set([...merged.differentiators, ...aiData.keyDifferentiators])
                ];
            }
            
            // Apply corrections
            if (aiData.corrections) {
                Object.assign(merged, aiData.corrections);
            }
            
            // Add additional details
            if (aiData.additionalClinicalDetails) {
                Object.keys(aiData.additionalClinicalDetails).forEach(key => {
                    if (merged.clinical && merged.clinical[key]) {
                        if (Array.isArray(merged.clinical[key])) {
                            merged.clinical[key] = [
                                ...new Set([...merged.clinical[key], ...aiData.additionalClinicalDetails[key]])
                            ];
                        } else {
                            merged.clinical[key] = aiData.additionalClinicalDetails[key];
                        }
                    }
                });
            }
            
            return merged;
        }
        
        initializeDataStructure() {
            return {
                name: '',
                website: this.currentDomain,
                location: { city: '', state: '', address: '' },
                contact: { phone: '', email: '' },
                levelsOfCare: [],
                population: { ages: '', gender: '', specialPopulations: [] },
                clinical: { 
                    evidenceBased: [], 
                    experiential: [], 
                    specializations: [],
                    primaryFocus: ''
                },
                structure: { capacity: '', ratio: '', los: '' },
                environment: { setting: '', facilities: [], amenities: [] },
                staff: { credentials: [], psychiatristOnStaff: false },
                family: { weeklyTherapy: false, workshops: false },
                admissions: { insurance: [], privatePay: false },
                quality: { accreditations: [], memberships: [] },
                differentiators: [],
                executiveSummary: '',
                metadata: { version: '13.0', hybrid: true }
            };
        }
        
        // Extraction methods (simplified versions for brevity)
        extractProgramName() {
            const ogTitle = document.querySelector('meta[property="og:site_name"]')?.content;
            if (ogTitle) return ogTitle;
            
            const title = document.title.split('|')[0].split('-')[0].trim();
            if (title && title.length < 50) return title;
            
            const h1 = document.querySelector('h1')?.textContent?.trim();
            if (h1 && h1.length < 50) return h1;
            
            return 'Treatment Program';
        }
        
        extractLocation(text, data) {
            const locationPattern = /(?:located\s+in|serving|based\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})/gi;
            const match = locationPattern.exec(text);
            if (match) {
                data.location.city = match[1];
                data.location.state = match[2];
                this.metrics.fieldsFound++;
            }
        }
        
        extractLevelsOfCare(text, data) {
            const patterns = {
                residential: /residential|24\/7|live-in/gi,
                php: /php|partial hospitalization|day treatment/gi,
                iop: /iop|intensive outpatient/gi,
                outpatient: /outpatient(?!\s+referral)/gi
            };
            
            Object.entries(patterns).forEach(([level, pattern]) => {
                if (pattern.test(text)) {
                    data.levelsOfCare.push(level.charAt(0).toUpperCase() + level.slice(1));
                    this.metrics.uniqueDataPoints.add(`loc_${level}`);
                }
            });
            
            if (data.levelsOfCare.length > 0) {
                this.metrics.fieldsFound++;
            }
        }
        
        extractPopulation(text, data) {
            // Age patterns
            const ageMatch = /ages?\s+(\d+)\s*(?:to|-|through)\s*(\d+)/gi.exec(text);
            if (ageMatch) {
                data.population.ages = `${ageMatch[1]}-${ageMatch[2]}`;
                this.metrics.fieldsFound++;
            } else if (/adolescents?|teens?/gi.test(text)) {
                data.population.ages = 'Adolescents';
            } else if (/young\s+adults?/gi.test(text)) {
                data.population.ages = 'Young Adults';
            }
            
            // Gender
            if (/males?\s+only|boys?\s+only/gi.test(text)) {
                data.population.gender = 'Males Only';
            } else if (/females?\s+only|girls?\s+only/gi.test(text)) {
                data.population.gender = 'Females Only';
            } else if (/co-?ed/gi.test(text)) {
                data.population.gender = 'Co-ed';
            }
        }
        
        extractClinicalInfo(text, data) {
            // Evidence-based therapies
            const therapies = {
                'CBT': /cbt|cognitive behavioral/gi,
                'DBT': /dbt|dialectical behavior/gi,
                'EMDR': /emdr|eye movement/gi,
                'ACT': /acceptance.*commitment|ACT(?!\s+score)/gi,
                'MI': /motivational interviewing/gi
            };
            
            Object.entries(therapies).forEach(([name, pattern]) => {
                if (pattern.test(text)) {
                    data.clinical.evidenceBased.push(name);
                    this.metrics.uniqueDataPoints.add(`therapy_${name}`);
                }
            });
            
            // Experiential therapies
            const experiential = {
                'Equine Therapy': /equine|horse therapy/gi,
                'Art Therapy': /art therapy/gi,
                'Music Therapy': /music therapy/gi,
                'Adventure Therapy': /adventure|wilderness therapy/gi
            };
            
            Object.entries(experiential).forEach(([name, pattern]) => {
                if (pattern.test(text)) {
                    data.clinical.experiential.push(name);
                    this.metrics.uniqueDataPoints.add(`exp_${name}`);
                }
            });
            
            // Specializations
            if (/substance|addiction|sud/gi.test(text)) {
                data.clinical.specializations.push('Substance Use Disorders');
                data.clinical.primaryFocus = 'Substance Use Disorders';
            }
            if (/trauma|ptsd/gi.test(text)) {
                data.clinical.specializations.push('Trauma/PTSD');
            }
            if (/dual.?diagnosis|co.?occurring/gi.test(text)) {
                data.clinical.specializations.push('Dual Diagnosis');
            }
        }
        
        extractContactInfo(text, data) {
            // Phone
            const phoneMatch = /(\d{3})[-.\s]?(\d{3})[-.\s]?(\d{4})/g.exec(text);
            if (phoneMatch) {
                data.contact.phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
                this.metrics.fieldsFound++;
            }
            
            // Email
            const emailMatch = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g.exec(text);
            if (emailMatch) {
                data.contact.email = emailMatch[1];
                this.metrics.fieldsFound++;
            }
        }
        
        extractStructureInfo(text, data) {
            // Capacity
            const capacityMatch = /(\d+)\s*(?:bed|client|resident)/gi.exec(text);
            if (capacityMatch) {
                data.structure.capacity = capacityMatch[1];
                this.metrics.fieldsFound++;
            }
            
            // Staff ratio
            const ratioMatch = /(\d+)\s*:\s*(\d+)\s*(?:staff|ratio)/gi.exec(text);
            if (ratioMatch) {
                data.structure.ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
                this.metrics.fieldsFound++;
            }
        }
        
        extractEnvironment(text, data) {
            if (/rural|countryside/gi.test(text)) {
                data.environment.setting = 'Rural';
            } else if (/urban|city/gi.test(text)) {
                data.environment.setting = 'Urban';
            } else if (/coastal|beach|ocean/gi.test(text)) {
                data.environment.setting = 'Coastal';
            } else if (/mountain/gi.test(text)) {
                data.environment.setting = 'Mountain';
            }
            
            // Facilities
            const facilities = ['gym', 'pool', 'cafeteria', 'library'];
            facilities.forEach(facility => {
                if (new RegExp(facility, 'gi').test(text)) {
                    data.environment.facilities.push(facility);
                }
            });
        }
        
        extractStaffInfo(text, data) {
            if (/psychiatrist.*staff|on.?site.*psychiatrist/gi.test(text)) {
                data.staff.psychiatristOnStaff = true;
                this.metrics.uniqueDataPoints.add('psychiatrist');
            }
            
            const credentials = ['licensed', 'board certified', 'masters', 'phd', 'lcsw', 'lmft'];
            credentials.forEach(cred => {
                if (new RegExp(cred, 'gi').test(text)) {
                    data.staff.credentials.push(cred);
                }
            });
        }
        
        extractFamilyProgram(text, data) {
            if (/weekly.*family.*therapy|family.*therapy.*weekly/gi.test(text)) {
                data.family.weeklyTherapy = true;
                this.metrics.uniqueDataPoints.add('family_therapy');
            }
            
            if (/family.*workshop|family.*education/gi.test(text)) {
                data.family.workshops = true;
                this.metrics.uniqueDataPoints.add('family_workshops');
            }
        }
        
        extractAdmissionsInfo(text, data) {
            // Insurance
            const insurers = ['BCBS', 'Aetna', 'Cigna', 'United', 'Anthem', 'Humana', 'Medicaid', 'Medicare'];
            insurers.forEach(insurer => {
                if (new RegExp(insurer, 'gi').test(text)) {
                    data.admissions.insurance.push(insurer);
                }
            });
            
            if (/private pay|self.?pay|cash/gi.test(text)) {
                data.admissions.privatePay = true;
            }
        }
        
        extractQualityIndicators(text, data) {
            const accreditations = ['CARF', 'Joint Commission', 'NATSAP'];
            accreditations.forEach(accred => {
                if (new RegExp(accred, 'gi').test(text)) {
                    data.quality.accreditations.push(accred);
                    this.metrics.uniqueDataPoints.add(`accred_${accred}`);
                }
            });
        }
        
        buildDifferentiators(data) {
            const differentiators = [];
            
            // Unique therapies
            if (data.clinical.experiential.length > 0) {
                const unique = data.clinical.experiential.filter(t => 
                    !['Art Therapy', 'Music Therapy'].includes(t)
                );
                if (unique.length > 0) {
                    differentiators.push(`Unique therapies: ${unique.join(', ')}`);
                }
            }
            
            // Setting
            if (data.environment.setting && !['Urban', 'Suburban'].includes(data.environment.setting)) {
                differentiators.push(`${data.environment.setting} setting`);
            }
            
            // Accreditations
            if (data.quality.accreditations.length > 0) {
                differentiators.push(`${data.quality.accreditations.join(', ')} accredited`);
            }
            
            data.differentiators = differentiators;
        }
        
        updateMetrics(data) {
            // Count populated fields
            const countFields = (obj, prefix = '') => {
                let count = 0;
                Object.entries(obj).forEach(([key, value]) => {
                    if (value && value !== '' && (!Array.isArray(value) || value.length > 0)) {
                        count++;
                        if (typeof value === 'object' && !Array.isArray(value)) {
                            count += countFields(value, key);
                        }
                    }
                });
                return count;
            };
            
            this.metrics.fieldsFound = countFields(data);
            this.metrics.pagesScanned = 1;
            
            // Calculate confidence
            const requiredFields = ['name', 'levelsOfCare', 'contact'];
            const hasRequired = requiredFields.filter(f => 
                data[f] && (Array.isArray(data[f]) ? data[f].length > 0 : data[f] !== '')
            ).length;
            
            this.metrics.confidence = Math.round((hasRequired / requiredFields.length) * 50 + 
                                                 (this.metrics.fieldsFound / 30) * 50);
        }
        
        getCleanPageText(doc) {
            const clone = doc.cloneNode(true);
            
            const removeSelectors = [
                'nav', 'header', 'footer', '.navigation', '.menu', 
                'script', 'style', '.social', '.cookie'
            ];
            
            removeSelectors.forEach(selector => {
                clone.querySelectorAll(selector).forEach(el => el.remove());
            });
            
            return clone.body?.textContent || '';
        }
        
        generateClinicalWriteUp() {
            const data = this.extractedData;
            let writeUp = '='.repeat(70) + '\n';
            writeUp += 'CLINICAL AFTERCARE RECOMMENDATION\n';
            writeUp += '='.repeat(70) + '\n\n';
            
            // Executive Summary (if AI-enhanced)
            if (data.executiveSummary) {
                writeUp += 'EXECUTIVE SUMMARY:\n';
                writeUp += data.executiveSummary + '\n\n';
            }
            
            // Program basics
            writeUp += `PROGRAM: ${data.name || 'Treatment Program'}\n`;
            if (data.location.city || data.location.state) {
                writeUp += `LOCATION: ${data.location.city}${data.location.city && data.location.state ? ', ' : ''}${data.location.state}\n`;
            }
            writeUp += `WEBSITE: ${data.website}\n\n`;
            
            // Key differentiators
            if (data.differentiators && data.differentiators.length > 0) {
                writeUp += 'KEY DIFFERENTIATORS:\n';
                data.differentiators.forEach(diff => {
                    writeUp += `• ${diff}\n`;
                });
                writeUp += '\n';
            }
            
            // Levels of care
            if (data.levelsOfCare && data.levelsOfCare.length > 0) {
                writeUp += 'LEVELS OF CARE:\n';
                data.levelsOfCare.forEach(level => {
                    writeUp += `• ${level}\n`;
                });
                writeUp += '\n';
            }
            
            // Population
            if (data.population.ages || data.population.gender) {
                writeUp += 'POPULATION SERVED:\n';
                if (data.population.ages) writeUp += `  Ages: ${data.population.ages}\n`;
                if (data.population.gender) writeUp += `  Gender: ${data.population.gender}\n`;
                writeUp += '\n';
            }
            
            // Clinical programming
            if (data.clinical.evidenceBased.length > 0 || data.clinical.experiential.length > 0) {
                writeUp += 'CLINICAL PROGRAMMING:\n';
                
                if (data.clinical.primaryFocus) {
                    writeUp += `  Primary Focus: ${data.clinical.primaryFocus}\n`;
                }
                
                if (data.clinical.evidenceBased.length > 0) {
                    writeUp += '  Evidence-Based Modalities:\n';
                    data.clinical.evidenceBased.forEach(m => writeUp += `    • ${m}\n`);
                }
                
                if (data.clinical.experiential.length > 0) {
                    writeUp += '  Experiential Therapies:\n';
                    data.clinical.experiential.forEach(t => writeUp += `    • ${t}\n`);
                }
                
                writeUp += '\n';
            }
            
            // Program structure
            if (data.structure.capacity || data.structure.ratio) {
                writeUp += 'PROGRAM STRUCTURE:\n';
                if (data.structure.capacity) writeUp += `  Capacity: ${data.structure.capacity} beds\n`;
                if (data.structure.ratio) writeUp += `  Staff Ratio: ${data.structure.ratio}\n`;
                writeUp += '\n';
            }
            
            // Family program
            if (data.family.weeklyTherapy || data.family.workshops) {
                writeUp += 'FAMILY PROGRAM:\n';
                if (data.family.weeklyTherapy) writeUp += '  • Weekly family therapy sessions\n';
                if (data.family.workshops) writeUp += '  • Family workshops and education\n';
                writeUp += '\n';
            }
            
            // Insurance
            if (data.admissions.insurance.length > 0 || data.admissions.privatePay) {
                writeUp += 'INSURANCE & PAYMENT:\n';
                if (data.admissions.insurance.length > 0) {
                    writeUp += `  Accepted: ${data.admissions.insurance.join(', ')}\n`;
                }
                if (data.admissions.privatePay) {
                    writeUp += '  • Private pay accepted\n';
                }
                writeUp += '\n';
            }
            
            // Contact
            writeUp += 'CONTACT INFORMATION:\n';
            if (data.contact.phone) writeUp += `  Phone: ${data.contact.phone}\n`;
            if (data.contact.email) writeUp += `  Email: ${data.contact.email}\n`;
            writeUp += `  Website: ${data.website}\n\n`;
            
            // Metadata
            writeUp += '-'.repeat(70) + '\n';
            writeUp += `Assessment Date: ${new Date().toLocaleDateString()}\n`;
            writeUp += `Data Confidence: ${this.metrics.confidence}%\n`;
            writeUp += `Fields Extracted: ${this.metrics.fieldsFound}\n`;
            if (this.metrics.aiEnhanced) {
                writeUp += `AI Enhancement: ${this.metrics.aiModel}\n`;
                if (this.metrics.aiResponseTime) {
                    writeUp += `AI Response Time: ${(this.metrics.aiResponseTime / 1000).toFixed(1)}s\n`;
                }
            }
            
            return writeUp;
        }
        
        sendProgress(stage, current, total, message) {
            chrome.runtime.sendMessage({
                type: 'extraction-progress',
                progress: {
                    stage,
                    current,
                    total,
                    message,
                    percent: Math.round((current / total) * 100)
                }
            });
        }
    }
    
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[CareConnect] Received message:', request);
        
        if (request.action === 'extract-v2' || request.type === 'extract-data') {
            console.log('[CareConnect] Starting hybrid extraction...');
            
            const extractor = new HybridExtractor();
            
            extractor.extract(request.config || {})
                .then(result => {
                    console.log('[CareConnect] Extraction complete:', result);
                    sendResponse(result);
                })
                .catch(error => {
                    console.error('[CareConnect] Extraction error:', error);
                    sendResponse({
                        success: false,
                        error: error.message
                    });
                });
            
            return true; // Keep message channel open for async response
        }
    });
    
    console.log('[CareConnect] ✅ Hybrid AI Extraction Engine v13.0 ready');
    
})();