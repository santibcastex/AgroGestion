import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getCropById } from "@/queries/crops"
import { getAreaById } from "@/queries/areas"
import { getCropCosts } from "@/queries/costs"
import { formatCurrency, formatNumber, UNIT_LABELS } from "@/lib/constants"
import { DollarSign } from "lucide-react"

import { CostDonutChart } from "@/components/costs/cost-donut-chart"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function AreaCustoPage({
  params,
}: {
  params: Promise<{ safraId: string; areaId: string }>
}) {
  const { safraId, areaId } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const crop = await getCropById(membership.farmId, safraId)
  if (!crop) notFound()

  const area = await getAreaById(membership.farmId, areaId)
  if (!area) notFound()

  const { categories, totalCost } = await getCropCosts(
    membership.farmId,
    safraId,
    areaId,
    "REALIZADO"
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Costo Real</h1>
        <p className="text-muted-foreground">
          Costos de la parcela {area.name} en esta cosecha
        </p>
      </div>

      {totalCost === 0 && categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ningún costo registrado
            </h3>
            <p className="text-muted-foreground text-sm">
              Los costos de las actividades e insumos de esta parcela en esta cosecha aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Donut Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Costo Real</CardTitle>
              <CardDescription>
                Distribución de costos por categoría
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostDonutChart categories={categories} totalCost={totalCost} />
            </CardContent>
          </Card>

          {/* Cost breakdown table */}
          <div className="space-y-4">
            {/* Table header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 text-sm text-muted-foreground font-medium">
              <div />
              <div className="w-24 text-right">Real</div>
              <div className="w-28 text-right">Valor un. (R$)</div>
              <div className="w-28 text-right">Total (R$)</div>
              <div className="w-24 text-right">Participación</div>
            </div>

            {categories.map((cat) => (
              <Card key={cat.key}>
                <CardContent className="p-0">
                  {/* Category header */}
                  <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold">{cat.label}</h3>
                    <div className="w-24" />
                    <div className="w-28" />
                    <div className="w-28 text-right font-bold tabular-nums">
                      {formatCurrency(cat.totalCost)}
                    </div>
                    <div className="w-24 text-right font-bold tabular-nums">
                      {formatNumber(cat.percentage)}%
                    </div>
                  </div>

                  {/* Items */}
                  {cat.items.length === 0 ? (
                    <div className="px-6 py-4 text-sm text-muted-foreground">
                      Ningún ítem en esta categoría.
                    </div>
                  ) : (
                    <CostCategoryItems
                      items={cat.items}
                      hasSubcategories={cat.key === "DEFENSIVOS"}
                    />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CostCategoryItems({
  items,
  hasSubcategories,
}: {
  items: {
    inputId: string
    name: string
    subcategory?: string
    quantity: number
    unit: string
    avgUnitPrice: number
    totalCost: number
    percentage: number
  }[]
  hasSubcategories: boolean
}) {
  if (!hasSubcategories) {
    return (
      <div className="divide-y">
        {items.map((item) => (
          <CostItemRow key={item.inputId} item={item} />
        ))}
      </div>
    )
  }

  const groups = new Map<string, typeof items>()
  for (const item of items) {
    const sub = item.subcategory ?? "Otro"
    if (!groups.has(sub)) groups.set(sub, [])
    groups.get(sub)!.push(item)
  }

  return (
    <div className="divide-y">
      {Array.from(groups.entries()).map(([subcategory, subItems]) => (
        <div key={subcategory}>
          <div className="px-6 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider border-b bg-muted/30">
            {subcategory}
          </div>
          {subItems.map((item) => (
            <CostItemRow key={item.inputId} item={item} />
          ))}
        </div>
      ))}
    </div>
  )
}

function CostItemRow({
  item,
}: {
  item: {
    name: string
    quantity: number
    unit: string
    avgUnitPrice: number
    totalCost: number
    percentage: number
  }
}) {
  const unitLabel =
    (UNIT_LABELS as Record<string, string>)[item.unit] ?? item.unit

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-6 py-3 hover:bg-muted/50">
      <div className="text-sm font-medium">{item.name}</div>
      <div className="w-24 text-right text-sm text-muted-foreground tabular-nums">
        {item.quantity > 0
          ? `${formatNumber(item.quantity)} ${unitLabel}`
          : "—"}
      </div>
      <div className="w-28 text-right text-sm tabular-nums">
        {item.avgUnitPrice > 0 ? formatCurrency(item.avgUnitPrice) : (
          <span className="text-red-500">0,00</span>
        )}
      </div>
      <div className="w-28 text-right text-sm font-medium tabular-nums">
        {formatCurrency(item.totalCost)}
      </div>
      <div className="w-24 text-right text-sm text-muted-foreground tabular-nums">
        {formatNumber(item.percentage)}%
      </div>
    </div>
  )
}
