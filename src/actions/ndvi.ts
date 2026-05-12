"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { fetchNdviStats } from "@/lib/sentinel-hub"
import { revalidatePath } from "next/cache"

export async function syncNdviForArea(areaId: string) {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) throw new Error("Sin acceso")

  const area = await prisma.area.findFirst({
    where: { id: areaId, farmId: membership.farmId, active: true },
  })

  if (!area) throw new Error("Área no encontrada")
  if (!area.geojson) throw new Error("Área sin geometría definida")

  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 90)

  const stats = await fetchNdviStats(area.geojson, from, to)

  let count = 0
  for (const entry of stats) {
    // Skip cloud-contaminated readings (>40% no-data or NDVI mean < 0.05)
    if (entry.cloudCoverage != null && entry.cloudCoverage > 40) continue
    if (entry.mean < 0.05) continue

    await prisma.ndviReading.upsert({
      where: {
        areaId_date: { areaId: area.id, date: entry.date },
      },
      create: {
        areaId: area.id,
        date: entry.date,
        mean: entry.mean,
        min: entry.min,
        max: entry.max,
        stDev: entry.stDev,
        cloudCoverage: entry.cloudCoverage,
        sampleCount: entry.sampleCount,
        noDataCount: entry.noDataCount,
      },
      update: {
        mean: entry.mean,
        min: entry.min,
        max: entry.max,
        stDev: entry.stDev,
        cloudCoverage: entry.cloudCoverage,
        sampleCount: entry.sampleCount,
        noDataCount: entry.noDataCount,
      },
    })
    count++
  }

  revalidatePath(`/areas/${areaId}`)

  return { success: true, count }
}

export async function syncNdviForAllAreas() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) throw new Error("Sin acceso")

  const areas = await prisma.area.findMany({
    where: { farmId: membership.farmId, active: true, geojson: { not: undefined } },
  })

  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 90)

  let totalReadings = 0
  const errors: string[] = []

  for (const area of areas) {
    try {
      const stats = await fetchNdviStats(area.geojson, from, to)

      for (const entry of stats) {
        // Skip cloud-contaminated readings (>40% no-data or NDVI mean < 0.05)
        if (entry.cloudCoverage != null && entry.cloudCoverage > 40) continue
        if (entry.mean < 0.05) continue

        await prisma.ndviReading.upsert({
          where: {
            areaId_date: { areaId: area.id, date: entry.date },
          },
          create: {
            areaId: area.id,
            date: entry.date,
            mean: entry.mean,
            min: entry.min,
            max: entry.max,
            stDev: entry.stDev,
            cloudCoverage: entry.cloudCoverage,
            sampleCount: entry.sampleCount,
            noDataCount: entry.noDataCount,
          },
          update: {
            mean: entry.mean,
            min: entry.min,
            max: entry.max,
            stDev: entry.stDev,
            cloudCoverage: entry.cloudCoverage,
            sampleCount: entry.sampleCount,
            noDataCount: entry.noDataCount,
          },
        })
        totalReadings++
      }
    } catch (err) {
      errors.push(`${area.name}: ${err instanceof Error ? err.message : "Error desconocido"}`)
    }
  }

  revalidatePath("/areas")

  return {
    success: errors.length === 0,
    totalAreas: areas.length,
    totalReadings,
    errors,
  }
}
