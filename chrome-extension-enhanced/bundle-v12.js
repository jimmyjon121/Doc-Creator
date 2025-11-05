// bundle-v12.js - Properly bundled v12.0 Universal Extraction System
// This bundles all the v12 modules into a single working content script

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__CC_UNIVERSAL_V12__) {
        return;
    }
    window.__CC_UNIVERSAL_V12__ = true;
    
    console.log('[CareConnect] Loading Universal Extractor v12.0...');
    
    // ============= PATTERN ENGINE MODULE =============
    class DynamicPatternEngine {
        constructor() {
            this.patterns = new Map();
            this.contextClues = new Map();
            this.siteStructures = new Map();
            this.confidenceThresholds = new Map();
            this.patternSuccess = new Map();
            
            this.initializeBasePatterns();
        }
        
        initializeBasePatterns() {
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
        
        learnPattern(field, text, context, confidence) {
            const pattern = this.generatePattern(text, context);
            
            if (!this.patterns.has(field)) {
                this.patterns.set(field, new Set());
            }
            
            this.patterns.get(field).add(pattern);
            this.adjustConfidence(field, pattern, confidence);
            this.updateContextClues(field, context);
        }
        
        generatePattern(text, context) {
            const pattern = new AdaptivePattern(text, context);
            pattern.analyze();
            return pattern;
        }
        
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
            
            stats.avgConfidence = (stats.avgConfidence * (stats.successes + stats.failures - 1) + confidence) / 
                                 (stats.successes + stats.failures);
        }
        
        updateContextClues(field, context) {
            if (!this.contextClues.has(field)) {
                this.contextClues.set(field, new Map());
            }
            
            const clues = this.contextClues.get(field);
            
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
        
        getBestPatterns(field, limit = 5) {
            const successMap = this.patternSuccess.get(field);
            if (!successMap) return [];
            
            const patterns = Array.from(this.patterns.get(field) || []);
            
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
    }
    
    class AdaptivePattern {
        constructor(text, context) {
            this.originalText = text;
            this.context = context;
            this.regex = null;
            this.flexibility = 0.5;
            this.variations = [];
        }
        
        analyze() {
            this.identifyKeyElements();
            this.generateVariations();
            this.buildRegex();
        }
        
        identifyKeyElements() {
            this.elements = {
                numbers: this.originalText.match(/\d+/g) || [],
                keywords: this.extractKeywords(),
                separators: this.identifySeparators(),
                structure: this.analyzeStructure()
            };
        }
        
        extractKeywords() {
            const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);
            const words = this.originalText.toLowerCase().match(/\b\w+\b/g) || [];
            
            return words.filter(word => 
                !commonWords.has(word) && 
                word.length > 2
            );
        }
        
        identifySeparators() {
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
            return {
                hasNumbers: /\d/.test(this.originalText),
                hasParentheses: /\(.*\)/.test(this.originalText),
                hasList: /(?:,|;|\|)/.test(this.originalText),
                isRange: /\d+\s*(?:-|to|through)\s*\d+/.test(this.originalText),
                hasPrefix: /^(?:\w+:|\w+\s*-\s*)/.test(this.originalText)
            };
        }
        
        generateVariations() {
            this.variations = [];
            
            this.variations.push(this.escapeRegex(this.originalText));
            
            const flexibleWhitespace = this.originalText.replace(/\s+/g, '\\s+');
            this.variations.push(flexibleWhitespace);
            
            if (this.elements.structure.hasParentheses) {
                const withoutParens = this.originalText.replace(/\s*\([^)]*\)\s*/g, '\\s*(?:\\([^)]*\\))?\\s*');
                this.variations.push(withoutParens);
            }
            
            if (this.elements.structure.hasNumbers) {
                const numberFlex = this.originalText.replace(/\d+/g, '\\d+');
                this.variations.push(numberFlex);
            }
        }
        
        buildRegex() {
            if (this.variations.length === 1) {
                this.regex = new RegExp(this.variations[0], 'gi');
            } else {
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
    
    // ============= UNIVERSAL STRUCTURES MODULE =============
    const UNIVERSAL_STRUCTURES = {
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
        
        contentBlocks: {
            lists: /(?:<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>|(?:^|\n)\s*[•▪►✓◆→▸※❖★☆\-\*]\s*.+(?:\n\s*[•▪►✓◆→▸※❖★☆\-\*]\s*.+)*)/gim,
            definitions: /(?:^|\n)([A-Z][A-Za-z\s&\-]+):\s*([^\n]+(?:\n(?!\s*[A-Z][A-Za-z\s&\-]+:)[^\n]+)*)/gm,
            schedules: /(\d{1,2}:\d{2}\s*(?:am|pm|AM|PM|a\.m\.|p\.m\.))[\s\S]+?(?=\d{1,2}:\d{2}\s*(?:am|pm|AM|PM|a\.m\.|p\.m\.)|$|\n\n)/gi,
            features: /(?:we\s+(?:offer|provide|feature|include)|our\s+(?:program|facility|center)\s+(?:includes|features|offers|provides))[\s\S]{10,200}?(?:\.|:|$)/gi,
            services: /(?:services\s+include|we\s+treat|specializing\s+in|specialized\s+(?:in|for))[\s\S]{10,300}?(?:\.|;|:|\n\n|$)/gi
        },
        
        sectionHeaders: {
            about: /^(?:about(?:\s+us)?|who\s+we\s+are|our\s+(?:story|mission|philosophy))$/i,
            clinical: /^(?:clinical\s+(?:services|programming)|treatment\s+(?:approach|modalities)|therapeutic\s+services)$/i,
            programs: /^(?:programs?|levels?\s+of\s+care|what\s+we\s+offer|our\s+services)$/i,
            admissions: /^(?:admissions?|intake|getting\s+started|enrollment|how\s+to\s+apply)$/i,
            insurance: /^(?:insurance|payment\s+options?|financial|cost|pricing|coverage)$/i,
            contact: /^(?:contact(?:\s+us)?|get\s+in\s+touch|reach\s+out|location|directions)$/i
        }
    };
    
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
        }
    };
    
    // ============= EXTRACTION PATTERNS MODULE =============
    const EXTRACTION_PATTERNS = {
        levelsOfCare: {
            residential: /(?:offer|provid|deliver|specializ|focus)\w*\s+(?:in\s+)?residential(?:\s+treatment)?(?!\s+aftercare)/gi,
            php: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?(?:PHP|partial\s+hospitalization)(?!\s+referral)/gi,
            iop: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?(?:IOP|intensive\s+outpatient)(?!\s+referral)/gi,
            outpatient: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?outpatient(?:\s+(?:treatment|therapy|services))?(?!\s+referral)/gi,
            detox: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?(?:detox|detoxification)(?:\s+services)?/gi,
            soberLiving: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?sober\s+living/gi
        },
        
        population: {
            maleOnly: /(?:exclusively?\s+)?(?:males?\s+only|boys?\s+only|young\s+men\s+only|all[\-\s]male)/gi,
            femaleOnly: /(?:exclusively?\s+)?(?:females?\s+only|girls?\s+only|young\s+women\s+only|all[\-\s]female)/gi,
            ages: /(?:ages?|serving)\s+(\d+)\s*(?:to|-|through)\s*(\d+)|(?:adolescents?|teens?|young\s+adults?)/gi,
            lgbtq: /LGBTQ(?:\+)?[\s\-](?:friendly|affirming|specialization)/gi
        },
        
        evidenceBased: {
            cbt: /(?:cognitive[\s\-]behavioral\s+therapy|CBT(?!\s*oil))/gi,
            dbt: /(?:dialectical[\s\-]behavior\s+therapy|DBT(?!\s*skills\s+only))/gi,
            emdr: /(?:eye\s+movement|EMDR)/gi,
            act: /(?:acceptance\s+(?:and\s+)?commitment\s+therapy|ACT(?:\s+therapy)?(?!\s+score))/gi,
            mi: /(?:motivational\s+interviewing|MI(?:\s+therapy)?)/gi,
            tfCbt: /(?:trauma[\s\-]focused\s+CBT|TF[\s\-]CBT)/gi,
            cpt: /(?:cognitive\s+processing\s+therapy|CPT)/gi,
            pe: /(?:prolonged\s+exposure|PE\s+therapy)/gi,
            seeking: /(?:seeking\s+safety)/gi,
            matrix: /(?:matrix\s+model)/gi,
            smart: /(?:SMART\s+recovery)/gi,
            twelveStep: /(?:12[\s\-]step|twelve[\s\-]step)/gi
        },
        
        experiential: {
            equine: /(?:equine|horse)[\s\-](?:therapy|assisted)/gi,
            adventure: /adventure[\s\-](?:therapy|based)/gi,
            wilderness: /wilderness[\s\-](?:therapy|programming)/gi,
            art: /art[\s\-]therapy/gi,
            music: /music[\s\-]therapy/gi,
            drama: /(?:drama|psychodrama)[\s\-]therapy/gi,
            recreation: /recreational?\s+therapy/gi,
            yoga: /yoga[\s\-](?:therapy|sessions|practice)/gi,
            mindfulness: /mindfulness[\s\-](?:based|therapy|practice)/gi,
            somatic: /somatic[\s\-](?:therapy|experiencing)/gi,
            neurofeedback: /neurofeedback/gi,
            biofeedback: /biofeedback/gi
        },
        
        specializations: {
            sud: /(?:substance\s+(?:use\s+)?disorders?|SUD|addiction\s+treatment|chemical\s+dependency)/gi,
            trauma: /(?:trauma|PTSD|post[\s\-]traumatic)/gi,
            anxiety: /anxiety\s+disorders?/gi,
            depression: /(?:depression|major\s+depressive|mood\s+disorders?)/gi,
            bipolar: /bipolar\s+disorders?/gi,
            adhd: /(?:ADHD|attention[\s\-]deficit)/gi,
            autism: /(?:autism|ASD|asperger)/gi,
            ocd: /(?:OCD|obsessive[\s\-]compulsive)/gi,
            eatingDisorders: /(?:eating\s+disorders?|anorexia|bulimia|ARFID)/gi,
            selfHarm: /(?:self[\s\-]harm|self[\s\-]injury|NSSI)/gi,
            sexualTrauma: /(?:sexual\s+(?:trauma|abuse)|CSA)/gi,
            adoption: /adoption[\s\-](?:issues|trauma)/gi,
            attachment: /(?:attachment\s+(?:disorders?|issues)|RAD)/gi,
            dualDiagnosis: /(?:dual[\s\-]diagnosis|co[\s\-]occurring)/gi
        },
        
        environment: {
            rural: /(?:rural|countryside|country)\s+(?:setting|location|campus)/gi,
            urban: /(?:urban|city|metropolitan)\s+(?:setting|location|campus)/gi,
            suburban: /(?:suburban|residential\s+area)\s+(?:setting|location|campus)/gi,
            mountain: /(?:mountain|alpine|high[\s\-]altitude)\s+(?:setting|location|campus|views?)/gi,
            coastal: /(?:coastal|beach|ocean|waterfront|river|lagoon)\s+(?:setting|location|campus|views?)/gi,
            desert: /(?:desert|arid)\s+(?:setting|location|campus)/gi,
            ranch: /(?:ranch|farm|equestrian)\s+(?:setting|property|campus)/gi,
            campus: /(?:\d+[\s\-])?acre\s+campus|\d+\s+acres?/gi
        },
        
        structure: {
            capacity: /(?:capacity|serves?|beds?)\s*(?:of\s+)?(?:up\s+to\s+)?(\d+)\s+(?:clients?|students?|residents?)/gi,
            ratio: /(\d+)[\s:](?:to|:)[\s:](\d+)\s+(?:staff|client|student)[\s\-]ratio/gi,
            los: /(?:length\s+of\s+stay|LOS|typical\s+stay|average\s+stay)[\s:]*(?:is\s+)?(?:typically\s+)?(?:(\d+)[\s\-](?:to|through)[\s\-])?(\d+)\s*(?:days?|weeks?|months?)/gi,
            phases: /(?:phase|level|stage)\s+(?:system|program|approach)/gi,
            groupSize: /group\s+size[\s:]*(?:of\s+)?(?:up\s+to\s+)?(\d+)/gi
        },
        
        contact: {
            phone: /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})(?:\s*(?:ext|x|extension)\.?\s*(\d+))?/g,
            email: /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
            address: /(\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Parkway|Pkwy)),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})\s*(\d{5}(?:-\d{4})?)?/g
        }
    };
    
    // ============= MAIN EXTRACTOR MODULE =============
    class UniversalExtractor {
        constructor() {
            this.patternEngine = new DynamicPatternEngine();
            this.extractedData = {};
            this.currentDomain = window.location.hostname;
            this.startTime = null;
            this.metrics = {
                fieldsFound: 0,
                pagesScanned: 0,
                uniqueDataPoints: new Set(),
                confidence: 0
            };
        }
        
        async extract(options = {}) {
            console.log('[CareConnect] Starting universal extraction...');
            this.startTime = Date.now();
            
            try {
                // Initialize data structure
                this.extractedData = this.initializeDataStructure();
                
                // Extract from current page
                this.sendProgress('extraction', 0, 1, 'Extracting from current page...');
                await this.extractFromPage(document, window.location.href);
                
                // Calculate confidence
                this.calculateConfidence();
                
                // Generate write-up
                const writeUp = this.generateWriteUp();
                
                // Complete
                this.sendProgress('complete', 1, 1, 'Extraction complete!');
                
                return {
                    success: true,
                    data: this.extractedData,
                    writeUp: writeUp,
                    metrics: {
                        fieldsFound: this.metrics.fieldsFound,
                        pagesScanned: this.metrics.pagesScanned,
                        uniqueDataPoints: this.metrics.uniqueDataPoints.size,
                        confidence: Math.round(this.metrics.confidence * 100)
                    }
                };
                
            } catch (error) {
                console.error('[CareConnect] Extraction failed:', error);
                return {
                    success: false,
                    error: error.message,
                    partialData: this.extractedData,
                    metrics: this.metrics
                };
            }
        }
        
        initializeDataStructure() {
            return {
                name: '',
                website: this.currentDomain,
                location: {
                    city: '',
                    state: '',
                    address: ''
                },
                contact: {
                    phone: '',
                    email: '',
                    admissionsContact: ''
                },
                levelsOfCare: [],
                population: {
                    ages: '',
                    ageMin: null,
                    ageMax: null,
                    gender: '',
                    specialPopulations: []
                },
                clinical: {
                    evidenceBased: [],
                    experiential: [],
                    specializations: [],
                    primaryFocus: '',
                    individualTherapyHours: '',
                    groupTherapyHours: '',
                    familyTherapyFrequency: '',
                    psychiatryAvailable: false,
                    medicationManagement: false
                },
                structure: {
                    capacity: '',
                    ratio: '',
                    los: '',
                    avgLOS: '',
                    phases: [],
                    groupSize: '',
                    dailySchedule: ''
                },
                environment: {
                    setting: '',
                    campusSizeAcre: '',
                    facilities: [],
                    amenities: []
                },
                staff: {
                    credentials: [],
                    leadership: [],
                    psychiatristOnStaff: false,
                    nursingStaff: false
                },
                family: {
                    weeklyTherapy: false,
                    workshops: false,
                    visitationPolicy: '',
                    parentCoaching: false
                },
                admissions: {
                    insurance: [],
                    privatePay: false,
                    financing: false,
                    scholarships: false,
                    admissionsProcess: '',
                    requirements: [],
                    exclusions: []
                },
                quality: {
                    accreditations: [],
                    memberships: [],
                    awards: []
                },
                differentiators: [],
                metadata: {
                    extractionTime: null,
                    pagesAnalyzed: 0,
                    confidence: 0,
                    version: '12.0'
                }
            };
        }
        
        async extractFromPage(doc, url) {
            console.log(`[CareConnect] Extracting from ${url}`);
            
            // Get page text
            const pageText = this.getCleanPageText(doc);
            
            // Extract program name
            this.extractedData.name = this.extractProgramName(doc);
            
            // Extract location
            this.extractLocation(pageText);
            
            // Extract levels of care
            this.extractLevelsOfCare(pageText);
            
            // Extract population
            this.extractPopulation(pageText);
            
            // Extract clinical info
            this.extractClinicalInfo(pageText);
            
            // Extract contact info
            this.extractContactInfo(pageText);
            
            // Extract structure info
            this.extractStructureInfo(pageText);
            
            // Extract environment
            this.extractEnvironment(pageText);
            
            // Extract staff info
            this.extractStaffInfo(pageText);
            
            // Extract family program
            this.extractFamilyProgram(pageText);
            
            // Extract insurance/admissions
            this.extractAdmissionsInfo(pageText);
            
            // Extract quality indicators
            this.extractQualityIndicators(pageText);
            
            // Build differentiators
            this.buildDifferentiators();
            
            // Update metrics
            this.metrics.pagesScanned++;
            this.updateMetrics();
        }
        
        extractProgramName(doc) {
            // Try meta tags first
            const ogTitle = doc.querySelector('meta[property="og:site_name"]')?.content;
            if (ogTitle) return ogTitle;
            
            // Try JSON-LD
            const jsonLd = doc.querySelector('script[type="application/ld+json"]');
            if (jsonLd) {
                try {
                    const data = JSON.parse(jsonLd.textContent);
                    if (data.name) return data.name;
                    if (data['@graph']) {
                        const org = data['@graph'].find(item => item['@type'] === 'Organization');
                        if (org?.name) return org.name;
                    }
                } catch (e) {}
            }
            
            // Try title
            const title = doc.title.split('|')[0].split('-')[0].trim();
            if (title && title.length < 50) return title;
            
            // Try H1
            const h1 = doc.querySelector('h1')?.textContent?.trim();
            if (h1 && h1.length < 50) return h1;
            
            return 'Treatment Program';
        }
        
        extractLocation(text) {
            // City, State pattern
            const locationPattern = /(?:located\s+in|serving|based\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2}|\w+)/gi;
            const match = locationPattern.exec(text);
            if (match) {
                this.extractedData.location.city = match[1];
                this.extractedData.location.state = match[2].length === 2 ? match[2] : this.getStateAbbr(match[2]);
                this.metrics.fieldsFound++;
            }
            
            // Address pattern
            const addressMatch = EXTRACTION_PATTERNS.contact.address.exec(text);
            if (addressMatch) {
                if (!this.extractedData.location.city) this.extractedData.location.city = addressMatch[2];
                if (!this.extractedData.location.state) this.extractedData.location.state = addressMatch[3];
                this.extractedData.location.address = addressMatch[0];
                this.metrics.fieldsFound++;
            }
        }
        
        extractLevelsOfCare(text) {
            const levels = [];
            
            for (const [level, pattern] of Object.entries(EXTRACTION_PATTERNS.levelsOfCare)) {
                if (pattern.test(text)) {
                    const formatted = level.charAt(0).toUpperCase() + level.slice(1);
                    levels.push(formatted.replace(/([A-Z])/g, ' $1').trim());
                    this.metrics.uniqueDataPoints.add(`loc_${level}`);
                }
            }
            
            if (levels.length > 0) {
                this.extractedData.levelsOfCare = levels;
                this.metrics.fieldsFound++;
            }
        }
        
        extractPopulation(text) {
            // Gender
            if (EXTRACTION_PATTERNS.population.maleOnly.test(text)) {
                this.extractedData.population.gender = 'Males Only';
                this.metrics.uniqueDataPoints.add('pop_male_only');
            } else if (EXTRACTION_PATTERNS.population.femaleOnly.test(text)) {
                this.extractedData.population.gender = 'Females Only';
                this.metrics.uniqueDataPoints.add('pop_female_only');
            } else if (/co[\-\s]?ed/gi.test(text)) {
                this.extractedData.population.gender = 'Co-ed';
                this.metrics.uniqueDataPoints.add('pop_coed');
            }
            
            // Ages
            const ageMatch = /ages?\s+(\d+)\s*(?:to|-|through)\s*(\d+)/gi.exec(text);
            if (ageMatch) {
                this.extractedData.population.ageMin = parseInt(ageMatch[1]);
                this.extractedData.population.ageMax = parseInt(ageMatch[2]);
                this.extractedData.population.ages = `${ageMatch[1]}-${ageMatch[2]}`;
                this.metrics.uniqueDataPoints.add(`age_${ageMatch[1]}_${ageMatch[2]}`);
                this.metrics.fieldsFound++;
            } else {
                // Try categorical
                if (/adolescents?|teens?/gi.test(text)) {
                    this.extractedData.population.ages = 'Adolescents';
                    this.metrics.uniqueDataPoints.add('pop_adolescents');
                } else if (/young\s+adults?/gi.test(text)) {
                    this.extractedData.population.ages = 'Young Adults';
                    this.metrics.uniqueDataPoints.add('pop_young_adults');
                } else if (/adults?(?!\s+only)/gi.test(text)) {
                    this.extractedData.population.ages = 'Adults';
                    this.metrics.uniqueDataPoints.add('pop_adults');
                }
            }
            
            // Special populations
            if (EXTRACTION_PATTERNS.population.lgbtq.test(text)) {
                this.extractedData.population.specialPopulations.push('LGBTQ+ Affirming');
                this.metrics.uniqueDataPoints.add('pop_lgbtq');
            }
            if (/adopted|foster/gi.test(text)) {
                this.extractedData.population.specialPopulations.push('Adoption/Foster Care');
                this.metrics.uniqueDataPoints.add('pop_adoption');
            }
            if (/first\s+responders?/gi.test(text)) {
                this.extractedData.population.specialPopulations.push('First Responders');
                this.metrics.uniqueDataPoints.add('pop_first_responders');
            }
            if (/military|veterans?/gi.test(text)) {
                this.extractedData.population.specialPopulations.push('Military/Veterans');
                this.metrics.uniqueDataPoints.add('pop_military');
            }
        }
        
        extractClinicalInfo(text) {
            // Evidence-based therapies
            for (const [therapy, pattern] of Object.entries(EXTRACTION_PATTERNS.evidenceBased)) {
                if (pattern.test(text)) {
                    const formatted = this.formatTherapyName(therapy);
                    if (!this.extractedData.clinical.evidenceBased.includes(formatted)) {
                        this.extractedData.clinical.evidenceBased.push(formatted);
                        this.metrics.uniqueDataPoints.add(`eb_${therapy}`);
                    }
                }
            }
            
            // Experiential therapies
            for (const [therapy, pattern] of Object.entries(EXTRACTION_PATTERNS.experiential)) {
                if (pattern.test(text)) {
                    const formatted = this.formatTherapyName(therapy);
                    if (!this.extractedData.clinical.experiential.includes(formatted)) {
                        this.extractedData.clinical.experiential.push(formatted);
                        this.metrics.uniqueDataPoints.add(`exp_${therapy}`);
                    }
                }
            }
            
            // Specializations
            for (const [spec, pattern] of Object.entries(EXTRACTION_PATTERNS.specializations)) {
                if (pattern.test(text)) {
                    const formatted = this.formatSpecialization(spec);
                    if (!this.extractedData.clinical.specializations.includes(formatted)) {
                        this.extractedData.clinical.specializations.push(formatted);
                        this.metrics.uniqueDataPoints.add(`spec_${spec}`);
                    }
                }
            }
            
            // Therapy hours
            const individualMatch = /(\d+)\s*(?:hours?\s+of\s+)?individual\s+therapy/gi.exec(text);
            if (individualMatch) {
                this.extractedData.clinical.individualTherapyHours = `${individualMatch[1]} hours/week`;
                this.metrics.fieldsFound++;
            }
            
            const groupMatch = /(\d+)\s*(?:hours?\s+of\s+)?group\s+therapy/gi.exec(text);
            if (groupMatch) {
                this.extractedData.clinical.groupTherapyHours = `${groupMatch[1]} hours/week`;
                this.metrics.fieldsFound++;
            }
            
            // Psychiatry
            if (/psychiatrist\s+on[\-\s]?staff|on[\-\s]?site\s+psychiatrist/gi.test(text)) {
                this.extractedData.clinical.psychiatryAvailable = true;
                this.extractedData.staff.psychiatristOnStaff = true;
                this.metrics.uniqueDataPoints.add('psychiatry_available');
            }
            
            if (/medication\s+management/gi.test(text)) {
                this.extractedData.clinical.medicationManagement = true;
                this.metrics.uniqueDataPoints.add('med_management');
            }
            
            // Determine primary focus
            if (this.extractedData.clinical.specializations.length > 0) {
                // If SUD is present and dominant, make it primary
                const hasSUD = this.extractedData.clinical.specializations.some(s => 
                    s.includes('Substance') || s.includes('Addiction')
                );
                if (hasSUD && text.toLowerCase().split('substance').length > 3) {
                    this.extractedData.clinical.primaryFocus = 'Substance Use Disorders';
                } else {
                    this.extractedData.clinical.primaryFocus = this.extractedData.clinical.specializations[0];
                }
            }
        }
        
        extractContactInfo(text) {
            // Phone
            const phoneMatch = EXTRACTION_PATTERNS.contact.phone.exec(text);
            if (phoneMatch) {
                this.extractedData.contact.phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
                if (phoneMatch[4]) {
                    this.extractedData.contact.phone += ` ext. ${phoneMatch[4]}`;
                }
                this.metrics.fieldsFound++;
            }
            
            // Email
            const emailMatch = EXTRACTION_PATTERNS.contact.email.exec(text);
            if (emailMatch) {
                this.extractedData.contact.email = emailMatch[1];
                this.metrics.fieldsFound++;
            }
        }
        
        extractStructureInfo(text) {
            // Capacity
            const capacityMatch = EXTRACTION_PATTERNS.structure.capacity.exec(text);
            if (capacityMatch) {
                this.extractedData.structure.capacity = capacityMatch[1];
                this.metrics.fieldsFound++;
            }
            
            // Staff ratio
            const ratioMatch = EXTRACTION_PATTERNS.structure.ratio.exec(text);
            if (ratioMatch) {
                this.extractedData.structure.ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
                this.metrics.fieldsFound++;
            }
            
            // Length of stay
            const losMatch = EXTRACTION_PATTERNS.structure.los.exec(text);
            if (losMatch) {
                if (losMatch[1] && losMatch[2]) {
                    this.extractedData.structure.los = `${losMatch[1]}-${losMatch[2]} ${losMatch[3] || 'days'}`;
                } else if (losMatch[2]) {
                    this.extractedData.structure.avgLOS = `${losMatch[2]} ${losMatch[3] || 'days'}`;
                }
                this.metrics.fieldsFound++;
            }
            
            // Phases
            if (EXTRACTION_PATTERNS.structure.phases.test(text)) {
                const phaseMatch = text.match(/(?:phase|level|stage)\s+(\d+|one|two|three|four|five|i|ii|iii|iv|v)/gi);
                if (phaseMatch) {
                    this.extractedData.structure.phases = phaseMatch;
                    this.metrics.uniqueDataPoints.add('has_phases');
                }
            }
        }
        
        extractEnvironment(text) {
            // Setting
            for (const [setting, pattern] of Object.entries(EXTRACTION_PATTERNS.environment)) {
                if (pattern.test(text)) {
                    const formatted = setting.charAt(0).toUpperCase() + setting.slice(1);
                    this.extractedData.environment.setting = formatted + ' setting';
                    this.metrics.uniqueDataPoints.add(`env_${setting}`);
                    break;
                }
            }
            
            // Campus size
            const campusMatch = /(\d+)[\s\-]?acre/gi.exec(text);
            if (campusMatch) {
                this.extractedData.environment.campusSizeAcre = campusMatch[1];
                this.metrics.fieldsFound++;
            }
            
            // Facilities
            const facilities = ['gym', 'pool', 'cafeteria', 'library', 'computer lab', 'art studio', 'music room'];
            facilities.forEach(facility => {
                if (new RegExp(facility, 'gi').test(text)) {
                    this.extractedData.environment.facilities.push(facility);
                    this.metrics.uniqueDataPoints.add(`facility_${facility}`);
                }
            });
            
            // Amenities
            const amenities = ['private rooms', 'semi-private rooms', 'shared rooms', 'outdoor space', 'recreation area'];
            amenities.forEach(amenity => {
                if (new RegExp(amenity, 'gi').test(text)) {
                    this.extractedData.environment.amenities.push(amenity);
                    this.metrics.uniqueDataPoints.add(`amenity_${amenity}`);
                }
            });
        }
        
        extractStaffInfo(text) {
            // Credentials
            const credentials = [
                'board certified', 'licensed', 'masters level', 'doctoral level',
                'phd', 'lcsw', 'lmft', 'lcpc', 'cadc', 'rn', 'lpn'
            ];
            
            credentials.forEach(credential => {
                if (new RegExp(credential, 'gi').test(text)) {
                    this.extractedData.staff.credentials.push(credential);
                    this.metrics.uniqueDataPoints.add(`cred_${credential}`);
                }
            });
            
            // Nursing
            if (/24\/7\s+nursing|nursing\s+staff|nurses?\s+on[\-\s]?staff/gi.test(text)) {
                this.extractedData.staff.nursingStaff = true;
                this.metrics.uniqueDataPoints.add('nursing_staff');
            }
            
            // Master's level
            if (/masters?\s+level|master'?s\s+degree/gi.test(text)) {
                this.extractedData.staff.masterLevel = true;
                this.metrics.uniqueDataPoints.add('masters_level');
            }
        }
        
        extractFamilyProgram(text) {
            // Weekly therapy
            if (/weekly\s+family\s+(?:therapy|sessions?)|family\s+therapy\s+weekly/gi.test(text)) {
                this.extractedData.family.weeklyTherapy = true;
                this.metrics.uniqueDataPoints.add('weekly_family');
            }
            
            // Workshops
            if (/family\s+(?:workshops?|education|program)/gi.test(text)) {
                this.extractedData.family.workshops = true;
                this.metrics.uniqueDataPoints.add('family_workshops');
            }
            
            // Visitation
            const visitMatch = /(?:visitation|visits?)\s+(?:policy|allowed|permitted|schedule)/gi.exec(text);
            if (visitMatch) {
                const context = text.substring(Math.max(0, visitMatch.index - 100), visitMatch.index + 200);
                if (/weekend|weekly|monthly|supervised/gi.test(context)) {
                    this.extractedData.family.visitationPolicy = 'Regular visitation allowed';
                    this.metrics.fieldsFound++;
                }
            }
            
            // Parent coaching
            if (/parent\s+(?:coaching|support|guidance)/gi.test(text)) {
                this.extractedData.family.parentCoaching = true;
                this.metrics.uniqueDataPoints.add('parent_coaching');
            }
        }
        
        extractAdmissionsInfo(text) {
            // Insurance
            const insuranceProviders = [
                'BCBS', 'Blue Cross', 'Aetna', 'Cigna', 'United', 'UnitedHealth',
                'Anthem', 'Humana', 'Kaiser', 'Magellan', 'Optum', 'Beacon',
                'Medicaid', 'Medicare', 'Tricare', 'CHAMPUS'
            ];
            
            insuranceProviders.forEach(provider => {
                const regex = new RegExp(`\\b${provider}\\b`, 'gi');
                if (regex.test(text)) {
                    if (!this.extractedData.admissions.insurance.includes(provider)) {
                        this.extractedData.admissions.insurance.push(provider);
                        this.metrics.uniqueDataPoints.add(`ins_${provider}`);
                    }
                }
            });
            
            // Private pay
            if (/private\s+pay|self[\-\s]pay|cash\s+pay/gi.test(text)) {
                this.extractedData.admissions.privatePay = true;
                this.metrics.uniqueDataPoints.add('private_pay');
            }
            
            // Financing
            if (/financing|payment\s+plans?|financial\s+assistance/gi.test(text)) {
                this.extractedData.admissions.financing = true;
                this.metrics.uniqueDataPoints.add('financing');
            }
            
            // Scholarships
            if (/scholarships?|sliding\s+scale|reduced\s+fee/gi.test(text)) {
                this.extractedData.admissions.scholarships = true;
                this.metrics.uniqueDataPoints.add('scholarships');
            }
            
            // Exclusions
            const exclusions = [
                /active\s+psychosis/gi,
                /violent\s+behavior/gi,
                /sex\s+offenders?/gi,
                /arson/gi,
                /homicidal/gi,
                /severe\s+medical/gi
            ];
            
            exclusions.forEach(exclusion => {
                if (exclusion.test(text)) {
                    const match = exclusion.exec(text);
                    if (match && !this.extractedData.admissions.exclusions.includes(match[0])) {
                        this.extractedData.admissions.exclusions.push(match[0]);
                        this.metrics.uniqueDataPoints.add('has_exclusions');
                    }
                }
            });
        }
        
        extractQualityIndicators(text) {
            // Accreditations
            const accreditations = ['CARF', 'Joint Commission', 'JCAHO', 'COA', 'NATSAP', 'NAADAC'];
            
            accreditations.forEach(accred => {
                if (new RegExp(`\\b${accred}\\b`, 'gi').test(text)) {
                    if (!this.extractedData.quality.accreditations.includes(accred)) {
                        this.extractedData.quality.accreditations.push(accred);
                        this.metrics.uniqueDataPoints.add(`accred_${accred}`);
                    }
                }
            });
            
            // Memberships
            const memberships = ['NAATP', 'ACA', 'NAADAC', 'IECA'];
            
            memberships.forEach(member => {
                if (new RegExp(`\\b${member}\\b`, 'gi').test(text)) {
                    if (!this.extractedData.quality.memberships.includes(member)) {
                        this.extractedData.quality.memberships.push(member);
                        this.metrics.uniqueDataPoints.add(`member_${member}`);
                    }
                }
            });
        }
        
        buildDifferentiators() {
            const differentiators = [];
            
            // Unique clinical offerings
            if (this.extractedData.clinical?.experiential) {
                const unique = this.extractedData.clinical.experiential.filter(therapy => {
                    const common = ['art therapy', 'music therapy', 'recreation therapy', 'yoga'];
                    return !common.some(c => therapy.toLowerCase().includes(c));
                });
                
                if (unique.length > 0) {
                    differentiators.push(`Unique therapies: ${unique.slice(0, 3).join(', ')}`);
                }
            }
            
            // Special populations
            if (this.extractedData.population?.specialPopulations?.length > 0) {
                const special = this.extractedData.population.specialPopulations.filter(pop => {
                    const common = ['co-ed', 'males only', 'females only'];
                    return !common.includes(pop.toLowerCase());
                });
                
                if (special.length > 0) {
                    differentiators.push(`Specialized for ${special.join(' and ')}`);
                }
            }
            
            // Unique setting
            if (this.extractedData.environment?.setting) {
                const setting = this.extractedData.environment.setting.toLowerCase();
                if (setting.includes('mountain') || setting.includes('coastal') || 
                    setting.includes('ranch') || setting.includes('wilderness')) {
                    differentiators.push(this.extractedData.environment.setting);
                }
            }
            
            // Staff credentials
            if (this.extractedData.staff?.credentials?.length > 0) {
                const notable = this.extractedData.staff.credentials.find(cred =>
                    cred.toLowerCase().includes('board certified') ||
                    cred.toLowerCase().includes('phd') ||
                    cred.toLowerCase().includes('specialized')
                );
                
                if (notable) {
                    differentiators.push(notable);
                }
            }
            
            // Capacity/size
            if (this.extractedData.structure?.capacity) {
                const capacity = parseInt(this.extractedData.structure.capacity);
                if (capacity <= 20) {
                    differentiators.push('Small, intimate program');
                }
            }
            
            // Family involvement
            if (this.extractedData.family?.weeklyTherapy && 
                this.extractedData.family?.workshops) {
                differentiators.push('Comprehensive family program');
            }
            
            // Quality indicators
            if (this.extractedData.quality?.accreditations?.length > 0) {
                differentiators.push(`${this.extractedData.quality.accreditations.join(', ')} accredited`);
            }
            
            this.extractedData.differentiators = differentiators;
        }
        
        calculateConfidence() {
            let confidence = 0;
            let factors = 0;
            
            // Check required fields
            const requiredFields = ['name', 'location', 'contact', 'levelsOfCare'];
            requiredFields.forEach(field => {
                if (this.hasData(this.extractedData[field])) {
                    confidence += 0.15;
                }
                factors += 0.15;
            });
            
            // Check important fields
            const importantFields = ['population', 'clinical', 'admissions'];
            importantFields.forEach(field => {
                if (this.hasData(this.extractedData[field])) {
                    confidence += 0.1;
                }
                factors += 0.1;
            });
            
            // Check data richness
            if (this.metrics.fieldsFound > 20) confidence += 0.2;
            else if (this.metrics.fieldsFound > 10) confidence += 0.1;
            factors += 0.2;
            
            // Check unique data points
            if (this.metrics.uniqueDataPoints.size > 30) confidence += 0.15;
            else if (this.metrics.uniqueDataPoints.size > 15) confidence += 0.075;
            factors += 0.15;
            
            this.metrics.confidence = confidence / factors;
            this.extractedData.metadata.confidence = this.metrics.confidence;
        }
        
        hasData(value) {
            if (!value) return false;
            if (Array.isArray(value)) return value.length > 0;
            if (typeof value === 'object') {
                return Object.values(value).some(v => this.hasData(v));
            }
            if (typeof value === 'string') return value.trim().length > 0;
            return true;
        }
        
        generateWriteUp() {
            let writeUp = '='.repeat(70) + '\n';
            writeUp += 'CLINICAL AFTERCARE RECOMMENDATION\n';
            writeUp += '='.repeat(70) + '\n\n';
            
            // Header
            writeUp += `PROGRAM: ${this.extractedData.name}\n`;
            if (this.extractedData.location.city || this.extractedData.location.state) {
                writeUp += `LOCATION: ${this.extractedData.location.city}${this.extractedData.location.city && this.extractedData.location.state ? ', ' : ''}${this.extractedData.location.state}\n`;
            }
            
            // Key differentiators
            if (this.extractedData.differentiators.length > 0) {
                writeUp += '\nKEY DIFFERENTIATORS:\n';
                this.extractedData.differentiators.forEach(diff => {
                    writeUp += `• ${diff}\n`;
                });
            }
            
            // Levels of care
            if (this.extractedData.levelsOfCare.length > 0) {
                writeUp += '\nLEVELS OF CARE:\n';
                this.extractedData.levelsOfCare.forEach(level => {
                    writeUp += `• ${level}\n`;
                });
            }
            
            // Population
            writeUp += '\nPOPULATION SERVED:\n';
            if (this.extractedData.population.ages) {
                writeUp += `  Ages: ${this.extractedData.population.ages}\n`;
            }
            if (this.extractedData.population.gender) {
                writeUp += `  Gender: ${this.extractedData.population.gender}\n`;
            }
            if (this.extractedData.population.specialPopulations.length > 0) {
                writeUp += `  Special Populations: ${this.extractedData.population.specialPopulations.join(', ')}\n`;
            }
            
            // Clinical programming
            writeUp += '\nCLINICAL PROGRAMMING:\n';
            
            if (this.extractedData.clinical.primaryFocus) {
                writeUp += `  Primary Focus: ${this.extractedData.clinical.primaryFocus}\n`;
            }
            
            if (this.extractedData.clinical.specializations.length > 0) {
                writeUp += '  Specializations:\n';
                this.extractedData.clinical.specializations.forEach(spec => {
                    writeUp += `    • ${spec}\n`;
                });
            }
            
            if (this.extractedData.clinical.evidenceBased.length > 0) {
                writeUp += '  Evidence-Based Modalities:\n';
                this.extractedData.clinical.evidenceBased.forEach(modality => {
                    writeUp += `    • ${modality}\n`;
                });
            }
            
            if (this.extractedData.clinical.experiential.length > 0) {
                writeUp += '  Experiential Therapies:\n';
                this.extractedData.clinical.experiential.forEach(therapy => {
                    writeUp += `    • ${therapy}\n`;
                });
            }
            
            if (this.extractedData.clinical.individualTherapyHours || this.extractedData.clinical.groupTherapyHours) {
                writeUp += '  Therapy Intensity:\n';
                if (this.extractedData.clinical.individualTherapyHours) {
                    writeUp += `    • Individual: ${this.extractedData.clinical.individualTherapyHours}\n`;
                }
                if (this.extractedData.clinical.groupTherapyHours) {
                    writeUp += `    • Group: ${this.extractedData.clinical.groupTherapyHours}\n`;
                }
            }
            
            if (this.extractedData.clinical.psychiatryAvailable || this.extractedData.clinical.medicationManagement) {
                writeUp += '  Medical Support:\n';
                if (this.extractedData.clinical.psychiatryAvailable) {
                    writeUp += '    • Psychiatrist on staff\n';
                }
                if (this.extractedData.clinical.medicationManagement) {
                    writeUp += '    • Medication management available\n';
                }
            }
            
            // Program structure
            if (this.extractedData.structure.capacity || this.extractedData.structure.ratio || this.extractedData.structure.avgLOS) {
                writeUp += '\nPROGRAM STRUCTURE:\n';
                if (this.extractedData.structure.capacity) {
                    writeUp += `  Capacity: ${this.extractedData.structure.capacity} beds\n`;
                }
                if (this.extractedData.structure.ratio) {
                    writeUp += `  Staff Ratio: ${this.extractedData.structure.ratio}\n`;
                }
                if (this.extractedData.structure.avgLOS || this.extractedData.structure.los) {
                    writeUp += `  Length of Stay: ${this.extractedData.structure.avgLOS || this.extractedData.structure.los}\n`;
                }
            }
            
            // Environment
            if (this.extractedData.environment.setting || this.extractedData.environment.campusSizeAcre) {
                writeUp += '\nENVIRONMENT:\n';
                if (this.extractedData.environment.setting) {
                    writeUp += `  ${this.extractedData.environment.setting}\n`;
                }
                if (this.extractedData.environment.campusSizeAcre) {
                    writeUp += `  ${this.extractedData.environment.campusSizeAcre} acre campus\n`;
                }
                if (this.extractedData.environment.facilities.length > 0) {
                    writeUp += `  Facilities: ${this.extractedData.environment.facilities.join(', ')}\n`;
                }
            }
            
            // Family program
            if (this.extractedData.family.weeklyTherapy || this.extractedData.family.workshops) {
                writeUp += '\nFAMILY PROGRAM:\n';
                if (this.extractedData.family.weeklyTherapy) {
                    writeUp += '  • Weekly family therapy sessions\n';
                }
                if (this.extractedData.family.workshops) {
                    writeUp += '  • Family workshops and education\n';
                }
                if (this.extractedData.family.visitationPolicy) {
                    writeUp += `  • ${this.extractedData.family.visitationPolicy}\n`;
                }
                if (this.extractedData.family.parentCoaching) {
                    writeUp += '  • Parent coaching available\n';
                }
            }
            
            // Insurance/admissions
            if (this.extractedData.admissions.insurance.length > 0 || this.extractedData.admissions.privatePay) {
                writeUp += '\nINSURANCE & PAYMENT:\n';
                if (this.extractedData.admissions.insurance.length > 0) {
                    writeUp += `  Accepted: ${this.extractedData.admissions.insurance.join(', ')}\n`;
                }
                if (this.extractedData.admissions.privatePay) {
                    writeUp += '  • Private pay accepted\n';
                }
                if (this.extractedData.admissions.financing) {
                    writeUp += '  • Financing available\n';
                }
                if (this.extractedData.admissions.scholarships) {
                    writeUp += '  • Scholarships/sliding scale available\n';
                }
            }
            
            // Quality indicators
            if (this.extractedData.quality.accreditations.length > 0) {
                writeUp += '\nQUALITY INDICATORS:\n';
                writeUp += `  Accreditations: ${this.extractedData.quality.accreditations.join(', ')}\n`;
            }
            
            // Contact
            writeUp += '\nCONTACT INFORMATION:\n';
            if (this.extractedData.contact.phone) {
                writeUp += `  Phone: ${this.extractedData.contact.phone}\n`;
            }
            if (this.extractedData.contact.email) {
                writeUp += `  Email: ${this.extractedData.contact.email}\n`;
            }
            writeUp += `  Website: ${this.extractedData.website}\n`;
            
            // Metadata
            writeUp += '\n' + '-'.repeat(70) + '\n';
            writeUp += `Assessment Date: ${new Date().toLocaleDateString()}\n`;
            writeUp += `Data Confidence: ${Math.round(this.metrics.confidence * 100)}%\n`;
            writeUp += `Pages Analyzed: ${this.metrics.pagesScanned}\n`;
            writeUp += `Unique Data Points: ${this.metrics.uniqueDataPoints.size}\n`;
            
            return writeUp;
        }
        
        getCleanPageText(doc) {
            const clone = doc.cloneNode(true);
            
            const removeSelectors = [
                'nav', 'header', 'footer', '.navigation', '.header', '.footer',
                '.menu', '#menu', '.sidebar', 'aside', 'script', 'style',
                '.social', '.share', '.cookie', '.popup', '.modal'
            ];
            
            removeSelectors.forEach(selector => {
                clone.querySelectorAll(selector).forEach(el => el.remove());
            });
            
            return clone.body?.textContent || '';
        }
        
        updateMetrics() {
            chrome.runtime.sendMessage({
                type: 'extraction-metrics',
                metrics: {
                    fieldsFound: this.metrics.fieldsFound,
                    pagesScanned: this.metrics.pagesScanned,
                    uniqueDataPoints: this.metrics.uniqueDataPoints.size,
                    confidence: Math.round(this.metrics.confidence * 100)
                }
            });
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
        
        formatTherapyName(therapy) {
            const mappings = {
                'cbt': 'CBT (Cognitive Behavioral Therapy)',
                'dbt': 'DBT (Dialectical Behavior Therapy)',
                'emdr': 'EMDR',
                'act': 'ACT (Acceptance and Commitment Therapy)',
                'mi': 'Motivational Interviewing',
                'tfCbt': 'TF-CBT',
                'cpt': 'CPT',
                'pe': 'Prolonged Exposure',
                'seeking': 'Seeking Safety',
                'matrix': 'Matrix Model',
                'smart': 'SMART Recovery',
                'twelveStep': '12-Step',
                'equine': 'Equine Therapy',
                'adventure': 'Adventure Therapy',
                'wilderness': 'Wilderness Therapy',
                'art': 'Art Therapy',
                'music': 'Music Therapy',
                'drama': 'Drama Therapy',
                'recreation': 'Recreation Therapy',
                'yoga': 'Yoga',
                'mindfulness': 'Mindfulness',
                'somatic': 'Somatic Therapy',
                'neurofeedback': 'Neurofeedback',
                'biofeedback': 'Biofeedback'
            };
            
            return mappings[therapy] || therapy;
        }
        
        formatSpecialization(spec) {
            const mappings = {
                'sud': 'Substance Use Disorders',
                'trauma': 'Trauma/PTSD',
                'anxiety': 'Anxiety Disorders',
                'depression': 'Depression',
                'bipolar': 'Bipolar Disorder',
                'adhd': 'ADHD',
                'autism': 'Autism Spectrum',
                'ocd': 'OCD',
                'eatingDisorders': 'Eating Disorders',
                'selfHarm': 'Self-Harm',
                'sexualTrauma': 'Sexual Trauma',
                'adoption': 'Adoption Issues',
                'attachment': 'Attachment Disorders',
                'dualDiagnosis': 'Dual Diagnosis'
            };
            
            return mappings[spec] || spec;
        }
        
        getStateAbbr(stateName) {
            const states = {
                'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
                'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
                'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
                'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
                'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
                'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
                'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
                'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
                'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
                'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
                'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
                'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
                'wisconsin': 'WI', 'wyoming': 'WY'
            };
            
            return states[stateName.toLowerCase()] || stateName;
        }
    }
    
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[CareConnect] Received message:', request);
        
        if (request.action === 'extract-v2' || request.type === 'extract-data') {
            console.log('[CareConnect] Starting v12.0 extraction...');
            
            const extractor = new UniversalExtractor();
            
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
    
    console.log('[CareConnect] Universal Extractor v12.0 ready');
    
})();
