import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getCropById } from "@/queries/crops"
import { getHarvestSummary } from "@/queries/harvests"
import { getAreasByCrop } from "@/queries/areas"
import { formatNumber, formatCurrency } from "@/lib/constants"
import {
  Wheat,
  TrendingUp,
  MapPin,
  BarChart3,
  DollarSign,
  Layers,
  Activity,
} from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function SafraIndicadoresPage({
  params,
}: {
  params: Promise<{ safraId: string }>
}) {
  const { safraId } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const crop = await getCropById(membership.farmId, safraId)
  if (!crop) notFound()

  const summary = await getHarvestSummary(membership.farmId, safraId)
  const areas = await getAreasByCrop(membership.farmId, safraId)

  const totalAreaHa = areas.reduce(
    (sum, a) => sum + (a.cropAreas[0]?.sizeHa ?? a.sizeHa),
    0
  )

  const totalRevenue = summary.harvests.reduce(
    (sum, h) => sum + (h.salePrice ?? 0),
    0
  )

  const revenuePerHa = totalAreaHa > 0 ? totalRevenue / totalAreaHa : 0

  // Per-area breakdown
  const areaBreakdown = areas.map((area) => {
    const areaHarvests = summary.harvests.filter((h) => h.area?.name === area.name)
    const areaTons = areaHarvests.reduce((sum, h) => sum + h.totalTons, 0)
    const areaHa = area.cropAreas[0]?.sizeHa ?? area.sizeHa
    const areaTch = areaHa > 0 ? areaTons / areaHa : 0
    const areaAtrValues = areaHarvests.filter((h) => h.atr)
    const areaAvgAtr =
      areaAtrValues.length > 0
        ? areaAtrValues.reduce((sum, h) => sum + (h.atr ?? 0), 0) / areaAtrValues.length
        : null
    const areaRevenue = areaHarvests.reduce((sum, h) => sum + (h.salePrice ?? 0), 0)

    return {
      id: area.id,
      name: area.name,
      sizeHa: areaHa,
      totalTons: areaTons,
      tch: areaTch,
      avgAtr: areaAvgAtr,
      revenue: areaRevenue,
      harvestCount: areaHarvests.length,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
        <p className="text-muted-foreground">
          Indicadores de desempeño de la cosecha {crop.name}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Producción Total</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.totalTons)}
            </div>
            <p className="text-xs text-muted-foreground">toneladas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área Total</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(totalAreaHa)}
            </div>
            <p className="text-xs text-muted-foreground">
              hectáreas en {areas.length} {areas.length === 1 ? "parcela" : "parcelas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">TCH Medio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatNumber(summary.avgTch)}
            </div>
            <p className="text-xs text-muted-foreground">ton/ha</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ATR Medio</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.avgAtr ? formatNumber(summary.avgAtr) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">kg/ton</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingreso Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalRevenue > 0 ? formatCurrency(totalRevenue) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.harvests.length}{" "}
              {summary.harvests.length === 1 ? "cosecha" : "cosechas"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingreso por Hectárea</CardTitle>
            <Layers className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {revenuePerHa > 0 ? formatCurrency(revenuePerHa) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">R$/ha</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-area breakdown */}
      {areaBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Desempeño por Parcela
            </CardTitle>
            <CardDescription>
              Comparativo de producción entre parcelas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcela</TableHead>
                  <TableHead className="text-right">Área (ha)</TableHead>
                  <TableHead className="text-right">Producción (ton)</TableHead>
                  <TableHead className="text-right">TCH</TableHead>
                  <TableHead className="text-right">ATR</TableHead>
                  <TableHead className="text-right">Ingreso</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areaBreakdown.map((ab) => (
                  <TableRow key={ab.id}>
                    <TableCell className="font-medium">{ab.name}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(ab.sizeHa)}
                    </TableCell>
                    <TableCell className="text-right">
                      {ab.totalTons > 0 ? formatNumber(ab.totalTons) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {ab.tch > 0 ? formatNumber(ab.tch) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {ab.avgAtr ? formatNumber(ab.avgAtr) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {ab.revenue > 0 ? formatCurrency(ab.revenue) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {summary.harvests.length === 0 && areas.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Sin datos para indicadores
            </h3>
            <p className="text-muted-foreground text-sm">
              Los indicadores se calcularán a partir de los registros de cosecha y las áreas vinculadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
