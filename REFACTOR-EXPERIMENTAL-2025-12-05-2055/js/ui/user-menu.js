/**
 * @fileoverview User Menu Functions - Header dropdown and account management
 * @module ui/UserMenu
 * @status @canonical
 *
 * PURPOSE:
 *   Handles the user profile dropdown menu in the header, including:
 *   - Toggle menu visibility
 *   - Update user info display
 *   - Create account modal
 *   - Secure logout
 *
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 29105-29431)
 *   Extraction Date: December 7, 2025
 *
 * DEPENDENCIES:
 *   - DOM: #userMenu, #userProfileBtn, #userMenuInitials, #userMenuName, etc.
 *   - localStorage: username, fullName, userInitials, userRole
 *   - window.ccAuth (optional) - Security system
 *   - window.CareConnectAuth (optional) - Account management
 *   - window.logout (optional) - Full logout function
 *
 * EXPORTS TO WINDOW:
 *   - window.toggleUserMenu
 *   - window.updateUserMenuInfo
 *   - window.showCreateAccountForm
 *   - window.handleLogout
 *
 * CALLED BY:
 *   - CareConnect-Pro.html onclick="toggleUserMenu()" (line ~25912)
 *   - CareConnect-Pro.html onclick="showCreateAccountForm()" (line ~25861)
 *   - CareConnect-Pro.html onclick="handleLogout()" (line ~25939)
 */

