// aftercare-formatter.js - Professional Aftercare Recommendation Formatter v5.1

// Creates formal aftercare recommendation write-ups for clinical documentation
// Designed for presentation to families during treatment planning sessions

function formatAfterCareRecommendation(data) {
    const lines = [];
    
    // Program Header with full name and location
    const header = `${data.name || 'Treatment Program'}${data.city && data.state ? ` — ${data.city}, ${data.state.toUpperCase()}` : ''}`;
    lines.push(header.toUpperCase());
    lines.push('');
    
    // Levels of Care (if multiple, shows flexibility)
    if (data.levelsOfCare && data.levelsOfCare.length > 0) {
        lines.push(`Level of Care: ${data.levelsOfCare.join(' | ')}`);
        lines.push('');
    }
    
    // PROGRAM OVERVIEW - Professional summary for clinical documentation
    lines.push('PROGRAM OVERVIEW');
    if (data.philosophy || data.approach || data.overviewBullets?.length > 0) {
        let overview = '';
        
        // Use philosophy/approach if available
        if (data.philosophy) {
            overview = data.philosophy;
        } else if (data.approach) {
            overview = data.approach;
        } else if (data.overviewBullets && data.overviewBullets.length > 0) {
            overview = data.overviewBullets
                .slice(0, 3)
                .map(b => b.replace(/^[•\-\*]\s*/, ''))
                .join('. ') + '.';
        }
        
        // Add demographics and specialization context
        if (data.population?.ages || data.clinical?.specializations?.length > 0) {
            const context = [];
            if (data.population.ages) {
                context.push(`serves ${data.population.ages}${data.population.gender ? ` ${data.population.gender.toLowerCase()}` : ''}`);
            }
            if (data.clinical?.specializations?.length > 0) {
                const topSpecs = data.clinical.specializations.slice(0, 3).join(', ').toLowerCase();
                context.push(`specializing in ${topSpecs}`);
            }
            if (context.length > 0) {
                overview += ` The program ${context.join(' and ')}.`;
            }
        }
        
        lines.push(wrapText(overview, 80));
    } else {
        // Fallback overview
        lines.push(`Comprehensive treatment program providing evidence-based care.`);
    }
    
    // Add differentiators if available
    if (data.differentiators && data.differentiators.length > 0) {
        lines.push(`Key features include: ${data.differentiators.slice(0, 3).join(', ').toLowerCase()}.`);
    }
    lines.push('');
    
    // CLINICAL PROGRAMMING - Core treatment information
    lines.push('CLINICAL PROGRAMMING');
    
    // Evidence-based modalities (critical for clinical documentation)
    if (data.clinical?.evidenceBased && data.clinical.evidenceBased.length > 0) {
        const ebList = data.clinical.evidenceBased.join(', ');
        lines.push(`• Evidence-Based Modalities: ${wrapList(ebList, 80, '  ')}`);
    }
    
    // Experiential therapies (shows comprehensive approach)
    if (data.clinical?.experiential && data.clinical.experiential.length > 0) {
        const expList = data.clinical.experiential.join(', ');
        lines.push(`• Experiential Therapies: ${wrapList(expList, 80, '  ')}`);
    }
    
    // Treatment specializations (matching client needs)
    if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
        const specList = data.clinical.specializations.join(', ');
        lines.push(`• Clinical Specializations: ${wrapList(specList, 80, '  ')}`);
    }
    
    // Therapy intensity (if available)
    if (data.clinical?.individualTherapyHours || data.clinical?.groupTherapyHours) {
        const intensity = [];
        if (data.clinical.individualTherapyHours) {
            intensity.push(`${data.clinical.individualTherapyHours} individual therapy`);
        }
        if (data.clinical.groupTherapyHours) {
            intensity.push(`${data.clinical.groupTherapyHours} group therapy`);
        }
        lines.push(`• Therapy Intensity: ${intensity.join(', ')} weekly`);
    }
    
    // Psychiatric services
    if (data.clinical?.psychiatricServices || data.clinical?.medicationManagement) {
        const psych = [];
        if (data.clinical.psychiatricServices) psych.push('psychiatric evaluation');
        if (data.clinical.medicationManagement) psych.push('medication management');
        if (psych.length > 0) {
            lines.push(`• Psychiatric Services: ${psych.join(' and ')}`);
        }
    }
    
    // Trauma-informed care
    if (data.clinical?.traumaInformed) {
        lines.push('• Trauma-Informed Care approach');
    }
    lines.push('');
    
    // PROGRAM STRUCTURE - Important for families to understand
    if (data.structure?.los || data.structure?.ratio || data.structure?.phases?.length > 0) {
        lines.push('PROGRAM STRUCTURE');
        
        if (data.structure?.los) {
            lines.push(`• Length of Stay: ${data.structure.los}`);
        }
        
        if (data.structure?.phases && data.structure.phases.length > 0) {
            lines.push(`• Treatment Phases: ${data.structure.phases.length} phase model`);
        }
        
        if (data.structure?.ratio) {
            lines.push(`• Staff-to-Client Ratio: ${data.structure.ratio}`);
        }
        
        if (data.structure?.groupSize) {
            lines.push(`• Group Size: ${data.structure.groupSize}`);
        }
        lines.push('');
    }
    
    // FAMILY INVOLVEMENT - Critical for aftercare planning
    const hasFamilyProgram = data.family?.weeklyTherapy || data.family?.workshops || 
                            data.family?.familyWeekend || data.family?.parentSupport;
    
    if (hasFamilyProgram) {
        lines.push('FAMILY INVOLVEMENT');
        
        if (data.family.weeklyTherapy) {
            lines.push('• Weekly family therapy sessions');
        }
        
        if (data.family.workshops) {
            lines.push('• Parent education workshops');
        }
        
        if (data.family.familyWeekend) {
            lines.push('• Structured family weekends');
        }
        
        if (data.family.parentSupport) {
            lines.push('• Parent support groups');
        }
        
        if (data.family.visitationPolicy) {
            lines.push(`• Visitation: ${data.family.visitationPolicy}`);
        }
        
        if (data.family.notes && data.family.notes.length > 0) {
            data.family.notes.forEach(note => {
                lines.push(`• ${note}`);
            });
        }
        lines.push('');
    }
    
    // ACADEMIC SUPPORT - Important for school-age clients
    if (data.structure?.academics?.hasProgram) {
        lines.push('ACADEMIC SUPPORT');
        if (data.structure.academics.accreditation) {
            lines.push(`• ${data.structure.academics.accreditation} accredited on-site school`);
        } else {
            lines.push('• On-site academic program');
        }
        lines.push('• Individualized academic support');
        lines.push('• Credit recovery and transfer assistance');
        lines.push('');
    }
    
    // STAFF & CREDENTIALS - Builds confidence in program quality
    if (data.staff?.credentials?.length > 0 || data.staff?.leadership?.length > 0) {
        lines.push('CLINICAL TEAM');
        
        if (data.staff.leadership && data.staff.leadership.length > 0) {
            lines.push(`• Leadership: ${data.staff.leadership.join(', ')}`);
        }
        
        if (data.staff.credentials && data.staff.credentials.length > 0) {
            lines.push(`• Team Credentials: ${data.staff.credentials.join(', ')}`);
        }
        
        if (data.staff.availability) {
            lines.push(`• Availability: ${data.staff.availability}`);
        }
        lines.push('');
    }
    
    // ENVIRONMENT & FACILITIES - Setting context
    if (data.facilities?.setting || data.facilities?.amenities?.length > 0) {
        lines.push('ENVIRONMENT');
        
        if (data.facilities.setting) {
            lines.push(`• Setting: ${data.facilities.setting}`);
        }
        
        if (data.facilities.roomType) {
            lines.push(`• Accommodations: ${data.facilities.roomType}`);
        }
        
        if (data.facilities.amenities && data.facilities.amenities.length > 0) {
            const amenityList = data.facilities.amenities.slice(0, 5).join(', ');
            lines.push(`• Facilities: ${amenityList}`);
        }
        
        if (data.facilities.recreation && data.facilities.recreation.length > 0) {
            const recList = data.facilities.recreation.slice(0, 5).join(', ');
            lines.push(`• Recreation: ${recList}`);
        }
        lines.push('');
    }
    
    // OUTCOMES & SUCCESS - Evidence of effectiveness
    if (data.outcomes?.successRate || data.outcomes?.alumni) {
        lines.push('PROGRAM OUTCOMES');
        
        if (data.outcomes.successRate) {
            lines.push(`• Completion Rate: ${data.outcomes.successRate}`);
        }
        
        if (data.outcomes.averageLOS) {
            lines.push(`• Average Length of Stay: ${data.outcomes.averageLOS}`);
        }
        
        if (data.outcomes.alumni) {
            lines.push('• Active alumni program and aftercare support');
        }
        lines.push('');
    }
    
    // ADMISSIONS & INSURANCE - Practical considerations
    lines.push('ADMISSIONS & PAYMENT');
    
    if (data.admissions?.insurance && data.admissions.insurance.length > 0) {
        const insuranceList = data.admissions.insurance.join(', ');
        lines.push(`• Insurance Accepted: ${wrapList(insuranceList, 80, '  ')}`);
    } else {
        lines.push('• Insurance: Please verify with admissions');
    }
    
    if (data.admissions?.financing) {
        lines.push('• Financing options available');
    }
    
    if (data.admissions?.admissionsCriteria && data.admissions.admissionsCriteria.length > 0) {
        lines.push(`• Admission Requirements: ${data.admissions.admissionsCriteria.join(', ')}`);
    }
    
    if (data.admissions?.exclusions && data.admissions.exclusions.length > 0) {
        lines.push(`• Exclusions: ${data.admissions.exclusions.join(', ')}`);
    }
    lines.push('');
    
    // ACCREDITATIONS - Quality indicators
    if (data.quality?.accreditations && data.quality.accreditations.length > 0) {
        lines.push('ACCREDITATIONS & MEMBERSHIPS');
        const accredList = data.quality.accreditations.join(', ');
        lines.push(`• ${wrapList(accredList, 80, '  ')}`);
        
        if (data.quality.memberships && data.quality.memberships.length > 0) {
            const memberList = data.quality.memberships.join(', ');
            lines.push(`• Member: ${memberList}`);
        }
        lines.push('');
    }
    
    // CONTACT INFORMATION - For follow-up
    lines.push('CONTACT INFORMATION');
    const contactParts = [];
    
    if (data.admissions?.phone) {
        contactParts.push(`Phone: ${data.admissions.phone}`);
    }
    
    if (data.admissions?.email) {
        contactParts.push(`Email: ${data.admissions.email}`);
    }
    
    if (contactParts.length > 0) {
        lines.push(contactParts.join(' | '));
    }
    
    if (data.admissions?.website) {
        lines.push(`Website: ${data.admissions.website}`);
    }
    
    // Data quality indicator
    if (data.meta?.confidence !== undefined) {
        lines.push('');
        lines.push(`[Assessment Quality: ${data.meta.confidence}% | Pages Reviewed: ${data.meta.sourcesAnalyzed || 1}]`);
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
    module.exports = formatAfterCareRecommendation;
}
