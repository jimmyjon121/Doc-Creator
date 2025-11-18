/**
 * programs-v2-schema.js
 * Utilities to normalize legacy program entries into the Programs & Docs v2 schema.
 */

const DEFAULT_TRACKS = [
    { id: 'primary', label: 'Primary Recommendation' },
    { id: 'strong-alt', label: 'Strong Alternative' },
    { id: 'local-step-down', label: 'Local / Step-Down' },
    { id: 'at-home-support', label: 'At-Home Support' },
    { id: 'alumni', label: 'Alumni Follow-Up' }
];

const PROGRAM_DEFAULTS = {
    acuity: 7,
    availabilityDays: 7,
    serviceRadiusMiles: 50,
    focusFallback: 'Comprehensive Support',
    formatFallback: 'Onsite',
    regionFallback: 'National'
};

const TYPE_TO_FOCUS = new Map([
    ['residential treatment', 'Residential Treatment'],
    ['therapeutic boarding school', 'Therapeutic Boarding School'],
    ['sober living', 'Sober Living'],
    ['iop', 'Intensive Outpatient'],
    ['php', 'Partial Hospitalization'],
    ['virtual program', 'Virtual Care'],
    ['outpatient', 'Outpatient Services'],
    ['family program', 'Family Support'],
    ['aftercare', 'Aftercare Support']
]);

const CATEGORY_TO_FORMAT = new Map([
    ['residential', 'Onsite'],
    ['therapeutic-school', 'Onsite'],
    ['sober-living', 'Onsite'],
    ['outpatient', 'Outpatient'],
    ['virtual', 'Virtual'],
    ['family', 'Family Services'],
    ['coaching', 'Coaching'],
    ['continuing-care', 'Continuing Care']
]);

const STATE_CODE_MATCH = /,\s*([A-Z]{2})(?:\s*(\d{5}))?$/;

function deriveFocus(type = '') {
    const key = type.trim().toLowerCase();
    for (const [pattern, focus] of TYPE_TO_FOCUS.entries()) {
        if (key.includes(pattern)) {
            return focus;
        }
    }
    return PROGRAM_DEFAULTS.focusFallback;
}

function deriveFormat(category = '') {
    const key = category.trim().toLowerCase();
    for (const [pattern, format] of CATEGORY_TO_FORMAT.entries()) {
        if (key.includes(pattern)) {
            return format;
        }
    }
    return PROGRAM_DEFAULTS.formatFallback;
}

function dedupeArray(value = []) {
    return [...new Set(value.filter(Boolean).map(entry => String(entry).trim()).filter(Boolean))];
}

function parseCityState(raw = '') {
    if (!raw) return { city: null, state: null, zip: null };
    const parts = raw.split(',').map(part => part.trim()).filter(Boolean);
    if (!parts.length) return { city: null, state: null, zip: null };

    if (parts.length === 1) {
        const match = STATE_CODE_MATCH.exec(parts[0]);
        if (match) {
            return { city: parts[0].replace(match[0], '').trim() || null, state: match[1], zip: match[2] || null };
        }
        return { city: parts[0], state: null, zip: null };
    }

    const city = parts.slice(0, parts.length - 1).join(', ');
    const stateSegment = parts[parts.length - 1];
    const match = STATE_CODE_MATCH.exec(`, ${stateSegment}`);
    if (match) {
        return { city: city || null, state: match[1], zip: match[2] || null };
    }
    return { city: city || null, state: stateSegment || null, zip: null };
}

function parseLocation(rawProgram = {}, parent = {}) {
    const locationString = rawProgram.location || rawProgram.contact?.address || '';
    const { city, state, zip } = parseCityState(locationString);
    const coordinates = rawProgram.coordinates || {};

    return {
        address: rawProgram.contact?.address || locationString || null,
        city,
        state,
        zip,
        lat: typeof coordinates.lat === 'number' ? coordinates.lat : null,
        lng: typeof coordinates.lng === 'number' ? coordinates.lng : null,
        region: rawProgram.region || parent.region || PROGRAM_DEFAULTS.regionFallback,
        distanceFromFamilyMiles: null
    };
}

function deriveAcuity(type = '') {
    const key = type.toLowerCase();
    if (key.includes('detox') || key.includes('tbs')) return 9;
    if (key.includes('residential')) return 8;
    if (key.includes('php')) return 7;
    if (key.includes('iop')) return 6;
    if (key.includes('sober living')) return 5;
    return PROGRAM_DEFAULTS.acuity;
}

function deriveAvailability(levelOfCare = '', features = []) {
    const combined = `${levelOfCare} ${features.join(' ')}`.toLowerCase();
    if (!combined.trim()) return PROGRAM_DEFAULTS.availabilityDays;
    if (combined.includes('immediate') || combined.includes('openings now')) return 0;
    if (combined.includes('waitlist')) return 14;
    if (combined.includes('48-hour')) return 2;
    if (combined.includes('72-hour')) return 3;
    if (combined.includes('weekly intake')) return 7;
    return PROGRAM_DEFAULTS.availabilityDays;
}

