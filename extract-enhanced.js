#!/usr/bin/env node

/**
 * Enhanced Extraction System for CareConnect Pro
 * Properly extracts and organizes code from the monolithic HTML file
 */

const fs = require('fs');
const path = require('path');

class EnhancedExtractor {
    constructor() {
        this.sourceFile = 'AppsCode-DeluxeCMS.html';
        this.content = fs.readFileSync(this.sourceFile, 'utf8');
        this.lines = this.content.split('\n');
        
        // Find main script block
        this.scriptStart = this.lines.findIndex(line => line.trim() === '<script>') + 1;
        this.scriptEnd = this.lines.findIndex((line, idx) => idx > this.scriptStart && line.trim() === '</script>');
        
        this.jsContent = this.lines.slice(this.scriptStart, this.scriptEnd).join('\n');
        
        console.log(`📊 Found JavaScript: ${this.scriptEnd - this.scriptStart} lines`);
    }
    
    extract() {
        this.extractConfig();
        this.extractAuth();
        this.extractEncryption();
        this.extractStorage();
        this.extractPrograms();
        this.extractDocument();
        this.extractVault();
        this.extractUI();
        this.extractUtils();
        this.extractMain();
        this.extractProgramsData();
        console.log('✅ Enhanced extraction complete!');
    }
    
    extractConfig() {
        console.log('📦 Extracting config module...');
        
        // Extract all configuration constants
        const configPatterns = [
            /const MASTER_USERNAME[\s\S]*?;/g,
            /const MASTER_PASSWORD[\s\S]*?;/g,
            /const LEGACY_USERNAME[\s\S]*?;/g,
            /const LEGACY_PASSWORD[\s\S]*?;/g,
            /const ACCOUNT_STORAGE_KEY[\s\S]*?;/g,
            /const ENCRYPTION_KEY[\s\S]*?;/g,
            /const PROGRAMS_LIST = \[[\s\S]*?\];/g,
            /const ALUMNI_SERVICES = \[[\s\S]*?\];/g
        ];
        
        let configCode = '// Configuration and Constants\n\n';
        
        configPatterns.forEach(pattern => {
            const matches = this.jsContent.match(pattern);
            if (matches) {
                configCode += matches.join('\n\n') + '\n\n';
            }
        });
        
        this.writeModule('config', configCode);
    }
    
    extractAuth() {
        console.log('🔐 Extracting auth module...');
        
        // Find all auth-related functions
        const authFunctions = [
            'hashPassword',
            'hasUserAccounts',
            'getUserAccounts',
            'saveUserAccount',
            'updateLastLogin',
            'verifyCredentials',
            'handleLogin',
            'handleLogout',
            'showAccountCreation',
            'createNewAccount',
            'initializeSession',
            'checkSession',
            'clearSession'
        ];
        
        let authCode = '// Authentication Module\n\n';
        
        authFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                authCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('auth', authCode);
    }
    
    extractEncryption() {
        console.log('🔒 Extracting encryption module...');
        
        const encryptionFunctions = [
            'generateEncryptionKey',
            'xorCipher',
            'encryptData',
            'decryptData',
            'migrateUnencryptedData',
            'isEncrypted',
            'encryptStorage',
            'decryptStorage'
        ];
        
        let encryptionCode = '// Encryption and Security Module\n\n';
        
        encryptionFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                encryptionCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('encryption', encryptionCode);
    }
    
    extractStorage() {
        console.log('💾 Extracting storage module...');
        
        const storageFunctions = [
            'saveToLocalStorage',
            'getFromLocalStorage',
            'removeFromLocalStorage',
            'clearLocalStorage',
            'saveSecure',
            'getSecure',
            'autoSaveWork',
            'loadAutoSave',
            'clearAutoSave'
        ];
        
        let storageCode = '// Storage Management Module\n\n';
        
        storageFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                storageCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('storage', storageCode);
    }
    
    extractPrograms() {
        console.log('🏥 Extracting programs module...');
        
        const programsFunctions = [
            'loadPrograms',
            'saveProgram',
            'updateProgram',
            'deleteProgram',
            'searchPrograms',
            'filterPrograms',
            'sortPrograms',
            'selectProgram',
            'deselectProgram',
            'getSelectedPrograms',
            'clearSelectedPrograms',
            'addCustomProgram',
            'editCustomProgram',
            'importPrograms',
            'exportPrograms'
        ];
        
        let programsCode = '// Programs Management Module\n\n';
        
        programsFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                programsCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('programs', programsCode);
    }
    
    extractDocument() {
        console.log('📄 Extracting document module...');
        
        const documentFunctions = [
            'generateDocument',
            'generatePDF',
            'downloadDocument',
            'downloadDocumentPdf',
            'formatDocument',
            'formatAftercarePlan',
            'formatDischargePacket',
            'formatOptionsDocument',
            'addPageNumbers',
            'addWatermark',
            'mergeDocuments',
            'printDocument',
            'emailDocument',
            'scheduleFollowup'
        ];
        
        let documentCode = '// Document Generation Module\n\n';
        
        documentFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                documentCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('document', documentCode);
    }
    
    extractVault() {
        console.log('🗄️ Extracting vault module...');
        
        const vaultFunctions = [
            'saveToVault',
            'loadFromVault',
            'deleteFromVault',
            'clearVault',
            'getVaultItems',
            'searchVault',
            'exportVault',
            'importVault',
            'addToDischargePacket',
            'removeFromDischargePacket',
            'getDischargePacket',
            'clearDischargePacket'
        ];
        
        let vaultCode = '// Document Vault Module\n\n';
        
        vaultFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                vaultCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('vault', vaultCode);
    }
    
