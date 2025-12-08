/**
 * Program Types - JSDoc Type Definitions for CareConnect Pro
 * This file defines all type definitions for normalized program data
 * @file program-types.js
 */

// ============================================================================
// LEVEL OF CARE CONSTANTS
// ============================================================================

/**
 * Level of Care types with associated colors
 * @readonly
 * @enum {string}
 */
const LOC_TYPES = {
  RTC: 'RTC',
  TBS: 'TBS',
  WILDERNESS: 'Wilderness',
  PHP: 'PHP',
  IOP: 'IOP',
  OP: 'OP',
  SOBER_LIVING: 'Sober Living',
  VIRTUAL: 'Virtual',
  NETWORK: 'Network'
};

/**
 * Level of Care color mapping
 * @readonly
 * @type {Object.<string, string>}
 */
const LOC_COLORS = {
  'RTC': '#7C3AED',           // Violet
  'TBS': '#2563EB',           // Blue
  'Wilderness': '#059669',    // Emerald
  'PHP': '#DC2626',           // Red
  'IOP': '#EA580C',           // Orange
  'OP': '#0891B2',            // Cyan
  'Sober Living': '#7C2D12',  // Amber/Brown
  'Virtual': '#64748B',       // Slate
  'Network': '#6E7BFF'        // Accent
};

/**
 * Level of Care display labels
 * @readonly
 * @type {Object.<string, string>}
 */
const LOC_LABELS = {
  'RTC': 'Residential Treatment',
  'TBS': 'Therapeutic Boarding School',
  'Wilderness': 'Wilderness Therapy',
  'PHP': 'Partial Hospitalization',
  'IOP': 'Intensive Outpatient',
  'OP': 'Outpatient',
  'Sober Living': 'Sober Living / Transitional',
  'Virtual': 'Virtual / Telehealth',
  'Network': 'Network / Umbrella'
};

/**
 * Format types
 * @readonly
 * @enum {string}
 */
const FORMAT_TYPES = {
  ONSITE: 'Onsite',
  VIRTUAL: 'Virtual',
  HYBRID: 'Hybrid'
};

/**
 * Gender options
 * @readonly
 * @enum {string}
 */
const GENDER_TYPES = {
  MALE: 'Male',
  FEMALE: 'Female',
  COED: 'Co-ed',
  NON_BINARY: 'Non-binary'
};

// ============================================================================
// MAIN TYPE DEFINITIONS
// ============================================================================

/**
 * Contacts information for a program
 * @typedef {Object} ProgramContacts
 * @property {string|null} phone - Main phone number
 * @property {string|null} email - Main email address
 * @property {string|null} website - Website URL
 * @property {string|null} admissionsPhone - Direct admissions phone
 * @property {string|null} admissionsEmail - Admissions email
 * @property {string|null} contactName - Named contact person
 */

/**
 * Academics information (for RTC/TBS programs)
 * @typedef {Object} ProgramAcademics
 * @property {boolean} accreditedSchool - Whether school is accredited
 * @property {boolean} creditsTransferable - Whether credits transfer
 * @property {boolean} diplomaGranting - Whether they grant diplomas
 * @property {boolean} specialEducation - IEP/504 support available
 * @property {string|null} gradeLevels - Grade levels served (e.g., "6-12")
 */

/**
 * Admissions information
 * @typedef {Object} ProgramAdmissions
 * @property {string|null} phone - Admissions phone
 * @property {string|null} email - Admissions email
 * @property {string|null} contactName - Admissions contact name
 * @property {string|null} avgResponseTime - Average response time
 * @property {boolean|null} transportProvided - Whether transport is provided
 */

/**
 * Location information for a program
 * @typedef {Object} ProgramLocation
 * @property {string} city - City name
 * @property {string} state - 2-letter state code
 * @property {string|null} fullAddress - Full street address
 * @property {number|null} lat - Latitude
 * @property {number|null} lng - Longitude
 * @property {string|null} nearestAirport - Nearest airport code
 * @property {string|null} zip - ZIP code
 */

