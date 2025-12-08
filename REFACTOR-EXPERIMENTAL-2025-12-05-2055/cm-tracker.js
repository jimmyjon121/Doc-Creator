/**
 * @fileoverview Client Management Tab - Comprehensive Grid/List View
 * @module ui/CMTracker
 * @status @canonical
 * 
 * CONSOLIDATED FROM:
 *   - Original cm-tracker.js (simple fallback, 503 lines)
 *   - CareConnect-Pro.html inline block (lines 15891-19840)
 *   Consolidation Date: December 7, 2025
 * 
 * PURPOSE:
 *   Renders the "Clients" tab with house navigation, client tables,
 *   milestone tracking, export functionality, and Programs/Docs integration.
 * 
 * DEPENDENCIES:
 *   - window.dbManager (IndexedDBManager)
 *   - window.clientManager (ClientManager)
 *   - window.housesManager (HousesManager)
 *   - window.HousesManager (Class for deferred init)
 *   - window.milestonesManager (MilestonesManager)
 *   - window.aftercareManager (AftercareManager)
 *   - window.switchTab (defined in CareConnect-Pro.html)
 * 
 * EXPORTS TO WINDOW:
 *   - window.initializeCMTracker - Initialize clients tab
 *   - window.refreshClientsList - Refresh client list (alias)
 *   - window.refreshCMTracker - Refresh tracker (alias)
 *   - window.switchToHouse - Switch to a house tab
 *   - window.filterClients - Filter clients by status
 *   - window.selectClient - Select a client
 *   - window.editClient - Edit client details
 *   - window.toggleMilestone - Toggle milestone completion
 *   - window.exportCurrentView - Export current house to CSV
 *   - window.toggleFavoriteProgram - Toggle program favorite
 *   - window.showAddClientModal - Show add client modal
 *   - window.handleEditClient - Handle client edit form
 *   - window.dischargeClientModal - Show discharge modal
 *   - Plus ~40 other client management functions
 */
// CM Tracker Functions (use var to allow re-declaration from duplicate code blocks)
var currentHouseId = currentHouseId || 'house_nest';
var currentClientFilter = currentClientFilter || 'active';
var cmTrackerInitialized = cmTrackerInitialized || false;

// Initialize CM Tracker
async function initializeCMTracker() {
    try {
        // Check if HousesManager class is available (may not be loaded yet)
        if (typeof HousesManager === 'undefined') {
            console.warn('[CM Tracker] HousesManager not loaded yet, deferring initialization...');
            setTimeout(initializeCMTracker, 500);
            return;
        }
        
        // Check if managers are available
        if (!window.dbManager) {
            console.error('DBManager not available for CM Tracker');
            return;
        }
        
        // Initialize houses manager
        if (!window.housesManager) {
            window.housesManager = new HousesManager(window.dbManager);
            await window.housesManager.initialize();
        }
        housesManager = window.housesManager;
        
        // Initialize milestones manager
        if (!window.milestonesManager) {
            window.milestonesManager = new MilestonesManager(window.dbManager);
        }
        milestonesManager = window.milestonesManager;
        
        // Initialize aftercare manager
        if (!window.aftercareManager) {
            window.aftercareManager = new AftercareManager(window.dbManager);
        }
        aftercareManager = window.aftercareManager;
        
        // Initialize houses in database
        await window.dbManager.initializeHouses();
        
        // Build house navigation
        await buildHouseNavigation();
        
        // Load initial house
        await loadHouseView(currentHouseId);
        
        cmTrackerInitialized = true;
        console.log('✅ CM Tracker initialized');
    } catch (error) {
        console.error('Failed to initialize CM Tracker:', error);
    }
}

// Build house navigation tabs
async function buildHouseNavigation() {
    const houseTabs = document.getElementById('houseTabs');
    if (!houseTabs) return;
    
    houseTabs.innerHTML = '';
    
    // Get houses
    const houses = await housesManager.getActiveHouses();
    
    // Create tabs for each house
    for (let i = 0; i < houses.length; i++) {
        const house = houses[i];
        const clientCount = await housesManager.getClientCount(house.id, true);
        
        const tab = document.createElement('button');
        tab.className = 'house-tab';
        if (i === 0) tab.className += ' active'; // First house is active by default
        tab.id = `houseTab_${house.id}`;
        tab.onclick = () => switchToHouse(house.id);
        
        tab.innerHTML = `
            ${house.name}
            <span class="client-count">${clientCount}</span>
        `;
        
        houseTabs.appendChild(tab);
    }
    
    // Add discharged clients tab
    const dischargedCount = await getDischargedClientsCount();
    const dischargedTab = document.createElement('button');
    dischargedTab.className = 'house-tab';
    dischargedTab.id = 'houseTab_discharged';
    dischargedTab.onclick = () => switchToHouse('discharged');
    dischargedTab.innerHTML = `
        Discharged
        <span class="client-count">${dischargedCount}</span>
    `;
    houseTabs.appendChild(dischargedTab);
}

// Get discharged clients count
async function getDischargedClientsCount() {
    if (!window.clientManager) return 0;
    const discharged = await window.clientManager.getDischargedClients();
    return discharged.length;
}

