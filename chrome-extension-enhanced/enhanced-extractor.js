// enhanced-extractor.js - Clinical Data Extraction Engine v5.0

// TASK: Populate the unified program object for the formatter (see contract above).
// STRATEGIES (apply in order; stop when confident enough):
// - Program name: schema.org/JSON-LD, meta og:site_name, logo alt, H1, domain heuristics. 
// - Location: parse full address if present; else City + ST; never include street in header.
// - Levels of Care: keyword map (Residential, PHP, IOP, Outpatient) with synonyms.
// - Population: extract ages (e.g., "13–17", "young adult men"), optional gender focus.
// - Evidence-Based vs Experiential: maintain curated lists (40+ modalities) for precise buckets.
// - Specializations: map to controlled categories (15+), dedupe/fuzzy match.
// - Structure: LOS ranges, staff ratios, academic program and accreditation keywords.
// - Family: weekly FT, workshops, parent intensives; normalize to booleans + notes.
// - Insurance: detect common payors; capture only explicit mentions.
// - Accreditations: detect JCAHO, CARF, NATSAP, education accreditors (Cognia, etc.)
// - Contacts: prefer admissions/info lines; collect multiple but select best.
// MULTI-PAGE: Crawl "About", "Programs/Treatment", "Admissions", "Family", "Academics", "Staff" first.
// QUALITY: assign simple confidence score (0–100) based on data coverage + cross-signal agreement.

