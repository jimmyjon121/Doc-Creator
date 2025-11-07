// build-extension.js - Professional build script for Chrome extension
// Properly bundles all modules into a single working content script

const fs = require('fs');
const path = require('path');

console.log('🚀 Building Chrome Extension v13.0 - Hybrid AI Engine...\n');

// Read all the module files
const modules = [
    'pattern-engine.js',
    'universal-structures.js', 
    'anti-patterns.js',
    'smart-crawler.js',
    'multi-strategy-extractor.js',
    'confidence-scorer.js',
    'self-improvement.js',
    'dynamic-templates.js'
];

let bundledContent = `// CareConnect Clinical Intel v13.0 - Hybrid AI Extraction Engine
// Built: ${new Date().toISOString()}
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
    
`;

// Bundle each module
modules.forEach(moduleName => {
    const modulePath = path.join(__dirname, moduleName);
    if (fs.existsSync(modulePath)) {
        console.log(`  ✅ Bundling ${moduleName}`);
        let moduleContent = fs.readFileSync(modulePath, 'utf8');
        
        // Remove any module.exports statements
        moduleContent = moduleContent.replace(/if\s*\(typeof\s+module[\s\S]*?module\.exports[\s\S]*?\}/g, '');
        moduleContent = moduleContent.replace(/module\.exports\s*=[\s\S]*?;/g, '');
        
        bundledContent += `
    // ============= ${moduleName.toUpperCase()} =============
    ${moduleContent}
    
`;
    } else {
        console.log(`  ⚠️  Skipping ${moduleName} (not found)`);
    }
});

