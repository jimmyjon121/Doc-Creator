/**
 * Preferences - User preferences management for the Programs & Document Creator module
 * Handles loading, saving, and applying 8 user preference settings
 * @file preferences.js
 */

(function() {
  'use strict';

  // ============================================================================
  // CONSTANTS
  // ============================================================================

  const STORAGE_KEY = 'cc-programs-preferences';

  /**
   * Default preference values
   */
  const DEFAULTS = {
    // View & Layout
    defaultViewMode: 'grid',    // 'grid' | 'rows' | 'compare' | 'map'
    programsPerPage: 24,        // 12 | 24 | 48 | 'all'
    
    // Documents
    autoSaveInterval: 3,        // 1 | 3 | 5 | 0 (never) - minutes
    writeUpLength: 'standard',  // 'concise' | 'standard' | 'detailed'
    
    // Map
    coachHomeZip: '',           // 5-digit ZIP code
    
    // Accessibility
    fontScale: 1,               // 0.8 | 1 | 1.2 | 1.5
    highContrast: false,        // boolean
    reduceMotion: false,        // boolean
  };

  /**
   * Option values for each preference
   */
  const OPTIONS = {
    defaultViewMode: [
      { value: 'grid', label: 'Grid View' },
      { value: 'rows', label: 'Rows View' },
      { value: 'compare', label: 'Compare View' },
      { value: 'map', label: 'Map View' },
    ],
    programsPerPage: [
      { value: 12, label: '12 programs' },
      { value: 24, label: '24 programs' },
      { value: 48, label: '48 programs' },
      { value: 'all', label: 'All programs' },
    ],
    autoSaveInterval: [
      { value: 1, label: '1 minute' },
      { value: 3, label: '3 minutes' },
      { value: 5, label: '5 minutes' },
      { value: 0, label: 'Never' },
    ],
    writeUpLength: [
      { value: 'concise', label: 'Concise' },
      { value: 'standard', label: 'Standard' },
      { value: 'detailed', label: 'Detailed' },
    ],
    fontScale: [
      { value: 0.8, label: '80%' },
      { value: 1, label: '100%' },
      { value: 1.2, label: '120%' },
      { value: 1.5, label: '150%' },
    ],
  };

  /**
   * Preference categories for UI organization
   */
  const CATEGORIES = [
    {
      id: 'view',
      name: 'View & Layout',
      settings: ['defaultViewMode', 'programsPerPage'],
    },
    {
      id: 'documents',
      name: 'Documents',
      settings: ['autoSaveInterval', 'writeUpLength'],
    },
    {
      id: 'map',
      name: 'Map Settings',
      settings: ['coachHomeZip'],
    },
    {
      id: 'accessibility',
      name: 'Accessibility',
      settings: ['fontScale', 'highContrast', 'reduceMotion'],
    },
  ];

  /**
   * Setting metadata for UI rendering
   */
  const SETTING_META = {
    defaultViewMode: {
      label: 'Default View Mode',
      description: 'The view to show when opening the module',
      type: 'select',
    },
    programsPerPage: {
      label: 'Programs Per Page',
      description: 'Number of programs to display per page',
      type: 'select',
    },
    autoSaveInterval: {
      label: 'Auto-Save Interval',
      description: 'How often to automatically save document drafts',
      type: 'select',
    },
    writeUpLength: {
      label: 'Write-Up Length',
      description: 'Default detail level for program write-ups',
      type: 'select',
    },
    coachHomeZip: {
      label: 'Your Home ZIP',
      description: 'Used for distance calculations when no client is selected',
      type: 'text',
      placeholder: '12345',
      pattern: '^[0-9]{5}$',
    },
    fontScale: {
      label: 'Font Scale',
      description: 'Adjust text size throughout the module',
      type: 'select',
    },
    highContrast: {
      label: 'High Contrast',
      description: 'Increase contrast for better visibility',
      type: 'toggle',
    },
    reduceMotion: {
      label: 'Reduce Motion',
      description: 'Disable animations and transitions',
      type: 'toggle',
    },
  };

  // ============================================================================
  // STATE
  // ============================================================================

  let _preferences = null;
  let _initialized = false;

  // ============================================================================
  // CORE FUNCTIONS
  // ============================================================================

  /**
   * Initialize preferences
   * Loads from localStorage or uses defaults
   */
  function init() {
    if (_initialized) return;

    _preferences = load();
    apply();
    _initialized = true;

    console.log('✅ Preferences initialized');
  }

  /**
   * Load preferences from localStorage
   * @returns {Object} Preferences object
   */
  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Merge with defaults to handle new settings
        return { ...DEFAULTS, ...parsed };
      }
    } catch (e) {
      console.warn('Failed to load preferences:', e);
    }
    return { ...DEFAULTS };
  }

  /**
   * Save preferences to localStorage
   */
  function save() {
    if (!_preferences) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(_preferences));
      
      window.dispatchEvent(new CustomEvent('ccprefs:saved', {
        detail: { preferences: _preferences }
      }));
    } catch (e) {
      console.warn('Failed to save preferences:', e);
    }
  }

  /**
   * Get all preferences
   * @returns {Object} Copy of preferences object
   */
  function get() {
    if (!_preferences) {
      _preferences = load();
    }
    return { ..._preferences };
  }

  /**
   * Get a single preference value
   * @param {string} key - Preference key
   * @returns {*} Preference value
   */
  function getValue(key) {
    if (!_preferences) {
      _preferences = load();
    }
    return _preferences[key] ?? DEFAULTS[key];
  }

  /**
   * Set a single preference value
   * @param {string} key - Preference key
   * @param {*} value - New value
   */
  function setValue(key, value) {
    if (!_preferences) {
      _preferences = load();
    }

    // Validate
    if (!DEFAULTS.hasOwnProperty(key)) {
      console.warn(`Unknown preference key: ${key}`);
      return;
    }

    _preferences[key] = value;
    save();
    apply();

    window.dispatchEvent(new CustomEvent('ccprefs:changed', {
      detail: { key, value }
    }));
  }

  /**
   * Set multiple preferences at once
   * @param {Object} values - Object with key-value pairs
   */
  function setValues(values) {
    if (!_preferences) {
      _preferences = load();
    }

    Object.entries(values).forEach(([key, value]) => {
      if (DEFAULTS.hasOwnProperty(key)) {
        _preferences[key] = value;
      }
    });

    save();
    apply();

    window.dispatchEvent(new CustomEvent('ccprefs:changed', {
      detail: { values }
    }));
  }

  /**
   * Reset all preferences to defaults
   */
  function reset() {
    _preferences = { ...DEFAULTS };
    save();
    apply();

    window.dispatchEvent(new CustomEvent('ccprefs:reset'));
  }

  /**
   * Apply preferences to the UI
   */
  function apply() {
    if (!_preferences) return;

    const root = document.documentElement;

    // Font scale
    if (_preferences.fontScale && _preferences.fontScale !== 1) {
      root.style.setProperty('--font-scale', _preferences.fontScale);
      root.style.fontSize = `${_preferences.fontScale * 100}%`;
    } else {
      root.style.removeProperty('--font-scale');
      root.style.fontSize = '';
    }

    // High contrast
    if (_preferences.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Reduce motion
    if (_preferences.reduceMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Inject CSS for preferences
    _injectPreferenceStyles();
  }

  /**
   * Inject CSS styles for preferences
   */
  function _injectPreferenceStyles() {
    const styleId = 'cc-preference-styles';
    let style = document.getElementById(styleId);
    
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      /* High Contrast Mode */
      .high-contrast {
        --navy-900: #000000;
        --navy-800: #0a0a0a;
        --neutral-50: #ffffff;
        --neutral-100: #f5f5f5;
        --neutral-200: #e0e0e0;
        --neutral-400: #666666;
        --neutral-500: #444444;
        --accent-500: #4444ff;
      }
      
      .high-contrast .program-card,
      .high-contrast .umbrella-card,
      .high-contrast .modal-backdrop > div {
        border: 2px solid #000;
      }
      
      .high-contrast .btn {
        border: 2px solid currentColor;
      }
      
      /* Reduce Motion */
      .reduce-motion *,
      .reduce-motion *::before,
      .reduce-motion *::after {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
      }
      
      .reduce-motion .skeleton {
        animation: none;
        background: var(--neutral-200);
      }
    `;
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  /**
   * Get options for a select preference
   * @param {string} key - Preference key
   * @returns {Array} Options array
   */
  function getOptions(key) {
    return OPTIONS[key] || [];
  }

  /**
   * Get metadata for a setting
   * @param {string} key - Preference key
   * @returns {Object} Setting metadata
   */
  function getMeta(key) {
    return SETTING_META[key] || { label: key, type: 'text' };
  }

  /**
   * Get all categories with their settings
   * @returns {Array} Categories with settings
   */
  function getCategories() {
    return CATEGORIES.map(cat => ({
      ...cat,
      settings: cat.settings.map(key => ({
        key,
        value: getValue(key),
        ...getMeta(key),
        options: getOptions(key),
      })),
    }));
  }

  /**
   * Validate a preference value
   * @param {string} key - Preference key
   * @param {*} value - Value to validate
   * @returns {boolean} True if valid
   */
  function validate(key, value) {
    const meta = SETTING_META[key];
    if (!meta) return false;

    switch (meta.type) {
      case 'select':
        const options = OPTIONS[key] || [];
        return options.some(opt => opt.value === value);
      
      case 'toggle':
        return typeof value === 'boolean';
      
      case 'text':
        if (meta.pattern) {
          const regex = new RegExp(meta.pattern);
          return regex.test(value) || value === '';
        }
        return typeof value === 'string';
      
      default:
        return true;
    }
  }

  // ============================================================================
  // ZIP CODE GEOCODING
  // ============================================================================

  /**
   * Simple ZIP code to lat/lng lookup (US only)
   * This is a simplified version - in production, use a proper geocoding service
   * @param {string} zip - 5-digit ZIP code
   * @returns {Promise<{lat: number, lng: number}|null>}
   */
  async function geocodeZip(zip) {
    if (!zip || !/^[0-9]{5}$/.test(zip)) {
      return null;
    }

    // For now, use a simple lookup table for common ZIP codes
    // In production, this would call an API
    const zipCoords = {
      // Florida
      '33101': { lat: 25.7617, lng: -80.1918 }, // Miami
      '32801': { lat: 28.5383, lng: -81.3792 }, // Orlando
      '33602': { lat: 27.9506, lng: -82.4572 }, // Tampa
      '32301': { lat: 30.4383, lng: -84.2807 }, // Tallahassee
      '32202': { lat: 30.3322, lng: -81.6557 }, // Jacksonville
      // Georgia
      '30301': { lat: 33.7490, lng: -84.3880 }, // Atlanta
      // Texas
      '75201': { lat: 32.7767, lng: -96.7970 }, // Dallas
      '77001': { lat: 29.7604, lng: -95.3698 }, // Houston
      // California
      '90001': { lat: 33.9425, lng: -118.2551 }, // Los Angeles
      '94102': { lat: 37.7749, lng: -122.4194 }, // San Francisco
      // New York
      '10001': { lat: 40.7484, lng: -73.9967 }, // New York
      // Default US center
      '_default': { lat: 39.5, lng: -98.35 },
    };

    // Try exact match first
    if (zipCoords[zip]) {
      return zipCoords[zip];
    }

    // Try to estimate based on first 3 digits (ZIP3)
    const zip3 = zip.substring(0, 3);
    const zip3Match = Object.keys(zipCoords).find(z => z.startsWith(zip3));
    if (zip3Match) {
      return zipCoords[zip3Match];
    }

    // Fallback: In production, would call geocoding API
    console.log(`ZIP ${zip} not in lookup table, using default`);
    return zipCoords['_default'];
  }

  /**
   * Set coach home ZIP and update map location
   * @param {string} zip - 5-digit ZIP code
   */
  async function setCoachHomeZip(zip) {
    setValue('coachHomeZip', zip);

    if (zip && /^[0-9]{5}$/.test(zip)) {
      const coords = await geocodeZip(zip);
      if (coords && window.ccPrograms) {
        window.ccPrograms.setHomeLocation(coords.lat, coords.lng, zip);
      }
    }
  }

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already ready
    setTimeout(init, 0);
  }

  // ============================================================================
  // EXPOSE API
  // ============================================================================

  window.ccPreferences = {
    // Core
    init,
    load,
    save,
    get,
    getValue,
    setValue,
    setValues,
    reset,
    apply,

    // UI Helpers
    getOptions,
    getMeta,
    getCategories,
    validate,

    // ZIP/Location
    geocodeZip,
    setCoachHomeZip,

    // Constants
    DEFAULTS,
    OPTIONS,
    CATEGORIES,
    SETTING_META,
  };

  console.log('✅ Preferences loaded');

})();

