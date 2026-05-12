import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, FileText, ExternalLink } from "lucide-react"

import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { getNfeImportById } from "@/queries/nfe"
import { prisma } from "@/lib/prisma"
import {
  formatCurrency,
  formatDate,
  NFE_IMPORT_STATUS_LABELS,
  NFE_IMPORT_STATUS_COLORS,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
  PURCHASE_STATUS_LABELS,
} from "@/lib/constants"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { NfeDetailActions } from "./actions"

export default async function NfeDetailPage({
  params,
}: {
  params: Promise<{ nfeId: string }>
}) {
  const { nfeId } = await params
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")

  const nfe = await getNfeImportById(membership.farmId, nfeId)
  if (!nfe) notFound()

  // Load suppliers, categories, and bank accounts for the approve dialog
  const [suppliers, categories, bankAccounts] = await Promise.all([
    prisma.supplier.findMany({
      where: { farmId: membership.farmId },
      select: { id: true, name: true, document: true },
      orderBy: { name: "asc" },
    }),
    prisma.financialCategory.findMany({
      where: { farmId: membership.farmId, type: "DESPESA" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.bankAccount.findMany({
      where: { farmId: membership.farmId, active: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notas-fiscais">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            NF-e {nfe.numero || nfe.chaveAcesso.slice(-8)}
          </h1>
          <p className="text-muted-foreground">
            {nfe.emitenteNome || "Emisor desconocido"}
          </p>
        </div>
        <Badge
          className={NFE_IMPORT_STATUS_COLORS[nfe.status]}
          variant="secondary"
        >
          {NFE_IMPORT_STATUS_LABELS[nfe.status]}
        </Badge>
      </div>

      {nfe.status === "PENDENTE" && (
        <NfeDetailActions
          nfe={{
            id: nfe.id,
            emitenteNome: nfe.emitenteNome,
            emitenteCnpj: nfe.emitenteCnpj,
            valorTotal: nfe.valorTotal,
            dataEmissao: nfe.dataEmissao,
          }}
          suppliers={suppliers}
          categories={categories}
          bankAccounts={bankAccounts}
        />
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos del Emisor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Razón Social</p>
              <p className="font-medium">{nfe.emitenteNome || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CNPJ</p>
              <p className="font-medium font-mono">{nfe.emitenteCnpj || "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">UF</p>
              <p className="font-medium">{nfe.emitenteUf || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Datos de la Factura</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-medium">{nfe.numero || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Serie</p>
                <p className="font-medium">{nfe.serie || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Emisión</p>
                <p className="font-medium">
                  {nfe.dataEmissao ? formatDate(nfe.dataEmissao) : "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Importada el</p>
                <p className="font-medium">{formatDate(nfe.createdAt)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Clave de Acceso</p>
              <p className="font-mono text-xs break-all">{nfe.chaveAcesso}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Totales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor de Productos</p>
              <p className="text-lg font-bold">{formatCurrency(nfe.valorProdutos)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Flete</p>
              <p className="text-lg font-bold">{formatCurrency(nfe.valorFrete)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Descuento</p>
              <p className="text-lg font-bold">{formatCurrency(nfe.valorDesconto)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(nfe.valorTotal)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {nfe.items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Ítems ({nfe.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead>NCM</TableHead>
                  <TableHead>Un.</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Vl. Unit.</TableHead>
                  <TableHead className="text-right">Vl. Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nfe.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">
                      {item.codigo || "—"}
                    </TableCell>
                    <TableCell>{item.descricao}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {item.ncm || "—"}
                    </TableCell>
                    <TableCell>{item.unidade || "—"}</TableCell>
                    <TableCell className="text-right">
                      {item.quantidade}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.valorUnitario)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.valorTotal)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {nfe.status === "APROVADA" && (nfe.transaction || nfe.purchase) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Registros Generados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nfe.transaction && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm text-muted-foreground">Transacción Financiera</p>
                  <p className="font-medium">{nfe.transaction.description}</p>
                  <p className="text-sm">{formatCurrency(nfe.transaction.amount)}</p>
                </div>
                <Badge
                  className={TRANSACTION_STATUS_COLORS[nfe.transaction.status]}
                  variant="secondary"
                >
                  {TRANSACTION_STATUS_LABELS[nfe.transaction.status]}
                </Badge>
              </div>
            )}
            {nfe.purchase && (
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm text-muted-foreground">Compra</p>
                  <p className="font-medium">{nfe.purchase.code}</p>
                  <p className="text-sm">{formatCurrency(nfe.purchase.totalAmount)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    {PURCHASE_STATUS_LABELS[nfe.purchase.status]}
                  </Badge>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/compras">
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {nfe.status === "REJEITADA" && nfe.rejectionReason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motivo del Rechazo</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{nfe.rejectionReason}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
