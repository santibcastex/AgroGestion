"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, ShoppingCart, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { purchaseSchema } from "@/lib/validators"
import { createPurchase } from "@/actions/purchases"
import { useFarm } from "@/providers/farm-provider"
import { UNIT_LABELS } from "@/lib/constants"
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

type PurchaseFormValues = z.infer<typeof purchaseSchema>

export default function NovaCompraPage() {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { activeFarm } = useFarm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema) as any,
    defaultValues: {
      supplierId: "",
      purchaseDate: new Date(),
      invoiceNumber: "",
      invoiceKey: "",
      discountAmount: 0,
      freightAmount: 0,
      paymentTerms: "",
      notes: "",
      items: [
        {
          inputId: "",
          description: "",
          quantity: 0,
          unit: "KG",
          unitPrice: 0,
        },
      ],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
  })

  function onSubmit(values: PurchaseFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createPurchase(activeFarm.farmId, values)
        toast.success("Compra registrada con éxito")
        router.push("/compras")
      } catch (error) {
        toast.error("Error al registrar compra")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Compra</h1>
        <p className="text-muted-foreground mt-1">
          Registre una nueva orden de compra
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información del Proveedor y Factura */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Datos de la Compra
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Proveedor</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ID del proveedor"
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
                  name="purchaseDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Compra</FormLabel>
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
                  name="deliveryDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de Entrega</FormLabel>
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
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Factura</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 001234"
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
                  name="invoiceKey"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Clave de la Factura</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Clave de acceso de la NF-e (44 dígitos)"
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
                  name="paymentTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condiciones de Pago</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 30/60/90 días"
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
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descuento (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          disabled={isPending}
                          {...field}
                          value={field.value != null ? String(field.value) : "0"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="freightAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Flete (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0,00"
                          disabled={isPending}
                          {...field}
                          value={field.value != null ? String(field.value) : "0"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Ítems de la Compra */}
          <Card>
            <CardHeader>
              <CardTitle>Ítems de la Compra</CardTitle>
              <CardDescription>
                Agregue los productos e insumos de esta compra
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-md border p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Ítem {index + 1}</span>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => remove(index)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    <FormField
                      control={form.control}
                      name={`items.${index}.description`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 lg:col-span-1">
                          <FormLabel className="text-xs">Descripción</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Descripción del ítem"
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
                      name={`items.${index}.inputId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Insumo (ID)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="ID del insumo (opcional)"
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
                      name={`items.${index}.unit`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Unidad</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="h-9">
                                <SelectValue placeholder="Unidad" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(UNIT_LABELS).map(([value, label]) => (
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
                      name={`items.${index}.quantity`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Cantidad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0"
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

                    <FormField
                      control={form.control}
                      name={`items.${index}.unitPrice`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Precio Unitario (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0,00"
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
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    inputId: "",
                    description: "",
                    quantity: 0,
                    unit: "KG",
                    unitPrice: 0,
                  })
                }
                disabled={isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Agregar Ítem
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
                        placeholder="Observaciones sobre la compra..."
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
              Registrar Compra
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
