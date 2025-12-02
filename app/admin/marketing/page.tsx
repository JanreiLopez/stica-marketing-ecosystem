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
  
  // Time period filter state - added "all" option
  const [timePeriod, setTimePeriod] = useState<"all" | "week" | "month" | "nextMonth">("all")
  
  // Feeder schools data - fetched from database
  const [feederSchools, setFeederSchools] = useState<Array<{ id: number; name: string }>>([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  
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
    console.log('Marketing activities page mounted, fetching initial data...')
    fetchMarketingActivities()
    fetchEventTitles()
    fetchFeederSchools()
    
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
  }, [fetchMarketingActivities, fetchEventTitles, fetchFeederSchools])

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
    
    // Calculate ROI: (Leads Generated * Average Value per Lead - Total Budget) / Total Budget * 100
    // For simplicity, we'll assume an average value per lead of ₱5,000
    const averageValuePerLead = 5000
    const totalRevenue = totalLeads * averageValuePerLead
    const roi = totalBudget > 0 ? ((totalRevenue - totalBudget) / totalBudget) * 100 : 0
    
    return {
      totalLeads,
      totalBudget,
      activityCount: filteredActivities.length,
      roi: Math.round(roi)
    }
  }
  
  const stats = calculateStats()

  // Calculate active campaigns from marketing activities
  const calculateActiveCampaigns = () => {
    // Group activities by title and aggregate data
    const campaignMap = new Map()

    filteredActivities.forEach(activity => {
      const key = activity.title
      if (!campaignMap.has(key)) {
        campaignMap.set(key, {
          name: key,
          status: "Active", // All activities in current period are considered active
          leads: 0,
          budget: 0,
          activities: []
        })
      }

      const campaign = campaignMap.get(key)
      campaign.leads += activity.leadsGenerated

      // Parse budget and add to total
      const budgetValue = parseFloat(activity.budget.replace(/[^0-9.-]+/g, "")) || 0
      campaign.budget += budgetValue
      campaign.activities.push(activity)
    })

    // Convert to array and calculate conversion rates (mock data for now)
    return Array.from(campaignMap.values())
      .sort((a, b) => b.leads - a.leads)
      .slice(0, 4) // Show top 4 campaigns
      .map(campaign => ({
        ...campaign,
        budget: `₱${campaign.budget.toLocaleString()}`,
        conversion: Math.floor(60 + Math.random() * 20) // Mock conversion rate 60-80%
      }))
  }

  // Calculate channel performance from marketing activities
  const calculateChannelPerformance = () => {
    // Group activities by school (treating schools as channels for now)
    const channelMap = new Map()

    filteredActivities.forEach(activity => {
      // Use the activity title as the channel if no school is specified
      const channel = activity.school || activity.title || "Unspecified"
      if (!channelMap.has(channel)) {
        channelMap.set(channel, {
          channel,
          leads: 0,
          cost: 0,
          activities: []
        })
      }

      const channelData = channelMap.get(channel)
      channelData.leads += activity.leadsGenerated

      // Calculate cost per activity
      const budgetValue = parseFloat(activity.budget.replace(/[^0-9.-]+/g, "")) || 0
      channelData.cost += budgetValue
      channelData.activities.push(activity)
    })

    // Calculate total leads for percentage calculation
    const totalLeads = Array.from(channelMap.values()).reduce((sum, channel) => sum + channel.leads, 0)

    // Convert to array with percentages
    return Array.from(channelMap.values())
      .sort((a, b) => b.leads - a.leads)
      .map(channel => ({
        channel: channel.channel,
        leads: channel.leads,
        percentage: totalLeads > 0 ? Math.round((channel.leads / totalLeads) * 100) : 0,
        cost: channel.cost > 0 ? `₱${channel.cost.toLocaleString()}` : "₱0"
      }))
      .slice(0, 5) // Show top 5 channels
  }

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
  const activeCampaigns = calculateActiveCampaigns()
  const channelPerformance = calculateChannelPerformance()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">

          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-slate-700 dark:text-slate-200 mb-2">Marketing Activities</h1>
            <p className="text-slate-600 dark:text-slate-400">Track marketing campaigns, lead generation, and conversion metrics</p>
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
                <div className="text-2xl font-bold">{stats.roi}%</div>
                <p className="text-xs text-muted-foreground">Dynamic ROI calculation</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.activityCount > 0 ? Math.round((stats.totalLeads / stats.activityCount) * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">Leads per activity</p>
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

          {/* Campaign Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Current marketing campaigns and their performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeCampaigns.length > 0 ? activeCampaigns.map((campaign, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{campaign.name}</h4>
                        <Badge variant={campaign.status === "Active" ? "default" : "secondary"}>
                          {campaign.status}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Leads</p>
                          <p className="font-medium">{campaign.leads}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Conversion</p>
                          <p className="font-medium">{campaign.conversion}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Budget</p>
                          <p className="font-medium">{campaign.budget}</p>
                        </div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No active campaigns found for {periodLabel.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Channel Performance</CardTitle>
                <CardDescription>Lead generation by marketing channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {channelPerformance.length > 0 ? channelPerformance.map((channel, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{channel.channel}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{channel.leads} leads</span>
                          <span className="text-sm font-medium">{channel.cost}</span>
                        </div>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-primary h-2 rounded-full" style={{ width: `${channel.percentage}%` }}></div>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No channel performance data available for {periodLabel.toLowerCase()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

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
        </main>
    </div>
  )
}