/**
 * Normalized Program object used throughout the UI
 * @typedef {Object} UiProgram
 * 
 * @property {string} id - Unique program identifier
 * @property {string} name - Display name
 * @property {string|null} brandName - Parent brand name (e.g., "Discovery Mood")
 * 
 * @property {string} city - City
 * @property {string} state - 2-letter state code (FL, CA, etc)
 * @property {string|null} fullAddress - Full street address
 * @property {number|null} lat - Latitude for map
 * @property {number|null} lng - Longitude for map
 * @property {string|null} nearestAirport - Nearest airport code
 * @property {string|null} zip - ZIP code
 * 
 * @property {string[]} levelOfCare - Array of LOC types ['RTC', 'PHP', etc]
 * @property {string} primaryLOC - Primary/first level of care
 * @property {string[]} format - Format types ['Onsite', 'Virtual', 'Hybrid']
 * @property {string[]} insurance - Accepted insurance payers
 * 
 * @property {number|null} ageMin - Minimum age served
 * @property {number|null} ageMax - Maximum age served
 * @property {string[]} gendersServed - Genders served ['Male', 'Female', 'Co-ed']
 * 
 * @property {boolean} lgbtqAffirming - LGBTQ+ affirming
 * @property {boolean} transAffirming - Trans affirming
 * @property {boolean} genderInclusiveHousing - Gender inclusive housing
 * @property {boolean} treatsASD - Treats autism spectrum
 * @property {boolean} treatsSUD - Treats substance use
 * @property {boolean} highAcuityMH - High acuity mental health
 * 
 * @property {string[]|null} diagnosesServed - Diagnoses treated
 * @property {string[]|null} modalities - Treatment modalities offered
 * @property {string[]|null} exclusions - Exclusionary criteria
 * 
 * @property {ProgramAcademics|null} academics - Academic program info (RTC/TBS only)
 * 
 * @property {string|null} parentId - Parent program ID if child of umbrella
 * @property {string[]} childIds - Child program IDs if umbrella parent
 * @property {boolean} isUmbrellaParent - Is this an umbrella/network parent
 * @property {boolean} isUmbrellaChild - Is this a child of an umbrella
 * 
 * @property {string} summary - Short description/summary
 * @property {string[]} tags - Searchable tags
 * @property {string[]} features - Program features list
 * @property {string[]} weeklyStructure - Weekly schedule items
 * 
 * @property {ProgramContacts} contacts - Contact information
 * @property {ProgramAdmissions|null} admissions - Admissions specific info
 * 
 * @property {string|null} heroImageUrl - Hero/main image URL
 * @property {string|null} logoUrl - Logo image URL
 * @property {string[]|null} galleryUrls - Gallery image URLs
 * 
 * @property {Object} raw - Original raw data from JSON
 * @property {number|null} distanceMiles - Calculated distance from client ZIP
 */

/**
 * Filter criteria for program searches
 * @typedef {Object} ProgramFilter
 * @property {string[]} [loc] - Level of care filter
 * @property {string[]} [format] - Format filter
 * @property {string[]} [state] - State filter
 * @property {number} [ageMin] - Minimum age filter
 * @property {number} [ageMax] - Maximum age filter
 * @property {Object} [flags] - Clinical flag filters
 * @property {boolean} [flags.lgbtq] - LGBTQ+ affirming filter
 * @property {boolean} [flags.trans] - Trans affirming filter
 * @property {boolean} [flags.asd] - Treats ASD filter
 * @property {boolean} [flags.sud] - Treats SUD filter
 * @property {boolean} [flags.highAcuity] - High acuity filter
 * @property {string[]} [insurance] - Insurance filter
 * @property {string} [search] - Search term
 * @property {number} [radiusMiles] - Radius in miles from home location
 */

/**
 * Search result with match highlights
 * @typedef {Object} ProgramSearchResult
 * @property {UiProgram} program - The matched program
 * @property {number} score - Match score (higher is better)
 * @property {Object} highlights - Highlighted match fields
 * @property {string[]} [highlights.name] - Name match highlights
 * @property {string[]} [highlights.summary] - Summary match highlights
 * @property {string[]} [highlights.tags] - Tag match highlights
 */

/**
 * Home location for distance calculations
 * @typedef {Object} HomeLocation
 * @property {number} lat - Latitude
 * @property {number} lng - Longitude
 * @property {string} zip - ZIP code
 * @property {string} [city] - City name
 * @property {string} [state] - State code
 */

/**
 * US Region definitions for geographic filtering
 * @typedef {Object} USRegion
 * @property {string} name - Region name
 * @property {string[]} states - State codes in region
 */

/**
 * US Regions for Primary radius mode
 * @readonly
 * @type {Object.<string, USRegion>}
 */
const US_REGIONS = {
  EAST_COAST: {
    name: 'East Coast',
    states: ['ME', 'NH', 'VT', 'MA', 'RI', 'CT', 'NY', 'NJ', 'PA', 'DE', 'MD', 'VA', 'WV', 'NC', 'SC', 'GA', 'FL']
  },
  MIDWEST: {
    name: 'Midwest',
    states: ['OH', 'IN', 'IL', 'MI', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS']
  },
  WEST_COAST: {
    name: 'West Coast',
    states: ['WA', 'OR', 'CA', 'NV', 'AZ']
  },
  MOUNTAIN: {
    name: 'Mountain',
    states: ['MT', 'ID', 'WY', 'CO', 'UT', 'NM']
  },
  SOUTH: {
    name: 'South',
    states: ['TX', 'OK', 'AR', 'LA', 'MS', 'AL', 'TN', 'KY']
  }
};

/**
 * All US state codes
 * @readonly
 * @type {string[]}
 */
const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY', 'DC'
];

/**
 * State name to code mapping
 * @readonly
 * @type {Object.<string, string>}
 */
const STATE_NAME_TO_CODE = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
  'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
  'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
  'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
  'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
  'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
  'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
  'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
  'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
  'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
  'wisconsin': 'WI', 'wyoming': 'WY', 'district of columbia': 'DC'
};

// ============================================================================
// EXPORTS
// ============================================================================

// Expose to window for global access
window.ccProgramTypes = {
  LOC_TYPES,
  LOC_COLORS,
  LOC_LABELS,
  FORMAT_TYPES,
  GENDER_TYPES,
  US_REGIONS,
  US_STATES,
  STATE_NAME_TO_CODE
};

// Also expose individual constants for convenience
window.LOC_TYPES = LOC_TYPES;
window.LOC_COLORS = LOC_COLORS;
window.LOC_LABELS = LOC_LABELS;

console.log('✅ Program Types loaded');

