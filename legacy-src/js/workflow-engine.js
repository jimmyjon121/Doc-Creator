// workflow-engine.js - Guided Workflow Engine for CareConnect Pro

class WorkflowEngine {
    constructor() {
        this.steps = [
            {
                id: 'profile',
                name: 'Client Profile',
                description: 'Build client profile',
                icon: '👤',
                completed: false,
                active: true,
                data: {}
            },
            {
                id: 'explore',
                name: 'Explore Programs',
                description: 'Find the right fit',
                icon: '🔍',
                completed: false,
                active: false,
                data: {}
            },
            {
                id: 'compare',
                name: 'Compare Options',
                description: 'Side-by-side analysis',
                icon: '⚖️',
                completed: false,
                active: false,
                data: {}
            },
            {
                id: 'document',
                name: 'Create Documents',
                description: 'Professional plans',
                icon: '📝',
                completed: false,
                active: false,
                data: {}
            },
            {
                id: 'package',
                name: 'Package & Share',
                description: 'Complete discharge packet',
                icon: '📦',
                completed: false,
                active: false,
                data: {}
            }
        ];
        
        this.currentStep = 0;
        this.clientProfile = {};
        this.selectedPrograms = [];
        this.comparisonResults = null;
        this.documents = [];
        this.packet = null;
        
        this.smartPrompts = new SmartPrompts();
        this.progressTracker = new ProgressTracker();
    }
    
    // Step 1: Client Profile Builder
    startClientProfile() {
        this.setActiveStep('profile');
        
        return {
            title: 'Let\'s Build Your Client\'s Profile',
            subtitle: 'This helps us find the perfect program match',
            form: {
                sections: [
                    {
                        title: 'Basic Information',
                        fields: [
                            {
                                id: 'age',
                                label: 'Age',
                                type: 'number',
                                required: true,
                                min: 12,
                                max: 25,
                                onChange: (value) => this.smartPrompts.ageChanged(value)
                            },
                            {
                                id: 'gender',
                                label: 'Gender',
                                type: 'select',
                                options: ['Male', 'Female', 'Non-binary', 'Prefer not to say'],
                                required: true
                            },
                            {
                                id: 'location',
                                label: 'Preferred Location',
                                type: 'text',
                                placeholder: 'City, State or "Anywhere"',
                                helper: 'How far are they willing to travel?'
                            }
                        ]
                    },
                    {
                        title: 'Clinical Needs',
                        fields: [
                            {
                                id: 'primaryIssue',
                                label: 'Primary Concern',
                                type: 'select',
                                options: [
                                    'Substance Use',
                                    'Mental Health',
                                    'Dual Diagnosis',
                                    'Behavioral Issues',
                                    'Trauma',
                                    'Eating Disorder'
                                ],
                                required: true,
                                onChange: (value) => this.smartPrompts.primaryIssueSelected(value)
                            },
                            {
                                id: 'secondaryIssues',
                                label: 'Secondary Concerns',
                                type: 'multiselect',
                                options: [
                                    'Anxiety',
                                    'Depression',
                                    'ADHD',
                                    'Self-Harm',
                                    'Family Conflict',
                                    'School Refusal',
                                    'Gaming Addiction'
                                ]
                            },
                            {
                                id: 'previousTreatment',
                                label: 'Previous Treatment?',
                                type: 'radio',
                                options: ['None', 'Outpatient', 'IOP/PHP', 'Residential'],
                                onChange: (value) => this.smartPrompts.previousTreatmentSelected(value)
                            }
                        ]
                    },
                    {
                        title: 'Insurance & Budget',
                        fields: [
                            {
                                id: 'insurance',
                                label: 'Insurance Provider',
                                type: 'select',
                                options: [
                                    'BCBS',
                                    'Aetna',
                                    'Cigna',
                                    'United',
                                    'Medicaid',
                                    'Medicare',
                                    'Private Pay',
                                    'Other'
                                ],
                                required: true,
                                onChange: (value) => this.smartPrompts.insuranceSelected(value)
                            },
                            {
                                id: 'budget',
                                label: 'Budget Flexibility',
                                type: 'select',
                                options: [
                                    'Insurance Only',
                                    'Some Out-of-Pocket OK',
                                    'Flexible Budget',
                                    'Cost Not a Factor'
                                ]
                            }
                        ]
                    },
                    {
                        title: 'Special Considerations',
                        fields: [
                            {
                                id: 'specialNeeds',
                                label: 'Any Special Needs?',
                                type: 'checkboxes',
                                options: [
                                    'LGBTQ+ Affirming',
                                    'Faith-Based Preferred',
                                    'Secular Only',
                                    'Spanish Speaking',
                                    'Medical Issues',
                                    'Legal Involvement',
                                    'Adoption/Foster Care'
                                ]
                            },
                            {
                                id: 'urgency',
                                label: 'How Urgent?',
                                type: 'select',
                                options: [
                                    'ASAP - Crisis',
                                    'Within 1 Week',
                                    'Within 2 Weeks',
                                    'Within Month',
                                    'Planning Ahead'
                                ],
                                onChange: (value) => this.smartPrompts.urgencySelected(value)
                            }
                        ]
                    }
                ]
            },
            smartSuggestions: []
        };
    }
    
