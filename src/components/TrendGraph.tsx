/**
 * TrendGraph — a single trend line with HTML-overlaid labels and direction arrows.
 * Uses SVG only for the line/fill, HTML for all text (so font sizing is pixel-perfect).
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
  data, nowTime, color, height = 100, unit = '', label,
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

  // Use fixed pixel width per hour for consistent readability
  // 7 days × 24h = 168 hours. At 8px/hour = 1344px → scrollable on mobile, great on desktop
  const pxPerHour = 8;
  const totalW = Math.round(((tMax - tMin) / 3600000) * pxPerHour);
  const toXPx = (t: number) => ((t - tMin) / tRange) * totalW;
  const toXPct = (t: number) => ((t - tMin) / tRange) * 100;
  const toYPct = (v: number) => (1 - (v - min) / range) * 100;

  const nowPct = toXPct(nowMs);

  // Build SVG path in percentage-based viewBox
  const svgW = 1000, svgH = 1000;
  const toSvgX = (t: number) => ((t - tMin) / tRange) * svgW;
  const toSvgY = (v: number) => (1 - (v - min) / range) * svgH;

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
    ? `M ${toSvgX(times[0]).toFixed(0)},${svgH} L ${pastPoints.join(' L ')} L ${toSvgX(times[pastPoints.length - 1]).toFixed(0)},${svgH} Z`
    : '';

  // Value labels every ~6 hours (00, 06, 12, 18) with overlap prevention
  const candidateLabels: { pct: number; text: string }[] = [];
  const seenSlots = new Set<string>();
  data.forEach((d, i) => {
    const dt = new Date(d.time);
    const h = dt.getUTCHours();
    if (h !== 0 && h !== 6 && h !== 12 && h !== 18) return;
    const slotKey = `${dt.toISOString().slice(0, 10)}-${h}`;
    if (seenSlots.has(slotKey)) return;
    seenSlots.add(slotKey);
    let text = `${formatVal(d.value)}${unit}`;
    if (directions) {
      const closest = directions.reduce((best, dir) => {
        const diff = Math.abs(new Date(dir.time).getTime() - times[i]);
        return diff < best.diff ? { diff, dir } : best;
      }, { diff: Infinity, dir: directions[0] });
      if (closest.dir) text = `${formatVal(d.value)} ${windDirToLabel(closest.dir.direction)}`;
    }
    candidateLabels.push({ pct: toXPct(times[i]), text });
  });

  // Filter to prevent overlap: estimate label width in % of graph
  // Typical label ~90px at 18px bold; graph width ~1344px → ~6.7%. Use 8% for safety.
  const MIN_SPACING = 8;
  const dailyLabels: typeof candidateLabels = [];
  for (const label of candidateLabels) {
    const last = dailyLabels[dailyLabels.length - 1];
    if (!last || label.pct - last.pct >= MIN_SPACING) {
      // Skip labels too close to the right edge (last 2%)
      if (label.pct > 98) continue;
      dailyLabels.push(label);
    }
  }

  // Direction arrows every ~3h
  const arrows: { pct: number; deg: number }[] = [];
  if (directions) {
    const step = Math.max(1, Math.floor(directions.length / 20));
    for (let i = 0; i < directions.length; i += step) {
      const t = new Date(directions[i].time).getTime();
      arrows.push({ pct: toXPct(t), deg: directions[i].direction });
    }
  }

  // Now dot position
  let nowDotYPct: number | undefined;
  if (pastPoints.length > 0) {
    const lastPastIdx = pastPoints.length - 1;
    nowDotYPct = toYPct(data[lastPastIdx].value);
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const graphWidth = Math.max(totalW, 600);

  // Auto-scroll to "now" on mount (slight delay for layout)
  useEffect(() => {
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (!el) return;
      const nowPos = (nowPct / 100) * graphWidth;
      const center = nowPos - el.clientWidth / 3; // Show "now" in left third so forecast is visible
      el.scrollLeft = Math.max(0, center);
    });
  }, [nowPct, graphWidth]);

  return (
    <div className="flex items-stretch gap-0 mb-1">
      {/* Left label — OUTSIDE scroll container, always visible */}
      <div className="w-[90px] shrink-0 text-right pr-3 flex flex-col justify-center z-20 bg-white">
        <div className="text-[15px] font-bold text-slate-500 leading-tight">{label}</div>
        {currentValue && (
          <div className="text-[24px] font-black leading-tight" style={{ color }}>
            {currentValue}{unit}
          </div>
        )}
      </div>

      {/* Graph area — scrolls independently, auto-scrolls to "now" */}
      <div className="flex-1 overflow-x-auto" ref={scrollRef}>
        <div className="relative" style={{ height, width: `${graphWidth}px` }}>
        {/* SVG lines only */}
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
        >
          {fillD && <path d={fillD} fill={color} opacity="0.08" />}
          {pastPoints.length > 1 && (
            <polyline points={pastPoints.join(' ')} fill="none" stroke={color}
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              vectorEffect="non-scaling-stroke" />
          )}
          {futurePoints.length > 1 && (
            <polyline points={futurePoints.join(' ')} fill="none" stroke={color}
              strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
              strokeDasharray="12,8" opacity="0.4"
              vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        {/* Now vertical line — HTML */}
        <div
          className="absolute top-0 bottom-0 border-l-2 border-dashed border-slate-500"
          style={{ left: `${nowPct}%` }}
        />

        {/* Now dot */}
        {nowDotYPct !== undefined && (
          <div
            className="absolute w-6 h-6 rounded-full border-[3px] border-white shadow-lg"
            style={{
              left: `${nowPct}%`, top: `${nowDotYPct}%`,
              transform: 'translate(-50%, -50%)',
              backgroundColor: color,
            }}
          />
        )}

        {/* Daily value pills — HTML, pixel-perfect sizing */}
        {dailyLabels.map((dl, i) => (
          <div
            key={i}
            className="absolute -top-1 transform -translate-x-1/2 px-2 py-0.5 rounded-md border text-center whitespace-nowrap"
            style={{
              left: `${dl.pct}%`,
              backgroundColor: 'white',
              borderColor: color,
              color: color,
              fontSize: '18px',
              fontWeight: 800,
              lineHeight: '1.2',
              zIndex: 10,
            }}
          >
            {dl.text}
          </div>
        ))}

        {/* Direction arrows — HTML, big and bold */}
        {arrows.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-6">
            {arrows.map((a, i) => (
              <div
                key={i}
                className="absolute bottom-0 transform -translate-x-1/2"
                style={{ left: `${a.pct}%` }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28"
                  style={{ transform: `rotate(${a.deg}deg)` }}>
                  <polygon points="14,1 26,24 14,16 2,24"
                    fill={color} stroke="white" strokeWidth="2" />
                </svg>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
