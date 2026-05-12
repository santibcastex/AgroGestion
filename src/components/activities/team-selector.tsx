"use client"

import { useState, useTransition } from "react"
import { Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { createContractor } from "@/actions/contractors"

export interface TeamMember {
  id: string
  name: string
  type: "member" | "contractor"
  role?: string
}

interface TeamSelectorProps {
  members: TeamMember[]
  value: string[]
  onChange: (names: string[]) => void
  farmId: string
  onContractorCreated?: (contractor: TeamMember) => void
}

export function TeamSelector({
  members,
  value,
  onChange,
  farmId,
  onContractorCreated,
}: TeamSelectorProps) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [isPending, startTransition] = useTransition()

  const farmMembers = members.filter((m) => m.type === "member")
  const contractors = members.filter((m) => m.type === "contractor")

  function toggleName(name: string) {
    if (value.includes(name)) {
      onChange(value.filter((n) => n !== name))
    } else {
      onChange([...value, name])
    }
  }

  function handleCreateContractor() {
    const trimmed = newName.trim()
    if (!trimmed) return

    startTransition(async () => {
      const contractor = await createContractor(farmId, {
        name: trimmed,
        phone: newPhone.trim() || undefined,
      })
      const member: TeamMember = {
        id: contractor.id,
        name: contractor.name,
        type: "contractor",
        role: "Tercerizado",
      }
      onContractorCreated?.(member)
      onChange([...value, contractor.name])
      setNewName("")
      setNewPhone("")
      setDialogOpen(false)
    })
  }

  const displayText = value.length > 0
    ? value.join(", ")
    : "Seleccionar equipo..."

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <span className="truncate">{displayText}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar persona..." />
            <CommandList>
              <CommandEmpty>Ninguna persona encontrada.</CommandEmpty>
              {farmMembers.length > 0 && (
                <CommandGroup heading="Miembros">
                  {farmMembers.map((m) => (
                    <CommandItem
                      key={m.id}
                      value={m.name}
                      onSelect={() => toggleName(m.name)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value.includes(m.name) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="flex flex-1 items-center justify-between">
                        <span>{m.name}</span>
                        {m.role && (
                          <Badge variant="secondary" className="text-xs ml-2">
                            {m.role}
                          </Badge>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              <CommandGroup heading="Tercerizado">
                {contractors.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={c.name}
                    onSelect={() => toggleName(c.name)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(c.name) ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex flex-1 items-center justify-between">
                      <span>{c.name}</span>
                      <Badge variant="outline" className="text-xs ml-2">
                        Tercerizado
                      </Badge>
                    </div>
                  </CommandItem>
                ))}
                <CommandItem
                  onSelect={() => { setOpen(false); setDialogOpen(true) }}
                  className="text-muted-foreground"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nuevo tercerizado...
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Nuevo tercerizado</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="contractor-name">Nombre *</Label>
              <Input
                id="contractor-name"
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nombre del tercerizado..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); handleCreateContractor() }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractor-phone">Teléfono</Label>
              <Input
                id="contractor-phone"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateContractor}
              disabled={isPending || !newName.trim()}
            >
              {isPending && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Crear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
