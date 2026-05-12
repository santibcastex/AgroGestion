"use client"

import { useMemo, useState, useEffect, useRef, useCallback } from "react"
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  ImageOverlay,
  LayersControl,
  useMap,
  useMapEvents,
} from "react-leaflet"
import L from "leaflet"
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet"
import type { GeoJsonObject } from "geojson"
import "leaflet/dist/leaflet.css"

export interface NdviData {
  areaId: string
  mean: number
  date: string
}

export interface MapArea {
  id: string
  name: string
  color: string
  geojson: GeoJsonObject
  sizeHa: number
}

interface FarmMapProps {
  areas: MapArea[]
  ndviData?: NdviData[]
  showNdviImages?: boolean
}

function ndviToColor(value: number): string {
  if (value < 0.2) return "#ef4444"
  if (value < 0.3) return "#f97316"
  if (value < 0.4) return "#f59e0b"
  if (value < 0.5) return "#eab308"
  if (value < 0.6) return "#84cc16"
  if (value < 0.7) return "#22c55e"
  return "#16a34a"
}

function ndviLabel(value: number): string {
  if (value < 0.2) return "Solo exposto"
  if (value < 0.4) return "Vegetacao baixa"
  if (value < 0.6) return "Vegetacao moderada"
  return "Vegetacao saudavel"
}

const BRAZIL_CENTER: LatLngExpression = [-15.78, -47.93]
const DEFAULT_ZOOM = 5

function computeBoundsAndCenter(areas: MapArea[]): {
  center: LatLngExpression
  zoom: number
  bounds: LatLngBoundsExpression | null
} {
  const coords: [number, number][] = []

  for (const area of areas) {
    extractCoords(area.geojson, coords)
  }

  if (coords.length === 0) {
    return { center: BRAZIL_CENTER, zoom: DEFAULT_ZOOM, bounds: null }
  }

  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity
  for (const [lat, lng] of coords) {
    if (lat < minLat) minLat = lat
    if (lat > maxLat) maxLat = lat
    if (lng < minLng) minLng = lng
    if (lng > maxLng) maxLng = lng
  }

  const sumLat = coords.reduce((s, c) => s + c[0], 0)
  const sumLng = coords.reduce((s, c) => s + c[1], 0)

  return {
    center: [sumLat / coords.length, sumLng / coords.length],
    zoom: 14,
    bounds: [[minLat, minLng], [maxLat, maxLng]],
  }
}

// Auto-fit map to bounds on mount
function FitBounds({ bounds }: { bounds: LatLngBoundsExpression | null }) {
  const map = useMap()
  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [30, 30] })
    }
  }, [map, bounds])
  return null
}

function extractCoords(
  geojson: unknown,
  out: [number, number][]
): void {
  if (!geojson || typeof geojson !== "object") return

  const obj = geojson as Record<string, unknown>

  if (obj.type === "FeatureCollection" && Array.isArray(obj.features)) {
    for (const feature of obj.features) {
      extractCoords(feature, out)
    }
    return
  }

  if (obj.type === "Feature" && obj.geometry) {
    extractCoords(obj.geometry, out)
    return
  }

  if (Array.isArray(obj.coordinates)) {
    flattenCoords(obj.coordinates as unknown[], out)
  }
}

function flattenCoords(
  arr: unknown[],
  out: [number, number][]
): void {
  if (arr.length >= 2 && typeof arr[0] === "number" && typeof arr[1] === "number") {
    // GeoJSON is [lng, lat], Leaflet expects [lat, lng]
    out.push([arr[1] as number, arr[0] as number])
    return
  }
  for (const item of arr) {
    if (Array.isArray(item)) {
      flattenCoords(item, out)
    }
  }
}

