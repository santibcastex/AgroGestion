import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  ClipboardList,
  DollarSign,
  FileText,
  FlaskConical,
  Grid3x3,
  Home,
  LayoutDashboard,
  Leaf,
  Map,
  Package,
  Settings,
  ShoppingCart,
  Store,
  Truck,
  Wallet,
} from "lucide-react"

// --- Types ---

export type NavContextLevel = "farm" | "safra" | "area"

export interface NavContext {
  level: NavContextLevel
  safraId?: string
  areaId?: string
}

export interface NavItem {
  title: string
  icon: LucideIcon
  href: string
  exact?: boolean
}

export interface NavSection {
  label: string
  items: NavItem[]
}

// --- Context derivation ---

export function deriveNavContext(pathname: string): NavContext {
  const areaMatch = pathname.match(/^\/safras\/([^/]+)\/areas\/([^/]+)/)
  if (areaMatch) {
    return { level: "area", safraId: areaMatch[1], areaId: areaMatch[2] }
  }

  const safraMatch = pathname.match(/^\/safras\/([^/]+)/)
  if (safraMatch && safraMatch[1] !== "nova") {
    return { level: "safra", safraId: safraMatch[1] }
  }

  return { level: "farm" }
}

// --- Menu definitions ---

const farmNavSections: NavSection[] = [
  {
    label: "Principal",
    items: [
      { title: "Inicio", href: "/dashboard", icon: Home },
      { title: "Mapa", href: "/mapa", icon: Map },
      { title: "Áreas", href: "/areas", icon: Grid3x3 },
      { title: "Cosechas", href: "/safras", icon: Leaf },
    ],
  },
  {
    label: "Operaciones",
    items: [
      { title: "Actividades", href: "/atividades", icon: ClipboardList },
      { title: "Análisis de Suelo", href: "/analise-solo", icon: FlaskConical },
      { title: "Insumos", href: "/insumos", icon: Package },
      { title: "Cosecha", href: "/colheita", icon: Truck },
    ],
  },
  {
    label: "Financiero",
    items: [
      { title: "Financiero", href: "/financeiro", icon: Wallet },
      { title: "Compras", href: "/compras", icon: ShoppingCart },
      { title: "Proveedores", href: "/fornecedores", icon: Store },
      { title: "Facturas", href: "/notas-fiscais", icon: FileText },
    ],
  },
  {
    label: "Sistema",
    items: [
      { title: "Indicadores", href: "/indicadores", icon: BarChart3 },
      { title: "Configuración", href: "/configuracoes", icon: Settings },
    ],
  },
]

// Hrefs are suffixes — prefixed with /safras/[safraId] by getNavSections
const safraNavSections: NavSection[] = [
  {
    label: "Cosecha",
    items: [
      { title: "Panel de Control", href: "", icon: LayoutDashboard, exact: true },
      { title: "Mapa", href: "/mapa", icon: Map },
      { title: "Actividades", href: "/atividades", icon: ClipboardList },
      { title: "Insumos", href: "/insumos", icon: Package },
      { title: "Cosecha", href: "/colheita", icon: Truck },
    ],
  },
  {
    label: "Costos",
    items: [
      { title: "Costo Presupuestado", href: "/custo-orcado", icon: DollarSign },
      { title: "Costo Real", href: "/custo", icon: DollarSign },
    ],
  },
  {
    label: "Análisis",
    items: [
      { title: "Indicadores", href: "/indicadores", icon: BarChart3 },
    ],
  },
]

// Hrefs are suffixes — prefixed with /safras/[safraId]/areas/[areaId] by getNavSections
const areaNavSections: NavSection[] = [
  {
    label: "Parcela",
    items: [
      { title: "Panel de Control", href: "", icon: LayoutDashboard, exact: true },
      { title: "Mapa", href: "/mapa", icon: Map },
      { title: "Insumos", href: "/insumos", icon: Package },
      { title: "Costo Real", href: "/custo", icon: DollarSign },
    ],
  },
]

// --- Resolver ---

function prefixSections(sections: NavSection[], basePath: string): NavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      href: basePath + item.href,
    })),
  }))
}

export function getNavSections(context: NavContext): NavSection[] {
  switch (context.level) {
    case "area":
      return prefixSections(
        areaNavSections,
        `/safras/${context.safraId}/areas/${context.areaId}`
      )
    case "safra":
      return prefixSections(safraNavSections, `/safras/${context.safraId}`)
    default:
      return farmNavSections
  }
}
