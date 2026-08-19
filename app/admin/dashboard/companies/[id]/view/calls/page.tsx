"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricChart } from "@/components/metric-chart"
import { ChevronRight, ArrowRight } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// ---------------------------------
// Interfaces
// ---------------------------------
interface CallDaily {
  date: string
  calls: number
  total_duration_sec: number
}

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
  daily: CallDaily[]
}

// ---------------------------------
// MAIN COMPONENT
// ---------------------------------
export default function AdminCompanyCallStats() {
  const { id: companyId } = useParams()

  // Assigned numbers
  const [assignedNumbers, setAssignedNumbers] = useState<string[]>([])

  // Company-level summary
  const [totalCalls, setTotalCalls] = useState(0)
  const [totalCallTime, setTotalCallTime] = useState(0)
  const [averageCallTime, setAverageCallTime] = useState(0)
  const [byNumber, setByNumber] = useState<
    Record<string, { calls: number; totalTime: number; avgTime: number }>
  >({})

  // Loading states
  const [loading, setLoading] = useState(true)

  // KPI Modal (existing)
  const [open, setOpen] = useState(false)
  const [activeKpi, setActiveKpi] = useState<string | null>(null)

  // Chart states (from Code A)
  const [allDailyData, setAllDailyData] = useState<CallDaily[]>([])
  const [callsData, setCallsData] = useState<number[]>([])
  const [durationData, setDurationData] = useState<number[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [filterDays, setFilterDays] = useState<number>(7)

  const [openMetric, setOpenMetric] = useState<null | {
    title: string
    data: number[]
    dates: string[]
  }>(null)

  // ---------------------------------
  // FETCH ASSIGNED NUMBERS
  // ---------------------------------
  useEffect(() => {
    async function fetchCompanyNumbers() {
      try {
        const token = Cookies.get("adminToken")
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/companies/${companyId}/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${token || ""}`,
            },
          }
        )

        const data = await res.json()

        if (data?.twilio_phone_numbers) {
          setAssignedNumbers(data.twilio_phone_numbers)
        }
      } catch (err) {
        console.error("Error fetching company numbers", err)
      }
    }

    if (companyId) fetchCompanyNumbers()
  }, [companyId])

  // ---------------------------------
  // FETCH STATS + PROCESS SUMMARY + CHART DATA
  // ---------------------------------
  useEffect(() => {
    async function fetchCallStats() {
      try {
        setLoading(true)

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/messages/call_stats/?company_id=${companyId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("adminToken") || ""}`,
            },
          }
        )

        if (!res.ok) throw new Error("Failed to fetch call stats")

        const data: CallStatsResponse = await res.json()
        const summary = data.summary || {}

        // ----------------------------
        // PROCESS SUMMARY (unchanged)
        // ----------------------------
        const filteredSummary = Object.entries(summary).filter(([num]) =>
          assignedNumbers.includes(num)
        )

        let totalCallsSum = 0
        let totalDurationSum = 0
        const breakdown: Record<string, { calls: number; totalTime: number; avgTime: number }> = {}

        filteredSummary.forEach(([num, entry]) => {
          const calls = entry.total_calls
          const totalTime = entry.total_duration_sec
          const avgTime = entry.average_duration_sec

          totalCallsSum += calls
          totalDurationSum += totalTime

          breakdown[num] = { calls, totalTime, avgTime }
        })

        const avgOverall = totalCallsSum > 0 ? totalDurationSum / totalCallsSum : 0

        setTotalCalls(totalCallsSum)
        setTotalCallTime(totalDurationSum)
        setAverageCallTime(avgOverall)
        setByNumber(breakdown)

        // ----------------------------
        // PROCESS DAILY FOR CHARTS (Code A logic)
        // ----------------------------
        const sorted = data.daily.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setAllDailyData(sorted)
        applyFilter(sorted, filterDays)
      } catch (error) {
        console.error("Error fetching admin call stats:", error)
      } finally {
        setLoading(false)
      }
    }

    if (companyId && assignedNumbers.length) fetchCallStats()
  }, [companyId, assignedNumbers])

  // ---------------------------------
  // APPLY CHART FILTER
  // ---------------------------------
  useEffect(() => {
    if (allDailyData.length > 0) applyFilter(allDailyData, filterDays)
  }, [filterDays])

  function applyFilter(data: CallDaily[], days: number) {
    const filtered = data.slice(-days)
    const datesArr = filtered.map((d) => d.date)
    const callsArr = filtered.map((d) => d.calls)
    const durationArr = filtered.map((d) => Math.round(d.total_duration_sec / 60))

    setDates(datesArr)
    setCallsData(callsArr)
    setDurationData(durationArr)
  }

  function getReducedDatesLabels(allDates: string[]): string[] {
    if (allDates.length <= 10) return allDates
    const step = Math.ceil(allDates.length / 10)
    return allDates.map((d, i) => (i % step === 0 ? d : ""))
  }

  // ---------------------------------
  // FORMATTER
  // ---------------------------------
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
  }

  // ---------------------------------
  // KPI ITEMS (UNCHANGED)
  // ---------------------------------
  const kpis = [
    { key: "totalCalls", title: "Total Calls", subtitle: "Number of Calls" },
    { key: "totalTime", title: "Total Call Time", subtitle: "Length of Calls" },
    { key: "avgTime", title: "Average Call Time", subtitle: "Average Duration" },
  ]

  // ---------------------------------
  // LOADING UI
  // ---------------------------------
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-500">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin mb-3" />
        <p className="text-sm font-medium">Loading call stats...</p>
      </div>
    )
  }

  // ---------------------------------
  // METRIC CARDS (CODE A STYLE)
  // ---------------------------------
  const metricsData = [
    {
      title: "Calls",
      description: "The number of calls received per day.",
      data: callsData.length ? callsData : Array(7).fill(0),
      dates: getReducedDatesLabels(dates),
      clickable: true,
    },
    {
      title: "Call Duration",
      description: "Total duration of calls (in minutes) per day.",
      data: durationData.length ? durationData : Array(7).fill(0),
      dates: getReducedDatesLabels(dates),
      clickable: true,
    },
  ]

  // ---------------------------------
  // DETAILS MODAL
  // ---------------------------------
  const renderDetails = () => (
    <div className="space-y-4">
      <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200 shadow-sm">
        {activeKpi === "totalCalls" && (
          <p>Overall Total Calls: <b>{totalCalls}</b></p>
        )}
        {activeKpi === "totalTime" && (
          <p>Overall Total Call Time: <b>{formatDuration(totalCallTime)}</b></p>
        )}
        {activeKpi === "avgTime" && (
          <p>Overall Average Call Time: <b>{formatDuration(averageCallTime)}</b></p>
        )}
      </div>

      <h4 className="font-semibold text-slate-800">Breakdown by Number</h4>
      <div className="space-y-2">
        {Object.entries(byNumber).map(([num, stats]) => (
          <div key={num} className="flex justify-between p-2 rounded bg-white border shadow-sm">
            <span className="text-sm">{num}</span>
            {activeKpi === "totalCalls" && <span>{stats.calls} calls</span>}
            {activeKpi === "totalTime" && <span>{formatDuration(stats.totalTime)}</span>}
            {activeKpi === "avgTime" && <span>{formatDuration(stats.avgTime)}</span>}
          </div>
        ))}
      </div>
    </div>
  )

  // ---------------------------------
  // RENDER
  // ---------------------------------
  return (
    <>
      <div className="space-y-6">

        {/* Assigned Numbers */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
          <h3 className="text-sm font-semibold text-slate-800 mb-3">Assigned Numbers</h3>
          {assignedNumbers.length === 0 ? (
            <p className="text-xs text-red-500">No numbers assigned to this company.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedNumbers.map((num) => (
                <span key={num} className="px-3 py-1.5 text-xs bg-indigo-50 text-indigo-700 rounded-full border border-indigo-100 font-medium">
                  {num}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex justify-start mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600 font-medium">Filter by:</span>
            <Select value={filterDays.toString()} onValueChange={(v) => setFilterDays(Number(v))}>
              <SelectTrigger className="w-[150px] rounded-xl border-slate-200">
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="10">Last 10 Days</SelectItem>
                <SelectItem value="30">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {metricsData.map((metric, index) => (
            <div
              key={index}
              className={`bg-white rounded-2xl border border-slate-200/60 overflow-hidden transition-all duration-300 hover:shadow-lg ${
                metric.clickable ? "cursor-pointer" : ""
              }`}
              onClick={() => (metric.clickable ? setOpenMetric(metric) : null)}
            >
              <div className="p-5 pb-2">
                <h3 className="text-base font-semibold text-slate-800">
                  {metric.title}
                </h3>
              </div>
              <div className="px-5 pb-5 relative">
                <div className={`${filterDays > 10 ? "h-44" : "h-32"}`}>
                  <MetricChart data={metric.data} dates={metric.dates} />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-2">{metric.description}</p>
                <ArrowRight className="w-4 h-4 text-indigo-400 absolute bottom-4 right-4" />
              </div>
            </div>
          ))}
        </div>

        {/* KPI Section (unchanged) */}
        <h3 className="text-lg font-semibold text-slate-800 mt-8">Call KPIs</h3>
        <div className="space-y-3">
          {kpis.map((kpi) => (
            <div
              key={kpi.key}
              onClick={() => {
                setActiveKpi(kpi.key)
                setOpen(true)
              }}
              className="bg-white rounded-2xl border border-slate-200/60 hover:shadow-lg cursor-pointer transition-all duration-300 p-4 flex items-center space-x-4"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800">{kpi.title}</h4>
                <p className="text-xs text-slate-500">{kpi.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI MODAL (unchanged) */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-white shadow-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">
              {activeKpi === "totalCalls" && "Total Calls Details"}
              {activeKpi === "totalTime" && "Total Call Time Details"}
              {activeKpi === "avgTime" && "Average Call Time Details"}
            </DialogTitle>
            <DialogDescription>Insights broken down by number</DialogDescription>
          </DialogHeader>
          {renderDetails()}
        </DialogContent>
      </Dialog>

      {/* Chart Dialog (Code A) */}
      <Dialog open={!!openMetric} onOpenChange={() => setOpenMetric(null)}>
        <DialogContent className="max-w-3xl rounded-2xl border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">{openMetric?.title}</DialogTitle>
          </DialogHeader>
          <div className="h-96">
            {openMetric && (
              <MetricChart
                data={openMetric.data}
                dates={getReducedDatesLabels(openMetric.dates)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
