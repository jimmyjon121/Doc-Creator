/**
 * Intelligent Matching System for CareConnect Pro
 * Provides AI-powered program recommendations based on client profiles
 */

class IntelligentMatchingSystem {
    constructor() {
        this.weights = {
            insurance: 0.30,
            location: 0.25,
            services: 0.25,
            age: 0.10,
            gender: 0.10
        };
        
        this.distanceDecay = 0.5; // How quickly match score decreases with distance
        this.historicalData = [];
        this.recommendations = new Map();
    }
    
    /**
     * Generate unique ID for profiles
     */
    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    /**
     * Create client profile structure
     */
    createClientProfile(data) {
        return {
            id: data.id || this.generateUUID(),
            criteria: {
                age: data.age || null,
                gender: data.gender || null,
                insurance: Array.isArray(data.insurance) ? data.insurance : [],
                diagnoses: Array.isArray(data.diagnoses) ? data.diagnoses : [],
                requiredServices: Array.isArray(data.requiredServices) ? data.requiredServices : [],
                location: data.location || { zip: null, maxRadius: 50 },
                levelOfCare: data.levelOfCare || [],
                specialNeeds: data.specialNeeds || [],
                excludePrograms: data.excludePrograms || []
            },
            preferences: {
                programSize: data.programSize || null, // small, medium, large
                setting: data.setting || null, // urban, suburban, rural
                philosophy: data.philosophy || [], // evidence-based, holistic, faith-based
                amenities: data.amenities || []
            },
            timestamp: Date.now(),
            sessionId: null, // No PHI
            templateName: data.templateName || null
        };
    }
    
    /**
     * Calculate match score for a program
     */
    calculateMatchScore(program, profile) {
        const scores = {
            insurance: this.matchInsurance(program, profile),
            location: this.matchLocation(program, profile),
            services: this.matchServices(program, profile),
            age: this.matchAge(program, profile),
            gender: this.matchGender(program, profile)
        };
        
        // Calculate weighted score
        let totalScore = 0;
        let totalWeight = 0;
        
        Object.entries(scores).forEach(([factor, score]) => {
            if (score !== null) {
                totalScore += score * this.weights[factor];
                totalWeight += this.weights[factor];
            }
        });
        
        // Normalize to 0-100
        const normalizedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
        
        // Apply exclusions
        if (profile.criteria.excludePrograms.includes(program.id)) {
            return 0;
        }
        
        return {
            score: Math.round(normalizedScore),
            breakdown: scores,
            confidence: this.calculateConfidence(scores)
        };
    }
    
    /**
     * Match insurance coverage
     */
    matchInsurance(program, profile) {
        if (!profile.criteria.insurance.length) return null;
        if (!program.insurance || !program.insurance.length) return 0;
        
        const programInsurance = Array.isArray(program.insurance) ? 
            program.insurance : [program.insurance];
        
        // Check for exact matches
        const matches = profile.criteria.insurance.filter(ins => 
            programInsurance.some(pIns => 
                this.normalizeInsurance(pIns).includes(this.normalizeInsurance(ins))
            )
        );
        
        // Perfect match if all requested insurance accepted
        if (matches.length === profile.criteria.insurance.length) return 1.0;
        
        // Partial match
        if (matches.length > 0) return matches.length / profile.criteria.insurance.length;
        
        // Check for private insurance compatibility
        if (profile.criteria.insurance.includes('Private') && 
            programInsurance.some(ins => ins.toLowerCase().includes('private'))) {
            return 0.8;
        }
        
        return 0;
    }
    
    /**
     * Normalize insurance names for matching
     */
    normalizeInsurance(insurance) {
        return insurance.toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .replace('insurance', '')
            .replace('medicaid', 'medicaid')
            .replace('medicare', 'medicare');
    }
    
