// Clinical-grade extraction and formatting for treatment programs
// This is the core extraction engine that produces exceptional write-ups

// Main extraction function that combines all strategies
function extractClinicalProgramData(document, window) {
    const extractedData = {
        programName: '',
        location: '',
        phone: '',
        email: '',
        website: window.location.href,
        agesServed: '',
        levelOfCare: '',
        description: '',
        therapies: [],
        specializations: [],
        features: [],
        accreditations: [],
        clinicalApproach: '',
        staffCredentials: '',
        programLength: '',
        familyInvolvement: '',
        academicSupport: '',
        insuranceInfo: ''
    };

    const allText = document.body.innerText || document.body.textContent || '';
    
    // Check for site-specific extraction
    const domain = window.location.hostname.toLowerCase();
    if (domain.includes('voyagerecovery')) {
        return extractVoyageRecoveryData(document, window, allText);
    }
    
    // ===== EXTRACT PROGRAM NAME (Critical) =====
    extractedData.programName = extractProgramName(document, window);
    
    // ===== EXTRACT LOCATION =====
    extractedData.location = extractLocation(allText, document);
    
    // ===== EXTRACT CONTACT INFO =====
    const contactInfo = extractContactInfo(allText, document);
    extractedData.phone = contactInfo.phone;
    extractedData.email = contactInfo.email;
    
    // ===== EXTRACT POPULATION & LEVEL OF CARE =====
    extractedData.agesServed = extractAgesServed(allText);
    extractedData.levelOfCare = extractLevelOfCare(allText);
    
    // ===== EXTRACT CLINICAL DETAILS =====
    extractedData.therapies = extractTherapies(allText);
    extractedData.specializations = extractSpecializations(allText);
    extractedData.features = extractUniqueFeatures(allText, extractedData);
    extractedData.accreditations = extractAccreditations(allText);
    
    // ===== EXTRACT PROGRAM SPECIFICS =====
    extractedData.clinicalApproach = extractClinicalApproach(allText);
    extractedData.staffCredentials = extractStaffCredentials(allText);
    extractedData.programLength = extractProgramLength(allText);
    extractedData.familyInvolvement = extractFamilyInvolvement(allText);
    extractedData.academicSupport = extractAcademicSupport(allText);
    extractedData.insuranceInfo = extractInsurance(allText);
    
    // ===== GENERATE DESCRIPTION =====
    extractedData.description = generateClinicalDescription(extractedData);
    
    return extractedData;
}

