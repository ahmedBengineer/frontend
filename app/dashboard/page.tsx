"use client"


import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import Cookies from "js-cookie"
import { Portal } from "@/components/ui/portal"
import { MetricsGrid } from "@/components/metrics-grid"
import { KPICards } from "@/components/kpi-cards"
import { MetricsHeader } from "@/components/metrics-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Phone, Copy, CheckCircle2, Map, X, Maximize2, Users, ExternalLink, ChevronRight, ChevronLeft, Building2, ArrowLeft, ArrowRight, PhoneForwarded, Calendar, AlertTriangle, FolderCheck, HeartPulse, FlaskConical, Stethoscope, ClipboardList, FileText, Pill, ShieldAlert, Trash2, Loader2, Activity } from "lucide-react"
import { useToast } from "@/hooks/use-toast"



// ─── Dynamic import — disables SSR for Leaflet (window is not defined on server) ───
const HeatMap = dynamic(() => import("@/components/HeatMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] sm:h-[580px] lg:h-[720px] rounded-3xl bg-white animate-pulse" />
  ),
})



// ─── Category → item label mapping ───────────────────────────────────────────



function getItemLabel(category: string | null): string {
  if (!category) return 'complaint'
  const normalized = category.trim().toLowerCase()
  if (
    normalized === 'food & beverage' ||
    normalized === 'food production' ||
    normalized === 'hospitality' ||
    normalized === 'restaurant' ||
    normalized === 'restaurants' ||
    normalized === 'cafe' ||
    normalized === 'catering'
  ) return 'order'
  return 'complaint'
}



function CursorGlow() {
  const [position, setPosition] = useState({ x: 0, y: 0 })


  useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener("mousemove", updateMouse)
    return () => window.removeEventListener("mousemove", updateMouse)
  }, [])


  return (
    <div
      className="fixed inset-0 z-20 pointer-events-none transition-opacity duration-500"
      style={{
        background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(251, 191, 36, 0.02), transparent 70%)`,
      }}
    />
  )
}



// ─── Map Dialog ───────────────────────────────────────────────────────────────



function MapDialog({
  open,
  onClose,
  itemLabelCap,
}: {
  open: boolean
  onClose: () => void
  itemLabelCap: string
}) {
  const [flashRed, setFlashRed] = useState(false)                    // ← ADD


  const triggerFlash = () => {                                        // ← ADD
    setFlashRed(true)
    setTimeout(() => setFlashRed(false), 1000)
  }


  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') triggerFlash()                          // ← CHANGE: was onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])


  if (!open) return null


  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-8"
        onClick={triggerFlash}                                          // ← CHANGE: was onClose
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" />


        {/* Dialog panel */}
        <div
          className="relative z-10 w-full max-w-6xl animate-in fade-in zoom-in-95 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
            {/* Dialog header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl flex items-center justify-center border border-indigo-100">
                  <Map className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extralight tracking-tight text-slate-900">{itemLabelCap} Map</h2>
                  <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                    Geographic distribution of {itemLabelCap.toLowerCase()} locations
                  </p>
                </div>
              </div>


              {/* X button — flashes red on outside click, closes only when directly clicked */}
              <button
                onClick={(e) => { e.stopPropagation(); onClose() }}     // ← CHANGE: added stopPropagation
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-200 group ${
                  flashRed
                    ? 'bg-red-100 scale-110'
                    : 'bg-slate-100 hover:bg-slate-200'
                }`}
              >
                <X className={`h-4 w-4 transition-colors duration-200 ${
                  flashRed ? 'text-red-500' : 'text-slate-500 group-hover:text-slate-700'
                }`} />
              </button>
            </div>


            {/* Map lives here */}
            <div className="p-4">
              <HeatMap />
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}




// ─── Map Preview Banner ────────────────────────────────────────────────────────



function MapPreviewBanner({
  onOpen,
  itemLabelCap,
}: {
  onOpen: () => void
  itemLabelCap: string
}) {
  return (
    <div
      className="group relative w-full cursor-pointer overflow-hidden rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={onOpen}
      role="button"
      aria-label={`Open ${itemLabelCap.toLowerCase()} map`}
    >
      {/* ── Live map preview — pointer-events disabled so clicks fall through to the overlay ── */}
      <div className="relative w-full h-72 sm:h-96 overflow-hidden rounded-3xl pointer-events-none select-none">


        {/* Scale the full HeatMap down to fit the preview height */}
        <div
          className="absolute inset-0 origin-top-left"
          style={{ transform: 'scale(0.50)', width: '200%', height: '200%' }}
        >
          <HeatMap />
        </div>


        {/* Soft vignette fade around edges so it looks intentionally cropped */}
        <div className="absolute inset-0 rounded-3xl"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 40%, rgba(248,250,252,0.7) 80%, rgba(248,250,252,0.95) 100%)',
          }}
        />
      </div>


      {/* ── Hover overlay — text only now ── */}
        <div className="absolute inset-0 rounded-3xl flex items-end px-5 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent">
          <div>
            <p className="text-xs font-light tracking-[0.2em] uppercase text-white/80 mb-0.5">
              Interactive
            </p>
            <h3 className="text-lg font-extralight tracking-tight text-white leading-tight drop-shadow">
              {itemLabelCap} Location Map
            </h3>
          </div>
        </div>


        {/* ── Always-visible Expand button ── */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white border border-indigo-200 rounded-2xl px-4 py-2 shadow-md group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
          <Maximize2 className="h-4 w-4 text-indigo-600 group-hover:text-white transition-colors duration-300" />
          <span className="text-sm font-light text-indigo-600 group-hover:text-white transition-colors duration-300">Expand Map</span>
        </div>


      {/* ── Always-visible bottom bar with label + spectrum ── */}
      <div className="absolute bottom-0 left-0 right-0 rounded-b-3xl px-5 py-2.5 flex items-center justify-between bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
        <div className="flex items-center gap-2">
          <Map className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-xs font-light tracking-wide text-slate-600">
            {itemLabelCap} Map
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        </div>
        <div
          className="w-24 sm:w-32 h-1.5 rounded-full"
          style={{
            background: "linear-gradient(to right, #c8f0d8, #a0d4f5, #f9c8d4, #c3a0d8, #6b4f8c)",
          }}
        />
      </div>
    </div>
  )
}



// ─── Food / restaurant categories ────────────────────────────────────────────

const FOOD_CATEGORIES = new Set([
  'food & beverage',
  'food production',
  'hospitality',
  'restaurant',
  'restaurants',
  'cafe',
  'catering',
])

// ─── Municipal / Government categories ───────────────────────────────────────

const MUNICIPAL_CATEGORIES = new Set([
  'municipal services',
  'municipal service',
  'municipality',
  'municipal',
  'government',
  'govt',
  'public services',
  'public service',
  'city services',
])

// ─── Healthcare / Hospital categories ────────────────────────────────────────

const HEALTHCARE_CATEGORIES = new Set([
  'hospital',
  'healthcare',
  'health care',
  'medical',
  'clinic',
  'health',
  'pharmacy',
  'dental',
  'veterinary',
])

const HOSPITAL_SPREADSHEET_ID = '1l0elKSyIQEmd3RJDPm_hb7GdZYDsKQ59zIQ2ElllbDk'
const HOSPITAL_RANGE = 'A1:Z1000'

// ─── Calendar helpers & types ─────────────────────────────────────────────────

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

interface CalendarEvent {
  date: string
  count: number
  external_case_ids: string[]
  summaries: string[]
  orderDetails?: {
    id: number
    external_order_id: string
    event_type: string
    postal_code: string
    summary: string
    total_price: number | null
    created_at: string
    order_date: string
  }[]
}

// ─── Calendar Preview Banner ──────────────────────────────────────────────────