    /**
     * Match location and distance
     */
    matchLocation(program, profile) {
        if (!profile.criteria.location.zip) return null;
        if (!program.coordinates) return 0;
        
        // Get coordinates for ZIP code (would need geocoding service)
        const clientCoords = this.getZipCoordinates(profile.criteria.location.zip);
        if (!clientCoords) return 0;
        
        const distance = this.calculateDistance(
            clientCoords.lat, clientCoords.lng,
            program.coordinates.lat, program.coordinates.lng
        );
        
        const maxRadius = profile.criteria.location.maxRadius;
        
        // Outside radius
        if (distance > maxRadius) return 0;
        
        // Calculate score based on distance (closer = better)
        // Using exponential decay
        const normalizedDistance = distance / maxRadius;
        return Math.exp(-normalizedDistance * this.distanceDecay);
    }
    
    /**
     * Calculate distance between coordinates
     */
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 3959; // Earth's radius in miles
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
    
    /**
     * Get ZIP code coordinates (placeholder - would need real geocoding)
     */
    getZipCoordinates(zip) {
        // This would normally use a geocoding service
        // For now, return some common coordinates
        const commonZips = {
            '02134': { lat: 42.3601, lng: -71.0589 }, // Boston
            '10001': { lat: 40.7128, lng: -74.0060 }, // NYC
            '90210': { lat: 34.0522, lng: -118.2437 }, // LA
            '60601': { lat: 41.8781, lng: -87.6298 }, // Chicago
        };
        
        return commonZips[zip] || { lat: 39.8283, lng: -98.5795 }; // US center
    }
    
    /**
     * Match services and specialties
     */
    matchServices(program, profile) {
        if (!profile.criteria.requiredServices.length) return null;
        
        const programServices = [
            ...(program.specialties || []),
            ...(program.features || [])
        ].map(s => s.toLowerCase());
        
        if (!programServices.length) return 0;
        
        let matchCount = 0;
        let importantMatchCount = 0;
        
        profile.criteria.requiredServices.forEach(service => {
            const serviceLower = service.toLowerCase();
            const isMatch = programServices.some(ps => 
                ps.includes(serviceLower) || serviceLower.includes(ps)
            );
            
            if (isMatch) {
                matchCount++;
                // Boost score for critical services
                if (this.isCriticalService(service)) {
                    importantMatchCount++;
                }
            }
        });
        
        // Calculate base score
        let score = matchCount / profile.criteria.requiredServices.length;
        
        // Bonus for important services
        if (importantMatchCount > 0) {
            score = Math.min(1.0, score + (importantMatchCount * 0.1));
        }
        
        return score;
    }
    
    /**
     * Check if service is critical
     */
    isCriticalService(service) {
        const critical = ['DBT', 'trauma', 'substance', 'eating disorder', 'self-harm'];
        return critical.some(c => service.toLowerCase().includes(c));
    }
    
    /**
     * Match age requirements
     */
    matchAge(program, profile) {
        if (!profile.criteria.age) return null;
        
        // Parse age range from program
        const ageRange = this.parseAgeRange(program);
        if (!ageRange) return 0.5; // Unknown age range
        
        const clientAge = profile.criteria.age;
        
        // Perfect match
        if (clientAge >= ageRange.min && clientAge <= ageRange.max) {
            return 1.0;
        }
        
        // Close match (within 1 year)
        if (clientAge >= ageRange.min - 1 && clientAge <= ageRange.max + 1) {
            return 0.7;
        }
        
        // No match
        return 0;
    }
    
    /**
     * Parse age range from program data
     */
    parseAgeRange(program) {
        if (program.ageRange) {
            return program.ageRange;
        }
        
        // Try to parse from features or description
        const agePatterns = [
            /ages?\s*(\d+)\s*-\s*(\d+)/i,
            /(\d+)\s*to\s*(\d+)\s*years?/i,
            /adolescents?\s*\((\d+)\s*-\s*(\d+)\)/i
        ];
        
        const searchText = [
            program.name,
            program.features?.join(' '),
            program.description
        ].filter(Boolean).join(' ');
        
        for (const pattern of agePatterns) {
            const match = searchText.match(pattern);
            if (match) {
                return {
                    min: parseInt(match[1]),
                    max: parseInt(match[2])
                };
            }
        }
        
        // Common age ranges based on program type
        if (searchText.toLowerCase().includes('adolescent')) {
            return { min: 12, max: 18 };
        }
        if (searchText.toLowerCase().includes('young adult')) {
            return { min: 18, max: 25 };
        }
        if (searchText.toLowerCase().includes('adult')) {
            return { min: 18, max: 99 };
        }
        
        return null;
    }
    