    saveClientProfile(data) {
        this.clientProfile = data;
        this.steps[0].completed = true;
        this.steps[0].data = data;
        
        // Generate smart recommendations
        const recommendations = this.generateRecommendations(data);
        
        this.progressTracker.profileCompleted();
        
        return {
            success: true,
            message: 'Great! Profile saved. Let\'s find some programs!',
            recommendations,
            nextStep: 'explore'
        };
    }
    
    // Step 2: Smart Program Discovery
    startProgramExploration() {
        this.setActiveStep('explore');
        
        const filters = this.generateSmartFilters();
        const suggestions = this.generateProgramSuggestions();
        
        return {
            title: 'Explore Treatment Programs',
            subtitle: `Based on ${this.clientProfile.age} year old with ${this.clientProfile.primaryIssue}`,
            filters,
            suggestions,
            tips: [
                'Programs highlighted in green are best matches',
                'Click the star to save favorites',
                'Hover over badges for explanations'
            ]
        };
    }
    
    generateSmartFilters() {
        const filters = {
            mustHave: [],
            niceToHave: [],
            avoid: []
        };
        
        // Smart filter generation based on profile
        if (this.clientProfile.primaryIssue === 'Substance Use') {
            filters.mustHave.push('Substance Use Treatment');
            if (this.clientProfile.age < 18) {
                filters.mustHave.push('Adolescent Program');
            }
        }
        
        if (this.clientProfile.specialNeeds?.includes('LGBTQ+ Affirming')) {
            filters.mustHave.push('LGBTQ+ Affirming');
        }
        
        if (this.clientProfile.insurance === 'Medicaid') {
            filters.mustHave.push('Accepts Medicaid');
        }
        
        if (this.clientProfile.urgency === 'ASAP - Crisis') {
            filters.niceToHave.push('Immediate Availability');
        }
        
        return filters;
    }
    
    generateProgramSuggestions() {
        return [
            {
                reason: 'Similar successful placements',
                programs: this.findSimilarSuccessfulPrograms()
            },
            {
                reason: 'Specializes in primary concern',
                programs: this.findSpecializedPrograms()
            },
            {
                reason: 'Insurance pre-approved',
                programs: this.findInsuranceApprovedPrograms()
            }
        ];
    }
    
    selectProgram(programId) {
        const program = this.getProgramById(programId);
        
        if (!this.selectedPrograms.find(p => p.id === programId)) {
            this.selectedPrograms.push(program);
            
            const feedback = this.smartPrompts.programSelected(program, this.selectedPrograms.length);
            
            return {
                success: true,
                message: feedback.message,
                tip: feedback.tip,
                selectedCount: this.selectedPrograms.length,
                readyToCompare: this.selectedPrograms.length >= 2
            };
        }
        
        return {
            success: false,
            message: 'Program already selected'
        };
    }
    
