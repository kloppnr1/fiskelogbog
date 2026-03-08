/**
 * DATAKILDE-KONFIGURATION — STATISK OG UFRAVIGELIG
 *
 * Denne fil definerer ALLE datakilder, endpoints, parametre og koordinater.
 * Al data-fetching SKAL læse fra denne config. Ingen hardcoded URLs andre steder.
 *
 * REGLER:
 * 1. Open-Meteo bruges IKKE. Aldrig. Ingen fallback.
 * 2. FCOO = alt marint. DMI = luft-observationer. Yr.no = luft-forecast.
 * 3. Ingen nye datakilder tilføjes uden Martins godkendelse.
 * 4. Denne fil ændres KUN ved eksplicit instruktion.
 */

// ─── Koordinater ───

export const COORDS = {
  /** Aarhus centrum — bruges til luft-data */
  aarhus: { lat: 56.15, lon: 10.21 },
  /** Aarhus Havn — bruges til FCOO havtemp + salinitet */
  fcooHarbour: { lat: 56.15, lon: 10.22 },
  /** Offshore Aarhus — bruges til FCOO bølger, strøm, vandstand */
  fcooOffshore: { lat: 56.15, lon: 10.24 },
} as const;

// ─── FCOO METOC ───

export const FCOO = {
  baseUrl: 'https://metoc.fcoo.dk/webapi',
  timeoutMs: 15000,

  /** Parametre og deres koordinater. HARBOUR = temp+salt, OFFSHORE = resten. */
  params: {
    temperature:    { name: 'Temperature',            coords: COORDS.fcooHarbour,  depth: 'surface' },
    salinity:       { name: 'Salinity',               coords: COORDS.fcooHarbour,  depth: 'surface' },
    waterLevel:     { name: 'Sea_Surface_Elevation',  coords: COORDS.fcooOffshore, depth: null },
    current:        { name: 'Surface_Current',        coords: COORDS.fcooOffshore, depth: null },
    waves:          { name: 'Waves',                  coords: COORDS.fcooOffshore, depth: null },
    wavePeriod:     { name: 'Wave_period',            coords: COORDS.fcooOffshore, depth: null },
  },
} as const;

// ─── DMI ───

export const DMI = {
  apiKey: 'e254b7eb-da02-4613-be68-3c0ef55cd707',
  baseUrl: 'https://dmigw.govcloud.dk/v2',
  timeoutMs: 10000,

  /** Climate Grid — luft-observationer (seneste time) */
  climateGrid: {
    collection: 'climateData/collections/10kmGridValue/items',
    cellId: '10km_622_59', // Aarhus by
    label: 'Aarhus',
    params: [
      'mean_temp',
      'mean_wind_speed',
      'mean_wind_dir',
      'mean_pressure',
      'mean_cloud_cover',
      'acc_precip',
      'bright_sunshine',
    ],
  },

  /** OceanObs — målt havtemperatur (supplement til FCOO) */
  oceanObs: {
    collection: 'oceanObs/collections/observation/items',
    stationId: '22333',   // Aarhus Havn II
    label: 'Aarhus Havn II',
    parameterId: 'tw',    // vandtemperatur
  },

} as const;

// ─── Yr.no ───

export const YRNO = {
  baseUrl: 'https://api.met.no/weatherapi/locationforecast/2.0/compact',
  userAgent: 'fiskelogbog/1.0 github.com/kloppnr1',
  timeoutMs: 10000,
  coords: COORDS.aarhus,

  /** Max antal timer vi bruger fra yr.no forecast (3 dage) */
  forecastHours: 72,
} as const;

// ─── Forecast-vindue ───

export const FORECAST = {
  /** Antal timer frem i forecast */
  hoursAhead: 72,  // 3 dage
  /** Antal dage tilbage for historik/trend */
  daysBack: 4,
} as const;

// ─── Hjælpefunktioner ───

/** Byg FCOO timeseries URL for et givent parameter */
export function fcooUrl(param: keyof typeof FCOO.params): string {
  const p = FCOO.params[param];
  return `${FCOO.baseUrl}/data/timeseries?p=${p.name}&x=${p.coords.lon.toFixed(4)}&y=${p.coords.lat.toFixed(4)}`;
}

/** Byg DMI Climate Grid URL */
export function dmiGridUrl(parameterId?: string): string {
  const base = `${DMI.baseUrl}/${DMI.climateGrid.collection}?cellId=${DMI.climateGrid.cellId}&limit=20&sortorder=from,DESC&api-key=${DMI.apiKey}`;
  return parameterId ? `${base}&parameterId=${parameterId}` : base;
}

/** Byg DMI OceanObs URL */
export function dmiOceanUrl(opts?: { datetime?: string }): string {
  let url = `${DMI.baseUrl}/${DMI.oceanObs.collection}?stationId=${DMI.oceanObs.stationId}&parameterId=${DMI.oceanObs.parameterId}&limit=1&sortorder=observed,DESC&api-key=${DMI.apiKey}`;
  if (opts?.datetime) url += `&datetime=${opts.datetime}`;
  return url;
}

/** Byg Yr.no forecast URL */
export function yrnoUrl(): string {
  return `${YRNO.baseUrl}?lat=${YRNO.coords.lat}&lon=${YRNO.coords.lon}`;
}
