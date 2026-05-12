import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import {
  getSoilAnalysisById,
  getSoilAnalysisHistory,
} from "@/queries/soil-analysis"
import {
  formatDate,
  SUGARCANE_IDEAL_RANGES,
} from "@/lib/constants"
import { ArrowLeft, FlaskConical, MapPin, CalendarDays } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SoilParameterGrid } from "@/components/analise-solo/soil-parameter-grid"
import { SoilHistoryChart } from "@/components/analise-solo/soil-history-chart"
import { SoilComparisonChart } from "@/components/analise-solo/soil-comparison-chart"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AnaliseSoloDetailPage({ params }: PageProps) {
  const { id } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const analysis = await getSoilAnalysisById(farmId, id)
  if (!analysis) notFound()

  // Fetch historical data for the same area
  const { analyses: historyAnalyses } = analysis.areaId
    ? await getSoilAnalysisHistory(farmId, analysis.areaId)
    : { analyses: [] }

  // Build history data for key parameters
  const keyParams = [
    { key: "pH" as const, field: "pH" as const },
    { key: "baseSaturation" as const, field: "baseSaturation" as const },
    { key: "phosphorus" as const, field: "phosphorus" as const },
    { key: "potassium" as const, field: "potassium" as const },
  ]

  const historyCharts = keyParams.map((param) => {
    const range = SUGARCANE_IDEAL_RANGES[param.key]
    const data = historyAnalyses.map((a) => ({
      year: a.year,
      value: a[param.field] !== null ? Number(a[param.field]) : null,
    }))
    return {
      key: param.key,
      label: range.label,
      unit: range.unit,
      idealMin: range.min,
      idealMax: range.max,
      data,
    }
  })

  // Build comparison data for radar chart (only if multiple years)
  const comparisonAnalyses = historyAnalyses.map((a) => ({
    label: `${a.year}`,
    pH: a.pH !== null ? Number(a.pH) : undefined,
    phosphorus: a.phosphorus !== null ? Number(a.phosphorus) : undefined,
    potassium: a.potassium !== null ? Number(a.potassium) : undefined,
    calcium: a.calcium !== null ? Number(a.calcium) : undefined,
    magnesium: a.magnesium !== null ? Number(a.magnesium) : undefined,
    baseSaturation:
      a.baseSaturation !== null ? Number(a.baseSaturation) : undefined,
  }))

  const hasMultipleYears = comparisonAnalyses.length > 1

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/analise-solo">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Análisis de Suelo
          </h1>
          <p className="text-muted-foreground">
            Detalles del análisis y evolución de los parámetros
          </p>
        </div>
      </div>

      {/* Analysis metadata */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {analysis.area?.name ?? "--"}
            </div>
            {analysis.area?.sizeHa && (
              <p className="text-xs text-muted-foreground">
                {Number(analysis.area.sizeHa)} ha
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Fecha de Colecta
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {formatDate(analysis.sampleDate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Año: {analysis.year}
              {analysis.depth ? ` | Prof.: ${analysis.depth} cm` : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laboratorio</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {analysis.labName ?? "--"}
            </div>
            {analysis.labReportId && (
              <p className="text-xs text-muted-foreground">
                Informe: {analysis.labReportId}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parameter gauges grid */}
      <Card>
        <CardHeader>
          <CardTitle>Parámetros del Suelo</CardTitle>
          <CardDescription>
            Valores del análisis comparados con rangos ideales para caña de azúcar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SoilParameterGrid
            analysis={{
              pH: analysis.pH !== null ? Number(analysis.pH) : null,
              organicMatter:
                analysis.organicMatter !== null
                  ? Number(analysis.organicMatter)
                  : null,
              phosphorus:
                analysis.phosphorus !== null
                  ? Number(analysis.phosphorus)
                  : null,
              potassium:
                analysis.potassium !== null
                  ? Number(analysis.potassium)
                  : null,
              calcium:
                analysis.calcium !== null ? Number(analysis.calcium) : null,
              magnesium:
                analysis.magnesium !== null
                  ? Number(analysis.magnesium)
                  : null,
              aluminum:
                analysis.aluminum !== null ? Number(analysis.aluminum) : null,
              hPlusAl:
                analysis.hPlusAl !== null ? Number(analysis.hPlusAl) : null,
              sumOfBases:
                analysis.sumOfBases !== null
                  ? Number(analysis.sumOfBases)
                  : null,
              ctc: analysis.ctc !== null ? Number(analysis.ctc) : null,
              baseSaturation:
                analysis.baseSaturation !== null
                  ? Number(analysis.baseSaturation)
                  : null,
              aluminumSaturation:
                analysis.aluminumSaturation !== null
                  ? Number(analysis.aluminumSaturation)
                  : null,
              sulfur: analysis.sulfur !== null ? Number(analysis.sulfur) : null,
              boron: analysis.boron !== null ? Number(analysis.boron) : null,
              copper: analysis.copper !== null ? Number(analysis.copper) : null,
              iron: analysis.iron !== null ? Number(analysis.iron) : null,
              manganese:
                analysis.manganese !== null
                  ? Number(analysis.manganese)
                  : null,
              zinc: analysis.zinc !== null ? Number(analysis.zinc) : null,
            }}
          />
        </CardContent>
      </Card>

      {/* History charts for key parameters */}
      {historyAnalyses.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Evolución de los Parámetros</CardTitle>
            <CardDescription>
              Historial de los principales indicadores en el área{" "}
              {analysis.area?.name ?? ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {historyCharts.map((chart) => (
                <SoilHistoryChart
                  key={chart.key}
                  data={chart.data}
                  label={chart.label}
                  unit={chart.unit}
                  idealMin={chart.idealMin}
                  idealMax={chart.idealMax}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Radar comparison chart */}
      {hasMultipleYears && (
        <Card>
          <CardHeader>
            <CardTitle>Comparación entre Años</CardTitle>
            <CardDescription>
              Comparación radar de los parámetros normalizados por el rango ideal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SoilComparisonChart analyses={comparisonAnalyses} />
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {analysis.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {analysis.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
