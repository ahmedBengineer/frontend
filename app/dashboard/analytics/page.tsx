"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import Cookies from "js-cookie"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import {
  ArrowLeftRight,
  Clock,
  CreditCard,
  Gauge,
  ListChecks,
  MessageSquare,
  Phone,
  ShieldAlert,
  Timer,
  Voicemail,
} from "lucide-react"

import { DonutChart } from "@/components/analytics/donut-chart"
import { RateBarChart, type RateBarDatum } from "@/components/analytics/rate-bar-chart"
import { RatesLineChart } from "@/components/analytics/rates-line-chart"
import {
  DONUT_PALETTES,
  INTERVAL_OPTIONS,
  buildStatsQuery,
  defaultDateRange,
  donutData,
  formatCost,
  formatCount,
  formatDuration,
  formatLatency,
  formatMinutes,
  formatPercent,
  toRatePoints,
  type AnalyticsInterval,
  type DonutRow,
} from "@/lib/analytics-format"

interface RateRow {
  date: string
  total_calls: number
  pickup_rate: number
  success_rate: number
  transfer_rate: number
  voicemail_rate: number
}

interface Summary {
  total_calls: number
  picked_up: number
  pickup_rate: number
  successful_calls: number
  success_rate: number
  transferred_calls: number
  transfer_rate: number
  voicemail_calls: number
  voicemail_rate: number
  average_duration_seconds: number
  average_latency_seconds: number
  total_billed_minutes: number
  total_billed_cost: number
  fraud_blocked_numbers: number
  fraud_warnings: number
}

interface AnalyticsOverview {
  range: { start: string; end: string; days: number; interval: AnalyticsInterval }
  summary: Summary
  rollups: {
    conversations: {
      summary: {
        total_conversations: number
        conversations_with_summary: number
        summary_rate: number
        avg_messages_per_conversation: number
      }
      resolution: {
        resolved: number
        unresolved: number
        unknown: number
        resolution_rate: number
        avg_confidence: number
      }
      sentiment: DonutRow[]
    }
    fraud: {
      warnings: number
      blocked_numbers: number
      unique_numbers_flagged: number
      warning_rate: number
      top_reasons: { reason: string; count: number }[]
    }
    billing: {
      total_minutes: number
      total_cost: number
      events: number
      telephony_minutes: number
      by_event_type: { event_type: string; minutes: number; cost: number; events: number }[]
    }
    transfers: {
      transferred_calls: number
      transfer_rate: number
      telephony_minutes: number
      webhook_events: number
      by_reason: { key: string; count: number }[]
    }
  }
  charts: {
    rates_over_time: RateRow[]
    monthly_rates: RateRow[]
    distributions: {
      disconnection_reasons: DonutRow[]
      sentiment: DonutRow[]
      direction: DonutRow[]
      resolution: DonutRow[]
    }
  }
}

