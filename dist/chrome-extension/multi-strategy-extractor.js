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
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiStrategyExtractor;
}
