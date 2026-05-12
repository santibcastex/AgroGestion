"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { PlusCircle, Pencil, Trash2, Phone, MessageCircle, Mail, MapPin, FileText, ShoppingCart, ArrowLeftRight, UserPlus, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { createSupplier, updateSupplier, deleteSupplier, upsertSupplierContact, deleteSupplierContact } from "@/actions/suppliers"
import { SUPPLIER_TYPE_LABELS, SUPPLIER_TYPE_COLORS } from "@/lib/constants"
import type { SupplierType } from "@/generated/prisma/client"

const SUPPLIER_TYPES: { value: SupplierType; label: string }[] = [
  { value: "PRODUTOS", label: "Productos" },
  { value: "SERVICOS", label: "Servicios" },
  { value: "OUTRO", label: "Otro" },
]

interface SupplierFormData {
  name: string
  document: string
  types: SupplierType[]
  phone: string
  whatsapp: string
  email: string
  address: string
  notes: string
}

const defaultFormData: SupplierFormData = {
  name: "",
  document: "",
  types: ["OUTRO"],
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  notes: "",
}

// ── Create ────────────────────────────────────────────────────────────────────

interface CreateSupplierDialogProps {
  farmId: string
}

export function CreateSupplierDialog({ farmId }: CreateSupplierDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<SupplierFormData>(defaultFormData)
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (form.types.length === 0) {
      setError("Seleccione al menos un tipo")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await createSupplier(farmId, form)
        setOpen(false)
        setForm(defaultFormData)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al crear proveedor")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="size-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nuevo Proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <SupplierFormFields form={form} onChange={setForm} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Edit ──────────────────────────────────────────────────────────────────────

interface EditSupplierDialogProps {
  farmId: string
  supplier: {
    id: string
    name: string
    document: string | null
    types: SupplierType[]
    phone: string | null
    whatsapp: string | null
    email: string | null
    address: string | null
    notes: string | null
  }
}

export function EditSupplierDialog({ farmId, supplier }: EditSupplierDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [form, setForm] = useState<SupplierFormData>({
    name: supplier.name,
    document: supplier.document ?? "",
    types: supplier.types?.length > 0 ? supplier.types : ["OUTRO"],
    phone: supplier.phone ?? "",
    whatsapp: supplier.whatsapp ?? "",
    email: supplier.email ?? "",
    address: supplier.address ?? "",
    notes: supplier.notes ?? "",
  })
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault()
    if (form.types.length === 0) {
      setError("Seleccione al menos un tipo")
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await updateSupplier(farmId, supplier.id, form)
        setOpen(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al actualizar proveedor")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <SupplierFormFields form={form} onChange={setForm} />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ── Details ───────────────────────────────────────────────────────────────────

interface SupplierContact {
  id: string
  name: string
  role: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  notes: string | null
}

interface SupplierDetailsDialogProps {
  farmId: string
  supplier: {
    id: string
    name: string
    document: string | null
    types: SupplierType[]
    phone: string | null
    whatsapp: string | null
    email: string | null
    address: string | null
    notes: string | null
    contacts: SupplierContact[]
    _count: { purchases: number; transactions: number }
  }
  open: boolean
  onOpenChange: (open: boolean) => void
}

const defaultContact = { name: "", role: "", phone: "", whatsapp: "", email: "" }

export function SupplierDetailsDialog({ farmId, supplier, open, onOpenChange }: SupplierDetailsDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingContact, setEditingContact] = useState<string | "new" | null>(null)
  const [contactForm, setContactForm] = useState(defaultContact)

  function startNewContact() {
    setContactForm(defaultContact)
    setEditingContact("new")
  }

  function startEditContact(c: SupplierContact) {
    setContactForm({
      name: c.name,
      role: c.role ?? "",
      phone: c.phone ?? "",
      whatsapp: c.whatsapp ?? "",
      email: c.email ?? "",
    })
    setEditingContact(c.id)
  }

  function cancelContact() {
    setEditingContact(null)
    setContactForm(defaultContact)
  }

  function saveContact() {
    if (!contactForm.name.trim()) return
    startTransition(async () => {
      await upsertSupplierContact(
        farmId,
        supplier.id,
        editingContact === "new" ? null : editingContact,
        contactForm
      )
      setEditingContact(null)
      setContactForm(defaultContact)
      router.refresh()
    })
  }

  function removeContact(contactId: string) {
    startTransition(async () => {
      await deleteSupplierContact(farmId, contactId)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) cancelContact() }}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{supplier.name}</DialogTitle>
          <div className="flex flex-wrap gap-1 pt-1">
            {(supplier.types ?? []).map((t) => (
              <Badge key={t} className={SUPPLIER_TYPE_COLORS[t]} variant="secondary">
                {SUPPLIER_TYPE_LABELS[t]}
              </Badge>
            ))}
          </div>
        </DialogHeader>

        <div className="space-y-3">
          {supplier.document && (
            <div className="flex items-center gap-3 text-sm">
              <FileText className="size-4 text-muted-foreground shrink-0" />
              <span className="font-mono">{supplier.document}</span>
            </div>
          )}
          {supplier.phone && (
            <div className="flex items-center gap-3 text-sm">
              <Phone className="size-4 text-muted-foreground shrink-0" />
              <span>{supplier.phone}</span>
            </div>
          )}
          {supplier.whatsapp && (
            <div className="flex items-center gap-3 text-sm">
              <MessageCircle className="size-4 text-green-400 shrink-0" />
              <a
                href={`https://wa.me/55${supplier.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                {supplier.whatsapp}
              </a>
            </div>
          )}
          {supplier.email && (
            <div className="flex items-center gap-3 text-sm">
              <Mail className="size-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${supplier.email}`} className="hover:underline">
                {supplier.email}
              </a>
            </div>
          )}
          {supplier.address && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="size-4 text-muted-foreground shrink-0" />
              <span>{supplier.address}</span>
            </div>
          )}
          {supplier.notes && (
            <div className="flex items-start gap-3 text-sm">
              <FileText className="size-4 text-muted-foreground shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{supplier.notes}</span>
            </div>
          )}

          {!supplier.document && !supplier.phone && !supplier.whatsapp && !supplier.email && !supplier.address && !supplier.notes && (
            <p className="text-sm text-muted-foreground">Ningún dato de contacto registrado.</p>
          )}

          {/* ── Contacts ── */}
          <div className="pt-2 border-t space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Contactos</p>
              {editingContact === null && (
                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={startNewContact}>
                  <UserPlus className="size-3" />
                  Agregar
                </Button>
              )}
            </div>

            {supplier.contacts.map((c) => (
              <div key={c.id}>
                {editingContact === c.id ? (
                  <ContactFormInline
                    form={contactForm}
                    onChange={setContactForm}
                    onSave={saveContact}
                    onCancel={cancelContact}
                    isPending={isPending}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-2 rounded-md border px-3 py-2">
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-medium leading-none">
                        {c.name}
                        {c.role && <span className="text-xs text-muted-foreground font-normal ml-1.5">· {c.role}</span>}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 pt-1">
                        {c.phone && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="size-3 shrink-0" />
                            {c.phone}
                          </span>
                        )}
                        {c.whatsapp && (
                          <a
                            href={`https://wa.me/55${c.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-green-400 hover:underline"
                          >
                            <MessageCircle className="size-3 shrink-0" />
                            {c.whatsapp}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:underline">
                            <Mail className="size-3 shrink-0" />
                            {c.email}
                          </a>
                        )}
                      </div>
                      {c.notes && <p className="text-xs text-muted-foreground">{c.notes}</p>}
                    </div>
                    <div className="flex gap-0.5 shrink-0">
                      <Button variant="ghost" size="icon" className="size-6" onClick={() => startEditContact(c)}>
                        <Pencil className="size-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-6 text-destructive hover:text-destructive"
                        onClick={() => removeContact(c.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {editingContact === "new" && (
              <ContactFormInline
                form={contactForm}
                onChange={setContactForm}
                onSave={saveContact}
                onCancel={cancelContact}
                isPending={isPending}
              />
            )}

            {supplier.contacts.length === 0 && editingContact === null && (
              <p className="text-xs text-muted-foreground">Ningún contacto agregado.</p>
            )}
          </div>

          <div className="flex gap-6 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <ShoppingCart className="size-4 text-muted-foreground" />
              <span><span className="font-medium">{supplier._count.purchases}</span> compras</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <ArrowLeftRight className="size-4 text-muted-foreground" />
              <span><span className="font-medium">{supplier._count.transactions}</span> transacciones</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Contact inline form ────────────────────────────────────────────────────────

interface ContactFormData {
  name: string
  role: string
  phone: string
  whatsapp: string
  email: string
}

interface ContactFormInlineProps {
  form: ContactFormData
  onChange: (f: ContactFormData) => void
  onSave: () => void
  onCancel: () => void
  isPending: boolean
}

function ContactFormInline({ form, onChange, onSave, onCancel, isPending }: ContactFormInlineProps) {
  function set(field: keyof ContactFormData, value: string) {
    onChange({ ...form, [field]: value })
  }

  return (
    <div className="rounded-md border px-3 py-3 space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nome *</Label>
          <Input
            className="h-8 text-sm"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Nome do contato"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Cargo / Funcao</Label>
          <Input
            className="h-8 text-sm"
            value={form.role}
            onChange={(e) => set("role", e.target.value)}
            placeholder="Ex: Vendas, Financeiro"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Telefone</Label>
          <Input
            className="h-8 text-sm"
            value={form.phone}
            onChange={(e) => set("phone", maskPhone(e.target.value))}
            placeholder="(00) 0000-0000"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">WhatsApp</Label>
          <Input
            className="h-8 text-sm"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">E-mail</Label>
        <Input
          className="h-8 text-sm"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="contato@empresa.com"
        />
      </div>
      <div className="flex justify-end gap-1 pt-1">
        <Button variant="ghost" size="sm" className="h-7 px-2" onClick={onCancel}>
          <X className="size-3 mr-1" />
          Cancelar
        </Button>
        <Button size="sm" className="h-7 px-2" onClick={onSave} disabled={isPending || !form.name.trim()}>
          <Check className="size-3 mr-1" />
          Salvar
        </Button>
      </div>
    </div>
  )
}

// ── Delete ────────────────────────────────────────────────────────────────────

interface DeleteSupplierDialogProps {
  farmId: string
  supplierId: string
  supplierName: string
}

export function DeleteSupplierDialog({ farmId, supplierId, supplierName }: DeleteSupplierDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    startTransition(async () => {
      await deleteSupplier(farmId, supplierId)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
          <Trash2 className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir Fornecedor</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Tem certeza que deseja excluir <span className="font-medium text-foreground">{supplierName}</span>?
          Esta acao nao pode ser desfeita.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
            {isPending ? "Excluindo..." : "Excluir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ── Form fields ───────────────────────────────────────────────────────────────

interface SupplierFormFieldsProps {
  form: SupplierFormData
  onChange: (form: SupplierFormData) => void
}

function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function maskDocument(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14)
  if (digits.length <= 11) {
    // CPF: 000.000.000-00
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }
  // CNPJ: 00.000.000/0000-00
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

function SupplierFormFields({ form, onChange }: SupplierFormFieldsProps) {
  function set(field: keyof SupplierFormData, value: string) {
    onChange({ ...form, [field]: value })
  }

  function toggleType(type: SupplierType) {
    const next = form.types.includes(type)
      ? form.types.filter((t) => t !== type)
      : [...form.types, type]
    onChange({ ...form, types: next })
  }

  return (
    <div className="space-y-4">
      {/* Nome */}
      <div className="space-y-1.5">
        <Label htmlFor="name">Nome *</Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Nome do fornecedor"
          required
        />
      </div>

      {/* Tipo */}
      <div className="space-y-1.5">
        <Label>Tipo *</Label>
        <div className="flex gap-5">
          {SUPPLIER_TYPES.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer select-none">
              <Checkbox
                checked={form.types.includes(value)}
                onCheckedChange={() => toggleType(value)}
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* CPF/CNPJ */}
      <div className="space-y-1.5">
        <Label htmlFor="document">CPF / CNPJ</Label>
        <Input
          id="document"
          value={form.document}
          onChange={(e) => set("document", maskDocument(e.target.value))}
          placeholder="000.000.000-00 ou 00.000.000/0000-00"
        />
      </div>

      {/* Telefone + WhatsApp */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => set("phone", maskPhone(e.target.value))}
            placeholder="(00) 0000-0000"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", maskPhone(e.target.value))}
            placeholder="(00) 00000-0000"
          />
        </div>
      </div>

      {/* E-mail */}
      <div className="space-y-1.5">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="contato@empresa.com"
        />
      </div>

      {/* Endereco */}
      <div className="space-y-1.5">
        <Label htmlFor="address">Endereco</Label>
        <Input
          id="address"
          value={form.address}
          onChange={(e) => set("address", e.target.value)}
          placeholder="Rua, numero, cidade - UF"
        />
      </div>

      {/* Observacoes */}
      <div className="space-y-1.5">
        <Label htmlFor="notes">Observacoes</Label>
        <Input
          id="notes"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Informacoes adicionais"
        />
      </div>
    </div>
  )
}
