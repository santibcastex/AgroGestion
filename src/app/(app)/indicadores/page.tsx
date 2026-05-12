import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { formatCurrency } from "@/lib/constants"
import { prisma } from "@/lib/prisma"
import {
  DollarSign,
  TrendingUp,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  FlaskConical,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default async function IndicadoresPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const [totalRevenue, totalExpense, totalArea] = await Promise.all([
    prisma.transaction.aggregate({
      where: { farmId, type: "RECEITA" },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { farmId, type: "DESPESA" },
      _sum: { amount: true },
    }),
    prisma.area.aggregate({
      where: { farmId },
      _sum: { sizeHa: true },
    }),
  ])

  const revenue = Number(totalRevenue._sum.amount ?? 0)
  const expense = Number(totalExpense._sum.amount ?? 0)
  const hectares = Number(totalArea._sum.sizeHa ?? 0)
  const costPerHectare = hectares > 0 ? expense / hectares : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Indicadores</h1>
        <p className="text-muted-foreground">
          Informes e indicadores de desempeño de la granja
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Costo por Hectárea
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(costPerHectare)}
            </div>
            <p className="text-xs text-muted-foreground">
              {hectares > 0
                ? `basado en ${hectares.toFixed(1)} ha`
                : "ningún área registrada"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productividad Media (TCH)
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">
              datos de cosecha pendientes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingreso Total
            </CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              todos los ingresos registrados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Gasto Total
            </CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(expense)}
            </div>
            <p className="text-xs text-muted-foreground">
              todos los gastos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Gastos por Categoría
            </CardTitle>
            <CardDescription>
              Distribución de los costos por categoría
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-8 w-3/5" />
              <Skeleton className="h-8 w-2/5" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              En desarrollo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Evolución Mensual
            </CardTitle>
            <CardDescription>
              Ingresos x Gastos a lo largo de los meses
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-11/12" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-10/12" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              En desarrollo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Costo por Hectárea por Cosecha
            </CardTitle>
            <CardDescription>
              Comparativo entre cosechas
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-8 w-5/6" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              En desarrollo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" />
              Fertilidad del Suelo
            </CardTitle>
            <CardDescription>
              Evolución de los indicadores de suelo por área
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="space-y-3 w-full">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-4/5" />
              <Skeleton className="h-8 w-full" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              En desarrollo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