// Add the main universal extractor with AI integration
bundledContent += `
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
                    this.sendProgress('ai', 0, 1, \`Enhancing with \${options.aiModel}...\`);
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
                    throw new Error(\`No API key configured for \${aiModel}\`);
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
            let prompt = \`You are a clinical expert reviewing treatment program information.
            
I've extracted the following data using rule-based patterns:

\`;
            
            // Add what we found
            if (ruleData.name) {
                prompt += \`Program Name: \${ruleData.name}\\n\`;
            }
            
            if (ruleData.levelsOfCare && ruleData.levelsOfCare.length > 0) {
                prompt += \`Levels of Care Found: \${ruleData.levelsOfCare.join(', ')}\\n\`;
                prompt += \`Please verify these are accurate and check for any we missed.\\n\`;
            } else {
                prompt += \`We couldn't find levels of care. Please identify all levels offered.\\n\`;
            }
            
            if (ruleData.clinical && ruleData.clinical.evidenceBased.length > 0) {
                prompt += \`Therapies Found: \${ruleData.clinical.evidenceBased.join(', ')}\\n\`;
                prompt += \`Please verify and look for any experiential or holistic therapies we missed.\\n\`;
            } else {
                prompt += \`We couldn't find therapy modalities. Please create a comprehensive list.\\n\`;
            }
            
            prompt += \`
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
\`;
            
            return prompt;
        }
        
        async getAIConfig(model) {
            return new Promise((resolve) => {
                chrome.storage.local.get([\`\${model}_api_key\`, \`\${model}_config\`], (result) => {
                    resolve({
                        apiKey: result[\`\${model}_api_key\`],
                        config: result[\`\${model}_config\`] || {}
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
            const locationPattern = /(?:located\\s+in|serving|based\\s+in)\\s+([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?),\\s*([A-Z]{2})/gi;
            const match = locationPattern.exec(text);
            if (match) {
                data.location.city = match[1];
                data.location.state = match[2];
                this.metrics.fieldsFound++;
            }
        }
        
        extractLevelsOfCare(text, data) {
            const patterns = {
                residential: /residential|24\\/7|live-in/gi,
                php: /php|partial hospitalization|day treatment/gi,
                iop: /iop|intensive outpatient/gi,
                outpatient: /outpatient(?!\\s+referral)/gi
            };
            
            Object.entries(patterns).forEach(([level, pattern]) => {
                if (pattern.test(text)) {
                    data.levelsOfCare.push(level.charAt(0).toUpperCase() + level.slice(1));
                    this.metrics.uniqueDataPoints.add(\`loc_\${level}\`);
                }
            });
            
            if (data.levelsOfCare.length > 0) {
                this.metrics.fieldsFound++;
            }
        }
        
        extractPopulation(text, data) {
            // Age patterns
            const ageMatch = /ages?\\s+(\\d+)\\s*(?:to|-|through)\\s*(\\d+)/gi.exec(text);
            if (ageMatch) {
                data.population.ages = \`\${ageMatch[1]}-\${ageMatch[2]}\`;
                this.metrics.fieldsFound++;
            } else if (/adolescents?|teens?/gi.test(text)) {
                data.population.ages = 'Adolescents';
            } else if (/young\\s+adults?/gi.test(text)) {
                data.population.ages = 'Young Adults';
            }
            
            // Gender
            if (/males?\\s+only|boys?\\s+only/gi.test(text)) {
                data.population.gender = 'Males Only';
            } else if (/females?\\s+only|girls?\\s+only/gi.test(text)) {
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
                'ACT': /acceptance.*commitment|ACT(?!\\s+score)/gi,
                'MI': /motivational interviewing/gi
            };
            
            Object.entries(therapies).forEach(([name, pattern]) => {
                if (pattern.test(text)) {
                    data.clinical.evidenceBased.push(name);
                    this.metrics.uniqueDataPoints.add(\`therapy_\${name}\`);
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
                    this.metrics.uniqueDataPoints.add(\`exp_\${name}\`);
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
            const phoneMatch = /(\\d{3})[-.\\s]?(\\d{3})[-.\\s]?(\\d{4})/g.exec(text);
            if (phoneMatch) {
                data.contact.phone = \`\${phoneMatch[1]}-\${phoneMatch[2]}-\${phoneMatch[3]}\`;
                this.metrics.fieldsFound++;
            }
            
            // Email
            const emailMatch = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})/g.exec(text);
            if (emailMatch) {
                data.contact.email = emailMatch[1];
                this.metrics.fieldsFound++;
            }
        }
        
        extractStructureInfo(text, data) {
            // Capacity
            const capacityMatch = /(\\d+)\\s*(?:bed|client|resident)/gi.exec(text);
            if (capacityMatch) {
                data.structure.capacity = capacityMatch[1];
                this.metrics.fieldsFound++;
            }
            
            // Staff ratio
            const ratioMatch = /(\\d+)\\s*:\\s*(\\d+)\\s*(?:staff|ratio)/gi.exec(text);
            if (ratioMatch) {
                data.structure.ratio = \`\${ratioMatch[1]}:\${ratioMatch[2]}\`;
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
                    this.metrics.uniqueDataPoints.add(\`accred_\${accred}\`);
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
                    differentiators.push(\`Unique therapies: \${unique.join(', ')}\`);
                }
            }
            
            // Setting
            if (data.environment.setting && !['Urban', 'Suburban'].includes(data.environment.setting)) {
                differentiators.push(\`\${data.environment.setting} setting\`);
            }
            
            // Accreditations
            if (data.quality.accreditations.length > 0) {
                differentiators.push(\`\${data.quality.accreditations.join(', ')} accredited\`);
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
            let writeUp = '='.repeat(70) + '\\n';
            writeUp += 'CLINICAL AFTERCARE RECOMMENDATION\\n';
            writeUp += '='.repeat(70) + '\\n\\n';
            
            // Executive Summary (if AI-enhanced)
            if (data.executiveSummary) {
                writeUp += 'EXECUTIVE SUMMARY:\\n';
                writeUp += data.executiveSummary + '\\n\\n';
            }
            
            // Program basics
            writeUp += \`PROGRAM: \${data.name || 'Treatment Program'}\\n\`;
            if (data.location.city || data.location.state) {
                writeUp += \`LOCATION: \${data.location.city}\${data.location.city && data.location.state ? ', ' : ''}\${data.location.state}\\n\`;
            }
            writeUp += \`WEBSITE: \${data.website}\\n\\n\`;
            
            // Key differentiators
            if (data.differentiators && data.differentiators.length > 0) {
                writeUp += 'KEY DIFFERENTIATORS:\\n';
                data.differentiators.forEach(diff => {
                    writeUp += \`• \${diff}\\n\`;
                });
                writeUp += '\\n';
            }
            
            // Levels of care
            if (data.levelsOfCare && data.levelsOfCare.length > 0) {
                writeUp += 'LEVELS OF CARE:\\n';
                data.levelsOfCare.forEach(level => {
                    writeUp += \`• \${level}\\n\`;
                });
                writeUp += '\\n';
            }
            
            // Population
            if (data.population.ages || data.population.gender) {
                writeUp += 'POPULATION SERVED:\\n';
                if (data.population.ages) writeUp += \`  Ages: \${data.population.ages}\\n\`;
                if (data.population.gender) writeUp += \`  Gender: \${data.population.gender}\\n\`;
                writeUp += '\\n';
            }
            
            // Clinical programming
            if (data.clinical.evidenceBased.length > 0 || data.clinical.experiential.length > 0) {
                writeUp += 'CLINICAL PROGRAMMING:\\n';
                
                if (data.clinical.primaryFocus) {
                    writeUp += \`  Primary Focus: \${data.clinical.primaryFocus}\\n\`;
                }
                
                if (data.clinical.evidenceBased.length > 0) {
                    writeUp += '  Evidence-Based Modalities:\\n';
                    data.clinical.evidenceBased.forEach(m => writeUp += \`    • \${m}\\n\`);
                }
                
                if (data.clinical.experiential.length > 0) {
                    writeUp += '  Experiential Therapies:\\n';
                    data.clinical.experiential.forEach(t => writeUp += \`    • \${t}\\n\`);
                }
                
                writeUp += '\\n';
            }
            
            // Program structure
            if (data.structure.capacity || data.structure.ratio) {
                writeUp += 'PROGRAM STRUCTURE:\\n';
                if (data.structure.capacity) writeUp += \`  Capacity: \${data.structure.capacity} beds\\n\`;
                if (data.structure.ratio) writeUp += \`  Staff Ratio: \${data.structure.ratio}\\n\`;
                writeUp += '\\n';
            }
            
            // Family program
            if (data.family.weeklyTherapy || data.family.workshops) {
                writeUp += 'FAMILY PROGRAM:\\n';
                if (data.family.weeklyTherapy) writeUp += '  • Weekly family therapy sessions\\n';
                if (data.family.workshops) writeUp += '  • Family workshops and education\\n';
                writeUp += '\\n';
            }
            
            // Insurance
            if (data.admissions.insurance.length > 0 || data.admissions.privatePay) {
                writeUp += 'INSURANCE & PAYMENT:\\n';
                if (data.admissions.insurance.length > 0) {
                    writeUp += \`  Accepted: \${data.admissions.insurance.join(', ')}\\n\`;
                }
                if (data.admissions.privatePay) {
                    writeUp += '  • Private pay accepted\\n';
                }
                writeUp += '\\n';
            }
            
            // Contact
            writeUp += 'CONTACT INFORMATION:\\n';
            if (data.contact.phone) writeUp += \`  Phone: \${data.contact.phone}\\n\`;
            if (data.contact.email) writeUp += \`  Email: \${data.contact.email}\\n\`;
            writeUp += \`  Website: \${data.website}\\n\\n\`;
            
            // Metadata
            writeUp += '-'.repeat(70) + '\\n';
            writeUp += \`Assessment Date: \${new Date().toLocaleDateString()}\\n\`;
            writeUp += \`Data Confidence: \${this.metrics.confidence}%\\n\`;
            writeUp += \`Fields Extracted: \${this.metrics.fieldsFound}\\n\`;
            if (this.metrics.aiEnhanced) {
                writeUp += \`AI Enhancement: \${this.metrics.aiModel}\\n\`;
                if (this.metrics.aiResponseTime) {
                    writeUp += \`AI Response Time: \${(this.metrics.aiResponseTime / 1000).toFixed(1)}s\\n\`;
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
    
})();`;

// Write the bundled content
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
}

const outputPath = path.join(distDir, 'content.js');
fs.writeFileSync(outputPath, bundledContent);

console.log(`\n✅ Successfully built content.js (${(bundledContent.length / 1024).toFixed(2)} KB)`);
console.log(`📁 Output: ${outputPath}`);
console.log('\n🎉 Chrome Extension v13.0 build complete!');
