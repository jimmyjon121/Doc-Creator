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
    
    // Wait for programs to load
    if (window.ccPrograms?.isReady) {
      onProgramsReady();
    } else {
      window.addEventListener('ccprograms:loaded', onProgramsReady);
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

  function onProgramsReady() {
    console.log('✅ Programs ready, initializing UI...');

    // Initialize components
    initFilters();
    initClientSelector();
    initPreferencesUI();
    
    // Apply preferences
    const prefs = window.ccPreferences?.get() || {};
    if (prefs.defaultViewMode) {
      switchView(prefs.defaultViewMode);
    }

    // Initial render
    renderPrograms();
    updateStats();

    // Load any saved draft
    window.ccDocumentModel?.loadDraft();
    updateBuilderUI();

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

  function initClientSelector() {
    // Try to get clients from clientManager
    const clients = window.clientManager?.getAllClients?.() || [];
    
    dom.clientSelector.innerHTML = '<option value="">Select Client...</option>' +
      clients.map(c => `<option value="${c.id}">${c.initials || 'XX'} - ${c.kipuId || '?'}</option>`).join('');

    // If no clients available, add demo option
    if (clients.length === 0) {
      dom.clientSelector.innerHTML += '<option value="demo">Demo Client (JD)</option>';
    }
  }

  function handleClientChange(e) {
    const clientId = e.target.value;
    
    if (!clientId) {
      state.currentClient = null;
      dom.clientContext.hidden = true;
      document.getElementById('mapCenterClient').disabled = true;
      return;
    }

    // Get client data
    let client = window.clientManager?.getClient?.(clientId);
    
    // Demo client
    if (clientId === 'demo') {
      client = {
        id: 'demo',
        initials: 'JD',
        kipuId: '12345',
        houseId: 'NEST',
        admitDate: new Date(),
        zip: '33101',
      };
    }

    if (client) {
      state.currentClient = client;
      updateClientContext(client);
      dom.clientContext.hidden = false;
      
      // Update builder
      dom.builderClient.textContent = `${client.initials || 'XX'} - ${client.kipuId || '?'}`;
      
      // Update document model
      window.ccDocumentModel?.setClient(client.id, client.initials);

      // Auto-check NEST alumni if applicable
      if (client.houseId === 'NEST') {
        const nestCheckbox = document.getElementById('alumniNest');
        if (nestCheckbox) nestCheckbox.checked = true;
      }

      // Update map center button
      document.getElementById('mapCenterClient').disabled = !client.zip;

      // Set home location if ZIP available
      if (client.zip) {
        window.ccPreferences?.geocodeZip(client.zip).then(coords => {
          if (coords) {
            window.ccPrograms?.setHomeLocation(coords.lat, coords.lng, client.zip);
            if (state.currentView === 'map') {
              window.ccMapController?.showHomeLocation(coords.lat, coords.lng);
            }
          }
        });
      }
    }
  }

  function updateClientContext(client) {
    document.getElementById('clientInitials').textContent = client.initials || '--';
    document.getElementById('clientKipuId').textContent = client.kipuId || '--';
    document.getElementById('clientHouse').textContent = client.houseId || '--';
    document.getElementById('clientAdmitDate').textContent = client.admitDate 
      ? new Date(client.admitDate).toLocaleDateString() 
      : '--';
    document.getElementById('clientZip').value = client.zip || '';
    document.getElementById('clientCityState').textContent = '--'; // Would need geocoding
  }

  function switchClientTab(tabId) {
    document.querySelectorAll('.client-context__tab').forEach(t => {
      t.classList.toggle('client-context__tab--active', t.dataset.tab === tabId);
    });
    document.querySelectorAll('.client-context__panel').forEach(p => {
      p.hidden = p.dataset.panel !== tabId;
    });
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
    const sorted = sortPrograms(programs);

    dom.emptyState.hidden = sorted.length > 0;

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

    const locBadges = program.levelOfCare.map(loc => 
      `<span class="loc-badge loc-badge--${loc.toLowerCase().replace(/\s+/g, '-')}">${loc}</span>`
    ).join('');

    const distance = program.distanceMiles !== null 
      ? ` • ${program.distanceMiles} mi` 
      : '';

    const lgbtqIndicator = program.lgbtqAffirming 
      ? '<span class="program-card__lgbtq" title="LGBTQ+ Affirming">🏳️‍🌈</span>' 
      : '';

    const heroStyle = program.heroImageUrl 
      ? `background-image: url('${program.heroImageUrl}'); background-size: cover;`
      : `background: linear-gradient(135deg, ${window.ccMapIcons?.colors[program.primaryLOC] || '#6E7BFF'} 0%, #1F2145 100%);`;

    card.innerHTML = `
      <div class="program-card__hero" style="${heroStyle}">
        <div class="program-card__badges">${locBadges}</div>
        ${lgbtqIndicator}
      </div>
      <div class="program-card__content">
        <h3 class="program-card__name">${program.name}</h3>
        <p class="program-card__location">${program.city}, ${program.state}${distance}</p>
        <p class="program-card__summary">${program.summary || 'No description available.'}</p>
        <div class="program-card__tags">
          ${(program.tags || []).slice(0, 3).map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="program-card__actions">
        <button class="btn btn-add btn--sm" data-action="add">Add to Plan</button>
        <button class="btn btn--icon btn--ghost" data-action="compare" title="Compare">⚖️</button>
        <button class="btn btn--icon btn--ghost" data-action="details" title="Details">→</button>
      </div>
    `;

    // Event handlers
    card.querySelector('[data-action="details"]').addEventListener('click', () => openProfile(program));
    card.querySelector('[data-action="add"]').addEventListener('click', () => quickAdd(program));
    card.querySelector('[data-action="compare"]').addEventListener('click', () => toggleCompare(program));

    return card;
  }

  function createUmbrellaCard(program) {
    const card = document.createElement('article');
    card.className = 'umbrella-card';
    card.dataset.programId = program.id;

    const children = window.ccPrograms?.getChildren(program.id) || [];
    const childLocs = new Set();
    children.forEach(c => c.levelOfCare.forEach(loc => childLocs.add(loc)));

    const locBadges = [...childLocs].map(loc => 
      `<span class="loc-badge loc-badge--${loc.toLowerCase().replace(/\s+/g, '-')}">${loc}</span>`
    ).join('');

    const childList = children.slice(0, 5).map(c => 
      `<li data-program-id="${c.id}">${c.city}, ${c.state} - ${c.primaryLOC}</li>`
    ).join('');

    card.innerHTML = `
      <div class="umbrella-card__header">
        ${program.logoUrl ? `<img src="${program.logoUrl}" class="umbrella-card__logo" alt="">` : ''}
        <div class="umbrella-card__info">
          <h3>${program.name}</h3>
          <span class="umbrella-card__count">${children.length} locations</span>
        </div>
      </div>
      <div class="umbrella-card__badges">${locBadges}</div>
      <p class="umbrella-card__summary">${program.summary || ''}</p>
      <details class="umbrella-card__children">
        <summary>View ${children.length} locations</summary>
        <ul>${childList}${children.length > 5 ? `<li>...and ${children.length - 5} more</li>` : ''}</ul>
      </details>
      <div class="umbrella-card__actions">
        <button class="btn btn--secondary btn--sm" data-action="details">View Network</button>
      </div>
    `;

    // Child click handlers
    card.querySelectorAll('.umbrella-card__children li[data-program-id]').forEach(li => {
      li.addEventListener('click', () => {
        const child = window.ccPrograms?.byId(li.dataset.programId);
        if (child) openProfile(child);
      });
    });

    card.querySelector('[data-action="details"]').addEventListener('click', () => openProfile(program));

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
    return window.ccPrograms?.filter(state.filters) || [];
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
   * Render the full immersive profile - no tabs, single scrollable view
   */
  function renderFullProfile() {
    const p = window.ccPrograms?.byId(state.selectedProgramId);
    if (!p) return;

    const content = document.getElementById('profileContent');
    const hasAcademics = ['RTC', 'TBS'].some(loc => p.levelOfCare.includes(loc));
    const distance = p.distanceMiles !== null ? `${p.distanceMiles} mi away` : null;

    // Build clinical flags
    const flags = [
      { key: 'lgbtqAffirming', label: 'LGBTQ+ Affirming', icon: '🏳️‍🌈' },
      { key: 'transAffirming', label: 'Trans Affirming', icon: '🏳️‍⚧️' },
      { key: 'treatsASD', label: 'Treats ASD', icon: '🧩' },
      { key: 'treatsSUD', label: 'Treats SUD', icon: '💊' },
      { key: 'highAcuityMH', label: 'High Acuity', icon: '⚡' },
    ];
    const activeFlags = flags.filter(f => p[f.key]);

    content.innerHTML = `
      <!-- QUICK STATS BAR -->
      <div class="profile-stats">
        <div class="profile-stat">
          <span class="profile-stat__icon">📍</span>
          <span class="profile-stat__value">${p.city}, ${p.state}</span>
          ${distance ? `<span class="profile-stat__sub">${distance}</span>` : ''}
        </div>
        <div class="profile-stat">
          <span class="profile-stat__icon">👥</span>
          <span class="profile-stat__value">${p.gendersServed.join(', ')}</span>
          <span class="profile-stat__sub">${p.ageMin || '?'}-${p.ageMax || '?'} years</span>
        </div>
        <div class="profile-stat">
          <span class="profile-stat__icon">🏥</span>
          <span class="profile-stat__value">${p.levelOfCare.join(', ')}</span>
          <span class="profile-stat__sub">${p.format.join(', ')}</span>
        </div>
        ${activeFlags.length > 0 ? `
          <div class="profile-stat profile-stat--flags">
            ${activeFlags.map(f => `<span class="profile-flag-badge" title="${f.label}">${f.icon}</span>`).join('')}
          </div>
        ` : ''}
      </div>

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

          <!-- NOTES -->
          <section class="profile-card profile-card--notes">
            <h3 class="profile-card__title">📝 Internal Notes</h3>
            <textarea class="profile-notes-input" id="profileNotesText" placeholder="Add private notes about this program...">${getNotes(p.id)}</textarea>
            <button class="btn btn--sm btn--secondary" onclick="saveNotes('${p.id}')">Save Notes</button>
          </section>
        </div>
      </div>
    `;
  }

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
    window.ccDocumentModel?.addProgram('stabilize', program.id);
    updateBuilderUI();
  }

  // ============================================================================
  // BUILDER
  // ============================================================================

  function toggleBuilder() {
    state.builderOpen = !state.builderOpen;
    dom.builderPane.classList.toggle('hidden', !state.builderOpen);
    dom.toggleBuilderBtn.classList.toggle('toolbar__btn--active', state.builderOpen);
  }

  function updateBuilderUI() {
    const draft = window.ccDocumentModel?.getCurrentDraft();
    
    if (!draft) {
      dom.builderStatus.textContent = 'Status: No draft';
      clearBuilderPhases();
      return;
    }

    dom.builderStatus.textContent = `Status: ${draft.status} • Last saved ${new Date(draft.updatedAt).toLocaleTimeString()}`;
    dom.docTypeSelect.value = draft.type;

    // Update phase contents
    ['stabilize', 'bridge', 'sustain', 'atHome'].forEach(phase => {
      const container = document.getElementById(`phase${phase.charAt(0).toUpperCase() + phase.slice(1)}`);
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
    document.getElementById('alumniParentFocus').checked = draft.alumni.parentFocusGroup;
    document.getElementById('alumniProgramming').checked = draft.alumni.alumniProgramming;
    document.getElementById('alumniNest').checked = draft.alumni.nestAlumni;
  }

  function clearBuilderPhases() {
    ['Stabilize', 'Bridge', 'Sustain', 'AtHome'].forEach(phase => {
      const container = document.getElementById(`phase${phase}`);
      container.innerHTML = '<div class="builder-phase__empty">Drag programs here</div>';
    });
  }

  function switchScenario(scenario) {
    document.querySelectorAll('.builder-pane__tab').forEach(t => {
      t.classList.toggle('builder-pane__tab--active', t.dataset.scenario === scenario);
    });
    window.ccDocumentModel?.setScenario(scenario);
  }

  function handleDocTypeChange() {
    window.ccDocumentModel?.setDocumentType(dom.docTypeSelect.value);
    
    // Show/hide alumni section based on type
    const alumniSection = document.getElementById('alumniSection');
    alumniSection.style.display = dom.docTypeSelect.value === 'aftercare-plan' ? 'block' : 'none';
  }

  function handleAlumniChange() {
    window.ccDocumentModel?.setAlumniService('parentFocusGroup', document.getElementById('alumniParentFocus').checked);
    window.ccDocumentModel?.setAlumniService('alumniProgramming', document.getElementById('alumniProgramming').checked);
    window.ccDocumentModel?.setAlumniService('nestAlumni', document.getElementById('alumniNest').checked);
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

