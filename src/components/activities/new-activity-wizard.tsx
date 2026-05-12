"use client"

import { useState } from "react"
import { ActivityTypeSelector } from "./activity-type-selector"
import { ActivityForm } from "./activity-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ClipboardList, ClipboardCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ActivityKind, InputCategory, UnitOfMeasure } from "@/generated/prisma/client"
import type { TeamMember } from "./team-selector"

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

interface PlannedActivityData {
  id: string
  activityType: { id: string; name: string; subtypes: string[] }
  subtype: string | null
  areaIds: string[]
  inputUsages: { inputId: string; quantity: number; ratePerHa: number | null }[]
  team: string | null
  notes: string | null
  stockId: string | null
}

export interface NewActivityWizardProps {
  farmId: string
  cropId: string
  activityTypes: ActivityTypeOption[]
  areas: AreaOption[]
  inputs: InputOption[]
  stocks: StockOption[]
  farmMembers?: TeamMember[]
  contractors?: TeamMember[]
  preselectedType?: ActivityTypeOption
  preselectedKind?: ActivityKind
  plannedActivity?: PlannedActivityData
  onSuccess?: () => void
  onCancel?: () => void
  /** When provided, navigates to a full page instead of showing the form inline */
  onNavigateToForm?: (typeId: string, kind: ActivityKind, plannedActivityId?: string) => void
}

type Step = "type" | "kind" | "form"

export function NewActivityWizard({
  farmId,
  cropId,
  activityTypes,
  areas,
  inputs,
  stocks,
  farmMembers,
  contractors,
  preselectedType,
  preselectedKind,
  plannedActivity,
  onSuccess,
  onCancel,
  onNavigateToForm,
}: NewActivityWizardProps) {
  const initialStep: Step = preselectedType && preselectedKind
    ? "form"
    : preselectedType
    ? "kind"
    : "type"

  const [step, setStep] = useState<Step>(initialStep)
  const [selectedType, setSelectedType] = useState<ActivityTypeOption | null>(
    preselectedType ?? null
  )
  const [selectedKind, setSelectedKind] = useState<ActivityKind | null>(
    preselectedKind ?? null
  )

  function handleTypeSelect(type: ActivityTypeOption) {
    setSelectedType(type)
    setStep("kind")
  }

  function handleKindSelect(kind: ActivityKind) {
    if (onNavigateToForm && selectedType) {
      onNavigateToForm(selectedType.id, kind, plannedActivity?.id)
      return
    }
    setSelectedKind(kind)
    setStep("form")
  }

  function goBack() {
    if (step === "form") {
      if (plannedActivity) return
      setStep("kind")
    } else if (step === "kind") {
      setStep("type")
    }
  }

  function reset() {
    setStep("type")
    setSelectedType(null)
    setSelectedKind(null)
  }

  return (
    <div className="space-y-6">
      {/* Back button — only show when navigating within the wizard (not when pre-selected from sheet) */}
      {step !== "type" && !plannedActivity && !(preselectedType && preselectedKind) && (
        <Button variant="ghost" size="sm" onClick={goBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      )}

      {/* Step 1: Select type */}
      {step === "type" && (
        <ActivityTypeSelector types={activityTypes} onSelect={handleTypeSelect} />
      )}

      {/* Step 2: Choose kind */}
      {step === "kind" && selectedType && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">
              {selectedType.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              ¿Qué desea hacer?
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => handleKindSelect("PLANEJADO")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border-2 border-border p-8",
                "hover:border-primary hover:bg-accent transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
            >
              <ClipboardList className="h-10 w-10 text-purple-500" />
              <div className="text-center">
                <p className="font-semibold">Planificar</p>
                <p className="text-sm text-muted-foreground">
                  Defina lo que debe hacerse. No descuenta stock.
                </p>
              </div>
            </button>
            <button
              onClick={() => handleKindSelect("REALIZADO")}
              className={cn(
                "flex flex-col items-center gap-3 rounded-lg border-2 border-border p-8",
                "hover:border-primary hover:bg-accent transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              )}
            >
              <ClipboardCheck className="h-10 w-10 text-emerald-500" />
              <div className="text-center">
                <p className="font-semibold">Registrar Realización</p>
                <p className="text-sm text-muted-foreground">
                  Registre lo que fue ejecutado. Descuenta stock.
                </p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Form */}
      {step === "form" && selectedType && selectedKind && (
        <ActivityForm
          farmId={farmId}
          cropId={cropId}
          kind={selectedKind}
          activityType={selectedType}
          areas={areas}
          inputs={inputs}
          stocks={stocks}
          farmMembers={farmMembers ?? []}
          contractors={contractors ?? []}
          plannedActivityId={plannedActivity?.id}
          onSuccess={onSuccess}
          onCancel={onCancel}
          defaultValues={
            plannedActivity
              ? {
                  subtype: plannedActivity.subtype ?? undefined,
                  areaIds: plannedActivity.areaIds,
                  team: plannedActivity.team ?? undefined,
                  notes: plannedActivity.notes ?? undefined,
                  stockId: plannedActivity.stockId ?? undefined,
                  inputUsages: plannedActivity.inputUsages.map((u) => ({
                    inputId: u.inputId,
                    quantity: u.quantity,
                    ratePerHa: u.ratePerHa ?? undefined,
                  })),
                }
              : undefined
          }
        />
      )}
    </div>
  )
}
