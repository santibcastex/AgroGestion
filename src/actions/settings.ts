"use server"

import { prisma } from "@/lib/prisma"
import { farmSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import bcryptjs from "bcryptjs"

export async function updateFarm(
  farmId: string,
  data: { name: string; city?: string; state?: string; document?: string }
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = farmSchema.parse(data)

  await prisma.farm.update({
    where: { id: farmId },
    data: parsed,
  })

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function getFarmMembers(farmId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "VIEWER")

  return prisma.farmMembership.findMany({
    where: { farmId, active: true },
    include: {
      user: { select: { name: true, email: true } },
    },
    orderBy: { joinedAt: "asc" },
  })
}

export async function removeFarmMember(farmId: string, membershipId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "OWNER")

  const membership = await prisma.farmMembership.findUnique({
    where: { id: membershipId },
  })

  if (!membership || membership.farmId !== farmId) {
    throw new Error("Miembro no encontrado")
  }

  if (membership.role === "OWNER") {
    throw new Error("No es posible eliminar al propietario")
  }

  await prisma.farmMembership.update({
    where: { id: membershipId },
    data: { active: false },
  })

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function updateProfile(data: { name: string }) {
  const user = await requireAuth()

  await prisma.user.update({
    where: { id: user.id },
    data: { name: data.name },
  })

  revalidatePath("/perfil")
  return { success: true }
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}) {
  const user = await requireAuth()

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  })

  if (!dbUser?.passwordHash) {
    throw new Error("Usuario sin contraseña configurada")
  }

  const isValid = await bcryptjs.compare(data.currentPassword, dbUser.passwordHash)
  if (!isValid) {
    throw new Error("Contraseña actual incorrecta")
  }

  const hashedPassword = await bcryptjs.hash(data.newPassword, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashedPassword },
  })

  return { success: true }
}