// Extract program name with multiple sophisticated strategies
function extractProgramName(document, window) {
    const possibleNames = [];
    
    // Strategy 1: Meta tags (most reliable)
    const metaTags = {
        ogSiteName: document.querySelector('meta[property="og:site_name"]')?.content,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        applicationName: document.querySelector('meta[name="application-name"]')?.content,
        author: document.querySelector('meta[name="author"]')?.content
    };
    
    Object.values(metaTags).forEach(name => {
        if (name && name.length > 2 && name.length < 60) {
            // Clean up common suffixes
            const cleaned = name.replace(/\s*[-|]\s*(Home|Homepage|Welcome|Official Site|Website).*$/i, '').trim();
            if (cleaned && !cleaned.toLowerCase().includes('untitled')) {
                possibleNames.push({source: 'meta', name: cleaned, priority: 10});
            }
        }
    });
    
    // Strategy 2: Logo alt text or aria-labels
    document.querySelectorAll('img[alt*="logo"], img[alt*="Logo"], [aria-label*="logo"]').forEach(el => {
        const text = el.alt || el.getAttribute('aria-label');
        if (text && text.length > 2 && text.length < 60) {
            const cleanName = text.replace(/logo|image/gi, '').trim();
            if (cleanName) {
                possibleNames.push({source: 'logo', name: cleanName, priority: 9});
            }
        }
    });
    
    // Strategy 3: Domain-based extraction (very reliable for treatment centers)
    const domain = window.location.hostname.replace('www.', '');
    const domainParts = domain.split('.')[0];
    
    // Check if domain contains treatment center keywords
    const treatmentKeywords = ['voyage', 'recovery', 'treatment', 'therapeutic', 'academy', 'healthcare', 'wellness', 'healing'];
    if (treatmentKeywords.some(kw => domainParts.toLowerCase().includes(kw))) {
        const formatted = domainParts.split(/[-_]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        
        // Add common suffixes if not present
        let enhancedName = formatted;
        if (!formatted.toLowerCase().includes('recovery') && 
            !formatted.toLowerCase().includes('treatment') && 
            !formatted.toLowerCase().includes('center') &&
            !formatted.toLowerCase().includes('academy') &&
            !formatted.toLowerCase().includes('healthcare')) {
            // Try to infer type from content
            const bodyText = document.body.innerText.toLowerCase();
            if (bodyText.includes('recovery')) enhancedName += ' Recovery';
            else if (bodyText.includes('academy')) enhancedName += ' Academy';
            else if (bodyText.includes('healthcare')) enhancedName += ' Healthcare';
            else if (bodyText.includes('treatment')) enhancedName += ' Treatment';
        }
        
        possibleNames.push({source: 'domain', name: enhancedName, priority: 8});
    }
    
    // Strategy 4: H1 headings with facility patterns
    document.querySelectorAll('h1').forEach(h1 => {
        const text = h1.textContent.trim();
        if (text && text.length > 2 && text.length < 60) {
            // Check for facility name patterns
            const facilityPatterns = [
                /^([A-Z][A-Za-z\s&'-]+(?:Recovery|Treatment|Center|Healthcare|Academy|Services|Institute|Foundation))/,
                /^Welcome to ([A-Z][A-Za-z\s&'-]+)/,
                /^([A-Z][A-Za-z\s&'-]+) - (?:Treatment|Recovery|Healthcare)/
            ];
            
            for (const pattern of facilityPatterns) {
                const match = text.match(pattern);
                if (match && match[1]) {
                    possibleNames.push({source: 'h1', name: match[1].trim(), priority: 7});
                    break;
                }
            }
        }
    });
    
    // Strategy 5: Schema.org structured data
    const schemas = document.querySelectorAll('[itemtype*="Organization"], [itemtype*="MedicalOrganization"]');
    schemas.forEach(schema => {
        const nameEl = schema.querySelector('[itemprop="name"]');
        if (nameEl && nameEl.textContent) {
            const name = nameEl.textContent.trim();
            if (name && name.length > 2 && name.length < 60) {
                possibleNames.push({source: 'schema', name: name, priority: 10});
            }
        }
    });
    
    // Strategy 6: Copyright footer (often contains official name)
    const footerTexts = document.querySelectorAll('footer, .footer, #footer');
    footerTexts.forEach(footer => {
        const text = footer.textContent;
        const copyrightPattern = /©\s*(?:\d{4})?\s*([A-Z][A-Za-z\s&'-]+(?:Recovery|Treatment|Center|Healthcare|Academy|Services))/;
        const match = text.match(copyrightPattern);
        if (match && match[1]) {
            possibleNames.push({source: 'copyright', name: match[1].trim(), priority: 6});
        }
    });
    
    // Score and select best name
    if (possibleNames.length > 0) {
        // Sort by priority and frequency
        const nameCount = {};
        possibleNames.forEach(({name, priority}) => {
            const key = name.toLowerCase();
            if (!nameCount[key]) {
                nameCount[key] = {name: name, score: 0};
            }
            nameCount[key].score += priority;
        });
        
        const sorted = Object.values(nameCount)
            .sort((a, b) => b.score - a.score);
        
        return sorted[0].name;
    }
    
    // Fallback: Use domain name formatted
    return domainParts.split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

// Extract location with multiple patterns
function extractLocation(allText, document) {
    // Strategy 1: Full address patterns
    const addressPatterns = [
        // Full US address with state
        /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Parkway|Pkwy)[\s,]+[\w\s]+,?\s+([A-Z]{2})\s+\d{5}/gi,
        // City, State pattern
        /(?:located in|serving|based in|in)\s+([\w\s]+),?\s+([A-Z]{2}|Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming)/gi
    ];
    
    for (const pattern of addressPatterns) {
        const matches = allText.match(pattern);
        if (matches && matches.length > 0) {
            // Clean up and return the most complete address
            return matches[0].replace(/^\s*(?:located in|serving|based in|in)\s*/i, '').trim();
        }
    }
    
    // Strategy 2: Check structured address elements
    const addressElements = document.querySelectorAll(
        'address, .address, [class*="address"], [itemtype*="PostalAddress"], ' +
        '[class*="location"], .location-info, .contact-address'
    );
    
    for (const el of addressElements) {
        const text = el.textContent.trim();
        if (text && text.length > 10) {
            // Check if it looks like an address
            if (/\d+\s+\w+|,\s*[A-Z]{2}\s+\d{5}/.test(text)) {
                return text.replace(/\s+/g, ' ').trim();
            }
        }
    }
    
    // Strategy 3: State-specific extraction
    const statePattern = /([\w\s]+),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)/gi;
    const stateMatch = statePattern.exec(allText);
    if (stateMatch) {
        return stateMatch[0];
    }
    
    return '';
}

// Extract contact information
function extractContactInfo(allText, document) {
    const info = { phone: '', email: '' };
    
    // Phone extraction with context priority
    const phonePatterns = [
        // Admission/Contact phone priority
        /(?:admission|contact|call us|phone)[\s:]*(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/gi,
        // Toll-free priority
        /(?:toll[\s-]?free|1[\s-]?800|1[\s-]?888|1[\s-]?877|1[\s-]?866)[\s:-]*(\d{3}[\s.-]?\d{4})/gi,
        // General phone patterns
        /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g
    ];
    
    for (const pattern of phonePatterns) {
        const matches = allText.match(pattern);
        if (matches && matches.length > 0) {
            // Extract just the phone number
            const phoneMatch = matches[0].match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
            if (phoneMatch) {
                info.phone = phoneMatch[0];
                break;
            }
        }
    }
    
    // Also check for tel: links
    const telLinks = document.querySelectorAll('a[href^="tel:"]');
    if (!info.phone && telLinks.length > 0) {
        info.phone = telLinks[0].textContent.trim();
    }
    
    // Email extraction with priority
    const emailPatterns = [
        // Admission/Info emails priority
        /(?:admission|info|contact|inquir)@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi,
        // General email pattern
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    ];
    
    for (const pattern of emailPatterns) {
        const matches = allText.match(pattern);
        if (matches && matches.length > 0) {
            // Filter out image/file references
            const validEmail = matches.find(e => 
                !e.includes('.png') && 
                !e.includes('.jpg') && 
                !e.includes('.css') &&
                !e.includes('@example')
            );
            if (validEmail) {
                info.email = validEmail;
                break;
            }
        }
    }
    
    // Check mailto links
    if (!info.email) {
        const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
        if (mailtoLinks.length > 0) {
            const href = mailtoLinks[0].getAttribute('href');
            info.email = href.replace('mailto:', '').split('?')[0];
        }
    }
    
    return info;
}

// Extract ages served with comprehensive patterns
function extractAgesServed(allText) {
    const agePatterns = [
        // Specific age ranges
        /(?:ages?|aged)\s*(\d+)\s*[-–to]+\s*(\d+)/gi,
        /(\d+)\s*[-–to]+\s*(\d+)\s*years?\s*old/gi,
        /(?:adolescents?|teens?|youth)\s*(?:ages?\s*)?(\d+)\s*[-–]\s*(\d+)/gi,
        // Population descriptors
        /young\s+adults?\s*\(?\s*(?:ages?\s*)?(\d+)\s*[-–]\s*(\d+)/gi,
        // Grade levels
        /grades?\s*(\d+)\s*[-–to]+\s*(\d+)/gi
    ];
    
    for (const pattern of agePatterns) {
        const matches = allText.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[2]) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                // Validate reasonable age range
                if (min >= 5 && min < max && max <= 30) {
                    return `Ages ${min}-${max}`;
                }
            }
        }
    }
    
    // Check for population descriptors without specific ages
    const populationPatterns = [
        /\b(?:serving|for|treating)\s+(adolescents?|teenagers?|teens?|young adults?)\b/gi,
        /\b(adolescent|teen|young adult)\s+(?:treatment|program|services)\b/gi
    ];
    
    for (const pattern of populationPatterns) {
        const match = pattern.exec(allText);
        if (match && match[1]) {
            const population = match[1].toLowerCase();
            if (population.includes('adolescent') || population.includes('teen')) {
                return 'Adolescents (typically 12-18)';
            } else if (population.includes('young adult')) {
                return 'Young Adults (typically 18-25)';
            }
        }
    }
    
    return '';
}

// Extract level of care with comprehensive detection
function extractLevelOfCare(allText) {
    const levels = [];
    
    const carePatterns = {
        'Residential Treatment Center (RTC)': /\b(?:residential\s+treatment|RTC|24\/7\s+care|24-hour\s+care)\b/gi,
        'Therapeutic Boarding School': /\b(?:therapeutic\s+boarding\s+school|boarding\s+school|therapeutic\s+school)\b/gi,
        'Partial Hospitalization Program (PHP)': /\b(?:PHP|partial\s+hospitalization|day\s+treatment)\b/gi,
        'Intensive Outpatient Program (IOP)': /\b(?:IOP|intensive\s+outpatient)\b/gi,
        'Outpatient Services': /\b(?:outpatient\s+(?:therapy|services|counseling))\b/gi,
        'Wilderness Therapy': /\b(?:wilderness\s+therapy|outdoor\s+therapy|adventure\s+therapy)\b/gi,
        'Transitional Living': /\b(?:transitional\s+living|step[\s-]?down|independent\s+living)\b/gi,
        'Sober Living': /\b(?:sober\s+living|recovery\s+residence)\b/gi
    };
    
    Object.entries(carePatterns).forEach(([level, pattern]) => {
        if (pattern.test(allText)) {
            levels.push(level);
        }
    });
    
    return levels.length > 0 ? levels.join(', ') : 'Treatment Services';
}

// Extract therapeutic modalities with clinical accuracy
function extractTherapies(allText) {
    const therapies = new Set();
    
    const therapyPatterns = [
        // Evidence-Based Therapies
        { pattern: /\b(?:CBT|Cognitive[\s-]?Behavioral?[\s-]?Therap(?:y|ies))\b/gi, name: 'Cognitive Behavioral Therapy (CBT)' },
        { pattern: /\b(?:DBT|Dialectical[\s-]?Behavior(?:al)?[\s-]?Therap(?:y|ies))\b/gi, name: 'Dialectical Behavior Therapy (DBT)' },
        { pattern: /\b(?:EMDR|Eye[\s-]?Movement[\s-]?Desensitization(?:[\s-]?and[\s-]?Reprocessing)?)\b/gi, name: 'EMDR' },
        { pattern: /\b(?:ACT|Acceptance[\s-]?and[\s-]?Commitment[\s-]?Therap(?:y|ies))\b/gi, name: 'Acceptance and Commitment Therapy (ACT)' },
        { pattern: /\b(?:TF[\s-]?CBT|Trauma[\s-]?Focused[\s-]?CBT)\b/gi, name: 'Trauma-Focused CBT' },
        { pattern: /\b(?:CPT|Cognitive[\s-]?Processing[\s-]?Therap(?:y|ies))\b/gi, name: 'Cognitive Processing Therapy' },
        { pattern: /\b(?:PE|Prolonged[\s-]?Exposure)\b/gi, name: 'Prolonged Exposure Therapy' },
        { pattern: /\b(?:IFS|Internal[\s-]?Family[\s-]?Systems?)\b/gi, name: 'Internal Family Systems (IFS)' },
        
        // Somatic & Body-Based
        { pattern: /\bSomatic[\s-]?(?:Experiencing|Therap(?:y|ies))\b/gi, name: 'Somatic Experiencing' },
        { pattern: /\bBrainspotting\b/gi, name: 'Brainspotting' },
        { pattern: /\b(?:NARM|NeuroAffective[\s-]?Relational[\s-]?Model)\b/gi, name: 'NARM' },
        { pattern: /\bNeurofeedback\b/gi, name: 'Neurofeedback' },
        { pattern: /\b(?:QEEG|Quantitative[\s-]?EEG|Brain[\s-]?Mapping)\b/gi, name: 'QEEG Brain Mapping' },
        
        // Experiential Therapies
        { pattern: /\b(?:Equine|Horse)[\s-]?(?:Assisted|Therap(?:y|ies))\b/gi, name: 'Equine-Assisted Therapy' },
        { pattern: /\bArt[\s-]?Therap(?:y|ies)\b/gi, name: 'Art Therapy' },
        { pattern: /\bMusic[\s-]?Therap(?:y|ies)\b/gi, name: 'Music Therapy' },
        { pattern: /\b(?:Adventure|Wilderness)[\s-]?Therap(?:y|ies)\b/gi, name: 'Adventure/Wilderness Therapy' },
        { pattern: /\bDrama[\s-]?Therap(?:y|ies)\b/gi, name: 'Drama Therapy' },
        { pattern: /\b(?:Dance|Movement)[\s-]?Therap(?:y|ies)\b/gi, name: 'Dance/Movement Therapy' },
        { pattern: /\bRecreation(?:al)?[\s-]?Therap(?:y|ies)\b/gi, name: 'Recreational Therapy' },
        
        // Group & Family
        { pattern: /\bGroup[\s-]?(?:Therap(?:y|ies)|Counseling)\b/gi, name: 'Group Therapy' },
        { pattern: /\bFamily[\s-]?(?:Therap(?:y|ies)|Counseling)\b/gi, name: 'Family Therapy' },
        { pattern: /\bMulti[\s-]?Family[\s-]?(?:Therap(?:y|ies)|Groups?)\b/gi, name: 'Multi-Family Group Therapy' },
        { pattern: /\bIndividual[\s-]?(?:Therap(?:y|ies)|Counseling)\b/gi, name: 'Individual Therapy' },
        
        // Mindfulness & Meditation
        { pattern: /\b(?:Mindfulness|MBSR|MBCT)\b/gi, name: 'Mindfulness-Based Therapy' },
        { pattern: /\bYoga[\s-]?Therap(?:y|ies)?\b/gi, name: 'Yoga Therapy' },
        { pattern: /\bMeditation\b/gi, name: 'Meditation' },
        
        // Other Modalities
        { pattern: /\b(?:MI|Motivational[\s-]?Interviewing)\b/gi, name: 'Motivational Interviewing' },
        { pattern: /\bNarrative[\s-]?Therap(?:y|ies)\b/gi, name: 'Narrative Therapy' },
        { pattern: /\bSolution[\s-]?Focused[\s-]?(?:Brief[\s-]?)?Therap(?:y|ies)\b/gi, name: 'Solution-Focused Therapy' },
        { pattern: /\b(?:ABA|Applied[\s-]?Behavior(?:al)?[\s-]?Analysis)\b/gi, name: 'Applied Behavior Analysis (ABA)' }
    ];
    
    therapyPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(allText)) {
            therapies.add(name);
        }
    });
    
    return Array.from(therapies);
}

// Extract specializations with clinical categories
function extractSpecializations(allText) {
    const specializations = new Set();
    
    const specPatterns = {
        'Trauma & PTSD': /\b(?:trauma|PTSD|post[\s-]?traumatic|complex[\s-]?trauma|developmental[\s-]?trauma|C[\s-]?PTSD|abuse|neglect)\b/gi,
        'Anxiety Disorders': /\b(?:anxiety|panic|phobia|OCD|obsessive[\s-]?compulsive|social[\s-]?anxiety|GAD|generalized[\s-]?anxiety)\b/gi,
        'Depression & Mood Disorders': /\b(?:depression|depressive|bipolar|mood[\s-]?disorder|dysthymia|mania)\b/gi,
        'ADHD & Executive Function': /\b(?:ADHD|ADD|attention[\s-]?deficit|hyperactivity|executive[\s-]?function|focus|concentration)\b/gi,
        'Autism Spectrum': /\b(?:autism|ASD|spectrum|Asperger|neurodivers|PDD)\b/gi,
        'Substance Use': /\b(?:substance|addiction|drug|alcohol|chemical[\s-]?dependency|dual[\s-]?diagnosis|recovery)\b/gi,
        'Eating Disorders': /\b(?:eating[\s-]?disorder|anorexia|bulimia|binge|ARFID|body[\s-]?image|disordered[\s-]?eating)\b/gi,
        'Attachment Issues': /\b(?:attachment|RAD|reactive[\s-]?attachment|adoption|foster|bonding)\b/gi,
        'LGBTQ+ Support': /\b(?:LGBTQ|lesbian|gay|bisexual|transgender|gender[\s-]?identity|gender[\s-]?dysphoria|non[\s-]?binary)\b/gi,
        'Self-Harm & Suicidality': /\b(?:self[\s-]?harm|self[\s-]?injury|cutting|suicidal|suicide|NSSI)\b/gi,
        'Behavioral Issues': /\b(?:behavioral|oppositional|defiant|ODD|conduct[\s-]?disorder|aggression|anger)\b/gi,
        'Learning Differences': /\b(?:learning[\s-]?(?:disability|difference|disorder)|dyslexia|dysgraphia|dyscalculia)\b/gi,
        'Technology Addiction': /\b(?:technology|gaming|screen|internet|digital|video[\s-]?game)[\s-]?(?:addiction|dependency|disorder)\b/gi,
        'Family Conflict': /\b(?:family[\s-]?conflict|parent[\s-]?child|relationship|communication|dynamics)\b/gi,
        'Personality Disorders': /\b(?:personality[\s-]?disorder|borderline|BPD|narcissistic|antisocial)\b/gi
    };
    
    Object.entries(specPatterns).forEach(([spec, pattern]) => {
        if (pattern.test(allText)) {
            specializations.add(spec);
        }
    });
    
    return Array.from(specializations);
}

// Extract unique program features
function extractUniqueFeatures(allText, extractedData) {
    const features = [];
    
    // Extract specific program features with patterns
    const featurePatterns = [
        // Staff ratios
        {
            pattern: /(?:staff|student|client)[\s-]?(?:to|:)[\s-]?(?:student|client|staff)[\s-]?ratio[\s:-]*(\d+:\d+)/gi,
            format: (match) => `Staff-to-Client Ratio: ${match[1]}`
        },
        // Average length of stay
        {
            pattern: /(?:average|typical)[\s-]?(?:length|duration)[\s-]?(?:of[\s-]?)?(?:stay|treatment)[\s:-]*(\d+[\s-]?\d*\s*(?:days?|weeks?|months?))/gi,
            format: (match) => `Average Length of Stay: ${match[1]}`
        },
        // Admission criteria
        {
            pattern: /admission[\s-]?(?:criteria|requirements?)[\s:-]+([^.]+)/gi,
            format: (match) => `Admission Criteria: ${match[1].trim()}`
        },
        // Unique approaches
        {
            pattern: /(?:unique|specialized|signature|exclusive)[\s-]?(?:approach|program|feature)[\s:-]+([^.]+)/gi,
            format: (match) => match[1].trim()
        },
        // Campus/facility features
        {
            pattern: /(?:\d+)[\s-]?acre[\s-]?(?:campus|facility|property)/gi,
            format: (match) => match[0]
        },
        // Academic program
        {
            pattern: /(?:accredited|certified)[\s-]?(?:academic|school)[\s-]?program/gi,
            format: (match) => 'Accredited Academic Program'
        },
        // Family involvement
        {
            pattern: /(?:weekly|monthly|regular)[\s-]?family[\s-]?(?:therapy|sessions?|involvement)/gi,
            format: (match) => match[0]
        }
    ];
    
    featurePatterns.forEach(({ pattern, format }) => {
        const matches = allText.matchAll(pattern);
        for (const match of matches) {
            const feature = format(match);
            if (feature && feature.length > 10 && feature.length < 200) {
                features.push(feature);
                break; // Only take first match for each pattern
            }
        }
    });
    
    // Add therapy-based features
    if (extractedData.therapies && extractedData.therapies.length > 0) {
        const uniqueTherapies = extractedData.therapies.filter(t => 
            t.includes('Equine') || t.includes('NARM') || t.includes('Brainspotting') || 
            t.includes('Neurofeedback') || t.includes('Adventure')
        );
        if (uniqueTherapies.length > 0) {
            features.push(`Specialized Therapies: ${uniqueTherapies.join(', ')}`);
        }
    }
    
    // Add level of care features
    if (extractedData.levelOfCare) {
        if (extractedData.levelOfCare.includes('Wilderness')) {
            features.push('Wilderness therapy setting with outdoor expeditions');
        }
        if (extractedData.levelOfCare.includes('Boarding School')) {
            features.push('Therapeutic boarding school with integrated academics');
        }
    }
    
    // Limit to most relevant features
    return features.slice(0, 8);
}

// Extract accreditations and certifications
function extractAccreditations(allText) {
    const accreditations = new Set();
    
    const accredPatterns = [
        { pattern: /\bJoint[\s-]?Commission(?:[\s-]?accredited)?\b/gi, name: 'Joint Commission Accredited' },
        { pattern: /\bJCAHO\b/g, name: 'JCAHO Accredited' },
        { pattern: /\bCARF(?:[\s-]?accredited)?\b/gi, name: 'CARF Accredited' },
        { pattern: /\bNATSAP\b/g, name: 'NATSAP Member' },
        { pattern: /\bCognia\b/gi, name: 'Cognia Accredited' },
        { pattern: /\bAdvancED\b/g, name: 'AdvancED Accredited' },
        { pattern: /\bNCA[\s-]?CASI\b/g, name: 'NCA CASI Accredited' },
        { pattern: /\bBBB[\s-]?(?:accredited|member)\b/gi, name: 'BBB Accredited' },
        { pattern: /\bstate[\s-]?licensed\b/gi, name: 'State Licensed' },
        { pattern: /\bMedicare[\s-]?certified\b/gi, name: 'Medicare Certified' },
        { pattern: /\bMedicaid[\s-]?certified\b/gi, name: 'Medicaid Certified' }
    ];
    
    accredPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(allText)) {
            accreditations.add(name);
        }
    });
    
    return Array.from(accreditations);
}

// Extract clinical approach
function extractClinicalApproach(allText) {
    const approachPatterns = [
        /(?:our|the)[\s-]?(?:treatment|clinical|therapeutic)[\s-]?(?:approach|philosophy|model)[\s:-]+([^.]+\.)/gi,
        /(?:we[\s-]?believe|our[\s-]?belief|philosophy)[\s:-]+([^.]+\.)/gi,
        /(?:evidence[\s-]?based|research[\s-]?based|proven)[\s-]?(?:approach|treatment|methods?)[\s:-]*([^.]+\.)/gi
    ];
    
    for (const pattern of approachPatterns) {
        const match = pattern.exec(allText);
        if (match && match[1]) {
            const approach = match[1].trim();
            if (approach.length > 20 && approach.length < 300) {
                return approach;
            }
        }
    }
    
    return '';
}

// Extract staff credentials
function extractStaffCredentials(allText) {
    const credentialPatterns = [
        /(?:staff|team|therapists?|counselors?)[\s-]?(?:are|include|have)[\s:-]+([^.]*(?:licensed|certified|trained|credentialed|qualified)[^.]+)/gi,
        /(?:led[\s-]?by|directed[\s-]?by|staffed[\s-]?by)[\s:-]+([^.]*(?:PhD|MD|LCSW|LCPC|LPC|LMFT|psychologist|psychiatrist)[^.]+)/gi
    ];
    
    for (const pattern of credentialPatterns) {
        const match = pattern.exec(allText);
        if (match && match[1]) {
            const credentials = match[1].trim();
            if (credentials.length > 10 && credentials.length < 200) {
                return credentials;
            }
        }
    }
    
    return '';
}

// Extract program length
function extractProgramLength(allText) {
    const lengthPatterns = [
        /(?:program|treatment|stay)[\s-]?(?:length|duration|lasts?|is)[\s:-]*(?:typically|approximately|about|average)?[\s:-]*(\d+[\s-]?\d*\s*(?:days?|weeks?|months?))/gi,
        /(?:average|typical)[\s-]?length[\s-]?of[\s-]?stay[\s:-]*(\d+[\s-]?\d*\s*(?:days?|weeks?|months?))/gi
    ];
    
    for (const pattern of lengthPatterns) {
        const match = pattern.exec(allText);
        if (match && match[1]) {
            return match[1].trim();
        }
    }
    
    return '';
}

// Extract family involvement details
function extractFamilyInvolvement(allText) {
    const familyPatterns = [
        /family[\s-]?(?:involvement|participation|therapy|program|sessions?)[\s:-]+([^.]+)/gi,
        /(?:weekly|monthly|regular)[\s-]?family[\s-]?(?:therapy|sessions?|visits?)[\s:-]*([^.]*)/gi,
        /parent[\s-]?(?:involvement|participation|weekends?|workshops?)[\s:-]+([^.]+)/gi
    ];
    
    for (const pattern of familyPatterns) {
        const match = pattern.exec(allText);
        if (match && match[1]) {
            const involvement = match[1].trim();
            if (involvement.length > 10 && involvement.length < 200) {
                return involvement;
            }
        }
    }
    
    return '';
}

// Extract academic support information
function extractAcademicSupport(allText) {
    const academicPatterns = [
        /(?:academic|educational|school)[\s-]?(?:program|support|services?)[\s:-]+([^.]+)/gi,
        /(?:accredited|certified)[\s-]?(?:academic|school)[\s-]?program[\s:-]*([^.]*)/gi,
        /(?:grades|serving[\s-]?grades)[\s:-]*(\d+[\s-]?[-–to]\s*\d+)/gi
    ];
    
    for (const pattern of academicPatterns) {
        const match = pattern.exec(allText);
        if (match && match[1]) {
            const academic = match[1].trim();
            if (academic.length > 5 && academic.length < 200) {
                return academic;
            }
        }
    }
    
    return '';
}

// Extract insurance information
function extractInsurance(allText) {
    const insurancePatterns = [
        /(?:accept|take|work[\s-]?with)[\s:-]*(?:insurance|insurances|plans?)[\s:-]+([^.]+)/gi,
        /insurance[\s-]?(?:accepted|coverage|plans?)[\s:-]+([^.]+)/gi,
        /(?:in[\s-]?network|participating)[\s-]?(?:with|provider)[\s:-]+([^.]+)/gi
    ];
    
    for (const pattern of insurancePatterns) {
        const match = pattern.exec(allText);
        if (match && match[1]) {
            const insurance = match[1].trim();
            if (insurance.length > 5 && insurance.length < 200) {
                return insurance;
            }
        }
    }
    
    // Check for specific insurance companies
    const insuranceCompanies = [
        'Aetna', 'Cigna', 'Blue Cross', 'Blue Shield', 'United Healthcare', 
        'Anthem', 'Humana', 'Kaiser', 'Medicaid', 'Medicare', 'TRICARE'
    ];
    
    const found = insuranceCompanies.filter(company => 
        new RegExp(`\\b${company}\\b`, 'gi').test(allText)
    );
    
    return found.length > 0 ? `Accepts: ${found.join(', ')}` : '';
}

// Generate a clinical description
function generateClinicalDescription(data) {
    let description = '';
    
    // Start with program name and type
    if (data.programName) {
        description = `${data.programName}`;
        
        // Determine level of care more specifically
        if (data.levelOfCare) {
            const careLevel = data.levelOfCare.toLowerCase();
            if (careLevel.includes('residential')) {
                description += ' provides residential treatment';
            } else if (careLevel.includes('php')) {
                description += ' offers partial hospitalization (PHP)';
            } else if (careLevel.includes('iop')) {
                description += ' provides intensive outpatient (IOP) services';
            } else if (careLevel.includes('wilderness')) {
                description += ' is a wilderness therapy program';
            } else if (careLevel.includes('boarding')) {
                description += ' is a therapeutic boarding school';
            } else {
                description += ` offers ${careLevel}`;
            }
        } else {
            // Try to infer from therapies and features
            if (data.therapies && data.therapies.some(t => t.toLowerCase().includes('wilderness'))) {
                description += ' provides wilderness-based therapeutic treatment';
            } else if (data.therapies && data.therapies.some(t => t.toLowerCase().includes('equine'))) {
                description += ' offers equine-assisted therapeutic treatment';
            } else if (data.features && data.features.some(f => f.toLowerCase().includes('24/7'))) {
                description += ' provides 24/7 residential care';
            } else {
                description += ' offers specialized therapeutic treatment';
            }
        }
    } else {
        description = 'This therapeutic program provides specialized treatment';
    }
    
    // Add population served with better formatting
    if (data.agesServed) {
        const ages = data.agesServed.toLowerCase();
        if (ages.includes('-')) {
            description += ` for adolescents ages ${ages}`;
        } else {
            description += ` for ${ages}`;
        }
    } else {
        // Try to infer from other data
        if (data.programName && data.programName.toLowerCase().includes('adolescent')) {
            description += ' for adolescents';
        } else if (data.programName && data.programName.toLowerCase().includes('teen')) {
            description += ' for teens';
        } else if (data.programName && data.programName.toLowerCase().includes('youth')) {
            description += ' for youth';
        }
    }
    
    // Add location
    if (data.location) {
        description += ` in ${data.location}`;
    }
    
    description += '.';
    
    // Add specialization focus with more detail
    if (data.specializations && data.specializations.length > 0) {
        const primarySpecs = data.specializations.slice(0, 3);
        
        // Format specializations better
        const formattedSpecs = primarySpecs.map(spec => {
            if (spec === 'trauma') return 'trauma and PTSD';
            if (spec === 'anxiety') return 'anxiety disorders';
            if (spec === 'depression') return 'depression and mood disorders';
            if (spec === 'ADHD') return 'ADHD and executive functioning';
            if (spec === 'autism/ASD') return 'autism spectrum disorders';
            if (spec === 'substance abuse') return 'substance use disorders';
            if (spec === 'eating disorders') return 'eating disorders';
            if (spec === 'adoption/attachment') return 'adoption and attachment issues';
            if (spec === 'self-harm') return 'self-harm and suicidal ideation';
            if (spec === 'behavioral issues') return 'behavioral and oppositional disorders';
            return spec;
        });
        
        description += ` The program specializes in treating ${formattedSpecs.join(', ')}`;
        
        // Add treatment philosophy if multiple specializations
        if (data.specializations.length > 3) {
            description += ', utilizing an integrated treatment approach';
        }
        description += '.';
    }
    
    // Add specific clinical approach or unique features
    if (data.clinicalApproach && data.clinicalApproach.length > 20) {
        // Clean up and format clinical approach
        let approach = data.clinicalApproach.trim();
        if (!approach.endsWith('.')) approach += '.';
        description += ` ${approach}`;
    } else if (data.therapies && data.therapies.length > 5) {
        description += ` The program utilizes evidence-based and experiential therapies tailored to each client's needs.`;
    }
    
    // Add accreditation with proper formatting
    if (data.accreditations && data.accreditations.length > 0) {
        const accreds = data.accreditations.map(a => {
            if (a === 'JCAHO' || a === 'Joint Commission') return 'Joint Commission accredited';
            if (a === 'CARF') return 'CARF accredited';
            if (a === 'NATSAP') return 'NATSAP member';
            return a + ' accredited';
        });
        description += ` The facility is ${accreds.join(' and ')}.`;
    }
    
    return description;
}

// Format the extracted data for the clinical write-up
function formatClinicalWriteup(data) {
    let writeup = `${data.programName || 'Treatment Program'}`;
    
    if (data.location) {
        writeup += ` – ${data.location}`;
    }
    writeup += '\n\n';
    
    // Level of Care & Services
    writeup += 'Level of Care & Services Provided:\n';
    writeup += data.description || 'Comprehensive treatment services';
    writeup += '\n\n';
    
    // Program Details
    writeup += 'Program Details / Differentiating Features:\n';
    
    // Add evidence-based therapies
    if (data.therapies && data.therapies.length > 0) {
        const evidenceBased = data.therapies.filter(t => 
            t.includes('CBT') || t.includes('DBT') || t.includes('EMDR') || 
            t.includes('ACT') || t.includes('TF-CBT') || t.includes('IFS')
        );
        if (evidenceBased.length > 0) {
            writeup += `• Evidence-Based Therapies: ${evidenceBased.join(', ')}\n`;
        }
        
        const experiential = data.therapies.filter(t => 
            t.includes('Art') || t.includes('Music') || t.includes('Equine') || 
            t.includes('Adventure') || t.includes('Drama')
        );
        if (experiential.length > 0) {
            writeup += `• Experiential Therapies: ${experiential.join(', ')}\n`;
        }
    }
    
    // Add unique features
    if (data.features && data.features.length > 0) {
        data.features.forEach(feature => {
            writeup += `• ${feature}\n`;
        });
    }
    
    // Add clinical details
    if (data.staffCredentials) {
        writeup += `• Clinical Team: ${data.staffCredentials}\n`;
    }
    if (data.programLength) {
        writeup += `• Typical Length of Stay: ${data.programLength}\n`;
    }
    if (data.familyInvolvement) {
        writeup += `• Family Program: ${data.familyInvolvement}\n`;
    }
    if (data.academicSupport) {
        writeup += `• Academic Support: ${data.academicSupport}\n`;
    }
    
    writeup += '\n';
    
    // Clinical Considerations
    if (data.specializations && data.specializations.length > 0) {
        writeup += 'Clinical Specializations:\n';
        const topSpecs = data.specializations.slice(0, 6);
        topSpecs.forEach(spec => {
            writeup += `• ${spec}\n`;
        });
        writeup += '\n';
    }
    
    // Contact Information
    writeup += 'Contact Information:\n';
    if (data.phone) {
        writeup += `Phone: ${data.phone}\n`;
    }
    if (data.email) {
        writeup += `Email: ${data.email}\n`;
    }
    if (data.website) {
        writeup += `Website: ${data.website}\n`;
    }
    if (data.insuranceInfo) {
        writeup += `Insurance: ${data.insuranceInfo}\n`;
    }
    
    return writeup;
}

// Site-specific extractor for Voyage Recovery
function extractVoyageRecoveryData(document, window, allText) {
    const data = {
        programName: 'Voyage Recovery',
        location: '',
        phone: '',
        email: '',
        website: window.location.href,
        agesServed: '',
        levelOfCare: '',
        description: '',
        therapies: [],
        specializations: [],
        features: [],
        accreditations: [],
        clinicalApproach: '',
        staffCredentials: '',
        programLength: '',
        familyInvolvement: '',
        academicSupport: '',
        insuranceInfo: ''
    };
    
    // Extract location - Voyage Recovery specific patterns
    const locationPatterns = [
        /Miami,?\s*FL/i,
        /Miami,?\s*Florida/i,
        /located in ([^,.]+(?:,\s*[A-Z]{2})?)/i
    ];
    
    for (const pattern of locationPatterns) {
        const match = allText.match(pattern);
        if (match) {
            data.location = match[0].includes('located') ? match[1] : match[0];
            break;
        }
    }
    
    // Extract phone - look for admission/contact numbers
    const phoneMatch = allText.match(/(?:call|phone|contact us|admission).*?(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i);
    if (phoneMatch) {
        data.phone = phoneMatch[1];
    }
    
    // Extract email
    const emailMatch = allText.match(/(?:email|contact).*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
        data.email = emailMatch[1];
    }
    
    // Extract ages served
    const ageMatch = allText.match(/(\d+)\s*[-–to]\s*(\d+)\s*(?:years?\s*old|year\s*olds?)/i);
    if (ageMatch) {
        data.agesServed = `${ageMatch[1]}-${ageMatch[2]} years`;
    }
    
    // Extract level of care
    if (allText.match(/residential\s*treatment/i)) {
        data.levelOfCare = 'Residential Treatment';
    }
    
    // Extract therapies - be comprehensive
    const therapyKeywords = [
        'CBT', 'Cognitive Behavioral Therapy',
        'DBT', 'Dialectical Behavior Therapy',
        'EMDR', 'Eye Movement Desensitization',
        'Family Therapy', 'Group Therapy', 'Individual Therapy',
        'Art Therapy', 'Music Therapy', 'Equine Therapy',
        'Adventure Therapy', 'Experiential Therapy',
        'Trauma-Focused', 'Mindfulness', 'Yoga',
        'Recreation Therapy', 'Somatic'
    ];
    
    therapyKeywords.forEach(therapy => {
        if (allText.match(new RegExp(therapy, 'i'))) {
            // Normalize therapy names
            if (therapy === 'Cognitive Behavioral Therapy') therapy = 'CBT';
            if (therapy === 'Dialectical Behavior Therapy') therapy = 'DBT';
            if (therapy === 'Eye Movement Desensitization') therapy = 'EMDR';
            data.therapies.push(therapy);
        }
    });
    
    // Extract specializations
    const specKeywords = {
        'trauma': /trauma|PTSD|post.?traumatic/i,
        'anxiety': /anxiety|panic|phobia/i,
        'depression': /depression|mood/i,
        'substance abuse': /substance|addiction|drug|alcohol/i,
        'behavioral issues': /behavioral|oppositional|defiant/i,
        'self-harm': /self.?harm|cutting|suicidal/i,
        'eating disorders': /eating.?disorder|anorexia|bulimia/i,
        'ADHD': /ADHD|ADD|attention.?deficit/i
    };
    
    Object.entries(specKeywords).forEach(([spec, pattern]) => {
        if (pattern.test(allText)) {
            data.specializations.push(spec);
        }
    });
    
    // Extract unique features
    if (allText.match(/24.?7|24.?hours|around.?the.?clock/i)) {
        data.features.push('24/7 supervision and support');
    }
    if (allText.match(/small.?group|low.?ratio|personalized/i)) {
        data.features.push('Small group sizes for personalized care');
    }
    if (allText.match(/licensed|certified|credentialed/i)) {
        data.features.push('Licensed clinical staff');
    }
    
    // Generate description
    data.description = generateClinicalDescription(data);
    
    return data;
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        extractClinicalProgramData,
        formatClinicalWriteup
    };
}
