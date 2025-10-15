// learning-modules.js - Interactive Learning Modules for CareConnect Pro

class LearningModules {
    constructor() {
        this.modules = {
            'levels-of-care': {
                id: 'levels-of-care',
                title: 'Understanding Levels of Care',
                duration: '30 min',
                description: 'Learn when to recommend each level of treatment',
                icon: '🏥',
                lessons: [
                    {
                        id: 'intro',
                        title: 'Introduction to Levels of Care',
                        type: 'interactive',
                        content: this.getLevelsIntroContent()
                    },
                    {
                        id: 'matching',
                        title: 'Matching Patients to Levels',
                        type: 'exercise',
                        content: this.getLevelsMatchingExercise()
                    },
                    {
                        id: 'case-studies',
                        title: 'Real Case Studies',
                        type: 'cases',
                        content: this.getLevelsCaseStudies()
                    },
                    {
                        id: 'quiz',
                        title: 'Knowledge Check',
                        type: 'quiz',
                        content: this.getLevelsQuiz()
                    }
                ],
                progress: 0,
                completed: false,
                certificate: null
            },
            'reading-profiles': {
                id: 'reading-profiles',
                title: 'Reading Program Profiles',
                duration: '25 min',
                description: 'Master the art of analyzing treatment programs',
                icon: '📋',
                lessons: [
                    {
                        id: 'anatomy',
                        title: 'Anatomy of a Program',
                        type: 'interactive',
                        content: this.getProfileAnatomyContent()
                    },
                    {
                        id: 'red-flags',
                        title: 'Red Flags vs Green Flags',
                        type: 'exercise',
                        content: this.getRedFlagsExercise()
                    },
                    {
                        id: 'insurance',
                        title: 'Insurance Decoder',
                        type: 'reference',
                        content: this.getInsuranceDecoderContent()
                    },
                    {
                        id: 'assessment',
                        title: 'Profile Assessment',
                        type: 'quiz',
                        content: this.getProfileQuiz()
                    }
                ],
                progress: 0,
                completed: false,
                certificate: null
            },
            'family-communication': {
                id: 'family-communication',
                title: 'Family Communication',
                duration: '35 min',
                description: 'Build confidence in family conversations',
                icon: '👨‍👩‍👧‍👦',
                lessons: [
                    {
                        id: 'styles',
                        title: 'Communication Styles',
                        type: 'roleplay',
                        content: this.getCommunicationStylesContent()
                    },
                    {
                        id: 'difficult',
                        title: 'Difficult Conversations',
                        type: 'scenarios',
                        content: this.getDifficultConversationsContent()
                    },
                    {
                        id: 'cultural',
                        title: 'Cultural Sensitivity',
                        type: 'interactive',
                        content: this.getCulturalSensitivityContent()
                    },
                    {
                        id: 'practice',
                        title: 'Practice Lab',
                        type: 'exercise',
                        content: this.getFamilyPracticeLab()
                    }
                ],
                progress: 0,
                completed: false,
                certificate: null
            },
            'documentation': {
                id: 'documentation',
                title: 'Documentation Mastery',
                duration: '20 min',
                description: 'Write professional clinical documents efficiently',
                icon: '📝',
                lessons: [
                    {
                        id: 'writing',
                        title: 'Clinical Writing Lab',
                        type: 'exercise',
                        content: this.getClinicalWritingLab()
                    },
                    {
                        id: 'templates',
                        title: 'Template Workshop',
                        type: 'interactive',
                        content: this.getTemplateWorkshop()
                    },
                    {
                        id: 'speed',
                        title: 'Speed Documentation',
                        type: 'timed',
                        content: this.getSpeedDocumentation()
                    }
                ],
                progress: 0,
                completed: false,
                certificate: null
            },
            'advanced-matching': {
                id: 'advanced-matching',
                title: 'Advanced Matching',
                duration: '40 min',
                description: 'Handle complex cases with confidence',
                icon: '🎯',
                lessons: [
                    {
                        id: 'complex',
                        title: 'Complex Cases',
                        type: 'cases',
                        content: this.getComplexCasesContent()
                    },
                    {
                        id: 'financial',
                        title: 'Financial Planning',
                        type: 'calculator',
                        content: this.getFinancialPlanningContent()
                    },
                    {
                        id: 'relationships',
                        title: 'Building Relationships',
                        type: 'guide',
                        content: this.getRelationshipBuildingContent()
                    }
                ],
                progress: 0,
                completed: false,
                certificate: null
            }
        };
        
        this.currentModule = null;
        this.currentLesson = null;
        this.userProgress = this.loadProgress();
    }
    
