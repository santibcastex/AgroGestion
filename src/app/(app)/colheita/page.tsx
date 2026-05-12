import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getHarvests } from "@/queries/harvests"
import { formatNumber, formatCurrency, formatDate } from "@/lib/constants"
import Link from "next/link"
import { Plus, Wheat } from "lucide-react"

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

export default async function ColheitaPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const harvests = await getHarvests(farmId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cosecha</h1>
          <p className="text-muted-foreground">
            Registre y realice seguimiento de los datos de cosecha de su granja
          </p>
        </div>
        <Button asChild>
          <Link href="/colheita/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cosecha
          </Link>
        </Button>
      </div>

      {harvests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wheat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ninguna cosecha registrada
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comience registrando la primera cosecha de su granja.
            </p>
            <Button asChild>
              <Link href="/colheita/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cosecha
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Todas las Cosechas</CardTitle>
            <CardDescription>
              {harvests.length}{" "}
              {harvests.length === 1
                ? "cosecha registrada"
                : "cosechas registradas"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cosecha</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead className="text-right">Toneladas</TableHead>
                  <TableHead className="text-right">TCH</TableHead>
                  <TableHead className="text-right">ATR</TableHead>
                  <TableHead>Comprador</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {harvests.map((harvest) => (
                  <TableRow key={harvest.id}>
                    <TableCell>
                      {harvest.harvestDate
                        ? formatDate(new Date(harvest.harvestDate))
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/colheita/${harvest.id}`}
                        className="font-medium hover:underline"
                      >
                        {harvest.crop?.name ?? "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {harvest.area?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {harvest.totalTons != null
                        ? formatNumber(harvest.totalTons)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {harvest.tch != null
                        ? formatNumber(harvest.tch)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {harvest.atr != null
                        ? formatNumber(harvest.atr)
                        : "—"}
                    </TableCell>
                    <TableCell>
                      {harvest.buyerName ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {harvest.salePrice != null
                        ? formatCurrency(harvest.salePrice)
                        : "—"}
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
