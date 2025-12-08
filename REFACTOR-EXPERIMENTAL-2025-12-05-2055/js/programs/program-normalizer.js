/**
 * Program Normalizer - Transforms raw programs.v2.json data into UiProgram[]
 * @file program-normalizer.js
 * @requires program-types.js (loaded first)
 */

(function() {
  'use strict';

  // ============================================================================
  // FOCUS TO LOC MAPPING
  // ============================================================================

  /**
   * Maps raw 'focus' field values to standardized Level of Care arrays
   * @type {Object.<string, string[]>}
   */
  const FOCUS_TO_LOC_MAP = {
    // Residential
    'Residential Treatment': ['RTC'],
    'Child & Adolescent Inpatient Psychiatry': ['RTC'],
    
    // Therapeutic Boarding School
    'Therapeutic Boarding School': ['TBS'],
    
    // Wilderness (none in current data, but planned)
    'Wilderness': ['Wilderness'],
    'Outdoor Therapy': ['Wilderness'],
    'Wilderness Therapy': ['Wilderness'],
    
    // PHP
    'Partial Hospitalization Program (PHP)': ['PHP'],
    'Partial Hospitalization': ['PHP'],
    'Adolescent & Young Adult PHP / IOP': ['PHP', 'IOP'],
    'Adolescent & Adult PHP / IOP': ['PHP', 'IOP'],
    'Adolescent, Young Adult & Adult PHP / IOP': ['PHP', 'IOP'],
    'Adolescent, Young Adult & Men\'s PHP / IOP': ['PHP', 'IOP'],
    'Adolescent, Young Adult, Adult & Senior PHP / IOP': ['PHP', 'IOP'],
    'Substance Use PHP / IOP and Outpatient': ['PHP', 'IOP', 'OP'],
    
    // IOP
    'Intensive Outpatient': ['IOP'],
    'Adolescent & Adult Outpatient / IOP': ['IOP', 'OP'],
    'Substance Use Outpatient and IOP': ['IOP', 'OP'],
    
    // Outpatient
    'Outpatient Services': ['OP'],
    
    // Substance Use / Sober Living
    'Addiction Treatment - Detox & Residential': ['RTC'],
    'Adolescent Substance Use Treatment': ['RTC'],
    'Sober Living': ['Sober Living'],
    
    // Virtual
    'Virtual Care': ['Virtual'],
    
    // Specialized
    'Autism & I/DD Residential and Educational Services': ['RTC', 'TBS'],
    'Autism, I/DD & Behavioral Health - Residential and Community Programs': ['RTC'],
    'Pediatric Behavioral Health & Developmental Services': ['RTC', 'PHP'],
    
    // Network / Comprehensive (umbrella parents)
    'Comprehensive Support': ['Network'],
    'Statewide Access & Care Management': ['Network'],
  };

  /**
   * Fallback detection for LOC based on tags and program category
   * @param {Object} rawProgram - Raw program data
   * @returns {string[]} - Array of LOC types
   */
  function detectLOCFromTags(rawProgram) {
    const locs = [];
    const tags = rawProgram.tags || [];
    const category = (rawProgram.programCategory || '').toLowerCase();
    const summary = (rawProgram.summary || '').toLowerCase();
    
    // Check tags
    const tagStr = tags.join(' ').toLowerCase();
    
    if (tagStr.includes('residential') || category.includes('residential')) locs.push('RTC');
    if (tagStr.includes('tbs') || tagStr.includes('boarding school')) locs.push('TBS');
    if (tagStr.includes('wilderness') || tagStr.includes('outdoor')) locs.push('Wilderness');
    if (tagStr.includes('php') || tagStr.includes('partial')) locs.push('PHP');
    if (tagStr.includes('iop') || tagStr.includes('intensive outpatient')) locs.push('IOP');
    if (tagStr.includes('outpatient') && !tagStr.includes('intensive')) locs.push('OP');
    if (tagStr.includes('sober living') || tagStr.includes('transitional')) locs.push('Sober Living');
    if (tagStr.includes('virtual') || tagStr.includes('telehealth')) locs.push('Virtual');
    
    // Check summary for additional context
    if (summary.includes('php') && !locs.includes('PHP')) locs.push('PHP');
    if (summary.includes('iop') && !locs.includes('IOP')) locs.push('IOP');
    
    return [...new Set(locs)]; // Dedupe
  }

  /**
   * Maps focus field to standardized LOC array
   * @param {string|null} focus - Raw focus value
   * @param {Object} rawProgram - Full raw program object for fallback detection
   * @returns {string[]} - Array of LOC types
   */
  function mapFocusToLOC(focus, rawProgram) {
    if (focus && FOCUS_TO_LOC_MAP[focus]) {
      return [...FOCUS_TO_LOC_MAP[focus]];
    }
    
    // Fallback: Try to detect from tags/category
    const detected = detectLOCFromTags(rawProgram);
    if (detected.length > 0) {
      return detected;
    }
    
    // Last resort: if it's a network parent, return Network
    if (rawProgram.flags && rawProgram.flags.includes('network-parent')) {
      return ['Network'];
    }
    
    // Default to unknown/empty
    return ['RTC']; // Default to RTC as most common
  }

  // ============================================================================
  // STATE NORMALIZATION
  // ============================================================================

  /**
   * Normalizes state to 2-letter code
   * @param {string|null} state - State value (full name or code)
   * @returns {string} - 2-letter state code or empty string
   */
  function normalizeState(state) {
    if (!state) return '';
    
    const trimmed = state.trim();
    
    // Already a 2-letter code?
    if (trimmed.length === 2) {
      return trimmed.toUpperCase();
    }
    
    // Try to map from full name
    const { STATE_NAME_TO_CODE } = window.ccProgramTypes;
    const normalized = trimmed.toLowerCase();
    
    if (STATE_NAME_TO_CODE[normalized]) {
      return STATE_NAME_TO_CODE[normalized];
    }
    
    // Return as-is if we can't normalize
    return trimmed.substring(0, 2).toUpperCase();
  }

  // ============================================================================
  // AGE PARSING
  // ============================================================================

  /**
   * Parses age range object to min/max numbers
   * @param {Object|null} ageRange - { min, max } object
   * @returns {{ min: number|null, max: number|null }}
   */
  function parseAgeRange(ageRange) {
    if (!ageRange) return { min: null, max: null };
    
    let min = ageRange.min;
    let max = ageRange.max;
    
    // Handle invalid/placeholder values
    if (min === 0 || min === '?' || min === null) min = null;
    if (max === 99 || max === 999 || max === null) max = null;
    
    // Ensure numbers
    if (typeof min === 'string') min = parseInt(min, 10) || null;
    if (typeof max === 'string') max = parseInt(max, 10) || null;
    
    // Validate ranges
    if (min !== null && (min < 0 || min > 100)) min = null;
    if (max !== null && (max < 0 || max > 100)) max = null;
    
    return { min, max };
  }

  // ============================================================================
  // GENDER NORMALIZATION
  // ============================================================================

  /**
   * Normalizes gender served field to array
   * @param {string|null} genderServed - Raw gender value
   * @returns {string[]} - Array of gender types
   */
  function normalizeGender(genderServed) {
    if (!genderServed) return ['Co-ed'];
    
    const normalized = genderServed.toLowerCase().trim();
    
    if (normalized.includes('co-ed') || normalized.includes('coed') || normalized.includes('all')) {
      return ['Co-ed'];
    }
    if (normalized.includes('male') && normalized.includes('female')) {
      return ['Co-ed'];
    }
    if (normalized.includes('male') && !normalized.includes('female')) {
      return ['Male'];
    }
    if (normalized.includes('female') && !normalized.includes('male')) {
      return ['Female'];
    }
    if (normalized.includes('non-binary') || normalized.includes('nonbinary')) {
      return ['Non-binary'];
    }
    
    return ['Co-ed'];
  }

  // ============================================================================
  // FORMAT NORMALIZATION
  // ============================================================================

  /**
   * Normalizes format field
   * @param {string|null} format - Raw format value
   * @returns {string[]} - Array of format types
   */
  function normalizeFormat(format) {
    if (!format) return ['Onsite'];
    
    const normalized = format.toLowerCase().trim();
    
    if (normalized.includes('hybrid')) {
      return ['Hybrid', 'Onsite', 'Virtual'];
    }
    if (normalized.includes('virtual') || normalized.includes('telehealth') || normalized.includes('online')) {
      return ['Virtual'];
    }
    if (normalized.includes('onsite') || normalized.includes('in-person')) {
      return ['Onsite'];
    }
    
    return ['Onsite'];
  }

  // ============================================================================
  // CLINICAL ENRICHMENT
  // ============================================================================

  /**
   * Extracts clinical enrichment (diagnoses, modalities, flags) from free-text fields
   * to produce a richer normalized view even when the JSON is sparse.
   * This never mutates the raw data.
   * @param {Object} rawProgram
   * @returns {{ diagnoses: string[]|null, modalities: string[]|null, flags: { treatsASD: boolean, treatsSUD: boolean, highAcuityMH: boolean } }}
   */
  function enrichClinical(rawProgram) {
    const textBuckets = [];

    if (typeof rawProgram.summary === 'string') textBuckets.push(rawProgram.summary);
    if (typeof rawProgram.overview === 'string') textBuckets.push(rawProgram.overview);
    if (Array.isArray(rawProgram.features)) textBuckets.push(rawProgram.features.join(' '));
    if (Array.isArray(rawProgram.tags)) textBuckets.push(rawProgram.tags.join(' '));

    const fullText = textBuckets.join(' ').toLowerCase();

    /** @type {string[]} */
    const diagnoses = [];
    /** @type {string[]} */
    const modalities = [];

    const flags = {
      treatsASD: rawProgram.treatsASD === true,
      treatsSUD: rawProgram.treatsSUD === true,
      highAcuityMH: rawProgram.highAcuityMH === true,
    };

    // --- Diagnoses ---
    if (/depression|mood disorder|mood disorders/.test(fullText)) {
      diagnoses.push('Depression / Mood Disorders');
    }
    if (/anxiety|panic/.test(fullText)) {
      diagnoses.push('Anxiety Disorders');
    }
    if (/trauma|ptsd|post-traumatic/.test(fullText)) {
      diagnoses.push('Trauma / PTSD');
    }
    if (/\badhd\b|attention[-\s]?deficit/.test(fullText)) {
      diagnoses.push('ADHD / Attention');
    }
    if (/autism|asd|neurodivergent|neurodevelopmental/.test(fullText)) {
      diagnoses.push('Autism Spectrum / Neurodivergent');
      flags.treatsASD = true;
    }
    if (/eating disorder|anorexia|bulimia|binge eating/.test(fullText)) {
      diagnoses.push('Eating Disorders');
    }
    if (/substance|chemical dependency|sud|addiction/.test(fullText)) {
      diagnoses.push('Substance Use / Dual Diagnosis');
      flags.treatsSUD = true;
    }
    if (/bipolar/.test(fullText)) {
      diagnoses.push('Bipolar Disorder');
    }
    if (/psychosis|psychotic/.test(fullText)) {
      diagnoses.push('Psychosis Risk');
      flags.highAcuityMH = true;
    }
    if (/self-harm|self harm|suicidal|suicide risk/.test(fullText)) {
      diagnoses.push('Self-Harm / Suicidality');
      flags.highAcuityMH = true;
    }

    // --- Modalities ---
    if (/cbt\b|cognitive behavioral/.test(fullText)) {
      modalities.push('CBT');
    }
    if (/dbt\b|dialectical behavior/.test(fullText)) {
      modalities.push('DBT');
    }
    if (/emdr/.test(fullText)) {
      modalities.push('EMDR');
    }
    if (/\bact\b|acceptance and commitment/.test(fullText)) {
      modalities.push('ACT');
    }
    if (/family therapy|family work|parent coaching|parent support/.test(fullText)) {
      modalities.push('Family Therapy / Parent Work');
    }
    if (/group therapy|process group/.test(fullText)) {
      modalities.push('Group Therapy');
    }
    if (/individual therapy|one-on-one/.test(fullText)) {
      modalities.push('Individual Therapy');
    }
    if (/equine/.test(fullText)) {
      modalities.push('Equine Therapy');
    }
    if (/experiential|adventure|outdoor/.test(fullText)) {
      modalities.push('Adventure / Experiential');
    }
    if (/12[-\s]?step|twelve[-\s]?step/.test(fullText)) {
      modalities.push('12-Step Integration');
    }

    const uniqDiagnoses = diagnoses.length ? Array.from(new Set(diagnoses)) : null;
    const uniqModalities = modalities.length ? Array.from(new Set(modalities)) : null;

    return {
      diagnoses: uniqDiagnoses,
      modalities: uniqModalities,
      flags,
    };
  }

  // ============================================================================
  // MAIN NORMALIZATION FUNCTION
  // ============================================================================

  /**
   * Normalizes a single raw program into UiProgram format
   * @param {Object} rawProgram - Raw program data from JSON
   * @returns {UiProgram} - Normalized program object
   */
  function normalizeProgram(rawProgram) {
    const loc = rawProgram.location || {};
    const contacts = rawProgram.contacts || {};
    const ageRange = parseAgeRange(rawProgram.ageRange);
    const levelOfCare = mapFocusToLOC(rawProgram.focus, rawProgram);
    const clinical = enrichClinical(rawProgram);
    
    /** @type {UiProgram} */
    const program = {
      // === IDENTITY ===
      id: rawProgram.id || `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: rawProgram.name || 'Unknown Program',
      brandName: rawProgram.parentProgramName || null,
      
      // === LOCATION ===
      city: loc.city || '',
      state: normalizeState(loc.state),
      fullAddress: loc.address || null,
      lat: (typeof loc.lat === 'number' && !isNaN(loc.lat)) ? loc.lat : null,
      lng: (typeof loc.lng === 'number' && !isNaN(loc.lng)) ? loc.lng : null,
      nearestAirport: loc.nearestAirport || null,
      zip: loc.zip || null,
      
      // === CLASSIFICATION ===
      levelOfCare: levelOfCare,
      primaryLOC: levelOfCare[0] || 'RTC',
      format: normalizeFormat(rawProgram.format),
      insurance: Array.isArray(rawProgram.insuranceAccepted) 
        ? rawProgram.insuranceAccepted.filter(i => i && i !== 'Information pending')
        : [],
      
      // === POPULATION ===
      ageMin: ageRange.min,
      ageMax: ageRange.max,
      gendersServed: normalizeGender(rawProgram.genderServed),
      
      // === CLINICAL FLAGS ===
      lgbtqAffirming: rawProgram.lgbtqAffirming === true,
      transAffirming: rawProgram.transAffirming === true,
      genderInclusiveHousing: rawProgram.genderInclusiveHousing === true,
      // Use enriched flags as a fallback if explicit booleans are not set
      treatsASD: rawProgram.treatsASD === true || clinical.flags.treatsASD === true,
      treatsSUD: rawProgram.treatsSUD === true || clinical.flags.treatsSUD === true,
      highAcuityMH: rawProgram.highAcuityMH === true || clinical.flags.highAcuityMH === true,
      
      // === CLINICAL DETAIL ===
      diagnosesServed: Array.isArray(rawProgram.diagnosesServed) && rawProgram.diagnosesServed.length
        ? Array.from(new Set([
            ...rawProgram.diagnosesServed,
            ...(clinical.diagnoses || []),
          ]))
        : (clinical.diagnoses || null),
      modalities: Array.isArray(rawProgram.modalities) && rawProgram.modalities.length
        ? Array.from(new Set([
            ...rawProgram.modalities,
            ...(clinical.modalities || []),
          ]))
        : (clinical.modalities || null),
      exclusions: Array.isArray(rawProgram.exclusions) ? rawProgram.exclusions : null,
      
      // === ACADEMICS ===
      academics: rawProgram.academics || null,
      
      // === UMBRELLA/NETWORK ===
      parentId: rawProgram.parentProgramId || null,
      childIds: [], // Populated in normalizeAllPrograms
      isUmbrellaParent: rawProgram.flags?.includes('network-parent') || false,
      isUmbrellaChild: rawProgram.flags?.includes('network-child') || false,
      
      // === CONTENT ===
      summary: rawProgram.summary || rawProgram.overview || '',
      tags: Array.isArray(rawProgram.tags) ? rawProgram.tags : [],
      features: Array.isArray(rawProgram.features) ? rawProgram.features : [],
      weeklyStructure: Array.isArray(rawProgram.weeklyStructure) ? rawProgram.weeklyStructure : [],
      
      // === CONTACTS ===
      contacts: {
        phone: contacts.phone || null,
        email: contacts.email || null,
        website: contacts.website || null,
        admissionsPhone: rawProgram.admissions?.phone || contacts.phone || null,
        admissionsEmail: rawProgram.admissions?.email || contacts.email || null,
        contactName: contacts.name || rawProgram.admissions?.contactName || null,
      },
      
      // === ADMISSIONS ===
      admissions: rawProgram.admissions || null,
      
      // === MEDIA ===
      heroImageUrl: rawProgram.heroImageUrl || null,
      logoUrl: rawProgram.logoUrl || null,
      galleryUrls: Array.isArray(rawProgram.galleryUrls) ? rawProgram.galleryUrls : null,
      
      // === META ===
      raw: rawProgram,
      distanceMiles: null, // Calculated on demand
    };
    
    return program;
  }

  /**
   * Normalizes all programs and builds parent/child relationships
   * @param {Object[]} rawPrograms - Array of raw program data
   * @returns {UiProgram[]} - Array of normalized programs
   */
  function normalizeAllPrograms(rawPrograms) {
    if (!Array.isArray(rawPrograms) || rawPrograms.length === 0) {
      console.warn('⚠️ No programs to normalize');
      return [];
    }
    
    console.log(`🔄 Normalizing ${rawPrograms.length} programs...`);
    
    // Step 1: Normalize all programs
    const programs = rawPrograms.map(normalizeProgram);
    
    // Step 2: Build parent-child relationships
    const programMap = new Map();
    programs.forEach(p => programMap.set(p.id, p));
    
    // Step 3: Populate childIds for umbrella parents
    programs.forEach(program => {
      if (program.parentId) {
        const parent = programMap.get(program.parentId);
        if (parent) {
          parent.childIds.push(program.id);
          // Also ensure parent is marked as umbrella
          parent.isUmbrellaParent = true;
        }
      }
    });
    
    // Step 4: Sort alphabetically by name
    programs.sort((a, b) => {
      // Put umbrella parents first
      if (a.isUmbrellaParent && !b.isUmbrellaParent) return -1;
      if (!a.isUmbrellaParent && b.isUmbrellaParent) return 1;
      // Then sort by name
      return a.name.localeCompare(b.name);
    });
    
    console.log(`✅ Normalized ${programs.length} programs`);
    console.log(`   - Umbrella parents: ${programs.filter(p => p.isUmbrellaParent).length}`);
    console.log(`   - Umbrella children: ${programs.filter(p => p.isUmbrellaChild).length}`);
    console.log(`   - Standalone: ${programs.filter(p => !p.isUmbrellaParent && !p.isUmbrellaChild).length}`);
    
    return programs;
  }

  // ============================================================================
  // DISTANCE CALCULATION
  // ============================================================================

  /**
   * Calculates distance between two lat/lng points using Haversine formula
   * @param {number} lat1 - Latitude 1
   * @param {number} lng1 - Longitude 1
   * @param {number} lat2 - Latitude 2
   * @param {number} lng2 - Longitude 2
   * @returns {number} - Distance in miles
   */
  function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  /**
   * Updates distance for all programs from a home location
   * @param {UiProgram[]} programs - Array of programs
   * @param {number} homeLat - Home latitude
   * @param {number} homeLng - Home longitude
   */
  function updateDistances(programs, homeLat, homeLng) {
    programs.forEach(program => {
      if (program.lat !== null && program.lng !== null) {
        program.distanceMiles = calculateDistance(homeLat, homeLng, program.lat, program.lng);
      } else {
        program.distanceMiles = null;
      }
    });
  }

  // ============================================================================
  // EXPORTS
  // ============================================================================

  window.ccProgramNormalizer = {
    normalizeProgram,
    normalizeAllPrograms,
    mapFocusToLOC,
    normalizeState,
    parseAgeRange,
    normalizeGender,
    normalizeFormat,
    calculateDistance,
    updateDistances,
    FOCUS_TO_LOC_MAP,
  };

  console.log('✅ Program Normalizer loaded');

})();

