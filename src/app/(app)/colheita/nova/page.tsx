"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Wheat } from "lucide-react"
import { toast } from "sonner"

import { harvestSchema } from "@/lib/validators"
import { createHarvest } from "@/actions/harvests"
import { useFarm } from "@/providers/farm-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

type HarvestFormValues = z.infer<typeof harvestSchema>

export default function NovaColheitaPage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { activeFarm } = useFarm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<HarvestFormValues>({
    resolver: zodResolver(harvestSchema) as any,
    defaultValues: {
      cropId: "",
      areaId: "",
      harvestDate: new Date(),
      totalTons: 0,
      buyerName: "",
      ticketNumber: "",
      notes: "",
    },
  })

  const numericField = (name: string, label: string, placeholder: string, step = "0.01") => (
    <FormField
      control={form.control}
      name={name as keyof HarvestFormValues}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step={step}
              placeholder={placeholder}
              disabled={isPending}
              className="h-9"
              {...field}
              value={field.value != null ? String(field.value) : ""}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )

  function onSubmit(values: HarvestFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createHarvest(activeFarm.farmId, values)
        toast.success("Cosecha registrada con éxito")
        router.push("/colheita")
      } catch (error) {
        toast.error("Error al registrar cosecha")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Cosecha</h1>
        <p className="text-muted-foreground mt-1">
          Registre los datos de una cosecha
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wheat className="h-5 w-5" />
                Información de la Cosecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="cropId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cosecha</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID de la cosecha"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (Parcela)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID del área"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="harvestDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Cosecha</FormLabel>
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

                {numericField("totalTons", "Total (Toneladas)", "0", "0.01")}

                <FormField
                  control={form.control}
                  name="ticketNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Ticket</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 12345"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="buyerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comprador / Planta</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del comprador"
                          disabled={isPending}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {numericField("salePrice", "Precio de Venta (R$/t)", "0", "0.01")}
              </div>
            </CardContent>
          </Card>

          {/* Parámetros de Calidad */}
          <Card>
            <CardHeader>
              <CardTitle>Parámetros de Calidad</CardTitle>
              <CardDescription>
                Indicadores de calidad de la caña de azúcar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {numericField("tch", "TCH (t caña/ha)", "80")}
                {numericField("atr", "ATR (kg/t)", "140")}
                {numericField("brix", "Brix (%)", "21")}
                {numericField("pol", "Pol (%)", "16")}
                {numericField("fiber", "Fibra (%)", "12")}
                {numericField("purity", "Pureza (%)", "88")}
              </div>
            </CardContent>
          </Card>

          {/* Observaciones */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Observaciones sobre la cosecha..."
                        disabled={isPending}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button type="submit" disabled={isPending} size="lg">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Cosecha
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
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
