// Content script that can interact with the page
// This runs in the context of web pages

console.log('Family First Program Extractor content script loaded');

// Load enhanced extraction patterns
const TREATMENT_PATTERNS = {
    // Age patterns
    ages: {
        patterns: [
            /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)(?:\s*old)?/gi,
            /ages?\s*(\d+)\s*(?:to|through|[-–])\s*(\d+)/gi,
            /(?:adolescents?|teens?|youth)\s*(?:ages?\s*)?(\d+)\s*[-–]\s*(\d+)/gi,
            /(?:serve|serving|admits?|accept)\s*(?:ages?\s*)?(\d+)\s*[-–]\s*(\d+)/gi
        ]
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
    
    // Level of care indicators
    levelOfCare: {
        residential: ['residential', '24/7', '24-hour', 'inpatient', 'RTC'],
        php: ['PHP', 'partial hospitalization', 'day treatment', 'day program'],
        iop: ['IOP', 'intensive outpatient', 'after school', 'evening program'],
        outpatient: ['outpatient', 'weekly sessions', 'counseling', 'therapy services']
    }
};

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractInfo') {
        // Extract information from the page with multi-page support
        extractComprehensiveInfo().then(extractedData => {
            sendResponse({ data: extractedData });
        });
        return true; // Keep message channel open for async response
    }
});

// Helper function to check if text contains code/script
function isValidContent(text) {
    if (!text || text.length < 10) return false;
    
    // Skip if contains common code patterns
    const codePatterns = [
        /function\s*\(/,
        /\{[\s\S]*\}/,
        /window\./,
        /document\./,
        /setREVStartSize/,
        /undefined/,
        /console\./,
        /var\s+\w+\s*=/,
        /if\s*\(/,
        /for\s*\(/,
        /\(\s*\)\s*=>/,
        /module\.exports/
    ];
    
    return !codePatterns.some(pattern => pattern.test(text));
}

// Function to extract page information
function extractPageInfo() {
    const info = {
        title: document.title,
        metaDescription: document.querySelector('meta[name="description"]')?.content || '',
        url: window.location.href,
        domain: window.location.hostname,
        
        // Extract all text content
        headings: [],
        paragraphs: [],
        listItems: [],
        
        // Contact information
        phones: [],
        emails: [],
        addresses: []
    };
    
    // Get all headings (excluding scripts and hidden elements)
    document.querySelectorAll('h1, h2, h3, h4').forEach(h => {
        if (h.offsetParent === null) return; // Skip hidden elements
        const text = h.textContent.trim();
        if (text && text.length > 2 && isValidContent(text)) {
            info.headings.push({
                level: h.tagName,
                text: text
            });
        }
    });
    
    // Get all paragraphs (with better filtering)
    document.querySelectorAll('p').forEach(p => {
        if (p.offsetParent === null) return; // Skip hidden elements
        const text = p.textContent.trim();
        if (text && text.length > 20 && text.length < 1000 && isValidContent(text)) {
            info.paragraphs.push(text);
        }
    });
    
    // Get all list items
    document.querySelectorAll('li').forEach(li => {
        const text = li.textContent.trim();
        if (text && text.length > 10) {
            info.listItems.push(text);
        }
    });
    
    // Extract all text for contact info search
    const allText = document.body.textContent || '';
    
    // Find phone numbers
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = allText.match(phoneRegex) || [];
    info.phones = [...new Set(phones)].slice(0, 5);
    
    // Find emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = allText.match(emailRegex) || [];
    info.emails = [...new Set(emails)]
        .filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('.css'))
        .slice(0, 5);
    
    // Find addresses (basic pattern)
    const addressElements = document.querySelectorAll('address, .address, [class*="address"], [id*="address"]');
    addressElements.forEach(el => {
        const text = el.textContent.trim();
        if (text) info.addresses.push(text);
    });
    
    // Look for specific sections
    info.sections = {};
    const sectionKeywords = {
        about: ['about', 'who we are', 'mission', 'overview'],
        services: ['services', 'programs', 'treatment', 'therapy'],
        approach: ['approach', 'philosophy', 'methodology', 'model'],
        admissions: ['admissions', 'contact', 'intake', 'enrollment'],
        ages: ['ages', 'age range', 'serve', 'population'],
        specialties: ['specialize', 'specialty', 'focus', 'expertise']
    };
    
    for (const [section, keywords] of Object.entries(sectionKeywords)) {
        for (const keyword of keywords) {
            // Look for headings that contain keywords
            const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5')).filter(el => {
                return el.textContent.toLowerCase().includes(keyword.toLowerCase());
            });
            
            if (headingElements.length > 0) {
                // Find the content after this heading
                let content = '';
                let currentElement = headingElements[0].nextElementSibling;
                let charCount = 0;
                
                while (currentElement && charCount < 500) {
                    if (currentElement.tagName === 'P' || currentElement.tagName === 'UL' || currentElement.tagName === 'OL') {
                        const text = currentElement.textContent.trim();
                        if (isValidContent(text)) {
                            content += text + ' ';
                            charCount += text.length;
                        }
                    }
                    
                    // Stop if we hit another heading
                    if (/^H[1-6]$/.test(currentElement.tagName)) break;
                    
                    currentElement = currentElement.nextElementSibling;
                }
                
                if (content.trim()) {
                    info.sections[section] = content.trim().substring(0, 500);
                    break;
                }
            }
        }
    }
    
    // Detect therapies mentioned
    const therapyKeywords = ['DBT', 'CBT', 'EMDR', 'trauma', 'experiential', 'equine', 'art therapy', 'music therapy', 'family therapy', 'group therapy', 'individual therapy'];
    info.therapies = therapyKeywords.filter(therapy => 
        new RegExp(`\\b${therapy}\\b`, 'i').test(allText)
    );
    
    // Enhanced extraction using smart patterns
    info.analysis = analyzeContentEnhanced(allText);
    
    // Try to extract more specific info for therapeutic boarding schools
    const therapeuticInfo = extractTherapeuticSchoolInfo();
    if (therapeuticInfo) {
        Object.assign(info, therapeuticInfo);
    }
    
    return info;
}

