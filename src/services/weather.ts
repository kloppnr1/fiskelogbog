/**
 * Weather service — henter data fra FCOO, DMI og Yr.no.
 * Al konfiguration importeres fra config/datasources.ts.
 * INGEN hardcoded URLs, nøgler eller koordinater her.
 */

import {
  FCOO, DMI, YRNO, FORECAST, COORDS,
  fcooUrl, dmiGridUrl, dmiOceanUrl, yrnoUrl,
} from '../config/datasources';

import type {
  HourlyPoint, HourlyVector, MarineData, AirData,
  CurrentSnapshot, ForecastData,
} from '../types';

export type {
  HourlyPoint, HourlyVector, MarineData, AirData,
  CurrentSnapshot, ForecastData,
} from '../types';

// ─── Internal helpers ───

async function fetchJson<T = unknown>(url: string, opts?: {
  timeoutMs?: number;
  headers?: Record<string, string>;
}): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), opts?.timeoutMs ?? 10000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: opts?.headers,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function findClosestIdx(times: string[], target: number): number {
  let best = 0, bestDiff = Infinity;
  times.forEach((t, i) => {
    const diff = Math.abs(new Date(t).getTime() - target);
    if (diff < bestDiff) { bestDiff = diff; best = i; }
  });
  return best;
}

/** Cutoff: only include data from (now - daysBack) to (now + hoursAhead) */
function timeWindow(): { start: number; end: number } {
  const now = Date.now();
  return {
    start: now - FORECAST.daysBack * 24 * 3600000,
    end: now + FORECAST.hoursAhead * 3600000,
  };
}

function inWindow(time: string, window: { start: number; end: number }): boolean {
  const t = new Date(time).getTime();
  return t >= window.start && t <= window.end;
}

// ─── FCOO fetchers ───

interface FcooTimeseries {
  tc: string[];
  v: number[] | number[][];
  long_name?: string;
  units?: string;
  dtype?: string;
}

async function fetchFcooParam(param: keyof typeof FCOO.params): Promise<Record<string, FcooTimeseries> | null> {
  return fetchJson(fcooUrl(param), { timeoutMs: FCOO.timeoutMs });
}

async function fetchFcooMarine(): Promise<MarineData> {
  const win = timeWindow();
  const marine: MarineData = {
    waterTemp: [], waterLevel: [], current: [],
    waves: [], wavePeriod: [], salinity: [],
  };

  const [tempRes, salRes, elevRes, curRes, waveRes, wpRes] = await Promise.all([
    fetchFcooParam('temperature'),
    fetchFcooParam('salinity'),
    fetchFcooParam('waterLevel'),
    fetchFcooParam('current'),
    fetchFcooParam('waves'),
    fetchFcooParam('wavePeriod'),
  ]);

  // Temperature (3D → surface = last depth)
  if (tempRes?.Temperature) {
    const { tc, v } = tempRes.Temperature;
    tc.forEach((t, i) => {
      if (!inWindow(t, win)) return;
      const vals = v[i] as number[];
      if (Array.isArray(vals)) {
        marine.waterTemp.push({ time: t, value: Math.round(vals[vals.length - 1] * 10) / 10 });
      }
    });
  }

  // Salinity (3D → surface)
  if (salRes?.Salinity) {
    const { tc, v } = salRes.Salinity;
    tc.forEach((t, i) => {
      if (!inWindow(t, win)) return;
      const vals = v[i] as number[];
      if (Array.isArray(vals)) {
        marine.salinity.push({ time: t, value: Math.round(vals[vals.length - 1] * 10) / 10 });
      }
    });
  }

  // Water level
  if (elevRes?.Sea_Surface_Elevation) {
    const { tc, v } = elevRes.Sea_Surface_Elevation;
    tc.forEach((t, i) => {
      if (!inWindow(t, win)) return;
      marine.waterLevel.push({ time: t, value: Math.round((v as number[])[i] * 100) });
    });
  }

  // Current (dtype=vector: v = [U_array, V_array] — both arrays span all timesteps)
  if (curRes?.Surface_Current) {
    const { tc, v } = curRes.Surface_Current;
    const uArr = v[0] as number[];
    const vArr = v[1] as number[];
    tc.forEach((t, i) => {
      if (!inWindow(t, win)) return;
      const u = uArr[i], v2 = vArr[i];
      if (u !== undefined && v2 !== undefined) {
        marine.current.push({
          time: t,
          speed: Math.round(Math.sqrt(u * u + v2 * v2) * 1000) / 1000,
          direction: Math.round((Math.atan2(u, v2) * 180 / Math.PI + 360) % 360),
        });
      }
    });
  }

  // Waves (dtype=direction: v = [dir_array, height_array] — both span all timesteps)
  if (waveRes?.Waves) {
    const { tc, v } = waveRes.Waves;
    if (Array.isArray(v) && v.length === 2) {
      const heights = v[1] as number[];
      tc.forEach((t, i) => {
        if (!inWindow(t, win) || heights[i] === undefined) return;
        marine.waves.push({ time: t, value: Math.round(heights[i] * 100) / 100 });
      });
    }
  }

  // Wave period
  if (wpRes?.Wave_period) {
    const { tc, v } = wpRes.Wave_period;
    tc.forEach((t, i) => {
      if (!inWindow(t, win)) return;
      marine.wavePeriod.push({ time: t, value: Math.round((v as number[])[i] * 10) / 10 });
    });
  }

  return marine;
}

