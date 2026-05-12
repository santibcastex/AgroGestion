import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getAreas } from "@/queries/areas"
import { getLatestNdviByFarm } from "@/queries/ndvi"
import { formatNumber } from "@/lib/constants"
import Link from "next/link"
import { Plus, MapPin, Leaf, Satellite } from "lucide-react"

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

export default async function AreasPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const areas = await getAreas(farmId)
  const ndviMap = await getLatestNdviByFarm(farmId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Áreas</h1>
          <p className="text-muted-foreground">
            Gestione las áreas de cultivo de su granja
          </p>
        </div>
        <Button asChild>
          <Link href="/areas/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Área
          </Link>
        </Button>
      </div>

      {areas.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ninguna área registrada
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comience registrando la primera área de su granja.
            </p>
            <Button asChild>
              <Link href="/areas/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Área
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todas las Áreas</CardTitle>
            <CardDescription>
              {areas.length} {areas.length === 1 ? "área registrada" : "áreas registradas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tamaño (ha)</TableHead>
                  <TableHead>NDVI</TableHead>
                  <TableHead>Cosechas Activas</TableHead>
                  <TableHead>Análisis</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell>
                      <Link
                        href={`/areas/${area.id}`}
                        className="font-medium hover:underline"
                      >
                        {area.name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {formatNumber(area.sizeHa)} ha
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const ndvi = ndviMap.get(area.id)
                        if (!ndvi) return <span className="text-muted-foreground text-xs">—</span>
                        const val = ndvi.mean
                        const color =
                          val < 0.2 ? "text-red-500" :
                          val < 0.4 ? "text-amber-500" :
                          val < 0.6 ? "text-lime-500" :
                          "text-green-500"
                        return (
                          <div className="flex items-center gap-1.5">
                            <Satellite className={`h-3.5 w-3.5 ${color}`} />
                            <span className={`font-mono tabular-nums text-sm font-medium ${color}`}>
                              {val.toFixed(2)}
                            </span>
                          </div>
                        )
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Leaf className="h-4 w-4 text-green-600" />
                        <span>{area.cropAreas.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {area._count.soilAnalyses}
                    </TableCell>
                    <TableCell>
                      <Badge variant={area.active ? "default" : "secondary"}>
                        {area.active ? "Activa" : "Inactiva"}
                      </Badge>
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