    // Step 3: Interactive Comparison
    startComparison() {
        if (this.selectedPrograms.length < 2) {
            return {
                error: true,
                message: 'Please select at least 2 programs to compare'
            };
        }
        
        this.setActiveStep('compare');
        
        const matrix = this.buildComparisonMatrix();
        const insights = this.generateComparisonInsights();
        
        return {
            title: 'Compare Your Top Programs',
            subtitle: 'Let\'s find the best fit for your client',
            programs: this.selectedPrograms,
            matrix,
            insights,
            decisionTools: {
                prosConsList: this.generateProsConsList(),
                questionsToAsk: this.generateQuestionsToAsk(),
                familyPresentation: this.prepareFamilyPresentation()
            }
        };
    }
    
    buildComparisonMatrix() {
        const criteria = [
            'Level of Care',
            'Specializations',
            'Age Range',
            'Gender',
            'Insurance',
            'Location',
            'Length of Stay',
            'Family Program',
            'Accreditations',
            'Success Rate'
        ];
        
        const matrix = {};
        
        criteria.forEach(criterion => {
            matrix[criterion] = {};
            this.selectedPrograms.forEach(program => {
                const value = this.getProgramValue(program, criterion);
                const rating = this.rateProgramCriterion(program, criterion, this.clientProfile);
                
                matrix[criterion][program.id] = {
                    value,
                    rating, // 'excellent', 'good', 'neutral', 'concern'
                    explanation: this.explainRating(criterion, rating)
                };
            });
        });
        
        return matrix;
    }
    
    generateComparisonInsights() {
        const insights = [];
        
        // Best overall match
        const bestMatch = this.findBestMatch();
        insights.push({
            type: 'best-match',
            program: bestMatch.program,
            reason: bestMatch.reason,
            confidence: bestMatch.confidence
        });
        
        // Key differences
        const differences = this.findKeyDifferences();
        insights.push({
            type: 'differences',
            title: 'Key Differences to Consider',
            points: differences
        });
        
        // Questions for family
        insights.push({
            type: 'questions',
            title: 'Discuss with Family',
            questions: [
                'Which location works best for visits?',
                'Is the length of stay manageable?',
                'Do the specializations match your priorities?'
            ]
        });
        
        return insights;
    }
    
    // Step 4: Document Creation Studio
    startDocumentCreation() {
        this.setActiveStep('document');
        
        const templates = this.getDocumentTemplates();
        const wizard = this.createDocumentWizard();
        
        return {
            title: 'Create Professional Documents',
            subtitle: 'Let\'s document your recommendations',
            templates,
            wizard,
            smartContent: {
                suggestions: this.generateContentSuggestions(),
                insurancePhrasing: this.getInsurancePhrasing(),
                examples: this.getDocumentExamples()
            }
        };
    }
    
    createDocumentWizard() {
        return {
            steps: [
                {
                    title: 'Choose Document Type',
                    options: [
                        {
                            id: 'aftercare-options',
                            name: 'Aftercare Options',
                            description: 'Present multiple program options',
                            time: '10 minutes',
                            icon: '📋'
                        },
                        {
                            id: 'aftercare-plan',
                            name: 'Aftercare Plan',
                            description: 'Detailed plan with selected program',
                            time: '15 minutes',
                            icon: '📝'
                        },
                        {
                            id: 'discharge-packet',
                            name: 'Discharge Packet',
                            description: 'Complete packet with all materials',
                            time: '5 minutes',
                            icon: '📦'
                        }
                    ]
                },
                {
                    title: 'Customize Content',
                    fields: [
                        {
                            id: 'tone',
                            label: 'Document Tone',
                            options: ['Clinical', 'Family-Friendly', 'Insurance-Focused']
                        },
                        {
                            id: 'sections',
                            label: 'Include Sections',
                            options: [
                                'Executive Summary',
                                'Clinical Rationale',
                                'Program Details',
                                'Financial Information',
                                'Next Steps'
                            ]
                        }
                    ]
                },
                {
                    title: 'Review & Edit',
                    preview: true,
                    editableFields: true,
                    suggestions: true
                }
            ]
        };
    }
    
