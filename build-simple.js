#!/usr/bin/env node

/**
 * Simple Build System for CareConnect Pro
 * Maintains the original file for distribution while enabling modular development
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const CONFIG = {
    version: '4.0.0',
    originalFile: 'AppsCode-DeluxeCMS.html',
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
        
        // Step 6: Create package
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
    
    applyEnhancements(content) {
        console.log('[ENHANCE] Applying enhancements...');
        
        // Look for enhancement files
        const enhancementFiles = [
            'styles.css',
            'scripts.js',
            'bugfixes.js',
            'features.js',
            'coach-profiles.js',
            'login-fix.js',
            'programs-fix.js'
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
        
        // Copy Chrome extension
        const extensionSource = 'chrome-extension-enhanced';
        const extensionDest = path.join(CONFIG.distDir, 'chrome-extension');
        
        if (fs.existsSync(extensionSource)) {
            this.copyDirectory(extensionSource, extensionDest);
            console.log('  [OK] Chrome extension included');
        }
        
        // Create README
        const readme = `
================================================================================
                    CARECONNECT PRO - VERSION ${CONFIG.version}
================================================================================

INSTALLATION FOR CLINICIANS
===========================

Step 1: Open the Application
-----------------------------
- Double-click "CareConnect-Pro.html"
- It opens in your browser automatically
- No installation needed!

Step 2: Login
-------------
- Username: Doc121
- Password: FFA121

Step 3: Chrome Extension (Optional)
------------------------------------
1. Open Chrome
2. Go to: chrome://extensions/
3. Turn on "Developer mode"
4. Click "Load unpacked"
5. Select the "chrome-extension" folder

THAT'S IT! You're ready to create documents.

================================================================================

FEATURES
========
- Create aftercare documents
- Generate PDF discharge packets  
- Extract data from program websites
- HIPAA compliant (local storage only)
- Auto-save every 30 seconds
- Dark mode available
- Works offline

TROUBLESHOOTING
==============
- Can't login? Check CAPS LOCK is off
- Extension not working? Refresh the page
- Need help? Contact your IT support

================================================================================
Build Date: ${new Date().toISOString()}
================================================================================
`;
        
        fs.writeFileSync(path.join(CONFIG.distDir, 'README.txt'), readme);
        console.log('  [OK] README created');
        
        // Create a simple batch file for Windows users
        const batchFile = `@echo off
echo Starting CareConnect Pro...
start CareConnect-Pro.html
exit`;
        
        fs.writeFileSync(path.join(CONFIG.distDir, 'Start-CareConnect.bat'), batchFile);
        console.log('  [OK] Windows launcher created');
        
        // Create a simple shell script for Mac/Linux users
        const shellScript = `#!/bin/bash
echo "Starting CareConnect Pro..."
open CareConnect-Pro.html 2>/dev/null || xdg-open CareConnect-Pro.html 2>/dev/null || echo "Please open CareConnect-Pro.html in your browser"`;
        
        fs.writeFileSync(path.join(CONFIG.distDir, 'Start-CareConnect.sh'), shellScript);
        fs.chmodSync(path.join(CONFIG.distDir, 'Start-CareConnect.sh'), '755');
        console.log('  [OK] Mac/Linux launcher created');
    }
    
    copyDirectory(source, destination) {
        if (!fs.existsSync(destination)) {
            fs.mkdirSync(destination, { recursive: true });
        }
        
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
}

// Create enhancement examples if they don't exist
function createEnhancementExamples() {
    const enhancementsDir = 'enhancements';
    
    if (!fs.existsSync(enhancementsDir)) {
        fs.mkdirSync(enhancementsDir);
        
        // Example CSS enhancement
        fs.writeFileSync(path.join(enhancementsDir, 'styles.css'), `
/* Custom Enhancements - Add your custom styles here */

/* Example: Make buttons more prominent */
.btn-primary {
    font-size: 16px !important;
    padding: 15px 30px !important;
}

/* Example: Custom branding color 
:root {
    --brand-color: #0099cc;
}
*/
`);
        
        // Example JS enhancement
        fs.writeFileSync(path.join(enhancementsDir, 'features.js'), `
// Custom Features - Add your custom JavaScript here

// Example: Add a custom keyboard shortcut
/*
document.addEventListener('keydown', function(e) {
    // Ctrl+Shift+S to quick save
    if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        console.log('Quick save triggered!');
        // Add your save logic here
    }
});
*/

// Example: Add custom logging
console.log('CareConnect Pro - Enhanced Version Loaded');
`);
        
        // Bugfix file
        fs.writeFileSync(path.join(enhancementsDir, 'bugfixes.js'), `
// Bugfixes - Add fixes for known issues here

// Example: Fix for connection error in Chrome extension
/*
if (window.chrome && chrome.runtime) {
    // Add any Chrome extension fixes here
}
*/
`);
        
        console.log('[INFO] Created enhancement examples in enhancements/ folder');
    }
}

// Main execution
if (require.main === module) {
    createEnhancementExamples();
    const builder = new SimpleBuilder();
    builder.build();
}

module.exports = SimpleBuilder;
