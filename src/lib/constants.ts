import { type FarmRole, type ActivityStatus, type ActivityKind, type InputCategory, type UnitOfMeasure, type PlantingType, type CropStatus, type TransactionType, type TransactionStatus, type PurchaseStatus, type NfeImportStatus, type SupplierType } from "@/generated/prisma/client"

export const FARM_ROLE_LABELS: Record<FarmRole, string> = {
  OWNER: "Propietario",
  MANAGER: "Gerente",
  ACCOUNTANT: "Contador",
  WORKER: "Trabajador",
  VIEWER: "Visualizador",
}

export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  A_FAZER: "Por Hacer",
  EM_PROGRESSO: "En Progreso",
  REVISAR: "Revisar",
  CONCLUIDO: "Completado",
}

export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  A_FAZER: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  EM_PROGRESSO: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  REVISAR: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  CONCLUIDO: "bg-green-500/20 text-green-400 border-green-500/30",
}

export const ACTIVITY_KIND_LABELS: Record<ActivityKind, string> = {
  PLANEJADO: "Planificado",
  REALIZADO: "Realizado",
}

export const ACTIVITY_KIND_COLORS: Record<ActivityKind, string> = {
  PLANEJADO: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  REALIZADO: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
}

export const INPUT_CATEGORY_LABELS: Record<InputCategory, string> = {
  HERBICIDA: "Herbicida",
  INSETICIDA: "Insecticida",
  FUNGICIDA: "Fungicida",
  FERTILIZANTE: "Fertilizante",
  ADJUVANTE: "Adyuvante",
  SEMENTE: "Semilla",
  COMBUSTIVEL: "Combustible",
  OUTRO: "Otro",
}

export const UNIT_LABELS: Record<UnitOfMeasure, string> = {
  KG: "kg",
  L: "L",
  T: "t",
  UNIDADE: "un",
  SACO: "sc",
  ML: "mL",
  G: "g",
}

export const PLANTING_TYPE_LABELS: Record<PlantingType, string> = {
  CANA_PLANTA: "Caña planta",
  SOQUEIRA: "Rastrojo",
  OUTRO: "Otro",
}

export const CROP_STATUS_LABELS: Record<CropStatus, string> = {
  PLANEJADA: "Planificada",
  EM_ANDAMENTO: "En Curso",
  FINALIZADA: "Finalizada",
}

export const CULTURE_LABELS: Record<string, string> = {
  CANA_DE_ACUCAR: "Caña de azúcar",
  SOJA: "Soja",
  MILHO: "Maíz",
  CAFE: "Café",
  ALGODAO: "Algodón",
  TRIGO: "Trigo",
  ARROZ: "Arroz",
  FEIJAO: "Poroto",
  SORGO: "Sorgo",
  AMENDOIM: "Maní",
  LARANJA: "Naranja",
  EUCALIPTO: "Eucalipto",
  PASTAGEM: "Pastizal",
  OUTRO: "Otro",
}

export const MEASUREMENT_UNIT_LABELS: Record<string, string> = {
  SACO_30KG: "Bolsas de 30kg",
  SACO_40KG: "Bolsas de 40kg",
  SACO_50KG: "Bolsas de 50kg",
  SACO_60KG: "Bolsas de 60kg",
  CAIXA_40_8KG: "Cajas de 40,8kg",
  GRAMAS: "Gramos",
  KG: "Kilos",
  MG: "Miligramos",
  TONELADA: "Toneladas",
}

