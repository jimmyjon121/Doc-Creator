// multi-page-extractor.js - Comprehensive Multi-Page Clinical Data Extraction v5.1

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__FF_MULTI_PAGE_EXTRACTOR__) {
        console.log('[WARNING] Multi-page extractor already loaded');
        return;
    }
    window.__FF_MULTI_PAGE_EXTRACTOR__ = true;
    
    console.log('[INFO] Multi-Page Clinical Extractor v5.1 Loaded');
    
    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract') {
            console.log('[INFO] Starting comprehensive multi-page extraction...');
            performComprehensiveExtraction().then(result => {
                console.log('[SUCCESS] Multi-page extraction complete:', result.meta);
                sendResponse({ success: true, data: result });
            }).catch(error => {
                console.error('[ERROR] Extraction failed:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
        }
    });
    
    // Main comprehensive extraction function
    async function performComprehensiveExtraction() {
        const startTime = Date.now();
        
        // Initialize comprehensive data structure
        const data = {
            // Basic Info
            name: '',
            city: '',
            state: '',
            levelsOfCare: [],
            
            // Population & Demographics
            population: {
                ages: '',
                gender: '',
                specificPopulations: []
            },
            
            // Comprehensive Overview
            overviewBullets: [],
            philosophy: '',
            approach: '',
            differentiators: [],
            
            // Program Structure
            structure: {
                los: '',
                phases: [],
                ratio: '',
                groupSize: '',
                academics: { hasProgram: false, accreditation: '' },
                dailySchedule: ''
            },
            
            // Clinical Services (Comprehensive)
            clinical: {
                evidenceBased: [],
                experiential: [],
                specializations: [],
                individualTherapyHours: '',
                groupTherapyHours: '',
                psychiatricServices: false,
                medicationManagement: false,
                traumaInformed: false
            },
            
            // Family Program
            family: {
                weeklyTherapy: false,
                workshops: false,
                visitationPolicy: '',
                familyWeekend: false,
                parentSupport: false,
                notes: []
            },
            
            // Staff & Credentials
            staff: {
                credentials: [],
                specialties: [],
                ratio: '',
                availability: '',
                leadership: []
            },
            
            // Facilities & Amenities
            facilities: {
                setting: '',
                roomType: '',
                amenities: [],
                recreation: [],
                technology: ''
            },
            
            // Outcomes & Success
            outcomes: {
                successRate: '',
                averageLOS: '',
                testimonials: [],
                alumni: false
            },
            
            // Admissions & Logistics
            admissions: {
                insurance: [],
                financing: false,
                transportation: '',
                admissionsCriteria: [],
                exclusions: [],
                email: '',
                phone: '',
                website: window.location.href
            },
            
            // Quality & Accreditations
            quality: {
                accreditations: [],
                memberships: [],
                licenses: []
            },
            
            // Metadata
            meta: {
                sourcesAnalyzed: 1,
                pagesScanned: [],
                confidence: 0,
                extractionTime: 0
            }
        };
        
        // Extract from current page first
        console.log('[INFO] Extracting from current page...');
        extractFromCurrentPage(data);
        
        // Discover and crawl related pages
        console.log('[INFO] Discovering related pages...');
        const relatedPages = await discoverRelatedPages();
        
        // Crawl each related page
        for (const pageUrl of relatedPages.slice(0, 10)) { // Limit to 10 pages
            try {
                console.log(`[INFO] Fetching page: ${pageUrl}`);
                const pageContent = await fetchPageContent(pageUrl);
                if (pageContent) {
                    extractFromPageContent(data, pageContent, pageUrl);
                    data.meta.pagesScanned.push(pageUrl);
                    data.meta.sourcesAnalyzed++;
                }
            } catch (error) {
                console.warn(`[WARNING] Failed to fetch ${pageUrl}:`, error);
            }
        }
        
        // Post-process and consolidate data
        consolidateData(data);
        
        // Calculate confidence score
        data.meta.confidence = calculateComprehensiveConfidence(data);
        data.meta.extractionTime = Date.now() - startTime;
        
        return data;
    }
    
    // Extract from current page
    function extractFromCurrentPage(data) {
        const pageText = document.body?.innerText || '';
        
        // Extract basic info
        data.name = extractProgramName();
        const location = extractLocation(pageText);
        if (location) {
            data.city = location.city;
            data.state = location.state;
        }
        
        // Extract all comprehensive data
        data.levelsOfCare = extractLevelsOfCare(pageText);
        data.population.ages = extractAgeRange(pageText);
        data.population.gender = extractGenderFocus(pageText);
        data.population.specificPopulations = extractSpecificPopulations(pageText);
        
        // Extract clinical services
        data.clinical.evidenceBased = extractEvidenceBasedTherapies(pageText);
        data.clinical.experiential = extractExperientialTherapies(pageText);
        data.clinical.specializations = extractSpecializations(pageText);
        data.clinical.traumaInformed = /trauma[\s-]?informed/i.test(pageText);
        data.clinical.psychiatricServices = /psychiatr/i.test(pageText);
        data.clinical.medicationManagement = /medication\s+management/i.test(pageText);
        
        // Extract program structure
        data.structure.los = extractLengthOfStay(pageText);
        data.structure.ratio = extractStaffRatio(pageText);
        data.structure.phases = extractProgramPhases(pageText);
        data.structure.academics = extractAcademicProgram(pageText);
        
        // Extract family program
        data.family = extractFamilyProgram(pageText);
        
        // Extract staff info
        data.staff.credentials = extractStaffCredentials(pageText);
        data.staff.ratio = data.structure.ratio;
        
        // Extract facilities
        data.facilities.setting = extractSetting(pageText);
        data.facilities.amenities = extractAmenities(pageText);
        data.facilities.recreation = extractRecreation(pageText);
        
        // Extract admissions
        data.admissions.insurance = extractInsuranceProviders(pageText);
        data.admissions.phone = extractPrimaryPhone(pageText);
        data.admissions.email = extractPrimaryEmail(pageText);
        
        // Extract quality indicators
        data.quality.accreditations = extractAccreditations(pageText);
        data.quality.memberships = extractMemberships(pageText);
        
        // Extract overview and philosophy
        extractPhilosophyAndApproach(data, pageText);
        extractDifferentiators(data, pageText);
    }
    
    // Discover related pages to crawl
    async function discoverRelatedPages() {
        const pages = new Set();
        const currentDomain = window.location.hostname;
        
        // Priority pages to look for
        const priorityKeywords = [
            'about', 'our-program', 'program', 'programs',
            'treatment', 'approach', 'philosophy', 'clinical',
            'admissions', 'insurance', 'cost', 'tuition',
            'family', 'parent', 'family-program',
            'staff', 'team', 'leadership',
            'academics', 'education', 'school',
            'facilities', 'campus', 'location',
            'daily-schedule', 'typical-day',
            'outcomes', 'success', 'testimonials',
            'specialties', 'conditions-treated'
        ];
        
        // Find all links on current page
        const links = document.querySelectorAll('a[href]');
        links.forEach(link => {
            const href = link.href;
            // Only include same-domain links
            if (href && href.includes(currentDomain)) {
                // Check if link contains priority keywords
                const lowerHref = href.toLowerCase();
                const linkText = link.textContent.toLowerCase();
                
                for (const keyword of priorityKeywords) {
                    if (lowerHref.includes(keyword) || linkText.includes(keyword)) {
                        pages.add(href);
                        break;
                    }
                }
            }
        });
        
        // Also check navigation menus
        const navLinks = document.querySelectorAll('nav a, .menu a, .navigation a, header a');
        navLinks.forEach(link => {
            if (link.href && link.href.includes(currentDomain)) {
                pages.add(link.href);
            }
        });
        
        return Array.from(pages);
    }
    
    // Fetch page content
    async function fetchPageContent(url) {
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
    
    // Extract from fetched page content
    function extractFromPageContent(data, pageContent, pageUrl) {
        const { text, doc } = pageContent;
        const urlLower = pageUrl.toLowerCase();
        
        // Page-specific extraction based on URL
        if (urlLower.includes('about') || urlLower.includes('philosophy')) {
            extractPhilosophyAndApproach(data, text);
            extractDifferentiators(data, text);
        }
        
        if (urlLower.includes('program') || urlLower.includes('treatment')) {
            // Extract detailed clinical information
            const newEvidenceBased = extractEvidenceBasedTherapies(text);
            const newExperiential = extractExperientialTherapies(text);
            const newSpecializations = extractSpecializations(text);
            
            // Merge with existing data
            data.clinical.evidenceBased = [...new Set([...data.clinical.evidenceBased, ...newEvidenceBased])];
            data.clinical.experiential = [...new Set([...data.clinical.experiential, ...newExperiential])];
            data.clinical.specializations = [...new Set([...data.clinical.specializations, ...newSpecializations])];
            
            // Extract therapy hours
            const hoursMatch = text.match(/(\d+)\s*hours?\s*(?:of\s*)?(?:individual|one-on-one)/i);
            if (hoursMatch) data.clinical.individualTherapyHours = hoursMatch[1] + ' hours';
            
            const groupMatch = text.match(/(\d+)\s*hours?\s*(?:of\s*)?group/i);
            if (groupMatch) data.clinical.groupTherapyHours = groupMatch[1] + ' hours';
        }
        
        if (urlLower.includes('family')) {
            const familyData = extractFamilyProgram(text);
            // Merge family data
            data.family.weeklyTherapy = data.family.weeklyTherapy || familyData.weeklyTherapy;
            data.family.workshops = data.family.workshops || familyData.workshops;
            data.family.familyWeekend = data.family.familyWeekend || /family\s+weekend/i.test(text);
            data.family.parentSupport = data.family.parentSupport || /parent\s+support\s+group/i.test(text);
            if (familyData.notes.length > 0) {
                data.family.notes = [...new Set([...data.family.notes, ...familyData.notes])];
            }
        }
        
        if (urlLower.includes('staff') || urlLower.includes('team')) {
            const newCredentials = extractStaffCredentials(text);
            data.staff.credentials = [...new Set([...data.staff.credentials, ...newCredentials])];
            
            // Extract leadership
            const leadershipTitles = ['Executive Director', 'Clinical Director', 'Medical Director', 'Program Director'];
            leadershipTitles.forEach(title => {
                if (text.includes(title)) {
                    data.staff.leadership.push(title);
                }
            });
        }
        
        if (urlLower.includes('admissions') || urlLower.includes('insurance')) {
            const newInsurance = extractInsuranceProviders(text);
            data.admissions.insurance = [...new Set([...data.admissions.insurance, ...newInsurance])];
            
            // Extract financing options
            data.admissions.financing = /financing|payment\s+plan|financial\s+aid/i.test(text);
            
            // Extract admission criteria
            if (urlLower.includes('admissions')) {
                extractAdmissionsCriteria(data, text);
            }
        }
        
        if (urlLower.includes('facilities') || urlLower.includes('campus')) {
            const newAmenities = extractAmenities(text);
            data.facilities.amenities = [...new Set([...data.facilities.amenities, ...newAmenities])];
            
            // Extract room type
            if (/private\s+room/i.test(text)) data.facilities.roomType = 'Private rooms';
            else if (/semi[\s-]?private/i.test(text)) data.facilities.roomType = 'Semi-private rooms';
            else if (/shared\s+room/i.test(text)) data.facilities.roomType = 'Shared rooms';
        }
        
        if (urlLower.includes('schedule') || urlLower.includes('typical-day')) {
            extractDailySchedule(data, text);
        }
        
        if (urlLower.includes('outcomes') || urlLower.includes('success')) {
            extractOutcomes(data, text);
        }
    }
    
    // Extract philosophy and approach
    function extractPhilosophyAndApproach(data, text) {
        // Look for philosophy section
        const philosophyMatch = text.match(/(?:our\s+)?(?:treatment\s+)?philosophy[:\s]+([^.]+\.[^.]+\.)/i);
        if (philosophyMatch && !data.philosophy) {
            data.philosophy = philosophyMatch[1].trim();
        }
        
        // Look for approach
        const approachMatch = text.match(/(?:our\s+)?(?:treatment\s+)?approach[:\s]+([^.]+\.[^.]+\.)/i);
        if (approachMatch && !data.approach) {
            data.approach = approachMatch[1].trim();
        }
        
        // Extract overview bullets from about section
        const aboutSection = findSectionContent(['about us', 'who we are', 'overview'], text);
        if (aboutSection && data.overviewBullets.length === 0) {
            const sentences = aboutSection.match(/[^.!?]+[.!?]+/g);
            if (sentences) {
                data.overviewBullets = sentences.slice(0, 5).map(s => s.trim());
            }
        }
    }
    
    // Extract program differentiators
    function extractDifferentiators(data, text) {
        const differentiators = [];
        
        // Look for unique features
        if (/evidence[\s-]?based/i.test(text) && /research[\s-]?backed/i.test(text)) {
            differentiators.push('Research-backed clinical approach');
        }
        
        if (/24\/7|round[\s-]?the[\s-]?clock/i.test(text)) {
            differentiators.push('24/7 clinical support');
        }
        
        if (/individualized|personalized|customized/i.test(text)) {
            differentiators.push('Individualized treatment plans');
        }
        
        if (/small[\s-]?group|low[\s-]?ratio/i.test(text)) {
            differentiators.push('Small group sizes');
        }
        
        if (/family[\s-]?owned|independently[\s-]?owned/i.test(text)) {
            differentiators.push('Family-owned program');
        }
        
        if (/decades?\s+of\s+experience|established\s+\d{4}/i.test(text)) {
            differentiators.push('Established program with proven track record');
        }
        
        data.differentiators = [...new Set([...data.differentiators, ...differentiators])];
    }
    
    // Extract admission criteria
    function extractAdmissionsCriteria(data, text) {
        const criteria = [];
        const exclusions = [];
        
        // Common admission criteria patterns
        if (/voluntary\s+admission/i.test(text)) criteria.push('Voluntary admission');
        if (/medical\s+clearance/i.test(text)) criteria.push('Medical clearance required');
        if (/psychiatric\s+evaluation/i.test(text)) criteria.push('Psychiatric evaluation required');
        
        // Common exclusions
        if (/active\s+psychosis/i.test(text)) exclusions.push('Active psychosis');
        if (/violent\s+behavior/i.test(text)) exclusions.push('History of violence');
        if (/sex\s+offender/i.test(text)) exclusions.push('Sex offender history');
        
        data.admissions.admissionsCriteria = criteria;
        data.admissions.exclusions = exclusions;
    }
    
    // Extract daily schedule
    function extractDailySchedule(data, text) {
        const scheduleMatch = text.match(/(?:daily\s+schedule|typical\s+day)[:\s]+([^.]+(?:\.[^.]+){2,5})/i);
        if (scheduleMatch) {
            data.structure.dailySchedule = scheduleMatch[1].trim();
        }
    }
    
    // Extract outcomes data
    function extractOutcomes(data, text) {
        // Look for success rate
        const successMatch = text.match(/(\d+)%\s*(?:success|completion|graduate)/i);
        if (successMatch) {
            data.outcomes.successRate = successMatch[1] + '%';
        }
        
        // Look for average length of stay
        const losMatch = text.match(/average\s+(?:length\s+of\s+)?stay[:\s]+(\d+[\s-]?\d*)\s*(days?|weeks?|months?)/i);
        if (losMatch) {
            data.outcomes.averageLOS = `${losMatch[1]} ${losMatch[2]}`;
        }
        
        // Check for alumni program
        data.outcomes.alumni = /alumni|aftercare\s+program/i.test(text);
    }
    
    // Consolidate and deduplicate data
    function consolidateData(data) {
        // Remove duplicates from arrays
        const arrayFields = [
            'levelsOfCare',
            'clinical.evidenceBased',
            'clinical.experiential',
            'clinical.specializations',
            'staff.credentials',
            'facilities.amenities',
            'facilities.recreation',
            'admissions.insurance',
            'quality.accreditations',
            'quality.memberships'
        ];
        
        arrayFields.forEach(field => {
            const parts = field.split('.');
            let obj = data;
            for (let i = 0; i < parts.length - 1; i++) {
                obj = obj[parts[i]];
            }
            const key = parts[parts.length - 1];
            if (Array.isArray(obj[key])) {
                obj[key] = [...new Set(obj[key])];
            }
        });
        
        // Sort lists for consistency
        if (data.clinical.evidenceBased) data.clinical.evidenceBased.sort();
        if (data.clinical.experiential) data.clinical.experiential.sort();
        if (data.clinical.specializations) data.clinical.specializations.sort();
    }
    
    // Calculate comprehensive confidence score
    function calculateComprehensiveConfidence(data) {
        let score = 0;
        let maxScore = 0;
        
        // Critical fields (20 points each)
        const criticalFields = [
            data.name,
            data.city && data.state,
            data.levelsOfCare.length > 0,
            data.population.ages,
            data.clinical.specializations.length > 0,
            data.admissions.phone || data.admissions.email
        ];
        
        criticalFields.forEach(field => {
            maxScore += 20;
            if (field) score += 20;
        });
        
        // Important fields (10 points each)
        const importantFields = [
            data.clinical.evidenceBased.length > 0,
            data.clinical.experiential.length > 0,
            data.structure.los,
            data.structure.ratio,
            data.family.weeklyTherapy || data.family.workshops,
            data.admissions.insurance.length > 0,
            data.quality.accreditations.length > 0,
            data.philosophy || data.approach,
            data.differentiators.length > 0
        ];
        
        importantFields.forEach(field => {
            maxScore += 10;
            if (field) score += 10;
        });
        
        // Bonus for multi-page scanning
        if (data.meta.sourcesAnalyzed > 1) {
            score += Math.min(data.meta.sourcesAnalyzed * 5, 25);
            maxScore += 25;
        }
        
        return Math.round((score / maxScore) * 100);
    }
    
    // Helper function to find section content
    function findSectionContent(keywords, text) {
        for (const keyword of keywords) {
            const regex = new RegExp(`${keyword}[:\\s]+([^\\n]+(?:\\n[^\\n]+){0,5})`, 'i');
            const match = text.match(regex);
            if (match) return match[1];
        }
        return '';
    }
    
    // All extraction helper functions (from enhanced-extractor.js)
    function extractProgramName() {
        const strategies = [
            () => document.querySelector('meta[property="og:site_name"]')?.content,
            () => document.querySelector('h1')?.textContent?.trim(),
            () => document.title.split(/[-|]/)[0].trim()
        ];
        
        for (const strategy of strategies) {
            const name = strategy();
            if (name && name.length > 2 && name.length < 100) {
                return name;
            }
        }
        
        return window.location.hostname.replace('www.', '').split('.')[0]
            .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    function extractLocation(text) {
        const cityStateRegex = /([\w\s]+),\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i;
        const match = text.match(cityStateRegex);
        if (match) {
            return {
                city: match[1].trim(),
                state: match[2].length === 2 ? match[2] : match[2].toUpperCase()
            };
        }
        return null;
    }
    
    function extractLevelsOfCare(text) {
        const levels = [];
        const levelMap = {
            'Residential': ['residential', 'rtc', 'residential treatment'],
            'PHP': ['php', 'partial hospitalization', 'day treatment'],
            'IOP': ['iop', 'intensive outpatient'],
            'Outpatient': ['outpatient', 'op ', 'weekly therapy']
        };
        
        Object.entries(levelMap).forEach(([level, keywords]) => {
            for (const keyword of keywords) {
                if (text.toLowerCase().includes(keyword)) {
                    if (!levels.includes(level)) {
                        levels.push(level);
                    }
                    break;
                }
            }
        });
        
        return levels;
    }
    
    function extractAgeRange(text) {
        const agePatterns = [
            /ages?\s*(\d{1,2})\s*(?:to|through|[-–])\s*(\d{1,2})/i,
            /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*years?\s*old/i
        ];
        
        for (const pattern of agePatterns) {
            const match = text.match(pattern);
            if (match) {
                return `${match[1]}-${match[2]}`;
            }
        }
        
        if (/young\s+adults?/i.test(text)) return 'Young Adults';
        if (/adolescents?/i.test(text)) return 'Adolescents';
        if (/teens?/i.test(text)) return 'Teens';
        
        return '';
    }
    
    function extractGenderFocus(text) {
        if (/\ball[\s-]?boys?\b/i.test(text) || /\bmales?[\s-]?only\b/i.test(text)) {
            return 'Males';
        }
        if (/\ball[\s-]?girls?\b/i.test(text) || /\bfemales?[\s-]?only\b/i.test(text)) {
            return 'Females';
        }
        if (/\bco[\s-]?ed\b/i.test(text)) {
            return 'Co-ed';
        }
        return '';
    }
    
    function extractSpecificPopulations(text) {
        const populations = [];
        
        if (/lgbtq/i.test(text)) populations.push('LGBTQ+');
        if (/first\s+responders?/i.test(text)) populations.push('First Responders');
        if (/veterans?/i.test(text)) populations.push('Veterans');
        if (/professionals?/i.test(text)) populations.push('Professionals');
        if (/adopted/i.test(text)) populations.push('Adopted Youth');
        
        return populations;
    }
    
    function extractEvidenceBasedTherapies(text) {
        const therapies = [
            'CBT', 'DBT', 'EMDR', 'ACT', 'MI', 'TF-CBT', 'CPT', 'PE',
            'IFS', 'PCIT', 'MST', 'FFT', 'Brainspotting', 'Somatic Experiencing',
            'Cognitive Behavioral Therapy', 'Dialectical Behavior Therapy',
            'Eye Movement Desensitization', 'Acceptance and Commitment',
            'Motivational Interviewing', 'Trauma-Focused CBT'
        ];
        
        const found = [];
        therapies.forEach(therapy => {
            if (text.includes(therapy) || text.toLowerCase().includes(therapy.toLowerCase())) {
                const abbreviated = therapy.match(/^[A-Z]{2,}/);
                if (abbreviated && !found.includes(abbreviated[0])) {
                    found.push(abbreviated[0]);
                } else if (!abbreviated && !found.includes(therapy)) {
                    found.push(therapy);
                }
            }
        });
        
        return found;
    }
    
    function extractExperientialTherapies(text) {
        const therapies = [
            'Art Therapy', 'Music Therapy', 'Equine Therapy', 'Adventure Therapy',
            'Wilderness Therapy', 'Drama Therapy', 'Dance Therapy', 'Movement Therapy',
            'Recreation Therapy', 'Play Therapy', 'Sand Tray', 'Yoga',
            'Mindfulness', 'Meditation', 'Ropes Course', 'Rock Climbing'
        ];
        
        const found = [];
        therapies.forEach(therapy => {
            if (text.toLowerCase().includes(therapy.toLowerCase())) {
                if (!found.includes(therapy)) {
                    found.push(therapy);
                }
            }
        });
        
        return found;
    }
    
    function extractSpecializations(text) {
        const specializations = {
            'Trauma/PTSD': ['trauma', 'ptsd', 'post-traumatic'],
            'Anxiety': ['anxiety', 'panic', 'phobia'],
            'Depression': ['depression', 'mood disorder'],
            'ADHD': ['adhd', 'add', 'attention deficit'],
            'OCD': ['ocd', 'obsessive-compulsive'],
            'Eating Disorders': ['eating disorder', 'anorexia', 'bulimia'],
            'Substance Use': ['substance', 'addiction', 'dual diagnosis'],
            'Self-Harm': ['self-harm', 'self-injury', 'cutting'],
            'Autism Spectrum': ['autism', 'asd', 'asperger'],
            'Bipolar': ['bipolar', 'manic'],
            'Attachment': ['attachment', 'rad', 'reactive attachment'],
            'Oppositional Defiant': ['odd', 'oppositional defiant'],
            'Conduct Disorder': ['conduct disorder'],
            'Technology Addiction': ['gaming', 'internet addiction', 'screen']
        };
        
        const found = [];
        Object.entries(specializations).forEach(([category, keywords]) => {
            for (const keyword of keywords) {
                if (text.toLowerCase().includes(keyword)) {
                    if (!found.includes(category)) {
                        found.push(category);
                    }
                    break;
                }
            }
        });
        
        return found;
    }
    
    function extractLengthOfStay(text) {
        const patterns = [
            /(?:average|typical)\s*(?:length|duration|stay)[:\s]+(\d+[\s-]?\d*)\s*(days?|weeks?|months?)/i,
            /(\d+[\s-]?\d*)\s*(days?|weeks?|months?)\s*(?:program|treatment|stay)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return `${match[1]} ${match[2]}`;
            }
        }
        return '';
    }
    
    function extractStaffRatio(text) {
        const patterns = [
            /(\d+)[:\s](\d+)\s*(?:staff|student|client)/i,
            /(?:staff|therapist)[\s-]?(?:to|:)[\s-]?(?:student|client|resident)\s*ratio[:\s]*(\d+)[:\s](\d+)/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return `${match[1]}:${match[2] || match[1]}`;
            }
        }
        return '';
    }
    
    function extractProgramPhases(text) {
        const phases = [];
        const phaseRegex = /phase\s*(\d+|one|two|three|four|I|II|III|IV)/gi;
        const matches = text.match(phaseRegex) || [];
        return [...new Set(matches)];
    }
    
    function extractAcademicProgram(text) {
        const hasProgram = /\b(academic|school|education|classroom|credits?)\b/i.test(text);
        
        if (!hasProgram) {
            return { hasProgram: false };
        }
        
        const academicAccreditors = ['Cognia', 'AdvancED', 'WASC', 'SACS', 'NWAC'];
        let accreditation = '';
        
        for (const accreditor of academicAccreditors) {
            if (text.includes(accreditor)) {
                accreditation = accreditor;
                break;
            }
        }
        
        return {
            hasProgram: true,
            accreditation: accreditation
        };
    }
    
    function extractFamilyProgram(text) {
        const family = {
            weeklyTherapy: false,
            workshops: false,
            visitationPolicy: '',
            familyWeekend: false,
            parentSupport: false,
            notes: []
        };
        
        if (/weekly family therapy/i.test(text)) {
            family.weeklyTherapy = true;
        }
        
        if (/parent workshop|family workshop|parent education/i.test(text)) {
            family.workshops = true;
        }
        
        if (/family weekend/i.test(text)) {
            family.familyWeekend = true;
        }
        
        if (/parent support group/i.test(text)) {
            family.parentSupport = true;
        }
        
        const visitMatch = text.match(/visitation[:\s]+([^.]+)/i);
        if (visitMatch) {
            family.visitationPolicy = visitMatch[1].trim();
        }
        
        return family;
    }
    
    function extractStaffCredentials(text) {
        const credentials = [
            'LCSW', 'LCPC', 'LPC', 'LMFT', 'LMHC', 'PhD', 'PsyD', 'MD',
            'RN', 'CADC', 'LAC', 'Board Certified', 'Licensed'
        ];
        return credentials.filter(cred => text.includes(cred));
    }
    
    function extractSetting(text) {
        if (/\b\d+[\s-]?acres?\b/i.test(text)) {
            const match = text.match(/(\d+)[\s-]?acres?/i);
            return `${match[1]} acre campus`;
        }
        if (/mountain/i.test(text)) return 'Mountain setting';
        if (/beach|ocean|coastal/i.test(text)) return 'Beach/coastal setting';
        if (/rural/i.test(text)) return 'Rural setting';
        if (/urban/i.test(text)) return 'Urban setting';
        return '';
    }
    
    function extractAmenities(text) {
        const amenities = [
            'pool', 'gym', 'fitness center', 'basketball court', 'tennis court',
            'art studio', 'music room', 'library', 'computer lab', 'cafeteria'
        ];
        return amenities.filter(amenity => text.toLowerCase().includes(amenity));
    }
    
    function extractRecreation(text) {
        const activities = [
            'hiking', 'camping', 'rock climbing', 'kayaking', 'surfing',
            'skiing', 'horseback riding', 'fishing', 'mountain biking'
        ];
        return activities.filter(activity => text.toLowerCase().includes(activity));
    }
    
    function extractInsuranceProviders(text) {
        const providers = [
            'Aetna', 'Anthem', 'Blue Cross', 'Blue Shield', 'BCBS',
            'Cigna', 'United Healthcare', 'UnitedHealth', 'Humana',
            'Kaiser', 'Magellan', 'Optum', 'Beacon', 'TRICARE',
            'Medicaid', 'Medicare', 'Amerigroup', 'Centene'
        ];
        return providers.filter(provider => text.includes(provider));
    }
    
    function extractAccreditations(text) {
        const accreditations = [
            'Joint Commission', 'JCAHO', 'CARF', 'COA', 'NATSAP',
            'NAATP', 'BBB Accredited'
        ];
        return accreditations.filter(accred => text.includes(accred));
    }
    
    function extractMemberships(text) {
        const memberships = [
            'NATSAP', 'IECA', 'ACA', 'NAATP', 'BBB'
        ];
        return memberships.filter(member => text.includes(member));
    }
    
    function extractPrimaryPhone(text) {
        const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = text.match(phoneRegex) || [];
        return phones[0] || '';
    }
    
    function extractPrimaryEmail(text) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailRegex) || [];
        const preferredEmail = emails.find(email => 
            email.toLowerCase().includes('admissions@') || 
            email.toLowerCase().includes('info@')
        );
        return preferredEmail || emails[0] || '';
    }
    
})();
