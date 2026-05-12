import { z } from "zod"

export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
})

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  farmName: z.string().min(2, "El nombre de la granja debe tener al menos 2 caracteres"),
})

export const farmSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  city: z.string().optional(),
  state: z.string().optional(),
  document: z.string().optional(),
})

export const areaSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  sizeHa: z.coerce.number().positive("El área debe ser mayor que cero"),
  geojson: z.any().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  description: z.string().optional(),
})

export const cropSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  culture: z.string().min(1, "El cultivo es obligatorio"),
  plantingType: z.enum(["CANA_PLANTA", "SOQUEIRA", "OUTRO"]),
  variety: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["PLANEJADA", "EM_ANDAMENTO", "FINALIZADA"]).default("PLANEJADA"),
  measurementUnit: z.string().optional(),
  defaultInputStockId: z.string().optional(),
  grossWeightDiscounts: z.array(z.string()).optional(),
  netWeightDiscounts: z.array(z.string()).optional(),
  notes: z.string().optional(),
  areaIds: z.array(z.string()).min(1, "Seleccione al menos un área"),
})

export const activitySchema = z.object({
  activityTypeId: z.string().min(1, "El tipo es obligatorio"),
  subtype: z.string().optional(),
  cropId: z.string().optional(),
  team: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  status: z.enum(["A_FAZER", "EM_PROGRESSO", "REVISAR", "CONCLUIDO"]).default("A_FAZER"),
  kind: z.enum(["PLANEJADO", "REALIZADO"]).default("REALIZADO"),
  plannedActivityId: z.string().optional(),
  stockId: z.string().optional(),
  notes: z.string().optional(),
  areaIds: z.array(z.string()).min(1, "Seleccione al menos un área"),
  inputUsages: z.array(z.object({
    inputId: z.string(),
    quantity: z.coerce.number().positive(),
    ratePerHa: z.coerce.number().optional(),
  })).optional(),
})

export const inputSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  category: z.enum(["HERBICIDA", "INSETICIDA", "FUNGICIDA", "FERTILIZANTE", "ADJUVANTE", "SEMENTE", "COMBUSTIVEL", "OUTRO"]),
  unit: z.enum(["KG", "L", "T", "UNIDADE", "SACO", "ML", "G"]).default("L"),
  manufacturer: z.string().optional(),
  activeAgent: z.string().optional(),
  description: z.string().optional(),
  minStock: z.coerce.number().min(0).optional(),
})

export const soilAnalysisSchema = z.object({
  areaId: z.string().min(1, "El área es obligatoria"),
  sampleDate: z.coerce.date(),
  year: z.coerce.number().int().min(2000).max(2100),
  depth: z.string().default("0-20"),
  labName: z.string().optional(),
  labReportId: z.string().optional(),
  pH: z.coerce.number().min(0).max(14).optional().or(z.literal("")),
  pHType: z.string().default("CaCl2"),
  organicMatter: z.coerce.number().min(0).optional().or(z.literal("")),
  phosphorus: z.coerce.number().min(0).optional().or(z.literal("")),
  potassium: z.coerce.number().min(0).optional().or(z.literal("")),
  calcium: z.coerce.number().min(0).optional().or(z.literal("")),
  magnesium: z.coerce.number().min(0).optional().or(z.literal("")),
  aluminum: z.coerce.number().min(0).optional().or(z.literal("")),
  hPlusAl: z.coerce.number().min(0).optional().or(z.literal("")),
  sumOfBases: z.coerce.number().min(0).optional().or(z.literal("")),
  ctc: z.coerce.number().min(0).optional().or(z.literal("")),
  baseSaturation: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  aluminumSaturation: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  sulfur: z.coerce.number().min(0).optional().or(z.literal("")),
  boron: z.coerce.number().min(0).optional().or(z.literal("")),
  copper: z.coerce.number().min(0).optional().or(z.literal("")),
  iron: z.coerce.number().min(0).optional().or(z.literal("")),
  manganese: z.coerce.number().min(0).optional().or(z.literal("")),
  zinc: z.coerce.number().min(0).optional().or(z.literal("")),
  clayPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  siltPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  sandPercent: z.coerce.number().min(0).max(100).optional().or(z.literal("")),
  textureClass: z.string().optional(),
  notes: z.string().optional(),
})

export const bankAccountSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  bankName: z.string().optional(),
  agency: z.string().optional(),
  accountNumber: z.string().optional(),
  initialBalance: z.coerce.number().default(0),
  initialBalanceDate: z.coerce.date().default(() => new Date()),
})

export const transactionSchema = z.object({
  type: z.enum(["RECEITA", "DESPESA"]),
  categoryId: z.string().optional(),
  bankAccountId: z.string().optional(),
  description: z.string().min(1, "La descripción es obligatoria"),
  amount: z.coerce.number().positive("El valor debe ser positivo"),
  dueDate: z.coerce.date(),
  paymentDate: z.coerce.date().optional(),
  competenceDate: z.coerce.date().optional(),
  documentNumber: z.string().optional(),
  supplierId: z.string().optional(),
  notes: z.string().optional(),
  installments: z.coerce.number().int().min(1).max(120).default(1),
})

export const supplierSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  document: z.string().optional(),
  types: z.array(z.enum(["PRODUTOS", "SERVICOS", "OUTRO"])).min(1, "Seleccione al menos un tipo").default(["OUTRO"]),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
})

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "El proveedor es obligatorio"),
  purchaseDate: z.coerce.date(),
  deliveryDate: z.coerce.date().optional(),
  invoiceNumber: z.string().optional(),
  invoiceKey: z.string().optional(),
  discountAmount: z.coerce.number().min(0).default(0),
  freightAmount: z.coerce.number().min(0).default(0),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    inputId: z.string().optional(),
    description: z.string().min(1),
    quantity: z.coerce.number().positive(),
    unit: z.enum(["KG", "L", "T", "UNIDADE", "SACO", "ML", "G"]),
    unitPrice: z.coerce.number().positive(),
  })).min(1, "Agregue al menos un ítem"),
})

export const certificateUploadSchema = z.object({
  password: z.string().min(1, "La contraseña del certificado es obligatoria"),
})

export const approveNfeSchema = z.object({
  nfeImportId: z.string().min(1),
  supplierId: z.string().optional(),
  categoryId: z.string().optional(),
  bankAccountId: z.string().optional(),
  dueDate: z.coerce.date().optional(),
  notes: z.string().optional(),
})

export const rejectNfeSchema = z.object({
  nfeImportId: z.string().min(1),
  rejectionReason: z.string().optional(),
})

export const harvestSchema = z.object({
  cropId: z.string().min(1, "La cosecha es obligatoria"),
  areaId: z.string().min(1, "El área es obligatoria"),
  harvestDate: z.coerce.date(),
  totalTons: z.coerce.number().positive("El tonelaje debe ser positivo"),
  tch: z.coerce.number().optional(),
  atr: z.coerce.number().optional(),
  brix: z.coerce.number().optional(),
  pol: z.coerce.number().optional(),
  fiber: z.coerce.number().optional(),
  purity: z.coerce.number().optional(),
  salePrice: z.coerce.number().optional(),
  buyerName: z.string().optional(),
  ticketNumber: z.string().optional(),
  notes: z.string().optional(),
})
