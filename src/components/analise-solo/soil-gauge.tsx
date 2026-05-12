"use client"

interface SoilGaugeProps {
  value: number | null
  label: string
  unit: string
  min: number
  max: number
  warningMin?: number
  warningMax?: number
}

export function SoilGauge({
  value,
  label,
  unit,
  min,
  max,
  warningMin,
  warningMax,
}: SoilGaugeProps) {
  // Define zone boundaries
  // The bar spans from rangeStart to rangeEnd
  // Zones: red | yellow | green | yellow | red
  const wMin = warningMin ?? min * 0.8
  const wMax = warningMax ?? max * 1.2

  // The full visual range extends beyond the warning zones
  const rangeStart = wMin * 0.7
  const rangeEnd = wMax * 1.3
  const totalRange = rangeEnd - rangeStart

  // Calculate percentages for each zone boundary
  const pctWarnMin = ((wMin - rangeStart) / totalRange) * 100
  const pctIdealMin = ((min - rangeStart) / totalRange) * 100
  const pctIdealMax = ((max - rangeStart) / totalRange) * 100
  const pctWarnMax = ((wMax - rangeStart) / totalRange) * 100

  // Calculate marker position
  const clampedValue =
    value !== null ? Math.max(rangeStart, Math.min(rangeEnd, value)) : null
  const markerPct =
    clampedValue !== null
      ? ((clampedValue - rangeStart) / totalRange) * 100
      : null

  // Determine value status for coloring
  function getStatus(val: number | null): "ideal" | "warning" | "critical" | "none" {
    if (val === null) return "none"
    if (val >= min && val <= max) return "ideal"
    if (val >= wMin && val <= wMax) return "warning"
    return "critical"
  }

  const status = getStatus(value)

  const statusColors = {
    ideal: "text-green-600 dark:text-green-400",
    warning: "text-yellow-600 dark:text-yellow-400",
    critical: "text-red-600 dark:text-red-400",
    none: "text-muted-foreground",
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={`text-lg font-bold ${statusColors[status]}`}>
            {value !== null ? value : "--"}
          </span>
          {unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>

      {/* Horizontal bar with zones */}
      <div className="relative h-3 w-full rounded-full overflow-hidden">
        {/* Background gradient zones */}
        <div
          className="absolute inset-0 flex"
          style={{ borderRadius: "9999px", overflow: "hidden" }}
        >
          {/* Red zone (low) */}
          <div
            className="h-full bg-red-400/60 dark:bg-red-500/40"
            style={{ width: `${pctWarnMin}%` }}
          />
          {/* Yellow zone (low warning) */}
          <div
            className="h-full bg-yellow-400/60 dark:bg-yellow-500/40"
            style={{ width: `${pctIdealMin - pctWarnMin}%` }}
          />
          {/* Green zone (ideal) */}
          <div
            className="h-full bg-green-400/60 dark:bg-green-500/40"
            style={{ width: `${pctIdealMax - pctIdealMin}%` }}
          />
          {/* Yellow zone (high warning) */}
          <div
            className="h-full bg-yellow-400/60 dark:bg-yellow-500/40"
            style={{ width: `${pctWarnMax - pctIdealMax}%` }}
          />
          {/* Red zone (high) */}
          <div
            className="h-full bg-red-400/60 dark:bg-red-500/40"
            style={{ width: `${100 - pctWarnMax}%` }}
          />
        </div>

        {/* Value marker */}
        {markerPct !== null && (
          <div
            className="absolute top-0 h-full w-1 -translate-x-1/2 rounded-full bg-foreground shadow-sm"
            style={{ left: `${markerPct}%` }}
          />
        )}
      </div>

      {/* Min/Max labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>
          Ideal: {min}
          {unit ? ` ${unit}` : ""}
        </span>

        <span>
          {max}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>
    </div>
  )
}