(function() {
    'use strict';
    
    if (typeof window === 'undefined') return;
    
    let userMenuOpen = false;
    const userMenu = document.getElementById('userMenu');
    const userProfileBtn = document.getElementById('userProfileBtn');
    
    // Toggle user menu
    window.toggleUserMenu = function() {
        if (!userMenu || !userProfileBtn) return;
        
        userMenuOpen = !userMenuOpen;
        
        if (userMenuOpen) {
            userMenu.style.display = 'block';
            userProfileBtn.setAttribute('aria-expanded', 'true');
            updateUserMenuInfo();
        } else {
            userMenu.style.display = 'none';
            userProfileBtn.setAttribute('aria-expanded', 'false');
        }
    };
    
    // Update user menu with current user info
    window.updateUserMenuInfo = function() {
        if (!userMenu) return;
        
        const username = localStorage.getItem('username') || 'User';
        const fullName = localStorage.getItem('fullName') || username;
        const initials = localStorage.getItem('userInitials') || username.slice(0, 2).toUpperCase();
        
        const menuInitials = document.getElementById('userMenuInitials');
        const menuName = document.getElementById('userMenuName');
        const menuUsername = document.getElementById('userMenuUsername');
        const headerInitials = document.getElementById('userInitials');
        
        if (menuInitials) menuInitials.textContent = initials;
        if (menuName) menuName.textContent = fullName;
        if (menuUsername) menuUsername.textContent = '@' + username;
        if (headerInitials) headerInitials.textContent = initials;
    };
    
    // Show Create Account Form
    window.showCreateAccountForm = function() {
        // Remove any existing modal
        const existing = document.getElementById('createAccountModal');
        if (existing) existing.remove();
        
        const modal = document.createElement('div');
        modal.id = 'createAccountModal';
        modal.style.cssText = `
            position: fixed; inset: 0; background: rgba(15, 23, 42, 0.8); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 100000;
        `;
        modal.innerHTML = `
            <div style="
                background: #ffffff; border-radius: 16px; width: 420px; max-width: 95%;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;
            ">
                <div style="
                    background: linear-gradient(135deg, #0D9488, #0F766E); padding: 24px;
                    text-align: center; color: white;
                ">
                    <div style="font-size: 32px; margin-bottom: 8px;">👤</div>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">Create Your Account</h2>
                    <p style="margin: 6px 0 0; font-size: 13px; opacity: 0.9; color: #E0F2F1;">Set up your CareConnect Pro profile</p>
                </div>
                
                <form id="createAccountForm" style="padding: 20px 24px 24px;">
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                            Full Name <span style="color: #EF4444;">*</span>
                        </label>
                        <input type="text" id="newFullName" placeholder="e.g., Sarah Johnson" required
                               style="width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                    </div>
                    
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                            Choose Username <span style="color: #EF4444;">*</span>
                        </label>
                        <input type="text" id="newUsername" placeholder="e.g., sjohnson" required pattern="[a-zA-Z0-9_]+" minlength="3"
                               style="width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                        <small style="color: #94A3B8; font-size: 11px;">Letters, numbers, and underscores only</small>
                    </div>
                    
                    <div style="margin-bottom: 14px;">
                        <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                            Create Password <span style="color: #EF4444;">*</span>
                        </label>
                        <input type="password" id="newPassword" placeholder="At least 6 characters" required minlength="6"
                               style="width: 100%; padding: 10px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                                Your Role <span style="color: #EF4444;">*</span>
                            </label>
                            <select id="newRole" required style="width: 100%; padding: 10px 12px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; background: #fff; box-sizing: border-box;">
                                <option value="">Select...</option>
                                <option value="coach">Clinical Coach</option>
                                <option value="therapist">Therapist</option>
                                <option value="case_manager">Case Manager</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                                House/Location
                            </label>
                            <select id="newHouse" style="width: 100%; padding: 10px 12px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; background: #fff; box-sizing: border-box;">
                                <option value="">Select...</option>
                                <option value="banyan">Banyan</option>
                                <option value="cove">Cove</option>
                                <option value="meridian">Meridian</option>
                                <option value="prosperity">Prosperity</option>
                                <option value="hedge">Hedge</option>
                                <option value="nest">NEST</option>
                                <option value="multiple">Multiple</option>
                            </select>
                        </div>
                    </div>
                    
                    <div id="createAccountError" style="display: none; background: #FEF2F2; border: 1px solid #FECACA; color: #991B1B; padding: 10px 12px; border-radius: 8px; margin-bottom: 14px; font-size: 13px;"></div>
                    
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="button" onclick="document.getElementById('createAccountModal').remove();" 
                                style="flex: 1; padding: 12px 16px; background: #F1F5F9; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; color: #475569;">
                            Cancel
                        </button>
                        <button type="submit" 
                                style="flex: 2; padding: 12px 16px; background: linear-gradient(135deg, #0D9488, #14B8A6); border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; color: white;">
                            Create Account
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Focus first input
        setTimeout(() => document.getElementById('newFullName').focus(), 100);
        
        // Handle form submit
        document.getElementById('createAccountForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const fullName = document.getElementById('newFullName').value.trim();
            const username = document.getElementById('newUsername').value.trim();
            const password = document.getElementById('newPassword').value;
            const role = document.getElementById('newRole').value;
            const house = document.getElementById('newHouse').value;
            const errorDiv = document.getElementById('createAccountError');
            
            // Validate
            if (!fullName || !username || !password || !role) {
                errorDiv.textContent = 'Please fill in all required fields.';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Check if username already exists
            if (window.CareConnectAuth && window.CareConnectAuth.getUserAccounts) {
                const existingAccounts = window.CareConnectAuth.getUserAccounts();
                const exists = existingAccounts.some(acc => 
                    acc.username && acc.username.toLowerCase() === username.toLowerCase()
                );
                if (exists) {
                    errorDiv.textContent = 'Username already exists. Please choose a different one.';
                    errorDiv.style.display = 'block';
                    return;
                }
            }
            
            // Create account using the proper auth system
            try {
                // Use CareConnectAuth.addUserAccount (it's async!)
                if (window.CareConnectAuth && window.CareConnectAuth.addUserAccount) {
                    await window.CareConnectAuth.addUserAccount(username, password, fullName);
                    console.log('✅ Account created successfully via CareConnectAuth');
                } else {
                    // Fallback: store in localStorage with proper format
                    const accounts = JSON.parse(localStorage.getItem('ccpro-user-accounts-v1') || '[]');
                    accounts.push({ 
                        username, 
                        password, // Note: This is plaintext fallback - not secure
                        role: 'user', 
                        fullName,
                        created: new Date().toISOString()
                    });
                    localStorage.setItem('ccpro-user-accounts-v1', JSON.stringify(accounts));
                    console.log('✅ Account created via localStorage fallback');
                }
                
                // Save profile data
                const profile = { fullName, role, house, setupDate: new Date().toISOString() };
                
                // Use namespaced keys to match first-login-flow.js logic
                const userSuffix = '-' + username.trim().toLowerCase();
                localStorage.setItem('ccpro-user-profile' + userSuffix, JSON.stringify(profile));
                
                // Mark profile as complete so we skip the duplicate modal in first-login-flow
                // But leave onboarding-complete FALSE so the video still plays
                localStorage.setItem('ccpro-profile-complete' + userSuffix, 'true');
                
                console.log('[CreateAccount] Profile saved for ' + username + ', handing off to first-login flow');
                
                // Close modal
                modal.remove();
                
                // Fill in the login form with new credentials
                const usernameInput = document.getElementById('loginUsername');
                const passwordInput = document.getElementById('loginPassword');
                const submitBtn = document.querySelector('.auth-submit-btn, #loginForm button[type="submit"]');
                
                if (usernameInput && passwordInput) {
                    usernameInput.value = username;
                    passwordInput.value = password;
                    
                    // Auto-click the submit button after a brief delay to allow DOM update
                    setTimeout(() => {
                        if (submitBtn) {
                            console.log('🔐 Auto-submitting login form...');
                            submitBtn.click();
                        } else {
                            // Fallback: manually trigger handleLogin
                            const form = document.getElementById('loginForm');
                            if (form && typeof handleLogin === 'function') {
                                const fakeEvent = {
                                    preventDefault: () => {},
                                    stopPropagation: () => {},
                                    target: form,
                                    currentTarget: form
                                };
                                handleLogin(fakeEvent);
                            }
                        }
                    }, 200);
                }
                
            } catch (err) {
                console.error('Account creation failed:', err);
                errorDiv.textContent = 'An error occurred: ' + (err.message || 'Please try again.');
                errorDiv.style.display = 'block';
            }
        });
        
        // Close on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };
    
    // Handle logout - SECURE VERSION
    window.handleLogout = function() {
        // SECURITY: Clear session immediately
        if (window.ccAuth) {
            window.ccAuth.clearSession();
            window.ccAuth.isAuthenticated = false;
        }
        
        // Close user menu
        userMenuOpen = false;
        if (userMenu) userMenu.style.display = 'none';
        if (userProfileBtn) userProfileBtn.setAttribute('aria-expanded', 'false');
        
        // Call full logout function
        if (typeof window.logout === 'function') {
            window.logout();
        } else {
            // Fallback: manually hide app and show login
            const mainApp = document.getElementById('mainApp');
            const loginScreen = document.getElementById('loginScreen');
            
            if (mainApp) {
                mainApp.style.display = 'none';
                mainApp.style.visibility = 'hidden';
            }
            
            if (loginScreen) {
                loginScreen.style.display = '';
                loginScreen.style.visibility = 'visible';
            }
            
            // Clear storage
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            localStorage.removeItem('userRole');
            sessionStorage.clear();
        }
    };
    
    // Close menu when clicking outside
    document.addEventListener('click', function(event) {
        if (userMenuOpen && userMenu && userProfileBtn) {
            if (!userMenu.contains(event.target) && !userProfileBtn.contains(event.target)) {
                userMenuOpen = false;
                userMenu.style.display = 'none';
                userProfileBtn.setAttribute('aria-expanded', 'false');
            }
        }
    });
    
    // Update menu info when user logs in
    if (typeof window.addEventListener !== 'undefined') {
        window.addEventListener('storage', function(e) {
            if (e.key === 'username' || e.key === 'fullName') {
                updateUserMenuInfo();
            }
        });
        
        // Update on page load if already logged in
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            setTimeout(updateUserMenuInfo, 500);
        } else {
            document.addEventListener('DOMContentLoaded', function() {
                setTimeout(updateUserMenuInfo, 500);
            });
        }
    }
})();

