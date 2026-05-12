import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getDashboardData } from "@/queries/dashboard"
import { formatCurrency, formatNumber, formatDate } from "@/lib/constants"
import Link from "next/link"
import {
  MapPin,
  Sprout,
  ClipboardList,
  DollarSign,
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  ChevronRight,
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

export default async function DashboardPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const data = await getDashboardData(membership.farmId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inicio</h1>
        <p className="text-muted-foreground mt-1">
          Vista general de la granja {membership.farm.name}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Áreas Totales</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.areasCount}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data.totalAreaHa)} hectáreas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cosechas Activas</CardTitle>
            <Sprout className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeCrops.length}</div>
            <p className="text-xs text-muted-foreground">
              {data.pendingActivities} actividades pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(Number(data.pendingReceivables.total))}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.pendingReceivables.count} transacciones pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Pagar</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(Number(data.pendingPayables.total))}
            </div>
            <p className="text-xs text-muted-foreground">
              {data.pendingPayables.count} transacciones pendientes
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Cosechas Activas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5" />
                Cosechas Activas
              </CardTitle>
              <CardDescription>Cosechas en curso</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/safras">
                Ver todas
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.activeCrops.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ninguna cosecha activa
              </p>
            ) : (
              <div className="space-y-3">
                {data.activeCrops.slice(0, 4).map((crop) => (
                  <Link
                    key={crop.id}
                    href={`/safras/${crop.id}`}
                    className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">{crop.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {crop.cropAreas.length} área(s) -{" "}
                        {formatNumber(
                          crop.cropAreas.reduce(
                            (sum, ca) => sum + (ca.area?.sizeHa ?? 0),
                            0
                          )
                        )}{" "}
                        ha
                      </p>
                    </div>
                    <Badge variant="outline">{crop.status}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actividades Recientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Actividades Recientes
              </CardTitle>
              <CardDescription>Últimas actividades registradas</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/atividades">
                Ver todas
                <ChevronRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {data.recentActivities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ninguna actividad registrada
              </p>
            ) : (
              <div className="space-y-3">
                {data.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              activity.activityType?.color ?? "#888",
                          }}
                        />
                        <p className="font-medium text-sm">
                          {activity.activityType?.name ?? "Actividad"}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {activity.activityAreas
                          .map((aa) => aa.area.name)
                          .join(", ") || "Sin área"}
                        {activity.startDate
                          ? ` - ${formatDate(activity.startDate)}`
                          : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        activity.status === "CONCLUIDO"
                          ? "secondary"
                          : activity.status === "EM_PROGRESSO"
                            ? "default"
                            : "outline"
                      }
                      className="text-xs"
                    >
                      {activity.status === "A_FAZER"
                        ? "Por Hacer"
                        : activity.status === "EM_PROGRESSO"
                          ? "En Progreso"
                          : "Concluido"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Acceso Rápido
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Button variant="outline" className="h-auto py-3" asChild>
              <Link href="/atividades/nova">
                <div className="flex flex-col items-center gap-1.5">
                  <ClipboardList className="h-5 w-5" />
                  <span className="text-xs">Nueva Actividad</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3" asChild>
              <Link href="/analise-solo/nova">
                <div className="flex flex-col items-center gap-1.5">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-xs">Análisis de Suelo</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3" asChild>
              <Link href="/financeiro/nova-transacao">
                <div className="flex flex-col items-center gap-1.5">
                  <DollarSign className="h-5 w-5" />
                  <span className="text-xs">Nueva Transacción</span>
                </div>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-3" asChild>
              <Link href="/colheita/nova">
                <div className="flex flex-col items-center gap-1.5">
                  <Sprout className="h-5 w-5" />
                  <span className="text-xs">Nueva Cosecha</span>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
