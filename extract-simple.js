const fs = require('fs');

const html = fs.readFileSync('AppsCode-DeluxeCMS.html', 'utf8');

// Find start and end of programs array
const start = html.indexOf('const programs = [');
const searchFrom = start + 100;
let bracketCount = 0;
let inString = false;
let end = start;

// Manually find the matching closing bracket
for (let i = searchFrom; i < html.length; i++) {
    const char = html[i];
    
    if (char === '"' || char === "'") {
        inString = !inString;
    }
    
    if (!inString) {
        if (char === '[') bracketCount++;
        if (char === ']') {
            bracketCount--;
            if (bracketCount === -1) {
                end = i + 2; // Include ];
                break;
            }
        }
    }
}

const programsCode = html.substring(start, end);

console.log(`Extracted ${programsCode.length} characters`);
console.log('Saving...');

fs.writeFileSync('programs-extracted.txt', programsCode);

console.log('✅ Saved to programs-extracted.txt');
console.log('Now manually review and format');
