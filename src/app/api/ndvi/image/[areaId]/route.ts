import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { fetchSatelliteImage } from "@/lib/sentinel-hub"
import type { SatelliteImageMode } from "@/lib/sentinel-hub"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ areaId: string }> }
) {
  try {
    const { areaId } = await params
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const user = await requireAuth()
    const membership = await getUserActiveFarm(user.id)
    if (!membership) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 })
    }

    const area = await prisma.area.findFirst({
      where: { id: areaId, farmId: membership.farmId, active: true },
      select: { geojson: true },
    })

    if (!area || !area.geojson) {
      return NextResponse.json({ error: "Area sem geometria" }, { status: 404 })
    }

    let date: Date | undefined
    if (dateParam) {
      date = new Date(dateParam + "T00:00:00Z")
      if (isNaN(date.getTime())) {
        return NextResponse.json({ error: "Data invalida" }, { status: 400 })
      }
    }

    const modeParam = searchParams.get("mode")
    const mode: SatelliteImageMode = modeParam === "truecolor" ? "truecolor" : "ndvi"

    const result = await fetchSatelliteImage(area.geojson, mode, date)

    return new NextResponse(new Uint8Array(result.image), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
        "X-Bbox": JSON.stringify(result.bbox),
      },
    })
  } catch (err) {
    console.error("NDVI image error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao buscar imagem NDVI" },
      { status: 500 }
    )
  }
}
