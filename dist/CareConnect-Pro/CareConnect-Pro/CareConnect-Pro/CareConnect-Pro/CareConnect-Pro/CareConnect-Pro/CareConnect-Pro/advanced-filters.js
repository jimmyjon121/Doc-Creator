/**
 * Advanced Filter System for CareConnect Pro
 * Implements composable predicates and natural language search
 */

class AdvancedFilterSystem {
    constructor() {
        this.predicates = {};
        this.activeFilters = new Map();
        this.filterHistory = [];
        this.naturalLanguageParser = new NaturalLanguageParser();
        this.setupPredicates();
    }
    
    /**
     * Setup composable filter predicates
     */
    setupPredicates() {
        // Insurance predicate
        this.predicates.insurance = {
            name: 'Insurance',
            category: 'financial',
            weight: 1.0,
            filter: (program, values, options = {}) => {
                if (!values || values.length === 0) return { matches: true, score: 1.0 };
                if (!program.insurance) return { matches: false, score: 0 };
                
                const programInsurance = Array.isArray(program.insurance) ? 
                    program.insurance : [program.insurance];
                
                const normalizedProgram = programInsurance.map(ins => 
                    this.normalizeInsurance(ins)
                );
                const normalizedValues = values.map(ins => 
                    this.normalizeInsurance(ins)
                );
                
                const matchCount = normalizedValues.filter(val => 
                    normalizedProgram.some(pIns => pIns.includes(val))
                ).length;
                
                const matches = options.requireAll ? 
                    matchCount === normalizedValues.length : 
                    matchCount > 0;
                
                const score = matchCount / normalizedValues.length;
                
                return { matches, score: score * this.predicates.insurance.weight };
            }
        };
        
        // Cost range predicate
        this.predicates.cost = {
            name: 'Cost Range',
            category: 'financial',
            weight: 0.8,
            filter: (program, values, options = {}) => {
                if (!values || values.length === 0) return { matches: true, score: 1.0 };
                if (!program.costRange) return { matches: false, score: 0 };
                
                const matches = values.includes(program.costRange);
                return { 
                    matches, 
                    score: matches ? this.predicates.cost.weight : 0 
                };
            }
        };
        
        // Gender predicate
        this.predicates.gender = {
            name: 'Gender Served',
            category: 'demographic',
            weight: 1.0,
            filter: (program, value, options = {}) => {
                if (!value) return { matches: true, score: 1.0 };
                
                const programGender = (program.genderServed || 'co-ed').toLowerCase();
                const targetGender = value.toLowerCase();
                
                // Co-ed matches all
                if (programGender === 'co-ed' || programGender === 'coed') {
                    return { matches: true, score: 0.9 * this.predicates.gender.weight };
                }
                
                const matches = programGender === targetGender;
                return { 
                    matches, 
                    score: matches ? this.predicates.gender.weight : 0 
                };
            }
        };
        
        // Age range predicate
        this.predicates.age = {
            name: 'Age',
            category: 'demographic',
            weight: 1.0,
            filter: (program, value, options = {}) => {
                if (!value) return { matches: true, score: 1.0 };
                
                const ageRange = program.ageRange || this.parseAgeRange(program);
                if (!ageRange) return { matches: true, score: 0.5 }; // Unknown age
                
                const age = parseInt(value);
                const inRange = age >= ageRange.min && age <= ageRange.max;
                const nearRange = age >= ageRange.min - 1 && age <= ageRange.max + 1;
                
                if (inRange) {
                    return { matches: true, score: this.predicates.age.weight };
                } else if (nearRange && !options.strict) {
                    return { matches: true, score: 0.7 * this.predicates.age.weight };
                }
                
                return { matches: false, score: 0 };
            }
        };
        
        // Level of care predicate
        this.predicates.levelOfCare = {
            name: 'Level of Care',
            category: 'clinical',
            weight: 1.0,
            filter: (program, values, options = {}) => {
                if (!values || values.length === 0) return { matches: true, score: 1.0 };
                
                const programLevels = this.extractLevelsOfCare(program);
                const matchCount = values.filter(level => 
                    programLevels.includes(level.toLowerCase())
                ).length;
                
                const matches = options.requireAll ? 
                    matchCount === values.length : 
                    matchCount > 0;
                
                const score = matchCount / values.length;
                
                return { matches, score: score * this.predicates.levelOfCare.weight };
            }
        };
        
        // Specialties predicate
        this.predicates.specialties = {
            name: 'Specialties',
            category: 'clinical',
            weight: 0.9,
            filter: (program, values, options = {}) => {
                if (!values || values.length === 0) return { matches: true, score: 1.0 };
                
                const programSpecialties = [
                    ...(program.specialties || []),
                    ...(program.features || [])
                ].map(s => s.toLowerCase());
                
                const matchCount = values.filter(specialty => 
                    programSpecialties.some(ps => 
                        ps.includes(specialty.toLowerCase()) || 
                        specialty.toLowerCase().includes(ps)
                    )
                ).length;
                
                const matches = options.requireAll ? 
                    matchCount === values.length : 
                    matchCount > 0;
                
                const score = matchCount / values.length;
                
                return { matches, score: score * this.predicates.specialties.weight };
            }
        };
        
        // Location/distance predicate
        this.predicates.distance = {
            name: 'Distance',
            category: 'location',
            weight: 0.8,
            filter: (program, config, options = {}) => {
                if (!config || !config.center) return { matches: true, score: 1.0 };
                if (!program.coordinates) return { matches: false, score: 0 };
                
                const distance = this.calculateDistance(
                    config.center.lat, config.center.lng,
                    program.coordinates.lat, program.coordinates.lng
                );
                
                const matches = distance <= config.radius;
                const score = matches ? 
                    (1 - (distance / config.radius)) * this.predicates.distance.weight : 0;
                
                return { matches, score, metadata: { distance } };
            }
        };
        
        // Program type predicate
        this.predicates.programType = {
            name: 'Program Type',
            category: 'clinical',
            weight: 1.0,
            filter: (program, values, options = {}) => {
                if (!values || values.length === 0) return { matches: true, score: 1.0 };
                
                const programTypes = [
                    program.type,
                    program.category,
                    ...(program.features || [])
                ].filter(Boolean).map(t => t.toLowerCase());
                
                const matches = values.some(type => 
                    programTypes.some(pt => pt.includes(type.toLowerCase()))
                );
                
                return { 
                    matches, 
                    score: matches ? this.predicates.programType.weight : 0 
                };
            }
        };
        
        // Data quality predicate
        this.predicates.dataQuality = {
            name: 'Data Quality',
            category: 'meta',
            weight: 0.5,
            filter: (program, minCompleteness, options = {}) => {
                const completeness = program.dataCompleteness || 
                    this.calculateCompleteness(program);
                
                const matches = completeness >= minCompleteness;
                const score = (completeness / 100) * this.predicates.dataQuality.weight;
                
                return { matches, score, metadata: { completeness } };
            }
        };
    }
    
