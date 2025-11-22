/**
 * CM Tracker - Client Management Tab
 * Complete implementation for the Clients tab
 */

// Create the switchTab function if it doesn't exist
if (!window.switchTab) {
    window.switchTab = function(tabName) {
        console.log(`Switching to tab: ${tabName}`);
        
        // Hide all content sections
        const sections = ['dashboard', 'clients', 'programs'];
        sections.forEach(section => {
            const el = document.getElementById(section);
            if (el) {
                el.style.display = section === tabName ? 'block' : 'none';
            }
        });
        
        // Update navigation state
        if (window.ccShell && window.ccShell.setActiveNavItem) {
            window.ccShell.setActiveNavItem(tabName);
        }
        if (window.ccShell && window.ccShell.setSectionState) {
            window.ccShell.setSectionState(tabName);
        }
        
        // Initialize tab-specific content
        if (tabName === 'dashboard') {
            if (typeof initializeDashboard === 'function') {
                initializeDashboard(true);
            }
        } else if (tabName === 'clients') {
            window.initializeCMTracker();
        } else if (tabName === 'programs') {
            if (window.mountProgramsDocsModule) {
                window.mountProgramsDocsModule();
            }
        }
        
        // Save last active tab
        localStorage.setItem('lastActiveTab', tabName);
    };
}

