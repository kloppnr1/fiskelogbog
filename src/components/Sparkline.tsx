import { useState } from 'react';
import type { TrendData } from '../types';

interface TrendPanelProps {
  trend: TrendData;
  species?: string[];
  waterTempC?: number;
}

function trendArrow(t?: string) {
  if (t === 'rising') return '↗';
  if (t === 'falling') return '↘';
  if (t === 'stable') return '→';
  return '';
}

function trendColor(t?: string) {
  if (t === 'rising') return 'text-rose-500';
  if (t === 'falling') return 'text-sky-500';
  return 'text-slate-400';
}

function delta(values: (number | null)[]): { first: number; last: number; diff: number } | null {
  const clean = values.filter((v): v is number => v !== null);
  if (clean.length < 2) return null;
  const first = clean[0];
  const last = clean[clean.length - 1];
  return { first, last, diff: +(last - first).toFixed(1) };
}

function pressureVerdict(d: ReturnType<typeof delta>, trend?: string): { label: string; color: string; icon: string } {
  if (!d) return { label: 'Ingen data', color: 'text-slate-300', icon: '—' };
  const absDiff = Math.abs(d.diff);
  if (absDiff <= 3) return { label: 'Stabilt', color: 'text-emerald-600', icon: '●' };
  if (trend === 'falling') return { label: `−${absDiff} hPa`, color: 'text-amber-600', icon: '▼' };
  return { label: `+${absDiff} hPa`, color: 'text-sky-600', icon: '▲' };
}

function windVerdict(d: ReturnType<typeof delta>): { label: string; color: string } {
  if (!d) return { label: '—', color: 'text-slate-300' };
  if (d.last <= 3) return { label: 'Svag', color: 'text-emerald-600' };
  if (d.last <= 6) return { label: 'Moderat', color: 'text-slate-600' };
  return { label: 'Kraftig', color: 'text-amber-600' };
}

function precipTotal(values: (number | null)[]): number {
  return +values.filter((v): v is number => v !== null).reduce((s, v) => s + v, 0).toFixed(1);
}

