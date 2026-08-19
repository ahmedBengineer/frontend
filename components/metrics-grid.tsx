"use client"

import { useEffect, useState } from "react"
import Cookies from "js-cookie"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricChart } from "@/components/metric-chart"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Maximize2 } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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

interface TransferRecord {
  id: number
  created_at: string
  transfer_triggered_at: string | null
}

export function MetricsGrid() {
  const [allDailyData, setAllDailyData] = useState<CallDaily[]>([])
  const [callsData, setCallsData] = useState<number[]>([])
  const [durationData, setDurationData] = useState<number[]>([])
  const [transfersData, setTransfersData] = useState<number[]>([])
  const [transferRateData, setTransferRateData] = useState<number[]>([])
  const [allTransfers, setAllTransfers] = useState<TransferRecord[]>([])
  const [dates, setDates] = useState<string[]>([])
  const [filterDays, setFilterDays] = useState<number>(7)

  const [openMetric, setOpenMetric] = useState<null | {
    title: string
    data: number[]
    dates: string[]
  }>(null)

  useEffect(() => {
    async function fetchCallStats() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/conversations/messages/call_stats/`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )
        if (!res.ok) throw new Error("Failed to fetch call stats")

        const data: CallStatsResponse = await res.json()
        const daily = Array.isArray(data?.daily) ? data.daily : []
        const sorted = [...daily].sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )
        setAllDailyData(sorted)
        applyFilter(sorted, filterDays, allTransfers)
      } catch (err) {
        console.error("Error fetching call stats:", err)
      }
    }

    async function fetchTransfers() {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BASE_URL}/reports/voice-agent-transfer-webhooks/`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Token ${Cookies.get("Token") || ""}`,
            },
          }
        )
        const data = await res.json()
        if (Array.isArray(data)) setAllTransfers(data)
      } catch (err) {
        console.error("Error fetching transfers:", err)
      }
    }

    fetchCallStats()
    fetchTransfers()
  }, [])

  useEffect(() => {
    if (allDailyData.length > 0) applyFilter(allDailyData, filterDays, allTransfers)
  }, [filterDays, allTransfers])

  function applyFilter(data: CallDaily[], days: number, transfers: TransferRecord[]) {
    const filtered = data.slice(-days)
    const datesArr = filtered.map((d) => d.date)
    const callsArr = filtered.map((d) => d.calls)
    const durationArr = filtered.map((d) => Math.round(d.total_duration_sec / 60))

    // Aggregate transfers by date
    const transfersByDate: Record<string, number> = {}
    for (const t of transfers) {
      const d = new Date(t.created_at).toISOString().split("T")[0]
      transfersByDate[d] = (transfersByDate[d] || 0) + 1
    }

    const transfersArr = datesArr.map((d) => transfersByDate[d] || 0)
    const rateArr = datesArr.map((d, i) => {
      const calls = callsArr[i]
      const trans = transfersByDate[d] || 0
      return calls > 0 ? Math.round((trans / calls) * 100) : 0
    })

    setDates(datesArr)
    setCallsData(callsArr)
    setDurationData(durationArr)
    setTransfersData(transfersArr)
    setTransferRateData(rateArr)
  }

  function getReducedDatesLabels(allDates: string[]): string[] {
    if (allDates.length <= 10) return allDates
    const step = Math.ceil(allDates.length / 10)
    return allDates.map((d, i) => (i % step === 0 ? d : ""))
  }

  const metricsData = [
    {
      title: "Calls",
      description: "Number of calls received",
      data: callsData.length ? callsData : Array(7).fill(0),
      dates: getReducedDatesLabels(dates),
      clickable: true,
    },
    {
      title: "Call Duration",
      description: "Total call time (minutes)",
      data: durationData.length ? durationData : Array(7).fill(0),
      dates: getReducedDatesLabels(dates),
      clickable: true,
    },
    {
      title: "Transfers",
      description: "Calls transferred",
      data: transfersData.length ? transfersData : Array(7).fill(0),
      dates: getReducedDatesLabels(dates),
      clickable: true,
    },
    {
      title: "Transfer Duration",
      description: "Transfer time (minutes)",
      data: Array(7).fill(0),
      dates,
      clickable: false,
    },
    {
      title: "Transfer Time",
      description: "Time until transfer (seconds)",
      data: Array(7).fill(0),
      dates,
      clickable: false,
    },
    {
      title: "Transfer Rate",
      description: "Percentage transferred",
      data: transferRateData.length ? transferRateData : Array(7).fill(0),
      dates: getReducedDatesLabels(dates),
      clickable: true,
    },
  ]

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Period</span>
          <Select
            value={filterDays.toString()}
            onValueChange={(v) => setFilterDays(Number(v))}
          >
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="10">Last 10 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metricsData.map((metric, index) => (
          <Card
            key={index}
            className={`group relative bg-white/80 backdrop-blur-sm border border-slate-200/60 hover:border-slate-300/60 hover:shadow-md rounded-xl transition-all duration-200 ${
              metric.clickable ? "cursor-pointer" : ""
            }`}
            onClick={() => (metric.clickable ? setOpenMetric(metric) : null)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-800">
                  {metric.title}
                </CardTitle>
                {metric.clickable && (
                  <Maximize2 className="w-3.5 h-3.5 text-slate-300 group-hover:text-green-500 transition-colors" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-28 mb-3">
                <MetricChart data={metric.data} dates={metric.dates} />
              </div>
              <p className="text-xs text-slate-400">
                {metric.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={!!openMetric} onOpenChange={() => setOpenMetric(null)}>
        <DialogContent className="max-w-4xl rounded-2xl bg-white border border-slate-200/60">
          <DialogHeader>
            <DialogTitle className="text-lg font-medium text-slate-900">{openMetric?.title}</DialogTitle>
          </DialogHeader>
          <div className="h-80 mt-4">
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