// Special extraction for therapeutic boarding schools
function extractTherapeuticSchoolInfo() {
    const schoolInfo = {};
    
    // Look for age information in various formats
    const agePatterns = [
        /boys?\s+(?:aged?\s+)?(\d+)\s*[-–to]+\s*(\d+)/i,
        /girls?\s+(?:aged?\s+)?(\d+)\s*[-–to]+\s*(\d+)/i,
        /ages?\s+(\d+)\s*[-–to]+\s*(\d+)/i,
        /(\d+)\s*[-–to]+\s*(\d+)\s*years?\s*old/i,
        /grades?\s+(\d+)\s*[-–to]+\s*(\d+)/i
    ];
    
    const bodyText = document.body.innerText;
    for (const pattern of agePatterns) {
        const match = bodyText.match(pattern);
        if (match) {
            schoolInfo.detectedAgeRange = `${match[1]}-${match[2]} years`;
            break;
        }
    }
    
    // Look for program type indicators
    const programTypes = {
        'therapeutic boarding school': /therapeutic\s+boarding\s+school/i,
        'residential treatment': /residential\s+treatment/i,
        'wilderness therapy': /wilderness\s+therapy/i,
        'therapeutic school': /therapeutic\s+school/i,
        'treatment center': /treatment\s+center/i
    };
    
    for (const [type, pattern] of Object.entries(programTypes)) {
        if (pattern.test(bodyText)) {
            schoolInfo.programType = type;
            break;
        }
    }
    
    // Extract clean phone numbers (avoiding duplicates)
    const cleanPhones = [];
    const phoneElements = document.querySelectorAll('a[href^="tel:"]');
    phoneElements.forEach(el => {
        const phone = el.textContent.trim();
        if (phone && !cleanPhones.includes(phone)) {
            cleanPhones.push(phone);
        }
    });
    
    if (cleanPhones.length > 0) {
        schoolInfo.primaryPhone = cleanPhones[0];
    }
    
    // Look for location information
    const locationPatterns = [
        /located\s+in\s+([^,.]+(?:,\s*[A-Z]{2})?)/i,
        /campus\s+in\s+([^,.]+(?:,\s*[A-Z]{2})?)/i,
        /([A-Za-z\s]+,\s*[A-Z]{2})\s*\d{5}/
    ];
    
    for (const pattern of locationPatterns) {
        const match = bodyText.match(pattern);
        if (match) {
            schoolInfo.location = match[1].trim();
            break;
        }
    }
    
    return schoolInfo;
}

