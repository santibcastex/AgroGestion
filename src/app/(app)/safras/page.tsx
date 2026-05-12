import { requireAuth, getUserActiveFarm } from "@/lib/permissions"
import { redirect } from "next/navigation"
import { getCrops } from "@/queries/crops"
import Link from "next/link"
import { Plus, Sprout, MapPin, ClipboardList } from "lucide-react"
import {
  CROP_STATUS_LABELS,
  PLANTING_TYPE_LABELS,
  CULTURE_LABELS,
} from "@/lib/constants"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case "EM_ANDAMENTO":
      return "default" as const
    case "FINALIZADA":
      return "secondary" as const
    default:
      return "outline" as const
  }
}

export default async function SafrasPage() {
  const user = await requireAuth()
  const membership = await getUserActiveFarm(user.id)
  if (!membership) redirect("/login")
  const farmId = membership.farmId

  const crops = await getCrops(farmId)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cosechas</h1>
          <p className="text-muted-foreground">
            Siga y gestione las cosechas de su granja
          </p>
        </div>
        <Button asChild>
          <Link href="/safras/nova">
            <Plus className="mr-2 h-4 w-4" />
            Nueva Cosecha
          </Link>
        </Button>
      </div>

      {crops.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Sprout className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-1">
              Ninguna cosecha registrada
            </h3>
            <p className="text-muted-foreground text-sm mb-4">
              Comience registrando la primera cosecha de su granja.
            </p>
            <Button asChild>
              <Link href="/safras/nova">
                <Plus className="mr-2 h-4 w-4" />
                Nueva Cosecha
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {crops.map((crop) => (
            <Link key={crop.id} href={`/safras/${crop.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{crop.name}</CardTitle>
                    <Badge variant={getStatusBadgeVariant(crop.status)}>
                      {CROP_STATUS_LABELS[crop.status as keyof typeof CROP_STATUS_LABELS] ?? crop.status}
                    </Badge>
                  </div>
                  <CardDescription className="flex gap-1.5 mt-1">
                    {(crop as any).culture && (
                      <Badge variant="outline">
                        {CULTURE_LABELS[(crop as any).culture as string] ?? (crop as any).culture}
                      </Badge>
                    )}
                    {crop.plantingType && (
                      <Badge variant="outline">
                        {PLANTING_TYPE_LABELS[crop.plantingType as keyof typeof PLANTING_TYPE_LABELS] ?? crop.plantingType}
                      </Badge>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {crop.cropAreas?.length ?? 0}{" "}
                      {(crop.cropAreas?.length ?? 0) === 1
                        ? "área vinculada"
                        : "áreas vinculadas"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ClipboardList className="h-4 w-4" />
                    <span>
                      {crop._count?.activities ?? 0}{" "}
                      {(crop._count?.activities ?? 0) === 1
                        ? "actividad"
                        : "actividades"}
                    </span>
                  </div>
                </CardContent>
                <CardFooter>
                  {crop.startDate && (
                    <p className="text-xs text-muted-foreground">
                      Inicio:{" "}
                      {new Date(crop.startDate).toLocaleDateString("es-ES")}
                    </p>
                  )}
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
