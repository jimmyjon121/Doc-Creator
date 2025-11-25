import React from 'react';
import type { Program } from '../../types/Program';
import { getProgramColor } from './constants';

interface ProgramDrawerProps {
  program: Program | null;
  open: boolean;
  onClose: () => void;
  onAddToPlan: (program: Program) => void;
  onToggleCompare: (program: Program) => void;
  isInCompare: (programId: string) => boolean;
}

export const ProgramDrawer: React.FC<ProgramDrawerProps> = ({
  program,
  open,
  onClose,
  onAddToPlan,
  onToggleCompare,
  isInCompare,
}) => {
  if (!program) return null;

  const compareSelected = isInCompare(program.id);
  const color = getProgramColor(program);

  return (
    <aside
      className={`pointer-events-auto fixed right-0 top-0 z-[1100] h-full w-full max-w-md transform bg-white/95 text-slate-800 shadow-2xl transition-transform duration-300 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col gap-4 px-6 pb-8 pt-10">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 hover:bg-slate-100"
        >
          Close
        </button>

        <div className="flex items-center gap-4">
          <div
            className="h-12 w-12 rounded-2xl"
            style={{ background: color, boxShadow: '0 12px 24px rgba(0,0,0,0.15)' }}
          />
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{program.name}</h2>
            <p className="text-sm text-slate-500">
              {[program.city, program.state].filter(Boolean).join(', ')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-slate-600">
          <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
            {program.levelOfCare}
          </span>
          {program.format && (
            <span className="rounded-full bg-slate-100 px-3 py-1">{program.format}</span>
          )}
          {program.insuranceAlignment && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
              {program.insuranceAlignment}
            </span>
          )}
          {typeof program.ageMin === 'number' && typeof program.ageMax === 'number' && (
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-indigo-700">
              Ages {program.ageMin}–{program.ageMax}
            </span>
          )}
          {program.availability && (
            <span className="rounded-full bg-green-50 px-3 py-1 text-green-700">
              {program.availability}
            </span>
          )}
        </div>

        {program.description && (
          <p className="text-sm leading-relaxed text-slate-700">{program.description}</p>
        )}

        {program.tags && program.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px] text-slate-500">
            {program.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2 py-1">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="space-y-1 rounded-2xl border border-slate-100 bg-white px-4 py-3 text-sm text-slate-600">
          {program.phone && (
            <div>
              <span className="font-semibold">Phone:</span>{' '}
              <a href={`tel:${program.phone}`} className="text-indigo-600 hover:underline">
                {program.phone}
              </a>
            </div>
          )}
          {program.website && (
            <div>
              <span className="font-semibold">Website:</span>{' '}
              <a
                href={program.website}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-600 hover:underline"
              >
                {program.website}
              </a>
            </div>
          )}
          {program.address && (
            <div>
              <span className="font-semibold">Address:</span> {program.address}
            </div>
          )}
        </div>

        <div className="mt-auto flex flex-col gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => onAddToPlan(program)}
            className="rounded-full bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
          >
            Add to Plan
          </button>
          <button
            type="button"
            onClick={() => onToggleCompare(program)}
            className={`rounded-full border px-4 py-3 text-sm font-semibold transition ${
              compareSelected
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {compareSelected ? 'Remove from Compare' : 'Add to Compare'}
          </button>
        </div>
      </div>
    </aside>
  );
};