// Reverse-map pixel RGB to NDVI value based on the evalscript color ramp
// Color ramp (RGBA 0-1): ndvi < 0 → [0.5,0,0], <0.1 → [0.7,0.1,0.1], <0.2 → [0.9,0.2,0.1],
// <0.3 → [0.95,0.45,0.1], <0.4 → [0.95,0.7,0.1], <0.5 → [0.85,0.85,0.1],
// <0.6 → [0.55,0.8,0.15], <0.7 → [0.3,0.7,0.15], <0.8 → [0.15,0.55,0.1], >=0.8 → [0.05,0.4,0.05]
const COLOR_RAMP: [number, number, number, number][] = [
  [128, 0,   0,   0.0],   // ndvi ~0.0   → [0.5, 0.0, 0.0]
  [179, 26,  26,  0.1],   // ndvi ~0.1   → [0.7, 0.1, 0.1]
  [230, 51,  26,  0.2],   // ndvi ~0.2   → [0.9, 0.2, 0.1]
  [242, 115, 26,  0.3],   // ndvi ~0.3   → [0.95, 0.45, 0.1]
  [242, 179, 26,  0.4],   // ndvi ~0.4   → [0.95, 0.7, 0.1]
  [217, 217, 26,  0.5],   // ndvi ~0.5   → [0.85, 0.85, 0.1]
  [140, 204, 38,  0.6],   // ndvi ~0.6   → [0.55, 0.8, 0.15]
  [77,  179, 38,  0.7],   // ndvi ~0.7   → [0.3, 0.7, 0.15]
  [38,  140, 26,  0.8],   // ndvi ~0.8   → [0.15, 0.55, 0.1]
  [13,  102, 13,  0.9],   // ndvi ~0.9   → [0.05, 0.4, 0.05]
]

function rgbToNdvi(r: number, g: number, b: number, a: number): number | null {
  // Transparent pixel = no data
  if (a < 50) return null

  let bestDist = Infinity
  let bestNdvi = 0
  for (const [cr, cg, cb, ndvi] of COLOR_RAMP) {
    const dist = (r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2
    if (dist < bestDist) {
      bestDist = dist
      bestNdvi = ndvi
    }
  }
  return bestNdvi
}

interface NdviOverlayData {
  canvas: HTMLCanvasElement
  bounds: L.LatLngBounds
  width: number
  height: number
}

// Shared registry so the tooltip component can read pixel data from loaded overlays
const ndviOverlayRegistry = new Map<string, NdviOverlayData>()

// Component to load and display NDVI image overlay for an area
function NdviImageOverlay({ areaId, selectedDate, imageMode = "ndvi" }: { areaId: string; selectedDate?: string; imageMode?: ImageMode }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [bounds, setBounds] = useState<LatLngBoundsExpression | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    // Revoke previous object URL
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setBounds(null)
    setLoading(true)
    ndviOverlayRegistry.delete(areaId)

    async function load() {
      try {
        const params = new URLSearchParams()
        if (selectedDate) params.set("date", selectedDate)
        if (imageMode !== "ndvi") params.set("mode", imageMode)
        const qs = params.toString()
        const url = `/api/ndvi/image/${areaId}${qs ? `?${qs}` : ""}`
        const res = await fetch(url, { cache: "no-store" })
        if (!res.ok || cancelled) return

        const bboxHeader = res.headers.get("X-Bbox")
        if (!bboxHeader) return

        const bbox = JSON.parse(bboxHeader) as [number, number, number, number]
        const leafletBounds: LatLngBoundsExpression = [
          [bbox[1], bbox[0]],
          [bbox[3], bbox[2]],
        ]

        const blob = await res.blob()
        if (cancelled) return

        const objUrl = URL.createObjectURL(blob)
        setImageUrl(objUrl)
        setBounds(leafletBounds)

        // Load image into off-screen canvas for pixel reading
        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          if (cancelled) return
          const canvas = document.createElement("canvas")
          canvas.width = img.width
          canvas.height = img.height
          const ctx = canvas.getContext("2d")
          if (ctx) {
            ctx.drawImage(img, 0, 0)
            ndviOverlayRegistry.set(areaId, {
              canvas,
              bounds: L.latLngBounds(
                [bbox[1], bbox[0]],
                [bbox[3], bbox[2]],
              ),
              width: img.width,
              height: img.height,
            })
          }
        }
        img.src = objUrl
      } catch {
        // Silently fail - image overlay is optional
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
      ndviOverlayRegistry.delete(areaId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, selectedDate, imageMode])

  if (loading) return null
  if (!imageUrl || !bounds) return null

  return <ImageOverlay url={imageUrl} bounds={bounds} opacity={imageMode === "truecolor" ? 1 : 0.85} />
}

// Tooltip that follows the mouse and shows NDVI value from the image
function NdviTooltip() {
  const tooltipRef = useRef<HTMLDivElement | null>(null)

  const updateTooltip = useCallback((e: L.LeafletMouseEvent) => {
    const el = tooltipRef.current
    if (!el) return

    const { lat, lng } = e.latlng

    // Check all registered overlays
    for (const overlay of ndviOverlayRegistry.values()) {
      if (!overlay.bounds.contains(e.latlng)) continue

      // Convert lat/lng to pixel coordinates within the image
      const sw = overlay.bounds.getSouthWest()
      const ne = overlay.bounds.getNorthEast()
      const xRatio = (lng - sw.lng) / (ne.lng - sw.lng)
      const yRatio = (ne.lat - lat) / (ne.lat - sw.lat) // Y is inverted
      const px = Math.floor(xRatio * overlay.width)
      const py = Math.floor(yRatio * overlay.height)

      if (px < 0 || px >= overlay.width || py < 0 || py >= overlay.height) continue

      const ctx = overlay.canvas.getContext("2d")
      if (!ctx) continue

      const pixel = ctx.getImageData(px, py, 1, 1).data
      const ndvi = rgbToNdvi(pixel[0], pixel[1], pixel[2], pixel[3])

      if (ndvi !== null) {
        el.style.display = "block"
        el.style.left = `${e.containerPoint.x + 12}px`
        el.style.top = `${e.containerPoint.y - 28}px`
        el.textContent = `NDVI: ${ndvi.toFixed(1)}`
        el.style.backgroundColor = ndviToColor(ndvi)
        return
      }
    }

    el.style.display = "none"
  }, [])

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) tooltipRef.current.style.display = "none"
  }, [])

  useMapEvents({
    mousemove: updateTooltip,
    mouseout: hideTooltip,
  })

  return (
    <div
      ref={tooltipRef}
      style={{
        display: "none",
        position: "absolute",
        zIndex: 1000,
        pointerEvents: "none",
        padding: "3px 8px",
        borderRadius: 4,
        color: "#fff",
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      }}
    />
  )
}

