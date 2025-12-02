"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AdminSidebar } from "@/components/admin-sidebar"
import { DateRangePicker } from "@/components/date-range-picker"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { KpiCard } from "@/components/kpi"
import { Search, Eye, MessageSquare, Phone, Mail, Edit, CheckCircle, AlertCircle, ArrowRight, Plus, ChevronDown, GraduationCap, Users, School, Trash2, FileText, Maximize2, Minimize2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Checkbox } from "@/components/ui/checkbox"
import { supabase } from "@/lib/supabase-client"
import { EnrollmentForm } from "@/components/enrollment-form"
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

const STATUS_OPTIONS = ["For follow up", "Reserved (Registrants with 1000 payment)", "Enrolled (Full down payment)", "Enrolled to other STI", "Enroll to other school", "Undecided"]

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
}

const normalizeStudentType = (value?: string | null) => {
  if (!value) return "College"
  const normalized = value.toLowerCase()
  if (normalized.includes("senior")) return "Senior High"
  if (normalized.includes("high")) return "Senior High"
  return "College"
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
  }
  console.log("Mapped inquiry result:", result)
  return result
}


export default function InquiriesPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState("")
  const [studentTypeFilter, setStudentTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
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
  const today = new Date()
  const oneYearLater = new Date(today)
  oneYearLater.setFullYear(today.getFullYear() + 1)
  const [startDate, setStartDate] = useState<Date | undefined>(today)
  const [endDate, setEndDate] = useState<Date | undefined>(oneYearLater)

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
      setInquiryError("First name and last name are required.")
      return
    }
    
    if (!inquiryFormData.email.trim()) {
      setInquiryError("Email is required.")
      return
    }
    
    if (!inquiryFormData.phone.trim()) {
      setInquiryError("Phone number is required.")
      return
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
    
    const payload = {
      name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`.trim(),
      email: inquiryFormData.email,
      phone: inquiryFormData.phone,
      program: programDisplayNames.join(", ") || "Not specified",
      student_type: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
      status: existingInquiry.status || "For follow up", // Preserve existing status
      date: existingInquiry.date || new Date().toISOString().split("T")[0], // Preserve existing date
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
      if (error.code === "42501" || error.message?.includes("permission denied") || error.message?.includes("row-level security")) {
        setInquiryError(`Permission denied: ${error.message || "Row Level Security (RLS) policy is blocking this update. Please check your Supabase RLS policies for the inquiries table."}`)
      } else if (error.code === "23502") {
        setInquiryError(`Database constraint error: ${error.message || "A required field is missing."}`)
    } else {
        setInquiryError(`Error updating inquiry: ${error.message || JSON.stringify(error) || "Please try again."}`)
      }
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
    const result = matchesSearch && matchesStudentType && matchesStatus
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
      case "Enroll to other school":
        return "destructive"
      case "Undecided":
        return "outline"
      default:
        return "secondary"
    }
  }

  const resetForm = () => setInquiryFormData(INITIAL_FORM_DATA)

  const handleArrayChange = (field: "programs" | "howDidYouFindOut" | "referralSource", value: string, checked: boolean) => {
    setInquiryFormData(prev => ({
      ...prev,
      [field]: checked ? [...prev[field], value] : prev[field].filter(id => id !== value)
    }))
  }

  const handleSubmitInquiry = async () => {
    if (isCreatingInquiry) return
    
    // Validate required fields
    if (!inquiryFormData.firstName.trim() || !inquiryFormData.lastName.trim()) {
      setInquiryError("First name and last name are required.")
      return
    }
    
    if (!inquiryFormData.email.trim()) {
      setInquiryError("Email is required.")
      return
    }
    
    if (!inquiryFormData.phone.trim()) {
      setInquiryError("Phone number is required.")
      return
    }
    
    setIsCreatingInquiry(true)
    setInquiryError("")

    // Verify Supabase client is initialized
    if (!supabase) {
      setInquiryError("Supabase connection not available. Please check your environment variables.")
      setIsCreatingInquiry(false)
      return
    }

    try {
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
      
      const newInquiry = {
        name: `${inquiryFormData.firstName} ${inquiryFormData.lastName}`.trim(),
        email: inquiryFormData.email,
        phone: inquiryFormData.phone,
        program: programDisplayNames.join(", ") || "Not specified",
        student_type: inquiryFormData.studentType === "tertiary" ? "College" : "Senior High",
        present_school: inquiryFormData.presentSchool || null,
        inquiry_type: inquiryFormData.inquiryType || null,
        how_did_you_find_out: inquiryFormData.howDidYouFindOut.length > 0 ? inquiryFormData.howDidYouFindOut : [],
        referral_source: inquiryFormData.referralSource.length > 0 ? inquiryFormData.referralSource : [],
        events_description: inquiryFormData.eventsDescription || null,
        others_specify: inquiryFormData.othersSpecify || null,
        status: "For follow up",
        date: new Date().toISOString().split("T")[0], // Format as YYYY-MM-DD
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
      setInquiryError(`Error creating inquiry: ${errorMessage}`)
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

    setEnrollmentFormData({
      ...template,
      firstName,
      middleName,
      lastName,
      email: inquiry.email,
      mobileNumber: normalizedPhone,
      studentType: inquiry.studentType === "College" ? "college" : "senior-high",
      programs,
      program: programs.length === 0 ? inquiry.program : "",
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
    const programNames = mapProgramCodesToLabel(enrollmentFormData.programs, enrollmentFormData.program)
    const studentTypeLabel =
      enrollmentFormData.studentType === "college"
        ? "College"
        : enrollmentFormData.studentType === "senior-high"
          ? "Senior High"
          : ""

    const payload = {
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
    }

    const { error } = await supabase.from("enrollments").insert(payload)

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
        <AdminSidebar onLogout={handleLogout} />

        {/* Main Content - Account for fixed sidebar */}
        <main className="ml-64 p-6">
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <div>
            <h1 className="text-3xl font-serif font-bold text-slate-700 dark:text-slate-200 mb-2">Inquiries Management</h1>
            <p className="text-slate-600 dark:text-slate-400">Track and manage all program inquiries from prospective students</p>
              </div>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <KpiCard
              title="Total Inquiries"
              value={inquiries.length}
              change={`${monthChange} from last month`}
              icon={MessageSquare}
            />

            <KpiCard
              title="Total Inquiries Today"
              value={todayInquiriesCount}
              change={`${todayInquiriesCount} new today`}
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search inquiries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={studentTypeFilter} onValueChange={setStudentTypeFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by student type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Student Types</SelectItem>
                  <SelectItem value="college">College</SelectItem>
                  <SelectItem value="senior high">Senior High</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Status</SelectItem>
                  {STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
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
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
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
                              <TableCell className="font-medium py-4">Admin Name</TableCell>
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
                                <Badge variant="secondary" className="text-xs">
                                  {inquiry.program}
                                </Badge>
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
                                  ) : inquiry.status === "Enroll to other school" ? (
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
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
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
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
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
                              <TableCell className="font-medium py-4">Admin Name</TableCell>
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
                                <Badge variant="secondary" className="text-xs">
                                  {inquiry.program}
                                </Badge>
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
                                  ) : inquiry.status === "Enroll to other school" ? (
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
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
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
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
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
                              <TableCell className="font-medium py-4">Admin Name</TableCell>
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
                                <Badge variant="secondary" className="text-xs">
                                  {inquiry.program}
                                </Badge>
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
                                  ) : inquiry.status === "Enroll to other school" ? (
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
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
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
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
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
                              <TableCell className="font-medium py-4">Admin Name</TableCell>
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
                                <Badge variant="secondary" className="text-xs">
                                  {inquiry.program}
                                </Badge>
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
                                  ) : inquiry.status === "Enroll to other school" ? (
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
                                <div className="flex items-center justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
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
                                    className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
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
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingInquiryId ? "Edit Inquiry" : "Program Inquiry"}</DialogTitle>
              <DialogDescription>
                {editingInquiryId ? "Update the inquiry information" : "Tell us about your educational goals and interests"}
              </DialogDescription>
            </DialogHeader>
            
            {inquiryError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{inquiryError}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-6">
              {/* Type of Inquiry and Type of Student */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF INQUIRY</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="inquiry-online"
                        name="inquiryType"
                        value="online"
                        checked={inquiryFormData.inquiryType === "online"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                        className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <Label htmlFor="inquiry-online" className="text-sm">Online</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="inquiry-walk-in"
                        name="inquiryType"
                        value="walk-in"
                        checked={inquiryFormData.inquiryType === "walk-in"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, inquiryType: e.target.value }))}
                        className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <Label htmlFor="inquiry-walk-in" className="text-sm">Walk-in</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold text-foreground uppercase">TYPE OF STUDENT</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="inquiry-senior-high"
                        name="studentType"
                        value="senior-high"
                        checked={inquiryFormData.studentType === "senior-high"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                        className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <Label htmlFor="inquiry-senior-high" className="text-sm">Senior High School</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="inquiry-tertiary"
                        name="studentType"
                        value="tertiary"
                        checked={inquiryFormData.studentType === "tertiary"}
                        onChange={(e) => setInquiryFormData(prev => ({ ...prev, studentType: e.target.value }))}
                        className="w-4 h-4 border border-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                      <Label htmlFor="inquiry-tertiary" className="text-sm">Tertiary</Label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Section */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-foreground uppercase">PERSONAL INFORMATION</Label>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-firstName">First Name</Label>
                    <Input 
                      id="inquiry-firstName" 
                      placeholder="Enter your first name" 
                      value={inquiryFormData.firstName}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inquiry-lastName">Last Name</Label>
                    <Input 
                      id="inquiry-lastName" 
                      placeholder="Enter your last name" 
                      value={inquiryFormData.lastName}
                      onChange={(e) => setInquiryFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="inquiry-presentSchool">Present School</Label>
                  <Input 
                    id="inquiry-presentSchool" 
                    placeholder="Enter your current school" 
                    value={inquiryFormData.presentSchool}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, presentSchool: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry-email">Email Address</Label>
                  <Input 
                    id="inquiry-email" 
                    type="email" 
                    placeholder="Enter your email address" 
                    value={inquiryFormData.email}
                    onChange={(e) => setInquiryFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inquiry-phone">Phone Number</Label>
                  <Input 
                    id="inquiry-phone" 
                    type="tel" 
                    placeholder="Enter your phone number" 
                    value={inquiryFormData.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^\d*$/.test(value)) {
                        setInquiryFormData(prev => ({ ...prev, phone: value }));
                      }
                    }}
                    className="border border-gray-400 focus-visible:ring-orange-500 focus-visible:border-orange-500"
                  />
                </div>
              </div>

              {/* Programs of Interest */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-foreground uppercase">PROGRAMS OF INTEREST</Label>
                
                {inquiryFormData.studentType === "tertiary" && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">College Programs</h4>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="inquiry-bsit" 
                          checked={inquiryFormData.programs.includes('bsit')}
                          onCheckedChange={(checked) => handleArrayChange('programs', 'bsit', checked as boolean)}
                          className="border border-gray-400"
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
                          className="border border-gray-400"
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
                          className="border border-gray-400"
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
                          className="border border-gray-400"
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
                          className="border border-gray-400"
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
                          className="border border-gray-400"
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
                          className="border border-gray-400"
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
                          className="border border-gray-400"
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
              </div>

              {/* How Did You Find Out About STI Section */}
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-foreground uppercase">HOW DID YOU FIND OUT ABOUT STI?</Label>
                
                <div className="space-y-4">
                  {/* Main Options */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-tv" 
                        checked={inquiryFormData.howDidYouFindOut.includes('tv')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'tv', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-tv" className="text-sm">TV</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-outdoor" 
                        checked={inquiryFormData.howDidYouFindOut.includes('outdoor')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'outdoor', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-outdoor" className="text-sm">OUTDOOR (Billboard, Banners, Streamers)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-radio" 
                        checked={inquiryFormData.howDidYouFindOut.includes('radio')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'radio', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-radio" className="text-sm">RADIO</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-print" 
                        checked={inquiryFormData.howDidYouFindOut.includes('print')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'print', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-print" className="text-sm">PRINT (Newspaper)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-magazine" 
                        checked={inquiryFormData.howDidYouFindOut.includes('magazine')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'magazine', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-magazine" className="text-sm">MAGAZINE/FLYERS</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-career-orientation" 
                        checked={inquiryFormData.howDidYouFindOut.includes('career-orientation')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'career-orientation', checked as boolean)}
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-career-orientation" className="text-sm">CAREER ORIENTATION SEMINAR</Label>
                    </div>
                  </div>

                  {/* ONLINE Section */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="inquiry-online-find" 
                        checked={inquiryFormData.howDidYouFindOut.includes('online')}
                        onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'online', checked as boolean)}
                        className="border border-gray-400"
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
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-website" className="text-sm">Website</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-facebook" 
                            checked={inquiryFormData.howDidYouFindOut.includes('facebook')}
                            onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'facebook', checked as boolean)}
                            className="border border-gray-400"
                          />
                          <Label htmlFor="inquiry-facebook" className="text-sm">Facebook</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="inquiry-others-online" 
                            checked={inquiryFormData.howDidYouFindOut.includes('others-online')}
                            onCheckedChange={(checked) => handleArrayChange('howDidYouFindOut', 'others-online', checked as boolean)}
                            className="border border-gray-400"
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
                        className="border border-gray-400"
                      />
                      <Label htmlFor="inquiry-events" className="text-sm">EVENTS</Label>
                    </div>
                    
                    {inquiryFormData.howDidYouFindOut.includes('events') && (
                      <div className="ml-6">
                        <Input 
                          placeholder="Please describe the event" 
                          value={inquiryFormData.eventsDescription}
                          onChange={(e) => setInquiryFormData(prev => ({ ...prev, eventsDescription: e.target.value }))}
                          className="border border-gray-400"
                        />
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
                        className="border border-gray-400"
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
                              className="border border-gray-400"
                            />
                            <Label htmlFor="inquiry-sti-students" className="text-sm">STI Students</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-sti-alumni" 
                              checked={inquiryFormData.referralSource.includes('sti-alumni')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'sti-alumni', checked as boolean)}
                              className="border border-gray-400"
                            />
                            <Label htmlFor="inquiry-sti-alumni" className="text-sm">STI Alumni</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-friends" 
                              checked={inquiryFormData.referralSource.includes('friends')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'friends', checked as boolean)}
                              className="border border-gray-400"
                            />
                            <Label htmlFor="inquiry-friends" className="text-sm">Friends</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-parents" 
                              checked={inquiryFormData.referralSource.includes('parents')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'parents', checked as boolean)}
                              className="border border-gray-400"
                            />
                            <Label htmlFor="inquiry-parents" className="text-sm">Parents</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-relatives" 
                              checked={inquiryFormData.referralSource.includes('relatives')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'relatives', checked as boolean)}
                              className="border border-gray-400"
                            />
                            <Label htmlFor="inquiry-relatives" className="text-sm">Relatives</Label>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id="inquiry-others-referral" 
                              checked={inquiryFormData.referralSource.includes('others-referral')}
                              onCheckedChange={(checked) => handleArrayChange('referralSource', 'others-referral', checked as boolean)}
                              className="border border-gray-400"
                            />
                            <Label htmlFor="inquiry-others-referral" className="text-sm">Others: (Pls specify)</Label>
                          </div>
                        </div>
                        
                        {inquiryFormData.referralSource.includes('others-referral') && (
                          <div className="mt-2">
                            <Input 
                              placeholder="Please specify" 
                              value={inquiryFormData.othersSpecify}
                              onChange={(e) => setInquiryFormData(prev => ({ ...prev, othersSpecify: e.target.value }))}
                              className="border border-gray-400"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
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
                onClick={editingInquiryId ? handleUpdateInquiry : handleSubmitInquiry}
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
          <DialogContent className="!max-w-none !w-screen !h-screen !max-h-screen !top-0 !left-0 !translate-x-0 !translate-y-0 !rounded-none p-6 flex flex-col">
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
            <div className="flex items-center justify-between mb-6 mt-4">
              <div className="flex items-center gap-4">
                <div className="relative w-72">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inquiries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={studentTypeFilter} onValueChange={setStudentTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by student type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Student Types</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="senior high">Senior High</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Status</SelectItem>
                    {STATUS_OPTIONS.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => {
                  resetForm()
                  setEditingInquiryId(null)
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
                          <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
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
                              <TableCell className="font-medium py-4">Admin Name</TableCell>
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
                                <Badge variant="secondary" className="text-xs">
                                  {inquiry.program}
                                </Badge>
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
                                  ) : inquiry.status === "Enroll to other school" ? (
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
                              <TableCell className="py-4">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
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
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditInquiry(inquiry)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive hover:text-destructive"
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