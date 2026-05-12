"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts"

interface SoilHistoryChartProps {
  data: { year: number; value: number | null }[]
  label: string
  unit: string
  idealMin: number
  idealMax: number
}

export function SoilHistoryChart({
  data,
  label,
  unit,
  idealMin,
  idealMax,
}: SoilHistoryChartProps) {
  // Filter out null values for the chart but keep the year entries
  const chartData = data.map((d) => ({
    year: d.year,
    value: d.value ?? undefined,
  }))

  // Calculate Y axis domain with some padding
  const values = data
    .map((d) => d.value)
    .filter((v): v is number => v !== null)
  const allValues = [...values, idealMin, idealMax]
  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  const padding = (dataMax - dataMin) * 0.15 || 1
  const yMin = Math.max(0, Math.floor(dataMin - padding))
  const yMax = Math.ceil(dataMax + padding)

  if (values.length === 0) {
    return (
      <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
        Sin datos para {label}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium text-muted-foreground">
        {label} {unit ? `(${unit})` : ""}
      </h4>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            width={45}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid hsl(var(--border))",
              backgroundColor: "hsl(var(--popover))",
              color: "hsl(var(--popover-foreground))",
              fontSize: "12px",
            }}
            formatter={(val) => [
              `${val} ${unit}`,
              label,
            ]}
            labelFormatter={(year) => `Año: ${year}`}
          />
          {/* Ideal range reference lines */}
          <ReferenceLine
            y={idealMin}
            stroke="hsl(142, 71%, 45%)"
            strokeDasharray="6 3"
            label={{
              value: `Min: ${idealMin}`,
              position: "insideBottomLeft",
              fontSize: 10,
              fill: "hsl(142, 71%, 45%)",
            }}
          />
          <ReferenceLine
            y={idealMax}
            stroke="hsl(142, 71%, 45%)"
            strokeDasharray="6 3"
            label={{
              value: `Max: ${idealMax}`,
              position: "insideTopLeft",
              fontSize: 10,
              fill: "hsl(142, 71%, 45%)",
            }}
          />
          {/* Actual values line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(142, 71%, 45%)"
            strokeWidth={2}
            dot={{
              r: 4,
              fill: "hsl(142, 71%, 45%)",
              strokeWidth: 2,
              stroke: "hsl(var(--background))",
            }}
            activeDot={{
              r: 6,
              fill: "hsl(142, 71%, 45%)",
              strokeWidth: 2,
              stroke: "hsl(var(--background))",
            }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