    /**
     * Apply filters to programs
     */
    applyFilters(programs, filters, options = {}) {
        const startTime = performance.now();
        
        // Convert filters to predicate calls
        const predicateCalls = this.buildPredicateCalls(filters);
        
        // Filter and score programs
        const results = programs.map(program => {
            const scores = {};
            let totalScore = 0;
            let totalWeight = 0;
            let allMatch = true;
            
            predicateCalls.forEach(({ predicate, value, options: predOptions }) => {
                const result = predicate.filter(program, value, predOptions);
                scores[predicate.name] = result;
                
                if (!result.matches) {
                    allMatch = false;
                }
                
                if (result.score !== null) {
                    totalScore += result.score;
                    totalWeight += predicate.weight;
                }
            });
            
            const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
            
            return {
                program,
                matches: allMatch,
                score: finalScore,
                breakdown: scores
            };
        });
        
        // Filter and sort
        let filtered = results.filter(r => r.matches);
        
        if (options.sortBy === 'score') {
            filtered.sort((a, b) => b.score - a.score);
        } else if (options.sortBy === 'distance' && filters.location) {
            filtered.sort((a, b) => 
                (a.breakdown.Distance?.metadata?.distance || 999) - 
                (b.breakdown.Distance?.metadata?.distance || 999)
            );
        }
        
        const duration = performance.now() - startTime;
        
        // Record filter operation
        this.recordFilterOperation(filters, filtered.length, duration);
        
        return {
            results: filtered.map(r => r.program),
            scores: filtered.map(r => ({ id: r.program.id, score: r.score })),
            count: filtered.length,
            duration,
            preview: options.preview ? this.generatePreview(filters, results) : null
        };
    }
    
