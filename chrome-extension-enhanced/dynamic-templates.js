// dynamic-templates.js - Adaptive write-up templates that adjust to available data
// Creates comprehensive, clinical-grade documentation based on data richness

class DynamicTemplateEngine {
    constructor() {
        this.templates = {
            comprehensive: this.comprehensiveTemplate,
            detailed: this.detailedTemplate,
            standard: this.standardTemplate,
            minimal: this.minimalTemplate
        };
        
        this.sectionPriority = [
            'identity', 'differentiators', 'clinical', 'population', 
            'structure', 'approach', 'family', 'practical', 'outcomes'
        ];
        
        this.outputFormats = {
            'family-meeting': this.familyMeetingFormat,
            'clinical-team': this.clinicalTeamFormat,
            'insurance-auth': this.insuranceAuthFormat,
            'quick-reference': this.quickReferenceFormat
        };
    }
    
    generateWriteUp(data, options = {}) {
        // Assess data richness
        const richness = this.assessDataRichness(data);
        
        // Select appropriate template
        const template = this.selectTemplate(richness);
        
        // Generate base write-up
        let writeUp = template.call(this, data, richness);
        
        // Apply format customization if specified
        if (options.format && this.outputFormats[options.format]) {
            writeUp = this.outputFormats[options.format].call(this, writeUp, data);
        }
        
        // Add metadata footer
        writeUp += this.generateMetadata(data, richness);
        
        return writeUp;
    }
    
    assessDataRichness(data) {
        const assessment = {
            score: 0,
            fieldCount: 0,
            depth: {},
            quality: {},
            completeness: 0
        };
        
        // Count populated fields
        const fields = this.countFields(data);
        assessment.fieldCount = fields.total;
        assessment.score += Math.min(fields.total / 50, 1) * 30; // Up to 30 points for field count
        
        // Assess depth of key fields
        const keyFields = ['clinical', 'population', 'structure', 'outcomes'];
        keyFields.forEach(field => {
            if (data[field]) {
                const depth = this.assessFieldDepth(data[field]);
                assessment.depth[field] = depth;
                assessment.score += depth * 10; // Up to 10 points per key field
            }
        });
        
        // Assess data quality
        assessment.quality = this.assessDataQuality(data);
        assessment.score += assessment.quality.score * 20; // Up to 20 points for quality
        
        // Calculate completeness
        assessment.completeness = this.calculateCompleteness(data);
        assessment.score += assessment.completeness * 10; // Up to 10 points for completeness
        
        // Determine richness level
        if (assessment.score >= 80) {
            assessment.level = 'comprehensive';
        } else if (assessment.score >= 60) {
            assessment.level = 'detailed';
        } else if (assessment.score >= 40) {
            assessment.level = 'standard';
        } else {
            assessment.level = 'minimal';
        }
        
        return assessment;
    }
    
    countFields(data, prefix = '') {
        let count = { total: 0, byCategory: {} };
        
        for (const [key, value] of Object.entries(data)) {
            if (value === null || value === undefined || value === '') continue;
            
            const category = prefix || key;
            if (!count.byCategory[category]) {
                count.byCategory[category] = 0;
            }
            
            if (typeof value === 'object' && !Array.isArray(value)) {
                const subCount = this.countFields(value, key);
                count.total += subCount.total;
                count.byCategory[category] += subCount.total;
            } else if (Array.isArray(value) && value.length > 0) {
                count.total += value.length;
                count.byCategory[category] += value.length;
            } else {
                count.total++;
                count.byCategory[category]++;
            }
        }
        
        return count;
    }
    
    assessFieldDepth(field) {
        let depth = 0;
        
        if (Array.isArray(field)) {
            depth = Math.min(field.length / 10, 1);
        } else if (typeof field === 'object') {
            const keys = Object.keys(field).filter(k => field[k]);
            depth = Math.min(keys.length / 5, 1);
        } else if (typeof field === 'string') {
            depth = field.length > 100 ? 1 : field.length / 100;
        }
        
        return depth;
    }
    
