"use client"

import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
  AreaChart,
} from "recharts"

interface MetricChartProps {
  data: number[]
  dates?: string[]
}

export function MetricChart({ data, dates }: MetricChartProps) {
  const chartData = data.map((value, index) => ({
    name: dates?.[index] || `Day ${index + 1}`,
    value,
  }))

  const totalPoints = chartData.length
  const tickInterval =
    totalPoints <= 10 ? 0 : Math.ceil(totalPoints / 10)

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
          </linearGradient>
        </defs>
        
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" strokeOpacity={0.6} vertical={false} />

        <XAxis
          dataKey="name"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 400 }}
          angle={-20}
          textAnchor="end"
          interval={tickInterval}
          height={40}
          minTickGap={15}
        />

        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 400 }}
          tickFormatter={(val) =>
            val != null && typeof val === "number" && !Number.isNaN(val)
              ? val.toLocaleString()
              : ""
          }
        />

        <Tooltip
          contentStyle={{
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.08)',
            padding: '8px 12px',
          }}
          labelStyle={{ 
            color: '#0f172a', 
            fontWeight: 500, 
            marginBottom: '4px',
            fontSize: '11px' 
          }}
          itemStyle={{ 
            color: '#22c55e', 
            fontWeight: 500,
            fontSize: '12px'
          }}
          formatter={(val: number) => [
            val != null && typeof val === "number" && !Number.isNaN(val)
              ? val.toLocaleString()
              : "—",
            "",
          ]}
          cursor={{ stroke: '#22c55e', strokeWidth: 1, strokeOpacity: 0.3, strokeDasharray: '3 3' }}
        />

        <Area
          type="monotone"
          dataKey="value"
          stroke="#22c55e"
          strokeWidth={2.5}
          fill="url(#colorGradient)"
          dot={totalPoints <= 15 ? { 
            fill: '#22c55e', 
            r: 2.5, 
            strokeWidth: 0
          } : false}
          activeDot={{ 
            r: 4, 
            fill: '#22c55e',
            stroke: '#fff',
            strokeWidth: 2
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
