/**
 * Program Core - Main API exposed as window.ccPrograms
 * Provides filtering, searching, and distance calculations for programs
 * @file program-core.js
 * @requires program-types.js
 * @requires program-normalizer.js
 */

(function() {
  'use strict';

  // ============================================================================
  // PRIVATE STATE
  // ============================================================================

  let _initialized = false;
  let _homeLocation = null;
  let _activeFilters = {};

  // ============================================================================
  // MAIN API
  // ============================================================================

  /**
   * @type {Object} window.ccPrograms - Main programs API
   */
  const ccPrograms = {
    // === DATA ARRAYS ===
    
    /** @type {UiProgram[]} All normalized programs */
    core: [],
    
    /** @type {UiProgram[]} Umbrella parent programs only */
    parents: [],
    
    /** @type {Map<string, UiProgram[]>} Map of parentId → child programs */
    childrenMap: new Map(),
    
    /** @type {boolean} True after init() completes */
    isReady: false,

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    /**
     * Initialize the programs API with raw data
     * Call this after window.programsData is populated
     */
    init() {
      if (_initialized) {
        console.warn('ccPrograms already initialized');
        return;
      }

      const rawData = window.programsData;
      
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        console.error('❌ No programs data available. Ensure programs-loader.js has loaded.');
        return;
      }

      console.log('🚀 Initializing ccPrograms...');

      // Normalize all programs
      this.core = window.ccProgramNormalizer.normalizeAllPrograms(rawData);
      
      // Build parent list
      this.parents = this.core.filter(p => p.isUmbrellaParent);
      
      // Build children map
      this.childrenMap.clear();
      this.core.forEach(p => {
        if (p.parentId) {
          if (!this.childrenMap.has(p.parentId)) {
            this.childrenMap.set(p.parentId, []);
          }
          this.childrenMap.get(p.parentId).push(p);
        }
      });

      // Restore home location from storage
      this._restoreHomeLocation();

      _initialized = true;
      this.isReady = true;

      console.log(`✅ ccPrograms initialized with ${this.core.length} programs`);

      // Dispatch ready event
      window.dispatchEvent(new CustomEvent('ccprograms:loaded', {
        detail: { count: this.core.length }
      }));
    },

    // =========================================================================
    // GETTERS
    // =========================================================================

    /**
     * Get a program by ID
     * @param {string} id - Program ID
     * @returns {UiProgram|null}
     */
    byId(id) {
      return this.core.find(p => p.id === id) || null;
    },

    /**
     * Get children of an umbrella parent
     * @param {string} parentId - Parent program ID
     * @returns {UiProgram[]}
     */
    getChildren(parentId) {
      return this.childrenMap.get(parentId) || [];
    },

    /**
     * Get all standalone programs (not children of umbrellas)
     * @returns {UiProgram[]}
     */
    getStandalone() {
      return this.core.filter(p => !p.isUmbrellaChild && !p.isUmbrellaParent);
    },

    /**
     * Get all programs for display (excludes children that are shown under parents)
     * @param {boolean} includeChildren - Include umbrella children as separate items
     * @returns {UiProgram[]}
     */
    getDisplayList(includeChildren = false) {
      if (includeChildren) {
        return [...this.core];
      }
      // Return parents + standalone, exclude children (they show under parents)
      return this.core.filter(p => !p.isUmbrellaChild);
    },

    /**
     * Get all programs with valid map coordinates (lat/lng)
     * Includes all programs and subprograms that can be placed on a map
     * @returns {UiProgram[]}
     */
    getMappable() {
      return this.core.filter(p => 
        p.lat !== null && 
        p.lng !== null && 
        typeof p.lat === 'number' && 
        typeof p.lng === 'number'
      );
    },

    /**
     * Get count of mappable programs
     * @returns {number}
     */
    getMappableCount() {
      return this.getMappable().length;
    },

    // =========================================================================
    // FILTERING
    // =========================================================================

    /**
     * Filter programs by criteria
     * @param {ProgramFilter} criteria - Filter criteria
     * @returns {UiProgram[]}
     */
    filter(criteria = {}) {
      _activeFilters = { ...criteria };
      
      let results = [...this.core];
      
      // LOC filter
      if (criteria.loc && criteria.loc.length > 0) {
        results = results.filter(p => 
          p.levelOfCare.some(loc => criteria.loc.includes(loc))
        );
      }
      
      // Format filter
      if (criteria.format && criteria.format.length > 0) {
        results = results.filter(p => 
          p.format.some(f => criteria.format.includes(f))
        );
      }
      
      // State filter
      if (criteria.state && criteria.state.length > 0) {
        results = results.filter(p => criteria.state.includes(p.state));
      }
      
      // Age filters
      if (criteria.ageMin !== undefined && criteria.ageMin !== null) {
        results = results.filter(p => 
          p.ageMax === null || p.ageMax >= criteria.ageMin
        );
      }
      if (criteria.ageMax !== undefined && criteria.ageMax !== null) {
        results = results.filter(p => 
          p.ageMin === null || p.ageMin <= criteria.ageMax
        );
      }
      
      // Clinical flags
      if (criteria.flags) {
        if (criteria.flags.lgbtq) {
          results = results.filter(p => p.lgbtqAffirming);
        }
        if (criteria.flags.trans) {
          results = results.filter(p => p.transAffirming);
        }
        if (criteria.flags.asd) {
          results = results.filter(p => p.treatsASD);
        }
        if (criteria.flags.sud) {
          results = results.filter(p => p.treatsSUD);
        }
        if (criteria.flags.highAcuity) {
          results = results.filter(p => p.highAcuityMH);
        }
      }
      
      // Insurance filter
      if (criteria.insurance && criteria.insurance.length > 0) {
        results = results.filter(p => 
          p.insurance.some(ins => 
            criteria.insurance.some(filterIns => 
              ins.toLowerCase().includes(filterIns.toLowerCase())
            )
          )
        );
      }
      
      // Search term
      if (criteria.search && criteria.search.trim()) {
        const term = criteria.search.toLowerCase().trim();
        results = results.filter(p => 
          p.name.toLowerCase().includes(term) ||
          p.summary.toLowerCase().includes(term) ||
          p.tags.some(t => t.toLowerCase().includes(term)) ||
          p.city.toLowerCase().includes(term) ||
          p.state.toLowerCase().includes(term) ||
          (p.brandName && p.brandName.toLowerCase().includes(term))
        );
      }
      
      // Radius filter (requires home location)
      if (criteria.radiusMiles && _homeLocation) {
        results = results.filter(p => 
          p.distanceMiles !== null && p.distanceMiles <= criteria.radiusMiles
        );
      }

      // Dispatch filter event
      window.dispatchEvent(new CustomEvent('ccprograms:filtered', {
        detail: { 
          count: results.length, 
          total: this.core.length,
          criteria 
        }
      }));
      
      // Emit event for onboarding checklist
      if (window.OnboardingEvents) {
        OnboardingEvents.emit('cc:programs:filterApplied', { count: results.length, criteria });
      }
      window.dispatchEvent(new CustomEvent('cc:programs:filterApplied', { detail: { count: results.length, criteria } }));
      console.log('[Programs] Emitted cc:programs:filterApplied to window');

      return results;
    },

    /**
     * Get current active filters
     * @returns {ProgramFilter}
     */
    getActiveFilters() {
      return { ..._activeFilters };
    },

    /**
     * Clear all filters
     */
    clearFilters() {
      _activeFilters = {};
      window.dispatchEvent(new CustomEvent('ccprograms:filtered', {
        detail: { 
          count: this.core.length, 
          total: this.core.length,
          criteria: {} 
        }
      }));
    },

    // =========================================================================
    // SEARCH
    // =========================================================================

    /**
     * Full-text search across programs
     * @param {string} term - Search term
     * @returns {ProgramSearchResult[]}
     */
    search(term) {
      if (!term || !term.trim()) {
        return this.core.map(p => ({ program: p, score: 0, highlights: {} }));
      }

      const searchTerm = term.toLowerCase().trim();
      const results = [];

      this.core.forEach(program => {
        let score = 0;
        const highlights = { name: [], summary: [], tags: [] };

        // Name match (highest weight)
        if (program.name.toLowerCase().includes(searchTerm)) {
          score += 100;
          highlights.name.push(searchTerm);
        }

        // Brand name match
        if (program.brandName && program.brandName.toLowerCase().includes(searchTerm)) {
          score += 80;
        }

        // City/State match
        if (program.city.toLowerCase().includes(searchTerm) ||
            program.state.toLowerCase() === searchTerm) {
          score += 50;
        }

        // Tags match
        program.tags.forEach(tag => {
          if (tag.toLowerCase().includes(searchTerm)) {
            score += 30;
            highlights.tags.push(tag);
          }
        });

        // Summary match
        if (program.summary.toLowerCase().includes(searchTerm)) {
          score += 20;
          highlights.summary.push(searchTerm);
        }

        // Features match
        program.features.forEach(feature => {
          if (feature.toLowerCase().includes(searchTerm)) {
            score += 10;
          }
        });

        // Diagnoses match
        if (program.diagnosesServed) {
          program.diagnosesServed.forEach(dx => {
            if (dx.toLowerCase().includes(searchTerm)) {
              score += 15;
            }
          });
        }

        if (score > 0) {
          results.push({ program, score, highlights });
        }
      });

      // Sort by score descending
      results.sort((a, b) => b.score - a.score);

      return results;
    },

    // =========================================================================
    // DISTANCE
    // =========================================================================

    /**
     * Set home location for distance calculations
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {string} zip - ZIP code
     */
    setHomeLocation(lat, lng, zip) {
      _homeLocation = { lat, lng, zip };
      
      // Calculate distances for all programs
      window.ccProgramNormalizer.updateDistances(this.core, lat, lng);
      
      // Persist to storage
      try {
        localStorage.setItem('cc-programs-home', JSON.stringify(_homeLocation));
      } catch (e) {
        console.warn('Failed to save home location to localStorage', e);
      }

      // Dispatch event
      window.dispatchEvent(new CustomEvent('ccprograms:homeSet', {
        detail: { lat, lng, zip }
      }));
    },

    /**
     * Get current home location
     * @returns {HomeLocation|null}
     */
    getHomeLocation() {
      return _homeLocation ? { ..._homeLocation } : null;
    },

    /**
     * Clear home location
     */
    clearHomeLocation() {
      _homeLocation = null;
      this.core.forEach(p => p.distanceMiles = null);
      
      try {
        localStorage.removeItem('cc-programs-home');
      } catch (e) {
        // Ignore
      }

      window.dispatchEvent(new CustomEvent('ccprograms:homeCleared'));
    },

    /**
     * Restore home location from storage
     * @private
     */
    _restoreHomeLocation() {
      try {
        const saved = localStorage.getItem('cc-programs-home');
        if (saved) {
          const { lat, lng, zip } = JSON.parse(saved);
          if (lat && lng) {
            this.setHomeLocation(lat, lng, zip);
          }
        }
      } catch (e) {
        console.warn('Failed to restore home location', e);
      }
    },

    /**
     * Get programs sorted by distance (closest first)
     * @returns {UiProgram[]}
     */
    sortByDistance() {
      if (!_homeLocation) {
        console.warn('No home location set, cannot sort by distance');
        return [...this.core];
      }

      return [...this.core].sort((a, b) => {
        // Null distances go to end
        if (a.distanceMiles === null && b.distanceMiles === null) return 0;
        if (a.distanceMiles === null) return 1;
        if (b.distanceMiles === null) return -1;
        return a.distanceMiles - b.distanceMiles;
      });
    },

    /**
     * Get programs within a radius
     * @param {number} miles - Radius in miles
     * @returns {UiProgram[]}
     */
    filterByRadius(miles) {
      if (!_homeLocation) {
        console.warn('No home location set, cannot filter by radius');
        return [];
      }

      return this.core.filter(p => 
        p.distanceMiles !== null && p.distanceMiles <= miles
      );
    },

    // =========================================================================
    // UTILITY
    // =========================================================================

    /**
     * Get unique values for a field across all programs
     * @param {string} field - Field name
     * @returns {string[]}
     */
    getUniqueValues(field) {
      const values = new Set();
      
      this.core.forEach(program => {
        const value = program[field];
        if (Array.isArray(value)) {
          value.forEach(v => values.add(v));
        } else if (value !== null && value !== undefined && value !== '') {
          values.add(value);
        }
      });

      return [...values].sort();
    },

    /**
     * Get count by LOC type
     * @returns {Object.<string, number>}
     */
    getCountsByLOC() {
      const counts = {};
      
      this.core.forEach(program => {
        program.levelOfCare.forEach(loc => {
          counts[loc] = (counts[loc] || 0) + 1;
        });
      });

      return counts;
    },

    /**
     * Get count by state
     * @returns {Object.<string, number>}
     */
    getCountsByState() {
      const counts = {};
      
      this.core.forEach(program => {
        if (program.state) {
          counts[program.state] = (counts[program.state] || 0) + 1;
        }
      });

      return counts;
    },

    /**
     * Get programs with coordinates (for map)
     * @returns {UiProgram[]}
     */
    getMappable() {
      return this.core.filter(p => p.lat !== null && p.lng !== null);
    },

    /**
     * Get summary statistics
     * @returns {Object}
     */
    getStats() {
      const mappable = this.getMappable();
      const withImages = this.core.filter(p => p.heroImageUrl || p.logoUrl);
      const lgbtq = this.core.filter(p => p.lgbtqAffirming);
      
      return {
        total: this.core.length,
        umbrellaParents: this.parents.length,
        umbrellaChildren: this.core.filter(p => p.isUmbrellaChild).length,
        standalone: this.core.filter(p => !p.isUmbrellaParent && !p.isUmbrellaChild).length,
        mappable: mappable.length,
        withImages: withImages.length,
        lgbtqAffirming: lgbtq.length,
        countsByLOC: this.getCountsByLOC(),
        countsByState: this.getCountsByState(),
      };
    },
  };

  // ============================================================================
  // AUTO-INITIALIZATION
  // ============================================================================

  // Initialize when programs data is ready
  window.addEventListener('programs-loaded', () => {
    // Small delay to ensure all dependencies are loaded
    setTimeout(() => {
      ccPrograms.init();
    }, 10);
  });

  // Also check if data is already loaded (handles race condition where
  // programs-loader.js runs before this script sets up event listeners)
  if (window.programsData && window.programsData.length > 0) {
    // Dependencies might not be ready yet, wait a bit longer to ensure
    // all module scripts have loaded and app-controller is ready
    setTimeout(() => {
      if (!ccPrograms.isReady) {
        ccPrograms.init();
      }
    }, 150);
  }

  // ============================================================================
  // EXPOSE API
  // ============================================================================

  window.ccPrograms = ccPrograms;

  console.log('✅ Program Core loaded (waiting for data...)');

})();

