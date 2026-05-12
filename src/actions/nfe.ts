"use server"

import { prisma } from "@/lib/prisma"
import { approveNfeSchema, rejectNfeSchema } from "@/lib/validators"
import { requireAuth, requireFarmAccess } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { encryptData, encryptString } from "@/lib/nfe/encryption"
import { parsePfx } from "@/lib/nfe/certificate"
import { queryDistDFe } from "@/lib/nfe/sefaz"
import { getNextPurchaseCode } from "@/queries/purchases"

export async function uploadCertificate(farmId: string, formData: FormData) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "OWNER")

  const file = formData.get("certificate") as File | null
  const password = formData.get("password") as string | null

  if (!file || !password) {
    throw new Error("Certificado y contraseña son obligatorios")
  }

  const arrayBuffer = await file.arrayBuffer()
  const pfxBuffer = Buffer.from(arrayBuffer)

  // Validate the PFX can be parsed
  let certInfo
  try {
    certInfo = parsePfx(pfxBuffer, password)
  } catch {
    throw new Error(
      "No fue posible leer el certificado. Verifique el archivo y la contraseña."
    )
  }

  // Encrypt PFX and password
  const pfxEncResult = encryptData(pfxBuffer)
  const pwdEncResult = encryptString(password)

  // Cast Buffer to satisfy Prisma Bytes type
  const pfxBytes = pfxEncResult.encrypted as unknown as Uint8Array<ArrayBuffer>
  const pwdBytes = pwdEncResult.encrypted as unknown as Uint8Array<ArrayBuffer>

  await prisma.farmCertificate.upsert({
    where: { farmId },
    create: {
      farmId,
      subjectName: certInfo.subjectName,
      serialNumber: certInfo.serialNumber,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      pfxEncrypted: pfxBytes,
      pfxIv: pfxEncResult.iv,
      pfxAuthTag: pfxEncResult.authTag,
      passwordEncrypted: pwdBytes,
      passwordIv: pwdEncResult.iv,
      passwordAuthTag: pwdEncResult.authTag,
    },
    update: {
      subjectName: certInfo.subjectName,
      serialNumber: certInfo.serialNumber,
      validFrom: certInfo.validFrom,
      validTo: certInfo.validTo,
      pfxEncrypted: pfxBytes,
      pfxIv: pfxEncResult.iv,
      pfxAuthTag: pfxEncResult.authTag,
      passwordEncrypted: pwdBytes,
      passwordIv: pwdEncResult.iv,
      passwordAuthTag: pwdEncResult.authTag,
      lastNsu: "0",
    },
  })

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function deleteCertificate(farmId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "OWNER")

  await prisma.farmCertificate.deleteMany({ where: { farmId } })

  revalidatePath("/configuracoes")
  return { success: true }
}

export async function getCertificateInfo(farmId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const cert = await prisma.farmCertificate.findUnique({
    where: { farmId },
    select: {
      id: true,
      subjectName: true,
      serialNumber: true,
      validFrom: true,
      validTo: true,
      createdAt: true,
    },
  })

  return cert
}

export async function importNfesFromSefaz(farmId: string) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "MANAGER")

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { document: true, state: true },
  })

  if (!farm?.document) {
    throw new Error("La granja necesita tener un CNPJ registrado en la configuración")
  }

  const result = await queryDistDFe(farmId)

  let importedCount = 0
  for (const nfe of result.documents) {
    // Check if already imported
    const existing = await prisma.nfeImport.findUnique({
      where: { chaveAcesso: nfe.chaveAcesso },
    })
    if (existing) continue

    await prisma.nfeImport.create({
      data: {
        farmId,
        chaveAcesso: nfe.chaveAcesso,
        numero: nfe.numero,
        serie: nfe.serie,
        dataEmissao: nfe.dataEmissao ? new Date(nfe.dataEmissao) : null,
        xmlContent: nfe.xml,
        emitenteCnpj: nfe.emitenteCnpj,
        emitenteNome: nfe.emitenteNome,
        emitenteUf: nfe.emitenteUf,
        valorTotal: nfe.valorTotal,
        valorProdutos: nfe.valorProdutos,
        valorFrete: nfe.valorFrete,
        valorDesconto: nfe.valorDesconto,
        items: {
          create: nfe.items.map((item) => ({
            codigo: item.codigo,
            descricao: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            unidade: item.unidade,
            quantidade: item.quantidade,
            valorUnitario: item.valorUnitario,
            valorTotal: item.valorTotal,
          })),
        },
      },
    })
    importedCount++
  }

  // Update lastNsu
  if (result.lastNsu) {
    await prisma.farmCertificate.update({
      where: { farmId },
      data: { lastNsu: result.lastNsu },
    })
  }

  revalidatePath("/notas-fiscais")
  return { success: true, importedCount }
}

