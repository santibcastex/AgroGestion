import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getCropById } from "@/queries/crops"
import { getAreaById } from "@/queries/areas"
import { MapClient } from "@/components/map/map-client"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import type { MapArea } from "@/components/map/farm-map"

export default async function AreaMapaPage({
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

  const mapArea: MapArea | null =
    area.geojson
      ? {
          id: area.id,
          name: area.name,
          color: area.color ?? "#22c55e",
          geojson: area.geojson as unknown as MapArea["geojson"],
          sizeHa: area.sizeHa,
        }
      : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mapa</h1>
        <p className="text-muted-foreground">
          Visualización de la parcela {area.name}
        </p>
      </div>

      {mapArea ? (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-md">
            <div className="h-[600px]">
              <MapClient areas={[mapArea]} />
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
                  Sin datos de geometría
                </h2>
                <p className="text-muted-foreground max-w-md">
                  Esta parcela no tiene datos GeoJSON para visualización en el mapa.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