    /**
     * Build predicate calls from filters
     */
    buildPredicateCalls(filters) {
        const calls = [];
        
        if (filters.insurance?.length) {
            calls.push({
                predicate: this.predicates.insurance,
                value: filters.insurance,
                options: { requireAll: filters.insuranceRequireAll }
            });
        }
        
        if (filters.cost?.length) {
            calls.push({
                predicate: this.predicates.cost,
                value: filters.cost,
                options: {}
            });
        }
        
        if (filters.gender) {
            calls.push({
                predicate: this.predicates.gender,
                value: filters.gender,
                options: {}
            });
        }
        
        if (filters.age) {
            calls.push({
                predicate: this.predicates.age,
                value: filters.age,
                options: { strict: filters.ageStrict }
            });
        }
        
        if (filters.levelOfCare?.length) {
            calls.push({
                predicate: this.predicates.levelOfCare,
                value: filters.levelOfCare,
                options: { requireAll: filters.levelRequireAll }
            });
        }
        
        if (filters.specialties?.length) {
            calls.push({
                predicate: this.predicates.specialties,
                value: filters.specialties,
                options: { requireAll: filters.specialtiesRequireAll }
            });
        }
        
        if (filters.location) {
            calls.push({
                predicate: this.predicates.distance,
                value: filters.location,
                options: {}
            });
        }
        
        if (filters.programType?.length) {
            calls.push({
                predicate: this.predicates.programType,
                value: filters.programType,
                options: {}
            });
        }
        
        if (filters.minDataQuality) {
            calls.push({
                predicate: this.predicates.dataQuality,
                value: filters.minDataQuality,
                options: {}
            });
        }
        
        return calls;
    }
    
    /**
     * Generate filter impact preview
     */
    generatePreview(newFilters, currentResults) {
        const before = currentResults.filter(r => r.matches).length;
        const after = this.applyFilters(
            currentResults.map(r => r.program), 
            newFilters, 
            { preview: false }
        ).count;
        
        return {
            before,
            after,
            delta: after - before,
            percentage: before > 0 ? Math.round((after / before) * 100) : 0
        };
    }
    
    /**
     * Parse natural language query
     */
    parseNaturalLanguage(query) {
        return this.naturalLanguageParser.parse(query);
    }
    
    /**
     * Normalize insurance names
     */
    normalizeInsurance(insurance) {
        return insurance.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace('insurance', '');
    }
    
