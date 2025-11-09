/**
 * Document Vault UI Enhancement
 * Adds vault button to dashboard and integrates document storage UI
 */

(function() {
    'use strict';
    
    // Wait for dependencies
    function waitForDependencies() {
        if (!window.documentVault || !window.dashboardWidgets) {
            setTimeout(waitForDependencies, 100);
            return;
        }
        
        integrateVaultUI();
    }
    
    function integrateVaultUI() {
        // Add vault button to dashboard header
        const addVaultButton = () => {
            const dashboardControls = document.querySelector('.dashboard-controls');
            if (dashboardControls && !document.querySelector('#btnDocumentVault')) {
                // Find the morning review button as reference point
                const morningReviewBtn = dashboardControls.querySelector('.btn-morning-review');
                
                const button = document.createElement('button');
                button.id = 'btnDocumentVault';
                button.className = 'btn btn-secondary';
                button.innerHTML = '🗃️ Document Vault';
                button.onclick = () => window.documentVault.showVault();
                button.title = 'View all generated documents';
                
                if (morningReviewBtn) {
                    morningReviewBtn.parentNode.insertBefore(button, morningReviewBtn.nextSibling);
                } else {
                    dashboardControls.appendChild(button);
                }
            }
        };
        
        // Add vault to quick actions
        const originalRender = window.dashboardWidgets.widgets.get('quickActions')?.render;
        if (originalRender) {
            window.dashboardWidgets.widgets.get('quickActions').render = function() {
                let html = originalRender.call(this);
                
                // Add vault action
                const vaultAction = `
                    <button class="quick-action-btn" onclick="window.documentVault.showVault()">
                        <span class="action-icon">🗃️</span>
                        <span class="action-label">Document Vault</span>
                    </button>
                `;
                
                // Insert before last closing div
                const insertPos = html.lastIndexOf('</div></div>');
                html = html.slice(0, insertPos) + vaultAction + html.slice(insertPos);
                
                return html;
            };
        }
        
        // Override document generator UI to update vault count
        const originalShowModal = window.documentGenerator.showModal;
        if (originalShowModal) {
            window.documentGenerator.showModal = async function(...args) {
                const result = originalShowModal.call(this, ...args);
                
                // Update vault button with document count
                const vaultBtn = document.querySelector('#btnDocumentVault');
                if (vaultBtn && window.documentVault) {
                    try {
                        const docs = await window.documentVault.getAllDocuments();
                        vaultBtn.innerHTML = `🗃️ Vault (${docs.length})`;
                    } catch (e) {
                        console.error('Error updating vault count:', e);
                    }
                }
                
                return result;
            };
        }
        
        // Listen for document generation to update count
        window.addEventListener('client:documentAdded', async (e) => {
            const vaultBtn = document.querySelector('#btnDocumentVault');
            if (vaultBtn && window.documentVault) {
                try {
                    const docs = await window.documentVault.getAllDocuments();
                    vaultBtn.innerHTML = `🗃️ Vault (${docs.length})`;
                } catch (e) {
                    console.error('Error updating vault count:', e);
                }
            }
        });
        
        // Add keyboard shortcut (Ctrl+V for vault)
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'v' && !e.shiftKey) {
                e.preventDefault();
                window.documentVault.showVault();
            }
        });
        
        // Initialize vault button
        setTimeout(async () => {
            addVaultButton();
            
            // Update with initial count
            const vaultBtn = document.querySelector('#btnDocumentVault');
            if (vaultBtn && window.documentVault) {
                try {
                    const docs = await window.documentVault.getAllDocuments();
                    if (docs.length > 0) {
                        vaultBtn.innerHTML = `🗃️ Vault (${docs.length})`;
                    }
                } catch (e) {
                    console.error('Error loading initial vault count:', e);
                }
            }
        }, 500);
        
        // Re-add button when dashboard refreshes
        const observer = new MutationObserver(() => {
            addVaultButton();
        });
        
        const dashboardContainer = document.querySelector('#dashboardTab');
        if (dashboardContainer) {
            observer.observe(dashboardContainer, { childList: true, subtree: true });
        }
        
        // Add styles for vault button
        if (!document.querySelector('#document-vault-ui-styles')) {
            const styles = document.createElement('style');
            styles.id = 'document-vault-ui-styles';
            styles.textContent = `
                #btnDocumentVault {
                    margin-left: 8px;
                    position: relative;
                }
                
                #btnDocumentVault.has-new::after {
                    content: '';
                    position: absolute;
                    top: -4px;
                    right: -4px;
                    width: 8px;
                    height: 8px;
                    background: #ef4444;
                    border-radius: 50%;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.7; transform: scale(1.1); }
                    100% { opacity: 1; transform: scale(1); }
                }
                
                /* Quick action styling */
                .quick-action-btn[onclick*="documentVault"] {
                    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
                }
                
                .quick-action-btn[onclick*="documentVault"]:hover {
                    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
                }
            `;
            document.head.appendChild(styles);
        }
        
        console.log('✅ Document Vault UI integrated');
    }
    
    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitForDependencies);
    } else {
        waitForDependencies();
    }
})();

