/**
 * CareConnect Pro - Main Module
 * Extracted from monolithic application
 */

(function(window, document) {
    'use strict';
    
// Main Application Module

window.addEventListener('DOMContentLoaded', function() {
            // Check for extension flag first
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('fromExtension')) {
                // Skip login for extension integration
                sessionStorage.setItem('isLoggedIn', 'true');
                sessionStorage.setItem('username', 'ChromeExtension');
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                
                // Initialize encryption with default key for extension
                if (DataEncryption.isSupported()) {
                    dataEncryption.initialize('ChromeExtension').then(() => {
                        console.log('🔒 Encryption initialized for extension');
                        if (typeof enableAutoSave === 'function') {
                            enableAutoSave();
                        }
                    }).catch(console.error);
                }
            } else if (sessionStorage.getItem('isLoggedIn') === 'true') {
                // Already logged in from this session
                document.getElementById('loginScreen').style.display = 'none';
                document.getElementById('mainApp').style.display = 'block';
                // Update user display
                updateUserDisplay();
                
                // For Chrome Extension users, ensure encryption is initialized
                if (sessionStorage.getItem('username') === 'ChromeExtension' && DataEncryption.isSupported()) {
                    console.log('Chrome Extension user detected, initializing encryption...');
                    dataEncryption.initialize('ChromeExtension').then(() => {
                        console.log('🔒 Encryption initialized for Chrome Extension');
                        dataEncryption.isInitialized = true;
                        if (typeof enableAutoSave === 'function') {
                            enableAutoSave();
                        }
                    }).catch(error => {
                        console.error('Encryption initialization error:', error);
                        // Continue without encryption for Chrome Extension
                        dataEncryption.isInitialized = false;
                    });

document.addEventListener('DOMContentLoaded', function() {
            console.log('DOM Content Loaded - Starting initialization...');

            // Load any saved custom programs first
            loadCustomPrograms();
            console.log('Programs loaded:', programs.length);
            console.log('First program:', programs[0]);

            // DEBUG: Check if selection panel exists
            const selectionPanel = document.querySelector('.selection-panel');
            console.log('Selection panel found:', !!selectionPanel);

            if (selectionPanel) {
                console.log('Selection panel styles:', window.getComputedStyle(selectionPanel));
            }

            // Add a small delay to ensure DOM is fully ready
            setTimeout(() => {
            renderPrograms();
                console.log('Programs rendered');
            }, 100);
            
            // Search functionality (combined with active filter)
            document.getElementById('searchBox').addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const cards = document.querySelectorAll('.program-card');
                cards.forEach(card => {
                    const program = programs.find(p => p.id === card.dataset.id);
                    const matchesSearch = `${program.name} ${program.location} ${program.type}`.toLowerCase().includes(searchTerm);
                    const matchesFilter = (currentFilter === 'all' || program.category === currentFilter);
                    card.style.display = (matchesSearch && matchesFilter) ? 'block' : 'none';
                });

document.addEventListener('DOMContentLoaded', function() {
            if (sessionStorage.getItem('isLoggedIn') === 'true') {
                requestNotificationPermission();
                // Check reminders periodically
                setInterval(() => checkReminders().catch(console.error), 5 * 60 * 1000); // Every 5 minutes
                checkReminders().catch(console.error); // Initial check
            }
        });


// Initialize application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
    
    // Export module
    window.CareConnect = window.CareConnect || {};
    window.CareConnect.main = {
        // Export public functions here
    };
    
})(window, document);
