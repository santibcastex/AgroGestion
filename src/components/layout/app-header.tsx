"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ChevronDown,
  Grid3x3,
  Leaf,
} from "lucide-react"
import { useNavigation } from "@/providers/navigation-provider"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { CROP_STATUS_LABELS } from "@/lib/constants"

const routeLabels: Record<string, string> = {
  dashboard: "Inicio",
  mapa: "Mapa",
  areas: "Áreas",
  safras: "Cosechas",
  atividades: "Actividades",
  "analise-solo": "Análisis de Suelo",
  insumos: "Insumos",
  colheita: "Cosecha",
  financeiro: "Financiero",
  compras: "Compras",
  indicadores: "Indicadores",
  configuracoes: "Configuración",
  perfil: "Perfil",
  custo: "Costo Real",
  "custo-orcado": "Costo Presupuestado",
  nova: "Nueva",
  "nova-transacao": "Nueva Transacción",
}

function ContextSelectors() {
  const router = useRouter()
  const { context, safras, safra, safraAreas, area } = useNavigation()

  return (
    <div className="flex items-center gap-1.5">
      {/* Safra selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors outline-none">
            <Leaf className="size-3 text-primary" />
            <span className="max-w-[140px] truncate">
              {safra ? safra.name : "Cosecha"}
            </span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Cosechas
          </DropdownMenuLabel>
          {context.level !== "farm" && (
            <>
              <DropdownMenuItem onClick={() => router.push("/safras")}>
                <span className="text-muted-foreground">Todas las cosechas</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}
          {safras.length === 0 ? (
            <DropdownMenuItem disabled>
              <span className="text-muted-foreground">Sin cosechas</span>
            </DropdownMenuItem>
          ) : (
            safras.map((s) => (
              <DropdownMenuItem
                key={s.id}
                onClick={() => router.push(`/safras/${s.id}`)}
                className="flex items-center justify-between"
              >
                <span className="truncate">{s.name}</span>
                <Badge
                  variant={s.status === "EM_ANDAMENTO" ? "default" : "outline"}
                  className="ml-2 text-[10px] px-1.5 py-0"
                >
                  {(CROP_STATUS_LABELS as Record<string, string>)[s.status] ?? s.status}
                </Badge>
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Area selector — only when in safra or area context */}
      {context.level !== "farm" && safra && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent transition-colors outline-none">
              <Grid3x3 className="size-3 text-primary" />
              <span className="max-w-[140px] truncate">
                {area ? area.name : "Parcela"}
              </span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Parcelas de la cosecha
            </DropdownMenuLabel>
            {context.level === "area" && (
              <>
                <DropdownMenuItem
                  onClick={() => router.push(`/safras/${context.safraId}`)}
                >
                  <span className="text-muted-foreground">Todas las parcelas</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            {safraAreas.length === 0 ? (
              <DropdownMenuItem disabled>
                <span className="text-muted-foreground">Sin parcelas vinculadas</span>
              </DropdownMenuItem>
            ) : (
              safraAreas.map((a) => (
                <DropdownMenuItem
                  key={a.id}
                  onClick={() =>
                    router.push(`/safras/${context.safraId}/areas/${a.id}`)
                  }
                >
                  <span className="truncate">{a.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {a.sizeHa} ha
                  </span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

// Check if a segment looks like a database ID (CUID, UUID, etc.) rather than a route name
function looksLikeId(segment: string): boolean {
  // CUIDs start with 'c' and are 25+ chars of lowercase alphanumeric
  if (/^c[a-z0-9]{20,}$/.test(segment)) return true
  // UUIDs
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)) return true
  return false
}

// Maps parent route to API endpoint for resolving entity names
const entityResolvers: Record<string, string> = {
  areas: "/api/entity-name?type=area&id=",
  safras: "/api/entity-name?type=crop&id=",
  financeiro: "/api/entity-name?type=transaction&id=",
  fornecedores: "/api/entity-name?type=supplier&id=",
}

export function AppHeader() {
  const pathname = usePathname()
  const { context, safra, area } = useNavigation()

  const segments = pathname.split("/").filter(Boolean)

  // Find segments that look like IDs and need resolving
  const unresolvedIds = useMemo(() => {
    const ids: { segment: string; parentSegment: string }[] = []
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      const parentSegment = segments[i - 1]
      // Skip if already resolved by navigation context
      if (context.safraId && segment === context.safraId) continue
      if (context.areaId && segment === context.areaId) continue
      if (looksLikeId(segment) && entityResolvers[parentSegment]) {
        ids.push({ segment, parentSegment })
      }
    }
    return ids
  }, [segments, context.safraId, context.areaId])

  // Resolve entity names for unknown IDs
  const [resolvedNames, setResolvedNames] = useState<Record<string, string>>({})
  useEffect(() => {
    if (unresolvedIds.length === 0) return
    for (const { segment, parentSegment } of unresolvedIds) {
      if (resolvedNames[segment]) continue
      const endpoint = entityResolvers[parentSegment]
      if (!endpoint) continue
      fetch(endpoint + segment)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => {
          if (data?.name) {
            setResolvedNames((prev) => ({ ...prev, [segment]: data.name }))
          }
        })
        .catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unresolvedIds])

  // Build breadcrumbs, resolving dynamic IDs to names
  const breadcrumbs = segments
    .map((segment, index) => {
      const href = "/" + segments.slice(0, index + 1).join("/")

      // Skip rendering raw IDs as separate breadcrumbs when we have the name
      if (context.safraId && segment === context.safraId) {
        return { href, label: safra?.name ?? "Cosecha", isLast: index === segments.length - 1 }
      }
      if (context.areaId && segment === context.areaId) {
        return { href, label: area?.name ?? "Parcela", isLast: index === segments.length - 1 }
      }

      // Check resolved names for ID segments
      if (resolvedNames[segment]) {
        return { href, label: resolvedNames[segment], isLast: index === segments.length - 1 }
      }

      const label = routeLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)
      const isLast = index === segments.length - 1
      return { href, label, isLast }
    })

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((crumb, index) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {crumb.isLast ? (
                    <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild>
                      <Link href={crumb.href}>{crumb.label}</Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <ContextSelectors />
        <Separator orientation="vertical" className="h-4" />
        <ThemeToggle />
      </div>
    </header>
  )
}
