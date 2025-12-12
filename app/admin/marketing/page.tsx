"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { X, Plus, Eye, Edit, Trash2, TrendingUp, BarChart3, Target, Users, CalendarIcon, Maximize2, Minimize2 } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, subMonths } from "date-fns"
import { supabase } from "@/lib/supabase-client"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell, Tooltip } from "recharts"

export default function MarketingPage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [eventTitles, setEventTitles] = useState<string[]>([])
  const [isAddingNewTitle, setIsAddingNewTitle] = useState(false)
  const [newTitleInput, setNewTitleInput] = useState("")
  const [formData, setFormData] = useState({
    id: null as number | null,
    title: "",
    selectedTitle: "",
    leadsGenerated: "",
    school: "",
    budget: "",
    date: undefined as Date | undefined,
  })
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTableFullscreen, setIsTableFullscreen] = useState(false)
  const [marketingActivities, setMarketingActivities] = useState<Array<{
    id: number
    title: string
    leadsGenerated: number
    school: string
    budget: string
    date: string
  }>>([])
  const [userPermissions, setUserPermissions] = useState<string[]>([]); // New state for user permissions
  
  // Date range state - Dynamic dates: start date is January 1 of last year, end date is December 31 of this year (for year-over-year comparison)
  const currentYear = new Date().getFullYear()
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(currentYear - 1, 0, 1)) // January 1 of last year
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(currentYear, 11, 31)) // December 31 of this year
  
  // Time period filter state - added "all" option
  const [timePeriod, setTimePeriod] = useState<"all" | "week" | "month" | "nextMonth">("all")
  
  // Feeder schools data - fetched from database
  const [feederSchools, setFeederSchools] = useState<Array<{ id: number; name: string }>>([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  const [totalEnrolledStudents, setTotalEnrolledStudents] = useState<number>(0)
  const [isConversionRateDialogOpen, setIsConversionRateDialogOpen] = useState(false)
  
  const handleLogout = () => {
    router.push("/login")
  }

  const handleSelectTitle = (value: string) => {
    if (value === "__add_new__") {
      setIsAddingNewTitle(true)
      setNewTitleInput("")
    } else if (value && !value.startsWith("__delete__")) {
      setFormData(prev => ({ ...prev, selectedTitle: value, title: value }))
      setIsAddingNewTitle(false)
    }
  }

  const handleAddNewTitle = async () => {
    if (newTitleInput.trim() && !eventTitles.includes(newTitleInput.trim())) {
      const trimmedTitle = newTitleInput.trim()
      
      try {
        // Save to database
        const response = await fetch('/api/event-titles', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title: trimmedTitle }),
        })

        const data = await response.json()
        
        if (response.ok) {
          // Add to local state
          setEventTitles(prev => [...prev, trimmedTitle])
          setFormData(prev => ({ ...prev, selectedTitle: trimmedTitle, title: trimmedTitle }))
          setNewTitleInput("")
          setIsAddingNewTitle(false)
        } else {
          console.error('Failed to save event title:', data.error)
        }
      } catch (error) {
        console.error('Error saving event title:', error)
      }
    }
  }

  const handleCancelAddTitle = () => {
    setIsAddingNewTitle(false)
    setNewTitleInput("")
  }

  const handleDeleteTitle = async (titleToDelete: string, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    
    try {
      // Find the title ID to delete
      const response = await fetch('/api/event-titles')
      const data = await response.json()
      
      if (response.ok) {
        const titleItem = data.find((item: any) => item.title === titleToDelete)
        if (titleItem) {
          // Delete from database
          const deleteResponse = await fetch(`/api/event-titles?id=${titleItem.id}`, {
            method: 'DELETE',
          })
          
          if (deleteResponse.ok) {
            // Remove from local state
            setEventTitles(prev => prev.filter(title => title !== titleToDelete))
            if (formData.selectedTitle === titleToDelete) {
              setFormData(prev => ({ ...prev, selectedTitle: "", title: "" }))
            }
          } else {
            const deleteData = await deleteResponse.json()
            console.error('Failed to delete event title:', deleteData.error)
          }
        }
      } else {
        console.error('Failed to fetch event titles:', data.error)
      }
    } catch (error) {
      console.error('Error deleting event title:', error)
    }
  }

  const handleEditActivity = (activity: any) => {
    setFormData({
      id: activity.id,
      title: activity.title,
      selectedTitle: activity.title,
      leadsGenerated: activity.leadsGenerated.toString(),
      school: activity.school || "",
      budget: activity.budget,
      date: activity.date ? new Date(activity.date) : undefined,
    })
    setIsEditing(true)
    setIsDialogOpen(true)
  }

  const handleDeleteActivity = async (id: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) return

    try {
      const response = await fetch(`/api/marketing-activities?id=${id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh the activities list
        await fetchMarketingActivities()
      } else {
        setError('Failed to delete marketing activity: ' + data.error)
        console.error('Failed to delete marketing activity:', data.error)
      }
    } catch (error) {
      setError('Error deleting marketing activity: ' + (error as Error).message)
      console.error('Error deleting marketing activity:', error)
    }
  }

  const handleSubmit = async () => {
    if (!formData.title || !formData.budget || !formData.date) {
      return
    }

    try {
      const activityData = {
        title: formData.title,
        leadsGenerated: formData.leadsGenerated ? parseInt(formData.leadsGenerated) || 0 : 0,
        school: formData.school || "",
        budget: formData.budget,
        date: format(formData.date, 'yyyy-MM-dd'),
      }

      let response;
      if (isEditing && formData.id) {
        // Update existing activity
        response = await fetch('/api/marketing-activities', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: formData.id, ...activityData }),
        })
      } else {
        // Create new activity
        response = await fetch('/api/marketing-activities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(activityData),
        })
      }

      const data = await response.json()

      if (response.ok) {
        // Refresh the activities list
        await fetchMarketingActivities()
        
        // Add title to eventTitles if it doesn't exist
        if (formData.title && !eventTitles.includes(formData.title)) {
          setEventTitles(prev => [...prev, formData.title])
        }
        
        // Reset form
        setFormData({
          id: null,
          title: "",
          selectedTitle: "",
          leadsGenerated: "",
          school: "",
          budget: "",
          date: undefined,
        })
        setIsEditing(false)
        setIsAddingNewTitle(false)
        setNewTitleInput("")
        setIsDialogOpen(false)
      } else {
        setError('Failed to create marketing activity: ' + data.error)
        console.error('Failed to create marketing activity:', data.error)
      }
    } catch (error) {
      setError('Error creating marketing activity: ' + (error as Error).message)
      console.error('Error creating marketing activity:', error)
    }
  }

  // Helper function for fetching with retry logic
  const fetchWithRetry = async (url: string, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`API fetch attempt ${attempt}/${maxRetries} for ${url}`)
        const response = await fetch(url)

        if (response.ok) {
          console.log(`API fetch successful on attempt ${attempt}`)
          return response
        }

        // If not a network error (server returned error), don't retry
        if (response.status >= 400 && response.status < 500) {
          console.log(`Client error ${response.status}, not retrying`)
          return response
        }

        // For server errors or network issues, retry
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 // Exponential backoff
          console.log(`Server/network error, retrying in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

      } catch (error) {
        console.error(`Network error on attempt ${attempt}:`, error)
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000
          console.log(`Retrying network request in ${delay}ms...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        } else {
          throw error
        }
      }
    }
    throw new Error('Max retries exceeded')
  }

  // Fetch marketing activities from Supabase with retry logic
  const fetchMarketingActivities = useCallback(async () => {
    try {
      setLoading(true)
      console.log('Fetching marketing activities from API...')
      const response = await fetchWithRetry('/api/marketing-activities')
      const data = await response.json()
      console.log('API response:', { status: response.status, data })

      if (response.ok) {
        console.log('Fetched marketing activities:', data)
        setMarketingActivities(data)
        // Update eventTitles with unique titles from activities, but only if they're not already there
        const titles = Array.from(new Set(data.map((activity: any) => activity.title))) as string[]
        setEventTitles(prevTitles => {
          const newTitles = titles.filter(title => !prevTitles.includes(title)) as string[]
          return newTitles.length > 0 ? [...prevTitles, ...newTitles] : prevTitles
        })
      } else {
        console.error('Failed to fetch marketing activities:', data.error)
        setError(data.error || 'Failed to fetch marketing activities')
      }
    } catch (err) {
      console.error('Error fetching marketing activities after retries:', err)
      setError('Failed to connect to server: ' + (err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchEventTitles = useCallback(async () => {
    try {
      const response = await fetch('/api/event-titles')
      const data = await response.json()
      
      if (response.ok) {
        // Extract just the title strings from the objects
        const titles = data.map((item: any) => item.title)
        setEventTitles(titles)
      } else {
        console.error('Failed to fetch event titles:', data.error)
      }
    } catch (error) {
      console.error('Error fetching event titles:', error)
    }
  }, [])

  const fetchTotalEnrolledStudents = useCallback(async () => {
    try {
      const { count, error } = await supabase
        .from('enrollments')
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        console.error('Error fetching enrolled students:', error)
        setTotalEnrolledStudents(0)
      } else {
        setTotalEnrolledStudents(count || 0)
      }
    } catch (err) {
      console.error('Error fetching enrolled students:', err)
      setTotalEnrolledStudents(0)
    }
  }, [])

  const fetchFeederSchools = useCallback(async () => {
    try {
      // Check if Supabase is properly configured
      if (!supabase) {
        console.error('Supabase client is not initialized')
        throw new Error('Supabase client is not initialized')
      }
      
      setSchoolsLoading(true)
      console.log('Fetching feeder schools from Supabase...')
      
      // Simplified query to test if we can access the table
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .eq('type', 'feeder')
      
      console.log('Supabase response:', { data, error })
      
      if (error) {
        console.error('Supabase error fetching feeder schools:', error)
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        })
        throw new Error(`Supabase error: ${error.message}`)
      }
      
      console.log('Successfully fetched feeder schools:', data)
      setFeederSchools(data || [])
      
      // Show a message if no feeder schools are found
      if (data && data.length === 0) {
        console.log('No feeder schools found in database')
      }
    } catch (err) {
      console.error('Error fetching feeder schools:', err)
      console.error('Error type:', typeof err)
      console.error('Error keys:', Object.keys(err || {}))
      if (err instanceof Error) {
        console.error('Error message:', err.message)
      }
      
      // Show error to user
      setError('Failed to load feeder schools. Please try again.')
    } finally {
      setSchoolsLoading(false)
    }
  }, [])

  // Load marketing activities on component mount
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
    console.log('Marketing activities page mounted, fetching initial data...')
    fetchMarketingActivities()
    fetchEventTitles()
    fetchFeederSchools()
    fetchTotalEnrolledStudents()
    
    // Listen for school updates
    const handleSchoolUpdate = (event: CustomEvent) => {
      console.log('School updated event received in marketing page:', event.detail)
      fetchMarketingActivities()
    }
    
    window.addEventListener('schoolUpdated', handleSchoolUpdate as EventListener)
    
    return () => {
      console.log('Marketing activities page unmounting, removing event listener...')
      window.removeEventListener('schoolUpdated', handleSchoolUpdate as EventListener)
    }
  }, [router, fetchMarketingActivities, fetchEventTitles, fetchFeederSchools, fetchTotalEnrolledStudents]) // Added router to dependency array

  // Helper function to filter activities by time period
  const filterActivitiesByTimePeriod = (activities: typeof marketingActivities) => {
    // If "all" is selected, return all activities
    if (timePeriod === "all") {
      return activities
    }
    
    const now = new Date()
    
    switch (timePeriod) {
      case "week":
        const weekStart = startOfWeek(now, { weekStartsOn: 1 }) // Monday as start of week
        const weekEnd = endOfWeek(now, { weekStartsOn: 1 }) // Sunday as end of week
        return activities.filter(activity => {
          if (!activity.date) return false
          const activityDate = new Date(activity.date)
          return activityDate >= weekStart && activityDate <= weekEnd
        })
      
      case "month":
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        return activities.filter(activity => {
          if (!activity.date) return false
          const activityDate = new Date(activity.date)
          return activityDate >= monthStart && activityDate <= monthEnd
        })
      
      case "nextMonth":
        const nextMonthStart = startOfMonth(addMonths(now, 1))
        const nextMonthEnd = endOfMonth(addMonths(now, 1))
        return activities.filter(activity => {
          if (!activity.date) return false
          const activityDate = new Date(activity.date)
          return activityDate >= nextMonthStart && activityDate <= nextMonthEnd
        })
      
      default:
        return activities
    }
  }

  // Get filtered activities based on time period
  const filteredActivities = filterActivitiesByTimePeriod(marketingActivities)

  // Calculate statistics based on filtered activities
  const calculateStats = () => {
    const totalLeads = filteredActivities.reduce((sum, activity) => sum + activity.leadsGenerated, 0)
    const totalBudget = filteredActivities.reduce((sum, activity) => {
      const budget = parseFloat(activity.budget.replace(/[^0-9.-]+/g, "")) || 0
      return sum + budget
    }, 0)
    
    // Calculate Campaign ROI: Total Leads / Total Graduating Students
    // This shows how many leads were generated per graduating student
    const roi = totalEnrolledStudents > 0 ? totalLeads / totalEnrolledStudents : 0
    
    // Calculate Conversion Rate: (Total Graduating Students / Total Leads Generated) * 100
    // This shows what percentage of leads converted to graduating students
    const conversionRate = totalLeads > 0 ? (totalEnrolledStudents / totalLeads) * 100 : 0
    
    return {
      totalLeads,
      totalBudget,
      activityCount: filteredActivities.length,
      roi: Math.round(roi * 100) / 100, // Round to 2 decimal places (leads per student)
      conversionRate: Math.round(conversionRate * 100) / 100 // Round to 2 decimal places (percentage)
    }
  }
  
  const stats = calculateStats()

  // Calculate conversion rate per event for the dialog
  const calculateEventConversionRates = () => {
    // Group activities by event title
    const eventMap = new Map<string, { leads: number; title: string }>()
    
    filteredActivities.forEach(activity => {
      const title = activity.title
      if (!eventMap.has(title)) {
        eventMap.set(title, { leads: 0, title })
      }
      const event = eventMap.get(title)!
      event.leads += activity.leadsGenerated
    })
    
    // Calculate conversion rate for each event
    // Conversion Rate = (Total Enrolled Students / Total Leads for Event) * 100
    return Array.from(eventMap.values())
      .map(event => ({
        event: event.title,
        leads: event.leads,
        conversionRate: event.leads > 0 ? (totalEnrolledStudents / event.leads) * 100 : 0
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate)
  }

  const eventConversionRates = calculateEventConversionRates()


  // Get period label for statistics
  const getPeriodLabel = () => {
    switch (timePeriod) {
      case "all": return "All time";
      case "week": return "This week";
      case "month": return "This month";
      case "nextMonth": return "Next month";
      default: return "This period";
    }
  }
  
  const periodLabel = getPeriodLabel()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} userPermissions={userPermissions} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-700 dark:text-slate-200 mb-2">Marketing Activities</h1>
                <p className="text-slate-600 dark:text-slate-400">Track marketing campaigns, lead generation, and conversion metrics</p>
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
                  onClick={() => {
                    const currentYear = new Date().getFullYear()
                    setStartDate(new Date(currentYear - 1, 0, 1)) // January 1 of last year
                    setEndDate(new Date(currentYear, 11, 31)) // December 31 of this year
                    fetchMarketingActivities()
                  }}
                  disabled={loading}
                  className="h-9 w-9 p-0"
                  title={loading ? 'Refreshing...' : 'Refresh Data'}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Marketing Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Generation</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalLeads}</div>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Lead</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.totalLeads > 0 ? `₱${Math.round(stats.totalBudget / stats.totalLeads).toLocaleString()}` : '₱0'}
                </div>
                <p className="text-xs text-muted-foreground">{periodLabel}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaign ROI</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.roi.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Leads per graduating student</p>
              </CardContent>
            </Card>

            <Card 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setIsConversionRateDialogOpen(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.conversionRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">Leads to enrolled students</p>
              </CardContent>
            </Card>
          </div>

          {/* Marketing Activities Table */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Marketing Activities</CardTitle>
                  <CardDescription>Track all marketing events and their performance</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsTableFullscreen(true)}
                    className="h-8 w-8"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  <Button
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setIsDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Activity
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={timePeriod} onValueChange={(value) => setTimePeriod(value as "all" | "week" | "month" | "nextMonth")} className="w-full">
                <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                  <TabsTrigger 
                    value="all" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger 
                    value="week" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    This Week
                  </TabsTrigger>
                  <TabsTrigger 
                    value="month" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    This Month
                  </TabsTrigger>
                  <TabsTrigger 
                    value="nextMonth" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Next Month
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value={timePeriod} className="mt-0">
                  {filteredActivities.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>
                        {timePeriod === "all" 
                          ? "No marketing activities found. Click \"Add Activity\" to create one." 
                          : "No marketing activities found for this time period. Click \"Add Activity\" to create one."}
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Leads Generated</TableHead>
                          <TableHead>School</TableHead>
                          <TableHead>Budget</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredActivities.map((activity) => (
                          <TableRow key={activity.id}>
                            <TableCell className="font-medium">{activity.title}</TableCell>
                            <TableCell>{activity.leadsGenerated}</TableCell>
                            <TableCell>{activity.school || "-"}</TableCell>
                            <TableCell>{activity.budget}</TableCell>
                            <TableCell>{activity.date || "-"}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditActivity(activity)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDeleteActivity(activity.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>


          {/* Add Activity Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Marketing Activity' : 'Add Marketing Activity'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Edit the marketing event or campaign' : 'Create a new marketing event or campaign'}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title of Event</Label>
                  {isAddingNewTitle ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="new-title"
                          placeholder="Enter new event title"
                          value={newTitleInput}
                          onChange={(e) => setNewTitleInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleAddNewTitle()
                            } else if (e.key === "Escape") {
                              handleCancelAddTitle()
                            }
                          }}
                          className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                          autoFocus
                        />
                        <Button
                          onClick={handleAddNewTitle}
                          disabled={!newTitleInput.trim()}
                          className="bg-primary hover:bg-primary/90"
                        >
                          Add
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelAddTitle}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Select value={formData.selectedTitle} onValueChange={handleSelectTitle}>
                      <SelectTrigger id="title" className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500">
                        <SelectValue placeholder="Select or add event title" />
                      </SelectTrigger>
                      <SelectContent>
                        {eventTitles.map((title) => (
                          <SelectItem 
                            key={title} 
                            value={title}
                            onPointerDown={(e) => {
                              const target = e.target as HTMLElement
                              // If clicking on the delete button, prevent the SelectItem from being selected
                              if (target.closest('button')) {
                                e.preventDefault()
                              }
                            }}
                          >
                            <div className="flex items-center justify-between w-full pr-6">
                              <span className="flex-1">{title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                type="button"
                                className="h-6 w-6 p-0 ml-2 hover:bg-destructive hover:text-destructive-foreground"
                                onPointerDown={(e) => {
                                  e.stopPropagation()
                                  handleDeleteTitle(title, e)
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  e.preventDefault()
                                  handleDeleteTitle(title, e)
                                }}
                              >
                                <X className="h-4 w-4 pointer-events-none" />
                              </Button>
                            </div>
                          </SelectItem>
                        ))}
                        <div className="border-t border-border mt-1 pt-1">
                          <SelectItem value="__add_new__" className="text-primary font-medium">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4" />
                              <span>Add Activity</span>
                            </div>
                          </SelectItem>
                        </div>
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school">School</Label>
                  <Select
                    value={formData.school}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, school: value }))}
                  >
                    <SelectTrigger id="school" className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>
                    <SelectContent>
                      {schoolsLoading ? (
                        <SelectItem value="loading" disabled>
                          Loading schools...
                        </SelectItem>
                      ) : error ? (
                        <>
                          <SelectItem value="error" disabled>
                            Error loading schools
                          </SelectItem>
                          <div className="p-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                              onClick={(e) => {
                                e.preventDefault()
                                fetchFeederSchools()
                              }}
                            >
                              Retry
                            </Button>
                          </div>
                        </>
                      ) : feederSchools.length === 0 ? (
                        <SelectItem value="no-schools" disabled>
                          No feeder schools available
                        </SelectItem>
                      ) : (
                        feederSchools.map((school) => (
                          <SelectItem key={school.id} value={school.name}>
                            {school.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="date"
                        variant="outline"
                        className="w-full justify-start text-left font-normal border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.date ? format(formData.date, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => setFormData(prev => ({ ...prev, date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    placeholder="Enter budget (e.g., ₱250,000)"
                    value={formData.budget}
                    onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leads">Leads Generated</Label>
                  <Input
                    id="leads"
                    type="number"
                    placeholder="Enter number of leads"
                    value={formData.leadsGenerated}
                    onChange={(e) => setFormData(prev => ({ ...prev, leadsGenerated: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsDialogOpen(false)
                      setFormData({
                        id: null,
                        title: "",
                        selectedTitle: "",
                        leadsGenerated: "",
                        school: "",
                        budget: "",
                        date: undefined,
                      })
                      setIsAddingNewTitle(false)
                      setNewTitleInput("")
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    className="bg-primary hover:bg-primary/90"
                    disabled={!formData.title || !formData.budget || !formData.date}
                  >
                    {isEditing ? 'Update Activity' : 'Add Activity'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Fullscreen Table Dialog */}
          <Dialog open={isTableFullscreen} onOpenChange={setIsTableFullscreen}>
            <DialogContent 
                          className="!max-w-none !w-screen !h-screen !max-h-screen !top-0 !left-0 !translate-x-0 !translate-y-0 !rounded-none p-6 flex flex-col"
                          showCloseButton={false}
                        >
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <DialogTitle>Marketing Activities Table</DialogTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsTableFullscreen(false)}
                      className="h-8 w-8"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              {/* Add button in fullscreen */}
              <div className="flex items-center justify-end mb-6 mt-4">
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              </div>
              <div className="overflow-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Leads Generated</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.title}</TableCell>
                        <TableCell>{activity.leadsGenerated}</TableCell>
                        <TableCell>{activity.school || "-"}</TableCell>
                        <TableCell>₱{activity.budget.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(activity.date), "MMM dd, yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditActivity(activity)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteActivity(activity.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </DialogContent>
          </Dialog>

          {/* Conversion Rate by Event Dialog */}
          <Dialog open={isConversionRateDialogOpen} onOpenChange={setIsConversionRateDialogOpen}>
            <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[98vh] !max-h-[98vh] !m-0 !rounded-lg !top-[50%] !left-[50%] !translate-x-[-50%] !translate-y-[-50%] overflow-hidden p-4 flex flex-col">
              <DialogHeader className="space-y-2 pb-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-bold">Conversion Rate by Event</DialogTitle>
                    <DialogDescription className="text-sm mt-0.5">
                      Detailed breakdown of conversion rates for each marketing event
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              
              {eventConversionRates.length > 0 ? (
                <div className="space-y-2 mt-2 flex-1 flex flex-col overflow-hidden">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-2">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Total Events</p>
                            <p className="text-xl font-bold text-blue-900 dark:text-blue-100 mt-0.5">
                              {eventConversionRates.length}
                            </p>
                          </div>
                          <Target className="h-6 w-6 text-blue-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-green-600 dark:text-green-400">Total Leads</p>
                            <p className="text-xl font-bold text-green-900 dark:text-green-100 mt-0.5">
                              {eventConversionRates.reduce((sum, e) => sum + e.leads, 0).toLocaleString()}
                            </p>
                          </div>
                          <Users className="h-6 w-6 text-green-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Avg. Rate</p>
                            <p className="text-xl font-bold text-purple-900 dark:text-purple-100 mt-0.5">
                              {eventConversionRates.length > 0 
                                ? (eventConversionRates.reduce((sum, e) => sum + e.conversionRate, 0) / eventConversionRates.length).toFixed(1)
                                : '0'
                              }%
                            </p>
                          </div>
                          <TrendingUp className="h-6 w-6 text-purple-500 opacity-50" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Chart Section */}
                  <Card className="border-2 shadow-lg flex-1 flex flex-col min-h-0">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b py-2 flex-shrink-0">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <BarChart3 className="h-3.5 w-3.5" />
                        Event Performance Analysis
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Conversion rate percentage for each marketing event
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-2 flex-1 flex flex-col min-h-0">
                      <div className="w-full h-full min-h-[200px] max-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={eventConversionRates}
                            layout="vertical"
                            margin={{ top: 5, right: 20, left: 90, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" opacity={0.3} />
                            <XAxis 
                              type="number" 
                              domain={[0, 'dataMax']}
                              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                              label={{ value: 'Conversion Rate (%)', position: 'insideBottom', offset: -3, fill: 'hsl(var(--foreground))', style: { fontSize: '10px' } }}
                            />
                            <YAxis 
                              type="category" 
                              dataKey="event" 
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
                                          <Target className="h-4 w-4 text-primary" />
                                          <span className="font-bold text-base">{data.event}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                          <div className="space-y-1">
                                            <p className="text-xs uppercase text-muted-foreground font-medium">Conversion Rate</p>
                                            <p className="text-lg font-bold text-primary">
                                              {data.conversionRate.toFixed(2)}%
                                            </p>
                                          </div>
                                          <div className="space-y-1">
                                            <p className="text-xs uppercase text-muted-foreground font-medium">Leads Generated</p>
                                            <p className="text-lg font-bold text-foreground">
                                              {data.leads.toLocaleString()}
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
                            <Bar
                              dataKey="conversionRate"
                              fill="hsl(var(--primary))"
                              radius={[0, 8, 8, 0]}
                              strokeWidth={2}
                            >
                              {eventConversionRates.map((entry, index) => {
                                const colors = [
                                  'hsl(217, 91%, 60%)',  // Blue
                                  'hsl(142, 76%, 36%)',  // Green
                                  'hsl(262, 83%, 58%)',  // Purple
                                  'hsl(24, 95%, 53%)',   // Orange
                                  'hsl(0, 84%, 60%)',    // Red
                                  'hsl(280, 100%, 70%)', // Pink
                                  'hsl(199, 89%, 48%)',  // Cyan
                                  'hsl(47, 96%, 53%)',   // Yellow
                                ]
                                return (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={colors[index % colors.length]}
                                    stroke={colors[index % colors.length]}
                                  />
                                )
                              })}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      {/* Event Details List */}
                      <div className="mt-3 pt-3 border-t">
                        <p className="text-xs font-semibold mb-2 text-muted-foreground">Event Details</p>
                        <div className="space-y-1">
                          {eventConversionRates.map((event, index) => {
                            const colors = [
                              'bg-blue-500',
                              'bg-green-500',
                              'bg-purple-500',
                              'bg-orange-500',
                              'bg-red-500',
                              'bg-pink-500',
                              'bg-cyan-500',
                              'bg-yellow-500',
                            ]
                            return (
                              <div
                                key={index}
                                className="flex items-center gap-2 p-1.5 rounded-lg border hover:bg-muted/50 transition-colors"
                              >
                                <div className={`w-1.5 h-6 rounded-full ${colors[index % colors.length]}`} />
                                <div className="flex-1">
                                  <p className="font-semibold text-xs text-foreground">{event.event}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[10px] text-muted-foreground">
                                      {event.leads.toLocaleString()} leads
                                    </span>
                                    <span className="text-[10px] text-muted-foreground">•</span>
                                    <span className="text-[10px] font-medium text-primary">
                                      {event.conversionRate.toFixed(2)}% conversion
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-bold text-foreground">
                                    {event.conversionRate.toFixed(1)}%
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] text-center space-y-4">
                  <div className="p-4 rounded-full bg-muted">
                    <BarChart3 className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-foreground">No event data available</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add marketing activities to see conversion rates
                    </p>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
    </div>
  )
}