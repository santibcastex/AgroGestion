import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { getCropActivities, getActivityTypes } from "@/queries/activities"
import { getInputs } from "@/queries/inputs"
import { prisma } from "@/lib/prisma"
import { ActivitiesTable } from "@/components/activities/activities-table"
import { ClipboardList } from "lucide-react"
import { NewActivityButton } from "@/components/activities/new-activity-button"

interface Props {
  params: Promise<{ safraId: string }>
}

export default async function SafraAtividadesPage({ params }: Props) {
  const { safraId } = await params
  const user = await requireAuth()
  const activeFarm = await getUserActiveFarm(user.id)
  if (!activeFarm) return null
  const farmId = activeFarm.farmId

  const [activities, activityTypes, inputs, stocks, cropAreas] = await Promise.all([
    getCropActivities(farmId, safraId),
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
  ])

  const areas = cropAreas.map((ca) => ca.area)

  if (activities.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
          <p className="text-muted-foreground">
            Actividades vinculadas a esta cosecha
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border py-16">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">
            Ninguna actividad en esta cosecha
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Cree una actividad para comenzar a planificar o registrar el trabajo.
          </p>
          <NewActivityButton
            farmId={farmId}
            cropId={safraId}
            activityTypes={activityTypes}
            areas={areas}
            inputs={inputs}
            stocks={stocks}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Actividades</h1>
        <p className="text-muted-foreground">
          {activities.length} actividad{activities.length !== 1 ? "es" : ""} en esta cosecha
        </p>
      </div>
      <ActivitiesTable
        activities={activities}
        farmId={farmId}
        safraId={safraId}
        activityTypes={activityTypes}
        areas={areas}
        inputs={inputs}
        stocks={stocks}
      />
    </div>
  )
}
