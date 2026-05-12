"use client"

import { useState, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Landmark, Pencil, Star } from "lucide-react"
import { toast } from "sonner"

import { bankAccountSchema } from "@/lib/validators"

function toDateInputValue(value: unknown): string {
  if (!value) return ""
  const d = new Date(value as string | Date)
  if (isNaN(d.getTime())) return ""
  return d.toISOString().split("T")[0]
}
import { updateBankAccount, setDefaultBankAccount } from "@/actions/financial"
import { formatCurrency } from "@/lib/constants"
import { useFarm } from "@/providers/farm-provider"
import { Card, CardContent } from "@/components/ui/card"
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

type BankAccount = {
  id: string
  name: string
  bankName: string | null
  agency: string | null
  accountNumber: string | null
  initialBalance: number
  initialBalanceDate: Date
  isDefault: boolean
  currentBalance: number
}

interface BankAccountsListProps {
  accounts: BankAccount[]
}

function EditBankAccountDialog({
  account,
  open,
  onOpenChange,
}: {
  account: BankAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [isPending, startTransition] = useTransition()
  const { activeFarm } = useFarm()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<BankAccountFormValues>({
    resolver: zodResolver(bankAccountSchema) as any,
    defaultValues: {
      name: account.name,
      bankName: account.bankName ?? "",
      agency: account.agency ?? "",
      accountNumber: account.accountNumber ?? "",
      initialBalance: account.initialBalance,
      initialBalanceDate: new Date(account.initialBalanceDate),
    },
  })

  function onSubmit(values: BankAccountFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await updateBankAccount(activeFarm.farmId, account.id, values)
        toast.success("Cuenta actualizada con éxito")
        onOpenChange(false)
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error desconocido"
        toast.error(`Error al actualizar cuenta: ${msg}`)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Cuenta Bancaria</DialogTitle>
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export function BankAccountsList({ accounts }: BankAccountsListProps) {
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null)
  const [isPending, startTransition] = useTransition()
  const { activeFarm } = useFarm()

  function handleSetDefault(account: BankAccount) {
    if (!activeFarm || account.isDefault) return
    startTransition(async () => {
      await setDefaultBankAccount(activeFarm.farmId, account.id)
    })
  }

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-6">
          <Landmark className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-xs text-muted-foreground text-center">
            Ninguna cuenta registrada
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      {accounts.map((account) => (
        <Card key={account.id} className={account.isDefault ? "border-primary/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-semibold truncate">{account.name}</p>
                <p className="text-xs text-muted-foreground">{account.bankName ?? "—"}</p>
                {(account.agency || account.accountNumber) && (
                  <p className="text-xs text-muted-foreground">
                    {[account.agency && `Ag. ${account.agency}`, account.accountNumber && `Cc. ${account.accountNumber}`].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="text-lg font-bold mt-1">
                  {formatCurrency(account.currentBalance)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 ${account.isDefault ? "text-yellow-500" : "text-muted-foreground"}`}
                  onClick={() => handleSetDefault(account)}
                  disabled={isPending || account.isDefault}
                  title={account.isDefault ? "Cuenta predeterminada" : "Definir como cuenta predeterminada"}
                >
                  <Star className={`h-3.5 w-3.5 ${account.isDefault ? "fill-yellow-500" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground"
                  onClick={() => setEditingAccount(account)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {editingAccount && (
        <EditBankAccountDialog
          account={editingAccount}
          open={!!editingAccount}
          onOpenChange={(open) => !open && setEditingAccount(null)}
        />
      )}
    </>
  )
}