    /**
     * Match gender requirements
     */
    matchGender(program, profile) {
        if (!profile.criteria.gender) return null;
        
        const programGender = program.genderServed || this.parseGender(program);
        if (!programGender) return 0.5; // Unknown gender
        
        const clientGender = profile.criteria.gender.toLowerCase();
        const pGender = programGender.toLowerCase();
        
        // Exact match
        if (pGender === clientGender) return 1.0;
        
        // Co-ed programs accept all
        if (pGender === 'co-ed' || pGender === 'coed' || pGender === 'all') {
            return 0.9;
        }
        
        // No match
        return 0;
    }
    
    /**
     * Parse gender from program data
     */
    parseGender(program) {
        const searchText = [
            program.name,
            program.features?.join(' '),
            program.description
        ].filter(Boolean).join(' ').toLowerCase();
        
        if (searchText.includes('boys') || searchText.includes('male')) return 'male';
        if (searchText.includes('girls') || searchText.includes('female')) return 'female';
        if (searchText.includes('co-ed') || searchText.includes('coed')) return 'co-ed';
        
        return null;
    }
    
    /**
     * Calculate confidence score
     */
    calculateConfidence(scores) {
        const validScores = Object.values(scores).filter(s => s !== null);
        if (validScores.length === 0) return 0;
        
        // Confidence based on data completeness and score consistency
        const avgScore = validScores.reduce((a, b) => a + b, 0) / validScores.length;
        const variance = validScores.reduce((sum, score) => 
            sum + Math.pow(score - avgScore, 2), 0) / validScores.length;
        
        // High confidence if consistent scores and complete data
        const consistency = 1 - Math.sqrt(variance);
        const completeness = validScores.length / Object.keys(scores).length;
        
        return Math.round((consistency * 0.7 + completeness * 0.3) * 100);
    }
    
    /**
     * Get recommendations for a profile
     */
    getRecommendations(profile, programs, limit = 10) {
        const results = programs.map(program => {
            const matchResult = this.calculateMatchScore(program, profile);
            return {
                program,
                ...matchResult
            };
        });
        
        // Sort by score
        results.sort((a, b) => b.score - a.score);
        
        // Get top matches
        const topMatches = results.slice(0, limit);
        
        // Add insights
        const insights = this.generateInsights(topMatches, profile);
        
        // Store for learning
        this.storeRecommendation(profile, topMatches);
        
        return {
            matches: topMatches,
            insights,
            alternativeSearches: this.suggestAlternatives(results, profile)
        };
    }
    
    /**
     * Generate insights about recommendations
     */
    generateInsights(matches, profile) {
        const insights = [];
        
        // Check if top matches are clustered geographically
        if (matches.length >= 3) {
            const distances = matches.slice(0, 3).map(m => {
                if (!m.program.coordinates) return null;
                const coords = this.getZipCoordinates(profile.criteria.location.zip);
                return this.calculateDistance(
                    coords.lat, coords.lng,
                    m.program.coordinates.lat, m.program.coordinates.lng
                );
            }).filter(Boolean);
            
            if (distances.length > 0) {
                const avgDistance = distances.reduce((a, b) => a + b, 0) / distances.length;
                insights.push({
                    type: 'distance',
                    message: `Top programs average ${Math.round(avgDistance)} miles from your location`
                });
            }
        }
        
        // Check insurance coverage
        const withInsurance = matches.filter(m => m.breakdown.insurance > 0.5);
        if (withInsurance.length < matches.length / 2) {
            insights.push({
                type: 'insurance',
                message: 'Limited programs accept your insurance. Consider private pay options.'
            });
        }
        
        // Check service availability
        const perfectServiceMatch = matches.filter(m => m.breakdown.services === 1.0);
        if (perfectServiceMatch.length === 0) {
            insights.push({
                type: 'services',
                message: 'No programs offer all requested services. Results show best partial matches.'
            });
        }
        
        return insights;
    }
    
