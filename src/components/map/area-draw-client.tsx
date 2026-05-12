"use client"

import dynamic from "next/dynamic"
import type { GeoJsonObject } from "geojson"

const AreaDrawMap = dynamic(
  () => import("./area-draw-map").then((mod) => mod.AreaDrawMap),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[600px] rounded-md border bg-muted/50">
        <p className="text-muted-foreground">Cargando mapa...</p>
      </div>
    ),
  }
)

interface AreaDrawClientProps {
  geojson: GeoJsonObject | null
  color: string
  onGeoJsonChange: (geojson: GeoJsonObject | null, areaHa: number) => void
}

export function AreaDrawClient(props: AreaDrawClientProps) {
  return <AreaDrawMap {...props} />
}
