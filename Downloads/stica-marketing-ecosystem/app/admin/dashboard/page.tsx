"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Users, BookOpen, TrendingUp, CalendarIcon, Building2, Search, Target } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { format } from "date-fns"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts"

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
    title: "Total qualified leads",
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
  const today = new Date()
  const oneYearLater = new Date(today)
  oneYearLater.setFullYear(today.getFullYear() + 1)
  
  const [startDate, setStartDate] = useState<Date | undefined>(today)
  const [endDate, setEndDate] = useState<Date | undefined>(oneYearLater)

  useEffect(() => {
    // Placeholder for authentication check
  }, [])

  const handleLogout = () => router.push("/admin/login")

  const renderStatCard = (stat: StatCard) => {
    const Icon = stat.icon
    return (
      <Card key={stat.title}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stat.value}</div>
          <p className="text-xs text-muted-foreground">{stat.change}</p>
        </CardContent>
      </Card>
    )
  }

  const renderInquiryItem = (inquiry: Inquiry) => (
    <div key={inquiry.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-sm">{inquiry.name}</p>
        <p className="text-xs text-muted-foreground">{inquiry.program}</p>
      </div>
      <span className="text-xs text-muted-foreground">{inquiry.date}</span>
    </div>
  )

  const renderProgramItem = (program: ProgramPerformance) => (
    <div key={program.category} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{program.category}</span>
        <span className="text-sm text-muted-foreground">{program.enrolled} students</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div className="bg-primary h-2 rounded-full" style={{ width: `${program.percentage}%` }} />
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
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Overview of your educational institution's performance and activities
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] justify-start text-left font-normal border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 h-9 px-3"
                    >
                      {startDate ? format(startDate, "MM/dd/yyyy") : "Start Date"}
                      <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear() - 10}
                      toYear={new Date().getFullYear() + 10}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[140px] justify-start text-left font-normal border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500 h-9 px-3"
                    >
                      {endDate ? format(endDate, "MM/dd/yyyy") : "End Date"}
                      <CalendarIcon className="ml-auto h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      captionLayout="dropdown"
                      fromYear={new Date().getFullYear() - 10}
                      toYear={new Date().getFullYear() + 10}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {STATS_DATA.map(renderStatCard)}
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Inquiries Module */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>Inquiries Module</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Inquiries</p>
                      <p className="text-2xl font-bold">1,234</p>
                      <p className="text-xs text-muted-foreground">Last Month: 1,500</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Current Capacity</p>
                      <p className="text-2xl font-bold">35%</p>
                      <p className="text-xs text-muted-foreground">Target Met: 35%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Inquiry Trend (Monthly)</p>
                    <ChartContainer
                      config={{
                        inquiries: {
                          label: "Inquiries",
                          color: "#3b82f6",
                        },
                      }}
                      className="h-[200px]"
                    >
                      <LineChart data={[
                        { month: "Jan", inquiries: 420 },
                        { month: "Feb", inquiries: 480 },
                        { month: "Mar", inquiries: 520 },
                        { month: "Apr", inquiries: 580 },
                        { month: "May", inquiries: 640 },
                        { month: "Jun", inquiries: 720 },
                        { month: "Jul", inquiries: 800 },
                        { month: "Aug", inquiries: 880 },
                        { month: "Sep", inquiries: 960 },
                        { month: "Oct", inquiries: 1040 },
                        { month: "Nov", inquiries: 1120 },
                        { month: "Dec", inquiries: 1200 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line type="monotone" dataKey="inquiries" stroke="#3b82f6" strokeWidth={2} />
                      </LineChart>
                    </ChartContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Enrollment Module */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  <CardTitle>Enrollment Module</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total: Current Capacity</p>
                      <p className="text-2xl font-bold">525</p>
                      <p className="text-xs text-muted-foreground">70%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Accepted: Target Met</p>
                      <p className="text-2xl font-bold">90%</p>
                      <p className="text-xs text-muted-foreground">90%</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Enrollment Stages</p>
                    <ChartContainer
                      config={{
                        enrolled: {
                          label: "Enrolled",
                          color: "#3b82f6",
                        },
                      }}
                      className="h-[150px]"
                    >
                      <BarChart data={[
                        { stage: "Inquiry", value: 43 },
                        { stage: "City College", value: 45 },
                        { stage: "Accepted", value: 23 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="stage" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Enrollment Funnel</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Application</span>
                        <span className="text-sm font-medium">100%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-blue-500 h-4 rounded-full" style={{ width: "100%" }}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enrollment Process</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-blue-500 h-4 rounded-full" style={{ width: "75%" }}></div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Enrolled</span>
                        <span className="text-sm font-medium">45%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-4">
                        <div className="bg-blue-500 h-4 rounded-full" style={{ width: "45%" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Schools Network */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <CardTitle>Schools Network</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">School List</p>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Search schools..." className="h-8" />
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Northwood High</span>
                        <span className="text-xs text-muted-foreground">120 enrolled</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Riverside Academy</span>
                        <span className="text-xs text-muted-foreground">95 enrolled</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-sm">Green Valley Prep</span>
                        <span className="text-xs text-muted-foreground">78 enrolled</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Competitor Schools</p>
                    <ChartContainer
                      config={{
                        competitors: {
                          label: "Competitors",
                          color: "#3b82f6",
                        },
                      }}
                      className="h-[150px]"
                    >
                      <BarChart data={[
                        { school: "School A", value: 200, percentage: 10 },
                        { school: "School B", value: 200, percentage: 70 },
                        { school: "School C", value: 203, percentage: 10 },
                        { school: "School D", value: 205, percentage: 20 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="school" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Marketing Activities */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <CardTitle>Marketing Activities</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">Activity Generated Leads</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="h-8">Activity Type</TableHead>
                          <TableHead className="h-8">Date</TableHead>
                          <TableHead className="h-8 text-right">Leads</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="text-sm">Career Fair</TableCell>
                          <TableCell className="text-sm">Oct 2023</TableCell>
                          <TableCell className="text-sm text-right font-medium">104</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm">School Visit - Northwood</TableCell>
                          <TableCell className="text-sm">Nov 2023</TableCell>
                          <TableCell className="text-sm text-right font-medium">100</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm">School Visit - Riverside</TableCell>
                          <TableCell className="text-sm">Nov 2023</TableCell>
                          <TableCell className="text-sm text-right font-medium">204</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm">Online Ad Campaign</TableCell>
                          <TableCell className="text-sm">Dec 2023</TableCell>
                          <TableCell className="text-sm text-right font-medium">209</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="text-sm">Social Media Ads</TableCell>
                          <TableCell className="text-sm">Ongoing</TableCell>
                          <TableCell className="text-sm text-right font-medium">303</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-2">Lead Generation by Channel</p>
                    <ChartContainer
                      config={{
                        leads: {
                          label: "Leads",
                          color: "#3b82f6",
                        },
                      }}
                      className="h-[120px]"
                    >
                      <BarChart data={[
                        { channel: "Career Fair", value: 200, percentage: 19 },
                        { channel: "School Visits", value: 200, percentage: 30 },
                        { channel: "Online Ads", value: 201, percentage: 72 },
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="channel" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="value" fill="#3b82f6" />
                      </BarChart>
                    </ChartContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  )
}
