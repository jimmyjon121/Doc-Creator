// Enhanced formatter for creating program-specific, clinical writeups
// This generates detailed, unique descriptions for each program

function generateClinicalWriteup(extractedData) {
    const s = extractedData.structured || extractedData;
    
    // Build comprehensive program profile
    const writeup = {
        programName: s.programName || 'Treatment Program',
        location: s.location || '',
        levelOfCare: s.levelOfCare || 'Residential Treatment',
        agesServed: s.agesServed || 'Adolescents',
        description: '',
        features: [],
        clinicalDetails: {}
    };
    
    // Generate unique, program-specific description based on actual extracted data
    writeup.description = generateUniqueDescription(s, extractedData.allText);
    
    // Extract program-specific features (not generic)
    writeup.features = extractProgramSpecificFeatures(s, extractedData);
    
    // Extract clinical details for family sessions
    writeup.clinicalDetails = extractClinicalDetails(s, extractedData);
    
    return formatForFamilySession(writeup);
}

function generateUniqueDescription(structured, allText) {
    let description = '';
    const programName = structured.programName || 'This program';
    
    // Build description from actual extracted content
    if (structured.levelOfCare && structured.levelOfCare.length > 0) {
        const careLevel = Array.isArray(structured.levelOfCare) ? 
            structured.levelOfCare.join(' and ') : structured.levelOfCare;
        description = `${programName} provides ${careLevel} treatment`;
    } else {
        description = `${programName} offers comprehensive treatment services`;
    }
    
    // Add age-specific information
    if (structured.agesServed) {
        description += ` for ${structured.agesServed}`;
    }
    
    // Add location if available
    if (structured.location) {
        description += ` in ${structured.location}`;
    }
    
    description += '.';
    
    // Add specialization focus if found
    if (structured.specializations && structured.specializations.length > 0) {
        const specs = structured.specializations.slice(0, 3).join(', ');
        description += ` The program specializes in treating ${specs}.`;
    }
    
    // Add accreditation if found
    if (structured.accreditations && structured.accreditations.length > 0) {
        const accreds = Array.from(structured.accreditations).join(', ');
        description += ` ${programName} is accredited by ${accreds}.`;
    }
    
    return description;
}

