"use server"

import { prisma } from "@/lib/prisma"
import { soilAnalysisSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

function computeDerived(data: Record<string, unknown>) {
  const k = (data.potassium as number) || 0
  const ca = (data.calcium as number) || 0
  const mg = (data.magnesium as number) || 0
  const al = (data.aluminum as number) || 0
  const hAl = (data.hPlusAl as number) || 0

  const sumOfBases = k + ca + mg
  const ctc = sumOfBases + hAl
  const baseSaturation = ctc > 0 ? (sumOfBases / ctc) * 100 : 0
  const aluminumSaturation = (sumOfBases + al) > 0 ? (al / (sumOfBases + al)) * 100 : 0

  return { sumOfBases, ctc, baseSaturation, aluminumSaturation }
}

function cleanNumericFields(data: Record<string, unknown>) {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(data)) {
    if (value === "" || value === undefined) {
      cleaned[key] = null
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

export async function createSoilAnalysis(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = soilAnalysisSchema.parse(data)
  const cleaned = cleanNumericFields(parsed as Record<string, unknown>)
  const derived = computeDerived(cleaned)

  // Only override derived values if not explicitly provided
  if (!cleaned.sumOfBases) cleaned.sumOfBases = derived.sumOfBases
  if (!cleaned.ctc) cleaned.ctc = derived.ctc
  if (!cleaned.baseSaturation) cleaned.baseSaturation = derived.baseSaturation
  if (!cleaned.aluminumSaturation) cleaned.aluminumSaturation = derived.aluminumSaturation

  const analysis = await prisma.soilAnalysis.create({
    data: { ...cleaned, farmId } as never,
  })

  revalidatePath("/analise-solo")
  return { success: true, analysis }
}

export async function updateSoilAnalysis(farmId: string, analysisId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = soilAnalysisSchema.parse(data)
  const cleaned = cleanNumericFields(parsed as Record<string, unknown>)
  const derived = computeDerived(cleaned)

  if (!cleaned.sumOfBases) cleaned.sumOfBases = derived.sumOfBases
  if (!cleaned.ctc) cleaned.ctc = derived.ctc
  if (!cleaned.baseSaturation) cleaned.baseSaturation = derived.baseSaturation
  if (!cleaned.aluminumSaturation) cleaned.aluminumSaturation = derived.aluminumSaturation

  const analysis = await prisma.soilAnalysis.update({
    where: { id: analysisId },
    data: cleaned as never,
  })

  revalidatePath("/analise-solo")
  revalidatePath(`/analise-solo/${analysisId}`)
  return { success: true, analysis }
}

export async function deleteSoilAnalysis(farmId: string, analysisId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  await prisma.soilAnalysis.delete({ where: { id: analysisId } })

  revalidatePath("/analise-solo")
  return { success: true }
}

export type ImportSample = {
  sampleId: string
  areaId?: string | null
  depth: string
  sampleDate: string
  labName: string
  labReportId?: string
  pH?: number
  pHType?: string
  organicMatter?: number
  phosphorus?: number
  potassium?: number
  calcium?: number
  magnesium?: number
  aluminum?: number
  hPlusAl?: number
  sumOfBases?: number
  ctc?: number
  baseSaturation?: number
  aluminumSaturation?: number
  sulfur?: number
  boron?: number
  copper?: number
  iron?: number
  manganese?: number
  zinc?: number
  clayPercent?: number
  siltPercent?: number
  sandPercent?: number
  textureClass?: string
}

export async function importSoilAnalyses(farmId: string, samples: ImportSample[]) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  if (!samples.length) return { success: false, error: "Ninguna muestra para importar" }

  const importBatchId = `import_${Date.now()}`

  const records = samples.map((s) => {
    const year = new Date(s.sampleDate).getFullYear()
    return {
      farmId,
      importBatchId,
      sampleId: s.sampleId,
      areaId: s.areaId ?? undefined,
      sampleDate: new Date(s.sampleDate),
      year,
      labName: s.labName || null,
      labReportId: s.labReportId || null,
      depth: s.depth || "0-20",
      pH: s.pH ?? null,
      pHType: s.pHType ?? "CaCl2",
      organicMatter: s.organicMatter ?? null,
      phosphorus: s.phosphorus ?? null,
      potassium: s.potassium ?? null,
      calcium: s.calcium ?? null,
      magnesium: s.magnesium ?? null,
      aluminum: s.aluminum ?? null,
      hPlusAl: s.hPlusAl ?? null,
      sumOfBases: s.sumOfBases ?? null,
      ctc: s.ctc ?? null,
      baseSaturation: s.baseSaturation ?? null,
      aluminumSaturation: s.aluminumSaturation ?? null,
      sulfur: s.sulfur ?? null,
      boron: s.boron ?? null,
      copper: s.copper ?? null,
      iron: s.iron ?? null,
      manganese: s.manganese ?? null,
      zinc: s.zinc ?? null,
      clayPercent: s.clayPercent ?? null,
      siltPercent: s.siltPercent ?? null,
      sandPercent: s.sandPercent ?? null,
      textureClass: s.textureClass ?? null,
    }
  })

  const result = await prisma.soilAnalysis.createMany({ data: records })

  revalidatePath("/analise-solo")
  return { success: true, count: result.count, importBatchId }
}
