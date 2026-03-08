// ─── Domain Types ───
// Single source of truth for all shared types across the application.

// ── Trip & Trend types (from data/trips.ts) ──

export interface TrendData {
  dates: string[];
  temp: (number | null)[];
  pressure: (number | null)[];
  wind: (number | null)[];
  precip: (number | null)[];
  temp_trend?: string;
  pressure_trend?: string;
  wind_trend?: string;
}

export interface Trip {
  date: string; spot: string;
  timeStart?: string; timeEnd?: string;
  totalCatch: number;
  catches: { species: string; count: number; sizeCm?: number; released?: boolean }[];
  lures: { type?: string; model?: string; color?: string; weightG?: number }[];
  photos: string[]; coverPhoto?: string; notes?: string; isGuess: boolean;
  weather: {
    tempC?: number; waterTempC?: number; windMs?: number;
    windDir?: string; pressureHpa?: number;
    moonPhase?: string; moonPct?: number;
    trend?: TrendData;
  };
}

// ── Weather types (from services/weather.ts) ──

export interface HourlyPoint {
  time: string;   // ISO timestamp
  value: number;
}

export interface HourlyVector {
  time: string;
  speed: number;
  direction: number;
}

export interface MarineData {
  waterTemp: HourlyPoint[];
  waterLevel: HourlyPoint[];
  current: HourlyVector[];
  waves: HourlyPoint[];
  wavePeriod: HourlyPoint[];
  salinity: HourlyPoint[];
}

export interface AirData {
  temp: HourlyPoint[];
  wind: HourlyVector[];
  cloudCover: HourlyPoint[];
  pressure: HourlyPoint[];
  precip: HourlyPoint[];
  /** Yr.no symbol codes per hour (only for forecast period) */
  symbols: { time: string; code: string }[];
}

export interface CurrentSnapshot {
  waterTempC?: number;
  waterTempMeasured?: number; // DMI OceanObs measured
  waterLevelCm?: number;
  currentMs?: number;
  currentDir?: number;
  salinityPsu?: number;
  waveHeightM?: number;
  airTempC?: number;
  windMs?: number;
  windDir?: number;
  pressureHpa?: number;
  cloudCover?: number;
}

export interface ForecastData {
  marine: MarineData;
  air: AirData;
  current: CurrentSnapshot;
  /** Timestamps marking "now" for the shared time axis */
  nowTime: string;
}

// ── Spot types (from components/TodayForecast.tsx) ──

export interface SpotConfig {
  name: string;
  short: string;
  type: 'kyst' | 'havn' | 'sø';
  species: string[];
}
