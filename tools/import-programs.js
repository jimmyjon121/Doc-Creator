/**
 * import-programs.js
 * Node script to extract legacy program listings from AppsCode-DeluxeCMS.html
 * and normalize them into the Programs & Docs v2 schema.
 *
 * Usage: node tools/import-programs.js
 */

const fs = require('fs');
const path = require('path');
const { normalizeLegacyPrograms } = require('./programs-v2-schema');

const SOURCE_HTML = path.join(__dirname, '..', 'dist', 'AppsCode-DeluxeCMS.html');
const OUTPUT_JSON = path.join(__dirname, '..', 'dist', 'programs.v2.json');

function readProgramsArray(htmlContent) {
    const match = htmlContent.match(/const programs\s*=\s*\[([\s\S]*?)\];/);
    if (!match) {
        throw new Error('Could not locate "const programs = [...]" definition in AppsCode-DeluxeCMS.html');
    }
    const arrayLiteral = `[${match[1]}]`;
    try {
        return JSON.parse(arrayLiteral);
    } catch (error) {
        throw new Error(`Failed to parse programs array: ${error.message}`);
    }
}

function ensureDirectoryExists(filePath) {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function main() {
    const html = fs.readFileSync(SOURCE_HTML, 'utf8');
    const legacyPrograms = readProgramsArray(html);
    const parentCount = legacyPrograms.length;
    const subProgramCount = legacyPrograms.reduce((total, program) => {
        if (Array.isArray(program.subPrograms)) {
            return total + program.subPrograms.length;
        }
        return total;
    }, 0);

    const { programs, warnings } = normalizeLegacyPrograms(legacyPrograms);

    ensureDirectoryExists(OUTPUT_JSON);
    fs.writeFileSync(OUTPUT_JSON, JSON.stringify(programs, null, 2));

    console.log(`✅ Wrote ${programs.length} normalized programs to ${path.relative(process.cwd(), OUTPUT_JSON)}`);
    console.log(`ℹ️  Source dataset: ${parentCount} parent programs, ${subProgramCount} sub-program entries.`);
    if (warnings.length) {
        console.warn(`⚠️ ${warnings.length} warnings during normalization:`);
        warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Program import failed:', error);
        process.exit(1);
    }
}

