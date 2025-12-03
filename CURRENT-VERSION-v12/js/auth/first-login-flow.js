/**
 * First Login Flow for CareConnect Pro
 * 
 * Handles the onboarding sequence for new coaches:
 * 1. User Agreement modal
 * 2. Profile Setup form
 * 3. Onboarding video
 * 4. Dashboard entry
 */

(function() {
    'use strict';
    
    const STORAGE_KEYS = {
        AGREEMENT_ACCEPTED: 'ccpro-agreement-accepted',
        PROFILE_COMPLETE: 'ccpro-profile-complete',
        ONBOARDING_COMPLETE: 'ccpro-onboarding-complete'
    };
    
    // =============================================
    // USER AGREEMENT
    // =============================================
    
    const USER_AGREEMENT_TEXT = `
        <h3>CareConnect Pro User Agreement</h3>
        <p><strong>Effective Date:</strong> December 2024</p>
        
        <p>Welcome to CareConnect Pro. By using this application, you agree to the following terms:</p>
        
        <h4>1. Authorized Use</h4>
        <p>This application is for authorized clinical staff of Family First Adolescent Services only. 
        You must be an employee or contractor with proper credentials to access this system.</p>
        
        <h4>2. Data Privacy & HIPAA Compliance</h4>
        <p>You agree to:</p>
        <ul>
            <li>Never store Protected Health Information (PHI) or full client names in this system</li>
            <li>Use only initials, nicknames, or coded identifiers for clients</li>
            <li>Follow all HIPAA and organizational privacy policies</li>
            <li>Report any suspected data breaches immediately to your supervisor</li>
        </ul>
        
        <h4>3. Device Security</h4>
        <p>All data in CareConnect Pro stays on your local device. You are responsible for:</p>
        <ul>
            <li>Keeping your device secure with a password/PIN</li>
            <li>Not sharing your CareConnect login credentials</li>
            <li>Logging out when leaving your device unattended</li>
        </ul>
        
        <h4>4. Professional Use</h4>
        <p>This tool is designed to support your clinical workflow. You agree to:</p>
        <ul>
            <li>Use the system for legitimate clinical documentation purposes only</li>
            <li>Maintain accurate and professional records</li>
            <li>Not circumvent any security measures</li>
        </ul>
        
        <h4>5. Acknowledgment</h4>
        <p>By clicking "I Agree & Continue," you confirm that you have read, understood, 
        and agree to comply with these terms.</p>
    `;
    
    function showUserAgreement() {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.id = 'userAgreementModal';
            overlay.style.cssText = `
                position: fixed; inset: 0; 
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
                backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center; 
                z-index: 100000;
                opacity: 0; transition: opacity 0.3s ease;
            `;
            overlay.innerHTML = `
                <div style="
                    background: #ffffff;
                    border-radius: 12px;
                    width: 620px;
                    max-width: 95%;
                    max-height: 85vh;
                    box-shadow: 0 25px 80px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1);
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #1E293B, #334155);
                        padding: 28px 32px;
                        border-bottom: 3px solid #0D9488;
                    ">
                        <div style="display: flex; align-items: center; gap: 16px;">
                            <div style="
                                width: 48px; height: 48px;
                                background: linear-gradient(135deg, #0D9488, #14B8A6);
                                border-radius: 10px;
                                display: flex; align-items: center; justify-content: center;
                            ">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                    <line x1="16" y1="13" x2="8" y2="13"/>
                                    <line x1="16" y1="17" x2="8" y2="17"/>
                                    <polyline points="10 9 9 9 8 9"/>
                                </svg>
                            </div>
                            <div>
                                <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #F8FAFC; letter-spacing: -0.02em;">
                                    User Agreement
                                </h2>
                                <p style="margin: 4px 0 0; font-size: 13px; color: #94A3B8;">
                                    CareConnect Pro • Family First Adolescent Services
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Content -->
                    <div style="
                        flex: 1;
                        overflow-y: auto;
                        padding: 28px 32px;
                        font-size: 14px;
                        line-height: 1.7;
                        color: #334155;
                    " id="agreementContent">
                        <p style="color: #64748B; font-size: 13px; margin: 0 0 20px;">
                            <strong>Effective Date:</strong> December 2024
                        </p>
                        
                        <p style="margin: 0 0 24px;">
                            By accessing CareConnect Pro, you acknowledge and agree to use this clinical workspace 
                            application in accordance with all guidelines, policies, and procedures established by 
                            Family First Adolescent Services, Brentcare, and any associated sub-programs.
                        </p>
                        
                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 10px; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #0D9488;">§1</span> Authorized Use
                            </h4>
                            <p style="margin: 0; padding-left: 24px; border-left: 2px solid #E2E8F0;">
                                Access is restricted to authorized clinical staff of Family First Adolescent Services 
                                and affiliated programs. Users must maintain valid employment status and use this tool 
                                solely for clinical documentation and aftercare planning purposes.
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 10px; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #0D9488;">§2</span> Compliance with Organizational Policies
                            </h4>
                            <div style="padding-left: 24px; border-left: 2px solid #E2E8F0;">
                                <p style="margin: 0 0 12px;">You agree to adhere to all applicable policies and regulations:</p>
                                <ul style="margin: 0; padding-left: 20px; color: #475569;">
                                    <li style="margin-bottom: 6px;">Follow all Family First, Brentcare, and sub-program guidelines</li>
                                    <li style="margin-bottom: 6px;">Use only initials or coded identifiers for client records (no PHI or full names)</li>
                                    <li style="margin-bottom: 6px;">Report any concerns or issues to your supervisor immediately</li>
                                    <li>Maintain compliance with HIPAA and all organizational privacy policies</li>
                                </ul>
                            </div>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 10px; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #0D9488;">§3</span> Device Security
                            </h4>
                            <p style="margin: 0; padding-left: 24px; border-left: 2px solid #E2E8F0;">
                                All application data is stored locally on your device. You are responsible for 
                                maintaining device security, including using password protection and logging out 
                                when your device is unattended.
                            </p>
                        </div>
                        
                        <div style="margin-bottom: 24px;">
                            <h4 style="font-size: 14px; font-weight: 700; color: #1E293B; margin: 0 0 10px; display: flex; align-items: center; gap: 8px;">
                                <span style="color: #0D9488;">§4</span> Professional Conduct
                            </h4>
                            <p style="margin: 0; padding-left: 24px; border-left: 2px solid #E2E8F0;">
                                This application supports your clinical documentation workflow. Users agree to maintain 
                                accurate records and use the system in accordance with professional standards and 
                                organizational expectations.
                            </p>
                        </div>
                        
                        <div style="
                            background: #F8FAFC;
                            border: 1px solid #E2E8F0;
                            border-radius: 8px;
                            padding: 16px;
                            margin-top: 24px;
                        ">
                            <p style="margin: 0; font-size: 13px; color: #475569;">
                                <strong style="color: #1E293B;">Acknowledgment:</strong> 
                                By proceeding, you confirm that you have read, understood, and agree to comply with 
                                these terms and all applicable Family First and Brentcare policies.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Footer -->
                    <div style="
                        padding: 20px 32px;
                        background: #F8FAFC;
                        border-top: 1px solid #E2E8F0;
                    ">
                        <label style="
                            display: flex;
                            align-items: center;
                            gap: 12px;
                            cursor: pointer;
                            margin-bottom: 16px;
                        ">
                            <input type="checkbox" id="agreementCheckbox" style="
                                width: 20px; height: 20px;
                                accent-color: #0D9488;
                                cursor: pointer;
                            ">
                            <span style="font-size: 14px; font-weight: 500; color: #1E293B;">
                                I have read and agree to the terms of this User Agreement
                            </span>
                        </label>
                        <button class="btn-agree" disabled style="
                            width: 100%;
                            padding: 14px 24px;
                            background: linear-gradient(135deg, #0D9488, #0F766E);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            opacity: 0.5;
                            transition: all 0.2s ease;
                        ">
                            Accept & Continue
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Animate in
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                overlay.querySelector('div').style.transform = 'translateY(0)';
            });
            
            const checkbox = overlay.querySelector('#agreementCheckbox');
            const agreeBtn = overlay.querySelector('.btn-agree');
            
            checkbox.addEventListener('change', () => {
                agreeBtn.disabled = !checkbox.checked;
                agreeBtn.style.opacity = checkbox.checked ? '1' : '0.5';
                agreeBtn.style.cursor = checkbox.checked ? 'pointer' : 'not-allowed';
            });
            
            agreeBtn.addEventListener('click', () => {
                if (checkbox.checked) {
                    localStorage.setItem(STORAGE_KEYS.AGREEMENT_ACCEPTED, 'true');
                    localStorage.setItem(STORAGE_KEYS.AGREEMENT_ACCEPTED + '-date', new Date().toISOString());
                    
                    overlay.style.opacity = '0';
                    setTimeout(() => {
                        overlay.remove();
                        resolve(true);
                    }, 300);
                }
            });
        });
    }
    
    // =============================================
    // PROFILE SETUP
    // =============================================
    
    function showProfileSetup(existingProfile = null) {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.id = 'profileSetupModal';
            overlay.style.cssText = `
                position: fixed; inset: 0;
                background: linear-gradient(135deg, rgba(15, 23, 42, 0.95), rgba(30, 41, 59, 0.95));
                backdrop-filter: blur(8px);
                display: flex; align-items: center; justify-content: center;
                z-index: 100000;
                opacity: 0; transition: opacity 0.3s ease;
            `;
            overlay.innerHTML = `
                <div style="
                    background: #ffffff;
                    border-radius: 12px;
                    width: 440px;
                    max-width: 95%;
                    box-shadow: 0 25px 80px rgba(0,0,0,0.4);
                    overflow: hidden;
                    transform: translateY(20px);
                    transition: transform 0.3s ease;
                ">
                    <!-- Header -->
                    <div style="
                        background: linear-gradient(135deg, #1E293B, #334155);
                        padding: 24px 28px;
                        border-bottom: 3px solid #0D9488;
                    ">
                        <div style="display: flex; align-items: center; gap: 14px;">
                            <div style="
                                width: 44px; height: 44px;
                                background: linear-gradient(135deg, #0D9488, #14B8A6);
                                border-radius: 10px;
                                display: flex; align-items: center; justify-content: center;
                                font-size: 22px;
                            ">👤</div>
                            <div>
                                <h2 style="margin: 0; font-size: 18px; font-weight: 700; color: #F8FAFC;">
                                    Complete Your Profile
                                </h2>
                                <p style="margin: 3px 0 0; font-size: 13px; color: #94A3B8;">
                                    Just a few quick details
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Form -->
                    <form id="profileSetupForm" style="padding: 24px 28px;">
                        <div style="margin-bottom: 16px;">
                            <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                                Full Name <span style="color: #EF4444;">*</span>
                            </label>
                            <input type="text" id="profileFullName" placeholder="e.g., Sarah Johnson" required
                                   value="${existingProfile?.fullName || ''}"
                                   style="width: 100%; padding: 11px 14px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; box-sizing: border-box;">
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px;">
                            <div>
                                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                                    Role <span style="color: #EF4444;">*</span>
                                </label>
                                <select id="profileRole" required style="width: 100%; padding: 11px 12px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; background: #fff; box-sizing: border-box;">
                                    <option value="">Select...</option>
                                    <option value="coach" ${existingProfile?.role === 'coach' ? 'selected' : ''}>Clinical Coach</option>
                                    <option value="therapist" ${existingProfile?.role === 'therapist' ? 'selected' : ''}>Therapist</option>
                                    <option value="case_manager" ${existingProfile?.role === 'case_manager' ? 'selected' : ''}>Case Manager</option>
                                    <option value="other" ${existingProfile?.role === 'other' ? 'selected' : ''}>Other</option>
                                </select>
                            </div>
                            <div>
                                <label style="display: block; font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">
                                    House
                                </label>
                                <select id="profileHouse" style="width: 100%; padding: 11px 12px; border: 1.5px solid #E2E8F0; border-radius: 8px; font-size: 14px; background: #fff; box-sizing: border-box;">
                                    <option value="">Select...</option>
                                    <option value="banyan" ${existingProfile?.house === 'banyan' ? 'selected' : ''}>Banyan</option>
                                    <option value="cove" ${existingProfile?.house === 'cove' ? 'selected' : ''}>Cove</option>
                                    <option value="meridian" ${existingProfile?.house === 'meridian' ? 'selected' : ''}>Meridian</option>
                                    <option value="prosperity" ${existingProfile?.house === 'prosperity' ? 'selected' : ''}>Prosperity</option>
                                    <option value="hedge" ${existingProfile?.house === 'hedge' ? 'selected' : ''}>Hedge</option>
                                    <option value="nest" ${existingProfile?.house === 'nest' ? 'selected' : ''}>NEST</option>
                                    <option value="multiple" ${existingProfile?.house === 'multiple' ? 'selected' : ''}>Multiple</option>
                                </select>
                            </div>
                        </div>
                        
                        <button type="submit" style="
                            width: 100%;
                            padding: 14px 24px;
                            background: linear-gradient(135deg, #0D9488, #0F766E);
                            border: none;
                            border-radius: 8px;
                            color: white;
                            font-size: 15px;
                            font-weight: 600;
                            cursor: pointer;
                            margin-top: 8px;
                            transition: all 0.2s ease;
                        ">
                            Continue →
                        </button>
                    </form>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Animate in
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                overlay.querySelector('div').style.transform = 'translateY(0)';
            });
            
            const form = overlay.querySelector('#profileSetupForm');
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                
                const profile = {
                    fullName: document.getElementById('profileFullName').value.trim(),
                    role: document.getElementById('profileRole').value,
                    house: document.getElementById('profileHouse').value,
                    setupDate: new Date().toISOString()
                };
                
                // Save profile
                localStorage.setItem(STORAGE_KEYS.PROFILE_COMPLETE, 'true');
                localStorage.setItem('ccpro-user-profile', JSON.stringify(profile));
                
                // Update the current user's full name if authManager is available
                try {
                    const currentUser = window.authManager?.getCurrentUser?.();
                    if (currentUser) {
                        currentUser.fullName = profile.fullName;
                        currentUser.role = profile.role;
                        currentUser.house = profile.house;
                    }
                } catch (e) {
                    console.warn('[FirstLogin] Could not update auth user:', e);
                }
                
                overlay.style.opacity = '0';
                setTimeout(() => {
                    overlay.remove();
                    resolve(profile);
                }, 300);
            });
        });
    }
    
    // =============================================
    // MAIN FLOW ORCHESTRATOR
    // =============================================
    
    async function runFirstLoginFlow() {
        console.log('[FirstLogin] Starting first login flow...');
        
        const username = localStorage.getItem('username') || 'User';
        
        // Hide transition overlay
        hideTransitionOverlay();
        
        // Step 1: Check if profile is complete (may already be done if they used Create Account)
        const profileComplete = localStorage.getItem(STORAGE_KEYS.PROFILE_COMPLETE) === 'true';
        let profile = null;
        
        if (!profileComplete) {
            console.log('[FirstLogin] Showing profile setup...');
            // Pre-fill with username or fullName from auth
            let existingFullName = '';
            try {
                const user = window.authManager?.getCurrentUser?.();
                existingFullName = user?.fullName || username;
            } catch (e) {
                existingFullName = username !== 'User' ? username : '';
            }
            const existingProfile = { fullName: existingFullName };
            profile = await showProfileSetup(existingProfile);
        } else {
            try {
                profile = JSON.parse(localStorage.getItem('ccpro-user-profile') || '{}');
            } catch (e) {
                profile = {};
            }
            console.log('[FirstLogin] Profile already complete, skipping setup');
        }
        
        // Update user display
        if (profile?.fullName) {
            updateUserDisplayName(profile.fullName);
        }
        
        // Step 2: Check if onboarding video is complete
        const onboardingComplete = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
        const agreementAccepted = localStorage.getItem(STORAGE_KEYS.AGREEMENT_ACCEPTED) === 'true';
        
        if (!onboardingComplete) {
            console.log('[FirstLogin] Starting onboarding video...');
            
            // Show a brief transition before video
            showVideoTransition();
            
            // Wait for OnboardingController to be ready
            await waitForOnboarding();
            
            // Small delay for smooth transition
            await new Promise(r => setTimeout(r, 800));
            
            // Hide video transition
            hideVideoTransition();
            
            // Check if OnboardingIntro is available
            if (window.OnboardingIntro) {
                // Set up listener for intro completion BEFORE starting
                const introCompletePromise = new Promise(resolve => {
                    const handler = () => {
                        window.removeEventListener('ccpro:introComplete', handler);
                        resolve();
                    };
                    window.addEventListener('ccpro:introComplete', handler);
                });
                
                const intro = new window.OnboardingIntro();
                intro.start();
                
                // Wait for intro to complete
                await introCompletePromise;
                console.log('[FirstLogin] Intro video completed');
                
            } else if (window.OnboardingController?.replayIntro) {
                window.OnboardingController.replayIntro();
                // Wait a moment for old-style replay
                await new Promise(r => setTimeout(r, 2000));
            } else {
                console.warn('[FirstLogin] Onboarding intro not available, skipping video');
                localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
            }
        }
        
        // Step 3: Show User Agreement AFTER video (before entering dashboard)
        if (!agreementAccepted) {
            console.log('[FirstLogin] Showing user agreement...');
            await showUserAgreement();
        }
        
        // Now navigate to dashboard
        navigateToDashboard();
        showNotification('Welcome to CareConnect Pro!', 'success');
        
        console.log('[FirstLogin] First login flow complete');
    }
    
    function showVideoTransition() {
        const overlay = document.createElement('div');
        overlay.id = 'videoTransition';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 20px;
            opacity: 0;
            transition: opacity 0.5s ease;
        `;
        overlay.innerHTML = `
            <div style="
                width: 80px; height: 80px;
                background: linear-gradient(135deg, #0D9488, #14B8A6);
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: breathe 2s ease-in-out infinite;
                box-shadow: 0 8px 32px rgba(13, 148, 136, 0.4);
            ">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"/>
                </svg>
            </div>
            <div style="text-align: center;">
                <p style="color: #F8FAFC; font-size: 20px; font-weight: 600; margin: 0 0 8px;">
                    Quick Tour Starting
                </p>
                <p style="color: #94A3B8; font-size: 14px; margin: 0;">
                    A 2-minute overview of your workspace
                </p>
            </div>
            <style>
                @keyframes breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            </style>
        `;
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.style.opacity = '1');
    }
    
    function hideVideoTransition() {
        const overlay = document.getElementById('videoTransition');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 400);
        }
    }
    
    function waitForOnboarding() {
        return new Promise((resolve) => {
            let attempts = 0;
            const check = setInterval(() => {
                attempts++;
                if (window.OnboardingIntro || window.OnboardingController || attempts > 50) {
                    clearInterval(check);
                    resolve();
                }
            }, 100);
        });
    }
    
    function navigateToDashboard() {
        console.log('[FirstLogin] Navigating to dashboard...');
        
        // If there's a shell navigation system, use it
        if (window.ccShell?.navigateTo) {
            window.ccShell.navigateTo('dashboard');
        } else if (typeof window.showDashboard === 'function') {
            window.showDashboard();
        } else {
            // Fallback: find and click dashboard nav
            const dashboardNav = document.querySelector('[data-nav-target="dashboard"]');
            if (dashboardNav) {
                dashboardNav.click();
            }
        }
        
        // Show success notification
        showNotification('Welcome to CareConnect Pro! 🎉', 'success');
    }
    
    function updateUserDisplayName(name) {
        // Update initials in header
        const userInitials = document.getElementById('userInitials');
        if (userInitials && name) {
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            userInitials.textContent = initials;
        }
        
        // Update user menu
        const userMenuName = document.getElementById('userMenuName');
        if (userMenuName && name) {
            userMenuName.textContent = name;
        }
    }
    
    function showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
            return;
        }
        
        // Fallback
        const notification = document.createElement('div');
        notification.className = `first-login-notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? '#10B981' : '#6366F1'};
            color: white;
            border-radius: 12px;
            font-weight: 600;
            box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            z-index: 100001;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }
    
    // =============================================
    // CHECK IF FIRST LOGIN
    // =============================================
    
    function isFirstLogin() {
        const agreementAccepted = localStorage.getItem(STORAGE_KEYS.AGREEMENT_ACCEPTED) === 'true';
        const profileComplete = localStorage.getItem(STORAGE_KEYS.PROFILE_COMPLETE) === 'true';
        const onboardingComplete = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
        
        return !agreementAccepted || !profileComplete || !onboardingComplete;
    }
    
    // =============================================
    // HOOK INTO LOGIN SUCCESS
    // =============================================
    
    function hookLoginSuccess() {
        // Listen for successful login
        window.addEventListener('ccpro-login-success', async (event) => {
            console.log('[FirstLogin] Login success detected');
            
            // Check if this is a first-time user BEFORE dashboard shows
            if (isFirstLogin()) {
                // Immediately cover the screen to prevent dashboard flash
                showTransitionOverlay();
                
                // Run the first login flow
                setTimeout(async () => {
                    await runFirstLoginFlow();
                }, 100);
            }
        });
        
        console.log('[FirstLogin] Login hook installed');
    }
    
    // =============================================
    // TRANSITION OVERLAY (prevents dashboard flash)
    // =============================================
    
    function showTransitionOverlay() {
        // Remove any existing
        const existing = document.getElementById('firstLoginTransition');
        if (existing) existing.remove();
        
        const overlay = document.createElement('div');
        overlay.id = 'firstLoginTransition';
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: linear-gradient(135deg, #0F172A, #1E293B);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            gap: 20px;
        `;
        overlay.innerHTML = `
            <div style="
                width: 60px; height: 60px;
                border: 3px solid rgba(13, 148, 136, 0.2);
                border-top-color: #14B8A6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
            <p style="color: #94A3B8; font-size: 14px; margin: 0;">Preparing your workspace...</p>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.appendChild(overlay);
    }
    
    function hideTransitionOverlay() {
        const overlay = document.getElementById('firstLoginTransition');
        if (overlay) {
            overlay.style.transition = 'opacity 0.5s ease';
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }
    }
    
    // =============================================
    // PUBLIC API
    // =============================================
    
    window.FirstLoginFlow = {
        run: runFirstLoginFlow,
        isFirstLogin,
        showUserAgreement,
        showProfileSetup,
        STORAGE_KEYS,
        
        // For testing/admin
        reset: function() {
            localStorage.removeItem(STORAGE_KEYS.AGREEMENT_ACCEPTED);
            localStorage.removeItem(STORAGE_KEYS.AGREEMENT_ACCEPTED + '-date');
            localStorage.removeItem(STORAGE_KEYS.PROFILE_COMPLETE);
            localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
            localStorage.removeItem('ccpro-user-profile');
            console.log('[FirstLogin] State reset');
        }
    };
    
    // Initialize
    hookLoginSuccess();
    console.log('[FirstLogin] Module loaded');
    
})();

