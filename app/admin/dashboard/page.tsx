"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { FileText, Users, BookOpen, TrendingUp, CalendarIcon, Building2, Search, Target, MoreVertical } from "lucide-react"

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend, LabelList, Tooltip } from "recharts"
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
  isLoading: boolean,
  monthOverMonthInquiries?: number,
  monthOverMonthEnrollments?: number
): StatCard[] => {
  const conversionRate = inquiriesCount > 0 ? Math.round((enrollmentsCount / inquiriesCount) * 100) : 0
  const momInquiriesChange = monthOverMonthInquiries !== undefined ? monthOverMonthInquiries : null
  const momEnrollmentsChange = monthOverMonthEnrollments !== undefined ? monthOverMonthEnrollments : null

  return [
    {
      title: "Total Inquiries",
      value: isLoading ? "Loading..." : inquiriesCount.toLocaleString(),
      change: momInquiriesChange !== null 
        ? `${momInquiriesChange >= 0 ? '+' : ''}${momInquiriesChange}% vs last month`
        : `${inquiriesGrowth >= 0 ? '+' : ''}${inquiriesGrowth}% from last year`,
      icon: FileText,
    },
    {
      title: "Total Enrolled",
      value: isLoading ? "Loading..." : enrollmentsCount.toLocaleString(),
      change: momEnrollmentsChange !== null
        ? `${momEnrollmentsChange >= 0 ? '+' : ''}${momEnrollmentsChange}% vs last month`
        : `${enrollmentsGrowth >= 0 ? '+' : ''}${enrollmentsGrowth}% from last year`,
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
  const [monthOverMonthInquiries, setMonthOverMonthInquiries] = useState<number>(0)
  const [monthOverMonthEnrollments, setMonthOverMonthEnrollments] = useState<number>(0)
  const [previousPeriodInquiries, setPreviousPeriodInquiries] = useState<number>(0)
  const [previousPeriodEnrollments, setPreviousPeriodEnrollments] = useState<number>(0)
  const [sourceEffectiveness, setSourceEffectiveness] = useState<Array<{
    name: string
    inquiries: number
    enrollments: number
    conversionRate: number
  }>>([])
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
  const [userPermissions, setUserPermissions] = useState<string[]>([]); // New state for user permissions
  const [marketingActivities, setMarketingActivities] = useState<any[]>([])
  const [schoolsData, setSchoolsData] = useState<any[]>([])
  const [isLoadingMarketing, setIsLoadingMarketing] = useState<boolean>(true)
  const [isLoadingSchools, setIsLoadingSchools] = useState<boolean>(true)
  const [inquiriesChartData, setInquiriesChartData] = useState<{ period: string; inquiries: number }[]>([])
  const [isLoadingMonthlyInquiries, setIsLoadingMonthlyInquiries] = useState<boolean>(true)
  const [inquiriesPeriod, setInquiriesPeriod] = useState<'week' | 'month' | 'year'>('month')
  const [chartType, setChartType] = useState<'inquiries' | 'enrollments'>('inquiries')
  const [enrollmentsChartData, setEnrollmentsChartData] = useState<{ period: string; enrollments: number }[]>([])
  const [isLoadingEnrollmentsChart, setIsLoadingEnrollmentsChart] = useState<boolean>(true)
  const [sourceData, setSourceData] = useState<{ name: string; value: number }[]>([])
  const [isLoadingSourceData, setIsLoadingSourceData] = useState<boolean>(true)

  // Use pre-calculated data from API
  const topCourses = dashboardData?.topCourses || []
  const topStrands = dashboardData?.topStrands || []
  const enrolledPerProgram = dashboardData?.enrolledPerProgram || []
  const enrolledPerStrand = dashboardData?.enrolledPerStrand || []

  // Colors matching the conversion rate dialog design - HSL format for consistency
  const COLORS = [
    'hsl(217, 91%, 60%)',  // Blue
    'hsl(142, 76%, 36%)',  // Green
    'hsl(262, 83%, 58%)',  // Purple
    'hsl(24, 95%, 53%)',   // Orange
    'hsl(0, 84%, 60%)',    // Red
    'hsl(280, 100%, 70%)', // Pink
    'hsl(199, 89%, 48%)',  // Cyan
    'hsl(47, 96%, 53%)',   // Yellow
  ]
  
  // Color classes for gradient cards (matching conversion rate design)
  const GRADIENT_CARDS = [
    { bg: 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-600 dark:text-blue-400', textBold: 'text-blue-900 dark:text-blue-100', icon: 'text-blue-500' },
    { bg: 'from-green-50 to-green-100 dark:from-green-950 dark:to-green-900', border: 'border-green-200 dark:border-green-800', text: 'text-green-600 dark:text-green-400', textBold: 'text-green-900 dark:text-green-100', icon: 'text-green-500' },
    { bg: 'from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400', textBold: 'text-purple-900 dark:text-purple-100', icon: 'text-purple-500' },
    { bg: 'from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400', textBold: 'text-orange-900 dark:text-orange-100', icon: 'text-orange-500' },
    { bg: 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900', border: 'border-red-200 dark:border-red-800', text: 'text-red-600 dark:text-red-400', textBold: 'text-red-900 dark:text-red-100', icon: 'text-red-500' },
    { bg: 'from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-600 dark:text-pink-400', textBold: 'text-pink-900 dark:text-pink-100', icon: 'text-pink-500' },
    { bg: 'from-cyan-50 to-cyan-100 dark:from-cyan-950 dark:to-cyan-900', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-600 dark:text-cyan-400', textBold: 'text-cyan-900 dark:text-cyan-100', icon: 'text-cyan-500' },
    { bg: 'from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-600 dark:text-yellow-400', textBold: 'text-yellow-900 dark:text-yellow-100', icon: 'text-yellow-500' },
  ]
  
  // Background color classes for list items
  const LIST_COLORS = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-red-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500',
  ]

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Error fetching user:', authError);
        router.push('/login'); // Redirect to login if not authenticated
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('permissions')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Handle case where profile might not exist (e.g., brand new user)
        setUserPermissions([]);
      } else {
        try {
          const permissions = typeof profile.permissions === 'string'
            ? JSON.parse(profile.permissions)
            : profile.permissions;
          setUserPermissions(permissions || []);
        } catch (parseError) {
          console.error('Error parsing permissions:', parseError);
          setUserPermissions([]);
        }
      }
    };

    fetchUserPermissions();
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
  }, [router]) // Added router to dependency array

  useEffect(() => {
    const fetchDashboardData = async () => {
      const now = Date.now()
      const CACHE_DURATION = 10 * 1000 // 10 seconds cache (reduced for more real-time updates)

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
        // Add cache-busting parameter to ensure fresh data
        const cacheBuster = `&_t=${Date.now()}`
        const finalUrl = apiUrl.includes('?') ? `${apiUrl}${cacheBuster}` : `${apiUrl}?${cacheBuster.substring(1)}`
        const response = await fetch(finalUrl, {
          cache: 'no-store', // Disable browser caching
        })
        const data = await response.json()

        if (response.ok) {
          setEnrollmentsCount(data.enrollmentsCount || 0)
          setInquiriesGrowth(data.inquiriesGrowth || 0)
          setEnrollmentsGrowth(data.enrollmentsGrowth || 0)
          setMonthOverMonthInquiries(data.monthOverMonthInquiries || 0)
          setMonthOverMonthEnrollments(data.monthOverMonthEnrollments || 0)
          setPreviousPeriodInquiries(data.previousPeriodInquiries || 0)
          setPreviousPeriodEnrollments(data.previousPeriodEnrollments || 0)
          setSourceEffectiveness(data.sourceEffectiveness || [])
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
  }, [dashboardData, lastFetchTime, startDate, endDate])

  // Fetch marketing activities data
  useEffect(() => {
    const fetchMarketingActivities = async () => {
      setIsLoadingMarketing(true)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          return
        }

        const response = await fetch('/api/marketing-activities')
        const data = await response.json()

        if (response.ok) {
          setMarketingActivities(data || [])
        } else {
          console.error('Error fetching marketing activities:', data.error)
        }
      } catch (err) {
        console.error('Error fetching marketing activities:', err)
      } finally {
        setIsLoadingMarketing(false)
      }
    }

    fetchMarketingActivities()
  }, [startDate, endDate])

  // Fetch schools data
  useEffect(() => {
    const fetchSchools = async () => {
      setIsLoadingSchools(true)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          return
        }

        const { data, error } = await supabase
          .from('schools')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching schools:', error)
        } else {
          setSchoolsData(data || [])
        }
      } catch (err) {
        console.error('Error fetching schools:', err)
      } finally {
        setIsLoadingSchools(false)
      }
    }

    fetchSchools()
  }, [])

  // Fetch inquiries chart data (week/month/year)
  useEffect(() => {
    const fetchInquiriesChartData = async () => {
      setIsLoadingMonthlyInquiries(true)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          return
        }

        // Build query with date filters
        let inquiriesQuery = supabase
          .from('inquiries')
          .select('created_at')
          .order('created_at', { ascending: true })

        // Apply date filters if provided
        if (startDate) {
          const startDateTime = format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z'
          inquiriesQuery = inquiriesQuery.gte('created_at', startDateTime)
        }
        
        if (endDate) {
          const endDateTime = format(endDate, 'yyyy-MM-dd') + 'T23:59:59.999Z'
          inquiriesQuery = inquiriesQuery.lte('created_at', endDateTime)
        }

        const { data: inquiries, error } = await inquiriesQuery

        if (error) {
          console.error('Error fetching inquiries:', error)
          setInquiriesChartData([])
          return
        }

        let chartData: { period: string; inquiries: number }[] = []

        if (inquiriesPeriod === 'week') {
          // Group by week
          const weekCounts: { [key: string]: number } = {}
          const weekLabels: string[] = []
          
          // Get date range
          const start = startDate ? new Date(startDate) : (inquiries && inquiries.length > 0 ? new Date(inquiries[0].created_at) : new Date())
          const end = endDate ? new Date(endDate) : (inquiries && inquiries.length > 0 ? new Date(inquiries[inquiries.length - 1].created_at) : new Date())
          
          // Generate week labels for the date range
          let currentDate = new Date(start)
          currentDate.setDate(currentDate.getDate() - currentDate.getDay()) // Start from Sunday of the first week
          
          while (currentDate <= end) {
            const weekStart = new Date(currentDate)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6) // End of week (Saturday)
            
            const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
            if (!weekCounts[weekLabel]) {
              weekCounts[weekLabel] = 0
              weekLabels.push(weekLabel)
            }
            
            currentDate.setDate(currentDate.getDate() + 7)
          }
          
          // Count inquiries per week
          inquiries?.forEach((inquiry: any) => {
            if (inquiry.created_at) {
              const date = new Date(inquiry.created_at)
              const weekStart = new Date(date)
              weekStart.setDate(weekStart.getDate() - weekStart.getDay())
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekEnd.getDate() + 6)
              const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
              if (weekCounts[weekLabel] !== undefined) {
                weekCounts[weekLabel] = (weekCounts[weekLabel] || 0) + 1
              }
            }
          })
          
          chartData = weekLabels.map(week => ({
            period: week,
            inquiries: weekCounts[week] || 0
          }))
        } else if (inquiriesPeriod === 'month') {
          // Group by month
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
          const monthlyCounts: { [key: string]: number } = {}
          
          // Initialize all months with 0
          monthNames.forEach(month => {
            monthlyCounts[month] = 0
          })
          
          // Count inquiries per month
          inquiries?.forEach((inquiry: any) => {
            if (inquiry.created_at) {
              const date = new Date(inquiry.created_at)
              const monthIndex = date.getMonth()
              const monthName = monthNames[monthIndex]
              monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1
            }
          })
          
          chartData = monthNames.map(month => ({
            period: month,
            inquiries: monthlyCounts[month] || 0
          }))
        } else if (inquiriesPeriod === 'year') {
          // Group by year - show 3 years ago to 3 years forward
          const currentYear = new Date().getFullYear()
          const startYear = currentYear - 3
          const endYear = currentYear + 3
          const yearCounts: { [key: string]: number } = {}
          
          // Initialize all years in range with 0
          for (let year = startYear; year <= endYear; year++) {
            yearCounts[year.toString()] = 0
          }
          
          // Count inquiries per year
          inquiries?.forEach((inquiry: any) => {
            if (inquiry.created_at) {
              const date = new Date(inquiry.created_at)
              const year = date.getFullYear().toString()
              // Only count if within the range
              if (yearCounts[year] !== undefined) {
                yearCounts[year] = (yearCounts[year] || 0) + 1
              }
            }
          })
          
          // Create chart data for all years in range, sorted
          chartData = []
          for (let year = startYear; year <= endYear; year++) {
            chartData.push({
              period: year.toString(),
              inquiries: yearCounts[year.toString()] || 0
            })
          }
        }

        setInquiriesChartData(chartData)
      } catch (err) {
        console.error('Error fetching inquiries chart data:', err)
        setInquiriesChartData([])
      } finally {
        setIsLoadingMonthlyInquiries(false)
      }
    }

    fetchInquiriesChartData()
  }, [startDate, endDate, inquiriesPeriod])

  // Fetch enrollments chart data (week/month/year)
  useEffect(() => {
    const fetchEnrollmentsChartData = async () => {
      setIsLoadingEnrollmentsChart(true)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          return
        }

        // Build query with date filters
        let enrollmentsQuery = supabase
          .from('enrollments')
          .select('created_at')
          .order('created_at', { ascending: true })

        // Apply date filters if provided
        if (startDate) {
          const startDateTime = format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z'
          enrollmentsQuery = enrollmentsQuery.gte('created_at', startDateTime)
        }
        
        if (endDate) {
          const endDateTime = format(endDate, 'yyyy-MM-dd') + 'T23:59:59.999Z'
          enrollmentsQuery = enrollmentsQuery.lte('created_at', endDateTime)
        }

        const { data: enrollments, error } = await enrollmentsQuery

        if (error) {
          console.error('Error fetching enrollments:', error)
          setEnrollmentsChartData([])
          return
        }

        let chartData: { period: string; enrollments: number }[] = []

        if (inquiriesPeriod === 'week') {
          // Group by week
          const weekCounts: { [key: string]: number } = {}
          const weekLabels: string[] = []
          
          // Get date range
          const start = startDate ? new Date(startDate) : (enrollments && enrollments.length > 0 ? new Date(enrollments[0].created_at) : new Date())
          const end = endDate ? new Date(endDate) : (enrollments && enrollments.length > 0 ? new Date(enrollments[enrollments.length - 1].created_at) : new Date())
          
          // Generate week labels for the date range
          let currentDate = new Date(start)
          currentDate.setDate(currentDate.getDate() - currentDate.getDay()) // Start from Sunday of the first week
          
          while (currentDate <= end) {
            const weekStart = new Date(currentDate)
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6) // End of week (Saturday)
            
            const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
            if (!weekCounts[weekLabel]) {
              weekCounts[weekLabel] = 0
              weekLabels.push(weekLabel)
            }
            
            currentDate.setDate(currentDate.getDate() + 7)
          }
          
          // Count enrollments per week
          enrollments?.forEach((enrollment: any) => {
            if (enrollment.created_at) {
              const date = new Date(enrollment.created_at)
              const weekStart = new Date(date)
              weekStart.setDate(weekStart.getDate() - weekStart.getDay())
              const weekEnd = new Date(weekStart)
              weekEnd.setDate(weekEnd.getDate() + 6)
              const weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`
              if (weekCounts[weekLabel] !== undefined) {
                weekCounts[weekLabel] = (weekCounts[weekLabel] || 0) + 1
              }
            }
          })
          
          chartData = weekLabels.map(week => ({
            period: week,
            enrollments: weekCounts[week] || 0
          }))
        } else if (inquiriesPeriod === 'month') {
          // Group by month
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
          const monthlyCounts: { [key: string]: number } = {}
          
          // Initialize all months with 0
          monthNames.forEach(month => {
            monthlyCounts[month] = 0
          })
          
          // Count enrollments per month
          enrollments?.forEach((enrollment: any) => {
            if (enrollment.created_at) {
              const date = new Date(enrollment.created_at)
              const monthIndex = date.getMonth()
              const monthName = monthNames[monthIndex]
              monthlyCounts[monthName] = (monthlyCounts[monthName] || 0) + 1
            }
          })
          
          chartData = monthNames.map(month => ({
            period: month,
            enrollments: monthlyCounts[month] || 0
          }))
        } else if (inquiriesPeriod === 'year') {
          // Group by year - show 3 years ago to 3 years forward
          const currentYear = new Date().getFullYear()
          const startYear = currentYear - 3
          const endYear = currentYear + 3
          const yearCounts: { [key: string]: number } = {}
          
          // Initialize all years in range with 0
          for (let year = startYear; year <= endYear; year++) {
            yearCounts[year.toString()] = 0
          }
          
          // Count enrollments per year
          enrollments?.forEach((enrollment: any) => {
            if (enrollment.created_at) {
              const date = new Date(enrollment.created_at)
              const year = date.getFullYear().toString()
              // Only count if within the range
              if (yearCounts[year] !== undefined) {
                yearCounts[year] = (yearCounts[year] || 0) + 1
              }
            }
          })
          
          // Create chart data for all years in range, sorted
          chartData = []
          for (let year = startYear; year <= endYear; year++) {
            chartData.push({
              period: year.toString(),
              enrollments: yearCounts[year.toString()] || 0
            })
          }
        }

        setEnrollmentsChartData(chartData)
      } catch (err) {
        console.error('Error fetching enrollments chart data:', err)
        setEnrollmentsChartData([])
      } finally {
        setIsLoadingEnrollmentsChart(false)
      }
    }

    fetchEnrollmentsChartData()
  }, [startDate, endDate, inquiriesPeriod])

  // Fetch source data (how did you find out about STI)
  useEffect(() => {
    const fetchSourceData = async () => {
      setIsLoadingSourceData(true)
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
          return
        }

        // Build query with date filters
        let inquiriesQuery = supabase
          .from('inquiries')
          .select('how_did_you_find_out')
          .not('how_did_you_find_out', 'is', null)

        // Apply date filters if provided
        if (startDate) {
          const startDateTime = format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z'
          inquiriesQuery = inquiriesQuery.gte('created_at', startDateTime)
        }
        
        if (endDate) {
          const endDateTime = format(endDate, 'yyyy-MM-dd') + 'T23:59:59.999Z'
          inquiriesQuery = inquiriesQuery.lte('created_at', endDateTime)
        }

        const { data: inquiries, error } = await inquiriesQuery

        // Define all possible sources with their designated order
        const allSources = [
          'TV',
          'Outdoor',
          'Radio',
          'Print',
          'Magazine',
          'Online',
          'Website',
          'Facebook',
          'Others Online',
          'Events',
          'Referral',
          'Career Orientation'
        ]

        if (error) {
          console.error('Error fetching source data:', error)
          // Even on error, show all sources with zero values
          setSourceData(allSources.map(name => ({ name, value: 0 })))
        } else {
          // Count occurrences of each source
          const sourceCounts: { [key: string]: number } = {}
          
          // Map of database values to display names
          const sourceNameMap: { [key: string]: string } = {
            'tv': 'TV',
            'outdoor': 'Outdoor',
            'radio': 'Radio',
            'print': 'Print',
            'magazine': 'Magazine',
            'online': 'Online',
            'website': 'Website',
            'facebook': 'Facebook',
            'others-online': 'Others Online',
            'events': 'Events',
            'referral': 'Referral',
            'career-orientation': 'Career Orientation'
          }

          // Count each source
          inquiries?.forEach((inquiry: any) => {
            if (inquiry.how_did_you_find_out && Array.isArray(inquiry.how_did_you_find_out)) {
              inquiry.how_did_you_find_out.forEach((source: string) => {
                const displayName = sourceNameMap[source] || source
                sourceCounts[displayName] = (sourceCounts[displayName] || 0) + 1
              })
            }
          })

          // Define all possible sources with their designated order and colors
          const allSources = [
            'TV',
            'Outdoor',
            'Radio',
            'Print',
            'Magazine',
            'Online',
            'Website',
            'Facebook',
            'Others Online',
            'Events',
            'Referral',
            'Career Orientation'
          ]

          // Create array with all sources, ensuring each has a value (0 if not present)
          const sourceArray = allSources.map(name => ({
            name,
            value: sourceCounts[name] || 0
          })).sort((a, b) => b.value - a.value) // Sort by value, but keep all sources

          setSourceData(sourceArray)
        }
      } catch (err) {
        console.error('Error fetching source data:', err)
        setSourceData([])
      } finally {
        setIsLoadingSourceData(false)
      }
    }

    fetchSourceData()
  }, [startDate, endDate])

  const handleLogout = () => router.push("/login")

  const handleRefreshData = () => {
    setLastFetchTime(0) // Force refresh by resetting cache timestamp
    setDashboardData(null) // Clear cached data to force full refresh
    // Reset dates to default values (start: last year, end: this year for year-over-year comparison)
    const currentYear = new Date().getFullYear()
    setStartDate(new Date(currentYear - 1, 0, 1)) // January 1 of last year
    setEndDate(new Date(currentYear, 11, 31)) // December 31 of this year
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
        <AdminSidebar onLogout={handleLogout} userPermissions={userPermissions} />

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
                  className="h-9 w-9 p-0"
                  title={isLoadingData ? 'Refreshing...' : 'Refresh Data'}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>


          {/* Key Performance Summary */}
          {(!isLoadingData || inquiriesCount > 0) && (
            <Card className="border-2 shadow-lg mb-8 bg-gradient-to-r from-primary/5 to-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <TrendingUp className="h-4 w-4" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{inquiriesCount > 0 ? Math.round((enrollmentsCount / inquiriesCount) * 100) : 0}%</p>
                    <p className="text-xs text-muted-foreground mt-1">Overall Conversion</p>
          </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {sourceEffectiveness.length > 0 && sourceEffectiveness[0] 
                        ? `${sourceEffectiveness[0].conversionRate}%` 
                        : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Top Source Conversion</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {monthOverMonthInquiries >= 0 ? '+' : ''}{monthOverMonthInquiries}%
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">vs Last Month</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {(() => {
                        if (inquiriesCount === 0) return 0
                        // Calculate number of months in the date range
                        let months = 12 // Default to 12 if no date range
                        if (startDate && endDate) {
                          const start = new Date(startDate)
                          const end = new Date(endDate)
                          const yearDiff = end.getFullYear() - start.getFullYear()
                          const monthDiff = end.getMonth() - start.getMonth()
                          months = yearDiff * 12 + monthDiff + 1 // +1 to include both start and end months
                          // Ensure at least 1 month
                          if (months < 1) months = 1
                        }
                        // Calculate average using actual periods with data
                        const periodsWithData = inquiriesChartData.filter((m: { period: string; inquiries: number }) => m.inquiries > 0).length
                        const actualMonths = periodsWithData > 0 ? periodsWithData : months
                        return Math.round(inquiriesCount / actualMonths)
                      })()}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Avg Monthly Inquiries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actionable Insights Section */}
          {(!isLoadingData || sourceEffectiveness.length > 0 || inquiriesCount > 0) && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Top Performing Source */}
              {sourceEffectiveness.length > 0 && sourceEffectiveness[0] && (
                <Card className="border-2 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold text-green-900 dark:text-green-100">
                      <TrendingUp className="h-4 w-4" />
                      Top Performing Source
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">{sourceEffectiveness[0].name}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-green-700 dark:text-green-300 font-medium">{sourceEffectiveness[0].conversionRate}%</p>
                          <p className="text-xs text-green-600 dark:text-green-400">Conversion Rate</p>
                        </div>
                        <div>
                          <p className="text-green-700 dark:text-green-300 font-medium">{sourceEffectiveness[0].enrollments}</p>
                          <p className="text-xs text-green-600 dark:text-green-400">Enrollments</p>
                        </div>
                      </div>
                      <p className="text-xs text-green-700 dark:text-green-300 italic">Consider increasing budget allocation</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Conversion Funnel */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <Target className="h-3.5 w-3.5" />
                    Conversion Funnel
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">Inquiry to Enrollment Flow</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm font-medium">Inquiries</span>
                      </div>
                      <span className="text-lg font-bold">{inquiriesCount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500" style={{ width: '100%' }}></div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm font-medium">Enrolled</span>
                      </div>
                      <span className="text-lg font-bold">{enrollmentsCount.toLocaleString()}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all" 
                        style={{ width: `${inquiriesCount > 0 ? (enrollmentsCount / inquiriesCount) * 100 : 0}%` }}
                      ></div>
                    </div>
                    <div className="pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Conversion Rate</span>
                        <span className="text-sm font-bold text-primary">
                          {inquiriesCount > 0 ? Math.round((enrollmentsCount / inquiriesCount) * 100) : 0}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Current vs Last Year */}
              <Card className="border-2 shadow-lg">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    Current vs Last Year
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">Year-over-year comparison</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Inquiries</span>
                        <span className="text-xs font-medium">
                          {inquiriesCount} vs {previousPeriodInquiries}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: '50%' }}></div>
                        <div className="h-full bg-muted-foreground/30 -mt-2" style={{ width: '50%', marginLeft: '50%' }}></div>
                      </div>
                      <p className={`text-xs mt-1 ${inquiriesCount >= previousPeriodInquiries ? 'text-green-600' : 'text-red-600'}`}>
                        {inquiriesCount >= previousPeriodInquiries ? '↑' : '↓'} {Math.abs(inquiriesCount - previousPeriodInquiries)} 
                        ({previousPeriodInquiries > 0 ? Math.round(((inquiriesCount - previousPeriodInquiries) / previousPeriodInquiries) * 100) : 0}%)
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Enrollments</span>
                        <span className="text-xs font-medium">
                          {enrollmentsCount} vs {previousPeriodEnrollments}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '50%' }}></div>
                        <div className="h-full bg-muted-foreground/30 -mt-2" style={{ width: '50%', marginLeft: '50%' }}></div>
                      </div>
                      <p className={`text-xs mt-1 ${enrollmentsCount >= previousPeriodEnrollments ? 'text-green-600' : 'text-red-600'}`}>
                        {enrollmentsCount >= previousPeriodEnrollments ? '↑' : '↓'} {Math.abs(enrollmentsCount - previousPeriodEnrollments)}
                        ({previousPeriodEnrollments > 0 ? Math.round(((enrollmentsCount - previousPeriodEnrollments) / previousPeriodEnrollments) * 100) : 0}%)
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recommendations & Insights */}
          {(!isLoadingData || sourceEffectiveness.length > 0 || inquiriesCount > 0) && (
            <Card className="border-2 shadow-lg mb-8">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Target className="h-3.5 w-3.5" />
                  Actionable Insights & Recommendations
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Data-driven recommendations for marketing optimization</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Top Recommendations */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                      Opportunities
                    </h4>
                    <div className="space-y-2">
                      {sourceEffectiveness.length > 0 && sourceEffectiveness[0] && sourceEffectiveness[0].conversionRate > 15 && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            {sourceEffectiveness[0].name} shows {sourceEffectiveness[0].conversionRate}% conversion rate
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Consider increasing budget for this high-performing source
                          </p>
                        </div>
                      )}
                      {inquiriesCount > 0 && (enrollmentsCount / inquiriesCount) < 0.15 && (
                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Conversion rate below 15%
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            Review follow-up process and inquiry qualification criteria
                          </p>
                        </div>
                      )}
                      {monthOverMonthInquiries > 20 && (
                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">
                            Strong growth: +{monthOverMonthInquiries}% vs Last Month
                          </p>
                          <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                            Maintain current marketing momentum
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Areas for Improvement */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Target className="h-4 w-4 text-orange-600" />
                      Areas for Improvement
                    </h4>
                    <div className="space-y-2">
                      {sourceEffectiveness.length > 0 && sourceEffectiveness[sourceEffectiveness.length - 1] && sourceEffectiveness[sourceEffectiveness.length - 1].conversionRate < 5 && sourceEffectiveness[sourceEffectiveness.length - 1].inquiries > 10 && (
                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
                          <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                            {sourceEffectiveness[sourceEffectiveness.length - 1].name} underperforming
                          </p>
                          <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                            Only {sourceEffectiveness[sourceEffectiveness.length - 1].conversionRate}% conversion - review targeting strategy
                          </p>
                        </div>
                      )}
                      {monthOverMonthInquiries < -10 && (
                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">
                            Inquiry decline: {monthOverMonthInquiries}% vs Last Month
                          </p>
                          <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                            Investigate marketing channels and campaign performance
                          </p>
                        </div>
                      )}
                      {inquiriesCount > 0 && previousPeriodInquiries > 0 && inquiriesCount < previousPeriodInquiries * 0.9 && (
                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            Current period inquiries down vs previous
                          </p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                            Review seasonal trends and adjust marketing calendar
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Charts Section with Tabs */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="inquiries">Inquiries</TabsTrigger>
              <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
              <TabsTrigger value="marketing">Marketing Activities</TabsTrigger>
              <TabsTrigger value="schools">Schools</TabsTrigger>
            </TabsList>

            {/* All Tab - Shows all charts */}
            <TabsContent value="all" className="space-y-6">
              {/* Monthly Inquiries and Sources Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Inquiries/Enrollments Chart - Takes 2 columns */}
                <Card className="border-2 shadow-lg lg:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          {chartType === 'inquiries' ? <FileText className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                          {chartType === 'inquiries' ? 'Overall Inquiries' : 'Overall Enrollment'}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {chartType === 'inquiries' ? 'Inquiry trends over time' : 'Enrollment trends over time'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={inquiriesPeriod} onValueChange={(value: 'week' | 'month' | 'year') => setInquiriesPeriod(value)}>
                          <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setChartType('inquiries')}>
                              Overall Inquiries
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setChartType('enrollments')}>
                              Overall Enrollment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    {(chartType === 'inquiries' ? isLoadingMonthlyInquiries : isLoadingEnrollmentsChart) ? (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading chart data...</p>
                      </div>
                    ) : (chartType === 'inquiries' ? inquiriesChartData : enrollmentsChartData).length > 0 ? (
                      <ChartContainer
                        config={{
                          [chartType === 'inquiries' ? 'inquiries' : 'enrollments']: {
                            label: chartType === 'inquiries' ? "Inquiries" : "Enrollments",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px] w-full"
                      >
                        <BarChart 
                          data={chartType === 'inquiries' ? inquiriesChartData : enrollmentsChartData} 
                          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                          <XAxis 
                            dataKey="period" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            label={{ value: inquiriesPeriod === 'week' ? 'Week' : inquiriesPeriod === 'month' ? 'Month' : 'Year', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '10px' } }}
                            angle={inquiriesPeriod === 'week' ? -45 : 0}
                            textAnchor={inquiriesPeriod === 'week' ? 'end' : 'middle'}
                            height={inquiriesPeriod === 'week' ? 60 : 30}
                          />
                          <YAxis 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            label={{ value: chartType === 'inquiries' ? 'Number of Inquiries' : 'Number of Enrollments', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))', fontSize: '10px' } }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 pb-2 border-b">
                                        {chartType === 'inquiries' ? <FileText className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
                                        <span className="font-bold text-base">{data.period}</span>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs uppercase text-muted-foreground font-medium">
                                          {chartType === 'inquiries' ? 'Inquiries' : 'Enrollments'}
                                        </p>
                                        <p className="text-lg font-bold text-primary">
                                          {(chartType === 'inquiries' ? data.inquiries : data.enrollments).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar 
                            dataKey={chartType === 'inquiries' ? 'inquiries' : 'enrollments'} 
                            fill="hsl(217, 91%, 40%)"
                            radius={[8, 8, 0, 0]}
                            strokeWidth={2}
                          />
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                        {chartType === 'inquiries' ? <FileText className="h-12 w-12 text-muted-foreground mb-3 opacity-50" /> : <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />}
                        <p className="text-sm font-medium text-foreground mb-1">
                          No {chartType === 'inquiries' ? 'inquiry' : 'enrollment'} data available
                        </p>
                        <p className="text-xs text-muted-foreground text-center px-4">
                          {chartType === 'inquiries' ? 'Inquiry' : 'Enrollment'} data will appear here once {chartType === 'inquiries' ? 'inquiries' : 'enrollments'} are recorded.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sources Chart - Takes 1 column, shorter height */}
                <Card className="border-2 shadow-lg lg:col-span-1">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-3.5 w-3.5" />
                      Sources
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">How inquiries found out about STI</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0.5 pt-0">
                    {isLoadingSourceData ? (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading chart data...</p>
                      </div>
                    ) : sourceData.length > 0 ? (
                      <ChartContainer
                        config={{
                          value: {
                            label: "Inquiries",
                            color: "hsl(var(--chart-1))",
                          },
                        }}
                        className="h-[300px] w-full"
                      >
                        <BarChart
                          layout="vertical"
                          data={sourceData}
                          margin={{ top: 5, right: 5, left: 55, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                          <XAxis 
                            type="number" 
                            domain={[0, 'dataMax']}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                            label={{ value: 'Number of Inquiries', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '8px' } }}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={50}
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 8, fontWeight: 500 }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 pb-2 border-b">
                                        <Target className="h-4 w-4 text-primary" />
                                        <span className="font-bold text-base">{data.name}</span>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs uppercase text-muted-foreground font-medium">Inquiries</p>
                                        <p className="text-lg font-bold text-primary">
                                          {data.value.toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                            <Bar 
                              dataKey="value" 
                              radius={[0, 8, 8, 0]}
                              strokeWidth={2}
                            >
                              {sourceData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]}
                                  stroke={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Bar>
                        </BarChart>
                      </ChartContainer>
                    ) : (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                        <Target className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm font-medium text-foreground mb-1">No source data available</p>
                        <p className="text-xs text-muted-foreground text-center px-4">Source information will appear here once inquiries with source data are recorded.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Inquiries Charts */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Preferred Courses Pie Chart */}
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <BookOpen className="h-3.5 w-3.5" />
                        Top Preferred Courses
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">Distribution of course preferences from inquiries</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      {isLoadingData ? (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading chart data...</p>
                        </div>
                      ) : topCourses.length > 0 ? (
                        <div className="flex gap-4 h-[350px] overflow-hidden">
                          {/* Custom Legend on Left */}
                          <div className="flex flex-col justify-center gap-3 min-w-[180px] max-w-[200px] flex-shrink-0">
                            {topCourses.map((entry, index) => {
                              const total = topCourses.reduce((sum, item) => sum + item.value, 0)
                              const percent = ((entry.value / total) * 100).toFixed(1)
                              return (
                                <div key={index} className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground leading-tight truncate">{entry.name}</p>
                                    <p className="text-xs text-muted-foreground">{percent}%</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {/* Pie Chart on Right */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                        <ChartContainer
                          config={{
                            value: {
                              label: "Inquiries",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                              className="h-full w-full"
                        >
                          <PieChart>
                            <Pie
                              data={topCourses}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                                  innerRadius={30}
                              fill="#8884d8"
                              dataKey="value"
                                  paddingAngle={2}
                            >
                              {topCourses.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={COLORS[index % COLORS.length]} 
                                      stroke={COLORS[index % COLORS.length]}
                                      strokeWidth={2} 
                                    />
                              ))}
                            </Pie>
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload
                                      const total = topCourses.reduce((sum, item) => sum + item.value, 0)
                                      const percent = ((data.value / total) * 100).toFixed(1)
                                      return (
                                        <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                              <BookOpen className="h-4 w-4 text-primary" />
                                              <span className="font-bold text-base">{data.name}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-1">
                                                <p className="text-xs uppercase text-muted-foreground font-medium">Inquiries</p>
                                                <p className="text-lg font-bold text-primary">
                                                  {data.value.toLocaleString()}
                                                </p>
                                              </div>
                                              <div className="space-y-1">
                                                <p className="text-xs uppercase text-muted-foreground font-medium">Percentage</p>
                                                <p className="text-lg font-bold text-foreground">
                                                  {percent}%
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    }
                                    return null
                                  }}
                                />
                          </PieChart>
                        </ChartContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                          <BookOpen className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm font-medium text-foreground mb-1">No course data available</p>
                          <p className="text-xs text-muted-foreground text-center px-4">Course preference data will appear here once inquiries are recorded.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Top Preferred Strands Pie Chart */}
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <BookOpen className="h-3.5 w-3.5" />
                        Top Preferred Strands
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">Distribution of strand preferences from inquiries</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      {isLoadingData ? (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading chart data...</p>
                        </div>
                      ) : topStrands.length > 0 ? (
                        <div className="flex gap-4 h-[350px] overflow-hidden">
                          {/* Custom Legend on Left */}
                          <div className="flex flex-col justify-center gap-3 min-w-[180px] max-w-[200px] flex-shrink-0">
                            {topStrands.map((entry, index) => {
                              const total = topStrands.reduce((sum, item) => sum + item.value, 0)
                              const percent = ((entry.value / total) * 100).toFixed(1)
                              return (
                                <div key={index} className="flex items-center gap-2">
                                  <div 
                                    className="w-4 h-4 rounded-sm flex-shrink-0"
                                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-foreground leading-tight truncate">{entry.name}</p>
                                    <p className="text-xs text-muted-foreground">{percent}%</p>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {/* Pie Chart on Right */}
                          <div className="flex-1 min-w-0 overflow-hidden">
                        <ChartContainer
                          config={{
                            value: {
                              label: "Inquiries",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                              className="h-full w-full"
                        >
                          <PieChart>
                            <Pie
                              data={topStrands}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                                  innerRadius={30}
                              fill="#8884d8"
                              dataKey="value"
                                  paddingAngle={2}
                            >
                              {topStrands.map((entry, index) => (
                                    <Cell 
                                      key={`cell-${index}`} 
                                      fill={COLORS[index % COLORS.length]} 
                                      stroke={COLORS[index % COLORS.length]}
                                      strokeWidth={2} 
                                    />
                              ))}
                            </Pie>
                                <Tooltip
                                  content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload
                                      const total = topStrands.reduce((sum, item) => sum + item.value, 0)
                                      const percent = ((data.value / total) * 100).toFixed(1)
                                      return (
                                        <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                          <div className="space-y-2">
                                            <div className="flex items-center gap-2 pb-2 border-b">
                                              <BookOpen className="h-4 w-4 text-primary" />
                                              <span className="font-bold text-base">{data.name}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-1">
                                                <p className="text-xs uppercase text-muted-foreground font-medium">Inquiries</p>
                                                <p className="text-lg font-bold text-primary">
                                                  {data.value.toLocaleString()}
                                                </p>
                                              </div>
                                              <div className="space-y-1">
                                                <p className="text-xs uppercase text-muted-foreground font-medium">Percentage</p>
                                                <p className="text-lg font-bold text-foreground">
                                                  {percent}%
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    }
                                    return null
                                  }}
                                />
                          </PieChart>
                        </ChartContainer>
                          </div>
                        </div>
                      ) : (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                          <BookOpen className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm font-medium text-foreground mb-1">No strand data available</p>
                          <p className="text-xs text-muted-foreground text-center px-4">Strand preference data will appear here once inquiries are recorded.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Enrollments Charts */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Enrolled Students per Program - Horizontal Bar */}
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Users className="h-3.5 w-3.5" />
                        Enrolled Students by Program
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">Number of enrolled students for each program</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      {isLoadingData ? (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading chart data...</p>
                        </div>
                      ) : enrolledPerProgram.length > 0 ? (
                        <ChartContainer
                          config={{
                            enrolled: {
                              label: "Enrolled",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[350px] w-full"
                        >
                          <BarChart
                            layout="vertical"
                            data={enrolledPerProgram}
                            margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                            <XAxis 
                              type="number" 
                              domain={[0, (dataMax: number) => Math.max(dataMax || 0, 1)]}
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                              label={{ value: 'Number of Students', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '10px' } }}
                            />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={85}
                              tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 500 }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload
                                  return (
                                    <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                          <Users className="h-4 w-4 text-primary" />
                                          <span className="font-bold text-base">{data.name}</span>
                                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs uppercase text-muted-foreground font-medium">Enrolled Students</p>
                                          <p className="text-lg font-bold text-primary">
                                            {data.value.toLocaleString()}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                              <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]}
                                strokeWidth={2}
                              >
                                {enrolledPerProgram.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]}
                                    stroke={COLORS[index % COLORS.length]}
                                  />
                                ))}
                                <LabelList 
                                  dataKey="value" 
                                  position="right" 
                                  style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 500 }}
                                  formatter={(value: number) => value}
                                />
                              </Bar>
                          </BarChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                          <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm font-medium text-foreground mb-1">No enrollment data available</p>
                          <p className="text-xs text-muted-foreground text-center px-4">Enrollment data will appear here once students are enrolled.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Enrolled Students per Strand - Horizontal Bar */}
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <Users className="h-3.5 w-3.5" />
                        Enrolled Students by Strand
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">Number of enrolled students for each strand</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      {isLoadingData ? (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading chart data...</p>
                        </div>
                      ) : enrolledPerStrand && Array.isArray(enrolledPerStrand) && enrolledPerStrand.length > 0 ? (
                        <ChartContainer
                          config={{
                            enrolled: {
                              label: "Enrolled",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[350px] w-full"
                        >
                          <BarChart
                            layout="vertical"
                            data={enrolledPerStrand}
                            margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                            <XAxis 
                              type="number" 
                              domain={[0, (dataMax: number) => Math.max(dataMax || 0, 1)]}
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                              label={{ value: 'Number of Students', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '10px' } }}
                            />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={85}
                              tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 500 }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload
                                  return (
                                    <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                          <Users className="h-4 w-4 text-primary" />
                                          <span className="font-bold text-base">{data.name}</span>
                        </div>
                                        <div className="space-y-1">
                                          <p className="text-xs uppercase text-muted-foreground font-medium">Enrolled Students</p>
                                          <p className="text-lg font-bold text-primary">
                                            {data.value.toLocaleString()}
                                          </p>
                </div>
              </div>
                        </div>
                                  )
                                }
                                return null
                              }}
                            />
                              <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]}
                                strokeWidth={2}
                              >
                                {enrolledPerStrand.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]}
                                    stroke={COLORS[index % COLORS.length]}
                                  />
                                ))}
                                <LabelList 
                                  dataKey="value" 
                                  position="right" 
                                  style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 500 }}
                                  formatter={(value: number) => value}
                                />
                              </Bar>
                            </BarChart>
                          </ChartContainer>
                        ) : (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                          <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                          <p className="text-sm font-medium text-foreground mb-1">No strand enrollment data available</p>
                          <p className="text-xs text-muted-foreground text-center px-4">Strand enrollment data will appear here once students are enrolled.</p>
                          </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Marketing Activities Charts */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Budget Distribution */}
                  <Card className="border-2 shadow-lg">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                      <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                        <TrendingUp className="h-3.5 w-3.5" />
                        Budget Distribution
                      </CardTitle>
                      <CardDescription className="text-xs mt-0.5">Total budget by marketing activity</CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 pt-0">
                      {isLoadingMarketing ? (
                        <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-muted-foreground">Loading chart data...</p>
                        </div>
                      ) : (() => {
                        const budgetData = marketingActivities
                          .filter((activity: any) => activity.budget && parseFloat(activity.budget) > 0)
                          .map((activity: any) => ({
                            name: activity.title || 'Untitled',
                            value: parseFloat(activity.budget) || 0
                          }))
                          .sort((a, b) => b.value - a.value)
                          .slice(0, 10)
                        
                        return budgetData.length > 0 ? (
                          <div className="flex gap-4 h-[350px] overflow-hidden">
                            {/* Custom Legend on Left */}
                            <div className="flex flex-col justify-center gap-3 min-w-[180px] max-w-[200px] flex-shrink-0">
                              {budgetData.map((entry, index) => {
                                const total = budgetData.reduce((sum, item) => sum + item.value, 0)
                                const percent = ((entry.value / total) * 100).toFixed(1)
                                return (
                                  <div key={index} className="flex items-center gap-2">
                                    <div 
                                      className="w-4 h-4 rounded-sm flex-shrink-0"
                                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-medium text-foreground leading-tight truncate">{entry.name}</p>
                                      <p className="text-xs text-muted-foreground">{percent}%</p>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                            {/* Pie Chart on Right */}
                            <div className="flex-1 min-w-0 overflow-hidden">
                          <ChartContainer
                            config={{
                              value: {
                                label: "Budget",
                                color: "hsl(var(--chart-1))",
                              },
                            }}
                                className="h-full w-full"
                          >
                            <PieChart>
                              <Pie
                                data={budgetData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                    innerRadius={30}
                                fill="#8884d8"
                                dataKey="value"
                                    paddingAngle={2}
                              >
                                {budgetData.map((entry, index) => (
                                      <Cell 
                                        key={`cell-${index}`} 
                                        fill={COLORS[index % COLORS.length]} 
                                        stroke={COLORS[index % COLORS.length]}
                                        strokeWidth={2} 
                                      />
                                ))}
                              </Pie>
                                  <Tooltip
                                    content={({ active, payload }) => {
                                      if (active && payload && payload.length) {
                                        const data = payload[0].payload
                                  const total = budgetData.reduce((sum, item) => sum + item.value, 0)
                                        const percent = ((data.value / total) * 100).toFixed(1)
                                  return (
                                          <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                            <div className="space-y-2">
                                              <div className="flex items-center gap-2 pb-2 border-b">
                                                <TrendingUp className="h-4 w-4 text-primary" />
                                                <span className="font-bold text-base">{data.name}</span>
                                              </div>
                                              <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                  <p className="text-xs uppercase text-muted-foreground font-medium">Budget</p>
                                                  <p className="text-lg font-bold text-primary">
                                                    ₱{Number(data.value).toLocaleString()}
                                                  </p>
                                                </div>
                                                <div className="space-y-1">
                                                  <p className="text-xs uppercase text-muted-foreground font-medium">Percentage</p>
                                                  <p className="text-lg font-bold text-foreground">
                                                    {percent}%
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                      }
                                      return null
                                    }}
                                  />
                            </PieChart>
                          </ChartContainer>
                            </div>
                          </div>
                        ) : (
                          <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                            <TrendingUp className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                            <p className="text-sm font-medium text-foreground mb-1">No budget data available</p>
                            <p className="text-xs text-muted-foreground text-center px-4">Budget distribution will appear here once marketing activities with budgets are recorded.</p>
                          </div>
                        )
                      })()}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Schools Charts */}
              <div className="space-y-4">
                        </div>
            </TabsContent>

            {/* Inquiries Tab */}
            <TabsContent value="inquiries" className="space-y-6">
              {/* Monthly Inquiries and Sources Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Overall Inquiries/Enrollments Chart - Takes 2 columns */}
                <Card className="border-2 shadow-lg lg:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                          {chartType === 'inquiries' ? <FileText className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                          {chartType === 'inquiries' ? 'Overall Inquiries' : 'Overall Enrollment'}
                        </CardTitle>
                        <CardDescription className="text-xs mt-0.5">
                          {chartType === 'inquiries' ? 'Inquiry trends over time' : 'Enrollment trends over time'}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select value={inquiriesPeriod} onValueChange={(value: 'week' | 'month' | 'year') => setInquiriesPeriod(value)}>
                          <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Week</SelectItem>
                            <SelectItem value="month">Month</SelectItem>
                            <SelectItem value="year">Year</SelectItem>
                          </SelectContent>
                        </Select>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setChartType('inquiries')}>
                              Overall Inquiries
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setChartType('enrollments')}>
                              Overall Enrollment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-2 pt-0">
                    {(chartType === 'inquiries' ? isLoadingMonthlyInquiries : isLoadingEnrollmentsChart) ? (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading chart data...</p>
                      </div>
                    ) : (chartType === 'inquiries' ? inquiriesChartData : enrollmentsChartData).length > 0 ? (
                          <ChartContainer
                            config={{
                          [chartType === 'inquiries' ? 'inquiries' : 'enrollments']: {
                            label: chartType === 'inquiries' ? "Inquiries" : "Enrollments",
                                color: "hsl(var(--chart-1))",
                              },
                            }}
                        className="h-[300px] w-full"
                      >
                        <BarChart 
                          data={chartType === 'inquiries' ? inquiriesChartData : enrollmentsChartData} 
                          margin={{ top: 5, right: 20, left: 5, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                          <XAxis 
                            dataKey="period" 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            label={{ value: inquiriesPeriod === 'week' ? 'Week' : inquiriesPeriod === 'month' ? 'Month' : 'Year', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '10px' } }}
                            angle={inquiriesPeriod === 'week' ? -45 : 0}
                            textAnchor={inquiriesPeriod === 'week' ? 'end' : 'middle'}
                            height={inquiriesPeriod === 'week' ? 60 : 30}
                          />
                          <YAxis 
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                            label={{ value: chartType === 'inquiries' ? 'Number of Inquiries' : 'Number of Enrollments', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: 'hsl(var(--foreground))', fontSize: '10px' } }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 pb-2 border-b">
                                        {chartType === 'inquiries' ? <FileText className="h-4 w-4 text-primary" /> : <Users className="h-4 w-4 text-primary" />}
                                        <span className="font-bold text-base">{data.period}</span>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs uppercase text-muted-foreground font-medium">
                                          {chartType === 'inquiries' ? 'Inquiries' : 'Enrollments'}
                                        </p>
                                        <p className="text-lg font-bold text-primary">
                                          {(chartType === 'inquiries' ? data.inquiries : data.enrollments).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                          <Bar 
                            dataKey={chartType === 'inquiries' ? 'inquiries' : 'enrollments'} 
                            fill="hsl(217, 91%, 40%)"
                            radius={[8, 8, 0, 0]}
                            strokeWidth={2}
                          />
                        </BarChart>
                          </ChartContainer>
                        ) : (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                        {chartType === 'inquiries' ? <FileText className="h-12 w-12 text-muted-foreground mb-3 opacity-50" /> : <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />}
                        <p className="text-sm font-medium text-foreground mb-1">
                          No {chartType === 'inquiries' ? 'inquiry' : 'enrollment'} data available
                        </p>
                        <p className="text-xs text-muted-foreground text-center px-4">
                          {chartType === 'inquiries' ? 'Inquiry' : 'Enrollment'} data will appear here once {chartType === 'inquiries' ? 'inquiries' : 'enrollments'} are recorded.
                        </p>
                          </div>
                    )}
                    </CardContent>
                  </Card>

                {/* Sources Chart - Takes 1 column, maximized space */}
                <Card className="border-2 shadow-lg lg:col-span-1">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                    <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                      <Target className="h-3.5 w-3.5" />
                      Sources
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">How inquiries found out about STI</CardDescription>
                    </CardHeader>
                  <CardContent className="p-0.5 pt-0">
                    {isLoadingSourceData ? (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                        <p className="text-sm text-muted-foreground">Loading chart data...</p>
                        </div>
                    ) : sourceData.length > 0 ? (
                          <ChartContainer
                            config={{
                              value: {
                            label: "Inquiries",
                                color: "hsl(var(--chart-1))",
                              },
                            }}
                        className="h-[300px] w-full"
                          >
                            <BarChart
                              layout="vertical"
                          data={sourceData}
                          margin={{ top: 5, right: 5, left: 55, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                          <XAxis 
                            type="number" 
                            domain={[0, 'dataMax']}
                            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 8 }}
                            label={{ value: 'Number of Inquiries', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '8px' } }}
                          />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={50}
                            tick={{ fill: 'hsl(var(--foreground))', fontSize: 8, fontWeight: 500 }}
                          />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload
                                return (
                                  <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2 pb-2 border-b">
                                        <Target className="h-4 w-4 text-primary" />
                                        <span className="font-bold text-base">{data.name}</span>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs uppercase text-muted-foreground font-medium">Inquiries</p>
                                        <p className="text-lg font-bold text-primary">
                                          {data.value.toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )
                              }
                              return null
                            }}
                          />
                            <Bar 
                              dataKey="value" 
                              radius={[0, 8, 8, 0]}
                              strokeWidth={2}
                            >
                              {sourceData.map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={COLORS[index % COLORS.length]}
                                  stroke={COLORS[index % COLORS.length]}
                                />
                              ))}
                            </Bar>
                            </BarChart>
                          </ChartContainer>
                        ) : (
                      <div className="h-[300px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                        <Target className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                        <p className="text-sm font-medium text-foreground mb-1">No source data available</p>
                        <p className="text-xs text-muted-foreground text-center px-4">Source information will appear here once inquiries with source data are recorded.</p>
                          </div>
                    )}
                    </CardContent>
                  </Card>
                </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Preferred Courses Pie Chart */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  Top Preferred Courses
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Distribution of course preferences from inquiries</CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0">
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
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topCourses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry: any) => (
                          <span style={{ color: entry.color }}>
                            {value}: {((entry.payload.value / topCourses.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%
                          </span>
                        )}
                      />
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
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <BookOpen className="h-3.5 w-3.5" />
                  Top Preferred Strands
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Distribution of strand preferences from inquiries</CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0">
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
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {topStrands.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        formatter={(value, entry: any) => (
                          <span style={{ color: entry.color }}>
                            {value}: {((entry.payload.value / topStrands.reduce((sum, item) => sum + item.value, 0)) * 100).toFixed(0)}%
                          </span>
                        )}
                      />
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

              </div>
            </TabsContent>

            {/* Enrollments Tab */}
            <TabsContent value="enrollments" className="space-y-6">

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Enrolled Students per Program - Horizontal Bar */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-3.5 w-3.5" />
                  Enrolled Students by Program
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Number of enrolled students for each program</CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {isLoadingData ? (
                  <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading chart data...</p>
                  </div>
                ) : enrolledPerProgram.length > 0 ? (
                  <ChartContainer
                    config={{
                      enrolled: {
                        label: "Enrolled",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[350px] w-full"
                  >
                    <BarChart
                      layout="vertical"
                      data={enrolledPerProgram}
                      margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        domain={[0, 'dataMax']}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        label={{ value: 'Number of Students', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '10px' } }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={85}
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 500 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 pb-2 border-b">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="font-bold text-base">{data.name}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs uppercase text-muted-foreground font-medium">Enrolled Students</p>
                                    <p className="text-lg font-bold text-primary">
                                      {data.value.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                              <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]}
                                strokeWidth={2}
                              >
                                {enrolledPerProgram.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]}
                                    stroke={COLORS[index % COLORS.length]}
                                  />
                                ))}
                                <LabelList 
                                  dataKey="value" 
                                  position="right" 
                                  style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 500 }}
                                  formatter={(value: number) => value}
                                />
                              </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                    <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm font-medium text-foreground mb-1">No enrollment data available</p>
                    <p className="text-xs text-muted-foreground text-center px-4">Enrollment data will appear here once students are enrolled.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enrolled Students per Strand - Horizontal Bar */}
            <Card className="border-2 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2">
                <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                  <Users className="h-3.5 w-3.5" />
                  Enrolled Students by Strand
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">Number of enrolled students for each strand</CardDescription>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                {isLoadingData ? (
                  <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                    <p className="text-sm text-muted-foreground">Loading chart data...</p>
                  </div>
                ) : enrolledPerStrand && Array.isArray(enrolledPerStrand) && enrolledPerStrand.length > 0 ? (
                  <ChartContainer
                    config={{
                      enrolled: {
                        label: "Enrolled",
                        color: "hsl(var(--chart-1))",
                      },
                    }}
                    className="h-[350px] w-full"
                  >
                    <BarChart
                      layout="vertical"
                      data={enrolledPerStrand}
                      margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                      <XAxis 
                        type="number" 
                        domain={[0, (dataMax: number) => Math.max(dataMax || 0, 1)]}
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                        label={{ value: 'Number of Students', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '10px' } }}
                      />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        width={85}
                        tick={{ fill: 'hsl(var(--foreground))', fontSize: 10, fontWeight: 500 }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 pb-2 border-b">
                                    <Users className="h-4 w-4 text-primary" />
                                    <span className="font-bold text-base">{data.name}</span>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-xs uppercase text-muted-foreground font-medium">Enrolled Students</p>
                                    <p className="text-lg font-bold text-primary">
                                      {data.value.toLocaleString()}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                              <Bar 
                                dataKey="value" 
                                radius={[0, 8, 8, 0]}
                                strokeWidth={2}
                              >
                                {enrolledPerStrand.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={COLORS[index % COLORS.length]}
                                    stroke={COLORS[index % COLORS.length]}
                                  />
                                ))}
                                <LabelList 
                                  dataKey="value" 
                                  position="right" 
                                  style={{ fill: 'hsl(var(--foreground))', fontSize: '11px', fontWeight: 500 }}
                                  formatter={(value: number) => value}
                                />
                              </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[350px] flex flex-col items-center justify-center border border-dashed border-border rounded-lg bg-muted/20">
                    <Users className="h-12 w-12 text-muted-foreground mb-3 opacity-50" />
                    <p className="text-sm font-medium text-foreground mb-1">No strand enrollment data available</p>
                    <p className="text-xs text-muted-foreground text-center px-4">Strand enrollment data will appear here once students are enrolled.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
            </TabsContent>

            {/* Marketing Activities Tab */}
            <TabsContent value="marketing" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Budget Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Budget Distribution</CardTitle>
                    <CardDescription>Total budget by marketing activity</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoadingMarketing ? (
                      <div className="h-[300px] flex items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                      </div>
                    ) : (() => {
                      const budgetData = marketingActivities
                        .filter((activity: any) => activity.budget && parseFloat(activity.budget) > 0)
                        .map((activity: any) => ({
                          name: activity.title || 'Untitled',
                          value: parseFloat(activity.budget) || 0
                        }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 10)
                      
                      return budgetData.length > 0 ? (
                        <ChartContainer
                          config={{
                            value: {
                              label: "Budget",
                              color: "hsl(var(--chart-1))",
                            },
                          }}
                          className="h-[300px]"
                        >
                          <PieChart>
                            <Pie
                              data={budgetData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {budgetData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend 
                              verticalAlign="bottom" 
                              height={36}
                              formatter={(value, entry: any) => {
                                const total = budgetData.reduce((sum, item) => sum + item.value, 0)
                                const percent = ((entry.payload.value / total) * 100).toFixed(0)
                                const displayName = value.length > 20 ? `${value.substring(0, 20)}...` : value
                                return (
                                  <span style={{ color: entry.color }}>
                                    {displayName}: {percent}%
                                  </span>
                                )
                              }}
                            />
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload
                                  const total = budgetData.reduce((sum, item) => sum + item.value, 0)
                                  const percent = ((data.value / total) * 100).toFixed(1)
                                  return (
                                    <div className="rounded-lg border-2 bg-background/95 backdrop-blur-sm p-4 shadow-xl">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2 pb-2 border-b">
                                          <TrendingUp className="h-4 w-4 text-primary" />
                                          <span className="font-bold text-base">{data.name}</span>
                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <p className="text-xs uppercase text-muted-foreground font-medium">Budget</p>
                                            <p className="text-lg font-bold text-primary">
                                              ₱{Number(data.value).toLocaleString()}
                                            </p>
              </div>
                                          <div className="space-y-1">
                                            <p className="text-xs uppercase text-muted-foreground font-medium">Percentage</p>
                                            <p className="text-lg font-bold text-foreground">
                                              {percent}%
                                            </p>
                      </div>
                                        </div>
                                      </div>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                          </PieChart>
                        </ChartContainer>
                      ) : (
                        <div className="h-[300px] flex items-center justify-center">
                          <p className="text-muted-foreground">No data available</p>
                        </div>
                      )
                    })()}
                  </CardContent>
                </Card>
                      </div>
            </TabsContent>

            {/* Schools Tab */}
            <TabsContent value="schools" className="space-y-6">

            </TabsContent>
          </Tabs>
        </main>
    </div>
  )
}
