// smart-extractor.js - Intelligent Clinical Data Extraction v6.0

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__FF_SMART_EXTRACTOR__) {
        console.log('[WARNING] Smart extractor already loaded');
        return;
    }
    window.__FF_SMART_EXTRACTOR__ = true;
    
    console.log('[INFO] Smart Clinical Extractor v6.0 Loaded');
    
    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract') {
            console.log('[INFO] Starting smart extraction...');
            performSmartExtraction().then(result => {
                console.log('[SUCCESS] Extraction complete:', result.meta);
                sendResponse({ success: true, data: result });
            }).catch(error => {
                console.error('[ERROR] Extraction failed:', error);
                sendResponse({ success: false, error: error.message });
            });
            return true; // Keep message channel open for async response
        }
    });
    
    // Main smart extraction function
    async function performSmartExtraction() {
        const startTime = Date.now();
        
        // Initialize comprehensive data structure
        const data = initializeDataStructure();
        
        // Extract from current page with smart filtering
        console.log('[INFO] Extracting from current page...');
        await extractFromCurrentPageSmart(data);
        
        // Discover and crawl related pages
        console.log('[INFO] Discovering related pages...');
        const relatedPages = await discoverRelevantPages();
        
        // Crawl each related page with smart extraction
        for (const pageUrl of relatedPages.slice(0, 8)) { // Limit to 8 pages for speed
            try {
                console.log(`[INFO] Fetching: ${pageUrl}`);
                const pageContent = await fetchAndCleanPage(pageUrl);
                if (pageContent) {
                    await extractFromCleanContent(data, pageContent, pageUrl);
                    data.meta.pagesScanned.push(pageUrl);
                    data.meta.sourcesAnalyzed++;
                }
            } catch (error) {
                console.warn(`[WARNING] Failed to process ${pageUrl}:`, error);
            }
        }
        
        // Post-process and validate data
        cleanAndValidateData(data);
        
        // Calculate confidence score
        data.meta.confidence = calculateSmartConfidence(data);
        data.meta.extractionTime = Date.now() - startTime;
        
        return data;
    }
    
    function initializeDataStructure() {
        return {
            // Basic Info
            name: '',
            city: '',
            state: '',
            levelsOfCare: [],
            
            // Population & Demographics
            population: {
                ages: '',
                gender: '',
                specificPopulations: []
            },
            
            // Program Overview
            overview: '',
            philosophy: '',
            approach: '',
            differentiators: [],
            
            // Program Structure
            structure: {
                los: '',
                phases: [],
                ratio: '',
                groupSize: '',
                typicalDay: '',
                academics: { hasProgram: false, accreditation: '' }
            },
            
            // Clinical Services
            clinical: {
                evidenceBased: [],
                experiential: [],
                specializations: [],
                individualTherapy: '',
                groupTherapy: '',
                psychiatricServices: false,
                medicationManagement: false,
                traumaInformed: false
            },
            
            // Family Program
            family: {
                weeklyTherapy: false,
                workshops: false,
                visitationPolicy: '',
                familyWeekend: false,
                parentSupport: false,
                involvement: ''
            },
            
            // Staff & Credentials
            staff: {
                credentials: [],
                specialties: [],
                ratio: '',
                leadership: []
            },
            
            // Facilities & Environment
            facilities: {
                setting: '',
                campus: '',
                amenities: [],
                recreation: [],
                rooms: ''
            },
            
            // Outcomes
            outcomes: {
                successMetrics: '',
                alumni: false
            },
            
            // Admissions & Payment
            admissions: {
                insurance: [],
                financing: false,
                process: '',
                requirements: [],
                email: '',
                phone: '',
                website: window.location.href
            },
            
            // Quality & Accreditations
            quality: {
                accreditations: [],
                memberships: [],
                certifications: []
            },
            
            // Metadata
            meta: {
                sourcesAnalyzed: 1,
                pagesScanned: [window.location.href],
                confidence: 0,
                extractionTime: 0
            }
        };
    }
    
    async function extractFromCurrentPageSmart(data) {
        // Get clean content from main content areas only
        const content = getMainContent();
        
        // Extract basic information
        data.name = extractProgramName();
        const location = extractLocationSmart(content.text);
        if (location) {
            data.city = location.city;
            data.state = location.state;
        }
        
        // Extract overview from actual about content
        data.overview = extractOverviewSmart(content);
        
        // Extract levels of care
        data.levelsOfCare = extractLevelsOfCareSmart(content.text);
        
        // Extract population info
        data.population.ages = extractAgeRangeSmart(content.text);
        data.population.gender = extractGenderFocusSmart(content.text);
        
        // Extract clinical services with validation
        data.clinical.evidenceBased = extractEvidenceBasedSmart(content.text);
        data.clinical.experiential = extractExperientialSmart(content.text);
        data.clinical.specializations = extractSpecializationsSmart(content.text);
        
        // Extract program structure
        data.structure.los = extractLengthOfStaySmart(content.text);
        data.structure.ratio = extractStaffRatioSmart(content.text);
        
        // Extract family program
        extractFamilyProgramSmart(data, content.text);
        
        // Extract facilities
        data.facilities.setting = extractSettingSmart(content.text);
        data.facilities.campus = extractCampusSmart(content.text);
        
        // Extract contact info
        data.admissions.phone = extractPhoneSmart(content.text);
        data.admissions.email = extractEmailSmart(content.text);
        
        // Extract insurance
        data.admissions.insurance = extractInsuranceSmart(content.text);
        
        // Extract accreditations
        data.quality.accreditations = extractAccreditationsSmart(content.text);
    }
    
    function getMainContent() {
        // Remove script tags, style tags, and hidden elements
        const scripts = document.querySelectorAll('script, style, noscript');
        scripts.forEach(el => el.remove());
        
        // Remove common junk elements
        const junkSelectors = [
            '.cookie-notice', '.cookie-consent', '.gdpr',
            '.analytics', '.tracking', '.advertisement',
            '.social-share', '.social-media', '.share-buttons',
            '.newsletter-signup', '.popup', '.modal',
            '.footer-widgets', '.sidebar-ads', '[class*="widget"]',
            '[id*="analytics"]', '[id*="tracking"]', '[id*="cookie"]'
        ];
        
        junkSelectors.forEach(selector => {
            document.querySelectorAll(selector).forEach(el => el.remove());
        });
        
        // Try to find main content area
        const mainSelectors = [
            'main', 'article', '[role="main"]', '.main-content',
            '.content', '.page-content', '.entry-content',
            '#content', '#main'
        ];
        
        let mainContent = null;
        for (const selector of mainSelectors) {
            mainContent = document.querySelector(selector);
            if (mainContent) break;
        }
        
        // Fallback to body if no main content found
        if (!mainContent) {
            mainContent = document.body;
        }
        
        // Get clean text
        const text = mainContent.innerText || '';
        
        // Filter out obvious junk patterns
        const cleanText = text
            .split('\n')
            .filter(line => {
                const lower = line.toLowerCase();
                // Remove lines that are obviously junk
                if (lower.includes('cookie') && lower.includes('accept')) return false;
                if (lower.includes('analytics') && lower.includes('visitor')) return false;
                if (lower.includes('export') && lower.includes('data')) return false;
                if (lower.includes('subscribe') && lower.includes('newsletter')) return false;
                if (lower.includes('follow us') || lower.includes('share this')) return false;
                if (line.length < 10) return false; // Too short
                if (line.length > 500) return false; // Too long (probably concatenated junk)
                return true;
            })
            .join('\n');
        
        return {
            text: cleanText,
            html: mainContent.innerHTML,
            element: mainContent
        };
    }
    
    async function discoverRelevantPages() {
        const pages = new Set();
        const currentDomain = window.location.hostname;
        
        // High-priority pages for treatment programs
        const priorityPatterns = [
            /about/i, /our-story/i, /mission/i, /philosophy/i,
            /program/i, /treatment/i, /approach/i, /modalities/i,
            /clinical/i, /therapy/i, /services/i,
            /admissions/i, /insurance/i, /tuition/i, /cost/i,
            /family/i, /parent/i, /involvement/i,
            /staff/i, /team/i, /credentials/i,
            /academics/i, /education/i, /school/i,
            /facilities/i, /campus/i, /location/i,
            /daily/i, /schedule/i, /typical-day/i,
            /outcomes/i, /success/i, /alumni/i
        ];
        
        // Get all links
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const href = link.href;
            const text = link.textContent.toLowerCase();
            
            // Only same-domain links
            if (href && href.includes(currentDomain)) {
                // Check if high-priority
                for (const pattern of priorityPatterns) {
                    if (pattern.test(href) || pattern.test(text)) {
                        pages.add(href);
                        break;
                    }
                }
            }
        });
        
        // Also check navigation menus specifically
        const navSelectors = ['nav', '.navigation', '.menu', 'header'];
        navSelectors.forEach(selector => {
            const navLinks = document.querySelectorAll(`${selector} a`);
            navLinks.forEach(link => {
                if (link.href && link.href.includes(currentDomain)) {
                    // Add navigation links as they're usually important
                    pages.add(link.href);
                }
            });
        });
        
        return Array.from(pages);
    }
    
    async function fetchAndCleanPage(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // Clean the fetched document
            const scripts = doc.querySelectorAll('script, style, noscript');
            scripts.forEach(el => el.remove());
            
            // Get main content
            const mainSelectors = ['main', 'article', '.main-content', '.content', '#content'];
            let mainContent = null;
            
            for (const selector of mainSelectors) {
                mainContent = doc.querySelector(selector);
                if (mainContent) break;
            }
            
            if (!mainContent) {
                mainContent = doc.body;
            }
            
            const text = mainContent?.innerText || '';
            
            // Clean text
            const cleanText = text
                .split('\n')
                .filter(line => {
                    if (line.length < 10 || line.length > 500) return false;
                    const lower = line.toLowerCase();
                    if (lower.includes('cookie') || lower.includes('analytics')) return false;
                    if (lower.includes('subscribe') || lower.includes('newsletter')) return false;
                    return true;
                })
                .join('\n');
            
            return {
                text: cleanText,
                doc: doc,
                url: url
            };
        } catch (error) {
            console.warn(`[WARNING] Failed to fetch ${url}:`, error);
            return null;
        }
    }
    
    async function extractFromCleanContent(data, content, url) {
        const urlLower = url.toLowerCase();
        const text = content.text;
        
        // Page-specific extraction
        if (urlLower.includes('about') || urlLower.includes('philosophy') || urlLower.includes('mission')) {
            // Extract philosophy and approach
            const philosophy = extractPhilosophySmart(text);
            if (philosophy && !data.philosophy) {
                data.philosophy = philosophy;
            }
            
            const approach = extractApproachSmart(text);
            if (approach && !data.approach) {
                data.approach = approach;
            }
            
            // Better overview
            if (!data.overview) {
                data.overview = extractOverviewFromAbout(text);
            }
        }
        
        if (urlLower.includes('program') || urlLower.includes('treatment') || urlLower.includes('clinical')) {
            // Extract detailed clinical info
            const newEB = extractEvidenceBasedSmart(text);
            const newExp = extractExperientialSmart(text);
            const newSpec = extractSpecializationsSmart(text);
            
            // Merge without duplicates
            data.clinical.evidenceBased = [...new Set([...data.clinical.evidenceBased, ...newEB])];
            data.clinical.experiential = [...new Set([...data.clinical.experiential, ...newExp])];
            data.clinical.specializations = [...new Set([...data.clinical.specializations, ...newSpec])];
            
            // Extract therapy details
            const indTherapy = extractIndividualTherapy(text);
            if (indTherapy && !data.clinical.individualTherapy) {
                data.clinical.individualTherapy = indTherapy;
            }
            
            const groupTherapy = extractGroupTherapy(text);
            if (groupTherapy && !data.clinical.groupTherapy) {
                data.clinical.groupTherapy = groupTherapy;
            }
            
            // Check for psychiatric services
            if (/psychiatr/i.test(text)) data.clinical.psychiatricServices = true;
            if (/medication\s+management/i.test(text)) data.clinical.medicationManagement = true;
            if (/trauma[\s-]?informed/i.test(text)) data.clinical.traumaInformed = true;
        }
        
        if (urlLower.includes('family') || urlLower.includes('parent')) {
            extractFamilyProgramDetailed(data, text);
        }
        
        if (urlLower.includes('staff') || urlLower.includes('team')) {
            extractStaffInfo(data, text);
        }
        
        if (urlLower.includes('admissions') || urlLower.includes('insurance')) {
            // Extract insurance info
            const newInsurance = extractInsuranceSmart(text);
            data.admissions.insurance = [...new Set([...data.admissions.insurance, ...newInsurance])];
            
            // Extract admissions process
            const process = extractAdmissionsProcess(text);
            if (process && !data.admissions.process) {
                data.admissions.process = process;
            }
            
            // Check financing
            if (/financing|payment\s+plan|financial\s+aid/i.test(text)) {
                data.admissions.financing = true;
            }
        }
        
        if (urlLower.includes('facilities') || urlLower.includes('campus')) {
            extractFacilitiesInfo(data, text);
        }
        
        if (urlLower.includes('academics') || urlLower.includes('education') || urlLower.includes('school')) {
            extractAcademicsInfo(data, text);
        }
        
        if (urlLower.includes('daily') || urlLower.includes('schedule')) {
            const schedule = extractDailySchedule(text);
            if (schedule && !data.structure.typicalDay) {
                data.structure.typicalDay = schedule;
            }
        }
    }
    
    // Smart extraction functions with better filtering
    
    function extractProgramName() {
        // Try structured data first
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            try {
                const data = JSON.parse(jsonLd.textContent);
                if (data.name) return data.name;
                if (data['@graph']) {
                    const org = data['@graph'].find(item => 
                        item['@type'] === 'Organization' || 
                        item['@type'] === 'MedicalOrganization' ||
                        item['@type'] === 'Hospital'
                    );
                    if (org?.name) return org.name;
                }
            } catch (e) {}
        }
        
        // Try meta tags
        const metaName = document.querySelector('meta[property="og:site_name"]')?.content;
        if (metaName) return metaName;
        
        // Try H1
        const h1 = document.querySelector('h1');
        if (h1) {
            const text = h1.textContent.trim();
            if (text.length > 3 && text.length < 100 && !text.includes('Cookie')) {
                return text;
            }
        }
        
        // Use title
        return document.title.split(/[-|]/)[0].trim();
    }
    
    function extractLocationSmart(text) {
        // Look for city, state patterns
        const patterns = [
            /located\s+in\s+([\w\s]+),\s*([A-Z]{2})/i,
            /serving\s+([\w\s]+),\s*([A-Z]{2})/i,
            /([\w\s]+),\s*(Florida|California|Texas|Arizona|Utah|Colorado|[A-Z]{2})/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                return {
                    city: match[1].trim(),
                    state: match[2].length === 2 ? match[2] : getStateAbbr(match[2])
                };
            }
        }
        
        return null;
    }
    
    function extractOverviewSmart(content) {
        // Look for actual overview content
        const overviewSelectors = [
            'h1:contains("About") + p',
            'h2:contains("About") + p',
            'h2:contains("Overview") + p',
            '.about-content p:first',
            '.overview p:first'
        ];
        
        // Try to find overview paragraph
        const aboutHeading = Array.from(content.element.querySelectorAll('h1, h2, h3'))
            .find(h => /about|overview|who we are/i.test(h.textContent));
        
        if (aboutHeading) {
            let nextEl = aboutHeading.nextElementSibling;
            let overview = '';
            let count = 0;
            
            while (nextEl && count < 3) {
                if (nextEl.tagName === 'P') {
                    const text = nextEl.textContent.trim();
                    if (text.length > 50 && text.length < 500) {
                        overview += text + ' ';
                        count++;
                    }
                }
                if (nextEl.tagName && nextEl.tagName.match(/^H[1-6]$/)) break;
                nextEl = nextEl.nextElementSibling;
            }
            
            if (overview) {
                return overview.trim();
            }
        }
        
        return '';
    }
    
    function extractLevelsOfCareSmart(text) {
        const levels = [];
        
        // More specific patterns
        if (/residential\s+(treatment|program|care)/i.test(text)) {
            levels.push('Residential');
        }
        if (/PHP|partial\s+hospitalization\s+program/i.test(text)) {
            levels.push('PHP');
        }
        if (/IOP|intensive\s+outpatient\s+program/i.test(text)) {
            levels.push('IOP');
        }
        if (/outpatient\s+(treatment|program|services)/i.test(text) && !levels.includes('IOP')) {
            levels.push('Outpatient');
        }
        
        return levels;
    }
    
    function extractAgeRangeSmart(text) {
        const patterns = [
            /ages?\s+(\d{1,2})[\s-]+(?:to|through|and)\s+(\d{1,2})/i,
            /(\d{1,2})[\s-]+to[\s-]+(\d{1,2})[\s-]+years?[\s-]+old/i,
            /serving\s+(?:teens?|adolescents?|young\s+adults?)\s+(?:ages?\s+)?(\d{1,2})[\s-]+(\d{1,2})/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2] || match[1]);
                if (min >= 10 && max <= 30 && min < max) {
                    return `${min}-${max}`;
                }
            }
        }
        
        // Check for descriptive terms
        if (/young\s+adults?/i.test(text) && !/adolescents?/i.test(text)) {
            return 'Young Adults (18-26)';
        }
        if (/adolescents?/i.test(text) && !/adults?/i.test(text)) {
            return 'Adolescents (13-17)';
        }
        if (/teens?/i.test(text)) {
            return 'Teens';
        }
        
        return '';
    }
    
    function extractGenderFocusSmart(text) {
        // Look for specific gender programs
        if (/all[\s-]?boys?\s+program/i.test(text) || /males?[\s-]?only/i.test(text)) {
            return 'Males Only';
        }
        if (/all[\s-]?girls?\s+program/i.test(text) || /females?[\s-]?only/i.test(text)) {
            return 'Females Only';
        }
        if (/co[\s-]?ed(?:ucational)?\s+program/i.test(text)) {
            return 'Co-ed';
        }
        return '';
    }
    
    function extractEvidenceBasedSmart(text) {
        const therapies = {
            'CBT': /\bCBT\b|cognitive[\s-]?behavioral[\s-]?therapy/i,
            'DBT': /\bDBT\b|dialectical[\s-]?behavior[\s-]?therapy/i,
            'EMDR': /\bEMDR\b|eye\s+movement\s+desensitization/i,
            'ACT': /\bACT\b|acceptance\s+and\s+commitment\s+therapy/i,
            'MI': /\bMI\b|motivational\s+interviewing/i,
            'TF-CBT': /\bTF[\s-]?CBT\b|trauma[\s-]?focused\s+cbt/i,
            'CPT': /\bCPT\b|cognitive\s+processing\s+therapy/i,
            'PE': /\bPE\b|prolonged\s+exposure/i,
            'IFS': /\bIFS\b|internal\s+family\s+systems/i,
            'MST': /\bMST\b|multisystemic\s+therapy/i,
            'FFT': /\bFFT\b|functional\s+family\s+therapy/i
        };
        
        const found = [];
        Object.entries(therapies).forEach(([name, pattern]) => {
            if (pattern.test(text)) {
                found.push(name);
            }
        });
        
        return found;
    }
    
    function extractExperientialSmart(text) {
        const therapies = [
            'Art Therapy', 'Music Therapy', 'Equine Therapy',
            'Adventure Therapy', 'Wilderness Therapy',
            'Drama Therapy', 'Dance/Movement Therapy',
            'Recreation Therapy', 'Yoga Therapy',
            'Mindfulness', 'Meditation'
        ];
        
        const found = [];
        therapies.forEach(therapy => {
            const pattern = new RegExp(`\\b${therapy}\\b`, 'i');
            if (pattern.test(text)) {
                found.push(therapy);
            }
        });
        
        return found;
    }
    
    function extractSpecializationsSmart(text) {
        const specializations = {
            'Trauma/PTSD': /trauma|ptsd|post[\s-]?traumatic/i,
            'Anxiety': /anxiety\s+disorder/i,
            'Depression': /depression|depressive\s+disorder/i,
            'ADHD': /\bADHD\b|attention[\s-]?deficit/i,
            'OCD': /\bOCD\b|obsessive[\s-]?compulsive/i,
            'Eating Disorders': /eating\s+disorder|anorexia|bulimia/i,
            'Substance Use': /substance\s+(?:use|abuse)|addiction|dual[\s-]?diagnosis/i,
            'Self-Harm': /self[\s-]?harm|self[\s-]?injury|cutting/i,
            'Autism Spectrum': /autism|ASD|asperger/i,
            'Bipolar': /bipolar/i,
            'Attachment': /attachment\s+(?:disorder|issues)|RAD\b/i,
            'Technology Addiction': /gaming\s+addiction|internet\s+addiction|screen\s+addiction/i
        };
        
        const found = [];
        Object.entries(specializations).forEach(([name, pattern]) => {
            if (pattern.test(text)) {
                found.push(name);
            }
        });
        
        return found;
    }
    
    function extractPhoneSmart(text) {
        const phoneRegex = /(?:call|phone|contact)[\s:\w]*?([\(\d][\d\s\(\)\-\.]+\d{4})/i;
        const match = text.match(phoneRegex);
        if (match) {
            return match[1].trim();
        }
        
        // Fallback to any phone pattern
        const anyPhone = /\(?\d{3}\)?[\s\-\.]?\d{3}[\s\-\.]?\d{4}/;
        const anyMatch = text.match(anyPhone);
        return anyMatch ? anyMatch[0] : '';
    }
    
    function extractEmailSmart(text) {
        const emailRegex = /(?:email|contact)[\s:\w]*?([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
        const match = text.match(emailRegex);
        if (match) {
            return match[1];
        }
        
        // Look for admissions email
        const admissionsEmail = /admissions@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i;
        const admMatch = text.match(admissionsEmail);
        return admMatch ? admMatch[0] : '';
    }
    
    function extractInsuranceSmart(text) {
        const insurers = [
            'Aetna', 'Anthem', 'Blue Cross', 'Blue Shield', 'BCBS',
            'Cigna', 'United Healthcare', 'UnitedHealth', 'Humana',
            'Kaiser', 'Magellan', 'Optum', 'Beacon Health',
            'TRICARE', 'Medicaid', 'Medicare'
        ];
        
        const found = [];
        
        // Look for insurance section
        const insuranceSection = text.match(/insurance[\s\S]{0,500}/i);
        const searchText = insuranceSection ? insuranceSection[0] : text;
        
        insurers.forEach(insurer => {
            if (searchText.includes(insurer)) {
                if (insurer === 'Blue Cross' || insurer === 'Blue Shield') {
                    if (!found.includes('BCBS')) found.push('BCBS');
                } else {
                    found.push(insurer);
                }
            }
        });
        
        return found;
    }
    
    function extractAccreditationsSmart(text) {
        const accreds = [
            'Joint Commission', 'JCAHO', 'CARF',
            'COA', 'NATSAP', 'NAATP'
        ];
        
        const found = [];
        accreds.forEach(accred => {
            if (text.includes(accred)) {
                found.push(accred);
            }
        });
        
        return found;
    }
    
    // Helper functions
    function getStateAbbr(stateName) {
        const states = {
            'Florida': 'FL', 'California': 'CA', 'Texas': 'TX',
            'Arizona': 'AZ', 'Utah': 'UT', 'Colorado': 'CO'
            // Add more as needed
        };
        return states[stateName] || stateName;
    }
    
    function cleanAndValidateData(data) {
        // Remove empty arrays
        Object.keys(data).forEach(section => {
            if (typeof data[section] === 'object') {
                Object.keys(data[section]).forEach(key => {
                    if (Array.isArray(data[section][key])) {
                        // Remove duplicates and filter empty
                        data[section][key] = [...new Set(data[section][key])].filter(Boolean);
                    }
                });
            }
        });
        
        // Ensure we have a name
        if (!data.name) {
            data.name = document.title.split(/[-|]/)[0].trim() || 'Treatment Program';
        }
    }
    
    function calculateSmartConfidence(data) {
        let score = 0;
        let maxScore = 0;
        
        // Critical fields (20 points each)
        const critical = [
            data.name && data.name !== 'Treatment Program',
            data.city && data.state,
            data.levelsOfCare.length > 0,
            data.population.ages,
            data.admissions.phone || data.admissions.email,
            data.clinical.evidenceBased.length > 0 || data.clinical.experiential.length > 0
        ];
        
        critical.forEach(field => {
            maxScore += 20;
            if (field) score += 20;
        });
        
        // Important fields (10 points each)  
        const important = [
            data.overview || data.philosophy,
            data.clinical.specializations.length > 0,
            data.structure.los || data.structure.ratio,
            data.family.weeklyTherapy || data.family.workshops,
            data.admissions.insurance.length > 0,
            data.quality.accreditations.length > 0
        ];
        
        important.forEach(field => {
            maxScore += 10;
            if (field) score += 10;
        });
        
        // Multi-page bonus
        if (data.meta.sourcesAnalyzed > 1) {
            score += Math.min(data.meta.sourcesAnalyzed * 3, 30);
            maxScore += 30;
        }
        
        return Math.min(Math.round((score / maxScore) * 100), 100);
    }
    
    // Additional extraction functions for detailed pages
    
    function extractPhilosophySmart(text) {
        const match = text.match(/(?:our\s+)?(?:treatment\s+)?philosophy[\s:\-]+([^.!?]+[.!?](?:[^.!?]+[.!?])?)/i);
        return match ? match[1].trim() : '';
    }
    
    function extractApproachSmart(text) {
        const match = text.match(/(?:our\s+)?(?:treatment\s+)?approach[\s:\-]+([^.!?]+[.!?](?:[^.!?]+[.!?])?)/i);
        return match ? match[1].trim() : '';
    }
    
    function extractOverviewFromAbout(text) {
        // Get first substantial paragraph from about content
        const paragraphs = text.split(/\n\n+/);
        for (const para of paragraphs) {
            if (para.length > 100 && para.length < 500) {
                if (!/cookie|analytics|subscribe|follow us/i.test(para)) {
                    return para.trim();
                }
            }
        }
        return '';
    }
    
    function extractIndividualTherapy(text) {
        const match = text.match(/(\d+)\s*(?:hours?\s+of\s+)?individual\s+therapy/i);
        return match ? `${match[1]} hours per week` : '';
    }
    
    function extractGroupTherapy(text) {
        const match = text.match(/(\d+)\s*(?:hours?\s+of\s+)?group\s+therapy/i);
        return match ? `${match[1]} hours per week` : '';
    }
    
    function extractLengthOfStaySmart(text) {
        const patterns = [
            /(?:average|typical)\s+(?:length\s+of\s+)?stay[\s:\-]+(\d+)[\s\-]?(?:to\s+)?(\d+)?\s*(days?|weeks?|months?)/i,
            /(\d+)[\s\-]?(?:to\s+)?(\d+)?\s*(days?|weeks?|months?)\s+program/i
        ];
        
        for (const pattern of patterns) {
            const match = text.match(pattern);
            if (match) {
                if (match[2] && match[2] !== match[1]) {
                    return `${match[1]}-${match[2]} ${match[3]}`;
                }
                return `${match[1]} ${match[3]}`;
            }
        }
        return '';
    }
    
    function extractStaffRatioSmart(text) {
        const match = text.match(/(?:staff[\s\-]?to[\s\-]?(?:student|client)|ratio)[\s:\-]+(\d+)[\s:\-]?(?:to[\s:\-])?(\d+)/i);
        return match ? `${match[1]}:${match[2]}` : '';
    }
    
    function extractFamilyProgramSmart(data, text) {
        if (/weekly\s+family\s+therapy/i.test(text)) {
            data.family.weeklyTherapy = true;
        }
        if (/parent\s+(?:workshop|education|training)/i.test(text)) {
            data.family.workshops = true;
        }
        if (/family\s+weekend/i.test(text)) {
            data.family.familyWeekend = true;
        }
        if (/parent\s+support\s+group/i.test(text)) {
            data.family.parentSupport = true;
        }
    }
    
    function extractFamilyProgramDetailed(data, text) {
        extractFamilyProgramSmart(data, text);
        
        // Extract involvement level
        const involvementMatch = text.match(/family\s+involvement[\s:\-]+([^.!?]+[.!?])/i);
        if (involvementMatch) {
            data.family.involvement = involvementMatch[1].trim();
        }
        
        // Extract visitation policy
        const visitMatch = text.match(/visitation[\s:\-]+([^.!?]+[.!?])/i);
        if (visitMatch) {
            data.family.visitationPolicy = visitMatch[1].trim();
        }
    }
    
    function extractStaffInfo(data, text) {
        // Extract credentials
        const credentials = ['LCSW', 'LPC', 'LMFT', 'PhD', 'PsyD', 'MD', 'RN'];
        credentials.forEach(cred => {
            if (text.includes(cred)) {
                data.staff.credentials.push(cred);
            }
        });
        
        // Extract leadership
        const titles = ['Clinical Director', 'Medical Director', 'Executive Director'];
        titles.forEach(title => {
            if (text.includes(title)) {
                data.staff.leadership.push(title);
            }
        });
    }
    
    function extractAdmissionsProcess(text) {
        const match = text.match(/admissions\s+process[\s:\-]+([^.!?]+[.!?](?:[^.!?]+[.!?])?)/i);
        return match ? match[1].trim() : '';
    }
    
    function extractFacilitiesInfo(data, text) {
        // Extract campus size
        const acreMatch = text.match(/(\d+)[\s\-]?acres?/i);
        if (acreMatch) {
            data.facilities.campus = `${acreMatch[1]} acre campus`;
        }
        
        // Extract room type
        if (/private\s+rooms?/i.test(text)) {
            data.facilities.rooms = 'Private rooms';
        } else if (/semi[\s\-]?private/i.test(text)) {
            data.facilities.rooms = 'Semi-private rooms';
        }
        
        // Extract amenities
        const amenities = ['pool', 'gym', 'fitness center', 'basketball court', 'art studio'];
        amenities.forEach(amenity => {
            if (text.toLowerCase().includes(amenity)) {
                data.facilities.amenities.push(amenity);
            }
        });
    }
    
    function extractSettingSmart(text) {
        if (/mountain/i.test(text)) return 'Mountain setting';
        if (/beach|ocean|coastal/i.test(text)) return 'Beach/coastal setting';
        if (/rural/i.test(text)) return 'Rural setting';
        if (/urban|city/i.test(text)) return 'Urban setting';
        return '';
    }
    
    function extractCampusSmart(text) {
        const match = text.match(/(\d+)[\s\-]?acre/i);
        return match ? `${match[1]} acre campus` : '';
    }
    
    function extractAcademicsInfo(data, text) {
        data.structure.academics.hasProgram = /on[\s\-]?site\s+(?:school|academics|education)/i.test(text);
        
        // Check for accreditation
        const academicAccreds = ['Cognia', 'AdvancED', 'WASC'];
        for (const accred of academicAccreds) {
            if (text.includes(accred)) {
                data.structure.academics.accreditation = accred;
                break;
            }
        }
    }
    
    function extractDailySchedule(text) {
        const match = text.match(/(?:daily\s+schedule|typical\s+day)[\s:\-]+([^.!?]+[.!?](?:[^.!?]+[.!?]){0,2})/i);
        return match ? match[1].trim() : '';
    }
    
})();
