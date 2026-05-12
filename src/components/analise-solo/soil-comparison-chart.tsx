"use client"

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { SUGARCANE_IDEAL_RANGES } from "@/lib/constants"

interface AnalysisEntry {
  label: string
  pH?: number | null
  phosphorus?: number | null
  potassium?: number | null
  calcium?: number | null
  magnesium?: number | null
  baseSaturation?: number | null
}

interface SoilComparisonChartProps {
  analyses: AnalysisEntry[]
}

const RADAR_PARAMS = [
  { key: "pH" as const, label: "pH" },
  { key: "phosphorus" as const, label: "P" },
  { key: "potassium" as const, label: "K" },
  { key: "calcium" as const, label: "Ca" },
  { key: "magnesium" as const, label: "Mg" },
  { key: "baseSaturation" as const, label: "V%" },
] as const

type RadarParamKey = (typeof RADAR_PARAMS)[number]["key"]

const CHART_COLORS = [
  "hsl(142, 71%, 45%)",
  "hsl(217, 91%, 60%)",
  "hsl(48, 96%, 53%)",
  "hsl(280, 65%, 60%)",
  "hsl(12, 76%, 61%)",
  "hsl(180, 65%, 45%)",
]

function normalizeToIdeal(key: RadarParamKey, value: number | null | undefined): number {
  if (value == null) return 0
  const range = SUGARCANE_IDEAL_RANGES[key]
  // Normalize to percentage: 100% = middle of ideal range
  const idealMid = (range.min + range.max) / 2
  return Math.round((value / idealMid) * 100)
}

export function SoilComparisonChart({ analyses }: SoilComparisonChartProps) {
  if (analyses.length === 0) {
    return (
      <div className="flex h-[350px] items-center justify-center text-sm text-muted-foreground">
        Sin datos para comparación
      </div>
    )
  }

  // Build radar data: one entry per parameter, with each analysis as a key
  const radarData = RADAR_PARAMS.map((param) => {
    const entry: Record<string, string | number> = {
      parameter: param.label,
    }

    analyses.forEach((analysis) => {
      const rawValue = analysis[param.key]
      entry[analysis.label] = normalizeToIdeal(param.key, rawValue)
    })

    return entry
  })

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid className="opacity-30" />
          <PolarAngleAxis
            dataKey="parameter"
            tick={{ fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 150]}
            tick={{ fontSize: 10 }}
            tickCount={4}
          />
          {analyses.map((analysis, index) => (
            <Radar
              key={analysis.label}
              name={analysis.label}
              dataKey={analysis.label}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
          />
        </RadarChart>
      </ResponsiveContainer>
      <p className="text-center text-xs text-muted-foreground">
        Valores normalizados en relación al ideal (100% = centro del rango ideal)
      </p>
    </div>
  )
}
