"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Search, Plus, Edit, Trash2, Users, BookOpen, X, School, Maximize2, Minimize2, CalendarIcon } from "lucide-react"
import { AdminSidebar } from "@/components/admin-sidebar"
import { useRouter } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase-client"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

export default function SchoolsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [schoolTypeFilter, setSchoolTypeFilter] = useState("all")
  const [distanceFilter, setDistanceFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingSchoolId, setEditingSchoolId] = useState<number | null>(null)
  const [originalCourses, setOriginalCourses] = useState<Array<{id: number}>>([])
  const [schoolFormData, setSchoolFormData] = useState({
    name: "",
    status: "Active",
    type: "feeder" as "feeder" | "competitor" | "non-feeder",
    schoolType: "public" as "public" | "private",
    kmAway: "",
    grade10Students: "",
    grade12Students: "",
    description: "",
    courses: [] as Array<{ id: number; name: string; tuitionFee: string }>,
    // Competitor-specific fields
    buildingOrGrounds: "" as "" | "B" | "G",
    campusSize: "" as "" | "L" | "E" | "S",
    facilities: "" as "" | "B" | "E" | "P",
    estimatedTuitionFee: "",
  })

  const [schools, setSchools] = useState<Array<any>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isTableFullscreen, setIsTableFullscreen] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([]); // New state for user permissions
  
  // Date range state - Dynamic dates: start date is January 1 of last year, end date is December 31 of this year (for year-over-year comparison)
  const currentYear = new Date().getFullYear()
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(currentYear - 1, 0, 1)) // January 1 of last year
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(currentYear, 11, 31)) // December 31 of this year

  // Helper function to check distance filter
  const matchesDistance = (school: any) => {
    if (distanceFilter === "all") return true
    const kmAway = school.km_away ? parseFloat(school.km_away) : null
    if (kmAway === null) return distanceFilter === "no-data"
    
    switch (distanceFilter) {
      case "near":
        return kmAway >= 0 && kmAway <= 5
      case "medium":
        return kmAway > 5 && kmAway <= 15
      case "far":
        return kmAway > 15
      case "no-data":
        return false
      default:
        return true
    }
  }

  const filteredPartners = schools.filter((school: any) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSchoolType = schoolTypeFilter === "all" || (school.school_type && school.school_type.toLowerCase() === schoolTypeFilter.toLowerCase())
    const matchesDistanceFilter = matchesDistance(school)
    return school.type === "feeder" && matchesSearch && matchesStatus && matchesSchoolType && matchesDistanceFilter
  })

  const filteredCompetitors = schools.filter((school: any) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSchoolType = schoolTypeFilter === "all" || (school.school_type && school.school_type.toLowerCase() === schoolTypeFilter.toLowerCase())
    const matchesDistanceFilter = matchesDistance(school)
    return school.type === "competitor" && matchesSearch && matchesStatus && matchesSchoolType && matchesDistanceFilter
  })

  const filteredNonFeeder = schools.filter((school: any) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || school.status.toLowerCase() === statusFilter.toLowerCase()
    const matchesSchoolType = schoolTypeFilter === "all" || (school.school_type && school.school_type.toLowerCase() === schoolTypeFilter.toLowerCase())
    const matchesDistanceFilter = matchesDistance(school)
    return school.type === "non-feeder" && matchesSearch && matchesStatus && matchesSchoolType && matchesDistanceFilter
  })

  const handleLogout = () => {
    router.push("/login")
  }

  const handleAddSchool = async () => {
    if (!schoolFormData.name.trim()) return
    
    try {
      // For competitor schools, store additional fields in description as JSON
      let description = schoolFormData.description
      if (schoolFormData.type === "competitor") {
        const competitorData = {
          buildingOrGrounds: schoolFormData.buildingOrGrounds,
          campusSize: schoolFormData.campusSize,
          facilities: schoolFormData.facilities,
          estimatedTuitionFee: schoolFormData.estimatedTuitionFee,
        }
        description = JSON.stringify(competitorData)
      }

      const { data, error } = await supabase
        .from('schools')
        .insert({
          name: schoolFormData.name,
          type: schoolFormData.type,
          school_type: schoolFormData.schoolType,
          status: schoolFormData.status,
          km_away: schoolFormData.kmAway ? parseFloat(schoolFormData.kmAway) : null,
          grade10_students: schoolFormData.grade10Students ? parseInt(schoolFormData.grade10Students) : null,
          grade12_students: schoolFormData.grade12Students ? parseInt(schoolFormData.grade12Students) : null,
          description: description,
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Add courses if any (only for feeder schools)
      if (schoolFormData.type === "feeder" && schoolFormData.courses.length > 0 && data) {
        const coursesData = schoolFormData.courses.map(course => ({
          school_id: data.id,
          course_name: course.name,
          tuition_fee: course.tuitionFee ? parseFloat(course.tuitionFee) : null,
        }))
        
        const { error: coursesError } = await supabase
          .from('school_courses')
          .insert(coursesData)
          
        if (coursesError) throw coursesError
      }
      
      // Refresh schools data
      await fetchSchools()
      resetForm()
      setIsAddDialogOpen(false)
    } catch (err) {
      console.error('Error adding school:', err)
      setError('Failed to add school. Please try again.')
    }
  }

  const handleUpdateSchoolSubmit = async () => {
    if (!schoolFormData.name.trim() || !editingSchoolId) return
    
    try {
      console.log('Starting school update process...', { editingSchoolId, formData: schoolFormData })
      
      // First, get the current school name before updating
      const { data: currentSchoolData, error: fetchError } = await supabase
        .from('schools')
        .select('name')
        .eq('id', editingSchoolId)
        .single()
      
      if (fetchError) throw fetchError
      
      const oldSchoolName = currentSchoolData.name
      console.log('Current school data:', { oldSchoolName, newSchoolName: schoolFormData.name, editingSchoolId })
      
      // Check if school name actually changed
      const nameChanged = oldSchoolName !== schoolFormData.name
      console.log('Name change check:', { nameChanged, oldName: oldSchoolName, newName: schoolFormData.name })
      
      // For competitor schools, store additional fields in description as JSON
      let description = schoolFormData.description
      if (schoolFormData.type === "competitor") {
        const competitorData = {
          buildingOrGrounds: schoolFormData.buildingOrGrounds,
          campusSize: schoolFormData.campusSize,
          facilities: schoolFormData.facilities,
          estimatedTuitionFee: schoolFormData.estimatedTuitionFee,
        }
        description = JSON.stringify(competitorData)
      }

      // Update the school record
      const { error: updateSchoolError, data: updatedSchoolData } = await supabase
        .from('schools')
        .update({
          name: schoolFormData.name,
          type: schoolFormData.type,
          school_type: schoolFormData.schoolType,
          status: schoolFormData.status,
          km_away: schoolFormData.kmAway ? parseFloat(schoolFormData.kmAway) : null,
          grade10_students: schoolFormData.grade10Students ? parseInt(schoolFormData.grade10Students) : null,
          grade12_students: schoolFormData.grade12Students ? parseInt(schoolFormData.grade12Students) : null,
          description: description,
        })
        .eq('id', editingSchoolId)
        .select() // Add select to get the updated record
      
      console.log('School update result:', { updateSchoolError, updatedSchoolData })
      
      if (updateSchoolError) throw updateSchoolError
      
      console.log('School record updated successfully')
      
      // If the school name changed, update all marketing activities that reference this school
      if (nameChanged) {
        console.log('School name changed, updating marketing activities...')
        // First, let's check what activities currently reference this school
        const { data: activitiesBeforeUpdate, error: fetchActivitiesError } = await supabase
          .from('marketing_activities')
          .select('*')
          .eq('school', oldSchoolName)
        
        console.log('Activities referencing old school name before update:', { activitiesBeforeUpdate, fetchActivitiesError })
        
        if (activitiesBeforeUpdate && activitiesBeforeUpdate.length > 0) {
          console.log(`Found ${activitiesBeforeUpdate.length} activities to update`)
          const { data: updatedActivities, error: updateActivitiesError } = await supabase
            .from('marketing_activities')
            .update({ school: schoolFormData.name })
            .eq('school', oldSchoolName)
            .select() // Add select to get the updated records
          
          console.log('Marketing activities update result:', { updateActivitiesError, updatedActivities })
          
          if (updateActivitiesError) {
            console.warn('Failed to update marketing activities with new school name:', updateActivitiesError)
            // Don't throw here as we still want to complete the school update
          } else {
            console.log('Successfully updated marketing activities:', updatedActivities)
          }
        } else {
          console.log('No activities found referencing the old school name')
        }
      } else {
        console.log('School name unchanged, no need to update marketing activities')
      }
      
      // Handle courses - only for feeder schools
      if (schoolFormData.type === "feeder") {
        // Separate existing courses from new ones
        const existingCourses = schoolFormData.courses.filter(course => course.id <= 1000000000); // Database IDs
        const newCourses = schoolFormData.courses.filter(course => course.id > 1000000000); // Temporary IDs
        
        // Find deleted courses (in original but not in current)
        const currentCourseIds = existingCourses.map(course => course.id);
        const deletedCourses = originalCourses.filter(course => !currentCourseIds.includes(course.id));
        
        // Delete removed courses
        if (deletedCourses.length > 0) {
          const { error: deleteError } = await supabase
            .from('school_courses')
            .delete()
            .in('id', deletedCourses.map(course => course.id))
          
          if (deleteError) throw deleteError
        }
        
        // Update existing courses
        for (const course of existingCourses) {
          const { error: updateError } = await supabase
            .from('school_courses')
            .update({
              course_name: course.name,
              tuition_fee: course.tuitionFee ? parseFloat(course.tuitionFee) : null,
            })
            .eq('id', course.id)
          
          if (updateError) throw updateError
        }
        
        // Add new courses
        if (newCourses.length > 0) {
          const coursesData = newCourses.map(course => ({
            school_id: editingSchoolId,
            course_name: course.name,
            tuition_fee: course.tuitionFee ? parseFloat(course.tuitionFee) : null,
          }))
          
          const { error: insertError } = await supabase
            .from('school_courses')
            .insert(coursesData)
            
          if (insertError) throw insertError
        }
      }
      
      // Refresh schools data
      await fetchSchools()
      
      // Also refresh marketing activities data across tabs
      if (typeof window !== 'undefined') {
        const eventDetail = { 
          oldName: oldSchoolName, 
          newName: schoolFormData.name 
        }
        console.log('Dispatching schoolUpdated event:', eventDetail)
        window.dispatchEvent(new CustomEvent('schoolUpdated', { 
          detail: eventDetail
        }))
      }
      
      resetForm()
      setIsEditDialogOpen(false)
      setEditingSchoolId(null)
      setOriginalCourses([])
    } catch (err) {
      console.error('Error updating school:', err)
      setError('Failed to update school. Please try again.')
    }
  }

  const handleEditSchool = async (school: any) => {
    setEditingSchoolId(school.id)
    
    // Use the courses that are already attached to the school object
    const formattedCourses = school.courses?.map((course: any) => ({
      id: course.id, // Database ID for existing courses
      name: course.course_name,
      tuitionFee: course.tuition_fee ? course.tuition_fee.toString() : ""
    })) || [];
    
    // Parse competitor data from description if it's a competitor school
    let description = school.description || ""
    let buildingOrGrounds: "" | "B" | "G" = ""
    let campusSize: "" | "L" | "E" | "S" = ""
    let facilities: "" | "B" | "E" | "P" = ""
    let estimatedTuitionFee = ""
    
    if (school.type === "competitor" && school.description) {
      try {
        const competitorData = JSON.parse(school.description)
        buildingOrGrounds = competitorData.buildingOrGrounds || ""
        campusSize = competitorData.campusSize || ""
        facilities = competitorData.facilities || ""
        estimatedTuitionFee = competitorData.estimatedTuitionFee || ""
        description = "" // Clear description for competitor schools
      } catch (e) {
        // If parsing fails, treat as regular description
        console.error("Error parsing competitor data:", e)
      }
    }
    
    setSchoolFormData({
      name: school.name || "",
      status: school.status || "Active",
      type: school.type || "feeder",
      schoolType: school.school_type || "public",
      kmAway: school.km_away ? school.km_away.toString() : "",
      grade10Students: school.grade10_students ? school.grade10_students.toString() : "",
      grade12Students: school.grade12_students ? school.grade12_students.toString() : "",
      description: description,
      courses: formattedCourses,
      buildingOrGrounds: buildingOrGrounds,
      campusSize: campusSize,
      facilities: facilities,
      estimatedTuitionFee: estimatedTuitionFee,
    });
    
    // Store original courses for tracking deletions
    setOriginalCourses(school.courses?.map((course: any) => ({ id: course.id })) || []);
    
    setIsEditDialogOpen(true);
  }

  const handleDeleteSchool = async (id: number) => {
    try {
      console.log('Starting school deletion process...', { id })
      
      // First, get the school name before deleting
      const { data: schoolData, error: fetchError } = await supabase
        .from('schools')
        .select('name')
        .eq('id', id)
        .single()
      
      if (fetchError) throw fetchError
      
      const schoolName = schoolData.name
      console.log('Deleting school:', { schoolName, id })
      
      // Delete the school record
      const { error: deleteSchoolError } = await supabase
        .from('schools')
        .delete()
        .eq('id', id)
      
      if (deleteSchoolError) throw deleteSchoolError
      
      console.log('School record deleted successfully')
      
      // Update all marketing activities that reference this school to remove the school reference
      // First, let's check what activities currently reference this school
      const { data: activitiesBeforeUpdate, error: fetchActivitiesError } = await supabase
        .from('marketing_activities')
        .select('*')
        .eq('school', schoolName)
      
      console.log('Activities referencing school before deletion:', { activitiesBeforeUpdate, fetchActivitiesError })
      
      if (activitiesBeforeUpdate && activitiesBeforeUpdate.length > 0) {
        console.log(`Found ${activitiesBeforeUpdate.length} activities to update during deletion`)
        const { data: updatedActivities, error: updateActivitiesError } = await supabase
          .from('marketing_activities')
          .update({ school: null })
          .eq('school', schoolName)
          .select() // Add select to get the updated records
        
        if (updateActivitiesError) {
          console.warn('Failed to update marketing activities after school deletion:', updateActivitiesError)
          // Don't throw here as we still want to complete the school deletion
        } else {
          console.log('Successfully updated marketing activities after deletion:', updatedActivities)
        }
      } else {
        console.log('No activities found referencing the school being deleted')
      }

      // Refresh schools data
      await fetchSchools()
      
      // Also refresh marketing activities data across tabs
      if (typeof window !== 'undefined') {
        const eventDetail = { 
          oldName: schoolName, 
          newName: null 
        }
        console.log('Dispatching schoolUpdated event after deletion:', eventDetail)
        window.dispatchEvent(new CustomEvent('schoolUpdated', { 
          detail: eventDetail
        }))
      }
    } catch (err) {
      console.error('Error deleting school:', err)
      setError('Failed to delete school. Please try again.')
    }
  }

  const fetchSchools = useCallback(async () => {
    try {
      setLoading(true)
      // Fetch schools with their courses
      const { data: schoolsData, error: schoolsError } = await supabase
        .from('schools')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (schoolsError) throw schoolsError
      
      // Fetch all courses for all schools
      const { data: coursesData, error: coursesError } = await supabase
        .from('school_courses')
        .select('*')
      
      if (coursesError) throw coursesError
      
      // Combine schools with their courses
      const schoolsWithCourses = schoolsData?.map(school => {
        const schoolCourses = coursesData?.filter(course => course.school_id === school.id) || []
        return {
          ...school,
          courses: schoolCourses
        }
      }) || []
      
      setSchools(schoolsWithCourses)
      setError(null)
    } catch (err) {
      console.error('Error fetching schools:', err)
      setError('Failed to load schools. Please try again.')
      setSchools([])
    } finally {
      setLoading(false)
    }
  }, [])

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
    fetchSchools();
  }, [fetchSchools, router])

  const resetForm = () => {
    setSchoolFormData({
      name: "",
      status: "Active",
      type: "feeder" as "feeder" | "competitor" | "non-feeder",
      schoolType: "public" as "public" | "private",
      kmAway: "",
      grade10Students: "",
      grade12Students: "",
      description: "",
      courses: [] as Array<{ id: number; name: string; tuitionFee: string }>,
      buildingOrGrounds: "" as "" | "B" | "G",
      campusSize: "" as "" | "L" | "E" | "S",
      facilities: "" as "" | "B" | "E" | "P",
      estimatedTuitionFee: "",
    })
    setSchoolFormData({ 
      name: "", 
      status: "Active", 
      type: "feeder",
      kmAway: "",
      schoolType: "public",
      grade10Students: "",
      grade12Students: "",
      description: "",
      courses: [],
    })
    setEditingSchoolId(null)
    setOriginalCourses([])
  }

  const addCourse = () => {
    const newCourse = {
      id: Date.now(), // Temporary ID for new courses
      name: "",
      tuitionFee: "",
    }
    setSchoolFormData(prev => ({
      ...prev,
      courses: [...prev.courses, newCourse],
    }))
  }

  const removeCourse = async (id: number) => {
    // Check if this is a new course (temporary ID) or existing course (database ID)
    if (id > 1000000000) { // Assume database IDs won't be this large
      // It's a new course, just remove from state
      setSchoolFormData(prev => ({
        ...prev,
        courses: prev.courses.filter(course => course.id !== id),
      }))
    } else {
      // It's an existing course, delete from database and update originalCourses
      try {
        const { error } = await supabase
          .from('school_courses')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        // Also remove from state
        setSchoolFormData(prev => ({
          ...prev,
          courses: prev.courses.filter(course => course.id !== id),
        }))
        
        // Update originalCourses to reflect the deletion
        setOriginalCourses(prev => prev.filter(course => course.id !== id))
      } catch (err) {
        console.error('Error deleting course:', err)
        setError('Failed to delete course. Please try again.')
      }
    }
  }

  const updateCourse = (id: number, field: "name" | "tuitionFee", value: string) => {
    setSchoolFormData(prev => ({
      ...prev,
      courses: prev.courses.map(course =>
        course.id === id ? { ...course, [field]: value } : course
      ),
    }))
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} userPermissions={userPermissions} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h1 className="text-3xl font-serif font-bold text-slate-700 dark:text-slate-200 mb-2">Schools Management</h1>
                <p className="text-slate-600 dark:text-slate-400">Manage schools, programs, and academic departments</p>
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
                    fetchSchools()
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

          {/* Tabs-based School Tables */}
          <Card className="shadow-lg border-border">
            <CardContent className="p-6">
              {/* Search and filters inside table */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search schools..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="School Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Distance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Distance</SelectItem>
                      <SelectItem value="near">Near (0-5 km)</SelectItem>
                      <SelectItem value="medium">Medium (5-15 km)</SelectItem>
                      <SelectItem value="far">Far (15+ km)</SelectItem>
                      <SelectItem value="no-data">No Distance Data</SelectItem>
                    </SelectContent>
                  </Select>
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
                    onClick={() => setIsAddDialogOpen(true)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add School
                  </Button>
                </div>
              </div>
              <Tabs defaultValue="feeder" className="w-full">
                <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                  <TabsTrigger 
                    value="feeder" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Feeder Schools
                  </TabsTrigger>
                  <TabsTrigger 
                    value="competitors" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Competitors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="non-feeder" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Non-Feeder Schools
                  </TabsTrigger>
                </TabsList>

                {/* Feeder Schools Tab */}
                <TabsContent value="feeder" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">School Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Courses Offered</TableHead>
                          <TableHead className="font-semibold text-foreground">G10 Students</TableHead>
                          <TableHead className="font-semibold text-foreground">G12 Students</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                              Loading schools...
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-red-500 py-12">
                              {error}
                            </TableCell>
                          </TableRow>
                        ) : filteredPartners.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <School className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No feeder schools found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredPartners.map((school: any) => (
                            <TableRow 
                              key={school.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{school.name}</TableCell>
                              <TableCell className="py-4">
                                {school.courses && school.courses.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {school.courses.slice(0, 3).map((course: any, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {course.course_name}
                                      </Badge>
                                    ))}
                                    {school.courses.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{school.courses.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No courses listed</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4">{school.grade10_students || 'N/A'}</TableCell>
                              <TableCell className="py-4">{school.grade12_students || 'N/A'}</TableCell>
                              <TableCell className="py-4">
                                <Badge 
                                  className={
                                    school.status === "Active" 
                                      ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500" 
                                      : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                  }
                                >
                                  {school.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditSchool(school)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleDeleteSchool(school.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Competitors Tab */}
                <TabsContent value="competitors" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">School Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Courses Offered</TableHead>
                          <TableHead className="font-semibold text-foreground">Distance (km)</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                              Loading schools...
                            </TableCell>
                          </TableRow>
                        ) : error ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-red-500 py-12">
                              {error}
                            </TableCell>
                          </TableRow>
                        ) : filteredCompetitors.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <School className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No competitor schools found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCompetitors.map((school: any) => (
                            <TableRow 
                              key={school.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{school.name}</TableCell>
                              <TableCell className="py-4">
                                {school.courses && school.courses.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {school.courses.slice(0, 3).map((course: any, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {course.course_name}
                                      </Badge>
                                    ))}
                                    {school.courses.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{school.courses.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No courses listed</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4">{school.km_away ? `${school.km_away} km` : 'N/A'}</TableCell>
                              <TableCell className="py-4">
                                <Badge 
                                  className={
                                    school.status === "Active" 
                                      ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500" 
                                      : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                  }
                                >
                                  {school.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditSchool(school)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleDeleteSchool(school.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>

                {/* Non-Feeder Schools Tab */}
                <TabsContent value="non-feeder" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">School Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Distance (km)</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredNonFeeder.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <School className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No non-feeder schools found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredNonFeeder.map((school) => (
                            <TableRow 
                              key={school.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{school.name}</TableCell>
                              <TableCell className="py-4">
                                {school.courses && school.courses.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {school.courses.slice(0, 3).map((course: any, index: number) => (
                                      <Badge key={index} variant="secondary" className="text-xs">
                                        {course.course_name}
                                      </Badge>
                                    ))}
                                    {school.courses.length > 3 && (
                                      <Badge variant="secondary" className="text-xs">
                                        +{school.courses.length - 3} more
                                      </Badge>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">No courses listed</span>
                                )}
                              </TableCell>
                              <TableCell className="py-4">{school.km_away ? `${school.km_away} km` : 'N/A'}</TableCell>
                              <TableCell className="py-4">
                                <Badge 
                                  className={
                                    school.status === "Active" 
                                      ? "bg-teal-500 hover:bg-teal-600 text-white border-teal-500" 
                                      : "bg-amber-500 hover:bg-amber-600 text-white border-amber-500"
                                  }
                                >
                                  {school.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditSchool(school)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleDeleteSchool(school.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

      {/* Add School Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open)
        if (!open) {
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New School</DialogTitle>
            <DialogDescription>
              Create a new school entry in the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">School Type</Label>
              <RadioGroup
                value={schoolFormData.type}
                onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, type: value as "feeder" | "competitor" | "non-feeder" }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="feeder" id="feeder" className="size-5 border border-gray-400" />
                  <Label htmlFor="feeder" className="font-medium cursor-pointer">Feeder School</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="non-feeder" id="non-feeder" className="size-5 border border-gray-400" />
                  <Label htmlFor="non-feeder" className="font-medium cursor-pointer">Non-Feeder</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="competitor" id="competitor" className="size-5 border border-gray-400" />
                  <Label htmlFor="competitor" className="font-medium cursor-pointer">School Competitor</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school-name">School Name</Label>
              <Input
                id="school-name"
                placeholder={schoolFormData.type === "feeder" || schoolFormData.type === "non-feeder" 
                  ? "(e.g., San Roque Catholic School)" 
                  : "(e.g., San Beda College Alabang)"}
                value={schoolFormData.name}
                onChange={(e) => setSchoolFormData(prev => ({ ...prev, name: e.target.value }))}
                className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="km-away">Enter km away from school</Label>
              <Input
                id="km-away"
                type="number"
                placeholder="Enter distance in kilometers"
                value={schoolFormData.kmAway}
                onChange={(e) => setSchoolFormData(prev => ({ ...prev, kmAway: e.target.value }))}
                className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
              />
            </div>

            {(schoolFormData.type === "competitor" || schoolFormData.type === "feeder" || schoolFormData.type === "non-feeder") && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Type of School</Label>
                <RadioGroup
                  value={schoolFormData.schoolType}
                  onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, schoolType: value as "public" | "private" }))}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="public" id="public" className="size-5 border border-gray-400" />
                    <Label htmlFor="public" className="font-medium cursor-pointer">Public</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="private" id="private" className="size-5 border border-gray-400" />
                    <Label htmlFor="private" className="font-medium cursor-pointer">Private</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {schoolFormData.type === "feeder" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="grade10-students">Total Students for Grade 10</Label>
                  <Input
                    id="grade10-students"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={schoolFormData.grade10Students}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow non-negative numbers
                      if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSchoolFormData(prev => ({ ...prev, grade10Students: value }))
                      }
                    }}
                    className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade12-students">Total Students for Grade 12</Label>
                  <Input
                    id="grade12-students"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={schoolFormData.grade12Students}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow non-negative numbers
                      if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSchoolFormData(prev => ({ ...prev, grade12Students: value }))
                      }
                    }}
                    className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                  />
                </div>
              </>
            )}

            {schoolFormData.type === "competitor" && (
              <>
                <div className="space-y-2">
                  <Label className="text-base font-medium">In a building (B) or has campus grounds (G)</Label>
                  <RadioGroup
                    value={schoolFormData.buildingOrGrounds}
                    onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, buildingOrGrounds: value as "B" | "G" }))}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="B" id="building" className="size-5 border border-gray-400" />
                      <Label htmlFor="building" className="font-medium cursor-pointer">Building (B)</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="G" id="grounds" className="size-5 border border-gray-400" />
                      <Label htmlFor="grounds" className="font-medium cursor-pointer">Campus Grounds (G)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Is your competitor's campus: Larger (L), Equal (E), or Smaller (S) than your campus?</Label>
                  <RadioGroup
                    value={schoolFormData.campusSize}
                    onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, campusSize: value as "L" | "E" | "S" }))}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="L" id="larger" className="size-5 border border-gray-400" />
                      <Label htmlFor="larger" className="font-medium cursor-pointer">Larger (L)</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="E" id="equal-size" className="size-5 border border-gray-400" />
                      <Label htmlFor="equal-size" className="font-medium cursor-pointer">Equal (E)</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="S" id="smaller" className="size-5 border border-gray-400" />
                      <Label htmlFor="smaller" className="font-medium cursor-pointer">Smaller (S)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">Are your competitor's facilities: Better (B), Equal (E), or Poorer (P) compared to your campus?</Label>
                  <RadioGroup
                    value={schoolFormData.facilities}
                    onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, facilities: value as "B" | "E" | "P" }))}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="B" id="better" className="size-5 border border-gray-400" />
                      <Label htmlFor="better" className="font-medium cursor-pointer">Better (B)</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="E" id="equal-facilities" className="size-5 border border-gray-400" />
                      <Label htmlFor="equal-facilities" className="font-medium cursor-pointer">Equal (E)</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="P" id="poorer" className="size-5 border border-gray-400" />
                      <Label htmlFor="poorer" className="font-medium cursor-pointer">Poorer (P)</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated-tuition-fee">Estimated Total Tuition Fee per Term for College or per School year for SHS (excluding voucher Amount)</Label>
                  <Input
                    id="estimated-tuition-fee"
                    type="number"
                    placeholder="Enter estimated tuition fee"
                    value={schoolFormData.estimatedTuitionFee}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSchoolFormData(prev => ({ ...prev, estimatedTuitionFee: value }))
                      }
                    }}
                    className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                  />
                </div>
              </>
            )}

            {schoolFormData.type !== "competitor" && (
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter school description"
                  value={schoolFormData.description}
                  onChange={(e) => setSchoolFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400 min-h-24"
                  rows={4}
                />
              </div>
            )}

            {schoolFormData.type === "feeder" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Courses Offered</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCourse}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Course
                  </Button>
                </div>
                
                {schoolFormData.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No courses added yet. Click "Add Course" to add one.</p>
                ) : (
                  <div className="space-y-3">
                    {schoolFormData.courses.map((course) => (
                        <div key={course.id} className="flex gap-2 items-start p-3 border border-gray-300 rounded-md">
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder="Course name"
                              value={course.name}
                              onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                              className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                            />
                            <Input
                              type="number"
                              placeholder="Estimated tuition fee"
                              value={course.tuitionFee}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                                  updateCourse(course.id, "tuitionFee", value)
                                }
                              }}
                              className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeCourse(course.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="school-status">Status</Label>
              <Select
                value={schoolFormData.status}
                onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="school-status" className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddSchool}
              disabled={!schoolFormData.name.trim()}
            >
              Add School
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit School Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
        setIsEditDialogOpen(open)
        if (!open) {
          resetForm()
          setEditingSchoolId(null)
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit School</DialogTitle>
            <DialogDescription>
              Update school information
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-base font-medium">School Type</Label>
              <RadioGroup
                value={schoolFormData.type}
                onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, type: value as "feeder" | "competitor" | "non-feeder" }))}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="feeder" id="feeder-edit" className="size-5 border border-gray-400" />
                  <Label htmlFor="feeder-edit" className="font-medium cursor-pointer">Feeder School</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="non-feeder" id="non-feeder-edit" className="size-5 border border-gray-400" />
                  <Label htmlFor="non-feeder-edit" className="font-medium cursor-pointer">Non-Feeder</Label>
                </div>
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="competitor" id="competitor-edit" className="size-5 border border-gray-400" />
                  <Label htmlFor="competitor-edit" className="font-medium cursor-pointer">School Competitor</Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school-name-edit">School Name</Label>
              <Input
                id="school-name-edit"
                placeholder={schoolFormData.type === "feeder" || schoolFormData.type === "non-feeder" 
                  ? "(e.g., San Roque Catholic School)" 
                  : "(e.g., San Beda College Alabang)"}
                value={schoolFormData.name}
                onChange={(e) => setSchoolFormData(prev => ({ ...prev, name: e.target.value }))}
                className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="km-away-edit">Enter km away from school</Label>
              <Input
                id="km-away-edit"
                type="number"
                placeholder="Enter distance in kilometers"
                value={schoolFormData.kmAway}
                onChange={(e) => setSchoolFormData(prev => ({ ...prev, kmAway: e.target.value }))}
                className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
              />
            </div>

            {(schoolFormData.type === "competitor" || schoolFormData.type === "feeder" || schoolFormData.type === "non-feeder") && (
              <div className="space-y-2">
                <Label className="text-base font-medium">Type of School</Label>
                <RadioGroup
                  value={schoolFormData.schoolType}
                  onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, schoolType: value as "public" | "private" }))}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="public" id="public-edit" className="size-5 border border-gray-400" />
                    <Label htmlFor="public-edit" className="font-medium cursor-pointer">Public</Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="private" id="private-edit" className="size-5 border border-gray-400" />
                    <Label htmlFor="private-edit" className="font-medium cursor-pointer">Private</Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            {schoolFormData.type === "feeder" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="grade10-students-edit">Total Students for Grade 10</Label>
                  <Input
                    id="grade10-students-edit"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={schoolFormData.grade10Students}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow non-negative numbers
                      if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSchoolFormData(prev => ({ ...prev, grade10Students: value }))
                      }
                    }}
                    className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grade12-students-edit">Total Students for Grade 12</Label>
                  <Input
                    id="grade12-students-edit"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={schoolFormData.grade12Students}
                    onChange={(e) => {
                      const value = e.target.value
                      // Only allow non-negative numbers
                      if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                        setSchoolFormData(prev => ({ ...prev, grade12Students: value }))
                      }
                    }}
                    className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                  />
                </div>
              </>
            )}

            {schoolFormData.type !== "competitor" && (
              <div className="space-y-2">
                <Label htmlFor="description-edit">Description</Label>
                <Textarea
                  id="description-edit"
                  placeholder="Enter school description"
                  value={schoolFormData.description}
                  onChange={(e) => setSchoolFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400 min-h-24"
                  rows={4}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="school-status-edit">Status</Label>
              <Select
                value={schoolFormData.status}
                onValueChange={(value) => setSchoolFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="school-status-edit" className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {schoolFormData.type === "feeder" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Courses Offered</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addCourse}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Course
                  </Button>
                </div>
                
                {schoolFormData.courses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No courses added yet.</p>
                ) : (
                  <div className="space-y-3">
                    {schoolFormData.courses.map((course) => (
                    <div key={course.id} className="flex gap-2 items-start p-3 border border-gray-300 rounded-md">
                      <div className="flex-1 space-y-2">
                        <Input
                          placeholder="Course name"
                          value={course.name}
                          onChange={(e) => updateCourse(course.id, "name", e.target.value)}
                          className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                        />
                        <Input
                          type="number"
                          placeholder="Estimated tuition fee"
                          value={course.tuitionFee}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
                              updateCourse(course.id, "tuitionFee", value)
                            }
                          }}
                          className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCourse(course.id)}
                        className="h-8 w-8 p-0 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false)
                resetForm()
                setEditingSchoolId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSchoolSubmit}
              disabled={!schoolFormData.name.trim()}
            >
              Update School
            </Button>
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
              <DialogTitle>Schools Table</DialogTitle>
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
          {/* Search and Filters in fullscreen */}
          <div className="flex items-center justify-between mb-6 mt-4 gap-4 flex-wrap">
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search schools..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={schoolTypeFilter} onValueChange={setSchoolTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="School Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
              <Select value={distanceFilter} onValueChange={setDistanceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Distance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Distance</SelectItem>
                  <SelectItem value="near">Near (0-5 km)</SelectItem>
                  <SelectItem value="medium">Medium (5-15 km)</SelectItem>
                  <SelectItem value="far">Far (15+ km)</SelectItem>
                  <SelectItem value="no-data">No Distance Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add School
            </Button>
          </div>
          <div className="overflow-auto flex-1">
            <Tabs defaultValue="feeder" className="w-full">
              <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                <TabsTrigger value="feeder" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Feeder Schools
                </TabsTrigger>
                <TabsTrigger value="competitor" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Competitors
                </TabsTrigger>
                <TabsTrigger value="non-feeder" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Non-Feeder Schools
                </TabsTrigger>
              </TabsList>
              <TabsContent value="feeder" className="mt-0">
                <div className="rounded-lg border border-border bg-background">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="font-semibold text-foreground">School Name</TableHead>
                        <TableHead className="font-semibold text-foreground">Courses Offered</TableHead>
                        <TableHead className="font-semibold text-foreground">G10 Students</TableHead>
                        <TableHead className="font-semibold text-foreground">G12 Students</TableHead>
                        <TableHead className="font-semibold text-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                            Loading schools...
                          </TableCell>
                        </TableRow>
                      ) : filteredPartners.filter(s => s.type === "feeder").length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-12">
                            No feeder schools found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPartners.filter(s => s.type === "feeder").map((school) => (
                          <TableRow key={school.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium py-4">{school.name}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex flex-wrap gap-1">
                                {school.courses_offered?.map((course: string, idx: number) => (
                                  <Badge key={idx} variant="secondary" className="text-xs">
                                    {course}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="py-4">{school.g10_students || 0}</TableCell>
                            <TableCell className="py-4">{school.g12_students || 0}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditSchool(school)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteSchool(school.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
