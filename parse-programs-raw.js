// parse-programs-raw.js - Parse PROGRAMSRAW into CareConnect format

const fs = require('fs');

console.log('📊 Parsing PROGRAMSRAW data...\n');

const raw = fs.readFileSync('PROGRAMSRAW', 'utf8');

// Split by program entries - look for pattern "Name – Location" 
const lines = raw.split('\n');
const programs = [];
let programId = 1;
let currentProgram = null;
let section = null;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this is a program header (Name – Location)
    if (line.match(/^[A-Z].+ – .+$/)) {
        // Save previous program
        if (currentProgram && currentProgram.name) {
            programs.push(currentProgram);
        }
        
        // Start new program
        const parts = line.split(' – ');
        const name = parts[0].trim();
        const location = parts[1] ? parts[1].trim() : '';
        
        const locationParts = location.split(',').map(s => s.trim());
        const city = locationParts[0] || location;
        const state = locationParts[1] || '';
        
        currentProgram = {
            id: `program_${programId++}`,
            name,
            location: { city, state },
            levelOfCare: '',
            features: [],
            contact: {}
        };
        section = null;
        continue;
    }
    
    if (!currentProgram) continue;
    
    // Identify sections
    if (line === 'Level of Care & Services Provided:') {
        section = 'level';
        continue;
    }
    if (line === 'Program Details / Differentiating Features:' || line === 'Program Details:') {
        section = 'features';
        continue;
    }
    if (line === 'Contact Information:') {
        section = 'contact';
        continue;
    }
    
    // Parse content based on section
    if (section === 'level' && line && !line.includes(':')) {
        currentProgram.levelOfCare += (currentProgram.levelOfCare ? ' ' : '') + line;
    }
    
    if (section === 'features' && line.startsWith('•')) {
        currentProgram.features.push(line.substring(1).trim());
    }
    
    if (section === 'contact') {
        const contactMatch = line.match(/Contact:\s*(.+)/);
        const phoneMatch = line.match(/Phone:\s*(.+)/);
        const emailMatch = line.match(/Email:\s*(.+)/);
        const websiteMatch = line.match(/Website:\s*(.+)/);
        const addressMatch = line.match(/Address:\s*(.+)/);
        const locationMatch = line.match(/Location:\s*(.+)/);
        
        if (contactMatch) currentProgram.contact.contactPerson = contactMatch[1].trim();
        if (phoneMatch) currentProgram.contact.phone = phoneMatch[1].trim();
        if (emailMatch) currentProgram.contact.email = emailMatch[1].trim();
        if (websiteMatch) currentProgram.contact.website = websiteMatch[1].trim();
        if (addressMatch) currentProgram.contact.address = addressMatch[1].trim();
        if (locationMatch && !currentProgram.location.city) {
            const parts = locationMatch[1].split(',').map(s => s.trim());
            currentProgram.location.city = parts[0];
            currentProgram.location.state = parts[1] || '';
        }
    }
}

// Add last program
if (currentProgram && currentProgram.name) {
    programs.push(currentProgram);
}

console.log(`✅ Parsed ${programs.length} programs from PROGRAMSRAW`);

