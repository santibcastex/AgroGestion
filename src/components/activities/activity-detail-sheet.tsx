"use client"

import { useState, useTransition } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_KIND_LABELS,
  ACTIVITY_KIND_COLORS,
  INPUT_CATEGORY_LABELS,
  UNIT_LABELS,
  formatDate,
  formatNumber,
} from "@/lib/constants"
import { updateActivityStatus, deleteActivity } from "@/actions/activities"
import type { ActivityStatus, ActivityKind, InputCategory, UnitOfMeasure } from "@/generated/prisma/client"
import {
  Calendar,
  MapPin,
  Package,
  FileText,
  ChevronRight,
  Trash2,
  Users,
  ClipboardCheck,
} from "lucide-react"

type ActivityDetail = {
  id: string
  code: string
  status: ActivityStatus
  kind: ActivityKind
  startDate: Date
  endDate: Date | null
  totalHa: number | null
  notes: string | null
  subtype: string | null
  team: string | null
  activityType: {
    id: string
    name: string
    color: string | null
    icon: string | null
    subtypes: string[]
  }
  crop: { id: string; name: string } | null
  activityAreas: {
    area: { id: string; name: string; sizeHa: number }
  }[]
  inputUsages: {
    inputId: string
    quantity: number
    ratePerHa: number | null
    input: { id: string; name: string; unit: UnitOfMeasure; category: InputCategory }
  }[]
  plannedActivity: { id: string; code: string; kind: ActivityKind } | null
  realizations: {
    id: string
    code: string
    status: ActivityStatus
    startDate: Date
    totalHa: number | null
  }[]
  stock: { id: string; name: string } | null
}

interface ActivityDetailSheetProps {
  activity: ActivityDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  farmId: string
  onRealize?: (activity: ActivityDetail) => void
  onDeleted?: () => void
}

const STATUS_ORDER: ActivityStatus[] = ["A_FAZER", "EM_PROGRESSO", "REVISAR", "CONCLUIDO"]

export function ActivityDetailSheet({
  activity,
  open,
  onOpenChange,
  farmId,
  onRealize,
  onDeleted,
}: ActivityDetailSheetProps) {
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!activity) return null

  const currentStatusIndex = STATUS_ORDER.indexOf(activity.status)
  const nextStatus = currentStatusIndex < STATUS_ORDER.length - 1
    ? STATUS_ORDER[currentStatusIndex + 1]
    : null

  function handleStatusChange(status: ActivityStatus) {
    startTransition(async () => {
      await updateActivityStatus(farmId, activity!.id, status)
      onOpenChange(false)
    })
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      await deleteActivity(farmId, activity!.id)
      setConfirmDelete(false)
      onOpenChange(false)
      onDeleted?.()
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs">
              {activity.code}
            </Badge>
            <Badge className={ACTIVITY_KIND_COLORS[activity.kind]}>
              {ACTIVITY_KIND_LABELS[activity.kind]}
            </Badge>
          </div>
          <SheetTitle className="text-xl">
            {activity.activityType.name}
            {activity.subtype && (
              <span className="text-muted-foreground font-normal"> / {activity.subtype}</span>
            )}
          </SheetTitle>
          <SheetDescription>
            {activity.crop ? `Cosecha: ${activity.crop.name}` : "Sin cosecha vinculada"}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-5">
          {/* Status */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Progreso</span>
            <div className="flex gap-1.5">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isPending}
                  className="flex-1"
                >
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      STATUS_ORDER.indexOf(s) <= currentStatusIndex
                        ? "bg-primary"
                        : "bg-muted"
                    }`}
                  />
                  <span className="text-[10px] text-muted-foreground mt-0.5 block text-center">
                    {ACTIVITY_STATUS_LABELS[s]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Inicio</p>
                <p className="text-sm font-medium">{formatDate(activity.startDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Fin</p>
                <p className="text-sm font-medium">
                  {activity.endDate ? formatDate(activity.endDate) : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Team */}
          {activity.team && (
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Equipo</p>
                <p className="text-sm font-medium">{activity.team}</p>
              </div>
            </div>
          )}

          {/* Areas */}
          {activity.activityAreas.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Áreas ({formatNumber(activity.totalHa ?? 0)} ha)
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {activity.activityAreas.map((aa) => (
                  <Badge key={aa.area.id} variant="secondary">
                    {aa.area.name} ({formatNumber(aa.area.sizeHa)} ha)
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Inputs */}
          {activity.inputUsages.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Insumos</span>
              </div>
              <div className="space-y-1.5">
                {activity.inputUsages.map((usage) => (
                  <div
                    key={usage.inputId}
                    className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">{usage.input.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        {INPUT_CATEGORY_LABELS[usage.input.category]}
                      </Badge>
                    </div>
                    <span className="text-muted-foreground">
                      {formatNumber(usage.quantity)} {UNIT_LABELS[usage.input.unit]}
                      {usage.ratePerHa != null && (
                        <span className="ml-1">
                          ({formatNumber(usage.ratePerHa)} /ha)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stock */}
          {activity.stock && (
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Stock</p>
                <p className="text-sm font-medium">{activity.stock.name}</p>
              </div>
            </div>
          )}

          {/* Notes */}
          {activity.notes && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">Observaciones</span>
              </div>
              <p className="text-sm pl-6">{activity.notes}</p>
            </div>
          )}

          {/* Planned activity reference */}
          {activity.plannedActivity && (
            <>
              <Separator />
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">
                  Planificación vinculada
                </span>
                <div className="flex items-center gap-2 text-sm">
                  <Badge variant="outline" className="font-mono">
                    {activity.plannedActivity.code}
                  </Badge>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  <span>Esta realización</span>
                </div>
              </div>
            </>
          )}

          {/* Realizations list (for planned activities) */}
          {activity.kind === "PLANEJADO" && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Realizaciones ({activity.realizations.length})
                </span>
                {activity.realizations.length > 0 ? (
                  <div className="space-y-1.5">
                    {activity.realizations.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-xs">
                            {r.code}
                          </Badge>
                          <span>{formatDate(r.startDate)}</span>
                        </div>
                        <Badge className={ACTIVITY_STATUS_COLORS[r.status]}>
                          {ACTIVITY_STATUS_LABELS[r.status]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Ninguna realización registrada.
                  </p>
                )}
                {onRealize && (
                  <Button
                    onClick={() => onRealize(activity)}
                    className="w-full"
                    variant="default"
                  >
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Registrar Realización
                  </Button>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2">
            {nextStatus && (
              <Button
                onClick={() => handleStatusChange(nextStatus)}
                disabled={isPending}
                className="flex-1"
              >
                Avanzar a {ACTIVITY_STATUS_LABELS[nextStatus]}
              </Button>
            )}
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {confirmDelete && (
            <p className="text-xs text-destructive text-center">
              Haga clic de nuevo para confirmar la eliminación
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
