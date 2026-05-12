import { redirect } from "next/navigation"
import { FileText, Download, Clock, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { getNfeImports, getNfeImportCounts } from "@/queries/nfe"
import { formatCurrency, formatDate, NFE_IMPORT_STATUS_LABELS, NFE_IMPORT_STATUS_COLORS } from "@/lib/constants"
import {
  Card,
  CardContent,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ImportNfesButton } from "./import-button"

export default async function NotasFiscaisPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const farmId = membership.farmId
  const [pendentes, aprovadas, rejeitadas, counts] = await Promise.all([
    getNfeImports(farmId, "PENDENTE"),
    getNfeImports(farmId, "APROVADA"),
    getNfeImports(farmId, "REJEITADA"),
    getNfeImportCounts(farmId),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Facturas</h1>
          <p className="text-muted-foreground">
            Importación automática de facturas electrónicas via certificado A1
          </p>
        </div>
        <ImportNfesButton />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.pendente}</div>
            <p className="text-xs text-muted-foreground">
              esperando aprobación
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprobadas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.aprovada}</div>
            <p className="text-xs text-muted-foreground">
              registros financieros creados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rechazadas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.rejeitada}</div>
            <p className="text-xs text-muted-foreground">
              facturas descartadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pendentes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pendentes">
            Pendientes
            {counts.pendente > 0 && (
              <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30" variant="secondary">
                {counts.pendente}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="aprovadas">Aprobadas</TabsTrigger>
          <TabsTrigger value="rejeitadas">Rechazadas</TabsTrigger>
        </TabsList>

        <TabsContent value="pendentes" className="space-y-4">
          {pendentes.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <FileText className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Ninguna factura pendiente.
                </p>
                <p className="text-sm text-muted-foreground text-center mt-1">
                  Haga clic en &ldquo;Buscar Facturas&rdquo; para consultar el SEFAZ.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Emisor</TableHead>
                      <TableHead>CNPJ</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendentes.map((nfe) => (
                      <TableRow key={nfe.id}>
                        <TableCell>
                          {nfe.dataEmissao ? formatDate(nfe.dataEmissao) : "—"}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/notas-fiscais/${nfe.id}`}
                            className="hover:underline text-primary font-medium"
                          >
                            {nfe.emitenteNome || "—"}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {nfe.emitenteCnpj || "—"}
                        </TableCell>
                        <TableCell>{nfe.numero || "—"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(nfe.valorTotal)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={NFE_IMPORT_STATUS_COLORS[nfe.status]}
                            variant="secondary"
                          >
                            {NFE_IMPORT_STATUS_LABELS[nfe.status]}
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

        <TabsContent value="aprovadas" className="space-y-4">
          {aprovadas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <CheckCircle2 className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Ninguna factura aprobada aún.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Emisor</TableHead>
                      <TableHead>Proveedor</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Aprobada el</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aprovadas.map((nfe) => (
                      <TableRow key={nfe.id}>
                        <TableCell>
                          {nfe.dataEmissao ? formatDate(nfe.dataEmissao) : "—"}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/notas-fiscais/${nfe.id}`}
                            className="hover:underline text-primary"
                          >
                            {nfe.emitenteNome || "—"}
                          </Link>
                        </TableCell>
                        <TableCell>{nfe.supplier?.name || "—"}</TableCell>
                        <TableCell>{nfe.numero || "—"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(nfe.valorTotal)}
                        </TableCell>
                        <TableCell>
                          {nfe.approvedAt ? formatDate(nfe.approvedAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejeitadas" className="space-y-4">
          {rejeitadas.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <XCircle className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  Ninguna factura rechazada.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Emisión</TableHead>
                      <TableHead>Emisor</TableHead>
                      <TableHead>Número</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Rechazada el</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejeitadas.map((nfe) => (
                      <TableRow key={nfe.id}>
                        <TableCell>
                          {nfe.dataEmissao ? formatDate(nfe.dataEmissao) : "—"}
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/notas-fiscais/${nfe.id}`}
                            className="hover:underline text-primary"
                          >
                            {nfe.emitenteNome || "—"}
                          </Link>
                        </TableCell>
                        <TableCell>{nfe.numero || "—"}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(nfe.valorTotal)}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {nfe.rejectionReason || "—"}
                        </TableCell>
                        <TableCell>
                          {nfe.rejectedAt ? formatDate(nfe.rejectedAt) : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
