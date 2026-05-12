import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getSoilAnalyses } from "@/queries/soil-analysis"
import { getAreas } from "@/queries/areas"
import { formatDate, SUGARCANE_IDEAL_RANGES } from "@/lib/constants"
import {
  Plus,
  FlaskConical,
  CalendarDays,
  MapPin,
  Search,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type RangeConfig = {
  min: number
  max: number
  warningMin?: number
  warningMax?: number
}

function getValueColor(
  value: number | null | undefined,
  rangeKey: string
): string {
  if (value == null) return ""

  const range = (SUGARCANE_IDEAL_RANGES as Record<string, RangeConfig | undefined>)[rangeKey]
  if (!range) return ""

  const { min, max, warningMin, warningMax } = range

  const wMin = warningMin ?? min * 0.8
  const wMax = warningMax ?? max * 1.2

  if (value >= min && value <= max) {
    return "text-green-700 bg-green-50 font-semibold"
  }

  if (value >= wMin && value <= wMax) {
    return "text-yellow-700 bg-yellow-50 font-semibold"
  }

  return "text-red-700 bg-red-50 font-semibold"
}

function SoilValue({
  value,
  rangeKey,
  unit,
}: {
  value: number | null | undefined
  rangeKey: string
  unit?: string
}) {
  if (value == null) return <span className="text-muted-foreground">—</span>

  const colorClass = getValueColor(value, rangeKey)

  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-sm ${colorClass}`}>
      {value}
      {unit && <span className="ml-0.5 text-xs opacity-70">{unit}</span>}
    </span>
  )
}

export default async function AnaliseSoloPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const [analyses, areas] = await Promise.all([
    getSoilAnalyses(farmId),
    getAreas(farmId),
  ])

  const totalAnalyses = analyses.length
  const lastAnalysis = analyses.length > 0 ? analyses[0] : null
  const analyzedAreaIds = new Set(
    analyses.map((a) => a.areaId).filter(Boolean)
  )
  const analyzedAreasCount = analyzedAreaIds.size

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Análisis de Suelo
          </h1>
          <p className="text-muted-foreground">
            Realice seguimiento de la fertilidad del suelo y tome decisiones basadas en datos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/analise-solo/importar">
              <Upload className="mr-2 h-4 w-4" />
              Importar
            </Link>
          </Button>
          <Button asChild>
            <Link href="/analise-solo/nova">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Análisis
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Análisis
            </CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnalyses}</div>
            <p className="text-xs text-muted-foreground">
              análisis registrado(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Último Análisis
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {lastAnalysis?.sampleDate
                ? formatDate(lastAnalysis.sampleDate)
                : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {lastAnalysis?.area?.name ?? "sin área definida"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Áreas Analizadas
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyzedAreasCount}{" "}
              <span className="text-base font-normal text-muted-foreground">
                / {areas.length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              área(s) con análisis
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filtrar por área:</span>
        </div>
        {/* Client-side filter will be added later - for now show all areas as badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="cursor-pointer">
            Todas
          </Badge>
          {areas.map((area) => (
            <Badge
              key={area.id}
              variant="outline"
              className="cursor-pointer"
            >
              {area.name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-green-100 border border-green-300" />
          Ideal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-yellow-100 border border-yellow-300" />
          Atención
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-3 w-3 rounded bg-red-100 border border-red-300" />
          Fuera del ideal
        </span>
      </div>

      {analyses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FlaskConical className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ningún análisis registrado
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Registre el primer análisis de suelo para realizar seguimiento de la fertilidad
              de sus áreas.
            </p>
            <Button variant="outline" asChild>
              <Link href="/analise-solo/nova">Registrar Análisis</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Área</TableHead>
                    <TableHead>Año</TableHead>
                    <TableHead>Fecha de Colecta</TableHead>
                    <TableHead className="text-center">pH</TableHead>
                    <TableHead className="text-center">V%</TableHead>
                    <TableHead className="text-center">
                      P
                      <span className="text-xs font-normal ml-0.5">
                        (mg/dm³)
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      K
                      <span className="text-xs font-normal ml-0.5">
                        (mmol/dm³)
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      Ca
                      <span className="text-xs font-normal ml-0.5">
                        (mmol/dm³)
                      </span>
                    </TableHead>
                    <TableHead className="text-center">
                      Mg
                      <span className="text-xs font-normal ml-0.5">
                        (mmol/dm³)
                      </span>
                    </TableHead>
                    <TableHead>Profundidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyses.map((analysis) => (
                    <TableRow key={analysis.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/analise-solo/${analysis.id}`}
                          className="hover:underline text-primary font-medium"
                        >
                          {analysis.area?.name ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell>{analysis.year ?? "—"}</TableCell>
                      <TableCell>
                        {analysis.sampleDate
                          ? formatDate(analysis.sampleDate)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        <SoilValue
                          value={analysis.pH != null ? Number(analysis.pH) : null}
                          rangeKey="pH"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <SoilValue
                          value={analysis.baseSaturation != null ? Number(analysis.baseSaturation) : null}
                          rangeKey="basesSaturation"
                          unit="%"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <SoilValue
                          value={analysis.phosphorus != null ? Number(analysis.phosphorus) : null}
                          rangeKey="phosphorus"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <SoilValue
                          value={analysis.potassium != null ? Number(analysis.potassium) : null}
                          rangeKey="potassium"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <SoilValue
                          value={analysis.calcium != null ? Number(analysis.calcium) : null}
                          rangeKey="calcium"
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <SoilValue
                          value={analysis.magnesium != null ? Number(analysis.magnesium) : null}
                          rangeKey="magnesium"
                        />
                      </TableCell>
                      <TableCell>
                        {analysis.depth ?? "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