    // Module 1: Levels of Care Content
    getLevelsIntroContent() {
        return {
            title: 'Understanding the Continuum of Care',
            sections: [
                {
                    type: 'visual-hierarchy',
                    title: 'Treatment Intensity Ladder',
                    levels: [
                        {
                            name: 'Medical Detox',
                            intensity: 100,
                            description: '24/7 medical supervision for withdrawal',
                            whenToUse: 'Active substance use with physical dependence',
                            duration: '3-7 days',
                            cost: '$$$$$'
                        },
                        {
                            name: 'Residential Treatment',
                            intensity: 90,
                            description: '24/7 therapeutic environment',
                            whenToUse: 'Severe symptoms, unsafe home environment',
                            duration: '30-90 days',
                            cost: '$$$$'
                        },
                        {
                            name: 'Partial Hospitalization (PHP)',
                            intensity: 70,
                            description: '6+ hours/day, 5 days/week',
                            whenToUse: 'High needs but stable living situation',
                            duration: '2-4 weeks',
                            cost: '$$$'
                        },
                        {
                            name: 'Intensive Outpatient (IOP)',
                            intensity: 50,
                            description: '3+ hours/day, 3-5 days/week',
                            whenToUse: 'Moderate symptoms, can maintain daily life',
                            duration: '6-12 weeks',
                            cost: '$$'
                        },
                        {
                            name: 'Outpatient',
                            intensity: 20,
                            description: 'Weekly individual/group therapy',
                            whenToUse: 'Mild symptoms, strong support system',
                            duration: 'Ongoing',
                            cost: '$'
                        }
                    ]
                },
                {
                    type: 'interactive-decision-tree',
                    title: 'Which Level of Care?',
                    startQuestion: 'Is the patient currently using substances?',
                    tree: {
                        yes: {
                            question: 'Risk of dangerous withdrawal?',
                            yes: { recommendation: 'Medical Detox → Residential' },
                            no: {
                                question: 'Safe living environment?',
                                yes: { recommendation: 'IOP or PHP' },
                                no: { recommendation: 'Residential Treatment' }
                            }
                        },
                        no: {
                            question: 'Previous treatment attempts?',
                            yes: {
                                question: 'Successful with outpatient?',
                                yes: { recommendation: 'Continue Outpatient' },
                                no: { recommendation: 'Consider higher level (PHP/Residential)' }
                            },
                            no: { recommendation: 'Start with IOP, assess progress' }
                        }
                    }
                }
            ],
            interactiveElements: [
                {
                    type: 'hover-definitions',
                    terms: {
                        'PHP': 'Partial Hospitalization Program - Day treatment with evening return home',
                        'IOP': 'Intensive Outpatient Program - Several hours multiple days per week',
                        'MAT': 'Medication-Assisted Treatment - Medications to support recovery',
                        'ASAM': 'American Society of Addiction Medicine - Sets criteria for levels'
                    }
                }
            ]
        };
    }
    