(function() {
    'use strict';
    
    // ERROR POLICY:
    // - Prevent duplicate content script injection (set window.__FF_CONTENT_SCRIPT_LOADED__).
    // - Guard all array-like ops (validate before .map / .reduce).
    // - On extractor failure: fall back to basic extraction; log WARN and keep UI responsive.
    // - On "Copy to Tool" failure: copy formatted text to clipboard; guide user to manual paste.
    // - Never block UI—always offer a manual path to completion.
    
    // Prevent duplicate loading
    if (window.__FF_CONTENT_SCRIPT_LOADED__) {
        console.log('[WARNING] Content script already loaded, skipping duplicate injection');
        return;
    }
    window.__FF_CONTENT_SCRIPT_LOADED__ = true;
    
    console.log('[INFO] Enhanced Clinical Extractor v5.0 Loaded');
    
    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract') {
            console.log('[INFO] Starting clinical-grade extraction...');
            try {
                const result = performClinicalExtraction();
                console.log('[SUCCESS] Extraction complete:', result.meta);
                sendResponse({ success: true, data: result });
            } catch (error) {
                console.warn('[WARNING] Extraction error, falling back to basic extraction:', error);
                // Fallback to basic extraction
                try {
                    const basicResult = performBasicExtraction();
                    sendResponse({ success: true, data: basicResult });
                } catch (fallbackError) {
                    console.error('[ERROR] Basic extraction also failed:', fallbackError);
                    sendResponse({ success: false, error: fallbackError.message });
                }
            }
        }
        return true;
    });
    
    // Main extraction function that returns formatter-ready data
    function performClinicalExtraction() {
        const startTime = Date.now();
        const pageText = document.body?.innerText || '';
        const pageHtml = document.body?.innerHTML || '';
        
        // Initialize the exact data structure for clinical formatter
        const data = {
            // Basic Info
            name: extractProgramName(),
            city: '',
            state: '',
            levelsOfCare: extractLevelsOfCare(pageText),
            
            // Population
            population: {
                ages: extractAgeRange(pageText),
                gender: extractGenderFocus(pageText)
            },
            
            // Overview bullets for summary
            overviewBullets: extractOverviewBullets(),
            
            // Program Structure
            structure: {
                los: extractLengthOfStay(pageText),
                ratio: extractStaffRatio(pageText),
                academics: extractAcademicProgram(pageText)
            },
            
            // Clinical Services
            clinical: {
                evidenceBased: extractEvidenceBasedTherapies(pageText),
                experiential: extractExperientialTherapies(pageText),
                specializations: extractSpecializations(pageText)
            },
            
            // Family Program
            family: extractFamilyProgram(pageText),
            
            // Admissions
            admissions: {
                insurance: extractInsuranceProviders(pageText),
                email: extractPrimaryEmail(pageText),
                phone: extractPrimaryPhone(pageText),
                website: window.location.href
            },
            
            // Quality Indicators
            quality: {
                accreditations: extractAccreditations(pageText)
            },
            
            // Metadata
            meta: {
                sourcesAnalyzed: 1,
                confidence: 0,
                extractionTime: 0
            }
        };
        
        // Extract location (city and state)
        const location = extractLocation(pageText);
        if (location) {
            data.city = location.city;
            data.state = location.state;
        }
        
        // Calculate confidence score
        data.meta.confidence = calculateConfidenceScore(data);
        data.meta.extractionTime = Date.now() - startTime;
        
        return data;
    }
    
    // ===========================
    // EXTRACTION STRATEGIES
    // ===========================
    
    function extractProgramName() {
        // Strategy 1: JSON-LD structured data
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
        
        // Strategy 2: Open Graph meta tags
        const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content;
        if (ogSiteName) return ogSiteName;
        
        // Strategy 3: Logo alt text
        const logo = document.querySelector('img[alt*="logo" i], img[src*="logo" i]');
        if (logo?.alt) {
            const cleanedAlt = logo.alt.replace(/logo/gi, '').trim();
            if (cleanedAlt.length > 2) return cleanedAlt;
        }
        
        // Strategy 4: H1 heading
        const h1 = document.querySelector('h1');
        if (h1?.textContent?.trim()) {
            const h1Text = h1.textContent.trim();
            if (h1Text.length < 100) return h1Text;
        }
        
        // Strategy 5: Domain heuristics
        const domain = window.location.hostname.replace('www.', '');
        const domainParts = domain.split('.')[0].split('-');
        return domainParts.map(part => 
            part.charAt(0).toUpperCase() + part.slice(1)
        ).join(' ');
    }
    
    function extractLocation(text) {
        // Look for full address first
        const addressRegex = /(?:located in|serving|based in)\s+([\w\s]+),\s*([A-Z]{2})/i;
        const addressMatch = text.match(addressRegex);
        if (addressMatch) {
            return {
                city: addressMatch[1].trim(),
                state: addressMatch[2]
            };
        }
        
        // Look for city, state pattern
        const cityStateRegex = /([\w\s]+),\s*(Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i;
        const cityStateMatch = text.match(cityStateRegex);
        if (cityStateMatch) {
            let state = cityStateMatch[2];
            // Convert full state names to abbreviations
            const stateAbbreviations = {
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
            
            if (stateAbbreviations[state]) {
                state = stateAbbreviations[state];
            }
            
            return {
                city: cityStateMatch[1].trim(),
                state: state.toUpperCase()
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
        // Look for age patterns
        const agePatterns = [
            /ages?\s*(\d{1,2})\s*(?:to|through|[-–])\s*(\d{1,2})/i,
            /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*years?\s*old/i,
            /adolescents?\s*(?:ages?)?\s*(\d{1,2})\s*[-–]\s*(\d{1,2})/i
        ];
        
        for (const pattern of agePatterns) {
            const match = text.match(pattern);
            if (match) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                if (min >= 5 && max <= 30 && min < max) {
                    return `${min}–${max}`;
                }
            }
        }
        
        // Fallback to descriptive terms
        if (/adolescents?/i.test(text)) return 'Adolescents';
        if (/teens?/i.test(text)) return 'Teens';
        if (/young adults?/i.test(text)) return 'Young Adults';
        
        return '';
    }
    
    function extractGenderFocus(text) {
        // Check for gender-specific programs
        if (/\ball[\s-]?boys?\b/i.test(text) || /\bmales?[\s-]?only\b/i.test(text)) {
            return 'Males';
        }
        if (/\ball[\s-]?girls?\b/i.test(text) || /\bfemales?[\s-]?only\b/i.test(text)) {
            return 'Females';
        }
        if (/\bco[\s-]?ed\b/i.test(text) || /\bboth genders?\b/i.test(text)) {
            return 'Co-ed';
        }
        return '';
    }
    
    function extractOverviewBullets() {
        const bullets = [];
        
        // Try to find an about section
        const aboutSection = findSectionContent(['about', 'overview', 'who we are']);
        if (aboutSection) {
            // Extract first few sentences
            const sentences = aboutSection.match(/[^.!?]+[.!?]+/g);
            if (sentences) {
                bullets.push(...sentences.slice(0, 3).map(s => s.trim()));
            }
        }
        
        // Look for mission statement
        const missionRegex = /(?:our mission|we believe|dedicated to)([^.]+\.)/i;
        const missionMatch = document.body.innerText.match(missionRegex);
        if (missionMatch) {
            bullets.push(missionMatch[1].trim());
        }
        
        return bullets.slice(0, 5);
    }
    
    function extractLengthOfStay(text) {
        const losPatterns = [
            /(?:average|typical)\s*(?:length|duration|stay)[:\s]+(\d+[\s-]?\d*)\s*(days?|weeks?|months?)/i,
            /(\d+[\s-]?\d*)\s*(days?|weeks?|months?)\s*(?:program|treatment|stay)/i,
            /(?:los|length of stay)[:\s]+(\d+[\s-]?\d*)\s*(days?|weeks?|months?)/i
        ];
        
        for (const pattern of losPatterns) {
            const match = text.match(pattern);
            if (match) {
                return `${match[1]} ${match[2]}`;
            }
        }
        
        return '';
    }
    
    function extractStaffRatio(text) {
        const ratioPatterns = [
            /(\d+)[:\s](\d+)\s*(?:staff|student|client)/i,
            /(?:staff|therapist)[\s-]?(?:to|:)[\s-]?(?:student|client|resident)\s*ratio[:\s]*(\d+)[:\s](\d+)/i
        ];
        
        for (const pattern of ratioPatterns) {
            const match = text.match(pattern);
            if (match) {
                return `${match[1]}:${match[2] || match[1]}`;
            }
        }
        
        return '';
    }
    
    function extractAcademicProgram(text) {
        const hasProgram = /\b(academic|school|education|classroom|credits?)\b/i.test(text);
        
        if (!hasProgram) {
            return { hasProgram: false };
        }
        
        // Look for accreditation
        const academicAccreditors = ['Cognia', 'AdvancED', 'WASC', 'SACS', 'NWAC', 'NAEYC'];
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
    
    function extractEvidenceBasedTherapies(text) {
        const evidenceBased = [
            'CBT', 'Cognitive Behavioral Therapy',
            'DBT', 'Dialectical Behavior Therapy',
            'EMDR', 'Eye Movement Desensitization',
            'ACT', 'Acceptance and Commitment Therapy',
            'MI', 'Motivational Interviewing',
            'TF-CBT', 'Trauma-Focused CBT',
            'CPT', 'Cognitive Processing Therapy',
            'PE', 'Prolonged Exposure',
            'IFS', 'Internal Family Systems',
            'PCIT', 'Parent-Child Interaction Therapy',
            'MST', 'Multisystemic Therapy',
            'FFT', 'Functional Family Therapy'
        ];
        
        const found = [];
        const textLower = text.toLowerCase();
        
        evidenceBased.forEach(therapy => {
            if (textLower.includes(therapy.toLowerCase())) {
                // Normalize to abbreviated form where applicable
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
        const experiential = [
            'Art Therapy', 'Music Therapy', 'Equine Therapy',
            'Adventure Therapy', 'Wilderness Therapy', 'Drama Therapy',
            'Dance/Movement Therapy', 'Recreation Therapy', 'Play Therapy',
            'Sand Tray Therapy', 'Animal-Assisted Therapy',
            'Horticultural Therapy', 'Expressive Arts'
        ];
        
        const found = [];
        const textLower = text.toLowerCase();
        
        experiential.forEach(therapy => {
            if (textLower.includes(therapy.toLowerCase())) {
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
            'Attachment': ['attachment', 'rad', 'reactive attachment'],
            'Oppositional Defiant': ['odd', 'oppositional defiant'],
            'Conduct Disorder': ['conduct disorder', 'behavioral'],
            'Technology Addiction': ['gaming', 'internet addiction', 'screen'],
            'LGBTQ+': ['lgbtq', 'gender identity', 'sexual orientation'],
            'Adoption/Foster': ['adoption', 'foster', 'adopted']
        };
        
        const found = [];
        const textLower = text.toLowerCase();
        
        Object.entries(specializations).forEach(([category, keywords]) => {
            for (const keyword of keywords) {
                if (textLower.includes(keyword)) {
                    if (!found.includes(category)) {
                        found.push(category);
                    }
                    break;
                }
            }
        });
        
        return found;
    }
    
    function extractFamilyProgram(text) {
        const family = {
            weeklyTherapy: false,
            workshops: false,
            notes: []
        };
        
        // Check for weekly family therapy
        if (/weekly family therapy/i.test(text) || /family therapy.*weekly/i.test(text)) {
            family.weeklyTherapy = true;
        }
        
        // Check for workshops
        if (/parent workshop/i.test(text) || /family workshop/i.test(text) || 
            /parent education/i.test(text) || /family weekend/i.test(text)) {
            family.workshops = true;
        }
        
        // Look for specific family program notes
        if (/parent intensive/i.test(text)) {
            family.notes.push('Parent intensive programs');
        }
        if (/multi-family group/i.test(text)) {
            family.notes.push('Multi-family groups');
        }
        if (/family visit/i.test(text)) {
            const visitMatch = text.match(/family visits?\s*([^.]+)/i);
            if (visitMatch) {
                family.notes.push(`Family visits: ${visitMatch[1].trim()}`);
            }
        }
        
        return family;
    }
    
    function extractInsuranceProviders(text) {
        const commonProviders = [
            'Aetna', 'Anthem', 'Blue Cross Blue Shield', 'BCBS',
            'Cigna', 'United Healthcare', 'UnitedHealth', 'Humana',
            'Kaiser', 'Magellan', 'Optum', 'Beacon Health',
            'TRICARE', 'Medicaid', 'Medicare', 'Amerigroup',
            'Centene', 'WellCare', 'Molina', 'Health Net',
            'ComPsych', 'ValueOptions', 'Premera'
        ];
        
        const found = [];
        commonProviders.forEach(provider => {
            if (text.includes(provider)) {
                // Normalize BCBS
                if (provider === 'Blue Cross Blue Shield' || provider === 'BCBS') {
                    if (!found.includes('BCBS')) found.push('BCBS');
                } else if (!found.includes(provider)) {
                    found.push(provider);
                }
            }
        });
        
        return found;
    }
    
    function extractAccreditations(text) {
        const accreditations = [
            'Joint Commission', 'JCAHO', 'TJC',
            'CARF', 'COA', 'NATSAP',
            'NAATP', 'BBB Accredited',
            'Cognia', 'AdvancED', 'WASC',
            'SACS', 'NAEYC'
        ];
        
        const found = [];
        accreditations.forEach(accred => {
            if (text.includes(accred)) {
                // Normalize Joint Commission variations
                if (accred === 'JCAHO' || accred === 'TJC') {
                    if (!found.includes('Joint Commission')) found.push('Joint Commission');
                } else if (!found.includes(accred)) {
                    found.push(accred);
                }
            }
        });
        
        return found;
    }
    
    function extractPrimaryPhone(text) {
        const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = text.match(phoneRegex) || [];
        
        // Look for admissions or main phone
        const admissionsSection = findSectionContent(['admissions', 'contact', 'call us']);
        if (admissionsSection) {
            const admissionPhones = admissionsSection.match(phoneRegex);
            if (admissionPhones && admissionPhones.length > 0) {
                return admissionPhones[0];
            }
        }
        
        // Return first valid phone found
        return phones.find(phone => {
            const digits = phone.replace(/\D/g, '');
            return digits.length === 10 || digits.length === 11;
        }) || '';
    }
    
    function extractPrimaryEmail(text) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailRegex) || [];
        
        // Prefer admissions@ or info@ emails
        const preferredEmail = emails.find(email => 
            email.toLowerCase().includes('admissions@') || 
            email.toLowerCase().includes('info@')
        );
        
        if (preferredEmail) return preferredEmail;
        
        // Filter out image/file references
        return emails.find(email => 
            !email.includes('.png') && 
            !email.includes('.jpg') && 
            !email.includes('@example')
        ) || '';
    }
    
    // Helper function to find section content
    function findSectionContent(keywords) {
        for (const keyword of keywords) {
            const heading = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
                .find(h => h.textContent.toLowerCase().includes(keyword));
            
            if (heading) {
                let content = '';
                let el = heading.nextElementSibling;
                let charCount = 0;
                
                while (el && charCount < 1000) {
                    if (el.tagName === 'P' || el.tagName === 'UL' || el.tagName === 'OL') {
                        content += el.textContent + ' ';
                        charCount += el.textContent.length;
                    }
                    if (el.tagName && el.tagName.match(/^H[1-6]$/)) break;
                    el = el.nextElementSibling;
                }
                
                if (content) return content.trim();
            }
        }
        return '';
    }
    
    function calculateConfidenceScore(data) {
        let score = 0;
        let maxScore = 0;
        
        // Check critical fields (10 points each)
        const criticalFields = [
            data.name,
            data.city && data.state,
            data.levelsOfCare.length > 0,
            data.population.ages,
            data.admissions.phone || data.admissions.email
        ];
        
        criticalFields.forEach(field => {
            maxScore += 20;
            if (field) score += 20;
        });
        
        // Check good-to-have fields (5 points each)
        const goodFields = [
            data.clinical.evidenceBased.length > 0,
            data.clinical.experiential.length > 0,
            data.clinical.specializations.length > 0,
            data.admissions.insurance.length > 0,
            data.quality.accreditations.length > 0,
            data.structure.los,
            data.structure.ratio,
            data.structure.academics.hasProgram
        ];
        
        goodFields.forEach(field => {
            maxScore += 5;
            if (field) score += 5;
        });
        
        return Math.round((score / maxScore) * 100);
    }
    
    // Basic extraction fallback function
    function performBasicExtraction() {
        console.log('[WARNING] Running basic extraction as fallback...');
        
        const data = {
            name: document.title.split(/[-|]/)[0].trim() || 'Treatment Program',
            city: '',
            state: '',
            levelsOfCare: [],
            population: { ages: '', gender: '' },
            overviewBullets: [],
            structure: { los: '', ratio: '', academics: { hasProgram: false } },
            clinical: { evidenceBased: [], experiential: [], specializations: [] },
            family: { weeklyTherapy: false, workshops: false, notes: [] },
            admissions: { 
                insurance: [],
                email: '',
                phone: '',
                website: window.location.href
            },
            quality: { accreditations: [] },
            meta: { sourcesAnalyzed: 1, confidence: 10, extractionTime: 100 }
        };
        
        try {
            const pageText = document.body?.innerText || '';
            
            // Basic phone extraction
            const phoneMatch = pageText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
            if (phoneMatch) data.admissions.phone = phoneMatch[0];
            
            // Basic email extraction
            const emailMatch = pageText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
            if (emailMatch) data.admissions.email = emailMatch[0];
            
            // Basic level of care detection
            if (/residential/i.test(pageText)) data.levelsOfCare.push('Residential');
            if (/php|partial hospitalization/i.test(pageText)) data.levelsOfCare.push('PHP');
            if (/iop|intensive outpatient/i.test(pageText)) data.levelsOfCare.push('IOP');
            
            // Basic therapy detection
            if (/cbt|cognitive behavioral/i.test(pageText)) data.clinical.evidenceBased.push('CBT');
            if (/dbt|dialectical/i.test(pageText)) data.clinical.evidenceBased.push('DBT');
            if (/emdr/i.test(pageText)) data.clinical.evidenceBased.push('EMDR');
            
            // Basic insurance detection
            if (/aetna/i.test(pageText)) data.admissions.insurance.push('Aetna');
            if (/blue cross|bcbs/i.test(pageText)) data.admissions.insurance.push('BCBS');
            if (/cigna/i.test(pageText)) data.admissions.insurance.push('Cigna');
            
            data.meta.confidence = 25; // Low confidence for basic extraction
        } catch (e) {
            console.error('Basic extraction error:', e);
        }
        
        return data;
    }
    
})();
