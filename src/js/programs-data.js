// programs-data.js - Treatment programs database
// This data is loaded from your existing programs or can be populated via Chrome Extension

window.programsData = [
    {
        id: 'program_1',
        name: 'Charlie Health Virtual IOP Program',
        location: { city: 'Virtual', state: '', distance: null },
        type: 'Virtual Program',
        category: 'virtual',
        clinical: {
            levelsOfCare: ['IOP'],
            primaryFocus: 'Mental Health',
            specializations: ['Anxiety', 'Depression', 'Mental Health'],
            modalities: {
                evidenceBased: ['Group Therapy', 'Individual Therapy', 'Family Therapy'],
                experiential: [],
                holistic: []
            }
        },
        population: {
            ages: '13-25',
            gender: 'Co-ed',
            specialPopulations: []
        },
        structure: {
            lengthOfStay: '6-10 weeks',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: ['Most Major Insurers'],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '561.203.5396',
            email: '',
            contactPerson: 'Gabriella H.'
        },
        website: 'https://www.charliehealth.com',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_2',
        name: 'The Last House',
        location: { city: 'Los Angeles', state: 'CA', distance: null },
        type: 'Sober Living',
        category: 'sober-living',
        clinical: {
            levelsOfCare: ['Sober Living'],
            primaryFocus: 'Substance Use Disorders',
            specializations: ['Substance Use', 'Recovery Support'],
            modalities: {
                evidenceBased: ['12-Step'],
                experiential: ['Community Activities'],
                holistic: []
            }
        },
        population: {
            ages: '18+',
            gender: 'Males Only',
            specialPopulations: ['Young Adults']
        },
        structure: {
            lengthOfStay: 'Flexible',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: [],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '866.677.0090',
            email: '',
            address: '3101 Ocean Park Blvd #302, Santa Monica, CA 90405'
        },
        website: 'https://thelasthouse.net',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_3',
        name: 'Patton Sober Living Homes',
        location: { city: 'Dallas', state: 'TX', distance: null },
        type: 'Sober Living',
        category: 'sober-living',
        clinical: {
            levelsOfCare: ['Sober Living'],
            primaryFocus: 'Substance Use Disorders',
            specializations: ['Substance Use', 'Life Skills'],
            modalities: {
                evidenceBased: ['12-Step', 'Employment Coaching'],
                experiential: ['Life Skills Training'],
                holistic: []
            }
        },
        population: {
            ages: '18-25',
            gender: 'Males Only',
            specialPopulations: ['Young Adults']
        },
        structure: {
            lengthOfStay: 'Flexible',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: [],
            privatePay: true,
            requirements: ['Employment or Education (25+ hrs/week)']
        },
        contact: {
            phone: '(469) 974-4639',
            email: '',
            contactPerson: 'Austin Shook, Program Director',
            address: '13028 Fall Manor Dr, Dallas, TX 75243'
        },
        website: 'https://pattonsoberliving.com/index.html',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_4',
        name: 'Stonewater Adolescent Recovery Center',
        location: { city: 'Oxford', state: 'MS', distance: null },
        type: 'Residential Treatment',
        category: 'residential',
        clinical: {
            levelsOfCare: ['Residential', 'Detox'],
            primaryFocus: 'Dual Diagnosis',
            specializations: ['Substance Use', 'Mental Health', 'Dual Diagnosis'],
            modalities: {
                evidenceBased: ['Psychiatric Care', 'Individual Therapy', 'Family Therapy'],
                experiential: [],
                holistic: ['Faith-Based']
            }
        },
        population: {
            ages: 'Adolescents',
            gender: 'Males Only',
            specialPopulations: []
        },
        structure: {
            lengthOfStay: 'Variable',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: ['Most Major Insurers'],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '(570) 222-3449',
            email: 'info@serenitylodgerecovery.com',
            contactPerson: 'Bridget Norris',
            address: '21 Weida Ct Nicholson, PA 18446'
        },
        website: 'https://stonewaterrecovery.com',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_5',
        name: 'Resilience Recovery Residences',
        location: { city: 'West Palm Beach', state: 'FL', distance: null },
        type: 'Sober Living',
        category: 'sober-living',
        clinical: {
            levelsOfCare: ['Sober Living', 'IOP'],
            primaryFocus: 'Substance Use Disorders',
            specializations: ['Substance Use', 'Recovery Support'],
            modalities: {
                evidenceBased: ['12-Step', 'IOP', 'Therapy'],
                experiential: [],
                holistic: []
            }
        },
        population: {
            ages: '16+',
            gender: 'Males Only',
            specialPopulations: ['Young Adults']
        },
        structure: {
            lengthOfStay: 'Phased (60-120+ days)',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: [],
            privatePay: true,
            requirements: ['Completed Primary Treatment']
        },
        contact: {
            phone: '424-254-4304',
            email: '',
            contactPerson: 'Christopher Martinez, Owner',
            address: '3011 Poinsettia Ave, West Palm Beach, FL 33407'
        },
        website: 'www.resiliencerecoveryresources.com',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_6',
        name: 'The Insight Program',
        location: { city: 'Tampa', state: 'FL', distance: null },
        type: 'IOP',
        category: 'outpatient',
        clinical: {
            levelsOfCare: ['IOP'],
            primaryFocus: 'Substance Use Disorders',
            specializations: ['Substance Use', 'Co-Occurring Disorders'],
            modalities: {
                evidenceBased: ['Individual Therapy', 'Family Therapy', '12-Step'],
                experiential: [],
                holistic: []
            }
        },
        population: {
            ages: '13-25',
            gender: 'Co-ed',
            specialPopulations: ['Adolescents', 'Young Adults']
        },
        structure: {
            lengthOfStay: 'Variable',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: ['Most Major Insurers'],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '470-505-9786',
            email: '',
            contactPerson: 'Adam Schwartz',
            address: '13944 Lynmar Blvd, Tampa, FL 33626'
        },
        website: 'https://theinsightprogram.com/',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_7',
        name: 'Turnbridge Residential',
        location: { city: 'New Haven', state: 'CT', distance: null },
        type: 'Residential Treatment',
        category: 'residential',
        clinical: {
            levelsOfCare: ['Residential', 'Sober Living'],
            primaryFocus: 'Dual Diagnosis',
            specializations: ['Substance Use', 'Mental Health', 'Life Skills'],
            modalities: {
                evidenceBased: ['Therapy', 'Medication Management'],
                experiential: ['Recreation', 'Wellness Activities'],
                holistic: []
            }
        },
        population: {
            ages: 'Young Adults',
            gender: 'Co-ed',
            specialPopulations: []
        },
        structure: {
            lengthOfStay: 'Long-term (Phased)',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: ['Most Major Insurers'],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '512.921.3533',
            email: 'blegacki@turnbridge.com',
            contactPerson: 'Beth Legacki',
            address: '189 Orange Street, New Haven, CT 06510'
        },
        website: 'www.turnbridge.com',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_8',
        name: 'Greater Nashua Mental Health',
        location: { city: 'Nashua', state: 'NH', distance: null },
        type: 'IOP',
        category: 'outpatient',
        clinical: {
            levelsOfCare: ['IOP'],
            primaryFocus: 'Dual Diagnosis',
            specializations: ['Substance Use', 'Mental Health'],
            modalities: {
                evidenceBased: ['Group Therapy', 'Individual Therapy', 'Family Therapy', 'Psychiatric Services'],
                experiential: [],
                holistic: []
            }
        },
        population: {
            ages: 'Adolescents',
            gender: 'Co-ed',
            specialPopulations: []
        },
        structure: {
            lengthOfStay: 'Variable',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: ['Most Commercial Plans'],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '603.401.1597',
            email: '',
            address: '15 Prospect Street, Nashua, NH 03060'
        },
        website: 'https://gnmhc.org/',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_9',
        name: 'Directions Behavioral Health',
        location: { city: 'Nashua', state: 'NH', distance: null },
        type: 'PHP/IOP',
        category: 'outpatient',
        clinical: {
            levelsOfCare: ['PHP', 'IOP'],
            primaryFocus: 'Mental Health',
            specializations: ['Mental Health', 'Substance Use'],
            modalities: {
                evidenceBased: ['Group Therapy', 'Psychiatric Services'],
                experiential: [],
                holistic: []
            }
        },
        population: {
            ages: 'Adolescents & Young Adults',
            gender: 'Co-ed',
            specialPopulations: []
        },
        structure: {
            lengthOfStay: 'Variable',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: ['Most Commercial Plans'],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '603.880.8188',
            email: '',
            address: '25 Technology Way, Nashua, NH 03060'
        },
        website: 'https://www.directionbehavioralhealth.com/',
        quality: {
            accreditations: [],
            memberships: []
        }
    },
    {
        id: 'program_10',
        name: 'In Balance Academy',
        location: { city: 'Tucson', state: 'AZ', distance: null },
        type: 'Therapeutic Boarding School',
        category: 'therapeutic-school',
        clinical: {
            levelsOfCare: ['Residential'],
            primaryFocus: 'Therapeutic Education',
            specializations: ['Character Development', 'Academic Support'],
            modalities: {
                evidenceBased: ['Family Therapy', 'Individual Therapy'],
                experiential: ['Service Learning', 'Mentorship'],
                holistic: ['Values-Based']
            }
        },
        population: {
            ages: 'Adolescents',
            gender: 'Males Only',
            specialPopulations: []
        },
        structure: {
            lengthOfStay: '12-18 months',
            capacity: '',
            staffRatio: '',
            groupSize: ''
        },
        admissions: {
            insurance: ['Most Major Insurers'],
            privatePay: true,
            requirements: []
        },
        contact: {
            phone: '801.369.0238',
            email: 'ptaylor@livestronghouse.com',
            contactPerson: 'Tiffany, Director of Admissions',
            address: '195 25th Street, Suite 300, Ogden, UT 84401'
        },
        website: 'www.inbalanceacademy.com',
        quality: {
            accreditations: [],
            memberships: []
        }
    }
];

// Save to localStorage for persistence
try {
    localStorage.setItem('careconnect_programs', JSON.stringify(window.programsData));
    console.log(`[Programs] Loaded ${window.programsData.length} programs into storage`);
} catch (e) {
    console.warn('[Programs] Could not save to localStorage:', e);
}
