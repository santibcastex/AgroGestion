import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getBankAccounts, getTransactions } from "@/queries/financial"
import {
  formatCurrency,
  formatDate,
  TRANSACTION_STATUS_LABELS,
} from "@/lib/constants"
import {
  Plus,
  Landmark,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TransactionsTable } from "@/components/financial/transactions-table"
import { NewBankAccountDialog } from "@/components/financial/new-bank-account-dialog"
import { BankAccountsList } from "@/components/financial/bank-accounts-list"
import { DateRangeFilter, type DateRangeValue } from "@/components/financial/date-range-filter"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

function getDateRange(
  period: DateRangeValue,
  month?: string,
  year?: string,
): { startDate: Date; endDate: Date } | undefined {
  const now = new Date()
  switch (period) {
    case "last-30-days":
      return {
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now,
      }
    case "last-90-days":
      return {
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: now,
      }
    case "last-year":
      return {
        startDate: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        endDate: now,
      }
    case "specific-month": {
      // month = "YYYY-MM"
      const [y, m] = (month ?? "").split("-").map(Number)
      if (!y || !m) return undefined
      return {
        startDate: new Date(y, m - 1, 1),
        endDate: new Date(y, m, 0, 23, 59, 59),
      }
    }
    case "specific-year": {
      const y = Number(year)
      if (!y) return undefined
      return {
        startDate: new Date(y, 0, 1),
        endDate: new Date(y, 11, 31, 23, 59, 59),
      }
    }
    case "all":
      return undefined
  }
}

const STATUS_COLORS: Record<string, string> = {
  PENDENTE: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
  PAGO: "bg-green-100 text-green-800 hover:bg-green-100",
  ATRASADO: "bg-red-100 text-red-800 hover:bg-red-100",
  CANCELADO: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  PARCIAL: "bg-blue-100 text-blue-800 hover:bg-blue-100",
}

interface FinanceiroPageProps {
  searchParams: Promise<{ period?: string; month?: string; year?: string }>
}

export default async function FinanceiroPage({ searchParams }: FinanceiroPageProps) {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const { period: periodParam, month: monthParam, year } = await searchParams
  const period = (periodParam ?? "specific-month") as DateRangeValue
  const now = new Date()
  const month = monthParam ?? `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  const dateFilter = getDateRange(period, month, year)

  const [bankAccounts, allTransactions, despesas, receitas] = await Promise.all([
    getBankAccounts(farmId),
    getTransactions(farmId, dateFilter),
    getTransactions(farmId, { type: "DESPESA", ...dateFilter }),
    getTransactions(farmId, { type: "RECEITA", ...dateFilter }),
  ])

  const totalBalance = bankAccounts.reduce(
    (sum, account) => sum + Number(account.currentBalance ?? 0),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financiero</h1>
          <p className="text-muted-foreground">
            Gestione sus cuentas, ingresos y gastos
          </p>
        </div>
        <Button asChild>
          <Link href="/financeiro/nova-transacao">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Transacción
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalBalance)}
            </div>
            <p className="text-xs text-muted-foreground">
              {bankAccounts.length} cuenta(s) registrada(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Cobrar</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                receitas
                  .filter((t) => t.status === "PENDENTE")
                  .reduce((sum, t) => sum + Number(t.amount ?? 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {receitas.filter((t) => t.status === "PENDENTE").length}{" "}
              pendiente(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Pagar</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(
                despesas
                  .filter((t) => t.status === "PENDENTE")
                  .reduce((sum, t) => sum + Number(t.amount ?? 0), 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {despesas.filter((t) => t.status === "PENDENTE").length}{" "}
              pendiente(s)
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="contas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="contas">Cuentas</TabsTrigger>
          <TabsTrigger value="a-pagar">Por Pagar</TabsTrigger>
          <TabsTrigger value="a-receber">Por Cobrar</TabsTrigger>
          <TabsTrigger value="fluxo-caixa">Flujo de Caja</TabsTrigger>
          <TabsTrigger value="conciliacao">Conciliación</TabsTrigger>
        </TabsList>

        <TabsContent value="contas" className="space-y-4">
          <div className="flex gap-4">
            {/* Sidebar - Cuentas Bancarias */}
            <div className="w-72 shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Cuentas Bancarias</h3>
                <NewBankAccountDialog />
              </div>
              <BankAccountsList accounts={bankAccounts} />
            </div>

            {/* Tabla de Transacciones */}
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center justify-end">
                <DateRangeFilter period={period} month={month} year={year} />
              </div>
              {allTransactions.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Wallet className="h-10 w-10 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-center">
                      Ninguna transacción registrada.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-0">
                    <TransactionsTable transactions={allTransactions} farmId={farmId} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="a-pagar" className="space-y-4">
          {despesas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <ArrowUpCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Ningún gasto registrado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Cuotas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesas.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {transaction.dueDate
                            ? formatDate(transaction.dueDate)
                            : "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          {transaction.category?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {transaction.supplier?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {transaction.installmentNumber &&
                          transaction.totalInstallments
                            ? `${transaction.installmentNumber}/${transaction.totalInstallments}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(transaction.amount ?? 0))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              STATUS_COLORS[transaction.status] ?? ""
                            }
                            variant="secondary"
                          >
                            {TRANSACTION_STATUS_LABELS[transaction.status] ??
                              transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="a-receber" className="space-y-4">
          {receitas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <ArrowDownCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Ningún ingreso registrado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vencimiento</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Cuotas</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitas.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {transaction.dueDate
                            ? formatDate(transaction.dueDate)
                            : "—"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transaction.description}
                        </TableCell>
                        <TableCell>
                          {transaction.category?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {transaction.supplier?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          {transaction.installmentNumber &&
                          transaction.totalInstallments
                            ? `${transaction.installmentNumber}/${transaction.totalInstallments}`
                            : "—"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(transaction.amount ?? 0))}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              STATUS_COLORS[transaction.status] ?? ""
                            }
                            variant="secondary"
                          >
                            {TRANSACTION_STATUS_LABELS[transaction.status] ??
                              transaction.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="fluxo-caixa">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wallet className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Flujo de Caja</h3>
              <p className="text-muted-foreground text-center">
                Próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conciliacao">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Landmark className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-1">Conciliación Bancaria</h3>
              <p className="text-muted-foreground text-center">
                Próximamente
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
