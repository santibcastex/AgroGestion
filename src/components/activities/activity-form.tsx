"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { InputCombobox } from "./input-combobox"
import { OperationCombobox } from "./operation-combobox"
import { TeamSelector, type TeamMember } from "./team-selector"
import { createActivity, createRealization } from "@/actions/activities"
import { UNIT_LABELS, formatNumber } from "@/lib/constants"
import { Plus, Trash2, Loader2 } from "lucide-react"
import type { ActivityKind, InputCategory, UnitOfMeasure } from "@/generated/prisma/client"

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

interface ActivityFormProps {
  farmId: string
  cropId: string
  kind: ActivityKind
  activityType: {
    id: string
    name: string
    subtypes: string[]
  }
  areas: AreaOption[]
  inputs: InputOption[]
  stocks: StockOption[]
  farmMembers: TeamMember[]
  contractors: TeamMember[]
  plannedActivityId?: string
  onSuccess?: () => void
  onCancel?: () => void
  defaultValues?: {
    subtype?: string
    areaIds?: string[]
    startDate?: string
    endDate?: string
    team?: string
    notes?: string
    stockId?: string
    inputUsages?: { inputId: string; quantity: number; ratePerHa?: number }[]
  }
}

interface InputUsageRow {
  inputId: string
  quantity: string
  ratePerHa: string
}

