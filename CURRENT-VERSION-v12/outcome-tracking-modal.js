/**
 * Outcome Tracking Modal
 * Multi-step modal for capturing discharge outcomes when completing aftercare plans
 * @file outcome-tracking-modal.js
 */

(function() {
    'use strict';

    // ============================================================================
    // CONSTANTS
    // ============================================================================

    const OUTCOME_TYPES = {
        PROGRAM: 'program',
        HOME_WITH_SUPPORTS: 'home-with-supports',
        CLINICIAN_RECOMMENDED: 'clinician-recommended',
        AMA: 'ama',
        FAMILY_OVERRIDE: 'family-override'
    };

    const PROGRAM_TYPES = [
        { id: 'php', label: 'PHP (Partial Hospitalization)' },
        { id: 'iop', label: 'IOP (Intensive Outpatient)' },
        { id: 'tbs', label: 'TBS (Therapeutic Boarding)' },
        { id: 'sober-living', label: 'Sober Living' },
        { id: 'residential', label: 'Residential Treatment' },
        { id: 'wilderness', label: 'Wilderness Program' },
        { id: 'outpatient', label: 'Outpatient' },
        { id: 'other', label: 'Other' }
    ];

    const RESOURCE_TYPES = [
        { id: 'therapist', label: 'Outpatient Therapist', icon: '🧠' },
        { id: 'psychiatrist', label: 'Psychiatrist', icon: '💊' },
        { id: 'support-group', label: 'Support Group (AA/NA/etc)', icon: '👥' },
        { id: 'school-counselor', label: 'School Counselor', icon: '🏫' },
        { id: 'case-manager', label: 'Case Manager', icon: '📋' },
        { id: 'other', label: 'Other Resource', icon: '📌' }
    ];

    const FREQUENCY_OPTIONS = [
        { id: 'daily', label: 'Daily' },
        { id: 'weekly', label: 'Weekly' },
        { id: 'biweekly', label: 'Bi-weekly' },
        { id: 'monthly', label: 'Monthly' },
        { id: 'as-needed', label: 'As Needed' }
    ];

    const US_STATES = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
    ];

    // ============================================================================
    // MODAL CLASS
    // ============================================================================

    class OutcomeTrackingModal {
        constructor() {
            this.modalElement = null;
            this.currentStep = 1;
            this.clientId = null;
            this.clientInitials = '';
            this.selectedPrograms = [];
            this.documentId = null;
            
            // Form state
            this.outcomeData = {
                outcomeType: null,
                familyFollowedRecommendation: null,
                primaryPlacement: {
                    programId: null,
                    programName: '',
                    programType: '',
                    location: '',
                    isCustomEntry: false,
                    contactInfo: '',
                    startDate: null,
                    notes: ''
                },
                atHomeResources: [],
                clinicianRecommendedPlan: {
                    recommendedProgramId: null,
                    recommendedProgramName: '',
                    recommendedProgramType: '',
                    alternativeResources: [],
                    clinicalRationale: ''
                }
            };
            
            this.onComplete = null;
            this.onCancel = null;
        }

        // ========================================================================
        // PUBLIC METHODS
        // ========================================================================

        /**
         * Show the outcome tracking modal
         * @param {Object} options - { clientId, clientInitials, selectedPrograms, documentId, onComplete, onCancel }
         */
        show(options = {}) {
            this.clientId = options.clientId;
            this.clientInitials = options.clientInitials || 'Client';
            this.selectedPrograms = options.selectedPrograms || [];
            this.documentId = options.documentId;
            this.onComplete = options.onComplete;
            this.onCancel = options.onCancel;
            
            // Reset state
            this.currentStep = 1;
            this.resetOutcomeData();
            
            // Create and show modal
            this.createModal();
            this.renderStep(1);
            
            // Add to DOM
            document.body.appendChild(this.modalElement);
            
            // Focus first input after a brief delay
            setTimeout(() => {
                const firstInput = this.modalElement.querySelector('input[type="radio"]');
                if (firstInput) firstInput.focus();
            }, 100);
        }

        /**
         * Close the modal
         */
        close() {
            if (this.modalElement) {
                this.modalElement.remove();
                this.modalElement = null;
            }
        }

        // ========================================================================
        // MODAL CREATION
        // ========================================================================

        createModal() {
            // Remove existing modal if any
            this.close();
            
            const modal = document.createElement('div');
            modal.id = 'outcomeTrackingModal';
            modal.className = 'otm-overlay';
            modal.innerHTML = `
                <div class="otm-modal">
                    <div class="otm-header">
                        <div class="otm-header__title">
                            <span class="otm-header__icon">📋</span>
                            <span>Discharge Outcome for <strong>${this.clientInitials}</strong></span>
                        </div>
                        <button class="otm-close-btn" onclick="window.outcomeTrackingModal.close()">×</button>
                    </div>
                    <div class="otm-progress">
                        <div class="otm-progress__step otm-progress__step--active" data-step="1">
                            <span class="otm-progress__number">1</span>
                            <span class="otm-progress__label">Compliance</span>
                        </div>
                        <div class="otm-progress__line"></div>
                        <div class="otm-progress__step" data-step="2">
                            <span class="otm-progress__number">2</span>
                            <span class="otm-progress__label">Details</span>
                        </div>
                    </div>
                    <div class="otm-content" id="otmContent">
                        <!-- Dynamic content rendered here -->
                    </div>
                    <div class="otm-footer">
                        <button class="otm-btn otm-btn--secondary" id="otmBackBtn" onclick="window.outcomeTrackingModal.goBack()" style="display: none;">
                            ← Back
                        </button>
                        <div class="otm-footer__spacer"></div>
                        <button class="otm-btn otm-btn--ghost" onclick="window.outcomeTrackingModal.handleCancel()">
                            Cancel
                        </button>
                        <button class="otm-btn otm-btn--primary" id="otmNextBtn" onclick="window.outcomeTrackingModal.goNext()">
                            Continue →
                        </button>
                    </div>
                </div>
            `;
            
            // Add styles if not already present
            this.injectStyles();
            
            this.modalElement = modal;
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.handleCancel();
                }
            });
            
            // Close on Escape
            document.addEventListener('keydown', this.handleKeydown.bind(this));
        }

        handleKeydown(e) {
            if (e.key === 'Escape' && this.modalElement) {
                this.handleCancel();
            }
        }

        // ========================================================================
        // STEP RENDERING
        // ========================================================================

        renderStep(step) {
            this.currentStep = step;
            const content = document.getElementById('otmContent');
            if (!content) return;
            
            // Update progress indicator
            this.updateProgress(step);
            
            // Update buttons
            this.updateButtons(step);
            
            // Render content based on step
            switch (step) {
                case 1:
                    content.innerHTML = this.renderStep1();
                    break;
                case 2:
                    content.innerHTML = this.renderStep2();
                    break;
                default:
                    content.innerHTML = '<p>Unknown step</p>';
            }
            
            // Bind events
            this.bindStepEvents(step);
        }

        updateProgress(step) {
            const steps = this.modalElement.querySelectorAll('.otm-progress__step');
            steps.forEach((el, i) => {
                const stepNum = i + 1;
                el.classList.remove('otm-progress__step--active', 'otm-progress__step--completed');
                if (stepNum < step) {
                    el.classList.add('otm-progress__step--completed');
                } else if (stepNum === step) {
                    el.classList.add('otm-progress__step--active');
                }
            });
        }

        updateButtons(step) {
            const backBtn = document.getElementById('otmBackBtn');
            const nextBtn = document.getElementById('otmNextBtn');
            
            if (backBtn) {
                backBtn.style.display = step > 1 ? 'inline-flex' : 'none';
            }
            
            if (nextBtn) {
                nextBtn.textContent = step === 2 ? 'Save & Complete' : 'Continue →';
            }
        }

        // ========================================================================
        // STEP 1: FAMILY COMPLIANCE
        // ========================================================================

        renderStep1() {
            return `
                <div class="otm-step">
                    <h3 class="otm-step__title">Is the family following clinical recommendations?</h3>
                    <p class="otm-step__subtitle">Select the outcome that best describes this discharge.</p>
                    
                    <div class="otm-options">
                        <label class="otm-option ${this.outcomeData.outcomeType === OUTCOME_TYPES.PROGRAM ? 'otm-option--selected' : ''}">
                            <input type="radio" name="outcomeType" value="${OUTCOME_TYPES.PROGRAM}" 
                                ${this.outcomeData.outcomeType === OUTCOME_TYPES.PROGRAM ? 'checked' : ''}>
                            <div class="otm-option__content">
                                <div class="otm-option__icon">✅</div>
                                <div class="otm-option__text">
                                    <div class="otm-option__title">Yes - Following primary recommendation</div>
                                    <div class="otm-option__desc">Client is going to a recommended program (PHP, IOP, TBS, etc.)</div>
                                </div>
                            </div>
                        </label>
                        
                        <label class="otm-option ${this.outcomeData.outcomeType === OUTCOME_TYPES.HOME_WITH_SUPPORTS ? 'otm-option--selected' : ''}">
                            <input type="radio" name="outcomeType" value="${OUTCOME_TYPES.HOME_WITH_SUPPORTS}"
                                ${this.outcomeData.outcomeType === OUTCOME_TYPES.HOME_WITH_SUPPORTS ? 'checked' : ''}>
                            <div class="otm-option__content">
                                <div class="otm-option__icon">🏠</div>
                                <div class="otm-option__text">
                                    <div class="otm-option__title">Yes - Following at-home resources plan</div>
                                    <div class="otm-option__desc">Client returning home with outpatient therapy, psychiatrist, support groups, etc.</div>
                                </div>
                            </div>
                        </label>
                        
                        <label class="otm-option ${this.outcomeData.outcomeType === OUTCOME_TYPES.CLINICIAN_RECOMMENDED ? 'otm-option--selected' : ''}">
                            <input type="radio" name="outcomeType" value="${OUTCOME_TYPES.CLINICIAN_RECOMMENDED}"
                                ${this.outcomeData.outcomeType === OUTCOME_TYPES.CLINICIAN_RECOMMENDED ? 'checked' : ''}>
                            <div class="otm-option__content">
                                <div class="otm-option__icon">⚠️</div>
                                <div class="otm-option__text">
                                    <div class="otm-option__title">No - Family override (clinician-recommended plan provided)</div>
                                    <div class="otm-option__desc">Family not following our recommendations; we provided a clinician-recommended plan</div>
                                </div>
                            </div>
                        </label>
                        
                        <label class="otm-option ${this.outcomeData.outcomeType === OUTCOME_TYPES.AMA ? 'otm-option--selected' : ''}">
                            <input type="radio" name="outcomeType" value="${OUTCOME_TYPES.AMA}"
                                ${this.outcomeData.outcomeType === OUTCOME_TYPES.AMA ? 'checked' : ''}>
                            <div class="otm-option__content">
                                <div class="otm-option__icon">❌</div>
                                <div class="otm-option__text">
                                    <div class="otm-option__title">No - AMA / Left without plan</div>
                                    <div class="otm-option__desc">Client left against medical advice or family declined all recommendations</div>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
            `;
        }

        // ========================================================================
        // STEP 2: DETAILS (varies based on outcome type)
        // ========================================================================

        renderStep2() {
            switch (this.outcomeData.outcomeType) {
                case OUTCOME_TYPES.PROGRAM:
                    return this.renderStep2Program();
                case OUTCOME_TYPES.HOME_WITH_SUPPORTS:
                    return this.renderStep2AtHome();
                case OUTCOME_TYPES.CLINICIAN_RECOMMENDED:
                    return this.renderStep2ClinicianRec();
                case OUTCOME_TYPES.AMA:
                    return this.renderStep2AMA();
                default:
                    return '<p>Please select an outcome type first.</p>';
            }
        }

        renderStep2Program() {
            // Build program options from document selections
            const programOptions = this.buildProgramOptions();
            
            return `
                <div class="otm-step">
                    <h3 class="otm-step__title">Where is ${this.clientInitials} going?</h3>
                    <p class="otm-step__subtitle">Select the program from your aftercare document or add a custom entry.</p>
                    
                    <div class="otm-form-group">
                        <label class="otm-label">Select Program</label>
                        <select class="otm-select" id="otmProgramSelect" onchange="window.outcomeTrackingModal.handleProgramSelect(this)">
                            <option value="">-- Select a program --</option>
                            ${programOptions}
                            <option value="__custom__">+ Add program not in list...</option>
                        </select>
                    </div>
                    
                    <div id="otmCustomProgramForm" style="display: ${this.outcomeData.primaryPlacement.isCustomEntry ? 'block' : 'none'};">
                        <div class="otm-form-row">
                            <div class="otm-form-group otm-form-group--flex">
                                <label class="otm-label">Program Name *</label>
                                <input type="text" class="otm-input" id="otmCustomProgramName" 
                                    value="${this.outcomeData.primaryPlacement.programName || ''}"
                                    placeholder="Enter program name">
                            </div>
                            <div class="otm-form-group">
                                <label class="otm-label">Program Type *</label>
                                <select class="otm-select" id="otmCustomProgramType">
                                    <option value="">-- Select type --</option>
                                    ${PROGRAM_TYPES.map(t => `
                                        <option value="${t.id}" ${this.outcomeData.primaryPlacement.programType === t.id ? 'selected' : ''}>${t.label}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="otm-form-row">
                            <div class="otm-form-group">
                                <label class="otm-label">City</label>
                                <input type="text" class="otm-input" id="otmCustomCity" 
                                    value="${this.outcomeData.primaryPlacement.location?.split(',')[0]?.trim() || ''}"
                                    placeholder="City">
                            </div>
                            <div class="otm-form-group">
                                <label class="otm-label">State</label>
                                <select class="otm-select" id="otmCustomState">
                                    <option value="">-- State --</option>
                                    ${US_STATES.map(s => `
                                        <option value="${s}" ${this.outcomeData.primaryPlacement.location?.includes(s) ? 'selected' : ''}>${s}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="otm-form-group">
                            <label class="otm-label">Contact Info (optional)</label>
                            <input type="text" class="otm-input" id="otmCustomContact" 
                                value="${this.outcomeData.primaryPlacement.contactInfo || ''}"
                                placeholder="Phone or email">
                        </div>
                    </div>
                    
                    <div class="otm-form-group">
                        <label class="otm-label">Estimated Start Date</label>
                        <input type="date" class="otm-input" id="otmStartDate" 
                            value="${this.outcomeData.primaryPlacement.startDate || ''}">
                    </div>
                    
                    <div class="otm-form-group">
                        <label class="otm-label">Notes (optional)</label>
                        <textarea class="otm-textarea" id="otmNotes" rows="2" 
                            placeholder="Any additional notes about this placement...">${this.outcomeData.primaryPlacement.notes || ''}</textarea>
                    </div>
                </div>
            `;
        }

        renderStep2AtHome() {
            return `
                <div class="otm-step">
                    <h3 class="otm-step__title">At-Home Support Plan for ${this.clientInitials}</h3>
                    <p class="otm-step__subtitle">Add the resources the client will use at home.</p>
                    
                    <div class="otm-resources-list" id="otmResourcesList">
                        ${this.outcomeData.atHomeResources.length === 0 
                            ? '<div class="otm-empty">No resources added yet. Click a button below to add.</div>'
                            : this.outcomeData.atHomeResources.map((r, i) => this.renderResourceItem(r, i)).join('')
                        }
                    </div>
                    
                    <div class="otm-add-buttons">
                        ${RESOURCE_TYPES.map(t => `
                            <button type="button" class="otm-add-btn" onclick="window.outcomeTrackingModal.addResource('${t.id}')">
                                <span>${t.icon}</span> ${t.label}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        renderResourceItem(resource, index) {
            const typeInfo = RESOURCE_TYPES.find(t => t.id === resource.type) || { icon: '📌', label: 'Resource' };
            return `
                <div class="otm-resource-item" data-index="${index}">
                    <div class="otm-resource-item__header">
                        <span class="otm-resource-item__icon">${typeInfo.icon}</span>
                        <span class="otm-resource-item__type">${typeInfo.label}</span>
                        <button type="button" class="otm-resource-item__remove" onclick="window.outcomeTrackingModal.removeResource(${index})">×</button>
                    </div>
                    <div class="otm-resource-item__body">
                        <div class="otm-form-row">
                            <div class="otm-form-group otm-form-group--flex">
                                <input type="text" class="otm-input otm-input--sm" 
                                    placeholder="Provider name (e.g., Dr. Smith)"
                                    value="${resource.providerName || ''}"
                                    onchange="window.outcomeTrackingModal.updateResource(${index}, 'providerName', this.value)">
                            </div>
                            <div class="otm-form-group">
                                <select class="otm-select otm-select--sm" 
                                    onchange="window.outcomeTrackingModal.updateResource(${index}, 'frequency', this.value)">
                                    ${FREQUENCY_OPTIONS.map(f => `
                                        <option value="${f.id}" ${resource.frequency === f.id ? 'selected' : ''}>${f.label}</option>
                                    `).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        renderStep2ClinicianRec() {
            const programOptions = this.buildProgramOptions();
            
            return `
                <div class="otm-step">
                    <h3 class="otm-step__title">Clinician-Recommended Plan for ${this.clientInitials}</h3>
                    <div class="otm-alert otm-alert--warning">
                        <span class="otm-alert__icon">⚠️</span>
                        <span>Family is not following clinical recommendations.</span>
                    </div>
                    
                    <div class="otm-form-group">
                        <label class="otm-label">What did YOU recommend? *</label>
                        <select class="otm-select" id="otmRecProgram" onchange="window.outcomeTrackingModal.handleRecProgramSelect(this)">
                            <option value="">-- Select recommended program --</option>
                            ${programOptions}
                            <option value="__custom__">+ Add program not in list...</option>
                        </select>
                    </div>
                    
                    <div id="otmRecCustomForm" style="display: none;">
                        <div class="otm-form-row">
                            <div class="otm-form-group otm-form-group--flex">
                                <input type="text" class="otm-input" id="otmRecCustomName" placeholder="Program name">
                            </div>
                            <div class="otm-form-group">
                                <select class="otm-select" id="otmRecCustomType">
                                    <option value="">-- Type --</option>
                                    ${PROGRAM_TYPES.map(t => `<option value="${t.id}">${t.label}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                    </div>
                    
                    <div class="otm-form-group">
                        <label class="otm-label">Clinical Rationale (required) *</label>
                        <textarea class="otm-textarea" id="otmRationale" rows="3" 
                            placeholder="Based on ASAM assessment, client would benefit from...">${this.outcomeData.clinicianRecommendedPlan.clinicalRationale || ''}</textarea>
                    </div>
                    
                    <div class="otm-form-group">
                        <label class="otm-label">What is the family doing instead?</label>
                        <div class="otm-options otm-options--compact">
                            <label class="otm-option otm-option--sm">
                                <input type="radio" name="familyAction" value="home-no-supports">
                                <span>Taking client home with no supports</span>
                            </label>
                            <label class="otm-option otm-option--sm">
                                <input type="radio" name="familyAction" value="home-minimal">
                                <span>Taking client home with minimal supports</span>
                            </label>
                            <label class="otm-option otm-option--sm">
                                <input type="radio" name="familyAction" value="different-program">
                                <span>Going to a different program (family's choice)</span>
                            </label>
                        </div>
                    </div>
                </div>
            `;
        }

        renderStep2AMA() {
            return `
                <div class="otm-step">
                    <h3 class="otm-step__title">AMA / No Plan Discharge</h3>
                    <div class="otm-alert otm-alert--danger">
                        <span class="otm-alert__icon">❌</span>
                        <span>Client left against medical advice or family declined all recommendations.</span>
                    </div>
                    
                    <div class="otm-form-group">
                        <label class="otm-label">Notes (optional)</label>
                        <textarea class="otm-textarea" id="otmAMANotes" rows="4" 
                            placeholder="Document any relevant details about this discharge...">${this.outcomeData.primaryPlacement.notes || ''}</textarea>
                    </div>
                    
                    <p class="otm-help-text">
                        This outcome will be recorded for compliance tracking. No further details are required.
                    </p>
                </div>
            `;
        }

        // ========================================================================
        // HELPERS
        // ========================================================================

        buildProgramOptions() {
            let options = '';
            
            // Add programs from document (if any)
            if (this.selectedPrograms && Object.keys(this.selectedPrograms).length > 0) {
                options += '<optgroup label="From Aftercare Document">';
                
                // Flatten phases into single list
                const allPrograms = [];
                ['stabilize', 'bridge', 'sustain'].forEach(phase => {
                    if (this.selectedPrograms[phase]) {
                        this.selectedPrograms[phase].forEach(p => {
                            if (!allPrograms.find(ap => ap.id === p.id)) {
                                allPrograms.push(p);
                            }
                        });
                    }
                });
                
                allPrograms.forEach(p => {
                    const name = p.name || p.programName || 'Unknown Program';
                    const loc = p.location || p.state || '';
                    options += `<option value="${p.id}">${name}${loc ? ` (${loc})` : ''}</option>`;
                });
                
                options += '</optgroup>';
            }
            
            return options;
        }

        resetOutcomeData() {
            this.outcomeData = {
                outcomeType: null,
                familyFollowedRecommendation: null,
                primaryPlacement: {
                    programId: null,
                    programName: '',
                    programType: '',
                    location: '',
                    isCustomEntry: false,
                    contactInfo: '',
                    startDate: null,
                    notes: ''
                },
                atHomeResources: [],
                clinicianRecommendedPlan: {
                    recommendedProgramId: null,
                    recommendedProgramName: '',
                    recommendedProgramType: '',
                    alternativeResources: [],
                    clinicalRationale: ''
                }
            };
        }

        // ========================================================================
        // EVENT HANDLERS
        // ========================================================================

        bindStepEvents(step) {
            if (step === 1) {
                // Bind radio button changes
                const radios = this.modalElement.querySelectorAll('input[name="outcomeType"]');
                radios.forEach(radio => {
                    radio.addEventListener('change', (e) => {
                        this.outcomeData.outcomeType = e.target.value;
                        this.outcomeData.familyFollowedRecommendation = 
                            [OUTCOME_TYPES.PROGRAM, OUTCOME_TYPES.HOME_WITH_SUPPORTS].includes(e.target.value);
                        
                        // Update visual selection
                        this.modalElement.querySelectorAll('.otm-option').forEach(opt => {
                            opt.classList.remove('otm-option--selected');
                        });
                        e.target.closest('.otm-option').classList.add('otm-option--selected');
                    });
                });
            }
        }

        handleProgramSelect(select) {
            const customForm = document.getElementById('otmCustomProgramForm');
            if (select.value === '__custom__') {
                this.outcomeData.primaryPlacement.isCustomEntry = true;
                this.outcomeData.primaryPlacement.programId = null;
                if (customForm) customForm.style.display = 'block';
            } else if (select.value) {
                this.outcomeData.primaryPlacement.isCustomEntry = false;
                this.outcomeData.primaryPlacement.programId = select.value;
                this.outcomeData.primaryPlacement.programName = select.options[select.selectedIndex].text;
                if (customForm) customForm.style.display = 'none';
            } else {
                if (customForm) customForm.style.display = 'none';
            }
        }

        handleRecProgramSelect(select) {
            const customForm = document.getElementById('otmRecCustomForm');
            if (select.value === '__custom__') {
                if (customForm) customForm.style.display = 'block';
            } else {
                if (customForm) customForm.style.display = 'none';
                this.outcomeData.clinicianRecommendedPlan.recommendedProgramId = select.value;
                this.outcomeData.clinicianRecommendedPlan.recommendedProgramName = 
                    select.options[select.selectedIndex].text;
            }
        }

        addResource(type) {
            const newResource = {
                id: 'resource_' + Date.now(),
                type: type,
                providerName: '',
                frequency: 'weekly',
                notes: ''
            };
            this.outcomeData.atHomeResources.push(newResource);
            this.renderStep(2); // Re-render to show new resource
        }

        removeResource(index) {
            this.outcomeData.atHomeResources.splice(index, 1);
            this.renderStep(2);
        }

        updateResource(index, field, value) {
            if (this.outcomeData.atHomeResources[index]) {
                this.outcomeData.atHomeResources[index][field] = value;
            }
        }

        goBack() {
            if (this.currentStep > 1) {
                this.renderStep(this.currentStep - 1);
            }
        }

        goNext() {
            if (this.currentStep === 1) {
                // Validate step 1
                if (!this.outcomeData.outcomeType) {
                    alert('Please select an outcome type.');
                    return;
                }
                this.renderStep(2);
            } else if (this.currentStep === 2) {
                // Validate and save
                if (this.validateStep2()) {
                    this.collectStep2Data();
                    this.saveOutcome();
                }
            }
        }

        validateStep2() {
            switch (this.outcomeData.outcomeType) {
                case OUTCOME_TYPES.PROGRAM:
                    const programSelect = document.getElementById('otmProgramSelect');
                    if (!programSelect?.value) {
                        alert('Please select a program.');
                        return false;
                    }
                    if (programSelect.value === '__custom__') {
                        const name = document.getElementById('otmCustomProgramName')?.value;
                        const type = document.getElementById('otmCustomProgramType')?.value;
                        if (!name || !type) {
                            alert('Please enter the program name and type.');
                            return false;
                        }
                    }
                    return true;
                    
                case OUTCOME_TYPES.HOME_WITH_SUPPORTS:
                    if (this.outcomeData.atHomeResources.length === 0) {
                        alert('Please add at least one at-home resource.');
                        return false;
                    }
                    return true;
                    
                case OUTCOME_TYPES.CLINICIAN_RECOMMENDED:
                    const rationale = document.getElementById('otmRationale')?.value;
                    if (!rationale?.trim()) {
                        alert('Please provide the clinical rationale.');
                        return false;
                    }
                    return true;
                    
                case OUTCOME_TYPES.AMA:
                    return true;
                    
                default:
                    return false;
            }
        }

        collectStep2Data() {
            switch (this.outcomeData.outcomeType) {
                case OUTCOME_TYPES.PROGRAM:
                    const programSelect = document.getElementById('otmProgramSelect');
                    if (programSelect?.value === '__custom__') {
                        this.outcomeData.primaryPlacement.programName = 
                            document.getElementById('otmCustomProgramName')?.value || '';
                        this.outcomeData.primaryPlacement.programType = 
                            document.getElementById('otmCustomProgramType')?.value || '';
                        const city = document.getElementById('otmCustomCity')?.value || '';
                        const state = document.getElementById('otmCustomState')?.value || '';
                        this.outcomeData.primaryPlacement.location = city && state ? `${city}, ${state}` : city || state;
                        this.outcomeData.primaryPlacement.contactInfo = 
                            document.getElementById('otmCustomContact')?.value || '';
                        this.outcomeData.primaryPlacement.isCustomEntry = true;
                    }
                    this.outcomeData.primaryPlacement.startDate = 
                        document.getElementById('otmStartDate')?.value || null;
                    this.outcomeData.primaryPlacement.notes = 
                        document.getElementById('otmNotes')?.value || '';
                    break;
                    
                case OUTCOME_TYPES.CLINICIAN_RECOMMENDED:
                    this.outcomeData.clinicianRecommendedPlan.clinicalRationale = 
                        document.getElementById('otmRationale')?.value || '';
                    
                    const recProgram = document.getElementById('otmRecProgram');
                    if (recProgram?.value === '__custom__') {
                        this.outcomeData.clinicianRecommendedPlan.recommendedProgramName = 
                            document.getElementById('otmRecCustomName')?.value || '';
                        this.outcomeData.clinicianRecommendedPlan.recommendedProgramType = 
                            document.getElementById('otmRecCustomType')?.value || '';
                    }
                    break;
                    
                case OUTCOME_TYPES.AMA:
                    this.outcomeData.primaryPlacement.notes = 
                        document.getElementById('otmAMANotes')?.value || '';
                    break;
            }
        }

        async saveOutcome() {
            try {
                // Get current user
                const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
                
                // Build the discharge outcome object
                const dischargeOutcome = {
                    ...this.outcomeData,
                    recordedBy: currentUser.initials || currentUser.username || 'Unknown',
                    recordedAt: new Date().toISOString(),
                    lastModified: new Date().toISOString(),
                    isFinalized: false
                };
                
                // Update client
                if (window.clientManager && this.clientId) {
                    await window.clientManager.updateClient(this.clientId, {
                        dischargeOutcome: dischargeOutcome
                    });
                    console.log('✅ Discharge outcome saved for client:', this.clientId);
                }
                
                // Log analytics event
                if (window.analyticsHooks) {
                    window.analyticsHooks.logEvent('discharge_outcome_recorded', {
                        clientId: this.clientId,
                        outcomeType: this.outcomeData.outcomeType,
                        familyFollowed: this.outcomeData.familyFollowedRecommendation
                    });
                }
                
                // Call completion callback
                if (typeof this.onComplete === 'function') {
                    this.onComplete(dischargeOutcome);
                }
                
                // Close modal
                this.close();
                
                // Show success message
                if (window.showNotification) {
                    window.showNotification('Discharge outcome recorded successfully', 'success');
                }
                
            } catch (error) {
                console.error('Failed to save discharge outcome:', error);
                alert('Failed to save outcome: ' + error.message);
            }
        }

        handleCancel() {
            if (typeof this.onCancel === 'function') {
                this.onCancel();
            }
            this.close();
        }

        // ========================================================================
        // STYLES
        // ========================================================================

        injectStyles() {
            if (document.getElementById('otm-styles')) return;
            
            const style = document.createElement('style');
            style.id = 'otm-styles';
            style.textContent = `
                /* Outcome Tracking Modal Styles */
                .otm-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                    padding: 1rem;
                }
                
                .otm-modal {
                    background: #1e293b;
                    border-radius: 16px;
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    width: 100%;
                    max-width: 600px;
                    max-height: 90vh;
                    display: flex;
                    flex-direction: column;
                    border: 1px solid #334155;
                }
                
                .otm-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #334155;
                }
                
                .otm-header__title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    font-size: 1.1rem;
                    color: #f1f5f9;
                }
                
                .otm-header__icon {
                    font-size: 1.5rem;
                }
                
                .otm-close-btn {
                    background: none;
                    border: none;
                    color: #94a3b8;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.25rem;
                    line-height: 1;
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                
                .otm-close-btn:hover {
                    color: #f1f5f9;
                    background: #334155;
                }
                
                .otm-progress {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 1rem 1.5rem;
                    gap: 0.5rem;
                    background: #0f172a;
                }
                
                .otm-progress__step {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: #64748b;
                }
                
                .otm-progress__step--active {
                    color: #6366f1;
                }
                
                .otm-progress__step--completed {
                    color: #22c55e;
                }
                
                .otm-progress__number {
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: #334155;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                    font-weight: 600;
                }
                
                .otm-progress__step--active .otm-progress__number {
                    background: #6366f1;
                    color: white;
                }
                
                .otm-progress__step--completed .otm-progress__number {
                    background: #22c55e;
                    color: white;
                }
                
                .otm-progress__step--completed .otm-progress__number::after {
                    content: '✓';
                }
                
                .otm-progress__label {
                    font-size: 0.85rem;
                    font-weight: 500;
                }
                
                .otm-progress__line {
                    width: 60px;
                    height: 2px;
                    background: #334155;
                }
                
                .otm-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                }
                
                .otm-step__title {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: #f1f5f9;
                    margin: 0 0 0.5rem 0;
                }
                
                .otm-step__subtitle {
                    font-size: 0.9rem;
                    color: #94a3b8;
                    margin: 0 0 1.5rem 0;
                }
                
                .otm-options {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                }
                
                .otm-options--compact {
                    gap: 0.5rem;
                }
                
                .otm-option {
                    display: block;
                    cursor: pointer;
                    background: #0f172a;
                    border: 2px solid #334155;
                    border-radius: 10px;
                    padding: 1rem;
                    transition: all 0.2s;
                }
                
                .otm-option:hover {
                    border-color: #6366f1;
                    background: rgba(99, 102, 241, 0.05);
                }
                
                .otm-option--selected {
                    border-color: #6366f1;
                    background: rgba(99, 102, 241, 0.1);
                }
                
                .otm-option input[type="radio"] {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }
                
                .otm-option__content {
                    display: flex;
                    align-items: flex-start;
                    gap: 1rem;
                }
                
                .otm-option__icon {
                    font-size: 1.5rem;
                    line-height: 1;
                }
                
                .otm-option__title {
                    font-weight: 600;
                    color: #f1f5f9;
                    margin-bottom: 0.25rem;
                }
                
                .otm-option__desc {
                    font-size: 0.85rem;
                    color: #94a3b8;
                }
                
                .otm-option--sm {
                    padding: 0.75rem 1rem;
                }
                
                .otm-option--sm .otm-option__content {
                    gap: 0.5rem;
                }
                
                .otm-form-group {
                    margin-bottom: 1rem;
                }
                
                .otm-form-group--flex {
                    flex: 1;
                }
                
                .otm-form-row {
                    display: flex;
                    gap: 1rem;
                }
                
                .otm-label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: #cbd5e1;
                    margin-bottom: 0.5rem;
                }
                
                .otm-input, .otm-select, .otm-textarea {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    color: #f1f5f9;
                    font-size: 0.9rem;
                    transition: all 0.2s;
                }
                
                .otm-input:focus, .otm-select:focus, .otm-textarea:focus {
                    outline: none;
                    border-color: #6366f1;
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                }
                
                .otm-input--sm, .otm-select--sm {
                    padding: 0.5rem 0.75rem;
                    font-size: 0.85rem;
                }
                
                .otm-textarea {
                    resize: vertical;
                    min-height: 80px;
                }
                
                .otm-alert {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 1.5rem;
                    font-size: 0.9rem;
                }
                
                .otm-alert--warning {
                    background: rgba(245, 158, 11, 0.15);
                    border: 1px solid rgba(245, 158, 11, 0.3);
                    color: #fbbf24;
                }
                
                .otm-alert--danger {
                    background: rgba(239, 68, 68, 0.15);
                    border: 1px solid rgba(239, 68, 68, 0.3);
                    color: #f87171;
                }
                
                .otm-resources-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.75rem;
                    margin-bottom: 1rem;
                    min-height: 100px;
                }
                
                .otm-resource-item {
                    background: #0f172a;
                    border: 1px solid #334155;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .otm-resource-item__header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    background: #1e293b;
                    border-bottom: 1px solid #334155;
                }
                
                .otm-resource-item__icon {
                    font-size: 1rem;
                }
                
                .otm-resource-item__type {
                    flex: 1;
                    font-size: 0.8rem;
                    font-weight: 500;
                    color: #94a3b8;
                }
                
                .otm-resource-item__remove {
                    background: none;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    font-size: 1.25rem;
                    line-height: 1;
                    padding: 0.25rem;
                }
                
                .otm-resource-item__remove:hover {
                    color: #ef4444;
                }
                
                .otm-resource-item__body {
                    padding: 0.75rem;
                }
                
                .otm-add-buttons {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                
                .otm-add-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.5rem 0.75rem;
                    background: #334155;
                    border: 1px solid #475569;
                    border-radius: 6px;
                    color: #cbd5e1;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .otm-add-btn:hover {
                    background: #475569;
                    color: #f1f5f9;
                }
                
                .otm-empty {
                    text-align: center;
                    padding: 2rem;
                    color: #64748b;
                    font-size: 0.9rem;
                }
                
                .otm-help-text {
                    font-size: 0.85rem;
                    color: #64748b;
                    margin-top: 1rem;
                }
                
                .otm-footer {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 1rem 1.5rem;
                    border-top: 1px solid #334155;
                    background: #0f172a;
                    border-radius: 0 0 16px 16px;
                }
                
                .otm-footer__spacer {
                    flex: 1;
                }
                
                .otm-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.75rem 1.25rem;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                
                .otm-btn--primary {
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                    color: white;
                    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
                }
                
                .otm-btn--primary:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
                }
                
                .otm-btn--secondary {
                    background: #334155;
                    color: #e2e8f0;
                    border: 1px solid #475569;
                }
                
                .otm-btn--secondary:hover {
                    background: #475569;
                }
                
                .otm-btn--ghost {
                    background: transparent;
                    color: #94a3b8;
                }
                
                .otm-btn--ghost:hover {
                    color: #f1f5f9;
                    background: rgba(255, 255, 255, 0.05);
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ============================================================================
    // EXPORT
    // ============================================================================

    // Create global instance
    window.outcomeTrackingModal = new OutcomeTrackingModal();
    window.OutcomeTrackingModal = OutcomeTrackingModal;

    console.log('✅ Outcome Tracking Modal loaded');

})();