    getLevelsMatchingExercise() {
        return {
            title: 'Match Patients to Appropriate Levels',
            instructions: 'Drag each patient scenario to the most appropriate level of care',
            scenarios: [
                {
                    id: 'patient1',
                    name: 'Sarah, 16',
                    description: 'First suicide attempt, stable home, parents engaged',
                    correctLevel: 'IOP',
                    feedback: 'Good choice! IOP provides intensive support while maintaining school.'
                },
                {
                    id: 'patient2',
                    name: 'Mike, 17',
                    description: 'Daily marijuana use, expelled from school, parent conflict',
                    correctLevel: 'Residential',
                    feedback: 'Correct! Residential provides structure and removes from negative environment.'
                },
                {
                    id: 'patient3',
                    name: 'Emma, 15',
                    description: 'Anxiety, self-harm thoughts, supportive family',
                    correctLevel: 'PHP',
                    feedback: 'Excellent! PHP gives daily support with evening family time.'
                },
                {
                    id: 'patient4',
                    name: 'James, 18',
                    description: 'Heroin use, homeless, multiple overdoses',
                    correctLevel: 'Detox',
                    feedback: 'Critical choice! Medical detox is essential for safety, then residential.'
                }
            ],
            levels: ['Detox', 'Residential', 'PHP', 'IOP', 'Outpatient']
        };
    }
    
    getLevelsCaseStudies() {
        return {
            title: 'Real-World Case Studies',
            cases: [
                {
                    title: 'The Resistant Teen',
                    patient: 'Alex, 15, mandated by court after DUI',
                    initialPlan: 'Parents wanted outpatient only',
                    challenge: 'Continued use, lying about attendance',
                    intervention: 'Escalated to IOP with random drug testing',
                    outcome: '6 months sober, returned to school',
                    lesson: 'Sometimes starting lower and escalating is necessary for buy-in'
                },
                {
                    title: 'The High Achiever',
                    patient: 'Jordan, 17, straight-A student with hidden addiction',
                    initialPlan: 'Residential recommended',
                    challenge: 'Family worried about college applications',
                    intervention: 'PHP with academic support, then IOP',
                    outcome: 'Maintained grades, got into first-choice college',
                    lesson: 'Balance treatment needs with life goals'
                },
                {
                    title: 'The Repeat Visitor',
                    patient: 'Casey, 16, third treatment attempt',
                    initialPlan: 'Same residential program',
                    challenge: 'Previous programs didn\'t address trauma',
                    intervention: 'Trauma-focused residential with longer stay',
                    outcome: '18 months sober, first successful completion',
                    lesson: 'Address underlying issues, not just symptoms'
                }
            ]
        };
    }
    
    getLevelsQuiz() {
        return {
            title: 'Levels of Care Knowledge Check',
            passingScore: 80,
            questions: [
                {
                    question: 'Which level provides 24/7 medical supervision?',
                    options: ['IOP', 'PHP', 'Medical Detox', 'Outpatient'],
                    correct: 2,
                    explanation: 'Medical detox provides round-the-clock medical monitoring for safe withdrawal.'
                },
                {
                    question: 'PHP typically involves how many hours per day?',
                    options: ['1-2 hours', '3-4 hours', '6+ hours', '24 hours'],
                    correct: 2,
                    explanation: 'PHP (Partial Hospitalization) is 6+ hours daily, 5 days a week.'
                },
                {
                    question: 'Best level for stable home but high clinical needs?',
                    options: ['Residential', 'PHP', 'Outpatient', 'Sober Living'],
                    correct: 1,
                    explanation: 'PHP provides intensive daily treatment while allowing evening family time.'
                },
                {
                    question: 'When should you consider residential treatment?',
                    options: [
                        'Mild anxiety only',
                        'Unsafe home environment',
                        'Working full-time',
                        'First therapy attempt'
                    ],
                    correct: 1,
                    explanation: 'Residential is crucial when the home environment undermines recovery.'
                },
                {
                    question: 'IOP is typically how many days per week?',
                    options: ['1 day', '2 days', '3-5 days', '7 days'],
                    correct: 2,
                    explanation: 'IOP runs 3-5 days per week, usually 3-4 hours per session.'
                },
                {
                    question: 'Which factor most influences level of care?',
                    options: ['Age', 'Insurance', 'Safety', 'Preference'],
                    correct: 2,
                    explanation: 'Safety is paramount - both physical safety and risk of harm.'
                },
                {
                    question: 'Appropriate step-down from residential?',
                    options: ['Discharge', 'PHP or IOP', 'Inpatient', 'Nothing'],
                    correct: 1,
                    explanation: 'PHP or IOP provides continued support while transitioning home.'
                },
                {
                    question: 'Red flag requiring immediate higher care?',
                    options: [
                        'Missing one session',
                        'Active suicidal ideation',
                        'Family conflict',
                        'School stress'
                    ],
                    correct: 1,
                    explanation: 'Active suicidal ideation requires immediate intensive intervention.'
                },
                {
                    question: 'Best for maintaining school/work?',
                    options: ['Residential', 'PHP', 'IOP', 'Detox'],
                    correct: 2,
                    explanation: 'IOP\'s evening schedule allows for daytime responsibilities.'
                },
                {
                    question: 'Insurance typically covers residential for?',
                    options: ['7 days', '14-30 days', '6 months', '1 year'],
                    correct: 1,
                    explanation: 'Most insurance covers 14-30 days initially, with possible extensions.'
                }
            ]
        };
    }
    
