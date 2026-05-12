"use client"

import {
  Sprout,
  Bug,
  Droplets,
  Scissors,
  FlaskConical,
  FlaskRound,
  Settings,
  Truck,
  Tractor,
  SprayCan,
  MoreHorizontal,
  Wheat,
  Shovel,
  Leaf,
  Sun,
  Pipette,
  Drill,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface ActivityTypeOption {
  id: string
  name: string
  icon?: string | null
  color?: string | null
  subtypes: string[]
}

interface ActivityTypeSelectorProps {
  types: ActivityTypeOption[]
  onSelect: (type: ActivityTypeOption) => void
}

const ICON_MAP: Record<string, React.ElementType> = {
  // Seed values
  "spray-can": SprayCan,
  "flask-conical": FlaskConical,
  "flask-round": FlaskRound,
  truck: Truck,
  tractor: Tractor,
  sprout: Sprout,
  "more-horizontal": MoreHorizontal,
  // Aliases by name
  aplicacao: SprayCan,
  fertilizacao: Pipette,
  colheita: Wheat,
  plantio: Sprout,
  "preparo de solo": Shovel,
  "tratamento de semente": FlaskRound,
  outro: MoreHorizontal,
  // Generic fallbacks
  bug: Bug,
  droplets: Droplets,
  scissors: Scissors,
  flask: FlaskConical,
  settings: Settings,
  activity: Settings,
  leaf: Leaf,
  sun: Sun,
  drill: Drill,
}

// Fixed display order — types not listed here go to the end
const DISPLAY_ORDER = [
  "Preparación de Suelo",
  "Tratamiento de Semilla",
  "Siembra",
  "Fertilización",
  "Aplicación",
  "Cosecha",
  "Otro",
]

function getIconForType(type: ActivityTypeOption): React.ElementType {
  // First try the icon field
  if (type.icon) {
    const icon = ICON_MAP[type.icon]
    if (icon) return icon
  }
  // Fallback: try matching by name (lowercase)
  const byName = ICON_MAP[type.name.toLowerCase()]
  if (byName) return byName

  return Settings
}

export function ActivityTypeSelector({ types, onSelect }: ActivityTypeSelectorProps) {
  const sorted = [...types].sort((a, b) => {
    const ia = DISPLAY_ORDER.indexOf(a.name)
    const ib = DISPLAY_ORDER.indexOf(b.name)
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
  })

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Seleccionar tipo de actividad</h2>
        <p className="text-sm text-muted-foreground">
          Elija el tipo de actividad que desea registrar
        </p>
      </div>
      <div className="flex flex-col gap-1">
        {sorted.map((type) => {
          const Icon = getIconForType(type)
          return (
            <button
              key={type.id}
              onClick={() => onSelect(type)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-3",
                "hover:bg-accent transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              )}
            >
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: (type.color ?? "#22c55e") + "20" }}
              >
                <Icon className="h-4 w-4" style={{ color: type.color ?? "#22c55e" }} />
              </div>
              <span className="text-sm font-medium">{type.name}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
