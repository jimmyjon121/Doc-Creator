// Content script that can interact with the page
// This runs in the context of web pages

console.log('Family First Program Extractor content script loaded');

// Add error boundary for the entire content script
try {
    // Test if we can access the page
    if (!document || !document.body) {
        throw new Error('Page not fully loaded');
    }
} catch (error) {
    console.error('Content script initialization error:', error);
}

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

// Helper function to send progress updates
function sendProgressUpdate(message, progress, details = {}) {
    try {
        chrome.runtime.sendMessage({
            action: 'extractionProgress',
            message: message,
            progress: progress,
            details: details
        });
    } catch (e) {
        // Popup might not be listening
        console.log('Progress update:', message, progress);
    }
}

// Listen for messages from the popup or background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request.action);
    
    if (request.action === 'ping') {
        sendResponse({ status: 'ok' });
        return true;
    }
    
    if (request.action === 'extractInfo') {
        // Extract information from the page with multi-page support
        extractComprehensiveInfo()
            .then(extractedData => {
                console.log('Extraction completed successfully');
                sendResponse({ data: extractedData });
            })
            .catch(error => {
                console.error('Extraction error:', error);
                sendResponse({ 
                    error: 'Extraction failed. Please reload the page and try again.',
                    details: error.message 
                });
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
    
    // Look for specific sections with comprehensive variations
    info.sections = {};
    const sectionKeywords = {
        about: ['about', 'who we are', 'mission', 'overview', 'our story', 'history', 
                'founded', 'established', 'vision', 'values', 'purpose'],
        services: ['services', 'programs', 'treatment', 'therapy', 'therapies', 
                  'what we offer', 'offerings', 'clinical services', 'therapeutic services',
                  'intervention', 'modalities', 'approaches we use'],
        approach: ['approach', 'philosophy', 'methodology', 'model', 'framework',
                  'treatment philosophy', 'clinical approach', 'therapeutic model',
                  'our method', 'how we help', 'treatment model'],
        admissions: ['admissions', 'contact', 'intake', 'enrollment', 'getting started',
                    'admission process', 'how to apply', 'referral', 'next steps',
                    'ready to begin', 'start your journey', 'enroll now'],
        ages: ['ages', 'age range', 'serve', 'population', 'who we serve', 
               'age groups', 'demographics', 'eligible', 'years old', 'adolescent',
               'teen', 'young adult', 'adult'],
        specialties: ['specialize', 'specialty', 'focus', 'expertise', 'areas of focus',
                     'clinical specialties', 'we treat', 'conditions', 'issues',
                     'specialization', 'expert in', 'experienced in'],
        insurance: ['insurance', 'payment', 'cost', 'tuition', 'financial', 'covered',
                   'accepted insurance', 'billing', 'fee', 'scholarship', 'financing',
                   'payment options', 'afford'],
        staff: ['staff', 'team', 'clinicians', 'therapists', 'counselors', 'leadership',
               'our people', 'meet the team', 'professionals', 'credentials', 'licensed',
               'faculty', 'clinical team'],
        outcomes: ['outcomes', 'results', 'success', 'testimonial', 'review', 'alumni',
                  'graduation', 'completion', 'effectiveness', 'evidence', 'research',
                  'satisfaction', 'feedback'],
        location: ['location', 'where', 'address', 'directions', 'campus', 'facility',
                  'find us', 'visit', 'situated', 'located', 'based in', 'headquarters']
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
    
    // Comprehensive therapy detection with variations
    const therapyPatterns = [
        // Evidence-based therapies with variations
        { pattern: /\b(DBT|Dialectical[\s-]?Behavior(al)?[\s-]?Therap(y|ies))\b/gi, name: 'DBT' },
        { pattern: /\b(CBT|Cognitive[\s-]?Behavior(al)?[\s-]?Therap(y|ies))\b/gi, name: 'CBT' },
        { pattern: /\b(EMDR|Eye[\s-]?Movement[\s-]?Desensitization)\b/gi, name: 'EMDR' },
        { pattern: /\b(ACT|Acceptance[\s-]?and[\s-]?Commitment[\s-]?Therap(y|ies))\b/gi, name: 'ACT' },
        { pattern: /\b(IFS|Internal[\s-]?Family[\s-]?Systems?)\b/gi, name: 'IFS' },
        { pattern: /\bSomatic[\s-]?(Experiencing|Therap(y|ies))\b/gi, name: 'Somatic Therapy' },
        { pattern: /\bBrainspotting\b/gi, name: 'Brainspotting' },
        { pattern: /\b(NARM|NeuroAffective[\s-]?Relational[\s-]?Model)\b/gi, name: 'NARM' },
        { pattern: /\bNeurofeedback\b/gi, name: 'Neurofeedback' },
        { pattern: /\b(TF[\s-]?CBT|Trauma[\s-]?Focused[\s-]?CBT)\b/gi, name: 'TF-CBT' },
        
        // Creative and experiential therapies
        { pattern: /\b(Art[\s-]?Therap(y|ies)|Expressive[\s-]?Arts?)\b/gi, name: 'Art Therapy' },
        { pattern: /\b(Music[\s-]?Therap(y|ies))\b/gi, name: 'Music Therapy' },
        { pattern: /\b(Dance[\s-]?Movement[\s-]?Therap(y|ies))\b/gi, name: 'Dance/Movement Therapy' },
        { pattern: /\b(Drama[\s-]?Therap(y|ies)|Psychodrama)\b/gi, name: 'Drama Therapy' },
        { pattern: /\b(Equine[\s-]?(Assisted|Therap(y|ies))|Horse[\s-]?Therap(y|ies))\b/gi, name: 'Equine Therapy' },
        { pattern: /\b(Animal[\s-]?Assisted[\s-]?Therap(y|ies))\b/gi, name: 'Animal-Assisted Therapy' },
        { pattern: /\b(Adventure[\s-]?Therap(y|ies)|Wilderness[\s-]?Therap(y|ies))\b/gi, name: 'Adventure/Wilderness Therapy' },
        { pattern: /\b(Recreation(al)?[\s-]?Therap(y|ies))\b/gi, name: 'Recreational Therapy' },
        { pattern: /\b(Experiential[\s-]?Therap(y|ies))\b/gi, name: 'Experiential Therapy' },
        
        // Trauma-specific
        { pattern: /\b(Trauma[\s-]?(Informed|Based|Focused)[\s-]?(Care|Treatment|Therap(y|ies)))\b/gi, name: 'Trauma-Informed Care' },
        { pattern: /\b(CPT|Cognitive[\s-]?Processing[\s-]?Therap(y|ies))\b/gi, name: 'CPT' },
        { pattern: /\b(PE|Prolonged[\s-]?Exposure)\b/gi, name: 'Prolonged Exposure' },
        
        // Group and family
        { pattern: /\b(Group[\s-]?(Therap(y|ies)|Counseling))\b/gi, name: 'Group Therapy' },
        { pattern: /\b(Family[\s-]?(Therap(y|ies)|Counseling|Systems?))\b/gi, name: 'Family Therapy' },
        { pattern: /\b(Multi[\s-]?family[\s-]?Therap(y|ies))\b/gi, name: 'Multi-Family Therapy' },
        { pattern: /\b(Individual[\s-]?(Therap(y|ies)|Counseling))\b/gi, name: 'Individual Therapy' },
        
        // Mindfulness and meditation
        { pattern: /\b(Mindfulness[\s-]?(Based|Therap(y|ies)))\b/gi, name: 'Mindfulness-Based Therapy' },
        { pattern: /\b(MBSR|Mindfulness[\s-]?Based[\s-]?Stress[\s-]?Reduction)\b/gi, name: 'MBSR' },
        { pattern: /\b(Meditation|Yoga[\s-]?Therap(y|ies))\b/gi, name: 'Meditation/Yoga' },
        
        // Behavioral
        { pattern: /\b(ABA|Applied[\s-]?Behavior(al)?[\s-]?Analysis)\b/gi, name: 'ABA' },
        { pattern: /\b(Behavior(al)?[\s-]?Modification)\b/gi, name: 'Behavioral Modification' }
    ];
    
    const detectedTherapies = new Set();
    therapyPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(allText)) {
            detectedTherapies.add(name);
        }
    });
    info.therapies = Array.from(detectedTherapies);
    
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
    try {
        sendProgressUpdate('🚀 Starting comprehensive extraction...', 0);
        
        if (!document.body || document.readyState === 'loading') {
            sendProgressUpdate('⏳ Waiting for page to load...', 0);
            await new Promise(resolve => {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', resolve, { once: true });
                } else {
                    resolve();
                }
            });
        }
        
        sendProgressUpdate('📄 Analyzing current page...', 5);
        const currentPageData = extractPageInfo();
        const baseUrl = window.location.origin;
        
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
        
        sendProgressUpdate(`✅ Extracted info from: ${document.title}`, 10);
        
        const relevantLinks = collectRelevantLinks(baseUrl);
        const uniqueLinks = [...new Set(relevantLinks)]
            .filter(link => typeof link === 'string' && link.startsWith(baseUrl) && link !== window.location.href)
            .slice(0, 20);
        
        if (uniqueLinks.length === 0) {
            sendProgressUpdate('ℹ️ No additional pages detected. Focusing on current page.', 30);
        }
        
        sendProgressUpdate(`🛰️ Requesting ${uniqueLinks.length} additional pages from background...`, 20);
        const fetchedPages = uniqueLinks.length > 0
            ? await requestAdditionalPages(uniqueLinks)
            : { pages: [] };
        
        let processedCount = 0;
        const totalFetched = fetchedPages.pages.length;
        
        for (const page of fetchedPages.pages) {
            processedCount++;
            const progressPercent = 30 + Math.round((processedCount / Math.max(1, totalFetched)) * 50);
            const pageName = derivePageKey(page.url, processedCount);
            
            sendProgressUpdate(
                `🧭 Parsing page ${processedCount}/${totalFetched}: ${pageName}`,
                progressPercent,
                {
                    current: processedCount,
                    total: totalFetched,
                    url: page.url,
                    pageName
                }
            );
            
            const pageData = extractPageDataFromHtml(page.html, page.url);
            if (!pageData) {
                sendProgressUpdate(`⚠️ Unable to parse ${pageName}`, progressPercent);
                continue;
            }
            
            comprehensiveData.pages[pageName] = pageData;
            processPageData(pageData, comprehensiveData.compiledInfo);
        }
        
        sendProgressUpdate('📋 Processing current page data...', 85);
        processPageData(currentPageData, comprehensiveData.compiledInfo);
        
        sendProgressUpdate('🎯 Compiling all extracted information...', 95);
        comprehensiveData.structured = compileStructuredData(comprehensiveData.compiledInfo);
        
        const stats = {
            pagesAnalyzed: Object.keys(comprehensiveData.pages).length,
            therapiesFound: comprehensiveData.compiledInfo.therapies.size,
            specializationsFound: comprehensiveData.compiledInfo.specializations.size,
            contactsFound: comprehensiveData.compiledInfo.phones.size + comprehensiveData.compiledInfo.emails.size
        };
        
        sendProgressUpdate(
            `✅ Extraction complete! Analyzed ${stats.pagesAnalyzed} pages`,
            100,
            stats
        );
        
        return comprehensiveData;
    } catch (error) {
        console.error('Extraction error:', error);
        return {
            error: true,
            message: error.message,
            basicInfo: extractPageInfo()
        };
    }
}

