"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, TrendingUp, Calendar, LogOut } from "lucide-react"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function EnrollmentPage() {
  const router = useRouter()

  const handleLogout = () => {
    router.push("/admin/login")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="/marketeam-logo.png" 
                alt="Marketeam Logo" 
                width={48} 
                height={48} 
                className="h-12 w-12"
              />
              <span className="text-2xl font-serif font-bold text-primary">Marketeam</span>
              <span className="text-sm text-muted-foreground ml-2">Admin Dashboard</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">Welcome, Administrator</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar Navigation */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <AdminBreadcrumbs />
          
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Enrollment Management</h1>
            <p className="text-muted-foreground">Track student enrollment, program capacity, and registration trends</p>
          </div>

          {/* Enrollment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Enrolled</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">856</div>
                <p className="text-xs text-muted-foreground">+8% from last semester</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">New Enrollments</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">124</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Capacity Utilization</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">78%</div>
                <p className="text-xs text-muted-foreground">Overall capacity</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Retention Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground">Student retention</p>
              </CardContent>
            </Card>
          </div>

          {/* Program Enrollment Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Enrollment</CardTitle>
                <CardDescription>Current enrollment by program category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { program: "BS Information Technology (BSIT)", enrolled: 156, capacity: 200, percentage: 78 },
                    { program: "BS Computer Science (BSCS)", enrolled: 134, capacity: 150, percentage: 89 },
                    { program: "BS Business Administration (BSBA)", enrolled: 189, capacity: 250, percentage: 76 },
                    { program: "BS Hospitality Management (BSHM)", enrolled: 98, capacity: 120, percentage: 82 },
                    { program: "BS Tourism Management (BSTM)", enrolled: 87, capacity: 100, percentage: 87 },
                    { program: "IT in Mobile App and Web Development", enrolled: 145, capacity: 180, percentage: 81 },
                    { program: "Humanities and Social Sciences (HUMMS)", enrolled: 92, capacity: 120, percentage: 77 },
                    { program: "Accountancy, Business, and Management (ABM)", enrolled: 134, capacity: 160, percentage: 84 },
                  ].map((program, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{program.program}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {program.enrolled}/{program.capacity}
                          </span>
                          <Badge variant={program.percentage > 85 ? "destructive" : "default"}>
                            {program.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${program.percentage}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent Enrollments</CardTitle>
                <CardDescription>Latest student registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      name: "Alex Thompson",
                      program: "Software Development",
                      date: "Jan 15, 2024",
                      status: "Confirmed",
                    },
                    { name: "Maria Garcia", program: "Data Science", date: "Jan 14, 2024", status: "Pending" },
                    { name: "David Kim", program: "Business Admin", date: "Jan 13, 2024", status: "Confirmed" },
                    { name: "Lisa Wang", program: "Digital Marketing", date: "Jan 12, 2024", status: "Confirmed" },
                    { name: "James Wilson", program: "Cybersecurity", date: "Jan 11, 2024", status: "Pending" },
                  ].map((enrollment, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{enrollment.name}</p>
                        <p className="text-xs text-muted-foreground">{enrollment.program}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={enrollment.status === "Confirmed" ? "default" : "secondary"}>
                          {enrollment.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">{enrollment.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