    extractUI() {
        console.log('🎨 Extracting UI module...');
        
        const uiFunctions = [
            'showModal',
            'hideModal',
            'showNotification',
            'hideNotification',
            'showLoading',
            'hideLoading',
            'updateUI',
            'updateProgramDisplay',
            'updateSelectionPanel',
            'toggleDarkMode',
            'initializeDarkMode',
            'showWelcomeAnimation',
            'initializeTooltips',
            'initializeKeyboardShortcuts',
            'handleResize',
            'smoothScroll'
        ];
        
        let uiCode = '// User Interface Module\n\n';
        
        uiFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                uiCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('ui', uiCode);
    }
    
    extractUtils() {
        console.log('🔧 Extracting utils module...');
        
        const utilsFunctions = [
            'formatDate',
            'formatTime',
            'escapeHtml',
            'unescapeHtml',
            'debounce',
            'throttle',
            'generateId',
            'validateEmail',
            'validatePhone',
            'sanitizeInput',
            'copyToClipboard',
            'downloadFile',
            'readFile',
            'parseJSON',
            'stringifyJSON'
        ];
        
        let utilsCode = '// Utility Functions Module\n\n';
        
        utilsFunctions.forEach(funcName => {
            const funcRegex = new RegExp(`(async\\s+)?function\\s+${funcName}\\s*\\([^)]*\\)\\s*{[\\s\\S]*?^}`, 'gm');
            const match = this.jsContent.match(funcRegex);
            if (match) {
                utilsCode += match[0] + '\n\n';
            }
        });
        
        this.writeModule('utils', utilsCode);
    }
    
    extractMain() {
        console.log('🚀 Extracting main module...');
        
        // Extract initialization and event listeners
        const mainPatterns = [
            /window\.addEventListener\('DOMContentLoaded'[\s\S]*?\}\);/g,
            /document\.addEventListener\('DOMContentLoaded'[\s\S]*?\}\);/g,
            /window\.addEventListener\('load'[\s\S]*?\}\);/g,
            /window\.addEventListener\('beforeunload'[\s\S]*?\}\);/g,
            /function initializeApp[\s\S]*?^}/gm,
            /function init[\s\S]*?^}/gm
        ];
        
        let mainCode = '// Main Application Module\n\n';
        
        mainPatterns.forEach(pattern => {
            const matches = this.jsContent.match(pattern);
            if (matches) {
                mainCode += matches.join('\n\n') + '\n\n';
            }
        });
        
        // Add initialization call
        mainCode += `
// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}`;
        
        this.writeModule('main', mainCode);
    }
    
    extractProgramsData() {
        console.log('📊 Extracting programs data...');
        
        // Extract the PROGRAMS_LIST array
        const programsMatch = this.jsContent.match(/const PROGRAMS_LIST = \[([\s\S]*?)\];/);
        
        if (programsMatch) {
            try {
                // Clean up the match and parse as JSON
                let programsData = programsMatch[0]
                    .replace('const PROGRAMS_LIST = ', '')
                    .replace(/;$/, '')
                    .replace(/(\w+):/g, '"$1":')  // Add quotes to keys
                    .replace(/'/g, '"');           // Replace single quotes with double
                
                // Try to parse to validate
                const parsed = eval('(' + programsData + ')');
                
                // Write as JSON
                fs.writeFileSync('src/data/programs.json', JSON.stringify(parsed, null, 2));
                console.log('  ✓ programs.json created');
            } catch (error) {
                console.log('  ⚠ Could not parse programs data, creating empty file');
                fs.writeFileSync('src/data/programs.json', '[]');
            }
        }
        
        // Extract ALUMNI_SERVICES
        const alumniMatch = this.jsContent.match(/const ALUMNI_SERVICES = \[([\s\S]*?)\];/);
        
        if (alumniMatch) {
            try {
                let alumniData = alumniMatch[0]
                    .replace('const ALUMNI_SERVICES = ', '')
                    .replace(/;$/, '')
                    .replace(/(\w+):/g, '"$1":')
                    .replace(/'/g, '"');
                
                const parsed = eval('(' + alumniData + ')');
                
                fs.writeFileSync('src/data/alumni-services.json', JSON.stringify(parsed, null, 2));
                console.log('  ✓ alumni-services.json created');
            } catch (error) {
                console.log('  ⚠ Could not parse alumni data');
            }
        }
    }
    
    writeModule(name, content) {
        const filepath = `src/js/${name}.js`;
        
        // Wrap in module pattern
        const moduleContent = `/**
 * CareConnect Pro - ${name.charAt(0).toUpperCase() + name.slice(1)} Module
 * Extracted from monolithic application
 */

(function(window, document) {
    'use strict';
    
${content}
    
    // Export module
    window.CareConnect = window.CareConnect || {};
    window.CareConnect.${name} = {
        // Export public functions here
    };
    
})(window, document);
`;
        
        fs.writeFileSync(filepath, moduleContent);
        console.log(`  ✓ ${name}.js extracted`);
    }
    
    ensureDirectories() {
        ['src', 'src/js', 'src/css', 'src/data', 'dist'].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }
}

// Run extraction
const extractor = new EnhancedExtractor();
extractor.ensureDirectories();
extractor.extract();