export async function approveNfe(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "ACCOUNTANT")

  const parsed = approveNfeSchema.parse(data)

  const nfeImport = await prisma.nfeImport.findFirst({
    where: { id: parsed.nfeImportId, farmId, status: "PENDENTE" },
    include: { items: true },
  })

  if (!nfeImport) {
    throw new Error("Factura no encontrada o ya procesada")
  }

  // Find or create supplier
  let supplierId = parsed.supplierId
  if (!supplierId && nfeImport.emitenteCnpj) {
    // Try to find existing supplier by CNPJ
    const existing = await prisma.supplier.findFirst({
      where: { farmId, document: nfeImport.emitenteCnpj },
    })
    if (existing) {
      supplierId = existing.id
    } else {
      // Auto-create supplier from NFe emitente data
      const supplier = await prisma.supplier.create({
        data: {
          farmId,
          name: nfeImport.emitenteNome || `Proveedor ${nfeImport.emitenteCnpj}`,
          document: nfeImport.emitenteCnpj,
        },
      })
      supplierId = supplier.id
    }
  }

  // Find default category
  const category = parsed.categoryId
    ? await prisma.financialCategory.findFirst({
        where: { id: parsed.categoryId, farmId },
      })
    : await prisma.financialCategory.findFirst({
        where: { farmId, name: "Outros Custos", type: "DESPESA" },
      })

  // Create transaction
  const transaction = await prisma.transaction.create({
    data: {
      farmId,
      type: "DESPESA",
      description: `NF-e ${nfeImport.numero || nfeImport.chaveAcesso.slice(-8)} - ${nfeImport.emitenteNome || ""}`.trim(),
      amount: nfeImport.valorTotal,
      dueDate: parsed.dueDate || nfeImport.dataEmissao || new Date(),
      supplierId,
      categoryId: category?.id,
      bankAccountId: parsed.bankAccountId,
      documentNumber: nfeImport.chaveAcesso,
      notes: parsed.notes,
    },
  })

  // Create purchase with items
  const purchaseCode = await getNextPurchaseCode(farmId)
  const purchase = await prisma.purchase.create({
    data: {
      farmId,
      code: purchaseCode,
      supplierId: supplierId!,
      status: "RECEBIDA",
      purchaseDate: nfeImport.dataEmissao || new Date(),
      invoiceNumber: nfeImport.numero,
      invoiceKey: nfeImport.chaveAcesso,
      totalAmount: nfeImport.valorTotal,
      freightAmount: nfeImport.valorFrete,
      discountAmount: nfeImport.valorDesconto,
      items: {
        create: nfeImport.items.map((item) => ({
          description: item.descricao,
          quantity: item.quantidade,
          unit: "UNIDADE" as const,
          unitPrice: item.valorUnitario,
          totalPrice: item.valorTotal,
        })),
      },
    },
  })

  // Update NFe import
  await prisma.nfeImport.update({
    where: { id: nfeImport.id },
    data: {
      status: "APROVADA",
      supplierId,
      transactionId: transaction.id,
      purchaseId: purchase.id,
      approvedAt: new Date(),
    },
  })

  revalidatePath("/notas-fiscais")
  revalidatePath("/financeiro")
  revalidatePath("/compras")
  return { success: true }
}

export async function rejectNfe(farmId: string, data: unknown) {
  const user = await requireAuth()
  await requireFarmAccess(user.id, farmId, "ACCOUNTANT")

  const parsed = rejectNfeSchema.parse(data)

  const nfeImport = await prisma.nfeImport.findFirst({
    where: { id: parsed.nfeImportId, farmId, status: "PENDENTE" },
  })

  if (!nfeImport) {
    throw new Error("Factura no encontrada o ya procesada")
  }

  await prisma.nfeImport.update({
    where: { id: nfeImport.id },
    data: {
      status: "REJEITADA",
      rejectionReason: parsed.rejectionReason,
      rejectedAt: new Date(),
    },
  })

  revalidatePath("/notas-fiscais")
  return { success: true }
}
