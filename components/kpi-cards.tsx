"use client"
import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { Card, CardContent } from "@/components/ui/card"
import { Phone, Clock, TrendingUp, Users, Bot, ArrowUpRight, Activity } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

interface CallStatsResponse {
  summary: Record<
    string,
    {
      total_calls: number
      total_duration: string
      average_duration_sec: number
      total_duration_sec: number
    }
  >
  daily: {
    date: string
    calls: number
    total_duration_sec: number
  }[]
}

export function KPICards() {
  const [totalCalls, setTotalCalls] = useState(0)
  const [totalCallTime, setTotalCallTime] = useState(0)
  const [averageCallTime, setAverageCallTime] = useState(0)
  const [byNumber, setByNumber] = useState<
    Record<string, { calls: number; totalTime: number; avgTime: number }>
  >({})
  const [extraKpis, setExtraKpis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [activeKpi, setActiveKpi] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/reports/dashboard/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${Cookies.get("Token") || ""}`,
          },
        })
        if (!res.ok) throw new Error(`Failed to fetch KPIs: ${res.status}`)
        const data = await res.json()
        const apiKpis = [
          {
            title: "Total Users",
            subtitle: "Active Users",
            value: String(data.users_in_company ?? 0),
            icon: Users,
            color: "blue",
          },
          {
            title: "Agents",
            subtitle: "AI Agents",
            value: String(data.agents_count ?? 0),
            icon: Bot,
            color: "purple",
          },
        ]
        setExtraKpis(apiKpis)
      } catch (error) {
        console.error("Error fetching KPIs:", error)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    async function fetchCallStats() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/messages/call_stats/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )

        if (!res.ok) throw new Error("Failed to fetch call stats")

        const data: CallStatsResponse = await res.json()

        const summary = data.summary || {}
        let totalCallsSum = 0
        let totalDurationSum = 0
        const breakdown: Record<string, { calls: number; totalTime: number; avgTime: number }> = {}

        for (const number in summary) {
          const entry = summary[number]
          if (!entry || typeof entry !== "object") continue
          const calls = entry.total_calls
          const totalTime = entry.total_duration_sec
          const avgTime = entry.average_duration_sec

          totalCallsSum += calls
          totalDurationSum += totalTime

          breakdown[number] = { calls, totalTime, avgTime }
        }

        const avgOverall = totalCallsSum > 0 ? totalDurationSum / totalCallsSum : 0

        setTotalCalls(totalCallsSum)
        setTotalCallTime(totalDurationSum)
        setAverageCallTime(avgOverall)
        setByNumber(breakdown)
      } catch (error) {
        console.error("Error fetching call KPIs:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchCallStats()
  }, [])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  const kpis = [
    { 
      key: "totalCalls", 
      title: "Total Calls", 
      subtitle: "All time",
      icon: Phone,
      value: totalCalls.toLocaleString(),
      color: "teal"
    },
    { 
      key: "totalTime", 
      title: "Call Duration", 
      subtitle: "Total time",
      icon: Clock,
      value: formatDuration(totalCallTime),
      color: "teal"
    },
    { 
      key: "avgTime", 
      title: "Avg Duration", 
      subtitle: "Per call",
      icon: TrendingUp,
      value: formatDuration(averageCallTime),
      color: "teal"
    },
  ]

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-3">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 border-3 border-slate-100 rounded-full"></div>
          <div className="absolute inset-0 border-3 border-teal-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <p className="text-xs text-slate-500">Loading metrics...</p>
      </div>
    )
  }

  const getColorClasses = (color: string) => {
    if (color === "teal") {
      return {
        bg: "from-teal-100 to-cyan-100",
        bgCard: "from-white to-teal-50/20",
        border: "border-teal-200/60 group-hover:border-teal-300/70",
        icon: "text-teal-600",
        dot: "bg-teal-500"
      }
    }
    if (color === "purple") {
      return {
        bg: "from-purple-100 to-violet-100",
        bgCard: "from-white to-purple-50/20",
        border: "border-purple-200/60 group-hover:border-purple-300/70",
        icon: "text-purple-600",
        dot: "bg-purple-500"
      }
    }
    return {
      bg: "from-blue-100 to-sky-100",
      bgCard: "from-white to-blue-50/20",
      border: "border-blue-200/60 group-hover:border-blue-300/70",
      icon: "text-blue-600",
      dot: "bg-blue-500"
    }
  }

  const renderDetails = () => (
    <div className="space-y-4">
      <div className="relative p-6 rounded-2xl bg-gradient-to-br from-teal-50/50 to-cyan-50/50 border border-teal-200/60 overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl"></div>
        <div className="relative">
          <div className="text-xs text-teal-600 uppercase tracking-wider mb-2 font-medium">
            {activeKpi === "totalCalls" && "Overall Total"}
            {activeKpi === "totalTime" && "Overall Duration"}
            {activeKpi === "avgTime" && "Overall Average"}
          </div>
          <div className="text-4xl font-light text-slate-900">
            {activeKpi === "totalCalls" && totalCalls.toLocaleString()}
            {activeKpi === "totalTime" && formatDuration(totalCallTime)}
            {activeKpi === "avgTime" && formatDuration(averageCallTime)}
          </div>
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-teal-600" />
          Breakdown by Number
        </h4>
        <div className="space-y-2">
          {Object.entries(byNumber).map(([num, stats]) => (
            <div 
              key={num} 
              className="flex justify-between items-center p-3.5 rounded-xl bg-gradient-to-r from-white to-teal-50/30 border border-teal-200/50 hover:border-teal-300/60 hover:shadow-sm transition-all duration-200"
            >
              <span className="text-xs font-mono text-slate-600">{num}</span>
              <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1 rounded-lg">
                {activeKpi === "totalCalls" && `${stats.calls} calls`}
                {activeKpi === "totalTime" && formatDuration(stats.totalTime)}
                {activeKpi === "avgTime" && formatDuration(stats.avgTime)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <>
      <div className="space-y-3 sticky top-6">
        <div className="flex items-center justify-between px-1 mb-4">
          <h3 className="text-sm font-medium text-slate-700 uppercase tracking-wider">Overview</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse animation-delay-300"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse animation-delay-600"></div>
          </div>
        </div>

        <div className="space-y-3">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon
            const colors = getColorClasses(kpi.color)
            
            return (
              <Card
                key={kpi.key}
                onClick={() => { setActiveKpi(kpi.key); setOpen(true) }}
                className={`group relative bg-gradient-to-br ${colors.bgCard} backdrop-blur-sm border ${colors.border} hover:shadow-lg cursor-pointer transition-all duration-300 rounded-2xl animate-in fade-in slide-in-from-left-1`}
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:scale-110`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full animate-pulse`}></div>
                      <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-light text-slate-900 tracking-tight">{kpi.value}</div>
                    <div className="text-xs font-semibold text-slate-700">{kpi.title}</div>
                    <div className="text-xs text-slate-400">{kpi.subtitle}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}

          {extraKpis.map((kpi, index) => {
            const Icon = kpi.icon
            const colors = getColorClasses(kpi.color)
            
            return (
              <Card 
                key={index} 
                className={`group relative bg-gradient-to-br ${colors.bgCard} backdrop-blur-sm border ${colors.border} hover:shadow-lg transition-all duration-300 rounded-2xl animate-in fade-in slide-in-from-left-1`}
                style={{ animationDelay: `${(kpis.length + index) * 50}ms` }}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 bg-gradient-to-br ${colors.bg} rounded-xl flex items-center justify-center shadow-sm transition-all duration-200 group-hover:scale-110`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className={`w-1.5 h-1.5 ${colors.dot} rounded-full animate-pulse`}></div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-3xl font-light text-slate-900 tracking-tight">{kpi.value}</div>
                    <div className="text-xs font-semibold text-slate-700">{kpi.title}</div>
                    <div className="text-xs text-slate-400">{kpi.subtitle}</div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl rounded-3xl bg-white border border-teal-200/60 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-slate-900">
              {activeKpi === "totalCalls" && "Total Calls Details"}
              {activeKpi === "totalTime" && "Call Duration Details"}
              {activeKpi === "avgTime" && "Average Duration Details"}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Detailed breakdown by phone number
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">
            {renderDetails()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