function collectRelevantLinks(baseUrl) {
    const navSelectors = [
        'nav a', 'header a', '.menu a', '.nav a', '[class*="menu"] a',
        '.navigation a', '.navbar a', '.header-nav a', '.main-nav a',
        '.site-nav a', '.primary-nav a', '.secondary-nav a',
        'a[href*="about"]', 'a[href*="who-we-are"]', 'a[href*="mission"]',
        'a[href*="program"]', 'a[href*="treatment"]', 'a[href*="service"]',
        'a[href*="therapy"]', 'a[href*="therapies"]', 'a[href*="approach"]',
        'a[href*="contact"]', 'a[href*="location"]', 'a[href*="visit"]',
        'a[href*="admission"]', 'a[href*="enroll"]', 'a[href*="apply"]',
        'a[href*="staff"]', 'a[href*="team"]', 'a[href*="leadership"]',
        'a[href*="clinical"]', 'a[href*="therapeutic"]', 'a[href*="counselor"]',
        'a[href*="facility"]', 'a[href*="campus"]', 'a[href*="residential"]',
        'a[href*="parent"]', 'a[href*="family"]', 'a[href*="faq"]',
        'a[href*="insurance"]', 'a[href*="cost"]', 'a[href*="tuition"]',
        'a[href*="testimonial"]', 'a[href*="review"]', 'a[href*="outcome"]',
        'a[href*="daily"]', 'a[href*="typical-day"]', 'a[href*="activities"]',
        'footer a', '.footer a', '[class*="footer"] a',
        '.sidebar a', '[class*="sidebar"] a', 'aside a',
        '.links a', '.quick-links a', '.site-links a',
        'ul a', 'li a', '.list a'
    ];
    
    const discoveredLinks = new Set();
    navSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(link => {
            const href = link.href;
            if (href && href.startsWith(baseUrl)) {
                discoveredLinks.add(href.split('#')[0]);
            }
        });
    });
    
    const commonPaths = ['/about', '/programs', '/contact', '/admissions', '/staff', '/approach'];
    commonPaths.forEach(path => discoveredLinks.add(baseUrl + path));
    
    const relevantKeywords = [
        'about', 'about-us', 'who-we-are', 'mission', 'story', 'history', 'overview',
        'program', 'programmes', 'treatment', 'services', 'therapy', 'therapies',
        'approach', 'methodology', 'model', 'curriculum', 'academics',
        'contact', 'contact-us', 'reach', 'location', 'directions', 'visit',
        'admission', 'admissions', 'enroll', 'enrollment', 'apply', 'application',
        'intake', 'getting-started', 'start', 'begin',
        'staff', 'team', 'our-team', 'leadership', 'therapists', 'counselors',
        'professionals', 'faculty', 'clinicians',
        'clinical', 'therapeutic', 'mental-health', 'behavioral', 'wellness',
        'facility', 'facilities', 'campus', 'residential', 'housing', 'dorms',
        'environment', 'setting', 'amenities',
        'philosophy', 'values', 'faq', 'parent', 'family', 'outcomes', 'success',
        'testimonial', 'review', 'accreditation', 'insurance', 'cost', 'tuition',
        'daily-life', 'typical-day', 'activities', 'recreation', 'discharge',
        'aftercare', 'transition', 'alumni'
    ];
    
    const scoredLinks = Array.from(discoveredLinks).map(link => {
        const lowerUrl = link.toLowerCase();
        let score = 0;
        relevantKeywords.forEach(keyword => {
            if (lowerUrl.includes(keyword)) {
                score += Math.max(3, keyword.length);
            }
        });
        if (lowerUrl.includes('program') || lowerUrl.includes('treatment')) score += 12;
        if (lowerUrl.includes('about')) score += 8;
        if (lowerUrl.includes('contact')) score += 5;
        if (lowerUrl.includes('admission')) score += 7;
        if (lowerUrl.includes('staff') || lowerUrl.includes('team')) score += 6;
        return { url: link, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.url);
    
    return scoredLinks.length > 0 ? scoredLinks : Array.from(discoveredLinks);
}

function requestAdditionalPages(links) {
    return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
            reject(new Error('Background fetch timed out.'));
        }, 20000);

        chrome.runtime.sendMessage({ action: 'fetchRelatedPages', links }, response => {
            clearTimeout(timeout);
            if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
                return;
            }
            if (!response) {
                reject(new Error('No response from background fetch.'));
                return;
            }
            if (response.error) {
                reject(new Error(response.error));
                return;
            }
            resolve(response);
        });
    });
}

