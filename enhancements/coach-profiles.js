// Enhanced Coach Profile System for CareConnect Pro
// Links user accounts to coach profiles with caseload management

(function() {
    'use strict';
    
    console.log('👥 Coach Profile Enhancement loaded');
    
    // Coach profile storage key
    const COACH_PROFILES_KEY = 'careconnect_coach_profiles';
    
    // Get all coach profiles
    function getCoachProfiles() {
        const stored = localStorage.getItem(COACH_PROFILES_KEY);
        return stored ? JSON.parse(stored) : {};
    }
    
    // Save coach profiles
    function saveCoachProfiles(profiles) {
        localStorage.setItem(COACH_PROFILES_KEY, JSON.stringify(profiles));
    }
    
    // Create or update coach profile
    function updateCoachProfile(username, profileData) {
        const profiles = getCoachProfiles();
        profiles[username] = {
            ...profiles[username],
            ...profileData,
            lastUpdated: new Date().toISOString()
        };
        saveCoachProfiles(profiles);
        return profiles[username];
    }
    
    // Get coach profile for username
    function getCoachProfile(username) {
        const profiles = getCoachProfiles();
        return profiles[username] || null;
    }
    
    // Enhanced getCurrentCoach that uses actual user data
    window.getEnhancedCurrentCoach = function() {
        const username = sessionStorage.getItem('username');
        const fullName = sessionStorage.getItem('fullName');
        const userRole = sessionStorage.getItem('userRole') || 'coach';
        const isMaster = sessionStorage.getItem('isMaster') === 'true';
        
        // Get stored profile
        const profile = getCoachProfile(username);
        
        // If no profile exists, create default from session data
        if (!profile && username) {
            const defaultInitials = generateInitials(fullName || username);
            const newProfile = {
                username: username,
                fullName: fullName || username,
                initials: defaultInitials,
                role: userRole,
                isAdmin: userRole === 'admin' || isMaster,
                department: '',
                phoneExtension: '',
                specializations: [],
                maxCaseload: 12,
                currentCaseload: 0
            };
            updateCoachProfile(username, newProfile);
            return newProfile;
        }
        
        return profile || {
            username: 'guest',
            fullName: 'Guest User',
            initials: 'GU',
            role: 'viewer',
            isAdmin: false
        };
    };
    
    // Generate initials from name
    function generateInitials(name) {
        const parts = name.trim().split(/\s+/);
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    }
    
    // Enhanced profile setup dialog
    window.showCoachProfileSetup = function(isFirstTime = false) {
        const currentProfile = getEnhancedCurrentCoach();
        
        const dialogHtml = `
            <div class="modal-overlay" id="coachProfileModal">
                <div class="modal-content" style="max-width: 500px;">
                    <h2 style="margin-bottom: 20px;">
                        ${isFirstTime ? '👋 Complete Your Coach Profile' : '⚙️ Update Coach Profile'}
                    </h2>
                    
                    ${isFirstTime ? `
                        <p style="color: #666; margin-bottom: 20px;">
                            Welcome! Please complete your profile to link with your caseload.
                        </p>
                    ` : ''}
                    
                    <form id="coachProfileForm">
                        <div class="form-group">
                            <label>Full Name</label>
                            <input type="text" id="profileFullName" value="${currentProfile.fullName || ''}" 
                                   required placeholder="e.g., Sarah Johnson">
                        </div>
                        
                        <div class="form-group">
                            <label>Your Initials (2-3 letters)</label>
                            <input type="text" id="profileInitials" value="${currentProfile.initials || ''}" 
                                   required maxlength="3" pattern="[A-Za-z]{2,3}"
                                   placeholder="e.g., SJ" style="text-transform: uppercase;">
                            <small style="color: #666;">These initials will link you to your clients</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Role</label>
                            <select id="profileRole" required>
                                <option value="coach" ${currentProfile.role === 'coach' ? 'selected' : ''}>Clinical Coach</option>
                                <option value="case_manager" ${currentProfile.role === 'case_manager' ? 'selected' : ''}>Case Manager</option>
                                <option value="family_ambassador" ${currentProfile.role === 'family_ambassador' ? 'selected' : ''}>Family Ambassador</option>
                                <option value="therapist" ${currentProfile.role === 'therapist' ? 'selected' : ''}>Therapist</option>
                                <option value="admin" ${currentProfile.role === 'admin' ? 'selected' : ''}>Administrator</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label>Department/House</label>
                            <input type="text" id="profileDepartment" value="${currentProfile.department || ''}" 
                                   placeholder="e.g., The Nest, Discovery">
                        </div>
                        
                        <div class="form-group">
                            <label>Phone Extension</label>
                            <input type="text" id="profileExtension" value="${currentProfile.phoneExtension || ''}" 
                                   placeholder="e.g., 123">
                        </div>
                        
                        <div class="form-group">
                            <label>Maximum Caseload</label>
                            <input type="number" id="profileMaxCaseload" value="${currentProfile.maxCaseload || 12}" 
                                   min="1" max="50" required>
                        </div>
                        
                        <div style="display: flex; gap: 10px; margin-top: 30px;">
                            <button type="submit" class="btn-primary" style="flex: 1;">
                                ${isFirstTime ? 'Complete Setup' : 'Update Profile'}
                            </button>
                            ${!isFirstTime ? `
                                <button type="button" class="btn-secondary" onclick="closeCoachProfileModal()">
                                    Cancel
                                </button>
                            ` : ''}
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        // Add to page
        document.body.insertAdjacentHTML('beforeend', dialogHtml);
        
        // Handle form submission
        document.getElementById('coachProfileForm').onsubmit = async function(e) {
            e.preventDefault();
            
            const username = sessionStorage.getItem('username');
            const updatedProfile = {
                username: username,
                fullName: document.getElementById('profileFullName').value,
                initials: document.getElementById('profileInitials').value.toUpperCase(),
                role: document.getElementById('profileRole').value,
                department: document.getElementById('profileDepartment').value,
                phoneExtension: document.getElementById('profileExtension').value,
                maxCaseload: parseInt(document.getElementById('profileMaxCaseload').value),
                isAdmin: document.getElementById('profileRole').value === 'admin'
            };
            
            // Save profile
            updateCoachProfile(username, updatedProfile);
            
            // Update session
            sessionStorage.setItem('fullName', updatedProfile.fullName);
            sessionStorage.setItem('userRole', updatedProfile.role);
            sessionStorage.setItem('coachInitials', updatedProfile.initials);
            
            // Close modal
            closeCoachProfileModal();
            
            // Refresh dashboard if available
            if (window.dashboardManager) {
                window.dashboardManager.currentCoach = updatedProfile;
                window.dashboardManager.refresh();
            }
            
            // Show success message
            showNotification('Profile updated successfully!', 'success');
        };
    };
    
    // Close modal
    window.closeCoachProfileModal = function() {
        const modal = document.getElementById('coachProfileModal');
        if (modal) {
            modal.remove();
        }
    };
    
    // Check if profile needs setup on login
    window.checkCoachProfileSetup = function() {
        const username = sessionStorage.getItem('username');
        const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
        
        if (isLoggedIn && username) {
            const profile = getCoachProfile(username);
            if (!profile || !profile.initials) {
                // First time or incomplete profile
                setTimeout(() => showCoachProfileSetup(true), 1000);
            }
        }
    };
    
    // Override the dashboard manager's getCurrentCoach method
    if (window.dashboardManager) {
        window.dashboardManager.getCurrentCoach = window.getEnhancedCurrentCoach;
    }
    
    // Add profile button to UI
    function addProfileButton() {
        const userInfo = document.querySelector('.user-info, .header-right, .nav-right');
        if (userInfo && !document.getElementById('profileSettingsBtn')) {
            const profileBtn = document.createElement('button');
            profileBtn.id = 'profileSettingsBtn';
            profileBtn.className = 'btn-icon';
            profileBtn.innerHTML = '👤';
            profileBtn.title = 'Coach Profile Settings';
            profileBtn.onclick = () => showCoachProfileSetup(false);
            userInfo.appendChild(profileBtn);
        }
    }
    
    // Show notification
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#48bb78' : '#4299e1'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            // Don't automatically check profile setup - only show when user clicks
            // checkCoachProfileSetup();
            addProfileButton();
        });
    } else {
        // Don't automatically check profile setup - only show when user clicks
        // checkCoachProfileSetup();
        addProfileButton();
    }
    
    // Export for use
    window.CoachProfiles = {
        updateProfile: updateCoachProfile,
        getProfile: getCoachProfile,
        getAllProfiles: getCoachProfiles,
        showSetup: showCoachProfileSetup,
        getCurrentCoach: getEnhancedCurrentCoach
    };
    
    console.log('✅ Coach Profile System ready');
    
})();
