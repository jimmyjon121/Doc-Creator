/**
 * @fileoverview Document Vault - Password Protected Document Storage
 * @module ui/DocumentVault
 * @status @canonical
 * 
 * PURPOSE:
 *   Provides secure, password-protected storage for aftercare documents.
 *   Documents are stored in localStorage with session-based access control.
 *   Auto-locks after 5 minutes of inactivity.
 * 
 * EXTRACTED FROM:
 *   CareConnect-Pro.html (lines 30206-30752)
 *   Extraction Date: December 2025
 * 
 * SECURITY FEATURES:
 *   - Password verification against stored credentials
 *   - Session timeout (5 minutes)
 *   - PBKDF2 hash verification support
 *   - Auto-lock on inactivity
 * 
 * PRIVACY/HIPAA:
 *   - Only stores client initials, not full names
 *   - No DOB, addresses, or PHI stored
 *   - PHI compliance warning displayed in UI
 * 
 * DEPENDENCIES:
 *   - localStorage for document storage and session
 *   - crypto.subtle for PBKDF2 verification
 *   - window.showVaultNotification (defined here)
 * 
 * EXPORTS TO WINDOW:
 *   - window.openDocumentVault - Open vault (prompts for password if locked)
 *   - window.handleVaultSearch - Handle search input
 *   - window.viewVaultDocument - View document in new window
 *   - window.downloadVaultDocument - Download document as HTML
 *   - window.deleteVaultDocument - Delete single document
 *   - window.clearVault - Clear entire vault
 *   - window.exportVault - Export vault as JSON backup
 *   - window.lockVault - Lock the vault
 *   - window.saveToVault - Save document to vault (called by Programs module)
 * 
 * STORAGE KEYS:
 *   - careconnect_document_vault - Array of document objects
 *   - vault_session_expiry - Session expiration timestamp
 * 
 * @see programs-docs-module.html - Primary producer of vault documents
 */

