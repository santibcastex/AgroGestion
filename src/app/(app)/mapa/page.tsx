import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getAreas } from "@/queries/areas"
import { getLatestNdviByFarm } from "@/queries/ndvi"
import { MapClient } from "@/components/map/map-client"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { MapArea } from "@/components/map/farm-map"
import { formatDate } from "@/lib/constants"

export default async function MapaPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const [dbAreas, ndviMap] = await Promise.all([
    getAreas(membership.farmId),
    getLatestNdviByFarm(membership.farmId),
  ])

  const areas: MapArea[] = dbAreas
    .filter((a) => a.geojson !== null && a.geojson !== undefined)
    .map((a) => ({
      id: a.id,
      name: a.name,
      color: a.color ?? "#22c55e",
      geojson: a.geojson as unknown as MapArea["geojson"],
      sizeHa: a.sizeHa,
    }))

  const ndviData = Array.from(ndviMap.entries()).map(([areaId, data]) => ({
    areaId,
    mean: data.mean,
    date: formatDate(data.date),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa</h1>
        <p className="text-muted-foreground">
          Visualice sus áreas y parcelas en el mapa
        </p>
      </div>

      {areas.length > 0 ? (
        <Card className="py-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="h-[calc(100vh-16rem)]">
              <MapClient areas={areas} ndviData={ndviData} showNdviImages />
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="min-h-[600px]">
          <CardContent className="flex flex-col items-center justify-center h-[600px]">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="rounded-full bg-muted p-6">
                <MapPin className="h-12 w-12 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-semibold tracking-tight">
                  Ningún área con geometría
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Registre áreas con datos GeoJSON para visualizarlas en el mapa.
                  Puede importar archivos KML en la pantalla de registro de áreas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
