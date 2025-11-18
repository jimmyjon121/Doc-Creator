// Enhanced Coach Profile System for CareConnect Pro - ES6+ Modernized
// Links user accounts to coach profiles with caseload management

(() => {
    'use strict';
    
    console.log('👥 Coach Profile Enhancement loaded');
    
    // Coach profile storage key
    const COACH_PROFILES_KEY = 'careconnect_coach_profiles';
    
    // Coach profile management
    const CoachProfiles = {
        // Get all coach profiles
        getAll() {
            const stored = localStorage.getItem(COACH_PROFILES_KEY);
            return stored ? JSON.parse(stored) : {};
        },
        
        // Save coach profiles
        saveAll(profiles) {
            localStorage.setItem(COACH_PROFILES_KEY, JSON.stringify(profiles));
        },
        
        // Create or update coach profile
        update(username, profileData) {
            const profiles = this.getAll();
            profiles[username] = {
                ...profiles[username],
                ...profileData,
                lastUpdated: new Date().toISOString()
            };
            this.saveAll(profiles);
            return profiles[username];
        },
        
        // Get coach profile for username
        get(username) {
            const profiles = this.getAll();
            return profiles[username] || null;
        }
    };
    
    // Generate initials from name
    const generateInitials = (name, max = 2) => {
        if (!name) return '';
        
        const parts = name.trim().split(/\s+/);
        return parts
            .map(part => part[0]?.toUpperCase() || '')
            .filter(Boolean)
            .slice(0, max)
            .join('') || name.substring(0, 2).toUpperCase();
    };
    
    // Enhanced getCurrentCoach that uses actual user data
    window.getEnhancedCurrentCoach = () => {
        const username = sessionStorage.getItem('username');
        const fullName = sessionStorage.getItem('fullName');
        const userRole = sessionStorage.getItem('userRole') || 'coach';
        const isMaster = sessionStorage.getItem('isMaster') === 'true';
        
        // Get stored profile
        let profile = CoachProfiles.get(username);
        
        // If no profile exists, create default from session data
        if (!profile && username) {
            profile = CoachProfiles.update(username, {
                username,
                fullName: fullName || username,
                initials: generateInitials(fullName || username),
                role: userRole,
                isAdmin: userRole === 'admin' || isMaster,
                department: '',
                phoneExtension: '',
                specializations: [],
                maxCaseload: 12,
                currentCaseload: 0
            });
        }
        
        return profile || {
            username: 'guest',
            fullName: 'Guest User',
            initials: 'GU',
            role: 'viewer',
            isAdmin: false
        };
    };
    
    // Enhanced profile setup dialog
    window.showCoachProfileSetup = (isFirstTime = false) => {
        const currentProfile = window.getEnhancedCurrentCoach();
        
        const dialogHtml = `
            <div class="modal-overlay" id="coachProfileModal">
                <div class="modal-content" style="max-width: 500px;">
                    <h2 style="margin-bottom: 20px;">
                        ${isFirstTime ? '👋 Complete Your Coach Profile' : '⚙️ Update Coach Profile'}
                    </h2>
                    
                    ${isFirstTime ? `
                        <p style="color: #666; margin-bottom: 20px;">
                            Let's set up your coach profile to personalize your experience and manage your caseload effectively.
                        </p>
                    ` : ''}
                    
                    <form id="coachProfileForm">
                        <div class="form-group">
                            <label>Full Name <span class="required">*</span></label>
                            <input type="text" id="profileFullName" value="${currentProfile.fullName}" required>
                        </div>
                        
                        <div class="form-group">
                            <label>Coach Initials <span class="required">*</span></label>
                            <input type="text" id="profileInitials" value="${currentProfile.initials}" maxlength="3" required 
                                style="text-transform: uppercase;" placeholder="e.g., JD">
                            <small>Used to identify your clients in the system</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Department</label>
                            <select id="profileDepartment">
                                <option value="">Select Department</option>
                                <option value="clinical" ${currentProfile.department === 'clinical' ? 'selected' : ''}>Clinical</option>
                                <option value="residential" ${currentProfile.department === 'residential' ? 'selected' : ''}>Residential</option>
                                <option value="education" ${currentProfile.department === 'education' ? 'selected' : ''}>Education</option>
                                <option value="admin" ${currentProfile.department === 'admin' ? 'selected' : ''}>Administration</option>
                                <option value="support" ${currentProfile.department === 'support' ? 'selected' : ''}>Support Services</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Phone Extension</label>
                            <input type="text" id="profileExtension" value="${currentProfile.phoneExtension || ''}" 
                                placeholder="e.g., 1234" maxlength="10">
                        </div>
                        
                        <div class="form-group">
                            <label>Role</label>
                            <select id="profileRole">
                                <option value="coach" ${currentProfile.role === 'coach' ? 'selected' : ''}>Coach</option>
                                <option value="supervisor" ${currentProfile.role === 'supervisor' ? 'selected' : ''}>Supervisor</option>
                                <option value="admin" ${currentProfile.role === 'admin' ? 'selected' : ''}>Administrator</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Max Caseload</label>
                            <input type="number" id="profileMaxCaseload" value="${currentProfile.maxCaseload || 12}" 
                                min="1" max="50" required>
                            <small>Maximum number of clients you can manage</small>
                        </div>
                        
                        <div class="button-group" style="margin-top: 30px;">
                            <button type="submit" class="primary-button" style="flex: 1;">
                                ${isFirstTime ? 'Create Profile' : 'Update Profile'}
                            </button>
                            ${!isFirstTime ? `
                                <button type="button" onclick="closeCoachProfileModal()" class="secondary-button">
                                    Cancel
                                </button>
                            ` : ''}
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add dialog to page
        const existingModal = document.getElementById('coachProfileModal');
        existingModal?.remove();
        
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
        
        // Handle form submission
        document.getElementById('coachProfileForm').onsubmit = async (e) => {
            e.preventDefault();
            
            const username = sessionStorage.getItem('username');
            const profileData = {
                username,
                fullName: document.getElementById('profileFullName').value,
                initials: document.getElementById('profileInitials').value.toUpperCase(),
                role: document.getElementById('profileRole').value,
                department: document.getElementById('profileDepartment').value,
                phoneExtension: document.getElementById('profileExtension').value,
                maxCaseload: parseInt(document.getElementById('profileMaxCaseload').value),
                isAdmin: document.getElementById('profileRole').value === 'admin'
            };
            
            // Update profile
            CoachProfiles.update(username, profileData);
            
            // Update session storage
            sessionStorage.setItem('fullName', profileData.fullName);
            sessionStorage.setItem('userRole', profileData.role);
            
            // Show success message
            showNotification('Profile updated successfully!', 'success');
            
            // Close modal
            closeCoachProfileModal();
            
            // Refresh any UI elements that display coach info
            const coachDisplay = document.querySelector('.coach-info, .user-info');
            if (coachDisplay) {
                coachDisplay.textContent = `${profileData.fullName} (${profileData.initials})`;
            }
            
            // If first time, trigger any onboarding completion
            if (isFirstTime && window.onCoachProfileComplete) {
                window.onCoachProfileComplete();
            }
        };
    };
    
    // Close modal function
    window.closeCoachProfileModal = () => {
        const modal = document.getElementById('coachProfileModal');
        modal?.remove();
    };
    
    // Override getCurrentCoach if it exists
    if (typeof window.getCurrentCoach === 'function') {
        window._originalGetCurrentCoach = window.getCurrentCoach;
    }
    window.getCurrentCoach = window.getEnhancedCurrentCoach;
    
    // Add coach indicator to clients
    const enhanceClientDisplay = () => {
        const clients = document.querySelectorAll('.client-row, .client-card, .client-item');
        const currentCoach = window.getEnhancedCurrentCoach();
        
        clients.forEach(client => {
            const initials = client.dataset.clientInitials || client.textContent.match(/^([A-Z]{2,3})\s-/)?.[1];
            
            if (initials === currentCoach.initials) {
                client.classList.add('my-client');
                
                if (!client.querySelector('.coach-indicator')) {
                    const indicator = document.createElement('span');
                    indicator.className = 'coach-indicator';
                    indicator.innerHTML = '👤';
                    indicator.title = 'Your Client';
                    client.appendChild(indicator);
                }
            }
        });
    };
    
    // Add profile button to UI
    const addProfileButton = () => {
        const userInfo = document.querySelector('.user-info, .header-right, .nav-right');
        if (!userInfo || document.getElementById('profileSettingsBtn')) return;
        
        const profileBtn = document.createElement('button');
        profileBtn.id = 'profileSettingsBtn';
        profileBtn.className = 'profile-settings-btn';
        profileBtn.innerHTML = '👤 Profile';
        profileBtn.onclick = () => window.showCoachProfileSetup(false);
        userInfo.appendChild(profileBtn);
    };
    
    // Show notification
    const showNotification = (message, type = 'info') => {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    };
    
    // Initialize on load
    document.addEventListener('DOMContentLoaded', () => {
        // Add profile button
        setTimeout(addProfileButton, 1000);
        
        // Enhance client displays
        setTimeout(enhanceClientDisplay, 1500);
        
        // Check if first-time setup needed - but only when explicitly triggered
        const username = sessionStorage.getItem('username');
        if (username && !CoachProfiles.get(username)) {
            console.log('Coach profile not found for:', username, '- will create when requested');
        }
    });
    
    // Re-enhance on dynamic content changes
    if (window.MutationObserver) {
        const observer = new MutationObserver(() => {
            enhanceClientDisplay();
        });
        
        const waitForBody = () => {
            const target = document.body;
            if (!target) {
                setTimeout(waitForBody, 50);
                return;
            }
            observer.observe(target, {
                childList: true,
                subtree: true
            });
        };

        waitForBody();
    }
    
    // Export functions for external use
    window.CoachProfiles = {
        get: username => CoachProfiles.get(username),
        update: (username, data) => CoachProfiles.update(username, data),
        getAll: () => CoachProfiles.getAll(),
        showSetup: (isFirstTime) => window.showCoachProfileSetup(isFirstTime)
    };
    
    console.log('✅ Coach Profile Enhancement ready');
})();