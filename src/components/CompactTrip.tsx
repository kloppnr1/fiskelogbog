import type { Trip } from '../types';
import { IconFish, IconPin } from './Icons';

const WEEKDAYS = ['son','man','tir','ons','tor','fre','lor'];

export interface CompactTripProps {
  trip: Trip;
}

export function CompactTrip({ trip }: CompactTripProps) {
  const dt = new Date(trip.date + 'T12:00:00');
  return (
    <div className="flex items-center gap-3 py-2.5 px-1 border-b border-slate-50 last:border-0">
      <div className="w-8 text-center">
        <div className="text-base font-bold text-slate-600">{dt.getDate()}</div>
        <div className="text-[9px] uppercase text-slate-400 font-medium">{WEEKDAYS[dt.getDay()]}</div>
      </div>
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <IconPin className="w-3 h-3 text-slate-300 shrink-0" />
        <span className="text-sm font-medium text-slate-500 truncate">{trip.spot}</span>
        {trip.isGuess && <span className="text-[7px] bg-amber-100 text-amber-600 px-1 rounded font-bold shrink-0">?</span>}
      </div>
      {trip.totalCatch > 0 ? (
        <span className="flex items-center gap-1 text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
          <IconFish className="w-3 h-3" />{trip.totalCatch}
        </span>
      ) : (
        <span className="text-[10px] text-slate-300 italic">nul</span>
      )}
    </div>
  );
}
