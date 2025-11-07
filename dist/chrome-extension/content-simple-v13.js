// content-simple-v13.js - Simplified but powerful extraction engine
// This version focuses on reliability and actual data extraction

(function() {
    'use strict';
    
    // Prevent duplicate injection
    if (window.__CC_V13_SIMPLE__) {
        console.log('[CareConnect] Already loaded');
        return;
    }
    window.__CC_V13_SIMPLE__ = true;
    
    console.log('[CareConnect] v13.0 Simple Extractor Loaded');
    
    // Main extraction class
    class SimpleExtractor {
        constructor() {
            this.data = {};
            this.metrics = {
                fieldsFound: 0,
                pagesScanned: 1,
                uniqueDataPoints: new Set(),
                confidence: 0
            };
        }
        
        async extract() {
            console.log('[CareConnect] Starting extraction...');
            
            try {
                // Send initial progress
                this.sendProgress(10, 'Analyzing page structure...');
                
                // Get clean text
                const pageText = this.getCleanPageText();
                const title = document.title;
                const url = window.location.href;
                
                // Initialize data structure
                this.data = {
                    name: '',
                    website: window.location.hostname,
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
                    structure: { capacity: '', ratio: '', lengthOfStay: '' },
                    environment: { setting: '', facilities: [], amenities: [] },
                    staff: { credentials: [], psychiatristOnStaff: false },
                    family: { weeklyTherapy: false, workshops: false, involvement: '' },
                    admissions: { insurance: [], privatePay: false, financialAid: false },
                    quality: { accreditations: [], memberships: [], awards: [] },
                    differentiators: [],
                    executiveSummary: ''
                };
                
                // Extract program name
                this.sendProgress(20, 'Extracting program information...');
                this.extractProgramName(title, pageText);
                
                // Extract location
                this.sendProgress(30, 'Finding location details...');
                this.extractLocation(pageText);
                
                // Extract contact info
                this.sendProgress(40, 'Gathering contact information...');
                this.extractContactInfo(pageText);
                
                // Extract levels of care
                this.sendProgress(50, 'Identifying levels of care...');
                this.extractLevelsOfCare(pageText);
                
                // Extract population
                this.sendProgress(60, 'Analyzing population served...');
                this.extractPopulation(pageText);
                
                // Extract clinical info
                this.sendProgress(70, 'Extracting clinical programs...');
                this.extractClinicalInfo(pageText);
                
                // Extract additional details
                this.sendProgress(80, 'Gathering additional details...');
                this.extractStructure(pageText);
                this.extractEnvironment(pageText);
                this.extractStaff(pageText);
                this.extractFamily(pageText);
                this.extractAdmissions(pageText);
                this.extractQuality(pageText);
                
                // Build differentiators
                this.sendProgress(90, 'Identifying key differentiators...');
                this.buildDifferentiators();
                
                // Calculate metrics
                this.calculateMetrics();
                
                // Generate write-up
                this.sendProgress(95, 'Generating clinical documentation...');
                const writeUp = this.generateWriteUp();
                
                // Complete
                this.sendProgress(100, 'Extraction complete!');
                
                return {
                    success: true,
                    data: this.data,
                    writeUp: writeUp,
                    metrics: {
                        fieldsFound: this.metrics.fieldsFound,
                        pagesScanned: this.metrics.pagesScanned,
                        uniqueDataPoints: this.metrics.uniqueDataPoints.size,
                        confidence: this.metrics.confidence
                    }
                };
                
            } catch (error) {
                console.error('[CareConnect] Extraction error:', error);
                return {
                    success: false,
                    error: error.message,
                    data: this.data,
                    metrics: this.metrics
                };
            }
        }
        
        getCleanPageText() {
            // Clone document and remove noise
            const clone = document.cloneNode(true);
            const removeSelectors = ['script', 'style', 'nav', 'header', 'footer', '.menu', '.social'];
            removeSelectors.forEach(sel => {
                clone.querySelectorAll(sel).forEach(el => el.remove());
            });
            return (clone.body?.innerText || '').toLowerCase();
        }
        
        extractProgramName(title, text) {
            // Try meta tags first
            const ogName = document.querySelector('meta[property="og:site_name"]')?.content;
            if (ogName) {
                this.data.name = ogName;
                this.metrics.fieldsFound++;
                return;
            }
            
            // Try title
            const cleanTitle = title.split('|')[0].split('-')[0].trim();
            if (cleanTitle && cleanTitle.length < 50) {
                this.data.name = cleanTitle;
                this.metrics.fieldsFound++;
                return;
            }
            
            // Try h1
            const h1 = document.querySelector('h1')?.textContent?.trim();
            if (h1 && h1.length < 50) {
                this.data.name = h1;
                this.metrics.fieldsFound++;
                return;
            }
            
            this.data.name = 'Treatment Program';
        }
        
        extractLocation(text) {
            // State patterns
            const statePattern = /(?:located in|serving|based in|in)\s+([a-z\s]+),?\s*([a-z]{2})\b/gi;
            const stateMatch = statePattern.exec(text);
            if (stateMatch) {
                this.data.location.city = this.titleCase(stateMatch[1].trim());
                this.data.location.state = stateMatch[2].toUpperCase();
                this.metrics.fieldsFound++;
                this.metrics.uniqueDataPoints.add('location');
            }
            
            // Address pattern
            const addressPattern = /\d+\s+[a-z\s]+(?:street|st|avenue|ave|road|rd|drive|dr|boulevard|blvd)/gi;
            const addressMatch = addressPattern.exec(text);
            if (addressMatch) {
                this.data.location.address = this.titleCase(addressMatch[0]);
                this.metrics.uniqueDataPoints.add('address');
            }
        }
        
        extractContactInfo(text) {
            // Phone
            const phonePattern = /(?:\+?1[-.\s]?)?\(?(\d{3})\)?[-.\s]?(\d{3})[-.\s]?(\d{4})/g;
            const phoneMatch = phonePattern.exec(text);
            if (phoneMatch) {
                this.data.contact.phone = `${phoneMatch[1]}-${phoneMatch[2]}-${phoneMatch[3]}`;
                this.metrics.fieldsFound++;
                this.metrics.uniqueDataPoints.add('phone');
            }
            
            // Email
            const emailPattern = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/g;
            const emailMatch = emailPattern.exec(text);
            if (emailMatch) {
                this.data.contact.email = emailMatch[0];
                this.metrics.fieldsFound++;
                this.metrics.uniqueDataPoints.add('email');
            }
        }
        
        extractLevelsOfCare(text) {
            const levels = {
                'Residential': /residential|24\/7|live-in|inpatient/gi,
                'PHP': /php|partial hospitalization|day treatment/gi,
                'IOP': /iop|intensive outpatient/gi,
                'Outpatient': /outpatient(?!\s+referral)/gi,
                'Detox': /detox|detoxification|medical detox/gi,
                'Sober Living': /sober living|halfway house|transitional/gi
            };
            
            Object.entries(levels).forEach(([level, pattern]) => {
                if (pattern.test(text)) {
                    this.data.levelsOfCare.push(level);
                    this.metrics.uniqueDataPoints.add(`loc_${level}`);
                }
            });
            
            if (this.data.levelsOfCare.length > 0) {
                this.metrics.fieldsFound++;
            }
        }
        
        extractPopulation(text) {
            // Ages
            if (/adolescent|teen|youth/gi.test(text)) {
                this.data.population.ages = 'Adolescents';
                this.metrics.uniqueDataPoints.add('age_adolescent');
            } else if (/young adult/gi.test(text)) {
                this.data.population.ages = 'Young Adults';
                this.metrics.uniqueDataPoints.add('age_young_adult');
            } else if (/adult/gi.test(text)) {
                this.data.population.ages = 'Adults';
                this.metrics.uniqueDataPoints.add('age_adult');
            }
            
            // Gender
            if (/males? only|boys? only|men only/gi.test(text)) {
                this.data.population.gender = 'Males Only';
                this.metrics.uniqueDataPoints.add('gender_male');
            } else if (/females? only|girls? only|women only/gi.test(text)) {
                this.data.population.gender = 'Females Only';
                this.metrics.uniqueDataPoints.add('gender_female');
            } else if (/co-?ed|coed/gi.test(text)) {
                this.data.population.gender = 'Co-ed';
                this.metrics.uniqueDataPoints.add('gender_coed');
            }
            
            // Special populations
            const specialPops = [
                'LGBTQ+', 'Veterans', 'First Responders', 'Healthcare Professionals',
                'Executives', 'Pregnant Women', 'Postpartum'
            ];
            
            specialPops.forEach(pop => {
                if (new RegExp(pop, 'gi').test(text)) {
                    this.data.population.specialPopulations.push(pop);
                    this.metrics.uniqueDataPoints.add(`pop_${pop}`);
                }
            });
            
            if (this.data.population.ages || this.data.population.gender) {
                this.metrics.fieldsFound++;
            }
        }
        
        extractClinicalInfo(text) {
            // Evidence-based therapies
            const evidenceBased = {
                'CBT': /cbt|cognitive behavioral/gi,
                'DBT': /dbt|dialectical behavior/gi,
                'EMDR': /emdr|eye movement/gi,
                'ACT': /acceptance.{0,10}commitment|act therapy/gi,
                'MI': /motivational interviewing/gi,
                '12-Step': /12.?step|twelve.?step/gi,
                'SMART Recovery': /smart recovery/gi,
                'Trauma-Informed': /trauma.?informed/gi
            };
            
            Object.entries(evidenceBased).forEach(([name, pattern]) => {
                if (pattern.test(text)) {
                    this.data.clinical.evidenceBased.push(name);
                    this.metrics.uniqueDataPoints.add(`therapy_${name}`);
                }
            });
            
            // Experiential therapies
            const experiential = {
                'Equine Therapy': /equine|horse therapy/gi,
                'Art Therapy': /art therapy/gi,
                'Music Therapy': /music therapy/gi,
                'Adventure Therapy': /adventure|wilderness therapy/gi,
                'Yoga': /yoga therapy|therapeutic yoga/gi,
                'Mindfulness': /mindfulness|meditation/gi,
                'Recreation Therapy': /recreation therapy/gi
            };
            
            Object.entries(experiential).forEach(([name, pattern]) => {
                if (pattern.test(text)) {
                    this.data.clinical.experiential.push(name);
                    this.metrics.uniqueDataPoints.add(`exp_${name}`);
                }
            });
            
            // Specializations
            const specializations = {
                'Substance Use': /substance|addiction|chemical dependency|sud/gi,
                'Mental Health': /mental health|psychiatric|behavioral health/gi,
                'Dual Diagnosis': /dual.?diagnosis|co.?occurring/gi,
                'Trauma/PTSD': /trauma|ptsd|post.?traumatic/gi,
                'Depression': /depression|depressive/gi,
                'Anxiety': /anxiety disorders?/gi,
                'Eating Disorders': /eating disorder|anorexia|bulimia/gi,
                'Process Addictions': /process addiction|gambling|sex addiction/gi
            };
            
            Object.entries(specializations).forEach(([name, pattern]) => {
                if (pattern.test(text)) {
                    this.data.clinical.specializations.push(name);
                    this.metrics.uniqueDataPoints.add(`spec_${name}`);
                }
            });
            
            // Set primary focus
            if (this.data.clinical.specializations.includes('Substance Use')) {
                this.data.clinical.primaryFocus = 'Substance Use Disorders';
            } else if (this.data.clinical.specializations.includes('Mental Health')) {
                this.data.clinical.primaryFocus = 'Mental Health';
            }
            
            if (this.data.clinical.evidenceBased.length > 0 || 
                this.data.clinical.experiential.length > 0) {
                this.metrics.fieldsFound++;
            }
        }
        
        extractStructure(text) {
            // Capacity
            const capacityMatch = /(\d+).?(?:bed|client|resident)/gi.exec(text);
            if (capacityMatch) {
                this.data.structure.capacity = capacityMatch[1];
                this.metrics.uniqueDataPoints.add('capacity');
            }
            
            // Length of stay
            const losMatch = /(\d+).?(?:day|week|month).?(?:program|stay)/gi.exec(text);
            if (losMatch) {
                this.data.structure.lengthOfStay = losMatch[0];
                this.metrics.uniqueDataPoints.add('length_of_stay');
            }
            
            // Staff ratio
            const ratioMatch = /(\d+):(\d+).?(?:ratio|staff)/gi.exec(text);
            if (ratioMatch) {
                this.data.structure.ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
                this.metrics.uniqueDataPoints.add('staff_ratio');
            }
        }
        
        extractEnvironment(text) {
            // Setting
            if (/rural|countryside|country/gi.test(text)) {
                this.data.environment.setting = 'Rural';
            } else if (/urban|city|downtown/gi.test(text)) {
                this.data.environment.setting = 'Urban';
            } else if (/suburban/gi.test(text)) {
                this.data.environment.setting = 'Suburban';
            } else if (/coastal|beach|ocean/gi.test(text)) {
                this.data.environment.setting = 'Coastal';
            } else if (/mountain/gi.test(text)) {
                this.data.environment.setting = 'Mountain';
            }
            
            // Facilities
            const facilities = ['gym', 'pool', 'spa', 'garden', 'trails', 'lake', 'beach'];
            facilities.forEach(facility => {
                if (new RegExp(facility, 'gi').test(text)) {
                    this.data.environment.facilities.push(facility);
                    this.metrics.uniqueDataPoints.add(`facility_${facility}`);
                }
            });
            
            // Amenities
            const amenities = ['private room', 'wifi', 'laundry', 'chef', 'nutritionist'];
            amenities.forEach(amenity => {
                if (new RegExp(amenity, 'gi').test(text)) {
                    this.data.environment.amenities.push(amenity);
                    this.metrics.uniqueDataPoints.add(`amenity_${amenity}`);
                }
            });
        }
        
        extractStaff(text) {
            // Psychiatrist
            if (/psychiatrist.{0,20}staff|on.?site.{0,20}psychiatrist/gi.test(text)) {
                this.data.staff.psychiatristOnStaff = true;
                this.metrics.uniqueDataPoints.add('psychiatrist');
            }
            
            // Credentials
            const credentials = ['licensed', 'certified', 'masters', 'doctorate', 'phd', 'md', 'lcsw', 'lmft', 'lcpc'];
            credentials.forEach(cred => {
                if (new RegExp(cred, 'gi').test(text)) {
                    this.data.staff.credentials.push(cred);
                }
            });
        }
        
        extractFamily(text) {
            // Weekly therapy
            if (/weekly.{0,10}family|family.{0,10}weekly/gi.test(text)) {
                this.data.family.weeklyTherapy = true;
                this.metrics.uniqueDataPoints.add('family_weekly');
            }
            
            // Workshops
            if (/family.{0,10}workshop|family.{0,10}education/gi.test(text)) {
                this.data.family.workshops = true;
                this.metrics.uniqueDataPoints.add('family_workshops');
            }
            
            // General involvement
            if (/family.{0,10}involvement|family.{0,10}program/gi.test(text)) {
                this.data.family.involvement = 'Active family involvement program';
                this.metrics.fieldsFound++;
            }
        }
        
        extractAdmissions(text) {
            // Insurance
            const insurers = [
                'BCBS', 'Blue Cross', 'Aetna', 'Cigna', 'United', 'UnitedHealth',
                'Anthem', 'Humana', 'Kaiser', 'Tricare', 'Medicaid', 'Medicare'
            ];
            
            insurers.forEach(insurer => {
                if (new RegExp(insurer, 'gi').test(text)) {
                    this.data.admissions.insurance.push(insurer);
                    this.metrics.uniqueDataPoints.add(`insurance_${insurer}`);
                }
            });
            
            // Private pay
            if (/private pay|self.?pay|cash/gi.test(text)) {
                this.data.admissions.privatePay = true;
                this.metrics.uniqueDataPoints.add('private_pay');
            }
            
            // Financial aid
            if (/scholarship|financial aid|sliding scale/gi.test(text)) {
                this.data.admissions.financialAid = true;
                this.metrics.uniqueDataPoints.add('financial_aid');
            }
        }
        
        extractQuality(text) {
            // Accreditations
            const accreditations = ['CARF', 'Joint Commission', 'JCAHO', 'COA', 'NAATP', 'NATSAP'];
            accreditations.forEach(acc => {
                if (new RegExp(acc, 'gi').test(text)) {
                    this.data.quality.accreditations.push(acc);
                    this.metrics.uniqueDataPoints.add(`accred_${acc}`);
                }
            });
            
            // Memberships
            const memberships = ['NAATP', 'NATSAP', 'ACA', 'NAADAC'];
            memberships.forEach(mem => {
                if (new RegExp(mem, 'gi').test(text)) {
                    this.data.quality.memberships.push(mem);
                    this.metrics.uniqueDataPoints.add(`member_${mem}`);
                }
            });
        }
        
        buildDifferentiators() {
            const diffs = [];
            
            // Unique therapies
            if (this.data.clinical.experiential.length > 2) {
                diffs.push(`Comprehensive experiential therapy program (${this.data.clinical.experiential.length} modalities)`);
            }
            
            // Setting
            if (this.data.environment.setting && !['Urban', 'Suburban'].includes(this.data.environment.setting)) {
                diffs.push(`${this.data.environment.setting} setting for therapeutic environment`);
            }
            
            // Accreditations
            if (this.data.quality.accreditations.length > 0) {
                diffs.push(`${this.data.quality.accreditations.join(', ')} accredited`);
            }
            
            // Special populations
            if (this.data.population.specialPopulations.length > 0) {
                diffs.push(`Specialized programs for ${this.data.population.specialPopulations.join(', ')}`);
            }
            
            // Family program
            if (this.data.family.weeklyTherapy && this.data.family.workshops) {
                diffs.push('Comprehensive family involvement program');
            }
            
            this.data.differentiators = diffs;
        }
        
        calculateMetrics() {
            // Count non-empty fields
            const countFields = (obj) => {
                let count = 0;
                Object.values(obj).forEach(val => {
                    if (val && val !== '' && (!Array.isArray(val) || val.length > 0)) {
                        count++;
                    }
                });
                return count;
            };
            
            this.metrics.fieldsFound = countFields(this.data) + countFields(this.data.location) + 
                                       countFields(this.data.contact) + countFields(this.data.clinical);
            
            // Calculate confidence
            const requiredFields = ['name', 'levelsOfCare', 'contact', 'clinical'];
            const hasRequired = requiredFields.filter(f => {
                const val = this.data[f];
                return val && (typeof val === 'object' ? Object.keys(val).some(k => val[k]) : val.length > 0);
            }).length;
            
            this.metrics.confidence = Math.round((hasRequired / requiredFields.length) * 50 + 
                                                 (this.metrics.uniqueDataPoints.size / 20) * 50);
            this.metrics.confidence = Math.min(100, this.metrics.confidence);
        }
        
        generateWriteUp() {
            let writeUp = '='.repeat(70) + '\n';
            writeUp += 'CLINICAL AFTERCARE RECOMMENDATION\n';
            writeUp += '='.repeat(70) + '\n\n';
            
            writeUp += `PROGRAM: ${this.data.name}\n`;
            if (this.data.location.city || this.data.location.state) {
                writeUp += `LOCATION: ${this.data.location.city}${this.data.location.city && this.data.location.state ? ', ' : ''}${this.data.location.state}\n`;
            }
            writeUp += `WEBSITE: ${this.data.website}\n\n`;
            
            if (this.data.differentiators.length > 0) {
                writeUp += 'KEY DIFFERENTIATORS:\n';
                this.data.differentiators.forEach(diff => {
                    writeUp += `  • ${diff}\n`;
                });
                writeUp += '\n';
            }
            
            if (this.data.levelsOfCare.length > 0) {
                writeUp += 'LEVELS OF CARE:\n';
                this.data.levelsOfCare.forEach(level => {
                    writeUp += `  • ${level}\n`;
                });
                writeUp += '\n';
            }
            
            if (this.data.population.ages || this.data.population.gender) {
                writeUp += 'POPULATION SERVED:\n';
                if (this.data.population.ages) writeUp += `  Ages: ${this.data.population.ages}\n`;
                if (this.data.population.gender) writeUp += `  Gender: ${this.data.population.gender}\n`;
                if (this.data.population.specialPopulations.length > 0) {
                    writeUp += `  Special Populations: ${this.data.population.specialPopulations.join(', ')}\n`;
                }
                writeUp += '\n';
            }
            
            if (this.data.clinical.evidenceBased.length > 0 || this.data.clinical.experiential.length > 0) {
                writeUp += 'CLINICAL PROGRAMMING:\n';
                if (this.data.clinical.primaryFocus) {
                    writeUp += `  Primary Focus: ${this.data.clinical.primaryFocus}\n`;
                }
                if (this.data.clinical.specializations.length > 0) {
                    writeUp += `  Specializations: ${this.data.clinical.specializations.join(', ')}\n`;
                }
                if (this.data.clinical.evidenceBased.length > 0) {
                    writeUp += `  Evidence-Based: ${this.data.clinical.evidenceBased.join(', ')}\n`;
                }
                if (this.data.clinical.experiential.length > 0) {
                    writeUp += `  Experiential: ${this.data.clinical.experiential.join(', ')}\n`;
                }
                writeUp += '\n';
            }
            
            if (this.data.family.involvement || this.data.family.weeklyTherapy || this.data.family.workshops) {
                writeUp += 'FAMILY PROGRAM:\n';
                if (this.data.family.weeklyTherapy) writeUp += '  • Weekly family therapy sessions\n';
                if (this.data.family.workshops) writeUp += '  • Family workshops and education\n';
                if (this.data.family.involvement) writeUp += `  • ${this.data.family.involvement}\n`;
                writeUp += '\n';
            }
            
            if (this.data.admissions.insurance.length > 0 || this.data.admissions.privatePay) {
                writeUp += 'INSURANCE & PAYMENT:\n';
                if (this.data.admissions.insurance.length > 0) {
                    writeUp += `  Accepted: ${this.data.admissions.insurance.join(', ')}\n`;
                }
                if (this.data.admissions.privatePay) writeUp += '  • Private pay accepted\n';
                if (this.data.admissions.financialAid) writeUp += '  • Financial aid available\n';
                writeUp += '\n';
            }
            
            writeUp += 'CONTACT INFORMATION:\n';
            if (this.data.contact.phone) writeUp += `  Phone: ${this.data.contact.phone}\n`;
            if (this.data.contact.email) writeUp += `  Email: ${this.data.contact.email}\n`;
            writeUp += `  Website: ${this.data.website}\n\n`;
            
            writeUp += '-'.repeat(70) + '\n';
            writeUp += `Assessment Date: ${new Date().toLocaleDateString()}\n`;
            writeUp += `Data Confidence: ${this.metrics.confidence}%\n`;
            writeUp += `Fields Extracted: ${this.metrics.fieldsFound}\n`;
            writeUp += `Unique Data Points: ${this.metrics.uniqueDataPoints.size}\n`;
            
            return writeUp;
        }
        
        sendProgress(percent, message) {
            chrome.runtime.sendMessage({
                type: 'extraction-progress',
                status: percent === 100 ? 'complete' : 'extracting',
                progress: percent,
                message: message,
                data: percent === 100 ? this.data : null,
                metrics: this.metrics
            });
        }
        
        titleCase(str) {
            return str.replace(/\w\S*/g, txt => 
                txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
        }
    }
    
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('[CareConnect] Received message:', request);
        
        if (request.action === 'extract-v2' || request.type === 'extract-data') {
            console.log('[CareConnect] Starting extraction...');
            
            const extractor = new SimpleExtractor();
            
            // Start extraction
            extractor.extract()
                .then(result => {
                    console.log('[CareConnect] Extraction complete:', result);
                    
                    // Send final result
                    chrome.runtime.sendMessage({
                        type: 'extraction-progress',
                        status: 'complete',
                        progress: 100,
                        message: 'Extraction complete!',
                        data: result.data,
                        writeUp: result.writeUp,
                        metrics: result.metrics
                    });
                    
                    sendResponse(result);
                })
                .catch(error => {
                    console.error('[CareConnect] Extraction failed:', error);
                    sendResponse({
                        success: false,
                        error: error.message
                    });
                });
            
            return true; // Keep message channel open
        }
    });
    
    console.log('[CareConnect] Ready for extraction');
    
})();
