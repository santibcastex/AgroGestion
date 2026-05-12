"use client"

import { useState } from "react"
import { Phone, MessageCircle, Mail } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_COLORS } from "@/lib/constants"
import {
  SupplierDetailsDialog,
  EditSupplierDialog,
  DeleteSupplierDialog,
} from "@/components/suppliers/supplier-dialog"
import type { SupplierType } from "@/generated/prisma/client"

interface Supplier {
  id: string
  name: string
  document: string | null
  types: SupplierType[]
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  notes: string | null
  contacts: {
    id: string
    name: string
    role: string | null
    phone: string | null
    whatsapp: string | null
    email: string | null
    notes: string | null
  }[]
  _count: { purchases: number; transactions: number }
}

interface SuppliersTableProps {
  farmId: string
  suppliers: Supplier[]
}

export function SuppliersTable({ farmId, suppliers }: SuppliersTableProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = suppliers.find((s) => s.id === selectedId) ?? null

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>CPF / CNPJ</TableHead>
            <TableHead>Contacto</TableHead>
            <TableHead>Compras</TableHead>
            <TableHead>Transacciones</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <TableRow
              key={supplier.id}
              className="cursor-pointer"
              onClick={() => setSelectedId(supplier.id)}
            >
              <TableCell className="font-medium">{supplier.name}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(supplier.types ?? []).map((t) => (
                    <Badge key={t} className={SUPPLIER_TYPE_COLORS[t]} variant="secondary">
                      {SUPPLIER_TYPE_LABELS[t]}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">
                {supplier.document || "—"}
              </TableCell>
              <TableCell>
                <div className="space-y-0.5">
                  {supplier.phone && (
                    <p className="flex items-center gap-1.5 text-sm">
                      <Phone className="size-3 text-muted-foreground shrink-0" />
                      {supplier.phone}
                    </p>
                  )}
                  {supplier.whatsapp && (
                    <a
                      href={`https://wa.me/55${supplier.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-sm text-green-400 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MessageCircle className="size-3 shrink-0" />
                      {supplier.whatsapp}
                    </a>
                  )}
                  {supplier.email && (
                    <a
                      href={`mailto:${supplier.email}`}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="size-3 shrink-0" />
                      {supplier.email}
                    </a>
                  )}
                  {!supplier.phone && !supplier.whatsapp && !supplier.email && (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{supplier._count.purchases}</TableCell>
              <TableCell>{supplier._count.transactions}</TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1">
                  <EditSupplierDialog farmId={farmId} supplier={supplier} />
                  <DeleteSupplierDialog
                    farmId={farmId}
                    supplierId={supplier.id}
                    supplierName={supplier.name}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {selected && (
        <SupplierDetailsDialog
          farmId={farmId}
          supplier={selected}
          open={!!selectedId}
          onOpenChange={(v) => { if (!v) setSelectedId(null) }}
        />
      )}
    </>
  )
}
