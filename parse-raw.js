// parse-raw.js - Parse PROGRAMSRAW into CareConnect format

const fs = require('fs');

console.log('📊 Parsing PROGRAMSRAW...\n');

const raw = fs.readFileSync('PROGRAMSRAW', 'utf8');
const lines = raw.split('\n');

const programs = [];
let current = null;
let section = null;

for (const line of lines) {
    const trimmed = line.trim();
    
    // New program starts with "Name – Location"
    if (trimmed.match(/^[A-Z].+ – .+$/)) {
        if (current) programs.push(current);
        
        const [name, location] = trimmed.split(' – ').map(s => s.trim());
        const [city, state] = location.split(',').map(s => s.trim());
        
        current = {
            id: `prog_${programs.length + 1}`,
            name,
            location: { city: city || location, state: state || '' },
            levelOfCare: '',
            features: [],
            contact: {}
        };
        section = null;
    }
    
    if (!current) continue;
    
    // Section headers
    if (trimmed === 'Level of Care & Services Provided:') { section = 'level'; continue; }
    if (trimmed.includes('Program Details')) { section = 'features'; continue; }
    if (trimmed === 'Contact Information:') { section = 'contact'; continue; }
    
    // Content parsing
    if (section === 'level' && trimmed && !trimmed.includes(':')) {
        current.levelOfCare += (current.levelOfCare ? ' ' : '') + trimmed;
    }
    
    if (section === 'features' && trimmed.startsWith('•')) {
        current.features.push(trimmed.substring(1).trim());
    }
    
    if (section === 'contact') {
        if (trimmed.startsWith('Contact:')) current.contact.person = trimmed.substring(8).trim();
        if (trimmed.startsWith('Phone:')) current.contact.phone = trimmed.substring(6).trim();
        if (trimmed.startsWith('Email:')) current.contact.email = trimmed.substring(6).trim();
        if (trimmed.startsWith('Website:')) current.contact.website = trimmed.substring(8).trim();
        if (trimmed.startsWith('Address:')) current.contact.address = trimmed.substring(8).trim();
        if (trimmed.startsWith('Location:')) {
            const [c, s] = trimmed.substring(9).trim().split(',').map(x => x.trim());
            if (c) current.location.city = c;
            if (s) current.location.state = s;
        }
    }
}

if (current) programs.push(current);

console.log(`✅ Parsed ${programs.length} programs\n`);

// Convert to CareConnect format
const final = programs.map(p => {
    const lc = (p.levelOfCare || '').toLowerCase();
    
    const levels = [];
    if (lc.includes('residential') || lc.includes('rtc')) levels.push('Residential');
    if (lc.includes('php') || lc.includes('partial')) levels.push('PHP');
    if (lc.includes('iop') || lc.includes('intensive outpatient')) levels.push('IOP');
    if (lc.includes('outpatient') && !lc.includes('intensive')) levels.push('Outpatient');
    if (lc.includes('detox')) levels.push('Detox');
    if (lc.includes('sober living')) levels.push('Sober Living');
    if (lc.includes('boarding school')) levels.push('Therapeutic Boarding School');
    if (lc.includes('virtual')) levels.push('Virtual/Telehealth');
    
    let ages = 'Not specified';
    if (lc.match(/ages?\s+(\d+)[–-](\d+)/)) {
        const m = lc.match(/ages?\s+(\d+)[–-](\d+)/);
        ages = `${m[1]}-${m[2]}`;
    } else if (lc.includes('adolescent')) ages = 'Adolescents (12-17)';
    else if (lc.includes('young adult')) ages = 'Young Adults (18-25)';
    
    let gender = 'Co-ed';
    if (lc.includes('males') || lc.includes('boys') || lc.includes(' men')) gender = 'Males Only';
    if (lc.includes('females') || lc.includes('girls') || lc.includes(' women')) gender = 'Females Only';
    
    return {
        id: p.id,
        name: p.name,
        location: p.location,
        clinical: {
            levelsOfCare: levels,
            primaryFocus: lc.includes('substance') ? 'Substance Use' : lc.includes('mental') ? 'Mental Health' : 'Comprehensive',
            specializations: []
        },
        population: { ages, gender, specialPopulations: [] },
        contact: {
            phone: p.contact.phone || '',
            email: p.contact.email || '',
            contactPerson: p.contact.person || '',
            address: p.contact.address || ''
        },
        website: p.contact.website || '',
        features: p.features,
        levelOfCare: p.levelOfCare
    };
});

const output = `window.programsData = ${JSON.stringify(final, null, 2)};
localStorage.setItem('careconnect_programs', JSON.stringify(window.programsData));
console.log('[Programs] Loaded ' + window.programsData.length + ' programs');`;

fs.writeFileSync('src/js/programs-complete.js', output);

console.log(`✅ Created programs-complete.js with ${final.length} programs`);
console.log(`📊 Size: ${(output.length / 1024).toFixed(2)} KB\n`);
console.log('🎉 Ready to integrate!');
