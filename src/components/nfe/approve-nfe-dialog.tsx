"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Check } from "lucide-react"
import { toast } from "sonner"

import { approveNfe } from "@/actions/nfe"
import { useFarm } from "@/providers/farm-provider"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatCurrency } from "@/lib/constants"

interface Supplier {
  id: string
  name: string
  document: string | null
}

interface Category {
  id: string
  name: string
}

interface BankAccount {
  id: string
  name: string
}

interface ApproveNfeDialogProps {
  nfeImportId: string
  emitenteNome: string | null
  emitenteCnpj: string | null
  valorTotal: number
  dataEmissao: Date | null
  suppliers: Supplier[]
  categories: Category[]
  bankAccounts: BankAccount[]
  children?: React.ReactNode
}

export function ApproveNfeDialog({
  nfeImportId,
  emitenteNome,
  emitenteCnpj,
  valorTotal,
  dataEmissao,
  suppliers,
  categories,
  bankAccounts,
  children,
}: ApproveNfeDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [supplierId, setSupplierId] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [bankAccountId, setBankAccountId] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const { activeFarm } = useFarm()
  const router = useRouter()

  // Pre-select matching supplier by CNPJ
  useEffect(() => {
    if (emitenteCnpj && suppliers.length > 0) {
      const cleanCnpj = emitenteCnpj.replace(/[.\-\/]/g, "")
      const match = suppliers.find(
        (s) => s.document?.replace(/[.\-\/]/g, "") === cleanCnpj
      )
      if (match) setSupplierId(match.id)
    }
  }, [emitenteCnpj, suppliers])

  function handleApprove() {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await approveNfe(activeFarm.farmId, {
          nfeImportId,
          supplierId: supplierId || undefined,
          categoryId: categoryId || undefined,
          bankAccountId: bankAccountId || undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes: notes || undefined,
        })
        toast.success("Factura aprobada con éxito")
        setOpen(false)
        router.refresh()
      } catch (error: any) {
        toast.error(error?.message || "Error al aprobar factura")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button size="sm">
            <Check className="mr-2 h-4 w-4" />
            Aprobar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Aprobar Factura</DialogTitle>
          <DialogDescription>
            Al aprobar, se creará una transacción financiera (gasto) y una
            compra con los ítems de la factura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border p-3 space-y-1">
            <p className="text-sm text-muted-foreground">Emisor</p>
            <p className="font-medium">{emitenteNome || "—"}</p>
            <p className="text-xs text-muted-foreground">
              CNPJ: {emitenteCnpj || "—"}
            </p>
            <p className="text-lg font-bold">{formatCurrency(valorTotal)}</p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Proveedor</label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Auto-crear del emisor" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Si ninguno es seleccionado, se creará un nuevo proveedor
              automáticamente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Categoría Financiera
              </label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Otros Costos" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Cuenta Bancaria
              </label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Ninguna" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((ba) => (
                    <SelectItem key={ba.id} value={ba.id}>
                      {ba.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Fecha de Vencimiento
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="Usar fecha de emisión"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Si no se informa, se usará la fecha de emisión de la factura
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Observaciones
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones opcionales..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Aprobar Factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
