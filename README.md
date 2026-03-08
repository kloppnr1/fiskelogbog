# Fiskelogbog

Personlig fiskelogbog for Aarhus & omegn. Tracker ture, fangster, vejrforhold og trends.

## Features

- **Fiskelogbog** — Trip cards med fangster, vejr, fotos og agn
- **Fiskevejr** — Live vejrdata og 7-dages trends (FCOO + DMI + Yr.no)
- **Sæsonkalender** — GitHub-style heatmap over alle ture
- **11 fiskespots** — Individuelle forecasts for kyst, havn og sø

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS
- FCOO METOC (marine data), DMI Climate Grid (luft-observationer), Yr.no (luft-forecast)

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npx vite build
sudo cp -r dist/* /var/www/fiskelog/
```

Site serves on `http://89.167.101.11:8088`

## Data sources

- **FCOO METOC** — Vandtemperatur, strøm, vandstand, bølger, salinitet
- **DMI Climate Grid** — Lufttemperatur, vind, tryk, skydække (cell 10km_622_59)
- **DMI OceanObs** — Målt havtemperatur (station 22333, supplement)
- **Yr.no Locationforecast** — Luft-forecast (72 timer)

No Open-Meteo. No unauthorized data sources.
