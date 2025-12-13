"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminSidebar } from "@/components/admin-sidebar"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { KpiCard } from "@/components/kpi"
import { Search, Eye, MessageSquare, Phone, Mail, Edit, CheckCircle, AlertCircle, ArrowRight, Plus, ChevronDown, GraduationCap, Users, School, Trash2, FileText, Maximize2, Minimize2, CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase-client"
import { EnrollmentForm } from "@/components/enrollment-form"
import { toast } from "sonner"
import {
  StudentFormData,
  createEmptyStudentFormData,
  mapProgramCodesToLabel,
  mapProgramStringToCodes,
} from "@/lib/enrollment-data"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const INITIAL_FORM_DATA = {
  inquiryType: "",
  studentType: "",
  firstName: "",
  lastName: "",
  presentSchool: "",
  email: "",
  phone: "",
  programs: [] as string[],
  howDidYouFindOut: [] as string[],
  referralSource: [] as string[],
  eventsDescription: "",
  othersSpecify: "",
}

const STATUS_OPTIONS = ["For follow up", "Reserved (Registrants with 1000 payment)", "Enrolled (Full down payment)", "Enrolled to other STI", "Enrolled to other school", "Undecided"]

type InquiryRecord = {
  id: number
  name: string
  email: string
  phone: string
  program: string
  status: string
  date: string
  studentType: string
  notes: string
  dateAdded: string
  adminName: string
  inquiryType?: string
}

const normalizeStudentType = (value?: string | null) => {
  if (!value) return "College"
  const normalized = value.toLowerCase()
  if (normalized.includes("senior")) return "Senior High"
  if (normalized.includes("high")) return "Senior High"
  return "College"
}

// Helper function to parse program string, handling commas within program names
const parseProgramString = (programString: string): string[] => {
  if (!programString || programString === "Not specified") {
    return ["Not specified"]
  }
  
  // Known program names that contain commas
  const programNamesWithCommas = [
    "Accountancy, Business, and Management (ABM)",
    "Humanities and Social Sciences (HUMMS)"
  ]
  
  const programs: string[] = []
  let remainingString = programString
  
  // First, extract program names that contain commas
  for (const specialProgram of programNamesWithCommas) {
    if (remainingString.includes(specialProgram)) {
      programs.push(specialProgram)
      // Remove the found program and clean up surrounding commas
      remainingString = remainingString.replace(specialProgram, "").replace(/^,\s*|,\s*$/g, "").trim()
    }
  }
  
  // Then split the remaining string by commas
  if (remainingString) {
    const remainingPrograms = remainingString.split(/, |,/).filter(p => p.trim())
    programs.push(...remainingPrograms)
  }
  
  return programs.length > 0 ? programs : ["Not specified"]
}

const mapRowToInquiry = (row: Record<string, any>): InquiryRecord => {
  console.log("Mapping row to inquiry:", row)
  const formatDate = (dateValue: string | null | undefined) => {
    if (!dateValue) return ""
    const date = new Date(dateValue)
    return date.toISOString().split("T")[0]
  }
  
  const result = {
    id: row.id,
    name: row.name ?? "Unnamed",
    email: row.email ?? "",
    phone: row.phone ?? "",
    program: row.program ?? "Not specified",
    status: row.status ?? "For follow up",
    date: row.date ?? row.created_at?.split("T")?.[0] ?? "",
    studentType: normalizeStudentType(row.student_type),
    notes: row.notes ?? "",
    dateAdded: formatDate(row.date_added ?? row.created_at),
    adminName: row.admin_name ?? "Unknown Admin",
    inquiryType: row.inquiry_type ?? "",
  }
  console.log("Mapped inquiry result:", result)
  return result
}


export default function InquiriesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [studentTypeFilter, setStudentTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState("all")
  const [editingInquiryId, setEditingInquiryId] = useState<number | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [updateMessage, setUpdateMessage] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isInquiryDialogOpen, setIsInquiryDialogOpen] = useState(false)
  const [viewingInquiry, setViewingInquiry] = useState<InquiryRecord | null>(null)
  const [viewingInquiryFull, setViewingInquiryFull] = useState<Record<string, any> | null>(null)
  const [inquiryFormData, setInquiryFormData] = useState(INITIAL_FORM_DATA)
  const [inquiries, setInquiries] = useState<InquiryRecord[]>([])
  const [isLoadingInquiries, setIsLoadingInquiries] = useState(true)
  const [inquiryError, setInquiryError] = useState("")
  const [isCreatingInquiry, setIsCreatingInquiry] = useState(false)
  const [pendingEnrollmentInquiry, setPendingEnrollmentInquiry] = useState<InquiryRecord | null>(null)
  const [pendingStatus, setPendingStatus] = useState<string | null>(null)
  const [isEnrollConfirmOpen, setIsEnrollConfirmOpen] = useState(false)
  const [isEnrollmentDialogOpen, setIsEnrollmentDialogOpen] = useState(false)
  const [enrollmentFormData, setEnrollmentFormData] = useState<StudentFormData>(createEmptyStudentFormData)
  const [isSavingEnrollment, setIsSavingEnrollment] = useState(false)
  const [deletingInquiryId, setDeletingInquiryId] = useState<number | null>(null)
  const [isTableFullscreen, setIsTableFullscreen] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [marketingActivities, setMarketingActivities] = useState<Array<{ id: number; title: string; school: string; date: string }>>([])
  const [allMarketingActivities, setAllMarketingActivities] = useState<Array<{ id: number; title: string; school: string; date: string }>>([])
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [eventsPopoverOpen, setEventsPopoverOpen] = useState(false)
  const [schools, setSchools] = useState<Array<{ id: number; name: string; type: string }>>([])
  const [schoolPopoverOpen, setSchoolPopoverOpen] = useState(false)
  const [inquiryDate, setInquiryDate] = useState<string>(new Date().toISOString().split("T")[0])
  // Dynamic dates: start date is January 1 of last year, end date is December 31 of this year (for year-over-year comparison)
  const currentYear = new Date().getFullYear()
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(currentYear - 1, 0, 1)) // January 1 of last year
  const [endDate, setEndDate] = useState<Date | undefined>(new Date(currentYear, 11, 31)) // December 31 of this year

  const fetchInquiries = useCallback(async () => {
    setIsLoadingInquiries(true)
    setInquiryError("")
    console.log("Fetching inquiries from Supabase...")
    const { data, error } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching inquiries:", error)
      setInquiryError("Unable to load inquiries. Please check your Supabase connection.")
      setInquiries([])
    } else if (data) {
      console.log("Successfully fetched inquiries:", data)
      const mappedInquiries = data.map(mapRowToInquiry)
      console.log("Mapped inquiries:", mappedInquiries)
      setInquiries(mappedInquiries)
      console.log("Raw inquiries data:", data)
    }
    setIsLoadingInquiries(false)
  }, [])

  useEffect(() => {
    fetchInquiries()
  }, [fetchInquiries])

  useEffect(() => {
    const fetchUserPermissions = async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        console.error('Error fetching user:', authError)
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('permissions')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        setUserPermissions([])
      } else {
        try {
          const permissions = typeof profile.permissions === 'string'
            ? JSON.parse(profile.permissions)
            : profile.permissions
          setUserPermissions(permissions || [])
        } catch (parseError) {
          console.error('Error parsing permissions:', parseError)
          setUserPermissions([])
        }
      }
    }

    fetchUserPermissions()
  }, [router])

  // Fetch all schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const { data, error } = await supabase
          .from('schools')
          .select('id, name, type')
          .eq('status', 'Active')
          .order('name', { ascending: true })

        if (error) {
          console.error('Error fetching schools:', error)
          setSchools([])
        } else {
          setSchools(data || [])
        }
      } catch (error) {
        console.error('Error fetching schools:', error)
        setSchools([])
      }
    }

    fetchSchools()
  }, [])

  // Fetch all marketing activities
  useEffect(() => {
    const fetchMarketingActivities = async () => {
      setLoadingActivities(true)
      try {
        const response = await fetch('/api/marketing-activities')
        const data = await response.json()
        if (response.ok) {
          const activities = data.map((activity: any) => ({
            id: activity.id,
            title: activity.title,
            school: activity.school || '',
            date: activity.date || ''
          }))
          setAllMarketingActivities(activities)
        } else {
          console.error('Failed to fetch marketing activities:', data.error)
          setAllMarketingActivities([])
        }
      } catch (error) {
        console.error('Error fetching marketing activities:', error)
        setAllMarketingActivities([])
      } finally {
        setLoadingActivities(false)
      }
    }

    fetchMarketingActivities()
  }, [])

  // Filter marketing activities based on present school and inquiry date
  useEffect(() => {
    if (!inquiryFormData.presentSchool) {
      setMarketingActivities([])
      return
    }

    // Find the selected school
    const selectedSchool = schools.find(s => s.name === inquiryFormData.presentSchool)
    
    console.log('Filtering marketing activities:', {
      presentSchool: inquiryFormData.presentSchool,
      inquiryDate,
      selectedSchool,
      allMarketingActivitiesCount: allMarketingActivities.length,
      allMarketingActivities: allMarketingActivities.map(a => ({ 
        id: a.id, 
        title: a.title, 
        school: a.school, 
        date: a.date 
      })),
      schoolsList: schools.map(s => ({ name: s.name, type: s.type }))
    })
    
    // If school is a feeder school, filter activities by school and show only events that happened before or on the inquiry date
    if (selectedSchool && selectedSchool.type === 'feeder') {
      const filtered = allMarketingActivities.filter((activity: any) => {
        const activitySchool = (activity.school || '').trim()
        const selectedSchoolName = (selectedSchool.name || '').trim()
        const activityDate = activity.date || ''
        
        // Match school name (case-insensitive, trimmed, and handle partial matches)
        // First try exact match
        let schoolMatch = activitySchool.toLowerCase() === selectedSchoolName.toLowerCase()
        
        // If no exact match, try partial match (activity school contains selected school or vice versa)
        if (!schoolMatch && activitySchool && selectedSchoolName) {
          const activitySchoolLower = activitySchool.toLowerCase()
          const selectedSchoolLower = selectedSchoolName.toLowerCase()
          schoolMatch = activitySchoolLower.includes(selectedSchoolLower) || selectedSchoolLower.includes(activitySchoolLower)
        }
        
        // Also show activities with no school assigned (empty or null school)
        if (!schoolMatch && (!activitySchool || activitySchool === '')) {
          schoolMatch = true
          console.log('Activity has no school assigned, showing for all feeder schools:', {
            activityTitle: activity.title,
            activityDate: activity.date
          })
        }
        
        if (!schoolMatch) {
          console.log('School name mismatch (filtered out):', {
            activityTitle: activity.title,
            activitySchool,
            selectedSchoolName,
            activityDate: activity.date
          })
          return false
        }
        
        console.log('School name matched:', {
          activityTitle: activity.title,
          activitySchool: activitySchool || '(no school)',
          selectedSchoolName
        })
        
        // If inquiry date is set, only show activities that happened on or before the inquiry date
        if (inquiryDate) {
          const normalizedInquiryDate = inquiryDate.split('T')[0]
          const normalizedActivityDate = activityDate.split('T')[0]
          
          // Compare dates - activity date should be <= inquiry date
          const inquiryDateObj = new Date(normalizedInquiryDate)
          const activityDateObj = new Date(normalizedActivityDate)
          
          // Set time to midnight for accurate date comparison
          inquiryDateObj.setHours(0, 0, 0, 0)
          activityDateObj.setHours(0, 0, 0, 0)
          
          const isBeforeOrOnInquiryDate = activityDateObj <= inquiryDateObj
          
          if (isBeforeOrOnInquiryDate) {
            console.log('Found matching activity (before/on inquiry date):', {
              activityTitle: activity.title,
              activitySchool: activitySchool,
              selectedSchoolName: selectedSchoolName,
              activityDate: normalizedActivityDate,
              inquiryDate: normalizedInquiryDate
            })
          } else {
            console.log('Activity is after inquiry date (filtered out):', {
              activityTitle: activity.title,
              activityDate: normalizedActivityDate,
              inquiryDate: normalizedInquiryDate
            })
          }
          
          return isBeforeOrOnInquiryDate
        }
        
        // If no inquiry date set, show all activities for this school
        console.log('Found matching activity (no inquiry date filter):', {
          activityTitle: activity.title,
          activitySchool: activitySchool,
          selectedSchoolName: selectedSchoolName,
          activityDate: activity.date
        })
        
        return true
      })
      
      console.log('Filtered marketing activities result:', {
        filteredCount: filtered.length,
        activities: filtered.map(a => ({ 
          id: a.id, 
          title: a.title, 
          school: a.school, 
          date: a.date 
        })),
        presentSchool: inquiryFormData.presentSchool,
        inquiryDate
      })
      
      setMarketingActivities(filtered)
    } else {
      // For non-feeder schools, show no activities
      if (selectedSchool) {
        console.log('School is not a feeder school:', {
          schoolName: selectedSchool.name,
          schoolType: selectedSchool.type
        })
      } else {
        console.log('School not found in schools list:', {
          searchedName: inquiryFormData.presentSchool,
          availableSchools: schools.map(s => s.name)
        })
      }
      setMarketingActivities([])
    }
  }, [inquiryFormData.presentSchool, inquiryDate, schools, allMarketingActivities])

  // Helper function to check if a date is today
  const isToday = (dateString: string) => {
    const today = new Date()
    const date = new Date(dateString)
    const result = date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
    console.log(`isToday check: ${dateString} vs ${today.toDateString()} = ${result}`)
    return result
  }

  // Helper function to check if a date is within this week
  const isThisWeek = (dateString: string) => {
    const today = new Date()
    const date = new Date(dateString)
    const firstDayOfWeek = new Date(today)
    firstDayOfWeek.setDate(today.getDate() - today.getDay())
    const lastDayOfWeek = new Date(firstDayOfWeek)
    lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6)
    const result = date >= firstDayOfWeek && date <= lastDayOfWeek
    console.log(`isThisWeek check: ${dateString} between ${firstDayOfWeek.toDateString()} and ${lastDayOfWeek.toDateString()} = ${result}`)
    return result
  }

  // Helper function to check if a date is within this month
  const isThisMonth = (dateString: string) => {
    const today = new Date()
    const date = new Date(dateString)
    const result = date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
    console.log(`isThisMonth check: ${dateString} vs ${today.toDateString()} = ${result}`)
    return result
  }

  const handleEditInquiry = async (inquiry: any) => {
    // Fetch the full inquiry row from database to get all fields including inquiry_type and how_did_you_find_out
    const { data: fullInquiry, error } = await supabase
      .from("inquiries")
      .select("*")
      .eq("id", inquiry.id)
      .single()

    if (error) {
      console.error("Error fetching inquiry for edit:", error)
      setInquiryError("Error loading inquiry data. Please try again.")
      return
    }

    if (!fullInquiry) {
      setInquiryError("Inquiry not found.")
      return
    }

    // Parse name into first and last name
    const nameParts = fullInquiry.name?.split(" ") || []
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""
    
    // Parse program string back into array
    const programMap: { [key: string]: string } = {
      "BS Information Technology": "bsit",
      "BS Computer Science": "bscs",
      "BS Hospitality Management": "bshm",
      "BS Tourism Management": "bstm",
      "BS Business Administration": "bsba",
      "IT in Mobile App and Web Development": "it-mobile",
      "Humanities and Social Sciences (HUMMS)": "humms",
      "Accountancy, Business, and Management (ABM)": "abm",
    }
    
    const programs = fullInquiry.program
      ? fullInquiry.program
      .split(", ")
      .map((p: string) => programMap[p.trim()])
      .filter((p: string) => p)
      : []
    
    // Map studentType
    const studentType = fullInquiry.student_type === "College" ? "tertiary" : "senior-high"
    
    // Parse phone number - remove +63 prefix and spaces, keep only digits
    const phone = fullInquiry.phone?.replace(/[^\d]/g, "") || ""
    
    // Get inquiry_type and how_did_you_find_out from database
    const inquiryType = fullInquiry.inquiry_type || ""
    const howDidYouFindOut = Array.isArray(fullInquiry.how_did_you_find_out) 
      ? fullInquiry.how_did_you_find_out 
      : []
    const referralSource = Array.isArray(fullInquiry.referral_source)
      ? fullInquiry.referral_source
      : []
    const eventsDescription = fullInquiry.events_description || ""
    const othersSpecify = fullInquiry.others_specify || ""
    const presentSchool = fullInquiry.present_school || ""
    const inquiryDateValue = fullInquiry.date || new Date().toISOString().split("T")[0]
    
    // Set inquiry date
    setInquiryDate(inquiryDateValue)
    
    // Populate form with inquiry data
    setInquiryFormData({
      inquiryType: inquiryType,
      studentType: studentType,
      firstName: firstName,
      lastName: lastName,
      presentSchool: presentSchool,
      email: fullInquiry.email || "",
      phone: phone,
      programs: programs,
      howDidYouFindOut: howDidYouFindOut,
      referralSource: referralSource,
      eventsDescription: eventsDescription,
      othersSpecify: othersSpecify,
    })
    
    setEditingInquiryId(inquiry.id)
    setIsInquiryDialogOpen(true)
  }

  const handleUpdateInquiry = async () => {
    if (!editingInquiryId) {
      console.error("No editingInquiryId set")
      setInquiryError("No inquiry selected for editing.")
      return
    }
    
    // Find the existing inquiry to preserve status and date
    const existingInquiry = inquiries.find(inq => inq.id === editingInquiryId)
    if (!existingInquiry) {
      setInquiryError("Inquiry not found.")
      return
    }
    
    console.log("Updating inquiry with ID:", editingInquiryId)
    console.log("Form data:", inquiryFormData)
    
    // Validate required fields
    if (!inquiryFormData.firstName.trim() || !inquiryFormData.lastName.trim()) {
      const errorMsg = "First name and last name are required."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }
    
    if (!inquiryFormData.email.trim()) {
      const errorMsg = "Email is required."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }
    
    if (!inquiryFormData.phone.trim()) {
      const errorMsg = "Phone number is required."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }

    // Validate name format - only letters, spaces, and periods
    const nameRegex = /^[a-zA-Z\s.]+$/
    if (!nameRegex.test(inquiryFormData.firstName.trim())) {
      const errorMsg = "First name can only contain letters, spaces, and periods."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      setIsUpdating(false)
      return
    }
    if (!nameRegex.test(inquiryFormData.lastName.trim())) {
      const errorMsg = "Last name can only contain letters, spaces, and periods."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      setIsUpdating(false)
      return
    }

    // Validate email format - prevent invalid special characters
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(inquiryFormData.email.trim())) {
      const errorMsg = "Please enter a valid email address."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      setIsUpdating(false)
      return
    }
    // Check for invalid patterns like -@gmail.com
    if (inquiryFormData.email.includes('-@') || inquiryFormData.email.startsWith('-') || inquiryFormData.email.startsWith('@')) {
      const errorMsg = "Email cannot start with special characters or contain invalid patterns."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      setIsUpdating(false)
      return
    }

    // Validate phone number - exactly 11 digits
    const updatePhoneDigits = inquiryFormData.phone.replace(/\D/g, '')
    if (updatePhoneDigits.length !== 11) {
      const errorMsg = "Phone number must be exactly 11 digits."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      setIsUpdating(false)
      return
    }

    // Check for duplicate email or phone number (excluding current inquiry)
    try {
      const trimmedEmail = inquiryFormData.email.trim().toLowerCase()
      
      // First, get the current inquiry's email to compare
      const { data: currentInquiry, error: currentError } = await supabase
        .from("inquiries")
        .select("id, email, phone")
        .eq("id", editingInquiryId)
        .single()

      if (currentError) {
        console.error("Error fetching current inquiry:", currentError)
      }

      // Check if email/phone changed - if not, skip duplicate check
      const currentEmail = currentInquiry?.email?.trim().toLowerCase() || ''
      const currentPhone = (currentInquiry?.phone || '').replace(/\D/g, '')
      
      const emailChanged = currentEmail !== trimmedEmail
      const phoneChanged = currentPhone !== updatePhoneDigits

      // Only check for duplicates if email or phone actually changed
      if (emailChanged || phoneChanged) {
        const { data: existingInquiries, error: checkError } = await supabase
          .from("inquiries")
          .select("id, email, phone")
          .neq("id", editingInquiryId)

        if (checkError) {
          console.error("Error checking for duplicates:", checkError)
        } else if (existingInquiries && existingInquiries.length > 0) {
          // Check for duplicate email (case-insensitive)
          if (emailChanged) {
            const duplicateEmail = existingInquiries.find(inq => {
              const existingEmail = (inq.email || '').trim().toLowerCase()
              return existingEmail === trimmedEmail && existingEmail !== ''
            })

            if (duplicateEmail) {
              const errorMsg = "This email already exists."
              setInquiryError(errorMsg)
              toast.error(errorMsg)
              setIsUpdating(false)
              return
            }
          }

          // Check for duplicate phone
          if (phoneChanged) {
            const duplicatePhone = existingInquiries.find(inq => {
              const existingPhoneDigits = (inq.phone || '').replace(/\D/g, '')
              return existingPhoneDigits === updatePhoneDigits && existingPhoneDigits.length === 11
            })

            if (duplicatePhone) {
              const errorMsg = "This number already exists."
              setInquiryError(errorMsg)
              toast.error(errorMsg)
              setIsUpdating(false)
              return
            }
          }
        }
      }
    } catch (error) {
      console.error("Error checking for duplicates:", error)
    }
    
    setIsUpdating(true)
    setInquiryError("")
    
    // Format program names for display
    const programNames: { [key: string]: string } = {
      "bsit": "BS Information Technology",
      "bscs": "BS Computer Science",
      "bshm": "BS Hospitality Management",
      "bstm": "BS Tourism Management",
      "bsba": "BS Business Administration",
      "it-mobile": "IT in Mobile App and Web Development",
      "humms": "Humanities and Social Sciences (HUMMS)",
      "abm": "Accountancy, Business, and Management (ABM)",
    }
    
    const programDisplayNames = inquiryFormData.programs.map(p => programNames[p] || p)
    
    // Normalize phone number to digits only (already validated above)
    const updatePhoneDigitsNormalized = inquiryFormData.phone.replace(/\D/g, '')
    
    const payload = {
      name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`.trim(),
      email: inquiryFormData.email.trim().toLowerCase(),
      phone: updatePhoneDigitsNormalized,
      program: programDisplayNames.join(", ") || "Not specified",
      student_type: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
      status: existingInquiry.status || "For follow up", // Preserve existing status
      date: inquiryDate || existingInquiry.date || new Date().toISOString().split("T")[0], // Use inquiry date or preserve existing date
      present_school: inquiryFormData.presentSchool || null,
      inquiry_type: inquiryFormData.inquiryType || null,
      how_did_you_find_out: inquiryFormData.howDidYouFindOut.length > 0 ? inquiryFormData.howDidYouFindOut : [],
      referral_source: inquiryFormData.referralSource.length > 0 ? inquiryFormData.referralSource : [],
      events_description: inquiryFormData.eventsDescription || null,
      others_specify: inquiryFormData.othersSpecify || null,
    }

    console.log("Update payload:", payload)

    // Check authentication before updating
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error("Authentication error:", authError)
      setInquiryError("You must be logged in to update inquiries. Please refresh the page and try again.")
      setIsUpdating(false)
      return
    }

    console.log("User authenticated:", user.email)

    const { data, error } = await supabase
      .from("inquiries")
      .update(payload)
      .eq("id", editingInquiryId)
      .select()
    
    if (error) {
      console.error("Error updating inquiry:", error)
      console.error("Error code:", error.code)
      console.error("Error details:", JSON.stringify(error, null, 2))
      
      // Check for RLS-related errors
      let errorMsg = ""
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("row-level security")) {
        errorMsg = `Permission denied: ${error.message || "Row Level Security (RLS) policy is blocking this update. Please check your Supabase RLS policies for the inquiries table."}`
      } else if (error.code === "23502") {
        errorMsg = `Database constraint error: ${error.message || "A required field is missing."}`
      } else {
        errorMsg = `Error updating inquiry: ${error.message || JSON.stringify(error) || "Please try again."}`
      }
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      setIsUpdating(false)
    } else {
      console.log("Update successful, data:", data)
      // Refresh inquiries to get updated data
      await fetchInquiries()
      
        setIsInquiryDialogOpen(false)
        setEditingInquiryId(null)
        resetForm()
      setInquiryError("")
    setIsUpdating(false)
    }
  }

  const handleDeleteInquiry = async () => {
    if (!deletingInquiryId) return
    
    const { error } = await supabase
      .from("inquiries")
      .delete()
      .eq("id", deletingInquiryId)
    
    if (error) {
      console.error("Error deleting inquiry:", error)
      alert("Error deleting inquiry. Please try again.")
    } else {
      setInquiries(prev => prev.filter(inquiry => inquiry.id !== deletingInquiryId))
    }
    
    setDeletingInquiryId(null)
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchLower) ||
      inquiry.email.toLowerCase().includes(searchLower) ||
      inquiry.program.toLowerCase().includes(searchLower)
    const matchesStudentType = studentTypeFilter === "all" || inquiry.studentType.toLowerCase() === studentTypeFilter
    const matchesStatus = statusFilter === "all" || inquiry.status === statusFilter
    const matchesInquiryType = inquiryTypeFilter === "all" || (inquiry.inquiryType || "") === inquiryTypeFilter
    const result = matchesSearch && matchesStudentType && matchesStatus && matchesInquiryType
    return result
  })
  console.log("Filtered inquiries count:", filteredInquiries.length)

  // Filter inquiries by time period
  const todayInquiries = filteredInquiries.filter((inquiry) => 
    isToday(inquiry.date)
  )
  console.log("Today inquiries count:", todayInquiries.length)
  
  const thisWeekInquiries = filteredInquiries.filter((inquiry) => 
    isThisWeek(inquiry.date)
  )
  console.log("This week inquiries count:", thisWeekInquiries.length)
  
  const thisMonthInquiries = filteredInquiries.filter((inquiry) => 
    isThisMonth(inquiry.date)
  )
  console.log("This month inquiries count:", thisMonthInquiries.length)

  const handleLogout = () => router.push("/login")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "For follow up":
        return "default"
      case "Reserved (Registrants with 1000 payment)":
        return "secondary"
      case "Enrolled (Full down payment)":
        return "success"
      case "Enrolled to other STI":
        return "destructive"
      case "Enrolled to other school":
        return "destructive"
      case "Undecided":
        return "outline"
      default:
        return "secondary"
    }
  }

  const resetForm = () => {
    setInquiryFormData(INITIAL_FORM_DATA)
    setInquiryDate(new Date().toISOString().split("T")[0])
  }

  const handleArrayChange = (field: "programs" | "howDidYouFindOut" | "referralSource", value: string, checked: boolean) => {
    setInquiryFormData(prev => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter(id => id !== value)
    }))
  }

  const handleSubmitInquiry = async () => {
    console.log("handleSubmitInquiry called", { isCreatingInquiry, inquiryFormData })
    if (isCreatingInquiry) {
      console.log("Already creating inquiry, returning early")
      return
    }
    
    // Clear any previous errors
    setInquiryError("")
    
    // Validate required fields
    if (!inquiryFormData.firstName.trim() || !inquiryFormData.lastName.trim()) {
      const errorMsg = "First name and last name are required."
      console.log("Validation error:", errorMsg)
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }
    
    if (!inquiryFormData.email.trim()) {
      const errorMsg = "Email is required."
      console.log("Validation error:", errorMsg)
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }
    
    if (!inquiryFormData.phone.trim()) {
      const errorMsg = "Phone number is required."
      console.log("Validation error:", errorMsg)
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }

    // Validate name format - only letters, spaces, and periods
    const nameRegex = /^[a-zA-Z\s.]+$/
    if (!nameRegex.test(inquiryFormData.firstName.trim())) {
      const errorMsg = "First name can only contain letters, spaces, and periods."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }
    if (!nameRegex.test(inquiryFormData.lastName.trim())) {
      const errorMsg = "Last name can only contain letters, spaces, and periods."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }

    // Validate email format - prevent invalid special characters
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    if (!emailRegex.test(inquiryFormData.email.trim())) {
      const errorMsg = "Please enter a valid email address."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }
    // Check for invalid patterns like -@gmail.com
    if (inquiryFormData.email.includes('-@') || inquiryFormData.email.startsWith('-') || inquiryFormData.email.startsWith('@')) {
      const errorMsg = "Email cannot start with special characters or contain invalid patterns."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }

    // Validate phone number - exactly 11 digits
    const phoneDigits = inquiryFormData.phone.replace(/\D/g, '')
    if (phoneDigits.length !== 11) {
      const errorMsg = "Phone number must be exactly 11 digits."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      return
    }

    setIsCreatingInquiry(true)
    setInquiryError("")

    // Check for duplicate email or phone number
    try {
      const { data: existingInquiries, error: checkError } = await supabase
        .from("inquiries")
        .select("id, email, phone")
        .or(`email.eq.${inquiryFormData.email.trim()},phone.eq.${phoneDigits}`)

      if (checkError) {
        console.error("Error checking for duplicates:", checkError)
        const errorMsg = "Error checking for duplicates. Please try again."
        setInquiryError(errorMsg)
        toast.error(errorMsg)
        setIsCreatingInquiry(false)
        return
      }
      
      if (existingInquiries && existingInquiries.length > 0) {
        const duplicateEmail = existingInquiries.find(inq => inq.email?.toLowerCase() === inquiryFormData.email.trim().toLowerCase())
        const duplicatePhone = existingInquiries.find(inq => {
          const existingPhoneDigits = (inq.phone || '').replace(/\D/g, '')
          return existingPhoneDigits === phoneDigits
        })

        if (duplicateEmail) {
          const errorMsg = "This email already exists."
          setInquiryError(errorMsg)
          toast.error(errorMsg)
          setIsCreatingInquiry(false)
          return
        }
        if (duplicatePhone) {
          const errorMsg = "This number already exists."
          setInquiryError(errorMsg)
          toast.error(errorMsg)
          setIsCreatingInquiry(false)
          return
        }
      }
    } catch (error) {
      console.error("Error checking for duplicates:", error)
      const errorMsg = "Error checking for duplicates. Please try again."
      setInquiryError(errorMsg)
      toast.error(errorMsg)
      setIsCreatingInquiry(false)
      return
    }

    // Verify Supabase client is initialized
    if (!supabase) {
      setInquiryError("Supabase connection not available. Please check your environment variables.")
      setIsCreatingInquiry(false)
      return
    }

    try {
      // Get current admin's name
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        setInquiryError("You must be logged in to create inquiries. Please refresh the page and try again.")
        setIsCreatingInquiry(false)
        return
      }

      // Fetch admin's name from profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, name')
        .eq('id', user.id)
        .single()

      let adminName = "Unknown Admin"
      if (!profileError && profile) {
        if (profile.name) {
          adminName = profile.name
        } else if (profile.first_name || profile.last_name) {
          adminName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Unknown Admin"
        }
      }

      // Format program names for display
      const programNames: { [key: string]: string } = {
        "bsit": "BS Information Technology",
        "bscs": "BS Computer Science",
        "bshm": "BS Hospitality Management",
        "bstm": "BS Tourism Management",
        "bsba": "BS Business Administration",
        "it-mobile": "IT in Mobile App and Web Development",
        "humms": "Humanities and Social Sciences (HUMMS)",
        "abm": "Accountancy, Business, and Management (ABM)",
      }
      
      const programDisplayNames = inquiryFormData.programs.map(p => programNames[p] || p)
      
      // Normalize phone number to digits only
      const phoneDigits = inquiryFormData.phone.replace(/\D/g, '')
      
      const newInquiry = {
        name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`.trim(),
        email: inquiryFormData.email.trim().toLowerCase(),
        phone: phoneDigits,
        program: programDisplayNames.join(", ") || "Not specified",
        student_type: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
        present_school: inquiryFormData.presentSchool || null,
        inquiry_type: inquiryFormData.inquiryType || null,
        how_did_you_find_out: inquiryFormData.howDidYouFindOut.length > 0 ? inquiryFormData.howDidYouFindOut : [],
        referral_source: inquiryFormData.referralSource.length > 0 ? inquiryFormData.referralSource : [],
        events_description: inquiryFormData.eventsDescription || null,
        others_specify: inquiryFormData.othersSpecify || null,
        status: "For follow up",
        date: inquiryDate || new Date().toISOString().split("T")[0], // Use inquiry date or current date
        admin_name: adminName, // Store admin name permanently
      }

      console.log("Creating inquiry with payload:", newInquiry)

      const { data, error } = await supabase
        .from("inquiries")
        .insert([newInquiry])
        .select()

      if (error) {
        console.error("Supabase insert error:", error)
        console.error("Error details:", JSON.stringify(error, null, 2))
        throw error
      }

      if (data && data.length > 0) {
        const mappedInquiry = mapRowToInquiry(data[0])
        setInquiries(prev => [mappedInquiry, ...prev])
        resetForm()
        setIsInquiryDialogOpen(false)
        setInquiryError("")
      }
    } catch (error: any) {
      console.error("Error creating inquiry:", error)
      const errorMessage = error?.message || error?.details || error?.hint || JSON.stringify(error) || "Unknown error occurred"
      const errorMsg = `Error creating inquiry: ${errorMessage}`
      setInquiryError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsCreatingInquiry(false)
    }
  }

  const handleStatusChange = async (inquiryId: number, newStatus: string) => {
    if (newStatus === "Enrolled (Full down payment)") {
      const targetInquiry = inquiries.find((item) => item.id === inquiryId)
      if (!targetInquiry) return
      setPendingEnrollmentInquiry(targetInquiry)
      setPendingStatus(newStatus)
      setIsEnrollConfirmOpen(true)
      return
    }

    setInquiries(prev =>
      prev.map(inquiry =>
        inquiry.id === inquiryId ? { ...inquiry, status: newStatus } : inquiry,
      ),
    )

    await supabase
      .from("inquiries")
      .update({ status: newStatus })
      .eq("id", inquiryId)
  }

  const prepareEnrollmentFormFromInquiry = (inquiry: InquiryRecord) => {
    const template = createEmptyStudentFormData()
    const nameParts = inquiry.name.trim().split(" ").filter(Boolean)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ""
    const middleName = nameParts.length > 2 ? nameParts.slice(1, -1).join(" ") : ""
    const programs = mapProgramStringToCodes(inquiry.program)
    const normalizedPhone = inquiry.phone.replace(/[^\d]/g, "")

    // For enrollment, only use the first program since radio buttons allow only one selection
    // Clear the fallback program field so only the selected radio button program is saved
    setEnrollmentFormData({
      ...template,
      firstName,
      middleName,
      lastName,
      email: inquiry.email,
      mobileNumber: normalizedPhone,
      studentType: inquiry.studentType === "College" ? "college" : "senior-high",
      programs: programs.length > 0 ? [programs[0]] : [], // Only take the first program for radio button
      program: "", // Clear fallback so only selected radio button program is saved
    })
  }

  const handleConfirmEnrollment = () => {
    if (!pendingEnrollmentInquiry) return
    prepareEnrollmentFormFromInquiry(pendingEnrollmentInquiry)
    setIsEnrollConfirmOpen(false)
    setIsEnrollmentDialogOpen(true)
  }

  const handleEnrollmentDialogChange = (open: boolean) => {
    setIsEnrollmentDialogOpen(open)
    if (!open) {
      setEnrollmentFormData(createEmptyStudentFormData())
      setPendingEnrollmentInquiry(null)
      setPendingStatus(null)
      setIsSavingEnrollment(false)
    }
  }

  const handleSubmitEnrollmentFromInquiry = async () => {
    if (!pendingEnrollmentInquiry || !pendingStatus) return
    if (!enrollmentFormData.firstName.trim() || !enrollmentFormData.lastName.trim()) return
    if (
      enrollmentFormData.collegeStudentType === "sti-transferee" &&
      enrollmentFormData.studentNumber.length !== 11
    ) {
      return
    }

    setIsSavingEnrollment(true)
    
    // Fetch admin's name from profile
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    let adminName = "Unknown Admin"
    
    if (!authError && user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('first_name, last_name, name')
        .eq('id', user.id)
        .single()

      if (!profileError && profile) {
        if (profile.name) {
          adminName = profile.name
        } else if (profile.first_name || profile.last_name) {
          adminName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || "Unknown Admin"
        }
      }
    }
    
    const programNames = mapProgramCodesToLabel(enrollmentFormData.programs, enrollmentFormData.program)
    const studentTypeLabel =
      enrollmentFormData.studentType === "college"
        ? "College"
        : enrollmentFormData.studentType === "senior-high"
          ? "Senior High"
          : ""

    const payload: any = {
      name: `${enrollmentFormData.firstName} ${
        enrollmentFormData.middleName ? enrollmentFormData.middleName + " " : ""
      }${enrollmentFormData.lastName}`.trim(),
      email: enrollmentFormData.email,
      phone: enrollmentFormData.mobileNumber || enrollmentFormData.landline || "N/A",
      program: programNames,
      date: new Date().toISOString().split("T")[0],
      student_type: studentTypeLabel,
      last_school_attended: enrollmentFormData.lastSchoolAttended
        ? enrollmentFormData.lastSchoolAttended
            .split("-")
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        : "Not specified",
      school_name: enrollmentFormData.schoolName || null,
      program_track_strand: enrollmentFormData.programTrackStrand || null,
      college_student_type: enrollmentFormData.studentType === "college" ? enrollmentFormData.collegeStudentType : null,
      student_number:
        enrollmentFormData.collegeStudentType === "sti-transferee" ? enrollmentFormData.studentNumber : null,
      admin_name: adminName, // Store admin name permanently
    }

    // Add inquiry_id - inquiry IDs are numbers, not UUIDs
    if (pendingEnrollmentInquiry.id) {
      payload.inquiry_id = pendingEnrollmentInquiry.id
    }

    const { error } = await supabase.from("enrollments").insert(payload)

    if (error) {
      console.error("Error creating enrollment:", error)
      // If error is about inquiry_id column not existing, try again without it
      if (error.message?.includes('inquiry_id') || error.message?.includes('column') || error.code === '42703') {
        const payloadWithoutInquiryId = { ...payload }
        delete payloadWithoutInquiryId.inquiry_id
        const { error: retryError } = await supabase.from("enrollments").insert(payloadWithoutInquiryId)
        if (retryError) {
          console.error("Error creating enrollment (retry):", retryError)
          alert(`Unable to create enrollment: ${retryError.message}`)
          setIsSavingEnrollment(false)
          return
        }
      } else {
        alert(`Unable to create enrollment: ${error.message}`)
        setIsSavingEnrollment(false)
        return
      }
    }

    if (!error) {
      await supabase.from("inquiries").update({ status: pendingStatus }).eq("id", pendingEnrollmentInquiry.id)
      setInquiries(prev =>
        prev.map(inquiry =>
          inquiry.id === pendingEnrollmentInquiry.id ? { ...inquiry, status: pendingStatus } : inquiry,
        ),
      )

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("enrollment-records-updated"))
      }
    }

    setIsSavingEnrollment(false)
    handleEnrollmentDialogChange(false)
  }

  // Calculate metrics for KPI cards
  const highSchoolCount = inquiries.filter(inquiry => 
    inquiry.studentType === "High School" || inquiry.studentType === "Senior High"
  ).length

  const collegeCount = inquiries.filter(inquiry => 
    inquiry.studentType === "College"
  ).length

  // Calculate total inquiries today
  const todayInquiriesCount = todayInquiries.length

  // Calculate online and walk-in inquiry counts
  const [onlineCount, setOnlineCount] = useState<number>(0)
  const [walkInCount, setWalkInCount] = useState<number>(0)

  // Convert dates to strings for stable dependency array
  const startDateString = startDate ? format(startDate, 'yyyy-MM-dd') : null
  const endDateString = endDate ? format(endDate, 'yyyy-MM-dd') : null

  useEffect(() => {
    const fetchInquiryTypeCounts = async () => {
      try {
        // Apply date filters if they exist
        let query = supabase
          .from("inquiries")
          .select("inquiry_type")

        if (startDate) {
          const startDateTime = format(startDate, 'yyyy-MM-dd') + 'T00:00:00.000Z'
          query = query.gte('created_at', startDateTime)
        }
        
        if (endDate) {
          const endDateTime = format(endDate, 'yyyy-MM-dd') + 'T23:59:59.999Z'
          query = query.lte('created_at', endDateTime)
        }

        const { data, error } = await query

        if (error) {
          console.error("Error fetching inquiry types:", error)
          return
        }

        if (data) {
          const online = data.filter(inq => inq.inquiry_type === "online").length
          const walkIn = data.filter(inq => inq.inquiry_type === "walk-in").length
          setOnlineCount(online)
          setWalkInCount(walkIn)
        }
      } catch (error) {
        console.error("Error calculating inquiry type counts:", error)
      }
    }

    fetchInquiryTypeCounts()
  }, [inquiries.length, startDateString, endDateString]) // Use string dates for stable dependencies

  // Calculate percentage change from last month
  const calculateMonthChange = () => {
    const today = new Date()
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    const lastMonthInquiries = inquiries.filter(inquiry => {
      const inquiryDate = new Date(inquiry.date)
      return inquiryDate >= lastMonth && inquiryDate <= lastMonthEnd
    }).length
    
    const currentMonthInquiries = inquiries.filter(inquiry => {
      const inquiryDate = new Date(inquiry.date)
      return inquiryDate.getMonth() === today.getMonth() && 
             inquiryDate.getFullYear() === today.getFullYear()
    }).length
    
    if (lastMonthInquiries === 0) {
      return currentMonthInquiries > 0 ? "+100%" : "0%"
    }
    
    const change = ((currentMonthInquiries - lastMonthInquiries) / lastMonthInquiries) * 100
    return change >= 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`
  }
  
  const monthChange = calculateMonthChange()

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
        {/* Sidebar Navigation - Fixed */}
        <AdminSidebar onLogout={handleLogout} userPermissions={userPermissions} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
            <h1 className="text-3xl font-serif font-bold text-slate-700 dark:text-slate-200 mb-2">Inquiries Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Track and manage all program inquiries from prospective students</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="start-date" className="text-sm font-medium text-foreground mb-1">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="start-date"
                        variant="outline"
                        className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-0 focus-visible:border-gray-400 h-9 px-3"
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
                        className="w-[140px] justify-start text-left font-normal border border-border focus-visible:ring-0 focus-visible:border-gray-400 h-9 px-3"
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
                    fetchInquiries()
                  }}
                  disabled={isLoadingInquiries}
                  className="h-9 w-9 p-0"
                  title={isLoadingInquiries ? 'Refreshing...' : 'Refresh Data'}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <KpiCard
              title="Total Walk-in"
              value={walkInCount}
              change={`${monthChange} from last month`}
              icon={MessageSquare}
            />

            <KpiCard
              title="Total Online"
              value={onlineCount}
              change={`${onlineCount} online inquiries`}
              icon={GraduationCap}
            />

            <KpiCard
              title="Number of College Students"
              value={collegeCount}
              change="College inquiries"
              icon={Users}
            />

            <KpiCard
              title="Number of High School Students"
              value={highSchoolCount}
              change="High school inquiries"
              icon={School}
            />
          </div>

          {/* Inquiries Table with Tabs */}
          <Card className="shadow-lg border-border">
            <CardContent className="p-6">
              {/* Search and Filters inside table */}
          <div className="flex items-center justify-between mb-6 gap-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative w-56 flex-shrink-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={inquiryTypeFilter} onValueChange={setInquiryTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Inquiry Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={studentTypeFilter} onValueChange={setStudentTypeFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Student Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Student Types</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="senior high">Senior High</SelectItem>
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
                    onClick={() => {
                      resetForm()
                      setEditingInquiryId(null)
                      setInquiryDate(new Date().toISOString().split("T")[0]) // Ensure today's date is set
                      setIsInquiryDialogOpen(true)
                    }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Inquiry
            </Button>
          </div>
              </div>
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                  <TabsTrigger 
                    value="all" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Inquiries
                  </TabsTrigger>
                  <TabsTrigger 
                    value="today" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    Today
                  </TabsTrigger>
                  <TabsTrigger 
                    value="this-week" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    This Week
                  </TabsTrigger>
                  <TabsTrigger 
                    value="this-month" 
                    className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm"
                  >
                    This Month
                  </TabsTrigger>
                </TabsList>

                {/* All Inquiries Tab */}
                <TabsContent value="all" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground">Type of Student</TableHead>
                          <TableHead className="font-semibold text-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingInquiries ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              Loading inquiries...
                            </TableCell>
                          </TableRow>
                        ) : inquiryError ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-red-500 py-12">
                              {inquiryError}
                            </TableCell>
                          </TableRow>
                        ) : filteredInquiries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No inquiries found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredInquiries.map((inquiry) => (
                            <TableRow 
                              key={inquiry.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{inquiry.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-medium">{inquiry.name}</p>
                                    <p className="text-xs text-muted-foreground">{inquiry.date}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.email}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {(() => {
                                  const programs = parseProgramString(inquiry.program || "Not specified")
                                  const firstTwo = programs.slice(0, 2)
                                  const remaining = programs.slice(2)
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap gap-1">
                                        {firstTwo.map((program, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                            {program.trim()}
                                          </Badge>
                                        ))}
                                      </div>
                                      {remaining.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                                          {remaining.map((program, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                              {program.trim()}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-7 w-7">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Change status</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                      {STATUS_OPTIONS.map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          className="cursor-pointer text-sm"
                                          onClick={() => handleStatusChange(inquiry.id, status)}
                                        >
                                          {status}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  {inquiry.status.startsWith("Reserved") ? (
                                    <Badge className="bg-blue-500 text-white border-blue-500">{inquiry.status}</Badge>
                                  ) : inquiry.status.startsWith("Enrolled (Full down payment)") ? (
                                    <Badge className="bg-green-600 text-white border-green-600">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other STI" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other school" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : (
                                    <Badge variant={getStatusColor(inquiry.status) as any}>{inquiry.status}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge variant="outline" className="text-xs">
                                  {inquiry.studentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                {inquiry.date}
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={async () => {
                                      setViewingInquiry(inquiry)
                                      // Fetch full inquiry data to get inquiry_type and how_did_you_find_out
                                      const { data: fullData } = await supabase
                                        .from("inquiries")
                                        .select("*")
                                        .eq("id", inquiry.id)
                                        .single()
                                      setViewingInquiryFull(fullData)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditInquiry(inquiry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingInquiryId(inquiry.id)}
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

                {/* Today Tab */}
                <TabsContent value="today" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground">Type of Student</TableHead>
                          <TableHead className="font-semibold text-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingInquiries ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              Loading inquiries...
                            </TableCell>
                          </TableRow>
                        ) : inquiryError ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-red-500 py-12">
                              {inquiryError}
                            </TableCell>
                          </TableRow>
                        ) : todayInquiries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No inquiries found for today</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          todayInquiries.map((inquiry) => (
                            <TableRow 
                              key={inquiry.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{inquiry.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-medium">{inquiry.name}</p>
                                    <p className="text-xs text-muted-foreground">{inquiry.date}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.email}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {(() => {
                                  const programs = parseProgramString(inquiry.program || "Not specified")
                                  const firstTwo = programs.slice(0, 2)
                                  const remaining = programs.slice(2)
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap gap-1">
                                        {firstTwo.map((program, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                            {program.trim()}
                                          </Badge>
                                        ))}
                                      </div>
                                      {remaining.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                                          {remaining.map((program, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                              {program.trim()}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-7 w-7">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Change status</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                      {STATUS_OPTIONS.map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          className="cursor-pointer text-sm"
                                          onClick={() => handleStatusChange(inquiry.id, status)}
                                        >
                                          {status}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  {inquiry.status.startsWith("Reserved") ? (
                                    <Badge className="bg-blue-500 text-white border-blue-500">{inquiry.status}</Badge>
                                  ) : inquiry.status.startsWith("Enrolled (Full down payment)") ? (
                                    <Badge className="bg-green-600 text-white border-green-600">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other STI" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other school" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : (
                                    <Badge variant={getStatusColor(inquiry.status) as any}>{inquiry.status}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge variant="outline" className="text-xs">
                                  {inquiry.studentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                {inquiry.date}
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={async () => {
                                      setViewingInquiry(inquiry)
                                      // Fetch full inquiry data to get inquiry_type and how_did_you_find_out
                                      const { data: fullData } = await supabase
                                        .from("inquiries")
                                        .select("*")
                                        .eq("id", inquiry.id)
                                        .single()
                                      setViewingInquiryFull(fullData)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditInquiry(inquiry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingInquiryId(inquiry.id)}
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

                {/* This Week Tab */}
                <TabsContent value="this-week" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground">Type of Student</TableHead>
                          <TableHead className="font-semibold text-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingInquiries ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              Loading inquiries...
                            </TableCell>
                          </TableRow>
                        ) : inquiryError ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-red-500 py-12">
                              {inquiryError}
                            </TableCell>
                          </TableRow>
                        ) : thisWeekInquiries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No inquiries found for this week</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          thisWeekInquiries.map((inquiry) => (
                            <TableRow 
                              key={inquiry.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{inquiry.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-medium">{inquiry.name}</p>
                                    <p className="text-xs text-muted-foreground">{inquiry.date}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.email}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {(() => {
                                  const programs = parseProgramString(inquiry.program || "Not specified")
                                  const firstTwo = programs.slice(0, 2)
                                  const remaining = programs.slice(2)
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap gap-1">
                                        {firstTwo.map((program, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                            {program.trim()}
                                          </Badge>
                                        ))}
                                      </div>
                                      {remaining.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                                          {remaining.map((program, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                              {program.trim()}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-7 w-7">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Change status</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                      {STATUS_OPTIONS.map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          className="cursor-pointer text-sm"
                                          onClick={() => handleStatusChange(inquiry.id, status)}
                                        >
                                          {status}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  {inquiry.status.startsWith("Reserved") ? (
                                    <Badge className="bg-blue-500 text-white border-blue-500">{inquiry.status}</Badge>
                                  ) : inquiry.status.startsWith("Enrolled (Full down payment)") ? (
                                    <Badge className="bg-green-600 text-white border-green-600">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other STI" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other school" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : (
                                    <Badge variant={getStatusColor(inquiry.status) as any}>{inquiry.status}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge variant="outline" className="text-xs">
                                  {inquiry.studentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                {inquiry.date}
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={async () => {
                                      setViewingInquiry(inquiry)
                                      // Fetch full inquiry data to get inquiry_type and how_did_you_find_out
                                      const { data: fullData } = await supabase
                                        .from("inquiries")
                                        .select("*")
                                        .eq("id", inquiry.id)
                                        .single()
                                      setViewingInquiryFull(fullData)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditInquiry(inquiry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingInquiryId(inquiry.id)}
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

                {/* This Month Tab */}
                <TabsContent value="this-month" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground">Type of Student</TableHead>
                          <TableHead className="font-semibold text-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingInquiries ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              Loading inquiries...
                            </TableCell>
                          </TableRow>
                        ) : inquiryError ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-red-500 py-12">
                              {inquiryError}
                            </TableCell>
                          </TableRow>
                        ) : thisMonthInquiries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No inquiries found for this month</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          thisMonthInquiries.map((inquiry) => (
                            <TableRow 
                              key={inquiry.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{inquiry.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-medium">{inquiry.name}</p>
                                    <p className="text-xs text-muted-foreground">{inquiry.date}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.email}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {(() => {
                                  const programs = parseProgramString(inquiry.program || "Not specified")
                                  const firstTwo = programs.slice(0, 2)
                                  const remaining = programs.slice(2)
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap gap-1">
                                        {firstTwo.map((program, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                            {program.trim()}
                                          </Badge>
                                        ))}
                                      </div>
                                      {remaining.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                                          {remaining.map((program, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                              {program.trim()}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-7 w-7">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Change status</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                      {STATUS_OPTIONS.map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          className="cursor-pointer text-sm"
                                          onClick={() => handleStatusChange(inquiry.id, status)}
                                        >
                                          {status}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  {inquiry.status.startsWith("Reserved") ? (
                                    <Badge className="bg-blue-500 text-white border-blue-500">{inquiry.status}</Badge>
                                  ) : inquiry.status.startsWith("Enrolled (Full down payment)") ? (
                                    <Badge className="bg-green-600 text-white border-green-600">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other STI" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other school" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : (
                                    <Badge variant={getStatusColor(inquiry.status) as any}>{inquiry.status}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge variant="outline" className="text-xs">
                                  {inquiry.studentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                {inquiry.date}
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={async () => {
                                      setViewingInquiry(inquiry)
                                      // Fetch full inquiry data to get inquiry_type and how_did_you_find_out
                                      const { data: fullData } = await supabase
                                        .from("inquiries")
                                        .select("*")
                                        .eq("id", inquiry.id)
                                        .single()
                                      setViewingInquiryFull(fullData)
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditInquiry(inquiry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingInquiryId(inquiry.id)}
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
        
        {/* Program Inquiry Dialog */}
        <Dialog open={isInquiryDialogOpen} onOpenChange={(open) => {
          setIsInquiryDialogOpen(open)
          if (!open) {
            resetForm()
            setEditingInquiryId(null)
            setInquiryError("")
          } else if (!editingInquiryId) {
            // When opening for new inquiry, ensure date is set to today
            setInquiryDate(new Date().toISOString().split("T")[0])
          }
        }}>
          <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-2xl">{editingInquiryId ? "Edit Inquiry" : "Program Inquiry"}</DialogTitle>
              <DialogDescription className="text-base mt-2">
                {editingInquiryId ? "Update the inquiry information" : "Tell us about your educational goals and interests"}
              </DialogDescription>
            </DialogHeader>
            
            {inquiryError && (
              <Alert variant="destructive" className="mt-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium">{inquiryError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              {/* Type of Inquiry and Type of Student */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <Label className="text-sm font-semibold text-foreground uppercase mb-4 block">TYPE OF INQUIRY</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="inquiry-online"
                        name="inquiryType"
                        value="online"
                        checked={inquiryFormData.inquiryType === "online"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                        className="w-4 h-4 border-2 border-gray-300 focus:border-gray-400 focus:ring-0"
                      />
                      <Label htmlFor="inquiry-online" className="text-sm font-medium cursor-pointer">Online</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="inquiry-walk-in"
                        name="inquiryType"
                        value="walk-in"
                        checked={inquiryFormData.inquiryType === "walk-in"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                        className="w-4 h-4 border-2 border-gray-300 focus:border-gray-400 focus:ring-0"
                      />
                      <Label htmlFor="inquiry-walk-in" className="text-sm font-medium cursor-pointer">Walk-in</Label>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <Label className="text-sm font-semibold text-foreground uppercase mb-4 block">TYPE OF STUDENT</Label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="inquiry-senior-high"
                        name="studentType"
                        value="senior-high"
                        checked={inquiryFormData.studentType === "senior-high"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                        className="w-4 h-4 border-2 border-gray-300 focus:border-gray-400 focus:ring-0"
                      />
                      <Label htmlFor="inquiry-senior-high" className="text-sm font-medium cursor-pointer">Senior High School</Label>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        id="inquiry-tertiary"
                        name="studentType"
                        value="tertiary"
                        checked={inquiryFormData.studentType === "tertiary"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                        className="w-4 h-4 border-2 border-gray-300 focus:border-gray-400 focus:ring-0"
                      />
                      <Label htmlFor="inquiry-tertiary" className="text-sm font-medium cursor-pointer">Tertiary</Label>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Personal Information Section */}
              <Card className="p-6">
                <Label className="text-sm font-semibold text-foreground uppercase mb-4 block">PERSONAL INFORMATION</Label>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-firstName">First Name</Label>
                    <Input 
                      id="inquiry-firstName" 
                      placeholder="Enter your first name" 
                      value={inquiryFormData.firstName ?? ""}
                      onChange={(e) => {
                        // Only allow letters, spaces, and periods
                        const value = e.target.value.replace(/[^a-zA-Z\s.]/g, '')
                        setInquiryFormData(prev => ({ ...prev, firstName: value }))
                      }}
                      className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-lastName">Last Name</Label>
                    <Input 
                      id="inquiry-lastName" 
                      placeholder="Enter your last name" 
                      value={inquiryFormData.lastName ?? ""}
                      onChange={(e) => {
                        // Only allow letters, spaces, and periods
                        const value = e.target.value.replace(/[^a-zA-Z\s.]/g, '')
                        setInquiryFormData(prev => ({ ...prev, lastName: value }))
                      }}
                      className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inquiry-presentSchool">Present School</Label>
                  <Popover open={schoolPopoverOpen} onOpenChange={setSchoolPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={schoolPopoverOpen}
                        className={cn(
                          "w-full justify-between border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400",
                          !inquiryFormData.presentSchool && "text-muted-foreground"
                        )}
                      >
                        {inquiryFormData.presentSchool || "Select school"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="p-0" 
                      align="start"
                      style={{ width: 'var(--radix-popover-trigger-width)' }}
                    >
                      <Command>
                        <CommandInput placeholder="Search schools..." />
                        <CommandList>
                          <CommandEmpty>No school found.</CommandEmpty>
                          <CommandGroup>
                            {schools.map((school) => (
                              <CommandItem
                                key={school.id}
                                value={school.name}
                                onSelect={() => {
                                  setInquiryFormData(prev => ({ ...prev, presentSchool: school.name }))
                                  setSchoolPopoverOpen(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    inquiryFormData.presentSchool === school.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {school.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry-date" className="text-sm font-medium">Inquiry Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="inquiry-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400 h-10",
                          !inquiryDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {inquiryDate ? format(new Date(inquiryDate), "MM/dd/yyyy") : "Select inquiry date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={inquiryDate ? new Date(inquiryDate) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setInquiryDate(date.toISOString().split('T')[0])
                          }
                        }}
                        captionLayout="dropdown"
                        fromYear={new Date().getFullYear() - 5}
                        toYear={new Date().getFullYear() + 1}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry-email">Email Address</Label>
                  <Input 
                    id="inquiry-email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={inquiryFormData.email ?? ""}
                    onChange={(e) => {
                      let value = e.target.value
                      // Prevent special characters that shouldn't be in email (like -@gmail.com pattern)
                      // Allow only valid email characters: letters, numbers, dots, underscores, plus, hyphens, and @
                      // But prevent -@ pattern and starting with special characters
                      if (value.includes('-@') || value.startsWith('-') || value.startsWith('@')) {
                        return // Don't update if invalid pattern
                      }
                      // Remove invalid characters but keep valid email characters
                      value = value.replace(/[^a-zA-Z0-9._+-@]/g, '')
                      setInquiryFormData(prev => ({ ...prev, email: value }))
                    }}
                    className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry-phone">Phone Number (11 digits)</Label>
                  <Input 
                    id="inquiry-phone" 
                    type="tel" 
                    placeholder="Enter 11-digit phone number" 
                    value={inquiryFormData.phone ?? ""}
                    onChange={(e) => {
                      // Only allow digits, limit to 11 characters
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 11)
                      setInquiryFormData(prev => ({ ...prev, phone: digits }))
                    }}
                    maxLength={11}
                    className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                  />
                </div>
              </Card>

              {/* Programs of Interest */}
              <Card className="p-6">
                <Label className="text-sm font-semibold text-foreground uppercase mb-4 block">PROGRAMS OF INTEREST</Label>
                
                {inquiryFormData.studentType === "tertiary" && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">College Programs</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-bsit" 
                          checked={inquiryFormData.programs.includes('bsit')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'bsit', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-bsit" className="text-sm">
                          BS Information Technology (BSIT)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-bscs" 
                          checked={inquiryFormData.programs.includes('bscs')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'bscs', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-bscs" className="text-sm">
                          BS Computer Science (BSCS)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-bshm" 
                          checked={inquiryFormData.programs.includes('bshm')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'bshm', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-bshm" className="text-sm">
                          BS Hospitality Management (BSHM)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-bstm" 
                          checked={inquiryFormData.programs.includes('bstm')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'bstm', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-bstm" className="text-sm">
                          BS Tourism Management (BSTM)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-bsba" 
                          checked={inquiryFormData.programs.includes('bsba')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'bsba', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-bsba" className="text-sm">
                          BS Business Administration (BSBA)
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {inquiryFormData.studentType === "senior-high" && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Senior High School Programs</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-it-mobile" 
                          checked={inquiryFormData.programs.includes('it-mobile')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'it-mobile', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-it-mobile" className="text-sm">
                          IT in Mobile App and Web Development
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-humms" 
                          checked={inquiryFormData.programs.includes('humms')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'humms', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-humms" className="text-sm">
                          Humanities and Social Sciences (HUMMS)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-abm" 
                          checked={inquiryFormData.programs.includes('abm')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'abm', checked as boolean)}
                          className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                        />
                        <Label htmlFor="inquiry-abm" className="text-sm">
                          Accountancy, Business, and Management (ABM)
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {!inquiryFormData.studentType && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Please select your student type above to see available programs.</p>
                  </div>
                )}
              </Card>

              {/* How Did You Find Out About STI Section */}
              <Card className="p-6">
                <Label className="text-sm font-semibold text-foreground uppercase mb-4 block">HOW DID YOU FIND OUT ABOUT STI?</Label>
                
                <div className="space-y-4">
                  {/* Main Options */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-tv" 
                        checked={inquiryFormData.howDidYouFindOut.includes('tv')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'tv', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-tv" className="text-sm">TV</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-outdoor" 
                        checked={inquiryFormData.howDidYouFindOut.includes('outdoor')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'outdoor', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-outdoor" className="text-sm">OUTDOOR (Billboard, Banners, Streamers)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-radio" 
                        checked={inquiryFormData.howDidYouFindOut.includes('radio')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'radio', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-radio" className="text-sm">RADIO</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-print" 
                        checked={inquiryFormData.howDidYouFindOut.includes('print')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'print', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-print" className="text-sm">PRINT (Newspaper)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-magazine" 
                        checked={inquiryFormData.howDidYouFindOut.includes('magazine')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'magazine', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-magazine" className="text-sm">MAGAZINE/FLYERS</Label>
                    </div>
                  </div>

                  {/* ONLINE Section */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-online-find" 
                        checked={inquiryFormData.howDidYouFindOut.includes('online')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'online', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-online-find" className="text-sm font-semibold">ONLINE</Label>
                    </div>
                    
                    {inquiryFormData.howDidYouFindOut.includes('online') && (
                      <div className="ml-6 space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-website" 
                            checked={inquiryFormData.howDidYouFindOut.includes('website')}
                            onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'website', checked as boolean)}
                            className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <Label htmlFor="inquiry-website" className="text-sm">Website</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-facebook" 
                            checked={inquiryFormData.howDidYouFindOut.includes('facebook')}
                            onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'facebook', checked as boolean)}
                            className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <Label htmlFor="inquiry-facebook" className="text-sm">Facebook</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-others-online" 
                            checked={inquiryFormData.howDidYouFindOut.includes('others-online')}
                            onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'others-online', checked as boolean)}
                            className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                          />
                          <Label htmlFor="inquiry-others-online" className="text-sm">Others</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* EVENTS Section */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-events" 
                        checked={inquiryFormData.howDidYouFindOut.includes('events')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'events', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-events" className="text-sm">EVENTS</Label>
                    </div>
                    
                    {inquiryFormData.howDidYouFindOut.includes('events') && (
                      <div className="ml-6">
                        <Popover open={eventsPopoverOpen} onOpenChange={setEventsPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={eventsPopoverOpen}
                              className={cn(
                                "w-full justify-between border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400",
                                !inquiryFormData.eventsDescription && "text-muted-foreground"
                              )}
                              disabled={loadingActivities}
                            >
                              {loadingActivities
                                ? "Loading activities..."
                                : inquiryFormData.eventsDescription || "Select marketing activity"}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="p-0" 
                            align="start"
                            style={{ width: 'var(--radix-popover-trigger-width)' }}
                          >
                            <Command>
                              <CommandInput placeholder="Search activities..." />
                              <CommandList>
                                <CommandEmpty>
                                  {!inquiryFormData.presentSchool 
                                    ? "Please select a present school first"
                                    : (() => {
                                        const school = schools.find(s => s.name === inquiryFormData.presentSchool)
                                        if (!school) {
                                          return "School not found. Please check the school name."
                                        }
                                        if (school.type !== 'feeder') {
                                          return "This school is not a feeder school. Only feeder schools have marketing events."
                                        }
                                        return "No marketing events found for this school. Make sure events are created for this school in the Marketing Activities page."
                                      })()}
                                </CommandEmpty>
                                <CommandGroup>
                                  {marketingActivities.map((activity) => {
                                    // Format date as MM/DD/YYYY (e.g., 12/8/2025)
                                    let activityDate = ''
                                    if (activity.date) {
                                      const date = new Date(activity.date)
                                      const month = date.getMonth() + 1
                                      const day = date.getDate()
                                      const year = date.getFullYear()
                                      activityDate = `${month}/${day}/${year}`
                                    }
                                    const displayText = activityDate ? `${activity.title} - ${activityDate}` : activity.title
                                    return (
                                      <CommandItem
                                        key={activity.id}
                                        value={activity.title}
                                        onSelect={() => {
                                          setInquiryFormData(prev => ({ ...prev, eventsDescription: displayText }))
                                          setEventsPopoverOpen(false)
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            inquiryFormData.eventsDescription === displayText ? "opacity-100" : "opacity-0"
                                          )}
                                        />
                                        {displayText}
                                      </CommandItem>
                                    )
                                  })}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                  </div>

                  {/* REFERRAL Section */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-referral" 
                        checked={inquiryFormData.howDidYouFindOut.includes('referral')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'referral', checked as boolean)}
                        className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                      />
                      <Label htmlFor="inquiry-referral" className="text-sm font-semibold">REFERRAL</Label>
                    </div>
                    
                    {inquiryFormData.howDidYouFindOut.includes('referral') && (
                      <div className="ml-6 space-y-2">
                        <div className="grid md:grid-cols-2 gap-2">
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-sti-students" 
                              checked={inquiryFormData.referralSource.includes('sti-students')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'sti-students', checked as boolean)}
                              className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <Label htmlFor="inquiry-sti-students" className="text-sm">STI Students</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-sti-alumni" 
                              checked={inquiryFormData.referralSource.includes('sti-alumni')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'sti-alumni', checked as boolean)}
                              className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <Label htmlFor="inquiry-sti-alumni" className="text-sm">STI Alumni</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-friends" 
                              checked={inquiryFormData.referralSource.includes('friends')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'friends', checked as boolean)}
                              className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <Label htmlFor="inquiry-friends" className="text-sm">Friends</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-parents" 
                              checked={inquiryFormData.referralSource.includes('parents')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'parents', checked as boolean)}
                              className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <Label htmlFor="inquiry-parents" className="text-sm">Parents</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-relatives" 
                              checked={inquiryFormData.referralSource.includes('relatives')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'relatives', checked as boolean)}
                              className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <Label htmlFor="inquiry-relatives" className="text-sm">Relatives</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-others-referral" 
                              checked={inquiryFormData.referralSource.includes('others-referral')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'others-referral', checked as boolean)}
                              className="border-2 border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                            />
                            <Label htmlFor="inquiry-others-referral" className="text-sm">Others: (Pls specify)</Label>
                          </div>
                        </div>
                        
                        {inquiryFormData.referralSource.includes('others-referral') && (
                          <div className="mt-2">
                            <Input 
                              placeholder="Please specify" 
                              value={inquiryFormData.othersSpecify ?? ""}
                              onChange={(e) => setInquiryFormData(prev => ({ ...prev, othersSpecify: e.target.value }))}
                              className="border-2 border-gray-300 focus-visible:ring-0 focus-visible:border-gray-400"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsInquiryDialogOpen(false)
                  resetForm()
                  setEditingInquiryId(null)
                  setInquiryError("")
                }}
              >
                Cancel
              </Button>
              <Button 
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (editingInquiryId) {
                    handleUpdateInquiry()
                  } else {
                    handleSubmitInquiry()
                  }
                }}
                className="bg-primary hover:bg-primary/90"
                disabled={isCreatingInquiry || isUpdating}
              >
                {isCreatingInquiry || isUpdating ? (isUpdating ? "Saving..." : "Submitting...") : (
                  <>
                    {editingInquiryId ? "Save Inquiry" : "Submit Inquiry"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Inquiry Dialog (Read-only) */}
        <Dialog open={viewingInquiry !== null} onOpenChange={(open) => {
          if (!open) {
            setViewingInquiry(null)
            setViewingInquiryFull(null)
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Inquiry Details</DialogTitle>
              <DialogDescription>
                View inquiry information
              </DialogDescription>
            </DialogHeader>
            
            {viewingInquiry && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF INQUIRY</Label>
                    <p className="text-sm">{viewingInquiryFull?.inquiry_type ? (viewingInquiryFull.inquiry_type === "online" ? "Online" : "Walk-in") : "N/A"}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF STUDENT</Label>
                    <p className="text-sm">{viewingInquiry.studentType}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-foreground uppercase">STATUS</Label>
                    <Badge variant={getStatusColor(viewingInquiry.status) as any}>{viewingInquiry.status}</Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground uppercase">PERSONAL INFORMATION</Label>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm">{viewingInquiry.name}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Date</Label>
                      <p className="text-sm">{viewingInquiry.date}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Email Address</Label>
                    <p className="text-sm">{viewingInquiry.email}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Phone Number</Label>
                    <p className="text-sm">{viewingInquiry.phone}</p>
                  </div>

                  {viewingInquiryFull?.present_school && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Present School</Label>
                      <p className="text-sm">{viewingInquiryFull.present_school}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground uppercase">PROGRAM OF INTEREST</Label>
                  <p className="text-sm">{viewingInquiry.program}</p>
                </div>

                {viewingInquiryFull && (
                  <div className="space-y-4">
                    <Label className="text-sm font-semibold text-foreground uppercase">HOW DID YOU FIND OUT ABOUT STI?</Label>
                    {Array.isArray(viewingInquiryFull.how_did_you_find_out) && viewingInquiryFull.how_did_you_find_out.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          {viewingInquiryFull.how_did_you_find_out.map((item: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {item.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                            </Badge>
                          ))}
                        </div>
                        {viewingInquiryFull.events_description && (
                          <div className="mt-2">
                            <Label className="text-sm font-medium">Events Description:</Label>
                            <p className="text-sm">{viewingInquiryFull.events_description}</p>
                          </div>
                        )}
                        {Array.isArray(viewingInquiryFull.referral_source) && viewingInquiryFull.referral_source.length > 0 && (
                          <div className="mt-2">
                            <Label className="text-sm font-medium">Referral Source:</Label>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {viewingInquiryFull.referral_source.map((item: string, index: number) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {item.replace(/-/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {viewingInquiryFull.others_specify && (
                          <div className="mt-2">
                            <Label className="text-sm font-medium">Others Specify:</Label>
                            <p className="text-sm">{viewingInquiryFull.others_specify}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not specified</p>
                    )}
                  </div>
                )}

                <div className="space-y-4">
                  <Label className="text-sm font-semibold text-foreground uppercase">DATE INFORMATION</Label>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Date Added</Label>
                    <p className="text-sm">{viewingInquiry.dateAdded || "N/A"}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => {
                  setViewingInquiry(null)
                  setViewingInquiryFull(null)
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <AlertDialog open={isEnrollConfirmOpen} onOpenChange={setIsEnrollConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm enrollment status</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure {pendingEnrollmentInquiry?.name} is officially enrolled?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Not yet</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmEnrollment}>
                Yes, proceed
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={isEnrollmentDialogOpen} onOpenChange={handleEnrollmentDialogChange}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Complete Enrollment</DialogTitle>
              <DialogDescription>
                Prefilled details from the inquiry are shown below. Review and complete the remaining fields before saving.
              </DialogDescription>
            </DialogHeader>

            <EnrollmentForm
              studentFormData={enrollmentFormData}
              setStudentFormData={setEnrollmentFormData}
              isEnrollment={true}
            />

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleEnrollmentDialogChange(false)}
                disabled={isSavingEnrollment}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitEnrollmentFromInquiry}
                disabled={
                  isSavingEnrollment ||
                  !enrollmentFormData.firstName.trim() ||
                  !enrollmentFormData.lastName.trim() ||
                  (enrollmentFormData.collegeStudentType === "sti-transferee" &&
                    (enrollmentFormData.studentNumber.length !== 11))
                }
                className="bg-primary hover:bg-primary/90"
              >
                {isSavingEnrollment ? "Saving..." : "Add to Enrollment"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Fullscreen Table Dialog */}
        <Dialog open={isTableFullscreen} onOpenChange={setIsTableFullscreen}>
          <DialogContent showCloseButton={false} className="!max-w-none !w-screen !h-screen !max-h-screen !top-0 !left-0 !translate-x-0 !translate-y-0 !rounded-none p-6 flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>Inquiries Table</DialogTitle>
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
            <div className="flex items-center justify-between mb-6 mt-4 gap-4">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="relative w-56 flex-shrink-0">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={inquiryTypeFilter} onValueChange={setInquiryTypeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Inquiry Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="walk-in">Walk-in</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={studentTypeFilter} onValueChange={setStudentTypeFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Student Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Student Types</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="senior high">Senior High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  resetForm()
                  setEditingInquiryId(null)
                  setInquiryDate(new Date().toISOString().split("T")[0]) // Ensure today's date is set
                  setIsInquiryDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Inquiry
              </Button>
            </div>
            <div className="overflow-auto flex-1">
              <Tabs defaultValue="all" className="w-full">
                <TabsList className="mb-6 bg-muted/50 p-1 h-auto">
                  <TabsTrigger value="all" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Inquiries
                  </TabsTrigger>
                  <TabsTrigger value="today" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="this-week" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    This Week
                  </TabsTrigger>
                  <TabsTrigger value="this-month" className="px-6 py-2.5 text-sm font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
                    This Month
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-0">
                  <div className="rounded-lg border border-border bg-background">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-border hover:bg-transparent">
                          <TableHead className="font-semibold text-foreground">Admin Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Name</TableHead>
                          <TableHead className="font-semibold text-foreground">Contact</TableHead>
                          <TableHead className="font-semibold text-foreground">Program</TableHead>
                          <TableHead className="font-semibold text-foreground">Status</TableHead>
                          <TableHead className="font-semibold text-foreground">Type of Student</TableHead>
                          <TableHead className="font-semibold text-foreground">Date</TableHead>
                          <TableHead className="font-semibold text-foreground text-right w-[120px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingInquiries ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              Loading inquiries...
                            </TableCell>
                          </TableRow>
                        ) : inquiryError ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-red-500 py-12">
                              {inquiryError}
                            </TableCell>
                          </TableRow>
                        ) : filteredInquiries.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                              <div className="flex flex-col items-center gap-2">
                                <Users className="h-8 w-8 text-muted-foreground/50" />
                                <p className="text-sm">No inquiries found</p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredInquiries.map((inquiry) => (
                            <TableRow 
                              key={inquiry.id}
                              className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                            >
                              <TableCell className="font-medium py-4">{inquiry.adminName || "Unknown Admin"}</TableCell>
                              <TableCell className="font-medium py-4">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <p className="font-medium">{inquiry.name}</p>
                                    <p className="text-xs text-muted-foreground">{inquiry.date}</p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.email}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-sm">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {inquiry.phone}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                {(() => {
                                  const programs = parseProgramString(inquiry.program || "Not specified")
                                  const firstTwo = programs.slice(0, 2)
                                  const remaining = programs.slice(2)
                                  
                                  return (
                                    <div className="space-y-1">
                                      <div className="flex flex-wrap gap-1">
                                        {firstTwo.map((program, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                            {program.trim()}
                                          </Badge>
                                        ))}
                                      </div>
                                      {remaining.length > 0 && (
                                        <div className="flex flex-wrap gap-1 pt-1 border-t border-border/50">
                                          {remaining.map((program, index) => (
                                            <Badge key={index} variant="secondary" className="text-xs !border-0 focus-visible:!border-0">
                                              {program.trim()}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="py-4">
                                <div className="flex items-center gap-3">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="outline" size="icon" className="h-7 w-7">
                                        <ChevronDown className="h-4 w-4" />
                                        <span className="sr-only">Change status</span>
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start" className="w-48">
                                      {STATUS_OPTIONS.map((status) => (
                                        <DropdownMenuItem
                                          key={status}
                                          className="cursor-pointer text-sm"
                                          onClick={() => handleStatusChange(inquiry.id, status)}
                                        >
                                          {status}
                                        </DropdownMenuItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                  {inquiry.status.startsWith("Reserved") ? (
                                    <Badge className="bg-blue-500 text-white border-blue-500">{inquiry.status}</Badge>
                                  ) : inquiry.status.startsWith("Enrolled (Full down payment)") ? (
                                    <Badge className="bg-green-600 text-white border-green-600">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other STI" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : inquiry.status === "Enrolled to other school" ? (
                                    <Badge className="bg-red-500 text-white border-red-500">{inquiry.status}</Badge>
                                  ) : (
                                    <Badge variant={getStatusColor(inquiry.status) as any}>{inquiry.status}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="py-4">
                                <Badge variant="outline" className="text-xs">
                                  {inquiry.studentType}
                                </Badge>
                              </TableCell>
                              <TableCell className="py-4">
                                <span className="text-sm text-muted-foreground">{inquiry.date}</span>
                              </TableCell>
                              <TableCell className="py-4 text-right">
                                <div className="flex items-center justify-end gap-1 w-full">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={async () => {
                                      const { data } = await supabase.from("inquiries").select("*").eq("id", inquiry.id).single()
                                      if (data) {
                                        setViewingInquiryFull(data)
                                        setViewingInquiry(mapRowToInquiry(data))
                                      }
                                    }}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-primary/10 hover:text-primary"
                                    onClick={() => handleEditInquiry(inquiry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
                                    onClick={() => setDeletingInquiryId(inquiry.id)}
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
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog open={deletingInquiryId !== null} onOpenChange={(open) => !open && setDeletingInquiryId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Inquiry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this inquiry? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteInquiry}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    )
  }
