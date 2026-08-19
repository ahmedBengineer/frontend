'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Cookies from 'js-cookie'

const SUMMARY_TRUNCATE = 80

// ─── Types ────────────────────────────────────────────────────────────────────

interface AggregatedPoint {
  postal_code: string
  count: number
  latitude: number
  longitude: number
  normalized: number
  external_case_ids: string[]
  summaries: string[]
}

const INITIAL_CENTER: [number, number] = [45.5, -75.7]
const INITIAL_ZOOM = 10

// ─── Spectrum colour stops (light → dark, multi-hue) ─────────────────────────

const SPECTRUM_STOPS = [
  { stop: 0.00, r: 0,   g: 255, b: 150 }, // neon mint
  { stop: 0.25, r: 0,   g: 120, b: 255 }, // electric blue
  { stop: 0.50, r: 255, g: 0,   b: 90  }, // hot pink
  { stop: 0.75, r: 180, g: 0,   b: 255 }, // neon violet
  { stop: 1.00, r: 80,  g: 0,   b: 200 }  // deep neon purple
]

function spectrumColor(t: number): string {
  for (let i = 1; i < SPECTRUM_STOPS.length; i++) {
    if (t <= SPECTRUM_STOPS[i].stop) {
      const prev  = SPECTRUM_STOPS[i - 1]
      const curr  = SPECTRUM_STOPS[i]
      const local = (t - prev.stop) / (curr.stop - prev.stop)
      return `rgb(${Math.round(prev.r + (curr.r - prev.r) * local)},${Math.round(prev.g + (curr.g - prev.g) * local)},${Math.round(prev.b + (curr.b - prev.b) * local)})`
    }
  }
  const last = SPECTRUM_STOPS[SPECTRUM_STOPS.length - 1]
  return `rgb(${last.r},${last.g},${last.b})`
}

// ─── Category → item label mapping ───────────────────────────────────────────

function getItemLabel(category: string | null): string {
  if (!category) return 'complaint'
  const normalized = category.trim().toLowerCase()
  if (normalized === 'municipal services') return 'complaint'
  if (
    normalized === 'food & beverage' ||
    normalized === 'food production' ||
    normalized === 'hospitality' ||
    normalized === 'restaurant'
  ) return 'order'
  return 'complaint'
}

// ─── Full-list popup (React) ──────────────────────────────────────────────────

function CaseRow({ id, summary, isFirst }: { id: string; summary: string; isFirst: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const isTruncated = summary.length > SUMMARY_TRUNCATE

  return (
    <div className={`flex items-start gap-3 py-3 ${isFirst ? '' : 'border-t border-slate-100'}`}>
      <span className="flex-shrink-0 text-[10px] font-medium text-violet-700 bg-violet-50 rounded-md px-2 py-0.5 mt-0.5 tracking-wide">
        #{id}
      </span>
      <span className="text-xs font-light text-slate-500 leading-relaxed">
        {expanded || !isTruncated ? summary : summary.slice(0, SUMMARY_TRUNCATE) + '…'}
        {isTruncated && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="ml-1 text-[10px] text-violet-500 hover:text-violet-700 transition-colors"
          >
            {expanded ? 'less' : 'see more'}
          </button>
        )}
      </span>
    </div>
  )
}

