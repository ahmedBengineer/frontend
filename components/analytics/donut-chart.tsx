"use client"

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

import { donutTotal, type DonutPoint } from "@/lib/analytics-format"

interface DonutChartProps {
  data: DonutPoint[]
  centerValue?: string
  centerLabel?: string
  height?: number
}

export function DonutChart({
  data,
  centerValue,
  centerLabel,
  height = 200,
}: DonutChartProps) {
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

  const total = donutTotal(data)
  const value = centerValue ?? total.toLocaleString()

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="62%"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
              padding: "8px 12px",
              fontSize: "12px",
            }}
            formatter={(val, name) => [Number(val).toLocaleString(), String(name ?? "")]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span className="text-[11px] font-light text-slate-600">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="pointer-events-none absolute inset-x-0 top-[38%] flex flex-col items-center">
        <span className="text-xl font-light text-slate-900">{value}</span>
        {centerLabel ? (
          <span className="text-[9px] font-light uppercase tracking-[0.15em] text-slate-400">
            {centerLabel}
          </span>
        ) : null}
      </div>
    </div>
  )
}
