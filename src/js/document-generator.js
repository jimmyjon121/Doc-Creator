// document-generator.js - Professional document generation for aftercare planning

class DocumentGenerator {
    constructor() {
        this.templates = {
            aftercareOptions: this.getAftercareOptionsTemplate(),
            aftercarePlan: this.getAftercarePlanTemplate(),
            dischargePacket: this.getDischargePacketTemplate()
        };
        
        this.documentQueue = [];
    }
    
    // ============= AFTERCARE OPTIONS DOCUMENT =============
    
    generateAftercareOptions(programs, sessionData = null) {
        if (!programs || programs.length === 0) {
            throw new Error('No programs selected for aftercare options document');
        }
        
        const document = {
            type: 'aftercareOptions',
            timestamp: new Date().toISOString(),
            sessionId: sessionData?.sessionId || 'DIRECT',
            content: this.buildAftercareOptionsContent(programs, sessionData)
        };
        
        // Track in session if available
        if (window.sessionManager) {
            window.sessionManager.addDocument({
                type: 'aftercareOptions',
                programs: programs.map(p => p.id)
            });
        }
        
        return document;
    }
    
    buildAftercareOptionsContent(programs, sessionData) {
        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        let content = `
            <div class="document aftercare-options">
                <div class="document-header">
                    <h1>Aftercare Treatment Options</h1>
                    <div class="document-meta">
                        <p>Date: ${date}</p>
                        ${sessionData?.sessionId ? `<p>Session ID: ${sessionData.sessionId}</p>` : ''}
                        ${sessionData?.clinician ? `<p>Prepared by: ${sessionData.clinician}</p>` : ''}
                    </div>
                </div>
                
                <div class="document-intro">
                    <p>The following treatment programs have been identified as potential aftercare options based on the clinical assessment and treatment needs discussed.</p>
                </div>
                
                <div class="programs-section">
        `;
        
        programs.forEach((program, index) => {
            content += this.generateProgramSection(program, index + 1);
        });
        
        content += `
                </div>
                
                <div class="document-footer">
                    <h3>Next Steps</h3>
                    <ol>
                        <li>Review each program option carefully</li>
                        <li>Contact admissions departments for availability and specific questions</li>
                        <li>Verify insurance coverage and financial arrangements</li>
                        <li>Schedule tours or virtual visits when possible</li>
                        <li>Discuss options with your treatment team and family</li>
                    </ol>
                    
                    <div class="disclaimer">
                        <p><strong>Important Note:</strong> This document provides general information about treatment programs. 
                        Admission decisions are made by individual programs based on their assessment of clinical appropriateness 
                        and availability. Insurance coverage should be verified directly with your insurance provider and the 
                        treatment program.</p>
                    </div>
                </div>
            </div>
        `;
        
        return content;
    }
    
