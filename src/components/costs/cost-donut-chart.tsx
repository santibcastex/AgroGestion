"use client"

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { formatCurrency } from "@/lib/constants"

interface ChartCategory {
  label: string
  totalCost: number
  color: string
}

interface CostDonutChartProps {
  categories: ChartCategory[]
  totalCost: number
}

export function CostDonutChart({ categories, totalCost }: CostDonutChartProps) {
  const data = categories
    .filter((c) => c.totalCost > 0)
    .map((c) => ({
      name: c.label,
      value: c.totalCost,
      color: c.color,
    }))

  // If no data, show empty ring
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
        Sin datos de costo para mostrar
      </div>
    )
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-8">
      <div className="relative w-[280px] h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={75}
              outerRadius={130}
              dataKey="value"
              strokeWidth={2}
              stroke="hsl(var(--background))"
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-2xl font-bold">100%</span>
          <span className="text-xs text-muted-foreground">Total de costos</span>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.label} className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-sm min-w-[120px]">{cat.label}</span>
            <span className="text-sm font-medium tabular-nums">
              {formatCurrency(cat.totalCost)}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-3 pt-2 border-t">
          <div className="h-3 w-3 shrink-0" />
          <span className="text-sm font-semibold min-w-[120px]">Total</span>
          <span className="text-sm font-bold tabular-nums">
            {formatCurrency(totalCost)}
          </span>
        </div>
      </div>
    </div>
  )
}
