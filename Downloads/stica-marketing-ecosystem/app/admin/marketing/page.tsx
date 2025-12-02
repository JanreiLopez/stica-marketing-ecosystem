"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TrendingUp, Target, BarChart3, Plus, X, CalendarIcon } from "lucide-react"
import { AdminBreadcrumbs } from "@/components/admin-breadcrumbs"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

export default function MarketingPage() {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [eventTitles, setEventTitles] = useState<string[]>([])
  const [isAddingNewTitle, setIsAddingNewTitle] = useState(false)
  const [newTitleInput, setNewTitleInput] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    selectedTitle: "",
    leadsGenerated: "",
    school: "",
    budget: "",
    date: undefined as Date | undefined,
  })
  const [marketingActivities, setMarketingActivities] = useState<Array<{
    id: number
    title: string
    leadsGenerated: number
    school: string
    budget: string
    date: string
  }>>([])
  
  // Feeder schools data - should match data from schools module
  const [feederSchools] = useState([
    { id: 1, name: "School of Technology", programs: 8, students: 342, status: "Active" },
    { id: 2, name: "School of Business", programs: 6, students: 298, status: "Active" },
  ])

  const handleLogout = () => {
    router.push("/admin/login")
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

  const handleAddNewTitle = () => {
    if (newTitleInput.trim() && !eventTitles.includes(newTitleInput.trim())) {
      const trimmedTitle = newTitleInput.trim()
      setEventTitles(prev => [...prev, trimmedTitle])
      setFormData(prev => ({ ...prev, selectedTitle: trimmedTitle, title: trimmedTitle }))
      setNewTitleInput("")
      setIsAddingNewTitle(false)
    }
  }

  const handleCancelAddTitle = () => {
    setIsAddingNewTitle(false)
    setNewTitleInput("")
  }

  const handleDeleteTitle = (titleToDelete: string, e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    setEventTitles(prev => prev.filter(title => title !== titleToDelete))
    if (formData.selectedTitle === titleToDelete) {
      setFormData(prev => ({ ...prev, selectedTitle: "", title: "" }))
    }
  }

  const handleSubmit = () => {
    if (!formData.title || !formData.leadsGenerated || !formData.budget || !formData.date) {
      return
    }

    const newActivity = {
      id: marketingActivities.length + 1,
      title: formData.title,
      leadsGenerated: parseInt(formData.leadsGenerated) || 0,
      school: formData.school || "",
      budget: formData.budget,
      date: format(formData.date, 'yyyy-MM-dd'),
    }

    setMarketingActivities(prev => [newActivity, ...prev])
    
    // Add title to eventTitles if it doesn't exist
    if (formData.title && !eventTitles.includes(formData.title)) {
      setEventTitles(prev => [...prev, formData.title])
    }
    
    // Reset form
    setFormData({
      title: "",
      selectedTitle: "",
      leadsGenerated: "",
      school: "",
      budget: "",
      date: undefined,
    })
    setIsAddingNewTitle(false)
    setNewTitleInput("")
    setIsDialogOpen(false)
  }

  // Get activity date strings for comparison
  const activityDateStrings = marketingActivities.map(activity => activity.date)
  
  // Matcher function to check if a date has an activity
  const hasActivity = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd')
    return activityDateStrings.includes(dateString)
  }

  return (
    <div className="min-h-screen bg-background">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          <AdminBreadcrumbs />
          
          <div className="mb-6">
            <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Marketing Activities</h1>
            <p className="text-muted-foreground">Track marketing campaigns, lead generation, and conversion metrics</p>
          </div>

          {/* Marketing Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Campaign ROI</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">324%</div>
                <p className="text-xs text-muted-foreground">+15% from last quarter</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lead Generation</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,456</div>
                <p className="text-xs text-muted-foreground">This month</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">68%</div>
                <p className="text-xs text-muted-foreground">+5% improvement</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cost per Lead</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₱1,200</div>
                <p className="text-xs text-muted-foreground">-12% from last month</p>
              </CardContent>
            </Card>
          </div>

          {/* Activities Calendar */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activities Calendar</CardTitle>
                  <CardDescription>Plan and review marketing events and campaigns</CardDescription>
                </div>
                <Button 
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Activity
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Calendar
                captionLayout="dropdown-buttons"
                numberOfMonths={1}
                weekStartsOn={1}
                className="rounded-md border w-full [--cell-size:--spacing(12)] md:[--cell-size:--spacing(14)] lg:[--cell-size:--spacing(16)]"
                classNames={{
                  dropdowns: "w-full flex items-center justify-center gap-2 text-base md:text-lg h-10",
                }}
                modifiers={{
                  hasActivity,
                }}
                modifiersClassNames={{
                  hasActivity: "bg-primary/20 border-primary border-2 font-semibold",
                }}
              />
            </CardContent>
          </Card>

          {/* Marketing Activities Table */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Marketing Activities</CardTitle>
              <CardDescription>Track all marketing events and their performance</CardDescription>
            </CardHeader>
            <CardContent>
              {marketingActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No marketing activities yet. Click "Add Activity" to create one.</p>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {marketingActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell className="font-medium">{activity.title}</TableCell>
                        <TableCell>{activity.leadsGenerated}</TableCell>
                        <TableCell>{activity.school || "-"}</TableCell>
                        <TableCell>{activity.budget}</TableCell>
                        <TableCell>{activity.date}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
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
                  {[
                    {
                      name: "Career Talk",
                      status: "Active",
                      leads: 234,
                      conversion: 72,
                      budget: "₱250,000",
                    },
                    { name: "Tech Career Fair 2024", status: "Active", leads: 189, conversion: 65, budget: "₱175,000" },
                    { name: "School Visit", status: "Paused", leads: 156, conversion: 58, budget: "₱100,000" },
                    {
                      name: "ML Tournament",
                      status: "Active",
                      leads: 298,
                      conversion: 74,
                      budget: "₱210,000",
                    },
                  ].map((campaign, index) => (
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
                  ))}
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
                  {[
                    { channel: "Career Talk", leads: 456, percentage: 35, cost: "₱117,000" },
                    { channel: "School Visit", leads: 298, percentage: 23, cost: "₱94,500" },
                    { channel: "ML Tournament", leads: 234, percentage: 18, cost: "₱44,500" },
                    { channel: "Referrals", leads: 189, percentage: 15, cost: "₱0" },
                    { channel: "Direct Traffic", leads: 123, percentage: 9, cost: "₱0" },
                  ].map((channel, index) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Activity Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Marketing Activity</DialogTitle>
                <DialogDescription>
                  Create a new marketing event or campaign
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
                      {feederSchools.map((school) => (
                        <SelectItem key={school.id} value={school.name}>
                          {school.name}
                        </SelectItem>
                      ))}
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
                    disabled={!formData.title || !formData.leadsGenerated || !formData.budget || !formData.date}
                  >
                    Add Activity
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
    </div>
  )
}