function extractPageDataFromHtml(html, url) {
    if (!html) return null;
    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        if (!doc) return null;
        
        const pageData = {
            url,
            title: (doc.title || '').trim(),
            headings: [],
            paragraphs: [],
            listItems: [],
            phones: [],
            emails: [],
            addresses: []
        };
        
        doc.querySelectorAll('h1, h2, h3, h4').forEach(h => {
            const text = h.textContent.trim();
            if (text && text.length > 2 && isValidContent(text)) {
                pageData.headings.push({ level: h.tagName, text });
            }
        });
        
        doc.querySelectorAll('p').forEach(p => {
            const text = p.textContent.trim();
            if (text && text.length > 20 && text.length < 1200 && isValidContent(text)) {
                pageData.paragraphs.push(text);
            }
        });
        
        doc.querySelectorAll('li').forEach(li => {
            const text = li.textContent.trim();
            if (text && text.length > 10 && text.length < 500 && isValidContent(text)) {
                pageData.listItems.push(text);
            }
        });
        
        const bodyText = doc.body ? doc.body.textContent || '' : '';
        const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const phones = bodyText.match(phoneRegex) || [];
        const emails = bodyText.match(emailRegex) || [];
        pageData.phones = [...new Set(phones)].slice(0, 5);
        pageData.emails = [...new Set(emails)].slice(0, 5);
        
        doc.querySelectorAll('address, .address, [class*="address"], [id*="address"]').forEach(addr => {
            const text = addr.textContent.trim();
            if (text && text.length > 10) {
                pageData.addresses.push(text);
            }
        });
        
        return pageData;
    } catch (error) {
        console.error('Failed to parse fetched HTML:', error);
        return null;
    }
}

