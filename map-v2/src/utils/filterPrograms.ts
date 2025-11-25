import type { Program } from '../types/Program';
import type { FiltersState } from '../components/map/FiltersBar';
import { programMatchesAgeGroup } from '../components/map/constants';

export function filterPrograms(programs: Program[], filters: FiltersState): Program[] {
  const search = filters.searchTerm.trim().toLowerCase();
  return programs.filter((program) => {
    if (filters.levels.length && !filters.levels.includes(program.levelOfCare)) {
      return false;
    }
    if (filters.formats.length && program.format && !filters.formats.includes(program.format)) {
      return false;
    }
    if (
      filters.insurance.length &&
      program.insuranceAlignment &&
      !filters.insurance.includes(program.insuranceAlignment)
    ) {
      return false;
    }
    if (!programMatchesAgeGroup(program, filters.ageGroup)) {
      return false;
    }
    if (search) {
      const haystack = [
        program.name,
        program.city,
        program.state,
        program.description,
        program.focus,
        ...(program.tags ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }
    return true;
  });
}

