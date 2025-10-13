#!/usr/bin/env node

/**
 * CareConnect Pro - Build System
 * Compiles modular source files into a single distributable HTML file
 * Maintains backward compatibility for clinician deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Build configuration
const CONFIG = {
    version: '4.0.0',
    sourceFile: 'AppsCode-DeluxeCMS.html',
    outputFile: 'dist/CareConnect-Pro.html',
    srcDir: 'src',
    distDir: 'dist',
    buildDate: new Date().toISOString(),
    
    // File mappings for extraction
    cssOutput: {
        animations: 'src/css/animations.css',
        main: 'src/css/main.css',
        components: 'src/css/components.css',
        darkMode: 'src/css/dark-mode.css',
        responsive: 'src/css/responsive.css',
        print: 'src/css/print.css'
    },
    
    jsOutput: {
        config: 'src/js/config.js',
        auth: 'src/js/auth.js',
        encryption: 'src/js/encryption.js',
        storage: 'src/js/storage.js',
        programs: 'src/js/programs.js',
        document: 'src/js/document.js',
        vault: 'src/js/vault.js',
        ui: 'src/js/ui.js',
        utils: 'src/js/utils.js',
        main: 'src/js/main.js'
    }
};

// Command line arguments
const args = process.argv.slice(2);
const isProduction = args.includes('--production');
const isWatch = args.includes('--watch');
const isClean = args.includes('--clean');
const isPackage = args.includes('--package');
const isExtract = args.includes('--extract');

// Utilities
class BuildUtils {
    static log(message, type = 'info') {
        const colors = {
            info: '\x1b[36m',
            success: '\x1b[32m',
            warning: '\x1b[33m',
            error: '\x1b[31m',
            reset: '\x1b[0m'
        };
        
        const icons = {
            info: 'ℹ️ ',
            success: '✅',
            warning: '⚠️ ',
            error: '❌'
        };
        
        console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`);
    }
    
    static ensureDir(dirPath) {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    }
    
    static readFile(filepath) {
        try {
            return fs.readFileSync(filepath, 'utf8');
        } catch (error) {
            this.log(`Failed to read ${filepath}: ${error.message}`, 'error');
            return null;
        }
    }
    
    static writeFile(filepath, content) {
        try {
            this.ensureDir(path.dirname(filepath));
            fs.writeFileSync(filepath, content, 'utf8');
            return true;
        } catch (error) {
            this.log(`Failed to write ${filepath}: ${error.message}`, 'error');
            return false;
        }
    }
    
    static minifyCSS(css) {
        if (!isProduction) return css;
        
        return css
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
            .replace(/\s+/g, ' ')             // Collapse whitespace
            .replace(/:\s+/g, ':')            // Remove spaces after colons
            .replace(/;\s+/g, ';')            // Remove spaces after semicolons
            .replace(/\s*{\s*/g, '{')         // Remove spaces around braces
            .replace(/\s*}\s*/g, '}')
            .replace(/\s*,\s*/g, ',')
            .trim();
    }
    
    static minifyJS(js) {
        if (!isProduction) return js;
        
        // Basic minification - for production, use a real minifier
        return js
            .replace(/\/\/.*$/gm, '')         // Remove single-line comments
            .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
            .replace(/\n\s*\n/g, '\n')        // Remove empty lines
            .replace(/\s+/g, ' ')             // Collapse whitespace
            .trim();
    }
    
    static calculateHash(content) {
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
}

// Main Extractor Class - Splits the monolithic HTML into modules
class SourceExtractor {
    constructor(sourceFile) {
        this.sourceFile = sourceFile;
        this.content = BuildUtils.readFile(sourceFile);
        if (!this.content) {
            throw new Error(`Cannot read source file: ${sourceFile}`);
        }
        
        // Parse the structure
        this.parseStructure();
    }
    
