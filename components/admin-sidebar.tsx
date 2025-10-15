"use client"

import { Users, FileText, BookOpen, TrendingUp, Settings, LogOut, BarChart3, Megaphone, ClipboardCheck } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"

interface AdminSidebarProps {
  onLogout: () => void
}

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname()

  const navigationItems = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: TrendingUp,
    },
    {
      href: "/admin/schools",
      label: "Schools",
      icon: BookOpen,
    },
    {
      href: "/admin/inquiries",
      label: "Inquiries",
      icon: FileText,
    },
    {
      href: "/admin/enrollment",
      label: "Enrollment",
      icon: Users,
    },
    {
      href: "/admin/marketing",
      label: "Marketing Activities",
      icon: Megaphone,
    },
    {
      href: "/admin/evaluation",
      label: "Evaluation",
      icon: ClipboardCheck,
    },
  ]

  const settingsItems = [
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border min-h-[calc(100vh-73px)]">
      <nav className="p-4">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
            Navigation
          </h3>

          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>

        <div className="mt-8">
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
            Settings
          </h3>
          
          {settingsItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </aside>
  )
}


