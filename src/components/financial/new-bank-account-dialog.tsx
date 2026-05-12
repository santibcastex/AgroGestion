"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { bankAccountSchema } from "@/lib/validators"

function toDateInputValue(value: unknown): string {
  if (!value) return ""
  const d = new Date(value as string | Date)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().split("T")[0]
}
import { createBankAccount } from "@/actions/financial"
import { useFarm } from "@/providers/farm-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"

type BankAccountFormValues = z.infer<typeof bankAccountSchema>

export function NewBankAccountDialog() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { activeFarm } = useFarm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema) as any,
    defaultValues: {
      name: "",
      bankName: "",
      agency: "",
      accountNumber: "",
      initialBalance: 0,
      initialBalanceDate: new Date(),
    },
  })

  function onSubmit(values: BankAccountFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await createBankAccount(activeFarm.farmId, values)
        toast.success("Cuenta bancaria creada con éxito")
        setOpen(false)
        form.reset()
      } catch {
        toast.error("Error al crear cuenta bancaria")
      }
    })
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus className="h-3 w-3 mr-1" />
        Nueva
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva Cuenta Bancaria</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Nombre de la Cuenta</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Cuenta Principal" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankName"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Banco</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Banco del Brasil" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Agencia</FormLabel>
                      <FormControl>
                        <Input placeholder="1234-5" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="accountNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Cuenta</FormLabel>
                      <FormControl>
                        <Input placeholder="12345-6" disabled={isPending} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="initialBalance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Saldo Inicial (R$)</FormLabel>
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
                  name="initialBalanceDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha del Saldo Inicial</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          disabled={isPending}
                          value={toDateInputValue(field.value)}
                          onChange={(e) =>
                            field.onChange(e.target.value ? new Date(e.target.value) : new Date())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear Cuenta
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
