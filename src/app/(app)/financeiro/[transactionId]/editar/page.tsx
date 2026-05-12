import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getTransactionById, getBankAccounts } from "@/queries/financial"
import { TransactionForm } from "@/components/financial/transaction-form"

interface EditTransactionPageProps {
  params: Promise<{ transactionId: string }>
}

export default async function EditTransactionPage({ params }: EditTransactionPageProps) {
  const { transactionId } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const [transaction, bankAccounts] = await Promise.all([
    getTransactionById(membership.farmId, transactionId),
    getBankAccounts(membership.farmId),
  ])
  if (!transaction) notFound()

  const toDate = (d: Date | null) => (d ? new Date(d) : undefined)

  const defaultValues = {
    type: transaction.type,
    description: transaction.description,
    amount: Number(transaction.amount),
    dueDate: toDate(transaction.dueDate) ?? new Date(),
    paymentDate: toDate(transaction.paymentDate),
    competenceDate: toDate(transaction.competenceDate),
    categoryId: transaction.categoryId ?? "",
    bankAccountId: transaction.bankAccountId ?? "",
    supplierId: transaction.supplierId ?? "",
    documentNumber: transaction.documentNumber ?? "",
    notes: transaction.notes ?? "",
    installments: transaction.totalInstallments ?? 1,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Transacción</h1>
        <p className="text-muted-foreground mt-1">
          Actualice los datos de la transacción
        </p>
      </div>

      <TransactionForm
        transactionId={transactionId}
        defaultValues={defaultValues}
        bankAccounts={bankAccounts.map((a) => ({
          id: a.id,
          name: a.name,
          isDefault: a.isDefault,
          bankName: a.bankName,
          agency: a.agency,
          accountNumber: a.accountNumber,
        }))}
      />
    </div>
  )
}