function StatCard({
  title,
  icon,
  value,
  sub,
}: {
  title: string
  icon: ReactNode
  value: string
  sub?: string
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-light uppercase tracking-[0.18em] text-slate-400">
            {title}
          </p>
          <span className="text-slate-300">{icon}</span>
        </div>
        <p className="mt-3 text-2xl font-light tracking-tight text-slate-900">{value}</p>
        {sub ? (
          <p className="mt-1 text-[11px] font-light text-slate-500">{sub}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-light tracking-tight text-slate-900">
          {title}
        </CardTitle>
        {description ? (
          <CardDescription className="text-[11px] font-light text-slate-500">
            {description}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="pt-2">{children}</CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { toast } = useToast()

  const initial = useMemo(() => defaultDateRange(30), [])

  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [bucketInterval, setBucketInterval] = useState<AnalyticsInterval>("day")

  const [applied, setApplied] = useState({
    from: initial.from,
    to: initial.to,
    interval: "day" as AnalyticsInterval,
  })
  const [data, setData] = useState<AnalyticsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true)
      const companyId = new URLSearchParams(window.location.search).get("company_id") || ""
      const query = buildStatsQuery(applied)
      const companyParam = companyId ? `&company_id=${encodeURIComponent(companyId)}` : ""
      const url = `${process.env.NEXT_PUBLIC_BASE_URL}/reports/stats/overview/?${query}${companyParam}`

      const res = await fetch(url, {
        headers: {
          Authorization: `Token ${Cookies.get("Token") || ""}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      })
      if (!res.ok) throw new Error(`Request failed with ${res.status}`)
      setData((await res.json()) as AnalyticsOverview)
    } catch (error) {
      console.error("Error fetching call stats:", error)
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [applied, toast])

  useEffect(() => {
    fetchOverview()
  }, [fetchOverview])

  const apply = () => setApplied({ from, to, interval: bucketInterval })

  const rollups = data?.rollups
  const summary = data?.summary
  const charts = data?.charts
  const activeInterval = (data?.range?.interval ?? applied.interval) as AnalyticsInterval

  const kpis = summary
    ? [
        {
          title: "Pickup Rate",
          icon: <Phone size={16} />,
          value: formatPercent(summary.pickup_rate),
          sub: `${formatCount(summary.picked_up)} of ${formatCount(summary.total_calls)} calls`,
        },
        {
          title: "Success Rate",
          icon: <ListChecks size={16} />,
          value: formatPercent(summary.success_rate),
          sub: `${formatCount(summary.successful_calls)} resolved`,
        },
        {
          title: "Transfer Rate",
          icon: <ArrowLeftRight size={16} />,
          value: formatPercent(summary.transfer_rate),
          sub: `${formatCount(summary.transferred_calls)} transferred`,
        },
        {
          title: "Voicemail Rate",
          icon: <Voicemail size={16} />,
          value: formatPercent(summary.voicemail_rate),
          sub: `${formatCount(summary.voicemail_calls)} to voicemail`,
        },
        {
          title: "Avg Duration",
          icon: <Clock size={16} />,
          value: formatDuration(summary.average_duration_seconds),
          sub: "Picked-up calls",
        },
        {
          title: "Avg Latency",
          icon: <Timer size={16} />,
          value: formatLatency(summary.average_latency_seconds),
          sub: "Assistant response time",
        },
      ]
    : []

  const monthlyPickup: RateBarDatum[] = useMemo(
    () =>
      toRatePoints(charts?.monthly_rates, "month").map((point) => ({
        label: point.label,
        value: point.pickupRate,
        total: point.total,
      })),
    [charts],
  )

  const monthlyTransfer: RateBarDatum[] = useMemo(
    () =>
      toRatePoints(charts?.monthly_rates, "month").map((point) => ({
        label: point.label,
        value: point.transferRate,
        total: point.total,
      })),
    [charts],
  )

  const rateSeries = useMemo(
    () => toRatePoints(charts?.rates_over_time, activeInterval),
    [charts, activeInterval],
  )

  const donuts = [
    {
      title: "Call Success",
      description: "Resolved vs. unresolved outcomes",
      points: donutData(charts?.distributions?.resolution, DONUT_PALETTES.resolution),
      centerLabel: "resolved",
      centerValue: summary ? formatPercent(summary.success_rate, 0) : undefined,
    },
    {
      title: "Disconnection Reason",
      description: "Why calls ended",
      points: donutData(charts?.distributions?.disconnection_reasons, DONUT_PALETTES.disconnection),
      centerLabel: "calls",
      centerValue: summary ? formatCount(summary.total_calls) : undefined,
    },
    {
      title: "Sentiment",
      description: "Caller tone across the conversation",
      points: donutData(charts?.distributions?.sentiment, DONUT_PALETTES.sentiment),
      centerLabel: "calls",
      centerValue: summary ? formatCount(summary.total_calls) : undefined,
    },
    {
      title: "Direction",
      description: "Inbound vs. outbound traffic",
      points: donutData(charts?.distributions?.direction, DONUT_PALETTES.direction),
      centerLabel: "calls",
      centerValue: summary ? formatCount(summary.total_calls) : undefined,
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-light uppercase tracking-[0.2em] text-slate-400">
            Insights
          </p>
          <h1 className="text-2xl font-extralight tracking-tight text-slate-900">
            Call Analytics
          </h1>
          <p className="mt-1 text-xs font-light text-slate-500">
            Pickup, success, transfer and latency metrics across every AI call.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-light uppercase tracking-[0.15em] text-slate-400">
              From
            </label>
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-9 w-40 rounded-xl text-xs font-light"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-light uppercase tracking-[0.15em] text-slate-400">
              To
            </label>
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              className="h-9 w-40 rounded-xl text-xs font-light"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-light uppercase tracking-[0.15em] text-slate-400">
              Interval
            </label>
            <Select
              value={bucketInterval}
              onValueChange={(value) => setBucketInterval(value as AnalyticsInterval)}
            >
              <SelectTrigger className="h-9 w-32 rounded-xl text-xs font-light">
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {INTERVAL_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={apply}
            disabled={loading}
            className="h-9 rounded-xl bg-slate-900 px-4 text-xs font-light text-white hover:bg-slate-800"
          >
            Apply
          </Button>
        </div>
      </div>

      {!data && loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : null}

      {rollups && summary ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Conversations"
            icon={<MessageSquare size={16} />}
            value={formatCount(rollups.conversations.summary.total_conversations)}
            sub={`${formatCount(rollups.conversations.summary.conversations_with_summary)} with a summary`}
          />
          <StatCard
            title="Resolution Rate"
            icon={<Gauge size={16} />}
            value={formatPercent(rollups.conversations.resolution.resolution_rate)}
            sub={`${formatCount(rollups.conversations.resolution.resolved)} resolved · ${formatCount(
              rollups.conversations.resolution.unresolved,
            )} unresolved`}
          />
          <StatCard
            title="Fraud Signals"
            icon={<ShieldAlert size={16} />}
            value={formatCount(rollups.fraud.warnings)}
            sub={`${formatCount(rollups.fraud.blocked_numbers)} blocked numbers`}
          />
          <StatCard
            title="Total Time Billed"
            icon={<CreditCard size={16} />}
            value={formatMinutes(rollups.billing.total_minutes)}
            sub={`${formatCost(rollups.billing.total_cost)} across ${formatCount(
              rollups.billing.events,
            )} events`}
          />
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {kpis.map((kpi) => (
          <StatCard key={kpi.title} {...kpi} />
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {donuts.map((donut) => (
          <ChartCard
            key={donut.title}
            title={donut.title}
            description={donut.description}
          >
            <DonutChart
              data={donut.points}
              centerValue={donut.centerValue}
              centerLabel={donut.centerLabel}
            />
          </ChartCard>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Pickup Rate by Month"
          description="Share of calls answered by the AI agent"
        >
          <RateBarChart data={monthlyPickup} color="#0f766e" />
        </ChartCard>
        <ChartCard
          title="Transfer Rate by Month"
          description="Share of calls handed to a human agent"
        >
          <RateBarChart data={monthlyTransfer} color="#6366f1" />
        </ChartCard>
      </div>

      <ChartCard
        title="Rates Over Time"
        description={`Pickup, success, transfer and voicemail rates · ${
          INTERVAL_OPTIONS.find((option) => option.value === activeInterval)?.label ??
          "Daily"
        } buckets`}
      >
        <RatesLineChart data={rateSeries} />
      </ChartCard>

      {!data && !loading ? (
        <p className="text-center text-xs font-light text-slate-400">
          No analytics available for this range.
        </p>
      ) : null}
    </div>
  )
}
