import { trips } from '../data/trips';

export function SpeciesBreakdown() {
  const species: Record<string, number> = {};
  trips.forEach(t => t.catches.forEach(c => { species[c.species] = (species[c.species] || 0) + c.count; }));
  const sorted = Object.entries(species).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, n]) => s + n, 0);
  const colors: Record<string, string> = { sild: '#2563eb', makrel: '#059669', havorred: '#d97706', smelt: '#7c3aed' };

  return (
    <div>
      <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 mb-4">
        {sorted.map(([sp, n]) => (
          <div key={sp} style={{ width: `${(n / total) * 100}%`, background: colors[sp] || '#6366f1' }}
            className="transition-all duration-700 first:rounded-l-full last:rounded-r-full" />
        ))}
      </div>
      <div className="flex justify-center gap-6 sm:gap-10">
        {sorted.map(([sp, n]) => (
          <div key={sp} className="text-center">
            <div className="flex items-center justify-center gap-1.5 mb-0.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: colors[sp] || '#6366f1' }} />
              <span className="text-2xl font-extrabold text-slate-800">{n}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium capitalize">{sp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
