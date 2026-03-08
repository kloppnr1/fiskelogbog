import { LogoMark } from './Icons';

const MONTHS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
const WEEKDAYS = ['son','man','tir','ons','tor','fre','lor'];

function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return `${WEEKDAYS[dt.getDay()]} ${dt.getDate()}. ${MONTHS[dt.getMonth()].toLowerCase()}`;
}

export interface HeaderProps {
  totalTrips: number;
  totalCatch: number;
  catchTrips: number;
  spotCount: number;
  bestTrip: { totalCatch: number; date: string } | null;
}

export function Header({ totalTrips, totalCatch, catchTrips, spotCount, bestTrip }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-100">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <LogoMark className="w-12 h-12 text-teal-600" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-none">
                Fiskelogbog
              </h1>
              <p className="text-slate-400 text-sm font-medium mt-0.5">Aarhus & omegn · Jul 2025 – Mar 2026</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-4xl font-extrabold text-slate-800 tracking-tight">{totalCatch}</div>
            <div className="text-[10px] uppercase tracking-[2px] text-slate-400 font-semibold">fisk fanget</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 mt-8">
          {[
            { n: totalTrips, l: 'Ture', sub: '' },
            { n: catchTrips, l: 'Med fisk', sub: `${Math.round(catchTrips/totalTrips*100)}% rate` },
            { n: spotCount, l: 'Spots', sub: '' },
            { n: bestTrip?.totalCatch || 0, l: 'Bedste dag', sub: bestTrip ? fmtDate(bestTrip.date) : '' },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">{s.n}</div>
              <div className="text-[10px] uppercase tracking-[1.5px] text-slate-400 font-semibold mt-0.5">{s.l}</div>
              {s.sub && <div className="text-[10px] text-slate-300 mt-0.5">{s.sub}</div>}
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}
