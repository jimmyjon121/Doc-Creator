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
        // Extract information from the page
        const extractedData = extractPageInfo();
        sendResponse({ data: extractedData });
        return true; // Keep message channel open for async response
    }
});

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