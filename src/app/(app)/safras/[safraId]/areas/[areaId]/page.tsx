import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getCropById } from "@/queries/crops"
import { getAreaById } from "@/queries/areas"
import {
  formatNumber,
  formatDate,
  ACTIVITY_STATUS_LABELS,
} from "@/lib/constants"
import Link from "next/link"
import {
  MapPin,
  ClipboardList,
  Wheat,
  FlaskConical,
  Calendar,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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

export default async function AreaPainelPage({
  params,
}: {
  params: Promise<{ safraId: string; areaId: string }>
}) {
  const { safraId, areaId } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const crop = await getCropById(membership.farmId, safraId)
  if (!crop) notFound()

  const area = await getAreaById(membership.farmId, areaId)
  if (!area) notFound()

  // Filter activities for this crop
  const cropActivities = area.activityAreas
    .filter((aa) => aa.activity.cropId === safraId)
    .map((aa) => aa.activity)

  // Filter harvests for this crop
  const cropHarvests = area.harvests.filter((h) => h.cropId === safraId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{area.name}</h1>
        <p className="text-muted-foreground">
          Panel de control de la parcela en esta cosecha
        </p>
      </div>

      {/* Info cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Área</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(area.sizeHa)}</div>
            <p className="text-xs text-muted-foreground">hectáreas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cropActivities.length}</div>
            <p className="text-xs text-muted-foreground">
              {cropActivities.filter((a) => a.status === "CONCLUIDO").length} concluidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cosechas</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cropHarvests.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(cropHarvests.reduce((s, h) => s + Number(h.totalTons), 0))} ton
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Análisis de Suelo</CardTitle>
            <FlaskConical className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{area.soilAnalyses.length}</div>
            <p className="text-xs text-muted-foreground">
              {area.soilAnalyses[0]
                ? `Último: ${area.soilAnalyses[0].year}`
                : "Ninguno"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Activities */}
      {cropActivities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Actividades
            </CardTitle>
            <CardDescription>
              Actividades de esta parcela en la cosecha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cropActivities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: activity.activityType?.color ?? "#888",
                          }}
                        />
                        <span className="font-medium">
                          {activity.activityType?.name ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.startDate ? formatDate(activity.startDate) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          activity.status === "CONCLUIDO"
                            ? "secondary"
                            : activity.status === "EM_PROGRESSO"
                              ? "default"
                              : "outline"
                        }
                      >
                        {(ACTIVITY_STATUS_LABELS as Record<string, string>)[activity.status] ?? activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Harvests */}
      {cropHarvests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5" />
              Cosechas
            </CardTitle>
            <CardDescription>
              Registros de cosecha de esta parcela en la cosecha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Toneladas</TableHead>
                  <TableHead className="text-right">TCH</TableHead>
                  <TableHead className="text-right">ATR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cropHarvests.map((harvest) => (
                  <TableRow key={harvest.id}>
                    <TableCell>
                      {formatDate(harvest.harvestDate)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(Number(harvest.totalTons))}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {harvest.tch ? formatNumber(Number(harvest.tch)) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {harvest.atr ? formatNumber(Number(harvest.atr)) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state when no data */}
      {cropActivities.length === 0 && cropHarvests.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Sin registros en esta cosecha
            </h3>
            <p className="text-muted-foreground text-sm">
              Actividades y cosechas de esta parcela en esta cosecha aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