// Enhanced content analysis function
function analyzeContentEnhanced(text) {
    const analysis = {
        ageRange: null,
        modalities: [],
        specialties: [],
        levelOfCare: [],
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
    
    // Extract modality keywords
    const lowerText = text.toLowerCase();
    TREATMENT_PATTERNS.modalities.keywords.forEach(keyword => {
        if (lowerText.includes(keyword.toLowerCase())) {
            analysis.modalities.push(keyword);
        }
    });
    
    // Level of care detection
    Object.entries(TREATMENT_PATTERNS.levelOfCare).forEach(([level, keywords]) => {
        keywords.forEach(keyword => {
            if (lowerText.includes(keyword.toLowerCase())) {
                analysis.levelOfCare.push(level);
            }
        });
    });
    
    // Insurance patterns
    const insurancePattern = /(?:accept|take|work with|insurance|covered by|participat\w+)\s*(?:with|by|in)?\s*([^.;]+(?:insurance|health|medicaid|medicare|tricare|aetna|cigna|blue cross|united|anthem|humana)[^.;]*)/gi;
    const insuranceMatches = text.matchAll(insurancePattern);
    for (const match of insuranceMatches) {
        if (match[1]) {
            const insurance = match[1].trim();
            if (insurance.length < 100) {
                analysis.insurances.push(insurance);
            }
        }
    }
    
    // Deduplicate arrays
    analysis.modalities = [...new Set(analysis.modalities)];
    analysis.levelOfCare = [...new Set(analysis.levelOfCare)];
    analysis.insurances = [...new Set(analysis.insurances)];
    
    return analysis;
}

// Comprehensive multi-page extraction
async function extractComprehensiveInfo() {
    console.log('Starting comprehensive multi-page extraction...');
    
    // First, extract from current page
    const currentPageData = extractPageInfo();
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;
    
    // Initialize comprehensive data structure
    const comprehensiveData = {
        ...currentPageData,
        pages: {
            current: {
                url: window.location.href,
                title: document.title,
                data: currentPageData
            }
        },
        compiledInfo: {
            programName: '',
            location: '',
            phones: new Set(),
            emails: new Set(),
            addresses: new Set(),
            agesServed: new Set(),
            levelOfCare: new Set(),
            specializations: new Set(),
            therapies: new Set(),
            staff: new Set(),
            accreditations: new Set(),
            insurance: new Set(),
            programHighlights: []
        }
    };
    
    // Find navigation links to related pages
    const navSelectors = [
        'nav a', 'header a', '.menu a', '.nav a', '[class*="menu"] a',
        'a[href*="about"]', 'a[href*="program"]', 'a[href*="contact"]',
        'a[href*="admission"]', 'a[href*="staff"]', 'a[href*="therapy"]',
        'a[href*="treatment"]', 'a[href*="approach"]', 'a[href*="services"]'
    ];
    
    const links = new Set();
    navSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(link => {
            const href = link.href;
            if (href && href.startsWith(baseUrl) && href !== window.location.href) {
                links.add(href);
            }
        });
    });
    
    // Keywords to identify relevant pages
    const relevantKeywords = [
        'about', 'program', 'contact', 'admission', 'staff', 'team',
        'therapy', 'treatment', 'approach', 'services', 'philosophy',
        'clinical', 'academic', 'residential', 'facility', 'campus'
    ];
    
    // Filter links to only relevant pages
    const relevantLinks = Array.from(links).filter(link => {
        const url = link.toLowerCase();
        return relevantKeywords.some(keyword => url.includes(keyword));
    }).slice(0, 10); // Limit to 10 pages to avoid overloading
    
    console.log(`Found ${relevantLinks.length} relevant pages to extract from`);
    
    // Function to extract data from a page via fetch
    async function extractFromUrl(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Extract key information from the parsed document
            const pageData = {
                url: url,
                title: doc.title,
                headings: [],
                paragraphs: [],
                listItems: []
            };
            
            // Extract headings
            doc.querySelectorAll('h1, h2, h3, h4').forEach(h => {
                const text = h.textContent.trim();
                if (text && text.length > 2 && isValidContent(text)) {
                    pageData.headings.push({
                        level: h.tagName,
                        text: text
                    });
                }
            });
            
            // Extract paragraphs
            doc.querySelectorAll('p').forEach(p => {
                const text = p.textContent.trim();
                if (text && text.length > 20 && text.length < 1000 && isValidContent(text)) {
                    pageData.paragraphs.push(text);
                }
            });
            
            // Extract list items
            doc.querySelectorAll('li').forEach(li => {
                const text = li.textContent.trim();
                if (text && text.length > 10 && text.length < 500 && isValidContent(text)) {
                    pageData.listItems.push(text);
                }
            });
            
            return pageData;
        } catch (error) {
            console.error(`Error extracting from ${url}:`, error);
            return null;
        }
    }
    
    // Extract from each relevant page
    for (const url of relevantLinks) {
        const pageData = await extractFromUrl(url);
        if (pageData) {
            const pageName = url.split('/').pop() || 'page';
            comprehensiveData.pages[pageName] = pageData;
            
            // Process and compile information
            processPageData(pageData, comprehensiveData.compiledInfo);
        }
    }
    
    // Process current page data as well
    processPageData(currentPageData, comprehensiveData.compiledInfo);
    
    // Compile final structured data
    comprehensiveData.structured = compileStructuredData(comprehensiveData.compiledInfo);
    
    return comprehensiveData;
}