    // Module 2: Reading Profiles Content
    getProfileAnatomyContent() {
        return {
            title: 'Anatomy of a Program Profile',
            interactiveProfile: {
                sections: [
                    {
                        id: 'header',
                        label: 'Program Identity',
                        lookFor: ['Accreditations', 'Years in operation', 'Specializations'],
                        redFlags: ['No accreditation', 'Brand new', 'Vague descriptions'],
                        greenFlags: ['CARF/Joint Commission', '10+ years', 'Clear specialty']
                    },
                    {
                        id: 'clinical',
                        label: 'Clinical Program',
                        lookFor: ['Evidence-based practices', 'Staff credentials', 'Therapy hours'],
                        redFlags: ['No licensed staff', 'Unclear modalities', 'Low therapy hours'],
                        greenFlags: ['DBT/CBT certified', 'MD/PhD on staff', '20+ hours/week']
                    },
                    {
                        id: 'population',
                        label: 'Who They Serve',
                        lookFor: ['Age ranges', 'Specialties', 'Exclusions'],
                        redFlags: ['Too broad', 'No exclusion criteria', 'Mismatched'],
                        greenFlags: ['Specific population', 'Clear criteria', 'Expertise match']
                    },
                    {
                        id: 'outcomes',
                        label: 'Success Metrics',
                        lookFor: ['Completion rates', 'Follow-up data', 'Satisfaction scores'],
                        redFlags: ['No data', 'Only testimonials', 'Vague claims'],
                        greenFlags: ['Published outcomes', '70%+ completion', 'Third-party data']
                    }
                ],
                hiddenGems: [
                    'Family involvement level',
                    'Aftercare support duration',
                    'Staff-to-patient ratios',
                    'Typical length of stay',
                    'Discharge planning process'
                ]
            }
        };
    }
    
    getRedFlagsExercise() {
        return {
            title: 'Spot the Red and Green Flags',
            scenarios: [
                {
                    text: 'We accept all insurance and guarantee results!',
                    type: 'red',
                    explanation: 'No program can guarantee results, and "all insurance" is unlikely.'
                },
                {
                    text: 'Our clinical director has 20 years experience and publishes research.',
                    type: 'green',
                    explanation: 'Experience plus academic involvement shows expertise.'
                },
                {
                    text: 'We use a proprietary treatment method not found anywhere else.',
                    type: 'red',
                    explanation: 'Unproven methods without evidence are concerning.'
                },
                {
                    text: 'Average length of stay is determined by clinical need, not insurance.',
                    type: 'green',
                    explanation: 'Clinical decisions should drive treatment, not just coverage.'
                },
                {
                    text: 'We don\'t allow any family contact for the first 30 days.',
                    type: 'red',
                    explanation: 'Excessive isolation from family is often counterproductive.'
                }
            ]
        };
    }
    
