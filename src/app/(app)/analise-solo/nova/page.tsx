"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, FlaskConical } from "lucide-react"
import { toast } from "sonner"

import { soilAnalysisSchema } from "@/lib/validators"
import { createSoilAnalysis } from "@/actions/soil-analysis"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type SoilFormValues = z.infer<typeof soilAnalysisSchema>

export default function NovaAnaliseSoloPage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { activeFarm } = useFarm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<SoilFormValues>({
    resolver: zodResolver(soilAnalysisSchema) as any,
    defaultValues: {
      areaId: "",
      sampleDate: new Date(),
      year: new Date().getFullYear(),
      depth: "0-20",
      pHType: "CaCl2",
      labName: "",
      labReportId: "",
      notes: "",
    },
  })

  function onSubmit(values: SoilFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createSoilAnalysis(activeFarm.farmId, values)
        toast.success("Análisis de suelo registrado con éxito")
        router.push("/analise-solo")
      } catch (error) {
        toast.error("Error al registrar análisis")
      }
    })
  }

  const numericField = (name: string, label: string, placeholder: string) => (
    <FormField
      control={form.control}
      name={name as keyof SoilFormValues}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              step="0.01"
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nuevo Análisis de Suelo</h1>
        <p className="text-muted-foreground mt-1">
          Registre los resultados de un análisis de suelo
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                Información de la Muestra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="areaId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Área (Parcela)</FormLabel>
                      <FormControl>
                        <Input placeholder="ID del área" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sampleDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Colecta</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isPending}
                          value={field.value instanceof Date ? field.value.toISOString().split("T")[0] : ""}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Año Agrícola</FormLabel>
                      <FormControl>
                        <Input type="number" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="depth"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profundidad (cm)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0-20">0-20 cm</SelectItem>
                          <SelectItem value="20-40">20-40 cm</SelectItem>
                          <SelectItem value="0-40">0-40 cm</SelectItem>
                          <SelectItem value="40-60">40-60 cm</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Laboratorio</FormLabel>
                      <FormControl>
                        <Input placeholder="Nombre del laboratorio" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labReportId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N. del Informe</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Macronutrientes */}
          <Card>
            <CardHeader>
              <CardTitle>Macronutrientes y Parámetros Principales</CardTitle>
              <CardDescription>Valores del informe de análisis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {numericField("pH", "pH (CaCl2)", "5.2")}
                {numericField("organicMatter", "M.O. (g/dm3)", "22")}
                {numericField("phosphorus", "P resina (mg/dm3)", "18")}
                {numericField("potassium", "K (mmolc/dm3)", "3.2")}
                {numericField("calcium", "Ca (mmolc/dm3)", "32")}
                {numericField("magnesium", "Mg (mmolc/dm3)", "12")}
                {numericField("aluminum", "Al (mmolc/dm3)", "0")}
                {numericField("hPlusAl", "H+Al (mmolc/dm3)", "28")}
              </div>
            </CardContent>
          </Card>

          {/* Valores Calculados */}
          <Card>
            <CardHeader>
              <CardTitle>Valores Calculados</CardTitle>
              <CardDescription>
                Completados automáticamente si se dejan en blanco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {numericField("sumOfBases", "SB (mmolc/dm3)", "47.2")}
                {numericField("ctc", "CTC (mmolc/dm3)", "75.2")}
                {numericField("baseSaturation", "V%", "63")}
                {numericField("aluminumSaturation", "m%", "0")}
              </div>
            </CardContent>
          </Card>

          {/* Micronutrientes */}
          <Card>
            <CardHeader>
              <CardTitle>Micronutrientes</CardTitle>
              <CardDescription>Valores en mg/dm3</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {numericField("sulfur", "S", "8")}
                {numericField("boron", "B", "0.3")}
                {numericField("copper", "Cu", "0.8")}
                {numericField("iron", "Fe", "18")}
                {numericField("manganese", "Mn", "5.2")}
                {numericField("zinc", "Zn", "1.1")}
              </div>
            </CardContent>
          </Card>

          {/* Propiedades Físicas */}
          <Card>
            <CardHeader>
              <CardTitle>Propiedades Físicas</CardTitle>
              <CardDescription>Granulometría y textura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {numericField("clayPercent", "Arcilla (%)", "35")}
                {numericField("siltPercent", "Limo (%)", "15")}
                {numericField("sandPercent", "Arena (%)", "50")}
                <FormField
                  control={form.control}
                  name="textureClass"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Clase Textural</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Arcillosa"
                          disabled={isPending}
                          className="h-9"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                        placeholder="Observaciones sobre la muestra o resultados..."
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
              Registrar Análisis
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
