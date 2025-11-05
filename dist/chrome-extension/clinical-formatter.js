// clinical-formatter.js - HIPAA-safe Clinical Grade Formatter v5.0

// GOAL: Produce a HIPAA-safe, clinical-grade "Program Write-Up" string for pasting into Doc Creator.
// INPUT SHAPE (from extractor):
// {
//   name, city, state, levelsOfCare: string[],
//   population: { ages: string, gender?: string },
//   overviewBullets?: string[],
//   structure: { los?: string, ratio?: string, academics?: { hasProgram: boolean, accreditation?: string } },
//   clinical: { evidenceBased: string[], experiential: string[], specializations: string[] },
//   family: { weeklyTherapy?: boolean, workshops?: boolean, notes?: string[] },
//   admissions: { insurance?: string[], email?: string, phone?: string, website?: string },
//   quality: { accreditations?: string[] },
//   meta: { sourcesAnalyzed: number, confidence?: number }
// }
// OUTPUT: A single string with the sections below, no PHI, Calibri-friendly bulleting, 80–100 char lines.
// SECTIONS (exact order):
// 1) "{Program Name} — {City, ST}"
// 2) "{Residential | PHP | IOP | Outpatient}"  // pipe-separated, only those detected
// 3) "OVERVIEW" (3–5 sentences, concise, no marketing fluff)
// 4) "PROGRAM STRUCTURE" (• Length of Stay, • Staff Ratio, • Academics w/ accreditation)
// 5) "CLINICAL SERVICES" (• Evidence-Based: … • Experiential: … • Specializations: …)
// 6) "FAMILY & ACADEMICS" (family touchpoints; school supports / accreditation)
// 7) "ADMISSIONS & LOGISTICS" (insurance/payers; payment if explicit; any unique ops notes)
// 8) "ACCREDITATIONS / QUALITY" (clinical and educational)
// 9) "CONTACT" (Phone | Email | Website)
//
// TONE: factual, neutral, clinically oriented (no claims or outcomes), no "comprehensive services" vagueness.
// FALLBACKS: if a field is missing, omit that bullet—never fabricate.
// FORMAT EXACTLY as a clean text block with bullets '• ' and pipe separators.

