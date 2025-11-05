// universal-extractor.js - Main extraction engine integrating all components
// Version 12.0 - Universal Dynamic Extraction System

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__CC_UNIVERSAL_EXTRACTOR__) {
        return;
    }
    window.__CC_UNIVERSAL_EXTRACTOR__ = true;
    
    console.log('[CareConnect] Universal Extractor v12.0 Initialized');
    
    // Import all modules (in real implementation, these would be proper imports)
    const modules = {
        PatternEngine: window.DynamicPatternEngine || DynamicPatternEngine,
        StructureAnalyzer: window.StructureAnalyzer || StructureAnalyzer,
        AntiPatternFilter: window.AntiPatternFilter || AntiPatternFilter,
        SmartCrawler: window.SmartCrawler || SmartCrawler,
        MultiStrategyExtractor: window.MultiStrategyExtractor || MultiStrategyExtractor,
        ConfidenceScorer: window.ConfidenceScorer || ConfidenceScorer,
        SelfImprovementEngine: window.SelfImprovementEngine || SelfImprovementEngine,
        DynamicTemplateEngine: window.DynamicTemplateEngine || DynamicTemplateEngine
    };
    
    class UniversalExtractor {
        constructor() {
            // Initialize all components
            this.patternEngine = new modules.PatternEngine();
            this.structureAnalyzer = new modules.StructureAnalyzer();
            this.antiPatternFilter = new modules.AntiPatternFilter();
            this.crawler = new modules.SmartCrawler();
            this.multiStrategy = new modules.MultiStrategyExtractor();
            this.confidenceScorer = new modules.ConfidenceScorer();
            this.learningEngine = new modules.SelfImprovementEngine();
            this.templateEngine = new modules.DynamicTemplateEngine();
            
            // Extraction state
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
                // Step 1: Analyze site structure
                this.sendProgress('initialization', 0, 1, 'Analyzing website structure...');
                const siteAnalysis = this.structureAnalyzer.analyzeSite(document);
                console.log('[CareConnect] Site analysis:', siteAnalysis);
                
                // Step 2: Get extraction recommendations from learning engine
                const recommendations = this.getExtractionStrategy(siteAnalysis);
                console.log('[CareConnect] Extraction strategy:', recommendations);
                
                // Step 3: Initialize data structure
                this.extractedData = this.initializeDataStructure();
                
                // Step 4: Extract from current page
                this.sendProgress('extraction', 0, 1, 'Extracting from current page...');
                await this.extractFromPage(document, window.location.href, recommendations);
                
                // Step 5: Smart multi-page crawling
                if (options.enableCrawling !== false) {
                    this.sendProgress('crawling', 0, 1, 'Discovering related pages...');
                    await this.performSmartCrawl(siteAnalysis, recommendations);
                }
                
                // Step 6: Apply anti-pattern filtering
                this.sendProgress('filtering', 0, 1, 'Validating extracted data...');
                const filtered = this.applyAntiPatternFiltering();
                
                // Step 7: Build differentiators
                this.sendProgress('analysis', 0, 1, 'Analyzing unique features...');
                this.buildDifferentiators();
                
                // Step 8: Calculate confidence scores
                this.sendProgress('scoring', 0, 1, 'Calculating confidence scores...');
                const confidence = this.calculateConfidence();
                
                // Step 9: Learn from this extraction
                this.recordExtraction(filtered);
                
                // Step 10: Generate clinical write-up
                this.sendProgress('formatting', 0, 1, 'Generating clinical documentation...');
                const writeUp = this.generateWriteUp(options.format);
                
                // Complete
                this.sendProgress('complete', 1, 1, 'Extraction complete!');
                
                return {
                    success: true,
                    data: filtered.data,
                    writeUp: writeUp,
                    metrics: {
                        ...this.metrics,
                        confidence: confidence.overall,
                        extractionTime: Date.now() - this.startTime
                    },
                    analysis: {
                        siteStructure: siteAnalysis,
                        dataQuality: confidence,
                        issues: filtered.issues
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
        
        getExtractionStrategy(siteAnalysis) {
            // Get recommendations from learning engine
            const learned = this.learningEngine.getRecommendations(
                'all',
                this.currentDomain,
                { siteAnalysis }
            );
            
            // Combine with site analysis recommendations
            const combined = {
                strategies: [...siteAnalysis.recommendations.priority],
                patterns: [],
                locations: [],
                warnings: [...siteAnalysis.recommendations.warnings]
            };
            
            // Merge learned recommendations
            learned.forEach(rec => {
                if (rec.type === 'use-strategy') {
                    combined.strategies.push(...rec.strategies.map(s => s.strategy));
                } else if (rec.type === 'use-patterns') {
                    combined.patterns.push(...rec.patterns);
                } else if (rec.type === 'check-locations') {
                    combined.locations.push(...rec.locations);
                } else if (rec.type === 'warnings') {
                    combined.warnings.push(...rec.warnings);
                }
            });
            
            return combined;
        }
        
        initializeDataStructure() {
            return {
                // Basic information
                name: '',
                website: this.currentDomain,
                location: {
                    city: '',
                    state: '',
                    address: ''
                },
                
                // Contact
                contact: {
                    phone: '',
                    email: '',
                    admissionsContact: ''
                },
                
                // Levels of care
                levelsOfCare: [],
                
                // Population
                population: {
                    ages: '',
                    ageMin: null,
                    ageMax: null,
                    gender: '',
                    specialPopulations: []
                },
                
                // Clinical
                clinical: {
                    evidenceBased: [],
                    experiential: [],
                    specializations: [],
                    primaryFocus: '',
                    individualTherapyHours: '',
                    groupTherapyHours: '',
                    familyTherapyFrequency: '',
                    psychiatryAvailable: false,
                    medicationManagement: false,
                    nursingStaff: false
                },
                
                // Structure
                structure: {
                    los: '',
                    avgLOS: '',
                    capacity: '',
                    ratio: '',
                    phases: [],
                    groupSize: '',
                    dailySchedule: '',
                    academics: {
                        hasProgram: false,
                        onSite: false,
                        accreditation: '',
                        grades: '',
                        collegeCounseling: false,
                        creditRecovery: false
                    }
                },
                
                // Environment
                environment: {
                    setting: '',
                    campusSizeAcre: '',
                    facilities: [],
                    amenities: [],
                    recreation: []
                },
                
                // Staff
                staff: {
                    credentials: [],
                    leadership: [],
                    psychiatristOnStaff: false,
                    nursingStaff: false,
                    masterLevel: false
                },
                
                // Family
                family: {
                    weeklyTherapy: false,
                    workshops: false,
                    visitationPolicy: '',
                    parentCoaching: false,
                    supportGroups: false,
                    communicationPolicy: ''
                },
                
                // Admissions
                admissions: {
                    phone: '',
                    email: '',
                    insurance: [],
                    privatePay: false,
                    privatePayRate: '',
                    financing: false,
                    scholarships: false,
                    admissionsProcess: '',
                    requirements: [],
                    exclusions: []
                },
                
                // Quality
                quality: {
                    accreditations: [],
                    memberships: [],
                    awards: [],
                    successRate: '',
                    completionRate: '',
                    satisfactionScore: ''
                },
                
                // Outcomes
                outcomes: {
                    trackingMethod: '',
                    followUpDuration: '',
                    alumniProgram: false,
                    successMetrics: []
                },
                
                // Differentiators
                differentiators: [],
                
                // Metadata
                metadata: {
                    extractionTime: null,
                    pagesAnalyzed: 0,
                    confidence: 0,
                    version: '12.0'
                }
            };
        }
        
        async extractFromPage(doc, url, recommendations) {
            console.log(`[CareConnect] Extracting from ${url}`);
            
            // Get all text content for pattern matching
            const pageText = this.getCleanPageText(doc);
            
            // Extract each field using multi-strategy approach
            const fields = Object.keys(this.extractedData);
            
            for (const field of fields) {
                if (typeof this.extractedData[field] === 'object' && !Array.isArray(this.extractedData[field])) {
                    // Nested object - extract subfields
                    await this.extractNestedFields(field, doc, pageText, recommendations);
                } else {
                    // Direct field
                    await this.extractField(field, doc, pageText, recommendations);
                }
            }
            
            // Update metrics
            this.metrics.pagesScanned++;
            this.updateMetrics();
        }
        
        async extractNestedFields(parentField, doc, pageText, recommendations) {
            const nestedData = this.extractedData[parentField];
            
            for (const [subField, value] of Object.entries(nestedData)) {
                const fieldPath = `${parentField}.${subField}`;
                const result = await this.multiStrategy.extractField(fieldPath, doc, {
                    pageText,
                    recommendations,
                    currentData: this.extractedData
                });
                
                if (result && result.value !== null && result.value !== undefined) {
                    nestedData[subField] = result.value;
                    
                    // Track extraction
                    this.recordFieldExtraction(fieldPath, result);
                }
            }
        }
        
        async extractField(field, doc, pageText, recommendations) {
            const result = await this.multiStrategy.extractField(field, doc, {
                pageText,
                recommendations,
                currentData: this.extractedData
            });
            
            if (result && result.value !== null && result.value !== undefined) {
                this.extractedData[field] = result.value;
                
                // Track extraction
                this.recordFieldExtraction(field, result);
            }
        }
        
        recordFieldExtraction(field, result) {
            // Update metrics
            this.metrics.fieldsFound++;
            
            if (Array.isArray(result.value)) {
                result.value.forEach(v => this.metrics.uniqueDataPoints.add(`${field}:${v}`));
            } else {
                this.metrics.uniqueDataPoints.add(`${field}:${result.value}`);
            }
            
            // Record in learning engine
            const historyKey = this.learningEngine.recordExtraction(
                window.location.href,
                field,
                result.strategy || 'unknown',
                result.value,
                result.confidence || 0.5,
                result.context || {}
            );
            
            // Store for later feedback
            if (!this.extractedData.metadata.extractionHistory) {
                this.extractedData.metadata.extractionHistory = {};
            }
            this.extractedData.metadata.extractionHistory[field] = historyKey;
        }
        
        async performSmartCrawl(siteAnalysis, recommendations) {
            // Configure crawler based on site analysis
            const crawlOptions = {
                maxPages: 50,
                maxDepth: 3,
                concurrentFetches: 3,
                requestDelay: 300
            };
            
            // Adjust based on site type
            if (siteAnalysis.fingerprint.layout === 'singlePage') {
                crawlOptions.maxDepth = 1;
                crawlOptions.maxPages = 10;
            }
            
            // Perform crawl
            const crawlResults = await this.crawler.crawlSite(window.location.href, crawlOptions);
            
            if (!crawlResults) return;
            
            console.log('[CareConnect] Crawl results:', crawlResults.summary);
            
            // Extract from each crawled page
            for (const page of crawlResults.pages) {
                if (page.data && page.data.mainContent.found) {
                    await this.extractFromPage(page.doc || document, page.url, recommendations);
                    
                    // Update progress
                    this.sendProgress(
                        'crawling',
                        crawlResults.pages.indexOf(page) + 1,
                        crawlResults.pages.length,
                        `Analyzing: ${new URL(page.url).pathname}`
                    );
                }
            }
        }
        
        applyAntiPatternFiltering() {
            const context = {
                domain: this.currentDomain,
                otherData: this.extractedData
            };
            
            // Filter all extracted data
            const filtered = this.antiPatternFilter.filterExtractedData(
                this.extractedData,
                context
            );
            
            // Update extracted data with filtered version
            this.extractedData = filtered.data;
            
            // Add exclusions if found
            if (filtered.issues.some(issue => issue.type === 'excluded')) {
                if (!this.extractedData.admissions.exclusions) {
                    this.extractedData.admissions.exclusions = [];
                }
                
                filtered.issues
                    .filter(issue => issue.type === 'excluded')
                    .forEach(issue => {
                        this.extractedData.admissions.exclusions.push(issue.message);
                    });
            }
            
            return filtered;
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
                    differentiators.push(`${this.extractedData.environment.setting} setting`);
                }
            }
            
            // Academic excellence
            if (this.extractedData.structure?.academics?.accreditation) {
                differentiators.push(`Accredited academic program`);
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
            
            // Success metrics
            if (this.extractedData.quality?.successRate) {
                differentiators.push(`${this.extractedData.quality.successRate} success rate`);
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
            
            this.extractedData.differentiators = differentiators;
        }
        
        calculateConfidence() {
            // Use confidence scorer to calculate overall confidence
            const overallConfidence = this.confidenceScorer.calculateOverallConfidence(
                this.extractedData,
                {
                    pagesAnalyzed: this.metrics.pagesScanned,
                    extractionTime: Date.now() - this.startTime,
                    hasStructuredData: document.querySelector('script[type="application/ld+json"]') !== null
                }
            );
            
            // Update metrics
            this.metrics.confidence = overallConfidence.overall;
            this.extractedData.metadata.confidence = overallConfidence.overall;
            this.extractedData.metadata.confidenceBreakdown = overallConfidence.fieldBreakdown;
            
            return overallConfidence;
        }
        
        recordExtraction(filtered) {
            // Record overall extraction success
            const stats = this.learningEngine.getStatistics();
            console.log('[CareConnect] Learning statistics:', stats);
            
            // Update site profile
            this.learningEngine.recordExtraction(
                window.location.href,
                '_overall',
                'universal-extraction',
                this.metrics.fieldsFound,
                this.metrics.confidence,
                {
                    issues: filtered.issues,
                    duration: Date.now() - this.startTime
                }
            );
        }
        
        generateWriteUp(format) {
            // Use dynamic template engine
            const writeUp = this.templateEngine.generateWriteUp(
                this.extractedData,
                { format: format || 'standard' }
            );
            
            return writeUp;
        }
        
        // Helper methods
        getCleanPageText(doc) {
            // Remove navigation, footer, and other non-content elements
            const clone = doc.cloneNode(true);
            
            // Remove elements that typically don't contain content
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
            // Send metrics update
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
    }
    
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'extract-data') {
            console.log('[CareConnect] Received extraction request:', request);
            
            const extractor = new UniversalExtractor();
            
            extractor.extract(request.options || {})
                .then(result => {
                    console.log('[CareConnect] Extraction result:', result);
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
    
    console.log('[CareConnect] Universal extractor ready');
    
})();
