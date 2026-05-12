"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { NewActivityWizard } from "./new-activity-wizard"
import { Plus } from "lucide-react"
import type { InputCategory, UnitOfMeasure } from "@/generated/prisma/client"

interface NewActivityButtonProps {
  farmId: string
  cropId: string
  activityTypes: {
    id: string
    name: string
    icon?: string | null
    color?: string | null
    subtypes: string[]
  }[]
  areas: { id: string; name: string; sizeHa: number }[]
  inputs: { id: string; name: string; category: InputCategory; unit: UnitOfMeasure; currentStock: number }[]
  stocks: { id: string; name: string }[]
}

export function NewActivityButton({
  farmId,
  cropId,
  activityTypes,
  areas,
  inputs,
  stocks,
}: NewActivityButtonProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  // Auto-open sheet when ?novo=1 is in the URL
  useEffect(() => {
    if (searchParams.get("novo")) {
      setOpen(true)
      window.history.replaceState(null, "", window.location.pathname)
    }
  }, [searchParams])

  function handleNavigateToForm(typeId: string, kind: string, plannedActivityId?: string) {
    setOpen(false)
    const params = new URLSearchParams({ type: typeId, kind })
    if (plannedActivityId) params.set("planned", plannedActivityId)
    router.push(`/safras/${cropId}/atividades/nova?${params.toString()}`)
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nueva Actividad
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Nueva Actividad</SheetTitle>
            <SheetDescription>
              Seleccione el tipo y modo de la actividad
            </SheetDescription>
          </SheetHeader>
          <div className="px-4">
            <NewActivityWizard
              farmId={farmId}
              cropId={cropId}
              activityTypes={activityTypes}
              areas={areas}
              inputs={inputs}
              stocks={stocks}
              onNavigateToForm={handleNavigateToForm}
              onCancel={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
