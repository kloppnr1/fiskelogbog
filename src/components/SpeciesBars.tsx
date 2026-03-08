import { trips } from '../data/trips';

const COLORS: Record<string, string> = {
  sild: 'bg-blue-500',
  makrel: 'bg-emerald-500',
  havørred: 'bg-amber-500',
  smelt: 'bg-violet-500',
  hornfisk: 'bg-cyan-500',
};

export function SpeciesBars() {
  const species: Record<string, number> = {};
  trips.forEach(t => t.catches.forEach(c => {
    species[c.species] = (species[c.species] || 0) + c.count;
  }));

  const sorted = Object.entries(species).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] || 1;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span>🐟</span> Arter
      </h2>
      <div className="space-y-2">
        {sorted.map(([sp, count]) => (
          <div key={sp} className="flex items-center gap-3">
            <span className="w-20 text-right text-sm font-semibold text-slate-500 capitalize">{sp}</span>
            <div className="flex-1 h-8 bg-slate-50 rounded-lg overflow-hidden border border-slate-100">
              <div
                className={`h-full ${COLORS[sp] || 'bg-indigo-500'} rounded-lg flex items-center pl-3 text-white text-sm font-bold transition-all duration-700`}
                style={{ width: `${(count / max) * 100}%` }}
              >
                {count}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
