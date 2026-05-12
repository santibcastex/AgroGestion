import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect, notFound } from "next/navigation"
import { getHarvests, getHarvestSummary } from "@/queries/harvests"
import { getCropById } from "@/queries/crops"
import { formatNumber, formatCurrency, formatDate } from "@/lib/constants"
import Link from "next/link"
import { Wheat, TrendingUp, MapPin, BarChart3 } from "lucide-react"

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

export default async function SafraColheitaPage({
  params,
}: {
  params: Promise<{ safraId: string }>
}) {
  const { safraId } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const crop = await getCropById(membership.farmId, safraId)
  if (!crop) notFound()

  const harvests = await getHarvests(membership.farmId, safraId)
  const summary = await getHarvestSummary(membership.farmId, safraId)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cosecha</h1>
        <p className="text-muted-foreground">
          Registros de cosecha de esta cosecha
        </p>
      </div>

      {harvests.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cosechado</CardTitle>
              <Wheat className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalTons)}</div>
              <p className="text-xs text-muted-foreground">toneladas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Área Cosechada</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.totalHa)}</div>
              <p className="text-xs text-muted-foreground">hectáreas</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">TCH Medio</CardTitle>

              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.avgTch)}</div>
              <p className="text-xs text-muted-foreground">ton/ha</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ATR Medio</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.avgAtr ? formatNumber(summary.avgAtr) : "—"}
              </div>
              <p className="text-xs text-muted-foreground">kg/ton</p>
            </CardContent>
          </Card>
        </div>
      )}

      {harvests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wheat className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ninguna cosecha en esta cosecha
            </h3>
            <p className="text-muted-foreground text-sm">
              Los registros de cosecha de esta cosecha aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Cosechas</CardTitle>
            <CardDescription>
              {harvests.length}{" "}
              {harvests.length === 1 ? "registro" : "registros"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
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
                      {harvest.area?.name ? (
                        <Link
                          href={`/safras/${safraId}/areas/${harvest.area.id}`}
                          className="font-medium hover:underline"
                        >
                          {harvest.area.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {harvest.totalTons != null
                        ? formatNumber(harvest.totalTons)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {harvest.tch != null ? formatNumber(harvest.tch) : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {harvest.atr != null ? formatNumber(harvest.atr) : "—"}
                    </TableCell>
                    <TableCell>{harvest.buyerName ?? "—"}</TableCell>
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
