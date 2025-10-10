// extraction-engine.js - Professional Data Extraction Engine v4.0
// This actually works and extracts comprehensive data

(function() {
    'use strict';
    
    // Prevent duplicate loading
    if (window.__FF_PRO_LOADED__) return;
    window.__FF_PRO_LOADED__ = true;
    
    console.log('🚀 Family First Pro Extractor v4.0 Loaded');
    
    // Listen for extraction requests
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'extract') {
            console.log('📊 Starting comprehensive extraction...');
            const result = performComprehensiveExtraction();
            console.log('✅ Extraction complete:', result.summary);
            sendResponse({ success: true, data: result });
        }
        return true;
    });
    
    // Main extraction function that actually gets ALL the data
    function performComprehensiveExtraction() {
        const startTime = Date.now();
        
        // Get all text content for analysis
        const pageText = document.body?.innerText || '';
        const pageHtml = document.body?.innerHTML || '';
        
        // Initialize comprehensive data structure
        const data = {
            // Basic Information
            programName: extractProgramName(),
            url: window.location.href,
            domain: window.location.hostname,
            extractedAt: new Date().toISOString(),
            
            // Contact Information
            contact: {
                phones: extractPhoneNumbers(pageText),
                emails: extractEmails(pageText),
                address: extractAddress(pageText),
                location: extractLocation(pageText),
                website: window.location.href,
                socialMedia: extractSocialMedia(pageHtml)
            },
            
            // Demographics & Population
            demographics: {
                agesServed: extractAgeRanges(pageText),
                genders: extractGenders(pageText),
                populations: extractPopulations(pageText)
            },
            
            // Clinical Services
            clinical: {
                therapies: extractTherapies(pageText),
                modalities: extractTreatmentModalities(pageText),
                specializations: extractSpecializations(pageText),
                levelOfCare: extractLevelOfCare(pageText),
                programLength: extractProgramLength(pageText)
            },
            
            // Program Details
            program: {
                approach: extractApproach(pageText),
                philosophy: extractPhilosophy(pageText),
                dailySchedule: extractSchedule(pageText),
                phases: extractProgramPhases(pageText),
                ratio: extractStaffRatio(pageText),
                capacity: extractCapacity(pageText)
            },
            
            // Staff & Credentials
            staff: {
                credentials: extractStaffCredentials(pageText),
                teamSize: extractTeamSize(pageText),
                leadership: extractLeadership(pageText),
                specialties: extractStaffSpecialties(pageText)
            },
            
            // Education & Academics
            education: {
                hasAcademics: checkForAcademics(pageText),
                accreditation: extractAcademicAccreditation(pageText),
                grades: extractGradeLevels(pageText),
                specialEd: checkSpecialEducation(pageText)
            },
            
            // Family Involvement
            family: {
                familyProgram: checkFamilyProgram(pageText),
                familyTherapy: checkFamilyTherapy(pageText),
                parentEducation: checkParentEducation(pageText),
                visitation: extractVisitation(pageText)
            },
            
            // Insurance & Payment
            payment: {
                insurance: extractInsuranceProviders(pageText),
                acceptsInsurance: checkInsuranceAcceptance(pageText),
                financialAid: checkFinancialAid(pageText),
                paymentOptions: extractPaymentOptions(pageText)
            },
            
            // Facilities & Amenities
            facilities: {
                setting: extractSetting(pageText),
                amenities: extractAmenities(pageText),
                activities: extractActivities(pageText),
                recreation: extractRecreation(pageText)
            },
            
            // Accreditations & Memberships
            accreditations: extractAccreditations(pageText),
            memberships: extractMemberships(pageText),
            licenses: extractLicenses(pageText),
            
            // Content Analysis
            content: {
                headings: extractAllHeadings(),
                keyParagraphs: extractKeyParagraphs(),
                sections: extractPageSections(),
                testimonials: extractTestimonials(pageText)
            },
            
            // Extraction Metadata
            metadata: {
                extractionTime: Date.now() - startTime,
                dataPoints: 0,
                confidence: 0
            }
        };
        
        // Calculate data points and confidence
        data.metadata.dataPoints = calculateDataPoints(data);
        data.metadata.confidence = calculateConfidence(data);
        
        // Generate summary
        data.summary = generateExtractionSummary(data);
        
        return data;
    }
    
    // =========================
    // EXTRACTION FUNCTIONS
    // =========================
    
    function extractProgramName() {
        // Try multiple strategies
        const strategies = [
            () => document.querySelector('meta[property="og:site_name"]')?.content,
            () => document.querySelector('meta[name="application-name"]')?.content,
            () => document.querySelector('h1')?.textContent?.trim(),
            () => document.title.split(/[-|]/)[0].trim(),
            () => {
                const logo = document.querySelector('img[alt*="logo" i]');
                return logo?.alt?.replace(/logo/i, '').trim();
            }
        ];
        
        for (const strategy of strategies) {
            const name = strategy();
            if (name && name.length > 2 && name.length < 100) {
                return name;
            }
        }
        
        // Fallback to domain
        return window.location.hostname.replace('www.', '').split('.')[0]
            .split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }
    
    function extractPhoneNumbers(text) {
        const phoneRegex = /(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
        const phones = text.match(phoneRegex) || [];
        return [...new Set(phones)].filter(phone => {
            const digits = phone.replace(/\D/g, '');
            return digits.length === 10 || digits.length === 11;
        });
    }
    
    function extractEmails(text) {
        const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        const emails = text.match(emailRegex) || [];
        return [...new Set(emails)].filter(email => 
            !email.includes('.png') && !email.includes('.jpg') && 
            !email.includes('@example') && email.includes('.')
        );
    }
    
    function extractAddress(text) {
        const addressRegex = /\d+\s+[\w\s]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Way|Parkway|Pkwy)[\s,]+[\w\s]+,?\s+[A-Z]{2}\s+\d{5}/gi;
        const match = text.match(addressRegex);
        return match ? match[0] : '';
    }
    
    function extractLocation(text) {
        const stateRegex = /([\w\s]+),\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\s*(\d{5})?/i;
        const match = text.match(stateRegex);
        return match ? match[0] : '';
    }
    
    function extractAgeRanges(text) {
        const agePatterns = [
            /(\d{1,2})\s*[-–to]+\s*(\d{1,2})\s*(?:years?|yrs?)?(?:\s*old)?/gi,
            /ages?\s*(\d{1,2})\s*(?:to|through|[-–])\s*(\d{1,2})/gi
        ];
        
        const ages = [];
        for (const pattern of agePatterns) {
            const matches = text.matchAll(pattern);
            for (const match of matches) {
                const min = parseInt(match[1]);
                const max = parseInt(match[2]);
                if (min >= 5 && max <= 30 && min < max) {
                    ages.push(`${min}-${max} years`);
                }
            }
        }
        return [...new Set(ages)];
    }
    
    function extractTherapies(text) {
        const therapies = {
            'Evidence-Based': [
                'CBT', 'DBT', 'EMDR', 'ACT', 'MI', 'TF-CBT', 'CPT', 'PE',
                'Cognitive Behavioral Therapy', 'Dialectical Behavior Therapy',
                'Eye Movement Desensitization', 'Acceptance and Commitment',
                'Motivational Interviewing', 'Trauma-Focused CBT',
                'Cognitive Processing Therapy', 'Prolonged Exposure'
            ],
            'Experiential': [
                'Art Therapy', 'Music Therapy', 'Equine Therapy', 'Adventure Therapy',
                'Wilderness Therapy', 'Drama Therapy', 'Dance Therapy',
                'Recreation Therapy', 'Experiential Therapy', 'Play Therapy'
            ],
            'Somatic': [
                'EMDR', 'Somatic Experiencing', 'Brainspotting', 'Neurofeedback',
                'Biofeedback', 'Yoga Therapy', 'Mindfulness', 'Meditation'
            ],
            'Family/Group': [
                'Family Therapy', 'Group Therapy', 'Multi-Family Groups',
                'Parent Education', 'Family Systems', 'Structural Family Therapy'
            ]
        };
        
        const found = {};
        Object.entries(therapies).forEach(([category, list]) => {
            found[category] = list.filter(therapy => 
                text.includes(therapy) || text.toLowerCase().includes(therapy.toLowerCase())
            );
        });
        
        return found;
    }
    
    function extractSpecializations(text) {
        const specializations = [
            'Trauma', 'PTSD', 'Anxiety', 'Depression', 'ADHD', 'OCD',
            'Bipolar', 'Eating Disorders', 'Substance Abuse', 'Dual Diagnosis',
            'Self-Harm', 'Suicidal Ideation', 'Autism', 'Asperger',
            'Attachment', 'Adoption', 'RAD', 'ODD', 'Conduct Disorder',
            'Learning Disabilities', 'LGBTQ', 'Gender Identity',
            'Technology Addiction', 'Gaming Addiction', 'Sexual Trauma'
        ];
        
        return specializations.filter(spec => 
            text.includes(spec) || text.toLowerCase().includes(spec.toLowerCase())
        );
    }
    
    function extractInsuranceProviders(text) {
        const providers = [
            'Aetna', 'Anthem', 'Blue Cross', 'Blue Shield', 'BCBS',
            'Cigna', 'United Healthcare', 'UnitedHealth', 'Humana',
            'Kaiser', 'Magellan', 'Optum', 'Beacon', 'TRICARE',
            'Medicaid', 'Medicare', 'Amerigroup', 'Centene',
            'WellCare', 'Molina', 'Health Net', 'ComPsych'
        ];
        
        return providers.filter(provider => text.includes(provider));
    }
    
    function extractAccreditations(text) {
        const accreditations = [
            'Joint Commission', 'JCAHO', 'CARF', 'COA', 'NATSAP',
            'NAATP', 'BBB', 'Cognia', 'AdvancED', 'WASC', 'NAEYC'
        ];
        
        return accreditations.filter(accred => text.includes(accred));
    }
    
    function extractAllHeadings() {
        const headings = [];
        document.querySelectorAll('h1, h2, h3, h4').forEach((h, index) => {
            if (index < 100) {
                const text = h.textContent.trim();
                if (text && text.length > 2) {
                    headings.push({
                        level: h.tagName,
                        text: text
                    });
                }
            }
        });
        return headings;
    }
    
    function extractKeyParagraphs() {
        const paragraphs = [];
        document.querySelectorAll('p').forEach((p, index) => {
            if (index < 50) {
                const text = p.textContent.trim();
                if (text && text.length > 100 && text.length < 1000) {
                    paragraphs.push(text);
                }
            }
        });
        return paragraphs;
    }
    
    function extractPageSections() {
        const sections = {};
        const sectionPatterns = {
            'About': ['about', 'who we are', 'mission', 'our story', 'history'],
            'Services': ['services', 'programs', 'treatment', 'what we offer', 'therapies'],
            'Approach': ['approach', 'philosophy', 'methodology', 'our method', 'how we help'],
            'Admissions': ['admission', 'intake', 'enrollment', 'getting started', 'apply'],
            'Staff': ['staff', 'team', 'leadership', 'clinicians', 'therapists'],
            'Outcomes': ['outcomes', 'results', 'success', 'testimonials', 'reviews']
        };
        
        Object.entries(sectionPatterns).forEach(([section, keywords]) => {
            for (const keyword of keywords) {
                const heading = Array.from(document.querySelectorAll('h1, h2, h3, h4'))
                    .find(h => h.textContent.toLowerCase().includes(keyword));
                
                if (heading) {
                    let content = '';
                    let el = heading.nextElementSibling;
                    let count = 0;
                    
                    while (el && count < 5) {
                        if (el.tagName === 'P' || el.tagName === 'UL' || el.tagName === 'OL') {
                            content += el.textContent.trim() + '\n';
                            count++;
                        }
                        if (el.tagName && el.tagName.match(/^H[1-6]$/)) break;
                        el = el.nextElementSibling;
                    }
                    
                    if (content) {
                        sections[section] = content.trim();
                        break;
                    }
                }
            }
        });
        
        return sections;
    }
    
    // Helper extraction functions
    function extractGenders(text) {
        const genders = [];
        if (/\b(boys?|males?|young men)\b/i.test(text)) genders.push('Males');
        if (/\b(girls?|females?|young women)\b/i.test(text)) genders.push('Females');
        if (/\b(co[\s-]?ed|both genders?|all genders?)\b/i.test(text)) genders.push('Co-ed');
        return genders;
    }
    
    function extractPopulations(text) {
        const populations = [];
        if (/\badolescents?\b/i.test(text)) populations.push('Adolescents');
        if (/\bteens?\b/i.test(text)) populations.push('Teens');
        if (/\byoung adults?\b/i.test(text)) populations.push('Young Adults');
        if (/\bLGBTQ/i.test(text)) populations.push('LGBTQ+');
        if (/\badopted?\b/i.test(text)) populations.push('Adopted Youth');
        return populations;
    }
    
    function extractTreatmentModalities(text) {
        const modalities = [];
        if (/\bindividual therap/i.test(text)) modalities.push('Individual Therapy');
        if (/\bgroup therap/i.test(text)) modalities.push('Group Therapy');
        if (/\bfamily therap/i.test(text)) modalities.push('Family Therapy');
        if (/\bpsychiatric/i.test(text)) modalities.push('Psychiatric Services');
        if (/\bmedication management/i.test(text)) modalities.push('Medication Management');
        return modalities;
    }
    
    function extractLevelOfCare(text) {
        const levels = [];
        if (/\bresidential/i.test(text)) levels.push('Residential');
        if (/\bPHP|partial hospitalization/i.test(text)) levels.push('PHP');
        if (/\bIOP|intensive outpatient/i.test(text)) levels.push('IOP');
        if (/\boutpatient/i.test(text)) levels.push('Outpatient');
        if (/\bwilderness/i.test(text)) levels.push('Wilderness');
        if (/\btherapeutic boarding/i.test(text)) levels.push('Therapeutic Boarding School');
        return levels;
    }
    
    function extractProgramLength(text) {
        const lengthRegex = /(?:average|typical|program)[\s\w]*(?:length|duration|stay)[\s\w]*(\d+[\s-]?\d*)\s*(days?|weeks?|months?)/i;
        const match = text.match(lengthRegex);
        return match ? match[0] : '';
    }
    
    function extractStaffRatio(text) {
        const ratioRegex = /(?:staff|student|client)[\s-]?(?:to|:)[\s-]?(?:student|client|staff)[\s-]?ratio[\s:-]*(\d+)[\s:-]+(\d+)/i;
        const match = text.match(ratioRegex);
        return match ? `${match[1]}:${match[2]}` : '';
    }
    
    function extractCapacity(text) {
        const capacityRegex = /(?:serve|capacity|accommodate)[\s\w]*?(\d+)\s*(?:students?|clients?|residents?)/i;
        const match = text.match(capacityRegex);
        return match ? match[1] : '';
    }
    
    function extractSocialMedia(html) {
        const social = {};
        if (html.includes('facebook.com/')) social.facebook = true;
        if (html.includes('instagram.com/')) social.instagram = true;
        if (html.includes('twitter.com/') || html.includes('x.com/')) social.twitter = true;
        if (html.includes('linkedin.com/')) social.linkedin = true;
        if (html.includes('youtube.com/')) social.youtube = true;
        return social;
    }
    
    // Check functions
    function checkForAcademics(text) {
        return /\b(academic|school|education|classroom|teacher|grades?)\b/i.test(text);
    }
    
    function checkSpecialEducation(text) {
        return /\b(special education|IEP|504 plan|learning support)\b/i.test(text);
    }
    
    function checkFamilyProgram(text) {
        return /\b(family program|parent involvement|family therapy)\b/i.test(text);
    }
    
    function checkFamilyTherapy(text) {
        return /\bfamily therap/i.test(text);
    }
    
    function checkParentEducation(text) {
        return /\b(parent education|parent workshop|parent training)\b/i.test(text);
    }
    
    function checkInsuranceAcceptance(text) {
        return /\b(accept insurance|insurance accepted|work with insurance)\b/i.test(text);
    }
    
    function checkFinancialAid(text) {
        return /\b(financial aid|scholarship|sliding scale|payment plan)\b/i.test(text);
    }
    
    // Additional extraction functions
    function extractApproach(text) {
        const approachRegex = /(?:our|the)\s*(?:approach|philosophy|methodology)[\s:-]+([^.]+\.)/i;
        const match = text.match(approachRegex);
        return match ? match[1].trim() : '';
    }
    
    function extractPhilosophy(text) {
        const philosophyRegex = /(?:treatment|therapeutic)\s*philosophy[\s:-]+([^.]+\.)/i;
        const match = text.match(philosophyRegex);
        return match ? match[1].trim() : '';
    }
    
    function extractSchedule(text) {
        return text.includes('daily schedule') || text.includes('typical day') ? 'Structured daily schedule' : '';
    }
    
    function extractProgramPhases(text) {
        const phases = [];
        const phaseRegex = /phase\s*(\d+|one|two|three|four|I|II|III|IV)/gi;
        const matches = text.match(phaseRegex) || [];
        return [...new Set(matches)];
    }
    
    function extractStaffCredentials(text) {
        const credentials = [
            'LCSW', 'LCPC', 'LPC', 'LMFT', 'LMHC', 'PhD', 'PsyD', 'MD', 
            'RN', 'CADC', 'LAC', 'Board Certified', 'Licensed'
        ];
        return credentials.filter(cred => text.includes(cred));
    }
    
    function extractTeamSize(text) {
        const sizeRegex = /(\d+)\s*(?:\+)?\s*(?:licensed|certified|professional)?\s*(?:therapists?|counselors?|clinicians?|staff)/i;
        const match = text.match(sizeRegex);
        return match ? match[1] : '';
    }
    
    function extractLeadership(text) {
        const titles = ['Clinical Director', 'Medical Director', 'Executive Director', 'Program Director'];
        return titles.filter(title => text.includes(title));
    }
    
    function extractStaffSpecialties(text) {
        const specialties = [
            'trauma specialist', 'addiction counselor', 'family therapist',
            'adolescent specialist', 'psychiatrist', 'psychiatric nurse'
        ];
        return specialties.filter(spec => text.toLowerCase().includes(spec));
    }
    
    function extractAcademicAccreditation(text) {
        const accreds = ['Cognia', 'AdvancED', 'WASC', 'NAEYC', 'State Accredited'];
        return accreds.filter(accred => text.includes(accred));
    }
    
    function extractGradeLevels(text) {
        const gradeRegex = /grades?\s*(\d+)\s*(?:through|to|[-–])\s*(\d+)/i;
        const match = text.match(gradeRegex);
        return match ? `Grades ${match[1]}-${match[2]}` : '';
    }
    
    function extractVisitation(text) {
        const visitRegex = /(?:visitation|family visits?)[\s:-]+([^.]+)/i;
        const match = text.match(visitRegex);
        return match ? match[1].trim() : '';
    }
    
    function extractPaymentOptions(text) {
        const options = [];
        if (/\bprivate pay/i.test(text)) options.push('Private Pay');
        if (/\bself[\s-]?pay/i.test(text)) options.push('Self-Pay');
        if (/\bpayment plan/i.test(text)) options.push('Payment Plans');
        if (/\bfinancing/i.test(text)) options.push('Financing Available');
        return options;
    }
    
    function extractSetting(text) {
        if (/\b\d+[\s-]?acres?\b/i.test(text)) {
            const match = text.match(/(\d+)[\s-]?acres?/i);
            return `${match[1]} acre campus`;
        }
        if (/\bmountain/i.test(text)) return 'Mountain setting';
        if (/\beach|ocean|coastal/i.test(text)) return 'Beach/coastal setting';
        if (/\brural/i.test(text)) return 'Rural setting';
        if (/\burban/i.test(text)) return 'Urban setting';
        return '';
    }
    
    function extractAmenities(text) {
        const amenities = [
            'pool', 'gym', 'fitness center', 'basketball court', 'tennis court',
            'art studio', 'music room', 'library', 'computer lab', 'cafeteria',
            'outdoor space', 'hiking trails', 'recreation room'
        ];
        return amenities.filter(amenity => text.toLowerCase().includes(amenity));
    }
    
    function extractActivities(text) {
        const activities = [
            'sports', 'arts', 'music', 'drama', 'outdoor activities',
            'hiking', 'camping', 'rock climbing', 'kayaking', 'horseback riding',
            'yoga', 'meditation', 'fitness', 'team building'
        ];
        return activities.filter(activity => text.toLowerCase().includes(activity));
    }
    
    function extractRecreation(text) {
        const recreation = [];
        if (/\bsports/i.test(text)) recreation.push('Sports programs');
        if (/\barts/i.test(text)) recreation.push('Arts programs');
        if (/\bmusic/i.test(text)) recreation.push('Music programs');
        if (/\boutdoor/i.test(text)) recreation.push('Outdoor recreation');
        return recreation;
    }
    
    function extractMemberships(text) {
        const memberships = ['NATSAP', 'IECA', 'ACA', 'NAATP', 'BBB'];
        return memberships.filter(member => text.includes(member));
    }
    
    function extractLicenses(text) {
        const licenses = [];
        if (/state[\s-]?licensed/i.test(text)) licenses.push('State Licensed');
        if (/medicare[\s-]?certified/i.test(text)) licenses.push('Medicare Certified');
        if (/medicaid[\s-]?certified/i.test(text)) licenses.push('Medicaid Certified');
        return licenses;
    }
    
    function extractTestimonials(text) {
        const testimonials = [];
        const testimonialRegex = /"([^"]{50,300})"/g;
        const matches = text.matchAll(testimonialRegex);
        for (const match of matches) {
            if (match[1].includes('helped') || match[1].includes('changed') || 
                match[1].includes('grateful') || match[1].includes('recommend')) {
                testimonials.push(match[1]);
            }
        }
        return testimonials.slice(0, 3);
    }
    
    // Calculation functions
    function calculateDataPoints(data) {
        let count = 0;
        
        // Count all arrays
        const countArrays = (obj) => {
            Object.values(obj).forEach(value => {
                if (Array.isArray(value)) {
                    count += value.length;
                } else if (typeof value === 'object' && value !== null) {
                    countArrays(value);
                } else if (value) {
                    count++;
                }
            });
        };
        
        countArrays(data);
        return count;
    }
    
    function calculateConfidence(data) {
        let score = 0;
        let maxScore = 0;
        
        // Check key fields
        const keyFields = [
            data.programName,
            data.contact.phones.length > 0,
            data.contact.emails.length > 0,
            data.demographics.agesServed.length > 0,
            data.clinical.therapies.length > 0,
            data.payment.insurance.length > 0,
            Object.keys(data.content.sections).length > 0
        ];
        
        keyFields.forEach(field => {
            maxScore += 10;
            if (field) score += 10;
        });
        
        return Math.round((score / maxScore) * 100);
    }
    
    function generateExtractionSummary(data) {
        return {
            programName: data.programName,
            dataPoints: data.metadata.dataPoints,
            confidence: data.metadata.confidence + '%',
            hasContact: data.contact.phones.length > 0 || data.contact.emails.length > 0,
            hasClinicalInfo: Object.values(data.clinical).some(arr => Array.isArray(arr) && arr.length > 0),
            hasInsurance: data.payment.insurance.length > 0,
            sectionsFound: Object.keys(data.content.sections).length
        };
    }
    
})();
