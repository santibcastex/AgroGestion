"use server"

import { prisma } from "@/lib/prisma"
import { activitySchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { getNextActivityCode } from "@/queries/activities"

export async function createActivity(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = activitySchema.parse(data)
  const { areaIds, inputUsages, ...activityData } = parsed
  const code = await getNextActivityCode(farmId)

  const areas = await prisma.area.findMany({
    where: { id: { in: areaIds }, farmId },
    select: { id: true, sizeHa: true },
  })
  const totalHa = areas.reduce((sum, a) => sum + a.sizeHa, 0)

  const activity = await prisma.activity.create({
    data: {
      ...activityData,
      farmId,
      code,
      totalHa,
      activityAreas: {
        create: areaIds.map((areaId) => {
          const area = areas.find((a) => a.id === areaId)
          return { areaId, sizeHa: area?.sizeHa }
        }),
      },
    },
  })

  if (inputUsages?.length) {
    for (const usage of inputUsages) {
      await prisma.inputUsage.create({
        data: {
          activityId: activity.id,
          inputId: usage.inputId,
          quantity: usage.quantity,
          ratePerHa: usage.ratePerHa,
        },
      })
      // Only deduct inventory for REALIZADO activities
      if (activityData.kind === "REALIZADO") {
        await prisma.inventoryEntry.create({
          data: {
            farmId,
            inputId: usage.inputId,
            quantity: -usage.quantity,
            reason: "ACTIVITY_USAGE",
            referenceId: activity.id,
            referenceType: "ACTIVITY",
          },
        })
      }
    }
  }

  await prisma.activityLog.create({
    data: {
      activityId: activity.id,
      userId: user.id,
      action: "CREATED",
      details: { code, kind: activityData.kind },
    },
  })

  revalidatePath("/atividades")
  revalidatePath("/safras")
  return { success: true, activity }
}

export async function createRealization(
  farmId: string,
  plannedActivityId: string,
  data: unknown
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  // Verify the planned activity exists
  const planned = await prisma.activity.findFirst({
    where: { id: plannedActivityId, farmId, kind: "PLANEJADO" },
    include: {
      activityAreas: true,
      inputUsages: true,
    },
  })
  if (!planned) throw new Error("Actividad planificada no encontrada")

  const parsed = activitySchema.parse({
    ...(data as Record<string, unknown>),
    kind: "REALIZADO",
    plannedActivityId,
  })
  const { areaIds, inputUsages, ...activityData } = parsed
  const code = await getNextActivityCode(farmId)

  const areas = await prisma.area.findMany({
    where: { id: { in: areaIds }, farmId },
    select: { id: true, sizeHa: true },
  })
  const totalHa = areas.reduce((sum, a) => sum + a.sizeHa, 0)

  const activity = await prisma.activity.create({
    data: {
      ...activityData,
      farmId,
      code,
      totalHa,
      activityAreas: {
        create: areaIds.map((areaId) => {
          const area = areas.find((a) => a.id === areaId)
          return { areaId, sizeHa: area?.sizeHa }
        }),
      },
    },
  })

  if (inputUsages?.length) {
    for (const usage of inputUsages) {
      await prisma.inputUsage.create({
        data: {
          activityId: activity.id,
          inputId: usage.inputId,
          quantity: usage.quantity,
          ratePerHa: usage.ratePerHa,
        },
      })
      // Realizations always deduct inventory
      await prisma.inventoryEntry.create({
        data: {
          farmId,
          inputId: usage.inputId,
          quantity: -usage.quantity,
          reason: "ACTIVITY_USAGE",
          referenceId: activity.id,
          referenceType: "ACTIVITY",
        },
      })
    }
  }

  await prisma.activityLog.create({
    data: {
      activityId: activity.id,
      userId: user.id,
      action: "REALIZATION_CREATED",
      details: { code, plannedActivityId },
    },
  })

  revalidatePath("/atividades")
  revalidatePath("/safras")
  return { success: true, activity }
}

export async function updateActivityStatus(
  farmId: string,
  activityId: string,
  status: "A_FAZER" | "EM_PROGRESSO" | "REVISAR" | "CONCLUIDO"
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "WORKER")

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: { status },
  })

  await prisma.activityLog.create({
    data: {
      activityId,
      userId: user.id,
      action: "STATUS_CHANGED",
      details: { status },
    },
  })

  revalidatePath("/atividades")
  revalidatePath("/safras")
  return { success: true, activity }
}

export async function addSubtypeToActivityType(
  farmId: string,
  activityTypeId: string,
  subtypeName: string
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const activityType = await prisma.activityType.findFirst({
    where: { id: activityTypeId, farmId },
  })
  if (!activityType) throw new Error("Tipo de actividad no encontrado")

  const trimmed = subtypeName.trim()
  if (!trimmed) throw new Error("Nombre de la operación es obligatorio")
  if (activityType.subtypes.includes(trimmed)) {
    throw new Error("Operación ya existe")
  }

  const updated = await prisma.activityType.update({
    where: { id: activityTypeId },
    data: { subtypes: { push: trimmed } },
  })

  revalidatePath("/safras")
  return { success: true, subtypes: updated.subtypes }
}

export async function deleteActivity(farmId: string, activityId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const activity = await prisma.activity.findFirst({
    where: { id: activityId, farmId },
    select: { kind: true },
  })

  // Only reverse inventory for REALIZADO activities
  if (activity?.kind === "REALIZADO") {
    const usages = await prisma.inputUsage.findMany({
      where: { activityId },
    })
    for (const usage of usages) {
      await prisma.inventoryEntry.create({
        data: {
          farmId,
          inputId: usage.inputId,
          quantity: usage.quantity,
          reason: "ACTIVITY_REVERSAL",
          referenceId: activityId,
          referenceType: "ACTIVITY",
        },
      })
    }
  }

  await prisma.activity.delete({ where: { id: activityId } })

  revalidatePath("/atividades")
  revalidatePath("/safras")
  return { success: true }
}