    assessDataQuality(data) {
        const quality = {
            hasSpecifics: 0,
            hasNumbers: 0,
            hasDetails: 0,
            hasUnique: 0,
            score: 0
        };
        
        // Check for specific information
        if (data.clinical?.individualTherapyHours || data.clinical?.groupTherapyHours) {
            quality.hasSpecifics++;
        }
        if (data.structure?.capacity || data.structure?.ratio) {
            quality.hasSpecifics++;
        }
        
        // Check for numerical data
        const numbers = JSON.stringify(data).match(/\d+/g);
        quality.hasNumbers = numbers ? Math.min(numbers.length / 20, 1) : 0;
        
        // Check for detailed descriptions
        const longTexts = JSON.stringify(data).match(/".{50,}"/g);
        quality.hasDetails = longTexts ? Math.min(longTexts.length / 10, 1) : 0;
        
        // Check for unique/differentiating information
        if (data.differentiators && data.differentiators.length > 0) {
            quality.hasUnique = Math.min(data.differentiators.length / 5, 1);
        }
        
        quality.score = (
            quality.hasSpecifics * 0.3 +
            quality.hasNumbers * 0.2 +
            quality.hasDetails * 0.2 +
            quality.hasUnique * 0.3
        );
        
        return quality;
    }
    
    calculateCompleteness(data) {
        const requiredFields = ['name', 'location', 'contact', 'levelsOfCare'];
        const importantFields = ['population', 'clinical', 'insurance', 'approach'];
        
        let score = 0;
        
        requiredFields.forEach(field => {
            if (data[field] && this.isFieldPopulated(data[field])) {
                score += 0.15;
            }
        });
        
        importantFields.forEach(field => {
            if (data[field] && this.isFieldPopulated(data[field])) {
                score += 0.1;
            }
        });
        
        return Math.min(score, 1);
    }
    
    isFieldPopulated(value) {
        if (!value) return false;
        if (Array.isArray(value)) return value.length > 0;
        if (typeof value === 'object') return Object.keys(value).length > 0;
        if (typeof value === 'string') return value.trim().length > 0;
        return true;
    }
    
    selectTemplate(richness) {
        return this.templates[richness.level] || this.templates.minimal;
    }
    
    // Comprehensive template for rich data
    comprehensiveTemplate(data, richness) {
        let output = '';
        
        // Header
        output += this.generateHeader(data);
        
        // Executive Summary
        output += this.generateExecutiveSummary(data);
        
        // Key Differentiators
        if (data.differentiators && data.differentiators.length > 0) {
            output += '\nKEY DIFFERENTIATORS:\n';
            data.differentiators.forEach(diff => {
                output += `• ${diff}\n`;
            });
        }
        
        // Clinical Excellence
        output += this.generateClinicalSection(data, 'comprehensive');
        
        // Population & Specialization
        output += this.generatePopulationSection(data, 'comprehensive');
        
        // Daily Structure & Environment
        output += this.generateStructureSection(data, 'comprehensive');
        
        // Treatment Approach
        output += this.generateApproachSection(data);
        
        // Family Program
        output += this.generateFamilySection(data, 'comprehensive');
        
        // Practical Information
        output += this.generatePracticalSection(data, 'comprehensive');
        
        // Outcomes & Success
        output += this.generateOutcomesSection(data);
        
        // Contact & Next Steps
        output += this.generateContactSection(data, 'comprehensive');
        
        return output;
    }
    
    // Detailed template for good data
    detailedTemplate(data, richness) {
        let output = '';
        
        output += this.generateHeader(data);
        output += this.generateWhyThisProgram(data);
        output += this.generateClinicalSection(data, 'detailed');
        output += this.generatePopulationSection(data, 'detailed');
        output += this.generateStructureSection(data, 'detailed');
        output += this.generateFamilySection(data, 'detailed');
        output += this.generatePracticalSection(data, 'detailed');
        output += this.generateContactSection(data, 'detailed');
        
        return output;
    }
    
