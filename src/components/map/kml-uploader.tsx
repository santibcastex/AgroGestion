"use client"

import { useRef, useState } from "react"
import { kml } from "@tmcw/togeojson"
import { Upload } from "lucide-react"
import { Button } from "@/components/ui/button"

interface KmlUploaderProps {
  onGeoJsonLoaded: (geojson: unknown) => void
}

export function KmlUploader({ onGeoJsonLoaded }: KmlUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const parser = new DOMParser()
        const xmlDoc = parser.parseFromString(text, "text/xml")

        const parseError = xmlDoc.querySelector("parsererror")
        if (parseError) {
          setError("Archivo KML inválido. Verifique el formato.")
          return
        }

        const geojson = kml(xmlDoc)

        if (
          !geojson.features ||
          geojson.features.length === 0
        ) {
          setError("Ninguna geometría encontrada en el archivo KML.")
          return
        }

        onGeoJsonLoaded(geojson)
      } catch {
        setError("Error al procesar el archivo. Verifique si es un KML válido.")
      }
    }

    reader.onerror = () => {
      setError("Error al leer el archivo.")
    }

    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept=".kml,.kmz"
          onChange={handleFileChange}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
          Importar KML

        </Button>
        {fileName && (
          <span className="text-sm text-muted-foreground truncate max-w-[200px]">
            {fileName}
          </span>
        )}
      </div>
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
