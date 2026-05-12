"use client"

import { useState } from "react"
import { syncNdviForArea } from "@/actions/ndvi"
import { Button } from "@/components/ui/button"
import { Satellite, Loader2 } from "lucide-react"

interface NdviSyncButtonProps {
  areaId: string
}

export function NdviSyncButton({ areaId }: NdviSyncButtonProps) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; count?: number; error?: string } | null>(null)

  async function handleSync() {
    setLoading(true)
    setResult(null)
    try {
      const res = await syncNdviForArea(areaId)
      setResult({ success: true, count: res.count })
    } catch (err) {
      setResult({ success: false, error: err instanceof Error ? err.message : "Error al sincronizar" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleSync} disabled={loading} variant="outline" size="sm">
        {loading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Satellite className="mr-2 h-4 w-4" />
        )}
        {loading ? "Buscando datos..." : "Actualizar NDVI"}
      </Button>
      {result && (
        <span className={`text-xs ${result.success ? "text-muted-foreground" : "text-destructive"}`}>
          {result.success
            ? `${result.count} lecturas obtenidas`
            : result.error}
        </span>
      )}
    </div>
  )
}
