import { redirect } from "next/navigation"
import { Store, Package, Wrench, MoreHorizontal } from "lucide-react"

import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { getSuppliers } from "@/queries/suppliers"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { CreateSupplierDialog } from "@/components/suppliers/supplier-dialog"
import { SuppliersTable } from "@/components/suppliers/suppliers-table"

export default async function FornecedoresPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const farmId = membership.farmId
  const suppliers = await getSuppliers(farmId)

  const totalProdutos = suppliers.filter((s) => s.types?.includes("PRODUTOS")).length
  const totalServicos = suppliers.filter((s) => s.types?.includes("SERVICOS")).length
  const totalOutro = suppliers.filter((s) => s.types?.includes("OUTRO")).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Proveedores</h1>
          <p className="text-muted-foreground">
            Gestione los proveedores de productos, servicios y otros
          </p>
        </div>
        <CreateSupplierDialog farmId={farmId} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productos</CardTitle>
            <Package className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProdutos}</div>
            <p className="text-xs text-muted-foreground">
              proveedores de productos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
            <Wrench className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalServicos}</div>
            <p className="text-xs text-muted-foreground">
              proveedores de servicios
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Otros</CardTitle>
            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOutro}</div>
            <p className="text-xs text-muted-foreground">
              otras categorías
            </p>
          </CardContent>
        </Card>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="h-10 w-10 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              Ningún proveedor registrado aún.
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              Haga clic en &ldquo;Nuevo Proveedor&rdquo; para comenzar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <SuppliersTable farmId={farmId} suppliers={suppliers} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