    /**
     * Suggest alternative searches
     */
    suggestAlternatives(results, profile) {
        const alternatives = [];
        
        // If few good matches, suggest expanding radius
        const goodMatches = results.filter(r => r.score > 70);
        if (goodMatches.length < 5) {
            const newRadius = profile.criteria.location.maxRadius + 25;
            alternatives.push({
                type: 'radius',
                suggestion: `Expand search radius to ${newRadius} miles`,
                action: { maxRadius: newRadius }
            });
        }
        
        // If no insurance matches, suggest self-pay
        const insuranceMatches = results.filter(r => r.breakdown.insurance > 0);
        if (insuranceMatches.length === 0) {
            alternatives.push({
                type: 'insurance',
                suggestion: 'Include private pay programs',
                action: { includePrivatePay: true }
            });
        }
        
        // Suggest related services
        if (profile.criteria.requiredServices.includes('DBT')) {
            alternatives.push({
                type: 'services',
                suggestion: 'Also consider programs with CBT',
                action: { additionalServices: ['CBT'] }
            });
        }
        
        return alternatives;
    }
    
    /**
     * Store recommendation for learning
     */
    storeRecommendation(profile, matches) {
        const record = {
            timestamp: Date.now(),
            profileHash: this.hashProfile(profile),
            topMatches: matches.slice(0, 5).map(m => ({
                programId: m.program.id,
                score: m.score
            }))
        };
        
        this.historicalData.push(record);
        
        // Keep only recent data
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        this.historicalData = this.historicalData.filter(r => r.timestamp > thirtyDaysAgo);
    }
    
    /**
     * Hash profile for privacy
     */
    hashProfile(profile) {
        const key = JSON.stringify({
            age: profile.criteria.age,
            gender: profile.criteria.gender,
            services: profile.criteria.requiredServices.sort(),
            insurance: profile.criteria.insurance.sort()
        });
        
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < key.length; i++) {
            const char = key.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString(36);
    }
    
    /**
     * Get similar profiles from history
     */
    getSimilarProfiles(profile) {
        const profileHash = this.hashProfile(profile);
        return this.historicalData.filter(r => r.profileHash === profileHash);
    }
    
    /**
     * Learn from historical data
     */
    analyzePatterns() {
        const patterns = {
            popularPrograms: new Map(),
            commonCombinations: new Map(),
            successfulMatches: []
        };
        
        // Count program frequency
        this.historicalData.forEach(record => {
            record.topMatches.forEach(match => {
                const count = patterns.popularPrograms.get(match.programId) || 0;
                patterns.popularPrograms.set(match.programId, count + 1);
            });
        });
        
        // Find common service combinations
        // This would analyze which services are often searched together
        
        return patterns;
    }
    
    /**
     * Create profile templates
     */
    static getProfileTemplates() {
        return {
            'Adolescent Male DBT': {
                age: 16,
                gender: 'male',
                insurance: ['Private'],
                requiredServices: ['DBT', 'Trauma-Informed Care'],
                levelOfCare: ['RTC', 'PHP']
            },
            'Young Adult Female Eating Disorder': {
                age: 20,
                gender: 'female',
                insurance: ['Private', 'Medicaid'],
                requiredServices: ['Eating Disorder', 'DBT', 'Nutrition'],
                levelOfCare: ['RTC', 'PHP', 'IOP']
            },
            'Teen Substance Abuse': {
                age: 17,
                gender: 'co-ed',
                insurance: ['Private'],
                requiredServices: ['Substance Abuse', 'Dual Diagnosis', 'Family Therapy'],
                levelOfCare: ['RTC', 'Wilderness']
            },
            'Child Autism Spectrum': {
                age: 10,
                gender: 'co-ed',
                insurance: ['Medicaid'],
                requiredServices: ['ASD', 'Social Skills', 'Behavioral Therapy'],
                levelOfCare: ['Day Treatment', 'Outpatient']
            }
        };
    }
}

// Export for use in browser
if (typeof window !== 'undefined') {
    window.IntelligentMatchingSystem = IntelligentMatchingSystem;
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntelligentMatchingSystem;
}

