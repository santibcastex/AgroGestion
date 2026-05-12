import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getAreaById } from "@/queries/areas"
import { getNdviReadings } from "@/queries/ndvi"
import { formatNumber, formatDate } from "@/lib/constants"
import Link from "next/link"
import {
  MapPin,
  Sprout,
  ClipboardList,
  Satellite,
  ArrowLeft,
  Leaf,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { NdviChart } from "@/components/ndvi/ndvi-chart"
import { NdviSyncButton } from "@/components/ndvi/ndvi-sync-button"
import { MapClient } from "@/components/map/map-client"
import type { MapArea } from "@/components/map/farm-map"

export default async function AreaDetailPage({
  params,
}: {
  params: Promise<{ areaId: string }>
}) {
  const { areaId } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const area = await getAreaById(membership.farmId, areaId)
  if (!area) notFound()

  const ndviReadings = await getNdviReadings(areaId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/areas">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <MapPin className="h-6 w-6" style={{ color: area.color ?? "#22c55e" }} />
            {area.name}
          </h1>
          <p className="text-muted-foreground">
            {formatNumber(area.sizeHa)} ha
            {area.description ? ` · ${area.description}` : ""}
          </p>
        </div>
        <Badge variant={area.active ? "default" : "secondary"} className="ml-auto">
          {area.active ? "Activa" : "Inactiva"}
        </Badge>
      </div>

      {/* Mapa + KPIs side by side */}
      <div className={area.geojson ? "grid gap-4 lg:grid-cols-[1fr_280px]" : ""}>
        {/* Mapa */}
        {area.geojson && (
          <Card className="py-0 gap-0 overflow-hidden">
            <CardContent className="p-0 h-full">
              <div className="h-full min-h-[350px]">
                <MapClient
                  areas={[
                    {
                      id: area.id,
                      name: area.name,
                      color: area.color ?? "#22c55e",
                      geojson: area.geojson as unknown as MapArea["geojson"],
                      sizeHa: area.sizeHa,
                    },
                  ]}
                  ndviData={
                    ndviReadings.length > 0
                      ? [{ areaId: area.id, mean: ndviReadings[0].mean, date: formatDate(ndviReadings[0].date) }]
                      : undefined
                  }
                  showNdviImages
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPIs */}
        <div className={area.geojson ? "grid gap-3 grid-cols-1 content-start" : "grid gap-4 grid-cols-2 lg:grid-cols-4"}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamaño</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(area.sizeHa)}</div>
              <p className="text-xs text-muted-foreground">hectáreas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cosechas</CardTitle>
              <Sprout className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{area.cropAreas.length}</div>
              <p className="text-xs text-muted-foreground">vinculadas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actividades</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{area.activityAreas.length}</div>
              <p className="text-xs text-muted-foreground">registradas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">NDVI Medio</CardTitle>
              <Satellite className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {ndviReadings.length > 0 ? (
                <>
                  <div className="text-2xl font-bold">{ndviReadings[0].mean.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(ndviReadings[0].date)}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold text-muted-foreground">—</div>
                  <p className="text-xs text-muted-foreground">sin datos</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* NDVI Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Índice de Vegetación (NDVI)
            </CardTitle>
            <CardDescription>
              Datos del satélite Sentinel-2 — últimos 90 días
            </CardDescription>
          </div>
          {area.geojson ? (
            <NdviSyncButton areaId={area.id} />
          ) : (
            <p className="text-xs text-muted-foreground">Dibuje el área en el mapa para habilitar</p>
          )}
        </CardHeader>
        <CardContent>
          <NdviChart readings={ndviReadings} />

          {/* Tabela de leituras */}
          {ndviReadings.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-3">Historial de Lecturas</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Media</TableHead>
                    <TableHead className="text-right">Min</TableHead>
                    <TableHead className="text-right">Max</TableHead>
                    <TableHead className="text-right">Nubes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ndviReadings.slice(0, 15).map((reading) => (
                    <TableRow key={reading.id}>
                      <TableCell>{formatDate(reading.date)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">
                        {reading.mean.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {reading.min.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                        {reading.max.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {reading.cloudCoverage != null ? `${reading.cloudCoverage.toFixed(0)}%` : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safras vinculadas */}
      {area.cropAreas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5" />
              Cosechas Vinculadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {area.cropAreas.map((ca) => (
                <Link
                  key={ca.id}
                  href={`/safras/${ca.crop.id}`}
                  className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-medium">{ca.crop.name}</p>
                  </div>
                  <Badge variant="outline">{ca.crop.status}</Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