export const HARVEST_DISCOUNT_OPTIONS: { key: string; label: string }[] = [
  { key: "atr", label: "ATR (Kg/Ton)" },
  { key: "ardidos", label: "Ardidos (%)" },
  { key: "avariados", label: "Avariados (%)" },
  { key: "brocado", label: "Brocado (%)" },
  { key: "carunchados", label: "Carunchados (%)" },
  { key: "contaminados", label: "Contaminados (%)" },
  { key: "descoloridos", label: "Descoloridos (%)" },
  { key: "esverdeados", label: "Esverdeados (%)" },
  { key: "germinados", label: "Germinados (%)" },
  { key: "gessado", label: "Gessado (%)" },
  { key: "impureza", label: "Impureza (%)" },
  { key: "mofados", label: "Mofados (%)" },
  { key: "ph_peso", label: "PH (Kg/hl)" },
  { key: "quebrados", label: "Quebrados (%)" },
  { key: "servicos", label: "Servicios (%)" },
  { key: "taxa_recepcao", label: "Tasa de recepción (%)" },
  { key: "umidade", label: "Humedad (%)" },
]

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  RECEITA: "Ingreso",
  DESPESA: "Gasto",
}

export const TRANSACTION_STATUS_LABELS: Record<TransactionStatus, string> = {
  PENDENTE: "Pendiente",
  PAGO: "Pagado",
  RECEBIDO: "Recibido",
  CANCELADO: "Cancelado",
  ATRASADO: "Atrasado",
}

export const TRANSACTION_STATUS_COLORS: Record<TransactionStatus, string> = {
  PENDENTE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  PAGO: "bg-green-500/20 text-green-400 border-green-500/30",
  RECEBIDO: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELADO: "bg-muted text-muted-foreground border-muted",
  ATRASADO: "bg-red-500/20 text-red-400 border-red-500/30",
}

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  RASCUNHO: "Borrador",
  CONFIRMADA: "Confirmada",
  RECEBIDA: "Recibida",
  CANCELADA: "Cancelada",
}

export const NFE_IMPORT_STATUS_LABELS: Record<NfeImportStatus, string> = {
  PENDENTE: "Pendiente",
  APROVADA: "Aprobada",
  REJEITADA: "Rechazada",
}

export const SUPPLIER_TYPE_LABELS: Record<SupplierType, string> = {
  PRODUTOS: "Productos",
  SERVICOS: "Servicios",
  OUTRO: "Otro",
}

export const SUPPLIER_TYPE_COLORS: Record<SupplierType, string> = {
  PRODUTOS: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  SERVICOS: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  OUTRO: "bg-muted text-muted-foreground border-muted",
}

export const NFE_IMPORT_STATUS_COLORS: Record<NfeImportStatus, string> = {
  PENDENTE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  APROVADA: "bg-green-500/20 text-green-400 border-green-500/30",
  REJEITADA: "bg-muted text-muted-foreground border-muted",
}

export const SUGARCANE_IDEAL_RANGES = {
  pH: { min: 5.5, max: 6.5, unit: "", label: "pH" },
  organicMatter: { min: 15, max: 30, unit: "g/dm3", label: "Materia Orgánica" },
  phosphorus: { min: 15, max: 40, unit: "mg/dm3", label: "Fósforo (P)" },
  potassium: { min: 3.0, max: 6.0, unit: "mmolc/dm3", label: "Potasio (K)" },
  calcium: { min: 25, max: 60, unit: "mmolc/dm3", label: "Calcio (Ca)" },
  magnesium: { min: 8, max: 20, unit: "mmolc/dm3", label: "Magnesio (Mg)" },
  baseSaturation: { min: 60, max: 80, unit: "%", label: "Saturación por Bases (V%)" },
  aluminumSaturation: { min: 0, max: 5, unit: "%", label: "Sat. por Aluminio (m%)" },
  sulfur: { min: 5, max: 15, unit: "mg/dm3", label: "Azufre (S)" },
  boron: { min: 0.2, max: 0.6, unit: "mg/dm3", label: "Boro (B)" },
  copper: { min: 0.5, max: 1.5, unit: "mg/dm3", label: "Cobre (Cu)" },
  iron: { min: 5, max: 12, unit: "mg/dm3", label: "Hierro (Fe)" },
  manganese: { min: 1.5, max: 5.0, unit: "mg/dm3", label: "Manganeso (Mn)" },
  zinc: { min: 0.7, max: 1.5, unit: "mg/dm3", label: "Zinc (Zn)" },
} as const

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value)
}

export function formatNumber(value: number, decimals = 2): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: "UTC" }).format(new Date(date))
}