    generateProgramSection(program, number) {
        return `
            <div class="program-option">
                <h2>Option ${number}: ${program.name}</h2>
                
                <div class="program-overview">
                    <div class="program-location">
                        <strong>Location:</strong> ${program.location?.city || ''}, ${program.location?.state || ''}
                        ${program.location?.distance ? `(${program.location.distance} miles)` : ''}
                    </div>
                    
                    <div class="program-contact">
                        <strong>Contact:</strong>
                        ${program.contact?.phone ? `Phone: ${program.contact.phone}` : ''}
                        ${program.contact?.email ? `| Email: ${program.contact.email}` : ''}
                        ${program.website ? `<br>Website: ${program.website}` : ''}
                    </div>
                </div>
                
                <div class="clinical-services">
                    <h3>Clinical Services</h3>
                    
                    <div class="levels-of-care">
                        <strong>Levels of Care:</strong>
                        <ul>
                            ${(program.clinical?.levelsOfCare || []).map(level => 
                                `<li>${level}</li>`
                            ).join('')}
                        </ul>
                    </div>
                    
                    ${program.clinical?.primaryFocus ? `
                        <div class="primary-focus">
                            <strong>Primary Focus:</strong> ${program.clinical.primaryFocus}
                        </div>
                    ` : ''}
                    
                    ${program.clinical?.specializations?.length > 0 ? `
                        <div class="specializations">
                            <strong>Specializations:</strong>
                            ${program.clinical.specializations.join(', ')}
                        </div>
                    ` : ''}
                    
                    <div class="therapeutic-modalities">
                        <strong>Therapeutic Approaches:</strong>
                        <ul>
                            ${(program.clinical?.modalities?.evidenceBased || []).map(therapy => 
                                `<li>${therapy} (Evidence-Based)</li>`
                            ).join('')}
                            ${(program.clinical?.modalities?.experiential || []).map(therapy => 
                                `<li>${therapy} (Experiential)</li>`
                            ).join('')}
                        </ul>
                    </div>
                </div>
                
                <div class="program-details">
                    <h3>Program Details</h3>
                    
                    <div class="population">
                        <strong>Population Served:</strong>
                        ${program.population?.ages || 'All ages'}
                        ${program.population?.gender ? `| ${program.population.gender}` : ''}
                    </div>
                    
                    ${program.structure?.lengthOfStay ? `
                        <div class="length-of-stay">
                            <strong>Typical Length of Stay:</strong> ${program.structure.lengthOfStay}
                        </div>
                    ` : ''}
                    
                    ${program.family?.involvement ? `
                        <div class="family-program">
                            <strong>Family Involvement:</strong> ${program.family.involvement}
                        </div>
                    ` : ''}
                </div>
                
                <div class="admissions-insurance">
                    <h3>Admissions & Insurance</h3>
                    
                    ${program.admissions?.insurance?.length > 0 ? `
                        <div class="insurance">
                            <strong>Insurance Accepted:</strong>
                            ${program.admissions.insurance.join(', ')}
                        </div>
                    ` : ''}
                    
                    ${program.admissions?.requirements?.length > 0 ? `
                        <div class="requirements">
                            <strong>Admission Requirements:</strong>
                            <ul>
                                ${program.admissions.requirements.map(req => 
                                    `<li>${req}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                </div>
                
                ${program.quality?.accreditations?.length > 0 ? `
                    <div class="accreditations">
                        <strong>Accreditations:</strong> ${program.quality.accreditations.join(', ')}
                    </div>
                ` : ''}
                
                ${program.notes ? `
                    <div class="clinical-notes">
                        <strong>Clinical Notes:</strong> ${program.notes}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    // ============= AFTERCARE PLAN DOCUMENT =============
    
    generateAftercarePlan(selectedProgram, transitionPlan, sessionData = null) {
        if (!selectedProgram) {
            throw new Error('No program selected for aftercare plan');
        }
        
        const document = {
            type: 'aftercarePlan',
            timestamp: new Date().toISOString(),
            sessionId: sessionData?.sessionId || 'DIRECT',
            content: this.buildAftercarePlanContent(selectedProgram, transitionPlan, sessionData)
        };
        
        // Track in session
        if (window.sessionManager) {
            window.sessionManager.addDocument({
                type: 'aftercarePlan',
                programs: [selectedProgram.id]
            });
        }
        
        return document;
    }
    
    buildAftercarePlanContent(program, plan, sessionData) {
        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        return `
            <div class="document aftercare-plan">
                <div class="document-header">
                    <h1>Aftercare Treatment Plan</h1>
                    <div class="document-meta">
                        <p>Date: ${date}</p>
                        ${sessionData?.sessionId ? `<p>Session ID: ${sessionData.sessionId}</p>` : ''}
                        ${sessionData?.clinician ? `<p>Prepared by: ${sessionData.clinician}</p>` : ''}
                    </div>
                </div>
                
                <div class="selected-program">
                    <h2>Recommended Program</h2>
                    <div class="program-info">
                        <h3>${program.name}</h3>
                        <p>${program.location?.city}, ${program.location?.state}</p>
                        <p>Contact: ${program.contact?.phone || ''}</p>
                    </div>
                </div>
                
                <div class="transition-timeline">
                    <h2>Transition Timeline</h2>
                    <table class="timeline-table">
                        <tr>
                            <th>Phase</th>
                            <th>Timeline</th>
                            <th>Actions</th>
                        </tr>
                        <tr>
                            <td>Pre-Admission</td>
                            <td>${plan?.preAdmissionDate || '[To be determined]'}</td>
                            <td>
                                <ul>
                                    <li>Complete admission paperwork</li>
                                    <li>Insurance verification</li>
                                    <li>Medical clearance if required</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td>Admission</td>
                            <td>${plan?.admissionDate || '[To be determined]'}</td>
                            <td>
                                <ul>
                                    <li>Intake assessment</li>
                                    <li>Orientation to program</li>
                                    <li>Initial treatment planning</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td>Active Treatment</td>
                            <td>${plan?.treatmentDuration || program.structure?.lengthOfStay || '[Variable]'}</td>
                            <td>
                                <ul>
                                    <li>Participate in all program components</li>
                                    <li>Regular family involvement</li>
                                    <li>Progress monitoring</li>
                                </ul>
                            </td>
                        </tr>
                        <tr>
                            <td>Discharge Planning</td>
                            <td>${plan?.dischargePlanning || '2-4 weeks before completion'}</td>
                            <td>
                                <ul>
                                    <li>Aftercare planning</li>
                                    <li>Coordinate continuing care</li>
                                    <li>Establish support systems</li>
                                </ul>
                            </td>
                        </tr>
                    </table>
                </div>
                
                <div class="treatment-goals">
                    <h2>Treatment Goals</h2>
                    <ol>
                        ${(plan?.goals || [
                            'Stabilization and safety',
                            'Development of coping skills',
                            'Address underlying issues',
                            'Family healing and education',
                            'Relapse prevention planning',
                            'Transition to lower level of care'
                        ]).map(goal => `<li>${goal}</li>`).join('')}
                    </ol>
                </div>
                
                <div class="clinical-recommendations">
                    <h2>Clinical Recommendations</h2>
                    <ul>
                        <li><strong>Level of Care:</strong> ${program.clinical?.levelsOfCare?.[0] || 'As determined by assessment'}</li>
                        <li><strong>Primary Focus:</strong> ${program.clinical?.primaryFocus || 'Comprehensive treatment'}</li>
                        <li><strong>Therapeutic Modalities:</strong> ${(program.clinical?.modalities?.evidenceBased || []).join(', ') || 'Multi-modal approach'}</li>
                        <li><strong>Family Involvement:</strong> ${program.family?.involvement || 'Encouraged'}</li>
                    </ul>
                </div>
                
                <div class="follow-up">
                    <h2>Follow-Up Care</h2>
                    <p>Upon completion of the program, the following continuing care is recommended:</p>
                    <ul>
                        <li>Outpatient therapy (individual and/or group)</li>
                        <li>Psychiatric services as needed</li>
                        <li>Support group participation</li>
                        <li>Family therapy continuation</li>
                        <li>Academic/vocational support</li>
                        <li>Alumni program participation</li>
                    </ul>
                </div>
                
                <div class="signatures">
                    <h2>Acknowledgment</h2>
                    <p>This aftercare plan has been reviewed and discussed with all relevant parties.</p>
                    <div class="signature-lines">
                        <div class="signature-line">
                            <p>_______________________________</p>
                            <p>Patient/Guardian Signature</p>
                            <p>Date: _______________</p>
                        </div>
                        <div class="signature-line">
                            <p>_______________________________</p>
                            <p>Clinician Signature</p>
                            <p>Date: _______________</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    
    // ============= DISCHARGE PACKET COMPILER =============
    
    compileDischargePacket(components, sessionData = null) {
        const packet = {
            type: 'dischargePacket',
            timestamp: new Date().toISOString(),
            sessionId: sessionData?.sessionId || 'DIRECT',
            components: components,
            content: this.buildDischargePacket(components, sessionData)
        };
        
        // Track in session
        if (window.sessionManager) {
            window.sessionManager.addDocument({
                type: 'dischargePacket',
                components: components.map(c => c.type)
            });
        }
        
        return packet;
    }
    
    buildDischargePacket(components, sessionData) {
        const date = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        let content = `
            <div class="document discharge-packet">
                <div class="cover-page">
                    <h1>Discharge Documentation Packet</h1>
                    <div class="packet-meta">
                        <p>Prepared: ${date}</p>
                        ${sessionData?.sessionId ? `<p>Session ID: ${sessionData.sessionId}</p>` : ''}
                        ${sessionData?.clinician ? `<p>Clinician: ${sessionData.clinician}</p>` : ''}
                    </div>
                    
                    <div class="table-of-contents">
                        <h2>Contents</h2>
                        <ol>
                            ${components.map(component => 
                                `<li>${this.getComponentTitle(component.type)}</li>`
                            ).join('')}
                        </ol>
                    </div>
                </div>
                
                <div class="page-break"></div>
        `;
        
        // Add each component
        components.forEach(component => {
            content += component.content;
            content += '<div class="page-break"></div>';
        });
        
        content += `
            </div>
        `;
        
        return content;
    }
    
    getComponentTitle(type) {
        const titles = {
            'aftercareOptions': 'Aftercare Treatment Options',
            'aftercarePlan': 'Aftercare Treatment Plan',
            'insuranceAuth': 'Insurance Authorization Request',
            'clinicalSummary': 'Clinical Summary',
            'familyEducation': 'Family Education Materials',
            'programBrochures': 'Program Information',
            'consentForms': 'Consent Forms',
            'medicationList': 'Current Medications',
            'emergencyContacts': 'Emergency Contact Information'
        };
        
        return titles[type] || type;
    }
    
    // ============= EXPORT FUNCTIONS =============
    
    exportAsPDF(document) {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${document.type} - ${new Date().toLocaleDateString()}</title>
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                ${document.content}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        
        // Auto-print after load
        printWindow.onload = function() {
            printWindow.print();
        };
    }
    
    exportAsWord(document) {
        // Create a blob with Word-compatible HTML
        const html = `
            <html xmlns:o='urn:schemas-microsoft-com:office:office' 
                  xmlns:w='urn:schemas-microsoft-com:office:word' 
                  xmlns='http://www.w3.org/TR/REC-html40'>
            <head>
                <meta charset='utf-8'>
                <title>${document.type}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    h1 { font-size: 24pt; }
                    h2 { font-size: 18pt; }
                    h3 { font-size: 14pt; }
                    .page-break { page-break-before: always; }
                </style>
            </head>
            <body>
                ${document.content}
            </body>
            </html>
        `;
        
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${document.type}_${new Date().getTime()}.doc`;
        link.click();
        
        URL.revokeObjectURL(url);
    }
    
    getPrintStyles() {
        return `
            @page {
                size: letter;
                margin: 1in;
            }
            
            body {
                font-family: 'Times New Roman', serif;
                font-size: 12pt;
                line-height: 1.5;
                color: #000;
            }
            
            h1 {
                font-size: 24pt;
                margin-bottom: 12pt;
                text-align: center;
            }
            
            h2 {
                font-size: 18pt;
                margin-top: 18pt;
                margin-bottom: 12pt;
                border-bottom: 2px solid #000;
            }
            
            h3 {
                font-size: 14pt;
                margin-top: 12pt;
                margin-bottom: 8pt;
                font-weight: bold;
            }
            
            .document-header {
                border-bottom: 3px solid #000;
                padding-bottom: 12pt;
                margin-bottom: 24pt;
            }
            
            .document-meta {
                text-align: right;
                font-size: 10pt;
            }
            
            .program-option {
                page-break-inside: avoid;
                margin-bottom: 24pt;
                border: 1px solid #ccc;
                padding: 12pt;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                margin: 12pt 0;
            }
            
            th, td {
                border: 1px solid #000;
                padding: 8pt;
                text-align: left;
            }
            
            th {
                background-color: #f0f0f0;
                font-weight: bold;
            }
            
            .signature-lines {
                display: flex;
                justify-content: space-between;
                margin-top: 48pt;
            }
            
            .signature-line {
                width: 45%;
                text-align: center;
            }
            
            @media print {
                .no-print {
                    display: none;
                }
            }
        `;
    }
    
    // ============= TEMPLATE MANAGEMENT =============
    
    getAftercareOptionsTemplate() {
        return {
            sections: [
                'header',
                'introduction',
                'programOptions',
                'nextSteps',
                'disclaimer'
            ],
            requiredFields: [
                'programs',
                'date'
            ]
        };
    }
    
    getAftercarePlanTemplate() {
        return {
            sections: [
                'header',
                'selectedProgram',
                'transitionTimeline',
                'treatmentGoals',
                'clinicalRecommendations',
                'followUpCare',
                'signatures'
            ],
            requiredFields: [
                'program',
                'date'
            ]
        };
    }
    
    getDischargePacketTemplate() {
        return {
            sections: [
                'coverPage',
                'tableOfContents',
                'components'
            ],
            requiredFields: [
                'components',
                'date'
            ]
        };
    }
}

// Initialize document generator globally
window.documentGenerator = new DocumentGenerator();
