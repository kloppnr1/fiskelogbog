import type { Trip } from '../types';
import {
  IconFish, IconTemp, IconWave, IconWind, IconPressure,
  IconMoon, IconClock, IconPin,
} from './Icons';
import { PhotoCarousel } from './PhotoCarousel';
import { TrendPanel } from './Sparkline';
import { LureSection } from './LureSection';
import { inferTargetSpecies } from '../data/spots';

const MONTHS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];
const WEEKDAYS = ['son','man','tir','ons','tor','fre','lor'];

function fmtDate(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return `${WEEKDAYS[dt.getDay()]} ${dt.getDate()}. ${MONTHS[dt.getMonth()].toLowerCase()}`;
}

export interface PhotoTripCardProps {
  trip: Trip;
  onPhoto: (data: { photos: string[]; idx: number }) => void;
}

export function PhotoTripCard({ trip, onPhoto }: PhotoTripCardProps) {
  const hasCatch = trip.totalCatch > 0;
  const hasWeather = trip.weather.tempC !== undefined || trip.weather.waterTempC !== undefined;
  const hasLures = trip.lures.some(l => l.model || l.type);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/80">
      {/* Photo carousel with overlay */}
      <div className="relative">
        <PhotoCarousel photos={trip.photos} coverPhoto={trip.coverPhoto} onPhoto={(_, i) => onPhoto({ photos: trip.photos.map(p => `photos/${p}`), idx: i })} />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between pointer-events-none">
          <div>
            <div className="text-white/60 text-[11px] font-medium tracking-wide">{fmtDate(trip.date)}</div>
            <div className="text-white text-sm font-bold mt-0.5 flex items-center gap-1.5">
              <IconPin className="w-3.5 h-3.5 text-white/70" />
              {trip.spot}
              {trip.isGuess && <span className="text-[8px] bg-amber-400/80 text-amber-900 px-1.5 py-px rounded-sm font-bold uppercase tracking-wide">gaet</span>}
            </div>
          </div>
          {hasCatch ? (
            <span className="flex items-center gap-1 bg-teal-500/90 backdrop-blur-sm text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <IconFish className="w-3.5 h-3.5" />{trip.totalCatch}
            </span>
          ) : (
            <span className="bg-white/15 backdrop-blur-sm text-white/70 text-[11px] font-medium px-2.5 py-1 rounded-full">nul-tur</span>
          )}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Catches */}
        {hasCatch && (
          <div className="flex flex-wrap gap-1.5">
            {trip.catches.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 text-xs px-2.5 py-1 rounded-lg font-semibold border border-teal-100">
                <IconFish className="w-3.5 h-3.5" />{c.count}x {c.species}
                {c.sizeCm && <span className="text-teal-400 font-normal">({c.sizeCm}cm)</span>}
                {c.released && <span className="text-amber-500 text-[10px] font-normal">genudsat</span>}
              </span>
            ))}
          </div>
        )}

        {/* Lures — collapsed, show first only */}
        {hasLures && <LureSection lures={trip.lures} />}

        {/* Weather — more prominent grid */}
        {hasWeather && (
          <div className="bg-sky-50/70 rounded-xl px-3.5 py-2.5 border border-sky-100">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {trip.weather.tempC !== undefined && (
                <div className="flex items-center gap-2">
                  <IconTemp className="w-4 h-4 text-sky-400" />
                  <div>
                    <div className="text-sm font-bold text-slate-700">{trip.weather.tempC}°C</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wide">Luft</div>
                  </div>
                </div>
              )}
              {trip.weather.waterTempC !== undefined && (
                <div className="flex items-center gap-2">
                  <IconWave className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="text-sm font-bold text-slate-700">{trip.weather.waterTempC}°C</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wide">Vand</div>
                  </div>
                </div>
              )}
              {trip.weather.windMs !== undefined && (
                <div className="flex items-center gap-2">
                  <IconWind className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="text-sm font-bold text-slate-700">{trip.weather.windDir} {trip.weather.windMs} m/s</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wide">Vind</div>
                  </div>
                </div>
              )}
              {trip.weather.pressureHpa !== undefined && (
                <div className="flex items-center gap-2">
                  <IconPressure className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="text-sm font-bold text-slate-700">{trip.weather.pressureHpa} hPa</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wide">Tryk</div>
                  </div>
                </div>
              )}
              {trip.weather.moonPhase && (
                <div className="flex items-center gap-2">
                  <IconMoon phase={trip.weather.moonPhase} className="w-4 h-4 text-indigo-300" />
                  <div>
                    <div className="text-sm font-bold text-slate-700">{trip.weather.moonPct}%</div>
                    <div className="text-[9px] text-slate-400 uppercase tracking-wide">Mane</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weather trend sparklines */}
        {trip.weather.trend && (
          <TrendPanel trend={trip.weather.trend} species={inferTargetSpecies(trip)} waterTempC={trip.weather.waterTempC} />
        )}

        {/* Time */}
        {trip.timeStart && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <IconClock className="w-3 h-3" />{trip.timeStart} – {trip.timeEnd || '?'}
          </div>
        )}
      </div>
    </div>
  );
}
