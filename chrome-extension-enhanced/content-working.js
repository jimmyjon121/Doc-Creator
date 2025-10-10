// Working Content Script - Guaranteed to Extract Data
// This version actually extracts and formats data properly

(function() {
    // Prevent duplicate loading
    if (window.__FF_WORKING_LOADED__) {
        console.log('Working content script already loaded');
        return;
    }
    window.__FF_WORKING_LOADED__ = true;
    console.log('Family First Program Extractor - Working Version Loaded');

    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Received message:', request.action);
        
        if (request.action === 'ping' || request.action === 'testConnection') {
            sendResponse({ status: 'ok', version: 'working' });
            return false;
        }
        
        if (request.action === 'extractInfo') {
            console.log('Starting data extraction...');
            try {
                const extractedData = performExtraction();
                console.log('Extraction successful, data points:', countDataPoints(extractedData));
                sendResponse({ data: extractedData });
            } catch (error) {
                console.error('Extraction error:', error);
                sendResponse({ 
                    error: 'Extraction failed: ' + error.message,
                    data: getBasicData() 
                });
            }
            return true;
        }
        
        return false;
    });

    // Main extraction function
    function performExtraction() {
        const data = {
            title: document.title || 'Unknown',
            url: window.location.href,
            domain: window.location.hostname,
            extractedAt: new Date().toISOString(),
            
            // Basic info
            programName: '',
            location: '',
            phone: '',
            email: '',
            
            // Collections
            headings: [],
            paragraphs: [],
            listItems: [],
            phones: [],
            emails: [],
            addresses: [],
            
            // Sections for popup compatibility
            sections: {},
            pages: { current: { url: window.location.href, title: document.title } },
            
            // Additional data
            metaDescription: '',
            therapies: [],
            ages: '',
            insurance: []
        };
        
        // Get all text content
        const bodyText = document.body?.innerText || document.body?.textContent || '';
        
        // Extract program name
        data.programName = extractProgramName();
        
        // Extract meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            data.metaDescription = metaDesc.content || '';
        }
        
        // Extract all headings
        const headings = document.querySelectorAll('h1, h2, h3, h4');
        headings.forEach((heading, index) => {
            if (index < 50) { // Limit to first 50
                const text = heading.textContent?.trim();
                if (text && text.length > 2 && text.length < 200) {
                    data.headings.push({
                        level: heading.tagName,
                        text: text
                    });
                }
            }
        });
        
        // Extract paragraphs
        const paragraphs = document.querySelectorAll('p');
        paragraphs.forEach((p, index) => {
            if (index < 50) { // Limit to first 50
                const text = p.textContent?.trim();
                if (text && text.length > 30 && text.length < 1000) {
                    data.paragraphs.push(text);
                }
            }
        });
        
        // Extract list items
        const listItems = document.querySelectorAll('li');
        listItems.forEach((li, index) => {
            if (index < 30) { // Limit to first 30
                const text = li.textContent?.trim();
                if (text && text.length > 10 && text.length < 200) {
                    data.listItems.push(text);
                }
            }
        });
        
        // Extract phone numbers
        const phoneRegex = /\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/g;
        const phones = (bodyText.match(phoneRegex) || []).slice(0, 10);
        data.phones = [...new Set(phones)];
        data.phone = data.phones[0] || '';
        
        // Extract emails
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = (bodyText.match(emailRegex) || [])
            .filter(e => !e.includes('.png') && !e.includes('.jpg') && !e.includes('.css'))
            .slice(0, 10);
        data.emails = [...new Set(emails)];
        data.email = data.emails[0] || '';
        
        // Extract addresses
        const addressElements = document.querySelectorAll('address, .address, [class*="address"]');
        addressElements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && text.length > 10 && text.length < 200) {
                data.addresses.push(text);
            }
        });
        data.location = data.addresses[0] || '';
        
        // Look for location in text
        if (!data.location) {
            const statePattern = /([\w\s]+),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s*\d{5}/i;
            const stateMatch = bodyText.match(statePattern);
            if (stateMatch) {
                data.location = stateMatch[0];
            }
        }
        
        // Extract key sections
        const sectionKeywords = {
            about: ['about', 'mission', 'who we are', 'overview'],
            services: ['services', 'programs', 'treatment', 'therapy'],
            approach: ['approach', 'philosophy', 'methodology', 'model'],
            admissions: ['admission', 'intake', 'enroll', 'apply'],
            contact: ['contact', 'location', 'address', 'phone']
        };
        
        Object.entries(sectionKeywords).forEach(([section, keywords]) => {
            for (const keyword of keywords) {
                const headingElements = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
                    .filter(el => el.textContent?.toLowerCase().includes(keyword));
                
                if (headingElements.length > 0) {
                    let content = '';
                    let nextElement = headingElements[0].nextElementSibling;
                    let charCount = 0;
                    
                    while (nextElement && charCount < 500) {
                        if (nextElement.tagName === 'P' || nextElement.tagName === 'UL') {
                            const text = nextElement.textContent?.trim();
                            if (text) {
                                content += text + ' ';
                                charCount += text.length;
                            }
                        }
                        if (/^H[1-6]$/.test(nextElement.tagName)) break;
                        nextElement = nextElement.nextElementSibling;
                    }
                    
                    if (content.trim()) {
                        data.sections[section] = content.trim().substring(0, 500);
                        break;
                    }
                }
            }
        });
        
        // Extract therapies
        const therapyKeywords = [
            'CBT', 'DBT', 'EMDR', 'Cognitive Behavioral', 'Dialectical Behavior',
            'Individual Therapy', 'Group Therapy', 'Family Therapy',
            'Art Therapy', 'Music Therapy', 'Equine', 'Experiential',
            'Trauma-Focused', 'Mindfulness', 'Wilderness', 'Adventure'
        ];
        
        therapyKeywords.forEach(therapy => {
            if (new RegExp(`\\b${therapy}\\b`, 'i').test(bodyText)) {
                data.therapies.push(therapy);
            }
        });
        
        // Extract age information
        const agePattern = /(\d+)\s*[-–to]+\s*(\d+)\s*(?:years?|yrs?)?\s*(?:old)?/i;
        const ageMatch = bodyText.match(agePattern);
        if (ageMatch) {
            data.ages = `${ageMatch[1]}-${ageMatch[2]} years`;
        }
        
        // Extract insurance info
        const insuranceKeywords = ['Aetna', 'Cigna', 'Blue Cross', 'United Healthcare', 'Anthem', 'Humana'];
        insuranceKeywords.forEach(ins => {
            if (new RegExp(`\\b${ins}\\b`, 'i').test(bodyText)) {
                data.insurance.push(ins);
            }
        });
        
        // Add extraction statistics
        data.stats = {
            headingsFound: data.headings.length,
            paragraphsFound: data.paragraphs.length,
            phonesFound: data.phones.length,
            emailsFound: data.emails.length,
            sectionsFound: Object.keys(data.sections).length,
            therapiesFound: data.therapies.length
        };
        
        console.log('Extraction complete. Stats:', data.stats);
        
        return data;
    }

    // Extract program name with multiple strategies
    function extractProgramName() {
        // Try meta tags
        const metaTags = [
            document.querySelector('meta[property="og:site_name"]')?.content,
            document.querySelector('meta[property="og:title"]')?.content,
            document.querySelector('title')?.textContent
        ];
        
        for (const content of metaTags) {
            if (content) {
                const cleaned = content.replace(/\s*[-|•]\s*(Home|Homepage|Welcome).*$/i, '').trim();
                if (cleaned && cleaned.length > 2 && cleaned.length < 100) {
                    return cleaned;
                }
            }
        }
        
        // Try H1
        const h1 = document.querySelector('h1');
        if (h1) {
            const text = h1.textContent?.trim();
            if (text && text.length > 2 && text.length < 100) {
                return text;
            }
        }
        
        // Use domain
        const domain = window.location.hostname.replace('www.', '').split('.')[0];
        return domain.split('-').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
    }

    // Count data points for stats
    function countDataPoints(data) {
        let count = 0;
        if (data.programName) count++;
        if (data.location) count++;
        if (data.phone) count++;
        if (data.email) count++;
        count += data.headings?.length || 0;
        count += data.paragraphs?.length || 0;
        count += data.phones?.length || 0;
        count += data.emails?.length || 0;
        count += Object.keys(data.sections || {}).length;
        count += data.therapies?.length || 0;
        return count;
    }

    // Get basic fallback data
    function getBasicData() {
        return {
            title: document.title,
            url: window.location.href,
            programName: document.title,
            sections: {},
            pages: { current: { url: window.location.href } },
            headings: [],
            paragraphs: []
        };
    }

    console.log('Working content script ready for extraction');
})();
