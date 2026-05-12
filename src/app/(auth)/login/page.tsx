"use client"

import { useActionState, useEffect, useTransition } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Loader2, Lock, Mail } from "lucide-react"
import { toast } from "sonner"

import { login } from "@/actions/auth"
import { loginSchema } from "@/lib/validators"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isPending, startTransition] = useTransition()
  const [state, formAction] = useActionState(login, { error: null })

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    if (state?.error) {
      toast.error(state.error)
    }
  }, [state])

  function onSubmit(values: LoginFormValues) {
    startTransition(() => {
      const formData = new FormData()
      formData.append("email", values.email)
      formData.append("password", values.password)
      formAction(formData)
    })
  }

  return (
    <Card className="w-full border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-xl font-semibold text-zinc-50">
          Ingresar a su cuenta
        </CardTitle>
        <CardDescription className="text-zinc-400">
          Ingrese sus credenciales para acceder al panel
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Correo electrónico</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <Input
                        type="email"
                        placeholder="su@correo.com"
                        className="border-zinc-800 bg-zinc-950/50 pl-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-emerald-600"
                        disabled={isPending}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-zinc-300">Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <Input
                        type="password"
                        placeholder="********"
                        className="border-zinc-800 bg-zinc-950/50 pl-10 text-zinc-50 placeholder:text-zinc-600 focus-visible:ring-emerald-600"
                        disabled={isPending}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-emerald-600 text-zinc-50 hover:bg-emerald-700"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ingresando...
                </>
              ) : (
                "Ingresar"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="justify-center">
        <p className="text-sm text-zinc-400">
          ¿Aún no tiene una cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-emerald-500 transition-colors hover:text-emerald-400"
          >
            Crear cuenta
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
