"use client"


import { useState, useEffect, useMemo } from "react"
import Cookies from "js-cookie"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, TrendingUp, Activity, CheckCircle2, XCircle, AlertCircle, BarChart3, Check } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"


interface EventData {
  id: number
  event_type: string
  status: string
  status_code: number | null
  metadata: any
  company: number
  created_at: string
}


interface PieSegment {
  eventType: string
  status: string
  count: number
  percentage: number
  color: string
}


const STATUS_COLORS: Record<string, string> = {
  success: "#10b981",
  failure: "#ef4444",
  pending: "#f59e0b",
  error: "#dc2626",
}


const STATUS_DISPLAY: Record<string, string> = {
  error: "failure",
  success: "success",
};


const GRADIENT_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#10b981", "#06b6d4", "#f59e0b", "#84cc16",
  "#3b82f6", "#a855f7", "#14b8a6", "#eab308"
]


function PieChart({ segments }: { segments: PieSegment[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  
  // If only one segment, render a full circle
  if (segments.length === 1) {
    return (
      <div className="relative w-full max-w-md mx-auto">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <defs>
            <linearGradient id="gradient-single" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={segments[0].color} stopOpacity="1" />
              <stop offset="100%" stopColor={segments[0].color} stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <circle 
            cx="50" 
            cy="50" 
            r="40" 
            fill={segments[0].color}
            className="drop-shadow-2xl"
          />
          <circle cx="50" cy="50" r="15" fill="#f8fafc" className="drop-shadow-xl" />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-2xl border border-slate-200">
            <p className="text-slate-900 text-sm font-medium">{segments[0].eventType}</p>
            <p className="text-slate-600 text-xs">{segments[0].status}</p>
            <p className="text-slate-900 text-lg font-bold text-center mt-1">100%</p>
          </div>
        </div>
      </div>
    )
  }
  
  let currentAngle = 0
  const paths = segments.map((segment, index) => {
    const angle = (segment.percentage / 100) * 360
    const startAngle = currentAngle
    const endAngle = currentAngle + angle
    currentAngle = endAngle


    const startRad = (startAngle - 90) * (Math.PI / 180)
    const endRad = (endAngle - 90) * (Math.PI / 180)


    const x1 = 50 + 40 * Math.cos(startRad)
    const y1 = 50 + 40 * Math.sin(startRad)
    const x2 = 50 + 40 * Math.cos(endRad)
    const y2 = 50 + 40 * Math.sin(endRad)


    const largeArc = angle > 180 ? 1 : 0


    const scale = hoveredIndex === index ? 1.05 : 1
    const radius = hoveredIndex === index ? 42 : 40


    const path = `M 50 50 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`


    return (
      <g key={index} transform={`scale(${scale}) translate(${scale === 1.05 ? -2.5 : 0}, ${scale === 1.05 ? -2.5 : 0})`}>
        <path
          d={path}
          fill={segment.color}
          opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.4}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="cursor-pointer transition-all duration-300"
          style={{
            filter: hoveredIndex === index ? "drop-shadow(0 8px 16px rgba(0,0,0,0.3))" : "none"
          }}
        />
      </g>
    )
  })


  return (
    <div className="relative w-full max-w-md mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          {segments.map((segment, index) => (
            <linearGradient key={index} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={segment.color} stopOpacity="1" />
              <stop offset="100%" stopColor={segment.color} stopOpacity="0.7" />
            </linearGradient>
          ))}
        </defs>
        <circle cx="50" cy="50" r="20" fill="#f8fafc" opacity="0.95" />
        {paths}
        <circle cx="50" cy="50" r="15" fill="#f8fafc" className="drop-shadow-xl" />
      </svg>
      
      {hoveredIndex !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-sm px-6 py-3 rounded-2xl shadow-2xl border border-slate-200">
            <p className="text-slate-900 text-sm font-medium">{segments[hoveredIndex].eventType}</p>
            <p className="text-slate-600 text-xs">{segments[hoveredIndex].status}</p>
            <p className="text-slate-900 text-lg font-bold text-center mt-1">
              {segments[hoveredIndex].percentage.toFixed(1)}%
            </p>
          </div>
        </div>
      )}
    </div>
  )
}


