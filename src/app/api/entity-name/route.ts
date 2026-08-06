import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, getUserActiveFarm } from "@/lib/permissions"

const typeToModel: Record<string, (id: string, farmId: string) => Promise<{ name: string } | null>> = {
  area: (id, farmId) =>
    prisma.area.findFirst({ where: { id, farmId }, select: { name: true } }),
  crop: (id, farmId) =>
    prisma.crop.findFirst({ where: { id, farmId }, select: { name: true } }),
  transaction: (id, farmId) =>
    prisma.transaction.findFirst({
      where: { id, farmId },
      select: { description: true },
    }).then((r) => r ? { name: r.description } : null),
  supplier: (id, farmId) =>
    prisma.supplier.findFirst({ where: { id, farmId }, select: { name: true } }),
}

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const membership = await getUserActiveFarm(user.id)
    if (!membership) {
      return NextResponse.json({ error: "Sem acesso" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const id = searchParams.get("id")

    if (!type || !id || !typeToModel[type]) {
      return NextResponse.json({ error: "Parametros invalidos" }, { status: 400 })
    }

    const result = await typeToModel[type](id, membership.farmId)
    if (!result) {
      return NextResponse.json({ error: "Nao encontrado" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