    parseStructure() {
        // Find key boundaries in the HTML file
        const lines = this.content.split('\n');
        
        // Find CSS boundaries
        this.cssStart = lines.findIndex(line => line.includes('<style>')) + 1;
        this.cssEnd = lines.findIndex(line => line.includes('</style>'));
        
        // Find main CSS block (there are multiple style blocks)
        const styleBlocks = [];
        let inStyle = false;
        let currentBlock = [];
        let blockStart = 0;
        
        lines.forEach((line, index) => {
            if (line.includes('<style>')) {
                inStyle = true;
                blockStart = index + 1;
                currentBlock = [];
            } else if (line.includes('</style>')) {
                inStyle = false;
                if (currentBlock.length > 0) {
                    styleBlocks.push({
                        start: blockStart,
                        end: index,
                        content: currentBlock.join('\n')
                    });
                }
            } else if (inStyle) {
                currentBlock.push(line);
            }
        });
        
        this.styleBlocks = styleBlocks;
        
        // Find JavaScript boundary
        this.jsStart = lines.findIndex(line => line.trim() === '<script>') + 1;
        this.jsEnd = lines.findIndex((line, index) => index > this.jsStart && line.trim() === '</script>');
        
        // Find HTML body content
        this.bodyStart = lines.findIndex(line => line.includes('<body>')) + 1;
        this.bodyEnd = lines.findIndex(line => line.includes('</body>'));
        
        BuildUtils.log(`Structure parsed: CSS blocks: ${styleBlocks.length}, JS lines: ${this.jsEnd - this.jsStart}`, 'info');
    }
    
    extractCSS() {
        BuildUtils.log('Extracting CSS modules...', 'info');
        
        // Combine all CSS blocks
        const allCSS = this.styleBlocks.map(block => block.content).join('\n\n');
        
        // Split CSS into logical modules
        const cssModules = {
            animations: this.extractCSSSection(allCSS, 'animations'),
            main: this.extractCSSSection(allCSS, 'main'),
            components: this.extractCSSSection(allCSS, 'components'),
            darkMode: this.extractCSSSection(allCSS, 'dark'),
            responsive: this.extractCSSSection(allCSS, 'responsive'),
            print: this.extractCSSSection(allCSS, 'print')
        };
        
        // Write CSS modules
        Object.entries(cssModules).forEach(([name, content]) => {
            const filepath = CONFIG.cssOutput[name];
            if (BuildUtils.writeFile(filepath, content)) {
                BuildUtils.log(`  ✓ ${name}.css extracted`, 'success');
            }
        });
    }
    