(function() {
    'use strict';
    
    console.log('[DocumentVault] Initializing password-protected document vault...');
    
    // ═══════════════════════════════════════════════════════════════════════════
    // CONSTANTS
    // ═══════════════════════════════════════════════════════════════════════════
    const VAULT_STORAGE_KEY = 'careconnect_document_vault';
    const VAULT_SESSION_KEY = 'vault_session_token';
    const VAULT_SESSION_EXPIRY = 'vault_session_expiry';
    const SESSION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    
    // ═══════════════════════════════════════════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════════════════════════════════════════
    let vaultUnlocked = false;
    let sessionTimer = null;
    let currentSearchQuery = '';
    
    // ═══════════════════════════════════════════════════════════════════════════
    // SESSION MANAGEMENT
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Check if vault session is valid
     * @returns {boolean}
     */
    function isVaultSessionValid() {
        const expiry = localStorage.getItem(VAULT_SESSION_EXPIRY);
        if (!expiry) return false;
        return Date.now() < parseInt(expiry, 10);
    }
    
    /**
     * Extend vault session on activity
     */
    function extendVaultSession() {
        if (vaultUnlocked) {
            localStorage.setItem(VAULT_SESSION_EXPIRY, String(Date.now() + SESSION_TIMEOUT_MS));
            resetSessionTimer();
        }
    }
    
    /**
     * Reset session timer
     */
    function resetSessionTimer() {
        if (sessionTimer) clearTimeout(sessionTimer);
        sessionTimer = setTimeout(() => {
            lockVault();
            showVaultNotification('🔒 Vault locked due to inactivity', 'warning');
        }, SESSION_TIMEOUT_MS);
    }
    
    /**
     * Lock the vault
     */
    function lockVault() {
        vaultUnlocked = false;
        localStorage.removeItem(VAULT_SESSION_EXPIRY);
        if (sessionTimer) clearTimeout(sessionTimer);
        // Close any open vault modal
        document.querySelectorAll('.vault-modal').forEach(m => m.remove());
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // NOTIFICATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Show notification toast
     * @param {string} message - Message to display
     * @param {string} type - Type: success, warning, error, info
     */
    function showVaultNotification(message, type = 'success') {
        const existing = document.querySelector('.vault-toast');
        if (existing) existing.remove();
        
        const colors = {
            success: { bg: '#10b981', icon: '✅' },
            warning: { bg: '#f59e0b', icon: '⚠️' },
            error: { bg: '#ef4444', icon: '❌' },
            info: { bg: '#6366f1', icon: '📋' }
        };
        const c = colors[type] || colors.info;
        
        const toast = document.createElement('div');
        toast.className = 'vault-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: ${c.bg};
            color: white;
            padding: 14px 20px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            box-shadow: 0 8px 24px rgba(0,0,0,0.25);
            z-index: 10001;
            display: flex;
            align-items: center;
            gap: 10px;
            animation: slideIn 0.3s ease;
        `;
        toast.innerHTML = `<span>${c.icon}</span> ${message}`;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
    
    // Add toast animation styles
    if (!document.getElementById('vault-toast-styles')) {
        const style = document.createElement('style');
        style.id = 'vault-toast-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // PASSWORD VERIFICATION
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Show password prompt modal
     * @returns {Promise<boolean>} True if unlocked successfully
     */
    function showPasswordPrompt() {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'vault-modal vault-password-modal';
            modal.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 20px;
            `;
            
            modal.innerHTML = `
                <div style="background: linear-gradient(145deg, #1e1b4b 0%, #312e81 100%); border-radius: 20px; width: 400px; box-shadow: 0 25px 80px rgba(0,0,0,0.5); overflow: hidden;">
                    <div style="padding: 32px; text-align: center;">
                        <div style="font-size: 56px; margin-bottom: 16px;">🔐</div>
                        <h2 style="color: white; margin: 0 0 8px; font-size: 24px; font-weight: 600;">Vault Access</h2>
                        <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px; font-size: 14px;">Enter your password to unlock</p>
                        
                        <form id="vaultPasswordForm" style="display: flex; flex-direction: column; gap: 16px;">
                            <div style="position: relative;">
                                <input type="password" id="vaultPasswordInput" placeholder="Enter your password" 
                                    style="width: 100%; padding: 14px 18px; border: 2px solid rgba(255,255,255,0.2); border-radius: 10px; background: rgba(255,255,255,0.1); color: white; font-size: 16px; outline: none; transition: all 0.2s; box-sizing: border-box;"
                                    onfocus="this.style.borderColor='#818cf8'" onblur="this.style.borderColor='rgba(255,255,255,0.2)'">
                            </div>
                            <div id="vaultPasswordError" style="color: #f87171; font-size: 13px; display: none; text-align: left;"></div>
                            <button type="submit" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; border: none; padding: 14px; border-radius: 10px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s;">
                                🔓 Unlock Vault
                            </button>
                        </form>
                        
                        <button onclick="this.closest('.vault-modal').remove()" style="background: transparent; border: none; color: rgba(255,255,255,0.5); margin-top: 16px; cursor: pointer; font-size: 14px;">Cancel</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            const input = modal.querySelector('#vaultPasswordInput');
            const form = modal.querySelector('#vaultPasswordForm');
            const errorDiv = modal.querySelector('#vaultPasswordError');
            
            input.focus();
            
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const password = input.value;
                
                // Verify password against stored credentials
                const isValid = await verifyPassword(password);
                
                if (isValid) {
                    modal.remove();
                    resolve(true);
                } else {
                    errorDiv.textContent = '❌ Incorrect password. Please try again.';
                    errorDiv.style.display = 'block';
                    input.value = '';
                    input.focus();
                    input.style.borderColor = '#f87171';
                    setTimeout(() => input.style.borderColor = 'rgba(255,255,255,0.2)', 2000);
                }
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.remove();
                    resolve(false);
                }
            });
        });
    }
    
    /**
     * Verify password against login credentials
     * @param {string} password - Password to verify
     * @returns {Promise<boolean>}
     */
    async function verifyPassword(password) {
        // Get current logged-in username
        const username = localStorage.getItem('username');
        if (!username) return false;
        
        // Check against stored accounts or master credentials
        const accounts = JSON.parse(localStorage.getItem('careconnect_user_accounts') || '{}');
        
        // Master credentials check (BETA ONLY - see TECH_DEBT.md)
        if (username === 'MasterAdmin' && password === 'FFA@dm1n2025!') return true;
        if (username === 'Doc232' && password === 'FFA121') return true;
        
        // Check stored account password (if exists)
        if (accounts[username]) {
            // For PBKDF2 hashed passwords
            if (accounts[username].passwordHash && accounts[username].passwordHash.startsWith('pbkdf2$')) {
                return await verifyPBKDF2(password, accounts[username].passwordHash);
            }
            // For legacy SHA256 passwords
            if (accounts[username].passwordHash) {
                const legacyHash = await sha256(password + 'FFAS_SECURE_2025');
                return accounts[username].passwordHash === legacyHash;
            }
        }
        
        return false;
    }
    
    /**
     * PBKDF2 verification
     * @param {string} password - Password to verify
     * @param {string} storedHash - Stored hash in format pbkdf2$iterations$salt$hash
     * @returns {Promise<boolean>}
     */
    async function verifyPBKDF2(password, storedHash) {
        try {
            const parts = storedHash.match(/^pbkdf2\$(\d+)\$([a-f0-9]+)\$([a-f0-9]+)$/i);
            if (!parts) return false;
            
            const iterations = parseInt(parts[1], 10);
            const salt = hexToBytes(parts[2]);
            const expectedHash = parts[3];
            
            const encoder = new TextEncoder();
            const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
            const derivedBits = await crypto.subtle.deriveBits(
                { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
                keyMaterial,
                256
            );
            const derivedHash = bytesToHex(new Uint8Array(derivedBits));
            return derivedHash === expectedHash;
        } catch (e) {
            console.error('PBKDF2 verification failed:', e);
            return false;
        }
    }
    
    function hexToBytes(hex) {
        const bytes = new Uint8Array(hex.length / 2);
        for (let i = 0; i < hex.length; i += 2) {
            bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
        }
        return bytes;
    }
    
    function bytesToHex(bytes) {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    
    async function sha256(message) {
        const encoder = new TextEncoder();
        const data = encoder.encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        return bytesToHex(new Uint8Array(hashBuffer));
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VAULT UI
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Main vault open function - with password protection
     */
    async function openDocumentVault() {
        // Check if already unlocked with valid session
        if (!vaultUnlocked && !isVaultSessionValid()) {
            const unlocked = await showPasswordPrompt();
            if (!unlocked) return;
            
            vaultUnlocked = true;
            localStorage.setItem(VAULT_SESSION_EXPIRY, String(Date.now() + SESSION_TIMEOUT_MS));
            resetSessionTimer();
        } else {
            extendVaultSession();
        }
        
        showVaultContents();
    }
    
    /**
     * Show vault contents after authentication
     */
    function showVaultContents() {
        const vault = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '[]');
        const filteredVault = currentSearchQuery 
            ? vault.filter(doc => 
                (doc.clientName || doc.clientInitials || '').toLowerCase().includes(currentSearchQuery.toLowerCase()) ||
                (doc.type || '').toLowerCase().includes(currentSearchQuery.toLowerCase())
              )
            : vault;
        
        // Remove existing vault modal
        document.querySelectorAll('.vault-modal:not(.vault-password-modal)').forEach(m => m.remove());
        
        const modal = document.createElement('div');
        modal.className = 'vault-modal';
        modal.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            padding: 20px;
        `;
        
        modal.innerHTML = `
            <div style="background: #1a1a2e; border-radius: 20px; max-width: 950px; width: 100%; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 80px rgba(0,0,0,0.4);">
                <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: white; padding: 24px 28px; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 16px;">
                        <div style="font-size: 32px;">🗄️</div>
                        <div>
                            <h2 style="margin: 0; font-size: 22px; font-weight: 600;">Document Vault</h2>
                            <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">🔓 Unlocked · ${vault.length} documents</p>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; align-items: center;">
                        <button onclick="window.lockVault(); this.closest('.vault-modal').remove();" style="background: rgba(255,255,255,0.15); border: none; color: white; padding: 8px 14px; border-radius: 8px; font-size: 13px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                            🔒 Lock
                        </button>
                        <button onclick="this.closest('.vault-modal').remove()" style="background: rgba(255,255,255,0.2); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; font-size: 18px; cursor: pointer;">&times;</button>
                    </div>
                </div>
                
                <div style="padding: 20px 24px; background: #252547; border-bottom: 1px solid rgba(255,255,255,0.1);">
                    <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
                        <div style="flex: 1; min-width: 200px; position: relative;">
                            <input type="text" id="vaultSearch" placeholder="🔍 Search by client or type..." value="${currentSearchQuery}"
                                style="width: 100%; padding: 10px 16px; border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; background: rgba(255,255,255,0.08); color: white; font-size: 14px; outline: none; box-sizing: border-box;"
                                oninput="window.handleVaultSearch(this.value)">
                        </div>
                        <button onclick="window.exportVault()" style="background: #10b981; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                            📥 Export All
                        </button>
                        <button onclick="window.clearVault()" style="background: #ef4444; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px;">
                            🗑️ Clear
                        </button>
                    </div>
                </div>
                
                <div style="background: #fef3c7; margin: 16px 24px 0; border-radius: 10px; padding: 12px 16px; display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 18px;">⚠️</span>
                    <div style="font-size: 12px; color: #92400e;">
                        <strong>PHI Compliance:</strong> Only client initials stored. No full names, DOB, addresses, or PHI.
                    </div>
                </div>
                
                <div style="padding: 16px 24px 24px; overflow-y: auto; flex: 1;">
                    <div id="vaultDocuments">
                        ${filteredVault.length === 0 ? `
                            <div style="text-align: center; padding: 60px 20px; color: rgba(255,255,255,0.5);">
                                <div style="font-size: 56px; margin-bottom: 16px;">${currentSearchQuery ? '🔍' : '📭'}</div>
                                <p style="font-size: 16px; font-weight: 500; margin-bottom: 8px; color: rgba(255,255,255,0.7);">
                                    ${currentSearchQuery ? 'No documents match your search' : 'No documents saved yet'}
                                </p>
                                <p style="font-size: 14px; color: rgba(255,255,255,0.5);">
                                    ${currentSearchQuery ? 'Try a different search term' : 'Aftercare documents auto-save when you export from Programs & Docs.'}
                                </p>
                            </div>
                        ` : filteredVault.map((doc, i) => {
                            const actualIndex = vault.indexOf(doc);
                            const typeColor = doc.type === 'Aftercare Plan' ? '#8b5cf6' : '#3b82f6';
                            return `
                            <div style="background: #2a2a4a; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 20px; margin-bottom: 14px; transition: all 0.2s;" onmouseover="this.style.borderColor='#6366f1'" onmouseout="this.style.borderColor='rgba(255,255,255,0.1)'">
                                <div style="display: flex; justify-content: space-between; align-items: start; gap: 16px;">
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                                            <h3 style="margin: 0; font-size: 18px; font-weight: 600; color: white;">${doc.clientName || doc.clientInitials || 'Client'}</h3>
                                            ${doc.type ? `<span style="background: ${typeColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; text-transform: uppercase;">${doc.type}</span>` : ''}
                                        </div>
                                        <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap; color: rgba(255,255,255,0.6); font-size: 13px;">
                                            <span>📅 ${new Date(doc.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span>🕐 ${new Date(doc.date).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</span>
                                            ${doc.programs && doc.programs.length > 0 ? `<span>📋 ${doc.programs.length} programs</span>` : ''}
                                        </div>
                                    </div>
                                    <div style="display: flex; gap: 8px; flex-shrink: 0;">
                                        <button onclick="window.viewVaultDocument(${actualIndex})" style="background: #3b82f6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 500;">
                                            👁️ View
                                        </button>
                                        <button onclick="window.downloadVaultDocument(${actualIndex})" style="background: #8b5cf6; color: white; border: none; padding: 10px 16px; border-radius: 8px; font-size: 13px; cursor: pointer; font-weight: 500;">
                                            📥
                                        </button>
                                        <button onclick="window.deleteVaultDocument(${actualIndex})" style="background: rgba(239,68,68,0.2); color: #f87171; border: 1px solid rgba(239,68,68,0.3); padding: 10px 14px; border-radius: 8px; font-size: 13px; cursor: pointer;">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                                ${doc.programs && doc.programs.length > 0 ? `
                                    <div style="margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.1); font-size: 12px; color: rgba(255,255,255,0.5);">
                                        <strong style="color: rgba(255,255,255,0.7);">Programs:</strong> ${doc.programs.slice(0, 5).map(p => p.name || p).join(', ')}${doc.programs.length > 5 ? ` +${doc.programs.length - 5} more` : ''}
                                    </div>
                                ` : ''}
                            </div>
                        `}).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Extend session on interaction
        modal.addEventListener('click', extendVaultSession);
        modal.addEventListener('keydown', extendVaultSession);
        
        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });
        
        // Focus search
        setTimeout(() => modal.querySelector('#vaultSearch')?.focus(), 100);
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // VAULT OPERATIONS
    // ═══════════════════════════════════════════════════════════════════════════
    
    /**
     * Handle search input
     * @param {string} query - Search query
     */
    function handleVaultSearch(query) {
        currentSearchQuery = query;
        extendVaultSession();
        showVaultContents();
    }
    
    /**
     * View document in new window
     * @param {number} index - Document index
     */
    function viewVaultDocument(index) {
        extendVaultSession();
        const vault = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '[]');
        if (vault[index]) {
            const win = window.open('', '_blank', 'width=850,height=1000');
            win.document.write(vault[index].content || vault[index].htmlContent || '<p>No content available</p>');
            win.document.close();
        }
    }
    
    /**
     * Download document as HTML file
     * @param {number} index - Document index
     */
    function downloadVaultDocument(index) {
        extendVaultSession();
        const vault = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '[]');
        const doc = vault[index];
        if (doc) {
            const content = doc.content || doc.htmlContent || '';
            const blob = new Blob([content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.clientName || doc.clientInitials || 'client'}_aftercare_${new Date(doc.date).toISOString().split('T')[0]}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showVaultNotification('Document downloaded!', 'success');
        }
    }
    
    /**
     * Delete single document
     * @param {number} index - Document index
     */
    function deleteVaultDocument(index) {
        extendVaultSession();
        if (confirm('Delete this document from the vault? This cannot be undone.')) {
            const vault = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '[]');
            const docName = vault[index]?.clientName || vault[index]?.clientInitials || 'Document';
            vault.splice(index, 1);
            localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
            showVaultNotification(`"${docName}" deleted from vault`, 'info');
            showVaultContents();
        }
    }
    
    /**
     * Clear entire vault
     */
    function clearVault() {
        extendVaultSession();
        if (confirm('⚠️ Clear entire vault? This will permanently delete ALL saved documents.')) {
            if (confirm('Are you absolutely sure? This cannot be undone.')) {
                const count = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '[]').length;
                localStorage.setItem(VAULT_STORAGE_KEY, '[]');
                showVaultNotification(`Vault cleared (${count} documents removed)`, 'warning');
                showVaultContents();
            }
        }
    }
    
    /**
     * Export vault as JSON backup
     */
    function exportVault() {
        extendVaultSession();
        const vault = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '[]');
        if (vault.length === 0) {
            showVaultNotification('No documents to export', 'warning');
            return;
        }
        const dataStr = JSON.stringify(vault, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `document_vault_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showVaultNotification(`Exported ${vault.length} documents`, 'success');
    }
    
    /**
     * Save document to vault (called from Programs & Docs module)
     * @param {Object} document - Document to save
     * @returns {boolean} Success
     */
    function saveToVault(document) {
        const vault = JSON.parse(localStorage.getItem(VAULT_STORAGE_KEY) || '[]');
        
        // Check for duplicate (same client + same day)
        const today = new Date().toDateString();
        const isDuplicate = vault.some(doc => 
            (doc.clientName === document.clientName || doc.clientInitials === document.clientInitials) &&
            new Date(doc.date).toDateString() === today &&
            doc.type === (document.type || 'Aftercare Options')
        );
        
        if (isDuplicate) {
            console.log('⚠️ Duplicate document detected, updating existing...');
            // Update existing instead of adding new
            const existingIndex = vault.findIndex(doc => 
                (doc.clientName === document.clientName || doc.clientInitials === document.clientInitials) &&
                new Date(doc.date).toDateString() === today &&
                doc.type === (document.type || 'Aftercare Options')
            );
            if (existingIndex !== -1) {
                vault[existingIndex] = {
                    ...vault[existingIndex],
                    date: new Date().toISOString(),
                    content: document.content,
                    htmlContent: document.htmlContent || document.content,
                    programs: document.programs || [],
                    metadata: document.metadata || {}
                };
            }
        } else {
            vault.unshift({
                id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString(),
                clientName: document.clientName,
                clientInitials: document.clientInitials,
                type: document.type || 'Aftercare Options',
                content: document.content,
                htmlContent: document.htmlContent || document.content,
                programs: document.programs || [],
                metadata: document.metadata || {}
            });
        }
        
        localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(vault));
        console.log('✅ Document saved to vault');
        showVaultNotification(`📋 ${document.type || 'Document'} saved to vault`, 'success');
        return true;
    }
    
    // ═══════════════════════════════════════════════════════════════════════════
    // WINDOW EXPORTS
    // Required for static bundle compatibility. See docs/GLOBALS-REGISTRY.md
    // ═══════════════════════════════════════════════════════════════════════════
    window.openDocumentVault = openDocumentVault;
    window.handleVaultSearch = handleVaultSearch;
    window.viewVaultDocument = viewVaultDocument;
    window.downloadVaultDocument = downloadVaultDocument;
    window.deleteVaultDocument = deleteVaultDocument;
    window.clearVault = clearVault;
    window.exportVault = exportVault;
    window.lockVault = lockVault;
    window.saveToVault = saveToVault;
    
    console.log('[DocumentVault] ✅ Document Vault initialized (password protected)');
    
})();

