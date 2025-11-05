// Enhanced extraction patterns for treatment programs
// This file contains smart extraction logic without needing AI APIs

const TREATMENT_PATTERNS = {
    // Age patterns
    ages: {
        patterns: [
            /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)(?:\s*old)?/gi,
            /ages?\s*(\d+)\s*(?:to|through|[-–])\s*(\d+)/gi,
            /(?:adolescents?|teens?|youth)\s*(?:ages?\s*)?(\d+)\s*[-–]\s*(\d+)/gi,
            /(?:serve|serving|admits?|accept)\s*(?:ages?\s*)?(\d+)\s*[-–]\s*(\d+)/gi
        ],
        keywords: ['adolescent', 'teen', 'youth', 'young adult', 'child', 'pediatric']
    },
    
    // Treatment modalities
    modalities: {
        patterns: [
            /\b(CBT|Cognitive[\s-]?Behavioral[\s-]?Therapy)\b/gi,
            /\b(DBT|Dialectical[\s-]?Behavior[\s-]?Therapy)\b/gi,
            /\b(EMDR|Eye[\s-]?Movement[\s-]?Desensitization)\b/gi,
            /\b(MI|Motivational[\s-]?Interviewing)\b/gi,
            /\b(ACT|Acceptance[\s-]?Commitment[\s-]?Therapy)\b/gi,
            /\b(TF[\s-]?CBT|Trauma[\s-]?Focused[\s-]?CBT)\b/gi
        ],
        keywords: [
            'individual therapy', 'group therapy', 'family therapy',
            'art therapy', 'music therapy', 'equine therapy', 
            'experiential therapy', 'adventure therapy', 'wilderness therapy',
            'play therapy', 'sand tray therapy', 'drama therapy'
        ]
    },
    
    // Specialties and conditions treated
    specialties: {
        keywords: [
            'trauma', 'PTSD', 'abuse', 'neglect',
            'depression', 'anxiety', 'mood disorder',
            'ADHD', 'ADD', 'attention deficit',
            'autism', 'ASD', 'spectrum',
            'eating disorder', 'anorexia', 'bulimia',
            'substance use', 'addiction', 'chemical dependency',
            'self-harm', 'cutting', 'suicidal ideation',
            'behavioral issues', 'conduct disorder', 'oppositional defiant'
        ]
    },
    
    // Level of care indicators
    levelOfCare: {
        residential: ['residential', '24/7', '24-hour', 'inpatient', 'RTC'],
        php: ['PHP', 'partial hospitalization', 'day treatment', 'day program'],
        iop: ['IOP', 'intensive outpatient', 'after school', 'evening program'],
        outpatient: ['outpatient', 'weekly sessions', 'counseling', 'therapy services']
    },
    
    // Accreditations and certifications
    accreditations: {
        patterns: [
            /\b(CARF|Commission on Accreditation of Rehabilitation Facilities)\b/gi,
            /\b(Joint Commission|JCAHO|JC)\b/gi,
            /\b(COA|Council on Accreditation)\b/gi,
            /\b(NATSAP|National Association of Therapeutic)\b/gi
        ]
    }
};