type ImageMode = "ndvi" | "truecolor"

// NDVI control panel overlay
interface NdviControlsProps {
  enabled: boolean
  onToggle: () => void
  areaIds: string[]
  selectedDate: string | undefined
  onDateChange: (date: string | undefined) => void
  imageMode: ImageMode
  onImageModeChange: (mode: ImageMode) => void
}

const CLOUD_THRESHOLD = 50

function NdviControls({ enabled, onToggle, areaIds, selectedDate, onDateChange, imageMode, onImageModeChange }: NdviControlsProps) {
  const [allDates, setAllDates] = useState<{ date: string; cloudCover: number }[]>([])
  const [showCloudy, setShowCloudy] = useState(false)
  const [loadingDates, setLoadingDates] = useState(false)

  useEffect(() => {
    if (!enabled || areaIds.length === 0) return
    let cancelled = false
    setLoadingDates(true)

    async function load() {
      try {
        const res = await fetch(`/api/ndvi/dates/${areaIds[0]}`)
        if (!res.ok || cancelled) {
          console.warn("NDVI dates fetch failed:", res.status)
          return
        }
        const data = await res.json()
        if (cancelled || !Array.isArray(data)) return

        const seen = new Set<string>()
        const unique: { date: string; cloudCover: number }[] = []
        for (const entry of data) {
          const day = entry.date.slice(0, 10)
          if (!seen.has(day)) {
            seen.add(day)
            unique.push({ date: day, cloudCover: entry.cloudCover })
          }
        }
        setAllDates(unique)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoadingDates(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [enabled, areaIds])

  const filteredDates = showCloudy
    ? allDates
    : allDates.filter((d) => d.cloudCover < CLOUD_THRESHOLD)

  return (
    <div
      className="absolute top-2 right-2 z-[1000] bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 space-y-2"
      style={{ minWidth: 220 }}
    >
      <button
        onClick={onToggle}
        className={`flex items-center gap-2 text-sm font-medium w-full px-2 py-1.5 rounded-md transition-colors ${
          enabled
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        }`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          {enabled && <path d="M8 12l2.5 2.5L16 9" />}
        </svg>
        Imagem Satelite
      </button>

      {enabled && (
        <div className="space-y-2">
          <div className="flex gap-1">
            <button
              onClick={() => onImageModeChange("ndvi")}
              className={`flex-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                imageMode === "ndvi"
                  ? "bg-green-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              NDVI
            </button>
            <button
              onClick={() => onImageModeChange("truecolor")}
              className={`flex-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                imageMode === "truecolor"
                  ? "bg-blue-600 text-white"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Cor real
            </button>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Data da imagem</label>
            {loadingDates ? (
              <p className="text-xs text-muted-foreground animate-pulse">Carregando datas...</p>
            ) : filteredDates.length > 0 ? (
              <select
                value={selectedDate ?? ""}
                onChange={(e) => onDateChange(e.target.value || undefined)}
                className="w-full text-sm border rounded-md px-2 py-1.5 bg-background"
              >
                <option value="">Ultima (melhor qualidade)</option>
                {filteredDates.map((d) => (
                  <option key={d.date} value={d.date}>
                    {d.date} — {d.cloudCover.toFixed(0)}% nuvens
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-muted-foreground">Ninguna imagen disponible</p>
            )}
          </div>

          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={showCloudy}
              onChange={(e) => {
                setShowCloudy(e.target.checked)
                if (!e.target.checked && selectedDate) {
                  const sel = allDates.find((d) => d.date === selectedDate)
                  if (sel && sel.cloudCover >= CLOUD_THRESHOLD) {
                    onDateChange(undefined)
                  }
                }
              }}
              className="rounded border-muted-foreground"
            />
            Mostrar dias nublados
          </label>
        </div>
      )}
    </div>
  )
}

export default function FarmMap({ areas, ndviData, showNdviImages }: FarmMapProps) {
  const [ndviEnabled, setNdviEnabled] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined)
  const [imageMode, setImageMode] = useState<ImageMode>("ndvi")

  const { center, zoom, bounds } = useMemo(
    () => computeBoundsAndCenter(areas),
    [areas]
  )

  const ndviMap = useMemo(() => {
    const map = new Map<string, NdviData>()
    if (ndviData) {
      for (const d of ndviData) {
        map.set(d.areaId, d)
      }
    }
    return map
  }, [ndviData])

  const areasWithGeoJson = areas.filter(
    (a) => a.geojson !== null && a.geojson !== undefined
  )

  const areaIds = useMemo(() => areasWithGeoJson.map((a) => a.id), [areasWithGeoJson])

  return (
    <div className="relative h-full w-full">
      {showNdviImages && (
        <NdviControls
          enabled={ndviEnabled}
          onToggle={() => {
            setNdviEnabled((v) => !v)
            if (ndviEnabled) setSelectedDate(undefined)
          }}
          areaIds={areaIds}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          imageMode={imageMode}
          onImageModeChange={setImageMode}
        />
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom
        className="h-full w-full"
      >
        <FitBounds bounds={bounds} />
        <LayersControl position="topleft">
          <LayersControl.BaseLayer checked name="Satelite">
            <TileLayer
              attribution="Tiles &copy; Esri"
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Mapa">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        {/* NDVI image overlays + tooltip */}
        {showNdviImages &&
          ndviEnabled && (
          <>
            {areasWithGeoJson.map((area) => (
              <NdviImageOverlay
                key={`ndvi-img-${area.id}-${imageMode}`}
                areaId={area.id}
                selectedDate={selectedDate}
                imageMode={imageMode}
              />
            ))}
            {imageMode === "ndvi" && <NdviTooltip />}
          </>
        )}

        {/* Area polygons */}
        {areasWithGeoJson.map((area) => {
          const ndvi = ndviMap.get(area.id)
          const hasImage = showNdviImages && ndviEnabled
          const fillColor = !hasImage && ndvi ? ndviToColor(ndvi.mean) : area.color
          const borderColor = ndvi ? ndviToColor(ndvi.mean) : area.color

          return (
            <GeoJSON
              key={area.id}
              data={area.geojson}
              style={{
                color: borderColor,
                weight: 2,
                fillColor,
                fillOpacity: hasImage ? 0 : ndvi ? 0.5 : 0.3,
              }}
              onEachFeature={(_feature, layer) => {
                const ndviHtml = ndvi
                  ? `<div style="margin-top:6px;padding:4px 0;border-top:1px solid #eee">
                      <span style="font-weight:600">NDVI:</span>
                      <span style="color:${ndviToColor(ndvi.mean)};font-weight:700"> ${ndvi.mean.toFixed(2)}</span>
                      <br/>
                      <span style="font-size:11px;color:#888">${ndviLabel(ndvi.mean)} &middot; ${ndvi.date}</span>
                    </div>`
                  : `<div style="margin-top:4px;font-size:11px;color:#999">NDVI: sem dados</div>`

                layer.bindPopup(
                  `<div style="min-width:140px">
                    <strong>${area.name}</strong>
                    <br/>
                    <span>${area.sizeHa.toFixed(2)} ha</span>
                    ${ndviHtml}
                  </div>`
                )
              }}
            />
          )
        })}
      </MapContainer>
    </div>
  )
}
