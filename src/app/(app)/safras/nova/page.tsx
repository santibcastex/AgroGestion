"use client"

import { useTransition, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  Loader2,
  ArrowLeft,
  Wheat,
  ChevronDown,
  Check,
  MapPin,
  Search,
} from "lucide-react"
import { toast } from "sonner"

import { cropSchema } from "@/lib/validators"
import { createCrop } from "@/actions/crops"
import { useFarm } from "@/providers/farm-provider"
import {
  PLANTING_TYPE_LABELS,
  CULTURE_LABELS,
  MEASUREMENT_UNIT_LABELS,
  HARVEST_DISCOUNT_OPTIONS,
} from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

type CropFormValues = z.infer<typeof cropSchema>

interface AreaOption {
  id: string
  name: string
  sizeHa: number
}

interface StockOption {
  id: string
  name: string
  type: string
}

export default function NovaSafraPage() {
  const [isPending, startTransition] = useTransition()
  const [areas, setAreas] = useState<AreaOption[]>([])
  const [inputStocks, setInputStocks] = useState<StockOption[]>([])
  const [discountsOpen, setDiscountsOpen] = useState(false)
  const [areaSearch, setAreaSearch] = useState("")
  const router = useRouter()
  const { activeFarm } = useFarm()

  const form = useForm<CropFormValues>({
    resolver: zodResolver(cropSchema) as any,
    defaultValues: {
      name: "",
      culture: "CANA_DE_ACUCAR",
      plantingType: "CANA_PLANTA",
      status: "PLANEJADA",
      measurementUnit: "",
      grossWeightDiscounts: ["impureza", "umidade"],
      netWeightDiscounts: [],
      notes: "",
      areaIds: [],
    },
  })

  const watchCulture = form.watch("culture")
  const watchGrossDiscounts = form.watch("grossWeightDiscounts") ?? []
  const watchAreaIds = form.watch("areaIds") ?? []
  const hasImpureza = watchGrossDiscounts.includes("impureza")

  useEffect(() => {
    if (!activeFarm) return
    fetch(`/api/areas?farmId=${activeFarm.farmId}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setAreas(data))
      .catch(() => {})
    fetch(`/api/stocks?farmId=${activeFarm.farmId}&type=INSUMOS`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setInputStocks(data))
      .catch(() => {})
  }, [activeFarm])

  useEffect(() => {
    const CANA_DEFAULTS = ["impureza", "umidade"]
    if (watchCulture === "CANA_DE_ACUCAR") {
      const current = form.getValues("grossWeightDiscounts") ?? []
      const merged = Array.from(new Set([...current, ...CANA_DEFAULTS]))
      form.setValue("grossWeightDiscounts", merged)
    } else {
      form.setValue("grossWeightDiscounts", [])
      form.setValue("netWeightDiscounts", [])
    }
  }, [watchCulture])

  const selectedAreaHa = areas
    .filter((a) => watchAreaIds.includes(a.id))
    .reduce((sum, a) => sum + a.sizeHa, 0)

  const filteredAreas = areaSearch
    ? areas.filter((a) =>
        a.name.toLowerCase().includes(areaSearch.toLowerCase())
      )
    : areas

  function toggleArea(areaId: string) {
    if (isPending) return
    const current = form.getValues("areaIds") ?? []
    form.setValue(
      "areaIds",
      current.includes(areaId)
        ? current.filter((id: string) => id !== areaId)
        : [...current, areaId],
      { shouldValidate: true }
    )
  }

  function toggleAllAreas() {
    if (isPending) return
    const allSelected = watchAreaIds.length === areas.length
    form.setValue(
      "areaIds",
      allSelected ? [] : areas.map((a) => a.id),
      { shouldValidate: true }
    )
  }

  function onSubmit(values: CropFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createCrop(activeFarm.farmId, values)
        toast.success("Cosecha creada con éxito")
        router.push("/safras")
      } catch {
        toast.error("Error al crear la cosecha")
      }
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/safras">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Nueva Cosecha</h1>
          <p className="text-sm text-muted-foreground">
            Registre una nueva cosecha para su granja
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Informacoes Gerais */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Información General
            </h2>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la cosecha</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Caña 25/26" disabled={isPending} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="culture"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cultivo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione el cultivo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CULTURE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {watchCulture === "CANA_DE_ACUCAR" && (
                <FormField
                  control={form.control}
                  name="plantingType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Siembra</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PLANTING_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Inicio</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isPending}
                        value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Término</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        disabled={isPending}
                        value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator />

          {/* Areas */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Áreas
              </h2>
              {areas.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAllAreas}
                  className="text-xs text-primary hover:underline"
                >
                  {watchAreaIds.length === areas.length ? "Deseleccionar todas" : "Seleccionar todas"}
                </button>
              )}
            </div>

            <FormField
              control={form.control}
              name="areaIds"
              render={() => (
                <FormItem>
                  {areas.length > 0 ? (
                    <div className="rounded-lg border overflow-hidden">
                      {/* Search */}
                      <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/30">
                        <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                        <input
                          type="text"
                          placeholder="Buscar área..."
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {watchAreaIds.length > 0 && (
                          <span className="text-xs text-muted-foreground shrink-0">
                            {watchAreaIds.length}/{areas.length}
                          </span>
                        )}
                      </div>
                      {/* List */}
                      <div className="max-h-64 overflow-y-auto divide-y">
                        {filteredAreas.map((area) => {
                          const isSelected = watchAreaIds.includes(area.id)
                          return (
                            <div
                              key={area.id}
                              onClick={() => toggleArea(area.id)}
                              className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                                isSelected
                                  ? "bg-primary/5"
                                  : "hover:bg-muted/50"
                              }`}
                            >
                              <div
                                className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                                  isSelected
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-muted-foreground/30"
                                }`}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <span className="flex-1 text-sm">{area.name}</span>
                              <span className="text-xs text-muted-foreground tabular-nums">
                                {area.sizeHa} ha
                              </span>
                            </div>
                          )
                        })}
                        {filteredAreas.length === 0 && areaSearch && (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Ninguna área encontrada
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed py-8 text-center">
                      <MapPin className="mx-auto h-8 w-8 text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">
                        Ninguna área registrada.{" "}
                        <Link href="/areas/nova" className="text-primary hover:underline">
                          Registre áreas
                        </Link>{" "}
                        antes de crear una cosecha.
                      </p>
                    </div>
                  )}

                  {watchAreaIds.length > 0 && (
                    <p className="text-xs text-muted-foreground">
                      {watchAreaIds.length} {watchAreaIds.length === 1 ? "área seleccionada" : "áreas seleccionadas"}
                      {" "}&middot;{" "}{selectedAreaHa.toFixed(2)} ha
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <Separator />

          {/* Definicoes */}
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Definiciones
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="measurementUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de medida</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(MEASUREMENT_UNIT_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultInputStockId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock de insumos</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value ?? ""}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {inputStocks.map((stock) => (
                          <SelectItem key={stock.id} value={stock.id}>
                            {stock.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {inputStocks.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        Nenhum estoque cadastrado.
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <Separator />

          {/* Descontos de Colheita */}
          <Collapsible open={discountsOpen} onOpenChange={setDiscountsOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-between w-full group"
              >
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Descontos de Colheita
                  </h2>
                  {watchGrossDiscounts.length > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {watchGrossDiscounts.length}
                    </Badge>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    discountsOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 space-y-6">
              <FormField
                control={form.control}
                name="grossWeightDiscounts"
                render={() => (
                  <FormItem>
                    <FormLabel>Descontos no peso bruto</FormLabel>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {HARVEST_DISCOUNT_OPTIONS.map((discount) => (
                        <FormField
                          key={discount.key}
                          control={form.control}
                          name="grossWeightDiscounts"
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2 space-y-0 rounded-md border px-3 py-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(discount.key)}
                                  disabled={isPending}
                                  onCheckedChange={(checked) => {
                                    const current = field.value ?? []
                                    field.onChange(
                                      checked
                                        ? [...current, discount.key]
                                        : current.filter((k: string) => k !== discount.key)
                                    )
                                  }}
                                />
                              </FormControl>
                              <span className="text-sm">{discount.label}</span>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </FormItem>
                )}
              />

              {hasImpureza && (
                <>
                  <Separator />
                  <FormField
                    control={form.control}
                    name="netWeightDiscounts"
                    render={() => (
                      <FormItem>
                        <FormLabel>Descontos apos remocao de impurezas</FormLabel>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                          {HARVEST_DISCOUNT_OPTIONS.map((discount) => (
                            <FormField
                              key={discount.key}
                              control={form.control}
                              name="netWeightDiscounts"
                              render={({ field }) => (
                                <FormItem className="flex items-center gap-2 space-y-0 rounded-md border px-3 py-2">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(discount.key)}
                                      disabled={isPending}
                                      onCheckedChange={(checked) => {
                                        const current = field.value ?? []
                                        field.onChange(
                                          checked
                                            ? [...current, discount.key]
                                            : current.filter((k: string) => k !== discount.key)
                                        )
                                      }}
                                    />
                                  </FormControl>
                                  <span className="text-sm">{discount.label}</span>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                      </FormItem>
                    )}
                  />
                </>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Observacoes */}
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observacoes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Notas sobre esta safra..."
                    disabled={isPending}
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Safra
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
