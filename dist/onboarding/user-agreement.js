/**
 * CareConnect Pro - User Agreement Overlay
 * Soft, scrollable card that shows the legal agreement text
 * and records a one-time acceptance per user + version.
 */

(function () {
    const AGREEMENT_VERSION = '2024-12-02'; // bump when the legal text changes
    const STORAGE_PREFIX = 'ccpro-user-agreement-';

    function getUsername() {
        try {
            return localStorage.getItem('username') || 'unknown-user';
        } catch {
            return 'unknown-user';
        }
    }

    function getRecord(username) {
        try {
            const raw = localStorage.getItem(STORAGE_PREFIX + username);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.warn('[UserAgreement] Failed to parse stored record', error);
            return null;
        }
    }

    function hasAcceptedCurrentVersion(username) {
        const rec = getRecord(username);
        return !!(rec && rec.version === AGREEMENT_VERSION && rec.accepted === true);
    }

    function saveAcceptance(username) {
        const payload = {
            version: AGREEMENT_VERSION,
            accepted: true,
            acceptedAt: new Date().toISOString()
        };
        try {
            localStorage.setItem(STORAGE_PREFIX + username, JSON.stringify(payload));
        } catch (error) {
            console.warn('[UserAgreement] Failed to save acceptance', error);
        }
    }

    function createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'ua-overlay';
        overlay.innerHTML = `
            <div class="ua-card">
                <h1>CareConnect Pro — User Agreement</h1>
                <p class="ua-subtitle">
                    Please review the User Agreement below. You can scroll to read the full text at any time.
                </p>

                <div class="ua-body">
                    <p><strong>CARECONNECT PRO</strong></p>
                    <p><strong>User Agreement</strong></p>
                    <p>Effective Date: _______________________</p>

                    <p><strong>1. Introduction</strong></p>
                    <p>
                        This User Agreement ("Agreement") is entered into between ClearHive Health ("Provider," "we," "us," or "our")
                        and the individual user ("User," "you," or "your") accessing the CareConnect Pro platform ("Platform").
                        By accessing or using the Platform, you acknowledge that you have read, understood, and agree to be bound by this Agreement.
                    </p>

                    <p>
                        CareConnect Pro is a HIPAA-compliant case management platform designed for behavioral health facilities to coordinate
                        aftercare planning and program placement tracking. This Agreement applies to all authorized users within BrentCare and
                        its affiliated programs, including but not limited to Family First Adolescent Services and Roots Renewal Ranch.
                    </p>

                    <p><strong>2. Definitions</strong></p>
                    <p>
                        "Protected Health Information" or "PHI" means any individually identifiable health information transmitted or maintained
                        in any form or medium, as defined under the Health Insurance Portability and Accountability Act of 1996 (HIPAA).
                    </p>
                    <p>
                        "Authorized User" means an individual who has been granted access credentials to the Platform by their organization's designated administrator.
                    </p>
                    <p>
                        "Facility" means the behavioral health treatment center or program that has authorized the User's access to the Platform.
                    </p>
                    <p>
                        "Client Data" means all information entered into the Platform relating to clients served by the Facility, including but not
                        limited to PHI, treatment records, and aftercare documentation.
                    </p>

                    <p><strong>3. Account Security and Credentials</strong></p>
                    <p>
                        3.1 Credential Confidentiality. You are solely responsible for maintaining the confidentiality of your login credentials,
                        including your username and password. You must not share, disclose, or transfer your credentials to any other person under any circumstances.
                    </p>
                    <p>
                        3.2 Unauthorized Access. You must immediately notify your supervisor and ClearHive Health if you become aware of any unauthorized
                        use of your account or any other breach of security. You are responsible for all activities that occur under your account.
                    </p>
                    <p>
                        3.3 Session Security. You must log out of the Platform when leaving your workstation unattended and must not access the Platform
                        from unsecured or public networks or devices unless specifically authorized by your Facility.
                    </p>
                    <p>
                        3.4 Password Requirements. You agree to maintain a strong password that meets the Platform's security requirements and to change
                        your password immediately if you suspect it has been compromised.
                    </p>

                    <p><strong>4. HIPAA Compliance Obligations</strong></p>
                    <p>
                        4.1 Compliance Commitment. You acknowledge that the Platform contains Protected Health Information and agree to comply with all applicable
                        provisions of HIPAA, the HITECH Act, and their implementing regulations.
                    </p>
                    <p>
                        4.2 Minimum Necessary Standard. You agree to access, use, and disclose only the minimum amount of PHI necessary to accomplish the intended
                        purpose of your access.
                    </p>
                    <p>
                        4.3 Prohibited Disclosures. You must not access, copy, print, download, transmit, or disclose any PHI except as necessary for your job duties
                        and as authorized by your Facility's policies and applicable law.
                    </p>
                    <p>
                        4.4 Breach Notification. You must immediately report any known or suspected breach of PHI to your supervisor and Privacy Officer.
                        A breach includes any unauthorized acquisition, access, use, or disclosure of PHI.
                    </p>
                    <p>
                        4.5 Training Requirement. You certify that you have completed HIPAA privacy and security training as required by your Facility and understand
                        your obligations regarding the protection of PHI.
                    </p>

                    <p><strong>5. Acceptable Use Policy</strong></p>
                    <p>
                        5.1 Authorized Purposes. You may use the Platform only for legitimate business purposes related to your job duties at the Facility,
                        including case management, aftercare planning, program placement tracking, and related clinical coordination activities.
                    </p>
                    <p>
                        5.2 Prohibited Activities. You must not:
                        (a) Access records of clients not assigned to your caseload without authorization;
                        (b) Use the Platform for any personal, commercial, or non-work-related purpose;
                        (c) Attempt to circumvent any security measures or access controls;
                        (d) Introduce any malicious code, virus, or harmful component;
                        (e) Copy, modify, or distribute any portion of the Platform without authorization;
                        (f) Use the Platform in any manner that violates applicable law or your Facility's policies.
                    </p>

                    <p><strong>6. Data Ownership and Intellectual Property</strong></p>
                    <p>
                        6.1 Client Data Ownership. All Client Data entered into the Platform remains the property of the Facility. ClearHive Health does not claim
                        ownership of any Client Data.
                    </p>
                    <p>
                        6.2 Platform Ownership. The Platform, including all software, designs, interfaces, databases, and documentation, is the exclusive property of
                        ClearHive Health and is protected by intellectual property laws. This Agreement does not grant you any ownership rights in the Platform.
                    </p>
                    <p>
                        6.3 License Grant. Subject to compliance with this Agreement, ClearHive Health grants you a limited, non-exclusive, non-transferable license
                        to access and use the Platform solely for authorized purposes during the term of your authorization.
                    </p>

                    <p><strong>7. Confidentiality</strong></p>
                    <p>
                        You agree to maintain the confidentiality of all information accessed through the Platform, including but not limited to Client Data,
                        clinical program information, business processes, and any proprietary features of the Platform. This confidentiality obligation survives
                        termination of your access to the Platform.
                    </p>

                    <p><strong>8. Termination of Access</strong></p>
                    <p>
                        8.1 Termination by Provider. ClearHive Health reserves the right to suspend or terminate your access to the Platform immediately and without
                        notice if you violate any provision of this Agreement, violate HIPAA or other applicable law, or if your employment or authorization with
                        the Facility ends.
                    </p>
                    <p>
                        8.2 Effect of Termination. Upon termination of access, you must immediately cease all use of the Platform and return or destroy any materials
                        containing confidential information or PHI in your possession.
                    </p>
                    <p>
                        8.3 Survival. Sections 4 (HIPAA Compliance), 6 (Data Ownership), 7 (Confidentiality), and 9 (Limitation of Liability) survive termination
                        of this Agreement.
                    </p>

                    <p><strong>9. Limitation of Liability</strong></p>
                    <p>
                        9.1 No Warranty. THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE." CLEARHIVE HEALTH MAKES NO WARRANTIES, EXPRESS OR IMPLIED, INCLUDING
                        WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                    </p>
                    <p>
                        9.2 Limitation. TO THE MAXIMUM EXTENT PERMITTED BY LAW, CLEARHIVE HEALTH SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                        CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE PLATFORM.
                    </p>

                    <p><strong>10. Modifications to Agreement</strong></p>
                    <p>
                        ClearHive Health reserves the right to modify this Agreement at any time. Users will be notified of material changes, and continued use of
                        the Platform after such notification constitutes acceptance of the modified terms.
                    </p>

                    <p><strong>11. Governing Law</strong></p>
                    <p>
                        This Agreement shall be governed by and construed in accordance with the laws of the State of Florida, without regard to its conflict of law provisions.
                    </p>

                    <p><strong>12. User Acknowledgment and Agreement</strong></p>
                    <p>
                        By signing below, I acknowledge and agree that:
                        (a) I have read and understand this User Agreement in its entirety;
                        (b) I have completed HIPAA privacy and security training as required by my Facility;
                        (c) I understand my obligations regarding the protection of Protected Health Information;
                        (d) I agree to comply with all terms and conditions of this Agreement;
                        (e) I understand that violations of this Agreement may result in immediate termination of access and may subject me to disciplinary action
                            by my Facility and potential civil or criminal liability;
                        (f) I understand that my access to the Platform may be monitored and audited for compliance purposes.
                    </p>

                    <p><strong>USER SIGNATURE</strong></p>
                    <p>Printed Name: ____________________________________________</p>
                    <p>Facility/Program: ________________________________________</p>
                    <p>Job Title: ______________________________________________</p>
                    <p>Email Address: __________________________________________</p>
                    <p>Signature: _____________________________________________</p>
                    <p>Date: _________________________________________________</p>

                    <p><strong>FOR PROVIDER USE ONLY</strong></p>
                    <p>Access Granted By: _______________________________________</p>
                    <p>Date Access Granted: _____________________________________</p>
                    <p>User Role Assigned: ______________________________________</p>
                </div>

                <div class="ua-actions">
                    <button type="button" class="ua-accept-btn">I Agree</button>
                </div>
            </div>
        `;

        return overlay;
    }

    function showAgreementCard() {
        return new Promise((resolve) => {
            const overlay = createOverlay();
            document.body.appendChild(overlay);

            const acceptBtn = overlay.querySelector('.ua-accept-btn');
            acceptBtn.addEventListener('click', () => {
                const username = getUsername();
                saveAcceptance(username);
                overlay.remove();
                resolve(true);
            });
        });
    }

    async function ensureUserAgreementAccepted() {
        const username = getUsername();
        if (hasAcceptedCurrentVersion(username)) {
            return true;
        }
        return await showAgreementCard();
    }

    if (typeof window !== 'undefined') {
        window.ensureUserAgreementAccepted = ensureUserAgreementAccepted;
    }
})();