// ─── DMI fetchers ───

interface DmiGridResponse {
  features?: Array<{
    properties: { parameterId: string; value: number; from: string };
  }>;
}

interface DmiObsResponse {
  features?: Array<{
    properties: { value: number; observed: string };
  }>;
}

async function fetchDmiAirCurrent(): Promise<{
  temp?: number; windMs?: number; windDir?: number;
  pressure?: number; cloudCover?: number;
} | null> {
  const res = await fetchJson<DmiGridResponse>(dmiGridUrl(), { timeoutMs: DMI.timeoutMs });
  if (!res?.features?.length) return null;

  const v: Record<string, number> = {};
  for (const f of res.features) {
    const p = f.properties;
    if (!v[p.parameterId]) v[p.parameterId] = p.value;
  }

  return {
    temp: v.mean_temp,
    windMs: v.mean_wind_speed,
    windDir: v.mean_wind_dir,
    pressure: v.mean_pressure,
    cloudCover: v.mean_cloud_cover,
  };
}

async function fetchDmiSeaTemp(): Promise<number | null> {
  const res = await fetchJson<DmiObsResponse>(dmiOceanUrl(), { timeoutMs: DMI.timeoutMs });
  return res?.features?.[0]?.properties?.value ?? null;
}

// ─── DMI Climate Grid historical ───

interface DmiGridHistResponse {
  features?: Array<{
    properties: { parameterId: string; value: number; from: string };
  }>;
}