    getInsuranceDecoderContent() {
        return {
            title: 'Insurance Terms Decoded',
            terms: {
                'Single Case Agreement': 'Negotiated rate for specific patient when out-of-network',
                'Prior Authorization': 'Insurance approval needed before admission',
                'Medical Necessity': 'Clinical justification required for coverage',
                'Concurrent Review': 'Ongoing approval process during treatment',
                'Out-of-Network Benefits': 'Coverage for non-contracted providers',
                'Deductible': 'Amount patient pays before insurance starts',
                'Coinsurance': 'Percentage patient pays after deductible',
                'Out-of-Pocket Maximum': 'Most patient will pay in a year'
            },
            questionsToAsk: [
                'Do you have a single case agreement with [Insurance]?',
                'What\'s the typical length of stay approved?',
                'How often are concurrent reviews?',
                'What happens if insurance denies extension?',
                'Do you offer financial assistance?',
                'Can you help with insurance appeals?'
            ],
            verificationChecklist: [
                'Get patient\'s member ID and group number',
                'Call insurance behavioral health line',
                'Verify deductible and out-of-pocket status',
                'Confirm level of care coverage',
                'Ask about preauthorization requirements',
                'Get reference number for the call',
                'Document everything in writing'
            ]
        };
    }
    
    getProfileQuiz() {
        return {
            title: 'Program Profile Assessment',
            task: 'Review these 3 programs and match the best one to the patient',
            patient: {
                age: 16,
                diagnosis: 'Depression, anxiety, cannabis use',
                insurance: 'BCBS PPO',
                needs: 'Trauma-informed care, family involvement',
                location: 'Prefer within 100 miles'
            },
            programs: [
                {
                    name: 'Sunrise Recovery',
                    highlights: 'Substance focus, 12-step, adult program',
                    match: false,
                    reason: 'Adult program, not trauma-informed'
                },
                {
                    name: 'Healing Hearts',
                    highlights: 'Adolescent, trauma-certified, family program, BCBS',
                    match: true,
                    reason: 'Perfect match for all criteria'
                },
                {
                    name: 'Mountain View',
                    highlights: 'Wilderness therapy, 6 months minimum, cash only',
                    match: false,
                    reason: 'No insurance, too long'
                }
            ]
        };
    }
    
    // Module 3: Family Communication Content
    getCommunicationStylesContent() {
        return {
            title: 'Adapting Your Communication Style',
            styles: [
                {
                    type: 'Anxious Family',
                    characteristics: ['Many questions', 'Needs reassurance', 'Catastrophizing'],
                    approach: [
                        'Provide detailed information',
                        'Regular check-ins',
                        'Written summaries',
                        'Patience with repetition'
                    ],
                    sample: 'I understand this feels overwhelming. Let\'s go through each option step by step...'
                },
                {
                    type: 'Resistant Family',
                    characteristics: ['Minimizing problems', 'Blame others', 'Angry'],
                    approach: [
                        'Validate feelings first',
                        'Use motivational interviewing',
                        'Focus on youth\'s needs',
                        'Small steps'
                    ],
                    sample: 'You know your child best. What changes have you noticed that concern you?'
                },
                {
                    type: 'Overwhelmed Family',
                    characteristics: ['Crisis mode', 'Multiple stressors', 'Decision paralysis'],
                    approach: [
                        'Simplify choices',
                        'Prioritize urgent needs',
                        'Offer concrete next steps',
                        'Connect to resources'
                    ],
                    sample: 'Let\'s focus on the most important step right now, then build from there.'
                }
            ],
            rolePlayScenarios: [
                {
                    title: 'The Angry Father',
                    setup: 'Dad says: "This is ridiculous! He just needs discipline!"',
                    goodResponse: 'I hear your frustration. You want what\'s best for your son. Discipline is important, and he also needs clinical support for the underlying issues.',
                    badResponse: 'You\'re wrong. This is a medical condition.',
                    learning: 'Validate before educating'
                }
            ]
        };
    }
    
