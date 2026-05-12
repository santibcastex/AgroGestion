"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatCurrency, formatDate } from "@/lib/constants"
import { TransactionDetailSheet, type TransactionDetail } from "./transaction-detail-sheet"

interface TransactionsTableProps {
  transactions: TransactionDetail[]
  farmId: string
}

export function TransactionsTable({ transactions, farmId }: TransactionsTableProps) {
  const [selected, setSelected] = useState<TransactionDetail | null>(null)
  const [open, setOpen] = useState(false)

  function handleRowClick(transaction: TransactionDetail) {
    setSelected(transaction)
    setOpen(true)
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Proveedor</TableHead>
            <TableHead>Nº Factura</TableHead>
            <TableHead>Productos/Descripción</TableHead>
            <TableHead>Cuotas</TableHead>
            <TableHead className="text-right">Valor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const isDespesa = transaction.type === "DESPESA"
            const amount =
              typeof transaction.amount === "number"
                ? transaction.amount
                : transaction.amount.toNumber()
            return (
              <TableRow
                key={transaction.id}
                className="cursor-pointer"
                onClick={() => handleRowClick(transaction)}
              >
                <TableCell className="whitespace-nowrap">
                  {transaction.dueDate ? formatDate(transaction.dueDate) : "—"}
                </TableCell>
                <TableCell>{transaction.category?.name ?? "—"}</TableCell>
                <TableCell>{transaction.supplier?.name ?? "—"}</TableCell>
                <TableCell>{transaction.documentNumber ?? "—"}</TableCell>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {transaction.description}
                </TableCell>
                <TableCell>
                  {transaction.installmentNumber && transaction.totalInstallments
                    ? `${transaction.installmentNumber}/${transaction.totalInstallments}`
                    : "—"}
                </TableCell>
                <TableCell
                  className={`text-right font-medium whitespace-nowrap ${
                    isDespesa ? "text-red-500" : "text-green-500"
                  }`}
                >
                  {isDespesa ? "- " : ""}
                  {formatCurrency(amount)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      <TransactionDetailSheet
        transaction={selected}
        open={open}
        onOpenChange={setOpen}
        farmId={farmId}
      />
    </>
  )
}