    generateDocument(type, options) {
        const document = {
            id: `doc-${Date.now()}`,
            type,
            createdAt: new Date().toISOString(),
            clientProfile: this.clientProfile,
            programs: this.selectedPrograms,
            content: ''
        };
        
        // Generate content based on type
        switch(type) {
            case 'aftercare-options':
                document.content = this.generateAftercareOptions(options);
                break;
            case 'aftercare-plan':
                document.content = this.generateAftercarePlan(options);
                break;
            case 'discharge-packet':
                document.content = this.generateDischargePacket(options);
                break;
        }
        
        this.documents.push(document);
        this.steps[3].completed = true;
        
        return {
            success: true,
            document,
            message: 'Document created successfully!',
            preview: document.content.substring(0, 500) + '...'
        };
    }
    
    // Step 5: Package & Share Center
    startPackaging() {
        this.setActiveStep('package');
        
        return {
            title: 'Package Your Discharge Materials',
            subtitle: 'Everything the family needs in one place',
            components: {
                required: [
                    {
                        id: 'aftercare-plan',
                        name: 'Aftercare Plan',
                        status: this.documents.find(d => d.type === 'aftercare-plan') ? 'ready' : 'missing'
                    },
                    {
                        id: 'program-info',
                        name: 'Program Information',
                        status: 'ready'
                    }
                ],
                optional: [
                    {
                        id: 'insurance-auth',
                        name: 'Insurance Authorization',
                        status: 'optional'
                    },
                    {
                        id: 'family-education',
                        name: 'Family Education Materials',
                        status: 'optional'
                    },
                    {
                        id: 'consent-forms',
                        name: 'Consent Forms',
                        status: 'optional'
                    }
                ]
            },
            exportOptions: [
                {
                    format: 'pdf',
                    name: 'PDF Package',
                    description: 'Print-ready format',
                    icon: '📄'
                },
                {
                    format: 'email',
                    name: 'Email Package',
                    description: 'Send directly to family',
                    icon: '📧'
                },
                {
                    format: 'portal',
                    name: 'Family Portal',
                    description: 'Secure online access',
                    icon: '🔒'
                }
            ]
        };
    }
    
    createPacket(components, format) {
        this.packet = {
            id: `packet-${Date.now()}`,
            createdAt: new Date().toISOString(),
            components,
            format,
            clientProfile: this.clientProfile
        };
        
        this.steps[4].completed = true;
        
        // Celebrate completion!
        const celebration = {
            title: '🎉 Discharge Packet Complete!',
            message: 'You\'ve created a comprehensive aftercare plan!',
            stats: {
                programsReviewed: this.selectedPrograms.length,
                documentsCreated: this.documents.length,
                timeSpent: this.progressTracker.getTotalTime()
            },
            encouragement: this.getCompletionMessage()
        };
        
        return {
            success: true,
            packet: this.packet,
            celebration,
            nextActions: [
                'Share with family',
                'Schedule follow-up',
                'Start new case'
            ]
        };
    }
    
    // Helper Functions
    setActiveStep(stepId) {
        this.steps.forEach(step => {
            step.active = step.id === stepId;
        });
        
        this.currentStep = this.steps.findIndex(s => s.id === stepId);
    }
    
    getProgramById(id) {
        // Get from programs database
        return window.programsData?.find(p => p.id === id);
    }
    
    getProgramValue(program, criterion) {
        const mapping = {
            'Level of Care': program.clinical?.levelsOfCare?.join(', '),
            'Specializations': program.clinical?.specializations?.join(', '),
            'Age Range': program.population?.ages,
            'Gender': program.population?.gender,
            'Insurance': program.admissions?.insurance?.join(', '),
            'Location': `${program.location?.city}, ${program.location?.state}`,
            'Length of Stay': program.structure?.lengthOfStay,
            'Family Program': program.family?.involvement ? 'Yes' : 'Limited',
            'Accreditations': program.quality?.accreditations?.join(', '),
            'Success Rate': program.quality?.successRate || 'Not reported'
        };
        
        return mapping[criterion] || 'Not specified';
    }
    
    rateProgramCriterion(program, criterion, profile) {
        // Smart rating logic based on client profile match
        // Returns: 'excellent', 'good', 'neutral', 'concern'
        
        // Simplified example
        if (criterion === 'Age Range') {
            const programAges = program.population?.ages;
            const clientAge = profile.age;
            
            if (programAges?.includes(clientAge.toString())) {
                return 'excellent';
            }
        }
        
        return 'neutral';
    }
    
