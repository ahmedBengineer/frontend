"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { RATE_SERIES, type RatePoint } from "@/lib/analytics-format"

interface RatesLineChartProps {
  data: RatePoint[]
  height?: number
}

export function RatesLineChart({ data, height = 280 }: RatesLineChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-xs font-light text-slate-400"
        style={{ height }}
      >
        No data in this range
      </div>
    )
  }

  const tickInterval =
    data.length <= 12 ? 0 : Math.ceil(data.length / 10)

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, left: -18, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            strokeOpacity={0.7}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            interval={tickInterval}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            minTickGap={12}
          />
          <YAxis
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(val: number) => `${val}%`}
            width={52}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
              padding: "8px 12px",
              fontSize: "12px",
            }}
            labelStyle={{
              color: "#0f172a",
              fontWeight: 500,
              marginBottom: "4px",
              fontSize: "11px",
            }}
            formatter={(val, name) => [
              `${Number(val).toFixed(1)}%`,
              String(name ?? ""),
            ]}
          />
          {RATE_SERIES.map((series) => (
            <Line
              key={series.key}
              type="monotone"
              dataKey={series.key}
              name={series.name}
              stroke={series.color}
              strokeWidth={2}
              dot={data.length <= 15 ? { r: 2.5, strokeWidth: 0 } : false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