    /**
     * Parse age range from program
     */
    parseAgeRange(program) {
        // Implementation from intelligent-matching.js
        if (program.ageRange) return program.ageRange;
        
        const patterns = [
            /ages?\s*(\d+)\s*-\s*(\d+)/i,
            /(\d+)\s*to\s*(\d+)\s*years?/i
        ];
        
        const text = [program.name, program.features?.join(' ')].join(' ');
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return { min: parseInt(match[1]), max: parseInt(match[2]) };
            }
        }
        
        return null;
    }
    
    /**
     * Extract levels of care
     */
    extractLevelsOfCare(program) {
        const levels = [];
        const text = [
            program.type,
            program.category,
            program.name,
            ...(program.features || [])
        ].join(' ').toLowerCase();
        
        const levelMap = {
            'rtc': ['rtc', 'residential treatment', 'residential'],
            'php': ['php', 'partial hospitalization', 'day treatment'],
            'iop': ['iop', 'intensive outpatient'],
            'outpatient': ['outpatient', 'op'],
            'wilderness': ['wilderness', 'outdoor'],
            'therapeutic boarding': ['boarding school', 'therapeutic school']
        };
        
        Object.entries(levelMap).forEach(([level, terms]) => {
            if (terms.some(term => text.includes(term))) {
                levels.push(level);
            }
        });
        
        return levels;
    }
    
    /**
     * Calculate distance
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    /**
     * Calculate data completeness
     */
    calculateCompleteness(program) {
        const fields = [
            'name', 'location', 'type', 'insurance', 
            'costRange', 'coordinates', 'contact', 
            'features', 'genderServed', 'ageRange'
        ];
        
        const complete = fields.filter(field => {
            const value = program[field];
            return value && 
                   (Array.isArray(value) ? value.length > 0 : true) &&
                   value !== 'Information pending';
        });
        
        return Math.round((complete.length / fields.length) * 100);
    }
    
    /**
     * Record filter operation
     */
    recordFilterOperation(filters, resultCount, duration) {
        this.filterHistory.push({
            filters,
            resultCount,
            duration,
            timestamp: Date.now()
        });
        
        // Keep last 100 operations
        if (this.filterHistory.length > 100) {
            this.filterHistory = this.filterHistory.slice(-100);
        }
    }
    
    /**
     * Get filter suggestions
     */
    getFilterSuggestions(currentFilters, programs) {
        const suggestions = [];
        
        // Analyze current results
        const currentResults = this.applyFilters(programs, currentFilters);
        
        // Suggest based on result count
        if (currentResults.count === 0) {
            suggestions.push({
                type: 'expand',
                message: 'No results found. Try removing some filters.',
                action: this.suggestFilterRemovals(currentFilters)
            });
        } else if (currentResults.count < 5) {
            suggestions.push({
                type: 'expand',
                message: `Only ${currentResults.count} programs found. Consider:`,
                actions: [
                    { remove: 'specialties', label: 'Remove specialty requirements' },
                    { modify: 'location', label: 'Increase search radius' }
                ]
            });
        }
        
        // Suggest related filters
        if (currentFilters.specialties?.includes('DBT')) {
            suggestions.push({
                type: 'related',
                message: 'Programs with DBT often also offer:',
                add: ['Trauma-Informed Care', 'Mindfulness']
            });
        }
        
        return suggestions;
    }
    
    /**
     * Suggest filter removals
     */
    suggestFilterRemovals(filters) {
        const removals = [];
        
        // Prioritize removals by impact
        if (filters.specialties?.length > 2) {
            removals.push({ 
                field: 'specialties', 
                label: 'Reduce required specialties' 
            });
        }
        
        if (filters.insurance?.length === 1) {
            removals.push({ 
                field: 'insurance', 
                label: 'Consider private pay options' 
            });
        }
        
        return removals;
    }
    
    /**
     * Create smart filter presets
     */
    getSmartPresets(programs) {
        const presets = [];
        
        // Most common combinations from history
        const commonFilters = this.analyzeFilterHistory();
        commonFilters.forEach((filters, index) => {
            presets.push({
                id: `common_${index}`,
                name: `Popular Search ${index + 1}`,
                filters,
                icon: '⭐'
            });
        });
        
        // Quick filters
        presets.push({
            id: 'nearby_quality',
            name: 'Nearby High-Quality',
            filters: {
                location: { radius: 50 },
                minDataQuality: 80
            },
            icon: '📍'
        });
        
        presets.push({
            id: 'insurance_accepted',
            name: 'Accepts My Insurance',
            filters: {
                insurance: ['Medicaid', 'Medicare']
            },
            icon: '💳'
        });
        
        return presets;
    }
    
    /**
     * Analyze filter history
     */
    analyzeFilterHistory() {
        // Group similar filter combinations
        const combinations = new Map();
        
        this.filterHistory.forEach(entry => {
            const key = JSON.stringify(entry.filters);
            const existing = combinations.get(key) || { count: 0, filters: entry.filters };
            existing.count++;
            combinations.set(key, existing);
        });
        
        // Sort by frequency
        return Array.from(combinations.values())
            .sort((a, b) => b.count - a.count)
            .slice(0, 3)
            .map(c => c.filters);
    }
}

/**
 * Natural Language Parser for search queries
 */
