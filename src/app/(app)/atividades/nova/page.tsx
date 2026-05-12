"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ClipboardList, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { activitySchema } from "@/lib/validators"
import { createActivity } from "@/actions/activities"
import { useFarm } from "@/providers/farm-provider"
import { ACTIVITY_STATUS_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

type ActivityFormValues = z.infer<typeof activitySchema>

export default function NovaAtividadePage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { activeFarm } = useFarm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ActivityFormValues>({
    resolver: zodResolver(activitySchema) as any,
    defaultValues: {
      activityTypeId: "",
      subtype: "",
      cropId: "",
      team: "",
      startDate: new Date(),
      status: "A_FAZER",
      notes: "",
      areaIds: [],
      inputUsages: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "inputUsages",
  })

  function onSubmit(values: ActivityFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createActivity(activeFarm.farmId, values)
        toast.success("Actividad registrada con éxito")
        router.push("/atividades")
      } catch (error) {
        toast.error("Error al registrar actividad")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Actividad</h1>
        <p className="text-muted-foreground mt-1">
          Registre una nueva actividad agrícola
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5" />
                Información de la Actividad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="activityTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Actividad</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID del tipo de actividad"
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
                  name="subtype"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subtipo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: Mecanizada, Manual"
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
                  name="team"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Equipo</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Nombre del equipo responsable"
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
                      <FormLabel>Fecha de Conclusión</FormLabel>
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione el estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(ACTIVITY_STATUS_LABELS).map(([value, label]) => (
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
                  name="areaIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Áreas (IDs separados por coma)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="id1, id2, id3"
                          disabled={isPending}
                          value={field.value?.join(", ") ?? ""}
                          onChange={(e) => {
                            const ids = e.target.value
                              .split(",")
                              .map((s) => s.trim())
                              .filter(Boolean)
                            field.onChange(ids)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Insumos Utilizados */}
          <Card>
            <CardHeader>
              <CardTitle>Insumos Utilizados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((item, index) => (
                <div key={item.id} className="flex items-end gap-3 rounded-md border p-3">
                  <FormField
                    control={form.control}
                    name={`inputUsages.${index}.inputId`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel className="text-xs">Insumo (ID)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ID del insumo"
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
                    name={`inputUsages.${index}.quantity`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel className="text-xs">Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            disabled={isPending}
                            {...field}
                            value={field.value != null ? String(field.value) : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`inputUsages.${index}.ratePerHa`}
                    render={({ field }) => (
                      <FormItem className="w-32">
                        <FormLabel className="text-xs">Dose/ha</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0"
                            disabled={isPending}
                            {...field}
                            value={field.value != null ? String(field.value) : ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="shrink-0"
                    onClick={() => remove(index)}
                    disabled={isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ inputId: "", quantity: 0, ratePerHa: undefined })}
                disabled={isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Insumo
              </Button>
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
                        placeholder="Observaciones sobre la actividad..."
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
              Registrar Actividad
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
