"use client"

import { useTransition, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, Settings, Users, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { farmSchema } from "@/lib/validators"
import { updateFarm, getFarmMembers, removeFarmMember } from "@/actions/settings"
import { useFarm } from "@/providers/farm-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { CertificateManager } from "@/components/nfe/certificate-manager"

type FarmFormValues = z.infer<typeof farmSchema>

interface Member {
  id: string
  userId: string
  role: string
  user: { name: string; email: string }
}

const roleLabels: Record<string, string> = {
  OWNER: "Propietario",
  MANAGER: "Gerente",
  ACCOUNTANT: "Contador",
  WORKER: "Trabajador",
  VIEWER: "Visualizador",
}

export default function ConfiguracoesPage() {
  const [isPending, startTransition] = useTransition()
  const [members, setMembers] = useState<Member[]>([])
  const router = useRouter()
  const { activeFarm } = useFarm()

  const form = useForm<FarmFormValues>({
    resolver: zodResolver(farmSchema) as any,
    defaultValues: {
      name: "",
      city: "",
      state: "",
      document: "",
    },
  })

  useEffect(() => {
    if (!activeFarm) return
    form.reset({
      name: activeFarm.farm.name,
      city: (activeFarm.farm as any).city ?? "",
      state: (activeFarm.farm as any).state ?? "",
      document: (activeFarm.farm as any).document ?? "",
    })
    getFarmMembers(activeFarm.farmId).then(setMembers).catch(() => {})
  }, [activeFarm, form])

  function onSubmit(values: FarmFormValues) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await updateFarm(activeFarm.farmId, values)
        toast.success("Granja actualizada con éxito")
        router.refresh()
      } catch {
        toast.error("Error al actualizar granja")
      }
    })
  }

  function handleRemoveMember(membershipId: string) {
    if (!activeFarm) return
    startTransition(async () => {
      try {
        await removeFarmMember(activeFarm.farmId, membershipId)
        setMembers((prev) => prev.filter((m) => m.id !== membershipId))
        toast.success("Miembro eliminado")
      } catch {
        toast.error("Error al eliminar miembro")
      }
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="text-muted-foreground mt-1">
          Gestione la configuración de la granja
        </p>
      </div>

      <Tabs defaultValue="fazenda" className="space-y-4">
        <TabsList>
          <TabsTrigger value="fazenda">Granja</TabsTrigger>
          <TabsTrigger value="certificado">Certificado A1</TabsTrigger>
        </TabsList>

        <TabsContent value="fazenda" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Datos de la Granja
                  </CardTitle>
                  <CardDescription>
                    Información general de la propiedad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de la Granja</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Granja San Pablo"
                              disabled={isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="document"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CNPJ / CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="00.000.000/0000-00"
                              disabled={isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ciudad</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ribeirão Preto"
                              disabled={isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estado</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SP"
                              disabled={isPending}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6">
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Guardar Cambios
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Miembros de la Granja
              </CardTitle>
              <CardDescription>
                Usuarios con acceso a esta granja
              </CardDescription>
            </CardHeader>
            <CardContent>
              {members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Ningún miembro encontrado
                </p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div>
                        <p className="font-medium">{member.user.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {member.user.email}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {roleLabels[member.role] ?? member.role}
                        </Badge>
                        {member.role !== "OWNER" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={isPending}
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificado" className="space-y-6">
          <CertificateManager />
        </TabsContent>
      </Tabs>
    </div>
  )
}
