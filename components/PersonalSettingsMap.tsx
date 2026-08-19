"use client"

import { Component, type ReactNode } from "react"
import Map, { Marker, NavigationControl } from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"

class MapErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[360px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center gap-2 text-center px-6 py-12">
          <p className="text-sm text-slate-600 font-light">3D map preview is unavailable right now.</p>
          <p className="text-xs text-slate-400 font-light">Other settings on this page are unaffected.</p>
        </div>
      )
    }

    return this.props.children
  }
}

/** Default center — change or pass from saved address later */
const DEFAULT_LAT = 40.7128
const DEFAULT_LNG = -74.006

/**
 * Mapbox Standard style: contemporary 3D look (built-up areas, landmarks, atmospheric lighting).
 * Uses a pitched camera — right-drag / two-finger drag to rotate & adjust tilt.
 */
export default function PersonalSettingsMap() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!token?.trim()) {
    return (
      <div className="min-h-[360px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 flex flex-col items-center justify-center gap-2 text-center px-6 py-12">
        <p className="text-sm text-slate-600 font-light">
          Add <span className="font-mono text-xs text-slate-800">NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</span> to enable
          the 3D Mapbox map.
        </p>
        <p className="text-xs text-slate-400 font-light max-w-md">
          Create a free token at{" "}
          <a
            href="https://account.mapbox.com/access-tokens/"
            className="text-indigo-600 underline underline-offset-2 hover:text-indigo-800"
            target="_blank"
            rel="noopener noreferrer"
          >
            mapbox.com/access-tokens
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <MapErrorBoundary>
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-inner">
        <Map
          mapboxAccessToken={token}
          mapStyle="mapbox://styles/mapbox/standard"
          initialViewState={{
            longitude: DEFAULT_LNG,
            latitude: DEFAULT_LAT,
            zoom: 15.2,
            pitch: 68,
            bearing: -32,
          }}
          maxPitch={85}
          dragRotate
          touchPitch
          reuseMaps
          style={{ width: "100%", height: 380 }}
          fog={{
            color: "rgb(186, 210, 235)",
            "high-color": "rgb(36, 92, 223)",
            "horizon-blend": 0.02,
            "space-color": "rgb(11, 11, 25)",
            "star-intensity": 0.6,
          }}
        >
          <NavigationControl position="top-right" showCompass visualizePitch />
          <Marker longitude={DEFAULT_LNG} latitude={DEFAULT_LAT} color="#4f46e5" />
        </Map>
        <p className="pointer-events-none absolute bottom-3 left-3 right-16 text-[10px] font-light tracking-wide text-slate-500/90 drop-shadow-sm">
          3D: right-drag to rotate · scroll to zoom
        </p>
      </div>
    </MapErrorBoundary>
  )
}
