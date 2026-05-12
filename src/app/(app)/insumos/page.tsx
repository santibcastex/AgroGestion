import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getInputs } from "@/queries/inputs"
import { formatNumber } from "@/lib/constants"
import Link from "next/link"
import { Plus, Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

function getCategoryLabel(category: string) {
  switch (category) {
    case "FERTILIZER":
      return "Fertilizante"
    case "HERBICIDE":
      return "Herbicida"
    case "INSECTICIDE":
      return "Insecticida"
    case "FUNGICIDE":
      return "Fungicida"
    case "ADJUVANT":
      return "Adyuvante"
    case "SEED":
      return "Semilla"
    case "FUEL":
      return "Combustible"
    case "OTHER":
      return "Otro"
    default:
      return category
  }
}

function getUnitLabel(unit: string) {
  switch (unit) {
    case "KG":
      return "kg"
    case "L":
      return "L"
    case "TON":
      return "ton"
    case "UNIT":
      return "un"
    case "BAG":
      return "saco"
    default:
      return unit
  }
}

export default async function InsumosPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const inputs = await getInputs(farmId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Insumos</h1>
          <p className="text-muted-foreground">
            Controle el stock de insumos de su granja
          </p>
        </div>
        <Button asChild>
          <Link href="/insumos/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Insumo
          </Link>
        </Button>
      </div>

      {inputs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ningún insumo registrado
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comience registrando el primer insumo de su granja.
            </p>
            <Button asChild>
              <Link href="/insumos/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Insumo
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todos los Insumos</CardTitle>
            <CardDescription>
              {inputs.length}{" "}
              {inputs.length === 1 ? "insumo registrado" : "insumos registrados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mínimo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputs.map((input) => {
                  const currentStock = input.currentStock ?? 0
                  const minStock = input.minStock ?? 0
                  const isLowStock = currentStock < minStock
                  const isOutOfStock = currentStock === 0

                  return (
                    <TableRow key={input.id}>
                      <TableCell>
                        <Link
                          href={`/insumos/${input.id}`}
                          className="font-medium hover:underline"
                        >
                          {input.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getCategoryLabel(input.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>{getUnitLabel(input.unit)}</TableCell>
                      <TableCell className="text-right">
                        {formatNumber(currentStock)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatNumber(minStock)}
                      </TableCell>
                      <TableCell>
                        {isOutOfStock ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            Sin stock
                          </Badge>
                        ) : isLowStock ? (
                          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                            Stock bajo
                          </Badge>
                        ) : (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                            Stock normal
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
