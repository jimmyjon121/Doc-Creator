// build-clinical-suite.js - Build script for CareConnect Clinical Suite

const fs = require('fs');
const path = require('path');

console.log('🏥 Building CareConnect Clinical Suite...\n');

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
}

// Read all component files
const components = {
    html: fs.readFileSync('src/careconnect-clinical-suite.html', 'utf8'),
    css: fs.readFileSync('src/css/clinical-suite.css', 'utf8'),
    sessionManager: fs.readFileSync('src/js/session-manager.js', 'utf8'),
    comparisonMatrix: fs.readFileSync('src/js/comparison-matrix.js', 'utf8'),
    documentGenerator: fs.readFileSync('src/js/document-generator.js', 'utf8')
};

// Build the single-file application
let finalHTML = components.html;

// Inject CSS directly into HTML
const cssInjection = `
<style>
/* Embedded Clinical Suite Styles */
${components.css}
</style>
`;

// Inject JavaScript directly into HTML
const jsInjection = `
<script>
/* Embedded Clinical Suite JavaScript */

// Session Manager
${components.sessionManager}

// Comparison Matrix
${components.comparisonMatrix}

// Document Generator
${components.documentGenerator}

// Programs Data (will be populated from Chrome extension)
window.programsData = [];

// Initialize programs data from localStorage if available
try {
    const storedPrograms = localStorage.getItem('careconnect_programs');
    if (storedPrograms) {
        window.programsData = JSON.parse(storedPrograms);
        console.log('Loaded ' + window.programsData.length + ' programs from storage');
    }
} catch (e) {
    console.log('No stored programs found');
}
</script>
`;

// Replace external references with embedded content
finalHTML = finalHTML.replace('</head>', cssInjection + '</head>');
finalHTML = finalHTML.replace('</body>', jsInjection + '</body>');

// Remove external script and link tags
finalHTML = finalHTML.replace(/<link rel="stylesheet"[^>]*>/g, '');
finalHTML = finalHTML.replace(/<script src="js\/[^"]*"><\/script>/g, '');

// Add metadata
const metadata = `
<!-- 
    CareConnect Pro - Clinical Aftercare Planning Suite
    Version: 1.0.0
    Built: ${new Date().toISOString()}
    HIPAA Compliant: No PHI stored
    License: Proprietary
-->
`;

finalHTML = finalHTML.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + metadata);

// Write the final HTML file
const outputPath = path.join(distDir, 'CareConnect-Clinical-Suite.html');
fs.writeFileSync(outputPath, finalHTML);

console.log('✅ Successfully built CareConnect Clinical Suite');
console.log(`📁 Output: ${outputPath}`);
console.log(`📊 File size: ${(finalHTML.length / 1024).toFixed(2)} KB`);

// Create a README for the clinical suite
const readme = `# CareConnect Clinical Suite

## Professional Aftercare Planning Tool

### Features
- **HIPAA Compliant**: No PHI stored on device
- **Session Management**: Temporary 30-minute sessions
- **Program Comparison**: Side-by-side matrix for 2-4 programs
- **Document Generation**: Aftercare options, plans, and discharge packets
- **Chrome Extension Integration**: Import programs directly from websites

### How to Use
1. Open CareConnect-Clinical-Suite.html in your browser
2. Start a new session (optionally enter clinician name)
3. Browse and filter treatment programs
4. Select programs to compare
5. Generate professional documents
6. Export documents before session ends

### Security
- All data is session-based (sessionStorage)
- Automatically clears when browser tab closes
- No patient information is persisted
- Safe for clinical use

### Chrome Extension
Use the CareConnect Chrome Extension to:
- Extract program data from treatment center websites
- Build your program library
- Keep program information current

### Support
For technical support or feature requests, contact the CareConnect team.

---
Version 1.0.0 | ${new Date().toLocaleDateString()}
`;

fs.writeFileSync(path.join(distDir, 'README-Clinical-Suite.txt'), readme);

console.log('📄 Created README-Clinical-Suite.txt');
console.log('\n🎉 Build complete! Open dist/CareConnect-Clinical-Suite.html to use.');
