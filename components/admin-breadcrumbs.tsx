"use client"

import { ChevronRight, Home } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdminBreadcrumbs() {
  const pathname = usePathname()

  // Generate breadcrumb items based on current path
  const pathSegments = pathname.split("/").filter(Boolean)

  const breadcrumbItems = [
    { label: "Home", href: "/", icon: Home },
    ...pathSegments.map((segment, index) => {
      const href = "/" + pathSegments.slice(0, index + 1).join("/")
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ")
      return { label, href }
    }),
  ]

  if (breadcrumbItems.length <= 2) return null // Don't show breadcrumbs for simple paths

  return (
    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-4">
      {breadcrumbItems.map((item, index) => (
        <div key={item.href} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-1" />}
          {index === breadcrumbItems.length - 1 ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link href={item.href} className="hover:text-foreground transition-colors flex items-center gap-1">
              {item.icon && <item.icon className="h-3 w-3" />}
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
