import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getBankAccounts } from "@/queries/financial"
import { TransactionForm } from "@/components/financial/transaction-form"

export default async function NovaTransacaoPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const bankAccounts = await getBankAccounts(membership.farmId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Nueva Transacción</h1>
        <p className="text-muted-foreground mt-1">
          Registre un nuevo ingreso o gasto
        </p>
      </div>

      <TransactionForm
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