/** Fetch historical hourly air observations (last N days) from DMI Climate Grid */
async function fetchDmiGridHistory(): Promise<{
  temp: HourlyPoint[];
  wind: HourlyVector[];
  pressure: HourlyPoint[];
  cloudCover: HourlyPoint[];
}> {
  const win = timeWindow();
  const startDate = new Date(win.start).toISOString().slice(0, 19) + 'Z';
  const nowDate = new Date().toISOString().slice(0, 19) + 'Z';
  const dt = `${startDate}/${nowDate}`;

  const cell = DMI.climateGrid.cellId;
  const base = `${DMI.baseUrl}/${DMI.climateGrid.collection}?cellId=${cell}&limit=300&api-key=${DMI.apiKey}&datetime=${dt}`;

  const [tempRes, windRes, windDirRes, presRes, cloudRes] = await Promise.all([
    fetchJson<DmiGridHistResponse>(`${base}&parameterId=mean_temp`, { timeoutMs: DMI.timeoutMs }),
    fetchJson<DmiGridHistResponse>(`${base}&parameterId=mean_wind_speed`, { timeoutMs: DMI.timeoutMs }),
    fetchJson<DmiGridHistResponse>(`${base}&parameterId=mean_wind_dir`, { timeoutMs: DMI.timeoutMs }),
    fetchJson<DmiGridHistResponse>(`${base}&parameterId=mean_pressure`, { timeoutMs: DMI.timeoutMs }),
    fetchJson<DmiGridHistResponse>(`${base}&parameterId=mean_cloud_cover`, { timeoutMs: DMI.timeoutMs }),
  ]);

  const temp: HourlyPoint[] = [];
  const pressure: HourlyPoint[] = [];
  const cloudCover: HourlyPoint[] = [];
  const windMap = new Map<string, { speed?: number; dir?: number }>();

  if (tempRes?.features) {
    for (const f of tempRes.features) temp.push({ time: f.properties.from, value: f.properties.value });
  }
  if (windRes?.features) {
    for (const f of windRes.features) {
      const entry = windMap.get(f.properties.from) ?? {};
      entry.speed = f.properties.value;
      windMap.set(f.properties.from, entry);
    }
  }
  if (windDirRes?.features) {
    for (const f of windDirRes.features) {
      const entry = windMap.get(f.properties.from) ?? {};
      entry.dir = f.properties.value;
      windMap.set(f.properties.from, entry);
    }
  }
  if (presRes?.features) {
    for (const f of presRes.features) pressure.push({ time: f.properties.from, value: f.properties.value });
  }
  if (cloudRes?.features) {
    for (const f of cloudRes.features) cloudCover.push({ time: f.properties.from, value: f.properties.value });
  }

  const wind: HourlyVector[] = [];
  for (const [time, v] of windMap) {
    if (v.speed !== undefined && v.dir !== undefined) {
      wind.push({ time, speed: v.speed, direction: v.dir });
    }
  }

  // Sort ascending
  const asc = (a: { time: string }, b: { time: string }) => a.time.localeCompare(b.time);
  temp.sort(asc); wind.sort(asc); pressure.sort(asc); cloudCover.sort(asc);

  return { temp, wind, pressure, cloudCover };
}

// ─── Yr.no fetcher ───

interface YrTimeseries {
  time: string;
  data: {
    instant: {
      details: {
        air_temperature: number;
        wind_speed: number;
        wind_from_direction: number;
        air_pressure_at_sea_level: number;
        cloud_area_fraction: number;
        relative_humidity: number;
      };
    };
    next_1_hours?: {
      summary: { symbol_code: string };
      details: { precipitation_amount: number };
    };
  };
}

async function fetchYrnoForecast(): Promise<AirData> {
  const air: AirData = {
    temp: [], wind: [], cloudCover: [],
    pressure: [], precip: [], symbols: [],
  };

  const res = await fetchJson<{
    properties: { timeseries: YrTimeseries[] };
  }>(yrnoUrl(), {
    timeoutMs: YRNO.timeoutMs,
    headers: { 'User-Agent': YRNO.userAgent },
  });

  if (!res?.properties?.timeseries) return air;

  const win = timeWindow();
  const maxTime = Date.now() + YRNO.forecastHours * 3600000;

  for (const ts of res.properties.timeseries) {
    const t = ts.time;
    const tMs = new Date(t).getTime();
    if (tMs > maxTime) break;
    if (!inWindow(t, win)) continue;

    const d = ts.data.instant.details;
    air.temp.push({ time: t, value: d.air_temperature });
    air.wind.push({ time: t, speed: d.wind_speed, direction: d.wind_from_direction });
    air.cloudCover.push({ time: t, value: d.cloud_area_fraction });
    air.pressure.push({ time: t, value: d.air_pressure_at_sea_level });

    if (ts.data.next_1_hours) {
      air.precip.push({ time: t, value: ts.data.next_1_hours.details.precipitation_amount });
      air.symbols.push({ time: t, code: ts.data.next_1_hours.summary.symbol_code });
    }
  }

  return air;
}

// ─── Public API ───