function CalendarPreviewBanner({
  onOpen,
  itemLabelCap,
}: {
  onOpen: () => void
  itemLabelCap: string
}) {
  const today = new Date()
  const year  = today.getFullYear()
  const month = today.getMonth()
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDayOfMonth(year, month)
  const todayDate   = today.getDate()

  // Real event counts keyed by "YYYY-MM-DD"
  const [previewEvents, setPreviewEvents] = useState<Record<string, number>>({})

  useEffect(() => {
    const lastDay = daysInMonth
    const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const dateTo   = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
    fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/reports/total-orders/?aggregate=overview&date_from=${dateFrom}&date_to=${dateTo}`,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${Cookies.get('Token') || ''}`,
        },
      }
    )
      .then(r => r.json())
      .then(data => {
        const all: any[] = [
          ...(data?.current_orders?.details ?? []),
          ...(data?.total_orders?.details ?? []),
        ]
        const counts: Record<string, number> = {}
        for (const order of all) {
          const key = (order.order_date ?? order.created_at ?? '').split('T')[0]
          if (key) counts[key] = (counts[key] ?? 0) + 1
        }
        setPreviewEvents(counts)
      })
      .catch(() => {})
  }, [])

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  return (
    <div
      className="group relative w-full cursor-pointer overflow-hidden rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300"
      onClick={onOpen}
      role="button"
      aria-label={`Open ${itemLabelCap.toLowerCase()} calendar`}
    >
      {/* Mini calendar preview */}
      <div className="relative bg-white px-6 pt-5 pb-10 pointer-events-none select-none">
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <span className="text-sm font-light text-slate-800">{MONTH_NAMES[month]} {year}</span>
          </div>
          <span className="text-xs font-light text-slate-400 tracking-wide">{itemLabelCap} Calendar</span>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-slate-400 pb-1">{d}</div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-y-1">
          {cells.map((day, i) => (
            <div key={i} className="flex flex-col items-center py-0.5">
              {day !== null && (
                <>
                  <span className={`text-[11px] font-light rounded-full w-6 h-6 flex items-center justify-center
                    ${day === todayDate ? 'bg-indigo-600 text-white font-medium' : 'text-slate-500'}`}>
                    {day}
                  </span>
                  {(() => {
                    const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                    const count = previewEvents[key] ?? 0
                    if (count === 0) return null
                    // Show 1–3 dots based on quantity
                    const dots = count >= 5 ? 3 : count >= 2 ? 2 : 1
                    return (
                      <div className="flex gap-0.5 mt-0.5">
                        {Array.from({ length: dots }).map((_, di) => (
                          <div key={di} className="w-1 h-1 rounded-full bg-indigo-500" />
                        ))}
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          ))}
        </div>

        {/* Fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 rounded-3xl flex items-end px-5 pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-slate-900/25 via-transparent to-transparent">
        <div>
          <p className="text-xs font-light tracking-[0.2em] uppercase text-white/80 mb-0.5">Interactive</p>
          <h3 className="text-lg font-extralight tracking-tight text-white leading-tight drop-shadow">{itemLabelCap} Calendar</h3>
        </div>
      </div>

      {/* Expand button */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-white border border-indigo-200 rounded-2xl px-4 py-2 shadow-md group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all duration-300">
        <Maximize2 className="h-4 w-4 text-indigo-600 group-hover:text-white transition-colors duration-300" />
        <span className="text-sm font-light text-indigo-600 group-hover:text-white transition-colors duration-300">Expand Calendar</span>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 rounded-b-3xl px-5 py-2.5 flex items-center justify-between bg-white/80 backdrop-blur-sm border-t border-slate-200/60">
        <div className="flex items-center gap-2">
          <Calendar className="h-3.5 w-3.5 text-indigo-500" />
          <span className="text-xs font-light tracking-wide text-slate-600">{itemLabelCap} Calendar</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
        </div>
        <div className="w-24 sm:w-32 h-1.5 rounded-full" style={{ background: 'linear-gradient(to right, #e0e7ff, #a5b4fc, #6366f1)' }} />
      </div>
    </div>
  )
}

// ─── Calendar Modal ───────────────────────────────────────────────────────────

function CalendarModal({
  open,
  onClose,
  itemLabelCap,
}: {
  open: boolean
  onClose: () => void
  itemLabelCap: string
}) {
  const today  = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents]           = useState<CalendarEvent[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [selectedDay, setSelectedDay] = useState<CalendarEvent | null>(null)

  // Fetch orders for current month view
  useEffect(() => {
    if (!open) return
    setLoadingEvents(true)
    setSelectedDay(null)

    const lastDay = getDaysInMonth(year, month)
    const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`
    const dateTo   = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

    const go = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reports/total-orders/?aggregate=overview&date_from=${dateFrom}&date_to=${dateTo}`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${Cookies.get('Token') || ''}`,
            },
          }
        )
        const data = await res.json()

        // Combine current_orders + total_orders details
        const allDetails: any[] = [
          ...(data?.current_orders?.details ?? []),
          ...(data?.total_orders?.details ?? []),
        ]

        // Group by date (YYYY-MM-DD from order_date or created_at)
        const grouped: Record<string, { ids: string[]; summaries: string[]; details: any[] }> = {}
        for (const order of allDetails) {
          const raw = order.order_date ?? order.created_at ?? ''
          const dateKey = raw.split('T')[0]
          if (!dateKey) continue
          if (!grouped[dateKey]) grouped[dateKey] = { ids: [], summaries: [], details: [] }
          grouped[dateKey].ids.push(order.external_order_id ?? String(order.id))
          grouped[dateKey].summaries.push(order.summary ?? order.external_order_id ?? '—')
          grouped[dateKey].details.push(order)
        }

        setEvents(
          Object.entries(grouped).map(([date, g]) => ({
            date,
            count: g.ids.length,
            external_case_ids: g.ids,
            summaries: g.summaries,
            orderDetails: g.details,
          }))
        )
      } catch (err) {
        console.error('Error fetching calendar events:', err)
      } finally {
        setLoadingEvents(false)
      }
    }
    go()
  }, [open, year, month])

  // Escape to close
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const daysInMonth = getDaysInMonth(year, month)
  const firstDay    = getFirstDayOfMonth(year, month)
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  // map events by date string "YYYY-MM-DD"
  const eventMap: Record<string, CalendarEvent> = {}
  events.forEach(ev => { eventMap[ev.date] = ev })

  const cells: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const toKey = (d: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const isToday     = (d: number) => isCurrentMonth && d === today.getDate()
  const isPastDay   = (d: number) => new Date(year, month, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const prevMonth = () => { setSelectedDay(null); if (month === 0) { setYear(y => y - 1); setMonth(11) } else setMonth(m => m - 1) }
  const nextMonth = () => { setSelectedDay(null); if (month === 11) { setYear(y => y + 1); setMonth(0) } else setMonth(m => m + 1) }

  return (
    <Portal>
      <div
        className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-8"
        onClick={onClose}
      >
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" />

        <div
          className="relative z-10 w-full max-w-5xl animate-in fade-in zoom-in-95 duration-300"
          style={{ maxHeight: '90vh' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl flex items-center justify-center border border-indigo-100">
                  <Calendar className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-extralight tracking-tight text-slate-900">{itemLabelCap} Calendar</h2>
                  <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                    {events.length} recorded date{events.length !== 1 ? 's' : ''} · click a highlighted day for details
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
              >
                <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
              </button>
            </div>

            {/* Body */}
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {/* Calendar grid pane */}
              <div className="flex-1 flex flex-col p-6 overflow-auto">

                {/* Month / year navigation */}
                <div className="flex items-center justify-between mb-5 shrink-0">
                  <button onClick={prevMonth} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <ArrowLeft className="h-4 w-4 text-slate-500" />
                  </button>
                  <h3 className="text-lg font-extralight tracking-tight text-slate-800">
                    {MONTH_NAMES[month]} <span className="text-slate-400">{year}</span>
                  </h3>
                  <button onClick={nextMonth} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <ArrowRight className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                {loadingEvents ? (
                  <div className="flex-1 flex items-center justify-center py-16">
                    <div className="relative w-10 h-10">
                      <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                      <div className="absolute inset-0 border-2 border-indigo-500 rounded-full border-t-transparent animate-spin" />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Day-of-week headers */}
                    <div className="grid grid-cols-7 mb-2 shrink-0">
                      {DAY_NAMES.map(d => (
                        <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">{d}</div>
                      ))}
                    </div>

                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1">
                      {cells.map((day, i) => {
                        if (day === null) return <div key={`e-${i}`} className="min-h-[64px]" />
                        const key = toKey(day)
                        const ev  = eventMap[key]
                        const todayCell = isToday(day)
                        const past      = isPastDay(day)
                        const selected  = selectedDay?.date === key

                        return (
                          <button
                            key={key}
                            onClick={() => setSelectedDay(ev ?? null)}
                            disabled={!ev}
                            className={`relative flex flex-col items-center pt-1.5 pb-2 px-1 rounded-2xl transition-all duration-200 min-h-[64px]
                              ${selected      ? 'bg-indigo-600 shadow-md ring-2 ring-indigo-300' :
                                todayCell     ? 'bg-indigo-50 border border-indigo-200' :
                                ev            ? 'bg-slate-50/80 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 cursor-pointer' :
                                               'cursor-default'}
                              ${past && !todayCell && !ev ? 'opacity-35' : ''}`}
                          >
                            <span className={`text-sm font-light w-7 h-7 flex items-center justify-center rounded-full transition-colors
                              ${selected  ? 'bg-white/20 text-white font-medium' :
                                todayCell ? 'bg-indigo-600 text-white font-medium' :
                                ev        ? 'text-slate-800' : 'text-slate-400'}`}>
                              {day}
                            </span>
                            {ev && (
                              <div className="w-full mt-1 px-0.5 space-y-0.5">
                                <div className={`text-[9px] font-medium rounded-md px-1 py-0.5 text-center truncate leading-tight
                                  ${selected ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                  {ev.count} {itemLabelCap.toLowerCase()}{ev.count !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Right detail panel */}
              {selectedDay ? (
                <div className="w-80 border-l border-slate-100 flex flex-col overflow-hidden min-h-0 shrink-0">
                  <div className="px-5 py-4 border-b border-slate-100 shrink-0">
                    <p className="text-[10px] font-light tracking-[0.15em] uppercase text-slate-400 mb-0.5">{itemLabelCap} details</p>
                    <h3 className="text-base font-extralight text-slate-900">
                      {new Date(selectedDay.date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long', month: 'long', day: 'numeric',
                      })}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-light">
                      {selectedDay.count} {itemLabelCap.toLowerCase()}{selectedDay.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="overflow-y-auto flex-1 p-4 space-y-2">
                    {(selectedDay.orderDetails ?? []).length > 0 ? (
                      selectedDay.orderDetails!.map((order, i) => (
                        <div
                          key={order.id ?? i}
                          className="bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-indigo-200/60 rounded-2xl p-3 transition-all duration-200"
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 rounded-md px-1.5 py-0.5">
                              #{order.external_order_id}
                            </span>
                            <span className={`text-[10px] font-medium rounded-md px-1.5 py-0.5
                              ${order.event_type === 'sent'
                                ? 'bg-amber-50 text-amber-700'
                                : order.event_type === 'completed'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'}`}>
                              {order.event_type}
                            </span>
                          </div>
                          {order.total_price !== null && (
                            <p className="text-sm font-medium text-slate-800 mb-1">
                              ${Number(order.total_price).toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs font-light text-slate-500 leading-relaxed">
                            {order.summary ?? '—'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1 font-light">
                            {new Date(order.order_date ?? order.created_at).toLocaleTimeString('en-US', {
                              hour: '2-digit', minute: '2-digit',
                            })}
                            {order.postal_code && order.postal_code !== 'PICKUP' ? ` · ${order.postal_code}` : order.postal_code === 'PICKUP' ? ' · Pickup' : ''}
                          </p>
                        </div>
                      ))
                    ) : selectedDay.external_case_ids.length > 0 ? (
                      selectedDay.external_case_ids.map((id, i) => (
                        <div
                          key={id}
                          className="bg-slate-50 hover:bg-white border border-slate-200/60 hover:border-indigo-200/60 rounded-2xl p-3 transition-all duration-200"
                        >
                          <div className="mb-1.5">
                            <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 rounded-md px-1.5 py-0.5">
                              #{id}
                            </span>
                          </div>
                          <p className="text-xs font-light text-slate-500 leading-relaxed">
                            {selectedDay.summaries[i] ?? '—'}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 font-light text-center py-6">No details available</p>
                    )}
                  </div>
                </div>
              ) : (
                !loadingEvents && (
                  <div className="w-80 border-l border-slate-100 flex flex-col items-center justify-center p-6 shrink-0 text-center">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center border border-indigo-100 mb-3">
                      <Calendar className="h-5 w-5 text-indigo-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-light">
                      Click a highlighted date to view {itemLabelCap.toLowerCase()} details
                    </p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}

// ─── Order Record type + Orders Modal + Food Orders Section ──────────────────



interface OrderRecord {
  id: number
  external_order_id: string
  event_type: string
  postal_code: string
  summary: string
  total_price: number | null
  latitude: number | null
  longitude: number | null
  created_at: string
  active_until: string
}

function OrdersModal({
  open,
  onClose,
  records,
  loading,
  title,
  subtitle,
  accentColor = 'amber',
}: {
  open: boolean
  onClose: () => void
  records: OrderRecord[]
  loading: boolean
  title: string
  subtitle: string
  accentColor?: 'amber' | 'emerald'
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])

  if (!open) return null

  const iconBg   = accentColor === 'emerald' ? 'from-emerald-50 to-teal-50 border-emerald-100' : 'from-amber-50 to-orange-50 border-amber-100'
  const iconColor= accentColor === 'emerald' ? 'text-emerald-600' : 'text-amber-600'
  const spinBorder = accentColor === 'emerald' ? 'border-emerald-500' : 'border-amber-500'
  const emptyBg  = accentColor === 'emerald' ? 'bg-emerald-50 border-emerald-100' : 'bg-amber-50 border-amber-100'
  const emptyIcon= accentColor === 'emerald' ? 'text-emerald-300' : 'text-amber-300'
  const badgeBg  = accentColor === 'emerald' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
  const hoverBorder = accentColor === 'emerald' ? 'hover:border-emerald-200/60' : 'hover:border-amber-200/60'

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center border`}>
                <ChevronRight className={`h-4 w-4 ${iconColor}`} />
              </div>
              <div>
                <h2 className="text-lg font-extralight tracking-tight text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">{subtitle}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group">
              <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
            </button>
          </div>
          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                  <div className={`absolute inset-0 border-2 ${spinBorder} rounded-full border-t-transparent animate-spin`} />
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className={`w-14 h-14 ${emptyBg} rounded-2xl flex items-center justify-center border`}>
                  <ChevronRight className={`h-6 w-6 ${emptyIcon}`} />
                </div>
                <p className="text-sm text-slate-400 font-light">No orders found</p>
              </div>
            ) : (
              records.map((order, idx) => (
                <div
                  key={order.id}
                  className={`group/row bg-slate-50/70 hover:bg-white border border-slate-200/60 ${hoverBorder} hover:shadow-sm rounded-2xl p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1`}
                  style={{ animationDelay: `${idx * 25}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-medium ${badgeBg} rounded-md px-1.5 py-0.5`}>
                          #{order.external_order_id}
                        </span>
                        <span className={`text-[10px] font-medium rounded-md px-1.5 py-0.5
                          ${order.event_type === 'sent'    ? 'bg-amber-50 text-amber-700' :
                            order.event_type === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-600'}`}>
                          {order.event_type}
                        </span>
                        {order.postal_code && (
                          <span className="text-[10px] font-light text-slate-400">
                            {order.postal_code === 'PICKUP' ? '📦 Pickup' : order.postal_code}
                          </span>
                        )}
                      </div>
                      {order.total_price !== null && (
                        <p className="text-sm font-medium text-slate-800 mb-1">${Number(order.total_price).toFixed(2)}</p>
                      )}
                      <p className="text-xs text-slate-500 font-light">{order.summary ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-[10px] text-slate-400 font-light">
                        {new Date(order.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-[10px] text-slate-400 font-light">
                        {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function FoodOrdersSection() {
  const [currentCount,  setCurrentCount]  = useState<number | null>(null)
  const [totalCount,    setTotalCount]    = useState<number | null>(null)
  const [loadingCurrent, setLoadingCurrent] = useState(true)
  const [loadingTotal,   setLoadingTotal]   = useState(true)

  const [currentRecords,  setCurrentRecords]  = useState<OrderRecord[]>([])
  const [totalRecords,    setTotalRecords]    = useState<OrderRecord[]>([])
  const [loadingCurrentRec, setLoadingCurrentRec] = useState(false)
  const [loadingTotalRec,   setLoadingTotalRec]   = useState(false)

  const [currentModalOpen, setCurrentModalOpen] = useState(false)
  const [totalModalOpen,   setTotalModalOpen]   = useState(false)

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Token ${Cookies.get('Token') || ''}`,
  }

  // Fetch counts on mount
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/order-locations/?aggregate=count`, { headers: authHeaders })
      .then(r => r.json()).then(d => { if (typeof d.count === 'number') setCurrentCount(d.count) })
      .catch(() => {}).finally(() => setLoadingCurrent(false))

    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/total-orders/?aggregate=count`, { headers: authHeaders })
      .then(r => r.json()).then(d => { if (typeof d.count === 'number') setTotalCount(d.count) })
      .catch(() => {}).finally(() => setLoadingTotal(false))
  }, [])

  const handleCurrentClick = async () => {
    setCurrentModalOpen(true)
    if (currentRecords.length > 0) return
    setLoadingCurrentRec(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/order-locations/`, { headers: authHeaders })
      const data = await res.json()
      if (Array.isArray(data)) setCurrentRecords(data)
    } catch {} finally { setLoadingCurrentRec(false) }
  }

  const handleTotalClick = async () => {
    setTotalModalOpen(true)
    if (totalRecords.length > 0) return
    setLoadingTotalRec(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/total-orders/`, { headers: authHeaders })
      const data = await res.json()
      if (Array.isArray(data)) setTotalRecords(data)
      else if (Array.isArray(data?.results)) setTotalRecords(data.results)
    } catch {} finally { setLoadingTotalRec(false) }
  }

  return (
    <>
      <OrdersModal
        open={currentModalOpen} onClose={() => setCurrentModalOpen(false)}
        records={currentRecords} loading={loadingCurrentRec}
        title="Current Orders" subtitle="Active orders at this moment"
        accentColor="amber"
      />
      <OrdersModal
        open={totalModalOpen} onClose={() => setTotalModalOpen(false)}
        records={totalRecords} loading={loadingTotalRec}
        title="All Orders" subtitle="Complete order history"
        accentColor="emerald"
      />

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {/* Section label */}
        <div className="flex items-center gap-2 mb-4">
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-light tracking-[0.15em] uppercase text-slate-400">Order Intelligence</span>
          <div className="flex-1 h-px bg-slate-200/70" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Current Orders */}
          <button
            onClick={handleCurrentClick}
            className="group relative text-left w-full overflow-hidden bg-white hover:bg-slate-50/80 border border-slate-200/60 hover:border-amber-300/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-400/8 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl flex items-center justify-center border border-amber-100">
                  <ChevronRight className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide text-slate-500 mb-1">Current Orders</p>
                  {loadingCurrent ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <p className="text-4xl font-extralight text-slate-900 tracking-tight">{currentCount ?? '—'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-50 group-hover:bg-amber-100 border border-amber-100 group-hover:border-amber-200 rounded-xl px-3 py-1.5 transition-all duration-200">
                <span className="text-xs font-light text-amber-600">View all</span>
                <ChevronRight className="h-3 w-3 text-amber-500 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>
            <div className="relative mt-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <div className="flex-1 h-px bg-gradient-to-r from-amber-200/60 to-transparent" />
              <span className="text-[10px] font-light text-slate-400 tracking-wide">Click to explore orders</span>
            </div>
          </button>

          {/* Total Orders */}
          <button
            onClick={handleTotalClick}
            className="group relative text-left w-full overflow-hidden bg-white hover:bg-slate-50/80 border border-slate-200/60 hover:border-emerald-300/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/8 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                  <ChevronRight className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide text-slate-500 mb-1">Total Orders</p>
                  {loadingTotal ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <p className="text-4xl font-extralight text-slate-900 tracking-tight">{totalCount ?? '—'}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-100 group-hover:border-emerald-200 rounded-xl px-3 py-1.5 transition-all duration-200">
                <span className="text-xs font-light text-emerald-600">View all</span>
                <ChevronRight className="h-3 w-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>
            <div className="relative mt-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-200/60 to-transparent" />
              <span className="text-[10px] font-light text-slate-400 tracking-wide">Click to explore orders</span>
            </div>
          </button>

        </div>
      </div>
    </>
  )
}

// ─── Contact Record type ──────────────────────────────────────────────────────



interface ContactRecord {
  id: number
  external_contact_id: string
  name: string
  email: string | null
  phone_number: string
  address: string
  postal_code: string
  created_at: string
}

interface Accesse11Contact {
  id: string
  contactFullName: string
  contactType: string
  given_name: string
  additional_name: string | null
  family_name: string
  street_address: string
  preferred_email_address: string
  preferred_phone_number: string
  expired: string | null
}



// ─── Contacts Modal ───────────────────────────────────────────────────────────



function ContactsModal({
  open,
  onClose,
  records,
  loadingRecords,
  title = "New Contacts",
  subtitle = "All recently created contact records",
}: {
  open: boolean
  onClose: () => void
  records: ContactRecord[]
  loadingRecords: boolean
  title?: string
  subtitle?: string
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])


  if (!open) return null


  return (
    <div
      className="fixed inset-0 z-[10200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >


      {/* Dialog panel */}
      <div
        className="relative z-10 w-full max-w-3xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col">

          {/* Modal header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl flex items-center justify-center border border-violet-100">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-extralight tracking-tight text-slate-900">{title}</h2>
                <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                  {subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
            >
              <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors duration-200" />
            </button>
          </div>


          {/* Modal body — scrollable */}
          <div className="overflow-y-auto flex-1 p-6 space-y-3">
            {loadingRecords ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                  <div className="absolute inset-0 border-2 border-violet-500 rounded-full border-t-transparent animate-spin" />
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-14 h-14 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100">
                  <Users className="h-6 w-6 text-violet-300" />
                </div>
                <p className="text-sm text-slate-400 font-light">No contact records found</p>
              </div>
            ) : (
              records.map((record, idx) => (
                <div
                  key={record.id}
                  className="group/row bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-violet-200/60 hover:shadow-sm rounded-2xl p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 border border-violet-200/50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-violet-600">
                          {record.name.trim().charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{record.name.trim()}</p>
                        <p className="text-xs text-slate-400 font-light truncate mt-0.5">{record.address}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-mono text-slate-600">{record.phone_number}</p>
                      {record.email && (
                        <p className="text-xs text-violet-500 font-light">{record.email}</p>
                      )}
                      <p className="text-[10px] text-slate-400 font-light">
                        {new Date(record.created_at).toLocaleDateString('en-US', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



// ─── Accesse11 Contacts Modal ─────────────────────────────────────────────────



function Accesse11ContactsModal({
  open,
  onClose,
  records,
  loadingRecords,
  totalCount,
}: {
  open: boolean
  onClose: () => void
  records: Accesse11Contact[]
  loadingRecords: boolean
  totalCount: number | null
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-3xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <Users className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-extralight tracking-tight text-slate-900">Accesse11 Contacts</h2>
                <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                  {totalCount !== null ? `${totalCount} total contacts` : 'All contacts'} synced from Accesse11
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
            >
              <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors duration-200" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-3">
            {loadingRecords ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                  <div className="absolute inset-0 border-2 border-emerald-500 rounded-full border-t-transparent animate-spin" />
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                  <Users className="h-6 w-6 text-emerald-300" />
                </div>
                <p className="text-sm text-slate-400 font-light">No contacts found</p>
              </div>
            ) : (
              records.map((record, idx) => (
                <div
                  key={record.id}
                  className="group/row bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-emerald-200/60 hover:shadow-sm rounded-2xl p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${idx * 20}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 border border-emerald-200/50 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-emerald-700">
                          {record.given_name.trim().charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{record.contactFullName}</p>
                        <p className="text-xs text-slate-400 font-light truncate mt-0.5">{record.street_address}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1">
                      <p className="text-xs font-mono text-slate-600">{record.preferred_phone_number || '—'}</p>
                      {record.preferred_email_address && (
                        <p className="text-xs text-emerald-600 font-light">{record.preferred_email_address}</p>
                      )}
                      <span className="inline-block text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md px-1.5 py-0.5 font-light capitalize">
                        {record.contactType}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



// ─── Closed Cases Modal ───────────────────────────────────────────────────────

interface CaseFile {
  caseId: number
  summary: string
  createdDate: string
  status: string
}

function ClosedCasesModal({
  open,
  onClose,
  records,
  loadingRecords,
  totalCount,
}: {
  open: boolean
  onClose: () => void
  records: CaseFile[]
  loadingRecords: boolean
  totalCount: number | null
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[10200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative z-10 w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl flex items-center justify-center border border-orange-100">
                <FolderCheck className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-extralight tracking-tight text-slate-900">Closed Case Files</h2>
                <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                  {totalCount !== null ? `${totalCount} resolved` : 'All'} cases — status: Closed
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
            >
              <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors duration-200" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 p-6 space-y-3">
            {loadingRecords ? (
              <div className="flex items-center justify-center py-16">
                <div className="relative w-10 h-10">
                  <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                  <div className="absolute inset-0 border-2 border-orange-500 rounded-full border-t-transparent animate-spin" />
                </div>
              </div>
            ) : records.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                  <FolderCheck className="h-6 w-6 text-orange-300" />
                </div>
                <p className="text-sm text-slate-400 font-light">No closed cases found</p>
              </div>
            ) : (
              records.map((record, idx) => (
                <div
                  key={record.caseId}
                  className="group/row bg-slate-50/70 hover:bg-white border border-slate-200/60 hover:border-orange-200/60 hover:shadow-sm rounded-2xl p-4 transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="inline-flex items-center shrink-0 text-[10px] font-semibold text-orange-700 bg-orange-100 border border-orange-200/60 rounded-lg px-2 py-0.5 tracking-wide">
                        Case #{record.caseId}
                      </span>
                      <span className="inline-flex items-center text-[10px] bg-orange-50 text-orange-600 border border-orange-100 rounded-lg px-2 py-0.5 font-light whitespace-nowrap">
                        {record.status}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 leading-snug break-words">{record.summary}</p>
                    <p className="text-xs text-slate-400 font-light">
                      {new Date(record.createdDate).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



// ─── Municipal Contacts Section ───────────────────────────────────────────────



function MunicipalContactsSection() {
  const [newContactCount, setNewContactCount] = useState<number | null>(null)
  const [accessCount, setAccessCount] = useState<number | null>(null)
  const [contactRecords, setContactRecords] = useState<ContactRecord[]>([])
  const [loadingCount, setLoadingCount] = useState(true)
  const [loadingAccess, setLoadingAccess] = useState(true)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [accesse11Records, setAccesse11Records] = useState<Accesse11Contact[]>([])
  const [loadingAccesse11Records, setLoadingAccesse11Records] = useState(false)
  const [accesse11ModalOpen, setAccesse11ModalOpen] = useState(false)

  // ── Closed cases state ────────────────────────────────────────────────────
  const [closedCasesCount, setClosedCasesCount] = useState<number | null>(null)
  const [closedCasesRecords, setClosedCasesRecords] = useState<CaseFile[]>([])
  const [loadingClosedCases, setLoadingClosedCases] = useState(true)
  const [closedCasesModalOpen, setClosedCasesModalOpen] = useState(false)


  // ── Fetch new-contact count ───────────────────────────────────────────────
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reports/contact-creation-records/?aggregate=count`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )
        const data = await res.json()
        if (typeof data.count === 'number') setNewContactCount(data.count)
      } catch (err) {
        console.error("Error fetching contact creation count:", err)
      } finally {
        setLoadingCount(false)
      }
    }
    fetchCount()
  }, [])


  // ── Fetch Accesse11 total contact count ───────────────────────────────────
  useEffect(() => {
    const fetchAccessCount = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/integrations/accesse11/contacts/count/`, {
          headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
        })
        const data = await res.json()
        if (typeof data.count === 'number') setAccessCount(data.count)
      } catch (err) {
        console.error("Error fetching Accesse11 contact count:", err)
      } finally {
        setLoadingAccess(false)
      }
    }
    fetchAccessCount()
  }, [])


  // ── Fetch closed case files (count + records) on mount ────────────────────
  useEffect(() => {
    const fetchClosedCases = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/accesse11/caseFile/?status=Closed`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )
        const data = await res.json()
        const results = data?.data?.results
        const total = data?.data?.metadata?.totalCount
        if (Array.isArray(results)) setClosedCasesRecords(results)
        if (typeof total === 'number') setClosedCasesCount(total)
      } catch (err) {
        console.error("Error fetching closed case files:", err)
      } finally {
        setLoadingClosedCases(false)
      }
    }
    fetchClosedCases()
  }, [])


  // ── Fetch Accesse11 contact details on card click ────────────────────────
  const handleAccesse11Click = async () => {
    setAccesse11ModalOpen(true)
    if (accesse11Records.length > 0) return
    setLoadingAccesse11Records(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/integrations/accesse11/contacts/details/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        }
      )
      const data = await res.json()
      const results = data?.data?.results
      if (Array.isArray(results)) setAccesse11Records(results)
    } catch (err) {
      console.error("Error fetching Accesse11 contact details:", err)
    } finally {
      setLoadingAccesse11Records(false)
    }
  }

  // ── Fetch full records list on card click ─────────────────────────────────
  const handleCardClick = async () => {
    setModalOpen(true)
    if (contactRecords.length > 0) return  // already fetched, no refetch needed
    setLoadingRecords(true)
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL}/reports/contact-creation-records/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        }
      )
      const data = await res.json()
      if (Array.isArray(data)) setContactRecords(data)
    } catch (err) {
      console.error("Error fetching contact records:", err)
    } finally {
      setLoadingRecords(false)
    }
  }


  return (
    <>
      <ContactsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        records={contactRecords}
        loadingRecords={loadingRecords}
      />
      <Accesse11ContactsModal
        open={accesse11ModalOpen}
        onClose={() => setAccesse11ModalOpen(false)}
        records={accesse11Records}
        loadingRecords={loadingAccesse11Records}
        totalCount={accessCount}
      />
      <ClosedCasesModal
        open={closedCasesModalOpen}
        onClose={() => setClosedCasesModalOpen(false)}
        records={closedCasesRecords}
        loadingRecords={loadingClosedCases}
        totalCount={closedCasesCount}
      />


      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">

        {/* Section label */}
        <div className="flex items-center gap-2 mb-4">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-xs font-light tracking-[0.15em] uppercase text-slate-400">
            Municipal Contact Intelligence
          </span>
          <div className="flex-1 h-px bg-slate-200/70" />
        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {/* ── Card 1: New Contacts Created (clickable → modal) ── */}
          <button
            onClick={handleCardClick}
            className="group relative text-left w-full overflow-hidden bg-white hover:bg-slate-50/80 border border-slate-200/60 hover:border-violet-300/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-violet-400/8 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-start justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl flex items-center justify-center border border-violet-100">
                  <Users className="h-4.5 w-4.5 text-violet-600" />
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide text-slate-500 mb-1">New Contacts Created</p>
                  {loadingCount ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <p className="text-4xl font-extralight text-slate-900 tracking-tight">
                      {newContactCount ?? '—'}
                    </p>
                  )}
                </div>
              </div>

              {/* Click hint */}
              <div className="flex items-center gap-1.5 bg-violet-50 group-hover:bg-violet-100 border border-violet-100 group-hover:border-violet-200 rounded-xl px-3 py-1.5 transition-all duration-200">
                <span className="text-xs font-light text-violet-600">View all</span>
                <ChevronRight className="h-3 w-3 text-violet-500 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>

            {/* Bottom pulse indicator */}
            <div className="relative mt-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              <div className="flex-1 h-px bg-gradient-to-r from-violet-200/60 to-transparent" />
              <span className="text-[10px] font-light text-slate-400 tracking-wide">Click to explore records</span>
            </div>
          </button>


          {/* ── Card 2: Total Accesse11 Contacts (clickable → modal) ── */}
          <button
            onClick={handleAccesse11Click}
            className="group relative text-left w-full overflow-hidden bg-white hover:bg-slate-50/80 border border-slate-200/60 hover:border-emerald-300/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/8 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-start justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl flex items-center justify-center border border-emerald-100">
                  <ExternalLink className="h-4 w-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide text-slate-500 mb-1">Total Contacts on Accesse11</p>
                  {loadingAccess ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <p className="text-4xl font-extralight text-slate-900 tracking-tight">
                      {accessCount ?? '—'}
                    </p>
                  )}
                </div>
              </div>

              {/* Click hint */}
              <div className="flex items-center gap-1.5 bg-emerald-50 group-hover:bg-emerald-100 border border-emerald-100 group-hover:border-emerald-200 rounded-xl px-3 py-1.5 transition-all duration-200">
                <span className="text-xs font-light text-emerald-600">View all</span>
                <ChevronRight className="h-3 w-3 text-emerald-500 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>

            <div className="relative mt-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="flex-1 h-px bg-gradient-to-r from-emerald-200/60 to-transparent" />
              <span className="text-[10px] font-light text-slate-400 tracking-wide">Click to explore records</span>
            </div>
          </button>


          {/* ── Card 3: Closed Case Files ── */}
          <button
            onClick={() => setClosedCasesModalOpen(true)}
            className="group relative text-left w-full overflow-hidden bg-white hover:bg-slate-50/80 border border-slate-200/60 hover:border-orange-300/60 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-[1.01]"
          >
            {/* Glow */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-400/8 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            <div className="relative flex items-start justify-between">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl flex items-center justify-center border border-orange-100">
                  <FolderCheck className="h-4.5 w-4.5 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs font-light tracking-wide text-slate-500 mb-1">Closed Case Files</p>
                  {loadingClosedCases ? (
                    <div className="h-9 w-16 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <p className="text-4xl font-extralight text-slate-900 tracking-tight">
                      {closedCasesCount ?? '—'}
                    </p>
                  )}
                </div>
              </div>

              {/* Click hint */}
              <div className="flex items-center gap-1.5 bg-orange-50 group-hover:bg-orange-100 border border-orange-100 group-hover:border-orange-200 rounded-xl px-3 py-1.5 transition-all duration-200">
                <span className="text-xs font-light text-orange-600">View all</span>
                <ChevronRight className="h-3 w-3 text-orange-500 group-hover:translate-x-0.5 transition-transform duration-200" />
              </div>
            </div>

            <div className="relative mt-5 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <div className="flex-1 h-px bg-gradient-to-r from-orange-200/60 to-transparent" />
              <span className="text-[10px] font-light text-slate-400 tracking-wide">Click to explore records</span>
            </div>
          </button>

        </div>
      </div>
    </>
  )
}



// ─── Phone Numbers Modal ─────────────────────────────────────────────────────



function PhoneNumbersModal({
  open,
  onClose,
  numbers,
  copiedIndex,
  onCopy,
}: {
  open: boolean
  onClose: () => void
  numbers: string[]
  copiedIndex: number | null
  onCopy: (num: string, idx: number) => void
}) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl flex items-center justify-center border border-amber-100">
                <Phone className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-extralight tracking-tight text-slate-900">Phone Numbers</h2>
                <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                  {numbers.length} active {numbers.length === 1 ? 'number' : 'numbers'}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
            >
              <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
            </button>
          </div>
          <div className="overflow-y-auto max-h-[60vh] p-4 space-y-2">
            {numbers.map((num, idx) => (
              <div
                key={num}
                className="flex items-center justify-between bg-slate-50 hover:bg-amber-50/50 border border-slate-200/60 hover:border-amber-200/60 rounded-2xl px-4 py-3 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-medium text-slate-400 w-5">#{idx + 1}</span>
                  <p className="text-sm font-mono font-medium text-slate-800 tracking-wide">{num}</p>
                </div>
                <button
                  onClick={() => onCopy(num, idx)}
                  className="w-7 h-7 bg-white hover:bg-amber-50 rounded-lg border border-slate-200/50 flex items-center justify-center transition-colors"
                >
                  {copiedIndex === idx ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-slate-400 hover:text-amber-600" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}



// ─── Call Transfer types & components ────────────────────────────────────────



interface CallTransferRecord {
  id: number
  company: number
  call_id: string
  external_agent_id: string | null
  caller_phone_number: string | null
  transfer_to_phone_number: string | null
  transfer_reason: string
  unresolved_query: string
  call_status: string
  transfer_triggered_at: string | null
  metadata: Record<string, unknown>
  created_at: string
}



function CallTransfersModal({
  open,
  onClose,
  records,
  loading,
}: {
  open: boolean
  onClose: () => void
  records: CallTransferRecord[]
  loading: boolean
}) {
  const [selected, setSelected] = useState<CallTransferRecord | null>(null)

  // Reset selection when modal closes
  useEffect(() => {
    if (!open) setSelected(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const detailFields: { label: string; value: string | null }[] = selected ? [
    { label: 'Call ID', value: selected.call_id },
    { label: 'Status', value: selected.call_status },
    { label: 'Transfer Reason', value: selected.transfer_reason },
    { label: 'Unresolved Query', value: selected.unresolved_query },
    { label: 'Caller', value: selected.caller_phone_number },
    { label: 'Transfer To', value: selected.transfer_to_phone_number },
    { label: 'Triggered At', value: selected.transfer_triggered_at },
    {
      label: 'Created',
      value: new Date(selected.created_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    },
  ] : []

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-xl flex items-center justify-center border border-violet-100">
                <PhoneForwarded className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h2 className="text-lg font-extralight tracking-tight text-slate-900">Call Transfers</h2>
                <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                  {records.length} AI → human escalation{records.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
            >
              <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
            </button>
          </div>

          {/* Body — two columns */}
          <div className="flex flex-1 min-h-0">

            {/* ── Left: list ── */}
            <div className="w-[45%] border-r border-slate-100 flex flex-col min-h-0">
              <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                      <div className="absolute inset-0 border-2 border-violet-400 rounded-full border-t-transparent animate-spin" />
                    </div>
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="w-12 h-12 bg-violet-50 rounded-2xl flex items-center justify-center border border-violet-100">
                      <PhoneForwarded className="h-5 w-5 text-violet-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-light">No transfers yet</p>
                  </div>
                ) : (
                  records.map((rec, idx) => (
                    <button
                      key={rec.id}
                      onClick={() => setSelected(rec)}
                      className={`w-full text-left rounded-2xl px-3.5 py-3 transition-all duration-150 animate-in fade-in slide-in-from-bottom-1 ${
                        selected?.id === rec.id
                          ? 'bg-violet-50 border border-violet-200'
                          : 'bg-slate-50/60 hover:bg-white border border-transparent hover:border-slate-200/80 hover:shadow-sm'
                      }`}
                      style={{ animationDelay: `${idx * 25}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-slate-400 truncate">{rec.call_id}</p>
                          <p className="text-xs font-light text-slate-700 truncate mt-0.5 leading-snug">{rec.transfer_reason}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-medium rounded-lg px-2 py-0.5 ${
                          selected?.id === rec.id
                            ? 'bg-violet-100 text-violet-700 border border-violet-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                        }`}>
                          {rec.call_status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-light mt-1.5">
                        {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Right: detail ── */}
            <div className="flex-1 flex flex-col min-h-0">
              {selected ? (
                <div className="overflow-y-auto flex-1 p-5 space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                  {/* Detail header */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-lg flex items-center justify-center border border-violet-100">
                      <PhoneForwarded className="h-3.5 w-3.5 text-violet-500" />
                    </div>
                    <div>
                      <p className="text-xs font-light text-slate-800">Transfer Detail</p>
                      <p className="text-[10px] font-mono text-slate-400">{selected.call_id}</p>
                    </div>
                  </div>

                  {/* Fields */}
                  {detailFields.map(({ label, value }) =>
                    value ? (
                      <div key={label}>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-sm text-slate-700 font-light leading-snug">{value}</p>
                      </div>
                    ) : null
                  )}

                  {/* Metadata tags */}
                  {selected.metadata && Object.keys(selected.metadata).length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Metadata</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(selected.metadata).map(([k, v]) => (
                          <span key={k} className="bg-indigo-50 text-indigo-600 text-[10px] font-mono border border-indigo-100 rounded-lg px-2 py-0.5">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-light">Select a transfer to view details</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}



function CallTransfersSection() {
  const [records, setRecords] = useState<CallTransferRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchTransfers = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reports/voice-agent-transfer-webhooks/`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${Cookies.get('Token') || ''}`,
            },
          }
        )
        const data = await res.json()
        if (Array.isArray(data)) setRecords(data)
      } catch (err) {
        console.error('Error fetching call transfers:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTransfers()
  }, [])

  return (
    <>
      <CallTransfersModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        records={records}
        loading={loading}
      />

      <button
        onClick={() => setModalOpen(true)}
        className="group relative w-full text-left overflow-hidden bg-white border border-violet-100 hover:border-violet-300/70 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
      >
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-violet-400/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-2xl flex items-center justify-center border border-violet-100 shrink-0">
              <PhoneForwarded className="h-4 w-4 text-violet-500" />
            </div>
            <div>
              <p className="text-xs font-light tracking-wide text-slate-500">Calls Transferred to Human</p>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse mt-0.5" />
              ) : (
                <p className="text-3xl font-extralight text-slate-900 tracking-tight">
                  {records.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-violet-50 group-hover:bg-violet-100 border border-violet-100 group-hover:border-violet-200 rounded-xl px-3 py-1.5 transition-all duration-200">
            <span className="text-xs font-light text-violet-600">View all</span>
            <ChevronRight className="h-3 w-3 text-violet-500 group-hover:translate-x-0.5 transition-transform duration-200" />
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <div className="flex-1 h-px bg-gradient-to-r from-violet-200/60 to-transparent" />
          <span className="text-[10px] font-light text-slate-400 tracking-wide">AI → Human escalations · click to explore</span>
        </div>
      </button>
    </>
  )
}



// ─── AI Agent Failures types & components ────────────────────────────────────

interface AIFailureRecord {
  id: number
  event_type: string
  status: string
  status_code: number | null
  metadata: {
    error?: string
    model?: string
    details?: string
    agent_id?: number
    provider?: string
    conversation_id?: string
    [key: string]: unknown
  }
  company: number
  created_at: string
}

function AIFailuresModal({
  open,
  onClose,
  records,
  loading,
}: {
  open: boolean
  onClose: () => void
  records: AIFailureRecord[]
  loading: boolean
}) {
  const [selected, setSelected] = useState<AIFailureRecord | null>(null)

  useEffect(() => {
    if (!open) setSelected(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const detailFields: { label: string; value: string | null }[] = selected ? [
    { label: 'Event Type', value: selected.event_type },
    { label: 'Status', value: selected.status },
    { label: 'Status Code', value: selected.status_code != null ? String(selected.status_code) : null },
    { label: 'Error', value: selected.metadata?.error || null },
    { label: 'Model', value: selected.metadata?.model || null },
    { label: 'Provider', value: selected.metadata?.provider || null },
    { label: 'Details', value: selected.metadata?.details || null },
    { label: 'Agent ID', value: selected.metadata?.agent_id != null ? String(selected.metadata.agent_id) : null },
    { label: 'Conversation', value: selected.metadata?.conversation_id || null },
    {
      label: 'Created',
      value: new Date(selected.created_at).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }),
    },
  ] : []

  return (
    <div className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" />
      <div
        className="relative z-10 w-full max-w-3xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col h-full">

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-rose-50 to-red-50 rounded-xl flex items-center justify-center border border-rose-100">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
              <div>
                <h2 className="text-lg font-extralight tracking-tight text-slate-900">AI Agent Failures</h2>
                <p className="text-xs text-slate-500 font-light tracking-wide mt-0.5">
                  {records.length} failure{records.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
            >
              <X className="h-4 w-4 text-slate-500 group-hover:text-slate-700" />
            </button>
          </div>

          {/* Body — two columns */}
          <div className="flex flex-1 min-h-0">

            {/* Left: list */}
            <div className="w-[45%] border-r border-slate-100 flex flex-col min-h-0">
              <div className="overflow-y-auto flex-1 p-3 space-y-1.5">
                {loading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="relative w-8 h-8">
                      <div className="absolute inset-0 border-2 border-slate-100 rounded-full" />
                      <div className="absolute inset-0 border-2 border-rose-400 rounded-full border-t-transparent animate-spin" />
                    </div>
                  </div>
                ) : records.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center border border-rose-100">
                      <AlertTriangle className="h-5 w-5 text-rose-300" />
                    </div>
                    <p className="text-sm text-slate-400 font-light">No failures recorded</p>
                  </div>
                ) : (
                  records.map((rec, idx) => (
                    <button
                      key={rec.id}
                      onClick={() => setSelected(rec)}
                      className={`w-full text-left rounded-2xl px-3.5 py-3 transition-all duration-150 animate-in fade-in slide-in-from-bottom-1 ${
                        selected?.id === rec.id
                          ? 'bg-rose-50 border border-rose-200'
                          : 'bg-slate-50/60 hover:bg-white border border-transparent hover:border-slate-200/80 hover:shadow-sm'
                      }`}
                      style={{ animationDelay: `${idx * 25}ms` }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-mono text-slate-400 truncate">{rec.metadata?.error || rec.event_type}</p>
                          <p className="text-xs font-light text-slate-700 truncate mt-0.5 leading-snug">{rec.metadata?.model || rec.status}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] font-medium rounded-lg px-2 py-0.5 ${
                          selected?.id === rec.id
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200/60'
                        }`}>
                          {rec.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-light mt-1.5">
                        {new Date(rec.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Right: detail */}
            <div className="flex-1 flex flex-col min-h-0">
              {selected ? (
                <div className="overflow-y-auto flex-1 p-5 space-y-3 animate-in fade-in slide-in-from-right-2 duration-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-7 h-7 bg-gradient-to-br from-rose-50 to-red-50 rounded-lg flex items-center justify-center border border-rose-100">
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <div>
                      <p className="text-xs font-light text-slate-800">Failure Detail</p>
                      <p className="text-[10px] font-mono text-slate-400">ID: {selected.id}</p>
                    </div>
                  </div>

                  {detailFields.map(({ label, value }) =>
                    value ? (
                      <div key={label}>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">{label}</p>
                        <p className="text-sm text-slate-700 font-light leading-snug break-all">{value}</p>
                      </div>
                    ) : null
                  )}

                  {/* Extra metadata tags */}
                  {selected.metadata && Object.keys(selected.metadata).filter(k => !['error','model','details','agent_id','provider','conversation_id'].includes(k)).length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-1.5">Additional Metadata</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(selected.metadata)
                          .filter(([k]) => !['error','model','details','agent_id','provider','conversation_id'].includes(k))
                          .map(([k, v]) => (
                            <span key={k} className="bg-rose-50 text-rose-600 text-[10px] font-mono border border-rose-100 rounded-lg px-2 py-0.5">
                              {k}: {String(v)}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200">
                    <ChevronRight className="h-5 w-5 text-slate-300" />
                  </div>
                  <p className="text-sm text-slate-400 font-light">Select a failure to view details</p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

function AIFailuresSection() {
  const [records, setRecords] = useState<AIFailureRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    const fetchFailures = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reports/ai-agent-failures/`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${Cookies.get('Token') || ''}`,
            },
          }
        )
        const data = await res.json()
        if (Array.isArray(data)) setRecords(data)
      } catch (err) {
        console.error('Error fetching AI failures:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchFailures()
  }, [])

  return (
    <>
      <AIFailuresModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        records={records}
        loading={loading}
      />

      <button
        onClick={() => setModalOpen(true)}
        className="group relative w-full text-left overflow-hidden bg-white border border-rose-100 hover:border-rose-300/70 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all duration-300"
      >
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-rose-400/10 to-transparent rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl flex items-center justify-center border border-rose-100 shrink-0">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div>
              <p className="text-xs font-light tracking-wide text-slate-500">AI Agent Failures</p>
              {loading ? (
                <div className="h-8 w-12 bg-slate-100 rounded-lg animate-pulse mt-0.5" />
              ) : (
                <p className="text-3xl font-extralight text-slate-900 tracking-tight">
                  {records.length}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-50 group-hover:bg-rose-100 border border-rose-100 group-hover:border-rose-200 rounded-xl px-3 py-1.5 transition-all duration-200">
            <span className="text-xs font-light text-rose-600">View all</span>
            <ChevronRight className="h-3 w-3 text-rose-500 group-hover:translate-x-0.5 transition-transform duration-200" />
          </div>
        </div>

        <div className="relative mt-4 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
          <div className="flex-1 h-px bg-gradient-to-r from-rose-200/60 to-transparent" />
          <span className="text-[10px] font-light text-slate-400 tracking-wide">Error logs · click to explore</span>
        </div>
      </button>
    </>
  )
}


// ─── Hospital CRM stat types ──────────────────────────────────────────────────

interface LabsStats {
  total_tests: number
  by_status: Record<string, number>
  by_test: Record<string, number>
  by_date: Record<string, number>
  by_doctor: Record<string, number>
  row_count: number
}

interface DoctorsStats {
  total_doctors: number
  by_specialization: Record<string, number>
  row_count: number
}

interface AppointmentsStats {
  total_appointments: number
  by_status: Record<string, number>
  by_date: Record<string, number>
  by_doctor: Record<string, number>
  row_count: number
}

interface HistoryStats {
  total_records: number
  by_patient: Record<string, number>
  by_doctor: Record<string, number>
  row_count: number
}

interface PharmacyStats {
  total_prescriptions: number
  unique_patients: number
  unique_medicines: number
  by_medicine: Record<string, number>
  by_doctor: Record<string, number>
  row_count: number
}

// ─── HMS Dashboard Types ────────────────────────────────────────────────────

interface HMSDashboard {
  hospital_name?: string
  total_doctors: number
  active_doctors?: number
  total_appointments: number
  appointments_today?: number
  total_consultation_fees?: number
  appointments_by_status: Record<string, number>
  appointments_by_type?: Record<string, number>
  specializations?: Record<string, number>
  recent_appointments?: HMSAppointment[]
}

interface HMSDoctor {
  id: string
  full_name: string
  specialization: string
  email?: string
  phone?: string
  consultation_fee?: number
  accepting_new_patients?: boolean
  experience_years?: number
  shift_start?: string
  shift_end?: string
  available_days?: string[]
  is_active?: boolean
}

interface HMSDoctorStats {
  total_doctors: number
  by_specialization: Record<string, number>
}

interface HMSAppointment {
  appointment_id: string
  patient_name: string
  doctor_id?: string
  doctors?: { full_name: string; specialization?: string }
  appointment_date: string
  time_slot?: string
  appointment_time?: string
  status: string
  reason?: string
  notes?: string
  phone?: string
  appointment_type?: string
}

interface HMSAppointmentStats {
  total_appointments: number
  by_status: Record<string, number>
  by_date?: Record<string, number>
  by_doctor?: Record<string, number>
}

interface HMSOverviewStats {
  doctors?: HMSDoctorStats
  appointments?: HMSAppointmentStats
}

// ─── Hospital sub-components ──────────────────────────────────────────────────

function StatBadge({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    sky:      'bg-sky-50 text-sky-700 border-sky-200',
    emerald:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    violet:   'bg-violet-50 text-violet-700 border-violet-200',
    amber:    'bg-amber-50 text-amber-700 border-amber-200',
    rose:     'bg-rose-50 text-rose-700 border-rose-200',
    teal:     'bg-teal-50 text-teal-700 border-teal-200',
    indigo:   'bg-indigo-50 text-indigo-700 border-indigo-200',
    pink:     'bg-pink-50 text-pink-700 border-pink-200',
    slate:    'bg-slate-50 text-slate-600 border-slate-200',
  }
  const cls = colorMap[color] ?? colorMap.slate
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${cls}`}>
      <p className="text-xl font-light tracking-tight">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wider mt-0.5 opacity-80">{label}</p>
    </div>
  )
}

function StatusDot({ label, count, color }: { label: string; count: number; color: string }) {
  const dotColors: Record<string, string> = {
    Confirmed: 'bg-sky-500', Completed: 'bg-emerald-500', Pending: 'bg-amber-500',
    Cancelled: 'bg-rose-500', Rescheduled: 'bg-violet-500',
  }
  return (
    <div className="flex items-center justify-between py-2 px-3 bg-white border border-slate-200 rounded-xl">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${dotColors[label] ?? 'bg-slate-400'}`} />
        <span className="text-xs font-light text-slate-700">{label}</span>
      </div>
      <span className="text-xs font-medium text-slate-800">{count}</span>
    </div>
  )
}

// ─── Hospital Detail Modals ───────────────────────────────────────────────────

function HospitalModal({
  open,
  onClose,
  title,
  subtitle,
  Icon,
  iconBg,
  iconBorder,
  iconColor,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle: string
  Icon: React.ElementType
  iconBg: string
  iconBorder: string
  iconColor: string
  children: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <Portal>
      <div className="fixed inset-0 z-[10100] flex items-center justify-center p-4 sm:p-8" onClick={onClose}>
        <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200" />
        <div
          className="relative z-10 w-full max-w-2xl max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-300"
          onClick={e => e.stopPropagation()}
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 bg-gradient-to-br ${iconBg} rounded-xl flex items-center justify-center border ${iconBorder}`}>
                  <Icon className={`h-4 w-4 ${iconColor}`} />
                </div>
                <div>
                  <h2 className="text-base font-medium tracking-tight text-slate-900">{title}</h2>
                  <p className="text-[11px] text-slate-400 font-light mt-0.5">{subtitle}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-all duration-200 group"
              >
                <X className="h-4 w-4 text-slate-400 group-hover:text-slate-700" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {children}
            </div>
          </div>
        </div>
      </div>
    </Portal>
  )
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-[0.15em]">{title}</p>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

// ── Calendar Heatmap ─────────────────────────────────────────────────────────

const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const CAL_DAYS   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
// bg class, count text class, day-number text class
const CAL_PALETTE: Record<string, Record<number, [string, string, string]>> = {
  violet: {
    1: ['bg-violet-100', 'text-violet-600',  'text-violet-400'],
    2: ['bg-violet-300', 'text-violet-800',  'text-violet-600'],
    3: ['bg-violet-500', 'text-white',        'text-violet-100'],
    4: ['bg-violet-700', 'text-white',        'text-violet-200'],
  },
  sky: {
    1: ['bg-sky-100', 'text-sky-600',  'text-sky-400'],
    2: ['bg-sky-300', 'text-sky-800',  'text-sky-600'],
    3: ['bg-sky-500', 'text-white',    'text-sky-100'],
    4: ['bg-sky-700', 'text-white',    'text-sky-200'],
  },
}

function normToISO(raw: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
  const m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (m) return `${m[3]}-${m[1].padStart(2,'0')}-${m[2].padStart(2,'0')}`
  const d = new Date(raw)
  if (!isNaN(d.getTime())) return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
  return null
}

function CalendarHeatmap({ data, accent = 'violet', label = 'calls' }: {
  data: Record<string, number>;
  accent?: 'violet' | 'sky';
  label?: string;
}) {
  const todayRaw = new Date()
  const [year,    setYear]    = useState(todayRaw.getFullYear())
  const [month,   setMonth]   = useState(todayRaw.getMonth())
  const [hovered, setHovered] = useState<{ iso: string; cnt: number } | null>(null)

  // Normalise all raw keys → YYYY-MM-DD
  const norm: Record<string, number> = {}
  for (const [k, v] of Object.entries(data)) {
    const iso = normToISO(k)
    if (iso) norm[iso] = (norm[iso] ?? 0) + v
  }
  const maxVal = Math.max(...Object.values(norm), 1)

  const prevM = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const nextM = () => { if (month === 11) { setMonth(0);  setYear(y => y + 1) } else setMonth(m => m + 1) }

  const firstDow  = new Date(year, month, 1).getDay()
  const daysInMon = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMon }, (_, i) => i + 1)]
  while (cells.length % 7 !== 0) cells.push(null)

  const todayISO = `${todayRaw.getFullYear()}-${String(todayRaw.getMonth()+1).padStart(2,'0')}-${String(todayRaw.getDate()).padStart(2,'0')}`
  const fmtISO   = (day: number) => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const getLevel = (cnt: number): 1|2|3|4 => { const r = cnt/maxVal; if (r > 0.75) return 4; if (r > 0.5) return 3; if (r > 0.25) return 2; return 1 }

  const monthPfx        = `${year}-${String(month+1).padStart(2,'0')}`
  const monthTotal      = Object.entries(norm).filter(([k]) => k.startsWith(monthPfx)).reduce((s, [, v]) => s + v, 0)
  const monthActiveDays = Object.keys(norm).filter(k => k.startsWith(monthPfx)).length
  const yearOpts        = Array.from({ length: 10 }, (_, i) => (todayRaw.getFullYear() - 4) + i)
  const pal             = CAL_PALETTE[accent] ?? CAL_PALETTE.violet

  const accentText  = accent === 'violet' ? 'text-violet-600' : 'text-sky-600'
  const accentBg    = accent === 'violet' ? 'bg-violet-600'   : 'bg-sky-600'
  const accentLight = accent === 'violet' ? 'bg-violet-50'    : 'bg-sky-50'

  const fmtDateLabel = (iso: string) => {
    const [y, mo, d] = iso.split('-')
    return `${CAL_MONTHS[parseInt(mo)-1]} ${parseInt(d)}, ${y}`
  }

  return (
    <div className="rounded-2xl border border-slate-200 overflow-hidden bg-white">

      {/* ── Nav bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <button onClick={prevM} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800">{CAL_MONTHS[month]}</span>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="text-sm text-slate-500 bg-transparent border-none outline-none cursor-pointer appearance-none font-light"
          >
            {yearOpts.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <button onClick={nextM} className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* ── Info bar — month summary or hovered day detail ─ */}
      <div className={`flex items-center justify-between px-4 py-2.5 border-b border-slate-100 transition-colors duration-150 ${hovered ? accentLight : 'bg-slate-50'}`}>
        {hovered ? (
          <>
            <div className="flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${accentBg}`} />
              <span className="text-xs font-medium text-slate-700">{fmtDateLabel(hovered.iso)}</span>
            </div>
            <span className={`text-xs font-bold ${accentText}`}>{hovered.cnt} {label}</span>
          </>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 leading-none mb-0.5">Total {label}</p>
                <p className="text-sm font-semibold text-slate-800 leading-none">{monthTotal > 0 ? monthTotal : '—'}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-wider text-slate-400 leading-none mb-0.5">Active days</p>
                <p className="text-sm font-semibold text-slate-800 leading-none">{monthActiveDays > 0 ? monthActiveDays : '—'}</p>
              </div>
            </div>
            <span className="text-[10px] text-slate-300 italic">hover a date</span>
          </>
        )}
      </div>

      {/* ── Day-of-week headers ───────────────────────────── */}
      <div className="grid grid-cols-7 border-b border-slate-100">
        {CAL_DAYS.map(d => (
          <div key={d} className="py-2 text-center text-[10px] font-semibold text-slate-400 tracking-wide">{d}</div>
        ))}
      </div>

      {/* ── Day grid ─────────────────────────────────────── */}
      <div className="grid grid-cols-7 gap-px bg-slate-100">
        {cells.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} className="bg-white h-12" />
          const iso     = fmtISO(day)
          const cnt     = norm[iso]
          const level   = cnt ? getLevel(cnt) : null
          const isToday = iso === todayISO
          const [bgCls, cntTxt, dayTxt] = level ? pal[level] : ['bg-white', '', 'text-slate-400']

          return (
            <div
              key={iso}
              onMouseEnter={() => cnt ? setHovered({ iso, cnt }) : setHovered(null)}
              onMouseLeave={() => setHovered(null)}
              className={[
                'relative h-12 flex flex-col justify-between p-1.5 select-none transition-all duration-100',
                bgCls,
                cnt ? 'cursor-default hover:brightness-95' : 'cursor-default',
                isToday && !level ? 'ring-1 ring-inset ring-slate-300' : '',
                isToday &&  level ? 'ring-2 ring-inset ring-slate-600/30' : '',
              ].join(' ')}
            >
              {/* Day number — top-left, always the date */}
              <span className={`text-[11px] font-medium leading-none ${isToday ? (level ? 'text-white font-bold' : 'text-slate-700 font-bold underline') : dayTxt}`}>
                {day}
              </span>

              {/* Count — bottom-right, clearly the metric */}
              {cnt && (
                <div className="flex items-end justify-between w-full">
                  <span className={`text-[8px] leading-none font-light opacity-70 ${cntTxt}`}>{label}</span>
                  <span className={`text-sm font-bold leading-none ${cntTxt}`}>{cnt}</span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Legend ───────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-white">
        <span className="text-[10px] text-slate-400">Activity intensity</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 mr-1">Low</span>
          {([1, 2, 3, 4] as const).map(l => (
            <div key={l} className={`w-4 h-4 rounded ${pal[l][0]}`} title={`Level ${l}`} />
          ))}
          <span className="text-[9px] text-slate-400 ml-1">High</span>
        </div>
      </div>
    </div>
  )
}

// ── Lab Test Call Log Modal ──────────────────────────────────────────────────

const MODAL_CAP = 9 // max items shown before "show more" toggle

function ShowMoreToggle({ total, cap, show, onToggle, accent = 'violet' }: { total: number; cap: number; show: boolean; onToggle: () => void; accent?: string }) {
  if (total <= cap) return null
  const textColor: Record<string, string> = { violet: 'text-violet-500 hover:text-violet-700', sky: 'text-sky-500 hover:text-sky-700', emerald: 'text-emerald-500 hover:text-emerald-700', rose: 'text-rose-500 hover:text-rose-700', teal: 'text-teal-500 hover:text-teal-700' }
  return (
    <button
      onClick={onToggle}
      className={`mt-2 text-[11px] font-light transition-colors flex items-center gap-1 ${textColor[accent] ?? textColor.violet}`}
    >
      {show ? 'Show less' : `+${total - cap} more`}
      <ChevronRight className={`h-3 w-3 transition-transform duration-200 ${show ? 'rotate-90' : ''}`} />
    </button>
  )
}

function LabsModal({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: LabsStats | null }) {
  const [showDocs,  setShowDocs]  = useState(false)
  const [showTests, setShowTests] = useState(false)
  if (!stats) return null
  const allDates  = Object.keys(stats.by_date)
  const allDocs   = Object.entries(stats.by_doctor).sort((a, b) => b[1] - a[1])
  const testNames = Object.keys(stats.by_test)
  const visDocs   = showDocs  ? allDocs   : allDocs.slice(0, MODAL_CAP)
  const visTests  = showTests ? testNames : testNames.slice(0, MODAL_CAP)
  return (
    <HospitalModal
      open={open} onClose={onClose}
      title="Lab Test Call Log" subtitle={`${stats.total_tests} tests logged across ${allDates.length} dates`}
      Icon={FlaskConical} iconBg="from-violet-50 to-purple-50" iconBorder="border-violet-100" iconColor="text-violet-600"
    >
      {/* Status row */}
      <div>
        <SectionLabel title="Status Overview" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {Object.entries(stats.by_status).map(([s, c]) => (
            <StatusDot key={s} label={s} count={c} color="violet" />
          ))}
        </div>
      </div>

      {/* Test types */}
      {testNames.length > 0 && (
        <div>
          <SectionLabel title={`Test Types · ${testNames.length}`} />
          <div className="flex flex-wrap gap-2">
            {visTests.map(test => (
              <div key={test} className="flex items-center gap-1.5 bg-violet-50 border border-violet-100 rounded-full px-3 py-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                <span className="text-[11px] font-light text-violet-700">{test}</span>
                <span className="text-[10px] font-medium text-violet-500 ml-0.5">{stats.by_test[test]}</span>
              </div>
            ))}
          </div>
          <ShowMoreToggle total={testNames.length} cap={MODAL_CAP} show={showTests} onToggle={() => setShowTests(p => !p)} accent="violet" />
        </div>
      )}

      {/* Calls by date — interactive calendar heatmap */}
      <div>
        <SectionLabel title="Calls by Date" />
        <CalendarHeatmap data={stats.by_date} accent="violet" label="tests" />
      </div>

      {/* Assigned doctors */}
      {allDocs.length > 0 && (
        <div>
          <SectionLabel title="Assigned Doctors" />
          <div className="flex flex-wrap gap-2">
            {visDocs.map(([doc, cnt]) => (
              <div key={doc} className="bg-white border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center">
                  <span className="text-[9px] font-medium text-violet-600">{doc.slice(0, 2).toUpperCase()}</span>
                </div>
                <span className="text-[11px] font-light text-slate-600">{doc}</span>
                <span className="text-[10px] font-medium text-slate-800 bg-slate-100 rounded-md px-1.5 py-0.5">{cnt}</span>
              </div>
            ))}
          </div>
          <ShowMoreToggle total={allDocs.length} cap={MODAL_CAP} show={showDocs} onToggle={() => setShowDocs(p => !p)} accent="violet" />
        </div>
      )}
    </HospitalModal>
  )
}

// ── Departments Modal ────────────────────────────────────────────────────────

function DoctorsModal({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: DoctorsStats | null }) {
  if (!stats) return null
  const specs = Object.entries(stats.by_specialization).sort((a, b) => b[1] - a[1])
  const maxVal = specs[0]?.[1] ?? 1
  const total  = specs.reduce((s, [, c]) => s + c, 0)
  const deptColors = ['bg-teal-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-pink-500']
  const deptBgs    = ['bg-teal-50 border-teal-100', 'bg-sky-50 border-sky-100', 'bg-violet-50 border-violet-100', 'bg-amber-50 border-amber-100', 'bg-rose-50 border-rose-100', 'bg-indigo-50 border-indigo-100', 'bg-emerald-50 border-emerald-100', 'bg-pink-50 border-pink-100']
  const deptText   = ['text-teal-700', 'text-sky-700', 'text-violet-700', 'text-amber-700', 'text-rose-700', 'text-indigo-700', 'text-emerald-700', 'text-pink-700']
  return (
    <HospitalModal
      open={open} onClose={onClose}
      title="Departments" subtitle={`${specs.length} departments · ${stats.total_doctors} doctors`}
      Icon={Stethoscope} iconBg="from-teal-50 to-emerald-50" iconBorder="border-teal-100" iconColor="text-teal-600"
    >
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3">
        <StatBadge label="Total Doctors" value={stats.total_doctors} color="teal" />
        <StatBadge label="Departments" value={specs.length} color="emerald" />
      </div>

      {/* Vertical bar chart */}
      {specs.length > 0 && (
        <div>
          <SectionLabel title="Department Distribution" />
          <div className="bg-white border border-slate-200 rounded-2xl p-4">
            <div className="flex items-end justify-around gap-3" style={{ minHeight: 140 }}>
              {specs.map(([spec, cnt], i) => {
                const heightPct = Math.max(8, (cnt / maxVal) * 100)
                return (
                  <div key={spec} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-800">{cnt}</span>
                    <div className="w-full max-w-[40px] relative" style={{ height: 100 }}>
                      <div
                        className={`absolute bottom-0 left-0 right-0 rounded-t-lg ${deptColors[i % deptColors.length]} transition-all duration-700`}
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-light text-slate-500 text-center leading-tight truncate w-full">{spec}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Department cards */}
      {specs.length > 0 && (
        <div>
          <SectionLabel title="Department Details" />
          <div className="grid grid-cols-2 gap-2">
            {specs.map(([spec, cnt], i) => {
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0
              return (
                <div key={spec} className={`border rounded-2xl px-4 py-3 ${deptBgs[i % deptBgs.length]}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${deptColors[i % deptColors.length]}`} />
                    <span className={`text-xs font-medium ${deptText[i % deptText.length]}`}>{spec}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-light text-slate-800">{cnt}</span>
                    <span className="text-[10px] font-light text-slate-400">{pct}% of total</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </HospitalModal>
  )
}

// ── Appointments Modal ──────────────────────────────────────────────────────

function AppointmentsModal({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: AppointmentsStats | null }) {
  const [showDocs,  setShowDocs]  = useState(false)
  if (!stats) return null
  const allDocs   = Object.entries(stats.by_doctor).sort((a, b) => b[1] - a[1])
  const allDates  = Object.entries(stats.by_date).sort((a, b) => b[0].localeCompare(a[0]))
  const allStatus = Object.entries(stats.by_status).sort((a, b) => b[1] - a[1])
  const visDocs   = showDocs  ? allDocs  : allDocs.slice(0, MODAL_CAP)
  return (
    <HospitalModal
      open={open} onClose={onClose}
      title="Appointment Log" subtitle={`${stats.total_appointments} calls scheduled across ${allDocs.length} doctors`}
      Icon={ClipboardList} iconBg="from-sky-50 to-blue-50" iconBorder="border-sky-100" iconColor="text-sky-600"
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <StatBadge label="Total" value={stats.total_appointments} color="sky" />
        <StatBadge label="Doctors" value={allDocs.length} color="indigo" />
        <StatBadge label="Days Active" value={allDates.length} color="violet" />
      </div>

      {/* Status */}
      {allStatus.length > 0 && (
        <div>
          <SectionLabel title="Status" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {allStatus.map(([s, c]) => <StatusDot key={s} label={s} count={c} color="sky" />)}
          </div>
        </div>
      )}

      {/* Doctors */}
      {allDocs.length > 0 && (
        <div>
          <SectionLabel title={`Doctor Schedule · ${allDocs.length}`} />
          <div className="grid grid-cols-2 gap-2">
            {visDocs.map(([doc, cnt]) => (
              <div key={doc} className="flex items-center gap-2.5 bg-white border border-slate-200 rounded-xl px-3 py-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-3 w-3 text-sky-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-medium text-slate-700 truncate">{doc}</p>
                </div>
                <span className="text-xs font-medium text-sky-600 bg-sky-50 border border-sky-100 rounded-lg px-2 py-0.5 shrink-0">{cnt}</span>
              </div>
            ))}
          </div>
          <ShowMoreToggle total={allDocs.length} cap={MODAL_CAP} show={showDocs} onToggle={() => setShowDocs(p => !p)} accent="sky" />
        </div>
      )}

      {/* Date activity — interactive calendar heatmap */}
      <div>
        <SectionLabel title="Date Activity" />
        <CalendarHeatmap data={stats.by_date} accent="sky" label="appointments" />
      </div>
    </HospitalModal>
  )
}

// ── Recent Patients Modal ───────────────────────────────────────────────────

function HistoryModal({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: HistoryStats | null }) {
  const [showPatients, setShowPatients] = useState(false)
  const [showDocs,     setShowDocs]     = useState(false)
  if (!stats) return null
  const allPatients = Object.entries(stats.by_patient).sort((a, b) => b[1] - a[1])
  const allDocs     = Object.entries(stats.by_doctor).sort((a, b) => b[1] - a[1])
  const visPatients = showPatients ? allPatients : allPatients.slice(0, MODAL_CAP)
  const visDocs     = showDocs     ? allDocs     : allDocs.slice(0, MODAL_CAP)
  return (
    <HospitalModal
      open={open} onClose={onClose}
      title="Recent Patients" subtitle={`${stats.total_records} call records · ${allPatients.length} patients`}
      Icon={Users} iconBg="from-emerald-50 to-green-50" iconBorder="border-emerald-100" iconColor="text-emerald-600"
    >
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <StatBadge label="Call Records" value={stats.total_records} color="emerald" />
        <StatBadge label="Patients" value={allPatients.length} color="teal" />
      </div>

      {/* Patient cards */}
      {allPatients.length > 0 && (
        <div>
          <SectionLabel title={`All Patients · ${allPatients.length}`} />
          <div className="grid grid-cols-2 gap-2">
            {visPatients.map(([patient, visits], idx) => (
              <div
                key={patient}
                className="bg-white border border-slate-200 rounded-2xl px-3 py-3 flex items-center gap-3 hover:border-emerald-200 transition-colors animate-in fade-in slide-in-from-bottom-1"
                style={{ animationDelay: `${idx * 25}ms` }}
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-medium text-emerald-600">{patient.trim().charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{patient}</p>
                  <p className="text-[10px] font-light text-slate-400 mt-0.5">{visits} call{visits !== 1 ? 's' : ''}</p>
                </div>
              </div>
            ))}
          </div>
          <ShowMoreToggle total={allPatients.length} cap={MODAL_CAP} show={showPatients} onToggle={() => setShowPatients(p => !p)} accent="emerald" />
        </div>
      )}

      {/* Treating doctors */}
      {allDocs.length > 0 && (
        <div>
          <SectionLabel title="Treating Doctors" />
          <div className="flex flex-wrap gap-2">
            {visDocs.map(([doc, cnt]) => (
              <div key={doc} className="bg-white border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-2">
                <Stethoscope className="h-3 w-3 text-emerald-500" />
                <span className="text-[11px] font-light text-slate-600">{doc}</span>
                <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded-md px-1.5 py-0.5">{cnt}</span>
              </div>
            ))}
          </div>
          <ShowMoreToggle total={allDocs.length} cap={MODAL_CAP} show={showDocs} onToggle={() => setShowDocs(p => !p)} accent="emerald" />
        </div>
      )}
    </HospitalModal>
  )
}

// ── Prescriptions Modal ─────────────────────────────────────────────────────

function PharmacyModal({ open, onClose, stats }: { open: boolean; onClose: () => void; stats: PharmacyStats | null }) {
  const [showMeds, setShowMeds] = useState(false)
  const [showDocs, setShowDocs] = useState(false)
  if (!stats) return null
  const allMeds = Object.entries(stats.by_medicine).sort((a, b) => b[1] - a[1])
  const allDocs = Object.entries(stats.by_doctor).sort((a, b) => b[1] - a[1])
  const visibleMeds = showMeds ? allMeds : allMeds.slice(0, MODAL_CAP)
  return (
    <HospitalModal
      open={open} onClose={onClose}
      title="Prescriptions" subtitle={`${stats.total_prescriptions} prescriptions · ${stats.unique_medicines} medicines`}
      Icon={Pill} iconBg="from-rose-50 to-pink-50" iconBorder="border-rose-100" iconColor="text-rose-600"
    >
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <StatBadge label="Total Rx" value={stats.total_prescriptions} color="rose" />
        <StatBadge label="Medicines" value={stats.unique_medicines} color="pink" />
        <StatBadge label="Patients" value={stats.unique_patients} color="violet" />
      </div>

      {/* Medicine grid — paginated, not endless */}
      {allMeds.length > 0 && (
        <div>
          <SectionLabel title={`Medicines · ${allMeds.length}`} />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {visibleMeds.map(([med, cnt]) => (
              <div key={med} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-2 hover:border-rose-200 transition-colors">
                <div className="w-5 h-5 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                  <Pill className="h-2.5 w-2.5 text-rose-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-light text-slate-700 truncate" title={med}>{med}</p>
                </div>
                <span className="text-[10px] font-medium text-rose-600 bg-rose-50 rounded-md px-1.5 py-0.5 shrink-0">{cnt}</span>
              </div>
            ))}
          </div>
          <ShowMoreToggle total={allMeds.length} cap={MODAL_CAP} show={showMeds} onToggle={() => setShowMeds(p => !p)} accent="rose" />
        </div>
      )}

      {/* Prescribing doctors */}
      {allDocs.length > 0 && (
        <div>
          <SectionLabel title="Prescribing Doctors" />
          <div className="flex flex-wrap gap-2">
            {(showDocs ? allDocs : allDocs.slice(0, MODAL_CAP)).map(([doc, cnt]) => (
              <div key={doc} className="bg-white border border-slate-200 rounded-full px-3 py-1.5 flex items-center gap-2">
                <Stethoscope className="h-3 w-3 text-rose-400" />
                <span className="text-[11px] font-light text-slate-600">{doc}</span>
                <span className="text-[10px] font-medium text-rose-600 bg-rose-50 rounded-md px-1.5 py-0.5">{cnt}</span>
              </div>
            ))}
          </div>
          <ShowMoreToggle total={allDocs.length} cap={MODAL_CAP} show={showDocs} onToggle={() => setShowDocs(p => !p)} accent="rose" />
        </div>
      )}
    </HospitalModal>
  )
}

// ─── Hospital Dashboard Section ───────────────────────────────────────────────

function HospitalDashboardSection() {
  const [dashboard, setDashboard] = useState<HMSDashboard | null>(null)
  const [doctorsList, setDoctorsList] = useState<HMSDoctor[]>([])
  const [doctorStats, setDoctorStats] = useState<HMSDoctorStats | null>(null)
  const [appointmentsList, setAppointmentsList] = useState<HMSAppointment[]>([])
  const [appointmentStats, setAppointmentStats] = useState<HMSAppointmentStats | null>(null)
  const [loading, setLoading] = useState(true)

  const [docsOpen, setDocsOpen] = useState(false)
  const [apptOpen, setApptOpen] = useState(false)
  const [specsOpen, setSpecsOpen] = useState(false)

  useEffect(() => {
    const base = process.env.NEXT_PUBLIC_BASE_URL
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Token ${Cookies.get('Token') || ''}`,
    }
    const logAndJson = async (url: string, label: string, opts?: RequestInit) => {
      console.log(`[HMS] ► REQUEST  ${label}:`, url, opts?.body ? JSON.parse(opts.body as string) : '')
      const res = await fetch(url, { ...opts, headers })
      const data = await res.json()
      console.log(`[HMS] ◄ RESPONSE ${label} [${res.status}]:`, data)
      return data
    }

    Promise.allSettled([
      // 1. GET /reports/hospital-crm/dashboard/
      logAndJson(`${base}/reports/hospital-crm/dashboard/`, 'Hospital Dashboard'),
      // 2. GET /reports/hospital-crm/doctors/
      logAndJson(`${base}/reports/hospital-crm/doctors/`, 'Get Doctors (all)'),
      // 3. GET /reports/hospital-crm/stats/doctors/
      logAndJson(`${base}/reports/hospital-crm/stats/doctors/`, 'Doctors Stats'),
      // 4. GET /reports/hospital-crm/appointments/
      logAndJson(`${base}/reports/hospital-crm/appointments/`, 'Get Appointments (all)'),
      // 5. GET /reports/hospital-crm/stats/appointments/
      logAndJson(`${base}/reports/hospital-crm/stats/appointments/`, 'Appointments Stats'),
      // 6. GET /reports/hospital-crm/stats/
      logAndJson(`${base}/reports/hospital-crm/stats/`, 'Stats Overview (all entities)'),
    ])
      .then(([dashRes, docsRes, docStatsRes, apptRes, apptStatsRes, overviewRes]) => {

        // 1. Dashboard
        if (dashRes.status === 'fulfilled') setDashboard(dashRes.value)

        // 2. Doctors list — response: { entity, count, records: [...] }
        if (docsRes.status === 'fulfilled') {
          const d = docsRes.value
          setDoctorsList(Array.isArray(d) ? d : Array.isArray(d?.records) ? d.records : Array.isArray(d?.doctors) ? d.doctors : Array.isArray(d?.results) ? d.results : [])
        }

        // 3. Doctors stats — response: { entity, stats: { total_doctors, by_specialization, ... } }
        if (docStatsRes.status === 'fulfilled') {
          const d = docStatsRes.value
          setDoctorStats(d?.stats ?? (d?.total_doctors !== undefined ? d : null))
        }

        // 4. Appointments list — response: { entity, count, records: [...] }
        if (apptRes.status === 'fulfilled') {
          const d = apptRes.value
          setAppointmentsList(Array.isArray(d) ? d : Array.isArray(d?.records) ? d.records : Array.isArray(d?.appointments) ? d.appointments : Array.isArray(d?.results) ? d.results : [])
        }

        // 5. Appointments stats — response: { entity, stats: { total_appointments, by_status, ... } }
        if (apptStatsRes.status === 'fulfilled') {
          const d = apptStatsRes.value
          setAppointmentStats(d?.stats ?? (d?.total_appointments !== undefined ? d : null))
        }

        // 6. Overview stats — response: { totals, entities: { doctors, appointments } }
        if (overviewRes.status === 'fulfilled') {
          const d = overviewRes.value
          if (docStatsRes.status !== 'fulfilled' && d?.entities?.doctors) setDoctorStats(d.entities.doctors)
          if (apptStatsRes.status !== 'fulfilled' && d?.entities?.appointments) setAppointmentStats(d.entities.appointments)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  // Filter + update state
  const [docFilter, setDocFilter] = useState('')
  const [apptStatusFilter, setApptStatusFilter] = useState('')
  const [apptPatientFilter, setApptPatientFilter] = useState('')
  const [apptDateFilter, setApptDateFilter] = useState('')
  const [filteredDoctors, setFilteredDoctors] = useState<HMSDoctor[]>([])
  const [filteredAppts, setFilteredAppts] = useState<HMSAppointment[]>([])

  const [filteringAppts, setFilteringAppts] = useState(false)
  const [updatingDoc, setUpdatingDoc] = useState<string | null>(null)
  const [updatingAppt, setUpdatingAppt] = useState<string | null>(null)

  // Doctor name filter — client-side against already-loaded list
  const filterDoctorsByName = (name: string) => {
    const q = name.trim().toLowerCase()
    setFilteredDoctors(q ? doctorsList.filter(d => d.full_name.toLowerCase().includes(q)) : doctorsList)
  }

  // 8–10. GET /reports/hospital-crm/appointments/?status=X &patient_name=X &appointment_date=X
  const fetchFilteredAppts = async (status: string, patientName: string, date: string) => {
    setFilteringAppts(true)
    const base = process.env.NEXT_PUBLIC_BASE_URL
    const headers = { 'Content-Type': 'application/json', Authorization: `Token ${Cookies.get('Token') || ''}` }
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (patientName) params.set('patient_name', patientName)
    if (date) params.set('appointment_date', date)
    const url = `${base}/reports/hospital-crm/appointments/${params.toString() ? '?' + params.toString() : ''}`
    const label = status ? 'Get Appointments (filter by Status)' : patientName ? 'Get Appointments (filter by Patient Name)' : date ? 'Get Appointments (filter by Date)' : 'Get Appointments (all)'
    console.log(`[HMS] ► REQUEST  ${label}:`, url)
    try {
      const res = await fetch(url, { headers })
      const d = await res.json()
      console.log(`[HMS] ◄ RESPONSE ${label} [${res.status}]:`, d)
      setFilteredAppts(Array.isArray(d) ? d : Array.isArray(d?.records) ? d.records : Array.isArray(d?.appointments) ? d.appointments : Array.isArray(d?.results) ? d.results : [])
    } catch (e) { console.error('[HMS] fetchFilteredAppts error:', e); setFilteredAppts([]) }
    finally { setFilteringAppts(false) }
  }

  // 11. PATCH /reports/hospital-crm/doctors/update/  body: { id, updates: { consultation_fee, accepting_new_patients } }
  const handleUpdateDoctor = async (id: string, updates: Record<string, any>) => {
    setUpdatingDoc(id)
    const base = process.env.NEXT_PUBLIC_BASE_URL
    const headers = { 'Content-Type': 'application/json', Authorization: `Token ${Cookies.get('Token') || ''}` }
    const body = { id, updates }
    console.log('[HMS] ► REQUEST  Update Doctor (PATCH):', `${base}/reports/hospital-crm/doctors/update/`, body)
    try {
      const res = await fetch(`${base}/reports/hospital-crm/doctors/update/`, {
        method: 'PATCH', headers,
        body: JSON.stringify(body),
      })
      const updated = await res.json()
      console.log(`[HMS] ◄ RESPONSE Update Doctor (PATCH) [${res.status}]:`, updated)
      if (res.ok) {
        const patchedDoc = updated?.doctor ?? updated
        setDoctorsList(prev => prev.map(d => d.id === id ? { ...d, ...patchedDoc } : d))
        setFilteredDoctors(prev => prev.map(d => d.id === id ? { ...d, ...patchedDoc } : d))
      }
    } catch (e) { console.error('[HMS] handleUpdateDoctor error:', e) }
    finally { setUpdatingDoc(null) }
  }

  // 12. PATCH /reports/hospital-crm/appointments/update/  body: { id, updates: { status, notes } }
  const handleUpdateAppointment = async (id: string, updates: Record<string, any>) => {
    setUpdatingAppt(id)
    const base = process.env.NEXT_PUBLIC_BASE_URL
    const headers = { 'Content-Type': 'application/json', Authorization: `Token ${Cookies.get('Token') || ''}` }
    const body = { id, updates }
    console.log('[HMS] ► REQUEST  Update Appointment (PATCH):', `${base}/reports/hospital-crm/appointments/update/`, body)
    try {
      const res = await fetch(`${base}/reports/hospital-crm/appointments/update/`, {
        method: 'PATCH', headers,
        body: JSON.stringify(body),
      })
      const updated = await res.json()
      console.log(`[HMS] ◄ RESPONSE Update Appointment (PATCH) [${res.status}]:`, updated)
      if (res.ok) {
        const patchedAppt = updated?.appointment ?? updated
        setAppointmentsList(prev => prev.map(a => a.appointment_id === id ? { ...a, ...patchedAppt } : a))
        setFilteredAppts(prev => prev.map(a => a.appointment_id === id ? { ...a, ...patchedAppt } : a))
      }
    } catch (e) { console.error('[HMS] handleUpdateAppointment error:', e) }
    finally { setUpdatingAppt(null) }
  }

  // When modals open, populate filtered lists from already-loaded data
  const openDocsModal = () => {
    setDocFilter('')
    setFilteredDoctors(doctorsList)
    setDocsOpen(true)
  }
  const openApptModal = () => {
    setApptStatusFilter('')
    setApptPatientFilter('')
    setApptDateFilter('')
    setFilteredAppts(appointmentsList)
    setApptOpen(true)
  }

  // Derived data for cards
  // Specializations: prefer stats.by_specialization, fall back to dashboard.specializations
  const rawSpecs = doctorStats?.by_specialization ?? dashboard?.specializations ?? {}
  const allSpecEntries = Object.entries(rawSpecs).sort((a, b) => b[1] - a[1])
  const specEntries = allSpecEntries.slice(0, 5)
  const maxSpec = allSpecEntries[0]?.[1] ?? 1

  // Status: prefer appointmentStats.by_status, fall back to dashboard.appointments_by_status
  const rawStatus = appointmentStats?.by_status ?? dashboard?.appointments_by_status ?? {}
  const statusEntries = Object.entries(rawStatus).sort((a, b) => b[1] - a[1])

  // Recent appointments feed from the list (dashboard has no recent_appointments array)
  const recentAppts = appointmentsList.slice(0, 5)

  const totalDocs = doctorStats?.total_doctors ?? dashboard?.total_doctors ?? doctorsList.length
  const totalAppts = appointmentStats?.total_appointments ?? dashboard?.total_appointments ?? appointmentsList.length
  const apptToday = dashboard?.appointments_today ?? 0
  const totalFees = dashboard?.total_consultation_fees ?? 0

  function Skel({ className }: { className: string }) {
    return <div className={`bg-slate-100 rounded-lg animate-pulse ${className}`} />
  }

  const apptStatusColors: Record<string, string> = {
    confirmed: 'bg-sky-50 text-sky-700 border-sky-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  const getStatusColor = (s: string) => apptStatusColors[s?.toLowerCase()] ?? 'bg-slate-50 text-slate-700 border-slate-200'

  return (
    <>
      {/* Doctors Detail Modal */}
      <HospitalModal
        open={docsOpen} onClose={() => setDocsOpen(false)}
        title="Doctors" subtitle={`${totalDocs} doctors · ${specEntries.length} specializations`}
        Icon={Stethoscope} iconBg="from-teal-50 to-emerald-50" iconBorder="border-teal-100" iconColor="text-teal-600"
      >
        {/* Filter by doctor name */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              value={docFilter}
              onChange={e => { setDocFilter(e.target.value); filterDoctorsByName(e.target.value) }}
              placeholder="Search by doctor name..."
              className="flex-1 text-sm font-light border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-300 focus:ring-1 focus:ring-teal-100 transition-colors"
            />
            {docFilter && (
              <button
                onClick={() => { setDocFilter(''); setFilteredDoctors(doctorsList) }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors shrink-0"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-[10px] font-light text-slate-400">
            Showing {filteredDoctors.length} of {doctorsList.length} doctors
          </p>
        </div>

        <div className="space-y-3">
          {filteredDoctors.length === 0 ? (
            <p className="text-sm text-slate-500 font-light text-center py-8">No doctors found</p>
          ) : filteredDoctors.map((doc) => (
            <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-teal-200 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-teal-600">{doc.full_name?.charAt(0)?.toUpperCase() ?? 'D'}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.full_name}</p>
                  <p className="text-xs font-light text-slate-500">{doc.specialization}</p>
                </div>
                {doc.consultation_fee !== undefined && (
                  <span className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-2 py-1">PKR{doc.consultation_fee}</span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  disabled={updatingDoc === doc.id}
                  onClick={() => handleUpdateDoctor(doc.id, { accepting_new_patients: !doc.accepting_new_patients })}
                  className={`text-[10px] px-3 py-1 rounded-full border transition-colors disabled:opacity-60 ${doc.accepting_new_patients ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'}`}
                >
                  {updatingDoc === doc.id ? '...' : doc.accepting_new_patients ? 'Accepting patients' : 'Not accepting'}
                </button>
                {doc.shift_start && doc.shift_end && (
                  <span className="text-[10px] font-light text-slate-400">{doc.shift_start.slice(0,5)} – {doc.shift_end.slice(0,5)}</span>
                )}
                {doc.experience_years !== undefined && doc.experience_years > 0 && (
                  <span className="text-[10px] font-light text-slate-400">{doc.experience_years}y exp</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </HospitalModal>

      {/* Appointments Detail Modal */}
      <HospitalModal
        open={apptOpen} onClose={() => setApptOpen(false)}
        title="Appointments" subtitle={`${totalAppts} total · ${statusEntries.length} status types`}
        Icon={ClipboardList} iconBg="from-sky-50 to-blue-50" iconBorder="border-sky-100" iconColor="text-sky-600"
      >
        {/* Filters */}
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              value={apptPatientFilter}
              onChange={e => setApptPatientFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && fetchFilteredAppts(apptStatusFilter, apptPatientFilter, apptDateFilter)}
              placeholder="Search by patient name..."
              className="text-sm font-light border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100 transition-colors"
            />
            <input
              value={apptDateFilter}
              onChange={e => { setApptDateFilter(e.target.value); fetchFilteredAppts(apptStatusFilter, apptPatientFilter, e.target.value) }}
              type="date"
              className="text-sm font-light border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-300 focus:ring-1 focus:ring-sky-100 transition-colors"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={apptStatusFilter}
              onChange={e => { setApptStatusFilter(e.target.value); fetchFilteredAppts(e.target.value, apptPatientFilter, apptDateFilter) }}
              className="flex-1 text-sm font-light border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-sky-300 bg-white transition-colors"
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button
              onClick={() => fetchFilteredAppts(apptStatusFilter, apptPatientFilter, apptDateFilter)}
              disabled={filteringAppts}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-light transition-colors disabled:opacity-60 flex items-center gap-2 shrink-0"
            >
              {filteringAppts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {filteringAppts ? 'Searching...' : 'Search'}
            </button>
            {(apptStatusFilter || apptPatientFilter || apptDateFilter) && (
              <button
                onClick={() => { setApptStatusFilter(''); setApptPatientFilter(''); setApptDateFilter(''); setFilteredAppts(appointmentsList) }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-colors text-xs font-light shrink-0"
                title="Clear filters"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {filteringAppts && (
            <p className="text-[10px] font-light text-slate-400 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" /> Fetching from API...
            </p>
          )}
        </div>

        <div className="space-y-3">
          {filteringAppts ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skel key={i} className="h-20 w-full" />)}</div>
          ) : filteredAppts.length === 0 ? (
            <p className="text-sm text-slate-500 font-light text-center py-8">No appointments found</p>
          ) : filteredAppts.map((appt) => (
            <div key={appt.appointment_id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-sky-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-slate-800">{appt.patient_name}</p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusColor(appt.status)}`}>{appt.status}</span>
              </div>
              <div className="flex items-center gap-4 text-xs font-light text-slate-500 mb-3">
                <span className="flex items-center gap-1"><Stethoscope className="h-3 w-3" /> {appt.doctors?.full_name ?? '—'}</span>
                <span>{appt.appointment_date}{appt.time_slot ? ` · ${appt.time_slot.slice(0,5)}` : ''}</span>
                {appt.phone && <span>{appt.phone}</span>}
              </div>
              {appt.notes && <p className="text-[11px] font-light text-slate-400 mb-3">{appt.notes}</p>}
              {/* Quick status update */}
              <div className="flex gap-1.5 flex-wrap">
                {['pending','confirmed','completed','cancelled'].map(s => (
                  <button
                    key={s}
                    disabled={updatingAppt === appt.appointment_id || appt.status === s}
                    onClick={() => handleUpdateAppointment(appt.appointment_id, { status: s })}
                    className={`text-[10px] px-2.5 py-1 rounded-full border transition-colors disabled:opacity-40 ${appt.status === s ? getStatusColor(s) : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                  >
                    {updatingAppt === appt.appointment_id ? '...' : s}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </HospitalModal>

      {/* Specializations Modal */}
      <HospitalModal
        open={specsOpen} onClose={() => setSpecsOpen(false)}
        title="All Specializations" subtitle={`${allSpecEntries.length} departments · ${allSpecEntries.reduce((s, [, c]) => s + c, 0)} doctors total`}
        Icon={Stethoscope} iconBg="from-teal-50 to-emerald-50" iconBorder="border-teal-100" iconColor="text-teal-600"
      >
        {/* KPI row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-teal-50 border border-teal-100 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-light text-teal-700">{allSpecEntries.length}</p>
            <p className="text-[10px] font-light text-teal-500 uppercase tracking-wider mt-0.5">Departments</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-light text-slate-800">{allSpecEntries.reduce((s, [, c]) => s + c, 0)}</p>
            <p className="text-[10px] font-light text-slate-400 uppercase tracking-wider mt-0.5">Total Doctors</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3 text-center">
            <p className="text-2xl font-light text-emerald-700">{allSpecEntries[0]?.[1] ?? 0}</p>
            <p className="text-[10px] font-light text-emerald-500 uppercase tracking-wider mt-0.5">Largest Dept</p>
          </div>
        </div>

        {/* Full bar chart */}
        <div className="space-y-3">
          {allSpecEntries.map(([spec, cnt], i) => {
            const pct = maxSpec > 0 ? Math.round((cnt / maxSpec) * 100) : 0
            const totalAll = allSpecEntries.reduce((s, [, c]) => s + c, 0)
            const sharePct = totalAll > 0 ? Math.round((cnt / totalAll) * 100) : 0
            const colors = ['bg-teal-500','bg-sky-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-indigo-500','bg-emerald-500','bg-pink-500','bg-orange-500','bg-cyan-500']
            const dotColors = ['bg-teal-500','bg-sky-500','bg-violet-500','bg-amber-500','bg-rose-500','bg-indigo-500','bg-emerald-500','bg-pink-500','bg-orange-500','bg-cyan-500']
            const bgColors = ['bg-teal-50 border-teal-100','bg-sky-50 border-sky-100','bg-violet-50 border-violet-100','bg-amber-50 border-amber-100','bg-rose-50 border-rose-100','bg-indigo-50 border-indigo-100','bg-emerald-50 border-emerald-100','bg-pink-50 border-pink-100','bg-orange-50 border-orange-100','bg-cyan-50 border-cyan-100']
            const textColors = ['text-teal-700','text-sky-700','text-violet-700','text-amber-700','text-rose-700','text-indigo-700','text-emerald-700','text-pink-700','text-orange-700','text-cyan-700']
            const c = i % colors.length
            return (
              <div key={spec} className={`border rounded-2xl px-4 py-3 ${bgColors[c]}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotColors[c]}`} />
                    <span className={`text-sm font-medium truncate ${textColors[c]}`}>{spec}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-xs font-light text-slate-400">{sharePct}%</span>
                    <span className={`text-sm font-semibold ${textColors[c]}`}>{cnt}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-white/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${colors[c]} transition-all duration-700`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </HospitalModal>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-4">

        {/* Section header */}
        <div className="flex items-center gap-2">
          <HeartPulse className="h-3.5 w-3.5 text-rose-400" />
          <span className="text-[11px] font-light tracking-[0.15em] uppercase text-slate-400">Hospital Management</span>
          <div className="flex-1 h-px bg-slate-200/60" />
        </div>

        {/* ── Row 1: 3 KPI Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

          {/* Total Doctors */}
          <button onClick={openDocsModal} className="group text-left bg-white border border-slate-200 hover:border-teal-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center border border-teal-100 group-hover:scale-110 transition-transform duration-300">
                <Stethoscope className="h-4 w-4 text-teal-600" />
              </div>
              {loading ? <Skel className="h-8 w-12" /> : (
                <span className="text-2xl font-light text-slate-900">{totalDocs}</span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-700">Doctors</p>
            <p className="text-[10px] font-light text-slate-400 mt-0.5">
              {loading ? '...' : `${specEntries.length} specializations`}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
              <span className="text-[10px] font-light text-slate-400 group-hover:text-teal-600 flex items-center gap-0.5 transition-colors">
                View all <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>

          {/* Total Appointments */}
          <button onClick={openApptModal} className="group text-left bg-white border border-slate-200 hover:border-sky-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100 group-hover:scale-110 transition-transform duration-300">
                <ClipboardList className="h-4 w-4 text-sky-600" />
              </div>
              {loading ? <Skel className="h-8 w-12" /> : (
                <span className="text-2xl font-light text-slate-900">{totalAppts}</span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-700">Appointments</p>
            <p className="text-[10px] font-light text-slate-400 mt-0.5">
              {loading ? '...' : `${statusEntries.length} status types`}
            </p>
            <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end">
              <span className="text-[10px] font-light text-slate-400 group-hover:text-sky-600 flex items-center gap-0.5 transition-colors">
                View all <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </button>

          {/* Today's Appointments */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center border border-violet-100">
                <Activity className="h-4 w-4 text-violet-600" />
              </div>
              {loading ? <Skel className="h-8 w-12" /> : (
                <span className="text-2xl font-light text-slate-900">{apptToday}</span>
              )}
            </div>
            <p className="text-xs font-medium text-slate-700">Today's Appointments</p>
            {!loading && totalFees > 0 && (
              <p className="text-[10px] font-light text-slate-400 mt-0.5">PKR{totalFees.toLocaleString()} total fees</p>
            )}
          </div>
        </div>

        {/* ── Row 2: Appointments by Status + Specializations ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Appointment Status Breakdown */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-sky-50 rounded-lg flex items-center justify-center border border-sky-100">
                  <ClipboardList className="h-3 w-3 text-sky-600" />
                </div>
                <p className="text-sm font-medium text-slate-800">Appointment Status</p>
              </div>
              {!loading && <span className="text-xs font-light text-slate-400">{totalAppts} total</span>}
            </div>
            {loading ? (
              <div className="grid grid-cols-2 gap-2">{[1,2,3,4].map(i => <Skel key={i} className="h-14" />)}</div>
            ) : statusEntries.length > 0 ? (
              <>
                {/* Status pill grid */}
                <div className="grid grid-cols-2 gap-2">
                  {statusEntries.map(([status, count]) => {
                    const s = status.toLowerCase()
                    const pct = totalAppts > 0 ? Math.round((count / totalAppts) * 100) : 0
                    const styles = {
                      pending:   { pill: 'bg-amber-50 border-amber-200',  dot: 'bg-amber-400',  text: 'text-amber-700',  num: 'text-amber-800' },
                      confirmed: { pill: 'bg-sky-50 border-sky-200',      dot: 'bg-sky-500',    text: 'text-sky-700',    num: 'text-sky-800' },
                      completed: { pill: 'bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', text: 'text-emerald-700', num: 'text-emerald-800' },
                      cancelled: { pill: 'bg-red-50 border-red-200',      dot: 'bg-red-400',    text: 'text-red-700',    num: 'text-red-800' },
                    }
                    const st = styles[s as keyof typeof styles] ?? { pill: 'bg-slate-50 border-slate-200', dot: 'bg-slate-400', text: 'text-slate-600', num: 'text-slate-800' }
                    return (
                      <div key={status} className={`border rounded-xl p-3 ${st.pill}`}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className={`w-2 h-2 rounded-full ${st.dot}`} />
                          <span className={`text-[10px] font-medium uppercase tracking-wide ${st.text}`}>{status}</span>
                        </div>
                        <p className={`text-xl font-light ${st.num}`}>{count}</p>
                        <p className={`text-[10px] font-light ${st.text} opacity-70`}>{pct}% of total</p>
                      </div>
                    )
                  })}
                </div>
                {/* Segmented bar */}
                <div className="mt-3 flex rounded-full overflow-hidden h-1.5 gap-0.5">
                  {statusEntries.map(([status, count]) => {
                    const s = status.toLowerCase()
                    const pct = totalAppts > 0 ? (count / totalAppts) * 100 : 0
                    const barColor = s === 'confirmed' ? 'bg-sky-500' : s === 'completed' ? 'bg-emerald-500' : s === 'pending' ? 'bg-amber-400' : s === 'cancelled' ? 'bg-red-400' : 'bg-slate-300'
                    return <div key={status} className={`${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                  })}
                </div>
              </>
            ) : (
              <p className="text-[11px] font-light text-slate-400 text-center py-4">No appointment data</p>
            )}
          </div>

          {/* Specialization Distribution */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-teal-50 rounded-lg flex items-center justify-center border border-teal-100">
                  <Stethoscope className="h-3 w-3 text-teal-600" />
                </div>
                <p className="text-sm font-medium text-slate-800">Specializations</p>
              </div>
              {!loading && allSpecEntries.length > 5 && (
                <button
                  onClick={() => setSpecsOpen(true)}
                  className="flex items-center gap-1 text-[11px] font-light text-teal-600 hover:text-teal-700 transition-colors"
                >
                  View all {allSpecEntries.length}
                  <ChevronRight className="h-3 w-3" />
                </button>
              )}
              {!loading && allSpecEntries.length <= 5 && allSpecEntries.length > 0 && (
                <span className="text-xs font-light text-slate-400">{allSpecEntries.length} total</span>
              )}
            </div>
            {loading ? (
              <div className="space-y-2.5">{[1,2,3,4].map(i => <Skel key={i} className="h-8 w-full" />)}</div>
            ) : specEntries.length > 0 ? (
              <>
                <div className="space-y-2.5">
                  {specEntries.map(([spec, cnt], i) => {
                    const pct = maxSpec > 0 ? Math.round((cnt / maxSpec) * 100) : 0
                    const barColors = ['bg-teal-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']
                    const dotColors = ['bg-teal-500', 'bg-sky-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500']
                    return (
                      <div key={spec}>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <div className={`w-2 h-2 rounded-full shrink-0 ${dotColors[i % dotColors.length]}`} />
                            <span className="text-xs font-light text-slate-600 truncate">{spec}</span>
                          </div>
                          <span className="text-xs font-medium text-slate-800 shrink-0">{cnt}</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColors[i % barColors.length]} transition-all duration-700`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                {allSpecEntries.length > 5 && (
                  <button
                    onClick={() => setSpecsOpen(true)}
                    className="mt-3 w-full py-2 rounded-xl border border-dashed border-teal-200 text-[11px] font-light text-teal-600 hover:bg-teal-50 hover:border-teal-300 transition-all duration-200 flex items-center justify-center gap-1"
                  >
                    +{allSpecEntries.length - 5} more specializations
                    <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </>
            ) : (
              <p className="text-[11px] font-light text-slate-400 text-center py-4">No specialization data</p>
            )}
          </div>
        </div>

        {/* ── Row 3: Recent Appointments ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center border border-emerald-100">
                <Users className="h-3 w-3 text-emerald-600" />
              </div>
              <p className="text-sm font-medium text-slate-800">Recent Appointments</p>
            </div>
            {recentAppts.length > 0 && (
              <button onClick={openApptModal} className="text-[10px] font-light text-slate-400 hover:text-sky-600 flex items-center gap-0.5 transition-colors">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            )}
          </div>
          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <Skel key={i} className="h-14 w-full" />)}</div>
          ) : recentAppts.length > 0 ? (
            <div className="space-y-2">
              {recentAppts.map((appt, i) => (
                <div key={appt.appointment_id || i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 hover:border-slate-200 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-medium text-emerald-600">{appt.patient_name?.charAt(0)?.toUpperCase() ?? 'P'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">{appt.patient_name}</p>
                    <p className="text-[10px] font-light text-slate-400">
                      {appt.doctors?.full_name ?? '—'} · {appt.appointment_date}{appt.time_slot ? ` · ${appt.time_slot.slice(0,5)}` : ''}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${getStatusColor(appt.status)}`}>
                    {appt.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] font-light text-slate-400 text-center py-4">No recent appointments</p>
          )}
        </div>
      </div>
    </>
  )
}


// ─── Page ─────────────────────────────────────────────────────────────────────



// ─── Recent Activity Section ──────────────────────────────────────────────────

type RecentConv = {
  session_id: string
  caller_number: string
  phonenumber: string
  start_time: string
  duration_sec: number | null
  summary: string | null
}

function RecentActivitySection() {
  const [convs, setConvs] = useState<RecentConv[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    async function load() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/messages/conversations/?page=${currentPage}`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )
        if (!res.ok) return
        const data = await res.json()
        setTotalPages(data.total_pages || 1)
        const allMsgs: any[] = data.results ? (Object.values(data.results) as any[][]).flat() : []

        const bySession: Record<string, any[]> = {}
        for (const msg of allMsgs) {
          if (!bySession[msg.session_id]) bySession[msg.session_id] = []
          bySession[msg.session_id].push(msg)
        }

        const sorted = Object.entries(bySession)
          .filter(([, msgs]) => Array.isArray(msgs) && msgs.length > 0 && msgs[0]?.timestamp)
          .sort((a, b) => {
            const tA = new Date(a[1][0].timestamp).getTime()
            const tB = new Date(b[1][0].timestamp).getTime()
            return tB - tA
          })
          .map(([session_id, msgs]) => {
            const chronological = [...msgs].sort(
              (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            )
            const first = chronological[0]
            const summaryMsg = chronological.find((m) => m.type === "summary")
            const duration_sec = summaryMsg
              ? Math.floor(
                  (new Date(summaryMsg.timestamp).getTime() - new Date(first.timestamp).getTime()) / 1000
                )
              : null
            return {
              session_id,
              caller_number: first.caller_number || "Unknown",
              phonenumber: first.phonenumber || "",
              start_time: first.timestamp,
              duration_sec,
              summary: summaryMsg?.summary || null,
            }
          })

        setConvs(sorted)
      } catch (err) {
        console.error("Recent activity fetch error:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [currentPage])

  if (!loading && convs.length === 0) return null

  return (
    <div className="group relative overflow-hidden bg-white border border-indigo-100 shadow-sm hover:shadow-md rounded-3xl transition-all duration-300 flex flex-col">
      {/* Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-400/8 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* Header strip */}
      <div className="relative flex items-center justify-between px-5 py-4 bg-indigo-50 rounded-t-3xl border-b border-indigo-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-2xl flex items-center justify-center border border-indigo-100">
            <Phone className="h-4 w-4 text-indigo-500" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-800">Recent Activity</h3>
            <p className="text-xs text-slate-400 font-light">
              {loading ? "Loading…" : `${convs.length} recent call${convs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <a
          href="/conversations"
          className="flex items-center gap-1.5 bg-white hover:bg-indigo-100 border border-indigo-100 rounded-xl px-3 py-1.5 transition-colors duration-200"
        >
          <span className="text-xs font-light text-indigo-600">View all</span>
          <ChevronRight className="h-3 w-3 text-indigo-500" />
        </a>
      </div>

        {/* Scrollable list */}
        <div className="overflow-y-auto" style={{ maxHeight: "18rem" }}>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100/60 last:border-0 animate-pulse">
                <div className="w-9 h-9 rounded-2xl bg-slate-100 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full w-28" />
                  <div className="h-2.5 bg-slate-50 rounded-full w-44" />
                </div>
                <div className="space-y-1.5 text-right">
                  <div className="h-2.5 bg-slate-100 rounded-full w-10" />
                  <div className="h-2 bg-slate-50 rounded-full w-14" />
                </div>
              </div>
            ))
          ) : (
            convs.map((conv, idx) => {
              const date = new Date(conv.start_time)
              const timeStr = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
              const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              const durStr =
                conv.duration_sec != null
                  ? conv.duration_sec < 60
                    ? `${conv.duration_sec}s`
                    : `${Math.floor(conv.duration_sec / 60)}m ${conv.duration_sec % 60}s`
                  : null

              return (
                <div
                  key={conv.session_id}
                  className="flex items-center gap-3 px-5 py-3.5 border-b border-slate-100/60 last:border-0 hover:bg-slate-50/70 transition-colors duration-150 animate-in fade-in slide-in-from-bottom-1"
                  style={{ animationDelay: `${idx * 35}ms` }}
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/60 flex items-center justify-center shrink-0">
                    <Phone className="h-3.5 w-3.5 text-indigo-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {conv.caller_number}
                    </p>
                    <p className="text-xs text-slate-400 font-light truncate">
                      {conv.phonenumber ? `→ ${conv.phonenumber}` : ""}
                      {typeof conv.summary === "string" && conv.summary.length > 0
                        ? `${conv.phonenumber ? " · " : ""}${conv.summary.slice(0, 55)}${conv.summary.length > 55 ? "…" : ""}`
                        : ""}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="text-right shrink-0 space-y-0.5">
                    <p className="text-xs text-slate-500 font-light">{timeStr}</p>
                    <p className="text-[10px] text-slate-400 font-light">{dateStr}</p>
                    {durStr && (
                      <p className="text-[10px] font-medium text-indigo-400">{durStr}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div className="px-5 py-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1.5 text-xs font-light text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:text-slate-800 transition-colors"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            <span className="text-[10px] font-light text-slate-400 tracking-wide">
              Page {currentPage} of {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1.5 text-xs font-light text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:text-slate-800 transition-colors"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Bottom bar */}
        {!loading && convs.length > 0 && (
          <div className="relative px-5 py-2.5 border-t border-slate-100/60 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <div className="flex-1 h-px bg-gradient-to-r from-indigo-200/50 to-transparent" />
            <span className="text-[10px] font-light text-slate-400 tracking-wide">
              Showing latest {convs.length} calls
            </span>
          </div>
        )}
      </div>
  )
}



export default function DashboardPage() {
  const [twilioNumbers, setTwilioNumbers] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [mapOpen, setMapOpen] = useState(false)
  const [currentPhoneIdx, setCurrentPhoneIdx] = useState(0)
  const [phoneModalOpen, setPhoneModalOpen] = useState(false)


  // ── Read category from localStorage and derive the item label ─────────────
  const [itemLabel, setItemLabel] = useState<string>('complaint')
  const [isMunicipal, setIsMunicipal] = useState(false)
  const [isFood, setIsFood] = useState(false)
  const [isHealthcare, setIsHealthcare] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)


  useEffect(() => {
    const category = localStorage.getItem('category')
    setItemLabel(getItemLabel(category))
    const norm = category?.trim().toLowerCase() ?? ''
    setIsMunicipal(MUNICIPAL_CATEGORIES.has(norm))
    setIsFood(FOOD_CATEGORIES.has(norm))
    setIsHealthcare(HEALTHCARE_CATEGORIES.has(norm))
  }, [])


  const itemLabelCap = itemLabel.charAt(0).toUpperCase() + itemLabel.slice(1)


  useEffect(() => {
    const fetchTwilioPhones = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/public/company/get-twilio-phones`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )


        const data = await res.json()


        if (Array.isArray(data.twilio_phone_numbers)) {
          setTwilioNumbers(data.twilio_phone_numbers)
        }
      } catch (error) {
        console.error("Error fetching Twilio numbers:", error)
      } finally {
        setLoading(false)
      }
    }


    fetchTwilioPhones()
  }, [])


  const handleCopy = (number: string, index: number) => {
    navigator.clipboard.writeText(number)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }


  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50/50">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.02),transparent_50%),radial-gradient(circle_at_70%_60%,rgba(14,165,233,0.03),transparent_50%)]"></div>


      <CursorGlow />


      {/* Map dialog — rendered at root level so it sits above everything */}
      <MapDialog open={mapOpen} onClose={() => setMapOpen(false)} itemLabelCap={itemLabelCap} />

      {/* Calendar modal — rendered at root level */}
      <CalendarModal open={calendarOpen} onClose={() => setCalendarOpen(false)} itemLabelCap={itemLabelCap} />


      <div className="relative z-30 max-w-[1600px] mx-auto px-6 py-8 space-y-6">
        <div className="animate-in fade-in slide-in-from-top-2 duration-500">
          <MetricsHeader />
        </div>


        {/* Map preview banner + Municipal contacts — only visible for 'municipal services' */}
        {isMunicipal && (
          <>
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 delay-50">
              <MapPreviewBanner onOpen={() => setMapOpen(true)} itemLabelCap={itemLabelCap} />
            </div>
            <MunicipalContactsSection />
          </>
        )}

        {/* Calendar preview banner + Food Order KPIs — only visible for food / restaurant categories */}
        {isFood && (
          <>
            <div className="animate-in fade-in slide-in-from-top-2 duration-500 delay-50">
              <CalendarPreviewBanner onOpen={() => setCalendarOpen(true)} itemLabelCap={itemLabelCap} />
            </div>
            <FoodOrdersSection />
          </>
        )}

        {/* Hospital CRM dashboard — only visible for healthcare / hospital industry types */}
        {isHealthcare && (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500 delay-50">
            <HospitalDashboardSection />
          </div>
        )}

        {/* Phone Numbers modal — hidden dialog, rendered at root level */}
        <PhoneNumbersModal
          open={phoneModalOpen}
          onClose={() => setPhoneModalOpen(false)}
          numbers={twilioNumbers}
          copiedIndex={copiedIndex}
          onCopy={handleCopy}
        />

        <div className="grid grid-cols-12 gap-6 animate-in fade-in duration-500 delay-75">

          {/* ── Left column: KPI cards only ── */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <KPICards />
          </div>

          {/* ── Right column: Metrics + [Calls+Phone | Recent Activity] ── */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-6">
            <MetricsGrid />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">

              {/* Left stack: Calls Transferred + AI Failures + Phone Numbers */}
              <div className="flex flex-col gap-5">

                {/* Calls Transferred — violet */}
                <div><CallTransfersSection /></div>

                {/* AI Agent Failures — rose */}
                <div><AIFailuresSection /></div>

                {/* Phone Numbers — amber */}
                <Card className="group relative overflow-hidden bg-white border border-amber-100 shadow-sm hover:shadow-md rounded-3xl transition-all duration-300">
                  <CardHeader className="relative pb-2 pt-4 px-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative w-9 h-9 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl flex items-center justify-center border border-amber-200/60">
                          <Phone className="h-4 w-4 text-amber-600" />
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-medium text-slate-800">Phone Numbers</CardTitle>
                          <p className="text-xs text-amber-500/80 mt-0.5">
                            {twilioNumbers.length} active {twilioNumbers.length === 1 ? 'number' : 'numbers'}
                          </p>
                        </div>
                      </div>
                      {twilioNumbers.length > 1 && (
                        <button
                          onClick={() => setPhoneModalOpen(true)}
                          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl px-3 py-1.5 transition-colors"
                        >
                          <span className="text-xs font-light text-amber-700">View all</span>
                          <ExternalLink className="h-3 w-3 text-amber-600" />
                        </button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="relative pt-0 px-5 pb-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="relative w-7 h-7">
                          <div className="absolute inset-0 border-2 border-amber-100 rounded-full" />
                          <div className="absolute inset-0 border-2 border-amber-500 rounded-full border-t-transparent animate-spin" />
                        </div>
                      </div>
                    ) : twilioNumbers.length === 0 ? (
                      <div className="flex items-center gap-3 py-3">
                        <Phone className="h-4 w-4 text-amber-300" />
                        <p className="text-sm text-slate-400 font-light">No numbers assigned yet</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setCurrentPhoneIdx(i => (i - 1 + twilioNumbers.length) % twilioNumbers.length)}
                            disabled={twilioNumbers.length <= 1}
                            className="w-8 h-8 shrink-0 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/60 flex items-center justify-center transition-colors disabled:opacity-30"
                          >
                            <ArrowLeft className="h-3.5 w-3.5 text-amber-600" />
                          </button>
                          <div className="flex-1 flex items-center justify-between bg-amber-50/60 rounded-xl px-4 py-2.5 border border-amber-200/50 min-w-0">
                            <p className="text-sm font-mono font-medium text-slate-800 tracking-wide truncate">
                              {twilioNumbers[currentPhoneIdx]}
                            </p>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              {twilioNumbers.length > 1 && (
                                <span className="text-[10px] text-amber-400">{currentPhoneIdx + 1}/{twilioNumbers.length}</span>
                              )}
                              <button
                                onClick={() => handleCopy(twilioNumbers[currentPhoneIdx], currentPhoneIdx)}
                                className="w-6 h-6 bg-white hover:bg-amber-50 rounded-lg border border-amber-200/50 flex items-center justify-center transition-colors"
                              >
                                {copiedIndex === currentPhoneIdx ? (
                                  <CheckCircle2 className="h-3 w-3 text-amber-600" />
                                ) : (
                                  <Copy className="h-3 w-3 text-amber-400 hover:text-amber-600" />
                                )}
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => setCurrentPhoneIdx(i => (i + 1) % twilioNumbers.length)}
                            disabled={twilioNumbers.length <= 1}
                            className="w-8 h-8 shrink-0 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/60 flex items-center justify-center transition-colors disabled:opacity-30"
                          >
                            <ArrowRight className="h-3.5 w-3.5 text-amber-600" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                          <div className="flex-1 h-px bg-gradient-to-r from-amber-200/60 to-transparent" />
                          <span className="text-[10px] font-light text-amber-400 tracking-wide">Active & ready</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Right: Recent Activity — indigo, full height */}
              <RecentActivitySection />
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}
