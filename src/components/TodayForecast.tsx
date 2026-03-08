import { useState, useEffect } from 'react';
import { IconFish } from './Icons';
import { TrendGraph } from './TrendGraph';
import {
  fetchForecast, windDirToLabel, sunTimes, valueAtTime,
} from '../services/weather';
import type { ForecastData, HourlyPoint, SpotConfig } from '../types';
import { SPOTS } from '../data/spots';

const WEEKDAYS = ['søn', 'man', 'tir', 'ons', 'tor', 'fre', 'lør'];

// ─── Time axis ───

function TimeAxis({ data, nowTime }: { data: HourlyPoint[]; nowTime: string }) {
  if (data.length < 2) return null;

  const times = data.map(d => new Date(d.time).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tRange = tMax - tMin || 1;
  const nowMs = new Date(nowTime).getTime();
  const todayKey = new Date(nowMs).toISOString().slice(0, 10);

  const dayLabels: { pct: number; label: string; isToday: boolean }[] = [];
  const seen = new Set<string>();

  for (const t of times) {
    const d = new Date(t);
    if (d.getUTCHours() !== 0) continue;
    const dayKey = d.toISOString().slice(0, 10);
    if (seen.has(dayKey)) continue;
    seen.add(dayKey);
    const pct = ((t - tMin) / tRange) * 100;
    if (pct < 1 || pct > 99) continue;
    dayLabels.push({
      pct,
      label: dayKey === todayKey ? 'I DAG' : WEEKDAYS[d.getDay()].toUpperCase(),
      isToday: dayKey === todayKey,
    });
  }

  return (
    <div className="relative h-6 ml-[80px]">
      {dayLabels.map((d, i) => (
        <span key={i}
          className={`absolute text-[12px] font-extrabold tracking-wider ${d.isToday ? 'text-sky-600' : 'text-slate-400'}`}
          style={{ left: `${d.pct}%`, transform: 'translateX(-50%)' }}>
          {d.label}
        </span>
      ))}
    </div>
  );
}

// ─── Sun times ───

function SunTimesBar({ data }: { data: ForecastData }) {
  const today = new Date();
  const sun = sunTimes(today);
  const { marine, air } = data;

  const toCET = (utc: string) => {
    const [hh, mm] = utc.split(':').map(Number);
    return `${((hh + 1) % 24).toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  };

  const timePoints = [
    { emoji: '🌅', label: 'Solopgang', time: sun.rise, cetLabel: toCET(sun.rise) },
    { emoji: '☀️', label: 'Middag', time: sun.noon, cetLabel: toCET(sun.noon) },
    { emoji: '🌇', label: 'Solnedgang', time: sun.set, cetLabel: toCET(sun.set) },
  ];

  return (
    <div className="flex justify-center gap-6 sm:gap-10 mb-3 py-2 bg-slate-50/70 rounded-xl">
      {timePoints.map(tp => {
        const wt = valueAtTime(marine.waterTemp, today, tp.time);
        const wl = valueAtTime(marine.waterLevel, today, tp.time);
        const windData = air.wind.map(w => ({ time: w.time, value: w.speed }));
        const wind = valueAtTime(windData, today, tp.time);
        const cloud = valueAtTime(air.cloudCover, today, tp.time);

        return (
          <div key={tp.label} className="text-center">
            <div className="text-[12px] text-slate-500">{tp.emoji} {tp.label}</div>
            <div className="text-[16px] font-extrabold text-slate-700">{tp.cetLabel}</div>
            <div className="flex items-center gap-2 mt-1 justify-center flex-wrap">
              {wt !== undefined && <span className="text-[11px] text-cyan-600 font-bold">{wt}°C</span>}
              {wl !== undefined && <span className="text-[11px] text-sky-500 font-bold">{wl > 0 ? '+' : ''}{wl}cm</span>}
              {wind !== undefined && <span className="text-[11px] text-amber-600 font-bold">{wind}m/s</span>}
              {cloud !== undefined && <span className="text-[11px] text-slate-400 font-medium">{Math.round(cloud)}%☁</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SpotSection ───

function SpotSection({ spot, data, nowTime }: { spot: SpotConfig; data: ForecastData; nowTime: string }) {
  const [expanded, setExpanded] = useState(false);
  const { marine, air, current } = data;
  const isFreshwater = spot.type === 'sø';
  const h = 50;

  return (
    <div className="border border-slate-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors text-left"
      >
        <span className={`text-[11px] transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        <span className="text-[13px] font-bold text-slate-600">{spot.short}</span>
        <span className="text-[11px] text-slate-400">{spot.species.join(' · ')}</span>
        <div className="ml-auto flex items-center gap-3 text-[12px] text-slate-500">
          {!isFreshwater && current.waterTempC !== undefined && (
            <span className="text-cyan-600 font-bold">{current.waterTempC}°C</span>
          )}
          {current.windMs !== undefined && current.windDir !== undefined && (
            <span className="flex items-center gap-1 font-medium">
              <svg width="14" height="14" viewBox="0 0 14 14" style={{ transform: `rotate(${current.windDir}deg)` }}>
                <polygon points="7,1 12,12 7,8 2,12" fill="#f59e0b" />
              </svg>
              {current.windMs} m/s
            </span>
          )}
          {!isFreshwater && current.currentMs !== undefined && (
            <span className="font-medium">{current.currentMs} m/s strøm</span>
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 overflow-x-auto border-t border-slate-50">
          <div style={{ minWidth: '500px' }}>
            {!isFreshwater && (
              <>
                <TrendGraph data={marine.waterTemp} nowTime={nowTime} color="#0891b2"
                  label="Vandtemp" unit="°C" height={h}
                  currentValue={current.waterTempC !== undefined ? `${current.waterTempC}` : undefined} />
                <TrendGraph data={marine.current.map(c => ({ time: c.time, value: c.speed }))}
                  nowTime={nowTime} color="#6366f1"
                  label="Strøm" unit=" m/s" height={h}
                  currentValue={current.currentMs !== undefined ? `${current.currentMs}` : undefined}
                  directions={marine.current} formatVal={v => v.toFixed(2)} />
                <TrendGraph data={marine.waterLevel} nowTime={nowTime} color="#0ea5e9"
                  label="Vandstand" unit=" cm" height={h}
                  currentValue={current.waterLevelCm !== undefined
                    ? `${current.waterLevelCm > 0 ? '+' : ''}${current.waterLevelCm}` : undefined}
                  formatVal={v => `${v > 0 ? '+' : ''}${Math.round(v)}`} />
              </>
            )}
            <TrendGraph data={air.wind.map(w => ({ time: w.time, value: w.speed }))}
              nowTime={nowTime} color="#f59e0b"
              label="Vind" unit=" m/s" height={h}
              currentValue={current.windMs !== undefined
                ? `${current.windMs} ${windDirToLabel(current.windDir ?? 0)}` : undefined}
              directions={air.wind} />
            <TrendGraph data={air.cloudCover} nowTime={nowTime} color="#94a3b8"
              label="Sky" unit="%" height={h}
              currentValue={current.cloudCover !== undefined ? `${Math.round(current.cloudCover)}` : undefined}
              formatVal={v => `${Math.round(v)}`} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main ───

export function TodayForecast() {
  const [data, setData] = useState<ForecastData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    fetchForecast()
      .then(d => setData(d))
      .catch(e => console.error('Forecast failed:', e))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm animate-pulse">
      <div className="h-4 bg-slate-100 rounded w-48 mb-4" />
      <div className="h-40 bg-slate-50 rounded-xl" />
    </div>
  );

  if (!data) return null;

  const { marine, air, current, nowTime } = data;
  const timeAxisData = marine.waterTemp.length >= air.temp.length ? marine.waterTemp : air.temp;

  return (
    <section className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <IconFish className="w-5 h-5 text-teal-500" />
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Fiskevejr — Aarhus</h2>
        <span className="text-[10px] text-slate-300 ml-auto">FCOO · DMI · Yr.no</span>
      </div>

      {/* Sun times */}
      <SunTimesBar data={data} />

      {/* Trend area — each graph scrolls independently, labels stay fixed */}
      <div>
        <TimeAxis data={timeAxisData} nowTime={nowTime} />

        <div className="space-y-2">
            <TrendGraph
              data={marine.waterTemp} nowTime={nowTime} color="#0891b2"
              label="Vandtemp" unit="°C" height={110} fillBelow
              currentValue={current.waterTempC !== undefined ? `${current.waterTempC}` : undefined}
            />
            <TrendGraph
              data={marine.current.map(c => ({ time: c.time, value: c.speed }))}
              nowTime={nowTime} color="#6366f1"
              label="Strøm" unit=" m/s" height={100}
              currentValue={current.currentMs !== undefined
                ? `${current.currentMs} ${current.currentDir !== undefined ? windDirToLabel(current.currentDir) : ''}`
                : undefined}
              directions={marine.current}
              formatVal={v => v.toFixed(2)}
            />
            <TrendGraph
              data={marine.waterLevel} nowTime={nowTime} color="#0ea5e9"
              label="Vandstand" unit=" cm" height={100} fillBelow
              currentValue={current.waterLevelCm !== undefined
                ? `${current.waterLevelCm > 0 ? '+' : ''}${current.waterLevelCm}`
                : undefined}
              formatVal={v => `${v > 0 ? '+' : ''}${Math.round(v)}`}
            />
            <TrendGraph
              data={air.wind.map(w => ({ time: w.time, value: w.speed }))}
              nowTime={nowTime} color="#f59e0b"
              label="Vind" unit=" m/s" height={90}
              currentValue={current.windMs !== undefined
                ? `${current.windMs} ${current.windDir !== undefined ? windDirToLabel(current.windDir) : ''}`
                : undefined}
              directions={air.wind}
            />
            <TrendGraph
              data={air.cloudCover} nowTime={nowTime} color="#94a3b8"
              label="Skydække" unit="%" height={80} fillBelow
              currentValue={current.cloudCover !== undefined ? `${Math.round(current.cloudCover)}` : undefined}
              formatVal={v => `${Math.round(v)}`}
            />
        </div>
      </div>

      {/* Secondary toggle */}
      <button
        onClick={() => setShowSecondary(!showSecondary)}
        className="mt-3 text-[12px] text-slate-400 hover:text-slate-600 transition-colors flex items-center gap-1 font-medium"
      >
        <span className={`transition-transform inline-block ${showSecondary ? 'rotate-90' : ''}`}>▶</span>
        {showSecondary ? 'Skjul sekundære data' : 'Vis flere data'}
      </button>

      {showSecondary && (
        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1">
            <TrendGraph data={air.temp} nowTime={nowTime} color="#ef4444"
              label="Lufttemp" unit="°C" height={60}
              currentValue={current.airTempC !== undefined ? `${current.airTempC}` : undefined} />
            <TrendGraph data={air.pressure} nowTime={nowTime} color="#8b5cf6"
              label="Tryk" unit=" hPa" height={60}
              currentValue={current.pressureHpa !== undefined ? `${Math.round(current.pressureHpa)}` : undefined}
              formatVal={v => `${Math.round(v)}`} />
            <TrendGraph data={marine.salinity} nowTime={nowTime} color="#14b8a6"
              label="Salinitet" unit="‰" height={60}
              currentValue={current.salinityPsu !== undefined ? `${current.salinityPsu}` : undefined} />
            <TrendGraph data={marine.waves} nowTime={nowTime} color="#3b82f6"
              label="Bølger" unit=" m" height={60}
              currentValue={current.waveHeightM !== undefined ? `${current.waveHeightM}` : undefined} />
            <TrendGraph data={air.precip} nowTime={nowTime} color="#60a5fa"
              label="Nedbør" unit=" mm" height={48} fillBelow formatVal={v => v.toFixed(1)} />
        </div>
      )}

      {/* Per-spot sections */}
      <div className="mt-4 pt-4 border-t border-slate-100">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Dine fiskespots</div>
        <div className="space-y-1.5">
          {SPOTS.map(spot => (
            <SpotSection key={spot.name} spot={spot} data={data} nowTime={nowTime} />
          ))}
        </div>
      </div>
    </section>
  );
}