    getDifficultConversationsContent() {
        return {
            title: 'Navigating Difficult Conversations',
            scenarios: [
                {
                    situation: 'Program is full',
                    familyReaction: 'But you said this was perfect!',
                    response: {
                        acknowledge: 'I know this is disappointing',
                        action: 'Let\'s get on the waitlist and identify alternatives',
                        followUp: 'I\'ll call weekly for updates'
                    }
                },
                {
                    situation: 'Insurance denied',
                    familyReaction: 'We can\'t afford private pay!',
                    response: {
                        acknowledge: 'This is incredibly stressful',
                        action: 'We can appeal, seek single case agreement, or explore other programs',
                        followUp: 'I\'ll help with the appeal letter'
                    }
                },
                {
                    situation: 'Family disagrees with recommendation',
                    familyReaction: 'Residential is too extreme!',
                    response: {
                        acknowledge: 'It does feel like a big step',
                        action: 'Let\'s discuss your concerns and look at all options',
                        followUp: 'We can start with IOP and reassess'
                    }
                }
            ]
        };
    }
    
    getCulturalSensitivityContent() {
        return {
            title: 'Cultural Considerations in Treatment Planning',
            dimensions: [
                {
                    aspect: 'Language',
                    considerations: [
                        'Therapy in native language',
                        'Translated materials',
                        'Interpreter services',
                        'Bilingual staff preference'
                    ]
                },
                {
                    aspect: 'Religion/Spirituality',
                    considerations: [
                        'Faith-based vs secular programs',
                        'Dietary restrictions',
                        'Prayer/worship accommodations',
                        'Holiday observances'
                    ]
                },
                {
                    aspect: 'Family Structure',
                    considerations: [
                        'Extended family involvement',
                        'Decision-making hierarchy',
                        'Gender preferences for providers',
                        'Collective vs individual focus'
                    ]
                },
                {
                    aspect: 'LGBTQ+ Affirmation',
                    considerations: [
                        'Affirming policies',
                        'Trained staff',
                        'Peer support',
                        'Safety concerns'
                    ]
                }
            ],
            interactiveMap: {
                instructions: 'Click each region to see cultural considerations',
                regions: {
                    'Latino/Hispanic': ['Family-centered', 'Respect for elders', 'Spirituality important'],
                    'Asian/Pacific Islander': ['Saving face', 'Academic pressure', 'Holistic health'],
                    'African American': ['Church involvement', 'Historical mistrust', 'Extended family'],
                    'Native American': ['Tribal connections', 'Traditional healing', 'Historical trauma'],
                    'Middle Eastern': ['Gender considerations', 'Religious observance', 'Privacy concerns']
                }
            }
        };
    }
    
    getFamilyPracticeLab() {
        return {
            title: 'Practice Your Presentation Skills',
            exercises: [
                {
                    type: 'script-builder',
                    task: 'Create your opening for a family meeting',
                    template: [
                        'Thank you for...',
                        'Today we\'ll discuss...',
                        'My role is to...',
                        'Questions are welcome...'
                    ]
                },
                {
                    type: 'self-assessment',
                    criteria: [
                        'Spoke clearly and slowly',
                        'Used plain language',
                        'Showed empathy',
                        'Invited questions',
                        'Provided written summary'
                    ]
                }
            ]
        };
    }
    
    // Module 4: Documentation Content
    getClinicalWritingLab() {
        return {
            title: 'Transform Casual to Clinical',
            exercises: [
                {
                    casual: 'Kid has problems with drugs and fighting',
                    clinical: 'Adolescent presents with substance use disorder and conduct issues',
                    practice: 'Transform: Teen is really depressed and cuts herself'
                },
                {
                    casual: 'Family is a mess',
                    clinical: 'Family system exhibits dysfunction requiring therapeutic intervention',
                    practice: 'Transform: Parents fight all the time'
                }
            ],
            insurancePhrasing: {
                good: [
                    'Medical necessity established',
                    'Meets criteria for',
                    'Clinically appropriate',
                    'Evidence-based intervention'
                ],
                avoid: [
                    'Might benefit from',
                    'Could try',
                    'Family wants',
                    'Seems like'
                ]
            }
        };
    }
    
