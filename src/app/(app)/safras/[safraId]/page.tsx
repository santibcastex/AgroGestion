import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getCropById } from "@/queries/crops"
import {
  formatDate,
  formatNumber,
  formatCurrency,
  CROP_STATUS_LABELS,
  PLANTING_TYPE_LABELS,
  CULTURE_LABELS,
  ACTIVITY_STATUS_LABELS,
} from "@/lib/constants"
import Link from "next/link"
import {
  MapPin,
  ClipboardList,
  Wheat,
  Calendar,
} from "lucide-react"

import { Button } from "@/components/ui/button"
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

function getStatusVariant(status: string) {
  switch (status) {
    case "EM_ANDAMENTO":
      return "default" as const
    case "FINALIZADA":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

export default async function SafraDetailPage({
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

  const totalAreaHa = crop.cropAreas.reduce(
    (sum, ca) => sum + (ca.area?.sizeHa ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">{crop.name}</h1>
          <Badge variant={getStatusVariant(crop.status)}>
            {CROP_STATUS_LABELS[crop.status] ?? crop.status}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          {CULTURE_LABELS[(crop as any).culture as string] ?? (crop as any).culture ?? ""}
          {crop.plantingType ? ` - ${PLANTING_TYPE_LABELS[crop.plantingType] ?? crop.plantingType}` : ""}
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Áreas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crop.cropAreas.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(totalAreaHa)} ha total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividades</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crop.activities.length}</div>
            <p className="text-xs text-muted-foreground">
              {crop.activities.filter((a) => a.status === "CONCLUIDO").length}{" "}
              concluidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cosechas</CardTitle>
            <Wheat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{crop.harvests.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(
                crop.harvests.reduce((s, h) => s + Number(h.totalTons), 0)
              )}{" "}
              toneladas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Período</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {crop.startDate ? formatDate(crop.startDate) : "—"}
            </div>
            <p className="text-xs text-muted-foreground">
              {crop.endDate ? `hasta ${formatDate(crop.endDate)}` : "En curso"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {crop.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Observaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {crop.notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Áreas Vinculadas
          </CardTitle>
          <CardDescription>
            Áreas de la granja vinculadas a esta cosecha
          </CardDescription>
        </CardHeader>
        <CardContent>
          {crop.cropAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ninguna área vinculada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Tamaño (ha)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crop.cropAreas.map((ca) => (
                  <TableRow key={ca.id}>
                    <TableCell>
                      <Link
                        href={`/safras/${safraId}/areas/${ca.area?.id}`}
                        className="font-medium hover:underline"
                      >
                        {ca.area?.name ?? "Área eliminada"}
                      </Link>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(ca.sizeHa ?? ca.area?.sizeHa ?? 0)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Activities */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Actividades
            </CardTitle>
            <CardDescription>Actividades de esta cosecha</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/atividades/nova">Nueva Actividad</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {crop.activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Ninguna actividad registrada
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Áreas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crop.activities.map((activity) => (
                  <TableRow key={activity.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              activity.activityType?.color ?? "#888",
                          }}
                        />
                        <span className="font-medium">
                          {activity.activityType?.name ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.activityAreas
                        .map((aa) => aa.area.name)
                        .join(", ") || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {activity.startDate
                        ? formatDate(activity.startDate)
                        : "—"}
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
                        {ACTIVITY_STATUS_LABELS[activity.status] ??
                          activity.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Harvests */}
      {crop.harvests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5" />
              Cosechas
            </CardTitle>
            <CardDescription>Registros de cosecha de esta cosecha</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Toneladas</TableHead>
                  <TableHead className="text-right">TCH</TableHead>
                  <TableHead className="text-right">ATR</TableHead>
                  <TableHead className="text-right">Valor de Venta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {crop.harvests.map((harvest) => (
                  <TableRow key={harvest.id}>
                    <TableCell>
                      {formatDate(harvest.harvestDate)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {harvest.area?.name ?? "—"}
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
                    <TableCell className="text-right text-muted-foreground">
                      {harvest.salePrice
                        ? formatCurrency(Number(harvest.salePrice))
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