// Smart content analyzer
function analyzeContent(text) {
    const analysis = {
        ageRange: null,
        modalities: [],
        specialties: [],
        levelOfCare: [],
        accreditations: [],
        insurances: []
    };
    
    // Extract age ranges
    for (const pattern of TREATMENT_PATTERNS.ages.patterns) {
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            if (match[1] && match[2]) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                if (min >= 5 && min < max && max <= 25) {
                    analysis.ageRange = `${min}-${max} years`;
                    break;
                }
            }
        }
        if (analysis.ageRange) break;
    }
    
    // Extract modalities
    for (const pattern of TREATMENT_PATTERNS.modalities.patterns) {
        const matches = text.match(pattern);
        if (matches) {
            analysis.modalities.push(...matches);
        }
    }
    
    // Extract keywords
    const lowerText = text.toLowerCase();
    
    // Modality keywords
    TREATMENT_PATTERNS.modalities.keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            analysis.modalities.push(keyword);
        }
    });
    
    // Specialty keywords
    TREATMENT_PATTERNS.specialties.keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            analysis.specialties.push(keyword);
        }
    });
    
    // Level of care
    Object.entries(TREATMENT_PATTERNS.levelOfCare).forEach(([level, keywords]) => {
        keywords.forEach(keyword => {
            if (lowerText.includes(keyword.toLowerCase())) {
                analysis.levelOfCare.push(level);
            }
        });
    });
    
    // Accreditations
    for (const pattern of TREATMENT_PATTERNS.accreditations.patterns) {
        const matches = text.match(pattern);
        if (matches) {
            analysis.accreditations.push(...matches);
        }
    }
    
    // Insurance patterns
    const insurancePattern = /(?:accept|take|work with|participate|network|covered by)\s*(?:insurance|insurances)?:?\s*([^.]+)/gi;
    const insuranceMatches = text.matchAll(insurancePattern);
    for (const match of insuranceMatches) {
        if (match[1]) {
            const insurances = match[1].split(/[,;]/).map(ins => ins.trim()).filter(ins => ins.length > 0);
            analysis.insurances.push(...insurances);
        }
    }
    
    // Deduplicate arrays
    analysis.modalities = [...new Set(analysis.modalities)];
    analysis.specialties = [...new Set(analysis.specialties)];
    analysis.levelOfCare = [...new Set(analysis.levelOfCare)];
    analysis.accreditations = [...new Set(analysis.accreditations)];
    analysis.insurances = [...new Set(analysis.insurances)];
    
    return analysis;
}

// Extract structured contact information
function extractContactInfo(doc) {
    const contacts = {
        phones: [],
        emails: [],
        addresses: [],
        fax: []
    };
    
    // Phone patterns (more comprehensive)
    const phonePatterns = [
        /(?:phone|tel|call|contact)[\s:]*([+\d\s\-().]+\d{4})/gi,
        /\b(\d{3}[\s.-]?\d{3}[\s.-]?\d{4})\b/g,
        /\b(\(\d{3}\)[\s.-]?\d{3}[\s.-]?\d{4})\b/g,
        /(?:crisis|24\/7|emergency)[\s:]*([+\d\s\-().]+\d{4})/gi
    ];
    
    const allText = doc.body.textContent || '';
    
    phonePatterns.forEach(pattern => {
        const matches = allText.matchAll(pattern);
        for (const match of matches) {
            if (match[1]) {
                const phone = match[1].trim();
                if (phone.replace(/\D/g, '').length >= 10) {
                    contacts.phones.push(phone);
                }
            }
        }
    });
    
    // Email patterns
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = allText.match(emailPattern) || [];
    contacts.emails = emails.filter(email => 
        !email.includes('.png') && 
        !email.includes('.jpg') && 
        !email.includes('@example.com')
    );
    
    // Address extraction (look for structured elements)
    const addressSelectors = [
        'address',
        '[itemtype*="PostalAddress"]',
        '[class*="address"]',
        '[id*="address"]',
        '[class*="location"]'
    ];
    
    addressSelectors.forEach(selector => {
        doc.querySelectorAll(selector).forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 10 && text.length < 200) {
                contacts.addresses.push(text);
            }
        });
    });
    
    // Fax patterns
    const faxPattern = /fax[\s:]*([+\d\s\-().]+\d{4})/gi;
    const faxMatches = allText.matchAll(faxPattern);
    for (const match of faxMatches) {
        if (match[1]) {
            contacts.fax.push(match[1].trim());
        }
    }
    
    // Deduplicate
    Object.keys(contacts).forEach(key => {
        contacts[key] = [...new Set(contacts[key])];
    });
    
    return contacts;
}

// Extract program schedule information
function extractSchedule(text) {
    const schedule = {
        admissionDays: [],
        visitingHours: [],
        programSchedule: []
    };
    
    // Days of week patterns
    const daysPattern = /(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekdays|weekends|daily)/gi;
    const timePattern = /\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)/g;
    
    // Look for admission information
    if (text.match(/admissions?\s*(?:days?|available|open)/i)) {
        const nearbyDays = text.match(daysPattern);
        if (nearbyDays) {
            schedule.admissionDays = nearbyDays;
        }
    }
    
    // Look for visiting hours
    if (text.match(/visiting\s*(?:hours?|times?)/i)) {
        const nearbyTimes = text.match(timePattern);
        if (nearbyTimes) {
            schedule.visitingHours = nearbyTimes;
        }
    }
    
    return schedule;
}

// Export functions for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeContent,
        extractContactInfo,
        extractSchedule,
        TREATMENT_PATTERNS
    };
}