class NaturalLanguageParser {
    constructor() {
        this.patterns = {
            programType: {
                regex: /\b(RTC|PHP|IOP|residential|wilderness|outpatient|boarding)\b/gi,
                field: 'programType',
                transform: (match) => match.toUpperCase()
            },
            age: {
                regex: /\b(\d+)[\s-]?years?[\s-]?old\b|\bage\s+(\d+)\b/gi,
                field: 'age',
                transform: (match) => {
                    const nums = match.match(/\d+/);
                    return nums ? parseInt(nums[0]) : null;
                }
            },
            gender: {
                regex: /\b(male|female|boys?|girls?|co-?ed)\b/gi,
                field: 'gender',
                transform: (match) => {
                    const lower = match.toLowerCase();
                    if (lower.includes('boy') || lower === 'male') return 'male';
                    if (lower.includes('girl') || lower === 'female') return 'female';
                    return 'co-ed';
                }
            },
            distance: {
                regex: /within\s+(\d+)\s*miles?\s*(of|from)?\s*(\d{5})?/gi,
                field: 'location',
                transform: (match) => {
                    const parts = match.match(/(\d+)\s*miles?.*?(\d{5})?/i);
                    return {
                        radius: parseInt(parts[1]),
                        zip: parts[2] || null
                    };
                }
            },
            insurance: {
                regex: /\b(medicaid|medicare|private|insurance|self-?pay)\b/gi,
                field: 'insurance',
                transform: (match) => {
                    const lower = match.toLowerCase();
                    if (lower.includes('medicaid')) return 'Medicaid';
                    if (lower.includes('medicare')) return 'Medicare';
                    if (lower.includes('private')) return 'Private';
                    if (lower.includes('self')) return 'Self-Pay';
                    return match;
                }
            },
            specialties: {
                regex: /\b(DBT|CBT|EMDR|trauma|eating disorder|substance|anxiety|depression|ADHD|autism|ASD)\b/gi,
                field: 'specialties',
                transform: (match) => match
            },
            cost: {
                regex: /\b(low|medium|high|affordable|expensive)\s*cost\b/gi,
                field: 'cost',
                transform: (match) => {
                    const lower = match.toLowerCase();
                    if (lower.includes('low') || lower.includes('affordable')) return ['$', '$$'];
                    if (lower.includes('medium')) return ['$$', '$$$'];
                    if (lower.includes('high') || lower.includes('expensive')) return ['$$$$', '$$$$$'];
                    return [];
                }
            }
        };
    }
    
    /**
     * Parse natural language query
     */
    parse(query) {
        const filters = {};
        const unused = query;
        
        // Extract filters using patterns
        Object.entries(this.patterns).forEach(([key, pattern]) => {
            const matches = query.matchAll(pattern.regex);
            const values = [];
            
            for (const match of matches) {
                const transformed = pattern.transform(match[0]);
                if (transformed) {
                    values.push(transformed);
                }
            }
            
            if (values.length > 0) {
                if (pattern.field === 'location' && values[0].radius) {
                    filters[pattern.field] = values[0];
                } else if (pattern.field === 'age' || pattern.field === 'gender') {
                    filters[pattern.field] = values[0];
                } else {
                    filters[pattern.field] = values;
                }
            }
        });
        
        // Extract location from ZIP codes not caught by distance pattern
        const zipMatch = query.match(/\b(\d{5})\b/);
        if (zipMatch && !filters.location) {
            filters.location = { zip: zipMatch[1], radius: 50 };
        }
        
        return {
            filters,
            original: query,
            confidence: this.calculateConfidence(filters, query)
        };
    }
    
    /**
     * Calculate parsing confidence
     */
    calculateConfidence(filters, query) {
        const filterCount = Object.keys(filters).length;
        const queryWords = query.split(/\s+/).length;
        
        // More filters from fewer words = higher confidence
        const ratio = filterCount / queryWords;
        return Math.min(100, Math.round(ratio * 200));
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.AdvancedFilterSystem = AdvancedFilterSystem;
    window.NaturalLanguageParser = NaturalLanguageParser;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdvancedFilterSystem, NaturalLanguageParser };
}