// Switch to a house
async function switchToHouse(houseId) {
    currentHouseId = houseId;
    
    // Update active tab
    document.querySelectorAll('.house-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    const activeTab = document.getElementById(`houseTab_${houseId}`);
    if (activeTab) activeTab.classList.add('active');
    
    // Load house view
    await loadHouseView(houseId);
}

// Load house view
async function loadHouseView(houseId) {
    const container = document.getElementById('houseClientsList');
    if (!container) return;
    
    try {
        let clients;
        let houseName;
        
        if (houseId === 'discharged') {
            clients = await window.clientManager.getDischargedClients();
            houseName = 'Discharged Clients';
        } else {
            const house = housesManager.getHouseById(houseId);
            if (!house) return;
            houseName = house.name;
            clients = await window.clientManager.getClientsByHouse(houseId, currentClientFilter === 'active');
        }
        
        if (clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">🏠</div>
                    <div class="empty-state-title">No clients in ${houseName}</div>
                    <div class="empty-state-text">Click "Add Client" to add a new client to this house</div>
                </div>
            `;
        } else {
            container.innerHTML = await buildClientsTable(clients, houseName);
        }
    } catch (error) {
        console.error('Failed to load house view:', error);
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <div class="empty-state-title">Error loading clients</div>
                <div class="empty-state-text">${error.message}</div>
            </div>
        `;
    }
}

// Build clients table
async function buildClientsTable(clients, houseName) {
    const table = document.createElement('div');
    table.className = 'clients-table-container';
    
    // Add export controls
    let tableHTML = `
        <div class="table-controls" style="margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 14px; color: #6b7280;">
                Showing ${clients.length} client${clients.length !== 1 ? 's' : ''} in ${houseName}
            </div>
            <div style="display: flex; gap: 10px;">
                <button onclick="exportCurrentView()" class="export-btn" style="padding: 8px 16px; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                    📄 Export to CSV
                </button>
                <button onclick="exportAllData()" class="export-btn" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 6px;">
                    📊 Export All Houses
                </button>
            </div>
        </div>
        <table class="clients-table">
            <thead>
                <tr>
                    <th>Name</th>
                    <th>Kipu ID</th>
                    <th>Days</th>
                    <th>Coach</th>
                    <th>CM</th>
                    <th>Thread</th>
                    <th>Options</th>
                    <th>Packet</th>
                    <th>Aftercare</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    for (const client of clients) {
        const daysInCare = window.clientManager.calculateDaysInCare(client);
        
        // Apply CSS class based on days in care
        let daysClass = '';
        if (daysInCare === 13) {
            daysClass = 'days-13';
        } else if (daysInCare === 14) {
            daysClass = 'days-14';
        } else if (daysInCare >= 16) {
            daysClass = 'days-16plus';
        }
        
        // Get milestones
        let milestones = [];
        try {
            milestones = await milestonesManager.getClientMilestones(client.id);
        } catch (e) {
            // Client may not have milestones initialized yet
        }
        
        // Get specific milestone statuses
        const threadMilestone = milestones.find(m => m.milestone === 'aftercare_thread');
        const optionsMilestone = milestones.find(m => m.milestone === 'options_doc');
        const packetMilestone = milestones.find(m => m.milestone === 'discharge_packet');
        
        const threadDisplay = threadMilestone 
            ? milestonesManager.getMilestoneDisplayStatus(threadMilestone, daysInCare)
            : { icon: '⏸', class: 'pending', tooltip: 'Not Started' };
            
        const optionsDisplay = optionsMilestone
            ? milestonesManager.getMilestoneDisplayStatus(optionsMilestone, daysInCare)
            : { icon: '⏸', class: 'pending', tooltip: 'Not Started' };
            
        const packetDisplay = packetMilestone
            ? milestonesManager.getMilestoneDisplayStatus(packetMilestone, daysInCare)
            : { icon: '⏸', class: 'pending', tooltip: 'Not Started' };
        
        // Get aftercare options
        let aftercareOptions = [];
        let aftercareDisplay = 'No options';
        try {
            aftercareOptions = await aftercareManager.getClientAftercareOptions(client.id);
            if (aftercareOptions.length > 0) {
                const summary = aftercareManager.getAftercareSummary(aftercareOptions);
                aftercareDisplay = summary.displayString;
            }
        } catch (e) {
            // Client may not have aftercare options yet
        }
        
        tableHTML += `
            <tr>
                <td><span class="client-initials" onclick="viewClientDetails('${client.id}')">${client.initials}</span></td>
                <td>${client.kipuId}</td>
                <td class="days-in-care ${daysClass}">${daysInCare}</td>
                <td class="team-member">${client.clinicalCoachInitials || '-'}</td>
                <td class="team-member">${client.caseManagerInitials || '-'}</td>
                <td>
                    <span class="milestone-indicator ${threadDisplay.class}" 
                          title="${threadDisplay.tooltip}"
                          onclick="toggleMilestone('${client.id}', 'aftercare_thread')">
                        ${threadDisplay.icon}
                    </span>
                </td>
                <td>
                    <span class="milestone-indicator ${optionsDisplay.class}" 
                          title="${optionsDisplay.tooltip}"
                          onclick="toggleMilestone('${client.id}', 'options_doc')">
                        ${optionsDisplay.icon}
                    </span>
                </td>
                <td>
                    <span class="milestone-indicator ${packetDisplay.class}" 
                          title="${packetDisplay.tooltip}"
                          onclick="toggleMilestone('${client.id}', 'discharge_packet')">
                        ${packetDisplay.icon}
                    </span>
                </td>
                <td><span class="aftercare-status" style="font-size: 12px;">${aftercareDisplay}</span></td>
                <td class="action-buttons">
                    <button class="action-btn" onclick="viewClientDetails('${client.id}')">View</button>
                    <button class="action-btn" onclick="editClient('${client.id}')">Edit</button>
                    <button class="action-btn" onclick="generateClientDocument('${client.id}')">Doc</button>
                </td>
            </tr>
        `;
    }
    
    tableHTML += `
            </tbody>
        </table>
    `;
    
    return tableHTML;
}

// Export current view to CSV
async function exportCurrentView() {
    try {
        // Load export module if not already loaded
        if (!window.CMTrackerExport) {
            const script = document.createElement('script');
            script.src = 'cm-tracker-export.js';
            document.head.appendChild(script);
            
            // Wait for script to load
            await new Promise(resolve => {
                script.onload = resolve;
                setTimeout(resolve, 2000); // Timeout fallback
            });
        }
        
        // Initialize export module if not loaded
        if (!window.cmTrackerExport) {
            window.cmTrackerExport = new CMTrackerExport();
        }
        
        // Export current house
        const options = {
            houseId: currentHouseId === 'discharged' ? null : currentHouseId,
            includeArchived: currentHouseId === 'discharged'
        };
        
        const result = await window.cmTrackerExport.exportToCSV(options);
        
        if (result.success) {
            showAlert(`Exported ${result.rowCount - 1} clients successfully`, 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Export failed:', error);
        showAlert('Failed to export data: ' + error.message, 'error');
    }
}

// Export all data to CSV
async function exportAllData() {
    try {
        // Load export module if not already loaded
        if (!window.CMTrackerExport) {
            const script = document.createElement('script');
            script.src = 'cm-tracker-export.js';
            document.head.appendChild(script);
            
            // Wait for script to load
            await new Promise(resolve => {
                script.onload = resolve;
                setTimeout(resolve, 2000); // Timeout fallback
            });
        }
        
        // Initialize export module if not loaded
        if (!window.cmTrackerExport) {
            window.cmTrackerExport = new CMTrackerExport();
        }
        
        // Export all houses
        const result = await window.cmTrackerExport.exportToCSV({
            includeArchived: true
        });
        
        if (result.success) {
            showAlert(`Exported ${result.rowCount - 1} clients successfully`, 'success');
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Export failed:', error);
        showAlert('Failed to export data: ' + error.message, 'error');
    }
}

// Tab navigation stub - drawer navigation is now used
function ensureTabNavigationVisible() {
    // No-op: drawer navigation replaced tab navigation
}

// Initialize Client Tracker (for backward compatibility)
function initializeClientTracker() {
    // Ensure tab navigation is visible first
    ensureTabNavigationVisible();
    
    // Initialize CM Tracker when client tab is opened
    if (!cmTrackerInitialized) {
        initializeCMTracker();
    }
}

// Manual initialization function
async function initializeClientManagerManually() {
    try {
        console.log('Attempting manual ClientManager initialization...');
        
        // Check if dbManager exists, if not create it
        if (!window.dbManager) {
            console.log('Creating IndexedDBManager...');
            window.dbManager = new IndexedDBManager();
            await window.dbManager.init();
        }
        
        // Create ClientManager
        console.log('Creating ClientManager...');
        window.clientManager = new ClientManager(window.dbManager);
        await window.clientManager.initialize();
        
        console.log('✅ ClientManager manually initialized:', window.clientManager);
        
        // Initialize the UI
        initializeClientTracker();
        
        // Hide the warning
        const statusDiv = document.getElementById('clientManagerStatus');
        if (statusDiv) {
            statusDiv.style.display = 'none';
        }
        
        showAlert('Client manager initialized successfully!', 'success');
    } catch (error) {
        console.error('Failed to manually initialize ClientManager:', error);
        showAlert('Failed to initialize client manager: ' + error.message, 'error');
    }
}

// Handle client manager events
function handleClientEvent(event, data) {
    switch (event) {
        case 'current-client-changed':
            updateCurrentClientDisplay();
            refreshSelectedPrograms();
            break;
        case 'client-created':
        case 'client-updated':
            refreshClientsList();
            if (data.id === clientManager.getCurrentClient()?.id) {
                updateCurrentClientDisplay();
            }
            break;
    }
}

// Module path - the module file is copied to dist as programs-docs-module.html during build
// When served from dist/, use the same directory; when from root, use dist/ prefix
const PROGRAMS_DOCS_MODULE_PATH = (() => {
    const pathname = (window.location.pathname || '').toLowerCase();
    const fileName = pathname.split('/').pop() || '';

    // If served from any packaged bundle (dist, CURRENT-VERSION-v12, etc.), keep module in same directory
    if (
        fileName.startsWith('careconnect-pro') ||
        pathname.includes('/dist/') ||
        pathname.includes('/current-version-v12/')
    ) {
        return 'programs-docs-module.html';
    }

    // Legacy fallback – assume module lives under dist/
    return 'dist/programs-docs-module.html';
})();
let programsDocsLegacyNoticeShown = false;

function shouldUseProgramsDocs() {
    try {
        if (window.featureFlags && typeof window.featureFlags.isEnabled === 'function') {
            return window.featureFlags.isEnabled('programsV2Core') !== false;
        }
    } catch (error) {
        console.warn('Programs & Docs feature flag unavailable:', error);
    }
    // Default to true if feature flags not available
    return true;
}

// Make function globally available immediately
window.shouldUseProgramsDocs = shouldUseProgramsDocs;

async function mountProgramsDocsModule(forceReload = false) {
    const container = document.getElementById('programsDocsContainer');
    const loader = document.getElementById('programsDocsLoader');
    const errorEl = document.getElementById('programsDocsError');

    if (!container || !loader) {
        console.warn('Programs & Docs container missing from shell.');
        return false;
    }

    if (!shouldUseProgramsDocs()) {
        revealLegacyProgramsNotice('feature-disabled');
        return false;
    }

    if (window.__programsDocsMountPromise && !forceReload) {
        return window.__programsDocsMountPromise;
    }

    loader.hidden = false;
    if (errorEl) {
        errorEl.hidden = true;
    }
    container.hidden = true;

    const fetchUrl = forceReload
        ? `${PROGRAMS_DOCS_MODULE_PATH}?cacheBust=${Date.now()}`
        : PROGRAMS_DOCS_MODULE_PATH;

    console.log('[Programs & Docs] Loading module from:', fetchUrl);
    console.log('[Programs & Docs] Current pathname:', window.location.pathname);

    const mountPromise = (async () => {
        try {
            let response = await fetch(fetchUrl, { cache: 'no-store' });
            if (!response.ok) {
                // Fallback: if root-level path fails with 404, try CURRENT-VERSION-v12/ prefix
                const is404 = response.status === 404;
                const isRootPath = !window.location.pathname.toLowerCase().includes('/current-version-v12/');
                const isSimpleModulePath = PROGRAMS_DOCS_MODULE_PATH === 'programs-docs-module.html';
                
                if (is404 && isRootPath && isSimpleModulePath) {
                    const fallbackUrl = `CURRENT-VERSION-v12/programs-docs-module.html${forceReload ? `?cacheBust=${Date.now()}` : ''}`;
                    console.warn('[Programs & Docs] Primary module path not found, trying fallback:', fallbackUrl);
                    response = await fetch(fallbackUrl, { cache: 'no-store' });
                }

                if (!response.ok) {
                    if (response.status === 404) {
                        throw new Error(`Module not found at ${fetchUrl}. Please check the file path.`);
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
            }

            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');

            // Inject styles once
            doc.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
                const href = link.getAttribute('href');
                if (!href) return;
                if (document.querySelector(`link[data-programs-docs-style="true"][href="${href}"]`)) {
                    return;
                }
                const clone = link.cloneNode(true);
                clone.dataset.programsDocsStyle = 'true';
                document.head.appendChild(clone);
            });

            window.__programsDocsInlineStyles = window.__programsDocsInlineStyles || new Set();
            doc.querySelectorAll('style').forEach(styleTag => {
                const cssText = styleTag.textContent || '';
                if (window.__programsDocsInlineStyles.has(cssText)) {
                    return;
                }
                const clone = styleTag.cloneNode(true);
                clone.dataset.programsDocsStyle = 'true';
                clone.dataset.programsDocsInline = 'true';
                window.__programsDocsInlineStyles.add(cssText);
                document.head.appendChild(clone);
            });

            container.innerHTML = doc.body.innerHTML;
            container.hidden = false;
            loader.hidden = true;
            if (errorEl) {
                errorEl.hidden = true;
            }
            document.body.classList.add('programs-docs-v2-active');
            document.documentElement.classList.add('programs-docs-v2-active');
            requestAnimationFrame(() => {
                const toolbar = container.querySelector('.toolbar');
                if (toolbar) {
                    const toolbarHeight = Math.round(toolbar.getBoundingClientRect().height);
                    document.documentElement.style.setProperty('--programs-header-height', `${toolbarHeight}px`);
                }
            });
            
            // Apply inline styles to override parent containers
            const applyFullViewportStyles = () => {
                // Apply clean white/gray background for modern look
                // The purple gradient (legacy) has been removed as requested
                const cleanBg = '#f8f9fa'; // Standard dashboard background
                
                document.documentElement.style.background = cleanBg;
                document.documentElement.style.minHeight = '100vh';
                document.body.style.background = cleanBg;
                document.body.style.minHeight = '100vh';
                
                // Override .container
                const outerContainer = document.querySelector('.container');
                if (outerContainer) {
                    outerContainer.style.width = '100%';
                    outerContainer.style.maxWidth = '100%';
                    outerContainer.style.margin = '0';
                    outerContainer.style.padding = 'clamp(16px, 2.5vw, 44px) clamp(16px, 2.5vw, 56px)';
                    outerContainer.style.borderRadius = '0';
                    outerContainer.style.minHeight = '100vh';
                    outerContainer.style.boxShadow = 'none';
                    outerContainer.style.background = 'transparent';
                }
                
                // Override .main-content - make it transparent
                const mainContent = document.querySelector('.main-content');
                if (mainContent) {
                    mainContent.style.gridTemplateColumns = '1fr';
                    mainContent.style.maxWidth = '100%';
                    mainContent.style.padding = 'clamp(16px, 2vw, 36px)';
                    mainContent.style.background = 'transparent';
                }
                
                // Override #mainApp - make it transparent
                const mainApp = document.getElementById('mainApp');
                if (mainApp) {
                    mainApp.style.padding = '0';
                    mainApp.style.width = '100%';
                    mainApp.style.maxWidth = '100%';
                    mainApp.style.background = 'transparent';
                }
                
                // Hide selection panel
                const selectionPanel = document.querySelector('.selection-panel');
                if (selectionPanel) {
                    selectionPanel.style.display = 'none';
                }
                
                // Override programs panel
                const programsPanel = document.querySelector('.programs-panel');
                if (programsPanel) {
                    programsPanel.style.maxWidth = '100%';
                    programsPanel.style.width = '100%';
                }
                
                // Override module's app-shell
                const appShell = container.querySelector('.app-shell');
                if (appShell) {
                    appShell.style.width = '100%';
                    appShell.style.maxWidth = '100%';
                    appShell.style.margin = '0';
                    appShell.style.paddingLeft = 'clamp(16px, 2vw, 32px)';
                    appShell.style.paddingRight = 'clamp(16px, 2vw, 32px)';
                }
                
                // Make panes semi-transparent to show gradient
                const panes = container.querySelectorAll('.pane');
                panes.forEach(pane => {
                    pane.style.background = 'rgba(255, 255, 255, 0.85)';
                    pane.style.backdropFilter = 'blur(10px)';
                });
            };
            
            // Apply styles immediately
            applyFullViewportStyles();
            
            // Ensure container takes full space
            container.style.width = '100%';
            container.style.height = '100%';
            container.style.minHeight = 'calc(100vh - 200px)';
            container.style.display = 'block';
            
            // Hide legacy wrapper if it exists
            const legacyWrapper = document.getElementById('legacyProgramsWrapper');
            if (legacyWrapper) {
                legacyWrapper.hidden = true;
                legacyWrapper.style.display = 'none';
            }
            
            const adjustProgramsDocsLayout = () => {
                // Re-apply full viewport styles
                applyFullViewportStyles();
                
                const nav = document.querySelector('.tab-navigation');
                let headerHeight = container.getBoundingClientRect().top;
                if (headerHeight <= 0 && nav) {
                    headerHeight = nav.getBoundingClientRect().bottom;
                }
                if (!Number.isFinite(headerHeight) || headerHeight <= 0) {
                    headerHeight = 150;
                }
                headerHeight = Math.max(120, Math.round(headerHeight));
                document.documentElement.style.setProperty('--programs-header-height', `${headerHeight}px`);
                
                const targetHeight = `calc(100vh - ${headerHeight}px)`;
                container.style.height = targetHeight;
                container.style.minHeight = targetHeight;
                
                const programsTab = document.getElementById('programsTab');
                if (programsTab) {
                    programsTab.style.minHeight = targetHeight;
                }
                
                const shell = container.querySelector('.app-shell');
                if (shell) {
                    const viewportWidth = window.innerWidth;
                    if (viewportWidth > 1600) {
                        const scaleFactor = viewportWidth / 1600;
                        const gap = Math.min(56, Math.round(24 * scaleFactor));
                        shell.style.gap = `${gap}px`;
                    } else {
                        shell.style.removeProperty('gap');
                    }
                }
            };
            
            adjustProgramsDocsLayout();
            
            if (window.__programsDocsLayoutAdjuster) {
                window.removeEventListener('resize', window.__programsDocsLayoutAdjuster);
            }
            window.__programsDocsLayoutAdjuster = () => adjustProgramsDocsLayout();
            window.addEventListener('resize', window.__programsDocsLayoutAdjuster, { passive: true });
            
            if (window.__programsDocsResizeObserver instanceof ResizeObserver) {
                window.__programsDocsResizeObserver.disconnect();
            }
            if (typeof ResizeObserver === 'function') {
                window.__programsDocsResizeObserver = new ResizeObserver(() => adjustProgramsDocsLayout());
                window.__programsDocsResizeObserver.observe(document.body);
                window.__programsDocsResizeObserver.observe(container);
            }

            // Execute inline scripts sequentially
            const scripts = Array.from(doc.querySelectorAll('script'));
            for (const scriptNode of scripts) {
                const scriptEl = document.createElement('script');
                for (const attr of scriptNode.attributes) {
                    scriptEl.setAttribute(attr.name, attr.value);
                }
                if (scriptNode.src) {
                    scriptEl.src = scriptNode.src;
                } else {
                    scriptEl.textContent = scriptNode.textContent;
                }
                scriptEl.dataset.programsDocsScript = 'true';
                container.appendChild(scriptEl);

                if (scriptEl.src) {
                    await new Promise((resolve, reject) => {
                        scriptEl.onload = resolve;
                        scriptEl.onerror = () => reject(new Error(`Failed to load ${scriptEl.src}`));
                    });
                }
            }

            window.__programsDocsLoaded = true;
            window.ccShell?.setSectionState?.('programs');
            return true;
        } catch (error) {
            console.error('Programs & Docs mount failure:', error);
            console.error('Attempted to load from:', fetchUrl);
            loader.hidden = true;
            window.ccShell?.setSectionState?.('programs-error');
            if (errorEl) {
                errorEl.hidden = false;
                const errorParagraph = errorEl.querySelector('p');
                if (errorParagraph) {
                    const friendlyMessage = error.message.includes('404') || error.message.includes('not found')
                        ? 'Module file not found. Please ensure CareConnect-Pro.html is accessible.'
                        : `Failed to load module: ${error.message}`;
                    errorParagraph.textContent = friendlyMessage;
                }
            }
            revealLegacyProgramsNotice('load-error');
            // document.body.classList.remove('programs-docs-v2-active');
            // document.documentElement.classList.remove('programs-docs-v2-active');
            throw error;
        }
    })();

    window.__programsDocsMountPromise = mountPromise;
    return mountPromise;
}
// Make mount function globally available
window.mountProgramsDocsModule = mountProgramsDocsModule;

function retryProgramsDocsMount() {
    window.__programsDocsMountPromise = null;
    window.ccShell?.setSectionState?.('programs-loading');
    return mountProgramsDocsModule(true).catch(() => {});
}

// Make retry function globally available
window.retryProgramsDocsMount = retryProgramsDocsMount;

function toggleLegacyPrograms(show) {
    const wrapper = document.getElementById('legacyProgramsWrapper');
    if (!wrapper) return;
    if (show) {
        revealLegacyProgramsNotice('manual-request');
        initializeLegacyProgramsModule();
    } else {
        wrapper.hidden = true;
    }
}

function revealLegacyProgramsNotice(reason) {
    const wrapper = document.getElementById('legacyProgramsWrapper');
    const errorEl = document.getElementById('programsDocsError');
    if (!wrapper) return;

    if (!wrapper.dataset.rendered) {
        wrapper.innerHTML = `
            <div class="legacy-programs-notice">
                <h4>Legacy Programs experience</h4>
                <p>The updated Programs &amp; Docs module is currently unavailable (${reason}). Disable the <code>programsV2Core</code> feature flag or contact support for assistance.</p>
            </div>
        `;
        wrapper.dataset.rendered = 'true';
    }

    wrapper.hidden = false;
    if (errorEl) {
        errorEl.hidden = false;
    }
    programsDocsLegacyNoticeShown = true;
    // document.body.classList.remove('programs-docs-v2-active');
    // document.documentElement.classList.remove('programs-docs-v2-active');
    initializeLegacyProgramsModule();
}

// Legacy switchTab function removed - using the main one defined later in the file
// This ensures all tab switching goes through the unified implementation

// Quick add client
async function quickAddClient() {
    // Check if clientManager is initialized
    if (!window.clientManager) {
        showAlert('Client manager is not ready. Please refresh the page.', 'error');
        console.error('ClientManager not initialized');
        return;
    }
    
    const initials = document.getElementById('newClientInitials').value.trim().toUpperCase();
    const kipuId = document.getElementById('newClientKipu').value.trim();
    
    if (!initials || !kipuId) {
        showAlert('Please enter both initials and Kipu ID', 'error');
        return;
    }
    
    try {
        const newClient = await window.clientManager.createClient({
            initials,
            kipuId
        });
        
        // Clear form
        document.getElementById('newClientInitials').value = '';
        document.getElementById('newClientKipu').value = '';
        
        // Set as current client
        await window.clientManager.setCurrentClient(newClient.id);
        
        showAlert(`Client ${initials} added successfully!`, 'success');
        refreshClientsList();
    } catch (error) {
        showAlert(error.message, 'error');
        console.error('Error creating client:', error);
    }
}

// Filter clients
function filterClients(filter) {
    currentClientFilter = filter;
    
    // Update filter tabs
    document.querySelectorAll('.client-filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.classList.add('active');
    
    refreshClientsList();
}

// Search clients
let clientSearchTimeout;
function searchClients(query) {
    clearTimeout(clientSearchTimeout);
    clientSearchTimeout = setTimeout(async () => {
        const results = await clientManager.searchClients(query);
        displayClients(results);
    }, 300);
}

// Refresh clients list - make globally available
window.refreshClientsList = async function refreshClientsList() {
    // Check if old UI container exists (may not exist in CM Tracker view)
    const clientsContainer = document.getElementById('clientsList');
    if (!clientsContainer) {
        // Old UI doesn't exist, likely using CM Tracker
        return;
    }
    
    const allClients = await clientManager.getAllClients();
    let filteredClients = allClients;
    
    // Apply status filter
    if (currentClientFilter !== 'all') {
        filteredClients = allClients.filter(client => 
            client.status === currentClientFilter
        );
    }
    
    // Apply search if active
    const searchBox = document.getElementById('clientSearchBox');
    if (searchBox) {
        const searchQuery = searchBox.value;
        if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            filteredClients = filteredClients.filter(client => 
                client.initials.toLowerCase().includes(searchLower) ||
                client.kipuId.includes(searchQuery)
            );
        }
    }
    
    displayClients(filteredClients);
}

// Display clients
function displayClients(clients) {
    const container = document.getElementById('clientsList');
    
    // Check if old UI container exists (may not exist in CM Tracker view)
    if (!container) {
        // Old UI doesn't exist, likely using CM Tracker
        return;
    }
    
    if (!clients || clients.length === 0) {
        container.innerHTML = `
            <div class="client-empty-state">
                <div class="client-empty-icon">👥</div>
                <p>No clients found</p>
            </div>
        `;
        return;
    }
    
    const currentClient = clientManager.getCurrentClient();
    
    container.innerHTML = clients.map(client => {
        const isSelected = currentClient?.id === client.id;
        const lastModified = new Date(client.lastModified).toLocaleDateString();
        const programCount = client.programHistory?.filter(p => p.status === 'selected').length || 0;
        
        return `
            <div class="client-card ${isSelected ? 'selected' : ''}" 
                 onclick="selectClient('${client.id}')"
                 data-client-id="${client.id}">
                <div class="client-card-avatar">${client.initials}</div>
                <div class="client-card-info">
                    <div class="client-card-header">
                        <span class="client-card-name">${client.initials}</span>
                        <span class="client-status-badge ${client.status}">${client.status}</span>
                    </div>
                    <div class="client-card-kipu">Kipu ID: ${client.kipuId}</div>
                    <div class="client-card-meta">
                        <span>${programCount} programs</span>
                        <span>Modified: ${lastModified}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Select client
async function selectClient(clientId) {
    await clientManager.setCurrentClient(clientId);
    refreshClientsList();
    updateCurrentClientDisplay();
    
    // If programs were selected for this client, restore them
    const clientPrograms = await clientManager.getClientPrograms(clientId);
    if (clientPrograms && clientPrograms.length > 0) {
        selectedPrograms = [...clientPrograms];
        updateSelectedPrograms();
        renderSelectedPrograms();
    }
}

// Update current client display
function updateCurrentClientDisplay() {
    const client = clientManager.getCurrentClient();
    
    // Check if elements exist (may not exist in CM Tracker view)
    const avatarEl = document.getElementById('currentClientAvatar');
    const nameEl = document.getElementById('currentClientName');
    const kipuEl = document.getElementById('currentClientKipu');
    
    if (!avatarEl || !nameEl || !kipuEl) {
        // Old UI elements don't exist, likely using CM Tracker
        return;
    }
    
    if (!client) {
        avatarEl.textContent = '--';
        nameEl.textContent = 'No Client Selected';
        kipuEl.textContent = 'Select a client to begin';
        return;
    }
    
    avatarEl.textContent = client.initials;
    nameEl.textContent = `${client.initials} - ${client.status}`;
    kipuEl.textContent = `Kipu ID: ${client.kipuId}`;
}

// Edit current client
function editCurrentClient() {
    const client = clientManager.getCurrentClient();
    if (!client) {
        showAlert('No client selected', 'error');
        return;
    }
    
    // Create edit dialog
    const newStatus = prompt(`Change status for ${client.initials}:\n1. active\n2. waitlist\n3. discharged`, client.status);
    
    if (newStatus && ['active', 'waitlist', 'discharged'].includes(newStatus)) {
        clientManager.updateClientStatus(client.id, newStatus).then(() => {
            showAlert('Client status updated', 'success');
            refreshClientsList();
            updateCurrentClientDisplay();
        });
    }
}

// Clear current client
function clearCurrentClient() {
    clientManager.setCurrentClient(null);
    updateCurrentClientDisplay();
    // Clear selected programs
    selectedPrograms = [];
    updateSelectedPrograms();
    renderSelectedPrograms();
}

// Override the original handleProgramClick to link with current client
const originalHandleProgramClick = window.handleProgramClick;
window.handleProgramClick = function(programId, isSubProgram = false, parentId = null) {
    // Call original function
    if (originalHandleProgramClick) {
        originalHandleProgramClick(programId, isSubProgram, parentId);
    }
    
    // Track program selection for current client if clientManager is available
    if (window.clientManager) {
        const client = clientManager.getCurrentClient();
        if (client) {
            if (selectedPrograms.includes(programId)) {
                clientManager.addProgramToClient(client.id, programId, {
                    isSubProgram,
                    parentId,
                    addedFrom: 'program-list'
                });
            } else {
                clientManager.removeProgramFromClient(client.id, programId);
            }
        }
    }
};

// Override generateDocument to track for current client
const originalGenerateDocument = window.generateDocument;
window.generateDocument = function() {
    // Track for current client if clientManager is available
    if (window.clientManager) {
        const client = clientManager.getCurrentClient();
        if (client && selectedPrograms.length > 0) {
            // Track document generation
            clientManager.addDocumentRecord(client.id, {
                type: documentType,
                programIds: [...selectedPrograms],
                settings: {
                    includeAtHome,
                    includeAlumni
                },
                fileName: `CareConnect_${client.initials}_${new Date().toISOString().split('T')[0]}.docx`
            });
        }
    }
    
    // Call original function
    if (originalGenerateDocument) {
        return originalGenerateDocument();
    }
};

// Helper function to show alerts
function showAlert(message, type = 'info') {
    // You can customize this to use your preferred notification system
    const alertClass = type === 'error' ? 'error-alert' : 'success-alert';
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass}`;
    alertDiv.textContent = message;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'error' ? '#ef4444' : '#10b981'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 3000);
}

// Export client data
async function exportClientData() {
    try {
        const clients = await clientManager.getAllClients();
        const exportData = {
            version: '13.0.0',
            exportDate: new Date().toISOString(),
            clients: clients
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clients-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        showAlert(`Exported ${clients.length} clients`, 'success');
    } catch (error) {
        showAlert('Failed to export clients', 'error');
        console.error(error);
    }
}

// Import client data
async function importClientData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            if (!data.clients || !Array.isArray(data.clients)) {
                throw new Error('Invalid client data format');
            }
            
            let imported = 0;
            for (const client of data.clients) {
                try {
                    await clientManager.importClient(client);
                    imported++;
                } catch (err) {
                    console.warn(`Failed to import client ${client.initials}:`, err);
                }
            }
            
            await refreshClientsList();
            showAlert(`Imported ${imported} clients`, 'success');
        } catch (error) {
            showAlert('Failed to import clients', 'error');
            console.error(error);
        }
    };
    
    input.click();
}

// Toggle recent clients dropdown
function toggleRecentClients() {
    const dropdown = document.getElementById('recentClientsDropdown');
    if (dropdown.style.display === 'none') {
        loadRecentClients();
        dropdown.style.display = 'block';
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', closeRecentClientsOnClickOutside);
        }, 100);
    } else {
        dropdown.style.display = 'none';
        document.removeEventListener('click', closeRecentClientsOnClickOutside);
    }
}

// Close dropdown on click outside
function closeRecentClientsOnClickOutside(e) {
    const dropdown = document.getElementById('recentClientsDropdown');
    if (!dropdown.contains(e.target) && !e.target.closest('button[onclick*="toggleRecentClients"]')) {
        dropdown.style.display = 'none';
        document.removeEventListener('click', closeRecentClientsOnClickOutside);
    }
}

// Load recent clients
async function loadRecentClients() {
    const dropdown = document.getElementById('recentClientsDropdown');
    
    // Check if clientManager exists
    if (!window.clientManager) {
        dropdown.innerHTML = `
            <div style="padding: 12px; color: #6b7280; text-align: center;">
                Client manager not initialized yet
            </div>
        `;
        return;
    }
    
    const recentClients = await clientManager.getRecentClients(5);
    const currentClient = clientManager.getCurrentClient();
    
    if (recentClients.length === 0) {
        dropdown.innerHTML = `
            <div style="padding: 12px; color: #6b7280; text-align: center;">
                No recent clients
            </div>
        `;
        return;
    }
    
    dropdown.innerHTML = recentClients.map(client => {
        const isActive = currentClient?.id === client.id;
        const programCount = client.programHistory?.filter(p => p.status === 'selected').length || 0;
        return `
            <div onclick="quickSelectClient('${client.id}')" 
                 style="padding: 10px; cursor: pointer; border-bottom: 1px solid #e5e7eb; transition: background 0.2s; ${isActive ? 'background: #ede9fe;' : ''}"
                 onmouseover="this.style.background='#f3f4f6'" 
                 onmouseout="this.style.background='${isActive ? '#ede9fe' : 'white'}'">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong style="color: #1f2937;">${client.initials}</strong>
                        <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">Kipu: ${client.kipuId}</span>
                    </div>
                    <span style="background: ${client.status === 'active' ? '#d1fae5' : client.status === 'waitlist' ? '#fef3c7' : '#f3f4f6'}; 
                                 color: ${client.status === 'active' ? '#065f46' : client.status === 'waitlist' ? '#92400e' : '#6b7280'}; 
                                 padding: 2px 8px; border-radius: 12px; font-size: 11px;">
                        ${client.status}
                    </span>
                </div>
                <div style="color: #9ca3af; font-size: 12px; margin-top: 4px;">
                    ${programCount} programs • Last modified: ${new Date(client.lastModified).toLocaleDateString()}
                </div>
            </div>
        `;
    }).join('');
}

// Quick select client from dropdown
async function quickSelectClient(clientId) {
    if (!window.clientManager) {
        showAlert('Client manager not ready yet', 'error');
        return;
    }
    
    await selectClient(clientId);
    document.getElementById('recentClientsDropdown').style.display = 'none';
    document.removeEventListener('click', closeRecentClientsOnClickOutside);
    
    // Update current client indicator
    const currentClient = clientManager.getCurrentClient();
    const button = document.querySelector('button[onclick*="toggleRecentClients"]');
    if (currentClient && button) {
        button.innerHTML = `⚡ ${currentClient.initials} (${currentClient.kipuId}) ▼`;
    }
}

// Manage favorite programs
function manageFavorites() {
    const favorites = JSON.parse(localStorage.getItem('favoritePrograms') || '[]');
    
    // Create a modal for managing favorites
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        z-index: 10001;
        max-width: 600px;
        width: 90%;
        max-height: 70vh;
        overflow-y: auto;
    `;
    modal.classList.add('floating-modal');
    
    modal.innerHTML = `
        <h3 style="margin-top: 0;">⭐ Manage Favorite Programs</h3>
        <p style="color: #6b7280; font-size: 14px;">Select programs to add to favorites for quick access:</p>
        <div id="favoritesSelection" style="margin: 20px 0;">
            ${programs.slice(0, 20).map(program => `
                <label style="display: block; margin: 8px 0; cursor: pointer;">
                    <input type="checkbox" value="${program.id}" 
                           ${favorites.includes(program.id) ? 'checked' : ''} 
                           style="margin-right: 8px;">
                    ${program.name}
                </label>
            `).join('')}
        </div>
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="window.closeModal()" 
                    style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 6px; cursor: pointer;">
                Cancel
            </button>
            <button onclick="saveFavorites()" 
                    style="padding: 8px 16px; background: #f59e0b; color: white; border: none; border-radius: 6px; cursor: pointer;">
                Save Favorites
            </button>
        </div>
    `;
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 10000;
    `;
    backdrop.onclick = () => window.closeModal();
    
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);
}

// Save favorite programs
function saveFavorites() {
    const checkboxes = document.querySelectorAll('#favoritesSelection input[type="checkbox"]');
    const favorites = [];
    
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            favorites.push(checkbox.value);
        }
    });
    
    localStorage.setItem('favoritePrograms', JSON.stringify(favorites));
    loadFavoritePrograms();
    
    // Close modal
    window.closeModal();
    
    showAlert('Favorites saved!', 'success');
}

// Load favorite programs
function loadFavoritePrograms() {
    const favorites = JSON.parse(localStorage.getItem('favoritePrograms') || '[]');
    const container = document.getElementById('favoritePrograms');
    const list = document.getElementById('favoriteProgramsList');
    
    if (!container || !list) {
        return; // Elements don't exist, skip
    }
    
    if (favorites.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    list.innerHTML = favorites.map(programId => {
        const program = programs.find(p => p.id === programId);
        if (!program) return '';
        
        const isSelected = selectedPrograms.includes(programId);
        return `
            <button onclick="toggleFavoriteProgram('${programId}')" 
                    style="padding: 6px 12px; 
                           background: ${isSelected ? '#065f46' : '#f59e0b'}; 
                           color: white; 
                           border: none; 
                           border-radius: 4px; 
                           cursor: pointer; 
                           font-size: 12px;
                           transition: all 0.2s;">
                ${isSelected ? '✓' : '+'} ${program.name}
            </button>
        `;
    }).join('');
}

// Toggle favorite program
function toggleFavoriteProgram(programId) {
    if (selectedPrograms.includes(programId)) {
        // Remove if already selected
        const index = selectedPrograms.indexOf(programId);
        selectedPrograms.splice(index, 1);
    } else {
        // Add to selection
        selectedPrograms.push(programId);
    }
    
    updateSelectedPrograms();
    renderSelectedPrograms();
    loadFavoritePrograms(); // Refresh the favorites display
    
    // Track for current client
    if (window.clientManager) {
        const client = clientManager.getCurrentClient();
        if (client) {
            if (selectedPrograms.includes(programId)) {
                clientManager.addProgramToClient(client.id, programId, { addedFrom: 'favorites' });
            } else {
                clientManager.removeProgramFromClient(client.id, programId);
            }
        }
    }
}

// Initialize workflow features on page load
document.addEventListener('DOMContentLoaded', () => {
    // Ensure tab navigation is visible immediately
    ensureTabNavigationVisible();
    
    setTimeout(() => {
        loadFavoritePrograms();
        
        // Ensure tab navigation is still visible after delay
        ensureTabNavigationVisible();
        
        // Check if clientManager is initialized
        if (!window.clientManager) {
            console.warn('ClientManager not initialized after 2 seconds');
            // Show warning if on clients tab
            const clientsTab = document.getElementById('clientsTab');
            if (clientsTab && clientsTab.classList.contains('active')) {
                const statusDiv = document.getElementById('clientManagerStatus');
                if (statusDiv) {
                    statusDiv.style.display = 'block';
                }
            }
        } else {
            console.log('ClientManager is available:', window.clientManager);
            // Update recent clients button with current client if any
            const currentClient = clientManager.getCurrentClient();
            if (currentClient) {
                const button = document.querySelector('button[onclick*="toggleRecentClients"]');
                if (button) {
                    button.innerHTML = `⚡ ${currentClient.initials} (${currentClient.kipuId}) ▼`;
                }
            }
        }
    }, 2000); // Increased timeout to ensure clientManager is initialized
});
// CM Tracker Functions
// Show add client modal - make globally available
window.showAddClientModal = async function showAddClientModal() {
    const houses = await housesManager.getActiveHouses();
    const currentHouse = houses.find(h => h.id === currentHouseId) || houses[0];
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="width: 520px; padding: 32px 36px;">
                <h3>Add New Client</h3>
                <form id="addClientForm" onsubmit="handleAddClient(event)">
                    <div style="display: grid; gap: 18px;">
                        <div>
                            <label>Client Initials *</label>
                            <input type="text" name="initials" maxlength="4" required 
                                   style="text-transform: uppercase; width: 100%;">
                        </div>
                        <div>
                            <label>Kipu ID *</label>
                            <input type="text" name="kipuId" required style="width: 100%;">
                        </div>
                        <div>
                            <label>House *</label>
                            <select name="houseId" required style="width: 100%;" onchange="toggleCoveUnit(this)">
                                ${houses.map(h => `
                                    <option value="${h.id}" ${h.id === currentHouse.id ? 'selected' : ''}>
                                        ${h.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        <div id="coveUnitSection" style="display: ${currentHouse?.name?.toLowerCase().includes('cove') ? 'block' : 'none'};">
                            <label>Cove Unit *</label>
                            <select name="coveUnit" style="width: 100%;">
                                <option value="">Select Unit...</option>
                                <option value="A">Unit A</option>
                                <option value="B">Unit B</option>
                            </select>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            <div>
                                <label>Admission Date</label>
                                <input type="date" name="admissionDate" style="width: 100%;">
                            </div>
                            <div>
                                <label>Expected Discharge</label>
                                <input type="date" name="expectedDischargeDate" style="width: 100%;">
                            </div>
                        </div>
                        <div>
                            <label>Clinical Coach</label>
                            <input type="text" name="clinicalCoachInitials" maxlength="4" 
                                   placeholder="Initials" style="text-transform: uppercase; width: 100%;">
                        </div>
                        <div>
                            <label>Primary Therapist</label>
                            <input type="text" name="primaryTherapistInitials" maxlength="4" 
                                   placeholder="Initials" style="text-transform: uppercase; width: 100%;">
                        </div>
                        <div>
                            <label>Family Ambassador</label>
                            <input type="text" name="familyAmbassadorPrimaryInitials" maxlength="4" 
                                   placeholder="Initials" style="text-transform: uppercase; width: 100%;">
                        </div>
                    </div>
                    <div style="display: flex; gap: 12px; margin-top: 24px; justify-content: flex-end;">
                        <button type="button" onclick="window.closeModal()" 
                                style="padding: 11px 22px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);">
                            Cancel
                        </button>
                        <button type="submit" 
                                style="padding: 11px 22px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                            Add Client
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add keyboard listener for ESC key
    document.addEventListener('keydown', handleModalKeydown);
    
    // Fix overlay click handling
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(event) {
            if (event.target === this) {
                closeModal();
            }
        });
    }
}

// Toggle Cove Unit section visibility based on house selection
window.toggleCoveUnit = function(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    const houseName = selectedOption?.text?.toLowerCase() || '';
    const isCove = houseName.includes('cove');
    
    // Handle both Add and Edit modals
    const coveSection = document.getElementById('coveUnitSection') || document.getElementById('editCoveUnitSection');
    if (coveSection) {
        coveSection.style.display = isCove ? 'block' : 'none';
        
        // Make coveUnit required if Cove is selected
        const coveUnitSelect = coveSection.querySelector('select[name="coveUnit"]');
        if (coveUnitSelect) {
            coveUnitSelect.required = isCove;
        }
    }
};

// Handle add client form submission
async function handleAddClient(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const clientData = {
        initials: formData.get('initials'),
        kipuId: formData.get('kipuId'),
        houseId: formData.get('houseId'),
        coveUnit: formData.get('coveUnit') || null,
        admissionDate: formData.get('admissionDate') || new Date().toISOString().split('T')[0],
        expectedDischargeDate: formData.get('expectedDischargeDate') || null,
        clinicalCoachInitials: formData.get('clinicalCoachInitials') || '',
        primaryTherapistInitials: formData.get('primaryTherapistInitials') || '',
        familyAmbassadorPrimaryInitials: formData.get('familyAmbassadorPrimaryInitials') || '',
        status: 'active'
    };
    
    try {
        const newClient = await window.clientManager.createClient(clientData);
        
        // Initialize milestones for the new client
        await milestonesManager.initializeClientMilestones(newClient.id);
        
        showAlert('Client added successfully!', 'success');
        closeModal();
        await loadHouseView(currentHouseId);
        await buildHouseNavigation(); // Update counts
    } catch (error) {
        showAlert(error.message, 'error');
    }
}

// View client details - Redirect to modern Client Profile Manager
// NOTE: Accepts either a client ID (string) or a full client object
async function viewClientDetails(clientOrId) {
    // Extract client ID
    let clientId = null;
    if (typeof clientOrId === 'string') {
        clientId = clientOrId;
    } else if (clientOrId && typeof clientOrId === 'object') {
        clientId = clientOrId.id;
    }
    
    // Guard against invalid IDs
    if (!clientId) {
        console.error('viewClientDetails called without a valid clientId:', clientOrId);
        showAlert('Client not found', 'error');
        return;
    }
    
    // Use the modern Client Profile Manager
    if (window.clientProfileManager && typeof window.clientProfileManager.open === 'function') {
        window.clientProfileManager.open(clientId);
        return;
    }
    
    // Fallback: show notification if profile manager not available
    console.warn('Client Profile Manager not available, falling back to legacy view');
    showAlert('Loading client profile...', 'info');
    
    // Legacy fallback - basic info only
    try {
        const client = await window.clientManager.getClient(clientId);
        if (!client) {
            showAlert('Client not found', 'error');
            return;
        }
        
        // Get related data for legacy fallback
        const house = housesManager?.getHouseById?.(client.houseId);
        const milestones = await milestonesManager?.getClientMilestones?.(client.id) || [];
        const aftercareOptions = await aftercareManager?.getClientAftercareOptions?.(client.id) || [];
        const daysInCare = window.clientManager.calculateDaysInCare(client);
        const hoursElapsed = window.clientManager.calculateHoursElapsed(client);
        
        console.log('Debug - Days in care calculation:', {
            clientInitials: client.initials,
            admissionDate: client.admissionDate, 
            daysInCare: daysInCare
        });
        
        // Calculate completion percentages based on tracking fields
        const trackingFields = [
            'needsAssessment', 'healthPhysical', 'aftercareThreadSent',
            'optionsDocUploaded', 'dischargePacketUploaded', 'referralClosureCorrespondence',
            'gadCompleted', 'phqCompleted', 'satisfactionSurvey', 
            'dischargeSummary', 'dischargePlanningNote', 'dischargeASAM'
        ];
        const completed = trackingFields.filter(field => client[field]).length;
        const completionPercentage = trackingFields.length > 0 ? Math.round((completed / trackingFields.length) * 100) : 0;
        
        // Build modal HTML with modern design
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-content modern-modal">
                    <!-- Header with key metrics -->
                    <div class="modal-header">
                        <div class="modal-header-left">
                            <h2 class="client-name">${client.initials}</h2>
                            <span class="client-id">${client.kipuId}</span>
                            <span class="client-status status-${client.status}">${client.status === 'active' ? '● Active' : '○ Discharged'}</span>
                        </div>
                        <div class="modal-header-right">
                            <div class="metric-card">
                                <div class="metric-value">${daysInCare || 0}</div>
                                <div class="metric-label">Days in Care</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${completionPercentage || 0}%</div>
                                <div class="metric-label">Completed</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-value">${house ? house.name : 'N/A'}</div>
                                <div class="metric-label">House</div>
                            </div>
                        </div>
                        <button class="modal-close" onclick="window.closeModal()">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M12 4L4 12M4 4L12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                    
                    <div class="modal-toolbar" style="display:flex; justify-content:flex-end; gap:12px; margin: 12px 0 20px 0;">
                        <button class="primary-action" onclick="generateClientDocument('${clientId}', { focusSearch: true })" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; border: none; padding: 10px 18px; border-radius: 10px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px;">
                            <span>✨</span>
                            <span>Create Document for ${client.initials}</span>
                        </button>
                    </div>
                    
                    <!-- Main Content Area -->
                    <div class="modal-body">
                        <!-- Sidebar Navigation -->
                        <div class="sidebar-nav">
                            <button class="nav-item active" onclick="switchDetailSection('tracking', event)">
                                <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M9 2L2 7L9 12M2 7H18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                <span>Tracking</span>
                            </button>
                            <button class="nav-item" onclick="switchDetailSection('assessments', event)">
                                <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M9 11L3 17L1 15L7 9L9 11ZM16 3L19 6L13 12L11 10L16 3Z" fill="currentColor"/>
                                </svg>
                                <span>Assessments</span>
                            </button>
                            <button class="nav-item" onclick="switchDetailSection('aftercare', event)">
                                <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2ZM10 5L7 9H9V13L13 9H11V5H10Z" fill="currentColor"/>
                                </svg>
                                <span>Aftercare</span>
                            </button>
                            <button class="nav-item" onclick="switchDetailSection('team', event)">
                                <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M12 4.354C11.3687 3.72275 10.5687 3.375 9.69995 3.375C8.83119 3.375 8.0312 3.72275 7.39995 4.354C6.7687 4.98525 6.42095 5.78525 6.42095 6.654C6.42095 7.52275 6.7687 8.32275 7.39995 8.954C8.0312 9.58525 8.83119 9.933 9.69995 9.933C10.5687 9.933 11.3687 9.58525 11.9999 8.954C12.6312 8.32275 12.9789 7.52275 12.9789 6.654C12.9789 5.78525 12.6312 4.98525 12 4.354Z" fill="currentColor"/>
                                    <path d="M16.5 14.954C16.5 14.274 16.3679 13.6019 16.1124 12.975C15.857 12.3482 15.4831 11.7786 15.0104 11.2969C14.5376 10.8152 13.975 10.4305 13.3525 10.1636C12.73 9.89666 12.0596 9.75255 11.3789 9.73875C10.8262 10.1458 10.1842 10.4271 9.49997 10.5598C8.81578 10.4271 8.17378 10.1458 7.62108 9.73875C6.94036 9.75255 6.26999 9.89666 5.64749 10.1636C5.025 10.4305 4.46235 10.8152 3.98965 11.2969C3.51695 11.7786 3.14301 12.3482 2.88758 12.975C2.63214 13.6019 2.5 14.274 2.5 14.954V16.563H16.5V14.954Z" fill="currentColor"/>
                                </svg>
                                <span>Care Team</span>
                            </button>
                            <button class="nav-item" onclick="switchDetailSection('timeline', event)">
                                <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M10 2C14.418 2 18 5.582 18 10S14.418 18 10 18S2 14.418 2 10S5.582 2 10 2ZM10 6V10L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                </svg>
                                <span>Timeline</span>
                            </button>
                            <button class="nav-item" onclick="switchDetailSection('notes', event)">
                                <svg class="nav-icon" width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M4 5C4 4.44772 4.44772 4 5 4H11C11.5523 4 12 4.44772 12 5V16L8 14L4 16V5Z" fill="currentColor"/>
                                </svg>
                                <span>Notes</span>
                            </button>
                        </div>
                    
                        
                        <!-- Content Area -->
                        <div class="content-area">
                            <!-- Tracking Section -->
                            <div id="trackingSection" class="section-content active">
                                ${hoursElapsed < 48 && client.status === 'active' ? `
                                <!-- 48-hour Admission Countdown -->
                                <div class="admission-timer ${hoursElapsed >= 36 ? 'timer-urgent' : hoursElapsed >= 24 ? 'timer-warning' : ''}">
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style="margin-right: 8px;">
                                        <path d="M10 2C14.418 2 18 5.582 18 10S14.418 18 10 18S2 14.418 2 10S5.582 2 10 2ZM10 6V10L13 13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                                    </svg>
                                    <span class="timer-text">
                                        <strong>${48 - hoursElapsed} hours remaining</strong> for admission assessments
                                        ${!client.needsAssessment || !client.healthPhysical ? `
                                            <span class="timer-items">
                                                ${!client.needsAssessment ? '• Needs Assessment' : ''}
                                                ${!client.healthPhysical ? '• Health & Physical' : ''}
                                            </span>
                                        ` : ''}
                                    </span>
                                </div>
                                ` : ''}
                                
                                <!-- Tracking Cards -->
                                <div class="tracking-grid">
                                    <!-- Admission & Assessment Card -->
                                    <div class="tracking-card">
                                        <h3 class="card-title">📋 Admission & Assessment</h3>
                                        <div class="checklist">
                                            <label class="checklist-item" data-tracking="needs-assessment">
                                                <input type="checkbox" 
                                                       id="needs-assessment-${clientId}" 
                                                       ${client.needsAssessment ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'needsAssessment', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Needs Assessment</span>
                                                ${client.needsAssessmentDate ? `<span class="completion-date">${new Date(client.needsAssessmentDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="health-physical">
                                                <input type="checkbox" 
                                                       id="health-physical-${clientId}" 
                                                       ${client.healthPhysical ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'healthPhysical', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Health & Physical Assessment</span>
                                                ${client.healthPhysicalDate ? `<span class="completion-date">${new Date(client.healthPhysicalDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <!-- Aftercare Planning Card -->
                                    <div class="tracking-card">
                                        <h3 class="card-title">🎯 Aftercare Planning</h3>
                                        <div class="checklist">
                                            <label class="checklist-item ${daysInCare >= 14 && daysInCare <= 16 ? 'highlight-warning' : daysInCare > 16 ? 'highlight-danger' : ''}" data-tracking="aftercare-thread">
                                                <input type="checkbox" 
                                                       id="aftercare-thread-${clientId}" 
                                                       ${client.aftercareThreadSent ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'aftercareThreadSent', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Aftercare Planning Thread Sent</span>
                                                ${daysInCare >= 14 ? `<span class="days-indicator days-${daysInCare}">${daysInCare} days</span>` : ''}
                                                ${client.aftercareThreadDate ? `<span class="completion-date">${new Date(client.aftercareThreadDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="options-doc">
                                                <input type="checkbox" 
                                                       id="options-doc-${clientId}" 
                                                       ${client.optionsDocUploaded ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'optionsDocUploaded', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Options Document in Kipu</span>
                                                ${client.optionsDocUploadedDate ? `<span class="completion-date">${new Date(client.optionsDocUploadedDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="discharge-packet">
                                                <input type="checkbox" 
                                                       id="discharge-packet-${clientId}" 
                                                       ${client.dischargePacketUploaded ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'dischargePacketUploaded', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Discharge Packet in Kipu</span>
                                                ${client.dischargePacketDate ? `<span class="completion-date">${new Date(client.dischargePacketDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="referral-closure">
                                                <input type="checkbox" 
                                                       id="referral-closure-${clientId}" 
                                                       ${client.referralClosureCorrespondence ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'referralClosureCorrespondence', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Referral/Closure Correspondence</span>
                                                ${client.referralClosureDate ? `<span class="completion-date">${new Date(client.referralClosureDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                        </div>
                                        
                                        <!-- Aftercare Options Progress Tracking -->
                                        ${client.aftercareOptions && client.aftercareOptions.length > 0 ? `
                                            <div class="aftercare-options-tracking">
                                                <h4 style="font-size: 14px; margin: 16px 0 12px 0; font-weight: 600; color: #374151;">
                                                    Aftercare Options Progress
                                                </h4>
                                                ${client.aftercareOptions.map(option => `
                                                    <div class="aftercare-option-item">
                                                        <div class="option-header">
                                                            <span class="option-name">${option.programName}</span>
                                                            <span class="option-status status-${option.status}">${option.status}</span>
                                                        </div>
                                                        
                                                        <div class="progress-tracker">
                                                            <div class="progress-step ${option.familyContacted ? 'completed' : ''}"
                                                                 onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'familyContacted', ${!option.familyContacted})">
                                                                <span class="step-icon">
                                                                    ${option.familyContacted ? 
                                                                        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                                                        '☎️'}
                                                                </span>
                                                                <span class="step-label">Family Contacted</span>
                                                            </div>
                                                            <div class="progress-step ${option.recordsSent ? 'completed' : ''}"
                                                                 onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'recordsSent', ${!option.recordsSent})">
                                                                <span class="step-icon">
                                                                    ${option.recordsSent ? 
                                                                        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                                                        '📄'}
                                                                </span>
                                                                <span class="step-label">Records Sent</span>
                                                            </div>
                                                            <div class="progress-step ${option.assessmentScheduled ? 'completed' : ''}"
                                                                 onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'assessmentScheduled', ${!option.assessmentScheduled})">
                                                                <span class="step-icon">
                                                                    ${option.assessmentScheduled ? 
                                                                        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                                                        '📅'}
                                                                </span>
                                                                <span class="step-label">Assessment Set</span>
                                                            </div>
                                                            <div class="progress-step ${option.accepted ? 'completed' : ''}"
                                                                 onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'accepted', ${!option.accepted})">
                                                                <span class="step-icon">
                                                                    ${option.accepted ? 
                                                                        '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                                                        '✅'}
                                                                </span>
                                                                <span class="step-label">Accepted</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `).join('')}
                                            </div>
                                        ` : ''}
                                    </div>
                                    
                                    <!-- Clinical Assessments Card -->
                                    <div class="tracking-card">
                                        <h3 class="card-title">📊 Clinical Assessments</h3>
                                        <div class="checklist">
                                            <label class="checklist-item" data-tracking="gad-completed">
                                                <input type="checkbox" 
                                                       id="gad-completed-${clientId}" 
                                                       ${client.gadCompleted ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'gadCompleted', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">GAD-7 Completed (in Kipu)</span>
                                                ${client.gadCompletedDate ? `<span class="completion-date">${new Date(client.gadCompletedDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="phq-completed">
                                                <input type="checkbox" 
                                                       id="phq-completed-${clientId}" 
                                                       ${client.phqCompleted ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'phqCompleted', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">PHQ-9 Completed (in Kipu)</span>
                                                ${client.phqCompletedDate ? `<span class="completion-date">${new Date(client.phqCompletedDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="satisfaction-survey">
                                                <input type="checkbox" 
                                                       id="satisfaction-survey-${clientId}" 
                                                       ${client.satisfactionSurvey ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'satisfactionSurvey', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Satisfaction Survey Completed</span>
                                                ${client.satisfactionSurveyDate ? `<span class="completion-date">${new Date(client.satisfactionSurveyDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                        </div>
                                    </div>
                                    
                                    <!-- Documentation Card -->
                                    <div class="tracking-card">
                                        <h3 class="card-title">📄 Documentation</h3>
                                        <div class="checklist">
                                            <label class="checklist-item" data-tracking="discharge-summary">
                                                <input type="checkbox" 
                                                       id="discharge-summary-${clientId}" 
                                                       ${client.dischargeSummary ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'dischargeSummary', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Discharge Summary</span>
                                                ${client.dischargeSummaryDate ? `<span class="completion-date">${new Date(client.dischargeSummaryDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="discharge-planning">
                                                <input type="checkbox" 
                                                       id="discharge-planning-${clientId}" 
                                                       ${client.dischargePlanningNote ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'dischargePlanningNote', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Final Discharge Planning Note</span>
                                                ${client.dischargePlanningNoteDate ? `<span class="completion-date">${new Date(client.dischargePlanningNoteDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item" data-tracking="discharge-asam">
                                                <input type="checkbox" 
                                                       id="discharge-asam-${clientId}" 
                                                       ${client.dischargeASAM ? 'checked' : ''}
                                                       onchange="updateTracking('${clientId}', 'dischargeASAM', this.checked)">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Discharge ASAM</span>
                                                ${client.dischargeASAMDate ? `<span class="completion-date">${new Date(client.dischargeASAMDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Assessments Section -->
                            <div id="assessmentsSection" class="section-content" style="display: none;">
                                <div class="section-header">
                                    <h2>Assessment History</h2>
                                </div>
                                <div class="tracking-grid">
                                    <div class="tracking-card">
                                        <h3 class="card-title">📊 Clinical Assessments Status</h3>
                                        <div class="checklist">
                                            <label class="checklist-item">
                                                <input type="checkbox" ${client.gadCompleted ? 'checked' : ''} style="pointer-events: none;">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">GAD-7 Completed (in Kipu)</span>
                                                ${client.gadCompletedDate ? `<span class="completion-date">${new Date(client.gadCompletedDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox" ${client.phqCompleted ? 'checked' : ''} style="pointer-events: none;">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">PHQ-9 Completed (in Kipu)</span>
                                                ${client.phqCompletedDate ? `<span class="completion-date">${new Date(client.phqCompletedDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                            <label class="checklist-item">
                                                <input type="checkbox" ${client.satisfactionSurvey ? 'checked' : ''} style="pointer-events: none;">
                                                <span class="checkbox-custom"></span>
                                                <span class="item-text">Satisfaction Survey Completed</span>
                                                ${client.satisfactionSurveyDate ? `<span class="completion-date">${new Date(client.satisfactionSurveyDate).toLocaleDateString()}</span>` : ''}
                                            </label>
                                        </div>
                                    </div>
                                    <div class="tracking-card">
                                        <h3 class="card-title">📝 Notes</h3>
                                        <p style="color: #6b7280; padding: 20px;">All assessments are completed within Kipu. This tracking ensures completion status is documented.</p>
                                    </div>
                                </div>
                            </div>
                        
                            
                            <!-- Aftercare Section -->
                            <div id="aftercareSection" class="section-content" style="display: none;">
                                <div class="section-header">
                                    <h2>Aftercare Options</h2>
                                    <button class="btn-primary" onclick="addAftercareOption('${clientId}')">+ Add Option</button>
                                </div>
                                <div class="aftercare-grid">
                                    ${buildModernAftercareList(aftercareOptions, clientId)}
                                </div>
                            </div>
                            
                            <!-- Care Team Section -->
                            <div id="teamSection" class="section-content" style="display: none;">
                                <div class="section-header">
                                    <h2>Care Team Assignments</h2>
                                </div>
                                <div class="team-grid">
                                    <div class="team-member-card">
                                        <div class="member-icon">🤝</div>
                                        <label>Case Manager</label>
                                        <input type="text" 
                                               class="team-input" 
                                               id="caseManager" 
                                               value="${client.caseManagerInitials || ''}" 
                                               maxlength="4" 
                                               placeholder="Initials"
                                               onchange="updateTeamMember('${clientId}', 'caseManagerInitials', this.value)">
                                    </div>
                                    <div class="team-member-card">
                                        <div class="member-icon">🏥</div>
                                        <label>Clinical Coach</label>
                                        <input type="text" 
                                               class="team-input" 
                                               id="clinicalCoach" 
                                               value="${client.clinicalCoachInitials || ''}" 
                                               maxlength="4" 
                                               placeholder="Initials"
                                               onchange="updateTeamMember('${clientId}', 'clinicalCoachInitials', this.value)">
                                    </div>
                                    <div class="team-member-card">
                                        <div class="member-icon">👨‍⚕️</div>
                                        <label>Primary Therapist</label>
                                        <input type="text" 
                                               class="team-input" 
                                               id="primaryTherapist" 
                                               value="${client.primaryTherapistInitials || ''}" 
                                               maxlength="4" 
                                               placeholder="Initials"
                                               onchange="updateTeamMember('${clientId}', 'primaryTherapistInitials', this.value)">
                                    </div>
                                    <div class="team-member-card">
                                        <div class="member-icon">👥</div>
                                        <label>Primary Family Ambassador</label>
                                        <input type="text" 
                                               class="team-input" 
                                               id="familyAmbassador" 
                                               value="${client.familyAmbassadorPrimaryInitials || ''}" 
                                               maxlength="4" 
                                               placeholder="Initials"
                                               onchange="updateTeamMember('${clientId}', 'familyAmbassadorPrimaryInitials', this.value)">
                                    </div>
                                    <div class="team-member-card">
                                        <div class="member-icon">👥</div>
                                        <label>Secondary Family Ambassador</label>
                                        <input type="text" 
                                               class="team-input" 
                                               id="familyAmbassador2" 
                                               value="${client.familyAmbassadorSecondaryInitials || ''}" 
                                               maxlength="4" 
                                               placeholder="Initials"
                                               onchange="updateTeamMember('${clientId}', 'familyAmbassadorSecondaryInitials', this.value)">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Timeline Section -->
                            <div id="timelineSection" class="section-content" style="display: none;">
                                <div class="section-header">
                                    <h2>Client Timeline</h2>
                                </div>
                                <div class="timeline-container">
                                    ${buildClientTimeline(client, milestones, daysInCare)}
                                </div>
                            </div>
                            
                            <!-- Notes Section -->
                            <div id="notesSection" class="section-content" style="display: none;">
                                <div class="section-header">
                                    <h2>Notes & Documentation</h2>
                                </div>
                                <div class="notes-container">
                                    <textarea class="notes-textarea" 
                                              id="clientNotes" 
                                              placeholder="Add notes about this client..."
                                              oninput="autoSaveNotes('${clientId}', this.value)">${client.notes || ''}</textarea>
                                    <div class="notes-footer">
                                        <span id="noteSaveStatus" class="save-status">All changes saved</span>
                                        <span class="notes-timestamp">Last updated: ${client.notesUpdatedAt ? new Date(client.notesUpdatedAt).toLocaleString() : 'Never'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        // Add comprehensive modern styling
        const style = document.createElement('style');
        style.textContent = `
            /* Modal Base Styles */
            .modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.6);
                backdrop-filter: blur(4px);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                cursor: pointer;
                animation: fadeIn 0.2s ease;
            }
            .modal-content {
                background: white;
                border-radius: 16px;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
                cursor: default;
                overflow: hidden;
                position: relative;
            }
            .modern-modal {
                width: 1000px;
                max-width: 95vw;
                height: 75vh;
                max-height: 700px;
                display: flex;
                flex-direction: column;
                animation: slideIn 0.3s ease;
            }
            
            /* Modal Header */
            .modal-header {
                background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
                color: white;
                padding: 24px;
                display: flex;
                align-items: center;
                gap: 20px;
                position: relative;
            }
            .modal-header-left {
                flex: 1;
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .client-name {
                font-size: 22px;
                font-weight: 700;
                margin: 0;
            }
            .client-id {
                background: rgba(255,255,255,0.2);
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 13px;
            }
            .client-status {
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 500;
            }
            .status-active {
                background: #10b981;
                color: white;
            }
            .status-discharged {
                background: #ef4444;
                color: white;
            }
            
            /* Header Metrics */
            .modal-header-right {
                display: flex;
                gap: 16px;
            }
            .metric-card {
                background: rgba(255,255,255,0.15);
                backdrop-filter: blur(10px);
                padding: 12px 20px;
                border-radius: 12px;
                text-align: center;
                min-width: 100px;
            }
            .metric-value {
                font-size: 24px;
                font-weight: 700;
                margin-bottom: 4px;
            }
            .metric-label {
                font-size: 12px;
                opacity: 0.9;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            /* Modal Close Button */
            .modal-close {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255,255,255,0.2);
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: all 0.2s ease;
                color: white;
            }
            .modal-close:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }
            
            /* Modal Body */
            .modal-body {
                flex: 1;
                display: flex;
                overflow: hidden;
                background: #f8f9fa;
            }
            
            /* Sidebar Navigation */
            .sidebar-nav {
                width: 180px;
                background: white;
                padding: 12px 6px;
                border-right: 1px solid #e5e7eb;
                display: flex;
                flex-direction: column;
                gap: 2px;
            }
            .nav-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 12px;
                border: none;
                background: transparent;
                color: #6b7280;
                font-size: 13px;
                font-weight: 500;
                text-align: left;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            .nav-item:hover {
                background: #f3f4f6;
                color: #1f2937;
            }
            .nav-item.active {
                background: #6366f1;
                color: white;
            }
            .nav-icon {
                width: 20px;
                height: 20px;
                flex-shrink: 0;
            }
            
            /* Content Area */
            .content-area {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }
            .section-content {
                display: none;
            }
            .section-content.active {
                display: block;
                animation: fadeIn 0.3s ease;
            }
            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 24px;
            }
            .section-header h2 {
                font-size: 24px;
                font-weight: 700;
                color: #1f2937;
                margin: 0;
            }
            
            /* Tracking Grid */
            .tracking-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
                gap: 16px;
            }
            .tracking-card {
                background: white;
                border-radius: 10px;
                padding: 16px;
                box-shadow: 0 2px 6px rgba(0,0,0,0.05);
                transition: all 0.2s ease;
            }
            .tracking-card:hover {
                box-shadow: 0 3px 12px rgba(0,0,0,0.1);
                transform: translateY(-1px);
            }
            
            /* Admission Timer */
            .admission-timer {
                display: flex;
                align-items: center;
                background: #fef3c7;
                border: 2px solid #f59e0b;
                border-radius: 8px;
                padding: 12px 16px;
                margin-bottom: 16px;
                font-size: 14px;
                color: #92400e;
            }
            .admission-timer.timer-warning {
                background: #fee2e2;
                border-color: #ef4444;
                color: #991b1b;
            }
            .admission-timer.timer-urgent {
                background: #dc2626;
                border-color: #991b1b;
                color: white;
                animation: pulse 2s infinite;
            }
            .timer-text {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .timer-items {
                font-size: 12px;
                opacity: 0.9;
                margin-left: 28px;
            }
            
            /* Aftercare Progress Tracking */
            .aftercare-options-tracking {
                margin-top: 16px;
                border-top: 1px solid #e5e7eb;
                padding-top: 12px;
            }
            .aftercare-option-item {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                margin-bottom: 12px;
            }
            .option-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }
            .option-name {
                font-weight: 600;
                font-size: 14px;
                color: #111827;
            }
            .option-status {
                font-size: 12px;
                padding: 4px 10px;
                border-radius: 12px;
                font-weight: 500;
                text-transform: capitalize;
            }
            .status-exploring {
                background: #dbeafe;
                color: #1e40af;
            }
            .status-in-progress {
                background: #fef3c7;
                color: #92400e;
            }
            .status-accepted {
                background: #d1fae5;
                color: #065f46;
            }
            .status-declined {
                background: #fee2e2;
                color: #991b1b;
            }
            
            /* Progress Tracker Steps */
            .progress-tracker {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }
            .progress-step {
                flex: 1;
                min-width: 100px;
                background: white;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                padding: 8px;
                text-align: center;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 4px;
            }
            .progress-step:hover {
                border-color: #6366f1;
                background: #eef2ff;
            }
            .progress-step.completed {
                background: #10b981;
                border-color: #10b981;
                color: white;
            }
            .step-icon {
                font-size: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.2s ease;
            }
            
            .progress-step:hover .step-icon {
                transform: scale(1.1);
            }
            
            .progress-step.completed .step-icon svg {
                animation: svgCheckPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            }
            
            @keyframes svgCheckPop {
                0% {
                    transform: scale(0) rotate(-45deg);
                    opacity: 0;
                }
                50% {
                    transform: scale(1.2) rotate(5deg);
                }
                100% {
                    transform: scale(1) rotate(0deg);
                    opacity: 1;
                }
            }
            .step-label {
                font-size: 11px;
                font-weight: 500;
            }
            
            /* Day indicators */
            .days-indicator {
                background: #fbbf24;
                color: #78350f;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: 600;
                margin-left: auto;
            }
            .days-15, .days-16 {
                background: #fb923c;
                color: #7c2d12;
            }
            .days-17, .days-18, .days-19, .days-20 {
                background: #ef4444;
                color: white;
            }
            
            /* Highlight states */
            .highlight-warning {
                background: #fef3c7 !important;
            }
            .highlight-danger {
                background: #fee2e2 !important;
            }
            
            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.8; }
                100% { opacity: 1; }
            }
            .card-title {
                font-size: 15px;
                font-weight: 600;
                color: #1f2937;
                margin: 0 0 12px 0;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            /* Checklist Styles */
            .checklist {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }
            .checklist-item {
                display: flex;
                align-items: center;
                cursor: pointer;
                padding: 8px 10px;
                border-radius: 6px;
                transition: all 0.2s ease;
                position: relative;
                font-size: 13px;
            }
            .checklist-item:hover {
                background: #f9fafb;
            }
            .checklist-item.highlight-warning {
                background: #fef3c7;
                border: 1px solid #fbbf24;
            }
            .checklist-item.highlight-danger {
                background: #fee2e2;
                border: 1px solid #ef4444;
            }
            .checklist-item input[type="checkbox"] {
                position: absolute;
                opacity: 0;
                cursor: pointer;
            }
            
            .checklist-item input[type="checkbox"][style*="pointer-events: none"] {
                cursor: default;
            }
            .checkbox-custom {
                width: 24px;
                height: 24px;
                border: 2.5px solid #e5e7eb;
                border-radius: 6px;
                margin-right: 12px;
                position: relative;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                flex-shrink: 0;
                background: white;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                overflow: hidden;
            }
            
            .checklist-item:hover .checkbox-custom {
                border-color: #22c55e;
                transform: scale(1.05);
                box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.1),
                            0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .checkbox-custom::before {
                content: '';
                position: absolute;
                top: -1px;
                left: -1px;
                right: -1px;
                bottom: -1px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                transform: scale(0);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                border-radius: 4px;
            }
            
            .checklist-item input:checked ~ .checkbox-custom,
            .checklist-item input[checked] ~ .checkbox-custom {
                border-color: transparent;
                animation: checkPulse 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            }
            
            .checklist-item input:checked ~ .checkbox-custom::before,
            .checklist-item input[checked] ~ .checkbox-custom::before {
                transform: scale(1);
            }
            
            .checklist-item input:checked ~ .checkbox-custom::after,
            .checklist-item input[checked] ~ .checkbox-custom::after {
                content: '';
                position: absolute;
                width: 7px;
                height: 12px;
                border: solid white;
                border-width: 0 3px 3px 0;
                top: 40%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(45deg) scale(1);
                animation: checkmarkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
                animation-delay: 0.1s;
                animation-fill-mode: both;
                z-index: 2;
            }
            
            @keyframes checkPulse {
                0% { 
                    transform: scale(1); 
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }
                30% { 
                    transform: scale(0.95); 
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                }
                60% { 
                    transform: scale(1.1); 
                    box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.15),
                                0 2px 4px rgba(0, 0, 0, 0.1);
                }
                100% { 
                    transform: scale(1); 
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }
            }
            
            @keyframes checkmarkPop {
                0% {
                    transform: translate(-50%, -50%) rotate(45deg) scale(0);
                    opacity: 0;
                }
                50% {
                    transform: translate(-50%, -50%) rotate(45deg) scale(1.3);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) rotate(45deg) scale(1);
                    opacity: 1;
                }
            }
            .item-text {
                flex: 1;
                color: #374151;
                font-weight: 500;
                font-size: 13px;
            }
            .checklist-item input:checked ~ .item-text,
            .checklist-item input[checked] ~ .item-text {
                color: #6b7280;
                text-decoration: line-through;
            }
            .completion-date {
                font-size: 11px;
                color: #9ca3af;
                margin-left: auto;
            }
            .days-indicator {
                font-size: 12px;
                font-weight: 600;
                padding: 2px 8px;
                border-radius: 12px;
                margin-left: 8px;
            }
            .days-14, .days-15, .days-16 {
                background: #fef3c7;
                color: #92400e;
            }
            .days-indicator.days-17,
            .days-indicator.days-18,
            .days-indicator.days-19,
            .days-indicator.days-20 {
                background: #fee2e2;
                color: #991b1b;
            }
            
            /* Assessment Scores */
            .assessment-scores {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 16px;
            }
            .score-item {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }
            .score-item label {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
            }
            .score-input {
                padding: 8px 12px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                text-align: center;
                transition: all 0.2s ease;
            }
            .score-input:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            /* Team Grid */
            .team-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 16px;
            }
            .team-member-card {
                background: white;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
                transition: all 0.2s ease;
            }
            .team-member-card:hover {
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
                transform: translateY(-2px);
            }
            .member-icon {
                font-size: 32px;
                margin-bottom: 8px;
            }
            .team-member-card label {
                display: block;
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
            }
            .team-input {
                width: 100%;
                padding: 10px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                text-align: center;
                font-size: 18px;
                font-weight: 700;
                text-transform: uppercase;
                transition: all 0.2s ease;
            }
            .team-input:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            
            /* Notes Section */
            .notes-container {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .notes-textarea {
                width: 100%;
                min-height: 300px;
                padding: 16px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-family: inherit;
                font-size: 14px;
                line-height: 1.5;
                resize: vertical;
                transition: all 0.2s ease;
            }
            .notes-textarea:focus {
                outline: none;
                border-color: #6366f1;
                box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
            }
            .notes-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 12px;
            }
            .save-status {
                font-size: 12px;
                color: #10b981;
                display: flex;
                align-items: center;
                gap: 4px;
            }
            .save-status.saving {
                color: #6366f1;
            }
            .notes-timestamp {
                font-size: 12px;
                color: #9ca3af;
            }
            
            /* Buttons */
            .btn-primary {
                background: #6366f1;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            .btn-primary:hover {
                background: #4f46e5;
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            
            /* Animations */
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideIn {
                from { transform: translateY(20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .detail-tab-content {
                padding: 20px;
            }
            .milestone-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                margin-bottom: 8px;
                background: #f9fafb;
                border-radius: 8px;
                border: 1px solid #e5e7eb;
            }
            .milestone-item:hover {
                background: #f3f4f6;
            }
            .aftercare-item {
                padding: 15px;
                margin-bottom: 10px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
            }
            
            /* Visual indicator color coding */
            .milestone-indicator {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 28px;
                height: 28px;
                border-radius: 6px;
                font-size: 16px;
                transition: all 0.2s ease;
                cursor: pointer;
                user-select: none;
            }
            
            .milestone-indicator.complete {
                background-color: #10b981;
                color: white;
            }
            
            .milestone-indicator.overdue {
                background-color: #ef4444;
                color: white;
                animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            
            .milestone-indicator.due-today {
                background-color: #f59e0b;
                color: white;
            }
            
            .milestone-indicator.due-soon {
                background-color: #f59e0b;
                color: white;
                opacity: 0.8;
            }
            
            .milestone-indicator.in-progress {
                background-color: #3b82f6;
                color: white;
            }
            
            .milestone-indicator.pending {
                background: #e5e7eb;
                color: #6b7280;
            }
            
            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: .8;
                }
            }
            /* Days in care color coding */
            .days-in-care {
                font-weight: 500;
            }
            
            td.days-in-care {
                text-align: center;
            }
            
            /* Color code days based on milestones */
            .days-13 { color: #f59e0b; font-weight: 600; }
            .days-14 { color: #f59e0b; font-weight: 600; }
            .days-16plus { color: #ef4444; font-weight: 600; }
        `;
        document.head.appendChild(style);
        
        // Add keyboard listener for ESC key
        document.addEventListener('keydown', handleModalKeydown);
        
        // Fix overlay click handling
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function(event) {
                if (event.target === this) {
                    closeModal();
                }
            });
            
            // Prevent clicks inside modal from bubbling up
            const modalContent = overlay.querySelector('.modal-content');
            if (modalContent) {
                modalContent.addEventListener('click', function(event) {
                    event.stopPropagation();
                });
            }
        }
        
    } catch (error) {
        console.error('Failed to load client details:', error);
        showAlert('Failed to load client details', 'error');
    }
}

// Update tracking field for a client
async function updateTracking(clientId, field, checked) {
    try {
        const update = {};
        update[field] = checked;
        
        // Add timestamp if checked
        if (checked) {
            update[field + 'Date'] = new Date().toISOString();
        } else {
            update[field + 'Date'] = null;
        }
        
        await window.clientManager.updateClient(clientId, update);
        
        // Visual feedback
        const checkbox = document.querySelector(`#${field.replace(/([A-Z])/g, '-$1').toLowerCase()}-${clientId}`);
        if (checkbox) {
            const label = checkbox.closest('.checklist-item');
            if (label) {
                label.style.background = checked ? '#d1fae5' : 'transparent';
                setTimeout(() => {
                    label.style.background = '';
                }, 500);
            }
        }
        
        // Update completion percentage
        updateCompletionPercentage(clientId);
        
        // Show success message
        showAlert(`✅ ${field} ${checked ? 'marked complete' : 'unchecked'}`, 'success');
    } catch (error) {
        console.error('Failed to update tracking:', error);
        showAlert('Failed to update tracking', 'error');
    }
}

// Update aftercare option progress
async function updateAftercareProgress(clientId, programId, field, value) {
    try {
        const progressUpdate = {};
        progressUpdate[field] = value;
        
        // Add timestamp for certain fields
        if (value && ['familyContacted', 'recordsSent', 'assessmentScheduled', 'accepted'].includes(field)) {
            progressUpdate[field + 'Date'] = new Date().toISOString();
        }
        
        // Update status based on progress
        if (field === 'accepted' && value) {
            progressUpdate.status = 'accepted';
        } else if (field === 'assessmentScheduled' && value) {
            progressUpdate.status = 'in-progress';
        }
        
        await window.clientManager.updateAftercareProgress(clientId, programId, progressUpdate);
        
        // Reload the section to show updated data
        const client = await window.clientManager.getClient(clientId);
        if (client && client.aftercareOptions) {
            const aftercareHTML = client.aftercareOptions.map(option => `
                <div class="aftercare-option-item">
                    <div class="option-header">
                        <span class="option-name">${option.programName}</span>
                        <span class="option-status status-${option.status}">${option.status}</span>
                    </div>
                    
                    <div class="progress-tracker">
                        <div class="progress-step ${option.familyContacted ? 'completed' : ''}"
                             onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'familyContacted', ${!option.familyContacted})">
                            <span class="step-icon">
                                ${option.familyContacted ? 
                                    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                    '☎️'}
                            </span>
                            <span class="step-label">Family Contacted</span>
                        </div>
                        <div class="progress-step ${option.recordsSent ? 'completed' : ''}"
                             onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'recordsSent', ${!option.recordsSent})">
                            <span class="step-icon">
                                ${option.recordsSent ? 
                                    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                    '📄'}
                            </span>
                            <span class="step-label">Records Sent</span>
                        </div>
                        <div class="progress-step ${option.assessmentScheduled ? 'completed' : ''}"
                             onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'assessmentScheduled', ${!option.assessmentScheduled})">
                            <span class="step-icon">
                                ${option.assessmentScheduled ? 
                                    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                    '📅'}
                            </span>
                            <span class="step-label">Assessment Set</span>
                        </div>
                        <div class="progress-step ${option.accepted ? 'completed' : ''}"
                             onclick="updateAftercareProgress('${clientId}', '${option.programId}', 'accepted', ${!option.accepted})">
                            <span class="step-icon">
                                ${option.accepted ? 
                                    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 10.5L7.5 14L16 5.5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>' : 
                                    '✅'}
                            </span>
                            <span class="step-label">Accepted</span>
                        </div>
                    </div>
                </div>
            `).join('');
            
            // Update just the aftercare tracking section
            const trackingSection = document.querySelector('.aftercare-options-tracking');
            if (trackingSection) {
                trackingSection.innerHTML = `
                    <h4 style="font-size: 14px; margin: 16px 0 12px 0; font-weight: 600; color: #374151;">
                        Aftercare Options Progress
                    </h4>
                    ${aftercareHTML}
                `;
            }
        }
        
        showAlert(`✅ Updated ${field} for aftercare option`, 'success');
    } catch (error) {
        console.error('Failed to update aftercare progress:', error);
        showAlert('Failed to update aftercare progress', 'error');
    }
}

// Update completion percentage in the header
async function updateCompletionPercentage(clientId) {
    const client = await window.clientManager.getClient(clientId);
    if (!client) return;
    
    const trackingFields = [
        'needsAssessment', 'healthPhysical', 'aftercareThreadSent',
        'optionsDocUploaded', 'dischargePacketUploaded', 'referralClosureCorrespondence',
        'gadCompleted', 'phqCompleted', 'satisfactionSurvey', 
        'dischargeSummary', 'dischargePlanningNote', 'dischargeASAM'
    ];
    const completed = trackingFields.filter(field => client[field]).length;
    const completionPercentage = trackingFields.length > 0 ? Math.round((completed / trackingFields.length) * 100) : 0;
    
    // Update the percentage display
    const percentageDisplay = document.querySelector('.metric-value');
    if (percentageDisplay && percentageDisplay.nextElementSibling?.textContent === 'Completed') {
        percentageDisplay.textContent = `${completionPercentage}%`;
    }
}

// Build milestones list for client details
async function buildMilestonesList(client, milestones, daysInCare) {
    let html = '<div>';
    
    for (const milestone of milestones) {
        const display = milestonesManager.getMilestoneDisplayStatus(milestone, daysInCare);
        const milestoneType = Object.values(milestonesManager.milestoneTypes).find(t => t.id === milestone.milestone);
        
        html += `
            <div class="milestone-item">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 20px;">${milestoneType.icon}</span>
                    <div>
                        <strong>${milestoneType.displayName}</strong>
                        <div style="font-size: 12px; color: #6b7280;">${milestoneType.description}</div>
                    </div>
                </div>
                <button onclick="toggleMilestone('${client.id}', '${milestone.milestone}')" 
                        class="milestone-indicator ${display.class}" 
                        style="padding: 8px 16px; border: none; border-radius: 6px; cursor: pointer; background: ${display.class === 'complete' ? '#10b981' : '#e5e7eb'}; color: ${display.class === 'complete' ? 'white' : '#374151'};">
                    ${display.icon} ${display.class === 'complete' ? 'Complete' : 'Mark Complete'}
                </button>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Build aftercare list for client details
function buildAftercareList(aftercareOptions, clientId) {
    if (aftercareOptions.length === 0) {
        return '<p style="color: #6b7280;">No aftercare options added yet.</p>';
    }
    
    let html = '<div>';
    
    for (const option of aftercareOptions) {
        const statusDisplay = aftercareManager.getStatusDisplay(option.status);
        
        html += `
            <div class="aftercare-item">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div style="flex: 1;">
                        <h5 style="margin: 0 0 8px 0;">Option ${option.ordinal}: ${option.programName || 'Unnamed Program'}</h5>
                        <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                            <span style="padding: 4px 8px; background: ${statusDisplay.background}; color: ${statusDisplay.color}; border-radius: 4px; font-size: 12px;">
                                ${statusDisplay.icon} ${statusDisplay.label}
                            </span>
                            ${option.dateProvidedToFamily ? `<span style="font-size: 12px; color: #6b7280;">Provided: ${option.dateProvidedToFamily}</span>` : ''}
                        </div>
                        ${option.notes ? `<p style="margin: 5px 0; font-size: 14px; color: #374151;">${option.notes}</p>` : ''}
                    </div>
                    <button onclick="editAftercareOption('${clientId}', ${option.ordinal})" style="padding: 6px 12px; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; cursor: pointer;">
                        Edit
                    </button>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    return html;
}

// Switch detail section
function switchDetailSection(sectionName, event) {
    // Hide all sections
    document.querySelectorAll('.section-content').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const sectionElement = document.getElementById(sectionName + 'Section');
    if (sectionElement) {
        sectionElement.classList.add('active');
    }
    
    // Add active class to selected nav item
    if (event && event.target) {
        event.target.classList.add('active');
    } else {
        // If no event, find the nav item by section name and activate it
        const navItem = document.querySelector(`.nav-item[onclick*="${sectionName}"]`);
        if (navItem) navItem.classList.add('active');
    }
}

// Save care team
async function saveCareTeam(clientId) {
    try {
        const updates = {
            clinicalCoachInitials: document.getElementById('clinicalCoach').value,
            caseManagerInitials: document.getElementById('caseManager').value,
            primaryTherapistInitials: document.getElementById('primaryTherapist').value,
            familyAmbassadorPrimaryInitials: document.getElementById('familyAmbassador').value
        };
        
        await window.clientManager.updateClient(clientId, updates);
        showAlert('Care team updated successfully', 'success');
        
        // Refresh the table
        await loadHouseView(currentHouseId);
    } catch (error) {
        console.error('Failed to save care team:', error);
        showAlert('Failed to save care team', 'error');
    }
}

// Update tracking checkbox
async function updateTracking(clientId, field, checked) {
    try {
        const updates = { [field]: checked };
        // Add timestamp if checked
        if (checked) {
            updates[field + 'Date'] = new Date().toISOString();
        }
        
        await window.clientManager.updateClient(clientId, updates);
        
        // Visual feedback
        const checkbox = document.getElementById(`${field.replace(/([A-Z])/g, '-$1').toLowerCase()}-${clientId}`);
        if (checkbox) {
            const item = checkbox.closest('.checklist-item');
            if (item) {
                // Add completion animation
                item.style.transform = 'scale(1.05)';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                }, 200);
            }
        }
        
        // Update completion percentage
        updateCompletionPercentage(clientId);
    } catch (error) {
        console.error('Failed to update tracking:', error);
        showAlert('Failed to update tracking', 'error');
        // Revert checkbox
        const checkbox = document.getElementById(`${field.replace(/([A-Z])/g, '-$1').toLowerCase()}-${clientId}`);
        if (checkbox) checkbox.checked = !checked;
    }
}

// Update score
async function updateScore(clientId, field, value) {
    try {
        const updates = { [field]: value ? parseInt(value) : null };
        await window.clientManager.updateClient(clientId, updates);
        
        // Visual feedback
        const input = document.getElementById(`${field.replace('Score', '-score')}-${clientId}`);
        if (input) {
            input.style.borderColor = '#10b981';
            setTimeout(() => {
                input.style.borderColor = '#e5e7eb';
            }, 1000);
        }
    } catch (error) {
        console.error('Failed to update score:', error);
        showAlert('Failed to update score', 'error');
    }
}

// Update team member
async function updateTeamMember(clientId, field, value) {
    try {
        const updates = { [field]: value.toUpperCase() };
        await window.clientManager.updateClient(clientId, updates);
        
        // Visual feedback
        const input = event.target;
        if (input) {
            input.style.borderColor = '#10b981';
            setTimeout(() => {
                input.style.borderColor = '#e5e7eb';
            }, 1000);
        }
    } catch (error) {
        console.error('Failed to update team member:', error);
        showAlert('Failed to update team member', 'error');
    }
}

// Auto-save notes
let noteSaveTimeout;
async function autoSaveNotes(clientId, notes) {
    const statusElement = document.getElementById('noteSaveStatus');
    if (statusElement) {
        statusElement.textContent = 'Saving...';
        statusElement.classList.add('saving');
    }
    
    // Clear previous timeout
    clearTimeout(noteSaveTimeout);
    
    // Set new timeout
    noteSaveTimeout = setTimeout(async () => {
        try {
            await window.clientManager.updateClient(clientId, { 
                notes,
                notesUpdatedAt: new Date().toISOString()
            });
            
            if (statusElement) {
                statusElement.textContent = 'All changes saved';
                statusElement.classList.remove('saving');
            }
        } catch (error) {
            console.error('Failed to save notes:', error);
            if (statusElement) {
                statusElement.textContent = 'Failed to save';
                statusElement.classList.remove('saving');
                statusElement.style.color = '#ef4444';
            }
        }
    }, 1000); // Save after 1 second of no typing
}

// Update completion percentage
async function updateCompletionPercentage(clientId) {
    try {
        const client = await window.clientManager.getClient(clientId);
        const trackingFields = [
            'needsAssessment', 'healthPhysical', 'aftercareThreadSent',
            'optionsDocUploaded', 'dischargePacketUploaded', 'gadCompleted',
            'phqCompleted', 'satisfactionSurvey', 'referralClosure', 
            'dischargeSummary', 'dischargePlanningNote', 'dischargeASAM'
        ];
        
        const completed = trackingFields.filter(field => client[field]).length;
        const percentage = Math.round((completed / trackingFields.length) * 100);
        
        const percentageElement = document.querySelector('.metric-value');
        if (percentageElement) {
            percentageElement.textContent = percentage + '%';
            // Add animation
            percentageElement.style.transform = 'scale(1.2)';
            setTimeout(() => {
                percentageElement.style.transform = 'scale(1)';
            }, 300);
        }
    } catch (error) {
        console.error('Failed to update percentage:', error);
    }
}

// Build assessment history
async function buildAssessmentHistory(clientId) {
    // This would fetch assessment history from your data source
    // For now, return a placeholder
    return `
        <div class="assessment-placeholder">
            <p style="color: #6b7280; text-align: center; padding: 40px;">
                No assessments recorded yet. Click "Add Assessment" to begin.
            </p>
        </div>
    `;
}

// Build modern aftercare list
function buildModernAftercareList(aftercareOptions, clientId) {
    if (!aftercareOptions || aftercareOptions.length === 0) {
        return `
            <div class="aftercare-placeholder">
                <p style="color: #6b7280; text-align: center; padding: 40px;">
                    No aftercare options added yet. Click "Add Option" to begin.
                </p>
            </div>
        `;
    }
    
    return aftercareOptions.map(option => `
        <div class="aftercare-card">
            <div class="aftercare-header">
                <h4>${option.programName}</h4>
                <span class="aftercare-status status-${option.status}">${option.status}</span>
            </div>
            <div class="aftercare-details">
                ${option.dateProvided ? `<p><strong>Date Provided:</strong> ${new Date(option.dateProvided).toLocaleDateString()}</p>` : ''}
                ${option.notes ? `<p><strong>Notes:</strong> ${option.notes}</p>` : ''}
            </div>
            <button class="btn-secondary" onclick="removeAftercareOption('${clientId}', '${option.id}')">Remove</button>
        </div>
    `).join('');
}

// Build client timeline
function buildClientTimeline(client, milestones, daysInCare) {
    const events = [];
    
    // Add admission event
    if (client.admissionDate) {
        events.push({
            date: new Date(client.admissionDate),
            type: 'admission',
            title: 'Admitted',
            description: `${client.initials} admitted to ${client.houseId || 'facility'}`
        });
    }
    
    // Add tracking events
    const trackingEvents = [
        { field: 'needsAssessmentDate', title: 'Needs Assessment Completed' },
        { field: 'healthPhysicalDate', title: 'Health & Physical Assessment Completed' },
        { field: 'aftercareThreadDate', title: 'Aftercare Planning Thread Sent' },
        { field: 'optionsDocDate', title: 'Options Document Uploaded' },
        { field: 'dischargePacketDate', title: 'Discharge Packet Uploaded' }
    ];
    
    trackingEvents.forEach(event => {
        if (client[event.field]) {
            events.push({
                date: new Date(client[event.field]),
                type: 'tracking',
                title: event.title
            });
        }
    });
    
    // Add discharge event
    if (client.dischargeDate) {
        events.push({
            date: new Date(client.dischargeDate),
            type: 'discharge',
            title: 'Discharged',
            description: `After ${daysInCare} days in care`
        });
    }
    
    // Sort events by date
    events.sort((a, b) => a.date - b.date);
    
    // Build timeline HTML
    return `
        <div class="timeline">
            ${events.map((event, index) => `
                <div class="timeline-event ${event.type}">
                    <div class="timeline-date">${event.date.toLocaleDateString()}</div>
                    <div class="timeline-content">
                        <h4>${event.title}</h4>
                        ${event.description ? `<p>${event.description}</p>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Add aftercare option
async function addAftercareOption(clientId) {
    // Get programs for selection
    const programs = JSON.parse(localStorage.getItem('therapyPrograms') || '[]');
    
    let programOptions = programs.map(p => 
        `<option value="${p.name}">${p.name}</option>`
    ).join('');
    
    const modalHTML = `
        <div class="modal-overlay">
            <div class="modal-content" style="width: 500px;">
                <h3>Add Aftercare Option</h3>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Program Name</label>
                    <select id="programSelect" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">
                        <option value="">Select a program...</option>
                        ${programOptions}
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Status</label>
                    <select id="optionStatus" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">
                        <option value="pending">Pending</option>
                        <option value="sent">Sent to Family</option>
                        <option value="engaged">Family Engaged</option>
                        <option value="accepted">Accepted</option>
                        <option value="declined">Declined</option>
                        <option value="waitlist">Waitlist</option>
                    </select>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Date Provided to Family</label>
                    <input type="date" id="dateProvided" style="width: 100%; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;">
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px;">Notes</label>
                    <textarea id="optionNotes" style="width: 100%; height: 80px; padding: 8px; border: 1px solid #e5e7eb; border-radius: 4px;"></textarea>
                </div>
                
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button onclick="window.closeModal()" style="padding: 8px 16px; background: #e5e7eb; border: none; border-radius: 6px; cursor: pointer;">
                        Cancel
                    </button>
                    <button onclick="handleAddAftercareOption('${clientId}')" style="padding: 8px 16px; background: #6366f1; color: white; border: none; border-radius: 6px; cursor: pointer;">
                        Add Option
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Add keyboard listener for ESC key
    document.addEventListener('keydown', handleModalKeydown);
    
    // Fix overlay click handling
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', function(event) {
            if (event.target === this) {
                closeModal();
            }
        });
    }
}

// Handle add aftercare option
async function handleAddAftercareOption(clientId) {
    try {
        const programName = document.getElementById('programSelect').value;
        const status = document.getElementById('optionStatus').value;
        const dateProvided = document.getElementById('dateProvided').value;
        const notes = document.getElementById('optionNotes').value;
        
        if (!programName) {
            showAlert('Please select a program', 'error');
            return;
        }
        
        await aftercareManager.addAftercareOption(clientId, {
            programName,
            status,
            dateProvidedToFamily: dateProvided,
            notes
        });
        
        showAlert('Aftercare option added successfully', 'success');
        closeModal();
        
        // Refresh the client details
        viewClientDetails(clientId);
        
        // Refresh the table
        await loadHouseView(currentHouseId);
    } catch (error) {
        console.error('Failed to add aftercare option:', error);
        showAlert(error.message || 'Failed to add aftercare option', 'error');
    }
}

// Edit client - open edit modal with pre-filled data
async function editClient(clientId) {
    try {
        const client = await window.clientManager.getClient(clientId);
        if (!client) {
            showAlert('Client not found', 'error');
            return;
        }
        
        const houses = await housesManager.getActiveHouses();
        
        const modalHTML = `
            <div class="modal-overlay">
                <div class="modal-content" style="width: 580px; padding: 28px 32px; max-height: 92vh; overflow-y: auto;">
                    <h3>Edit Client: ${client.initials}</h3>
                    <form id="editClientForm" onsubmit="handleEditClient(event, '${clientId}')">
                        <div style="display: grid; gap: 14px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label>Client Initials *</label>
                                    <input type="text" name="initials" maxlength="4" required 
                                           value="${client.initials || ''}"
                                           style="text-transform: uppercase; width: 100%;">
                                </div>
                                <div>
                                    <label>Kipu ID *</label>
                                    <input type="text" name="kipuId" required 
                                           value="${client.kipuId || ''}"
                                           style="width: 100%;">
                                </div>
                            </div>
                            <div>
                                <label>House *</label>
                                <select name="houseId" required style="width: 100%;" onchange="toggleCoveUnit(this)">
                                    ${houses.map(h => `
                                        <option value="${h.id}" ${h.id === client.houseId ? 'selected' : ''}>
                                            ${h.name}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>
                            <div id="editCoveUnitSection" style="display: ${houses.find(h => h.id === client.houseId)?.name?.toLowerCase().includes('cove') ? 'block' : 'none'};">
                                <label>Cove Unit *</label>
                                <select name="coveUnit" style="width: 100%;">
                                    <option value="">Select Unit...</option>
                                    <option value="A" ${client.coveUnit === 'A' ? 'selected' : ''}>Unit A</option>
                                    <option value="B" ${client.coveUnit === 'B' ? 'selected' : ''}>Unit B</option>
                                </select>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label>Admission Date</label>
                                    <input type="date" name="admissionDate" 
                                           value="${client.admissionDate || ''}"
                                           style="width: 100%;">
                                </div>
                                <div>
                                    <label>Expected Discharge</label>
                                    <input type="date" name="expectedDischargeDate" 
                                           value="${client.expectedDischargeDate || ''}"
                                           style="width: 100%;">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label>Clinical Coach</label>
                                    <input type="text" name="clinicalCoachInitials" maxlength="4" 
                                           value="${client.clinicalCoachInitials || ''}"
                                           placeholder="Initials" style="text-transform: uppercase; width: 100%;">
                                </div>
                                <div>
                                    <label>Primary Therapist</label>
                                    <input type="text" name="primaryTherapistInitials" maxlength="4"
                                           value="${client.primaryTherapistInitials || ''}"
                                           placeholder="Initials" style="text-transform: uppercase; width: 100%;">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label>Family Ambassador (1°)</label>
                                    <input type="text" name="familyAmbassadorPrimaryInitials" maxlength="4"
                                           value="${client.familyAmbassadorPrimaryInitials || ''}"
                                           placeholder="Initials" style="text-transform: uppercase; width: 100%;">
                                </div>
                                <div>
                                    <label>Family Ambassador (2°)</label>
                                    <input type="text" name="familyAmbassadorSecondaryInitials" maxlength="4"
                                           value="${client.familyAmbassadorSecondaryInitials || ''}"
                                           placeholder="Initials" style="text-transform: uppercase; width: 100%;">
                                </div>
                            </div>
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                                <div>
                                    <label>Bed Assignment</label>
                                    <input type="text" name="bedAssignment"
                                           value="${client.bedAssignment || ''}"
                                           placeholder="e.g., Room 3" style="width: 100%;">
                                </div>
                                <div>
                                    <label>Actual Discharge Date</label>
                                    <input type="date" name="dischargeDate" 
                                           value="${client.dischargeDate || ''}"
                                           style="width: 100%;">
                                </div>
                            </div>
                            <div>
                                <label>Notes</label>
                                <textarea name="notes" rows="2"
                                       placeholder="Internal notes..."
                                       style="width: 100%; resize: vertical; font-size: 13px;">${client.notes || ''}</textarea>
                            </div>
                        </div>
                        <div style="display: flex; gap: 12px; margin-top: 24px; justify-content: space-between; align-items: center;">
                            <button type="button" onclick="window.dischargeClientModal('${clientId}')" 
                                    style="padding: 11px 22px; background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: #fca5a5;">
                                🚪 Discharge Client
                            </button>
                            <div style="display: flex; gap: 12px;">
                                <button type="button" onclick="window.closeModal()" 
                                        style="padding: 11px 22px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.85);">
                                    Cancel
                                </button>
                                <button type="submit" 
                                        style="padding: 11px 22px; background: #6366f1; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 500;">
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        document.addEventListener('keydown', handleModalKeydown);
        
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function(event) {
                if (event.target === this) {
                    closeModal();
                }
            });
        }
    } catch (error) {
        console.error('Error opening edit modal:', error);
        showAlert('Failed to load client data', 'error');
    }
}

// Handle edit client form submission
window.handleEditClient = async function(event, clientId) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    
    const updates = {
        initials: formData.get('initials')?.toUpperCase(),
        kipuId: formData.get('kipuId'),
        houseId: formData.get('houseId'),
        coveUnit: formData.get('coveUnit') || null,
        admissionDate: formData.get('admissionDate') || null,
        expectedDischargeDate: formData.get('expectedDischargeDate') || null,
        clinicalCoachInitials: formData.get('clinicalCoachInitials')?.toUpperCase() || '',
        primaryTherapistInitials: formData.get('primaryTherapistInitials')?.toUpperCase() || '',
        familyAmbassadorPrimaryInitials: formData.get('familyAmbassadorPrimaryInitials')?.toUpperCase() || '',
        familyAmbassadorSecondaryInitials: formData.get('familyAmbassadorSecondaryInitials')?.toUpperCase() || '',
        bedAssignment: formData.get('bedAssignment') || '',
        dischargeDate: formData.get('dischargeDate') || null,
        notes: formData.get('notes') || ''
    };
    
    // Update status based on discharge date
    updates.status = updates.dischargeDate ? 'discharged' : 'active';
    
    try {
        await window.clientManager.updateClient(clientId, updates);
        
        showAlert('Client updated successfully!', 'success');
        closeModal();
        
        // Refresh the current view
        if (typeof loadHouseView === 'function' && currentHouseId) {
            await loadHouseView(currentHouseId);
        }
        if (typeof buildHouseNavigation === 'function') {
            await buildHouseNavigation();
        }
        
        // Emit event for other listeners
        if (window.eventBus) {
            window.eventBus.emit('clients:updated');
        }
    } catch (error) {
        console.error('Failed to update client:', error);
        showAlert(error.message || 'Failed to update client', 'error');
    }
};

// Discharge client modal handler
window.dischargeClientModal = async function(clientId) {
    try {
        const client = await window.clientManager.getClient(clientId);
        if (!client) {
            showAlert('Client not found', 'error');
            return;
        }
        
        // Show confirmation dialog
        const confirmed = confirm(
            `Are you sure you want to discharge ${client.initials}?\n\n` +
            `This will:\n` +
            `• Set today's date as the discharge date\n` +
            `• Move the client to the Discharged archive\n\n` +
            `This action can be undone by editing the client and clearing the discharge date.`
        );
        
        if (!confirmed) return;
        
        // Discharge the client with today's date
        const today = new Date().toISOString().split('T')[0];
        await window.clientManager.dischargeClient(clientId, today);
        
        showAlert(`${client.initials} has been discharged successfully`, 'success');
        closeModal();
        
        // Refresh the current view
        if (typeof loadHouseView === 'function' && currentHouseId) {
            await loadHouseView(currentHouseId);
        }
        if (typeof buildHouseNavigation === 'function') {
            await buildHouseNavigation();
        }
        
        // Emit event for other listeners
        if (window.eventBus) {
            window.eventBus.emit('clients:updated');
        }
    } catch (error) {
        console.error('Failed to discharge client:', error);
        showAlert(error.message || 'Failed to discharge client', 'error');
    }
};

// Generate document for client
async function generateClientDocument(clientId, options = {}) {
    try {
        const client = await window.clientManager.getClient(clientId);
        if (!client) {
            showAlert('Client not found', 'error');
            return;
        }

        const contextPayload = {
            clientId,
            initials: client.initials || '',
            kipuId: client.kipuId || null
        };

        window.__pendingProgramsDocsClientContext = contextPayload;

        await mountProgramsDocsModule();

        if (window.CareConnectProgramsDocs?.setClientContext) {
            await window.CareConnectProgramsDocs.setClientContext(contextPayload);
        }

        window.__pendingProgramsDocsClientContext = null;

        if (window.clientManager?.setCurrentClient) {
            await window.clientManager.setCurrentClient(clientId);
        }

        localStorage.setItem('currentClientId', clientId);
        switchTab('programs');

        if (options.focusSearch && window.CareConnectProgramsDocs?.focusSearch) {
            window.CareConnectProgramsDocs.focusSearch();
        }

        if (window.CareConnect?.events) {
            try {
                window.CareConnect.events.emit('clients:programs-docs-opened', {
                    clientId,
                    initials: client.initials || ''
                });
            } catch (eventError) {
                console.warn('Programs docs open event failed:', eventError);
            }
        }

        showAlert(`Programs workspace ready for ${client.initials || 'client'}.`, 'success');
    } catch (error) {
        console.error('Failed to open Programs & Docs for client:', error);
        showAlert('Unable to open Programs & Docs. Please try again.', 'error');
    }
}

// Export current house
async function exportCurrentHouse() {
    try {
        const houseData = await housesManager.exportHouseData(currentHouseId);
        const json = JSON.stringify(houseData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${houseData.house.name}_export_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        showAlert('House data exported successfully!', 'success');
    } catch (error) {
        showAlert('Failed to export house data: ' + error.message, 'error');
    }
}

// Export all data
function exportAllData() {
    // To be implemented with Excel export
    showAlert('Excel export will be implemented with the Excel export module', 'info');
}

// Show bulk import
function showBulkImport() {
    // To be implemented with Excel import
    showAlert('Excel import will be implemented with the Excel import module', 'info');
}

// Show reports
function showReports() {
    // To be implemented with reporting module
    showAlert('Reports will be implemented with the reporting module', 'info');
}

// Toggle milestone completion
async function toggleMilestone(clientId, milestoneId) {
    try {
        // Ensure milestonesManager is available
        if (!window.milestonesManager) {
            console.warn('MilestonesManager not available, initializing...');
            if (typeof MilestonesManager !== 'undefined') {
                window.milestonesManager = new MilestonesManager(window.dbManager);
                milestonesManager = window.milestonesManager;
            } else {
                throw new Error('MilestonesManager class not loaded');
            }
        }
        
        // Check if client has milestones initialized, if not initialize them
        const existingMilestones = await milestonesManager.getClientMilestones(clientId);
        if (!existingMilestones || existingMilestones.length === 0) {
            console.log('Initializing milestones for client:', clientId);
            await milestonesManager.initializeClientMilestones(clientId);
        }
        
        await milestonesManager.toggleMilestone(clientId, milestoneId);
        await loadHouseView(currentHouseId); // Refresh the view
        showAlert('Milestone updated!', 'success');
    } catch (error) {
        console.error('Failed to toggle milestone:', error);
        showAlert('Failed to update milestone: ' + error.message, 'error');
    }
}

// Reset database
async function resetDatabase() {
    if (confirm('This will clear all local data and reload the page. Continue?')) {
        try {
            await clearIndexedDB();
            localStorage.clear();
            localStorage.clear();
            showAlert('Database cleared. Reloading...', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            showAlert('Failed to reset database: ' + error.message, 'error');
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// WINDOW EXPORTS - Functions called from HTML onclick handlers or other files
// ════

// Core initialization
window.initializeCMTracker = initializeCMTracker;
window.refreshCMTracker = initializeCMTracker;

// House navigation
window.switchToHouse = switchToHouse;
window.buildHouseNavigation = buildHouseNavigation;
window.loadHouseView = loadHouseView;

// Client operations
window.filterClients = filterClients;
window.searchClients = searchClients;
window.selectClient = selectClient;
window.displayClients = displayClients;
window.quickAddClient = quickAddClient;

// Client details/editing
window.editClient = editClient;
window.clearCurrentClient = clearCurrentClient;
window.updateCurrentClientDisplay = updateCurrentClientDisplay;

// Tracking & Milestones  
window.toggleMilestone = toggleMilestone;
window.updateTracking = updateTracking;
window.updateCompletionPercentage = updateCompletionPercentage;

// Export functionality
window.exportCurrentView = exportCurrentView;
window.exportCurrentHouse = exportCurrentHouse;
window.exportClientData = exportClientData;
window.importClientData = importClientData;

// Programs integration
window.toggleFavoriteProgram = toggleFavoriteProgram;
window.manageFavorites = manageFavorites;
window.loadFavoritePrograms = loadFavoritePrograms;
window.saveFavorites = saveFavorites;

// Aftercare
window.updateAftercareProgress = updateAftercareProgress;
window.addAftercareOption = addAftercareOption;
window.handleAddAftercareOption = handleAddAftercareOption;

// UI helpers
window.showAlert = showAlert;
window.toggleRecentClients = toggleRecentClients;
window.loadRecentClients = loadRecentClients;
window.quickSelectClient = quickSelectClient;
window.switchDetailSection = switchDetailSection;

// Care team
window.saveCareTeam = saveCareTeam;
window.updateScore = updateScore;
window.updateTeamMember = updateTeamMember;
window.autoSaveNotes = autoSaveNotes;

// Document generation
window.generateClientDocument = generateClientDocument;

// Database operations
window.resetDatabase = resetDatabase;

console.log(' CM Tracker comprehensive module loaded');
