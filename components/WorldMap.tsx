'use client'

import { useState, useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from '@vnedyalk0v/react19-simple-maps'
import { scaleLinear } from 'd3-scale'

// ─── Hardcoded data ───────────────────────────────────────────────────────────
// Key = ISO Alpha-3 country code  https://www.iban.com/country-codes
// For cities/states, use the Markers section below instead

const COUNTRY_DATA: Record<string, number> = {
  USA: 9800,
  GBR: 8500,
  JPN: 8100,
  IND: 8900,
  FRA: 7700,
  CAN: 6300,
  KOR: 6700,
  DEU: 2800,
  PAK: 6000,
  BRA: 5300,
  EGY: 3800,
  NGA: 3200,
  AUS: 5900,
  SGP: 5500,
  THA: 3700,
  ARE: 5100,
  ZAF: 2900,
  MEX: 4600,
  IDN: 4200,
  SAU: 4900,
}

// City / state / postal level — lat/lng hardcoded (no geocoding needed)
const CITY_DATA = [
  { name: 'Toronto',          value: 6300, lat: 43.6532,  lng: -79.3832  },
  { name: 'Mumbai',           value: 8900, lat: 19.0760,  lng: 72.8777   },
  { name: 'Lahore',           value: 4800, lat: 31.5204,  lng: 74.3587   },
  { name: 'Karachi',          value: 6200, lat: 24.8607,  lng: 67.0011   },
  { name: 'Dubai',            value: 5100, lat: 25.2048,  lng: 55.2708   },
  { name: 'Seoul',            value: 6700, lat: 37.5665,  lng: 126.9780  },
  { name: 'São Paulo',        value: 5300, lat: -23.5505, lng: -46.6333  },
  { name: 'Sydney',           value: 5900, lat: -33.8688, lng: 151.2093  },
  { name: 'Singapore',        value: 5500, lat: 1.3521,   lng: 103.8198  },
  { name: 'Bangkok',          value: 3700, lat: 13.7563,  lng: 100.5018  },
]

// TopoJSON — free, bundled, no API
const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'

// ISO numeric → ISO alpha-3 lookup (simple-maps geographies use numeric IDs)
const NUM_TO_A3: Record<string, string> = {
  '840': 'USA', '826': 'GBR', '392': 'JPN', '356': 'IND', '250': 'FRA',
  '124': 'CAN', '410': 'KOR', '276': 'DEU', '586': 'PAK', '076': 'BRA',
  '818': 'EGY', '566': 'NGA', '036': 'AUS', '702': 'SGP', '764': 'THA',
  '784': 'ARE', '710': 'ZAF', '484': 'MEX', '360': 'IDN', '682': 'SAU',
}

// ─── Color scale ──────────────────────────────────────────────────────────────

const ALL_VALUES = [
  ...Object.values(COUNTRY_DATA),
  ...CITY_DATA.map((c) => c.value),
]
const MIN_VAL = Math.min(...ALL_VALUES)
const MAX_VAL = Math.max(...ALL_VALUES)

// Light grey → rich indigo — minimal & modern
const colorScale = scaleLinear<string>()
  .domain([MIN_VAL, MAX_VAL])
  .range(['#e0e7ff', '#3730a3'])   // indigo-100 → indigo-800

const dotColorScale = scaleLinear<string>()
  .domain([MIN_VAL, MAX_VAL])
  .range(['#a5b4fc', '#1e1b4b'])   // indigo-300 → indigo-950

// ─── Tooltip type ─────────────────────────────────────────────────────────────

interface TooltipData {
  name: string
  value: number
  x: number
  y: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorldMap() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)
  const [zoom, setZoom]       = useState(1)

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-200 shadow-sm">

      {/* Header */}
      <div className="px-6 pt-6 pb-2 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400">
            Global Reach
          </p>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mt-0.5">
            Students Worldwide
          </h3>
        </div>

        {/* Zoom controls */}
        <div className="flex gap-1">
          {[
            { label: '+', action: () => setZoom((z) => Math.min(z + 0.5, 6)) },
            { label: '−', action: () => setZoom((z) => Math.max(z - 0.5, 1)) },
            { label: '↺', action: () => setZoom(1) },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="w-8 h-8 rounded-xl bg-white border border-slate-200 text-slate-500 text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Map */}
      <div className="w-full h-[380px] sm:h-[500px] lg:h-[600px]">
        <ComposableMap
          projectionConfig={{ scale: 145, center: [15, 10] }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={zoom} onMoveEnd={({ zoom: z }) => setZoom(z)}>

            {/* Countries */}
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const a3    = NUM_TO_A3[geo.id] ?? ''
                  const value = COUNTRY_DATA[a3]
                  const fill  = value != null ? colorScale(value) : '#f1f5f9'

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={fill}
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      style={{
                        default: {
                          outline: 'none',
                          transition: 'fill 0.15s ease',
                        },
                        hover: {
                          outline: 'none',
                          fill: value != null
                            ? colorScale(Math.min(value * 1.15, MAX_VAL))
                            : '#e2e8f0',
                          cursor: value != null ? 'pointer' : 'default',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.12))',
                        },
                        pressed: { outline: 'none' },
                      }}
                      onMouseEnter={(e) => {
                        if (!value) return
                        const countryName =
                          Object.entries(NUM_TO_A3).find(([, v]) => v === a3)?.[0] ?? a3
                        setTooltip({
                          name:  geo.properties?.name ?? a3,
                          value,
                          x:     e.clientX,
                          y:     e.clientY,
                        })
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    />
                  )
                })
              }
            </Geographies>

            {/* City markers */}
            {CITY_DATA.map((city) => (
              <Marker
                key={city.name}
                coordinates={[city.lng, city.lat]}
                onMouseEnter={(e) =>
                  setTooltip({ name: city.name, value: city.value, x: e.clientX, y: e.clientY })
                }
                onMouseLeave={() => setTooltip(null)}
              >
                {/* Pulse ring */}
                <circle
                  r={6 + (city.value / MAX_VAL) * 6}
                  fill={dotColorScale(city.value)}
                  fillOpacity={0.15}
                  style={{ animation: 'pulse-ring 2s ease-out infinite' }}
                />
                {/* Dot */}
                <circle
                  r={3 + (city.value / MAX_VAL) * 4}
                  fill={dotColorScale(city.value)}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  style={{ cursor: 'pointer', transition: 'r 0.2s ease' }}
                />
              </Marker>
            ))}

          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-slate-400 font-medium">
            {MIN_VAL.toLocaleString()}
          </span>
          <div
            className="w-32 sm:w-48 h-2 rounded-full"
            style={{
              background: 'linear-gradient(to right, #e0e7ff, #3730a3)',
            }}
          />
          <span className="text-[11px] text-slate-400 font-medium">
            {MAX_VAL.toLocaleString()}
          </span>
        </div>
        <p className="text-[11px] text-slate-400">
          {Object.keys(COUNTRY_DATA).length + CITY_DATA.length} locations
        </p>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: tooltip.x + 14, top: tooltip.y - 56 }}
        >
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xl">
            <p className="font-bold text-[13px] text-slate-800">{tooltip.name}</p>
            <p className="text-[12px] text-slate-400 mt-0.5">
              {tooltip.value.toLocaleString()} students
            </p>
            {/* Mini bar */}
            <div className="mt-2 w-32 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${((tooltip.value - MIN_VAL) / (MAX_VAL - MIN_VAL)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Pulse animation */}
      <style>{`
        @keyframes pulse-ring {
          0%   { r: 6px; opacity: 0.4; }
          100% { r: 18px; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