    explainRating(criterion, rating) {
        const explanations = {
            excellent: `Perfect match for ${criterion}`,
            good: `Good fit for ${criterion}`,
            neutral: `Acceptable for ${criterion}`,
            concern: `May need to discuss ${criterion}`
        };
        
        return explanations[rating];
    }
    
    findBestMatch() {
        // Algorithm to find best program match
        let bestMatch = null;
        let highestScore = 0;
        
        this.selectedPrograms.forEach(program => {
            const score = this.calculateMatchScore(program, this.clientProfile);
            if (score > highestScore) {
                highestScore = score;
                bestMatch = program;
            }
        });
        
        return {
            program: bestMatch,
            reason: 'Best overall match for clinical needs and preferences',
            confidence: highestScore
        };
    }
    
    calculateMatchScore(program, profile) {
        let score = 0;
        
        // Scoring logic based on profile match
        // Simplified example
        if (program.clinical?.primaryFocus === profile.primaryIssue) {
            score += 30;
        }
        
        if (program.population?.ages?.includes(profile.age.toString())) {
            score += 20;
        }
        
        if (program.admissions?.insurance?.includes(profile.insurance)) {
            score += 25;
        }
        
        return score;
    }
    
    findKeyDifferences() {
        const differences = [];
        
        // Compare programs to find notable differences
        if (this.selectedPrograms.length >= 2) {
            const program1 = this.selectedPrograms[0];
            const program2 = this.selectedPrograms[1];
            
            if (program1.clinical?.levelsOfCare[0] !== program2.clinical?.levelsOfCare[0]) {
                differences.push('Different levels of care offered');
            }
            
            if (program1.location?.state !== program2.location?.state) {
                differences.push('Different geographic locations');
            }
        }
        
        return differences;
    }
    
    findSimilarSuccessfulPrograms() {
        // Find programs similar to past successful placements
        return [];
    }
    
    findSpecializedPrograms() {
        // Find programs specializing in client's primary issue
        return window.programsData?.filter(p => 
            p.clinical?.primaryFocus === this.clientProfile.primaryIssue
        ).slice(0, 3) || [];
    }
    
    findInsuranceApprovedPrograms() {
        // Find programs accepting client's insurance
        return window.programsData?.filter(p => 
            p.admissions?.insurance?.includes(this.clientProfile.insurance)
        ).slice(0, 3) || [];
    }
    
    generateProsConsList() {
        const prosCons = {};
        
        this.selectedPrograms.forEach(program => {
            prosCons[program.id] = {
                pros: [],
                cons: []
            };
            
            // Generate pros
            if (program.clinical?.primaryFocus === this.clientProfile.primaryIssue) {
                prosCons[program.id].pros.push('Specializes in primary concern');
            }
            
            // Generate cons
            if (!program.admissions?.insurance?.includes(this.clientProfile.insurance)) {
                prosCons[program.id].cons.push('May need to verify insurance');
            }
        });
        
        return prosCons;
    }
    
    generateQuestionsToAsk() {
        return [
            'What is your current availability?',
            'Can you describe a typical day?',
            'How do you involve families?',
            'What happens after discharge?',
            'Can you work with our insurance?'
        ];
    }
    
    prepareFamilyPresentation() {
        return {
            format: 'simple-comparison',
            includePhotos: true,
            highlightDifferences: true,
            focusOnPositives: true
        };
    }
    
    generateContentSuggestions() {
        return [
            'Mention the trauma-informed approach',
            'Highlight the family program',
            'Include success rates if available',
            'Note the accreditations'
        ];
    }
    
    getInsurancePhrasing() {
        return {
            recommended: [
                'Medical necessity established based on...',
                'Meets criteria for level of care...',
                'Clinical indicators support...'
            ],
            avoid: [
                'Family preference',
                'Might help',
                'Could benefit'
            ]
        };
    }
    
