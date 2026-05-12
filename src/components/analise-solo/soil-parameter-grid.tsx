"use client"

import { SUGARCANE_IDEAL_RANGES } from "@/lib/constants"
import { SoilGauge } from "./soil-gauge"

export interface SoilAnalysisData {
  pH: number | null
  organicMatter: number | null
  phosphorus: number | null
  potassium: number | null
  calcium: number | null
  magnesium: number | null
  aluminum: number | null
  hPlusAl: number | null
  sumOfBases: number | null
  ctc: number | null
  baseSaturation: number | null
  aluminumSaturation: number | null
  sulfur: number | null
  boron: number | null
  copper: number | null
  iron: number | null
  manganese: number | null
  zinc: number | null
}

interface SoilParameterGridProps {
  analysis: SoilAnalysisData
}

type RangeKey = keyof typeof SUGARCANE_IDEAL_RANGES

interface ParameterConfig {
  key: RangeKey
  field: keyof SoilAnalysisData
}

const MACRONUTRIENT_PARAMS: ParameterConfig[] = [
  { key: "pH", field: "pH" },
  { key: "organicMatter", field: "organicMatter" },
  { key: "phosphorus", field: "phosphorus" },
  { key: "potassium", field: "potassium" },
  { key: "calcium", field: "calcium" },
  { key: "magnesium", field: "magnesium" },
]

const CALCULATED_PARAMS: ParameterConfig[] = [
  { key: "baseSaturation", field: "baseSaturation" },
  { key: "aluminumSaturation", field: "aluminumSaturation" },
]

const MICRONUTRIENT_PARAMS: ParameterConfig[] = [
  { key: "sulfur", field: "sulfur" },
  { key: "boron", field: "boron" },
  { key: "copper", field: "copper" },
  { key: "iron", field: "iron" },
  { key: "manganese", field: "manganese" },
  { key: "zinc", field: "zinc" },
]

function ParameterSection({
  title,
  params,
  analysis,
}: {
  title: string
  params: ParameterConfig[]
  analysis: SoilAnalysisData
}) {
  const hasData = params.some((p) => analysis[p.field] !== null)
  if (!hasData) return null

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {params.map((param) => {
          const value = analysis[param.field]
          if (value === null) return null

          const range = SUGARCANE_IDEAL_RANGES[param.key]
          return (
            <div
              key={param.key}
              className="rounded-lg border bg-card p-4"
            >
              <SoilGauge
                value={typeof value === "number" ? value : null}
                label={range.label}
                unit={range.unit}
                min={range.min}
                max={range.max}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function SoilParameterGrid({ analysis }: SoilParameterGridProps) {
  return (
    <div className="space-y-8">
      <ParameterSection
        title="Macronutrientes"
        params={MACRONUTRIENT_PARAMS}
        analysis={analysis}
      />
      <ParameterSection
        title="Valores Calculados"
        params={CALCULATED_PARAMS}
        analysis={analysis}
      />
      <ParameterSection
        title="Micronutrientes"
        params={MICRONUTRIENT_PARAMS}
        analysis={analysis}
      />

    </div>
  )
}
