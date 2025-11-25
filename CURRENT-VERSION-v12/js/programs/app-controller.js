/**
 * App Controller - Main UI controller for Programs & Document Creator module
 * Initializes all components and handles UI interactions
 * @file app-controller.js
 */

(function() {
  'use strict';

  // ============================================================================
  // STATE
  // ============================================================================

  const state = {
    currentView: 'grid',
    selectedProgramId: null,
    compareList: [],
    filters: {},
    sortBy: 'name',
    sortDesc: false,
    currentClient: null,
    builderOpen: true,
    mapInitialized: false,
    programsRendered: false,
  };

  // ============================================================================
  // DOM REFERENCES
  // ============================================================================

  const dom = {};

  function cacheDom() {
    // Toolbar
    dom.globalSearch = document.getElementById('globalSearch');
    dom.clientSelector = document.getElementById('clientSelector');
    dom.toggleBuilderBtn = document.getElementById('toggleBuilderBtn');
    dom.preferencesBtn = document.getElementById('preferencesBtn');

    // Client Context
    dom.clientContext = document.getElementById('clientContext');
    dom.clientContextContent = document.getElementById('clientContextContent');

    // Filter Rail
    dom.filterRail = document.getElementById('filterRail');
    dom.locFilters = document.getElementById('locFilters');
    dom.stateFilter = document.getElementById('stateFilter');
    dom.ageMin = document.getElementById('ageMin');
    dom.ageMax = document.getElementById('ageMax');
    dom.resultsCount = document.getElementById('resultsCount');
    dom.totalCount = document.getElementById('totalCount');
    dom.clearAllFilters = document.getElementById('clearAllFilters');

    // Results Area
    dom.resultsArea = document.getElementById('resultsArea');
    dom.resultsGrid = document.getElementById('resultsGrid');
    dom.resultsRows = document.getElementById('resultsRows');
    dom.resultsCompare = document.getElementById('resultsCompare');
    dom.resultsMap = document.getElementById('resultsMap');
    dom.resultsTableBody = document.getElementById('resultsTableBody');
    dom.emptyState = document.getElementById('emptyState');
    dom.sortSelect = document.getElementById('sortSelect');

    // Map
    dom.mapLegend = document.getElementById('mapLegend');
    dom.legendItems = document.getElementById('legendItems');
    dom.radiusSlider = document.getElementById('radiusSlider');
    dom.radiusValue = document.getElementById('radiusValue');
    dom.radiusPresets = document.getElementById('radiusPresets');

    // Builder
    dom.builderPane = document.getElementById('builderPane');
    dom.docTypeSelect = document.getElementById('docTypeSelect');
    dom.builderClient = document.getElementById('builderClient');
    dom.builderStatus = document.getElementById('builderStatus');
    dom.builderContent = document.getElementById('builderContent');

    // Modals
    dom.profileModal = document.getElementById('profileModal');
    dom.preferencesModal = document.getElementById('preferencesModal');
    dom.kipuModal = document.getElementById('kipuModal');
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  function init() {
    console.log('🚀 Initializing App Controller...');

    cacheDom();
    
    // CRITICAL: Ensure all modals are hidden on load
    hideAllModals();
    
    bindEvents();
    
    // Set up event listeners FIRST (before trying to init)
    window.addEventListener('ccprograms:loaded', () => {
      console.log('📦 ccprograms:loaded event received');
      tryInitPrograms();
    });
    
    window.addEventListener('programs-loaded', () => {
      console.log('📦 programs-loaded event received');
      // Give ccPrograms time to initialize after the event
      setTimeout(tryInitPrograms, 100);
    });
    
    // Check immediately if ccPrograms is already ready
    if (window.ccPrograms?.isReady) {
      console.log('✅ ccPrograms already ready at init, rendering immediately...');
      onProgramsReady();
      return; // Skip polling if already ready
    }
    
    // Try to initialize programs after a short delay 
    // (gives time for programs-loader.js setTimeout to fire the event)
    setTimeout(tryInitPrograms, 100);
    
    // Fallback polling - check every 200ms for up to 4 seconds
    let attempts = 0;
    const pollInterval = setInterval(() => {
      attempts++;
      if (state.programsRendered || attempts > 20) {
        clearInterval(pollInterval);
        if (!state.programsRendered) {
          console.error('❌ Failed to load programs after 4 seconds');
          // Last ditch effort - force check everything
          if (window.programsData?.length > 0) {
            console.log('🔧 Attempting emergency init with existing data...');
            if (!window.ccPrograms?.isReady) {
              window.ccPrograms?.init?.();
            }
            setTimeout(tryInitPrograms, 100);
          }
        }
        return;
      }
      tryInitPrograms();
    }, 200);
  }
  
  function tryInitPrograms() {
    if (state.programsRendered) return;
    
    if (window.ccPrograms?.isReady) {
      console.log('📦 ccPrograms ready, initializing...');
      onProgramsReady();
    } else if (window.programsData?.length > 0 && !window.ccPrograms?.isReady) {
      // Data is loaded but ccPrograms hasn't initialized yet - trigger it
      console.log('📦 Raw data ready, triggering ccPrograms init...');
      window.ccPrograms?.init?.();
      // Try again shortly
      setTimeout(tryInitPrograms, 50);
    }
  }

  /**
   * Hide all modals - call on init to ensure clean state
   */
  function hideAllModals() {
    const modals = ['profileModal', 'preferencesModal', 'kipuModal'];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (modal) {
        modal.hidden = true;
        modal.style.display = 'none';
      }
    });
    document.body.style.overflow = '';
  }

  async function onProgramsReady() {
    // Prevent double initialization
    if (state.programsRendered) {
      console.log('⚠️ Programs already rendered, skipping...');
      return;
    }
    
    console.log('✅ Programs ready, initializing UI...');

    // Mark as rendered FIRST to prevent re-entry from polling
    state.programsRendered = true;

    // Initialize components (wrapped in try-catch to prevent one failure from blocking others)
    try {
      initFilters();
    } catch (e) {
      console.error('❌ Error in initFilters:', e);
    }
    
    try {
      await initClientSelector();
    } catch (e) {
      console.error('❌ Error in initClientSelector:', e);
    }
    
    try {
      initPreferencesUI();
    } catch (e) {
      console.error('❌ Error in initPreferencesUI:', e);
    }
    
    // Always land the user on GRID with data rendered
    console.log('📊 Forcing initial view to Grid and rendering programs...');
    try {
      switchView('grid');
    } catch (e) {
      console.error('❌ Error in switchView:', e);
    }

    // Safety net: if the grid is still empty shortly after init, run one more render.
    setTimeout(() => {
      if (state.currentView === 'grid' && dom.resultsGrid) {
        const hasCards = dom.resultsGrid.querySelector('.program-card, .umbrella-card');
        if (!hasCards) {
          console.log('🔁 Grid still empty after init, re-rendering programs...');
          renderPrograms();
        }
      }
    }, 150);

    // Load any saved draft
    try {
      window.ccDocumentModel?.loadDraft();
      updateBuilderUI();
    } catch (e) {
      console.error('❌ Error loading draft:', e);
    }

    console.log('✅ App Controller initialized');
  }

  // ============================================================================
  // EVENT BINDING
  // ============================================================================

  function bindEvents() {
    // Search
    dom.globalSearch?.addEventListener('input', debounce(handleSearch, 300));

    // Client selector
    dom.clientSelector?.addEventListener('change', handleClientChange);

    // View mode buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Sort
    dom.sortSelect?.addEventListener('change', handleSortChange);

    // Filter rail toggle (collapsible)
    const filterToggle = document.getElementById('filterRailToggle');
    if (filterToggle) {
      filterToggle.addEventListener('click', toggleFilterRail);
      // Restore collapsed state from localStorage
      const isCollapsed = localStorage.getItem('cc-filter-collapsed') === 'true';
      if (isCollapsed) {
        document.getElementById('filterRail')?.classList.add('filter-rail--collapsed');
        document.getElementById('mainLayout')?.classList.add('main-layout--filter-collapsed');
      }
    }

    // Filters
    document.querySelectorAll('.filter-checkbox__input').forEach(input => {
      input.addEventListener('change', handleFilterChange);
    });
    dom.stateFilter?.addEventListener('change', handleFilterChange);
    dom.ageMin?.addEventListener('input', debounce(handleFilterChange, 300));
    dom.ageMax?.addEventListener('input', debounce(handleFilterChange, 300));
    dom.clearAllFilters?.addEventListener('click', clearAllFilters);

    // Filter clear buttons
    document.querySelectorAll('.filter-group__clear').forEach(btn => {
      btn.addEventListener('click', () => clearFilterGroup(btn.dataset.filter));
    });

    // Builder toggle
    dom.toggleBuilderBtn?.addEventListener('click', toggleBuilder);
    document.getElementById('closeBuilder')?.addEventListener('click', toggleBuilder);

    // Preferences
    dom.preferencesBtn?.addEventListener('click', openPreferences);
    document.getElementById('closePreferences')?.addEventListener('click', closePreferences);
    document.getElementById('savePreferences')?.addEventListener('click', savePreferences);
    document.getElementById('resetPreferences')?.addEventListener('click', resetPreferences);

    // Profile modal
    document.getElementById('closeProfile')?.addEventListener('click', closeProfile);
    document.getElementById('closeProfileBtn')?.addEventListener('click', closeProfile);
    
    // Add to plan dropdown
    document.getElementById('profileAddToPlan')?.addEventListener('click', toggleAddDropdown);
    document.querySelectorAll('#addToPlanDropdown .dropdown-item').forEach(btn => {
      btn.addEventListener('click', () => addToPhase(btn.dataset.phase));
    });

    // Profile tabs
    document.querySelectorAll('.profile-modal__tab').forEach(tab => {
      tab.addEventListener('click', () => switchProfileTab(tab.dataset.tab));
    });

    // Client context tabs
    document.querySelectorAll('.client-context__tab').forEach(tab => {
      if (!tab.classList.contains('client-context__tab--disabled')) {
        tab.addEventListener('click', () => switchClientTab(tab.dataset.tab));
      }
    });
    
    // Client context close button
    document.getElementById('closeClientContext')?.addEventListener('click', () => {
      dom.clientContext.hidden = true;
    });
    
    // Client ZIP input - update on change
    document.getElementById('clientZip')?.addEventListener('change', handleClientZipChange);
    
    // Client LGBTQ toggle
    document.getElementById('clientLgbtqToggle')?.addEventListener('click', handleLgbtqToggle);

    // Builder tabs
    document.querySelectorAll('.builder-pane__tab').forEach(tab => {
      tab.addEventListener('click', () => switchScenario(tab.dataset.scenario));
    });

    // Builder actions
    document.getElementById('saveDraftBtn')?.addEventListener('click', saveDraft);
    document.getElementById('previewBtn')?.addEventListener('click', previewDocument);
    document.getElementById('exportBtn')?.addEventListener('click', exportDocument);

    // Document type change
    dom.docTypeSelect?.addEventListener('change', handleDocTypeChange);

    // Alumni checkboxes
    document.getElementById('alumniParentFocus')?.addEventListener('change', handleAlumniChange);
    document.getElementById('alumniProgramming')?.addEventListener('change', handleAlumniChange);
    document.getElementById('alumniNest')?.addEventListener('change', handleAlumniChange);
    
    // At-Home mode dropdown
    document.getElementById('atHomeMode')?.addEventListener('change', handleAtHomeModeChange);

    // Map controls
    document.getElementById('mapZoomIn')?.addEventListener('click', () => window.ccMapController?.getMap()?.zoomIn());
    document.getElementById('mapZoomOut')?.addEventListener('click', () => window.ccMapController?.getMap()?.zoomOut());
    document.getElementById('mapResetView')?.addEventListener('click', () => window.ccMapController?.resetView());
    document.getElementById('mapCenterClient')?.addEventListener('click', () => window.ccMapController?.centerOnHome());
    document.getElementById('mapToggleTiles')?.addEventListener('click', handleToggleTiles);
    document.getElementById('mapFullscreen')?.addEventListener('click', () => window.ccMapController?.enterFullscreen());
    document.getElementById('showAllLoc')?.addEventListener('click', () => {
      window.ccMapController?.showAllLOC();
      updateLegend();
    });
    document.getElementById('hideAllLoc')?.addEventListener('click', () => {
      window.ccMapController?.hideAllLOC();
      updateLegend();
    });

    // Radius controls
    dom.radiusSlider?.addEventListener('input', handleRadiusChange);
    document.querySelectorAll('.map-radius__mode').forEach(btn => {
      btn.addEventListener('click', () => switchRadiusMode(btn.dataset.mode));
    });

    // Kipu modal
    document.getElementById('openKipu')?.addEventListener('click', () => {
      window.open(window.ccDocumentModel?.getKipuUrl(), '_blank');
    });
    document.getElementById('downloadFiles')?.addEventListener('click', downloadExportedFiles);
    document.getElementById('markUploaded')?.addEventListener('click', markAsUploaded);

    // Close modals on backdrop click
    dom.profileModal?.addEventListener('click', (e) => {
      if (e.target === dom.profileModal) closeProfile();
    });
    dom.preferencesModal?.addEventListener('click', (e) => {
      if (e.target === dom.preferencesModal) closePreferences();
    });
    dom.kipuModal?.addEventListener('click', (e) => {
      if (e.target === dom.kipuModal) closeKipuModal();
    });

    // Program events
    window.addEventListener('ccmap:programSelected', (e) => {
      openProfile(e.detail.program);
    });
  }

  // ============================================================================
  // FILTER INITIALIZATION
  // ============================================================================

  function initFilters() {
    // LOC filters
    const locTypes = window.ccProgramTypes?.LOC_TYPES || {};
    const locLabels = window.ccProgramTypes?.LOC_LABELS || {};
    const locColors = window.ccProgramTypes?.LOC_COLORS || {};
    const counts = window.ccPrograms?.getCountsByLOC() || {};

    dom.locFilters.innerHTML = Object.values(locTypes).map(loc => `
      <label class="filter-checkbox">
        <input type="checkbox" class="filter-checkbox__input" data-filter="loc" value="${loc}">
        <span class="filter-checkbox__label">${locLabels[loc] || loc}</span>
        <span class="filter-checkbox__count">${counts[loc] || 0}</span>
      </label>
    `).join('');

    // Rebind events for new checkboxes
    dom.locFilters.querySelectorAll('.filter-checkbox__input').forEach(input => {
      input.addEventListener('change', handleFilterChange);
    });

    // State filter
    const states = window.ccPrograms?.getUniqueValues('state') || [];
    dom.stateFilter.innerHTML = states.map(st => 
      `<option value="${st}">${st}</option>`
    ).join('');
  }

  // ============================================================================
  // CLIENT SELECTOR
  // ============================================================================

  async function initClientSelector() {
    // Safety check for DOM
    if (!dom.clientSelector) {
      console.warn('⚠️ clientSelector DOM element not found');
      return;
    }
    
    // Try to get clients from clientManager (may be async)
    let clients = [];
    try {
      const result = window.clientManager?.getAllClients?.();
      // Handle both sync and async returns
      clients = result instanceof Promise ? await result : result;
      // Ensure it's an array
      if (!Array.isArray(clients)) {
        clients = [];
      }
    } catch (e) {
      console.warn('⚠️ Failed to get clients from clientManager:', e);
      clients = [];
    }
    
    dom.clientSelector.innerHTML = '<option value="">Select Client...</option>' +
      clients.map(c => `<option value="${c.id}">${c.initials || 'XX'} - ${c.kipuId || '?'}</option>`).join('');

    // If no clients available, add demo option
    if (clients.length === 0) {
      dom.clientSelector.innerHTML += '<option value="demo">Demo Client (JD)</option>';
    }
  }

  async function handleClientChange(e) {
    const clientId = e.target.value;
    
    if (!clientId) {
      state.currentClient = null;
      dom.clientContext.hidden = true;
      const mapCenterBtn = document.getElementById('mapCenterClient');
      if (mapCenterBtn) mapCenterBtn.disabled = true;
      return;
    }

    // Get client data - handle async clientManager
    let client = null;
    try {
      const result = window.clientManager?.getClient?.(clientId);
      client = result instanceof Promise ? await result : result;
    } catch (e) {
      console.warn('Failed to get client:', e);
    }
    
    // Demo client fallback (for when no clients exist)
    if (clientId === 'demo' && !client) {
      client = {
        id: 'demo',
        initials: 'JD',
        kipuId: '12345',
        houseId: 'house_nest',
        admissionDate: new Date().toISOString().split('T')[0],
        zip: '33101',
        lgbtqAffirming: false,
      };
    }

    if (client) {
      state.currentClient = client;
      updateClientContext(client);
      // Don't show the client context panel - just update the document builder
      // User can click a button to see full client context if needed
      // dom.clientContext.hidden = false;
      
      // Update builder client display
      if (dom.builderClient) {
        dom.builderClient.textContent = `${client.initials || 'XX'} - ${client.kipuId || '?'}`;
      }
      
      // Update document model
      window.ccDocumentModel?.setClient(client.id, client.initials);
      
      // Open the document builder panel when client is selected
      if (!state.builderOpen && dom.builderPane) {
        state.builderOpen = true;
        dom.builderPane.classList.remove('hidden');
        dom.toggleBuilderBtn?.classList.add('toolbar__btn--active');
      }

      // Auto-check NEST alumni if applicable (check both formats)
      const isNest = client.houseId === 'NEST' || client.houseId === 'house_nest';
      if (isNest) {
        const nestCheckbox = document.getElementById('alumniNest');
        if (nestCheckbox) nestCheckbox.checked = true;
      }

      // Update map center button
      const mapCenterBtn = document.getElementById('mapCenterClient');
      if (mapCenterBtn) mapCenterBtn.disabled = !client.zip;

      // Set home location if ZIP available
      if (client.zip) {
        try {
          const coords = await window.ccPreferences?.geocodeZip(client.zip);
          if (coords) {
            window.ccPrograms?.setHomeLocation(coords.lat, coords.lng, client.zip);
            // Update city/state display
            const cityStateEl = document.getElementById('clientCityState');
            if (cityStateEl && coords.city && coords.state) {
              cityStateEl.textContent = `${coords.city}, ${coords.state}`;
            }
            if (state.currentView === 'map') {
              window.ccMapController?.showHomeLocation(coords.lat, coords.lng);
            }
          }
        } catch (e) {
          console.warn('Failed to geocode ZIP:', e);
        }
      }
    }
  }

  function updateClientContext(client) {
    // Profile tab
    const initialsEl = document.getElementById('clientInitials');
    if (initialsEl) initialsEl.textContent = client.initials || '--';
    
    const kipuIdEl = document.getElementById('clientKipuId');
    if (kipuIdEl) kipuIdEl.textContent = client.kipuId || '--';
    
    const houseEl = document.getElementById('clientHouse');
    if (houseEl) {
      // Format house ID nicely (house_nest -> NEST)
      const houseDisplay = client.houseId 
        ? client.houseId.replace('house_', '').toUpperCase() 
        : '--';
      houseEl.textContent = houseDisplay;
    }
    
    const admitDateEl = document.getElementById('clientAdmitDate');
    if (admitDateEl) {
      // Handle both admitDate and admissionDate field names
      const dateValue = client.admitDate || client.admissionDate;
      admitDateEl.textContent = dateValue 
        ? new Date(dateValue).toLocaleDateString() 
        : '--';
    }
    
    // Location tab
    const zipEl = document.getElementById('clientZip');
    if (zipEl) zipEl.value = client.zip || '';
    
    const cityStateEl = document.getElementById('clientCityState');
    if (cityStateEl) {
      if (client.homeCity && client.homeState) {
        cityStateEl.textContent = `${client.homeCity}, ${client.homeState}`;
      } else {
        cityStateEl.textContent = '--';
      }
    }
    
    // Identity tab
    const lgbtqToggle = document.getElementById('clientLgbtqToggle');
    if (lgbtqToggle) {
      const isLgbtq = client.lgbtqAffirming === true;
      lgbtqToggle.setAttribute('aria-checked', isLgbtq ? 'true' : 'false');
      lgbtqToggle.classList.toggle('is-active', isLgbtq);
    }
  }

  function switchClientTab(tabId) {
    document.querySelectorAll('.client-context__tab').forEach(t => {
      t.classList.toggle('client-context__tab--active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.client-context__panel').forEach(p => {
      p.hidden = p.dataset.panel !== tabId;
    });
  }
  
  async function handleClientZipChange(e) {
    const zip = e.target.value?.trim();
    if (!state.currentClient || !zip || zip.length !== 5) return;
    
    // Update client state
    state.currentClient.zip = zip;
    
    // Geocode and update map
    try {
      const coords = await window.ccPreferences?.geocodeZip(zip);
      if (coords) {
        window.ccPrograms?.setHomeLocation(coords.lat, coords.lng, zip);
        
        // Update city/state display
        const cityStateEl = document.getElementById('clientCityState');
        if (cityStateEl && coords.city && coords.state) {
          cityStateEl.textContent = `${coords.city}, ${coords.state}`;
        }
        
        // Update map if visible
        if (state.currentView === 'map') {
          window.ccMapController?.showHomeLocation(coords.lat, coords.lng);
        }
        
        // Enable map center button
        const mapCenterBtn = document.getElementById('mapCenterClient');
        if (mapCenterBtn) mapCenterBtn.disabled = false;
      }
    } catch (e) {
      console.warn('Failed to geocode ZIP:', e);
    }
  }
  
  function handleLgbtqToggle(e) {
    const toggle = e.currentTarget;
    const isActive = toggle.getAttribute('aria-checked') === 'true';
    const newState = !isActive;
    
    toggle.setAttribute('aria-checked', newState ? 'true' : 'false');
    toggle.classList.toggle('is-active', newState);
    
    // Update client state
    if (state.currentClient) {
      state.currentClient.lgbtqAffirming = newState;
    }
  }

  // ============================================================================
  // VIEW SWITCHING
  // ============================================================================

  function switchView(viewId) {
    state.currentView = viewId;

    // Update buttons
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.classList.toggle('view-controls__mode--active', btn.dataset.view === viewId);
    });

    // Show/hide views
    dom.resultsGrid.hidden = viewId !== 'grid';
    dom.resultsRows.hidden = viewId !== 'rows';
    dom.resultsCompare.hidden = viewId !== 'compare';
    dom.resultsMap.hidden = viewId !== 'map';

    // Initialize map if needed
    if (viewId === 'map' && !state.mapInitialized) {
      initMap();
    }

    // Update layout
    dom.builderPane.classList.toggle('hidden', viewId === 'map');

    // Render appropriate view
    if (viewId === 'map') {
      renderMap();
    } else if (viewId === 'compare') {
      renderCompare();
    } else {
      renderPrograms();
    }
  }

  // ============================================================================
  // PROGRAM RENDERING
  // ============================================================================

  function renderPrograms() {
    const programs = getFilteredPrograms();
    console.log(`📊 renderPrograms: Found ${programs.length} programs for view "${state.currentView}"`);
    
    const sorted = sortPrograms(programs);

    if (dom.emptyState) {
      dom.emptyState.hidden = sorted.length > 0;
    }

    if (state.currentView === 'grid') {
      renderGrid(sorted);
    } else if (state.currentView === 'rows') {
      renderRows(sorted);
    }

    updateStats();
  }

  function renderGrid(programs) {
    const prefs = window.ccPreferences?.get() || {};
    const perPage = prefs.programsPerPage === 'all' ? programs.length : (prefs.programsPerPage || 24);
    const displayPrograms = programs.slice(0, perPage);

    // Clear existing cards (but keep empty state)
    const cards = dom.resultsGrid.querySelectorAll('.program-card, .umbrella-card');
    cards.forEach(c => c.remove());

    // Render cards
    displayPrograms.forEach(program => {
      const card = program.isUmbrellaParent 
        ? createUmbrellaCard(program)
        : createProgramCard(program);
      dom.resultsGrid.appendChild(card);
    });
  }

  function createProgramCard(program) {
    const card = document.createElement('article');
    card.className = 'program-card';
    card.dataset.programId = program.id;

    const locColor = window.ccMapIcons?.colors[program.primaryLOC] || '#6E7BFF';
    
    // Primary LOC badge only in hero
    const primaryBadge = `<span class="loc-badge loc-badge--${program.primaryLOC.toLowerCase().replace(/\s+/g, '-')}">${program.primaryLOC}</span>`;

    // Format badge
    const formatBadge = program.format[0] !== 'Onsite' 
      ? `<span class="format-badge format-badge--${program.format[0].toLowerCase()}">${program.format[0]}</span>` 
      : '';

    const distance = program.distanceMiles !== null 
      ? `<span class="program-card__distance">${program.distanceMiles} mi</span>` 
      : '';

    // Identity indicators
    const identityBadges = [];
    if (program.lgbtqAffirming) identityBadges.push('<span class="identity-badge" title="LGBTQ+ Affirming">🏳️‍🌈</span>');
    if (program.transAffirming) identityBadges.push('<span class="identity-badge" title="Trans Affirming">🏳️‍⚧️</span>');
    const identityHtml = identityBadges.length > 0 ? `<div class="program-card__identity">${identityBadges.join('')}</div>` : '';

    // Clinical flags as small icons
    const flagIcons = [];
    if (program.treatsASD) flagIcons.push('<span title="Treats ASD">🧩</span>');
    if (program.treatsSUD) flagIcons.push('<span title="Treats SUD">💊</span>');
    if (program.highAcuityMH) flagIcons.push('<span title="High Acuity">⚡</span>');
    const flagsHtml = flagIcons.length > 0 ? `<div class="program-card__flags">${flagIcons.join('')}</div>` : '';

    // Age range
    const ageRange = (program.ageMin || program.ageMax) 
      ? `<span class="program-card__age">Ages ${program.ageMin || '?'}-${program.ageMax || '?'}</span>` 
      : '';

    // Hero style - LOC colored gradient
    const heroStyle = program.heroImageUrl 
      ? `background-image: linear-gradient(to bottom, transparent 40%, rgba(15,16,32,0.9)), url('${program.heroImageUrl}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${locColor} 0%, ${locColor}99 50%, #1a1b2e 100%);`;

    // Smart tags - show modalities or diagnoses, color coded
    const smartTags = [];
    if (program.modalities && program.modalities.length > 0) {
      program.modalities.slice(0, 2).forEach(m => smartTags.push({ text: m, type: 'modality' }));
    }
    if (program.diagnosesServed && program.diagnosesServed.length > 0 && smartTags.length < 3) {
      program.diagnosesServed.slice(0, 3 - smartTags.length).forEach(d => smartTags.push({ text: d, type: 'dx' }));
    }
    if (smartTags.length === 0 && program.tags) {
      program.tags.slice(0, 3).forEach(t => smartTags.push({ text: t, type: 'tag' }));
    }
    const tagsHtml = smartTags.map(t => `<span class="smart-tag smart-tag--${t.type}">${t.text}</span>`).join('');

    // Check if in compare list
    const isComparing = state.compareList.includes(program.id);

    card.innerHTML = `
      <div class="program-card__hero" style="${heroStyle}">
        <div class="program-card__hero-top">
          ${primaryBadge}
          ${formatBadge}
        </div>
        ${identityHtml}
        <div class="program-card__hero-bottom">
          <h3 class="program-card__name">${program.name}</h3>
          <div class="program-card__meta">
            <span class="program-card__location">📍 ${program.city}, ${program.state}</span>
            ${distance}
            ${ageRange}
          </div>
        </div>
      </div>
      <div class="program-card__content">
        <p class="program-card__summary">${program.summary || 'No description available.'}</p>
        <div class="program-card__tags">
          ${tagsHtml}
          ${flagsHtml}
        </div>
      </div>
      <div class="program-card__actions">
        <button class="card-btn card-btn--primary" data-action="add">
          <span>+ Add</span>
        </button>
        <button class="card-btn card-btn--icon ${isComparing ? 'card-btn--active' : ''}" data-action="compare" title="Compare">
          ⚖️
        </button>
        <button class="card-btn card-btn--icon card-btn--arrow" data-action="details" title="View Details">
          →
        </button>
      </div>
    `;

    // Click on card (not buttons) opens profile
    card.addEventListener('click', (e) => {
      if (!e.target.closest('.card-btn')) {
        openProfile(program);
      }
    });

    // Event handlers
    card.querySelector('[data-action="details"]').addEventListener('click', (e) => {
      e.stopPropagation();
      openProfile(program);
    });
    card.querySelector('[data-action="add"]').addEventListener('click', (e) => {
      e.stopPropagation();
      quickAdd(program);
    });
    card.querySelector('[data-action="compare"]').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleCompare(program);
      e.target.closest('.card-btn').classList.toggle('card-btn--active');
    });

    return card;
  }

  function createUmbrellaCard(program) {
    const card = document.createElement('article');
    card.className = 'umbrella-card';
    card.dataset.programId = program.id;

    const children = window.ccPrograms?.getChildren(program.id) || [];
    const childLocs = new Set();
    const childStates = new Set();
    children.forEach(c => {
      c.levelOfCare.forEach(loc => childLocs.add(loc));
      if (c.state) childStates.add(c.state);
    });

    const locBadges = [...childLocs].slice(0, 4).map(loc => 
      `<span class="loc-badge loc-badge--${loc.toLowerCase().replace(/\s+/g, '-')}">${loc}</span>`
    ).join('');

    const statesList = [...childStates].slice(0, 5).join(', ');
    const moreStates = childStates.size > 5 ? ` +${childStates.size - 5}` : '';

    // Group children by state
    const childrenByState = {};
    children.forEach(c => {
      if (!childrenByState[c.state]) childrenByState[c.state] = [];
      childrenByState[c.state].push(c);
    });

    const childList = Object.entries(childrenByState).slice(0, 4).map(([state, progs]) => 
      `<div class="umbrella-location" data-state="${state}">
        <span class="umbrella-location__state">${state}</span>
        <span class="umbrella-location__count">${progs.length} location${progs.length > 1 ? 's' : ''}</span>
      </div>`
    ).join('');

    card.innerHTML = `
      <div class="umbrella-card__hero">
        <div class="umbrella-card__brand">
          ${program.logoUrl 
            ? `<img src="${program.logoUrl}" class="umbrella-card__logo" alt="" onerror="this.style.display='none'">` 
            : '<div class="umbrella-card__icon">🏢</div>'}
          <div class="umbrella-card__title">
            <span class="umbrella-card__label">NETWORK</span>
            <h3>${program.name}</h3>
          </div>
        </div>
        <div class="umbrella-card__stats">
          <div class="umbrella-stat">
            <span class="umbrella-stat__value">${children.length}</span>
            <span class="umbrella-stat__label">Locations</span>
          </div>
          <div class="umbrella-stat">
            <span class="umbrella-stat__value">${childLocs.size}</span>
            <span class="umbrella-stat__label">LOC Types</span>
          </div>
        </div>
      </div>
      <div class="umbrella-card__content">
        <div class="umbrella-card__badges">${locBadges}</div>
        <p class="umbrella-card__summary">${program.summary || 'Network of treatment programs.'}</p>
        <div class="umbrella-card__coverage">
          <span class="umbrella-coverage__label">Coverage:</span>
          <span class="umbrella-coverage__states">${statesList}${moreStates}</span>
        </div>
        <div class="umbrella-card__locations">
          ${childList}
        </div>
      </div>
      <div class="umbrella-card__actions">
        <button class="card-btn card-btn--primary" data-action="details">
          <span>Explore Network →</span>
        </button>
      </div>
    `;

    // Click handlers
    card.querySelector('[data-action="details"]').addEventListener('click', () => openProfile(program));
    
    // Location click - expand to show children
    card.querySelectorAll('.umbrella-location').forEach(loc => {
      loc.addEventListener('click', (e) => {
        e.stopPropagation();
        const state = loc.dataset.state;
        const stateChildren = childrenByState[state];
        if (stateChildren && stateChildren.length === 1) {
          openProfile(stateChildren[0]);
        } else {
          // Filter to this state's children
          openProfile(program);
        }
      });
    });

    return card;
  }

  function renderRows(programs) {
    dom.resultsTableBody.innerHTML = programs.map(program => {
      const distance = program.distanceMiles !== null ? `${program.distanceMiles} mi` : '';
      const ageRange = (program.ageMin || program.ageMax) 
        ? `${program.ageMin || '?'}-${program.ageMax || '?'}` 
        : '--';

      return `
        <tr data-program-id="${program.id}">
          <td class="results-table__name">${program.name}</td>
          <td class="results-table__location">${program.city}, ${program.state} ${distance}</td>
          <td><span class="loc-badge loc-badge--${program.primaryLOC.toLowerCase().replace(/\s+/g, '-')}">${program.primaryLOC}</span></td>
          <td>${program.format.join(', ')}</td>
          <td>${ageRange}</td>
          <td class="results-table__actions">
            <button class="btn btn--icon-sm btn--ghost" data-action="add" title="Add to Plan">+</button>
            <button class="btn btn--icon-sm btn--ghost" data-action="compare" title="Compare">⚖️</button>
            <button class="btn btn--icon-sm btn--ghost" data-action="details" title="Details">→</button>
          </td>
        </tr>
      `;
    }).join('');

    // Bind row events
    dom.resultsTableBody.querySelectorAll('tr').forEach(row => {
      const program = window.ccPrograms?.byId(row.dataset.programId);
      if (!program) return;

      row.querySelector('[data-action="details"]')?.addEventListener('click', () => openProfile(program));
      row.querySelector('[data-action="add"]')?.addEventListener('click', () => quickAdd(program));
      row.querySelector('[data-action="compare"]')?.addEventListener('click', () => toggleCompare(program));
    });
  }

  function renderCompare() {
    const container = dom.resultsCompare;
    const emptyState = document.getElementById('compareEmptyState');

    // Clear existing columns
    container.querySelectorAll('.compare-column').forEach(c => c.remove());

    if (state.compareList.length === 0) {
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;

    state.compareList.forEach(programId => {
      const program = window.ccPrograms?.byId(programId);
      if (!program) return;

      const col = document.createElement('div');
      col.className = 'compare-column';
      col.innerHTML = `
        <div class="compare-column__header">
          <div>
            <div class="compare-column__name">${program.name}</div>
            <div class="compare-column__location">${program.city}, ${program.state}</div>
          </div>
          <button class="btn btn--ghost btn--icon-sm" data-action="remove">✕</button>
        </div>
        <div class="compare-section">
          <div class="compare-section__title">Level of Care</div>
          <div class="compare-section__content">${program.levelOfCare.join(', ')}</div>
        </div>
        <div class="compare-section">
          <div class="compare-section__title">Age Range</div>
          <div class="compare-section__content">${program.ageMin || '?'} - ${program.ageMax || '?'}</div>
        </div>
        <div class="compare-section">
          <div class="compare-section__title">Gender</div>
          <div class="compare-section__content">${program.gendersServed.join(', ')}</div>
        </div>
        <div class="compare-section">
          <div class="compare-section__title">Clinical Flags</div>
          <div class="compare-section__content">
            ${program.lgbtqAffirming ? '✓ LGBTQ+ Affirming<br>' : ''}
            ${program.treatsASD ? '✓ Treats ASD<br>' : ''}
            ${program.treatsSUD ? '✓ Treats SUD<br>' : ''}
            ${program.highAcuityMH ? '✓ High Acuity<br>' : ''}
            ${!program.lgbtqAffirming && !program.treatsASD && !program.treatsSUD && !program.highAcuityMH ? '--' : ''}
          </div>
        </div>
        <div class="compare-section">
          <div class="compare-section__title">Contact</div>
          <div class="compare-section__content">
            ${program.contacts?.phone || '--'}<br>
            ${program.contacts?.website ? `<a href="${program.contacts.website}" target="_blank">Website</a>` : ''}
          </div>
        </div>
      `;

      col.querySelector('[data-action="remove"]').addEventListener('click', () => {
        toggleCompare(program);
      });

      container.appendChild(col);
    });
  }

  // ============================================================================
  // MAP
  // ============================================================================

  function initMap() {
    if (state.mapInitialized) return;

    window.ccMapController?.init('programsMap');
    state.mapInitialized = true;

    // Initialize legend
    updateLegend();

    // Initialize radius presets
    updateRadiusPresets('local');
  }

  function renderMap() {
    if (!state.mapInitialized) initMap();

    const programs = getFilteredPrograms();
    window.ccMapController?.renderMarkers(programs);

    // Show home location if set
    const home = window.ccPrograms?.getHomeLocation();
    if (home) {
      window.ccMapController?.showHomeLocation(home.lat, home.lng);
    }
  }

  function updateLegend() {
    const items = window.ccMapIcons?.getLegendItems() || [];
    const counts = window.ccMapController?.getVisibleCountsByLOC() || {};
    const visibility = window.ccMapController?.getLOCVisibility() || {};

    dom.legendItems.innerHTML = items.map(item => `
      <label class="map-legend__item ${visibility[item.loc] === false ? 'map-legend__item--disabled' : ''}">
        <input type="checkbox" ${visibility[item.loc] !== false ? 'checked' : ''} data-loc="${item.loc}">
        <span class="map-legend__icon">${item.svg}</span>
        <span class="map-legend__label">${item.loc}</span>
        <span class="map-legend__count">${counts[item.loc] || 0}</span>
      </label>
    `).join('');

    // Bind events
    dom.legendItems.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', () => {
        window.ccMapController?.setLOCVisibility(input.dataset.loc, input.checked);
        updateLegend();
      });
    });
  }

  function updateRadiusPresets(mode) {
    const presets = mode === 'local' 
      ? [{ value: 25, label: '25 mi' }, { value: 50, label: '50 mi' }, { value: 80, label: '80 mi' }]
      : [{ value: 250, label: '250 mi' }, { value: 500, label: '500 mi' }, { value: 800, label: '800 mi' }];

    dom.radiusPresets.innerHTML = presets.map(p => 
      `<button class="map-radius__preset" data-value="${p.value}">${p.label}</button>`
    ).join('');

    dom.radiusPresets.querySelectorAll('.map-radius__preset').forEach(btn => {
      btn.addEventListener('click', () => {
        dom.radiusSlider.value = btn.dataset.value;
        handleRadiusChange();
      });
    });

    // Update slider range
    dom.radiusSlider.min = mode === 'local' ? 10 : 100;
    dom.radiusSlider.max = mode === 'local' ? 150 : 1000;
    dom.radiusSlider.value = mode === 'local' ? 50 : 500;
  }

  function switchRadiusMode(mode) {
    document.querySelectorAll('.map-radius__mode').forEach(btn => {
      btn.classList.toggle('map-radius__mode--active', btn.dataset.mode === mode);
    });
    updateRadiusPresets(mode);
    handleRadiusChange();
  }

  function handleRadiusChange() {
    const value = parseInt(dom.radiusSlider.value, 10);
    dom.radiusValue.textContent = value;

    const home = window.ccPrograms?.getHomeLocation();
    if (home) {
      window.ccMapController?.showRadiusCircle(home.lat, home.lng, value);
    }
  }

  function handleToggleTiles() {
    const newLayer = window.ccMapController?.toggleTileLayer();
    const btn = document.getElementById('mapToggleTiles');
    btn.textContent = newLayer === 'dark' ? '☀️' : '🌙';
  }

  // ============================================================================
  // FILTERING & SORTING
  // ============================================================================

  function getFilteredPrograms() {
    // Safety check - if ccPrograms not ready, return empty
    if (!window.ccPrograms?.isReady) {
      console.warn('⚠️ getFilteredPrograms called but ccPrograms not ready');
      return [];
    }

    // If no filters applied, return all programs
    const hasFilters = Object.keys(state.filters).some(key => {
      const val = state.filters[key];
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'object') return Object.keys(val).length > 0;
      return val !== undefined && val !== null && val !== '';
    });

    if (!hasFilters) {
      // Return all programs (excluding umbrella children for cleaner display)
      const programs = window.ccPrograms.getDisplayList(false);
      console.log(`📋 getFilteredPrograms (no filters): returning ${programs.length} programs`);
      return programs;
    }

    const filtered = window.ccPrograms.filter(state.filters);
    console.log(`📋 getFilteredPrograms (with filters): returning ${filtered.length} programs`);
    return filtered;
  }

  function handleFilterChange() {
    // Collect filter values
    const filters = {
      loc: [],
      format: [],
      state: [],
      flags: {},
    };

    // LOC
    document.querySelectorAll('[data-filter="loc"]:checked').forEach(input => {
      filters.loc.push(input.value);
    });

    // Format
    document.querySelectorAll('[data-filter="format"]:checked').forEach(input => {
      filters.format.push(input.value);
    });

    // State
    [...dom.stateFilter.selectedOptions].forEach(opt => {
      filters.state.push(opt.value);
    });

    // Age
    const ageMin = parseInt(dom.ageMin.value, 10);
    const ageMax = parseInt(dom.ageMax.value, 10);
    if (!isNaN(ageMin)) filters.ageMin = ageMin;
    if (!isNaN(ageMax)) filters.ageMax = ageMax;

    // Flags
    document.querySelectorAll('[data-filter="flags"]:checked').forEach(input => {
      filters.flags[input.value] = true;
    });

    // Search
    if (dom.globalSearch.value.trim()) {
      filters.search = dom.globalSearch.value.trim();
    }

    state.filters = filters;
    renderPrograms();

    if (state.currentView === 'map') {
      renderMap();
    }
  }

  function handleSearch() {
    state.filters.search = dom.globalSearch.value.trim() || undefined;
    renderPrograms();
  }

  function clearFilterGroup(group) {
    document.querySelectorAll(`[data-filter="${group}"]`).forEach(input => {
      if (input.type === 'checkbox') input.checked = false;
      else if (input.tagName === 'SELECT') input.selectedIndex = -1;
    });
    handleFilterChange();
  }

  function clearAllFilters() {
    document.querySelectorAll('.filter-checkbox__input').forEach(input => {
      input.checked = false;
    });
    dom.stateFilter.selectedIndex = -1;
    dom.ageMin.value = '';
    dom.ageMax.value = '';
    dom.globalSearch.value = '';
    state.filters = {};
    renderPrograms();
  }

  function sortPrograms(programs) {
    const sorted = [...programs];
    const key = state.sortBy;

    sorted.sort((a, b) => {
      let aVal, bVal;

      switch (key) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'loc':
          aVal = a.primaryLOC;
          bVal = b.primaryLOC;
          break;
        case 'state':
          aVal = a.state;
          bVal = b.state;
          break;
        case 'distance':
          aVal = a.distanceMiles ?? Infinity;
          bVal = b.distanceMiles ?? Infinity;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return state.sortDesc ? 1 : -1;
      if (aVal > bVal) return state.sortDesc ? -1 : 1;
      return 0;
    });

    return sorted;
  }

  function handleSortChange() {
    state.sortBy = dom.sortSelect.value;
    renderPrograms();
  }

  function updateStats() {
    const filtered = getFilteredPrograms();
    const total = window.ccPrograms?.core?.length || 0;
    dom.resultsCount.textContent = filtered.length;
    dom.totalCount.textContent = total;
  }

  // ============================================================================
  // PROFILE MODAL
  // ============================================================================

  function openProfile(program) {
    if (!program || !dom.profileModal) return;
    
    state.selectedProgramId = program.id;

    // Populate header
    document.getElementById('profileName').textContent = program.name;

    // Hero
    const hero = document.getElementById('profileHero');
    if (hero) {
      if (program.heroImageUrl) {
        hero.style.backgroundImage = `url('${program.heroImageUrl}')`;
        hero.style.backgroundSize = 'cover';
      } else {
        const color = window.ccMapIcons?.colors[program.primaryLOC] || '#6E7BFF';
        hero.style.background = `linear-gradient(135deg, ${color} 0%, #1F2145 100%)`;
      }
    }

    // Meta
    const meta = document.getElementById('profileMeta');
    if (meta) {
      const distance = program.distanceMiles !== null ? ` • ${program.distanceMiles} mi` : '';
      const lgbtq = program.lgbtqAffirming ? ' <span title="LGBTQ+ Affirming">🏳️‍🌈</span>' : '';
      meta.innerHTML = `
        ${program.city}, ${program.state}${distance}${lgbtq}
        <span class="loc-badge loc-badge--${program.primaryLOC.toLowerCase().replace(/\s+/g, '-')}">${program.primaryLOC}</span>
        ${program.format.map(f => `<span class="format-badge">${f}</span>`).join('')}
      `;
    }

    // Render full immersive profile
    renderFullProfile();
    
    // Show modal
    dom.profileModal.hidden = false;
    dom.profileModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeProfile() {
    if (dom.profileModal) {
      dom.profileModal.hidden = true;
      dom.profileModal.style.display = 'none';
    }
    document.body.style.overflow = '';
    state.selectedProgramId = null;
  }

  function switchProfileTab(tabId) {
    // Legacy - tabs removed, now single scrollable view
    renderFullProfile();
  }

  /**
   * Render the full immersive Clinical Dossier - comprehensive program profile
   */
  function renderFullProfile() {
    const p = window.ccPrograms?.byId(state.selectedProgramId);
    if (!p) return;

    const content = document.getElementById('profileContent');
    const hasAcademics = ['RTC', 'TBS'].some(loc => p.levelOfCare.includes(loc));
    const distance = p.distanceMiles !== null ? `${p.distanceMiles} mi away` : null;
    const isNetwork = p.isNetwork || (p.children && p.children.length > 0);
    const coachIntel = getCoachIntel(p.id);

    // Build clinical flags
    const flags = [
      { key: 'lgbtqAffirming', label: 'LGBTQ+ Affirming', icon: '🏳️‍🌈' },
      { key: 'transAffirming', label: 'Trans Affirming', icon: '🏳️‍⚧️' },
      { key: 'treatsASD', label: 'Treats ASD', icon: '🧩' },
      { key: 'treatsSUD', label: 'Treats SUD', icon: '💊' },
      { key: 'highAcuityMH', label: 'High Acuity', icon: '⚡' },
    ];
    const activeFlags = flags.filter(f => p[f.key]);

    // Get child programs for networks
    const childPrograms = isNetwork ? getChildPrograms(p) : [];

    content.innerHTML = `
      <!-- QUICK STATS BAR -->
      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat__icon">📍</span>
          <span class="profile-stat__value">${p.city || 'Multiple'}, ${p.state || 'Locations'}</span>
          ${distance ? `<span class="profile-stat__sub">${distance}</span>` : ''}
        </div>
        <div class="profile-stat">
          <span class="profile-stat__icon">👥</span>
          <span class="profile-stat__value">${p.gendersServed?.join(', ') || 'All'}</span>
          <span class="profile-stat__sub">${p.ageMin || '?'}-${p.ageMax || '?'} years</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat__icon">🏥</span>
          <span class="profile-stat__value">${p.levelOfCare?.join(', ') || p.primaryLOC}</span>
          <span class="profile-stat__sub">${p.format?.join(', ') || 'Onsite'}</span>
        </div>
        ${activeFlags.length > 0 ? `
          <div class="profile-stat profile-stat--flags">
            ${activeFlags.map(f => `<span class="profile-flag-badge" title="${f.label}">${f.icon}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      ${isNetwork && childPrograms.length > 0 ? `
      <!-- NETWORK PROGRAMS SECTION -->
      <section class="profile-card profile-card--network">
        <div class="profile-card__header">
          <h3 class="profile-card__title">🏢 Network Locations</h3>
          <span class="profile-card__badge">${childPrograms.length} programs</span>
        </div>
        <p class="profile-card__desc">This network has multiple locations and programs. Click to explore each one.</p>
        <div class="network-programs-grid">
          ${childPrograms.map(child => `
            <div class="network-program-card" onclick="window.ccAppController?.openProfile('${child.id}')">
              <div class="network-program-card__header">
                <span class="network-program-card__loc">${child.primaryLOC || 'Program'}</span>
                ${child.distanceMiles ? `<span class="network-program-card__distance">${child.distanceMiles} mi</span>` : ''}
              </div>
              <h4 class="network-program-card__name">${child.name}</h4>
              <p class="network-program-card__location">📍 ${child.city}, ${child.state}</p>
              <div class="network-program-card__tags">
                ${(child.gendersServed || []).slice(0, 2).map(g => `<span>${g}</span>`).join('')}
                <span>${child.ageMin || '?'}-${child.ageMax || '?'} yrs</span>
              </div>
            </div>
          `).join('')}
        </div>
      </section>
      ` : ''}

      <!-- TWO COLUMN LAYOUT -->
      <div class="profile-grid">
        <!-- LEFT COLUMN -->
        <div class="profile-col">
          
          <!-- ABOUT -->
          <section class="profile-card">
            <h3 class="profile-card__title">About This Program</h3>
            <p class="profile-card__text">${p.summary || 'No description available yet.'}</p>
            ${p.contacts?.website ? `
              <a href="${p.contacts.website}" target="_blank" class="profile-card__link">
                ${p.contacts.website.replace(/^https?:\/\//, '').replace(/\/$/, '')} ↗
              </a>
            ` : ''}
          </section>

          <!-- CLINICAL -->
          <section class="profile-card">
            <h3 class="profile-card__title">Clinical Profile</h3>
            
            ${(p.diagnosesServed && p.diagnosesServed.length > 0) ? `
              <div class="profile-card__group">
                <h4 class="profile-card__subtitle">Diagnoses Treated</h4>
                <div class="profile-tags">
                  ${p.diagnosesServed.map(d => `<span class="profile-tag profile-tag--dx">${d}</span>`).join('')}
                </div>
              </div>
            ` : ''}
            
            ${(p.modalities && p.modalities.length > 0) ? `
              <div class="profile-card__group">
                <h4 class="profile-card__subtitle">Treatment Modalities</h4>
                <div class="profile-tags">
                  ${p.modalities.map(m => `<span class="profile-tag">${m}</span>`).join('')}
                </div>
              </div>
            ` : ''}

            <div class="profile-card__group">
              <h4 class="profile-card__subtitle">Clinical Capabilities</h4>
              <div class="profile-flags-grid">
                ${flags.map(f => `
                  <div class="profile-flag-item ${p[f.key] ? 'profile-flag-item--yes' : 'profile-flag-item--no'}">
                    <span class="profile-flag-item__icon">${p[f.key] ? '✓' : '—'}</span>
                    <span class="profile-flag-item__label">${f.label}</span>
                  </div>
                `).join('')}
              </div>
            </div>

            ${(p.exclusions && p.exclusions.length > 0) ? `
              <div class="profile-card__group profile-card__group--warning">
                <h4 class="profile-card__subtitle">⚠️ Exclusionary Criteria</h4>
                <ul class="profile-exclusions-list">
                  ${p.exclusions.map(e => `<li>${e}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </section>

          ${(p.weeklyStructure && p.weeklyStructure.length > 0) ? `
            <section class="profile-card">
              <h3 class="profile-card__title">Program Structure</h3>
              <ul class="profile-structure-list">
                ${p.weeklyStructure.map(w => `<li>${w}</li>`).join('')}
              </ul>
            </section>
          ` : ''}

          <!-- COACH INTELLIGENCE (Editable) -->
          <section class="profile-card profile-card--intel">
            <div class="profile-card__header">
              <h3 class="profile-card__title">🧠 Coach Intelligence</h3>
              <span class="profile-card__editable">✏️ Editable</span>
            </div>
            <p class="profile-card__desc">Your team's knowledge about this program. This data is stored locally.</p>
            
            <div class="intel-grid">
              <div class="intel-field">
                <label class="intel-field__label">📅 Last Contacted</label>
                <input type="date" class="intel-field__input" id="intelLastContact" value="${coachIntel.lastContact || ''}" onchange="updateCoachIntel('${p.id}', 'lastContact', this.value)">
              </div>
              <div class="intel-field">
                <label class="intel-field__label">💰 Cost Estimate</label>
                <input type="text" class="intel-field__input" id="intelCost" placeholder="e.g., $800-1200/day" value="${coachIntel.costEstimate || ''}" onchange="updateCoachIntel('${p.id}', 'costEstimate', this.value)">
              </div>
              <div class="intel-field intel-field--full">
                <label class="intel-field__label">⏱️ Reported Wait Time</label>
                <div class="intel-wait-row">
                  <input type="text" class="intel-field__input intel-wait-row__wait" id="intelWaitTime" placeholder="e.g., 2-3 weeks" value="${coachIntel.waitTime || ''}" onchange="updateCoachIntel('${p.id}', 'waitTime', this.value)">
                  <input type="date" class="intel-field__input intel-wait-row__date" id="intelWaitReportedOn" value="${coachIntel.waitReportedOn || ''}" onchange="updateCoachIntel('${p.id}', 'waitReportedOn', this.value)" title="Date this was reported">
                </div>
                <div class="intel-field__hint">Wait time + when it was reported</div>
              </div>
              <div class="intel-field intel-field--full">
                <label class="intel-field__label">📊 Census/Availability</label>
                <div class="intel-wait-row">
                  <input type="text" class="intel-field__input intel-wait-row__wait" id="intelCensus" placeholder="e.g., Running full, 2 beds open" value="${coachIntel.census || ''}" onchange="updateCoachIntel('${p.id}', 'census', this.value)">
                  <input type="date" class="intel-field__input intel-wait-row__date" id="intelCensusReportedOn" value="${coachIntel.censusReportedOn || ''}" onchange="updateCoachIntel('${p.id}', 'censusReportedOn', this.value)" title="Date this was reported">
                </div>
                <div class="intel-field__hint">Census info + when it was reported</div>
              </div>
              <div class="intel-field intel-field--full">
                <label class="intel-field__label">👤 Best Contact Person</label>
                <input type="text" class="intel-field__input" id="intelContact" placeholder="e.g., Sarah in Admissions, ext 123" value="${coachIntel.bestContact || ''}" onchange="updateCoachIntel('${p.id}', 'bestContact', this.value)">
              </div>
              <div class="intel-field intel-field--full">
                <label class="intel-field__label">💡 Tips & Notes</label>
                <textarea class="intel-field__textarea" id="intelTips" placeholder="Tips from colleagues, things to ask about, red flags..." onchange="updateCoachIntel('${p.id}', 'tips', this.value)">${coachIntel.tips || ''}</textarea>
              </div>
            </div>
          </section>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="profile-col profile-col--sidebar">
          
          <!-- CONTACT -->
          <section class="profile-card profile-card--highlight">
            <h3 class="profile-card__title">📞 Contact</h3>
            ${(p.contacts?.phone || p.contacts?.admissionsPhone) ? `
              <a href="tel:${p.contacts.admissionsPhone || p.contacts.phone}" class="profile-contact-btn">
                <span>Call Admissions</span>
                <strong>${p.contacts.admissionsPhone || p.contacts.phone}</strong>
              </a>
            ` : '<p class="profile-card__empty">Phone not available</p>'}
            ${(p.contacts?.email || p.contacts?.admissionsEmail) ? `
              <a href="mailto:${p.contacts.admissionsEmail || p.contacts.email}" class="profile-contact-link">
                ✉️ ${p.contacts.admissionsEmail || p.contacts.email}
              </a>
            ` : ''}
            ${p.contacts?.contactName ? `<p class="profile-contact-name">Ask for: ${p.contacts.contactName}</p>` : ''}
          </section>

          <!-- FAMILY AMBASSADOR -->
          ${renderFamilyAmbassadorSection(p.id)}

          <!-- INSURANCE -->
          <section class="profile-card">
            <h3 class="profile-card__title">💳 Insurance</h3>
            ${(p.insurance && p.insurance.length > 0) ? `
              <div class="profile-tags profile-tags--compact">
                ${p.insurance.slice(0, 8).map(i => `<span class="profile-tag profile-tag--ins">${i}</span>`).join('')}
                ${p.insurance.length > 8 ? `<span class="profile-tag profile-tag--more">+${p.insurance.length - 8} more</span>` : ''}
              </div>
            ` : '<p class="profile-card__empty">Contact for insurance information</p>'}
          </section>

          <!-- LOCATION -->
          <section class="profile-card">
            <h3 class="profile-card__title">📍 Location</h3>
            <p class="profile-card__address">${p.fullAddress || `${p.city}, ${p.state}`}</p>
            ${p.nearestAirport ? `<p class="profile-card__airport">✈️ Nearest airport: ${p.nearestAirport}</p>` : ''}
            ${(p.lat && p.lng) ? `
              <a href="https://maps.google.com/?q=${p.lat},${p.lng}" target="_blank" class="profile-map-link">
                View on Google Maps ↗
              </a>
            ` : ''}
          </section>

          ${hasAcademics ? `
            <section class="profile-card">
              <h3 class="profile-card__title">📚 Academics</h3>
              ${p.academics ? `
                <div class="profile-academics">
                  <div class="profile-academic-item ${p.academics.accreditedSchool ? 'yes' : 'no'}">
                    ${p.academics.accreditedSchool ? '✓' : '—'} Accredited School
                  </div>
                  <div class="profile-academic-item ${p.academics.creditsTransferable ? 'yes' : 'no'}">
                    ${p.academics.creditsTransferable ? '✓' : '—'} Credits Transfer
                  </div>
                  <div class="profile-academic-item ${p.academics.diplomaGranting ? 'yes' : 'no'}">
                    ${p.academics.diplomaGranting ? '✓' : '—'} Diploma Granting
                  </div>
                  <div class="profile-academic-item ${p.academics.specialEducation ? 'yes' : 'no'}">
                    ${p.academics.specialEducation ? '✓' : '—'} IEP/504 Support
                  </div>
                  ${p.academics.gradeLevels ? `<p class="profile-academic-grades">Grades: ${p.academics.gradeLevels}</p>` : ''}
                </div>
              ` : '<p class="profile-card__empty">Academic details not yet documented</p>'}
            </section>
          ` : ''}

          <!-- TAGS -->
          ${(p.tags && p.tags.length > 0) ? `
            <section class="profile-card">
              <h3 class="profile-card__title">🏷️ Tags</h3>
              <div class="profile-tags profile-tags--compact">
                ${p.tags.map(t => `<span class="profile-tag">${t}</span>`).join('')}
              </div>
            </section>
          ` : ''}

          <!-- FFAS HISTORY -->
          <section class="profile-card profile-card--history">
            <h3 class="profile-card__title">📋 FFAS History</h3>
            <div class="ffas-history">
              <div class="ffas-history__stat">
                <span class="ffas-history__number" id="ffasPlacementCount">${coachIntel.placements || 0}</span>
                <span class="ffas-history__label">Placements</span>
              </div>
              <div class="ffas-history__stat">
                <span class="ffas-history__date" id="ffasLastPlacement">${coachIntel.lastPlacement || 'Never'}</span>
                <span class="ffas-history__label">Last Placed</span>
              </div>
            </div>
            <button class="btn btn--sm btn--outline" onclick="logPlacement('${p.id}')">+ Log Placement</button>
          </section>

          <!-- NOTES (Legacy) -->
          <section class="profile-card profile-card--notes">
            <h3 class="profile-card__title">📝 Quick Notes</h3>
            <textarea class="profile-notes-input" id="profileNotesText" placeholder="Add private notes about this program...">${getNotes(p.id)}</textarea>
            <button class="btn btn--sm btn--secondary" onclick="saveNotes('${p.id}')">Save Notes</button>
          </section>
        </div>
      </div>
    `;
  }

  // Get child programs for a network
  function getChildPrograms(parent) {
    if (!parent.children || parent.children.length === 0) return [];
    return parent.children.map(childId => {
      const child = window.ccPrograms?.byId(childId);
      return child || null;
    }).filter(Boolean);
  }

  // Coach Intelligence storage
  function getCoachIntel(programId) {
    try {
      const intel = JSON.parse(localStorage.getItem('cc-coach-intel') || '{}');
      return intel[programId] || {};
    } catch {
      return {};
    }
  }

  window.updateCoachIntel = function(programId, field, value) {
    try {
      const intel = JSON.parse(localStorage.getItem('cc-coach-intel') || '{}');
      if (!intel[programId]) intel[programId] = {};
      intel[programId][field] = value;
      intel[programId].updatedAt = new Date().toISOString();
      localStorage.setItem('cc-coach-intel', JSON.stringify(intel));
      
      // Update rating display if that's what changed
      if (field === 'rating') {
        renderFullProfile(); // Re-render to update stars
      }
    } catch (e) {
      console.error('Failed to save coach intel:', e);
    }
  };

  window.logPlacement = function(programId) {
    const intel = getCoachIntel(programId);
    const count = (intel.placements || 0) + 1;
    const today = new Date().toLocaleDateString();
    
    window.updateCoachIntel(programId, 'placements', count);
    window.updateCoachIntel(programId, 'lastPlacement', today);
    
    // Update display
    const countEl = document.getElementById('ffasPlacementCount');
    const dateEl = document.getElementById('ffasLastPlacement');
    if (countEl) countEl.textContent = count;
    if (dateEl) dateEl.textContent = today;
    
    alert(`Logged placement #${count} at this program!`);
  };

  // ============================================================================
  // FAMILY AMBASSADOR SYSTEM
  // ============================================================================

  // Get Family Ambassador assignments from localStorage
  function getFamilyAmbassador(programId) {
    try {
      const ambassadors = JSON.parse(localStorage.getItem('cc-family-ambassadors') || '{}');
      return ambassadors[programId] || null;
    } catch {
      return null;
    }
  }

  // Save Family Ambassador assignment
  window.saveFamilyAmbassador = function(programId, data) {
    try {
      const ambassadors = JSON.parse(localStorage.getItem('cc-family-ambassadors') || '{}');
      ambassadors[programId] = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem('cc-family-ambassadors', JSON.stringify(ambassadors));
      return true;
    } catch (e) {
      console.error('Failed to save family ambassador:', e);
      return false;
    }
  };

  // Get all FFAS staff (for dropdown in admin)
  function getFFASStaff() {
    // This could eventually come from a database, for now it's a static list
    // that admin can manage
    try {
      const staff = JSON.parse(localStorage.getItem('cc-ffas-staff') || '[]');
      if (staff.length === 0) {
        // Default starter list
        return [
          { id: 'staff-1', name: 'Unassigned', email: '', phone: '' }
        ];
      }
      return staff;
    } catch {
      return [{ id: 'staff-1', name: 'Unassigned', email: '', phone: '' }];
    }
  }

  // Save FFAS staff list
  window.saveFFASStaff = function(staff) {
    try {
      localStorage.setItem('cc-ffas-staff', JSON.stringify(staff));
      return true;
    } catch (e) {
      console.error('Failed to save FFAS staff:', e);
      return false;
    }
  };

  // Render Family Ambassador section in profile
  function renderFamilyAmbassadorSection(programId) {
    const ambassador = getFamilyAmbassador(programId);
    
    if (!ambassador || !ambassador.staffName || ambassador.staffName === 'Unassigned') {
      return `
        <section class="profile-card profile-card--ambassador profile-card--empty-ambassador">
          <h3 class="profile-card__title">👥 Family Ambassador</h3>
          <p class="profile-card__empty">No Family Ambassador assigned</p>
          <p class="profile-card__hint">Admins can assign ambassadors in the Admin Command Center</p>
        </section>
      `;
    }

    return `
      <section class="profile-card profile-card--ambassador">
        <h3 class="profile-card__title">👥 Family Ambassador</h3>
        
        <div class="ambassador-block">
          <div class="ambassador-block__section">
            <div class="ambassador-block__label">FFAS Representative</div>
            <div class="ambassador-block__name">${ambassador.staffName}</div>
            ${ambassador.staffEmail ? `
              <a href="mailto:${ambassador.staffEmail}" class="ambassador-block__contact">✉️ ${ambassador.staffEmail}</a>
            ` : ''}
            ${ambassador.staffPhone ? `
              <a href="tel:${ambassador.staffPhone}" class="ambassador-block__contact">📞 ${ambassador.staffPhone}</a>
            ` : ''}
          </div>
          
          ${ambassador.programContactName ? `
            <div class="ambassador-block__section ambassador-block__section--program">
              <div class="ambassador-block__label">Program Liaison</div>
              <div class="ambassador-block__name">${ambassador.programContactName}</div>
              ${ambassador.programContactRole ? `<div class="ambassador-block__role">${ambassador.programContactRole}</div>` : ''}
              ${ambassador.programContactEmail ? `
                <a href="mailto:${ambassador.programContactEmail}" class="ambassador-block__contact">✉️ ${ambassador.programContactEmail}</a>
              ` : ''}
              ${ambassador.programContactPhone ? `
                <a href="tel:${ambassador.programContactPhone}" class="ambassador-block__contact">📞 ${ambassador.programContactPhone}</a>
              ` : ''}
            </div>
          ` : ''}
        </div>
        
        ${ambassador.notes ? `
          <div class="ambassador-notes">
            <div class="ambassador-notes__label">Notes</div>
            <p class="ambassador-notes__text">${ambassador.notes}</p>
          </div>
        ` : ''}
      </section>
    `;
  }

  // Expose for admin panel
  window.ccFamilyAmbassadors = {
    get: getFamilyAmbassador,
    save: window.saveFamilyAmbassador,
    getStaff: getFFASStaff,
    saveStaff: window.saveFFASStaff,
    getAll: function() {
      try {
        return JSON.parse(localStorage.getItem('cc-family-ambassadors') || '{}');
      } catch {
        return {};
      }
    }
  };

  function getNotes(programId) {
    try {
      const notes = JSON.parse(localStorage.getItem('cc-program-notes') || '{}');
      return notes[programId] || '';
    } catch {
      return '';
    }
  }

  window.saveNotes = function(programId) {
    const textarea = document.getElementById('profileNotesText');
    try {
      const notes = JSON.parse(localStorage.getItem('cc-program-notes') || '{}');
      notes[programId] = textarea.value;
      localStorage.setItem('cc-program-notes', JSON.stringify(notes));
      alert('Notes saved!');
    } catch (e) {
      console.error('Failed to save notes:', e);
    }
  };

  function toggleAddDropdown() {
    const dropdown = document.getElementById('addToPlanDropdown');
    dropdown.hidden = !dropdown.hidden;
  }

  function addToPhase(phase) {
    if (!state.selectedProgramId) return;
    window.ccDocumentModel?.addProgram(phase, state.selectedProgramId);
    document.getElementById('addToPlanDropdown').hidden = true;
    updateBuilderUI();
    closeProfile();
  }

  // ============================================================================
  // COMPARE
  // ============================================================================

  function toggleCompare(program) {
    const index = state.compareList.indexOf(program.id);
    
    if (index > -1) {
      state.compareList.splice(index, 1);
    } else if (state.compareList.length < 4) {
      state.compareList.push(program.id);
    } else {
      alert('You can compare up to 4 programs at a time.');
      return;
    }

    if (state.currentView === 'compare') {
      renderCompare();
    }
  }

  function quickAdd(program) {
    // Create a draft if one doesn't exist
    if (!window.ccDocumentModel?.getCurrentDraft()) {
      const client = state.currentClient;
      const docType = dom.docTypeSelect?.value || 'aftercare-options';
      window.ccDocumentModel?.createDraft(
        docType,
        client?.id || 'unknown',
        client?.initials || 'XX'
      );
    }
    
    const docType = dom.docTypeSelect?.value || 'aftercare-options';
    
    // For Aftercare Options, check if this is an at-home type program
    if (docType === 'aftercare-options') {
      const isAtHomeType = isAtHomeProgramType(program);
      
      if (isAtHomeType) {
        // Show prompt for at-home type programs
        showAtHomePrompt(program);
        return;
      }
      
      // Regular program - add to primary
      window.ccDocumentModel?.addProgram('simple', program.id);
    } else {
      // Aftercare Plan - add to stabilize phase
      window.ccDocumentModel?.addProgram('stabilize', program.id);
    }
    
    updateBuilderUI();
  }
  
  // Check if program is typically an at-home type (IOP, PHP, Outpatient, Virtual)
  function isAtHomeProgramType(program) {
    const atHomeLOCs = ['IOP', 'PHP', 'Outpatient', 'OP', 'Intensive Outpatient', 'Partial Hospitalization'];
    const primaryLOC = program.primaryLOC || '';
    const levelOfCare = program.levelOfCare || [];
    const format = program.format || [];
    
    // Check if primary LOC is an at-home type
    if (atHomeLOCs.some(loc => primaryLOC.toLowerCase().includes(loc.toLowerCase()))) {
      return true;
    }
    
    // Check if any level of care is at-home type
    if (levelOfCare.some(loc => atHomeLOCs.some(ah => loc.toLowerCase().includes(ah.toLowerCase())))) {
      return true;
    }
    
    // Check if format is Virtual only (no Onsite)
    if (format.includes('Virtual') && !format.includes('Onsite') && !format.includes('Hybrid')) {
      return true;
    }
    
    return false;
  }
  
  function showAtHomePrompt(program) {
    // Create the prompt modal
    const modal = document.createElement('div');
    modal.className = 'athome-prompt-overlay';
    modal.innerHTML = `
      <div class="athome-prompt">
        <div class="athome-prompt__header">
          <span class="athome-prompt__icon">🏠</span>
          <span class="athome-prompt__title">Add to which section?</span>
        </div>
        <div class="athome-prompt__program">
          <strong>${program.name}</strong>
          <span class="athome-prompt__loc">${program.primaryLOC || 'Virtual'}</span>
        </div>
        <div class="athome-prompt__info">
          This looks like an outpatient/virtual program. Where should it go?
        </div>
        <div class="athome-prompt__buttons">
          <button class="athome-prompt__btn athome-prompt__btn--primary" data-action="primary">
            🏥 Primary Recommendations
          </button>
          <button class="athome-prompt__btn athome-prompt__btn--athome" data-action="athome">
            🏠 At-Home Options
          </button>
        </div>
        <button class="athome-prompt__close" data-action="close">✕</button>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle button clicks
    modal.addEventListener('click', (e) => {
      const action = e.target.dataset.action || e.target.closest('[data-action]')?.dataset.action;
      
      if (action === 'primary') {
        window.ccDocumentModel?.addProgram('simple', program.id);
        updateBuilderUI();
        modal.remove();
      } else if (action === 'athome') {
        window.ccDocumentModel?.addProgram('atHome', program.id);
        updateBuilderUI();
        modal.remove();
      } else if (action === 'close') {
        modal.remove();
      }
    });
    
    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  // ============================================================================
  // BUILDER
  // ============================================================================

  function toggleBuilder() {
    state.builderOpen = !state.builderOpen;
    dom.builderPane.classList.toggle('hidden', !state.builderOpen);
    dom.toggleBuilderBtn.classList.toggle('toolbar__btn--active', state.builderOpen);
  }

  /**
   * Toggle filter rail collapsed/expanded state
   */
  function toggleFilterRail() {
    const filterRail = document.getElementById('filterRail');
    const mainLayout = document.getElementById('mainLayout');
    
    if (!filterRail || !mainLayout) return;
    
    const isCollapsed = filterRail.classList.toggle('filter-rail--collapsed');
    mainLayout.classList.toggle('main-layout--filter-collapsed', isCollapsed);
    
    // Save preference
    localStorage.setItem('cc-filter-collapsed', isCollapsed ? 'true' : 'false');
    
    console.log('Filter rail', isCollapsed ? 'collapsed' : 'expanded');
  }

  function updateBuilderUI() {
    const draft = window.ccDocumentModel?.getCurrentDraft();
    
    if (!draft) {
      dom.builderStatus.textContent = 'Status: No draft';
      clearBuilderPhases();
      updateSimpleListUI([]);
      return;
    }

    dom.builderStatus.textContent = `Status: ${draft.status} • Last saved ${new Date(draft.updatedAt).toLocaleTimeString()}`;
    dom.docTypeSelect.value = draft.type;

    // Update simple list view (for Aftercare Options)
    updateSimpleListUI(draft.phases.simple || []);

    // Update phase contents (for Aftercare Plan)
    ['stabilize', 'bridge', 'sustain', 'atHome'].forEach(phase => {
      const container = document.getElementById(`phase${phase.charAt(0).toUpperCase() + phase.slice(1)}`);
      if (!container) return;
      const programs = draft.phases[phase] || [];
      
      if (programs.length === 0) {
        container.innerHTML = '<div class="builder-phase__empty">Drag programs here</div>';
      } else {
        container.innerHTML = programs.map(id => {
          const p = window.ccPrograms?.byId(id);
          if (!p) return '';
          return `
            <div class="builder-item" data-program-id="${id}">
              <span class="builder-item__drag">⋮⋮</span>
              <div class="builder-item__content">
                <div class="builder-item__name">${p.name}</div>
                <div class="builder-item__location">${p.city}, ${p.state}</div>
              </div>
              <button class="builder-item__remove" data-action="remove">✕</button>
            </div>
          `;
        }).join('');

        // Bind remove buttons
        container.querySelectorAll('[data-action="remove"]').forEach(btn => {
          btn.addEventListener('click', () => {
            const programId = btn.closest('.builder-item').dataset.programId;
            window.ccDocumentModel?.removeProgram(phase, programId);
            updateBuilderUI();
          });
        });
      }
    });

    // Update alumni checkboxes
    const alumniParentFocus = document.getElementById('alumniParentFocus');
    const alumniProgramming = document.getElementById('alumniProgramming');
    const alumniNest = document.getElementById('alumniNest');
    if (alumniParentFocus) alumniParentFocus.checked = draft.alumni.parentFocusGroup;
    if (alumniProgramming) alumniProgramming.checked = draft.alumni.alumniProgramming;
    if (alumniNest) alumniNest.checked = draft.alumni.nestAlumni;
    
    // Update at-home mode dropdown
    const atHomeModeSelect = document.getElementById('atHomeMode');
    if (atHomeModeSelect) {
      atHomeModeSelect.value = draft.atHomeMode || 'include';
      handleAtHomeModeChange(); // Update UI to match
    }
  }

  function updateSimpleListUI(programIds) {
    const container = document.getElementById('simpleListContent');
    const countEl = document.getElementById('simpleListCount');
    
    if (!container) return;
    
    if (programIds.length === 0) {
      container.innerHTML = `
        <div class="builder-simple-list__empty">
          <span style="font-size: 24px; margin-bottom: 8px;">📋</span>
          <span>Click "+ Add" on any program card</span>
        </div>
      `;
      if (countEl) countEl.textContent = '0 programs';
    } else {
      container.innerHTML = programIds.map(id => {
        const p = window.ccPrograms?.byId(id);
        if (!p) return '';
        return `
          <div class="builder-item" data-program-id="${id}" draggable="true">
            <span class="builder-item__drag">⋮⋮</span>
            <div class="builder-item__content">
              <div class="builder-item__name">${p.name}</div>
              <div class="builder-item__location">${p.city || 'Virtual'}, ${p.state || ''}</div>
            </div>
            <button class="builder-item__athome-toggle" data-action="move-to-athome" title="Move to At-Home">🏠</button>
            <button class="builder-item__remove" data-action="remove-simple">✕</button>
          </div>
        `;
      }).join('');
      
      if (countEl) countEl.textContent = `${programIds.length} program${programIds.length !== 1 ? 's' : ''}`;
      
      // Bind remove buttons
      container.querySelectorAll('[data-action="remove-simple"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const programId = btn.closest('.builder-item').dataset.programId;
          window.ccDocumentModel?.removeProgram('simple', programId);
          updateBuilderUI();
        });
      });
      
      // Bind move to at-home buttons
      container.querySelectorAll('[data-action="move-to-athome"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const programId = btn.closest('.builder-item').dataset.programId;
          window.ccDocumentModel?.removeProgram('simple', programId);
          window.ccDocumentModel?.addProgram('atHome', programId);
          updateBuilderUI();
        });
      });
      
      // Setup drag-and-drop for reordering
      setupDragAndDrop(container, 'simple');
    }
    
    // Also update the at-home list
    updateAtHomeListUI();
  }
  
  function updateAtHomeListUI() {
    const container = document.getElementById('atHomeListContent');
    const countEl = document.getElementById('atHomeListCount');
    const draft = window.ccDocumentModel?.getCurrentDraft();
    const programIds = draft?.phases?.atHome || [];
    
    if (!container) return;
    
    if (programIds.length === 0) {
      container.innerHTML = `
        <div class="builder-simple-list__empty builder-simple-list__empty--athome">
          <span style="font-size: 20px; margin-bottom: 4px;">🏠</span>
          <span>Add IOP, outpatient, or virtual options</span>
        </div>
      `;
      if (countEl) countEl.textContent = '0 programs';
    } else {
      container.innerHTML = programIds.map(id => {
        const p = window.ccPrograms?.byId(id);
        if (!p) return '';
        return `
          <div class="builder-item" data-program-id="${id}" draggable="true">
            <span class="builder-item__drag">⋮⋮</span>
            <div class="builder-item__content">
              <div class="builder-item__name">${p.name}</div>
              <div class="builder-item__location">${p.city || 'Virtual'}, ${p.state || ''}</div>
            </div>
            <button class="builder-item__athome-toggle" data-action="move-to-primary" title="Move to Primary">🏥</button>
            <button class="builder-item__remove" data-action="remove-athome">✕</button>
          </div>
        `;
      }).join('');
      
      if (countEl) countEl.textContent = `${programIds.length} program${programIds.length !== 1 ? 's' : ''}`;
      
      // Bind remove buttons
      container.querySelectorAll('[data-action="remove-athome"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const programId = btn.closest('.builder-item').dataset.programId;
          window.ccDocumentModel?.removeProgram('atHome', programId);
          updateBuilderUI();
        });
      });
      
      // Bind move to primary buttons
      container.querySelectorAll('[data-action="move-to-primary"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const programId = btn.closest('.builder-item').dataset.programId;
          window.ccDocumentModel?.removeProgram('atHome', programId);
          window.ccDocumentModel?.addProgram('simple', programId);
          updateBuilderUI();
        });
      });
      
      // Setup drag-and-drop for reordering
      setupDragAndDrop(container, 'atHome');
    }
  }
  
  function setupDragAndDrop(container, phase) {
    const items = container.querySelectorAll('.builder-item');
    
    items.forEach(item => {
      item.addEventListener('dragstart', (e) => {
        item.classList.add('dragging');
        e.dataTransfer.setData('text/plain', item.dataset.programId);
        e.dataTransfer.setData('source-phase', phase);
        e.dataTransfer.effectAllowed = 'move';
      });
      
      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        // Remove all drag-over classes
        document.querySelectorAll('.drag-over, .drag-over-empty').forEach(el => {
          el.classList.remove('drag-over', 'drag-over-empty');
        });
      });
      
      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        const dragging = container.querySelector('.dragging');
        if (dragging && dragging !== item) {
          item.classList.add('drag-over');
        }
      });
      
      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      });
      
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.classList.remove('drag-over');
        
        const draggedId = e.dataTransfer.getData('text/plain');
        const sourcePhase = e.dataTransfer.getData('source-phase');
        const targetId = item.dataset.programId;
        
        if (draggedId === targetId) return;
        
        // Reorder within the same phase
        if (sourcePhase === phase) {
          const draft = window.ccDocumentModel?.getCurrentDraft();
          if (!draft) return;
          
          const programIds = [...(draft.phases[phase] || [])];
          const draggedIndex = programIds.indexOf(draggedId);
          const targetIndex = programIds.indexOf(targetId);
          
          if (draggedIndex > -1 && targetIndex > -1) {
            programIds.splice(draggedIndex, 1);
            programIds.splice(targetIndex, 0, draggedId);
            window.ccDocumentModel?.reorderPrograms(phase, programIds);
            updateBuilderUI();
          }
        } else {
          // Move between phases
          window.ccDocumentModel?.removeProgram(sourcePhase, draggedId);
          window.ccDocumentModel?.addProgram(phase, draggedId);
          updateBuilderUI();
        }
      });
    });
    
    // Also allow dropping on empty container
    container.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (container.querySelector('.builder-simple-list__empty')) {
        container.classList.add('drag-over-empty');
      }
    });
    
    container.addEventListener('dragleave', (e) => {
      if (!container.contains(e.relatedTarget)) {
        container.classList.remove('drag-over-empty');
      }
    });
    
    container.addEventListener('drop', (e) => {
      e.preventDefault();
      container.classList.remove('drag-over-empty');
      
      const draggedId = e.dataTransfer.getData('text/plain');
      const sourcePhase = e.dataTransfer.getData('source-phase');
      
      if (!draggedId || sourcePhase === phase) return;
      
      // Move to this phase
      window.ccDocumentModel?.removeProgram(sourcePhase, draggedId);
      window.ccDocumentModel?.addProgram(phase, draggedId);
      updateBuilderUI();
    });
  }

  function clearBuilderPhases() {
    ['Stabilize', 'Bridge', 'Sustain', 'AtHome'].forEach(phase => {
      const container = document.getElementById(`phase${phase}`);
      if (container) container.innerHTML = '<div class="builder-phase__empty">Drag programs here</div>';
    });
    updateSimpleListUI([]);
  }

  function switchScenario(scenario) {
    document.querySelectorAll('.builder-pane__tab').forEach(t => {
      t.classList.toggle('builder-pane__tab--active', t.dataset.scenario === scenario);
    });
    window.ccDocumentModel?.setScenario(scenario);
  }

  function handleDocTypeChange() {
    const docType = dom.docTypeSelect.value;
    window.ccDocumentModel?.setDocumentType(docType);
    
    const isAftercarePlan = docType === 'aftercare-plan';
    
    // Toggle between simple list view (Aftercare Options) and phase view (Aftercare Plan)
    const simpleListView = document.getElementById('simpleListView');
    const phaseView = document.getElementById('phaseView');
    const scenarioTabs = document.querySelector('.builder-pane__tabs');
    const alumniSection = document.getElementById('alumniSection');
    
    if (simpleListView) simpleListView.style.display = isAftercarePlan ? 'none' : 'block';
    if (phaseView) phaseView.style.display = isAftercarePlan ? 'block' : 'none';
    if (scenarioTabs) scenarioTabs.style.display = isAftercarePlan ? 'flex' : 'none';
    if (alumniSection) alumniSection.style.display = isAftercarePlan ? 'block' : 'none';
  }

  function handleAlumniChange() {
    window.ccDocumentModel?.setAlumniService('parentFocusGroup', document.getElementById('alumniParentFocus').checked);
    window.ccDocumentModel?.setAlumniService('alumniProgramming', document.getElementById('alumniProgramming').checked);
    window.ccDocumentModel?.setAlumniService('nestAlumni', document.getElementById('alumniNest').checked);
  }
  
  function handleAtHomeModeChange() {
    const mode = document.getElementById('atHomeMode')?.value || 'include';
    const section = document.getElementById('atHomeSection');
    const subtitle = document.getElementById('atHomeSubtitle');
    
    // Update UI based on mode
    if (section) {
      section.classList.toggle('athome-hidden', mode === 'none');
    }
    
    // Update subtitle text
    if (subtitle) {
      const subtitles = {
        'include': 'Programs added here appear at the bottom of the document with "AT-HOME" header',
        'separate': 'Programs here will generate a separate "At-Home Options" document',
        'none': ''
      };
      subtitle.textContent = subtitles[mode] || '';
    }
    
    // Store in draft
    window.ccDocumentModel?.setAtHomeMode(mode);
  }

  function saveDraft() {
    if (!window.ccDocumentModel?.getCurrentDraft()) {
      // Create new draft
      const client = state.currentClient;
      window.ccDocumentModel?.createDraft(
        dom.docTypeSelect.value,
        client?.id || 'unknown',
        client?.initials || 'XX'
      );
    }
    alert('Draft saved!');
    updateBuilderUI();
  }

  function previewDocument() {
    const content = window.ccDocumentModel?.generateDocument();
    if (!content) {
      alert('No document to preview. Add programs first.');
      return;
    }

    // Simple preview in new window
    const previewWin = window.open('', '_blank');
    previewWin.document.write(`
      <html>
      <head><title>Document Preview</title>
      <style>body { font-family: Calibri, sans-serif; padding: 40px; max-width: 800px; margin: auto; white-space: pre-wrap; line-height: 1.6; }</style>
      </head>
      <body>${content.replace(/\n/g, '<br>')}</body>
      </html>
    `);
  }

  async function exportDocument() {
    try {
      const result = await window.ccDocumentModel?.exportDocument('both');
      if (result) {
        showKipuModal(result);
      }
    } catch (e) {
      console.error('Export failed:', e);
      alert('Export failed: ' + e.message);
    }
  }

  // ============================================================================
  // KIPU MODAL
  // ============================================================================

  function showKipuModal(result) {
    const draft = window.ccDocumentModel?.getCurrentDraft();
    const fileName = window.ccDocumentModel?.getFileName('pdf');

    document.getElementById('kipuFileName').textContent = fileName?.replace('.pdf', '') || '--';
    document.getElementById('kipuFiles').innerHTML = `
      <div class="kipu-modal__file">☑ ${window.ccDocumentModel?.getFileName('pdf')}</div>
      <div class="kipu-modal__file">☑ ${window.ccDocumentModel?.getFileName('docx')}</div>
    `;

    // Show the modal
    dom.kipuModal.hidden = false;
    dom.kipuModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closeKipuModal() {
    dom.kipuModal.hidden = true;
    dom.kipuModal.style.display = 'none';
    document.body.style.overflow = '';
  }

  function downloadExportedFiles() {
    // Files are already downloaded by exportDocument
    closeKipuModal();
  }

  function markAsUploaded() {
    window.ccDocumentModel?.markAsUploaded(state.currentClient?.id);
    closeKipuModal();
    alert('Document marked as uploaded!');
  }

  // ============================================================================
  // PREFERENCES
  // ============================================================================

  function initPreferencesUI() {
    const categories = window.ccPreferences?.getCategories() || [];
    const content = document.getElementById('preferencesContent');

    content.innerHTML = categories.map(cat => `
      <div class="preferences-section">
        <h3 class="preferences-section__title">${cat.name}</h3>
        ${cat.settings.map(setting => {
          if (setting.type === 'select') {
            return `
              <div class="preferences-field">
                <label class="preferences-field__label">${setting.label}</label>
                <select class="preferences-field__input" data-pref="${setting.key}">
                  ${setting.options.map(opt => 
                    `<option value="${opt.value}" ${opt.value === setting.value ? 'selected' : ''}>${opt.label}</option>`
                  ).join('')}
                </select>
              </div>
            `;
          } else if (setting.type === 'toggle') {
            return `
              <div class="preferences-field">
                <label class="preferences-field__label">${setting.label}</label>
                <button class="preferences-field__toggle ${setting.value ? 'preferences-field__toggle--active' : ''}" 
                        data-pref="${setting.key}" role="switch" aria-checked="${setting.value}"></button>
              </div>
            `;
          } else {
            return `
              <div class="preferences-field">
                <label class="preferences-field__label">${setting.label}</label>
                <input type="text" class="preferences-field__input" data-pref="${setting.key}" 
                       value="${setting.value || ''}" placeholder="${setting.placeholder || ''}">
              </div>
            `;
          }
        }).join('')}
      </div>
    `).join('');

    // Bind toggle buttons
    content.querySelectorAll('.preferences-field__toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.classList.toggle('preferences-field__toggle--active');
        btn.setAttribute('aria-checked', btn.classList.contains('preferences-field__toggle--active'));
      });
    });
  }

  function openPreferences() {
    if (!dom.preferencesModal) return;
    initPreferencesUI(); // Refresh values
    dom.preferencesModal.hidden = false;
    dom.preferencesModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }

  function closePreferences() {
    if (dom.preferencesModal) {
      dom.preferencesModal.hidden = true;
      dom.preferencesModal.style.display = 'none';
    }
    document.body.style.overflow = '';
  }

  function savePreferences() {
    const values = {};

    document.querySelectorAll('[data-pref]').forEach(el => {
      const key = el.dataset.pref;
      
      if (el.classList.contains('preferences-field__toggle')) {
        values[key] = el.classList.contains('preferences-field__toggle--active');
      } else if (el.tagName === 'SELECT') {
        const opt = el.options[el.selectedIndex];
        // Try to parse number values
        const val = opt.value;
        values[key] = isNaN(val) ? val : (val === 'all' ? 'all' : Number(val));
      } else {
        values[key] = el.value;
      }
    });

    window.ccPreferences?.setValues(values);
    closePreferences();
    
    // Apply new default view if changed
    if (values.defaultViewMode && values.defaultViewMode !== state.currentView) {
      switchView(values.defaultViewMode);
    }
  }

  function resetPreferences() {
    window.ccPreferences?.reset();
    initPreferencesUI();
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  function debounce(fn, delay) {
    let timer;
    return function(...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  // ============================================================================
  // START
  // ============================================================================

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

