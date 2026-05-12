import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getPurchases } from "@/queries/purchases"
import { formatCurrency, formatDate } from "@/lib/constants"
import { Plus, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
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

const PURCHASE_STATUS_COLORS: Record<string, string> = {
  RASCUNHO: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  CONFIRMADA: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  RECEBIDA: "bg-green-100 text-green-800 hover:bg-green-100",
  CANCELADA: "bg-red-100 text-red-800 hover:bg-red-100",
}

const PURCHASE_STATUS_LABELS: Record<string, string> = {
  RASCUNHO: "Borrador",
  CONFIRMADA: "Confirmada",
  RECEBIDA: "Recibida",
  CANCELADA: "Cancelada",
}

export default async function ComprasPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const purchases = await getPurchases(farmId)

  const totalValue = purchases.reduce(
    (sum, p) => sum + Number(p.totalAmount ?? 0),
    0
  )
  const pendingCount = purchases.filter(
    (p) => p.status === "RASCUNHO" || p.status === "CONFIRMADA"
  ).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          <p className="text-muted-foreground">
            Gestione órdenes de compra y recepciones
          </p>
        </div>
        <Button asChild>
          <Link href="/compras/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Compra
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Compras
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{purchases.length}</div>
            <p className="text-xs text-muted-foreground">
              compra(s) registrada(s)
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              en compras
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              esperando recepción
            </p>
          </CardContent>
        </Card>
      </div>

      {purchases.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingCart className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Ninguna compra registrada.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/compras/nova">Crear Primera Compra</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">Ítems</TableHead>
                  <TableHead className="text-right">Valor Total</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell className="font-mono text-sm">
                      <Link
                        href={`/compras/${purchase.id}`}
                        className="hover:underline text-primary"
                      >
                        {purchase.code ?? `#${purchase.id.slice(0, 8)}`}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      {purchase.supplier?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      {purchase.purchaseDate
                        ? formatDate(purchase.purchaseDate)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      {purchase.items?.length ?? 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(Number(purchase.totalAmount ?? 0))}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          PURCHASE_STATUS_COLORS[purchase.status] ?? ""
                        }
                        variant="secondary"
                      >
                        {PURCHASE_STATUS_LABELS[purchase.status] ??
                          purchase.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
