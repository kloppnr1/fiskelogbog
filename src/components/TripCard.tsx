import { useState } from 'react';
import type { Trip } from '../data/trips';

const WEEKDAYS = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MOON: Record<string, string> = {
  new_moon: '🌑', waxing_crescent: '🌒', first_quarter: '🌓', waxing_gibbous: '🌔',
  full_moon: '🌕', waning_gibbous: '🌖', last_quarter: '🌗', waning_crescent: '🌘',
};

function formatDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return `${WEEKDAYS[dt.getDay()]} ${dt.getDate()}. ${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

interface Props {
  trip: Trip;
  onPhoto: (src: string) => void;
}

export function TripCard({ trip, onPhoto }: Props) {
  const [open, setOpen] = useState(false);
  const hasCatch = trip.totalCatch > 0;

  return (
    <article
      className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
        open ? 'border-sea-300 shadow-md' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
      }`}
    >
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none"
        onClick={() => setOpen(!open)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <time className="font-bold text-[15px] text-slate-800">{formatDate(trip.date)}</time>
            {trip.timeStart && (
              <span className="text-xs text-slate-400">
                {trip.timeStart}–{trip.timeEnd || '?'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm text-slate-500">{trip.spot}</span>
            {trip.isGuess && (
              <span className="text-[9px] font-bold bg-amber-100 text-amber-600 px-1 py-px rounded uppercase">
                gæt
              </span>
            )}
          </div>
        </div>

        {hasCatch ? (
          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
            {trip.totalCatch} fisk
          </span>
        ) : (
          <span className="shrink-0 px-3 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-400 border border-slate-100">
            nul-tur
          </span>
        )}

        <svg
          className={`w-4 h-4 text-slate-300 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {open && (
        <div className="px-5 pb-5 border-t border-slate-50 animate-fade-in">
          {/* Weather pills */}
          {(trip.weather.tempC !== undefined || trip.weather.waterTempC !== undefined) && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {trip.weather.tempC !== undefined && (
                <span className="inline-flex items-center gap-1 bg-sky-50 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-sky-100">
                  🌡 {trip.weather.tempC}°
                </span>
              )}
              {trip.weather.waterTempC !== undefined && (
                <span className="inline-flex items-center gap-1 bg-cyan-50 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-cyan-100">
                  🌊 {trip.weather.waterTempC}°
                </span>
              )}
              {trip.weather.windMs !== undefined && (
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-slate-100">
                  💨 {trip.weather.windDir} {trip.weather.windMs}m/s
                </span>
              )}
              {trip.weather.pressureHpa !== undefined && (
                <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-slate-100">
                  📊 {trip.weather.pressureHpa}hPa
                </span>
              )}
              {trip.weather.moonPhase && (
                <span className="inline-flex items-center gap-1 bg-indigo-50 text-slate-600 text-xs px-2.5 py-1 rounded-lg border border-indigo-100">
                  {MOON[trip.weather.moonPhase] || '🌙'} {trip.weather.moonPct}%
                </span>
              )}
            </div>
          )}

          {/* Catches */}
          {hasCatch && (
            <div className="mt-3 bg-emerald-50/60 border border-emerald-100 rounded-lg px-4 py-2.5">
              <div className="text-xs font-bold text-emerald-600 mb-0.5">🐟 Fangst</div>
              <div className="text-sm text-slate-700">
                {trip.catches.map((c, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {c.count}× {c.species}
                    {c.sizeCm && ` (${c.sizeCm}cm)`}
                    {c.released && ' ↩️'}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Lures */}
          {trip.lures.length > 0 && trip.lures.some(l => l.model || l.type) && (
            <div className="mt-2 bg-sky-50/60 border border-sky-100 rounded-lg px-4 py-2.5">
              <div className="text-xs font-bold text-sky-600 mb-0.5">🎣 Agn</div>
              <div className="text-sm text-slate-700">
                {trip.lures.filter(l => l.model || l.type).map((l, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {l.model || l.type}
                    {l.weightG && ` ${l.weightG}g`}
                    {l.color && ` ${l.color}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {trip.notes && (
            <p className="mt-2 text-xs text-slate-400 italic">{trip.notes}</p>
          )}

          {/* Photos */}
          {trip.photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-3">
              {trip.photos.map((p, i) => (
                <img
                  key={i}
                  src={`photos/${p}`}
                  alt=""
                  loading="lazy"
                  className="w-full h-28 sm:h-36 object-cover rounded-lg cursor-pointer border border-slate-100 hover:scale-[1.02] transition-transform"
                  onClick={(e) => { e.stopPropagation(); onPhoto(`photos/${p}`); }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
