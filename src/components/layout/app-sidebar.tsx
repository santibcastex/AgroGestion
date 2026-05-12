"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
  BadgeCheck,
  ChevronRight,
  ChevronsUpDown,
  Grid3x3,
  Leaf,
  LogOut,
  Settings,
  Sprout,
  X,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useFarm } from "@/providers/farm-provider"
import { useNavigation } from "@/providers/navigation-provider"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Farm {
  id: string
  name: string
}

interface FarmMembership {
  id: string
  farmId: string
  role: string
  farm: Farm
}

interface AppSidebarProps {
  farms: FarmMembership[]
  activeFarm: FarmMembership | null
  user: {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

function getInitials(name?: string | null) {
  if (!name) return "U"
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function getRoleLabel(role?: string) {
  switch (role) {
    case "OWNER": return "Propietario"
    case "MANAGER": return "Gerente"
    case "ACCOUNTANT": return "Contador"
    case "WORKER": return "Trabajador"
    case "VIEWER": return "Visualizador"
    default: return "Seleccione una granja"
  }
}

function SidebarContextIndicator() {
  const { context, safra, area } = useNavigation()

  if (context.level === "farm") return null

  return (
    <>
      <SidebarSeparator />
      <div className="px-3 py-2 space-y-1">
        {safra && (
          <Link
            href="/safras"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Leaf className="size-3 shrink-0" />
            <span className="truncate font-medium">{safra.name}</span>
            <X className="size-3 ml-auto shrink-0" />
          </Link>
        )}
        {context.level === "area" && area && (
          <Link
            href={`/safras/${context.safraId}`}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 pl-5 text-xs text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <Grid3x3 className="size-3 shrink-0" />
            <span className="truncate font-medium">{area.name}</span>
            <X className="size-3 ml-auto shrink-0" />
          </Link>
        )}
      </div>
    </>
  )
}

export function AppSidebar({ farms, activeFarm: initialActiveFarm, user }: AppSidebarProps) {
  const pathname = usePathname()
  const { activeFarm, setActiveFarm } = useFarm()
  const { navSections } = useNavigation()

  const currentFarm = activeFarm ?? initialActiveFarm

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                    <Sprout className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">
                      {currentFarm?.farm.name ?? "FarmCore"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {getRoleLabel(currentFarm?.role)}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="bottom"
                sideOffset={4}
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Granjas
                </DropdownMenuLabel>
                {farms.map((membership) => (
                  <DropdownMenuItem
                    key={membership.id}
                    onClick={() => setActiveFarm(membership)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-sm border">
                      <Sprout className="size-4 shrink-0" />
                    </div>
                    <span className="truncate">{membership.farm.name}</span>
                    {membership.id === currentFarm?.id && (
                      <BadgeCheck className="ml-auto size-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarContextIndicator />
      </SidebarHeader>

      <SidebarContent>
        {navSections.map((section) => (
          <Collapsible key={section.label} defaultOpen className="group/collapsible">
            <SidebarGroup>
              <SidebarGroupLabel asChild>
                <CollapsibleTrigger className="flex w-full items-center justify-between">
                  {section.label}
                  <ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive = item.exact
                        ? pathname === item.href
                        : pathname === item.href || pathname.startsWith(item.href + "/")
                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Link href={item.href}>
                              <item.icon className="size-4" />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                    <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">{user.name ?? "Usuario"}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user.image ?? undefined} alt={user.name ?? "Usuario"} />
                      <AvatarFallback className="rounded-lg bg-primary/10 text-primary">
                        {getInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name ?? "Usuario"}</span>
                      <span className="truncate text-xs text-muted-foreground">
                        {user.email}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/perfil" className="gap-2">
                    <BadgeCheck className="size-4" />
                    Perfil
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/configuracoes" className="gap-2">
                    <Settings className="size-4" />
                    Configuración
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                >
                  <LogOut className="size-4" />
                  Salir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