    extractCSSSection(css, sectionType) {
        const sections = {
            animations: /@keyframes[\s\S]*?}\s*}/g,
            main: /\.(?!dark-mode)[\w-]+\s*{[^}]*}/g,
            components: /\.(modal|card|button|form|wizard|panel|header|footer)[\s\S]*?{[^}]*}/g,
            dark: /\.dark-mode[\s\S]*?{[^}]*}|body\.dark[\s\S]*?{[^}]*}/g,
            responsive: /@media[\s\S]*?}\s*}/g,
            print: /@media\s+print[\s\S]*?}\s*}/g
        };
        
        if (sectionType === 'main') {
            // Return everything that's not in other sections
            let mainCSS = css;
            ['animations', 'components', 'dark', 'responsive', 'print'].forEach(type => {
                const regex = sections[type];
                if (regex) {
                    mainCSS = mainCSS.replace(regex, '');
                }
            });
            return mainCSS.trim();
        }
        
        const regex = sections[sectionType];
        if (!regex) return '';
        
        const matches = css.match(regex);
        return matches ? matches.join('\n\n') : '';
    }
    
    extractJavaScript() {
        BuildUtils.log('Extracting JavaScript modules...', 'info');
        
        const lines = this.content.split('\n');
        const jsContent = lines.slice(this.jsStart, this.jsEnd).join('\n');
        
        // Parse JavaScript into logical modules
        const jsModules = {
            config: this.extractJSSection(jsContent, 'config'),
            auth: this.extractJSSection(jsContent, 'auth'),
            encryption: this.extractJSSection(jsContent, 'encryption'),
            storage: this.extractJSSection(jsContent, 'storage'),
            programs: this.extractJSSection(jsContent, 'programs'),
            document: this.extractJSSection(jsContent, 'document'),
            vault: this.extractJSSection(jsContent, 'vault'),
            ui: this.extractJSSection(jsContent, 'ui'),
            utils: this.extractJSSection(jsContent, 'utils'),
            main: this.extractJSSection(jsContent, 'main')
        };
        
        // Write JavaScript modules
        Object.entries(jsModules).forEach(([name, content]) => {
            const filepath = CONFIG.jsOutput[name];
            const moduleContent = this.wrapAsModule(content, name);
            if (BuildUtils.writeFile(filepath, moduleContent)) {
                BuildUtils.log(`  ✓ ${name}.js extracted`, 'success');
            }
        });
    }
    
    extractJSSection(js, sectionType) {
        // This is a simplified extraction - in reality, we'd parse the AST
        const sections = {
            config: /const\s+(MASTER_|LEGACY_|PROGRAMS_|ALUMNI_)[\s\S]*?;/g,
            auth: /function\s+(handleLogin|verifyCredentials|saveUserAccount|hashPassword)[\s\S]*?^}/gm,
            encryption: /function\s+(encrypt|decrypt|generateKey|xorCipher)[\s\S]*?^}/gm,
            storage: /function\s+(saveToLocalStorage|getFromLocalStorage|clearStorage)[\s\S]*?^}/gm,
            programs: /function\s+(loadPrograms|saveProgram|deleteProgram|searchPrograms)[\s\S]*?^}/gm,
            document: /function\s+(generatePDF|downloadDocument|formatDocument)[\s\S]*?^}/gm,
            vault: /function\s+(saveToVault|loadFromVault|deleteFromVault)[\s\S]*?^}/gm,
            ui: /function\s+(showModal|hideModal|updateUI|showNotification)[\s\S]*?^}/gm,
            utils: /function\s+(formatDate|escapeHtml|debounce|throttle)[\s\S]*?^}/gm,
            main: /window\.addEventListener|document\.addEventListener|initializeApp/g
        };
        
        const regex = sections[sectionType];
        if (!regex) return '// Module: ' + sectionType;
        
        const matches = js.match(regex);
        return matches ? matches.join('\n\n') : '// Module: ' + sectionType;
    }
    
    wrapAsModule(content, moduleName) {
        return `/**
 * CareConnect Pro - ${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)} Module
 * Version: ${CONFIG.version}
 * Generated: ${CONFIG.buildDate}
 */

(function(window, document) {
    'use strict';
    
    // Module: ${moduleName}
    const ${moduleName}Module = {
${content.split('\n').map(line => '        ' + line).join('\n')}
    };
    
    // Export to global scope
    window.CareConnect = window.CareConnect || {};
    window.CareConnect.${moduleName} = ${moduleName}Module;
    
})(window, document);
`;
    }
    
    extractHTML() {
        BuildUtils.log('Extracting HTML template...', 'info');
        
        const lines = this.content.split('\n');
        
        // Extract head section
        const headStart = lines.findIndex(line => line.includes('<head>'));
        const headEnd = lines.findIndex(line => line.includes('</head>')) + 1;
        const headContent = lines.slice(headStart, headEnd);
        
        // Remove embedded styles and scripts
        const cleanHead = headContent.filter(line => 
            !line.includes('<style') && 
            !line.includes('</style>') &&
            !line.includes('<script>') &&
            !line.includes('</script>')
        );
        
        // Extract body content
        const bodyContent = lines.slice(this.bodyStart, this.bodyEnd);
        
        // Create clean HTML template
        const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
${cleanHead.join('\n')}
    <!-- BUILD:CSS -->
    <!-- BUILD:EXTERNAL_SCRIPTS -->
</head>
<body>
    <!-- BUILD:BODY -->
${bodyContent.join('\n')}
    <!-- BUILD:JS -->
</body>
</html>`;
        
        if (BuildUtils.writeFile('src/index.html', htmlTemplate)) {
            BuildUtils.log('  ✓ index.html template created', 'success');
        }
    }
}

// Main Builder Class - Combines modules into single file
class Builder {
    constructor() {
        this.startTime = Date.now();
    }
    
    async build() {
        BuildUtils.log('🏗️  Building CareConnect Pro v' + CONFIG.version, 'info');
        BuildUtils.log('─'.repeat(50), 'info');
        
        // Ensure directories exist
        BuildUtils.ensureDir(CONFIG.srcDir);
        BuildUtils.ensureDir(CONFIG.distDir);
        BuildUtils.ensureDir('src/css');
        BuildUtils.ensureDir('src/js');
        BuildUtils.ensureDir('src/data');
        
        // Step 1: Extract if needed or requested
        if (isExtract || !fs.existsSync('src/index.html')) {
            await this.extractSource();
        }
        
        // Step 2: Combine modules
        await this.combineModules();
        
        // Step 3: Create distribution package
        await this.createPackage();
        
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
        BuildUtils.log('─'.repeat(50), 'info');
        BuildUtils.log(`✨ Build completed in ${elapsed}s`, 'success');
        BuildUtils.log(`📦 Output: ${CONFIG.outputFile}`, 'success');
    }
    
    async extractSource() {
        BuildUtils.log('📤 Extracting source modules...', 'info');
        
        try {
            const extractor = new SourceExtractor(CONFIG.sourceFile);
            extractor.extractCSS();
            extractor.extractJavaScript();
            extractor.extractHTML();
            BuildUtils.log('✅ Source extraction complete', 'success');
        } catch (error) {
            BuildUtils.log(`Extraction failed: ${error.message}`, 'error');
            process.exit(1);
        }
    }
    
    async combineModules() {
        BuildUtils.log('📥 Combining modules...', 'info');
        
        // Read template
        let html = BuildUtils.readFile('src/index.html');
        if (!html) {
            // Fallback: use original file
            html = BuildUtils.readFile(CONFIG.sourceFile);
            if (!html) {
                BuildUtils.log('No source files found!', 'error');
                process.exit(1);
            }
        }
        
        // Combine CSS
        const cssFiles = Object.values(CONFIG.cssOutput);
        const combinedCSS = cssFiles
            .map(file => BuildUtils.readFile(file))
            .filter(content => content)
            .join('\n\n');
        
        const minifiedCSS = BuildUtils.minifyCSS(combinedCSS || this.getFallbackCSS());
        
        // Combine JavaScript
        const jsFiles = Object.values(CONFIG.jsOutput);
        const combinedJS = jsFiles
            .map(file => BuildUtils.readFile(file))
            .filter(content => content)
            .join('\n\n');
        
        const minifiedJS = BuildUtils.minifyJS(combinedJS || this.getFallbackJS());
        
        // Get external scripts
        const externalScripts = `
    <!-- PDF Libraries -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>`;
        
        // Replace placeholders
        html = html
            .replace('<!-- BUILD:CSS -->', `<style>\n${minifiedCSS}\n</style>`)
            .replace('<!-- BUILD:EXTERNAL_SCRIPTS -->', externalScripts)
            .replace('<!-- BUILD:JS -->', `<script>\n${minifiedJS}\n</script>`)
            .replace('<!-- BUILD:VERSION -->', CONFIG.version)
            .replace('<!-- BUILD:DATE -->', CONFIG.buildDate);
        
        // Add integrity hash
        const hash = BuildUtils.calculateHash(html);
        html = html.replace('<!-- BUILD:HASH -->', hash);
        
        // Write output
        if (BuildUtils.writeFile(CONFIG.outputFile, html)) {
            const stats = fs.statSync(CONFIG.outputFile);
            const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
            BuildUtils.log(`  ✓ Output file created (${sizeMB} MB)`, 'success');
        }
    }
    
    getFallbackCSS() {
        // Extract CSS from original file if modules don't exist
        const content = BuildUtils.readFile(CONFIG.sourceFile);
        if (!content) return '';
        
        const match = content.match(/<style>([\s\S]*?)<\/style>/);
        return match ? match[1] : '';
    }
    
    getFallbackJS() {
        // Extract JS from original file if modules don't exist
        const content = BuildUtils.readFile(CONFIG.sourceFile);
        if (!content) return '';
        
        const match = content.match(/<script>([\s\S]*?)<\/script>/);
        return match ? match[1] : '';
    }
    
    async createPackage() {
        if (!isPackage) return;
        
        BuildUtils.log('📦 Creating distribution package...', 'info');
        
        // Copy Chrome extension
        const extensionSource = 'chrome-extension-enhanced';
        const extensionDest = path.join(CONFIG.distDir, 'chrome-extension');
        
        if (fs.existsSync(extensionSource)) {
            this.copyDirectory(extensionSource, extensionDest);
            BuildUtils.log('  ✓ Chrome extension copied', 'success');
        }
        
        // Create README for clinicians
        const readme = this.createReadme();
        BuildUtils.writeFile(path.join(CONFIG.distDir, 'README.txt'), readme);
        BuildUtils.log('  ✓ README created', 'success');
        
        // Create ZIP package
        // Note: Requires additional npm package for zipping
        BuildUtils.log('  ✓ Distribution package ready in dist/', 'success');
    }
    
    copyDirectory(source, destination) {
        BuildUtils.ensureDir(destination);
        
        const files = fs.readdirSync(source);
        files.forEach(file => {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            
            if (fs.statSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }
    
    createReadme() {
        return `
================================================================================
                    CareConnect Pro - Installation Guide
                              Version ${CONFIG.version}
================================================================================

FOR CLINICIANS - SUPER SIMPLE SETUP!
====================================

Step 1: Open the Application
-----------------------------
• Double-click "CareConnect-Pro.html"
• It will open in your default browser
• That's it! No installation needed.

Step 2: Login
-------------
• Username: Doc121
• Password: FFA121
• Or use credentials provided by your administrator

Step 3: Install Chrome Extension (Optional but Recommended)
-----------------------------------------------------------
1. Open Chrome browser
2. Type in address bar: chrome://extensions/
3. Turn on "Developer mode" (toggle in top right)
4. Click "Load unpacked" button
5. Select the "chrome-extension" folder
6. Done! The extension icon will appear in your toolbar

SYSTEM REQUIREMENTS
==================
• Any modern browser (Chrome, Edge, Firefox, Safari)
• Works on Windows, Mac, and Linux
• No internet connection required (except for Chrome extension data extraction)
• Minimum 4GB RAM recommended
• 100MB free disk space

TROUBLESHOOTING
==============
• If the page doesn't load: Try a different browser
• If login fails: Check caps lock is off
• If extension doesn't work: Refresh the page and try again
• For other issues: Contact your IT administrator

FEATURES
========
• Create aftercare documents
• Generate discharge packets
• Manage treatment program database
• Extract data from program websites (with Chrome extension)
• HIPAA compliant - all data stored locally
• Auto-save every 30 seconds
• Dark mode available

SUPPORT
=======
For technical support, contact your system administrator.
For clinical questions, contact your supervisor.

================================================================================
Built with care by Family First Adolescent Services
Build Date: ${CONFIG.buildDate}
================================================================================
`;
    }
    
    async clean() {
        BuildUtils.log('🧹 Cleaning build artifacts...', 'info');
        
        if (fs.existsSync(CONFIG.distDir)) {
            fs.rmSync(CONFIG.distDir, { recursive: true, force: true });
            BuildUtils.log('  ✓ Dist directory cleaned', 'success');
        }
        
        BuildUtils.log('✨ Clean complete', 'success');
    }
    
    async watch() {
        BuildUtils.log('👁️  Watching for changes...', 'info');
        
        const chokidar = require('chokidar');
        
        const watcher = chokidar.watch(['src/**/*', CONFIG.sourceFile], {
            ignored: /node_modules/,
            persistent: true
        });
        
        watcher
            .on('change', async (path) => {
                BuildUtils.log(`File changed: ${path}`, 'warning');
                await this.build();
            })
            .on('error', error => BuildUtils.log(`Watch error: ${error}`, 'error'));
        
        // Initial build
        await this.build();
        
        BuildUtils.log('Press Ctrl+C to stop watching', 'info');
    }
}

// Main execution
async function main() {
    const builder = new Builder();
    
    try {
        if (isClean) {
            await builder.clean();
        } else if (isWatch) {
            await builder.watch();
        } else {
            await builder.build();
        }
    } catch (error) {
        BuildUtils.log(`Build failed: ${error.message}`, 'error');
        console.error(error.stack);
        process.exit(1);
    }
}

// Run if executed directly
if (require.main === module) {
    main();
}

module.exports = { Builder, SourceExtractor, BuildUtils };