export function ActivityForm({
  farmId,
  cropId,
  kind,
  activityType,
  areas,
  inputs,
  stocks,
  farmMembers,
  contractors,
  plannedActivityId,
  onSuccess,
  onCancel,
  defaultValues,
}: ActivityFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [currentSubtypes, setCurrentSubtypes] = useState(activityType.subtypes)
  const [subtype, setSubtype] = useState(defaultValues?.subtype ?? "")
  const [selectedAreaIds, setSelectedAreaIds] = useState<string[]>(defaultValues?.areaIds ?? [])
  const [startDate, setStartDate] = useState(defaultValues?.startDate ?? "")
  const [endDate, setEndDate] = useState(defaultValues?.endDate ?? "")
  const [teamNames, setTeamNames] = useState<string[]>(
    defaultValues?.team ? defaultValues.team.split(", ").filter(Boolean) : []
  )
  const [notes, setNotes] = useState(defaultValues?.notes ?? "")
  const [stockId, setStockId] = useState(defaultValues?.stockId ?? "")
  const [inputUsages, setInputUsages] = useState<InputUsageRow[]>(
    defaultValues?.inputUsages?.map((u) => ({
      inputId: u.inputId,
      quantity: String(u.quantity),
      ratePerHa: u.ratePerHa != null ? String(u.ratePerHa) : "",
    })) ?? []
  )
  const [allContractors, setAllContractors] = useState(contractors)

  const totalHa = areas
    .filter((a) => selectedAreaIds.includes(a.id))
    .reduce((sum, a) => sum + a.sizeHa, 0)

  function toggleArea(areaId: string) {
    setSelectedAreaIds((prev) =>
      prev.includes(areaId) ? prev.filter((id) => id !== areaId) : [...prev, areaId]
    )
  }

  function addInputUsage() {
    setInputUsages((prev) => [...prev, { inputId: "", quantity: "", ratePerHa: "" }])
  }

  function removeInputUsage(index: number) {
    setInputUsages((prev) => prev.filter((_, i) => i !== index))
  }

  function updateInputUsage(index: number, field: keyof InputUsageRow, value: string) {
    setInputUsages((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    )
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const formData = {
      activityTypeId: activityType.id,
      subtype: subtype || undefined,
      cropId,
      team: teamNames.length > 0 ? teamNames.join(", ") : undefined,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      status: "A_FAZER" as const,
      kind,
      stockId: stockId || undefined,
      notes: notes || undefined,
      areaIds: selectedAreaIds,
      inputUsages: inputUsages
        .filter((u) => u.inputId && u.quantity)
        .map((u) => ({
          inputId: u.inputId,
          quantity: parseFloat(u.quantity),
          ratePerHa: u.ratePerHa ? parseFloat(u.ratePerHa) : undefined,
        })),
    }

    startTransition(async () => {
      if (plannedActivityId) {
        await createRealization(farmId, plannedActivityId, formData)
      } else {
        await createActivity(farmId, formData)
      }
      if (onSuccess) {
        onSuccess()
      } else {
        router.back()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Activity type display */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Tipo de actividad</p>
            <p className="font-semibold">{activityType.name}</p>
          </div>
          <Badge variant={kind === "PLANEJADO" ? "secondary" : "default"}>
            {kind === "PLANEJADO" ? "Planificación" : "Realización"}
          </Badge>
        </div>
      </div>

      {/* Subtype / Operation */}
      <div className="space-y-2">
        <Label>Operación</Label>
        <OperationCombobox
          subtypes={currentSubtypes}
          value={subtype}
          onSelect={setSubtype}
          onSubtypesUpdated={setCurrentSubtypes}
          farmId={farmId}
          activityTypeId={activityType.id}
        />
      </div>

      {/* Areas */}
      <div className="space-y-2">
        <Label>
          Áreas{" "}
          {selectedAreaIds.length > 0 && (
            <span className="text-muted-foreground font-normal">
              ({selectedAreaIds.length} seleccionada{selectedAreaIds.length > 1 ? "s" : ""},{" "}
              {formatNumber(totalHa)} ha)
            </span>
          )}
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {areas.map((area) => (
            <label
              key={area.id}
              className="flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer hover:bg-accent transition-colors"
            >
              <Checkbox
                checked={selectedAreaIds.includes(area.id)}
                onCheckedChange={() => toggleArea(area.id)}
              />
              <span className="text-sm flex-1">{area.name}</span>
              <span className="text-xs text-muted-foreground">{formatNumber(area.sizeHa)} ha</span>
            </label>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startDate">Fecha inicio *</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endDate">Fecha fin</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      {/* Team */}
      <div className="space-y-2">
        <Label>Equipo / Responsable</Label>
        <TeamSelector
          members={[...farmMembers, ...allContractors]}
          value={teamNames}
          onChange={setTeamNames}
          farmId={farmId}
          onContractorCreated={(c) => setAllContractors((prev) => [...prev, c])}
        />
      </div>

      {/* Stock */}
      {stocks.length > 0 && (
        <div className="space-y-2">
          <Label>Stock de origen</Label>
          <Select value={stockId} onValueChange={setStockId}>
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar stock..." />
            </SelectTrigger>
            <SelectContent>
              {stocks.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Input usages */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Insumos</Label>
          <Button type="button" variant="outline" size="sm" onClick={addInputUsage}>
            <Plus className="mr-1 h-3 w-3" />
            Agregar
          </Button>
        </div>
        {inputUsages.map((usage, i) => {
          const selectedInput = inputs.find((inp) => inp.id === usage.inputId)
          return (
            <div key={i} className="rounded-md border p-3 space-y-3">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <InputCombobox
                    inputs={inputs}
                    value={usage.inputId}
                    onSelect={(id) => updateInputUsage(i, "inputId", id)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInputUsage(i)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">
                    Cantidad total{selectedInput ? ` (${UNIT_LABELS[selectedInput.unit]})` : ""}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={usage.quantity}
                    onChange={(e) => updateInputUsage(i, "quantity", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">
                    Dosis por ha{selectedInput ? ` (${UNIT_LABELS[selectedInput.unit]}/ha)` : ""}
                  </Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={usage.ratePerHa}
                    onChange={(e) => updateInputUsage(i, "ratePerHa", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Observacoes</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anotacoes sobre a atividade..."
          rows={3}
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel ?? (() => router.back())} className="flex-1">
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isPending || selectedAreaIds.length === 0 || !startDate}
          className="flex-1"
        >
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {kind === "PLANEJADO" ? "Salvar Planejamento" : "Registrar Realizacao"}
        </Button>
      </div>
    </form>
  )
}
