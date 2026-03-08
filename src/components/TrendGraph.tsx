/**
 * TrendGraph — a single trend line with HTML-overlaid labels and direction arrows.
 * SVG for line/fill only. HTML for all text (pixel-perfect sizing).
 */

import { useEffect, useRef } from 'react';
import { windDirToLabel, type HourlyPoint, type HourlyVector } from '../services/weather';

interface Props {
  data: HourlyPoint[];
  nowTime: string;
  color: string;
  height?: number;
  unit?: string;
  label: string;
  currentValue?: string;
  fillBelow?: boolean;
  directions?: HourlyVector[];
  formatVal?: (v: number) => string;
}

export function TrendGraph({
  data, nowTime, color, height = 120, unit = '', label,
  currentValue, fillBelow = false, directions,
  formatVal = v => `${Math.round(v * 10) / 10}`,
}: Props) {
  if (data.length < 2) return null;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const nowMs = new Date(nowTime).getTime();
  const times = data.map(d => new Date(d.time).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const tRange = tMax - tMin || 1;

  // 7 days × 24h = 168 hours. 12px/hour = ~2000px — ensures scroll on all devices
  const pxPerHour = 12;
  const totalW = Math.round(((tMax - tMin) / 3600000) * pxPerHour);
  const toXPct = (t: number) => ((t - tMin) / tRange) * 100;

  const nowPct = toXPct(nowMs);

  // SVG coordinates
  const svgW = 1000, svgH = 1000;
  const padTop = 200; // Reserve top 20% for labels
  const padBot = 200; // Reserve bottom 20% for arrow+label
  const toSvgX = (t: number) => ((t - tMin) / tRange) * svgW;
  const toSvgY = (v: number) => padTop + (1 - (v - min) / range) * (svgH - padTop - padBot);

  const pastPoints: string[] = [];
  const futurePoints: string[] = [];
  data.forEach((d, i) => {
    const sx = toSvgX(times[i]);
    const sy = toSvgY(d.value);
    const s = `${sx.toFixed(0)},${sy.toFixed(0)}`;
    if (times[i] <= nowMs) pastPoints.push(s);
    else futurePoints.push(s);
  });
  if (pastPoints.length && futurePoints.length) {
    futurePoints.unshift(pastPoints[pastPoints.length - 1]);
  }

  const fillD = fillBelow && pastPoints.length
    ? `M ${toSvgX(times[0]).toFixed(0)},${svgH - padBot} L ${pastPoints.join(' L ')} L ${toSvgX(times[pastPoints.length - 1]).toFixed(0)},${svgH - padBot} Z`
    : '';

  // Value labels — every 12 hours (00, 12) for cleaner look
  const candidateLabels: { pct: number; text: string }[] = [];
  const seenSlots = new Set<string>();
  data.forEach((d, i) => {
    const dt = new Date(d.time);
    const h = dt.getUTCHours();
    if (h !== 0 && h !== 12) return;
    const slotKey = `${dt.toISOString().slice(0, 10)}-${h}`;
    if (seenSlots.has(slotKey)) return;
    seenSlots.add(slotKey);
    const text = `${formatVal(d.value)}${unit}`;
    candidateLabels.push({ pct: toXPct(times[i]), text });
  });

  // Overlap prevention — min 7% spacing, skip edges
  const dailyLabels: typeof candidateLabels = [];
  for (const lbl of candidateLabels) {
    if (lbl.pct < 2 || lbl.pct > 96) continue;
    const last = dailyLabels[dailyLabels.length - 1];
    if (!last || lbl.pct - last.pct >= 7) {
      dailyLabels.push(lbl);
    }
  }

  // Direction arrows — ONE big arrow per day at noon, with text label
  const arrows: { pct: number; deg: number; label: string }[] = [];
  if (directions) {
    const seenDays = new Set<string>();
    for (const dir of directions) {
      const dt = new Date(dir.time);
      const h = dt.getUTCHours();
      if (h !== 12) continue;
      const dayKey = dt.toISOString().slice(0, 10);
      if (seenDays.has(dayKey)) continue;
      seenDays.add(dayKey);
      const pct = toXPct(new Date(dir.time).getTime());
      if (pct > 2 && pct < 98) {
        arrows.push({ pct, deg: dir.direction, label: windDirToLabel(dir.direction) });
      }
    }
  }

  // Now dot Y position
  const toYPct = (v: number) => {
    const svgY = toSvgY(v);
    return (svgY / svgH) * 100;
  };
  let nowDotYPct: number | undefined;
  if (pastPoints.length > 0) {
    nowDotYPct = toYPct(data[pastPoints.length - 1].value);
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const graphWidth = Math.max(totalW, 600);

  // Auto-scroll to "now"
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const nowPos = (nowPct / 100) * graphWidth;
      el.scrollLeft = Math.max(0, nowPos - el.clientWidth / 3);
    });
  }, [nowPct, graphWidth]);

  return (
    <div className="flex items-stretch gap-0 mb-3">
      {/* Left label — fixed, outside scroll */}
      <div className="w-[70px] sm:w-[100px] shrink-0 text-right pr-2 sm:pr-3 flex flex-col justify-center bg-white z-20">
        <div className="text-[12px] sm:text-[14px] font-bold text-slate-500 leading-tight">{label}</div>
        {currentValue && (
          <div className="text-[16px] sm:text-[22px] font-black leading-tight" style={{ color }}>
            {currentValue}{unit}
          </div>
        )}
      </div>

      {/* Graph — scrollable */}
      <div className="flex-1 overflow-x-auto" ref={scrollRef}>
        <div className="relative" style={{ height, width: `${graphWidth + 40}px`, paddingRight: '40px' }}>
          {/* SVG line */}
          <svg
            viewBox={`0 0 ${svgW} ${svgH}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="none"
          >
            {fillD && <path d={fillD} fill={color} opacity="0.06" />}
            {pastPoints.length > 1 && (
              <polyline points={pastPoints.join(' ')} fill="none" stroke={color}
                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                vectorEffect="non-scaling-stroke" />
            )}
            {futurePoints.length > 1 && (
              <polyline points={futurePoints.join(' ')} fill="none" stroke={color}
                strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                strokeDasharray="10,7" opacity="0.4"
                vectorEffect="non-scaling-stroke" />
            )}
          </svg>

          {/* NOW line */}
          <div
            className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-600 z-10"
            style={{ left: `${nowPct}%` }}
          />

          {/* NOW dot */}
          {nowDotYPct !== undefined && (
            <div
              className="absolute w-5 h-5 rounded-full border-[3px] border-white shadow-lg z-20"
              style={{
                left: `${nowPct}%`, top: `${nowDotYPct}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: color,
              }}
            />
          )}

          {/* Value labels — top area */}
          {dailyLabels.map((dl, i) => (
            <div
              key={i}
              className="absolute transform -translate-x-1/2 px-2.5 py-1 rounded-lg border-2 text-center whitespace-nowrap shadow-sm"
              style={{
                left: `${dl.pct}%`,
                top: '2px',
                backgroundColor: 'white',
                borderColor: color,
                color: color,
                fontSize: '15px',
                fontWeight: 800,
                lineHeight: '1.1',
                zIndex: 15,
              }}
            >
              {dl.text}
            </div>
          ))}

          {/* Direction arrows — ONE per day, big with text label */}
          {arrows.length > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-14 z-10">
              {arrows.map((a, i) => (
                <div
                  key={i}
                  className="absolute bottom-0 -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${a.pct}%` }}
                >
                  <svg width="32" height="32" viewBox="0 0 32 32"
                    style={{ transform: `rotate(${a.deg}deg)`, filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.3))' }}>
                    <polygon points="16,1 30,25 16,18 2,25"
                      fill={color} stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                  <span className="text-[12px] font-extrabold leading-none mt-0.5" style={{ color, textShadow: '0 0 3px white, 0 0 3px white' }}>{a.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