    getTemplateWorkshop() {
        return {
            title: 'Build Your Template Library',
            templates: {
                opening: [
                    'Following comprehensive assessment...',
                    'Based on clinical presentation...',
                    'Per evaluation conducted on [DATE]...'
                ],
                recommendations: [
                    'Recommended level of care: [LEVEL] based on...',
                    'Clinical indicators support...',
                    'Treatment goals include...'
                ],
                closing: [
                    'Prognosis with treatment is favorable',
                    'Family engagement will be critical',
                    'Recommend reassessment in [TIME]'
                ]
            }
        };
    }
    
    getSpeedDocumentation() {
        return {
            title: 'Speed Documentation Challenge',
            exercises: [
                {
                    type: 'timed-writing',
                    task: 'Write discharge summary in 10 minutes',
                    timer: 600,
                    checklist: [
                        'Diagnosis',
                        'Treatment provided',
                        'Progress made',
                        'Recommendations',
                        'Follow-up plan'
                    ]
                }
            ],
            shortcuts: {
                'Ctrl+1': 'Insert diagnosis',
                'Ctrl+2': 'Insert recommendation',
                'Ctrl+3': 'Insert closing',
                'Tab': 'Next field',
                'F2': 'Spell check'
            }
        };
    }
    
    // Module 5: Advanced Content
    getComplexCasesContent() {
        return {
            title: 'Managing Complex Cases',
            cases: [
                {
                    type: 'Dual Diagnosis',
                    considerations: [
                        'Integrated treatment essential',
                        'Psychiatric stability first',
                        'Medication management',
                        'Higher level initially'
                    ]
                },
                {
                    type: 'Trauma + Substance',
                    considerations: [
                        'Trauma-informed required',
                        'EMDR/CPT trained staff',
                        'Safety planning',
                        'Longer treatment'
                    ]
                },
                {
                    type: 'LGBTQ+ Youth',
                    considerations: [
                        'Affirming environment',
                        'Peer support crucial',
                        'Family acceptance work',
                        'Safety from discrimination'
                    ]
                }
            ]
        };
    }
    
    getFinancialPlanningContent() {
        return {
            title: 'Financial Planning Tools',
            calculator: {
                inputs: ['Daily rate', 'Length of stay', 'Insurance coverage %', 'Deductible'],
                outputs: ['Total cost', 'Insurance pays', 'Family responsibility', 'Payment plan options']
            },
            resources: [
                'Scholarship programs',
                'Sliding scale options',
                'Crowdfunding platforms',
                'Payment plan negotiation',
                'Tax deductions'
            ]
        };
    }
    
    getRelationshipBuildingContent() {
        return {
            title: 'Building Your Referral Network',
            strategies: [
                'Regular check-ins with admissions',
                'Visit programs quarterly',
                'Attend their events',
                'Share success stories',
                'Provide detailed referrals',
                'Follow up on placements'
            ],
            benefits: [
                'Priority admission',
                'Flexible payment terms',
                'Extra support for your clients',
                'Direct clinical communication',
                'Scholarship opportunities'
            ]
        };
    }
    
    // Core Learning Functions
    startModule(moduleId) {
        this.currentModule = this.modules[moduleId];
        this.currentLesson = 0;
        return this.getCurrentLesson();
    }
    
    getCurrentLesson() {
        if (!this.currentModule) return null;
        return this.currentModule.lessons[this.currentLesson];
    }
    
    nextLesson() {
        if (!this.currentModule) return null;
        
        this.currentLesson++;
        if (this.currentLesson >= this.currentModule.lessons.length) {
            this.completeModule();
            return null;
        }
        
        return this.getCurrentLesson();
    }
    
    completeModule() {
        if (!this.currentModule) return;
        
        this.currentModule.completed = true;
        this.currentModule.progress = 100;
        this.currentModule.certificate = this.generateCertificate();
        
        this.saveProgress();
        this.unlockAchievement('module-complete', this.currentModule.id);
        
        return {
            message: `Congratulations! You've completed ${this.currentModule.title}!`,
            certificate: this.currentModule.certificate,
            nextModule: this.getNextModule()
        };
    }
    
