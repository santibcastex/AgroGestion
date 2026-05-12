import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getInputsByCropAndArea } from "@/queries/inputs"
import { getCropById } from "@/queries/crops"
import { getAreaById } from "@/queries/areas"
import { formatNumber, INPUT_CATEGORY_LABELS, UNIT_LABELS } from "@/lib/constants"
import Link from "next/link"
import { Package } from "lucide-react"

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

export default async function AreaInsumosPage({
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

  const inputs = await getInputsByCropAndArea(membership.farmId, safraId, areaId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insumos</h1>
        <p className="text-muted-foreground">
          Insumos utilizados en la parcela {area.name} en esta cosecha
        </p>
      </div>

      {inputs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ningún insumo utilizado
            </h3>
            <p className="text-muted-foreground text-sm">
              Los insumos utilizados en las actividades de esta parcela en esta cosecha aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Insumos de la Parcela</CardTitle>
            <CardDescription>
              {inputs.length}{" "}
              {inputs.length === 1 ? "insumo utilizado" : "insumos utilizados"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead className="text-right">Utilizado</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputs.map((input) => (
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
                        {(INPUT_CATEGORY_LABELS as Record<string, string>)[input.category] ?? input.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {(UNIT_LABELS as Record<string, string>)[input.unit] ?? input.unit}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatNumber(input.totalUsed)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatNumber(input.currentStock)}
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
