import { useRef, useEffect } from 'react';
import { trips, type Trip } from '../data/trips';

const MONTHS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

export interface SeasonCalendarProps {
  onSelect: (date: string) => void;
}

export function SeasonCalendar({ onSelect }: SeasonCalendarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date));
  const start = new Date(sorted[0].date + 'T12:00:00');
  const end = new Date(sorted[sorted.length - 1].date + 'T12:00:00');
  const tripMap = new Map<string, Trip>();
  trips.forEach(t => tripMap.set(t.date, t));

  const startDay = new Date(start);
  startDay.setDate(startDay.getDate() - startDay.getDay());
  const endDate = new Date(end);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

  // Auto-scroll to end (most recent) on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const weeks: { date: Date; trip?: Trip }[][] = [];
  let current = new Date(startDay);
  let week: { date: Date; trip?: Trip }[] = [];
  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    week.push({ date: new Date(current), trip: tripMap.get(dateStr) });
    if (week.length === 7) { weeks.push(week); week = []; }
    current.setDate(current.getDate() + 1);
  }
  if (week.length) weeks.push(week);

  const monthLabels: { label: string; week: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((w, i) => {
    const m = w[3]?.date.getMonth() ?? w[0].date.getMonth();
    if (m !== lastMonth) { monthLabels.push({ label: MONTHS[m], week: i }); lastMonth = m; }
  });

  // Cell size (px) — must match the rendered size
  const CELL = 15; // 14px cell + 1px gap
  const LABEL_W = 28; // day-of-week label column

  return (
    <>
    <div ref={scrollRef} className="overflow-x-auto pb-2 -mx-6 px-6">
      <div style={{ width: `${LABEL_W + weeks.length * CELL}px` }}>
        {/* Month labels — absolute positioning based on week index */}
        <div className="relative mb-1" style={{ height: 16, marginLeft: LABEL_W }}>
          {monthLabels.map((m, i) => (
            <span key={i} className="absolute text-[10px] font-semibold text-slate-400 uppercase tracking-wider"
              style={{ left: `${m.week * CELL}px` }}>{m.label}</span>
          ))}
        </div>
        <div className="flex gap-px">
          {/* Day-of-week labels */}
          <div className="flex flex-col gap-px mr-1 pt-px shrink-0">
            {['','M','','O','','F',''].map((d, i) => (
              <div key={i} className="w-6 h-[14px] text-[9px] text-slate-400 flex items-center justify-end pr-1">{d}</div>
            ))}
          </div>
          {/* Week columns */}
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-px">
              {w.map((day, di) => {
                const inRange = day.date >= start && day.date <= end;
                const t = day.trip;
                let bg = 'bg-slate-100'; let ring = '';
                if (!inRange) bg = 'bg-slate-50/50';
                else if (t) {
                  if (t.totalCatch >= 10) { bg = 'bg-teal-500'; ring = 'ring-1 ring-teal-600'; }
                  else if (t.totalCatch > 0) { bg = 'bg-teal-300'; ring = 'ring-1 ring-teal-400'; }
                  else { bg = 'bg-slate-300'; ring = 'ring-1 ring-slate-400'; }
                }
                return (
                  <div key={di} onClick={() => t && onSelect(t.date)}
                    className={`w-[14px] h-[14px] rounded-[3px] ${bg} ${ring} ${t ? 'cursor-pointer hover:scale-[1.6] hover:z-10' : ''} transition-transform`}
                    title={t ? `${day.date.toISOString().slice(0,10)}: ${t.totalCatch} fisk` : ''} />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 mt-3 text-[10px] text-slate-400 ml-1">
      <span>Ingen tur</span>
      <div className="w-3 h-3 rounded-[2px] bg-slate-100 border border-slate-200" />
      <div className="w-3 h-3 rounded-[2px] bg-slate-300" />
      <span>Nul-tur</span>
      <div className="w-1 h-3 bg-slate-200 mx-1" />
      <div className="w-3 h-3 rounded-[2px] bg-teal-300" />
      <div className="w-3 h-3 rounded-[2px] bg-teal-500" />
      <span>Fangst</span>
    </div>
    </>
  );
}
