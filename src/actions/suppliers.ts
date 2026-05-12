"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { supplierSchema } from "@/lib/validators"
import { revalidatePath } from "next/cache"
import { z } from "zod"

type SupplierInput = z.infer<typeof supplierSchema>

export async function createSupplier(farmId: string, data: SupplierInput) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = supplierSchema.parse(data)

  const name = parsed.name.trim()
  if (!name) throw new Error("Nombre es obligatorio")

  const supplier = await prisma.supplier.create({
    data: {
      farmId,
      name,
      document: parsed.document?.trim() || undefined,
      types: parsed.types,
      phone: parsed.phone?.trim() || undefined,
      whatsapp: parsed.whatsapp?.trim() || undefined,
      email: parsed.email?.trim() || undefined,
      address: parsed.address?.trim() || undefined,
      notes: parsed.notes?.trim() || undefined,
    },
  })

  revalidatePath("/fornecedores")
  return supplier
}

export async function updateSupplier(
  farmId: string,
  supplierId: string,
  data: SupplierInput
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = supplierSchema.parse(data)

  const name = parsed.name.trim()
  if (!name) throw new Error("Nombre es obligatorio")

  const supplier = await prisma.supplier.update({
    where: { id: supplierId, farmId },
    data: {
      name,
      document: parsed.document?.trim() || undefined,
      types: parsed.types,
      phone: parsed.phone?.trim() || undefined,
      whatsapp: parsed.whatsapp?.trim() || undefined,
      email: parsed.email?.trim() || undefined,
      address: parsed.address?.trim() || undefined,
      notes: parsed.notes?.trim() || undefined,
    },
  })

  revalidatePath("/fornecedores")
  return supplier
}

export async function deleteSupplier(farmId: string, supplierId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  await prisma.supplier.delete({
    where: { id: supplierId, farmId },
  })

  revalidatePath("/fornecedores")
}

// ── Contacts ──────────────────────────────────────────────────────────────────

const contactSchema = z.object({
  name: z.string().min(1),
  role: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
})

export async function upsertSupplierContact(
  farmId: string,
  supplierId: string,
  contactId: string | null,
  data: z.infer<typeof contactSchema>
) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  // Verify supplier belongs to farm
  const supplier = await prisma.supplier.findFirst({ where: { id: supplierId, farmId } })
  if (!supplier) throw new Error("Proveedor no encontrado")

  const parsed = contactSchema.parse(data)
  const payload = {
    name: parsed.name.trim(),
    role: parsed.role?.trim() || null,
    phone: parsed.phone?.trim() || null,
    whatsapp: parsed.whatsapp?.trim() || null,
    email: parsed.email?.trim() || null,
    notes: parsed.notes?.trim() || null,
  }

  if (contactId) {
    await prisma.supplierContact.update({ where: { id: contactId }, data: payload })
  } else {
    await prisma.supplierContact.create({ data: { supplierId, ...payload } })
  }

  revalidatePath("/fornecedores")
}

export async function deleteSupplierContact(farmId: string, contactId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const contact = await prisma.supplierContact.findFirst({
    where: { id: contactId, supplier: { farmId } },
  })
  if (!contact) throw new Error("Contacto no encontrado")

  await prisma.supplierContact.delete({ where: { id: contactId } })
  revalidatePath("/fornecedores")
}
