import type { LegacyProgram, Program } from '../types/Program';

const AGE_RANGE_REGEX = /(?<min>\d+)\s*[-–]\s*(?<max>\d+)/;

function parseAgeRange(value?: string): { min?: number; max?: number } {
  if (!value) return {};
  const match = value.match(AGE_RANGE_REGEX);
  if (!match || !match.groups) return {};
  return {
    min: Number(match.groups.min),
    max: Number(match.groups.max),
  };
}

function normalizeInsurance(
  insurance: LegacyProgram['insurance'],
): string | undefined {
  if (!insurance) return undefined;
  if (Array.isArray(insurance)) {
    return insurance.find(Boolean) ?? insurance[0];
  }
  return insurance;
}

function computeAvailability(program: LegacyProgram): string | undefined {
  if (typeof program.availabilityDays === 'number') {
    if (program.availabilityDays <= 0) {
      return 'Immediate availability';
    }
    if (program.availabilityDays === 1) {
      return 'Starts in 1 day';
    }
    return `Starts in ${program.availabilityDays} days`;
  }
  return undefined;
}

function createId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `program-${Math.random().toString(36).slice(2, 10)}`;
}

function isValidCoordinate(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value)
  );
}

function isValidLatitude(lat: number): boolean {
  return lat >= -90 && lat <= 90;
}

function isValidLongitude(lng: number): boolean {
  return lng >= -180 && lng <= 180;
}

export function adaptProgram(program: LegacyProgram): Program | null {
  if (!program) return null;
  const lat =
    program.location?.lat ??
    program.coordinates?.lat ??
    (Array.isArray((program as { coordinates?: number[] })?.coordinates)
      ? (program as { coordinates?: number[] }).coordinates?.[0]
      : undefined);
  const lng =
    program.location?.lng ??
    program.coordinates?.lng ??
    (Array.isArray((program as { coordinates?: number[] })?.coordinates)
      ? (program as { coordinates?: number[] }).coordinates?.[1]
      : undefined);

  // Strict validation: must be valid numbers, not NaN, finite, and within valid ranges
  if (
    !isValidCoordinate(lat) ||
    !isValidCoordinate(lng) ||
    !isValidLatitude(lat) ||
    !isValidLongitude(lng)
  ) {
    return null;
  }

  const { min: ageMin, max: ageMax } = parseAgeRange(
    program.population?.ages as string | undefined,
  );
  const tags = program.tags ?? [];
  const description = program.summary || program.overview || program.description;

  return {
    id: program.id ?? createId(),
    name: program.name ?? 'Program',
    lat,
    lng,
    city: program.location?.city,
    state: program.location?.state,
    levelOfCare:
      program.levelOfCare ||
      program.focus ||
      program.format ||
      'Program',
    format: program.format || program.deliveryFormat || program.formatLabel,
    insuranceAlignment: normalizeInsurance(program.insurance),
    ageMin,
    ageMax,
    availability: computeAvailability(program),
    description: typeof description === 'string' ? description : undefined,
    tags: Array.isArray(tags) ? tags : undefined,
    phone: program.contacts?.phone || program.phone,
    website: program.contacts?.website || program.website,
    address: program.location?.address || program.address,
    focus: program.focus,
  };
}

async function fetchProgramsFromJson(): Promise<LegacyProgram[]> {
  const response = await fetch(
    new URL('./programs.v2.json', window.location.href).toString(),
  );
  if (!response.ok) {
    throw new Error(`Failed to load programs.v2.json (${response.status})`);
  }
  return (await response.json()) as LegacyProgram[];
}

function coerceGlobalPrograms(): LegacyProgram[] | null {
  const globalPrograms = window.programsData;
  if (!globalPrograms) return null;
  if (Array.isArray(globalPrograms)) {
    return globalPrograms as LegacyProgram[];
  }
  if (
    typeof globalPrograms === 'object' &&
    Array.isArray((globalPrograms as { programs?: unknown[] }).programs)
  ) {
    return (globalPrograms as { programs: LegacyProgram[] }).programs;
  }
  return null;
}

export async function loadPrograms(): Promise<Program[]> {
  const globalPrograms = coerceGlobalPrograms();
  const source = globalPrograms ?? (await fetchProgramsFromJson());

  const adapted = source
    .map(adaptProgram)
    .filter((program): program is Program => Boolean(program));

  return adapted;
}

