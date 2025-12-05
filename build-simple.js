#!/usr/bin/env node

/**
 * Simple Build System for CareConnect Pro
 * Maintains the original file for distribution while enabling modular development
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG = {
    version: '13.0.0-beta.1',
    originalFile: 'CURRENT-VERSION-v12/CareConnect-Pro.html',
    outputFile: 'dist/CareConnect-Pro.html',
    enhancementsDir: 'enhancements',
    distDir: 'dist'
};

class SimpleBuilder {
    constructor() {
        console.log('[BUILD] CareConnect Pro Builder v4.0');
        console.log('─'.repeat(50));
    }
    
    build() {
        // Step 1: Ensure directories
        this.ensureDirectories();
        
        // Step 2: Copy original file
        console.log('[COPY] Copying original application...');
        const content = fs.readFileSync(CONFIG.originalFile, 'utf8');
        
        // Step 3: Apply enhancements if they exist
        let enhanced = content;
        if (fs.existsSync(CONFIG.enhancementsDir)) {
            enhanced = this.applyEnhancements(enhanced);
        }
        
        // Step 4: Update version and build info
        enhanced = this.updateBuildInfo(enhanced);
        
        // Step 5: Write output
        fs.writeFileSync(CONFIG.outputFile, enhanced);
        
        // Step 6: Copy required JS files to dist
        this.copyRequiredFiles();
        
        // Step 7: Create package
        this.createPackage();
        
        const stats = fs.statSync(CONFIG.outputFile);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        
        console.log('─'.repeat(50));
        console.log('[SUCCESS] Build complete!');
        console.log(`[OUTPUT] ${CONFIG.outputFile} (${sizeMB} MB)`);
        console.log('[READY] Ready for distribution to clinicians!');
    }
    
    ensureDirectories() {
        [CONFIG.distDir, CONFIG.enhancementsDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
    
    copyRequiredFiles() {
        console.log('[COPY] Copying required JavaScript files...');
        
        // Copy Programs & Docs module file from CURRENT-VERSION-v12 to dist
        const moduleFile = 'CURRENT-VERSION-v12/programs-docs-module.html';
        if (fs.existsSync(moduleFile)) {
            const moduleDest = path.join(CONFIG.distDir, 'programs-docs-module.html');
            fs.copyFileSync(moduleFile, moduleDest);
            console.log(`  [OK] Copied ${moduleFile} as programs-docs-module.html`);
        }
        
        // Copy Map 2.0 bundle to dist
        const mapV2Source = 'CURRENT-VERSION-v12/map-v2-dist';
        const mapV2Dest = path.join(CONFIG.distDir, 'map-v2-dist');
        if (fs.existsSync(mapV2Source)) {
            this.copyDirectory(mapV2Source, mapV2Dest);
            console.log('  [OK] Copied map-v2-dist folder');
        }
        
        // List of JS files that need to be in dist
        const requiredFiles = [
            'indexed-db-manager.js',
            'client-manager.js',
            'tracker-engine.js',
            'tracker-timeline.js',
            'tracker-bulk-update.js',
            'tracker-aftercare-cascade.js',
            'houses-manager.js',
            'milestones-manager.js',
            'aftercare-manager.js',
            'dashboard-manager.js',
            'dashboard-widgets.js',
            'dashboard-diagnostics.js',
            'cm-tracker-export.js',
            'discharge-checklist.js',
            'document-generator.js',
            'service-worker.js'
        ];
        
        // Copy each file if it exists
        requiredFiles.forEach(file => {
            const sourcePath = path.join('.', file);
            const destPath = path.join(CONFIG.distDir, file);
            
            if (fs.existsSync(sourcePath)) {
                fs.copyFileSync(sourcePath, destPath);
                console.log(`  [OK] Copied ${file}`);
            } else {
                console.log(`  [SKIP] ${file} not found`);
            }
        });
        
        // Copy libs folder if it exists
        const libsSource = './libs';
        const libsDest = path.join(CONFIG.distDir, 'libs');
        if (fs.existsSync(libsSource)) {
            this.copyDirectory(libsSource, libsDest);
            console.log('  [OK] Copied libs folder');
        }

        // Copy onboarding assets
        const onboardingSource = './onboarding';
        const onboardingDest = path.join(CONFIG.distDir, 'onboarding');
        if (fs.existsSync(onboardingSource)) {
            this.copyDirectory(onboardingSource, onboardingDest);
            console.log('  [OK] Copied onboarding assets');
        }
    }
    
    applyEnhancements(content) {
        console.log('[ENHANCE] Applying enhancements...');
        
        // Look for enhancement files
        const enhancementFiles = [
            'styles.css',
            'unified-design.css',
            'global-helpers.js',
            'event-system.js',
            'bugfixes.js',
            'features.js',
            'coach-profiles.js',
            'login-fix.js',
            'tracker-ui.css',
            'tracker-ui.js',
            'tracker-timeline.css',
            'tracker-bulk-update.css',
            'tracker-compliance-widget.js',
            'tracker-compliance-widget.css',
            'tracker-document-hub.js',
            'tracker-document-hub.css',
            'tracker-aftercare-cascade.css',
            'discharge-checklist.css',
            'discharge-checklist.js',
            'missions-redesign.css',
            'missions-redesign.js',
            'morning-review.css',
            'morning-review.js',
            'quick-actions-complete.js',
            'document-generator-ui.js',
            'client-document-storage.js',
            'document-vault-ui.js',
            'empty-states-errors.js',
            'alert-actionability.js',
            'tracker-completion-enhancement.js',
            'client-data-validation.js',
            'discharge-packet-integration.js',
            'widget-rendering-optimization.js',
            'indexeddb-optimization.js'
        ].map(f => path.join(CONFIG.enhancementsDir, f));
        
        enhancementFiles.forEach(file => {
            if (fs.existsSync(file)) {
                const enhancement = fs.readFileSync(file, 'utf8');
                const filename = path.basename(file);
                
                if (filename.endsWith('.css')) {
                    // Inject CSS before the FIRST closing </style>
                    const injection = `\n/* Enhancement: ${filename} */\n${enhancement}\n`;
                    content = content.replace('</style>', injection + '</style>');
                    console.log(`  [OK] Applied ${filename}`);
                } else if (filename.endsWith('.js')) {
                    // Find a script block to inject into (preferably one with login-related code)
                    const scriptRegex = /<script>[\s\S]*?\/\/ Enhanced Login System[\s\S]*?<\/script>/;
                    const fallbackRegex = /<script>[\s\S]*?sessionStorage[\s\S]*?<\/script>/;
                    const anyScriptRegex = /<script>[\s\S]+?<\/script>/;
                    
                    let matched = false;
                    const injection = `\n// Enhancement: ${filename}\n${enhancement}\n`;
                    
                    // Try to find the enhanced login script block
                    if (scriptRegex.test(content)) {
                        content = content.replace(scriptRegex, (match) => {
                            return match.replace('</script>', injection + '</script>');
                        });
                        matched = true;
                    }
                    // Fallback to any script with sessionStorage
                    else if (fallbackRegex.test(content)) {
                        content = content.replace(fallbackRegex, (match) => {
                            return match.replace('</script>', injection + '</script>');
                        });
                        matched = true;
                    }
                    // Last resort: inject into the first script block
                    else if (anyScriptRegex.test(content)) {
                        content = content.replace(anyScriptRegex, (match) => {
                            return match.replace('</script>', injection + '</script>');
                        });
                        matched = true;
                    }
                    
                    if (matched) {
                        console.log(`  [OK] Applied ${filename}`);
                    }
                }
            }
        });
        
        return content;
    }
    
    updateBuildInfo(content) {
        console.log('[INFO] Updating build information...');
        
        const buildDate = new Date().toISOString();
        const buildHash = crypto.createHash('sha256')
            .update(content)
            .digest('hex')
            .substring(0, 8);
        
        // Update version in title
        content = content.replace(
            /<title>.*?<\/title>/,
            `<title>CareConnect Pro v${CONFIG.version} - Professional Aftercare Document Builder</title>`
        );
        
        // Add build info comment
        const buildInfo = `
<!-- 
    CareConnect Pro v${CONFIG.version}
    Build Date: ${buildDate}
    Build Hash: ${buildHash}
    Copyright (c) Family First Adolescent Services
-->
`;
        content = content.replace('<!DOCTYPE html>', `<!DOCTYPE html>${buildInfo}`);
        
        return content;
    }
    
    createPackage() {
        console.log('[PACKAGE] Creating distribution package...');
        
        // Create README
        const readme = `# CareConnect Pro v${CONFIG.version}

Built on ${new Date().toLocaleString()}
`;
        fs.writeFileSync(path.join(CONFIG.distDir, 'README.md'), readme);
        
        // Copy package.json if it exists
        const packageJsonSource = './package.json';
        const packageJsonDest = path.join(CONFIG.distDir, 'package.json');
        if (fs.existsSync(packageJsonSource)) {
            fs.copyFileSync(packageJsonSource, packageJsonDest);
            console.log('  [OK] Copied package.json');
        }
        
        // Copy LICENSE if it exists
        const licenseSource = './LICENSE';
        const licenseDest = path.join(CONFIG.distDir, 'LICENSE');
        if (fs.existsSync(licenseSource)) {
            fs.copyFileSync(licenseSource, licenseDest);
            console.log('  [OK] Copied LICENSE');
        }
        
        // Packaging note: Skip recursive copy of dist into itself to prevent path explosion
    }
    
    copyDirectory(source, destination) {
        fs.mkdirSync(destination, { recursive: true });
        const files = fs.readdirSync(source);
        files.forEach(file => {
            const sourcePath = path.join(source, file);
            const destPath = path.join(destination, file);
            if (fs.lstatSync(sourcePath).isDirectory()) {
                this.copyDirectory(sourcePath, destPath);
            } else {
                fs.copyFileSync(sourcePath, destPath);
            }
        });
    }
}

const builder = new SimpleBuilder();
builder.build();
