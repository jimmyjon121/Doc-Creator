// Improved extraction logic for v1.4.0
// Handles sites like Voyage Recovery that have clear info in different formats

function improvedExtractProgramInfo() {
    const extractedData = {
        programName: '',
        location: '',
        phone: '',
        email: '',
        website: window.location.href,
        population: '',
        levelOfCare: '',
        description: '',
        therapies: [],
        specializations: [],
        features: [],
        accreditations: []
    };
    
    // Get all text content for analysis
    const allText = document.body.innerText || document.body.textContent || '';
    
    // ===== EXTRACT PROGRAM NAME =====
    // Strategy 1: Look for logo text, brand names, or site name
    const possibleNames = [];
    
    // Check meta tags first
    const metaTags = {
        ogSiteName: document.querySelector('meta[property="og:site_name"]')?.content,
        ogTitle: document.querySelector('meta[property="og:title"]')?.content,
        applicationName: document.querySelector('meta[name="application-name"]')?.content
    };
    
    Object.values(metaTags).forEach(name => {
        if (name && name.length > 2 && name.length < 50) {
            possibleNames.push(name);
        }
    });
    
    // Look for logo alt text or aria-labels
    document.querySelectorAll('img[alt*="logo"], img[alt*="Logo"], [aria-label*="logo"]').forEach(el => {
        const text = el.alt || el.getAttribute('aria-label');
        if (text && text.length > 2 && text.length < 50) {
            // Clean up "logo" from the text
            const cleanName = text.replace(/logo/gi, '').trim();
            if (cleanName) possibleNames.push(cleanName);
        }
    });
    
    // Look for brand/facility name patterns in headings
    document.querySelectorAll('h1, h2, h3, .logo, .brand, .site-name, .company-name').forEach(el => {
        const text = el.textContent.trim();
        // Check if it looks like a facility name (contains Recovery, Treatment, Center, etc.)
        if (text && text.length > 2 && text.length < 50) {
            const facilityKeywords = /recovery|treatment|center|services|healthcare|academy|behavioral|therapeutic|residential|voyage|serenity|hope|wellness|healing/i;
            if (facilityKeywords.test(text) && !text.toLowerCase().includes('welcome')) {
                possibleNames.push(text);
            }
        }
    });
    
    // For Voyage Recovery specifically - check domain name
    const domain = window.location.hostname.replace('www.', '');
    if (domain.includes('voyage') || domain.includes('recovery')) {
        const domainWords = domain.split('.')[0].split(/[-_]/);
        const formatted = domainWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        possibleNames.push(formatted);
    }
    
    // Pick the best name (prefer shorter, cleaner names)
    if (possibleNames.length > 0) {
        // Sort by frequency and length
        const nameCount = {};
        possibleNames.forEach(name => {
            const clean = name.trim();
            nameCount[clean] = (nameCount[clean] || 0) + 1;
        });
        
        const sortedNames = Object.entries(nameCount)
            .sort((a, b) => b[1] - a[1] || a[0].length - b[0].length);
        
        extractedData.programName = sortedNames[0][0];
    }
    
    // ===== EXTRACT LOCATION =====
    // Look for address patterns
    const addressPatterns = [
        // Full address with state
        /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Parkway|Pkwy)[\s,]+[\w\s]+,?\s+([A-Z]{2})\s+\d{5}/gi,
        // City, State pattern
        /(?:located in|serving|in)\s+([\w\s]+),?\s+([A-Z]{2}|Florida|California|Texas|Arizona)/gi,
        // Just city and state
        /([\w\s]+),\s*(FL|CA|TX|AZ|Florida|California|Texas|Arizona)/gi
    ];
    
    let foundAddress = '';
    for (const pattern of addressPatterns) {
        const matches = allText.match(pattern);
        if (matches && matches.length > 0) {
            foundAddress = matches[0];
            break;
        }
    }
    
    // Also check specific address elements
    const addressElements = document.querySelectorAll('address, .address, [class*="address"], [itemtype*="PostalAddress"]');
    addressElements.forEach(el => {
        const text = el.textContent.trim();
        if (text && text.length > 10) {
            foundAddress = text;
        }
    });
    
    // Special case for Florida locations (common in treatment centers)
    if (!foundAddress && allText.includes('Florida')) {
        const floridaPattern = /([\w\s]+),?\s+(?:FL|Florida)/gi;
        const match = floridaPattern.exec(allText);
        if (match) {
            foundAddress = match[0];
        }
    }
    
    extractedData.location = foundAddress;
    
    // ===== EXTRACT PHONE =====
    // More comprehensive phone patterns
    const phonePatterns = [
        /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g,  // Standard US format
        /\d{3}\.\d{3}\.\d{4}/g,  // Dot format
        /\d{3}-\d{3}-\d{4}/g,  // Dash format
        /1[\s.-]?\d{3}[\s.-]?\d{3}[\s.-]?\d{4}/g  // With country code
    ];
    
    const phones = new Set();
    phonePatterns.forEach(pattern => {
        const matches = allText.match(pattern) || [];
        matches.forEach(phone => {
            // Clean and validate
            const digits = phone.replace(/\D/g, '');
            if (digits.length === 10 || digits.length === 11) {
                phones.add(phone);
            }
        });
    });
    
    // Prefer phone numbers near words like "call", "phone", "admission", "contact"
    const phoneContext = /(?:call|phone|admission|contact|tel)[\s:]*(\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4})/gi;
    const contextMatch = phoneContext.exec(allText);
    if (contextMatch && contextMatch[1]) {
        extractedData.phone = contextMatch[1];
    } else if (phones.size > 0) {
        extractedData.phone = Array.from(phones)[0];
    }
    
    // ===== EXTRACT EMAIL =====
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = allText.match(emailPattern) || [];
    const validEmails = emails.filter(e => 
        !e.includes('.png') && 
        !e.includes('.jpg') && 
        !e.includes('@example') &&
        e.includes('.')
    );
    
    // Prefer admission@ or info@ emails
    const preferredEmail = validEmails.find(e => 
        e.includes('admission') || 
        e.includes('info') || 
        e.includes('contact')
    );
    
    extractedData.email = preferredEmail || validEmails[0] || '';
    
    // ===== EXTRACT POPULATION SERVED =====
    const populationPatterns = [
        /(?:for|serving|treat|help)\s+(young\s+(?:adult\s+)?men|adolescents?|teens?|boys|girls|males|females|women|adults)/gi,
        /(?:ages?|aged)\s+(\d+[\s-]+(?:to|through)?\s*\d+)/gi,
        /(young\s+adults?|adolescents?|teens?)\s+(?:ages?\s+)?(\d+[\s-]+(?:to|through)?\s*\d+)/gi
    ];
    
    populationPatterns.forEach(pattern => {
        const matches = allText.match(pattern);
        if (matches && matches.length > 0) {
            extractedData.population = matches[0];
        }
    });
    
    // ===== EXTRACT LEVEL OF CARE =====
    const carePatterns = [
        /residential\s+treatment/gi,
        /intensive\s+outpatient|IOP/gi,
        /partial\s+hospitalization|PHP/gi,
        /outpatient\s+(?:treatment|program)/gi,
        /day\s+treatment/gi,
        /sober\s+living/gi,
        /detox|detoxification/gi,
        /rehabilitation\s+center/gi,
        /drug\s+and\s+alcohol\s+(?:rehabilitation|treatment)/gi
    ];
    
    const foundCare = [];
    carePatterns.forEach(pattern => {
        if (pattern.test(allText)) {
            foundCare.push(pattern.source.replace(/\\s\+/g, ' ').replace(/[|()]/g, ''));
        }
    });
    
    extractedData.levelOfCare = foundCare.join(', ');
    
    // ===== EXTRACT KEY FEATURES =====
    // Look for unique program features
    const featurePatterns = [
        /(\d+)\s+(?:full-time|licensed)\s+therapists?/gi,
        /small\s+group\s+(?:of\s+)?(?:patients?|clients?|residents?)/gi,
        /(?:week-long|intensive)\s+family\s+program/gi,
        /evidence-based\s+(?:treatment|modalities|therapies)/gi,
        /(?:innovative|unique)\s+experiential\s+(?:programming|therapy)/gi,
        /24\/7\s+(?:support|care|supervision)/gi,
        /(?:beautiful|scenic|waterfront|beachfront)\s+(?:location|facility|campus)/gi
    ];
    
    featurePatterns.forEach(pattern => {
        const matches = allText.match(pattern);
        if (matches) {
            matches.forEach(match => {
                extractedData.features.push(match.trim());
            });
        }
    });
    
    // ===== EXTRACT THERAPIES =====
    const therapyKeywords = [
        'CBT', 'DBT', 'EMDR', 'ACT', 
        'Cognitive Behavioral', 'Dialectical Behavior',
        'Individual therapy', 'Group therapy', 'Family therapy',
        'Art therapy', 'Music therapy', 'Equine therapy',
        'Experiential therapy', 'Adventure therapy',
        'Trauma-informed', 'Trauma-focused'
    ];
    
    therapyKeywords.forEach(therapy => {
        const pattern = new RegExp(therapy, 'gi');
        if (pattern.test(allText)) {
            extractedData.therapies.push(therapy);
        }
    });
    
    // ===== EXTRACT ACCREDITATIONS =====
    const accreditationPatterns = [
        /Joint\s+Commission/gi,
        /JCAHO/gi,
        /CARF/gi,
        /NATSAP/gi,
        /(?:licensed\s+by|accredited\s+by)\s+([A-Z][A-Za-z\s]+)/gi,
        /(?:member\s+of)\s+([A-Z][A-Za-z\s]+(?:Association|Organization|Council))/gi
    ];
    
    accreditationPatterns.forEach(pattern => {
        const matches = allText.match(pattern);
        if (matches) {
            matches.forEach(match => {
                extractedData.accreditations.push(match.trim());
            });
        }
    });
    
    // ===== CLEAN UP RESULTS =====
    // Remove duplicates and empty values
    Object.keys(extractedData).forEach(key => {
        if (Array.isArray(extractedData[key])) {
            extractedData[key] = [...new Set(extractedData[key])].filter(Boolean);
        } else if (typeof extractedData[key] === 'string') {
            extractedData[key] = extractedData[key].trim();
        }
    });
    
    // ===== GENERATE DESCRIPTION =====
    if (!extractedData.description) {
        const parts = [];
        if (extractedData.programName) {
            parts.push(extractedData.programName);
        }
        if (extractedData.levelOfCare) {
            parts.push(`provides ${extractedData.levelOfCare}`);
        }
        if (extractedData.population) {
            parts.push(`for ${extractedData.population}`);
        }
        if (extractedData.location) {
            parts.push(`in ${extractedData.location}`);
        }
        
        extractedData.description = parts.join(' ');
    }
    
    return extractedData;
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = improvedExtractProgramInfo;
}



