import { Construction } from "lucide-react"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

interface UnderConstructionProps {
  title: string
  description?: string
}

export function UnderConstruction({ title, description }: UnderConstructionProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Construction className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-1">En desarrollo</h3>
          <p className="text-sm text-muted-foreground">
            Esta funcionalidad está siendo desarrollada.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
