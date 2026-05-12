"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  formatCurrency,
  formatDate,
  TRANSACTION_TYPE_LABELS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
} from "@/lib/constants"
import { markTransactionPaid, deleteTransaction } from "@/actions/financial"
import {
  Calendar,
  FileText,
  Pencil,
  Trash2,
  Building2,
  Tag,
  Landmark,
  CheckCircle2,
  Hash,
} from "lucide-react"
import type { TransactionType, TransactionStatus } from "@/generated/prisma/client"

export type TransactionDetail = {
  id: string
  type: TransactionType
  description: string
  amount: number | { toNumber: () => number }
  status: TransactionStatus
  dueDate: Date | null
  paymentDate: Date | null
  competenceDate: Date | null
  documentNumber: string | null
  notes: string | null
  installmentNumber: number | null
  totalInstallments: number | null
  reconciled: boolean
  category: { name: string; color: string | null } | null
  bankAccount: { name: string } | null
  supplier: { name: string } | null
  installments: {
    id: string
    installmentNumber: number | null
    amount: number | { toNumber: () => number }
    status: TransactionStatus
    dueDate: Date | null
  }[]
}

interface TransactionDetailSheetProps {
  transaction: TransactionDetail | null
  open: boolean
  onOpenChange: (open: boolean) => void
  farmId: string
  onDeleted?: () => void
}

function toNumber(val: number | { toNumber: () => number }): number {
  return typeof val === "number" ? val : val.toNumber()
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
  farmId,
  onDeleted,
}: TransactionDetailSheetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!transaction) return null

  const isDespesa = transaction.type === "DESPESA"
  const isPaid = transaction.status === "PAGO" || transaction.status === "RECEBIDO"

  function handleMarkPaid() {
    startTransition(async () => {
      await markTransactionPaid(farmId, transaction!.id)
      onOpenChange(false)
    })
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    startTransition(async () => {
      await deleteTransaction(farmId, transaction!.id)
      setConfirmDelete(false)
      onOpenChange(false)
      onDeleted?.()
    })
  }

  function handleEdit() {
    router.push(`/financeiro/${transaction!.id}/editar`)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={isDespesa ? "text-red-500 border-red-500/30" : "text-green-500 border-green-500/30"}
            >
              {TRANSACTION_TYPE_LABELS[transaction.type]}
            </Badge>
            <Badge className={TRANSACTION_STATUS_COLORS[transaction.status]}>
              {TRANSACTION_STATUS_LABELS[transaction.status]}
            </Badge>
            {transaction.reconciled && (
              <Badge variant="outline" className="text-blue-500 border-blue-500/30">
                Conciliado
              </Badge>

            )}
          </div>
          <SheetTitle className="text-xl leading-tight">{transaction.description}</SheetTitle>
          <SheetDescription>
            <span
              className={`text-2xl font-bold ${isDespesa ? "text-red-500" : "text-green-500"}`}
            >
              {isDespesa ? "- " : ""}
              {formatCurrency(toNumber(transaction.amount))}
            </span>
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 space-y-5">
          {/* Datas */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Vencimiento</p>
                <p className="text-sm font-medium">
                  {transaction.dueDate ? formatDate(transaction.dueDate) : "—"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Pago</p>
                <p className="text-sm font-medium">
                  {transaction.paymentDate ? formatDate(transaction.paymentDate) : "—"}
                </p>
              </div>
            </div>
            {transaction.competenceDate && (
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Competencia</p>

                  <p className="text-sm font-medium">{formatDate(transaction.competenceDate)}</p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Detalhes */}
          <div className="space-y-3">
            {transaction.category && (
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Categoría</p>
                  <p className="text-sm font-medium">{transaction.category.name}</p>
                </div>
              </div>
            )}

            {transaction.supplier && (
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Proveedor</p>
                  <p className="text-sm font-medium">{transaction.supplier.name}</p>
                </div>
              </div>
            )}

            {transaction.bankAccount && (
              <div className="flex items-center gap-2">
                <Landmark className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Cuenta Bancaria</p>
                  <p className="text-sm font-medium">{transaction.bankAccount.name}</p>
                </div>
              </div>
            )}

            {transaction.documentNumber && (
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Número del Documento</p>
                  <p className="text-sm font-medium">{transaction.documentNumber}</p>
                </div>
              </div>
            )}
          </div>

          {/* Parcelas */}
          {transaction.installments.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Cuotas ({transaction.installments.length})
                </span>
                <div className="space-y-1.5">
                  {transaction.installments.map((inst) => (
                    <div
                      key={inst.id}
                      className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-xs">
                          {inst.installmentNumber}/{transaction.totalInstallments}
                        </span>
                        <span>{inst.dueDate ? formatDate(inst.dueDate) : "—"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatCurrency(toNumber(inst.amount))}</span>
                        <Badge className={TRANSACTION_STATUS_COLORS[inst.status]} variant="outline">
                          {TRANSACTION_STATUS_LABELS[inst.status]}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Observacoes */}
          {transaction.notes && (
            <>
              <Separator />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Observaciones</span>
                </div>
                <p className="text-sm pl-6">{transaction.notes}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Acoes */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleEdit}
              disabled={isPending}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </Button>
            {!isPaid && (
              <Button
                className="flex-1"
                onClick={handleMarkPaid}
                disabled={isPending}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {isDespesa ? "Marcar como Pagado" : "Marcar como Cobrado"}
              </Button>
            )}
            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={isPending}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {confirmDelete && (
            <p className="text-xs text-destructive text-center">
              Haga clic de nuevo para confirmar la eliminación
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
