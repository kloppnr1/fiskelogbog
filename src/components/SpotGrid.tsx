import { trips } from '../data/trips';

export function SpotGrid() {
  const spots: Record<string, { count: number; isGuess: boolean }> = {};
  trips.forEach(t => {
    if (!spots[t.spot]) spots[t.spot] = { count: 0, isGuess: t.isGuess };
    spots[t.spot].count++;
  });

  const sorted = Object.entries(spots).sort((a, b) => b[1].count - a[1].count);

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
        <span>📍</span> Spots
      </h2>
      <div className="flex flex-wrap gap-2">
        {sorted.map(([spot, { count, isGuess }]) => (
          <div
            key={spot}
            className="flex items-center gap-2.5 bg-white border border-slate-100 rounded-full px-4 py-2 shadow-sm text-sm hover:shadow-md transition-shadow"
          >
            <span className="font-medium text-slate-700">{spot}</span>
            {isGuess && (
              <span className="text-[10px] font-bold uppercase tracking-wide bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">
                gæt
              </span>
            )}
            <span className="bg-sea-100 text-sea-700 font-bold text-xs px-2 py-0.5 rounded-full">
              {count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
