import type { Program } from '../../types/Program';

export const LEVEL_OF_CARE_FILTERS = [
  'Residential Treatment',
  'RTC',
  'PHP',
  'IOP',
  'Wilderness',
  'Transitional',
  'Virtual',
  'Day Treatment',
];

export const FORMAT_FILTERS = ['In-Person', 'Hybrid', 'Virtual'];

export const INSURANCE_FILTERS = [
  'In-Network',
  'OON',
  'OON with Negotiation',
  'Scholarship Track',
];

export const AGE_GROUP_FILTERS = ['All', '11–13', '14–17', '18–24'] as const;

export type AgeGroupFilter = (typeof AGE_GROUP_FILTERS)[number];

export const LEVEL_OF_CARE_COLORS: Record<string, string> = {
  RTC: '#7AC47A',
  'Residential Treatment': '#7AC47A',
  PHP: '#FF9D4D',
  IOP: '#4AA8FF',
  Wilderness: '#59C2A8',
  Transitional: '#F6D860',
  Virtual: '#A0A0A0',
  'Day Treatment': '#8B5CF6',
};

export const DEFAULT_MARKER_COLOR = '#4c5bff';

export function getProgramColor(program: Program): string {
  const level = program.levelOfCare.trim();
  if (LEVEL_OF_CARE_COLORS[level]) {
    return LEVEL_OF_CARE_COLORS[level];
  }

  const key = level.toUpperCase();
  return LEVEL_OF_CARE_COLORS[key] ?? DEFAULT_MARKER_COLOR;
}

export function programMatchesAgeGroup(
  program: Program,
  filter: AgeGroupFilter,
): boolean {
  if (filter === 'All') {
    return true;
  }
  if (typeof program.ageMin !== 'number' || typeof program.ageMax !== 'number') {
    return true;
  }

  switch (filter) {
    case '11–13':
      return program.ageMin <= 13 && program.ageMax >= 11;
    case '14–17':
      return program.ageMin <= 17 && program.ageMax >= 14;
    case '18–24':
      return program.ageMin <= 24 && program.ageMax >= 18;
    default:
      return true;
  }
}

