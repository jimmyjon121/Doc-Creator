import React from 'react';
import {
  AGE_GROUP_FILTERS,
  type AgeGroupFilter,
  FORMAT_FILTERS,
  INSURANCE_FILTERS,
  LEVEL_OF_CARE_FILTERS,
} from './constants';

export type FiltersState = {
  searchTerm: string;
  levels: string[];
  formats: string[];
  insurance: string[];
  ageGroup: AgeGroupFilter;
};

interface FiltersBarProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
}

const chipBase =
  'px-3 py-1 rounded-full text-xs font-semibold transition-colors border cursor-pointer';

function toggleValue(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const FiltersBar: React.FC<FiltersBarProps> = ({ filters, onChange }) => {
  const updateFilters = (partial: Partial<FiltersState>) => {
    onChange({ ...filters, ...partial });
  };

  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-[1000] flex w-full max-w-4xl -translate-x-1/2 flex-col gap-2 rounded-2xl border border-white/15 bg-white/80 px-5 py-4 text-slate-800 shadow-xl backdrop-blur">
      <input
        type="search"
        value={filters.searchTerm}
        onChange={(event) => updateFilters({ searchTerm: event.target.value })}
        placeholder="Search programs, modalities, or locations..."
        className="w-full rounded-full border border-slate-200 bg-white/80 px-5 py-2 text-sm text-slate-700 outline-none transition-shadow focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(76,91,255,0.15)]"
      />

      <div className="flex flex-wrap items-center gap-2">
        {LEVEL_OF_CARE_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`${chipBase} ${
              filters.levels.includes(item)
                ? 'border-indigo-500 bg-indigo-500 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => updateFilters({ levels: toggleValue(filters.levels, item) })}
          >
            {item}
          </button>
        ))}

        {FORMAT_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`${chipBase} ${
              filters.formats.includes(item)
                ? 'border-sky-500 bg-sky-500 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => updateFilters({ formats: toggleValue(filters.formats, item) })}
          >
            {item}
          </button>
        ))}

        {INSURANCE_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`${chipBase} ${
              filters.insurance.includes(item)
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() =>
              updateFilters({ insurance: toggleValue(filters.insurance, item) })
            }
          >
            {item}
          </button>
        ))}

        {AGE_GROUP_FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            className={`${chipBase} ${
              filters.ageGroup === item
                ? 'border-violet-500 bg-violet-500 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
            }`}
            onClick={() => updateFilters({ ageGroup: item })}
          >
            Ages {item}
          </button>
        ))}
      </div>
    </div>
  );
};

