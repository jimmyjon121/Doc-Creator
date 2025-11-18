/**
 * report-programs.js
 * Generates a validation report for the normalized programs.v2.json dataset.
 *
 * Usage: node tools/report-programs.js
 */

const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'dist', 'programs.v2.json');
const REPORT_FILE = path.join(__dirname, '..', 'dist', 'programs.v2.report.json');

function loadPrograms() {
    if (!fs.existsSync(DATA_FILE)) {
        throw new Error(`Missing normalized dataset at ${DATA_FILE}. Run tools/import-programs.js first.`);
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function buildReport(programs) {
    const totals = {
        programs: programs.length,
        networkParents: 0,
        networkChildren: 0
    };
    const countsByState = {};
    const countsByFocus = {};
    const duplicates = [];
    const seen = new Map();

    programs.forEach(program => {
        const state = program.location?.state || 'Unknown';
        countsByState[state] = (countsByState[state] || 0) + 1;

        const focus = program.focus || 'Unspecified';
        countsByFocus[focus] = (countsByFocus[focus] || 0) + 1;

        if (Array.isArray(program.flags)) {
            if (program.flags.includes('network-parent')) totals.networkParents += 1;
            if (program.flags.includes('network-child')) totals.networkChildren += 1;
        }

        const duplicateKey = `${program.name}|${state}`;
        if (seen.has(duplicateKey)) {
            const existing = seen.get(duplicateKey);
            if (!existing.ids.includes(program.id)) {
                existing.ids.push(program.id);
                existing.count += 1;
            }
        } else {
            seen.set(duplicateKey, { name: program.name, state, ids: [program.id], count: 1 });
        }
    });

    seen.forEach(entry => {
        if (entry.count > 1) {
            duplicates.push(entry);
        }
    });

    return {
        totals,
        countsByState,
        countsByFocus,
        duplicates
    };
}

function writeReport(report) {
    fs.writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2));
    return REPORT_FILE;
}

function main() {
    const programs = loadPrograms();
    const report = buildReport(programs);
    const outputPath = writeReport(report);
    console.log(`✅ Validation report written to ${path.relative(process.cwd(), outputPath)}`);
    console.table(report.totals);
    console.log('States:', report.countsByState);
    if (report.duplicates.length) {
        console.warn('⚠️ Potential duplicates detected:', report.duplicates);
    } else {
        console.log('✅ No potential duplicates detected.');
    }
}

if (require.main === module) {
    try {
        main();
    } catch (error) {
        console.error('❌ Report generation failed:', error);
        process.exit(1);
    }
}



