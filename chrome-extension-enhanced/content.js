// content.js (Gemini Fix) - Simple, reliable extraction

console.log("Family First Extractor content script loaded - Gemini Fix v3.0");

// Listen for extraction requests
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractData') {
        console.log("Extraction request received");
        try {
            const data = extractAllData();
            console.log("Extraction complete:", data);
            sendResponse({ data: data });
        } catch (error) {
            console.error("Extraction error:", error);
            sendResponse({ error: error.message });
        }
    }
    return true; // Keep message channel open
});

// Main extraction function
function extractAllData() {
    const bodyText = document.body?.innerText || '';
    const bodyHtml = document.body?.innerHTML || '';
    
    console.log("Starting data extraction...");
    
    // Initialize data object
    const data = {
        programName: '',
        url: window.location.href,
        phones: [],
        emails: [],
        location: '',
        ages: '',
        therapies: [],
        insurance: [],
        headings: [],
        paragraphs: [],
        sections: {}
    };
    
    // 1. Extract Program Name (multiple strategies)
    console.log("Extracting program name...");
    
    // Try meta tags first
    const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content;
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content;
    const pageTitle = document.title;
    
    if (ogSiteName) {
        data.programName = ogSiteName;
    } else if (ogTitle) {
        data.programName = ogTitle.split(/[-|]/)[0].trim();
    } else {
        // Try H1
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent.trim()) {
            data.programName = h1.textContent.trim();
        } else {
            // Use page title
            data.programName = pageTitle.split(/[-|]/)[0].trim();
        }
    }
    
    // 2. Extract Phone Numbers
    console.log("Extracting phone numbers...");
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phoneMatches = bodyText.match(phoneRegex) || [];
    data.phones = [...new Set(phoneMatches)].filter(phone => {
        const digits = phone.replace(/\D/g, '');
        return digits.length === 10 || digits.length === 11;
    }).slice(0, 10);
    
    // 3. Extract Email Addresses
    console.log("Extracting emails...");
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = bodyText.match(emailRegex) || [];
    data.emails = [...new Set(emailMatches)]
        .filter(email => !email.includes('.png') && !email.includes('.jpg') && !email.includes('@example'))
        .slice(0, 10);
    
    // 4. Extract Location
    console.log("Extracting location...");
    
    // Look for address patterns
    const stateAbbr = 'AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY';
    const addressRegex = new RegExp(`([A-Za-z\\s]+),\\s*(${stateAbbr})\\s*(\\d{5})?`, 'i');
    const addressMatch = bodyText.match(addressRegex);
    if (addressMatch) {
        data.location = addressMatch[0];
    }
    
    // Also check for address elements
    const addressElements = document.querySelectorAll('address, .address, [itemtype*="PostalAddress"]');
    if (!data.location && addressElements.length > 0) {
        data.location = addressElements[0].textContent.trim().replace(/\s+/g, ' ');
    }
    
    // 5. Extract Age Information
    console.log("Extracting age ranges...");
    const ageRegex = /(\d{1,2})\s*[-–to]+\s*(\d{1,2})\s*(?:years?|yrs?)?(?:\s*old)?/i;
    const ageMatch = bodyText.match(ageRegex);
    if (ageMatch && parseInt(ageMatch[1]) < parseInt(ageMatch[2]) && parseInt(ageMatch[2]) <= 25) {
        data.ages = `${ageMatch[1]}-${ageMatch[2]} years`;
    }
    
    // 6. Extract Therapies
    console.log("Extracting therapies...");
    const therapyKeywords = [
        'CBT', 'DBT', 'EMDR', 'ACT', 'IFS',
        'Cognitive Behavioral Therapy', 'Dialectical Behavior Therapy',
        'Eye Movement Desensitization', 'Acceptance and Commitment',
        'Internal Family Systems', 'Trauma-Focused', 'Trauma-Informed',
        'Individual Therapy', 'Group Therapy', 'Family Therapy',
        'Art Therapy', 'Music Therapy', 'Equine Therapy',
        'Adventure Therapy', 'Wilderness Therapy', 'Experiential Therapy',
        'Mindfulness', 'Yoga Therapy', 'Recreation Therapy',
        'Play Therapy', 'Sand Tray', 'Psychotherapy'
    ];
    
    therapyKeywords.forEach(therapy => {
        if (bodyText.includes(therapy) || bodyText.toLowerCase().includes(therapy.toLowerCase())) {
            // Normalize common abbreviations
            if (therapy === 'Cognitive Behavioral Therapy') therapy = 'CBT';
            if (therapy === 'Dialectical Behavior Therapy') therapy = 'DBT';
            if (therapy === 'Eye Movement Desensitization') therapy = 'EMDR';
            if (!data.therapies.includes(therapy)) {
                data.therapies.push(therapy);
            }
        }
    });
    
    // 7. Extract Insurance
    console.log("Extracting insurance...");
    const insuranceKeywords = [
        'Aetna', 'Anthem', 'Blue Cross', 'Blue Shield', 'BCBS',
        'Cigna', 'United Healthcare', 'UnitedHealth', 'Humana',
        'Kaiser', 'Magellan', 'Optum', 'Beacon', 'TRICARE',
        'Medicaid', 'Medicare', 'ComPsych', 'Centene'
    ];
    
    insuranceKeywords.forEach(insurance => {
        if (bodyText.includes(insurance)) {
            if (!data.insurance.includes(insurance)) {
                data.insurance.push(insurance);
            }
        }
    });
    
    // 8. Extract Headings
    console.log("Extracting headings...");
    const headings = document.querySelectorAll('h1, h2, h3, h4');
    headings.forEach((heading, index) => {
        if (index < 50) { // Limit to 50 headings
            const text = heading.textContent.trim();
            if (text && text.length > 2 && text.length < 200) {
                data.headings.push(text);
            }
        }
    });
    
    // 9. Extract Paragraphs
    console.log("Extracting paragraphs...");
    const paragraphs = document.querySelectorAll('p');
    paragraphs.forEach((p, index) => {
        if (index < 30) { // Limit to 30 paragraphs
            const text = p.textContent.trim();
            if (text && text.length > 50 && text.length < 1000) {
                data.paragraphs.push(text);
            }
        }
    });
    
    // 10. Extract Key Sections
    console.log("Extracting key sections...");
    const sectionKeywords = {
        'About': ['about', 'who we are', 'mission', 'our story'],
        'Services': ['services', 'programs', 'treatment', 'what we offer'],
        'Approach': ['approach', 'philosophy', 'methodology', 'our method'],
        'Admissions': ['admission', 'intake', 'how to start', 'enrollment']
    };
    
    Object.entries(sectionKeywords).forEach(([sectionName, keywords]) => {
        // Find heading containing keyword
        for (const keyword of keywords) {
            const headingEl = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
                .find(h => h.textContent.toLowerCase().includes(keyword));
            
            if (headingEl) {
                // Get content after heading
                let content = '';
                let nextEl = headingEl.nextElementSibling;
                let charCount = 0;
                
                while (nextEl && charCount < 500) {
                    if (nextEl.tagName === 'P' || nextEl.tagName === 'UL' || nextEl.tagName === 'OL') {
                        content += nextEl.textContent.trim() + ' ';
                        charCount += nextEl.textContent.length;
                    }
                    if (nextEl.tagName && nextEl.tagName.match(/^H[1-6]$/)) {
                        break; // Stop at next heading
                    }
                    nextEl = nextEl.nextElementSibling;
                }
                
                if (content.trim()) {
                    data.sections[sectionName] = content.trim();
                    break;
                }
            }
        }
    });
    
    console.log("Extraction complete. Data points found:", 
        data.phones.length + data.emails.length + data.headings.length + 
        data.paragraphs.length + Object.keys(data.sections).length);
    
    return data;
}