    generateCertificate() {
        return {
            id: `cert-${Date.now()}`,
            module: this.currentModule.title,
            completedDate: new Date().toISOString(),
            score: this.currentModule.quizScore || 100,
            clinicianName: this.userProgress.name || 'Clinician'
        };
    }
    
    getNextModule() {
        const moduleIds = Object.keys(this.modules);
        const currentIndex = moduleIds.indexOf(this.currentModule.id);
        
        if (currentIndex < moduleIds.length - 1) {
            return moduleIds[currentIndex + 1];
        }
        
        return null;
    }
    
    saveProgress() {
        const progress = {
            modules: {},
            achievements: this.userProgress.achievements || [],
            totalTime: this.userProgress.totalTime || 0,
            lastAccessed: new Date().toISOString()
        };
        
        Object.keys(this.modules).forEach(id => {
            progress.modules[id] = {
                progress: this.modules[id].progress,
                completed: this.modules[id].completed,
                certificate: this.modules[id].certificate
            };
        });
        
        localStorage.setItem('careconnect_learning_progress', JSON.stringify(progress));
    }
    
    loadProgress() {
        const saved = localStorage.getItem('careconnect_learning_progress');
        if (saved) {
            const progress = JSON.parse(saved);
            
            // Apply saved progress to modules
            Object.keys(progress.modules).forEach(id => {
                if (this.modules[id]) {
                    this.modules[id].progress = progress.modules[id].progress;
                    this.modules[id].completed = progress.modules[id].completed;
                    this.modules[id].certificate = progress.modules[id].certificate;
                }
            });
            
            return progress;
        }
        
        return {
            modules: {},
            achievements: [],
            totalTime: 0
        };
    }
    
    unlockAchievement(type, detail) {
        const achievement = {
            type,
            detail,
            unlockedAt: new Date().toISOString(),
            icon: this.getAchievementIcon(type)
        };
        
        if (!this.userProgress.achievements) {
            this.userProgress.achievements = [];
        }
        
        this.userProgress.achievements.push(achievement);
        this.saveProgress();
        
        return achievement;
    }
    
    getAchievementIcon(type) {
        const icons = {
            'module-complete': '🏆',
            'first-week': '🌟',
            'speed-demon': '⚡',
            'perfect-score': '💯',
            'helping-hand': '🤝'
        };
        
        return icons[type] || '🎯';
    }
    
    // Quiz Handling
    submitQuizAnswer(questionIndex, answerIndex) {
        const quiz = this.getCurrentLesson().content;
        const question = quiz.questions[questionIndex];
        
        const isCorrect = answerIndex === question.correct;
        
        if (!this.currentModule.quizAnswers) {
            this.currentModule.quizAnswers = [];
        }
        
        this.currentModule.quizAnswers[questionIndex] = {
            answered: answerIndex,
            correct: isCorrect
        };
        
        return {
            correct: isCorrect,
            explanation: question.explanation
        };
    }
    
    calculateQuizScore() {
        if (!this.currentModule.quizAnswers) return 0;
        
        const correct = this.currentModule.quizAnswers.filter(a => a.correct).length;
        const total = this.currentModule.quizAnswers.length;
        
        return Math.round((correct / total) * 100);
    }
    
    // Interactive Exercise Handling
    checkExerciseAnswer(exerciseId, answer) {
        // Implementation depends on exercise type
        // Returns feedback object
        return {
            correct: true,
            feedback: 'Great work!',
            nextStep: 'Continue to next exercise'
        };
    }
    
    // Get module statistics
    getModuleStats() {
        const stats = {
            totalModules: Object.keys(this.modules).length,
            completedModules: 0,
            inProgressModules: 0,
            totalProgress: 0
        };
        
        Object.values(this.modules).forEach(module => {
            if (module.completed) {
                stats.completedModules++;
            } else if (module.progress > 0) {
                stats.inProgressModules++;
            }
            stats.totalProgress += module.progress;
        });
        
        stats.averageProgress = Math.round(stats.totalProgress / stats.totalModules);
        
        return stats;
    }
}

// Initialize learning modules globally
window.learningModules = new LearningModules();
