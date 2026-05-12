import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { getActivityTypes, getActivityById } from "@/queries/activities"
import { getInputs } from "@/queries/inputs"
import { prisma } from "@/lib/prisma"
import { NovaAtividadeClient } from "./client"
import type { ActivityKind } from "@/generated/prisma/client"

interface Props {
  params: Promise<{ safraId: string }>
  searchParams: Promise<{ type?: string; kind?: string; planned?: string }>
}

export default async function NovaAtividadePage({ params, searchParams }: Props) {
  const { safraId } = await params
  const sp = await searchParams
  const user = await requireAuth()
  const activeFarm = await getUserActiveFarm(user.id)
  if (!activeFarm) return null
  const farmId = activeFarm.farmId

  // Fetch all data needed in parallel
  const [activityTypes, inputs, stocks, cropAreas, membershipsRaw, contractorsRaw] = await Promise.all([
    getActivityTypes(farmId),
    getInputs(farmId),
    prisma.stock.findMany({
      where: { farmId, active: true, type: "INSUMOS" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.cropArea.findMany({
      where: { cropId: safraId },
      include: { area: { select: { id: true, name: true, sizeHa: true } } },
    }),
    prisma.farmMembership.findMany({
      where: { farmId, active: true },
      include: { user: { select: { name: true } } },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.contractor.findMany({
      where: { farmId },
      orderBy: { name: "asc" },
    }),
  ])

  const areas = cropAreas.map((ca) => ca.area)

  const ROLE_LABELS: Record<string, string> = {
    OWNER: "Propietario",
    MANAGER: "Gestor",
    ACCOUNTANT: "Contador",
    WORKER: "Trabajador",
    VIEWER: "Visualizador",
  }

  const farmMembers = membershipsRaw.map((m) => ({
    id: m.id,
    name: m.user.name,
    type: "member" as const,
    role: ROLE_LABELS[m.role] ?? m.role,
  }))

  const contractors = contractorsRaw.map((c) => ({
    id: c.id,
    name: c.name,
    type: "contractor" as const,
    role: "Tercerizado",
  }))

  // Pre-select type if provided in URL
  const preselectedType = sp.type
    ? activityTypes.find((t) => t.id === sp.type) ?? undefined
    : undefined

  // Pre-select kind if provided in URL
  const preselectedKind = sp.kind === "PLANEJADO" || sp.kind === "REALIZADO"
    ? (sp.kind as ActivityKind)
    : undefined

  // Load planned activity data if creating realization
  let plannedActivity = undefined
  if (sp.planned) {
    const planned = await getActivityById(farmId, sp.planned)
    if (planned && planned.kind === "PLANEJADO") {
      plannedActivity = {
        id: planned.id,
        activityType: {
          id: planned.activityType.id,
          name: planned.activityType.name,
          subtypes: planned.activityType.subtypes,
        },
        subtype: planned.subtype,
        areaIds: planned.activityAreas.map((aa) => aa.area.id),
        inputUsages: planned.inputUsages.map((u) => ({
          inputId: u.inputId,
          quantity: u.quantity,
          ratePerHa: u.ratePerHa,
        })),
        team: planned.team,
        notes: planned.notes,
        stockId: planned.stockId,
      }
    }
  }

  // Title based on context
  const isRealization = !!plannedActivity
  const title = isRealization ? "Registrar Realización" : "Nueva Actividad"
  const subtitle = isRealization && preselectedType
    ? `Realización para ${preselectedType.name}`
    : "Planificar o registrar una actividad"

  return (
    <NovaAtividadeClient
      safraId={safraId}
      farmId={farmId}
      activityTypes={activityTypes}
      areas={areas}
      inputs={inputs}
      stocks={stocks}
      farmMembers={farmMembers}
      contractors={contractors}
      preselectedType={preselectedType}
      preselectedKind={preselectedKind}
      plannedActivity={plannedActivity}
      title={title}
      subtitle={subtitle}
    />
  )
}
