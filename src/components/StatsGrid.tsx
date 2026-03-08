import { trips } from '../data/trips';

interface StatProps {
  value: string | number;
  label: string;
  color?: string;
}

function Stat({ value, label, color = 'text-sea-600' }: StatProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 text-center shadow-sm hover:shadow-md transition-shadow">
      <div className={`text-3xl font-extrabold ${color} tracking-tight`}>{value}</div>
      <div className="text-[11px] uppercase tracking-[1.5px] font-semibold text-slate-400 mt-1">{label}</div>
    </div>
  );
}

export function StatsGrid() {
  const totalTrips = trips.length;
  const totalCatch = trips.reduce((s, t) => s + t.totalCatch, 0);
  const withFish = trips.filter(t => t.totalCatch > 0).length;
  const nullTrips = totalTrips - withFish;
  const totalPhotos = trips.reduce((s, t) => s + t.photos.length, 0);
  const spots = new Set(trips.map(t => t.spot)).size;
  const rate = Math.round((withFish / totalTrips) * 100);

  return (
    <section className="grid grid-cols-3 sm:grid-cols-6 gap-3 -mt-12 relative z-10">
      <Stat value={totalTrips} label="Ture" />
      <Stat value={totalCatch} label="Fangster" color="text-catch" />
      <Stat value={withFish} label="Med fisk" color="text-catch" />
      <Stat value={nullTrips} label="Nul-ture" color="text-slate-400" />
      <Stat value={spots} label="Spots" color="text-sea-700" />
      <Stat value={`${rate}%`} label="Fangstrate" color="text-amber-600" />
    </section>
  );
}
