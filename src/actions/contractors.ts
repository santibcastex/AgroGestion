"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createContractor(
  farmId: string,
  data: { name: string; phone?: string }
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const name = data.name.trim()
  if (!name) throw new Error("Nombre es obligatorio")

  const contractor = await prisma.contractor.create({
    data: {
      farmId,
      name,
      phone: data.phone?.trim() || undefined,
    },
  })

  revalidatePath("/safras")
  return contractor
}
