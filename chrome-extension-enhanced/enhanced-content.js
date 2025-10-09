// Enhanced content script with structured data detection
// Add this to your content.js or create as a separate module

// Structured data extraction functions
function extractStructuredData() {
    const structured = {
        jsonLd: null,
        microdata: null,
        openGraph: null,
        found: false
    };
    
    // 1. Extract JSON-LD structured data
    try {
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        jsonLdScripts.forEach(script => {
            const data = JSON.parse(script.textContent);
            
            // Check for relevant types
            const relevantTypes = ['MedicalBusiness', 'Hospital', 'HealthAndBeautyBusiness', 
                                 'MedicalOrganization', 'Organization', 'LocalBusiness'];
            
            if (relevantTypes.some(type => data['@type'] === type || 
                (Array.isArray(data['@type']) && data['@type'].includes(type)))) {
                
                structured.jsonLd = {
                    name: data.name,
                    description: data.description,
                    telephone: data.telephone,
                    email: data.email,
                    address: formatAddress(data.address),
                    url: data.url,
                    medicalSpecialty: data.medicalSpecialty,
                    openingHours: data.openingHours
                };
                structured.found = true;
            }
        });
    } catch (e) {
        console.log('Error parsing JSON-LD:', e);
    }
    
    // 2. Extract Schema.org Microdata
    const org = document.querySelector('[itemtype*="schema.org/Organization"], [itemtype*="MedicalOrganization"]');
    if (org) {
        structured.microdata = {
            name: org.querySelector('[itemprop="name"]')?.textContent?.trim(),
            telephone: org.querySelector('[itemprop="telephone"]')?.textContent?.trim(),
            email: org.querySelector('[itemprop="email"]')?.textContent?.trim(),
            address: org.querySelector('[itemprop="address"]')?.textContent?.trim(),
            description: org.querySelector('[itemprop="description"]')?.textContent?.trim()
        };
        structured.found = true;
    }
    
    // 3. Extract Open Graph data
    const ogData = {};
    document.querySelectorAll('meta[property^="og:"]').forEach(meta => {
        const property = meta.getAttribute('property').replace('og:', '');
        ogData[property] = meta.getAttribute('content');
    });
    
    if (Object.keys(ogData).length > 0) {
        structured.openGraph = ogData;
        structured.found = true;
    }
    
    return structured;
}

// Format address from structured data
function formatAddress(address) {
    if (!address) return null;
    
    if (typeof address === 'string') {
        return address;
    }
    
    // Handle PostalAddress type
    if (address['@type'] === 'PostalAddress') {
        const parts = [];
        if (address.streetAddress) parts.push(address.streetAddress);
        if (address.addressLocality) parts.push(address.addressLocality);
        if (address.addressRegion) parts.push(address.addressRegion);
        if (address.postalCode) parts.push(address.postalCode);
        if (address.addressCountry) parts.push(address.addressCountry);
        
        return parts.join(', ');
    }
    
    return JSON.stringify(address);
}

// Site-specific template extractors
const SITE_TEMPLATES = {
    'psychologytoday.com': {
        name: 'h1.profile-title',
        phone: '.profile-phone a',
        email: '.profile-email a',
        specialties: '.specialties-section .spec-list li',
        insurances: '.attributes-insurance .col-split-2 li',
        issues: '.attributes-issues .col-split-2 li',
        modalities: '.attributes-modalities .col-split-2 li',
        ageGroups: '.attributes-age .col-split-2 li'
    },
    
    'findtreatment.gov': {
        name: 'h1.facility-name',
        phone: '.contact-phone',
        address: '.facility-address',
        services: '.services-list li',
        acceptedPayment: '.payment-types li'
    },
    
    'samhsa.gov': {
        name: '.facility-name',
        phone: '.phone-number',
        services: '.service-item',
        languages: '.language-item'
    }
};

