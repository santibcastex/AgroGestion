"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { ActivityDetailSheet } from "./activity-detail-sheet"
import { NewActivityWizard } from "./new-activity-wizard"
import {
  ACTIVITY_STATUS_LABELS,
  ACTIVITY_STATUS_COLORS,
  ACTIVITY_KIND_LABELS,
  ACTIVITY_KIND_COLORS,
  formatDate,
  formatNumber,
} from "@/lib/constants"
import { Plus } from "lucide-react"
import type { ActivityStatus, ActivityKind, InputCategory, UnitOfMeasure } from "@/generated/prisma/client"

type ActivityRow = {
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

interface ActivityTypeOption {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  subtypes: string[]
}

interface AreaOption {
  id: string
  name: string
  sizeHa: number
}

interface InputOption {
  id: string
  name: string
  category: InputCategory
  unit: UnitOfMeasure
  currentStock: number
}

interface StockOption {
  id: string
  name: string
}

interface ActivitiesTableProps {
  activities: ActivityRow[]
  farmId: string
  safraId: string
  activityTypes: ActivityTypeOption[]
  areas: AreaOption[]
  inputs: InputOption[]
  stocks: StockOption[]
}

export function ActivitiesTable({
  activities,
  farmId,
  safraId,
  activityTypes,
  areas,
  inputs,
  stocks,
}: ActivitiesTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedActivity, setSelectedActivity] = useState<ActivityRow | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [sheetPreselectedType, setSheetPreselectedType] = useState<ActivityTypeOption | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [kindFilter, setKindFilter] = useState<string>("all")

  // Auto-open the new activity sheet when ?novo=1 is in the URL
  useEffect(() => {
    if (searchParams.get("novo")) {
      // If a type ID is in the URL, pre-select it so the sheet opens at the kind step
      const typeId = searchParams.get("type")
      if (typeId) {
        const found = activityTypes.find((t) => t.id === typeId)
        setSheetPreselectedType(found)
      } else {
        setSheetPreselectedType(undefined)
      }
      setDialogOpen(true)
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [searchParams, activityTypes])

  const filtered = activities.filter((a) => {
    if (statusFilter !== "all" && a.status !== statusFilter) return false
    if (kindFilter !== "all" && a.kind !== kindFilter) return false
    return true
  })

  const counts = {
    total: activities.length,
    aFazer: activities.filter((a) => a.status === "A_FAZER").length,
    emProgresso: activities.filter((a) => a.status === "EM_PROGRESSO").length,
    revisar: activities.filter((a) => a.status === "REVISAR").length,
    concluido: activities.filter((a) => a.status === "CONCLUIDO").length,
  }

  function handleRowClick(activity: ActivityRow) {
    setSelectedActivity(activity)
    setSheetOpen(true)
  }

  function handleRealize(activity: ActivityRow) {
    setSheetOpen(false)
    // Navigate directly to the form page for realization
    const params = new URLSearchParams({
      type: activity.activityType.id,
      kind: "REALIZADO",
      planned: activity.id,
    })
    router.push(`/safras/${safraId}/atividades/nova?${params.toString()}`)
  }

  function handleNewActivity() {
    setSheetPreselectedType(undefined)
    setDialogOpen(true)
  }

  function handleNavigateToForm(typeId: string, kind: string, plannedActivityId?: string) {
    setDialogOpen(false)
    const params = new URLSearchParams({ type: typeId, kind })
    if (plannedActivityId) params.set("planned", plannedActivityId)
    router.push(`/safras/${safraId}/atividades/nova?${params.toString()}`)
  }

  function handleDialogClose() {
    setDialogOpen(false)
  }

  return (
    <>
      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-sm py-1 px-3">
          {counts.total} total
        </Badge>
        <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30 text-sm py-1 px-3">
          {counts.aFazer} por hacer
        </Badge>
        <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 text-sm py-1 px-3">
          {counts.emProgresso} en progreso
        </Badge>
        <Badge className="bg-orange-500/20 text-orange-600 border-orange-500/30 text-sm py-1 px-3">
          {counts.revisar} revisar
        </Badge>
        <Badge className="bg-green-500/20 text-green-600 border-green-500/30 text-sm py-1 px-3">
          {counts.concluido} concluido
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="A_FAZER">Por Hacer</SelectItem>
            <SelectItem value="EM_PROGRESSO">En Progreso</SelectItem>
            <SelectItem value="REVISAR">Revisar</SelectItem>
            <SelectItem value="CONCLUIDO">Concluido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={kindFilter} onValueChange={setKindFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="PLANEJADO">Planificado</SelectItem>
            <SelectItem value="REALIZADO">Realizado</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button onClick={handleNewActivity}>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Actividad
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">Estado</TableHead>
              <TableHead className="w-[90px]">Código</TableHead>
              <TableHead>Tipo / Operación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead>Áreas</TableHead>
              <TableHead className="text-right">ha</TableHead>
              <TableHead>Insumos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Ninguna actividad encontrada
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((activity) => (
                <TableRow
                  key={activity.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(activity)}
                >
                  <TableCell>
                    <Badge className={ACTIVITY_STATUS_COLORS[activity.status] + " text-xs"}>
                      {ACTIVITY_STATUS_LABELS[activity.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{activity.code}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{activity.activityType.name}</span>
                      {activity.subtype && (
                        <span className="text-muted-foreground"> / {activity.subtype}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={ACTIVITY_KIND_COLORS[activity.kind] + " text-xs"}>
                      {ACTIVITY_KIND_LABELS[activity.kind]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(activity.startDate)}
                    {activity.endDate && (
                      <span className="text-muted-foreground">
                        {" - "}
                        {formatDate(activity.endDate)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {activity.activityAreas.slice(0, 3).map((aa) => (
                        <Badge key={aa.area.id} variant="secondary" className="text-xs">
                          {aa.area.name}
                        </Badge>
                      ))}
                      {activity.activityAreas.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{activity.activityAreas.length - 3}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {activity.totalHa != null ? formatNumber(activity.totalHa) : "—"}
                  </TableCell>
                  <TableCell>
                    {activity.inputUsages.length > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {activity.inputUsages.length} insumo{activity.inputUsages.length > 1 ? "s" : ""}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Detail sheet */}
      <ActivityDetailSheet
        activity={selectedActivity}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        farmId={farmId}
        onRealize={handleRealize}
        onDeleted={() => router.refresh()}
      />

      {/* New activity sheet — only type & kind selection steps */}
      <Sheet open={dialogOpen} onOpenChange={(open) => { if (!open) handleDialogClose() }}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nueva Actividad</SheetTitle>
            <SheetDescription>
              Seleccione el tipo y modo de la actividad
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <NewActivityWizard
              key={sheetPreselectedType?.id ?? "new"}
              farmId={farmId}
              cropId={safraId}
              activityTypes={activityTypes}
              areas={areas}
              inputs={inputs}
              stocks={stocks}
              preselectedType={sheetPreselectedType}
              onNavigateToForm={handleNavigateToForm}
              onCancel={handleDialogClose}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