function buildSummary(rawProgram = {}, parent = {}) {
    if (rawProgram.levelOfCare) {
        return rawProgram.levelOfCare.trim();
    }
    if (rawProgram.overview) {
        return rawProgram.overview.trim();
    }
    if (parent.overview) {
        return parent.overview.trim();
    }
    return `${deriveFocus(rawProgram.type)} program`;
}

function collectTags(rawProgram = {}, parent = {}) {
    const combinedTags = [
        ...(Array.isArray(parent.tags) ? parent.tags : []),
        ...(Array.isArray(rawProgram.tags) ? rawProgram.tags : [])
    ];
    if (rawProgram.genderServed) combinedTags.push(rawProgram.genderServed);
    if (rawProgram.ageRange) {
        if (typeof rawProgram.ageRange === 'string') {
            combinedTags.push(rawProgram.ageRange);
        } else if (rawProgram.ageRange.min || rawProgram.ageRange.max) {
            combinedTags.push(`Ages ${rawProgram.ageRange.min || '?'}-${rawProgram.ageRange.max || '?'}`);
        }
    }
    return dedupeArray(combinedTags);
}

function normalizeContact(rawProgram = {}, parent = {}) {
    const contact = rawProgram.contact || {};
    const parentContact = parent.contact || {};
    return {
        name: contact.contactPerson || parentContact.contactPerson || null,
        phone: contact.phone || parentContact.phone || null,
        email: contact.email || parentContact.email || null,
        website: contact.website || parentContact.website || null,
        notes: contact.notes || null
    };
}

function normalizeProgram(rawProgram = {}, parent = {}, options = {}) {
    const focus = deriveFocus(rawProgram.type || parent.type || '');
    const format = deriveFormat(rawProgram.category || parent.category || '');
    const summary = buildSummary(rawProgram, parent);
    const features = Array.isArray(rawProgram.features) ? rawProgram.features : [];
    const flags = [];

    if (rawProgram.isParent || options.isNetworkParent) {
        flags.push('network-parent');
    }
    if (options.isNetworkChild) {
        flags.push('network-child');
    }

    return {
        id: rawProgram.id,
        parentProgramId: parent.id || null,
        parentProgramName: parent.name || null,
        name: rawProgram.name || parent.name,
        focus,
        format,
        insurance: dedupeArray(rawProgram.insurance || parent.insurance || []),
        flags,
        acuity: deriveAcuity(rawProgram.type || parent.type || ''),
        availabilityDays: deriveAvailability(rawProgram.levelOfCare || '', features),
        summary,
        tags: collectTags(rawProgram, parent),
        weeklyStructure: features.length ? features.slice() : [],
        tracks: DEFAULT_TRACKS.slice(),
        location: parseLocation(rawProgram, parent),
        serviceRadiusMiles: PROGRAM_DEFAULTS.serviceRadiusMiles,
        contacts: normalizeContact(rawProgram, parent),
        outcomes: Array.isArray(rawProgram.outcomes) ? rawProgram.outcomes.slice() : [],
        highlights: Array.isArray(rawProgram.highlights) ? rawProgram.highlights.slice() : [],
        levelOfCare: rawProgram.levelOfCare || null,
        features,
        overview: rawProgram.overview || parent.overview || null,
        programCategory: rawProgram.programCategory || parent.programCategory || null,
        genderServed: rawProgram.genderServed || parent.genderServed || null,
        ageRange: rawProgram.ageRange || parent.ageRange || null,
        costRange: rawProgram.costRange || parent.costRange || null,
        raw: {
            parent,
            program: rawProgram
        }
    };
}

function normalizeLegacyPrograms(legacyPrograms = []) {
    const normalized = [];
    const warnings = [];

    legacyPrograms.forEach(parentProgram => {
        if (!parentProgram || typeof parentProgram !== 'object') {
            return;
        }

        if (parentProgram.isParent && Array.isArray(parentProgram.subPrograms) && parentProgram.subPrograms.length) {
            normalized.push(normalizeProgram(parentProgram, {}, { isNetworkParent: true }));
            parentProgram.subPrograms.forEach(subProgram => {
                if (!subProgram.id) {
                    warnings.push(`Skipped subProgram without id under parent ${parentProgram.id || parentProgram.name}`);
                    return;
                }
                normalized.push(normalizeProgram(subProgram, parentProgram, { isNetworkChild: true }));
            });
        } else {
            if (!parentProgram.id) {
                warnings.push(`Skipped program without id: ${parentProgram.name || 'Unnamed Program'}`);
                return;
            }
            normalized.push(normalizeProgram(parentProgram));
        }
    });

    return { programs: normalized, warnings };
}

module.exports = {
    DEFAULT_TRACKS,
    PROGRAM_DEFAULTS,
    deriveFocus,
    deriveFormat,
    parseLocation,
    normalizeProgram,
    normalizeLegacyPrograms,
    dedupeArray
};

