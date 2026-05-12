"use client"

import { useRef, useState } from "react"

interface NdviReading {
  date: Date | string
  mean: number
  min: number
  max: number
  cloudCoverage: number | null
}

interface NdviChartProps {
  readings: NdviReading[]
}

function ndviColor(value: number): string {
  if (value < 0.2) return "#ef4444"
  if (value < 0.4) return "#f59e0b"
  if (value < 0.6) return "#84cc16"
  return "#22c55e"
}

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: "UTC" }).format(
    new Date(date)
  )
}

function formatFullDate(date: Date | string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" }).format(
    new Date(date)
  )
}

export function NdviChart({ readings }: NdviChartProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<{
    screenX: number
    screenY: number
    reading: NdviReading
  } | null>(null)

  if (readings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        Sin datos NDVI disponibles. Haga clic en &quot;Actualizar NDVI&quot; para obtener datos del satélite.
      </div>
    )
  }

  // Ordenar por data (mais antigo primeiro)
  const sorted = [...readings].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const latest = sorted[sorted.length - 1]

  // SVG chart dimensions
  const width = 600
  const height = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  // Scale
  const dates = sorted.map((r) => new Date(r.date).getTime())
  const minDate = Math.min(...dates)
  const maxDate = Math.max(...dates)
  const dateRange = maxDate - minDate || 1

  const minNdvi = -0.1
  const maxNdvi = 1.0
  const ndviRange = maxNdvi - minNdvi

  const x = (d: number) => padding.left + ((d - minDate) / dateRange) * chartW
  const y = (v: number) => padding.top + chartH - ((v - minNdvi) / ndviRange) * chartH

  // Build paths
  const meanLine = sorted
    .map((r, i) => `${i === 0 ? "M" : "L"} ${x(new Date(r.date).getTime())} ${y(r.mean)}`)
    .join(" ")

  // Min/Max area
  const areaTop = sorted
    .map((r, i) => `${i === 0 ? "M" : "L"} ${x(new Date(r.date).getTime())} ${y(r.max)}`)
    .join(" ")
  const areaBottom = [...sorted]
    .reverse()
    .map((r) => `L ${x(new Date(r.date).getTime())} ${y(r.min)}`)
    .join(" ")
  const areaPath = `${areaTop} ${areaBottom} Z`

  // Y-axis ticks
  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0]

  // X-axis: show ~5 evenly spaced labels
  const xLabelCount = Math.min(5, sorted.length)
  const xLabels: { date: Date; pos: number }[] = []
  for (let i = 0; i < xLabelCount; i++) {
    const idx = Math.round((i / (xLabelCount - 1 || 1)) * (sorted.length - 1))
    const d = new Date(sorted[idx].date)
    xLabels.push({ date: d, pos: x(d.getTime()) })
  }

  return (
    <div className="space-y-4">
      {/* Indicador do NDVI mais recente */}
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ backgroundColor: ndviColor(latest.mean) }}
        >
          {latest.mean.toFixed(2)}
        </div>
        <div>
          <p className="text-sm font-medium">NDVI Medio Actual</p>
          <p className="text-xs text-muted-foreground">
            {formatDate(latest.date)} &middot; Min {latest.min.toFixed(2)} / Max {latest.max.toFixed(2)}
          </p>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="w-full">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[600px]"
          preserveAspectRatio="xMidYMid meet"
          onMouseLeave={() => setTooltip(null)}
        >
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y(tick)}
                y2={y(tick)}
                stroke="currentColor"
                strokeOpacity={0.1}
              />
              <text
                x={padding.left - 6}
                y={y(tick)}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground"
                fontSize={10}
              >
                {tick.toFixed(1)}
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {xLabels.map(({ date: d, pos }, i) => (
            <text
              key={i}
              x={pos}
              y={height - 5}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={10}
            >
              {formatDate(d)}
            </text>
          ))}

          {/* Min/Max band */}
          <path d={areaPath} fill="currentColor" fillOpacity={0.05} />

          {/* Mean line */}
          <path d={meanLine} fill="none" stroke="currentColor" strokeOpacity={0.6} strokeWidth={2} />

          {/* Data points */}
          {sorted.map((r, i) => {
            const cx = x(new Date(r.date).getTime())
            const cy = y(r.mean)
            return (
              <circle
                key={i}
                cx={cx}
                cy={cy}
                r={4}
                fill={ndviColor(r.mean)}
                stroke="currentColor"
                strokeOpacity={0.2}
                strokeWidth={1}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGCircleElement).getBoundingClientRect()
                  setTooltip({
                    screenX: rect.left + rect.width / 2,
                    screenY: rect.top,
                    reading: r,
                  })
                }}
                onMouseLeave={() => setTooltip(null)}
              />
            )
          })}
        </svg>
      </div>

      {/* Tooltip (fixed to viewport so it's never clipped) */}
      {tooltip && (
        <div
          className="fixed pointer-events-none z-50 bg-popover text-popover-foreground border rounded-lg shadow-lg px-3 py-2 text-xs"
          style={{
            left: tooltip.screenX,
            top: tooltip.screenY,
            transform: `translate(-50%, calc(-100% - 8px))`,
          }}
        >
          <p className="font-semibold">{formatFullDate(tooltip.reading.date)}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <div
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: ndviColor(tooltip.reading.mean) }}
            />
            <span className="font-mono font-bold">{tooltip.reading.mean.toFixed(3)}</span>
          </div>
          <p className="text-muted-foreground mt-0.5">
            Min {tooltip.reading.min.toFixed(3)} / Max {tooltip.reading.max.toFixed(3)}
          </p>
        </div>
      )}

      {/* Legenda */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
          &lt;0.2 Suelo expuesto
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
          0.2–0.4 Baja
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-lime-500" />
          0.4–0.6 Moderada
        </div>
        <div className="flex items-center gap-1">
          <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
          &gt;0.6 Saludable
        </div>
      </div>
    </div>
  )
}
