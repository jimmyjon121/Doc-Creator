// extract-programs.js - Extract all programs from AppsCode-DeluxeCMS.html

const fs = require('fs');

console.log('📊 Extracting programs from AppsCode-DeluxeCMS.html...\n');

const html = fs.readFileSync('AppsCode-DeluxeCMS.html', 'utf8');

// Find the programs array
const programsMatch = html.match(/const programs = \[([\s\S]*?)\];[\s\S]*?\/\/ Initialize/);

if (!programsMatch) {
    console.error('❌ Could not find programs array');
    process.exit(1);
}

const programsCode = 'const programs = [' + programsMatch[1] + '];';

// Evaluate the code to get the actual array
const programs = eval(programsCode);

console.log(`✅ Found ${programs.length} programs`);

// Convert to new format
const convertedPrograms = programs.map(prog => {
    // Parse location
    const locationParts = (prog.location || '').split(',').map(s => s.trim());
    const city = locationParts[0] || '';
    const state = locationParts[1] || '';
    
    // Parse level of care
    const levelsOfCare = [];
    const levelText = (prog.levelOfCare || '').toLowerCase();
    
    if (levelText.includes('residential') || levelText.includes('rtc')) levelsOfCare.push('Residential');
    if (levelText.includes('php') || levelText.includes('partial')) levelsOfCare.push('PHP');
    if (levelText.includes('iop') || levelText.includes('intensive outpatient')) levelsOfCare.push('IOP');
    if (levelText.includes('outpatient') && !levelText.includes('intensive')) levelsOfCare.push('Outpatient');
    if (levelText.includes('detox')) levelsOfCare.push('Detox');
    if (levelText.includes('sober living')) levelsOfCare.push('Sober Living');
    if (levelText.includes('therapeutic boarding') || levelText.includes('boarding school')) levelsOfCare.push('Therapeutic Boarding School');
    
    // Extract age info
    let ages = 'Not specified';
    if (levelText.includes('adolescent')) ages = 'Adolescents (12-17)';
    if (levelText.includes('young adult')) ages = 'Young Adults (18-25)';
    if (levelText.match(/ages?\s+(\d+)[-–](\d+)/)) {
        const match = levelText.match(/ages?\s+(\d+)[-–](\d+)/);
        ages = `Ages ${match[1]}-${match[2]}`;
    }
    
    // Extract gender
    let gender = 'Co-ed';
    if (levelText.includes('males') || levelText.includes('boys') || levelText.includes('men')) gender = 'Males Only';
    if (levelText.includes('females') || levelText.includes('girls') || levelText.includes('women')) gender = 'Females Only';
    
    return {
        id: prog.id,
        name: prog.name,
        location: { city, state, distance: null },
        type: prog.type,
        category: prog.category,
        clinical: {
            levelsOfCare,
            primaryFocus: prog.category === 'residential' ? 'Comprehensive Treatment' : 
                         prog.category === 'sober-living' ? 'Recovery Support' : 
                         'Outpatient Services',
            specializations: [],
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
            phone: prog.contact?.phone || '',
            email: prog.contact?.email || '',
            contactPerson: prog.contact?.contactPerson || '',
            address: prog.contact?.address || ''
        },
        website: prog.contact?.website || '',
        quality: {
            accreditations: [],
            memberships: []
        },
        features: prog.features || [],
        levelOfCare: prog.levelOfCare,
        programCategory: prog.programCategory
    };
});

console.log(`✅ Converted ${convertedPrograms.length} programs to new format`);

// Write to file
const output = `// programs-data-full.js - Complete programs database extracted from AppsCode-DeluxeCMS
// Total Programs: ${convertedPrograms.length}
// Last Updated: ${new Date().toISOString()}

window.programsData = ${JSON.stringify(convertedPrograms, null, 2)};

// Save to localStorage
try {
    localStorage.setItem('careconnect_programs', JSON.stringify(window.programsData));
    console.log(\`[Programs] Loaded \${window.programsData.length} programs into storage\`);
} catch (e) {
    console.warn('[Programs] Could not save to localStorage:', e);
}

console.log(\`[Programs] Database ready with \${window.programsData.length} programs\`);
`;

fs.writeFileSync('src/js/programs-data-full.js', output);

console.log(`✅ Wrote src/js/programs-data-full.js`);
console.log(`📊 File size: ${(output.length / 1024).toFixed(2)} KB`);
console.log(`\n🎉 Programs extraction complete!`);
