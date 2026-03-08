import type { Trip, SpotConfig } from '../types';

// ─── Spot → target species mapping ───
// The spot determines what you're fishing for. Override only if catches show something else.
export const SPOT_SPECIES: Record<string, string[]> = {
  'Det Grønne Fyr, Aarhus Havn': ['sild', 'makrel'],
  'Marselisborg':                 ['sild', 'makrel'],
  'Norsminde Havn':               ['sild', 'makrel'],
  'Ballehage Strand':             ['havørred'],
  'Moesgaard Strand':             ['havørred'],
  'Kysing Næs':                   ['havørred'],
  'Skæring Strand':               ['havørred'],
  'Kalø Vig':                     ['havørred'],
  'Dyngby Hage':                  ['havørred'],
  'Ørnereden, Højbjerg':          ['havørred'],
  'Brabrand Sø':                  ['aborre', 'gedde'],
};

// ─── Spot config for TodayForecast ───
export const SPOTS: SpotConfig[] = [
  { name: 'Det Grønne Fyr', short: 'Grønne Fyr', type: 'havn', species: ['sild', 'makrel'] },
  { name: 'Marselisborg', short: 'Marselisborg', type: 'havn', species: ['sild', 'makrel'] },
  { name: 'Norsminde Havn', short: 'Norsminde', type: 'havn', species: ['sild', 'makrel'] },
  { name: 'Ballehage Strand', short: 'Ballehage', type: 'kyst', species: ['havørred'] },
  { name: 'Moesgaard Strand', short: 'Moesgaard', type: 'kyst', species: ['havørred'] },
  { name: 'Kysing Næs', short: 'Kysing Næs', type: 'kyst', species: ['havørred'] },
  { name: 'Skæring Strand', short: 'Skæring', type: 'kyst', species: ['havørred'] },
  { name: 'Kalø Vig', short: 'Kalø Vig', type: 'kyst', species: ['havørred'] },
  { name: 'Dyngby Hage', short: 'Dyngby', type: 'kyst', species: ['havørred'] },
  { name: 'Ørnereden', short: 'Ørnereden', type: 'kyst', species: ['havørred'] },
  { name: 'Brabrand Sø', short: 'Brabrand Sø', type: 'sø', species: ['aborre', 'gedde'] },
];

// ─── Infer target species from trip data ───
export function inferTargetSpecies(trip: Trip): string[] {
  // Primary: spot determines target
  const spotTargets = SPOT_SPECIES[trip.spot];
  if (spotTargets) return spotTargets;

  // Fallback: infer from catches if spot is unknown
  if (trip.catches.length > 0) {
    return [...new Set(trip.catches.map(c => c.species.toLowerCase()))];
  }

  // Last resort: infer from lures
  const targets = new Set<string>();
  trip.lures.forEach(l => {
    const type = (l.type || '').toLowerCase();
    const model = (l.model || '').toLowerCase();
    if (type.includes('silde') || model.includes('silde')) targets.add('sild');
    if (type.includes('makrel') || model.includes('makrel')) targets.add('makrel');
    if (type.includes('blink') || type.includes('spinner') || type.includes('wobler') ||
        type.includes('kystblink') || type.includes('pilker'))
      targets.add('havørred');
  });

  return targets.size > 0 ? Array.from(targets) : ['havørred'];
}