function extractProgramSpecificFeatures(structured, extractedData) {
    const features = [];
    const allText = extractedData.allText || '';
    const paragraphs = extractedData.pageData?.paragraphs || [];
    
    // Extract unique program features from actual content
    const featurePatterns = [
        // Program philosophy
        { 
            pattern: /(?:our|the)\s+(?:approach|philosophy|model)\s+(?:is|focuses|emphasizes|centers)\s+(?:on|around)?\s+([^.]+)/gi,
            prefix: 'Treatment Philosophy'
        },
        // Staff credentials
        {
            pattern: /(?:staff|team|therapists?|counselors?)\s+(?:are|include|have)\s+([^.]+(?:certified|licensed|trained|specialized)[^.]+)/gi,
            prefix: 'Clinical Team'
        },
        // Unique offerings
        {
            pattern: /(?:unique|specialized|signature|exclusive)\s+(?:programs?|services?|offerings?|features?)\s+(?:include|such as|like)\s+([^.]+)/gi,
            prefix: 'Unique Features'
        },
        // Daily structure
        {
            pattern: /(?:daily|typical)\s+(?:schedule|routine|day)\s+(?:includes?|consists?|involves?)\s+([^.]+)/gi,
            prefix: 'Daily Structure'
        },
        // Academic program
        {
            pattern: /(?:academic|educational?|school)\s+(?:program|component|services?)\s+(?:includes?|provides?|offers?)\s+([^.]+)/gi,
            prefix: 'Academic Program'
        },
        // Family involvement
        {
            pattern: /(?:family|parent)\s+(?:involvement|participation|therapy|program)\s+(?:includes?|involves?|consists?)\s+([^.]+)/gi,
            prefix: 'Family Program'
        },
        // Aftercare planning
        {
            pattern: /(?:aftercare|discharge|transition)\s+(?:planning|services?|support)\s+(?:includes?|involves?|provides?)\s+([^.]+)/gi,
            prefix: 'Aftercare Support'
        },
        // Length of stay
        {
            pattern: /(?:length|duration)\s+of\s+(?:stay|treatment|program)\s+(?:is|typically|averages?|ranges?)\s+([^.]+)/gi,
            prefix: 'Length of Stay'
        }
    ];
    
    featurePatterns.forEach(({ pattern, prefix }) => {
        let matches = allText.matchAll(pattern);
        for (let match of matches) {
            if (match[1]) {
                const content = match[1].trim()
                    .replace(/\s+/g, ' ')
                    .replace(/[,;]$/, '');
                
                // Only add if it's meaningful content (not generic)
                if (content.length > 20 && content.length < 200 && 
                    !content.toLowerCase().includes('click here') &&
                    !content.toLowerCase().includes('learn more') &&
                    !content.toLowerCase().includes('contact us')) {
                    features.push(`${prefix}: ${content}`);
                    break; // Only take first match for each pattern
                }
            }
        }
    });
    
    // Extract specific therapeutic modalities mentioned
    if (structured.therapies && structured.therapies.length > 0) {
        const therapyList = Array.from(structured.therapies).slice(0, 6);
        
        // Group therapies by type for better organization
        const evidenceBased = therapyList.filter(t => 
            ['CBT', 'DBT', 'EMDR', 'ACT', 'TF-CBT'].includes(t));
        const experiential = therapyList.filter(t => 
            t.toLowerCase().includes('art') || 
            t.toLowerCase().includes('music') || 
            t.toLowerCase().includes('equine') ||
            t.toLowerCase().includes('adventure'));
        
        if (evidenceBased.length > 0) {
            features.push(`Evidence-Based Therapies: ${evidenceBased.join(', ')}`);
        }
        if (experiential.length > 0) {
            features.push(`Experiential Therapies: ${experiential.join(', ')}`);
        }
    }
    
    // Extract admission criteria if found
    const admissionPattern = /(?:admission|intake)\s+(?:criteria|requirements?|process)\s+(?:includes?|requires?|involves?)\s+([^.]+)/gi;
    const admissionMatch = admissionPattern.exec(allText);
    if (admissionMatch && admissionMatch[1]) {
        features.push(`Admission Process: ${admissionMatch[1].trim()}`);
    }
    
    // Extract insurance information
    const insurancePattern = /(?:accept|take|work with)\s+(?:insurance|insurances|plans?)\s+(?:including|such as|like)\s+([^.]+)/gi;
    const insuranceMatch = insurancePattern.exec(allText);
    if (insuranceMatch && insuranceMatch[1]) {
        features.push(`Insurance: ${insuranceMatch[1].trim()}`);
    }
    
    // Filter out duplicates and limit to most relevant
    const uniqueFeatures = [...new Set(features)];
    return uniqueFeatures.slice(0, 8); // Return top 8 features
}