export async function fetchForecast(): Promise<ForecastData> {
  const now = new Date().toISOString();

  // Fetch all sources in parallel
  const [marine, air, dmiAir, dmiSea, gridHist] = await Promise.all([
    fetchFcooMarine(),
    fetchYrnoForecast(),
    fetchDmiAirCurrent(),
    fetchDmiSeaTemp(),
    fetchDmiGridHistory(),
  ]);

  // Merge historical DMI Climate Grid with Yr.no forecast
  // Grid = past measured (hourly), Yr.no = future forecast
  if (gridHist.temp.length) air.temp = [...gridHist.temp, ...air.temp];
  if (gridHist.wind.length) air.wind = [...gridHist.wind, ...air.wind];
  if (gridHist.pressure.length) air.pressure = [...gridHist.pressure, ...air.pressure];
  if (gridHist.cloudCover.length) air.cloudCover = [...gridHist.cloudCover, ...air.cloudCover];

  // Build current snapshot from latest values
  const nowMs = Date.now();
  const current: CurrentSnapshot = {};

  // Marine current values
  if (marine.waterTemp.length) {
    const idx = findClosestIdx(marine.waterTemp.map(p => p.time), nowMs);
    current.waterTempC = marine.waterTemp[idx].value;
  }
  if (dmiSea !== null) current.waterTempMeasured = dmiSea;
  if (marine.waterLevel.length) {
    const idx = findClosestIdx(marine.waterLevel.map(p => p.time), nowMs);
    current.waterLevelCm = marine.waterLevel[idx].value;
  }
  if (marine.current.length) {
    const idx = findClosestIdx(marine.current.map(p => p.time), nowMs);
    current.currentMs = marine.current[idx].speed;
    current.currentDir = marine.current[idx].direction;
  }
  if (marine.salinity.length) {
    const idx = findClosestIdx(marine.salinity.map(p => p.time), nowMs);
    current.salinityPsu = marine.salinity[idx].value;
  }
  if (marine.waves.length) {
    const idx = findClosestIdx(marine.waves.map(p => p.time), nowMs);
    current.waveHeightM = marine.waves[idx].value;
  }

  // Air current values (DMI measured > Yr.no forecast)
  if (dmiAir) {
    current.airTempC = dmiAir.temp;
    current.windMs = dmiAir.windMs;
    current.windDir = dmiAir.windDir;
    current.pressureHpa = dmiAir.pressure;
    current.cloudCover = dmiAir.cloudCover;
  } else if (air.temp.length) {
    const idx = findClosestIdx(air.temp.map(p => p.time), nowMs);
    current.airTempC = air.temp[idx].value;
    if (air.wind.length) {
      current.windMs = air.wind[idx].speed;
      current.windDir = air.wind[idx].direction;
    }
    if (air.pressure.length) current.pressureHpa = air.pressure[idx].value;
    if (air.cloudCover.length) current.cloudCover = air.cloudCover[idx].value;
  }

  return { marine, air, current, nowTime: now };
}

// ─── Helpers ───

export function windDirToLabel(deg: number): string {
  const dirs = ['N', 'NØ', 'Ø', 'SØ', 'S', 'SV', 'V', 'NV'];
  return dirs[Math.round(deg / 45) % 8];
}

/** Calculate sunrise, solar noon, sunset for a given date at Aarhus coords. Returns UTC hours. */
export function sunTimes(date: Date): { rise: string; noon: string; set: string } {
  const { lat, lon } = COORDS.aarhus;
  const rad = Math.PI / 180;
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000);
  const decl = -23.45 * Math.cos(rad * 360 / 365 * (dayOfYear + 10));
  const cosHa = -Math.tan(lat * rad) * Math.tan(decl * rad);
  // Clamp for polar day/night
  const ha = Math.acos(Math.max(-1, Math.min(1, cosHa))) / rad;
  const solarNoon = 12 - lon / 15; // UTC hours
  const rise = solarNoon - ha / 15;
  const set = solarNoon + ha / 15;

  const fmt = (h: number) => {
    const hh = Math.floor(h);
    const mm = Math.round((h - hh) * 60);
    return `${hh.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
  };

  return { rise: fmt(rise), noon: fmt(solarNoon), set: fmt(set) };
}

/** Get value from hourly data at a specific UTC time string (HH:MM) on a given date */
export function valueAtTime(
  data: HourlyPoint[],
  date: Date,
  utcTime: string,
): number | undefined {
  const dateStr = date.toISOString().slice(0, 10);
  const [hh] = utcTime.split(':').map(Number);
  // Find closest point to that hour on that date
  let best: number | undefined;
  let bestDiff = Infinity;
  for (const p of data) {
    if (!p.time.startsWith(dateStr)) continue;
    const pH = new Date(p.time).getUTCHours();
    const diff = Math.abs(pH - hh);
    if (diff < bestDiff) { bestDiff = diff; best = p.value; }
  }
  return best;
}
