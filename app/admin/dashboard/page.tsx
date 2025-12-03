"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Users, BookOpen, TrendingUp, CalendarIcon, Building2, Search, Target } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { AdminSidebar } from "@/components/admin-sidebar"
import { KpiCard } from "@/components/kpi/kpi-card"
import { format } from "date-fns"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { supabase } from "@/lib/supabase-client"
import { DateRangePicker } from "@/components/date-range-picker"
import { useDateRange } from "@/hooks/use-date-range"

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
const getStatsData = (
  inquiriesCount: number,
  enrollmentsCount: number,
  inquiriesGrowth: number,
  enrollmentsGrowth: number,
  upcomingActivity: { title: string; date: string } | null,
  isLoading: boolean
): StatCard[] => {
  const conversionRate = inquiriesCount > 0 ? Math.round((enrollmentsCount / inquiriesCount) * 100) : 0

  return [
    {
      title: "Total Inquiries",
      value: isLoading ? "Loading..." : inquiriesCount.toLocaleString(),
      change: `${inquiriesGrowth >= 0 ? '+' : ''}${inquiriesGrowth}% from last year`,
      icon: FileText,
    },
    {
      title: "Total Enrolled",
      value: isLoading ? "Loading..." : enrollmentsCount.toLocaleString(),
      change: `${enrollmentsGrowth >= 0 ? '+' : ''}${enrollmentsGrowth}% from last year`,
      icon: Users,
    },
    {
      title: "Upcoming Activity",
      value: isLoading ? "Loading..." : upcomingActivity ? upcomingActivity.title : "No upcoming activities",
      change: upcomingActivity ? format(new Date(upcomingActivity.date), "MMM dd, yyyy") : "None scheduled",
      icon: CalendarIcon,
    },
    {
      title: "Conversion Rate",
      value: isLoading ? "Loading..." : `${conversionRate}%`,
      change: `${enrollmentsGrowth >= 0 ? '+' : ''}${enrollmentsGrowth}% from last year`,
      icon: TrendingUp,
    },
  ]
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const { startDate, endDate, setStartDate, setEndDate } = useDateRange()
  const [inquiriesCount, setInquiriesCount] = useState<number>(0)
  const [enrollmentsCount, setEnrollmentsCount] = useState<number>(0)
  const [inquiriesGrowth, setInquiriesGrowth] = useState<number>(0)
  const [enrollmentsGrowth, setEnrollmentsGrowth] = useState<number>(0)
  const [upcomingActivity, setUpcomingActivity] = useState<{ title: string; date: string } | null>(null)
  const [isLoadingInquiries, setIsLoadingInquiries] = useState<boolean>(true)
  const [dashboardData, setDashboardData] = useState<{
    topCourses: any[]
    topStrands: any[]
    enrolledPerProgram: any[]
    enrolledPerStrand: any[]
  } | null>(null)
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true)
  const [lastFetchTime, setLastFetchTime] = useState<number>(0)

  // Use pre-calculated data from API
  const topCourses = dashboardData?.topCourses || []
  const topStrands = dashboardData?.topStrands || []
  const enrolledPerProgram = dashboardData?.enrolledPerProgram || []
  const enrolledPerStrand = dashboardData?.enrolledPerStrand || []

  // Colors for pie charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

  useEffect(() => {
    // Placeholder for authentication check
  }, [])

  useEffect(() => {
    const fetchInquiriesCount = async () => {
      setIsLoadingInquiries(true)
      try {
        const { count, error } = await supabase
          .from('inquiries')
          .select('*', { count: 'exact', head: true })

        if (error) {
          console.error('Error fetching inquiries count:', error)
        } else {
          setInquiriesCount(count || 0)
        }
      } catch (err) {
        console.error('Error fetching inquiries count:', err)
      } finally {
        setIsLoadingInquiries(false)
      }
    }

    fetchInquiriesCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchInquiriesCount, 30000)

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const fetchDashboardData = async () => {
      const now = Date.now()
      const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes cache

      // Use cached data if available and not expired
      if (dashboardData && (now - lastFetchTime) < CACHE_DURATION) {
        return
      }

      setIsLoadingData(true)
      try {
        // Check authentication first
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          console.error('Authentication error:', authError)
          return
        }

        // Format dates for API request
        const formattedStartDate = startDate ? format(startDate, 'yyyy-MM-dd') : ''
        const formattedEndDate = endDate ? format(endDate, 'yyyy-MM-dd') : ''
        
        // Build API URL with date parameters
        let apiUrl = '/api/dashboard-stats'
        const params = new URLSearchParams()
        
        if (formattedStartDate) {
          params.append('startDate', formattedStartDate)
        }
        
        if (formattedEndDate) {
          params.append('endDate', formattedEndDate)
        }
        
        if (params.toString()) {
          apiUrl += `?${params.toString()}`
        }
        
        console.log('Fetching dashboard stats with URL:', apiUrl)
        const response = await fetch(apiUrl)
        const data = await response.json()

        if (response.ok) {
          setEnrollmentsCount(data.enrollmentsCount || 0)
          setInquiriesGrowth(data.inquiriesGrowth || 0)
          setEnrollmentsGrowth(data.enrollmentsGrowth || 0)
          setUpcomingActivity(data.upcomingActivity)
          setDashboardData({
            topCourses: data.topCourses,
            topStrands: data.topStrands,
            enrolledPerProgram: data.enrolledPerProgram,
            enrolledPerStrand: data.enrolledPerStrand
          })
          setLastFetchTime(now)
        } else {
          console.error('Error fetching dashboard data:', data.error)
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchDashboardData()
  }, [dashboardData, lastFetchTime])

  const handleLogout = () => router.push("/login")

  const handleRefreshData = () => {
    setLastFetchTime(0) // Force refresh by resetting cache timestamp
  }



  const renderInquiryItem = (inquiry: Inquiry) => (
    <div key={inquiry.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="font-medium text-sm text-foreground">{inquiry.name}</p>
        <p className="text-xs text-muted-foreground">{inquiry.program}</p>
      </div>
      <span className="text-xs text-muted-foreground">{inquiry.date}</span>
    </div>
  )

  const renderProgramItem = (program: ProgramPerformance) => (
    <div key={program.category} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{program.category}</span>
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

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Dashboard</h1>
                <p className="text-muted-foreground">
                  Overview of your educational institution's performance and activities
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="start-date" className="text-sm font-medium text-foreground mb-1">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-ring focus-visible:border-ring h-9 px-3"
                      >
                        {startDate ? format(startDate, "MM/dd/yyyy") : "Select date"}
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
                </div>
                <div className="flex flex-col">
                  <Label htmlFor="end-date" className="text-sm font-medium text-foreground mb-1">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="end-date"
                        variant="outline"
                        className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-ring focus-visible:border-ring h-9 px-3"
                      >
                        {endDate ? format(endDate, "MM/dd/yyyy") : "Select date"}
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshData}
                  disabled={isLoadingData}
                  className="flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {isLoadingData ? 'Refreshing...' : 'Refresh Data'}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {getStatsData(inquiriesCount, enrollmentsCount, inquiriesGrowth, enrollmentsGrowth, upcomingActivity, isLoadingInquiries).map((stat, index) => (
              <KpiCard
                key={index}
                title={stat.title}
                value={stat.value}
                change={stat.change}
                icon={stat.icon}
              />
            ))}
          </div>

          {/* Removed example module cards */}

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Preferred Courses Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Preferred Courses</CardTitle>
                <CardDescription>Distribution of course preferences from inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : topCourses.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: {
                        label: "Inquiries",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <PieChart>
                      <Pie
                        data={topCourses}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topCourses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Preferred Strands Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Preferred Strands</CardTitle>
                <CardDescription>Distribution of strand preferences from inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : topStrands.length > 0 ? (
                  <ChartContainer
                    config={{
                      value: {
                        label: "Inquiries",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <PieChart>
                      <Pie
                        data={topStrands}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topStrands.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrolled Students per Program - Horizontal Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students by Program</CardTitle>
                <CardDescription>Number of enrolled students for each program</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : enrolledPerProgram.length > 0 ? (
                  <ChartContainer
                    config={{
                      enrolled: {
                        label: "Enrolled",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <BarChart
                      layout="vertical"
                      data={enrolledPerProgram}
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={90} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrolled Students per Strand - Horizontal Bar */}
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students by Strand</CardTitle>
                <CardDescription>Number of enrolled students for each strand</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingData ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : enrolledPerStrand.length > 0 ? (
                  <ChartContainer
                    config={{
                      enrolled: {
                        label: "Enrolled",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[300px]"
                  >
                    <BarChart
                      layout="vertical"
                      data={enrolledPerStrand}
                      margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={90} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center">
                    <p className="text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
    </div>
  )
}