function FullListPopup({
  point,
  itemLabel,
  onClose,
}: {
  point: AggregatedPoint
  itemLabel: string
  onClose: () => void
}) {
  const [flashRed, setFlashRed] = useState(false)

  const triggerFlash = () => {
    setFlashRed(true)
    setTimeout(() => setFlashRed(false), 1000)
  }

  // Flash X on Escape instead of closing
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') triggerFlash() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div
      className="absolute inset-0 z-[4000] flex items-center justify-center p-6"
      onClick={triggerFlash}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-light tracking-[0.2em] uppercase text-slate-400 mb-0.5">
              {itemLabel} list
            </p>
            <h2 className="text-lg font-extralight tracking-tight text-slate-900">
              {point.postal_code}
            </h2>
            <p className="text-xs font-light text-slate-400 mt-0.5">
              {point.count.toLocaleString()} {itemLabel}{point.count !== 1 ? 's' : ''}
            </p>
          </div>
          {/* X button — flashes red on outside click, closes only when directly clicked */}
          <button
            onClick={(e) => { e.stopPropagation(); onClose() }}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 mt-0.5 ${
              flashRed
                ? 'bg-red-100 scale-110'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <span className={`text-sm leading-none transition-colors duration-200 ${
              flashRed ? 'text-red-500' : 'text-slate-500'
            }`}>✕</span>
          </button>
        </div>

        {/* Spectrum bar */}
        <div className="px-6 py-3 border-b border-slate-100">
          <div className="relative h-1.5 rounded-full" style={{
            background: 'linear-gradient(to right,#c8f0d8,#a0d4f5,#f9c8d4,#c3a0d8,#6b4f8c)',
          }}>
            <div style={{
              position: 'absolute', top: '-3px',
              left: `${Math.round(point.normalized * 100)}%`,
              transform: 'translateX(-50%)',
              width: '10px', height: '10px',
              borderRadius: '50%', background: '#6b4f8c',
              border: '2px solid white',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto px-6 py-2" style={{ maxHeight: '400px' }}>
          {point.external_case_ids.map((id, i) => (
            <CaseRow
              key={id}
              id={id}
              summary={point.summaries[i] ?? '—'}
              isFirst={i === 0}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/60">
          <p className="text-[10px] font-light text-slate-400 tracking-wide text-center">
            {point.count} total · press ✕ to close
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function HeatMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef       = useRef<maplibregl.Map | null>(null)
  const [points, setPoints]         = useState<AggregatedPoint[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [activePoint, setActivePoint] = useState<AggregatedPoint | null>(null)
  const [mapReady, setMapReady]     = useState(false)

  // ── Read category from localStorage and derive the item label ─────────────
  const [itemLabel, setItemLabel] = useState<string>('complaint')

  useEffect(() => {
    const category = localStorage.getItem('category')
    setItemLabel(getItemLabel(category))
  }, [])

  const itemLabelCap = itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)

  // ── Fetch aggregated complaint locations ───────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reports/complaint-locations/?aggregate=postal_code`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${Cookies.get('Token') || ''}`,
            },
          }
        )

        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`)

        const data = await res.json()
        const results: {
          postal_code: string
          count: number
          latitude: number
          longitude: number
          external_case_ids: string[]
          summaries: string[]
        }[] = data.results ?? data
        console.log('Fetched complaint locations:', results)

        const valid = results.filter(
          (r) => r.latitude != null && r.longitude != null
        )

        const max  = Math.max(...valid.map((r) => r.count))
        const min  = Math.min(...valid.map((r) => r.count))
        const span = max - min || 1

        setPoints(
          valid.map((r) => ({
            ...r,
            normalized: (r.count - min) / span,
          }))
        )
      } catch (err: any) {
        setError(err.message ?? 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [INITIAL_CENTER[1], INITIAL_CENTER[0]], // MapLibre: [lng, lat]
      zoom: INITIAL_ZOOM,
      pitch: 30,
      bearing: -10,
      attributionControl: false,
    })
    mapRef.current = map

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'bottom-right',
    )

    map.on('load', () => {
      // ── 3D buildings ────────────────────────────────────────────────────────
      const style      = map.getStyle()
      const sources    = (style?.sources ?? {}) as Record<string, { type?: string }>
      const vectorSrcId = Object.keys(sources).find((k) => sources[k].type === 'vector')

      if (vectorSrcId) {
        try {
          map.addLayer({
            id: '3d-buildings',
            source: vectorSrcId,
            'source-layer': 'building',
            type: 'fill-extrusion',
            minzoom: 14,
            paint: {
              'fill-extrusion-color': '#aac4d0',
              'fill-extrusion-height': [
                'coalesce',
                ['get', 'render_height'],
                ['get', 'height'],
                0,
              ],
              'fill-extrusion-base': [
                'coalesce',
                ['get', 'render_min_height'],
                ['get', 'min_height'],
                0,
              ],
              'fill-extrusion-opacity': 0.55,
            },
          })
        } catch (err) {
          console.warn('3D buildings layer could not be added:', err)
        }
      }

      setMapReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // ── Heatmap + circle layers + interactions ─────────────────────────────────
  useEffect(() => {
    if (!mapReady || !mapRef.current || points.length === 0) return

    const map = mapRef.current

    // Build GeoJSON feature collection — MapLibre uses [lng, lat] coordinate order
    const geojson = {
      type: 'FeatureCollection' as const,
      features: points.map((p, i) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [p.longitude, p.latitude] as [number, number],
        },
        properties: {
          index:      i,
          normalized: p.normalized,
          color:      spectrumColor(p.normalized),
          radius:     3 + p.normalized * 6,
        },
      })),
    }

    // ── Source ──────────────────────────────────────────────────────────────
    if (map.getSource('heatmap-points')) {
      ;(map.getSource('heatmap-points') as maplibregl.GeoJSONSource).setData(geojson)
    } else {
      map.addSource('heatmap-points', { type: 'geojson', data: geojson })
    }

    // ── Heatmap layer ────────────────────────────────────────────────────────
    if (!map.getLayer('heatmap-layer')) {
      map.addLayer({
        id: 'heatmap-layer',
        type: 'heatmap',
        source: 'heatmap-points',
        paint: {
          // Weight each point by its normalized value (0 → 1)
          'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'normalized'],
            0, 0,
            1, 1,
          ],
          'heatmap-radius': 60,
          // Doubled intensity so density gradients cut through the colourful base map
          'heatmap-intensity': 2.5,
          'heatmap-opacity': 0.88,
          // Gradient: fully opaque from the very first stop so it never disappears
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,     'rgba(0,0,0,0)',
            0.05,  'rgba(200,240,216,0.85)',  // soft mint — visible even at low density
            0.25,  'rgba(160,212,245,0.90)',  // periwinkle
            0.50,  'rgba(249,200,212,0.92)',  // blush rose
            0.75,  'rgba(195,160,216,0.95)',  // soft lavender
            1.0,   'rgba(107,79,140,1.00)',   // deep plum — fully opaque at peak
          ],
        },
      })
    }

    // ── Circle shadow layer (dark halo behind each dot for contrast) ──────────
    if (!map.getLayer('circles-shadow')) {
      map.addLayer({
        id: 'circles-shadow',
        type: 'circle',
        source: 'heatmap-points',
        paint: {
          // Slightly larger than the main dot to form a dark outline ring
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'normalized'],
            0, 10,
            1, 20,
          ],
          'circle-color':   '#0f172a',
          'circle-opacity': 0.28,
          'circle-blur':    0.4,
        },
      })
    }

    // ── Circle layer ─────────────────────────────────────────────────────────
    if (!map.getLayer('circles-layer')) {
      map.addLayer({
        id: 'circles-layer',
        type: 'circle',
        source: 'heatmap-points',
        paint: {
          // radius = 6 + normalized * 9  →  range [6, 15] — larger so they read clearly
          'circle-radius': [
            'interpolate', ['linear'], ['get', 'normalized'],
            0, 6,
            1, 15,
          ],
          'circle-color':        ['get', 'color'],
          // Thicker white stroke for separation from any background colour
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2.5,
          'circle-opacity':      1,
        },
      })
    }

    // ── Hover popup ──────────────────────────────────────────────────────────
    const popup = new maplibregl.Popup({
      closeButton:  false,
      closeOnClick: false,
      className:    'heatmap-tooltip',
    })

    const onMouseEnter = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return

      const idx = feature.properties?.index as number
      const p   = points[idx]
      if (!p) return

      map.getCanvas().style.cursor = 'pointer'

      const PREVIEW_COUNT = 5
      const caseRows = p.external_case_ids
        .slice(0, PREVIEW_COUNT)
        .map((id, i) => {
          const summary = p.summaries[i] ?? '—'
          const display = summary.length > 60 ? summary.slice(0, 60) + '…' : summary
          return `
            <div style="
              display:flex;
              align-items:flex-start;
              gap:10px;
              padding:7px 0;
              ${i !== 0 ? 'border-top:1px solid #f1f5f9;' : ''}
            ">
              <span style="
                flex-shrink:0;
                font-size:10px;
                font-weight:500;
                color:#6b4f8c;
                background:#f3f0f7;
                border-radius:6px;
                padding:2px 7px;
                letter-spacing:0.03em;
                margin-top:1px;
              ">#${id}</span>
              <span style="
                flex:1;
                min-width:0;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                font-size:11px;
                font-weight:300;
                color:#475569;
                line-height:1.5;
                letter-spacing:0.01em;
              ">${display}</span>
            </div>
          `
        }).join('')

      const clickHint = p.external_case_ids.length > PREVIEW_COUNT
        ? `<div style="
            margin-top:8px;
            padding:7px 10px;
            background:#f8f7fc;
            border-radius:8px;
            border:1px solid #ede9f6;
            font-size:10px;
            font-weight:400;
            color:#7c5fbf;
            letter-spacing:0.02em;
            text-align:center;
            cursor:pointer;
          ">
            🖱 Click the dot to see all ${p.external_case_ids.length} ${itemLabel}s
          </div>`
        : ''

      popup
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="
            font-family: system-ui, sans-serif;
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 14px;
            padding: 12px 14px;
            box-shadow: 0 4px 24px rgba(0,0,0,0.10);
            min-width: 220px;
            max-width: 300px;
            overflow: hidden;
          ">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <div style="font-weight:400;font-size:13px;color:#0f172a;letter-spacing:0.01em">
                ${p.postal_code}
              </div>
              <div style="font-size:11px;font-weight:300;color:#94a3b8;letter-spacing:0.02em">
                ${p.count.toLocaleString()} ${itemLabel}${p.count !== 1 ? 's' : ''}
              </div>
            </div>

            <div style="
              height:3px;
              border-radius:99px;
              background:linear-gradient(to right,#c8f0d8,#a0d4f5,#f9c8d4,#c3a0d8,#6b4f8c);
              margin-bottom:10px;
              position:relative;
            ">
              <div style="
                position:absolute;
                top:-3px;
                left:${Math.round(p.normalized * 100)}%;
                transform:translateX(-50%);
                width:9px;height:9px;
                border-radius:50%;
                background:#6b4f8c;
                border:2px solid white;
                box-shadow:0 1px 4px rgba(0,0,0,0.2);
              "></div>
            </div>

            <div style="border-top:1px solid #f1f5f9;padding-top:8px;">
              ${caseRows}
              ${clickHint}
            </div>
          </div>
        `)
        .addTo(map)
    }

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = ''
      popup.remove()
    }

    const onClick = (e: maplibregl.MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!feature) return
      const idx = feature.properties?.index as number
      const p   = points[idx]
      if (p) setActivePoint(p)
    }

    map.on('mouseenter', 'circles-layer', onMouseEnter)
    map.on('mouseleave', 'circles-layer', onMouseLeave)
    map.on('click',      'circles-layer', onClick)

    // ── Auto-fit bounds ──────────────────────────────────────────────────────
    const bounds = new maplibregl.LngLatBounds()
    points.forEach((p) => bounds.extend([p.longitude, p.latitude]))
    map.fitBounds(bounds, { padding: { top: 40, bottom: 40, left: 40, right: 40 } })

    return () => {
      map.off('mouseenter', 'circles-layer', onMouseEnter)
      map.off('mouseleave', 'circles-layer', onMouseLeave)
      map.off('click',      'circles-layer', onClick)
      popup.remove()
    }
  }, [points, itemLabel, mapReady])

  const minVal = points.length ? Math.min(...points.map((p) => p.count)) : 0
  const maxVal = points.length ? Math.max(...points.map((p) => p.count)) : 0

  return (
    <div className="relative w-full h-[420px] sm:h-[580px] lg:h-[720px] rounded-3xl overflow-hidden shadow-lg border border-slate-200 bg-slate-50">

      {/* Map canvas */}
      <div ref={containerRef} className="w-full h-full" />

      {/* Full-list popup (React overlay, outside MapLibre canvas) */}
      {activePoint && (
        <FullListPopup
          point={activePoint}
          itemLabel={itemLabel}
          onClose={() => setActivePoint(null)}
        />
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center gap-4 bg-white/90 backdrop-blur-sm">
          <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-xs font-light tracking-widest uppercase text-slate-400">
            Loading {itemLabel} locations…
          </p>
        </div>
      )}

      {/* Error overlay */}
      {!loading && error && (
        <div className="absolute inset-0 z-[2000] flex flex-col items-center justify-center gap-2 bg-white/90 backdrop-blur-sm">
          <p className="text-sm font-light tracking-wide text-red-500">Failed to load data</p>
          <p className="text-xs font-light text-slate-400">{error}</p>
        </div>
      )}

      {/* Title overlay */}
      {!loading && !error && (
        <div className="absolute top-4 left-4 z-[1000] pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-3 shadow-sm">
            <p className="text-xs font-light tracking-[0.2em] uppercase text-slate-400">
              {itemLabelCap} Map
            </p>
            <h3 className="text-xl sm:text-2xl font-extralight tracking-tight text-slate-900 leading-tight">
              {itemLabelCap} Locations
            </h3>
            <p className="text-xs font-light text-slate-400 tracking-wide mt-0.5">
              {points.length} postal code{points.length !== 1 ? 's' : ''} mapped
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      {!loading && !error && points.length > 0 && (
        <div className="absolute bottom-4 left-4 z-[1000] pointer-events-none bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm">
          <p className="text-xs font-light tracking-widest uppercase text-slate-400 mb-2">
            {itemLabelCap} Density
          </p>
          <div
            className="w-28 sm:w-44 h-2 rounded-full"
            style={{
              background: 'linear-gradient(to right, #c8f0d8, #a0d4f5, #f9c8d4, #c3a0d8, #6b4f8c)',
            }}
          />
          <div className="flex justify-between mt-1.5">
            <span className="text-xs font-light text-slate-400">{minVal.toLocaleString()}</span>
            <span className="text-xs font-light text-slate-400">{maxVal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Strip MapLibre's default popup chrome — custom HTML is the only visible UI */}
      <style>{`
        .heatmap-tooltip .maplibregl-popup-content {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .heatmap-tooltip .maplibregl-popup-tip {
          display: none !important;
        }
      `}</style>

    </div>
  )
}
