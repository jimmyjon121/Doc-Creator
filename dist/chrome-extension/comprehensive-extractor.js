// comprehensive-extractor.js - Comprehensive Clinical Data Extraction v7.0

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__FF_COMPREHENSIVE_EXTRACTOR__) {
        console.log('[WARNING] Comprehensive extractor already loaded');
        return;
    }
    window.__FF_COMPREHENSIVE_EXTRACTOR__ = true;
    
    console.log('[INFO] Comprehensive Clinical Extractor v7.0 Loaded');
    
    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract') {
            console.log('[INFO] Starting comprehensive extraction...');
            performComprehensiveExtraction().then(result => {
                console.log('[SUCCESS] Extraction complete:', result.meta);
                sendResponse({ success: true, data: result });
            }).catch(error => {
                console.error('[ERROR] Extraction failed:', error);
                // Fallback to basic extraction
                const basicResult = performBasicExtraction();
                sendResponse({ success: true, data: basicResult });
            });
            return true;
        }
    });
    
    // Main extraction function
    async function performComprehensiveExtraction() {
        const startTime = Date.now();
        
        // Initialize data structure
        const data = {
            name: '',
            city: '',
            state: '',
            levelsOfCare: [],
            population: {
                ages: '',
                gender: '',
                specificPopulations: []
            },
            overview: '',
            philosophy: '',
            approach: '',
            differentiators: [],
            structure: {
                los: '',
                phases: [],
                ratio: '',
                groupSize: '',
                typicalDay: '',
                academics: { hasProgram: false, accreditation: '' }
            },
            clinical: {
                evidenceBased: [],
                experiential: [],
                specializations: [],
                individualTherapy: '',
                groupTherapy: '',
                psychiatricServices: false,
                medicationManagement: false,
                traumaInformed: false
            },
            family: {
                weeklyTherapy: false,
                workshops: false,
                visitationPolicy: '',
                familyWeekend: false,
                parentSupport: false,
                involvement: ''
            },
            staff: {
                credentials: [],
                specialties: [],
                ratio: '',
                leadership: []
            },
            facilities: {
                setting: '',
                campus: '',
                amenities: [],
                recreation: [],
                rooms: ''
            },
            outcomes: {
                successMetrics: '',
                alumni: false
            },
            admissions: {
                insurance: [],
                financing: false,
                process: '',
                requirements: [],
                email: '',
                phone: '',
                website: window.location.href
            },
            quality: {
                accreditations: [],
                memberships: [],
                certifications: []
            },
            meta: {
                sourcesAnalyzed: 1,
                pagesScanned: [window.location.href],
                confidence: 0,
                extractionTime: 0
            }
        };
        
        // Extract from current page
        console.log('[INFO] Extracting from current page...');
        await extractFromCurrentPage(data);
        
        // Discover and extract from related pages
        console.log('[INFO] Discovering related pages...');
        const relatedPages = await discoverRelatedPages();
        console.log(`[INFO] Found ${relatedPages.length} related pages`);
        
        // Process each page
        for (let i = 0; i < Math.min(relatedPages.length, 8); i++) {
            const pageUrl = relatedPages[i];
            try {
                console.log(`[INFO] Processing page ${i+1}/${Math.min(relatedPages.length, 8)}: ${pageUrl}`);
                const pageData = await fetchPage(pageUrl);
                if (pageData) {
                    extractFromPage(data, pageData, pageUrl);
                    data.meta.pagesScanned.push(pageUrl);
                    data.meta.sourcesAnalyzed++;
                }
            } catch (error) {
                console.warn(`[WARNING] Failed to process ${pageUrl}:`, error);
            }
        }
        
        // Clean and consolidate data
        consolidateData(data);
        
        // Calculate confidence
        data.meta.confidence = calculateConfidence(data);
        data.meta.extractionTime = Date.now() - startTime;
        
        return data;
    }
    
    // Extract from current page
    async function extractFromCurrentPage(data) {
        // Get all text from page
        const pageText = document.body?.innerText || '';
        const pageHtml = document.body?.innerHTML || '';
        
        // Extract program name
        data.name = extractProgramName();
        
        // Extract location
        const location = extractLocation(pageText);
        if (location) {
            data.city = location.city;
            data.state = location.state;
        }
        
        // Extract all data points
        extractLevelsOfCare(data, pageText);
        extractPopulation(data, pageText);
        extractClinicalServices(data, pageText);
        extractProgramStructure(data, pageText);
        extractFamilyProgram(data, pageText);
        extractStaff(data, pageText);
        extractFacilities(data, pageText);
        extractAdmissions(data, pageText);
        extractAccreditations(data, pageText);
        extractOverview(data, pageText);
    }
    
    // Discover related pages
    async function discoverRelatedPages() {
        const pages = new Set();
        const currentDomain = window.location.hostname;
        const currentPath = window.location.pathname;
        
        // Find all links
        const allLinks = document.querySelectorAll('a[href]');
        
        // Priority keywords for treatment programs
        const priorityKeywords = [
            'about', 'program', 'treatment', 'clinical', 'therapy',
            'admissions', 'insurance', 'family', 'parent',
            'staff', 'team', 'academics', 'education',
            'facilities', 'campus', 'daily', 'schedule',
            'approach', 'philosophy', 'outcomes'
        ];
        
        allLinks.forEach(link => {
            const href = link.href;
            const linkText = link.textContent.toLowerCase();
            
            // Only same domain
            if (href && href.includes(currentDomain) && !href.includes('#')) {
                // Check if it's a priority page
                let isPriority = false;
                for (const keyword of priorityKeywords) {
                    if (href.toLowerCase().includes(keyword) || linkText.includes(keyword)) {
                        isPriority = true;
                        break;
                    }
                }
                
                if (isPriority) {
                    pages.add(href);
                }
            }
        });
        
        // Also add main navigation links
        const navLinks = document.querySelectorAll('nav a, .navigation a, .menu a, header a');
        navLinks.forEach(link => {
            if (link.href && link.href.includes(currentDomain) && !link.href.includes('#')) {
                pages.add(link.href);
            }
        });
        
        // Remove current page
        pages.delete(window.location.href);
        
        return Array.from(pages);
    }
    
    // Fetch page content
    async function fetchPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            return {
                text: doc.body?.innerText || '',
                html: html,
                doc: doc
            };
        } catch (error) {
            console.warn(`[WARNING] Failed to fetch ${url}:`, error);
            return null;
        }
    }
    
    // Extract from fetched page
    function extractFromPage(data, pageData, url) {
        const text = pageData.text;
        const urlLower = url.toLowerCase();
        
        // Extract based on page type
        if (urlLower.includes('about') || urlLower.includes('philosophy')) {
            extractPhilosophyApproach(data, text);
            if (!data.overview) {
                extractOverview(data, text);
            }
        }
        
        if (urlLower.includes('program') || urlLower.includes('treatment') || urlLower.includes('clinical')) {
            extractClinicalServices(data, text);
            extractProgramStructure(data, text);
        }
        
        if (urlLower.includes('family') || urlLower.includes('parent')) {
            extractFamilyProgram(data, text);
        }
        
        if (urlLower.includes('staff') || urlLower.includes('team')) {
            extractStaff(data, text);
        }
        
        if (urlLower.includes('admissions') || urlLower.includes('insurance')) {
            extractAdmissions(data, text);
        }
        
        if (urlLower.includes('facilities') || urlLower.includes('campus')) {
            extractFacilities(data, text);
        }
        
        if (urlLower.includes('academics') || urlLower.includes('education')) {
            extractAcademics(data, text);
        }
    }
    
    // Extraction functions
    
    function extractProgramName() {
        // Try multiple sources
        const sources = [
            () => {
                const jsonLd = document.querySelector('script[type="application/ld+json"]');
                if (jsonLd) {
                    try {
                        const data = JSON.parse(jsonLd.textContent);
                        return data.name || (data['@graph'] && data['@graph'][0]?.name);
                    } catch (e) {}
                }
            },
            () => document.querySelector('meta[property="og:site_name"]')?.content,
            () => document.querySelector('meta[name="application-name"]')?.content,
            () => {
                const h1 = document.querySelector('h1');
                return h1?.textContent?.trim();
            },
            () => document.title.split(/[-|]/)[0].trim()
        ];
        
        for (const source of sources) {
            const name = source();
            if (name && name.length > 2 && name.length < 100) {
                return name;
            }
        }
        
        return 'Treatment Program';
    }
    
    function extractLocation(text) {
        // Multiple patterns for location
        const patterns = [
            /(?:located in|serving)\s+([\w\s]+),\s*([A-Z]{2}|\w+)/i,
            /([\w\s]+),\s*(FL|CA|TX|AZ|UT|CO|Florida|California|Texas|Arizona|Utah|Colorado)/i,
            /(\w+(?:\s+\w+)?),\s*([A-Z]{2})\s+\d{5}/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const city = match[1].trim();
                let state = match[2];
                
                // Convert full state names to abbreviations
                const stateMap = {
                    'Florida': 'FL', 'California': 'CA', 'Texas': 'TX',
                    'Arizona': 'AZ', 'Utah': 'UT', 'Colorado': 'CO'
                };
                
                if (stateMap[state]) {
                    state = stateMap[state];
                }
                
                return { city, state: state.toUpperCase() };
            }
        }
        
        return null;
    }
    
    function extractLevelsOfCare(data, text) {
        const levels = [];
        
        const levelPatterns = {
            'Residential': /residential\s+(treatment|program|care)/i,
            'PHP': /PHP|partial\s+hospitalization/i,
            'IOP': /IOP|intensive\s+outpatient/i,
            'Outpatient': /outpatient\s+(treatment|program|therapy)/i
        };
        
        Object.entries(levelPatterns).forEach(([level, pattern]) => {
            if (pattern.test(text)) {
                levels.push(level);
            }
        });
        
        data.levelsOfCare = [...new Set([...data.levelsOfCare, ...levels])];
    }
    
    function extractPopulation(data, text) {
        // Age ranges
        const agePatterns = [
            /ages?\s+(\d{1,2})[\s-]+(?:to|through)\s+(\d{1,2})/i,
            /(\d{1,2})[\s-]+to\s+(\d{1,2})\s+years?\s+old/i,
            /serving\s+(?:youth|teens?|adolescents?)\s+(?:ages?\s+)?(\d{1,2})[\s-]+(\d{1,2})/i
        ];
        
        for (const pattern of agePatterns) {
            const match = text.match(pattern);
            if (match) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                if (min >= 10 && max <= 30 && min < max) {
                    data.population.ages = `${min}-${max}`;
                    break;
                }
            }
        }
        
        // Fallback to descriptive
        if (!data.population.ages) {
            if (/young\s+adults?/i.test(text)) data.population.ages = 'Young Adults';
            else if (/adolescents?/i.test(text)) data.population.ages = 'Adolescents';
            else if (/teens?/i.test(text)) data.population.ages = 'Teens';
        }
        
        // Gender
        if (/boys?\s+only|all[\s-]?boys?|males?\s+only/i.test(text)) {
            data.population.gender = 'Males Only';
        } else if (/girls?\s+only|all[\s-]?girls?|females?\s+only/i.test(text)) {
            data.population.gender = 'Females Only';
        } else if (/co[\s-]?ed/i.test(text)) {
            data.population.gender = 'Co-ed';
        }
        
        // Specific populations
        if (/LGBTQ/i.test(text)) data.population.specificPopulations.push('LGBTQ+');
        if (/adopted|adoption/i.test(text)) data.population.specificPopulations.push('Adopted Youth');
        if (/foster/i.test(text)) data.population.specificPopulations.push('Foster Youth');
    }
    
    function extractClinicalServices(data, text) {
        // Evidence-based therapies
        const evidenceBased = {
            'CBT': /\bCBT\b|cognitive[\s-]?behavioral/i,
            'DBT': /\bDBT\b|dialectical[\s-]?behav/i,
            'EMDR': /\bEMDR\b|eye\s+movement/i,
            'ACT': /\bACT\b|acceptance\s+and\s+commitment/i,
            'MI': /\bMI\b|motivational\s+interview/i,
            'TF-CBT': /TF[\s-]?CBT|trauma[\s-]?focused\s+cbt/i,
            'CPT': /\bCPT\b|cognitive\s+processing/i,
            'PE': /\bPE\b|prolonged\s+exposure/i,
            'IFS': /\bIFS\b|internal\s+family\s+systems/i,
            'MST': /\bMST\b|multisystemic\s+therapy/i,
            'FFT': /\bFFT\b|functional\s+family/i
        };
        
        Object.entries(evidenceBased).forEach(([therapy, pattern]) => {
            if (pattern.test(text) && !data.clinical.evidenceBased.includes(therapy)) {
                data.clinical.evidenceBased.push(therapy);
            }
        });
        
        // Experiential therapies
        const experiential = [
            'Art Therapy', 'Music Therapy', 'Equine Therapy',
            'Adventure Therapy', 'Wilderness Therapy',
            'Drama Therapy', 'Dance/Movement Therapy',
            'Recreation Therapy', 'Yoga', 'Mindfulness'
        ];
        
        experiential.forEach(therapy => {
            if (new RegExp(therapy, 'i').test(text) && !data.clinical.experiential.includes(therapy)) {
                data.clinical.experiential.push(therapy);
            }
        });
        
        // Specializations
        const specializations = {
            'Trauma/PTSD': /trauma|PTSD|post[\s-]?traumatic/i,
            'Anxiety': /anxiety\s+disorders?/i,
            'Depression': /depression|major\s+depressive/i,
            'ADHD': /ADHD|ADD|attention[\s-]?deficit/i,
            'OCD': /OCD|obsessive[\s-]?compulsive/i,
            'Eating Disorders': /eating\s+disorder|anorexia|bulimia|binge/i,
            'Substance Use': /substance\s+(?:use|abuse)|addiction|chemical\s+dependency/i,
            'Self-Harm': /self[\s-]?harm|self[\s-]?injur|cutting/i,
            'Autism Spectrum': /autism|ASD|asperger/i,
            'Bipolar': /bipolar/i,
            'Technology Addiction': /gaming\s+addiction|internet\s+addiction|screen/i
        };
        
        Object.entries(specializations).forEach(([spec, pattern]) => {
            if (pattern.test(text) && !data.clinical.specializations.includes(spec)) {
                data.clinical.specializations.push(spec);
            }
        });
        
        // Other clinical services
        if (/psychiatr/i.test(text)) data.clinical.psychiatricServices = true;
        if (/medication\s+management/i.test(text)) data.clinical.medicationManagement = true;
        if (/trauma[\s-]?informed/i.test(text)) data.clinical.traumaInformed = true;
        
        // Therapy intensity
        let match = text.match(/(\d+)\s*hours?\s+of\s+individual/i);
        if (match && !data.clinical.individualTherapy) {
            data.clinical.individualTherapy = `${match[1]} hours/week`;
        }
        
        match = text.match(/(\d+)\s*hours?\s+of\s+group/i);
        if (match && !data.clinical.groupTherapy) {
            data.clinical.groupTherapy = `${match[1]} hours/week`;
        }
    }
    
    function extractProgramStructure(data, text) {
        // Length of stay
        const losPatterns = [
            /(?:average|typical)\s+(?:length\s+of\s+)?stay[\s:]+(\d+)(?:[\s-]+(?:to|through)[\s-]+(\d+))?\s*(days?|weeks?|months?)/i,
            /(\d+)(?:[\s-]+to[\s-]+(\d+))?\s*(days?|weeks?|months?)\s+program/i
        ];
        
        for (const pattern of losPatterns) {
            const match = text.match(pattern);
            if (match) {
                if (match[2]) {
                    data.structure.los = `${match[1]}-${match[2]} ${match[3]}`;
                } else {
                    data.structure.los = `${match[1]} ${match[3]}`;
                }
                break;
            }
        }
        
        // Staff ratio
        const ratioMatch = text.match(/(?:staff|therapist)[\s-]?to[\s-]?(?:student|client|resident)[\s:]+(\d+)[\s:]+(\d+)/i);
        if (ratioMatch) {
            data.structure.ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
        }
        
        // Phases
        const phaseMatches = text.match(/phase\s+(?:one|two|three|four|\d+)/gi);
        if (phaseMatches) {
            data.structure.phases = [...new Set(phaseMatches)];
        }
        
        // Group size
        const groupMatch = text.match(/(?:small\s+)?groups?\s+of\s+(\d+)/i);
        if (groupMatch) {
            data.structure.groupSize = `Groups of ${groupMatch[1]}`;
        }
    }
    
    function extractFamilyProgram(data, text) {
        if (/weekly\s+family\s+therapy/i.test(text)) {
            data.family.weeklyTherapy = true;
        }
        
        if (/parent\s+(?:workshop|education|seminar)/i.test(text)) {
            data.family.workshops = true;
        }
        
        if (/family\s+weekend/i.test(text)) {
            data.family.familyWeekend = true;
        }
        
        if (/parent\s+support\s+group/i.test(text)) {
            data.family.parentSupport = true;
        }
        
        const visitMatch = text.match(/visitation[\s:]+([^.]+)/i);
        if (visitMatch) {
            data.family.visitationPolicy = visitMatch[1].trim();
        }
    }
    
    function extractStaff(data, text) {
        // Credentials
        const credentials = ['LCSW', 'LPC', 'LMFT', 'LMHC', 'PhD', 'PsyD', 'MD', 'RN', 'CADC'];
        credentials.forEach(cred => {
            if (text.includes(cred) && !data.staff.credentials.includes(cred)) {
                data.staff.credentials.push(cred);
            }
        });
        
        // Leadership
        const titles = ['Clinical Director', 'Medical Director', 'Executive Director', 'Program Director'];
        titles.forEach(title => {
            if (text.includes(title) && !data.staff.leadership.includes(title)) {
                data.staff.leadership.push(title);
            }
        });
    }
    
    function extractFacilities(data, text) {
        // Setting
        if (/mountain/i.test(text)) data.facilities.setting = 'Mountain setting';
        else if (/beach|ocean|coastal/i.test(text)) data.facilities.setting = 'Beach/coastal setting';
        else if (/rural/i.test(text)) data.facilities.setting = 'Rural setting';
        else if (/urban|city/i.test(text)) data.facilities.setting = 'Urban setting';
        
        // Campus
        const acreMatch = text.match(/(\d+)[\s-]?acre/i);
        if (acreMatch) {
            data.facilities.campus = `${acreMatch[1]} acre campus`;
        }
        
        // Room type
        if (/private\s+room/i.test(text)) data.facilities.rooms = 'Private rooms';
        else if (/semi[\s-]?private/i.test(text)) data.facilities.rooms = 'Semi-private rooms';
        else if (/shared\s+room/i.test(text)) data.facilities.rooms = 'Shared rooms';
        
        // Amenities
        const amenities = ['pool', 'gym', 'fitness center', 'basketball court', 'tennis court',
                          'art studio', 'music room', 'library', 'cafeteria'];
        amenities.forEach(amenity => {
            if (text.toLowerCase().includes(amenity) && !data.facilities.amenities.includes(amenity)) {
                data.facilities.amenities.push(amenity);
            }
        });
        
        // Recreation
        const activities = ['hiking', 'rock climbing', 'kayaking', 'surfing', 'skiing',
                           'horseback riding', 'mountain biking', 'fishing'];
        activities.forEach(activity => {
            if (text.toLowerCase().includes(activity) && !data.facilities.recreation.includes(activity)) {
                data.facilities.recreation.push(activity);
            }
        });
    }
    
    function extractAdmissions(data, text) {
        // Insurance
        const insurers = [
            'Aetna', 'Anthem', 'Blue Cross', 'Blue Shield', 'BCBS',
            'Cigna', 'United Healthcare', 'UnitedHealth', 'Humana',
            'Kaiser', 'Magellan', 'Optum', 'Beacon', 'TRICARE',
            'Medicaid', 'Medicare'
        ];
        
        insurers.forEach(insurer => {
            if (text.includes(insurer)) {
                if ((insurer === 'Blue Cross' || insurer === 'Blue Shield') && !data.admissions.insurance.includes('BCBS')) {
                    data.admissions.insurance.push('BCBS');
                } else if (!data.admissions.insurance.includes(insurer)) {
                    data.admissions.insurance.push(insurer);
                }
            }
        });
        
        // Financing
        if (/financing|payment\s+plan|financial\s+aid/i.test(text)) {
            data.admissions.financing = true;
        }
        
        // Contact info
        const phoneMatch = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (phoneMatch && !data.admissions.phone) {
            data.admissions.phone = phoneMatch[0];
        }
        
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch && !data.admissions.email) {
            data.admissions.email = emailMatch[0];
        }
    }
    
    function extractAccreditations(data, text) {
        const accreds = [
            'Joint Commission', 'JCAHO', 'CARF', 'COA',
            'NATSAP', 'NAATP', 'BBB'
        ];
        
        accreds.forEach(accred => {
            if (text.includes(accred) && !data.quality.accreditations.includes(accred)) {
                data.quality.accreditations.push(accred);
            }
        });
    }
    
    function extractAcademics(data, text) {
        if (/on[\s-]?site\s+(?:school|academics|education)/i.test(text)) {
            data.structure.academics.hasProgram = true;
        }
        
        const academicAccreds = ['Cognia', 'AdvancED', 'WASC', 'SACS'];
        for (const accred of academicAccreds) {
            if (text.includes(accred)) {
                data.structure.academics.accreditation = accred;
                data.structure.academics.hasProgram = true;
                break;
            }
        }
    }
    
    function extractOverview(data, text) {
        // Look for about section
        const aboutMatch = text.match(/(?:about\s+us|who\s+we\s+are|overview)[\s:]+([^.]+\.[^.]+\.)/i);
        if (aboutMatch) {
            data.overview = aboutMatch[1].trim();
        }
    }
    
    function extractPhilosophyApproach(data, text) {
        const philMatch = text.match(/(?:our\s+)?philosophy[\s:]+([^.]+\.)/i);
        if (philMatch) {
            data.philosophy = philMatch[1].trim();
        }
        
        const approachMatch = text.match(/(?:our\s+)?approach[\s:]+([^.]+\.)/i);
        if (approachMatch) {
            data.approach = approachMatch[1].trim();
        }
    }
    
    // Consolidate data
    function consolidateData(data) {
        // Remove duplicates from arrays
        Object.keys(data).forEach(section => {
            if (typeof data[section] === 'object' && data[section] !== null) {
                Object.keys(data[section]).forEach(key => {
                    if (Array.isArray(data[section][key])) {
                        data[section][key] = [...new Set(data[section][key])];
                    }
                });
            }
        });
        
        // Ensure we have a name
        if (!data.name) {
            data.name = 'Treatment Program';
        }
    }
    
    // Calculate confidence
    function calculateConfidence(data) {
        let points = 0;
        let maxPoints = 0;
        
        // Check critical fields
        const checks = [
            { value: data.name && data.name !== 'Treatment Program', points: 15 },
            { value: data.city && data.state, points: 10 },
            { value: data.levelsOfCare.length > 0, points: 10 },
            { value: data.population.ages, points: 10 },
            { value: data.clinical.evidenceBased.length > 0, points: 15 },
            { value: data.clinical.specializations.length > 0, points: 10 },
            { value: data.admissions.insurance.length > 0, points: 10 },
            { value: data.admissions.phone || data.admissions.email, points: 10 },
            { value: data.quality.accreditations.length > 0, points: 5 },
            { value: data.meta.sourcesAnalyzed > 1, points: 5 }
        ];
        
        checks.forEach(check => {
            maxPoints += check.points;
            if (check.value) points += check.points;
        });
        
        return Math.round((points / maxPoints) * 100);
    }
    
    // Basic extraction fallback
    function performBasicExtraction() {
        const pageText = document.body?.innerText || '';
        
        return {
            name: document.title.split(/[-|]/)[0].trim() || 'Treatment Program',
            city: '',
            state: '',
            levelsOfCare: [],
            population: { ages: '', gender: '', specificPopulations: [] },
            overview: '',
            philosophy: '',
            approach: '',
            differentiators: [],
            structure: {
                los: '',
                phases: [],
                ratio: '',
                groupSize: '',
                typicalDay: '',
                academics: { hasProgram: false, accreditation: '' }
            },
            clinical: {
                evidenceBased: [],
                experiential: [],
                specializations: [],
                individualTherapy: '',
                groupTherapy: '',
                psychiatricServices: false,
                medicationManagement: false,
                traumaInformed: false
            },
            family: {
                weeklyTherapy: false,
                workshops: false,
                visitationPolicy: '',
                familyWeekend: false,
                parentSupport: false,
                involvement: ''
            },
            staff: {
                credentials: [],
                specialties: [],
                ratio: '',
                leadership: []
            },
            facilities: {
                setting: '',
                campus: '',
                amenities: [],
                recreation: [],
                rooms: ''
            },
            outcomes: {
                successMetrics: '',
                alumni: false
            },
            admissions: {
                insurance: [],
                financing: false,
                process: '',
                requirements: [],
                email: '',
                phone: pageText.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/)?.[0] || '',
                website: window.location.href
            },
            quality: {
                accreditations: [],
                memberships: [],
                certifications: []
            },
            meta: {
                sourcesAnalyzed: 1,
                pagesScanned: [window.location.href],
                confidence: 25,
                extractionTime: 100
            }
        };
    }
    
})();
