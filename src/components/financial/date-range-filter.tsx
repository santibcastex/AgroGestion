"use client"

import { useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type PeriodMode =
  | "last-30-days"
  | "last-90-days"
  | "last-year"
  | "all"
  | "specific-month"
  | "specific-year"

export type DateRangeValue = PeriodMode

const MONTH_NAMES_SHORT = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const MONTH_NAMES_FULL = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const MIN_YEAR = 2020

function getAvailableYears(): number[] {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let y = currentYear; y >= MIN_YEAR; y--) years.push(y)
  return years
}

function parseYearMonth(value: string): { year: number; month: number } | null {
  const [y, m] = value.split("-").map(Number)
  if (!y || !m) return null
  return { year: y, month: m }
}

function formatMonthLabel(value: string): string {
  const parsed = parseYearMonth(value)
  if (!parsed) return "Seleccionar mes"
  return `${MONTH_NAMES_FULL[parsed.month - 1]} ${parsed.year}`
}

// Scrollable year picker used in both annual and monthly views.
// Uses a fractional position animated with requestAnimationFrame for smooth movement.
function YearScrollPicker({
  selected,
  onSelect,
}: {
  selected: number
  onSelect: (year: number) => void
}) {
  const years = getAvailableYears()
  const maxYear = years[0]
  const minYear = years[years.length - 1]

  // position is a continuous float: 0 = maxYear at center, 1 = maxYear-1, etc.
  // So position N means year (maxYear - N) is centered.
  const yearToPos = (y: number) => maxYear - y

  const targetPos = useRef(yearToPos(selected))
  const currentPos = useRef(yearToPos(selected))
  const rafRef = useRef<number>(0)
  const [, forceRender] = useState(0)

  function animateTo(pos: number) {
    const clamped = Math.max(0, Math.min(maxYear - minYear, pos))
    targetPos.current = clamped

    if (rafRef.current) return // already animating
    function tick() {
      const diff = targetPos.current - currentPos.current
      if (Math.abs(diff) < 0.01) {
        currentPos.current = targetPos.current
        rafRef.current = 0
        forceRender((n) => n + 1)
        return
      }
      // Lerp for smooth deceleration
      currentPos.current += diff * 0.25
      forceRender((n) => n + 1)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  function navigate(delta: number) {
    const newTarget = Math.round(targetPos.current) + delta
    animateTo(Math.max(0, Math.min(maxYear - minYear, newTarget)))
  }

  function handleWheel(e: React.WheelEvent) {
    e.preventDefault()
    e.stopPropagation()
    // deltaY > 0 = scroll down = older years = higher position
    navigate(e.deltaY > 0 ? 1 : -1)
  }

  const pos = currentPos.current
  const centeredYear = maxYear - Math.round(pos)
  const fractional = pos - Math.round(pos) // -0.5 to 0.5

  const canGoUp = centeredYear < maxYear
  const canGoDown = centeredYear > minYear

  // Render enough items to fill the view during any fractional offset
  const ITEM_H = 30
  const VISIBLE = 5
  const slots = [-3, -2, -1, 0, 1, 2, 3]

  return (
    <div className="flex flex-col items-center" onWheel={handleWheel}>
      <button
        onClick={() => navigate(-1)}
        disabled={!canGoUp}
        className={cn(
          "p-1 transition-opacity",
          canGoUp ? "opacity-60 hover:opacity-100" : "opacity-20 cursor-default",
        )}
      >
        <ChevronUp className="h-4 w-4" />
      </button>
      <div
        className="overflow-hidden relative"
        style={{ height: VISIBLE * ITEM_H, width: 120 }}
      >
        {slots.map((offset) => {
          const y = centeredYear - offset
          const isInRange = y >= minYear && y <= maxYear
          // Visual position from center: offset + fractional shift
          const visualPos = offset + fractional
          // Place item relative to center of container
          const centerPx = (VISIBLE * ITEM_H) / 2
          const topPx = centerPx + visualPos * ITEM_H - ITEM_H / 2

          const dist = Math.abs(visualPos)
          const opacity = dist <= 0.3 ? 1 : dist <= 1.3 ? 0.5 : 0.2
          const scale = dist <= 0.3 ? 1 : dist <= 1.3 ? 0.85 : 0.75

          return (
            <button
              key={offset}
              onClick={() => isInRange && onSelect(y)}
              disabled={!isInRange}
              className={cn(
                "absolute left-0 right-0 flex items-center justify-center rounded-md",
                !isInRange && "invisible",
                y === selected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : isInRange && "hover:bg-accent hover:text-accent-foreground",
              )}
              style={{
                height: ITEM_H,
                top: topPx,
                opacity,
                transform: `scale(${scale})`,
                fontSize: dist <= 0.3 ? 14 : 12,
              }}
            >
              {isInRange ? y : ""}
            </button>
          )
        })}
      </div>
      <button
        onClick={() => navigate(1)}
        disabled={!canGoDown}
        className={cn(
          "p-1 transition-opacity",
          canGoDown ? "opacity-60 hover:opacity-100" : "opacity-20 cursor-default",
        )}
      >
        <ChevronDown className="h-4 w-4" />
      </button>
    </div>
  )
}

// Month/Year picker with year drill-down
function MonthYearPicker({
  value,
  onChange,
}: {
  value: string // "YYYY-MM"
  onChange: (value: string) => void
}) {
  const now = new Date()
  const parsed = parseYearMonth(value)
  const [pickerYear, setPickerYear] = useState(parsed?.year ?? now.getFullYear())
  const [showYearPicker, setShowYearPicker] = useState(false)
  const selectedMonth = parsed?.month ?? null
  const selectedYear = parsed?.year ?? null
  const maxYear = now.getFullYear()

  if (showYearPicker) {
    return (
      <div className="p-3 w-56">
        <div className="flex items-center justify-center mb-2">
          <span className="text-sm font-semibold text-muted-foreground">Seleccionar año</span>
        </div>
        <YearScrollPicker
          selected={pickerYear}
          onSelect={(y) => {
            setPickerYear(y)
            setShowYearPicker(false)
          }}
        />
      </div>
    )
  }

  return (
    <div className="p-3 w-56">
      {/* Year navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPickerYear((y) => Math.max(MIN_YEAR, y - 1))}
          disabled={pickerYear <= MIN_YEAR}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <button
          onClick={() => setShowYearPicker(true)}
          className="text-sm font-semibold hover:text-primary transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-accent"
        >
          {pickerYear}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setPickerYear((y) => Math.min(maxYear, y + 1))}
          disabled={pickerYear >= maxYear}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 gap-1">
        {MONTH_NAMES_SHORT.map((name, idx) => {
          const monthNum = idx + 1
          const isSelected = selectedYear === pickerYear && selectedMonth === monthNum
          const isFuture = pickerYear === maxYear && monthNum > now.getMonth() + 1
          return (
            <button
              key={name}
              disabled={isFuture}
              onClick={() => onChange(`${pickerYear}-${String(monthNum).padStart(2, "0")}`)}
              className={cn(
                "rounded-md py-1.5 text-sm transition-colors",
                isSelected
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "hover:bg-accent hover:text-accent-foreground",
                isFuture && "opacity-30 cursor-not-allowed",
              )}
            >
              {name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DateRangeFilterProps {
  period: PeriodMode
  month?: string
  year?: string
}

export function DateRangeFilter({ period, month, year }: DateRangeFilterProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [monthPickerOpen, setMonthPickerOpen] = useState(false)
  const [yearPickerOpen, setYearPickerOpen] = useState(false)

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === undefined) params.delete(key)
      else params.set(key, value)
    }
    router.push(`?${params.toString()}`)
  }

  function handlePeriodChange(newPeriod: string) {
    const params: Record<string, string | undefined> = {
      period: newPeriod,
      month: undefined,
      year: undefined,
    }
    if (newPeriod === "specific-month") {
      const now = new Date()
      params.month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    }
    if (newPeriod === "specific-year") {
      params.year = String(new Date().getFullYear())
    }
    updateParams(params)
  }

  const defaultMonth = month ?? (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  })()
  const defaultYear = year ?? String(new Date().getFullYear())

  return (
    <div className="flex items-center gap-2">
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-44 h-8 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Período específico</SelectLabel>
            <SelectItem value="specific-month">Mensual</SelectItem>
            <SelectItem value="specific-year">Anual</SelectItem>
          </SelectGroup>
          <SelectGroup>
            <SelectLabel>Períodos fijos</SelectLabel>
            <SelectItem value="last-30-days">Últimos 30 días</SelectItem>
            <SelectItem value="last-90-days">Últimos 90 días</SelectItem>
            <SelectItem value="last-year">Último año</SelectItem>
            <SelectItem value="all">Todo el tiempo</SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {period === "specific-month" && (
        <Popover open={monthPickerOpen} onOpenChange={setMonthPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm font-normal">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatMonthLabel(defaultMonth)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <MonthYearPicker
              value={defaultMonth}
              onChange={(v) => {
                updateParams({ period: "specific-month", month: v, year: undefined })
                setMonthPickerOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      )}

      {period === "specific-year" && (
        <Popover open={yearPickerOpen} onOpenChange={setYearPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5 text-sm font-normal">
              <CalendarDays className="h-3.5 w-3.5" />
              {defaultYear}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="p-3 w-44">
              <div className="flex items-center justify-center mb-2">
                <span className="text-sm font-semibold text-muted-foreground">Seleccionar año</span>
              </div>
              <YearScrollPicker
                selected={Number(defaultYear)}
                onSelect={(y) => {
                  updateParams({ period: "specific-year", year: String(y), month: undefined })
                  setYearPickerOpen(false)
                }}
              />
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