function derivePageKey(url, index) {
    try {
        const urlObj = new URL(url);
        const segments = urlObj.pathname.split('/').filter(Boolean);
        const lastSegment = segments.length > 0 ? segments[segments.length - 1] : 'page';
        return `${lastSegment || 'page'}-${index}`.replace(/[^a-z0-9-]/gi, '-').toLowerCase();
    } catch (e) {
        return `page-${index}`;
    }
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
    
    // Extract therapies and modalities with comprehensive patterns
    const therapyPatterns = [
        // Core evidence-based therapies
        { pattern: /\b(?:CBT|Cognitive[\s-]?Behavioral?[\s-]?Therap(?:y|ies))\b/gi, name: 'CBT' },
        { pattern: /\b(?:DBT|Dialectical[\s-]?Behavior(?:al)?[\s-]?Therap(?:y|ies))\b/gi, name: 'DBT' },
        { pattern: /\b(?:EMDR|Eye[\s-]?Movement[\s-]?Desensitization(?:[\s-]?and[\s-]?Reprocessing)?)\b/gi, name: 'EMDR' },
        { pattern: /\b(?:ACT|Acceptance[\s-]?and[\s-]?Commitment[\s-]?Therap(?:y|ies))\b/gi, name: 'ACT' },
        { pattern: /\b(?:IFS|Internal[\s-]?Family[\s-]?Systems?)\b/gi, name: 'IFS' },
        { pattern: /\b(?:NARM|NeuroAffective[\s-]?Relational[\s-]?Model)\b/gi, name: 'NARM' },
        { pattern: /\bSomatic[\s-]?(?:Experiencing|Therap(?:y|ies)|Approach)\b/gi, name: 'Somatic Therapy' },
        
        // Trauma therapies
        { pattern: /\b(?:TF[\s-]?CBT|Trauma[\s-]?Focused[\s-]?CBT|Trauma[\s-]?Focused[\s-]?Cognitive[\s-]?Behavioral)\b/gi, name: 'TF-CBT' },
        { pattern: /\b(?:CPT|Cognitive[\s-]?Processing[\s-]?Therap(?:y|ies))\b/gi, name: 'CPT' },
        { pattern: /\bTrauma[\s-]?(?:Informed|Based|Focused|Sensitive)[\s-]?(?:Care|Treatment|Approach|Therap(?:y|ies))\b/gi, name: 'Trauma-Informed Care' },
        
        // Experiential therapies
        { pattern: /\b(?:Equine|Horse)[\s-]?(?:Assisted|Facilitated)?[\s-]?(?:Therap(?:y|ies)|Psychotherapy|Learning)\b/gi, name: 'Equine Therapy' },
        { pattern: /\b(?:Art|Creative[\s-]?Arts?|Expressive[\s-]?Arts?)[\s-]?Therap(?:y|ies)\b/gi, name: 'Art Therapy' },
        { pattern: /\bMusic[\s-]?Therap(?:y|ies)\b/gi, name: 'Music Therapy' },
        { pattern: /\b(?:Adventure|Wilderness|Outdoor)[\s-]?(?:Based)?[\s-]?Therap(?:y|ies)\b/gi, name: 'Adventure/Wilderness Therapy' },
        { pattern: /\b(?:Recreation(?:al)?|Therapeutic[\s-]?Recreation)[\s-]?Therap(?:y|ies)\b/gi, name: 'Recreational Therapy' },
        { pattern: /\b(?:Drama|Theater|Psychodrama)[\s-]?Therap(?:y|ies)\b/gi, name: 'Drama Therapy' },
        { pattern: /\b(?:Dance|Movement)[\s-]?Therap(?:y|ies)\b/gi, name: 'Dance/Movement Therapy' },
        
        // Neurofeedback and brain-based
        { pattern: /\b(?:Neurofeedback|Neurotherapy|EEG[\s-]?Biofeedback)\b/gi, name: 'Neurofeedback' },
        { pattern: /\b(?:QEEG|Quantitative[\s-]?EEG|Brain[\s-]?Mapping)\b/gi, name: 'QEEG/Brain Mapping' },
        { pattern: /\bBrainspotting\b/gi, name: 'Brainspotting' },
        
        // Group and family
        { pattern: /\b(?:Group|Peer[\s-]?Group)[\s-]?(?:Therap(?:y|ies)|Counseling|Sessions?)\b/gi, name: 'Group Therapy' },
        { pattern: /\b(?:Family|Systemic[\s-]?Family|Structural[\s-]?Family)[\s-]?(?:Therap(?:y|ies)|Counseling)\b/gi, name: 'Family Therapy' },
        { pattern: /\b(?:Individual|One[\s-]?on[\s-]?One|1[\s-]?on[\s-]?1)[\s-]?(?:Therap(?:y|ies)|Counseling|Sessions?)\b/gi, name: 'Individual Therapy' },
        
        // Other modalities
        { pattern: /\b(?:Mindfulness|MBSR|Meditation|Yoga)[\s-]?(?:Based)?[\s-]?(?:Therap(?:y|ies)|Practice|Training)\b/gi, name: 'Mindfulness/Meditation' },
        { pattern: /\b(?:MI|Motivational[\s-]?Interviewing)\b/gi, name: 'Motivational Interviewing' },
        { pattern: /\b(?:Solution[\s-]?Focused|SFBT)[\s-]?(?:Brief)?[\s-]?Therap(?:y|ies)\b/gi, name: 'Solution-Focused Therapy' },
        { pattern: /\b(?:Narrative)[\s-]?Therap(?:y|ies)\b/gi, name: 'Narrative Therapy' }
    ];
    
    therapyPatterns.forEach(({ pattern, name }) => {
        if (pattern.test(allText)) {
            compiledInfo.therapies.add(name);
        }
    });
    
    // Extract specializations with comprehensive variations
    const specializations = {
        'trauma': /\b(?:trauma(?:tic)?|PTSD|post[\s-]?traumatic|complex[\s-]?trauma|C[\s-]?PTSD|developmental[\s-]?trauma)\b/gi,
        'anxiety': /\b(?:anxiety|anxious|panic|phobia|OCD|obsessive[\s-]?compulsive|social[\s-]?anxiety|generalized[\s-]?anxiety|GAD)\b/gi,
        'depression': /\b(?:depression|depressive|mood[\s-]?disorder|bipolar|dysthymia|major[\s-]?depressive)\b/gi,
        'ADHD': /\b(?:ADHD|ADD|attention[\s-]?deficit|hyperactivity|executive[\s-]?function(?:ing)?)\b/gi,
        'autism/ASD': /\b(?:autism|ASD|spectrum|asperger|neurodivers(?:e|ity)|on[\s-]?the[\s-]?spectrum)\b/gi,
        'substance abuse': /\b(?:substance[\s-]?(?:use|abuse)|addiction|drug|alcohol|chemical[\s-]?dependency|dual[\s-]?diagnosis|recovery)\b/gi,
        'eating disorders': /\b(?:eating[\s-]?disorder|anorexia|bulimia|binge[\s-]?eating|ARFID|body[\s-]?image|disordered[\s-]?eating)\b/gi,
        'adoption/attachment': /\b(?:adoption|adoptive|attachment|RAD|reactive[\s-]?attachment|bonding|foster[\s-]?care)\b/gi,
        'LGBTQ+': /\b(?:LGBTQ(?:\+)?|lesbian|gay|bisexual|transgender|trans|gender[\s-]?(?:identity|dysphoria|affirming)|queer|non[\s-]?binary|pronouns)\b/gi,
        'self-harm': /\b(?:self[\s-]?harm|self[\s-]?injury|cutting|SI|NSSI|suicidal|suicide)\b/gi,
        'behavioral issues': /\b(?:behavioral|behavior[\s-]?(?:issues|problems)|oppositional|defiant|ODD|conduct[\s-]?disorder|anger)\b/gi,
        'learning differences': /\b(?:learning[\s-]?(?:difference|disability|disorder)|dyslexia|dysgraphia|dyscalculia|processing)\b/gi,
        'technology/gaming': /\b(?:technology[\s-]?addiction|gaming[\s-]?(?:addiction|disorder)|screen[\s-]?time|internet[\s-]?addiction|digital[\s-]?dependency)\b/gi,
        'family conflict': /\b(?:family[\s-]?(?:conflict|issues|dynamics|therapy)|parent[\s-]?child|relationship[\s-]?issues)\b/gi
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