// Process page data and extract key information
function processPageData(pageData, compiledInfo) {
    const allText = [
        ...pageData.headings.map(h => h.text),
        ...pageData.paragraphs,
        ...pageData.listItems
    ].join(' ');
    
    // Extract program name (usually in h1 or title)
    if (!compiledInfo.programName && pageData.headings.length > 0) {
        const potentialNames = pageData.headings
            .filter(h => h.level === 'H1')
            .map(h => h.text);
        if (potentialNames.length > 0) {
            compiledInfo.programName = potentialNames[0];
        }
    }
    
    // Extract ages served
    const agePatterns = [
        /(\d+)\s*[-–]\s*(\d+)\s*(?:years?|yrs?)(?:\s*old)?/gi,
        /ages?\s*(\d+)\s*(?:to|through|[-–])\s*(\d+)/gi,
        /(?:adolescents?|teens?|youth)\s*(?:ages?\s*)?(\d+)\s*[-–]\s*(\d+)/gi
    ];
    
    agePatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(allText)) !== null) {
            compiledInfo.agesServed.add(`${match[1]}-${match[2]}`);
        }
    });
    
    // Extract level of care
    const careTypes = {
        'residential': /\b(?:residential|24\/7|24-hour)\b/gi,
        'PHP': /\b(?:PHP|partial hospitalization)\b/gi,
        'IOP': /\b(?:IOP|intensive outpatient)\b/gi,
        'therapeutic boarding school': /\b(?:therapeutic boarding school|boarding)\b/gi,
        'wilderness': /\b(?:wilderness therapy|outdoor)\b/gi
    };
    
    Object.entries(careTypes).forEach(([type, pattern]) => {
        if (pattern.test(allText)) {
            compiledInfo.levelOfCare.add(type);
        }
    });
    
    // Extract therapies and modalities
    const therapyTypes = [
        'CBT', 'DBT', 'EMDR', 'ACT', 'NARM', 'IFS', 'Somatic Therapy',
        'Trauma-Focused', 'Equine Therapy', 'Art Therapy', 'Music Therapy',
        'Adventure Therapy', 'Wilderness Therapy', 'Family Therapy',
        'Group Therapy', 'Individual Therapy', 'Neurofeedback', 'QEEG'
    ];
    
    therapyTypes.forEach(therapy => {
        const regex = new RegExp(`\\b${therapy}\\b`, 'gi');
        if (regex.test(allText)) {
            compiledInfo.therapies.add(therapy);
        }
    });
    
    // Extract specializations
    const specializations = {
        'trauma': /\b(?:trauma|PTSD|traumatic)\b/gi,
        'anxiety': /\b(?:anxiety|anxious)\b/gi,
        'depression': /\b(?:depression|depressive)\b/gi,
        'ADHD': /\b(?:ADHD|ADD|attention)\b/gi,
        'autism/ASD': /\b(?:autism|ASD|spectrum)\b/gi,
        'substance abuse': /\b(?:substance|addiction|drug|alcohol)\b/gi,
        'eating disorders': /\b(?:eating disorder|anorexia|bulimia)\b/gi,
        'adoption/attachment': /\b(?:adoption|attachment|RAD)\b/gi,
        'LGBTQ+': /\b(?:LGBTQ|gender|transgender)\b/gi
    };
    
    Object.entries(specializations).forEach(([spec, pattern]) => {
        if (pattern.test(allText)) {
            compiledInfo.specializations.add(spec);
        }
    });
    
    // Extract contact information
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    
    let phoneMatch;
    while ((phoneMatch = phoneRegex.exec(allText)) !== null) {
        compiledInfo.phones.add(phoneMatch[0]);
    }
    
    let emailMatch;
    while ((emailMatch = emailRegex.exec(allText)) !== null) {
        if (!emailMatch[0].includes('.png') && !emailMatch[0].includes('.jpg')) {
            compiledInfo.emails.add(emailMatch[0]);
        }
    }
    
    // Extract location/address
    const statePattern = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s*([A-Z]{2})\s*\d{5}/g;
    let locationMatch;
    while ((locationMatch = statePattern.exec(allText)) !== null) {
        compiledInfo.addresses.add(`${locationMatch[1]}, ${locationMatch[2]}`);
    }
    
    // Extract accreditations
    const accreditations = ['JCAHO', 'Joint Commission', 'CARF', 'NATSAP', 'CEC'];
    accreditations.forEach(accred => {
        const regex = new RegExp(`\\b${accred}\\b`, 'gi');
        if (regex.test(allText)) {
            compiledInfo.accreditations.add(accred);
        }
    });
}

