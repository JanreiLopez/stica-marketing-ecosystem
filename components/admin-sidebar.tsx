"use client"

import { Users, FileText, BookOpen, TrendingUp, Settings, Megaphone, ClipboardCheck, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { memo } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  onLogout: () => void
}

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

// Navigation items - all modules that lead to their designated pages
const navigationItems: NavigationItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    icon: TrendingUp,
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
    href: "/admin/schools",
    label: "Schools",
    icon: BookOpen,
  },
  {
    href: "/admin/evaluation",
    label: "Evaluation",
    icon: ClipboardCheck,
  },
]

const settingsItems: NavigationItem[] = [
  {
    href: "/admin/settings",
    label: "Settings",
    icon: Settings,
  },
]

// Reusable navigation item component
const NavigationItem = memo(({ item, isActive }: { item: NavigationItem; isActive: boolean }) => {
  const Icon = item.icon
  
  return (
    <Link
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
})

NavigationItem.displayName = "NavigationItem"

export function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 w-64 bg-sidebar border-r border-sidebar-border h-screen flex flex-col z-50">
      {/* Logo and Name Section */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-3">
          <Image 
            src="/marketeam-logo.png" 
            alt="Marketeam Logo" 
            width={56} 
            height={56} 
            className="h-14 w-14"
          />
          <div className="flex flex-col">
            <span className="text-2xl font-serif font-bold text-sidebar-foreground leading-tight">MARKETEAM</span>
            <span className="text-xs font-semibold text-sidebar-foreground/80 uppercase tracking-wider">ANALYTICS</span>
          </div>
        </Link>
      </div>

      <nav className="p-4 flex flex-col flex-1 overflow-y-auto">
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
            Navigation
          </h3>

          {navigationItems.map((item) => (
            <NavigationItem
              key={item.href}
              item={item}
              isActive={pathname === item.href}
            />
          ))}
        </div>

        <div className="mt-auto pt-8">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">
              Settings
            </h3>
            
            {settingsItems.map((item) => (
              <NavigationItem
                key={item.href}
                item={item}
                isActive={pathname === item.href}
              />
            ))}
          </div>

          {/* Logout Button */}
          <div className="pt-4 border-t border-sidebar-border">
            <Button
              variant="outline"
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              onClick={onLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  )
}
