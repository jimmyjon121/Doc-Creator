// comparison-matrix.js - Advanced program comparison tool for clinical decision-making

class ComparisonMatrix {
    constructor() {
        this.selectedPrograms = [];
        this.maxPrograms = 4;
        this.comparisonCategories = {
            'Clinical Services': [
                'levelsOfCare',
                'primaryFocus',
                'specializations',
                'evidenceBasedTherapies',
                'experientialTherapies',
                'holisticTherapies'
            ],
            'Population': [
                'agesServed',
                'gender',
                'specialPopulations'
            ],
            'Program Structure': [
                'programLength',
                'capacity',
                'staffRatio',
                'groupSize'
            ],
            'Medical & Psychiatric': [
                'medicalServices',
                'psychiatricServices',
                'medicationManagement',
                'detoxServices'
            ],
            'Family Program': [
                'familyTherapy',
                'familyEducation',
                'familyVisitation'
            ],
            'Academic/Vocational': [
                'academicSupport',
                'vocationalTraining',
                'collegePrep'
            ],
            'Admissions & Insurance': [
                'insuranceAccepted',
                'privatePayOptions',
                'financialAssistance',
                'admissionRequirements'
            ],
            'Accreditations & Quality': [
                'accreditations',
                'memberships',
                'successMetrics'
            ],
            'Amenities & Environment': [
                'setting',
                'facilities',
                'roomTypes',
                'recreation'
            ],
            'Aftercare & Support': [
                'aftercareServices',
                'alumniProgram',
                'transitionSupport'
            ]
        };
    }
    
    addProgram(programId) {
        if (this.selectedPrograms.length >= this.maxPrograms) {
            this.showNotification(`Maximum ${this.maxPrograms} programs can be compared at once`, 'warning');
            return false;
        }
        
        if (!this.selectedPrograms.includes(programId)) {
            this.selectedPrograms.push(programId);
            this.updateComparisonView();
            
            // Track in session
            if (window.sessionManager) {
                window.sessionManager.addProgramToCompare(programId);
            }
            
            return true;
        }
        
        return false;
    }
    
    removeProgram(programId) {
        const index = this.selectedPrograms.indexOf(programId);
        if (index > -1) {
            this.selectedPrograms.splice(index, 1);
            this.updateComparisonView();
        }
    }
    
    clearComparison() {
        this.selectedPrograms = [];
        this.updateComparisonView();
    }
    
    generateComparisonMatrix() {
        if (this.selectedPrograms.length < 2) {
            return null;
        }
        
        const programs = this.selectedPrograms.map(id => this.getProgramData(id));
        const matrix = document.createElement('div');
        matrix.className = 'comparison-matrix';
        
        // Header with program names
        const header = this.createMatrixHeader(programs);
        matrix.appendChild(header);
        
        // Category sections
        Object.entries(this.comparisonCategories).forEach(([category, fields]) => {
            const section = this.createCategorySection(category, fields, programs);
            matrix.appendChild(section);
        });
        
        // Action buttons
        const actions = this.createMatrixActions();
        matrix.appendChild(actions);
        
        return matrix;
    }
    