// Apply site-specific template if available
function applySiteTemplate(domain) {
    const template = Object.entries(SITE_TEMPLATES).find(([site, _]) => 
        domain.includes(site)
    );
    
    if (!template) return null;
    
    const [siteName, selectors] = template;
    const extracted = { site: siteName };
    
    Object.entries(selectors).forEach(([field, selector]) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
            extracted[field] = elements.length === 1 
                ? elements[0].textContent.trim()
                : Array.from(elements).map(el => el.textContent.trim());
        }
    });
    
    return extracted;
}

// Quality scoring for extracted data
function scoreExtractedData(data) {
    const scoring = {
        score: 0,
        maxScore: 100,
        details: [],
        quality: 'Low',
        missingCritical: [],
        suggestions: []
    };
    
    // Critical fields (60 points)
    const criticalFields = {
        'name': 15,
        'phone': 15,
        'address': 15,
        'services/modalities': 15
    };
    
    // Important fields (30 points)
    const importantFields = {
        'email': 10,
        'ageRange': 10,
        'insurance': 10
    };
    
    // Nice to have (10 points)
    const niceFields = {
        'hours': 5,
        'languages': 5
    };
    
    // Check critical fields
    if (data.title || data.structured?.jsonLd?.name) {
        scoring.score += criticalFields.name;
    } else {
        scoring.missingCritical.push('Program name');
    }
    
    if (data.phones?.length > 0 || data.structured?.jsonLd?.telephone) {
        scoring.score += criticalFields.phone;
    } else {
        scoring.missingCritical.push('Phone number');
    }
    
    if (data.addresses?.length > 0 || data.structured?.jsonLd?.address) {
        scoring.score += criticalFields.address;
    } else {
        scoring.missingCritical.push('Address');
    }
    
    if (data.therapies?.length > 0 || data.analysis?.modalities?.length > 0) {
        scoring.score += criticalFields['services/modalities'];
    } else {
        scoring.missingCritical.push('Treatment services/modalities');
    }
    
    // Check important fields
    if (data.emails?.length > 0 || data.structured?.jsonLd?.email) {
        scoring.score += importantFields.email;
    }
    
    if (data.analysis?.ageRange) {
        scoring.score += importantFields.ageRange;
    }
    
    if (data.analysis?.insurances?.length > 0) {
        scoring.score += importantFields.insurance;
    }
    
    // Determine quality rating
    const percentage = (scoring.score / scoring.maxScore) * 100;
    if (percentage >= 80) {
        scoring.quality = 'Excellent';
    } else if (percentage >= 60) {
        scoring.quality = 'Good';
    } else if (percentage >= 40) {
        scoring.quality = 'Fair';
    } else {
        scoring.quality = 'Poor';
    }
    
    // Add suggestions
    if (scoring.missingCritical.length > 0) {
        scoring.suggestions.push(`Missing critical information: ${scoring.missingCritical.join(', ')}`);
    }
    
    if (data.phones?.length === 0) {
        scoring.suggestions.push('Try looking for phone numbers in contact or footer sections');
    }
    
    if (!data.analysis?.ageRange) {
        scoring.suggestions.push('Check admissions or program pages for age requirements');
    }
    
    scoring.percentage = Math.round(percentage);
    
    return scoring;
}

// Enhanced extraction with all features
function enhancedExtractPageInfo() {
    // Run standard extraction
    const basicInfo = extractPageInfo();
    
    // Add structured data
    basicInfo.structured = extractStructuredData();
    
    // Apply site template if available
    const domain = window.location.hostname;
    basicInfo.templateData = applySiteTemplate(domain);
    
    // Score the extraction
    basicInfo.quality = scoreExtractedData(basicInfo);
    
    // Add extraction metadata
    basicInfo.metadata = {
        extractedAt: new Date().toISOString(),
        domain: domain,
        url: window.location.href,
        hasStructuredData: basicInfo.structured.found,
        hasTemplate: !!basicInfo.templateData,
        extractionMethod: basicInfo.templateData ? 'template' : 
                         basicInfo.structured.found ? 'structured' : 'pattern'
    };
    
    return basicInfo;
}

// Update the message listener to use enhanced extraction
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractInfo') {
        const extractedData = enhancedExtractPageInfo();
        sendResponse({ data: extractedData });
        return true;
    }
});