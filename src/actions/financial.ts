"use server"

import { prisma } from "@/lib/prisma"
import { bankAccountSchema, transactionSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"

export async function createBankAccount(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = bankAccountSchema.parse(data)

  const account = await prisma.bankAccount.create({
    data: { ...parsed, farmId },
  })

  revalidatePath("/financeiro")
  return { success: true, account }
}

export async function setDefaultBankAccount(farmId: string, accountId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  await prisma.bankAccount.updateMany({ where: { farmId }, data: { isDefault: false } })
  await prisma.bankAccount.update({ where: { id: accountId }, data: { isDefault: true } })

  revalidatePath("/financeiro")
  return { success: true }
}

export async function updateBankAccount(farmId: string, accountId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const parsed = bankAccountSchema.parse(data)

  const existing = await prisma.bankAccount.findFirst({ where: { id: accountId, farmId } })
  if (!existing) throw new Error("Cuenta no encontrada")

  const account = await prisma.bankAccount.update({
    where: { id: accountId },
    data: parsed,
  })

  revalidatePath("/financeiro")
  return { success: true, account }
}

export async function createTransaction(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "ACCOUNTANT")

  const parsed = transactionSchema.parse(data)
  const { installments: installmentCount, ...txData } = parsed

  if (installmentCount > 1) {
    const installmentAmount = txData.amount / installmentCount
    const parent = await prisma.transaction.create({
      data: {
        ...txData,
        farmId,
        totalInstallments: installmentCount,
      },
    })

    for (let i = 1; i <= installmentCount; i++) {
      const dueDate = new Date(txData.dueDate)
      dueDate.setMonth(dueDate.getMonth() + (i - 1))

      await prisma.transaction.create({
        data: {
          farmId,
          type: txData.type,
          categoryId: txData.categoryId,
          bankAccountId: txData.bankAccountId,
          description: `${txData.description} (${i}/${installmentCount})`,
          amount: installmentAmount,
          dueDate,
          supplierId: txData.supplierId,
          parentId: parent.id,
          installmentNumber: i,
          totalInstallments: installmentCount,
        },
      })
    }

    revalidatePath("/financeiro")
    return { success: true, transaction: parent }
  }

  const transaction = await prisma.transaction.create({
    data: { ...txData, farmId },
  })

  revalidatePath("/financeiro")
  return { success: true, transaction }
}

export async function markTransactionPaid(farmId: string, transactionId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "ACCOUNTANT")

  const tx = await prisma.transaction.findFirst({
    where: { id: transactionId, farmId },
  })
  if (!tx) throw new Error("Transacción no encontrada")

  const status = tx.type === "RECEITA" ? "RECEBIDO" : "PAGO"

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { status, paymentDate: new Date() },
  })

  revalidatePath("/financeiro")
  return { success: true, transaction }
}

export async function reconcileTransaction(farmId: string, transactionId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "ACCOUNTANT")

  const transaction = await prisma.transaction.update({
    where: { id: transactionId },
    data: { reconciled: true },
  })

  revalidatePath("/financeiro")
  return { success: true, transaction }
}

export async function updateTransaction(farmId: string, transactionId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "ACCOUNTANT")

  const parsed = transactionSchema.parse(data)
  const { installments: _, ...txData } = parsed

  const transaction = await prisma.transaction.update({
    where: { id: transactionId, farmId },
    data: txData,
  })

  revalidatePath("/financeiro")
  return { success: true, transaction }
}

export async function deleteTransaction(farmId: string, transactionId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  // Delete installments first
  await prisma.transaction.deleteMany({ where: { parentId: transactionId } })
  await prisma.transaction.delete({ where: { id: transactionId } })

  revalidatePath("/financeiro")
  return { success: true }
}
