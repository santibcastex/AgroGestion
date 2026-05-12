"use client"

import { useCallback, useRef, useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Upload,
  FileSpreadsheet,
  X,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react"
import * as XLSX from "xlsx"

import { parseLabFile, type ParsedSample } from "@/lib/soil-analysis-parser"
import { importSoilAnalyses, type ImportSample } from "@/actions/soil-analysis"
import { useFarm } from "@/providers/farm-provider"
import { useAreas } from "@/hooks/use-areas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

// ─── Types ────────────────────────────────────────────────────────────────

type Step = "upload" | "review" | "done"

type SampleRow = ParsedSample & {
  areaId: string | null
}

// ─── Step 1: Upload ───────────────────────────────────────────────────────

function UploadStep({ onParsed }: { onParsed: (rows: SampleRow[], labName: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((file: File) => {
    setError(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const result = parseLabFile(buffer, file.name)
      if (result.format === "unknown" || result.samples.length === 0) {
        setError(
          result.errors.length
            ? result.errors.join("; ")
            : "Formato no reconocido. Use CSV (Lagoa da Serra) o XLS (Ciência em Solo)."
        )
        return
      }
      const rows: SampleRow[] = result.samples.map((s) => ({ ...s, areaId: null }))
      onParsed(rows, result.samples[0]?.labName ?? "")
    }
    reader.readAsArrayBuffer(file)
  }, [onParsed])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
        }`}
      >
        <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
        <div className="text-center">
          <p className="font-medium">Arrastre el archivo o haga clic para seleccionar</p>
          <p className="text-sm text-muted-foreground mt-1">CSV (Lagoa da Serra) o XLS/XLSX (Ciência em Solo)</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p className="font-medium">Formatos soportados:</p>
        <p>• <strong>CSV — Lagoa da Serra:</strong> separado por punto y coma, columnas P, M.O., pH, K, Ca, Mg, etc.</p>
        <p>• <strong>XLS — Ciência em Solo:</strong> planilla del laboratorio con parcela, punto, capa y todos los parámetros.</p>
        <p>• <strong>XLSX — FarmCore:</strong> exportación normalizada con columnas Muestra, Profundidad, pH CaCl2, etc.</p>
      </div>
    </div>
  )
}

// ─── Step 2: Review ───────────────────────────────────────────────────────

function ReviewStep({
  rows,
  labName,
  onConfirm,
  onBack,
}: {
  rows: SampleRow[]
  labName: string
  onConfirm: (rows: SampleRow[]) => void
  onBack: () => void
}) {
  const { activeFarm } = useFarm()
  const { areas } = useAreas(activeFarm?.farmId)
  const [samples, setSamples] = useState<SampleRow[]>(rows)
  const [globalArea, setGlobalArea] = useState<string>("__none__")
  const [labNameInput, setLabNameInput] = useState(labName)
  const [isPending, startTransition] = useTransition()

  // keep labName in sync if it changes (e.g. Ciência em Solo comes pre-filled)
  useEffect(() => { setLabNameInput(labName) }, [labName])

  const handleConfirmWithLab = () => {
    const finalSamples = labNameInput
      ? samples.map((s) => ({ ...s, labName: labNameInput }))
      : samples
    startTransition(() => onConfirm(finalSamples))
  }

  const setAllAreas = (areaId: string) => {
    const v = areaId === "__none__" ? null : areaId
    setSamples((prev) => prev.map((s) => ({ ...s, areaId: v })))
    setGlobalArea(areaId)
  }

  const setSampleArea = (idx: number, areaId: string) => {
    const v = areaId === "__none__" ? null : areaId
    setSamples((prev) => prev.map((s, i) => i === idx ? { ...s, areaId: v } : s))
    setGlobalArea("__mixed__")
  }

  const depths = Array.from(new Set(samples.map((s) => s.depth)))
  const byDepth = (d: string) => samples.filter((s) => s.depth === d)

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4">
        <div>
          <span className="text-sm text-muted-foreground">Muestras: </span>
          <Badge variant="secondary">{samples.length}</Badge>
        </div>
        {depths.map((d) => (
          <div key={d}>
            <span className="text-sm text-muted-foreground">Capa {d}: </span>
            <Badge variant="outline">{byDepth(d).length} pts</Badge>
          </div>
        ))}
      </div>

      {/* Lab name + area assignment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Configuración de la importación</CardTitle>
          <CardDescription>
            Indique el laboratorio y asocie las muestras a una parcela (opcional).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Laboratorio</Label>
            <Input
              className="w-56"
              placeholder="Nombre del laboratorio"
              value={labNameInput}
              onChange={(e) => setLabNameInput(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Parcela (todas las muestras)</Label>
          <Select value={globalArea} onValueChange={setAllAreas}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Seleccionar parcela..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">Sin parcela</SelectItem>
              {areas?.map((a) => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </CardContent>
      </Card>

      {/* Preview table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Muestra</TableHead>
                  <TableHead>Capa</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-center">pH</TableHead>
                  <TableHead className="text-center">V%</TableHead>
                  <TableHead className="text-center">P</TableHead>
                  <TableHead className="text-center">K</TableHead>
                  <TableHead className="text-center">Ca</TableHead>
                  <TableHead className="text-center">Mg</TableHead>
                  <TableHead>Parcela</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samples.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{s.sampleId}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{s.depth}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(s.sampleDate).toLocaleDateString("es-ES")}
                    </TableCell>
                    <TableCell className="text-center text-sm">{s.pH ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{s.baseSaturation ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{s.phosphorus ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{s.potassium ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{s.calcium ?? "—"}</TableCell>
                    <TableCell className="text-center text-sm">{s.magnesium ?? "—"}</TableCell>
                    <TableCell>
                      <Select
                        value={s.areaId ?? "__none__"}
                        onValueChange={(v) => setSampleArea(i, v)}
                      >
                        <SelectTrigger className="h-7 text-xs w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">—</SelectItem>
                          {areas?.map((a) => (
                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <X className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <Button
          disabled={isPending}
          onClick={handleConfirmWithLab}
        >
          {isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ChevronRight className="mr-2 h-4 w-4" />
          )}
          Importar {samples.length} muestras
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────

function DoneStep({ count, onViewList }: { count: number; onViewList: () => void }) {
  return (
    <div className="max-w-sm mx-auto flex flex-col items-center gap-4 py-8">
      <CheckCircle2 className="h-12 w-12 text-green-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Importación completada</h3>
        <p className="text-muted-foreground mt-1">
          {count} {count === 1 ? "muestra importada" : "muestras importadas"} con éxito.
        </p>
      </div>
      <Button onClick={onViewList}>Ver análisis</Button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ImportarAnaliseSoloPage() {
  const router = useRouter()
  const { activeFarm } = useFarm()
  const [step, setStep] = useState<Step>("upload")
  const [rows, setRows] = useState<SampleRow[]>([])
  const [labName, setLabName] = useState("")
  const [importedCount, setImportedCount] = useState(0)

  const handleParsed = (parsed: SampleRow[], lab: string) => {
    setRows(parsed)
    setLabName(lab)
    setStep("review")
  }

  const handleConfirm = async (finalRows: SampleRow[]) => {
    if (!activeFarm) return

    const samples: ImportSample[] = finalRows.map((r) => ({
      sampleId: r.sampleId,
      areaId: r.areaId ?? undefined,
      depth: r.depth,
      sampleDate: r.sampleDate,
      labName: r.labName,
      labReportId: r.labReportId,
      pH: r.pH,
      pHType: r.pHType,
      organicMatter: r.organicMatter,
      phosphorus: r.phosphorus,
      potassium: r.potassium,
      calcium: r.calcium,
      magnesium: r.magnesium,
      aluminum: r.aluminum,
      hPlusAl: r.hPlusAl,
      sumOfBases: r.sumOfBases,
      ctc: r.ctc,
      baseSaturation: r.baseSaturation,
      aluminumSaturation: r.aluminumSaturation,
      sulfur: r.sulfur,
      boron: r.boron,
      copper: r.copper,
      iron: r.iron,
      manganese: r.manganese,
      zinc: r.zinc,
      clayPercent: r.clayPercent,
      siltPercent: r.siltPercent,
      sandPercent: r.sandPercent,
      textureClass: r.textureClass,
    }))

    try {
      const result = await importSoilAnalyses(activeFarm.farmId, samples)
      if (!result.success) {
        toast.error("Error en la importación")
        return
      }
      setImportedCount(result.count ?? 0)
      setStep("done")
    } catch {
      toast.error("Error al importar muestras")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Importar Análisis de Suelo</h1>
        <p className="text-muted-foreground">
          Importe resultados de laboratorio en CSV o XLS
        </p>
      </div>

      {/* Steps indicator */}
      <div className="flex items-center gap-2 text-sm">
        {(["upload", "review", "done"] as Step[]).map((s, i) => {
          const labels = ["1. Archivo", "2. Revisar", "3. Completado"]
          const active = step === s
          const done = (step === "review" && s === "upload") || step === "done"
          return (
            <span key={s} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                active ? "bg-primary text-primary-foreground" :
                done ? "bg-green-100 text-green-700" :
                "bg-muted text-muted-foreground"
              }`}>
                {labels[i]}
              </span>
              {i < 2 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </span>
          )
        })}
      </div>

      {step === "upload" && <UploadStep onParsed={handleParsed} />}
      {step === "review" && (
        <ReviewStep
          rows={rows}
          labName={labName}
          onConfirm={handleConfirm}
          onBack={() => setStep("upload")}
        />
      )}
      {step === "done" && (
        <DoneStep count={importedCount} onViewList={() => router.push("/analise-solo")} />
      )}
    </div>
  )
}
