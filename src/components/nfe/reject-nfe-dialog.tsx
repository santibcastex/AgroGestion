"use client"

import { useTransition, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, X } from "lucide-react"
import { toast } from "sonner"

import { rejectNfe } from "@/actions/nfe"
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
import { Textarea } from "@/components/ui/textarea"

interface RejectNfeDialogProps {
  nfeImportId: string
  children?: React.ReactNode
}

export function RejectNfeDialog({ nfeImportId, children }: RejectNfeDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const { activeFarm } = useFarm()
  const router = useRouter()

  function handleReject() {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await rejectNfe(activeFarm.farmId, {
          nfeImportId,
          rejectionReason: reason || undefined,
        })
        toast.success("Factura rechazada")
        setOpen(false)
        router.refresh()
      } catch (error: any) {
        toast.error(error?.message || "Error al rechazar factura")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm">
            <X className="mr-2 h-4 w-4" />
            Rechazar
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rechazar Factura</DialogTitle>
          <DialogDescription>
            La factura será marcada como rechazada y no generará registros
            financieros.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <label className="text-sm font-medium mb-2 block">
            Motivo del rechazo (opcional)
          </label>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ej: Factura de otra empresa, duplicidad..."
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleReject} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Rechazar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
