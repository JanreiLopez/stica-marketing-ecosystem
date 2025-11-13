"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { FileText, Users, BookOpen, TrendingUp } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"

// Types
interface Inquiry {
  name: string
  program: string
  date: string
}

interface ProgramPerformance {
  category: string
  enrolled: number
  percentage: number
}

interface StatCard {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
}

// Constants
const STATS_DATA: StatCard[] = [
  {
    title: "Total Inquiries",
    value: "1,234",
    change: "+12% from last month",
    icon: FileText,
  },
  {
    title: "Active Students",
    value: "856",
    change: "+8% from last month",
    icon: Users,
  },
  {
    title: "Programs",
    value: "24",
    change: "3 new this quarter",
    icon: BookOpen,
  },
  {
    title: "Conversion Rate",
    value: "68%",
    change: "+5% from last month",
    icon: TrendingUp,
  },
]

const RECENT_INQUIRIES: Inquiry[] = [
  { name: "John Smith", program: "Software Development", date: "2 hours ago" },
  { name: "Sarah Johnson", program: "Data Science", date: "4 hours ago" },
  { name: "Mike Chen", program: "Business Admin", date: "6 hours ago" },
  { name: "Emily Davis", program: "Digital Marketing", date: "8 hours ago" },
]

const PROGRAM_PERFORMANCE: ProgramPerformance[] = [
  { category: "Technology Programs", enrolled: 342, percentage: 85 },
  { category: "Business Programs", enrolled: 298, percentage: 72 },
  { category: "Certification Programs", enrolled: 216, percentage: 68 },
]

export default function AdminDashboardPage() {
  const router = useRouter()

  // Simple auth check - in a real app, this would be more robust
  useEffect(() => {
    // This is a placeholder for actual authentication check
    // In a real app, you'd check for valid session/token
  }, [])

  const handleLogout = (): void => {
    // Clear authentication and redirect to login
    router.push("/admin/login")
  }

  const renderStatCard = (stat: StatCard, index: number) => {
    const IconComponent = stat.icon
    return (
      <Card key={index}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          <IconComponent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <p className="text-xs text-muted-foreground">{stat.change}</p>
        </CardContent>
      </Card>
    )
  }

  const renderInquiryItem = (inquiry: Inquiry, index: number) => (
    <div
      key={index}
      className="flex items-center justify-between py-2 border-b border-border last:border-0"
    >
      <div>
        <p className="font-medium text-sm">{inquiry.name}</p>
        <p className="text-xs text-muted-foreground">{inquiry.program}</p>
      </div>
      <span className="text-xs text-muted-foreground">{inquiry.date}</span>
    </div>
  )

  const renderProgramItem = (program: ProgramPerformance, index: number) => (
    <div key={index} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{program.category}</span>
        <span className="text-sm text-muted-foreground">{program.enrolled} students</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full" 
          style={{ width: `${program.percentage}%` }}
        />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          <AdminBreadcrumbs />

          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Overview of your educational institution's performance and activities
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {STATS_DATA.map(renderStatCard)}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Inquiries</CardTitle>
                <CardDescription>Latest program inquiries from prospective students</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {RECENT_INQUIRIES.map(renderInquiryItem)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Program Performance</CardTitle>
                <CardDescription>Enrollment statistics by program category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {PROGRAM_PERFORMANCE.map(renderProgramItem)}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  )
}