    createMatrixHeader(programs) {
        const header = document.createElement('div');
        header.className = 'matrix-header';
        
        header.innerHTML = `
            <div class="matrix-row header-row">
                <div class="matrix-cell category-header">
                    <h3>Comparison Criteria</h3>
                </div>
                ${programs.map(program => `
                    <div class="matrix-cell program-header">
                        <h4>${program.name}</h4>
                        <p class="program-location">${program.location.city}, ${program.location.state}</p>
                        <button class="btn-remove-program" data-program-id="${program.id}">
                            Remove
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add remove handlers
        header.querySelectorAll('.btn-remove-program').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.removeProgram(e.target.dataset.programId);
            });
        });
        
        return header;
    }
    
    createCategorySection(categoryName, fields, programs) {
        const section = document.createElement('div');
        section.className = 'matrix-category';
        
        // Category title
        const title = document.createElement('div');
        title.className = 'matrix-category-title';
        title.innerHTML = `<h4>${categoryName}</h4>`;
        section.appendChild(title);
        
        // Field rows
        fields.forEach(field => {
            const row = this.createFieldRow(field, programs);
            section.appendChild(row);
        });
        
        return section;
    }
    
    createFieldRow(fieldName, programs) {
        const row = document.createElement('div');
        row.className = 'matrix-row';
        
        // Field label
        const labelCell = document.createElement('div');
        labelCell.className = 'matrix-cell field-label';
        labelCell.textContent = this.formatFieldName(fieldName);
        row.appendChild(labelCell);
        
        // Program values
        programs.forEach(program => {
            const valueCell = document.createElement('div');
            valueCell.className = 'matrix-cell field-value';
            
            const value = this.getFieldValue(program, fieldName);
            const formattedValue = this.formatFieldValue(fieldName, value);
            
            // Highlight differences
            if (this.isDifferent(fieldName, programs)) {
                valueCell.classList.add('different');
            }
            
            // Special formatting for certain fields
            if (fieldName === 'insuranceAccepted' && Array.isArray(value)) {
                valueCell.innerHTML = this.formatInsuranceList(value);
            } else if (Array.isArray(value)) {
                valueCell.innerHTML = this.formatArrayValue(value);
            } else if (typeof value === 'boolean') {
                valueCell.innerHTML = this.formatBooleanValue(value);
            } else {
                valueCell.textContent = formattedValue || 'Not specified';
            }
            
            row.appendChild(valueCell);
        });
        
        return row;
    }
    
    getFieldValue(program, fieldName) {
        // Navigate nested object structure
        const fieldMap = {
            'levelsOfCare': program.clinical?.levelsOfCare,
            'primaryFocus': program.clinical?.primaryFocus,
            'specializations': program.clinical?.specializations,
            'evidenceBasedTherapies': program.clinical?.modalities?.evidenceBased,
            'experientialTherapies': program.clinical?.modalities?.experiential,
            'holisticTherapies': program.clinical?.modalities?.holistic,
            'agesServed': program.population?.ages,
            'gender': program.population?.gender,
            'specialPopulations': program.population?.specialPopulations,
            'programLength': program.structure?.lengthOfStay,
            'capacity': program.structure?.capacity,
            'staffRatio': program.structure?.staffRatio,
            'groupSize': program.structure?.groupSize,
            'medicalServices': program.medical?.services,
            'psychiatricServices': program.medical?.psychiatric,
            'medicationManagement': program.medical?.medicationManagement,
            'detoxServices': program.medical?.detox,
            'familyTherapy': program.family?.therapy,
            'familyEducation': program.family?.education,
            'familyVisitation': program.family?.visitation,
            'academicSupport': program.education?.academic,
            'vocationalTraining': program.education?.vocational,
            'collegePrep': program.education?.collegePrep,
            'insuranceAccepted': program.admissions?.insurance,
            'privatePayOptions': program.admissions?.privatePay,
            'financialAssistance': program.admissions?.financialAid,
            'admissionRequirements': program.admissions?.requirements,
            'accreditations': program.quality?.accreditations,
            'memberships': program.quality?.memberships,
            'successMetrics': program.quality?.outcomes,
            'setting': program.environment?.setting,
            'facilities': program.environment?.facilities,
            'roomTypes': program.environment?.roomTypes,
            'recreation': program.environment?.recreation,
            'aftercareServices': program.aftercare?.services,
            'alumniProgram': program.aftercare?.alumni,
            'transitionSupport': program.aftercare?.transition
        };
        
        return fieldMap[fieldName];
    }
    
    formatFieldName(fieldName) {
        // Convert camelCase to readable text
        return fieldName
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }
    
    formatFieldValue(fieldName, value) {
        if (value === null || value === undefined) {
            return 'Not specified';
        }
        
        if (Array.isArray(value)) {
            return value.length > 0 ? value.join(', ') : 'None specified';
        }
        
        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }
        
        return value.toString();
    }
    
    formatInsuranceList(insuranceArray) {
        if (!insuranceArray || insuranceArray.length === 0) {
            return '<span class="no-insurance">No insurance information</span>';
        }
        
        const majorInsurers = ['BCBS', 'Aetna', 'Cigna', 'United', 'Anthem', 'Humana'];
        const hasMajor = insuranceArray.some(ins => 
            majorInsurers.some(major => ins.includes(major))
        );
        
        return `
            <div class="insurance-list">
                ${hasMajor ? '<span class="has-major">✓ Major insurers</span>' : ''}
                <ul>
                    ${insuranceArray.map(ins => `<li>${ins}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    formatArrayValue(array) {
        if (!array || array.length === 0) {
            return '<span class="empty-value">None specified</span>';
        }
        
        if (array.length > 3) {
            return `
                <div class="array-value">
                    <span class="count">${array.length} items</span>
                    <ul class="compact-list">
                        ${array.slice(0, 3).map(item => `<li>${item}</li>`).join('')}
                        <li class="more">...and ${array.length - 3} more</li>
                    </ul>
                </div>
            `;
        }
        
        return `
            <ul class="compact-list">
                ${array.map(item => `<li>${item}</li>`).join('')}
            </ul>
        `;
    }
    
    formatBooleanValue(value) {
        if (value) {
            return '<span class="boolean-yes">✓ Yes</span>';
        }
        return '<span class="boolean-no">✗ No</span>';
    }
    
    isDifferent(fieldName, programs) {
        const values = programs.map(p => this.getFieldValue(p, fieldName));
        
        // Handle array comparison
        if (Array.isArray(values[0])) {
            return !values.every(v => 
                JSON.stringify(v?.sort()) === JSON.stringify(values[0]?.sort())
            );
        }
        
        // Simple value comparison
        return !values.every(v => v === values[0]);
    }
    
    createMatrixActions() {
        const actions = document.createElement('div');
        actions.className = 'matrix-actions';
        
        actions.innerHTML = `
            <button class="btn btn-primary" onclick="comparisonMatrix.exportComparison()">
                Export Comparison (PDF)
            </button>
            <button class="btn btn-secondary" onclick="comparisonMatrix.printComparison()">
                Print Comparison
            </button>
            <button class="btn btn-secondary" onclick="comparisonMatrix.saveAsTemplate()">
                Save as Template
            </button>
            <button class="btn btn-tertiary" onclick="comparisonMatrix.clearComparison()">
                Clear Comparison
            </button>
        `;
        
        return actions;
    }
    
    exportComparison() {
        // Generate PDF export
        const matrix = this.generateComparisonMatrix();
        if (!matrix) {
            this.showNotification('Please select at least 2 programs to compare', 'warning');
            return;
        }
        
        // Create print-friendly version
        const printContent = this.createPrintVersion(matrix);
        
        // Generate PDF using browser print
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Program Comparison - ${new Date().toLocaleDateString()}</title>
                <style>
                    ${this.getPrintStyles()}
                </style>
            </head>
            <body>
                ${printContent}
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }
    
    printComparison() {
        window.print();
    }
    
    saveAsTemplate() {
        // Save current comparison criteria as a template
        const template = {
            name: prompt('Enter template name:'),
            date: new Date().toISOString(),
            programs: this.selectedPrograms,
            criteria: Object.keys(this.comparisonCategories)
        };
        
        if (template.name) {
            const templates = JSON.parse(localStorage.getItem('comparisonTemplates') || '[]');
            templates.push(template);
            localStorage.setItem('comparisonTemplates', JSON.stringify(templates));
            
            this.showNotification('Template saved successfully', 'success');
        }
    }
    
    getProgramData(programId) {
        // Get program data from the main programs array
        // This would connect to your existing program database
        return window.programsData?.find(p => p.id === programId) || {};
    }
    
    updateComparisonView() {
        const container = document.getElementById('comparison-container');
        if (!container) return;
        
        if (this.selectedPrograms.length === 0) {
            container.innerHTML = `
                <div class="comparison-empty">
                    <p>Select 2-4 programs to compare</p>
                </div>
            `;
        } else if (this.selectedPrograms.length === 1) {
            container.innerHTML = `
                <div class="comparison-waiting">
                    <p>1 program selected. Select at least 1 more to compare.</p>
                </div>
            `;
        } else {
            const matrix = this.generateComparisonMatrix();
            container.innerHTML = '';
            container.appendChild(matrix);
        }
    }
    
    getPrintStyles() {
        return `
            body { font-family: Arial, sans-serif; }
            .matrix-header { background: #f0f0f0; font-weight: bold; }
            .matrix-row { display: flex; border-bottom: 1px solid #ddd; }
            .matrix-cell { flex: 1; padding: 8px; }
            .matrix-category-title { background: #e0e0e0; padding: 5px; margin-top: 10px; }
            .different { background: #fff3cd; }
            @media print {
                .btn { display: none; }
                .matrix-actions { display: none; }
            }
        `;
    }
    
    createPrintVersion(matrix) {
        const clone = matrix.cloneNode(true);
        // Remove buttons and interactive elements
        clone.querySelectorAll('button').forEach(btn => btn.remove());
        return clone.outerHTML;
    }
    
    showNotification(message, type) {
        // Use session manager's notification if available
        if (window.sessionManager) {
            window.sessionManager.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize comparison matrix globally
window.comparisonMatrix = new ComparisonMatrix();
