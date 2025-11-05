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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        UNIVERSAL_STRUCTURES,
        FIELD_SYNONYMS,
        SITE_FINGERPRINTS,
        StructureAnalyzer
    };
}
