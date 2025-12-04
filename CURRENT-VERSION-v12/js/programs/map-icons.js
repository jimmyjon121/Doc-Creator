/**
 * Map Icons - SVG icon system for Leaflet markers
 * Provides LOC-specific icons with LGBTQ+ and Trans-affirming visual indicators
 * @file map-icons.js
 * @requires program-types.js
 */

(function() {
  'use strict';

  // ============================================================================
  // ICON COLORS
  // ============================================================================

  /**
   * LOC color palette matching the design system
   */
  const colors = {
    'RTC': '#7C3AED',           // Violet
    'TBS': '#2563EB',           // Blue
    'Wilderness': '#059669',    // Emerald
    'PHP': '#DC2626',           // Red
    'IOP': '#EA580C',           // Orange
    'OP': '#0891B2',            // Cyan
    'Sober Living': '#7C2D12',  // Amber/Brown
    'Virtual': '#64748B',       // Slate
    'Network': '#6E7BFF',       // Accent blue
  };

  /**
   * LOC emoji map - intentionally chosen for instant recognition
   * 
   * RTC = 24/7 live-in treatment FACILITY (not a cozy home)
   * TBS = Therapeutic Boarding SCHOOL (academics + therapy)
   * Wilderness = Outdoor nature-based therapy
   * PHP = Day program AT a hospital (most intensive outpatient)
   * IOP = Structured sessions 3+ hrs, 3+ days/week
   * OP = Regular weekly talk therapy/counseling
   * Sober Living = Transitional housing (their actual home now)
   * Virtual = Online/telehealth programs
   * Network = Umbrella org or corporate parent
   */
  const LOC_EMOJI = {
    'RTC': '🏨',            // Residential Treatment = live-in FACILITY (hotel-like)
    'TBS': '🎓',            // Therapeutic Boarding SCHOOL
    'Wilderness': '🏕️',     // Wilderness = outdoor/camping
    'PHP': '🏥',            // Partial Hospitalization = hospital-based
    'IOP': '📅',            // Intensive Outpatient = scheduled sessions
    'OP': '🗣️',             // Outpatient = talk therapy/counseling
    'Sober Living': '🏡',   // Sober Living = their actual HOME now
    'Virtual': '💻',        // Virtual = online/computer
    'Network': '🏢',        // Network = organization/corporate
  };

  // Rainbow colors for LGBTQ+ indicator
  const rainbowColors = ['#E40303', '#FF8C00', '#FFED00', '#008026', '#24408E', '#732982'];
  
  // Trans flag colors
  const transColors = {
    pink: '#F5A9B8',
    blue: '#5BCEFA',
    white: '#FFFFFF'
  };

  // ============================================================================
  // SVG PATHS
  // ============================================================================

  /**
   * SVG path data for each LOC icon
   * All paths designed for 24x24 viewBox
   */
  const iconPaths = {
    // House with heart (RTC)
    'RTC': `
      <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 13.5c-1.5-1.5-3-1-3 .5 0 1 1.5 2 3 3 1.5-1 3-2 3-3 0-1.5-1.5-2-3-.5z" fill="currentColor" stroke="none"/>
    `,
    
    // Graduation cap (TBS)
    'TBS': `
      <path d="M12 3L1 9l11 6 11-6-11-6z" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <path d="M5 11v5c0 2 3 3 7 3s7-1 7-3v-5" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M21 9v6" stroke="currentColor" stroke-width="1.5"/>
    `,
    
    // Pine tree (Wilderness)
    'Wilderness': `
      <path d="M12 2L6 10h3L5 16h4L6 22h12l-3-6h4l-4-6h3L12 2z" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <rect x="10" y="18" width="4" height="4" fill="currentColor" stroke="none"/>
    `,
    
    // Hospital/Medical cross (PHP)
    'PHP': `
      <rect x="3" y="3" width="18" height="18" rx="2" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 7v10M7 12h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    `,
    
    // Calendar with clock (IOP)
    'IOP': `
      <rect x="3" y="4" width="18" height="17" rx="2" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <path d="M3 9h18" stroke="currentColor" stroke-width="1.5"/>
      <path d="M7 2v4M17 2v4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="12" cy="15" r="3" fill="none" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 14v2l1 1" stroke="currentColor" stroke-width="1" stroke-linecap="round"/>
    `,
    
    // Chat bubbles (OP)
    'OP': `
      <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="8" cy="12" r="1" fill="currentColor"/>
      <circle cx="12" cy="12" r="1" fill="currentColor"/>
      <circle cx="16" cy="12" r="1" fill="currentColor"/>
    `,
    
    // Key (Sober Living)
    'Sober Living': `
      <circle cx="8" cy="8" r="5" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <path d="M11.3 11.3L21 21" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M17 17l2 2M15 19l2 2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <circle cx="8" cy="8" r="2" fill="none" stroke="currentColor" stroke-width="1.5"/>
    `,
    
    // Laptop (Virtual)
    'Virtual': `
      <rect x="3" y="4" width="18" height="12" rx="2" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <path d="M2 20h20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      <path d="M7 16l-1 4M17 16l1 4" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="10" r="2" fill="currentColor"/>
      <path d="M9 13h6" stroke="currentColor" stroke-width="1"/>
    `,
    
    // Connected nodes (Network/Umbrella)
    'Network': `
      <circle cx="12" cy="5" r="3" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="5" cy="17" r="3" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="19" cy="17" r="3" fill="white" stroke="currentColor" stroke-width="1.5"/>
      <path d="M12 8v4M9 14l-2 2M15 14l2 2" stroke="currentColor" stroke-width="1.5"/>
      <circle cx="12" cy="12" r="2" fill="currentColor"/>
    `,
  };

  // ============================================================================
  // SVG GENERATORS
  // ============================================================================

  /**
   * Generate rainbow ring SVG for LGBTQ+ affirming programs
   * @param {number} size - Icon size
   * @returns {string} SVG string
   */
  function generateRainbowRing(size) {
    const strokeWidth = 3;
    const radius = (size / 2) - (strokeWidth / 2);
    const circumference = 2 * Math.PI * radius;
    const segmentLength = circumference / 6;
    
    let paths = '';
    rainbowColors.forEach((color, i) => {
      const offset = i * segmentLength;
      paths += `
        <circle 
          cx="${size/2}" cy="${size/2}" r="${radius}" 
          fill="none" 
          stroke="${color}" 
          stroke-width="${strokeWidth}"
          stroke-dasharray="${segmentLength} ${circumference - segmentLength}"
          stroke-dashoffset="${-offset}"
          transform="rotate(-90 ${size/2} ${size/2})"
        />
      `;
    });
    return paths;
  }

  /**
   * Generate trans flag accent SVG
   * @param {number} size - Icon size
   * @returns {string} SVG string
   */
  function generateTransAccent(size) {
    return `
      <g transform="translate(${size - 10}, 0)">
        <rect x="0" y="0" width="10" height="2" fill="${transColors.pink}" rx="1"/>
        <rect x="0" y="2" width="10" height="2" fill="${transColors.blue}" rx="1"/>
      </g>
    `;
  }

  /**
   * Generate the main SVG icon
   * @param {string} loc - Level of Care type
   * @param {Object} options - Icon options
   * @returns {string} SVG string
   */
  function getSvg(loc, options = {}) {
    const {
      size = 32,
      lgbtq = false,
      trans = false,
      selected = false,
      showShadow = true,
    } = options;

    const color = colors[loc] || colors.Network;
    const emoji = LOC_EMOJI[loc] || LOC_EMOJI.Network || '🏥';

    let svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size + 4}" viewBox="0 0 ${size} ${size + 4}">
        <defs>
          <filter id="pin-shadow-${loc}" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" flood-color="#000" flood-opacity="0.2"/>
          </filter>
        </defs>
    `;

    // Clean solid circle with subtle drop shadow
    svg += `
      <circle 
        cx="${size/2}" cy="${size/2}" r="${(size/2) - 3}" 
        fill="${color}" 
        stroke="white" 
        stroke-width="2.5"
        ${showShadow ? `filter="url(#pin-shadow-${loc})"` : ''}
      />
    `;

    // Emoji content in the center
    svg += `
      <text 
        x="${size/2}" 
        y="${size/2}" 
        text-anchor="middle" 
        dominant-baseline="central"
        font-size="${size * 0.55}px"
        style="font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif;"
      >${emoji}</text>
    `;

    // Selected state pulse ring
    if (selected) {
      svg += `
        <circle 
          cx="${size/2}" cy="${size/2}" r="${(size/2) - 2}" 
          fill="none" 
          stroke="${color}" 
          stroke-width="2"
          opacity="0.5"
        >
          <animate attributeName="r" values="${(size/2) - 2};${(size/2) + 4};${(size/2) - 2}" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      `;
    }

    svg += '</svg>';
    return svg;
  }

  // ============================================================================
  // LEAFLET INTEGRATION
  // ============================================================================

  /**
   * Get a Leaflet divIcon for a program
   * @param {UiProgram} program - Program object
   * @param {Object} options - Icon options
   * @returns {L.DivIcon} Leaflet divIcon
   */
  function getIcon(program, options = {}) {
    const {
      selected = false,
      size = selected ? 40 : 32,
    } = options;

    const loc = program.primaryLOC || 'Network';
    const lgbtq = program.lgbtqAffirming || false;
    const trans = program.transAffirming || false;

    const svg = getSvg(loc, { size, lgbtq, trans, selected });
    
    // Create Leaflet divIcon
    const icon = L.divIcon({
      className: `cc-map-marker cc-map-marker--${loc.toLowerCase().replace(/\s+/g, '-')} ${selected ? 'cc-map-marker--selected' : ''} ${lgbtq ? 'cc-map-marker--lgbtq' : ''} ${trans ? 'cc-map-marker--trans' : ''}`,
      html: svg,
      iconSize: [size, size],
      iconAnchor: [size / 2, size],
      popupAnchor: [0, -size],
    });

    return icon;
  }

  /**
   * Get a cluster icon based on programs in cluster
   * @param {UiProgram[]} programs - Programs in the cluster
   * @param {number} count - Total count
   * @returns {L.DivIcon} Leaflet divIcon
   */
  function getClusterIcon(programs, count) {
    // Determine dominant LOC
    const locCounts = {};
    programs.forEach(p => {
      const loc = p.primaryLOC || 'Network';
      locCounts[loc] = (locCounts[loc] || 0) + 1;
    });

    let dominantLOC = 'Network';
    let maxCount = 0;
    Object.entries(locCounts).forEach(([loc, cnt]) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        dominantLOC = loc;
      }
    });

    const color = colors[dominantLOC] || colors.Network;

    // Determine size based on count
    let size = 40;
    if (count >= 50) size = 56;
    else if (count >= 10) size = 48;

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle 
          cx="${size/2}" cy="${size/2}" r="${(size/2) - 3}" 
          fill="${color}" 
          stroke="white" 
          stroke-width="2.5"
        />
        <text 
          x="${size/2}" y="${size/2}" 
          text-anchor="middle" 
          dominant-baseline="central" 
          fill="white" 
          font-size="${size * 0.42}px" 
          font-weight="600"
          font-family="system-ui, -apple-system, sans-serif"
        >${count}</text>
      </svg>
    `;

    return L.divIcon({
      className: `cc-map-cluster cc-map-cluster--${dominantLOC.toLowerCase().replace(/\s+/g, '-')}`,
      html: svg,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  /**
   * Get legend items for the UI
   * @returns {Array<{loc: string, label: string, color: string, svg: string}>}
   */
  function getLegendItems() {
    const { LOC_LABELS } = window.ccProgramTypes;
    
    return Object.keys(colors).map(loc => ({
      loc,
      label: LOC_LABELS[loc] || loc,
      color: colors[loc],
      svg: getSvg(loc, { size: 24, showShadow: false }),
    }));
  }

  /**
   * Get home location marker icon
   * @param {number} size - Icon size
   * @returns {L.DivIcon} Leaflet divIcon
   */
  function getHomeIcon(size = 36) {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <defs>
          <filter id="home-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        <circle 
          cx="${size/2}" cy="${size/2}" r="${(size/2) - 3}" 
          fill="#F97316" 
          stroke="white" 
          stroke-width="3"
          filter="url(#home-shadow)"
        />
        <g transform="translate(${size/4}, ${size/4}) scale(${size/48})">
          <path d="M12 3L2 12h3v8h6v-6h2v6h6v-8h3L12 3z" fill="white"/>
        </g>
      </svg>
    `;

    return L.divIcon({
      className: 'cc-map-home',
      html: svg,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  }

  /**
   * Generate CSS for marker hover/selected states
   * @returns {string} CSS styles
   */
  function getMarkerStyles() {
    return `
      .cc-map-marker {
        transition: transform 0.2s ease, filter 0.2s ease;
        cursor: pointer;
        position: relative;
      }
      .cc-map-marker:hover {
        transform: scale(1.08);
        z-index: 1000 !important;
        filter: drop-shadow(0 6px 16px rgba(99, 102, 241, 0.35));
      }
      .cc-map-marker::after {
        content: '';
        position: absolute;
        inset: 10%;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.35);
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      .cc-map-marker--selected {
        transform: scale(1.2);
        z-index: 1001 !important;
        filter: drop-shadow(0 8px 20px rgba(79, 70, 229, 0.45));
      }
      .cc-map-marker--selected::after {
        opacity: 1;
      }
      .cc-map-cluster {
        transition: transform 0.15s ease;
        cursor: pointer;
      }
      .cc-map-cluster:hover {
        transform: scale(1.1);
      }
      .cc-map-home {
        z-index: 999 !important;
      }
    `;
  }

  /**
   * Get legend items for the map legend UI
   * @returns {Array<{loc: string, label: string, color: string, emoji: string}>}
   */
  function getLegendItems() {
    const { LOC_LABELS } = window.ccProgramTypes || {};
    
    return Object.keys(colors).map(loc => ({
      loc,
      label: LOC_LABELS?.[loc] || loc,
      color: colors[loc],
      emoji: LOC_EMOJI[loc] || '🏥',
    }));
  }

  // ============================================================================
  // EXPOSE API
  // ============================================================================

  window.ccMapIcons = {
    colors,
    LOC_EMOJI,
    getIcon,
    getClusterIcon,
    getSvg,
    getLegendItems,
    getHomeIcon,
    getMarkerStyles,
    rainbowColors,
    transColors,
  };

  console.log('✅ Map Icons loaded');

})();

