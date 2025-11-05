// production-extractor.js - Production-Ready AI Extraction for Business Use v9.0

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__FF_PRODUCTION_EXTRACTOR__) {
        return;
    }
    window.__FF_PRODUCTION_EXTRACTOR__ = true;
    
    console.log('[INFO] Production AI Extractor v9.0 Loaded');
    
    // Configuration
    let API_KEY = null;
    
    // Listen for messages
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract') {
            console.log('[INFO] Starting AI extraction...');
            performExtraction().then(result => {
                sendResponse({ success: true, data: result });
            }).catch(error => {
                console.error('[ERROR] Extraction failed:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true;
        }
    });
    
    // Main extraction function
    async function performExtraction() {
        const startTime = Date.now();
        
        // Load API key from storage
        API_KEY = await loadAPIKey();
        
        // Always use multi-page comprehensive extraction
        console.log('[INFO] Starting multi-page comprehensive extraction...');
        return performMultiPageExtraction(startTime);
    }
    
    // Load API key from storage
    async function loadAPIKey() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['gemini_api_key'], (result) => {
                resolve(result.gemini_api_key || null);
            });
        });
    }
    
    // Multi-page extraction with progress reporting
    async function performMultiPageExtraction(startTime) {
        // Initialize data structure
        const data = {
            name: extractProgramName(),
            city: '',
            state: '',
            levelsOfCare: [],
            population: { ages: '', gender: '' },
            clinical: {
                evidenceBased: [],
                experiential: [],
                specializations: [],
                individualTherapyHours: '',
                groupTherapyHours: ''
            },
            structure: {
                los: '',
                ratio: '',
                capacity: '',
                phases: [],
                groupSize: '',
                academics: { 
                    hasProgram: false,
                    accreditation: '',
                    grades: '',
                    iep504: false,
                    creditSupport: false
                }
            },
            environment: {
                setting: '',
                campusSizeAcre: ''
            },
            staff: {
                credentials: [],
                leadership: [],
                psychiatryPresent: false
            },
            family: {
                weeklyTherapy: false,
                workshops: false
            },
            admissions: {
                insurance: [],
                phone: '',
                email: '',
                privatePay: false,
                inNetwork: [],
                outOfNetwork: false,
                financing: false,
                scholarships: false,
                medicaid: false,
                medicare: false,
                exclusions: []
            },
            quality: {
                accreditations: []
            },
            differentiators: [],
            meta: {
                sourcesAnalyzed: 0,
                pagesScanned: [],
                confidence: 0,
                extractionMethod: API_KEY ? 'Multi-page with AI' : 'Multi-page Rule-based'
            }
        };
        
        // Extract from current page first
        console.log('[INFO] Extracting from current page...');
        extractFromPage(data, getCleanTextFromDocument(document), document, window.location.href);
        data.meta.sourcesAnalyzed = 1;
        data.meta.pagesScanned.push(window.location.href);
        const collectedTexts = [getCleanTextFromDocument(document)];
        
        // Discover related pages
        console.log('[INFO] Discovering related pages...');
        const relatedPages = discoverRelatedPages();
        console.log(`[INFO] Found ${relatedPages.length} related pages to analyze`);
        
        // Notify about discovery
        sendProgressUpdate(1, 1, `Discovered ${relatedPages.length} pages to scan...`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Show discovery message
        
        // Send progress update
        sendProgressUpdate(1, relatedPages.length + 1, 'Starting multi-page scan...');
        
        // Fetch and analyze each page - scanning up to 50 pages
        const maxPages = Math.min(relatedPages.length, 50);
        console.log(`[INFO] Will analyze ${maxPages} pages`);
        
        for (let i = 0; i < maxPages; i++) {
            const pageUrl = relatedPages[i];
            
            try {
                // Get readable page name
                let pageName = pageUrl.split('/').filter(p => p && p !== 'www.inbalanceacademy.com').pop() || 'homepage';
                pageName = pageName.replace(/-/g, ' ').replace(/_/g, ' ');
                if (pageName.length > 30) pageName = pageName.substring(0, 30) + '...';
                
                console.log(`[INFO] Fetching page ${i + 2}/${maxPages + 1}: ${pageUrl}`);
                sendProgressUpdate(i + 2, maxPages + 1, `Scanning: ${pageName}`);
                
                const pageData = await fetchPage(pageUrl);
                if (pageData) {
                    extractFromPage(data, pageData.text, pageData.doc, pageData.url);
                    data.meta.sourcesAnalyzed++;
                    data.meta.pagesScanned.push(pageUrl);
                    collectedTexts.push(pageData.text);
                }
                
                // Small delay to be respectful (but not too slow)
                await new Promise(resolve => setTimeout(resolve, 300));
                
            } catch (error) {
                console.warn(`[WARNING] Failed to fetch ${pageUrl}:`, error);
            }
        }
        
        // If we have AI, enhance the extraction
        if (API_KEY && data.meta.sourcesAnalyzed > 0) {
            console.log('[INFO] Enhancing with AI (Gemini)...');
            sendProgressUpdate(maxPages + 1, maxPages + 2, 'AI analyzing all collected data...');
            try {
                const combinedText = collectedTexts.join('\n\n').slice(0, 20000);
                const aiEnhanced = await enhanceWithAI(data, combinedText);
                if (aiEnhanced) {
                    console.log('[INFO] AI found additional data, merging...');
                    sendProgressUpdate(maxPages + 2, maxPages + 2, 'Merging AI enhancements...');
                    mergeData(data, aiEnhanced);
                } else {
                    console.log('[INFO] AI enhancement complete (no new data)');
                }
            } catch (error) {
                console.warn('[WARNING] AI enhancement failed:', error);
                sendProgressUpdate(maxPages + 2, maxPages + 2, 'AI enhancement skipped (error)');
            }
        } else if (!API_KEY) {
            console.log('[INFO] No API key - skipping AI enhancement');
            sendProgressUpdate(maxPages + 1, maxPages + 1, 'Completed (no AI key)');
        }
        
        // Clean and consolidate
        consolidateData(data);
        data.differentiators = buildDifferentiators(data);
        
        // Calculate final confidence
        data.meta.confidence = calculateConfidence(data);
        data.meta.extractionTime = Date.now() - startTime;
        
        return data;
    }
    
    // Send progress updates to popup
    function sendProgressUpdate(current, total, message) {
        try {
            chrome.runtime.sendMessage({
                action: 'progress',
                current: current,
                total: total,
                message: message
            });
        } catch (e) {
            // Popup might be closed, ignore
        }
    }
    
    // Discover related pages to crawl
    function discoverRelatedPages() {
        const pages = new Set();
        const currentDomain = window.location.hostname;
        const currentUrl = window.location.href;
        
        console.log('[INFO] Discovering pages on:', currentDomain);
        
        // Find ALL links on the page
        const links = document.querySelectorAll('a[href]');
        console.log(`[INFO] Found ${links.length} total links on page`);
        
        links.forEach(link => {
            try {
                const href = link.href;
                
                // Only same-domain links, skip anchors, skip current page, skip files
                if (href && 
                    href.includes(currentDomain) && 
                    !href.includes('#') && 
                    href !== currentUrl &&
                    !href.match(/\.(pdf|jpg|jpeg|png|gif|zip|doc|docx)$/i)) {
                    
                    pages.add(href);
                }
            } catch (e) {
                // Skip invalid links
            }
        });
        
        console.log(`[INFO] Discovered ${pages.size} unique pages to analyze`);
        
        // Sort pages - prioritize certain keywords to scan first
        const priorityKeywords = [
            'about', 'program', 'treatment', 'clinical', 'therapy', 'services',
            'admissions', 'insurance', 'family', 'parent',
            'staff', 'team', 'academics', 'education',
            'facilities', 'campus', 'approach', 'philosophy',
            'specialties', 'care', 'therapeutic'
        ];
        
        const pagesArray = Array.from(pages);
        const sortedPages = pagesArray.sort((a, b) => {
            const aScore = priorityKeywords.filter(kw => a.toLowerCase().includes(kw)).length;
            const bScore = priorityKeywords.filter(kw => b.toLowerCase().includes(kw)).length;
            return bScore - aScore; // Higher score first
        });
        
        console.log('[INFO] Top priority pages:', sortedPages.slice(0, 10).map(p => p.split('/').pop()));
        
        return sortedPages;
    }
    
    // Fetch a page
    async function fetchPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            return {
                text: getCleanTextFromDocument(doc),
                doc: doc,
                url: url
            };
        } catch (error) {
            console.warn(`[WARNING] Failed to fetch ${url}:`, error);
            return null;
        }
    }

    // Get clean text from a document by removing nav/footers and boilerplate
    function getCleanTextFromDocument(doc) {
        try {
            const clone = doc.cloneNode(true);
            const junk = [
                'nav', 'footer', '.site-footer', '.cookie', '.gdpr', '.newsletter',
                '.breadcrumbs', '.pagination', '.social', '.share', '.menu', '.toolbar'
            ];
            junk.forEach(sel => clone.querySelectorAll(sel).forEach(el => el.remove()));
            const text = clone.body?.innerText || '';
            return text
                .split('\n')
                .map(l => l.trim())
                .filter(l => l && l.length > 2 && !/^(home|menu|skip to main content)$/i.test(l))
                .join('\n');
        } catch {
            return doc.body?.innerText || '';
        }
    }
    
    // AI Extraction with Gemini (for enhancement)
    async function enhanceWithAI(existingData, combinedText) {
        // Use combined text from crawler when available
        const allText = (combinedText && combinedText.length > 0)
            ? combinedText.substring(0, 20000)
            : (document.body?.innerText || '').substring(0, 12000);
        
        const prompt = `You are extracting treatment program information for clinical aftercare documentation.

PROGRAM: ${existingData.name}
WEBSITE: ${window.location.href}

We've scanned ${existingData.meta.sourcesAnalyzed} pages and found some data. Please enhance and fill in missing information from this content:

${allText}

Return a JSON object with ONLY the fields you can confidently extract. Use exact field names:

{
  "levelsOfCare": ["Residential", "PHP", "IOP", or "Outpatient"],
  "population": {
    "ages": "specific range like 13-17 or Young Adults",
    "gender": "Males Only, Females Only, or Co-ed"
  },
  "clinical": {
    "evidenceBased": ["CBT", "DBT", "EMDR", "ACT", "MI", etc - ONLY if explicitly mentioned],
    "experiential": ["Art Therapy", "Music Therapy", "Equine Therapy", "Adventure", "Wilderness", "Yoga", etc],
    "specializations": ["Trauma/PTSD", "Anxiety", "Depression", "ADHD", "OCD", "Eating Disorders", "Substance Use", etc]
  },
  "structure": {
    "los": "length of stay if mentioned",
    "ratio": "staff to client ratio if mentioned"
  },
  "admissions": {
    "insurance": ["List ANY insurance mentioned: Aetna, BCBS, Cigna, United Healthcare, Humana, etc"]
  }
}

Be thorough - extract EVERY therapy, specialization, and insurance provider you find. Return ONLY valid JSON, no explanations.`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 2000
                    }
                })
            });
            
            if (!response.ok) {
                throw new Error('AI extraction failed');
            }
            
            const data = await response.json();
            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            // Parse JSON from response
            let jsonStr = aiText;
            const jsonMatch = aiText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
            if (jsonMatch) {
                jsonStr = jsonMatch[1];
            }
            
            const extracted = JSON.parse(jsonStr);
            
            // Add metadata
            extracted.meta = {
                sourcesAnalyzed: existingData.meta.sourcesAnalyzed,
                pagesScanned: existingData.meta.pagesScanned,
                confidence: existingData.meta.confidence,
                extractionMethod: 'AI (Gemini)'
            };
            
            return extracted;
            
        } catch (error) {
            console.warn('[WARNING] AI extraction failed');
            return null;
        }
    }
    
    // Extract data from page text
    function extractFromPage(data, text, doc, currentUrl) {
        // Location
        if (!data.city || !data.state) {
            const locationMatch = text.match(/([\w\s]+),\s*([A-Z]{2}|Florida|California|Texas|Arizona|Utah|Colorado)/i);
            if (locationMatch) {
                data.city = locationMatch[1].trim();
                data.state = locationMatch[2].length === 2 ? locationMatch[2] : getStateAbbr(locationMatch[2]);
            }
        }
        
        // Levels of care (offered here only; avoid step-down/referral language)
        if (/residential\s+(treatment|program|care)/i.test(text) && !data.levelsOfCare.includes('Residential')) {
            data.levelsOfCare.push('Residential');
        }
        const offeredHere = /(we\s+(offer|provide|operate)|our\s+(program|treatment)|level\s+of\s+care|on\s*site)/i;
        const notHere = /(aftercare|step[-\s]?down|transition|refer|referral|external|partner|discharge)/i;
        if ((/\bPHP\b|partial\s+hospitalization/i.test(text)) && offeredHere.test(text) && !notHere.test(text) && !data.levelsOfCare.includes('PHP')) data.levelsOfCare.push('PHP');
        if ((/\bIOP\b|intensive\s+outpatient/i.test(text)) && offeredHere.test(text) && !notHere.test(text) && !data.levelsOfCare.includes('IOP')) data.levelsOfCare.push('IOP');
        if (/outpatient/i.test(text) && offeredHere.test(text) && !data.levelsOfCare.includes('Outpatient') && !data.levelsOfCare.includes('IOP') && !notHere.test(text)) data.levelsOfCare.push('Outpatient');
        
        // Ages
        if (!data.population.ages) {
            const ageMatch = text.match(/ages?\s+(\d{1,2})[\s-]+(?:to|through)\s+(\d{1,2})/i);
            if (ageMatch) {
                data.population.ages = `${ageMatch[1]}-${ageMatch[2]}`;
            } else if (/young\s+adults?/i.test(text)) {
                data.population.ages = 'Young Adults';
            } else if (/adolescents?/i.test(text)) {
                data.population.ages = 'Adolescents';
            }
        }
        
        // Gender
        if (!data.population.gender) {
            if (/(young\s+men|\bmen\b|males)\b/i.test(text)) data.population.gender = 'Males Only';
            else if (/girls?\s+only|females?\s+only/i.test(text)) data.population.gender = 'Females Only';
            else if (/co[\s-]?ed|coeducational/i.test(text)) data.population.gender = 'Co-ed';
        }
        
        // Evidence-based therapies
        const ebTherapies = {
            'CBT': /\bCBT\b|cognitive[\s-]?behavioral/i,
            'DBT': /\bDBT\b|dialectical[\s-]?behav/i,
            'EMDR': /\bEMDR\b|eye\s+movement/i,
            'ACT': /\bACT\b|acceptance\s+and\s+commitment/i,
            'MI': /\bMI\b|motivational\s+interview/i,
            'TF-CBT': /TF[\s-]?CBT/i
        };
        
        Object.entries(ebTherapies).forEach(([therapy, pattern]) => {
            if (pattern.test(text) && !data.clinical.evidenceBased.includes(therapy)) {
                data.clinical.evidenceBased.push(therapy);
            }
        });
        
        // Experiential therapies
        const expTherapies = [
            'Art Therapy', 'Music Therapy', 'Equine Therapy',
            'Adventure Therapy', 'Wilderness Therapy',
            'Yoga', 'Mindfulness', 'Recreation Therapy'
        ];
        
        expTherapies.forEach(therapy => {
            if (new RegExp(therapy, 'i').test(text) && !data.clinical.experiential.includes(therapy)) {
                data.clinical.experiential.push(therapy);
            }
        });
        
        // Specializations
        const specs = {
            'Trauma/PTSD': /trauma|PTSD|post[\s-]?traumatic/i,
            'Anxiety': /anxiety\s+disorders?/i,
            'Depression': /depression|depressive/i,
            'ADHD': /ADHD|ADD|attention[\s-]?deficit/i,
            'OCD': /OCD|obsessive[\s-]?compulsive/i,
            'Eating Disorders': /eating\s+disorder|anorexia|bulimia/i,
            'Substance Use': /substance\s+(?:use|abuse)|addiction/i,
            'Self-Harm': /self[\s-]?harm|self[\s-]?injury/i,
            'Bipolar': /bipolar/i
        };
        
        Object.entries(specs).forEach(([spec, pattern]) => {
            if (pattern.test(text) && !data.clinical.specializations.includes(spec)) {
                data.clinical.specializations.push(spec);
            }
        });
        const sudHits = (text.match(/substance\s+(?:use|abuse)|addiction|chemical\s+dependency/ig) || []).length;
        if (sudHits >= 2) {
            const idx = data.clinical.specializations.indexOf('Substance Use');
            if (idx > 0) data.clinical.specializations.splice(idx, 1);
            if (idx !== 0) data.clinical.specializations.unshift('Substance Use');
        }
        
        // Length of stay
        if (!data.structure.los) {
            const losMatch = text.match(/(\d+)[\s-]*(?:to[\s-]*)?(\d+)?\s*(days?|weeks?|months?)\s+program/i);
            if (losMatch) {
                data.structure.los = losMatch[2] 
                    ? `${losMatch[1]}-${losMatch[2]} ${losMatch[3]}`
                    : `${losMatch[1]} ${losMatch[3]}`;
            }
        }
        // Therapy intensity
        if (!data.clinical.individualTherapyHours) {
            const ind = text.match(/(\d+)\s*(?:hours?)\s*(?:per\s*week)?[^\n]{0,20}individual\s+therapy/i);
            if (ind) data.clinical.individualTherapyHours = ind[1];
        }
        if (!data.clinical.groupTherapyHours) {
            const grp = text.match(/(\d+)\s*(?:hours?)\s*(?:per\s*week)?[^\n]{0,20}group\s+therapy/i);
            if (grp) data.clinical.groupTherapyHours = grp[1];
        }
        
        // Staff ratio
        if (!data.structure.ratio) {
            const ratioMatch = text.match(/(?:staff|therapist)[\s-]?to[\s-]?(?:student|client)[\s:]+(\d+)[\s:]+(\d+)/i);
            if (ratioMatch) {
                data.structure.ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
            }
        }
        
        // Academics
        if (!data.structure.academics.hasProgram && /on[\s-]?site\s+school|academic\s+program/i.test(text)) {
            data.structure.academics.hasProgram = true;
        }
        // Academic details
        if (!data.structure.academics.accreditation) {
            const acc = text.match(/accredit(?:ed|ation)\s*(?:by|through)?\s*([A-Za-z][A-Za-z\s&]+)/i);
            if (acc) data.structure.academics.accreditation = acc[1].trim();
        }
        if (!data.structure.academics.grades) {
            const grades = text.match(/grades?\s*([Kk]-?\s*12|\d{1,2}\s*-\s*\d{1,2})/i);
            if (grades) data.structure.academics.grades = grades[1].replace(/\s+/g,'');
        }
        if (/\bIEP\b|504\b/i.test(text)) data.structure.academics.iep504 = true;
        if (/credit\s*(recovery|transfer)/i.test(text)) data.structure.academics.creditSupport = true;
        
        // Family program
        if (/family\s+therapy/i.test(text)) data.family.weeklyTherapy = true;
        if (/parent\s+workshop/i.test(text)) data.family.workshops = true;
        
        // Environment
        if (!data.environment.setting) {
            if (/ocean|lagoon|river|inlet|waterfront|coast|beach/i.test(text)) data.environment.setting = 'Coastal';
            else if (/desert|sonoran/i.test(text)) data.environment.setting = 'Desert';
            else if (/mountain|foothills/i.test(text)) data.environment.setting = 'Mountain';
            else if (/ranch/i.test(text)) data.environment.setting = 'Ranch';
            else if (/rural/i.test(text)) data.environment.setting = 'Rural';
            else if (/urban|city/i.test(text)) data.environment.setting = 'Urban';
        }
        if (!data.environment.campusSizeAcre) {
            const acre = text.match(/(\d{2,4})\s*acres?/i);
            if (acre) data.environment.campusSizeAcre = acre[1];
        }
        
        // Staff / psychiatry
        const staffCreds = ['LCSW','LMFT','LPC','LPCC','LMHC','PhD','PsyD','MD','RN'];
        staffCreds.forEach(c => { if (new RegExp(`\\b${c}\\b`).test(text) && !data.staff.credentials.includes(c)) data.staff.credentials.push(c); });
        if (/psychiatrist|psychiatry/i.test(text)) data.staff.psychiatryPresent = true;
        
        // Insurance
        const insurers = ['Aetna', 'Anthem', 'BCBS', 'Blue Cross', 'Blue Shield', 'Cigna', 'United Healthcare', 'UnitedHealth', 'Humana', 'Kaiser'];
        insurers.forEach(insurer => {
            if (text.includes(insurer)) {
                if ((insurer === 'Blue Cross' || insurer === 'Blue Shield') && !data.admissions.insurance.includes('BCBS')) {
                    data.admissions.insurance.push('BCBS');
                } else if (!data.admissions.insurance.includes(insurer)) {
                    data.admissions.insurance.push(insurer);
                }
            }
        });
        if (/private\s*pay|self\s*pay/i.test(text)) data.admissions.privatePay = true;
        if (/out[-\s]?of[-\s]?network|\bOON\b/i.test(text)) data.admissions.outOfNetwork = true;
        if (/in[-\s]?network/i.test(text)) data.admissions.inNetwork = [...new Set([...data.admissions.inNetwork, ...data.admissions.insurance])];
        if (/financing|payment\s*plan|third[-\s]?party\s*financing/i.test(text)) data.admissions.financing = true;
        if (/scholarship/i.test(text)) data.admissions.scholarships = true;
        if (/medicaid|ahcccs/i.test(text)) data.admissions.medicaid = true;
        if (/medicare/i.test(text)) data.admissions.medicare = true;
        // Exclusions / contraindications
        const excl = text.match(/(?:cannot\s*accept|do\s*not\s*treat|not\s*appropriate\s*for)[:\s]+([^\.!\n]{5,120})/i);
        if (excl) data.admissions.exclusions.push(excl[1].trim());
        
        // Contact: prefer mailto/tel on page, same-domain emails; block analytics/builders
        if (!data.admissions.email) {
            try {
                const mailto = Array.from((doc||document).querySelectorAll('a[href^="mailto:"]'))
                    .map(a => (a.getAttribute('href')||'').replace(/^mailto:/,'').trim())
                    .filter(Boolean);
                const domain = (currentUrl ? new URL(currentUrl).hostname : location.hostname).replace(/^www\./,'');
                const block = /(wix|sentry|google|analytics|cloudfront)/i;
                const preferred = mailto.find(e => e.toLowerCase().endsWith(`@${domain}`)) || mailto.find(e => !block.test(e));
                const textEmail = (text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}/) || [])[0];
                const safeText = textEmail && !block.test(textEmail) ? textEmail : '';
                data.admissions.email = preferred || safeText || data.admissions.email || '';
            } catch {}
        }
        if (!data.admissions.phone) {
            try {
                const tel = Array.from((doc||document).querySelectorAll('a[href^="tel:"]'))
                    .map(a => (a.getAttribute('href')||'').replace(/^tel:/,'').trim())
                    .filter(Boolean);
                const visiblePhone = (text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/) || [])[0];
                data.admissions.phone = tel[0] || visiblePhone || data.admissions.phone || '';
            } catch {}
        }
        
        // Accreditations
        const accreds = ['Joint Commission', 'JCAHO', 'CARF', 'NATSAP', 'COA', 'NAATP'];
        accreds.forEach(accred => {
            if (text.includes(accred) && !data.quality.accreditations.includes(accred)) {
                data.quality.accreditations.push(accred);
            }
        });
    }
    
    // Merge data from AI enhancement
    function mergeData(target, source) {
        // Merge arrays without duplicates
        if (source.levelsOfCare) {
            target.levelsOfCare = [...new Set([...target.levelsOfCare, ...source.levelsOfCare])];
        }
        if (source.clinical?.evidenceBased) {
            target.clinical.evidenceBased = [...new Set([...target.clinical.evidenceBased, ...source.clinical.evidenceBased])];
        }
        if (source.clinical?.experiential) {
            target.clinical.experiential = [...new Set([...target.clinical.experiential, ...source.clinical.experiential])];
        }
        if (source.clinical?.specializations) {
            target.clinical.specializations = [...new Set([...target.clinical.specializations, ...source.clinical.specializations])];
        }
        if (source.admissions?.insurance) {
            target.admissions.insurance = [...new Set([...target.admissions.insurance, ...source.admissions.insurance])];
        }
        if (source.quality?.accreditations) {
            target.quality.accreditations = [...new Set([...target.quality.accreditations, ...source.quality.accreditations])];
        }
        
        // Fill in missing fields
        if (!target.city && source.city) target.city = source.city;
        if (!target.state && source.state) target.state = source.state;
        if (!target.population.ages && source.population?.ages) target.population.ages = source.population.ages;
        if (!target.population.gender && source.population?.gender) target.population.gender = source.population.gender;
        if (!target.structure.los && source.structure?.los) target.structure.los = source.structure.los;
        if (!target.structure.ratio && source.structure?.ratio) target.structure.ratio = source.structure.ratio;
        if (!target.admissions.phone && source.admissions?.phone) target.admissions.phone = source.admissions.phone;
        if (!target.admissions.email && source.admissions?.email) target.admissions.email = source.admissions.email;
    }
    
    // Consolidate and clean data
    function consolidateData(data) {
        // Remove duplicates
        data.levelsOfCare = [...new Set(data.levelsOfCare)];
        data.clinical.evidenceBased = [...new Set(data.clinical.evidenceBased)];
        data.clinical.experiential = [...new Set(data.clinical.experiential)];
        data.clinical.specializations = [...new Set(data.clinical.specializations)];
        data.admissions.insurance = [...new Set(data.admissions.insurance)];
        data.quality.accreditations = [...new Set(data.quality.accreditations)];
    }

    // Build top differentiators from extracted signals
    function buildDifferentiators(data) {
        const diffs = [];
        // Academics
        if (data.structure.academics.hasProgram) {
            const gradeNote = data.structure.academics.grades ? ` (grades ${data.structure.academics.grades})` : '';
            const accNote = data.structure.academics.accreditation ? `, ${data.structure.academics.accreditation} accredited` : '';
            diffs.push(`On-site academics${gradeNote}${accNote}`.trim());
        }
        // Setting and campus
        if (data.environment.setting) diffs.push(`${data.environment.setting} setting`);
        if (data.environment.campusSizeAcre) diffs.push(`${data.environment.campusSizeAcre} acre campus`);
        // Clinical strengths
        if (data.clinical.evidenceBased.length >= 3) diffs.push(`Strong EBPs: ${data.clinical.evidenceBased.slice(0,3).join(', ')}`);
        if (data.clinical.specializations.length >= 3) diffs.push(`Specializes in ${data.clinical.specializations.slice(0,3).join(', ').toLowerCase()}`);
        if (data.structure.ratio) diffs.push(`Staff-to-student ratio ${data.structure.ratio}`);
        if (data.structure.los) diffs.push(`Structured ${data.structure.los} program`);
        // Family
        if (data.family.weeklyTherapy) diffs.push('Weekly family therapy');
        // Admissions
        if (data.admissions.insurance.length > 0) diffs.push(`Insurance: ${data.admissions.insurance.slice(0,3).join(', ')}`);
        
        // Deduplicate and limit to 5
        return [...new Set(diffs)].slice(0, 5);
    }
    
    // Comprehensive rule-based extraction (fallback - not used anymore)
    function performComprehensiveExtraction() {
        const text = document.body?.innerText || '';
        
        const data = {
            name: extractProgramName(),
            city: '',
            state: '',
            levelsOfCare: [],
            population: { ages: '', gender: '' },
            clinical: {
                evidenceBased: [],
                experiential: [],
                specializations: []
            },
            structure: {
                los: '',
                ratio: '',
                academics: { hasProgram: false }
            },
            family: {
                weeklyTherapy: false,
                workshops: false
            },
            admissions: {
                insurance: [],
                phone: '',
                email: ''
            },
            quality: {
                accreditations: []
            },
            meta: {
                sourcesAnalyzed: 1,
                pagesScanned: [window.location.href],
                confidence: 0,
                extractionMethod: 'Rule-based'
            }
        };
        
        // Extract location
        const locationMatch = text.match(/([\w\s]+),\s*([A-Z]{2}|Florida|California|Texas)/i);
        if (locationMatch) {
            data.city = locationMatch[1].trim();
            data.state = locationMatch[2].length === 2 ? locationMatch[2] : getStateAbbr(locationMatch[2]);
        }
        
        // Levels of care
        if (/residential/i.test(text)) data.levelsOfCare.push('Residential');
        if (/\bPHP\b|partial\s+hospital/i.test(text)) data.levelsOfCare.push('PHP');
        if (/\bIOP\b|intensive\s+outpatient/i.test(text)) data.levelsOfCare.push('IOP');
        if (/outpatient/i.test(text) && !data.levelsOfCare.includes('IOP')) data.levelsOfCare.push('Outpatient');
        
        // Ages
        const ageMatch = text.match(/ages?\s+(\d{1,2})[\s-]+(?:to|through)\s+(\d{1,2})/i);
        if (ageMatch) {
            data.population.ages = `${ageMatch[1]}-${ageMatch[2]}`;
        } else if (/young\s+adults?/i.test(text)) {
            data.population.ages = 'Young Adults';
        } else if (/adolescents?/i.test(text)) {
            data.population.ages = 'Adolescents';
        }
        
        // Gender
        if (/boys?\s+only|males?\s+only/i.test(text)) {
            data.population.gender = 'Males Only';
        } else if (/girls?\s+only|females?\s+only/i.test(text)) {
            data.population.gender = 'Females Only';
        } else if (/co[\s-]?ed/i.test(text)) {
            data.population.gender = 'Co-ed';
        }
        
        // Evidence-based therapies
        const ebTherapies = ['CBT', 'DBT', 'EMDR', 'ACT', 'MI'];
        ebTherapies.forEach(therapy => {
            if (new RegExp(`\\b${therapy}\\b`, 'i').test(text)) {
                data.clinical.evidenceBased.push(therapy);
            }
        });
        
        // Experiential therapies
        const expTherapies = ['Art Therapy', 'Music Therapy', 'Equine', 'Adventure', 'Yoga'];
        expTherapies.forEach(therapy => {
            if (new RegExp(therapy, 'i').test(text)) {
                data.clinical.experiential.push(therapy);
            }
        });
        
        // Specializations
        if (/trauma|PTSD/i.test(text)) data.clinical.specializations.push('Trauma/PTSD');
        if (/anxiety/i.test(text)) data.clinical.specializations.push('Anxiety');
        if (/depression/i.test(text)) data.clinical.specializations.push('Depression');
        if (/ADHD/i.test(text)) data.clinical.specializations.push('ADHD');
        
        // Length of stay
        const losMatch = text.match(/(\d+)[\s-]*(?:to[\s-]*)?(\d+)?\s*(days?|weeks?|months?)/i);
        if (losMatch) {
            data.structure.los = losMatch[2] 
                ? `${losMatch[1]}-${losMatch[2]} ${losMatch[3]}`
                : `${losMatch[1]} ${losMatch[3]}`;
        }
        
        // Staff ratio
        const ratioMatch = text.match(/(\d+)[\s:]+(\d+)/i);
        if (ratioMatch) {
            data.structure.ratio = `${ratioMatch[1]}:${ratioMatch[2]}`;
        }
        
        // Academics
        if (/on[\s-]?site\s+school|academic\s+program/i.test(text)) {
            data.structure.academics.hasProgram = true;
        }
        
        // Family program
        if (/family\s+therapy/i.test(text)) data.family.weeklyTherapy = true;
        if (/parent\s+workshop/i.test(text)) data.family.workshops = true;
        
        // Insurance
        const insurers = ['Aetna', 'Anthem', 'BCBS', 'Cigna', 'United', 'Humana', 'Kaiser'];
        insurers.forEach(insurer => {
            if (text.includes(insurer)) {
                data.admissions.insurance.push(insurer);
            }
        });
        
        // Contact
        const phoneMatch = text.match(/\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}/);
        if (phoneMatch) data.admissions.phone = phoneMatch[0];
        
        const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
        if (emailMatch) data.admissions.email = emailMatch[0];
        
        // Accreditations
        const accreds = ['Joint Commission', 'CARF', 'NATSAP', 'COA'];
        accreds.forEach(accred => {
            if (text.includes(accred)) {
                data.quality.accreditations.push(accred);
            }
        });
        
        // Calculate confidence
        data.meta.confidence = calculateConfidence(data);
        
        return data;
    }
    
    // Helper functions
    function gatherPageContent() {
        const text = document.body?.innerText || '';
        return {
            url: window.location.href,
            title: document.title,
            text: text.substring(0, 15000) // Limit for API
        };
    }
    
    function extractProgramName() {
        // Try multiple sources
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            try {
                const data = JSON.parse(jsonLd.textContent);
                if (data.name) return data.name;
            } catch (e) {}
        }
        
        const ogName = document.querySelector('meta[property="og:site_name"]')?.content;
        if (ogName) return ogName;
        
        const h1 = document.querySelector('h1')?.textContent?.trim();
        if (h1 && h1.length < 100) return h1;
        
        return document.title.split(/[-|]/)[0].trim();
    }
    
    function getStateAbbr(stateName) {
        const states = {
            'Florida': 'FL', 'California': 'CA', 'Texas': 'TX',
            'Arizona': 'AZ', 'Utah': 'UT', 'Colorado': 'CO'
        };
        return states[stateName] || stateName;
    }
    
    function calculateConfidence(data) {
        let score = 0;
        let checks = 0;
        
        // Check key fields
        if (data.name) { score += 15; }
        checks += 15;
        
        if (data.city && data.state) { score += 10; }
        checks += 10;
        
        if (data.levelsOfCare?.length > 0) { score += 10; }
        checks += 10;
        
        if (data.population?.ages) { score += 10; }
        checks += 10;
        
        if (data.clinical?.evidenceBased?.length > 0) { score += 15; }
        checks += 15;
        
        if (data.clinical?.specializations?.length > 0) { score += 10; }
        checks += 10;
        
        if (data.admissions?.insurance?.length > 0) { score += 10; }
        checks += 10;
        
        if (data.admissions?.phone || data.admissions?.email) { score += 10; }
        checks += 10;
        
        if (data.quality?.accreditations?.length > 0) { score += 5; }
        checks += 5;
        
        if (data.structure?.los) { score += 5; }
        checks += 5;
        
        return Math.round((score / checks) * 100);
    }
    
})();
