import { useState, useRef } from 'react';
import { trips, type Trip } from './data/trips';
import { IconFish, IconCalendar, LogoMark } from './components/Icons';
import { TodayForecast } from './components/TodayForecast';
import { SeasonCalendar } from './components/SeasonCalendar';
import { SpeciesBreakdown } from './components/SpeciesBreakdown';
import { MonthSection } from './components/MonthSection';
import { Header } from './components/Header';
import { Lightbox } from './components/Lightbox';

// ─── Helpers ───
const MONTHS = ['Jan','Feb','Mar','Apr','Maj','Jun','Jul','Aug','Sep','Okt','Nov','Dec'];

function getMonth(d: string) {
  const dt = new Date(d + 'T12:00:00');
  return `${MONTHS[dt.getMonth()]} ${dt.getFullYear()}`;
}

// ─── Main ───
export default function App() {
  const [lightbox, setLightbox] = useState<{ photos: string[]; idx: number } | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const byMonth = new Map<string, Trip[]>();
  [...trips].sort((a, b) => b.date.localeCompare(a.date)).forEach(t => {
    const m = getMonth(t.date);
    if (!byMonth.has(m)) byMonth.set(m, []);
    byMonth.get(m)!.push(t);
  });

  const totalTrips = trips.length;
  const totalCatch = trips.reduce((s, t) => s + t.totalCatch, 0);
  const catchTrips = trips.filter(t => t.totalCatch > 0).length;
  const bestTrip = [...trips].sort((a, b) => b.totalCatch - a.totalCatch)[0];
  const spotCount = new Set(trips.map(t => t.spot)).size;

  const scrollToDate = (date: string) => {
    const el = sectionRefs.current.get(getMonth(date));
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        totalTrips={totalTrips}
        totalCatch={totalCatch}
        catchTrips={catchTrips}
        spotCount={spotCount}
        bestTrip={bestTrip ? { totalCatch: bestTrip.totalCatch, date: bestTrip.date } : null}
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-4">
        <TodayForecast />

        {/* Heatmap */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <IconCalendar className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Saesonen dag for dag</h2>
          </div>
          <SeasonCalendar onSelect={scrollToDate} />
        </section>

        {/* Species */}
        <section className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <IconFish className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Arter</h2>
          </div>
          <SpeciesBreakdown />
        </section>

        {/* Monthly sections */}
        {Array.from(byMonth.entries()).map(([month, monthTrips]) => (
          <MonthSection
            key={month}
            month={month}
            trips={monthTrips}
            onPhoto={setLightbox}
            sectionRef={el => { if (el) sectionRefs.current.set(month, el); }}
          />
        ))}
      </main>

      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="flex items-center justify-center gap-2 text-xs text-slate-300">
          <LogoMark className="w-4 h-4 text-slate-300" />
          <span>Genereret med Wattson x</span>
          <a href="https://openclaw.ai" className="text-teal-400 hover:underline">OpenClaw</a>
        </div>
      </footer>

      <Lightbox
        photos={lightbox?.photos || null}
        idx={lightbox?.idx || 0}
        onClose={() => setLightbox(null)}
        onChange={(i) => setLightbox(prev => prev ? { ...prev, idx: i } : null)}
      />
    </div>
  );
}