function extractClinicalDetails(structured, extractedData) {
    const details = {
        primaryIssues: '',
        therapeuticApproach: '',
        staffRatio: '',
        programLength: '',
        academicSupport: '',
        familyInvolvement: '',
        aftercarePlanning: ''
    };
    
    const allText = extractedData.allText || '';
    
    // Extract primary issues treated
    if (structured.specializations && structured.specializations.length > 0) {
        const issues = Array.from(structured.specializations);
        // Prioritize and format nicely
        const formatted = issues.map(issue => {
            // Clean up the formatting
            return issue.charAt(0).toUpperCase() + issue.slice(1)
                .replace(/adhd/gi, 'ADHD')
                .replace(/ptsd/gi, 'PTSD')
                .replace(/lgbtq/gi, 'LGBTQ+')
                .replace(/asd/gi, 'ASD');
        });
        details.primaryIssues = formatted.slice(0, 5).join(', ');
    }
    
    // Extract staff-to-client ratio
    const ratioPattern = /(?:staff|student|client)[\s-]?(?:to|:)[\s-]?(?:student|client|staff)\s+ratio\s+(?:is|of)?\s*(\d+:\d+)/gi;
    const ratioMatch = ratioPattern.exec(allText);
    if (ratioMatch && ratioMatch[1]) {
        details.staffRatio = ratioMatch[1];
    }
    
    // Extract program length
    const lengthPattern = /(?:program|treatment|stay)\s+(?:length|duration|lasts?|is)\s+(?:typically|approximately|about)?\s*(\d+[\s-]?\d*\s*(?:days?|weeks?|months?))/gi;
    const lengthMatch = lengthPattern.exec(allText);
    if (lengthMatch && lengthMatch[1]) {
        details.programLength = lengthMatch[1];
    }
    
    // Extract academic support details
    const academicPattern = /(?:academic|school|education)\s+(?:program|support|services?)\s+(?:includes?|provides?|offers?)\s+([^.]+)/gi;
    const academicMatch = academicPattern.exec(allText);
    if (academicMatch && academicMatch[1]) {
        details.academicSupport = academicMatch[1].trim().slice(0, 150);
    }
    
    // Extract family involvement details
    const familyPattern = /(?:family|parent)\s+(?:involvement|therapy|participation|sessions?)\s+(?:includes?|occurs?|happens?)\s+([^.]+)/gi;
    const familyMatch = familyPattern.exec(allText);
    if (familyMatch && familyMatch[1]) {
        details.familyInvolvement = familyMatch[1].trim().slice(0, 150);
    }
    
    return details;
}

function formatForFamilySession(writeup) {
    let formatted = `${writeup.programName}`;
    
    if (writeup.location) {
        formatted += ` – ${writeup.location}`;
    }
    formatted += '\n\n';
    
    // Level of Care section
    formatted += 'Level of Care & Services Provided:\n';
    formatted += writeup.description + '\n\n';
    
    // Program Details section with bullet points
    if (writeup.features && writeup.features.length > 0) {
        formatted += 'Program Details / Differentiating Features:\n';
        writeup.features.forEach(feature => {
            // Format as bullet point with bold concept
            if (feature.includes(':')) {
                const [concept, description] = feature.split(':');
                formatted += `• ${concept}: ${description.trim()}\n`;
            } else {
                formatted += `• ${feature}\n`;
            }
        });
        formatted += '\n';
    }
    
    // Clinical recommendations section (for family discussion)
    const clinical = writeup.clinicalDetails;
    if (clinical.primaryIssues || clinical.staffRatio || clinical.programLength) {
        formatted += 'Clinical Considerations for Family Discussion:\n';
        
        if (clinical.primaryIssues) {
            formatted += `• Primary Focus Areas: ${clinical.primaryIssues}\n`;
        }
        if (clinical.staffRatio) {
            formatted += `• Staff-to-Client Ratio: ${clinical.staffRatio}\n`;
        }
        if (clinical.programLength) {
            formatted += `• Typical Length of Stay: ${clinical.programLength}\n`;
        }
        if (clinical.academicSupport) {
            formatted += `• Academic Support: ${clinical.academicSupport}\n`;
        }
        if (clinical.familyInvolvement) {
            formatted += `• Family Program: ${clinical.familyInvolvement}\n`;
        }
        if (clinical.aftercarePlanning) {
            formatted += `• Aftercare Planning: ${clinical.aftercarePlanning}\n`;
        }
        formatted += '\n';
    }
    
    // Contact Information
    if (writeup.contact) {
        formatted += 'Contact Information:\n';
        if (writeup.contact.phone) {
            formatted += `Phone: ${writeup.contact.phone}\n`;
        }
        if (writeup.contact.email) {
            formatted += `Email: ${writeup.contact.email}\n`;
        }
        if (writeup.contact.website) {
            formatted += `Website: ${writeup.contact.website}\n`;
        }
    }
    
    return formatted;
}

// Export for use in popup.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateClinicalWriteup,
        formatForFamilySession
    };
}



