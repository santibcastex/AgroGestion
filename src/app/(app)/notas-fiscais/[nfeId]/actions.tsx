"use client"

import { ApproveNfeDialog } from "@/components/nfe/approve-nfe-dialog"
import { RejectNfeDialog } from "@/components/nfe/reject-nfe-dialog"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"

interface NfeDetailActionsProps {
  nfe: {
    id: string
    emitenteNome: string | null
    emitenteCnpj: string | null
    valorTotal: number
    dataEmissao: Date | null
  }
  suppliers: { id: string; name: string; document: string | null }[]
  categories: { id: string; name: string }[]
  bankAccounts: { id: string; name: string }[]
}

export function NfeDetailActions({
  nfe,
  suppliers,
  categories,
  bankAccounts,
}: NfeDetailActionsProps) {
  return (
    <div className="flex gap-3">
      <ApproveNfeDialog
        nfeImportId={nfe.id}
        emitenteNome={nfe.emitenteNome}
        emitenteCnpj={nfe.emitenteCnpj}
        valorTotal={nfe.valorTotal}
        dataEmissao={nfe.dataEmissao}
        suppliers={suppliers}
        categories={categories}
        bankAccounts={bankAccounts}
      >
        <Button>
          <Check className="mr-2 h-4 w-4" />
          Aprobar Factura
        </Button>
      </ApproveNfeDialog>

      <RejectNfeDialog nfeImportId={nfe.id}>
        <Button variant="outline">
          <X className="mr-2 h-4 w-4" />
          Rechazar Factura
        </Button>
      </RejectNfeDialog>
    </div>
  )
}
