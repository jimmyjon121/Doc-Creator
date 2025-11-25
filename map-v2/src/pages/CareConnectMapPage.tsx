import React, { useEffect, useMemo, useState } from 'react';
import { loadPrograms } from '../data/programDatabase';
import type { Program, ProgramId } from '../types/Program';
import { FiltersBar, type FiltersState } from '../components/map/FiltersBar';
import { ProgramMap } from '../components/map/ProgramMap';
import { ProgramDrawer } from '../components/map/ProgramDrawer';
import { CompareBar } from '../components/map/CompareBar';
import { LoadingOverlay } from '../components/common/LoadingOverlay';
import { filterPrograms } from '../utils/filterPrograms';

const LOCAL_PLAN_KEY = 'careconnect-map-plan';
const LOCAL_COMPARE_KEY = 'careconnect-map-compare';

export const DEFAULT_FILTERS: FiltersState = {
  searchTerm: '',
  levels: [],
  formats: [],
  insurance: [],
  ageGroup: 'All',
};

function readStoredIds(key: string): ProgramId[] {
  try {
    const value = localStorage.getItem(key);
    if (!value) return [];
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export interface CareConnectMapPageProps {
  programs?: Program[];
  initialFilters?: FiltersState;
  onFiltersChange?: (filters: FiltersState) => void;
}

export const CareConnectMapPage: React.FC<CareConnectMapPageProps> = ({
  programs: providedPrograms,
  initialFilters = DEFAULT_FILTERS,
  onFiltersChange,
}) => {
  const [programs, setPrograms] = useState<Program[]>(providedPrograms ?? []);
  const [loading, setLoading] = useState(!providedPrograms);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [planIds, setPlanIds] = useState<ProgramId[]>(() => readStoredIds(LOCAL_PLAN_KEY));
  const [compareIds, setCompareIds] = useState<ProgramId[]>(() =>
    readStoredIds(LOCAL_COMPARE_KEY),
  );

  useEffect(() => {
    if (typeof onFiltersChange === 'function') {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  // Validate program coordinates
  function isValidProgram(program: Program): boolean {
    if (!program) return false;
    const lat = program.lat;
    const lng = program.lng;
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !Number.isNaN(lat) &&
      !Number.isNaN(lng) &&
      Number.isFinite(lat) &&
      Number.isFinite(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    );
  }

  useEffect(() => {
    if (providedPrograms) {
      // Filter out programs with invalid coordinates
      const validPrograms = providedPrograms.filter(isValidProgram);
      if (validPrograms.length < providedPrograms.length) {
        console.warn(
          `[Map V2] Filtered out ${providedPrograms.length - validPrograms.length} programs with invalid coordinates`,
        );
      }
      setPrograms(validPrograms);
      setLoading(false);
      return;
    }
    loadPrograms()
      .then((data) => {
        // Double-check loaded programs are valid
        const validPrograms = data.filter(isValidProgram);
        if (validPrograms.length < data.length) {
          console.warn(
            `[Map V2] Filtered out ${data.length - validPrograms.length} programs with invalid coordinates`,
          );
        }
        setPrograms(validPrograms);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [providedPrograms]);

  const filteredPrograms = useMemo(
    () => filterPrograms(programs, filters),
    [programs, filters],
  );

  const planPrograms = useMemo(
    () => planIds.map((id) => programs.find((program) => program.id === id)).filter(Boolean) as Program[],
    [planIds, programs],
  );

  const comparePrograms = useMemo(
    () =>
      compareIds
        .map((id) => programs.find((program) => program.id === id))
        .filter(Boolean) as Program[],
    [compareIds, programs],
  );

  useEffect(() => {
    localStorage.setItem(LOCAL_PLAN_KEY, JSON.stringify(planIds));
  }, [planIds]);

  useEffect(() => {
    localStorage.setItem(LOCAL_COMPARE_KEY, JSON.stringify(compareIds));
  }, [compareIds]);

  const handleProgramClick = (program: Program | null) => {
    setSelectedProgram(program);
    setDrawerOpen(Boolean(program));
  };

  const handleAddToPlan = (program: Program) => {
    setPlanIds((previous) => (previous.includes(program.id) ? previous : [...previous, program.id]));
    try {
      window.eventBus?.emit?.('programs-docs:add-program', {
        programId: program.id,
        lane: 'stabilize',
      });
    } catch (err) {
      console.warn('Failed to notify host app about add-to-plan', err);
    }
  };

  const handleToggleCompare = (program: Program) => {
    setCompareIds((previous) => {
      if (previous.includes(program.id)) {
        return previous.filter((id) => id !== program.id);
      }
      if (previous.length >= 4) {
        return [...previous.slice(1), program.id];
      }
      return [...previous, program.id];
    });
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-transparent text-white">
      <div className="relative flex w-full max-w-6xl flex-col gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 text-white shadow-glass backdrop-blur-xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">
              CareConnect
            </p>
            <h1 className="text-2xl font-semibold text-white">Programs + Aftercare Map</h1>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <button
              type="button"
              className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white"
            >
              Map
            </button>
            <button
              type="button"
              className="rounded-full bg-white/0 px-4 py-2 font-semibold text-slate-400 hover:bg-white/10 hover:text-white"
            >
              List
            </button>
          </div>
        </header>

        <div className="relative min-h-[520px] w-full rounded-[24px] border border-white/5 bg-slate-950/40">
          {loading && <LoadingOverlay label="Loading programs…" />}
          {!loading && error && (
            <div className="flex h-full items-center justify-center text-sm text-slate-200">
              {error}
            </div>
          )}
          {!loading && !error && (
            <ProgramMap programs={filteredPrograms} onProgramClick={handleProgramClick} />
          )}
          <FiltersBar filters={filters} onChange={setFilters} />
        </div>

        {planPrograms.length > 0 && (
          <section className="flex flex-wrap gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-xs text-slate-200">
            <span className="font-semibold uppercase tracking-wide text-slate-400">Plan</span>
            <div className="flex flex-wrap gap-2">
              {planPrograms.map((program) => (
                <span key={program.id} className="rounded-full bg-white/10 px-3 py-1 text-white">
                  {program.name}
                </span>
              ))}
            </div>
          </section>
        )}

        <CompareBar
          programs={comparePrograms}
          onRemove={(programId) => setCompareIds((previous) => previous.filter((id) => id !== programId))}
          onSelect={(program) => handleProgramClick(program)}
          onClear={() => setCompareIds([])}
        />

        <ProgramDrawer
          program={selectedProgram}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          onAddToPlan={handleAddToPlan}
          onToggleCompare={handleToggleCompare}
          isInCompare={(programId) => compareIds.includes(programId)}
        />
      </div>
    </div>
  );
};

