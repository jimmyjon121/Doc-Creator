// extractor-v11.js - Advanced Clinical Data Extractor with Multi-AI Support
// Version 11.0 - Superior Rule-Based Extraction with Optional AI Enhancement

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__CC_EXTRACTOR_V11__) {
        return;
    }
    window.__CC_EXTRACTOR_V11__ = true;
    
    console.log('[CareConnect] Advanced Extractor v11.0 Initialized');
    
    // Advanced extraction patterns and rules
    const EXTRACTION_PATTERNS = {
        // Levels of Care - Strict patterns
        levelsOfCare: {
            residential: /(?:offer|provid|deliver|specializ|focus)\w*\s+(?:in\s+)?residential(?:\s+treatment)?(?!\s+aftercare)/gi,
            php: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?(?:PHP|partial\s+hospitalization)(?!\s+referral)/gi,
            iop: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?(?:IOP|intensive\s+outpatient)(?!\s+referral)/gi,
            outpatient: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?outpatient(?:\s+(?:treatment|therapy|services))?(?!\s+referral)/gi,
            detox: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?(?:detox|detoxification)(?:\s+services)?/gi,
            soberLiving: /(?:offer|provid|deliver)\w*\s+(?:in\s+)?sober\s+living/gi
        },
        
        // Population - More specific patterns
        population: {
            maleOnly: /(?:exclusively?\s+)?(?:males?\s+only|boys?\s+only|young\s+men\s+only|all[\-\s]male)/gi,
            femaleOnly: /(?:exclusively?\s+)?(?:females?\s+only|girls?\s+only|young\s+women\s+only|all[\-\s]female)/gi,
            ages: /(?:ages?|serving)\s+(\d+)\s*(?:to|-|through)\s*(\d+)|(?:adolescents?|teens?|young\s+adults?)/gi,
            lgbtq: /LGBTQ(?:\+)?[\s\-](?:friendly|affirming|specialization)/gi
        },
        
        // Clinical Modalities - Evidence-based
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
        
        // Experiential Therapies
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
        
        // Specializations
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
        
        // Setting/Environment
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
        
        // Program Structure
        structure: {
            capacity: /(?:capacity|serves?|beds?)\s*(?:of\s+)?(?:up\s+to\s+)?(\d+)\s+(?:clients?|students?|residents?)/gi,
            ratio: /(\d+)[\s:](?:to|:)[\s:](\d+)\s+(?:staff|client|student)[\s\-]ratio/gi,
            los: /(?:length\s+of\s+stay|program\s+length|duration)[:\s]+([^\.,]+)/gi,
            phases: /(?:phase|level|stage)\s+(?:system|program)|(\d+)[\s\-](?:phase|level|stage)s?/gi,
            groupSize: /(?:group\s+size|small\s+groups?)\s*(?:of\s+)?(\d+[\s\-]?\d*)/gi
        },
        
        // Academic Information
        academics: {
            onSite: /(?:on[\s\-]site|onsite)\s+(?:school|academic|education)/gi,
            accreditation: /(?:accredited|accreditation)\s+(?:by|through)\s+([^,\.]+)/gi,
            grades: /(?:grades?|serving)\s+(K|\d+)(?:[\s\-](?:through|to|and)\s+)?(\d+)?/gi,
            collegeCounseling: /college\s+(?:counseling|prep|preparation|placement)/gi,
            iep504: /(?:IEP|504|special\s+education|learning\s+(?:differences|disabilities))/gi,
            creditRecovery: /credit\s+recovery/gi,
            apHonors: /(?:AP|advanced\s+placement|honors)\s+(?:classes|courses)/gi
        },
        
        // Staff/Credentials
        credentials: {
            psychiatrist: /psychiatrists?(?:\s+on[\s\-]staff)?/gi,
            psychologist: /psychologists?/gi,
            lcsw: /(?:LCSW|licensed\s+clinical\s+social)/gi,
            lpc: /(?:LPC|licensed\s+professional\s+counselor)/gi,
            lmft: /(?:LMFT|licensed\s+marriage)/gi,
            ladc: /(?:LADC|CADC|licensed\s+alcohol)/gi,
            rn: /(?:RN|registered\s+nurse)/gi,
            lpn: /(?:LPN|licensed\s+practical)/gi,
            masters: /(?:master'?s?[\s\-]level|MSW|MA|MS)\s+(?:therapists?|clinicians?)/gi,
            boardCertified: /board[\s\-]certified/gi
        },
        
        // Quality Indicators
        quality: {
            jointCommission: /(?:joint\s+commission|JCAHO|JC[\s\-]accredited)/gi,
            carf: /CARF[\s\-](?:accredited|certified)/gi,
            natsap: /NATSAP\s+(?:member|affiliated)/gi,
            cognia: /(?:Cognia|AdvancED)[\s\-]accredited/gi,
            traumaInformed: /trauma[\s\-]informed(?:\s+care)?/gi,
            evidenceBased: /evidence[\s\-]based(?:\s+practice)?/gi,
            familyInvolvement: /family\s+(?:involvement|therapy|program|weekends?)/gi,
            aftercare: /(?:aftercare|alumni|continuing\s+care)\s+(?:program|services|support)/gi,
            outcomes: /(?:outcomes?|success\s+rate|track\s+outcomes)/gi
        },
        
        // Insurance/Payment
        insurance: {
            accepts: /(?:accept|take|work\s+with)\s+(?:most\s+)?(?:insurance|private\s+insurance)/gi,
            inNetwork: /in[\s\-]network\s+(?:with|provider)/gi,
            outOfNetwork: /out[\s\-]of[\s\-]network/gi,
            privatePay: /(?:private[\s\-]pay|self[\s\-]pay|cash[\s\-]pay)/gi,
            financing: /(?:financing|payment\s+plans?)\s+available/gi,
            scholarship: /(?:scholarships?|financial\s+aid)\s+available/gi,
            medicaid: /(?:medicaid|medicare|state\s+insurance)/gi,
            tricare: /(?:tricare|military\s+insurance)/gi,
            providers: /(?:Aetna|BCBS|Blue\s+Cross|Cigna|United|UnitedHealth|Anthem|Humana|Kaiser|Magellan|Optum|Beacon)/gi
        }
    };
    
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract-v2') {
            console.log('[CareConnect] Starting enhanced extraction...');
            performEnhancedExtraction(request.config).then(result => {
                sendResponse(result);
            }).catch(error => {
                console.error('[CareConnect] Extraction error:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;
        }
    });
    
    // Main extraction function
    async function performEnhancedExtraction(config) {
        const startTime = Date.now();
        const metrics = {
            fieldsFound: 0,
            pagesScanned: 0,
            uniqueDataPoints: new Set(),
            confidence: 0
        };
        
        try {
            // Send initial progress
            sendProgress('discovery', 0, 1, 'Analyzing website structure...');
            
            // Initialize comprehensive data structure
            const data = initializeDataStructure();
            
            // Extract from current page first
            const currentPageText = getCleanPageText(document);
            extractFromText(currentPageText, data, metrics);
            metrics.pagesScanned = 1;
            
            // Discover related pages
            sendProgress('discovery', 1, 1, 'Discovering related pages...');
            const relatedPages = await discoverRelatedPages();
            
            // Crawl related pages
            if (relatedPages.length > 0) {
                for (let i = 0; i < Math.min(relatedPages.length, 50); i++) {
                    const page = relatedPages[i];
                    sendProgress('crawling', i + 1, relatedPages.length, `Analyzing: ${page.title}`);
                    
                    try {
                        const pageContent = await fetchPage(page.url);
                        if (pageContent) {
                            const pageText = extractTextFromHTML(pageContent);
                            extractFromText(pageText, data, metrics);
                            metrics.pagesScanned++;
                        }
                    } catch (err) {
                        console.warn(`[CareConnect] Failed to fetch ${page.url}:`, err);
                    }
                    
                    // Small delay between requests
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Send metrics update
                    sendMetricsUpdate(metrics);
                }
            }
            
            // Consolidate and enhance data
            sendProgress('consolidation', 1, 1, 'Consolidating findings...');
            consolidateData(data);
            
            // AI Enhancement (if configured)
            if (config.aiModel) {
                sendProgress('ai-enhancement', 1, 1, `Enhancing with ${config.aiModel}...`);
                await enhanceWithAI(data, currentPageText + ' ' + getAllCrawledText(), config);
            }
            
            // Build differentiators
            buildDifferentiators(data);
            
            // Calculate final confidence
            metrics.confidence = calculateConfidence(data, metrics);
            
            // Final metrics
            metrics.fieldsFound = countFields(data);
            metrics.uniqueDataPoints = metrics.uniqueDataPoints.size;
            
            // Add metadata
            data.metadata = {
                extractionTime: Date.now() - startTime,
                pagesAnalyzed: metrics.pagesScanned,
                confidence: metrics.confidence,
                aiEnhanced: !!config.aiModel,
                version: '11.0'
            };
            
            console.log('[CareConnect] Extraction complete:', data);
            
            return {
                success: true,
                data: data,
                metrics: {
                    fieldsFound: metrics.fieldsFound,
                    pagesScanned: metrics.pagesScanned,
                    uniqueDataPoints: metrics.uniqueDataPoints,
                    confidence: metrics.confidence
                }
            };
            
        } catch (error) {
            console.error('[CareConnect] Extraction failed:', error);
            throw error;
        }
    }
    
    // Initialize comprehensive data structure
    function initializeDataStructure() {
        return {
            name: '',
            website: window.location.hostname,
            city: '',
            state: '',
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
                psychiatryAvailable: false,
                medicationManagement: false
            },
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
                    iep504: false,
                    creditRecovery: false,
                    apHonors: false
                }
            },
            environment: {
                setting: '',
                campusSizeAcre: '',
                facilities: [],
                amenities: [],
                recreation: []
            },
            staff: {
                credentials: [],
                leadership: [],
                psychiatristOnStaff: false,
                nursingStaff: false,
                masterLevel: false
            },
            family: {
                weeklyTherapy: false,
                workshops: false,
                visitationPolicy: '',
                parentCoaching: false
            },
            admissions: {
                phone: '',
                email: '',
                insurance: [],
                inNetwork: [],
                privatePay: false,
                financing: false,
                scholarships: false,
                admissionsProcess: '',
                exclusions: []
            },
            quality: {
                accreditations: [],
                memberships: [],
                traumaInformed: false,
                evidenceBased: false,
                outcomesTracking: false
            },
            aftercare: {
                hasProgram: false,
                services: [],
                alumniProgram: false,
                familySupport: false
            },
            differentiators: []
        };
    }
    
    // Extract from text using advanced patterns
    function extractFromText(text, data, metrics) {
        if (!text) return;
        
        // Extract program name
        if (!data.name) {
            data.name = extractProgramName();
        }
        
        // Extract location
        extractLocation(text, data);
        
        // Extract levels of care (strict)
        for (const [level, pattern] of Object.entries(EXTRACTION_PATTERNS.levelsOfCare)) {
            if (pattern.test(text) && !data.levelsOfCare.includes(level)) {
                data.levelsOfCare.push(formatLevelOfCare(level));
                metrics.uniqueDataPoints.add(`loc_${level}`);
            }
        }
        
        // Extract population
        extractPopulation(text, data, metrics);
        
        // Extract clinical modalities
        extractClinicalModalities(text, data, metrics);
        
        // Extract specializations
        extractSpecializations(text, data, metrics);
        
        // Extract environment/setting
        extractEnvironment(text, data, metrics);
        
        // Extract structure
        extractStructure(text, data, metrics);
        
        // Extract academics
        extractAcademics(text, data, metrics);
        
        // Extract staff/credentials
        extractStaffCredentials(text, data, metrics);
        
        // Extract quality indicators
        extractQualityIndicators(text, data, metrics);
        
        // Extract insurance/payment
        extractInsurance(text, data, metrics);
        
        // Extract contact information
        extractContactInfo(text, data, metrics);
        
        // Extract family program
        extractFamilyProgram(text, data, metrics);
        
        // Extract aftercare
        extractAftercare(text, data, metrics);
    }
    
    // Helper extraction functions
    function extractProgramName() {
        // Try meta tags first
        const ogTitle = document.querySelector('meta[property="og:site_name"]')?.content;
        if (ogTitle) return ogTitle;
        
        // Try JSON-LD
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
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
        const title = document.title.split('|')[0].split('-')[0].trim();
        if (title && title.length < 50) return title;
        
        // Try H1
        const h1 = document.querySelector('h1')?.textContent?.trim();
        if (h1 && h1.length < 50) return h1;
        
        return '';
    }
    
    function extractLocation(text, data) {
        // City, State pattern
        const locationPattern = /(?:located\s+in|serving|based\s+in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2}|\w+)/gi;
        const match = locationPattern.exec(text);
        if (match) {
            data.city = match[1];
            data.state = match[2].length === 2 ? match[2] : getStateAbbr(match[2]);
        }
        
        // Address pattern
        const addressPattern = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Parkway|Pkwy),?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),\s*([A-Z]{2})/g;
        const addressMatch = addressPattern.exec(text);
        if (addressMatch) {
            if (!data.city) data.city = addressMatch[1];
            if (!data.state) data.state = addressMatch[2];
        }
    }
    
    function extractPopulation(text, data, metrics) {
        // Gender
        if (EXTRACTION_PATTERNS.population.maleOnly.test(text)) {
            data.population.gender = 'Males Only';
            metrics.uniqueDataPoints.add('pop_male_only');
        } else if (EXTRACTION_PATTERNS.population.femaleOnly.test(text)) {
            data.population.gender = 'Females Only';
            metrics.uniqueDataPoints.add('pop_female_only');
        } else if (/co[\-\s]?ed/gi.test(text)) {
            data.population.gender = 'Co-ed';
            metrics.uniqueDataPoints.add('pop_coed');
        }
        
        // Ages
        const ageMatch = /ages?\s+(\d+)\s*(?:to|-|through)\s*(\d+)/gi.exec(text);
        if (ageMatch) {
            data.population.ageMin = parseInt(ageMatch[1]);
            data.population.ageMax = parseInt(ageMatch[2]);
            data.population.ages = `${ageMatch[1]}-${ageMatch[2]}`;
            metrics.uniqueDataPoints.add(`age_${ageMatch[1]}_${ageMatch[2]}`);
        } else {
            // Try categorical
            if (/adolescents?|teens?/gi.test(text)) {
                data.population.ages = 'Adolescents';
                metrics.uniqueDataPoints.add('pop_adolescents');
            } else if (/young\s+adults?/gi.test(text)) {
                data.population.ages = 'Young Adults';
                metrics.uniqueDataPoints.add('pop_young_adults');
            } else if (/adults?(?!\s+only)/gi.test(text)) {
                data.population.ages = 'Adults';
                metrics.uniqueDataPoints.add('pop_adults');
            }
        }
        
        // Special populations
        if (EXTRACTION_PATTERNS.population.lgbtq.test(text)) {
            data.population.specialPopulations.push('LGBTQ+ Affirming');
            metrics.uniqueDataPoints.add('pop_lgbtq');
        }
        if (/adopted|foster/gi.test(text)) {
            data.population.specialPopulations.push('Adoption/Foster Care');
            metrics.uniqueDataPoints.add('pop_adoption');
        }
        if (/first\s+responders?/gi.test(text)) {
            data.population.specialPopulations.push('First Responders');
            metrics.uniqueDataPoints.add('pop_first_responders');
        }
        if (/military|veterans?/gi.test(text)) {
            data.population.specialPopulations.push('Military/Veterans');
            metrics.uniqueDataPoints.add('pop_military');
        }
    }
    
    function extractClinicalModalities(text, data, metrics) {
        // Evidence-based therapies
        for (const [therapy, pattern] of Object.entries(EXTRACTION_PATTERNS.evidenceBased)) {
            if (pattern.test(text)) {
                const formatted = formatTherapyName(therapy);
                if (!data.clinical.evidenceBased.includes(formatted)) {
                    data.clinical.evidenceBased.push(formatted);
                    metrics.uniqueDataPoints.add(`eb_${therapy}`);
                }
            }
        }
        
        // Experiential therapies
        for (const [therapy, pattern] of Object.entries(EXTRACTION_PATTERNS.experiential)) {
            if (pattern.test(text)) {
                const formatted = formatTherapyName(therapy);
                if (!data.clinical.experiential.includes(formatted)) {
                    data.clinical.experiential.push(formatted);
                    metrics.uniqueDataPoints.add(`exp_${therapy}`);
                }
            }
        }
        
        // Therapy hours
        const individualMatch = /(\d+)\s*(?:hours?\s+of\s+)?individual\s+therapy/gi.exec(text);
        if (individualMatch) {
            data.clinical.individualTherapyHours = `${individualMatch[1]} hours/week`;
        }
        
        const groupMatch = /(\d+)\s*(?:hours?\s+of\s+)?group\s+therapy/gi.exec(text);
        if (groupMatch) {
            data.clinical.groupTherapyHours = `${groupMatch[1]} hours/week`;
        }
    }
    
    function extractSpecializations(text, data, metrics) {
        const specCounts = {};
        
        for (const [spec, pattern] of Object.entries(EXTRACTION_PATTERNS.specializations)) {
            const matches = text.match(pattern);
            if (matches) {
                specCounts[spec] = matches.length;
                const formatted = formatSpecialization(spec);
                if (!data.clinical.specializations.includes(formatted)) {
                    data.clinical.specializations.push(formatted);
                    metrics.uniqueDataPoints.add(`spec_${spec}`);
                }
            }
        }
        
        // Determine primary focus
        if (specCounts.sud && specCounts.sud >= 3) {
            data.clinical.primaryFocus = 'Substance Use Disorders';
            // Move SUD to front
            const sudIndex = data.clinical.specializations.indexOf('Substance Use Disorders');
            if (sudIndex > 0) {
                data.clinical.specializations.splice(sudIndex, 1);
                data.clinical.specializations.unshift('Substance Use Disorders');
            }
        } else if (specCounts.trauma && specCounts.trauma >= 3) {
            data.clinical.primaryFocus = 'Trauma/PTSD';
        } else if (data.clinical.specializations.length > 0) {
            data.clinical.primaryFocus = data.clinical.specializations[0];
        }
    }
    
    function extractEnvironment(text, data, metrics) {
        for (const [setting, pattern] of Object.entries(EXTRACTION_PATTERNS.environment)) {
            if (pattern.test(text)) {
                if (!data.environment.setting) {
                    data.environment.setting = formatSetting(setting);
                    metrics.uniqueDataPoints.add(`env_${setting}`);
                }
                
                // Extract acreage if mentioned
                const acreMatch = /(\d+)[\s\-]?acres?/gi.exec(text);
                if (acreMatch) {
                    data.environment.campusSizeAcre = `${acreMatch[1]} acres`;
                    metrics.uniqueDataPoints.add(`acres_${acreMatch[1]}`);
                }
            }
        }
        
        // Extract facilities
        const facilities = ['gym', 'pool', 'basketball', 'tennis', 'soccer', 'barn', 'ropes course', 'yoga studio', 'art studio'];
        facilities.forEach(facility => {
            const regex = new RegExp(facility, 'gi');
            if (regex.test(text) && !data.environment.facilities.includes(facility)) {
                data.environment.facilities.push(facility);
                metrics.uniqueDataPoints.add(`fac_${facility}`);
            }
        });
    }
    
    function extractStructure(text, data, metrics) {
        // Capacity
        const capacityMatch = EXTRACTION_PATTERNS.structure.capacity.exec(text);
        if (capacityMatch) {
            data.structure.capacity = capacityMatch[1];
            metrics.uniqueDataPoints.add(`capacity_${capacityMatch[1]}`);
        }
        
        // Staff ratio
        const ratioMatch = EXTRACTION_PATTERNS.structure.ratio.exec(text);
        if (ratioMatch) {
            data.structure.ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
            metrics.uniqueDataPoints.add(`ratio_${ratioMatch[1]}_${ratioMatch[2]}`);
        }
        
        // Length of stay
        const losMatch = EXTRACTION_PATTERNS.structure.los.exec(text);
        if (losMatch) {
            data.structure.los = losMatch[1].trim();
            metrics.uniqueDataPoints.add('los_found');
        }
        
        // Phases
        const phaseMatch = /(\d+)[\s\-](?:phase|level|stage)s?/gi.exec(text);
        if (phaseMatch) {
            const numPhases = parseInt(phaseMatch[1]);
            for (let i = 1; i <= numPhases; i++) {
                data.structure.phases.push(`Phase ${i}`);
            }
            metrics.uniqueDataPoints.add(`phases_${numPhases}`);
        }
    }
    
    function extractAcademics(text, data, metrics) {
        if (EXTRACTION_PATTERNS.academics.onSite.test(text)) {
            data.structure.academics.hasProgram = true;
            data.structure.academics.onSite = true;
            metrics.uniqueDataPoints.add('academics_onsite');
        }
        
        const accredMatch = EXTRACTION_PATTERNS.academics.accreditation.exec(text);
        if (accredMatch) {
            data.structure.academics.accreditation = accredMatch[1].trim();
            metrics.uniqueDataPoints.add('academics_accredited');
        }
        
        const gradesMatch = EXTRACTION_PATTERNS.academics.grades.exec(text);
        if (gradesMatch) {
            const start = gradesMatch[1];
            const end = gradesMatch[2] || start;
            data.structure.academics.grades = `${start}-${end}`;
            metrics.uniqueDataPoints.add(`grades_${start}_${end}`);
        }
        
        if (EXTRACTION_PATTERNS.academics.collegeCounseling.test(text)) {
            data.structure.academics.collegeCounseling = true;
            metrics.uniqueDataPoints.add('college_counseling');
        }
        
        if (EXTRACTION_PATTERNS.academics.iep504.test(text)) {
            data.structure.academics.iep504 = true;
            metrics.uniqueDataPoints.add('iep_504');
        }
        
        if (EXTRACTION_PATTERNS.academics.creditRecovery.test(text)) {
            data.structure.academics.creditRecovery = true;
            metrics.uniqueDataPoints.add('credit_recovery');
        }
        
        if (EXTRACTION_PATTERNS.academics.apHonors.test(text)) {
            data.structure.academics.apHonors = true;
            metrics.uniqueDataPoints.add('ap_honors');
        }
    }
    
    function extractStaffCredentials(text, data, metrics) {
        for (const [credential, pattern] of Object.entries(EXTRACTION_PATTERNS.credentials)) {
            if (pattern.test(text)) {
                const formatted = formatCredential(credential);
                if (!data.staff.credentials.includes(formatted)) {
                    data.staff.credentials.push(formatted);
                    metrics.uniqueDataPoints.add(`cred_${credential}`);
                    
                    // Set flags
                    if (credential === 'psychiatrist') {
                        data.staff.psychiatristOnStaff = true;
                        data.clinical.psychiatryAvailable = true;
                    }
                    if (credential === 'rn' || credential === 'lpn') {
                        data.staff.nursingStaff = true;
                    }
                    if (credential === 'masters') {
                        data.staff.masterLevel = true;
                    }
                }
            }
        }
    }
    
    function extractQualityIndicators(text, data, metrics) {
        for (const [indicator, pattern] of Object.entries(EXTRACTION_PATTERNS.quality)) {
            if (pattern.test(text)) {
                switch (indicator) {
                    case 'jointCommission':
                        if (!data.quality.accreditations.includes('Joint Commission')) {
                            data.quality.accreditations.push('Joint Commission');
                            metrics.uniqueDataPoints.add('acc_jc');
                        }
                        break;
                    case 'carf':
                        if (!data.quality.accreditations.includes('CARF')) {
                            data.quality.accreditations.push('CARF');
                            metrics.uniqueDataPoints.add('acc_carf');
                        }
                        break;
                    case 'natsap':
                        if (!data.quality.memberships.includes('NATSAP')) {
                            data.quality.memberships.push('NATSAP');
                            metrics.uniqueDataPoints.add('mem_natsap');
                        }
                        break;
                    case 'cognia':
                        if (!data.quality.accreditations.includes('Cognia')) {
                            data.quality.accreditations.push('Cognia');
                            metrics.uniqueDataPoints.add('acc_cognia');
                        }
                        break;
                    case 'traumaInformed':
                        data.quality.traumaInformed = true;
                        metrics.uniqueDataPoints.add('trauma_informed');
                        break;
                    case 'evidenceBased':
                        data.quality.evidenceBased = true;
                        metrics.uniqueDataPoints.add('evidence_based');
                        break;
                    case 'outcomes':
                        data.quality.outcomesTracking = true;
                        metrics.uniqueDataPoints.add('outcomes_tracking');
                        break;
                }
            }
        }
    }
    
    function extractInsurance(text, data, metrics) {
        if (EXTRACTION_PATTERNS.insurance.accepts.test(text)) {
            data.admissions.insurance.push('Accepts Insurance');
            metrics.uniqueDataPoints.add('accepts_insurance');
        }
        
        if (EXTRACTION_PATTERNS.insurance.privatePay.test(text)) {
            data.admissions.privatePay = true;
            metrics.uniqueDataPoints.add('private_pay');
        }
        
        if (EXTRACTION_PATTERNS.insurance.financing.test(text)) {
            data.admissions.financing = true;
            metrics.uniqueDataPoints.add('financing');
        }
        
        if (EXTRACTION_PATTERNS.insurance.scholarship.test(text)) {
            data.admissions.scholarships = true;
            metrics.uniqueDataPoints.add('scholarships');
        }
        
        // Extract specific insurance providers
        const providerMatches = text.match(EXTRACTION_PATTERNS.insurance.providers);
        if (providerMatches) {
            providerMatches.forEach(provider => {
                const formatted = provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase();
                if (!data.admissions.insurance.includes(formatted)) {
                    data.admissions.insurance.push(formatted);
                    metrics.uniqueDataPoints.add(`ins_${formatted.toLowerCase()}`);
                }
            });
        }
    }
    
    function extractContactInfo(text, data, metrics) {
        // Phone
        const phoneMatch = /(?:call|phone|contact)[\s\w]*?(?:1[\s\-\.]?)?\(?(\d{3})\)?[\s\-\.]?(\d{3})[\s\-\.]?(\d{4})/gi.exec(text);
        if (phoneMatch) {
            data.admissions.phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
            metrics.uniqueDataPoints.add('phone_found');
        }
        
        // Email - prefer admissions emails
        const emailMatch = /(?:admissions@|info@|contact@)([\w\.\-]+\.[a-z]{2,})/gi.exec(text);
        if (emailMatch) {
            data.admissions.email = emailMatch[0];
            metrics.uniqueDataPoints.add('email_found');
        } else {
            // Try any email
            const anyEmailMatch = /([\w\.\-]+@[\w\.\-]+\.[a-z]{2,})/gi.exec(text);
            if (anyEmailMatch && !anyEmailMatch[0].includes('wix') && !anyEmailMatch[0].includes('sentry')) {
                data.admissions.email = anyEmailMatch[0];
                metrics.uniqueDataPoints.add('email_found');
            }
        }
    }
    
    function extractFamilyProgram(text, data, metrics) {
        if (/weekly\s+family\s+(?:therapy|sessions?)/gi.test(text)) {
            data.family.weeklyTherapy = true;
            metrics.uniqueDataPoints.add('family_weekly');
        }
        
        if (/family\s+(?:workshops?|weekends?|education)/gi.test(text)) {
            data.family.workshops = true;
            metrics.uniqueDataPoints.add('family_workshops');
        }
        
        if (/parent\s+coaching/gi.test(text)) {
            data.family.parentCoaching = true;
            metrics.uniqueDataPoints.add('parent_coaching');
        }
        
        const visitMatch = /(?:visitation|family\s+visits?)\s+([^\.]+)/gi.exec(text);
        if (visitMatch) {
            data.family.visitationPolicy = visitMatch[1].trim().substring(0, 100);
            metrics.uniqueDataPoints.add('visitation_policy');
        }
    }
    
    function extractAftercare(text, data, metrics) {
        if (/aftercare\s+(?:program|services?|planning)/gi.test(text)) {
            data.aftercare.hasProgram = true;
            metrics.uniqueDataPoints.add('aftercare_program');
        }
        
        if (/alumni\s+(?:program|support|network)/gi.test(text)) {
            data.aftercare.alumniProgram = true;
            metrics.uniqueDataPoints.add('alumni_program');
        }
        
        if (/continuing\s+care|follow[\s\-]up/gi.test(text)) {
            data.aftercare.services.push('Continuing Care');
            metrics.uniqueDataPoints.add('continuing_care');
        }
        
        if (/transition\s+(?:planning|support)/gi.test(text)) {
            data.aftercare.services.push('Transition Support');
            metrics.uniqueDataPoints.add('transition_support');
        }
    }
    
    // Helper functions
    function formatLevelOfCare(level) {
        const formats = {
            residential: 'Residential',
            php: 'Partial Hospitalization (PHP)',
            iop: 'Intensive Outpatient (IOP)',
            outpatient: 'Outpatient',
            detox: 'Detoxification',
            soberLiving: 'Sober Living'
        };
        return formats[level] || level;
    }
    
    function formatTherapyName(therapy) {
        const formats = {
            cbt: 'CBT',
            dbt: 'DBT',
            emdr: 'EMDR',
            act: 'ACT',
            mi: 'Motivational Interviewing',
            tfCbt: 'TF-CBT',
            cpt: 'CPT',
            pe: 'Prolonged Exposure',
            seeking: 'Seeking Safety',
            matrix: 'Matrix Model',
            smart: 'SMART Recovery',
            twelveStep: '12-Step',
            equine: 'Equine Therapy',
            adventure: 'Adventure Therapy',
            wilderness: 'Wilderness Therapy',
            art: 'Art Therapy',
            music: 'Music Therapy',
            drama: 'Drama Therapy',
            recreation: 'Recreation Therapy',
            yoga: 'Yoga',
            mindfulness: 'Mindfulness',
            somatic: 'Somatic Therapy',
            neurofeedback: 'Neurofeedback',
            biofeedback: 'Biofeedback'
        };
        return formats[therapy] || therapy;
    }
    
    function formatSpecialization(spec) {
        const formats = {
            sud: 'Substance Use Disorders',
            trauma: 'Trauma/PTSD',
            anxiety: 'Anxiety Disorders',
            depression: 'Depression',
            bipolar: 'Bipolar Disorder',
            adhd: 'ADHD',
            autism: 'Autism Spectrum',
            ocd: 'OCD',
            eatingDisorders: 'Eating Disorders',
            selfHarm: 'Self-Harm',
            sexualTrauma: 'Sexual Trauma',
            adoption: 'Adoption Issues',
            attachment: 'Attachment Disorders',
            dualDiagnosis: 'Dual Diagnosis'
        };
        return formats[spec] || spec;
    }
    
    function formatSetting(setting) {
        const formats = {
            rural: 'Rural',
            urban: 'Urban',
            suburban: 'Suburban',
            mountain: 'Mountain',
            coastal: 'Coastal',
            desert: 'Desert',
            ranch: 'Ranch'
        };
        return formats[setting] || setting;
    }
    
    function formatCredential(credential) {
        const formats = {
            psychiatrist: 'Psychiatrist',
            psychologist: 'Psychologist',
            lcsw: 'LCSW',
            lpc: 'LPC',
            lmft: 'LMFT',
            ladc: 'LADC/CADC',
            rn: 'RN',
            lpn: 'LPN',
            masters: 'Masters-Level Therapists',
            boardCertified: 'Board Certified'
        };
        return formats[credential] || credential;
    }
    
    // Page discovery
    async function discoverRelatedPages() {
        const pages = [];
        const seen = new Set();
        const currentHost = window.location.hostname;
        
        // Priority keywords for relevant pages
        const priorityKeywords = [
            'about', 'program', 'treatment', 'therapy', 'clinical', 
            'admissions', 'insurance', 'staff', 'team', 'approach',
            'modalities', 'academics', 'education', 'family', 'parent',
            'philosophy', 'residential', 'levels', 'care', 'services'
        ];
        
        // Find all links
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const url = link.href;
            const text = link.textContent.toLowerCase();
            
            // Skip external links and already seen
            if (!url.includes(currentHost) || seen.has(url)) return;
            
            // Skip files and anchors
            if (url.match(/\.(pdf|doc|docx|jpg|jpeg|png|gif|mp4|zip)$/i)) return;
            if (url.includes('#')) return;
            
            seen.add(url);
            
            // Calculate priority score
            let priority = 0;
            priorityKeywords.forEach(keyword => {
                if (text.includes(keyword) || url.includes(keyword)) {
                    priority += 10;
                }
            });
            
            pages.push({
                url: url,
                title: link.textContent.trim().substring(0, 50),
                priority: priority
            });
        });
        
        // Sort by priority and return top 50
        pages.sort((a, b) => b.priority - a.priority);
        return pages.slice(0, 50);
    }
    
    // Fetch page content
    async function fetchPage(url) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html'
                }
            });
            
            if (response.ok) {
                return await response.text();
            }
        } catch (error) {
            console.warn(`[CareConnect] Failed to fetch ${url}:`, error);
        }
        return null;
    }
    
    // Extract text from HTML string
    function extractTextFromHTML(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return getCleanPageText(doc);
    }
    
    // Get clean text from document
    function getCleanPageText(doc) {
        // Remove script and style elements
        const scripts = doc.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        // Remove navigation and footer
        const navFooter = doc.querySelectorAll('nav, footer, header, .navigation, .footer, .header, #nav, #footer, #header');
        navFooter.forEach(el => el.remove());
        
        // Get text
        let text = doc.body?.textContent || '';
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    }
    
    // Send progress updates
    function sendProgress(phase, current, total, message) {
        chrome.runtime.sendMessage({
            action: 'extraction-progress',
            phase: phase,
            current: current,
            total: total,
            message: message
        });
    }
    
    // Send metrics update
    function sendMetricsUpdate(metrics) {
        chrome.runtime.sendMessage({
            action: 'extraction-metrics',
            metrics: {
                fieldsFound: countFieldsFromMetrics(metrics),
                pagesScanned: metrics.pagesScanned,
                uniqueDataPoints: metrics.uniqueDataPoints.size,
                confidence: Math.round((metrics.uniqueDataPoints.size / 100) * 100)
            }
        });
    }
    
    function countFieldsFromMetrics(metrics) {
        // Count unique data categories found
        const categories = new Set();
        metrics.uniqueDataPoints.forEach(point => {
            const category = point.split('_')[0];
            categories.add(category);
        });
        return categories.size;
    }
    
    // Consolidate data
    function consolidateData(data) {
        // Remove duplicates from arrays
        for (const key in data) {
            if (Array.isArray(data[key])) {
                data[key] = [...new Set(data[key])];
            } else if (typeof data[key] === 'object' && data[key] !== null) {
                consolidateData(data[key]);
            }
        }
    }
    
    // Build differentiators
    function buildDifferentiators(data) {
        const differentiators = [];
        
        // Unique setting
        if (data.environment.setting) {
            differentiators.push(`${data.environment.setting} setting ${data.environment.campusSizeAcre ? `on ${data.environment.campusSizeAcre}` : ''}`);
        }
        
        // Small capacity (intimate)
        if (data.structure.capacity && parseInt(data.structure.capacity) <= 20) {
            differentiators.push(`Intimate program size (${data.structure.capacity} beds)`);
        }
        
        // High staff ratio
        if (data.structure.ratio) {
            const parts = data.structure.ratio.split(':');
            if (parts[0] && parts[1] && parseInt(parts[0]) <= 3) {
                differentiators.push(`High staff-to-client ratio (${data.structure.ratio})`);
            }
        }
        
        // Specialized therapies
        if (data.clinical.experiential.length > 3) {
            differentiators.push(`Extensive experiential therapies (${data.clinical.experiential.length} modalities)`);
        }
        
        // Academic program
        if (data.structure.academics.hasProgram && data.structure.academics.accreditation) {
            differentiators.push(`${data.structure.academics.accreditation}-accredited academic program`);
        }
        
        // Primary specialization
        if (data.clinical.primaryFocus) {
            differentiators.push(`Primary focus on ${data.clinical.primaryFocus}`);
        }
        
        // Quality accreditations
        if (data.quality.accreditations.length > 0) {
            differentiators.push(`${data.quality.accreditations.join(' and ')} accredited`);
        }
        
        // Gender-specific
        if (data.population.gender && data.population.gender !== 'Co-ed') {
            differentiators.push(`${data.population.gender} program`);
        }
        
        // Unique experiential offerings
        if (data.clinical.experiential.includes('Equine Therapy')) {
            differentiators.push('On-site equine therapy program');
        }
        if (data.clinical.experiential.includes('Wilderness Therapy')) {
            differentiators.push('Wilderness therapy component');
        }
        
        data.differentiators = differentiators.slice(0, 10);
    }
    
    // Calculate confidence score
    function calculateConfidence(data, metrics) {
        let score = 0;
        let maxScore = 0;
        
        // Critical fields (10 points each)
        const criticalFields = [
            data.name,
            data.levelsOfCare.length > 0,
            data.population.ages || data.population.gender,
            data.clinical.specializations.length > 0,
            data.admissions.phone || data.admissions.email
        ];
        
        criticalFields.forEach(field => {
            maxScore += 10;
            if (field) score += 10;
        });
        
        // Important fields (5 points each)
        const importantFields = [
            data.clinical.evidenceBased.length > 0,
            data.clinical.experiential.length > 0,
            data.structure.capacity,
            data.structure.los,
            data.environment.setting,
            data.quality.accreditations.length > 0,
            data.family.weeklyTherapy || data.family.workshops
        ];
        
        importantFields.forEach(field => {
            maxScore += 5;
            if (field) score += 5;
        });
        
        // Bonus for comprehensive data
        if (metrics.uniqueDataPoints.size > 30) score += 10;
        if (metrics.pagesScanned > 5) score += 10;
        maxScore += 20;
        
        return Math.min(100, Math.round((score / maxScore) * 100));
    }
    
    // Count fields
    function countFields(data) {
        let count = 0;
        
        function countObject(obj) {
            for (const key in obj) {
                const value = obj[key];
                if (value === null || value === undefined || value === '') continue;
                
                if (Array.isArray(value)) {
                    if (value.length > 0) count++;
                } else if (typeof value === 'object') {
                    countObject(value);
                } else if (typeof value === 'boolean') {
                    if (value) count++;
                } else {
                    count++;
                }
            }
        }
        
        countObject(data);
        return count;
    }
    
    // Get all crawled text (for AI enhancement)
    let allCrawledText = '';
    
    function getAllCrawledText() {
        return allCrawledText;
    }
    
    // AI Enhancement (optional)
    async function enhanceWithAI(data, combinedText, config) {
        if (!config.aiModel) return;
        
        try {
            // Load API configuration
            const apiConfig = await new Promise((resolve) => {
                chrome.storage.local.get(['ai_config'], (result) => {
                    resolve(result.ai_config || {});
                });
            });
            
            let enhancedData = null;
            
            switch (config.aiModel) {
                case 'Gemini Pro':
                    if (apiConfig.gemini_api_key) {
                        enhancedData = await enhanceWithGemini(combinedText, apiConfig.gemini_api_key);
                    }
                    break;
                    
                case 'GPT-4 Turbo':
                    if (apiConfig.openai_api_key) {
                        enhancedData = await enhanceWithOpenAI(combinedText, apiConfig.openai_api_key);
                    }
                    break;
                    
                case 'Claude 3':
                    if (apiConfig.anthropic_api_key) {
                        enhancedData = await enhanceWithClaude(combinedText, apiConfig.anthropic_api_key);
                    }
                    break;
                    
                case 'Ollama (Local)':
                    if (apiConfig.ollama_enabled) {
                        enhancedData = await enhanceWithOllama(combinedText);
                    }
                    break;
            }
            
            // Merge AI findings with existing data
            if (enhancedData) {
                mergeAIData(data, enhancedData);
            }
            
        } catch (error) {
            console.warn('[CareConnect] AI enhancement failed:', error);
            // Continue without AI enhancement
        }
    }
    
    // Gemini enhancement
    async function enhanceWithGemini(text, apiKey) {
        const prompt = createAIPrompt(text);
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const aiText = result.candidates[0]?.content?.parts[0]?.text;
                if (aiText) {
                    return parseAIResponse(aiText);
                }
            }
        } catch (error) {
            console.error('[CareConnect] Gemini error:', error);
        }
        return null;
    }
    
    // OpenAI enhancement
    async function enhanceWithOpenAI(text, apiKey) {
        const prompt = createAIPrompt(text);
        
        try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-4-turbo-preview',
                    messages: [{
                        role: 'system',
                        content: 'You are a clinical data extraction specialist.'
                    }, {
                        role: 'user',
                        content: prompt
                    }],
                    max_tokens: 1000
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const aiText = result.choices[0]?.message?.content;
                if (aiText) {
                    return parseAIResponse(aiText);
                }
            }
        } catch (error) {
            console.error('[CareConnect] OpenAI error:', error);
        }
        return null;
    }
    
    // Create AI prompt
    function createAIPrompt(text) {
        return `Extract clinical treatment program information from this text. Focus on:
        
1. Levels of care offered (Residential, PHP, IOP, Outpatient)
2. Population served (ages, gender)
3. Clinical specializations and therapies
4. Unique differentiators
5. Contact information
6. Insurance and payment options
7. Accreditations and quality indicators

Text to analyze:
${text.substring(0, 10000)}

Return structured data in this format:
LEVELS_OF_CARE: [list]
AGES: [range]
GENDER: [specific]
SPECIALIZATIONS: [list]
THERAPIES: [list]
DIFFERENTIATORS: [list]
PHONE: [number]
EMAIL: [address]
INSURANCE: [list]
ACCREDITATIONS: [list]`;
    }
    
    // Parse AI response
    function parseAIResponse(text) {
        const data = {};
        
        // Parse sections
        const sections = text.split('\n');
        sections.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':').map(s => s.trim());
                
                switch (key) {
                    case 'LEVELS_OF_CARE':
                        data.levelsOfCare = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                        break;
                    case 'AGES':
                        data.ages = value;
                        break;
                    case 'GENDER':
                        data.gender = value;
                        break;
                    case 'SPECIALIZATIONS':
                        data.specializations = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                        break;
                    case 'THERAPIES':
                        data.therapies = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                        break;
                    case 'DIFFERENTIATORS':
                        data.differentiators = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                        break;
                    case 'PHONE':
                        data.phone = value;
                        break;
                    case 'EMAIL':
                        data.email = value;
                        break;
                    case 'INSURANCE':
                        data.insurance = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                        break;
                    case 'ACCREDITATIONS':
                        data.accreditations = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                        break;
                }
            }
        });
        
        return data;
    }
    
    // Merge AI data
    function mergeAIData(existingData, aiData) {
        // Only merge if AI found additional information not already captured
        
        if (aiData.levelsOfCare) {
            aiData.levelsOfCare.forEach(level => {
                if (!existingData.levelsOfCare.includes(level)) {
                    existingData.levelsOfCare.push(level);
                }
            });
        }
        
        if (aiData.specializations) {
            aiData.specializations.forEach(spec => {
                if (!existingData.clinical.specializations.includes(spec)) {
                    existingData.clinical.specializations.push(spec);
                }
            });
        }
        
        if (aiData.therapies) {
            aiData.therapies.forEach(therapy => {
                // Categorize as evidence-based or experiential
                const isEvidenceBased = ['CBT', 'DBT', 'EMDR', 'ACT'].some(eb => 
                    therapy.toUpperCase().includes(eb)
                );
                
                if (isEvidenceBased && !existingData.clinical.evidenceBased.includes(therapy)) {
                    existingData.clinical.evidenceBased.push(therapy);
                } else if (!existingData.clinical.experiential.includes(therapy)) {
                    existingData.clinical.experiential.push(therapy);
                }
            });
        }
        
        if (aiData.differentiators) {
            aiData.differentiators.forEach(diff => {
                if (!existingData.differentiators.includes(diff)) {
                    existingData.differentiators.push(diff);
                }
            });
        }
        
        if (aiData.phone && !existingData.admissions.phone) {
            existingData.admissions.phone = aiData.phone;
        }
        
        if (aiData.email && !existingData.admissions.email) {
            existingData.admissions.email = aiData.email;
        }
        
        if (aiData.insurance) {
            aiData.insurance.forEach(ins => {
                if (!existingData.admissions.insurance.includes(ins)) {
                    existingData.admissions.insurance.push(ins);
                }
            });
        }
        
        if (aiData.accreditations) {
            aiData.accreditations.forEach(acc => {
                if (!existingData.quality.accreditations.includes(acc)) {
                    existingData.quality.accreditations.push(acc);
                }
            });
        }
    }
    
    // Helper function to get state abbreviation
    function getStateAbbr(stateName) {
        const states = {
            'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
            'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
            'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
            'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
            'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
            'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
            'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
            'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
            'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
            'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
            'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
            'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
            'Wisconsin': 'WI', 'Wyoming': 'WY'
        };
        return states[stateName] || stateName;
    }
    
})();
