"use client"

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

export interface RateBarDatum {
  label: string
  value: number
  total: number
}

interface RateBarChartProps {
  data: RateBarDatum[]
  color: string
  height?: number
}

export function RateBarChart({ data, color, height }: RateBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-xs font-light text-slate-400">
        No data in this range
      </div>
    )
  }

  const resolvedHeight = height ?? Math.max(200, data.length * 30 + 40)

  return (
    <div style={{ height: resolvedHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, left: 4, bottom: 0 }}
          barCategoryGap="22%"
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f1f5f9"
            strokeOpacity={0.7}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, 100]}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: "#94a3b8" }}
            tickFormatter={(val: number) => `${val}%`}
          />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            width={72}
            tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 400 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            contentStyle={{
              backgroundColor: "rgba(255, 255, 255, 0.98)",
              border: "1px solid #e2e8f0",
              borderRadius: "10px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.08)",
              padding: "8px 12px",
              fontSize: "12px",
            }}
            formatter={(val, _name, item) => [
              `${Number(val).toFixed(1)}%  ·  ${item?.payload?.total ?? 0} calls`,
              "",
            ]}
            labelStyle={{ color: "#0f172a", fontWeight: 500, marginBottom: "4px" }}
          />
          <Bar
            dataKey="value"
            fill={color}
            radius={[0, 6, 6, 0]}
            isAnimationActive={false}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