    // Standard template for moderate data
    standardTemplate(data, richness) {
        let output = '';
        
        output += this.generateHeader(data);
        output += this.generateWhyThisProgram(data);
        output += this.generateClinicalSection(data, 'standard');
        output += this.generatePopulationSection(data, 'standard');
        output += this.generateFamilySection(data, 'standard');
        output += this.generateContactSection(data, 'standard');
        
        return output;
    }
    
    // Minimal template for sparse data
    minimalTemplate(data, richness) {
        let output = '';
        
        output += this.generateHeader(data);
        
        output += '\nPROGRAM OVERVIEW:\n';
        
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            output += `  Levels of Care: ${data.levelsOfCare.join(', ')}\n`;
        }
        
        if (data.population) {
            output += this.generatePopulationSection(data, 'minimal');
        }
        
        if (data.clinical) {
            output += this.generateClinicalSection(data, 'minimal');
        }
        
        output += this.generateContactSection(data, 'minimal');
        
        output += '\n[Note: Limited information available. Contact program for complete details.]\n';
        
        return output;
    }
    
    // Section generators
    generateHeader(data) {
        let header = '='.repeat(70) + '\n';
        header += 'CLINICAL AFTERCARE RECOMMENDATION\n';
        header += '='.repeat(70) + '\n\n';
        
        header += `PROGRAM: ${data.name || 'Treatment Program'}\n`;
        
        if (data.location) {
            const loc = data.location;
            header += `LOCATION: ${loc.city || ''}${loc.city && loc.state ? ', ' : ''}${loc.state || ''}\n`;
        }
        
        if (data.website) {
            header += `WEBSITE: ${data.website}\n`;
        }
        
        return header;
    }
    
    generateExecutiveSummary(data) {
        let summary = '\nEXECUTIVE SUMMARY:\n';
        
        // Generate a comprehensive summary based on available data
        const highlights = [];
        
        if (data.structure?.capacity) {
            highlights.push(`${data.structure.capacity}-bed facility`);
        }
        
        if (data.levelsOfCare && data.levelsOfCare.length > 0) {
            highlights.push(`offering ${data.levelsOfCare.join(', ')}`);
        }
        
        if (data.population?.ages) {
            highlights.push(`for ${data.population.ages}`);
        }
        
        if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
            highlights.push(`specializing in ${data.clinical.specializations.slice(0, 3).join(', ')}`);
        }
        
        if (highlights.length > 0) {
            summary += `${data.name} is a ${highlights.join(' ')}. `;
        }
        
        if (data.clinical?.primaryFocus) {
            summary += `The program's primary focus is ${data.clinical.primaryFocus}. `;
        }
        
        if (data.quality?.accreditations && data.quality.accreditations.length > 0) {
            summary += `Accredited by ${data.quality.accreditations.join(', ')}. `;
        }
        
        summary += '\n';
        return summary;
    }
    
    generateWhyThisProgram(data) {
        let section = '\nWHY THIS PROGRAM:\n';
        
        const reasons = [];
        
        // Extract key selling points
        if (data.differentiators && data.differentiators.length > 0) {
            data.differentiators.slice(0, 3).forEach(diff => {
                reasons.push(`  - ${diff}`);
            });
        }
        
        if (data.clinical?.primaryFocus) {
            reasons.push(`  - Primary focus on ${data.clinical.primaryFocus}`);
        }
        
        if (data.quality?.successRate) {
            reasons.push(`  - ${data.quality.successRate} success rate`);
        }
        
        if (data.staff?.credentials && data.staff.credentials.length > 0) {
            reasons.push(`  - ${data.staff.credentials[0]} clinical team`);
        }
        
        if (reasons.length === 0) {
            reasons.push('  - Comprehensive treatment approach');
            if (data.levelsOfCare && data.levelsOfCare.includes('residential')) {
                reasons.push('  - 24/7 structured care environment');
            }
        }
        
        section += reasons.join('\n') + '\n';
        return section;
    }
    
    generateClinicalSection(data, detail) {
        if (!data.clinical) return '';
        
        let section = '\nCLINICAL PROGRAMMING:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            // Therapy intensity
            if (data.clinical.individualTherapyHours || data.clinical.groupTherapyHours) {
                section += '  Therapy Intensity:\n';
                if (data.clinical.individualTherapyHours) {
                    section += `    • Individual: ${data.clinical.individualTherapyHours}\n`;
                }
                if (data.clinical.groupTherapyHours) {
                    section += `    • Group: ${data.clinical.groupTherapyHours}\n`;
                }
                if (data.clinical.familyTherapyFrequency) {
                    section += `    • Family: ${data.clinical.familyTherapyFrequency}\n`;
                }
                section += '\n';
            }
            
            // Modalities
            if (data.clinical.evidenceBased && data.clinical.evidenceBased.length > 0) {
                section += '  Evidence-Based Modalities:\n';
                data.clinical.evidenceBased.forEach(modality => {
                    section += `    • ${modality}\n`;
                });
                section += '\n';
            }
            
            if (data.clinical.experiential && data.clinical.experiential.length > 0) {
                section += '  Experiential Therapies:\n';
                data.clinical.experiential.forEach(therapy => {
                    section += `    • ${therapy}\n`;
                });
                section += '\n';
            }
            
            // Specializations
            if (data.clinical.specializations && data.clinical.specializations.length > 0) {
                section += '  Clinical Specializations:\n';
                data.clinical.specializations.forEach(spec => {
                    section += `    • ${spec}\n`;
                });
                section += '\n';
            }
            
            // Medical support
            if (data.clinical.psychiatryAvailable || data.clinical.medicationManagement) {
                section += '  Medical Support:\n';
                if (data.clinical.psychiatryAvailable) {
                    section += '    • Psychiatrist on staff\n';
                }
                if (data.clinical.medicationManagement) {
                    section += '    • Medication management available\n';
                }
                if (data.clinical.nursingStaff) {
                    section += '    • 24/7 nursing coverage\n';
                }
                section += '\n';
            }
        } else if (detail === 'standard') {
            // Condensed version
            if (data.clinical.specializations && data.clinical.specializations.length > 0) {
                section += `  Specializations: ${data.clinical.specializations.join(', ')}\n`;
            }
            
            const modalities = [
                ...(data.clinical.evidenceBased || []),
                ...(data.clinical.experiential || [])
            ];
            
            if (modalities.length > 0) {
                section += `  Treatment Modalities: ${modalities.slice(0, 5).join(', ')}\n`;
            }
        } else {
            // Minimal version
            const allModalities = [
                ...(data.clinical.evidenceBased || []),
                ...(data.clinical.experiential || [])
            ];
            
            if (allModalities.length > 0) {
                section += `  Modalities: ${allModalities.slice(0, 3).join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generatePopulationSection(data, detail) {
        if (!data.population) return '';
        
        let section = '\nPOPULATION SERVED:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            if (data.population.ages || data.population.ageMin) {
                section += '  Age Range: ';
                if (data.population.ages) {
                    section += data.population.ages;
                } else if (data.population.ageMin && data.population.ageMax) {
                    section += `${data.population.ageMin}-${data.population.ageMax}`;
                }
                section += '\n';
            }
            
            if (data.population.gender) {
                section += `  Gender: ${data.population.gender}\n`;
            }
            
            if (data.population.specialPopulations && data.population.specialPopulations.length > 0) {
                section += '  Special Populations:\n';
                data.population.specialPopulations.forEach(pop => {
                    section += `    • ${pop}\n`;
                });
            }
            
            if (data.exclusions && data.exclusions.length > 0) {
                section += '  Exclusion Criteria:\n';
                data.exclusions.forEach(exclusion => {
                    section += `    • ${exclusion}\n`;
                });
            }
        } else {
            // Condensed version
            const parts = [];
            if (data.population.ages) parts.push(data.population.ages);
            if (data.population.gender) parts.push(data.population.gender);
            
            if (parts.length > 0) {
                section += `  - ${parts.join(', ')}\n`;
            }
            
            if (data.population.specialPopulations && data.population.specialPopulations.length > 0) {
                section += `  - ${data.population.specialPopulations.join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generateStructureSection(data, detail) {
        if (!data.structure) return '';
        
        let section = '\nPROGRAM STRUCTURE:\n';
        
        if (detail === 'comprehensive') {
            if (data.structure.los || data.structure.avgLOS) {
                section += `  Length of Stay: ${data.structure.avgLOS || data.structure.los}\n`;
            }
            
            if (data.structure.capacity) {
                section += `  Capacity: ${data.structure.capacity} beds\n`;
            }
            
            if (data.structure.ratio) {
                section += `  Staff Ratio: ${data.structure.ratio}\n`;
            }
            
            if (data.structure.dailySchedule) {
                section += '\n  Typical Daily Schedule:\n';
                section += this.formatSchedule(data.structure.dailySchedule);
            }
            
            if (data.structure.phases && data.structure.phases.length > 0) {
                section += '\n  Treatment Phases:\n';
                data.structure.phases.forEach((phase, index) => {
                    section += `    ${index + 1}. ${phase}\n`;
                });
            }
            
            if (data.structure.academics && data.structure.academics.hasProgram) {
                section += '\n  Academic Program:\n';
                if (data.structure.academics.accreditation) {
                    section += `    • Accreditation: ${data.structure.academics.accreditation}\n`;
                }
                if (data.structure.academics.grades) {
                    section += `    • Grades Served: ${data.structure.academics.grades}\n`;
                }
                if (data.structure.academics.onSite) {
                    section += '    • On-site school\n';
                }
                if (data.structure.academics.creditRecovery) {
                    section += '    • Credit recovery available\n';
                }
                if (data.structure.academics.collegeCounseling) {
                    section += '    • College counseling provided\n';
                }
            }
        } else if (detail === 'detailed') {
            // Condensed structure info
            const structurePoints = [];
            
            if (data.structure.avgLOS) {
                structurePoints.push(`Length of stay: ${data.structure.avgLOS}`);
            }
            if (data.structure.capacity) {
                structurePoints.push(`${data.structure.capacity} beds`);
            }
            if (data.structure.ratio) {
                structurePoints.push(`Staff ratio: ${data.structure.ratio}`);
            }
            
            structurePoints.forEach(point => {
                section += `  • ${point}\n`;
            });
            
            if (data.structure.academics?.hasProgram) {
                section += '  • Academic program available\n';
            }
        }
        
        // Environment subsection
        if (data.environment && detail !== 'minimal') {
            section += '\n  Setting & Environment:\n';
            
            if (data.environment.setting) {
                section += `    • ${data.environment.setting}\n`;
            }
            
            if (data.environment.campusSizeAcre) {
                section += `    • ${data.environment.campusSizeAcre} acre campus\n`;
            }
            
            if (data.environment.facilities && data.environment.facilities.length > 0) {
                section += `    • Facilities: ${data.environment.facilities.slice(0, 5).join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generateApproachSection(data) {
        if (!data.approach || !data.philosophy) return '';
        
        let section = '\nTREATMENT APPROACH:\n';
        
        if (data.philosophy) {
            section += `  ${data.philosophy}\n`;
        }
        
        if (data.approach) {
            if (data.approach.traumaInformed) {
                section += '  • Trauma-informed care\n';
            }
            if (data.approach.familyInvolvement) {
                section += '  • Strong family involvement\n';
            }
            if (data.approach.individualizedTreatment) {
                section += '  • Individualized treatment planning\n';
            }
            if (data.approach.holisticCare) {
                section += '  • Holistic approach to healing\n';
            }
        }
        
        return section;
    }
    
    generateFamilySection(data, detail) {
        if (!data.family) return '';
        
        let section = '\nFAMILY PROGRAM:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            if (data.family.weeklyTherapy) {
                section += '  • Weekly family therapy sessions\n';
            }
            
            if (data.family.workshops) {
                section += '  • Family workshops and education\n';
            }
            
            if (data.family.visitationPolicy) {
                section += `  • Visitation: ${data.family.visitationPolicy}\n`;
            }
            
            if (data.family.parentCoaching) {
                section += '  • Parent coaching available\n';
            }
            
            if (data.family.supportGroups) {
                section += '  • Family support groups\n';
            }
            
            if (data.family.communicationPolicy) {
                section += `  • Communication: ${data.family.communicationPolicy}\n`;
            }
        } else {
            // Condensed version
            const familyFeatures = [];
            
            if (data.family.weeklyTherapy) {
                familyFeatures.push('Weekly family therapy');
            }
            if (data.family.workshops) {
                familyFeatures.push('Family education');
            }
            if (data.family.visitationPolicy) {
                familyFeatures.push('Regular visitation');
            }
            
            if (familyFeatures.length > 0) {
                section += `  - ${familyFeatures.join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generatePracticalSection(data, detail) {
        if (!data.admissions) return '';
        
        let section = '\nPRACTICAL INFORMATION:\n';
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            // Insurance
            if (data.admissions.insurance && data.admissions.insurance.length > 0) {
                section += '  Insurance Accepted:\n';
                data.admissions.insurance.forEach(ins => {
                    section += `    • ${ins}\n`;
                });
            }
            
            if (data.admissions.privatePay) {
                section += '  • Private pay accepted\n';
                if (data.admissions.privatePayRate) {
                    section += `    Rate: ${data.admissions.privatePayRate}\n`;
                }
            }
            
            if (data.admissions.financing) {
                section += '  • Financing available\n';
            }
            
            if (data.admissions.scholarships) {
                section += '  • Scholarships/sliding scale available\n';
            }
            
            // Admissions process
            if (data.admissions.admissionsProcess) {
                section += `\n  Admissions Process: ${data.admissions.admissionsProcess}\n`;
            }
            
            if (data.admissions.requirements && data.admissions.requirements.length > 0) {
                section += '  Requirements:\n';
                data.admissions.requirements.forEach(req => {
                    section += `    • ${req}\n`;
                });
            }
            
            // Transportation
            if (data.logistics) {
                if (data.logistics.airportPickup) {
                    section += '  • Airport pickup available\n';
                }
                if (data.logistics.nearestAirport) {
                    section += `  • Nearest airport: ${data.logistics.nearestAirport}\n`;
                }
            }
        } else {
            // Condensed version
            if (data.admissions.insurance && data.admissions.insurance.length > 0) {
                section += `  Insurance: ${data.admissions.insurance.slice(0, 3).join(', ')}\n`;
            }
            
            if (data.admissions.privatePay) {
                section += '  Private pay accepted\n';
            }
        }
        
        return section;
    }
    
    generateOutcomesSection(data) {
        if (!data.outcomes && !data.quality) return '';
        
        let section = '\nOUTCOMES & QUALITY:\n';
        
        if (data.outcomes) {
            if (data.outcomes.successRate) {
                section += `  • Success Rate: ${data.outcomes.successRate}\n`;
            }
            
            if (data.outcomes.completionRate) {
                section += `  • Completion Rate: ${data.outcomes.completionRate}\n`;
            }
            
            if (data.outcomes.satisfactionScore) {
                section += `  • Family Satisfaction: ${data.outcomes.satisfactionScore}\n`;
            }
            
            if (data.outcomes.followUpSupport) {
                section += `  • Alumni Support: ${data.outcomes.followUpSupport}\n`;
            }
        }
        
        if (data.quality) {
            if (data.quality.accreditations && data.quality.accreditations.length > 0) {
                section += `  • Accreditations: ${data.quality.accreditations.join(', ')}\n`;
            }
            
            if (data.quality.memberships && data.quality.memberships.length > 0) {
                section += `  • Professional Memberships: ${data.quality.memberships.join(', ')}\n`;
            }
        }
        
        return section;
    }
    
    generateContactSection(data, detail) {
        let section = '\nCONTACT INFORMATION:\n';
        
        if (data.contact) {
            if (data.contact.phone || data.admissions?.phone) {
                section += `  Phone: ${data.contact.phone || data.admissions.phone}\n`;
            }
            
            if (data.contact.email || data.admissions?.email) {
                section += `  Email: ${data.contact.email || data.admissions.email}\n`;
            }
            
            if (data.contact.admissionsContact) {
                section += `  Admissions: ${data.contact.admissionsContact}\n`;
            }
        }
        
        if (data.website) {
            section += `  Website: ${data.website}\n`;
        }
        
        if (detail === 'comprehensive' || detail === 'detailed') {
            if (data.contact?.availableHours) {
                section += `  Hours: ${data.contact.availableHours}\n`;
            }
            
            if (data.virtualTour) {
                section += '  • Virtual tour available\n';
            }
            
            if (data.references) {
                section += '  • Family references available upon request\n';
            }
        }
        
        return section;
    }
    
    generateMetadata(data, richness) {
        let metadata = '\n' + '-'.repeat(70) + '\n';
        
        const date = new Date().toLocaleDateString();
        metadata += `Assessment Date: ${date}\n`;
        
        if (data.metadata) {
            if (data.metadata.confidence) {
                metadata += `Data Confidence: ${Math.round(data.metadata.confidence * 100)}%\n`;
            }
            
            if (data.metadata.pagesAnalyzed) {
                metadata += `Pages Analyzed: ${data.metadata.pagesAnalyzed}\n`;
            }
        }
        
        metadata += `Data Quality: ${richness.level.charAt(0).toUpperCase() + richness.level.slice(1)}\n`;
        metadata += `Fields Extracted: ${richness.fieldCount}\n`;
        
        return metadata;
    }
    
    // Format customizers for different contexts
    familyMeetingFormat(writeUp, data) {
        // Add family-specific emphasis
        let formatted = writeUp;
        
        // Add family talking points at the beginning
        let talkingPoints = '\nFAMILY DISCUSSION POINTS:\n';
        talkingPoints += '1. How does this program meet our specific needs?\n';
        talkingPoints += '2. What is the family\'s role in treatment?\n';
        talkingPoints += '3. Communication and visitation policies\n';
        talkingPoints += '4. Insurance coverage and financial planning\n';
        talkingPoints += '5. Post-treatment support and transition\n\n';
        
        formatted = formatted.replace('CLINICAL AFTERCARE RECOMMENDATION', 
                                     'CLINICAL AFTERCARE RECOMMENDATION\n\n' + talkingPoints);
        
        return formatted;
    }
    
    clinicalTeamFormat(writeUp, data) {
        // Add clinical emphasis
        let formatted = writeUp;
        
        // Add clinical considerations
        let clinicalNotes = '\nCLINICAL CONSIDERATIONS:\n';
        
        if (data.clinical?.specializations) {
            clinicalNotes += `• Specializations align with patient needs: ${data.clinical.specializations.join(', ')}\n`;
        }
        
        if (data.clinical?.evidenceBased) {
            clinicalNotes += `• Evidence-based approaches available\n`;
        }
        
        if (data.exclusions && data.exclusions.length > 0) {
            clinicalNotes += `• Review exclusion criteria for appropriateness\n`;
        }
        
        formatted = formatted.replace(/CLINICAL PROGRAMMING:/, 
                                     'CLINICAL PROGRAMMING:\n' + clinicalNotes);
        
        return formatted;
    }
    
    insuranceAuthFormat(writeUp, data) {
        // Format for insurance authorization
        let formatted = '='.repeat(70) + '\n';
        formatted += 'INSURANCE AUTHORIZATION SUMMARY\n';
        formatted += '='.repeat(70) + '\n\n';
        
        // Extract key insurance-relevant information
        formatted += `FACILITY: ${data.name}\n`;
        formatted += `LOCATION: ${data.location?.city}, ${data.location?.state}\n`;
        
        if (data.admissions?.insurance) {
            formatted += `\nINSURANCE ACCEPTED:\n`;
            data.admissions.insurance.forEach(ins => {
                formatted += `  • ${ins}\n`;
            });
        }
        
        formatted += `\nLEVEL OF CARE: ${data.levelsOfCare?.join(', ') || 'See clinical assessment'}\n`;
        
        if (data.structure?.avgLOS) {
            formatted += `TYPICAL LENGTH OF STAY: ${data.structure.avgLOS}\n`;
        }
        
        formatted += '\nMEDICAL NECESSITY:\n';
        if (data.clinical?.specializations) {
            formatted += `  Specializations: ${data.clinical.specializations.join(', ')}\n`;
        }
        
        if (data.clinical?.psychiatryAvailable) {
            formatted += '  • Psychiatric services available\n';
        }
        
        if (data.clinical?.medicationManagement) {
            formatted += '  • Medication management provided\n';
        }
        
        if (data.quality?.accreditations) {
            formatted += `\nACCREDITATIONS: ${data.quality.accreditations.join(', ')}\n`;
        }
        
        formatted += '\n' + writeUp.substring(writeUp.indexOf('CONTACT INFORMATION:'));
        
        return formatted;
    }
    
    quickReferenceFormat(writeUp, data) {
        // Ultra-condensed format
        let formatted = `${data.name} - ${data.location?.city}, ${data.location?.state}\n`;
        formatted += '-'.repeat(50) + '\n';
        
        if (data.levelsOfCare) {
            formatted += `Care Levels: ${data.levelsOfCare.join(', ')}\n`;
        }
        
        if (data.population?.ages) {
            formatted += `Ages: ${data.population.ages}\n`;
        }
        
        if (data.clinical?.specializations && data.clinical.specializations.length > 0) {
            formatted += `Focus: ${data.clinical.specializations.slice(0, 3).join(', ')}\n`;
        }
        
        if (data.contact?.phone || data.admissions?.phone) {
            formatted += `Phone: ${data.contact?.phone || data.admissions?.phone}\n`;
        }
        
        if (data.website) {
            formatted += `Web: ${data.website}\n`;
        }
        
        return formatted;
    }
    
    // Helper methods
    formatSchedule(schedule) {
        if (typeof schedule === 'string') {
            return '    ' + schedule.replace(/\n/g, '\n    ') + '\n';
        }
        
        // If schedule is an array of time blocks
        if (Array.isArray(schedule)) {
            let formatted = '';
            schedule.forEach(block => {
                formatted += `    ${block.time}: ${block.activity}\n`;
            });
            return formatted;
        }
        
        return '';
    }
    
    // Analyze what makes this program unique
    generateDifferentiators(data) {
        const differentiators = [];
        
        // Unique clinical offerings
        if (data.clinical?.experiential) {
            const unique = data.clinical.experiential.filter(therapy => 
                !['art therapy', 'music therapy', 'recreation therapy'].includes(therapy.toLowerCase())
            );
            
            if (unique.length > 0) {
                differentiators.push(`Unique therapies: ${unique.join(', ')}`);
            }
        }
        
        // Special populations
        if (data.population?.specialPopulations && data.population.specialPopulations.length > 0) {
            const special = data.population.specialPopulations.filter(pop =>
                !['co-ed', 'males only', 'females only'].includes(pop.toLowerCase())
            );
            
            if (special.length > 0) {
                differentiators.push(`Specialized for ${special.join(', ')}`);
            }
        }
        
        // Unique setting
        if (data.environment?.setting && !data.environment.setting.toLowerCase().includes('suburban')) {
            differentiators.push(data.environment.setting);
        }
        
        // Notable credentials
        if (data.staff?.credentials) {
            const notable = data.staff.credentials.filter(cred =>
                cred.toLowerCase().includes('board certified') ||
                cred.toLowerCase().includes('phd') ||
                cred.toLowerCase().includes('specialized')
            );
            
            if (notable.length > 0) {
                differentiators.push(`Exceptional staff: ${notable[0]}`);
            }
        }
        
        // Unique programs
        if (data.programs?.unique && data.programs.unique.length > 0) {
            differentiators.push(...data.programs.unique.slice(0, 2));
        }
        
        return differentiators;
    }
}

// Export for use in extractor
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DynamicTemplateEngine;
}
