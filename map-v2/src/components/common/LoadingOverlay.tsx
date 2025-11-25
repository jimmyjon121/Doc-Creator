import React from 'react';

interface LoadingOverlayProps {
  label?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ label = 'Loading…' }) => (
  <div className="pointer-events-none absolute inset-0 z-[900] flex items-center justify-center rounded-[24px] bg-slate-950/40 backdrop-blur">
    <div className="flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white shadow-lg">
      <span className="h-3 w-3 animate-pulse rounded-full bg-indigo-400" />
      {label}
    </div>
  </div>
);