export default function InsightsPage() {
  const { toast } = useToast()
  const [allEvents, setAllEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(false)
  const [tempSelectedEventTypes, setTempSelectedEventTypes] = useState<string[]>(["all"])
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>(["all"])
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)


  useEffect(() => {
    fetchEvents()
  }, [])


  const fetchEvents = async () => {
    try {
      setLoading(true)
      const url = "https://apii.pentagonai.co/api/reports/events/"


      const res = await fetch(url, {
        headers: {
          Authorization: `Token ${Cookies.get("Token") || ""}`,
          "Content-Type": "application/json",
        },
      })


      if (!res.ok) throw new Error("Failed to fetch events")
      const data = await res.json()
      setAllEvents(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Error fetching events:", error)
      toast({
        title: "Error",
        description: "Failed to load insights data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }


  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const eventTypeMatch = selectedEventTypes.includes("all") || selectedEventTypes.includes(event.event_type)
      const statusMatch = selectedStatus === "all" || event.status === selectedStatus
      return eventTypeMatch && statusMatch
    })
  }, [allEvents, selectedEventTypes, selectedStatus])


  const uniqueEventTypes = useMemo(() => {
    const types = new Set(allEvents.map(e => e.event_type))
    return Array.from(types)
  }, [allEvents])


  const uniqueStatuses = useMemo(() => {
    const statuses = new Set(allEvents.map(e => e.status))
    return ["all", ...Array.from(statuses)]
  }, [allEvents])


  const handleEventTypeToggle = (eventType: string) => {
    if (eventType === "all") {
      setTempSelectedEventTypes(["all"])
    } else {
      setTempSelectedEventTypes(prev => {
        const filtered = prev.filter(t => t !== "all")
        if (filtered.includes(eventType)) {
          const newSelection = filtered.filter(t => t !== eventType)
          return newSelection.length === 0 ? ["all"] : newSelection
        } else {
          return [...filtered, eventType]
        }
      })
    }
  }


  const handleApplyEventTypes = () => {
    setSelectedEventTypes(tempSelectedEventTypes)
    setIsPopoverOpen(false)
  }


  const getEventTypeDisplayText = () => {
    if (selectedEventTypes.includes("all")) {
      return "All Events"
    }
    if (selectedEventTypes.length === 1) {
      return selectedEventTypes[0]
    }
    return `${selectedEventTypes.length} events selected`
  }


  const pieSegments = useMemo(() => {
    const groupedData = new Map<string, number>()
    
    // When specific event types are selected (not "all")
    if (!selectedEventTypes.includes("all")) {
      if (selectedEventTypes.length === 1) {
        // Single event type selected - group by status only
        filteredEvents.forEach(event => {
          const key = event.status
          groupedData.set(key, (groupedData.get(key) || 0) + 1)
        })


        const total = filteredEvents.length
        const segments: PieSegment[] = []
        let colorIndex = 0


        groupedData.forEach((count, status) => {
          segments.push({
            eventType: selectedEventTypes[0],
            status,
            count,
            percentage: (count / total) * 100,
            color: GRADIENT_COLORS[colorIndex % GRADIENT_COLORS.length],
          })
          colorIndex++
        })


        return segments.sort((a, b) => b.count - a.count)
      } else {
        // Multiple event types selected - group by event type and status
        filteredEvents.forEach(event => {
          const key = `${event.event_type}|${event.status}`
          groupedData.set(key, (groupedData.get(key) || 0) + 1)
        })


        const total = filteredEvents.length
        const segments: PieSegment[] = []
        let colorIndex = 0


        groupedData.forEach((count, key) => {
          const [eventType, status] = key.split("|")
          segments.push({
            eventType,
            status,
            count,
            percentage: (count / total) * 100,
            color: GRADIENT_COLORS[colorIndex % GRADIENT_COLORS.length],
          })
          colorIndex++
        })


        return segments.sort((a, b) => b.count - a.count)
      }
    }
    
    // When "all" event types are selected - original behavior
    filteredEvents.forEach(event => {
      const key = `${event.event_type}|${event.status}`
      groupedData.set(key, (groupedData.get(key) || 0) + 1)
    })


    const total = filteredEvents.length
    const segments: PieSegment[] = []
    let colorIndex = 0


    groupedData.forEach((count, key) => {
      const [eventType, status] = key.split("|")
      segments.push({
        eventType,
        status,
        count,
        percentage: (count / total) * 100,
        color: GRADIENT_COLORS[colorIndex % GRADIENT_COLORS.length],
      })
      colorIndex++
    })


    return segments.sort((a, b) => b.count - a.count)
  }, [filteredEvents, selectedEventTypes])


  const statusStats = useMemo(() => {
    const stats = {
      success: 0,
      failure: 0,
      pending: 0,
      other: 0,
    }
    filteredEvents.forEach(event => {
      if (event.status === "success") stats.success++
      else if (event.status === "error") stats.failure++
      else if (event.status === "pending") stats.pending++
      else stats.other++
    })
    return stats
  }, [filteredEvents])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 border-4 border-slate-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-slate-900 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-600 font-light tracking-wide">Loading insights...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white border-b border-slate-200">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/50 via-transparent to-slate-50/50"></div>
        
        <div className="relative max-w-7xl mx-auto px-8 py-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-1 h-20 bg-gradient-to-b from-slate-900 via-slate-400 to-slate-200 rounded-full"></div>
            <div>
              <h1 className="text-5xl font-extralight tracking-tight text-slate-900 mb-2">
                Insights & Analytics
              </h1>
              <p className="text-lg text-slate-500 font-light tracking-wide">
                Real-time event monitoring and performance metrics
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-12">
            <div className="group bg-white border border-green-200 rounded-2xl p-6 hover:shadow-lg hover:border-green-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-500 group-hover:scale-110 transition-all duration-300">
                  <CheckCircle2 className="w-6 h-6 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <BarChart3 className="w-5 h-5 text-green-300" />
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{statusStats.success}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Success</p>
            </div>

            <div className="group bg-white border border-red-200 rounded-2xl p-6 hover:shadow-lg hover:border-red-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center group-hover:bg-red-500 group-hover:scale-110 transition-all duration-300">
                  <XCircle className="w-6 h-6 text-red-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <BarChart3 className="w-5 h-5 text-red-300" />
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{statusStats.failure}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Failure</p>
            </div>

            <div className="group bg-white border border-amber-200 rounded-2xl p-6 hover:shadow-lg hover:border-amber-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-500 group-hover:scale-110 transition-all duration-300">
                  <AlertCircle className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <BarChart3 className="w-5 h-5 text-amber-300" />
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{statusStats.pending}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Pending</p>
            </div>

            <div className="group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:border-slate-300 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center group-hover:bg-slate-900 group-hover:scale-110 transition-all duration-300">
                  <Activity className="w-6 h-6 text-slate-600 group-hover:text-white transition-colors duration-300" />
                </div>
                <BarChart3 className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-3xl font-light text-slate-900 mb-1">{filteredEvents.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-light">Total Events</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" />
              <h2 className="text-lg font-light text-slate-900">Filter Analytics</h2>
            </div>
            <p className="text-sm text-slate-500 font-light mt-1">
              Refine your insights by event type and status
            </p>
          </div>
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-light text-slate-700">Event Type</label>
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-between bg-white border-slate-200 text-slate-900 hover:bg-slate-50 rounded-xl font-light"
                    >
                      {getEventTypeDisplayText()}
                      <span className="ml-2">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 rounded-xl" align="start">
                    <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                      <div className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                        <Checkbox
                          id="event-all"
                          checked={tempSelectedEventTypes.includes("all")}
                          onCheckedChange={() => handleEventTypeToggle("all")}
                        />
                        <label
                          htmlFor="event-all"
                          className="text-sm font-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        >
                          All Events
                        </label>
                      </div>
                      {uniqueEventTypes.map(type => (
                        <div key={type} className="flex items-center space-x-2 p-2 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors">
                          <Checkbox
                            id={`event-${type}`}
                            checked={tempSelectedEventTypes.includes(type) && !tempSelectedEventTypes.includes("all")}
                            onCheckedChange={() => handleEventTypeToggle(type)}
                          />
                          <label
                            htmlFor={`event-${type}`}
                            className="text-sm font-light leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                          >
                            {type}
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="border-t p-3">
                      <button 
                        onClick={handleApplyEventTypes}
                        className="w-full px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all duration-200 text-sm font-light"
                      >
                        Apply
                      </button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-light text-slate-700">Status</label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="bg-white border-slate-200 text-slate-900 rounded-xl font-light">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-slate-200 rounded-xl">
                    {uniqueStatuses.map(status => (
                      <SelectItem key={status} value={status} className="text-slate-900 font-light">
                        {status === "all" ? "All Statuses" : (STATUS_DISPLAY[status] || status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="py-20">
              <p className="text-center text-slate-500 text-lg italic font-light">
                No events found matching your filters
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200">
                <h3 className="text-lg font-light text-slate-900 text-center">Event Distribution</h3>
                <p className="text-sm text-slate-500 font-light text-center mt-1">
                  {selectedEventTypes.includes("all") 
                    ? "Visual breakdown by event type and status"
                    : selectedEventTypes.length === 1
                    ? `Status breakdown for ${selectedEventTypes[0]}`
                    : "Visual breakdown by selected event types and status"
                  }
                </p>
              </div>
              <div className="py-8 px-6">
                <PieChart segments={pieSegments} />
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-white px-8 py-5 border-b border-slate-200">
                <h3 className="text-lg font-light text-slate-900">Legend</h3>
                <p className="text-sm text-slate-500 font-light mt-1">
                  Detailed segment breakdown
                </p>
              </div>
              <div className="p-6">
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {pieSegments.map((segment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: segment.color }}
                        />
                        <div>
                          <p className="text-slate-900 font-light text-sm">{segment.eventType}</p>
                          <p className="text-slate-600 text-xs font-light">{STATUS_DISPLAY[segment.status] || segment.status}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-slate-900 font-light text-lg">{segment.count}</p>
                        <p className="text-slate-600 text-xs font-light">{segment.percentage.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="mt-16 flex items-center justify-center gap-2">
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse"></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-1 h-1 bg-slate-300 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  )
}
