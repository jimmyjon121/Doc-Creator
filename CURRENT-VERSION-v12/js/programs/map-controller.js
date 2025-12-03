/**
 * Map Controller - Leaflet map integration for program visualization
 * Handles map rendering, markers, clustering, and radius filtering
 * @file map-controller.js
 * @requires program-types.js
 * @requires program-core.js
 * @requires map-icons.js
 * @requires Leaflet.js
 * @requires Leaflet.markercluster (optional)
 */

(function() {
  'use strict';

  // ============================================================================
  // PRIVATE STATE
  // ============================================================================

  let _map = null;
  let _markers = [];
  let _markerLayer = null;
  let _clusterGroup = null;
  let _homeMarker = null;
  let _radiusCircle = null;
  let _selectedMarkerId = null;
  let _containerId = 'programsMap';
  let _initialized = false;

  // Map settings
  const DEFAULT_CENTER = [39.5, -98.35]; // US center
  const DEFAULT_ZOOM = 4;
  const MIN_ZOOM = 3;
  const MAX_ZOOM = 18;

  // Tile layers
  const TILE_LAYERS = {
    dark: {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
    light: {
      url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  };

  // Current state
  let _currentTileLayer = 'dark';
  let _tileLayer = null;
  let _locVisibility = {};

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initialize the map
   * @param {string} containerId - DOM element ID for map container
   * @param {Object} options - Map options
   */
  function init(containerId = 'programsMap', options = {}) {
    if (_initialized && _map) {
      console.warn('Map already initialized');
      return _map;
    }

    _containerId = containerId;
    const container = document.getElementById(containerId);
    
    if (!container) {
      console.error(`Map container #${containerId} not found`);
      return null;
    }

    // Check for Leaflet
    if (typeof L === 'undefined') {
      console.error('Leaflet not loaded');
      return null;
    }

    console.log('🗺️ Initializing map...');

    // Restore saved state
    const savedState = _loadMapState();
    
    // Create map
    _map = L.map(containerId, {
      center: savedState.center || options.center || DEFAULT_CENTER,
      zoom: savedState.zoom || options.zoom || DEFAULT_ZOOM,
      minZoom: MIN_ZOOM,
      maxZoom: MAX_ZOOM,
      zoomControl: false, // We'll add custom controls
      attributionControl: true,
    });

    // Add tile layer
    _currentTileLayer = savedState.tileLayer || options.tileLayer || 'dark';
    _setTileLayer(_currentTileLayer);

    // Add zoom control (top-right)
    L.control.zoom({ position: 'topright' }).addTo(_map);

    // Initialize marker layer
    _initMarkerLayer();

    // Restore LOC visibility
    _locVisibility = savedState.locVisibility || {};
    const { LOC_TYPES } = window.ccProgramTypes;
    Object.values(LOC_TYPES).forEach(loc => {
      if (_locVisibility[loc] === undefined) {
        _locVisibility[loc] = true;
      }
    });

    // Save state on map events
    _map.on('moveend', _saveMapState);
    _map.on('zoomend', _saveMapState);
    _map.on('click', () => {
      deselectAll();
    });

    // Inject marker styles
    _injectStyles();

    _initialized = true;
    console.log('✅ Map initialized');

    return _map;
  }

  /**
   * Set the tile layer
   * @param {string} layerName - 'dark' or 'light'
   */
  function _setTileLayer(layerName) {
    // Guard: if map not initialized, just store preference
    if (!_map) {
      _currentTileLayer = layerName;
      return;
    }
    
    const layer = TILE_LAYERS[layerName] || TILE_LAYERS.dark;
    
    if (_tileLayer) {
      _map.removeLayer(_tileLayer);
    }
    
    _tileLayer = L.tileLayer(layer.url, {
      attribution: layer.attribution,
      maxZoom: MAX_ZOOM,
    });
    
    _tileLayer.addTo(_map);
    _currentTileLayer = layerName;
  }

  /**
   * Initialize marker layer (with or without clustering)
   */
  function _initMarkerLayer() {
    // Check if markercluster is available
    if (typeof L.markerClusterGroup === 'function') {
      _clusterGroup = L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: _createClusterIcon,
      });
      _map.addLayer(_clusterGroup);
      _markerLayer = _clusterGroup;
    } else {
      // Fallback to regular layer group
      _markerLayer = L.layerGroup();
      _map.addLayer(_markerLayer);
    }
  }

  /**
   * Create cluster icon
   * @param {L.MarkerCluster} cluster
   * @returns {L.DivIcon}
   */
  function _createClusterIcon(cluster) {
    const childMarkers = cluster.getAllChildMarkers();
    const programs = childMarkers.map(m => m.options.program).filter(Boolean);
    const count = programs.length || cluster.getChildCount();
    
    return window.ccMapIcons.getClusterIcon(programs, count);
  }

  /**
   * Inject CSS styles for markers
   */
  function _injectStyles() {
    const styleId = 'cc-map-marker-styles';
    if (document.getElementById(styleId)) return;
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = window.ccMapIcons.getMarkerStyles();
    document.head.appendChild(style);
  }

  // ============================================================================
  // MARKERS
  // ============================================================================

  /**
   * Render markers for programs
   * @param {UiProgram[]} programs - Programs to render
   */
  function renderMarkers(programs = null) {
    if (!_map || !_markerLayer) {
      console.warn('Map not initialized');
      return;
    }

    // Clear existing markers
    _clearMarkers();

    // Get programs with coordinates
    const data = programs || window.ccPrograms?.getMappable() || [];
    
    // Filter by LOC visibility
    const filteredData = data.filter(p => {
      const loc = p.primaryLOC || 'Network';
      return _locVisibility[loc] !== false;
    });

    console.log(`🗺️ Rendering ${filteredData.length} markers...`);

    // Create markers
    filteredData.forEach(program => {
      if (program.lat === null || program.lng === null) return;
      
      const isSelected = program.id === _selectedMarkerId;
      const icon = window.ccMapIcons.getIcon(program, { selected: isSelected });
      
      const marker = L.marker([program.lat, program.lng], {
        icon,
        program, // Store program reference
        programId: program.id,
      });

      // Tooltip
      marker.bindTooltip(_createTooltipContent(program), {
        direction: 'top',
        offset: [0, -20],
        className: 'cc-map-tooltip',
      });

      // Click handler
      marker.on('click', () => _onMarkerClick(program, marker));
      
      _markers.push({ marker, program });
      _markerLayer.addLayer(marker);
    });

    // Dispatch event
    window.dispatchEvent(new CustomEvent('ccmap:markersRendered', {
      detail: { count: filteredData.length }
    }));
  }

  /**
   * Create tooltip HTML content
   * @param {UiProgram} program
   * @returns {string}
   */
  function _createTooltipContent(program) {
    const locColor = window.ccMapIcons.colors[program.primaryLOC] || '#6E7BFF';
    const distance = program.distanceMiles !== null 
      ? `<span style="color: #888; margin-left: 8px;">${program.distanceMiles} mi</span>` 
      : '';
    
    return `
      <div style="min-width: 150px;">
        <div style="font-weight: 600; margin-bottom: 4px;">${program.name}</div>
        <div style="font-size: 12px; color: #666; margin-bottom: 4px;">
          ${program.city}, ${program.state}${distance}
        </div>
        <span style="
          display: inline-block;
          background: ${locColor};
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          text-transform: uppercase;
        ">${program.primaryLOC}</span>
      </div>
    `;
  }

  /**
   * Handle marker click
   * @param {UiProgram} program
   * @param {L.Marker} marker
   */
  function _onMarkerClick(program, marker) {
    // Update selection
    _selectedMarkerId = program.id;
    
    // Re-render to update selected state
    _updateMarkerSelection(program.id);

    // Emit event for onboarding checklist
    if (window.OnboardingEvents) {
      OnboardingEvents.emit('cc:map:markerClicked', { programId: program.id, programName: program.name });
    }
    window.dispatchEvent(new CustomEvent('cc:map:markerClicked', { detail: { programId: program.id, programName: program.name } }));
    console.log('[Map] Emitted cc:map:markerClicked to window');

    // Dispatch event for UI to show profile modal
    window.dispatchEvent(new CustomEvent('ccmap:programSelected', {
      detail: { program, marker }
    }));
  }

  /**
   * Update marker selection state
   * @param {string} selectedId
   */
  function _updateMarkerSelection(selectedId) {
    _markers.forEach(({ marker, program }) => {
      const isSelected = program.id === selectedId;
      const icon = window.ccMapIcons.getIcon(program, { selected: isSelected });
      marker.setIcon(icon);
    });
  }

  /**
   * Clear all markers
   */
  function _clearMarkers() {
    if (_markerLayer) {
      _markerLayer.clearLayers();
    }
    _markers = [];
  }

  /**
   * Select a program and pan to it
   * @param {string} programId
   */
  function selectProgram(programId) {
    const found = _markers.find(m => m.program.id === programId);
    if (!found) return;

    const { marker, program } = found;
    
    // Update selection
    _selectedMarkerId = programId;
    _updateMarkerSelection(programId);
    
    // Pan to marker
    _map.flyTo([program.lat, program.lng], Math.max(_map.getZoom(), 10), {
      duration: 0.5
    });

    // Open tooltip
    marker.openTooltip();
  }

  /**
   * Deselect all programs
   */
  function deselectAll() {
    _selectedMarkerId = null;
    _updateMarkerSelection(null);
    window.dispatchEvent(new CustomEvent('ccmap:programDeselected'));
  }

  // ============================================================================
  // LOC VISIBILITY
  // ============================================================================

  /**
   * Toggle visibility of a LOC type
   * @param {string} loc - Level of Care type
   * @param {boolean} visible
   */
  function setLOCVisibility(loc, visible) {
    _locVisibility[loc] = visible;
    renderMarkers(); // Re-render with new visibility
    _saveMapState();
  }

  /**
   * Get LOC visibility state
   * @returns {Object.<string, boolean>}
   */
  function getLOCVisibility() {
    return { ..._locVisibility };
  }

  /**
   * Show all LOC types
   */
  function showAllLOC() {
    Object.keys(_locVisibility).forEach(loc => {
      _locVisibility[loc] = true;
    });
    renderMarkers();
    _saveMapState();
  }

  /**
   * Hide all LOC types
   */
  function hideAllLOC() {
    Object.keys(_locVisibility).forEach(loc => {
      _locVisibility[loc] = false;
    });
    renderMarkers();
    _saveMapState();
  }

  // ============================================================================
  // HOME LOCATION & RADIUS
  // ============================================================================

  /**
   * Show home marker and optional radius circle
   * @param {number} lat
   * @param {number} lng
   * @param {number} radiusMiles - Optional radius in miles
   */
  function showHomeLocation(lat, lng, radiusMiles = null) {
    // Remove existing
    if (_homeMarker) {
      _map.removeLayer(_homeMarker);
    }
    if (_radiusCircle) {
      _map.removeLayer(_radiusCircle);
    }

    // Add home marker
    _homeMarker = L.marker([lat, lng], {
      icon: window.ccMapIcons.getHomeIcon(),
      zIndexOffset: 1000, // Keep on top
    });
    _homeMarker.addTo(_map);
    _homeMarker.bindTooltip('Client Location', {
      direction: 'top',
      offset: [0, -20],
    });

    // Add radius circle if specified
    if (radiusMiles && radiusMiles > 0) {
      showRadiusCircle(lat, lng, radiusMiles);
    }
  }

  /**
   * Show radius circle
   * @param {number} lat
   * @param {number} lng
   * @param {number} radiusMiles
   */
  function showRadiusCircle(lat, lng, radiusMiles) {
    if (_radiusCircle) {
      _map.removeLayer(_radiusCircle);
    }

    const radiusMeters = radiusMiles * 1609.34; // Miles to meters
    
    _radiusCircle = L.circle([lat, lng], {
      radius: radiusMeters,
      color: '#6E7BFF',
      weight: 2,
      fillColor: '#6E7BFF',
      fillOpacity: 0.1,
      dashArray: '5, 5',
    });
    
    _radiusCircle.addTo(_map);
  }

  /**
   * Clear home location and radius
   */
  function clearHomeLocation() {
    if (_homeMarker) {
      _map.removeLayer(_homeMarker);
      _homeMarker = null;
    }
    if (_radiusCircle) {
      _map.removeLayer(_radiusCircle);
      _radiusCircle = null;
    }
  }

  /**
   * Center map on home location
   */
  function centerOnHome() {
    const home = window.ccPrograms?.getHomeLocation();
    if (home && home.lat && home.lng) {
      _map.flyTo([home.lat, home.lng], 8, { duration: 0.5 });
    }
  }

  // ============================================================================
  // CONTROLS
  // ============================================================================

  /**
   * Toggle tile layer
   * @returns {string} Current layer name
   */
  function toggleTileLayer() {
    // Guard: if map not initialized, just return current layer preference
    if (!_map) {
      console.warn('[MapController] Map not initialized, skipping tile layer toggle');
      return _currentTileLayer;
    }
    const newLayer = _currentTileLayer === 'dark' ? 'light' : 'dark';
    _setTileLayer(newLayer);
    _saveMapState();
    return newLayer;
  }

  /**
   * Get current tile layer
   * @returns {string}
   */
  function getTileLayer() {
    return _currentTileLayer;
  }

  /**
   * Reset map to default view
   */
  function resetView() {
    _map.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 0.5 });
  }

  /**
   * Fit map to show all visible markers
   */
  function fitToMarkers() {
    if (_markers.length === 0) return;

    const bounds = L.latLngBounds(
      _markers
        .filter(m => _locVisibility[m.program.primaryLOC] !== false)
        .map(m => [m.program.lat, m.program.lng])
    );

    if (bounds.isValid()) {
      _map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  /**
   * Enter fullscreen mode
   */
  function enterFullscreen() {
    const container = document.getElementById(_containerId);
    if (container && container.requestFullscreen) {
      container.requestFullscreen();
    }
  }

  /**
   * Get map instance
   * @returns {L.Map|null}
   */
  function getMap() {
    return _map;
  }

  /**
   * Check if map is initialized
   * @returns {boolean}
   */
  function isInitialized() {
    return _initialized && _map !== null;
  }

  // ============================================================================
  // STATE PERSISTENCE
  // ============================================================================

  /**
   * Save map state to localStorage
   */
  function _saveMapState() {
    if (!_map) return;

    const state = {
      zoom: _map.getZoom(),
      center: _map.getCenter(),
      tileLayer: _currentTileLayer,
      locVisibility: _locVisibility,
    };

    try {
      localStorage.setItem('cc-map-state', JSON.stringify(state));
    } catch (e) {
      // Ignore quota errors
    }
  }

  /**
   * Load map state from localStorage
   * @returns {Object}
   */
  function _loadMapState() {
    try {
      const saved = localStorage.getItem('cc-map-state');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore parse errors
    }
    return {};
  }

  // ============================================================================
  // STATISTICS
  // ============================================================================

  /**
   * Get visible marker counts by LOC
   * @returns {Object.<string, number>}
   */
  function getVisibleCountsByLOC() {
    const counts = {};
    
    _markers.forEach(({ program }) => {
      const loc = program.primaryLOC || 'Network';
      if (_locVisibility[loc] !== false) {
        counts[loc] = (counts[loc] || 0) + 1;
      }
    });

    return counts;
  }

  /**
   * Get total visible markers
   * @returns {number}
   */
  function getVisibleCount() {
    return _markers.filter(m => _locVisibility[m.program.primaryLOC] !== false).length;
  }

  // ============================================================================
  // CLEANUP
  // ============================================================================

  /**
   * Destroy the map
   */
  function destroy() {
    if (_map) {
      _clearMarkers();
      _map.remove();
      _map = null;
    }
    
    _markers = [];
    _markerLayer = null;
    _clusterGroup = null;
    _homeMarker = null;
    _radiusCircle = null;
    _initialized = false;
  }

  // ============================================================================
  // EXPOSE API
  // ============================================================================

  window.ccMapController = {
    // Initialization
    init,
    destroy,
    isInitialized,
    getMap,

    // Markers
    renderMarkers,
    selectProgram,
    deselectAll,

    // LOC Visibility
    setLOCVisibility,
    getLOCVisibility,
    showAllLOC,
    hideAllLOC,

    // Home & Radius
    showHomeLocation,
    showRadiusCircle,
    clearHomeLocation,
    centerOnHome,

    // Controls
    toggleTileLayer,
    getTileLayer,
    resetView,
    fitToMarkers,
    enterFullscreen,

    // Stats
    getVisibleCountsByLOC,
    getVisibleCount,

    // Constants
    TILE_LAYERS,
    DEFAULT_CENTER,
    DEFAULT_ZOOM,
  };

  console.log('✅ Map Controller loaded');

})();

