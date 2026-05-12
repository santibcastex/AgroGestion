"use server"

import { prisma } from "@/lib/prisma"
import { purchaseSchema, supplierSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { getNextPurchaseCode } from "@/queries/purchases"

export async function createSupplier(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = supplierSchema.parse(data)

  const supplier = await prisma.supplier.create({
    data: { ...parsed, farmId },
  })

  revalidatePath("/compras")
  return { success: true, supplier }
}

export async function createPurchase(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = purchaseSchema.parse(data)
  const { items, ...purchaseData } = parsed
  const code = await getNextPurchaseCode(farmId)

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
    + purchaseData.freightAmount - purchaseData.discountAmount

  const purchase = await prisma.purchase.create({
    data: {
      ...purchaseData,
      farmId,
      code,
      totalAmount,
      items: {
        create: items.map((item) => ({
          inputId: item.inputId || null,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
  })

  revalidatePath("/compras")
  return { success: true, purchase }
}

export async function confirmPurchase(farmId: string, purchaseId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const purchase = await prisma.purchase.findFirst({
    where: { id: purchaseId, farmId },
    include: { items: true },
  })
  if (!purchase) throw new Error("Compra no encontrada")

  // Add items to inventory
  for (const item of purchase.items) {
    if (item.inputId) {
      await prisma.inventoryEntry.create({
        data: {
          farmId,
          inputId: item.inputId,
          quantity: item.quantity,
          reason: "PURCHASE",
          referenceId: purchase.id,
          referenceType: "PURCHASE",
          unitCost: item.unitPrice,
        },
      })
    }
  }

  // Create financial transaction (payable)
  const defCat = await prisma.financialCategory.findFirst({
    where: { farmId, name: "Outros Custos", type: "DESPESA" },
  })

  await prisma.transaction.create({
    data: {
      farmId,
      type: "DESPESA",
      description: `Compra ${purchase.code} - ${purchase.invoiceNumber || "s/NF"}`,
      amount: purchase.totalAmount,
      dueDate: purchase.purchaseDate,
      purchaseId: purchase.id,
      supplierId: purchase.supplierId,
      categoryId: defCat?.id,
      documentNumber: purchase.invoiceNumber,
    },
  })

  await prisma.purchase.update({
    where: { id: purchaseId },
    data: { status: "CONFIRMADA" },
  })

  revalidatePath("/compras")
  revalidatePath("/financeiro")
  revalidatePath("/insumos")
  return { success: true }
}
