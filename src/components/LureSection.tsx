import { useState } from 'react';
import type { Trip } from '../types';
import { IconHook } from './Icons';

export interface LureSectionProps {
  lures: Trip['lures'];
}

export function LureSection({ lures }: LureSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const filtered = lures.filter(l => l.model || l.type);
  if (filtered.length === 0) return null;

  const first = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100">
      <div className="flex items-center gap-1.5 mb-1.5">
        <IconHook className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Agn</span>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-medium shadow-sm">
          {first.model || first.type}{first.weightG ? ` ${first.weightG}g` : ''}{first.color ? <span className="text-slate-400 ml-0.5">· {first.color}</span> : ''}
        </span>
        {rest.length > 0 && !expanded && (
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
            className="inline-flex items-center text-[10px] text-slate-400 hover:text-slate-600 font-semibold px-2 py-1 rounded-lg hover:bg-white/60 transition-colors cursor-pointer"
          >
            +{rest.length} mere
          </button>
        )}
        {expanded && rest.map((l, i) => (
          <span key={i} className="inline-flex items-center gap-1 text-xs text-slate-600 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-medium shadow-sm animate-fade-in">
            {l.model || l.type}{l.weightG ? ` ${l.weightG}g` : ''}{l.color ? <span className="text-slate-400 ml-0.5">· {l.color}</span> : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
