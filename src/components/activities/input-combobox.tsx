"use client"

import { useState } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
import { INPUT_CATEGORY_LABELS, UNIT_LABELS } from "@/lib/constants"
import type { InputCategory, UnitOfMeasure } from "@/generated/prisma/client"

interface InputOption {
  id: string
  name: string
  category: InputCategory
  unit: UnitOfMeasure
  currentStock: number
}

interface InputComboboxProps {
  inputs: InputOption[]
  value?: string
  onSelect: (inputId: string) => void
  disabled?: boolean
}

export function InputCombobox({ inputs, value, onSelect, disabled }: InputComboboxProps) {
  const [open, setOpen] = useState(false)
  const selected = inputs.find((i) => i.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selected ? selected.name : "Seleccionar insumo..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar insumo..." />
          <CommandList>
            <CommandEmpty>Ningún insumo encontrado.</CommandEmpty>
            <CommandGroup>
              {inputs.map((input) => (
                <CommandItem
                  key={input.id}
                  value={input.name}
                  onSelect={() => {
                    onSelect(input.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === input.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-1 items-center justify-between">
                    <div>
                      <span className="font-medium">{input.name}</span>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {INPUT_CATEGORY_LABELS[input.category]}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Estoque: {input.currentStock.toFixed(1)} {UNIT_LABELS[input.unit]}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
