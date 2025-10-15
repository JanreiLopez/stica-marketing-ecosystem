"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Users, Star, LogOut } from "lucide-react"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

export default function EvaluationPage() {
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
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Program Evaluation</h1>
            <p className="text-muted-foreground">
              Assess program effectiveness, student satisfaction, and learning outcomes
            </p>
          </div>

          {/* Evaluation Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overall Satisfaction</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.7/5</div>
                <p className="text-xs text-muted-foreground">+0.2 from last semester</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89%</div>
                <p className="text-xs text-muted-foreground">+3% improvement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Employment Rate</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">94%</div>
                <p className="text-xs text-muted-foreground">Within 6 months</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">NPS Score</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">72</div>
                <p className="text-xs text-muted-foreground">Excellent rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Program Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Program Ratings</CardTitle>
                <CardDescription>Student satisfaction by program</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { program: "BS Information Technology (BSIT)", rating: 4.8, responses: 156, trend: "+0.3" },
                    { program: "BS Computer Science (BSCS)", rating: 4.7, responses: 134, trend: "+0.1" },
                    { program: "BS Business Administration (BSBA)", rating: 4.6, responses: 189, trend: "+0.2" },
                    { program: "BS Hospitality Management (BSHM)", rating: 4.5, responses: 98, trend: "-0.1" },
                    { program: "BS Tourism Management (BSTM)", rating: 4.9, responses: 87, trend: "+0.4" },
                    { program: "IT in Mobile App and Web Development", rating: 4.7, responses: 145, trend: "+0.2" },
                    { program: "Humanities and Social Sciences (HUMMS)", rating: 4.4, responses: 92, trend: "+0.1" },
                    { program: "Accountancy, Business, and Management (ABM)", rating: 4.6, responses: 134, trend: "+0.3" },
                  ].map((program, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="font-medium text-sm">{program.program}</p>
                        <p className="text-xs text-muted-foreground">{program.responses} responses</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${
                                  i < Math.floor(program.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium">{program.rating}</span>
                        </div>
                        <p className={`text-xs ${program.trend.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                          {program.trend}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data-slot</CardTitle>
                <CardDescription>Key performance indicators for student success</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { metric: "open", score: 92, target: 85, status: "Exceeds" },
                    { metric: "open", score: 88, target: 90, status: "Below" },
                    { metric: "open", score: 94, target: 80, status: "Exceeds" },
                    { metric: "open", score: 87, target: 85, status: "Meets" },
                    { metric: "open", score: 91, target: 85, status: "Exceeds" },
                  ].map((outcome, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{outcome.metric}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{outcome.score}%</span>
                          <Badge
                            variant={
                              outcome.status === "Exceeds"
                                ? "default"
                                : outcome.status === "Meets"
                                  ? "secondary"
                                  : "destructive"
                            }
                          >
                            {outcome.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            outcome.status === "Exceeds"
                              ? "bg-green-500"
                              : outcome.status === "Meets"
                                ? "bg-primary"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${outcome.score}%` }}
                        ></div>
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