// Mini bar showing relative magnitude (0-100%)
function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-1 w-14 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export function TrendPanel({ trend, species = [], waterTempC }: TrendPanelProps) {
  const [open, setOpen] = useState(false);

  const tempD = delta(trend.temp);
  const pressD = delta(trend.pressure);
  const windD = delta(trend.wind);
  const totalPrecip = precipTotal(trend.precip);
  const pVerdict = pressureVerdict(pressD, trend.pressure_trend);
  const wVerdict = windVerdict(windD);

  // Stability score: how many metrics are stable
  const stableCount = [trend.temp_trend, trend.pressure_trend, trend.wind_trend]
    .filter(t => t === 'stable').length;
  const stabilityLabel = stableCount >= 2 ? 'Stabilt vejr' : stableCount === 1 ? 'Skiftende' : 'Ustabilt';
  const stabilityColor = stableCount >= 2 ? 'bg-emerald-100 text-emerald-700' : stableCount === 1 ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700';

  return (
    <div className="rounded-xl border border-slate-100 overflow-hidden bg-white">
      {/* Collapsed: compact summary */}
      <button
        className="w-full flex items-center gap-2 px-3.5 py-2 cursor-pointer select-none hover:bg-slate-50/80 transition-colors"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stabilityColor}`}>
          {stabilityLabel}
        </span>

        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Pressure pill */}
          <span className={`flex items-center gap-1 text-[11px] font-semibold ${pVerdict.color}`}>
            <span className="text-[8px]">{pVerdict.icon}</span>
            {pVerdict.label}
          </span>

          {/* Wind pill */}
          <span className={`text-[11px] font-medium ${wVerdict.color}`}>
            💨 {wVerdict.label}
          </span>

          {/* Precip */}
          {totalPrecip > 0 && (
            <span className="text-[11px] text-sky-500 font-medium">
              🌧 {totalPrecip}mm
            </span>
          )}
        </div>

        <svg
          className={`w-3 h-3 text-slate-300 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded: detailed breakdown */}
      {open && (
        <div className="px-3.5 pb-3 border-t border-slate-50 animate-fade-in">
          <div className="text-[9px] text-slate-300 font-medium uppercase tracking-wider mt-2 mb-2">
            5 dage op til tur
          </div>

          <div className="space-y-2">
            {/* Temperature */}
            {tempD && (
              <div className="flex items-center gap-3">
                <span className="w-5 text-center">🌡</span>
                <span className="w-[70px] text-[11px] text-slate-500 font-medium">Temperatur</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{tempD.first}°</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-[11px] font-bold text-slate-700">{tempD.last}°</span>
                  <span className={`text-xs font-bold ${trendColor(trend.temp_trend)}`}>
                    {trendArrow(trend.temp_trend)}
                  </span>
                </div>
                <MiniBar value={Math.abs(tempD.diff)} max={10} color={trend.temp_trend === 'rising' ? '#f43f5e' : trend.temp_trend === 'falling' ? '#0ea5e9' : '#94a3b8'} />
              </div>
            )}

            {/* Pressure */}
            {pressD && (
              <div className="flex items-center gap-3">
                <span className="w-5 text-center">📊</span>
                <span className="w-[70px] text-[11px] text-slate-500 font-medium">Lufttryk</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{pressD.first}</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-[11px] font-bold text-slate-700">{pressD.last}</span>
                  <span className={`text-xs font-bold ${trend.pressure_trend === 'falling' ? 'text-amber-500' : trend.pressure_trend === 'rising' ? 'text-sky-500' : 'text-slate-400'}`}>
                    {trendArrow(trend.pressure_trend)}
                  </span>
                </div>
                <MiniBar value={Math.abs(pressD.diff)} max={20} color={trend.pressure_trend === 'falling' ? '#f59e0b' : trend.pressure_trend === 'rising' ? '#0ea5e9' : '#94a3b8'} />
              </div>
            )}

            {/* Wind */}
            {windD && (
              <div className="flex items-center gap-3">
                <span className="w-5 text-center">💨</span>
                <span className="w-[70px] text-[11px] text-slate-500 font-medium">Vind</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">{windD.first} m/s</span>
                  <span className="text-slate-300">→</span>
                  <span className="text-[11px] font-bold text-slate-700">{windD.last} m/s</span>
                  <span className={`text-xs font-bold ${trendColor(trend.wind_trend)}`}>
                    {trendArrow(trend.wind_trend)}
                  </span>
                </div>
              </div>
            )}

            {/* Precipitation */}
            <div className="flex items-center gap-3">
              <span className="w-5 text-center">🌧</span>
              <span className="w-[70px] text-[11px] text-slate-500 font-medium">Nedbør</span>
              <div className="flex items-center gap-1.5">
                <span className={`text-[11px] font-bold ${totalPrecip > 0 ? 'text-sky-600' : 'text-slate-400'}`}>
                  {totalPrecip > 0 ? `${totalPrecip} mm total` : 'Tørt'}
                </span>
              </div>
              {totalPrecip > 0 && (
                <div className="flex gap-px items-end h-3">
                  {trend.precip.map((v, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-sky-300 rounded-sm"
                      style={{ height: `${v ? Math.max((v / Math.max(...trend.precip.filter((x): x is number => x !== null))) * 12, 2) : 0}px` }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Species-aware fishing insights */}
          {(() => {
            const insights: { text: string; color: string; bg: string; border: string }[] = [];
            const sp = species.map(s => s.toLowerCase());
            const hasHavørred = sp.includes('havørred');
            const hasSild = sp.includes('sild');
            const hasMakrel = sp.includes('makrel');
            const lastWind = windD?.last;

            const wt = waterTempC;

            if (hasHavørred) {
              if (wt !== undefined && wt >= 4 && wt <= 10)
                insights.push({ text: `⦿ Havørred: Havtemp ${wt}°C — ideelt vindue (4–10°)`, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' });
              else if (wt !== undefined && wt < 4)
                insights.push({ text: `⦿ Havørred: Havtemp ${wt}°C — koldt, fiskene er langsomme`, color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' });
              if (trend.pressure_trend === 'falling' && pressD && Math.abs(pressD.diff) > 3)
                insights.push({ text: '⦿ Havørred: Faldende tryk aktiverer jagtinstinktet', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' });
              if (trend.temp_trend === 'rising' && (wt === undefined || wt < 8))
                insights.push({ text: '⦿ Havørred: Stigende temp trækker fisk ind på lavt vand', color: 'text-teal-700', bg: 'bg-teal-50', border: 'border-teal-100' });
            }

            if (hasSild) {
              if (wt !== undefined && wt >= 2 && wt <= 8)
                insights.push({ text: `⦿ Sild: Havtemp ${wt}°C — silden trives`, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' });
              if (stableCount >= 2)
                insights.push({ text: '⦿ Sild: Stabilt vejr holder stimerne samlet', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' });
              if (lastWind !== undefined && lastWind > 5)
                insights.push({ text: '⦿ Sild: Vind presser føde ind mod molen', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-100' });
            }

            if (hasMakrel) {
              if (wt !== undefined && wt >= 12)
                insights.push({ text: `⦿ Makrel: Havtemp ${wt}°C — makrellerne jager i overfladen`, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' });
              else if (wt !== undefined && wt < 10)
                insights.push({ text: `⦿ Makrel: Havtemp ${wt}°C — for koldt til makrel`, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' });
              if (stableCount >= 2 && lastWind !== undefined && lastWind <= 5)
                insights.push({ text: '⦿ Makrel: Roligt stabilt vejr — perfekt til forfang', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-100' });
            }

            // Generic fallbacks if no species match
            if (insights.length === 0) {
              if (pressD && Math.abs(pressD.diff) > 5 && trend.pressure_trend === 'falling')
                insights.push({ text: '💡 Faldende tryk — fisk er ofte mere aktive før en front', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' });
              if (stableCount >= 2 && totalPrecip < 2)
                insights.push({ text: '💡 Stabilt vejr med lidt nedbør — forudsigelige forhold', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' });
            }

            // Show max 2 insights
            return insights.slice(0, 2).map((ins, i) => (
              <div key={i} className={`mt-2 text-[10px] ${ins.color} ${ins.bg} rounded-lg px-2.5 py-1.5 border ${ins.border}`}>
                {ins.text}
              </div>
            ));
          })()}
        </div>
      )}
    </div>
  );
}
