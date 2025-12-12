"use client"

import { Users, FileText, BookOpen, TrendingUp, Settings, Megaphone, LogOut } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"

interface AdminSidebarProps {
  onLogout: () => void
  userPermissions: string[] // Added for dynamic access control
}

interface NavigationItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  moduleId: string // Added to link with permissions
}

const navigationItems: NavigationItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: TrendingUp, moduleId: "dashboard" }, // Assuming 'dashboard' is a permission
  { href: "/admin/inquiries", label: "Inquiries", icon: FileText, moduleId: "inquiries" },
  { href: "/admin/enrollment", label: "Enrollment", icon: Users, moduleId: "enrollment" },
  { href: "/admin/marketing", label: "Marketing Activities", icon: Megaphone, moduleId: "marketing" },
  { href: "/admin/schools", label: "Schools", icon: BookOpen, moduleId: "schools" },
  { href: "/admin/settings", label: "Settings", icon: Settings, moduleId: "settings" }, // Assuming 'settings' is a permission
]

const NavigationItem = ({ item, isActive }: { item: NavigationItem; isActive: boolean }) => {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
        isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {item.label}
    </Link>
  )
}

export function AdminSidebar({ onLogout, userPermissions }: AdminSidebarProps) {
  const pathname = usePathname()
  
  // Ensure userPermissions is always an array and normalize it
  // If permissions array is empty (still loading), show all modules to prevent flicker
  const isPermissionsLoaded = Array.isArray(userPermissions) && userPermissions.length > 0
  const defaultPermissions = ['inquiries', 'enrollment', 'marketing', 'schools', 'settings']
  const permissionsToUse = isPermissionsLoaded ? userPermissions : defaultPermissions
  
  const permissions = Array.isArray(permissionsToUse) 
    ? permissionsToUse.map(p => String(p).toLowerCase().trim())
    : []
  
  // Debug log to help diagnose permission issues (only when permissions are loaded)
  if (typeof window !== 'undefined' && isPermissionsLoaded) {
    console.log('AdminSidebar - Raw userPermissions:', userPermissions)
    console.log('AdminSidebar - Normalized permissions:', permissions)
    console.log('AdminSidebar - Includes schools?', permissions.includes('schools'))
  }

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
          <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">Navigation</h3>
          {navigationItems
            .filter(item => {
              // Dashboard always shows, other items show if permission exists
              // Normalize permissions to handle case sensitivity and whitespace
              const normalizedPermissions = permissions.map(p => String(p).toLowerCase().trim())
              const normalizedModuleId = item.moduleId.toLowerCase().trim()
              const shouldShow = item.moduleId === "dashboard" || normalizedPermissions.includes(normalizedModuleId)
              
              // Debug log for all modules to see what's happening
              if (item.moduleId === "schools" || item.moduleId === "inquiries" || item.moduleId === "enrollment" || item.moduleId === "marketing") {
                console.log(`${item.moduleId} module check:`, {
                  moduleId: item.moduleId,
                  normalizedModuleId,
                  permissions,
                  normalizedPermissions,
                  includes: normalizedPermissions.includes(normalizedModuleId),
                  shouldShow
                })
              }
              return shouldShow
            })
            .filter(item => item.moduleId !== "settings") // Exclude settings from main navigation
            .map((item) => (
              <NavigationItem key={item.href} item={item} isActive={pathname === item.href} />
            ))}
        </div>

        <div className="mt-auto pt-8">
          <div className="mb-8">
            <h3 className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider mb-3">Settings</h3>
            {navigationItems
              .filter(item => item.moduleId === "settings" || permissions.includes(item.moduleId))
              .slice(-1)
              .map((item) => (
                <NavigationItem key={item.href} item={item} isActive={pathname === item.href} />
              ))}
          </div>

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
