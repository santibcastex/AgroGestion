"use client"

import { useEffect, useState } from "react"
import { useFarm } from "@/providers/farm-provider"
import { formatDate } from "@/lib/constants"
import Link from "next/link"
import {
  Plus,
  ClipboardList,
  List,
  LayoutGrid,
  Columns3,
  Loader2,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

interface Activity {
  id: string
  code: string
  type: string
  subtype: string | null
  crop?: { name: string } | null
  startDate: string | null
  endDate: string | null
  areas?: { name: string }[]
  status: string
}

function getStatusLabel(status: string) {
  switch (status) {
    case "A_FAZER":
      return "Por Hacer"
    case "EM_PROGRESSO":
      return "En Progreso"
    case "CONCLUIDO":
      return "Concluido"
    default:
      return status
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "A_FAZER":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
    case "EM_PROGRESSO":
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
    case "CONCLUIDO":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    default:
      return ""
  }
}

export default function AtividadesPage() {
  const { activeFarm } = useFarm()
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!activeFarm) return

    async function fetchActivities() {
      try {
        const response = await fetch(`/api/activities?farmId=${activeFarm!.farmId}`)
        if (response.ok) {
          const data = await response.json()
          setActivities(data)
        }
      } catch (error) {
        console.error("Erro ao carregar atividades:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivities()
  }, [activeFarm])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">
            Gestione las actividades operacionales de su granja
          </p>
        </div>
        <Button asChild>
          <Link href="/atividades/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Actividad
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="lista">
        <TabsList>
          <TabsTrigger value="lista" className="gap-2">
            <List className="h-4 w-4" />
            Lista
          </TabsTrigger>
          <TabsTrigger value="tipos" className="gap-2">
            <LayoutGrid className="h-4 w-4" />
            Tipos
          </TabsTrigger>
          <TabsTrigger value="progresso" className="gap-2">
            <Columns3 className="h-4 w-4" />
            Progreso
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-4">
          {loading ? (
            <Card>
              <CardContent className="py-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[80px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-6 w-[90px] rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : activities.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-1">
                  Ninguna actividad registrada
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Comience registrando la primera actividad de su granja.
                </p>
                <Button asChild>
                  <Link href="/atividades/nova">
                    <Plus className="mr-2 h-4 w-4" />
                    Nueva Actividad
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Todas las Actividades</CardTitle>
                <CardDescription>
                  {activities.length}{" "}
                  {activities.length === 1
                    ? "actividad registrada"
                    : "actividades registradas"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Subtipo</TableHead>
                      <TableHead>Cosecha</TableHead>
                      <TableHead>Fecha Inicio</TableHead>
                      <TableHead>Fecha Fin</TableHead>
                      <TableHead>Áreas</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Link
                            href={`/atividades/${activity.id}`}
                            className="font-medium hover:underline font-mono text-sm"
                          >
                            {activity.code}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {activity.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {activity.subtype ?? "—"}
                        </TableCell>
                        <TableCell>
                          {activity.crop?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {activity.startDate
                            ? formatDate(new Date(activity.startDate))
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {activity.endDate
                            ? formatDate(new Date(activity.endDate))
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {activity.areas && activity.areas.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {activity.areas.map((area, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {area.name}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(activity.status)}>
                            {getStatusLabel(activity.status)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="tipos" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <LayoutGrid className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                Visualización por Tipos
              </h3>
              <p className="text-muted-foreground text-sm">
                Próximamente podrá visualizar las actividades agrupadas por tipo.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progresso" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Columns3 className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">
                Visualización Kanban
              </h3>
              <p className="text-muted-foreground text-sm">
                Próximamente podrá visualizar las actividades en columnas: Por Hacer
                | En Progreso | Concluido.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