// Create the initializeCMTracker function for the Clients tab
window.initializeCMTracker = async function() {
    console.log('🔄 Initializing CM Tracker (Clients Tab)...');
    
    // Ensure client manager is ready
    if (!window.clientManager) {
        console.error('ClientManager not available, waiting...');
        // Wait for it to be ready
        await new Promise(resolve => {
            if (window.clientManager) {
                resolve();
            } else {
                window.addEventListener('clientManagerReady', resolve, { once: true });
            }
        });
    }
    
    // Get or create the clients container
    let clientsContainer = document.getElementById('clients');
    if (!clientsContainer) {
        // Create it if it doesn't exist
        clientsContainer = document.createElement('div');
        clientsContainer.id = 'clients';
        clientsContainer.className = 'clients-container';
        clientsContainer.style.display = 'none';
        
        // Find where to insert it
        const dashboard = document.getElementById('dashboard');
        if (dashboard && dashboard.parentNode) {
            dashboard.parentNode.insertBefore(clientsContainer, dashboard.nextSibling);
        } else {
            // Insert after the main header
            const mainContent = document.querySelector('.main-content') || 
                               document.querySelector('[data-section]') ||
                               document.body;
            mainContent.appendChild(clientsContainer);
        }
    }
    
    try {
        // Get all clients
        const clients = await window.clientManager.getAllClients();
        console.log(`Loading ${clients.length} clients into CM Tracker`);
        
        // Group clients by house
        const clientsByHouse = {};
        const unassigned = [];
        
        clients.forEach(client => {
            if (client.houseId) {
                if (!clientsByHouse[client.houseId]) {
                    clientsByHouse[client.houseId] = [];
                }
                clientsByHouse[client.houseId].push(client);
            } else {
                unassigned.push(client);
            }
        });
        
        // Build the HTML
        let html = `
            <div class="cm-tracker-header">
                <h2>Client Management Tracker</h2>
                <div class="cm-tracker-stats">
                    <span class="stat-item">
                        <span class="stat-label">Total:</span>
                        <span class="stat-value">${clients.length}</span>
                    </span>
                    <span class="stat-item">
                        <span class="stat-label">Active:</span>
                        <span class="stat-value">${clients.filter(c => !c.dischargeDate).length}</span>
                    </span>
                    <span class="stat-item">
                        <span class="stat-label">Discharged:</span>
                        <span class="stat-value">${clients.filter(c => c.dischargeDate).length}</span>
                    </span>
                    <span class="stat-item">
                        <span class="stat-label">Pre-Admission:</span>
                        <span class="stat-value">${unassigned.length}</span>
                    </span>
                </div>
            </div>
            <div class="cm-tracker-content">
        `;
        
        // Add houses in order
        const houseOrder = ['house_nest', 'house_cove', 'house_hedge', 'house_arbor', 'house_grove'];
        const houseNames = {
            'house_nest': 'NEST',
            'house_cove': 'COVE', 
            'house_hedge': 'HEDGE',
            'house_arbor': 'ARBOR',
            'house_grove': 'GROVE'
        };
        
        // Add each house
        for (const houseId of houseOrder) {
            const houseClients = clientsByHouse[houseId] || [];
            const houseName = houseNames[houseId];
            
            html += `
                <div class="house-section">
                    <div class="house-header">
                        <h3>${houseName}</h3>
                        <span class="house-count">${houseClients.length} clients</span>
                    </div>
                    <div class="client-grid">
            `;
            
            if (houseClients.length === 0) {
                html += `<div class="empty-house">No clients currently assigned</div>`;
            } else {
                // Sort clients by admission date (newest first)
                houseClients.sort((a, b) => {
                    const dateA = new Date(a.admissionDate || 0);
                    const dateB = new Date(b.admissionDate || 0);
                    return dateB - dateA;
                });
                
                houseClients.forEach(client => {
                    const daysInCare = client.admissionDate ? 
                        Math.floor((new Date() - new Date(client.admissionDate)) / (1000 * 60 * 60 * 24)) : 0;
                    
                    const statusClass = client.dischargeDate ? 'discharged' : 
                                      daysInCare > 30 ? 'long-stay' : 
                                      daysInCare > 14 ? 'mid-stay' : 'new';
                    
                    html += `
                        <div class="client-card ${statusClass}">
                            <div class="client-header">
                                <span class="client-initials">${client.initials}</span>
                                <span class="client-kipu">${client.kipuId}</span>
                            </div>
                            <div class="client-details">
                                <div class="detail-row">
                                    <span class="detail-label">Day:</span>
                                    <span class="detail-value">${daysInCare}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">CM:</span>
                                    <span class="detail-value">${client.caseManagerInitials || 'Unassigned'}</span>
                                </div>
                                <div class="detail-row">
                                    <span class="detail-label">Status:</span>
                                    <span class="detail-value">${client.dischargeDate ? 'Discharged' : 'Active'}</span>
                                </div>
                                ${client.bedAssignment ? `
                                <div class="detail-row">
                                    <span class="detail-label">Bed:</span>
                                    <span class="detail-value">${client.bedAssignment}</span>
                                </div>` : ''}
                            </div>
                        </div>
                    `;
                });
            }
            
            html += `
                    </div>
                </div>
            `;
        }
        
        // Add unassigned/pre-admission clients
        if (unassigned.length > 0) {
            html += `
                <div class="house-section pre-admission-section">
                    <div class="house-header">
                        <h3>Pre-Admission</h3>
                        <span class="house-count">${unassigned.length} clients</span>
                    </div>
                    <div class="client-grid">
            `;
            
            unassigned.forEach(client => {
                const referralDate = client.referralDate ? new Date(client.referralDate).toLocaleDateString() : 'N/A';
                const intakeDate = client.intakeScheduledDate ? new Date(client.intakeScheduledDate).toLocaleDateString() : 'Not scheduled';
                
                html += `
                    <div class="client-card pre-admission">
                        <div class="client-header">
                            <span class="client-initials">${client.initials}</span>
                            <span class="client-kipu">${client.kipuId}</span>
                        </div>
                        <div class="client-details">
                            <div class="detail-row">
                                <span class="detail-label">Referral:</span>
                                <span class="detail-value">${referralDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Intake:</span>
                                <span class="detail-value">${intakeDate}</span>
                            </div>
                            <div class="detail-row">
                                <span class="detail-label">Insurance:</span>
                                <span class="detail-value">${client.insuranceVerified ? '✓ Verified' : 'Pending'}</span>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Add styles if not already present
        if (!document.getElementById('cm-tracker-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cm-tracker-styles';
            styles.innerHTML = `
                .clients-container {
                    padding: 20px;
                    background: #f0f2f5;
                    min-height: calc(100vh - var(--app-shell-total-header, 120px));
                    margin-top: var(--app-shell-total-header, 120px);
                }
                
                .cm-tracker-header {
                    background: white;
                    padding: 24px;
                    border-radius: 16px;
                    margin-bottom: 24px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .cm-tracker-header h2 {
                    margin: 0;
                    color: #1a1a1a;
                    font-size: 24px;
                    font-weight: 600;
                }
                
                .cm-tracker-stats {
                    display: flex;
                    gap: 32px;
                }
                
                .stat-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .stat-label {
                    color: #666;
                    font-size: 14px;
                }
                
                .stat-value {
                    font-size: 20px;
                    font-weight: 600;
                    color: #6366f1;
                }
                
                .house-section {
                    background: white;
                    padding: 20px;
                    border-radius: 16px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.08);
                }
                
                .house-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 16px;
                    padding-bottom: 12px;
                    border-bottom: 2px solid #6366f1;
                }
                
                .house-header h3 {
                    margin: 0;
                    color: #1a1a1a;
                    font-size: 20px;
                    font-weight: 600;
                }
                
                .house-count {
                    color: #666;
                    font-size: 14px;
                    background: #f0f2f5;
                    padding: 4px 12px;
                    border-radius: 20px;
                }
                
                .client-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 16px;
                }
                
                .empty-house {
                    grid-column: 1 / -1;
                    text-align: center;
                    color: #999;
                    padding: 40px;
                    font-style: italic;
                }
                
                .client-card {
                    background: #f8f9fa;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 16px;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                
                .client-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(0,0,0,0.1);
                    border-color: #6366f1;
                }
                
                .client-card.new {
                    border-left: 4px solid #10b981;
                }
                
                .client-card.mid-stay {
                    border-left: 4px solid #3b82f6;
                }
                
                .client-card.long-stay {
                    border-left: 4px solid #f59e0b;
                }
                
                .client-card.discharged {
                    opacity: 0.7;
                    border-left: 4px solid #6b7280;
                }
                
                .client-card.pre-admission {
                    background: #fef3c7;
                    border-color: #fbbf24;
                    border-left: 4px solid #f59e0b;
                }
                
                .pre-admission-section {
                    background: #fffbeb;
                }
                
                .client-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                    padding-bottom: 8px;
                    border-bottom: 1px solid #e0e0e0;
                }
                
                .client-initials {
                    font-size: 20px;
                    font-weight: 700;
                    color: #6366f1;
                }
                
                .client-kipu {
                    font-size: 12px;
                    color: #999;
                    font-family: monospace;
                }
                
                .client-details {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }
                
                .detail-row {
                    display: flex;
                    justify-content: space-between;
                    font-size: 13px;
                }
                
                .detail-label {
                    color: #666;
                    font-weight: 500;
                }
                
                .detail-value {
                    color: #1a1a1a;
                    font-weight: 600;
                }
                
                @media (max-width: 768px) {
                    .cm-tracker-header {
                        flex-direction: column;
                        gap: 16px;
                    }
                    
                    .cm-tracker-stats {
                        width: 100%;
                        justify-content: space-around;
                    }
                    
                    .client-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `;
            document.head.appendChild(styles);
        }
        
        // Update the container
        clientsContainer.innerHTML = html;
        
        console.log('✅ CM Tracker initialized successfully');
        console.log(`Displayed: ${Object.keys(clientsByHouse).length} houses, ${unassigned.length} pre-admission`);
        
    } catch (error) {
        console.error('Failed to initialize CM Tracker:', error);
        clientsContainer.innerHTML = `
            <div style="padding: 40px; text-align: center; background: white; border-radius: 16px; margin: 20px;">
                <h3 style="color: #dc3545; margin-bottom: 16px;">Error Loading Clients</h3>
                <p style="color: #666; margin-bottom: 20px;">${error.message}</p>
                <button onclick="window.initializeCMTracker()" 
                        style="padding: 12px 24px; 
                               background: #6366f1; 
                               color: white; 
                               border: none; 
                               border-radius: 8px; 
                               cursor: pointer;
                               font-size: 16px;">
                    Retry
                </button>
            </div>
        `;
    }
};

// Also create refresh functions
window.refreshClientsList = window.initializeCMTracker;
window.refreshCMTracker = window.initializeCMTracker;

// Listen for client updates
if (window.clientManager) {
    window.clientManager.on?.('clients:updated', () => {
        // Only refresh if the clients tab is visible
        const clientsEl = document.getElementById('clients');
        if (clientsEl && clientsEl.style.display !== 'none') {
            window.initializeCMTracker();
        }
    });
}

// Auto-initialize when the script loads if on clients tab
document.addEventListener('DOMContentLoaded', () => {
    const lastTab = localStorage.getItem('lastActiveTab');
    if (lastTab === 'clients') {
        setTimeout(() => {
            window.initializeCMTracker();
        }, 1000);
    }
});

console.log('✅ CM Tracker module loaded');