// Compile structured data from compiled info
function compileStructuredData(compiledInfo) {
    return {
        programName: compiledInfo.programName || 'Treatment Program',
        location: Array.from(compiledInfo.addresses)[0] || '',
        phones: Array.from(compiledInfo.phones),
        emails: Array.from(compiledInfo.emails),
        agesServed: Array.from(compiledInfo.agesServed).join(', '),
        levelOfCare: Array.from(compiledInfo.levelOfCare).join(', '),
        therapies: Array.from(compiledInfo.therapies).sort(),
        specializations: Array.from(compiledInfo.specializations),
        accreditations: Array.from(compiledInfo.accreditations),
        uniqueFeatures: identifyUniqueFeatures(compiledInfo)
    };
}

// Identify unique features that differentiate this program
function identifyUniqueFeatures(compiledInfo) {
    const features = [];
    
    // Check for unique therapy combinations
    const therapies = Array.from(compiledInfo.therapies);
    if (therapies.includes('Equine Therapy')) {
        features.push('Equine-assisted therapy program');
    }
    if (therapies.includes('Wilderness Therapy') || therapies.includes('Adventure Therapy')) {
        features.push('Wilderness/adventure-based treatment');
    }
    if (therapies.includes('NARM')) {
        features.push('NARM-certified for developmental trauma');
    }
    if (therapies.includes('Neurofeedback') || therapies.includes('QEEG')) {
        features.push('Brain-based neurofeedback therapy');
    }
    
    // Check for specialized populations
    const specializations = Array.from(compiledInfo.specializations);
    if (specializations.includes('autism/ASD')) {
        features.push('Specialized autism spectrum program');
    }
    if (specializations.includes('LGBTQ+')) {
        features.push('LGBTQ+ affirming environment');
    }
    if (specializations.includes('adoption/attachment')) {
        features.push('Adoption/attachment trauma specialty');
    }
    
    // Check for unique level of care combinations
    const levelOfCare = Array.from(compiledInfo.levelOfCare);
    if (levelOfCare.includes('wilderness')) {
        features.push('Wilderness therapy setting');
    }
    if (levelOfCare.includes('therapeutic boarding school')) {
        features.push('Therapeutic boarding school with academic program');
    }
    
    return features;
}

// Optional: Add a floating button to pages for quick extraction
function addExtractionButton() {
    const button = document.createElement('button');
    button.innerHTML = '📋';
    button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #0099cc;
        color: white;
        border: none;
        font-size: 20px;
        cursor: pointer;
        z-index: 99999;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: none;
    `;
    
    button.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openPopup' });
    });
    
    document.body.appendChild(button);
    
    // Show button on relevant pages
    const url = window.location.href.toLowerCase();
    const keywords = ['treatment', 'therapy', 'residential', 'program', 'adolescent', 'teen', 'youth'];
    
    if (keywords.some(keyword => url.includes(keyword) || document.body.textContent.toLowerCase().includes(keyword))) {
        button.style.display = 'block';
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addExtractionButton);
} else {
    addExtractionButton();
}