function formatClinicalWriteUp(data) {
    const lines = [];
    
    // 1) Program Header: "{Program Name} — {City, ST}"
    const header = `${data.name || 'Treatment Program'}${data.city && data.state ? ` — ${data.city}, ${data.state}` : ''}`;
    lines.push(header);
    lines.push('');
    
    // 2) Levels of Care: pipe-separated
    if (data.levelsOfCare && data.levelsOfCare.length > 0) {
        lines.push(data.levelsOfCare.join(' | '));
        lines.push('');
    }
    
    // 3) OVERVIEW section
    lines.push('OVERVIEW');
    if (data.overviewBullets && data.overviewBullets.length > 0) {
        // Combine bullets into 3-5 concise sentences
        const overview = data.overviewBullets
            .slice(0, 5)
            .map(bullet => bullet.replace(/^[•\-\*]\s*/, ''))
            .join('. ')
            .replace(/\.+/g, '.') + '.';
        lines.push(wrapText(overview, 80));
    } else {
        // Fallback overview from available data
        let overview = [];
        if (data.population?.ages) {
            overview.push(`Serves ${data.population.ages}${data.population.gender ? ` ${data.population.gender}` : ''}`);
        }
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            overview.push(`Offers ${data.levelsOfCare.join(', ').toLowerCase()} treatment`);
        }
        if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
            overview.push(`Specializes in ${data.clinical.specializations.slice(0, 3).join(', ').toLowerCase()}`);
        }
        if (overview.length > 0) {
            lines.push(wrapText(overview.join('. ') + '.', 80));
        }
    }
    lines.push('');
    
    // 4) PROGRAM STRUCTURE
    lines.push('PROGRAM STRUCTURE');
    if (data.structure?.los) {
        lines.push(`• Length of Stay: ${data.structure.los}`);
    }
    if (data.structure?.ratio) {
        lines.push(`• Staff Ratio: ${data.structure.ratio}`);
    }
    if (data.structure?.academics?.hasProgram) {
        const academicLine = data.structure.academics.accreditation 
            ? `• Academics: On-site program (${data.structure.academics.accreditation})`
            : '• Academics: On-site program available';
        lines.push(academicLine);
    }
    lines.push('');
    
    // 5) CLINICAL SERVICES
    lines.push('CLINICAL SERVICES');
    if (data.clinical?.evidenceBased && data.clinical.evidenceBased.length > 0) {
        const ebList = data.clinical.evidenceBased.join(', ');
        lines.push(`• Evidence-Based: ${wrapList(ebList, 80, '  ')}`);
    }
    if (data.clinical?.experiential && data.clinical.experiential.length > 0) {
        const expList = data.clinical.experiential.join(', ');
        lines.push(`• Experiential: ${wrapList(expList, 80, '  ')}`);
    }
    if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
        const specList = data.clinical.specializations.join(', ');
        lines.push(`• Specializations: ${wrapList(specList, 80, '  ')}`);
    }
    lines.push('');
    
    // 6) FAMILY & ACADEMICS
    lines.push('FAMILY & ACADEMICS');
    const familyPoints = [];
    if (data.family?.weeklyTherapy) {
        familyPoints.push('Weekly family therapy');
    }
    if (data.family?.workshops) {
        familyPoints.push('Parent workshops/education');
    }
    if (data.family?.notes && data.family.notes.length > 0) {
        familyPoints.push(...data.family.notes);
    }
    
    if (familyPoints.length > 0) {
        familyPoints.forEach(point => {
            lines.push(`• ${point}`);
        });
    }
    
    if (data.structure?.academics?.hasProgram) {
        const academicDetail = data.structure.academics.accreditation
            ? `• Academic Support: ${data.structure.academics.accreditation} accredited`
            : '• Academic Support: On-site educational program';
        lines.push(academicDetail);
    }
    lines.push('');
    
    // 7) ADMISSIONS & LOGISTICS
    lines.push('ADMISSIONS & LOGISTICS');
    if (data.admissions?.insurance && data.admissions.insurance.length > 0) {
        const insuranceList = data.admissions.insurance.join(', ');
        lines.push(`• Insurance: ${wrapList(insuranceList, 80, '  ')}`);
    }
    // Add any unique operational notes if available
    lines.push('');
    
    // 8) ACCREDITATIONS / QUALITY
    if (data.quality?.accreditations && data.quality.accreditations.length > 0) {
        lines.push('ACCREDITATIONS / QUALITY');
        const accredList = data.quality.accreditations.join(', ');
        lines.push(`• ${wrapList(accredList, 80, '  ')}`);
        lines.push('');
    }
    
    // 9) CONTACT
    lines.push('CONTACT');
    const contactParts = [];
    if (data.admissions?.phone) {
        contactParts.push(data.admissions.phone);
    }
    if (data.admissions?.email) {
        contactParts.push(data.admissions.email);
    }
    if (data.admissions?.website) {
        contactParts.push(data.admissions.website);
    }
    if (contactParts.length > 0) {
        lines.push(contactParts.join(' | '));
    }
    
    // Add metadata footer if confidence score available
    if (data.meta?.confidence !== undefined) {
        lines.push('');
        lines.push(`[Data Quality: ${data.meta.confidence}% | Sources: ${data.meta.sourcesAnalyzed || 1}]`);
    }
    
    return lines.join('\n');
}

// Helper function to wrap text to specified width
function wrapText(text, maxWidth) {
    if (!text || text.length <= maxWidth) return text;
    
    const words = text.split(' ');
    const lines = [];
    let currentLine = '';
    
    words.forEach(word => {
        if ((currentLine + ' ' + word).length <= maxWidth) {
            currentLine = currentLine ? currentLine + ' ' + word : word;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = word;
        }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines.join('\n');
}

// Helper function to wrap lists with proper indentation
function wrapList(text, maxWidth, indent = '') {
    if (!text || text.length <= maxWidth - indent.length) return text;
    
    const items = text.split(', ');
    const lines = [];
    let currentLine = '';
    
    items.forEach((item, index) => {
        const separator = index === 0 ? '' : ', ';
        if ((currentLine + separator + item).length <= maxWidth - indent.length) {
            currentLine = currentLine ? currentLine + separator + item : item;
        } else {
            if (currentLine) lines.push(currentLine);
            currentLine = item;
        }
    });
    
    if (currentLine) lines.push(currentLine);
    return lines.join('\n' + indent);
}

// Export for use in popup.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = formatClinicalWriteUp;
}
