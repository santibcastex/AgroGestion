"use client"

import { useState, useTransition } from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { addSubtypeToActivityType } from "@/actions/activities"

interface OperationComboboxProps {
  subtypes: string[]
  value: string
  onSelect: (value: string) => void
  onSubtypesUpdated: (subtypes: string[]) => void
  farmId: string
  activityTypeId: string
}

export function OperationCombobox({
  subtypes,
  value,
  onSelect,
  onSubtypesUpdated,
  farmId,
  activityTypeId,
}: OperationComboboxProps) {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    const trimmed = newName.trim()
    if (!trimmed) return

    startTransition(async () => {
      const result = await addSubtypeToActivityType(farmId, activityTypeId, trimmed)
      if (result.success) {
        onSubtypesUpdated(result.subtypes)
        onSelect(trimmed)
        setNewName("")
        setCreating(false)
        setOpen(false)
      }
    })
  }

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setCreating(false) }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || "Seleccionar operación..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        {creating ? (
          <div className="p-3 space-y-3">
            <p className="text-sm font-medium">Nueva operación</p>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la operación..."
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleCreate() }
                if (e.key === "Escape") setCreating(false)
              }}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => setCreating(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                className="flex-1"
                onClick={handleCreate}
                disabled={isPending || !newName.trim()}
              >
                {isPending && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                Crear
              </Button>
            </div>
          </div>
        ) : (
          <Command>
            <CommandInput placeholder="Buscar operación..." />
            <CommandList>
              <CommandEmpty>Ninguna operación encontrada.</CommandEmpty>
              <CommandGroup>
                {subtypes.map((st) => (
                  <CommandItem
                    key={st}
                    value={st}
                    onSelect={() => {
                      onSelect(st)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === st ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {st}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandGroup>
                <CommandItem
                  onSelect={() => setCreating(true)}
                  className="text-muted-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva operación...
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        )}
      </PopoverContent>
    </Popover>
  )
}