// Convert to full format
const convertedPrograms = programs.map(prog => {
    
    const name = headerMatch[1].trim();
    const location = headerMatch[2].trim();
    
    // Parse location
    const locationParts = location.split(',').map(s => s.trim());
    const city = locationParts[0] || location;
    const state = locationParts[1] || '';
    
    // Extract level of care
    const levelMatch = entry.match(/Level of Care & Services Provided:\s*\n(.+?)(?:\n(?:Program Details|Contact))/s);
    const levelOfCare = levelMatch ? levelMatch[1].trim() : '';
    
    // Extract features
    const featuresMatch = entry.match(/Program Details \/ Differentiating Features:\s*\n([\s\S]+?)(?:\nContact Information:|$)/);
    const featuresText = featuresMatch ? featuresMatch[1] : '';
    const features = featuresText.split('\n')
        .filter(line => line.trim().startsWith('•'))
        .map(line => line.trim().substring(1).trim());
    
    // Extract contact info
    const phoneMatch = entry.match(/Phone:\s*(.+?)$/m);
    const emailMatch = entry.match(/Email:\s*(.+?)$/m);
    const websiteMatch = entry.match(/Website:\s*(.+?)$/m);
    const addressMatch = entry.match(/Address:\s*(.+?)$/m);
    const contactMatch = entry.match(/Contact:\s*(.+?)$/m);
    
    // Determine levels of care
    const levelsOfCare = [];
    const lowerLevel = levelOfCare.toLowerCase();
    
    if (lowerLevel.includes('residential') || lowerLevel.includes('rtc')) levelsOfCare.push('Residential');
    if (lowerLevel.includes('php') || lowerLevel.includes('partial')) levelsOfCare.push('PHP');
    if (lowerLevel.includes('iop') || lowerLevel.includes('intensive outpatient')) levelsOfCare.push('IOP');
    if (lowerLevel.includes('outpatient') && !lowerLevel.includes('intensive')) levelsOfCare.push('Outpatient');
    if (lowerLevel.includes('detox')) levelsOfCare.push('Detox');
    if (lowerLevel.includes('sober living')) levelsOfCare.push('Sober Living');
    if (lowerLevel.includes('therapeutic boarding') || lowerLevel.includes('boarding school')) levelsOfCare.push('Therapeutic Boarding School');
    if (lowerLevel.includes('virtual') || lowerLevel.includes('online')) levelsOfCare.push('Virtual/Telehealth');
    
    // Determine age group
    let ages = 'Not specified';
    if (lowerLevel.match(/ages?\s+(\d+)[–-](\d+)/)) {
        const match = lowerLevel.match(/ages?\s+(\d+)[–-](\d+)/);
        ages = `${match[1]}-${match[2]}`;
    } else if (lowerLevel.includes('adolescent')) {
        ages = 'Adolescents (12-17)';
    } else if (lowerLevel.includes('young adult')) {
        ages = 'Young Adults (18-25)';
    }
    
    // Determine gender
    let gender = 'Co-ed';
    if (lowerLevel.includes('males only') || lowerLevel.includes('boys') || lowerLevel.includes(' men')) gender = 'Males Only';
    if (lowerLevel.includes('females only') || lowerLevel.includes('girls') || lowerLevel.includes(' women')) gender = 'Females Only';
    
    // Determine primary focus
    let primaryFocus = 'Comprehensive Treatment';
    if (lowerLevel.includes('substance') || lowerLevel.includes('addiction')) primaryFocus = 'Substance Use Disorders';
    if (lowerLevel.includes('mental health')) primaryFocus = 'Mental Health';
    if (lowerLevel.includes('dual diagnosis') || lowerLevel.includes('co-occurring')) primaryFocus = 'Dual Diagnosis';
    if (lowerLevel.includes('trauma')) primaryFocus = 'Trauma/PTSD';
    
    // Extract specializations
    const specializations = [];
    if (lowerLevel.includes('substance') || lowerLevel.includes('addiction')) specializations.push('Substance Use');
    if (lowerLevel.includes('trauma') || lowerLevel.includes('ptsd')) specializations.push('Trauma/PTSD');
    if (lowerLevel.includes('dual diagnosis')) specializations.push('Dual Diagnosis');
    if (lowerLevel.includes('mental health')) specializations.push('Mental Health');
    if (lowerLevel.includes('anxiety')) specializations.push('Anxiety');
    if (lowerLevel.includes('depression')) specializations.push('Depression');
    if (lowerLevel.includes('eating disorder')) specializations.push('Eating Disorders');
    
    // Determine category
    let category = 'other';
    if (levelsOfCare.includes('Residential')) category = 'residential';
    else if (levelsOfCare.includes('Sober Living')) category = 'sober-living';
    else if (levelsOfCare.includes('PHP') || levelsOfCare.includes('IOP')) category = 'outpatient';
    else if (levelsOfCare.includes('Therapeutic Boarding School')) category = 'therapeutic-school';
    else if (levelsOfCare.includes('Virtual/Telehealth')) category = 'virtual';
    
    const program = {
        id: `program_${programId++}`,
        name,
        location: { city, state, distance: null },
        type: levelsOfCare[0] || 'Treatment Program',
        category,
        clinical: {
            levelsOfCare,
            primaryFocus,
            specializations,
            modalities: {
                evidenceBased: [],
                experiential: [],
                holistic: []
            }
        },
        population: {
            ages,
            gender,
            specialPopulations: []
        },
        structure: {
            lengthOfStay: '',
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
            phone: phoneMatch ? phoneMatch[1].trim() : '',
            email: emailMatch ? emailMatch[1].trim() : '',
            contactPerson: contactMatch ? contactMatch[1].trim() : '',
            address: addressMatch ? addressMatch[1].trim() : ''
        },
        website: websiteMatch ? websiteMatch[1].trim() : '',
        quality: {
            accreditations: [],
            memberships: []
        },
        features,
        levelOfCare,
        programCategory: category
    };
    
    programs.push(program);
});

console.log(`✅ Parsed ${programs.length} programs from PROGRAMSRAW`);

// Write to JavaScript file
const output = `// programs-data-complete.js - All Programs from PROGRAMSRAW
// Total Programs: ${programs.length}
// Last Updated: ${new Date().toISOString()}

window.programsData = ${JSON.stringify(programs, null, 2)};

// Save to localStorage
try {
    localStorage.setItem('careconnect_programs', JSON.stringify(window.programsData));
    console.log(\`[Programs] Loaded \${window.programsData.length} programs into storage\`);
} catch (e) {
    console.warn('[Programs] Could not save to localStorage:', e);
}

console.log(\`[Programs] ✅ \${window.programsData.length} programs ready!\`);
`;

fs.writeFileSync('src/js/programs-data-complete.js', output);

console.log(`✅ Wrote src/js/programs-data-complete.js`);
console.log(`📊 File size: ${(output.length / 1024).toFixed(2)} KB`);
console.log(`\n🎉 All ${programs.length} programs ready for CareConnect!`);
