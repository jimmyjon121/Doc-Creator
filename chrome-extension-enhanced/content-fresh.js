// Fresh Content Script - Complete Rewrite
// This version is guaranteed to extract and display actual data

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__FF_FRESH_LOADED__) {
        console.log('Fresh content script already loaded');
        return;
    }
    window.__FF_FRESH_LOADED__ = true;
    
    console.log('=== Family First Extractor FRESH v1.0 Loaded ===');
    
    // Message listener
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Message received:', request.action);
        
        if (request.action === 'ping' || request.action === 'testConnection') {
            sendResponse({ status: 'ok', version: 'fresh-1.0' });
            return true;
        }
        
        if (request.action === 'extractInfo') {
            console.log('Starting FRESH extraction...');
            
            // Perform extraction
            const result = extractEverything();
            
            console.log('Extraction complete!');
            console.log('Total data points:', result.totalDataPoints);
            console.log('Program name:', result.data.programName);
            console.log('Sections found:', Object.keys(result.data.sections).length);
            
            // Send back the properly formatted data
            sendResponse({ data: result.data });
            return true;
        }
        
        return false;
    });
    
    // Main extraction function - extracts EVERYTHING
    function extractEverything() {
        console.log('Extracting all data from page...');
        
        // Get all text content for analysis
        const pageText = document.body.innerText || document.body.textContent || '';
        const pageHtml = document.body.innerHTML || '';
        
        // Initialize data structure that matches what popup expects
        const extractedData = {
            // Basic info
            title: document.title || 'Unknown',
            url: window.location.href,
            domain: window.location.hostname,
            programName: '',
            location: '',
            phone: '',
            email: '',
            
            // Arrays for multiple items
            headings: [],
            paragraphs: [],
            phones: [],
            emails: [],
            addresses: [],
            
            // Sections object - REQUIRED for popup
            sections: {},
            
            // Pages object - REQUIRED for popup stats
            pages: {
                current: {
                    url: window.location.href,
                    title: document.title,
                    data: {}
                }
            },
            
            // Clinical data
            therapies: [],
            insurance: [],
            ages: '',
            
            // Metadata
            extractedAt: new Date().toISOString()
        };
        
        // STEP 1: Extract Program Name (multiple methods)
        console.log('Extracting program name...');
        
        // Method 1: Meta tags
        const metaName = document.querySelector('meta[property="og:site_name"]')?.content ||
                        document.querySelector('meta[name="application-name"]')?.content ||
                        document.querySelector('meta[property="og:title"]')?.content;
        
        if (metaName) {
            extractedData.programName = metaName.replace(/\s*[-|]\s*(Home|Homepage).*$/i, '').trim();
        }
        
        // Method 2: Look for H1 with facility name patterns
        if (!extractedData.programName) {
            const h1s = document.querySelectorAll('h1');
            for (const h1 of h1s) {
                const text = h1.textContent.trim();
                if (text && (text.includes('Recovery') || text.includes('Treatment') || 
                           text.includes('Center') || text.includes('Academy'))) {
                    extractedData.programName = text;
                    break;
                }
            }
        }
        
        // Method 3: Domain name
        if (!extractedData.programName) {
            const domain = window.location.hostname.replace('www.', '').split('.')[0];
            extractedData.programName = domain.split('-').map(w => 
                w.charAt(0).toUpperCase() + w.slice(1)
            ).join(' ');
        }
        
        // STEP 2: Extract All Headings
        console.log('Extracting headings...');
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4');
        allHeadings.forEach((h, index) => {
            if (index < 100) { // Get up to 100 headings
                const text = h.textContent.trim();
                if (text && text.length > 2 && text.length < 300) {
                    extractedData.headings.push({
                        level: h.tagName,
                        text: text
                    });
                }
            }
        });
        
        // STEP 3: Extract Paragraphs
        console.log('Extracting paragraphs...');
        const allParagraphs = document.querySelectorAll('p');
        allParagraphs.forEach((p, index) => {
            if (index < 50) { // Get first 50 paragraphs
                const text = p.textContent.trim();
                if (text && text.length > 20 && text.length < 2000) {
                    extractedData.paragraphs.push(text);
                }
            }
        });
        
        // STEP 4: Extract Contact Information
        console.log('Extracting contact info...');
        
        // Phone numbers
        const phonePattern = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        const foundPhones = pageText.match(phonePattern) || [];
        extractedData.phones = [...new Set(foundPhones)].slice(0, 20);
        extractedData.phone = extractedData.phones[0] || '';
        
        // Email addresses
        const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const foundEmails = pageText.match(emailPattern) || [];
        extractedData.emails = [...new Set(foundEmails)]
            .filter(e => !e.includes('.png') && !e.includes('.jpg'))
            .slice(0, 20);
        extractedData.email = extractedData.emails[0] || '';
        
        // Addresses
        const addressElements = document.querySelectorAll('address, .address, [class*="address"], [itemtype*="PostalAddress"]');
        addressElements.forEach(el => {
            const text = el.textContent.trim();
            if (text && text.length > 10) {
                extractedData.addresses.push(text);
            }
        });
        
        // Try to find location from text patterns
        const locationPattern = /([A-Za-z\s]+),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s*\d{5}?/;
        const locationMatch = pageText.match(locationPattern);
        if (locationMatch) {
            extractedData.location = locationMatch[0];
        } else if (extractedData.addresses.length > 0) {
            extractedData.location = extractedData.addresses[0];
        }
        
        // STEP 5: Extract Key Sections (CRITICAL for popup)
        console.log('Extracting sections...');
        const sectionPatterns = {
            about: ['about', 'who we are', 'mission', 'overview', 'our story'],
            services: ['services', 'programs', 'treatment', 'what we offer', 'therapies'],
            approach: ['approach', 'philosophy', 'our approach', 'methodology', 'how we help'],
            admissions: ['admissions', 'intake', 'enrollment', 'getting started', 'apply'],
            contact: ['contact', 'location', 'get in touch', 'reach us']
        };
        
        // Find sections by looking for headings
        Object.entries(sectionPatterns).forEach(([sectionName, keywords]) => {
            for (const keyword of keywords) {
                // Find headings containing the keyword
                const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
                    .filter(h => h.textContent.toLowerCase().includes(keyword));
                
                if (headings.length > 0) {
                    // Get text after the heading
                    let sectionText = '';
                    let element = headings[0].nextElementSibling;
                    let charCount = 0;
                    
                    while (element && charCount < 1000) {
                        if (element.tagName === 'P' || element.tagName === 'UL' || element.tagName === 'OL') {
                            sectionText += element.textContent + '\n';
                            charCount += element.textContent.length;
                        }
                        // Stop at next heading
                        if (element.tagName && element.tagName.match(/^H[1-6]$/)) {
                            break;
                        }
                        element = element.nextElementSibling;
                    }
                    
                    if (sectionText.trim()) {
                        extractedData.sections[sectionName] = sectionText.trim();
                        break; // Found this section, move to next
                    }
                }
            }
        });
        
        // If no sections found by heading search, create them from paragraphs
        if (Object.keys(extractedData.sections).length === 0 && extractedData.paragraphs.length > 0) {
            extractedData.sections.content = extractedData.paragraphs.slice(0, 5).join('\n\n');
        }
        
        // STEP 6: Extract Clinical Information
        console.log('Extracting clinical data...');
        
        // Therapy types
        const therapyKeywords = [
            'CBT', 'DBT', 'EMDR', 'Cognitive Behavioral Therapy', 'Dialectical Behavior Therapy',
            'Individual Therapy', 'Group Therapy', 'Family Therapy', 'Art Therapy', 'Music Therapy',
            'Equine Therapy', 'Adventure Therapy', 'Wilderness Therapy', 'Experiential Therapy',
            'Trauma-Focused', 'Trauma-Informed', 'Mindfulness', 'Yoga', 'Meditation',
            'Psychotherapy', 'Counseling', 'Play Therapy', 'Recreation Therapy'
        ];
        
        therapyKeywords.forEach(therapy => {
            if (pageText.toLowerCase().includes(therapy.toLowerCase())) {
                extractedData.therapies.push(therapy);
            }
        });
        
        // Age ranges
        const agePattern = /(\d{1,2})\s*[-–to]+\s*(\d{1,2})\s*(?:years?|yrs?)?(?:\s*old)?/i;
        const ageMatch = pageText.match(agePattern);
        if (ageMatch && parseInt(ageMatch[1]) < parseInt(ageMatch[2])) {
            extractedData.ages = `${ageMatch[1]}-${ageMatch[2]} years`;
        }
        
        // Insurance
        const insuranceCompanies = [
            'Aetna', 'Cigna', 'Blue Cross', 'Blue Shield', 'United Healthcare', 
            'Anthem', 'Humana', 'Kaiser', 'Medicaid', 'Medicare', 'TRICARE',
            'Magellan', 'Optum', 'Beacon', 'ValueOptions'
        ];
        
        insuranceCompanies.forEach(company => {
            if (pageText.includes(company)) {
                extractedData.insurance.push(company);
            }
        });
        
        // STEP 7: Count total data points
        let dataPointCount = 0;
        
        // Count basic fields
        if (extractedData.programName) dataPointCount++;
        if (extractedData.location) dataPointCount++;
        if (extractedData.phone) dataPointCount++;
        if (extractedData.email) dataPointCount++;
        
        // Count arrays
        dataPointCount += extractedData.headings.length;
        dataPointCount += extractedData.paragraphs.length;
        dataPointCount += extractedData.phones.length;
        dataPointCount += extractedData.emails.length;
        dataPointCount += extractedData.addresses.length;
        dataPointCount += extractedData.therapies.length;
        dataPointCount += extractedData.insurance.length;
        
        // Count sections
        dataPointCount += Object.keys(extractedData.sections).length * 5; // Weight sections more
        
        // Add stats for popup display
        extractedData.stats = {
            headingsFound: extractedData.headings.length,
            paragraphsFound: extractedData.paragraphs.length,
            phonesFound: extractedData.phones.length,
            emailsFound: extractedData.emails.length,
            sectionsFound: Object.keys(extractedData.sections).length,
            therapiesFound: extractedData.therapies.length,
            totalDataPoints: dataPointCount
        };
        
        console.log('Extraction stats:', extractedData.stats);
        
        return {
            data: extractedData,
            totalDataPoints: dataPointCount
        };
    }
    
    console.log('Fresh content script ready!');
    console.log('Send {action: "extractInfo"} to extract data');
    
})();