    getDocumentExamples() {
        return [
            {
                type: 'opening',
                text: 'Following comprehensive assessment on [DATE], the following aftercare recommendations are presented...'
            },
            {
                type: 'clinical-rationale',
                text: 'Based on presenting symptoms of [SYMPTOMS] and diagnosis of [DIAGNOSIS], residential treatment is clinically indicated...'
            }
        ];
    }
    
    generateAftercareOptions(options) {
        // Generate aftercare options document content
        return `Aftercare Options for ${this.clientProfile.age} year old...`;
    }
    
    generateAftercarePlan(options) {
        // Generate aftercare plan document content
        return `Comprehensive Aftercare Plan...`;
    }
    
    generateDischargePacket(options) {
        // Generate discharge packet content
        return `Discharge Packet Contents...`;
    }
    
    getCompletionMessage() {
        const messages = [
            'Outstanding work! This family is in great hands.',
            'You\'ve created a thorough, professional plan!',
            'Another family helped! You\'re making a difference.',
            'Excellent job! Your attention to detail shows.'
        ];
        
        return messages[Math.floor(Math.random() * messages.length)];
    }
}

// Smart Prompts System
class SmartPrompts {
    ageChanged(age) {
        if (age < 14) {
            return {
                prompt: 'Young adolescent programs often focus on family involvement',
                suggestion: 'Consider programs with strong family therapy components'
            };
        } else if (age >= 18) {
            return {
                prompt: 'Young adult programs offer more independence',
                suggestion: 'Look for programs with life skills training'
            };
        }
    }
    
    primaryIssueSelected(issue) {
        const prompts = {
            'Substance Use': {
                prompt: 'Substance use often requires higher level initially',
                suggestion: 'Consider residential or PHP to start'
            },
            'Mental Health': {
                prompt: 'Mental health can often be treated outpatient',
                suggestion: 'IOP might be sufficient with good support'
            },
            'Dual Diagnosis': {
                prompt: 'Dual diagnosis needs integrated treatment',
                suggestion: 'Look for programs treating both simultaneously'
            },
            'Trauma': {
                prompt: 'Trauma requires specialized approaches',
                suggestion: 'Seek trauma-informed programs with EMDR/CPT'
            }
        };
        
        return prompts[issue] || {};
    }
    
    previousTreatmentSelected(treatment) {
        if (treatment === 'Residential') {
            return {
                prompt: 'Previous residential suggests need for different approach',
                suggestion: 'Consider different program or longer stay'
            };
        } else if (treatment === 'None') {
            return {
                prompt: 'First treatment attempt - set realistic expectations',
                suggestion: 'Start with appropriate level, can adjust if needed'
            };
        }
    }
    
    insuranceSelected(insurance) {
        const tips = {
            'Medicaid': 'Medicaid has limited options but good coverage',
            'Private Pay': 'Private pay opens all options',
            'BCBS': 'BCBS typically has good mental health coverage'
        };
        
        return {
            prompt: tips[insurance] || 'Verify coverage before admission',
            suggestion: 'Call insurance to confirm benefits'
        };
    }
    
    urgencySelected(urgency) {
        if (urgency === 'ASAP - Crisis') {
            return {
                prompt: 'Crisis situation - prioritize immediate availability',
                suggestion: 'Focus on programs with immediate openings',
                alert: true
            };
        }
    }
    
    programSelected(program, count) {
        const messages = [
            { message: 'Great choice!', tip: 'This program has excellent reviews' },
            { message: 'Nice selection!', tip: `You now have ${count} programs selected` },
            { message: 'Good find!', tip: 'Ready to compare when you have 2+' }
        ];
        
        return messages[Math.min(count - 1, messages.length - 1)];
    }
}

// Progress Tracker
class ProgressTracker {
    constructor() {
        this.startTime = Date.now();
        this.milestones = [];
    }
    
    profileCompleted() {
        this.addMilestone('profile-complete');
    }
    
    addMilestone(type) {
        this.milestones.push({
            type,
            timestamp: Date.now()
        });
    }
    
    getTotalTime() {
        const elapsed = Date.now() - this.startTime;
        const minutes = Math.floor(elapsed / 60000);
        return `${minutes} minutes`;
    }
}

// Initialize workflow engine globally
window.workflowEngine = new WorkflowEngine();
