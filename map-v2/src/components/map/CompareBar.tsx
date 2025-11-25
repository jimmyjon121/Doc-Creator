import React from 'react';
import type { Program } from '../../types/Program';
import { getProgramColor } from './constants';

interface CompareBarProps {
  programs: Program[];
  onRemove: (programId: string) => void;
  onSelect: (program: Program) => void;
  onClear: () => void;
}

export const CompareBar: React.FC<CompareBarProps> = ({
  programs,
  onRemove,
  onSelect,
  onClear,
}) => {
  if (!programs.length) {
    return null;
  }

  return (
    <section className="pointer-events-auto fixed bottom-5 left-1/2 z-[1050] w-full max-w-4xl -translate-x-1/2 rounded-2xl border border-white/10 bg-white/90 p-4 text-slate-800 shadow-2xl backdrop-blur">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Compare ({programs.length})</span>
        <button type="button" className="text-slate-500 hover:text-slate-700" onClick={onClear}>
          Clear all
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {programs.map((program) => (
          <button
            key={program.id}
            type="button"
            className="flex min-w-[180px] flex-1 items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-left text-xs text-slate-700 transition hover:border-indigo-300 hover:bg-white"
            onClick={() => onSelect(program)}
          >
            <div
              className="mt-1 h-6 w-6 shrink-0 rounded-full"
              style={{ background: getProgramColor(program) }}
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="line-clamp-1 font-semibold text-slate-900">{program.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {[program.city, program.state].filter(Boolean).join(', ')}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${program.name} from compare`}
                  className="text-[10px] text-slate-400 hover:text-slate-700"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(program.id);
                  }}
                >
                  ✕
                </button>
              </div>
              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-slate-500">
                <span className="rounded-full bg-slate-100 px-2 py-0.5">
                  {program.levelOfCare}
                </span>
                {program.insuranceAlignment && (
                  <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
                    {program.insuranceAlignment}
                  </span>
                )}
                {program.availability && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-green-700">
                    {program.availability}
                  </span>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
};

